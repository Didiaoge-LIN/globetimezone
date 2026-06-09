/**
 * i18n.js v3.0 — 纯前端国际化引擎
 * 
 * 核心逻辑：
 * 1. 从 URL 路径检测当前语言（/en/ → en，/zh/ → zh，/ → 默认 zh）
 * 2. 【同步】立即给所有内部链接加语言前缀（不等 JSON 加载）
 * 3. 【异步】加载 /locales/{lang}.json 并翻译 data-i18n 元素
 * 
 * HTML 用法：
 *   <span data-i18n="nav.timezones">时差查询</span>
 *   <h1 data-i18n-html="hero.title">标题含<br>换行</h1>
 *   <input data-i18n-attr="placeholder:form.email">
 */

(function () {
  'use strict';

  // ─── 配置 ──────────────────────────────────────────────
  var SUPPORTED = ['en', 'zh', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'];
  var LANG_PREFIX_RE = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\//;

  // ─── 从 URL 检测当前语言 ───────────────────────────────
  function detectLanguage() {
    var path = window.location.pathname;
    var match = path.match(/^\/([a-z]{2})\//);
    if (match && SUPPORTED.indexOf(match[1]) !== -1) {
      return match[1];
    }

    // 根路径或非语言目录页面：查 localStorage
    var manual = localStorage.getItem('gtz_lang_manual');
    if (manual && SUPPORTED.indexOf(manual) !== -1) return manual;

    return 'zh'; // 默认中文
  }

  var LANG = detectLanguage();

  // 设置 <html lang>（同步，立刻生效）
  document.documentElement.lang = LANG;

  // ─── 【同步】内部链接加语言前缀 ────────────────────────
  // 这是最关键的功能：用户在 /en/ 页面点链接，
  // 必须自动加上 /en/ 前缀，否则会丢失语言上下文
  function prefixInternalLinks() {
    // 根路径不加前缀（本身就是中文版）
    if (!LANG_PREFIX_RE.test(window.location.pathname)) return;

    var prefix = '/' + LANG;
    var links = document.querySelectorAll('a[href^="/"]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var href = (link.getAttribute('href') || '').trim();

      // 跳过：已有语言前缀
      if (LANG_PREFIX_RE.test(href)) continue;

      // 跳过：语言切换器（data-lang 属性）
      if (link.hasAttribute('data-lang')) continue;

      // 跳过：锚点、mailto、tel、javascript
      if (/^(\/#|mailto:|tel:|javascript:)/.test(href)) continue;

      // 加前缀
      link.setAttribute('href', prefix + href);
    }
  }

  // ─── 【同步】语言切换器链接更新 ────────────────────────
  function updateLangSwitcherLinks() {
    var path = window.location.pathname;
    // 去掉语言前缀得到真实页面路径
    var pagePath = path.replace(/^\/[a-z]{2}\//, '/');
    if (pagePath === '/index.html') pagePath = '/';

    var langMap = { 'en':'/en','zh':'/zh','de':'/de','fr':'/fr',
      'es':'/es','ja':'/ja','ko':'/ko','pt':'/pt','ar':'/ar' };

    var links = document.querySelectorAll('#lang-drop a[data-lang]');
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      var targetLang = link.getAttribute('data-lang');
      var prefix = langMap[targetLang] || '/' + targetLang;
      link.href = (pagePath === '/') ? prefix + '/' : prefix + pagePath;
    }
  }

  // ─── 【同步】立即执行链接前缀（不等 DOM 加载完）───────
  // 用 MutationObserver 持续监听，确保动态添加的链接也被处理
  function setupLinkPrefixer() {
    // 立即执行一次
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        prefixInternalLinks();
        updateLangSwitcherLinks();
      });
    } else {
      prefixInternalLinks();
      updateLangSwitcherLinks();
    }

    // 监听 DOM 变化（处理动态渲染的内容）
    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function () {
        prefixInternalLinks();
        updateLangSwitcherLinks();
      });
      var observe = function () {
        observer.observe(document.body || document.documentElement, {
          childList: true, subtree: true
        });
      };
      if (document.body) {
        observe();
      } else {
        document.addEventListener('DOMContentLoaded', observe);
      }
    }
  }

  setupLinkPrefixer();

  // ─── 【异步】加载语言包并翻译 ────────────────────────
  var TRANSLATIONS = {};
  var LOCALE_URL = '/locales/' + LANG + '.json';

  // ─── 从 URL 路径生成页面 slug（匹配 Python 脚本的 key 前缀）─────
  function detectPageSlug() {
    var path = window.location.pathname;
    // 去掉语言前缀
    var pagePath = path.replace(/^\/(en|zh|de|fr|es|ja|ko|pt|ar)/, '');
    // 去掉 .html
    pagePath = pagePath.replace(/\.html$/, '');
    // /index → 空
    pagePath = pagePath.replace(/\/index$/, '');
    // 去掉首尾 /
    pagePath = pagePath.replace(/^\/+|\/+$/g, '');
    // 转换为 slug: time-in/new-york → timein.newyork
    var slug = pagePath.replace(/\//g, '.').replace(/-/g, '');
    return slug || 'home';
  }

  function applyTranslations() {
    // 1. HTML 内容：[data-i18n-html]（保留 <br> 等）
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    for (var i = 0; i < htmlEls.length; i++) {
      var key = htmlEls[i].getAttribute('data-i18n-html');
      if (TRANSLATIONS[key] !== undefined) {
        htmlEls[i].innerHTML = TRANSLATIONS[key];
      }
    }

    // 2. 纯文本：[data-i18n]（排除同时有 data-i18n-html 的元素）
    var textEls = document.querySelectorAll('[data-i18n]');
    for (var j = 0; j < textEls.length; j++) {
      // 跳过已用 data-i18n-html 处理的元素
      if (textEls[j].hasAttribute('data-i18n-html')) continue;
      var tKey = textEls[j].getAttribute('data-i18n');
      if (TRANSLATIONS[tKey] !== undefined) {
        textEls[j].textContent = TRANSLATIONS[tKey];
      }
    }

    // 3. 属性：[data-i18n-attr="attr:key;attr:key"]
    var attrEls = document.querySelectorAll('[data-i18n-attr]');
    for (var k = 0; k < attrEls.length; k++) {
      var spec = attrEls[k].getAttribute('data-i18n-attr');
      var pairs = spec.split(';');
      for (var m = 0; m < pairs.length; m++) {
        var parts = pairs[m].split(':');
        if (parts.length === 2) {
          var attr = parts[0].trim();
          var aKey = parts[1].trim();
          if (TRANSLATIONS[aKey] !== undefined) {
            attrEls[k].setAttribute(attr, TRANSLATIONS[aKey]);
          }
        }
      }
    }

    // 4. <title> — 优先用页面级 key，回退到 meta.title
    var pageTitleKey = detectPageSlug() + '.meta.title';
    if (TRANSLATIONS[pageTitleKey]) {
      document.title = TRANSLATIONS[pageTitleKey];
    } else if (TRANSLATIONS['meta.title']) {
      document.title = TRANSLATIONS['meta.title'];
    }

    // 5. <meta name="description"> — 优先用页面级 key
    var metaDescEl = document.querySelector('meta[name="description"]');
    if (metaDescEl) {
      var pageDescKey = detectPageSlug() + '.meta.desc';
      if (TRANSLATIONS[pageDescKey]) {
        metaDescEl.setAttribute('content', TRANSLATIONS[pageDescKey]);
      } else if (TRANSLATIONS['meta.description']) {
        metaDescEl.setAttribute('content', TRANSLATIONS['meta.description']);
      }
    }

    // 6. 更新语言切换器按钮文字
    updateLangSwitcherButton();

    // 7. 再次确保链接前缀（翻译可能改变了 DOM）
    prefixInternalLinks();
  }

  function updateLangSwitcherButton() {
    var btn = document.getElementById('lang-btn');
    if (!btn) return;
    var labels = {
      'zh': '🌐 中文 ▾', 'en': '🌐 English ▾', 'de': '🌐 Deutsch ▾',
      'fr': '🌐 Français ▾', 'es': '🌐 Español ▾', 'ja': '🌐 日本語 ▾',
      'ko': '🌐 한국어 ▾', 'pt': '🌐 Português ▾', 'ar': '🌐 العربية ▾'
    };
    var span = btn.querySelector('span[data-i18n]');
    if (span) {
      span.textContent = labels[LANG] || '🌐 English ▾';
    } else {
      btn.innerHTML = (labels[LANG] || '🌐 English ▾');
    }
  }

  // ─── 加载语言包 ──────────────────────────────────────
  function loadTranslations() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', LOCALE_URL + '?v=' + (window.GTZ_VERSION || '1'), true);
    xhr.timeout = 5000;
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        try {
          TRANSLATIONS = JSON.parse(xhr.responseText);
          applyTranslations();
        } catch (e) {
          console.error('[i18n] JSON parse error:', e);
        }
      }
    };
    xhr.ontimeout = function () {
      console.warn('[i18n] Locale load timeout:', LOCALE_URL);
    };
    xhr.send();
  }

  // 启动翻译加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTranslations);
  } else {
    loadTranslations();
  }

})();
