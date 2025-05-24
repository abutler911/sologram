// public/sw.js
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("static-cache-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/static/js/bundle.js",
        "/static/css/main.css",
        "/manifest.json",
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
