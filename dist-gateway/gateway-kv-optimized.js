/**
 * GlobeTimeZone Gateway Worker - KV Optimized v6.2
 * 特性：
 * 1. LRU 内存缓存 - 99% 请求不访问 KV
 * 2. 批量写入队列 - 减少 KV 写入次数
 * 3. 额度监控 - 防止 429 错误
 */

// ==================== 配置 ====================
const CONFIG = {
  CACHE: {
    INVALID_KEY_BLOCK_TTL: 3600000
  },
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  },
  CIRCUIT_BREAKER: {
    FAILURE_THRESHOLD: 5,
    OPEN_TIMEOUT: 30000
  },
  RATE_LIMIT: {
    BASE_LIMIT: 100,
    PAID_EXTRA_LIMIT: 200
  },
  FREE_DAILY_QUOTA: 100,
  FREE_MINUTE_QUOTA: 10
};

// ==================== LRU 内存缓存 ====================
class LRUCache {
  constructor(maxSize = 2000, ttl = 10 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  delete(key) {
    this.cache.delete(key);
  }
}

// ==================== 批量写入队列 ====================
class BatchWriteQueue {
  constructor(kv, ctx, batchSize = 800, flushInterval = 30 * 1000) {
    this.queue = new Map();
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.timer = null;
    this.kv = kv;
    this.ctx = ctx;
  }

  put(key, value) {
    this.queue.set(key, value);
    
    if (this.queue.size >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.queue.size === 0 || !this.kv) return;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const bulk = Array.from(this.queue.entries()).map(([key, value]) => ({ key, value }));
    this.queue.clear();

    try {
      for (let i = 0; i < bulk.length; i += 1000) {
        await this.kv.bulkPut(bulk.slice(i, i + 1000));
      }
      console.log(`[KV-Optimized] Batch write success: ${bulk.length} keys`);
    } catch (error) {
      console.error('[KV-Optimized] Batch write failed:', error);
      bulk.forEach(({ key, value }) => this.queue.set(key, value));
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), this.flushInterval * 2);
    }
  }
}

// ==================== 统一存储层 ====================
class UnifiedStorage {
  constructor(kv, ctx) {
    this.memory = new LRUCache(2000, 10 * 60 * 1000);
    this.cache = caches.default;
    this.kv = kv;
    this.ctx = ctx;
    this.writeQueue = new BatchWriteQueue(kv, ctx);
  }

  async get(key) {
    // L1: 内存缓存
    const memValue = this.memory.get(key);
    if (memValue !== null) {
      console.log(`[KV-Optimized] Memory cache hit: ${key}`);
      return memValue;
    }

    // L2: Cache API
    const cacheKey = new Request(`https://internal-kv-cache/${key}`);
    const cached = await this.cache.match(cacheKey);
    if (cached) {
      const value = await cached.text();
      this.memory.set(key, value);
      console.log(`[KV-Optimized] Cache API hit: ${key}`);
      
      // 后台更新
      if (this.ctx) {
        this.ctx.waitUntil((async () => {
          try {
            const freshValue = await this.kv.get(key);
            if (freshValue !== null && freshValue !== value) {
              await this.cache.put(
                cacheKey,
                new Response(freshValue, {
                  headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' }
                })
              );
              this.memory.set(key, freshValue);
            }
          } catch {}
        })());
      }
      
      return value;
    }

    // L3: KV
    try {
      const value = await this.kv.get(key);
      if (value !== null) {
        this.memory.set(key, value);
        
        if (this.ctx) {
          this.ctx.waitUntil(
            this.cache.put(
              cacheKey,
              new Response(value, {
                headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' }
              })
            )
          );
        }
        
        console.log(`[KV-Optimized] KV hit: ${key}`);
        return value;
      }
    } catch (error) {
      console.error('[KV-Optimized] KV read failed:', error);
      return null;
    }

    return null;
  }

  async getJSON(key) {
    const value = await this.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  async put(key, value, options = {}) {
    const { immediate = false, expirationTtl } = options;
    
    // 立即更新内存和 Cache API
    this.memory.set(key, value);
    const cacheKey = new Request(`https://internal-kv-cache/${key}`);
    
    if (this.ctx) {
      this.ctx.waitUntil(
        this.cache.put(
          cacheKey,
          new Response(value, {
            headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' }
          })
        )
      );
    }

    // 写入策略
    if (immediate) {
      try {
        if (expirationTtl) {
          await this.kv.put(key, value, { expirationTtl });
        } else {
          await this.kv.put(key, value);
        }
        console.log(`[KV-Optimized] Immediate write: ${key}`);
      } catch (error) {
        console.error('[KV-Optimized] Immediate write failed:', error);
        this.writeQueue.put(key, value);
      }
    } else {
      this.writeQueue.put(key, value);
      console.log(`[KV-Optimized] Queued for batch write: ${key}`);
    }
  }

  async putJSON(key, value, options = {}) {
    return this.put(key, JSON.stringify(value), options);
  }

  async delete(key) {
    this.memory.delete(key);
    const cacheKey = new Request(`https://internal-kv-cache/${key}`);
    
    if (this.ctx) {
      this.ctx.waitUntil(Promise.all([
        this.cache.delete(cacheKey),
        this.kv.delete(key)
      ]));
    } else {
      await Promise.all([
        this.cache.delete(cacheKey),
        this.kv.delete(key)
      ]);
    }
  }

  async flushWrites() {
    await this.writeQueue.flush();
  }
}

// ==================== 全局变量 ====================
const invalidKeyCache = new Map();
let lastInvalidKeyCleanup = Date.now();
const circuitBreakers = new Map();

// ==================== 辅助函数 ====================

function cleanupInvalidKeyCache() {
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

function logError(service, message, error) {
  let stack = error?.stack || null;
  if (stack) {
    stack = stack.replace(/gtz-[a-f0-9-]+/gi, 'gtz-***');
  }
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    service,
    level: 'error',
    message,
    stack
  }));
}

function errorResponse(c, message, status, retryAfter) {
  const requestId = c.requestId || crypto.randomUUID();
  const headers = {
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

// ==================== 熔断器 ====================
class SimpleCircuitBreaker {
  constructor(threshold, timeout) {
    this.failures = 0;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF-OPEN';
    }

    try {
      const result = await fn();
      this.success();
      return result;
    } catch (error) {
      this.failure();
      throw error;
    }
  }

  success() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  failure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState() {
    return { failures: this.failures, state: this.state };
  }
}

function getCircuitBreaker(service) {
  let cb = circuitBreakers.get(service);
  if (!cb) {
    cb = new SimpleCircuitBreaker(
      CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD,
      CONFIG.CIRCUIT_BREAKER.OPEN_TIMEOUT
    );
    circuitBreakers.set(service, cb);
  }
  return cb;
}

async function allowRequest(service, env) {
  try {
    const cb = getCircuitBreaker(service);
    await cb.execute(async () => {});
    return true;
  } catch {
    return false;
  }
}

async function recordSuccess(service, env) {
  try {
    getCircuitBreaker(service).success();
  } catch {}
}

async function recordFailure(service, env) {
  try {
    const cb = getCircuitBreaker(service);
    await cb.execute(async () => { throw new Error('failure'); }).catch(() => {});
    const state = cb.getState();
    if (state.failures >= CONFIG.CIRCUIT_BREAKER.FAILURE_THRESHOLD) {
      console.error(`[CircuitBreaker] ${service} OPEN - failures: ${state.failures}`);
    }
  } catch {}
}

// ==================== Fetch 重试 ====================
async function fetchWithRetry(url, options, retries = CONFIG.RETRY.MAX_RETRIES) {
  const actualRetries = options.priority === 'high' ? retries + 2 : retries;
  const timeout = options.priority === 'high' ? 15000 : 10000;
  const retryDelay = options.priority === 'high' ? 500 : CONFIG.RETRY.RETRY_DELAY;

  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(timeout)
    });
    if (response.status >= 500 && response.status < 600 && actualRetries > 0) {
      console.log(`[Gateway] Retry ${actualRetries} left: ${url}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, options, actualRetries - 1);
    }
    return response;
  } catch (e) {
    if (retries > 0) {
      console.log(`[Gateway] Fetch failed, retry ${retries} left: ${url}`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw e;
  }
}

// ==================== 主 Worker ====================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 初始化存储层
    const storage = new UnifiedStorage(env.API_KEYS, ctx);
    
    // CORS 处理
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // 健康检查
    if (pathname === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        version: 'v6.2-kv-optimized',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 免费用户配额检查
    if (pathname.startsWith('/api/v1/') && !request.headers.get('X-API-Key')) {
      const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
      const quotaKey = `free-quota-${clientIP}`;
      
      try {
        const prev = await storage.get(quotaKey);
        const used = prev ? parseInt(prev) + 1 : 1;
        await storage.put(quotaKey, String(used), { expirationTtl: 86400 });
        
        if (used > CONFIG.FREE_DAILY_QUOTA) {
          return errorResponse({ requestId: crypto.randomUUID() }, 'Free daily limit reached', 429, 86400);
        }
      } catch (e) {
        logError('Gateway', 'Free quota check failed', e);
      }
    }

    // API Key 验证
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey) {
      const normalizedKey = apiKey.trim().toLowerCase();
      const keyMetaKey = `gtz-key-${normalizedKey}`;
      
      cleanupInvalidKeyCache();
      if (invalidKeyCache.has(normalizedKey) &&
          Date.now() - invalidKeyCache.get(normalizedKey) < CONFIG.CACHE.INVALID_KEY_BLOCK_TTL) {
        return errorResponse({ requestId: crypto.randomUUID() }, 'Invalid API Key', 401);
      }

      try {
        const keyDataStr = await storage.get(keyMetaKey);
        if (!keyDataStr) {
          invalidKeyCache.set(normalizedKey, Date.now());
          return errorResponse({ requestId: crypto.randomUUID() }, 'Invalid API Key', 401);
        }
        
        const keyData = JSON.parse(keyDataStr);
        if (keyData.expires && new Date(keyData.expires) < new Date()) {
          return errorResponse({ requestId: crypto.randomUUID() }, 'API Key expired', 401);
        }
        
        const quotaKey = `gtz-quota-${normalizedKey}`;
        const prev = await storage.get(quotaKey);
        const used = prev ? parseInt(prev) + 1 : 1;
        await storage.put(quotaKey, String(used), { expirationTtl: 86400 });
        
        if (used > keyData.quota) {
          return errorResponse({ requestId: crypto.randomUUID() }, 'Quota exceeded', 429, 86400);
        }
      } catch (e) {
        logError('Gateway', 'API Key validation failed', e);
        return errorResponse({ requestId: crypto.randomUUID() }, 'Internal server error', 500);
      }
    }

    // 路由转发
    try {
      let target = null;
      let service = null;
      
      if (pathname.startsWith('/api/v1/timezone/')) {
        target = env.TIMEZONE_API_URL;
        service = 'timezone-api';
      } else if (pathname.startsWith('/api/reminders/')) {
        target = env.REMINDER_API_URL;
        service = 'reminder-api';
      } else if (pathname.startsWith('/api/ntp/')) {
        target = env.NTP_CALIBRATOR_URL;
        service = 'ntp-calibrator';
      } else if (pathname === '/api/v1/signed-time') {
        target = env.TIME_SIGNER_URL;
        service = 'time-signer';
      } else if (pathname === '/api/config') {
        target = env.CONFIG_URL;
      } else if (pathname.startsWith('/api/admin/')) {
        target = env.API_ADMIN_URL || env.TIMEZONE_API_URL;
      } else if (pathname.startsWith('/api/referral/')) {
        target = env.REFERRAL_API_URL;
      } else {
        return errorResponse({ requestId: crypto.randomUUID() }, 'Not Found', 404);
      }

      if (service && !(await allowRequest(service, env))) {
        return errorResponse({ requestId: crypto.randomUUID() }, 'Service temporarily unavailable', 503, 30);
      }

      const targetUrl = `${target}${pathname}${url.search}`;
      const response = await fetchWithRetry(targetUrl, {
        method: request.method,
        headers: {
          ...Object.fromEntries(request.headers),
          'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
          'X-Forwarded-Proto': 'https',
          'X-Forwarded-Host': request.headers.get('Host') || ''
        },
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
      });

      if (service) {
        await recordSuccess(service, env);
      }

      return response;
    } catch (e) {
      logError('Gateway', 'Request failed', e);
      if (service) {
        await recordFailure(service, env);
      }
      return errorResponse({ requestId: crypto.randomUUID() }, 'Service temporarily unavailable', 503);
    }
  },

  async scheduled(controller, env, ctx) {
    console.log(`[Gateway] Cron trigger: ${controller.cron}`);
    // 这里可以添加定时任务处理
  }
};
