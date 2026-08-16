// Service Worker for Pakistan Public School Kamber — PWA
const CACHE_NAME = 'pps-kamber-v6';

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

// Fallback response shown only if there is truly nothing cached at all
// (very first-ever launch with a dead connection).
function noCacheFallback() {
  return new Response(
    '<h1>Internet Connect Karein</h1><p>Ye app pehli baar kholne ke liye internet zaroori hai.</p>',
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}

// Network-first for the app page, but with a short timeout. On weak/dead
// signal (e.g. "0.00 KB/s"), a plain fetch() can sit unresolved for a very
// long time — that is what made the app feel "stuck/hang" on open. Now we
// race the network against a 3s timer: whichever settles first wins, and
// if the network does eventually answer after the timeout, it still quietly
// updates the cache for next time instead of being wasted.
function navigateWithTimeout(req, timeoutMs = 3000) {
  return new Promise((resolve) => {
    let settled = false;

    const useCache = async () => {
      const cachedPage = await caches.match('./index.html');
      if (cachedPage) return cachedPage;
      const offline = await caches.match('./offline.html');
      return offline || noCacheFallback();
    };

    const timer = setTimeout(async () => {
      if (settled) return;
      settled = true;
      resolve(await useCache());
    }, timeoutMs);

    fetch(req).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
      if (settled) return; // timer already resolved with cache — just refreshed cache above
      settled = true;
      clearTimeout(timer);
      resolve(res);
    }).catch(async () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(await useCache());
    });
  });
}

// Fetch event — timeout-guarded network-first for navigation, cache-first for others
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.mode === 'navigate') {
    event.respondWith(navigateWithTimeout(req));
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
