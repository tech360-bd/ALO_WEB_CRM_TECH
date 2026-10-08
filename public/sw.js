// Cache only public assets. Never cache API data, documents or portal HTML.
const STATIC_CACHE = 'alo-education-v2-20261009-static';
const OFFLINE_URL = '/offline';
const STATIC_ASSETS = [OFFLINE_URL, '/manifest.json', '/icons/icon-192x192.png', '/icons/icon-512x512.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC_CACHE).then(async cache => {
    await Promise.allSettled(STATIC_ASSETS.map(url => cache.add(new Request(url, { cache: 'reload' }))));
    await self.skipWaiting();
  }));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('alo-education-v') && key !== STATIC_CACHE).map(key => caches.delete(key)),
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(async () =>
      (await caches.match(OFFLINE_URL)) || new Response('You are offline. Reconnect to continue.', { status: 503 }),
    ));
    return;
  }
  const immutable = url.pathname.startsWith('/_next/static/');
  const publicAsset = /^\/(images|icons)\//.test(url.pathname) || STATIC_ASSETS.includes(url.pathname);
  if (!immutable && !publicAsset) return;
  event.respondWith((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(req);
    if (immutable && cached) return cached;
    try {
      const response = await fetch(req);
      if (response.ok && response.type !== 'opaque' && !/private|no-store/i.test(response.headers.get('Cache-Control') || '')) {
        await cache.put(req, response.clone());
      }
      return response;
    } catch { return cached || new Response('Asset unavailable offline', { status: 503 }); }
  })());
});
self.addEventListener('push', event => {
  let data = { title: 'ALO Education', body: 'You have a new notification', url: '/' };
  try { data = { ...data, ...event.data?.json() }; } catch { /* readable defaults */ }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body, icon: '/icons/icon-192x192.png', badge: '/icons/icon-72x72.png', data: { url: data.url },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/', self.location.origin);
  if (target.origin !== self.location.origin) target.href = self.location.origin;
  event.waitUntil(self.clients.matchAll({ type: 'window' }).then(async windows => {
    const existing = windows.find(client => client.url === target.href);
    return existing ? existing.focus() : self.clients.openWindow(target.href);
  }));
});
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
