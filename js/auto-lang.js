/**
 * auto-lang.js v3.1 — GlobeTimeZone 浏览器语言自动检测 + 智能跳转
 *
 * 在 <head> 中同步加载，页面渲染前完成跳转。
 * SEO 安全：跳过搜索引擎爬虫。
 *
 * 核心原则：
 *   - 用户主动导航到某个语言区 → 绝对尊重，不拽走
 *   - 用户点了语言切换器 → 全站跟随
 *   - 只在"无语言区的页面"做自动引导
 *
 * v3.1 修复：自动检测引导不再对语言子目录内的页面生效
 *           （v3.0 会把手动输入 /en/ 的用户拽走）
 */
(function () {
  'use strict';

  var AUTO_KEY    = 'gtz_lang_auto';   // 自动检测存储的语言
  var MANUAL_KEY  = 'gtz_lang_manual'; // 用户手动选择的语言
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

  // 所有语言子目录前缀（用于判断当前页是否在语言区内）
  var LANG_PREFIXES = ['/en/', '/zh/', '/de/', '/fr/', '/es/', '/ja/', '/ko/', '/pt/', '/ar/'];

  var currentPath = window.location.pathname;

  /* ================================================================
   * 4. 判断当前页是否已在某个语言子目录内
   * ================================================================ */
  function isInLangDir(path) {
    for (var i = 0; i < LANG_PREFIXES.length; i++) {
      if (path.indexOf(LANG_PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  /* ================================================================
   * 5. 情况A：用户手动选择过语言（gtz_lang_manual 存在）
   *    → 全站强制跟随手动选择
   *    → 如果当前页已经在正确的语言区，不跳转
   *    → 如果当前页在错误的语言区（用户点错了），跳转到正确区
   *    → 如果当前页不在任何语言区（如 /about），跳转到正确区
   * ================================================================ */
  var manualLang = (localStorage.getItem(MANUAL_KEY) || '').toLowerCase();
  if (manualLang) {
    var manualShort  = manualLang.split('-')[0];
    var manualTarget = LANG_PATHS[manualLang] || LANG_PATHS[manualShort];
    if (manualTarget) {
      // 当前页已在手动选择的语言区 → 不跳转
      if (currentPath.indexOf(manualTarget) === 0) return;

      // 当前页在其他语言区 → 跳转到手动选择的语言区首页
      // （只有用户点语言切换器时才会设 gtz_lang_manual，
      //   切换器本身会 href 到目标语言页，这里只处理边缘情况）
      if (isInLangDir(currentPath)) {
        // 在某个语言区内但不是手动选择的 → 可能是外部链接
        // 不拽走，让用户留在当前语言页
        return;
      }

      // 不在任何语言区 → 跳转到手动选择的语言区
      window.location.replace(manualTarget);
      return;
    }
  }

  /* ================================================================
   * 6. 情况B：用户没有手动选择过 → 自动检测引导
   *    关键原则：如果用户已经在某个语言子目录内，不拽走！
   *    只对"不在任何语言子目录的页面"做自动引导
   * ================================================================ */
  // 如果当前页已在某个语言子目录内 → 尊重用户选择，不跳转
  if (isInLangDir(currentPath)) return;

  var browserLang      = (navigator.language || 'en').toLowerCase();
  var browserLangShort = browserLang.split('-')[0];

  // 查找浏览器语言对应的目标路径
  var targetPath = LANG_PATHS[browserLang] || LANG_PATHS[browserLangShort];
  if (!targetPath) return; // 不支持的语言，留在当前页

  // 当前页的 <html lang> 匹配浏览器语言 → 不跳转
  var pageLang      = (document.documentElement.lang || '').toLowerCase();
  var pageLangShort = pageLang.split('-')[0];
  if (pageLangShort && pageLangShort === browserLangShort) return;

  // 避免死循环
  var currentClean = currentPath.replace(/\/$/, '') || '/';
  var targetClean  = targetPath.replace(/\/$/, '') || '/';
  if (currentClean === targetClean) return;

  // 记录自动检测结果
  localStorage.setItem(AUTO_KEY, browserLang);

  // 跳转
  window.location.replace(targetPath);

})();
