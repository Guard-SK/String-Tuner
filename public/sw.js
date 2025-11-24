const CACHE_NAME = 'string-tuner-cache-v2'; // bump version
const APP_SHELL = ['/', '/index.html'];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

// Activate: clean old caches
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

// Fetch: cache-first for same-origin HTTP(S) requests
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 🔑 IMPORTANT: ignore non-http(s) schemes (chrome-extension, data, etc.)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return;
  }

  // Optional but recommended: only handle same-origin
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Only cache valid, basic responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(() => {
          // Offline fallback only for navigation requests (page loads)
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          // Otherwise, just fail
          return Promise.reject(new Error('Network error and no cache.'));
        });
    }),
  );
});
