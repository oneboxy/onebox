/* Opt-in OneBox cloud data sync. OAuth tokens stay on this device. */
(() => {
  'use strict';
  const API = String(window.ONEBOX_CLOUD_API || window.ONEBOX_READER_SYNC_API || '').replace(/\/+$/, '');
  const ENABLED_KEY_PREFIX = 'onebox.cloud-enabled:';
  const MIGRATED_KEY_PREFIX = 'onebox.cloud-migrated:';
  const CLOCKS_KEY = 'onebox.cloud-local-timestamps';
  const FILE_CLOCKS_KEY = 'onebox.cloud-file-timestamps';
  const FILE_DELETIONS_KEY = 'onebox.cloud-file-deletions';
  const PENDING_KEYS_STORAGE = 'onebox.cloud-pending-keys';
  const ACCOUNT_OWNER_KEY = 'onebox.cloud-account-owner';
  const ACCOUNT_SNAPSHOT_PREFIX = 'cloud-account-state:';
  const ACCOUNT_FILE_PREFIX = 'cloud-account-file:';
  const DATA_KEYS = new Set([
    'onebox.theme','onebox.language','onebox.layout','onebox.color','onebox.color-explicit','onebox.top-display','onebox.footprint','onebox.open-mode','onebox.mascot-position','onebox.mascot-visible','onebox.mascot-display-mode','onebox.pet-profile',
    'onebox.tool-order','onebox.navigation','onebox.navigation-location','onebox.home-feed-order','onebox.home-feed-visibility','onebox.home-feed-active',
    'onebox.home-feed-read','onebox.home-feed-activity','onebox.reader-progress','onebox.reader-deleted','onebox.reader-preferences','onebox.reader-layout','onebox.library',
    'onebox.notifications','onebox.notification-preference','onebox.events','onebox.weather-cards','onebox.weather',
    'onebox.translation-history','onebox.translation-history-open','onebox.calculator','onebox.dev-tools',
    'onebox.ticket-wallet','onebox.ticket-wallet-display-order','onebox.ticket-wallet-type-filter','onebox.ticket-wallet-memories','onebox.ticket-wallet-deleted'
  ]);
  const FILE_STORES = new Set(['ticket-images']);
  const GROUPS = {
    settings: new Set(['onebox.theme','onebox.language','onebox.layout','onebox.color','onebox.color-explicit','onebox.top-display','onebox.footprint','onebox.open-mode','onebox.mascot-position','onebox.mascot-visible','onebox.mascot-display-mode','onebox.pet-profile']),
    navigation: new Set(['onebox.tool-order','onebox.navigation','onebox.navigation-location','onebox.home-feed-order','onebox.home-feed-visibility','onebox.home-feed-active']),
    reading: new Set(['onebox.home-feed-read','onebox.home-feed-activity','onebox.reader-progress','onebox.reader-deleted','onebox.reader-preferences','onebox.reader-layout','onebox.library']),
    messages: new Set(['onebox.notifications','onebox.notification-preference']), calendar: new Set(['onebox.events']),
    weather: new Set(['onebox.weather-cards','onebox.weather']), translation: new Set(['onebox.translation-history','onebox.translation-history-open']),
    calculator: new Set(['onebox.calculator','onebox.dev-tools']),
    ticketWallet: new Set(['onebox.ticket-wallet','onebox.ticket-wallet-display-order','onebox.ticket-wallet-type-filter','onebox.ticket-wallet-memories','onebox.ticket-wallet-deleted']),
  };
  const ACCOUNT_DATA_KEYS = new Set([...DATA_KEYS, CLOCKS_KEY, FILE_CLOCKS_KEY, FILE_DELETIONS_KEY, PENDING_KEYS_STORAGE, 'onebox.github-sync-selection']);
  let sessionToken = '', sessionExpiresAt = 0, sessionGithubToken = '', syncTimer = 0, syncing = false, syncPromise = null, syncReady = false;
  let remoteApplyDepth = 0, accountSwitchChain = Promise.resolve(), observedAccountLogin = '';
  const pendingKeys = new Set(), pendingFiles = new Set(), pendingFileDeletes = new Map();
  let publicConfig = { modules: {}, ads: [], announcements: [] }, publicConfigPromise = null;
  const nativeSetItem = Storage.prototype.setItem;
  const nativeRemoveItem = Storage.prototype.removeItem;

  function parseActivityMap(value) {
    try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; }
  }
  function mergeActivityMaps(localValue, remoteValue) {
    const local = parseActivityMap(localValue), remote = parseActivityMap(remoteValue), merged = {};
    [...new Set([...Object.keys(local), ...Object.keys(remote)])].forEach((id) => {
      const left = local[id] && typeof local[id] === 'object' ? local[id] : {}, right = remote[id] && typeof remote[id] === 'object' ? remote[id] : {};
      const leftUpdatedAt = Number(left.updatedAt) || 0, rightUpdatedAt = Number(right.updatedAt) || 0;
      const latest = rightUpdatedAt >= leftUpdatedAt ? right : left, other = latest === right ? left : right;
      const reactionRecord = (Number(right.reactionAt) || 0) >= (Number(left.reactionAt) || 0) ? right : left;
      merged[id] = {
        ...(latest.item || other.item ? { item: latest.item || other.item } : {}),
        readAt: Math.max(Number(left.readAt) || 0, Number(right.readAt) || 0),
        reaction: String(reactionRecord.reaction || ''),
        reactionAt: Math.max(Number(left.reactionAt) || 0, Number(right.reactionAt) || 0),
        updatedAt: Math.max(leftUpdatedAt, rightUpdatedAt),
      };
    });
    return merged;
  }

  function githubToken() {
    try { return String(JSON.parse(localStorage.getItem('onebox.github') || '{}').token || '').trim(); } catch { return ''; }
  }
  function account() { try { return JSON.parse(localStorage.getItem('onebox.github') || '{}'); } catch { return {}; } }
  function normalizeLogin(value) { return String(value || '').trim().toLowerCase(); }
  function owner() { return normalizeLogin(localStorage.getItem(ACCOUNT_OWNER_KEY)); }
  function accountScopeMatches() {
    const login = normalizeLogin(account().user?.login), active = owner();
    return !login || !active || login === active && (!observedAccountLogin || observedAccountLogin === login);
  }
  function accountDataSnapshot() {
    const storage = {};
    ACCOUNT_DATA_KEYS.forEach((key) => { const value = localStorage.getItem(key); if (value !== null) storage[key] = value; });
    return { version: 1, storage, dirty: readMap(PENDING_KEYS_STORAGE), savedAt: Date.now() };
  }
  function applyAccountDataSnapshot(snapshot) {
    ACCOUNT_DATA_KEYS.forEach((key) => nativeRemoveItem.call(window.localStorage, key));
    Object.entries(snapshot?.storage || {}).forEach(([key, value]) => {
      if (ACCOUNT_DATA_KEYS.has(key) && typeof value === 'string') nativeSetItem.call(window.localStorage, key, value);
    });
    const dirty = snapshot?.dirty && typeof snapshot.dirty === 'object' && !Array.isArray(snapshot.dirty) ? snapshot.dirty : {};
    if (Object.keys(dirty).length) nativeSetItem.call(window.localStorage, PENDING_KEYS_STORAGE, JSON.stringify(dirty));
  }
  async function moveAccountFiles(db, fromLogin, toLogin, onStoreMoved = null, onlyStores = null) {
    for (const storeName of ['books', 'book-covers', 'ticket-images']) {
      if (!db.objectStoreNames.contains(storeName) || onlyStores && !onlyStores.has(storeName)) continue;
      const prefix = (login) => ACCOUNT_FILE_PREFIX + login + ':' + storeName + ':';
      await new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite'), store = tx.objectStore(storeName);
        const restoreTarget = () => {
          const targetPrefix = prefix(toLogin), request = store.openCursor();
          request.onsuccess = () => {
            const cursor = request.result;
            if (!cursor) return;
            const key = cursor.key;
            if (typeof key === 'string' && key.startsWith(targetPrefix)) { store.put(cursor.value, key.slice(targetPrefix.length)); cursor.delete(); }
            cursor.continue();
          };
        };
        const request = store.openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) { restoreTarget(); return; }
          const key = cursor.key;
          if (fromLogin && fromLogin !== toLogin && typeof key === 'string' && !key.startsWith(ACCOUNT_FILE_PREFIX)) {
            store.put(cursor.value, prefix(fromLogin) + key); cursor.delete();
          }
          cursor.continue();
        };
        tx.oncomplete = resolve; tx.onerror = tx.onabort = () => reject(tx.error || Error('无法恢复此账号的本机附件'));
      });
      onStoreMoved?.(storeName);
    }
  }
  async function updatePersistentAppSnapshot(db) {
    if (!db.objectStoreNames.contains('snapshot')) return;
    await new Promise((resolve, reject) => {
      const tx = db.transaction('snapshot', 'readwrite'), store = tx.objectStore('snapshot'), request = store.get('app');
      request.onsuccess = () => {
        const current = request.result && typeof request.result === 'object' ? request.result : {}, values = { ...(current.values || {}) };
        ACCOUNT_DATA_KEYS.forEach((key) => delete values[key]);
        ACCOUNT_DATA_KEYS.forEach((key) => { const value = localStorage.getItem(key); if (value !== null && (DATA_KEYS.has(key) || key === 'onebox.github-sync-selection')) values[key] = value; });
        const auth = localStorage.getItem('onebox.github'); if (auth !== null) values['onebox.github'] = auth;
        store.put({ ...current, version: 1, savedAt: Date.now(), values }, 'app');
      };
      request.onerror = () => reject(request.error || Error('无法更新本机恢复快照'));
      tx.oncomplete = resolve; tx.onerror = tx.onabort = () => reject(tx.error || Error('无法更新本机恢复快照'));
    });
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
      const previous = observedAccountLogin; observedAccountLogin = targetLogin;
      if (previous && previous !== targetLogin) dispatchAccountChanged(targetLogin, previous);
      return true;
    }
    if (syncPromise) { try { await syncPromise; } catch { /* preserve local data while switching */ } }
    for (let attempt = 0; syncing && attempt < 300; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 100));
    if (syncing) throw Error('云端同步仍在进行，请稍后再切换账号');
    clearTimeout(syncTimer); syncTimer = 0;
    pendingKeys.clear(); pendingFiles.clear(); pendingFileDeletes.clear();
    const db = await idb();
    if (!db) throw Error('本机同步数据无法安全切换：IndexedDB 不可用');
    const previousSnapshot = accountDataSnapshot(), targetSnapshot = await new Promise((resolve, reject) => {
      const tx = db.transaction('snapshot', 'readonly'), request = tx.objectStore('snapshot').get(ACCOUNT_SNAPSHOT_PREFIX + targetLogin);
      request.onsuccess = () => resolve(request.result || null); request.onerror = () => reject(request.error || Error('无法读取目标账号的本机数据'));
    });
    const movedStores = [];
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction('snapshot', 'readwrite');
        tx.objectStore('snapshot').put(previousSnapshot, ACCOUNT_SNAPSHOT_PREFIX + currentLogin);
        tx.oncomplete = resolve; tx.onerror = tx.onabort = () => reject(tx.error || Error('无法保存当前账号的本机数据'));
      });
      await moveAccountFiles(db, currentLogin, targetLogin, (name) => movedStores.push(name));
      applyAccountDataSnapshot(targetSnapshot);
      nativeSetItem.call(window.localStorage, ACCOUNT_OWNER_KEY, targetLogin);
      await updatePersistentAppSnapshot(db);
      const previous = observedAccountLogin || currentLogin; observedAccountLogin = targetLogin;
      sessionToken = ''; sessionExpiresAt = 0; sessionGithubToken = ''; syncReady = false;
      dispatchAccountChanged(targetLogin, previous);
      return true;
    } catch (error) {
      if (movedStores.length) {
        try { await moveAccountFiles(db, targetLogin, currentLogin, null, new Set(movedStores)); } catch { /* preserve the original failure */ }
      }
      try { applyAccountDataSnapshot(previousSnapshot); nativeSetItem.call(window.localStorage, ACCOUNT_OWNER_KEY, currentLogin); } catch { /* retain the original failure */ }
      observedAccountLogin = currentLogin;
      throw Error('无法恢复本机同步数据，已阻止切换账号：' + (error?.message || '存储失败'));
    } finally { db.close(); }
  }
  function dispatchAccountChanged(login, previousLogin = '') {
    window.dispatchEvent(new CustomEvent('onebox:github-account-switched', { detail: { login, previousLogin } }));
  }
  function switchAccount(login) {
    const target = normalizeLogin(login); if (!target) return Promise.resolve(false);
    const run = async () => navigator.locks?.request
      ? navigator.locks.request('onebox-github-sync', { mode: 'exclusive' }, () => navigator.locks.request('onebox-cloud-sync', { mode: 'exclusive' }, () => navigator.locks.request('onebox-github-account-switch', { mode: 'exclusive' }, () => switchAccountNow(target))))
      : switchAccountNow(target);
    accountSwitchChain = accountSwitchChain.then(run, run); return accountSwitchChain;
  }
  function readPendingKeys() { return readMap(PENDING_KEYS_STORAGE); }
  function dirtySnapshot() { return { ...readPendingKeys() }; }
  function markDirty(key) { const pending = readPendingKeys(); pending[key] = Math.max(Date.now(), (Number(pending[key]) || 0) + 1); writeMap(PENDING_KEYS_STORAGE, pending); }
  function clearDirtySnapshot(snapshot = {}) {
    const pending = readPendingKeys();
    Object.entries(snapshot).forEach(([key, timestamp]) => { if (Number(pending[key]) === Number(timestamp)) delete pending[key]; });
    writeMap(PENDING_KEYS_STORAGE, pending);
  }
  function dispatchGistSync(delay = 1800) { window.OneBoxGithubAutoSync?.queue?.(delay); }
  function dispatchAccountAndSync(login) {
    if (!login || login === owner()) return;
    void switchAccount(login).catch((error) => window.dispatchEvent(new CustomEvent('onebox:github-account-switch-error', { detail: { message: error?.message || '无法安全切换 GitHub 同步账号' } })));
  }
  const initialAccount = normalizeLogin(account().user?.login);
  if (initialAccount && !owner()) nativeSetItem.call(window.localStorage, ACCOUNT_OWNER_KEY, initialAccount);
  observedAccountLogin = owner() || initialAccount;
  Storage.prototype.setItem = function (key, value) {
    if (this === window.localStorage && DATA_KEYS.has(String(key)) && !accountScopeMatches()) return;
    nativeSetItem.call(this, key, value);
    if (this === window.localStorage && String(key) === 'onebox.github') dispatchAccountAndSync(normalizeLogin(account().user?.login));
    if (this === window.localStorage && DATA_KEYS.has(String(key))) storageChanged(key);
  };
  Storage.prototype.removeItem = function (key) {
    if (this === window.localStorage && DATA_KEYS.has(String(key)) && !accountScopeMatches()) return;
    nativeRemoveItem.call(this, key);
    if (this === window.localStorage && DATA_KEYS.has(String(key))) storageChanged(key);
  };
  window.addEventListener('storage', (event) => {
    if (event.key === 'onebox.github') {
      let login = '', previous = '';
      try { login = normalizeLogin(JSON.parse(event.newValue || '{}').user?.login); previous = normalizeLogin(JSON.parse(event.oldValue || '{}').user?.login); } catch { /* ignore malformed account data */ }
      if (login) void switchAccount(login).then(() => dispatchAccountChanged(login, previous)).catch((error) => window.dispatchEvent(new CustomEvent('onebox:github-account-switch-error', { detail: { message: error?.message || '无法安全切换 GitHub 同步账号' } })));
      return;
    }
    if (event.key && DATA_KEYS.has(event.key) && accountScopeMatches()) { markDirty(event.key); if (enabled()) { setClock(event.key, Date.now()); pendingKeys.add(event.key); scheduleSync(); } dispatchGistSync(1500); }
  });
  async function savedGithubToken() {
    const direct = githubToken(); if (direct) return direct;
    const db = await idb();
    if (!db || !db.objectStoreNames.contains('snapshot')) { db?.close(); return ''; }
    return new Promise((resolve) => {
      const request = db.transaction('snapshot', 'readonly').objectStore('snapshot').get('github-auth');
      request.onsuccess = () => { try { resolve(String(JSON.parse(request.result?.value || '{}').token || '')); } catch { resolve(''); } db.close(); };
      request.onerror = () => { db.close(); resolve(''); };
    });
  }
  function enabledKeys() {
    let user = {};
    try { user = JSON.parse(localStorage.getItem('onebox.github') || '{}').user || {}; } catch { /* no connected account */ }
    return [...new Set([user.id, user.login].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean).map((value) => ENABLED_KEY_PREFIX + value))];
  }
  function enabled() { return accountScopeMatches() && enabledKeys().some((key) => localStorage.getItem(key) === 'true'); }
  function migratedKeys() {
    let user = {};
    try { user = JSON.parse(localStorage.getItem('onebox.github') || '{}').user || {}; } catch { /* no connected account */ }
    return [...new Set([user.id, user.login].map((value) => String(value || '').trim().toLowerCase()).filter(Boolean).map((value) => MIGRATED_KEY_PREFIX + value))];
  }
  function migrated() { return accountScopeMatches() && migratedKeys().some((key) => localStorage.getItem(key) === 'true'); }
  function markMigrated() { migratedKeys().forEach((key) => nativeSetItem.call(window.localStorage, key, 'true')); }
  function syncSelection() {
    try { const value = JSON.parse(localStorage.getItem('onebox.github-sync-selection') || '{}'); return value && typeof value === 'object' ? value : {}; } catch { return {}; }
  }
  function groupEnabled(group) { return syncSelection()[group] !== false; }
  function keyEnabled(key) { return Object.entries(GROUPS).some(([group, keys]) => keys.has(key) && groupEnabled(group)); }
  function selectedKeys() { return [...DATA_KEYS].filter(keyEnabled); }
  function cloudLibraryMetadata(value) {
    try {
      const books = JSON.parse(String(value || '[]'));
      if (!Array.isArray(books)) throw Error('invalid library');
      return JSON.stringify(books.map((book) => {
        if (!book || typeof book !== 'object' || Array.isArray(book)) return book;
        const clean = { ...book };
        ['content','_coverData','_coverHydrating','_coverHydrated'].forEach((key) => delete clean[key]);
        return clean;
      }));
    } catch { throw Error('阅读书架数据格式异常，请刷新后重试'); }
  }
  function cloudValue(key, value) { return key === 'onebox.library' ? cloudLibraryMetadata(value) : value; }
  function mergeLibraryMetadata(localValue, remoteValue) {
    const parse = (value) => { try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(parsed) ? parsed : []; } catch { return []; } };
    const local = parse(localValue), remote = parse(remoteValue), localById = new Map(local.filter((book) => book?.id).map((book) => [String(book.id), book]));
    const deleted = readMap('onebox.reader-deleted');
    const result = [], seen = new Set();
    for (const remoteBook of remote) {
      if (!remoteBook?.id) { result.push(remoteBook); continue; }
      const id = String(remoteBook.id), localBook = localById.get(id);
      const book = localBook && Number(localBook.updatedAt || localBook.createdAt || 0) > Number(remoteBook.updatedAt || remoteBook.createdAt || 0)
        ? { ...remoteBook, ...localBook }
        : { ...localBook, ...remoteBook };
      if (localBook && localBook.type === 'md' && typeof localBook.content === 'string') book.content = localBook.content;
      if (localBook?.hasCover && !remoteBook.hasCover) book.hasCover = true;
      const deletedAt = Number(deleted[id]) || 0;
      if (!deletedAt || Number(book.updatedAt || book.createdAt || 0) > deletedAt) result.push(book);
      seen.add(id);
    }
    for (const book of local) {
      if (!book?.id) { if (!remote.length) result.push(book); continue; }
      const id = String(book.id), deletedAt = Number(deleted[id]) || 0;
      if (!seen.has(id) && (!deletedAt || Number(book.updatedAt || book.createdAt || 0) > deletedAt)) result.push(book);
    }
    return JSON.stringify(result);
  }
  function readMap(key) { try { const value = JSON.parse(localStorage.getItem(key) || '{}'); return value && typeof value === 'object' ? value : {}; } catch { return {}; } }
  function writeMap(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function setClock(key, value, storageKey = CLOCKS_KEY) { const map = readMap(storageKey); map[key] = Number(value) || Date.now(); writeMap(storageKey, map); }
  function idb() {
    if (!window.indexedDB) return Promise.resolve(null);
    return new Promise((resolve) => {
      let request;
      try { request = indexedDB.open('onebox-local-data', 3); } catch { resolve(null); return; }
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const name of ['snapshot', 'books', 'book-covers', 'ticket-images']) if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
      };
    });
  }
  async function storeEntries(storeName) {
    const db = await idb();
    if (!db || !db.objectStoreNames.contains(storeName)) { db?.close(); return []; }
    return new Promise((resolve) => {
      let transaction;
      try { transaction = db.transaction(storeName, 'readonly'); } catch { db.close(); resolve([]); return; }
      const store = transaction.objectStore(storeName), keys = store.getAllKeys(), values = store.getAll();
      transaction.oncomplete = () => { resolve(keys.result.map((key, index) => ({ key, value: values.result[index] }))); db.close(); };
      transaction.onerror = transaction.onabort = () => { resolve([]); db.close(); };
    });
  }
  async function writeEntry(storeName, key, value) {
    const db = await idb();
    if (!db || !db.objectStoreNames.contains(storeName)) { db?.close(); return false; }
    return new Promise((resolve) => {
      let transaction;
      try { transaction = db.transaction(storeName, 'readwrite'); transaction.objectStore(storeName).put(value, key); }
      catch { db.close(); resolve(false); return; }
      transaction.oncomplete = () => { db.close(); resolve(true); };
      transaction.onerror = transaction.onabort = () => { db.close(); resolve(false); };
    });
  }
  async function deleteEntry(storeName, key) {
    const db = await idb();
    if (!db || !db.objectStoreNames.contains(storeName)) { db?.close(); return false; }
    return new Promise((resolve) => {
      let transaction;
      try { transaction = db.transaction(storeName, 'readwrite'); transaction.objectStore(storeName).delete(key); }
      catch { db.close(); resolve(false); return; }
      transaction.oncomplete = () => { db.close(); resolve(true); };
      transaction.onerror = transaction.onabort = () => { db.close(); resolve(false); };
    });
  }
  function base64Url(value) {
    const bytes = new TextEncoder().encode(String(value)); let binary = '';
    bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
    return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  function fromBase64Url(value) {
    const raw = atob(String(value).replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - String(value).length % 4) % 4));
    return new TextDecoder().decode(Uint8Array.from(raw, (char) => char.charCodeAt(0)));
  }
  function fileIdentity(store, key) { return 'f_' + base64Url(store + ':' + String(key)); }
  function parseFileIdentity(id) {
    try { const value = fromBase64Url(String(id).replace(/^f_/, '')); const split = value.indexOf(':'); const store = value.slice(0, split); return FILE_STORES.has(store) ? { store, key: value.slice(split + 1) } : null; } catch { return null; }
  }
  async function localFiles() {
    if (!groupEnabled('ticketWallet')) return [];
    const [images] = await Promise.all(['ticket-images'].map(storeEntries));
    const result = [];
    for (const { key, value } of images) {
      const blob = value instanceof Blob ? value : value?.blob instanceof Blob ? value.blob : null;
      if (blob?.size) result.push({ store: 'ticket-images', key: String(key), value, blob, dataKey: 'onebox.ticket-wallet', name: value?.name || String(key), type: value?.type || blob.type || 'application/octet-stream', localAt: Number(value?.savedAt) || 0 });
    }
    return result.filter((item) => item.blob.size <= 64 * 1024 * 1024 && item.key.length < 90 && fileIdentity(item.store, item.key).length <= 120);
  }
  async function getSession(force = false) {
    const token = await savedGithubToken();
    if (!token) { sessionToken = ''; sessionGithubToken = ''; return ''; }
    if (sessionGithubToken !== token) { sessionToken = ''; sessionExpiresAt = 0; }
    if (!force && sessionToken && sessionExpiresAt > Date.now() + 60000) return sessionToken;
    if (!API) return '';
    const response = await fetch(API + '/v1/session', { method: 'POST', headers: { authorization: 'Bearer ' + token, accept: 'application/json' }, cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.token) throw Error(result.error || '无法连接 OneBox 云端');
    sessionToken = result.token; sessionExpiresAt = Number(result.expiresAt) * 1000 || Date.now() + 3600000; sessionGithubToken = token;
    return sessionToken;
  }
  async function api(path, options = {}, retried = false) {
    if (!API) throw Error('OneBox 云端服务尚未配置');
    const token = await getSession();
    if (!token) throw Error('请先连接 GitHub 并同意使用 OneBox 云端同步');
    const response = await fetch(API + path, { ...options, headers: { accept: 'application/json', ...(options.body && !(options.body instanceof Blob) ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}), authorization: 'Bearer ' + token }, cache: 'no-store' });
    if (response.status === 401 && !retried) { sessionToken = ''; return api(path, options, true); }
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw Error(result.error || ('HTTP ' + response.status));
    return result;
  }
  async function getFile(path) {
    const token = await getSession();
    if (!token) throw Error('GitHub 会话已失效，请重新连接。');
    const response = await fetch(API + path, { headers: { authorization: 'Bearer ' + token }, cache: 'no-store' });
    if (response.status === 401) { sessionToken = ''; const refreshed = await getSession(true); return fetch(API + path, { headers: { authorization: 'Bearer ' + refreshed }, cache: 'no-store' }); }
    if (!response.ok) { const message = await response.json().catch(() => ({})); throw Error(message.error || '附件同步失败'); }
    return response;
  }
  async function uploadFile(file) {
    const fileId = fileIdentity(file.store, file.key), clocks = readMap(FILE_CLOCKS_KEY), updatedAt = Math.max(Date.now(), Number(clocks[fileId]) || 0);
    await api('/v1/cloud/files/' + encodeURIComponent(fileId) + '?key=' + encodeURIComponent(file.dataKey), { method: 'PUT', body: file.blob, headers: { 'content-type': file.type, 'x-file-name': encodeURIComponent(file.name).slice(0, 700) } });
    setClock(fileId, updatedAt, FILE_CLOCKS_KEY);
    const deletions = readMap(FILE_DELETIONS_KEY); delete deletions[fileId]; writeMap(FILE_DELETIONS_KEY, deletions);
  }
  async function uploadLocalFiles(onProgress = () => {}) {
    const files = await localFiles(); let done = 0;
    for (const file of files) { await uploadFile(file); done += 1; onProgress(done, files.length, file.name); }
    return { count: files.length, bytes: files.reduce((sum, file) => sum + file.blob.size, 0) };
  }
  async function restoreFile(file) {
    const identity = parseFileIdentity(file.id);
    if (!identity) return false;
    const response = await getFile('/v1/cloud/files/' + encodeURIComponent(file.id));
    const blob = await response.blob();
    if (!blob.size) return false;
    const value = { blob, name: file.name || identity.key, type: file.type || blob.type, savedAt: Number(file.createdAt) || Date.now() };
    const saved = await writeEntry(identity.store, identity.key, value);
    if (saved) setClock(file.id, file.createdAt, FILE_CLOCKS_KEY);
    return saved;
  }
  async function syncFiles(remoteFiles = [], deletedFiles = []) {
    if (!groupEnabled('ticketWallet')) return;
    const locals = await localFiles(), localById = new Map(locals.map((file) => [fileIdentity(file.store, file.key), file]));
    const remoteById = new Map(remoteFiles.map((file) => [file.id, file])), deletedById = new Map(deletedFiles.map((file) => [file.id, file]));
    const clocks = readMap(FILE_CLOCKS_KEY), deletions = readMap(FILE_DELETIONS_KEY), allIds = new Set([...localById.keys(), ...remoteById.keys(), ...Object.keys(deletions)]);
    for (const id of allIds) {
      const local = localById.get(id), remote = remoteById.get(id), localAt = Math.max(Number(clocks[id]) || 0, Number(local?.localAt) || 0), deletedAt = Number(deletions[id]) || 0, remoteDeleteAt = Number(deletedById.get(id)?.deletedAt) || 0;
      if (remoteDeleteAt && remoteDeleteAt >= (remote?.createdAt || 0) && remoteDeleteAt >= localAt) {
        if (local) { await deleteEntry(local.store, local.key); localById.delete(id); }
        if (deletedAt <= remoteDeleteAt) { delete deletions[id]; writeMap(FILE_DELETIONS_KEY, deletions); }
        continue;
      }
      if (deletedAt && deletedAt >= (remote?.createdAt || 0) && deletedAt >= localAt) {
        if (remote) await api('/v1/cloud/files/' + encodeURIComponent(id), { method: 'DELETE' });
        pendingFileDeletes.delete(id); pendingFiles.delete(id);
        continue;
      }
      if (remote && deletedAt && Number(remote.createdAt || 0) > deletedAt) { delete deletions[id]; writeMap(FILE_DELETIONS_KEY, deletions); }
      if (local && (!remote || localAt > Number(remote.createdAt || 0))) { await uploadFile(local); pendingFiles.delete(id); pendingFileDeletes.delete(id); continue; }
      if (remote && (!local || Number(remote.createdAt || 0) >= localAt)) { await restoreFile(remote); pendingFiles.delete(id); pendingFileDeletes.delete(id); }
    }
  }
  function publishConfig(value) {
    publicConfig = { modules: value?.modules || {}, ads: Array.isArray(value?.ads) ? value.ads : [], announcements: Array.isArray(value?.announcements) ? value.announcements : [] };
    window.OneBoxCloudConfig = publicConfig;
    window.dispatchEvent(new CustomEvent('onebox:public-config', { detail: publicConfig }));
  }
  async function refreshPublicConfig() {
    if (!API || publicConfigPromise) return publicConfigPromise;
    publicConfigPromise = (async () => {
      let headers = { accept: 'application/json' };
      if (enabled()) { try { const token = await getSession(); if (token) headers.authorization = 'Bearer ' + token; } catch {} }
      try { const response = await fetch(API + '/v1/public/config', { headers, cache: 'no-store' }); if (response.ok) publishConfig(await response.json()); } catch {}
      return publicConfig;
    })().finally(() => { publicConfigPromise = null; });
    return publicConfigPromise;
  }
  function scheduleSync() { clearTimeout(syncTimer); syncTimer = setTimeout(() => { syncTimer = 0; void flushPending(); }, 900); }
  function storageChanged(key) {
    key = String(key);
    if (!DATA_KEYS.has(key) || !accountScopeMatches()) return;
    if (remoteApplyDepth) return;
    markDirty(key); dispatchGistSync(1800);
    if (!keyEnabled(key) || !enabled()) return;
    const value = localStorage.getItem(key);
    if (value === null) {
      setClock(key, Date.now());
      pendingKeys.add(key); if (!syncing) scheduleSync();
      return;
    }
    setClock(key, Date.now()); pendingKeys.add(key); if (!syncing) scheduleSync();
  }
  async function uploadValue(key) {
    const value = localStorage.getItem(key); if (!keyEnabled(key)) return;
    if (value === null) { await api('/v1/cloud/data/' + encodeURIComponent(key), { method: 'DELETE' }); return; }
    const updatedAt = readMap(CLOCKS_KEY)[key] || Date.now();
    await api('/v1/cloud/data/' + encodeURIComponent(key), { method: 'PUT', body: JSON.stringify({ value: cloudValue(key, value), updatedAt }) });
  }
  async function flushPending(force = false) {
    if ((!enabled() && !force) || !navigator.onLine || syncing || (!pendingKeys.size && !pendingFiles.size && !pendingFileDeletes.size)) return;
    syncing = true;
    const keys = [...pendingKeys], files = [...pendingFiles], fileDeletes = [...pendingFileDeletes.entries()], dirtyAtStart = dirtySnapshot(); pendingKeys.clear(); pendingFiles.clear(); pendingFileDeletes.clear();
    try {
      for (const key of keys) await uploadValue(key);
      for (const [id, deletedAt] of fileDeletes) {
        const remote = (await api('/v1/cloud/data')).files?.find((file) => file.id === id);
        if (remote && deletedAt >= Number(remote.createdAt || 0)) await api('/v1/cloud/files/' + encodeURIComponent(id), { method: 'DELETE' });
      }
      if (files.length) {
        const allFiles = await localFiles(), byId = new Map(allFiles.map((file) => [fileIdentity(file.store, file.key), file]));
        for (const id of files) { const file = byId.get(id); if (file) await uploadFile(file); }
      }
      clearDirtySnapshot(Object.fromEntries(keys.map((key) => [key, dirtyAtStart[key]]).filter(([, value]) => value)));
      window.dispatchEvent(new CustomEvent('onebox:cloud-sync-status', { detail: { state: 'success', message: '云端同步完成' } }));
    } catch (error) {
      keys.forEach((key) => pendingKeys.add(key)); files.forEach((id) => pendingFiles.add(id)); fileDeletes.forEach(([id, at]) => pendingFileDeletes.set(id, at));
      window.dispatchEvent(new CustomEvent('onebox:cloud-sync-status', { detail: { state: 'error', message: error.message } }));
    } finally { syncing = false; if (pendingKeys.size || pendingFiles.size || pendingFileDeletes.size) scheduleSync(); }
  }
  async function syncFromCloud(force = false, locked = false) {
    if (!locked && navigator.locks?.request) return navigator.locks.request('onebox-cloud-sync', { mode: 'exclusive' }, () => syncFromCloud(force, true));
    if ((!enabled() && !force) || !navigator.onLine) return;
    if (syncPromise) return syncPromise;
    syncPromise = (async () => {
      syncing = true;
      try {
        const remote = await api('/v1/cloud/data'), remoteByKey = new Map((remote.data || []).map((item) => [item.key, item])), deletedByKey = new Map((remote.deleted || []).map((item) => [item.key, item])), clocks = readMap(CLOCKS_KEY);
        remoteApplyDepth += 1;
        try { for (const key of selectedKeys()) {
          const localValue = localStorage.getItem(key), remoteItem = remoteByKey.get(key), deletedItem = deletedByKey.get(key);
          if (deletedItem && (!remoteItem || deletedItem.updatedAt >= remoteItem.updatedAt)) {
            if (localValue !== null && (Number(clocks[key]) || 0) <= Number(deletedItem.updatedAt || 0)) { localStorage.removeItem(key); setClock(key, deletedItem.updatedAt); }
            else if (localValue !== null) pendingKeys.add(key);
            continue;
          }
          if (!remoteItem) { if (localValue !== null) pendingKeys.add(key); continue; }
          const localUpdatedAt = Number(clocks[key]) || 0, remoteUpdatedAt = Number(remoteItem.updatedAt) || 0;
          if (key === 'onebox.library' && localValue !== null) {
            const remoteValue = typeof remoteItem.value === 'string' ? remoteItem.value : JSON.stringify(remoteItem.value);
            const mergedValue = mergeLibraryMetadata(localValue, remoteValue);
            if (mergedValue !== localValue) localStorage.setItem(key, mergedValue);
            if (mergedValue !== remoteValue) { setClock(key, Math.max(Date.now(), localUpdatedAt, remoteUpdatedAt)); pendingKeys.add(key); }
            else setClock(key, Math.max(localUpdatedAt, remoteUpdatedAt));
            continue;
          }
          if (key === 'onebox.home-feed-activity' && localValue !== null) {
            const remoteValue = typeof remoteItem.value === 'string' ? remoteItem.value : JSON.stringify(remoteItem.value);
            const mergedValue = JSON.stringify(mergeActivityMaps(localValue, remoteValue));
            const encodedRemote = JSON.stringify(parseActivityMap(remoteValue));
            if (mergedValue !== localValue) localStorage.setItem(key, mergedValue);
            if (mergedValue !== encodedRemote) { setClock(key, Math.max(Date.now(), localUpdatedAt, remoteUpdatedAt)); pendingKeys.add(key); }
            else setClock(key, Math.max(localUpdatedAt, remoteUpdatedAt));
            continue;
          }
          if (localValue === null || remoteUpdatedAt >= localUpdatedAt) {
            const nextValue = typeof remoteItem.value === 'string' ? remoteItem.value : JSON.stringify(remoteItem.value);
            localStorage.setItem(key, nextValue); setClock(key, remoteUpdatedAt);
          } else pendingKeys.add(key);
        } } finally { remoteApplyDepth = Math.max(0, remoteApplyDepth - 1); }
        await syncFiles(remote.files || [], remote.deletedFiles || []);
        syncReady = true; syncing = false;
        await flushPending(force);
        window.dispatchEvent(new CustomEvent('onebox:cloud-data-restored'));
        window.dispatchEvent(new CustomEvent('onebox:cloud-sync-status', { detail: { state: 'success', message: '云端数据已同步' } }));
      } catch (error) {
        syncing = false;
        window.dispatchEvent(new CustomEvent('onebox:cloud-sync-status', { detail: { state: 'error', message: error.message } }));
        throw error;
      } finally { syncing = false; syncPromise = null; }
    })();
    return syncPromise;
  }
  window.addEventListener('onebox:indexeddb-changed', (event) => {
    const item = event.detail || {};
    if (!FILE_STORES.has(item.store) || !accountScopeMatches()) return;
    if (!syncing && !remoteApplyDepth) dispatchGistSync(1800);
    if (!enabled() || syncing || remoteApplyDepth) return;
    const id = fileIdentity(item.store, item.key);
    if (item.operation === 'delete') { const deletions = readMap(FILE_DELETIONS_KEY); deletions[id] = Date.now(); writeMap(FILE_DELETIONS_KEY, deletions); pendingFileDeletes.set(id, deletions[id]); pendingFiles.delete(id); }
    else { setClock(id, Date.now(), FILE_CLOCKS_KEY); pendingFiles.add(id); pendingFileDeletes.delete(id); }
    scheduleSync();
  });
  window.OneBoxCloudSync = {
    configured: () => Boolean(API), enabled, migrated, markMigrated,
    enable: (value) => { const keys = enabledKeys(); if (!keys.length || !accountScopeMatches()) return; keys.forEach((key) => nativeSetItem.call(window.localStorage, key, String(Boolean(value)))); window.dispatchEvent(new CustomEvent(value ? 'onebox:cloud-sync-enabled' : 'onebox:cloud-sync-disabled')); },
    config: () => publicConfig, api, getSession, refreshPublicConfig, syncNow: () => syncFromCloud(true), isReady: () => syncReady,
    snapshot: () => Object.fromEntries(selectedKeys().map((key) => [key, cloudValue(key, localStorage.getItem(key))]).filter(([, value]) => value !== null)),
    selectionChanged: () => { for (const key of selectedKeys()) if (localStorage.getItem(key) !== null) pendingKeys.add(key); if (enabled()) scheduleSync(); },
    switchAccount, accountOwner: owner, accountScopeMatches,
    dirtySnapshot, clearDirtySnapshot,
    beginRemoteApply: () => { remoteApplyDepth += 1; }, endRemoteApply: () => { remoteApplyDepth = Math.max(0, remoteApplyDepth - 1); },
    localFiles, uploadLocalFiles,
    markAnnouncementRead: async (id) => { await api('/v1/public/announcements/' + encodeURIComponent(id) + '/read', { method: 'POST', body: '{}' }); publicConfig.announcements = publicConfig.announcements.map((item) => item.id === id ? { ...item, read: true } : item); publishConfig(publicConfig); },
  };
  window.addEventListener('onebox:app-ready', () => { void refreshPublicConfig(); if (enabled()) void syncFromCloud().catch(() => {}); });
  window.addEventListener('online', () => { void refreshPublicConfig(); if (enabled()) void syncFromCloud().catch(() => {}); });
  window.addEventListener('focus', () => { void refreshPublicConfig(); if (enabled()) void syncFromCloud().catch(() => {}); });
  window.addEventListener('onebox:cloud-sync-enabled', () => { syncReady = false; void refreshPublicConfig(); void syncFromCloud().catch(() => {}); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { void refreshPublicConfig(); if (enabled()) void syncFromCloud().catch(() => {}); } });
  if (API) void refreshPublicConfig();
})();
