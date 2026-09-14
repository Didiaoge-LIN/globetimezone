#!/usr/bin/env node
/**
 * seo-audit.cjs — GlobeTimeZone 全站页面元数据 / 结构化数据 / 内链 审计
 *
 * 设计原则（来自 SEO 升级任务硬约束）：
 *  - 只读审计，绝不写文件（写操作由 seo-fix-metadata.cjs 负责）。
 *  - 不触碰 index.html / city/ / locales/ / functions/ / js/ / _redirects / _headers / _routes.json。
 *  - 可重跑：扫描全站 HTML，产出分类报告；--check 模式与基线比对做 CI 漂移门禁。
 *
 * 用法：
 *   node scripts/seo-audit.cjs                 # 打印人类可读报告
 *   node scripts/seo-audit.cjs --json out.json # 同时导出 JSON
 *   node scripts/seo-audit.cjs --check         # 与 scripts/.seo-baseline.json 比对，新增违规即非零退出
 *   node scripts/seo-audit.cjs --baseline      # 重建基线（仅记录，不改文件内容）
 *
 * 注：本机无 perl；脚本用 node 原生正则解析，避免 sed 误伤。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE = 'https://globetimezone.com';

// 不计入内容页审计的路径（仅非站点内容目录；blog/time-in/tools/pricing 等含真实页面，保留）
const EXCLUDE_DIRS = ['node_modules', '.wrangler', '.git', '.workbuddy', '.playwright-cli', 'api', 'email-templates', 'guest-blog-kit', 'link-building', 'outreach', 'product-hunt', 'ops', 'src', 'assets', 'icons', 'styles', 'extension', 'extension-chrome', 'extension-firefox', 'widget', 'templates', 'data', 'locales_backup_20260611'];
// 搜索控制台验证文件 / 纯验证页：本就不该有完整元数据
const VERIFY_RE = /(baidu_verify|googleeec|google[a-z0-9]+)\S*\.html$/i;
const ERROR_PAGE_RE = /(^|\/)404\.html$/;

// 从 functions/lib/sitemap-utils.js 解析 STATIC_PAGES（只读），用于孤岛/未提交判定
function loadSitemapStaticPaths() {
  const p = path.join(ROOT, 'functions', 'lib', 'sitemap-utils.js');
  const set = new Set();
  try {
    const txt = fs.readFileSync(p, 'utf8');
    const m = txt.match(/export const STATIC_PAGES\s*=\s*\[([\s\S]*?)\];/);
    if (m) {
      const re = /path:\s*'([^']+)'/g;
      let x;
      while ((x = re.exec(m[1]))) set.add(x[1]);
    }
  } catch (e) { /* 读不到不影响主审计 */ }
  return set;
}

// 派生该文件“应当”的 canonical 干净 URL（与站点约定一致：去 .html，目录加尾斜杠）
function deriveCanonical(fileRel) {
  let rel = fileRel.replace(/\\/g, '/').replace(/^\.\//, '');
  if (rel === 'index.html') return SITE + '/';
  if (rel.endsWith('/index.html')) {
    const dir = rel.slice(0, -'index.html'.length); // 含尾斜杠
    return SITE + '/' + dir;
  }
  if (rel.endsWith('.html')) {
    const base = rel.slice(0, -'.html'.length);
    // 城市页的干净地址是 /city/{slug}/（带尾斜杠）
    if (base.startsWith('city/')) return SITE + '/' + base + '/';
    return SITE + '/' + base; // 根/子目录内容页：无尾斜杠去 .html
  }
  return null;
}

function extractTags(html) {
  const out = {
    title: null,
    description: null,
    canonicals: [],
    robots: null,
    lang: null,
    hreflang: [],
    jsonld: [],
    links: [],
  };
  const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleM) out.title = titleM[1].replace(/\s+/g, ' ').trim();

  const descM = html.match(/<meta\s+name=["']description["'][^>]*?content=["']([\s\S]*?)["']/i)
            || html.match(/<meta[^>]*?content=["']([\s\S]*?)["'][^>]*?name=["']description["']/i);
  if (descM) out.description = descM[1].replace(/\s+/g, ' ').trim();

  const langM = html.match(/<html[^>]*\blang=["']([^"']+)["']/i);
  if (langM) out.lang = langM[1].trim();

  const robotsM = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i)
              || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']robots["']/i);
  if (robotsM) out.robots = robotsM[1].trim();

  const canonRe = /<link[^>]*rel=["']canonical["'][^>]*?href=["']([^"']+)["']/gi;
  let c;
  while ((c = canonRe.exec(html))) out.canonicals.push(c[1].trim());

  const altRe = /<link[^>]*rel=["']alternate["'][^>]*?hreflang=["']([^"']+)["'][^>]*?href=["']([^"']+)["']/gi;
  let a;
  while ((a = altRe.exec(html))) out.hreflang.push({ lang: a[1].trim(), href: a[2].trim() });
  // 顺序可能反过来：href 在 hreflang 前
  const altRe2 = /<link[^>]*href=["']([^"']+)["'][^>]*?rel=["']alternate["'][^>]*?hreflang=["']([^"']+)["']/gi;
  while ((a = altRe2.exec(html))) out.hreflang.push({ lang: a[2].trim(), href: a[1].trim() });

  const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let l;
  while ((l = ldRe.exec(html))) {
    try {
      const obj = JSON.parse(l[1].trim());
      const types = collectTypes(obj);
      out.jsonld.push(...types);
    } catch (e) { out.jsonld.push('PARSE_ERROR'); }
  }

  const linkRe = /<a[^>]*\bhref=["']([^"']+)["']/gi;
  let k;
  while ((k = linkRe.exec(html))) out.links.push(k[1]);
  return out;
}

function collectTypes(obj) {
  const res = [];
  if (!obj) return res;
  if (Array.isArray(obj)) { obj.forEach(v => res.push(...collectTypes(v))); return res; }
  if (typeof obj === 'object') {
    if (obj['@type']) res.push(Array.isArray(obj['@type']) ? obj['@type'].join('+') : obj['@type']);
    Object.values(obj).forEach(v => res.push(...collectTypes(v)));
  }
  return res;
}

function main() {
  const args = process.argv.slice(2);
  const doJson = args.includes('--json');
  const doCheck = args.includes('--check');
  const doBaseline = args.includes('--baseline');
  const jsonIdx = args.indexOf('--json');
  const jsonPath = doJson && jsonIdx + 1 < args.length ? args[jsonIdx + 1] : null;

  // 收集 HTML 文件
  const files = [];
  (function walk(dir, rel) {
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of ents) {
      const full = path.join(dir, e.name);
      const r = rel ? rel + '/' + e.name : e.name;
      if (e.isDirectory()) {
        if (EXCLUDE_DIRS.includes(e.name)) continue;
        walk(full, r);
      } else if (e.isFile() && e.name.endsWith('.html')) {
        files.push(r);
      }
    }
  })(ROOT, '');

  const staticPaths = loadSitemapStaticPaths();
  const report = {
    scanned: files.length,
    missingTitle: [],
    missingDescription: [],
    missingCanonical: [],
    duplicateCanonical: [],
    wrongCanonical: [],   // 指向首页 / 错误域名 / 非自身
    noindexOnIndexable: [],
    hreflangMissing: [],  // 内容页完全没有 hreflang
    hreflangNoXDefault: [],
    hreflangEnMismatch: [], // en 自指与 canonical 不一致（多为 .html vs 干净 URL）
    jsonldPresent: [],
    jsonldMissingSuggested: [], // 应为换算/城市页但无 JSON-LD
    orphans: [],
    notInSitemap: [],
  };

  const linkGraph = {}; // url -> Set(incoming)
  const urlToFile = {};
  for (const f of files) {
    const url = deriveCanonical(f);
    if (url) urlToFile[url] = f;
  }

  for (const f of files) {
    const abs = path.join(ROOT, f);
    const html = fs.readFileSync(abs, 'utf8');
    const t = extractTags(html);
    const isVerify = VERIFY_RE.test(f);
    const isError = ERROR_PAGE_RE.test(f);
    const expected = deriveCanonical(f);

    if (!isVerify && !isError && !t.title) report.missingTitle.push(f);
    if (!isVerify && !isError && !t.description) report.missingDescription.push(f);

    // canonical 判定
    if (!isVerify && !isError) {
      if (t.canonicals.length === 0) {
        report.missingCanonical.push(f);
      } else if (t.canonicals.length > 1) {
        report.duplicateCanonical.push({ file: f, canonicals: t.canonicals });
      } else {
        const c = t.canonicals[0];
        let bad = false;
        const isHome = f === 'index.html' || expected === SITE + '/';
        if (!c.startsWith(SITE)) bad = true;
        else {
          const pathOnly = c.slice(SITE.length);
          if (!isHome && (pathOnly === '/' || pathOnly === '')) bad = true; // 指向首页（非首页本身）
          // 自指校验：应等于 expected（仅在 expected 可推导且非首页时）
          else if (expected && !isHome && c !== expected) {
            const norm = (u) => u.replace(/\.html$/, '').replace(/\/$/, '');
            if (norm(c) !== norm(expected)) bad = true;
          }
        }
        if (bad) report.wrongCanonical.push({ file: f, canonical: c });
      }
    }

    // noindex 误标：内容页本应收录却带 noindex
    if (t.robots && /noindex/i.test(t.robots) && !isError && !isVerify) {
      // 404 / 验证 / 已知定位页除外；其余标记待人工定夺
      report.noindexOnIndexable.push({ file: f, robots: t.robots });
    }

    // hreflang
    if (!isVerify && !isError) {
      if (t.hreflang.length === 0) report.hreflangMissing.push(f);
      else {
        const langs = t.hreflang.map(h => h.lang.toLowerCase());
        if (!langs.includes('x-default')) report.hreflangNoXDefault.push(f);
        const en = t.hreflang.find(h => h.lang.toLowerCase() === 'en');
        // 坏模式：en 自指指向「同页的 .html 文件变体」（根 converter 类）。
        // 必须 en.href 去掉 .html 后与 canonical 干净地址完全一致才修（避免误改
        // 像 blog/index.html 把 en 指向 /articles.html 这种有意的语言映射）。
        if (en && expected) {
          const norm = (u) => u.replace(/\.html$/, '').replace(/\/+$/, '');
          const enNorm = norm(en.href.replace(SITE, ''));
          const expNorm = norm(expected.replace(SITE, ''));
          if (enNorm === expNorm && en.href !== expected) {
            report.hreflangEnMismatch.push({ file: f, en: en.href, expected });
          }
        }
      }
    }

    // JSON-LD
    if (t.jsonld.length) report.jsonldPresent.push({ file: f, types: [...new Set(t.jsonld)] });
    else {
      // 建议加结构化数据的页面：时区换算（*-converter / *-to-*）与城市页
      if (/converter\.html$|to-[a-z]+\.html$|city\//i.test(f) && !isVerify && !isError) {
        report.jsonldMissingSuggested.push(f);
      }
    }

    // 内链图（仅收集，供孤岛判定）
    for (const href of t.links) {
      let target = href.split('#')[0].split('?')[0];
      if (!target) continue;
      if (/^(https?:)?\/\//i.test(target) && !target.startsWith(SITE)) continue; // 外链
      if (target.startsWith(SITE)) target = target.slice(SITE.length);
      if (target.startsWith('/')) target = target.replace(/^\/+/, '/');
      else target = '/' + target; // 相对路径归一到根（简化）
      if (!linkGraph[target]) linkGraph[target] = new Set();
      linkGraph[target].add(f);
    }
  }

  // 孤岛 & 未提交：内容页（非验证/错误）既没有入链也没有在 sitemap 中
  for (const f of files) {
    if (VERIFY_RE.test(f) || ERROR_PAGE_RE.test(f)) continue;
    const url = deriveCanonical(f);
    if (!url) continue;
    const pathOnly = url.slice(SITE.length).replace(/\/+$/, '') || '/';
    const hasIncoming = (linkGraph[pathOnly] && linkGraph[pathOnly].size > 0) ||
                        (linkGraph[pathOnly + '/'] && linkGraph[pathOnly + '/'].size > 0);
    const inSitemap = staticPaths.has(pathOnly) || staticPaths.has(pathOnly + '/') || f.startsWith('city/');
    if (!hasIncoming) report.orphans.push({ file: f, url, inSitemap });
    if (!inSitemap) report.notInSitemap.push({ file: f, url });
  }

  // 输出
  const summary = {
    scanned: report.scanned,
    missingTitle: report.missingTitle.length,
    missingDescription: report.missingDescription.length,
    missingCanonical: report.missingCanonical.length,
    duplicateCanonical: report.duplicateCanonical.length,
    wrongCanonical: report.wrongCanonical.length,
    noindexOnIndexable: report.noindexOnIndexable.length,
    hreflangMissing: report.hreflangMissing.length,
    hreflangNoXDefault: report.hreflangNoXDefault.length,
    hreflangEnMismatch: report.hreflangEnMismatch.length,
    jsonldPresent: report.jsonldPresent.length,
    jsonldMissingSuggested: report.jsonldMissingSuggested.length,
    orphans: report.orphans.length,
    notInSitemap: report.notInSitemap.length,
  };

  console.log('=== GlobeTimeZone SEO 审计摘要 ===');
  console.log(JSON.stringify(summary, null, 2));
  const dump = (label, arr, lim = 60) => {
    console.log(`\n## ${label} (${arr.length})`);
    arr.slice(0, lim).forEach(x => console.log('  - ' + (typeof x === 'string' ? x : JSON.stringify(x))));
    if (arr.length > lim) console.log(`  ... 其余 ${arr.length - lim} 项见 --json`);
  };
  dump('缺 <title>', report.missingTitle);
  dump('缺 meta description', report.missingDescription);
  dump('缺 canonical', report.missingCanonical);
  dump('重复 canonical（冲突）', report.duplicateCanonical);
  dump('canonical 指向错误（首页/错域/非自身）', report.wrongCanonical);
  dump('带 noindex 的内容页（待定夺）', report.noindexOnIndexable);
  dump('完全无 hreflang 的内容页', report.hreflangMissing);
  dump('有 hreflang 但缺 x-default', report.hreflangNoXDefault);
  dump('hreflang en 自指与 canonical 不一致', report.hreflangEnMismatch);
  dump('建议加 JSON-LD 但缺失', report.jsonldMissingSuggested, 30);
  dump('孤岛页（无入链）', report.orphans, 40);
  dump('存在但未提交 sitemap', report.notInSitemap, 40);

  if (doJson && jsonPath) {
    fs.writeFileSync(jsonPath, JSON.stringify({ summary, report }, null, 2));
    console.log('\nJSON 已写入 ' + jsonPath);
  }

  // 基线 / 漂移
  const baselinePath = path.join(__dirname, '.seo-baseline.json');
  if (doBaseline) {
    fs.writeFileSync(baselinePath, JSON.stringify(summary, null, 2));
    console.log('\n基线已重建: ' + baselinePath);
    return 0;
  }
  if (doCheck) {
    if (!fs.existsSync(baselinePath)) {
      fs.writeFileSync(baselinePath, JSON.stringify(summary, null, 2));
      console.log('\n[check] 无基线，已自动创建。视为通过。');
      return 0;
    }
    const base = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    const drift = [];
    for (const k of Object.keys(summary)) {
      if (typeof summary[k] === 'number' && summary[k] > (base[k] || 0)) {
        drift.push(`${k}: ${base[k] || 0} -> ${summary[k]}`);
      }
    }
    if (drift.length) {
      console.log('\n[check] 漂移检测失败（违规数上升）:');
      drift.forEach(d => console.log('  ! ' + d));
      return 1;
    }
    console.log('\n[check] 通过：无新增违规。');
    return 0;
  }
  return 0;
}

process.exit(main());
