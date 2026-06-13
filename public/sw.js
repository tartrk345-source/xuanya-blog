const CACHE_NAME = 'x2ya-v3';
const STATIC_ASSETS = [
  '/',
  '/blog',
  '/manifest.json',
  '/images/logo.webp',
  '/images/favicon.svg',
];

// 安装时缓存关键静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // 静态资源缓存失败不影响 SW 安装
      });
    })
  );
  self.skipWaiting();
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 请求策略：静态资源优先缓存，API 请求走网络
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 不缓存 Supabase API 请求
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // 不缓存 GitHub API 请求
  if (url.hostname.includes('github.com') || url.hostname.includes('gist.githubusercontent.com')) {
    return;
  }

  // 静态资源：Cache First
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/images/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML 页面：Network First，失败时回退缓存
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }
});
