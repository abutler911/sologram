// public/OneSignalSDKWorker.js

// Import OneSignal's service worker first
importScripts("https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js");

// Cache name for PWA
const CACHE_NAME = "sologram-v1";

// Assets to cache on install
const urlsToCache = [
  "/",
  "/index.html",
  "/static/css/main.chunk.css",
  "/static/js/main.chunk.js",
  "/static/js/bundle.js",
  "/static/js/vendors~main.chunk.js",
  "/manifest.json",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
];

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[PWA] Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error("[PWA] Cache open failed:", error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("[PWA] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  // Skip OneSignal API requests to avoid interfering with notification delivery
  if (event.request.url.includes("onesignal.com")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return the response from cache
      if (response) {
        return response;
      }

      // Clone the request because it's a one-time use stream
      const fetchRequest = event.request.clone();

      return fetch(fetchRequest).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // Clone the response because it's a one-time use stream
        const responseToCache = response.clone();

        // Don't cache API requests to avoid stale data
        if (!event.request.url.includes("/api/")) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      });
    })
  );
});

// Message event - handle SKIP_WAITING message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[PWA] Received SKIP_WAITING message");
    self.skipWaiting();
  }
});
