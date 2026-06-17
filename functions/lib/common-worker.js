/**
 * 通用工具函数库（对比页/API专用）
 */

/**
 * 简单IP限流（Worker内存版，免费版可用）
 * 配合Cloudflare WAF使用效果更佳
 */
export class RateLimiter {
  /**
   * @param {number} windowMs 限流窗口毫秒数
   * @param {number} maxRequests 窗口内最大请求数
   */
  constructor(windowMs = 60000, maxRequests = 20) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.clients = new Map();
  }

  /**
   * 检查是否触发限流
   * @param {string} ip 客户端IP
   * @returns {boolean} true=允许通过，false=触发限流
   */
  check(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const records = this.clients.get(ip) || [];
    const validRecords = records.filter(time => time > windowStart);

    if (validRecords.length >= this.maxRequests) {
      return false;
    }

    validRecords.push(now);
    this.clients.set(ip, validRecords);

    // 自动清理
    if (validRecords.length === 1) {
      setTimeout(() => {
        this.clients.delete(ip);
      }, this.windowMs);
    }

    return true;
  }
}

/**
 * 标准化JSON响应构造
 * @param {any} data 响应数据
 * @param {number} status HTTP状态码
 * @param {string} cacheControl 缓存策略
 * @returns {Response} 标准响应对象
 */
export function jsonResponse(data, status = 200, cacheControl = 'no-cache') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'Referrer-Policy': 'no-referrer'
    }
  });
}

/**
 * 判断是否为官方搜索引擎爬虫
 * @param {Request} request 请求对象
 * @returns {boolean}
 */
export function isSearchEngineBot(request) {
  // 优先使用Cloudflare官方验证头
  const cfVerified = request.headers.get('CF-Verified-Bot');
  if (cfVerified === 'search_engine') return true;

  // 降级UA匹配
  const ua = (request.headers.get('User-Agent') || '').toLowerCase();
  const officialBots = ['googlebot', 'bingbot', 'baiduspider', 'yandexbot', 'duckduckbot'];
  return officialBots.some(bot => ua.includes(bot));
}
