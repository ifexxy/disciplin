const CACHE_NAME = 'disciplin-v1';
const urlsToCache = [
  '/disciplin/',
  '/disciplin/index.html',
  '/disciplin/manifest.json',
  '/disciplin/icon-192.png',
  '/disciplin/icon-512.png'
  '/disciplin/app.js',
  '/disciplin/storage.js'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
