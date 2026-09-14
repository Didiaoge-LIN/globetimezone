/**
 * ============================================================
 * Cloudflare Pages Function — 两两城市时差对比页
 * Route: /compare/:slugA-and:slugB-time-difference
 *
 * v2.0 — 权重治理版（2026-09-11）
 * 变更要点：
 *   1. 页面分级：核心枢纽城市组合(Tier 1)正常收录；其余(Tier 2)加 noindex,follow
 *      —— 治理 19,900 条同构薄页对域名质量评分的稀释
 *   2. 内容增强：服务端渲染真实差异化数据（当前时间/UTC偏移/夏令时/
 *      工作时段重叠/逐小时换算表/FAQ+结构化数据），单页有效内容从 ~24 词
 *      提升到 400+ 词，且每页数据唯一
 *   3. 内链收敛：仅指向 Tier 1 页面，避免把抓取预算导向 noindex 页
 *   4. 修复内链地址错误（原 /meeting?cities= → 实际路由 /meeting-planner/）
 * ============================================================
 */

import {
  escapeHtml,
  safeJsString,
  safeJsonLd,
  isValidSlug
} from '../lib/security.js';
import {
  getTimeDifferenceMinutes,
  getUtcOffsetMinutes,
  formatTimeDifference,
  getWorkWindowsUtc,
  intersectAllWindows
} from '../lib/timezone-worker.js';
import { isSearchEngineBot } from '../lib/common-worker.js';
import { getAllCities } from '../city/data/index.js';
import { getCompareTier, getRelatedComparePairs } from '../lib/seo-tiers.js';

// ---------------------------------------------------------------------------
// 城市白名单（200 城市）
// ---------------------------------------------------------------------------
const CITY_WHITELIST = {};
for (const [slug, c] of Object.entries(getAllCities())) {
  CITY_WHITELIST[slug] = {
    tz: c.tz,
    nameZh: c.n,
    nameEn: c.ne,
    countryZh: c.c,
    countryEn: c.cc,
    tzName: c.tn || '',
    hasDst: !!c.d,
    dstStart: c.ds || '',
    dstEnd: c.de || ''
  };
}

const ALL_SLUGS = Object.keys(CITY_WHITELIST);
// 城市键序 → 索引：用于确定对比页的唯一规范顺序，保证与历史 sitemap URL 完全一致
const SLUG_INDEX = new Map(ALL_SLUGS.map((s, i) => [s, i]));
const BASE_URL = 'https://globetimezone.com';

/**
 * URL 属性安全转义：在 escapeHtml 基础上还原 '/'，避免 canonical 变成 https:&#x2F;&#x2F;
 */
function escapeUrlAttr(value) {
  return escapeHtml(String(value)).replace(/&#x2F;/g, '/');
}

// ---------------------------------------------------------------------------
// 时区格式化（带缓存，避免每行重复构造 Intl 实例）
// ---------------------------------------------------------------------------
const TIME_FMT_CACHE = new Map();

function timeFormatter(tz) {
  let f = TIME_FMT_CACHE.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });
    TIME_FMT_CACHE.set(tz, f);
  }
  return f;
}

function formatClock(tz, date) {
  try {
    return timeFormatter(tz).format(date);
  } catch (e) {
    return '--:--';
  }
}

function formatDate(tz, date) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: tz, month: 'long', day: 'numeric', weekday: 'short'
    }).format(date);
  } catch (e) {
    return '';
  }
}

function offsetLabel(minutes) {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minutesToClock(minutes) {
  const norm = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 夏令时状态描述（差异化内容）
 */
function dstSentence(city) {
  if (!city.hasDst) return '不实行夏令时';
  if (city.dstStart && city.dstEnd) {
    return `实行夏令时（${city.dstStart} 起、${city.dstEnd} 止）`;
  }
  return '实行夏令时';
}

/**
 * 夏令时对时差的影响说明（差异化内容）
 */
function dstImpactText(cityA, cityB, diffMinutes) {
  const a = cityA.nameZh;
  const b = cityB.nameZh;
  if (!cityA.hasDst && !cityB.hasDst) {
    return `${a}与${b}均不实行夏令时，两地时差全年恒定，为 ${formatTimeDifference(Math.abs(diffMinutes))}，不会随季节变化。`;
  }
  if (cityA.hasDst && cityB.hasDst) {
    return `${a}与${b}都实行夏令时。由于两地夏令时切换日期通常不同（北半球一般 3 月与 11 月，南半球相反），切换前后数周内时差会临时变化 1 小时，本页时差为当前实时值，已自动校准。`;
  }
  const dstCity = cityA.hasDst ? cityA : cityB;
  const fixedCity = cityA.hasDst ? cityB : cityA;
  return `${dstCity.nameZh}实行夏令时，${fixedCity.nameZh}不实行。因此两地时差在${dstCity.nameZh}夏令时期间会比冬令时期间少 1 小时（或方向相反），本页显示的是当前时刻的实际时差。`;
}

/**
 * 电话建议（差异化内容）
 */

// ---------------------------------------------------------------------------
// CSP Nonce
// ---------------------------------------------------------------------------
function generateCspNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function buildComparePageHeaders(nonce, contentType, cacheControl, isBot, noindex) {
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
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
    Vary: 'Accept-Encoding'
  };
  if (!isBot) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  if (noindex) {
    headers['X-Robots-Tag'] = 'noindex, follow';
  }
  return headers;
}

// ---------------------------------------------------------------------------
// 404
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// 页面渲染
// ---------------------------------------------------------------------------
function renderComparePage(cityA, cityB, slugA, slugB, nonce, tier) {
  const now = new Date();
  const offsetA = getUtcOffsetMinutes(cityA.tz, now);
  const offsetB = getUtcOffsetMinutes(cityB.tz, now);
  const diffMinutes = offsetA - offsetB;

  const faster = diffMinutes > 0 ? cityA : (diffMinutes < 0 ? cityB : null);
  const absDiff = Math.abs(diffMinutes);

  const diffSentence = diffMinutes === 0
    ? `${cityA.nameZh}与${cityB.nameZh}当前没有时差，两地时钟同步。`
    : `${faster.nameZh}比${diffMinutes > 0 ? cityB.nameZh : cityA.nameZh}快${formatTimeDifference(absDiff)}。`;

  const diffShort = diffMinutes === 0
    ? '无时差'
    : (diffMinutes > 0
      ? `${cityA.nameZh}快${formatTimeDifference(absDiff)}`
      : `${cityA.nameZh}慢${formatTimeDifference(absDiff)}`);

  const clockA = formatClock(cityA.tz, now);
  const clockB = formatClock(cityB.tz, now);
  const dateA = formatDate(cityA.tz, now);
  const dateB = formatDate(cityB.tz, now);

  // ---- 工作时段重叠（9:00-17:00 本地）----
  let overlapText;
  let overlapRows = '';
  try {
    const windows = intersectAllWindows([
      getWorkWindowsUtc(cityA.tz, 9, 17, now),
      getWorkWindowsUtc(cityB.tz, 9, 17, now)
    ]);
    if (windows.length === 0) {
      overlapText = `${cityA.nameZh}与${cityB.nameZh}的标准工作时段（各自 9:00–17:00）没有重叠，跨时区协作需要其中一方调整作息。`;
    } else {
      const segs = windows.map(w => {
        const aStart = minutesToClock(w.start + offsetA);
        const aEnd = minutesToClock(w.end + offsetA);
        const bStart = minutesToClock(w.start + offsetB);
        const bEnd = minutesToClock(w.end + offsetB);
        return { aStart, aEnd, bStart, bEnd };
      });
      overlapText = `两地工作时段每天约有 ${formatTimeDifference(windows.reduce((s, w) => s + (w.end - w.start), 0))} 的重叠，是安排会议的黄金窗口。`;
      overlapRows = segs.map(s => `        <tr>
          <td>${escapeHtml(s.aStart)} – ${escapeHtml(s.aEnd)}</td>
          <td>${escapeHtml(s.bStart)} – ${escapeHtml(s.bEnd)}</td>
        </tr>`).join('\n');
    }
  } catch (e) {
    overlapText = '工作时段重叠数据暂不可用。';
  }

  // ---- 逐小时换算表 ----
  // 城市A 当地 h:00 → 城市B 当地分钟数 = h*60 + (offsetB - offsetA)
  const hourRows = [];
  for (let h = 0; h < 24; h++) {
    const raw = h * 60 + (offsetB - offsetA);
    const dayLabel = raw < 0 ? '前一日' : (raw >= 1440 ? '次日' : '当日');
    hourRows.push(`        <tr>
          <td>${String(h).padStart(2, '0')}:00</td>
          <td>${minutesToClock(raw)}</td>
          <td>${dayLabel}</td>
        </tr>`);
  }

  // ---- 相关对比内链（仅 Tier 1，且按城市键序生成规范 URL）----
  const relatedA = getRelatedComparePairs(slugA, 6);
  const relatedB = getRelatedComparePairs(slugB, 6);
  const relatedSeen = new Set([`${slugA}\u0000${slugB}`]);
  const relatedLinks = [];
  for (const item of [...relatedA, ...relatedB]) {
    // 按城市键序确定规范前后顺序，避免产生需要 301 的 URL
    const i1 = SLUG_INDEX.get(item.slug);
    const i2 = SLUG_INDEX.get(item.other);
    const first = i1 < i2 ? item.slug : item.other;
    const second = i1 < i2 ? item.other : item.slug;
    const key = `${first}\u0000${second}`;
    if (relatedSeen.has(key)) continue;
    relatedSeen.add(key);

    const c1 = CITY_WHITELIST[first];
    const c2 = CITY_WHITELIST[second];
    if (!c1 || !c2) continue;

    relatedLinks.push(`        <a class="related-link" href="${escapeUrlAttr(`/compare/${first}-and-${second}-time-difference`)}">
          <span>${escapeHtml(c1.nameZh)} ↔ ${escapeHtml(c2.nameZh)}</span>
          <span class="related-arrow">›</span>
        </a>`);
    if (relatedLinks.length >= 8) break;
  }

  // ---- City page links（真实内容页，权重集中）----
  const cityLinks = [
    { c: cityA, href: escapeUrlAttr(`/city/${slugA}/`) },
    { c: cityB, href: escapeUrlAttr(`/city/${slugB}/`) }
  ].map(({ c, href }) => `        <a class="city-link" href="${href}">
          <strong>${escapeHtml(c.nameZh)}时间</strong>
          <span>${escapeHtml(c.countryZh)} · ${escapeHtml(c.tz)}</span>
        </a>`).join('\n');

  // ---- FAQ ----
  const tzShortA = cityA.tz;
  const tzShortB = cityB.tz;
  const faqs = [
    {
      q: `${cityA.nameZh}和${cityB.nameZh}的时差是多少？`,
      a: diffMinutes === 0
        ? `${cityA.nameZh}（${tzShortA}）与${cityB.nameZh}（${tzShortB}）当前没有时差。`
        : `${cityA.nameZh}（${tzShortA}）当前比${diffMinutes > 0 ? cityB.nameZh : cityA.nameZh}快${formatTimeDifference(absDiff)}，即 ${cityA.nameZh} ${clockA} 对应 ${cityB.nameZh} ${clockB}。`
    },
    {
      q: `${cityA.nameZh}的时区是什么？`,
      a: `${cityA.nameZh}使用 ${cityA.tz} 时区，当前 UTC 偏移为 ${offsetLabel(offsetA)}${cityA.hasDst ? '，实行夏令时' : '，不实行夏令时'}。`
    },
    {
      q: `${cityB.nameZh}的时区是什么？`,
      a: `${cityB.nameZh}使用 ${cityB.tz} 时区，当前 UTC 偏移为 ${offsetLabel(offsetB)}${cityB.hasDst ? '，实行夏令时' : '，不实行夏令时'}。`
    },
    {
      q: `什么时间给${cityB.nameZh}打电话最合适？`,
      a: windowsOverlapAdvice(cityA, cityB, offsetA, offsetB, now)
    }
  ];

  const faqHtml = faqs.map((f, i) => `      <details class="faq-item"${i === 0 ? ' open' : ''}>
        <summary class="faq-question">${escapeHtml(f.q)}</summary>
        <div class="faq-answer"><p>${escapeHtml(f.a)}</p></div>
      </details>`).join('\n');

  // ---- SEO 元信息 ----
  const pageTitle = `${cityA.nameZh}和${cityB.nameZh}时差 - 实时时间换算与会议时段 - GlobeTimeZone`;
  const pageDesc = `${cityA.nameZh}（${cityA.countryZh}）与${cityB.nameZh}（${cityB.countryZh}）${diffShort}。实时时间换算、UTC 偏移、夏令时状态、工作时段重叠与跨时区会议时间规划。`;
  const canonicalUrl = `${BASE_URL}/compare/${slugA}-and-${slugB}-time-difference`;
  const meetingUrl = `/meeting-planner/?cities=${encodeURIComponent(cityA.tz)},${encodeURIComponent(cityB.tz)}`;

  const safe = {
    title: escapeHtml(pageTitle),
    description: escapeHtml(pageDesc),
    canonical: escapeUrlAttr(canonicalUrl),
    cityAName: escapeHtml(cityA.nameZh),
    cityBName: escapeHtml(cityB.nameZh),
    cityACountry: escapeHtml(cityA.countryZh),
    cityBCountry: escapeHtml(cityB.countryZh),
    cityATz: safeJsString(cityA.tz),
    cityBTz: safeJsString(cityB.tz),
    cityATzText: escapeHtml(cityA.tz),
    cityBTzText: escapeHtml(cityB.tz),
    diffSentence: escapeHtml(diffSentence),
    diffShort: escapeHtml(diffShort),
    clockA: escapeHtml(clockA),
    clockB: escapeHtml(clockB),
    dateA: escapeHtml(dateA),
    dateB: escapeHtml(dateB),
    offsetA: escapeHtml(offsetLabel(offsetA)),
    offsetB: escapeHtml(offsetLabel(offsetB)),
    dstA: escapeHtml(dstSentence(cityA)),
    dstB: escapeHtml(dstSentence(cityB)),
    overlapText: escapeHtml(overlapText),
    meetingUrl: escapeUrlAttr(meetingUrl),
    cityALink: escapeUrlAttr(`/city/${slugA}/`),
    cityBLink: escapeUrlAttr(`/city/${slugB}/`)
  };

  // ---- 结构化数据 ----
  const breadcrumbLd = safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '首页', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: '时差查询', item: `${BASE_URL}/time-difference/` },
      { '@type': 'ListItem', position: 3, name: `${cityA.nameZh}和${cityB.nameZh}时差`, item: canonicalUrl }
    ]
  });

  const webPageLd = safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    description: pageDesc,
    url: canonicalUrl,
    inLanguage: 'zh-CN',
    about: {
      '@type': 'Thing',
      name: `${cityA.nameZh}与${cityB.nameZh}时差`
    }
  });

  const faqLd = safeJsonLd({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  });

  const robotsMeta = tier === 2
    ? '\n  <meta name="robots" content="noindex, follow">'
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safe.title}</title>
  <meta name="description" content="${safe.description}">${robotsMeta}
  <link rel="canonical" href="${safe.canonical}">
  <link rel="alternate" hreflang="zh-CN" href="${safe.canonical}">
  <link rel="alternate" hreflang="x-default" href="${safe.canonical}">
  <meta name="baidu-tongji-id" content="cb6f0f9eec485c2521ce68dab67f5515">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${safe.title}">
  <meta property="og:description" content="${safe.description}">
  <meta property="og:url" content="${safe.canonical}">
  <meta property="og:site_name" content="GlobeTimeZone">
  <meta property="og:image" content="${BASE_URL}/og-default.png">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safe.title}">
  <meta name="twitter:description" content="${safe.description}">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="/styles/premium.css?v=2">
  <script type="application/ld+json">${breadcrumbLd}</script>
  <script type="application/ld+json">${webPageLd}</script>
  <script type="application/ld+json">${faqLd}</script>
  <style nonce="${nonce}">
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--bg:#f9fafb;--card:#fff;--text:#1f2937;--muted:#6b7280;--line:#e5e7eb;--accent:#2563eb;--accent-soft:#eff6ff}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--text);line-height:1.65;background:var(--bg)}
    .wrap{max-width:820px;margin:0 auto;padding:32px 20px 64px}
    .crumb{font-size:13px;color:var(--muted);margin-bottom:20px}
    .crumb a{color:var(--muted);text-decoration:none}
    .crumb a:hover{color:var(--text)}
    h1{font-size:27px;font-weight:700;line-height:1.35;margin-bottom:14px}
    h2{font-size:19px;font-weight:650;margin:36px 0 14px}
    .answer{background:var(--accent-soft);border-left:4px solid var(--accent);border-radius:8px;padding:16px 18px;font-size:16px;font-weight:500}
    .clocks{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:20px 0}
    .clock{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px}
    .clock .name{font-size:14px;color:var(--muted);margin-bottom:6px}
    .clock .time{font-size:32px;font-weight:750;font-variant-numeric:tabular-nums;letter-spacing:-0.01em}
    .clock .date{font-size:13px;color:var(--muted);margin-top:4px}
    .diff-badge{display:inline-block;background:var(--card);border:1px solid var(--line);border-radius:999px;padding:6px 14px;font-size:14px;font-weight:600;margin-bottom:4px}
    table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:14px}
    th,td{text-align:left;padding:11px 14px;border-bottom:1px solid var(--line)}
    th{background:#f3f4f6;font-weight:600;font-size:13px;color:var(--muted)}
    tr:last-child td{border-bottom:none}
    .half{max-height:420px;overflow:auto}
    .cta{display:inline-block;background:var(--accent);color:#fff;padding:12px 22px;border-radius:9px;text-decoration:none;font-weight:600;font-size:15px;margin-top:8px}
    .cta:hover{background:#1d4ed8}
    .faq-item{border:1px solid var(--line);border-radius:10px;margin-bottom:10px;overflow:hidden;background:var(--card)}
    .faq-question{padding:14px 16px;font-weight:600;cursor:pointer;user-select:none;list-style:none}
    .faq-question::-webkit-details-marker{display:none}
    .faq-answer{padding:0 16px 14px;color:var(--muted);font-size:14.5px}
    .related{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:12px}
    .related-link{display:flex;justify-content:space-between;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:11px 14px;text-decoration:none;color:var(--text);font-size:14px}
    .related-link:hover{border-color:var(--accent);color:var(--accent)}
    .related-arrow{color:var(--muted)}
    .city-link{display:flex;flex-direction:column;gap:2px;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 14px;text-decoration:none;color:var(--text);font-size:13px}
    .city-link strong{font-size:14.5px}
    .city-link span{color:var(--muted)}
    .note{color:var(--muted);font-size:13px;margin-top:10px}
    .tier2-note{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;font-size:12.5px;color:#92400e;margin-top:40px}
    footer{margin-top:48px;padding-top:20px;border-top:1px solid var(--line);font-size:13px;color:var(--muted)}
    footer a{color:var(--muted);margin-right:14px;text-decoration:none}
    @media(max-width:640px){h1{font-size:22px}.clocks{grid-template-columns:1fr}.clock .time{font-size:28px}.wrap{padding:20px 16px 48px}}
    @media(prefers-color-scheme:dark){
      :root{--bg:#0f172a;--card:#1e293b;--text:#f1f5f9;--muted:#cbd5e1;--line:#334155;--accent:#60a5fa;--accent-soft:#1e293b}
      th{background:#0f172a}
      .tier2-note{background:#422006;border-color:#78350f;color:#fcd34d}
    }
  </style>
</head>
<body>
<div class="wrap">
  <nav class="crumb"><a href="/">首页</a> › <a href="/time-difference/">时差查询</a> › <strong>${safe.cityAName}和${safe.cityBName}时差</strong></nav>

  <h1>${safe.cityAName}和${safe.cityBName}时差是多少？</h1>

  <div class="answer">${safe.diffSentence}已自动校准夏令时，数据基于 IANA 官方时区数据库。</div>

  <div class="clocks">
    <div class="clock">
      <div class="name">${safe.cityAName}·${safe.cityACountry}</div>
      <div class="time" id="time-a" data-tz="${safe.cityATz}">${safe.clockA}</div>
      <div class="date">${safe.dateA}</div>
    </div>
    <div class="clock">
      <div class="name">${safe.cityBName}·${safe.cityBCountry}</div>
      <div class="time" id="time-b" data-tz="${safe.cityBTz}">${safe.clockB}</div>
      <div class="date">${safe.dateB}</div>
    </div>
  </div>

  <span class="diff-badge">当前时差：${safe.diffShort}</span>

  <h2>时区信息对比</h2>
  <table>
    <thead><tr><th>城市</th><th>IANA 时区</th><th>UTC 偏移</th><th>当前时间</th><th>夏令时</th></tr></thead>
    <tbody>
      <tr>
        <td>${safe.cityAName}</td><td>${safe.cityATzText}</td><td>${safe.offsetA}</td><td>${safe.clockA}</td><td>${safe.dstA}</td>
      </tr>
      <tr>
        <td>${safe.cityBName}</td><td>${safe.cityBTzText}</td><td>${safe.offsetB}</td><td>${safe.clockB}</td><td>${safe.dstB}</td>
      </tr>
    </tbody>
  </table>

  <h2>夏令时对时差的影响</h2>
  <p>${escapeHtml(dstImpactText(cityA, cityB, diffMinutes))}</p>

  <h2>工作时段重叠</h2>
  <p>${safe.overlapText}</p>
${overlapRows ? `  <table style="margin-top:12px">
    <thead><tr><th>${safe.cityAName}时间</th><th>${safe.cityBName}时间</th></tr></thead>
    <tbody>
${overlapRows}
    </tbody>
  </table>` : ''}

  <h2>${safe.cityAName} ↔ ${safe.cityBName} 逐小时换算表</h2>
  <p class="note">下表列出${safe.cityAName}全天 24 个小时对应的${safe.cityBName}当地时间，可直接用于约会议或打电话。</p>
  <div class="half">
  <table>
    <thead><tr><th>${safe.cityAName}时间</th><th>${safe.cityBName}时间</th><th>日历日</th></tr></thead>
    <tbody>
${hourRows.join('\n')}
    </tbody>
  </table>
  </div>

  <h2>安排一场跨时区会议</h2>
  <p>让会议规划器自动找出两地都在工作时段内的可用时间。</p>
  <a class="cta" href="${safe.meetingUrl}">📅 打开会议规划器</a>

  <h2>常见问题</h2>
${faqHtml}

  <h2>相关时差查询</h2>
  <div class="related">
${relatedLinks.join('\n')}
  </div>

  <h2>城市时间详情</h2>
  <div class="related">
${cityLinks}
  </div>

  ${tier === 2 ? '<div class="tier2-note">此页面为长尾组合，仅供站内导航使用，不参与搜索引擎收录。</div>' : ''}

  <footer>
    <a href="/">首页</a>
    <a href="/time-difference/">时差查询</a>
    <a href="/meeting-planner/">会议规划</a>
    <a href="/world-clock.html">世界时钟</a>
  </footer>
</div>

<script nonce="${nonce}">
(function () {
  var fmt = null;
  function tick() {
    var now = new Date();
    var a = document.getElementById('time-a');
    var b = document.getElementById('time-b');
    if (!a || !b) return;
    try {
      a.textContent = new Intl.DateTimeFormat('zh-CN', {
        timeZone: ${safe.cityATz}, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
      }).format(now);
      b.textContent = new Intl.DateTimeFormat('zh-CN', {
        timeZone: ${safe.cityBTz}, hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
      }).format(now);
    } catch (e) {}
  }
  tick();
  setInterval(tick, 1000);
})();
</script>
</body>
</html>`;
}

/**
 * 电话建议（差异化内容）
 */
function windowsOverlapAdvice(cityA, cityB, offsetA, offsetB, now) {
  try {
    const windows = intersectAllWindows([
      getWorkWindowsUtc(cityA.tz, 9, 17, now),
      getWorkWindowsUtc(cityB.tz, 9, 17, now)
    ]);
    if (windows.length === 0) {
      return `两地标准工作时段没有重叠。建议${cityA.nameZh}一方在早间（当地 7:00–9:00）联系${cityB.nameZh}，或${cityB.nameZh}一方在傍晚（当地 17:00–20:00）跟进，此时对方仍在工作时间。`;
    }
    const seg = windows[0];
    return `建议在${cityA.nameZh}当地 ${minutesToClock(seg.start + offsetA)}–${minutesToClock(seg.end + offsetA)} 之间联系，对应${cityB.nameZh}当地 ${minutesToClock(seg.start + offsetB)}–${minutesToClock(seg.end + offsetB)}，双方都在工作时段内。`;
  } catch (e) {
    return `建议避开双方深夜时段（当地 23:00–07:00）安排沟通。`;
  }
}

// ---------------------------------------------------------------------------
// Pages Function 入口
// ---------------------------------------------------------------------------
export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);
  const nonce = generateCspNonce();
  const isBot = isSearchEngineBot(request);

  let path = decodeURIComponent(url.pathname);
  path = path.replace(/^\/compare\//, '').replace(/\.html?$/, '').replace(/\/+/g, '');

  const notFound = () => new Response(render404Page(nonce), {
    status: 404,
    headers: buildComparePageHeaders(nonce, 'text/html; charset=utf-8', 'no-cache', isBot, true)
  });

  // 第一层：路由格式校验
  const pathMatch = path.match(/^([a-z0-9-]+)-and-([a-z0-9-]+)-time-difference$/);
  if (!pathMatch) return notFound();

  const [, slugA, slugB] = pathMatch;

  // 第二层：Slug 格式校验
  if (!isValidSlug(slugA) || !isValidSlug(slugB)) return notFound();

  // 第三层：白名单存在性校验
  const cityA = CITY_WHITELIST[slugA];
  const cityB = CITY_WHITELIST[slugB];
  if (!cityA || !cityB) return notFound();

  // 规范顺序：与历史 sitemap 一致（按城市数据键序），保证零 URL churn
  const idxA = SLUG_INDEX.get(slugA);
  const idxB = SLUG_INDEX.get(slugB);
  if (idxA > idxB) {
    return Response.redirect(`${BASE_URL}/compare/${slugB}-and-${slugA}-time-difference`, 301);
  }

  const tier = getCompareTier(slugA, slugB);
  const html = renderComparePage(cityA, cityB, slugA, slugB, nonce, tier);

  // 分层缓存：爬虫长缓存，用户短缓存保实时。
  // 注意：必须显式带 s-maxage。_middleware.js 仅在 Cache-Control 缺 s-maxage 时追加
  // 自身的 s-maxage=300 并覆盖整条指令，会令下方 bot 的长缓存意图失效。
  // 显式声明后中间件不再覆盖，对比页（1,540 个 Tier1 页，爬虫高频命中）即可享受 12h 边缘缓存。
  const cacheControl = isBot
    ? 'public, max-age=43200, s-maxage=43200, stale-while-revalidate=604800'
    : 'public, max-age=300, s-maxage=300, stale-while-revalidate=1800';

  return new Response(html, {
    headers: buildComparePageHeaders(nonce, 'text/html; charset=utf-8', cacheControl, isBot, tier === 2)
  });
}
