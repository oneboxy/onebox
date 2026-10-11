/* Opt-in OneBox cloud data sync. OAuth tokens stay on this device. */
(() => {
  'use strict';
  const API = String(window.ONEBOX_CLOUD_API || window.ONEBOX_READER_SYNC_API || '').replace(/\/+$/, '');
  const ENABLED_KEY = 'onebox.cloud-enabled';
  const CLOCKS_KEY = 'onebox.cloud-local-timestamps';
  const FILE_CLOCKS_KEY = 'onebox.cloud-file-timestamps';
  const FILE_DELETIONS_KEY = 'onebox.cloud-file-deletions';
  const DATA_KEYS = new Set([
    'onebox.theme','onebox.language','onebox.layout','onebox.color','onebox.color-explicit','onebox.top-display','onebox.footprint','onebox.open-mode','onebox.mascot-position','onebox.mascot-visible','onebox.mascot-display-mode','onebox.pet-profile',
    'onebox.tool-order','onebox.navigation','onebox.navigation-location','onebox.home-feed-order','onebox.home-feed-visibility','onebox.home-feed-active',
    'onebox.home-feed-read','onebox.reader-progress','onebox.reader-preferences','onebox.reader-layout','onebox.library',
    'onebox.notifications','onebox.notification-preference','onebox.events','onebox.weather-cards','onebox.weather',
    'onebox.translation-history','onebox.translation-history-open','onebox.calculator','onebox.dev-tools',
    'onebox.ticket-wallet','onebox.ticket-wallet-display-order','onebox.ticket-wallet-type-filter','onebox.ticket-wallet-memories','onebox.ticket-wallet-deleted'
  ]);
  const FILE_STORES = new Set(['books', 'book-covers', 'ticket-images']);
  let sessionToken = '', sessionExpiresAt = 0, sessionGithubToken = '', syncTimer = 0, syncing = false, syncPromise = null, syncReady = false;
  const pendingKeys = new Set(), pendingFiles = new Set(), pendingFileDeletes = new Map();
  let publicConfig = { modules: {}, ads: [], announcements: [] }, publicConfigPromise = null;

  function githubToken() {
    try { return String(JSON.parse(localStorage.getItem('onebox.github') || '{}').token || '').trim(); } catch { return ''; }
  }
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
  function enabled() { return localStorage.getItem(ENABLED_KEY) === 'true'; }
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
  function libraryInfo() {
    try { const list = JSON.parse(localStorage.getItem('onebox.library') || '[]'); return new Map((Array.isArray(list) ? list : []).filter((item) => item?.id).map((item) => [String(item.id), item])); } catch { return new Map(); }
  }
  async function localFiles() {
    const [books, covers, images] = await Promise.all(['books','book-covers','ticket-images'].map(storeEntries));
    const library = libraryInfo(), result = [];
    for (const { key, value } of books) {
      const book = library.get(String(key));
      const blob = value instanceof Blob ? value : value ? new Blob([value], { type: book?.type === 'pdf' ? 'application/pdf' : book?.type === 'epub' ? 'application/epub+zip' : 'application/octet-stream' }) : null;
      if (blob?.size) result.push({ store: 'books', key: String(key), value, blob, dataKey: 'onebox.library', name: book?.name || String(key), type: blob.type || 'application/octet-stream', localAt: Number(book?.updatedAt || book?.addedAt) || 0 });
    }
    for (const { key, value } of covers) {
      let blob = null;
      if (value instanceof Blob) blob = value;
      else if (typeof value === 'string' && /^data:image\//i.test(value)) { try { blob = await (await fetch(value)).blob(); } catch {} }
      if (blob?.size) result.push({ store: 'book-covers', key: String(key), value, blob, dataKey: 'onebox.library', name: (library.get(String(key))?.name || String(key)) + '-cover', type: blob.type || 'image/jpeg', localAt: 0 });
    }
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
    let value;
    if (identity.store === 'books') value = await blob.arrayBuffer();
    else if (identity.store === 'book-covers') {
      try { value = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); }); } catch { return false; }
    } else value = { blob, name: file.name || identity.key, type: file.type || blob.type, savedAt: Number(file.createdAt) || Date.now() };
    const saved = await writeEntry(identity.store, identity.key, value);
    if (saved) setClock(file.id, file.createdAt, FILE_CLOCKS_KEY);
    return saved;
  }
  async function syncFiles(remoteFiles = [], deletedFiles = []) {
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
    if (syncing || !DATA_KEYS.has(String(key)) || !enabled()) return;
    const value = localStorage.getItem(key);
    if (value === null) {
      setClock(key, Date.now());
      void api('/v1/cloud/data/' + encodeURIComponent(key), { method: 'DELETE' }).catch(() => {});
      return;
    }
    setClock(key, Date.now()); pendingKeys.add(key); scheduleSync();
  }
  async function uploadValue(key) {
    const value = localStorage.getItem(key); if (value === null) return;
    const updatedAt = readMap(CLOCKS_KEY)[key] || Date.now();
    await api('/v1/cloud/data/' + encodeURIComponent(key), { method: 'PUT', body: JSON.stringify({ value, updatedAt }) });
  }
  async function flushPending(force = false) {
    if ((!enabled() && !force) || !navigator.onLine || syncing || (!pendingKeys.size && !pendingFiles.size && !pendingFileDeletes.size)) return;
    syncing = true;
    const keys = [...pendingKeys], files = [...pendingFiles], fileDeletes = [...pendingFileDeletes.entries()]; pendingKeys.clear(); pendingFiles.clear(); pendingFileDeletes.clear();
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
      window.dispatchEvent(new CustomEvent('onebox:cloud-sync-status', { detail: { state: 'success', message: '云端同步完成' } }));
    } catch (error) {
      keys.forEach((key) => pendingKeys.add(key)); files.forEach((id) => pendingFiles.add(id)); fileDeletes.forEach(([id, at]) => pendingFileDeletes.set(id, at));
      window.dispatchEvent(new CustomEvent('onebox:cloud-sync-status', { detail: { state: 'error', message: error.message } }));
    } finally { syncing = false; if (pendingKeys.size || pendingFiles.size || pendingFileDeletes.size) scheduleSync(); }
  }
  async function syncFromCloud(force = false) {
    if ((!enabled() && !force) || !navigator.onLine) return;
    if (syncPromise) return syncPromise;
    syncPromise = (async () => {
      syncing = true;
      try {
        const remote = await api('/v1/cloud/data'), remoteByKey = new Map((remote.data || []).map((item) => [item.key, item])), deletedByKey = new Map((remote.deleted || []).map((item) => [item.key, item])), clocks = readMap(CLOCKS_KEY);
        for (const key of DATA_KEYS) {
          const localValue = localStorage.getItem(key), remoteItem = remoteByKey.get(key), deletedItem = deletedByKey.get(key);
          if (deletedItem && (!remoteItem || deletedItem.updatedAt >= remoteItem.updatedAt)) {
            if (localValue !== null && (Number(clocks[key]) || 0) <= Number(deletedItem.updatedAt || 0)) { localStorage.removeItem(key); setClock(key, deletedItem.updatedAt); }
            else if (localValue !== null) pendingKeys.add(key);
            continue;
          }
          if (!remoteItem) { if (localValue !== null) pendingKeys.add(key); continue; }
          const localUpdatedAt = Number(clocks[key]) || 0, remoteUpdatedAt = Number(remoteItem.updatedAt) || 0;
          if (localValue === null || remoteUpdatedAt >= localUpdatedAt) {
            const nextValue = typeof remoteItem.value === 'string' ? remoteItem.value : JSON.stringify(remoteItem.value);
            localStorage.setItem(key, nextValue); setClock(key, remoteUpdatedAt);
          } else pendingKeys.add(key);
        }
        await syncFiles(remote.files || [], remote.deletedFiles || []);
        syncReady = true; syncing = false;
        await flushPending(force);
        window.dispatchEvent(new CustomEvent('onebox:cloud-sync-status', { detail: { state: 'success', message: '云端数据已同步' } }));
      } catch (error) {
        syncing = false;
        window.dispatchEvent(new CustomEvent('onebox:cloud-sync-status', { detail: { state: 'error', message: error.message } }));
        throw error;
      } finally { syncing = false; syncPromise = null; }
    })();
    return syncPromise;
  }
  const nativeSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) { nativeSetItem.call(this, key, value); if (this === window.localStorage) storageChanged(key); };
  const nativeRemoveItem = Storage.prototype.removeItem;
  Storage.prototype.removeItem = function (key) { nativeRemoveItem.call(this, key); if (this === window.localStorage && DATA_KEYS.has(String(key)) && enabled() && !syncing) { setClock(String(key), Date.now()); void api('/v1/cloud/data/' + encodeURIComponent(key), { method: 'DELETE' }).catch(() => {}); } };
  window.addEventListener('onebox:indexeddb-changed', (event) => {
    const item = event.detail || {};
    if (!enabled() || syncing || !FILE_STORES.has(item.store)) return;
    const id = fileIdentity(item.store, item.key);
    if (item.operation === 'delete') { const deletions = readMap(FILE_DELETIONS_KEY); deletions[id] = Date.now(); writeMap(FILE_DELETIONS_KEY, deletions); pendingFileDeletes.set(id, deletions[id]); pendingFiles.delete(id); }
    else { setClock(id, Date.now(), FILE_CLOCKS_KEY); pendingFiles.add(id); pendingFileDeletes.delete(id); }
    scheduleSync();
  });
  window.OneBoxCloudSync = {
    configured: () => Boolean(API), enabled,
    enable: (value) => { localStorage.setItem(ENABLED_KEY, String(Boolean(value))); window.dispatchEvent(new CustomEvent(value ? 'onebox:cloud-sync-enabled' : 'onebox:cloud-sync-disabled')); },
    config: () => publicConfig, api, getSession, refreshPublicConfig, syncNow: () => syncFromCloud(true), isReady: () => syncReady,
    snapshot: () => Object.fromEntries([...DATA_KEYS].map((key) => [key, localStorage.getItem(key)]).filter(([, value]) => value !== null)),
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
