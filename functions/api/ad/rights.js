/**
 * GlobeTimeZone 广告解锁权益体系 — API 端点：查询用户权益
 * 文档版本：V3.0 §5.2
 * 
 * GET /api/ad/rights — 查询用户当前权益（用于跨设备恢复、状态验证）
 * 返回权益摘要：hasAdFree, adfreeRemaining, functionRights[]
 */

'use strict';

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

export async function onRequestGet(context) {
  const { request } = context;
  
  // 权益查询是轻量级操作，不需要爬虫拦截
  // 但需要注入边缘时间戳供前端校准
  
  // 从URL参数获取设备指纹（可选）
  const url = new URL(request.url);
  const deviceFp = url.searchParams.get('device_fp') || '';
  
  // 当前权益由前端localStorage管理
  // 后端仅提供边缘时间戳和基础状态信息
  // 后续账号体系上线后，后端可从数据库查询
  
  return jsonResponse(200, 'ok', {
    edge_timestamp: Date.now(),
    server_time: Date.now(),
    device_fp_valid: deviceFp ? true : null,
    note: 'current MVP: rights managed in localStorage, server provides edge time only'
  });
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
