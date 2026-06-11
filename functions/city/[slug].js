/**
 * Cloudflare Pages Function — 城市页面动态渲染
 * Route: /city/:slug/
 *
 * 不依赖静态HTML文件部署，直接在边缘渲染200个城市页面。
 * 数据来源：内嵌精简JSON（city-data.js）
 * 模板渲染：city-template.js
 */

import { CITIES } from './city-data.js';
import { renderCityPage } from './city-template.js';

// 合法的城市slug白名单（防注入）
const VALID_SLUGS = new Set(Object.keys(CITIES));

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // 提取slug: /city/tokyo/ → tokyo, /city/tokyo → tokyo
  const parts = pathname.replace(/\/+$/, '').split('/');
  const slug = parts.length >= 3 ? parts[2] : '';

  // 校验slug
  if (!slug || !VALID_SLUGS.has(slug)) {
    // 不是合法城市，交给404处理
    return context.next();
  }

  const city = CITIES[slug];
  if (!city) {
    return context.next();
  }

  try {
    const html = renderCityPage(slug, city, CITIES);

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=14400, stale-while-revalidate=86400',
        'Vary': 'Accept-Encoding',
      },
    });
  } catch (e) {
    // 渲染失败，回退到静态文件或404
    console.error('City page render error for', slug, e.message);
    return context.next();
  }
}
