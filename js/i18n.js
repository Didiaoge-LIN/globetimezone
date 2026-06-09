/**
 * i18n.js v1.0 — 纯前端国际化引擎
 * 
 * 工作原理：
 * 1. 从 URL 路径检测当前语言（/en/ → en，/zh/ → zh，/ → 默认 zh）
 * 2. 加载对应的 /locales/{lang}.json 语言包
 * 3. 遍历所有 [data-i18n] 元素，替换文本内容
 * 4. 遍历所有 [data-i18n-attr] 元素，替换属性值（placeholder、aria-label 等）
 *
 * HTML 用法：
 *   <span data-i18n="nav.timezones">时差查询</span>
 *   <input data-i18n-attr="placeholder:form.email" placeholder="请输入邮箱">
 *   <meta data-i18n-attr="content:meta.description" name="description" content="...">
 */

(function () {
  'use strict';

  // ─── 从 URL 检测当前语言 ───────────────────────────────
  function detectLanguage() {
    var path = window.location.pathname;

    // /en/xxx → en
    var match = path.match(/^\/([a-z]{2})\//);
    if (match) {
      var lang = match[1];
      var supported = ['en', 'zh', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'];
      if (supported.indexOf(lang) !== -1) {
        return lang;
      }
    }

    // 根路径：检查 localStorage 手动选择
    var manual = localStorage.getItem('gtz_lang_manual');
    if (manual) return manual;

    // 根路径：浏览器语言检测（仅首次）
    if (!sessionStorage.getItem('gtz_i18n_checked')) {
      sessionStorage.setItem('gtz_i18n_checked', '1');
      var browserLang = (navigator.language || 'zh').toLowerCase();
      var langPrefix = browserLang.split('-')[0];
      var supportedMap = {
        'en': 'en', 'zh': 'zh', 'de': 'de', 'fr': 'fr',
        'es': 'es', 'ja': 'ja', 'ko': 'ko', 'pt': 'pt', 'ar': 'ar'
      };
      if (supportedMap[langPrefix]) {
        // 写入手动选择，避免反复跳转
        localStorage.setItem('gtz_lang_manual', supportedMap[langPrefix]);
        return supportedMap[langPrefix];
      }
    }

    return 'zh'; // 默认中文
  }

  // ─── 当前语言 ─────────────────────────────────────────
  var LANG = detectLanguage();
  var LOCALE_URL = '/locales/' + LANG + '.json';

  // 设置 <html lang>
  document.documentElement.lang = LANG;

  // ─── 加载语言包并渲染 ────────────────────────────────
  var TRANSLATIONS = {};

  function applyTranslations() {
    // 0. 隐藏 body 防止 FOUT（首次渲染后再显示）
    var bodyHidden = document.body.style.opacity === '0';
    if (!bodyHidden) {
      document.body.style.opacity = '0';
    }

    // 1. HTML 内容替换：[data-i18n-html]（保留 <br> 等标签）
    var htmlNodes = document.querySelectorAll('[data-i18n-html]');
    for (var i = 0; i < htmlNodes.length; i++) {
      var el = htmlNodes[i];
      var key = el.getAttribute('data-i18n-html');
      if (TRANSLATIONS[key] !== undefined) {
        el.innerHTML = TRANSLATIONS[key];
      }
    }

    // 2. 纯文本替换：[data-i18n]
    var textNodes = document.querySelectorAll('[data-i18n]');
    for (var j = 0; j < textNodes.length; j++) {
      var el2 = textNodes[j];
      var key2 = el2.getAttribute('data-i18n');
      if (TRANSLATIONS[key2] !== undefined) {
        el2.textContent = TRANSLATIONS[key2];
      }
    }

    // 2. 属性替换：[data-i18n-attr="attr1:key1;attr2:key2"]
    //    例如：data-i18n-attr="placeholder:form.email;aria-label:form.emailDesc"
    var attrNodes = document.querySelectorAll('[data-i18n-attr]');
    for (var j = 0; j < attrNodes.length; j++) {
      var el2 = attrNodes[j];
      var spec = el2.getAttribute('data-i18n-attr');
      var pairs = spec.split(';');
      for (var k = 0; k < pairs.length; k++) {
        var parts = pairs[k].split(':');
        if (parts.length === 2) {
          var attr = parts[0].trim();
          var tKey = parts[1].trim();
          if (TRANSLATIONS[tKey] !== undefined) {
            el2.setAttribute(attr, TRANSLATIONS[tKey]);
          }
        }
      }
    }

    // 3. 特殊：<title>
    if (TRANSLATIONS['meta.title']) {
      document.title = TRANSLATIONS['meta.title'];
    }

    // 4. 特殊：<meta name="description">
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && TRANSLATIONS['meta.description']) {
      metaDesc.setAttribute('content', TRANSLATIONS['meta.description']);
    }

    // 5. 更新语言切换器当前语言显示
    updateLangSwitcherLabel();
  }

  function updateLangSwitcherLabel() {
    var btn = document.getElementById('lang-btn');
    if (!btn) return;
    var labels = {
      'zh': '🌐 中文 ▾',
      'en': '🌐 English ▾',
      'de': '🌐 Deutsch ▾',
      'fr': '🌐 Français ▾',
      'es': '🌐 Español ▾',
      'ja': '🌐 日本語 ▾',
      'ko': '🌐 한국어 ▾',
      'pt': '🌐 Português ▾',
      'ar': '🌐 العربية ▾'
    };
    btn.innerHTML = (labels[LANG] || '🌐 English ▾') + ' <span style="font-size:0.7em;">▾</span>';
  }

  // ─── 动态更新语言切换器的链接 ────────────────────────
  function updateLangSwitcherLinks() {
    // 当前页面路径（不含语言前缀）
    var path = window.location.pathname;
    var pagePath = path.replace(/^\/[a-z]{2}\//, '/');

    // 如果是根路径（语言目录下的 index.html）
    if (pagePath === '/' || pagePath === '/index.html') {
      pagePath = '/';
    }

    var langMap = {
      'en': '/en', 'zh': '/zh', 'de': '/de', 'fr': '/fr',
      'es': '/es', 'ja': '/ja', 'ko': '/ko', 'pt': '/pt', 'ar': '/ar'
    };

    var links = document.querySelectorAll('#lang-drop a[data-lang]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var targetLang = link.getAttribute('data-lang');
      var prefix = langMap[targetLang] || '/' + targetLang;
      if (pagePath === '/') {
        link.href = prefix + '/';
      } else {
        link.href = prefix + pagePath;
      }
    }
  }

  // ─── 加载语言包 ──────────────────────────────────────
  function loadTranslations() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', LOCALE_URL + '?v=' + (window.GTZ_VERSION || '1'), true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          try {
            TRANSLATIONS = JSON.parse(xhr.responseText);
            applyTranslations();
            updateLangSwitcherLinks();
          } catch (e) {
            console.error('[i18n] Failed to parse locale JSON:', e);
          }
        } else {
          console.warn('[i18n] Failed to load locale:', LOCALE_URL);
        }
      }
    };
    xhr.send();
  }

  // ─── 启动 ────────────────────────────────────────────
  // 如果 DOM 已就绪，立即执行；否则等 DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTranslations);
  } else {
    loadTranslations();
  }

})();
