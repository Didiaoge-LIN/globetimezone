/**
 * GlobeTimeZone 广告解锁权益体系 — API 端点：打卡上报
 * 文档版本：V3.0 §5.2
 * 
 * POST /api/ad/checkin — 打卡上报（记录打卡行为，辅助校验）
 * 幂等性：同一天同一设备只能打卡一次
 */

'use strict';

const BOT_UA_PATTERNS = [
  'bot', 'crawler', 'spider', 'scraper', 'headless',
  'puppeteer', 'selenium', 'phantom', 'slurp', 'archive'
];

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

export async function onRequestPost(context) {
  const { request } = context;
  const userAgent = request.headers.get('User-Agent') || '';

  // 爬虫拦截
  const uaLower = userAgent.toLowerCase();
  if (BOT_UA_PATTERNS.some(p => uaLower.includes(p))) {
    return jsonResponse(403, 'access denied');
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, 'invalid request body');
  }

  const { continuous_days, total_stack, interrupt_days, device_fp, request_id } = body;
  
  // 记录打卡行为（后续上线账号体系后存入数据库）
  // 当前MVP：仅记录日志，前端本地管理
  
  return jsonResponse(200, 'checkin recorded', {
    edge_timestamp: Date.now(),
    continuous_days,
    total_stack,
    request_id
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
