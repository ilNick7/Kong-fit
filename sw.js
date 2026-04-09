const CACHE_NAME = "kongfit-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/css/main.css",
  "/js/app.js",
  "/js/home.js",
  "/js/admin.js",
  "/js/workout.js",
  "/assets/hero.jpg",
  "/assets/kong-fit_white.svg"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
