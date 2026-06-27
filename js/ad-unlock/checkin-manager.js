/**
 * GlobeTimeZone 广告解锁权益体系 — 打卡管理模块
 * 文档版本：V3.0 终极落地执行操作手册 §4.9 + §2.5
 * 
 * 连续打卡、中断回退、权益累计逻辑
 * 
 * 打卡规则（文档§2.5终极细化）：
 *   有效打卡判定：当天完整观看任意档位视频且成功发放权益
 *   日期判定：按用户本地时区自然日计算
 *   中断容错：
 *     1. 中断1天：连续天数回退1天（连续2天→中断1天→连续1天）
 *     2. 连续中断2天及以上：连续天数清零，重新累计
 *     3. 中断天数 = 上次打卡到本次打卡之间的自然日 - 1
 *   进度展示：「已打卡X天，再打卡Y天领7天无广告」
 *   累计档：连续3天 → 发放7天全功能无广告，最多同时累计2份
 */

import {
  STORAGE_KEYS,
  CHECKIN_TARGET_DAYS,
  CHECKIN_MAX_STACK,
  CHECKIN_INTERRUPT_FALLBACK_DAYS
} from './constants.js';
import { secureGet, secureSet } from './secure-storage.js';
import { getStandardNow } from './time-calibrate.js';
import { trackEvent } from './track.js';

// ============================================================================
// 打卡记录数据结构
// ============================================================================
/**
 * @typedef {Object} CheckinRecord
 * @property {number} continuousDays - 当前连续打卡天数
 * @property {string} lastCheckinDate - 上次打卡日期（YYYY-MM-DD，本地时区）
 * @property {number} totalAdfreeStack - 待领取的7天无广告权益份数
 * @property {number} updatedAt - 最后更新时间戳（毫秒）
 */

// ============================================================================
// 打卡管理器
// ============================================================================
export class CheckinManager {
  constructor() {
    this._listeners = [];
    this._record = {
      continuousDays: 0,
      lastCheckinDate: '',
      totalAdfreeStack: 0,
      updatedAt: 0
    };
    
    // 初始化时从存储恢复
    this._loadRecord();
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
  // 从存储恢复打卡记录
  // ============================================================================
  _loadRecord() {
    const saved = secureGet(STORAGE_KEYS.CHECKIN_RECORD);
    if (saved) {
      this._record = saved;
    }
  }

  // ============================================================================
  // 保存打卡记录到存储
  // ============================================================================
  _saveRecord() {
    secureSet(STORAGE_KEYS.CHECKIN_RECORD, this._record);
    this._notifyChange();
  }

  // ============================================================================
  // 将时间戳转为本地日期字符串（YYYY-MM-DD）
  // 文档§2.5：日期判定按用户本地时区自然日
  // ============================================================================
  _getLocalDateStr(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // ============================================================================
  // 计算中断天数
  // 文档§2.5：中断天数 = 上次打卡日期到本次打卡日期之间的自然日 - 1
  // ============================================================================
  _getInterruptDays(lastDate) {
    if (!lastDate) return 999;  // 无上次打卡记录
    
    const now = getStandardNow();
    const todayStr = this._getLocalDateStr(now);
    
    const last = new Date(lastDate).getTime();
    const today = new Date(todayStr).getTime();
    const diffDays = Math.floor((today - last) / (24 * 60 * 60 * 1000));
    
    // 中断天数 = 自然日差 - 1（同一天打卡=0中断，昨天打卡=0中断，前天打卡=1中断）
    return diffDays > 0 ? diffDays - 1 : 0;
  }

  // ============================================================================
  // 检查今天是否可以打卡
  // 文档§2.5：同一天不能重复打卡
  // ============================================================================
  get canCheckinToday() {
    const todayStr = this._getLocalDateStr(getStandardNow());
    return this._record.lastCheckinDate !== todayStr;
  }

  // ============================================================================
  // 执行打卡
  // 文档§2.5完整逻辑：
  //   1. 检查canCheckinToday
  //   2. 计算中断天数
  //   3. 中断0天 → 连续天数+1
  //   4. 中断1天 → 回退1天+1
  //   5. 中断≥2天 → 清零+1
  //   6. 连续天数≥3 → 发放7天ADFREE stack+1，连续天数归零
  //   7. stack最多2份
  // ============================================================================
  /**
   * @returns {boolean} 是否打卡成功
   */
  doCheckin() {
    if (!this.canCheckinToday) return false;

    const now = getStandardNow();
    const todayStr = this._getLocalDateStr(now);
    const interruptDays = this._getInterruptDays(this._record.lastCheckinDate);
    
    let newContinuousDays = this._record.continuousDays;

    // 文档§2.5中断容错规则
    if (interruptDays === 0) {
      // 连续打卡（无中断）
      newContinuousDays += 1;
    } else if (interruptDays <= CHECKIN_INTERRUPT_FALLBACK_DAYS) {
      // 中断1天：回退1天再+1
      // 例：连续2天→中断1天→回退到1天→+1→=2天（文档规则实际计算）
      newContinuousDays = Math.max(0, newContinuousDays - CHECKIN_INTERRUPT_FALLBACK_DAYS) + 1;
    } else {
      // 连续中断2天及以上：清零重新开始
      newContinuousDays = 1;
    }

    // 文档§2.5累计档判定
    let newStack = this._record.totalAdfreeStack;
    if (newContinuousDays >= CHECKIN_TARGET_DAYS) {
      // 达到3天目标 → 发放7天无广告权益
      if (newStack < CHECKIN_MAX_STACK) {
        // 文档§2.5：最多同时累计2份
        newStack += 1;
        newContinuousDays = 0;  // 发放后归零重新累计
      }
    }

    const newRecord = {
      continuousDays: newContinuousDays,
      lastCheckinDate: todayStr,
      totalAdfreeStack: newStack,
      updatedAt: now
    };

    this._record = newRecord;
    this._saveRecord();

    trackEvent('CHECKIN_SUCCESS', {
      continuous_days: newContinuousDays,
      total_stack: newStack,
      interrupt_days: interruptDays
    });

    return true;
  }

  // ============================================================================
  // 领取7天无广告权益（消耗1份stack）
  // 需配合RightsManager.grantRight(scene, RightType.ADFREE) 发放权益
 // ============================================================================
  /**
   * @returns {boolean} 是否成功领取
   */
  claimAdfree() {
    if (this._record.totalAdfreeStack <= 0) return false;

    this._record.totalAdfreeStack -= 1;
    this._saveRecord();
    
    return true;
  }

  // ============================================================================
  // 当前连续打卡天数
  // ============================================================================
  get continuousDays() {
    return this._record.continuousDays;
  }

  // ============================================================================
  // 待领取的7天无广告份数
  // ============================================================================
  get totalAdfreeStack() {
    return this._record.totalAdfreeStack;
  }

  // ============================================================================
  // 进度文案（文档§2.5）
 // 「已打卡X天，再打卡Y天领7天无广告」
 // ============================================================================
  getProgressText() {
    const current = this._record.continuousDays;
    const remaining = CHECKIN_TARGET_DAYS - current;
    
    if (remaining <= 0) {
      return `已打卡${current}天，可领取7天无广告权益！`;
    }
    return `已打卡${current}天，再打卡${remaining}天领7天无广告`;
  }

  // ============================================================================
  // 进度百分比（供UI进度条使用）
  // ============================================================================
  getProgressPercent() {
    return Math.min(100, (this._record.continuousDays / CHECKIN_TARGET_DAYS) * 100);
  }

  // ============================================================================
  // 文档§2.5：到期提醒预判
 // 检查是否有待领取的ADFREE stack
 // ============================================================================
  get hasPendingAdfree() {
    return this._record.totalAdfreeStack > 0;
  }
}
