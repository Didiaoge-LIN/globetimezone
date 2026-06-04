// GlobeTimeZone Health Check - Cloudflare Pages Function
// Serves /health on the custom domain, bypassing the Gateway Worker.

export async function onRequest(context) {
  const healthData = {
    status: 'ok',
    version: 'v6.2-pages',
    timestamp: new Date().toISOString(),
    services: {
      pages: { status: 'ok', project: 'globetimezone-web' },
      gateway: { status: 'degraded', note: 'Worker v2026-05-29 deployed; /api/health broken pending redeploy' },
      auto_deploy: { status: 'ok', note: 'GitHub → Pages CI/CD active' }
    },
    features: [
      'cloudflare-pages',
      'github-auto-deploy',
      'gateway-worker',
      'kv-rate-limit',
      'circuit-breaker'
    ],
    uptime: 'https://globetimezone.com'
  };

  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'X-Health-Source': 'pages-function'
    }
  });
}
