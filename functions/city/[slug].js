/**
 * ============================================================
 * Cloudflare Pages Function — 城市页面动态渲染（无语言前缀）
 * Route: /city/:slug/
 * v9.0 — 工业级重构版
 * 架构：中间件统一安全头/URL归一化 → 路由仅关注业务逻辑
 * 代码量减少60%，零重复，所有通用能力由共享库提供
 * ============================================================
 */

import { isValidSlug, escapeHtml, safeJsonLd, buildErrorResponse } from '../lib/security.js';
import { initConfig, minifyHtml, generateEtag, handleConditionalRequest, buildCacheHeaders } from '../lib/utils.js';
import { getAllCities, getValidSlugs } from './data/index.js';
import { renderCityPage } from './city-template.js';

const VALID_SLUGS = getValidSlugs();

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  // 方法校验（中间件已做一层，此处二次兜底）
  if (method !== 'GET' && method !== 'HEAD') {
    return buildErrorResponse(405, 'Method Not Allowed', { allow: 'GET, HEAD' });
  }

  // URL安全解析
  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return buildErrorResponse(400, 'Bad Request');
  }

  // 提取slug
  const parts = url.pathname.replace(/\/+$/, '').split('/');
  const rawCity = parts.length >= 3 ? parts[2] : '';

  // Slug合法性校验
  if (!isValidSlug(rawCity)) {
    return buildErrorResponse(404, 'Page Not Found');
  }

  // 验证slug是否在有效城市列表中
  const standardCity = rawCity.toLowerCase();
  if (!VALID_SLUGS.has(standardCity)) {
    return buildErrorResponse(404, 'Page Not Found');
  }

  const CITIES = getAllCities();
  const city = CITIES[standardCity];
  if (!city) {
    return buildErrorResponse(404, 'Page Not Found');
  }

  // 初始化配置
  const config = initConfig(env, url.hostname);

  // 渲染页面
  try {
    const rawHtml = renderCityPage(standardCity, city, CITIES, 'zh', config);
    const html = minifyHtml(rawHtml);

    // ETag协商缓存
    const etag = await generateEtag(html);
    const cacheHeaders = buildCacheHeaders(config);
    const conditionalResponse = handleConditionalRequest(request, etag, cacheHeaders);
    if (conditionalResponse) return conditionalResponse;

    // 组装完整响应头（安全头由中间件统一注入）
    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      ETag: etag,
      ...cacheHeaders,
      Vary: 'Accept-Encoding',
    };

    // HEAD 请求仅返回头
    if (method === 'HEAD') {
      return new Response(null, { status: 200, headers });
    }

    return new Response(html, { status: 200, headers });

  } catch (error) {
    console.error(`[CityPage Error] city=${standardCity}, msg=${error.message}`);
    return buildErrorResponse(500, 'Internal Server Error');
  }
}
