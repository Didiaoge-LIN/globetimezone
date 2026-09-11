/**
 * /sitemap/compare-{N}.xml — 历史分片地址兼容
 *
 * v3.0 起 sitemap 重构为 pages / cities / compare 三个分片。
 * 旧分片地址保留 301 永久跳转，避免搜索引擎继续抓取到 404
 * 影响 sitemap 健康度与已收录 URL 的更新。
 *
 * ⚠️ 必须使用带 `.xml` 的完整文件名（如 compare-1.xml.js）：
 * CF Pages 的动态段 `[page]` 不匹配含 `.` 的值，
 * 故 compare-[page].js 只能匹配 /sitemap/compare-1，
 * 无法匹配线上真实提交过的 /sitemap/compare-1.xml。（2026-09-11 实测踩坑）
 */

import { SITE_BASE } from '../lib/sitemap-utils.js';

export async function onRequestGet() {
  return Response.redirect(`${SITE_BASE}/sitemap/compare.xml`, 301);
}
