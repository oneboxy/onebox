/* Automatic per-user GitHub Gist sync. No user data is sent to Cloudflare. */
(() => {
  'use strict';

  const AUTO_SYNC_KEY = 'onebox.github-auto-sync';
  const DATA_KEYS = new Set([
    'onebox.theme','onebox.language','onebox.layout','onebox.color','onebox.color-explicit','onebox.top-display','onebox.footprint','onebox.open-mode','onebox.mascot-position','onebox.mascot-visible','onebox.mascot-display-mode','onebox.pet-profile',
    'onebox.tool-order','onebox.navigation','onebox.navigation-location','onebox.home-feed-order','onebox.home-feed-visibility','onebox.home-feed-active','onebox.home-feed-read','onebox.home-feed-activity',
    'onebox.reader-progress','onebox.reader-preferences','onebox.reader-layout','onebox.reader-deleted','onebox.library','onebox.notifications','onebox.notification-preference','onebox.events','onebox.weather-cards','onebox.weather',
    'onebox.translation-history','onebox.translation-history-open','onebox.calculator','onebox.dev-tools','onebox.ticket-wallet','onebox.ticket-wallet-display-order','onebox.ticket-wallet-type-filter','onebox.ticket-wallet-memories','onebox.ticket-wallet-deleted'
  ]);
  let timer = 0;
  let restorePending = false;

  function account() {
    try { return JSON.parse(localStorage.getItem('onebox.github') || '{}'); } catch { return {}; }
  }
  // Uploading to an unlisted Gist requires an explicit opt-in on each device.
  function enabled() { return localStorage.getItem(AUTO_SYNC_KEY) === 'true'; }
  function queue(delay = 3500, restore = false) {
    if (!enabled() || !navigator.onLine || !account().token) return;
    restorePending = restorePending || restore;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      timer = 0;
      const shouldRestore = restorePending;
      restorePending = false;
      void window.OneBoxGithubAutoSync?.queueRun?.({ restore: shouldRestore });
    }, Math.max(700, Number(delay) || 3500));
  }
  function changed(key) {
    if (DATA_KEYS.has(String(key))) queue();
  }

  const nativeSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    nativeSetItem.call(this, key, value);
    if (this === window.localStorage) changed(key);
  };
  const nativeRemoveItem = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function (key) {
    nativeRemoveItem.call(this, key);
    if (this === window.localStorage) changed(key);
  };
  window.addEventListener('storage', (event) => changed(event.key));
  window.addEventListener('onebox:indexeddb-changed', (event) => {
    if (['books','book-covers','ticket-images'].includes(event.detail?.store)) queue();
  });
  window.addEventListener('onebox:github-connected', () => queue(900));
  window.addEventListener('online', () => queue(900));
  // Focus may follow a local edit. Upload the latest local snapshot instead of
  // restoring stale Gist data over it. First-time restore is handled by the
  // sync runner when there is no successful sync marker yet.
  window.addEventListener('focus', () => queue(1200));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) queue(1200); });

  window.OneBoxCloudConfig = { modules: {}, ads: [], announcements: [] };
  window.OneBoxCloudSync = {
    configured: () => Boolean(account().token),
    enabled,
    enable(value) {
      localStorage.setItem(AUTO_SYNC_KEY, String(Boolean(value)));
      if (value) queue(500);
    },
    config: () => window.OneBoxCloudConfig,
    refreshPublicConfig: async () => window.OneBoxCloudConfig,
    syncNow: async () => window.OneBoxGithubAutoSync?.syncNow?.({ restore: true }),
    isReady: () => Boolean(account().token),
    snapshot: () => Object.fromEntries([...DATA_KEYS].map((key) => [key, localStorage.getItem(key)]).filter(([, value]) => value !== null)),
    markAnnouncementRead: async () => {},
  };
})();
