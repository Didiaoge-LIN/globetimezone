'use strict';

/**
 * 城市数据懒加载分发器
 * 当前阶段：直接引用 city-data.js（CF Pages Functions 会整体打包）
 * 未来优化：按大洲拆分为 asia.js/europe.js/americas.js 实现按需加载
 * 当前优先保证架构正确性，性能优化可渐进式推进
 */

import { CITIES } from '../city-data.js';

// 城市 slug → 大洲映射表（为未来拆分预留）
const CONTINENT_MAP = Object.freeze({
  // 亚洲
  beijing: 'asia', shanghai: 'asia', tokyo: 'asia', seoul: 'asia',
  'hong-kong': 'asia', singapore: 'asia', mumbai: 'asia', delhi: 'asia',
  bangkok: 'asia', dubai: 'asia', jakarta: 'asia', taipei: 'asia',
  manila: 'asia', 'kuala-lumpur': 'asia', 'ho-chi-minh': 'asia',
  riyadh: 'asia', dhaka: 'asia', karachi: 'asia', osaka: 'asia',
  istanbul: 'asia', chengdu: 'asia', guangzhou: 'asia', shenzhen: 'asia',
  hangzhou: 'asia', wuhan: 'asia', nanjing: 'asia', chongqing: 'asia',
  xian: 'asia', suzhou: 'asia', tianjin: 'asia', bangalore: 'asia',
  chennai: 'asia', hyderabad: 'asia', kolkata: 'asia', hanoi: 'asia',
  'phnom-penh': 'asia', yangon: 'asia', kathmandu: 'asia', colombo: 'asia',
  'dhaka-2': 'asia', tehran: 'asia', baghdad: 'asia', jeddah: 'asia',
  doha: 'asia', 'kuwait-city': 'asia', muscat: 'asia', busan: 'asia',
  nagoya: 'asia', sapporo: 'asia', fukuoka: 'asia', penang: 'asia',
  'yangon-2': 'asia', ulaanbaatar: 'asia', tashkent: 'asia', almaty: 'asia',
  bishkek: 'asia', surabaya: 'asia', pune: 'asia', ahmedabad: 'asia',
  lahore: 'asia', amman: 'asia', tbilisi: 'asia', baku: 'asia', 
  kobe: 'asia', sendai: 'asia', daegu: 'asia', incheon: 'asia',
  medan: 'asia', beirut: 'asia', changsha: 'asia', zhengzhou: 'asia',
  fuzhou: 'asia', kunming: 'asia', haikou: 'asia', dalian: 'asia',
  qingdao: 'asia', xiamen: 'asia', harbin: 'asia', shenyang: 'asia',

  // 欧洲
  london: 'europe', paris: 'europe', berlin: 'europe', moscow: 'europe',
  madrid: 'europe', rome: 'europe', amsterdam: 'europe', zurich: 'europe',
  stockholm: 'europe', vienna: 'europe', warsaw: 'europe', lisbon: 'europe',
  athens: 'europe', copenhagen: 'europe', helsinki: 'europe', dublin: 'europe',
  prague: 'europe', bucharest: 'europe', budapest: 'europe', oslo: 'europe',
  munich: 'europe', frankfurt: 'europe', hamburg: 'europe', barcelona: 'europe',
  milan: 'europe', brussels: 'europe', geneva: 'europe', edinburgh: 'europe',
  manchester: 'europe', lyon: 'europe', marseille: 'europe', 'st-petersburg': 'europe',
  novosibirsk: 'europe', kiev: 'europe', minsk: 'europe', tallinn: 'europe',
  riga: 'europe', vilnius: 'europe', zagreb: 'europe', sofia: 'europe',
  belgrade: 'europe', reykjavik: 'europe', bratislava: 'europe',
  ljubljana: 'europe',

  // 美洲
  'new-york': 'americas', 'los-angeles': 'americas', chicago: 'americas',
  'san-francisco': 'americas', toronto: 'americas', vancouver: 'americas',
  'mexico-city': 'americas', denver: 'americas', seattle: 'americas',
  miami: 'americas', boston: 'americas', houston: 'americas', atlanta: 'americas',
  phoenix: 'americas', 'washington-dc': 'americas', montreal: 'americas',
  honolulu: 'americas', anchorage: 'americas', 'sao-paulo': 'americas',
  'buenos-aires': 'americas', 'rio-de-janeiro': 'americas', bogota: 'americas',
  santiago: 'americas', lima: 'americas', dallas: 'americas', minneapolis: 'americas',
  detroit: 'americas', 'san-diego': 'americas', portland: 'americas',
  'las-vegas': 'americas', nashville: 'americas', austin: 'americas',
  calgary: 'americas', ottawa: 'americas', monterrey: 'americas',
  'bogota-2': 'americas', caracas: 'americas', montevideo: 'americas',
  cancun: 'americas', 'panama-city': 'americas', quito: 'americas',
  'la-paz': 'americas', asuncion: 'americas',

  // 大洋洲
  sydney: 'oceania', melbourne: 'oceania', auckland: 'oceania',
  brisbane: 'oceania', perth: 'oceania', wellington: 'oceania',
  darwin: 'oceania', adelaide: 'oceania', hobart: 'oceania',
  christchurch: 'oceania', fiji: 'oceania', guam: 'oceania', samoa: 'oceania',

  // 非洲
  cairo: 'africa', johannesburg: 'africa', lagos: 'africa', nairobi: 'africa',
  casablanca: 'africa', 'addis-ababa': 'africa', accra: 'africa',
  'dar-es-salaam': 'africa', 'cape-town': 'africa', algiers: 'africa',
  tunis: 'africa', abuja: 'africa', kampala: 'africa', harare: 'africa',
  lusaka: 'africa', kinshasa: 'africa', abidjan: 'africa', dakar: 'africa',
  maputo: 'africa', kigali: 'africa', 'nairobi-2': 'africa'
});

/**
 * 获取单个城市的完整数据
 * @param {string} slug 城市slug（小写标准化）
 * @returns {object|null}
 */
export const getCityData = (slug) => {
  if (typeof slug !== 'string' || !slug) return null;
  return CITIES[slug] || null;
};

/**
 * 获取所有城市数据
 * @returns {object}
 */
export const getAllCities = () => CITIES;

/**
 * 获取所有有效slug集合
 * @returns {Set<string>}
 */
export const getValidSlugs = () => new Set(Object.keys(CITIES));

/**
 * 获取城市所属大洲
 * @param {string} slug 城市slug
 * @returns {string|null}
 */
export const getContinent = (slug) => CONTINENT_MAP[slug] || null;
