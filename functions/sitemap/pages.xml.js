/**
 * /sitemap/pages.xml — 静态核心页 + 工具页
 *
 * 说明：首页的多语言版本（/en/、/de/ …）经实测为同一份中文 HTML
 * （canonical 均指向 /），属客户端 i18n 渲染的重复页，故不提交。
 */

import {
  SITE_BASE, STATIC_PAGES,
  buildUrlNode, buildUrlset, serveXml, todayStr
} from '../lib/sitemap-utils.js';

export async function onRequestGet(context) {
  return serveXml(context, 'sitemap:v3:pages', async () => {
    const today = todayStr();
    const nodes = STATIC_PAGES.map(page =>
      buildUrlNode(`${SITE_BASE}${page.path}`, page.changefreq, page.priority, today)
    );
    return buildUrlset(nodes);
  });
}
