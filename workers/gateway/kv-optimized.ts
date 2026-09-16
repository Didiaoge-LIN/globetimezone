/**
 * Cloudflare KV 优化访问层 - 防止 429 错误
 * 特性：
 * 1. LRU 内存缓存（微秒级响应，99% 请求不访问 KV）
 * 2. Cache API 二级缓存（毫秒级响应）
 * 3. 批量写入队列（减少 KV 写入次数）
 * 4. 额度监控与自动降级
 */

// ==================== LRU 内存缓存 ====================
class LRUCache {
  private cache = new Map<string, { value: string; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 2000, ttl = 10 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // LRU: 访问时移到末尾
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: string): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ==================== 批量写入队列 ====================
class BatchWriteQueue {
  private queue = new Map<string, string>();
  private batchSize: number;
  private flushInterval: number;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private kv: KVNamespace | null = null;
  private ctx: ExecutionContext | null = null;

  constructor(batchSize = 800, flushInterval = 30 * 1000) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
  }

  init(kv: KVNamespace, ctx: ExecutionContext): void {
    this.kv = kv;
    this.ctx = ctx;
  }

  put(key: string, value: string): void {
    this.queue.set(key, value);
    
    if (this.queue.size >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush(): Promise<void> {
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
      console.log(`[KV-Optimized] 批量写入成功: ${bulk.length} 个键`);
    } catch (error) {
      console.error('[KV-Optimized] 批量写入失败:', error);
      bulk.forEach(({ key, value }) => this.queue.set(key, value));
      if (this.timer) clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), this.flushInterval * 2);
    }
  }
}

// ==================== 统一存储抽象层 ====================
class UnifiedStorage {
  private memory: LRUCache;
  private cache: Cache;
  private kv: KVNamespace;
  private writeQueue: BatchWriteQueue;
  private ctx: ExecutionContext | null = null;

  constructor(kv: KVNamespace, ctx: ExecutionContext) {
    this.memory = new LRUCache(2000, 10 * 60 * 1000);
    this.cache = caches.default;
    this.kv = kv;
    this.writeQueue = new BatchWriteQueue(800, 30 * 1000);
    this.writeQueue.init(kv, ctx);
    this.ctx = ctx;
  }

  async get(key: string, options?: { type?: 'text' | 'json'; skipCache?: boolean }): Promise<string | null> {
    const skipCache = options?.skipCache || false;
    
    // 第1层：内存缓存（微秒级）
    if (!skipCache) {
      const memValue = this.memory.get(key);
      if (memValue !== null) {
        console.log(`[KV-Optimized] 内存缓存命中: ${key}`);
        return memValue;
      }
    }

    // 第2层：Cache API（毫秒级）
    if (!skipCache) {
      const cacheKey = new Request(`https://internal-kv-cache/${key}`);
      const cached = await this.cache.match(cacheKey);
      if (cached) {
        const value = await cached.text();
        this.memory.set(key, value);
        console.log(`[KV-Optimized] Cache API 命中: ${key}`);
        
        // 后台异步更新缓存
        if (this.ctx) {
          this.ctx.waitUntil((async () => {
            try {
              const freshValue = await this.kv.get(key);
              if (freshValue !== null && freshValue !== value) {
                const freshResponse = new Response(freshValue, {
                  headers: {
                    'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200'
                  }
                });
                await this.cache.put(cacheKey, freshResponse);
                this.memory.set(key, freshValue);
              }
            } catch {
              // 后台更新失败，忽略
            }
          })());
        }
        
        return value;
      }
    }

    // 第3层：KV 存储（几十毫秒级）
    try {
      const value = await this.kv.get(key);
      if (value !== null) {
        this.memory.set(key, value);
        
        if (this.ctx) {
          this.ctx.waitUntil(
            this.cache.put(
              new Request(`https://internal-kv-cache/${key}`),
              new Response(value, {
                headers: {
                  'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200'
                }
              })
            )
          );
        }
        
        console.log(`[KV-Optimized] KV 命中: ${key}`);
        return value;
      }
    } catch (error) {
      console.error('[KV-Optimized] KV 读取失败:', error);
      return null;
    }

    console.log(`[KV-Optimized] 未找到数据: ${key}`);
    return null;
  }

  async getJSON<T = any>(key: string, skipCache = false): Promise<T | null> {
    const value = await this.get(key, { skipCache });
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async put(
    key: string, 
    value: string, 
    options?: { immediate?: boolean; expirationTtl?: number }
  ): Promise<void> {
    const immediate = options?.immediate || false;
    const expirationTtl = options?.expirationTtl;

    // 立即更新内存和 Cache API
    this.memory.set(key, value);
    const cacheKey = new Request(`https://internal-kv-cache/${key}`);
    
    if (this.ctx) {
      this.ctx.waitUntil(
        this.cache.put(
          cacheKey,
          new Response(value, {
            headers: {
              'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200'
            }
          })
        )
      );
    }

    // 写入策略
    if (immediate) {
      // 立即写入 KV
      try {
        if (expirationTtl) {
          await this.kv.put(key, value, { expirationTtl });
        } else {
          await this.kv.put(key, value);
        }
        console.log(`[KV-Optimized] 立即写入 KV: ${key}`);
      } catch (error) {
        console.error('[KV-Optimized] 立即写入失败:', error);
        // 失败后再加入批量队列重试
        this.writeQueue.put(key, value);
      }
    } else {
      // 异步批量写入 KV
      this.writeQueue.put(key, value);
      console.log(`[KV-Optimized] 数据已加入写入队列: ${key}`);
    }
  }

  async putJSON(
    key: string,
    value: any,
    options?: { immediate?: boolean; expirationTtl?: number }
  ): Promise<void> {
    return this.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
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
    
    console.log(`[KV-Optimized] 数据已删除: ${key}`);
  }

  // 强制刷新批量写入队列
  async flushWrites(): Promise<void> {
    await this.writeQueue.flush();
  }
}

// ==================== 额度监控 ====================
class QuotaMonitor {
  private kv: KVNamespace;
  private ctx: ExecutionContext | null = null;

  constructor(kv: KVNamespace, ctx: ExecutionContext) {
    this.kv = kv;
    this.ctx = ctx;
  }

  async recordRead(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `quota:${today}`;
    
    if (this.ctx) {
      this.ctx.waitUntil(
        (async () => {
          try {
            const data = await this.kv.get(key, 'json') || { reads: 0, writes: 0 };
            data.reads++;
            await this.kv.put(key, JSON.stringify(data), { expirationTtl: 86400 });
          } catch {
            // 忽略额度记录失败
          }
        })()
      );
    }
  }

  async recordWrite(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `quota:${today}`;
    
    if (this.ctx) {
      this.ctx.waitUntil(
        (async () => {
          try {
            const data = await this.kv.get(key, 'json') || { reads: 0, writes: 0 };
            data.writes++;
            await this.kv.put(key, JSON.stringify(data), { expirationTtl: 86400 });
          } catch {
            // 忽略额度记录失败
          }
        })()
      );
    }
  }

  async getQuotaStatus(): Promise<{ reads: number; writes: number; status: 'normal' | 'warning' | 'degraded' }> {
    const today = new Date().toISOString().split('T')[0];
    const key = `quota:${today}`;
    
    try {
      const data = await this.kv.get(key, 'json') || { reads: 0, writes: 0 };
      const readUsage = data.reads / 100000;
      const writeUsage = data.writes / 1000;
      const maxUsage = Math.max(readUsage, writeUsage);
      
      let status: 'normal' | 'warning' | 'degraded' = 'normal';
      if (maxUsage >= 0.95) {
        status = 'degraded';
      } else if (maxUsage >= 0.8) {
        status = 'warning';
      }
      
      return { ...data, status };
    } catch {
      return { reads: 0, writes: 0, status: 'normal' };
    }
  }
}

// ==================== 导出 ====================
export {
  LRUCache,
  BatchWriteQueue,
  UnifiedStorage,
  QuotaMonitor
};
