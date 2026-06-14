/**
 * ============================================================
 * Cloudflare Pages Functions — catch-all middleware
 * File: functions/[[path]].js
 * v9.0 — 工业级重构版
 * 零重复代码，所有通用能力由共享库提供
 *
 * 作用：
 *   1. 拦截 /<lang>/city/:slug/ 请求，直接渲染城市页面（返回200）
 *   2. 拦截 /<lang>/<page>.html 请求，301 重定向到 /<lang>/<page>
 * ============================================================
 */

import { isValidSlug, escapeHtml, safeJsonLd, buildErrorResponse } from './lib/security.js';
import { initConfig, minifyHtml, generateEtag, handleConditionalRequest, buildCacheHeaders } from './lib/utils.js';
import CONSTANTS from './lib/constants.js';
import { getAllCities, getValidSlugs } from './city/data/index.js';
import { renderCityPage } from './city/city-template.js';

const LANG_SET = new Set(CONSTANTS.VALIDATION.ALLOWED_LANGS);
const VALID_SLUGS = getValidSlugs();

const LANG_HTML_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/(.+)\.html$/;
const LANG_CITY_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/city\/([a-zA-Z0-9%-]+)\/?$/;

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
      return buildErrorResponse(404, 'Page Not Found');
    }

    const standardCity = rawCity.toLowerCase();

    if (VALID_SLUGS.has(standardCity)) {
      const CITIES = getAllCities();
      const city = CITIES[standardCity];
      if (city) {
        // HEAD/GET only
        if (method !== 'GET' && method !== 'HEAD') {
          return buildErrorResponse(405, 'Method Not Allowed', { allow: 'GET, HEAD' });
        }

        // 初始化配置
        const config = initConfig(env, url.hostname);

        try {
          const rawHtml = renderCityPage(standardCity, city, CITIES, lang, config);
          const html = minifyHtml(rawHtml);

          // ETag 协商缓存
          const etag = await generateEtag(html);
          const cacheHeaders = buildCacheHeaders(config);
          const conditionalResponse = handleConditionalRequest(request, etag, cacheHeaders);
          if (conditionalResponse) return conditionalResponse;

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
          console.error(`[LangCity Error] city=${standardCity}, lang=${lang}, msg=${error.message}`);
          return buildErrorResponse(500, 'Internal Server Error');
        }
      }
    }
    // slug 不合法 → 404
    return buildErrorResponse(404, 'Page Not Found');
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
