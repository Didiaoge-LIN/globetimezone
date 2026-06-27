/**
 * GlobeTimeZone 广告解锁权益体系 — API 端点：兜底事件上报
 * 文档版本：V3.0 §5.2 + §8.2
 * 
 * POST /api/ad/fallback-report — 兜底事件上报（风控统计）
 * 记录视频加载失败、超时等兜底触发事件，用于风控分析
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

  const { scene, right_type, trigger_reason, error_code, device_fp, session_id } = body;
  
  if (!scene || !trigger_reason) {
    return jsonResponse(400, 'missing required fields: scene, trigger_reason');
  }

  // 记录兜底事件（风控统计用）
  // 后续上线账号体系后存入BigQuery
  // 当前MVP：记录日志
  
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  console.log(`[fallback] scene=${scene} reason=${trigger_reason} error=${error_code} ip=${ip.substring(0,8)}... fp=${device_fp}`);

  return jsonResponse(200, 'fallback event recorded', {
    scene,
    trigger_reason,
    error_code,
    edge_timestamp: Date.now()
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
