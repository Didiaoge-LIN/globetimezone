/**
 * 城市动态OG图生成器（最终安全防刷版）
 * 路由：/og/[city].png
 * 防护：前置白名单校验 + 无效请求直接返回静态图 + 强缓存 + 全异常兜底
 */
import { CITIES } from "../city/city-data.js";

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 630;
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
 * 绘制OG图片
 * @param {object|null} city - 城市数据
 * @returns {Uint8Array} 图片二进制
 */
async function generateOgImage(city) {
  const canvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = canvas.getContext("2d");

  // 背景渐变
  const bgGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGradient.addColorStop(0, "#0f172a");
  bgGradient.addColorStop(1, "#1e293b");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 装饰光斑
  ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
  ctx.beginPath();
  ctx.arc(CANVAS_WIDTH - 200, 150, 180, 0, Math.PI * 2);
  ctx.fill();

  // 品牌标识
  ctx.fillStyle = "#3b82f6";
  ctx.font = "bold 28px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("GlobeTimeZone", 80, 70);

  if (!city) {
    // 默认图
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Right Now Worldwide", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  } else {
    const timeResult = formatLocalTime(city.timezone);
    const centerX = CANVAS_WIDTH / 2;

    // 城市名称
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 72px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(city.name, centerX, 240);

    // 时间
    if (timeResult) {
      ctx.fillStyle = "#3b82f6";
      ctx.font = "600 48px system-ui, -apple-system, sans-serif";
      ctx.fillText(timeResult.time, centerX, 380);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "24px system-ui, -apple-system, sans-serif";
      ctx.fillText(timeResult.date, centerX, 440);
    }

    // 页脚
    ctx.fillStyle = "rgba(203, 213, 225, 0.8)";
    ctx.font = "20px system-ui, -apple-system, sans-serif";
    ctx.fillText("globetimezone.com", centerX, CANVAS_HEIGHT - 70);
  }

  const blob = await canvas.convertToBlob({ type: "image/png" });
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Cloudflare Pages 函数入口
 */
export async function onRequestGet(context) {
  const { params, env } = context;
  const citySlug = params.city || "default";

  try {
    // 第1层快速拦截：无效城市直接返回静态默认图，零Canvas消耗
    const city = getCityBySlug(citySlug);
    if (!city) {
      return fetch(env.ASSETS, new Request("/og-default.png"));
    }

    // 第2层校验：时区无效直接兜底
    const timeResult = formatLocalTime(city.timezone);
    if (!timeResult) {
      return fetch(env.ASSETS, new Request("/og-default.png"));
    }

    // 合法请求执行渲染
    const imageBuffer = await generateOgImage(city);
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": `public, max-age=${CACHE.maxAge}, s-maxage=${CACHE.sMaxAge}, stale-while-revalidate=${CACHE.staleWhileRevalidate}`,
        "Content-Length": imageBuffer.byteLength.toString()
      }
    });
  } catch (error) {
    // 所有异常统一兜底，永不返回500
    try {
      return fetch(env.ASSETS, new Request("/og-default.png"));
    } catch {
      return new Response("Error generating image", { status: 500 });
    }
  }
}
