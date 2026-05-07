/* ============================================
   BULK MODE — Service Worker
   تخزين مؤقت لتشغيل التطبيق بدون إنترنت
   ============================================ */

const CACHE_NAME = 'bulkmode-v3';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/program-data.js',
  './js/storage.js',
  './js/app.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(()=>{}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // استراتيجية: Cache first, ثم network — مع fallback
  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // تخزين موارد جوجل فونتس وغيرها بصمت
        if (res.ok && (req.url.startsWith(self.location.origin) || req.url.includes('fonts.g'))) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone)).catch(()=>{});
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
