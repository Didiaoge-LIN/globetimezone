import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { rateLimiter } from '../utils/rate-limiter';
import { CONFIG } from '../config';
import { errorResponse, escapeHtml, isValidUrl, logError, hashApiKey } from '../gateway/utils';

interface Env {
  SHARE_DATA: KVNamespace;
}

// ========== KV 原子计数（CAS重试） ==========
async function safeIncrement(kv: KVNamespace, key: string, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    const current = parseInt(await kv.get(key) || '0', 10);
    const success = await kv.put(key, (current + 1).toString(), {
      expirationTtl: 7776000,
      cas: current.toString()
    });
    if (success) return;
  }
  console.warn(`[KV] Failed to increment ${key} after ${retries} retries`);
}

const app = new Hono<{ Bindings: Env }>();

function validateEnv(env: Env): void {
  if (!env.SHARE_DATA) {
    throw new Error('Missing required environment variable: SHARE_DATA');
  }
}

app.use('*', async (c, next) => {
  try {
    validateEnv(c.env);
  } catch (e) {
    logError('share-handler', 'Environment validation failed', e as Error);
    return errorResponse(c, 'Service configuration error', 500);
  }
  await next();
});

app.use('*', cors({
  origin: (origin) => {
    if (!origin) return false;
    if (origin === 'https://globetimezone.com') return true;
    if (origin.endsWith('.globetimezone.com')) return true;
    if (origin.startsWith('http://localhost:')) return true;
    return false;
  },
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type', 'X-API-Key'],
  maxAge: 86400
}));

app.use('/api/share/shorten', rateLimiter({
  limit: CONFIG.SHARE.RATE_LIMIT,
  windowMs: 60 * 1000,
  keyGenerator: (c) => c.req.header('CF-Connecting-IP') || 'unknown',
  message: 'Too many requests. Please try again later.',
  statusCode: 429,
}));

// ========== POST /api/share/shorten ==========
app.post('/api/share/shorten', async (c) => {
  try {
    const body = await c.req.json();
    const { url, title, description, image, expiration_ttl } = body;
    
    if (!url) return errorResponse(c, 'URL is required', 400);
    if (url.length > CONFIG.SHARE.URL_MAX_LENGTH) {
      return errorResponse(c, `URL cannot exceed ${CONFIG.SHARE.URL_MAX_LENGTH} characters`, 400);
    }
    if (!isValidUrl(url)) {
      return errorResponse(c, 'Invalid URL. Only http and https protocols are allowed.', 400);
    }
    if (title && title.length > CONFIG.SHARE.TITLE_MAX_LENGTH) {
      return errorResponse(c, `Title cannot exceed ${CONFIG.SHARE.TITLE_MAX_LENGTH} characters`, 400);
    }
    if (description && description.length > CONFIG.SHARE.DESCRIPTION_MAX_LENGTH) {
      return errorResponse(c, `Description cannot exceed ${CONFIG.SHARE.DESCRIPTION_MAX_LENGTH} characters`, 400);
    }

    const shareImage = image || CONFIG.SHARE.DEFAULT_IMAGE;
    if (shareImage !== CONFIG.SHARE.DEFAULT_IMAGE && !isValidUrl(shareImage)) {
      return errorResponse(c, 'Invalid image URL', 400);
    }
    
    const expirationTtl = expiration_ttl || CONFIG.SHARE.EXPIRATION_TTL;
    if (!CONFIG.SHARE.EXPIRATION_OPTIONS.includes(expirationTtl)) {
      return errorResponse(c, 
        `Invalid expiration time. Valid options: ${CONFIG.SHARE.EXPIRATION_OPTIONS_LABELS.join(', ')}`, 
        400
      );
    }

    let id: string;
    let idExists = true;
    let attempts = 0;
    while (idExists && attempts < 5) {
      id = crypto.randomUUID().slice(0, CONFIG.SHARE.SHORT_CODE_LENGTH);
      idExists = (await c.env.SHARE_DATA.get(`${id}-meta`)) !== null;
      attempts++;
    }
    if (idExists) {
      return errorResponse(c, 'Failed to generate unique short link. Please try again.', 500);
    }

    // 极低危风险修复：API密钥哈希存储
    const apiKey = c.req.header('X-API-Key') || '';
    const createdByHash = apiKey ? await hashApiKey(apiKey) : '';

    await c.env.SHARE_DATA.put(`${id}-meta`, JSON.stringify({
      url,
      title: title || 'GlobeTimeZone - Global Time Decision',
      description: description || 'Check the best time for your global team.',
      image: shareImage,
      created: new Date().toISOString(),
      createdBy: createdByHash,
      expirationTtl
    }), { expirationTtl });
    
    await c.env.SHARE_DATA.put(`${id}-clicks`, '0', { expirationTtl });

    return c.json({
      short_url: `https://share.globetimezone.com/s/${id}`,
      id,
      expires_in: expirationTtl,
      expires_at: new Date(Date.now() + expirationTtl * 1000).toISOString()
    }, 201);

  } catch (e: unknown) {
    const error = e as Error;
    logError('share-handler', 'Shorten failed', error);
    return errorResponse(c, 'Failed to create short link', 500);
  }
});

// ========== GET /s/:id 重定向 ==========
app.get('/s/:id', async (c) => {
  const id = c.req.param('id');
  const metaStr = await c.env.SHARE_DATA.get(`${id}-meta`);
  if (!metaStr) return c.html('<h1>Link not found</h1>', 404);
  const meta = JSON.parse(metaStr);
  c.executionCtx.waitUntil(
    safeIncrement(c.env.SHARE_DATA, `${id}-clicks`)
  );
  return c.redirect(meta.url, 302);
});

// ========== GET /share/:id 动态OG卡片 ==========
app.get('/share/:id', async (c) => {
  const id = c.req.param('id');
  const metaStr = await c.env.SHARE_DATA.get(`${id}-meta`);
  if (!metaStr) return c.html('<h1>Link not found</h1>', 404);

  const meta = JSON.parse(metaStr);
  const escapedTitle = escapeHtml(meta.title);
  const escapedDescription = escapeHtml(meta.description);
  const escapedUrl = escapeHtml(meta.url);
  const escapedImage = escapeHtml(meta.image || CONFIG.SHARE.DEFAULT_IMAGE);
  
  return c.html(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDescription}">
  <meta property="og:image" content="${escapedImage}">
  <meta property="og:url" content="https://globetimezone.com/share/${id}">
  <meta property="og:type" content="website">
  <meta name="twitter:card" content="summary_large_image">
  <meta http-equiv="refresh" content="0;url=${escapedUrl}">
</head>
<body style="font-family:sans-serif;text-align:center;padding:2rem;">
  <p>Redirecting to <a href="${escapedUrl}">${escapedTitle}</a>...</p>
</body>
</html>`);
});

// ========== GET /api/share/stats/:id 统计数据 ==========
app.get('/api/share/stats/:id', async (c) => {
  const id = c.req.param('id');
  const apiKey = c.req.header('X-API-Key') || '';
  const requestHash = apiKey ? await hashApiKey(apiKey) : '';
  
  const metaStr = await c.env.SHARE_DATA.get(`${id}-meta`);
  if (!metaStr) return errorResponse(c, 'Link not found', 404);
  
  const meta = JSON.parse(metaStr);
  if (meta.createdBy && requestHash && meta.createdBy !== requestHash) {
    return errorResponse(c, 'Unauthorized', 401);
  }
  
  const clicksStr = await c.env.SHARE_DATA.get(`${id}-clicks`);
  const clicks = parseInt(clicksStr || '0', 10);
  
  return c.json({
    id,
    url: meta.url,
    title: meta.title,
    image: meta.image,
    created: meta.created,
    clicks,
    expirationTtl: meta.expirationTtl || CONFIG.SHARE.EXPIRATION_TTL,
    expires: new Date(Date.now() + (meta.expirationTtl || CONFIG.SHARE.EXPIRATION_TTL) * 1000).toISOString()
  });
});

app.get('/api/health', (c) => c.json({ status: 'ok', version: 'v6.1-complete' }));

export default app;
