const CACHE_NAME = 'string-tuner-cache-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/string-tuner-icon-512.png',
  '/favicon.svg',
  '/manifest.json',
  '/src/assets/main.css',
  // add your built JS/CSS files here after build
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
          return null;
        }),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Optional: don’t handle cross-origin requests
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback only for navigations
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return Promise.reject(new Error('Network error and no cache.'));
        });
    }),
  );
});
