/* ============================================================
 * BULK MODE — Version Source of Truth
 * ============================================================
 * مصدر وحيد لرقم الإصدار. كل ملف آخر (SW, manifest, README, HTML)
 * يرجع لهنا — لا أرقام نسخ مبعثرة.
 *
 * استخدام:
 *   - في الـ DOM (window): APP_VERSION, APP_BUILD, APP_NAME, APP_TITLE
 *   - في Service Worker: importScripts('./js/version.js')
 *   - في README/CHANGELOG: نسخ يدوي عند bump
 * ============================================================ */

const APP_VERSION = '9.14.4';
const APP_BUILD   = '2026-06-01';
const APP_NAME    = 'BULK MODE';
const APP_TITLE   = 'BULK MODE V9 — برنامج التضخيم';
// CACHE_NAME المُولّد ديناميكياً (SW يستخدمه عبر importScripts)
const APP_CACHE_NAME = 'bulkmode-v' + APP_VERSION.replace(/\./g, '-');

// Expose to global (window in browser context, self in SW context)
if (typeof self !== 'undefined') {
  self.APP_VERSION = APP_VERSION;
  self.APP_BUILD = APP_BUILD;
  self.APP_NAME = APP_NAME;
  self.APP_TITLE = APP_TITLE;
  self.APP_CACHE_NAME = APP_CACHE_NAME;
}
