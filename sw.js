// Service Worker for Pakistan Public School Kamber — PWA
const CACHE_NAME = 'pps-kamber-v9';

// Local (same-origin) core assets — cors mode, addAll works fine.
// IMPORTANT: every path here MUST exist at the site root exactly as
// written, or cache.addAll() fails as a whole and NONE of these files
// get cached — that was the #1 cause of the app "hanging"/breaking the
// moment the connection got slow or dropped (offline fallback silently
// had nothing to fall back to). Confirmed against the actual repo file
// listing: icon-192x192.png and icon-512x512.png sit flat at the root
// (no icons/ subfolder) — matched below.
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
  './app-logo.png',
  './offline.html'
];

// Cross-origin CDN scripts your app depends on (Firebase + QR libs).
// <script src="..."> tags request these as "no-cors", so the SW sees
// them as OPAQUE responses (status 0). Opaque responses must be cached
// with a no-cors fetch — cache.addAll() with plain URLs uses "cors" mode
// and would 200/fail depending on CORS headers, so we do these manually.
const CDN_ASSETS = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Install — cache local assets normally, cache CDN assets individually
// (no-cors) so a single failed/blocked CDN request can't fail the whole
// install. This is what makes offline mode actually reliable.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        await cache.addAll(CORE_ASSETS);
      } catch (err) {
        console.error('❌ Failed to cache local core assets:', err);
      }

      await Promise.all(CDN_ASSETS.map(async (url) => {
        try {
          const res = await fetch(url, { mode: 'no-cors' });
          await cache.put(url, res);
        } catch (err) {
          console.warn('⚠️ Could not pre-cache CDN asset:', url, err);
        }
      }));

      console.log('✅ Install caching done');
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

function noCacheFallback() {
  return new Response(
    '<h1>Internet Connect Karein</h1><p>Ye app pehli baar kholne ke liye internet zaroori hai.</p>',
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}

// Network-first for the app page, with a short timeout so a dead/very
// slow connection can't leave the page hanging — falls back to cache,
// and still quietly updates the cache if the network answer arrives late.
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
      if (settled) return;
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

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.mode === 'navigate') {
    event.respondWith(navigateWithTimeout(req));
    return;
  }

  event.respondWith(
    caches.match(req)
      .then((cached) => {
        if (cached) return cached;

        return fetch(req).then((res) => {
          // FIX: opaque cross-origin responses (status 0, from no-cors
          // <script src> requests to Firebase/CDN libs) are valid and
          // MUST be cached too, or the app silently breaks the next
          // time it's opened offline. Previously only status===200
          // (same-origin) responses were cached.
          const cacheable = res && (res.ok || res.type === 'opaque');
          if (cacheable) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        }).catch(() => undefined);
      })
      .catch(() => new Response('', { status: 504, statusText: 'Offline' }))
  );
});
