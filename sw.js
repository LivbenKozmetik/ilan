// Basic service worker: caches shell assets and offline fallback (very simple)
const CACHE = 'ilan-site-v1';
const ASSETS = [
  '/', '/index.html', '/styles.css', '/scripts.js', '/manifest.json',
  '/data/listings.json', '/icons/icon-192.png', '/icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/'))));
});