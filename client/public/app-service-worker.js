// public/app-service-worker.js
/* eslint-disable no-restricted-globals */

// Configuration
const APP_VERSION = "1.0.1";
const CACHE_NAME = `sologram-cache-${APP_VERSION}`;
const MEDIA_CACHE_NAME = `sologram-media-cache-${APP_VERSION}`;

// Static assets to pre-cache during installation
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/static/js/main.chunk.js",
  "/static/js/bundle.js",
  "/static/js/vendors~main.chunk.js",
  "/favicon.ico",
  "/logo192.png",
  "/logo512.png",
  "/apple-touch-icon.png",
  "/maskable_icon.png",
];

// Message event handler for SKIP_WAITING
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Install event handler
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {})
  );
});

// Activate event handler
self.addEventListener("activate", (event) => {
  const currentCaches = [CACHE_NAME, MEDIA_CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return cacheNames.filter(
          (cacheName) => !currentCaches.includes(cacheName)
        );
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cacheToDelete) => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event handler with different strategies for different types of requests
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip OneSignal paths to avoid conflicts
  if (
    event.request.url.includes("/OneSignal") ||
    event.request.url.includes("OneSignalSDK")
  ) {
    return;
  }

  // Handle API requests
  if (event.request.url.includes("/api/")) {
    // Network first, fallback to cache strategy for API requests
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            // Only cache successful GET requests
            if (event.request.method === "GET") {
              cache.put(event.request, responseToCache);
            }
          });

          return response;
        })
        .catch(() => {
          // Return from cache when network fails
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // For API requests that aren't in cache, return a custom offline response
            return new Response(
              JSON.stringify({
                success: false,
                message: "You are offline. Please check your connection.",
              }),
              {
                headers: { "Content-Type": "application/json" },
                status: 503,
                statusText: "Service Unavailable",
              }
            );
          });
        })
    );
    return;
  }

  // Handle media files (images, videos)
  if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov)$/)) {
    // Cache first, network as fallback for media files
    event.respondWith(
      caches.open(MEDIA_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Refresh cache in the background (cache-then-network)
            fetch(event.request)
              .then((response) => {
                if (response && response.status === 200) {
                  cache.put(event.request, response);
                }
              })
              .catch(() => {
                /* Ignore network errors for background updates */
              });

            return cachedResponse;
          }

          // If not in cache, fetch from network and cache
          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200) {
                return response;
              }

              // Clone the response for caching
              const responseToCache = response.clone();
              cache.put(event.request, responseToCache);
              return response;
            })
            .catch(() => {
              // If offline and not in cache, return a placeholder image
              // Could customize this based on media type
              return new Response("Media not available offline", {
                status: 503,
                statusText: "Service Unavailable",
              });
            });
        });
      })
    );
    return;
  }

  // Handle HTML navigation requests
  if (
    event.request.mode === "navigate" ||
    (event.request.method === "GET" &&
      event.request.headers.get("accept").includes("text/html"))
  ) {
    // Network first, with offline fallback for navigation
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the latest version
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline, try cache first
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // If no cached page found, show offline page
            return caches.match("/offline.html");
          });
        })
    );
    return;
  }

  // Default strategy for other assets (CSS, JS, etc.)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Background sync for offline actions (like posting comments)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-comments") {
    event.waitUntil(syncComments());
  }
});

// Helper function to sync comments when back online
function syncComments() {
  // Implementation would retrieve pending comments from IndexedDB
  // and send them to the server
  return Promise.resolve();
}

// NOTE: We're removing push and notificationclick event listeners
// to avoid conflicts with OneSignal's handlers
// OneSignal will handle all push notifications
