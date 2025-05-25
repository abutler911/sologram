// public/sw.js - REPLACE YOUR ENTIRE FILE WITH THIS
const CACHE_VERSION = "v1.3.2"; // Change this with each deployment
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
  console.log("SW installing version:", CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        "/",
        "/static/js/bundle.js",
        "/static/css/main.css",
        "/manifest.json",
      ]);
    })
  );
  self.skipWaiting(); // Force immediate activation
});

self.addEventListener("activate", (event) => {
  console.log("SW activating version:", CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip external requests
  if (
    event.request.destination === "image" &&
    !url.hostname.includes("thesologram.com")
  )
    return;

  if (url.hostname.includes("cloudinary.com")) return;

  // NETWORK-FIRST for JS chunks
  if (event.request.url.endsWith(".js")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, cloned);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // CACHE-FIRST for everything else
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok && url.hostname.includes("thesologram.com")) {
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      });
    })
  );
});
