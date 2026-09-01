// Pakistan Public School Kamber — Service Worker
// Simple offline + update support for the school management PWA

const CACHE_NAME = 'pps-kamber-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './app-logo.png',
  './icon-192x192.png',
  './icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network-first for HTML, cache-first for static assets
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((res) => {
        if (res.ok && (url.pathname.endsWith('.png') || url.pathname.endsWith('.js') || url.pathname.endsWith('.json') || url.pathname.endsWith('.css'))) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});

// Listen for SKIP_WAITING from the page (update banner)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
