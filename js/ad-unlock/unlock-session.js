/**
 * GlobeTimeZone 广告解锁权益体系 — 解锁会话管理
 * 文档版本：V3.0 终极落地执行操作手册 §4.7 + §3.3
 * 
 * 单会话状态锁实现（文档§3.3核心原则）：
 *   所有会话状态存入内部对象，不受外部重渲染影响
 *   核心变量：sessionId / isLoading / hasTriggeredFallback / countdownTimer / videoElement
 * 
 * 解锁流程（文档§3.3拦截逻辑）：
 *   1. 点击解锁 → 判断isLoading → true则直接return
 *   2. 生成唯一sessionId，设置isLoading=true
 *   3. 启动3000ms兜底倒计时
 *   4. 视频加载完成 → canplaythrough → 清除倒计时 → 进入播放
 *   5. 视频播放完成/失败/关闭 → 释放会话状态
 */

import {
  FALLBACK_THRESHOLD,
  FunctionScene,
  RightType,
  ERROR_CODES,
  VIDEO_CONFIG
} from './constants.js';
import { getVideoUrl, getVideoConfig } from './scene-video-map.js';
import { trackEvent } from './track.js';

// ============================================================================
// 解锁会话管理器
// ============================================================================
export class UnlockSession {
  constructor(scene, rightType, onSuccess, onFallback, videoContainer) {
    this.scene = scene;
    this.rightType = rightType;
    this.onSuccess = onSuccess;
    this.onFallback = onFallback;
    this._videoContainer = videoContainer || null;

    // 文档§3.3：会话状态存入内部对象（等效于useRef）
    this._state = {
      sessionId: '',
      isLoading: false,
      hasTriggeredFallback: false,
      hasPlayed: false,
      countdownTimer: null,
      videoElement: null
    };

    // 外部可观察的按钮状态
    this.buttonState = 'normal';  // normal | loading | playing | success | fallback

    // 视频配置
    this._videoConfig = getVideoConfig(scene);
    this._videoUrl = getVideoUrl(scene);
  }

  // ============================================================================
  // 清除会话状态
  // 文档§3.3内存泄漏防护：清除定时器、移除视频事件监听、销毁视频实例
  // ============================================================================
  _clearSession() {
    if (this._state.countdownTimer) {
      clearTimeout(this._state.countdownTimer);
      this._state.countdownTimer = null;
    }
    this._state.isLoading = false;
    this._state.hasPlayed = false;
  }

  // ============================================================================
  // 销毁会话（组件级清理）
  // ============================================================================
  destroy() {
    this._clearSession();
    if (this._state.videoElement) {
      const video = this._state.videoElement;
      video.removeEventListener('canplaythrough', this._handleCanPlay);
      video.removeEventListener('ended', this._handleEnded);
      video.removeEventListener('error', this._handleError);
      video.pause();
      video.src = '';
      this._state.videoElement = null;
    }
  }

  // ============================================================================
  // 兜底触发
  // 文档§3.3：防重复触发（hasTriggeredFallback标记）
  // ============================================================================
  _triggerFallback() {
    if (this._state.hasTriggeredFallback) return;
    this._state.hasTriggeredFallback = true;
    this._clearSession();
    this.buttonState = 'fallback';
    
    trackEvent('PLAY_FAIL', {
      scene: this.scene,
      right_type: this.rightType,
      error_code: ERROR_CODES.LOAD_TIMEOUT,
      error_reason: '3s timeout'
    });
    
    trackEvent('UNLOCK_FALLBACK', {
      scene: this.scene,
      right_type: RightType.FALLBACK,
      trigger_reason: 'timeout'
    });
    
    if (this.onFallback) this.onFallback();
  }

  // ============================================================================
  // 视频事件处理器
  // ============================================================================
  _handleCanPlay = () => {
    if (this._state.hasTriggeredFallback) return;

    // 清除兜底倒计时
    if (this._state.countdownTimer) {
      clearTimeout(this._state.countdownTimer);
      this._state.countdownTimer = null;
    }

    this.buttonState = 'playing';
    this._state.hasPlayed = true;

    // 自动播放（已静音，浏览器允许 muted autoplay）
    var video = this._state.videoElement;
    if (video) {
      var playPromise = video.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(function(e) {
          console.error('[ad-unlock] video play failed:', e);
        });
      }
    }

    trackEvent('PLAY_START', {
      scene: this.scene,
      right_type: this.rightType,
      video_id: this._videoConfig.videoId,
      bitrate: (navigator.connection && navigator.connection.effectiveType) || 'unknown'
    });

    // 通知外部状态变化
    this._notifyStateChange();
  };

  _handleEnded = () => {
    if (this._state.hasTriggeredFallback) return;
    this.buttonState = 'success';
    this._clearSession();
    
    trackEvent('PLAY_COMPLETE', {
      scene: this.scene,
      right_type: this.rightType,
      video_id: this._videoConfig.videoId,
      watch_duration: this._videoConfig.duration
    });
    
    // 文档§3.4：播放完成后停留1.2秒展示成功提示
    setTimeout(() => {
      if (this.onSuccess) this.onSuccess();
      this._notifyStateChange();
    }, VIDEO_CONFIG.SUCCESS_DELAY);
  };

  _handleError = () => {
    this._triggerFallback();
    this._notifyStateChange();
  };

  // ============================================================================
  // 核心解锁方法
  // 文档§3.3拦截逻辑完整实现
  // ============================================================================
  handleUnlock() {
    // 1. isLoading为true则直接return（防重复点击）
    if (this._state.isLoading || this._state.hasPlayed) return false;
    
    // 2. 生成唯一sessionId，设置isLoading=true
    this._state.isLoading = true;
    this._state.hasTriggeredFallback = false;
    this._state.sessionId = `unlock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.buttonState = 'loading';

    trackEvent('ENTRY_CLICK', {
      scene: this.scene,
      right_type: this.rightType,
      entry_position: 'function_button'
    });

    // 3. 启动3000ms兜底倒计时
    this._state.countdownTimer = setTimeout(() => {
      this._triggerFallback();
      this._notifyStateChange();
    }, FALLBACK_THRESHOLD);

    // 4. 创建视频元素并预加载
    const video = document.createElement('video');
    video.src = this._videoUrl;
    video.muted = true;                         // 文档§2.1：视频播放全程静音
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('disableremoteplayback', '');
    video.controls = false;                     // 禁止用户控制（文档§3.4）
    this._state.videoElement = video;

    // 4.5 将视频元素挂载到容器（插入最前面，badge/progress 叠在上层）
    if (this._videoContainer) {
      this._videoContainer.insertBefore(video, this._videoContainer.firstChild);
    }

    // 5. 绑定视频事件
    video.addEventListener('canplaythrough', this._handleCanPlay);
    video.addEventListener('ended', this._handleEnded);
    video.addEventListener('error', this._handleError);

    // 6. 触发加载
    video.load();
    
    this._notifyStateChange();
    return true;
  }

  // ============================================================================
  // 中途关闭视频（用户主动关闭弹窗）
  // 文档§2.6：视频播放中途关闭，播放进度丢失，需重新观看
  // ============================================================================
  abortPlayback() {
    this._clearSession();
    this.buttonState = 'normal';
    
    trackEvent('PLAY_ABORT', {
      scene: this.scene,
      right_type: this.rightType
    });
    
    // 销毁视频实例，释放资源
    this.destroy();
    this._notifyStateChange();
  }

  // ============================================================================
  // 状态变化通知回调（外部可覆盖）
  // ============================================================================
  _notifyStateChange() {
    if (this.onStateChange) this.onStateChange(this.buttonState);
  }

  // ============================================================================
  // 获取当前视频URL和时长（供UI展示）
  // ============================================================================
  getVideoUrl() {
    return this._videoUrl;
  }

  getVideoDuration() {
    return this._videoConfig.duration;
  }
}
