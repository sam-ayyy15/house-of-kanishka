/* House of Kanishka service worker.
   One job: when a page can't be fetched because the visitor is offline, show the branded
   offline page instead of the browser's dinosaur. Nothing else is cached, so the shop is
   never served stale (prices, stock and bag always come from the network). */
const VERSION = 'v1';
const CACHE = `hok-offline-${VERSION}`;
const OFFLINE = '/offline.html';
const FILES = [
  OFFLINE,
  '/fonts/instrument-serif.woff2',
  '/fonts/instrument-serif-italic.woff2',
  '/fonts/mrs-saint-delafield.woff2',
  '/fonts/inter.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hok-offline-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages: network as usual; if it can't be reached, the offline page.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE).then((res) => res || Response.error())),
    );
    return;
  }

  // The offline page's own fonts, so it looks right with no network.
  if (url.pathname.startsWith('/fonts/')) {
    event.respondWith(caches.match(req).then((res) => res || fetch(req)));
  }
});
