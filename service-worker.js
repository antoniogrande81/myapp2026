// MyApp Service Worker v1.2.1
const CACHE_NAME = 'myapp-v1.2.1';
const CACHE_STATIC = 'myapp-static-v1.2.1';
const CACHE_DYNAMIC = 'myapp-dynamic-v1.2.1';
const CACHE_API = 'myapp-api-v1.2.1';

// Risorse statiche da cachare sempre - STRUTTURA CORRETTA
const STATIC_CACHE_URLS = [
  '/',
  '/public/index.html',
  '/public/login.html',
  '/public/registrazione.html',
  '/public/recupero-password.html',
  '/public/convenzioni.html',
  '/public/contatti.html',
  '/public/privacy.html',
  '/public/dirigenti.html',
  '/public/strumenti.html',
  
  // App protette - CARTELLA APP CORRETTA
  '/app/home.html',
  '/app/tessera.html',
  '/app/profilo.html',
  '/app/dirigenti.html',
  '/app/notifiche.html',
  '/app/servizi.html',
  '/app/strumenti.html',
  '/app/virgilio.html',
  '/app/adimin.html',
  
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
  /tracking/,
  /supabase\.co/
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
  console.log('[SW] Installing Service Worker v1.2.1');
  
  event.waitUntil(
    (async () => {
      try {
        const staticCache = await caches.open(CACHE_STATIC);
        
        // Cache delle risorse critiche AGGIORNATE
        const criticalResources = [
          '/',
          '/public/index.html',
          '/public/login.html',
          '/app/home.html'
        ];
        
        // Cache delle risorse critiche una alla volta per evitare errori
        const cachePromises = criticalResources.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await staticCache.put(url, response);
              console.log(`[SW] Cached: ${url}`);
            }
          } catch (error) {
            console.warn(`[SW] Failed to cache: ${url}`, error);
          }
        });
        
        await Promise.allSettled(cachePromises);
        console.log('[SW] Critical resources cached');
        
        // Cache delle risorse secondarie (non bloccare l'install)
        const secondaryPromises = STATIC_CACHE_URLS.filter(url => 
          !criticalResources.includes(url)
        ).map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await staticCache.put(url, response);
            }
          } catch (error) {
            console.warn(`[SW] Failed to cache secondary resource: ${url}`);
          }
        });
        
        await Promise.allSettled(secondaryPromises);
        console.log('[SW] Secondary resources cached');
        
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
  console.log('[SW] Activating Service Worker v1.2.1');
  
  event.waitUntil(
    (async () => {
      try {
        // Cleanup vecchie cache
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('myapp-') && 
          !name.includes('v1.2.1')
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
  if (NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url.href))) {
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
    // 1. HTML Pages - Stale While Revalidate con fallback per auth
    if (request.headers.get('accept')?.includes('text/html')) {
      return await handleHtmlRequest(request);
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
 * Gestione speciale per le pagine HTML con controllo auth
 */
async function handleHtmlRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Per le pagine dell'app protetta, verifica se sono accessibili
  if (pathname.startsWith('/app/')) {
    try {
      // Prova prima la rete
      const response = await fetch(request);
      
      if (response.ok) {
        const cache = await caches.open(CACHE_STATIC);
        cache.put(request, response.clone());
        return response;
      }
      
      // Se la rete fallisce, prova la cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Se non c'è cache, redirect al login
      return Response.redirect('/public/login.html', 302);
      
    } catch (error) {
      // Errore di rete, prova la cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Fallback al login se non c'è cache
      const loginResponse = await caches.match('/public/login.html');
      return loginResponse || Response.redirect('/public/login.html', 302);
    }
  }
  
  // Per le pagine pubbliche, usa stale-while-revalidate normale
  return await staleWhileRevalidate(request, CACHE_STATIC);
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
  }).catch(() => {
    // Ignora errori di rete per stale-while-revalidate
    return null;
  });
  
  // Restituisci subito la cache se disponibile, altrimenti aspetta la rete
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
 * Limita la dimensione della cache
 */
async function limitCacheSize(cacheName, maxEntries) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxEntries) {
      const keysToDelete = keys.slice(0, keys.length - maxEntries);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
    }
  } catch (error) {
    console.warn('[SW] Failed to limit cache size:', error);
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
    
    // Per le app protette, prova il login
    if (url.pathname.startsWith('/app/')) {
      return await cache.match('/public/login.html') || 
             await cache.match('/public/index.html') ||
             new Response(`
               <!DOCTYPE html>
               <html><head><title>Offline</title></head>
               <body style="font-family: Arial; text-align: center; padding: 50px;">
                 <h1>App non disponibile offline</h1>
                 <p>Connessione richiesta per accedere all'area riservata.</p>
                 <a href="/public/index.html">Torna alla home</a>
               </body></html>
             `, { 
               status: 503, 
               headers: { 'Content-Type': 'text/html' } 
             });
    }
    
    // Per le pagine pubbliche
    return await cache.match('/offline.html') || 
           await cache.match('/public/index.html') ||
           new Response(`
             <!DOCTYPE html>
             <html><head><title>Offline</title></head>
             <body style="font-family: Arial; text-align: center; padding: 50px;">
               <h1>Connessione non disponibile</h1>
               <p>Verifica la tua connessione e riprova.</p>
             </body></html>
           `, { 
             status: 503, 
             headers: { 'Content-Type': 'text/html' } 
           });
  }
  
  // JSON API fallback
  if (request.headers.get('accept')?.includes('application/json')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'Servizio non disponibile senza connessione',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Generic fallback
  return new Response('Servizio non disponibile offline', { 
    status: 503,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Background sync per quando la connessione torna disponibile
self.addEventListener('online', () => {
  console.log('[SW] Connection restored');
  
  // Notifica ai client che la connessione è tornata
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CONNECTION_RESTORED'
      });
    });
  });
});

// Gestione messaggi dai client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME
    });
  }
});

console.log('[SW] Service Worker v1.2.1 loaded and configured');
