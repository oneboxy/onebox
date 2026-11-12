// Mobile editor toolbar assets use the current compact controls.
const CACHE = 'onebox-v815';
const APP_SHELL = [
  './',
  'index.html',
  'ticket-wallet-layout.js?v=2.18.768',
  'dev-json-editor.js?v=2.18.761',
  'style.css?v=2.18.808',
  'app.js?v=2.18.856',
  'converter-mobile-fix.js?v=2.18.810',
  'converter-select-popup.js?v=2.18.885',
  'converter-result-fit.js?v=2.18.895',
  'converter-row-drag.js?v=2.18.893',
  'reader-enhancements-core.js?v=2.18.783',
  'reader-enhancements.js?v=2.18.785',
  'reader-enhancements.css?v=2.18.896',
  'dev-editor-controls.css?v=2.18.901',
  'dev-pane-inline-actions.js?v=2.18.901',
  'vendor/reader-formats/mobi.mjs?v=2.18.780',
  'vendor/reader-formats/fb2.mjs?v=2.18.780',
  'vendor/reader-formats/fflate.mjs?v=2.18.780',
  'timestamp-layout.js?v=2.18.878',
  'timestamp-city-row.js?v=2.18.814',
  'timestamp-city-compact.js?v=2.18.821',
  'converter-clean.css?v=2.18.894',
  'dev-tabs.css?v=2.18.825',
  'timestamp-clean.css?v=2.18.873',
  'select-focus-clean.css?v=2.18.828',
    'timestamp-input-output-frame.js?v=2.18.874',
  'timestamp-city-auto-height.js?v=2.18.819',
  'timestamp-date-time-control.js?v=2.18.876',
  'timestamp-layout-restore.css?v=2.18.816',
  'pet-cloud-backup.js?v=2.18.761',
  'calendar-data.js?v=2.18.761',
  'reader-sync-config.js?v=2.18.761',
  'reader-cloud-sync.js?v=2.18.761',
  'cloud-sync.js?v=2.18.761',
  'cloud-sync.html',
  'cloud-sync.css',
  'cloud-migration.js',
  'manifest.webmanifest',
  'manifest.webmanifest?v=2.18.761',
  'favicon-v317.ico?v=2.18.761',
  'apple-touch-icon.png',
  'apple-touch-icon-precomposed.png',
  'apple-touch-icon.png?v=2.18.761',
  'icons/onebox-brand-v317-16.png?v=2.18.761',
  'icons/onebox-brand-v317-32.png?v=2.18.761',
  'icons/onebox-brand-v317-48.png?v=2.18.761',
  'icons/onebox-brand-v317-64.png?v=2.18.761',
  'icons/onebox-brand-v317-128.png?v=2.18.761',
  'icons/onebox-brand-v317-120.png?v=2.18.761',
  'icons/onebox-brand-v317-152.png?v=2.18.761',
  'icons/onebox-brand-v317-167.png?v=2.18.761',
  'icons/onebox-brand-v317-180.png?v=2.18.761',
  'icons/onebox-brand-v317-192.png?v=2.18.761',
  'icons/onebox-brand-v317-256.png?v=2.18.761',
  'icons/onebox-brand-v317-512.png?v=2.18.761',
  'icons/onebox-brand-v317-1024.png?v=2.18.761',
  'icons/mascot-fox-full-reactions.png',
  'icons/mascot-fox-full-reactions.png?v=2.18.311',
  'icons/mascot-fox-full.png',
  'icons/mascot-fox-full.png?v=2.18.311',
  'icons/bell.svg',
  'icons/bell-192.png',
  'icons/weibo.png',
  'icons/guancha.png?v=2.18.311',
  'icons/ithome.svg',
  'icons/ithome.svg?v=2.18.311',
  'icons/bilibili.ico',
  'icons/bilibili.ico?v=2.18.311',
  'icons/bilibili.svg',
  'icons/bilibili.svg?v=2.18.311',
  'icons/spotify.svg?v=2.18.761',
  'icons/cafe-brand-luckin.png',
  'icons/cafe-brand-starbucks.png',
  'icons/cafe-brand-cotti.png',
  'icons/cafe-brand-mixue.png',
  'icons/hupu.ico',
  'icons/hupu.ico?v=2.18.311',
  'file-compare-core.js?v=2.18.761',
  'file-compare-ui.js?v=2.18.761',
  'file-compare-worker.js?v=2.18.761',
  'vendor/xlsx.full.min.js?v=2.18.761',
  'file-compare-polish.css?v=2.18.761',
  'ticket-wallet-tiles.css?v=2.18.767',
  'calendar-grid-fixed.css?v=2.18.771',
  'ticket-wallet-grid.js?v=2.18.766',
];
const CORE_APP_SHELL = APP_SHELL.slice(0, 10);
const OPTIONAL_APP_SHELL = APP_SHELL.slice(7);
const OPEN_METEO = /(^|\.)open-meteo\.com$/;
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE)
    .then((cache) => cache.addAll(CORE_APP_SHELL)
      .then(() => Promise.all(OPTIONAL_APP_SHELL.map((asset) => cache.add(asset).catch(() => null)))))
    .then(() => self.skipWaiting())
    .then(() => undefined));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch { payload = { body: event.data?.text() || 'OneBox' }; }
  event.waitUntil(self.registration.showNotification(payload.title || 'OneBox', {
    body: payload.body || payload.text || 'OneBox 有新的消息',
    tag: payload.tag || 'onebox-push-' + Date.now(),
    icon: 'icons/bell-192.png',
    badge: 'icons/bell-192.png',
    renotify: true,
    data: payload.data || {},
  }));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.endsWith('/sw.js')) return;
  // Sync requests must read the current Gist, including changes from another
  // device. Never serve private GitHub responses from the PWA asset cache.
  if (url.hostname === 'api.github.com' || url.hostname === 'gist.githubusercontent.com' || event.request.headers.has('Authorization')) return;
  const isAppShellRequest = event.request.mode === 'navigate'
    || url.pathname.endsWith('/index.html')
    || url.pathname.endsWith('/app.js')
    || url.pathname.endsWith('/style.css')
    || url.pathname.endsWith('/calendar-data.js')
    || url.pathname.endsWith('/reader-sync-config.js')
    || url.pathname.endsWith('/reader-cloud-sync.js')
    || url.pathname.endsWith('/cloud-sync.js')
    || url.pathname.endsWith('/cloud-sync.html')
    || url.pathname.endsWith('/cloud-sync.css')
    || url.pathname.endsWith('/cloud-migration.js');
  // Cloudflare APIs and the live RSS reader proxy must never become part
  // of the static PWA cache. Fetch no-store requests without a Cache Storage
  // lookup so a previously cached feed cannot mask newer articles.
  if (url.pathname.startsWith('/v1/') || url.hostname === 'r.jina.ai') return;
  if (isAppShellRequest) {
    event.respondWith(fetch(event.request, { cache: 'no-store' })
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./'))));
    return;
  }
  if (OPEN_METEO.test(url.hostname)) {
    event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match('./'))));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const target = windows.find((client) => 'focus' in client);
    return target ? target.focus() : clients.openWindow('./');
  }));
});
