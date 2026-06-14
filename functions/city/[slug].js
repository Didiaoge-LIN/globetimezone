/**
 * Cloudflare Pages Function — 城市页面动态渲染（无语言前缀）
 * Route: /city/:slug/
 * v3.0 — 安全加固：Slug校验/URL归一化/缓存策略/Stripe兼容/品牌化错误页
 */

import { CITIES } from './city-data.js';
import { renderCityPage } from './city-template.js';

const VALID_SLUGS = new Set(Object.keys(CITIES));

// ═══════ 常量配置 ═══════
const CONSTANTS = {
  SITE_URL: 'https://globetimezone.com',
  DEFAULT_SITE_NAME: 'GlobeTimeZone',
  HOT_CITIES: ['new-york', 'london', 'tokyo', 'beijing', 'sydney', 'dubai', 'moscow', 'los-angeles'],
  ALLOWED_QUERY_PARAMS: ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'lang'],
  EDGE_CACHE_AGE: 300, // 边缘缓存5分钟
  CACHE_MAX_AGE: 0,     // 浏览器零缓存
};

// ═══════ P0-2: 强化 Slug 校验（防路径遍历与编码绕过） ═══════
function isValidCitySlug(slug) {
  if (!slug || typeof slug !== 'string') return false;

  // URL解码后二次校验，防止编码绕过（如%2d、%2e）
  let decodedSlug;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch (e) {
    return false;
  }

  // 长度校验
  if (decodedSlug.length < 2 || decodedSlug.length > 64) return false;

  // 严格格式校验：字母数字开头结尾，中间仅允许单个连字符
  const validRegex = /^[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*$/;
  return validRegex.test(decodedSlug);
}

// ═══════ P1-2: 构建全量安全响应头（自适应Stripe场景） ═══════
function buildSecurityHeaders(config = {}) {
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
  };

  // 启用Stripe时，动态追加官方全量域名白名单
  if (config.ENABLE_STRIPE) {
    cspRules['script-src'] += ' https://js.stripe.com';
    cspRules['img-src'] += ' https://*.stripe.com';
    cspRules['connect-src'] += ' https://api.stripe.com https://m.stripe.com https://m.stripe.network';
    cspRules['frame-src'] = 'https://js.stripe.com https://hooks.stripe.com';
  }

  const cspString = Object.entries(cspRules)
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

  // 启用Stripe时，自动降级跨源隔离策略，放开支付权限
  if (config.ENABLE_STRIPE) {
    headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups';
    headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=(), payment=(self "https://js.stripe.com")';
  }

  return headers;
}

// ═══════ P0-1: 构建缓存头（安全优先版：浏览器零缓存+边缘短缓存） ═══════
function buildCacheHeaders() {
  if (CONSTANTS.CACHE_MAX_AGE === 0 && CONSTANTS.EDGE_CACHE_AGE === 0) {
    return {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };
  }

  return {
    'Cache-Control': [
      'public',
      'max-age=0',
      `s-maxage=${CONSTANTS.EDGE_CACHE_AGE}`,
      'stale-while-revalidate=3600',
      'stale-if-error=86400',
    ].join(', '),
  };
}

// ═══════ P1-1: 品牌化错误页（SEO合规+安全加固版） ═══════
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildErrorPage(status, message, { allow } = {}) {
  const safeMsg = escapeHtml(message);

  // 404专属热门城市推荐模块
  const hotCitiesBlock = status !== 404 ? '' : `
    <div class="hot-cities">
      <p class="hot-title">热门城市攻略</p>
      <div class="city-list">
        ${CONSTANTS.HOT_CITIES.map(c => `<a href="/city/${c}/">${c.replace(/-/g, ' ')}</a>`).join('')}
      </div>
    </div>`;

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
    .city-list{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center}
    .city-list a{padding:.375rem .875rem;background:#f1f5f9;border-radius:20px;font-size:.875rem;color:#334155}
    .city-list a:hover{background:#e2e8f0;color:#1e293b}
    a:focus-visible{outline:2px solid #2563eb;outline-offset:2px}
    @media (max-width:480px){.error-code{font-size:4rem}.error-card{padding:2rem 1.5rem}}
    @media (prefers-color-scheme:dark){
      body{background:#0f172a;color:#e2e8f0}
      .error-card{background:#1e293b;box-shadow:none}
      .error-msg{color:#94a3b8}
      .btn-secondary{background:#334155;color:#e2e8f0}
      .btn-secondary:hover{background:#475569}
      .hot-cities{border-color:#334155}
      .hot-title{color:#94a3b8}
      .city-list a{background:#334155;color:#e2e8f0}
      .city-list a:hover{background:#475569}
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
    ...buildSecurityHeaders({ ENABLE_STRIPE: false }),
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'X-Robots-Tag': 'noindex, nofollow',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  // 405状态补充Allow头
  if (status === 405 && allow) headers.Allow = allow;

  return new Response(html, { headers, status });
}

// ═══════ P1-3: 主入口函数（全链路URL归一化版） ═══════
export async function onRequest(context) {
  const { request } = context;
  const method = request.method.toUpperCase();

  // 1. 前置短路：非法方法直接返回
  if (method !== 'GET' && method !== 'HEAD') {
    return buildErrorPage(405, 'Method Not Allowed', { allow: 'GET, HEAD' });
  }

  // 2. URL安全解析
  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return buildErrorPage(400, 'Bad Request');
  }

  const pathname = url.pathname;

  // 3. 提取slug: /city/tokyo/ → tokyo, /city/tokyo → tokyo
  const parts = pathname.replace(/\/+$/, '').split('/');
  const rawCity = parts.length >= 3 ? parts[2] : '';

  // 4. P0-2: 前置短路：Slug合法性校验（防路径遍历/编码绕过）
  if (!isValidCitySlug(rawCity)) {
    return buildErrorPage(404, 'Page Not Found');
  }

  // 5. 验证slug是否在有效城市列表中
  const standardCity = rawCity.toLowerCase();
  if (!VALID_SLUGS.has(standardCity)) {
    return buildErrorPage(404, 'Page Not Found');
  }

  const city = CITIES[standardCity];
  if (!city) {
    return buildErrorPage(404, 'Page Not Found');
  }

  // 6. P1-3: URL全量归一化（3重校验：大小写 + 尾部斜杠 + 查询参数）
  const standardPath = `/city/${standardCity}/`;

  // 查询参数白名单过滤 + 字母序排序
  const filteredParams = new URLSearchParams();
  CONSTANTS.ALLOWED_QUERY_PARAMS
    .sort()
    .forEach(key => {
      if (url.searchParams.has(key)) {
        filteredParams.set(key, url.searchParams.get(key));
      }
    });
  const standardSearch = filteredParams.toString() ? `?${filteredParams.toString()}` : '';

  // 路径或参数不一致时，301永久跳转到标准URL
  if (url.pathname !== standardPath || url.search !== standardSearch) {
    return Response.redirect(`${CONSTANTS.SITE_URL}${standardPath}${standardSearch}`, 301);
  }

  // 7. 渲染页面
  try {
    const html = renderCityPage(standardCity, city, CITIES, 'zh');

    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      ...buildSecurityHeaders({ ENABLE_STRIPE: false }),
      ...buildCacheHeaders(),
      'Vary': 'Accept-Encoding',
    };

    // HEAD请求仅返回头，不传输正文
    if (method === 'HEAD') {
      return new Response(null, { status: 200, headers });
    }

    return new Response(html, { status: 200, headers });
  } catch (e) {
    console.error('City page render error for', standardCity, e.message);
    return buildErrorPage(500, 'Internal Server Error');
  }
}
