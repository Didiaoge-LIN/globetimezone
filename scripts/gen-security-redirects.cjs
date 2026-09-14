#!/usr/bin/env node
'use strict';

/**
 * 生成 _redirects 中的「安全屏蔽」段（位于标记之间）。
 *
 * 为什么需要生成而不是手写：
 *   本仓库同时充当工程仓库与部署源（wrangler.toml: [build] publish = "."），
 *   凡是「已提交」的工程文件都会随部署公开。屏蔽依赖 _redirects 的 302 规则。
 *
 *   CF Pages _redirects 的通配语义（2026-09-14 本地实测确认）：
 *     · 支持一个 `*`，可出现在任意位置，且匹配多段（含 `/`）
 *     · 不支持两个 `*` 同时出现（无论星号在中间还是首尾）
 *     · 语言通配 rewrite（/en/* 代理到 /:splat）会把带前缀的工程文件请求
 *       直接代理到目标文件，且【不会重新走一遍规则匹配】——
 *       因此屏蔽规则若只写根路径形式，会形成绕过通道
 *       （实测 /en/wrangler.toml、/de/package.json 均可读到内部文件）。
 *     · 【规则数硬上限】解析器只接受前 100 条有效规则，超出部分被静默丢弃
 *       （日志：Parsed 100 valid redirect rules / Found 1 invalid redirect rule）。
 *       首版曾展开为 195 条，直接导致 /en/* 等正常 rewrite 规则丢失、
 *       全站语言页 404 —— 这是本段必须保持精简的原因。
 *     · 【位置必须排在语言 rewrite 规则之前】—— 实测（本地 wrangler pages dev）：
 *       屏蔽段放在语言 rewrite 之后时，/en/wrangler.toml、/de/package.json、
 *       /en/src/app.ts、/en/.workbuddy/** 全部返回 200（被 /en/* → /:splat 代理放行）。
 *       故本段由锚点 SECURITY-BLOCKLIST:INSERT-BEFORE 定位于语言 rewrite 之前。
 *
 *   应对：一律使用 `/*<后缀>` 形式 —— 一个星号同时覆盖根路径与全部 8 个
 *   语言前缀，用最少的规则数换取完整覆盖。目录同名规则同理由
 *   `/<dir>/*` 收敛为 `/*<dir>`（CF 对不带通配的规则做前缀匹配）。
 *
 * 根治方向：站点产物与工程源码分离（构建产物与源码分目录部署），
 *   使工程文件根本不进入部署产物 —— 届时本段可整体退化为纵深防御。
 *
 * 维护方式：
 *   新增工程文件或目录时，只改下面的 FILES / DIRS 清单，然后重跑本脚本。
 *
 * 用法：
 *   node scripts/gen-security-redirects.cjs           # 写入
 *   node scripts/gen-security-redirects.cjs --check   # 仅检查漂移（CI 门禁）
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FILE = path.join(ROOT, '_redirects');
const BEGIN = '# === SECURITY-BLOCKLIST:BEGIN ===';
const END = '# === SECURITY-BLOCKLIST:END ===';
/**
 * 插入锚点：屏蔽段会被生成到该标记【之前】。
 * 该锚点在 _redirects 中位于语言 rewrite（/en/* → /:splat 200）之前，
 * 因为 200 代理不重新走规则匹配 —— 屏蔽段若在其后则完全失效。
 */
const ANCHOR = '# === SECURITY-BLOCKLIST:INSERT-BEFORE ===';
const TARGET = '/404.html';

/** _redirects 有效规则上限（超出静默丢弃） */
const MAX_RULES = 100;
/** 其它段落占用的规则预算，留给本段的余量 */
const RESERVED = 24;

/**
 * 工程文件（`/*<name>` 一条覆盖根路径 + 8 个语言前缀）
 * 必须逐个精确文件名 —— 实测 `*` 匹配的是「路径段」，故 `/*.toml`
 * 这种扩展名通配既匹配不到 `/en/wrangler.toml`（末段名不符），
 * 也匹配不到 `/wrangler.toml`（段数不符）。
 */
const FILES = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'sri-manifest.json',
  '.cfignore',
  '.gitignore',
  '.env.example',
  'content-calendar.json',
  'social-posts.json',
  'timezone-offsets.json',
  'minify-js.js',
  'wrangler.toml',
  'wrangler.api-admin.toml',
  'wrangler.config.toml',
  'wrangler.gateway.toml',
  'wrangler.ntp-calibrator.toml',
  'wrangler.referral-api.toml',
  'wrangler.reminder-api.toml',
  'wrangler.reminder-scheduler.toml',
  'wrangler.share-handler.toml',
  'wrangler.static.toml',
  'wrangler.time-signer.toml',
  'wrangler.timezone-api.toml',
  'wrangler.tz-watcher.toml',
  'wrangler.widget.toml',
];

/** 工程目录（根路径形式 `/<dir>/*`） */
const DIRS = [
  '.workbuddy',
  '.wrangler',
  '.playwright-cli',
  'src',
  'scripts/legacy',
  'templates',
  'extension',
  'extension-chrome',
  'extension-firefox',
  'docs',
  'ops',
  'outreach',
  'link-building',
  'guest-blog-kit',
  'product-hunt',
  'email-templates',
  'data',
];

/**
 * 需要额外覆盖「语言前缀」的目录（`/<lang>/<dir>/*`）。
 * 由于 CF 不支持双 `*`，目录类无法用一条规则同时覆盖任意前缀 + 任意后缀，
 * 只能逐语言展开（8 条/目录），受 100 条规则上限约束，故仅覆盖最敏感者。
 * 其余目录的语言前缀暴露，由「站点产物与工程源码分离」根治。
 */
const PREFIX_DIRS = ['.workbuddy', 'src', 'docs'];

const LANGS = ['en', 'zh', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'];

function build() {
  const lines = [];

  lines.push('# 本段由 scripts/gen-security-redirects.cjs 生成 —— 勿手改。');
  lines.push('# 新增工程文件/目录时改该脚本的清单，再重跑。');
  lines.push('#');
  lines.push('# 规则数受 _redirects 上限（100 条，超出静默丢弃）约束，');
  lines.push('# 故目录类的语言前缀只覆盖最敏感者（PREFIX_DIRS）。');
  lines.push('');

  lines.push('# 工程文件：`/*<name>` 覆盖根路径 + 全部 8 个语言前缀');
  for (const f of FILES) lines.push(`/*${f} ${TARGET} 302`);

  lines.push('');
  lines.push('# 工程目录（根路径）');
  for (const d of DIRS) lines.push(`/${d}/* ${TARGET} 302`);

  lines.push('');
  lines.push('# 工程目录（语言前缀）—— CF 不支持双 * 通配，只能逐语言展开');
  for (const lang of LANGS) {
    for (const d of PREFIX_DIRS) lines.push(`/${lang}/${d}/* ${TARGET} 302`);
  }

  return lines.join('\n');
}

function main() {
  const check = process.argv.includes('--check');
  const src = fs.readFileSync(FILE, 'utf8');

  const b = src.indexOf(BEGIN);
  const e = src.indexOf(END);
  const hasBegin = b !== -1;
  const hasEnd = e !== -1;
  if (hasBegin !== hasEnd) {
    console.error(`[x] 屏蔽段标记不配对：${BEGIN} / ${END}`);
    process.exit(1);
  }

  // 先摘除旧屏蔽段（若有），再按锚点重新插入 —— 保证幂等且位置永远正确。
  const stripped = (
    hasBegin ? src.slice(0, b) + src.slice(e + END.length) : src
  )
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+$/, '');

  const anchor = stripped.indexOf(ANCHOR);
  if (anchor === -1) {
    console.error(`[x] 未找到插入锚点（${ANCHOR}）—— 该锚点必须位于语言 rewrite 之前`);
    process.exit(1);
  }

  const body = build();
  const rules = body.split('\n').filter((l) => l.includes(TARGET)).length;
  const budget = MAX_RULES - RESERVED;

  if (rules > budget) {
    console.error(`[x] 屏蔽段 ${rules} 条，超出预算 ${budget} 条（_redirects 总上限 ${MAX_RULES}）`);
    process.exit(1);
  }

  // 把屏蔽段插入到锚点之前（锚点行本身保留）。
  const block = BEGIN + '\n' + body + '\n' + END + '\n\n';
  const next = stripped.slice(0, anchor) + block + stripped.slice(anchor) + '\n';

  if (check) {
    if (next === src) {
      console.log(`[ok] 屏蔽段与生成结果一致（${rules}/${budget} 条）`);
      process.exit(0);
    }
    console.error('[x] 屏蔽段已漂移 —— 请重跑 node scripts/gen-security-redirects.cjs');
    process.exit(1);
  }

  if (next === src) {
    console.log(`[ok] 无变化（${rules}/${budget} 条）`);
    return;
  }

  fs.writeFileSync(FILE, next, 'utf8');
  console.log(
    `[ok] 已写入屏蔽段（锚点前，位于语言 rewrite 之前）：${rules} 条（${FILES.length} 文件 + ${DIRS.length} 目录），预算 ${budget} 条`
  );
}

main();
