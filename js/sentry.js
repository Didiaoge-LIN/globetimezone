// ===== GlobeTimeZone Sentry Error Monitoring =====
// 激活步骤: 
// 1. 打开 https://sentry.io → 注册/登录
// 2. Create Project → Platform: JavaScript → Browser
// 3. 创建后复制 DSN (格式: https://xxx@o0.ingest.sentry.io/0)
// 4. 复制 CDN 地址 (sentry-cdn.com/*.min.js)
// 5. 替换下面两行, SENTRY_ENABLED 改为 true
//
// 采样率说明 (适配 Free Developer 计划, 5K events/月):
// - tracesSampleRate: 0.1 (仅10%请求生成trace, 节省90%配额)
// - replaysSessionSampleRate: 0 (关闭常规回放, 仅错误时录制)
// - replaysOnErrorSampleRate: 0.5 (50%错误生成回放)

(function() {
  'use strict';

  // ===== 配置区 =====
  const SENTRY_DSN = 'https://550d400ef88588988c289a0226661bcb@o4511471570190336.ingest.us.sentry.io/4511471642345472';
  const SENTRY_CDN = 'https://js.sentry-cdn.com/550d400ef88588988c289a0226661bcb.min.js';
  const SENTRY_ENABLED = true; // ✅ Sentry 错误监控已激活 (2026-05-29)

  if (!SENTRY_ENABLED) {
    console.log('[Sentry] Not enabled - set SENTRY_ENABLED=true and replace DSN in js/sentry.js');
    return;
  }

  const script = document.createElement('script');
  script.src = SENTRY_CDN;
  script.crossOrigin = 'anonymous';
  script.onload = function() {
    if (window.Sentry) {
      window.Sentry.init({
        dsn: SENTRY_DSN,
        release: 'globetimezone@1.0.0',
        environment: window.location.hostname === 'globetimezone.com' ? 'production' : 'development',
        tracesSampleRate: 0.1,          // 1.0→0.1: 10%采样, 适配Free计划5K events/月 (2026-06-12)
        replaysSessionSampleRate: 0,     // 0.1→0: 关闭常规回放, 节省配额 (2026-06-12)
        replaysOnErrorSampleRate: 0.5,   // 1.0→0.5: 仅50%错误生成回放 (2026-06-12)
        integrations: [
          new window.Sentry.Integrations.BrowserTracing(),
        ],
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
      console.log('[Sentry] Error monitoring active');
    }
  };
  script.onerror = function() {
    console.warn('[Sentry] Failed to load from CDN');
  };
  document.head.appendChild(script);
})();
