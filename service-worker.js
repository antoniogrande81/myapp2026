// 🚀 MyApp Service Worker v2.0.0 - VERSIONE INTELLIGENTE
// Gestisce correttamente login, autenticazione e routing

const CACHE_VERSION = 'myapp-v2.0.0';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_API = `${CACHE_VERSION}-api`;

// Timeout per richieste di rete
const NETWORK_TIMEOUT = 8000;

// Risorse essenziali da cachare (NON includere pagine di login/auth)
const ESSENTIAL_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  
  // Pagine pubbliche
  '/convenzioni.html',
  '/contatti.html',
  '/privacy.html',
  '/dirigenti.html',
  
  // CSS/JS esterni critici
  'https://cdn.tailwindcss.com',
  
  // Manifest e icone
  '/manifest.json'
];

// Pattern delle pagine dell'app protetta
const PROTECTED_PAGES = [
  /\/app\//,
  /\/login/,
  /\/registrazione/,
  /\/recupero/
];

// Pattern API da NON cachare MAI (autenticazione sensibile)
const NEVER_CACHE_PATTERNS = [
  /\/auth\//,
  /supabase\.co.*\/auth\//,
  /supabase\.co.*\/rest\/v1\/rpc/,
  /googleapis\.com/,
  /analytics/,
  /tracking/,
  /login/,
  /logout/,
  /signin/,
  /signup/
];

// Pattern richieste che devono sempre andare in rete
const NETWORK_FIRST_PATTERNS = [
  /\.json$/,
  /\/api\//,
  /supabase\.co/,
  /cdn\.jsdelivr\.net/
];

/**
 * Install Event - Cache delle risorse essenziali
 */
self.addEventListener('install', (event) => {
  console.log('[SW v2.0] Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_STATIC);
        
        // Cache solo le risorse essenziali che sicuramente esistono
        const safeResources = [
          '/',
          '/index.html',
          '/manifest.json'
        ];
        
        // Prova a cachare le risorse una per volta
        for (const resource of safeResources) {
          try {
            await cache.add(resource);
            console.log(`[SW v2.0] Cached: ${resource}`);
          } catch (error) {
            console.warn(`[SW v2.0] Failed to cache ${resource}:`, error);
          }
        }
        
        // Forza attivazione immediata
        self.skipWaiting();
        console.log('[SW v2.0] Installation completed');
        
      } catch (error) {
        console.error('[SW v2.0] Installation failed:', error);
      }
    })()
  );
});

/**
 * Activate Event - Pulizia cache vecchie
 */
self.addEventListener('activate', (event) => {
  console.log('[SW v2.0] Activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Rimuovi cache vecchie
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('myapp-') && 
          !name.includes('v2.0.0')
        );
        
        await Promise.all(
          oldCaches.map(cacheName => {
            console.log(`[SW v2.0] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
        
        // Prendi controllo di tutte le pagine
        await self.clients.claim();
        console.log('[SW v2.0] Activated and claimed clients');
        
      } catch (error) {
        console.error('[SW v2.0] Activation failed:', error);
      }
    })()
  );
});

/**
 * Fetch Event - Strategia intelligente
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip richieste non-GET
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip protocolli non-HTTP
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // 🚫 NEVER CACHE - Sempre rete per autenticazione
  if (shouldNeverCache(url, request)) {
    console.log(`[SW v2.0] NEVER CACHE: ${url.pathname}`);
    return; // Lascia che il browser gestisca normalmente
  }
  
  // 🔐 PROTECTED PAGES - Strategia speciale per app area
  if (isProtectedPage(url)) {
    event.respondWith(handleProtectedPage(request));
    return;
  }
  
  // 🌐 NETWORK FIRST - API e contenuti dinamici
  if (shouldUseNetworkFirst(url, request)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // 📄 STATIC ASSETS - Cache first per risorse statiche
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // 🏠 HTML PAGES - Stale while revalidate
  if (isHTMLPage(request)) {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }
  
  // Default: Network first con timeout
  event.respondWith(networkFirstWithTimeout(request));
});

/**
 * Gestione speciale per pagine protette (area app/)
 */
async function handleProtectedPage(request) {
  const url = new URL(request.url);
  
  console.log(`[SW v2.0] Handling protected page: ${url.pathname}`);
  
  try {
    // Per le pagine dell'app, sempre network first
    const response = await networkFirstWithTimeout(request);
    
    // Se la risposta è OK, cachela per offline
    if (response.ok) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(request, response.clone());
    }
    
    return response;
    
  } catch (error) {
    console.log(`[SW v2.0] Protected page offline, checking cache: ${url.pathname}`);
    
    // Se offline, prova la cache
    const cache = await caches.open(CACHE_DYNAMIC);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se non in cache, redirect alla home o offline page
    if (url.pathname.includes('/app/')) {
      return Response.redirect('/', 302);
    }
    
    return getOfflinePage();
  }
}

/**
 * Network First Strategy - Per API e contenuti dinamici
 */
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);
    
    // Cache solo risposte OK
    if (response.ok && request.url.includes('supabase')) {
      const cache = await caches.open(CACHE_API);
      // Cache per un tempo limitato
      cache.put(request, response.clone());
      
      // Limita dimensione cache API
      setTimeout(() => limitCacheSize(CACHE_API, 50), 1000);
    }
    
    return response;
    
  } catch (error) {
    // Fallback su cache per API non critiche
    if (!request.url.includes('/auth/')) {
      const cache = await caches.open(CACHE_API);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log(`[SW v2.0] Using cached API response: ${request.url}`);
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

/**
 * Cache First Strategy - Per assets statici
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_STATIC);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Aggiorna in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {
      // Ignora errori di update in background
    });
    
    return cachedResponse;
  }
  
  // Non in cache, fetch dalla rete
  const response = await fetch(request);
  
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

/**
 * Stale While Revalidate - Per pagine HTML
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_DYNAMIC);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background per aggiornare
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cachedResponse);
  
  // Ritorna cache se disponibile, altrimenti aspetta la rete
  return cachedResponse || networkPromise;
}

/**
 * Network First con timeout
 */
async function networkFirstWithTimeout(request) {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
    );
    
    const response = await Promise.race([
      fetch(request),
      timeoutPromise
    ]);
    
    return response;
    
  } catch (error) {
    console.log(`[SW v2.0] Network failed for ${request.url}, trying cache`);
    
    const cache = await caches.open(CACHE_DYNAMIC);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultima risorsa: offline page
    return getOfflinePage();
  }
}

/**
 * Utility Functions
 */
function shouldNeverCache(url, request) {
  return NEVER_CACHE_PATTERNS.some(pattern => 
    pattern.test(url.href) || pattern.test(url.pathname)
  );
}

function isProtectedPage(url) {
  return PROTECTED_PAGES.some(pattern => pattern.test(url.pathname));
}

function shouldUseNetworkFirst(url, request) {
  return NETWORK_FIRST_PATTERNS.some(pattern => 
    pattern.test(url.href) || pattern.test(url.pathname)
  );
}

function isStaticAsset(url) {
  return /\.(css|js|jpg|png|svg|ico|woff|woff2)$/i.test(url.pathname);
}

function isHTMLPage(request) {
  return request.headers.get('accept')?.includes('text/html');
}

async function getOfflinePage() {
  const cache = await caches.open(CACHE_STATIC);
  const offlinePage = await cache.match('/offline.html');
  
  if (offlinePage) {
    return offlinePage;
  }
  
  // Fallback offline page
  return new Response(`
    <!DOCTYPE html>
    <html><head><title>Offline</title><style>
    body{background:linear-gradient(135deg,#2400C1,#8E008C);color:white;
    font-family:Arial;text-align:center;padding:2rem;min-height:100vh;
    display:flex;align-items:center;justify-content:center;}
    .card{background:rgba(255,255,255,0.1);padding:2rem;border-radius:15px;}
    </style></head><body>
    <div class="card">
    <h1>📱 MyApp</h1>
    <h2>Sei offline</h2>
    <p>Verifica la connessione e riprova</p>
    <button onclick="location.reload()">🔄 Riprova</button>
    </div></body></html>
  `, {
    status: 503,
    headers: { 'Content-Type': 'text/html' }
  });
}

async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Rimuovi le voci più vecchie
    const oldKeys = keys.slice(0, keys.length - maxSize);
    await Promise.all(oldKeys.map(key => cache.delete(key)));
    console.log(`[SW v2.0] Cache ${cacheName} limited to ${maxSize} entries`);
  }
}

/**
 * Message handler per comunicazione con l'app
 */
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (data && data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  
  if (data && data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW v2.0] All caches cleared');
}

console.log('✅ MyApp Service Worker v2.0.0 loaded - Smart caching with auth protection');
