/**
 * ============================================================
 * home-i18n.js — 语言版首页服务端渲染（SSR）
 *
 * 为什么需要它：
 *   首页 index.html 是「中文优先」模板，多语言靠客户端 js/i18n.js 运行时改写。
 *   但搜索引擎爬虫不做（或不可靠地做）JS，导致 /<lang>/ 首页对爬虫呈现为
 *   中文正文 + lang="zh" + canonical 指向 /，即 8 个语言版本在收录层面全部失效。
 *
 * 本模块把 i18n.js 的翻译逻辑「同构」到服务端：
 *   - data-i18n / data-i18n-html  → 元素文本（与 i18n.js §1 §2 一致）
 *   - data-i18n-attr              → 属性赋值（与 i18n.js §3 一致，分隔符 ';'）
 *   - <title> / meta description / og / twitter（与 i18n.js §4 §5 一致）
 *   - 额外补齐爬虫必需的 head 元数据：<html lang>、canonical 自指、og:locale、dir
 *
 * 约束：服务端输出必须与客户端水合结果一致，否则会出现「首屏中文→JS 后变英文」的
 *      闪烁（FOUC）与语义错配。因此两端的键解析规则、兜底顺序保持完全一致。
 *
 * 语言数据来自 functions/lib/home-i18n-data.js（由 scripts/build-home-i18n.cjs 生成）。
 * ============================================================
 */

import { HOME_I18N, HOME_I18N_KEYS } from './home-i18n-data.js';

export const SITE_BASE = 'https://globetimezone.com';

/** og:locale 映射（与 [[path]].js 原有实现保持一致） */
const OG_LOCALE = {
  zh: 'zh_CN', en: 'en_US', de: 'de_DE', fr: 'fr_FR', es: 'es_ES',
  ja: 'ja_JP', ko: 'ko_KR', pt: 'pt_BR', ar: 'ar_SA'
};

/** 需要 dir="rtl" 的语言 */
const RTL_LANGS = new Set(['ar']);

/** 属性片段原子：允许属性值里出现引号内的 '>' */
const ATTR_ATOM = '(?:[^>"\']|"[^"]*"|\'[^\']*\')';
/** 属性片段（惰性 / 贪婪） */
const ATTRS_LAZY = `${ATTR_ATOM}*?`;
const ATTRS_GREEDY = `${ATTR_ATOM}*`;

/** 该语言是否有首页 SSR 数据 */
export function hasHomeI18n(lang) {
  return Object.prototype.hasOwnProperty.call(HOME_I18N, lang);
}

/**
 * 首页在指定语言下的规范地址
 * zh 是默认语言，根路径 / 即其规范地址；其余语言自指向 /<lang>/
 */
export function canonicalFor(lang) {
  return lang === 'zh' ? `${SITE_BASE}/` : `${SITE_BASE}/${lang}/`;
}

/** 文本转义：&（避免重复转义已有实体）、<、> */
function escText(input) {
  return String(input)
    .replace(/&(?![a-zA-Z#][a-zA-Z0-9]*;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 属性值转义 */
function escAttr(input) {
  return escText(input).replace(/"/g, '&quot;');
}

/** 正则字面量转义（用于动态构造属性名正则） */
function escRe(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 把 <script> / <style> 块临时遮蔽，避免正文替换误伤脚本内容
 */
function maskRawBlocks(html) {
  const store = [];
  const masked = html.replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, (m) => {
    store.push(m);
    return `\u0000${store.length - 1}\u0000`;
  });
  return {
    masked,
    restore: (out) => out.replace(/\u0000(\d+)\u0000/g, (_, i) => store[Number(i)])
  };
}

/** 安全替换 meta content，值缺失时原样返回 */
function setMetaContent(html, re, value) {
  if (typeof value !== 'string' || !value) return html;
  return html.replace(re, (m, prefix, suffix) => `${prefix}${escAttr(value)}${suffix}`);
}

/**
 * 将首页 HTML 渲染为指定语言的完整本地化版本
 * @param {string} html  原始 index.html
 * @param {string} lang  语言代码（zh/en/de/fr/es/ja/ko/pt/ar）
 * @returns {string} 本地化后的 HTML（lang 无数据时原样返回）
 */
export function renderLocalizedHome(html, lang) {
  if (!hasHomeI18n(lang)) return html;

  const t = HOME_I18N[lang];
  const { masked, restore } = maskRawBlocks(html);
  let out = masked;

  // ── 1) data-i18n-html：译文允许包含内联标签（如 <br>）──────────
  out = out.replace(
    new RegExp(`<([a-zA-Z][\\w-]*)(${ATTRS_LAZY})\\sdata-i18n-html="([^"]*)"(${ATTRS_GREEDY})>([\\s\\S]*?)<\\/\\1>`, 'g'),
    (m, tag, pre, key, post) => {
      const v = t[key];
      if (typeof v !== 'string') return m;
      return `<${tag}${pre} data-i18n-html="${key}"${post}>${v}</${tag}>`;
    }
  );

  // ── 2) data-i18n：纯文本（跳过已被 data-i18n-html 处理的元素）──
  out = out.replace(
    new RegExp(`<([a-zA-Z][\\w-]*)(${ATTRS_LAZY})\\sdata-i18n="([^"]*)"(${ATTRS_GREEDY})>([\\s\\S]*?)<\\/\\1>`, 'g'),
    (m, tag, pre, key, post) => {
      // i18n.js：同时带 data-i18n-html 的元素由 §1 处理，此处跳过
      if (/data-i18n-html=/.test(pre + post)) return m;
      const v = t[key];
      if (typeof v !== 'string') return m;
      return `<${tag}${pre} data-i18n="${key}"${post}>${escText(v)}</${tag}>`;
    }
  );

  // ── 3) data-i18n-attr：属性赋值（aria-label / placeholder 等）──
  out = out.replace(
    new RegExp(`<([a-zA-Z][\\w-]*)(${ATTRS_GREEDY})>`, 'g'),
    (m, tag, attrs) => {
      const spec = attrs.match(/\sdata-i18n-attr="([^"]*)"/);
      if (!spec) return m;

      let next = attrs;
      for (const pair of spec[1].split(';')) {
        const segments = pair.split(':');
        if (segments.length !== 2) continue;
        const attr = segments[0].trim();
        const key = segments[1].trim();
        if (!attr || !key) continue;

        const v = t[key];
        if (typeof v !== 'string') continue; // 语言包缺键 → 保持模板原值

        const attrRe = new RegExp(`(\\s${escRe(attr)}=)"[^"]*"`);
        next = attrRe.test(next)
          ? next.replace(attrRe, `$1"${escAttr(v)}"`)
          : `${next} ${attr}="${escAttr(v)}"`;
      }
      return `<${tag}${next}>`;
    }
  );

  // ── 4) <html lang> / dir ──────────────────────────────────────
  out = out.replace(/<html\b([^>]*)>/, (m, attrs) => {
    const rest = attrs.replace(/\s+lang="[^"]*"/g, '').replace(/\s+dir="[^"]*"/g, '');
    return `<html${rest} lang="${lang}"${RTL_LANGS.has(lang) ? ' dir="rtl"' : ''}>`;
  });

  // ── 5) <title> ────────────────────────────────────────────────
  const title = t['meta.title'];
  if (typeof title === 'string' && title) {
    out = out.replace(/<title\b[^>]*>[\s\S]*?<\/title>/, (m) =>
      m.replace(/>[\s\S]*<\/title>$/, `>${escText(title)}</title>`)
    );
  }

  // ── 6) meta description / og / twitter ────────────────────────
  const desc = t['meta.description'];
  out = setMetaContent(out, /(<meta[^>]*\bname="description"[^>]*\bcontent=")[^"]*(")/, desc);
  out = setMetaContent(out, /(<meta[^>]*\bproperty="og:title"[^>]*\bcontent=")[^"]*(")/, title);
  out = setMetaContent(out, /(<meta[^>]*\bproperty="og:description"[^>]*\bcontent=")[^"]*(")/, desc);
  out = setMetaContent(out, /(<meta[^>]*\bproperty="og:locale"[^>]*\bcontent=")[^"]*(")/, OG_LOCALE[lang]);
  out = setMetaContent(out, /(<meta[^>]*\bname="twitter:title"[^>]*\bcontent=")[^"]*(")/, title);
  out = setMetaContent(out, /(<meta[^>]*\bname="twitter:description"[^>]*\bcontent=")[^"]*(")/, desc);

  // ── 7) canonical / og:url 自指 ────────────────────────────────
  // 关键：语言页必须自指，否则会被搜索引擎判定为首页的重复页，hreflang 全部作废
  const canonical = canonicalFor(lang);
  out = out.replace(/(<link[^>]*\brel="canonical"[^>]*\bhref=")[^"]*(")/, `$1${canonical}$2`);
  out = setMetaContent(out, /(<meta[^>]*\bproperty="og:url"[^>]*\bcontent=")[^"]*(")/, canonical);

  return restore(out);
}

/** 供测试/自检使用：本次生成覆盖的键 */
export { HOME_I18N_KEYS };
