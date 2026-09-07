/**
 * MPLSim Service Worker - Offline First Architecture
 */

const CACHE_NAME = 'mplsim-cache-v3';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './css/style.css',
    './img/logo.svg',
    './js/app.js',
    './js/config.js',
    './js/store.js',
    './js/ui.js',
    './js/simulation.js',
    './js/simulation/engine.js',
    './js/simulation/worker.js',
    './js/rules/standings.js',
    './js/modules/admin.js',
    './js/modules/export.js',
    './js/modules/playoffs.js',
    './js/modules/quick_sim.js',
    './js/modules/roster.js',
    './js/modules/schedule.js',
    './js/modules/sessions.js',
    './js/modules/supabase.js',
    './js/modules/theme.js',
    './js/ui/admin.js',
    './js/ui/core.js',
    './js/ui/dashboard.js',
    './js/ui/matches.js',
    './js/ui/playoffs.js',
    './js/ui/standings.js',
    './js/ui/teams.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Ignore non-http(s) requests (chrome-extension, etc.)
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached version immediately, fetch updated in background
                fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
                        }
                    })
                    .catch(() => {});
                return cachedResponse;
            }

            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {
                // Offline fallback if needed
                if (event.request.headers.get('accept')?.includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
