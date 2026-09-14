/**
 * /sitemap/pages.xml — 静态核心页 + 工具页
 *
 * 【2026-09-14 变更】首页开始提交多语言 hreflang 集群。
 *   原注释：首页的 /en/、/de/ … 经实测为同一份中文 HTML（canonical 均指向 /），
 *           属客户端 i18n 渲染的重复页，故不提交。
 *   现状：/functions/[[path]].js 已对 /<lang>/ 做整页服务端本地化
 *         （见 functions/lib/home-i18n.js），各语言页 lang / title / description /
 *         canonical 均已自指，已是合法独立页面，因此把 9 语言 hreflang 集群
 *         写入首页条目的 xhtml:link，供搜索引擎建立语言关联与抓取。
 */

import {
  SITE_BASE, STATIC_PAGES, NOINDEX_PATHS, HOME_LANGS,
  buildUrlNode, buildUrlset, serveXml, todayStr
} from '../lib/sitemap-utils.js';

export async function onRequestGet(context) {
  return serveXml(context, async () => {
    const today = todayStr();

    // 首页的 10 条 hreflang（9 语言 + x-default，与页面内 <head> 完全一致）
    const homeAlternates = HOME_LANGS.map(l => ({
      hreflang: l.hreflang,
      href: `${SITE_BASE}${l.path}`
    }));

    // 防御性过滤：任何自带 noindex 的页面都不提交，
    // 否则 GSC 会报 "Submitted URL marked 'noindex'"
    const nodes = STATIC_PAGES
      .filter(page => !NOINDEX_PATHS.has(page.path))
      .map(page =>
        buildUrlNode(
          `${SITE_BASE}${page.path}`,
          page.changefreq,
          page.priority,
          today,
          page.path === '/' ? homeAlternates : null
        )
      );
    return buildUrlset(nodes);
  });
}
