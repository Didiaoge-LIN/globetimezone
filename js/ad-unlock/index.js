/**
 * GlobeTimeZone 广告解锁权益体系 — 模块聚合入口
 * 
 * 所有子模块的统一导出入口，外部只需引用此文件
 * 内部模块按依赖层级组织：
 *   Layer 1: constants + scene-video-map (纯数据，无依赖)
 *   Layer 2: secure-storage + time-calibrate + fingerprint + track (工具层)
 *   Layer 3: unlock-session + rights-manager + checkin-manager + ad-adapter (业务层)
 *   Layer 4: ui-components (UI层，依赖业务层)
 */

// Layer 1: 纯数据
export * from './constants.js';
export * from './scene-video-map.js';

// Layer 2: 工具层
export * from './secure-storage.js';
export * from './time-calibrate.js';
export * from './fingerprint.js';
export * from './track.js';

// Layer 3: 业务层
export * from './unlock-session.js';
export * from './rights-manager.js';
export * from './checkin-manager.js';
export * from './ad-adapter.js';

// Layer 4: UI层
export * from './ui-components.js';
