/**
 * GlobeTimeZone 广告解锁权益体系 — 广告适配器
 * 文档版本：V3.0 终极落地执行操作手册 §4.10
 * 
 * 统一广告接口，模拟广告与真实广告无缝切换
 * 当前实现：MockAdAdapter（MVP阶段使用自有视频）
 * 后续扩展：GoogleAdMobAdapter（正式接入Google AdMob）
 * 
 * 接口定义（文档§4.10 IAdAdapter）：
 *   name: 适配器名称
 *   loadAd(scene): 预加载广告
 *   playAd(): 播放广告
 *   onComplete(callback): 完成回调
 *   onFail(callback): 失败回调
 *   destroy(): 销毁实例
 */

import { FunctionScene, ERROR_CODES } from './constants.js';
import { getVideoConfig } from './scene-video-map.js';

// ============================================================================
// IAdAdapter 接口定义
// ============================================================================
/**
 * @interface IAdAdapter
 * @property {string} name - 适配器名称
 * @method loadAd(scene) - 预加载广告
 * @method playAd() - 播放广告
 * @method onComplete(callback) - 设置完成回调
 * @method onFail(callback) - 设置失败回调
 * @method destroy() - 销毁实例释放资源
 */

// ============================================================================
// MockAdAdapter 实现
// MVP阶段使用自有视频文件模拟广告播放
// ============================================================================
export class MockAdAdapter {
  constructor() {
    this.name = 'mock';
    
    this._videoElement = null;
    this._completeCallback = null;
    this._failCallback = null;
    this._isLoaded = false;
    this._scene = null;
  }

  // ============================================================================
  // 预加载广告
  // ============================================================================
  async loadAd(scene) {
    const config = getVideoConfig(scene);
    this._scene = scene;

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;                         // 文档§2.1：默认静音
      video.playsInline = true;
      video.preload = 'auto';
      
      // 文档§3.4：根据网络环境选择码率
      const connection = navigator.connection || navigator.mozConnection || null;
      const effectiveType = connection ? connection.effectiveType : '4g';
      video.src = effectiveType === '4g' || !connection
        ? config.highBitrateUrl
        : config.lowBitrateUrl;

      const canPlayHandler = () => {
        this._isLoaded = true;
        this._videoElement = video;
        resolve();
      };

      const errorHandler = () => {
        if (this._failCallback) {
          this._failCallback(ERROR_CODES.RESOURCE_NOT_FOUND, 'video load error');
        }
        reject(new Error('video load failed'));
      };

      video.addEventListener('canplaythrough', canPlayHandler);
      video.addEventListener('error', errorHandler);

      video.load();

      // 文档§3.3：3秒加载超时兜底
      setTimeout(() => {
        if (!this._isLoaded) {
          video.removeEventListener('canplaythrough', canPlayHandler);
          video.removeEventListener('error', errorHandler);
          if (this._failCallback) {
            this._failCallback(ERROR_CODES.LOAD_TIMEOUT, 'load timeout 3s');
          }
          reject(new Error('load timeout'));
        }
      }, 3000);
    });
  }

  // ============================================================================
  // 播放广告
  // ============================================================================
  async playAd() {
    if (!this._videoElement || !this._isLoaded) {
      if (this._failCallback) {
        this._failCallback(ERROR_CODES.RESOURCE_NOT_FOUND, 'ad not loaded');
      }
      return false;
    }

    this._videoElement.addEventListener('ended', () => {
      if (this._completeCallback) this._completeCallback();
    });

    try {
      await this._videoElement.play();
      return true;
    } catch (e) {
      if (this._failCallback) {
        this._failCallback(ERROR_CODES.PLAY_FAIL, 'play error');
      }
      return false;
    }
  }

  // ============================================================================
  // 设置完成回调
  // ============================================================================
  onComplete(callback) {
    this._completeCallback = callback;
  }

  // ============================================================================
  // 设置失败回调
  // ============================================================================
  onFail(callback) {
    this._failCallback = callback;
  }

  // ============================================================================
  // 销毁实例
  // ============================================================================
  destroy() {
    if (this._videoElement) {
      this._videoElement.pause();
      this._videoElement.src = '';
      this._videoElement = null;
    }
    this._completeCallback = null;
    this._failCallback = null;
    this._isLoaded = false;
  }
}

// ============================================================================
// GoogleAdMobAdapter 预留（文档§4.10标注"预留"）
// ============================================================================
export class GoogleAdMobAdapter {
  constructor() {
    this.name = 'google_admob';
    // TODO: 正式接入Google AdMob SDK后实现
  }
  async loadAd(scene) { throw new Error('Not implemented'); }
  async playAd() { throw new Error('Not implemented'); }
  onComplete(callback) { throw new Error('Not implemented'); }
  onFail(callback) { throw new Error('Not implemented'); }
  destroy() { throw new Error('Not implemented'); }
}

// ============================================================================
// 适配器工厂
// 当前默认使用MockAdAdapter
// 后续可通过配置切换到GoogleAdMobAdapter
// ============================================================================
const ADAPTER_MAP = {
  mock: MockAdAdapter,
  google_admob: GoogleAdMobAdapter
};

let currentAdapterType = 'mock';  // 默认mock模式

/**
 * 创建广告适配器实例
 * @param {string} type - 适配器类型（'mock' | 'google_admob'）
 * @returns {IAdAdapter} 适配器实例
 */
export function createAdAdapter(type = currentAdapterType) {
  const AdapterClass = ADAPTER_MAP[type] || MockAdAdapter;
  return new AdapterClass();
}

/**
 * 切换全局适配器类型
 * @param {string} type - 适配器类型
 */
export function setAdapterType(type) {
  currentAdapterType = type;
}
