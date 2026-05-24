// BULK MODE Service Worker — Offline-first
// CACHE_NAME مُولَّد ديناميكياً من js/version.js (مصدر وحيد للحقيقة)
importScripts('./js/version.js');
const CACHE_NAME = APP_CACHE_NAME; // مثلاً: 'bulkmode-v8-0-0'
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './css/styles.css',
  './js/version.js',
  './js/data.js',
  './js/program-data.js',
  './js/program-render.js',
  './js/program-editor.js',
  './js/session.js',
  './js/progress.js',
  './js/substitutions.js',
  './js/achievements.js',
  './js/progress-photos.js',
  './js/plate-calc.js',
  './js/reminders.js',
  './js/calendar.js',
  './js/exercise-history.js',
  './js/smart-recovery.js',
  './js/auto-backup.js',
  './js/gyms.js',
  // V9.0/V9.1/V9.2 additions
  './js/pr-detection.js',
  './js/dashboard.js',
  './js/weekly-review.js',
  './js/exercise-media.js',
  './js/program-templates.js',
  './js/foods-database.js',
  './js/nutrition.js',
  './js/smart-next-workout.js',
  './js/streak-page.js',
  './js/voice-input.js',
  './js/auto-rest.js',
  './js/app.js',
  './vendor/chart.umd.min.js',
  // V8.4 — Exercise demonstration assets (form notes modal)
  './assets/gifs/chest-press.svg',
  './assets/gifs/pectoral-fly.svg',
  './assets/gifs/shoulder-press.svg',
  './assets/gifs/delts-machine.svg',
  './assets/gifs/lat-machine.svg',
  './assets/gifs/low-row.svg',
  './assets/gifs/reverse-fly.svg',
  './assets/gifs/crossover-cables.svg',
  'https://fonts.googleapis.com/css2?family=Rubik:wght@400;600;700;800&family=Outfit:wght@400;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap'
];

// Install: precache all app-shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// V7 (#33) — استمع لـ SKIP_WAITING من العميل عشان نطبّق النسخة الجديدة فوراً
// V8 — استمع لـ SCHEDULE_REMINDER لجدولة تذكير الجلسة عبر setTimeout
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data.type === 'SCHEDULE_REMINDER') {
    const { delayMs, title, body, tag, fireAt } = event.data;
    // sanity bounds: من 0 لـ 12 ساعة
    if (typeof delayMs !== 'number' || delayMs <= 0 || delayMs > 12 * 3600 * 1000) return;
    // تفادي التكرار — لو فيه timeout سابق بنفس tag، أعد ضبطه
    if (self._reminderTimers && self._reminderTimers[tag]) {
      clearTimeout(self._reminderTimers[tag]);
    }
    if (!self._reminderTimers) self._reminderTimers = {};
    self._reminderTimers[tag] = setTimeout(() => {
      delete self._reminderTimers[tag];
      self.registration.showNotification(title || '⏰ موعد التمرين', {
        body: body || 'حان وقت التمرين',
        tag: tag || 'workout-reminder',
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png',
        requireInteraction: false,
        vibrate: [200, 100, 200],
        data: { fireAt: fireAt || Date.now(), source: 'reminder' }
      }).catch(err => console.warn('showNotification failed:', err));
    }, delayMs);
    return;
  }

  if (event.data.type === 'CANCEL_REMINDER') {
    const tag = event.data.tag;
    if (self._reminderTimers && self._reminderTimers[tag]) {
      clearTimeout(self._reminderTimers[tag]);
      delete self._reminderTimers[tag];
    }
  }
});

// V8 — نقرة على الإشعار: ركّز على نافذة موجودة أو افتح جديدة
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes(self.location.origin) && 'focus' in c) return c.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});

// Fetch strategy:
// - origin assets: cache-first with background update
// - Chart.js (jsdelivr): stale-while-revalidate (works offline after first load)
// - fonts: stale-while-revalidate
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // App-shell (same origin)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
    );
    return;
  }

  // V7 #31 — Chart.js now served locally من ./vendor (لا CDN)
  // Google Fonts — stale-while-revalidate
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const fetchPromise = fetch(event.request).then((response) => {
          if (response && response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
