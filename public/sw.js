// RIVO Touchpoint Service Worker
// Version: rivo-pwa-v1

const CACHE_NAME = 'rivo-pwa-v1';

// Risorse statiche chiave da pre-cachare all'installazione
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/brand/rivo-icon.png',
  '/brand/rivo-logo.png',
  '/brand/rivo-mark.png',
];

// 1. INSTALL EVENT: Pre-cache delle risorse chiave e skipWaiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Pre-caching resiliente (non interrompe l'installazione se una singola risorsa fallisce)
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn('[SW] Pre-cache fallback warning for:', url, err);
          }
        })
      );
      return self.skipWaiting();
    })
  );
});

// 2. ACTIVATE EVENT: Pulizia vecchie cache e claim immediato dei client
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Rimozione vecchia cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Helper: Strategia Network-First con fallback alla cache
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Prova il match anche senza parametri di query
    const url = new URL(request.url);
    const cleanMatch = await cache.match(url.origin + url.pathname);
    if (cleanMatch) {
      return cleanMatch;
    }
    throw error;
  }
}

// Helper: Strategia Stale-While-Revalidate per asset statici
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (
        networkResponse &&
        (networkResponse.status === 200 || networkResponse.type === 'opaque')
      ) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((err) => {
      // In caso di errore di rete silenzioso in background, restituiamo comunque la cache se presente
      return null;
    });

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  throw new Error(`[SW] Asset non disponibile offline: ${request.url}`);
}

// 3. FETCH EVENT: Routing differenziato in base alla risorsa
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora schemi non HTTP/HTTPS (es. chrome-extension://, data:, blob:)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // A. Gestione API (/api/*)
  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'POST' || request.method !== 'GET') {
      // Mutazioni POST/PUT/DELETE: Network-Only senza cache
      event.respondWith(fetch(request));
      return;
    }
    // Richieste GET ad /api/*: Network-First con fallback a cache
    event.respondWith(networkFirst(request));
    return;
  }

  // B. Le mutazioni non-GET per qualsiasi endpoint non vanno mai in cache
  if (request.method !== 'GET') {
    return;
  }

  // C. Navigazioni HTML per ospiti (/hub/*, /call/*) o navigazioni di documento generiche
  const isGuestRoute =
    url.pathname.startsWith('/hub/') ||
    url.pathname.startsWith('/call/') ||
    url.pathname === '/hub' ||
    url.pathname === '/call';

  const isNavigation =
    request.mode === 'navigate' ||
    (request.headers.get('accept') &&
      request.headers.get('accept').includes('text/html'));

  if (isGuestRoute || isNavigation) {
    event.respondWith(networkFirst(request));
    return;
  }

  // D. Asset statici (_next/static, immagini, font, css, icone, Google fonts)
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/brand/') ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com' ||
    /\.(?:js|css|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/i.test(
      url.pathname
    );

  if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // E. Altre richieste GET generiche: Network-First con fallback cache
  event.respondWith(networkFirst(request));
});

// 4. SYNC EVENT: Sveglia la coda outbox per le chiamate di servizio
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-service-calls') {
    event.waitUntil(
      (async () => {
        console.log('[SW] Background sync attivato: sync-service-calls');
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        for (const client of clients) {
          client.postMessage({
            type: 'SYNC_OUTBOX',
            tag: 'sync-service-calls',
            timestamp: Date.now(),
          });
        }
      })()
    );
  }
});

// 5. MESSAGE EVENT: Controllo runtime (es. skipWaiting su richiesta)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
