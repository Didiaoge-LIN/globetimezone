/**
 * GlobeTimeZone Status Check — Pages Function
 * 
 * Route: /api/status
 * 
 * Why a second health endpoint?
 * Cloudflare intercepts /api/health on custom domains (likely due to a 
 * previously configured Cloudflare Health Check monitoring that URL).
 * The request never reaches our Functions code — CF edge returns 500.
 * 
 * /api/status provides the same health data without the CF interception.
 * /api/health still works on .pages.dev subdomain.
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
      status: '/api/status',
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
