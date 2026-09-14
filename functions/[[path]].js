/**
 * ============================================================
 * Cloudflare Pages Functions — catch-all middleware
 * File: functions/[[path]].js
 * v10.0 — i18n SSR 动态注入版
 * 零重复代码，所有通用能力由共享库提供
 *
 * 作用：
 *   1. 拦截 /<lang>/ 首页请求，动态注入 lang/title/description（SEO 救命）
 *   2. 拦截 /<lang>/city/:slug/ 请求，直接渲染城市页面（返回200）
 *   3. 拦截 /<lang>/<page>.html 请求，301 重定向到 /<lang>/<page>
 * ============================================================
 */

import { isValidSlug, buildErrorResponse } from './lib/security.js';
import { initConfig, minifyHtml, generateEtag, handleConditionalRequest, buildCacheHeaders } from './lib/utils.js';
import { getAllCities, getValidSlugs } from './city/data/index.js';
import { renderCityPage } from './city/city-template.js';
import { renderLocalizedHome, hasHomeI18n } from './lib/home-i18n.js';

const VALID_SLUGS = getValidSlugs();

const LANG_HTML_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/(.+)\.html$/;
const LANG_CITY_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/city\/([a-zA-Z0-9%-]+)\/?$/;
const LANG_HOME_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/?$/;

// 语言版首页的 SEO 文案与正文翻译统一由 functions/lib/home-i18n.js 提供，
// 数据源为 locales/*.json（经 scripts/build-home-i18n.cjs 抽取），
// 不再在本文件内维护独立文案表（原 LANG_SEO 已移除，避免两处文案漂移）。

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // ═══════ 0. i18n 首页：/<lang>/ → 整页服务端本地化渲染 ═══════
  const homeMatch = pathname.match(LANG_HOME_REGEX);
  if (homeMatch) {
    const lang = homeMatch[1];

    // 该语言是否有首页 SSR 数据（home-i18n-data.js，由 scripts/build-home-i18n.cjs 生成）
    if (hasHomeI18n(lang)) {
      if (method !== 'GET' && method !== 'HEAD') {
        return buildErrorResponse(405, 'Method Not Allowed', { allow: 'GET, HEAD' });
      }

      // 1) 取根 index.html。优先走 _redirects 的 rewrite（/<lang>/* → /:splat），
      //    失败时直接读取静态资源，避免 rewrite 未生效时 404
      let staticResp = await next();
      if (staticResp.status !== 200) {
        try {
          staticResp = await env.ASSETS.fetch(
            new Request(new URL('/index.html', url.origin), request)
          );
        } catch (e) {
          // ASSETS 不可用时保持原响应
        }
      }
      if (staticResp.status !== 200) return staticResp;

      const contentType = staticResp.headers.get('Content-Type') || '';
      if (!contentType.includes('text/html')) return staticResp;

      const html = await staticResp.text();
      // 整页本地化：正文 data-i18n + head（lang/title/description/canonical/og/hreflang/dir）
      const localized = renderLocalizedHome(html, lang);

      const headers = new Headers(staticResp.headers);
      headers.set('Content-Type', 'text/html; charset=utf-8');
      headers.delete('Content-Length');

      if (method === 'HEAD') return new Response(null, { status: 200, headers });
      return new Response(localized, { status: 200, headers });
    }
  }

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

  // ═══════ 2.5 其它语言前缀页面：/<lang>/<path> → 交给静态服务 ═══════
  //
  // 【2026-09-14 移除原 SSR 注入逻辑】
  // 原实现在此把**任意** /<lang>/<path> 页面的 title / description / og:title
  // 统一替换为「首页」的 LANG_SEO 文案。该逻辑当前不可达（_routes.json 未包含
  // 语言通配路由），但一旦将来启用 /<lang>/* 通配，就会把全站语言页的标题
  // 全部覆盖成首页标题 —— 属于高破坏性 SEO 事故。故移除。
  //
  // 现状说明：站点仅「首页」与「城市页」具备真正的多语言版本；
  // /en/about、/en/pricing 等其它语言前缀路径经 _redirects 重写到默认语言页，
  // 内容与默认语言页一致，不做改写（改写 lang 却保留中文正文会造成语义错配）。
  // 若后续要做整站 i18n，应改为按页面逐页取词，而非复用首页文案。

  // ═══════ 3. 其他请求 → 交给 _redirects / 静态文件服务 ═══════
  return next();
}
