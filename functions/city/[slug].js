/**
 * Cloudflare Pages Function — 城市页面动态渲染（无语言前缀）
 * Route: /city/:slug/
 *
 * 不依赖静态HTML文件部署，直接在边缘渲染200个城市页面。
 * 语言前缀版本由 functions/[[path]].js 拦截处理。
 */

import { CITIES } from './city-data.js';
import { renderCityPage } from './city-template.js';

const VALID_SLUGS = new Set(Object.keys(CITIES));

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

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
    // 无语言前缀版本：默认使用 zh（中文）
    const html = renderCityPage(slug, city, CITIES, 'zh');

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=14400, stale-while-revalidate=86400',
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (e) {
    console.error('City page render error for', slug, e.message);
    return context.next();
  }
}
