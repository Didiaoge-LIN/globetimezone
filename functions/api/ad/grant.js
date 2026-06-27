/**
 * GlobeTimeZone 广告解锁权益体系 — API 端点：权益发放
 * 文档版本：V3.0 §5.2
 *
 * POST /api/ad/grant — 权益发放（幂等性：每个请求带唯一ID，重复请求返回相同结果）
 *
 * 接口鉴权：设备指纹签名 + 时间戳校验
 * 响应时间目标：正常≤100ms，峰值≤300ms
 *
 * KV键设计：
 *   日限递增: dl:{right_type}:{YYYY-MM-DD}:{ip}  TTL=90000s
 *   幂等标记: idem:{request_id}  TTL=300s（5分钟内重复请求返回同一结果）
 */

'use strict';

const BOT_UA_PATTERNS = [
  'bot', 'crawler', 'spider', 'scraper', 'headless',
  'puppeteer', 'selenium', 'phantom', 'slurp', 'archive'
];

const RIGHT_DURATION_MS = {
  light: 60 * 60 * 1000,      // 1小时
  full: 24 * 60 * 60 * 1000,   // 24小时
  fallback: 10 * 60 * 1000,    // 10分钟
  adfree: 7 * 24 * 60 * 60 * 1000  // 7天
};

const DAILY_LIMITS = { light: 3, full: 1, fallback: 2 };
const DAILY_LIMIT_TTL = 90000;
const IDEMPOTENCY_TTL = 300;  // 5分钟

function jsonResponse(code, msg, data = null) {
  return new Response(JSON.stringify({
    code, msg, data, timestamp: Date.now()
  }), {
    status: code >= 400 ? code : 200,
    headers: {
      'Content-Type': 'application/json',
      'X-CF-Edge-TS': String(Date.now()),
      'Cache-Control': 'no-store, no-cache',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });
}

function getTodayStr() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
}

// KV计数器递增（与verify.js一致逻辑）
async function incrementCounter(kv, key, ttl) {
  if (!kv) return -1;
  try {
    const raw = await kv.get(key);
    const current = raw ? parseInt(raw, 10) : 0;
    const next = current + 1;
    await kv.put(key, String(next), { expirationTtl: ttl });
    return next;
  } catch (err) {
    console.warn('KV操作失败，降级放行:', key, err && err.message);
    return -1;
  }
}

// 幂等性检查：request_id已处理则返回缓存的grantData
async function checkIdempotency(kv, requestId) {
  if (!kv || !requestId) return null;
  try {
    const cached = await kv.get(`idem:${requestId}`);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

async function saveIdempotency(kv, requestId, grantData) {
  if (!kv || !requestId) return;
  try {
    await kv.put(`idem:${requestId}`, JSON.stringify(grantData), {
      expirationTtl: IDEMPOTENCY_TTL
    });
  } catch (err) {
    console.warn('幂等标记保存失败:', err && err.message);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  const kv = env.AD_KV || null;

  // 爬虫拦截
  const uaLower = userAgent.toLowerCase();
  if (BOT_UA_PATTERNS.some(p => uaLower.includes(p))) {
    return jsonResponse(403, 'access denied');
  }

  // 解析请求体
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, 'invalid request body');
  }

  const { scene, right_type, request_id, device_fp, session_id } = body;

  if (!scene || !right_type || !request_id) {
    return jsonResponse(400, 'missing required fields: scene, right_type, request_id');
  }

  // ---- 幂等性检查：重复请求直接返回已发放的权益 ----
  const cached = await checkIdempotency(kv, request_id);
  if (cached) {
    return jsonResponse(200, 'rights granted (idempotent)', cached);
  }

  const duration = RIGHT_DURATION_MS[right_type];
  if (!duration) {
    return jsonResponse(400, `invalid right_type: ${right_type}`);
  }

  // ---- 日限二次校验 + 递增（防止绕过verify直接调grant） ----
  const limit = DAILY_LIMITS[right_type];
  if (limit) {
    const dailyKey = `dl:${right_type}:${getTodayStr()}:${ip}`;
    const newCount = await incrementCounter(kv, dailyKey, DAILY_LIMIT_TTL);
    if (newCount > limit) {
      return jsonResponse(429, 'daily limit reached', {
        daily_limit: limit,
        daily_used: newCount > 0 ? newCount - 1 : limit,
        right_type
      });
    }
  }

  // 发放权益（返回权益信息，前端自行存储到localStorage）
  const now = Date.now();
  const grantData = {
    scene,
    type: right_type,
    expireTime: now + duration,
    createdAt: now,
    duration_ms: duration,
    request_id,     // 幂等标记
    session_id      // 解锁会话ID
  };

  // 保存幂等标记
  await saveIdempotency(kv, request_id, grantData);

  return jsonResponse(200, 'rights granted', grantData);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
