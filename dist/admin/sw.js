const CACHE = 'onebox-admin-shell-v3';
const SHELL = ['./', './index.html', './admin.css', './admin.js', './manifest.webmanifest', '../reader-sync-config.js', '../icons/onebox-brand-v317-192.png', '../icons/onebox-brand-v317-512.png'];
const SHELL_URLS = new Set(SHELL.map((path) => new URL(path, self.location.href).pathname));
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('onebox-admin-shell-') && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('Authorization')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  const isShell = request.mode === 'navigate' || SHELL_URLS.has(url.pathname);
  if (!isShell) return;
  event.respondWith(fetch(request, { cache: 'no-store' }).then((response) => {
    if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone())).catch(() => {});
    return response;
  }).catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html'))));
});
self.addEventListener('message', (event) => { if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting()); });
