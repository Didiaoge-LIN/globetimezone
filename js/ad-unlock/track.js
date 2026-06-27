/**
 * GlobeTimeZone 广告解锁权益体系 — 埋点上报工具
 * 文档版本：V3.0 终极落地执行操作手册 §4.6 + §8.2
 * 
 * 全链路埋点统一上报，带队列、失败重试、关闭补报
 * 上报机制（文档§8.2）：
 *   1. 批量上报：每5个事件合并上报一次，或空闲时上报
 *   2. 失败重试：上报失败最多重试3次（暂简化为百度统计直接上报）
 *   3. 离线缓存：网络不可用时缓存到本地，恢复后补报
 *   4. 页面卸载：beforeunload用sendBeacon确保上报
 * 
 * 当前上报目标：百度统计（_hmt）
 * 后续扩展：sendBeacon上报自有数据平台（文档代码注释已预留）
 */

import { TRACK_EVENTS } from './constants.js';
import { getDeviceFingerprint } from './fingerprint.js';

// ============================================================================
// 埋点队列与状态
// ============================================================================
const trackQueue = [];    // 待上报事件队列
let isFlushing = false;   // 批量上报锁，防止并发

// ============================================================================
// 公共维度（文档§8.2：所有事件必须携带）
// ============================================================================
function getCommonParams() {
  return {
    platform: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
    browser: navigator.userAgent.includes('Chrome') ? 'chrome' :
             navigator.userAgent.includes('Safari') ? 'safari' :
             navigator.userAgent.includes('Firefox') ? 'firefox' : 'other',
    device_fp: getDeviceFingerprint(),
    timestamp: Date.now()
  };
}

// ============================================================================
// 埋点上报核心方法
// 文档纪律：所有事件必须通过此方法上报
// ============================================================================
/**
 * @param {string} eventName - TRACK_EVENTS 中的事件名
 * @param {Object} params - 事件参数
 */
export function trackEvent(eventName, params = {}) {
  try {
    const fullParams = { ...getCommonParams(), ...params };
    trackQueue.push({
      event: TRACK_EVENTS[eventName] || eventName,
      params: fullParams,
      time: Date.now()
    });

    // 文档规则：队列≥5条立即上报，否则空闲上报
    if (trackQueue.length >= 5) {
      flushTrackQueue();
    } else if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(flushTrackQueue, { timeout: 2000 });
    } else {
      setTimeout(flushTrackQueue, 2000);
    }
  } catch (e) {
    console.warn('[track] event push failed:', e);
  }
}

// ============================================================================
// 批量上报
// 当前实现：百度统计 _hmt.push
// 预留扩展：navigator.sendBeacon 上报自有数据平台
// ============================================================================
function flushTrackQueue() {
  if (isFlushing || trackQueue.length === 0) return;
  isFlushing = true;

  const batch = trackQueue.splice(0, trackQueue.length);
  
  try {
    // 百度统计事件上报
    if (window._hmt) {
      batch.forEach(item => {
        window._hmt.push(['_trackEvent', 'ad_unlock', item.event, JSON.stringify(item.params)]);
      });
    }
    
    // 预留：sendBeacon上报自有数据平台（文档§8.2注释已预留）
    // 后续上线后端 /api/track 接口后启用
    // if (navigator.sendBeacon) {
    //   navigator.sendBeacon('/api/track', JSON.stringify(batch));
    // }
  } catch (e) {
    // 上报失败：将事件重新加入队列（简化版重试）
    trackQueue.unshift(...batch);
  } finally {
    isFlushing = false;
  }
}

// ============================================================================
// 页面卸载补报（文档§8.2：beforeunload用sendBeacon确保上报）
// ============================================================================
window.addEventListener('beforeunload', () => {
  if (trackQueue.length > 0) {
    // 立即flush一次
    flushTrackQueue();
    
    // 剩余的事件用sendBeacon兜底上报
    if (trackQueue.length > 0 && navigator.sendBeacon) {
      try {
        // 后续启用：navigator.sendBeacon('/api/track', JSON.stringify(trackQueue));
        // 当前：百度统计无法用sendBeacon，尽力flush后丢弃
        if (window._hmt) {
          trackQueue.forEach(item => {
            window._hmt.push(['_trackEvent', 'ad_unlock', item.event, JSON.stringify(item.params)]);
          });
        }
        trackQueue.length = 0;
      } catch {
        // 静默失败，不影响用户体验
      }
    }
  }
});

// ============================================================================
// 获取队列当前长度（调试用）
// ============================================================================
export function getQueueLength() {
  return trackQueue.length;
}
