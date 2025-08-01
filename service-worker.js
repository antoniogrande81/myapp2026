// MyApp Service Worker – Versione PWA v1.5
const CACHE_NAME = 'myapp-cache-v1.5';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/login.html',
  '/app/home.html',
  '/app/home_dirigenti.html',
  '/app/tessera.html',
  '/app/profilo.html',
  '/app/strumenti.html',
  '/app/virgilio.html',
  '/app/notifiche.html',
  '/app/servizi.html',
  '/convenzioni.html',
  '/dirigenti.html',
  '/contatti.html',
  '/area-riservata.html',
  '/Area%20Dirigenti.html', // 🔧 FIX: URL encode degli spazi
  '/manifest.json',
  '/public/icons/icon-192x192.png', // 🔧 FIX: Percorso corretto
  '/public/icons/icon-512x512.png',
  '/public/icons/apple-touch-icon.png',
  '/public/icons/favicon-16x16.png',
  '/public/icons/favicon-32x32.png',
  '/favicon.ico',
  '/offline.html'
];

const NEVER_CACHE = [
  /\/login/i,
  /\/logout/i,
  /\/session/i,
  /\/token/i,
  /supabase/,
  /\/app\/virgilio\.html/,
  /\/api\//,
  /cdn\.tailwindcss\.com/,
  /cdn\.jsdelivr\.net/,
  /cdnjs\.cloudflare\.com/
];

// INSTALL
self.addEventListener('install', (event) => {
  console.log('[SW] Install v1.5');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // 🔧 FIX: Gestione corretta degli errori
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                } else {
                  console.warn(`[SW] File non trovato: ${url} (${response.status})`);
                  return Promise.resolve();
                }
              })
              .catch(error => {
                // 🚨 FIX: Qui era il problema del NaN
                console.warn(`[SW] File non trovato: ${url} (404)`);
                return Promise.resolve();
              })
          )
        );
      })
      .then(() => {
        console.log('[SW] Cache popolata con successo');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Errore durante install:', error);
      })
  );
});

// ACTIVATE
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate v1.5');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Eliminazione cache obsoleta:', key);
          return caches.delete(key);
        })
      )
    ).then(() => {
      console.log('[SW] Cache obsolete eliminate');
      return self.clients.claim();
    })
  );
});

// FETCH - 🔧 FIX: Gestione errori migliorata
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip caching per richieste non GET o URL esclusi
  if (request.method !== 'GET' || NEVER_CACHE.some((p) => p.test(url.pathname))) {
    return;
  }

  // Skip caching per richieste esterne (CDN, API, etc.)
  if (!request.url.startsWith(location.origin)) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache solo risposte OK
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, cloned);
          });
        } else if (response.status === 404) {
          // 🔧 FIX: Log corretto per 404
          console.warn(`[SW] File non trovato: ${request.url} (404)`);
        }
        return response;
      })
      .catch((error) => {
        // 🔧 FIX: Log errore di rete
        console.warn(`[SW] Errore fetch: ${request.url} - ${error.message}`);
        return caches.match(request).then((res) => res || offlineFallback(request));
      })
  );
});

// Fallback per contenuti offline
async function offlineFallback(request) {
  const url = new URL(request.url);
  
  // Per pagine HTML, mostra la pagina offline
  if (request.headers.get('accept')?.includes('text/html')) {
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    
    // Fallback HTML minimo se offline.html non è disponibile
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
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
          }
          .container { 
            background: white; 
            color: #333; 
            padding: 2rem; 
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔌 Offline</h1>
          <p>MyApp non è disponibile offline.</p>
          <p>Controlla la connessione internet e riprova.</p>
          <button onclick="window.location.reload()">🔄 Riprova</button>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // Per altri tipi di richieste
  return new Response('', { 
    status: 503, 
    statusText: 'Service Unavailable - Offline' 
  });
}

// Gestione messaggi dal client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker v1.5 caricato');
