const CACHE = 'clawtner-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) return; // don't cache API calls
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
