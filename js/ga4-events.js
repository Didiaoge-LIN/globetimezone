/**
 * GlobeTimeZone — GA4 核心事件追踪模块
 * v1.0 | 2026-06-25
 *
 * 职责：
 *   1. 确保 GA4 (gtag) 已加载，未加载则动态注入
 *   2. 暴露 GTZ.track(name, params) 统一埋点函数（同时推送 GA4 + 百度统计）
 *   3. 根据页面路径自动触发核心事件（view_pricing / crossborder_check）
 *
 * 5个核心事件：
 *   - timezone_convert  时区转换（首页添加城市/查看时间）
 *   - meeting_plan      会议规划（点击会议规划器）
 *   - crossborder_check 跨境工具（访问跨境页面）
 *   - add_bookmark      收藏城市（点击☆收藏）
 *   - view_pricing      访问定价页
 *
 * 用法：
 *   GTZ.track('timezone_convert', { city: 'Asia/Tokyo' });
 */
(function () {
  'use strict';

  var GA_ID = 'G-Q285R7YZH';

  // 确保 gtag 已加载
  if (typeof window.gtag !== 'function') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID, { send_page_view: true, cookie_flags: 'SameSite=None;Secure' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  // 统一追踪函数
  function track(name, params) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, params || {});
      }
      if (typeof window._hmt !== 'undefined' && window._hmt.push) {
        window._hmt.push(['_trackEvent', name, 'interact', JSON.stringify(params || {}).slice(0, 50)]);
      }
    } catch (e) { /* 静默容错 */ }
  }

  // 暴露全局 API
  window.GTZ = window.GTZ || {};
  window.GTZ.track = track;
  window.GTZ.GA_ID = GA_ID;

  // ─── 页面自动追踪 ───
  // 根据当前页面路径自动触发核心事件
  var path = window.location.pathname;

  // view_pricing：访问定价页
  if (path.indexOf('/pricing') === 0 || path.indexOf('/pro') === 0) {
    track('view_pricing', { page: path });
  }

  // crossborder_check：访问跨境工具页
  if (path.indexOf('/tools/cross-border') === 0) {
    track('crossborder_check', { page: path });
  }

  // timezone_convert：首页时间转换器使用（延迟绑定，等 custom-cities 加载）
  // meeting_plan：由 meeting-planner.js 主动调用
  // add_bookmark：由 custom-cities.js 主动调用

})();
