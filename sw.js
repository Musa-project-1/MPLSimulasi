/* MPLSim service worker: cache-first app-shell, network-first JSON */
const CACHE = 'mplsim-v1';
const SHELL = [
  './',
  './index.html',
  './css/app.min.css',
  './css/style.css',
  './js/app.js',
  './js/config.js',
  './js/store.js',
  './js/simulation.js',
  './js/simulation.worker.js',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.pathname.endsWith('.json')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((cache) => cache.put(request, copy));
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
