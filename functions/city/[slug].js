/**
 * Cloudflare Pages Function — 城市页面动态渲染（无语言前缀）
 * Route: /city/:slug/
 * v2.1 — 安全头+GA4+og:image+Sentry+HEAD支持
 */

import { CITIES } from './city-data.js';
import { renderCityPage } from './city-template.js';

const VALID_SLUGS = new Set(Object.keys(CITIES));

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
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // HEAD/GET only
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  // 提取slug: /city/tokyo/ → tokyo, /city/tokyo → tokyo
  const parts = pathname.replace(/\/+$/, '').split('/');
  const slug = parts.length >= 3 ? parts[2] : '';

  if (!slug || !VALID_SLUGS.has(slug)) {
    return context.next();
  }

  const city = CITIES[slug];
  if (!city) {
    return context.next();
  }

  try {
    const html = renderCityPage(slug, city, CITIES, 'zh');

    const headers = {
      'Content-Type': 'text/html; charset=utf-8',
      ...getSecurityHeaders(),
      'Cache-Control': 'public, max-age=14400, stale-while-revalidate=86400',
      'Vary': 'Accept-Encoding',
    };

    // HEAD请求仅返回头，不传输正文
    if (method === 'HEAD') {
      return new Response(null, { status: 200, headers });
    }

    return new Response(html, { status: 200, headers });
  } catch (e) {
    console.error('City page render error for', slug, e.message);
    return context.next();
  }
}
