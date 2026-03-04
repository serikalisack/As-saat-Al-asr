const CACHE = "islamic-smart-v2";
const FILES = [
  "/",
  "/index.html", 
  "/styles.css",
  "/script.js",
  "/manifest.json",
  "/adhan.mp3"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        if (e.request.url.includes('api.aladhan.com')) {
          return fetch(e.request).then(response => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE).then(cache => {
                cache.put(e.request, responseClone);
              });
            }
            return response;
          }).catch(() => {
            return new Response('{"error": "Offline - prayer times unavailable"}', {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        }
        
        return fetch(e.request);
      })
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});