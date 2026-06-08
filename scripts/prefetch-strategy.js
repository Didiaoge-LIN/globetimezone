/**
 * prefetch-strategy.js — Intelligent link prefetching
 *
 * Converted from src/utils/prefetch-strategy.ts — Reviewed by FE
 * Uses IntersectionObserver + requestIdleCallback for performance-optimal preloading.
 *
 * API:
 *   prefetchStrategy.observeLinks()    — observe all [data-prefetch] links
 *   prefetchStrategy.prefetchOnIdle(url) — prefetch a URL during idle time
 */
(function (global) {
  'use strict';

  function PrefetchStrategy() {
    this._observer = null;
    this._prefetched = {}; // Track already prefetched URLs
  }

  /**
   * Start observing all links with data-prefetch attribute.
   * When a link enters the viewport (100px margin), trigger prefetch.
   */
  PrefetchStrategy.prototype.observeLinks = function () {
    if (!('IntersectionObserver' in window)) {
      // Fallback: prefetch all visible links immediately
      this._prefetchAll();
      return;
    }

    var self = this;
    this._observer = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            self._handleObserved(entries[i].target);
          }
        }
      },
      { rootMargin: '100px' }
    );

    var links = document.querySelectorAll('a[data-prefetch]');
    for (var j = 0; j < links.length; j++) {
      this._observer.observe(links[j]);
    }
  };

  /**
   * Handle a single observed link
   */
  PrefetchStrategy.prototype._handleObserved = function (el) {
    var href = el.getAttribute('href');
    if (!href || this._prefetched[href]) return;

    // Use <link rel="prefetch"> for browser-managed prefetch
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = el.getAttribute('data-prefetch-as') || 'document';
    document.head.appendChild(link);

    this._prefetched[href] = true;

    // Stop observing this element
    if (this._observer) {
      this._observer.unobserve(el);
    }
  };

  /**
   * Prefetch a URL during browser idle time
   * Falls back to setTimeout if requestIdleCallback unavailable
   */
  PrefetchStrategy.prototype.prefetchOnIdle = function (url) {
    if (!url || this._prefetched[url]) return;

    var self = this;
    var doFetch = function () {
      try {
        // Low-priority fetch — browser may cancel if needed
        fetch(url, { priority: 'low', method: 'GET' })
          .then(function () {
            self._prefetched[url] = true;
          })
          .catch(function () {
            /* Best-effort, ignore errors */
          });
      } catch (e) {
        /* Best-effort */
      }
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(doFetch, { timeout: 2000 });
    } else {
      setTimeout(doFetch, 2000);
    }
  };

  /**
   * Fallback: prefetch all data-prefetch links immediately
   */
  PrefetchStrategy.prototype._prefetchAll = function () {
    var links = document.querySelectorAll('a[data-prefetch]');
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute('href');
      if (href && !this._prefetched[href]) {
        this.prefetchOnIdle(href);
      }
    }
  };

  /**
   * Prefetch critical pages after initial page load
   */
  PrefetchStrategy.prototype.prefetchCritical = function () {
    var critical = [
      '/pages/world-map.html',
      '/pages/countdown.html',
      '/pages/holidays.html'
    ];
    var self = this;
    for (var i = 0; i < critical.length; i++) {
      self.prefetchOnIdle(critical[i]);
    }
  };

  /**
   * Disconnect observer (cleanup)
   */
  PrefetchStrategy.prototype.destroy = function () {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    this._prefetched = {};
  };

  // ---- Export singleton ----
  var instance = new PrefetchStrategy();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = instance;
  }
  global.prefetchStrategy = instance;

})(typeof window !== 'undefined' ? window : globalThis);
