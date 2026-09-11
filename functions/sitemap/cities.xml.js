/**
 * /sitemap/cities.xml — 城市时间页
 *
 * 覆盖：200 城市 ×（中文默认 + 8 个语言版本）= 1,800 条
 * 说明：
 *   - 中文默认地址为 /city/{slug}/（不带语言前缀）
 *   - /zh/city/{slug}/ 与中文默认页内容相同、canonical 指向默认页，故不提交
 *   - 非中文语言版本经实测为真实本地化页面（title/h1/html lang 均本地化，
 *     canonical 自指），故正常提交并输出 hreflang 互指
 */

import {
  SITE_BASE, INDEXABLE_LANGS,
  buildUrlNode, buildUrlset, serveXml, todayStr
} from '../lib/sitemap-utils.js';
import { getAllCities } from '../city/data/index.js';

const CITY_SLUGS = Object.keys(getAllCities());

/** 某城市页的全部 hreflang 互指 */
function alternatesFor(slug) {
  const list = [{ hreflang: 'zh-CN', href: `${SITE_BASE}/city/${slug}/` }];
  for (const lang of INDEXABLE_LANGS) {
    list.push({ hreflang: lang, href: `${SITE_BASE}/${lang}/city/${slug}/` });
  }
  list.push({ hreflang: 'x-default', href: `${SITE_BASE}/city/${slug}/` });
  return list;
}

export async function onRequestGet(context) {
  return serveXml(context, async () => {
    const today = todayStr();
    const nodes = [];

    for (const slug of CITY_SLUGS) {
      // hreflang 互指只需在默认语言条目上声明一次，避免体积成倍膨胀
      nodes.push(buildUrlNode(`${SITE_BASE}/city/${slug}/`, 'daily', '0.7', today, alternatesFor(slug)));
      for (const lang of INDEXABLE_LANGS) {
        nodes.push(buildUrlNode(`${SITE_BASE}/${lang}/city/${slug}/`, 'weekly', '0.5', today));
      }
    }

    return buildUrlset(nodes);
  });
}
