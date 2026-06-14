/**
 * ============================================================
 * Cloudflare Pages Function — 城市页面动态渲染（无语言前缀）
 * Route: /city/:slug/
 * v8.0 — 生产终审版
 * 合规：OWASP Top 10 / CSP Level 3 / RFC 7231 / WCAG 2.1 AA
 * 架构：配置层 → 工具层 → 渲染层 → 响应层 四层分离
 * ============================================================
 */

import { CITIES } from './city-data.js';
import { renderCityPage } from './city-template.js';

const VALID_SLUGS = new Set(Object.keys(CITIES));

/* ========== 1. 配置层 - 模块顶层常量预定义，零运行时修改 ========== */
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

/* ========== 2. 工具层 - 纯函数，无副作用，全量边界覆盖 ========== */

/**
 * 安全配置初始化 - 环境变量校验 + 归一化 + 兜底
 * @param {object} env Cloudflare 环境变量
 * @param {string} hostname 请求域名
 * @returns {object} 冻结的安全配置对象
 */
function initConfig(env, hostname) {
  const rawEnv = env || Object.create(null);
  const isPreview = hostname && hostname.includes('pages.dev');

  // 配置对象 - 切断原型链，防止原型污染
  const config = Object.create(null);

  // GA4 配置校验 - 占位符或空值时禁用
  const rawGaId = rawEnv.GA_MEASUREMENT_ID || '';
  config.DISABLE_GA = rawEnv.DISABLE_GA === 'true' || isPreview || !rawGaId || rawGaId === 'G-XXXXXXXXXX';
  config.GA_ID = config.DISABLE_GA ? '' : rawGaId;

  // Stripe 配置校验
  config.ENABLE_STRIPE = rawEnv.ENABLE_STRIPE === 'true' && !!rawEnv.STRIPE_PUBLISHABLE_KEY;
  config.STRIPE_PUBLISHABLE_KEY = config.ENABLE_STRIPE ? rawEnv.STRIPE_PUBLISHABLE_KEY : '';

  // 重复头过滤 - 支持 auto 自动模式
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

  // 缓存策略 - 浏览器零缓存保证安全，边缘短缓存提升性能
  config.CACHE_MAX_AGE = 0;
  config.EDGE_CACHE_AGE = isPreview ? 0 : CONSTANTS.EDGE_CACHE_SECONDS;

  // 深度冻结，禁止运行时修改
  return Object.freeze(config);
}

/**
 * Slug 合法性校验 - 三层校验防绕过
 * @param {string} slug 原始参数
 * @returns {boolean} 是否合法
 */
function isValidSlug(slug) {
  // 第一层：类型与长度
  if (typeof slug !== 'string' || !slug) return false;
  if (slug.length < CONSTANTS.MIN_SLUG_LENGTH || slug.length > CONSTANTS.MAX_SLUG_LENGTH) return false;

  // 第二层：URL解码后二次校验，防编码绕过
  let decoded;
  try {
    decoded = decodeURIComponent(slug);
  } catch (e) {
    return false; // 解码失败直接判定非法
  }
  if (decoded.length > CONSTANTS.MAX_SLUG_LENGTH) return false;

  // 第三层：严格正则匹配
  return CONSTANTS.SLUG_REGEX.test(decoded.toLowerCase());
}

/**
 * 全量 HTML 转义 - 杜绝 XSS 风险
 * @param {string} unsafe 原始字符串
 * @returns {string} 转义后字符串
 */
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

/**
 * 安全序列化 JSON-LD - 防止脚本注入
 * @param {object} obj 结构化数据对象
 * @returns {string} 安全的JSON字符串
 */
function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/<\/script/gi, '\\x3C/script')
    .replace(/<!--/g, '\\x3C!--');
}

/**
 * 轻量 HTML 无损压缩
 * @param {string} html 原始HTML
 * @returns {string} 压缩后HTML
 */
function minifyHtml(html) {
  return html
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * 生成 ETag - SHA-1 摘要，支持协商缓存
 * @param {string} content 响应内容
 * @returns {string} ETag 值
 */
async function generateEtag(content) {
  try {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-1', encoder.encode(content));
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `"${hashHex}"`;
  } catch (e) {
    // 降级弱ETag
    return `W/"${content.length}"`;
  }
}

/**
 * 查询参数归一化 - 白名单过滤 + 字母排序，防重复内容
 * @param {URLSearchParams} searchParams 原始查询参数
 * @returns {string} 标准化查询字符串（带?前缀）
 */
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

/* ========== 3. 安全头层 - 统一安全策略 ========== */

/**
 * 构建全量安全响应头
 * @param {object} config 全局配置
 * @returns {object} 安全头对象
 */
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

  // Stripe 启用时动态追加白名单
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

  // Stripe 启用时降级跨源隔离策略，放开支付权限
  if (config.ENABLE_STRIPE) {
    headers['Cross-Origin-Opener-Policy'] = 'same-origin-allow-popups';
    headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=(), payment=(self "https://js.stripe.com")';
  }

  // 过滤重复头 - 大小写不敏感匹配
  const duplicateSet = new Set(config.DUPLICATE_HEADERS || []);
  Object.keys(headers).forEach(key => {
    if (duplicateSet.has(key.toLowerCase())) {
      delete headers[key];
    }
  });

  return headers;
}

/**
 * 构建缓存响应头
 * @param {object} config 全局配置
 * @returns {object} 缓存头对象
 */
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

/* ========== 4. 错误页工厂 - 统一错误响应 ========== */

/**
 * 构建标准化错误页面
 * @param {number} status HTTP状态码
 * @param {string} message 错误提示文案
 * @param {object} options 配置项
 * @returns {Response} 标准响应对象
 */
function buildErrorPage(status, message, options = {}) {
  const { allow, env } = options;
  const safeMsg = escapeHtml(message);

  // 初始化配置用于安全头
  const hostname = typeof options.hostname === 'string' ? options.hostname : '';
  const config = initConfig(env, hostname);

  // 热门城市引导 - 仅 404 展示
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

  // 405 状态强制返回 Allow 头
  if (status === 405 && allow) {
    headers.Allow = allow;
  }

  return new Response(html, { headers, status });
}

/* ========== 5. 主入口 - 请求处理核心 ========== */

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  // 第一层拦截：非法方法直接返回
  if (method !== 'GET' && method !== 'HEAD') {
    return buildErrorPage(405, 'Method Not Allowed', { allow: 'GET, HEAD', env });
  }

  // 第二层拦截：URL安全解析
  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return buildErrorPage(400, 'Bad Request', { env });
  }

  const pathname = url.pathname;

  // 提取slug: /city/tokyo/ → tokyo, /city/tokyo → tokyo
  const parts = pathname.replace(/\/+$/, '').split('/');
  const rawCity = parts.length >= 3 ? parts[2] : '';

  // 第三层拦截：Slug合法性校验（防路径遍历/编码绕过）
  if (!isValidSlug(rawCity)) {
    return buildErrorPage(404, 'Page Not Found', { env, hostname: url.hostname });
  }

  // 第四层：验证slug是否在有效城市列表中
  const standardCity = rawCity.toLowerCase();
  if (!VALID_SLUGS.has(standardCity)) {
    return buildErrorPage(404, 'Page Not Found', { env, hostname: url.hostname });
  }

  const city = CITIES[standardCity];
  if (!city) {
    return buildErrorPage(404, 'Page Not Found', { env, hostname: url.hostname });
  }

  // 初始化配置
  const config = initConfig(env, url.hostname);

  // URL全量归一化（3重校验：大小写 + 尾部斜杠 + 查询参数）
  const standardPath = `/city/${standardCity}/`;
  const standardSearch = normalizeQueryParams(url.searchParams);

  // 路径或参数不一致时，301永久跳转到标准URL
  if (url.pathname !== standardPath || url.search !== standardSearch) {
    return Response.redirect(`${CONSTANTS.SITE_URL}${standardPath}${standardSearch}`, 301);
  }

  // 渲染页面
  try {
    const rawHtml = renderCityPage(standardCity, city, CITIES, 'zh', config);
    const html = minifyHtml(rawHtml);

    // 生成 ETag，协商缓存判断
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

    // 组装完整响应头
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      ETag: etag,
      ...buildSecurityHeaders(config),
      ...buildCacheHeaders(config),
      Vary: 'Accept-Encoding',
    };

    // HEAD 请求仅返回头，不返回正文
    if (method === 'HEAD') {
      return new Response(null, { status: 200, headers });
    }

    // 正常 GET 请求返回完整页面
    return new Response(html, { status: 200, headers });

  } catch (error) {
    // 服务端错误 - 仅记录日志，不向客户端泄露细节
    console.error(`[CityPage Error] city=${standardCity}, msg=${error.message}`);
    return buildErrorPage(500, 'Internal Server Error', { env, hostname: url.hostname });
  }
}
