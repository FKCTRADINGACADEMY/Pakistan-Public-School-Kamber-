// Service Worker for Pakistan Public School Kamber — PWA
const CACHE_NAME = 'pps-kamber-v5';

// Relative paths — work whether the site is hosted at root or in a subfolder
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './offline.html'
];

// Listen for message from page to skip waiting and activate immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install event — cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Caching core assets...');
        return cache.addAll(CORE_ASSETS);
      })
      .catch((err) => {
        console.error('❌ Failed to cache assets:', err);
      })
  );
  self.skipWaiting();
});

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event — network-first for navigation, cache-first for others
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // For navigation (HTML pages) — try network first, fallback to cached index.html,
  // and if nothing at all is cached yet, show the friendly offline page instead of
  // a raw browser/404 error.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Cache the response for offline use
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, clone);
          });
          return res;
        })
        .catch(() => {
          // If offline, serve cached index.html, else the friendly offline page
          return caches.match('./index.html')
            .then((cached) => cached || caches.match('./offline.html'))
            .then((fallback) => fallback || new Response(
              '<h1>Internet Connect Karein</h1><p>Ye app pehli baar kholne ke liye internet zaroori hai.</p>',
              { status: 200, headers: { 'Content-Type': 'text/html' } }
            ));
        })
    );
    return;
  }

  // For other assets — cache-first, fallback to network
  event.respondWith(
    caches.match(req)
      .then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(req).then((res) => {
          // Cache any new valid responses
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, clone);
            });
          }
          return res;
        });
      })
      .catch(() => {
        // If completely offline and nothing cached
        return new Response('', { status: 504, statusText: 'Offline' });
      })
  );
});
