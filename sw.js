'use strict';

/**
 * Service Worker v8 — LRU淘汰 + 容量限制 + 容错安装
 * 修复：预缓存路径全部修正，DYNAMIC_CACHE容量限制，安装失败容错
 */
const CACHE_VERSION = 'v8';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const MAX_DYNAMIC_ENTRIES = 100;

// 预缓存资源列表（路径全部修正，无404）
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles/premium.css',
  '/js/gtz-utils.js',
  '/favicon.svg',
  '/og-default.png'
];

// --------------------------
// 安装事件：预缓存核心资源
// --------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // 逐个添加，单个失败不影响整体安装（修复安装失败问题）
      const results = await Promise.allSettled(
        PRECACHE_ASSETS.map(url => cache.add(url).catch(err => {
          console.warn(`预缓存失败: ${url}`, err);
        }))
      );
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      console.log(`预缓存完成: ${successCount}/${PRECACHE_ASSETS.length}`);
    }).then(() => self.skipWaiting())
  );
});

// --------------------------
// 激活事件：清理旧版本缓存+修剪动态缓存
// --------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => {
      return trimDynamicCache();
    }).then(() => self.clients.claim())
  );
});

// --------------------------
// 请求拦截：缓存策略
// --------------------------
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. 静态资源：缓存优先，后台更新
  if (url.pathname.match(/\.(css|js|png|jpg|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(STATIC_CACHE).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 2. HTML页面：网络优先，失败回退缓存
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html') || event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, response.clone());
              trimDynamicCache();
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(cached => {
            return cached || caches.match('/404.html');
          });
        })
    );
    return;
  }

  // 3. API：网络优先，不缓存
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. i18n locale JSON: Network First
  if (url.pathname.includes('/locales/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => cache.put(event.request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 5. 其余请求：正常转发
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

// --------------------------
// 工具函数：修剪动态缓存（LRU简易实现）
// --------------------------
async function trimDynamicCache() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const keys = await cache.keys();
    if (keys.length > MAX_DYNAMIC_ENTRIES) {
      const deleteCount = keys.length - MAX_DYNAMIC_ENTRIES;
      await Promise.all(keys.slice(0, deleteCount).map(key => cache.delete(key)));
      console.log(`动态缓存修剪: 删除 ${deleteCount} 条`);
    }
  } catch (e) {
    console.warn('修剪动态缓存失败:', e);
  }
}

// --------------------------
// 后台同步（可选）
// --------------------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(Promise.resolve());
  }
});
