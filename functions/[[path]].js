/**
 * ============================================================
 * Cloudflare Pages Functions — catch-all middleware
 * File: functions/[[path]].js
 * v10.0 — i18n SSR 动态注入版
 * 零重复代码，所有通用能力由共享库提供
 *
 * 作用：
 *   1. 拦截 /<lang>/ 首页请求，动态注入 lang/title/description（SEO 救命）
 *   2. 拦截 /<lang>/city/:slug/ 请求，直接渲染城市页面（返回200）
 *   3. 拦截 /<lang>/<page>.html 请求，301 重定向到 /<lang>/<page>
 * ============================================================
 */

import { isValidSlug, escapeHtml, safeJsonLd, buildErrorResponse } from './lib/security.js';
import { initConfig, minifyHtml, generateEtag, handleConditionalRequest, buildCacheHeaders } from './lib/utils.js';
import CONSTANTS from './lib/constants.js';
import { getAllCities, getValidSlugs } from './city/data/index.js';
import { renderCityPage } from './city/city-template.js';

const LANG_SET = new Set(CONSTANTS.VALIDATION.ALLOWED_LANGS);
const VALID_SLUGS = getValidSlugs();

const LANG_HTML_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/(.+)\.html$/;
const LANG_CITY_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/city\/([a-zA-Z0-9%-]+)\/?$/;
const LANG_HOME_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/?$/;

// i18n 首页 SEO 元数据（搜索引擎不执行 JS，必须 SSR 注入）
const LANG_SEO = {
  en: { lang: 'en', title: 'GlobeTimeZone — Global Time Zone Converter & Meeting Planner', desc: 'Instantly know whether to reach out or schedule a meeting. Real-time global time zones at your fingertips.' },
  zh: { lang: 'zh', title: 'GlobeTimeZone — 全球时区转换 | 200+城市实时时间', desc: '一眼判断该不该联系、何时开会。实时感知全球节奏。' },
  de: { lang: 'de', title: 'GlobeTimeZone — Weltweiter Zeitzonen-Konverter & Meeting-Planer', desc: 'Sofort wissen, ob Sie sich melden oder ein Meeting planen sollten. Echtzeit-Zeitzonen weltweit.' },
  fr: { lang: 'fr', title: 'GlobeTimeZone — Convertisseur de fuseaux horaires & Planificateur de réunions', desc: 'Sachez instantanément s\'il faut contacter ou planifier une réunion. Fuseaux horaires en temps réel.' },
  es: { lang: 'es', title: 'GlobeTimeZone — Conversor de zonas horarias & Planificador de reuniones', desc: 'Sepa al instante si contactar o programar una reunión. Zonas horarias en tiempo real.' },
  ja: { lang: 'ja', title: 'GlobeTimeZone — 世界のタイムゾーン変換 & ミーティングプランナー', desc: '連絡すべきか、会議を予定すべきか、すぐに判断。リアルタイムの世界のタイムゾーン。' },
  ko: { lang: 'ko', title: 'GlobeTimeZone — 글로벌 시간대 변환 & 미팅 플래너', desc: '연락할지 회의를 잡을지 즉시 판단. 실시간 글로벌 시간대.' },
  pt: { lang: 'pt', title: 'GlobeTimeZone — Conversor de fusos horários & Planejador de reuniões', desc: 'Saiba instantaneamente se deve entrar em contato ou agendar uma reunião. Fusos horários em tempo real.' },
  ar: { lang: 'ar', title: 'GlobeTimeZone — محول المناطق الزمنية العالمية ومخطط الاجتماعات', desc: 'اعرف فورًا ما إذا كان يجب عليك التواصل أو جدولة اجتماع. المناطق الزمنية في الوقت الفعلي.' },
};

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const method = request.method.toUpperCase();

  // ═══════ 0. i18n 首页：/<lang>/ → 动态注入 lang/title/description ═══════
  const homeMatch = pathname.match(LANG_HOME_REGEX);
  if (homeMatch) {
    const lang = homeMatch[1];
    const seo = LANG_SEO[lang];
    if (seo) {
      // 获取静态 index.html 内容
      const staticResp = await next();
      if (staticResp.status !== 200) return staticResp;

      const html = await staticResp.text();

      // SSR 注入：替换 lang 属性 + title + meta description + og:title + og:description + twitter:title + twitter:description
      let patched = html
        .replace(/<html\s+lang="zh"/, `<html lang="${seo.lang}"`)
        .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
        .replace(/(<meta[^>]*name="description"[^>]*content=")[^"]*(")/, `$1${escapeHtml(seo.desc)}$2`)
        .replace(/(<meta[^>]*property="og:title"[^>]*content=")[^"]*(")/, `$1${escapeHtml(seo.title)}$2`)
        .replace(/(<meta[^>]*property="og:description"[^>]*content=")[^"]*(")/, `$1${escapeHtml(seo.desc)}$2`)
        .replace(/(<meta[^>]*name="twitter:title"[^>]*content=")[^"]*(")/, `$1${escapeHtml(seo.title)}$2`)
        .replace(/(<meta[^>]*name="twitter:description"[^>]*content=")[^"]*(")/, `$1${escapeHtml(seo.desc)}$2`);

      // 修复 og:locale
      const localeMap = { en: 'en_US', zh: 'zh_CN', de: 'de_DE', fr: 'fr_FR', es: 'es_ES', ja: 'ja_JP', ko: 'ko_KR', pt: 'pt_BR', ar: 'ar_SA' };
      if (localeMap[lang]) {
        patched = patched.replace(/(<meta[^>]*property="og:locale"[^>]*content=")[^"]*(")/, `$1${localeMap[lang]}$2`);
      }

      const headers = new Headers(staticResp.headers);
      headers.set('Content-Type', 'text/html; charset=utf-8');
      headers.delete('Content-Length');

      return new Response(patched, {
        status: 200,
        headers,
      });
    }
  }

  // ═══════ 1. 语言版城市页面：/<lang>/city/:slug/ → 直接渲染200 ═══════
  const cityMatch = pathname.match(LANG_CITY_REGEX);
  if (cityMatch) {
    const lang = cityMatch[1];
    const rawCity = cityMatch[2];

    // Slug 校验
    if (!isValidSlug(rawCity)) {
      return buildErrorResponse(404, 'Page Not Found');
    }

    const standardCity = rawCity.toLowerCase();

    if (VALID_SLUGS.has(standardCity)) {
      const CITIES = getAllCities();
      const city = CITIES[standardCity];
      if (city) {
        // HEAD/GET only
        if (method !== 'GET' && method !== 'HEAD') {
          return buildErrorResponse(405, 'Method Not Allowed', { allow: 'GET, HEAD' });
        }

        // 初始化配置
        const config = initConfig(env, url.hostname);

        try {
          const rawHtml = renderCityPage(standardCity, city, CITIES, lang, config);
          const html = minifyHtml(rawHtml);

          // ETag 协商缓存
          const etag = await generateEtag(html);
          const cacheHeaders = buildCacheHeaders(config);
          const conditionalResponse = handleConditionalRequest(request, etag, cacheHeaders);
          if (conditionalResponse) return conditionalResponse;

          const headers = {
            'Content-Type': 'text/html; charset=utf-8',
            ETag: etag,
            ...cacheHeaders,
            Vary: 'Accept-Encoding',
          };

          // HEAD 请求仅返回头
          if (method === 'HEAD') {
            return new Response(null, { status: 200, headers });
          }

          return new Response(html, { status: 200, headers });
        } catch (error) {
          console.error(`[LangCity Error] city=${standardCity}, lang=${lang}, msg=${error.message}`);
          return buildErrorResponse(500, 'Internal Server Error');
        }
      }
    }
    // slug 不合法 → 404
    return buildErrorResponse(404, 'Page Not Found');
  }

  // ═══════ 2. 带语言前缀的 .html 请求 → 301 重定向 ═══════
  const htmlMatch = pathname.match(LANG_HTML_REGEX);
  if (htmlMatch) {
    const lang = htmlMatch[1];
    const pathWithoutExt = htmlMatch[2];

    if (pathWithoutExt === 'index') {
      url.pathname = `/${lang}/`;
    } else {
      url.pathname = `/${lang}/${pathWithoutExt}`;
    }

    return Response.redirect(url.toString(), 301);
  }

  // ═══════ 3. 其他请求 → 交给 _redirects / 静态文件服务 ═══════
  return next();
}
