/**
 * auto-lang.js — GlobeTimeZone 浏览器语言自动检测 + 智能跳转
 * 
 * 在 <head> 中同步加载，页面渲染前完成跳转。
 * SEO 安全：跳过搜索引擎爬虫。
 * 用户选择优先：localStorage 记住手动选择，不再跳转。
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'gtz_lang';
  var CHECKED_KEY  = 'gtz_lang_ck';

  /* ================================================================
   * 1. 每会话只检测一次
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
   * 3. 尊重用户手动选择
   * ================================================================ */
  if (localStorage.getItem(STORAGE_KEY)) return;

  /* ================================================================
   * 4. 读取当前页面语言 & 浏览器语言
   * ================================================================ */
  var pageLang      = (document.documentElement.lang || 'en').toLowerCase();
  var pageLangShort = pageLang.split('-')[0];

  var browserLang      = (navigator.language || 'en').toLowerCase();
  var browserLangShort = browserLang.split('-')[0];

  /* ================================================================
   * 5. 语言 → URL 路径映射
   *    支持的浏览器语言代码 → 网站语言子目录
   *    不在此列表的语言（如 en/it/nl 等）→ 留在当前页
   * ================================================================ */
  var LANG_PATHS = {
    'zh':    '/zh/',    'zh-cn': '/zh/',   'zh-tw': '/zh/',   'zh-hk': '/zh/',   'zh-sg': '/zh/',
    'de':    '/de/',    'de-de': '/de/',   'de-at': '/de/',   'de-ch': '/de/',
    'fr':    '/fr/',    'fr-fr': '/fr/',   'fr-ca': '/fr/',   'fr-be': '/fr/',   'fr-ch': '/fr/',
    'es':    '/es/',    'es-es': '/es/',   'es-mx': '/es/',   'es-ar': '/es/',   'es-co': '/es/',
    'ja':    '/ja/',    'ja-jp': '/ja/',
    'ko':    '/ko/',    'ko-kr': '/ko/',
    'pt':    '/pt/',    'pt-br': '/pt/',   'pt-pt': '/pt/',
    'ar':    '/ar/',    'ar-sa': '/ar/',   'ar-eg': '/ar/',   'ar-ae': '/ar/'
  };

  /* ================================================================
   * 6. 页面语言已匹配 → 不跳转
   * ================================================================ */
  if (browserLangShort === pageLangShort) return;

  /* ================================================================
   * 7. 查找目标语言路径
   * ================================================================ */
  var targetPath = LANG_PATHS[browserLang] || LANG_PATHS[browserLangShort];
  if (!targetPath) return; // 不支持的语言，留在当前页

  /* ================================================================
   * 8. 避免跳转到同一页面（死循环保护）
   * ================================================================ */
  var currentPath  = window.location.pathname.replace(/\/$/, '') || '/';
  var targetClean  = targetPath.replace(/\/$/, '') || '/';

  if (currentPath === targetClean) return;

  /* ================================================================
   * 9. 保存偏好 → 跳转（replace 不污染浏览器历史）
   * ================================================================ */
  localStorage.setItem(STORAGE_KEY, browserLang);
  window.location.replace(targetPath);

})();
