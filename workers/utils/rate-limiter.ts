// 轻量级 Cloudflare Workers 兼容限流中间件
// 避免使用 setInterval（全局作用域禁止异步I/O）

interface RateLimitOptions {
  limit: number;
  windowMs: number;
  keyGenerator?: (c: any) => string;
  message?: string;
  statusCode?: number;
}

interface ClientInfo {
  hits: number;
  resetTime: number;
}

export function rateLimiter(options: RateLimitOptions) {
  const {
    limit = 20,
    windowMs = 60 * 1000,
    keyGenerator = (c: any) => c.req?.header?.('CF-Connecting-IP') || 'unknown',
    message = 'Too many requests',
    statusCode = 429,
  } = options;

  const clients = new Map<string, ClientInfo>();

  // 定期清理过期条目（按需，每次请求最多清理一次）
  let lastCleanup = 0;

  return async (c: any, next: () => Promise<void>) => {
    const now = Date.now();

    // 按需清理（每60秒最多清理一次）
    if (now - lastCleanup > 60_000) {
      lastCleanup = now;
      for (const [key, info] of clients) {
        if (now > info.resetTime) {
          clients.delete(key);
        }
      }
    }

    const key = await keyGenerator(c);
    let client = clients.get(key);

    if (!client || now > client.resetTime) {
      client = { hits: 1, resetTime: now + windowMs };
      clients.set(key, client);
    } else {
      client.hits++;
    }

    const remaining = Math.max(0, limit - client.hits);
    const resetSeconds = Math.ceil((client.resetTime - now) / 1000);

    // 设置标准限流响应头
    c.header('RateLimit-Limit', limit.toString());
    c.header('RateLimit-Remaining', remaining.toString());
    c.header('RateLimit-Reset', Math.ceil(client.resetTime / 1000).toString());

    if (client.hits > limit) {
      c.header('Retry-After', resetSeconds.toString());
      c.status(statusCode);
      return c.text(message);
    }

    await next();
  };
}
