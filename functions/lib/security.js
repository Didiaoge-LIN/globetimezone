'use strict';

import CONSTANTS from './constants.js';

const { VALIDATION } = CONSTANTS;

/**
 * 创建无原型链的纯净对象（彻底杜绝原型污染攻击）
 * @returns {Record<string, any>}
 */
export const createSafeObject = () => Object.create(null);

/**
 * 城市Slug合法性三重校验（防编码绕过/非法字符/格式错误）
 * @param {string} slug 原始输入
 * @returns {boolean}
 */
export const isValidSlug = (slug) => {
  if (typeof slug !== 'string' || !slug) return false;
  if (slug.length < VALIDATION.SLUG_MIN_LENGTH || slug.length > VALIDATION.SLUG_MAX_LENGTH) return false;

  let decoded;
  try {
    decoded = decodeURIComponent(slug);
  } catch (e) {
    return false;
  }
  if (decoded.length > VALIDATION.SLUG_MAX_LENGTH) return false;

  return VALIDATION.SLUG_REGEX.test(decoded.toLowerCase());
};

/**
 * HTML全量转义（覆盖所有XSS场景，属性/文本/JSON均适用）
 * @param {string} unsafe 原始字符串
 * @returns {string}
 */
export const escapeHtml = (unsafe) => {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#96;')
    .replace(/\//g, '&#x2F;');
};

/**
 * 安全序列化JSON-LD（防止</script>注入攻击）
 * 大小写不敏感替换，覆盖所有变体
 * @param {object} data 结构化数据对象
 * @returns {string} 安全的JSON字符串
 */
export const safeJsonLd = (data) => {
  if (typeof data !== 'object' || data === null) return '{}';
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e');
};

/**
 * 构建标准安全响应头（全项目统一标准，支持过滤重复项）
 * @param {object} options
 * @param {boolean} options.enableStripe 是否启用Stripe支付
 * @param {string[]} options.excludeHeaders 需要排除的头（小写，解决前置CDN重复头问题）
 * @param {boolean} options.noIndex 是否禁止搜索引擎收录
 * @returns {HeadersInit}
 */
export const buildSecurityHeaders = (options = {}) => {
  const { enableStripe = false, excludeHeaders = [], noIndex = false } = options;
  const excludeSet = new Set(excludeHeaders.map(h => h.toLowerCase().trim()));

  // CSP核心规则：无nonce，彻底解决与缓存的冲突
  // media-src: 广告解锁权益体系视频素材（/assets/videos/ 同源）
  //            未来若迁移至R2/外部CDN，需在此追加域名白名单
  const cspRules = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://*.google-analytics.com https://js.sentry-cdn.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: https://*.google-analytics.com https://*.googletagmanager.com",
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.sentry.io https://*.firebaseio.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com",
    "media-src 'self'",
    "font-src 'self' data:",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests"
  ];

  // Stripe场景动态追加白名单+降级跨域隔离
  if (enableStripe) {
    cspRules[1] += ' https://js.stripe.com https://*.stripe.com';
    cspRules[3] += ' https://*.stripe.com';
    cspRules[4] += ' https://api.stripe.com https://m.stripe.com https://m.stripe.network';
    cspRules[6] = 'frame-src https://js.stripe.com https://hooks.stripe.com';
  }

  const headers = createSafeObject();
  headers['Content-Security-Policy'] = cspRules.join('; ');
  headers['Strict-Transport-Security'] = `max-age=${CONSTANTS.SECURITY.HSTS_MAX_AGE}; includeSubDomains; preload`;
  headers['X-Frame-Options'] = 'DENY';
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-XSS-Protection'] = '0';
  headers['X-Download-Options'] = 'noopen';
  headers['X-Permitted-Cross-Domain-Policies'] = 'none';
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
  headers['Permissions-Policy'] = enableStripe
    ? 'geolocation=(), microphone=(), camera=(), payment=(self "https://js.stripe.com")'
    : 'geolocation=(), microphone=(), camera=(), payment=()';
  headers['Cross-Origin-Opener-Policy'] = enableStripe ? 'same-origin-allow-popups' : 'same-origin';
  headers['Cross-Origin-Resource-Policy'] = 'same-origin';
  headers['Origin-Agent-Cluster'] = '?1';

  if (noIndex) {
    headers['X-Robots-Tag'] = 'noindex, nofollow, noarchive';
  }

  // 过滤需要排除的重复头
  Object.keys(headers).forEach(key => {
    if (excludeSet.has(key.toLowerCase())) {
      delete headers[key];
    }
  });

  return headers;
};

/**
 * JavaScript 字符串上下文安全序列化（防御JS注入）
 * 适用场景：内联脚本中的字符串变量
 * @param {any} input 待序列化内容
 * @returns {string} 带引号的安全JS字符串
 */
export const safeJsString = (input) => {
  return JSON.stringify(String(input ?? ''));
};

/**
 * XML 上下文转义（防御XML格式崩坏与注入）
 * 适用场景：Sitemap、RSS等XML格式输出
 * @param {any} input 待转义内容
 * @returns {string} 安全转义后的字符串
 */
export const escapeXml = (input) => {
  const str = input == null ? '' : String(input);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * IANA 时区标识合法性校验
 * @param {any} tz 待校验时区
 * @returns {boolean} 是否合法
 */
export const isValidTimeZone = (tz) => {
  if (typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

/**
 * 站内URL安全校验（防御开放重定向漏洞）
 * 仅允许站内相对路径与本站域名绝对路径
 * @param {any} url 待校验URL
 * @returns {boolean} 是否安全
 */
export const isSafeInternalUrl = (url) => {
  if (typeof url !== 'string') return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  return url.startsWith('https://globetimezone.com/');
};

/**
 * 统一错误响应工厂（所有错误场景格式一致，零信息泄露）
 * @param {number} status HTTP状态码
 * @param {string} message 用户可见提示
 * @param {object} options
 * @param {string} options.allow 405场景的Allow头
 * @param {string[]} options.excludeHeaders 排除的安全头
 * @param {boolean} options.noIndex 是否禁止收录
 * @returns {Response}
 */
export const buildErrorResponse = (status, message, options = {}) => {
  const { allow = '', excludeHeaders = [], noIndex = true } = options;
  const safeMsg = escapeHtml(message);

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#2563eb">
<title>${status} - ${safeMsg}</title>
<link rel="stylesheet" href="/styles/premium.css">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
</head>
<body>
<a href="#main-content" class="skip-link">跳转到主要内容</a>
<div class="error-page" id="main-content">
  <div class="error-card">
    <div class="error-code">${status}</div>
    <p class="error-message">${safeMsg}</p>
    <div class="error-actions">
      <a href="/" class="btn btn-primary">返回首页</a>
      <a href="/city/" class="btn btn-secondary">浏览城市</a>
    </div>
    ${status === 404 ? `
    <div class="hot-cities">
      <h3>热门城市</h3>
      <div class="city-grid">
        ${CONSTANTS.HOT_CITIES.map(slug => `<a href="/city/${slug}/">${slug.replace(/-/g, ' ')}</a>`).join('')}
      </div>
    </div>` : ''}
  </div>
</div>
</body>
</html>`;

  const headers = {
    'Content-Type': 'text/html; charset=utf-8',
    ...buildSecurityHeaders({ excludeHeaders, noIndex }),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (status === 405 && allow) {
    headers.Allow = allow;
  }

  return new Response(html, { status, headers });
};
