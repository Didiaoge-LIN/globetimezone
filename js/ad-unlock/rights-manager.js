/**
 * GlobeTimeZone 广告解锁权益体系 — 权益管理模块
 * 文档版本：V3.0 终极落地执行操作手册 §4.8
 * 
 * 统一管理权益发放、校验、到期、优先级消耗
 * 
 * 权益优先级（文档§2.4，从高到低）：
 *   1. Pro订阅/打卡获得的全功能无广告权益（ADFREE）
 *   2. 全天档单功能权益（FULL）
 *   3. 轻量档单功能权益（LIGHT）
 *   4. 兜底体验权益（FALLBACK）
 * 
 * 规则细节：
 *   - 同功能多份权益：先到期的先消耗，后到期的顺延
 *   - 跨场景权益：全功能权益生效时，所有单功能权益全部暂停计时
 *   - 时间篡改则清空所有权益
 *   - 每分钟清理过期权益并上报UNLOCK_EXPIRE
 */

import {
  STORAGE_KEYS,
  RightType,
  FunctionScene,
  RIGHT_DURATION,
  DAILY_LIMIT
} from './constants.js';
import { secureGet, secureSet, secureRemove } from './secure-storage.js';
import { getStandardNow, isTimeTampered } from './time-calibrate.js';
import { trackEvent } from './track.js';

// ============================================================================
// 权益数据结构
// ============================================================================
/**
 * @typedef {Object} RightItem
 * @property {string} scene - FunctionScene 枚举值
 * @property {string} type - RightType 枚举值
 * @property {number} expireTime - 到期时间戳（毫秒，校准后标准时间）
 * @property {number} createdAt - 创建时间戳（毫秒，校准后标准时间）
 */

// ============================================================================
// 权益管理器
// ============================================================================
export class RightsManager {
  constructor() {
    this._listeners = [];  // 状态变化监听器
    this._cleanupTimer = null;
    
    // 启动每分钟过期清理
    this._startCleanup();
    
    // 初始化时检测时间篡改
    if (isTimeTampered()) {
      secureRemove(STORAGE_KEYS.FUNCTION_RIGHTS);
      secureRemove(STORAGE_KEYS.ADFREE_RIGHT);
    }
  }

  // ============================================================================
  // 注册状态变化监听器
  // ============================================================================
  addListener(listener) {
    this._listeners.push(listener);
  }

  removeListener(listener) {
    this._listeners = this._listeners.filter(l => l !== listener);
  }

  _notifyChange() {
    this._listeners.forEach(l => l());
  }

  // ============================================================================
  // 获取功能权益列表
  // ============================================================================
  _getFunctionRights() {
    const rights = secureGet(STORAGE_KEYS.FUNCTION_RIGHTS);
    return rights || [];
  }

  _saveFunctionRights(rights) {
    secureSet(STORAGE_KEYS.FUNCTION_RIGHTS, rights);
    this._notifyChange();
  }

  // ============================================================================
  // 获取全功能无广告权益
  // ============================================================================
  _getAdFreeRight() {
    const right = secureGet(STORAGE_KEYS.ADFREE_RIGHT);
    return right || null;
  }

  // ============================================================================
  // 每分钟清理过期权益
  // 文档§4.8：过期权益自动失效，上报UNLOCK_EXPIRE
  // ============================================================================
  _startCleanup() {
    this._cleanupTimer = setInterval(() => {
      this._cleanupExpired();
    }, 60 * 1000);
  }

  _cleanupExpired() {
    const rights = this._getFunctionRights();
    const now = getStandardNow();
    const validRights = rights.filter(r => r.expireTime > now);
    
    if (validRights.length !== rights.length) {
      // 上报过期事件
      rights.filter(r => r.expireTime <= now).forEach(r => {
        trackEvent('UNLOCK_EXPIRE', {
          scene: r.scene,
          right_type: r.type,
          total_used_duration: now - r.createdAt
        });
      });
      
      this._saveFunctionRights(validRights);
    }
  }

  // ============================================================================
  // 检查是否有对应场景的有效权益
  // 文档§2.4优先级：全功能无广告 > 单功能权益
  // ============================================================================
  /**
   * @param {string} scene - FunctionScene 枚举值
   * @returns {boolean} 是否有有效权益
   */
  hasRight(scene) {
    if (isTimeTampered()) return false;

    // 优先级1：全功能无广告权益（覆盖所有场景）
    const adFree = this._getAdFreeRight();
    if (adFree && adFree.expireTime > getStandardNow()) {
      return true;
    }

    // 优先级2-4：单功能权益
    const rights = this._getFunctionRights();
    const now = getStandardNow();
    return rights.some(r => r.scene === scene && r.expireTime > now);
  }

  // ============================================================================
  // 发放权益
  // 文档规则：
  //   - 达上限返回false
  //   - 已有同场景同类型权益→顺延（后到期顺延）
  //   - ADFREE类型叠加逻辑：已有未到期→在到期时间基础上追加
  // ============================================================================
  /**
   * @param {string} scene - FunctionScene 枚举值
   * @param {string} type - RightType 枚举值
   * @returns {boolean} 是否发放成功
   */
  grantRight(scene, type) {
    if (isTimeTampered()) return false;

    // 检查单日上限
    if (this.isDailyLimitReached(type)) {
      return false;
    }

    const now = getStandardNow();
    const duration = RIGHT_DURATION[type];

    if (type === RightType.ADFREE) {
      // 全功能无广告权益叠加逻辑
      const existing = this._getAdFreeRight();
      const newExpire = existing && existing.expireTime > now
        ? existing.expireTime + duration   // 在已有到期时间上追加
        : now + duration;                   // 新发放
      
      secureSet(STORAGE_KEYS.ADFREE_RIGHT, {
        scene: FunctionScene.OTHER,
        type: RightType.ADFREE,
        expireTime: newExpire,
        createdAt: now
      });
    } else {
      // 单功能权益
      const rights = this._getFunctionRights();
      const existingIndex = rights.findIndex(r => 
        r.scene === scene && r.type === type && r.expireTime > now
      );
      
      if (existingIndex >= 0) {
        // 文档§2.4：同功能多份权益，后到期的顺延
        rights[existingIndex].expireTime += duration;
      } else {
        rights.push({
          scene,
          type,
          expireTime: now + duration,
          createdAt: now
        });
      }
      this._saveFunctionRights(rights);
    }

    trackEvent('UNLOCK_SUCCESS', {
      scene,
      right_type: type,
      duration: RIGHT_DURATION[type] / 1000
    });

    this._notifyChange();
    return true;
  }

  // ============================================================================
  // 获取剩余时长（毫秒）
  // 文档§2.4优先级：全功能无广告 > 单功能权益
  // ============================================================================
  /**
   * @param {string} scene - FunctionScene 枚举值
   * @returns {number} 剩余毫秒数
   */
  getRemainingTime(scene) {
    if (isTimeTampered()) return 0;
    const now = getStandardNow();

    // 优先级1：全功能无广告权益
    const adFree = this._getAdFreeRight();
    if (adFree && adFree.expireTime > now) {
      return adFree.expireTime - now;
    }

    // 优先级2-4：单功能权益
    const rights = this._getFunctionRights();
    const right = rights.find(r => r.scene === scene && r.expireTime > now);
    return right ? right.expireTime - now : 0;
  }

  // ============================================================================
  // 检查单日解锁是否达上限
 // 文档§2.3：按当天创建的权益数量统计
 // ============================================================================
  /**
   * @param {string} type - RightType 枚举值
   * @returns {boolean} 是否已达上限
   */
  isDailyLimitReached(type) {
    if (type === RightType.ADFREE) return false;  // 打卡获得ADFREE不受日限

    const rights = this._getFunctionRights();
    const now = getStandardNow();
    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    
    const todayCount = rights.filter(r =>
      r.type === type && r.createdAt >= todayStart
    ).length;

    const limit = DAILY_LIMIT[type] || 999;
    return todayCount >= limit;
  }

  // ============================================================================
  // 获取全功能无广告状态
  // ============================================================================
  get hasAdFree() {
    const adFree = this._getAdFreeRight();
    return !!(adFree && adFree.expireTime > getStandardNow());
  }

  get adfreeRemaining() {
    const adFree = this._getAdFreeRight();
    if (!adFree || adFree.expireTime <= getStandardNow()) return 0;
    return adFree.expireTime - getStandardNow();
  }

  // ============================================================================
  // 获取所有有效权益摘要（供UI展示）
  // ============================================================================
  getActiveRightsSummary() {
    const now = getStandardNow();
    const rights = this._getFunctionRights().filter(r => r.expireTime > now);
    const adFree = this._getAdFreeRight();
    const hasAdFree = adFree && adFree.expireTime > now;
    
    return {
      hasAdFree,
      adfreeRemaining: hasAdFree ? adFree.expireTime - now : 0,
      functionRights: rights.map(r => ({
        scene: r.scene,
        type: r.type,
        remaining: r.expireTime - now,
        createdAt: r.createdAt
      }))
    };
  }

  // ============================================================================
  // 销毁管理器（清理定时器）
  // ============================================================================
  destroy() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    this._listeners = [];
  }
}
