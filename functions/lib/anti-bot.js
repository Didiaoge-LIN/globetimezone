'use strict';

/**
 * 反爬虫 / 恶意流量防护模块
 * ============================
 * 三层防御体系：
 *   Layer 1 — User-Agent 黑名单（零开销，即时拦截已知爬虫）
 *   Layer 2 — 行为特征检测（可疑路径/方法/Header 组合）
 *   Layer 3 — 速率限制框架（基于 CF KV，可选）
 *
 * 用法：
 *   import { checkRequest, buildBlockResponse, BOT_SIGNALS } from './lib/anti-bot.js';
 *   const result = await checkRequest(request, env);
 *   if (result.blocked) return buildBlockResponse(result);
 */

// ============================================================
// Layer 1: User-Agent 黑名单（正则匹配）
// ============================================================

/**
 * 已知恶意/无用爬虫 UA 片段（小写匹配）
 * 覆盖：数据抓取工具、SEO垃圾工具、漏洞扫描器、廉价爬虫框架
 */
const UA_BLACKLIST = Object.freeze([
  // --- 数据抓取 / 爬虫框架 ---
  'python-requests',           // Python requests（无浏览器标识的脚本）
  'python-urllib',             // Python urllib
  'scrapy/',                   // Scrapy 框架
  'httpclient',                // Java HttpClient（常用于API滥用）
  'okhttp',                    // OkHttp（Android应用，但大量=刷量）
  'apache-httpclient',         // Apache HttpClient
  'go-http-client',            // Go HTTP 客户端
  'node-superagent',
  'node-fetch/',
  'axios/',                    // Axios 无浏览器标识
  'got/',                      // Got.js
  'undici',                    // Node.js 原生 fetch
  // --- 商业爬虫 ---
  'ahrefsbot',                 // Ahrefs SEO 爬虫
  'semrushbot',                // SEMrush
  'mj12bot',                   // Majestic SEO
  'dotbot',                    // Moz DotBot
  'rushbot',
  'domaincrawler',
  // --- 数据采集 / AI 训练 ---
  'ccbot',                     // CommonCrawl（吃带宽不贡献流量）
  'chatgpt-user',              // ChatGPT 爬取训练
  'gptbot',                    // OpenAI GPTBot
  'googleother',               // Google 非核心爬虫
  'bingpreview',               // Bing 预览（非搜索）
  // --- 漏洞扫描 / 攻击工具 ---
  'nikto',                     // Web 扫描器
  'sqlmap',                    // SQL 注入工具
  'nmap',                      // 端口扫描
  'masscan',
  'zgrab',                     // ZMap 抓取
  'nuclei',                    // 模板扫描
  // --- 垃圾引用 / 流量作弊 ---
  'xenu link sleuth',          // 死链检查（高频请求）
  'linkcheck',                 // 链接检查器
  'wget',                      // Wget（批量下载）
  'curl/',                     // curl（脚本化）
  // --- 其他 ---
  'libwww-perl',               // Perl LWP
  'java/',                     // 泛 Java（无具体UA）
]);

/** 编译后的黑名单正则数组（模块加载时一次性编译） */
const UA_BLACKLIST_RE = Object.freeze(
  UA_BLACKLIST.map(fragment => new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
);

// ============================================================
// Layer 2: 可疑行为特征
// ============================================================

/**
 * 可疑路径模式（爬虫常扫的路径）
 */
const SUSPICIOUS_PATHS = Object.freeze([
  /\.env$/,
  /\.git/,
  /\.svn/,
  /wp-admin/,
  /wp-login/,
  /phpmyadmin/,
  /admin/,
  /api\/v\d+/,                 // API 接口被滥用的前缀
  /graphql/,                   // GraphQL 探测
  /actuator/,                  // Spring Boot
  /.well-known\/securitytxt$/,  // 信息收集
]);

/** 正常访问应该有的 Header 白名单片段（缺少则可疑） */
const LEGIT_UA_FRAGMENTS = Object.freeze([
  'mozilla', 'chrome', 'safari', 'firefox', 'edge', 'opera',
  'msie', 'trident', 'samsungbrowser', 'miui',
  'googlebot', 'bingbot', 'baiduspider', 'yandexbot',  // 合法搜索引擎
]);

// ============================================================
// Layer 3: 速率限制配置
// ============================================================

const RATE_LIMIT = Object.freeze({
  /** 窗期时间（秒） */
  windowSeconds: 60,
  /** 窗期内最大请求数（超过此数触发） */
  maxRequests: 30,
  /** KV 存储键前缀 */
  kvPrefix: 'rl:',
});

// ============================================================
// 公共接口
// ============================================================

/**
 * 拦截信号枚举
 */
const BOT_SIGNALS = Object.freeze({
  UA_BLACKLISTED:     'ua_blacklisted',
  SUSPICIOUS_PATH:    'suspicious_path',
  MISSING_BROWSER:    'missing_browser_headers',
  RATE_LIMITED:       'rate_limited',
  CLEAN:              'clean',
});

/**
 * 检查单个请求是否为恶意/机器人流量
 * @param {Request} request - CF Pages Request 对象
 * @param {object} env - CF Pages 环境变量（含 KV 绑定）
 * @returns {Promise<{blocked:boolean, signal:string, reason:string}>}
 */
export async function checkRequest(request, env) {
  const url = new URL(request.url);
  const ua = request.headers.get('User-Agent') || '';
  const ip = request.headers.get('CF-Connecting-IP') || '';

  // --- Layer 1: UA 黑名单 ---
  for (const re of UA_BLACKLIST_RE) {
    if (re.test(ua)) {
      return {
        blocked: true,
        signal: BOT_SIGNALS.UA_BLACKLISTED,
        reason: `Blocked UA pattern: ${extractUAPattern(ua)}`,
      };
    }
  }

  // --- Layer 1.5: 空 UA 或 非 UA 拦截 ---
  if (!ua || ua.length < 10) {
    return {
      blocked: true,
      signal: BOT_SIGNALS.MISSING_BROWSER,
      reason: 'Empty or invalid User-Agent',
    };
  }

  // --- Layer 2: 可疑路径检测 ---
  const pathname = url.pathname;
  for (const re of SUSPICIOUS_PATHS) {
    if (re.test(pathname)) {
      // 允许合法的 /api/v1/ （我们自己的API）
      if (/^\/api\/v\d+\//.test(pathname)) continue;
      return {
        blocked: true,
        signal: BOT_SIGNALS.SUSPICIOUS_PATH,
        reason: `Suspicious path: ${pathname}`,
      };
    }
  }

  // --- Layer 2.5: 缺少正常浏览器标识 ---
  // 如果 UA 不包含任何合法浏览器/搜索引擎标识，且不是 GET 静态资源
  const hasLegitFragment = LEGIT_UA_FRAGMENTS.some(frag => ua.toLowerCase().includes(frag));
  if (!hasLegitFragment && !isStaticAssetRequest(url.pathname)) {
    // 二次确认：完全不含 mozilla/浏览器标识 → 高概率是伪造UA的爬虫
    if (!/\b(mozilla|webkit|gecko)\b/i.test(ua)) {
      return {
        blocked: true,
        signal: BOT_SIGNALS.MISSING_BROWSER,
        reason: `Non-browser UA: ${ua.substring(0, 80)}`,
      };
    }
  }

  // --- Layer 3: KV 速率限制（可选，依赖 AD_KV 绑定） ---
  if (env?.AD_KV && ip) {
    const rateResult = await checkRateLimit(env.AD_KV, ip);
    if (rateResult.limited) {
      return {
        blocked: true,
        signal: BOT_SIGNALS.RATE_LIMITED,
        reason: `Rate limited: ${rateResult.count} req/${RATE_LIMIT.windowSeconds}s`,
      };
    }
  }

  return { blocked: false, signal:BOT_SIGNALS.CLEAN, reason:'OK' };
}

/**
 * 构建拦截响应（统一格式）
 * @param {{signal:string, reason:string}} result - checkRequest 返回的被拦截结果
 * @param {number} status - HTTP状态码（默认429）
 * @returns {Response}
 */
export function buildBlockResponse(result, status = 429) {
  const body = JSON.stringify({
    error: 'Too Many Requests',
    signal: result.signal,
    message: result.reason,
    retry_after: '60',
  });

  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Retry-After': '60',
      'X-Bot-Signal': result.signal,
      'X-Bot-Reason': encodeURIComponent(result.reason.substring(0, 200)),
      'Cache-Control': 'no-store, private',
    },
  });
}

/**
 * 构建验证码挑战页面响应（HTML）
 * 用于对可疑但不确定的请求返回人机验证
 * @returns {Response}
 */
export function buildChallengeResponse() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Security Check</title>
<style>
body{display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
.card{background:#fff;border-radius:12px;padding:40px;text-align:center;max-width:400px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
h1{font-size:18px;color:#333;margin:0 0 8px}
p{font-size:14px;color:#666;margin:0 0 24px;line-height:1.6}
.btn{display:inline-block;padding:12px 32px;background:#165DFF;color:#fff;border-radius:8px;text-decoration:none;font-weight:500;font-size:14px;transition:opacity .2s}
.btn:hover{opacity:.85}
.icon{font-size:48px;margin-bottom:16px}
</style>
</head>
<body>
<div class="card">
<div class="icon">&#128274;</div>
<h1>Security Check</h1>
<p>We're verifying you're not a robot.<br>This page will refresh automatically.</p>
<a href="javascript:location.reload()" class="btn">Continue to GlobeTimeZone</a>
</div>
<script>setTimeout(()=>location.reload(),3000)</script>
</body>
</html>`;

  return new Response(html, {
    status: 403,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
      'Cache-Control': 'no-store, private',
    },
  });
}

/**
 * 导出统计用常量（供日志/监控使用）
 */
export const ANTI_BOT_CONFIG = Object.freeze({
  uaBlacklistCount: UA_BLACKLIST.length,
  suspiciousPathCount: SUSPICIOUS_PATHS.length,
  rateLimit: RATE_LIMIT,
  botSignals: BOT_SIGNALS,
});

// ============================================================
// 内部函数
// ============================================================

/**
 * 提取被匹配到的 UA 特征片段（脱敏后记录）
 */
function extractUAPattern(ua) {
  for (const fragment of UA_BLACKLIST) {
    if (ua.toLowerCase().includes(fragment.toLowerCase())) {
      return fragment;
    }
  }
  return 'unknown';
}

/**
 * 判断是否为静态资源请求
 */
function isStaticAssetRequest(pathname) {
  return /\.(css|js|png|jpe?g|svg|gif|ico|woff2?|ttf|eot|webp|avif)(\?.*)?$/i.test(pathname);
}

/**
 * 基于 KV 的滑动窗口速率限制
 * @param {import('@cloudflare/workers-types').KV} kvStore - CF KV namespace
 * @param {string} ip - 客户端IP
 * @returns {Promise<{limited:boolean, count:number}>}
 */
async function checkRateLimit(kvStore, ip) {
  const key = `${RATE_LIMIT.kvPrefix}${ip}`;
  const now = Date.now();
  const windowMs = RATE_LIMIT.windowSeconds * 1000;

  try {
    const stored = await kvStore.get(key, 'json');
    if (!stored) {
      // 首次请求，初始化窗口
      await kvStore.put(key, JSON.stringify({ count: 1, windowStart: now }), {
        expirationTtl: RATE_LIMIT.windowSeconds + 10,
      });
      return { limited: false, count: 1 };
    }

    const { count, windowStart } = stored;

    // 窗口是否过期？
    if (now - windowStart > windowMs) {
      // 新窗口
      await kvStore.put(key, JSON.stringify({ count: 1, windowStart: now }), {
        expirationTtl: RATE_LIMIT.windowSeconds + 10,
      });
      return { limited: false, count: 1 };
    }

    // 窗口内，递增计数
    const newCount = count + 1;
    if (newCount > RATE_LIMIT.maxRequests) {
      // 不更新KV，直接拒绝
      return { limited: true, count: newCount };
    }

    // 更新计数
    await kvStore.put(key, JSON.stringify({ count: newCount, windowStart }), {
      expirationTtl: RATE_LIMIT.windowSeconds + 10,
    });
    return { limited: false, count: newCount };

  } catch (e) {
    // KV 异常时放行（降级策略：宁可放过不可误杀）
    console.warn('[anti-bot] KV rate limit error:', e.message);
    return { limited: false, count: -1 };
  }
}
