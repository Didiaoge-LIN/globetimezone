/**
 * GlobeTimeZone 广告解锁 — 页面加载器（非ES Module）
 * 用普通script标签引入，内部用import()动态加载ES Module
 * 避免 Cloudflare Rocket Loader 拦截内联脚本的import()
 */
(function() {
  'use strict';

  var AD_UNLOCK_READY = false;
  var uiMod = null;
  var constMod = null;

  // 预加载ad-unlock模块
  function preloadModules() {
    if (AD_UNLOCK_READY) return Promise.resolve();
    return Promise.all([
      import('/js/ad-unlock/ui-components.js'),
      import('/js/ad-unlock/constants.js')
    ]).then(function(results) {
      uiMod = results[0];
      constMod = results[1];
      uiMod.initAdUnlock();
      AD_UNLOCK_READY = true;
      console.log('[ad-unlock] modules loaded');
    }).catch(function(e) {
      console.error('[ad-unlock] module load failed:', e);
    });
  }

  // 打开解锁弹窗
  window.gtzOpenUnlockModal = function(scene, rightType) {
    if (!AD_UNLOCK_READY) {
      console.log('[ad-unlock] not ready, preloading...');
      preloadModules().then(function() {
        if (AD_UNLOCK_READY) {
          showModal(scene, rightType);
        } else {
          alert('解锁功能加载失败，请刷新页面重试');
        }
      });
      return;
    }
    showModal(scene, rightType);
  };

  function showModal(scene, rightType) {
    try {
      var s = scene || constMod.FunctionScene.MEETING_PLANNER;
      var r = rightType || constMod.RightType.LIGHT;
      var modal = new uiMod.UnlockModal(s, r);
      modal.show();
      console.log('[ad-unlock] modal shown:', s, r);
    } catch(e) {
      console.error('[ad-unlock] modal error:', e);
      alert('弹窗创建失败: ' + e.message);
    }
  }

  // 检查是否有解锁权益
  window.gtzHasRight = function(scene) {
    if (!AD_UNLOCK_READY || !uiMod || !uiMod.getRightsManager) return false;
    var rm = uiMod.getRightsManager();
    if (!rm) return false;
    return rm.hasRight(scene || constMod.FunctionScene.MEETING_PLANNER);
  };

  // 初始化：DOM ready后预加载模块+绑定按钮
  function init() {
    // 预加载模块（异步，不阻塞页面）
    preloadModules();

    // 绑定所有带 data-gtz-unlock 属性的按钮
    var btns = document.querySelectorAll('[data-gtz-unlock]');
    for (var i = 0; i < btns.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          var scene = btn.getAttribute('data-gtz-scene') || '';
          var rightType = btn.getAttribute('data-gtz-right') || '';
          window.gtzOpenUnlockModal(scene, rightType);
        });
        console.log('[ad-unlock] button bound:', btn.id || btn.className);
      })(btns[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
