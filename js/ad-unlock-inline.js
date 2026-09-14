/**
 * GlobeTimeZone 广告解锁 — 纯内联版（不依赖ES Module）
 * 完全自包含，不被Rocket Loader干扰
 */
(function() {
  'use strict';

  // 场景配置
  var SCENES = {
    meeting_planner: { video: '/assets/videos/high/meeting_001.mp4', videoLow: '/assets/videos/low/meeting_001.mp4', duration: 8, name: 'Meeting Planner', unlockTime: '1 hour' },
    world_clock: { video: '/assets/videos/high/world_clock_001.mp4', videoLow: '/assets/videos/low/world_clock_001.mp4', duration: 8, name: 'World Clock', unlockTime: '1 hour' },
    time_difference: { video: '/assets/videos/high/time_diff_001.mp4', videoLow: '/assets/videos/low/time_diff_001.mp4', duration: 8, name: 'Time Difference', unlockTime: '1 hour' },
    cross_border: { video: '/assets/videos/high/cross_border_001.mp4', videoLow: '/assets/videos/low/cross_border_001.mp4', duration: 20, name: 'Cross Border', unlockTime: '24 hours' },
    other: { video: '/assets/videos/high/collection_001.mp4', videoLow: '/assets/videos/low/collection_001.mp4', duration: 8, name: 'All Features', unlockTime: '1 hour' }
  };

  var STORAGE_KEY = 'gtz_func_rights_v1';

  // 检查是否已有权益
  function hasRight(scene) {
    try {
      var rights = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      var r = rights[scene];
      if (!r) return false;
      return Date.now() < r.expiresAt;
    } catch(e) { return false; }
  }

  // 保存权益
  function saveRight(scene, durationHours) {
    try {
      var rights = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      rights[scene] = { grantedAt: Date.now(), expiresAt: Date.now() + durationHours * 3600000 };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rights));
    } catch(e) {}
  }

  // 创建弹窗
  function createModal(scene) {
    var config = SCENES[scene] || SCENES.other;
    var duration = config.duration;
    var unlockHours = config.unlockTime.indexOf('24') >= 0 ? 24 : 1;

    // 遮罩
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:999999;display:flex;align-items:center;justify-content:center;';

    // 弹窗
    var modal = document.createElement('div');
    modal.style.cssText = 'background:#fff;border-radius:12px;padding:24px;max-width:480px;width:90%;box-shadow:0 4px 24px rgba(0,0,0,0.2);position:relative;font-family:sans-serif;';

    // 关闭按钮
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:8px;right:12px;background:none;border:none;font-size:24px;cursor:pointer;color:#999;padding:4px 8px;';
    closeBtn.onclick = function() { overlay.remove(); };
    overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };

    // 标题
    var title = document.createElement('div');
    title.style.cssText = 'font-size:16px;font-weight:600;color:#1a1a1a;margin-bottom:12px;text-align:center;';
    title.textContent = 'Watch ' + duration + 's video to unlock ' + config.unlockTime;

    // 视频容器
    var videoWrap = document.createElement('div');
    videoWrap.style.cssText = 'position:relative;width:100%;background:#000;border-radius:8px;overflow:hidden;margin-bottom:12px;aspect-ratio:16/9;';

    // 视频
    var video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.style.cssText = 'width:100%;height:100%;display:block;';
    video.src = config.video;
    videoWrap.appendChild(video);

    // 加载提示
    var loading = document.createElement('div');
    loading.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:#fff;font-size:14px;';
    loading.textContent = 'Loading...';
    videoWrap.appendChild(loading);

    // 进度条
    var progressBar = document.createElement('div');
    progressBar.style.cssText = 'position:absolute;bottom:0;left:0;height:4px;background:#165DFF;width:0%;transition:width 0.3s;';
    videoWrap.appendChild(progressBar);

    // 状态文字
    var status = document.createElement('div');
    status.style.cssText = 'font-size:13px;color:#666;text-align:center;margin-bottom:8px;';
    status.textContent = 'Video is muted. Watch ' + duration + 's to unlock.';

    // 按钮（初始隐藏）
    var unlockBtn = document.createElement('button');
    unlockBtn.textContent = 'Unlock Now';
    unlockBtn.style.cssText = 'display:none;width:100%;padding:12px;background:#165DFF;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:500;cursor:pointer;';
    unlockBtn.onclick = function() {
      saveRight(scene, unlockHours);
      overlay.remove();
      showSuccess(config);
    };

    modal.appendChild(closeBtn);
    modal.appendChild(title);
    modal.appendChild(videoWrap);
    modal.appendChild(status);
    modal.appendChild(unlockBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 视频事件
    video.addEventListener('canplaythrough', function() {
      loading.style.display = 'none';
      video.play().catch(function(e) {
        loading.textContent = 'Tap to play';
        loading.onclick = function() { video.play(); loading.style.display = 'none'; };
      });
    });

    video.addEventListener('timeupdate', function() {
      var pct = (video.currentTime / duration) * 100;
      if (pct > 100) pct = 100;
      progressBar.style.width = pct + '%';
      var remain = Math.max(0, Math.ceil(duration - video.currentTime));
      status.textContent = remain + 's remaining...';
    });

    video.addEventListener('ended', function() {
      progressBar.style.width = '100%';
      status.textContent = 'Completed! Click below to unlock.';
      status.style.color = '#165DFF';
      status.style.fontWeight = '600';
      unlockBtn.style.display = 'block';
    });

    video.addEventListener('error', function() {
      loading.textContent = 'Video failed. Click to retry.';
      loading.style.cursor = 'pointer';
      loading.onclick = function() {
        video.src = config.videoLow;
        video.load();
        loading.textContent = 'Loading...';
      };
    });

    // 加载超时
    setTimeout(function() {
      if (video.readyState < 3) {
        loading.textContent = 'Slow connection. Trying low quality...';
        video.src = config.videoLow;
        video.load();
      }
    }, 3000);
  }

  // 成功提示
  function showSuccess(config) {
    var toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#10b981;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:999999;box-shadow:0 2px 12px rgba(0,0,0,0.2);';
    toast.textContent = 'Unlocked! ' + config.name + ' is now available for ' + config.unlockTime + '.';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 4000);
  }

  // 全局API
  window.gtzOpenUnlockModal = function(scene) {
    createModal(scene || 'meeting_planner');
  };

  window.gtzHasRight = function(scene) {
    return hasRight(scene || 'meeting_planner');
  };

  // 绑定所有 data-gtz-unlock 按钮
  function init() {
    var btns = document.querySelectorAll('[data-gtz-unlock]');
    for (var i = 0; i < btns.length; i++) {
      (function(btn) {
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          var scene = btn.getAttribute('data-gtz-scene') || 'meeting_planner';
          createModal(scene);
        });
      })(btns[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
