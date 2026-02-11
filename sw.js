// Service Worker för Sollebrunns Järnhandel PWA
const CACHE_NAME = 'jarnhandel-v2.2.0.11';
const CACHE_VERSION = '2.2.0.11';

// Core files that should always be cached
const CORE_CACHE = [
  '/l-nksida/',
  '/l-nksida/index/index.html',
  '/l-nksida/index/login.html',
  '/l-nksida/offline.html',
  '/l-nksida/manifest.json',
  '/l-nksida/logo.png',
  '/l-nksida/images/logo_rund.png',
  '/l-nksida/images/logo_rund_utan_räv.png',
  '/l-nksida/styles/global.css',
  '/l-nksida/styles/navbar.css',
  '/l-nksida/styles/date_time.css',
  '/l-nksida/styles/login.css',
  '/l-nksida/scripts/loadNavbar.js',
  '/l-nksida/scripts/clock.js',
  '/l-nksida/scripts/script.js',
  '/l-nksida/navbar/navbar.html'
];

// Install event - cache core resources
self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[Service Worker] Caching core files');
        // Cache files individually to avoid failing entire install
        return Promise.allSettled(
          CORE_CACHE.map(url => {
            return cache.add(url).catch(err => {
              console.log('[Service Worker] Failed to cache:', url, err);
            });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Core files cached');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Fetch event - Network First, fallback to Cache, then Offline page
self.addEventListener('fetch', function(event) {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Special handling for navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful navigation responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Show offline page if no cache
              return caches.match('/l-nksida/offline.html');
            });
        })
    );
    return;
  }
  
  // For CSS and JS files: Network First (so changes load immediately)
  if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request);
        })
    );
    return;
  }
  
  // For other requests (images, etc): Cache First, fallback to Network
  event.respondWith(
    caches.match(request)
      .then(function(cachedResponse) {
        if (cachedResponse) {
          // Return cached version and update cache in background
          fetch(request)
            .then(response => {
              if (response.ok) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put(request, response);
                });
              }
            })
            .catch(() => {}); // Ignore network errors for background updates
          
          return cachedResponse;
        }
        
        // Not in cache, fetch from network
        return fetch(request)
          .then(response => {
            // Cache successful responses
            if (response.ok && request.url.startsWith('http')) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Fetch failed:', request.url, error);
            throw error;
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            // Delete old caches
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        return self.clients.claim(); // Take control of all pages immediately
      })
  );
});

// Message event - handle manual cache updates
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            console.log('[Service Worker] Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});

// Log service worker errors
self.addEventListener('error', function(event) {
  console.error('[Service Worker] Error:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('[Service Worker] Unhandled rejection:', event.reason);
});
