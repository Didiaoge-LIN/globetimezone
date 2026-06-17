import { isValidTimeZone, safeJsonLd } from '../../lib/security.js';
import { getWorkWindowsUtc, intersectAllWindows } from '../../lib/timezone-worker.js';
import { RateLimiter, jsonResponse } from '../../lib/common-worker.js';

/**
 * 限流器：20次/分钟/每IP
 */
const limiter = new RateLimiter(60000, 20);

/**
 * 请求参数校验与解析
 * @param {URL} url
 * @returns {{ valid: boolean, tzs?: string[], startHour?: number, endHour?: number, error?: string }}
 */
function parseParams(url) {
  const tzParam = url.searchParams.get('tzs');
  const startParam = url.searchParams.get('start');
  const endParam = url.searchParams.get('end');

  if (!tzParam) {
    return { valid: false, error: '缺少时区参数 tzs，格式：?tzs=Asia/Shanghai,America/New_York' };
  }

  const tzs = tzParam.split(',').map(t => t.trim()).filter(Boolean);

  if (tzs.length < 2) {
    return { valid: false, error: '至少需要2个时区' };
  }

  if (tzs.length > 10) {
    return { valid: false, error: '最多支持10个时区' };
  }

  // 时区格式校验
  for (const tz of tzs) {
    if (!isValidTimeZone(tz)) {
      return { valid: false, error: `无效时区标识: ${tz}` };
    }
  }

  // 工作时段校验
  let startHour = 9, endHour = 17;

  if (startParam !== null) {
    startHour = parseInt(startParam, 10);
    if (isNaN(startHour) || startHour < 0 || startHour > 23) {
      return { valid: false, error: 'start 参数必须为 0-23 的整数' };
    }
  }

  if (endParam !== null) {
    endHour = parseInt(endParam, 10);
    if (isNaN(endHour) || endHour < 0 || endHour > 23) {
      return { valid: false, error: 'end 参数必须为 0-23 的整数' };
    }
  }

  if (startHour >= endHour) {
    return { valid: false, error: 'start 必须小于 end' };
  }

  return { valid: true, tzs, startHour, endHour };
}

/**
 * 处理重叠时段查询
 */
export async function onRequest(context) {
  const request = context.request;

  // 仅限GET
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // 限流检查
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!limiter.check(clientIp)) {
    return jsonResponse({ error: '请求过于频繁，请稍后再试' }, 429, 'no-cache');
  }

  const url = new URL(request.url);
  const parsed = parseParams(url);

  if (!parsed.valid) {
    return jsonResponse({ error: parsed.error }, 400, 'no-cache');
  }

  const { tzs, startHour, endHour } = parsed;

  try {
    const allWindows = tzs.map(tz => getWorkWindowsUtc(tz, startHour, endHour));
    const overlap = intersectAllWindows(allWindows);

    const result = {
      timezones: tzs,
      workHours: `${startHour}:00-${endHour}:00`,
      overlapIntervals: overlap.length > 0 ? overlap.map(w => ({
        startUTC: `${String(Math.floor(w.start / 60)).padStart(2, '0')}:${String(w.start % 60).padStart(2, '0')}`,
        endUTC: `${String(Math.floor(w.end / 60)).padStart(2, '0')}:${String(w.end % 60).padStart(2, '0')}`
      })) : [],
      note: overlap.length === 0 ? '当前工作时段无重叠' : undefined
    };

    return jsonResponse(result, 200, 'public, max-age=300, stale-while-revalidate=3600');
  } catch (ex) {
    return jsonResponse({ error: '计算异常，请检查参数重试' }, 500, 'no-cache');
  }
}
