#!/usr/bin/env node
/**
 * build-home-i18n.js — 为首页 SSR 生成精简语言包
 *
 * 背景：
 *   首页 index.html 使用 data-i18n / data-i18n-html / data-i18n-attr 标注可翻译文案，
 *   客户端由 js/i18n.js 在运行时翻译。但搜索引擎爬虫（以及部分首屏场景）不执行 JS，
 *   因此 Functions 需要对 /<lang>/ 首页做服务端渲染（SSR）。
 *
 *   完整语言包（locales/*.json）单个 74~103KB，9 个语言合计 667KB，
 *   全部打进边缘 Worker bundle 会显著推高体积。本脚本只抽取**首页实际用到的键**，
 *   生成 functions/lib/home-i18n-data.js（体积约 20KB 以内）。
 *
 * 用法：
 *   node scripts/build-home-i18n.js            # 生成
 *   node scripts/build-home-i18n.js --check    # 只校验不写入（CI 用）
 *
 * 注意：修改 index.html 的 data-i18n 标注后必须重跑本脚本，
 *      否则线上 SSR 会漏翻（--check 模式会在 CI 中拦截）。
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'locales');
const INDEX_HTML = path.join(ROOT, 'index.html');
const OUT_FILE = path.join(ROOT, 'functions', 'lib', 'home-i18n-data.js');

const LANGS = ['zh', 'en', 'de', 'fr', 'es', 'ja', 'ko', 'pt', 'ar'];

/**
 * 收集首页用到的所有 i18n 键
 *
 * 分两类，缺失处理策略不同：
 *  - textKeys：可见文案（data-i18n / data-i18n-html / title / description）
 *    缺失 => 英文页面上会残留中文 => 必须拦截
 *  - attrKeys：仅给属性赋值（data-i18n-attr，多为 aria-label）
 *    缺失 => 不产生可见文案泄漏，仅是无障碍标签拿不到值 => 告警不拦截
 */
function collectKeys(html) {
  const textKeys = new Set();
  const attrKeys = new Set();

  // data-i18n="key" / data-i18n-html="key"
  for (const m of html.matchAll(/\bdata-i18n(?:-html)?="([^"]+)"/g)) {
    const k = m[1].trim();
    if (k) textKeys.add(k);
  }

  // data-i18n-attr="attr:key;attr2:key2"（分隔符与 js/i18n.js 保持一致：';'）
  for (const m of html.matchAll(/\bdata-i18n-attr="([^"]+)"/g)) {
    for (const pair of m[1].split(';')) {
      const parts = pair.split(':');
      if (parts.length === 2 && parts[1].trim()) attrKeys.add(parts[1].trim());
    }
  }

  // <title> / <meta name="description"> 的兜底键（js/i18n.js 的 §4 §5 逻辑）
  textKeys.add('meta.title');
  textKeys.add('meta.description');

  // 同一键若同时被当作文案使用，按文案处理
  for (const k of [...attrKeys]) if (textKeys.has(k)) attrKeys.delete(k);

  return {
    textKeys: [...textKeys].sort(),
    attrKeys: [...attrKeys].sort(),
  };
}

/** 读取单个语言包（扁平点号键结构） */
function loadLocale(lang) {
  const file = path.join(LOCALES_DIR, `${lang}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(`缺少语言包: locales/${lang}.json`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const { textKeys, attrKeys } = collectKeys(html);
  const allKeys = [...textKeys, ...attrKeys];

  const output = {};

  // 中文为源语言，index.html 中的硬编码文案即中文原文，仍从 zh.json 取以保持一致
  const missingText = [];
  const missingAttr = [];
  for (const lang of LANGS) {
    const dict = loadLocale(lang);
    const picked = {};
    for (const key of allKeys) {
      const isText = textKeys.includes(key);
      const val = dict[key];
      if (typeof val !== 'string') {
        (isText ? missingText : missingAttr).push(`${lang}/${key}`);
        continue;
      }
      picked[key] = val;
    }
    output[lang] = picked;
  }

  if (missingAttr.length) {
    console.warn(
      `[build-home-i18n] ⚠️  ${missingAttr.length} 个「属性专用」键在语言包中缺失，已跳过（不产生可见文案泄漏）：`
    );
    for (const item of [...new Set(missingAttr.map(s => s.split('/')[1]))]) {
      console.warn(`   - ${item}  （${LANGS.length} 个语言全部缺失）`);
    }
  }

  if (missingText.length) {
    console.error(`[build-home-i18n] ❌ 可见文案键缺失（共 ${missingText.length} 个），会导致英文页残留中文：`);
    for (const item of missingText) console.error('   - ' + item);
    console.error('请补齐 locales/*.json 后重跑。');
    process.exit(1);
  }

  const placedKeys = allKeys.filter(k => output[LANGS[0]][k] !== undefined);

  const banner =
    '/**\n' +
    ' * home-i18n-data.js — 首页 SSR 精简语言包【自动生成，请勿手改】\n' +
    ' *\n' +
    ' * 生成器：scripts/build-home-i18n.cjs\n' +
    ' * 来源：  locales/*.json ∩ index.html 中 data-i18n / data-i18n-html / data-i18n-attr 用到的键\n' +
    ` * 键数：  ${placedKeys.length} × ${LANGS.length} 语言\n` +
    ' *\n' +
    ' * 修改 index.html 的 i18n 标注后，请重跑：node scripts/build-home-i18n.cjs\n' +
    ' */\n\n';

  const body =
    'export const HOME_I18N_KEYS = ' + JSON.stringify(placedKeys, null, 2) + ';\n\n' +
    'export const HOME_I18N = ' + JSON.stringify(output, null, 2) + ';\n';

  const content = banner + body;

  if (checkOnly) {
    const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
    if (current !== content) {
      console.error('[build-home-i18n] ❌ home-i18n-data.js 与 index.html / 语言包不同步。');
      console.error('   请执行：node scripts/build-home-i18n.cjs');
      process.exit(1);
    }
    console.log(`[build-home-i18n] ✅ 同步（${placedKeys.length} 键 × ${LANGS.length} 语言）`);
    return;
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, content, 'utf8');

  const kb = (Buffer.byteLength(content) / 1024).toFixed(1);
  console.log('[build-home-i18n] ✅ 已生成 functions/lib/home-i18n-data.js');
  console.log(`   键 ${placedKeys.length} 个 × ${LANGS.length} 语言，体积 ${kb}KB`);
}

main();
