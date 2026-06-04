// GlobeTimeZone Health Check - Cloudflare Pages Function
// Serves /api/health on Pages, bypassing Gateway Worker for this endpoint.

export async function onRequest(context) {
  const { request, env } = context;
  
  // Check if this domain has the Gateway Worker handling /api/*
  // If so, prefer the Worker's health check
  const healthData = {
    status: 'ok',
    version: 'v6.2-pages',
    timestamp: new Date().toISOString(),
    features: [
      'cloudflare-pages',
      'github-auto-deploy',
      'gateway-worker',
      'kv-rate-limit',
      'circuit-breaker'
    ],
    services: {
      pages: 'globetimezone-web',
      gateway: 'globetimezone-gateway-production',
      domain: 'globetimezone.com'
    }
  };
  
  return new Response(JSON.stringify(healthData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
