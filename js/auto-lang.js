/**
 * auto-lang.js v3.0 — GlobeTimeZone 浏览器语言自动检测 + 智能跳转
 *
 * 在 <head> 中同步加载，页面渲染前完成跳转。
 * SEO 安全：跳过搜索引擎爬虫。
 *
 * v3.0 核心逻辑重写：
 *   - 区分"自动检测"和"手动选择"两种 localStorage 来源
 *   - 自动检测（gtz_lang_auto）：只在用户无偏好时引导，不覆盖用户当前选择
 *   - 手动选择（gtz_lang_manual）：用户点了语言切换器，全站强制跟随
 *   - 修复 v2.0 Bug：自动检测存的 zh-cn 会在用户手动访问 /en/ 时把人拽走
 */
(function () {
  'use strict';

  var AUTO_KEY   = 'gtz_lang_auto';   // 自动检测存储的语言
  var MANUAL_KEY = 'gtz_lang_manual'; // 用户手动选择的语言
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
   * 4. 读取当前页面语言
   * ================================================================ */
  var pageLang      = (document.documentElement.lang || '').toLowerCase();
  var pageLangShort = pageLang.split('-')[0];

  /* ================================================================
   * 5. 情况A：用户手动选择过语言（gtz_lang_manual 存在）
   *    → 强制跟随手动选择，全站跳转到该语言区
   * ================================================================ */
  var manualLang = (localStorage.getItem(MANUAL_KEY) || '').toLowerCase();
  if (manualLang) {
    var manualShort  = manualLang.split('-')[0];
    var manualTarget = LANG_PATHS[manualLang] || LANG_PATHS[manualShort];
    if (!manualTarget) return; // 不支持的语言，不跳转

    // 当前页已经在目标语言区（URL前缀或 lang 属性匹配）
    if (window.location.pathname.indexOf(manualTarget) === 0) return;
    if (pageLangShort && pageLangShort === manualShort) return;

    // 跳转
    window.location.replace(manualTarget);
    return;
  }

  /* ================================================================
   * 6. 情况B：用户没有手动选择过 → 自动检测引导
   *    只在"当前页语言与浏览器语言不匹配"时跳转
   *    且不会覆盖用户主动导航到的语言区
   * ================================================================ */
  var browserLang      = (navigator.language || 'en').toLowerCase();
  var browserLangShort = browserLang.split('-')[0];

  // 当前页语言已经匹配浏览器语言 → 不跳转
  if (pageLangShort && pageLangShort === browserLangShort) return;

  // 查找浏览器语言对应的目标路径
  var targetPath = LANG_PATHS[browserLang] || LANG_PATHS[browserLangShort];
  if (!targetPath) return; // 不支持的语言，留在当前页

  // 当前已在目标语言区 → 不跳转
  if (window.location.pathname.indexOf(targetPath) === 0) return;

  // 避免死循环
  var currentClean = window.location.pathname.replace(/\/$/, '') || '/';
  var targetClean  = targetPath.replace(/\/$/, '') || '/';
  if (currentClean === targetClean) return;

  // 记录自动检测结果（不覆盖手动选择）
  localStorage.setItem(AUTO_KEY, browserLang);

  // 跳转
  window.location.replace(targetPath);

})();
