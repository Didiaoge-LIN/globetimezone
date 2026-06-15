/**
 * 全局安全防护底座
 * 所有动态输出必须调用对应函数，禁止直接拼接字符串
 * 兼容 Cloudflare Workers / Pages Functions 全运行环境
 */

/**
 * HTML 上下文转义（防御反射型XSS）
 * 适用场景：HTML标签内容、标签属性值
 * @param {any} input 待转义内容
 * @returns {string} 安全转义后的字符串
 */
export function escapeHtml(input) {
  const str = input == null ? '' : String(input);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * JavaScript 字符串上下文安全序列化（防御JS注入）
 * 适用场景：内联脚本中的字符串变量
 * @param {any} input 待序列化内容
 * @returns {string} 带引号的安全JS字符串
 */
export function safeJsString(input) {
  return JSON.stringify(String(input ?? ''));
}

/**
 * XML 上下文转义（防御XML格式崩坏与注入）
 * 适用场景：Sitemap、RSS等XML格式输出
 * @param {any} input 待转义内容
 * @returns {string} 安全转义后的字符串
 */
export function escapeXml(input) {
  const str = input == null ? '' : String(input);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * JSON-LD 结构化数据安全序列化
 * 适用场景：页面注入结构化数据脚本
 * @param {object} obj 结构化数据对象
 * @returns {string} 安全序列化后的JSON字符串
 */
export function safeJsonLd(obj) {
  return JSON.stringify(obj);
}

/**
 * URL Slug 合法性校验
 * 规则：小写字母、数字、连字符，长度3-50字符
 * @param {any} slug 待校验slug
 * @returns {boolean} 是否合法
 */
export function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9-]{3,50}$/.test(slug);
}

/**
 * IANA 时区标识合法性校验
 * @param {any} tz 待校验时区
 * @returns {boolean} 是否合法
 */
export function isValidTimeZone(tz) {
  if (typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * 站内URL安全校验（防御开放重定向漏洞）
 * 仅允许站内相对路径与本站域名绝对路径
 * @param {any} url 待校验URL
 * @returns {boolean} 是否安全
 */
export function isSafeInternalUrl(url) {
  if (typeof url !== 'string') return false;
  if (url.startsWith('/') && !url.startsWith('//')) return true;
  return url.startsWith('https://globetimezone.com/');
}

/**
 * 生成 CSP Nonce（加密安全随机值）
 * 用于放行可信内联脚本/样式，彻底替代 unsafe-inline
 * @returns {string} Base64URL 格式随机值
 */
export function generateCspNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * 构造标准安全响应头
 * @param {string} nonce CSP随机值
 * @param {string} contentType 响应内容类型
 * @param {string} cacheControl 缓存策略
 * @param {boolean} isBot 是否搜索引擎爬虫
 * @returns {object} 响应头对象
 */
export function buildSecurityHeaders(nonce, contentType, cacheControl = 'no-cache', isBot = false) {
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'Content-Security-Policy': [
      "default-src 'self'",
      `script-src 'nonce-${nonce}'`,
      `style-src 'nonce-${nonce}'`,
      "img-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()'
  };

  if (!isBot) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }

  return headers;
}