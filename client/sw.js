/**
 * FRANKY TECH — Service Worker (Phase 29 — PWA architecture)
 * -----------------------------------------------------------
 * Scope is deliberately narrow: cache the static app SHELL
 * (HTML/CSS/JS/images) for fast repeat loads, so the interface
 * itself can appear instantly even on a flaky connection.
 *
 * Everything under /api/ is ALWAYS network-only — never cached,
 * never served stale. Invoices, payments, stock levels and
 * balances must reflect the real server state or fail honestly;
 * pretending a cached invoice total is still accurate while
 * offline would be actively misleading (per the platform rule:
 * "do not pretend financial operations work offline if they
 * require server verification").
 * -----------------------------------------------------------
 */

const CACHE_NAME = 'franky-tech-shell-v1';
const SHELL_ASSETS = [
  '/css/styles.css',
  '/css/app.css',
  '/assets/logo/icon.png',
  '/assets/logo/icon-192.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => {
      // Missing an asset shouldn't block install — the shell still
      // works, just without that one item pre-cached.
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // NEVER intercept API calls — always go to the network, always fresh.
  if (url.pathname.startsWith('/api/')) return;

  // Only handle same-origin GET requests for the shell cache.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          // Only cache successful, basic (same-origin, non-opaque) responses.
          if (response.ok && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline and not pre-cached — let it fail naturally
    })
  );
});
