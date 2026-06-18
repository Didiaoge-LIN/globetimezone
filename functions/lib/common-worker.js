/**
 * 通用工具函数库（对比页/API专用）
 *
 * ⚠️ Pages Functions 是无状态的（每个请求新实例），
 *    内存限流器在此环境不生效。如需限流请用 Cloudflare WAF。
 */

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
