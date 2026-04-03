const CACHE_NAME = "islamic-smart-v3";
const STATIC_CACHE = "static-v3";
const DYNAMIC_CACHE = "dynamic-v3";
const API_CACHE = "api-v3";

// Cache URLs
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/launchericon-48x48.png",
  "/icons/launchericon-72x72.png",
  "/icons/launchericon-96x96.png",
  "/icons/launchericon-144x144.png",
  "/adhan.mp3"
];

// API endpoints to cache
const API_ENDPOINTS = [
  "https://api.aladhan.com/v1/timings",
  "https://api.aladhan.com/v1/gToHCalendar",
  "https://api.aladhan.com/v1/qibla"
];

// Cache strategies
const CACHE_STRATEGIES = {
  STATIC: 'cache-first',
  API: 'network-first',
  DYNAMIC: 'stale-while-revalidate'
};

// Install event - cache static assets
self.addEventListener("install", event => {
  console.log("Service Worker: Installing");
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("Service Worker: Static assets cached");
        return self.skipWaiting();
      })
      .catch(error => {
        console.error("Service Worker: Failed to cache static assets:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", event => {
  console.log("Service Worker: Activating");
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log("Service Worker: Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Handle different request types
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache strategy implementations
function cacheFirst(request) {
  return caches.match(request)
    .then(response => {
      if (response) {
        return response;
      }
      return fetch(request)
        .then(response => {
          if (response.ok) {
            return cacheResponse(STATIC_CACHE, request, response);
          }
          return response;
        });
    });
}

function networkFirst(request) {
  return fetch(request)
    .then(response => {
      if (response.ok) {
        return cacheResponse(API_CACHE, request, response.clone());
      }
      return response;
    })
    .catch(() => {
      return caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          // Return offline fallback for API requests
          return new Response(
            JSON.stringify({
              error: "Offline - Prayer times unavailable",
              message: "Please check your internet connection",
              offline: true
            }), 
            {
              status: 503,
              statusText: "Service Unavailable",
              headers: { 'Content-Type': 'application/json' }
            }
          );
        });
    });
}

function staleWhileRevalidate(request) {
  return caches.match(request)
    .then(response => {
      const fetchPromise = fetch(request)
        .then(networkResponse => {
          if (networkResponse.ok) {
            return cacheResponse(DYNAMIC_CACHE, request, networkResponse.clone());
          }
          return networkResponse;
        });
      
      // Return cached version immediately, revalidate in background
      return response || fetchPromise;
    });
}

// Helper functions
function isStaticAsset(request) {
  return request.destination === 'script' ||
         request.destination === 'style' ||
         request.destination === 'image' ||
         request.destination === 'font' ||
         STATIC_ASSETS.some(asset => request.url.includes(asset));
}

function isAPIRequest(request) {
  return API_ENDPOINTS.some(endpoint => request.url.includes(endpoint)) ||
         request.url.includes('api.aladhan.com');
}

function cacheResponse(cacheName, request, response) {
  return caches.open(cacheName)
    .then(cache => {
      cache.put(request, response);
      return response;
    });
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-prayer-times') {
    event.waitUntil(syncPrayerTimes());
  }
});

function syncPrayerTimes() {
  // Refresh prayer times when back online
  return fetch('https://api.aladhan.com/v1/timings?refresh=true')
    .then(response => response.json())
    .then(data => {
      // Store in IndexedDB for when app loads
      storePrayerTimes(data);
    })
    .catch(error => {
      console.error('Background sync failed:', error);
    });
}

// Push notification support
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Time for prayer!',
    icon: '/icons/icon-192.png',
    badge: '/icons/launchericon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/launchericon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/launchericon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('As-saat | Al-asr', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    // Force cache update
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// IndexedDB helper for storing prayer times
function storePrayerTimes(data) {
  // This would be implemented with IndexedDB
  // For now, just log it
  console.log('Prayer times stored for offline use:', data);
}
