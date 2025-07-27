// Disciplin Service Worker
// Update this version when making changes to trigger cache updates
const CACHE_VERSION = '1.4.0';
const CACHE_NAME = `disciplin-v${CACHE_VERSION}`;

// Files to cache
const urlsToCache = [
    './',
    './index.html',
    // Add any other static assets here if you have them
    // './manifest.json', // Not needed since it's inline
];

// Install event - cache resources
self.addEventListener('install', function(event) {
    console.log('Service Worker installing, version:', CACHE_VERSION);
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(function() {
                // Force the waiting service worker to become active
                return self.skipWaiting();
            })
            .catch(function(error) {
                console.error('Cache installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
    console.log('Service Worker activating, version:', CACHE_VERSION);
    
    event.waitUntil(
        caches.keys()
            .then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        // Delete any cache that doesn't match current version
                        if (cacheName.startsWith('disciplin-v') && cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(function() {
                // Claim control of all clients immediately
                return self.clients.claim();
            })
            .catch(function(error) {
                console.error('Cache cleanup failed:', error);
            })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', function(event) {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests (analytics, etc.)
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(function(cachedResponse) {
                // If we have a cached version, return it
                if (cachedResponse) {
                    // For HTML files, also try to fetch from network to check for updates
                    if (event.request.destination === 'document') {
                        // Fetch from network in background to update cache
                        fetch(event.request)
                            .then(function(networkResponse) {
                                if (networkResponse && networkResponse.status === 200) {
                                    const responseClone = networkResponse.clone();
                                    caches.open(CACHE_NAME)
                                        .then(function(cache) {
                                            cache.put(event.request, responseClone);
                                        });
                                }
                            })
                            .catch(function() {
                                // Network failed, but we have cache
                            });
                    }
                    return cachedResponse;
                }

                // No cached version, try network
                return fetch(event.request)
                    .then(function(networkResponse) {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clone the response before caching
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(function(error) {
                        console.error('Fetch failed:', error);
                        
                        // If this is a navigation request and we're offline,
                        // return the cached index.html
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                        
                        throw error;
                    });
            })
    );
});

// Background sync for notifications (if supported)
self.addEventListener('sync', function(event) {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'disciplin-reminder') {
        event.waitUntil(sendReminderNotification());
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
    console.log('Notification clicked');
    
    event.notification.close();

    // Focus or open the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                // If app is already open, focus it
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes(self.location.origin)) {
                        return client.focus();
                    }
                }
                
                // If app is not open, open it
                if (clients.openWindow) {
                    return clients.openWindow('./');
                }
            })
    );
});

// Function to send reminder notification
function sendReminderNotification() {
    const notificationMessages = [
        "Time to check in with your progress! 💪",
        "Remember your goals - how are you doing today? 🎯",
        "Your streak is waiting for you to log today's progress! 🔥",
        "Stay consistent - check in with Disciplin now! 📈",
        "Don't break the chain - log your daily progress! ⛓️"
    ];

    const randomMessage = notificationMessages[Math.floor(Math.random() * notificationMessages.length)];

    const notificationOptions = {
        body: randomMessage,
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiM0RjQ2RTUiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtOSAxMiAyIDIgNC00Ii8+CjxwYXRoIGQ9Im0yMSAyMS0xLTFhNy43NCA3Ljc0IDAgMCAwIDAtMTBsMS0xYTEgMSAwIDAgMCAwLTEuNDFsLTUtNWExIDEgMCAwIDAtMS40MSAwbC0xIDFhNy43NCA3Ljc0IDAgMCAwLTEwIDBsLTEtMWExIDEgMCAwIDAtMS40MSAwbC01IDVhMSAxIDAgMCAwIDAgMS40MWwxIDFhNy43NCA3Ljc0IDAgMCAwIDAgMTBsLTEgMWExIDEgMCAwIDAgMCAxLjQxbDUgNWExIDEgMCAwIDAgMS40MSAwbDEtMWE3Ljc0IDcuNzQgMCAwIDAgMTAgMGwxIDFhMSAxIDAgMCAwIDEuNDEgMGw1LTVhMSAxIDAgMCAwIDAtMS40MVoiLz4KPC9zdmc+Cjwvc3ZnPg==',
        badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcyIiBoZWlnaHQ9IjcyIiByeD0iMTIiIGZpbGw9IiM0RjQ2RTUiLz4KPHN2ZyB4PSIxOCIgeT0iMTgiIHdpZHRoPSIzNiIgaGVpZ2h0PSIzNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtOSAxMiAyIDIgNC00Ii8+CjxwYXRoIGQ9Im0yMSAyMS0xLTFhNy43NCA3Ljc0IDAgMCAwIDAtMTBsMS0xYTEgMSAwIDAgMCAwLTEuNDFsLTUtNWExIDEgMCAwIDAtMS40MSAwbC0xIDFhNy43NCA3Ljc0IDAgMCAwLTEwIDBsLTEtMWExIDEgMCAwIDAtMS40MSAwbC01IDVhMSAxIDAgMCAwIDAgMS40MWwxIDFhNy43NCA3Ljc0IDAgMCAwIDAgMTBsLTEgMWExIDEgMCAwIDAgMCAxLjQxbDUgNWExIDEgMCAwIDAgMS40MSAwbDEtMWE3Ljc0IDcuNzQgMCAwIDAgMTAgMGwxIDFhMSAxIDAgMCAwIDEuNDEgMGw1LTVhMSAxIDAgMCAwIDAtMS40MVoiLz4KPC9zdmc+Cjwvc3ZnPg==',
        tag: 'disciplin-reminder',
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'open',
                title: 'Open App',
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0ibTkgMTIgMiAyIDQtNCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0yMSAyMS0xLTFhNy43NCA3Ljc0IDAgMCAwIDAtMTBsMS0xYTEgMSAwIDAgMCAwLTEuNDFsLTUtNWExIDEgMCAwIDAtMS40MSAwbC0xIDFhNy43NCA3Ljc0IDAgMCAwLTEwIDBsLTEtMWExIDEgMCAwIDAtMS40MSAwbC01IDVhMSAxIDAgMCAwIDAgMS40MWwxIDFhNy43NCA3Ljc0IDAgMCAwIDAgMTBsLTEgMWExIDEgMCAwIDAgMCAxLjQxbDUgNWExIDEgMCAwIDAgMS40MSAwbDEtMWE3Ljc0IDcuNzQgMCAwIDAgMTAgMGwxIDFhMSAxIDAgMCAwIDEuNDEgMGw1LTVhMSAxIDAgMCAwIDAtMS40MVoiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4K'
            }
        ]
    };

    return self.registration.showNotification('Disciplin', notificationOptions);
}

// Handle notification action clicks
self.addEventListener('notificationactionclick', function(event) {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(function(clientList) {
                    for (let i = 0; i < clientList.length; i++) {
                        const client = clientList[i];
                        if (client.url.includes(self.location.origin)) {
                            return client.focus();
                        }
                    }
                    if (clients.openWindow) {
                        return clients.openWindow('./');
                    }
                })
        );
    }
});

// Handle push notifications (if you want to add server-sent notifications later)
self.addEventListener('push', function(event) {
    console.log('Push notification received');
    
    let notificationData = {
        title: 'Disciplin',
        body: 'You have a new reminder!',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiM0RjQ2RTUiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtOSAxMiAyIDIgNC00Ii8+CjxwYXRoIGQ9Im0yMSAyMS0xLTFhNy43NCA3Ljc0IDAgMCAwIDAtMTBsMS0xYTEgMSAwIDAgMCAwLTEuNDFsLTUtNWExIDEgMCAwIDAtMS40MSAwbC0xIDFhNy43NCA3Ljc0IDAgMCAwLTEwIDBsLTEtMWExIDEgMCAwIDAtMS40MSAwbC01IDVhMSAxIDAgMCAwIDAgMS40MWwxIDFhNy43NCA3Ljc0IDAgMCAwIDAgMTBsLTEgMWExIDEgMCAwIDAgMCAxLjQxbDUgNWExIDEgMCAwIDAgMS40MSAwbDEtMWE3Ljc0IDcuNzQgMCAwIDAgMTAgMGwxIDFhMSAxIDAgMCAwIDEuNDEgMGw1LTVhMSAxIDAgMCAwIDAtMS40MVoiLz4KPC9zdmc+Cjwvc3ZnPg=='
    };

    if (event.data) {
        try {
            const pushData = event.data.json();
            notificationData = { ...notificationData, ...pushData };
        } catch (e) {
            console.error('Error parsing push data:', e);
        }
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: 'disciplin-push',
            requireInteraction: false
        })
    );
});

// Log service worker lifecycle events for debugging
self.addEventListener('message', function(event) {
    console.log('Service Worker received message:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});

// Handle errors
self.addEventListener('error', function(event) {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
    console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded, version:', CACHE_VERSION);
