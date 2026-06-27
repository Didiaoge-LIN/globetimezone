/**
 * GlobeTimeZone 广告解锁权益体系 — 设备指纹生成工具
 * 文档版本：V3.0 终极落地执行操作手册 §4.5 + §7.3
 * 
 * 生成轻量设备标识，配合IP做频次限制
 * 设备指纹维度（文档§7.3）：
 *   1. 浏览器基础信息：UA、语言、时区、屏幕分辨率、颜色深度
 *   2. 系统信息：操作系统、平台、CPU核心数
 *   3. 画布指纹：Canvas 2D绘图特征
 *   4. 浏览器特性：硬件并发数
 * 
 * 指纹算法：DJB-style hash → 32位唯一指纹ID
 * 相似度95%以上判定为同一设备（文档§7.3）
 */

import { STORAGE_KEYS } from './constants.js';
import { secureGet, secureSet } from './secure-storage.js';

// ============================================================================
// 指纹特征采集
// ============================================================================
function collectFeatures() {
  return [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    String(screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    String(navigator.hardwareConcurrency || ''),
    navigator.platform,
    // Canvas画布指纹（文档§7.3：Canvas 2D绘图特征）
    (() => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('gtz_fp_v3', 2, 2);
        return canvas.toDataURL().slice(-50);
      } catch {
        return '';
      }
    })()
  ];
}

// ============================================================================
// 指纹哈希算法
// 对所有维度特征进行哈希计算，生成32位hex指纹ID
// ============================================================================
function hashFeatures(features) {
  let hash = 0;
  const str = features.join('|');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// ============================================================================
// 生成设备指纹
// ============================================================================
function generateFingerprint() {
  const features = collectFeatures();
  return hashFeatures(features);
}

// ============================================================================
// 获取设备指纹（优先从安全存储读取缓存）
// ============================================================================
/**
 * @returns {string} 32位hex设备指纹ID
 */
export function getDeviceFingerprint() {
  const cached = secureGet(STORAGE_KEYS.DEVICE_FINGERPRINT);
  if (cached) return cached;

  const fp = generateFingerprint();
  secureSet(STORAGE_KEYS.DEVICE_FINGERPRINT, fp);
  return fp;
}

// ============================================================================
// 强制重新生成指纹
// 用于检测指纹是否发生变化（清理缓存后指纹不同）
// ============================================================================
export function regenerateFingerprint() {
  const newFp = generateFingerprint();
  secureSet(STORAGE_KEYS.DEVICE_FINGERPRINT, newFp);
  return newFp;
}

// ============================================================================
// 指纹相似度检测（文档§7.3：相似度95%以上判定为同一设备）
// 比较两组特征的匹配度
// ============================================================================
export function calculateSimilarity(fp1, fp2) {
  if (fp1 === fp2) return 1.0;
  
  // 将hex指纹转为二进制位数组比较
  const bits1 = parseInt(fp1, 16).toString(2).padStart(32, '0');
  const bits2 = parseInt(fp2, 16).toString(2).padStart(32, '0');
  
  let matches = 0;
  for (let i = 0; i < bits1.length; i++) {
    if (bits1[i] === bits2[i]) matches++;
  }
  
  return matches / bits1.length;
}

// ============================================================================
// 检测是否为同一设备
// ============================================================================
export function isSameDevice(fp1, fp2) {
  return calculateSimilarity(fp1, fp2) >= 0.95;
}
