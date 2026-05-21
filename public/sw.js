const CACHE_NAME = "datum-v1";
const ASSETS_TO_CACHE = [
  "./",
  "index.html",
  "manifest.json",
  "icon-72.png",
  "icon-96.png",
  "icon-128.png",
  "icon-144.png",
  "icon-152.png",
  "icon-180.png",
  "icon-192.png",
  "icon-384.png",
  "icon-512.png",
  "screenshot-narrow.jpg",
  "screenshot-wide.jpg"
];

// Install Event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("Caching initial shell assets carefully");
      // Cache files individually to prevent one 404 from breaking the whole PWA installation
      for (const asset of ASSETS_TO_CACHE) {
        try {
          await cache.add(asset);
          console.log(`Successfully cached: ${asset}`);
        } catch (err) {
          console.warn(`Could not cache asset ${asset} on install:`, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Clearing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event with Dynamic Caching support
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Avoid handling or caching chrome-extension paths or non-http/https schemes
  if (!event.request.url.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache successful local requests dynamically (Vite-bundled assets, fonts, etc.)
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.origin === self.location.origin)
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        // Fallback offline handler for layout routing
        if (event.request.mode === "navigate") {
          return caches.match(event.request).then((response) => {
            if (response) return response;
            return caches.open(CACHE_NAME).then((cache) => {
              return cache.keys().then((keys) => {
                const fallback = keys.find(k => k.url.endsWith("/index.html") || k.url.endsWith("/"));
                return fallback ? cache.match(fallback) : undefined;
              });
            });
          });
        }
        console.warn("Fetch failed for resource:", event.request.url, err);
      });
    })
  );
});
