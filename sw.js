// Pakistan Public School Kamber — Service Worker
// Strong automatic update support for installed PWAs

const CACHE_NAME = 'pps-kamber-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './app-logo.png',
  './icon-192x192.png',
  './icon-512x512.png',
  './sw.js'
];

// Install: cache core assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches + take control of all open clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - HTML / navigation → network-first (so new deploys appear quickly)
// - static assets → stale-while-revalidate (fast + eventually fresh)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Same-origin only
  if (url.origin !== self.location.origin) return;

  const isHTML = event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname.endsWith('/');

  if (isHTML) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((r) => r || caches.match('./index.html'))
        )
    );
    return;
  }

  // Stale-while-revalidate for images, js, json, css
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((res) => {
            if (res && res.ok) {
              cache.put(event.request, res.clone()).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    )
  );
});

// Allow page to force activation of waiting worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
