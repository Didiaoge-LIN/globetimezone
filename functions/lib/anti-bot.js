'use strict';

/**
 * 反爬虫 / 恶意流量防护模块 (精简版)
 * 三层防御：UA黑名单 → 行为特征 → 速率限制(KV)
 */

const UA_BLACKLIST = [
  'python-requests', 'python-urllib', 'scrapy/', 'httpclient', 'okhttp',
  'apache-httpclient', 'go-http-client', 'node-superagent', 'node-fetch/',
  'axios/', 'got/', 'undici', 'ahrefsbot', 'semrushbot', 'mj12bot',
  'dotbot', 'rushbot', 'domaincrawler', 'ccbot', 'chatgpt-user', 'gptbot',
  'googleother', 'bingpreview', 'nikto', 'sqlmap', 'nmap', 'masscan',
  'zgrab', 'nuclei', 'xenu link sleuth', 'linkcheck', 'wget', 'curl/',
  'libwww-perl', 'java/'
];

const SUSPICIOUS_PATHS = [
  /\.env$/, /\.git/, /\.svn/, /wp-admin/, /wp-login/, /phpmyadmin/,
  /\/admin\//, /graphql/, /actuator/
];

const LEGIT_UA = [
  'mozilla', 'chrome', 'safari', 'firefox', 'edge', 'opera',
  'msie', 'trident', 'samsungbrowser', 'miui',
  'googlebot', 'bingbot', 'baiduspider', 'yandexbot', 'applebot'
];

export const BOT_SIGNALS = Object.freeze({
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

  // Layer 1: UA 黑名单
  const uaLower = ua.toLowerCase();
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
