/**
 * Cloudflare Pages Functions — catch-all middleware
 * File: functions/[[path]].js
 *
 * 作用：
 *   拦截 /<lang>/<page>.html 请求，301 重定向到 /<lang>/<page>
 *   从根源上防止 CF Pages Clean URLs 的 308 重定向丢掉语言前缀
 *
 * 处理顺序（CF Pages）：
 *   1. Functions（本文件）
 *   2. _redirects
 *   3. 静态文件服务
 *
 * 城市页面 /city/slug/ 由 CF Pages Clean URLs 自动映射到 /city/slug.html
 * 无需在此处理，否则会导致死循环
 */

const LANG_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/(.+)\.html$/;

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 处理带语言前缀的 .html 请求
  const match = pathname.match(LANG_REGEX);
  if (match) {
    const lang = match[1];
    const pathWithoutExt = match[2];

    // 特殊处理：/<lang>/index.html → /<lang>/
    if (pathWithoutExt === 'index') {
      url.pathname = `/${lang}/`;
    } else {
      url.pathname = `/${lang}/${pathWithoutExt}`;
    }

    // 301 永久重定向（SEO 友好）
    return Response.redirect(url.toString(), 301);
  }

  // 其他请求 → 交给 _redirects / 静态文件服务
  return next();
}
