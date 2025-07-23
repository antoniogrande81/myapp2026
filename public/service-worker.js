// MyApp Service Worker – Versione Aggiornata v1.3.1
const CACHE_NAME = 'myapp-simple-v1.3.1';

// Risorse statiche essenziali (AGGIORNATO con strumenti.html)
const STATIC_CACHE_URLS = [
  '/',
  '/public/index.html',
  '/public/strumenti.html',
  '/offline.html'
];

// URLs da NON cachare MAI
const NEVER_CACHE_PATTERNS = [
  /\/public\/login\.html/,
  /\/app\//,
  /\/api\/auth/,
  /supabase\.co/,
  /\.auth\./,
  /auth/,
  /login/,
  /logout/,
  /session/,
  /token/
];

/* ------------------------------------------------------------------ */
/* 1. INSTALL                                                           */
/* ------------------------------------------------------------------ */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v1.3.1');

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(STATIC_CACHE_URLS.filter(Boolean));
        console.log('[SW] Cache populated');
        self.skipWaiting();
      } catch (error) {
        console.warn('[SW] Install failed:', error);
        // NON chiamiamo skipWaiting() in caso di errore
      }
    })()
  );
});

/* ------------------------------------------------------------------ */
/* 2. ACTIVATE                                                         */
/* ------------------------------------------------------------------ */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v1.3.1');

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(
        (name) => name.startsWith('myapp-') && name !== CACHE_NAME
      );

      await Promise.all(
        oldCaches.map((cacheName) => {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );

      await self.clients.claim();
      console.log('[SW] Activated');
    })()
  );
});

/* ------------------------------------------------------------------ */
/* 3. FETCH                                                            */
/* ------------------------------------------------------------------ */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Salta tutto ciò che non è GET
  if (request.method !== 'GET') return;

  // Salta protocolli non-HTTP
  if (!url.protocol.startsWith('http')) return;

  // Salta URL critici
  const shouldSkip = NEVER_CACHE_PATTERNS.some(
    (pattern) =>
      pattern.test(url.href) ||
      pattern.test(url.pathname) ||
      pattern.test(request.url)
  );

  if (shouldSkip) {
    console.log('[SW] Skipping cache for:', url.pathname);
    return; // Lascia passare la richiesta senza intercettarla
  }

  // Network-first per tutto il resto
  event.respondWith(handleRequest(request));
});

/* ------------------------------------------------------------------ */
/* 4. GESTIONE RICHIESTE                                               */
/* ------------------------------------------------------------------ */
async function handleRequest(request) {
  const url = new URL(request.url);

  try {
    const response = await fetch(request);

    // Cache solo HTML pubblici che non contengono “login”
    if (
      response.ok &&
      request.headers.get('accept')?.includes('text/html') &&
      url.pathname.startsWith('/public/') &&
      !url.pathname.includes('login')
    ) {
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

    // Solo per HTML prova la cache
    if (request.headers.get('accept')?.includes('text/html')) {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      if (cached) return cached;

      // Fallback solo per la homepage
      if (url.pathname === '/' || url.pathname === '/public/index.html') {
        const offline = await cache.match('/offline.html');
        if (offline) return offline;
      }

      // HTML di fallback inline
      return new Response(
        `
        <!DOCTYPE html>
        <html lang="it">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Offline – MyApp</title>
          <style>
            body{
              font-family:Arial,Helvetica,sans-serif;background:linear-gradient(135deg,#2400C1,#8E008C);
              color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;
            }
            .box{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);padding:40px;border-radius:15px;text-align:center}
            button{background:#fff;color:#2400C1;border:none;padding:12px 24px;border-radius:8px;font-weight:bold;margin-top:20px;cursor:pointer}
          </style>
        </head>
        <body>
          <div class="box">
            <h1>🔌 Connessione Assente</h1>
            <p>Non è possibile caricare la pagina senza connessione internet.</p>
            <button onclick="location.reload()">🔄 Riprova</button>
            <button onclick="location.href='/public/index.html'">🏠 Home</button>
          </div>
        </body>
        </html>
        `,
        {
          status: 503,
          headers: { 'Content-Type': 'text/html' }
        }
      );
    }

    // Per richieste non-HTML fallisce
    throw networkError;
  }
}

/* ------------------------------------------------------------------ */
/* 5. MESSAGGI & DEBUG                                                */
/* ------------------------------------------------------------------ */
self.addEventListener('message', (event) => {
  console.log('[SW] Message:', event.data);

  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
      event.ports[0]?.postMessage({ success: true });
    });
  }
});

// Debug utility
self.debugServiceWorker = () => {
  console.log('🔍 Service Worker Debug Info:');
  console.log('- Version:', CACHE_NAME);
  console.log('- Registration:', self.registration);
  caches.keys().then((names) => console.log('- Active caches:', names));
};

console.log('✅ Service Worker v1.3.1 pronto');