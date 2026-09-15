// ALO Education — PWA Service Worker — Web-based yet native app-like on mobile
// Version: 1.0.0 — 2026-09-16
// Features: offline shell, cache-first for static, network-first for API, background sync, push notification ready

const CACHE_VERSION = 'alo-education-v1-20260916';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install — cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' }))).catch(() => {
        // Fail silently if offline page not available — don't block install
        return cache.addAll(['/','/manifest.json']);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k.startsWith('alo-education-v') && k !== STATIC_CACHE && k !== DYNAMIC_CACHE).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET, chrome extensions, etc
  if (req.method !== 'GET') return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // API — network first, fallback to cache, then offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).then((res) => {
        // Cache successful GET API responses for offline use (short-lived)
        if (res.ok && req.method === 'GET') {
          const clone = res.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(req, clone)).catch(()=>{});
        }
        return res;
      }).catch(() => {
        return caches.match(req).then(cached => cached || Response.json({ error: 'Offline — cached data unavailable', offline: true }, { status: 503 }));
      })
    );
    return;
  }

  // Static assets — cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$/)) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) {
          // Update in background
          fetch(req).then(res => {
            if (res.ok) caches.open(STATIC_CACHE).then(c => c.put(req, res)).catch(()=>{});
          }).catch(()=>{});
          return cached;
        }
        return fetch(req).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then(c => c.put(req, clone)).catch(()=>{});
          }
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Navigation — network first, fallback to cache, then offline page
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(DYNAMIC_CACHE).then(c => c.put(req, clone)).catch(()=>{});
        return res;
      }).catch(() => {
        return caches.match(req).then(cached => cached || caches.match(OFFLINE_URL).then(off => off || caches.match('/')));
      })
    );
    return;
  }

  // Default — network first with cache fallback
  event.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(DYNAMIC_CACHE).then(c => c.put(req, clone)).catch(()=>{});
      }
      return res;
    }).catch(() => caches.match(req))
  );
});

// Background Sync — for offline lead creation, messages, etc
self.addEventListener('sync', (event) => {
  if (event.tag === 'alo-sync-leads') {
    event.waitUntil(syncLeads());
  }
  if (event.tag === 'alo-sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncLeads() {
  // Placeholder — real implementation would read IndexedDB queue and POST to /api/crm/leads
  console.log('[SW] Background sync leads');
}

async function syncMessages() {
  console.log('[SW] Background sync messages');
}

// Push Notifications — ready for future
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'ALO Education', body: 'New update available' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'ALO Education', {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const url = event.notification.data.url || '/';
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Message — skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
