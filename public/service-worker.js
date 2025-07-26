// MyApp Service Worker – Versione PWA v1.4
const CACHE_NAME = 'myapp-cache-v1.4';

const STATIC_CACHE_URLS = [
  '/',
  '/app/home.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

const NEVER_CACHE = [
  /\/login/i,
  /\/logout/i,
  /\/session/i,
  /\/token/i,
  /supabase/,
  /\/app\/virgilio\.html/,
  /\/api\//
];

// INSTALL
self.addEventListener('install', (event) => {
  console.log('[SW] Install v1.4');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || NEVER_CACHE.some((p) => p.test(url.pathname))) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (response.ok && request.url.startsWith(location.origin)) {
            cache.put(request, cloned);
          }
        });
        return response;
      })
      .catch(() =>
        caches.match(request).then((res) => res || offlineFallback(request))
      )
  );
});

// Fallback
async function offlineFallback(request) {
  if (request.headers.get('accept')?.includes('text/html')) {
    return caches.match('/offline.html');
  }
  return new Response('', { status: 503, statusText: 'Offline' });
}
