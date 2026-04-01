// ShiftChef Service Worker v4
const CACHE_NAME = 'shiftchef-v4';
const OFFLINE_URL = '/offline.html';

// Assets to pre-cache on install
const PRE_CACHE_ASSETS = [
  '/offline.html',
  '/manifest.json',
];

// Install: pre-cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;
  // Always bypass cache for: API, Vite internals, source files, HMR
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/__manus__')) return;
  if (url.pathname.startsWith('/@')) return;        // Vite internals (@vite/client, @react-refresh)
  if (url.pathname.startsWith('/src/')) return;     // Source files — always fetch fresh
  if (url.pathname.startsWith('/node_modules/')) return;
  if (url.searchParams.has('v')) return;            // Vite cache-busted assets — skip SW cache

  // For navigation requests: network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // For static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});

// Handle SKIP_WAITING message from page to activate new SW immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'ShiftChef', {
      body: data.body || '',
      icon: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663450394445/5XtEwxhSav9aHUudDTD5pa/icon-192_c773814f.png',
      badge: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663450394445/5XtEwxhSav9aHUudDTD5pa/icon-192_c773814f.png',
      data: data.url || '/',
      vibrate: [100, 50, 100],
    })
  );
});

// Notification click: open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      const url = event.notification.data || '/';
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
