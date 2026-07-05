'use strict';

import CONSTANTS from './lib/constants.js';
import { buildSecurityHeaders, buildErrorResponse } from './lib/security.js';
import { initConfig, normalizeQueryParams } from './lib/utils.js';

/**
 * 全局请求中间件
 * 执行顺序：方法校验 → CORS预检 → URL归一化 → 安全头注入 → 缓存策略 → 转发到路由
 */
export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // --------------------------
  // 1. HTTP方法校验（前置短路）
  // /api/ad/* 允许 POST 方法；其他路径仅 GET/HEAD/OPTIONS
  // --------------------------
  const isAdApi = url.pathname.startsWith('/api/ad/');
  const allowedMethods = isAdApi
    ? ['GET', 'POST', 'HEAD', 'OPTIONS']
    : ['GET', 'HEAD', 'OPTIONS'];
  if (!allowedMethods.includes(request.method.toUpperCase())) {
    return buildErrorResponse(405, 'Method Not Allowed', {
      allow: allowedMethods.join(', '),
      excludeHeaders: env.DUPLICATE_HEADERS ? env.DUPLICATE_HEADERS.split(',') : []
    });
  }

  // --------------------------
  // 2. CORS预检请求处理
  // /api/ad/* 允许 POST Content-Type
  // --------------------------
  if (request.method.toUpperCase() === 'OPTIONS') {
    const adApiCorsHeaders = isAdApi
      ? 'Content-Type, X-Device-Fingerprint, X-Session-Id'
      : 'Content-Type';
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': isAdApi ? 'GET, POST, HEAD, OPTIONS' : 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': adApiCorsHeaders,
        'Access-Control-Max-Age': '86400',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  }

  // --------------------------
  // 3. URL全量归一化（301永久重定向，根治重复内容）
  //    仅对 /city/* 路径执行，避免影响其他静态页面
  // --------------------------
  if (url.pathname.startsWith('/city/') || url.pathname.match(/^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/city\//)) {
    let needRedirect = false;
    let standardPath = url.pathname;

    // 3.1 尾部斜杠归一化（统一加斜杠，根路径除外）
    if (!standardPath.endsWith('/') && !standardPath.includes('.')) {
      standardPath += '/';
      needRedirect = true;
    }

    // 3.2 路径小写归一化
    const lowerPath = standardPath.toLowerCase();
    if (standardPath !== lowerPath) {
      standardPath = lowerPath;
      needRedirect = true;
    }

    // 3.3 查询参数归一化（白名单+排序）
    const standardSearch = normalizeQueryParams(url.searchParams);
    if (standardSearch !== url.search) {
      needRedirect = true;
    }

    // 执行重定向
    if (needRedirect) {
      const siteUrl = `${url.protocol}//${url.host}`;
      return Response.redirect(`${siteUrl}${standardPath}${standardSearch}`, 301);
    }
  }

  // --------------------------
  // 4. 转发到路由处理
  // --------------------------
  const response = await next();

  // --------------------------
  // 4.5 静态资源直接透传（关键优化：保留CF原生边缘缓存）
  // CSS/JS/图片/字体等不走 Response 重包装，让 CF CDN 缓存层正常命中
  // 预期效果：静态资源缓存命中率从 ~2% 提升到 90%+
  // --------------------------
  const STATIC_ASSET_RE = /\.(css|js|png|jpe?g|svg|gif|ico|woff2?|ttf|eot|webp|avif)(\?.*)?$/i;
  if (STATIC_ASSET_RE.test(url.pathname)) {
    return response;
  }

  // --------------------------
  // 5. 注入全局安全头（仅HTML响应）
  // --------------------------
  const newHeaders = new Headers(response.headers);

  // 对于HTML响应，追加安全头
  const contentType = newHeaders.get('Content-Type') || '';
  if (contentType.includes('text/html') && response.status === 200) {
    const config = initConfig(env, url.hostname);
    const excludeHeaders = config.DUPLICATE_HEADERS || [];
    const securityHeaders = buildSecurityHeaders({
      enableStripe: config.ENABLE_STRIPE,
      excludeHeaders
    });

    Object.entries(securityHeaders).forEach(([key, value]) => {
      // 跳过 _headers 已注入的头（避免重复）
      // X-Content-Type-Options 由 _headers 统一处理
      if (key === 'X-Content-Type-Options') return;
      if (!newHeaders.has(key)) {
        newHeaders.set(key, value);
      }
    });

    // 缓存策略：HTML 强制注入 s-maxage（CF 边缘缓存前提）
    // 即使路由已设 max-age=0,must-revalidate，也要补上 s-maxage
    const existingCC = newHeaders.get('Cache-Control') || '';
    if (config.EDGE_CACHE_AGE > 0 && !existingCC.includes('s-maxage')) {
      newHeaders.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}, s-maxage=${config.EDGE_CACHE_AGE}, stale-while-revalidate=${CONSTANTS.CACHE.STALE_WHILE_REVALIDATE}, stale-if-error=${CONSTANTS.CACHE.STALE_IF_ERROR}`);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
