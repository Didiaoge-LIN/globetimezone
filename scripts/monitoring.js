// ===== GlobeTimeZone - Performance Monitoring v1.0 =====
// Web Vitals: LCP, INP, CLS, FCP, TTFB
// 基于 Google Web Vitals 标准，使用原生 PerformanceObserver API（零依赖）

(function () {
  'use strict';

  // ==================== 评级阈值（Google 标准） ====================
  const THRESHOLDS = {
    LCP: { good: 2500, poor: 4000 },     // Largest Contentful Paint (ms)
    INP: { good: 200, poor: 500 },       // Interaction to Next Paint (ms)
    CLS: { good: 0.1, poor: 0.25 },      // Cumulative Layout Shift (score)
    FCP: { good: 1800, poor: 3000 },     // First Contentful Paint (ms)
    TTFB: { good: 800, poor: 1800 },     // Time to First Byte (ms)
  };

  /**
   * 获取评级
   * @param {string} name - 指标名称
   * @param {number} value - 指标值
   * @returns {string} 'good' | 'needs-improvement' | 'poor'
   */
  function getRating(name, value) {
    const threshold = THRESHOLDS[name];
    if (!threshold) return 'unknown';
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * 上报 Web Vitals 指标
   * @param {string} name - 指标名称
   * @param {number} value - 指标值
   * @param {string} rating - 评级
   */
  function reportWebVital(name, value, rating) {
    const roundedValue = Math.round(name === 'CLS' ? value * 1000 : value);

    // 方式1：发送到 Google Analytics 4
    if (typeof gtag === 'function') {
      try {
        gtag('event', name, {
          event_category: 'Web Vitals',
          event_label: window.location.pathname,
          value: roundedValue,
          non_interaction: true,
          metric_rating: rating,
        });
      } catch (e) {
        // GA 可能未初始化
      }
    }

    // 方式2：通过 Navigator.sendBeacon 发送到自定义端点
    if (navigator.sendBeacon) {
      try {
        const data = JSON.stringify({
          n: name,
          v: roundedValue,
          r: rating,
          p: window.location.pathname,
          t: Date.now(),
        });
        navigator.sendBeacon('/api/metrics', data);
      } catch (e) {
        // Beacon 静默失败
      }
    }

    // 方式3：开发环境日志
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const emoji = rating === 'good' ? '\u2705' : rating === 'needs-improvement' ? '\u26A0\uFE0F' : '\u274C';
      console.log(`[WebVital] ${emoji} ${name}: ${roundedValue} (${rating})`);
    }
  }

  // ==================== LCP（最大内容绘制） ====================
  function observeLCP() {
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          const value = lastEntry.renderTime || lastEntry.loadTime;
          if (value) {
            reportWebVital('LCP', value, getRating('LCP', value));
          }
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // LCP API 不可用
    }
  }

  // ==================== INP（交互到下次绘制） ====================
  function observeINP() {
    // INP 需要 Event Timing API + interactionId
    if (!('PerformanceEventTiming' in window) || !('interactionId' in PerformanceEventTiming.prototype)) {
      return; // 浏览器不支持
    }

    try {
      let maxINP = 0;

      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.interactionId > 0) {
            const duration = entry.processingEnd - entry.startTime;
            if (duration > maxINP) {
              maxINP = duration;
            }
          }
        }
      });

      observer.observe({ type: 'event', buffered: true, durationThreshold: 16 });

      // 在页面卸载/隐藏时上报
      const reportINP = () => {
        if (maxINP > 0) {
          reportWebVital('INP', maxINP, getRating('INP', maxINP));
        }
      };

      ['visibilitychange', 'pagehide'].forEach((event) => {
        document.addEventListener(event, () => {
          if (document.visibilityState === 'hidden') {
            reportINP();
          }
        }, { once: true });
      });
    } catch (e) {
      // INP API 不可用
    }
  }

  // ==================== CLS（累计布局偏移） ====================
  function observeCLS() {
    try {
      let clsValue = 0;
      let sessionEntries = [];

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // 只计算 without-recent-input 的偏移
          if (!entry.hadRecentInput) {
            sessionEntries.push(entry);
          }
        }

        // 取最大 session 值
        let sessionValue = 0;
        for (const entry of sessionEntries) {
          sessionValue += entry.value;
        }
        if (sessionValue > clsValue) {
          clsValue = sessionValue;
        }
      }).observe({ type: 'layout-shift', buffered: true });

      // 页面隐藏时上报
      ['visibilitychange', 'pagehide'].forEach((event) => {
        document.addEventListener(event, () => {
          if (document.visibilityState === 'hidden') {
            reportWebVital('CLS', clsValue, getRating('CLS', clsValue));
          }
        }, { once: true });
      });
    } catch (e) {
      // CLS API 不可用
    }
  }

  // ==================== FCP（首次内容绘制） ====================
  function observeFCP() {
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const value = entries[0].startTime;
          reportWebVital('FCP', value, getRating('FCP', value));
        }
      }).observe({ type: 'paint', buffered: true });
    } catch (e) {
      // FCP API 不可用
    }
  }

  // ==================== TTFB（首字节时间） ====================
  function observeTTFB() {
    try {
      // 使用 Navigation Timing API
      const navEntry = performance.getEntriesByType('navigation')[0];
      if (navEntry) {
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        if (ttfb > 0) {
          reportWebVital('TTFB', ttfb, getRating('TTFB', ttfb));
        }
      }

      // 同时用 PerformanceObserver 监听未来的导航
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const ttfb = entry.responseStart - entry.requestStart;
          if (ttfb > 0) {
            reportWebVital('TTFB', ttfb, getRating('TTFB', ttfb));
          }
        }
      }).observe({ type: 'navigation', buffered: true });
    } catch (e) {
      // TTFB API 不可用
    }
  }

  // ==================== 页面加载性能摘要 ====================
  function logPerformanceSummary() {
    window.addEventListener('load', () => {
      // 使用 setTimeout 确保所有指标都收集完毕
      setTimeout(() => {
        const navTiming = performance.getEntriesByType('navigation')[0];
        if (!navTiming) return;

        const metrics = {
          'DNS': (navTiming.domainLookupEnd - navTiming.domainLookupStart).toFixed(0),
          'TCP': (navTiming.connectEnd - navTiming.connectStart).toFixed(0),
          'Request': (navTiming.responseStart - navTiming.requestStart).toFixed(0),
          'Response': (navTiming.responseEnd - navTiming.responseStart).toFixed(0),
          'DOM Ready': (navTiming.domContentLoadedEventEnd - navTiming.fetchStart).toFixed(0),
          'Page Load': (navTiming.loadEventEnd - navTiming.fetchStart).toFixed(0),
          'Total Resources': performance.getEntriesByType('resource').length,
        };

        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log('[Perf] 页面加载时间线 (ms):', metrics);
        }

        // 上报关键页面加载指标
        if (typeof gtag === 'function') {
          gtag('event', 'page_load_performance', {
            event_category: 'Performance',
            event_label: window.location.pathname,
            ...metrics,
            non_interaction: true,
          });
        }
      }, 1000);
    });
  }

  // ==================== 全局错误捕获 (→ GA4) ====================
  function initErrorCapture() {
    // JavaScript 运行时错误
    window.addEventListener('error', (event) => {
      if (typeof gtag === 'function') {
        gtag('event', 'exception', {
          description: `${event.message} at ${event.filename}:${event.lineno}:${event.colno}`,
          fatal: false,
        });
      }
      // 同时记录到 console（供 Cloudflare Web Analytics 捕获）
      console.error('[GlobeTimeZone Error]', event.message, {
        file: event.filename,
        line: event.lineno,
        col: event.colno,
        timestamp: new Date().toISOString(),
      });
    });

    // 未捕获的 Promise 拒绝
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      if (typeof gtag === 'function') {
        gtag('event', 'exception', {
          description: `Unhandled Promise: ${reason}`,
          fatal: false,
        });
      }
      console.error('[GlobeTimeZone UnhandledRejection]', reason, {
        timestamp: new Date().toISOString(),
      });
    });
  }

  // ==================== 启动所有监控 ====================
  function startMonitoring() {
    observeLCP();
    observeINP();
    observeCLS();
    observeFCP();
    observeTTFB();
    logPerformanceSummary();
    initErrorCapture();
  }

  // DOM 就绪后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startMonitoring);
  } else {
    startMonitoring();
  }
})();
