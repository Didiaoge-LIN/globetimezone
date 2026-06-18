'use strict';

/**
 * 全局常量配置（深度冻结，运行时不可修改）
 * 唯一数据源，杜绝魔法数字/字符串
 */
const CONSTANTS = Object.freeze({
  // 输入校验规则
  VALIDATION: Object.freeze({
    SLUG_MIN_LENGTH: 2,
    SLUG_MAX_LENGTH: 64,
    SLUG_REGEX: /^[a-z0-9]+(-[a-z0-9]+)*$/,
    ALLOWED_LANGS: Object.freeze(['zh', 'en', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar']),
    DEFAULT_LANG: 'zh'
  }),

  // 缓存策略
  CACHE: Object.freeze({
    BROWSER_HTML_MAX_AGE: 0,
    EDGE_HTML_MAX_AGE: 300,
    STATIC_ASSET_MAX_AGE: 31536000,
    STALE_WHILE_REVALIDATE: 86400,
    STALE_IF_ERROR: 86400
  }),

  // SEO白名单参数（字母排序，防重复内容）
  ALLOWED_QUERY_PARAMS: Object.freeze(['utm_campaign', 'utm_content', 'utm_medium', 'utm_source', 'utm_term']),

  // 热门城市（用于推荐/404引导）
  HOT_CITIES: Object.freeze(['new-york', 'london', 'tokyo', 'beijing', 'sydney', 'dubai', 'moscow', 'los-angeles']),

  // Top20差异化OG图城市
  OG_TOP20_CITIES: new Set([
    'beijing', 'shanghai', 'tokyo', 'seoul', 'bangkok', 'singapore',
    'london', 'paris', 'berlin', 'amsterdam', 'rome', 'madrid',
    'new-york', 'los-angeles', 'chicago', 'toronto', 'sydney', 'auckland',
    'hong-kong', 'taipei'
  ]),

  // Service Worker配置
  SW: Object.freeze({
    CACHE_VERSION: 'v11',
    MAX_DYNAMIC_CACHE_ITEMS: 100,
    PRECACHE_ASSETS: Object.freeze([
      '/',
      '/index.html',
      '/styles/premium.css',
      '/js/gtz-utils.js',
      '/js/custom-cities.js',
      '/js/earth-visual.js',
      '/favicon.svg',
      '/favicon.ico',
      '/og-default.png',
      '/manifest.json'
    ])
  }),

  // 安全配置
  SECURITY: Object.freeze({
    HSTS_MAX_AGE: 31536000,
    RATE_LIMIT_PER_MINUTE: 60,
    CSP_REPORT_ONLY: false
  }),

  // 站点配置
  SITE: Object.freeze({
    URL: 'https://globetimezone.com',
    NAME: 'GlobeTimeZone'
  })
});

export default CONSTANTS;
