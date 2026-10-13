/* Reader sync reuses the complete per-user GitHub Gist backup. */
(() => {
  'use strict';
  let handlers = null;
  let lastStatus = { state: 'idle', message: '登录 GitHub 后自动同步到个人 Gist' };

  function connected() {
    try { return Boolean(JSON.parse(localStorage.getItem('onebox.github') || '{}').token); } catch { return false; }
  }
  function status(next) {
    lastStatus = { ...lastStatus, ...(next || {}) };
    handlers?.onStatus?.(lastStatus);
  }
  function queueSync(delay = 1800) {
    if (!connected()) {
      status({ state: 'idle', message: '登录 GitHub 后自动同步到个人 Gist' });
      return;
    }
    if (window.OneBoxGithubAutoSync?.enabled && !window.OneBoxGithubAutoSync.enabled()) {
      status({ state: 'paused', message: '自动同步已暂停' });
      return;
    }
    const readingEnabled = !handlers?.isEnabled || handlers.isEnabled();
    status(readingEnabled
      ? { state: navigator.onLine ? 'syncing' : 'offline', message: navigator.onLine ? '书籍与阅读进度同步到 GitHub Gist…' : '离线中，联网后同步到 GitHub Gist' }
      : { state: 'reading-disabled', message: '阅读内容未勾选同步' });
    // The shared Gist can still contain other selected groups when reading is
    // unchecked, so always let the account-wide sync queue run.
    window.OneBoxGithubAutoSync?.queue?.(delay);
  }

  window.OneBoxReaderCloudSync = {
    configure(nextHandlers) {
      handlers = nextHandlers;
      status({ state: connected() ? 'idle' : 'idle', message: connected() ? '已连接 GitHub Gist' : '登录 GitHub 后自动同步到个人 Gist' });
    },
    queueSync,
    syncNow: () => window.OneBoxGithubAutoSync?.syncNow?.({ restore: true }),
    markDeleted(ids = []) {
      try {
        const deleted = JSON.parse(localStorage.getItem('onebox.reader-deleted') || '{}');
        (Array.isArray(ids) ? ids : []).forEach((id) => {
          const key = String(id || '').trim();
          if (key) deleted[key] = Date.now();
        });
        localStorage.setItem('onebox.reader-deleted', JSON.stringify(deleted));
      } catch { /* keep the library deletion usable if storage is unavailable */ }
      queueSync(700);
    },
    invalidateSession() {},
    status: () => lastStatus,
    isConfigured: connected,
    getLastSyncAt: () => Number(localStorage.getItem('onebox.github-last-sync') || 0),
  };

  window.addEventListener('onebox:github-connected', () => queueSync(700));
  window.addEventListener('onebox:gist-sync-status', (event) => {
    if (handlers?.isEnabled && !handlers.isEnabled()) {
      status({ state: 'reading-disabled', message: '阅读内容未勾选同步' });
      return;
    }
    status(event.detail);
  });
  window.addEventListener('online', () => queueSync(700));
})();
