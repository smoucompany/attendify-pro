/* ================================================================
   ATTENDIFY PRO — Service Worker
   Strategy:
     • Static assets  → Cache First (instant offline)
     • CDN libraries  → Stale-While-Revalidate (cached after first load)
     • API calls      → Network First → offline queue
   ================================================================ */

const VERSION   = 'attendify-v28';
const CDN_CACHE = 'attendify-cdn-v28';
const API_CACHE = 'attendify-api-v28';

// كل الملفات الثابتة المطلوب تخزينها عند التثبيت
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/employee.html',
  '/css/app.css',
  '/css/pro-ui.css',
  '/css/fonts.css',
  '/js/app.js',
  '/js/data.js',
  '/js/supabase.js',
  '/js/config.js',
  '/js/i18n.js',
  '/js/utils.js',
  '/js/whatsapp.js',
  '/js/biometrics.js',
  '/js/modules/dashboard.js',
  '/js/modules/attendance.js',
  '/js/modules/employees.js',
  '/js/modules/leaves.js',
  '/js/modules/requests.js',
  '/js/modules/payroll.js',
  '/js/modules/deductions.js',
  '/js/modules/loans.js',
  '/js/modules/gratuity.js',
  '/js/modules/shifts.js',
  '/js/modules/departments.js',
  '/js/modules/roles.js',
  '/js/modules/reports.js',
  '/js/modules/notifications.js',
  '/js/modules/settings.js',
  '/js/modules/gps.js',
  '/js/modules/audit.js',
  '/js/modules/profile.js',
  '/assets/icon.svg',
  '/manifest.json',
  '/font/arabic/thmanyahsans-Regular.otf',
  '/font/arabic/thmanyahsans-Bold.otf',
  '/font/arabic/thmanyahsans-Medium.otf',
  '/font/arabic/thmanyahsans-Light.otf',
];

// مكتبات CDN الخارجية — تُخزَّن عند أول استخدام
const CDN_ORIGINS = [
  'cdnjs.cloudflare.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
];

// ── INSTALL: تخزين كل الملفات الثابتة ──────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION).then(cache => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(() => {
            // تجاهل الملفات التي فشل تحميلها (مثل الخطوط)
          })
        )
      );
    })
  );
});

// ── ACTIVATE: حذف الكاشات القديمة ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== VERSION && k !== CDN_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: استراتيجية التخزين ───────────────────────────────────
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // تجاهل طلبات غير HTTP
  if (!url.protocol.startsWith('http')) return;

  // ── API calls: Network First → Cache Fallback ──────────────
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(req));
    return;
  }

  // ── CDN: Stale-While-Revalidate ────────────────────────────
  if (CDN_ORIGINS.some(o => url.hostname.includes(o))) {
    event.respondWith(staleWhileRevalidate(req, CDN_CACHE));
    return;
  }

  // ── index.html & employee.html: Network First (always get latest login logic)
  if (url.pathname === '/' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/employee.html')) {
    event.respondWith(networkFirstHtml(req));
    return;
  }

  // ── Static assets: Cache First ─────────────────────────────
  event.respondWith(cacheFirst(req));
});

// ── Network First for HTML pages (always latest login/auth logic) ──
async function networkFirstHtml(req) {
  try {
    const resp = await fetch(req);
    if (resp && resp.status === 200) {
      const cache = await caches.open(VERSION);
      cache.put(req, resp.clone());
    }
    return resp;
  } catch {
    const cached = await caches.match(req);
    return cached || new Response('Offline', { status: 503 });
  }
}

// ── Cache First ──────────────────────────────────────────────────
async function cacheFirst(req) {
  const cached = await caches.match(req, { ignoreSearch: false });
  if (cached) return cached;
  try {
    const resp = await fetch(req);
    if (resp && resp.status === 200) {
      const cache = await caches.open(VERSION);
      cache.put(req, resp.clone());
    }
    return resp;
  } catch {
    // إذا فشل الجلب ولا يوجد كاش → offline fallback
    const fallback = await caches.match('/index.html');
    return fallback || new Response('غير متصل بالإنترنت', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// ── Stale While Revalidate ───────────────────────────────────────
async function staleWhileRevalidate(req, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(req);

  const fetchPromise = fetch(req).then(resp => {
    if (resp && resp.status === 200) cache.put(req, resp.clone());
    return resp;
  }).catch(() => null);

  return cached || fetchPromise;
}

// ── Network First for API ────────────────────────────────────────
async function networkFirstApi(req) {
  try {
    const resp = await fetch(req.clone());
    // خزّن GET responses فقط
    if (req.method === 'GET' && resp && resp.status === 200) {
      const cache = await caches.open(API_CACHE);
      cache.put(req, resp.clone());
    }
    return resp;
  } catch {
    // Offline — رجّع آخر response مخزّنة
    if (req.method === 'GET') {
      const cached = await caches.match(req, { cacheName: API_CACHE });
      if (cached) return cached;
    }
    return new Response(
      JSON.stringify({ error: 'أنت غير متصل بالإنترنت — البيانات محلية فقط', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Background Sync: إرسال العمليات المعلّقة عند عودة الإنترنت ──
self.addEventListener('sync', event => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: 'SYNC_NOW' }));
}

// ── رسالة من الصفحة ──────────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();

  if (event.data?.type === 'CACHE_VERSION') {
    event.source?.postMessage({ type: 'VERSION', version: VERSION });
  }
});
