/**
 * GlobeTimeZone 广告解锁权益体系 — 场景-视频映射配置
 * 文档版本：V3.0 终极落地执行操作手册 §4.2
 * 
 * 配置化管理场景与视频的映射，新增场景仅追加配置
 * 业务代码禁止硬编码视频URL或时长
 */

import { FunctionScene } from './constants.js';

// ============================================================================
// 视频配置结构
// ============================================================================
/**
 * @typedef {Object} VideoConfig
 * @property {string} videoId - 视频唯一ID
 * @property {number} duration - 视频时长（秒）
 * @property {string} highBitrateUrl - 高码率视频URL（4g/WiFi环境使用）
 * @property {string} lowBitrateUrl - 低码率视频URL（弱网环境使用）
 * @property {string[]} firstFrameScene - 首帧适用的场景列表
 */

// ============================================================================
// 场景-视频映射表
// 文档规则：
//   轻量档视频时长 = 8秒
//   全天档视频时长 = 20秒（仅cross_border场景）
//   其他场景默认8秒
// ============================================================================
const SCENE_VIDEO_MAP = Object.freeze({
  [FunctionScene.MEETING_PLANNER]: {
    videoId: 'v_meeting_001',
    duration: 8,  // 轻量档：8秒视频解锁1小时
    highBitrateUrl: '/assets/videos/high/meeting_001.mp4',
    lowBitrateUrl: '/assets/videos/low/meeting_001.mp4',
    firstFrameScene: [FunctionScene.MEETING_PLANNER]
  },
  [FunctionScene.WORLD_CLOCK]: {
    videoId: 'v_clock_001',
    duration: 8,
    highBitrateUrl: '/assets/videos/high/world_clock_001.mp4',
    lowBitrateUrl: '/assets/videos/low/world_clock_001.mp4',
    firstFrameScene: [FunctionScene.WORLD_CLOCK]
  },
  [FunctionScene.TIME_DIFFERENCE]: {
    videoId: 'v_timediff_001',
    duration: 8,
    highBitrateUrl: '/assets/videos/high/time_diff_001.mp4',
    lowBitrateUrl: '/assets/videos/low/time_diff_001.mp4',
    firstFrameScene: [FunctionScene.TIME_DIFFERENCE]
  },
  [FunctionScene.CROSS_BORDER]: {
    videoId: 'v_cross_001',
    duration: 20,  // 全天档：20秒视频解锁24小时
    highBitrateUrl: '/assets/videos/high/cross_border_001.mp4',
    lowBitrateUrl: '/assets/videos/low/cross_border_001.mp4',
    firstFrameScene: [FunctionScene.CROSS_BORDER]
  },
  [FunctionScene.OTHER]: {
    videoId: 'v_collection_001',
    duration: 8,
    highBitrateUrl: '/assets/videos/high/collection_001.mp4',
    lowBitrateUrl: '/assets/videos/low/collection_001.mp4',
    firstFrameScene: []
  }
});

// ============================================================================
// 获取视频配置
// 未知场景回退到OTHER兜底配置
// ============================================================================
/**
 * @param {string} scene - FunctionScene 枚举值
 * @returns {VideoConfig} 视频配置对象
 */
export function getVideoConfig(scene) {
  return SCENE_VIDEO_MAP[scene] || SCENE_VIDEO_MAP[FunctionScene.OTHER];
}

// ============================================================================
// 获取当前网络环境对应的视频URL
// 4g/WiFi使用高码率，其他使用低码率
// ============================================================================
/**
 * @param {string} scene - FunctionScene 枚举值
 * @returns {string} 视频URL
 */
export function getVideoUrl(scene) {
  const config = getVideoConfig(scene);
  // navigator.connection 是 Network Information API，部分浏览器支持
  const connection = navigator.connection || navigator.mozConnection || null;
  const effectiveType = connection ? connection.effectiveType : '4g';
  
  // 文档规则：网络环境为4g/WiFi时使用高码率，其他使用低码率
  if (effectiveType === '4g' || !connection) {
    // 无connection信息默认走高码率（多数桌面端浏览器无此API）
    return config.highBitrateUrl;
  }
  return config.lowBitrateUrl;
}

export { SCENE_VIDEO_MAP };
