import { escapeXml } from './lib/security.js';

const BASE_URL = 'https://globetimezone.com';
const CITIES = ['new-york', 'los-angeles', 'london', 'beijing', 'tokyo', 'sydney'];
const SUB_SITEMAP_LIMIT = 5000;
const CACHE_TTL = 86400;
const KV_NAMESPACE = 'SITEMAP_CACHE';

// 静态页面配置
const STATIC_PAGES = [
  { path: '', changefreq: 'weekly', priority: '1.0' },
  { path: '/meeting', changefreq: 'weekly', priority: '0.9' },
  { path: '/daylight-saving/usa-2026', changefreq: 'monthly', priority: '0.8' },
  { path: '/amazon/north-america-schedule-2026', changefreq: 'monthly', priority: '0.8' }
];

/**
 * 生成单个URL节点
 */
function buildUrlNode(loc, changefreq, priority, lastmod) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`;
}

/**
 * 生成站点地图索引文件
 */
function buildSitemapIndex(count) {
  const today = new Date().toISOString().split('T')[0];
  let sitemaps = '';
  for (let i = 1; i <= count; i++) {
    sitemaps += `  <sitemap>
    <loc>${escapeXml(`${BASE_URL}/sitemap/compare-${i}.xml`)}</loc>
    <lastmod>${escapeXml(today)}</lastmod>
  </sitemap>\n`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}</sitemapindex>`;
}

export async function onRequestGet(context) {
  const { env } = context;
  const today = new Date().toISOString().split('T')[0];
  const cacheKey = 'sitemap:compare-index';

  // 优先读取KV缓存
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
  } catch (e) {
    // KV异常降级为实时生成，不中断服务
  }

  // 计算动态页面总数
  const cityPageCount = CITIES.length;
  const comparePageCount = CITIES.length * (CITIES.length - 1) / 2;
  const totalDynamicPages = cityPageCount + comparePageCount;
  const subSitemapCount = Math.ceil(totalDynamicPages / SUB_SITEMAP_LIMIT);

  let xmlContent;

  if (subSitemapCount <= 1) {
    // 页面量少，直接合并输出单文件
    const urlNodes = [];
    // 静态页面
    STATIC_PAGES.forEach(page => {
      urlNodes.push(buildUrlNode(`${BASE_URL}${page.path}`, page.changefreq, page.priority, today));
    });
    // 城市详情页
    CITIES.forEach(city => {
      urlNodes.push(buildUrlNode(`${BASE_URL}/city/${city}`, 'daily', '0.6', today));
    });
    // 两两对比页
    for (let i = 0; i < CITIES.length; i++) {
      for (let j = i + 1; j < CITIES.length; j++) {
        urlNodes.push(buildUrlNode(
          `${BASE_URL}/compare/${CITIES[i]}-and-${CITIES[j]}-time-difference`,
          'daily',
          '0.5',
          today
        ));
      }
    }

    xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes.join('\n')}
</urlset>`;
  } else {
    // 页面量大，输出索引文件
    xmlContent = buildSitemapIndex(subSitemapCount);
  }

  // 写入KV缓存，失败不影响响应
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