// Eagles Analytics offline app shell.
// After one visit on wifi, the app opens even with no signal in the gym.
// Stats themselves are kept on the device by Firestore and sync when back online.
const CACHE = 'eagles-shell-v1';

// Script and font hosts the app loads from. These are cached after first use.
const CDN_HOSTS = ['unpkg.com', 'cdn.jsdelivr.net', 'cdn.tailwindcss.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // The app page itself: try the network first so updates show up, fall back to the saved copy.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./')))
    );
    return;
  }

  // Libraries and fonts: use the saved copy if there is one, otherwise download and save it.
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
      }))
    );
  }
  // Everything else (Firebase sign-in and database traffic) goes straight to the network.
});
