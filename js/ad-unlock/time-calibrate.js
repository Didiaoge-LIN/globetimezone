/**
 * GlobeTimeZone 广告解锁权益体系 — 时间校准工具
 * 文档版本：V3.0 终极落地执行操作手册 §4.3 + §6.2~§6.5
 * 
 * 从Cloudflare边缘节点时间校准本地时间，拦截改系统时间作弊
 * 三层时间校验架构（文档§6.2）：
 *   第一层：CF边缘响应头 X-CF-Edge-TS（精度≤10ms）
 *   第二层：后端服务时间（后续GCP服务器，暂未上线）
 *   第三层：多重NTP源校验（容灾备用，暂未实现）
 * 
 * 前端时间校准逻辑（文档§6.3）：
 *   初始化：从meta标签读取边缘时间戳，计算偏移量
 *   定期校准：每10分钟重新获取边缘时间
 *   异常处理：连续3次校准失败触发风控
 */

import { STORAGE_KEYS, SECURITY_CONFIG } from './constants.js';
import { secureGet, secureSet, secureClearAllRights } from './secure-storage.js';

// ============================================================================
// 内部缓存
// ============================================================================
let cachedOffset = null;          // 本地时间与标准时间的偏移量（毫秒）
let lastCalibrationTime = 0;      // 上次校准时间
let consecutiveFailCount = 0;     // 连续校准失败次数

// ============================================================================
// 初始化时间校准
// 文档§6.3：从页面meta标签读取Cloudflare边缘时间戳
// CF Pages Functions在响应中注入<meta name="cf-edge-ts">或X-CF-Edge-TS响应头
// ============================================================================
export function initTimeCalibration() {
  if (cachedOffset !== null) return;

  // 方式1：从meta标签读取（推荐，由后端API或_middleware注入）
  const meta = document.querySelector('meta[name="cf-edge-ts"]');
  const edgeTs = meta ? parseInt(meta.content, 10) : 0;

  if (edgeTs && !isNaN(edgeTs)) {
    // 计算偏移量：标准时间 - 本地时间
    cachedOffset = edgeTs - Date.now();
    secureSet(STORAGE_KEYS.TIME_OFFSET, cachedOffset);
    lastCalibrationTime = Date.now();
    consecutiveFailCount = 0;
  } else {
    // 方式2：无meta标签时，从localStorage读取上次缓存的偏移量
    const saved = secureGet(STORAGE_KEYS.TIME_OFFSET);
    cachedOffset = typeof saved === 'number' ? saved : 0;
  }
}

// ============================================================================
// 获取校准后的标准时间戳（毫秒）
// 文档核心纪律：所有权益计时、打卡判定必须使用此方法，禁止直接用Date.now()
// ============================================================================
export function getStandardNow() {
  if (cachedOffset === null) {
    initTimeCalibration();
  }
  return Date.now() + (cachedOffset || 0);
}

// ============================================================================
// 检测时间是否被篡改
// 文档§6.4：偏差超过60秒判定为时间异常
// ============================================================================
export function isTimeTampered() {
  if (cachedOffset === null) return false;
  
  // 当前校准后的时间 vs 当前本地时间的偏差
  // 如果偏移量变化过大（>1小时），说明本地时间被大幅修改
  const currentOffset = cachedOffset;
  const expectedOffset = cachedOffset;  // 理论上偏移量应该稳定
  
  // 检查偏移量是否发生了大幅跳变
  const nowLocal = Date.now();
  const nowStandard = nowLocal + currentOffset;
  
  // 重新获取偏移量看是否一致（如果用户改了时间，偏移量会变化）
  // 实际检测：比较最近两次校准之间的偏移量变化
  // 简化版：如果偏移量绝对值 > 1小时，判定可疑
  const absOffset = Math.abs(currentOffset);
  
  // 文档§6.4：轻度异常(偏差60秒-1小时) → 本次权益失效
  // 中度异常(偏差1-24小时) → 当日权益清零
  // 重度异常(偏差>24小时) → 永久封禁
  return absOffset > SECURITY_CONFIG.TIME_TAMPER_THRESHOLD;
}

// ============================================================================
// 定期校准
// 文档§6.3：每10分钟重新发起一次轻量请求获取最新边缘时间
// ============================================================================
export function scheduleCalibration() {
  const interval = SECURITY_CONFIG.CALIBRATION_INTERVAL;  // 10分钟
  
  setInterval(() => {
    recalibrateFromEdge();
  }, interval);
}

/**
 * 从边缘API重新校准时间
 * 发送轻量请求到 /api/ad/verify（或任何返回X-CF-Edge-TS的端点）
 * 获取最新的边缘时间戳并更新偏移量
 */
async function recalibrateFromEdge() {
  try {
    // 轻量请求获取边缘时间戳
    const response = await fetch('/api/status', { 
      method: 'GET',
      cache: 'no-store'
    });
    
    const edgeTs = parseInt(response.headers.get('X-CF-Edge-TS') || '0', 10);
    
    if (edgeTs && !isNaN(edgeTs)) {
      const newOffset = edgeTs - Date.now();
      
      // 文档§6.4：偏移量突然大幅变化（>1小时），判定为时间篡改
      if (cachedOffset !== null && Math.abs(newOffset - cachedOffset) > SECURITY_CONFIG.TIME_JUMP_THRESHOLD) {
        console.warn('[timeCalibrate] offset jump detected:', {
          old: cachedOffset,
          new: newOffset,
          diff: newOffset - cachedOffset
        });
        // 时间跳变 → 清空权益（文档§6.4作弊处置）
        secureClearAllRights();
        cachedOffset = newOffset;
        secureSet(STORAGE_KEYS.TIME_OFFSET, cachedOffset);
        return;
      }
      
      cachedOffset = newOffset;
      secureSet(STORAGE_KEYS.TIME_OFFSET, cachedOffset);
      lastCalibrationTime = Date.now();
      consecutiveFailCount = 0;
    } else {
      consecutiveFailCount++;
      // 文档§6.3：连续3次校准失败触发风控标记
      if (consecutiveFailCount >= SECURITY_CONFIG.CALIBRATION_FAIL_LIMIT) {
        console.warn('[timeCalibrate] 3 consecutive calibration failures — flagging risk');
        if (window._hmt) {
          window._hmt.push(['_trackEvent', 'security', 'calibration_fail', String(consecutiveFailCount)]);
        }
      }
    }
  } catch (e) {
    consecutiveFailCount++;
    console.warn('[timeCalibrate] recalibration failed:', e);
  }
}

// ============================================================================
// 获取篡改等级（文档§6.4 作弊处置分级）
// ============================================================================
export function getTamperLevel() {
  if (cachedOffset === null) return 'none';
  
  const absOffset = Math.abs(cachedOffset);
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;
  
  if (absOffset <= SECURITY_CONFIG.TIME_TAMPER_THRESHOLD) return 'none';       // 正常
  if (absOffset <= ONE_HOUR) return 'light';                                    // 轻度：本次权益失效
  if (absOffset <= ONE_DAY) return 'medium';                                    // 中度：当日权益清零
  return 'heavy';                                                                // 重度：永久封禁广告解锁
}

// ============================================================================
// 自动初始化（页面加载时）
// ============================================================================
// 在模块加载时自动初始化
initTimeCalibration();
