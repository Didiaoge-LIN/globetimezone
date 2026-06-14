/**
 * 城市动态OG图生成器（Workers兼容版 v2）
 * 路由：/og/[city].png
 * 方案：SVG动态渲染（Workers不支持OffscreenCanvas）
 * 防护：前置白名单校验 + 无效请求返回默认SVG + 强缓存 + 全异常兜底
 */
import { CITIES } from "../city/city-data.js";

const CACHE = {
  maxAge: 86400,
  sMaxAge: 2592000,
  staleWhileRevalidate: 86400
};

// 预构建城市slug白名单，O(1)快速校验
const VALID_CITY_SLUGS = new Set(Object.keys(CITIES));

/**
 * 校验并获取城市信息
 * @param {string} slug - 城市标识
 * @returns {object|null} 城市数据
 */
function getCityBySlug(slug) {
  try {
    const cleanSlug = slug.replace(/\.png$/i, "").toLowerCase().trim();
    if (!VALID_CITY_SLUGS.has(cleanSlug)) return null;
    const city = CITIES[cleanSlug];
    return city ? { id: cleanSlug, name: city.ne, timezone: city.tz } : null;
  } catch {
    return null;
  }
}

/**
 * 格式化本地时间，时区异常返回null
 * @param {string} timezone - IANA时区
 * @returns {object|null} 时间对象
 */
function formatLocalTime(timezone) {
  try {
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      month: "short",
      day: "numeric"
    });
    return {
      time: timeFormatter.format(now),
      date: dateFormatter.format(now)
    };
  } catch (error) {
    return null;
  }
}

/**
 * XML转义，防XSS
 */
function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/**
 * 生成默认OG SVG
 */
function generateDefaultSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.2" r="0.25">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <text x="80" y="95" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="bold" fill="#3b82f6">GlobeTimeZone</text>
  <text x="600" y="330" font-family="system-ui,-apple-system,sans-serif" font-size="64" font-weight="bold" fill="#f8fafc" text-anchor="middle">Right Now Worldwide</text>
  <text x="600" y="570" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#cbd5e1" text-anchor="middle">globetimezone.com</text>
</svg>`;
}

/**
 * 生成城市OG SVG
 */
function generateCitySvg(city, timeResult) {
  const cityName = escapeXml(city.name);
  const timeStr = timeResult ? escapeXml(timeResult.time) : "";
  const dateStr = timeResult ? escapeXml(timeResult.date) : "";

  let timeBlock = "";
  if (timeResult) {
    timeBlock = `
  <text x="600" y="380" font-family="system-ui,-apple-system,sans-serif" font-size="48" font-weight="600" fill="#3b82f6" text-anchor="middle">${timeStr}</text>
  <text x="600" y="440" font-family="system-ui,-apple-system,sans-serif" font-size="24" fill="#cbd5e1" text-anchor="middle">${dateStr}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.85" cy="0.2" r="0.25">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <text x="80" y="95" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="bold" fill="#3b82f6">GlobeTimeZone</text>
  <text x="600" y="250" font-family="system-ui,-apple-system,sans-serif" font-size="72" font-weight="bold" fill="#f8fafc" text-anchor="middle">${cityName}</text>
  ${timeBlock}
  <text x="600" y="570" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="rgba(203,213,225,0.8)" text-anchor="middle">globetimezone.com</text>
</svg>`;
}

/**
 * 构建SVG响应
 */
function svgResponse(svgString, maxAge) {
  return new Response(svgString, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${CACHE.sMaxAge}, stale-while-revalidate=${CACHE.staleWhileRevalidate}`,
      "Content-Length": new TextEncoder().encode(svgString).byteLength.toString()
    }
  });
}

/**
 * Cloudflare Pages 函数入口（支持 GET + HEAD）
 */
export async function onRequestGet(context) {
  const { params, request } = context;
  const citySlug = params.city || "default";
  const method = request.method.toUpperCase();

  try {
    // 第1层快速拦截：无效城市直接返回默认SVG
    const city = getCityBySlug(citySlug);
    if (!city) {
      const defaultSvg = generateDefaultSvg();
      const headers = {
        "Content-Type": "image/svg+xml",
        "Cache-Control": `public, max-age=${CACHE.maxAge}, s-maxage=${CACHE.sMaxAge}, stale-while-revalidate=${CACHE.staleWhileRevalidate}`,
        "Content-Length": new TextEncoder().encode(defaultSvg).byteLength.toString()
      };
      return method === 'HEAD'
        ? new Response(null, { status: 200, headers })
        : svgResponse(defaultSvg, CACHE.maxAge);
    }

    // 第2层校验：时区无效返回默认SVG
    const timeResult = formatLocalTime(city.timezone);
    if (!timeResult) {
      const defaultSvg = generateDefaultSvg();
      const headers = {
        "Content-Type": "image/svg+xml",
        "Cache-Control": `public, max-age=${CACHE.maxAge}, s-maxage=${CACHE.sMaxAge}, stale-while-revalidate=${CACHE.staleWhileRevalidate}`,
        "Content-Length": new TextEncoder().encode(defaultSvg).byteLength.toString()
      };
      return method === 'HEAD'
        ? new Response(null, { status: 200, headers })
        : svgResponse(defaultSvg, CACHE.maxAge);
    }

    // 合法请求生成城市SVG
    const citySvg = generateCitySvg(city, timeResult);
    const headers = {
      "Content-Type": "image/svg+xml",
      "Cache-Control": `public, max-age=${CACHE.maxAge}, s-maxage=${CACHE.sMaxAge}, stale-while-revalidate=${CACHE.staleWhileRevalidate}`,
      "Content-Length": new TextEncoder().encode(citySvg).byteLength.toString()
    };
    return method === 'HEAD'
      ? new Response(null, { status: 200, headers })
      : svgResponse(citySvg, CACHE.maxAge);
  } catch (error) {
    // 全异常兜底：返回默认SVG，永不500
    const defaultSvg = generateDefaultSvg();
    const headers = {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300",
      "Content-Length": new TextEncoder().encode(defaultSvg).byteLength.toString()
    };
    return method === 'HEAD'
      ? new Response(null, { status: 200, headers })
      : new Response(defaultSvg, { status: 200, headers });
  }
}

export async function onRequestHead(context) {
  return onRequestGet(context);
}
