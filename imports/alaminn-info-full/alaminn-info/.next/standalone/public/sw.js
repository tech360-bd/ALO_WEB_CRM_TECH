// Alaminn.info — Service Worker
// Strategy:
//   - Precache the app shell (offline-first)
//   - Runtime cache: static assets (1y), images (7d), pages (network-first)
//   - Bypass for /api/* (always go to network)
//
// Versioned filename via cache-busting: bump SW_VERSION to invalidate.

const SW_VERSION = "alaminn-v1";
const SHELL_CACHE = `${SW_VERSION}-shell`;
const ASSET_CACHE = `${SW_VERSION}-assets`;
const IMAGE_CACHE = `${SW_VERSION}-images`;
const PAGE_CACHE = `${SW_VERSION}-pages`;

// App shell — the minimal set of files needed to render offline.
const SHELL_URLS = ["/", "/about", "/expertise", "/projects", "/contact", "/favicon.svg", "/manifest.webmanifest"];

// ── Install: precache the shell ──────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      // Best-effort precache — ignore individual failures (offline at install time etc.)
      await Promise.allSettled(SHELL_URLS.map((url) => cache.add(url)));
    })
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.startsWith(SW_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: routing strategy per request type ─────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests — let everything else pass through.
  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Never cache API requests — always go to network.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Next.js static assets — cache-first, 1-year immutable.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/brand/")) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // Images — cache-first with network fallback.
  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Navigation requests (HTML pages) — network-first, fall back to cache, then to "/".
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGE_CACHE));
    return;
  }
});

// ── Cache helpers ────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Last resort — try the cached shell
    const shell = await caches.match("/");
    return shell || Response.error();
  }
}
