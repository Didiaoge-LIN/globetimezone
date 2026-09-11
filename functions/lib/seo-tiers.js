'use strict';

/**
 * ============================================================
 * SEO 分级模块 — 权重治理核心
 * ============================================================
 * 背景（2026-09-11 站点分析结论）：
 *   sitemap 共 20,100 条，其中 19,900 条是两两对比页
 *   （/compare/{A}-and-{B}-time-difference），单页仅约 24 个词，
 *   内容高度同构。属于典型的 thin content / doorway page 特征，
 *   会在域名级拉低质量评分，导致 1% 的真实内容页（城市页/工具页）
 *   一起无法获得收录权重。
 *
 * 治理策略：对比页分级收录
 *   - Tier 1（indexable）：全球核心枢纽城市两两组合，真实存在搜索需求，
 *     且内容增强后可提供差异化信息 → 正常收录 + 进 sitemap
 *   - Tier 2（noindex, follow）：其余组合 → 保持可访问（站内导航/内链不断链），
 *     但不参与索引、不进 sitemap
 *
 * 效果：可收录对比页从 19,900 降到 ~1,540，降幅约 92%
 * ============================================================
 */

/**
 * 全球核心枢纽城市（56 个）
 * 选取标准：跨时区商务/出行搜索需求最高的城市，覆盖全球主要经济圈
 */
export const CORE_CITY_SLUGS = Object.freeze([
  // 大中华区
  'beijing', 'shanghai', 'guangzhou', 'shenzhen', 'hong-kong', 'taipei',
  // 东亚
  'tokyo', 'osaka', 'seoul',
  // 东南亚 / 南亚
  'singapore', 'bangkok', 'jakarta', 'manila', 'kuala-lumpur', 'ho-chi-minh',
  'mumbai', 'delhi', 'bangalore',
  // 中东
  'dubai', 'doha', 'riyadh', 'istanbul',
  // 欧洲
  'london', 'paris', 'berlin', 'frankfurt', 'amsterdam', 'madrid', 'rome',
  'milan', 'zurich', 'stockholm', 'vienna', 'warsaw', 'dublin', 'moscow',
  // 北美
  'new-york', 'los-angeles', 'chicago', 'san-francisco', 'seattle',
  'washington-dc', 'boston', 'miami', 'toronto', 'vancouver', 'mexico-city',
  // 拉美
  'sao-paulo', 'buenos-aires',
  // 大洋洲
  'sydney', 'melbourne', 'auckland',
  // 非洲
  'cairo', 'johannesburg', 'nairobi', 'lagos'
]);

const CORE_SET = new Set(CORE_CITY_SLUGS);

/**
 * 判断一个 slug 是否为核心枢纽城市
 * @param {string} slug
 * @returns {boolean}
 */
export function isCoreCity(slug) {
  return CORE_SET.has(String(slug || '').toLowerCase());
}

/**
 * 判断一个对比页是否应当被搜索引擎收录
 * 规则：两端城市均属于核心枢纽 → 可收录
 * @param {string} slugA
 * @param {string} slugB
 * @returns {boolean}
 */
export function isIndexableCompare(slugA, slugB) {
  return isCoreCity(slugA) && isCoreCity(slugB);
}

/**
 * 返回对比页分级：1 = 可收录，2 = 仅可访问（noindex）
 * @returns {1|2}
 */
export function getCompareTier(slugA, slugB) {
  return isIndexableCompare(slugA, slugB) ? 1 : 2;
}

/**
 * 生成全部 Tier 1（可收录）对比页的 [slugA, slugB] 有序对
 *
 * 顺序规则：严格沿用历史 sitemap 的生成顺序（按 getAllCities() 的键序，
 * 取 i < j），确保新老 URL 完全一致、零跳转、零重定向churn。
 *
 * @param {string[]} [orderedAllSlugs] 全部城市 slug（按城市数据的键序）
 * @returns {Array<[string, string]>}
 */
export function getIndexableComparePairs(orderedAllSlugs) {
  const list = (Array.isArray(orderedAllSlugs) && orderedAllSlugs.length)
    ? orderedAllSlugs
    : [...CORE_CITY_SLUGS].sort();

  const pairs = [];
  for (let i = 0; i < list.length; i++) {
    if (!CORE_SET.has(list[i])) continue;
    for (let j = i + 1; j < list.length; j++) {
      if (!CORE_SET.has(list[j])) continue;
      pairs.push([list[i], list[j]]);
    }
  }
  return pairs;
}

/**
 * 为某个城市挑选「相关对比页」内链候选（仅返回核心城市对，避免浪费抓取预算）
 * 注意：调用方需自行按城市键序确定 slugA/slugB 的先后，保证 URL 规范
 * @param {string} slug 当前城市
 * @param {number} limit 最多返回条数
 * @returns {Array<{slug: string, other: string}>}
 */
export function getRelatedComparePairs(slug, limit = 8) {
  const current = String(slug || '').toLowerCase();
  if (!CORE_SET.has(current)) return [];

  const result = [];
  for (const other of CORE_CITY_SLUGS) {
    if (other === current) continue;
    result.push({ slug: current, other });
    if (result.length >= limit) break;
  }
  return result;
}

/**
 * 统计信息（构建期/诊断用）
 */
export function getTierStats(totalCityCount = 200) {
  const coreCount = CORE_CITY_SLUGS.length;
  const indexable = coreCount * (coreCount - 1) / 2;
  const total = totalCityCount * (totalCityCount - 1) / 2;
  return {
    coreCities: coreCount,
    totalCities: totalCityCount,
    indexableComparePages: indexable,
    noindexComparePages: total - indexable,
    totalComparePages: total,
    reductionRatio: Number(((1 - indexable / total) * 100).toFixed(2))
  };
}
