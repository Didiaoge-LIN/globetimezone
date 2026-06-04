// ===== GlobeTimeZone - Utility Functions v1.0 =====
// Performance: debounce, throttle, lazy loading

/**
 * 防抖函数 - 适用于搜索输入框
 * @param {Function} fn - 要执行的函数
 * @param {number} delay - 延迟毫秒数
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 节流函数 - 适用于滚动事件、resize
 * @param {Function} fn - 要执行的函数
 * @param {number} limit - 节流间隔毫秒数
 * @returns {Function} 节流后的函数
 */
function throttle(fn, limit = 100) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

/**
 * 延迟加载非关键脚本
 * 在浏览器空闲时通过 requestIdleCallback 加载
 */
function initLazyLoading() {
  window.addEventListener('load', () => {
    const lazyLoadScript = (url) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    const loadNonCritical = () => {
      // 非关键脚本在此处延迟加载
      // 例如：lazyLoadScript('https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX');
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(loadNonCritical, { timeout: 2000 });
    } else {
      setTimeout(loadNonCritical, 2000);
    }
  });
}

/**
 * 安全获取 DOM 元素
 * @param {string} selector - CSS 选择器
 * @returns {HTMLElement|null}
 */
function safeGetElement(selector) {
  try {
    return document.querySelector(selector);
  } catch (e) {
    console.warn('[Utils] 选择器无效:', selector, e);
    return null;
  }
}

/**
 * 检查浏览器是否支持 WebP
 * @returns {Promise<boolean>}
 */
function supportsWebP() {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEAAQAcJaQAA3AA/v3AgAA=';
  });
}

// 初始化延迟加载
initLazyLoading();
