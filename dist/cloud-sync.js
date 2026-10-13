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
  const PENDING_KEYS_STORAGE = 'onebox.github-pending-sync-keys';
  const ACCOUNT_OWNER_KEY = 'onebox.github-sync-owner';
  const ACCOUNT_SNAPSHOT_PREFIX = 'github-account-sync:';
  const ACCOUNT_ACTIVE_SNAPSHOT_KEY = 'github-sync-active-account';
  const LAST_SYNC_KEY = 'onebox.github-last-sync';
  const ACCOUNT_DATA_KEYS = new Set([...DATA_KEYS, LAST_SYNC_KEY]);
  let timer = 0;
  let restorePending = false;
  let remoteApplyDepth = 0;
  let accountSwitchChain = Promise.resolve();
  let observedAccountLogin = '';
  const nativeSetItem = Storage.prototype.setItem;
  const nativeRemoveItem = Storage.prototype.removeItem;

  function account() {
    try { return JSON.parse(localStorage.getItem('onebox.github') || '{}'); } catch { return {}; }
  }
  function normalizeLogin(value) { return String(value || '').trim().toLowerCase(); }
  function owner() { return normalizeLogin(localStorage.getItem(ACCOUNT_OWNER_KEY)); }
  function accountScopeMatches() {
    const login = normalizeLogin(account().user?.login);
    const active = owner();
    return !login || !active || login === active && (!observedAccountLogin || observedAccountLogin === login);
  }
  function accountAutoSyncKey(login = account().user?.login) {
    const normalized = normalizeLogin(login);
    return normalized ? AUTO_SYNC_KEY + ':' + normalized : '';
  }
  function enabled() {
    if (!accountScopeMatches()) return false;
    const key = accountAutoSyncKey();
    return Boolean(key) && localStorage.getItem(key) === 'true';
  }
  function dispatchAccountChanged(login, previousLogin = '') {
    window.dispatchEvent(new CustomEvent('onebox:github-account-switched', { detail: { login, previousLogin } }));
  }
  function accountDataSnapshot() {
    const storage = {};
    ACCOUNT_DATA_KEYS.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) storage[key] = value;
    });
    return { version: 1, storage, dirty: readPendingKeys(), savedAt: Date.now() };
  }
  function persistCurrentSnapshot(db) {
    const snapshot = accountDataSnapshot();
    const auth = localStorage.getItem('onebox.github');
    const library = localStorage.getItem('onebox.library');
    const progress = localStorage.getItem('onebox.reader-progress');
    const savedAt = Date.now();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('snapshot', 'readwrite');
      const store = transaction.objectStore('snapshot');
      const request = store.get('app');
      let applied = false;
      request.onsuccess = () => {
        try {
          const current = request.result && typeof request.result === 'object' ? request.result : {};
          const values = { ...(current.values || {}) };
          ACCOUNT_DATA_KEYS.forEach((key) => delete values[key]);
          Object.assign(values, snapshot.storage);
          if (auth !== null) values['onebox.github'] = auth;
          store.put({ ...current, version: 1, savedAt, values }, 'app');
          if (auth !== null) store.put({ value: auth, savedAt }, 'github-auth');
          if (library !== null) store.put({ value: library, savedAt }, 'reader-library');
          else store.delete('reader-library');
          if (progress !== null) store.put({ value: progress, savedAt }, 'reader-progress');
          else store.delete('reader-progress');
          applied = true;
        } catch (error) {
          try { transaction.abort(); } catch { /* transaction already ended */ }
          reject(error);
        }
      };
      request.onerror = () => reject(request.error || Error('无法更新本机恢复快照'));
      transaction.oncomplete = () => applied ? resolve(true) : reject(Error('本机恢复快照更新未完成'));
      transaction.onerror = transaction.onabort = () => reject(transaction.error || Error('无法更新本机恢复快照'));
    });
  }
  function applyAccountDataSnapshot(snapshot) {
    ACCOUNT_DATA_KEYS.forEach((key) => nativeRemoveItem.call(window.localStorage, key));
    Object.entries(snapshot?.storage || {}).forEach(([key, value]) => {
      if (ACCOUNT_DATA_KEYS.has(key) && typeof value === 'string') nativeSetItem.call(window.localStorage, key, value);
    });
    const dirty = snapshot?.dirty && typeof snapshot.dirty === 'object' && !Array.isArray(snapshot.dirty) ? snapshot.dirty : {};
    if (Object.keys(dirty).length) nativeSetItem.call(window.localStorage, PENDING_KEYS_STORAGE, JSON.stringify(dirty));
    else nativeRemoveItem.call(window.localStorage, PENDING_KEYS_STORAGE);
  }
  async function switchAccountNow(targetLogin) {
    const currentLogin = owner() || normalizeLogin(account().user?.login);
    if (!currentLogin) {
      nativeSetItem.call(window.localStorage, ACCOUNT_OWNER_KEY, targetLogin);
      observedAccountLogin = targetLogin;
      dispatchAccountChanged(targetLogin);
      return true;
    }
    if (currentLogin === targetLogin) {
      if (!owner()) nativeSetItem.call(window.localStorage, ACCOUNT_OWNER_KEY, targetLogin);
      const previousObservedLogin = observedAccountLogin;
      observedAccountLogin = targetLogin;
      if (previousObservedLogin && previousObservedLogin !== targetLogin) dispatchAccountChanged(targetLogin, previousObservedLogin);
      return true;
    }
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('onebox-local-data', 3);
      request.onupgradeneeded = () => {
        const database = request.result;
        ['snapshot', 'books', 'book-covers', 'ticket-images'].forEach((name) => {
          if (!database.objectStoreNames.contains(name)) database.createObjectStore(name);
        });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || Error('本机同步数据无法安全切换：IndexedDB 不可用'));
    });
    const transaction = db.transaction('snapshot', 'readwrite');
    const store = transaction.objectStore('snapshot');
    const request = store.get(ACCOUNT_SNAPSHOT_PREFIX + targetLogin);
    const previousSnapshot = accountDataSnapshot();
    clearTimeout(timer);
    timer = 0;
    restorePending = false;
    return new Promise((resolve, reject) => {
      let nextSnapshot = null;
      let applied = false;
      request.onsuccess = () => {
        try {
          nextSnapshot = request.result || null;
          store.put(previousSnapshot, ACCOUNT_SNAPSHOT_PREFIX + currentLogin);
          store.put({ version: 1, login: targetLogin, savedAt: Date.now() }, ACCOUNT_ACTIVE_SNAPSHOT_KEY);
          applied = true;
        } catch (error) {
          try { transaction.abort(); } catch { /* transaction already ended */ }
          reject(error);
        }
      };
      request.onerror = () => reject(request.error || Error('无法读取此 GitHub 账号的本机同步快照'));
      transaction.oncomplete = async () => {
        if (!applied) return reject(Error('本机同步数据切换未完成'));
        try {
          applyAccountDataSnapshot(nextSnapshot);
          nativeSetItem.call(window.localStorage, ACCOUNT_OWNER_KEY, targetLogin);
          await persistCurrentSnapshot(db);
          observedAccountLogin = targetLogin;
          dispatchAccountChanged(targetLogin, currentLogin);
          resolve(true);
        } catch (error) {
          try { applyAccountDataSnapshot(previousSnapshot); } catch { /* retain the account switch error */ }
          nativeSetItem.call(window.localStorage, ACCOUNT_OWNER_KEY, currentLogin);
          observedAccountLogin = currentLogin;
          reject(Error('无法恢复本机同步数据，已阻止切换账号：' + (error?.message || '存储失败')));
        }
      };
      transaction.onerror = transaction.onabort = () => reject(transaction.error || Error('无法保存当前账号的本机同步快照'));
    });
  }
  function switchAccount(login) {
    const target = normalizeLogin(login);
    if (!target) return Promise.resolve(false);
    const run = async () => {
      if (navigator.locks?.request) {
        return navigator.locks.request('onebox-github-sync', { mode: 'exclusive' }, () =>
          navigator.locks.request('onebox-github-account-switch', { mode: 'exclusive' }, () => switchAccountNow(target)));
      }
      return switchAccountNow(target);
    };
    accountSwitchChain = accountSwitchChain.then(run, run);
    return accountSwitchChain;
  }
  const initialLogin = normalizeLogin(account().user?.login);
  if (initialLogin && !owner()) nativeSetItem.call(window.localStorage, ACCOUNT_OWNER_KEY, initialLogin);
  observedAccountLogin = owner() || initialLogin;
  if (localStorage.getItem(AUTO_SYNC_KEY) !== null) nativeRemoveItem.call(window.localStorage, AUTO_SYNC_KEY);
  // Uploading to an unlisted Gist requires an explicit opt-in on each device.
  function queue(delay = 3500, restore = false) {
    if (!enabled() || !navigator.onLine || !account().token) return;
    restorePending = restorePending || restore;
    clearTimeout(timer);
    timer = window.setTimeout(async () => {
      timer = 0;
      const shouldRestore = restorePending;
      restorePending = false;
      const login = normalizeLogin(account().user?.login);
      if (login && login !== owner()) {
        try { await switchAccount(login); }
        catch (error) {
          window.dispatchEvent(new CustomEvent('onebox:github-account-switch-error', { detail: { message: error?.message || '无法安全切换 GitHub 同步账号' } }));
          return;
        }
      }
      void window.OneBoxGithubAutoSync?.queueRun?.({ restore: shouldRestore });
    }, Math.max(700, Number(delay) || 3500));
  }
  function readPendingKeys() {
    try {
      const value = JSON.parse(localStorage.getItem(PENDING_KEYS_STORAGE) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }
  function dirtySnapshot() { return { ...readPendingKeys() }; }
  function markDirty(key) {
    const pending = readPendingKeys();
    const previous = Number(pending[key]) || 0;
    pending[key] = Math.max(Date.now(), previous + 1);
    nativeSetItem.call(window.localStorage, PENDING_KEYS_STORAGE, JSON.stringify(pending));
  }
  function clearDirtySnapshot(snapshot = {}) {
    const pending = readPendingKeys();
    Object.entries(snapshot || {}).forEach(([key, timestamp]) => {
      if (Number(pending[key]) === Number(timestamp)) delete pending[key];
    });
    if (Object.keys(pending).length) nativeSetItem.call(window.localStorage, PENDING_KEYS_STORAGE, JSON.stringify(pending));
    else nativeRemoveItem.call(window.localStorage, PENDING_KEYS_STORAGE);
  }
  function changed(key, fromAnotherTab = false) {
    key = String(key);
    if (DATA_KEYS.has(key) && accountScopeMatches()) {
      if (!remoteApplyDepth || fromAnotherTab) markDirty(key);
      queue();
    }
  }

  Storage.prototype.setItem = function (key, value) {
    if (this === window.localStorage && DATA_KEYS.has(String(key)) && !accountScopeMatches()) return;
    nativeSetItem.call(this, key, value);
    if (this === window.localStorage) {
      if (String(key) === 'onebox.github') {
        const login = normalizeLogin(account().user?.login);
        if (login && login !== owner()) void switchAccount(login).catch((error) => window.dispatchEvent(new CustomEvent('onebox:github-account-switch-error', { detail: { message: error?.message || '无法安全切换 GitHub 同步账号' } })));
      }
      changed(key);
    }
  };
  Storage.prototype.removeItem = function (key) {
    if (this === window.localStorage && DATA_KEYS.has(String(key)) && !accountScopeMatches()) return;
    nativeRemoveItem.call(this, key);
    if (this === window.localStorage) changed(key);
  };
  window.addEventListener('storage', (event) => {
    if (event.key === 'onebox.github') {
      let login = '';
      let previousLogin = '';
      try {
        login = normalizeLogin(JSON.parse(event.newValue || '{}').user?.login);
        previousLogin = normalizeLogin(JSON.parse(event.oldValue || '{}').user?.login);
      } catch { login = ''; }
      if (login) void switchAccount(login).then(() => {
        observedAccountLogin = login;
        dispatchAccountChanged(login, previousLogin);
      }).catch((error) => window.dispatchEvent(new CustomEvent('onebox:github-account-switch-error', { detail: { message: error?.message || '无法安全切换 GitHub 同步账号' } })));
      return;
    }
    changed(event.key, true);
  });
  window.addEventListener('onebox:indexeddb-changed', (event) => {
    const store = event.detail?.store;
    if (['books','book-covers','ticket-images'].includes(store)) queue();
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
      const key = accountAutoSyncKey();
      if (!key || !accountScopeMatches()) return;
      localStorage.setItem(key, String(Boolean(value)));
      if (value) queue(500);
    },
    config: () => window.OneBoxCloudConfig,
    refreshPublicConfig: async () => window.OneBoxCloudConfig,
    syncNow: async () => window.OneBoxGithubAutoSync?.syncNow?.({ restore: true }),
    isReady: () => Boolean(account().token),
    snapshot: () => Object.fromEntries([...DATA_KEYS].map((key) => [key, localStorage.getItem(key)]).filter(([, value]) => value !== null)),
    dirtySnapshot,
    clearDirtySnapshot,
    switchAccount,
    accountOwner: owner,
    accountScopeMatches,
    beginRemoteApply() { remoteApplyDepth += 1; },
    endRemoteApply() { remoteApplyDepth = Math.max(0, remoteApplyDepth - 1); },
    markAnnouncementRead: async () => {},
  };
})();
