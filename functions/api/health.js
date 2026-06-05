/**
 * GlobeTimeZone Health Check — Pages Function
 * 架构简化：API 由 Pages Functions 直接处理，不再依赖 Gateway Worker
 */
export async function onRequest(context) {
  const healthData = {
    status: 'ok',
    version: 'v6.3-pages-solo',
    timestamp: new Date().toISOString(),
    architecture: 'pages-functions',
    features: [
      'cloudflare-pages',
      'github-auto-deploy',
      'pages-functions-api',
      'timezone-conversion',
      'dst-detection'
    ],
    endpoints: {
      health: '/api/health',
      timezone: '/api/timezone?zone=Asia/Shanghai',
      convert: '/api/timezone/convert?from=Asia/Shanghai&to=America/New_York',
      list: '/api/timezone/list'
    }
  };

  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
