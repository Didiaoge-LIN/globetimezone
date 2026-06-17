import { escapeXml } from '../lib/security.js';
import { getAllCities } from '../city/data/index.js';

const BASE_URL = 'https://globetimezone.com';
const SUB_SITEMAP_LIMIT = 5000;
const CACHE_TTL = 86400;
const KV_NAMESPACE = 'SITEMAP_CACHE';

const CITY_SLUGS = Object.keys(getAllCities());

function buildUrlNode(loc, changefreq, priority, lastmod) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`;
}

export async function onRequestGet(context) {
  const { params, env } = context;
  const pageNum = parseInt(params.page, 10);
  const today = new Date().toISOString().split('T')[0];

  // 参数合法性校验
  if (!Number.isInteger(pageNum) || pageNum < 1) {
    return new Response('Not Found', { status: 404 });
  }

  const cacheKey = `sitemap:compare:${pageNum}`;

  // 读缓存
  try {
    const cached = await env[KV_NAMESPACE].get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': `public, max-age=${CACHE_TTL}`
        }
      });
    }
  } catch (e) {}

  // 生成分片数据
  const startIndex = (pageNum - 1) * SUB_SITEMAP_LIMIT;
  const endIndex = startIndex + SUB_SITEMAP_LIMIT;
  const urlNodes = [];
  let currentIndex = 0;

  // 城市详情页
  for (const city of CITY_SLUGS) {
    if (currentIndex >= startIndex && currentIndex < endIndex) {
      urlNodes.push(buildUrlNode(`${BASE_URL}/city/${city}`, 'daily', '0.6', today));
    }
    currentIndex++;
  }

  // 两两对比页
  for (let i = 0; i < CITY_SLUGS.length; i++) {
    for (let j = i + 1; j < CITY_SLUGS.length; j++) {
      if (currentIndex >= startIndex && currentIndex < endIndex) {
        urlNodes.push(buildUrlNode(
          `${BASE_URL}/compare/${CITY_SLUGS[i]}-and-${CITY_SLUGS[j]}-time-difference`,
          'daily',
          '0.5',
          today
        ));
      }
      currentIndex++;
    }
  }

  if (urlNodes.length === 0) {
    return new Response('Not Found', { status: 404 });
  }

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes.join('\n')}
</urlset>`;

  // 写缓存
  try {
    await env[KV_NAMESPACE].put(cacheKey, xmlContent, { expirationTtl: CACHE_TTL });
  } catch (e) {}

  return new Response(xmlContent, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${CACHE_TTL}`
    }
  });
}