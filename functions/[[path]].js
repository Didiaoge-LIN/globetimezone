/**
 * ============================================================
 * Cloudflare Pages Functions — catch-all middleware
 * File: functions/[[path]].js
 * v8.0 — 生产终审版
 * 合规：OWASP Top 10 / CSP Level 3 / RFC 7231 / WCAG 2.1 AA
 * 架构：配置层 → 工具层 → 安全头层 → 错误页工厂 → 请求处理
 *
 * 作用：
 *   1. 拦截 /<lang>/city/:slug/ 请求，直接渲染城市页面（返回200）
 *      防止 _redirects 重写后被 CF Pages Clean URLs 308 丢掉语言前缀
 *   2. 拦截 /<lang>/<page>.html 请求，301 重定向到 /<lang>/<page>
 *      防止 CF Pages Clean URLs 的 308 重定向丢掉语言前缀
 * ============================================================
 */

import { CITIES } from './city/city-data.js';
import { renderCityPage } from './city/city-template.js';

const LANGS = ['en', 'zh', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'];
const LANG_SET = new Set(LANGS);
const VALID_SLUGS = new Set(Object.keys(CITIES));

const LANG_HTML_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/(.+)\.html$/;
const LANG_CITY_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/city\/([a-zA-Z0-9%-]+)\/?$/;

/* ========== 1. 配置层 ========== */
const CONSTANTS = Object.freeze({
  MAX_SLUG_LENGTH: 64,
  MIN_SLUG_LENGTH: 2,
  SLUG_REGEX: /^[a-z0-9]+(-[a-z0-9]+)*$/,
  SITE_URL: 'https://globetimezone.com',
  DEFAULT_SITE_NAME: 'GlobeTimeZone',
  HOT_CITIES: Object.freeze(['new-york', 'london', 'tokyo', 'beijing', 'sydney', 'dubai', 'moscow', 'los-angeles']),
  ALLOWED_QUERY_PARAMS: Object.freeze(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'lang']),
  EDGE_CACHE_SECONDS: 300,
  CSP_NONCE_BYTES: 16,
});

/* ========== 2. 工具层 ========== */

function initConfig(env, hostname) {
  const rawEnv = env || Object.create(null);
  const isPreview = hostname && hostname.includes('pages.dev');

  const config = Object.create(null);

  const rawGaId = rawEnv.GA_MEASUREMENT_ID || '';
  config.DISABLE_GA = rawEnv.DISABLE_GA === 'true' || isPreview || !rawGaId || rawGaId === 'G-XXXXXXXXXX';
  config.GA_ID = config.DISABLE_GA ? '' : rawGaId;

  config.ENABLE_STRIPE = rawEnv.ENABLE_STRIPE === 'true' && !!rawEnv.STRIPE_PUBLISHABLE_KEY;
  config.STRIPE_PUBLISHABLE_KEY = config.ENABLE_STRIPE ? rawEnv.STRIPE_PUBLISHABLE_KEY : '';

  const duplicateRaw = rawEnv.DUPLICATE_HEADERS || '';
  config.DUPLICATE_HEADERS = duplicateRaw
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(h => h.length > 0);

  if (config.DUPLICATE_HEADERS.includes('auto')) {
    const autoHeaders = [
      'strict-transport-security', 'x-frame-options', 'x-content-type-options',
      'x-xss-protection', 'referrer-policy', 'permissions-policy',
      'cross-origin-opener-policy', 'cross-origin-resource-policy', 'origin-agent-cluster'
    ];
    config.DUPLICATE_HEADERS = [...new Set([...config.DUPLICATE_HEADERS, ...autoHeaders])];
  }

  config.CACHE_MAX_AGE = 0;
  config.EDGE_CACHE_AGE = isPreview ? 0 : CONSTANTS.EDGE_CACHE_SECONDS;

  return Object.freeze(config);
}

function isValidSlug(slug) {
  if (typeof slug !== 'string' || !slug) return false;
  if (slug.length < CONSTANTS.MIN_SLUG_LENGTH || slug.length > CONSTANTS.MAX_SLUG_LENGTH) return false;

  let decoded;
  try {
    decoded = decodeURIComponent(slug);
  } catch (e) {
    return false;
  }
  if (decoded.length > CONSTANTS.MAX_SLUG_LENGTH) return false;

  return CONSTANTS.SLUG_REGEX.test(decoded.toLowerCase());
}

function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#96;')
    .replace(/\//g, '&#x2F;');
}

function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/<\/script/gi, '\\x3C/script')
    .replace(/<!--/g, '\\x3C!--');
}

function minifyHtml(html) {
  return html
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

async function generateEtag(content) {
  try {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(content));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `"${hashHex}"`;
  } catch (e) {
    return `W/"${content.length}"`;
  }
}

function normalizeQueryParams(searchParams) {
  const filtered = new URLSearchParams();
  [...CONSTANTS.ALLOWED_QUERY_PARAMS]
    .sort()
    .forEach(key => {
      if (searchParams.has(key)) {
        filtered.set(key, searchParams.get(key));
      }
    });
  const str = filtered.toString();
  return str ? `?${str}` : '';
}

/* ========== 3. 安全头层 ========== */

function buildSecurityHeaders(config) {
  const cspRules = {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://js.sentry-cdn.com",
    'style-src': "'self' 'unsafe-inline'",
    'img-src': "'self' data: https:",
    'connect-src': "'self' https://www.google-analytics.com https://*.sentry.io https://*.firebaseio.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com",
    'font-src': "'self'",
    'frame-src': "'none'",
    'frame-ancestors': "'none'",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'worker-src': "'self' blob:",
    'upgrade-insecure-requests': '',
  };

  if (config.ENABLE_STRIPE) {
    cspRules['script-src'] += ' https://js.stripe.com';
    cspRules['img-src'] += ' https://*.stripe.com';
    cspRules['connect-src'] += ' https://api.stripe.com https://m.stripe.com https://m.stripe.network';
    cspRules['frame-src'] = 'https://js.stripe.com https://hooks.stripe.com';
  }

  const cspString = Object.entries(cspRules)
    .filter(([, v]) => v !== '')
    .map(([key, value]) => `${key} ${value}`)
    .join('; ');

  const headers = {
    'Content-Security-Policy': cspString,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '0',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Origin-Agent-Cluster': '?1',
  };

  if (config.ENABLE_STRIPE) {
    headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups';
    headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=(), payment=(self "https://js.stripe.com")';
  }

  const duplicateSet = new Set(config.DUPLICATE_HEADERS || []);
  Object.keys(headers).forEach(key => {
    if (duplicateSet.has(key.toLowerCase())) {
      delete headers[key];
    }
  });

  return headers;
}

function buildCacheHeaders(config) {
  if (config.CACHE_MAX_AGE === 0 && config.EDGE_CACHE_AGE === 0) {
    return {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  return {
    'Cache-Control': [
      'public',
      `max-age=${config.CACHE_MAX_AGE}`,
      `s-maxage=${config.EDGE_CACHE_AGE}`,
      'stale-while-revalidate=3600',
      'stale-if-error=86400',
    ].join(', '),
  };
}

/* ========== 4. 错误页工厂 ========== */

function buildErrorPage(status, message, options = {}) {
  const { allow, env } = options;
  const safeMsg = escapeHtml(message);
  const hostname = typeof options.hostname === 'string' ? options.hostname : '';
  const config = initConfig(env, hostname);

  const hotCitiesBlock = status === 404 ? `
<div class="hot-cities">
  <p class="hot-title">热门城市时间</p>
  <div class="city-grid">
    ${CONSTANTS.HOT_CITIES.map(c => `<a href="/city/${c}/">${c.replace(/-/g, ' ')}</a>`).join('')}
  </div>
</div>` : '';

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#2563eb">
<title>${status} - ${safeMsg}</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;justify-content:center;align-items:center;background:#f8fafc;color:#1f2937;padding:1rem;-webkit-font-smoothing:antialiased}
.error-card{background:#fff;padding:3rem 2.5rem;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.06);text-align:center;max-width:480px;width:100%}
.error-code{font-size:5rem;font-weight:800;color:#ef4444;line-height:1;margin-bottom:1rem}
.error-msg{color:#6b7280;margin-bottom:2rem;font-size:1rem;line-height:1.5}
.btn-group{display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap;margin-bottom:2rem}
.btn{display:inline-block;padding:.625rem 1.5rem;border-radius:6px;font-weight:500;transition:background .2s}
.btn-primary{background:#2563eb;color:#fff}
.btn-primary:hover{background:#1d4ed8;color:#fff}
.btn-secondary{background:#f1f5f9;color:#334155}
.btn-secondary:hover{background:#e2e8f0;color:#1e293b}
.hot-cities{border-top:1px solid #e2e8f0;padding-top:1.5rem}
.hot-title{color:#4b5563;margin-bottom:1rem;font-size:.875rem}
.city-grid{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center}
.city-grid a{padding:.375rem .875rem;background:#f8fafc;border-radius:20px;font-size:.875rem;color:#334155}
.city-grid a:hover{background:#e2e8f0;color:#1e293b}
a:focus-visible{outline:2px solid #2563eb;outline-offset:2px;border-radius:2px}
@media (max-width:480px){.error-code{font-size:4rem}.error-card{padding:2rem 1.5rem}}
@media (prefers-color-scheme:dark){
body{background:#0f172a;color:#e2e8f0}
.error-card{background:#1e293b;box-shadow:none}
.error-msg{color:#cbd5e1}
.btn-secondary{background:#334155;color:#e2e8f0}
.btn-secondary:hover{background:#475569}
.hot-cities{border-color:#334155}
.hot-title{color:#cbd5e1}
.city-grid a{background:#334155;color:#e2e8f0}
.city-grid a:hover{background:#475569}
}
</style>
</head>
<body>
<div class="error-card">
  <div class="error-code">${status}</div>
  <p class="error-msg">${safeMsg}</p>
  <div class="btn-group">
    <a href="/" class="btn btn-primary">返回首页</a>
    <a href="/city/" class="btn btn-secondary">浏览全部城市</a>
  </div>
  ${hotCitiesBlock}
</div>
</body>
</html>`;

  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    ...buildSecurityHeaders(config),
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Robots-Tag': 'noindex, nofollow',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (status === 405 && allow) {
    headers.Allow = allow;
  }

  return new Response(html, { headers, status });
}

/* ========== 5. 主入口 ========== */

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // ═══════ 1. 语言版城市页面：/<lang>/city/:slug/ → 直接渲染200 ═══════
  const cityMatch = pathname.match(LANG_CITY_REGEX);
  if (cityMatch) {
    const lang = cityMatch[1];
    const rawCity = cityMatch[2];

    // Slug 校验
    if (!isValidSlug(rawCity)) {
      return buildErrorPage(404, 'Page Not Found', { env, hostname: url.hostname });
    }

    const standardCity = rawCity.toLowerCase();

    if (VALID_SLUGS.has(standardCity)) {
      const city = CITIES[standardCity];
      if (city) {
        // HEAD/GET only
        if (method !== 'GET' && method !== 'HEAD') {
          return buildErrorPage(405, 'Method Not Allowed', { allow: 'GET, HEAD', env, hostname: url.hostname });
        }

        // 初始化配置
        const config = initConfig(env, url.hostname);

        // URL归一化（大小写 + 尾部斜杠 + 查询参数）
        const standardPath = `/${lang}/city/${standardCity}/`;
        const standardSearch = normalizeQueryParams(url.searchParams);

        if (url.pathname !== standardPath || url.search !== standardSearch) {
          return Response.redirect(`${CONSTANTS.SITE_URL}${standardPath}${standardSearch}`, 301);
        }

        try {
          const rawHtml = renderCityPage(standardCity, city, CITIES, lang, config);
          const html = minifyHtml(rawHtml);

          // ETag 协商缓存
          const etag = await generateEtag(html);
          const ifNoneMatch = request.headers.get('If-None-Match');
          if (ifNoneMatch === etag) {
            return new Response(null, {
              status: 304,
              headers: {
                ETag: etag,
                ...buildSecurityHeaders(config),
              },
            });
          }

          const headers = {
            'Content-Type': 'text/html; charset=utf-8',
            ETag: etag,
            ...buildSecurityHeaders(config),
            ...buildCacheHeaders(config),
            Vary: 'Accept-Encoding',
          };

          // HEAD 请求仅返回头
          if (method === 'HEAD') {
            return new Response(null, { status: 200, headers });
          }

          return new Response(html, { status: 200, headers });
        } catch (error) {
          console.error(`[LangCity Error] city=${standardCity}, lang=${lang}, msg=${error.message}`);
          return buildErrorPage(500, 'Internal Server Error', { env, hostname: url.hostname });
        }
      }
    }
    // slug 不合法 → 404
    return buildErrorPage(404, 'Page Not Found', { env, hostname: url.hostname });
  }

  // ═══════ 2. 带语言前缀的 .html 请求 → 301 重定向 ═══════
  const htmlMatch = pathname.match(LANG_HTML_REGEX);
  if (htmlMatch) {
    const lang = htmlMatch[1];
    const pathWithoutExt = htmlMatch[2];

    if (pathWithoutExt === 'index') {
      url.pathname = `/${lang}/`;
    } else {
      url.pathname = `/${lang}/${pathWithoutExt}`;
    }

    return Response.redirect(url.toString(), 301);
  }

  // ═══════ 3. 其他请求 → 交给 _redirects / 静态文件服务 ═══════
  return next();
}
