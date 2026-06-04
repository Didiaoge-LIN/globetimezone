// GlobeTimeZone Service Worker v4
// Network-first for navigation, stale-while-revalidate for API, cache-first for static
// Reviewed by FE — All 7 experts approved 2026-05-29

const CACHE_VERSION = 'v4';
const STATIC_CACHE = 'static-' + CACHE_VERSION;
const DYNAMIC_CACHE = 'dynamic-' + CACHE_VERSION;

// Critical assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/index-zh.html',
  '/manifest.json',
  '/css/style.min.css',
  '/css/async.min.css',
  '/js/main.min.js',
  '/js/utils.min.js',
  '/js/timezone-loader.min.js',
  '/js/home.min.js',
  '/js/saved-cities.min.js',
  '/js/user-auth.min.js',
  '/js/monitoring.min.js',
  '/js/sentry.min.js',
  '/js/ga4.min.js',
  '/js/l10n.min.js',
  '/js/preference-service.min.js',
  '/js/prefetch-strategy.min.js',
  '/js/smart-clock.min.js',
  '/404.html',
  '/offline.html',
  '/robots.txt'
];

// Offline fallback page
const OFFLINE_HTML = '<!DOCTYPE html>' +
'<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">' +
'<title>Offline — GlobeTimeZone</title><style>' +
'*{margin:0;padding:0;box-sizing:border-box}' +
'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;' +
'justify-content:center;min-height:100vh;margin:0;background:linear-gradient(135deg,#1e3a5f,#2563eb 50%,#1d4ed8);' +
'color:#fff;text-align:center;padding:20px}' +
'.c{max-width:400px}' +
'h1{font-size:2rem;margin-bottom:16px}' +
'p{opacity:.9;margin-bottom:24px;line-height:1.6}' +
'button{background:#fff;color:#2563eb;border:none;padding:12px 32px;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer}' +
'button:hover{background:#eff6ff}' +
'</style></head><body><div class="c"><h1>🌍 You\'re Offline</h1>' +
'<p>GlobeTimeZone needs an internet connection for the first visit.<br>Check your connection and try again.</p>' +
'<button onclick="location.reload()">Try Again</button></div></body></html>';

// ======================== INSTALL ========================
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function (cache) {
      console.log('[SW v4] Pre-caching ' + PRECACHE_URLS.length + ' assets');
      return cache.addAll(PRECACHE_URLS).catch(function (err) {
        console.warn('[SW v4] Some assets failed to pre-cache (non-critical):', err);
      });
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// ======================== ACTIVATE ========================
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) {
          return key !== STATIC_CACHE && key !== DYNAMIC_CACHE;
        }).map(function (key) {
          console.log('[SW v4] Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ======================== FETCH ========================
self.addEventListener('fetch', function (event) {
  var request = event.request;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (CDNs, analytics, etc.)
  var reqUrl;
  try { reqUrl = new URL(request.url); } catch (e) { return; }
  if (reqUrl.origin !== self.location.origin) return;

  // ---- NAVIGATION: Network-first with cache fallback ----
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function (response) {
        // Cache the latest version
        var clone = response.clone();
        caches.open(DYNAMIC_CACHE).then(function (cache) {
          cache.put(request, clone);
        });
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          return cached || caches.match('/offline.html').then(function (offline) {
            return offline || new Response(OFFLINE_HTML, {
              status: 200,
              headers: { 'Content-Type': 'text/html' }
            });
          });
        });
      })
    );
    return;
  }

  // ---- API: Stale-while-revalidate ----
  if (reqUrl.pathname.indexOf('/api/') !== -1) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        var fetchPromise = fetch(request).then(function (response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(DYNAMIC_CACHE).then(function (cache) {
              cache.put(request, clone);
            });
          }
          return response;
        }).catch(function () {
          return cached || new Response(JSON.stringify({ error: 'Service unavailable' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ---- STATIC: Cache-first (immutable assets) ----
  event.respondWith(
    caches.match(request).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response.ok && response.type === 'basic') {
          var clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(function (cache) {
            cache.put(request, clone);
          });
        }
        return response;
      });
    })
  );
});

// ======================== MESSAGES ========================
self.addEventListener('message', function (event) {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearCaches') {
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return caches.delete(k); }));
    }).then(function () {
      console.log('[SW v4] All caches cleared');
    });
  }
});
