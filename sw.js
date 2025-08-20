// Service Worker för Sollebrunns Järnhandel PWA
const CACHE_NAME = 'jarnhandel-v1';
const urlsToCache = [
  '/index/index.html',
  '/manifest.json',
  '/logo.png',
  '/images/logo_rund.png',
  '/images/icon.png',
  '/styles/global.css',
  '/styles/navbar.css',
  '/scripts/loadNavbar.js'
];

// Install event
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('PWA Cache opened');
        return cache.addAll(urlsToCache.map(url => {
          // Handle relative URLs properly
          return new Request(url, {mode: 'no-cors'});
        })).catch(function(error) {
          console.log('Cache add failed for some resources:', error);
          // Continue anyway, don't fail the install
        });
      })
  );
});

// Fetch event
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', function(event) {
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
});
