// PrivacyFold Service Worker (Offline Capability)
const CACHE_NAME = 'privacyfold-v1.4.0';
const STATIC_ASSETS = [
  '/',
  '/fonts/fonts.css',
  '/fonts/bricolage-grotesque-latin.woff2',
  '/fonts/dm-mono-latin-400.woff2',
  '/fonts/dm-mono-latin-500.woff2',
  '/fonts/instrument-sans-latin.woff2',
  '/app-runtime.js',
  '/privacy/',
  '/terms/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Never intercept cross-origin ad scripts or external requests
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      // Offline fallback
      if (event.request.headers.get('accept')?.includes('text/html')) {
        return caches.match('/');
      }
    })
  );
});
