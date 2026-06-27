/**
 * GlobeTimeZone 广告解锁权益体系 — 全局常量定义
 * 文档版本：V3.0 终极落地执行操作手册
 * 适配架构：Vanilla JS (非 React/TypeScript)
 * 
 * 所有业务规则统一在此维护，业务代码禁止硬编码魔法数字
 */

// ============================================================================
// 权益档位枚举
// ============================================================================
export const RightType = Object.freeze({
  LIGHT: 'light',       // 轻量档（1小时单功能）
  FULL: 'full',         // 全天档（24小时单功能）
  FALLBACK: 'fallback', // 兜底档（10分钟单功能）
  ADFREE: 'adfree'      // 累计档（7天全功能无广告）
});

// ============================================================================
// 功能场景枚举
// ============================================================================
export const FunctionScene = Object.freeze({
  MEETING_PLANNER: 'meeting_planner',     // 多时区会议计划器
  WORLD_CLOCK: 'world_clock',             // 无限城市世界时钟看板
  TIME_DIFFERENCE: 'time_difference',     // 两地/多地时差精确计算
  CROSS_BORDER: 'cross_border',           // 跨境交易开盘/收盘倒计时
  OTHER: 'other'                          // 其他/兜底场景
});

// ============================================================================
// 权益时长（单位：毫秒）
// 文档规则：
//   轻量档 = 1小时 = 60*60*1000
//   全天档 = 24小时 = 24*60*60*1000
//   兜底档 = 10分钟 = 10*60*1000
//   累计档 = 7天 = 7*24*60*60*1000
// ============================================================================
export const RIGHT_DURATION = Object.freeze({
  [RightType.LIGHT]: 60 * 60 * 1000,               // 3,600,000 ms = 1小时
  [RightType.FULL]: 24 * 60 * 60 * 1000,            // 86,400,000 ms = 24小时
  [RightType.FALLBACK]: 10 * 60 * 1000,             // 600,000 ms = 10分钟
  [RightType.ADFREE]: 7 * 24 * 60 * 60 * 1000       // 604,800,000 ms = 7天
});

// ============================================================================
// 单日解锁上限
// 文档规则：
//   轻量档：单IP+单设备每天最多3次
//   全天档：单IP+单设备每天最多1次
//   兜底档：单IP+单设备每天最多2次
// ============================================================================
export const DAILY_LIMIT = Object.freeze({
  [RightType.LIGHT]: 3,
  [RightType.FULL]: 1,
  [RightType.FALLBACK]: 2
});

// ============================================================================
// 兜底阈值（单位：毫秒）
// 视频加载3秒超时则触发兜底机制
// ============================================================================
export const FALLBACK_THRESHOLD = 3000;

// ============================================================================
// 打卡规则常量
// 文档规则：
//   目标天数 = 3（连续3天打卡领7天无广告）
//   最大累计 = 2份（总时长不超过14天）
//   中断回退天数 = 1（中断1天回退1天）
// ============================================================================
export const CHECKIN_TARGET_DAYS = 3;
export const CHECKIN_MAX_STACK = 2;
export const CHECKIN_INTERRUPT_FALLBACK_DAYS = 1;

// ============================================================================
// 本地存储键名（与文档 STORAGE_KEYS 一致）
// ============================================================================
export const STORAGE_KEYS = Object.freeze({
  FUNCTION_RIGHTS: 'gtz_func_rights_v1',    // 单功能权益列表
  CHECKIN_RECORD: 'gtz_checkin_v1',          // 打卡记录
  ADFREE_RIGHT: 'gtz_adfree_v1',             // 全功能无广告权益
  TIME_OFFSET: 'gtz_time_offset_v1',         // 时间校准偏移量
  DEVICE_FINGERPRINT: 'gtz_fp_v1'            // 设备指纹
});

// ============================================================================
// 埋点事件名（与文档 TRACK_EVENTS 一致，共13个核心事件）
// ============================================================================
export const TRACK_EVENTS = Object.freeze({
  ENTRY_SHOW: 'ad_entry_show',               // 解锁入口展示
  ENTRY_CLICK: 'ad_entry_click',             // 用户点击解锁入口
  MODAL_SHOW: 'ad_modal_show',               // 解锁弹窗展示
  PLAY_START: 'ad_play_start',               // 视频开始播放
  PLAY_COMPLETE: 'ad_play_complete',          // 视频播放完成
  PLAY_ABORT: 'ad_play_abort',               // 用户中途关闭
  PLAY_FAIL: 'ad_play_fail',                 // 视频播放失败
  UNLOCK_SUCCESS: 'ad_unlock_success',        // 权益解锁成功
  UNLOCK_FALLBACK: 'ad_unlock_fallback',      // 触发兜底权益
  UNLOCK_EXPIRE: 'ad_unlock_expire',          // 权益到期
  CHECKIN_SUCCESS: 'checkin_success',         // 打卡成功
  PRO_INTENT_CLICK: 'pro_intent_click',        // 点击了解Pro
  PRO_EMAIL_SUBMIT: 'pro_email_submit'         // 邮箱订阅提交
});

// ============================================================================
// 错误码全集（与文档 ERROR_CODES 一致）
// ============================================================================
export const ERROR_CODES = Object.freeze({
  LOAD_TIMEOUT: 'AD_001',           // 视频加载超时（3秒兜底）
  RESOURCE_NOT_FOUND: 'AD_002',     // 视频资源不存在
  DAILY_LIMIT: 'AD_003',            // 单日解锁次数达上限
  RATE_LIMIT: 'AD_004',             // 速率限制触发
  RIGHT_INVALID: 'AD_005',          // 权益无效/已过期
  NO_FILL: 'AD_006',                // 广告无填充
  PLAY_FAIL: 'AD_007'               // 播放失败
});

// ============================================================================
// 权益优先级（从高到低）
// 文档 2.4 权益优先级与消耗顺序
// ============================================================================
export const RIGHT_PRIORITY = Object.freeze([
  RightType.ADFREE,     // 1. Pro订阅/打卡获得的全功能无广告权益（最高优先级）
  RightType.FULL,       // 2. 全天档单功能权益
  RightType.LIGHT,      // 3. 轻量档单功能权益
  RightType.FALLBACK    // 4. 兜底体验权益（最低优先级）
]);

// ============================================================================
// 视频播放规范常量
// ============================================================================
export const VIDEO_CONFIG = Object.freeze({
  LIGHT_DURATION: 8,          // 轻量档视频时长（秒）
  FULL_DURATION: 20,          // 全天档视频时长（秒）
  SUCCESS_DELAY: 1200,        // 播放完成后停留展示成功提示（毫秒）
  FIRST_FRAME_TARGET: 200,    // 馄帧渲染目标（毫秒），预加载前提下
  CACHE_EXPIRE: 24 * 60 * 60 * 1000  // 视频预加载缓存有效期24小时（毫秒）
});

// ============================================================================
// 视频规范：禁止操作
// ============================================================================
export const VIDEO_RESTRICTIONS = Object.freeze({
  NO_DRAG_PROGRESS: true,     // 禁止拖拽进度条
  NO_FAST_FORWARD: true,      // 禁止快进
  NO_SPEED_CHANGE: true,      // 禁止倍速播放
  DEFAULT_MUTED: true,        // 默认静音
  MANUAL_AUDIO_ONLY_SESSION: true  // 用户手动开启声音仅本次有效
});

// ============================================================================
// 风控常量
// ============================================================================
export const SECURITY_CONFIG = Object.freeze({
  TIME_TAMPER_THRESHOLD: 60 * 1000,    // 时间偏差>60秒判定为篡改（毫秒）
  CALIBRATION_INTERVAL: 10 * 60 * 1000, // 每10分钟重新校准（毫秒）
  CALIBRATION_FAIL_LIMIT: 3,            // 连续3次校准失败触发风控标记
  TIME_JUMP_THRESHOLD: 60 * 1000,       // 时间跳变>1分钟判定异常（毫秒）
  SIGN_SECRET: 'gtz_ad_rights_2026_v3'  // 本地存储签名盐值
});

// ============================================================================
// 速率限制（边缘层）
// ============================================================================
export const RATE_LIMIT = Object.freeze({
  AD_API_PER_MINUTE: 3,     // 单IP广告接口每分钟最多3次
  LIGHT_PER_DAY: 3,         // 单IP+单设备轻量解锁每天最多3次
  FULL_PER_DAY: 1,          // 单IP+单设备全天解锁每天最多1次
  FALLBACK_PER_DAY: 2       // 单IP+单设备兜底触发每天最多2次
});

// ============================================================================
// UI 视觉规范常量（文档 3.5）
// ============================================================================
export const UI_SPEC = Object.freeze({
  MODAL: {
    DESKTOP_WIDTH: 480,
    DESKTOP_MIN_HEIGHT: 320,
    DESKTOP_RADIUS: 12,
    DESKTOP_PADDING: 32,
    MOBILE_MARGIN: 20,
    MOBILE_RADIUS: 10,
    MOBILE_PADDING: 24,
    OVERLAY_COLOR: 'rgba(0,0,0,0.5)',
    TITLE_SIZE_DESKTOP: 18,
    TITLE_SIZE_MOBILE: 16,
    BODY_SIZE_DESKTOP: 14,
    BODY_SIZE_MOBILE: 13
  },
  BUTTON: {
    HEIGHT_DESKTOP: 44,
    HEIGHT_MOBILE: 40,
    RADIUS: 8,
    PRIMARY_COLOR: '#165DFF',
    SECONDARY_BG: '#F5F7FA',
    SECONDARY_TEXT: '#1D2129',
    LINK_COLOR: '#86909C',
    LINK_HOVER: '#165DFF',
    DISABLED_OPACITY: 0.4,
    LOADER_SIZE: 16
  },
  SKELETON: {
    BREATH_DURATION: 1500  // 骨架屏呼吸动画时长（毫秒）
  }
});

// ============================================================================
// 性能指标红线（文档 3.6）
// ============================================================================
export const PERFORMANCE_TARGETS = Object.freeze({
  LCP: 1500,                // 基础功能页LCP ≤ 1.5s（毫秒）
  MODAL_RESPONSE: 100,      // 点击解锁到弹窗出现 ≤ 100ms
  VIDEO_FIRST_FRAME: 200,   // 视频首帧渲染 ≤ 200ms
  MEMORY_LIMIT: 20,         // 广告模块内存增长 ≤ 20MB
  BUNDLE_SIZE: 100          // 广告模块gzip后 ≤ 100KB
});
