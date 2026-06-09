/**
 * auto-lang.js v5.0 — 仅处理根路径语言引导
 * 
 * 唯一职责：用户访问根路径（/ 或 /index.html）时，
 * 根据浏览器语言或 localStorage 偏好，重写到对应语言目录。
 * 
 * 已进入语言目录（/en/、/zh/ 等）的，绝不干预。
 * 页面内容翻译由 js/i18n.js 负责。
 */

(function () {
  'use strict';

  var path = window.location.pathname;

  // ─── 只在根路径生效 ──────────────────────────────
  // 已进入 /en/、/zh/ 等语言目录 → 直接退出
  if (path.match(/^\/(en|zh|de|fr|es|ja|ko|pt|ar)\//)) return;

  // 非根页面（如 /about.html）→ 不处理（i18n.js 会处理）
  if (path!== '/' && path!== '/index.html') return;

  // ─── 跳过爬虫 ────────────────────────────────────
  var ua = (navigator.userAgent || '').toLowerCase();
  if (/(bot|crawler|spider|slurp|bingbot|duckduckbot|baiduspider|yandex)/i.test(ua)) return;

  // ─── 用户已手动选择过语言 → 尊重偏好 ───────────
  var manual = localStorage.getItem('gtz_lang_manual');
  if (manual) {
    window.location.replace('/' + manual + '/');
    return;
  }

  // ─── 首次访问：根据浏览器语言引导 ──────────────
  var browserLang = (navigator.language || 'zh').toLowerCase();
  var langPrefix  = browserLang.split('-')[0];
  var SUPPORTED   = ['en', 'zh', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'];

  // 记录自动选择（写入 manual，避免反复跳转）
  var targetLang = SUPPORTED.indexOf(langPrefix)!== -1 ? langPrefix : 'zh';
  localStorage.setItem('gtz_lang_manual', targetLang);

  // 中文用户访问根路径 → 不跳转（根路径本身就是中文）
  if (targetLang === 'zh') return;

  // 非中文用户 → 跳转到对应语言目录
  window.location.replace('/' + targetLang + '/');
})();
