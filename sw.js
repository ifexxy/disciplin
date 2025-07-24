const CACHE_NAME = 'disciplin-v1';
const urlsToCache = [
  '/disciplin/',
  '/disciplin/index.html',
  '/disciplin/manifest.json'
  '/disciplin/icon-192.png',
  '/disciplin/icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});