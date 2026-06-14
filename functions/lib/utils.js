'use strict';

import CONSTANTS from './constants.js';

/**
 * 安全配置初始化 - 环境变量校验 + 归一化 + 兜底
 * @param {object} env Cloudflare 环境变量
 * @param {string} hostname 请求域名
 * @returns {object} 冻结的安全配置对象
 */
export const initConfig = (env, hostname) => {
  const rawEnv = env || Object.create(null);
  const isPreview = hostname && hostname.includes('pages.dev');

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
  config.EDGE_CACHE_AGE = isPreview ? 0 : CONSTANTS.CACHE.EDGE_HTML_MAX_AGE;

  return Object.freeze(config);
};

/**
 * URL标准化：去除末尾斜杠，校验协议合法性
 * @param {string} url 原始URL
 * @returns {string} 标准化URL
 */
export const normalizeSiteUrl = (url) => {
  if (typeof url !== 'string' || !url) return CONSTANTS.SITE.URL;
  try {
    const parsed = new URL(url.trim());
    return parsed.origin + parsed.pathname.replace(/\/+$/, '');
  } catch (e) {
    return CONSTANTS.SITE.URL;
  }
};

/**
 * 查询参数归一化（白名单过滤+字母排序，彻底解决重复内容收录）
 * @param {URLSearchParams} searchParams 原始参数
 * @returns {string} 标准化查询串（带?前缀，空则返回空字符串）
 */
export const normalizeQueryParams = (searchParams) => {
  if (!(searchParams instanceof URLSearchParams)) return '';

  const filtered = new URLSearchParams();
  CONSTANTS.ALLOWED_QUERY_PARAMS.forEach(key => {
    if (searchParams.has(key)) {
      filtered.set(key, searchParams.get(key));
    }
  });

  const str = filtered.toString();
  return str ? `?${str}` : '';
};

/**
 * 无损HTML压缩（保留pre/script/style内空白，修复压缩破坏标签问题）
 * @param {string} html 原始HTML
 * @returns {string} 压缩后HTML
 */
export const minifyHtml = (html) => {
  if (typeof html !== 'string') return '';

  // 第一步：提取需要保留空白的块，替换为占位符
  const preserveBlocks = [];
  const blockRegex = /<(pre|script|style|textarea)[\s\S]*?>[\s\S]*?<\/\1>/gi;
  let processed = html.replace(blockRegex, (match) => {
    const index = preserveBlocks.length;
    preserveBlocks.push(match);
    return `__PRESERVE_BLOCK_${index}__`;
  });

  // 第二步：压缩其余区域
  processed = processed
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // 第三步：还原保留块
  preserveBlocks.forEach((block, index) => {
    processed = processed.replace(`__PRESERVE_BLOCK_${index}__`, block);
  });

  return processed;
};

/**
 * 生成ETag（SHA-256，替换已弃用的SHA-1）
 * @param {string} content 响应内容
 * @returns {Promise<string>} ETag值（带引号）
 */
export const generateEtag = async (content) => {
  if (!content || typeof content !== 'string') return '"0"';

  try {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(content));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `"${hashHex}"`;
  } catch (e) {
    return `W/"${content.length}"`;
  }
};

/**
 * 协商缓存判断：如果If-None-Match匹配则返回304
 * @param {Request} request 请求对象
 * @param {string} etag 当前内容ETag
 * @param {HeadersInit} headers 响应头
 * @returns {Response|null} 304响应或null
 */
export const handleConditionalRequest = (request, etag, headers) => {
  const ifNoneMatch = request.headers.get('If-None-Match');
  if (ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        ...headers
      }
    });
  }
  return null;
};

/**
 * 构建缓存响应头
 * @param {object} config 全局配置
 * @returns {object} 缓存头对象
 */
export const buildCacheHeaders = (config) => {
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
      `stale-while-revalidate=${CONSTANTS.CACHE.STALE_WHILE_REVALIDATE}`,
      `stale-if-error=${CONSTANTS.CACHE.STALE_IF_ERROR}`,
    ].join(', '),
  };
};
