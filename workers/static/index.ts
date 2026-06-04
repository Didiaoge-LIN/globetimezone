import { Hono } from 'hono';
import type { Context } from 'hono';

interface Env {
  ASSETS: Fetcher;
}

const app = new Hono<{ Bindings: Env }>();

// 安全响应头常量 (修复二)
const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'",
};

function applySecurityHeaders(headers: Headers): void {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
}

// 静态资源服务：通过 env.ASSETS.fetch() 访问上传的 assets
app.get('*', async (c: Context) => {
  const url = new URL(c.req.url);
  let pathname = url.pathname;

  // 默认首页
  if (pathname === '/') {
    pathname = '/index.html';
  }

  try {
    const assetUrl = new URL(pathname, url.origin);
    const response = await c.env.ASSETS.fetch(assetUrl.toString());
    const newHeaders = new Headers(response.headers);
    applySecurityHeaders(newHeaders);

    if (response.status === 404) {
      // SPA fallback 或 404
      const fallback = await c.env.ASSETS.fetch(new URL('/index.html', url.origin).toString());
      const fbHeaders = new Headers(fallback.headers);
      applySecurityHeaders(fbHeaders);
      return new Response(fallback.body, { status: 404, headers: fbHeaders });
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  } catch (e) {
    const headers = new Headers({ 'Content-Type': 'text/html' });
    applySecurityHeaders(headers);
    return new Response('<h1>Internal Server Error</h1>', { status: 500, headers });
  }
});

export default app;
