// Disciplin Service Worker
// Version: 3.7.5 - Update this when making changes

const CACHE_NAME = 'disciplin-v3.7.5';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// Notification messages for reminders
const notificationMessages = [
    "Time to check in with your progress! ”9Ú4",
    "Remember your goals - how are you doing today? ”9Á3", 
    "Your streak is waiting for you to log today's progress! ”9æ7",
    "Stay consistent - check in with Disciplin now! ”9Ý4",
    "Don't break the chain - log your daily progress! 7·3„1‚5"
];

self.addEventListener('install', function(event) {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
    // Force the waiting service worker to become active
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Claim control of all clients
    return self.clients.claim();
});

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Return cached version or fetch from network
                if (response) {
                    return response;
                }
                return fetch(event.request).then(function(response) {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Clone the response for caching
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(function(cache) {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
    );
});

// Background sync for notifications (if supported)
self.addEventListener('sync', function(event) {
    if (event.tag === 'disciplin-reminder') {
        event.waitUntil(sendReminderNotification());
    }
});

// Handle messages from the main thread
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Push notification handler
self.addEventListener('push', function(event) {
    if (event.data) {
        const notificationData = event.data.json();
        event.waitUntil(
            self.registration.showNotification(notificationData.title, {
                body: notificationData.body,
                icon: notificationData.icon || getDefaultIcon(),
                badge: getDefaultBadge(),
                tag: 'disciplin-reminder',
                requireInteraction: false
            })
        );
    }
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // Focus or open the app when notification is clicked
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(function(clientList) {
                // If app is already open, focus it
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url.includes('disciplin') && 'focus' in client) {
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
    const randomMessage = notificationMessages[Math.floor(Math.random() * notificationMessages.length)];
    
    const notificationOptions = {
        body: randomMessage,
        icon: getDefaultIcon(),
        badge: getDefaultBadge(),
        tag: 'disciplin-reminder',
        requireInteraction: false,
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'dismiss', 
                title: 'Dismiss'
            }
        ]
    };

    return self.registration.showNotification('Disciplin', notificationOptions);
}

// Helper function to get default icon
function getDefaultIcon() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiM0RjQ2RTUiLz4KPHN2ZyB4PSI0OCIgeT0iNDgiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtOSAxMiAyIDIgNC00Ii8+CjxwYXRoIGQ9Im0yMSAyMS0xLTFhNy43NCA3Ljc0IDAgMCAwIDAtMTBsMS0xYTEgMSAwIDAgMCAwLTEuNDFsLTUtNWExIDEgMCAwIDAtMS40MSAwbC0xIDFhNy43NCA3Ljc0IDAgMCAwLTEwIDBsLTEtMWExIDEgMCAwIDAtMS40MSAwbC01IDVhMSAxIDAgMCAwIDAgMS40MWwxIDFhNy43NCA3Ljc0IDAgMCAwIDAgMTBsLTEgMWExIDEgMCAwIDAgMCAxLjQxbDUgNWExIDEgMCAwIDAgMS40MSAwbDEtMWE3Ljc0IDcuNzQgMCAwIDAgMTAgMGwxIDFhMSAxIDAgMCAwIDEuNDEgMGw1LTVhMSAxIDAgMCAwIDAtMS40MVoiLz4KPC9zdmc+Cjwvc3ZnPg==';
}

// Helper function to get default badge
function getDefaultBadge() {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcyIiBoZWlnaHQ9IjcyIiByeD0iMTIiIGZpbGw9IiM0RjQ2RTUiLz4KPHN2ZyB4PSIxOCIgeT0iMTgiIHdpZHRoPSIzNiIgaGVpZ2h0PSIzNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtOSAxMiAyIDIgNC00Ii8+CjxwYXRoIGQ9Im0yMSAyMS0xLTFhNy43NCA3Ljc0IDAgMCAwIDAtMTBsMS0xYTEgMSAwIDAgMCAwLTEuNDFsLTUtNWExIDEgMCAwIDAtMS40MSAwbC0xIDFhNy43NCA3Ljc0IDAgMCAwLTEwIDBsLTEtMWExIDEgMCAwIDAtMS40MSAwbC01IDVhMSAxIDAgMCAwIDAgMS40MWwxIDFhNy43NCA3Ljc0IDAgMCAwIDAgMTBsLTEgMWExIDEgMCAwIDAgMCAxLjQxbDUgNWExIDEgMCAwIDAgMS40MSAwbDEtMWE3Ljc0IDcuNzQgMCAwIDAgMTAgMGwxIDFhMSAxIDAgMCAwIDEuNDEgMGw1LTVhMSAxIDAgMCAwIDAtMS40MVoiLz4KPC9zdmc+Cjwvc3ZnPg==';
}
