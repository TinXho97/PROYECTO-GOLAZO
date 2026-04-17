const CACHE_VERSION = 'golazo-pwa-v1';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;
const APP_SHELL_URLS = ['/', '/manifest.webmanifest', '/icons/icon.svg', '/icons/maskable-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const {request} = event;

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  const url = new URL(request.url);
  const isStaticAsset =
    url.origin === self.location.origin &&
    (request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'worker' ||
      request.destination === 'manifest' ||
      request.destination === 'font');

  const isImage = request.destination === 'image';

  if (isStaticAsset || isImage) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const appShell = await caches.match('/');
    if (appShell) {
      return appShell;
    }

    throw error;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const networkResponsePromise = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || networkResponsePromise;
}
