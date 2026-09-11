/**
 * /sitemap/compare-{n}.xml — 历史分片地址兼容
 *
 * v3.0 起 sitemap 重构为 pages / cities / compare 三个分片。
 * 旧分片地址（compare-1..5）保留 302 跳转，避免搜索引擎
 * 继续抓取到 404 影响 sitemap 健康度。
 */

import { SITE_BASE } from '../lib/sitemap-utils.js';

export async function onRequestGet(context) {
  // 只接受纯数字分片号，避免与 /sitemap/compare.xml 互相重定向成环
  const page = String(context?.params?.page || '');
  if (!/^\d+$/.test(page)) {
    return new Response('Not Found', { status: 404 });
  }
  return Response.redirect(`${SITE_BASE}/sitemap/compare.xml`, 302);
}
