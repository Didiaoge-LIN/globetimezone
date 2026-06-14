/**
 * GlobeTimeZone Health Check — Pages Function
 * v4.1 — IP限流（单IP每分钟10次）+ KV存储 + 白名单
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

  // IP白名单校验（环境变量 HEALTH_WHITELIST_IPS，多个用逗号分隔）
  const whitelist = env?.HEALTH_WHITELIST_IPS ? env.HEALTH_WHITELIST_IPS.split(',').map(ip => ip.trim()) : [];
  if (!whitelist.includes(clientIP) && env?.HEALTH_LIMIT_KV) {
    const limitKey = `health:limit:${clientIP}`;
    const maxRequests = 10;  // 每分钟最大请求数
    const windowSeconds = 60; // 限流窗口

    try {
      const record = await env.HEALTH_LIMIT_KV.get(limitKey, { type: 'json' });
      const now = Date.now();

      if (!record || now - record.timestamp > windowSeconds * 1000) {
        // 窗口过期，重置计数
        await env.HEALTH_LIMIT_KV.put(
          limitKey,
          JSON.stringify({ timestamp: now, count: 1 }),
          { expirationTtl: windowSeconds }
        );
      } else if (record.count >= maxRequests) {
        // 超出限流阈值
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
        // 计数递增
        record.count += 1;
        await env.HEALTH_LIMIT_KV.put(limitKey, JSON.stringify(record), { expirationTtl: windowSeconds });
      }
    } catch (e) {
      // KV不可用时放通请求，可用性优先
      console.warn('[Health] Rate limit KV unavailable, skip limit');
    }
  }

  // 正常健康响应
  const payload = {
    status: 'ok',
    service: 'city-pages',
    version: 'v6.1',
    timestamp: Date.now(),
    colo: request.cf?.colo || 'unknown',
    region: request.cf?.region || 'unknown',
  };

  return new Response(method === 'HEAD' ? null : JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
