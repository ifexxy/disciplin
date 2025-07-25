const CACHE_NAME = 'disciplin-v1.0.0';
const STATIC_CACHE_NAME = 'disciplin-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'disciplin-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/disciplin',
  '/index.html',
  '/manifest.json',
  '/icon-72.png',
  '/icon-96.png',
  '/icon-128.png',
  '/icon-144.png',
  '/icon-152.png',
  '/icon-192.png',
  '/icon-384.png',
  '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(function(cache) {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(function() {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.log('[ServiceWorker] Cache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', function(event) {
  const requestUrl = new URL(event.request.url);
  
  // Handle same-origin requests
  if (requestUrl.origin === location.origin) {
    // For HTML requests, try cache first, then network
    if (event.request.headers.get('accept').includes('text/html')) {
      event.respondWith(
        caches.match(event.request)
          .then(function(cachedResponse) {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            return fetch(event.request)
              .then(function(networkResponse) {
                // Cache the response for future use
                if (networkResponse.status === 200) {
                  const responseClone = networkResponse.clone();
                  caches.open(DYNAMIC_CACHE_NAME)
                    .then(function(cache) {
                      cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
              })
              .catch(function() {
                // If network fails and no cache, return offline page
                return caches.match('/');
              });
          })
      );
      return;
    }
    
    // For other resources, try cache first
    event.respondWith(
      caches.match(event.request)
        .then(function(cachedResponse) {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(function(networkResponse) {
              // Cache successful responses
              if (networkResponse.status === 200) {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE_NAME)
                  .then(function(cache) {
                    cache.put(event.request, responseClone);
                  });
              }
              return networkResponse;
            });
        })
        .catch(function() {
          console.log('[ServiceWorker] Fetch failed for:', event.request.url);
        })
    );
  }
});

// Background sync for offline data
self.addEventListener('sync', function(event) {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-entries') {
    event.waitUntil(
      // Handle any pending offline data sync here
      Promise.resolve()
    );
  }
});

// Push notification support (for future features)
self.addEventListener('push', function(event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Disciplin';
  const message = data.message || 'Keep up your streak!';
  const icon = data.icon || '/icon-192.png';
  const badge = data.badge || '/icon-72.png';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: message,
      icon: icon,
      badge: badge,
      data: data,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'View App',
          icon: '/icon-96.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.matchAll().then(function(clientList) {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle message from main thread
self.addEventListener('message', function(event) {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Periodic background sync (for future features)
self.addEventListener('periodicsync', function(event) {
  if (event.tag === 'daily-reminder') {
    event.waitUntil(
      // Handle daily reminder logic here
      Promise.resolve()
    );
  }
});

// Error handling
self.addEventListener('error', function(event) {
  console.error('[ServiceWorker] Error:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('[ServiceWorker] Unhandled promise rejection:', event.reason);
});

console.log('[ServiceWorker] Service Worker loaded successfully');
