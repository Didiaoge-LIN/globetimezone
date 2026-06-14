/**
 * GlobeTimeZone Health Check — Pages Function
 * v5.0 — IP限流 + deep依赖检查 + KV状态 + Stripe状态
 * 需配置：HEALTH_LIMIT_KV（KV命名空间绑定），HEALTH_WHITELIST_IPS（环境变量）
 */
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  // 非法方法拦截
  if (method !== 'GET' && method !== 'HEAD') {
    return new Response(null, {
      status: 405,
      headers: {
        Allow: 'GET, HEAD',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }

  // 获取客户端真实IP
  const clientIP = request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0].trim()
    || 'unknown';

  // IP白名单校验
  const whitelist = env?.HEALTH_WHITELIST_IPS ? env.HEALTH_WHITELIST_IPS.split(',').map(ip => ip.trim()) : [];
  if (!whitelist.includes(clientIP) && env?.HEALTH_LIMIT_KV) {
    const limitKey = `health:limit:${clientIP}`;
    const maxRequests = 10;
    const windowSeconds = 60;

    try {
      const record = await env.HEALTH_LIMIT_KV.get(limitKey, { type: 'json' });
      const now = Date.now();

      if (!record || now - record.timestamp > windowSeconds * 1000) {
        await env.HEALTH_LIMIT_KV.put(
          limitKey,
          JSON.stringify({ timestamp: now, count: 1 }),
          { expirationTtl: windowSeconds }
        );
      } else if (record.count >= maxRequests) {
        return new Response(JSON.stringify({ status: 'rate_limited' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      } else {
        record.count += 1;
        await env.HEALTH_LIMIT_KV.put(limitKey, JSON.stringify(record), { expirationTtl: windowSeconds });
      }
    } catch (e) {
      // KV不可用时放通请求，可用性优先
      console.warn('[Health] Rate limit KV unavailable, skip limit');
    }
  }

  // 深度检查参数
  const isDeep = new URL(request.url).searchParams.get('deep') === '1';

  // 基础响应
  const payload = {
    status: 'ok',
    service: 'globetimezone-pages',
    version: 'v5.0',
    timestamp: Date.now(),
    colo: request.cf?.colo || 'unknown',
    region: request.cf?.region || 'unknown',
  };

  // 深度检查：返回依赖状态
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
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  };

  return new Response(method === 'HEAD' ? null : JSON.stringify(payload, null, 2), {
    status: 200,
    headers,
  });
}
