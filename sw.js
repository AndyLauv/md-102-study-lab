// Service worker: caches the whole app (all content is bundled into app.js) for offline use.
// Network-first when online so updates appear on the next open; falls back to cache offline.
const VERSION = 'mwzfjcp4';
const CACHE = 'md102-' + VERSION;
const ASSETS = ['./', './index.html', './app.js', './app.css', './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('md102-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 4000); // slow network: fall back to cache
      const res = await fetch(req, { cache: 'no-cache', signal: ctl.signal });
      clearTimeout(t);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      return (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await cache.match('./index.html') : Response.error());
    }
  })());
});
