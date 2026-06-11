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
 * 因此：本中间件在 _redirects 生效之前就完成 301 重定向，
 * 浏览器重新请求 clean URL，再由 _redirects 正确 rewrite。
 */

const LANG_REGEX = /^\/(en|zh|de|fr|es|ja|ko|pt|ar)\/(.+)\.html$/;
const CITY_REGEX = /^\/time\/([a-z0-9-]+)\/?$/;

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 处理城市页面 /city/slug/ → 直接服务 /city/slug.html
  const cityMatch = pathname.match(CITY_REGEX);
  if (cityMatch) {
    const slug = cityMatch[1];
    // 重写URL到实际的.html文件，交给静态文件服务
    url.pathname = `/city/${slug}.html`;
    const modifiedRequest = new Request(url.toString(), request);
    return fetch(modifiedRequest);
  }

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
