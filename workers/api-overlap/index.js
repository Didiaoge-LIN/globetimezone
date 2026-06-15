import { isValidTimeZone, getWorkWindowsUtc, intersectAllWindows } from '../lib/timezone.js';
import { RateLimiter, jsonResponse } from '../lib/common.js';

// 初始化限流器：单IP每分钟20次请求
const rateLimiter = new RateLimiter(60000, 20);

/**
 * Referer合法性校验
 * 有Referer且非本站则拦截；无Referer放行（兼容隐私模式），但受限流约束
 * @param {string} referer
 * @returns {boolean}
 */
function isValidReferer(referer) {
  if (!referer) return true;
  try {
    const url = new URL(referer);
    return url.hostname === 'globetimezone.com' || url.hostname.endsWith('.globetimezone.com');
  } catch {
    return false;
  }
}

export default {
  async fetch(request) {
    // 仅允许GET请求
    if (request.method !== 'GET') {
      return jsonResponse({ code: 405, msg: '方法不允许' }, 405);
    }

    const url = new URL(request.url);
    const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
    const referer = request.headers.get('Referer') || '';

    // 1. 频率限制
    if (!rateLimiter.check(clientIp)) {
      return jsonResponse({ code: 429, msg: '请求过于频繁，请稍后再试' }, 429);
    }

    // 2. Referer校验
    if (!isValidReferer(referer)) {
      return jsonResponse({ code: 403, msg: '非法请求' }, 403);
    }

    // 3. 参数提取与校验
    const citiesParam = url.searchParams.get('cities') || '';
    const durationParam = url.searchParams.get('duration') || '60';
    const cities = citiesParam.split(',').map(s => s.trim()).filter(Boolean);
    const duration = parseInt(durationParam, 10);

    if (cities.length < 2 || cities.length > 10) {
      return jsonResponse({ code: 400, msg: '城市数量需在2-10个之间' }, 400);
    }
    if (isNaN(duration) || duration < 15 || duration > 480) {
      return jsonResponse({ code: 400, msg: '会议时长需在15-480分钟之间' }, 400);
    }

    // 4. 时区合法性校验
    const invalidTz = cities.find(tz => !isValidTimeZone(tz));
    if (invalidTz) {
      return jsonResponse({ code: 400, msg: '包含非法时区参数' }, 400);
    }

    try {
      const baseDate = new Date();
      // 获取每个时区的工作时段UTC区间
      const allWindows = cities.map(tz => getWorkWindowsUtc(tz, 9, 17, baseDate));
      // 计算所有区间的交集
      const intersections = intersectAllWindows(allWindows);

      // 格式化输出，过滤时长不足的区间
      const overlapSlots = [];
      const baseUtcTs = new Date(baseDate.toUTCString()).setUTCHours(0, 0, 0, 0);

      for (const win of intersections) {
        const winDuration = win.end - win.start;
        if (winDuration < duration) continue;

        const startDate = new Date(baseUtcTs + win.start * 60000);
        const endDate = new Date(baseUtcTs + win.end * 60000);

        overlapSlots.push({
          slot_utc_start: startDate.toISOString(),
          slot_utc_end: endDate.toISOString(),
          duration_minutes: Math.floor(winDuration)
        });
      }

      return jsonResponse({
        code: 0,
        data: { overlap_slots: overlapSlots }
      }, 200, 'public, max-age=300');

    } catch (error) {
      console.error('重叠时段计算异常:', error);
      return jsonResponse({ code: 500, msg: '服务器内部错误' }, 500);
    }
  }
};