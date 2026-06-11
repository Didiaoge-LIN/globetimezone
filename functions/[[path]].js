/**
 * Cloudflare Pages Functions — catch-all middleware
 * File: functions/[[path]].js
 *
 * 作用：
 *   1. 拦截 /<lang>/city/:slug/ 请求，直接渲染城市页面（返回200）
 *      防止 _redirects 重写后被 CF Pages Clean URLs 308 丢掉语言前缀
 *   2. 拦截 /<lang>/<page>.html 请求，301 重定向到 /<lang>/<page>
 *      防止 CF Pages Clean URLs 的 308 重定向丢掉语言前缀
 *
 * 处理顺序（CF Pages）：
 *   1. Functions（本文件 + city/[slug].js）
 *   2. _redirects
 *   3. 静态文件服务
 */

import { CITIES } from './city/city-data.js';
import { renderCityPage } from './city/city-template.js';

const LANGS = ['en', 'zh', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'];
const LANG_SET = new Set(LANGS);
const VALID_SLUGS = new Set(Object.keys(CITIES));

const LANG_HTML_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/(.+)\.html$/;
const LANG_CITY_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/city\/([a-z0-9-]+)\/?$/;

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // ═══════ 1. 语言版城市页面：/<lang>/city/:slug/ → 直接渲染200 ═══════
  const cityMatch = pathname.match(LANG_CITY_REGEX);
  if (cityMatch) {
    const lang = cityMatch[1];
    const slug = cityMatch[2];

    if (VALID_SLUGS.has(slug)) {
      const city = CITIES[slug];
      if (city) {
        try {
          const html = renderCityPage(slug, city, CITIES, lang);
          return new Response(html, {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'public, max-age=14400, stale-while-revalidate=86400',
              'Vary': 'Accept-Encoding',
            },
          });
        } catch (e) {
          console.error('Lang city render error for', slug, e.message);
          // 渲染失败，回退到无语言版
        }
      }
    }
    // slug 不合法或渲染失败 → 交给 next()，走 _redirects 重写到 /city/:slug/
    return next();
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
