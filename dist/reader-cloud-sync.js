/* OneBox reader cloud sync. Book files are stored in a private Cloudflare R2 bucket. */
(() => {
  'use strict';

  const API_BASE = String(window.ONEBOX_READER_SYNC_API || '').replace(/\/+$/, '');
  const DELETED_KEY = 'onebox.reader-cloud-deleted';
  const MAX_BOOK_BYTES = 64 * 1024 * 1024;
  let handlers = null;
  let session = null;
  let sessionGithubToken = '';
  let syncTimer = 0;
  let activeSync = null;
  let lastSyncAt = 0;
  let lastStatus = { state: 'idle', message: '' };
  const localHashCache = new Map();

  function setStatus(state, message = '') {
    lastStatus = { state, message };
    handlers?.onStatus?.(lastStatus);
  }

  function storedDeletes() {
    try {
      const value = JSON.parse(localStorage.getItem(DELETED_KEY) || '[]');
      return Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string'))] : [];
    } catch { return []; }
  }

  function saveDeletes(value) {
    try { localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set(value)])); } catch { /* local storage can be disabled */ }
  }

  function markDeleted(ids) {
    const validIds = (Array.isArray(ids) ? ids : [ids]).filter((id) => typeof id === 'string' && id);
    if (!validIds.length) return;
    validIds.forEach((id) => localHashCache.delete(id));
    saveDeletes([...storedDeletes(), ...validIds]);
    scheduleSync(300);
  }

  function readToken() {
    try { return String(handlers?.getGithubToken?.() || '').trim(); } catch { return ''; }
  }

  async function refreshSession(force = false) {
    const githubToken = readToken();
    if (!githubToken) { session = null; return null; }
    if (githubToken !== sessionGithubToken) session = null;
    if (!force && session && session.expiresAt * 1000 > Date.now() + 60_000) return session.token;
    const response = await fetch(API_BASE + '/v1/session', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + githubToken, accept: 'application/json' },
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.token) throw Error(payload.error || '无法连接云端书架');
    session = { token: payload.token, expiresAt: Number(payload.expiresAt) || 0 };
    sessionGithubToken = githubToken;
    return session.token;
  }

  async function api(path, options = {}, retry = true) {
    const token = await refreshSession();
    if (!token) throw Error('请先登录 GitHub');
    const response = await fetch(API_BASE + path, {
      ...options,
      headers: { ...(options.headers || {}), authorization: 'Bearer ' + token },
      cache: 'no-store',
    });
    if (response.status === 401 && retry) {
      session = null;
      return api(path, options, false);
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const reason = payload.error || ('HTTP ' + response.status);
      const message = reason === 'book_file_too_large'
        ? '单本书不能超过 64 MB'
        : reason === 'session_invalid' || reason === 'github_auth_invalid'
          ? 'GitHub 登录已过期，请重新登录'
          : reason === 'github_unavailable'
            ? '暂时无法验证 GitHub 登录，请稍后重试'
            : reason === 'book_file_missing'
              ? '云端原书文件缺失'
              : '云端同步失败：' + reason;
      throw Error(message);
    }
    return response;
  }

  async function sha256(bytes) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  function progressTimestamp(book) { return Math.max(0, Number(book?.progressUpdatedAt) || Number(book?.updatedAt) || 0); }
  function metadataTimestamp(book) { return Math.max(0, Number(book?.updatedAt) || Number(book?.createdAt) || 0); }

  function bookMetadata(book) {
    const metadata = {};
    Object.entries(book || {}).forEach(([key, value]) => {
      if (!key.startsWith('_') && !['content', 'syncFileMissing', 'progress', 'progressUpdatedAt'].includes(key)) metadata[key] = value;
    });
    return metadata;
  }

  function mergeBook(local, remote) {
    const remoteMeta = remote?.metadata && typeof remote.metadata === 'object' ? remote.metadata : {};
    const localWins = Boolean(local) && metadataTimestamp(local) > Number(remote?.updatedAt || remoteMeta.updatedAt || 0);
    const base = localWins ? { ...local } : { ...remoteMeta };
    if (local?._coverData) Object.defineProperty(base, '_coverData', { value: local._coverData, writable: true, configurable: true, enumerable: false });
    if (local?._coverHydrated) Object.defineProperty(base, '_coverHydrated', { value: true, configurable: true, enumerable: false });
    const localProgressAt = progressTimestamp(local);
    const remoteProgressAt = Math.max(0, Number(remote?.progressUpdatedAt) || Number(remoteMeta.progressUpdatedAt) || 0);
    if (local && localProgressAt > remoteProgressAt) {
      base.progress = local.progress;
      base.progressUpdatedAt = localProgressAt;
    } else if (remote) {
      base.progress = remote.progress;
      base.progressUpdatedAt = remoteProgressAt;
    }
    if (local?.content && local.type === 'md') base.content = local.content;
    ['annotations', 'markups'].forEach((key) => {
      const entries = new Map();
      [...(Array.isArray(remoteMeta[key]) ? remoteMeta[key] : []), ...(Array.isArray(local?.[key]) ? local[key] : [])].forEach((entry) => {
        if (!entry?.id) return;
        const current = entries.get(entry.id);
        if (!current || Number(entry.updatedAt || entry.createdAt || 0) >= Number(current.updatedAt || current.createdAt || 0)) entries.set(entry.id, entry);
      });
      if (entries.size || Array.isArray(remoteMeta[key]) || Array.isArray(local?.[key])) {
        base[key] = [...entries.values()].sort((left, right) => Number(left.createdAt || 0) - Number(right.createdAt || 0));
      }
    });
    delete base.syncFileMissing;
    return base;
  }

  async function getLocalBytes(book) {
    const stored = await handlers.readBookFile(book);
    if (!stored) return null;
    let bytes;
    if (stored instanceof Uint8Array) bytes = stored;
    else if (stored instanceof ArrayBuffer) bytes = new Uint8Array(stored);
    else if (ArrayBuffer.isView(stored)) bytes = new Uint8Array(stored.buffer, stored.byteOffset, stored.byteLength);
    else if (stored instanceof Blob) bytes = new Uint8Array(await stored.arrayBuffer());
    else return null;
    return bytes;
  }

  async function localFileHash(book) {
    const stamp = [Number(book.size) || 0, metadataTimestamp(book)].join(':');
    const cached = localHashCache.get(book.id);
    if (cached?.stamp === stamp) return { ...cached };
    const bytes = await getLocalBytes(book);
    if (!bytes) return { stamp, size: 0, hash: '' };
    const value = { stamp, size: bytes.byteLength, hash: await sha256(bytes) };
    localHashCache.set(book.id, value);
    return value;
  }

  async function rememberLocalHash(book, bytes) {
    if (!book?.id || !bytes) return;
    localHashCache.set(book.id, { stamp: [Number(book.size) || 0, metadataTimestamp(book)].join(':'), size: bytes.byteLength, hash: await sha256(bytes) });
  }

  async function downloadBook(id, entry, book) {
    const response = await api('/v1/books/' + encodeURIComponent(id) + '/file');
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BOOK_BYTES) throw Error('云端书籍文件大小异常');
    const expectedHash = String(entry?.file?.sha256 || response.headers.get('x-content-sha256') || '').toLowerCase();
    if (!expectedHash || await sha256(bytes) !== expectedHash) throw Error('云端书籍校验失败：' + (book?.name || id));
    await handlers.writeBookFile(book, bytes);
    return bytes;
  }

  async function uploadBook(id, bytes) {
    if (!bytes) throw Error('本机缺少书籍原文件');
    if (bytes.byteLength > MAX_BOOK_BYTES) throw Error('单本书不能超过 64 MB');
    const hash = await sha256(bytes);
    const response = await api('/v1/books/' + encodeURIComponent(id) + '/file', {
      method: 'PUT', body: bytes, headers: { 'content-type': 'application/octet-stream', 'x-content-sha256': hash },
    });
    return response.json();
  }

  async function writeRemoteMetadata(books) {
    const unique = new Map();
    books.forEach((book) => {
      if (!book?.id) return;
      unique.set(book.id, {
        id: book.id,
        metadata: bookMetadata(book),
        progress: book.progress,
        progressUpdatedAt: progressTimestamp(book),
        updatedAt: metadataTimestamp(book),
      });
    });
    const entries = [...unique.values()];
    let batch = [];
    let batchBytes = 32;
    for (const entry of entries) {
      const entryBytes = new TextEncoder().encode(JSON.stringify(entry)).byteLength + 1;
      if (batch.length && batchBytes + entryBytes > 800 * 1024) {
        await api('/v1/library', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ books: batch }) });
        batch = [];
        batchBytes = 32;
      }
      batch.push(entry);
      batchBytes += entryBytes;
    }
    if (batch.length) await api('/v1/library', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ books: batch }) });
  }

  async function flushDeletes() {
    const pending = storedDeletes();
    if (!pending.length) return;
    const failed = [];
    for (const id of pending) {
      try { await api('/v1/books/' + encodeURIComponent(id), { method: 'DELETE' }); }
      catch { failed.push(id); }
    }
    saveDeletes(failed);
  }

  async function syncNow() {
    if (!handlers) return;
    if (!API_BASE) { setStatus('unconfigured', 'Cloudflare 私有存储服务尚未配置'); return; }
    if (handlers.isEnabled && !handlers.isEnabled()) {
      const reason = handlers.disabledStatus?.() || 'disabled';
      setStatus(reason, reason === 'consent-required' ? '请在 GitHub 设置中同意书籍自动同步' : '阅读同步已关闭');
      return;
    }
    if (handlers.isReady && !handlers.isReady()) return;
    if (!readToken()) { session = null; setStatus('idle', '登录 GitHub 后自动同步书籍'); return; }
    if (!navigator.onLine) { setStatus('offline', '离线中，联网后自动同步'); return; }
    if (activeSync) return activeSync;
    activeSync = (async () => {
      setStatus('syncing', '正在同步书籍与阅读进度…');
      await flushDeletes();
      const response = await api('/v1/library');
      const payload = await response.json();
      const remoteBooks = Array.isArray(payload.books) ? payload.books.slice(0, 80) : [];
      const remoteDeleted = new Set((Array.isArray(payload.deleted) ? payload.deleted : []).map((item) => String(item?.id || '')).filter(Boolean));
      const allLocalBooks = (handlers.getBooks?.() || []).filter((book) => book?.id).slice(0, 80);
      const localBooks = [];
      const deferredDeletedBooks = [];
      for (const book of allLocalBooks) {
        if (!remoteDeleted.has(book.id)) { localBooks.push(book); continue; }
        if (handlers.isBookOpen?.(book.id)) { deferredDeletedBooks.push(book); continue; }
        localHashCache.delete(book.id);
        await handlers.deleteLocalBook?.(book.id);
      }
      const localById = new Map(localBooks.map((book) => [book.id, book]));
      const remoteById = new Map(remoteBooks.map((book) => [book.id, book]));
      const mergedById = new Map();
      const remoteMetadataWrites = [];
      const uploadTasks = [];
      for (const remote of remoteBooks) {
        const id = remote.id;
        const local = localById.get(id) || null;
        const merged = mergeBook(local, remote);
        mergedById.set(id, merged);
        const localFile = local ? await localFileHash(local) : { size: 0, hash: '' };
        let localBytes = null;
        const localHash = localFile.hash;
        const remoteHash = String(remote.file?.sha256 || '').toLowerCase();
        const localNewer = Boolean(local && metadataTimestamp(local) > Number(remote.updatedAt || remote.metadata?.updatedAt || 0));
        const localProgressNewer = Boolean(local && progressTimestamp(local) > Number(remote.progressUpdatedAt || 0));

        if (remote.file && remoteHash && localHash !== remoteHash) {
          if (local && localNewer && localHash) {
            merged.size = localFile.size;
            uploadTasks.push({ id, book: local });
          }
          else {
            try {
              const bytes = await downloadBook(id, remote, merged);
              localBytes = bytes;
              merged.size = bytes.byteLength;
              await rememberLocalHash(merged, bytes);
            } catch (error) {
              if (!localBytes && String(error?.message || '').includes('云端原书文件缺失')) merged.syncFileMissing = true;
              else throw error;
            }
          }
        } else if (!remote.file && local && localHash) {
          merged.size = localFile.size;
          uploadTasks.push({ id, book: local });
        }
        if (local && localNewer && localHash) merged.size = localFile.size;
        if (local && remote.file && localHash && localHash === remoteHash) merged.size = localFile.size;

        if (localNewer || localProgressNewer || (local && JSON.stringify(bookMetadata(local)) !== JSON.stringify(bookMetadata(merged)))) remoteMetadataWrites.push(merged);
      }

      for (const local of localBooks) {
        if (remoteById.has(local.id)) continue;
        const localFile = await localFileHash(local);
        const copy = { ...local };
        if (localFile.hash) copy.size = localFile.size;
        mergedById.set(local.id, copy);
        remoteMetadataWrites.push(copy);
        if (localFile.hash) uploadTasks.push({ id: local.id, book: local });
      }
      deferredDeletedBooks.forEach((book) => mergedById.set(book.id, book));

      if (remoteMetadataWrites.length) await writeRemoteMetadata(remoteMetadataWrites);
      for (let index = 0; index < uploadTasks.length; index += 2) {
        await Promise.all(uploadTasks.slice(index, index + 2).map(async ({ id, book }) => {
          const bytes = await getLocalBytes(book);
          if (!bytes) throw Error('本机缺少书籍原文件：' + (book.name || id));
          return uploadBook(id, bytes);
        }));
      }
      const mergedBooks = [...mergedById.values()].sort((left, right) => Number(right.order || 0) - Number(left.order || 0) || Number(right.lastOpenedAt || right.createdAt) - Number(left.lastOpenedAt || left.createdAt));
      await handlers.applyRemoteBooks(mergedBooks);
      lastSyncAt = Date.now();
      setStatus('success', '书籍与阅读进度已同步');
      return { bookCount: mergedBooks.length, lastSyncAt };
    })().catch((error) => {
      const message = error?.message || '云端同步失败';
      setStatus(navigator.onLine ? 'error' : 'offline', navigator.onLine ? message : '离线中，联网后自动同步');
      return { error: message };
    }).finally(() => { activeSync = null; });
    return activeSync;
  }

  function scheduleSync(delay = 1800) {
    clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => { syncTimer = 0; void syncNow(); }, delay);
  }

  window.OneBoxReaderCloudSync = {
    configure(nextHandlers) {
      handlers = nextHandlers;
      if (!API_BASE) setStatus('unconfigured', 'Cloudflare 私有存储服务尚未配置');
      else setStatus(lastStatus.state, lastStatus.message);
    },
    queueSync: scheduleSync,
    syncNow,
    markDeleted,
    invalidateSession() { session = null; sessionGithubToken = ''; },
    status: () => lastStatus,
    isConfigured: () => Boolean(API_BASE),
    getLastSyncAt: () => lastSyncAt,
  };

  window.addEventListener('online', () => scheduleSync(500));
  window.addEventListener('focus', () => { if (Date.now() - lastSyncAt > 60_000) scheduleSync(500); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - lastSyncAt > 60_000) scheduleSync(500); });
  window.setInterval(() => { if (!document.hidden && readToken() && Date.now() - lastSyncAt > 60_000) scheduleSync(400); }, 60_000);
})();
