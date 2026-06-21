// ===== GlobeTimeZone Sentry ES Module Entry =====
// 供 index.html / blog/index.html 通过 import { initSentry } 引用
// 实际初始化逻辑复用 scripts/sentry.js（IIFE 自执行模式）
//
// 采样率已适配 Free Developer 计划 (5K events/月):
// - tracesSampleRate: 0.1 (10%采样)
// - replaysSessionSampleRate: 0 (关闭常规回放)
// - replaysOnErrorSampleRate: 0.5 (50%错误回放)

const SENTRY_DSN = 'https://550d400ef88588988c289a0226661bcb@o4511471570190336.ingest.us.sentry.io/4511471642345472';
const SENTRY_CDN = 'https://js.sentry-cdn.com/550d400ef88588988c289a0226661bcb.min.js';

export function initSentry() {
  const script = document.createElement('script');
  script.src = SENTRY_CDN;
  script.crossOrigin = 'anonymous';
  script.onload = function() {
    if (window.Sentry) {
      window.Sentry.init({
        dsn: SENTRY_DSN,
        release: 'globetimezone@1.0.0',
        environment: window.location.hostname === 'globetimezone.com' ? 'production' : 'development',
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0.5,
        integrations: [
          window.Sentry.Integrations && window.Sentry.Integrations.BrowserTracing
            ? new window.Sentry.Integrations.BrowserTracing()
            : undefined,
        ].filter(Boolean),
        beforeSend(event) {
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return null;
          }
          if (event.exception && event.exception.values) {
            const msg = event.exception.values[0].value || '';
            if (msg.includes('chrome-extension') || msg.includes('moz-extension')) {
              return null;
            }
          }
          return event;
        }
      });
      console.log('[Sentry] Error monitoring active (Free plan, 10% trace sampling)');
    }
  };
  script.onerror = function() {
    console.warn('[Sentry] Failed to load from CDN');
  };
  document.head.appendChild(script);
}
