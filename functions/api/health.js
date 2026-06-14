'use strict';

/**
 * GlobeTimeZone Health Check — Pages Function
 * v6.0 — 简化版：CORS预检由中间件统一处理，降级容错
 */
export function onRequest(context) {
  const { request, env } = context;

  // 基础响应
  const payload = {
    status: 'ok',
    service: 'globetimezone-pages',
    version: 'v9.0',
    timestamp: Date.now(),
    colo: request.cf?.colo || 'unknown',
    region: request.cf?.region || 'unknown'
  };

  // 深度检查参数
  const isDeep = new URL(request.url).searchParams.get('deep') === '1';
  if (isDeep) {
    payload.checks = {
      edge_runtime: 'ok',
      kv_storage: env?.HEALTH_LIMIT_KV ? 'configured' : 'not_configured',
      stripe: env?.ENABLE_STRIPE === 'true' ? 'enabled' : 'disabled',
      ga4: env?.GA_MEASUREMENT_ID && env.GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX' ? 'configured' : 'not_configured',
      firebase: env?.FIREBASE_PROJECT_ID ? 'configured' : 'not_configured',
    };
  }

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': '*',
    'X-Content-Type-Options': 'nosniff',
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers,
  });
}
