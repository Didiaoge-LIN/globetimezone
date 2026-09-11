'use strict';

/**
 * 反爬虫 / 恶意流量防护模块
 * 三层防御：UA 白名单放行 → UA 黑名单 → 行为特征 → 速率限制(KV)
 *
 * 2026-09-11 更新（站点流量分析驱动）：
 *   实测 7 天 9.07 万次请求中，HeadlessChrome 占 45.3%，
 *   且把首页 25 个静态依赖逐个精确刷约 1,600 次。
 *   而原规则因 LEGIT_UA 含 'chrome' 使其全部放行 —— 本次补齐拦截，
 *   同时把自有监控（SentryUptimeBot）等合法机器人显式放行，
 *   避免误伤。
 *
 * ⚠️ CF Pages 构建兼容约束：
 *   - 不使用预编译 new RegExp / 复杂模板字符串
 *   - UA 规则统一用普通字符串数组 + includes 匹配
 */

// ---------------------------------------------------------------------------
// 白名单：合法机器人（必须最先判定，避免被后续规则误杀）
//   - 搜索引擎：SEO 命脉，绝不拦截
//   - 可用性监控：DIAO 自建的 SentryUptimeBot 等，拦截会导致监控误报站点宕机
// ---------------------------------------------------------------------------
const ALLOWED_BOT_UA = [
  // 搜索引擎
  'googlebot', 'bingbot', 'baiduspider', 'yandexbot', 'duckduckbot',
  'applebot', 'sogou', 'so.com', 'sm.cn', 'exabot', 'slurp',
  // 搜索/AI 索引型爬虫（已在本站正常抓取内容页，放行以维持外链数据）
  'amzn-searchbot', 'ahrefsbot', 'exasearchbot',
  // 可用性监控
  'sentryuptimebot', 'uptimerobot', 'pingdom', 'statuscake',
  'betteruptime', 'hetrixtools', 'freshping', 'uptime-kuma',
  'site24x7', 'checkly', 'hyperping', 'webpagetest', 'monitis',
  'nodeping', 'pagemonitor', 'internetseer'
];

// ---------------------------------------------------------------------------
// 黑名单：爬虫框架 / 无头浏览器 / 协议探测器
// ---------------------------------------------------------------------------
const UA_BLACKLIST = [
  // HTTP 客户端 / 脚本
  'python-requests', 'python-urllib', 'scrapy/', 'httpclient', 'okhttp',
  'apache-httpclient', 'go-http-client', 'node-superagent', 'node-fetch/',
  'axios/', 'got/', 'undici', 'libwww-perl', 'java/', 'wget', 'curl/',
  // SEO 工具 / 内容抓取器
  'mj12bot', 'dotbot', 'rushbot', 'domaincrawler', 'ccbot', 'semrushbot',
  'chatgpt-user', 'gptbot', 'googleother', 'bingpreview', 'bytespider',
  'petalbot', 'dataforseo', 'serpstat', 'blexbot', 'megaindex',
  // 无头浏览器 / 自动化（2026-09-11 新增，最大流量来源）
  'headlesschrome', 'headless chromium', 'headless firefox',
  'phantomjs', 'puppeteer', 'playwright', 'selenium', 'electron/',
  'splash/', 'htmlunit', 'jsdom',
  // 性能审计工具
  'lighthouse', 'chrome-lighthouse', 'pagespeed', 'gtmetrix',
  // 协议探测 / 扫描器
  'nginx-ssl', 'early hints', 'nikto', 'sqlmap', 'nmap', 'masscan',
  'zgrab', 'nuclei', 'xenu link sleuth', 'linkcheck', 'gobuster',
  'dirbuster', 'wpscan', 'acunetix', 'nessus'
];

const SUSPICIOUS_PATHS = [
  /\.env$/, /\.git/, /\.svn/, /wp-admin/, /wp-login/, /phpmyadmin/,
  /\/admin\//, /graphql/, /actuator/, /\.php$/, /\.sql$/, /\.bak$/
];

const LEGIT_UA = [
  'mozilla', 'chrome', 'safari', 'firefox', 'edge', 'opera',
  'msie', 'trident', 'samsungbrowser', 'miui',
  'googlebot', 'bingbot', 'baiduspider', 'yandexbot', 'applebot'
];

export const BOT_SIGNALS = Object.freeze({
  ALLOWED_BOT: 'allowed_bot',
  UA_BLACKLISTED: 'ua_blacklisted',
  SUSPICIOUS_PATH: 'suspicious_path',
  MISSING_BROWSER: 'missing_browser_headers',
  RATE_LIMITED: 'rate_limited',
  CLEAN: 'clean'
});

const RATE_LIMIT = { windowSeconds: 60, maxRequests: 30, kvPrefix: 'rl:' };

export async function checkRequest(request, env) {
  const url = new URL(request.url);
  const ua = request.headers.get('User-Agent') || '';
  const uaLower = ua.toLowerCase();

  // ---------------------------------------------------------------------
  // Layer 0: 白名单放行（搜索引擎 + 可用性监控）
  // 必须先于黑名单判定：监控 UA 往往不含浏览器标识，
  // 若被 Layer 2.5 拦掉会让自有监控误报站点宕机。
  // ---------------------------------------------------------------------
  for (let i = 0; i < ALLOWED_BOT_UA.length; i++) {
    if (uaLower.includes(ALLOWED_BOT_UA[i])) {
      return { blocked: false, signal: BOT_SIGNALS.ALLOWED_BOT, reason: 'Allowed bot: ' + ALLOWED_BOT_UA[i] };
    }
  }

  // Layer 1: UA 黑名单
  for (let i = 0; i < UA_BLACKLIST.length; i++) {
    if (uaLower.includes(UA_BLACKLIST[i])) {
      return { blocked: true, signal: BOT_SIGNALS.UA_BLACKLISTED, reason: 'Blocked UA: ' + UA_BLACKLIST[i] };
    }
  }

  // Layer 1.5: 空 UA
  if (!ua || ua.length < 10) {
    return { blocked: true, signal: BOT_SIGNALS.MISSING_BROWSER, reason: 'Empty UA' };
  }

  // Layer 2: 可疑路径
  const path = url.pathname;
  for (let i = 0; i < SUSPICIOUS_PATHS.length; i++) {
    if (SUSPICIOUS_PATHS[i].test(path)) {
      return { blocked: true, signal: BOT_SIGNALS.SUSPICIOUS_PATH, reason: 'Suspicious: ' + path };
    }
  }

  // Layer 2.5: 缺少浏览器标识
  let hasLegit = false;
  for (let i = 0; i < LEGIT_UA.length; i++) {
    if (uaLower.includes(LEGIT_UA[i])) { hasLegit = true; break; }
  }
  if (!hasLegit && !/\b(mozilla|webkit|gecko)\b/i.test(ua)) {
    return { blocked: true, signal: BOT_SIGNALS.MISSING_BROWSER, reason: 'Non-browser UA' };
  }

  // Layer 3: KV 速率限制（可选）
  if (env && env.AD_KV) {
    try {
      const ip = request.headers.get('CF-Connecting-IP') || '';
      if (ip) {
        const result = await checkRateLimit(env.AD_KV, ip);
        if (result.limited) {
          return { blocked: true, signal: BOT_SIGNALS.RATE_LIMITED, reason: 'Rate limited: ' + result.count };
        }
      }
    } catch (e) {
      // KV 异常时放行
    }
  }

  return { blocked: false, signal: BOT_SIGNALS.CLEAN, reason: 'OK' };
}

export function buildBlockResponse(result, status) {
  const s = status || 429;
  return new Response(JSON.stringify({
    error: 'Too Many Requests',
    signal: result.signal,
    message: result.reason,
    retry_after: '60'
  }), {
    status: s,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Retry-After': '60',
      'X-Bot-Signal': result.signal,
      'Cache-Control': 'no-store, private'
    }
  });
}

export function buildChallengeResponse() {
  const html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Security Check</title><style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;font-family:sans-serif}.card{background:#fff;border-radius:12px;padding:40px;text-align:center;max-width:400px;box-shadow:0 2px 12px rgba(0,0,0,.08)}h1{font-size:18px;color:#333;margin:0 0 8px}p{font-size:14px;color:#666;margin:0 0 24px}.btn{display:inline-block;padding:12px 32px;background:#165DFF;color:#fff;border-radius:8px;text-decoration:none;font-weight:500}</style></head><body><div class="card"><h1>Security Check</h1><p>Verifying you are not a robot.<br>This page will refresh automatically.</p><a href="javascript:location.reload()" class="btn">Continue</a></div><script>setTimeout(function(){location.reload()},3000)</script></body></html>';
  return new Response(html, {
    status: 403,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store, private'
    }
  });
}

export const ANTI_BOT_CONFIG = Object.freeze({
  allowedBotCount: ALLOWED_BOT_UA.length,
  uaBlacklistCount: UA_BLACKLIST.length,
  suspiciousPathCount: SUSPICIOUS_PATHS.length,
  rateLimit: RATE_LIMIT,
  botSignals: BOT_SIGNALS
});

async function checkRateLimit(kvStore, ip) {
  const key = RATE_LIMIT.kvPrefix + ip;
  const now = Date.now();
  const windowMs = RATE_LIMIT.windowSeconds * 1000;

  try {
    const stored = await kvStore.get(key, 'json');
    if (!stored) {
      await kvStore.put(key, JSON.stringify({ count: 1, windowStart: now }), { expirationTtl: RATE_LIMIT.windowSeconds + 10 });
      return { limited: false, count: 1 };
    }

    const count = stored.count;
    const windowStart = stored.windowStart;

    if (now - windowStart > windowMs) {
      await kvStore.put(key, JSON.stringify({ count: 1, windowStart: now }), { expirationTtl: RATE_LIMIT.windowSeconds + 10 });
      return { limited: false, count: 1 };
    }

    const newCount = count + 1;
    if (newCount > RATE_LIMIT.maxRequests) {
      return { limited: true, count: newCount };
    }

    await kvStore.put(key, JSON.stringify({ count: newCount, windowStart: windowStart }), { expirationTtl: RATE_LIMIT.windowSeconds + 10 });
    return { limited: false, count: newCount };
  } catch (e) {
    return { limited: false, count: -1 };
  }
}
