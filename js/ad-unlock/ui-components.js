/**
 * GlobeTimeZone 广告解锁权益体系 — 前端UI组件管理器
 * 文档版本：V3.0 §3.5 交互与视觉像素级规范
 * 
 * 负责创建和管理所有UI组件的DOM生命周期：
 *   1. 解锁弹窗（UnlockModal）
 *   2. 视频播放器（VideoPlayer）
 *   3. 权益卡片（RightCard）
 *   4. 打卡进度（CheckinProgress）
 *   5. 兜底提示（FallbackTip）
 *   6. 功能锁定遮罩（FeatureLockOverlay）
 *   7. 解锁入口按钮（UnlockEntry）
 */

import {
  RightType,
  FunctionScene,
  RIGHT_DURATION,
  UI_SPEC,
  VIDEO_CONFIG
} from './constants.js';
import { UnlockSession } from './unlock-session.js';
import { RightsManager } from './rights-manager.js';
import { CheckinManager } from './checkin-manager.js';
import { trackEvent } from './track.js';
import { getStandardNow } from './time-calibrate.js';

// ============================================================================
// 全局管理器实例（单例模式）
// ============================================================================
let rightsManager = null;
let checkinManager = null;

export function initAdUnlock() {
  rightsManager = new RightsManager();
  checkinManager = new CheckinManager();
  return { rightsManager, checkinManager };
}

export function getRightsManager() { return rightsManager; }
export function getCheckinManager() { return checkinManager; }

// ============================================================================
// 解锁弹窗（UnlockModal）
// 文档§3.5完整规范
// ============================================================================
export class UnlockModal {
  constructor(scene, rightType) {
    this.scene = scene;
    this.rightType = rightType;
    this._overlay = null;
    this._modal = null;
    this._session = null;
    this._resolvePromise = null;
  }

  // 创建弹窗DOM
  _createDOM() {
    // 遮罩层
    this._overlay = document.createElement('div');
    this._overlay.className = 'gtz-ad-overlay';
    this._overlay.addEventListener('click', (e) => {
      if (e.target === this._overlay) this.close();  // 文档§3.5：点击遮罩可关闭
    });

    // 弹窗主体
    this._modal = document.createElement('div');
    this._modal.className = 'gtz-ad-modal';

    // 关闭按钮（文档§3.4：右上角仅保留关闭按钮）
    const closeBtn = document.createElement('button');
    closeBtn.className = 'gtz-ad-close-btn';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', () => this.close());

    // 标题
    const title = document.createElement('div');
    title.className = 'gtz-ad-modal-title';
    const durationLabel = this.rightType === RightType.LIGHT ? '8s' : '20s';
    const timeLabel = this.rightType === RightType.LIGHT ? '1 hour' : '24 hours';
    title.textContent = `Watch ${durationLabel} to unlock ${timeLabel} access`;

    // 视频容器
    const videoContainer = document.createElement('div');
    videoContainer.className = 'gtz-ad-video-container';
    this._videoContainer = videoContainer;

    // 静音标识
    const mutedBadge = document.createElement('div');
    mutedBadge.className = 'gtz-ad-muted-badge';
    mutedBadge.textContent = '🔇 Muted';

    // 视频进度条
    const progressBar = document.createElement('div');
    progressBar.className = 'gtz-ad-video-progress';
    progressBar.style.width = '0%';
    this._progressBar = progressBar;

    videoContainer.appendChild(mutedBadge);
    videoContainer.appendChild(progressBar);

    // 骨架屏（初始显示）
    this._skeleton = document.createElement('div');
    this._skeleton.className = 'gtz-ad-skeleton';
    const skeletonVideo = document.createElement('div');
    skeletonVideo.className = 'gtz-ad-skeleton-video';
    const skeletonText = document.createElement('div');
    skeletonText.className = 'gtz-ad-skeleton-text';
    skeletonText.textContent = 'Loading unlock content...';
    this._skeleton.appendChild(skeletonVideo);
    this._skeleton.appendChild(skeletonText);

    // 按钮
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.justifyContent = 'space-between';
    btnContainer.style.alignItems = 'center';

    // 文案：文档§9.5核心文案
    const bodyText = document.createElement('div');
    bodyText.className = 'gtz-ad-modal-body';
    bodyText.innerHTML = `Complete video playback to unlock <strong>${this._getSceneName()}</strong> for ${timeLabel}. Video is muted by default.`;

    // 打卡提示
    const checkinHint = document.createElement('div');
    checkinHint.className = 'gtz-checkin-text';
    checkinHint.innerHTML = '3-day streak = 7 days ad-free ✨';

    this._modal.appendChild(closeBtn);
    this._modal.appendChild(title);
    this._modal.appendChild(bodyText);
    this._modal.appendChild(this._skeleton);
    this._modal.appendChild(videoContainer);
    this._modal.appendChild(checkinHint);

    this._overlay.appendChild(this._modal);
    document.body.appendChild(this._overlay);
  }

  // 获取场景名称
  _getSceneName() {
    const names = {
      [FunctionScene.MEETING_PLANNER]: 'Meeting Planner',
      [FunctionScene.WORLD_CLOCK]: 'World Clock Dashboard',
      [FunctionScene.TIME_DIFFERENCE]: 'Time Difference Calculator',
      [FunctionScene.CROSS_BORDER]: 'Cross-border Trading Clock',
      [FunctionScene.OTHER]: 'Advanced Features'
    };
    return names[this.scene] || 'this feature';
  }

  // 显示弹窗
  show() {
    this._createDOM();
    trackEvent('MODAL_SHOW', { scene: this.scene, right_type: this.rightType });

    // 创建解锁会话
    this._session = new UnlockSession(
      this.scene,
      this.rightType,
      () => this._onUnlockSuccess(),   // 成功回调
      () => this._onUnlockFallback()    // 兜底回调
    );

    this._session.onStateChange = (state) => this._updateUI(state);

    // 自动开始解锁
    this._session.handleUnlock();

    return new Promise((resolve) => {
      this._resolvePromise = resolve;
    });
  }

  // 更新UI状态
  _updateUI(state) {
    switch (state) {
      case 'loading':
        // 显示骨架屏，隐藏视频
        this._skeleton.style.display = 'block';
        this._videoContainer.style.display = 'none';
        break;
      case 'playing':
        // 隐藏骨架屏，显示视频
        this._skeleton.style.display = 'none';
        this._videoContainer.style.display = 'block';
        this._startProgressTracking();
        break;
      case 'success':
        // 显示成功动画
        this._showSuccess();
        break;
      case 'fallback':
        // 显示兜底提示
        this._showFallback();
        break;
    }
  }

  // 视频播放进度跟踪
  _startProgressTracking() {
    const duration = this._session.getVideoDuration();
    let startTime = Date.now();

    const updateProgress = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const percent = Math.min(100, (elapsed / duration) * 100);
      this._progressBar.style.width = `${percent}%`;

      if (elapsed < duration) {
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }

  // 解锁成功展示
  _showSuccess() {
    this._videoContainer.style.display = 'none';
    
    const successIcon = document.createElement('div');
    successIcon.className = 'gtz-ad-success-icon';
    successIcon.textContent = '✓';

    const successText = document.createElement('div');
    successText.className = 'gtz-ad-modal-title';
    const durationMs = RIGHT_DURATION[this.rightType];
    const durationLabel = this._formatDuration(durationMs);
    successText.textContent = `Unlocked! You have ${durationLabel} access`;

    this._modal.appendChild(successIcon);
    this._modal.appendChild(successText);
  }

  // 兜底提示展示
  _showFallback() {
    this._videoContainer.style.display = 'none';
    this._skeleton.style.display = 'none';

    const fallbackTip = document.createElement('div');
    fallbackTip.className = 'gtz-ad-fallback-tip';
    fallbackTip.innerHTML = `
      <div class="gtz-ad-fallback-tip-title">Slow network? No worries!</div>
      We've unlocked 10min for you. You can try watching the video again later.
    `;

    this._modal.appendChild(fallbackTip);
  }

  // 格式化时长
  _formatDuration(ms) {
    if (ms >= 24 * 60 * 60 * 1000) return `${Math.round(ms / (24 * 60 * 60 * 1000))} days`;
    if (ms >= 60 * 60 * 1000) return `${Math.round(ms / (60 * 60 * 1000))} hours`;
    if (ms >= 60 * 1000) return `${Math.round(ms / (60 * 1000))} minutes`;
    return `${Math.round(ms / 1000)} seconds`;
  }

  // 解锁成功回调
  _onUnlockSuccess() {
    // 发放权益
    const granted = rightsManager.grantRight(this.scene, this.rightType);
    
    // 打卡记录
    if (granted) {
      checkinManager.doCheckin();
      
      // 检查是否有待领取的7天无广告
      if (checkinManager.hasPendingAdfree) {
        checkinManager.claimAdfree();
        rightsManager.grantRight(FunctionScene.OTHER, RightType.ADFREE);
      }
    }

    if (this._resolvePromise) {
      this._resolvePromise({ success: true, granted });
    }
  }

  // 兜底回调
  _onUnlockFallback() {
    // 发放兜底权益
    const granted = rightsManager.grantRight(this.scene, RightType.FALLBACK);
    
    if (this._resolvePromise) {
      this._resolvePromise({ success: false, fallback: true, granted });
    }
  }

  // 关闭弹窗
  close() {
    if (this._session) {
      this._session.abortPlayback();
    }
    
    if (this._overlay) {
      this._overlay.classList.remove('active');
      setTimeout(() => {
        if (this._overlay && this._overlay.parentNode) {
          this._overlay.parentNode.removeChild(this._overlay);
        }
      }, 300);  // 等待动画完成
    }
    
    if (this._resolvePromise) {
      this._resolvePromise({ success: false, aborted: true });
      this._resolvePromise = null;
    }
  }
}

// ============================================================================
// 解锁入口按钮（UnlockEntry）
// 在进阶功能旁显示，用户点击触发解锁流程
// ============================================================================
export class UnlockEntry {
  constructor(scene, rightType, containerElement) {
    this.scene = scene;
    this.rightType = rightType;
    this.container = containerElement;
    this._button = null;
  }

  render() {
    // 检查是否已有权益
    if (rightsManager.hasRight(this.scene)) {
      return;  // 已解锁，不显示入口
    }

    // 检查日限是否已达上限
    if (rightsManager.isDailyLimitReached(this.rightType)) {
      this._renderLimitReached();
      return;
    }

    this._button = document.createElement('button');
    this._button.className = 'gtz-unlock-entry';

    const icon = document.createElement('span');
    icon.className = 'gtz-unlock-entry-icon';

    // 文档§9.5核心文案
    const durationLabel = this.rightType === RightType.LIGHT ? '8s' : '20s';
    const text = document.createElement('span');
    text.textContent = `Watch ${durationLabel} to unlock`;

    this._button.appendChild(icon);
    this._button.appendChild(text);

    this._button.addEventListener('click', () => {
      trackEvent('ENTRY_CLICK', {
        scene: this.scene,
        right_type: this.rightType,
        entry_position: 'inline_button'
      });
      this._startUnlock();
    });

    this.container.appendChild(this._button);
  }

  _renderLimitReached() {
    const tip = document.createElement('span');
    tip.className = 'gtz-ad-btn-link';
    tip.textContent = 'Daily limit reached — try tomorrow';
    this.container.appendChild(tip);
  }

  async _startUnlock() {
    const modal = new UnlockModal(this.scene, this.rightType);
    const result = await modal.show();

    if (result.success || result.fallback) {
      // 刷新功能状态
      this._refreshFeatureState();
    }
  }

  _refreshFeatureState() {
    // 移除旧按钮
    if (this._button && this._button.parentNode) {
      this._button.parentNode.removeChild(this._button);
    }
    // 不重新渲染（功能已解锁）
  }

  // 定期刷新（检查权益到期）
  startAutoRefresh() {
    this._refreshTimer = setInterval(() => {
      if (!rightsManager.hasRight(this.scene)) {
        this.render();  // 权益到期，重新显示入口
      }
    }, 60 * 1000);
  }

  destroy() {
    if (this._refreshTimer) clearInterval(this._refreshTimer);
  }
}

// ============================================================================
// 权益卡片（RightCard）
// 文档§2.5：实时显示剩余时间+打卡进度
// ============================================================================
export class RightCard {
  constructor(containerElement) {
    this.container = containerElement;
    this._timer = null;
  }

  render() {
    const summary = rightsManager.getActiveRightsSummary();
    
    // 清空容器
    this.container.innerHTML = '';

    if (summary.hasAdFree) {
      this._renderAdFreeCard(summary.adfreeRemaining);
    }

    summary.functionRights.forEach(right => {
      this._renderFunctionCard(right);
    });

    // 打卡进度
    this._renderCheckinProgress();

    // 启动定时刷新（每秒更新剩余时间）
    this._startRefresh();
  }

  _renderAdFreeCard(remainingMs) {
    const card = document.createElement('div');
    card.className = 'gtz-right-card';

    const header = document.createElement('div');
    header.className = 'gtz-right-card-header';

    const scene = document.createElement('span');
    scene.className = 'gtz-right-card-scene';
    scene.textContent = 'All Features';

    const time = document.createElement('span');
    time.className = 'gtz-right-card-time';
    time.id = 'gtz-adfree-time';
    time.textContent = this._formatRemaining(remainingMs);

    const type = document.createElement('span');
    type.className = 'gtz-right-card-type';
    type.textContent = 'AD-FREE';

    header.appendChild(scene);
    header.appendChild(type);
    header.appendChild(time);

    const bar = document.createElement('div');
    bar.className = 'gtz-right-card-bar';
    const fill = document.createElement('div');
    fill.className = 'gtz-right-card-bar-fill';
    fill.id = 'gtz-adfree-bar';
    fill.style.width = '100%';

    bar.appendChild(fill);

    card.appendChild(header);
    card.appendChild(bar);

    this.container.appendChild(card);
  }

  _renderFunctionCard(right) {
    const card = document.createElement('div');
    card.className = 'gtz-right-card';

    const header = document.createElement('div');
    header.className = 'gtz-right-card-header';

    const scene = document.createElement('span');
    scene.className = 'gtz-right-card-scene';
    scene.textContent = this._getSceneName(right.scene);

    const time = document.createElement('span');
    time.className = 'gtz-right-card-time';
    time.id = `gtz-right-time-${right.scene}`;
    time.textContent = this._formatRemaining(right.remaining);

    const type = document.createElement('span');
    type.className = 'gtz-right-card-type';
    type.textContent = right.type.toUpperCase();

    header.appendChild(scene);
    header.appendChild(type);
    header.appendChild(time);

    card.appendChild(header);
    this.container.appendChild(card);
  }

  _renderCheckinProgress() {
    const progress = document.createElement('div');
    progress.className = 'gtz-checkin-progress';

    const days = checkinManager.continuousDays;
    const target = 3;  // CHECKIN_TARGET_DAYS

    for (let i = 1; i <= target; i++) {
      const dayEl = document.createElement('div');
      dayEl.className = `gtz-checkin-day ${i <= days ? 'completed' : 'pending'}`;
      dayEl.textContent = i;

      progress.appendChild(dayEl);

      if (i < target) {
        const connector = document.createElement('div');
        connector.className = `gtz-checkin-connector ${i <= days ? 'completed' : ''}`;
        progress.appendChild(connector);
      }
    }

    const text = document.createElement('div');
    text.className = 'gtz-checkin-text';
    text.innerHTML = checkinManager.getProgressText();

    this.container.appendChild(progress);
    this.container.appendChild(text);
  }

  _formatRemaining(ms) {
    if (ms >= 24 * 60 * 60 * 1000) {
      const days = Math.floor(ms / (24 * 60 * 60 * 1000));
      const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      return `${days}d ${hours}h`;
    }
    if (ms >= 60 * 60 * 1000) {
      const hours = Math.floor(ms / (60 * 60 * 1000));
      const mins = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
      return `${hours}h ${mins}m`;
    }
    if (ms >= 60 * 1000) {
      const mins = Math.floor(ms / (60 * 1000));
      const secs = Math.floor((ms % (60 * 1000)) / 1000);
      return `${mins}m ${secs}s`;
    }
    return `${Math.round(ms / 1000)}s`;
  }

  _getSceneName(scene) {
    const names = {
      [FunctionScene.MEETING_PLANNER]: 'Meeting Planner',
      [FunctionScene.WORLD_CLOCK]: 'World Clock',
      [FunctionScene.TIME_DIFFERENCE]: 'Time Difference',
      [FunctionScene.CROSS_BORDER]: 'Cross-border Trading',
      [FunctionScene.OTHER]: 'Advanced'
    };
    return names[scene] || scene;
  }

  _startRefresh() {
    this._timer = setInterval(() => {
      const summary = rightsManager.getActiveRightsSummary();
      
      // 更新无广告剩余时间
      const adfreeEl = document.getElementById('gtz-adfree-time');
      if (adfreeEl) {
        if (summary.hasAdFree) {
          adfreeEl.textContent = this._formatRemaining(summary.adfreeRemaining);
        } else {
          adfreeEl.textContent = 'Expired';
        }
      }

      // 更新单功能剩余时间
      summary.functionRights.forEach(right => {
        const el = document.getElementById(`gtz-right-time-${right.scene}`);
        if (el) {
          el.textContent = this._formatRemaining(right.remaining);
        }
      });
    }, 1000);
  }

  destroy() {
    if (this._timer) clearInterval(this._timer);
  }
}

// ============================================================================
// 功能锁定遮罩（FeatureLockOverlay）
// 文档§2.1：进阶功能未解锁时显示锁定状态+解锁入口
// ============================================================================
export class FeatureLockOverlay {
  constructor(scene, rightType, featureContainer) {
    this.scene = scene;
    this.rightType = rightType;
    this.featureContainer = featureContainer;
    this._overlay = null;
    this._entry = null;
    this._refreshTimer = null;
  }

  render() {
    // 如果已有权益，不显示锁定遮罩
    if (rightsManager.hasRight(this.scene)) {
      this._removeOverlay();
      return;
    }

    // 创建锁定遮罩
    this._overlay = document.createElement('div');
    this._overlay.className = 'gtz-feature-locked-overlay';

    // 解锁入口按钮
    this._entry = new UnlockEntry(this.scene, this.rightType, this._overlay);
    this._entry.render();

    this.featureContainer.style.position = 'relative';
    this.featureContainer.appendChild(this._overlay);

    // 定期检查权益到期
    this._refreshTimer = setInterval(() => {
      if (rightsManager.hasRight(this.scene)) {
        this._removeOverlay();
      }
    }, 60 * 1000);
  }

  _removeOverlay() {
    if (this._overlay && this._overlay.parentNode) {
      this._overlay.parentNode.removeChild(this._overlay);
    }
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  destroy() {
    this._removeOverlay();
    if (this._entry) this._entry.destroy();
  }
}
