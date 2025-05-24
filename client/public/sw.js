// public/sw.js - REPLACE YOUR ENTIRE FILE WITH THIS
const CACHE_VERSION = "v1.2.5"; // Change this with each deployment
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

  // SKIP ALL EXTERNAL IMAGES (Cloudinary, etc.) - Let browser handle them
  if (
    event.request.destination === "image" &&
    !url.hostname.includes("thesologram.com")
  ) {
    console.log("SW: Skipping external image:", event.request.url);
    return; // Don't intercept - let browser handle normally
  }

  // SKIP ALL CLOUDINARY REQUESTS
  if (url.hostname.includes("cloudinary.com")) {
    console.log("SW: Skipping Cloudinary request:", event.request.url);
    return;
  }

  // Handle everything else with cache-first for your domain
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        console.log("SW: Serving from cache:", event.request.url);
        return response;
      }

      console.log("SW: Fetching from network:", event.request.url);
      return fetch(event.request).then((fetchResponse) => {
        // Only cache successful responses from your domain
        if (fetchResponse.ok && url.hostname.includes("thesologram.com")) {
          const responseClone = fetchResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return fetchResponse;
      });
    })
  );
});
