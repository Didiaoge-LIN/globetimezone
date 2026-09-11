/**
 * /sitemap/compare.xml — 时差对比页（仅 Tier 1）
 *
 * 权重治理核心：只提交全球核心枢纽城市的两两组合（56 城 → 1,540 页）。
 * 其余 18,360 条长尾组合保持可访问但不收录（noindex, follow），
 * 避免同构薄页在域名级稀释质量评分。
 */

import {
  SITE_BASE, SUB_SITEMAP_LIMIT,
  buildUrlNode, buildUrlset, serveXml, todayStr
} from '../lib/sitemap-utils.js';
import { getAllCities } from '../city/data/index.js';
import { getIndexableComparePairs } from '../lib/seo-tiers.js';

const CITY_SLUGS = Object.keys(getAllCities());
const PAIRS = getIndexableComparePairs(CITY_SLUGS);

export async function onRequestGet(context) {
  return serveXml(context, 'sitemap:v3:compare', async () => {
    const today = todayStr();
    const nodes = PAIRS.slice(0, SUB_SITEMAP_LIMIT).map(([a, b]) =>
      buildUrlNode(
        `${SITE_BASE}/compare/${a}-and-${b}-time-difference`,
        'weekly',
        '0.6',
        today
      )
    );
    return buildUrlset(nodes);
  });
}
