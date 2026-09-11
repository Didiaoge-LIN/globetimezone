/**
 * ============================================================
 * /sitemap.xml — 站点地图索引
 *
 * v3.0（2026-09-11 权重治理）
 *
 * 旧版问题：索引只指向 5 个 compare 分片，19,900 条同构薄页占满整个
 * sitemap，而 200 个城市页、46 个工具页一条都没提交 —— 权重结构失衡。
 *
 * 新版：按页面价值分片，只提交真实内容。
 *   /sitemap/pages.xml   静态核心页 + 工具页
 *   /sitemap/cities.xml  城市页（zh 默认 + 8 语言）
 *   /sitemap/compare.xml 对比页（仅 Tier 1 核心枢纽组合）
 * ============================================================
 */

import { SITE_BASE, buildSitemapIndex, serveXml, todayStr } from './lib/sitemap-utils.js';

const ENTRIES = [
  { loc: `${SITE_BASE}/sitemap/pages.xml` },
  { loc: `${SITE_BASE}/sitemap/cities.xml` },
  { loc: `${SITE_BASE}/sitemap/compare.xml` }
];

export async function onRequestGet(context) {
  return serveXml(context, async () => {
    return buildSitemapIndex(ENTRIES, todayStr());
  });
}
