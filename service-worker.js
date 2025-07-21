// MyApp Service Worker v1.2.0
const CACHE_NAME = 'myapp-v1.2.0';
const CACHE_STATIC = 'myapp-static-v1.2.0';
const CACHE_DYNAMIC = 'myapp-dynamic-v1.2.0';
const CACHE_API = 'myapp-api-v1.2.0';

// Risorse statiche da cachare sempre
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/login.html',
  '/registrazione.html',
  '/recupero-password.html',
  '/convenzioni.html',
  '/contatti.html',
  '/privacy.html',
  '/servizi.html',
  '/dirigenti.html',
  '/strumenti.html',
  
  // App protette
  '/app/home.html',
  '/app/tessera.html',
  '/app/profilo.html',
  '/app/dirigenti.html',
  '/app/admin.html',
  
  // Assets esterni essenziali
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm',
  
  // Fallback offline
  '/offline.html'
];

// Pattern URL da cachare dinamicamente
const DYNAMIC_CACHE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /\.(?:css|js)$/,
  /\.(?:woff|woff2|ttf|eot)$/
];

// API endpoints da cachare con strategy specifiche
const API_CACHE_PATTERNS = [
  /\/api\/convenzioni/,
  /\/api\/dirigenti/,
  /\/api\/notizie/
];

// URLs da non cachare mai
const NEVER_CACHE_PATTERNS = [
  /\/api\/auth/,
  /\/api\/user/,
  /analytics/,
  /tracking/
];

// Timeout per richieste network
const NETWORK_TIMEOUT = 5000;

// Maximum cache size (numero di entries)
const MAX_CACHE_SIZE = {
  static: 50,
  dynamic: 100,
  api: 30
};

/**
 * Install Event - Cache delle risorse statiche
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v1.2.0');
  
  event.waitUntil(
    (async () => {
      try {
        const staticCache = await caches.open(CACHE_STATIC);
        
        // Cache delle risorse critiche
        const criticalResources = [
          '/',
          '/index.html',
          '/login.html',
          '/app/home.html'
        ];
        
        await staticCache.addAll(criticalResources);
        console.log('[SW] Critical resources cached');
        
        // Cache delle risorse secondarie (non bloccare l'install)
        try {
          await staticCache.addAll(STATIC_CACHE_URLS);
          console.log('[SW] All static resources cached');
        } catch (error) {
          console.warn('[SW] Some static resources failed to cache:', error);
        }
        
        // Force activation
        self.skipWaiting();
        
      } catch (error) {
        console.error('[SW] Install failed:', error);
      }
    })()
  );
});

/**
 * Activate Event - Cleanup vecchie cache
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v1.2.0');
  
  event.waitUntil(
    (async () => {
      try {
        // Cleanup vecchie cache
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('myapp-') && 
          !name.includes('v1.2.0')
        );
        
        await Promise.all(
          oldCaches.map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        
        // Take control of all pages
        await self.clients.claim();
        console.log('[SW] Service Worker activated and claimed clients');
        
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

/**
 * Fetch Event - Strategia di caching intelligente
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip URLs che non dovrebbero essere cachate
  if (NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return;
  }
  
  event.respondWith(handleFetchRequest(request));
});

/**
 * Gestisce le richieste fetch con strategia appropriata
 */
async function handleFetchRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. HTML Pages - Stale While Revalidate
    if (request.headers.get('accept')?.includes('text/html')) {
      return await staleWhileRevalidate(request, CACHE_STATIC);
    }
    
    // 2. API Calls - Network First con cache fallback
    if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await networkFirst(request, CACHE_API);
    }
    
    // 3. Static Assets - Cache First
    if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await cacheFirst(request, CACHE_DYNAMIC);
    }
    
    // 4. Supabase/External APIs - Network First con timeout
    if (url.origin !== location.origin) {
      return await networkFirstWithTimeout(request, CACHE_DYNAMIC);
    }
    
    // 5. Default - Network First
    return await networkFirst(request, CACHE_DYNAMIC);
    
  } catch (error) {
    console.warn('[SW] Fetch failed:', error);
    return await getOfflineFallback(request);
  }
}

/**
 * Strategy: Stale While Revalidate
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  return cachedResponse || networkPromise;
}

/**
 * Strategy: Network First
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      await limitCacheSize(cacheName, MAX_CACHE_SIZE.dynamic);
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Strategy: Cache First
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const response = await fetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
    await limitCacheSize(cacheName, MAX_CACHE_SIZE.dynamic);
  }
  
  return response;
}

/**
 * Strategy: Network First con timeout
 */
async function networkFirstWithTimeout(request, cacheName) {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
    );
    
    const response = await Promise.race([
      fetch(request),
      timeoutPromise
    ]);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Fallback offline per richieste fallite
 */
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // HTML fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    const cache = await caches.open(CACHE_STATIC);
    return await cache.match('/offline.html') || 
           await cache.match('/') ||
           new Response('Offline - Connessione non disponibile', { status: 503 });
  }
  
  // JSON API fallback
  if (request.headers.get('accept')?.includes('application/json')) {
    return new Response(
      JSON.stringify({
        error: 'Offline