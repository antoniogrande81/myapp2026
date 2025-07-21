// MyApp Service Worker - Versione Semplificata v1.3.0
const CACHE_NAME = 'myapp-simple-v1.3.0';

// Solo risorse statiche essenziali
const STATIC_CACHE_URLS = [
  '/',
  '/public/index.html',
  '/offline.html'
];

// URLs da NON cachare MAI (importante per evitare problemi)
const NEVER_CACHE_PATTERNS = [
  /\/public\/login\.html/,           // Non cachare login
  /\/app\//,                         // Non cachare app protette
  /\/api\/auth/,                     // Non cachare API auth
  /supabase\.co/,                    // Non cachare Supabase
  /\.auth\./,                        // Non cachare auth endpoints
  /auth/,                            // Non cachare percorsi auth
  /login/,                           // Non cachare login
  /logout/,                          // Non cachare logout
  /session/,                         // Non cachare sessioni
  /token/                            // Non cachare token
];

/**
 * Install Event - Cache minimo essenziale
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Simple Service Worker v1.3.0');
  
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Cache solo la homepage e offline
        await cache.addAll([
          '/',
          '/public/index.html'
        ].filter(url => url));
        
        console.log('[SW] Essential resources cached');
        self.skipWaiting();
        
      } catch (error) {
        console.warn('[SW] Install failed, continuing anyway:', error);
        self.skipWaiting();
      }
    })()
  );
});

/**
 * Activate Event - Cleanup
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Simple Service Worker v1.3.0');
  
  event.waitUntil(
    (async () => {
      try {
        // Cleanup vecchie cache
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('myapp-') && 
          name !== CACHE_NAME
        );
        
        await Promise.all(
          oldCaches.map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        
        await self.clients.claim();
        console.log('[SW] Simple Service Worker activated');
        
      } catch (error) {
        console.warn('[SW] Activation warning:', error);
      }
    })()
  );
});

/**
 * Fetch Event - Strategia ultra-semplice
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension e altri protocolli
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // ⚠️ IMPORTANTE: Skip URLs critiche per evitare problemi
  const shouldSkip = NEVER_CACHE_PATTERNS.some(pattern => {
    const shouldMatch = pattern.test(url.href) || 
                       pattern.test(url.pathname) || 
                       pattern.test(request.url);
    
    if (shouldMatch) {
      console.log('[SW] Skipping cache for:', url.pathname);
    }
    
    return shouldMatch;
  });
  
  if (shouldSkip) {
    // Passa direttamente alla rete senza cache
    return;
  }
  
  // Per tutto il resto, usa una strategia network-first molto semplice
  event.respondWith(handleRequest(request));
});

/**
 * Gestione richieste semplificata
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Prova sempre la rete prima
    const response = await fetch(request);
    
    // Se è una pagina HTML pubblica e la risposta è ok, cachala
    if (response.ok && 
        request.headers.get('accept')?.includes('text/html') &&
        url.pathname.startsWith('/public/') &&
        !url.pathname.includes('login')) {
      
      try {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      } catch (cacheError) {
        console.warn('[SW] Cache put failed:', cacheError);
      }
    }
    
    return response;
    
  } catch (networkError) {
    console.log('[SW] Network failed for:', url.pathname);
    
    // Solo per pagine HTML, prova la cache
    if (request.headers.get('accept')?.includes('text/html')) {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', url.pathname);
        return cachedResponse;
      }
      
      // Fallback offline solo per homepage
      if (url.pathname === '/' || url.pathname === '/public/index.html') {
        const offlineResponse = await cache.match('/offline.html');
        if (offlineResponse) {
          return offlineResponse;
        }
      }
      
      // Fallback HTML semplice
      return new Response(`
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Offline - MyApp</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: linear-gradient(135deg, #2400C1, #8E008C);
              color: white;
              min-height: 100vh;
              margin: 0;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .container {
              background: rgba(255,255,255,0.1);
              padding: 30px;
              border-radius: 15px;
              backdrop-filter: blur(10px);
              max-width: 400px;
              margin: 0 auto;
            }
            button {
              background: white;
              color: #2400C1;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
              margin-top: 20px;
            }
            button:hover {
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔌 Connessione Assente</h1>
            <p>Non è possibile caricare la pagina senza connessione internet.</p>
            <button onclick="location.reload()">🔄 Riprova</button>
            <button onclick="location.href='/public/index.html'">🏠 Home</button>
          </div>
        </body>
        </html>
      `, {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    // Per richieste non-HTML, fallisce semplicemente
    throw networkError;
  }
}

/**
 * Gestione messaggi
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

/**
 * Background sync quando la connessione torna
 */
self.addEventListener('online', () => {
  console.log('[SW] Connection restored');
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'CONNECTION_RESTORED'
      });
    });
  });
});

// Funzione di debug
self.debugServiceWorker = () => {
  console.log('🔍 Service Worker Debug Info:');
  console.log('- Version:', CACHE_NAME);
  console.log('- Registration:', self.registration);
  console.log('- Clients count:', self.clients.matchAll().then(c => c.length));
  
  caches.keys().then(names => {
    console.log('- Active caches:', names);
  });
};

console.log('✅ Simple Service Worker v1.3.0 loaded');
