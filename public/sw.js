// Minimaler Service Worker: zeigt bei fehlender Verbindung eine Offline-Seite
// statt des Browser-Fehlers. Es werden bewusst KEINE App-Inhalte oder Daten
// zwischengespeichert - Kontostände sollen immer live vom Server kommen und
// nach einem Deploy nie veraltet sein.
const CACHE = "matei-offline-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" }))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.open(CACHE).then((cache) => cache.match(OFFLINE_URL))));
});
