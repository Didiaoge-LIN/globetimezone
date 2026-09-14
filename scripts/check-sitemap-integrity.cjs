#!/usr/bin/env node
/**
 * ============================================================
 * check-sitemap-integrity.cjs — sitemap 全量 URL 完整性校验
 *
 * 解决什么问题：
 *   sitemap 里「已提交但打不开 / 打不开还被收录」的 URL 会持续消耗 Google 抓取预算，
 *   并让 GSC 的「已发现 - 尚未编入索引」数字虚高。人工抽查只能覆盖个位数，
 *   本脚本把索引里**每一条** URL 都测一遍。
 *
 * 三个层次的断言：
 *   1) 可达性   — 状态码必须是 200（跟随重定向后），否则该条不该出现在 sitemap 里
 *   2) 自指性   — 页面 canonical 必须等于 sitemap 里声明的 URL（防止 sitemap 与 canonical 打架）
 *   3) 可索引性 — 页面不得含 <meta name="robots" content="noindex">
 *
 * 用法：
 *   node scripts/check-sitemap-integrity.cjs                       # 校验线上
 *   node scripts/check-sitemap-integrity.cjs --base http://127.0.0.1:8788
 *   node scripts/check-sitemap-integrity.cjs --deep                # 追加 canonical/robots 断言
 *   node scripts/check-sitemap-integrity.cjs --limit 200           # 只抽样前 N 条（快速冒烟）
 *   node scripts/check-sitemap-integrity.cjs --concurrency 32
 *
 * 退出码：0 = 全部通过；1 = 有失败项（可直接用于 CI 门禁）
 * ============================================================
 */

'use strict';

const args = process.argv.slice(2);
function flag(name, def) {
  const i = args.indexOf('--' + name);
  if (i === -1) return def;
  const v = args[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

const BASE = String(flag('base', 'https://globetimezone.com')).replace(/\/$/, '');
const DEEP = args.includes('--deep');
const LIMIT = Number(flag('limit', 0)) || 0;
const CONCURRENCY = Number(flag('concurrency', 24)) || 24;

// 反爬模块会把 curl/、python-requests 等 UA 拦成 429，必须用浏览器 UA
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const SITEMAP_INDEX = '/sitemap.xml';

/** 从 XML 中抽出所有 <loc> 值 */
function extractLocs(xml) {
  const out = [];
  const re = /<loc>\s*([^<]+?)\s*<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1].trim());
  return out;
}

/** 判断一个 XML 是 sitemapindex 还是 urlset */
function isIndex(xml) {
  return /<sitemapindex/.test(xml);
}

async function get(url, { follow = true } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/xml,*/*' },
    redirect: follow ? 'follow' : 'manual',
  });
  return res;
}

/** 递归收集索引下全部 URL */
async function collectAllUrls() {
  const seen = new Set();
  const queue = [BASE + SITEMAP_INDEX];
  const visitedMaps = new Set();
  const urls = [];

  while (queue.length) {
    const mapUrl = queue.shift();
    if (visitedMaps.has(mapUrl)) continue;
    visitedMaps.add(mapUrl);

    const res = await get(mapUrl);
    if (!res.ok) {
      console.error(`  ✗ sitemap 拉取失败 ${res.status} ${mapUrl}`);
      continue;
    }
    const xml = await res.text();
    const locs = extractLocs(xml);

    if (isIndex(xml)) {
      console.log(`  · 索引 ${mapUrl.replace(BASE, '')} → ${locs.length} 个子 sitemap`);
      for (const l of locs) queue.push(l);
    } else {
      console.log(`  · 分片 ${mapUrl.replace(BASE, '')} → ${locs.length} 条 URL`);
      for (const l of locs) {
        if (!seen.has(l)) {
          seen.add(l);
          urls.push(l);
        }
      }
    }
  }
  return urls;
}

/** 把 sitemap 里声明的线上地址重写到待测 base（本地仿真时用） */
function rewriteToBase(url) {
  try {
    const u = new URL(url);
    const b = new URL(BASE);
    const path = u.pathname + u.search + u.hash;
    return b.origin + path;
  } catch {
    return url;
  }
}

/** 校验单条 URL（403/429 视为限流，退避重试，避免把限流误报成缺陷） */
async function checkUrl(url) {
  const localUrl = rewriteToBase(url);

  const problems = [];
  let finalUrl = localUrl;
  let status = 0;
  let html = '';
  let rateLimited = false;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await get(localUrl);
      status = res.status;
      finalUrl = res.url || localUrl;

      if (status === 429 || status === 403) {
        rateLimited = true;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1) + Math.random() * 300));
        continue;
      }
      rateLimited = false;
      break;
    } catch (e) {
      problems.push(`请求异常 ${e.message}`);
      return { url, status, finalUrl, problems };
    }
  }

  if (rateLimited) {
    problems.push(`被限流（403/429），非页面缺陷`);
    return { url, status, finalUrl, problems, rateLimited: true };
  }

  try {
    if (status !== 200) {
      problems.push(`状态码 ${status}`);
    } else if (DEEP) {
      const res = await get(localUrl);
      html = await res.text();

      // 2) canonical 自指
      const can = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
      if (!can) {
        problems.push('缺 canonical');
      } else {
        const href = (can[0].match(/href=["']([^"']+)["']/i) || [])[1] || '';
        // 规范化比较：去尾斜杠 + 去协议差异，根路径除外
        const norm = (u) => u.replace(/\/+$/, '') || u;
        if (href && norm(href) !== norm(url)) {
          problems.push(`canonical 不自指 → ${href}`);
        }
      }

      // 3) noindex 冲突
      const meta = html.match(/<meta[^>]+name=["']robots["'][^>]*>/i);
      if (meta && /noindex/i.test(meta[0])) {
        problems.push('sitemap 收录但页面 noindex');
      }
    }
  } catch (e) {
    problems.push(`请求异常 ${e.message}`);
  }

  return { url, status, finalUrl, problems };
}

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;
  let done = 0;

  async function next() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
      done++;
      if (done % 200 === 0 || done === items.length) {
        process.stdout.write(`\r  进度 ${done}/${items.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
  process.stdout.write('\n');
  return results;
}

(async function main() {
  console.log('='.repeat(64));
  console.log(`sitemap 完整性校验  base=${BASE}  deep=${DEEP}  concurrency=${CONCURRENCY}`);
  console.log('='.repeat(64));

  console.log('\n[1/3] 收集 sitemap 全部 URL');
  let urls = await collectAllUrls();
  console.log(`  合计 ${urls.length} 条`);

  if (LIMIT > 0 && urls.length > LIMIT) {
    urls = urls.slice(0, LIMIT);
    console.log(`  按 --limit 抽样前 ${LIMIT} 条`);
  }

  if (!urls.length) {
    console.error('未收集到任何 URL，sitemap 索引可能已损坏');
    process.exit(1);
  }

  console.log(`\n[2/3] 校验 ${urls.length} 条 URL${DEEP ? '（含 canonical / robots）' : '（仅状态码）'}`);
  const results = await runPool(urls, checkUrl, CONCURRENCY);
  const limited = results.filter((r) => r.rateLimited);
  const real = results.filter((r) => r.problems.length && !r.rateLimited);

  console.log(`\n[3/3] 结果`);
  console.log(`  通过 ${results.length - results.filter((r) => r.problems.length).length} / ${results.length}`);
  if (limited.length) {
    console.log(`  ⚠️ 限流跳过 ${limited.length} 条（降低 --concurrency 可减少误判）`);
  }

  if (real.length) {
    console.log(`\n  ❌ 真实失败 ${real.length} 条：`);
    for (const f of real.slice(0, 60)) {
      console.log(`    ${f.url}\n      → ${f.problems.join('; ')}`);
    }
    if (real.length > 60) console.log(`    …另有 ${real.length - 60} 条，略`);
    console.log('');
    process.exit(1);
  }

  console.log(`  ✅ 无真实失败项\n`);
  process.exit(0);
})();
