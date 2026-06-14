/**
 * Cloudflare Pages Functions — catch-all middleware
 * File: functions/[[path]].js
 * v2.1 — 安全头+GA4+og:image+Sentry+HEAD支持
 *
 * 作用：
 *   1. 拦截 /<lang>/city/:slug/ 请求，直接渲染城市页面（返回200）
 *      防止 _redirects 重写后被 CF Pages Clean URLs 308 丢掉语言前缀
 *   2. 拦截 /<lang>/<page>.html 请求，301 重定向到 /<lang>/<page>
 *      防止 CF Pages Clean URLs 的 308 重定向丢掉语言前缀
 */

import { CITIES } from './city/city-data.js';
import { renderCityPage } from './city/city-template.js';

const LANGS = ['en', 'zh', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'];
const LANG_SET = new Set(LANGS);
const VALID_SLUGS = new Set(Object.keys(CITIES));

const LANG_HTML_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/(.+)\.html$/;
const LANG_CITY_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/city\/([a-z0-9-]+)\/?$/;

/** 全量安全响应头（CSP兼容GA4/Sentry/Firebase/百度） */
function getSecurityHeaders() {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://js.sentry-cdn.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://www.google-analytics.com https://*.sentry.io https://*.firebaseio.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com",
    "font-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:"
  ].join('; ');

  return {
    'Content-Security-Policy': csp,
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  };
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // ═══════ 1. 语言版城市页面：/<lang>/city/:slug/ → 直接渲染200 ═══════
  const cityMatch = pathname.match(LANG_CITY_REGEX);
  if (cityMatch) {
    const lang = cityMatch[1];
    const slug = cityMatch[2];

    if (VALID_SLUGS.has(slug)) {
      const city = CITIES[slug];
      if (city) {
        // HEAD/GET only
        if (method !== 'GET' && method !== 'HEAD') {
          return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
        }

        try {
          const html = renderCityPage(slug, city, CITIES, lang);

          const headers = {
            'Content-Type': 'text/html; charset=utf-8',
            ...getSecurityHeaders(),
            'Cache-Control': 'public, max-age=14400, stale-while-revalidate=86400',
            'Vary': 'Accept-Encoding',
          };

          // HEAD请求仅返回头
          if (method === 'HEAD') {
            return new Response(null, { status: 200, headers });
          }

          return new Response(html, { status: 200, headers });
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
