// Phonics Flash Service Worker
// Caches the app shell for offline use. Does NOT cache API responses.

const CACHE_NAME = 'phonics-flash-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
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

// Fetch: network-first for navigation, cache-first for assets
// NEVER cache /api/ responses
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation requests: network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Only cache same-origin, successful responses
        if (
          response.ok &&
          url.origin === self.location.origin &&
          !url.pathname.startsWith('/api/')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
