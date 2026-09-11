'use strict';

/**
 * ============================================================
 * Sitemap 公共构建工具
 * ============================================================
 * 分级策略（2026-09-11 权重治理）：
 *   /sitemap.xml        → sitemapindex（索引，指向下面 3 个）
 *   /sitemap/pages.xml  → 静态核心页 + 9 语言首页
 *   /sitemap/cities.xml → 200 城市页 ×（zh 默认 + 8 语言）
 *   /sitemap/compare.xml→ 仅 Tier 1 对比页（核心枢纽城市组合）
 * ============================================================
 */

import { escapeXml } from './security.js';

export const SITE_BASE = 'https://globetimezone.com';
export const SUB_SITEMAP_LIMIT = 5000;

/** 提交给搜索引擎的语言版本（zh 通过根路径 /city/ 表达，不重复提交 /zh/） */
export const INDEXABLE_LANGS = ['en', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'];

/**
 * ⚠️ 自带 noindex 的页面黑名单 —— 绝不能进 sitemap
 *
 * 这些页面自身声明 <meta name="robots" content="noindex">，
 * 若被提交进 sitemap，GSC 会报 "Submitted URL marked 'noindex'" 并降低
 * sitemap 整体信任度。（2026-09-11 线上实测发现并修正）
 *
 * 维护规则：新增 STATIC_PAGES 前，先确认目标页**没有** noindex；
 *          若页面确需 noindex（分享页/付费墙/法务页），必须登记到此处。
 */
export const NOINDEX_PATHS = new Set([
  '/team-clock/',   // 分享链接动态页：noindex 且 canonical 指向首页
  '/pro',           // 付费墙页：canonical 自指却声明 noindex，自相矛盾
  '/disclaimer'     // 免责声明：noindex 且无 canonical
]);

/**
 * 静态核心页（全部为线上返回 200 的规范地址，且 canonical 自洽）
 * priority 依据页面商业/流量价值设定
 *
 * 注意：此处不含任何 NOINDEX_PATHS 中的路径（由页面过滤器兜底剔除）
 */
export const STATIC_PAGES = [
  { path: '', changefreq: 'daily', priority: '1.0' },
  { path: '/meeting-planner/', changefreq: 'weekly', priority: '0.9' },
  { path: '/time-difference/', changefreq: 'weekly', priority: '0.9' },
  { path: '/world-clock', changefreq: 'weekly', priority: '0.8' },
  { path: '/team-overlap', changefreq: 'weekly', priority: '0.8' },
  { path: '/meeting', changefreq: 'weekly', priority: '0.8' },
  { path: '/us-china-time-difference', changefreq: 'weekly', priority: '0.8' },
  { path: '/pricing/', changefreq: 'weekly', priority: '0.8' },
  { path: '/blog/', changefreq: 'weekly', priority: '0.7' },
  { path: '/meeting-scheduler', changefreq: 'weekly', priority: '0.7' },
  { path: '/countdown', changefreq: 'weekly', priority: '0.7' },
  { path: '/holidays', changefreq: 'weekly', priority: '0.7' },
  { path: '/timezone-guide', changefreq: 'monthly', priority: '0.7' },
  { path: '/europe-australia-time-difference', changefreq: 'monthly', priority: '0.6' },
  { path: '/timezone-history', changefreq: 'monthly', priority: '0.6' },
  { path: '/dst-2025-schedule', changefreq: 'monthly', priority: '0.6' },
  { path: '/why-daylight-saving-time', changefreq: 'monthly', priority: '0.6' },
  { path: '/remote-team-timezone-guide', changefreq: 'monthly', priority: '0.6' },
  { path: '/articles', changefreq: 'weekly', priority: '0.6' },
  { path: '/api', changefreq: 'monthly', priority: '0.6' },
  { path: '/tools/cross-border/', changefreq: 'monthly', priority: '0.6' },
  // 时区换算器（长尾搜索主力）
  { path: '/est-to-pst-converter', changefreq: 'monthly', priority: '0.6' },
  { path: '/pst-to-est', changefreq: 'monthly', priority: '0.6' },
  { path: '/ast-to-pst', changefreq: 'monthly', priority: '0.6' },
  { path: '/cet-to-est', changefreq: 'monthly', priority: '0.6' },
  { path: '/gmt-to-cst-converter', changefreq: 'monthly', priority: '0.6' },
  { path: '/hawaii-to-est', changefreq: 'monthly', priority: '0.6' },
  { path: '/jst-to-cst-converter', changefreq: 'monthly', priority: '0.6' },
  { path: '/pst-to-cst-converter', changefreq: 'monthly', priority: '0.6' },
  { path: '/utc-8-to-utc-5', changefreq: 'monthly', priority: '0.6' },
  { path: '/utc-to-cst-converter', changefreq: 'monthly', priority: '0.6' },
  { path: '/est-to-cst-converter', changefreq: 'monthly', priority: '0.6' },
  { path: '/ist-to-est-converter', changefreq: 'monthly', priority: '0.6' },
  // 辅助页
  { path: '/time-units', changefreq: 'monthly', priority: '0.5' },
  { path: '/timestamp-evidence', changefreq: 'monthly', priority: '0.5' },
  { path: '/world-map', changefreq: 'monthly', priority: '0.5' },
  { path: '/embed-widget', changefreq: 'monthly', priority: '0.5' },
  { path: '/remote-team-timezone-tools', changefreq: 'monthly', priority: '0.5' },
  { path: '/remote-work-timezone', changefreq: 'monthly', priority: '0.5' },
  { path: '/distributed-team-time-culture', changefreq: 'monthly', priority: '0.5' },
  // 已移除 /widget/：widget/ 目录下只有 world-clock.html，无 index.html，
  // Preview 环境实测返回 404；生产环境被域名边缘规则覆盖返回反爬拦截页。
  // 该地址从未是有效页面，不应提交。（2026-09-11 实测）
  { path: '/about', changefreq: 'monthly', priority: '0.4' },
  { path: '/contact', changefreq: 'monthly', priority: '0.4' },
  { path: '/subscribe', changefreq: 'monthly', priority: '0.3' },
  { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' }
];

/** 首页的多语言版本 */
export const HOME_LANGS = [
  { hreflang: 'en', path: '/en/' },
  { hreflang: 'zh-CN', path: '/' },
  { hreflang: 'de', path: '/de/' },
  { hreflang: 'fr', path: '/fr/' },
  { hreflang: 'es', path: '/es/' },
  { hreflang: 'ja', path: '/ja/' },
  { hreflang: 'ko', path: '/ko/' },
  { hreflang: 'pt-BR', path: '/pt/' },
  { hreflang: 'ar', path: '/ar/' }
];

/** 构造单个 <url> 节点 */
export function buildUrlNode(loc, changefreq, priority, lastmod, alternates) {
  const alt = Array.isArray(alternates) && alternates.length
    ? '\n' + alternates.map(a => `    <xhtml:link rel="alternate" hreflang="${escapeXml(a.hreflang)}" href="${escapeXml(a.href)}"/>`).join('\n')
    : '';
  return `  <url>
    <loc>${escapeXml(loc)}</loc>${alt}
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`;
}

/** 构造 urlset 文档 */
export function buildUrlset(nodes) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${nodes.join('\n')}
</urlset>`;
}

/** 构造 sitemapindex 文档 */
export function buildSitemapIndex(entries, lastmod) {
  const nodes = entries.map(e => `  <sitemap>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
  </sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${nodes.join('\n')}
</sitemapindex>`;
}

export const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400'
};

/**
 * 生成 XML 响应
 *
 * ⚠️ 刻意不使用 KV 缓存。
 *
 * 原因（2026-09-11 线上实测踩坑）：KV 缓存 key 是静态字符串，
 * 代码更新后 key 不变 -> 线上长期返回旧内容。实测 STATIC_PAGES
 * 已从 49 降到 46，线上 /sitemap/pages.xml 仍返回 49 条（含 noindex 页）。
 *
 * sitemap 生成只是内存字符串拼接（几十 KB，毫秒级），与 KV 读写成本相当，
 * 因此直接实时生成，只输出 HTTP 缓存头交给 CDN / 浏览器按 TTL 缓存。
 * 这样代码一部署即生效，不存在「已修复但线上没变」的问题。
 */
export async function serveXml(context, producer) {
  const xml = await producer();
  return new Response(xml, { headers: XML_HEADERS });
}

/** 今日日期（用于 lastmod） */
export function todayStr() {
  return new Date().toISOString().split('T')[0];
}
