// public/sw.js - Simple, working service worker
const CACHE_NAME = "sologram-v1748703270830"; // This gets replaced at build time
const DYNAMIC_CACHE = "sologram-dynamic-v1748703270830";

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/static/css/main.css",
  "/static/js/main.js",
  "/manifest.json",
  "/favicon.ico",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing version:", CACHE_NAME);

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS.filter(Boolean));
      })
      .then(() => {
        console.log("[SW] Static assets cached, taking control");
        return self.skipWaiting(); // Force activation
      })
      .catch((err) => {
        console.error("[SW] Install failed:", err);
      })
  );
});

// Activate event - clean old caches and take control
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating version:", CACHE_NAME);

  event.waitUntil(
    Promise.all([
      // Delete all old caches
      caches.keys().then((cacheNames) => {
        const deletePromises = cacheNames
          .filter(
            (cacheName) =>
              cacheName.startsWith("sologram-") &&
              cacheName !== CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE
          )
          .map((cacheName) => {
            console.log("[SW] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          });

        return Promise.all(deletePromises);
      }),

      // Take control of all clients immediately
      self.clients.claim(),
    ]).then(() => {
      console.log("[SW] Activated and controlling all pages");

      // Force refresh all open tabs
      return self.clients.matchAll({ type: "window" }).then((clients) => {
        clients.forEach((client) => {
          console.log("[SW] Refreshing client:", client.url);
          client.postMessage({
            type: "FORCE_REFRESH",
            version: CACHE_NAME,
          });
        });
      });
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip external URLs
  if (url.origin !== location.origin) return;

  // Skip API calls - always go to network
  if (url.pathname.startsWith("/api/")) return;

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  try {
    // For HTML pages - Network first with cache fallback
    if (request.destination === "document" || url.pathname === "/") {
      try {
        const networkResponse = await fetch(request, {
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });

        if (networkResponse.ok) {
          // Cache the fresh HTML
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }
      } catch (networkError) {
        console.log("[SW] Network failed, trying cache");
      }

      // Fallback to cache
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Last resort - return root page
      return caches.match("/") || new Response("Offline", { status: 503 });
    }

    // For static assets - Cache first with network fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Not in cache, fetch from network
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Request failed:", error);

    // Try to return something useful
    if (request.destination === "document") {
      const fallback = await caches.match("/");
      return fallback || new Response("Offline", { status: 503 });
    }

    return new Response("Not available offline", { status: 503 });
  }
}

// Message handling for forced refresh
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] Received skip waiting message");
    self.skipWaiting();
  }
});
