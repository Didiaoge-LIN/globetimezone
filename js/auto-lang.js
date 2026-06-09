/**
 * auto-lang.js v2.0 — GlobeTimeZone 浏览器语言自动检测 + 智能跳转
 *
 * 在 <head> 中同步加载，页面渲染前完成跳转。
 * SEO 安全：跳过搜索引擎爬虫。
 *
 * 优先级（高→低）：
 *   1. 用户手动选择的语言（localStorage.gtz_lang）
 *   2. 浏览器语言（navigator.language）
 *   3. 不支持的语言 → 留在当前页
 *
 * v2.0 修复：用户手动选了语言后，访问任意页面（包括根目录）
 *           都会被正确引导到对应语言区，而不是停留在当前页。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'gtz_lang';
  var CHECKED_KEY = 'gtz_lang_ck';

  /* ================================================================
   * 1. 每会话只检测一次（sessionStorage 防重复执行）
   * ================================================================ */
  if (sessionStorage.getItem(CHECKED_KEY)) return;
  sessionStorage.setItem(CHECKED_KEY, '1');

  /* ================================================================
   * 2. 跳过爬虫 / 机器人（SEO 安全）
   * ================================================================ */
  var ua = navigator.userAgent.toLowerCase();
  if (/bot|crawler|spider|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|whatsapp|telegrambot|discordbot|slackbot|linkedinbot|applebot|petalbot/i.test(ua)) {
    return;
  }

  /* ================================================================
   * 3. 语言 → URL 前缀映射表
   *    key: 语言代码（全小写）  value: 网站对应的语言子目录前缀
   * ================================================================ */
  var LANG_PATHS = {
    'en':    '/en/', 'en-us': '/en/', 'en-gb': '/en/', 'en-au': '/en/', 'en-ca': '/en/', 'en-nz': '/en/', 'en-ie': '/en/',
    'zh':    '/zh/', 'zh-cn': '/zh/', 'zh-tw': '/zh/', 'zh-hk': '/zh/', 'zh-sg': '/zh/',
    'de':    '/de/', 'de-de': '/de/', 'de-at': '/de/', 'de-ch': '/de/',
    'fr':    '/fr/', 'fr-fr': '/fr/', 'fr-ca': '/fr/', 'fr-be': '/fr/', 'fr-ch': '/fr/',
    'es':    '/es/', 'es-es': '/es/', 'es-mx': '/es/', 'es-ar': '/es/', 'es-co': '/es/',
    'ja':    '/ja/', 'ja-jp': '/ja/',
    'ko':    '/ko/', 'ko-kr': '/ko/',
    'pt':    '/pt/', 'pt-br': '/pt/', 'pt-pt': '/pt/',
    'ar':    '/ar/', 'ar-sa': '/ar/', 'ar-eg': '/ar/', 'ar-ae': '/ar/'
  };

  /* ================================================================
   * 4. 确定"目标语言"
   *    优先使用用户手动选择的语言，其次浏览器语言
   * ================================================================ */
  var savedLang    = (localStorage.getItem(STORAGE_KEY) || '').toLowerCase();
  var browserLang  = (navigator.language || 'en').toLowerCase();
  var effectiveLang = savedLang || browserLang;
  var effectiveLangShort = effectiveLang.split('-')[0];

  var targetPath = LANG_PATHS[effectiveLang] || LANG_PATHS[effectiveLangShort];
  if (!targetPath) return; // 不支持的语言，留在当前页

  /* ================================================================
   * 5. 检查当前页是否已经在目标语言区
   *    判断依据：URL 路径前缀 或 <html lang> 匹配
   * ================================================================ */
  var currentPath  = window.location.pathname;
  var targetPrefix = targetPath; // e.g. '/en/'

  // 当前路径已经以目标语言前缀开头 → 不跳转
  if (currentPath.indexOf(targetPrefix) === 0) return;

  // 辅助判断：<html lang> 短码匹配目标语言 → 认为已在正确语言页
  var pageLang      = (document.documentElement.lang || '').toLowerCase();
  var pageLangShort = pageLang.split('-')[0];
  if (pageLangShort && pageLangShort === effectiveLangShort) return;

  /* ================================================================
   * 6. 避免死循环：目标路径与当前路径完全相同
   * ================================================================ */
  var currentClean = currentPath.replace(/\/$/, '') || '/';
  var targetClean  = targetPrefix.replace(/\/$/, '') || '/';
  if (currentClean === targetClean) return;

  /* ================================================================
   * 7. 记录偏好（若尚未记录）→ 跳转
   *    replace() 不产生额外浏览器历史记录
   * ================================================================ */
  if (!savedLang) {
    localStorage.setItem(STORAGE_KEY, browserLang);
  }
  window.location.replace(targetPrefix);

})();
