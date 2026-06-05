import { Hono } from 'hono';
import type { Context } from 'hono';
import { rateLimiter } from '../utils/rate-limiter';
import { cors } from 'hono/cors';
import { CONFIG } from '../config';
import { SimpleCircuitBreaker } from './utils';
import apiAdmin from '../api-admin/index';
import shareHandler from '../share-handler/index.ts';
import { UnifiedStorage, QuotaMonitor } from './kv-optimized';

interface Env {
  API_KEYS: KVNamespace;
  CIRCUIT_BREAKER: DurableObjectNamespace;
  TIMEZONE_API_URL: string;
  REMINDER_API_URL: string;
  NTP_CALIBRATOR_URL: string;
  CONFIG_URL: string;
  TIME_SIGNER_URL: string;
  REFERRAL_API_URL: string;
  ALERT_WEBHOOK: string;
  ADMIN_API_KEY: string;
}

const app = new Hono<{ 
  Bindings: Env;
  Variables: { 
    storage: UnifiedStorage; 
    quotaMonitor: QuotaMonitor;
    requestId: string;
    apiPlan?: string;
    apiKeyId?: string;
    priority?: string;
  } 
}>();

// ========== 全局作用域黑名单 ==========
const invalidKeyCache = new Map<string, number>();
let lastInvalidKeyCleanup = Date.now();

function cleanupInvalidKeyCache(): void {
  const now = Date.now();
  if (now - lastInvalidKeyCleanup > 600000) {
    lastInvalidKeyCleanup = now;
    for (const [key, timestamp] of invalidKeyCache.entries()) {
      if (now - timestamp > CONFIG.CACHE.INVALID_KEY_BLOCK_TTL) {
        invalidKeyCache.delete(key);
      }
    }
  }
}

// ========== 辅助函数 ==========

function logError(service: string, message: string, error?: Error): void {
  let stack = error?.stack || null;
  if (stack) {
    stack = stack.replace(/gtz-[a-f0-9-]+/gi, 'gtz-***');
    stack = stack.replace(
      /-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----/gi,
      '***'
    );
  }
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    service,
    level: 'error',
    message,
    stack
  }));
}

function errorResponse(
  c: Context,
  message: string,
  status: number,
  retryAfter?: number
): Response {
  const requestId = c.get('requestId') || crypto.randomUUID();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': requestId
  };
  if (retryAfter) {
    headers['Retry-After'] = retryAfter.toString();
  }
  return new Response(JSON.stringify({
    error: message,
    request_id: requestId,
    retry_after: retryAfter || null
  }), { status, headers });
}

// ========== fetchWithRetry 支持优先级 ==========
async function fetchWithRetry(
  url: string,
  options: RequestInit & { priority?: 'high' | 'low' },
  retries: number = CONFIG.RETRY.MAX_RETRIES
): Promise<Response> {
  const actualRetries = options.priority === 'high' ? retries + 2 : retries;
  const timeout = options.priority === 'high' ? 15000 : 10000;
  const retryDelay = options.priority === 'high' ? 500 : CONFIG.RETRY.RETRY_DELAY;

  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeout)
    });
    if (response.status >= 500 && response.status < 600 && actualRetries > 0) {
      console.log(`[Gateway] Fetch returned ${response.status}, retrying (${actualRetries} left): ${url}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, options, actualRetries - 1);
    }
    return response;
  } catch (e) {
    if (retries > 0) {
      console.log(`[Gateway] Fetch failed, retrying (${retries} left): ${url}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw e;
  }
}

// ========== 内存熔断器 ==========
const circuitBreakers = new Map<string, SimpleCircuitBreaker>();

function getCircuitBreaker(service: string): SimpleCircuitBreaker {
  let cb = circuitBreakers.get(service);
  if (!cb) {
    cb = new SimpleCircuitBreaker(CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD, CONFIG.CIRCUIT_BREAKER.OPEN_TIMEOUT);
    circuitBreakers.set(service, cb);
  }
  return cb;
}

async function allowRequest(service: string, _env: Env): Promise<boolean> {
  try {
    const cb = getCircuitBreaker(service);
    await cb.execute(async () => { return; });
    return true;
  } catch {
    return false;
  }
}

async function recordSuccess(service: string, _env: Env): Promise<void> {
  try {
    getCircuitBreaker(service).success();
  } catch {
    // 内存熔断器不需要IO
  }
}

async function recordFailure(service: string, _env: Env): Promise<void> {
  try {
    const cb = getCircuitBreaker(service);
    await cb.execute(async () => { throw new Error('Gateway proxy failure'); }).catch(() => {});
    const state = cb.getState();
    if (state.failures >= CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
      console.error(`[CircuitBreaker] ${service} circuit breaker OPEN — failures: ${state.failures}`);
    }
  } catch {
    // 内存操作
  }
}

// ========== 健康检查 ==========
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    version: 'v6.2-kv-optimized',
    timestamp: new Date().toISOString(),
    kv_optimization: 'enabled'
  });
});

// ========== 初始化 KV 优化访问层 ==========
app.use('*', async (c, next) => {
  const storage = new UnifiedStorage(c.env.API_KEYS, c.executionCtx);
  const quotaMonitor = new QuotaMonitor(c.env.API_KEYS, c.executionCtx);
  c.set('storage', storage);
  c.set('quotaMonitor', quotaMonitor);
  await next();
});

// ========== CORS 配置 ==========
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return false;
    if (origin === 'https://globetimezone.com') return true;
    if (origin.endsWith('.globetimezone.com')) return true;
    if (origin.startsWith('http://localhost:')) return true;
    return false;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-API-Key'],
  exposeHeaders: ['X-Request-Id', 'X-Response-Time', 'X-Trust-Level'],
  maxAge: 86400,
  credentials: false
}));

// ========== 基础限流 ==========
app.use('*', rateLimiter({
  limit: CONFIG.RATE_LIMIT.BASE_LIMIT,
  windowMs: 60 * 1000,
  keyGenerator: (c) => c.req.header('CF-Connecting-IP') || 'unknown',
  message: 'Too many requests',
  statusCode: 429,
}));

// ========== 请求ID和响应时间 ==========
app.use('/api/*', async (c, next) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  c.set('requestId', requestId);
  await next();
  c.res.headers.set('X-Request-Id', requestId);
  c.res.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
});

// ========== 免费用户配额限制（使用优化KV层）===========
app.use('/api/v1/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey) {
    const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
    const quotaKey = `free-quota-${clientIP}`;
    const storage = c.get('storage') as UnifiedStorage;
    
    try {
      const prev = await storage.get(quotaKey);
      const used = prev ? parseInt(prev) + 1 : 1;
      await storage.put(quotaKey, String(used), { expirationTtl: 86400 });
      
      const quotaMonitor = c.get('quotaMonitor') as QuotaMonitor;
      await quotaMonitor.recordRead();
      
      if (used > CONFIG.FREE_DAILY_QUOTA) {
        return errorResponse(c, 'Free daily limit reached. Get a free API key: https://globetimezone.com/api-docs', 429, 86400);
      }
    } catch (e) {
      logError('Gateway', 'Free quota KV failed', e as Error);
      const minuteKey = `free-minute-${clientIP}-${Math.floor(Date.now() / 60000)}`;
      try {
        const prevMin = await storage.get(minuteKey);
        const minuteUsed = prevMin ? parseInt(prevMin) + 1 : 1;
        await storage.put(minuteKey, String(minuteUsed), { expirationTtl: 120 });
        if (minuteUsed > CONFIG.FREE_MINUTE_QUOTA) {
          return errorResponse(c, 'Service temporarily busy. Please try again later or use an API key.', 429, 60);
        }
      } catch {
        return errorResponse(c, 'Service temporarily unavailable. Please use an API key for guaranteed access.', 503);
      }
    }
  }
  await next();
});

// ========== API Key 验证（使用优化KV层）============
app.use('/api/v1/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey) return next();

  const normalizedKey = apiKey.trim().toLowerCase();
  const keyMetaKey = `gtz-key-${normalizedKey}`;
  const quotaKey = `gtz-quota-${normalizedKey}`;
  const storage = c.get('storage') as UnifiedStorage;

  cleanupInvalidKeyCache();
  if (invalidKeyCache.has(normalizedKey) &&
      Date.now() - invalidKeyCache.get(normalizedKey)! < CONFIG.CACHE.INVALID_KEY_BLOCK_TTL) {
    return errorResponse(c, 'Invalid API Key', 401);
  }

  try {
    const keyDataStr = await storage.get(keyMetaKey);
    if (!keyDataStr) {
      invalidKeyCache.set(normalizedKey, Date.now());
      return errorResponse(c, 'Invalid API Key', 401);
    }
    
    const keyData = JSON.parse(keyDataStr);
    if (keyData.expires && new Date(keyData.expires) < new Date()) {
      return errorResponse(c, 'API Key expired', 401);
    }
    
    let used: number;
    try {
      const prev = await storage.get(quotaKey);
      used = prev ? parseInt(prev) + 1 : 1;
      if (used === 1) {
        await storage.put(quotaKey, '1', { expirationTtl: 86400 });
      } else {
        await storage.put(quotaKey, String(used), { expirationTtl: 86400 });
      }
    } catch (e) {
      logError('Gateway', 'KV increment failed', e as Error);
      return errorResponse(c, 'Service temporarily unavailable', 503);
    }
    
    if (used > keyData.quota) {
      return errorResponse(c, 'Quota exceeded', 429, 86400);
    }
    
    c.set('apiPlan', keyData.plan);
    c.set('apiKeyId', normalizedKey);
  } catch (e) {
    logError('Gateway', 'API Key validation error', e as Error);
    return errorResponse(c, 'Internal server error', 500);
  }
  
  await next();
});

// ========== 付费用户优先级标记 ==========
app.use('/api/v1/*', async (c, next) => {
  const apiPlan = c.get('apiPlan') || 'free';
  if (apiPlan === 'pro' || apiPlan === 'enterprise') {
    c.set('priority', 'high');
  }
  await next();
});

// ========== 付费用户额外配额（使用优化KV层）============
app.use('/api/v1/*', async (c, next) => {
  const apiPlan = c.get('apiPlan');
  if (apiPlan === 'pro' || apiPlan === 'enterprise') {
    const clientIP = c.req.header('CF-Connecting-IP') || 'unknown';
    const paidLimitKey = `paid-limit-${clientIP}`;
    const storage = c.get('storage') as UnifiedStorage;
    
    try {
      const prev = await storage.get(paidLimitKey);
      const used = prev ? parseInt(prev) + 1 : 1;
      if (used === 1) {
        await storage.put(paidLimitKey, '1', { expirationTtl: 60 });
      } else {
        await storage.put(paidLimitKey, String(used), { expirationTtl: 60 });
      }
      if (used > CONFIG.RATE_LIMIT.PAID_EXTRA_LIMIT) {
        return errorResponse(c, 'Too many requests', 429, 60);
      }
    } catch {
      // KV异常时降级
    }
  }
  await next();
});

// ========== 时区API转发 ==========
app.all('/api/v1/timezone/*', async (c) => {
  if (!(await allowRequest('timezone-api', c.env))) {
    return errorResponse(c, 'Service temporarily unavailable', 503, 30);
  }
  try {
    const target = c.env.TIMEZONE_API_URL;
    const url = new URL(c.req.url);
    const response = await fetchWithRetry(
      `${target}${url.pathname}${url.search}`,
      {
        method: c.req.method,
        headers: {
          ...Object.fromEntries(c.req.raw.headers),
          'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
          'X-Forwarded-Proto': c.req.header('CF-Visitor') ? JSON.parse(c.req.header('CF-Visitor')!).scheme : 'https',
          'X-Forwarded-Host': c.req.header('Host') || ''
        },
        body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
        priority: c.get('priority') || 'low'
      }
    );
    await recordSuccess('timezone-api', c.env);
    return response;
  } catch (e) {
    await recordFailure('timezone-api', c.env);
    return errorResponse(c, 'Service temporarily unavailable', 503, 30);
  }
});

// ========== 提醒API转发 ==========
app.all('/api/reminders/*', async (c) => {
  if (!(await allowRequest('reminder-api', c.env))) {
    return errorResponse(c, 'Service temporarily unavailable', 503, 30);
  }
  try {
    const target = c.env.REMINDER_API_URL;
    const url = new URL(c.req.url);
    const response = await fetchWithRetry(`${target}${url.pathname}${url.search}`, {
      method: c.req.method,
      headers: {
        ...Object.fromEntries(c.req.raw.headers),
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
        'X-Forwarded-Proto': c.req.header('CF-Visitor') ? JSON.parse(c.req.header('CF-Visitor')!).scheme : 'https',
        'X-Forwarded-Host': c.req.header('Host') || ''
      },
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
      priority: c.get('priority') || 'low'
    });
    await recordSuccess('reminder-api', c.env);
    return response;
  } catch (e) {
    await recordFailure('reminder-api', c.env);
    return errorResponse(c, 'Service temporarily unavailable', 503, 30);
  }
});

// ========== NTP校准API转发 ==========
app.all('/api/ntp/*', async (c) => {
  if (!(await allowRequest('ntp-calibrator', c.env))) {
    return errorResponse(c, 'Service temporarily unavailable', 503, 30);
  }
  try {
    const target = c.env.NTP_CALIBRATOR_URL;
    const url = new URL(c.req.url);
    const response = await fetchWithRetry(`${target}${url.pathname}${url.search}`, {
      method: c.req.method,
      headers: {
        ...Object.fromEntries(c.req.raw.headers),
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
        'X-Forwarded-Proto': c.req.header('CF-Visitor') ? JSON.parse(c.req.header('CF-Visitor')!).scheme : 'https',
        'X-Forwarded-Host': c.req.header('Host') || ''
      },
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
      priority: c.get('priority') || 'low'
    });
    await recordSuccess('ntp-calibrator', c.env);
    return response;
  } catch (e) {
    await recordFailure('ntp-calibrator', c.env);
    return errorResponse(c, 'Service temporarily unavailable', 503, 30);
  }
});

// ========== 时间签名API转发 ==========
app.all('/api/v1/signed-time', async (c) => {
  if (!(await allowRequest('time-signer', c.env))) {
    return errorResponse(c, 'Service temporarily unavailable', 503, 30);
  }
  try {
    const target = c.env.TIME_SIGNER_URL;
    const url = new URL(c.req.url);
    const response = await fetchWithRetry(`${target}${url.pathname}${url.search}`, {
      method: c.req.method,
      headers: {
        ...Object.fromEntries(c.req.raw.headers),
        'X-Forwarded-For': c.req.header('CF-Connecting-IP') || '',
        'X-Forwarded-Proto': c.req.header('CF-Visitor') ? JSON.parse(c.req.header('CF-Visitor')!).scheme : 'https',
        'X-Forwarded-Host': c.req.header('Host') || ''
      },
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
      priority: c.get('priority') || 'low'
    });
    await recordSuccess('time-signer', c.env);
    return response;
  } catch (e) {
    await recordFailure('time-signer', c.env);
    return errorResponse(c, 'Service temporarily unavailable', 503, 30);
  }
});

// ========== 配置API转发 ==========
app.all('/api/config', async (c) => {
  try {
    const target = c.env.CONFIG_URL;
    const url = new URL(c.req.url);
    return await fetchWithRetry(`${target}${url.pathname}${url.search}`, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
      priority: c.get('priority') || 'low'
    });
  } catch (e) {
    return errorResponse(c, 'Service temporarily unavailable', 503);
  }
});

// ========== API Admin 代理 ==========
app.all('/api/admin/*', (c) => {
  return apiAdmin.fetch(c.req.raw, c.env, c.executionCtx);
});

// ========== 推荐API代理 ==========
app.all('/api/referral/*', async (c) => {
  try {
    const target = c.env.REFERRAL_API_URL;
    const url = new URL(c.req.url);
    const relayPath = url.pathname.replace('/api/referral', '');
    const response = await fetch(`${target}${relayPath}${url.search}`, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== 'GET' && c.req.method !== 'HEAD' ? c.req.raw.body : undefined,
    });
    return response;
  } catch (e) {
    return errorResponse(c, 'Referral service unavailable', 503, 30);
  }
});

// ========== Stripe Webhook ==========
app.post('/api/stripe/webhook', async (c) => {
  try {
    const body = await c.req.json<{
      type: string;
      data: {
        object: {
          id: string;
          amount?: number;
          customer_email?: string;
          status?: string;
          metadata?: Record<string, string>;
        };
      };
    }>();

    const eventType = body.type;
    const eventData = body.data?.object;

    console.log(`[Stripe Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case 'payment_intent.succeeded': {
        const customerEmail = eventData?.customer_email || eventData?.metadata?.email;
        if (customerEmail) {
          try {
            const referralUrl = c.env.REFERRAL_API_URL;
            const rewardResp = await fetch(`${referralUrl}/reward`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: customerEmail }),
            });
            const rewardResult = await rewardResp.json() as { success?: boolean; message?: string };
            console.log(`[Stripe Webhook] Referral reward result for ${customerEmail}:`, JSON.stringify(rewardResult));
          } catch (rewardErr) {
            console.error('[Stripe Webhook] Referral reward trigger failed:', rewardErr);
          }
        }
        break;
      }
      case 'charge.refunded':
        console.log(`[Stripe Webhook] Refund processed: ${eventData?.id}, amount: ${eventData?.amount}`);
        break;
      case 'customer.subscription.updated':
        console.log(`[Stripe Webhook] Subscription updated: ${eventData?.id}, status: ${eventData?.status}`);
        break;
      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${eventType}`);
    }

    return c.json({ received: true });
  } catch (e) {
    console.error('[Stripe Webhook] Error processing webhook:', e);
    return errorResponse(c, 'Webhook processing error', 400);
  }
});

// ========== 短链接代理 ==========
app.all('/s/*', (c) => shareHandler.fetch(c.req.raw, c.env, c.executionCtx));

// ========== 404 处理 ==========
app.all('*', (c) => {
  return errorResponse(c, 'Not Found', 404);
});

// ========== Cron任务分发 ==========
export { CircuitBreakerDO } from './durable-objects/circuit-breaker';

export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    try {
      if (controller.cron === '*/5 * * * *') {
        ctx.waitUntil(Promise.all([
          import('../reminder-scheduler/index').then(m => m.default.scheduled(controller, env, ctx)),
          import('../ntp-calibrator/index').then(m => m.default.scheduled(controller, env, ctx))
        ]));
      }
      
      if (controller.cron === '0 0 * * *') {
        ctx.waitUntil(Promise.all([
          import('../api-admin/index').then(m => m.default.scheduled(controller, env, ctx)),
          import('../tz-watcher/index').then(m => m.default.scheduled(controller, env, ctx))
        ]));
      }
    } catch (e: unknown) {
      const error = e as Error;
      console.error('[Gateway] Scheduled task failed:', error.message);
    }
  }
};
