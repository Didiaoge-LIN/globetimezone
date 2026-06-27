/**
 * GlobeTimeZone 广告解锁权益体系 — API 端点：解锁前置校验
 * 文档版本：V3.0 §5.2 + §4.11 + §7.2
 *
 * POST /api/ad/verify — 解锁前置校验（频次、权限、爬虫拦截）
 *
 * 边缘安全（文档§7.2 第一层防御）：
 *   1. 爬虫UA拦截（1000+特征库，当前实现核心关键词）
 *   2. 速率限制：单IP每分钟最多3次（CF KV持久化）
 *   3. 日限校验：轻量3次/全天1次/兜底2次（CF KV持久化）
 *   4. 注入X-CF-Edge-TS边缘时间戳
 *
 * KV键设计：
 *   速率限制: rl:{ip}:{YYYY-MM-DDTHH:MM}  TTL=120s
 *   日限:     dl:{right_type}:{YYYY-MM-DD}:{ip}  TTL=90000s（>24h确保跨天清理）
 *
 * 返回格式：{code, msg, data, timestamp}
 */

'use strict';

// ============================================================================
// 爬虫UA特征库（文档§7.2核心关键词）
// ============================================================================
const BOT_UA_PATTERNS = [
  'bot', 'crawler', 'spider', 'scraper', 'headless',
  'puppeteer', 'selenium', 'phantom', 'slurp', 'archive',
  'semrush', 'ahrefs', 'majestic', 'moz', 'dotbot',
  'rogerbot', 'exabot', 'megaindex', 'openhrefs'
];

// ============================================================================
// 速率限制配置
// ============================================================================
const RATE_LIMIT_PER_MINUTE = 3;
const RATE_LIMIT_TTL = 120;  // 秒，略大于60s窗口确保清理

// ============================================================================
// 日限配置（文档§2.3）
// ============================================================================
const DAILY_LIMITS = { light: 3, full: 1, fallback: 2 };
const DAILY_LIMIT_TTL = 90000;  // 秒，>86400确保跨天前不过期

// ============================================================================
// 统一返回格式
// ============================================================================
function jsonResponse(code, msg, data = null) {
  const body = {
    code,
    msg,
    data,
    timestamp: Date.now()
  };
  return new Response(JSON.stringify(body), {
    status: code >= 400 ? code : 200,
    headers: {
      'Content-Type': 'application/json',
      'X-CF-Edge-TS': String(Date.now()),  // 文档§6.2：注入边缘时间戳
      'Cache-Control': 'no-store, no-cache',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}

// ============================================================================
// 日期工具
// ============================================================================
function getTodayStr() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

function getMinuteBucket() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}T${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
}

// ============================================================================
// KV计数器工具：读取当前值，+1写回
// KV无原子操作，边缘场景下get-then-put存在极小竞态，由其他风控层兜底
// 返回递增后的计数值；KV不可用时返回-1（放行，优雅降级）
// ============================================================================
async function incrementCounter(kv, key, ttl) {
  if (!kv) return -1;
  try {
    const raw = await kv.get(key);
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;
    await kv.put(key, String(next), { expirationTtl: ttl });
    return next;
  } catch (err) {
    // KV故障不阻断业务，降级放行
    console.warn('KV操作失败，降级放行:', key, err && err.message);
    return -1;
  }
}

// 仅读取计数器（不递增），用于校验
async function readCounter(kv, key) {
  if (!kv) return 0;
  try {
    const raw = await kv.get(key);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

// ============================================================================
// 主处理函数
// ============================================================================
export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  const kv = env.AD_KV || null;

  // ---- 第一层防御：爬虫UA拦截（文档§7.2） ----
  const uaLower = userAgent.toLowerCase();
  const isBot = BOT_UA_PATTERNS.some(pattern => uaLower.includes(pattern));
  if (isBot) {
    return jsonResponse(403, 'access denied');
  }

  // ---- 解析请求体 ----
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, 'invalid request body');
  }

  const { scene, right_type, device_fp } = body;
  if (!scene || !right_type) {
    return jsonResponse(400, 'missing required fields: scene, right_type');
  }

  // ---- 第二层防御：速率限制（文档§7.2） ----
  // 单IP广告接口每分钟最多3次，KV计数器按分钟桶
  const rateKey = `rl:${ip}:${getMinuteBucket()}`;
  const rateCount = await incrementCounter(kv, rateKey, RATE_LIMIT_TTL);

  if (rateCount > RATE_LIMIT_PER_MINUTE) {
    return jsonResponse(429, 'rate limit exceeded', {
      retry_after: 60,
      limit: RATE_LIMIT_PER_MINUTE,
      current: rateCount
    });
  }

  // ---- 第三层防御：日限校验（文档§2.3） ----
  const limit = DAILY_LIMITS[right_type];
  if (!limit) {
    // ADFREE不受日限
    return jsonResponse(200, 'verified', {
      can_unlock: true,
      daily_limit: -1,
      ip: ip.substring(0, 8) + '...'  // 部分掩码保护隐私
    });
  }

  // 查询当日已解锁次数
  const dailyKey = `dl:${right_type}:${getTodayStr()}:${ip}`;
  const dailyCount = await readCounter(kv, dailyKey);

  if (dailyCount >= limit) {
    return jsonResponse(429, 'daily limit reached', {
      daily_limit: limit,
      daily_used: dailyCount,
      right_type,
      reset_at: '00:00 UTC'
    });
  }

  // 校验通过，返回可解锁
  return jsonResponse(200, 'verified', {
    can_unlock: true,
    daily_limit: limit,
    daily_used: dailyCount,
    scene,
    right_type
  });
}

// ============================================================================
// OPTIONS 预检（由_middleware.js统一处理CORS）
// ============================================================================
export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}

// 其他方法拒绝
export async function onRequestGet(context) {
  return jsonResponse(405, 'method not allowed, use POST');
}
