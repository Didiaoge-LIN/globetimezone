/**
 * GlobeTimeZone 广告解锁权益体系 — 带签名的安全存储工具
 * 文档版本：V3.0 终极落地执行操作手册 §4.4 + §3.7
 * 
 * 防止用户通过修改localStorage篡改权益数据
 * 签名算法：DJB-style hash（数据JSON字符串 + 前端盐值）
 * 读取数据时校验签名，不一致则判定为篡改，清空数据并上报埋点
 */

import { SECURITY_CONFIG, TRACK_EVENTS } from './constants.js';

// ============================================================================
// 签名盐值（与文档 SIGN_SECRET 一致）
// ============================================================================
const SIGN_SECRET = SECURITY_CONFIG.SIGN_SECRET;

// ============================================================================
// 签名生成算法
// DJB-style hash：高性能、无外部依赖、防逆推
// ============================================================================
function generateSign(data) {
  let hash = 0;
  const str = data + SIGN_SECRET;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;  // 转为32位整数
  }
  return Math.abs(hash).toString(16);
}

// ============================================================================
// 签名数据结构
// ============================================================================
/**
 * @typedef {Object} SignedData
 * @property {*} data - 实际数据
 * @property {string} sign - 数据签名
 * @property {number} timestamp - 写入时间戳（毫秒）
 */

// ============================================================================
// 安全写入本地存储
// ============================================================================
/**
 * @param {string} key - localStorage 键名
 * @param {*} value - 要存储的数据
 */
export function secureSet(key, value) {
  try {
    const dataStr = JSON.stringify(value);
    const sign = generateSign(dataStr);
    const signed = {
      data: value,
      sign: sign,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(signed));
  } catch (e) {
    console.warn('[secureStorage] write failed:', e);
  }
}

// ============================================================================
// 安全读取本地存储
// 签名校验失败返回null，视为数据无效（篡改判定）
// ============================================================================
/**
 * @param {string} key - localStorage 键名
 * @returns {*} 存储的数据，校验失败返回null
 */
export function secureGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed.data || !parsed.sign) return null;

    const dataStr = JSON.stringify(parsed.data);
    const validSign = generateSign(dataStr);
    
    if (validSign !== parsed.sign) {
      // 文档 §3.7：签名校验不一致判定为篡改，清空数据并上报埋点
      console.warn('[secureStorage] sign invalid, data tampered — key:', key);
      localStorage.removeItem(key);
      
      // 上报篡改事件（利用百度统计，如果已加载）
      if (window._hmt) {
        window._hmt.push(['_trackEvent', 'security', 'storage_tampered', key]);
      }
      return null;
    }
    return parsed.data;
  } catch (e) {
    console.warn('[secureStorage] read failed:', e);
    localStorage.removeItem(key);
    return null;
  }
}

// ============================================================================
// 删除存储项
// ============================================================================
/**
 * @param {string} key - localStorage 键名
 */
export function secureRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn('[secureStorage] remove failed:', e);
  }
}

// ============================================================================
// 批量清空所有权益相关存储
// 文档 §6.4：时间篡改处置 — 清空所有权益数据
// ============================================================================
export function secureClearAllRights() {
  const rightKeys = [
    'gtz_func_rights_v1',
    'gtz_checkin_v1',
    'gtz_adfree_v1',
    'gtz_time_offset_v1'
    // 注意：不清除 gtz_fp_v1 设备指纹，因为指纹是硬件特征
  ];
  
  rightKeys.forEach(key => {
    secureRemove(key);
  });
  
  console.warn('[secureStorage] all rights data cleared due to security violation');
}
