// public/sw.js - Smart runtime versioning
async function generateCacheVersion() {
  try {
    // Try to fetch a small file that changes with each build
    const response = await fetch("/static/js/bundle.js", {
      method: "HEAD",
      cache: "no-cache",
    });

    // Use ETag or Last-Modified as version identifier
    const etag = response.headers.get("etag");
    const lastModified = response.headers.get("last-modified");

    if (etag) {
      return `v-${etag.replace(/[^a-zA-Z0-9]/g, "")}`;
    } else if (lastModified) {
      return `v-${new Date(lastModified).getTime()}`;
    }

    // Fallback to a simple hash of current time (only changes on restart)
    return `v-${Date.now().toString(36)}`;
  } catch (error) {
    console.warn("Failed to generate version, using fallback");
    return `v-${Date.now().toString(36)}`;
  }
}

// Initialize version on service worker startup
let CACHE_VERSION = null;
let STATIC_CACHE = null;
let DYNAMIC_CACHE = null;

async function initializeCache() {
  if (!CACHE_VERSION) {
    CACHE_VERSION = await generateCacheVersion();
    STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
    DYNAMIC_CACHE = `dynamic-cache-${CACHE_VERSION}`;
    console.log("Initialized cache version:", CACHE_VERSION);
  }
}

const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (event) => {
  console.log("SW installing...");

  event.waitUntil(
    initializeCache()
      .then(() => {
        console.log("SW installing version:", CACHE_VERSION);

        return caches.open(STATIC_CACHE).then((cache) => {
          console.log("Caching static assets");
          return Promise.allSettled(
            STATIC_ASSETS.map((url) =>
              cache.add(url).catch((err) => {
                console.warn(`Failed to cache ${url}:`, err);
                return null;
              })
            )
          );
        });
      })
      .then(() => {
        console.log("Static assets cached successfully");
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error("Failed to install service worker:", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("SW activating...");

  event.waitUntil(
    initializeCache().then(() => {
      console.log("SW activating version:", CACHE_VERSION);

      return Promise.all([
        // Clean up old caches (keep only current version)
        caches.keys().then((cacheNames) => {
          const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE];
          const deletePromises = cacheNames
            .filter((cacheName) => !currentCaches.includes(cacheName))
            .map((cacheName) => {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            });

          return Promise.all(deletePromises);
        }),

        // Take control immediately
        self.clients.claim(),
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip external resources
  if (
    !url.hostname.includes("thesologram.com") &&
    !url.hostname.includes("localhost") &&
    !url.hostname.includes("127.0.0.1")
  ) {
    return;
  }

  // Skip API calls
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    initializeCache().then(() => {
      // NETWORK-FIRST for JavaScript bundles
      if (request.url.includes(".js") || request.url.includes("bundle")) {
        return fetch(request, { cache: "no-cache" })
          .then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            return caches.match(request).then((cachedResponse) => {
              if (cachedResponse) {
                console.log("Serving JS from cache (offline):", request.url);
                return cachedResponse;
              }
              return new Response("Resource not available offline", {
                status: 503,
                statusText: "Service Unavailable",
              });
            });
          });
      }

      // CACHE-FIRST for everything else
      return caches
        .match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          return fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          });
        })
        .catch((err) => {
          console.error("Fetch failed:", err);

          if (request.destination === "document") {
            return caches.match("/").then((cachedResponse) => {
              return (
                cachedResponse ||
                new Response("App not available offline", {
                  status: 503,
                  statusText: "Service Unavailable",
                })
              );
            });
          }

          return new Response("Resource not available", {
            status: 404,
            statusText: "Not Found",
          });
        });
    })
  );
});
