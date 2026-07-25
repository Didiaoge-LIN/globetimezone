import {
  escapeHtml,
  safeJsString,
  safeJsonLd,
  isValidSlug,
  buildSecurityHeaders
} from '../lib/security.js';
import {
  getTimeDifferenceMinutes,
  formatTimeDifference
} from '../lib/timezone-worker.js';
import { isSearchEngineBot } from '../lib/common-worker.js';
import { getAllCities } from '../city/data/index.js';

/**
 * 城市白名单：由 getAllCities() 动态构建（200 城市）
 * 字段映射：tz→tz, n→nameZh, ne→nameEn, c→countryZh, cc→countryEn
 * （模板实际消费 tz/nameZh/countryZh，其余保留兼容）
 */
const CITY_WHITELIST = {};
for (const [slug, c] of Object.entries(getAllCities())) {
  CITY_WHITELIST[slug] = {
    tz: c.tz,
    nameZh: c.n,
    nameEn: c.ne,
    countryZh: c.c,
    countryEn: c.cc
  };
}

/**
 * 生成 CSP Nonce 用于放行内联脚本/样式
 */
function generateCspNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * 构造对比页专用 CSP（使用 nonce 代替 unsafe-inline）
 */
function buildComparePageHeaders(nonce, contentType, cacheControl, isBot) {
  const headers = {
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'Content-Security-Policy': [
      "default-src 'self'",
      `script-src 'nonce-${nonce}'`,
      `style-src 'nonce-${nonce}'`,
      "img-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()'
  };
  if (!isBot) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
}

/**
 * 渲染404页面
 */
function render404Page(nonce) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面未找到 - Globe Time Zone</title>
  <meta name="robots" content="noindex, follow">
  <style nonce="${nonce}">
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;max-width:600px;margin:120px auto;text-align:center;padding:0 20px}
    h1{font-size:48px;font-weight:700;color:#6b7280;margin-bottom:16px}
    p{color:#4b5563;margin-bottom:24px;font-size:16px}
    a{color:#2563eb;text-decoration:none;font-weight:500}
    a:hover{text-decoration:underline}
  </style>
</head>
<body>
  <h1>404</h1>
  <p>您访问的页面不存在，请检查地址是否正确</p>
  <a href="/">返回首页</a>
</body>
</html>`;
}

/**
 * 渲染主对比页面
 */
function renderComparePage(cityA, cityB, slugA, slugB, nonce) {
  const diffMinutes = getTimeDifferenceMinutes(cityA.tz, cityB.tz);
  const diffText = diffMinutes > 0
    ? `${cityA.nameZh}比${cityB.nameZh}快${formatTimeDifference(diffMinutes)}`
    : `${cityA.nameZh}比${cityB.nameZh}慢${formatTimeDifference(Math.abs(diffMinutes))}`;

  const pageTitle = `${cityA.nameZh}和${cityB.nameZh}时差_实时时间换算 - Globe Time Zone`;
  const pageDesc = `${cityA.nameZh}（${cityA.countryZh}）与${cityB.nameZh}（${cityB.countryZh}）实时时差查询，自动校准夏令时，支持跨时区会议时间规划。`;
  const canonicalUrl = `https://globetimezone.com/compare/${slugA}-and-${slugB}-time-difference`;
  const meetingUrl = `/meeting?cities=${encodeURIComponent(cityA.tz)},${encodeURIComponent(cityB.tz)}`;

  const safe = {
    title: escapeHtml(pageTitle),
    description: escapeHtml(pageDesc),
    canonical: escapeHtml(canonicalUrl),
    cityAName: escapeHtml(cityA.nameZh),
    cityBName: escapeHtml(cityB.nameZh),
    cityACountry: escapeHtml(cityA.countryZh),
    cityBCountry: escapeHtml(cityB.countryZh),
    cityATz: safeJsString(cityA.tz),
    cityBTz: safeJsString(cityB.tz),
    cityATzText: escapeHtml(cityA.tz),
    cityBTzText: escapeHtml(cityB.tz),
    diffText: escapeHtml(diffText),
    meetingUrl: escapeHtml(meetingUrl)
  };

  const schemaData = safeJsonLd({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "description": pageDesc,
    "url": canonicalUrl,
    "mainEntity": {
      "@type": "Calculator",
      "name": `${cityA.nameZh}${cityB.nameZh}时差计算器`,
      "description": "实时计算时差，自动校准夏令时",
      "applicationCategory": "UtilitiesApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      }
    }
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safe.title}</title>
  <meta name="description" content="${safe.description}">
  <link rel="canonical" href="${safe.canonical}">
  <link rel="alternate" hreflang="zh-CN" href="${safe.canonical}">
  <link rel="alternate" hreflang="x-default" href="${safe.canonical}">
  <script type="application/ld+json">${schemaData}</script>
  <style nonce="${nonce}">
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;line-height:1.6;max-width:800px;margin:0 auto;padding:40px 20px;background:#f9fafb}
    h1{font-size:28px;font-weight:700;margin-bottom:20px;line-height:1.3}
    h2{font-size:20px;font-weight:600;margin:40px 0 16px}
    .diff-card{background:#fff;border-radius:12px;padding:24px;margin:20px 0;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
    .diff-value{font-size:32px;font-weight:700;color:#2563eb;margin:10px 0}
    .time-row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e5e7eb;background:#fff;padding-inline:16px}
    .time-row:last-child{border-bottom:none}
    .time-row strong{font-weight:600}
    .cta-btn{display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;margin-top:20px;transition:background 0.2s}
    .cta-btn:hover{background:#1d4ed8}
    .note{color:#6b7280;font-size:14px;margin-top:8px}
    @media(max-width:768px){
      h1{font-size:24px}
      .diff-value{font-size:26px}
      body{padding:24px 16px}
    }
  </style>
</head>
<body>
  <h1>${safe.cityAName}和${safe.cityBName}时差是多少？</h1>
  <p>当前${safe.cityAName}（${safe.cityACountry}）与${safe.cityBName}（${safe.cityBCountry}）的实时时差：</p>

  <div class="diff-card">
    <div class="diff-value">${safe.diffText}</div>
    <p class="note">* 已自动校准夏令时，数据基于 IANA 官方时区数据库</p>
  </div>

  <div class="time-row">
    <span>${safe.cityAName}当前时间</span>
    <strong id="time-a">加载中...</strong>
  </div>
  <div class="time-row">
    <span>${safe.cityBName}当前时间</span>
    <strong id="time-b">加载中...</strong>
  </div>

  <a href="${safe.meetingUrl}" class="cta-btn">一键规划跨时区会议</a>

  <h2>时差查询说明</h2>
  <p>1. 以上时差为实时计算结果，自动适配夏令时切换，无需手动调整。</p>
  <p>2. ${safe.cityAName}使用${safe.cityATzText}时区，${safe.cityBName}使用${safe.cityBTzText}时区。</p>
  <p>3. 需要安排跨城市会议？使用会议规划器自动查找全员工作时段。</p>

  <script nonce="${nonce}">
    function updateLocalTime() {
      const now = new Date();
      document.getElementById('time-a').textContent = new Intl.DateTimeFormat('zh-CN', {
        timeZone: ${safe.cityATz},
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);
      document.getElementById('time-b').textContent = new Intl.DateTimeFormat('zh-CN', {
        timeZone: ${safe.cityBTz},
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(now);
    }
    updateLocalTime();
    setInterval(updateLocalTime, 3000);
  </script>
</body>
</html>`;
}

/**
 * Pages Function 入口：/compare/* 路径处理
 */
export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const nonce = generateCspNonce();
  const isBot = isSearchEngineBot(request);

  let path = decodeURIComponent(url.pathname);
  path = path.replace(/^\/compare\//, '').replace(/\.html?$/, '').replace(/\/+/g, '');

  // 第一层：路由格式校验
  const pathMatch = path.match(/^([a-z0-9-]+)-and-([a-z0-9-]+)-time-difference$/);
  if (!pathMatch) {
    return new Response(render404Page(nonce), {
      status: 404,
      headers: buildComparePageHeaders(nonce, 'text/html; charset=utf-8', 'no-cache', isBot)
    });
  }

  const [, slugA, slugB] = pathMatch;

  // 第二层：Slug格式校验
  if (!isValidSlug(slugA) || !isValidSlug(slugB)) {
    return new Response(render404Page(nonce), {
      status: 404,
      headers: buildComparePageHeaders(nonce, 'text/html; charset=utf-8', 'no-cache', isBot)
    });
  }

  // 第三层：白名单存在性校验
  const cityA = CITY_WHITELIST[slugA];
  const cityB = CITY_WHITELIST[slugB];
  if (!cityA || !cityB) {
    return new Response(render404Page(nonce), {
      status: 404,
      headers: buildComparePageHeaders(nonce, 'text/html; charset=utf-8', 'no-cache', isBot)
    });
  }

  // 渲染页面
  const html = renderComparePage(cityA, cityB, slugA, slugB, nonce);

  // 分层缓存策略：爬虫长缓存收录，用户短缓存保实时
  const cacheControl = isBot
    ? 'public, max-age=43200, stale-while-revalidate=604800'
    : 'public, max-age=60, stale-while-revalidate=300';

  return new Response(html, {
    headers: buildComparePageHeaders(nonce, 'text/html; charset=utf-8', cacheControl, isBot)
  });
}
