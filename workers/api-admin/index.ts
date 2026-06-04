import { Hono } from 'hono';
import { z } from 'zod';
import { cors } from 'hono/cors';
import { rateLimiter } from '../utils/rate-limiter';
import { CONFIG } from '../config';
import {
  errorResponse,
  logError,
  hashApiKey
} from '../gateway/utils';

interface Env {
  API_KEYS: KVNamespace;
  ADMIN_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

// ====================== 全局安全中间件 ======================

// 1. 环境变量启动校验
app.use('*', async (c, next) => {
  try {
    if (!c.env.API_KEYS || !c.env.ADMIN_API_KEY) {
      throw new Error('Missing required environment variables: API_KEYS or ADMIN_API_KEY');
    }
  } catch (e) {
    logError('api-admin', 'Environment validation failed', e as Error);
    return errorResponse(c, 'Service configuration error', 500);
  }
  await next();
});

// 2. CORS安全配置
app.use('*', cors({
  origin: (origin) => {
    if (!origin) return false;
    if (origin === 'https://globetimezone.com') return true;
    if (origin.endsWith('.globetimezone.com')) return true;
    if (origin.startsWith('http://localhost:')) return true;
    return false;
  },
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-API-Key', 'X-Admin-Key'],
  maxAge: 86400
}));

// 3. 管理员权限校验（致命漏洞修复）
app.use('/api/admin/*', async (c, next) => {
  const adminKey = c.req.header('X-Admin-Key');
  if (!adminKey) {
    return errorResponse(c, 'Unauthorized', 401);
  }

  const requestHash = await hashApiKey(adminKey);
  const expectedHash = await hashApiKey(c.env.ADMIN_API_KEY);

  if (requestHash !== expectedHash) {
    logError('api-admin', `Failed admin login attempt from ${c.req.header('CF-Connecting-IP')}`);
    return errorResponse(c, 'Unauthorized', 401);
  }

  await next();
});

// 4. 全局限流
app.use('/api/admin/*', rateLimiter({
  limit: 20,
  windowMs: 60 * 1000,
  keyGenerator: (c) => c.req.header('CF-Connecting-IP') || 'unknown',
  message: 'Too many requests',
  statusCode: 429,
}));

// ====================== 输入验证Schema ======================
const KeyRequestSchema = z.object({
  email: z.string().email('Invalid email address')
});

// ====================== 1. 生成API密钥 ======================
app.post('/api/admin/key', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = KeyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(c, 'Invalid email address', 400);
    }
    const email = parsed.data.email;

    let apiKey = '';
    let keyExists = true;
    let attempts = 0;
    while (keyExists && attempts < 5) {
      apiKey = `${CONFIG.API_KEY_PREFIX}${crypto.randomUUID()}`;
      keyExists = (await c.env.API_KEYS.get(`gtz-key-${apiKey}`)) !== null;
      attempts++;
    }
    if (keyExists) {
      return errorResponse(c, 'Failed to generate unique key', 500);
    }

    const keyData = {
      email: email,
      plan: 'free',
      quota: CONFIG.FREE_DAILY_QUOTA,
      created: new Date().toISOString(),
      expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    };

    await c.env.API_KEYS.put(`gtz-key-${apiKey}`, JSON.stringify(keyData));

    logError('api-admin', `Admin generated API key for ${email}`);

    return c.json({
      api_key: apiKey,
      plan: keyData.plan,
      quota: keyData.quota,
      message: 'API Key generated successfully. Keep this key secure.'
    }, 201);

  } catch (e: unknown) {
    const error = e as Error;
    logError('api-admin', 'Key generation failed', error);
    return errorResponse(c, 'Internal server error', 500);
  }
});

// ====================== 2. 分页列出密钥 ======================
app.get('/api/admin/keys', async (c) => {
  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '100'), 1000);
    const cursor = c.req.query('cursor');

    const list = await c.env.API_KEYS.list({ prefix: 'gtz-key-', limit, cursor });
    const keys = [];

    for (const key of list.keys) {
      const keyDataStr = await c.env.API_KEYS.get(key.name);
      if (keyDataStr) {
        const keyData = JSON.parse(keyDataStr);
        keys.push({
          api_key: key.name.replace('gtz-key-', ''),
          email: keyData.email,
          plan: keyData.plan,
          quota: keyData.quota,
          created: keyData.created,
          expires: keyData.expires
        });
      }
    }

    return c.json({
      keys,
      total: keys.length,
      cursor: list.cursor,
      has_more: !list.list_complete
    });
  } catch (e: unknown) {
    const error = e as Error;
    logError('api-admin', 'List keys failed', error);
    return errorResponse(c, 'Internal server error', 500);
  }
});

// ====================== 3. 查询密钥用量 ======================
app.get('/api/admin/usage', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey) {
    return errorResponse(c, 'Missing API Key', 401);
  }

  const normalizedKey = apiKey.trim().toLowerCase();
  const keyMetaKey = `gtz-key-${normalizedKey}`;
  const quotaKey = `gtz-quota-${normalizedKey}`;

  try {
    const keyDataStr = await c.env.API_KEYS.get(keyMetaKey);
    if (!keyDataStr) {
      return errorResponse(c, 'Invalid API Key', 401);
    }

    const keyData = JSON.parse(keyDataStr);
    const used = parseInt(await c.env.API_KEYS.get(quotaKey) || '0', 10);

    return c.json({
      plan: keyData.plan,
      quota: keyData.quota,
      used: used,
      remaining: Math.max(0, keyData.quota - used),
      expires: keyData.expires,
    });
  } catch (e: unknown) {
    const error = e as Error;
    logError('api-admin', 'Query usage failed', error);
    return errorResponse(c, 'Internal server error', 500);
  }
});

// ====================== 4. 吊销密钥 ======================
app.delete('/api/admin/key', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey) {
    return errorResponse(c, 'Missing API Key', 401);
  }

  const normalizedKey = apiKey.trim().toLowerCase();
  const keyMetaKey = `gtz-key-${normalizedKey}`;
  const quotaKey = `gtz-quota-${normalizedKey}`;

  try {
    const keyDataStr = await c.env.API_KEYS.get(keyMetaKey);
    if (!keyDataStr) {
      return errorResponse(c, 'Invalid API Key', 401);
    }

    await c.env.API_KEYS.delete(keyMetaKey);
    await c.env.API_KEYS.delete(quotaKey);

    logError('api-admin', `Admin revoked key: ${normalizedKey.slice(0, 16)}***`);
    return c.json({ message: 'API Key revoked successfully' });
  } catch (e: unknown) {
    const error = e as Error;
    logError('api-admin', 'Revoke key failed', error);
    return errorResponse(c, 'Internal server error', 500);
  }
});

// ====================== 5. 密钥轮换（含配额迁移） ======================
app.post('/api/admin/key/rotate', async (c) => {
  const oldKey = c.req.header('X-API-Key');
  if (!oldKey) {
    return errorResponse(c, 'Missing API Key', 401);
  }

  const normalizedOldKey = oldKey.trim().toLowerCase();
  const oldKeyMetaKey = `gtz-key-${normalizedOldKey}`;
  const oldQuotaKey = `gtz-quota-${normalizedOldKey}`;

  try {
    const oldKeyMeta = await c.env.API_KEYS.get(oldKeyMetaKey);
    if (!oldKeyMeta) {
      return errorResponse(c, 'Invalid API Key', 401);
    }

    const keyData = JSON.parse(oldKeyMeta);
    const newKey = `${CONFIG.API_KEY_PREFIX}${crypto.randomUUID()}`;
    const newQuotaKey = `gtz-quota-${newKey}`;

    const oldQuota = await c.env.API_KEYS.get(oldQuotaKey);
    if (oldQuota) {
      await c.env.API_KEYS.put(newQuotaKey, oldQuota, { expirationTtl: 86400 });
    }

    await c.env.API_KEYS.put(`gtz-key-${newKey}`, JSON.stringify(keyData));

    await c.env.API_KEYS.put(oldKeyMetaKey, JSON.stringify({
      ...keyData,
      expires: new Date(Date.now() + 86400000).toISOString()
    }));

    // 中危缺陷修复：清理旧配额数据
    await c.env.API_KEYS.delete(oldQuotaKey);

    logError('api-admin', `Admin rotated key: ${normalizedOldKey.slice(0, 16)}***`);
    return c.json({
      new_api_key: newKey,
      old_key_expires: new Date(Date.now() + 86400000).toISOString(),
      message: 'Old key will expire in 24 hours. Please update your applications.'
    });
  } catch (e: unknown) {
    const error = e as Error;
    logError('api-admin', 'Key rotation failed', error);
    return errorResponse(c, 'Internal server error', 500);
  }
});

// ====================== 健康检查 ======================
app.get('/api/admin/health', (c) => {
  return c.json({
    status: 'ok',
    version: 'v6.1-ultimate',
    timestamp: new Date().toISOString()
  });
});

// ====================== 定时清理 ======================
export default {
  fetch: app.fetch,
  async scheduled(controller: ScheduledController, env: Env): Promise<void> {
    try {
      if (controller.cron === '0 0 * * *') {
        let cursor: string | undefined;
        let cleanedCount = 0;

        do {
          const list = await env.API_KEYS.list({
            prefix: 'gtz-key-',
            limit: 100,
            cursor
          });

          for (const key of list.keys) {
            try {
              const keyDataStr = await env.API_KEYS.get(key.name);
              if (keyDataStr) {
                const keyData = JSON.parse(keyDataStr);
                const expireDate = new Date(keyData.expires);
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

                if (expireDate < thirtyDaysAgo) {
                  const apiKeyId = key.name.replace('gtz-key-', '');
                  await env.API_KEYS.delete(key.name);
                  await env.API_KEYS.delete(`gtz-quota-${apiKeyId}`);
                  cleanedCount++;
                }
              }
            } catch (err) {
              console.error(`[api-admin] Clean key failed: ${key.name}`, err);
            }
          }

          cursor = list.cursor;
          await new Promise(resolve => setTimeout(resolve, 0));
        } while (cursor);

        logError('api-admin', `Daily cleanup completed. ${cleanedCount} keys cleaned.`);
      }
    } catch (e: unknown) {
      logError('api-admin', 'Scheduled task failed', e as Error);
    }
  }
};
