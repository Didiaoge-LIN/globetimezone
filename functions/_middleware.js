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
  // --------------------------
  const allowedMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (!allowedMethods.includes(request.method.toUpperCase())) {
    return buildErrorResponse(405, 'Method Not Allowed', {
      allow: allowedMethods.join(', '),
      excludeHeaders: env.DUPLICATE_HEADERS ? env.DUPLICATE_HEADERS.split(',') : []
    });
  }

  // --------------------------
  // 2. CORS预检请求处理
  // --------------------------
  if (request.method.toUpperCase() === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
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
  // 5. 注入全局安全头
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
      if (!newHeaders.has(key)) {
        newHeaders.set(key, value);
      }
    });

    // 缓存策略
    if (config.EDGE_CACHE_AGE > 0) {
      newHeaders.set('Cache-Control', `public, max-age=${config.CACHE_MAX_AGE}, s-maxage=${config.EDGE_CACHE_AGE}, stale-while-revalidate=${CONSTANTS.CACHE.STALE_WHILE_REVALIDATE}, stale-if-error=${CONSTANTS.CACHE.STALE_IF_ERROR}`);
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
