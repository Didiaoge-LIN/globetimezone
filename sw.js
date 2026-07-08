'use strict';

/**
 * Service Worker v13 — 真LRU淘汰 + 容量限制 + 容错安装 + 离线回退
 * v13升级：修复 ad-unlock 视频播放bug（video元素挂载DOM + play()调用）
 *
 * ⚠️ 版本号同步点（修改时必须同步以下 4 处）：
 *   1. sw.js CACHE_VERSION（本文件）
 *   2. functions/lib/constants.js CACHE_VERSION
 *   3. index.html sw.js?v=X
 *   4. functions/city/city-template.js sw.js?v=X
 */
const CACHE_VERSION = 'v13';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const MAX_DYNAMIC_ENTRIES = 100;

// 预缓存资源列表（核心路径 + 关键交互脚本 + ad-unlock权益体系模块）
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles/premium.css',
  '/styles/ad-unlock.css',
  '/js/gtz-utils.js',
  '/js/custom-cities.js',
  '/js/earth-visual.js',
  // ad-unlock 权益体系模块（12文件）
  '/js/ad-unlock/constants.js',
  '/js/ad-unlock/scene-video-map.js',
  '/js/ad-unlock/secure-storage.js',
  '/js/ad-unlock/time-calibrate.js',
  '/js/ad-unlock/fingerprint.js',
  '/js/ad-unlock/track.js',
  '/js/ad-unlock/unlock-session.js',
  '/js/ad-unlock/rights-manager.js',
  '/js/ad-unlock/checkin-manager.js',
  '/js/ad-unlock/ad-adapter.js',
  '/js/ad-unlock/ui-components.js',
  '/js/ad-unlock/index.js',
  '/favicon.svg',
  '/favicon.ico',
  '/og-default.png',
  '/manifest.json'
];

// 串行化修剪锁，防止并发trim导致超量
let trimPromise = Promise.resolve();

// --------------------------
// 安装事件：预缓存核心资源
// --------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
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
// 激活事件：清理旧版本缓存 + 修剪动态缓存
// --------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => trimDynamicCache())
      .then(() => self.clients.claim())
  );
});

// 接收页面消息：立即接管
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// --------------------------
// 工具函数：真LRU — 先删除再重插（移到队尾）
// --------------------------
async function lruPut(cache, request, response) {
  await cache.delete(request);
  await cache.put(request, response);
}

// --------------------------
// 工具函数：修剪动态缓存（串行化，真LRU淘汰最老条目）
// --------------------------
function trimDynamicCache() {
  trimPromise = trimPromise.then(async () => {
    try {
      const cache = await caches.open(DYNAMIC_CACHE);
      const keys = await cache.keys();
      if (keys.length > MAX_DYNAMIC_ENTRIES) {
        const deleteCount = keys.length - MAX_DYNAMIC_ENTRIES;
        // 队头是最早插入/最少访问的，淘汰它们
        await Promise.all(keys.slice(0, deleteCount).map(key => cache.delete(key)));
        console.log(`动态缓存修剪: 删除 ${deleteCount} 条`);
      }
    } catch (e) {
      console.warn('修剪动态缓存失败:', e);
    }
  });
  return trimPromise;
}

// --------------------------
// 请求拦截：缓存策略
// --------------------------
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // 忽略非同源请求
  if (url.origin !== self.location.origin) return;

  // 1. 静态资源：缓存优先，后台更新
  if (url.pathname.match(/\.(css|js|png|jpg|svg|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const fetchPromise = fetch(event.request).then(response => {
          if (response && response.status === 200) {
            caches.open(STATIC_CACHE).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        }).catch(() => cached || new Response('', { status: 503, statusText: 'Service Unavailable' }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  // 2. HTML页面：网络优先，失败回退缓存/离线页
  if (url.pathname.endsWith('/') || url.pathname.endsWith('.html') || event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            // 真LRU：先删后插，确保访问的条目移到队尾
            caches.open(DYNAMIC_CACHE).then(cache => lruPut(cache, event.request, response.clone()));
            trimDynamicCache();
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(cached => {
            // 离线回退：有缓存用缓存，无缓存用首页
            return cached || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 3. API：网络优先，不缓存
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(JSON.stringify({ error: 'offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // 4. i18n locale JSON: Network First + LRU
  if (url.pathname.includes('/locales/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const cloned = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => lruPut(cache, event.request, cloned));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 5. 其余请求：正常转发
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// --------------------------
// 后台同步（预留）
// --------------------------
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(Promise.resolve());
  }
});
