/* OneBox 2.0 — dependency-free, mobile-first PWA application layer. */
/* Pages deployment marker: staged ticket entry and coffee cup-label journal. */
const APP_VERSION = '2.18.590';
// The OAuth secret stays in the Cloudflare Worker. The browser only knows the
// public client id and receives the authorization result in the URL fragment,
// which is consumed immediately and never sent to a server.
const GITHUB_CLIENT_ID = 'Ov23ctkkhpGrGvqFTNhn';
const GITHUB_OAUTH_PROXY = 'https://onebox-github-oauth.secoder.workers.dev';
// Authentication providers stay separate from OneBox data ownership. Future
// providers can be added here and routed to their own identity adapters.
const ACCOUNT_LOGIN_PROVIDERS = Object.freeze([
  Object.freeze({ id: 'github', name: 'GitHub', detailKey: 'githubProviderBackupHint', enabled: true, connect: () => githubLogin() }),
  Object.freeze({ id: 'wechat', name: '微信', detailKey: 'accountProviderComingSoon', enabled: false }),
  Object.freeze({ id: 'apple', name: 'Apple', detailKey: 'accountProviderComingSoon', enabled: false }),
]);
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const uid = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
const pad = (value) => String(value).padStart(2, '0');
const today = new Date();
const STORAGE = {
  theme: 'onebox.theme',
  language: 'onebox.language',
  toolOrder: 'onebox.tool-order',
  calculator: 'onebox.calculator',
  devTools: 'onebox.dev-tools',
  translationHistoryOpen: 'onebox.translation-history-open',
  events: 'onebox.events',
  holidays: 'onebox.holidays',
  weatherCards: 'onebox.weather-cards',
  legacyWeather: 'onebox.weather',
  translationHistory: 'onebox.translation-history',
  notifications: 'onebox.notifications',
  library: 'onebox.library',
  readerProgress: 'onebox.reader-progress',
  readerPreferences: 'onebox.reader-preferences',
  readerLayout: 'onebox.reader-layout',
  homeFeeds: 'onebox.home-feeds',
  homeFeedRead: 'onebox.home-feed-read',
  homeFeedActive: 'onebox.home-feed-active',
  homeFeedOrder: 'onebox.home-feed-order',
  homeFeedVisibility: 'onebox.home-feed-visibility',
  homeFeedVisibilityMigration: 'onebox.home-feed-visibility-migration',
  layout: 'onebox.layout',
  toolActive: 'onebox.tool-active',
  notificationPreference: 'onebox.notification-preference',
  color: 'onebox.color',
  colorExplicit: 'onebox.color-explicit',
  topDisplay: 'onebox.top-display',
  footprint: 'onebox.footprint',
  openMode: 'onebox.open-mode',
  github: 'onebox.github',
  githubAgreement: 'onebox.github-agreement',
  githubSyncSelection: 'onebox.github-sync-selection',
  readerCloudAgreement: 'onebox.reader-cloud-agreement',
  navigation: 'onebox.navigation',
  navigationLocation: 'onebox.navigation-location',
  mascotPosition: 'onebox.mascot-position',
  mascotVisible: 'onebox.mascot-visible',
  mascotDisplayMode: 'onebox.mascot-display-mode',
  petProfile: 'onebox.pet-profile',
  ticketWallet: 'onebox.ticket-wallet',
  ticketWalletDisplayOrder: 'onebox.ticket-wallet-display-order',
  ticketWalletTypeFilter: 'onebox.ticket-wallet-type-filter',
  ticketWalletDiningKindFilter: 'onebox.ticket-wallet-dining-kind-filter',
  ticketWalletMemories: 'onebox.ticket-wallet-memories',
  ticketWalletMapCache: 'onebox.ticket-wallet-map-cache',
  ticketWalletDeleted: 'onebox.ticket-wallet-deleted',
};
const TOOL_DEFS = {
  calculator: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h8"/></svg>', key: 'calculator' },
  dev: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14"/></svg>', key: 'development' },
  calendar: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 9h16M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/></svg>', key: 'calendar' },
  weather: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>', key: 'weather' },
  translate: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 8 6l4 12M5.5 14h5M14 8h6M17 5v3M14 16h6M17 13v3"/></svg>', key: 'convert' },
  reader: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5.5c2.2-.9 4.6-.4 7.5 1.4v12.2c-2.9-1.8-5.3-2.3-7.5-1.4z"/><path d="M19.5 5.5c-2.2-.9-4.6-.4-7.5 1.4v12.2c2.9-1.8 5.3-2.3 7.5-1.4z"/><path d="M12 6.9v12.2"/></svg>', key: 'reader' },
  navigation: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.1 5-4.9 2 2-4.9 5-2.1Z"/></svg>', activeIcon: '<svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 12 2.5Zm4.55 6.32-2.19 5.47-5.36 2.2a.9.9 0 0 1-1.18-1.17l2.15-5.34 5.41-2.27a.9.9 0 0 1 1.17 1.11Z"/></svg>', key: 'navigation' },
};
// Homepage subscriptions live in one registry. Set enabled:false to retire a
// source without touching rendering, ordering, cache or interaction code.
// The fetchers are intentionally source-specific: using one RSS aggregator for
// every site was the reason several feeds lagged by hours and hit rate limits.
const FEED_SOURCE_REGISTRY = [
  { id: 'ithome', name: '之家', badge: 'IT', icon: 'icons/ithome.svg?v=2.18.170', className: 'ithome', mobileHost: 'm.ithome.com', visibleByDefault: true, siteUrl: 'https://www.ithome.com/', fetchers: [{ kind: 'rss', url: 'https://www.ithome.com/rss/' }, { kind: 'rss', url: 'https://www.ithome.com/rss', direct: true }] },
  { id: 'huxiu', name: '虎嗅', badge: '虎', icon: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/be/4c/7f/be4c7f2c-0ebc-7ba8-a60e-c5707c67b0ee/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/128x128bb.png', className: 'huxiu', mobileHost: 'm.huxiu.com', visibleByDefault: true, siteUrl: 'https://www.huxiu.com/', fetchers: [{ kind: 'rss', url: 'https://www.huxiu.com/rss/0.xml' }, { kind: 'rss', url: 'https://rsshub.rssforever.com/huxiu/article' }, { kind: 'rss', url: 'https://rsshub.app/huxiu/article' }] },
  { id: 'zhihu', name: '知乎', badge: '知', icon: 'https://www.zhihu.com/favicon.ico', className: 'zhihu', mobileHost: 'www.zhihu.com', visibleByDefault: true, siteUrl: 'https://www.zhihu.com/hot', fetchers: [{ kind: 'zhihu-hot', url: 'https://www.zhihu.com/api/v4/search/hot_search' }, { kind: 'zhihu-hot', url: 'https://www.zhihu.com/api/v4/search/hot_search?limit=50' }] },
  { id: 'v2ex', name: 'V站', badge: 'V', icon: 'https://www.v2ex.com/favicon.ico', className: 'v2ex', visibleByDefault: false, siteUrl: 'https://www.v2ex.com/?tab=all', fetchers: [{ kind: 'v2ex-latest', url: 'https://www.v2ex.com/api/topics/latest.json' }, { kind: 'rss', url: 'https://www.v2ex.com/index.xml' }] },
  { id: 'weibo', name: '微博', badge: '博', icon: 'icons/weibo.png?v=2.18.105', className: 'weibo', mobileHost: 'm.weibo.cn', visibleByDefault: false, siteUrl: 'https://s.weibo.com/top/summary?cate=realtimehot', fetchers: [{ kind: 'weibo-hot', url: 'https://baiapi.cn/api/weibo?type=json' }, { kind: 'weibo-hot-v2', url: 'https://weibo.com/ajax/side/hotSearch' }] },
  { id: 'bilibili', name: 'B站', badge: 'B', icon: 'icons/bilibili.ico?v=2.18.124', className: 'bilibili', mobileHost: 'm.bilibili.com', visibleByDefault: false, siteUrl: 'https://search.bilibili.com/all', fetchers: [{ kind: 'bilibili-hot', url: 'https://api.bilibili.com/x/web-interface/search/square?limit=30&platform=web' }, { kind: 'bilibili-hotword', url: 'https://s.search.bilibili.com/main/hotword' }] },
  // Guancha and Hupu currently need the reader proxy to bypass cross-origin and anti-bot responses.
  // Keep their longer source-specific budget so a healthy fallback is not discarded at 4.5 seconds.
  { id: 'guancha', name: '风闻', badge: '风', icon: 'icons/guancha.png?v=2.18.124', className: 'guancha', mobileHost: 'user.guancha.cn', visibleByDefault: true, siteUrl: 'https://user.guancha.cn/main/index?s=fwdhsy', fetchers: [{ kind: 'guancha-fengwen', url: 'https://user.guancha.cn/main/index-list.json?page=1&order=1', timeoutMs: 20000, deadlineMs: 24000 }, { kind: 'guancha-fengwen', url: 'https://rsshub.app/guancha/topic/0/1', timeoutMs: 20000, deadlineMs: 24000 }] },
  { id: 'hupu', name: '虎扑', badge: '虎', icon: 'icons/hupu.ico?v=2.18.124', className: 'hupu', mobileHost: 'm.hupu.com', visibleByDefault: true, siteUrl: 'https://bbs.hupu.com/bxj', fetchers: [{ kind: 'hupu-bbs', url: 'https://bbs.hupu.com/bxj', timeoutMs: 20000, deadlineMs: 24000 }, { kind: 'hupu-bbs', url: 'https://bbs.hupu.com/topic-daily', timeoutMs: 20000, deadlineMs: 24000 }] },
  { id: 'xiaohongshu', name: '红书', badge: '红', icon: 'https://www.xiaohongshu.com/favicon.ico?v=2.18.264', className: 'xiaohongshu', visibleByDefault: true, siteUrl: 'https://www.xiaohongshu.com/explore', fetchers: [{ kind: 'xiaohongshu-explore', url: 'https://www.xiaohongshu.com/explore' }, { kind: 'xiaohongshu-hotboard', url: 'https://uapis.cn/api/v1/misc/hotboard?type=xiaohongshu&limit=30', direct: true }] },
  { id: 'douyin', name: '抖音', badge: '音', icon: 'https://www.douyin.com/favicon.ico?v=2.18.264', className: 'douyin', visibleByDefault: true, siteUrl: 'https://www.douyin.com/jingxuan', fetchers: [{ kind: 'douyin-hotboard', url: 'https://uapis.cn/api/v1/misc/hotboard?type=douyin&limit=30', direct: true }, { kind: 'douyin-jingxuan', url: 'https://www.douyin.com/jingxuan' }] },
  { id: 'thepaper', name: '澎湃', badge: '澎', icon: 'https://m.thepaper.cn/_next/static/media/logo.8d76cf45.png?v=2.18.334', className: 'thepaper', mobileHost: 'm.thepaper.cn', visibleByDefault: true, siteUrl: 'https://m.thepaper.cn/', fetchers: [{ kind: 'thepaper-channel', url: 'https://www.thepaper.cn/channel_25950', timeoutMs: 15000, deadlineMs: 18000 }] },
  { id: 'jiemian', name: '界面', badge: '面', icon: 'https://www.jiemian.com/favicon.ico?v=2.18.334', className: 'jiemian', mobileHost: 'www.jiemian.com', visibleByDefault: true, siteUrl: 'https://www.jiemian.com/lists/4.html', fetchers: [{ kind: 'jiemian-newsflash', url: 'https://www.jiemian.com/lists/1323kb.html', timeoutMs: 15000, deadlineMs: 18000 }] },
];
const RSS_SOURCES = FEED_SOURCE_REGISTRY.filter((source) => source.enabled !== false);
const RSS_REFRESH_INTERVAL = 2 * 60 * 1000;
const HOME_FEED_PENDING_LIMIT = 30;
// Keep the feed deadline long enough for the reader proxy to return fresh
// content. The former 2.6/3 second cut-off made the active source look stale
// even when its fallback was healthy, especially on mobile Safari.
const HOME_FEED_REQUEST_TIMEOUT_MS = 4500;
const HOME_FEED_SOURCE_DEADLINE_MS = 5500;
const HOME_FEED_CONCURRENCY = 6;
const HOME_FEED_RENDER_LIMIT = 80;
const RSS_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const RSS_MAX_ITEMS_PER_SOURCE = 120;
function boundedHomeFeedIdMap(value, limit = HOME_FEED_PENDING_LIMIT) {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).map(([sourceId, ids]) => [sourceId, Array.isArray(ids) ? [...new Set(ids)].slice(-limit) : []]));
}
const DEFAULT_HOME_FEED_ORDER = RSS_SOURCES.map((source) => source.id);
const DEFAULT_HOME_FEED_VISIBLE = RSS_SOURCES.filter((source) => source.visibleByDefault !== false).map((source) => source.id);
const NAVIGATION_SESSION_KEY = 'onebox-navigation-position';
const DEFAULT_TOOL_ORDER = Object.keys(TOOL_DEFS).filter((id) => id !== 'navigation');
const nav = $('#toolNav');
const workspace = $('#workspace');
const pageSwipeStage = document.createElement('div');
pageSwipeStage.id = 'pageSwipeStage';
pageSwipeStage.className = 'page-swipe-stage';
workspace.parentNode.insertBefore(pageSwipeStage, workspace);
pageSwipeStage.appendChild(workspace);
const homeSourceNav = document.createElement('nav');
homeSourceNav.id = 'homeSourceNav';
homeSourceNav.setAttribute('aria-label', '首页来源切换');
pageSwipeStage.parentNode.insertBefore(homeSourceNav, pageSwipeStage);
const parseStored = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const GITHUB_CUSTOM_SYNC_DEFAULTS = Object.freeze({ settings: true, navigation: true, reading: true, messages: true, calendar: true, weather: true, translation: true, calculator: true, ticketWallet: true });
function normalizeGithubSyncSelection(value) {
  const source = value && typeof value === 'object' ? value : {};
  return Object.fromEntries(Object.keys(GITHUB_CUSTOM_SYNC_DEFAULTS).map((key) => [key, source[key] !== false]));
}
function readGithubSyncSelection() { return normalizeGithubSyncSelection(parseStored(STORAGE.githubSyncSelection, GITHUB_CUSTOM_SYNC_DEFAULTS)); }
function saveGithubSyncSelection() { saveStored(STORAGE.githubSyncSelection, state.githubSyncSelection); }
const GITHUB_CUSTOM_SYNC_STORAGE_KEYS = Object.freeze({
  settings: new Set([STORAGE.theme, STORAGE.language, STORAGE.layout, STORAGE.color, STORAGE.colorExplicit, STORAGE.topDisplay, STORAGE.footprint, STORAGE.mascotVisible, STORAGE.mascotDisplayMode, STORAGE.mascotPosition, STORAGE.petProfile]),
  navigation: new Set([STORAGE.toolOrder, STORAGE.navigation, STORAGE.navigationLocation, STORAGE.openMode, STORAGE.homeFeedOrder, STORAGE.homeFeedVisibility]),
  reading: new Set([STORAGE.readerPreferences, STORAGE.readerLayout, STORAGE.homeFeedRead]),
  messages: new Set([STORAGE.notifications, STORAGE.notificationPreference]),
  calendar: new Set([STORAGE.events]),
  weather: new Set([STORAGE.weatherCards, STORAGE.legacyWeather]),
  translation: new Set([STORAGE.translationHistory, STORAGE.translationHistoryOpen]),
  calculator: new Set([STORAGE.calculator]),
  ticketWallet: new Set([STORAGE.ticketWallet, STORAGE.ticketWalletDisplayOrder, STORAGE.ticketWalletTypeFilter, STORAGE.ticketWalletMemories, STORAGE.ticketWalletMapCache, STORAGE.ticketWalletDeleted]),
});
const GITHUB_SYNC_GROUP_FIELDS = Object.freeze({
  settings: ['theme', 'color', 'languageMode', 'language', 'layoutMode', 'topDisplay', 'footprint', 'mascotVisible', 'mascotDisplayMode', 'mascotPosition', 'petProfile'],
  navigation: ['toolOrder', 'homeFeedOrder', 'homeFeedVisibility', 'navigation', 'navigationLocation', 'openMode'],
  reading: ['library', 'readerPreferences', 'readerLayout', 'homeFeedRead', 'readerFiles'],
  messages: ['notifications', 'notificationPreference'],
  calendar: ['events'],
  weather: ['weatherCards'],
  translation: ['translationHistory', 'translationHistoryOpen'],
  calculator: ['calculator'],
  ticketWallet: ['ticketWalletFiles'],
});
function githubSyncCustomGroupForStorageKey(key) {
  return Object.entries(GITHUB_CUSTOM_SYNC_STORAGE_KEYS).find(([, keys]) => keys.has(key))?.[0] || '';
}
function githubSyncCustomGroupEnabled(group, selection = state.githubSyncSelection) { return Boolean(group) && selection?.[group] !== false; }
function githubSyncStorageKeyEnabled(key, selection = state.githubSyncSelection) {
  return githubSyncCustomGroupEnabled(githubSyncCustomGroupForStorageKey(key), selection);
}
let persistenceTimer = null;
let persistentRecovery = null;
let oneBoxDbPromise = null;
function openOneBoxDb() {
  if (oneBoxDbPromise || !window.indexedDB) return oneBoxDbPromise;
  oneBoxDbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('onebox-local-data', 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('snapshot')) db.createObjectStore('snapshot');
      if (!db.objectStoreNames.contains('books')) db.createObjectStore('books');
      if (!db.objectStoreNames.contains('book-covers')) db.createObjectStore('book-covers');
      if (!db.objectStoreNames.contains('ticket-images')) db.createObjectStore('ticket-images');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || Error('IndexedDB unavailable'));
  }).catch(() => null);
  return oneBoxDbPromise;
}
async function oneBoxDbGet(storeName, key) {
  const db = await openOneBoxDb();
  if (!db) return null;
  return new Promise((resolve) => {
    const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => resolve(null);
  });
}
async function oneBoxDbPut(storeName, key, value) {
  const db = await openOneBoxDb();
  if (!db) return false;
  return new Promise((resolve) => {
    let transaction;
    try {
      transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(value, key);
    } catch { resolve(false); return; }
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = transaction.onabort = () => resolve(false);
  });
}
async function oneBoxDbPutBatch(entriesByStore) {
  const db = await openOneBoxDb();
  if (!db) return false;
  const stores = Object.keys(entriesByStore || {}).filter((name) => db.objectStoreNames.contains(name));
  if (!stores.length) return false;
  return new Promise((resolve) => {
    let transaction;
    try {
      transaction = db.transaction(stores, 'readwrite');
      stores.forEach((name) => {
        const store = transaction.objectStore(name);
        (entriesByStore[name] || []).forEach(([key, value]) => store.put(value, key));
      });
    } catch { resolve(false); return; }
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = transaction.onabort = () => resolve(false);
  });
}
async function oneBoxDbDelete(storeName, key) {
  const db = await openOneBoxDb();
  if (!db) return false;
  return new Promise((resolve) => {
    let transaction;
    try {
      transaction = db.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(key);
    } catch { resolve(false); return; }
    transaction.oncomplete = () => resolve(true);
    transaction.onerror = transaction.onabort = () => resolve(false);
  });
}
const ticketWalletImageCache = new Map();
async function ticketWalletImagePut(id, file) {
  if (!id || !file) return false;
  const saved = await oneBoxDbPut('ticket-images', id, { blob: file, name: file.name || '', type: file.type || 'application/octet-stream', savedAt: Date.now() });
  if (saved) {
    const old = ticketWalletImageCache.get(id);
    if (old?.src) URL.revokeObjectURL(old.src);
    ticketWalletImageCache.delete(id);
    const src = file.type?.startsWith('image/') ? URL.createObjectURL(file) : '';
    ticketWalletImageCache.set(id, { src, name: file.name || '', type: file.type || '' });
  }
  return saved;
}
async function ticketWalletImageGet(id) {
  if (!id) return null;
  const cached = ticketWalletImageCache.get(id);
  if (cached) return cached;
  const value = await oneBoxDbGet('ticket-images', id);
  if (!value?.blob) return null;
  const result = { src: value.type?.startsWith('image/') ? URL.createObjectURL(value.blob) : '', name: value.name || '', type: value.type || '' };
  ticketWalletImageCache.set(id, result);
  return result;
}
async function ticketWalletImageDelete(id) {
  if (!id) return;
  const cached = ticketWalletImageCache.get(id);
  if (cached?.src) URL.revokeObjectURL(cached.src);
  ticketWalletImageCache.delete(id);
  await oneBoxDbDelete('ticket-images', id);
}
async function writePersistentSnapshot() {
  if (persistentRecovery) await persistentRecovery;
  const values = {};
  Object.values(STORAGE).forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null) values[key] = value;
  });
  await oneBoxDbPut('snapshot', 'app', { version: 1, savedAt: Date.now(), values });
}
function queuePersistentSnapshot() {
  clearTimeout(persistenceTimer);
  persistenceTimer = setTimeout(() => { writePersistentSnapshot(); }, 180);
}
const saveStored = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); queuePersistentSnapshot(); } catch { /* private mode can deny storage */ }
};
async function restorePersistentSnapshot() {
  const snapshot = await oneBoxDbGet('snapshot', 'app');
  const auth = await oneBoxDbGet('snapshot', 'github-auth');
  const readerBackup = await oneBoxDbGet('snapshot', 'reader-library');
  const readerCheckpoints = await oneBoxDbGet('snapshot', 'reader-progress');
  const values = { ...(snapshot?.values || {}) };
  // An explicit signed-out record also overrides an older full snapshot.
  if (auth?.value) values[STORAGE.github] = auth.value;
  if (readerBackup?.value) values[STORAGE.library] = readerBackup.value;
  if (readerCheckpoints?.value) values[STORAGE.readerProgress] = readerCheckpoints.value;
  let restored = false;
  Object.entries(values).forEach(([key, value]) => {
    if (localStorage.getItem(key) === null) {
      try { localStorage.setItem(key, value); restored = true; } catch { /* private mode can deny storage */ }
    }
  });
  return restored;
}
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const dateKey = (date) => {
  const value = new Date(date);
  return String(value.getFullYear()) + '-' + pad(value.getMonth() + 1) + '-' + pad(value.getDate());
};
const dateFromKey = (key) => new Date(String(key) + 'T12:00:00');
const localDateTimeValue = (date) => { const value = new Date(date); return dateKey(value) + 'T' + pad(value.getHours()) + ':' + pad(value.getMinutes()) + ':' + pad(value.getSeconds()); };
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const toast = (message, kind = 'info', options = {}) => {
  let node = $('#toast');
  if (!node) {
    node = document.createElement('div');
    node.id = 'toast';
    node.setAttribute('role', 'status');
    document.body.append(node);
  }
  node.innerHTML = '<span class="toast-copy">' + escapeHtml(message) + '</span><button type="button" class="toast-close" aria-label="Close">×</button>';
  node.dataset.kind = kind;
  node.classList.add('visible');
  node.onclick = (event) => { if (event.target.closest('.toast-close')) node.classList.remove('visible'); };
  clearTimeout(toast.timer);
  if (!options.persistent) toast.timer = setTimeout(() => node.classList.remove('visible'), 4200);
};

const DICT = {
  zh: {
    calculator: '计算', development: '开发', calendar: '日历', weather: '天气', convert: '转换', unitConvert: '换算', translate: '翻译', translateConvert: '转换', reader: '阅读',
    online: '在线', offline: '离线', install: '安装应用', settings: '设置', notifications: '消息提示',
    heroSubtitle: '快速、清爽、可离线。你的数据优先保存在当前设备。',
    calculatorDesc: '支持括号、百分比、科学函数和键盘输入，并自动保留最近计算记录。',
    calendarDesc: '公历、农历、节气、节假日、补班和个人日程集中查看。',
    weatherDesc: '搜索区县，查看实时、小时级和未来 15 天天气趋势。',
    convertDesc: '常用单位换算',
    developmentDesc: 'JSON、文本和时间工具，记录保存在本机。', devJsonFormat: 'JSON 格式化', devJsonCompare: 'JSON 对比', devTextStats: '文本统计', devTimestamp: '时间戳', devInput: '输入', devOutput: '输出', devFormat: '格式化', devMinify: '压缩', devCompare: '开始对比', devAnalyze: '统计文本', devConvert: '转换时间', devSaveRecord: '保存记录', devClear: '清空', devCopy: '复制结果', devExample: '示例', devRecords: '历史记录', devNoRecords: '还没有记录', devReuseHint: '点击记录即可复用', devJsonA: 'JSON A', devJsonB: 'JSON B', devValid: 'JSON 有效', devInvalid: 'JSON 格式有误', devSame: '两份 JSON 相同', devDifferent: '发现 {count} 处差异', devCharacters: '字符', devNonSpace: '非空格字符', devLines: '行数', devChinese: '中文字符', devWords: '单词', devParagraphs: '段落', devTimestampToDate: '时间戳 → 日期', devDateToTimestamp: '日期 → 时间戳', devSeconds: '秒', devMilliseconds: '毫秒', devNow: '当前时间', devUnescape: '去转义', devExpandAll: '全部展开', devCollapseAll: '全部折叠', devFullscreen: '全屏', devExitFullscreen: '退出全屏',
    translateDesc: '快速翻译，结果保存在本机',
    recentCalculations: '最近计算', clear: '清除', ready: '完成的计算会显示在这里。',
    scientific: '科学计算', collapse: '收起', expand: '展开', degree: '度', radian: '弧度',
    keyboard: '键盘：数字、+ − × ÷、括号、Enter 等号、Esc 清空',
    today: '今天', off: '休', work: '补班', normalCalendar: '工作日历',
    legalHoliday: '法定休息', makeUpWorkday: '补班', solarTerm: '节气', selectedDay: '选中日期',
    noAgenda: '这一天还没有安排。', agenda: '日程', addAgenda: '新增日程', newReminder: '新增日程', eventContent: '日程内容', eventPlaceholder: '请输入你的日程信息', addEvent: '添加日程', addToDay: '添加日程', eventDate: '日期', eventTime: '时间', eventDateTime: '选择提醒时间', reminderSchedule: '提醒日程', eventRepeat: '重复方式',
    noteOptional: '备注（可选）', weatherSearch: '搜索', currentLocation: '当前位置',
    refresh: '刷新', searchPlace: '搜索城市或区县',
    noWeather: '天气需要联网，搜索一个城市或区县开始。', weatherLoading: '正在获取天气…', weatherLoadFailed: '天气获取失败，点击卡片重试。',
    weatherData: '数据来自 Open-Meteo，最近更新 {time}，离线可查看。', weatherHourlyRepairing: '逐小时预报数据不完整，正在重新获取…',
    sortWeather: '', hourly: '36 小时', daily: '前 3 天 · 今天 · 未来 15 天', advice: '天气建议',
    commute: '出行', sport: '运动', clothing: '穿衣', sunscreen: '防晒', hiking: '爬山', windAdvice: '风力建议', windLevel: '风力', elevation: '海拔',
    addCard: '添加', noResults: '没有找到匹配地点，请换个关键词。',
    home: '首页', tools: '工具', navigation: '导航', messages: '消息', mine: '我的', quickTools: '常用工具', openSettings: '打开设置', noMessages: '还没有消息。', homeTabs: '首页', homeTabsSelected: '已选择 {count} 项', homeSourceManage: '首页来源', homeSourceManageHint: '选择要显示在首页导航中的来源', homeSourceAdd: '添加', homeSourceRemove: '移除', homeSourceEmpty: '暂时没有其他来源',
    ticketWallet: '卡包', ticketWalletDescription: '出行票据、电影票、门票和餐饮记录都收进卡包。', ticketWalletTickets: '票据', ticketWalletJourneys: '旅迹', ticketWalletAdd: '手动添加', ticketWalletAddTicket: '添加票据', ticketWalletAddShort: '添加', ticketWalletImport: '导入票据', ticketWalletImportImage: '导入截图 / 扫描件', ticketWalletImportJson: '导入票据数据', ticketWalletEmpty: '把第一张票放进来，旅程会从这里开始。', ticketWalletCount: '票据', ticketWalletUpcoming: '待出行', ticketWalletJourneyCount: '旅迹', ticketWalletEditor: '票据详情', ticketWalletSave: '保存票据', ticketWalletCancel: '取消', ticketWalletType: '票种', ticketWalletTrain: '火车票', ticketWalletFlight: '机票', ticketWalletFerry: '船票', ticketWalletOther: '其他票据', ticketWalletTitle: '票据名称', ticketWalletCarrier: '承运方', ticketWalletFrom: '出发地', ticketWalletTo: '目的地', ticketWalletDepart: '出发时间', ticketWalletArrive: '到达时间', ticketWalletTicketNo: '票号 / 订单号', ticketWalletTrainNo: '车次', ticketWalletSerial: '票号', ticketWalletPrice: '票价', ticketWalletSeatClass: '席别', ticketWalletPassengerInfo: '乘客信息', ticketWalletPassengerName: '乘车人姓名', ticketWalletPassengerId: '证件号码', ticketWalletCode: '票据编码', ticketWalletSeat: '座位 / 舱位', ticketWalletPassenger: '乘客', ticketWalletJourney: '旅迹名称', ticketWalletNotes: '备注', ticketWalletOriginal: '原始票据', ticketWalletRecognizeAgain: '重新识别', ticketWalletEdit: '编辑', ticketWalletDelete: '删除', ticketWalletDeleteConfirm: '确定删除这张票据吗？', ticketWalletMemory: '旅行回忆', ticketWalletAddMemory: '添加回忆', ticketWalletEditMemory: '编辑回忆', ticketWalletMemoryTitle: '回忆标题', ticketWalletMemoryDescription: '写下这段旅程', ticketWalletMemorySave: '保存回忆', ticketWalletShare: '分享旅迹', ticketWalletApple: '导入 Apple 钱包', ticketWalletAppleHint: '普通截图不能直接导入 Apple 钱包；需要有效的 .pkpass 票券。', ticketWalletNoJourney: '还没有可展示的旅迹。', ticketWalletSourceReady: '已保留原图', ticketWalletSourceMissing: '原图未加载', ticketWalletAdded: '票据已加入卡包', ticketWalletSaved: '票据已保存', ticketWalletDeleted: '票据已删除', ticketWalletMemorySaved: '回忆已保存', ticketWalletNeedRoute: '请至少填写出发地和目的地', ticketWalletAppleDownloaded: '原始 Apple 票券已下载',
    navigationTitle: '网站导航', navigationHint: '点击卡片显示操作，长按可以拖动排序或聚合文件夹。', navigationToolbarHint: '长按编辑 · 拖动聚合', navigationAdd: '添加网站', navigationEmpty: '还没有网站，先添加一个常用网址吧。', navigationUrl: '网站地址', navigationUrlPlaceholder: '粘贴或输入网址', navigationName: '网站名称', navigationNamePlaceholder: '可选，默认使用网站名称', navigationIcon: '网站图标', navigationIconHint: '输入网址后自动获取', navigationSave: '保存网站', navigationEdit: '编辑网站', navigationEditSave: '保存修改', navigationActionEdit: '编辑', navigationActionDelete: '删除', navigationActionCancel: '取消', navigationFolderEdit: '编辑文件夹', navigationAddToFolder: '添加到文件夹', navigationFolder: '文件夹', navigationFolderName: '文件夹名称', navigationFolderPlaceholder: '例如：工作、阅读', navigationCreateFolder: '新建文件夹', navigationSaveFolder: '保存文件夹', navigationFolderAdd: '添加网站', navigationFolderDelete: '解散文件夹', navigationFolderDeleteConfirm: '解散文件夹后，里面的网站会保留在导航中，确定解散文件夹吗？', navigationFolderDissolved: '文件夹已解散', navigationFolderEmpty: '文件夹还是空的，添加几个网站吧。', navigationRemove: '删除', navigationOpen: '打开网站', navigationSettings: '导航设置', navigationOpenModeHint: '网站打开方式', navigationOpenModeCurrent: '当前页', navigationOpenModeNewTab: '新标签页', navigationAlreadyExists: '这个网站已经添加过了', navigationInvalidUrl: '请输入有效的 http 或 https 地址', navigationDropHint: '松开后聚合为文件夹', navigationFolderCreated: '文件夹已创建', navigationAdded: '网站已添加', navigationDeleted: '网站已删除', navigationMoved: '网站已移入文件夹', navigationOrderSaved: '导航顺序已保存', navigationSiteCount: '{count} 个网站',
    allFeeds: '全部', feedRefresh: '刷新', feedLoading: '正在加载信息流…', feedEmpty: '暂时没有可显示的内容。', feedUpdated: '更新于', feedLastRefresh: '上次成功刷新', feedNewItems: '刷新后新增', feedShowNew: '只看新增', feedShowAll: '显示全部', feedTabNew: '新增', feedOpen: '打开原文', feedPartial: '部分订阅源暂时不可用', feedProxyHint: '内容来自公开 RSS 订阅，首页每个来源最多保留 120 条或 7 天内内容。', feedLoadMore: '查看更早内容', feedTabPrevious: '查看前面的首页 Tab', feedTabNext: '查看后面的首页 Tab',
    converterType: '换算类型', from: '从', to: '到', result: '结果', swap: '交换单位', copyResult: '复制结果',
    copied: '已复制', translationInput: '输入待翻译内容', translateNow: '开始翻译', saveTranslation: '保存到本机',
    source: '源语言', target: '目标语言', translationResult: '翻译结果', translationHistory: '最近翻译',
    noTranslation: '翻译结果会显示在这里。', noHistory: '还没有保存翻译。',
    githubSync: 'GitHub 云同步', githubDialogSubtitle: '跨设备同步', githubDescription: '将本机设置、阅读数据、书籍和卡包保存到你的私有 Gist。', githubNotConnectedHint: '连接私有 Gist，同步设置、导航、阅读、消息和卡包。', githubConnectedHint: '同步设置、导航、阅读、消息和卡包等数据', githubCustomSync: '自定义同步内容', githubCustomSyncHint: '勾选可同步，不勾选不同步', githubOptionSettings: '设置', githubOptionNavigation: '导航', githubOptionReading: '阅读', githubOptionMessages: '消息', githubOptionCalendar: '日程', githubOptionWeather: '天气', githubOptionTranslation: '翻译', githubOptionCalculator: '计算器', githubOptionTicketWallet: '卡包', githubAgreementCheck: '我已阅读并同意', githubAgreementRequired: '请先阅读并同意用户协议后再登录 GitHub。',
    githubClientId: 'GitHub OAuth Client ID', githubClientHint: 'OneBox 已内置公开的授权标识，不需要手动配置。', githubDeveloperSettings: '打开 OAuth Apps 设置',
    githubBrowserFlowError: '无法打开 GitHub 授权页，请检查网络后重试。', githubNetworkError: '无法连接 GitHub API，请检查网络或稍后重试。', githubAccessToken: 'GitHub 访问令牌', githubTokenHint: '令牌只保存在当前设备，需要 gist 权限。', githubUseToken: '使用访问令牌连接', githubTokenMissing: '请先填写 GitHub 访问令牌。', githubTokenInvalid: '访问令牌无效或没有可用权限。', githubTokenConnected: 'GitHub 已连接', githubWaiting: '等待 GitHub 授权…', githubCancel: '取消授权',
    githubSyncScopeTitle: '同步内容', githubSyncScope: '设置、导航、阅读、书籍和卡包（含原件）。', githubSyncPrivacy: '令牌和首页网络缓存不会同步。', githubAuthHint: '授权后会自动返回 OneBox。', githubUploadHint: '保存本机最新数据', githubDownloadHint: '恢复最近备份', githubConnectHint: '授权后开启同步', githubLogoutHint: '仅断开本机连接', githubBackgroundHint: '关闭窗口也会继续。',
    githubLogin: '连接 GitHub', githubLogout: '退出登录', githubBackup: '备份到云端', githubRestore: '恢复到本地', upload: '上传到 GitHub', download: '从 GitHub 恢复', githubAuthExpired: 'GitHub 授权已失效，请重新连接 GitHub。', githubSyncNotFound: '当前 GitHub 账号中没有找到 OneBox 同步数据，请先在另一台设备上传。', githubSyncReadFailed: 'GitHub 中的 OneBox 同步文件无法读取，请检查 Gist 权限或内容。', githubSyncMalformed: 'GitHub 中的 OneBox 同步文件不是有效的 JSON。', githubSyncInvalidData: 'GitHub 中的 OneBox 同步数据格式错误或已损坏。',
    githubConnected: '已连接', githubNotConnected: '尚未连接', openDevice: '打开验证页面',
    appUpdate: '应用更新', checkUpdate: '更新', updateAvailable: '发现有新版本', upToDate: '已是最新版', updating: '检查中', updateApplying: '更新中', updateCheckFailed: '检查失败，可重试', applyUpdate: '更新',
    notificationsPermission: '消息通知', enableNotifications: '允许通知', disableNotifications: '不允许通知', notificationDescription: 'iPhone 需要先将 OneBox 添加到主屏幕并允许消息通知；应用关闭后的后台提醒仍需要 Push 服务端。',
    userAgreement: '用户协议', viewAgreement: '查看协议', agreementTitle: 'OneBox 用户协议', agreementIntro: 'OneBox 是一款本地优先的日常工具应用，主要功能在当前设备上运行。', agreementLocal: '本地数据：计算历史、日程、天气卡片、翻译历史、通知记录、阅读书架、阅读进度和笔记等，默认保存在当前设备。你可以在应用内删除对应记录或文档。', agreementNetwork: '网络服务：首页订阅源、天气和翻译会请求对应的第三方或开源服务；首页文章来自公开订阅源，内容、时效和可用性由来源网站决定。点击文章会打开来源网站，OneBox 不控制第三方页面的登录、广告或隐私规则。', agreementGithub: '云同步：GitHub 同步数据写入你自己的私有 Gist。若启用阅读自动同步，书籍原文件和阅读进度会保存到 OneBox 阅读同步服务所在 Cloudflare 账户的私有存储；文件不公开，访问令牌仅用于验证身份，不保存到服务端。你可以在 GitHub 设置中关闭阅读同步。', agreementPermissions: '权限说明：定位仅用于查找当前位置天气；通知仅用于提醒日程和消息；文件选择仅用于导入本地阅读文档。未授权时，相应功能不会正常工作，但不影响其他功能。', agreementDisclaimer: '使用提示：天气、翻译、订阅源和第三方网页可能因网络、服务策略或接口变化而暂时不可用。请勿将不适合上传到 GitHub Gist 或所配置 Cloudflare 私有存储的敏感文件用于同步。', agreementUpdated: '最后更新',
    addReminder: '添加提醒', reminderText: '提醒内容', remindAt: '提醒时间', noNotifications: '还没有提醒。', once: '指定时间', everyDay: '每天', workdays: '工作日', restdays: '非工作日', weekly: '每周', weekdays: '重复星期',
    markRead: '全部已读', close: '关闭', system: '跟随系统', light: '浅色', dark: '深色', darkGray: '黑灰',
    layout: '布局', classicLayout: '经典布局', simpleLayout: '简约布局', navigationLocation: '导航位置', navigationLocationMain: '主导航', navigationLocationTools: '工具 Tab', openMode: '打开方式', openCurrent: '当前页打开', openNewTab: '新标签页打开', language: '语言', theme: '主题', color: '颜色', blackWhite: '黑白配', noblePurple: '贵族紫', skyBlue: '天空蓝', notBananaGreen: '不蕉绿', meituanYellow: '美团黄', topDisplay: '顶部显示', footprint: '足迹', showFootprint: '在首页显示', hideFootprint: '不在首页显示', mascot: '宠物', petDescription: '显示方式、等级、服饰与互动', petSettings: '宠物设置', showMascot: '显示宠物', hideMascot: '隐藏宠物', mascotDisplay: '宠物显示', mascotFullBody: '显示全身', mascotHalfBody: '显示半身', petSocialTitle: '社交宠物', petLevel: 'Lv.{level} · {name}', petPoints: '{points} 积分', petNextLevel: '距离下一级还差 {points} 积分', petMaxLevel: '已达到最高等级', petOwner: '绑定：{owner}', petLocalOwner: '当前设备', petGithubOwner: 'GitHub · {owner}', petEarnHint: '阅读文章、读书和使用工具都能获得积分', petArticlePoints: '阅读文章 +3', petBookPoints: '打开书籍 +5', petToolPoints: '使用工具 +2', petOutfits: '服饰兑换', petOutfitLocked: '达到 Lv.{level} 解锁', petOutfitUse: '穿上', petOutfitWearing: '当前穿着', petUnlocked: '已解锁', petInteractions: '互动解锁', petInteractionLocked: 'Lv.{level} 解锁', petPointsEarned: '获得 {points} 积分', petLevelUp: '宠物升级到 Lv.{level}！', reorderHint: '长按工具标签可以调整顺序',
    languagePending: '日语、韩语语言包已预留，当前版本先提供中文和英文。',
    bookshelf: '书架', addBook: '添加文档', noBooks: '还没有本地文档。', readerHint: '支持 Markdown、TXT、PDF、EPUB；文档仅保存在当前设备。', readerMissingSource: '原文件未备份', readerFileMissing: '这份备份没有包含原书文件。请在仍保存原书的设备重新上传，或重新导入同名文件。', openBook: '打开阅读', deleteBook: '删除文档', annotations: '笔记', readerComments: '笔记', readerNotesHint: '已保存的阅读笔记', addAnnotation: '笔记', annotationPlaceholder: '添加你的感受…', saveAnnotation: '保存', annotationHint: '选择文字后长按或点击笔记按钮。', noAnnotations: '还没有笔记。', reading: '正在阅读', closeReader: '关闭阅读', unsupportedFile: '请选择 .md、.markdown、.txt、.pdf 或 .epub 文件。', importFailed: '文档读取失败，请重试。', deleteConfirm: '确定删除这本文档吗？', pdfHint: 'PDF 使用浏览器原生阅读器打开。', epubHint: 'EPUB 已转换为适合 OneBox 的阅读视图。', readerContents: '目录', readerSettings: '阅读设置', readerReadingMethod: '阅读方式', readerTheme: '阅读背景', readerThemePaper: '纸张', readerThemeSepia: '墨水屏', readerThemeGreen: '护眼绿', readerThemeDark: '夜间', readerFontSize: '字号', readerFontFamily: '字体', readerLineHeight: '行距', readerParagraphSpacing: '段落间距', readerLetterSpacing: '字间距', readerAnimation: '翻页动画', readerAnimationSlide: '滑动', readerAnimationCover: '覆盖', readerAnimationNone: '无', readerScroll: '上下滚动', readerPages: '模拟翻页', readerProgress: '进度', readerFullscreen: '全屏', readerExitFullscreen: '退出全屏', readerFullscreenOnOpen: '是否全屏', readerFullscreenOnOpenHint: '下次打开文档时按此设置进入', readerNoContents: '暂无章节目录。', readerSettingsHint: '设置仅作用于当前设备上的阅读内容。', readerTocHint: '选择章节后跳转到对应位置。',
  },
  en: {
    calculator: 'Calculator', development: 'Dev', calendar: 'Calendar', weather: 'Weather', convert: 'Convert', unitConvert: 'Convert', translate: 'Translate', translateConvert: 'Convert', reader: 'Reader',
    online: 'Online', offline: 'Offline', install: 'Install', settings: 'Settings', notifications: 'Notifications',
    heroSubtitle: 'Fast, calm and offline-ready. Your data stays on this device first.',
    calculatorDesc: 'Parentheses, percentages, scientific functions, keyboard input and history.',
    calendarDesc: 'Gregorian, lunar, solar terms, holidays, make-up workdays and personal events.',
    weatherDesc: 'Search cities and districts for current, hourly and 15-day forecasts.',
    convertDesc: 'Common unit conversion',
    developmentDesc: 'JSON, text and time tools with local history.', devJsonFormat: 'JSON format', devJsonCompare: 'JSON compare', devTextStats: 'Text stats', devTimestamp: 'Timestamp', devInput: 'Input', devOutput: 'Output', devFormat: 'Format', devMinify: 'Minify', devCompare: 'Compare', devAnalyze: 'Analyze text', devConvert: 'Convert', devSaveRecord: 'Save record', devClear: 'Clear', devCopy: 'Copy result', devExample: 'Example', devRecords: 'History', devNoRecords: 'No records yet', devReuseHint: 'Click a record to reuse it', devJsonA: 'JSON A', devJsonB: 'JSON B', devValid: 'Valid JSON', devInvalid: 'Invalid JSON', devSame: 'The two JSON values are identical', devDifferent: '{count} differences found', devCharacters: 'Characters', devNonSpace: 'Non-space', devLines: 'Lines', devChinese: 'Chinese', devWords: 'Words', devParagraphs: 'Paragraphs', devTimestampToDate: 'Timestamp → date', devDateToTimestamp: 'Date → timestamp', devSeconds: 'Seconds', devMilliseconds: 'Milliseconds', devNow: 'Now', devUnescape: 'Unescape', devExpandAll: 'Expand all', devCollapseAll: 'Collapse all', devFullscreen: 'Fullscreen', devExitFullscreen: 'Exit fullscreen',
    translateDesc: 'Fast translation, saved locally',
    recentCalculations: 'Recent calculations', clear: 'Clear', ready: 'Completed calculations appear here.',
    scientific: 'Scientific', collapse: 'Hide', expand: 'Show', degree: 'DEG', radian: 'RAD',
    keyboard: 'Keyboard: numbers, + − × ÷, parentheses, Enter and Escape',
    today: 'Today', off: 'Off', work: 'Make-up workday', normalCalendar: 'Work calendar',
    legalHoliday: 'Public holiday', makeUpWorkday: 'Make-up workday', solarTerm: 'Solar term', selectedDay: 'Selected day',
    noAgenda: 'Nothing planned for this day.', agenda: 'Events', addAgenda: 'New event', newReminder: 'New reminder', eventContent: 'Event details', eventPlaceholder: 'Enter your event details', addEvent: 'Add event', addToDay: 'Add event', eventDate: 'Date', eventTime: 'Time', eventDateTime: 'Date and time', reminderSchedule: 'Reminder time', eventRepeat: 'Repeat',
    noteOptional: 'Note (optional)', weatherSearch: 'Search', currentLocation: 'Current location',
    refresh: 'Refresh', searchPlace: 'Search city or district',
    noWeather: 'Search a city or district to get weather.', weatherLoading: 'Loading weather…', weatherLoadFailed: 'Weather failed to load. Click the card to retry.',
    weatherData: 'Weather data from Open-Meteo · updated {time} · saved locally for offline viewing.', weatherHourlyRepairing: 'Hourly forecast is incomplete. Refreshing…',
    sortWeather: '', hourly: '36 hours', daily: '3 days before · today · next 15 days', advice: 'Advice',
    commute: 'Travel', sport: 'Sport', clothing: 'Clothing', sunscreen: 'Sun care', hiking: 'Hiking', windAdvice: 'Wind advice', windLevel: 'Wind', elevation: 'Elevation',
    addCard: 'Add', noResults: 'No matching place. Try another query.',
    home: 'Home', tools: 'Tools', navigation: 'Navigation', messages: 'Messages', mine: 'Me', quickTools: 'Quick tools', openSettings: 'Open settings', noMessages: 'No messages yet.', homeTabs: 'Home', homeTabsSelected: '{count} selected',
    ticketWallet: 'Wallet', ticketWalletDescription: 'Keep travel, movie and admission tickets plus dining records together.', ticketWalletTickets: 'Tickets', ticketWalletJourneys: 'Journeys', ticketWalletAdd: 'Add manually', ticketWalletAddTicket: 'Add ticket', ticketWalletAddShort: 'Add', ticketWalletImport: 'Import ticket', ticketWalletImportImage: 'Import image', ticketWalletImportJson: 'Import ticket data', ticketWalletEmpty: 'Add your first ticket and start a journey.', ticketWalletCount: 'Tickets', ticketWalletUpcoming: 'Upcoming', ticketWalletJourneyCount: 'Journeys', ticketWalletEditor: 'Ticket details', ticketWalletSave: 'Save ticket', ticketWalletCancel: 'Cancel', ticketWalletType: 'Type', ticketWalletTrain: 'Train', ticketWalletFlight: 'Flight', ticketWalletFerry: 'Ferry', ticketWalletOther: 'Other', ticketWalletTitle: 'Ticket name', ticketWalletCarrier: 'Carrier', ticketWalletFrom: 'From', ticketWalletTo: 'To', ticketWalletDepart: 'Departure', ticketWalletArrive: 'Arrival', ticketWalletTicketNo: 'Ticket / order no.', ticketWalletTrainNo: 'Train no.', ticketWalletSerial: 'Ticket serial', ticketWalletPrice: 'Fare', ticketWalletSeatClass: 'Seat class', ticketWalletPassengerInfo: 'Passenger details', ticketWalletPassengerName: 'Passenger name', ticketWalletPassengerId: 'Document number', ticketWalletCode: 'Ticket code', ticketWalletSeat: 'Seat / cabin', ticketWalletPassenger: 'Passenger', ticketWalletJourney: 'Journey name', ticketWalletNotes: 'Notes', ticketWalletOriginal: 'Original ticket', ticketWalletRecognizeAgain: 'Recognize again', ticketWalletEdit: 'Edit', ticketWalletDelete: 'Delete', ticketWalletDeleteConfirm: 'Delete this ticket?', ticketWalletMemory: 'Travel memory', ticketWalletAddMemory: 'Add memory', ticketWalletEditMemory: 'Edit memory', ticketWalletMemoryTitle: 'Memory title', ticketWalletMemoryDescription: 'Write about this journey', ticketWalletMemorySave: 'Save memory', ticketWalletShare: 'Share journey', ticketWalletApple: 'Add to Apple Wallet', ticketWalletAppleHint: 'An image cannot be added directly to Apple Wallet; a valid signed .pkpass file is required.', ticketWalletNoJourney: 'No journeys yet.', ticketWalletSourceReady: 'Original kept', ticketWalletSourceMissing: 'Original unavailable', ticketWalletAdded: 'Ticket added', ticketWalletSaved: 'Ticket saved', ticketWalletDeleted: 'Ticket deleted', ticketWalletMemorySaved: 'Memory saved', ticketWalletNeedRoute: 'Add a departure and destination first', ticketWalletAppleDownloaded: 'Original Apple pass downloaded',
    navigationTitle: 'Web navigation', navigationHint: 'Tap a card for actions; long-press to reorder or create a folder.', navigationToolbarHint: 'Long-press to edit · drag to group', navigationAdd: 'Add website', navigationEmpty: 'No websites yet. Add a favorite site to get started.', navigationUrl: 'Website URL', navigationUrlPlaceholder: 'https://example.com', navigationName: 'Website name', navigationNamePlaceholder: 'Optional; defaults to the site name', navigationIcon: 'Website icon', navigationIconHint: 'Fetched automatically from the URL', navigationSave: 'Save website', navigationAddToFolder: 'Add to folder', navigationEdit: 'Edit website', navigationEditSave: 'Save changes', navigationActionEdit: 'Edit', navigationActionDelete: 'Delete', navigationActionCancel: 'Cancel', navigationFolderEdit: 'Edit folder', navigationFolder: 'Folder', navigationFolderName: 'Folder name', navigationFolderPlaceholder: 'For example: Work, Reading', navigationCreateFolder: 'New folder', navigationSaveFolder: 'Save folder', navigationFolderAdd: 'Add website', navigationFolderDelete: 'Dissolve folder', navigationFolderDeleteConfirm: 'Dissolving the folder will keep its websites in navigation. Continue?', navigationFolderDissolved: 'Folder dissolved', navigationFolderEmpty: 'This folder is empty. Add some websites.', navigationRemove: 'Delete', navigationOpen: 'Open website', navigationSettings: 'Navigation settings', navigationOpenModeHint: 'Open websites in', navigationOpenModeCurrent: 'Current page', navigationOpenModeNewTab: 'New tab', navigationAlreadyExists: 'This website has already been added', navigationInvalidUrl: 'Enter a valid http or https URL', navigationDropHint: 'Release to create a folder', navigationFolderCreated: 'Folder created', navigationAdded: 'Website added', navigationDeleted: 'Website deleted', navigationMoved: 'Website moved into folder', navigationOrderSaved: 'Navigation order saved', navigationSiteCount: '{count} sites',
    allFeeds: 'All', feedRefresh: 'Refresh', feedLoading: 'Loading feeds…', feedEmpty: 'No items to show yet.', feedUpdated: 'Updated', feedLastRefresh: 'Last successful refresh', feedNewItems: 'New since refresh', feedShowNew: 'Only new', feedShowAll: 'Show all', feedTabNew: 'new', feedOpen: 'Open original', feedPartial: 'Some feeds are temporarily unavailable', feedProxyHint: 'Public RSS subscriptions; up to 120 items or 7 days are kept per source on this device.', feedLoadMore: 'Show older items', feedTabPrevious: 'Show previous home tabs', feedTabNext: 'Show more home tabs',
    converterType: 'Conversion', from: 'From', to: 'To', result: 'Result', swap: 'Swap units', copyResult: 'Copy result',
    copied: 'Copied', translationInput: 'Text to translate', translateNow: 'Translate', saveTranslation: 'Save locally',
    source: 'Source', target: 'Target', translationResult: 'Translation', translationHistory: 'Recent translations',
    noTranslation: 'Your translation will appear here.', noHistory: 'No saved translations yet.',
    githubSync: 'GitHub cloud sync', githubDialogSubtitle: 'Cross-device sync', githubDescription: 'Save settings, reading data, books and your wallet to your private Gist.', githubNotConnectedHint: 'Connect a private Gist to sync settings, navigation, reading, messages and your wallet.', githubConnectedHint: 'Sync settings, navigation, reading, messages and your wallet', githubCustomSync: 'Custom sync content', githubCustomSyncHint: 'Checked items sync; unchecked items stay local', githubOptionSettings: 'Settings', githubOptionNavigation: 'Navigation', githubOptionReading: 'Reading', githubOptionMessages: 'Messages', githubOptionCalendar: 'Calendar', githubOptionWeather: 'Weather', githubOptionTranslation: 'Translation', githubOptionCalculator: 'Calculator', githubOptionTicketWallet: 'Wallet', githubAgreementCheck: 'I have read and agree', githubAgreementRequired: 'Please read and agree to the User Agreement before signing in to GitHub.',
    githubClientId: 'GitHub OAuth Client ID', githubClientHint: 'OneBox includes its public authorization identifier; no manual setup is required.', githubDeveloperSettings: 'Open OAuth Apps settings',
    githubBrowserFlowError: 'GitHub authorization could not be opened. Check your network and try again.', githubNetworkError: 'Could not connect to the GitHub API. Check your network and try again.', githubAccessToken: 'GitHub access token', githubTokenHint: 'Stored only on this device; gist permission is required.', githubUseToken: 'Connect with access token', githubTokenMissing: 'Enter a GitHub access token first.', githubTokenInvalid: 'The access token is invalid or lacks the required permission.', githubTokenConnected: 'GitHub connected', githubWaiting: 'Waiting for GitHub authorization…', githubCancel: 'Cancel authorization',
    githubSyncScopeTitle: 'Sync content', githubSyncScope: 'Settings, navigation, reading, books and wallet originals.', githubSyncPrivacy: 'Tokens and home network caches are not synced.', githubAuthHint: 'You will return to OneBox after authorization.', githubUploadHint: 'Save the latest device data', githubDownloadHint: 'Restore the latest backup', githubConnectHint: 'Authorize to enable sync', githubLogoutHint: 'Disconnect this device only', githubBackgroundHint: 'Closing the window will not stop it.',
    githubLogin: 'Connect GitHub', githubLogout: 'Sign out', githubBackup: 'Back up to cloud', githubRestore: 'Restore to device', upload: 'Upload to GitHub', download: 'Restore from GitHub', githubAuthExpired: 'GitHub authorization expired. Please reconnect GitHub.', githubSyncNotFound: 'No OneBox sync data was found in this GitHub account. Upload from another device first.', githubSyncReadFailed: 'The OneBox sync file in GitHub could not be read. Check the Gist permission or content.', githubSyncMalformed: 'The OneBox sync file in GitHub is not valid JSON.', githubSyncInvalidData: 'The OneBox sync data in GitHub is malformed or damaged.',
    githubConnected: 'Connected', githubNotConnected: 'Not connected', openDevice: 'Open verification page',
    appUpdate: 'App update', checkUpdate: 'Update', updateAvailable: 'A new version is available', upToDate: 'Latest version', updating: 'Checking', updateApplying: 'Updating', updateCheckFailed: 'Check failed. Try again.', applyUpdate: 'Update',
    notificationsPermission: 'Message notifications', enableNotifications: 'Allow notifications', disableNotifications: 'Do not allow notifications', notificationDescription: 'On iPhone, add OneBox to the Home Screen and allow notifications first; background alerts after the app is closed still require a Push server.',
    userAgreement: 'User agreement', viewAgreement: 'View agreement', agreementTitle: 'OneBox user agreement', agreementIntro: 'OneBox is a local-first daily tools app. Most features run on this device.', agreementLocal: 'Local data: calculator history, events, weather cards, translation history, notifications, the reading shelf, reading progress and notes stay on this device by default. You can delete the related records or documents in the app.', agreementNetwork: 'Network services: Home subscriptions, weather and translation may request third-party or open-source services. Home articles come from public feeds; their freshness and availability depend on the source site. Opening an article takes you to that site, whose login, advertising and privacy rules are outside OneBox.', agreementGithub: 'Cloud sync: GitHub sync data goes to your private Gist. If you enable automatic reading sync, original book files and reading progress are stored in private storage in the Cloudflare account hosting the OneBox reader sync service. Files are not public; the access token is only used to verify identity and is not stored by the service. You can turn off reading sync in GitHub settings.', agreementPermissions: 'Permissions: location is used only to find weather for your current place; notifications are used for event and message reminders; file access is used to import local reading documents. Other features remain available when these permissions are denied.', agreementDisclaimer: 'Use note: weather, translation, feeds and third-party pages may be temporarily unavailable because of network conditions, service policies or API changes. Do not sync sensitive files that should not be uploaded to GitHub Gist or the configured private Cloudflare storage.', agreementUpdated: 'Last updated',
    addReminder: 'Add reminder', reminderText: 'Reminder', remindAt: 'When', noNotifications: 'No reminders yet.', once: 'Once', everyDay: 'Every day', workdays: 'Workdays', restdays: 'Rest days', weekly: 'Weekly', weekdays: 'Weekdays',
    markRead: 'Mark all read', close: 'Close', system: 'System', light: 'Light', dark: 'Dark', darkGray: 'Black gray',
    layout: 'Layout', classicLayout: 'Classic layout', simpleLayout: 'Simple layout', openMode: 'Open links', openCurrent: 'Current page', openNewTab: 'New tab', theme: 'Theme', language: 'Language', color: 'Color', blackWhite: 'Black and white', noblePurple: 'Noble purple', skyBlue: 'Sky blue', notBananaGreen: 'WeChat green', meituanYellow: 'Meituan yellow', topDisplay: 'Show at top', footprint: 'Footprints', showFootprint: 'Show on Home', hideFootprint: 'Hide from Home', mascot: 'Pet', petDescription: 'Display, level, outfits and play', petSettings: 'Pet settings', showMascot: 'Show pet', hideMascot: 'Hide pet', mascotDisplay: 'Pet display', mascotFullBody: 'Full body', mascotHalfBody: 'Upper body', petSocialTitle: 'Social pet', petLevel: 'Lv.{level} · {name}', petPoints: '{points} points', petNextLevel: '{points} points to the next level', petMaxLevel: 'Highest level reached', petOwner: 'Bound to: {owner}', petLocalOwner: 'This device', petGithubOwner: 'GitHub · {owner}', petEarnHint: 'Read articles, books and use tools to earn points', petArticlePoints: 'Read an article +3', petBookPoints: 'Open a book +5', petToolPoints: 'Use a tool +2', petOutfits: 'Outfit exchange', petOutfitLocked: 'Unlocks at Lv.{level}', petOutfitUse: 'Wear', petOutfitWearing: 'Wearing', petUnlocked: 'Unlocked', petInteractions: 'Interaction unlocks', petInteractionLocked: 'Unlocks at Lv.{level}', petPointsEarned: 'Earned {points} points', petLevelUp: 'Your pet reached Lv.{level}!', homeSourceManage: 'Home sources', homeSourceManageHint: 'Choose sources to show in the home navigation', homeSourceAdd: 'Add', homeSourceRemove: 'Remove', homeSourceEmpty: 'No other sources available', reorderHint: 'Long-press a tool tab to reorder',
    navigationLocation: 'Navigation location', navigationLocationMain: 'Main navigation', navigationLocationTools: 'Tool tabs',
    languagePending: 'Japanese and Korean are reserved for a future language pack. Chinese and English are available now.',
    bookshelf: 'Bookshelf', addBook: 'Add document', noBooks: 'No local documents yet.', readerHint: 'Supports Markdown, TXT, PDF and EPUB. Files stay on this device.', readerMissingSource: 'Original file not backed up', readerFileMissing: 'This backup does not include the original book file. Upload again from the device that still has it, or import a matching file here.', openBook: 'Open', deleteBook: 'Delete', annotations: 'Notes', readerComments: 'Notes', readerNotesHint: 'Saved reading notes', addAnnotation: 'Note', annotationPlaceholder: 'Add your thoughts…', saveAnnotation: 'Save', annotationHint: 'Select text, long-press or use the notes button.', noAnnotations: 'No notes yet.', reading: 'Reading', closeReader: 'Close reader', unsupportedFile: 'Choose a .md, .markdown, .txt, .pdf or .epub file.', importFailed: 'Could not read this document.', deleteConfirm: 'Delete this document?', pdfHint: 'PDF opens in the browser native reader.', epubHint: 'EPUB is converted into an adaptive OneBox reading view.', readerContents: 'Contents', readerSettings: 'Reading settings', readerReadingMethod: 'Reading mode', readerTheme: 'Reading background', readerThemePaper: 'Paper', readerThemeSepia: 'E-ink', readerThemeGreen: 'Green', readerThemeDark: 'Night', readerFontSize: 'Font size', readerFontFamily: 'Font', readerLineHeight: 'Line height', readerParagraphSpacing: 'Paragraph spacing', readerLetterSpacing: 'Letter spacing', readerAnimation: 'Page animation', readerAnimationSlide: 'Slide', readerAnimationCover: 'Cover', readerAnimationNone: 'None', readerScroll: 'Vertical scroll', readerPages: 'Page turn', readerProgress: 'Progress', readerFullscreen: 'Fullscreen', readerExitFullscreen: 'Exit fullscreen', readerFullscreenOnOpen: 'Open in fullscreen', readerFullscreenOnOpenHint: 'Apply this choice the next time a document opens', readerNoContents: 'No chapter contents.', readerSettingsHint: 'These settings apply only to reading on this device.', readerTocHint: 'Choose a chapter to jump to it.',
  },
};
const t = (key) => DICT[state.language]?.[key] || DICT.zh[key] || key;
DICT.zh.readerHint = '支持 md、txt、pdf、epub；同步状态见下方';
DICT.en.readerHint = 'Read md, txt, pdf and epub; sync status below.';
DICT.zh.readerBackupTitle = 'iCloud Drive 书籍备份';
DICT.zh.readerBackupHint = '手动导出书籍原文件、阅读进度和笔记。iPhone 分享时选择“存储到文件 → iCloud Drive”，其他设备从 iCloud Drive 导入。';
DICT.zh.readerBackupExport = '导出备份';
DICT.zh.readerBackupImport = '导入备份';
DICT.zh.readerBackupBuilding = '正在整理书籍…';
DICT.zh.readerBackupReady = '备份文件已生成，请在分享菜单选择“存储到文件 → iCloud Drive”。';
DICT.zh.readerBackupExported = '备份文件已下载，可将它保存到 iCloud Drive。';
DICT.zh.readerBackupImported = '书籍、阅读进度和笔记已恢复';
DICT.zh.readerBackupEmpty = '书架为空，没有可导出的书籍。';
DICT.zh.readerBackupMissingSource = '有书籍原文件缺失，请先在仍保存原书的设备恢复文件，再创建完整备份。';
DICT.zh.readerBackupTooLarge = '备份超过 256 MB。请分批备份书籍后再导入。';
DICT.zh.readerBackupInvalid = '备份文件无效或已损坏，没有更改本机书架。';
DICT.zh.readerBackupLimit = '恢复后书籍数量会超过 80 本，请先整理当前书架。';
DICT.zh.readerBackupFailed = '备份处理失败，请检查设备可用空间后重试。';
DICT.en.readerBackupTitle = 'iCloud Drive book backup';
DICT.en.readerBackupHint = 'Export original books, reading progress and notes. On iPhone, choose “Save to Files → iCloud Drive” in the share sheet; import it on another device.';
DICT.en.readerBackupExport = 'Export backup';
DICT.en.readerBackupImport = 'Import backup';
DICT.en.readerBackupBuilding = 'Preparing books…';
DICT.en.readerBackupReady = 'Backup created. Choose “Save to Files → iCloud Drive” in the share sheet.';
DICT.en.readerBackupExported = 'Backup downloaded. You can save it to iCloud Drive.';
DICT.en.readerBackupImported = 'Books, progress and notes restored';
DICT.en.readerBackupEmpty = 'The shelf is empty; there are no books to export.';
DICT.en.readerBackupMissingSource = 'A book file is missing. Restore it on the device that still has the original, then create a complete backup.';
DICT.en.readerBackupTooLarge = 'The backup is larger than 256 MB. Back up smaller groups of books.';
DICT.en.readerBackupInvalid = 'The backup is invalid or damaged. The local shelf was not changed.';
DICT.en.readerBackupLimit = 'Restore would exceed the 80-book limit. Remove books from the current shelf first.';
DICT.en.readerBackupFailed = 'Backup processing failed. Check available device storage and try again.';
DICT.zh.accountLogin = '登录账号';
DICT.en.accountLogin = 'Sign in';
DICT.zh.oneboxAccountTitle = 'OneBox 账户';
DICT.en.oneboxAccountTitle = 'OneBox account';
DICT.zh.githubLoginTitle = '选择登录方式';
DICT.en.githubLoginTitle = 'Choose a sign-in method';
DICT.zh.githubProviderBackupHint = '私有 Gist 备份';
DICT.en.githubProviderBackupHint = 'Private Gist backup';
DICT.zh.accountProviderComingSoon = '即将开放';
DICT.en.accountProviderComingSoon = 'Coming soon';
// Keep the cloud-sync summary short; the action labels explain upload versus restore.
const toolName = (id) => t(TOOL_DEFS[id]?.key || id);
const storedTheme = localStorage.getItem(STORAGE.theme);
const storedLanguage = localStorage.getItem(STORAGE.language) || 'system';
const storedLayout = localStorage.getItem(STORAGE.layout);
const storedColor = localStorage.getItem(STORAGE.color);
const storedColorExplicit = localStorage.getItem(STORAGE.colorExplicit) === 'true';
const resolveLanguageMode = (mode) => mode === 'en' || mode === 'zh' ? mode : ((navigator.language || '').toLowerCase().startsWith('en') ? 'en' : 'zh');
const storedCalculator = parseStored(STORAGE.calculator, { expr: '', history: [], historyOpen: false });
const storedDevTools = parseStored(STORAGE.devTools, {}) || {};
const storedTranslationHistoryOpen = parseStored(STORAGE.translationHistoryOpen, false) === true;
const storedLibrary = parseStored(STORAGE.library, []);
const storedReaderPreferences = parseStored(STORAGE.readerPreferences, {}) || {};
const storedReaderLayout = localStorage.getItem(STORAGE.readerLayout) || 'grid';
const storedHomeFeeds = parseStored(STORAGE.homeFeeds, {}) || {};
const storedHomeFeedRead = parseStored(STORAGE.homeFeedRead, {}) || {};
const storedHomeFeedOrder = parseStored(STORAGE.homeFeedOrder, DEFAULT_HOME_FEED_ORDER);
const storedHomeFeedVisibility = parseStored(STORAGE.homeFeedVisibility, null);
const storedHomeFeedActive = localStorage.getItem(STORAGE.homeFeedActive) || '';
const storedNavigation = parseStored(STORAGE.navigation, null);
const storedNavigationLocation = localStorage.getItem(STORAGE.navigationLocation) === 'tools' ? 'tools' : 'main';
const storedNotificationPreference = parseStored(STORAGE.notificationPreference, 'allow');
const storedTopDisplay = parseStored(STORAGE.topDisplay, {}) || {};
const storedFootprint = parseStored(STORAGE.footprint, true) !== false;
const storedOpenMode = localStorage.getItem(STORAGE.openMode) || 'current';
const storedMascotVisible = localStorage.getItem(STORAGE.mascotVisible) !== 'false';
const storedMascotDisplayMode = localStorage.getItem(STORAGE.mascotDisplayMode) === 'full' ? 'full' : 'half';
const DEV_TOOL_IDS = ['json-format', 'json-compare', 'text-stats', 'timestamp'];
function normalizeDevTools(value) {
  const source = value && typeof value === 'object' ? value : {};
  const sourceRecords = source.records && typeof source.records === 'object' ? source.records : {};
  const records = Object.fromEntries(DEV_TOOL_IDS.map((id) => [id, Array.isArray(sourceRecords[id]) ? sourceRecords[id].filter((item) => item && item.id).slice(0, 24) : []]));
  return {
    active: DEV_TOOL_IDS.includes(source.active) ? source.active : DEV_TOOL_IDS[0],
    fullscreen: source.fullscreen === true, formatInput: String(source.formatInput || ''), formatOutput: String(source.formatOutput || ''), formatStatus: String(source.formatStatus || ''), formatCompact: source.formatCompact === true, formatUnescape: source.formatUnescape !== false, formatCollapsed: Array.isArray(source.formatCollapsed) ? [...new Set(source.formatCollapsed.map((item) => String(item)))] : [],
    historyOpen: source.historyOpen === true,
    compareLeft: String(source.compareLeft || ''), compareRight: String(source.compareRight || ''), compareOutput: String(source.compareOutput || ''), compareStatus: String(source.compareStatus || ''),
    textInput: String(source.textInput || ''), textOutput: source.textOutput && typeof source.textOutput === 'object' ? source.textOutput : null,
    timestampMode: source.timestampMode === 'date' ? 'date' : 'timestamp', timestampUnit: source.timestampUnit === 'ms' ? 'ms' : 's', timestampValue: String(source.timestampValue || ''), timestampDate: String(source.timestampDate || ''), timestampOutput: String(source.timestampOutput || ''), timestampStatus: String(source.timestampStatus || ''),
    records,
  };
}
const initialDevTools = normalizeDevTools(storedDevTools);
const PET_LEVELS = [
  { level: 1, minPoints: 0, name: { zh: '初识陪伴', en: 'New companion' } },
  { level: 2, minPoints: 30, name: { zh: '默契伙伴', en: 'Kindred friend' } },
  { level: 3, minPoints: 100, name: { zh: '活力玩伴', en: 'Playful friend' } },
  { level: 4, minPoints: 240, name: { zh: '贴心搭档', en: 'Trusted partner' } },
  { level: 5, minPoints: 500, name: { zh: '闪耀伙伴', en: 'Shining partner' } },
];
const PET_OUTFITS = [
  { id: 'original', level: 1, glyph: '🧡', name: { zh: '暖橙围巾', en: 'Warm scarf' } },
  { id: 'blue', level: 2, glyph: '💙', name: { zh: '晴空领结', en: 'Sky bow' } },
  { id: 'green', level: 3, glyph: '🍃', name: { zh: '森野披肩', en: 'Forest cape' } },
  { id: 'purple', level: 4, glyph: '✨', name: { zh: '星光披风', en: 'Starlight cape' } },
  { id: 'crown', level: 5, glyph: '👑', name: { zh: '闪耀王冠', en: 'Shining crown' } },
];
const PET_INTERACTIONS = [
  { id: 'pat', level: 1, name: { zh: '摸摸头', en: 'Pat me' } },
  { id: 'ball', level: 1, name: { zh: '玩玩球', en: 'Play ball' } },
  { id: 'snack', level: 2, name: { zh: '喂零食', en: 'Treat' } },
  { id: 'highfive', level: 3, name: { zh: '击个掌', en: 'High five' } },
  { id: 'nap', level: 4, name: { zh: '打个盹', en: 'Nap' } },
];
function petLevelForPoints(points = 0) {
  return [...PET_LEVELS].reverse().find((item) => Number(points) >= item.minPoints) || PET_LEVELS[0];
}
function normalizePetProfile(value) {
  const source = value && typeof value === 'object' ? value : {};
  const points = Math.max(0, Math.floor(Number(source.points) || 0));
  const awards = source.lastAwards && typeof source.lastAwards === 'object' ? source.lastAwards : {};
  const lastAwards = Object.fromEntries(Object.entries(awards).filter(([, at]) => Date.now() - Number(at) < 45 * 24 * 60 * 60 * 1000).slice(-120));
  const stats = source.stats && typeof source.stats === 'object' ? source.stats : {};
  const validOutfit = PET_OUTFITS.some((item) => item.id === source.activeOutfit) ? source.activeOutfit : 'original';
  return {
    points,
    activeOutfit: validOutfit,
    owner: String(source.owner || ''),
    lastAwards,
    stats: { articles: Math.max(0, Number(stats.articles) || 0), books: Math.max(0, Number(stats.books) || 0), tools: Math.max(0, Number(stats.tools) || 0), interactions: Math.max(0, Number(stats.interactions) || 0) },
  };
}
const storedPetProfile = normalizePetProfile(parseStored(STORAGE.petProfile, {}));
const storedToolActive = localStorage.getItem(STORAGE.toolActive) || '';
const rawWeatherCards = parseStored(STORAGE.weatherCards, []);
const legacyWeather = parseStored(STORAGE.legacyWeather, null);
const normalizeToolOrder = (value, includeNavigation = false, navigationFirst = false) => {
  const allowed = includeNavigation ? Object.keys(TOOL_DEFS) : DEFAULT_TOOL_ORDER;
  const order = Array.isArray(value) ? value.map((id) => id === 'convert' ? 'translate' : id).filter((id) => allowed.includes(id)) : [];
  const normalized = [...new Set(order.concat(allowed))];
  if (includeNavigation && navigationFirst) return ['navigation', ...normalized.filter((id) => id !== 'navigation')].slice(0, allowed.length);
  return (includeNavigation ? normalized : normalized.filter((id) => id !== 'navigation')).slice(0, allowed.length);
};
const LEGACY_DEFAULT_HOME_FEED_VISIBLE = ['ithome', 'huxiu', 'zhihu', 'v2ex', 'weibo', 'bilibili'];
const HOME_FEED_VISIBILITY_MIGRATION = 4;
const storedHomeFeedVisibilityMigration = Number(localStorage.getItem(STORAGE.homeFeedVisibilityMigration) || 0);
const normalizeHomeFeedOrder = (value) => {
  const order = Array.isArray(value) ? value.filter((id) => DEFAULT_HOME_FEED_ORDER.includes(id)) : [];
  return [...new Set(order.concat(DEFAULT_HOME_FEED_ORDER))].slice(0, DEFAULT_HOME_FEED_ORDER.length);
};
const normalizeHomeFeedVisibility = (value) => {
  const visible = Array.isArray(value) ? value : DEFAULT_HOME_FEED_VISIBLE;
  const normalized = [...new Set(visible.filter((id) => DEFAULT_HOME_FEED_ORDER.includes(id)))];
  const isLegacyDefault = normalized.length === LEGACY_DEFAULT_HOME_FEED_VISIBLE.length && LEGACY_DEFAULT_HOME_FEED_VISIBLE.every((id) => normalized.includes(id));
  if (isLegacyDefault) return [...DEFAULT_HOME_FEED_VISIBLE];
  if (Array.isArray(value) && storedHomeFeedVisibilityMigration < 1 && !normalized.includes('xiaohongshu')) normalized.push('xiaohongshu');
  if (Array.isArray(value) && storedHomeFeedVisibilityMigration < 2 && !normalized.includes('douyin')) normalized.push('douyin');
  if (Array.isArray(value) && storedHomeFeedVisibilityMigration < 3 && !normalized.includes('thepaper')) normalized.push('thepaper');
  if (Array.isArray(value) && storedHomeFeedVisibilityMigration < 4 && !normalized.includes('jiemian')) normalized.push('jiemian');
  return normalized;
};
const initialToolOrder = normalizeToolOrder(parseStored(STORAGE.toolOrder, DEFAULT_TOOL_ORDER), storedNavigationLocation === 'tools', storedNavigationLocation === 'tools');
const initialHomeFeedOrder = normalizeHomeFeedOrder(storedHomeFeedOrder);
const initialHomeFeedVisible = normalizeHomeFeedVisibility(storedHomeFeedVisibility);
const initialHomeFeedIds = [...(storedFootprint ? ['footprint'] : []), ...initialHomeFeedOrder.filter((id) => initialHomeFeedVisible.includes(id))];
const initialHomeFeedActive = initialHomeFeedIds.includes(storedHomeFeedActive) ? storedHomeFeedActive : initialHomeFeedIds[0] || DEFAULT_HOME_FEED_ORDER[0];
function navigationSafeUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}
function navigationNameFromUrl(value) {
  try { return new URL(value).hostname.replace(/^www\./i, ''); } catch { return ''; }
}
function navigationUsesDesktopBrandIcon(value) {
  try { return /(^|\.)bilibili\.com$/i.test(new URL(value).hostname); } catch { return false; }
}
function navigationUsesOneBoxBrandIcon(value) {
  try {
    const url = new URL(value);
    return /(^|\.)(?:awmix|oneboxy)\.github\.io$/i.test(url.hostname) && /^\/onebox(?:\/|$)/i.test(url.pathname);
  } catch { return false; }
}
function navigationAppAssetUrl(path) {
  try { return new URL(path, document.baseURI).href; } catch { return path; }
}
function navigationAssetBases(value) {
  try {
    const parsed = new URL(value);
    const pathname = parsed.pathname || '/';
    const directory = pathname.endsWith('/') ? pathname : pathname.slice(0, pathname.lastIndexOf('/') + 1) || '/';
    return [...new Set([new URL(directory, parsed.origin).href, new URL('/', parsed.origin).href])];
  } catch { return []; }
}
const NAVIGATION_ICON_CACHE_KEY = 'onebox.navigation-icon-cache';
const NAVIGATION_ICON_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const NAVIGATION_ICON_CACHE_LIMIT = 160;
function navigationIconCacheKey(value) {
  try { return new URL(value).origin; } catch { return ''; }
}
function readNavigationIconCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(NAVIGATION_ICON_CACHE_KEY) || '{}');
    return cache && typeof cache === 'object' ? cache : {};
  } catch { return {}; }
}
function navigationCachedIcon(value) {
  const key = navigationIconCacheKey(value);
  if (!key) return '';
  const record = readNavigationIconCache()[key];
  if (!record || typeof record.icon !== 'string' || !record.savedAt || Date.now() - record.savedAt > NAVIGATION_ICON_CACHE_TTL_MS) return '';
  return navigationSafeUrl(record.icon);
}
function navigationRememberCachedIcon(siteUrl, icon) {
  const key = navigationIconCacheKey(siteUrl);
  const source = navigationSafeUrl(icon);
  if (!key || !source) return;
  const cache = readNavigationIconCache();
  cache[key] = { icon: source, savedAt: Date.now() };
  const compact = Object.fromEntries(Object.entries(cache).sort(([, a], [, b]) => Number(a?.savedAt || 0) - Number(b?.savedAt || 0)).slice(-NAVIGATION_ICON_CACHE_LIMIT));
  try { localStorage.setItem(NAVIGATION_ICON_CACHE_KEY, JSON.stringify(compact)); } catch {}
}
function navigationIconMatchesSite(icon, siteUrl) {
  const source = navigationSafeUrl(icon);
  const target = navigationSafeUrl(siteUrl);
  if (!source || !target) return false;
  try {
    const iconUrl = new URL(source);
    const targetUrl = new URL(target);
    if (iconUrl.hostname === 'www.google.com' && iconUrl.pathname === '/s2/favicons') {
      const domainUrl = iconUrl.searchParams.get('domain_url');
      if (domainUrl) return new URL(domainUrl).hostname === targetUrl.hostname;
      return iconUrl.searchParams.get('domain') === targetUrl.hostname;
    }
    if (iconUrl.hostname === 'icons.duckduckgo.com' && iconUrl.pathname.startsWith('/ip3/')) return iconUrl.pathname.slice(4).replace(/\.ico$/i, '') === targetUrl.hostname;
    if (iconUrl.hostname === 'icon.horse' && iconUrl.pathname.startsWith('/icon/')) return iconUrl.pathname.slice(6) === targetUrl.hostname;
  } catch { return false; }
  return true;
}
function navigationIconForSite(icon, siteUrl) {
  return navigationIconMatchesSite(icon, siteUrl) ? navigationSafeUrl(icon) : '';
}
function navigationIconSources(value) {
  const url = navigationSafeUrl(value);
  if (!url) return [];
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    if (navigationUsesDesktopBrandIcon(url)) return [navigationAppAssetUrl('icons/bilibili.svg'), 'https://static.hdslb.com/images/favicon.ico', 'https://www.bilibili.com/favicon.ico'];
    if (navigationUsesOneBoxBrandIcon(url)) return [navigationAppAssetUrl('icons/onebox-brand-v317-192.png?v=2.18.334'), navigationAppAssetUrl('icons/onebox-brand-v317-512.png?v=2.18.334')];
    const direct = navigationAssetBases(url).flatMap((base) => [
      new URL('apple-touch-icon.png', base).href,
      new URL('apple-touch-icon-dark.png', base).href,
      new URL('apple-touch-icon-precomposed.png', base).href,
      new URL('icons/icon-512.png', base).href,
      new URL('icons/icon-192.png', base).href,
      new URL('favicon-192x192.png', base).href,
      new URL('favicon-192.png', base).href,
      new URL('favicon-180x180.png', base).href,
      new URL('favicon-96x96.png', base).href,
      new URL('icons/favicon-light-64.png', base).href,
      new URL('icons/favicon-dark-64.png', base).href,
      new URL('favicon.png', base).href,
      new URL('favicon.ico', base).href,
      new URL('icons/icon.svg', base).href,
    ]);
    return [...new Set([
      navigationCachedIcon(url),
      ...direct,
      'https://www.google.com/s2/favicons?domain_url=' + encodeURIComponent(parsed.origin) + '&sz=256',
      'https://icons.duckduckgo.com/ip3/' + hostname + '.ico',
      'https://icon.horse/icon/' + hostname
    ].filter(Boolean))];
  } catch { return []; }
}
function navigationIconUrl(value) { return navigationIconSources(value)[0] || ''; }
function isNavigationIconServiceUrl(value) {
  try {
    const url = new URL(String(value || ''));
    return (url.hostname === 'www.google.com' && url.pathname === '/s2/favicons') || (url.hostname === 'icons.duckduckgo.com' && url.pathname.startsWith('/ip3/')) || (url.hostname === 'icon.horse' && url.pathname.startsWith('/icon/'));
  } catch { return false; }
}
function normalizeNavigation(value) {
  const rawItems = Array.isArray(value?.items) ? value.items : Array.isArray(value) ? value : [];
  const usedIds = new Set();
  const uniqueId = (candidate, prefix) => {
    let id = String(candidate || '').trim() || prefix + '-' + uid();
    while (usedIds.has(id)) id = prefix + '-' + uid();
    usedIds.add(id); return id;
  };
  const normalizeSite = (item) => {
    const url = navigationSafeUrl(item?.url);
    if (!url) return null;
    // Keep the last known-good icon across reloads. Replacing it with the
    // first probe URL here made every refresh start over at a commonly
    // missing apple-touch-icon path, even after a fallback had succeeded.
    const icon = navigationIconForSite(item?.icon, url) || navigationIconUrl(url);
    return { id: uniqueId(item?.id, 'site'), type: 'site', name: String(item?.name || navigationNameFromUrl(url)).trim() || navigationNameFromUrl(url), url, icon, createdAt: Number(item?.createdAt) || Date.now() };
  };
  const items = rawItems.map((item) => {
    if (item?.type === 'folder') {
      const children = (Array.isArray(item.children) ? item.children : []).map(normalizeSite).filter(Boolean);
      return { id: uniqueId(item.id, 'folder'), type: 'folder', name: String(item.name || t?.('navigationFolder') || '文件夹').trim() || '文件夹', children, createdAt: Number(item.createdAt) || Date.now() };
    }
    return normalizeSite(item);
  }).filter(Boolean);
  return { version: 1, items };
}
const TICKET_TYPES = Object.freeze({
  train: { label: '火车票', labelEn: 'Train', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="3"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h8M8 20l-2 2M16 20l2 2"/></svg>' },
  flight: { label: '飞机票', labelEn: 'Flight', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13.2 10.5 11l2.8-6.8 1.8.5-.4 6.8 6.3 1.4v1.6l-6.4-.2-.6 5-1.7.5-1.8-5.3L3 14.9Z"/></svg>' },
  car: { label: '汽车票', labelEn: 'Car ticket', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 14 1.5-5a2 2 0 0 1 1.9-1.5h9.2A2 2 0 0 1 18.5 9l1.5 5v4h-2v-2H6v2H4Z"/><path d="M5 13.5h14M7 16h.01M17 16h.01"/></svg>' },
  ferry: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16h14l-2-7H7l-2 7Z"/><path d="M9 9V5h6v4M3 18c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 4.5 0"/></svg>' },
  movie: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v12H4zM4 10h16"/><path d="m7 7 2-3 2 3 2-3 2 3 2-3 1 3"/><path d="M8 14h8"/></svg>' },
  admission: { label: '门票', labelEn: 'Admission ticket', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h16v2a2.5 2.5 0 0 0 0 5v2H4v-2a2.5 2.5 0 0 0 0-5v-2Z"/><path d="M12 8.75v1M12 12v2.5M12 16.25v.01"/></svg>' },
  dining: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3v8M4 3v5a2 2 0 0 0 4 0V3M6 11v10M15 3v18M15 3c3 2 4 5 0 7"/></svg>' },
  other: { icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>' },
});
const TICKET_TYPE_LABELS = Object.freeze({ train: ['火车票', 'Train ticket'], flight: ['飞机票', 'Flight ticket'], car: ['汽车票', 'Car ticket'], ferry: ['船票', 'Ferry ticket'], movie: ['电影票', 'Movie ticket'], admission: ['门票', 'Admission ticket'], dining: ['餐饮', 'Dining'], other: ['其他', 'Other'] });
const TICKET_WALLET_DINING_KINDS = Object.freeze({
  drink: { label: ['饮品', 'Drinks'], icon: '☕', item: ['饮品名称', 'Drink'], note: ['饮品手帐', 'Drink journal'] },
  specialty: { label: ['特色菜', 'Specialty dish'], icon: '🍽️', item: ['菜品名称', 'Dish'], note: ['特色菜手帐', 'Dish journal'] },
  snack: { label: ['小吃', 'Snack'], icon: '🥐', item: ['小吃名称', 'Snack'], note: ['小吃手帐', 'Snack journal'] },
  other: { label: ['其他', 'Other'], icon: '✦', item: ['餐饮名称', 'Item'], note: ['餐饮手帐', 'Dining journal'] },
});
const LUCKIN_DRINK_CATEGORIES = Object.freeze(['拿铁类', '美式类', '冷萃类', '冰茶冰奶类', '轻乳茶类', '果蔬茶类', '特调类', '其他非咖啡类']);
const LUCKIN_DRINK_ATTRIBUTES = Object.freeze({
  drinkTemperature: ['冰', '热'],
  drinkSize: ['大杯', '超大杯'],
  drinkSweetness: ['标准甜', '少少甜', '微甜', '不另外加糖'],
});
const TICKET_TYPE_ALIASES = Object.freeze({ coach: 'car', transit: 'car', concert: 'admission' });
const TICKET_WALLET_TYPE_CATEGORIES = Object.freeze({ train: 'travel', flight: 'travel', car: 'travel', ferry: 'travel', movie: 'entertainment', admission: 'entertainment', dining: 'dining', other: 'other' });
const TICKET_WALLET_TRAVEL_TYPES = Object.freeze(['train', 'flight', 'car', 'ferry']);
const TICKET_WALLET_FLIGHT_TEMPLATES = Object.freeze({
  'standard-v1': { id: 'standard-v1', title: '通用机票', note: '简洁蓝白', carrier: '', shortBrand: '' },
  'air-china-v1': { id: 'air-china-v1', title: '中国国航', note: '国航 · 红白配色', carrier: '中国国际航空', shortBrand: '国航' },
  'china-eastern-v1': { id: 'china-eastern-v1', title: '东方航空', note: '东航 · 靛蓝红线', carrier: '中国东方航空', shortBrand: '东航' },
  'china-southern-v1': { id: 'china-southern-v1', title: '南方航空', note: '南航 · 天空蓝', carrier: '中国南方航空', shortBrand: '南航' },
  'hainan-airlines-v1': { id: 'hainan-airlines-v1', title: '海南航空', note: '海航 · 绛红金调', carrier: '海南航空', shortBrand: '海航' },
  'xiamen-airlines-v1': { id: 'xiamen-airlines-v1', title: '厦门航空', note: '厦航 · 海蓝青色', carrier: '厦门航空', shortBrand: '厦航' },
  'shenzhen-airlines-v1': { id: 'shenzhen-airlines-v1', title: '深圳航空', note: '深航 · 蓝红配色', carrier: '深圳航空', shortBrand: '深航' },
});
const TICKET_WALLET_CATEGORIES = Object.freeze({
  all: { label: ['全部', 'All'], icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5h9A2.5 2.5 0 0 1 19.5 8v10A2.5 2.5 0 0 1 17 20.5H7A2.5 2.5 0 0 1 4.5 18V8A2.5 2.5 0 0 1 7 5.5h1"/><path d="M8 3.5h9A2.5 2.5 0 0 1 19.5 6M8 10h8M8 13.5h8M8 17h5"/></svg>' },
  travel: { label: ['出行', 'Travel'], icon: TICKET_TYPES.train.icon },
  entertainment: { label: ['娱乐', 'Entertainment'], icon: TICKET_TYPES.movie.icon },
  dining: { label: ['餐饮', 'Dining'], icon: TICKET_TYPES.dining.icon },
  other: { label: ['其他', 'Other'], icon: TICKET_TYPES.other.icon },
});
function normalizeTicketType(value, fallback = 'other') {
  const legacyType = String(value || '');
  const type = TICKET_TYPE_ALIASES[legacyType] || legacyType;
  return Object.prototype.hasOwnProperty.call(TICKET_TYPES, type) ? type : fallback;
}
function ticketWalletCategoryForType(type) { return TICKET_WALLET_TYPE_CATEGORIES[normalizeTicketType(type)] || 'other'; }
function normalizeTicketWalletDiningKind(value, fallback = 'other') { return Object.prototype.hasOwnProperty.call(TICKET_WALLET_DINING_KINDS, value) ? value : fallback; }
function normalizeTicketWalletDiningKindFilter(value) { return value === 'all' || Object.prototype.hasOwnProperty.call(TICKET_WALLET_DINING_KINDS, value) ? value : 'all'; }
function normalizeTicketWalletFilter(value) {
  const filter = String(value || '').trim();
  if (Object.prototype.hasOwnProperty.call(TICKET_WALLET_CATEGORIES, filter)) return filter;
  if (!filter) return 'all';
  const legacyType = TICKET_TYPE_ALIASES[filter] || filter;
  return TICKET_WALLET_TYPE_CATEGORIES[legacyType] || 'all';
}
function ticketWalletDefaultTypeForFilter(value) {
  return ({ all: 'train', travel: 'train', entertainment: 'movie', dining: 'dining', other: 'other' })[normalizeTicketWalletFilter(value)] || 'train';
}
function ticketWalletFlightTemplateForCarrier(value) {
  const carrier = String(value || '').trim().toLowerCase().replace(/[\s·•_-]+/g, '');
  const matches = [
    [/中国国际航空|中国国航|国航|airchina|^ca(?:\d{1,4})?$/i, 'air-china-v1'],
    [/中国东方航空|东方航空|东航|chinaeastern|^mu(?:\d{1,4})?$/i, 'china-eastern-v1'],
    [/中国南方航空|南方航空|南航|chinasouthern|^cz(?:\d{1,4})?$/i, 'china-southern-v1'],
    [/海南航空|海航|hainanairlines|^hu(?:\d{1,4})?$/i, 'hainan-airlines-v1'],
    [/厦门航空|厦航|xiamenairlines|^mf(?:\d{1,4})?$/i, 'xiamen-airlines-v1'],
    [/深圳航空|深航|shenzhenairlines|^zh(?:\d{1,4})?$/i, 'shenzhen-airlines-v1'],
  ];
  return matches.find(([pattern]) => pattern.test(carrier))?.[1] || '';
}
function ticketWalletNormalizeTemplate(type, value) {
  if (type === 'train') return value === 'crh-blue-v1' ? 'crh-blue-v1' : 'pink-physical-v1';
  if (type === 'flight' && Object.prototype.hasOwnProperty.call(TICKET_WALLET_FLIGHT_TEMPLATES, value)) return value;
  return 'standard-v1';
}
function ticketWalletPassengerParts(value = '', explicitName = '', explicitId = '') {
  const legacy = String(value || '').trim();
  const idMatch = legacy.match(/(?:\d\s*){17}[\dXx]|\d{3,4}\s*\*{4,}\s*\d{3,4}[Xx]?/);
  const passengerId = String(explicitId || idMatch?.[0] || '').replace(/\s+/g, '').trim();
  const remaining = passengerId ? legacy.replace(idMatch?.[0] || passengerId, ' ') : legacy;
  const nameCandidate = String(explicitName || remaining.match(/[\u4e00-\u9fa5]{2,4}/)?.[0] || '').trim();
  const passengerName = /^(?:旅客|乘客|证件|待识别|中国铁路)$/.test(nameCandidate) ? '' : nameCandidate;
  return { passengerId, passengerName };
}
function ticketWalletMaskedPassengerId(value) {
  const id = String(value || '').replace(/\s+/g, '').trim();
  if (!id) return '';
  if (/\*/.test(id)) return id;
  if (/^\d{17}[\dXx]$/.test(id)) return id.slice(0, 4) + '************' + id.slice(-3);
  if (id.length > 7) return id.slice(0, 4) + '************' + id.slice(-3);
  return id;
}
function normalizeTicketRecord(value) {
  const source = value && typeof value === 'object' ? value : {};
  const type = normalizeTicketType(source.type);
  const now = Date.now();
  const rawTicketNo = String(source.ticketNo || '').trim();
  const rawTicketSerial = String(source.ticketSerial || '').trim();
  const rawPrice = String(source.price || '').trim();
  const rawPassenger = String(source.passenger || '').trim();
  const passengerParts = ticketWalletPassengerParts(rawPassenger, source.passengerName, source.passengerId);
  const rawDepartAt = String(source.departAt || '');
  const createdAt = Number(source.createdAt) || now;
  const missingRecognitionCount = [
    !rawTicketNo || /^(?:G0000|车次待补充)$/i.test(rawTicketNo),
    !rawTicketSerial || /^(?:A000000|票号待补充)$/i.test(rawTicketSerial),
    !rawPrice || /^(?:￥?\s*--(?:\.-?)?\s*元?|￥?待补充)$/i.test(rawPrice),
    !rawPassenger || /^(?:证件号待识别\s*旅客|乘客信息待补充)$/i.test(rawPassenger),
  ].filter(Boolean).length;
  const legacyAutoDate = type === 'train' && Boolean(source.sourceImageId) && missingRecognitionCount >= 3;
  return {
    id: String(source.id || 'ticket-' + uid()), type,
    title: String(source.title || '').trim(), carrier: String(source.carrier || '').trim(),
    from: String(source.from || '').trim(), to: String(source.to || '').trim(),
    fromLatin: String(source.fromLatin || '').trim(), toLatin: String(source.toLatin || '').trim(),
    departAt: legacyAutoDate ? '' : rawDepartAt, arriveAt: String(source.arriveAt || ''),
    ticketNo: /^(?:G0000|车次待补充)$/i.test(rawTicketNo) ? '' : rawTicketNo,
    ticketSerial: /^(?:A000000|票号待补充)$/i.test(rawTicketSerial) ? '' : rawTicketSerial,
    ticketCode: String(source.ticketCode || '').trim(), price: /^(?:￥?\s*--(?:\.-?)?\s*元?|￥?待补充)$/i.test(rawPrice) ? '' : rawPrice,
    seat: String(source.seat || '').trim(), seatClass: String(source.seatClass || '').trim(),
    passenger: /^(?:证件号待识别\s*旅客|乘客信息待补充)$/i.test(rawPassenger) ? '' : rawPassenger,
    passengerName: passengerParts.passengerName, passengerId: passengerParts.passengerId,
    journey: String(source.journey || '').trim(),
    diningKind: normalizeTicketWalletDiningKind(source.diningKind, type === 'dining' ? 'drink' : 'other'),
    diningItem: String(source.cafeDrink || source.diningItem || '').trim(),
    drinkCategory: String(source.drinkCategory || '').trim(),
    drinkTemperature: String(source.drinkTemperature || '').trim(),
    drinkSize: String(source.drinkSize || '').trim(),
    drinkSweetness: String(source.drinkSweetness || '').trim(),
    drinkExtras: String(source.drinkExtras || '').trim(),
    drinkServiceMode: String(source.drinkServiceMode || '').trim(),
    calendarEventId: String(source.calendarEventId || '').trim(),
    calendarEventSourceDate: String(source.calendarEventSourceDate || '').trim(),
    calendarEventDisabled: source.calendarEventDisabled === true,
    cafeDrink: String(source.cafeDrink || source.diningItem || '').trim(),
    cafeLocation: String(source.cafeLocation || '').trim(),
    cafeMood: String(source.cafeMood || '').trim(),
    cafeRating: Number.isFinite(Number(source.cafeRating)) ? Math.min(5, Math.max(0, Math.round(Number(source.cafeRating)))) : 0,
    notes: String(source.notes || '').trim(), sourceImageId: String(source.sourceImageId || ''),
    sourceImageName: String(source.sourceImageName || '').trim(), sourceMime: String(source.sourceMime || '').trim(),
    template: type === 'flight'
      ? ticketWalletFlightTemplateForCarrier(source.carrier) || ticketWalletNormalizeTemplate(type, source.template)
      : ticketWalletNormalizeTemplate(type, source.template),
    createdAt, updatedAt: Number(source.updatedAt) || now,
  };
}
function normalizeTicketWallet(value) {
  const records = Array.isArray(value) ? value : Array.isArray(value?.tickets) ? value.tickets : [];
  return records.map(normalizeTicketRecord).filter((item, index, all) => item.id && all.findIndex((candidate) => candidate.id === item.id) === index).slice(-200);
}
function normalizeTicketMemories(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [String(key), {
    key: String(item?.key || key), title: String(item?.title || '').trim(), description: String(item?.description || '').trim(),
    imageId: String(item?.imageId || ''), imageName: String(item?.imageName || '').trim(), updatedAt: Number(item?.updatedAt) || Date.now(),
  }]));
}
const storedTicketWallet = normalizeTicketWallet(parseStored(STORAGE.ticketWallet, []));
const storedTicketWalletDisplayOrder = parseStored(STORAGE.ticketWalletDisplayOrder, []);
const storedTicketWalletTypeFilter = localStorage.getItem(STORAGE.ticketWalletTypeFilter);
const storedTicketWalletDiningKindFilter = localStorage.getItem(STORAGE.ticketWalletDiningKindFilter);
const storedTicketMemories = normalizeTicketMemories(parseStored(STORAGE.ticketWalletMemories, {}));
function ticketTypeLabel(type) {
  const labels = TICKET_TYPE_LABELS[type] || TICKET_TYPE_LABELS.other;
  return state?.language === 'en' ? labels[1] : labels[0];
}
function ticketWalletDateLabel(value, withTime = true) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  try { return new Intl.DateTimeFormat(state?.language === 'en' ? 'en-US' : 'zh-CN', withTime ? { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } : { year: 'numeric', month: 'short', day: 'numeric' }).format(date); } catch { return String(value); }
}
function ticketWalletDateInputValue(value) {
  if (!value) return '';
  const date = new Date(value); if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}
function ticketWalletDateFromText(dateText, timeText = '') {
  const normalizedDate = String(dateText || '').replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
  const normalizedTime = String(timeText || '').replace(/[Oo]/g, '0').replace(/[Il]/g, '1');
  const dateMatch = normalizedDate.match(/(20\d{2})\s*[年\/.-]\s*(\d{1,2})\s*[月\/.-]\s*(\d{1,2})/) || normalizedDate.match(/\b(20\d{2})(\d{2})(\d{2})\b/);
  if (!dateMatch) return '';
  const timeMatch = normalizedTime.match(/(\d{1,2})\s*[:：]\s*(\d{2})/) || normalizedTime.match(/\b([01]?\d|2[0-3])([0-5]\d)\b/);
  return dateMatch[1] + '-' + pad(Number(dateMatch[2])) + '-' + pad(Number(dateMatch[3])) + 'T' + pad(Number(timeMatch?.[1] || 0)) + ':' + pad(Number(timeMatch?.[2] || 0));
}
function ticketWalletRecognitionFromText(text, fileName = '') {
  const raw = String(text || '').replace(/[|丨]/g, '1').replace(/[“”]/g, '"');
  const rawLines = raw.split(/[\r\n]+/).map((line) => line.trim()).filter(Boolean);
  const compact = raw.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
  const fileStem = String(fileName || '').replace(/\.[^.]+$/, '').replace(/[（）()【】\[\]]/g, ' ');
  const source = compact + ' ' + fileStem;
  const normalizeOcrDigits = (value) => String(value || '').replace(/[Oo]/g, '0').replace(/[Il]/g, '1').replace(/\s+/g, '');
  const normalizedLine = (line) => String(line || '').replace(/\s+/g, ' ').trim();
  const tokenFromLines = (pattern, transform = (value) => value) => {
    for (const line of [...rawLines, compact, fileStem]) {
      const match = normalizedLine(line).match(pattern);
      if (match?.[1]) return transform(match[1]);
    }
    return '';
  };
  const type = /12306|中国铁路|铁路|车次|检票口|G\s*[0-9O]{1,5}|D\s*[0-9O]{1,5}|C\s*[0-9O]{1,5}/i.test(source) ? 'train' : /登机牌|航班|机场|flight|boarding|[A-Z]{2}\s*\d{2,4}/i.test(source) ? 'flight' : /汽车票|客运|大巴|长途汽车|汽车站|客车票/i.test(source) ? 'car' : /船票|渡轮|码头|ferry/i.test(source) ? 'ferry' : /电影票|影院|放映厅|电影场次/i.test(source) ? 'movie' : /门票|入园|入场券|景区|演唱会|演出门票|博物馆/i.test(source) ? 'admission' : /餐饮|外卖|堂食|餐厅|饭店|美团|饿了么/i.test(source) ? 'dining' : 'other';
  const trainNo = tokenFromLines(/(?:^|[^A-Z0-9])([GDCZTKYS]\s*[0-9O]{1,5})(?=$|[^A-Z0-9])/i, (value) => normalizeOcrDigits(value).toUpperCase());
  const flightNo = tokenFromLines(/\b([A-Z]{2}\s*\d{2,4})\b/i, (value) => value.replace(/\s+/g, '').toUpperCase());
  const ticketNo = type === 'train' ? trainNo : type === 'flight' ? flightNo : '';
  const ticketSerial = tokenFromLines(/(?:^|[^A-Z0-9])([A-Z]\s*(?:[0-9O]\s*){6})(?=$|[^A-Z0-9])/i, (value) => normalizeOcrDigits(value).toUpperCase());
  const codeCandidates = rawLines.map((line) => line.replace(/[^A-Z0-9]/gi, '').replace(/^CRG7/i, 'CRGT').toUpperCase()).concat(compact.replace(/[^A-Z0-9]/gi, '').replace(/^CRG7/i, 'CRGT').toUpperCase());
  const ticketCode = codeCandidates.map((line) => line.match(/CRGT[A-Z0-9]{12,40}/i)?.[0] || '').find(Boolean) || '';
  const priceCandidates = [...rawLines, compact].flatMap((line) => {
    const labeled = line.match(/(?:￥|¥|RMB|票价|金额|[Yy])\s*[:：]?\s*([0-9OoIl]{1,4}(?:[.,][0-9OoIl]{1,2})?)/i)?.[1];
    const bare = line.match(/\b([0-9OoIl]{1,4}[.,][0-9OoIl]{1,2})\s*元/i)?.[1];
    return [labeled, bare].filter(Boolean);
  });
  const priceCandidate = priceCandidates.find((value) => Number(normalizeOcrDigits(value).replace(',', '.')) > 0) || priceCandidates[0] || '';
  const priceAmount = normalizeOcrDigits(priceCandidate).replace(',', '.');
  const price = priceAmount && (type !== 'train' || Number(priceAmount) > 0) ? '￥' + priceAmount + '元' : '';
  const seat = source.match(/(\d{1,3})\s*车\s*(\d{1,3}\s*[A-Z])\s*(?:号)?/i)?.[0]?.replace(/\s+/g, '') || source.match(/\b\d{1,3}\s*[A-Z]\d?\s*(?:号|座)?\b/i)?.[0]?.replace(/\s+/g, '') || '';
  const seatClassRaw = source.match(/商务座|特等座|一等座|二等座|软卧|硬卧|软座|硬座|无座|一等|二等/)?.[0] || '';
  const seatClass = seatClassRaw === '一等' ? '一等座' : seatClassRaw === '二等' ? '二等座' : seatClassRaw;
  const passengerLine = rawLines.find((line) => /(?:\d\s*){17}[\dXx]|\d{3,4}\s*\*{4,}\s*\d{3,4}[Xx]?/.test(line.replace(/\s+/g, ''))) || source;
  const passengerSearchLine = passengerLine.replace(/\s+/g, '');
  const passengerIdMatch = passengerSearchLine.match(/(?:\d\s*){17}[\dXx]|\d{3,4}\s*\*{4,}\s*\d{3,4}[Xx]?/);
  const passengerId = passengerIdMatch?.[0]?.replace(/\s+/g, '') || '';
  const passengerTail = passengerIdMatch ? passengerSearchLine.slice(Number(passengerIdMatch.index || 0) + passengerIdMatch[0].length, Number(passengerIdMatch.index || 0) + passengerIdMatch[0].length + 16) : '';
  const passengerNameCandidate = passengerTail.match(/[\u4e00-\u9fa5]{2,4}/)?.[0] || '';
  const passengerName = /买票|中国|铁路|旅客|检票|发货/.test(passengerNameCandidate) ? '' : passengerNameCandidate;
  const passenger = passengerId ? passengerId + (passengerName ? ' ' + passengerName : '') : passengerName;
  const dateMatch = source.match(/20\d{2}\s*[年\/.-]\s*\d{1,2}\s*[月\/.-]\s*\d{1,2}\s*(?:日)?/) || source.match(/\b20\d{6}\b/);
  const dateText = dateMatch?.[0] || '';
  const dateTail = dateMatch ? source.slice(Number(dateMatch.index || 0), Number(dateMatch.index || 0) + 80) : source;
  const timeText = dateTail.match(/\d{1,2}\s*[:：]\s*\d{2}/)?.[0] || source.match(/\d{1,2}\s*[:：]\s*\d{2}/)?.[0] || dateTail.match(/\b(?:[01]?\d|2[0-3])\s*[：:]?\s*[0-5]\d\b/)?.[0] || '';
  const stationNames = [];
  for (const line of rawLines) {
    const matches = [...line.matchAll(/([\u4e00-\u9fa5A-Za-z]{2,24})\s*(?:车站|站|机场|码头)/g)].map((match) => match[1].trim()).filter((name) => !/^(?:中国铁路|铁路|发货|检票|票据|车次)$/.test(name));
    stationNames.push(...matches);
    if (stationNames.length >= 2) break;
  }
  const routeCandidate = source.match(/([\u4e00-\u9fa5A-Za-z]{2,12}(?:站|机场|码头)?)\s*(?:到|至|→|->|—|-)\s*([\u4e00-\u9fa5A-Za-z]{2,12}(?:站|机场|码头)?)/);
  const route = routeCandidate && !/codex|clipboard/i.test(routeCandidate[0]) ? routeCandidate : null;
  const fileRoute = !route && !/codex|clipboard/i.test(fileStem) && fileStem.match(/([\u4e00-\u9fa5A-Za-z]{2,12})\s*(?:到|至|→|->|-)\s*([\u4e00-\u9fa5A-Za-z]{2,12})/);
  const latinSource = source.replace(/\s+/g, '').toLowerCase();
  const stationAliases = [['shanghaihongqiao', '上海虹桥'], ['hangzhoudong', '杭州东'], ['nanjingnan', '南京南'], ['beijingnan', '北京南'], ['guangzhounan', '广州南'], ['shenzhenbei', '深圳北'], ['suzhou', '苏州'], ['shanghai', '上海'], ['hangzhou', '杭州'], ['nanjing', '南京'], ['beijing', '北京'], ['guangzhou', '广州'], ['shenzhen', '深圳'], ['xian', '西安'], ['chengdu', '成都'], ['wuhan', '武汉'], ['qingdao', '青岛'], ['xiamen', '厦门']];
  const latinStations = [];
  for (const [token, label] of stationAliases) if (latinSource.includes(token) && !latinStations.some((item) => item.token.includes(token))) latinStations.push({ token, label, index: latinSource.indexOf(token) });
  latinStations.sort((first, second) => first.index - second.index);
  const normalizeStationName = (value) => {
    const compactName = String(value || '').replace(/\s+/g, '').toLowerCase();
    return stationAliases.find(([token]) => token === compactName)?.[1] || value;
  };
  const recognizedStationNames = stationNames.map(normalizeStationName);
  const useLatinRoute = recognizedStationNames.length < 2 && latinStations.length >= 2;
  const from = useLatinRoute ? latinStations[0].label : recognizedStationNames[0] || (route || fileRoute)?.[1]?.trim() || '';
  const to = useLatinRoute ? latinStations[1].label : recognizedStationNames[1] || (route || fileRoute)?.[2]?.trim() || '';
  const journey = from && to ? from + '至' + to : '';
  const title = journey || (ticketNo ? ticketNo : '');
  return { type, title, carrier: type === 'train' ? '中国铁路' : '', from, to, departAt: ticketWalletDateFromText(dateText, timeText), ticketNo, ticketSerial, ticketCode, price, seat, seatClass, passenger, passengerName, passengerId, journey };
}
let ticketWalletPaddleOcrPromise = null;
let ticketWalletOcrPromise = null;
function loadTicketWalletPaddleOcr() {
  if (window.__oneboxPaddleOcr) return Promise.resolve(window.__oneboxPaddleOcr);
  if (ticketWalletPaddleOcrPromise) return ticketWalletPaddleOcrPromise;
    ticketWalletPaddleOcrPromise = import('https://cdn.jsdelivr.net/npm/@paddleocr/paddleocr-js@0.4.2/+esm').then(async (module) => {
    if (!module?.PaddleOCR) throw new Error('PaddleOCR unavailable');
    const ocr = await module.PaddleOCR.create({
      lang: 'ch',
      ocrVersion: 'PP-OCRv5',
      // The static PWA is served from GitHub Pages. PaddleOCR's worker entry is
      // a separate CDN script and Safari/Chromium reject that cross-origin
      // Worker constructor, so keep inference on the main thread here. The
      // recognition flow already has its local Tesseract fallback.
    worker: false,
      ortOptions: {
        backend: 'wasm',
        wasmPaths: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',
        numThreads: 2,
        simd: true,
      },
    });
    window.__oneboxPaddleOcr = ocr;
    return ocr;
  }).catch((error) => {
    ticketWalletPaddleOcrPromise = null;
    throw error;
  });
  return ticketWalletPaddleOcrPromise;
}
function loadTicketWalletOcr() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (ticketWalletOcrPromise) return ticketWalletOcrPromise;
  ticketWalletOcrPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error('OCR unavailable'));
    script.onerror = () => reject(new Error('OCR script unavailable'));
    document.head.appendChild(script);
  });
  return ticketWalletOcrPromise;
}
async function ticketWalletPreparedOcrImages(file) {
  if (!file || typeof createImageBitmap !== 'function') return [file];
  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(2.8, Math.max(1.2, 2600 / Math.max(1, longest)));
    const width = Math.round(bitmap.width * scale); const height = Math.round(bitmap.height * scale);
    const makeCanvas = () => {
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'; context.drawImage(bitmap, 0, 0, width, height);
      return { canvas, context };
    };
    const color = makeCanvas();
    const colorBlob = await new Promise((resolve) => color.canvas.toBlob((blob) => resolve(blob || file), 'image/png'));
    const mono = makeCanvas();
    const pixels = mono.context.getImageData(0, 0, width, height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const gray = pixels.data[index] * .299 + pixels.data[index + 1] * .587 + pixels.data[index + 2] * .114;
      const ink = gray < 182 ? Math.max(0, Math.round(gray * .42)) : gray > 232 ? 255 : Math.min(255, Math.round(185 + (gray - 182) * 2.3));
      pixels.data[index] = ink; pixels.data[index + 1] = ink; pixels.data[index + 2] = ink; pixels.data[index + 3] = 255;
    }
    mono.context.putImageData(pixels, 0, 0);
    const monoBlob = await new Promise((resolve) => mono.canvas.toBlob((blob) => resolve(blob || file), 'image/png'));
    const makeFocusBlob = (left, top, cropWidth, cropHeight) => {
      const focusScale = 1.6;
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(cropWidth * focusScale)); canvas.height = Math.max(1, Math.round(cropHeight * focusScale));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
      context.drawImage(color.canvas, left, top, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob || file), 'image/png'));
    };
    const routeFocus = await makeFocusBlob(width * .04, height * .07, width * .92, height * .32);
    const detailFocus = await makeFocusBlob(width * .03, height * .28, width * .70, height * .60);
    const passengerFocus = await makeFocusBlob(width * .03, height * .56, width * .60, height * .22);
    const rightFocus = await makeFocusBlob(width * .62, height * .28, width * .35, height * .24);
    bitmap.close?.();
    return [colorBlob, monoBlob, routeFocus, detailFocus, passengerFocus, rightFocus];
  } catch { return [file]; }
}
async function recognizeTicketWalletImage(file) {
  const quick = ticketWalletRecognitionFromText('', file?.name || '');
  if (!file || !/^image\//i.test(file.type || '')) return quick;
  try {
    const paddle = await loadTicketWalletPaddleOcr();
    const [result] = await paddle.predict(file, { textDetLimitSideLen: 960, textDetLimitType: 'max' });
    const items = Array.isArray(result?.items) ? result.items : [];
    const ordered = [...items].sort((first, second) => {
      const firstY = Math.min(...(first.poly || []).map((point) => Number(point?.[1] ?? point?.y ?? 0)));
      const secondY = Math.min(...(second.poly || []).map((point) => Number(point?.[1] ?? point?.y ?? 0)));
      if (Math.abs(firstY - secondY) > 14) return firstY - secondY;
      const firstX = Math.min(...(first.poly || []).map((point) => Number(point?.[0] ?? point?.x ?? 0)));
      const secondX = Math.min(...(second.poly || []).map((point) => Number(point?.[0] ?? point?.x ?? 0)));
      return firstX - secondX;
    });
    const text = ordered.map((item) => String(item.text || '').trim()).filter(Boolean).join('\n');
    const recognized = ticketWalletRecognitionFromText(text, file.name || '');
    if (text) return { ...quick, ...recognized };
  } catch {
    // The static PWA can still work when the PaddleOCR model CDN is blocked;
    // fall through to the existing local Tesseract path below.
  }
  try {
    const Tesseract = await loadTicketWalletOcr();
    const language = state.language === 'en' ? 'eng' : 'chi_sim+eng';
    const preparedImages = await ticketWalletPreparedOcrImages(file);
    const passes = preparedImages.slice(0, 6);
    const texts = [];
    for (let passIndex = 0; passIndex < passes.length; passIndex += 1) {
      const result = await Tesseract.recognize(passes[passIndex], language, { tessedit_pageseg_mode: passIndex === 0 ? '6' : passIndex >= 4 ? '7' : '11', logger: (message) => {
        if (!state.ticketWalletEditorOpen || message.status !== 'recognizing text') return;
        const progress = ((passIndex + Number(message.progress || 0)) / Math.max(1, passes.length)) * 100;
        state.ticketWalletRecognition = { status: 'running', progress: Math.round(progress), message: state.language === 'en' ? 'Recognizing ticket…' : '正在识别票据…' };
        render();
      } });
      texts.push(result?.data?.text || '');
    }
    const orderedTexts = texts.length > 2 ? texts.slice(2).concat(texts.slice(0, 2)) : texts;
    return { ...quick, ...ticketWalletRecognitionFromText(orderedTexts.join('\n'), file.name || '') };
  } catch {
    return quick;
  }
}
function ticketWalletJourneyKey(record) {
  if (record.journey) return record.journey;
  return [String(record.departAt || record.createdAt || '').slice(0, 10), record.from, record.to].join('|');
}
function ticketWalletDepartureTimestamp(record) {
  const value = String(record?.departAt || '').trim();
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}
function ticketWalletDepartureAsc(first, second) {
  const firstTime = ticketWalletDepartureTimestamp(first); const secondTime = ticketWalletDepartureTimestamp(second);
  if (firstTime === Number.NEGATIVE_INFINITY) return secondTime === Number.NEGATIVE_INFINITY ? Number(first?.createdAt || 0) - Number(second?.createdAt || 0) : 1;
  if (secondTime === Number.NEGATIVE_INFINITY) return -1;
  const now = Date.now();
  const firstPast = firstTime < now; const secondPast = secondTime < now;
  if (firstPast !== secondPast) return firstPast ? 1 : -1;
  const timeOrder = firstPast ? secondTime - firstTime : firstTime - secondTime;
  return timeOrder || Number(first?.createdAt || 0) - Number(second?.createdAt || 0);
}
function ticketWalletJourneys(records = state.ticketWallet) {
  const groups = new Map();
  [...records].sort(ticketWalletDepartureAsc).forEach((record) => {
    const key = ticketWalletJourneyKey(record);
    if (!groups.has(key)) groups.set(key, { key, records: [], from: record.from, to: record.to, start: record.departAt || record.createdAt, end: record.arriveAt || record.departAt || record.updatedAt });
    const group = groups.get(key); group.records.push(record); group.from ||= record.from; group.to ||= record.to;
    if (new Date(record.departAt || record.createdAt) < new Date(group.start)) group.start = record.departAt || record.createdAt;
    if (new Date(record.arriveAt || record.departAt || record.updatedAt) > new Date(group.end)) group.end = record.arriveAt || record.departAt || record.updatedAt;
  });
  return [...groups.values()].map((group) => ({ ...group, memory: state.ticketWalletMemories[group.key] || null })).sort((a, b) => ticketWalletDepartureAsc({ departAt: a.start }, { departAt: b.start }));
}
function saveTicketWallet() {
  syncTicketWalletCalendarEvents(false);
  saveStored(STORAGE.ticketWallet, state.ticketWallet);
}
function saveTicketWalletDisplayOrder() { saveStored(STORAGE.ticketWalletDisplayOrder, state.ticketWalletDisplayOrder); }
function saveTicketWalletTypeFilter() { localStorage.setItem(STORAGE.ticketWalletTypeFilter, state.ticketWalletTypeFilter); }
function saveTicketWalletDiningKindFilter() { localStorage.setItem(STORAGE.ticketWalletDiningKindFilter, state.ticketWalletDiningKindFilter); }
function saveTicketWalletMemories() { saveStored(STORAGE.ticketWalletMemories, state.ticketWalletMemories); }
function ticketWalletCalendarSchedule(record) {
  const raw = String(record?.departAt || record?.arriveAt || '').trim();
  if (!raw) return null;
  const localMatch = !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)
    ? raw.match(/^(?:(\d{4})[-/](\d{1,2})[-/](\d{1,2})|(?:(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?))(?:[T\s]+(\d{1,2}):([0-5]\d))?/)
    : null;
  if (localMatch) {
    const year = Number(localMatch[1] || localMatch[4]);
    const month = Number(localMatch[2] || localMatch[5]);
    const day = Number(localMatch[3] || localMatch[6]);
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    const hour = Number(localMatch[7] || 0);
    const minute = Number(localMatch[8] || 0);
    if (hour > 23) return null;
    const hasTime = Boolean(localMatch[7]);
    const time = hasTime ? pad(hour) + ':' + pad(minute) : '';
    const key = dateKey(date);
    return { key, time, sourceDate: key + (time ? 'T' + time : '') };
  }
  const numeric = /^\d{10,13}$/.test(raw) ? Number(raw) * (raw.length === 10 ? 1000 : 1) : NaN;
  const date = new Date(Number.isFinite(numeric) ? numeric : raw);
  if (Number.isNaN(date.getTime())) return null;
  const key = dateKey(date);
  const time = /[T\s]\d{1,2}:[0-5]\d/.test(raw) ? pad(date.getHours()) + ':' + pad(date.getMinutes()) : '';
  return { key, time, sourceDate: key + (time ? 'T' + time : '') };
}
function ticketWalletCalendarEventTitle(record) {
  const typeLabel = ticketTypeLabel(record.type);
  if (record.type === 'dining') {
    const kind = TICKET_WALLET_DINING_KINDS[normalizeTicketWalletDiningKind(record.diningKind, 'drink')];
    const details = [record.carrier, record.cafeDrink || record.diningItem].filter(Boolean).join(' · ');
    return [kind.label[state.language === 'en' ? 1 : 0], details].filter(Boolean).join(' · ');
  }
  const route = [record.from, record.to].filter(Boolean).join(' → ');
  const details = TICKET_WALLET_TRAVEL_TYPES.includes(record.type)
    ? route || record.title
    : record.title && record.title !== typeLabel ? record.title : [record.from, record.to].filter(Boolean).join(' · ');
  return [typeLabel, details].filter(Boolean).join(' · ') || typeLabel;
}
function ticketWalletCalendarRemoveLinkedEvents(record) {
  let changed = false;
  Object.keys(state.events || {}).forEach((day) => {
    const before = state.events[day] || [];
    const after = before.filter((event) => event.sourceTicketId !== record.id && (!record.calendarEventId || event.id !== record.calendarEventId));
    if (after.length !== before.length) changed = true;
    if (after.length) state.events[day] = after; else delete state.events[day];
  });
  return changed;
}
function deleteTicketWalletCalendarEvents(record) {
  if (!record || !ticketWalletCalendarRemoveLinkedEvents(record)) return;
  saveEvents(); syncAgendaReminders(); scheduleNotificationCheck();
}
function syncTicketWalletCalendarEvents(persistWallet = true) {
  let eventsChanged = false;
  let ticketsChanged = false;
  (state.ticketWallet || []).forEach((record) => {
    const schedule = ticketWalletCalendarSchedule(record);
    const linked = [];
    Object.entries(state.events || {}).forEach(([day, events]) => (events || []).forEach((event) => {
      if (event.sourceTicketId === record.id || record.calendarEventId && event.id === record.calendarEventId) linked.push({ day, event });
    }));
    if (!schedule) {
      if (ticketWalletCalendarRemoveLinkedEvents(record)) eventsChanged = true;
      if (record.calendarEventId || record.calendarEventSourceDate || record.calendarEventDisabled) {
        record.calendarEventId = ''; record.calendarEventSourceDate = ''; record.calendarEventDisabled = false; ticketsChanged = true;
      }
      return;
    }
    if (record.calendarEventDisabled && record.calendarEventSourceDate === schedule.sourceDate) {
      if (ticketWalletCalendarRemoveLinkedEvents(record)) eventsChanged = true;
      if (record.calendarEventId) { record.calendarEventId = ''; ticketsChanged = true; }
      return;
    }
    if (record.calendarEventDisabled) { record.calendarEventDisabled = false; ticketsChanged = true; }
    const eventId = record.calendarEventId || linked[0]?.event.id || 'ticket-calendar-' + record.id;
    const nextEvent = { id: eventId, title: ticketWalletCalendarEventTitle(record), time: schedule.time, repeat: 'once', weekdays: [], createdAt: Number(linked[0]?.event.createdAt) || Number(record.createdAt) || Date.now(), source: 'ticket-wallet', sourceTicketId: record.id };
    const isCurrent = linked.length === 1 && linked[0].day === schedule.key && linked[0].event.id === eventId && linked[0].event.title === nextEvent.title && String(linked[0].event.time || '') === schedule.time && (linked[0].event.repeat || 'once') === 'once' && linked[0].event.source === 'ticket-wallet' && linked[0].event.sourceTicketId === record.id;
    if (!isCurrent) {
      if (ticketWalletCalendarRemoveLinkedEvents(record)) eventsChanged = true;
      state.events[schedule.key] ||= [];
      state.events[schedule.key].push(nextEvent);
      eventsChanged = true;
    }
    if (record.calendarEventId !== eventId || record.calendarEventSourceDate !== schedule.sourceDate || record.calendarEventDisabled) {
      record.calendarEventId = eventId; record.calendarEventSourceDate = schedule.sourceDate; record.calendarEventDisabled = false; ticketsChanged = true;
    }
  });
  if (eventsChanged) { saveEvents(); syncAgendaReminders(); scheduleNotificationCheck(); }
  if (ticketsChanged && persistWallet) saveStored(STORAGE.ticketWallet, state.ticketWallet);
}
async function hydrateTicketWalletImages() {
  const ids = [...state.ticketWallet.map((item) => item.sourceImageId), ...Object.values(state.ticketWalletMemories).map((item) => item.imageId)].filter(Boolean);
  await Promise.all([...new Set(ids)].map((id) => ticketWalletImageGet(id)));
  if (state.ticketWalletOpen) render();
}
function homeTabIsVisible(id) {
  return id === 'footprint' ? state?.footprint === true : state?.homeFeed?.visible?.includes(id) === true;
}
function homeTabEntries() {
  const sources = state?.homeFeed?.order?.map((id) => RSS_SOURCES.find((source) => source.id === id)).filter(Boolean) || RSS_SOURCES;
  return [{ id: 'footprint', name: t('footprint'), badge: '足', className: 'footprint', local: true }, ...sources];
}
function homeTabMarkMarkup(entry, extraClass = '') {
  if (entry.id === 'footprint') return '<span class="feed-source-mark footprint' + (extraClass ? ' ' + extraClass : '') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="7" r="2.2"/><circle cx="16.5" cy="8.5" r="2.2"/><circle cx="6" cy="16.5" r="2.2"/><circle cx="15.5" cy="18" r="2.2"/></svg></span>';
  return homeFeedSourceMarkMarkup(entry, extraClass);
}
function homeTabIds() {
  return [...(state.footprint ? ['footprint'] : []), ...homeFeedSources().map((source) => source.id)];
}
function homeFeedSourceMarkMarkup(source, extraClass = '') {
  return '<span class="feed-source-mark ' + escapeHtml(source.className) + (extraClass ? ' ' + extraClass : '') + '"><img src="' + escapeHtml(source.icon) + '" alt="" loading="eager" onerror="this.hidden=true;this.nextElementSibling.style.display=\'inline\'"><span class="feed-source-fallback">' + escapeHtml(source.badge) + '</span></span>';
}
const initialWeatherCards = (Array.isArray(rawWeatherCards) && rawWeatherCards.length ? rawWeatherCards : legacyWeather ? [legacyWeather] : []).map((item) => ({
  ...item,
  // Loading is a transient request state and must never survive a page
  // reload. Keep the place visible as a retryable failed card instead of
  // leaving it permanently stuck on the hourglass.
  loading: false,
  loadError: item.loadError || (item.loading && !item.current ? 'weather-load-failed' : ''),
  isCurrentLocation: Boolean(item.isCurrentLocation || item.name === '当前位置' || item.name === 'Current location'),
})).filter((item, index, cards) => !item.isCurrentLocation || cards.findIndex((candidate) => candidate.isCurrentLocation) === index);
const initialHash = location.hash.slice(1);
const initialTicketWalletOpen = initialHash === 'ticket-wallet';
const initialToolHash = initialHash === 'navigation' && storedNavigationLocation === 'tools' ? 'navigation' : initialHash === 'convert' ? 'translate' : initialHash;
const initialTool = Object.keys(TOOL_DEFS).includes(initialToolHash) ? initialToolHash : initialToolOrder.includes(storedToolActive) ? storedToolActive : initialToolOrder[0] || 'calculator';
const initialSection = initialTicketWalletOpen ? 'mine' : initialHash === 'navigation' && storedNavigationLocation === 'tools' ? 'tools' : ['home', 'navigation', 'messages', 'mine'].includes(initialHash) ? initialHash : Object.keys(TOOL_DEFS).includes(initialToolHash) ? 'tools' : 'home';
const normalizeReaderLibrary = (value) => {
  const books = Array.isArray(value) ? value.filter((book) => book && book.id && book.name) : [];
  const ordered = [...books].sort((a, b) => {
    const aOrder = Number(a.order); const bOrder = Number(b.order);
    if (Number.isFinite(aOrder) && Number.isFinite(bOrder) && aOrder !== bOrder) return bOrder - aOrder;
    if (Number.isFinite(aOrder) !== Number.isFinite(bOrder)) return Number.isFinite(aOrder) ? -1 : 1;
    return Number(b.lastOpenedAt || b.createdAt || 0) - Number(a.lastOpenedAt || a.createdAt || 0);
  });
  let nextOrder = ordered.reduce((max, book) => Math.max(max, Number(book.order) || 0), 0);
  const checkpoints = parseStored(STORAGE.readerProgress, {}) || {};
  return ordered.map((book, index) => ({ ...book, ...(Number(checkpoints[book.id]?.savedAt) > Number(book.progressUpdatedAt || 0) ? { progress: checkpoints[book.id].progress, progressUpdatedAt: checkpoints[book.id].savedAt } : {}), order: Number.isFinite(Number(book.order)) ? Number(book.order) : nextOrder + (ordered.length - index) }));
};
const state = {
  tool: initialTool,
  section: initialSection,
  theme: ['light', 'dark', 'dark-gray', 'system'].includes(storedTheme) ? storedTheme : 'system',
  color: ['mono', 'purple', 'blue', 'green', 'yellow'].includes(storedColor) && (storedColor !== 'mono' || storedColorExplicit) ? storedColor : 'purple',
  languageMode: ['zh', 'en', 'system'].includes(storedLanguage) ? storedLanguage : 'system',
  language: resolveLanguageMode(storedLanguage),
  layoutMode: storedLayout === 'classic' ? 'classic' : 'simple',
  toolOrder: initialToolOrder,
  calcExpr: storedCalculator.expr || '', calcHistory: Array.isArray(storedCalculator.history) ? storedCalculator.history : [],
  calcJustEvaluated: false, calcInverse: false, calcHistoryOpen: storedCalculator.historyOpen === true, calcAngle: 'deg', devTools: initialDevTools,
  month: new Date(today.getFullYear(), today.getMonth(), 1), selectedDate: dateKey(today),
  events: parseStored(STORAGE.events, {}) || {},
  weatherCards: initialWeatherCards.map((item) => ({ ...item, id: item.id || uid() })),
  activeWeatherId: initialWeatherCards[0]?.id || null, weatherLoading: false, weatherError: '', weatherRequest: 0,
  weatherSearchQuery: '', weatherSearchTerm: '', weatherSearchLoading: false, weatherSearchError: '', weatherSearchRequest: 0, weatherSearchResults: [],
  lunarDialogDate: null, lastCalendarTap: { key: '', at: 0 },
  translation: { source: 'auto', target: 'zh', input: '', result: '', loading: false, error: '' },
  translationHistory: parseStored(STORAGE.translationHistory, []),
  translationHistoryOpen: storedTranslationHistoryOpen,
  library: normalizeReaderLibrary(storedLibrary),
  readerBookId: null, readerUrl: '', readerAssetUrls: [], readerContent: '', readerHint: '', readerToc: [], readerDialog: '', readerChromeHidden: false, readerImmersive: false, readerMode: 'library', readerReadingMode: 'scroll', readerPage: 0, readerSelectedText: '', readerSelection: null, readerAnnotationDraft: null, readerSelectionInput: 'mouse', readerLayout: storedReaderLayout === 'list' ? 'list' : 'grid', annotationBookId: null,
  readerPreferences: { theme: ['paper', 'sepia', 'green', 'dark'].includes(storedReaderPreferences.theme) ? storedReaderPreferences.theme : 'paper', fontSize: Number.isFinite(Number(storedReaderPreferences.fontSize)) ? Math.min(26, Math.max(15, Number(storedReaderPreferences.fontSize))) : 18, fontFamily: ['system', 'serif', 'mono'].includes(storedReaderPreferences.fontFamily) ? storedReaderPreferences.fontFamily : 'system', lineHeight: Number.isFinite(Number(storedReaderPreferences.lineHeight)) ? Math.min(2.2, Math.max(1.35, Number(storedReaderPreferences.lineHeight))) : 1.8, paragraphSpacing: Number.isFinite(Number(storedReaderPreferences.paragraphSpacing)) ? Math.min(28, Math.max(6, Number(storedReaderPreferences.paragraphSpacing))) : 14, letterSpacing: Number.isFinite(Number(storedReaderPreferences.letterSpacing)) ? Math.min(2, Math.max(0, Number(storedReaderPreferences.letterSpacing))) : 0, pageAnimation: ['slide', 'none'].includes(storedReaderPreferences.pageAnimation) ? storedReaderPreferences.pageAnimation : 'slide', readingMode: storedReaderPreferences.readingMode === 'pages' ? 'pages' : 'scroll', fullscreenOnOpen: storedReaderPreferences.fullscreenOnOpen === true },
  homeFeed: { active: initialHomeFeedActive, order: initialHomeFeedOrder, visible: initialHomeFeedVisible, hasNew: false, loading: false, errors: {}, stale: {}, updatedAt: Number(storedHomeFeeds.updatedAt || 0), cacheVersion: storedHomeFeeds.cacheVersion || '', newItems: boundedHomeFeedIdMap(storedHomeFeeds.newItems, RSS_MAX_ITEMS_PER_SOURCE), newItemsPending: boundedHomeFeedIdMap(storedHomeFeeds.newItemsPending && typeof storedHomeFeeds.newItemsPending === 'object' ? storedHomeFeeds.newItemsPending : storedHomeFeeds.newItems), sources: storedHomeFeeds.sources && typeof storedHomeFeeds.sources === 'object' ? storedHomeFeeds.sources : {} },
  navigation: normalizeNavigation(storedNavigation), navigationLocation: storedNavigationLocation, navigationDialog: null, navigationFolderDraft: null, navigationSettingsOpen: false,
  ticketWalletOpen: initialTicketWalletOpen, ticketWalletView: 'tickets', ticketWalletTypeFilter: normalizeTicketWalletFilter(storedTicketWalletTypeFilter), ticketWalletDiningKindFilter: normalizeTicketWalletDiningKindFilter(storedTicketWalletDiningKindFilter), ticketWalletSelectedId: '', ticketWalletDisplayOrder: Array.isArray(storedTicketWalletDisplayOrder) ? storedTicketWalletDisplayOrder.filter((id) => typeof id === 'string') : [], ticketWalletEditorOpen: false, ticketWalletEditorStage: 'choose', ticketWalletEditingId: '', ticketWalletDraft: null, ticketWalletMemoryDraft: null, ticketWalletRecognition: { status: 'idle', progress: 0, message: '' },
  ticketWallet: storedTicketWallet, ticketWalletMemories: storedTicketMemories,
  homeFeedRead: storedHomeFeedRead && typeof storedHomeFeedRead === 'object' ? storedHomeFeedRead : {},
  notifications: parseStored(STORAGE.notifications, []), notificationOpen: false, settingsOpen: false, githubDialogOpen: false, recentReadingOpen: false,
  notificationPreference: storedNotificationPreference === 'deny' ? 'deny' : 'allow',
  topDisplay: { theme: storedTopDisplay.theme !== false, language: storedTopDisplay.language !== false, messages: storedTopDisplay.messages !== false },
  footprint: storedFootprint,
  homeSourceDialogOpen: false,
  openMode: storedOpenMode === 'new-tab' ? 'new-tab' : 'current',
  mascotVisible: storedMascotVisible,
  mascotDisplayMode: storedMascotDisplayMode,
  petProfile: storedPetProfile,
  petDialogOpen: false,
  swRegistration: null, updateAvailable: false, updateChecking: false, updateApplying: false, updateReloading: false, updateError: false,
  githubAgreementAccepted: localStorage.getItem(STORAGE.githubAgreement) === 'true',
  githubSyncSelection: readGithubSyncSelection(),
  github: (() => { const value = parseStored(STORAGE.github, {}) || {}; return { clientId: GITHUB_CLIENT_ID, token: value.token || '', user: value.user || null, gistId: value.gistId || '', deviceCode: '', userCode: '', verificationUri: '', verificationUriComplete: '', expiresAt: 0, interval: 5, manualTokenOpen: false }; })(),
  githubSync: { active: false, mode: '', progress: 0, message: '', error: '' },
};
const homeFeedRequests = new Map();
const homeFeedExpanded = new Set();
function petText(key, values = {}) {
  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll('{' + name + '}', String(value)), t(key));
}
function savePetProfile() { saveStored(STORAGE.petProfile, state.petProfile); }
function petCurrentLevel() { return petLevelForPoints(state.petProfile?.points || 0); }
function petOutfitById(id) { return PET_OUTFITS.find((item) => item.id === id) || PET_OUTFITS[0]; }
function petOutfitUnlocked(outfit) { return petCurrentLevel().level >= Number(outfit?.level || 1); }
function petInteractionUnlocked(action) {
  const item = PET_INTERACTIONS.find((entry) => entry.id === action);
  return !item || petCurrentLevel().level >= Number(item.level || 1);
}
function petOwnerLabel() {
  const login = state.github?.user?.login;
  return login ? petText('petGithubOwner', { owner: login }) : t('petLocalOwner');
}
function bindPetProfileToCurrentUser() {
  const login = state.github?.user?.login;
  if (!login || state.petProfile.owner === 'github:' + login) return;
  state.petProfile.owner = 'github:' + login;
  savePetProfile();
}
function awardPetPoints(amount, reason = 'interaction', uniqueKey = '') {
  if (!state.petProfile || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return false;
  if (uniqueKey && state.petProfile.lastAwards?.[uniqueKey]) return false;
  const before = petCurrentLevel();
  const points = Math.max(1, Math.floor(Number(amount)));
  state.petProfile.points += points;
  state.petProfile.owner = state.github?.user?.login ? 'github:' + state.github.user.login : 'device';
  if (uniqueKey) state.petProfile.lastAwards[uniqueKey] = Date.now();
  if (reason === 'article') state.petProfile.stats.articles += 1;
  if (reason === 'book') state.petProfile.stats.books += 1;
  if (reason === 'tool') state.petProfile.stats.tools += 1;
  if (reason === 'interaction') state.petProfile.stats.interactions += 1;
  state.petProfile.lastAwards = Object.fromEntries(Object.entries(state.petProfile.lastAwards).slice(-120));
  savePetProfile();
  const after = petCurrentLevel();
  if (after.level > before.level) toast(petText('petLevelUp', { level: after.level }), 'info');
  if (mascotRuntime?.root) syncMascotOutfit();
  if (state.petDialogOpen) renderPetDialog();
  if (mascotRuntime?.panel && !mascotRuntime.panel.hidden) refreshMascotBriefing();
  return true;
}
function setPetOutfit(id) {
  const outfit = petOutfitById(id);
  if (!petOutfitUnlocked(outfit)) return false;
  state.petProfile.activeOutfit = outfit.id;
  savePetProfile();
  syncMascotOutfit();
  if (state.petDialogOpen) renderPetDialog();
  return true;
}
function homeFeedSourceRequesting(sourceId = state.homeFeed.active) {
  return sourceId !== 'footprint' && homeFeedRequests.has(sourceId);
}
function homeFeedHasRequests() { return homeFeedRequests.size > 0; }
function syncHomeFeedLoading() {
  // Keep the indicator visible for the complete lifetime of the active
  // request. Hiding it after a grace period made a later tab tap look inert
  // while the original request was still running.
  state.homeFeed.loading = homeFeedSourceRequesting();
}
if (storedHomeFeedVisibilityMigration < HOME_FEED_VISIBILITY_MIGRATION) {
  localStorage.setItem(STORAGE.homeFeedVisibilityMigration, String(HOME_FEED_VISIBILITY_MIGRATION));
  if (Array.isArray(storedHomeFeedVisibility)) saveStored(STORAGE.homeFeedVisibility, state.homeFeed.visible);
}
function formatNumber(value) {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1e12 || (Math.abs(value) > 0 && Math.abs(value) < 1e-8)) return value.toExponential(8).replace(/\.0+e/, 'e');
  return new Intl.NumberFormat(state.language === 'en' ? 'en-US' : 'zh-CN', { maximumFractionDigits: 10 }).format(value);
}
function formatDate(key, options = { month: 'long', day: 'numeric', weekday: 'long' }) {
  return new Intl.DateTimeFormat(state.language === 'en' ? 'en-US' : 'zh-CN', options).format(dateFromKey(key));
}
function themeIcon(resolved) {
  if (resolved === 'dark') return '<svg class="header-line-icon theme-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>';
  return '<svg class="header-line-icon theme-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
}
function languageIcon() {
  return '<svg class="header-line-icon language-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M3.8 9h16.4M3.8 15h16.4M12 3.5c2.2 2.3 3.4 5.1 3.4 8.5S14.2 18.2 12 20.5C9.8 18.2 8.6 15.4 8.6 12S9.8 5.8 12 3.5Z"/></svg>';
}
function applyTheme() {
  const resolved = state.theme === 'dark-gray' ? 'dark' : state.theme === 'system' ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : state.theme;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = state.theme;
  document.documentElement.dataset.color = state.color;
  document.documentElement.style.colorScheme = resolved;
  if (!isIosSafariReaderSurfaceActive()) {
    $$('meta[name="theme-color"]').forEach((meta) => { meta.content = resolved === 'dark' ? '#000000' : '#f3f5fa'; });
  }
  const appleStatusBar = $('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleStatusBar) appleStatusBar.content = resolved === 'dark' ? 'black-translucent' : 'default';
  const button = $('#themeBtn');
  if (button) {
    button.innerHTML = themeIcon(resolved);
    button.setAttribute('aria-label', t('theme') + '：' + t(state.theme === 'dark-gray' ? 'darkGray' : state.theme));
    button.dataset.themeMode = state.theme;
    button.dataset.resolvedTheme = resolved;
  }
}
function renderHeaderControls() {
  const simple = state.layoutMode === 'simple';
  document.documentElement.classList.toggle('layout-simple', simple);
  document.documentElement.classList.toggle('layout-classic', !simple);
  const layoutNav = $('#layoutNav');
  if (layoutNav) layoutNav.hidden = !simple;
  const topDisplay = state.topDisplay || { theme: true, language: true, messages: true };
  const visibility = { notifyBtn: false, themeBtn: !simple && topDisplay.theme, languageBtn: !simple && topDisplay.language, settingsBtn: !simple };
  Object.entries(visibility).forEach(([id, visible]) => {
    const button = $('#' + id);
    if (button) button.hidden = !visible;
  });
  const languageButton = $('#languageBtn');
  if (languageButton) {
    languageButton.innerHTML = languageIcon();
    const languageLabel = state.languageMode === 'system' ? t('system') : state.languageMode === 'zh' ? '中文' : 'English';
    languageButton.setAttribute('aria-label', t('language') + '：' + languageLabel);
    languageButton.dataset.languageMode = state.languageMode;
  }
  const languageControl = $('#languageControl');
  const languagePicker = $('#languagePicker');
  if (languageControl) languageControl.hidden = true;
  if (languagePicker) languagePicker.value = state.languageMode;
  renderTopNav();
  refreshUpdateIndicator();
}
function applyLanguage() {
  state.language = resolveLanguageMode(state.languageMode);
  document.documentElement.lang = state.language === 'en' ? 'en' : 'zh-CN';
  document.title = state.language === 'en' ? 'OneBox · Daily Toolbox' : 'OneBox · 日常工具箱';
  const connectionStatus = $('#connectionStatus');
  if (connectionStatus) connectionStatus.textContent = navigator.onLine ? t('online') : t('offline');
  applyTheme();
  renderHeaderControls();
}
function saveThemeLanguage() { localStorage.setItem(STORAGE.theme, state.theme); localStorage.setItem(STORAGE.language, state.languageMode); queuePersistentSnapshot(); }
function saveColorPreference() { localStorage.setItem(STORAGE.color, state.color); localStorage.setItem(STORAGE.colorExplicit, 'true'); queuePersistentSnapshot(); }
function saveTopDisplay() { saveStored(STORAGE.topDisplay, state.topDisplay); }
function saveFootprintPreference() { saveStored(STORAGE.footprint, state.footprint); }
function saveMascotVisibility() { localStorage.setItem(STORAGE.mascotVisible, state.mascotVisible ? 'true' : 'false'); queuePersistentSnapshot(); }
function saveMascotDisplayMode() { localStorage.setItem(STORAGE.mascotDisplayMode, state.mascotDisplayMode === 'full' ? 'full' : 'half'); queuePersistentSnapshot(); }
function saveLayoutPreference() { localStorage.setItem(STORAGE.layout, state.layoutMode); queuePersistentSnapshot(); }
function cycleTheme() {
  state.theme = state.theme === 'system' ? 'light' : state.theme === 'light' ? 'dark' : state.theme === 'dark' ? 'dark-gray' : 'system';
  saveThemeLanguage(); applyTheme(); render();
}
function cycleLanguage() {
  state.languageMode = state.languageMode === 'system' ? 'zh' : state.languageMode === 'zh' ? 'en' : 'system';
  saveThemeLanguage(); applyLanguage(); renderNav(); render();
  if (state.settingsOpen) renderSettings();
}

function heading(title, subtitle, actions = '') {
  return actions ? '<div class="tool-head"><div class="tool-actions">' + actions + '</div></div>' : '';
}
const SECTION_DEFS = {
  home: { key: 'home', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"/></svg>', activeIcon: '<svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.2Z"/></svg>' },
  tools: { key: 'tools', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>', activeIcon: '<svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>' },
  navigation: { key: 'navigation', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>', activeIcon: '<svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3.5h14A1.5 1.5 0 0 1 20.5 5v14A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5Zm3 3v2h8v-2H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z"/></svg>' },
  messages: { key: 'messages', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>', activeIcon: '<svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.3 9.4c0-3.7-2.4-6.2-6.3-6.2s-6.3 2.5-6.3 6.2c0 7-2.7 7.3-2.7 9.3 0 .6.4 1 1 1h16c.6 0 1-.4 1-1 0-2-2.7-2.3-2.7-9.3ZM9.6 21h4.8"/></svg>' },
  mine: { key: 'mine', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>', activeIcon: '<svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4ZM4.1 20.4c.7-4.3 3.3-6.6 7.9-6.6s7.2 2.3 7.9 6.6H4.1Z"/></svg>' },
};
SECTION_DEFS.navigation.icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.1 5-4.9 2 2-4.9 5-2.1Z"/></svg>';
SECTION_DEFS.navigation.activeIcon = '<svg class="filled-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 12 2.5Zm4.55 6.32-2.19 5.47-5.36 2.2a.9.9 0 0 1-1.18-1.17l2.15-5.34 5.41-2.27a.9.9 0 0 1 1.17 1.11Z"/></svg>';
const sectionIcon = (item, active) => active ? item.activeIcon : item.icon;
function renderNav() {
  const includeNavigation = state.navigationLocation === 'tools';
  const normalizedOrder = normalizeToolOrder(state.toolOrder, includeNavigation);
  if (normalizedOrder.join('|') !== state.toolOrder.join('|')) { state.toolOrder = normalizedOrder; saveToolOrder(); }
  const toolIds = includeNavigation ? normalizedOrder : normalizedOrder.filter((id) => id !== 'navigation');
  const previousTabs = nav.querySelector('.tool-tabs');
  const previousScrollLeft = previousTabs?.scrollLeft || 0;
  const tabsMarkup = toolIds.map((id, index) => {
    const item = TOOL_DEFS[id];
    const active = id === 'navigation' ? state.section === 'tools' && state.tool === 'navigation' : state.section === 'tools' && state.tool === id;
    return '<button class="tab ' + (active ? 'active' : '') + '" draggable="true" data-tool="' + id + '" data-tool-index="' + index + '" aria-current="' + (active ? 'page' : 'false') + '"><span aria-hidden="true">' + item.icon + '</span>' + toolName(id) + '</button>';
  }).join('');
  nav.innerHTML = '<div class="tool-tab-panel"><button class="feed-source-scroll-button" data-tool-scroll="previous" type="button" hidden aria-label="' + escapeHtml(t('feedTabPrevious')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5.25 8.25 12 15 18.75"/></svg></button><div class="tool-tabs" data-tab-rail="tools" role="tablist" aria-label="' + escapeHtml(t('tools')) + '">' + tabsMarkup + '</div><button class="feed-source-scroll-button" data-tool-scroll="next" type="button" hidden aria-label="' + escapeHtml(t('feedTabNext')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.25 15.75 12 9 18.75"/></svg></button></div>';
  const nextTabs = nav.querySelector('.tool-tabs');
  if (nextTabs) {
    nextTabs.scrollLeft = Math.min(previousScrollLeft, Math.max(0, nextTabs.scrollWidth - nextTabs.clientWidth));
    nextTabs.addEventListener('scroll', updateToolTabOverflowControls, { passive: true });
    requestAnimationFrame(updateToolTabOverflowControls);
  }
  nav.title = t('reorderHint');
}
function focusActiveToolTab(smooth = false) {
  const tabs = nav.querySelector('.tool-tabs');
  const active = tabs?.querySelector('.tab.active');
  if (!tabs || !active || tabs.scrollWidth <= tabs.clientWidth + 1) return;
  const maxScroll = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
  const padding = 8;
  const visibleLeft = tabs.scrollLeft + padding;
  const visibleRight = tabs.scrollLeft + tabs.clientWidth - padding;
  let target = tabs.scrollLeft;
  if (active.offsetLeft < visibleLeft) target = active.offsetLeft - padding;
  else if (active.offsetLeft + active.offsetWidth > visibleRight) target = active.offsetLeft + active.offsetWidth - tabs.clientWidth + padding;
  target = Math.min(maxScroll, Math.max(0, target));
  tabs.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
}
function updateToolTabOverflowControls() {
  const panel = nav.querySelector('.tool-tab-panel');
  const tabs = nav.querySelector('.tool-tabs');
  const previous = nav.querySelector('[data-tool-scroll="previous"]');
  const next = nav.querySelector('[data-tool-scroll="next"]');
  if (!panel || !tabs || !previous || !next) return;
  const maxScroll = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
  const hasOverflow = maxScroll > 1;
  const hasPrevious = tabs.scrollLeft > 1;
  const hasNext = tabs.scrollLeft < maxScroll - 1;
  panel.classList.toggle('has-tool-overflow', hasOverflow);
  panel.classList.toggle('has-tool-overflow-left', hasPrevious);
  panel.classList.toggle('has-tool-overflow-right', hasNext);
  previous.hidden = !hasPrevious;
  next.hidden = !hasNext;
}
function scrollToolTabs(direction) {
  const tabs = nav.querySelector('.tool-tabs');
  if (!tabs) return;
  tabs.scrollBy({ left: direction * Math.max(120, Math.round(tabs.clientWidth * .72)), behavior: 'smooth' });
}
function mainSectionEntries() {
  return Object.values(SECTION_DEFS).filter((item) => item.key !== 'navigation' || state.navigationLocation === 'main');
}
function renderTopNav() {
  const layoutNav = $('#layoutNav');
  if (!layoutNav) return;
  const unread = state.notifications.filter((item) => !item.read).length;
  layoutNav.innerHTML = mainSectionEntries().map((item) => {
    const active = state.section === item.key;
    const homeUpdateDot = item.key === 'home' && state.homeFeed.hasNew ? '<i class="nav-update-dot" aria-label="' + (state.language === 'en' ? 'New updates' : '有新内容') + '"></i>' : '';
    return '<button class="layout-nav-button ' + (active ? 'active' : '') + '" data-section="' + item.key + '" aria-current="' + (active ? 'page' : 'false') + '" aria-label="' + t(item.key) + '" title="' + t(item.key) + '"><span class="layout-nav-icon" aria-hidden="true">' + sectionIcon(item, active) + homeUpdateDot + '</span>' + (item.key === 'messages' && unread ? '<sup>' + (unread > 99 ? '99+' : unread) + '</sup>' : '') + '</button>';
  }).join('');
}
function renderBottomNav() {
  const bottomNav = $('#bottomNav');
  if (!bottomNav) return;
  const classic = state.layoutMode === 'classic';
  const unread = state.notifications.filter((item) => !item.read).length;
  bottomNav.hidden = !classic;
  bottomNav.classList.toggle('auto-hide-enabled', classic);
  bottomNav.classList.toggle('navigation-in-tools', state.navigationLocation === 'tools');
  if (!classic) {
    bottomNav.classList.remove('is-blurred');
    $('main')?.classList.remove('bottom-nav-blurred');
  } else if (appScrollTop() <= 8) {
    bottomNav.classList.remove('is-blurred');
  }
  bottomNav.innerHTML = mainSectionEntries().map((item) => {
    const active = state.section === item.key;
    const homeUpdateDot = item.key === 'home' && state.homeFeed.hasNew ? '<i class="nav-update-dot" aria-label="' + (state.language === 'en' ? 'New updates' : '有新内容') + '"></i>' : '';
    return '<button class="bottom-tab ' + (active ? 'active' : '') + '" data-section="' + item.key + '" aria-current="' + (active ? 'page' : 'false') + '" aria-label="' + t(item.key) + '"><span class="bottom-tab-icon" aria-hidden="true">' + sectionIcon(item, active) + homeUpdateDot + '</span><span>' + t(item.key) + '</span>' + (item.key === 'messages' && unread ? '<sup>' + (unread > 99 ? '99+' : unread) + '</sup>' : '') + '</button>';
  }).join('');
  $('main')?.classList.toggle('bottom-nav-blurred', Boolean(classic && bottomNav.classList.contains('is-blurred')));
  renderTopNav();
}
function selectTool(id) {
  if (id === 'convert') id = 'translate';
  if (!TOOL_DEFS[id]) id = 'calculator';
  awardPetPoints(2, 'tool', 'tool:' + id + ':' + dateKey(new Date()));
  const revealActiveTab = () => requestAnimationFrame(() => { focusActiveToolTab(true); updateToolTabOverflowControls(); });
  if (id === 'navigation') {
    state.section = 'tools';
    state.tool = 'navigation';
    saveActiveToolPreference();
    if (location.hash.slice(1) !== 'navigation') history.replaceState(null, '', '#navigation');
    renderNav(); renderBottomNav(); render();
    revealActiveTab();
    return;
  }
  state.section = 'tools';
  state.tool = id;
  saveActiveToolPreference();
  if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  renderNav(); renderBottomNav(); render();
  revealActiveTab();
}
function selectSection(section) {
  if (!SECTION_DEFS[section]) section = 'tools';
  if (section === 'navigation' && state.navigationLocation === 'tools') return selectTool('navigation');
  if (section !== 'mine') { state.ticketWalletOpen = false; state.ticketWalletEditorOpen = false; state.ticketWalletMemoryDraft = null; }
  const unchanged = state.section === section;
  state.section = section;
  if (section === 'home') state.homeFeed.hasNew = false;
  if (section === 'tools' && !TOOL_DEFS[state.tool]) state.tool = 'calculator';
  const route = section === 'tools' ? state.tool : section;
  if (location.hash.slice(1) !== route) history.replaceState(null, '', '#' + route);
  if (unchanged) { renderBottomNav(); return; }
  renderNav(); renderBottomNav(); render();
}
function saveActiveToolPreference() {
  try { localStorage.setItem(STORAGE.toolActive, state.tool); queuePersistentSnapshot(); } catch { /* private mode can deny storage */ }
}
function saveActiveHomeFeedPreference() {
  try { localStorage.setItem(STORAGE.homeFeedActive, state.homeFeed.active); queuePersistentSnapshot(); } catch { /* private mode can deny storage */ }
}
function saveToolOrder() { saveStored(STORAGE.toolOrder, state.toolOrder); }
function swapToolOrder(from, to) {
  if (from === to || from == null || to == null) return;
  [state.toolOrder[from], state.toolOrder[to]] = [state.toolOrder[to], state.toolOrder[from]];
  saveToolOrder(); renderNav();
  toast(state.language === 'en' ? 'Tool order saved' : '工具顺序已保存');
}
function homeFeedSources() {
  const visible = new Set(state.homeFeed.visible || DEFAULT_HOME_FEED_VISIBLE);
  return state.homeFeed.order.map((id) => RSS_SOURCES.find((source) => source.id === id)).filter((source) => source && visible.has(source.id));
}
function homeFeedNewIds(sourceId = state.homeFeed.active) {
  return new Set(Array.isArray(state.homeFeed.newItems?.[sourceId]) ? state.homeFeed.newItems[sourceId] : []);
}
function homeFeedPendingIds(sourceId = state.homeFeed.active) {
  return new Set(Array.isArray(state.homeFeed.newItemsPending?.[sourceId]) ? state.homeFeed.newItemsPending[sourceId] : []);
}
function homeFeedPendingCount(sourceId = state.homeFeed.active, items = null) {
  const ids = homeFeedPendingIds(sourceId);
  if (!ids.size) return 0;
  if (!Array.isArray(items)) return ids.size;
  return items.reduce((count, item) => count + (ids.has(item.id) ? 1 : 0), 0);
}
function homeFeedNewActionLabel(count) {
  return state.language === 'en' ? 'New ' + count + ' to view' : '新增 ' + count + ' 条查看';
}
function revealHomeFeedNew(sourceId = state.homeFeed.active) {
  const pending = homeFeedPendingIds(sourceId);
  if (!pending.size) return false;
  state.homeFeed.newItemsPending[sourceId] = [];
  saveStored(STORAGE.homeFeeds, { cacheVersion: state.homeFeed.cacheVersion, updatedAt: state.homeFeed.updatedAt, newItems: state.homeFeed.newItems, newItemsPending: state.homeFeed.newItemsPending, sources: state.homeFeed.sources });
  if (state.section !== 'home') return true;
  render();
  requestAnimationFrame(() => scrollAppTo(0, 'smooth'));
  return true;
}
function saveHomeFeedOrder() { saveStored(STORAGE.homeFeedOrder, state.homeFeed.order); }
function saveHomeFeedVisibility() { saveStored(STORAGE.homeFeedVisibility, state.homeFeed.visible); }
function swapHomeFeedSources(from, to) {
  if (from === to || from == null || to == null) return;
  [state.homeFeed.order[from], state.homeFeed.order[to]] = [state.homeFeed.order[to], state.homeFeed.order[from]];
  saveHomeFeedOrder(); render();
  toast(state.language === 'en' ? 'Feed order saved' : '订阅源顺序已保存');
}
function selectHomeFeedSource(sourceId) {
  if (!homeTabIds().includes(sourceId)) return;
  state.homeFeed.active = sourceId;
  saveActiveHomeFeedPreference();
  if (sourceId === 'footprint') {
    syncHomeFeedLoading();
    if (state.section === 'home') {
      render();
      requestAnimationFrame(() => focusActiveHomeFeedTab(true));
    }
    return undefined;
  }
  // A request may already be running from the initial load or background
  // polling. Reuse it, but render immediately so a tap always acknowledges
  // the refresh instead of appearing to do nothing and then updating later.
  if (homeFeedRequests.has(sourceId)) {
    syncHomeFeedLoading();
    if (state.section === 'home') {
      render();
      requestAnimationFrame(() => focusActiveHomeFeedTab(true));
    } else renderBottomNav();
    return undefined;
  }
  loadHomeFeeds(true, sourceId);
  if (state.section === 'home') requestAnimationFrame(() => focusActiveHomeFeedTab(true));
  return undefined;
}

function setHomeTabVisibility(tabId, visible) {
  if (!homeTabEntries().some((entry) => entry.id === tabId)) return;
  if (tabId === 'footprint') {
    state.footprint = visible;
    saveFootprintPreference();
  } else {
    const selected = new Set(state.homeFeed.visible);
    if (visible) selected.add(tabId); else selected.delete(tabId);
    state.homeFeed.visible = DEFAULT_HOME_FEED_ORDER.filter((id) => selected.has(id));
    saveHomeFeedVisibility();
  }
  if (!homeTabIds().includes(state.homeFeed.active)) {
    state.homeFeed.active = homeTabIds()[0] || '';
    saveActiveHomeFeedPreference();
  }
  render();
  renderHomeSourceDialog();
  requestAnimationFrame(() => focusActiveHomeFeedTab(false));
  if (visible && tabId !== 'footprint') loadHomeFeeds(true, tabId);
}

function focusActiveHomeFeedTab(smooth = false) {
  const tabs = homeSourceNav.querySelector('.feed-source-tabs');
  const active = tabs?.querySelector('.feed-source-tab.active');
  if (!tabs || !active || tabs.scrollWidth <= tabs.clientWidth + 1) return;
  const maxScroll = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
  const padding = 8;
  const visibleLeft = tabs.scrollLeft + padding;
  const visibleRight = tabs.scrollLeft + tabs.clientWidth - padding;
  let target = tabs.scrollLeft;
  if (active.offsetLeft < visibleLeft) target = active.offsetLeft - padding;
  else if (active.offsetLeft + active.offsetWidth > visibleRight) target = active.offsetLeft + active.offsetWidth - tabs.clientWidth + padding;
  target = Math.min(maxScroll, Math.max(0, target));
  tabs.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
}
function updateHomeFeedOverflowControls() {
  const panel = homeSourceNav.querySelector('.feed-source-panel');
  const tabs = homeSourceNav.querySelector('.feed-source-tabs');
  const previous = homeSourceNav.querySelector('[data-feed-source-scroll="previous"]');
  const next = homeSourceNav.querySelector('[data-feed-source-scroll="next"]');
  if (!panel || !tabs || !previous || !next) return;
  const maxScroll = Math.max(0, tabs.scrollWidth - tabs.clientWidth);
  const hasOverflow = maxScroll > 1;
  const hasPrevious = tabs.scrollLeft > 1;
  const hasNext = tabs.scrollLeft < maxScroll - 1;
  panel.classList.toggle('has-feed-overflow', hasOverflow);
  panel.classList.toggle('has-feed-overflow-left', hasPrevious);
  panel.classList.toggle('has-feed-overflow-right', hasNext);
  previous.hidden = !hasPrevious;
  next.hidden = !hasNext;
}
function scrollHomeFeedTabs(direction) {
  const tabs = homeSourceNav.querySelector('.feed-source-tabs');
  if (!tabs) return;
  tabs.scrollBy({ left: direction * Math.max(120, Math.round(tabs.clientWidth * .72)), behavior: 'smooth' });
}

function feedText(value = '') { return String(value).replace(/<[^>]*>/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, ' ').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim(); }
function safeExternalUrl(value = '') {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function parseFeedTimestamp(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value || '').trim();
  if (!raw) return NaN;
  const hasExplicitZone = /(?:Z|[+-]\d{2}:?\d{2}|GMT|UTC)$/i.test(raw);
  const plain = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (plain && !hasExplicitZone) {
    // rss2json drops the original GMT suffix from several feeds. Its plain
    // YYYY-MM-DD HH:mm:ss value is therefore UTC, not local device time.
    return Date.UTC(Number(plain[1]), Number(plain[2]) - 1, Number(plain[3]), Number(plain[4]), Number(plain[5]), Number(plain[6] || 0));
  }
  const normalized = raw.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(?::\d{2})?)$/, '$1T$2');
  const parsed = Date.parse(normalized);
  if (Number.isFinite(parsed)) return parsed;
  return NaN;
}
function feedSource(item) { return RSS_SOURCES.find((source) => source.id === item?.source) || RSS_SOURCES[0]; }
function feedItemTimestamp(item) {
  const parsed = parseFeedTimestamp(item?.publishedAt);
  if (Number.isFinite(parsed)) return parsed;
  const value = Number(item?.publishedMs);
  return Number.isFinite(value) && value > 0 ? value : NaN;
}
function feedDate(value, item) {
  const timestamp = typeof value === 'object' ? feedItemTimestamp(value) : parseFeedTimestamp(value);
  if (!Number.isFinite(timestamp)) return '';
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat(state.language === 'en' ? 'en-US' : 'zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Shanghai' }).format(date);
}
function saveHomeFeedRead() { saveStored(STORAGE.homeFeedRead, state.homeFeedRead); }
function markFeedRead(id) {
  if (!id || state.homeFeedRead[id]) return;
  state.homeFeedRead[id] = Date.now();
  saveHomeFeedRead();
  awardPetPoints(3, 'article', 'article:' + id);
}
function feedImageUrl(value) {
  const url = safeExternalUrl(value);
  if (!url) return '';
  if (url.includes('images.weserv.nl/')) return url;
  return 'https://images.weserv.nl/?url=' + encodeURIComponent(url);
}
function feedImageExpired(value) {
  const url = safeExternalUrl(value);
  if (!url) return true;
  try {
    const expires = Number(new URL(url).searchParams.get('x-expires'));
    return Number.isFinite(expires) && expires > 0 && expires * 1000 <= Date.now();
  } catch { return false; }
}
function usableFeedImage(value, source) {
  const url = safeExternalUrl(value);
  if (!url) return '';
  // Douyin hotboard cover URLs are signed CDN URLs. Once expired, keeping them
  // in the cached feed only creates a broken-image box after a refresh.
  return source?.id === 'douyin' && feedImageExpired(url) ? '' : url;
}
function feedImageSource(item = {}) {
  const html = String(item.content || item.description || '');
  const embedded = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || html.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)[^)]*\)/i)?.[1] || '';
  const value = item.thumbnail || item.enclosure?.link || item.enclosure?.url || item.image || embedded;
  return safeExternalUrl(String(value).startsWith('//') ? 'https:' + value : value);
}
function normalizeFeedItem(item, source, overrides = {}) {
  const title = feedText(item.title || item.name); const link = safeExternalUrl(item.link || item.guid);
  if (!title || !link) return null;
  const thumbnail = usableFeedImage(feedImageSource(item), source);
  const publishedAt = item.pubDate || item.published || item.isoDate || item.date || '';
  return { id: source.id + ':' + link, source: source.id, title, link, description: feedText(item.description || item.content || '').slice(0, 180), thumbnail, publishedAt, publishedMs: parseFeedTimestamp(publishedAt), ...overrides };
}
function jinaReaderUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  const separator = value.includes('?') ? '&' : '?';
  const target = value.replace(/^https?:\/\//i, '');
  return 'https://r.jina.ai/http://' + target + separator + '_onebox=' + Date.now();
}
function jinaContent(value) {
  const text = String(value || '').trim();
  const marker = 'Markdown Content:';
  const content = text.includes(marker) ? text.slice(text.indexOf(marker) + marker.length).trim() : text;
  return content.replace(/^```(?:json|javascript|text)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
}
function jinaJson(value) {
  const content = jinaContent(value);
  try { return JSON.parse(content); } catch {
    const start = Math.min(...[content.indexOf('{'), content.indexOf('[')].filter((index) => index >= 0));
    const end = Math.max(content.lastIndexOf('}'), content.lastIndexOf(']'));
    if (Number.isFinite(start) && start >= 0 && end > start) {
      try { return JSON.parse(content.slice(start, end + 1)); } catch { return null; }
    }
    return null;
  }
}
function syntheticFeedTime(index) { return Date.now() - index * 60 * 1000; }
function homeFeedLocalCity() {
  const cards = Array.isArray(state?.weatherCards) ? state.weatherCards : [];
  const place = cards.find((card) => card?.isCurrentLocation && card?.name) || cards.find((card) => card?.name) || cards[0];
  const candidates = [place?.city, place?.admin2, place?.name, place?.admin1].map((value) => feedText(value).trim()).filter(Boolean);
  const cityCandidate = candidates.find((value) => /(市|自治州|地区|盟)$/u.test(value))
    || candidates.find((value) => !/(省|自治区|特别行政区)$/u.test(value))
    || '';
  const value = cityCandidate.replace(/(市|自治州|地区|盟)$/u, '');
  return /^(当前位置|当前地点|Current location|Weather)$/i.test(value) ? '' : value;
}
function isStaleGeneratedLocalFeedItem(item) {
  if (!item || !['xiaohongshu', 'douyin'].includes(item.source) || !/本地热门$/u.test(item.title || '')) return false;
  const city = homeFeedLocalCity();
  return !city || item.title !== city + '本地热门';
}
function xiaohongshuLocalSearchUrl(city) {
  const keyword = String(city || '').trim();
  return keyword ? 'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent(keyword) + '&type=51' : 'https://www.xiaohongshu.com/explore';
}
function douyinLocalSearchUrl(city) {
  const keyword = String(city || '').trim();
  return keyword ? 'https://www.douyin.com/search/' + encodeURIComponent(keyword) + '?type=general' : 'https://www.douyin.com/jingxuan';
}
function interleaveFeedItems(items, supplemental, gap = 6) {
  if (!supplemental.length) return items;
  return items.reduce((result, item, index) => {
    result.push(item);
    const supplementalIndex = Math.floor((index + 1) / gap) - 1;
    if (supplemental[supplementalIndex]) result.push(supplemental[supplementalIndex]);
    return result;
  }, []).concat(supplemental.slice(Math.floor(items.length / gap)));
}
function xiaohongshuLocalItems(source) {
  const city = homeFeedLocalCity();
  return city ? [normalizeFeedItem({
    title: city + (state.language === 'en' ? ' local picks' : '本地热门'),
    link: xiaohongshuLocalSearchUrl(city),
    description: state.language === 'en' ? 'Open Xiaohongshu to browse local recommendations.' : '进入小红书查看本地热门推荐。',
  }, source, { approximate: true, publishedMs: Date.now() + 1000 })].filter(Boolean) : [];
}
function xiaohongshuExploreItems(value, source) {
  const content = jinaContent(value);
  const localItems = xiaohongshuLocalItems(source);
  const matches = [...content.matchAll(/(?:^|\n)\[([^\]\n]{2,160})\]\((https?:\/\/www\.xiaohongshu\.com\/explore\/[^)\s]+)\)/gm)];
  const items = matches.map((match, index) => {
    const start = match.index || 0;
    const nearby = content.slice(Math.max(0, start - 520), start);
    const imageMatches = [...nearby.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)/g)];
    const image = imageMatches.length ? imageMatches[imageMatches.length - 1][1] : '';
    const nextStart = matches[index + 1]?.index ?? content.length;
    const description = feedText(content.slice(start + match[0].length, nextStart)).replace(/\s+/g, ' ').slice(0, 180);
    return normalizeFeedItem({ title: match[1], link: match[2], description, image }, source, { approximate: true, publishedMs: syntheticFeedTime(index) });
  }).filter(Boolean);
  // Keep the city-level local entry visible at the top. The timestamp is also
  // intentionally newer than network items because the feed renderer sorts by
  // recency after merging cached and fresh results.
  return [...localItems, ...items];
}
function douyinSupplementalItems(source) {
  const city = homeFeedLocalCity();
  const entries = [
    { title: '抖音精选', link: 'https://www.douyin.com/jingxuan', description: '进入抖音官方精选页。' },
    { title: '抖音热门', link: 'https://www.douyin.com/hot', description: '进入抖音官方热门页。' },
    ...(city ? [{ title: city + '本地热门', link: douyinLocalSearchUrl(city), description: '进入抖音查看当前位置的本地热门。' }] : []),
  ];
  return entries.map((entry, index) => normalizeFeedItem(entry, source, { approximate: true, publishedMs: Date.now() - (6 + index * 7) * 60 * 1000 })).filter(Boolean);
}
function douyinJingxuanItems(source) { return douyinSupplementalItems(source); }
function hupuTimestamp(value, index) {
  const match = String(value || '').match(/(?:^|\s)(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})(?:\s|$)/);
  if (!match) return syntheticFeedTime(index);
  const now = new Date();
  const timestamp = new Date(now.getFullYear(), Number(match[1]) - 1, Number(match[2]), Number(match[3]), Number(match[4])).getTime();
  return timestamp > Date.now() + 7 * 24 * 60 * 60 * 1000 ? new Date(now.getFullYear() - 1, Number(match[1]) - 1, Number(match[2]), Number(match[3]), Number(match[4])).getTime() : timestamp;
}
function rssMarkdownItems(value, source) {
  const content = jinaContent(value);
  const headings = [...content.matchAll(/^#{2,6}\s+\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gm)];
  if (headings.length) return headings.map((match, index) => {
    const blockStart = (match.index || 0) + match[0].length;
    const nextStart = headings[index + 1]?.index ?? content.length;
    return normalizeFeedItem({ title: match[1], link: match[2], description: content.slice(blockStart, nextStart) }, source, { approximate: true, publishedMs: syntheticFeedTime(index) });
  }).filter(Boolean);
  if (typeof DOMParser === 'undefined' || !/<(?:item|entry)\b/i.test(content)) return [];
  const documentFragment = new DOMParser().parseFromString(content, 'text/xml');
  const nodes = [...documentFragment.querySelectorAll('item, entry')];
  return nodes.map((node, index) => {
    const linkNode = node.querySelector('link');
    const link = linkNode?.getAttribute('href') || linkNode?.textContent || node.querySelector('guid')?.textContent || '';
    const enclosure = node.querySelector('enclosure');
    const mediaContent = node.getElementsByTagName('media:content')[0] || node.getElementsByTagName('media:thumbnail')[0];
    const itunesImage = node.getElementsByTagName('itunes:image')[0];
    const publishedNode = node.querySelector('pubDate, published, updated') || node.getElementsByTagName('dc:date')[0];
    const descriptionNode = node.querySelector('description, summary, content') || node.getElementsByTagName('content:encoded')[0];
    return normalizeFeedItem({
      title: node.querySelector('title')?.textContent,
      link,
      description: descriptionNode?.textContent,
      pubDate: publishedNode?.textContent,
      enclosure: { url: enclosure?.getAttribute('url') || mediaContent?.getAttribute('url') || itunesImage?.getAttribute('href') || '' },
    }, source, { approximate: false, publishedMs: parseFeedTimestamp(publishedNode?.textContent) || syntheticFeedTime(index) });
  }).filter(Boolean);
}
function jiemianClockTimestamp(hour, minute, index) {
  if (!/^\d{1,2}$/.test(String(hour)) || !/^\d{2}$/.test(String(minute))) return syntheticFeedTime(index);
  const now = new Date();
  let timestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hour), Number(minute)).getTime();
  if (timestamp > Date.now() + 5 * 60 * 1000) timestamp -= 24 * 60 * 60 * 1000;
  return timestamp;
}
function jiemianNewsflashItems(value, source) {
  const content = jinaContent(value);
  const headings = [...content.matchAll(/^#{2,6}\s+\[([^\]]+)\]\((https?:\/\/www\.jiemian\.com\/article\/[^)\s]+)\)/gm)];
  if (!headings.length) return rssMarkdownItems(value, source);
  return headings.map((match, index) => {
    const previousStart = headings[index - 1] ? (headings[index - 1].index || 0) + headings[index - 1][0].length : 0;
    const prefix = content.slice(previousStart, match.index || 0);
    const timeMatches = [...prefix.matchAll(/(?:^|\n)\s*\*\s+(\d{1,2}):(\d{2})\s*(?=\n|$)/g)];
    const clock = timeMatches.at(-1);
    const blockStart = (match.index || 0) + match[0].length;
    const nextStart = headings[index + 1]?.index ?? content.length;
    const description = feedText(content.slice(blockStart, nextStart))
      .replace(/\s+\*\s+\d{1,2}:\d{2}\s*$/u, '')
      .replace(/\s+声音提醒\s*$/u, '')
      .trim()
      .slice(0, 180);
    return normalizeFeedItem({ title: match[1], link: match[2], description }, source, {
      approximate: false,
      publishedMs: clock ? jiemianClockTimestamp(clock[1], clock[2], index) : syntheticFeedTime(index),
    });
  }).filter(Boolean);
}
function thepaperRelativeTimestamp(value, index) {
  const text = String(value || '');
  const match = text.match(/(\d+)\s*(分钟|小时|天)前/);
  if (match) {
    const unit = match[2] === '分钟' ? 60 * 1000 : match[2] === '小时' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    return Date.now() - Number(match[1]) * unit;
  }
  if (/刚刚|刚才/.test(text)) return Date.now();
  if (/昨天/.test(text)) return Date.now() - 24 * 60 * 60 * 1000;
  return syntheticFeedTime(index);
}
function thepaperChannelItems(value, source) {
  const content = jinaContent(value);
  const matches = [...content.matchAll(/\[([^\]\n]{2,240})\]\((https?:\/\/(?:www|m)\.thepaper\.cn\/(?:newsDetail_forward_|detail\/|papernews\/)[^)\s]+)\)/g)];
  const seen = new Set();
  return matches.map((match, index) => {
    const rawTitle = feedText(match[1])
      .replace(/^推荐\s+/u, '')
      .replace(/^#+\s*/u, '')
      .replace(/\s+#+\s*$/u, '')
      .replace(/_+\s*$/u, '')
      .trim();
    const link = match[2].replace(/^http:/i, 'https:');
    if (!rawTitle || seen.has(link)) return null;
    seen.add(link);
    const start = (match.index || 0) + match[0].length;
    const nextMatch = matches[index + 1];
    const block = content.slice(start, nextMatch?.index ?? content.length);
    const nearby = content.slice(Math.max(0, (match.index || 0) - 720), match.index || 0);
    const imageMatches = [...nearby.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)/g)];
    const description = feedText(block).replace(/^(?:推荐\s*)?(?:[^\d\n]{1,24})?(?:\d+\s*(?:分钟前|小时前|天前)|刚刚|刚才|昨天)\s*/u, '').slice(0, 180);
    return normalizeFeedItem({ title: rawTitle, link, description, image: imageMatches.at(-1)?.[1] || '' }, source, {
      approximate: false,
      publishedMs: thepaperRelativeTimestamp(block, index),
    });
  }).filter(Boolean);
}
function hupuBbsItems(value, source) {
  const content = jinaContent(value);
  const matches = [...content.matchAll(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?bbs\.hupu\.com\/\d+(?:-\d+)?\.html)\)([^\n]*)/g)];
  return matches.map((match, index) => normalizeFeedItem({
    title: match[1],
    link: match[2].replace(/^http:/i, 'https:'),
    description: feedText(match[3]).slice(0, 180),
  }, source, { approximate: false, publishedMs: hupuTimestamp(match[3], index) })).filter(Boolean);
}
function structuredHotItems(payload, source, kind) {
  if (!payload) return [];
  if (kind === 'zhihu-hot') {
    const values = Array.isArray(payload.hot_search_queries) ? payload.hot_search_queries : [];
    return values.map((item, index) => {
      const title = feedText(item.query || item.real_query || item.title);
      if (!title) return null;
      const link = 'https://www.zhihu.com/search?type=content&q=' + encodeURIComponent(title);
      return normalizeFeedItem({ title, link, description: item.hot_value ? '热度 ' + item.hot_value : '' }, source, { approximate: true, publishedMs: syntheticFeedTime(index) });
    }).filter(Boolean);
  }
  if (kind === 'bilibili-hot') {
    const values = Array.isArray(payload.data?.trending?.list) ? payload.data.trending.list : Array.isArray(payload.data?.list) ? payload.data.list : [];
    return values.map((item, index) => {
      const title = feedText(item.show_name || item.keyword || item.name);
      if (!title) return null;
      const link = 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(title);
      const score = item.hot_value || item.score || item.heat;
      return normalizeFeedItem({ title, link, description: score ? '热度 ' + score : '' }, source, { approximate: true, publishedMs: syntheticFeedTime(index) });
    }).filter(Boolean);
  }
  if (kind === 'bilibili-hotword') {
    const values = Array.isArray(payload.list) ? payload.list : Array.isArray(payload.data?.list) ? payload.data.list : [];
    return values.map((item, index) => {
      const title = feedText(item.show_name || item.keyword);
      if (!title) return null;
      return normalizeFeedItem({ title, link: 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(title), description: item.pos ? '热搜第 ' + item.pos + ' 名' : '' }, source, { approximate: true, publishedMs: syntheticFeedTime(index) });
    }).filter(Boolean);
  }
  if (kind === 'weibo-hot') {
    const values = Array.isArray(payload.data) ? payload.data : Array.isArray(payload.data?.list) ? payload.data.list : Array.isArray(payload.list) ? payload.list : [];
    const updateTime = payload.update_time || payload.data?.update_time || '';
    return values.map((item, index) => {
      const title = feedText(item.title || item.word || item.name);
      if (!title) return null;
      const link = 'https://s.weibo.com/weibo?q=' + encodeURIComponent(title) + '&xsort=hot&Refer=hotmore';
      return normalizeFeedItem({ title, link, description: item.hot ? '热度 ' + item.hot : '' }, source, { publishedAt: updateTime, publishedMs: parseFeedTimestamp(updateTime) || syntheticFeedTime(index) });
    }).filter(Boolean);
  }
  if (kind === 'weibo-hot-v2') {
    const values = Array.isArray(payload.data?.realtime) ? payload.data.realtime : Array.isArray(payload.data?.list) ? payload.data.list : Array.isArray(payload.data) ? payload.data : Array.isArray(payload.list) ? payload.list : [];
    return values.map((item, index) => {
      const title = feedText(item.word || item.note || item.title);
      if (!title) return null;
      const link = 'https://s.weibo.com/weibo?q=' + encodeURIComponent(title) + '&xsort=hot&Refer=hotmore';
      return normalizeFeedItem({ title, link, description: item.num ? '热度 ' + item.num : '' }, source, { approximate: true, publishedMs: syntheticFeedTime(index) });
    }).filter(Boolean);
  }
  if (kind === 'v2ex-latest') {
    const values = Array.isArray(payload) ? payload : [];
    return values.map((item, index) => normalizeFeedItem({
      title: item.title,
      link: item.url || (item.id ? 'https://www.v2ex.com/t/' + item.id : ''),
      description: item.content,
      image: item.member?.avatar_normal,
      publishedAt: item.last_modified || item.created ? new Date(Number(item.last_modified || item.created) * 1000).toISOString() : '',
    }, source, { publishedMs: parseFeedTimestamp(item.last_modified || item.created ? new Date(Number(item.last_modified || item.created) * 1000).toISOString() : '') || syntheticFeedTime(index) })).filter(Boolean);
  }
  if (kind === 'xiaohongshu-hotboard') {
    const values = Array.isArray(payload.list) ? payload.list : Array.isArray(payload.items) ? payload.items : [];
    const items = values.map((item, index) => {
      const title = feedText(item.title || item.name);
      if (!title) return null;
      const link = safeExternalUrl(item.url) || xiaohongshuLocalSearchUrl(title);
      return normalizeFeedItem({ title, link, description: item.hot_value ? '热度 ' + item.hot_value : '', image: item.cover || item.extra?.cover }, source, { approximate: true, publishedMs: syntheticFeedTime(index) });
    }).filter(Boolean);
    return [...xiaohongshuLocalItems(source), ...items];
  }
  if (kind === 'douyin-hotboard') {
    const values = Array.isArray(payload.list) ? payload.list : Array.isArray(payload.items) ? payload.items : [];
    const items = values.map((item, index) => {
      const title = feedText(item.title || item.name);
      if (!title) return null;
      const link = safeExternalUrl(item.url) || 'https://www.douyin.com/search/' + encodeURIComponent(title) + '?type=general';
      return normalizeFeedItem({ title, link, description: item.hot_value ? '热度 ' + item.hot_value : '', image: item.cover || item.extra?.cover }, source, { approximate: true, publishedMs: syntheticFeedTime(index) });
    }).filter(Boolean);
    return interleaveFeedItems(items, douyinSupplementalItems(source));
  }
  return [];
}
function guanchaRelativeTimestamp(value, index) {
  const text = String(value || '');
  const match = text.match(/(\d+)\s*(分钟|小时|天)前/);
  if (match) {
    const unit = match[2] === '分钟' ? 60 * 1000 : match[2] === '小时' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    return Date.now() - Number(match[1]) * unit;
  }
  if (/刚刚|刚才/.test(text)) return Date.now();
  if (/昨天/.test(text)) return Date.now() - 24 * 60 * 60 * 1000;
  return syntheticFeedTime(index);
}
function guanchaFengwenItems(value, source) {
  const content = jinaContent(value);
  const headings = [...content.matchAll(/#{2,6}\s+\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g)]
    .filter((match) => /\/main\/content(?:\?|$)/i.test(match[2]));
  if (!headings.length) return [];
  return headings.map((match, index) => {
    const blockStart = (match.index || 0) + match[0].length;
    const nextStart = headings[index + 1]?.index ?? content.length;
    const block = content.slice(blockStart, nextStart);
    const description = feedText(block)
      .replace(/^(?:置顶\s*)?(?:\d+\s*(?:分钟前|小时前|天前)|刚刚|刚才|昨天)\s*/i, '')
      .split(/\s+(?:分享|收藏|评论|赞)/)[0]
      .slice(0, 180);
    const link = match[2].replace(/^http:/i, 'https:');
    return normalizeFeedItem({ title: match[1], link, description, content: block }, source, {
      approximate: false,
      publishedMs: guanchaRelativeTimestamp(block, index),
    });
  }).filter(Boolean);
}
function mergeFeedItems(source, incoming) {
  const existing = (state.homeFeed.sources[source.id]?.items || []).map((item) => ({
    ...item,
    description: feedText(item.description || ''),
    thumbnail: item.thumbnail || feedImageSource(item),
  })).filter((item) => {
    // Local recommendations are generated from the current weather location.
    // Drop an older generated city entry when a fresh result arrives so a
    // street-level value cannot survive after the city resolver is corrected.
    return !isStaleGeneratedLocalFeedItem(item);
  });
  const merged = new Map(existing.map((item) => [item.id, item]));
  incoming.forEach((item) => merged.set(item.id, { ...merged.get(item.id), ...item }));
  const cutoff = Date.now() - RSS_RETENTION_MS;
  return [...merged.values()]
    .filter((item) => { const timestamp = feedItemTimestamp(item); return !Number.isFinite(timestamp) || timestamp >= cutoff; })
    .sort((a, b) => (feedItemTimestamp(b) || 0) - (feedItemTimestamp(a) || 0))
    .slice(0, RSS_MAX_ITEMS_PER_SOURCE);
}
async function fetchFeedSource(source) {
  const fetchers = Array.isArray(source.fetchers) ? source.fetchers : (source.urls || []).map((url) => ({ kind: 'rss', url }));
  const sourceController = new AbortController();
  const fetchOne = async (fetcher) => {
    const targetUrl = fetcher.direct ? fetcher.url : jinaReaderUrl(fetcher.url);
    const { response, text } = await fetchTextWithTimeout(targetUrl, { cache: 'no-store', headers: { Accept: 'text/plain, application/json, application/xml' } }, fetcher.timeoutMs || HOME_FEED_REQUEST_TIMEOUT_MS, sourceController.signal);
    if (!response.ok) throw Error('HTTP ' + response.status);
    const payload = fetcher.kind === 'rss' || fetcher.kind === 'guancha-fengwen' ? null : jinaJson(text);
    const items = fetcher.kind === 'rss' ? rssMarkdownItems(text, source) : fetcher.kind === 'jiemian-newsflash' ? jiemianNewsflashItems(text, source) : fetcher.kind === 'thepaper-channel' ? thepaperChannelItems(text, source) : fetcher.kind === 'hupu-bbs' ? hupuBbsItems(text, source) : fetcher.kind === 'guancha-fengwen' ? guanchaFengwenItems(text, source) : fetcher.kind === 'xiaohongshu-explore' ? xiaohongshuExploreItems(text, source) : fetcher.kind === 'douyin-jingxuan' ? douyinJingxuanItems(source) : structuredHotItems(payload, source, fetcher.kind);
    if (!items.length) throw Error('Feed empty');
    return { items, feedUrl: fetcher.url };
  };
  let successful;
  let deadlineTimer;
  try {
    // Source fallbacks race each other. A slow or unavailable primary endpoint
    // must not make the whole refresh wait before its fallback can respond.
    const fallbackRequest = Promise.any(fetchers.map(fetchOne));
    const sourceDeadlineMs = Math.max(HOME_FEED_SOURCE_DEADLINE_MS, ...fetchers.map((fetcher) => Number(fetcher.deadlineMs) || 0));
    const sourceDeadline = new Promise((_, reject) => {
      deadlineTimer = setTimeout(() => reject(Error('Feed timeout')), sourceDeadlineMs);
    });
    successful = await Promise.race([fallbackRequest, sourceDeadline]);
  } catch {
    throw Error('Feed unavailable');
  } finally {
    clearTimeout(deadlineTimer);
    sourceController.abort();
  }
  const items = [...new Map(successful.items.map((item) => [item.id, item])).values()]
    .sort((a, b) => (feedItemTimestamp(b) || 0) - (feedItemTimestamp(a) || 0))
    .slice(0, RSS_MAX_ITEMS_PER_SOURCE);
  return { items, updatedAt: Date.now(), feedUrl: successful.feedUrl };
}
async function refreshHomeFeedSource(source, requestToken) {
  let result = null;
  let error = '';
  try { result = await fetchFeedSource(source); }
  catch (reason) { error = reason?.message || 'RSS unavailable'; }
  if (homeFeedRequests.get(source.id) !== requestToken) return;
  const isActive = state.section === 'home' && state.homeFeed.active === source.id;
  const preservedPosition = isActive ? captureHomeFeedPosition() : null;
  let discoveredNewItems = false;
  if (result) {
    const existingItems = state.homeFeed.sources[source.id]?.items || [];
    const previousIds = new Set(existingItems.map((item) => item.id));
    const discoveredIds = previousIds.size ? result.items.filter((item) => !previousIds.has(item.id)).map((item) => item.id) : [];
    const pendingBefore = homeFeedPendingIds(source.id);
    const mergedItems = mergeFeedItems(source, result.items);
    const availableIds = new Set(mergedItems.map((item) => item.id));
    const pendingIds = [...new Set([...pendingBefore, ...discoveredIds])]
      .filter((id) => availableIds.has(id))
      .slice(-HOME_FEED_PENDING_LIMIT);
    // Keep one authoritative batch for both the count and the divider. This
    // includes items discovered by an earlier refresh that the user has not
    // opened yet, so the label cannot say 5 while only 2 are highlighted.
    const currentNewIds = [...new Set([...pendingBefore, ...discoveredIds])]
      .filter((id) => availableIds.has(id));
    state.homeFeed.newItems[source.id] = currentNewIds;
    state.homeFeed.newItemsPending[source.id] = pendingIds;
    state.homeFeed.sources[source.id] = { ...result, items: mergedItems };
    state.homeFeed.updatedAt = Date.now();
    state.homeFeed.cacheVersion = APP_VERSION;
    discoveredNewItems = discoveredIds.length > 0;
    delete state.homeFeed.errors[source.id];
    delete state.homeFeed.stale[source.id];
  } else if (state.homeFeed.sources[source.id]?.items?.length) {
    state.homeFeed.stale[source.id] = true;
  } else {
    state.homeFeed.errors[source.id] = error;
  }
  homeFeedRequests.delete(source.id);
  state.homeFeed.hasNew = state.section === 'home' ? false : state.homeFeed.hasNew || discoveredNewItems;
  saveStored(STORAGE.homeFeeds, { cacheVersion: state.homeFeed.cacheVersion, updatedAt: state.homeFeed.updatedAt, newItems: state.homeFeed.newItems, newItemsPending: state.homeFeed.newItemsPending, sources: state.homeFeed.sources });
  syncHomeFeedLoading();
  if (isActive) {
    render();
    restoreHomeFeedPosition(preservedPosition);
    requestAnimationFrame(() => focusActiveHomeFeedTab(false));
  } else if (state.section !== 'home') renderBottomNav();
}
function loadHomeFeeds(force = false, sourceId = '') {
  const visibleSources = homeFeedSources();
  // Refresh every visible source on the initial load and polling pass. Keep
  // the active Tab first, then use a small worker pool so one slow source
  // cannot block the rest or create an unbounded mobile request burst.
  const candidates = sourceId && sourceId !== 'footprint'
    ? visibleSources.filter((source) => source.id === sourceId)
    : [...visibleSources].sort((left, right) => Number(right.id === state.homeFeed.active) - Number(left.id === state.homeFeed.active));
  const now = Date.now();
  const sourcesToLoad = candidates.filter((source) => {
    if (homeFeedRequests.has(source.id)) return false;
    // A render after a failed request must not immediately start the same
    // request again. Explicit Tab taps and pull-to-refresh pass force=true
    // and are the intentional retry boundary.
    if (!force && (state.homeFeed.errors[source.id] || state.homeFeed.stale[source.id])) return false;
    if (force) return true;
    const cached = state.homeFeed.sources[source.id];
    return !cached?.items?.length || state.homeFeed.cacheVersion !== APP_VERSION || now - Number(cached.updatedAt || 0) >= RSS_REFRESH_INTERVAL;
  });
  if (!sourcesToLoad.length) { syncHomeFeedLoading(); return; }
  const preservedPosition = captureHomeFeedPosition();
  sourcesToLoad.forEach((source) => {
    const requestToken = Symbol(source.id);
    homeFeedRequests.set(source.id, requestToken);
    delete state.homeFeed.errors[source.id];
    delete state.homeFeed.stale[source.id];
  });
  syncHomeFeedLoading();
  if (state.section === 'home') { render(); restoreHomeFeedPosition(preservedPosition); }
  else renderBottomNav();
  let nextSource = 0;
  const refreshWorker = async () => {
    while (nextSource < sourcesToLoad.length) {
      const source = sourcesToLoad[nextSource++];
      await refreshHomeFeedSource(source, homeFeedRequests.get(source.id));
    }
  };
  const workers = Math.min(HOME_FEED_CONCURRENCY, sourcesToLoad.length);
  Array.from({ length: workers }, () => refreshWorker()).forEach((worker) => worker.catch(() => {}));
}
function renderFeedItem(item) {
  const source = feedSource(item);
  const rawThumbnail = usableFeedImage(item.thumbnail, source);
  const thumbnail = feedImageUrl(rawThumbnail) || rawThumbnail;
  const image = rawThumbnail ? '<span class="feed-item-media"><img class="feed-item-image" src="' + escapeHtml(thumbnail) + '" data-fallback="' + escapeHtml(rawThumbnail) + '" alt="" loading="lazy" onerror="if(this.dataset.fallback&&this.getAttribute(\'src\')!==this.dataset.fallback){this.src=this.dataset.fallback;return;}var media=this.closest(\'.feed-item-media\');if(media)media.remove();var side=this.closest(\'.feed-item-side\');if(side&&!side.children.length)side.remove();"></span>' : '';
  const meta = '<div class="feed-item-meta"><span class="feed-source-tag ' + source.className + '"><b><img src="' + escapeHtml(source.icon) + '" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.style.display=\'inline\'"><span class="feed-source-fallback">' + escapeHtml(source.badge) + '</span></b>' + escapeHtml(source.name) + '</span><time datetime="' + escapeHtml(new Date(feedItemTimestamp(item) || Date.now()).toISOString()) + '">' + escapeHtml(feedDate(item)) + '</time></div>';
  const read = Boolean(state.homeFeedRead[item.id]);
  return '<article class="feed-item ' + (thumbnail ? 'has-media ' : '') + (read ? 'is-read' : '') + '" data-feed-id="' + escapeHtml(item.id) + '" data-feed-link="' + escapeHtml(item.link) + '" tabindex="0" role="link"><div class="feed-item-body"><h2>' + escapeHtml(item.title) + '</h2>' + (item.description ? '<p>' + escapeHtml(item.description) + '</p>' : '') + meta + '</div>' + (image ? '<div class="feed-item-side">' + image + '</div>' : '') + '</article>';
}
function renderJiemianFlash(item) {
  if (!item) return '';
  const description = item.description ? '<p>' + escapeHtml(item.description) + '</p>' : '';
  return '<article class="jiemian-flash-card" data-feed-id="' + escapeHtml(item.id) + '" data-feed-link="' + escapeHtml(item.link) + '" data-feed-open-new-tab="true" tabindex="0" role="link"><div class="jiemian-flash-head"><span class="jiemian-flash-label"><span class="jiemian-flash-dot" aria-hidden="true"></span>界面快讯</span><time datetime="' + escapeHtml(new Date(feedItemTimestamp(item) || Date.now()).toISOString()) + '">' + escapeHtml(feedDate(item)) + '</time></div><h2>' + escapeHtml(item.title) + '</h2>' + description + '<span class="jiemian-flash-action">新页签查看快讯 <span aria-hidden="true">→</span></span></article>';
}
function isMobileSurface() {
  return Boolean(navigator.standalone || window.matchMedia?.('(display-mode: standalone)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.matchMedia?.('(max-width: 760px)').matches);
}
function mobileFeedLink(item) {
  const link = safeExternalUrl(item?.link);
  if (!link || !isMobileSurface()) return link;
  const source = feedSource(item);
  if (source.id === 'ithome') {
    try {
      const url = new URL(link);
      const match = url.pathname.match(/^\/(\d)\/(\d{3})\/(\d{3})\.htm$/i);
      if (match) return 'https://m.ithome.com/html/' + match[1] + match[2] + match[3] + '.htm';
      url.hostname = 'm.ithome.com';
      return url.href;
    } catch { return link; }
  }
  if (source.id === 'weibo') {
    try {
      const url = new URL(link);
      const query = url.searchParams.get('q') || url.searchParams.get('query') || url.pathname.split('/').filter(Boolean).pop() || '';
      return 'https://m.weibo.cn/search?containerid=100103type=61&q=' + encodeURIComponent(query);
    } catch { return link; }
  }
  if (source.id === 'bilibili') return link.replace('https://search.bilibili.com/all', 'https://m.bilibili.com/search');
  if (source.id === 'hupu') {
    try {
      const url = new URL(link);
      const match = url.pathname.match(/^\/(\d+)(-\d+)?\.html$/i);
      if (match) return 'https://m.hupu.com/bbs/' + match[1] + (match[2] || '') + '.html';
      url.hostname = 'm.hupu.com';
      return url.href;
    } catch { return link; }
  }
  if (!source.mobileHost) return link;
  try {
    const url = new URL(link);
    url.hostname = source.mobileHost;
    if ((source.id === 'zhihu' || source.id === 'huxiu') && document.documentElement.dataset.theme === 'dark') url.searchParams.set('theme', 'dark');
    return url.href;
  } catch { return link; }
}
function feedItemByLink(link) {
  return RSS_SOURCES.flatMap((source) => state.homeFeed.sources[source.id]?.items || []).find((item) => item.link === link) || recentFeedItems().find((item) => item.link === link) || { link };
}
function appScrollElement() {
  return (isIosSafariBrowser() || isStandalonePwa()) ? (document.scrollingElement || document.documentElement) : $('main');
}
function appScrollTop() {
  const scrollElement = appScrollElement();
  if (!scrollElement) return 0;
  return scrollElement === document.documentElement ? (window.scrollY || document.documentElement.scrollTop || 0) : scrollElement.scrollTop;
}
function scrollAppTo(top, behavior = 'auto') {
  const scrollElement = appScrollElement();
  if (!scrollElement) return;
  const targetTop = Math.max(0, Number(top) || 0);
  if (behavior === 'instant') {
    const previousBehavior = scrollElement.style.scrollBehavior;
    scrollElement.style.scrollBehavior = 'auto';
    scrollElement.scrollTop = targetTop;
    scrollElement.style.scrollBehavior = previousBehavior;
    return;
  }
  scrollElement.scrollTo({ top: targetTop, behavior });
}
function scrollAppToTopDamped() {
  const scrollElement = appScrollElement();
  const startTop = Math.max(0, appScrollTop());
  if (!scrollElement || startTop <= 1) return Promise.resolve(true);
  const duration = Math.min(1450, Math.max(520, startTop * .45));
  const previousScrollBehavior = scrollElement.style.scrollBehavior;
  scrollElement.style.scrollBehavior = 'auto';

  return new Promise((resolve) => {
    let animationFrame = 0;
    let startedAt = 0;
    let finished = false;
    const cleanup = () => {
      window.removeEventListener('wheel', interrupt, true);
      window.removeEventListener('touchstart', interrupt, true);
      window.removeEventListener('pointerdown', interrupt, true);
      window.removeEventListener('keydown', interrupt, true);
      scrollElement.style.scrollBehavior = previousScrollBehavior;
    };
    const finish = (reachedTop) => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(animationFrame);
      if (reachedTop) scrollElement.scrollTop = 0;
      cleanup();
      resolve(reachedTop);
    };
    const interrupt = (event) => {
      if (event.type === 'keydown') {
        if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
        if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      }
      finish(false);
    };
    const tick = (now) => {
      if (!startedAt) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 4);
      scrollElement.scrollTop = startTop * (1 - eased);
      if (progress >= 1) finish(true);
      else animationFrame = requestAnimationFrame(tick);
    };

    window.addEventListener('wheel', interrupt, { capture: true, passive: true });
    window.addEventListener('touchstart', interrupt, { capture: true, passive: true });
    window.addEventListener('pointerdown', interrupt, true);
    window.addEventListener('keydown', interrupt, true);
    animationFrame = requestAnimationFrame(tick);
  });
}
function captureHomeFeedPosition() {
  if (state.section !== 'home') return null;
  return { top: appScrollTop(), sourceLeft: homeSourceNav.querySelector('.feed-source-tabs')?.scrollLeft || 0 };
}
function restoreHomeFeedPosition(position) {
  if (!position || state.section !== 'home') return;
  const restore = () => {
    const scrollElement = appScrollElement();
    if (scrollElement) {
      const maxTop = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight);
      scrollAppTo(Math.min(Math.max(0, Number(position.top) || 0), maxTop), 'instant');
    }
    const tabs = homeSourceNav.querySelector('.feed-source-tabs');
    if (tabs) tabs.scrollLeft = Math.max(0, Number(position.sourceLeft) || 0);
  };
  requestAnimationFrame(restore);
  window.setTimeout(restore, 120);
  window.setTimeout(restore, 420);
}

// Page mascot ---------------------------------------------------------------
// page-mascot uses two aligned 3×3 sheets: one for the direction the
// character looks and one for the short reaction after a click. Keep that
// rendering model, but mount it as a dependency-free OneBox surface so it
// survives route renders and works in the static PWA.
const MASCOT_ASSETS = {
  directions: 'https://cdn.jsdelivr.net/gh/nilbuild/page-mascot@main/public/mascots/fox-directions.webp',
  reactions: 'https://cdn.jsdelivr.net/gh/nilbuild/page-mascot@main/public/mascots/fox-reactions.webp',
};
const MASCOT_DIRECTIONS = ['up-left', 'up', 'up-right', 'left', 'center', 'right', 'down-left', 'down', 'down-right'];
const MASCOT_REACTIONS = ['blink', 'heart', 'sparkle', 'surprised', 'wink', 'bashful', 'sleepy', 'dizzy', 'delighted'];
const MASCOT_FULL_BODY_MARKUP = '<img class="onebox-mascot-fullbody" src="icons/mascot-fox-full.png?v=2.18.264" alt="" draggable="false">';
const MASCOT_FULL_BODY_REACTIONS = 'icons/mascot-fox-full-reactions.png?v=2.18.264';
const MASCOT_CLOCKWISE = ['right', 'down-right', 'down', 'down-left', 'left', 'up-left', 'up', 'up-right'];
const MASCOT_SECTOR = (Math.PI * 2) / MASCOT_CLOCKWISE.length;
const MASCOT_HYSTERESIS = 0.12;
const MASCOT_DEAD_ZONE = 46;
const MASCOT_DOCK_DELAY = 3000;
const MASCOT_EDGE_SWIPE_DISTANCE = 34;
const MASCOT_IDLE_MIN = 5200;
const MASCOT_IDLE_MAX = 9800;
const MASCOT_IDLE_MESSAGES = ['今天也要轻轻松松哦', '我在这里陪你', '风吹过来啦', '摸摸我会有好运', '要不要看看今天的天气？'];
const MASCOT_DRAG_MESSAGES = ['抓到我啦', '轻一点，我会晃晕的', '放这里刚刚好', '我也想换个位置'];
const MASCOT_EDGE_MESSAGES = ['我先躲到边边～', '边边的位置刚刚好', '需要我时再叫我哦'];
const mascotRuntime = { root: null, button: null, panel: null, speech: null, directionLayer: null, reactionLayer: null, drag: null, dockTimer: 0, reactionTimer: 0, actionTimer: 0, idleTimer: 0, speechTimer: 0, singleClickTimer: 0, tapAt: 0, boopAt: 0, boops: 0, suppressClickUntil: 0, sector: -1, position: null, lastReaction: '', lastSpeech: '', topActionAnnounced: false, topReturnFlight: false, launchTimer: 0, ballTimer: 0, sceneTimer: 0 };
function mascotCellStyle(index) {
  return { backgroundPosition: (index % 3) * 50 + '% ' + Math.floor(index / 3) * 50 + '%' };
}
function syncMascotDisplayMode(adjustPosition = false) {
  const root = mascotRuntime.root;
  if (!root) return;
  const previousHeight = root.offsetHeight || 0;
  const mode = state.mascotDisplayMode === 'full' ? 'full' : 'half';
  root.dataset.mascotDisplay = mode;
  if (mascotRuntime.reactionLayer) {
    const reactionAsset = mode === 'full' ? MASCOT_FULL_BODY_REACTIONS : MASCOT_ASSETS.reactions;
    mascotRuntime.reactionLayer.style.backgroundImage = 'url("' + reactionAsset + '")';
  }
  const nextHeight = root.offsetHeight || previousHeight;
  if (adjustPosition && mascotRuntime.position && nextHeight !== previousHeight) {
    mascotSetPosition(mascotRuntime.position.left, mascotRuntime.position.top - (nextHeight - previousHeight) / 2);
  }
  mascotSyncPanelSide();
}
function syncMascotOutfit() {
  const root = mascotRuntime.root;
  const outfitNode = root?.querySelector('.onebox-mascot-outfit');
  if (!root || !outfitNode) return;
  const outfit = petOutfitById(state.petProfile?.activeOutfit);
  outfitNode.textContent = outfit.glyph;
  root.dataset.outfit = outfit.id;
  outfitNode.setAttribute('aria-label', outfit.name[state.language] || outfit.name.zh);
}
function mascotWrapAngle(angle) { return Math.atan2(Math.sin(angle), Math.cos(angle)); }
function mascotPositionValue() {
  const value = parseStored(STORAGE.mascotPosition, null);
  if (!value || !Number.isFinite(Number(value.left)) || !Number.isFinite(Number(value.top))) return null;
  return { left: Number(value.left), top: Number(value.top) };
}
function mascotClampPosition(left, top) {
  const root = mascotRuntime.root;
  const width = root?.offsetWidth || 82;
  const height = root?.offsetHeight || 82;
  return {
    left: Math.max(8, Math.min(Math.max(8, window.innerWidth - width - 8), Number(left) || 0)),
    top: Math.max(8, Math.min(Math.max(8, window.innerHeight - height - 8), Number(top) || 0)),
  };
}
function mascotSetPosition(left, top, persist = true) {
  const root = mascotRuntime.root;
  if (!root) return;
  const position = mascotClampPosition(left, top);
  mascotRuntime.position = position;
  root.style.left = position.left + 'px';
  root.style.top = position.top + 'px';
  root.style.right = 'auto';
  root.dataset.edge = position.left + (root.offsetWidth || 82) / 2 < window.innerWidth / 2 ? 'left' : 'right';
  if (persist) saveStored(STORAGE.mascotPosition, position);
}
function mascotSyncPanelSide() {
  const root = mascotRuntime.root;
  if (!root) return;
  const rect = root.getBoundingClientRect();
  root.dataset.panelSide = rect.left + rect.width / 2 < window.innerWidth / 2 ? 'left' : 'right';
}
function mascotTopSafeInset(root = mascotRuntime.root) {
  const safeArea = Number.parseFloat(getComputedStyle(root || document.documentElement).getPropertyValue('--mascot-safe-top')) || 0;
  return Math.max(12, window.visualViewport?.offsetTop || 0, safeArea) + 8;
}
function mascotUpdateOverlayLayout() {
  const root = mascotRuntime.root;
  const indicator = root?.querySelector('[data-mascot-sync-progress]');
  if (!root || !indicator) return;
  const anchors = [mascotRuntime.panel, mascotRuntime.speech]
    .filter((node) => node && !node.hidden)
    .map((node) => node.getBoundingClientRect());
  const rootRect = root.getBoundingClientRect();
  const indicatorHeight = indicator.offsetHeight || 38;
  const topLimit = mascotTopSafeInset(root);
  const topAnchor = anchors.length ? Math.min(...anchors.map((rect) => rect.top)) : null;
  const roomAbove = topAnchor == null ? rootRect.top - topLimit : topAnchor - topLimit;
  const roomBelow = window.innerHeight - rootRect.bottom - 8;

  if (roomAbove < indicatorHeight + 10 && roomBelow >= indicatorHeight + 10) {
    indicator.dataset.syncPlace = 'below';
    indicator.style.removeProperty('--mascot-sync-stack-offset');
    return;
  }

  indicator.dataset.syncPlace = 'above';
  const stackOffset = topAnchor == null ? 7 : Math.max(7, rootRect.top - topAnchor + 12);
  indicator.style.setProperty('--mascot-sync-stack-offset', Math.ceil(stackOffset) + 'px');
}
function mascotKeepBriefingVisible() {
  const root = mascotRuntime.root;
  const panel = mascotRuntime.panel;
  if (!root || !panel || panel.hidden) return;
  mascotSyncPanelSide();
  const rootRect = root.getBoundingClientRect();
  const topLimit = mascotTopSafeInset(root);
  const panelGap = 20;
  const maxRootTop = Math.max(8, window.innerHeight - rootRect.height - 8);
  const maxPanelHeight = Math.max(80, Math.min(520, maxRootTop - topLimit - panelGap));
  panel.style.maxHeight = Math.floor(maxPanelHeight) + 'px';
  const contentHeight = Math.max(panel.scrollHeight, panel.offsetHeight);
  panel.style.overflowY = contentHeight > maxPanelHeight ? 'auto' : 'visible';
  const desiredTop = Math.min(maxRootTop, topLimit + Math.min(contentHeight, maxPanelHeight) + panelGap);
  if (rootRect.top < desiredTop - 1) {
    mascotSetPosition(rootRect.left, desiredTop, true);
    mascotSyncPanelSide();
  }
  mascotUpdateOverlayLayout();
}
function mascotClearDockTimer() {
  clearTimeout(mascotRuntime.dockTimer);
  mascotRuntime.dockTimer = 0;
}
function mascotScheduleDock() {
  mascotClearDockTimer();
  if (!mascotRuntime.root || mascotRuntime.topReturnFlight || !state.mascotVisible || state.githubSync?.active || state.githubSync?.error || !mascotRuntime.panel?.hidden || mascotRuntime.drag) return;
  mascotRuntime.dockTimer = window.setTimeout(() => {
    if (!mascotRuntime.drag && mascotRuntime.panel?.hidden && !state.githubSync?.active && !state.githubSync?.error) {
      mascotRuntime.root.classList.add('is-docked');
      mascotRuntime.root.classList.remove('is-top-action');
      mascotSetReaction('sleepy', 1500);
      mascotSetAction('dock', 900);
      syncMascotContext();
    }
  }, MASCOT_DOCK_DELAY);
}
function mascotReveal() {
  const wasDocked = mascotRuntime.root?.classList.contains('is-docked');
  mascotRuntime.root?.classList.remove('is-docked');
  mascotClearDockTimer();
  mascotSyncPanelSide();
  if (wasDocked) mascotSetAction('peek', 520);
}
function mascotSetAction(action = '', duration = 0) {
  const root = mascotRuntime.root;
  if (!root) return;
  clearTimeout(mascotRuntime.actionTimer);
  if (action) root.dataset.action = action;
  else delete root.dataset.action;
  if (action && duration > 0) mascotRuntime.actionTimer = window.setTimeout(() => { delete root.dataset.action; }, duration);
}
function mascotSetReaction(reaction = null, duration = null) {
  const root = mascotRuntime.root;
  if (!root) return;
  clearTimeout(mascotRuntime.reactionTimer);
  if (reaction) root.dataset.reaction = reaction;
  else { delete root.dataset.reaction; return; }
  const index = Math.max(0, MASCOT_REACTIONS.indexOf(reaction));
  mascotRuntime.reactionLayer.style.backgroundPosition = mascotCellStyle(index).backgroundPosition;
  const visibleFor = duration ?? (reaction === 'dizzy' ? 1100 : reaction === 'sleepy' ? 1500 : 760);
  mascotRuntime.reactionTimer = window.setTimeout(() => { delete root.dataset.reaction; }, visibleFor);
}
function mascotRandomMessage(messages) {
  const pool = messages.filter((message) => message !== mascotRuntime.lastSpeech);
  return pool[Math.floor(Math.random() * pool.length)] || messages[0];
}
function mascotShowSpeech(message, duration = 2200, mood = '') {
  const root = mascotRuntime.root;
  const speech = mascotRuntime.speech;
  if (!root || !speech || !message) return;
  clearTimeout(mascotRuntime.speechTimer);
  mascotRuntime.lastSpeech = message;
  speech.textContent = message;
  root.dataset.speechMood = mood;
  speech.hidden = false;
  root.classList.add('has-speech');
  mascotUpdateOverlayLayout();
  mascotRuntime.speechTimer = window.setTimeout(() => {
    speech.hidden = true;
    root.classList.remove('has-speech');
    delete root.dataset.speechMood;
    mascotUpdateOverlayLayout();
  }, duration);
}
function syncMascotVisibility() {
  const root = mascotRuntime.root;
  if (!root) return;
  if (!state.mascotVisible) {
    mascotClearDockTimer();
    clearTimeout(mascotRuntime.idleTimer);
    mascotHideSpeech();
    if (mascotRuntime.panel) mascotRuntime.panel.hidden = true;
    root.classList.remove('has-briefing', 'is-top-action');
    mascotUpdateOverlayLayout();
    const syncVisible = Boolean(state.githubSync?.active || state.githubSync?.error);
    root.classList.toggle('is-sync-only', syncVisible);
    root.classList.remove('is-docked');
    root.hidden = !syncVisible;
    return;
  }
  root.classList.remove('is-sync-only');
  root.hidden = false;
  syncMascotContext();
  mascotScheduleDock();
  mascotScheduleIdle();
}
function mascotHideSpeech() {
  clearTimeout(mascotRuntime.speechTimer);
  if (mascotRuntime.speech) mascotRuntime.speech.hidden = true;
  mascotRuntime.root?.classList.remove('has-speech');
  if (mascotRuntime.root) delete mascotRuntime.root.dataset.speechMood;
  mascotUpdateOverlayLayout();
}
function mascotPlayReaction(preferred = null) {
  const now = Date.now();
  const count = now - (mascotRuntime.boopAt || 0) < 1600 ? Number(mascotRuntime.boops || 0) + 1 : 1;
  mascotRuntime.boops = count >= 4 ? 0 : count;
  mascotRuntime.boopAt = now;
  const randomChoices = MASCOT_REACTIONS.filter((reaction) => reaction !== mascotRuntime.lastReaction);
  const randomReaction = randomChoices[Math.floor(Math.random() * randomChoices.length)] || 'blink';
  const reaction = preferred || (count >= 4 ? 'dizzy' : count === 2 ? 'heart' : count === 3 ? 'sparkle' : count === 1 ? 'blink' : randomReaction);
  mascotRuntime.lastReaction = reaction;
  mascotSetReaction(reaction);
  mascotSetAction(reaction === 'sleepy' ? 'sleep' : reaction === 'dizzy' ? 'dizzy' : 'happy', reaction === 'dizzy' ? 1100 : reaction === 'sleepy' ? 1500 : 820);
  return reaction;
}
function mascotScheduleIdle() {
  clearTimeout(mascotRuntime.idleTimer);
  if (!mascotRuntime.root) return;
  const delay = MASCOT_IDLE_MIN + Math.random() * (MASCOT_IDLE_MAX - MASCOT_IDLE_MIN);
  mascotRuntime.idleTimer = window.setTimeout(() => {
    if (!mascotRuntime.drag && mascotRuntime.panel?.hidden && !mascotRuntime.root.classList.contains('is-docked') && !mascotTopActionActive()) {
      mascotPlayReaction();
      mascotShowSpeech(mascotRandomMessage(MASCOT_IDLE_MESSAGES), 2200, 'idle');
    }
    mascotScheduleIdle();
  }, delay);
}
function mascotSetDirectionFromVector(dx, dy) {
  if (!mascotRuntime.directionLayer || Math.hypot(dx, dy) < 8) return;
  const angle = Math.atan2(dy, dx);
  const sector = (Math.round(angle / MASCOT_SECTOR) + MASCOT_CLOCKWISE.length) % MASCOT_CLOCKWISE.length;
  const direction = MASCOT_CLOCKWISE[sector];
  mascotRuntime.directionLayer.style.backgroundPosition = mascotCellStyle(MASCOT_DIRECTIONS.indexOf(direction)).backgroundPosition;
}
function mascotFutureSixHours(weather) {
  const times = weather?.hourly?.time || [];
  const start = currentHourIndex(weather);
  if (start < 0 || !times.length) return state.language === 'en' ? 'The next six hours look fairly steady.' : '未来 6 小时天气比较稳定，按计划安排就好。';
  const end = Math.min(times.length, start + 6);
  const codes = (weather.hourly.weather_code || []).slice(start, end).map(Number);
  const rainChance = Math.max(...(weather.hourly.precipitation_probability || []).slice(start, end).map((value) => Number(value) || 0), 0);
  const temperatures = (weather.hourly.temperature_2m || []).slice(start, end).map(Number).filter(Number.isFinite);
  const winds = (weather.hourly.wind_speed_10m || []).slice(start, end).map(Number).filter(Number.isFinite);
  const rainy = rainChance >= 50 || codes.some((code) => [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code));
  const wind = Math.max(...winds, 0);
  const temperatureDelta = temperatures.length > 1 ? temperatures[temperatures.length - 1] - temperatures[0] : 0;
  if (rainy) return state.language === 'en' ? 'A shower may arrive in the next six hours — keep an umbrella nearby.' : '未来 6 小时有下雨可能，出门记得带伞。';
  if (wind >= 30) return state.language === 'en' ? 'Wind may pick up in the next six hours — keep light items secure.' : '未来 6 小时风力可能增强，轻小物品要收好。';
  if (temperatureDelta >= 4) return state.language === 'en' ? 'It should warm up through the next six hours.' : '未来 6 小时会慢慢升温，早晚温差留意一下。';
  if (temperatureDelta <= -4) return state.language === 'en' ? 'It should cool down through the next six hours.' : '未来 6 小时会逐渐转凉，记得添衣。';
  return state.language === 'en' ? 'The next six hours look fairly steady — make plans with ease.' : '未来 6 小时天气比较稳定，按计划安排就好。';
}
const MASCOT_DAILY_GREETINGS = Object.freeze([
  ['今天，慢慢来也很好', 'Take today at your own pace'],
  ['愿今天有一点小惊喜', 'May today bring a small surprise'],
  ['新的一天，继续向前', 'A new day, one step forward'],
  ['今天也值得好好期待', 'Today is worth looking forward to'],
  ['给自己一个轻松的开始', 'Give yourself an easy start'],
  ['忙里偷闲，也算生活', 'A quiet moment belongs to the day'],
  ['愿你今天自在从容', 'Wishing you an unhurried day'],
  ['每一步，都算数', 'Every small step counts'],
]);
const MASCOT_CLASSIC_POEMS = Object.freeze([
  { text: '行到水穷处，坐看云起时。', author: '王维', title: '《终南别业》', en: 'Where the stream ends, sit and watch clouds rise.', authorEn: 'Wang Wei · Zhongnan Retreat' },
  { text: '采菊东篱下，悠然见南山。', author: '陶渊明', title: '《饮酒·其五》', en: 'Picking chrysanthemums by the eastern fence, I glimpse the southern hills.', authorEn: 'Tao Yuanming · Drinking Wine V' },
  { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白', title: '《行路难》', en: 'Someday I will ride the wind and cleave the waves.', authorEn: 'Li Bai · Hard Is the Way' },
  { text: '人间有味是清欢。', author: '苏轼', title: '《浣溪沙》', en: 'The finest flavor in this world is quiet joy.', authorEn: 'Su Shi · Huanxi Sha' },
  { text: '莫听穿林打叶声，何妨吟啸且徐行。', author: '苏轼', title: '《定风波》', en: 'Let the rain beat leaves; walk on at your own pace.', authorEn: 'Su Shi · Ding Feng Bo' },
  { text: '欲穷千里目，更上一层楼。', author: '王之涣', title: '《登鹳雀楼》', en: 'To see a thousand miles farther, climb one more story.', authorEn: 'Wang Zhihuan · Climbing Stork Tower' },
]);
function mascotDailyIndex(length, date = new Date()) {
  const [year, month, day] = dateKey(date).split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000) % length;
}
let mascotPoemOverride = { hourKey: '', offset: 0 };
let mascotPoemTimer = null;
function mascotPoemHourKey(date = new Date()) { return dateKey(date) + '-' + date.getHours(); }
function mascotDailyPoem() {
  const now = new Date();
  const [year, month, day] = dateKey(now).split('-').map(Number);
  const hourSlot = Math.floor(Date.UTC(year, month - 1, day) / 86400000) * 24 + now.getHours();
  const key = mascotPoemHourKey(now);
  const offset = mascotPoemOverride.hourKey === key ? mascotPoemOverride.offset : 0;
  return MASCOT_CLASSIC_POEMS[((hourSlot + offset) % MASCOT_CLASSIC_POEMS.length + MASCOT_CLASSIC_POEMS.length) % MASCOT_CLASSIC_POEMS.length];
}
function mascotPoemMarkup() {
  const english = state.language === 'en';
  const poem = mascotDailyPoem();
  const changeLabel = english ? 'Change poem' : '更换诗词';
  return '<figure class="onebox-mascot-poem"><div class="onebox-mascot-poem-head"><span>' + (english ? 'Poem of the hour' : '每小时一诗') + '</span><button type="button" data-mascot-poem-next aria-label="' + changeLabel + '" title="' + changeLabel + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 1-2.35-5.66L20 8"></path><path d="M20 3v5h-5"></path></svg></button></div><blockquote>' + escapeHtml(english ? poem.en : poem.text) + '</blockquote><figcaption>' + escapeHtml(english ? poem.authorEn : '——' + poem.author + ' · ' + poem.title) + '</figcaption></figure>';
}
function refreshMascotPoem() {
  const current = mascotRuntime.panel?.querySelector('.onebox-mascot-poem');
  if (!current || mascotRuntime.panel.hidden) return;
  const template = document.createElement('template');
  template.innerHTML = mascotPoemMarkup();
  current.replaceWith(template.content.firstElementChild);
}
function scheduleMascotPoemChange() {
  clearTimeout(mascotPoemTimer);
  if (!mascotRuntime.panel || mascotRuntime.panel.hidden) return;
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1);
  mascotPoemTimer = setTimeout(() => {
    mascotPoemOverride = { hourKey: '', offset: 0 };
    refreshMascotPoem();
    scheduleMascotPoemChange();
  }, Math.max(1000, nextHour.getTime() - now.getTime() + 30));
}
function changeMascotPoem() {
  const hourKey = mascotPoemHourKey();
  mascotPoemOverride = { hourKey, offset: mascotPoemOverride.hourKey === hourKey ? mascotPoemOverride.offset + 1 : 1 };
  refreshMascotPoem();
  const button = mascotRuntime.panel?.querySelector('[data-mascot-poem-next]');
  button?.classList.add('is-refreshing');
  window.setTimeout(() => button?.classList.remove('is-refreshing'), 480);
}
async function refreshMascotWeatherForCurrentPlace() {
  const card = state.weatherCards[0];
  const current = card?.isCurrentLocation ? card : null;
  if (!card || state.weatherLoading) return;
  state.weatherLoading = true;
  try {
    let place = { latitude: Number(card.latitude), longitude: Number(card.longitude), name: card.name, admin1: card.admin1, admin2: card.admin2, country: card.country, isCurrentLocation: Boolean(current) };
    let moved = false;
    if (current && navigator.geolocation && navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { maximumAge: 5 * 60 * 1000, timeout: 3500, enableHighAccuracy: false }));
          moved = Math.abs(position.coords.latitude - place.latitude) > .015 || Math.abs(position.coords.longitude - place.longitude) > .015;
          if (moved) place = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        }
      } catch { /* Use the last saved coordinates if location lookup is unavailable. */ }
    }
    if (!moved && Date.now() - Number(card.updatedAt || 0) < 30 * 60 * 1000) return;
    const data = await getWeatherData(place.latitude, place.longitude);
    Object.assign(card, data, place, { updatedAt: Date.now(), loading: false, loadError: false });
    saveWeatherCards();
  } catch {
    card.loading = false;
  } finally {
    state.weatherLoading = false;
    refreshMascotBriefing();
  }
}
function mascotDateLabel(date = new Date()) {
  const dateText = new Intl.DateTimeFormat(state.language === 'en' ? 'en-US' : 'zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(date);
  if (state.language === 'en') return dateText;
  const lunar = lunarFor(date);
  if (!lunar) return dateText;
  const lunarMonth = lunar.monthText.replace(/^十一月$/, '冬月').replace(/^十二月$/, '腊月');
  return dateText + '（农历' + lunarMonth + lunar.dayText + '）';
}
function mascotReadingMarkup() {
  const book = [...(state.library || [])].filter((item) => Number(item.lastOpenedAt) > 0).sort((a, b) => Number(b.lastOpenedAt) - Number(a.lastOpenedAt))[0];
  if (!book) return '';
  const progress = typeof book.progress === 'number' ? book.progress : Number(book.progress?.percent || 0);
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const readingLabel = state.language === 'en' ? 'Reading now' : '正在读';
  const bookName = book.name || (state.language === 'en' ? 'Untitled book' : '未命名文档');
  return '<button type="button" class="onebox-mascot-reading-line" data-mascot-action="reader" aria-label="' + escapeHtml(readingLabel + ' ' + bookName) + '"><span class="onebox-mascot-reading-content"><span class="onebox-mascot-reading-label"><span class="onebox-mascot-line-icon" aria-hidden="true">' + TOOL_DEFS.reader.icon + '</span><small>' + escapeHtml(readingLabel) + '</small></span><span class="onebox-mascot-reading-book"><strong>' + escapeHtml(bookName) + '</strong><em>' + percent + '%</em></span></span></button>';
}
function mascotWeatherMarkup() {
  const weather = state.weatherCards[0];
  if (!weather) return '<p class="onebox-mascot-empty">' + escapeHtml(state.language === 'en' ? 'Add a weather place first' : '还没有天气卡片') + '</p>';
  if (weather.loading && !weather.current) return '<p class="onebox-mascot-empty">' + escapeHtml(t('weatherLoading')) + '</p>';
  const current = weather.current || {};
  const condition = weatherCode(current.weather_code);
  const temp = Number.isFinite(Number(current.temperature_2m)) ? Math.round(Number(current.temperature_2m)) + '°' : '—';
  const place = weather.name || (state.language === 'en' ? 'Weather' : '天气');
  const meta = [condition[1], weatherWindLabel(current.wind_speed_10m), (state.language === 'en' ? 'Humidity ' : '湿度 ') + (current.relative_humidity_2m ?? '—') + '%', (state.language === 'en' ? 'Elevation ' : '海拔 ') + weatherElevationLabel(weather.elevation)].join(' · ');
  return '<div class="onebox-mascot-weather-inline"><div class="onebox-mascot-weather-now"><span class="onebox-mascot-weather-symbol" aria-hidden="true">' + condition[0] + '</span><span><strong>' + escapeHtml(place) + ' ' + escapeHtml(temp) + '</strong><span class="onebox-mascot-weather-condition"><span class="onebox-mascot-weather-meta">' + escapeHtml(meta) + '</span></span></span></div><p class="onebox-mascot-weather-insight">' + escapeHtml(mascotFutureSixHours(weather)) + '</p></div>';
}
function mascotActionButton(action, label, icon) {
  const interaction = PET_INTERACTIONS.find((item) => item.id === action);
  const unlocked = petInteractionUnlocked(action);
  const displayLabel = !unlocked && interaction ? label + ' · Lv.' + interaction.level : label;
  return '<button type="button" data-mascot-action="' + action + '" aria-label="' + escapeHtml(displayLabel) + '" ' + (unlocked ? '' : 'disabled') + '><span class="onebox-mascot-action-icon" aria-hidden="true">' + icon + '</span><span class="onebox-mascot-action-label">' + escapeHtml(displayLabel) + '</span></button>';
}
function mascotBriefingMarkup() {
  const todayLabel = mascotDateLabel();
  const language = state.language === 'en';
  const hello = MASCOT_DAILY_GREETINGS[mascotDailyIndex(MASCOT_DAILY_GREETINGS.length)][language ? 1 : 0];
  const hint = language ? 'Tap a little button, or double-tap me to see a surprise' : '点一点下面的小按钮，或者双击我看看惊喜';
  const label = (zh, en) => language ? en : zh;
  const icon = (id) => TOOL_DEFS[id]?.icon || SECTION_DEFS[id]?.icon || '';
  const actionRows = '<div class="onebox-mascot-action-row onebox-mascot-action-row-interactions">' + mascotActionButton('pat', label('摸摸头', 'Pat me'), '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5.2-8.8 10-8.8 10s-8.8-4.8-8.8-10A4.8 4.8 0 0 1 12 6.1a4.8 4.8 0 0 1 8.8 2.7Z"/></svg>') + mascotActionButton('ball', label('玩玩球', 'Play ball'), '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 5.1 1.1 4.2-3.4 2.5M15.5 5.1l-1.1 4.2 3.4 2.5M7.3 15.3h4.1l2.5 3.5M16.7 15.3h-4.1l-2.5 3.5"/></svg>') + mascotActionButton('snack', label('喂零食', 'Treat'), '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8.5h14l-1.3 10H6.3L5 8.5Z"/><path d="M8 8.5a4 4 0 0 1 8 0M9 12h.01M12 14h.01M15 12h.01"/></svg>') + mascotActionButton('highfive', label('击个掌', 'High five'), '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 12.2V5.6a1.4 1.4 0 0 1 2.8 0v4.2-5.6a1.4 1.4 0 0 1 2.8 0v5.3-4.3a1.4 1.4 0 0 1 2.8 0v5.2-2.1a1.4 1.4 0 0 1 2.8 0v5.3c0 3.3-2.7 6-6 6h-1.1c-2.3 0-4.3-1.3-5.3-3.3L5.6 13a1.6 1.6 0 0 1 2.9-.8Z"/></svg>') + mascotActionButton('nap', label('打个盹', 'Nap'), '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16.5h16M6 16.5V12a6 6 0 0 1 12 0v4.5M9 8V5M12 7V3M15 8V5"/></svg>') + '</div><div class="onebox-mascot-action-row onebox-mascot-action-row-tools">' + mascotActionButton('weather', label('天气', 'Weather'), icon('weather')) + mascotActionButton('calendar', label('日历', 'Calendar'), icon('calendar')) + mascotActionButton('reader', label('阅读', 'Reading'), icon('reader')) + mascotActionButton('navigation', label('导航', 'Navigation'), icon('navigation')) + mascotActionButton('calculator', label('计算', 'Calculator'), icon('calculator')) + '</div><div class="onebox-mascot-action-row onebox-mascot-action-row-sections">' + mascotActionButton('home', label('首页', 'Home'), icon('home')) + mascotActionButton('messages', label('消息', 'Messages'), icon('messages')) + mascotActionButton('mine', label('我的', 'Me'), icon('mine')) + '</div>';
  return '<div class="onebox-mascot-cloud"><div class="onebox-mascot-cloud-head"><div class="onebox-mascot-date"><div><strong>' + escapeHtml(hello) + '</strong><small>' + escapeHtml(todayLabel) + '</small></div></div><button type="button" class="onebox-mascot-cloud-close" data-close-mascot aria-label="' + escapeHtml(t('close')) + '">×</button></div><div class="onebox-mascot-cloud-story">' + mascotWeatherMarkup() + mascotPoemMarkup() + mascotReadingMarkup() + '</div><div class="onebox-mascot-cloud-actions">' + actionRows + '</div><p class="onebox-mascot-cloud-hint">' + escapeHtml(hint) + '</p></div>';
}
function refreshMascotBriefing() {
  if (mascotRuntime.panel && !mascotRuntime.panel.hidden) {
    mascotRuntime.panel.innerHTML = mascotBriefingMarkup();
    requestAnimationFrame(mascotKeepBriefingVisible);
  }
}
function closeMascotBriefing() {
  if (!mascotRuntime.panel) return;
  const wasOpen = !mascotRuntime.panel.hidden;
  mascotRuntime.panel.hidden = true;
  mascotRuntime.root?.classList.remove('has-briefing');
  mascotHideSpeech();
  if (wasOpen) mascotSetAction('peek', 480);
  clearTimeout(mascotPoemTimer);
  mascotScheduleDock();
}
function openMascotBriefing() {
  if (!mascotRuntime.panel) return;
  mascotReveal();
  mascotHideSpeech();
  mascotRuntime.panel.innerHTML = mascotBriefingMarkup();
  mascotRuntime.panel.hidden = false;
  mascotRuntime.root.classList.add('has-briefing');
  requestAnimationFrame(mascotKeepBriefingVisible);
  mascotPlayReaction('delighted');
  void refreshMascotWeatherForCurrentPlace();
  scheduleMascotPoemChange();
  const year = new Date().getFullYear();
  Promise.resolve(ensureHolidayYear(year)).then(() => { if (!mascotRuntime.panel?.hidden) refreshMascotBriefing(); }).catch(() => {});
}
function mascotPlayTrick() {
  closeMascotBriefing();
  mascotClearDockTimer();
  mascotSetReaction('dizzy');
  mascotSetAction('dizzy', 1100);
  mascotShowSpeech(state.language === 'en' ? 'Whoa, too fast!' : '哎呀，转晕啦！', 1800, 'dizzy');
}
function mascotTopActionActive() {
  return state.section === 'home' && appScrollTop() > 84 && !mascotRuntime.root?.classList.contains('is-docked');
}
function syncMascotContext() {
  const root = mascotRuntime.root;
  const button = mascotRuntime.button;
  if (!root || !button) return;
  const syncPinned = Boolean(state.githubSync?.active || state.githubSync?.error);
  const topAction = mascotRuntime.topReturnFlight || (mascotTopActionActive() && !syncPinned);
  const wasTopAction = root.classList.contains('is-top-action');
  root.classList.toggle('is-top-action', topAction);
  button.setAttribute('aria-label', topAction ? (state.language === 'en' ? 'Back to top' : '回到顶部') : (state.language === 'en' ? 'Open today overview' : '查看今日速览'));
  if (topAction && !wasTopAction && !mascotRuntime.topActionAnnounced) {
    mascotRuntime.topActionAnnounced = true;
    mascotShowSpeech(state.language === 'en' ? 'Tap me to go back up!' : '点我就可以回到上方哟！', 2300, 'top');
  }
  if (!topAction) mascotRuntime.topActionAnnounced = false;
  mascotSyncPanelSide();
}
function updateMascotScrollState() {
  const scrollingHome = state.section === 'home';
  if (scrollingHome) {
    mascotReveal();
    mascotClearDockTimer();
  }
  const topAction = mascotTopActionActive();
  if (topAction && mascotRuntime.panel && !mascotRuntime.panel.hidden) {
    mascotRuntime.panel.hidden = true;
    mascotRuntime.root?.classList.remove('has-briefing');
    mascotClearDockTimer();
  }
  syncMascotContext();
  if (scrollingHome) mascotScheduleDock();
}
async function mascotFlyBackToTop() {
  const root = mascotRuntime.root;
  if (!root || mascotRuntime.topReturnFlight) return;
  mascotClearDockTimer();
  clearTimeout(mascotRuntime.idleTimer);
  mascotRuntime.topReturnFlight = true;
  root.classList.add('is-top-return-flight');
  mascotSetReaction('delighted', 1600);
  mascotSetAction('', 0);
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  try {
    if (reducedMotion) scrollAppTo(0, 'auto');
    else await scrollAppToTopDamped();
  } finally {
    root.classList.remove('is-top-return-flight');
    mascotRuntime.topReturnFlight = false;
    syncMascotContext();
    mascotSetAction('', 0);
    mascotSetReaction('delighted', 820);
    mascotScheduleDock();
  }
}
function mascotAim(pointer) {
  const root = mascotRuntime.root;
  if (!root || root.classList.contains('is-docked') || root.classList.contains('is-dragging')) return;
  const box = root.getBoundingClientRect();
  const dx = pointer.x - (box.left + box.width / 2);
  const dy = pointer.y - (box.top + box.height / 2);
  if (Math.hypot(dx, dy) < MASCOT_DEAD_ZONE) {
    mascotRuntime.sector = -1;
    mascotRuntime.directionLayer.style.backgroundPosition = '50% 50%';
    return;
  }
  const angle = Math.atan2(dy, dx);
  if (mascotRuntime.sector !== -1 && Math.abs(mascotWrapAngle(angle - mascotRuntime.sector * MASCOT_SECTOR)) < MASCOT_SECTOR / 2 + MASCOT_HYSTERESIS) return;
  mascotRuntime.sector = (Math.round(angle / MASCOT_SECTOR) + MASCOT_CLOCKWISE.length) % MASCOT_CLOCKWISE.length;
  const direction = MASCOT_CLOCKWISE[mascotRuntime.sector];
  mascotRuntime.directionLayer.style.backgroundPosition = mascotCellStyle(MASCOT_DIRECTIONS.indexOf(direction)).backgroundPosition;
}
function mascotFinishDrag(event) {
  const drag = mascotRuntime.drag;
  if (!drag || (event.pointerId != null && event.pointerId !== drag.pointerId)) return;
  const cancelled = event.type === 'pointercancel';
  mascotRuntime.drag = null;
  mascotRuntime.root.classList.remove('is-dragging');
  try { if (mascotRuntime.button.hasPointerCapture?.(drag.pointerId)) mascotRuntime.button.releasePointerCapture(drag.pointerId); } catch {}
  if (drag.moved) {
    mascotRuntime.suppressClickUntil = Date.now() + 500;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const droppedAtBottom = event.clientY >= window.innerHeight - Math.max(72, (mascotRuntime.root.offsetHeight || 82) * .9);
    if (!cancelled && droppedAtBottom) {
      mascotLaunchRocket();
      return;
    }
    const isEdgeSwipe = Math.abs(dx) >= MASCOT_EDGE_SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.2;
    if (isEdgeSwipe) {
      const width = mascotRuntime.root.offsetWidth || 82;
      const edge = dx < 0 ? 'left' : 'right';
      const left = edge === 'left' ? 8 : window.innerWidth - width - 8;
      const top = mascotClampPosition(mascotRuntime.position?.left ?? drag.left, mascotRuntime.position?.top ?? drag.top).top;
      mascotSetPosition(left, top);
      mascotRuntime.root.dataset.edge = edge;
      mascotRuntime.root.classList.add('is-docked');
      mascotSyncPanelSide();
      mascotClearDockTimer();
      mascotSetReaction('wink', 760);
      mascotSetAction('dock', 760);
      mascotShowSpeech(mascotRandomMessage(MASCOT_EDGE_MESSAGES), 1800, 'edge');
      return;
    }
    const position = mascotRuntime.position || { left: drag.left, top: drag.top };
    mascotSetPosition(position.left, position.top);
    mascotSyncPanelSide();
    mascotScheduleDock();
    mascotSetReaction('delighted', 760);
    mascotSetAction('land', 760);
    mascotShowSpeech(mascotRandomMessage(MASCOT_DRAG_MESSAGES), 1800, 'land');
    return;
  }
  if (!cancelled) {
    mascotSetReaction('blink', 520);
    mascotSetAction(mascotTopActionActive() ? 'hop' : 'tap', 520);
    mascotHandleTap();
  }
}
function mascotUpdateDrag(event) {
  const drag = mascotRuntime.drag;
  if (!drag || (event.pointerId != null && event.pointerId !== drag.pointerId)) return;
  const dx = event.clientX - drag.startX; const dy = event.clientY - drag.startY;
  if (!drag.moved && Math.hypot(dx, dy) < 6) return;
  drag.moved = true;
  if (event.cancelable) event.preventDefault();
  mascotSetAction('drag');
  mascotSetDirectionFromVector(dx, dy);
  mascotSetPosition(drag.left + dx, drag.top + dy, false);
}
function mascotHandleTap() {
  if (Date.now() < mascotRuntime.suppressClickUntil) return;
  if (mascotRuntime.topReturnFlight) return;
  const now = Date.now();
  clearTimeout(mascotRuntime.singleClickTimer);
  if (now - mascotRuntime.tapAt < 340) {
    mascotRuntime.tapAt = 0;
    mascotPlayTrick();
    return;
  }
  mascotRuntime.tapAt = now;
  mascotRuntime.singleClickTimer = window.setTimeout(() => {
    if (mascotRuntime.root?.classList.contains('is-top-action')) { void mascotFlyBackToTop(); return; }
    openMascotBriefing();
  }, 250);
}
function mascotLaunchRocket() {
  const root = mascotRuntime.root;
  if (!root) return;
  clearTimeout(mascotRuntime.launchTimer);
  closeMascotBriefing();
  mascotClearDockTimer();
  mascotReveal();
  root.classList.remove('is-playing-ball');
  root.classList.add('is-launching');
  mascotSetReaction('delighted', 1100);
  mascotSetAction('rocket', 1100);
  mascotShowSpeech(state.language === 'en' ? 'Rocket launch! Up we go!' : '咻——火箭发射，冲上去啦！', 1800, 'rocket');
  mascotRuntime.launchTimer = window.setTimeout(() => {
    root.classList.remove('is-launching');
    mascotSetAction('', 0);
    mascotScheduleDock();
  }, 1150);
}
function mascotPlayBall() {
  const root = mascotRuntime.root;
  if (!root) return;
  clearTimeout(mascotRuntime.ballTimer);
  closeMascotBriefing();
  mascotClearDockTimer();
  mascotReveal();
  root.classList.remove('is-launching');
  root.classList.add('is-playing-ball');
  mascotSetReaction('heart', 1200);
  mascotSetAction('ball', 1200);
  mascotShowSpeech(state.language === 'en' ? 'Catch it!' : '接住球球！', 1800, 'ball');
  mascotRuntime.ballTimer = window.setTimeout(() => {
    root.classList.remove('is-playing-ball');
    mascotSetAction('', 0);
    mascotScheduleDock();
  }, 1300);
}
function mascotPlayScene(kind) {
  const root = mascotRuntime.root;
  if (!root) return;
  const scenes = {
    snack: { className: 'is-feeding', reaction: 'delighted', action: 'happy', message: state.language === 'en' ? 'A tasty little treat!' : '好吃！能量补充完毕～', duration: 1500 },
    highfive: { className: 'is-highfiving', reaction: 'heart', action: 'happy', message: state.language === 'en' ? 'High five!' : '啪！击掌成功～', duration: 1250 },
    nap: { className: 'is-taking-nap', reaction: 'sleepy', action: 'sleep', message: state.language === 'en' ? 'Just a tiny recharge...' : '我先打个小盹，马上回来～', duration: 3300 },
  }[kind];
  if (!scenes) return;
  clearTimeout(mascotRuntime.sceneTimer);
  clearTimeout(mascotRuntime.ballTimer);
  clearTimeout(mascotRuntime.launchTimer);
  closeMascotBriefing();
  mascotClearDockTimer();
  mascotReveal();
  ['is-launching', 'is-playing-ball', 'is-feeding', 'is-highfiving', 'is-taking-nap'].forEach((className) => root.classList.remove(className));
  root.classList.add(scenes.className);
  mascotSetReaction(scenes.reaction, scenes.duration);
  mascotSetAction(scenes.action, scenes.duration);
  mascotShowSpeech(scenes.message, scenes.duration + 350, kind);
  mascotRuntime.sceneTimer = window.setTimeout(() => {
    root.classList.remove(scenes.className);
    mascotSetAction('', 0);
    mascotScheduleDock();
  }, scenes.duration + 80);
}
function mountMascot() {
  if (mascotRuntime.root) return;
  const root = document.createElement('aside');
  root.id = 'oneboxMascotRoot'; root.className = 'onebox-mascot-root'; root.dataset.edge = 'right'; root.dataset.panelSide = 'right';
  root.innerHTML = '<span class="onebox-mascot-propeller" aria-hidden="true"><i></i><i></i><b></b></span><span class="onebox-mascot-rocket" aria-hidden="true">🚀</span><span class="onebox-mascot-ball" aria-hidden="true">⚽</span><span class="onebox-mascot-snack" aria-hidden="true">🍪</span><span class="onebox-mascot-highfive" aria-hidden="true">🖐️</span><span class="onebox-mascot-nap" aria-hidden="true">💤</span><div class="onebox-mascot-speech" role="status" aria-live="polite" hidden></div><div class="onebox-mascot-panel" hidden></div><div class="onebox-mascot-sync-progress" data-mascot-sync-progress data-sync-place="above" hidden><button type="button" class="onebox-mascot-sync-trigger" data-mascot-sync-trigger aria-live="polite"><span class="onebox-mascot-sync-dot" aria-hidden="true"></span><strong data-mascot-sync-message></strong><span class="onebox-mascot-sync-ring" data-mascot-sync-ring aria-hidden="true"><em data-mascot-sync-percent>0%</em></span></button><button type="button" class="onebox-mascot-sync-dismiss" data-mascot-sync-dismiss aria-label="关闭同步状态" title="关闭" hidden><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg></button></div><button type="button" class="onebox-mascot-button" aria-label="查看今日速览"><span class="onebox-mascot-visual" aria-hidden="true">' + MASCOT_FULL_BODY_MARKUP + '<span class="onebox-mascot-layer onebox-mascot-direction"></span><span class="onebox-mascot-layer onebox-mascot-reaction"></span><span class="onebox-mascot-outfit" aria-hidden="true"></span><img class="onebox-mascot-fallback" src="icons/mascot-fox-full.png?v=2.18.264" alt="" draggable="false"></span></button>';
  document.body.appendChild(root);
  mascotRuntime.root = root; mascotRuntime.button = $('.onebox-mascot-button', root); mascotRuntime.panel = $('.onebox-mascot-panel', root); mascotRuntime.speech = $('.onebox-mascot-speech', root); mascotRuntime.directionLayer = $('.onebox-mascot-direction', root); mascotRuntime.reactionLayer = $('.onebox-mascot-reaction', root);
  mascotRuntime.directionLayer.style.backgroundImage = 'url("' + MASCOT_ASSETS.directions + '")';
  mascotRuntime.reactionLayer.style.backgroundImage = 'url("' + MASCOT_ASSETS.reactions + '")';
  syncMascotDisplayMode();
  syncMascotOutfit();
  const saved = mascotPositionValue();
  if (saved) mascotSetPosition(saved.left, saved.top, false);
  else mascotSyncPanelSide();
  let loaded = 0;
  const markAssetLoaded = () => { loaded += 1; if (loaded === 2) root.classList.add('assets-loaded'); };
  const markAssetFailed = () => root.classList.add('assets-fallback');
  [MASCOT_ASSETS.directions, MASCOT_ASSETS.reactions].forEach((src) => { const image = new Image(); image.onerror = markAssetFailed; image.onload = markAssetLoaded; image.src = src; });
  root.addEventListener('pointerdown', (event) => {
    if (!event.target.closest?.('.onebox-mascot-button')) return;
    if (event.button != null && event.button !== 0) return;
    mascotReveal(); closeMascotBriefing();
    mascotHideSpeech();
    mascotSetAction('grab');
    const rect = root.getBoundingClientRect();
    mascotRuntime.drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, left: rect.left, top: rect.top, moved: false };
    try { mascotRuntime.button.setPointerCapture?.(event.pointerId); } catch {}
  });
  mascotRuntime.button.addEventListener('pointermove', mascotUpdateDrag, { passive: false });
  mascotRuntime.button.addEventListener('pointerup', mascotFinishDrag, { passive: false });
  mascotRuntime.button.addEventListener('pointercancel', mascotFinishDrag, { passive: false });
  mascotRuntime.button.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); mascotHandleTap(); } });
  $('[data-mascot-sync-trigger]', root)?.addEventListener('click', () => renderGithubDialog());
  $('[data-mascot-sync-dismiss]', root)?.addEventListener('click', dismissGithubSyncIndicator);
  mascotRuntime.panel.addEventListener('click', (event) => {
    if (event.target.closest('[data-mascot-poem-next]')) { event.preventDefault(); event.stopPropagation(); changeMascotPoem(); return; }
    if (event.target.closest('[data-close-mascot]')) { closeMascotBriefing(); return; }
    const action = event.target.closest('[data-mascot-action]')?.dataset.mascotAction;
    if (action && !petInteractionUnlocked(action)) return;
    if (['pat', 'ball', 'snack', 'highfive', 'nap'].includes(action)) awardPetPoints(1, 'interaction', 'interaction:' + action + ':' + dateKey(new Date()) + ':' + Math.floor(Date.now() / 60000));
    if (action === 'pat') {
      closeMascotBriefing();
      mascotPlayReaction('heart');
      mascotShowSpeech(state.language === 'en' ? 'That tickles!' : '嘿嘿，好痒呀！', 1800, 'pat');
    }
    if (action === 'ball') mascotPlayBall();
    if (['snack', 'highfive', 'nap'].includes(action)) mascotPlayScene(action);
    if (['weather', 'calendar', 'reader', 'navigation', 'calculator'].includes(action)) {
      closeMascotBriefing();
      mascotPlayReaction('sparkle');
      selectTool(action);
    }
    if (['home', 'messages', 'mine'].includes(action)) {
      closeMascotBriefing();
      mascotPlayReaction('sparkle');
      selectSection(action);
    }
  });
  document.addEventListener('pointerdown', (event) => { if (mascotRuntime.panel && mascotRuntime.root && !mascotRuntime.root.contains(event.target)) closeMascotBriefing(); }, true);
  if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) window.addEventListener('pointermove', (event) => mascotAim({ x: event.clientX, y: event.clientY }), { passive: true });
  const syncMascotViewport = () => {
    if (mascotRuntime.position) mascotSetPosition(mascotRuntime.position.left, mascotRuntime.position.top, false);
    mascotSyncPanelSide();
    if (mascotRuntime.panel && !mascotRuntime.panel.hidden) mascotKeepBriefingVisible();
    else mascotUpdateOverlayLayout();
  };
  window.addEventListener('resize', syncMascotViewport, { passive: true });
  window.visualViewport?.addEventListener('resize', syncMascotViewport, { passive: true });
  syncMascotVisibility();
  renderGithubSyncIndicator();
}
let pendingNavigationRestore = null;
let navigationRestoreTimers = [];
function saveNavigationPosition() {
  try {
    const tabs = $('.feed-source-tabs');
    sessionStorage.setItem(NAVIGATION_SESSION_KEY, JSON.stringify({ hash: location.hash, section: state.section, tool: state.tool, homeFeedActive: state.homeFeed.active, mainScrollTop: appScrollTop(), sourceScrollLeft: tabs?.scrollLeft || 0, savedAt: Date.now() }));
  } catch { /* session storage may be disabled */ }
}
function clearNavigationRestoreTimers() {
  navigationRestoreTimers.forEach((timer) => clearTimeout(timer));
  navigationRestoreTimers = [];
}
function applyNavigationPosition(saved) {
  if (!saved || saved.hash !== location.hash) return;
  clearPageSwipeTrack();
  if (state.section === 'home' && homeTabIds().includes(saved.homeFeedActive) && state.homeFeed.active !== saved.homeFeedActive) {
    state.homeFeed.active = saved.homeFeedActive;
    render();
  }
  const tabs = $('.feed-source-tabs');
  const scrollElement = appScrollElement();
  if (scrollElement) {
    const requestedTop = Math.max(0, Number(saved.mainScrollTop) || 0);
    const maxTop = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight);
    scrollAppTo(Math.min(requestedTop, maxTop), 'instant');
  }
  if (tabs) tabs.scrollLeft = Math.max(0, Number(saved.sourceScrollLeft) || 0);
  $('#bottomNav')?.classList.remove('is-blurred'); $('main')?.classList.remove('bottom-nav-blurred'); lastMainScrollTop = appScrollTop();
}
function restoreNavigationPosition() {
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(NAVIGATION_SESSION_KEY) || 'null'); sessionStorage.removeItem(NAVIGATION_SESSION_KEY); } catch { saved = null; }
  if (!saved || saved.hash !== location.hash || Date.now() - Number(saved.savedAt || 0) > 30 * 60 * 1000) return;
  clearNavigationRestoreTimers();
  pendingNavigationRestore = saved;
  const restore = () => {
    if (pendingNavigationRestore !== saved || saved.hash !== location.hash) return;
    applyNavigationPosition(saved);
  };
  requestAnimationFrame(restore);
  [100, 240, 420, 720, 1200, 1800].forEach((delay) => {
    navigationRestoreTimers.push(window.setTimeout(restore, delay));
  });
  navigationRestoreTimers.push(window.setTimeout(() => {
    if (pendingNavigationRestore === saved) pendingNavigationRestore = null;
    clearNavigationRestoreTimers();
  }, 2400));
}
let feedNavigationPending = false;
let feedNavigationTimer = null;
function clearFeedNavigationPending() {
  feedNavigationPending = false;
  clearTimeout(feedNavigationTimer);
  feedNavigationTimer = null;
  $$('.feed-item.is-opening').forEach((item) => {
    item.classList.remove('is-opening');
    item.removeAttribute('aria-busy');
  });
}
function recoverHomeLayoutAfterReturn() {
  syncOneBoxViewportMetrics();
  clearPageSwipeTrack();
  pageSwipeAnimationToken = 0;
  pageSwipeGesture = null;
  clearFeedNavigationPending();
  if (state.section !== 'home') return;
  const currentTop = pendingNavigationRestore ? Math.max(0, Number(pendingNavigationRestore.mainScrollTop) || 0) : appScrollTop();
  // A bfcache return should keep the already-rendered feed stable. Rebuild
  // only when the document lost its home view or there are no cached items;
  // otherwise the extra loading render is visible as a flash/jump.
  const hasCachedItems = homeFeedSources().some((source) => state.homeFeed.sources[source.id]?.items?.length);
  if (!workspace.querySelector('.home-page') || !hasCachedItems) render();
  else loadHomeFeeds();
  const restore = () => {
    syncOneBoxViewportMetrics();
    syncHomeFeedSurface();
    const scrollElement = appScrollElement();
    if (scrollElement) {
      const maxTop = Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight);
      const targetTop = Math.min(Math.max(0, currentTop), maxTop);
      if (Math.abs(scrollElement.scrollTop - targetTop) > 1) scrollAppTo(targetTop, 'instant');
    }
    $('main')?.classList.remove('bottom-nav-blurred');
    $('#bottomNav')?.classList.remove('is-blurred');
  };
  requestAnimationFrame(restore);
  window.setTimeout(restore, 180);
  window.setTimeout(restore, 420);
}
function openFeedLink(link, forceNewTab = false) {
  const target = mobileFeedLink(feedItemByLink(link));
  if (!target) {
    toast(state.language === 'en' ? 'This article link is unavailable' : '这篇文章暂时没有可用链接', 'error');
    return false;
  }
  if (!navigator.onLine) {
    toast(state.language === 'en' ? 'You are offline. Please try again later.' : '当前处于离线状态，请联网后重试', 'error');
    return false;
  }
  if (feedNavigationPending) return false;
  const item = $$('.feed-item').find((node) => node.dataset.feedLink === link);
  item?.classList.add('is-opening');
  item?.setAttribute('aria-busy', 'true');
  feedNavigationPending = true;
  if (forceNewTab || state.openMode === 'new-tab') {
    const opened = window.open(target, '_blank', 'noopener,noreferrer');
    clearFeedNavigationPending();
    if (!opened) toast(state.language === 'en' ? 'The new tab was blocked by the browser' : '浏览器拦截了新标签页，请允许后重试', 'error');
    return Boolean(opened);
  }
  saveNavigationPosition();
  feedNavigationTimer = window.setTimeout(() => {
    if (document.visibilityState === 'visible') {
      clearFeedNavigationPending();
      toast(state.language === 'en' ? 'The article could not be opened. Please try again.' : '文章页面暂时无法打开，请稍后重试', 'error');
    }
  }, 4200);
  try { window.location.assign(target); return true; }
  catch {
    clearFeedNavigationPending();
    toast(state.language === 'en' ? 'The article could not be opened' : '文章页面打开失败', 'error');
    return false;
  }
}
function homeSourceTabsMarkup() {
  const sources = homeFeedSources();
  const sourceTabs = sources.map((source, index) => {
    return '<button class="feed-source-tab ' + (state.homeFeed.active === source.id ? 'active' : '') + '" draggable="true" data-feed-source="' + source.id + '" data-feed-source-index="' + index + '">' + homeTabMarkMarkup(source) + '<span>' + escapeHtml(source.name) + '</span></button>';
  }).join('');
  const footprintTab = state.footprint ? '<button class="feed-source-tab ' + (state.homeFeed.active === 'footprint' ? 'active' : '') + '" data-feed-source="footprint" aria-label="' + t('footprint') + '">' + homeTabMarkMarkup({ id: 'footprint' }) + '<span>' + t('footprint') + '</span></button>' : '';
  return footprintTab + sourceTabs;
}
function homeSourcePickerMarkup() {
  const options = homeTabEntries().map((entry) => {
    const selected = homeTabIsVisible(entry.id);
    const actionLabel = selected ? t('homeSourceRemove') : t('homeSourceAdd');
    const actionIcon = selected ? '<path d="M6 12h12"/>' : '<path d="M12 6v12M6 12h12"/>';
    return '<div class="home-source-option ' + (selected ? 'is-selected' : '') + '"><span class="home-source-option-mark">' + homeTabMarkMarkup(entry) + '</span><span class="home-source-option-copy"><strong>' + escapeHtml(entry.name) + '</strong></span><button class="home-source-option-action" type="button" data-home-source-toggle="' + escapeHtml(entry.id) + '" aria-label="' + escapeHtml(actionLabel + ' ' + entry.name) + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + actionIcon + '</svg></button></div>';
  }).join('');
  return '<div class="dialog-card home-source-dialog-card" role="dialog" aria-modal="true"><div class="dialog-head"><div><h2>' + escapeHtml(t('homeSourceManage')) + '</h2><p class="home-source-dialog-hint">' + escapeHtml(t('homeSourceManageHint')) + '</p></div><button class="icon-btn small" data-close-home-source aria-label="' + t('close') + '">×</button></div><div class="home-source-options">' + (options || '<p class="empty compact">' + escapeHtml(t('homeSourceEmpty')) + '</p>') + '</div></div>';
}
function renderHomeSourceDialog() {
  const dialog = $('#homeSourceDialog');
  if (!dialog) return;
  dialog.innerHTML = homeSourcePickerMarkup();
  dialog.hidden = !state.homeSourceDialogOpen;
}
function openHomeSourceDialog() {
  state.homeSourceDialogOpen = true;
  renderHomeSourceDialog();
}
function closeHomeSourceDialog() {
  const dialog = $('#homeSourceDialog');
  if (dialog) dialog.hidden = true;
  state.homeSourceDialogOpen = false;
}
function renderHomeSourceNav() {
  homeSourceNav.hidden = state.section !== 'home';
  const previousTabs = homeSourceNav.querySelector('.feed-source-tabs');
  const previousScrollLeft = previousTabs?.scrollLeft || 0;
  homeSourceNav.innerHTML = state.section === 'home' ? '<div class="feed-source-panel"><button class="feed-source-scroll-button" data-feed-source-scroll="previous" type="button" hidden aria-label="' + escapeHtml(t('feedTabPrevious')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5.25 8.25 12 15 18.75"/></svg></button><div class="feed-source-tabs" role="tablist" aria-label="RSS 来源">' + homeSourceTabsMarkup() + '</div><button class="feed-source-scroll-button" data-feed-source-scroll="next" type="button" hidden aria-label="' + escapeHtml(t('feedTabNext')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.25 15.75 12 9 18.75"/></svg></button><button class="feed-source-manage" type="button" data-open-home-source-picker aria-label="' + escapeHtml(t('homeSourceManage')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button></div>' : '';
  const nextTabs = homeSourceNav.querySelector('.feed-source-tabs');
  if (nextTabs) {
    nextTabs.scrollLeft = Math.min(previousScrollLeft, Math.max(0, nextTabs.scrollWidth - nextTabs.clientWidth));
    nextTabs.addEventListener('scroll', updateHomeFeedOverflowControls, { passive: true });
    requestAnimationFrame(updateHomeFeedOverflowControls);
  }
}
function renderHome() {
  const isFootprint = state.homeFeed.active === 'footprint';
  const sourceItems = isFootprint ? recentFeedItems() : (state.homeFeed.sources[state.homeFeed.active]?.items || []);
  const cutoff = Date.now() - RSS_RETENTION_MS;
  // Also clean the already-rendered cache. A previous build could have saved
  // a street-level local item, so waiting for another network refresh would
  // otherwise keep showing both the old and the city-level entry.
  const allItems = sourceItems.filter((item) => !isStaleGeneratedLocalFeedItem(item)).filter((item) => { const timestamp = feedItemTimestamp(item); return !Number.isFinite(timestamp) || timestamp >= cutoff; });
  const pendingIds = homeFeedPendingIds(state.homeFeed.active);
  const newIds = homeFeedNewIds(state.homeFeed.active);
  const newCount = isFootprint ? 0 : homeFeedPendingCount(state.homeFeed.active, allItems);
  const items = isFootprint ? allItems : allItems.filter((item) => !pendingIds.has(item.id));
  if (!isFootprint) items.sort((a, b) => {
    const newOrder = Number(newIds.has(b.id)) - Number(newIds.has(a.id));
    return newOrder || ((feedItemTimestamp(b) || 0) - (feedItemTimestamp(a) || 0));
  });
  const featuredJiemianFlash = !isFootprint && state.homeFeed.active === 'jiemian'
    ? [...allItems].sort((a, b) => (feedItemTimestamp(b) || 0) - (feedItemTimestamp(a) || 0))[0] || null
    : null;
  const listItems = featuredJiemianFlash ? items.filter((item) => item.id !== featuredJiemianFlash.id) : items;
  const renderLimit = isFootprint || homeFeedExpanded.has(state.homeFeed.active) ? RSS_MAX_ITEMS_PER_SOURCE : HOME_FEED_RENDER_LIMIT;
  const visibleItems = listItems.slice(0, renderLimit);
  const hasMoreItems = !isFootprint && listItems.length > visibleItems.length;
  const hasItems = visibleItems.length > 0;
  let separatorShown = false;
  const feedList = visibleItems.map((item, index) => {
    const isNew = !isFootprint && newIds.has(item.id);
    const previousIsNew = index > 0 && newIds.has(visibleItems[index - 1].id);
    const separator = !isFootprint && !separatorShown && previousIsNew && !isNew ? '<div class="feed-new-divider" role="separator"><span>' + (state.language === 'en' ? 'Previous items' : '之前内容') + '</span></div>' : '';
    if (separator) separatorShown = true;
    return separator + renderFeedItem(item);
  }).join('');
  const feedBody = state.homeFeed.loading && !hasItems && !isFootprint ? '<div class="feed-loading"><span></span><span></span><span></span></div>' : hasItems ? '<div class="feed-list">' + feedList + '</div>' : '<p class="empty feed-empty">' + (isFootprint ? (state.language === 'en' ? 'No articles read yet.' : '还没有阅读过首页消息。') : t('feedEmpty')) + '</p>';
  const refreshState = state.homeFeed.loading ? '<div class="feed-refresh-state" role="status" aria-label="' + escapeHtml(t('feedLoading')) + '"><span></span></div>' : '';
  const newContentAction = !state.homeFeed.loading && !homeFeedSourceRequesting() && newCount ? '<div class="feed-new-content-action-wrap"><button class="feed-new-content-action" type="button" data-feed-only-new>' + escapeHtml(homeFeedNewActionLabel(newCount)) + '</button></div>' : '';
  const loadMoreAction = hasMoreItems ? '<div class="feed-load-more-wrap"><button class="feed-load-more" type="button" data-feed-load-more>' + escapeHtml(t('feedLoadMore')) + '</button></div>' : '';
  return '<div class="home-page feed-home">' + (featuredJiemianFlash ? renderJiemianFlash(featuredJiemianFlash) : '') + '<section class="feed-panel">' + refreshState + newContentAction + feedBody + loadMoreAction + '<p class="feed-hint">' + t('feedProxyHint') + (state.homeFeed.updatedAt ? ' · ' + t('feedLastRefresh') + ' ' + escapeHtml(feedDate(state.homeFeed.updatedAt)) : '') + '</p></section></div>';
}
function navigationIconMarkup(site, extraClass = '') {
  const generatedSources = navigationIconSources(site?.url);
  // A service URL can be the only reliable source for a site. It is still a
  // valid cached result and must be preferred on the next render/reload.
  const preferredIcon = navigationIconForSite(site?.icon, site?.url);
  const preferGenerated = navigationUsesDesktopBrandIcon(site?.url) || navigationUsesOneBoxBrandIcon(site?.url);
  const sources = preferGenerated
    ? [...new Set([...generatedSources, preferredIcon].filter(Boolean))]
    : [...new Set([preferredIcon, ...generatedSources].filter(Boolean))];
  const icon = sources.shift() || '';
  const fallbackAttribute = sources.length ? ' data-fallback-sources="' + escapeHtml(sources.join('|')) + '"' : '';
  const siteUrlAttribute = navigationSafeUrl(site?.url) ? ' data-navigation-url="' + escapeHtml(site.url) + '"' : '';
  return '<span class="navigation-site-icon ' + extraClass + '"><img src="' + escapeHtml(icon) + '" alt="" loading="eager" decoding="async" referrerpolicy="no-referrer"' + siteUrlAttribute + fallbackAttribute + ' onload="handleNavigationIconLoad(this)" onerror="handleNavigationIconError(this)"><span class="navigation-icon-fallback" hidden aria-hidden="true"><span class="navigation-fallback-glyph"><i></i><i></i><i></i><i></i></span></span></span>';
}
function advanceNavigationIcon(image, allowLowResolution = false) {
  if (!image?.dataset?.fallbackSources) return false;
  if (allowLowResolution && Number(image.naturalWidth || 0) >= 64) return false;
  const sources = image.dataset.fallbackSources.split('|').filter(Boolean);
  const next = sources.shift();
  image.dataset.fallbackSources = sources.join('|');
  if (!next) return false;
  image.src = next;
  return true;
}
function showNavigationIconFallback(image) {
  if (!image) return;
  image.hidden = true;
  image.nextElementSibling?.removeAttribute('hidden');
}
function rememberNavigationIcon(image, source = '') {
  const url = navigationSafeUrl(image?.dataset?.navigationUrl);
  const icon = navigationSafeUrl(source || image?.currentSrc || image?.src);
  if (!url || !icon) return;
  navigationRememberCachedIcon(url, icon);
  const site = navigationEverySite().find((item) => item.url === url);
  if (!site || site.icon === icon) return;
  site.icon = icon;
  saveNavigation();
}
function handleNavigationIconLoad(image) {
  if (!image) return;
  const width = Number(image.naturalWidth || 0);
  if (width >= 64) {
    rememberNavigationIcon(image);
    return;
  }
  if (advanceNavigationIcon(image, true)) return;
  // A 16/32px favicon is still a valid result. The old code hid it after the
  // high-resolution candidates were exhausted, which made successful QQ Mail
  // and other subdomain-specific favicons look like a fetch failure.
  if (width > 0) {
    rememberNavigationIcon(image);
    image.hidden = false;
    image.nextElementSibling?.setAttribute('hidden', '');
    return;
  }
  showNavigationIconFallback(image);
}
function handleNavigationIconError(image) {
  if (advanceNavigationIcon(image)) return;
  showNavigationIconFallback(image);
}
function navigationItemMarkup(item, index = 0, folderId = '') {
  const folderAttribute = folderId ? ' data-navigation-folder-id="' + escapeHtml(folderId) + '"' : '';
  const indexAttribute = ' data-navigation-index="' + index + '"';
  const deleteButton = '<button class="navigation-delete-action" type="button" data-navigation-delete="' + escapeHtml(item.id) + '" aria-label="' + escapeHtml(t('navigationRemove') + ' ' + item.name) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg></button>';
  const editButton = item.type === 'site' ? '<button class="navigation-edit-action" type="button" data-navigation-edit="' + escapeHtml(item.id) + '" aria-label="' + escapeHtml(t('navigationEdit') + ' ' + item.name) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 16.5-.7 3.2 3.2-.7L18.8 7.7a2.2 2.2 0 0 0-3.1-3.1L5 16.5Z"/><path d="m14.5 6.5 3 3"/></svg></button>' : '';
  const openButton = '<button class="navigation-open-action" type="button" data-navigation-open-action aria-label="' + escapeHtml(t('navigationOpen') + ' ' + item.name) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></button>';
  const actionButtons = '<span class="navigation-card-actions" role="group" aria-label="' + escapeHtml(t('navigationTitle')) + '"><span class="navigation-primary-actions">' + openButton + '</span><span class="navigation-secondary-actions">' + editButton + deleteButton + '</span></span>';
  if (item.type === 'folder') {
    const preview = item.children.slice(0, 4).map((site) => navigationIconMarkup(site, 'navigation-folder-site-icon')).join('') || '<span class="navigation-folder-empty-icon">＋</span>';
    return '<article class="navigation-card navigation-folder-card" data-navigation-item data-navigation-type="folder" data-navigation-id="' + escapeHtml(item.id) + '"' + indexAttribute + '>' + actionButtons + '<button class="navigation-card-main" type="button" data-navigation-open-folder="' + escapeHtml(item.id) + '" aria-label="' + escapeHtml(item.name) + '"><span class="navigation-folder-preview">' + preview + '</span><strong>' + escapeHtml(item.name) + '</strong></button></article>';
  }
  const target = state.openMode === 'new-tab' ? ' target="_blank" rel="noreferrer"' : '';
  return '<article class="navigation-card navigation-site-card" data-navigation-item data-navigation-type="site" data-navigation-id="' + escapeHtml(item.id) + '"' + folderAttribute + indexAttribute + '>' + actionButtons + '<a class="navigation-card-main" data-navigation-open-site draggable="false" href="' + escapeHtml(item.url) + '"' + target + ' aria-label="' + escapeHtml(t('navigationOpen') + ' ' + item.name) + '">' + navigationIconMarkup(item) + '<strong>' + escapeHtml(item.name) + '</strong></a></article>';
}
function navigationFindFolder(id) { return state.navigation.items.find((item) => item.type === 'folder' && item.id === id) || null; }
function navigationFindRootItem(id) { return state.navigation.items.find((item) => item.id === id) || null; }
function navigationFindSite(id, folderId = '') {
  if (folderId) return navigationFindFolder(folderId)?.children.find((site) => site.id === id) || null;
  return state.navigation.items.find((item) => item.type === 'site' && item.id === id) || null;
}
function navigationEverySite() {
  return state.navigation.items.flatMap((item) => item.type === 'folder' ? item.children : [item]).filter((item) => item.type === 'site');
}
function saveNavigation() { saveStored(STORAGE.navigation, state.navigation); }
function openNavigationSite(link) {
  const url = safeExternalUrl(link?.getAttribute('href'));
  if (!url) return false;
  if (link?.target === '_blank') {
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      // Safari can return null for a successful tab open when opener access is
      // disabled. Keep a native-anchor fallback for browsers that reject the
      // scripted call, while still executing it inside the user's click.
      const fallback = document.createElement('a');
      fallback.href = url;
      fallback.target = '_blank';
      fallback.rel = 'noreferrer';
      fallback.hidden = true;
      document.body.appendChild(fallback);
      fallback.click();
      fallback.remove();
    }
    return true;
  }
  window.location.assign(url);
  return true;
}
function clearNavigationActionCards(except = null) {
  $$('#workspace[data-tool="navigation"] .navigation-card.navigation-actions-visible').forEach((card) => {
    if (card !== except) card.classList.remove('navigation-actions-visible');
  });
}
function navigationSettingsMarkup() {
  if (!state.navigationSettingsOpen) return '';
  const current = state.openMode === 'new-tab' ? 'new-tab' : 'current';
  const option = (value, label, icon) => '<button type="button" class="navigation-settings-option ' + (current === value ? 'is-selected' : '') + '" data-navigation-open-mode="' + value + '" aria-pressed="' + String(current === value) + '"><span class="navigation-settings-option-icon">' + icon + '</span><span>' + escapeHtml(label) + '</span><span class="navigation-settings-check" aria-hidden="true">' + (current === value ? '✓' : '') + '</span></button>';
  return '<div class="navigation-settings-popover" role="dialog" aria-label="' + escapeHtml(t('navigationSettings')) + '"><div class="navigation-settings-label">' + escapeHtml(t('navigationOpenModeHint')) + '</div><div class="navigation-settings-options">' + option('current', t('navigationOpenModeCurrent'), '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>') + option('new-tab', t('navigationOpenModeNewTab'), '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h13v13M20 4 10 14"/><path d="M17 20H4V7"/></svg>') + '</div></div>';
}
function syncNavigationSettingsPopover(button = $('#workspace[data-tool="navigation"] [data-open-navigation-settings]')) {
  if (!button) return;
  button.setAttribute('aria-expanded', String(state.navigationSettingsOpen));
  const tools = button.closest('.navigation-page-tools');
  if (!tools) return;
  tools.querySelector('.navigation-settings-popover')?.remove();
  if (state.navigationSettingsOpen) button.insertAdjacentHTML('afterend', navigationSettingsMarkup());
}
function renderNavigation() {
  const items = state.navigation.items || [];
  const emptyBody = '<button class="navigation-card navigation-empty-add-card" type="button" data-open-navigation-add aria-label="' + escapeHtml(t('navigationAdd')) + '"><span class="navigation-add-glyph">＋</span><strong>' + escapeHtml(t('navigationAdd')) + '</strong><small>' + escapeHtml(t('navigationEmpty')) + '</small></button>';
  const body = items.length ? items.map((item, index) => navigationItemMarkup(item, index)).join('') + '<button class="navigation-card navigation-add-card" type="button" data-open-navigation-add aria-label="' + escapeHtml(t('navigationAdd')) + '"><span class="navigation-add-glyph">＋</span><strong>' + escapeHtml(t('navigationAdd')) + '</strong></button>' : emptyBody;
  const settingsButtonMarkup = '<button class="icon-btn header-icon navigation-settings-button" type="button" data-open-navigation-settings aria-expanded="' + String(state.navigationSettingsOpen) + '" aria-label="' + escapeHtml(t('navigationSettings')) + '"><svg class="header-line-icon settings-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h10M18 17h2"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="17" r="2"/></svg></button>';
  const toolbarCopy = '<div class="navigation-toolbar-copy"><strong class="navigation-toolbar-title">' + escapeHtml(t('navigationSettings')) + '</strong><span class="navigation-toolbar-caption">' + escapeHtml(t('navigationToolbarHint')) + '</span></div>';
  return '<div class="section-page navigation-page"><div class="navigation-page-toolbar">' + toolbarCopy + '<div class="navigation-page-tools">' + settingsButtonMarkup + navigationSettingsMarkup() + '</div></div><div class="navigation-grid">' + body + '</div></div>';
}
function renderNavigationAddDialog(folderId = '', site = null) {
  const dialog = $('#navigationDialog'); if (!dialog) return;
  const folder = folderId ? navigationFindFolder(folderId) : null;
  const editing = Boolean(site);
  const title = editing ? t('navigationEdit') : folder ? t('navigationAddToFolder') : t('navigationAdd');
  const url = site?.url || '';
  const name = site?.name || '';
  const preview = url ? navigationIconMarkup({ name, url, icon: site?.icon || navigationIconUrl(url) }, 'navigation-preview-icon') + '<span>' + escapeHtml(t('navigationIconHint')) + '</span>' : '<span class="navigation-preview-placeholder">' + escapeHtml(t('navigationIconHint')) + '</span>';
  const subtitle = folder && !editing ? '<p class="navigation-dialog-subtitle">' + escapeHtml(folder.name) + '</p>' : '';
  const action = editing ? t('navigationEditSave') : t('navigationSave');
  dialog.innerHTML = '<div class="dialog-card navigation-dialog-card" role="dialog" aria-modal="true"><div class="dialog-head"><div><h2>' + escapeHtml(title) + '</h2>' + subtitle + '</div><button class="icon-btn small" type="button" data-close-navigation-dialog aria-label="' + t('close') + '">×</button></div><form id="navigationSiteForm" class="navigation-form" data-navigation-mode="' + (editing ? 'edit' : 'add') + '" data-navigation-site-id="' + escapeHtml(site?.id || '') + '" data-navigation-folder-id="' + escapeHtml(folderId || '') + '"><div class="field navigation-url-field"><label for="navigationUrl">' + escapeHtml(t('navigationUrl')) + '</label><input id="navigationUrl" name="url" type="url" required inputmode="url" autocomplete="url" value="' + escapeHtml(url) + '" placeholder="' + escapeHtml(t('navigationUrlPlaceholder')) + '" autofocus></div><div class="field"><label for="navigationName">' + escapeHtml(t('navigationName')) + '</label><input id="navigationName" name="name" maxlength="40" value="' + escapeHtml(name) + '" placeholder="' + escapeHtml(t('navigationNamePlaceholder')) + '"></div><div class="navigation-icon-preview" data-navigation-icon-preview>' + preview + '</div><button class="primary full-width" type="submit">' + escapeHtml(action) + '</button></form></div>';
  dialog.hidden = false;
}
function renderNavigationFolderDialog(folderId = '') {
  const dialog = $('#navigationDialog'); const folder = navigationFindFolder(folderId); if (!dialog || !folder) return;
  const children = folder.children.length ? folder.children.map((site, index) => navigationItemMarkup(site, index, folder.id)).join('') : '<p class="empty compact">' + escapeHtml(t('navigationFolderEmpty')) + '</p>';
  const trashIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5M14 11v5"/></svg>';
  dialog.innerHTML = '<div class="dialog-card navigation-dialog-card navigation-folder-dialog-card" role="dialog" aria-modal="true"><div class="navigation-folder-dialog-toolbar"><span class="navigation-folder-dialog-context">' + escapeHtml(t('navigationFolder')) + '</span><button class="icon-btn small navigation-folder-close-button" type="button" data-close-navigation-dialog aria-label="' + t('close') + '">×</button></div><form id="navigationFolderForm" class="navigation-folder-form"><div class="field navigation-folder-name-field"><label for="navigationFolderName">' + escapeHtml(t('navigationFolderName')) + '</label><input id="navigationFolderName" name="name" maxlength="30" value="' + escapeHtml(folder.name) + '" required></div><div class="navigation-folder-sites">' + children + '</div><div class="navigation-folder-actions"><button class="primary" type="submit">' + escapeHtml(t('navigationSaveFolder')) + '</button><button class="secondary" type="button" data-navigation-add-in-folder>' + escapeHtml(t('navigationFolderAdd')) + '</button><button class="secondary navigation-danger-button" type="button" data-navigation-delete-folder>' + trashIcon + '<span>' + escapeHtml(t('navigationFolderDelete')) + '</span></button></div></form></div>';
  dialog.hidden = false;
}
function renderNavigationCreateFolderDialog() {
  const dialog = $('#navigationDialog'); const draft = state.navigationFolderDraft; if (!dialog || !draft) return;
  const first = navigationFindRootItem(draft.firstId); const second = navigationFindRootItem(draft.secondId); if (!first || !second || first.type !== 'site' || second.type !== 'site') return closeNavigationDialog();
  dialog.innerHTML = '<div class="dialog-card navigation-dialog-card" role="dialog" aria-modal="true"><div class="dialog-head"><div><h2 class="navigation-create-folder-title"><span>' + escapeHtml(t('navigationCreateFolder')) + '</span><small>' + escapeHtml(t('navigationDropHint')) + '</small></h2></div><button class="icon-btn small" type="button" data-close-navigation-dialog aria-label="' + t('close') + '">×</button></div><form id="navigationCreateFolderForm" class="navigation-folder-form"><div class="field"><label for="navigationFolderName">' + escapeHtml(t('navigationFolderName')) + '</label><input id="navigationFolderName" name="name" maxlength="30" placeholder="' + escapeHtml(t('navigationFolderPlaceholder')) + '" autofocus></div><div class="navigation-folder-draft"><span>' + navigationIconMarkup(first) + '<strong>' + escapeHtml(first.name) + '</strong></span><span>' + navigationIconMarkup(second) + '<strong>' + escapeHtml(second.name) + '</strong></span></div><button class="primary full-width" type="submit">' + escapeHtml(t('navigationCreateFolder')) + '</button></form></div>';
  dialog.hidden = false;
}
function renderNavigationDialog() {
  const dialog = $('#navigationDialog'); if (!dialog) return;
  if (!state.navigationDialog) { dialog.hidden = true; return; }
  if (state.navigationDialog.kind === 'folder') renderNavigationFolderDialog(state.navigationDialog.folderId);
  else if (state.navigationDialog.kind === 'create-folder') renderNavigationCreateFolderDialog();
  else if (state.navigationDialog.kind === 'actions') renderNavigationActionsDialog(state.navigationDialog.siteId, state.navigationDialog.folderId || '');
  else if (state.navigationDialog.kind === 'edit') renderNavigationAddDialog(state.navigationDialog.folderId || '', navigationFindSite(state.navigationDialog.siteId, state.navigationDialog.folderId || ''));
  else renderNavigationAddDialog(state.navigationDialog.folderId || '');
}
function openNavigationAddDialog(folderId = '') { state.navigationDialog = { kind: 'add', folderId }; renderNavigationDialog(); }
function openNavigationEditDialog(siteId, folderId = '') {
  const site = navigationFindSite(siteId, folderId);
  if (!site) return;
  state.navigationDialog = { kind: 'edit', folderId, siteId };
  renderNavigationDialog();
}
function openNavigationFolderDialog(folderId) { state.navigationDialog = { kind: 'folder', folderId }; renderNavigationDialog(); }
function openNavigationCreateFolderDialog(firstId, secondId) { state.navigationFolderDraft = { firstId, secondId }; state.navigationDialog = { kind: 'create-folder' }; renderNavigationDialog(); }
function renderNavigationActionsDialog(siteId, folderId = '') {
  const dialog = $('#navigationDialog');
  const item = folderId ? navigationFindSite(siteId, folderId) : navigationFindRootItem(siteId);
  if (!dialog || !item) return closeNavigationDialog();
  const isFolder = item.type === 'folder';
  const icon = isFolder ? '<span class="navigation-action-folder-icon"><span></span><span></span><span></span><span></span></span>' : navigationIconMarkup(item, 'navigation-action-icon');
  const title = isFolder ? item.name : item.name;
  const subtitle = isFolder ? t('navigationFolder') : navigationNameFromUrl(item.url);
  const editLabel = isFolder ? t('navigationFolderEdit') : t('navigationActionEdit');
  const deleteLabel = isFolder ? t('navigationFolderDelete') : t('navigationActionDelete');
  dialog.innerHTML = '<div class="dialog-card navigation-actions-dialog" role="dialog" aria-modal="true"><div class="navigation-action-summary">' + icon + '<div><strong>' + escapeHtml(title) + '</strong><small>' + escapeHtml(subtitle) + '</small></div></div><div class="navigation-action-list"><button type="button" data-navigation-action="edit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 16.5-.7 3.2 3.2-.7L18.8 7.7a2.2 2.2 0 0 0-3.1-3.1L5 16.5Z"/><path d="m14.5 6.5 3 3"/></svg><span>' + escapeHtml(editLabel) + '</span></button><button type="button" class="danger" data-navigation-action="delete"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5M14 11v5"/></svg><span>' + escapeHtml(deleteLabel) + '</span></button><button type="button" class="cancel" data-navigation-action="cancel">' + escapeHtml(t('navigationActionCancel')) + '</button></div></div>';
  dialog.hidden = false;
}
function openNavigationActionsDialog(siteId, folderId = '') {
  state.navigationDialog = { kind: 'actions', siteId, folderId };
  renderNavigationDialog();
}
function closeNavigationDialog() { state.navigationDialog = null; state.navigationFolderDraft = null; navigationSuppressClickUntil = 0; const dialog = $('#navigationDialog'); if (dialog) dialog.hidden = true; }
function addNavigationSite(urlValue, nameValue, folderId = '') {
  const url = navigationSafeUrl(urlValue);
  if (!url) return toast(t('navigationInvalidUrl'), 'error');
  if (navigationEverySite().some((site) => site.url === url)) return toast(t('navigationAlreadyExists'), 'error');
  const site = { id: 'site-' + uid(), type: 'site', name: String(nameValue || '').trim() || navigationNameFromUrl(url), url, icon: navigationIconUrl(url), createdAt: Date.now() };
  if (folderId) {
    const folder = navigationFindFolder(folderId); if (!folder) return toast(t('navigationInvalidUrl'), 'error');
    folder.children.push(site);
  } else state.navigation.items.push(site);
  saveNavigation(); closeNavigationDialog(); render(); toast(t('navigationAdded'));
}
function editNavigationSite(siteId, folderId, urlValue, nameValue) {
  const site = navigationFindSite(siteId, folderId);
  const url = navigationSafeUrl(urlValue);
  if (!site || !url) return toast(t('navigationInvalidUrl'), 'error');
  if (navigationEverySite().some((candidate) => candidate.id !== siteId && candidate.url === url)) return toast(t('navigationAlreadyExists'), 'error');
  const previousUrl = site.url;
  site.url = url;
  site.name = String(nameValue || '').trim() || navigationNameFromUrl(url);
  site.icon = previousUrl === url ? (navigationSafeUrl(site.icon) || navigationIconUrl(url)) : navigationIconUrl(url);
  saveNavigation(); closeNavigationDialog(); render(); toast(t('navigationEditSave'));
}
function deleteNavigationSite(siteId, folderId = '') {
  if (folderId) {
    const folder = navigationFindFolder(folderId); if (folder) folder.children = folder.children.filter((site) => site.id !== siteId);
  } else state.navigation.items = state.navigation.items.filter((item) => item.id !== siteId);
  saveNavigation(); closeNavigationDialog(); render(); toast(t('navigationDeleted'));
}
function deleteNavigationFolder(folderId) {
  const folderIndex = state.navigation.items.findIndex((item) => item.id === folderId && item.type === 'folder'); const folder = folderIndex >= 0 ? state.navigation.items[folderIndex] : null; if (!folder) return;
  if (!window.confirm(t('navigationFolderDeleteConfirm'))) return;
  state.navigation.items.splice(folderIndex, 1, ...folder.children);
  saveNavigation(); closeNavigationDialog(); render(); toast(t('navigationFolderDissolved'));
}
function moveNavigationSiteToFolder(siteId, folderId) {
  const siteIndex = state.navigation.items.findIndex((item) => item.id === siteId && item.type === 'site');
  const folder = navigationFindFolder(folderId); if (siteIndex < 0 || !folder) return;
  const [site] = state.navigation.items.splice(siteIndex, 1); folder.children.push(site);
  saveNavigation(); render(); toast(t('navigationMoved'));
}
function swapNavigationRootItems(firstId, secondId) {
  const first = state.navigation.items.findIndex((item) => item.id === firstId); const second = state.navigation.items.findIndex((item) => item.id === secondId);
  if (first < 0 || second < 0 || first === second) return;
  [state.navigation.items[first], state.navigation.items[second]] = [state.navigation.items[second], state.navigation.items[first]];
  saveNavigation(); render(); toast(t('navigationOrderSaved'));
}
function createNavigationFolder(nameValue, firstId, secondId) {
  const firstIndex = state.navigation.items.findIndex((item) => item.id === firstId && item.type === 'site'); const secondIndex = state.navigation.items.findIndex((item) => item.id === secondId && item.type === 'site');
  if (firstIndex < 0 || secondIndex < 0 || firstIndex === secondIndex) return closeNavigationDialog();
  const first = state.navigation.items[firstIndex]; const second = state.navigation.items[secondIndex]; const insertAt = Math.min(firstIndex, secondIndex);
  state.navigation.items = state.navigation.items.filter((item) => item.id !== firstId && item.id !== secondId);
  state.navigation.items.splice(insertAt, 0, { id: 'folder-' + uid(), type: 'folder', name: String(nameValue || '').trim() || t('navigationFolder'), children: [first, second], createdAt: Date.now() });
  saveNavigation(); closeNavigationDialog(); render(); toast(t('navigationFolderCreated'));
}
function notificationRowMarkup(item) {
  return '<div class="swipe-row notification-swipe-row" data-swipe-row><div class="notification-item swipe-content ' + (item.read ? '' : 'unread') + '"><div><strong>' + escapeHtml(item.text) + '</strong><small>' + new Intl.DateTimeFormat(state.language === 'en' ? 'en-US' : 'zh-CN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.at)) + '</small></div></div><button class="swipe-delete" data-delete-notification="' + escapeHtml(item.id) + '" aria-label="' + t('close') + '">' + (state.language === 'en' ? 'Delete' : '删除') + '</button></div>';
}
function notificationItemsMarkup() {
  const items = [...state.notifications].sort((a, b) => Number(b.at) - Number(a.at));
  if (!items.length) return '<p class="empty compact">' + t('noMessages') + '</p>';
  return items.map(notificationRowMarkup).join('');
}
function renderMessages() {
  return '<div class="section-page message-page"><div class="message-panel"><div class="message-panel-head"><button class="secondary compact-action" data-mark-notifications-read>' + t('markRead') + '</button></div><div class="notification-list">' + notificationItemsMarkup() + '</div></div></div>';
}

function renderMine() {
  const githubStatus = state.github.user ? (state.github.user.login || 'GitHub') : t('githubNotConnected');
  const icon = (name) => ({
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h10M18 17h2"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="17" r="2"/></svg>',
    github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18h10a3.5 3.5 0 0 0 .5-6.96A5.5 5.5 0 0 0 7 9.5a4.25 4.25 0 0 0 0 8.5Z"/><path d="m12 12 2-2m-2 2-2-2m2 2v4"/></svg>',
    reading: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h8l3 3v5M14 4v4h4M9 12h3M9 16h3"/><circle cx="16.5" cy="16.5" r="3.5"/><path d="M16.5 14.8v1.9l1.2.7"/></svg>',
    agreement: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h8l4 4v13H6z"/><path d="M14 3.5v4h4M9 12h6M9 15h3M14 16.5l1.5 1.5 2.5-3"/></svg>',
    pet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 1.5-4L12 7l4.5-2L18 9v5.2c0 3.4-2.7 5.8-6 5.8s-6-2.4-6-5.8Z"/><circle cx="9.2" cy="12.2" r=".8"/><circle cx="14.8" cy="12.2" r=".8"/><path d="M9.5 15.2c1.5 1.2 3.5 1.2 5 0"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h9a2 2 0 0 1 2 2v9"/><rect x="5" y="8" width="12" height="11" rx="2"/><path d="M8 12h4"/></svg>',
  })[name];
  const row = (action, glyph, title, description) => '<button class="mine-row" ' + action + '><span class="mine-row-icon">' + icon(glyph) + '</span><span class="mine-row-copy"><strong>' + title + '</strong><small class="mine-row-description">' + description + '</small></span><span>›</span></button>';
  const updateBusy = state.updateChecking || state.updateApplying;
  const updateStatus = state.updateApplying ? t('updateApplying') : state.updateChecking ? t('updating') : state.updateAvailable ? t('updateAvailable') : state.updateError ? t('updateCheckFailed') : t('upToDate');
  const updateProgress = updateBusy ? '<span class="update-progress" role="status" aria-label="' + escapeHtml(updateStatus) + '"><span class="update-progress-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></span>' : '<span class="update-status-label">' + escapeHtml(updateStatus) + '</span>';
  const updateButton = state.updateAvailable ? '<button class="primary mine-update-button" data-apply-update ' + (state.updateApplying ? 'disabled' : '') + '>' + (state.updateApplying ? t('updateApplying') : t('applyUpdate')) + '</button>' : '<button class="primary mine-update-button" data-check-update ' + (state.updateChecking || state.updateApplying ? 'disabled' : '') + '>' + t('checkUpdate') + '</button>';
  const updateRow = '<div class="mine-row mine-update-row"><span class="mine-row-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10M8 10l4 4 4-4M5 19h14"/></svg></span><span class="mine-row-copy mine-update-copy"><strong>' + t('appUpdate') + '</strong><small class="mine-row-description">v' + APP_VERSION + (updateBusy ? ' ' : ' · ') + updateProgress + '</small></span><span class="mine-row-action">' + updateButton + '</span></div>';
  return '<div class="section-page mine-page"><div class="mine-list">' + row('data-open-settings-page', 'settings', t('settings'), state.language === 'en' ? 'Theme, language, color and display' : '主题、语言、颜色与显示设置') + row('data-open-pet-page', 'pet', t('mascot'), t('petDescription')) + row('data-open-ticket-wallet', 'wallet', t('ticketWallet'), t('ticketWalletDescription')) + row('data-open-github-page', 'github', t('accountLogin'), escapeHtml(githubStatus)) + updateRow + row('data-open-agreement-page', 'agreement', t('userAgreement'), state.language === 'en' ? 'Learn how OneBox handles data' : '了解 OneBox 如何处理数据') + '</div></div>';
}

function openTicketWallet() {
  state.section = 'mine'; state.ticketWalletOpen = true; state.ticketWalletTypeFilter = normalizeTicketWalletFilter(state.ticketWalletTypeFilter); state.ticketWalletSelectedId = ''; state.ticketWalletEditorOpen = false; state.ticketWalletMemoryDraft = null;
  history.replaceState(null, '', '#ticket-wallet'); window.scrollTo(0, 0); renderNav(); renderBottomNav(); render(); window.scrollTo(0, 0); scheduleTicketWalletFilterFocus(false); void hydrateTicketWalletImages();
}
function closeTicketWallet() {
  ticketWalletMapReturnContext = null;
  state.ticketWalletOpen = false; state.ticketWalletSelectedId = ''; state.ticketWalletEditorOpen = false; state.ticketWalletMemoryDraft = null;
  ticketWalletMapFocusId = '';
  closeTicketWalletOriginal();
  history.replaceState(null, '', '#mine'); renderNav(); renderBottomNav(); render();
}
function ticketWalletDefaultTemplate(type) { return type === 'train' ? 'crh-blue-v1' : 'standard-v1'; }
function openTicketWalletEditor(id = '') {
  if (id) {
    state.ticketWalletSelectedId = id;
    state.ticketWalletEditorOpen = false;
    state.ticketWalletMemoryDraft = null;
    render();
    return;
  }
  const type = ticketWalletDefaultTypeForFilter(state.ticketWalletTypeFilter);
  state.ticketWalletEditingId = '';
  state.ticketWalletDraft = normalizeTicketRecord({ type, title: ticketTypeLabel(type), template: ticketWalletDefaultTemplate(type), diningKind: type === 'dining' ? 'drink' : 'other', departAt: '', journey: '' });
  state.ticketWalletEditorStage = 'choose';
  state.ticketWalletRecognition = { status: 'idle', progress: 0, message: '' };
  state.ticketWalletEditorOpen = true; state.ticketWalletSelectedId = ''; state.ticketWalletMemoryDraft = null; render();
}
function closeTicketWalletEditor() { state.ticketWalletEditorOpen = false; state.ticketWalletEditingId = ''; state.ticketWalletDraft = null; state.ticketWalletEditorStage = 'choose'; state.ticketWalletRecognition = { status: 'idle', progress: 0, message: '' }; render(); }
function ticketWalletInlineFieldValue(record, field) {
  if (field === 'passengerName') return record.passengerName || ticketWalletPassengerParts(record.passenger).passengerName || '';
  if (field === 'passengerId') return record.passengerId || ticketWalletPassengerParts(record.passenger).passengerId || '';
  if (field === 'fromLatin') return record.fromLatin || ticketWalletTrainStationLatin(record.from) || '';
  if (field === 'toLatin') return record.toLatin || ticketWalletTrainStationLatin(record.to) || '';
  if (field === 'departAt') return record.departAt || '';
  if (field === 'cafeRating') return record.cafeRating ? String(record.cafeRating) : '';
  return String(record[field] || '');
}
function ticketWalletInlineFieldLabel(field) {
  const labels = { from: t('ticketWalletFrom'), to: t('ticketWalletTo'), ticketNo: t('ticketWalletTrainNo'), ticketSerial: t('ticketWalletSerial'), departAt: t('ticketWalletDepart'), price: t('ticketWalletPrice'), seat: t('ticketWalletSeat'), seatClass: t('ticketWalletSeatClass'), passengerName: t('ticketWalletPassengerName'), passengerId: t('ticketWalletPassengerId'), fromLatin: state.language === 'en' ? 'Origin pinyin' : '出发地拼音', toLatin: state.language === 'en' ? 'Destination pinyin' : '目的地拼音', ticketCode: t('ticketWalletCode'), carrier: state.language === 'en' ? 'Cafe name' : '店铺名称', cafeDrink: state.language === 'en' ? 'Drink or dish' : '饮品 / 餐点', diningItem: state.language === 'en' ? 'Food or drink' : '餐饮名称', drinkCategory: state.language === 'en' ? 'Drink category' : '饮品类别', drinkTemperature: state.language === 'en' ? 'Temperature' : '温度', drinkSize: state.language === 'en' ? 'Size' : '杯型', drinkSweetness: state.language === 'en' ? 'Sweetness' : '甜度', drinkExtras: state.language === 'en' ? 'Drink extras' : '加料 / 口味备注', drinkServiceMode: state.language === 'en' ? 'Order mode' : '到店方式', cafeLocation: state.language === 'en' ? 'Location' : '地点', cafeMood: state.language === 'en' ? 'Journal sticker' : '手帐贴纸', cafeRating: state.language === 'en' ? 'Rating (0–5)' : '评分（0–5）' };
  return labels[field] || t('ticketWalletEdit');
}
function saveTicketWalletInlineField(id, field, value) {
  const index = state.ticketWallet.findIndex((item) => item.id === id);
  if (index < 0) return;
  const record = { ...state.ticketWallet[index] };
  let nextValue = String(value || '').trim();
  if (field === 'departAt' && nextValue && !/^\d{4}-\d{2}-\d{2}T/.test(nextValue)) nextValue = ticketWalletDateFromText(nextValue, nextValue) || nextValue;
  if (field === 'from' && nextValue !== record.from) record.fromLatin = '';
  if (field === 'to' && nextValue !== record.to) record.toLatin = '';
  record[field] = field === 'cafeRating' ? Math.min(5, Math.max(0, Math.round(Number(nextValue) || 0))) : nextValue;
  if (field === 'passengerName' || field === 'passengerId') record.passenger = [field === 'passengerId' ? nextValue : record.passengerId, field === 'passengerName' ? nextValue : record.passengerName].filter(Boolean).join(' ');
  if (field === 'from' || field === 'to') {
    const routeName = record.from && record.to ? record.from + '至' + record.to : '';
    record.title = routeName || record.title || ticketTypeLabel(record.type);
    record.journey = routeName || record.journey;
  }
  record.updatedAt = Date.now();
  state.ticketWallet[index] = normalizeTicketRecord(record);
  saveTicketWallet();
  render();
  void hydrateTicketWalletImages();
}
function editTicketWalletNotes(id) {
  const index = state.ticketWallet.findIndex((item) => item.id === id);
  if (index < 0) return;
  const current = String(state.ticketWallet[index].notes || '');
  const next = window.prompt(state.language === 'en' ? 'Notes' : '备注', current);
  if (next === null) return;
  state.ticketWallet[index] = normalizeTicketRecord({
    ...state.ticketWallet[index],
    notes: String(next).trim(),
    updatedAt: Date.now(),
  });
  saveTicketWallet();
  render();
  void hydrateTicketWalletImages();
}
function openTicketWalletInlineField(id, field, target) {
  const record = state.ticketWallet.find((item) => item.id === id);
  if (!record || !target) return;
  const shell = target.closest('.ticket-wallet-detail-card-shell');
  if (!shell) {
    state.ticketWalletSelectedId = id;
    render();
    requestAnimationFrame(() => {
      const nextTarget = [...document.querySelectorAll('[data-ticket-wallet-edit-field]')].find((item) => item.dataset.ticketWalletId === id && item.dataset.ticketWalletEditField === field);
      if (nextTarget) openTicketWalletInlineField(id, field, nextTarget);
    });
    return;
  }
  if (target.querySelector('.ticket-wallet-inline-editor')) return;
  document.querySelector('.ticket-wallet-inline-editor')?.blur();
  // Saving another field renders the card again; use its current node.
  target = [...document.querySelectorAll('[data-ticket-wallet-edit-field]')].find((item) => item.dataset.ticketWalletId === id && item.dataset.ticketWalletEditField === field);
  if (!target) return;
  const input = document.createElement('input');
  const label = ticketWalletInlineFieldLabel(field);
  const originalValue = ticketWalletInlineFieldValue(record, field);
  input.className = 'ticket-wallet-inline-editor';
  input.type = 'text';
  input.value = originalValue;
  input.setAttribute('aria-label', label);
  input.placeholder = label;
  const text = target instanceof SVGElement ? (target.matches('text, tspan') ? target : target.querySelector('text')) : target;
  const style = getComputedStyle(text);
  const hiddenNodes = [];
  let editor;
  if (target instanceof SVGElement) {
    const editableText = target.matches('tspan') ? target : (text.querySelector('.station-main-name') || text);
    const fieldText = editableText.matches('tspan') ? editableText.parentElement : editableText;
    const box = editableText.getBBox();
    const fontSize = parseFloat(getComputedStyle(editableText).fontSize) || parseFloat(style.fontSize);
    const height = Math.max(box.height, fontSize * 1.2);
    const width = Math.max(box.width + fontSize * 3, fontSize * 4);
    const centered = fieldText.getAttribute('text-anchor') === 'middle';
    editor = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    editor.setAttribute('x', centered ? box.x - (width - box.width) / 2 : box.x);
    editor.setAttribute('y', box.y - (height - box.height) / 2);
    editor.setAttribute('width', width);
    editor.setAttribute('height', height);
    input.style.fontSize = getComputedStyle(editableText).fontSize;
    input.style.color = getComputedStyle(editableText).fill || style.fill || 'currentColor';
    input.style.caretColor = input.style.color;
    input.style.textAlign = centered ? 'center' : 'left';
    // Hide only the value being edited; the station suffix stays template-sized.
    editableText.style.visibility = 'hidden';
    hiddenNodes.push(editableText);
    editor.append(input);
    (editableText.matches('tspan') ? (target.closest('g') || target.ownerSVGElement) : target).append(editor);
  } else {
    editor = input;
    input.style.fontSize = style.fontSize;
    input.style.color = style.color;
    input.style.textAlign = style.textAlign;
    const width = target.getBoundingClientRect().width;
    [...target.childNodes].forEach((node) => { hiddenNodes.push(node); node.remove(); });
    input.style.width = Math.max(width, 40) + 'px';
    target.append(input);
  }
  input.style.fontFamily = style.fontFamily;
  input.style.fontWeight = style.fontWeight;
  input.style.caretColor = input.style.caretColor || style.color || style.fill || 'currentColor';
  input.style.letterSpacing = style.letterSpacing;
  let finished = false;
  const finish = (save) => {
    if (finished) return;
    finished = true;
    editor.remove();
    if (target instanceof SVGElement) hiddenNodes.forEach((node) => { node.style.visibility = ''; });
    else hiddenNodes.forEach((node) => target.append(node));
    if (save && input.value !== originalValue) saveTicketWalletInlineField(id, field, input.value);
  };
  input.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.isComposing || event.keyCode === 229) return;
    if (event.key === 'Enter') { event.preventDefault(); finish(true); }
    if (event.key === 'Escape') { event.preventDefault(); finish(false); }
  });
  input.addEventListener('blur', () => finish(true));
  input.addEventListener('click', (event) => event.stopPropagation());
  input.addEventListener('pointerdown', (event) => event.stopPropagation());
  input.addEventListener('touchstart', (event) => event.stopPropagation(), { passive: true });
  // Focus during the user gesture so the iOS keyboard opens reliably.
  input.focus();
  try { input.setSelectionRange(input.value.length, input.value.length); } catch {}

}
function ticketWalletValue(selector) { return $(selector)?.value?.trim() || ''; }
async function saveTicketWalletRecord() {
  const draft = state.ticketWalletDraft || {};
  const selectedType = draft.type || ticketWalletDefaultTypeForFilter(state.ticketWalletTypeFilter);
  const selectedTemplate = selectedType === 'train' ? (draft.template === 'crh-blue-v1' ? 'crh-blue-v1' : 'pink-physical-v1') : draft.template;
  let next;
  if (selectedType === 'dining') {
    const field = (name) => workspace.querySelector('[data-ticket-wallet-cafe-field="' + name + '"]')?.value?.trim() || '';
    const cafeDrink = field('cafeDrink');
    const carrier = field('carrier');
    next = normalizeTicketRecord({ ...draft, type: selectedType, template: selectedTemplate, title: cafeDrink || carrier || ticketTypeLabel(selectedType), carrier, cafeDrink, diningItem: cafeDrink, ticketNo: field('ticketNo'), departAt: field('departAt'), price: field('price'), cafeLocation: field('cafeLocation'), cafeRating: Number(field('cafeRating')) || 0, cafeMood: field('cafeMood'), drinkExtras: field('drinkExtras'), drinkServiceMode: draft.drinkServiceMode || '', updatedAt: Date.now() });
  } else {
    const from = ticketWalletValue('#ticketWalletFrom'); const to = ticketWalletValue('#ticketWalletTo'); const routeName = from && to ? from + '至' + to : '';
    const passengerName = selectedType === 'train' ? ticketWalletValue('#ticketWalletPassengerName') : String(draft.passengerName || '');
    const passengerId = selectedType === 'train' ? ticketWalletValue('#ticketWalletPassengerId') : String(draft.passengerId || '');
    next = normalizeTicketRecord({ ...draft, type: selectedType, template: selectedTemplate, title: routeName || ticketWalletValue('#ticketWalletTitle') || draft.title || ticketTypeLabel(selectedType), carrier: ticketWalletValue('#ticketWalletCarrier') || draft.carrier, from, to, departAt: ticketWalletValue('#ticketWalletDepart'), ticketNo: ticketWalletValue('#ticketWalletTicketNo'), ticketSerial: selectedType === 'train' ? ticketWalletValue('#ticketWalletSerial') : draft.ticketSerial, ticketCode: selectedType === 'train' ? ticketWalletValue('#ticketWalletCode') : draft.ticketCode, price: ticketWalletValue('#ticketWalletPrice'), seat: ticketWalletValue('#ticketWalletSeat'), seatClass: selectedType === 'train' ? ticketWalletValue('#ticketWalletSeatClass') : draft.seatClass, passengerName, passengerId, passenger: [passengerId, passengerName].filter(Boolean).join(' ') || draft.passenger, journey: routeName || draft.journey, updatedAt: Date.now() });
  }
  if (TICKET_WALLET_TRAVEL_TYPES.includes(selectedType) && (!next.from || !next.to)) return toast(t('ticketWalletNeedRoute'), 'error');
  const index = state.ticketWallet.findIndex((item) => item.id === state.ticketWalletEditingId);
  if (index >= 0) state.ticketWallet[index] = { ...state.ticketWallet[index], ...next, id: state.ticketWalletEditingId, createdAt: state.ticketWallet[index].createdAt };
  else { state.ticketWallet.push(next); state.ticketWalletTypeFilter = ticketWalletCategoryForType(next.type); saveTicketWalletTypeFilter(); }
  if (next.type === 'dining') { state.ticketWalletDiningKindFilter = next.diningKind; saveTicketWalletDiningKindFilter(); }
  state.ticketWallet = normalizeTicketWallet(state.ticketWallet); saveTicketWallet(); closeTicketWalletEditor(); render(); void hydrateTicketWalletImages(); toast(index >= 0 ? t('ticketWalletSaved') : t('ticketWalletAdded'));
}
async function importTicketWalletImage(file) {
  if (!file) return;
  const id = 'ticket-image-' + uid();
  if (!await ticketWalletImagePut(id, file)) return toast(state.language === 'en' ? 'Could not keep this original file' : '原始票据保存失败，请重试', 'error');
  if (state.ticketWalletMemoryDraft) { state.ticketWalletMemoryDraft.imageId = id; state.ticketWalletMemoryDraft.imageName = file.name || ''; render(); return; }
  if (!state.ticketWalletEditorOpen) openTicketWalletEditor();
  state.ticketWalletEditorStage = 'details';
  state.ticketWalletDraft = { ...(state.ticketWalletDraft || normalizeTicketRecord({})), sourceImageId: id, sourceImageName: file.name || '', sourceMime: file.type || '' };
  state.ticketWalletRecognition = { status: 'running', progress: 0, message: state.language === 'en' ? 'Recognizing ticket…' : '正在识别票据…' };
  render();
  const recognized = await recognizeTicketWalletImage(file);
  const current = state.ticketWalletDraft || {};
  const recognizedPatch = Object.fromEntries(Object.entries(recognized).filter(([key, value]) => value && (key !== 'type' || value !== 'other')));
  state.ticketWalletDraft = { ...current, ...recognizedPatch, type: current.type, sourceImageId: id, sourceImageName: file.name || '', sourceMime: file.type || '' };
  const hasRecognizedDetails = ['from', 'to', 'departAt', 'ticketNo', 'ticketSerial', 'price', 'carrier', 'cafeDrink', 'seat'].some((key) => recognizedPatch[key]);
  state.ticketWalletRecognition = { status: hasRecognizedDetails ? 'done' : 'warning', progress: 100, message: hasRecognizedDetails ? (state.language === 'en' ? 'Recognized. Review the template and save when ready.' : '识别完成，请检查模板内容后保存') : (state.language === 'en' ? 'Some fields need your input.' : '部分信息需要手动补充') };
  render();
  void hydrateTicketWalletImages();
}
async function rerunTicketWalletRecognition() {
  const draft = state.ticketWalletDraft || {};
  if (!draft.sourceImageId) return toast(state.language === 'en' ? 'Import an original ticket first' : '请先导入原始票据', 'error');
  const stored = await oneBoxDbGet('ticket-images', draft.sourceImageId);
  if (!stored?.blob || !/^image\//i.test(stored.type || stored.blob.type || '')) return toast(state.language === 'en' ? 'Original image is unavailable' : '原始票据图片不可用', 'error');
  const file = stored.blob instanceof File ? stored.blob : new File([stored.blob], stored.name || draft.sourceImageName || 'ticket.png', { type: stored.type || stored.blob.type || 'image/png' });
  state.ticketWalletRecognition = { status: 'running', progress: 0, message: state.language === 'en' ? 'Recognizing ticket…' : '正在重新识别票据…' };
  render();
  const recognized = await recognizeTicketWalletImage(file);
  const recognizedPatch = Object.fromEntries(Object.entries(recognized).filter(([key, value]) => value && (key !== 'type' || value !== 'other')));
  state.ticketWalletDraft = { ...(state.ticketWalletDraft || draft), ...recognizedPatch };
  const recognizedKeys = ['ticketSerial', 'ticketNo', 'price', 'passengerName', 'passengerId', 'ticketCode', 'departAt'].filter((key) => recognizedPatch[key]);
  state.ticketWalletRecognition = { status: recognizedKeys.length >= 3 ? 'done' : 'warning', progress: 100, message: recognizedKeys.length >= 3 ? (state.language === 'en' ? 'Recognition updated. Please confirm.' : '识别结果已更新，请逐项确认') : (state.language === 'en' ? 'Some fields still need manual input.' : '部分字段仍需手动补充') };
  render();
}
async function importTicketWalletJson(file) {
  if (!file) return;
  try {
    const value = JSON.parse(await file.text());
    const records = normalizeTicketWallet(Array.isArray(value) ? value : value.tickets || value.ticketWallet || [value]);
    if (!records.length) throw Error('empty');
    const existing = new Set(state.ticketWallet.map((item) => item.id));
    state.ticketWallet.push(...records.map((item) => existing.has(item.id) ? { ...item, id: 'ticket-' + uid() } : item));
    state.ticketWallet = normalizeTicketWallet(state.ticketWallet); saveTicketWallet(); render(); toast(t('ticketWalletAdded'));
  } catch { toast(state.language === 'en' ? 'Ticket data is not valid JSON' : '票据数据不是有效的 JSON', 'error'); }
}
function deleteTicketWalletRecord(id) {
  const record = state.ticketWallet.find((item) => item.id === id);
  if (!record || !window.confirm(t('ticketWalletDeleteConfirm'))) return;
  deleteTicketWalletCalendarEvents(record);
  const deleted = parseStored(STORAGE.ticketWalletDeleted, {}) || {};
  deleted[id] = Date.now(); saveStored(STORAGE.ticketWalletDeleted, deleted);
  state.ticketWallet = state.ticketWallet.filter((item) => item.id !== id); if (state.ticketWalletSelectedId === id) state.ticketWalletSelectedId = ''; saveTicketWallet();
  if (record.sourceImageId && !ticketWalletSyncImageIds().includes(record.sourceImageId)) void ticketWalletImageDelete(record.sourceImageId);
  render(); toast(t('ticketWalletDeleted'));
}
function openTicketWalletMemoryEditor(key) {
  const memory = state.ticketWalletMemories[key] || { key, title: '', description: '', imageId: '', imageName: '' };
  state.ticketWalletMemoryDraft = { ...memory }; state.ticketWalletEditorOpen = false; render();
  requestAnimationFrame(() => $('#ticketWalletMemoryTitle')?.focus());
}
function closeTicketWalletMemoryEditor() { state.ticketWalletMemoryDraft = null; render(); }
function saveTicketWalletMemory() {
  const draft = state.ticketWalletMemoryDraft; if (!draft?.key) return;
  state.ticketWalletMemories[draft.key] = { ...draft, title: ticketWalletValue('#ticketWalletMemoryTitle'), description: ticketWalletValue('#ticketWalletMemoryDescription'), updatedAt: Date.now() };
  saveTicketWalletMemories(); state.ticketWalletMemoryDraft = null; render(); toast(t('ticketWalletMemorySaved'));
}
async function shareTicketWalletJourney(key) {
  const group = ticketWalletJourneys().find((item) => item.key === key); if (!group) return;
  const memory = group.memory; const text = [group.from + ' → ' + group.to, group.records.map((item) => ticketTypeLabel(item.type) + ' · ' + ticketWalletDateLabel(item.departAt)).join('\n'), memory?.description || ''].filter(Boolean).join('\n');
  try { if (navigator.share) await navigator.share({ title: memory?.title || group.from + ' → ' + group.to, text }); else { await navigator.clipboard.writeText(text); toast(state.language === 'en' ? 'Journey copied' : '旅迹已复制'); } } catch { /* share cancelled */ }
}
async function exportTicketWalletPass(id) {
  const record = state.ticketWallet.find((item) => item.id === id); if (!record) return;
  const source = await ticketWalletImageGet(record.sourceImageId);
  if (source?.type === 'application/vnd.apple.pkpass' || /\.pkpass$/i.test(record.sourceImageName || source?.name || '')) {
    const value = await oneBoxDbGet('ticket-images', record.sourceImageId);
    if (value?.blob) { const url = URL.createObjectURL(value.blob); const link = document.createElement('a'); link.href = url; link.download = record.sourceImageName || 'ticket.pkpass'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast(t('ticketWalletAppleDownloaded')); return; }
  }
  toast(t('ticketWalletAppleHint'), 'info');
}
async function openTicketWalletOriginalSource(sourceImageId, title = '') {
  const dialog = $('#ticketWalletOriginalDialog');
  if (!sourceImageId || !dialog) return;
  const source = await ticketWalletImageGet(sourceImageId);
  if (!source?.src) return toast(t('ticketWalletSourceMissing'), 'error');
  const displayTitle = title || t('ticketWalletOriginal');
  dialog.innerHTML = '<div class="dialog-card ticket-wallet-original-dialog-card" role="dialog" aria-modal="true"><div class="ticket-wallet-original-dialog-head"><div><strong>' + escapeHtml(state.language === 'en' ? 'Original ticket' : '原件') + '</strong><small>' + escapeHtml(displayTitle) + '</small></div><button class="icon-btn small" data-close-ticket-wallet-original aria-label="' + escapeHtml(t('close')) + '">×</button></div><div class="ticket-wallet-original-dialog-body"><img class="ticket-wallet-original-dialog-image" src="' + escapeHtml(source.src) + '" alt="' + escapeHtml(displayTitle) + '"></div></div>';
  dialog.hidden = false;
}
async function openTicketWalletOriginal(id) {
  const record = state.ticketWallet.find((item) => item.id === id);
  if (!record?.sourceImageId) return;
  return openTicketWalletOriginalSource(record.sourceImageId, record.title || [record.from, record.to].filter(Boolean).join(' → ') || t('ticketWalletOriginal'));
}
function closeTicketWalletOriginal() { const dialog = $('#ticketWalletOriginalDialog'); if (dialog) dialog.hidden = true; }
function ticketWalletField(label, id, value, type = 'text', extra = '') {
  return '<label class="ticket-wallet-field"><span>' + escapeHtml(label) + '</span><input id="' + id + '" type="' + type + '" value="' + escapeHtml(type === 'datetime-local' ? ticketWalletDateInputValue(value) : value || '') + '" ' + extra + '></label>';
}
function ticketWalletAddTemplateMarkup(draft) {
  if (draft.type === 'dining') {
    const english = state.language === 'en';
    const kind = normalizeTicketWalletDiningKind(draft.diningKind, 'drink');
    const kindMeta = TICKET_WALLET_DINING_KINDS[kind];
    if (kind !== 'drink') {
      const itemName = english ? kindMeta.item[1] : kindMeta.item[0];
      const itemPlaceholder = english ? 'What did you have?' : '记下这次吃的餐点';
      const moods = english ? ['A little treat', 'Slow morning', 'New favorite', 'Try again'] : ['今日特调', '适合放空', '本周最爱', '下次再来'];
      const moodPills = moods.map((mood) => '<button type="button" class="ticket-wallet-cafe-mood-pick' + (draft.cafeMood === mood ? ' active' : '') + '" data-ticket-wallet-cafe-mood-preset="' + escapeHtml(mood) + '">' + escapeHtml(mood) + '</button>').join('');
      const rating = Number(draft.cafeRating) || 0;
      const ratingOptions = ['<option value="0"' + (!rating ? ' selected' : '') + '>' + (english ? 'Not rated' : '暂不评分') + '</option>'].concat([1, 2, 3, 4, 5].map((score) => '<option value="' + score + '"' + (rating === score ? ' selected' : '') + '>' + '★'.repeat(score) + '</option>')).join('');
      const date = draft.departAt ? ticketWalletDateLabel(draft.departAt) : (english ? 'Date / time' : '日期 / 时间');
      return '<section class="ticket-wallet-cafe-label-editor ticket-wallet-cafe-journal-editor"><div class="ticket-wallet-cafe-label-heading"><div><strong>' + escapeHtml(kindMeta.note[english ? 1 : 0]) + '</strong><small>' + (english ? 'Keep the dish, place and moment together.' : '记下餐点、店铺和当时的心情。') + '</small></div></div><div class="ticket-wallet-dining-note-preview"><small>' + escapeHtml(kindMeta.label[english ? 1 : 0]) + '</small><strong data-cafe-preview="drink">' + escapeHtml(draft.cafeDrink || draft.diningItem || itemName) + '</strong><span><b data-cafe-preview="brand">' + escapeHtml(draft.carrier || (english ? 'Restaurant / shop' : '店铺 / 餐厅')) + '</b><i data-cafe-preview="date">' + escapeHtml(date) + '</i></span></div><div class="ticket-wallet-cafe-label-fields"><label><span>' + (english ? 'Restaurant / shop' : '店铺 / 餐厅') + '</span><input type="text" data-ticket-wallet-cafe-field="carrier" value="' + escapeHtml(draft.carrier || '') + '" placeholder="' + (english ? 'Name of the place' : '例：店铺或餐厅名称') + '"></label><label><span>' + itemName + '</span><input type="text" data-ticket-wallet-cafe-field="cafeDrink" value="' + escapeHtml(draft.cafeDrink || draft.diningItem || '') + '" placeholder="' + itemPlaceholder + '"></label><label><span>' + (english ? 'Date / time' : '到店时间') + '</span><input type="datetime-local" data-ticket-wallet-cafe-field="departAt" value="' + escapeHtml(ticketWalletDateInputValue(draft.departAt || Date.now())) + '"></label><label><span>' + (english ? 'Spend' : '花费') + '</span><input type="text" data-ticket-wallet-cafe-field="price" value="' + escapeHtml(draft.price || '') + '" placeholder="' + (english ? '$ / ¥' : '例：¥32') + '"></label><label><span>' + (english ? 'Location' : '地点') + '</span><input type="text" data-ticket-wallet-cafe-field="cafeLocation" value="' + escapeHtml(draft.cafeLocation || '') + '" placeholder="' + (english ? 'City or neighborhood' : '城市 / 街区') + '"></label><label><span>' + (english ? 'Rating' : '评分') + '</span><select data-ticket-wallet-cafe-field="cafeRating">' + ratingOptions + '</select></label><label class="ticket-wallet-cafe-field-wide"><span>' + (english ? 'Journal sticker' : '手帐贴纸') + '</span><div class="ticket-wallet-cafe-mood-picks">' + moodPills + '</div><input type="text" data-ticket-wallet-cafe-field="cafeMood" value="' + escapeHtml(draft.cafeMood || '') + '" placeholder="' + (english ? 'Write a short memory' : '写下一句自己的贴纸文案') + '"></label></div></section>';
    }
    const moods = english ? ['A little treat', 'Slow morning', 'New favorite', 'Try again'] : ['今日特调', '适合放空', '本周最爱', '下次再来'];
    const rating = Number(draft.cafeRating) || 0;
    const ratingOptions = ['<option value="0"' + (!rating ? ' selected' : '') + '>' + (english ? 'Not rated' : '暂不评分') + '</option>']
      .concat([1, 2, 3, 4, 5].map((score) => '<option value="' + score + '"' + (rating === score ? ' selected' : '') + '>' + '★'.repeat(score) + '</option>')).join('');
    const moodOptions = moods.map((mood) => '<button type="button" class="ticket-wallet-cafe-mood-pick' + (draft.cafeMood === mood ? ' active' : '') + '" data-ticket-wallet-cafe-mood-preset="' + escapeHtml(mood) + '">' + escapeHtml(mood) + '</button>').join('');
    const categoryLabels = { '拿铁类': 'Lattes', '美式类': 'Americanos', '冷萃类': 'Cold brew', '冰茶冰奶类': 'Iced tea & milk', '轻乳茶类': 'Milk tea', '果蔬茶类': 'Fruit & vegetable tea', '特调类': 'Specials', '其他非咖啡类': 'Other non-coffee' };
    const categoryPills = LUCKIN_DRINK_CATEGORIES.map((item) => '<button type="button" class="ticket-wallet-drink-tag' + (draft.drinkCategory === item ? ' active' : '') + '" data-ticket-wallet-drink-category="' + escapeHtml(item) + '" aria-pressed="' + (draft.drinkCategory === item) + '">' + escapeHtml(english ? categoryLabels[item] : item) + '</button>').join('');
    const attributeLabels = { drinkTemperature: english ? 'Temperature' : '温度', drinkSize: english ? 'Size' : '杯型', drinkSweetness: english ? 'Sweetness' : '甜度' };
    const attributeOptions = Object.entries(LUCKIN_DRINK_ATTRIBUTES).map(([field, values]) => '<div class="ticket-wallet-drink-attribute"><span>' + attributeLabels[field] + '</span><div>' + values.map((value) => '<button type="button" class="ticket-wallet-drink-tag' + (draft[field] === value ? ' active' : '') + '" data-ticket-wallet-drink-attribute="' + field + '" data-value="' + escapeHtml(value) + '" aria-pressed="' + (draft[field] === value) + '">' + escapeHtml(english ? ({ 冰: 'Iced', 热: 'Hot', 大杯: 'Large', 超大杯: 'Extra large', 标准甜: 'Regular', 少少甜: 'Less sweet', 微甜: 'Lightly sweet', 不另外加糖: 'No added sugar' })[value] : value) + '</button>').join('') + '</div></div>').join('');
    const itemName = english ? kindMeta.item[1] : kindMeta.item[0];
    const itemPlaceholder = kind === 'drink' ? (english ? 'e.g. Coconut latte' : '例：生椰拿铁') : (english ? 'What did you order?' : '记下这次点的餐');
    const modes = [['dine-in', english ? 'Dine in' : '堂食'], ['pickup', english ? 'Pickup' : '自取'], ['delivery', english ? 'Delivery' : '外送']];
    const modePills = modes.map(([value, label]) => '<button type="button" class="ticket-wallet-drink-tag' + (draft.drinkServiceMode === value ? ' active' : '') + '" data-ticket-wallet-drink-mode="' + value + '" aria-pressed="' + (draft.drinkServiceMode === value) + '">' + label + '</button>').join('');
    const selectedAttributes = [draft.drinkTemperature, draft.drinkSize, draft.drinkSweetness, draft.drinkExtras].filter(Boolean).join(' · ');
    const previewDate = draft.departAt ? ticketWalletDateLabel(draft.departAt) : (english ? 'Date / time' : '日期 / 时间');
    const labelPreview = '<article class="ticket-wallet-cup-label" aria-label="' + (english ? 'Live cup label preview' : '杯贴标签预览') + '"><div class="ticket-wallet-cup-label-top"><span class="ticket-wallet-cup-label-brand" data-cafe-preview="brand">' + escapeHtml(draft.carrier || (english ? 'Cafe name' : '店铺名称')) + '</span><span class="ticket-wallet-cup-label-mode" data-cafe-preview="mode">' + escapeHtml(modes.find(([value]) => value === draft.drinkServiceMode)?.[1] || (english ? 'ORDER' : '订单')) + '</span></div><div class="ticket-wallet-cup-label-number"><small>' + (english ? 'PICK-UP NO.' : '取餐号码') + '</small><strong data-cafe-preview="number">' + escapeHtml(draft.ticketNo || '—') + '</strong></div><div class="ticket-wallet-cup-label-drink"><small>' + escapeHtml(kindMeta.label[english ? 1 : 0]) + '</small><strong data-cafe-preview="drink">' + escapeHtml(draft.cafeDrink || draft.diningItem || itemName) + '</strong></div><div class="ticket-wallet-cup-label-options" data-cafe-preview="options">' + (selectedAttributes ? escapeHtml(selectedAttributes) : (english ? 'Drink options' : '温度 · 杯型 · 甜度')) + '</div><div class="ticket-wallet-cup-label-bottom"><span data-cafe-preview="date">' + escapeHtml(previewDate) + '</span><span data-cafe-preview="location">' + escapeHtml(draft.cafeLocation || (english ? 'Cafe' : '门店')) + '</span></div></article>';
    const drinkTags = kind === 'drink' ? '<div class="ticket-wallet-cafe-tag-groups"><div class="ticket-wallet-cafe-tag-row"><span>' + (english ? 'Luckin menu' : '饮品标签') + '</span><div>' + categoryPills + '</div></div>' + attributeOptions + '</div>' : '';
    const moodPills = moods.map((mood) => '<button type="button" class="ticket-wallet-cafe-mood-pick' + (draft.cafeMood === mood ? ' active' : '') + '" data-ticket-wallet-cafe-mood-preset="' + escapeHtml(mood) + '">' + escapeHtml(mood) + '</button>').join('');
    const templateTitle = kind === 'drink' ? (english ? 'Coffee cup label' : '咖啡杯贴标签') : (english ? kindMeta.note[1] : kindMeta.note[0]);
    return '<section class="ticket-wallet-cafe-label-editor"><div class="ticket-wallet-cafe-label-heading"><div><strong>' + templateTitle + '</strong><small>' + (english ? 'A pickup label layout with the order number and drink options up front.' : '按杯贴样式突出取餐号、饮品名称和口味选项。') + '</small></div></div>' + labelPreview + '<div class="ticket-wallet-cafe-label-fields"><label><span>' + (english ? 'Cafe / brand' : '店铺 / 品牌') + '</span><input type="text" data-ticket-wallet-cafe-field="carrier" value="' + escapeHtml(draft.carrier || '') + '" placeholder="' + (english ? 'e.g. Luckin Coffee' : '例：瑞幸咖啡') + '"></label><label><span>' + (english ? 'Pickup number' : '取餐号') + '</span><input type="text" data-ticket-wallet-cafe-field="ticketNo" value="' + escapeHtml(draft.ticketNo || '') + '" placeholder="' + (english ? 'e.g. 589' : '例：589') + '"></label><label class="ticket-wallet-cafe-field-wide"><span>' + itemName + '</span><input type="text" data-ticket-wallet-cafe-field="cafeDrink" value="' + escapeHtml(draft.cafeDrink || draft.diningItem || '') + '" placeholder="' + itemPlaceholder + '"></label><div class="ticket-wallet-cafe-field-wide"><span class="ticket-wallet-cafe-field-label">' + (english ? 'Order mode' : '到店方式') + '</span><div class="ticket-wallet-cafe-mode-picks">' + modePills + '</div></div>' + drinkTags + '<label class="ticket-wallet-cafe-field-wide"><span>' + (english ? 'Extra / note' : '加料 / 口味备注') + '</span><input type="text" data-ticket-wallet-cafe-field="drinkExtras" value="' + escapeHtml(draft.drinkExtras || '') + '" placeholder="' + (english ? 'e.g. Oat milk, extra shot' : '例：燕麦奶、加浓、少冰') + '"></label><label><span>' + (english ? 'Order time' : '下单时间') + '</span><input type="datetime-local" data-ticket-wallet-cafe-field="departAt" value="' + escapeHtml(ticketWalletDateInputValue(draft.departAt || Date.now())) + '"></label><label><span>' + (english ? 'Spend' : '花费') + '</span><input type="text" data-ticket-wallet-cafe-field="price" value="' + escapeHtml(draft.price || '') + '" placeholder="' + (english ? '$ / ¥' : '例：¥32') + '"></label><label><span>' + (english ? 'Cafe location' : '门店 / 地点') + '</span><input type="text" data-ticket-wallet-cafe-field="cafeLocation" value="' + escapeHtml(draft.cafeLocation || '') + '" placeholder="' + (english ? 'City or neighborhood' : '城市 / 街区，可用于地图') + '"></label><label><span>' + (english ? 'Rating' : '评分') + '</span><select data-ticket-wallet-cafe-field="cafeRating">' + ratingOptions + '</select></label><label class="ticket-wallet-cafe-field-wide"><span>' + (english ? 'Journal sticker' : '手帐贴纸') + '</span><div class="ticket-wallet-cafe-mood-picks">' + moodPills + '</div><input type="text" data-ticket-wallet-cafe-field="cafeMood" value="' + escapeHtml(draft.cafeMood || '') + '" placeholder="' + (english ? 'Write a short memory' : '写下一句自己的贴纸文案') + '"></label></div></section>';
  }
  const isTrain = draft.type === 'train';
  const isFlight = draft.type === 'flight';
  const options = isTrain ? [
    { id: 'crh-blue-v1', swatch: 'blue', title: '浅蓝票面', note: '默认票面 · 清爽样式' },
    { id: 'pink-physical-v1', swatch: 'pink', title: '经典纸票面', note: '传统纸质样式' },
  ] : isFlight ? Object.values(TICKET_WALLET_FLIGHT_TEMPLATES).map((item) => ({ ...item, swatch: item.id.replace(/-v1$/, '') })) : [{ id: 'standard-v1', swatch: draft.type, title: '标准票面', note: '适配当前分类' }];
  const layoutClass = isFlight ? ' is-airlines' : options.length === 1 ? ' is-single' : ' is-multiple';
  const legend = isFlight ? (state.language === 'en' ? 'Airline ticket style' : '航空公司票面') : (state.language === 'en' ? 'Ticket style' : '票面样式');
  return '<fieldset class="ticket-wallet-template-picker"><legend>' + escapeHtml(legend) + '</legend><div class="ticket-wallet-template-options' + layoutClass + '">' + options.map((item) => '<button type="button" class="ticket-wallet-template-option ' + (draft.template === item.id ? 'active' : '') + '" aria-pressed="' + (draft.template === item.id ? 'true' : 'false') + '" data-ticket-wallet-template="' + item.id + '"><span class="ticket-wallet-template-swatch ticket-wallet-template-swatch-' + item.swatch + '" aria-hidden="true"></span><span><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.note) + '</small></span></button>').join('') + '</div></fieldset>';
}
function updateTicketWalletCafeLabelPreview() {
  const draft = state.ticketWalletDraft;
  if (!draft || draft.type !== 'dining') return;
  const field = (name) => workspace.querySelector('[data-ticket-wallet-cafe-field="' + name + '"]')?.value?.trim() || '';
  const english = state.language === 'en';
  const kind = TICKET_WALLET_DINING_KINDS[normalizeTicketWalletDiningKind(draft.diningKind, 'drink')];
  const labels = { 'dine-in': english ? 'Dine in' : '堂食', pickup: english ? 'Pickup' : '自取', delivery: english ? 'Delivery' : '外送' };
  const drink = field('cafeDrink') || field('diningItem') || kind.item[english ? 1 : 0];
  const options = [draft.drinkTemperature, draft.drinkSize, draft.drinkSweetness, field('drinkExtras')].filter(Boolean).join(' · ') || (english ? 'Drink options' : '温度 · 杯型 · 甜度');
  const values = {
    brand: field('carrier') || (english ? 'Cafe name' : '店铺名称'),
    number: field('ticketNo') || '—',
    drink,
    mode: labels[draft.drinkServiceMode] || (english ? 'ORDER' : '订单'),
    options,
    date: field('departAt') ? ticketWalletDateLabel(field('departAt')) : (english ? 'Date / time' : '日期 / 时间'),
    location: field('cafeLocation') || (english ? 'Cafe' : '门店'),
  };
  Object.entries(values).forEach(([key, value]) => {
    const node = workspace.querySelector('[data-cafe-preview="' + key + '"]');
    if (node) node.textContent = value;
  });
}
function ticketWalletAddFieldsMarkup(draft) {
  if (draft.type === 'dining') return '';
  const travel = TICKET_WALLET_TRAVEL_TYPES.includes(draft.type);
  const english = state.language === 'en';
  const fields = travel
    ? [ticketWalletField(t('ticketWalletFrom'), 'ticketWalletFrom', draft.from), ticketWalletField(t('ticketWalletTo'), 'ticketWalletTo', draft.to), ticketWalletField(t('ticketWalletDepart'), 'ticketWalletDepart', draft.departAt, 'datetime-local'), ticketWalletField(t('ticketWalletCarrier'), 'ticketWalletCarrier', draft.carrier), ticketWalletField(draft.type === 'train' ? t('ticketWalletTrainNo') : t('ticketWalletTicketNo'), 'ticketWalletTicketNo', draft.ticketNo), ticketWalletField(t('ticketWalletPrice'), 'ticketWalletPrice', draft.price), ticketWalletField(t('ticketWalletSeat'), 'ticketWalletSeat', draft.seat), ...(draft.type === 'train' ? [ticketWalletField(t('ticketWalletSerial'), 'ticketWalletSerial', draft.ticketSerial), ticketWalletField(t('ticketWalletSeatClass'), 'ticketWalletSeatClass', draft.seatClass), ticketWalletField(t('ticketWalletPassengerName'), 'ticketWalletPassengerName', draft.passengerName), ticketWalletField(t('ticketWalletPassengerId'), 'ticketWalletPassengerId', draft.passengerId), ticketWalletField(t('ticketWalletCode'), 'ticketWalletCode', draft.ticketCode)] : [])]
    : [ticketWalletField(state.language === 'en' ? 'Event / attraction' : '活动 / 项目名称', 'ticketWalletTitle', draft.title === ticketTypeLabel(draft.type) ? '' : draft.title, 'text', 'placeholder="' + (english ? 'Name of the event' : '例：演出、电影或景点') + '"'), ticketWalletField(state.language === 'en' ? 'Venue' : '场馆 / 地点', 'ticketWalletCarrier', draft.carrier), ticketWalletField(t('ticketWalletDepart'), 'ticketWalletDepart', draft.departAt, 'datetime-local'), ticketWalletField(t('ticketWalletTicketNo'), 'ticketWalletTicketNo', draft.ticketNo), ticketWalletField(t('ticketWalletPrice'), 'ticketWalletPrice', draft.price), ticketWalletField(t('ticketWalletSeat'), 'ticketWalletSeat', draft.seat), ticketWalletField(t('ticketWalletCode'), 'ticketWalletCode', draft.ticketCode)];
  return '<section class="ticket-wallet-add-fields"><h3>' + (english ? 'Ticket details' : '票据信息') + '</h3><div class="ticket-wallet-cafe-label-fields">' + fields.join('') + '</div></section>';
}
function ticketWalletAddTypeSelectorMarkup(draft) {
  const category = ticketWalletCategoryForType(draft.type);
  const categories = Object.entries(TICKET_WALLET_CATEGORIES).filter(([key]) => key !== 'all');
  const types = Object.entries(TICKET_TYPE_LABELS).filter(([type]) => ticketWalletCategoryForType(type) === category);
  const categoryMarkup = categories.map(([key, item]) => '<button type="button" class="ticket-wallet-add-category ' + (key === category ? 'active' : '') + '" data-ticket-wallet-add-category="' + key + '" aria-pressed="' + (key === category ? 'true' : 'false') + '"><span class="ticket-wallet-add-category-icon" aria-hidden="true">' + item.icon + '</span><span>' + escapeHtml(item.label[state.language === 'en' ? 1 : 0]) + '</span></button>').join('');
  const typeMarkup = category === 'dining'
    ? Object.entries(TICKET_WALLET_DINING_KINDS).map(([key, item]) => '<button type="button" class="ticket-wallet-add-type-option ticket-wallet-add-dining-option ' + (normalizeTicketWalletDiningKind(draft.diningKind, 'drink') === key ? 'active' : '') + '" data-ticket-wallet-add-dining-kind="' + key + '" aria-pressed="' + (normalizeTicketWalletDiningKind(draft.diningKind, 'drink') === key) + '"><span class="ticket-wallet-add-type-icon" aria-hidden="true">' + item.icon + '</span><span>' + escapeHtml(item.label[state.language === 'en' ? 1 : 0]) + '</span></button>').join('')
    : types.map(([type, labels]) => '<button type="button" class="ticket-wallet-add-type-option ' + (type === draft.type ? 'active' : '') + '" data-ticket-wallet-add-type="' + type + '" aria-pressed="' + (type === draft.type ? 'true' : 'false') + '"><span class="ticket-wallet-add-type-icon" aria-hidden="true">' + TICKET_TYPES[type].icon + '</span><span>' + escapeHtml(labels[state.language === 'en' ? 1 : 0]) + '</span></button>').join('');
  return '<div class="ticket-wallet-add-classification"><fieldset class="ticket-wallet-add-category-picker"><legend>' + (state.language === 'en' ? 'Category' : '票据大类') + '</legend><div class="ticket-wallet-add-categories">' + categoryMarkup + '</div></fieldset><fieldset class="ticket-wallet-add-type-picker"><legend>' + (state.language === 'en' ? 'Ticket type' : '票据类型') + '</legend><div class="ticket-wallet-add-types">' + typeMarkup + '</div></fieldset></div>';
}
function renderTicketWalletEditor() {
  const draft = state.ticketWalletDraft || normalizeTicketRecord({ type: ticketWalletDefaultTypeForFilter(state.ticketWalletTypeFilter), template: ticketWalletDefaultTemplate(ticketWalletDefaultTypeForFilter(state.ticketWalletTypeFilter)) });
  const image = draft.sourceImageId ? ticketWalletImageCache.get(draft.sourceImageId) : null;
  const stage = state.ticketWalletEditorStage === 'details' ? 'details' : 'choose';
  const recognition = state.ticketWalletRecognition || { status: 'idle', progress: 0, message: '' };
  const recognitionMarkup = recognition.status !== 'idle' ? '<div class="ticket-wallet-recognition ' + escapeHtml(recognition.status) + '" role="status"><div><strong>' + escapeHtml(recognition.message) + '</strong><span>' + Math.round(Number(recognition.progress || 0)) + '%</span></div><div class="ticket-wallet-recognition-track"><i style="width:' + Math.min(100, Math.max(0, Number(recognition.progress || 0))) + '%"></i></div></div>' : '';
  const typeMeta = TICKET_TYPES[draft.type] || TICKET_TYPES.other;
  const isCafe = draft.type === 'dining';
  const originalTitle = isCafe ? (state.language === 'en' ? 'Photo / receipt' : '照片 / 小票') : '原始票据';
  const originalEmpty = isCafe ? (state.language === 'en' ? 'No photo or receipt yet' : '尚未添加照片或小票') : '尚未导入';
  const originalMarkup = image?.src
    ? '<button type="button" class="ticket-wallet-add-original is-ready" data-ticket-wallet-original-draft="' + escapeHtml(draft.sourceImageId) + '"><img src="' + escapeHtml(image.src) + '" alt=""><span><strong>' + originalTitle + '</strong><small>' + escapeHtml(draft.sourceImageName || (state.language === 'en' ? 'Open original' : '点击查看原图')) + '</small></span><b aria-hidden="true">›</b></button>'
    : '<div class="ticket-wallet-add-original"><span class="ticket-wallet-original-icon">' + typeMeta.icon + '</span><span><strong>' + originalTitle + '</strong><small>' + originalEmpty + '</small></span></div>';
  const imageIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="3"/><circle cx="9" cy="10" r="1.4"/><path d="m6 16 4-4 3 3 2-2 3 3"/></svg>';
  const closeLabel = state.language === 'en' ? 'Close ticket editor' : '关闭添加票据';
  const closeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>';
  const importLabel = state.language === 'en' ? 'Import photo / ticket' : '导入原件或小票';
  const createLabel = state.language === 'en' ? 'Create manually' : '手动创建';
  const stageTitle = stage === 'choose'
    ? (state.language === 'en' ? 'Choose ticket type' : '选择票据类型')
    : isCafe ? (state.language === 'en' ? 'Fill the cup label' : '填写饮品杯贴') : (state.language === 'en' ? 'Fill ticket details' : '填写票据信息');
  const selectionActions = '<div class="ticket-wallet-create-options" role="group" aria-label="' + (state.language === 'en' ? 'Choose how to start' : '选择添加方式') + '"><button type="button" class="ticket-wallet-create-option" data-ticket-wallet-import-image><span class="ticket-wallet-create-option-icon" aria-hidden="true">' + imageIcon + '</span><span><strong>' + importLabel + '</strong><small>' + (state.language === 'en' ? 'Recognize details from a photo, then review them' : '识别图片信息，随后检查并填写模板') + '</small></span></button><button type="button" class="ticket-wallet-create-option" data-ticket-wallet-create-empty="blank"><span class="ticket-wallet-create-option-icon ticket-wallet-create-option-plus" aria-hidden="true">＋</span><span><strong>' + createLabel + '</strong><small>' + (state.language === 'en' ? 'Start with a blank template' : '从空白模板开始填写') + '</small></span></button></div>';
  const currentTypeLabel = isCafe ? TICKET_WALLET_DINING_KINDS[normalizeTicketWalletDiningKind(draft.diningKind, 'drink')].label[state.language === 'en' ? 1 : 0] : (TICKET_TYPE_LABELS[draft.type] || TICKET_TYPE_LABELS.other)[state.language === 'en' ? 1 : 0];
  const currentTypeSummary = '<div class="ticket-wallet-add-current-type"><span>' + (state.language === 'en' ? 'Current type' : '当前类型') + '</span><strong>' + escapeHtml(currentTypeLabel) + '</strong><button type="button" class="ghost" data-ticket-wallet-stage-back>' + (state.language === 'en' ? 'Change' : '更改') + '</button></div>';
  const editActions = '<div class="ticket-wallet-editor-actions ticket-wallet-add-stage-actions"><button type="button" class="primary" data-ticket-wallet-save>' + (state.language === 'en' ? 'Save to wallet' : '保存到卡包') + '</button></div>';
  const detailMarkup = stage === 'details'
    ? recognitionMarkup + currentTypeSummary + ticketWalletAddTemplateMarkup(draft) + ticketWalletAddFieldsMarkup(draft) + '<div class="ticket-wallet-add-original-field"><div class="ticket-wallet-add-original-heading"><span class="ticket-wallet-add-field-label">' + originalTitle + '</span><button type="button" class="ghost" data-ticket-wallet-import-image>' + (state.language === 'en' ? 'Add / replace' : '添加 / 更换') + '</button></div>' + originalMarkup + '</div>' + editActions
    : ticketWalletAddTypeSelectorMarkup(draft) + selectionActions;
  return '<section class="ticket-wallet-editor ticket-wallet-add-page" aria-label="' + escapeHtml(t('ticketWalletAddTicket')) + '"><div class="ticket-wallet-editor-head"><div><h2>' + stageTitle + '</h2><small>' + (stage === 'choose' ? (state.language === 'en' ? 'Select the category and type before importing or creating.' : '先选票据大类和类型，再导入原件或手动创建。') : (state.language === 'en' ? 'Review the recognized details before saving.' : '确认识别结果和模板信息后保存。')) + '</small></div><button type="button" class="ticket-wallet-detail-close ticket-wallet-add-close" data-ticket-wallet-cancel aria-label="' + escapeHtml(closeLabel) + '">' + closeIcon + '</button></div>' + detailMarkup + '</section>';
}
function ticketWalletTrainDateParts(value) {
  const date = new Date(value); if (Number.isNaN(date.getTime())) return { date: '日期待补充', time: '' };
  return { date: date.getFullYear() + '年' + pad(date.getMonth() + 1) + '月' + pad(date.getDate()) + '日', time: pad(date.getHours()) + ':' + pad(date.getMinutes()) };
}
function ticketWalletTrainStationName(value) {
  return String(value || '').replace(/\s*(?:车站|站)\s*$/, '').trim();
}
function ticketWalletTrainStationLatin(value) {
  const station = ticketWalletTrainStationName(value);
  const known = {
    上海虹桥: 'Shanghaihongqiao', 杭州东: 'Hangzhoudong', 南京南: 'Nanjingnan', 北京南: 'Beijingnan', 广州南: 'Guangzhounan', 深圳北: 'Shenzhenbei',
    苏州: 'Suzhou', 上海: 'Shanghai', 杭州: 'Hangzhou', 南京: 'Nanjing', 北京: 'Beijing', 广州: 'Guangzhou', 深圳: 'Shenzhen',
    西安: 'Xian', 成都: 'Chengdu', 武汉: 'Wuhan', 青岛: 'Qingdao', 厦门: 'Xiamen', 天津: 'Tianjin', 重庆: 'Chongqing', 郑州: 'Zhengzhou',
    济南: 'Jinan', 合肥: 'Hefei', 福州: 'Fuzhou', 昆明: 'Kunming', 长沙: 'Changsha', 南昌: 'Nanchang', 沈阳: 'Shenyang', 大连: 'Dalian',
    哈尔滨: 'Harbin', 石家庄: 'Shijiazhuang', 太原: 'Taiyuan', 兰州: 'Lanzhou', 乌鲁木齐: 'Wulumuqi', 贵阳: 'Guiyang', 桂林: 'Guilin',
    宁波: 'Ningbo', 绍兴: 'Shaoxing', 绍兴北: 'Shaoxingbei', 绍兴东: 'Shaoxingdong', 无锡: 'Wuxi', 常州: 'Changzhou', 嘉兴: 'Jiaxing', 温州: 'Wenzhou', 金华: 'Jinhua', 徐州: 'Xuzhou', 洛阳: 'Luoyang',
    珠海: 'Zhuhai', 惠州: 'Huizhou', 海口: 'Haikou', 三亚: 'Sanya', 拉萨: 'Lasa', 呼和浩特: 'Hohhot', 银川: 'Yinchuan', 西宁: 'Xining',
  };
  if (/^[A-Za-z][A-Za-z\s-]*$/.test(station)) return station.replace(/\s+/g, '');
  return known[station] || '';
}
function ticketWalletTrainTicketSerial(record) {
  return String(record.ticketSerial || '').trim() || String(record.sourceImageName || '').match(/\b[A-Z]\d{6}\b/i)?.[0]?.toUpperCase() || '票号待补充';
}
function ticketWalletTrainSeatDisplay(value) {
  const seat = String(value || '').trim();
  const match = seat.match(/(\d{1,3})\s*车\s*(\d{1,3}\s*[A-Z])\s*(?:号)?/i);
  if (match) return match[1] + '车' + match[2].replace(/\s+/g, '').toUpperCase() + '号';
  return seat || '座位待补充';
}
function ticketWalletTrainPriceDisplay(value) {
  const price = String(value || '').trim().replace(/^¥/, '￥');
  if (!price) return '￥待补充';
  return price.startsWith('￥') ? (price.endsWith('元') ? price.replace(/￥\s+/, '￥') : price.replace(/￥\s+/, '￥') + '元') : '￥' + price.replace(/元$/, '') + '元';
}
function ticketWalletTrainPassengerDisplay(record) {
  const parts = ticketWalletPassengerParts(record.passenger, record.passengerName, record.passengerId);
  return [ticketWalletMaskedPassengerId(parts.passengerId), parts.passengerName].filter(Boolean).join(' ') || '乘客信息待补充';
}
function ticketWalletTrainTemplateData(record) {
  const date = ticketWalletTrainDateParts(record.departAt);
  const serial = ticketWalletTrainTicketSerial(record);
  const ticketCode = record.ticketCode || '票据编码待补充';
  const from = ticketWalletTrainStationName(record.from) || '出发';
  const to = ticketWalletTrainStationName(record.to) || '到达';
  return {
    id: record.id,
    serial,
    trainNo: record.ticketNo || '车次待补充',
    from,
    fromLatin: record.fromLatin || ticketWalletTrainStationLatin(record.from) || (state.language === 'en' ? 'Add pinyin' : '拼音待补充'),
    to,
    toLatin: record.toLatin || ticketWalletTrainStationLatin(record.to) || (state.language === 'en' ? 'Add pinyin' : '拼音待补充'),
    depart: date.time ? date.date + ' ' + date.time + ' 开' : date.date,
    price: ticketWalletTrainPriceDisplay(record.price),
    seat: ticketWalletTrainSeatDisplay(record.seat),
    seatClass: record.seatClass || '席别待补充',
    passenger: ticketWalletTrainPassengerDisplay(record),
    passengerId: ticketWalletPassengerParts(record.passenger, record.passengerName, record.passengerId).passengerId,
    passengerName: ticketWalletPassengerParts(record.passenger, record.passengerName, record.passengerId).passengerName,
    ticketCode,
    template: record.template === 'crh-blue-v1' ? 'crh-blue-v1' : 'pink-physical-v1',
  };
}
function ticketWalletTrainQrMarkup(seed) {
  const size = 25; const cells = new Set();
  const add = (x, y) => cells.add(x + ',' + y);
  const finder = (left, top) => {
    for (let y = 0; y < 7; y += 1) for (let x = 0; x < 7; x += 1) {
      if (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) add(left + x, top + y);
    }
  };
  finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
  let stateValue = 2166136261;
  for (const char of String(seed || 'ONEBOX')) stateValue = Math.imul(stateValue ^ char.charCodeAt(0), 16777619) >>> 0;
  const inFinderArea = (x, y) => (x < 8 && y < 8) || (x >= size - 8 && y < 8) || (x < 8 && y >= size - 8);
  for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
    if (inFinderArea(x, y)) continue;
    if (x === 6 || y === 6) { if ((x + y) % 2 === 0) add(x, y); continue; }
    stateValue = (Math.imul(stateValue, 1664525) + 1013904223) >>> 0;
    if (((stateValue >>> 29) & 1) ^ ((x * 3 + y * 5) % 7 < 3)) add(x, y);
  }
  const path = Array.from(cells).map((cell) => { const [x, y] = cell.split(','); return 'M' + x + ' ' + y + 'h1v1h-1z'; }).join('');
  return '<g class="ticket-wallet-train-template-qr" transform="translate(795 422) scale(8.4)" shape-rendering="crispEdges"><rect width="25" height="25"/><path d="' + path + '"/></g>';
}
function ticketWalletTrainEditAttrs(data, field, label, editable = true) {
  if (!editable) return '';
  return 'class="ticket-edit-target" role="button" tabindex="0" data-ticket-wallet-id="' + escapeHtml(data.id) + '" data-ticket-wallet-edit-field="' + escapeHtml(field) + '" aria-label="' + escapeHtml((state.language === 'en' ? 'Edit ' : '编辑') + label) + '"';
}
function ticketWalletTrainPassengerMarkup(data, editable = true) {
  const maskedId = ticketWalletMaskedPassengerId(data.passengerId || '');
  const visibleId = maskedId || (state.language === 'en' ? 'Document number' : '证件号待补充');
  const visibleName = data.passengerName || (state.language === 'en' ? 'Passenger name' : '姓名待补充');
  return '<text class="ticket-passenger" x="20" y="474"><tspan ' + ticketWalletTrainEditAttrs(data, 'passengerId', t('ticketWalletPassengerId'), editable) + '>' + escapeHtml(visibleId) + '</tspan><tspan> </tspan><tspan ' + ticketWalletTrainEditAttrs(data, 'passengerName', t('ticketWalletPassengerName'), editable) + '>' + escapeHtml(visibleName) + '</tspan></text>';
}
function ticketWalletTrainBlueTemplateMarkup(data, sourceHint = '', editable = true) {
  const gradientId = 'train-ticket-blue-' + String(data.id || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(-24);
  const fromClass = data.from.length > 3 ? ' station-main is-long' : ' station-main';
  const toClass = data.to.length > 3 ? ' station-main is-long' : ' station-main';
  const editGroup = (field, label, content) => '<g ' + ticketWalletTrainEditAttrs(data, field, label, editable) + '>' + (editable ? '<title>' + escapeHtml((state.language === 'en' ? 'Edit ' : '点击编辑') + label) + '</title>' : '') + content + '</g>';
  const serial = editGroup('ticketSerial', t('ticketWalletSerial'), '<text class="ticket-serial" x="18" y="58">' + escapeHtml(data.serial) + '</text>');
  const fromStation = editGroup('from', t('ticketWalletFrom'), '<text class="' + fromClass + '" x="205" y="139" text-anchor="middle"><tspan class="station-main-name">' + escapeHtml(data.from) + '</tspan><tspan class="station-suffix">站</tspan></text>') + editGroup('fromLatin', state.language === 'en' ? 'Origin pinyin' : '出发地拼音', '<text class="station-latin" x="205" y="184" text-anchor="middle">' + escapeHtml(data.fromLatin) + '</text>');
  const trainNo = editGroup('ticketNo', t('ticketWalletTrainNo'), '<text class="train-number" x="548" y="137" text-anchor="middle">' + escapeHtml(data.trainNo) + '</text><path class="train-number-arrow" d="M432 151H661M648 143L667 151L648 159"/>');
  const toStation = editGroup('to', t('ticketWalletTo'), '<text class="' + toClass + '" x="866" y="139" text-anchor="middle"><tspan class="station-main-name">' + escapeHtml(data.to) + '</tspan><tspan class="station-suffix">站</tspan></text>') + editGroup('toLatin', state.language === 'en' ? 'Destination pinyin' : '目的地拼音', '<text class="station-latin" x="866" y="184" text-anchor="middle">' + escapeHtml(data.toLatin) + '</text>');
  const depart = editGroup('departAt', t('ticketWalletDepart'), '<text class="ticket-date" x="20" y="256">' + escapeHtml(data.depart) + '</text>');
  const price = editGroup('price', t('ticketWalletPrice'), '<text class="ticket-price" x="20" y="324">' + escapeHtml(data.price) + '</text>');
  const seat = editGroup('seat', t('ticketWalletSeat'), '<text class="ticket-seat" x="780" y="256">' + escapeHtml(data.seat) + '</text>');
  const seatClass = editGroup('seatClass', t('ticketWalletSeatClass'), '<text class="ticket-seat-class" x="858" y="324">' + escapeHtml(data.seatClass) + '</text>');
  const passenger = ticketWalletTrainPassengerMarkup(data, editable);
  const ticketCode = editGroup('ticketCode', t('ticketWalletCode'), '<text class="ticket-code" x="19" y="684">' + escapeHtml(data.ticketCode) + '</text>');
  return [
    '<div class="ticket-wallet-train-ticket" data-train-ticket-template="crh-blue-v1"', sourceHint ? ' aria-label="' + escapeHtml(sourceHint) + '"' : '', '>',
    '<svg class="ticket-wallet-train-template ticket-wallet-train-template-blue" viewBox="0 0 1096 695" role="img" aria-label="', escapeHtml(data.from + '到' + data.to + '火车票'), '" preserveAspectRatio="xMidYMid meet">',
    '<title>', escapeHtml(data.from + '到' + data.to + ' ' + data.trainNo), '</title>',
    '<defs><linearGradient id="', gradientId, '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8eaf2"/><stop offset=".62" stop-color="#7dd4e1"/><stop offset="1" stop-color="#38b9d2"/></linearGradient></defs>',
    '<rect class="ticket-paper ticket-paper-blue" width="1096" height="695" rx="18" fill="url(#', gradientId, ')"/>',
    '<path class="ticket-blue-haze" d="M0 420c150-35 254 23 389-18s225-18 336 5 239-4 371 22v266H0Z"/>',
    '<g class="ticket-blue-train-art" aria-hidden="true"><path d="M42 523c124-4 210 18 324-7 92-20 134-53 224-48 113 6 167 48 263 53 73 4 129-7 201-27v64H42Z"/><path d="M173 541h720c-44 23-91 28-145 27H327c-61 0-111-9-154-27Zm168-26h75l33-45h106l27 45h94l28-39 93 4 28 35H341Z"/><path d="M477 470h104l13 45H463Zm-234 99h45m38 0h45m348 0h45m38 0h45"/></g>',
    serial,
    '<g class="ticket-route">', fromStation, trainNo, toStation, '</g>',
    depart, seat, price,
    '<circle class="ticket-seal-circle" cx="462" cy="302" r="25"/><text class="ticket-seal-text" x="462" y="315" text-anchor="middle">纪</text>', seatClass, '<text class="ticket-memorial" x="20" y="379">仅供纪念使用</text>',
    passenger,
    '<rect class="ticket-notice-border" x="49" y="494" width="684" height="126"/><text class="ticket-notice" x="391" y="548" text-anchor="middle">买票请到12306 发货请到95306</text><text class="ticket-notice" x="391" y="606" text-anchor="middle">中国铁路祝您旅途愉快</text>',
    ticketWalletTrainQrMarkup(data.ticketCode), ticketCode, '</svg></div>',
  ].join('');
}
function ticketWalletTrainTemplateMarkup(data, sourceHint = '', editable = true) {
  if (data.template === 'crh-blue-v1') return ticketWalletTrainBlueTemplateMarkup(data, sourceHint, editable);
  const patternId = 'train-ticket-paper-' + String(data.id || 'default').replace(/[^a-zA-Z0-9_-]/g, '').slice(-24);
  const fromClass = data.from.length > 3 ? ' station-main is-long' : ' station-main';
  const toClass = data.to.length > 3 ? ' station-main is-long' : ' station-main';
  const editGroup = (field, label, content) => '<g ' + ticketWalletTrainEditAttrs(data, field, label, editable) + '>' + (editable ? '<title>' + escapeHtml((state.language === 'en' ? 'Edit ' : '点击编辑') + label) + '</title>' : '') + content + '</g>';
  const serial = editGroup('ticketSerial', t('ticketWalletSerial'), '<text class="ticket-serial" x="18" y="58">' + escapeHtml(data.serial) + '</text>');
  const fromStation = editGroup('from', t('ticketWalletFrom'), '<text class="' + fromClass + '" x="205" y="139" text-anchor="middle"><tspan class="station-main-name">' + escapeHtml(data.from) + '</tspan><tspan class="station-suffix">站</tspan></text>') + editGroup('fromLatin', state.language === 'en' ? 'Origin pinyin' : '出发地拼音', '<text class="station-latin" x="205" y="184" text-anchor="middle">' + escapeHtml(data.fromLatin) + '</text>');
  const trainNo = editGroup('ticketNo', t('ticketWalletTrainNo'), '<text class="train-number" x="548" y="137" text-anchor="middle">' + escapeHtml(data.trainNo) + '</text><path class="train-number-arrow" d="M432 151H661M648 143L667 151L648 159"/>');
  const toStation = editGroup('to', t('ticketWalletTo'), '<text class="' + toClass + '" x="866" y="139" text-anchor="middle"><tspan class="station-main-name">' + escapeHtml(data.to) + '</tspan><tspan class="station-suffix">站</tspan></text>') + editGroup('toLatin', state.language === 'en' ? 'Destination pinyin' : '目的地拼音', '<text class="station-latin" x="866" y="184" text-anchor="middle">' + escapeHtml(data.toLatin) + '</text>');
  const depart = editGroup('departAt', t('ticketWalletDepart'), '<text class="ticket-date" x="20" y="256">' + escapeHtml(data.depart) + '</text>');
  const price = editGroup('price', t('ticketWalletPrice'), '<text class="ticket-price" x="20" y="324">' + escapeHtml(data.price) + '</text>');
  const seat = editGroup('seat', t('ticketWalletSeat'), '<text class="ticket-seat" x="780" y="256">' + escapeHtml(data.seat) + '</text>');
  const seatClass = editGroup('seatClass', t('ticketWalletSeatClass'), '<text class="ticket-seat-class" x="858" y="324">' + escapeHtml(data.seatClass) + '</text>');
  const passenger = ticketWalletTrainPassengerMarkup(data, editable);
  const ticketCode = editGroup('ticketCode', t('ticketWalletCode'), '<text class="ticket-code" x="19" y="684">' + escapeHtml(data.ticketCode) + '</text>');
  return [
    '<div class="ticket-wallet-train-ticket" data-train-ticket-template="pink-physical-v1"', sourceHint ? ' aria-label="' + escapeHtml(sourceHint) + '"' : '', '>',
    '<svg class="ticket-wallet-train-template" viewBox="0 0 1096 695" role="img" aria-label="', escapeHtml(data.from + '到' + data.to + '火车票'), '" preserveAspectRatio="xMidYMid meet">',
    '<title>', escapeHtml(data.from + '到' + data.to + ' ' + data.trainNo), '</title>',
    '<defs><pattern id="', patternId, '" width="210" height="154" patternUnits="userSpaceOnUse"><path d="M18 34h42v34H18zM31 42v18M80 25c18 7 29 22 25 42-5 21-26 31-45 22M145 23c24 6 41 27 36 50-4 18-20 31-38 34M130 91c24-17 51-12 66 11"/><path d="M22 119c29-20 56-16 77 7m18-2c22-19 50-15 72 5"/></pattern></defs>',
    '<rect class="ticket-paper" width="1096" height="695"/><rect class="ticket-paper-pattern" width="1096" height="695" fill="url(#', patternId, ')"/>',
    serial,
    '<g class="ticket-route">', fromStation,
    trainNo,
    toStation, '</g>',
    depart,
    seat,
    price,
    '<circle class="ticket-seal-circle" cx="462" cy="302" r="25"/><text class="ticket-seal-text" x="462" y="315" text-anchor="middle">纪</text>', seatClass, '<text class="ticket-memorial" x="20" y="379">仅供纪念使用</text>',
    passenger,
    '<rect class="ticket-notice-border" x="49" y="494" width="684" height="126"/><text class="ticket-notice" x="391" y="548" text-anchor="middle">买票请到12306 发货请到95306</text><text class="ticket-notice" x="391" y="606" text-anchor="middle">中国铁路祝您旅途愉快</text>',
    ticketWalletTrainQrMarkup(data.ticketCode), ticketCode, '</svg></div>',
  ].join('');
}
function ticketWalletCategoryMarkup(records) {
  const categories = Object.entries(TICKET_WALLET_CATEGORIES).map(([key, item]) => ({ key, label: item.label[state?.language === 'en' ? 1 : 0], icon: item.icon }));
  return '<nav class="ticket-wallet-category-bar" data-tab-rail="ticket-filters" role="tablist" aria-label="票据分类">' + categories.map((item) => { const count = item.key === 'all' ? records.length : records.filter((record) => ticketWalletCategoryForType(record.type) === item.key).length; const active = state.ticketWalletTypeFilter === item.key; return '<button class="ticket-wallet-category ' + (active ? 'active' : '') + '" data-ticket-wallet-filter="' + item.key + '" role="tab" aria-selected="' + active + '" aria-pressed="' + active + '"><span class="ticket-wallet-category-icon">' + item.icon + '</span><span>' + escapeHtml(item.label) + '</span><b>' + count + '</b></button>'; }).join('') + '</nav>';
}
function selectTicketWalletFilter(type) {
  if (!Object.prototype.hasOwnProperty.call(TICKET_WALLET_CATEGORIES, type)) return;
  ticketWalletMapFocusId = '';
  const previousFilterScrollLeft = document.querySelector('.ticket-wallet-filter-scroll')?.scrollLeft || 0;
  state.ticketWalletTypeFilter = type;
  saveTicketWalletTypeFilter();
  state.ticketWalletSelectedId = '';
  render();
  const nextScroll = document.querySelector('.ticket-wallet-filter-scroll');
  if (nextScroll) nextScroll.scrollLeft = previousFilterScrollLeft;
  scheduleTicketWalletFilterFocus(true);
}
function focusTicketWalletFilter(smooth = false) {
  const scroll = document.querySelector('.ticket-wallet-filter-scroll');
  const active = scroll?.querySelector('.ticket-wallet-category.active');
  if (!scroll || !active || scroll.scrollWidth <= scroll.clientWidth + 1) return;
  const maxScroll = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
  const padding = 8;
  const visibleLeft = scroll.scrollLeft + padding;
  const visibleRight = scroll.scrollLeft + scroll.clientWidth - padding;
  let target = scroll.scrollLeft;
  if (active.offsetLeft < visibleLeft) target = active.offsetLeft - padding;
  else if (active.offsetLeft + active.offsetWidth > visibleRight) target = active.offsetLeft + active.offsetWidth - scroll.clientWidth + padding;
  target = Math.min(maxScroll, Math.max(0, target));
  if (Math.abs(target - scroll.scrollLeft) < 1) return;
  scroll.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'auto' });
}
function scheduleTicketWalletFilterFocus(smooth = false) {
  requestAnimationFrame(() => requestAnimationFrame(() => focusTicketWalletFilter(smooth)));
}
function ticketWalletPhysicalEditAttrs(record, field, label, editable = true) {
  if (!editable) return '';
  return 'class="ticket-wallet-physical-edit-target" role="button" tabindex="0" data-ticket-wallet-id="' + escapeHtml(record.id) + '" data-ticket-wallet-edit-field="' + escapeHtml(field) + '" aria-label="' + escapeHtml((state.language === 'en' ? 'Edit ' : '编辑') + label) + '"';
}
function ticketWalletCafeJournalMarkup(record, editable = true) {
  const labelEnglish = state.language === 'en';
  const labelKind = normalizeTicketWalletDiningKind(record.diningKind, 'other');
  const labelMeta = TICKET_WALLET_DINING_KINDS[labelKind];
  const labelDate = ticketWalletDateLabel(record.departAt || record.createdAt, true);
  const labelShop = record.carrier || (labelEnglish ? 'Cafe name' : '店铺名称');
  const labelItem = record.cafeDrink || record.diningItem || (labelEnglish ? labelMeta.item[1] : labelMeta.item[0]);
  const labelMode = { 'dine-in': labelEnglish ? 'DINE IN' : '堂食', pickup: labelEnglish ? 'PICK UP' : '自取', delivery: labelEnglish ? 'DELIVERY' : '外送' }[record.drinkServiceMode] || (labelEnglish ? 'CAFE ORDER' : '咖啡订单');
  const labelOptions = [['drinkCategory', record.drinkCategory], ['drinkTemperature', record.drinkTemperature], ['drinkSize', record.drinkSize], ['drinkSweetness', record.drinkSweetness], ['drinkExtras', record.drinkExtras]].filter(([, value]) => value);
  const labelOptionMarkup = labelOptions.length
    ? labelOptions.map(([field, value]) => '<i ' + ticketWalletPhysicalEditAttrs(record, field, ticketWalletInlineFieldLabel(field), editable) + '>' + escapeHtml(value) + '</i>').join('')
    : '<i>' + (labelEnglish ? 'Add drink options' : '添加饮品规格') + '</i>';
  const labelPlace = record.cafeLocation || (labelEnglish ? 'Add store location' : '添加门店地点');
  const labelPrice = String(record.price || '').trim();
  const labelMood = record.cafeMood || (labelEnglish ? 'A little treat' : '今日一杯');
  const labelStars = [1, 2, 3, 4, 5].map((score) => editable
    ? '<button type="button" data-ticket-wallet-cafe-rate="' + score + '" data-ticket-wallet-id="' + escapeHtml(record.id) + '" aria-label="' + escapeHtml(labelEnglish ? 'Rate ' + score + ' out of 5' : '评 ' + score + ' 星') + '">' + (Number(record.cafeRating) >= score ? '★' : '☆') + '</button>'
    : '<i aria-hidden="true">' + (Number(record.cafeRating) >= score ? '★' : '☆') + '</i>').join('');
  const labelPhoto = record.sourceImageId && ticketWalletImageCache.get(record.sourceImageId)?.src
    ? '<button type="button" class="ticket-wallet-cup-label-photo" data-ticket-wallet-original="' + escapeHtml(record.id) + '" aria-label="' + escapeHtml(labelEnglish ? 'Open original' : '查看原件') + '"><img src="' + escapeHtml(ticketWalletImageCache.get(record.sourceImageId).src) + '" alt=""></button>'
    : '';
  if (labelKind === 'drink') return '<div class="ticket-wallet-physical-ticket ticket-wallet-physical-ticket-dining ticket-wallet-cafe-journal ticket-wallet-cup-label-ticket"><div class="ticket-wallet-cup-label-saved-top"><span ' + ticketWalletPhysicalEditAttrs(record, 'carrier', labelEnglish ? 'Cafe / brand' : '店铺 / 品牌', editable) + '>' + escapeHtml(labelShop) + '</span><b>' + escapeHtml(labelMode) + '</b></div><div class="ticket-wallet-cup-label-saved-number"><small>' + (labelEnglish ? 'PICK-UP NO.' : '取餐号码') + '</small><strong ' + ticketWalletPhysicalEditAttrs(record, 'ticketNo', labelEnglish ? 'Pickup number' : '取餐号', editable) + '>' + escapeHtml(record.ticketNo || '—') + '</strong></div><div class="ticket-wallet-cup-label-saved-drink"><small>' + escapeHtml(labelMeta.label[labelEnglish ? 1 : 0]) + (record.drinkCategory ? ' · ' + escapeHtml(record.drinkCategory) : '') + '</small><strong ' + ticketWalletPhysicalEditAttrs(record, 'cafeDrink', labelEnglish ? 'Drink name' : labelMeta.item[0], editable) + '>' + escapeHtml(labelItem) + '</strong></div><div class="ticket-wallet-cup-label-saved-options">' + labelOptionMarkup + '</div><div class="ticket-wallet-cup-label-saved-bottom"><span ' + ticketWalletPhysicalEditAttrs(record, 'departAt', labelEnglish ? 'Order time' : '下单时间', editable) + '>' + escapeHtml(labelDate) + '</span><span ' + ticketWalletPhysicalEditAttrs(record, 'cafeLocation', labelEnglish ? 'Location' : '门店地点', editable) + '>' + escapeHtml(labelPlace) + '</span></div><div class="ticket-wallet-cup-label-saved-footer"><span ' + ticketWalletPhysicalEditAttrs(record, 'cafeMood', labelEnglish ? 'Journal sticker' : '手帐贴纸', editable) + '>' + escapeHtml(labelMood) + '</span><span class="ticket-wallet-cafe-rating-stars">' + labelStars + '</span><strong ' + ticketWalletPhysicalEditAttrs(record, 'price', labelEnglish ? 'Spend' : '花费', editable) + '>' + escapeHtml(labelPrice || (labelEnglish ? 'Add spend' : '记下花费')) + '</strong></div>' + labelPhoto + '</div>';

  const english = state.language === 'en';
  const genericTitles = new Set(['餐饮', 'dining', 'coffee journal', '咖啡手帐', '餐饮记录']);
  const kind = normalizeTicketWalletDiningKind(record.diningKind, 'other');
  const kindMeta = TICKET_WALLET_DINING_KINDS[kind];
  const legacyTitle = String(record.title || '').trim();
  const shopName = record.carrier || (legacyTitle && !genericTitles.has(legacyTitle.toLowerCase()) ? legacyTitle : '');
  const drink = record.cafeDrink || record.diningItem || '';
  const itemLabel = kind === 'drink' ? (english ? 'TODAY I HAD' : '今天喝了') : (english ? 'TODAY I HAD' : '今天吃了');
  const itemPlaceholder = kind === 'drink' ? (english ? 'Add your drink' : '点这里记下饮品') : (english ? 'Add a dish' : '点这里记下餐点');
  const location = record.cafeLocation || record.from || record.to || '';
  const visitedAt = record.departAt || record.createdAt;
  const dateLabel = ticketWalletDateLabel(visitedAt, false);
  const rating = Math.min(5, Math.max(0, Number(record.cafeRating) || 0));
  const ratingStars = [1, 2, 3, 4, 5].map((score) => editable
    ? '<button type="button" data-ticket-wallet-cafe-rate="' + score + '" data-ticket-wallet-id="' + escapeHtml(record.id) + '" aria-label="' + escapeHtml(english ? 'Rate ' + score + ' out of 5' : '评 ' + score + ' 星') + '">' + (rating >= score ? '★' : '☆') + '</button>'
    : '<i aria-hidden="true">' + (rating >= score ? '★' : '☆') + '</i>').join('');
  const price = String(record.price || '').trim();
  const priceLabel = price ? (/^[¥￥$]/.test(price) ? price : '¥' + price) : (english ? 'Add spend' : '记下花费');
  const mood = record.cafeMood || (english ? 'A little treat' : '今日一杯');
  const photo = record.sourceImageId ? ticketWalletImageCache.get(record.sourceImageId) : null;
  const photoMarkup = photo?.src
    ? '<button type="button" class="ticket-wallet-cafe-photo" data-ticket-wallet-original="' + escapeHtml(record.id) + '" aria-label="' + escapeHtml(english ? 'Open dining photo or receipt' : '查看餐饮照片或小票') + '"><img src="' + escapeHtml(photo.src) + '" alt=""><span>' + (english ? 'SAVED' : '留存') + '</span></button>'
    : '<div class="ticket-wallet-cafe-photo ticket-wallet-cafe-photo-empty" aria-hidden="true"><span>' + kindMeta.icon + '</span><small>' + escapeHtml(kindMeta.label[english ? 1 : 0]) + '</small></div>';
  const sourceLabel = record.sourceImageId ? (english ? 'ATTACHMENT KEPT' : '素材已留存') : (english ? 'STICKER JOURNAL' : '贴纸手帐');
  const drinkTags = kind === 'drink' ? [['drinkCategory', record.drinkCategory], ['drinkTemperature', record.drinkTemperature], ['drinkSize', record.drinkSize], ['drinkSweetness', record.drinkSweetness]].filter(([, value]) => value) : [];
  const drinkTagsMarkup = drinkTags.length ? '<span class="ticket-wallet-cafe-tags" aria-label="' + escapeHtml(drinkTags.map(([, value]) => value).join(' · ')) + '">' + drinkTags.map(([field, value]) => '<i ' + ticketWalletPhysicalEditAttrs(record, field, ticketWalletInlineFieldLabel(field), editable) + '>' + escapeHtml(value) + '</i>').join('') + '</span>' : '';
  return '<div class="ticket-wallet-physical-ticket ticket-wallet-physical-ticket-dining ticket-wallet-cafe-journal"><div class="ticket-wallet-cafe-head"><div class="ticket-wallet-cafe-stamp" aria-hidden="true">' + kindMeta.icon + '</div><div class="ticket-wallet-cafe-heading"><small>' + escapeHtml(kindMeta.label[english ? 1 : 0].toUpperCase()) + ' · ' + (english ? 'JOURNAL' : '今日手帐') + '</small><strong ' + ticketWalletPhysicalEditAttrs(record, 'carrier', english ? 'Cafe / restaurant' : '店铺 / 餐厅', editable) + '>' + escapeHtml(shopName || (english ? 'Tap to add a place' : '点这里记下店铺')) + '</strong><span ' + ticketWalletPhysicalEditAttrs(record, 'departAt', english ? 'Visit date' : '到店时间', editable) + '>' + escapeHtml(dateLabel) + '</span></div><span class="ticket-wallet-cafe-source">' + sourceLabel + '</span></div><div class="ticket-wallet-cafe-body"><div class="ticket-wallet-cafe-copy"><small>' + itemLabel + '</small><strong ' + ticketWalletPhysicalEditAttrs(record, 'cafeDrink', itemLabel, editable) + '>' + escapeHtml(drink || itemPlaceholder) + '</strong>' + drinkTagsMarkup + '<span class="ticket-wallet-cafe-place" ' + ticketWalletPhysicalEditAttrs(record, 'cafeLocation', english ? 'Location' : '地点', editable) + '>' + escapeHtml(location || (english ? 'Add neighborhood' : '＋ 添加街区')) + '</span><span class="ticket-wallet-cafe-rating" aria-label="' + escapeHtml(rating ? (english ? rating + ' out of 5' : rating + ' 星') : (english ? 'Tap to rate' : '点击添加评分')) + '"><span class="ticket-wallet-cafe-rating-stars">' + ratingStars + '</span><small>' + (rating ? rating + '/5' : (english ? 'rate' : '评分')) + '</small></span></div>' + photoMarkup + '</div><div class="ticket-wallet-cafe-footer"><span ' + ticketWalletPhysicalEditAttrs(record, 'cafeMood', english ? 'Journal sticker' : '手帐贴纸', editable) + '><i aria-hidden="true">✳</i>' + escapeHtml(mood) + '</span><strong ' + ticketWalletPhysicalEditAttrs(record, 'price', english ? 'Spend' : '花费', editable) + '>' + escapeHtml(priceLabel) + '</strong></div></div>';
}
function ticketWalletPhysicalTicketMarkup(record, editable = true) {
  if (record.type === 'dining') return ticketWalletCafeJournalMarkup(record, editable);
  const meta = TICKET_TYPES[record.type] || TICKET_TYPES.other;
  const flightTemplate = record.type === 'flight' ? TICKET_WALLET_FLIGHT_TEMPLATES[record.template] : null;
  const flightClass = flightTemplate && flightTemplate.id !== 'standard-v1' ? ' ticket-wallet-flight-template-' + flightTemplate.id : '';
  const flightMark = flightTemplate?.shortBrand ? '<span class="ticket-wallet-physical-icon ticket-wallet-airline-mark" aria-hidden="true">' + escapeHtml(flightTemplate.shortBrand) + '</span>' : '<span class="ticket-wallet-physical-icon">' + meta.icon + '</span>';
  const displayCarrier = record.carrier || flightTemplate?.carrier || record.title || ticketTypeLabel(record.type);
  const watermark = { flight: 'BOARDING PASS', car: 'ROAD TICKET', ferry: 'FERRY PASS', movie: 'CINEMA TICKET', admission: 'ADMISSION', dining: 'DINING ORDER', other: 'ONEBOX TICKET' }[record.type] || 'ONEBOX TICKET';
  const from = record.from || (record.type === 'dining' ? record.carrier || '门店' : '出发地');
  const to = record.to || (record.type === 'dining' ? '订单' : '目的地');
  const detailField = record.ticketNo ? 'ticketNo' : 'seat';
  const detail = record.seat || record.ticketNo || record.passenger || '待补充';
  const code = record.ticketCode || record.ticketNo || record.id;
  return '<div class="ticket-wallet-physical-ticket ticket-wallet-physical-ticket-' + record.type + flightClass + '"><span class="ticket-wallet-physical-watermark">' + watermark + '</span><div class="ticket-wallet-physical-head">' + flightMark + '<div><small class="ticket-wallet-type-label-badge">' + escapeHtml(ticketTypeLabel(record.type)) + '</small><strong>' + escapeHtml(displayCarrier) + '</strong></div><span class="ticket-wallet-source">' + (record.sourceImageId ? escapeHtml(t('ticketWalletSourceReady')) : '电子票证') + '</span></div><div class="ticket-wallet-physical-route"><div><small>' + escapeHtml(record.type === 'movie' || record.type === 'admission' ? '项目' : '出发') + '</small><strong ' + ticketWalletPhysicalEditAttrs(record, 'from', t('ticketWalletFrom'), editable) + '>' + escapeHtml(from) + '</strong></div><span class="ticket-wallet-physical-arrow">→</span><div class="ticket-wallet-physical-route-end"><small>' + escapeHtml(record.type === 'movie' || record.type === 'admission' ? '场次' : '到达') + '</small><strong ' + ticketWalletPhysicalEditAttrs(record, 'to', t('ticketWalletTo'), editable) + '>' + escapeHtml(to) + '</strong></div></div><div class="ticket-wallet-physical-meta"><span><small>时间</small><strong ' + ticketWalletPhysicalEditAttrs(record, 'departAt', t('ticketWalletDepart'), editable) + '>' + escapeHtml(ticketWalletDateLabel(record.departAt)) + '</strong></span><span><small>' + escapeHtml(record.type === 'dining' ? '订单信息' : '座位 / 票号') + '</small><strong ' + ticketWalletPhysicalEditAttrs(record, detailField, detailField === 'ticketNo' ? t('ticketWalletTicketNo') : t('ticketWalletSeat'), editable) + '>' + escapeHtml(detail) + '</strong></span></div><div class="ticket-wallet-physical-footer"><span ' + ticketWalletPhysicalEditAttrs(record, 'ticketCode', t('ticketWalletCode'), editable) + '>' + escapeHtml(code) + '</span><i aria-hidden="true"></i></div></div>';
}
function ticketWalletCardActionButtons(record) {
  return '<button class="ghost" data-ticket-wallet-edit="' + escapeHtml(record.id) + '">' + escapeHtml(t('ticketWalletEdit')) + '</button><button class="ghost" disabled aria-disabled="true" title="' + escapeHtml(t('ticketWalletAppleHint')) + '">' + escapeHtml(t('ticketWalletApple')) + '</button><button class="ghost danger" data-ticket-wallet-delete="' + escapeHtml(record.id) + '">' + escapeHtml(t('ticketWalletDelete')) + '</button>';
}
function ticketWalletSwipeActionButtons(record, detail = false) {
  if (!detail) return '';
  const id = escapeHtml(record.id);
  return '<button type="button" disabled aria-disabled="true" title="' + escapeHtml(t('ticketWalletAppleHint')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2"></rect><path d="M3.5 9h17M16 14h2"></path></svg><span>' + escapeHtml(t('ticketWalletApple')) + '</span></button><button type="button" class="danger" data-ticket-wallet-delete="' + id + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M7.5 7l.8 13h7.4l-.8-13M10 11v5M14 11v5"></path></svg><span>' + escapeHtml(t('ticketWalletDelete')) + '</span></button>';
}
function ticketWalletTrainCardMarkup(record, index, contextClass = '', contextStyle = '', interactive = false) {
  const source = record.sourceImageId ? ticketWalletImageCache.get(record.sourceImageId) : null;
  const sourceHint = source?.src ? t('ticketWalletSourceReady') : record.sourceImageId ? t('ticketWalletSourceMissing') : '';
  const swipeButtons = ticketWalletSwipeActionButtons(record, interactive);
  const rowAttributes = interactive ? '' : ' data-swipe-row data-ticket-wallet-pack-row="true"';
  return '<div class="swipe-row ticket-wallet-swipe-row ticket-wallet-swipe-row-train' + (contextClass ? ' ' + contextClass : '') + '"' + rowAttributes + ' style="--ticket-stack-index:' + index + ';' + contextStyle + '"><article class="ticket-wallet-card ticket-wallet-card-train ticket-wallet-train-card swipe-content" data-ticket-wallet-card="' + escapeHtml(record.id) + '"><span class="ticket-wallet-train-type-badge">' + TICKET_TYPES.train.icon + '<span>' + escapeHtml(ticketTypeLabel(record.type)) + '</span></span>' + ticketWalletTrainTemplateMarkup(ticketWalletTrainTemplateData(record), sourceHint, interactive) + '</article>' + '</div>';
}
function ticketWalletCardMarkup(record, index, contextClass = '', contextStyle = '') {
  const interactive = contextClass.includes('ticket-wallet-detail-row');
  if (record.type === 'train') return ticketWalletTrainCardMarkup(record, index, contextClass, contextStyle, interactive);
  const swipeButtons = ticketWalletSwipeActionButtons(record, interactive);
  const rowAttributes = interactive ? '' : ' data-swipe-row data-ticket-wallet-pack-row="true"';
  return '<div class="swipe-row ticket-wallet-swipe-row' + (contextClass ? ' ' + contextClass : '') + '"' + rowAttributes + ' style="--ticket-stack-index:' + index + ';' + contextStyle + '"><article class="ticket-wallet-card ticket-wallet-card-' + record.type + ' ticket-wallet-card-physical swipe-content" data-ticket-wallet-card="' + escapeHtml(record.id) + '">' + ticketWalletPhysicalTicketMarkup(record, interactive) + '</article>' + '</div>';
}
function ticketWalletFocusPeekMarkup(record, index, contextClass = '', contextStyle = '') {
  const from = record.from || (record.type === 'dining' ? record.carrier || '门店' : '出发地');
  const to = record.to || (record.type === 'dining' ? '订单' : '目的地');
  const number = record.trainNo || record.flightNo || record.ticketNo || record.title || ticketTypeLabel(record.type);
  const serial = record.ticketSerial || record.ticketNo || record.id;
  const buttons = ticketWalletSwipeActionButtons(record);
  const kind = record.type === 'train' ? 'train' : 'generic';
  const template = record.template === 'crh-blue-v1' ? 'blue' : 'pink';
  return '<div class="swipe-row ticket-wallet-swipe-row ticket-wallet-focus-peek-row ' + contextClass + '" data-swipe-row style="--ticket-stack-index:' + index + ';' + contextStyle + '"><article class="ticket-wallet-focus-peek ticket-wallet-focus-peek-' + kind + ' ticket-wallet-focus-peek-' + template + ' swipe-content" data-ticket-wallet-card="' + escapeHtml(record.id) + '"><small>' + escapeHtml(serial) + '</small><div><strong>' + escapeHtml(from) + '</strong><span>' + escapeHtml(number) + ' <i aria-hidden="true">→</i></span><strong>' + escapeHtml(to) + '</strong></div></article><div class="ticket-wallet-swipe-actions" aria-label="票据操作">' + buttons + '</div></div>';
}
let ticketWalletMapReturnContext = null;
function returnFromTicketWalletMap() {
  const context = ticketWalletMapReturnContext;
  if (!context) return false;
  ticketWalletMapReturnContext = null;
  ticketWalletMapFocusId = '';
  state.ticketWalletView = 'tickets';
  state.ticketWalletTypeFilter = context.filter;
  state.ticketWalletSelectedId = state.ticketWallet.find((record) => record.id === context.id) ? context.id : '';
  saveTicketWalletTypeFilter();
  render();
  return true;
}
function ticketWalletDetailInfoMarkup(record) {
  const english = state.language === 'en';
  const id = escapeHtml(record.id);
  const hasLocation = Boolean((TICKET_WALLET_TRAVEL_TYPES.includes(record.type) && record.from && record.to) || ticketWalletMapPlaceEntry(record));
  const icon = (paths) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + paths + '</svg>';
  const action = (label, attr, paths, enabled = true, extra = '', hint = '') => '<button type="button" class="ticket-wallet-detail-tool ' + extra + '" ' + (enabled ? attr + '="' + id + '"' : 'disabled aria-disabled="true" title="' + escapeHtml(hint) + '"') + '>' + icon(paths) + '<span>' + label + '</span></button>';
  const notes = String(record.notes || '').trim();
  return '<section class="ticket-wallet-detail-info ticket-wallet-detail-utilities" aria-label="' + (english ? 'Ticket actions' : '票据操作') + '"><div class="ticket-wallet-detail-toolbar ticket-wallet-detail-toolbar-all">'
    + action(english ? 'Attachment' : '附件', 'data-ticket-wallet-original', '<rect x="3.5" y="4" width="17" height="16" rx="2"></rect><circle cx="8.5" cy="9" r="1.5"></circle><path d="m4 17 4-4 3 3 2-2 7 5"></path>', Boolean(record.sourceImageId))
    + action(english ? 'Map' : '地图', 'data-ticket-wallet-map-locate', '<circle cx="12" cy="12" r="8.5"></circle><path d="m15.5 8.5-2.1 5-4.9 2 2-4.9 5-2.1Z"></path>', hasLocation)
    + action(english ? 'Apple Wallet' : '苹果钱包', 'data-ticket-wallet-apple', '<rect x="3.5" y="5.5" width="17" height="13" rx="2"></rect><path d="M3.5 9h17M16 14h2"></path>', false, '', t('ticketWalletAppleHint'))
    + action(english ? 'Delete' : '删除', 'data-ticket-wallet-delete', '<path d="M5 7h14M9 7V4h6v3M7.5 7l.8 13h7.4l-.8-13M10 11v5M14 11v5"></path>', true, 'danger')
    + '</div>' + '<section class="ticket-wallet-notes-panel" aria-label="' + (english ? 'Notes' : '备注') + '"><div class="ticket-wallet-notes-heading"><strong>' + (english ? 'Notes' : '备注') + '</strong><button type="button" data-ticket-wallet-notes="' + id + '" aria-label="' + (english ? 'Edit notes' : '编辑备注') + '">' + icon('<path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6Z"></path>') + '<span>' + (english ? (notes ? 'Edit' : 'Add') : (notes ? '编辑' : '添加')) + '</span></button></div><div class="ticket-wallet-notes-content">' + escapeHtml(notes || (english ? 'No notes yet' : '暂无备注')) + '</div></section>' + '</section>';
}
function ticketWalletStackDensity(count) {
  const size = Math.max(1, Number(count) || 1);
  if (size === 1) return 'single';
  if (size === 2) return 'pair';
  if (size === 3) return 'trio';
  if (size === 4) return 'quad';
  if (size === 5) return 'five';
  return 'many';
}
function ticketWalletStackPeek(count) {
  const size = Math.max(1, Number(count) || 1);
  if (size === 1) return 0;
  // Keep the requested 60px reveal for a normal pack. For unusually large
  // packs, reduce only the vertical step so the stack remains usable.
  if (size <= 6) return 60;
  return Math.max(8, Math.floor(360 / (size - 1)));
}
function ticketWalletStackAttrs(count) {
  return 'data-ticket-stack-count="' + Math.max(1, Number(count) || 1) + '" data-ticket-stack-density="' + ticketWalletStackDensity(count) + '"';
}
function ticketWalletStackStyle(count) {
  const size = Math.max(1, Number(count) || 1);
  const peek = ticketWalletStackPeek(size);
  const bottom = 32 + size * peek;
  // Keep the pack step on the stack itself. Older responsive rules also set
  // --ticket-stack-peek on train rows, which made the row transform use a
  // different step from the stack's reserved space in Safari.
  return '--ticket-stack-count:' + size + ';--ticket-stack-peek:' + peek + 'px;--ticket-stack-step:' + peek + 'px;--ticket-stack-bottom:' + bottom + 'px';
}
function ticketWalletDetailReturnPackMarkup(records, selectedId) {
  return '<div class="ticket-wallet-return-pack ticket-wallet-stack-section" aria-hidden="true"><div class="ticket-wallet-stack ticket-wallet-return-pack-stack" ' + ticketWalletStackAttrs(records.length) + ' style="' + ticketWalletStackStyle(records.length) + '">' + records.map((item, index) => item.id === selectedId ? '' : ticketWalletCardMarkup(item, index)).join('') + '</div></div>';
}
function ticketWalletDetailMarkup(record, records = [record]) {
  const closeLabel = state.language === 'en' ? 'Close ticket detail' : '关闭票据详情';
  const closeIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg>';
  return '<div class="ticket-wallet-detail-view" data-ticket-wallet-detail="' + escapeHtml(record.id) + '">' + ticketWalletDetailReturnPackMarkup(records, record.id) + '<div class="ticket-wallet-detail-card-shell"><button type="button" class="ticket-wallet-detail-close" data-ticket-wallet-clear-selection aria-label="' + escapeHtml(closeLabel) + '">' + closeIcon + '</button>' + ticketWalletCardMarkup(record, 0, 'ticket-wallet-detail-row', '--ticket-stack-index:0;') + '</div>' + ticketWalletDetailInfoMarkup(record) + '</div>';
}
function ticketWalletStackMarkup(records) {
  const selectedRecord = records.find((record) => record.id === state.ticketWalletSelectedId);
  if (selectedRecord) return ticketWalletDetailMarkup(selectedRecord, records);
  return ticketWalletDateGroupedPackMarkup(records);
}
function ticketWalletPackStackMarkup(records) {
  return '<div class="ticket-wallet-stack" ' + ticketWalletStackAttrs(records.length) + ' style="' + ticketWalletStackStyle(records.length) + '">' + records.map((record, index) => ticketWalletCardMarkup(record, index)).join('') + '</div>';
}
function syncTicketWalletFocusStack() {
  const stack = $('.ticket-wallet-focus-stack');
  const selected = stack?.querySelector('.ticket-wallet-focus-selected');
  if (!stack || !selected) return;
  const height = selected.getBoundingClientRect().height;
  if (height > 0) {
    stack.style.setProperty('--ticket-focus-selected-height', height + 'px');
    const stackTop = stack.getBoundingClientRect().top;
    const maxBottom = Math.max(...Array.from(stack.querySelectorAll('[data-swipe-row]')).map((row) => row.getBoundingClientRect().bottom - stackTop));
    if (maxBottom > 0) stack.style.height = maxBottom + 'px';
  }
}
function ticketWalletDiningKindFilterMarkup(records) {
  if (normalizeTicketWalletFilter(state.ticketWalletTypeFilter) !== 'dining') return '';
  const dining = records.filter((record) => ticketWalletCategoryForType(record.type) === 'dining');
  const options = [{ key: 'all', label: state.language === 'en' ? 'All dining' : '全部' }, ...Object.entries(TICKET_WALLET_DINING_KINDS).map(([key, item]) => ({ key, label: item.label[state.language === 'en' ? 1 : 0], icon: item.icon }))];
  return '<nav class="ticket-wallet-dining-filter" aria-label="' + (state.language === 'en' ? 'Dining types' : '餐饮细类') + '">' + options.map((item) => {
    const count = item.key === 'all' ? dining.length : dining.filter((record) => normalizeTicketWalletDiningKind(record.diningKind) === item.key).length;
    const active = state.ticketWalletDiningKindFilter === item.key;
    return '<button type="button" class="ticket-wallet-dining-filter-option' + (active ? ' active' : '') + '" data-ticket-wallet-dining-kind-filter="' + item.key + '" aria-pressed="' + active + '">' + (item.icon ? '<span aria-hidden="true">' + item.icon + '</span>' : '') + '<span>' + escapeHtml(item.label) + '</span><b>' + count + '</b></button>';
  }).join('') + '</nav>';
}
function ticketWalletFilteredRecords(records) {
  const category = normalizeTicketWalletFilter(state.ticketWalletTypeFilter);
  const categorized = category === 'all' ? records : records.filter((record) => ticketWalletCategoryForType(record.type) === category);
  if (category !== 'dining' || state.ticketWalletDiningKindFilter === 'all') return categorized;
  return categorized.filter((record) => normalizeTicketWalletDiningKind(record.diningKind) === normalizeTicketWalletDiningKindFilter(state.ticketWalletDiningKindFilter));
}
function ticketWalletMapRecords(records) {
  return ticketWalletFilteredRecords(records).filter((record) => TICKET_WALLET_TRAVEL_TYPES.includes(record.type) && record.from && record.to);
}
function ticketWalletMapJourneys(records) {
  return ticketWalletJourneys(ticketWalletMapRecords(records)).flatMap((group) => {
    const byType = new Map();
    group.records.forEach((record) => {
      if (!byType.has(record.type)) byType.set(record.type, []);
      byType.get(record.type).push(record);
    });
    return [...byType.entries()].map(([type, typedRecords]) => ({ ...group, key: group.key + '|type:' + type, type, records: typedRecords }));
  });
}
function ticketWalletMapPlaceEntry(record) {
  const category = ticketWalletCategoryForType(record.type);
  if (category !== 'entertainment' && category !== 'dining') return null;
  const location = String(category === 'dining' ? record.cafeLocation || record.carrier || record.from : record.carrier || '').trim();
  if (!location) return null;
  return { key: 'place|' + record.id, location, type: category, group: { key: 'place|' + record.id, from: location, to: '', records: [record] } };
}
function ticketWalletMapPlaceEntries(records) {
  return ticketWalletFilteredRecords(records).map(ticketWalletMapPlaceEntry).filter(Boolean);
}
function ticketWalletDisplayRecords(records) {
  const available = new Map(records.map((record) => [record.id, record]));
  const rememberedIds = Array.isArray(state.ticketWalletDisplayOrder) ? state.ticketWalletDisplayOrder : [];
  const stableIds = rememberedIds.filter((id) => available.has(id));
  const stableIdSet = new Set(stableIds);
  const newRecords = records.filter((record) => !stableIdSet.has(record.id)).sort(ticketWalletDepartureAsc);
  const nextIds = stableIds.concat(newRecords.map((record) => record.id));
  state.ticketWalletDisplayOrder = nextIds;
  return nextIds.map((id) => available.get(id)).filter(Boolean);
}
function ticketWalletDateGroups(records) {
  const now = Date.now();
  const upcoming = [];
  const unscheduled = [];
  const past = new Map();
  records.forEach((record) => {
    const timestamp = ticketWalletDepartureTimestamp(record);
    if (timestamp === Number.NEGATIVE_INFINITY) { unscheduled.push(record); return; }
    if (timestamp >= now) { upcoming.push(record); return; }
    const date = new Date(timestamp);
    const key = date.getFullYear() + '-' + pad(date.getMonth() + 1);
    if (!past.has(key)) past.set(key, []);
    past.get(key).push(record);
  });
  const groups = [];
  if (upcoming.length) groups.push({ key: 'upcoming', kind: 'upcoming', records: upcoming });
  if (unscheduled.length) groups.push({ key: 'unscheduled', kind: 'unscheduled', records: unscheduled });
  [...past.entries()].sort(([first], [second]) => second.localeCompare(first)).forEach(([key, items]) => groups.push({ key, kind: 'past', records: items }));
  return groups;
}
function ticketWalletDateGroupLabel(group) {
  if (group.kind === 'upcoming') return state.language === 'en' ? 'Upcoming' : '待出行';
  if (group.kind === 'unscheduled') return state.language === 'en' ? 'No date yet' : '待补充日期';
  const [year, month] = group.key.split('-').map(Number);
  return state.language === 'en' ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1)) : year + '年' + month + '月';
}
function ticketWalletDateGroupedPackMarkup(records) {
  const groups = ticketWalletDateGroups(records);
  const latestPast = groups.find((group) => group.kind === 'past')?.key;
  return '<div class="ticket-wallet-date-groups">' + groups.map((group) => {
    const count = group.records.length;
    const open = group.kind !== 'past' || group.key === latestPast;
    const heading = '<span class="ticket-wallet-date-group-heading"><strong>' + escapeHtml(ticketWalletDateGroupLabel(group)) + '</strong><small>' + count + ' ' + escapeHtml(state.language === 'en' ? (count === 1 ? 'ticket' : 'tickets') : '张') + '</small></span>';
    const stack = ticketWalletPackStackMarkup(group.records);
    if (group.kind === 'past') return '<details class="ticket-wallet-date-group ticket-wallet-date-group-archive" data-ticket-wallet-date-group="' + group.key + '"' + (open ? ' open' : '') + '><summary>' + heading + '<span class="ticket-wallet-date-group-chevron" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg></span></summary>' + stack + '</details>';
    return '<section class="ticket-wallet-date-group ticket-wallet-date-group-' + group.kind + '"><div class="ticket-wallet-date-group-title">' + heading + '</div>' + stack + '</section>';
  }).join('') + '</div>';
}
function renderTicketWalletMemoryEditor() {
  const draft = state.ticketWalletMemoryDraft; if (!draft) return '';
  const image = draft.imageId ? ticketWalletImageCache.get(draft.imageId) : null;
  return '<section class="ticket-wallet-memory-editor"><div class="ticket-wallet-editor-head"><div><h2>' + escapeHtml(t(draft.title ? 'ticketWalletEditMemory' : 'ticketWalletAddMemory')) + '</h2></div><button class="icon-btn small" data-ticket-wallet-memory-cancel aria-label="' + escapeHtml(t('ticketWalletCancel')) + '">×</button></div>' + ticketWalletField(t('ticketWalletMemoryTitle'), 'ticketWalletMemoryTitle', draft.title) + '<label class="ticket-wallet-field ticket-wallet-field-wide"><span>' + escapeHtml(t('ticketWalletMemoryDescription')) + '</span><textarea id="ticketWalletMemoryDescription" rows="5">' + escapeHtml(draft.description || '') + '</textarea></label><div class="ticket-wallet-memory-image">' + (image?.src ? '<img src="' + escapeHtml(image.src) + '" alt="">' : '') + '<button class="secondary" data-ticket-wallet-memory-image>' + escapeHtml(t('ticketWalletImportImage')) + '</button></div><div class="ticket-wallet-editor-actions"><button class="secondary" data-ticket-wallet-memory-cancel>' + escapeHtml(t('ticketWalletCancel')) + '</button><button class="primary" data-ticket-wallet-memory-save>' + escapeHtml(t('ticketWalletMemorySave')) + '</button></div><input id="ticketWalletMemoryImageInput" type="file" accept="image/*" hidden></section>';
}
function ticketWalletMapPoint(name, index = 0) {
  const known = { 北京: [118, 48], 上海: [520, 174], 苏州: [478, 158], 南京: [385, 132], 杭州: [486, 218], 广州: [390, 236], 深圳: [425, 250], 西安: [238, 138], 成都: [164, 214], 武汉: [330, 182], 青岛: [526, 92], 厦门: [482, 258] };
  const key = Object.keys(known).find((city) => String(name || '').includes(city));
  if (key) return { x: known[key][0], y: known[key][1] };
  let hash = 0; for (const char of String(name || '') + index) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return { x: 80 + (hash % 520), y: 48 + ((hash * 7) % 175) };
}
function ticketWalletLegacyMapMarkup(journeys) {
  const colors = ['#4863ee', '#0a9c91', '#d38333', '#8b6adf', '#d35f8a', '#4c8fbe'];
  const routes = journeys.map((group, index) => {
    const from = ticketWalletMapPoint(group.from, index); const to = ticketWalletMapPoint(group.to, index + 11);
    const lane = (index - (journeys.length - 1) / 2) * 13; const control = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 + lane };
    const color = colors[index % colors.length];
    return '<g class="ticket-wallet-map-route" style="--route-color:' + color + '"><path d="M ' + from.x + ' ' + from.y + ' Q ' + control.x.toFixed(1) + ' ' + control.y.toFixed(1) + ' ' + to.x + ' ' + to.y + '" fill="none"/><circle cx="' + from.x + '" cy="' + from.y + '" r="5"/><circle cx="' + to.x + '" cy="' + to.y + '" r="5"/><text x="' + from.x + '" y="' + (from.y - 12) + '">' + escapeHtml(group.from || '起点') + '</text><text x="' + to.x + '" y="' + (to.y - 12) + '">' + escapeHtml(group.to || '终点') + '</text></g>';
  }).join('');
  return '<section class="ticket-wallet-route-map"><div class="ticket-wallet-route-map-head"><div><span class="ticket-wallet-eyebrow">ONEBOX JOURNEY</span><h2>' + escapeHtml(state.language === 'en' ? 'Travel routes' : '旅迹地图') + '</h2></div><span>' + journeys.length + (state.language === 'en' ? ' routes' : ' 条路线') + '</span></div><div class="ticket-wallet-route-map-canvas"><svg viewBox="0 0 680 280" role="img" aria-label="' + escapeHtml(state.language === 'en' ? 'Journey routes' : '旅迹路线') + '"><path class="ticket-wallet-map-coast" d="M48 36c90-20 156 9 217-7s105 17 167 7 122 16 196 1M42 241c81 13 152-9 215 3s132-9 194 1 119-11 188 1M78 80c86 22 140 6 221 18s131-17 218 1 91 9 122 3M72 184c75-18 132 14 213 0s137-9 221 2 91-1 128-13"/><g class="ticket-wallet-map-grid"><path d="M80 25v230M180 25v230M280 25v230M380 25v230M480 25v230M580 25v230M30 75h620M30 135h620M30 195h620M30 255h620"/></g>' + routes + '</svg></div><div class="ticket-wallet-route-map-note">' + escapeHtml(state.language === 'en' ? 'Routes are grouped by trip and offset automatically when multiple lines overlap.' : '按旅程分组，多条路线重合时会自动错开显示。') + '</div></section>';
}
const TICKET_WALLET_LEAFLET_VERSION = '1.9.4';
const TICKET_WALLET_LEAFLET_ASSETS = Object.freeze([
  { css: 'https://cdn.jsdelivr.net/npm/leaflet@' + TICKET_WALLET_LEAFLET_VERSION + '/dist/leaflet.css', js: 'https://cdn.jsdelivr.net/npm/leaflet@' + TICKET_WALLET_LEAFLET_VERSION + '/dist/leaflet.js' },
  { css: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/' + TICKET_WALLET_LEAFLET_VERSION + '/leaflet.css', js: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/' + TICKET_WALLET_LEAFLET_VERSION + '/leaflet.js' },
  { css: 'https://unpkg.com/leaflet@' + TICKET_WALLET_LEAFLET_VERSION + '/dist/leaflet.css', js: 'https://unpkg.com/leaflet@' + TICKET_WALLET_LEAFLET_VERSION + '/dist/leaflet.js' }
]);
const TICKET_WALLET_CITY_COORDINATES = Object.freeze({ 北京: [39.9042, 116.4074], 上海: [31.2304, 121.4737], 苏州: [31.2989, 120.5853], 南京: [32.0603, 118.7969], 杭州: [30.2741, 120.1551], 广州: [23.1291, 113.2644], 深圳: [22.5431, 114.0579], 西安: [34.3416, 108.9398], 成都: [30.5728, 104.0668], 武汉: [30.5928, 114.3055], 青岛: [36.0671, 120.3826], 厦门: [24.4798, 118.0894], 天津: [39.3434, 117.3616], 重庆: [29.5630, 106.5516], 郑州: [34.7466, 113.6254], 济南: [36.6512, 117.1201], 合肥: [31.8206, 117.2272], 福州: [26.0745, 119.2965], 昆明: [25.0389, 102.7183], 长沙: [28.2282, 112.9388], 南昌: [28.6820, 115.8579], 沈阳: [41.8057, 123.4315], 大连: [38.9140, 121.6147], 哈尔滨: [45.8038, 126.5349], 石家庄: [38.0428, 114.5149], 太原: [37.8706, 112.5489], 兰州: [36.0611, 103.8343], 乌鲁木齐: [43.8256, 87.6168], 贵阳: [26.6470, 106.6302], 桂林: [25.2742, 110.2900], 宁波: [29.8683, 121.5440], 无锡: [31.4912, 120.3119], 常州: [31.8107, 119.9737], 嘉兴: [30.7461, 120.7555], 温州: [27.9949, 120.6994], 金华: [29.0895, 119.6495], 徐州: [34.2044, 117.2858], 洛阳: [34.6197, 112.4540], 珠海: [22.2710, 113.5767], 惠州: [23.1115, 114.4152], 海口: [20.0442, 110.1999], 三亚: [18.2528, 109.5119], 拉萨: [29.6500, 91.1000], 呼和浩特: [40.8426, 111.7492], 银川: [38.4872, 106.2309], 西宁: [36.6171, 101.7782] });
let ticketWalletLeafletPromise = null; let ticketWalletLeafletMap = null; let ticketWalletLeafletMapElement = null; let ticketWalletLeafletPendingElement = null; let ticketWalletLeafletRenderToken = 0; let ticketWalletGeocodeNextAt = 0; let ticketWalletMapViewportContext = null; let ticketWalletMapFocusId = '';
const ticketWalletGeocodePromises = new Map();
function ticketWalletMapPlaceKey(value) {
  const text = String(value || '').trim().replace(/[（(].*?[）)]/g, '').replace(/\s+/g, '');
  const aliases = [['上海虹桥', '上海'], ['杭州东', '杭州'], ['南京南', '南京'], ['北京南', '北京'], ['广州南', '广州'], ['深圳北', '深圳']];
  const alias = aliases.find(([station]) => text.includes(station));
  return alias ? alias[1] : text.replace(/(?:车站|火车站|站|机场|码头)$/g, '');
}
function ticketWalletMapCache() { return parseStored(STORAGE.ticketWalletMapCache, {}) || {}; }
function saveTicketWalletMapCache(cache) { try { localStorage.setItem(STORAGE.ticketWalletMapCache, JSON.stringify(cache)); } catch { /* private mode can deny storage */ } }
const TICKET_WALLET_ROUTE_STYLES = Object.freeze({
  train: { color: '#4863ee', dash: '' },
  flight: { color: '#8b6adf', dash: '3 6' },
  car: { color: '#d38333', dash: '10 4 2 4' },
  ferry: { color: '#0a9c91', dash: '2 6' },
});
const TICKET_WALLET_ROUTE_LABELS = Object.freeze({ train: ['火车路线', 'Train route'], flight: ['飞机路线', 'Flight route'], car: ['汽车路线', 'Car route'], ferry: ['轮船路线', 'Ferry route'] });
const TICKET_WALLET_PLACE_STYLES = Object.freeze({ entertainment: { color: '#9258cc', icon: TICKET_TYPES.movie.icon }, dining: { color: '#c78635', icon: TICKET_TYPES.dining.icon } });
function ticketWalletMapItemStyle(type) { return TICKET_WALLET_PLACE_STYLES[type] || TICKET_WALLET_ROUTE_STYLES[type] || TICKET_WALLET_ROUTE_STYLES.train; }
function ticketWalletMapItemIcon(type) { return TICKET_WALLET_PLACE_STYLES[type]?.icon || TICKET_TYPES[type]?.icon || TICKET_TYPES.other.icon; }
function ticketWalletMapRouteType(group) { return group.records.find((record) => TICKET_WALLET_TRAVEL_TYPES.includes(record.type))?.type || 'train'; }
function ticketWalletMapLegendMarkup() {
  const category = normalizeTicketWalletFilter(state.ticketWalletTypeFilter);
  const entries = [];
  if (category === 'all' || category === 'travel') TICKET_WALLET_TRAVEL_TYPES.forEach((type) => {
    entries.push('<span class="ticket-wallet-map-legend-item ticket-wallet-map-legend-' + type + '"><span class="ticket-wallet-map-legend-icon" aria-hidden="true">' + TICKET_TYPES[type].icon + '</span><span>' + escapeHtml(TICKET_WALLET_ROUTE_LABELS[type][state.language === 'en' ? 1 : 0]) + '</span><i aria-hidden="true"></i></span>');
  });
  if (category === 'all' || category === 'entertainment') entries.push('<span class="ticket-wallet-map-legend-item ticket-wallet-map-legend-entertainment"><span class="ticket-wallet-map-legend-icon" aria-hidden="true">' + TICKET_WALLET_PLACE_STYLES.entertainment.icon + '</span><span>' + escapeHtml(state.language === 'en' ? 'Entertainment venues' : '娱乐地点') + '</span><b aria-hidden="true"></b></span>');
  if (category === 'all' || category === 'dining') entries.push('<span class="ticket-wallet-map-legend-item ticket-wallet-map-legend-dining"><span class="ticket-wallet-map-legend-icon" aria-hidden="true">' + TICKET_WALLET_PLACE_STYLES.dining.icon + '</span><span>' + escapeHtml(state.language === 'en' ? 'Dining venues' : '餐饮地点') + '</span><b aria-hidden="true"></b></span>');
  return entries.length ? '<div class="ticket-wallet-map-legend" aria-label="' + escapeHtml(state.language === 'en' ? 'Map legend' : '地图图例') + '">' + entries.join('') + '</div>' : '';
}
function ticketWalletMapPopupElement(group, label) {
  const groups = (Array.isArray(group) ? group : [group]).filter(Boolean);
  const records = [...new Map(groups.flatMap((item) => item.records || []).map((record) => [record.id, record])).values()];
  const element = document.createElement('div'); const strong = document.createElement('strong'); strong.textContent = label;
  const small = document.createElement('small'); small.textContent = records.length + (state.language === 'en' ? (records.length === 1 ? ' ticket' : ' tickets') : ' 张票据');
  element.append(strong, document.createElement('br'), small);
  records.forEach((record) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'ticket-wallet-map-popup-ticket'; button.dataset.ticketWalletMapTicket = record.id;
    button.textContent = ticketTypeLabel(record.type) + ' · ' + (record.title || [record.from, record.to].filter(Boolean).join(' → ') || ticketTypeLabel(record.type));
    button.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation(); ticketWalletMapFocusId = '';
      state.ticketWalletTypeFilter = ticketWalletCategoryForType(record.type); saveTicketWalletTypeFilter(); state.ticketWalletView = 'tickets'; state.ticketWalletSelectedId = record.id; state.ticketWalletEditorOpen = false;
      render();
    });
    element.appendChild(button);
  });
  return element;
}
async function ticketWalletGeocodePlace(value) {
  const key = ticketWalletMapPlaceKey(value); if (!key) return null;
  const cache = ticketWalletMapCache(); if (Array.isArray(cache[key])) return cache[key];
  const local = Object.entries(TICKET_WALLET_CITY_COORDINATES).find(([city]) => key.includes(city) || city.includes(key));
  if (local) { cache[key] = local[1]; saveTicketWalletMapCache(cache); return local[1]; }
  if (ticketWalletGeocodePromises.has(key)) return ticketWalletGeocodePromises.get(key);
  const promise = (async () => { const wait = Math.max(0, ticketWalletGeocodeNextAt - Date.now()); if (wait) await new Promise((resolve) => setTimeout(resolve, wait)); ticketWalletGeocodeNextAt = Date.now() + 1000; const response = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=zh-CN&countrycodes=cn&q=' + encodeURIComponent(String(value || key) + ', 中国'), { headers: { Accept: 'application/json' } }); const items = response.ok ? await response.json() : []; const item = items?.[0]; const coordinates = item && Number.isFinite(Number(item.lat)) && Number.isFinite(Number(item.lon)) ? [Number(item.lat), Number(item.lon)] : null; if (coordinates) { const nextCache = ticketWalletMapCache(); nextCache[key] = coordinates; saveTicketWalletMapCache(nextCache); } return coordinates; })().catch(() => null).finally(() => ticketWalletGeocodePromises.delete(key));
  ticketWalletGeocodePromises.set(key, promise); return promise;
}
function ticketWalletLoadLeaflet() {
  if (window.L) return Promise.resolve(window.L); if (ticketWalletLeafletPromise) return ticketWalletLeafletPromise;
  ticketWalletLeafletPromise = (async () => {
    let lastError = null;
    for (const [index, asset] of TICKET_WALLET_LEAFLET_ASSETS.entries()) {
      try {
        const cssId = 'ticketWalletLeafletCss' + index;
        if (!document.getElementById(cssId)) { const link = document.createElement('link'); link.id = cssId; link.rel = 'stylesheet'; link.href = asset.css; link.dataset.ticketWalletLeaflet = 'true'; document.head.appendChild(link); }
        await new Promise((resolve, reject) => { const script = document.createElement('script'); script.async = true; script.dataset.ticketWalletLeaflet = String(index); script.src = asset.js; script.onload = () => window.L ? resolve() : reject(Error('Leaflet unavailable')); script.onerror = () => reject(Error('Leaflet CDN unavailable')); document.head.appendChild(script); });
        if (window.L) return window.L;
      } catch (error) { lastError = error; document.querySelector('script[data-ticket-wallet-leaflet="' + index + '"]')?.remove(); }
    }
    throw lastError || Error('Leaflet unavailable');
  })();
  return ticketWalletLeafletPromise;
}
const TICKET_WALLET_MAP_TILE_SIZE = 256;
function ticketWalletMapProject(point, zoom) {
  const latitude = Math.max(-85.05112878, Math.min(85.05112878, Number(point[0]) || 0)); const longitude = Number(point[1]) || 0; const scale = TICKET_WALLET_MAP_TILE_SIZE * (2 ** zoom); const radians = latitude * Math.PI / 180; const sin = Math.max(-0.9999, Math.min(0.9999, Math.sin(radians)));
  return { x: (longitude + 180) / 360 * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale };
}
function ticketWalletMapUnproject(point, zoom) {
  const scale = TICKET_WALLET_MAP_TILE_SIZE * (2 ** zoom); const longitude = point.x / scale * 360 - 180; const mercator = Math.PI * (1 - 2 * point.y / scale); const latitude = 180 / Math.PI * Math.atan(Math.sinh(mercator)); return [latitude, longitude];
}
function ticketWalletMapFitZoom(points, width, height) {
  if (points.length < 2) return 9; for (let zoom = 8; zoom >= 4; zoom -= 1) { const projected = points.map((point) => ticketWalletMapProject(point, zoom)); const spanX = Math.max(...projected.map((point) => point.x)) - Math.min(...projected.map((point) => point.x)); const spanY = Math.max(...projected.map((point) => point.y)) - Math.min(...projected.map((point) => point.y)); if (spanX <= Math.max(180, width - 96) && spanY <= Math.max(120, height - 96)) return zoom; } return 4;
}
function ticketWalletMapViewport(points, width, height) {
  if (!points.length) return { center: [35.8617, 104.1954], zoom: 4 };
  const zoom = points.length > 1 ? ticketWalletMapFitZoom(points, width, height) : 9;
  const projected = points.map((point) => ticketWalletMapProject(point, zoom));
  const midpoint = { x: (Math.min(...projected.map((point) => point.x)) + Math.max(...projected.map((point) => point.x))) / 2, y: (Math.min(...projected.map((point) => point.y)) + Math.max(...projected.map((point) => point.y))) / 2 };
  return { center: ticketWalletMapUnproject(midpoint, zoom), zoom };
}
function ticketWalletFallbackMap(element, geocoded, contextGeocoded = geocoded, geocodedPlaces = [], contextGeocodedPlaces = geocodedPlaces) {
  const models = [];
  const duplicateRoutes = new Map();
  const markerGroups = new Map();
  const addMarker = (point, label, group, type) => {
    if (!point) return;
    const key = Number(point[0]).toFixed(4) + ',' + Number(point[1]).toFixed(4);
    if (!markerGroups.has(key)) markerGroups.set(key, { point, label, type, groups: [] });
    const marker = markerGroups.get(key);
    if (!marker.groups.some((item) => item.key === group.key)) marker.groups.push(group);
  };
  geocoded.forEach(({ group, from, to }) => {
    if (!from && !to) return;
    const type = ticketWalletMapRouteType(group);
    const style = TICKET_WALLET_ROUTE_STYLES[type];
    const routeKey = from && to ? from.join(',') + '|' + to.join(',') : '';
    const duplicateIndex = duplicateRoutes.get(routeKey) || 0;
    if (routeKey) duplicateRoutes.set(routeKey, duplicateIndex + 1);
    const points = from && to && duplicateIndex
      ? [from, [(from[0] + to[0]) / 2 + duplicateIndex * .12, (from[1] + to[1]) / 2 - duplicateIndex * .12], to]
      : [from, to].filter(Boolean);
    models.push({ group, from, to, points, type, color: style.color, dash: style.dash });
    addMarker(from, group.from || (state.language === 'en' ? 'Origin' : '起点'), group, type);
    addMarker(to, group.to || (state.language === 'en' ? 'Destination' : '终点'), group, type);
  });
  geocodedPlaces.forEach(({ entry, point }) => addMarker(point, entry.location, entry.group, entry.type));
  const allPoints = models.flatMap((model) => [model.from, model.to].filter(Boolean)).concat(geocodedPlaces.map(({ point }) => point).filter(Boolean));
  const contextPoints = contextGeocoded.flatMap((model) => [model.from, model.to].filter(Boolean)).concat(contextGeocodedPlaces.map(({ point }) => point).filter(Boolean));
  const previousController = element.__ticketWalletFallbackMap;
  if (previousController?.cleanup) previousController.cleanup();
  const interactionAbort = new AbortController();
  const controller = { zoom: null, center: null, cleanup: () => interactionAbort.abort() };
  const mapSize = () => ({ width: Math.max(320, element.clientWidth || 680), height: Math.max(240, element.clientHeight || 360) });
  const render = () => {
    const { width, height } = mapSize();
    if (!controller.zoom || !controller.center) {
      const focused = ticketWalletMapFocusId ? models.find((model) => model.group.records.some((record) => record.id === ticketWalletMapFocusId)) : null;
      const focusedPlace = ticketWalletMapFocusId ? geocodedPlaces.find(({ entry }) => entry.group.records.some((record) => record.id === ticketWalletMapFocusId)) : null;
      const focusPoints = focused ? [focused.from, focused.to].filter(Boolean) : focusedPlace?.point ? [focusedPlace.point] : [];
      const viewPoints = focusPoints.length ? focusPoints : contextPoints.length ? contextPoints : allPoints;
      const viewport = viewPoints.length ? ticketWalletMapViewport(viewPoints, width, height) : ticketWalletMapViewportContext || ticketWalletMapViewport([], width, height);
      if (viewPoints.length) ticketWalletMapViewportContext = viewport;
      controller.zoom = viewport.zoom;
      controller.center = [...viewport.center];
      if (focused || focusedPlace) ticketWalletMapFocusId = '';
    }

    const center = ticketWalletMapProject(controller.center, controller.zoom);
    const topLeft = { x: center.x - width / 2, y: center.y - height / 2 };
    const tiles = [];
    const retina = window.devicePixelRatio > 1 && controller.zoom < 19;
    const tileZoom = controller.zoom + (retina ? 1 : 0);
    const tileSize = TICKET_WALLET_MAP_TILE_SIZE / (retina ? 2 : 1);
    const firstX = Math.floor(topLeft.x / tileSize) - 1;
    const lastX = Math.floor((topLeft.x + width) / tileSize) + 1;
    const firstY = Math.floor(topLeft.y / tileSize) - 1;
    const lastY = Math.floor((topLeft.y + height) / tileSize) + 1;
    const tileCount = 2 ** tileZoom;
    for (let tileX = firstX; tileX <= lastX; tileX += 1) {
      for (let tileY = firstY; tileY <= lastY; tileY += 1) {
        if (tileY < 0 || tileY >= tileCount) continue;
        const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
        tiles.push('<img class="ticket-wallet-fallback-tile" alt="" src="https://tile.openstreetmap.org/' + tileZoom + '/' + wrappedX + '/' + tileY + '.png" style="width:' + tileSize + 'px!important;height:' + tileSize + 'px!important;left:' + (tileX * tileSize - topLeft.x).toFixed(1) + 'px;top:' + (tileY * tileSize - topLeft.y).toFixed(1) + 'px">');
      }
    }
    const projectOnScreen = (point) => {
      const projected = ticketWalletMapProject(point, controller.zoom);
      return { x: projected.x - topLeft.x, y: projected.y - topLeft.y };
    };
    const routes = models.map((model) => {
      const route = model.points.map(projectOnScreen);
      const id = model.group.records[0]?.id || '';
      const title = [model.group.from, model.group.to].filter(Boolean).join(' → ');
      const dash = model.dash ? ' stroke-dasharray="' + model.dash + '"' : '';
      return '<g class="ticket-wallet-fallback-route" role="button" tabindex="0" data-ticket-wallet-map-ticket="' + escapeHtml(id) + '" aria-label="' + escapeHtml(title) + '"><title>' + escapeHtml(title) + '</title><polyline points="' + route.map((point) => point.x.toFixed(1) + ',' + point.y.toFixed(1)).join(' ') + '" fill="none" stroke="' + model.color + '" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"' + dash + '></polyline><polyline points="' + route.map((point) => point.x.toFixed(1) + ',' + point.y.toFixed(1)).join(' ') + '" fill="none" stroke="' + model.color + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"' + dash + '></polyline></g>';
    }).join('');
    const markers = [...markerGroups.values()].map((marker) => {
      const screen = projectOnScreen(marker.point);
      const records = [...new Map(marker.groups.flatMap((group) => group.records).map((record) => [record.id, record])).values()];
      const id = records[0]?.id || '';
      const label = marker.groups.map((group) => [group.from, group.to].filter(Boolean).join(' → ')).filter(Boolean).slice(0, 2).join(' · ') || marker.label;
      const typeStyle = ticketWalletMapItemStyle(marker.type);
      return '<g class="ticket-wallet-fallback-marker" role="button" tabindex="0" data-ticket-wallet-map-ticket="' + escapeHtml(id) + '" aria-label="' + escapeHtml(label) + '"><title>' + escapeHtml(label) + '</title><circle cx="' + screen.x.toFixed(1) + '" cy="' + screen.y.toFixed(1) + '" r="' + (records.length > 1 ? 11 : 8) + '" fill="var(--panel)" stroke="' + typeStyle.color + '" stroke-width="3"></circle>' + (records.length > 1 ? '<text x="' + screen.x.toFixed(1) + '" y="' + (screen.y + 3.5).toFixed(1) + '" text-anchor="middle">' + records.length + '</text>' : '') + '</g>';
    }).join('');
    const overlayMarkup = routes + markers;
    element.innerHTML = '<div class="ticket-wallet-fallback-map"><div class="ticket-wallet-fallback-tiles">' + tiles.join('') + '</div><svg class="ticket-wallet-fallback-overlay" viewBox="0 0 ' + width + ' ' + height + '" role="group" aria-label="' + escapeHtml(state.language === 'en' ? 'Selectable travel routes' : '可点选的出行路线') + '">' + overlayMarkup + '</svg><div class="ticket-wallet-fallback-controls" aria-label="地图缩放"><button type="button" data-ticket-wallet-fallback-zoom="in" aria-label="放大地图">+</button><button type="button" data-ticket-wallet-fallback-zoom="out" aria-label="缩小地图">−</button></div><div class="ticket-wallet-fallback-attribution">© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors</div></div>';
    const overlay = element.querySelector('.ticket-wallet-fallback-overlay');
    overlay?.addEventListener('pointerdown', (event) => { if (event.target.closest('[data-ticket-wallet-map-ticket]')) event.stopPropagation(); });
    overlay?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const target = event.target.closest('[data-ticket-wallet-map-ticket]');
      if (!target) return;
      event.preventDefault(); target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    element.querySelectorAll('[data-ticket-wallet-fallback-zoom]').forEach((button) => button.addEventListener('click', (event) => {
      event.stopPropagation(); zoomAround(width / 2, height / 2, button.dataset.ticketWalletFallbackZoom === 'in' ? 1 : -1);
    }));
  };
  const zoomAround = (screenX, screenY, direction) => {
    if (!controller.zoom || !controller.center) return;
    const { width, height } = mapSize();
    const nextZoom = Math.max(3, Math.min(19, controller.zoom + direction));
    if (nextZoom === controller.zoom) return;
    const centerPixel = ticketWalletMapProject(controller.center, controller.zoom);
    const topLeft = { x: centerPixel.x - width / 2, y: centerPixel.y - height / 2 };
    const geographicPoint = ticketWalletMapUnproject({ x: topLeft.x + screenX, y: topLeft.y + screenY }, controller.zoom);
    const nextPixel = ticketWalletMapProject(geographicPoint, nextZoom);
    controller.zoom = nextZoom;
    controller.center = ticketWalletMapUnproject({ x: nextPixel.x - screenX + width / 2, y: nextPixel.y - screenY + height / 2 }, nextZoom);
    render();
  };
  let drag = null;
  const pointers = new Map();
  let pinch = null;
  const mapPointFromEvent = (event) => {
    const rect = element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const beginDrag = (pointer) => {
    drag = { pointerId: pointer.pointerId, startX: pointer.x, startY: pointer.y, center: controller.center ? [...controller.center] : null };
    pinch = null;
  };
  const beginPinch = () => {
    if (pointers.size < 2 || !controller.center || !controller.zoom) return;
    const [first, second] = [...pointers.values()];
    const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const distance = Math.max(1, Math.hypot(first.x - second.x, first.y - second.y));
    const { width, height } = mapSize();
    const centerPixel = ticketWalletMapProject(controller.center, controller.zoom);
    const topLeft = { x: centerPixel.x - width / 2, y: centerPixel.y - height / 2 };
    pinch = { startDistance: distance, startZoom: controller.zoom, anchor: ticketWalletMapUnproject({ x: topLeft.x + midpoint.x, y: topLeft.y + midpoint.y }, controller.zoom) };
    drag = null;
  };
  const updatePinch = () => {
    if (!pinch || pointers.size < 2) return;
    const [first, second] = [...pointers.values()];
    const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const distance = Math.max(1, Math.hypot(first.x - second.x, first.y - second.y));
    const nextZoom = Math.max(3, Math.min(19, Math.round(pinch.startZoom + Math.log2(distance / pinch.startDistance))));
    const { width, height } = mapSize();
    const anchorPixel = ticketWalletMapProject(pinch.anchor, nextZoom);
    controller.zoom = nextZoom;
    controller.center = ticketWalletMapUnproject({ x: anchorPixel.x - midpoint.x + width / 2, y: anchorPixel.y - midpoint.y + height / 2 }, nextZoom);
    render();
  };
  element.addEventListener('wheel', (event) => {
    if (!element.querySelector('.ticket-wallet-fallback-map') || event.target.closest('button, a, [data-ticket-wallet-map-ticket]')) return;
    event.preventDefault(); const point = mapPointFromEvent(event); zoomAround(point.x, point.y, event.deltaY < 0 ? 1 : -1);
  }, { passive: false, signal: interactionAbort.signal });
  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button, a, [data-ticket-wallet-map-ticket]') || !element.querySelector('.ticket-wallet-fallback-map')) return;
    const point = mapPointFromEvent(event);
    pointers.set(event.pointerId, { pointerId: event.pointerId, x: point.x, y: point.y });
    element.setPointerCapture?.(event.pointerId);
    if (pointers.size >= 2) beginPinch(); else beginDrag({ pointerId: event.pointerId, x: point.x, y: point.y });
    event.preventDefault();
  }, { signal: interactionAbort.signal });
  element.addEventListener('pointermove', (event) => {
    if (!pointers.has(event.pointerId)) return;
    const point = mapPointFromEvent(event);
    pointers.set(event.pointerId, { pointerId: event.pointerId, x: point.x, y: point.y });
    if (pointers.size >= 2 && pinch) { updatePinch(); event.preventDefault(); return; }
    if (!drag || drag.pointerId !== event.pointerId || !drag.center || !controller.zoom) return;
    const centerPixel = ticketWalletMapProject(drag.center, controller.zoom);
    controller.center = ticketWalletMapUnproject({ x: centerPixel.x - (point.x - drag.startX), y: centerPixel.y - (point.y - drag.startY) }, controller.zoom);
    render(); event.preventDefault();
  }, { passive: false, signal: interactionAbort.signal });
  const stopDragging = (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    try { element.releasePointerCapture?.(event.pointerId); } catch {}
    if (pinch && pointers.size < 2) { pinch = null; const remaining = pointers.values().next().value; if (remaining) beginDrag(remaining); }
    if (drag?.pointerId === event.pointerId) drag = null;
  };
  element.addEventListener('pointerup', stopDragging, { signal: interactionAbort.signal });
  element.addEventListener('pointercancel', stopDragging, { signal: interactionAbort.signal });
  render();
  element.__ticketWalletFallbackMap = controller;
}
function ticketWalletMapError(element, geocoded = [], contextGeocoded = geocoded, geocodedPlaces = [], contextGeocodedPlaces = geocodedPlaces) { ticketWalletFallbackMap(element, geocoded, contextGeocoded, geocodedPlaces, contextGeocodedPlaces); }
function ticketWalletMapMarkerIcon(L, type, count) {
  const style = ticketWalletMapItemStyle(type);
  const content = count > 1 ? '<b>' + count + '</b>' : ticketWalletMapItemIcon(type);
  return L.divIcon({
    className: 'ticket-wallet-map-div-icon',
    html: '<span class="ticket-wallet-map-marker" style="--map-point-color:' + style.color + '">' + content + '</span>',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}
async function hydrateTicketWalletMap() {
  const element = $('[data-ticket-wallet-real-map]');
  if (!element) {
    ticketWalletLeafletRenderToken += 1;
    if (ticketWalletLeafletMap) { try { ticketWalletLeafletMap.remove(); } catch {} }
    ticketWalletLeafletMap = null; ticketWalletLeafletMapElement = null;
    return;
  }
  if (ticketWalletLeafletPendingElement === element) return;
  if (ticketWalletLeafletMap && ticketWalletLeafletMapElement !== element) {
    try { ticketWalletLeafletMap.remove(); } catch {}
    ticketWalletLeafletMap = null; ticketWalletLeafletMapElement = null;
  }
  if (ticketWalletLeafletMap && ticketWalletLeafletMapElement === element) { ticketWalletLeafletMap.invalidateSize(); return; }

  const token = ++ticketWalletLeafletRenderToken;
  ticketWalletLeafletPendingElement = element;
  const journeys = ticketWalletMapJourneys(state.ticketWallet);
  const placeEntries = ticketWalletMapPlaceEntries(state.ticketWallet);
  const geocoded = [];
  const geocodedPlaces = [];
  try {
    for (const group of journeys) geocoded.push({ group, from: await ticketWalletGeocodePlace(group.from), to: await ticketWalletGeocodePlace(group.to) });
    for (const entry of placeEntries) geocodedPlaces.push({ entry, point: await ticketWalletGeocodePlace(entry.location) });
    if (token !== ticketWalletLeafletRenderToken || !element.isConnected) return;

    const L = await ticketWalletLoadLeaflet();
    if (token !== ticketWalletLeafletRenderToken || !element.isConnected) return;
    element.innerHTML = '';
    const map = L.map(element, { zoomControl: false, scrollWheelZoom: true, touchZoom: true, dragging: true, doubleClickZoom: true, attributionControl: true });
    L.control.zoom({ position: 'topleft' }).addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, detectRetina: true, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors' }).addTo(map);

    const bounds = [];
    const duplicateRoutes = new Map();
    const pointGroups = new Map();
    const pointLayers = [];
    const routeLayers = [];
    const addPoint = (point, label, group, type) => {
      if (!point) return;
      bounds.push(point);
      const key = Number(point.lat).toFixed(4) + ',' + Number(point.lng).toFixed(4);
      if (!pointGroups.has(key)) pointGroups.set(key, { point, label, type, groups: [] });
      const cluster = pointGroups.get(key);
      if (!cluster.groups.some((item) => item.key === group.key)) cluster.groups.push(group);
    };

    geocoded.forEach(({ group, from, to }) => {
      if (!from && !to) return;
      const type = ticketWalletMapRouteType(group);
      const routeStyle = TICKET_WALLET_ROUTE_STYLES[type];
      const fromPoint = from ? L.latLng(from[0], from[1]) : null;
      const toPoint = to ? L.latLng(to[0], to[1]) : null;
      addPoint(fromPoint, group.from || (state.language === 'en' ? 'Origin' : '起点'), group, type);
      addPoint(toPoint, group.to || (state.language === 'en' ? 'Destination' : '终点'), group, type);
      if (!fromPoint || !toPoint) return;

      const routeKey = fromPoint.lat + ',' + fromPoint.lng + '|' + toPoint.lat + ',' + toPoint.lng;
      const duplicateIndex = duplicateRoutes.get(routeKey) || 0;
      duplicateRoutes.set(routeKey, duplicateIndex + 1);
      const routePoints = duplicateIndex
        ? [fromPoint, L.latLng((fromPoint.lat + toPoint.lat) / 2 + duplicateIndex * .12, (fromPoint.lng + toPoint.lng) / 2 - duplicateIndex * .12), toPoint]
        : [fromPoint, toPoint];
      const route = L.polyline(routePoints, {
        color: routeStyle.color,
        weight: 4,
        opacity: .92,
        dashArray: routeStyle.dash || null,
        lineCap: 'round',
        lineJoin: 'round',
        smoothFactor: 0,
        noClip: true,
      }).addTo(map).bindPopup(ticketWalletMapPopupElement(group, (group.from || '起点') + ' → ' + (group.to || '终点')));
      routeLayers.push({ layer: route, points: routePoints, group });
    });
    geocodedPlaces.forEach(({ entry, point }) => {
      if (!point) return;
      addPoint(L.latLng(point[0], point[1]), entry.location, entry.group, entry.type);
    });

    pointGroups.forEach((cluster) => {
      const records = [...new Map(cluster.groups.flatMap((group) => group.records).map((record) => [record.id, record])).values()];
      const type = cluster.type;
      const label = cluster.groups.map((group) => [group.from, group.to].filter(Boolean).join(' → ')).filter(Boolean).slice(0, 2).join(' · ') || cluster.label;
      const marker = L.marker(cluster.point, { icon: ticketWalletMapMarkerIcon(L, type, records.length), keyboard: true, riseOnHover: true })
        .addTo(map)
        .bindTooltip(label, { direction: 'top', offset: [0, -12] })
        .bindPopup(ticketWalletMapPopupElement(cluster.groups, cluster.label));
      pointLayers.push({ layer: marker, groups: cluster.groups });
    });

    const syncRouteLayers = () => {
      routeLayers.forEach(({ layer, points }) => layer.setLatLngs(points));
      pointLayers.forEach(({ layer }, index) => layer.setZIndexOffset(1000 + index));
    };
    syncRouteLayers();
    map.on('zoomend moveend resize', syncRouteLayers);
    requestAnimationFrame(() => { map.invalidateSize(); syncRouteLayers(); });
    const viewport = ticketWalletMapViewport(bounds.map((point) => [point.lat, point.lng]), element.clientWidth || 680, element.clientHeight || 360);
    ticketWalletMapViewportContext = viewport;
    const focused = ticketWalletMapFocusId ? geocoded.find(({ group }) => group.records.some((record) => record.id === ticketWalletMapFocusId)) : null;
    const focusedPlace = ticketWalletMapFocusId ? geocodedPlaces.find(({ entry, point }) => Boolean(point) && entry.group.records.some((record) => record.id === ticketWalletMapFocusId)) : null;
    if (focused) {
      const focusPoints = [focused.from, focused.to].filter(Boolean).map((point) => L.latLng(point[0], point[1]));
      if (focusPoints.length > 1) map.fitBounds(focusPoints, { padding: [48, 48], maxZoom: 8, animate: false });
      else if (focusPoints.length) map.setView(focusPoints[0], 10, { animate: false });
      routeLayers.find(({ group }) => group.key === focused.group.key)?.layer.openPopup();
      pointLayers.find(({ groups }) => groups.some((group) => group.key === focused.group.key))?.layer.openPopup();
      ticketWalletMapFocusId = '';
    } else if (focusedPlace) {
      const point = focusedPlace.point;
      map.setView(L.latLng(point[0], point[1]), 10, { animate: false });
      pointLayers.find(({ groups }) => groups.some((group) => group.key === focusedPlace.entry.group.key))?.layer.openPopup();
      ticketWalletMapFocusId = '';
    } else {
      map.setView(viewport.center, viewport.zoom);
    }
    ticketWalletLeafletMap = map;
    ticketWalletLeafletMapElement = element;
  } catch {
    if (token === ticketWalletLeafletRenderToken && element.isConnected) ticketWalletMapError(element, geocoded, geocoded, geocodedPlaces, geocodedPlaces);
  } finally {
    if (ticketWalletLeafletPendingElement === element) ticketWalletLeafletPendingElement = null;
  }
}
function ticketWalletJourneyMapMarkup(journeys, places = []) {
  const category = normalizeTicketWalletFilter(state.ticketWalletTypeFilter);
  const note = journeys.length && places.length
    ? (state.language === 'en' ? 'Routes use ticket cities; entertainment and dining markers use the venue information on each ticket. Tap a line or marker to open its ticket.' : '路线按票据中的城市定位，娱乐和餐饮地点读取票面地点信息。点击路线或地点标记可打开对应票据。')
    : journeys.length
      ? (state.language === 'en' ? 'Routes use the ticket cities. Tap a marker or line to open its ticket; use the controls to zoom.' : '路线根据票据中的城市定位。点击地图上的点或路线可打开对应票据，也可使用控件缩放。')
      : places.length
        ? (state.language === 'en' ? 'Venue markers use the place information on each ticket. Tap a marker to open its ticket.' : '地点标记根据票据中的地点或门店信息定位。点击标记可打开对应票据。')
    : (category === 'all' || category === 'travel'
      ? (state.language === 'en' ? 'Add travel tickets with both origin and destination to see routes here.' : '添加并补全出发地和目的地后，出行路线会显示在这里。')
      : (state.language === 'en' ? 'This category has no travel routes. Choose Travel or All to view routes.' : '当前大类没有出行路线；选择“出行”或“全部”可查看路线。'));
  const countLabel = [journeys.length ? journeys.length + (state.language === 'en' ? (journeys.length === 1 ? ' route' : ' routes') : ' 条路线') : '', places.length ? places.length + (state.language === 'en' ? (places.length === 1 ? ' place' : ' places') : ' 个票面地点') : ''].filter(Boolean).join(state.language === 'en' ? ' · ' : ' · ') || (state.language === 'en' ? 'No map items' : '暂无地图内容');
  const hasMapItems = journeys.length || places.length;
  return '<section class="ticket-wallet-route-map"><div class="ticket-wallet-route-map-head"><div><h2>' + escapeHtml(state.language === 'en' ? 'Journey map' : '旅迹地图') + '</h2></div><span>' + escapeHtml(countLabel) + '</span></div>' + ticketWalletMapLegendMarkup() + '<div class="ticket-wallet-route-map-canvas"><div class="ticket-wallet-real-map' + (hasMapItems ? '' : ' is-empty') + '" data-ticket-wallet-real-map role="region" aria-label="' + escapeHtml(state.language === 'en' ? 'Tickets and venues on the map' : '票据路线与地点地图') + '"><div class="ticket-wallet-map-loading">' + escapeHtml(state.language === 'en' ? 'Loading map…' : '正在加载真实地图…') + '</div></div></div><div class="ticket-wallet-route-map-note">' + escapeHtml(note) + '</div></section>';
}
function renderTicketWalletJourneysLegacy() {
  const journeys = ticketWalletJourneys();
  if (!journeys.length) return '<div class="ticket-wallet-empty"><span class="ticket-wallet-empty-icon">✦</span><h2>' + escapeHtml(t('ticketWalletNoJourney')) + '</h2><p>' + escapeHtml(t('ticketWalletEmpty')) + '</p></div>';
  return ticketWalletJourneyMapMarkup(journeys) + '<div class="ticket-wallet-journey-list">' + journeys.map((group) => '<article class="ticket-wallet-journey-card"><div class="ticket-wallet-journey-head"><div><span class="ticket-wallet-eyebrow">' + escapeHtml(ticketWalletDateLabel(group.start, false)) + '</span><h2>' + escapeHtml(group.from || '—') + ' <span>→</span> ' + escapeHtml(group.to || '—') + '</h2></div><span class="ticket-wallet-count">' + group.records.length + ' ' + escapeHtml(t('ticketWalletCount')) + '</span></div><div class="ticket-wallet-timeline">' + group.records.map((record) => '<div class="ticket-wallet-timeline-item"><span class="ticket-wallet-timeline-dot ' + record.type + '">' + (TICKET_TYPES[record.type] || TICKET_TYPES.other).icon + '</span><div><strong>' + escapeHtml(record.title || ticketTypeLabel(record.type)) + '</strong><small>' + escapeHtml(ticketWalletDateLabel(record.departAt)) + (record.carrier ? ' · ' + escapeHtml(record.carrier) : '') + '</small></div></div>').join('') + '</div>' + (group.memory ? '<div class="ticket-wallet-memory-preview"><strong>' + escapeHtml(group.memory.title || t('ticketWalletMemory')) + '</strong><p>' + escapeHtml(group.memory.description || '') + '</p></div>' : '') + '<div class="ticket-wallet-journey-actions"><button class="secondary" data-ticket-wallet-memory="' + escapeHtml(group.key) + '">' + escapeHtml(group.memory ? t('ticketWalletEditMemory') : t('ticketWalletAddMemory')) + '</button><button class="ghost" data-ticket-wallet-share="' + escapeHtml(group.key) + '">' + escapeHtml(t('ticketWalletShare')) + '</button></div></article>').join('') + '</div>';
}
function renderTicketWalletJourneys() {
  const journeys = ticketWalletMapJourneys(state.ticketWallet);
  const places = ticketWalletMapPlaceEntries(state.ticketWallet);
  return ticketWalletJourneyMapMarkup(journeys, places);
}
function renderTicketWallet() {
  const journeys = ticketWalletJourneys(); const orderedTickets = ticketWalletDisplayRecords(state.ticketWallet); const visibleTickets = ticketWalletFilteredRecords(orderedTickets);
  const ticketWalletFilterRow = state.ticketWalletEditorOpen ? '' : '<div class="ticket-wallet-filter-row"><div class="ticket-wallet-filter-scroll" data-tab-rail="ticket-filters">' + ticketWalletCategoryMarkup(state.ticketWallet) + '</div>' + ticketWalletDiningKindFilterMarkup(state.ticketWallet) + '</div>';
  const ticketWalletPageBody = state.ticketWalletView === 'journeys' ? renderTicketWalletJourneys() : state.ticketWallet.length ? '<section class="ticket-wallet-stack-section">' + (visibleTickets.length ? ticketWalletStackMarkup(visibleTickets) : '<div class="ticket-wallet-filter-empty"><span>✦</span><strong>此分类还没有票据</strong><small>可以导入票据或手动添加</small></div>') + '</section>' : '<div class="ticket-wallet-empty"><span class="ticket-wallet-empty-icon">✦</span><h2>' + escapeHtml(t('ticketWalletEmpty')) + '</h2><p>' + escapeHtml(t('ticketWalletDescription')) + '</p><div class="ticket-wallet-empty-actions"><button class="ticket-wallet-empty-add" data-ticket-wallet-add aria-label="' + escapeHtml(t('ticketWalletAdd')) + '" title="' + escapeHtml(t('ticketWalletAdd')) + '">＋</button></div></div>';
  const ticketWalletViewSwitcher = '<div class="ticket-wallet-tabs ticket-wallet-view-switcher" role="tablist" aria-label="' + escapeHtml(t('ticketWallet')) + '"><button class="' + (state.ticketWalletView === 'tickets' ? 'active' : '') + '" data-ticket-wallet-view="tickets" role="tab" aria-selected="' + (state.ticketWalletView === 'tickets' ? 'true' : 'false') + '"><span class="ticket-wallet-view-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3"></rect><path d="M8 9h8M8 13h5"></path></svg></span><span>' + escapeHtml(t('ticketWalletTickets')) + '</span></button><button class="' + (state.ticketWalletView === 'journeys' ? 'active' : '') + '" data-ticket-wallet-view="journeys" role="tab" aria-selected="' + (state.ticketWalletView === 'journeys' ? 'true' : 'false') + '"><span class="ticket-wallet-view-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 19c4-1 6-4 7-7s3-6 7-7"></path><circle cx="6" cy="18" r="2"></circle><circle cx="18" cy="5" r="2"></circle></svg></span><span>' + escapeHtml(t('ticketWalletJourneys')) + '</span></button></div>';
  const ticketWalletTopAdd = state.ticketWalletView === 'tickets' && !state.ticketWalletEditorOpen ? '<button class="ticket-wallet-header-add" data-ticket-wallet-add aria-label="' + escapeHtml(t('ticketWalletAdd')) + '" title="' + escapeHtml(t('ticketWalletAdd')) + '"><span aria-hidden="true">＋</span></button>' : '';
  return '<div class="section-page ticket-wallet-page"><input id="ticketWalletFileInput" type="file" accept="image/*,.pkpass" hidden><input id="ticketWalletJsonInput" type="file" accept="application/json,.json" hidden><div class="ticket-wallet-page-head"><nav class="ticket-wallet-breadcrumb" aria-label="面包屑"><button class="ticket-wallet-back" data-ticket-wallet-back aria-label="' + escapeHtml(t('close')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button></nav><div class="ticket-wallet-head-actions">' + ticketWalletTopAdd + ticketWalletViewSwitcher + '</div></div>' + ticketWalletFilterRow + '<div class="ticket-wallet-page-swipe-stage" data-ticket-wallet-swipe-stage><div class="ticket-wallet-page-swipe-panel" data-ticket-wallet-swipe-panel>' + (state.ticketWalletView === 'journeys' && ticketWalletMapReturnContext ? '<button type="button" class="ticket-wallet-map-return" data-ticket-wallet-map-return><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"></path></svg>' + (state.language === 'en' ? 'Back to ticket' : '返回当前票据') + '</button>' : '') + (state.ticketWalletEditorOpen ? renderTicketWalletEditor() : state.ticketWalletMemoryDraft ? renderTicketWalletMemoryEditor() : ticketWalletPageBody) + '</div></div></div>';
}

function renderPetDialog() {
  const dialog = $('#petDialog');
  if (!dialog) return;
  bindPetProfileToCurrentUser();
  const profile = state.petProfile;
  const current = petCurrentLevel();
  const next = PET_LEVELS.find((item) => item.level > current.level);
  const progress = next ? Math.min(100, Math.max(0, ((profile.points - current.minPoints) / Math.max(1, next.minPoints - current.minPoints)) * 100)) : 100;
  const outfit = petOutfitById(profile.activeOutfit);
  const petImage = 'icons/mascot-fox-full.png?v=' + APP_VERSION;
  const outfitCards = PET_OUTFITS.map((item) => {
    const unlocked = petOutfitUnlocked(item);
    const active = item.id === outfit.id;
    const status = active ? petText('petOutfitWearing') : unlocked ? petText('petOutfitUse') : petText('petOutfitLocked', { level: item.level });
    return '<button type="button" class="pet-outfit-card ' + (active ? 'is-active ' : '') + (!unlocked ? 'is-locked' : '') + '" data-pet-outfit="' + item.id + '" ' + (unlocked ? '' : 'disabled') + '><span class="pet-outfit-glyph">' + item.glyph + '</span><span class="pet-outfit-copy"><strong>' + escapeHtml(item.name[state.language] || item.name.zh) + '</strong><small>' + escapeHtml(status) + '</small></span></button>';
  }).join('');
  const interactionCards = PET_INTERACTIONS.map((item) => {
    const unlocked = petInteractionUnlocked(item.id);
    return '<span class="pet-unlock-chip ' + (unlocked ? 'is-unlocked' : 'is-locked') + '"><span>' + escapeHtml(item.name[state.language] || item.name.zh) + '</span><small>' + escapeHtml(unlocked ? petText('petUnlocked') : petText('petInteractionLocked', { level: item.level })) + '</small></span>';
  }).join('');
  const stats = state.language === 'en' ? (profile.stats.articles + ' articles · ' + profile.stats.books + ' books · ' + profile.stats.tools + ' tools') : ('文章 ' + profile.stats.articles + ' · 书籍 ' + profile.stats.books + ' · 工具 ' + profile.stats.tools);
  const progressLabel = next ? petText('petNextLevel', { points: Math.max(0, next.minPoints - profile.points) }) : petText('petMaxLevel');
  dialog.innerHTML = '<div class="dialog-card pet-dialog-card" role="dialog" aria-modal="true"><div class="dialog-head pet-dialog-head"><div><h2>' + escapeHtml(t('mascot')) + '</h2></div><button class="icon-btn small" data-close-pet aria-label="' + escapeHtml(t('close')) + '">×</button></div><div class="pet-dialog-body"><section class="pet-profile-card"><div class="pet-profile-avatar"><img src="' + petImage + '" alt=""><span>' + outfit.glyph + '</span></div><div class="pet-profile-copy"><strong>' + escapeHtml(petText('petLevel', { level: current.level, name: current.name[state.language] || current.name.zh })) + '</strong><p>' + escapeHtml(petText('petPoints', { points: profile.points })) + '</p><small>' + escapeHtml(petText('petOwner', { owner: petOwnerLabel() })) + '</small></div></section><section class="pet-progress-card"><div class="pet-progress-head"><strong>' + escapeHtml(petText('petPoints', { points: profile.points })) + '</strong><span>' + escapeHtml(progressLabel) + '</span></div><div class="pet-progress-track"><i style="width:' + progress.toFixed(1) + '%"></i></div><p>' + escapeHtml(t('petEarnHint')) + '</p><div class="pet-earn-list"><span>' + escapeHtml(t('petArticlePoints')) + '</span><span>' + escapeHtml(t('petBookPoints')) + '</span><span>' + escapeHtml(t('petToolPoints')) + '</span></div><small class="pet-stat-line">' + escapeHtml(stats) + '</small></section><section class="pet-settings-section"><h3>' + escapeHtml(t('petSettings')) + '</h3><div class="pet-setting-row"><span>' + escapeHtml(t('mascot')) + '</span><select id="petVisibility"><option value="show" ' + (state.mascotVisible ? 'selected' : '') + '>' + escapeHtml(t('showMascot')) + '</option><option value="hide" ' + (!state.mascotVisible ? 'selected' : '') + '>' + escapeHtml(t('hideMascot')) + '</option></select></div><div class="pet-setting-row"><span>' + escapeHtml(t('mascotDisplay')) + '</span><select id="petDisplayMode"><option value="half" ' + (state.mascotDisplayMode === 'half' ? 'selected' : '') + '>' + escapeHtml(t('mascotHalfBody')) + '</option><option value="full" ' + (state.mascotDisplayMode === 'full' ? 'selected' : '') + '>' + escapeHtml(t('mascotFullBody')) + '</option></select></div></section><section class="pet-outfits-section"><div class="pet-section-head"><h3>' + escapeHtml(t('petOutfits')) + '</h3><small>' + escapeHtml(petText('petLevel', { level: current.level, name: current.name[state.language] || current.name.zh })) + '</small></div><div class="pet-outfit-grid">' + outfitCards + '</div></section><section class="pet-unlocks-section"><div class="pet-section-head"><h3>' + escapeHtml(t('petInteractions')) + '</h3><small>' + escapeHtml(t('petEarnHint')) + '</small></div><div class="pet-unlock-list">' + interactionCards + '</div></section></div></div>';
  dialog.hidden = false;
  state.petDialogOpen = true;
}
function closePetDialog() { const dialog = $('#petDialog'); if (dialog) dialog.hidden = true; state.petDialogOpen = false; }

function recentFeedItems() {
  const items = new Map();
  Object.values(state.homeFeed.sources || {}).forEach((source) => (source.items || []).forEach((item) => {
    const readAt = Number(state.homeFeedRead[item.id] || 0);
    if (readAt && !items.has(item.id)) items.set(item.id, { item, readAt });
  }));
  return [...items.values()].sort((a, b) => b.readAt - a.readAt).map(({ item }) => item);
}
function renderRecentReading() {
  const dialog = $('#recentReadingDialog');
  if (!dialog) return;
  const items = recentFeedItems();
  const body = items.length ? '<div class="feed-list recent-reading-list">' + items.map(renderFeedItem).join('') + '</div>' : '<p class="empty compact">' + (state.language === 'en' ? 'No articles read yet.' : '还没有阅读过首页消息。') + '</p>';
  dialog.innerHTML = '<div class="dialog-card recent-reading-dialog-card" role="dialog" aria-modal="true"><div class="dialog-head"><h2>' + (state.language === 'en' ? 'Recent reading' : '最近阅读') + '</h2><button class="icon-btn small" data-close-recent-reading aria-label="' + t('close') + '">×</button></div>' + body + '</div>';
  dialog.hidden = false;
  state.recentReadingOpen = true;
}
function closeRecentReading() {
  const dialog = $('#recentReadingDialog');
  if (dialog) dialog.hidden = true;
  state.recentReadingOpen = false;
}

// Reader --------------------------------------------------------------------
let readerCloudReady = false;
function readerCloudStatusLabel(status = {}) {
  const message = String(status.message || '');
  if (state.language !== 'en') return message || (state.github.token ? '自动同步已开启' : '登录 GitHub 后自动同步书籍');
  const labels = { unconfigured: 'Cloud storage is not configured', idle: 'Sign in to GitHub to sync books', syncing: 'Syncing books and reading progress…', success: 'Books and reading progress are synced', offline: 'Offline · will sync when you reconnect' };
  if (status.state === 'disabled') return state.language === 'en' ? 'Reading sync is turned off' : '阅读同步已关闭';
  return status.state === 'error' ? message : (labels[status.state] || 'Sign in to GitHub to sync books');
}
function updateReaderCloudStatus(status) {
  const node = $('#readerCloudSyncStatus');
  if (!node) return;
  node.textContent = readerCloudStatusLabel(status);
  node.dataset.state = status?.state || 'idle';
  node.title = status?.state === 'error' ? String(status.message || '') : '';
}
function configureReaderCloudSync() {
  if (!window.OneBoxReaderCloudSync) return;
  window.OneBoxReaderCloudSync.configure({
    isReady: () => readerCloudReady,
    isEnabled: () => githubSyncCustomGroupEnabled('reading'),
    disabledStatus: () => 'disabled',
    isBookOpen: (id) => state.readerMode === 'reading' && state.readerBookId === id,
    getGithubToken: () => state.github.token,
    getBooks: () => state.library,
    deleteLocalBook: async (id) => { await oneBoxDbDelete('books', id); await oneBoxDbDelete('book-covers', id); },
    readBookFile: async (book) => {
      const stored = await oneBoxDbGet('books', book.id);
      if (stored) return stored;
      if (book.type === 'md' && typeof book.content === 'string') return new TextEncoder().encode(book.content);
      return null;
    },
    writeBookFile: async (book, bytes) => {
      if (book.type === 'md') {
        book.content = new TextDecoder('utf-8').decode(bytes);
        book.size = bytes.byteLength;
      }
      if (!await oneBoxDbPut('books', book.id, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))) throw Error('无法把云端书籍保存到本机');
      delete book.syncFileMissing;
    },
    applyRemoteBooks: async (books) => {
      state.library = normalizeReaderLibrary(books);
      saveLibrary({ preserveUpdatedAt: true, skipCloudSync: true });
      if (state.section === 'tools' && state.tool === 'reader' && state.readerMode !== 'reading') render();
    },
    onStatus: updateReaderCloudStatus,
  });
}
function queueReaderCloudSync(delay = 1800) {
  if (readerCloudReady) window.OneBoxReaderCloudSync?.queueSync(delay);
}
function readerBookSyncMetadata(book) {
  const copy = { ...book };
  ['content', 'progress', 'progressUpdatedAt', 'updatedAt', 'syncFileMissing'].forEach((key) => { delete copy[key]; });
  Object.keys(copy).forEach((key) => { if (key.startsWith('_')) delete copy[key]; });
  return JSON.stringify(copy);
}
function saveLibrary(options = {}) {
  const previousBooks = parseStored(STORAGE.library, []) || [];
  const previousById = new Map((Array.isArray(previousBooks) ? previousBooks : []).filter((book) => book?.id).map((book) => [book.id, book]));
  const books = state.library.slice(0, 80);
  if (!options.preserveUpdatedAt) books.forEach((book) => {
    const previous = previousById.get(book.id);
    if (!book.updatedAt || !previous || readerBookSyncMetadata(previous) !== readerBookSyncMetadata(book)) book.updatedAt = Date.now();
  });
  const currentIds = new Set(books.map((book) => book.id));
  const deletedIds = [...previousById.keys()].filter((id) => !currentIds.has(id));
  saveStored(STORAGE.library, books);
  void oneBoxDbPut('snapshot', 'reader-library', { value: JSON.stringify(books), savedAt: Date.now() });
  const checkpoints = localStorage.getItem(STORAGE.readerProgress);
  if (checkpoints) void oneBoxDbPut('snapshot', 'reader-progress', { value: checkpoints, savedAt: Date.now() });
  if (!options.skipCloudSync) {
    if (deletedIds.length) window.OneBoxReaderCloudSync?.markDeleted(deletedIds);
    queueReaderCloudSync(2200);
  }
}
const READER_BACKUP_MAGIC = new TextEncoder().encode('ONEBOX-READER-BACKUP\n');
const READER_BACKUP_MAX_BYTES = 256 * 1024 * 1024;
const READER_BACKUP_MAX_MANIFEST_BYTES = 4 * 1024 * 1024;
let readerBackupBusy = false;
function readerBackupBytes(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return null;
}
async function readerBackupHash(bytes) {
  if (!window.crypto?.subtle) throw Error('SHA-256 unavailable');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
function readerBackupMetadata(book) {
  const metadata = {};
  Object.entries(book || {}).forEach(([key, value]) => {
    if (key === 'content' || key === 'syncFileMissing' || key.startsWith('_')) return;
    metadata[key] = value;
  });
  return metadata;
}
function readerBackupCheckpoint(book, checkpoints) {
  const checkpoint = checkpoints?.[book.id];
  return Number(checkpoint?.savedAt) > Number(book.progressUpdatedAt || 0)
    ? { progress: checkpoint.progress, savedAt: Number(checkpoint.savedAt) }
    : { progress: book.progress, savedAt: Number(book.progressUpdatedAt || 0) };
}
async function readerBackupSource(book) {
  let bytes = readerBackupBytes(await oneBoxDbGet('books', book.id));
  if (!bytes && book.type === 'md' && typeof book.content === 'string') bytes = new TextEncoder().encode(book.content);
  if (!bytes) throw Error('missing-book-source');
  return bytes;
}
async function buildReaderBackupFile() {
  const books = state.library.slice(0, 80);
  if (!books.length) throw Error('empty-reader-library');
  const checkpoints = parseStored(STORAGE.readerProgress, {}) || {};
  const segments = [];
  const records = [];
  let payloadSize = 0;
  for (const book of books) {
    const source = await readerBackupSource(book);
    const record = { metadata: readerBackupMetadata(book), source: { offset: payloadSize, length: source.byteLength, sha256: await readerBackupHash(source) } };
    segments.push(source); payloadSize += source.byteLength;
    const progress = readerBackupCheckpoint(book, checkpoints);
    if (progress.savedAt) { record.metadata.progress = progress.progress; record.metadata.progressUpdatedAt = progress.savedAt; }
    const cover = typeof book._coverData === 'string' ? book._coverData : await oneBoxDbGet('book-covers', book.id);
    if (typeof cover === 'string' && /^data:image\//i.test(cover)) {
      const coverBytes = new TextEncoder().encode(cover);
      if (coverBytes.byteLength <= 8 * 1024 * 1024) {
        record.cover = { offset: payloadSize, length: coverBytes.byteLength, sha256: await readerBackupHash(coverBytes) };
        segments.push(coverBytes); payloadSize += coverBytes.byteLength;
      }
    }
    records.push(record);
    if (payloadSize + READER_BACKUP_MAGIC.length + 4 > READER_BACKUP_MAX_BYTES) throw Error('backup-too-large');
  }
  const manifest = { app: 'OneBox', kind: 'reader-library-backup', version: 1, createdAt: new Date().toISOString(), payloadBytes: payloadSize, books: records };
  const manifestBytes = new TextEncoder().encode(JSON.stringify(manifest));
  if (manifestBytes.byteLength > READER_BACKUP_MAX_MANIFEST_BYTES || payloadSize + READER_BACKUP_MAGIC.byteLength + 4 + manifestBytes.byteLength > READER_BACKUP_MAX_BYTES) throw Error('backup-too-large');
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, manifestBytes.byteLength, true);
  const date = new Date().toISOString().slice(0, 10);
  return new File([READER_BACKUP_MAGIC, length, manifestBytes, ...segments], 'OneBox-Reader-' + date + '.oneboxreader', { type: 'application/octet-stream', lastModified: Date.now() });
}
function downloadReaderBackup(file) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url; link.download = file.name; link.hidden = true;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function exportReaderBackup(button) {
  if (readerBackupBusy) return;
  readerBackupBusy = true;
  const originalLabel = button?.textContent || t('readerBackupExport');
  if (button) { button.disabled = true; button.textContent = t('readerBackupBuilding'); }
  try {
    const file = await buildReaderBackupFile();
    let shareFiles = false;
    try { shareFiles = Boolean(navigator.share && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })); } catch {}
    if (shareFiles) {
      try {
        await navigator.share({ files: [file], title: t('readerBackupTitle'), text: t('readerBackupReady') });
        toast(t('readerBackupReady'));
      } catch (error) {
        if (error?.name === 'AbortError') return;
        downloadReaderBackup(file);
        toast(t('readerBackupExported'));
      }
    } else {
      downloadReaderBackup(file);
      toast(t('readerBackupExported'));
    }
  } catch (error) {
    const key = error?.message === 'empty-reader-library' ? 'readerBackupEmpty' : error?.message === 'missing-book-source' ? 'readerBackupMissingSource' : error?.message === 'backup-too-large' ? 'readerBackupTooLarge' : 'readerBackupFailed';
    toast(t(key), 'error');
  } finally {
    readerBackupBusy = false;
    if (button) { button.disabled = false; button.textContent = originalLabel; }
  }
}
function readerBackupIntegrityError() { throw Error('invalid-reader-backup'); }
async function parseReaderBackupFile(file) {
  if (!file || file.size > READER_BACKUP_MAX_BYTES) throw Error('backup-too-large');
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.byteLength < READER_BACKUP_MAGIC.byteLength + 4 || !READER_BACKUP_MAGIC.every((byte, index) => bytes[index] === byte)) readerBackupIntegrityError();
  const headerOffset = READER_BACKUP_MAGIC.byteLength;
  const manifestLength = new DataView(bytes.buffer, bytes.byteOffset + headerOffset, 4).getUint32(0, true);
  const manifestStart = headerOffset + 4;
  const payloadStart = manifestStart + manifestLength;
  if (!manifestLength || manifestLength > READER_BACKUP_MAX_MANIFEST_BYTES || payloadStart > bytes.byteLength) readerBackupIntegrityError();
  let manifest;
  try { manifest = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(manifestStart, payloadStart))); } catch { readerBackupIntegrityError(); }
  if (manifest?.app !== 'OneBox' || manifest?.kind !== 'reader-library-backup' || manifest?.version !== 1 || !Array.isArray(manifest.books) || manifest.books.length > 80 || !manifest.books.length || Number(manifest.payloadBytes) !== bytes.byteLength - payloadStart) readerBackupIntegrityError();
  const segments = [];
  const parsedBooks = [];
  const ids = new Set();
  const payload = bytes.subarray(payloadStart);
  for (const record of manifest.books) {
    const metadata = record?.metadata;
    const type = String(metadata?.type || '').toLowerCase();
    const id = String(metadata?.id || '');
    if (!metadata || !id || ids.has(id) || !String(metadata.name || '').trim() || !['md', 'txt', 'pdf', 'epub'].includes(type)) readerBackupIntegrityError();
    ids.add(id);
    const source = record.source;
    if (!source || !Number.isSafeInteger(source.offset) || !Number.isSafeInteger(source.length) || source.offset < 0 || source.length < 0 || source.offset + source.length > payload.byteLength || !/^[a-f0-9]{64}$/i.test(source.sha256 || '')) readerBackupIntegrityError();
    const sourceBytes = payload.slice(source.offset, source.offset + source.length);
    if (await readerBackupHash(sourceBytes) !== String(source.sha256).toLowerCase()) readerBackupIntegrityError();
    segments.push({ offset: source.offset, length: source.length });
    let cover = '';
    if (record.cover) {
      const item = record.cover;
      if (!Number.isSafeInteger(item.offset) || !Number.isSafeInteger(item.length) || item.length > 8 * 1024 * 1024 || item.offset < 0 || item.length < 1 || item.offset + item.length > payload.byteLength || !/^[a-f0-9]{64}$/i.test(item.sha256 || '')) readerBackupIntegrityError();
      const coverBytes = payload.slice(item.offset, item.offset + item.length);
      if (await readerBackupHash(coverBytes) !== String(item.sha256).toLowerCase()) readerBackupIntegrityError();
      cover = new TextDecoder('utf-8', { fatal: true }).decode(coverBytes);
      if (!/^data:image\//i.test(cover)) readerBackupIntegrityError();
      segments.push({ offset: item.offset, length: item.length });
    }
    parsedBooks.push({ metadata: { ...metadata, type }, sourceBytes, cover });
  }
  segments.sort((a, b) => a.offset - b.offset);
  let nextOffset = 0;
  for (const segment of segments) {
    if (segment.offset !== nextOffset) readerBackupIntegrityError();
    nextOffset += segment.length;
  }
  if (nextOffset !== payload.byteLength) readerBackupIntegrityError();
  return parsedBooks;
}
function readerBackupAnnotationMerge(current = [], incoming = []) {
  const merged = new Map();
  [...current, ...incoming].forEach((note, index) => {
    if (!note || typeof note !== 'object') return;
    const key = String(note.id || [note.quote || '', note.note || '', note.createdAt || index].join('|'));
    const previous = merged.get(key);
    if (!previous || Number(note.updatedAt || note.createdAt || 0) >= Number(previous.updatedAt || previous.createdAt || 0)) merged.set(key, note);
  });
  return [...merged.values()];
}
async function importReaderBackup(file) {
  try {
    const imported = await parseReaderBackupFile(file);
    const localCheckpoints = parseStored(STORAGE.readerProgress, {}) || {};
    const library = [...state.library];
    const bookWrites = [];
    const coverWrites = [];
    const restoredCheckpoints = { ...localCheckpoints };
    for (const item of imported) {
      const incoming = item.metadata;
      const matching = library.find((book) => book.id === incoming.id)
        || library.find((book) => incoming.fingerprint && book.fingerprint === incoming.fingerprint)
        || library.find((book) => book.syncFileMissing && book.type === incoming.type && book.name?.trim().toLocaleLowerCase() === incoming.name.trim().toLocaleLowerCase() && Number(book.size) === item.sourceBytes.byteLength);
      const targetId = matching?.id || incoming.id;
      let merged = incoming;
      if (matching) {
        const preferIncoming = Number(incoming.updatedAt || incoming.createdAt || 0) > Number(matching.updatedAt || matching.createdAt || 0);
        merged = preferIncoming ? { ...matching, ...incoming } : { ...incoming, ...matching };
        merged.id = targetId;
        merged.createdAt = Number(matching.createdAt || incoming.createdAt || Date.now());
        merged.annotations = readerBackupAnnotationMerge(matching.annotations, incoming.annotations);
        const localProgress = readerBackupCheckpoint(matching, localCheckpoints);
        const incomingProgress = { progress: incoming.progress, savedAt: Number(incoming.progressUpdatedAt || 0) };
        const progress = incomingProgress.savedAt > localProgress.savedAt ? incomingProgress : localProgress;
        merged.progress = progress.progress;
        merged.progressUpdatedAt = progress.savedAt;
        delete merged.syncFileMissing;
        library[library.indexOf(matching)] = merged;
      } else {
        merged = { ...incoming, id: targetId, annotations: readerBackupAnnotationMerge([], incoming.annotations) };
        library.push(merged);
      }
      merged.size = item.sourceBytes.byteLength;
      if (merged.type === 'md') merged.content = readerDecodeText(item.sourceBytes);
      delete merged.syncFileMissing;
      bookWrites.push([targetId, item.sourceBytes.buffer.slice(item.sourceBytes.byteOffset, item.sourceBytes.byteOffset + item.sourceBytes.byteLength)]);
      if (item.cover) {
        coverWrites.push([targetId, item.cover]);
        merged.hasCover = true;
        readerDefineCover(merged, item.cover);
      } else if (!matching) merged.hasCover = false;
      if (merged.progressUpdatedAt) restoredCheckpoints[targetId] = { progress: merged.progress, savedAt: merged.progressUpdatedAt };
    }
    if (library.length > 80) throw Error('backup-library-limit');
    const written = await oneBoxDbPutBatch({ books: bookWrites, 'book-covers': coverWrites });
    if (!written) throw Error('backup-write-failed');
    state.library = normalizeReaderLibrary(library);
    saveStored(STORAGE.readerProgress, restoredCheckpoints);
    saveLibrary({ preserveUpdatedAt: true, skipCloudSync: true });
    queuePersistentSnapshot();
    if (state.readerMode !== 'reading') render();
    toast(t('readerBackupImported'));
  } catch (error) {
    const key = error?.message === 'backup-too-large' ? 'readerBackupTooLarge' : error?.message === 'backup-library-limit' ? 'readerBackupLimit' : error?.message === 'backup-write-failed' ? 'readerBackupFailed' : 'readerBackupInvalid';
    toast(t(key), 'error');
  }
}
function saveReaderCheckpoint(book) {
  const checkpoints = parseStored(STORAGE.readerProgress, {}) || {};
  book.progressUpdatedAt = Date.now();
  checkpoints[book.id] = { progress: book.progress, savedAt: book.progressUpdatedAt };
  saveStored(STORAGE.readerProgress, checkpoints);
}
function saveReaderLayout() { localStorage.setItem(STORAGE.readerLayout, state.readerLayout); queuePersistentSnapshot(); }
function readerBookById(id) { return state.library.find((book) => book.id === id); }
function readerHeadingId(index) { return 'reader-heading-' + index; }
function readerTextToc(source) {
  const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
  const items = [];
  const chapterPattern = /^(?:第\s*[0-9０-９零〇一二三四五六七八九十百千万两]+\s*[章回节卷部篇集话]|[一二三四五六七八九十百千万两]+[、.．]|chapter\s+\d+|part\s+[0-9ivxlc]+|序章|序言|前言|引子|楔子|尾声|后记|番外|附录)(?:\s+|[:：、.．-])?.{0,42}$/i;
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const markdown = trimmed.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (markdown) {
      items.push({ id: readerHeadingId(items.length), label: markdown[2].trim(), depth: Math.min(3, markdown[1].length - 1), line: index, markdown: true });
      return;
    }
    if (trimmed.length <= 48 && chapterPattern.test(trimmed)) items.push({ id: readerHeadingId(items.length), label: trimmed, depth: 0, line: index });
  });
  return items;
}
function readerDecodeText(bytes) {
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch {
    try { return new TextDecoder('gb18030').decode(bytes); } catch { return new TextDecoder().decode(bytes); }
  }
}
function markdownToHtml(source) {
  const sourceToc = readerTextToc(source);
  const markdownToc = sourceToc.filter((item) => item.markdown);
  let markdownHeadingIndex = 0;
  const blocks = String(source || '').replace(/\r\n?/g, '\n').split(/\n{2,}/).map((rawBlock, blockIndex) => {
    const block = escapeHtml(rawBlock);
    if (/^```/.test(rawBlock)) return '<pre><code>' + block.replace(/^```[^\n]*\n?/, '').replace(/```$/, '') + '</code></pre>';
    const heading = rawBlock.match(/^(#{1,6})\s+(.+?)\s*#*$/);
    if (heading) {
      const tocItem = markdownToc[markdownHeadingIndex++] || { id: readerHeadingId(blockIndex) };
      return '<h' + Math.min(3, heading[1].length) + ' id="' + tocItem.id + '">' + escapeHtml(heading[2].trim()) + '</h' + Math.min(3, heading[1].length) + '>';
    }
    if (/^> /.test(rawBlock)) return '<blockquote>' + block.replace(/^&gt; /gm, '') + '</blockquote>';
    if (/^(?:[-*] |\d+\. )/.test(block)) {
      const ordered = /^\d+\. /.test(rawBlock);
      const items = block.split('\n').map((line) => '<li>' + line.replace(/^(?:[-*] |\d+\. )/, '') + '</li>').join('');
      return '<' + (ordered ? 'ol' : 'ul') + '>' + items + '</' + (ordered ? 'ol' : 'ul') + '>';
    }
    return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
  });
  return blocks.join('');
}
function textToHtml(source) {
  const lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
  const toc = readerTextToc(source);
  const chapters = new Map(toc.map((item) => [item.line, item]));
  const blocks = [];
  let paragraph = [];
  const flush = () => { if (paragraph.length) { blocks.push('<p>' + escapeHtml(paragraph.join('\n')).replace(/\n/g, '<br>') + '</p>'); paragraph = []; } };
  lines.forEach((line, index) => {
    const chapter = chapters.get(index);
    if (chapter) { flush(); blocks.push('<h2 id="' + chapter.id + '">' + escapeHtml(chapter.label) + '</h2>'); return; }
    if (!line.trim()) { flush(); return; }
    paragraph.push(line);
  });
  flush();
  return blocks.join('');
}
function sanitizeReaderMarkup(markup) {
  const documentFragment = new DOMParser().parseFromString(String(markup || ''), 'text/html');
  documentFragment.querySelectorAll('script,style,iframe,object,embed,form,link,meta').forEach((node) => node.remove());
  documentFragment.querySelectorAll('*').forEach((node) => [...node.attributes].forEach((attribute) => {
    if (/^on/i.test(attribute.name) || attribute.name === 'srcdoc') node.removeAttribute(attribute.name);
  }));
  return documentFragment.body.innerHTML;
}
function zipEntries(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) { eocd = index; break; }
  }
  if (eocd < 0) throw Error('Invalid EPUB archive');
  const count = view.getUint16(eocd + 10, true);
  const offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder(); const entries = new Map(); let cursor = offset;
  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) break;
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
    entries.set(name, { method, compressedSize, localOffset });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
async function readZipEntry(bytes, entries, name) {
  const entry = entries.get(name); if (!entry) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const local = entry.localOffset;
  const nameLength = view.getUint16(local + 26, true);
  const extraLength = view.getUint16(local + 28, true);
  const start = local + 30 + nameLength + extraLength;
  const data = bytes.slice(start, start + entry.compressedSize);
  if (entry.method === 0) return data;
  if (entry.method !== 8 || !window.DecompressionStream) throw Error('This EPUB compression is not supported');
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
function xmlAttribute(tag, name) {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)`, 'i'))?.[1] || '';
}
function readerPath(dir, href) {
  const rawPath = String(dir || '') + String(href || '').split('#')[0];
  let normalizedPath = rawPath;
  try { normalizedPath = decodeURIComponent(rawPath); } catch { /* keep the original path */ }
  const parts = normalizedPath.split('/');
  const resolved = [];
  parts.forEach((part) => { if (!part || part === '.') return; if (part === '..') resolved.pop(); else resolved.push(part); });
  return resolved.join('/');
}
function readerHrefParts(href) {
  const value = String(href || '');
  const hashIndex = value.indexOf('#');
  const queryIndex = value.indexOf('?');
  const pathEnd = [hashIndex, queryIndex].filter((index) => index >= 0).sort((a, b) => a - b)[0] ?? value.length;
  let anchor = hashIndex < 0 ? '' : value.slice(hashIndex + 1).split('?')[0];
  try { anchor = decodeURIComponent(anchor); } catch { /* keep the original anchor */ }
  return { path: value.slice(0, pathEnd), anchor };
}
function readerStripTags(value) { return String(value || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(); }
const READER_COVER_MAX_BYTES = 180 * 1024;
function readerBytesToBase64(bytes) {
  let value = '';
  for (let index = 0; index < bytes.length; index += 0x8000) value += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return btoa(value);
}
function readerImageMime(bytes, media = '', path = '') {
  if (!bytes?.length) return '';
  if (/^image\//i.test(media)) return media.split(';')[0].trim();
  const head = bytes.subarray(0, 16);
  let detected = '';
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) detected = 'image/jpeg';
  else if (head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47) detected = 'image/png';
  else if (head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46) detected = 'image/gif';
  else if (head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50) detected = 'image/webp';
  else if (/^\s*(?:<\?xml[^>]*>\s*)?<svg\b/i.test(new TextDecoder().decode(bytes.subarray(0, 600)))) detected = 'image/svg+xml';
  if (detected) return detected;
  const extension = String(path || '').split(/[?#]/)[0].split('.').pop()?.toLowerCase();
  return ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', avif: 'image/avif', bmp: 'image/bmp' })[extension] || '';
}
function readerImageDataUrl(bytes, media = '') {
  if (!bytes?.length || bytes.length > READER_COVER_MAX_BYTES) return '';
  const mime = readerImageMime(bytes, media);
  return mime ? 'data:' + mime + ';base64,' + readerBytesToBase64(bytes) : '';
}
const READER_EMBEDDED_IMAGE_MAX_BYTES = 8 * 1024 * 1024;
function readerImageObjectUrl(bytes, media = '', path = '') {
  if (!bytes?.length || bytes.length > READER_EMBEDDED_IMAGE_MAX_BYTES || typeof URL.createObjectURL !== 'function') return '';
  const mime = readerImageMime(bytes, media, path);
  if (!mime) return '';
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  state.readerAssetUrls.push(url);
  return url;
}
function releaseReaderAssets() {
  (state.readerAssetUrls || []).forEach((url) => { try { URL.revokeObjectURL(url); } catch {} });
  state.readerAssetUrls = [];
}
function readerDefineCover(book, data) {
  if (!book || !data) return;
  Object.defineProperty(book, '_coverData', { value: data, writable: true, configurable: true, enumerable: false });
}
function readerMarkdownCover(source) {
  const value = String(source || '');
  const data = value.match(/(?:!\[[^\]]*\]\(|<img\b[^>]*src\s*=\s*["'])(data:image\/[a-z0-9.+-]+;base64,[^\s)"']+)/i)?.[1] || '';
  return /^data:image\//i.test(data) && data.length <= Math.ceil(READER_COVER_MAX_BYTES * 1.38) ? data : '';
}
async function epubCoverData(bytes) {
  try {
    const entries = zipEntries(bytes); const decoder = new TextDecoder();
    const container = decoder.decode(await readZipEntry(bytes, entries, 'META-INF/container.xml') || new Uint8Array());
    const opfPath = container.match(/full-path\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!opfPath) return '';
    const opf = decoder.decode(await readZipEntry(bytes, entries, opfPath) || new Uint8Array());
    const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
    const manifest = {};
    [...opf.matchAll(/<item\b[^>]*>/gi)].forEach((match) => {
      const tag = match[0]; const id = xmlAttribute(tag, 'id');
      if (id) manifest[id] = { href: decodeURIComponent(xmlAttribute(tag, 'href')), media: xmlAttribute(tag, 'media-type'), properties: xmlAttribute(tag, 'properties') };
    });
    const coverId = opf.match(/<meta\b[^>]*name\s*=\s*["']cover["'][^>]*content\s*=\s*["']([^"']+)["'][^>]*>/i)?.[1];
    const candidates = [manifest[coverId], ...Object.values(manifest).filter((item) => /cover-image/i.test(item.properties || '') || /image\//i.test(item.media || '') && /cover|title/i.test(item.href || ''))].filter(Boolean);
    const seen = new Set();
    for (const item of candidates) {
      if (seen.has(item.href) || !/^image\//i.test(item.media || '')) continue;
      seen.add(item.href);
      const data = await readZipEntry(bytes, entries, readerPath(base, item.href));
      const url = readerImageDataUrl(data, item.media);
      if (url) return url;
    }
  } catch { /* an unsupported cover should not block importing the book */ }
  return '';
}
async function hydrateReaderBookCover(book) {
  if (!book || book._coverData || book._coverHydrating || book._coverHydrated) return;
  Object.defineProperty(book, '_coverHydrating', { value: true, writable: true, configurable: true, enumerable: false });
  const hadCover = book.hasCover === true;
  try {
    let cover = book.type === 'md' ? readerMarkdownCover(book.content) : '';
    if (!cover) cover = await oneBoxDbGet('book-covers', book.id) || '';
    if (!cover && book.type === 'epub') {
      const binary = await oneBoxDbGet('books', book.id);
      if (binary) cover = await epubCoverData(new Uint8Array(binary));
    }
    if (cover) {
      readerDefineCover(book, cover);
      await oneBoxDbPut('book-covers', book.id, cover);
    }
    book.hasCover = Boolean(cover);
    if (book.hasCover !== hadCover) {
      saveLibrary();
      if (state.tool === 'reader' && state.readerMode === 'library') render();
    }
  } finally {
    book._coverHydrating = false;
    Object.defineProperty(book, '_coverHydrated', { value: true, configurable: true, enumerable: false });
  }
}
async function epubToHtml(bytes) {
  const entries = zipEntries(bytes); const decoder = new TextDecoder();
  const container = decoder.decode(await readZipEntry(bytes, entries, 'META-INF/container.xml') || new Uint8Array());
  const opfPath = container.match(/full-path\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!opfPath) throw Error('EPUB package not found');
  const opf = decoder.decode(await readZipEntry(bytes, entries, opfPath) || new Uint8Array());
  const base = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : '';
  const manifest = {};
  [...opf.matchAll(/<item\b[^>]*>/gi)].forEach((match) => {
    const tag = match[0]; const id = xmlAttribute(tag, 'id');
    if (id) manifest[id] = { href: decodeURIComponent(xmlAttribute(tag, 'href')), media: xmlAttribute(tag, 'media-type'), properties: xmlAttribute(tag, 'properties') };
  });
  const manifestByPath = new Map(Object.values(manifest).map((item) => [readerPath(base, item.href), item]));
  const spine = [...opf.matchAll(/<itemref\b[^>]*>/gi)].map((match) => xmlAttribute(match[0], 'idref')).map((id) => manifest[id]).filter(Boolean);
  const spineEntries = [];
  const parts = [];
  const inferredToc = [];
  for (const item of spine) {
    if (!/html|xhtml/i.test(item.media)) continue;
    const path = readerPath(base, item.href);
    const html = decoder.decode(await readZipEntry(bytes, entries, path) || new Uint8Array());
    const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
    const section = spineEntries.length;
    spineEntries.push({ item, path, section });
    const sectionDocument = new DOMParser().parseFromString('<body>' + sanitizeReaderMarkup(body) + '</body>', 'text/html');
    const sectionBase = path.includes('/') ? path.slice(0, path.lastIndexOf('/') + 1) : '';
    for (const mediaNode of sectionDocument.body.querySelectorAll('img, image')) {
      const source = mediaNode.getAttribute('src') || mediaNode.getAttribute('data-src') || mediaNode.getAttribute('href') || mediaNode.getAttribute('xlink:href') || '';
      const sourcePath = readerHrefParts(source).path;
      if (!sourcePath || /^(?:data|blob|https?|file):/i.test(sourcePath)) continue;
      const assetPath = readerPath(sectionBase, sourcePath);
      const asset = await readZipEntry(bytes, entries, assetPath);
      const assetUrl = readerImageObjectUrl(asset, manifestByPath.get(assetPath)?.media || '', assetPath);
      if (!assetUrl) continue;
      if (mediaNode.localName === 'image') {
        mediaNode.setAttribute('href', assetUrl);
        mediaNode.setAttribute('xlink:href', assetUrl);
      } else {
        mediaNode.setAttribute('src', assetUrl);
        mediaNode.removeAttribute('srcset');
      }
      mediaNode.removeAttribute('data-src');
    }
    [...sectionDocument.body.querySelectorAll('h1,h2,h3,h4,h5,h6')].forEach((heading, headingIndex) => {
      if (!heading.id) heading.id = 'reader-epub-heading-' + section + '-' + headingIndex;
      const label = readerStripTags(heading.textContent);
      if (label) inferredToc.push({ id: readerHeadingId(inferredToc.length), label, depth: Math.min(3, Number(heading.tagName.slice(1)) - 1), section, anchor: heading.id });
    });
    const mediaNodes = sectionDocument.body.querySelectorAll('img,svg');
    const sectionText = readerStripTags(sectionDocument.body.textContent);
    const isCoverSection = section === 0 && mediaNodes.length === 1 && sectionText.length <= 80;
    const sectionClass = 'reader-epub-section' + (isCoverSection ? ' reader-epub-cover-section' : '');
    parts.push('<section class="' + sectionClass + '" id="reader-epub-section-' + section + '">' + sectionDocument.body.innerHTML + '</section>');
  }
  if (!parts.length) throw Error('EPUB has no readable chapters');
  const toc = [];
  const navItem = Object.values(manifest).find((item) => /\bnav\b/i.test(item.properties || ''));
  const ncxItem = spine.find((item) => /ncx/i.test(item.media || '')) || Object.values(manifest).find((item) => /ncx/i.test(item.media || ''));
  const tocFilePath = navItem ? readerPath(base, navItem.href) : ncxItem ? readerPath(base, ncxItem.href) : base;
  const tocDir = tocFilePath.replace(/[^/]*$/, '');
  const addTocLink = (label, href, depth = 0) => {
    const hrefParts = readerHrefParts(href);
    const targetPath = readerPath(tocDir, hrefParts.path);
    const match = spineEntries.find((entry) => entry.path === targetPath || entry.path.endsWith('/' + targetPath));
    if (!label || !match) return;
    const key = match.section + ':' + label;
    if (toc.some((item) => item.key === key)) return;
    toc.push({ id: readerHeadingId(toc.length), key, label, depth: Math.min(3, Number(depth) || 0), section: match.section, anchor: hrefParts.anchor });
  };
  if (navItem) {
    const navPath = readerPath(base, navItem.href);
    const navHtml = decoder.decode(await readZipEntry(bytes, entries, navPath) || new Uint8Array());
    const navBlocks = [...navHtml.matchAll(/<nav\b[\s\S]*?<\/nav>/gi)].map((match) => match[0]);
    const navBody = navBlocks.find((block) => /(?:epub:type|role)\s*=\s*["'][^"']*(?:toc|doc-toc)/i.test(block.match(/^<nav\b[^>]*>/i)?.[0] || '')) || navBlocks[0] || navHtml;
    [...navBody.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].forEach((match) => addTocLink(readerStripTags(match[2]), match[1], (match[0].match(/data-depth\s*=\s*["'](\d+)/i) || [])[1] || 0));
  }
  if (!toc.length && ncxItem) {
    const ncxPath = readerPath(base, ncxItem.href);
    const ncx = decoder.decode(await readZipEntry(bytes, entries, ncxPath) || new Uint8Array());
    [...ncx.matchAll(/<navPoint\b[^>]*>[\s\S]*?<text>([\s\S]*?)<\/text>[\s\S]*?<content\b[^>]*src\s*=\s*["']([^"']+)["'][\s\S]*?<\/navPoint>/gi)].forEach((match) => addTocLink(readerStripTags(match[1]), match[2]));
  }
  const finalToc = toc.length ? toc : inferredToc;
  const title = opf.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim();
  return { title, html: parts.join('<hr>'), toc: finalToc.map(({ key, ...item }) => item) };
}
async function importReaderFiles(fileList) {
  const files = [...(fileList || [])]; if (!files.length) return;
  let addedCount = 0; let duplicateCount = 0;
  for (const file of files) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['md', 'markdown', 'txt', 'pdf', 'epub'].includes(extension)) { toast(t('unsupportedFile'), 'error'); continue; }
    try {
      const type = extension === 'markdown' ? 'md' : extension;
      const fingerprint = [type, file.name.trim().toLocaleLowerCase(), file.size, file.lastModified || 0].join('|');
      const duplicate = state.library.find((book) => book.fingerprint === fingerprint || (book.syncFileMissing && book.type === type && book.name.trim().toLocaleLowerCase() === file.name.trim().toLocaleLowerCase() && Number(book.size) === file.size) || (!book.fingerprint && book.type === type && book.name.trim().toLocaleLowerCase() === file.name.trim().toLocaleLowerCase() && Number(book.size) === file.size));
      if (duplicate && !duplicate.syncFileMissing) { duplicateCount += 1; continue; }
      const id = duplicate?.id || uid();
      const book = { ...(duplicate || {}), id, name: file.name, type, size: file.size, fingerprint, createdAt: duplicate?.createdAt || Date.now(), lastOpenedAt: duplicate?.lastOpenedAt || 0, order: duplicate?.order ?? state.library.reduce((max, item) => Math.max(max, Number(item.order) || 0), 0) + 1, progress: duplicate?.progress ?? 0, annotations: duplicate?.annotations || [], hasCover: false };
      delete book.syncFileMissing;
      let cover = '';
      if (book.type === 'md') {
        const binary = await file.arrayBuffer();
        if (!await oneBoxDbPut('books', id, binary)) throw Error('Markdown file could not be saved locally');
        book.content = new TextDecoder('utf-8').decode(binary);
        cover = readerMarkdownCover(book.content);
      } else {
        const binary = await file.arrayBuffer();
        if (!await oneBoxDbPut('books', id, binary)) throw Error('Book file could not be saved locally');
        if (book.type === 'epub') cover = await epubCoverData(new Uint8Array(binary));
      }
      if (cover) { book.hasCover = true; readerDefineCover(book, cover); await oneBoxDbPut('book-covers', id, cover); }
      if (duplicate) state.library = state.library.map((item) => item.id === duplicate.id ? book : item);
      else state.library.unshift(book);
      saveLibrary(); addedCount += 1;
    } catch { toast(t('importFailed'), 'error'); }
  }
  const input = $('#readerFileInput'); if (input) input.value = '';
  render();
  if (addedCount && duplicateCount) toast(state.language === 'en' ? addedCount + ' document(s) added; duplicates skipped' : '已添加 ' + addedCount + ' 个文档，已跳过重复文档');
  else if (addedCount) toast(state.language === 'en' ? 'Document added' : '文档已添加');
  else if (duplicateCount) toast(state.language === 'en' ? 'Document already exists' : '文档已添加过');
}
function readerAnnotationMarkup(book) {
  const notes = (book.annotations || []).slice().reverse();
  if (!notes.length) return '<p class="empty compact">' + t('noAnnotations') + '</p>';
  return notes.map((note) => '<div class="reader-note"><blockquote>' + escapeHtml(note.quote) + '</blockquote><p>' + escapeHtml(note.note) + '</p><button class="icon-btn small" data-delete-annotation="' + escapeHtml(note.id) + '" aria-label="' + t('close') + '">×</button></div>').join('');
}
let readerPositionRestoring = false;
let readerRestoreGeneration = 0;
let readerProgressFrame = 0;
let readerProgressTimer = null;
let readerRestoreTimer = null;
let readerPageLayoutFrame = 0;
let readerPageResizeObserver = null;
let readerPageResizeTarget = null;
let readerNativeFullscreen = false;
let readerMarkupRestoreTimer = null;
function readerUsesDocumentScroll() {
  return isIosSafariBrowser() && state.readerImmersive && state.readerMode === 'reading' && state.readerReadingMode !== 'pages' && document.documentElement.classList.contains('reader-focus');
}
function readerDocumentScrollMetrics(content) {
  if (!readerUsesDocumentScroll() || !content) return null;
  const rect = content.getBoundingClientRect();
  const documentTop = rect.top + (window.scrollY || window.pageYOffset || 0);
  const contentHeight = Math.max(content.scrollHeight, rect.height);
  const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
  return {
    top: Math.max(0, (window.scrollY || window.pageYOffset || 0) - documentTop),
    max: Math.max(1, contentHeight - viewportHeight),
    documentTop,
  };
}
function readerScrollProgress(content) {
  if (!content) return 0;
  const documentMetrics = readerDocumentScrollMetrics(content);
  if (documentMetrics) return Math.min(1, Math.max(0, documentMetrics.top / documentMetrics.max));
  return Math.min(1, Math.max(0, content.scrollTop / Math.max(1, content.scrollHeight - content.clientHeight)));
}
function readerDocumentPageInfo(content) {
  if (!readerUsesDocumentScroll() || !content) return null;
  const metrics = readerDocumentScrollMetrics(content);
  if (!metrics) return null;
  const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
  const contentHeight = Math.max(content.scrollHeight, content.getBoundingClientRect().height);
  const count = Math.max(1, Math.ceil(contentHeight / viewportHeight));
  return { current: Math.min(count, Math.floor(metrics.top / viewportHeight) + 1), count };
}
function scheduleReaderPositionRestore() {
  readerPositionRestoring = true;
  const generation = ++readerRestoreGeneration;
  const bookId = state.readerBookId;
  if (readerRestoreTimer) clearTimeout(readerRestoreTimer);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (generation !== readerRestoreGeneration || bookId !== state.readerBookId) return;
    restoreReaderPosition();
    readerRestoreTimer = setTimeout(() => {
      if (generation !== readerRestoreGeneration || bookId !== state.readerBookId) return;
      readerRestoreTimer = null;
      restoreReaderPosition();
      requestAnimationFrame(() => { if (generation === readerRestoreGeneration) readerPositionRestoring = false; });
    }, 140);
  }));
}
function scheduleReaderProgress(content) {
  if (readerPositionRestoring || document.hidden || !content?.isConnected) return;
  const book = readerBookById(state.readerBookId); if (!book || !content || !content.scrollHeight) return;
  if (state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) {
    const count = readerPageCount(content);
    book.progress = state.readerPage / Math.max(1, count - 1);
  } else {
    book.progress = readerScrollProgress(content);
  }
  saveReaderCheckpoint(book);
  if (!readerProgressFrame) readerProgressFrame = requestAnimationFrame(() => {
    readerProgressFrame = 0;
    if (state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) updateReaderPager();
    else updateReaderReferenceChrome();
  });
  clearTimeout(readerProgressTimer);
  readerProgressTimer = setTimeout(() => { readerProgressTimer = null; saveLibrary(); }, 350);
}
function flushReaderProgress(capturePosition = true) {
  clearTimeout(readerProgressTimer);
  readerProgressTimer = null;
  const book = readerBookById(state.readerBookId);
  const content = $('[data-reader-content]');
  if (!book) return;
  if (capturePosition && !readerPositionRestoring && content?.scrollHeight) {
    book.progress = state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')
      ? Math.min(1, Math.max(0, state.readerPage / Math.max(1, readerPageCount(content) - 1)))
      : readerScrollProgress(content);
    saveReaderCheckpoint(book);
  }
  saveLibrary();
}
function applyReaderPageLayout(preserveProgress = true) {
  const viewport = $('.reader-page-viewport');
  const flow = $('.reader-page-flow');
  if (!viewport || !flow || !viewport.clientWidth || !viewport.clientHeight) return;
  const previousCount = Number(viewport.dataset.readerLayoutPages) || readerPageCount(viewport);
  const progress = preserveProgress && previousCount > 1
    ? Math.min(1, Math.max(0, state.readerPage / Math.max(1, previousCount - 1)))
    : 0;
  applyReaderPageColumns(viewport, flow);
  requestAnimationFrame(() => {
    if (!viewport.isConnected || !flow.isConnected) return;
    const count = readerPageCount(viewport);
    setReaderPagePosition(Math.round(progress * Math.max(0, count - 1)), 'instant');
  });
}
function scheduleReaderPageLayout() {
  if (readerPageLayoutFrame) return;
  readerPageLayoutFrame = requestAnimationFrame(() => {
    readerPageLayoutFrame = 0;
    if (state.readerReadingMode === 'pages') applyReaderPageLayout(true);
  });
}
function syncReaderPageResizeObserver() {
  const viewport = state.readerReadingMode === 'pages' ? $('.reader-page-viewport') : null;
  if (readerPageResizeTarget === viewport) return;
  readerPageResizeObserver?.disconnect();
  readerPageResizeObserver = null;
  readerPageResizeTarget = viewport;
  if (!viewport || !window.ResizeObserver) return;
  readerPageResizeObserver = new ResizeObserver(scheduleReaderPageLayout);
  readerPageResizeObserver.observe(viewport);
}
function readerPageGeometry(viewport, flow = viewport?.querySelector('.reader-page-flow')) {
  const styles = flow ? getComputedStyle(flow) : null;
  const leftPadding = Math.max(0, Number.parseFloat(styles?.paddingLeft || 0) || 0);
  const rightPadding = Math.max(0, Number.parseFloat(styles?.paddingRight || 0) || 0);
  const pageWidth = Math.max(1, Math.round(viewport?.clientWidth || 1));
  const columnWidth = Math.max(1, pageWidth - Math.round(leftPadding + rightPadding));
  const columnGap = Math.max(0, Math.round(leftPadding + rightPadding));
  return { pageWidth, columnWidth, columnGap, horizontalPadding: leftPadding + rightPadding };
}
function applyReaderPageColumns(viewport, flow) {
  const geometry = readerPageGeometry(viewport, flow);
  delete viewport.dataset.readerPageMeasureKey;
  delete viewport.dataset.readerMeasuredPages;
  flow.style.columnWidth = geometry.columnWidth + 'px';
  flow.style.webkitColumnWidth = geometry.columnWidth + 'px';
  flow.style.columnGap = geometry.columnGap + 'px';
  flow.style.webkitColumnGap = geometry.columnGap + 'px';
  flow.style.columnFill = 'auto';
  flow.style.webkitColumnFill = 'auto';
  flow.style.height = Math.max(1, Math.round(viewport.clientHeight)) + 'px';
  return geometry;
}
function readerPageMeasureKey(viewport, flow, geometry) {
  return [
    viewport.clientWidth,
    viewport.clientHeight,
    geometry.columnWidth,
    geometry.columnGap,
    flow.scrollWidth,
    flow.scrollHeight,
    flow.childElementCount,
  ].join('|');
}
function readerMeasuredLastContentPage(viewport, flow, geometry) {
  const key = readerPageMeasureKey(viewport, flow, geometry);
  if (viewport.dataset.readerPageMeasureKey === key && viewport.dataset.readerMeasuredPages) {
    return Number(viewport.dataset.readerMeasuredPages) || 0;
  }

  // WebKit can expose one extra CSS column for the trailing padding. Counting
  // scrollWidth then makes the last page look real even though it contains no
  // content. Measure the last painted text line instead, with the track
  // transform temporarily removed so this also works after a page turn.
  const previousTransform = flow.style.transform;
  const previousWebkitTransform = flow.style.webkitTransform;
  flow.style.transform = 'none';
  flow.style.webkitTransform = 'none';
  let pages = 0;
  try {
    // WebKit may defer the column relayout caused by removing the page
    // transform. Read layout once before walking text ranges so the last
    // painted line is measured in the untransformed coordinate space.
    void flow.offsetWidth;
    const styles = getComputedStyle(flow);
    const leftPadding = Math.max(0, Number.parseFloat(styles.paddingLeft || 0) || 0);
    const flowRect = flow.getBoundingClientRect();
    const contentLeft = flowRect.left + leftPadding;
    const stride = Math.max(1, geometry.columnWidth + geometry.columnGap);
    const walker = document.createTreeWalker(flow, NodeFilter.SHOW_TEXT);
    let node;
    let lastRect = null;
    while ((node = walker.nextNode())) {
      if (!node.nodeValue?.trim()) continue;
      const range = document.createRange();
      try {
        range.selectNodeContents(node);
        const rects = [...range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
        if (rects.length) lastRect = rects[rects.length - 1];
      } catch { /* Ignore detached or non-rendered text nodes. */ }
      finally { range.detach?.(); }
    }
    if (lastRect) {
      const column = Math.max(0, Math.floor((lastRect.left - contentLeft + 1) / stride));
      pages = column + 1;
    }
  } finally {
    flow.style.transform = previousTransform;
    flow.style.webkitTransform = previousWebkitTransform;
  }

  if (!pages) {
    const totalWidth = Math.max(geometry.columnWidth, flow.scrollWidth - geometry.horizontalPadding + geometry.columnGap);
    pages = Math.max(1, Math.ceil(totalWidth / Math.max(1, geometry.columnWidth + geometry.columnGap)));
  }
  viewport.dataset.readerPageMeasureKey = key;
  viewport.dataset.readerMeasuredPages = String(pages);
  return pages;
}
function readerPageCount(viewport) {
  const flow = viewport?.querySelector('.reader-page-flow');
  if (!viewport || !flow) return 1;
  const geometry = readerPageGeometry(viewport, flow);
  return readerMeasuredLastContentPage(viewport, flow, geometry);
}
function ensureReaderPageColumns(viewport, flow) {
  if (!viewport || !flow) return;
  const geometry = readerPageGeometry(viewport, flow);
  const height = Math.max(1, Math.round(viewport.clientHeight)) + 'px';
  if (flow.style.columnWidth !== geometry.columnWidth + 'px' || flow.style.columnGap !== geometry.columnGap + 'px' || flow.style.height !== height) {
    applyReaderPageColumns(viewport, flow);
  }
}
function readerPageForTarget(viewport, target) {
  const flow = viewport?.querySelector('.reader-page-flow');
  if (!viewport || !flow || !target || !viewport.clientWidth) return 0;
  ensureReaderPageColumns(viewport, flow);
  const geometry = readerPageGeometry(viewport, flow);
  const count = readerPageCount(viewport);
  const previousTransform = flow.style.transform;
  const previousWebkitTransform = flow.style.webkitTransform;
  flow.style.transform = 'none';
  flow.style.webkitTransform = 'none';
  let page = 0;
  try {
    // offsetLeft is relative to the nearest offset parent and is not a page
    // coordinate for nested EPUB sections or headings split by CSS columns.
    // Read the actual painted position with the track untransformed instead.
    void flow.offsetWidth;
    const styles = getComputedStyle(flow);
    const leftPadding = Math.max(0, Number.parseFloat(styles.paddingLeft || 0) || 0);
    const flowRect = flow.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const firstColumnLeft = flowRect.left + leftPadding;
    const stride = Math.max(1, geometry.columnWidth + geometry.columnGap);
    page = Math.floor(Math.max(0, targetRect.left - firstColumnLeft + 1) / stride);
  } finally {
    flow.style.transform = previousTransform;
    flow.style.webkitTransform = previousWebkitTransform;
  }
  return Math.min(Math.max(0, page), Math.max(0, count - 1));
}
function setReaderPagePosition(page, behavior = 'smooth') {
  const viewport = $('.reader-page-viewport');
  const flow = $('.reader-page-flow');
  if (!viewport || !flow || !viewport.clientWidth) return 0;
  ensureReaderPageColumns(viewport, flow);
  const count = readerPageCount(viewport);
  const nextPage = Math.min(Math.max(0, Math.round(Number(page) || 0)), count - 1);
  state.readerPage = nextPage;
  const transform = 'translate3d(' + (-nextPage * viewport.clientWidth) + 'px, 0, 0)';
  const transition = behavior === 'smooth' ? 'transform .68s cubic-bezier(.22,.72,.24,1)' : 'none';
  flow.style.transition = transition;
  flow.style.webkitTransition = transition;
  flow.style.transform = transform;
  flow.style.webkitTransform = transform;
  const previousBehavior = viewport.style.scrollBehavior;
  viewport.style.scrollBehavior = 'auto';
  viewport.scrollLeft = 0;
  viewport.style.scrollBehavior = previousBehavior;
  if (behavior === 'smooth') {
    clearTimeout(flow.readerPageTransitionTimer);
    flow.readerPageTransitionTimer = setTimeout(() => {
      if (!flow.isConnected) return;
      flow.style.transition = '';
      flow.style.webkitTransition = '';
    }, 720);
  }
  updateReaderPager();
  if (!readerPositionRestoring) scheduleReaderProgress(viewport);
  return nextPage;
}
function updateReaderPager() {
  const viewport = $('.reader-page-viewport'); if (!viewport) return;
  const flow = $('.reader-page-flow');
  if (flow) ensureReaderPageColumns(viewport, flow);
  const count = readerPageCount(viewport);
  state.readerPage = Math.min(Math.max(0, Math.round(Number(state.readerPage) || 0)), count - 1);
  viewport.dataset.readerLayoutPages = String(count);
  if (flow) {
    const transform = 'translate3d(' + (-state.readerPage * viewport.clientWidth) + 'px, 0, 0)';
    flow.style.transform = transform;
    flow.style.webkitTransform = transform;
  }
  const current = $('[data-reader-page-current]'); const total = $('[data-reader-page-count]');
  if (current) current.textContent = String(state.readerPage + 1);
  if (total) total.textContent = String(count);
  const previous = $('[data-reader-page-prev]'); const next = $('[data-reader-page-next]');
  if (previous) previous.disabled = state.readerPage <= 0;
  if (next) next.disabled = state.readerPage >= count - 1;
  updateReaderReferenceChrome();
}
function restoreReaderPosition() {
  const book = readerBookById(state.readerBookId); const content = $('[data-reader-content]'); if (!book || !content) return;
  if (state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) {
    const count = readerPageCount(content);
    const page = state.readerPage || Math.round((book.progress || 0) * Math.max(0, count - 1));
    setReaderPagePosition(page, 'instant');
  } else if (book.progress) {
    const progress = Math.min(1, Math.max(0, Number(book.progress) || 0));
    const documentMetrics = readerDocumentScrollMetrics(content);
    if (documentMetrics) {
      window.scrollTo({ top: documentMetrics.documentTop + documentMetrics.max * progress, behavior: 'auto' });
    } else {
      const maxScrollTop = Math.max(0, content.scrollHeight - content.clientHeight);
      content.scrollTop = maxScrollTop * progress;
    }
  }
  updateReaderReferenceChrome();
}
function readerFullscreenElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
async function requestReaderFullscreen() {
  // iPhone Safari does not support element fullscreen for ordinary page
  // content. Skip the rejected/native path entirely so a transient WebKit
  // fullscreen event cannot undo the CSS immersive reader state.
  if (isIosSafariBrowser()) { readerNativeFullscreen = false; return false; }
  if (readerFullscreenElement()) { readerNativeFullscreen = true; return true; }
  const root = document.documentElement;
  const request = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!request) { readerNativeFullscreen = false; return false; }
  try {
    await Promise.resolve(request.call(root, { navigationUI: 'hide' }));
    readerNativeFullscreen = Boolean(readerFullscreenElement());
    return readerNativeFullscreen;
  } catch {
    // iPhone Safari rejects element fullscreen for ordinary page content. The
    // CSS reader-focus fallback remains active in that case.
    readerNativeFullscreen = false;
    return false;
  }
}
function exitReaderFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen;
  readerNativeFullscreen = false;
  if (!readerFullscreenElement() || !exit) return Promise.resolve();
  try { return Promise.resolve(exit.call(document)).catch(() => {}); } catch { return Promise.resolve(); }
}
function updateReaderFullscreenControl() {
  const buttons = $$('.reader-fullscreen-tool'); if (!buttons.length) return;
  const active = state.readerImmersive || Boolean(readerFullscreenElement());
  const icon = active
    ? '<svg class="reader-fullscreen-icon reader-fullscreen-exit" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M20 15h-5v5M9 20v-5H4"/></svg>'
    : '<svg class="reader-fullscreen-icon reader-fullscreen-enter" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>';
  buttons.forEach((button) => {
    button.innerHTML = icon + '<span>' + (active ? t('readerExitFullscreen') : t('readerFullscreen')) + '</span>';
    button.setAttribute('aria-label', active ? t('readerExitFullscreen') : t('readerFullscreen'));
  });
}
function ensureReaderFullscreenTool() {
  const header = $('.reader-reference-top');
  const topButton = header?.querySelector('[data-reader-fullscreen]');
  topButton?.classList.add('reader-fullscreen-tool', 'reader-reference-top-fullscreen');
  topButton?.setAttribute('aria-label', t('readerFullscreen'));
  const row = $('.reader-reference-tool-row');
  if (row && !row.querySelector('.reader-fullscreen-tool')) {
    const button = document.createElement('button');
    button.className = 'reader-reference-tool reader-fullscreen-tool';
    button.setAttribute('data-reader-fullscreen', '');
    button.setAttribute('aria-label', t('readerFullscreen'));
    button.innerHTML = '<span>' + t('readerFullscreen') + '</span>';
    const annotation = row.querySelector('.reader-annotate-button');
    row.insertBefore(button, annotation || null);
  }
}
function toggleReaderFullscreen() {
  flushReaderProgress();
  readerPositionRestoring = true;
  const wasDocumentScroll = readerUsesDocumentScroll();
  const content = $('[data-reader-content]');
  const previousProgress = wasDocumentScroll ? readerScrollProgress(content) : null;
  state.readerImmersive = !state.readerImmersive;
  state.readerChromeHidden = state.readerImmersive;
  state.readerPreferences.fullscreenOnOpen = state.readerImmersive;
  saveReaderPreferences();
  if (state.readerImmersive) requestReaderFullscreen(); else exitReaderFullscreen();
  render();
  if (wasDocumentScroll && !state.readerImmersive && previousProgress != null) {
    requestAnimationFrame(() => {
      const nextContent = $('[data-reader-content]');
      if (nextContent) nextContent.scrollTop = previousProgress * Math.max(0, nextContent.scrollHeight - nextContent.clientHeight);
      window.scrollTo({ top: 0, behavior: 'auto' });
      updateReaderReferenceChrome();
    });
  }
}
function renderReaderView(content, hint = '', toc = [], readingMode = 'pages') {
  readerPositionRestoring = true;
  state.readerContent = content;
  state.readerHint = hint;
  state.readerToc = Array.isArray(toc) ? toc : [];
  state.readerMode = 'reading';
  state.readerReadingMode = readingMode === 'scroll' ? 'scroll' : 'pages';
  state.readerChromeHidden = state.readerImmersive;
  state.readerPage = 0;
  render();
  scheduleReaderPositionRestore();
}
async function openReaderBook(id) {
  const book = readerBookById(id); if (!book) return;
  flushReaderProgress();
  readerPositionRestoring = true;
  releaseReaderAssets();
  state.readerImmersive = state.readerPreferences.fullscreenOnOpen === true;
  if (state.readerImmersive) requestReaderFullscreen(); else exitReaderFullscreen();
  state.readerBookId = id; state.readerSelectedText = ''; state.readerSelection = null; state.readerAnnotationDraft = null; book.lastOpenedAt = Date.now(); saveLibrary();
  awardPetPoints(5, 'book', 'book:' + id + ':' + dateKey(new Date()));
  try {
    let content = ''; let hint = ''; let toc = [];
    if (book.type === 'md') { content = markdownToHtml(book.content); toc = readerTextToc(book.content).map((item) => ({ ...item })); }
    else if (book.type === 'txt' && typeof book.content === 'string') { content = textToHtml(book.content); toc = readerTextToc(book.content).map((item) => ({ ...item })); hint = 'TXT · ' + Math.max(1, Math.round(book.size / 1024)) + ' KB'; }
    else {
      const data = await oneBoxDbGet('books', id);
      if (!data) {
        if (book.syncFileMissing) throw Error(t('readerFileMissing'));
        throw Error();
      }
      const bytes = new Uint8Array(data);
      if (book.type === 'txt') { const source = readerDecodeText(bytes); content = textToHtml(source); toc = readerTextToc(source).map((item) => ({ ...item })); hint = 'TXT · ' + Math.max(1, Math.round(book.size / 1024)) + ' KB'; }
      else if (book.type === 'epub') { const parsed = await epubToHtml(bytes); content = parsed.html; toc = parsed.toc || []; hint = parsed.title ? parsed.title + ' · ' + t('epubHint') : t('epubHint'); }
      else { state.readerUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); content = '<iframe class="reader-pdf" title="' + escapeHtml(book.name) + '" src="' + state.readerUrl + '"></iframe>'; hint = t('pdfHint'); }
    }
    // Restore the user's last reading mode for both Safari and the PWA. The
    // mode is a device preference, not a per-open default.
    renderReaderView(content, hint, toc, state.readerPreferences.readingMode === 'pages' ? 'pages' : 'scroll');
  } catch (error) { releaseReaderAssets(); toast(error?.message || t('importFailed'), 'error'); state.readerBookId = null; }
}
function closeReader() {
  flushReaderProgress();
  const wasDocumentScroll = readerUsesDocumentScroll();
  exitReaderFullscreen();
  if (state.readerUrl) URL.revokeObjectURL(state.readerUrl);
  releaseReaderAssets();
  if (wasDocumentScroll) window.scrollTo({ top: 0, behavior: 'auto' });
  state.readerUrl = ''; state.readerBookId = null; state.readerContent = ''; state.readerHint = ''; state.readerToc = []; state.readerDialog = ''; state.readerChromeHidden = false; state.readerImmersive = false; state.readerMode = 'library'; state.readerReadingMode = 'scroll'; state.readerPage = 0; state.readerSelectedText = ''; state.readerSelection = null; state.readerAnnotationDraft = null;
  render();
}
const READER_THEME_VALUES = {
  paper: { bg: '#f4f0e7', panel: '#faf7ef', ink: '#2d3035', muted: '#74736d', line: '#d9d3c8' },
  sepia: { bg: '#e7e2d6', panel: '#eee9dd', ink: '#45423b', muted: '#777268', line: '#c9c2b5' },
  green: { bg: '#e7f1e7', panel: '#f5fbf5', ink: '#263b2e', muted: '#65756a', line: '#cbdcca' },
  dark: { bg: '#1d1f24', panel: '#25282f', ink: '#c5c8cf', muted: '#959aa5', line: '#3b3f49' },
};
const READER_FONT_VALUES = { system: 'var(--font-sans)', serif: 'Georgia, "Times New Roman", serif', mono: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
function saveReaderPreferences() { saveStored(STORAGE.readerPreferences, state.readerPreferences); }
let readerSafariTintPulse = 0;
function pulseReaderSafariTint(color) {
  if (!isIosSafariReaderSurfaceActive()) return;
  const meta = $('meta[name="theme-color"]');
  if (!meta) return;
  const pulse = ++readerSafariTintPulse;
  meta.setAttribute('content', color);
  requestAnimationFrame(() => {
    if (pulse !== readerSafariTintPulse || !isIosSafariReaderSurfaceActive()) return;
    // Safari 26 may keep the previous sampled tint after a live CSS update.
    // A one-frame alpha variant wakes its tint observer; the clean color is
    // restored on the following frame without changing the visible page.
    meta.setAttribute('content', color + 'fe');
    requestAnimationFrame(() => {
      if (pulse === readerSafariTintPulse && isIosSafariReaderSurfaceActive()) meta.setAttribute('content', color);
    });
  });
}
function syncReaderSafariSurface() {
  const root = document.documentElement;
  const body = document.body;
  const active = isIosSafariReaderSurfaceActive();
  root.classList.toggle('reader-safari-surface', active);
  root.classList.toggle('reader-safari-page-surface', active && state.readerReadingMode === 'pages');
  const metas = $$('meta[name="theme-color"]');
  if (!active) {
    readerSafariTintPulse += 1;
    root.style.removeProperty('--onebox-reader-surface-bg');
    root.style.removeProperty('background');
    root.style.removeProperty('background-color');
    body?.style.removeProperty('background');
    body?.style.removeProperty('background-color');
    metas.forEach((meta) => {
      if (!meta.dataset.oneboxReaderThemeColor) return;
      meta.content = meta.dataset.oneboxReaderThemeColor;
      const media = meta.dataset.oneboxReaderThemeMedia;
      if (media) meta.setAttribute('media', media);
      else meta.removeAttribute('media');
      delete meta.dataset.oneboxReaderThemeColor;
      delete meta.dataset.oneboxReaderThemeMedia;
    });
    $('.reader-safari-edge-top')?.style.removeProperty('background');
    $('.reader-safari-edge-top')?.style.removeProperty('background-color');
    return;
  }
  const palette = READER_THEME_VALUES[state.readerPreferences.theme] || READER_THEME_VALUES.paper;
  root.style.setProperty('--onebox-reader-surface-bg', palette.bg);
  root.style.setProperty('background', palette.bg, 'important');
  root.style.setProperty('background-color', palette.bg, 'important');
  if (body) {
    body.style.setProperty('background', palette.bg, 'important');
    body.style.setProperty('background-color', palette.bg, 'important');
  }
  metas.forEach((meta, index) => {
    if (!meta.dataset.oneboxReaderThemeColor) {
      meta.dataset.oneboxReaderThemeColor = meta.content;
      meta.dataset.oneboxReaderThemeMedia = meta.getAttribute('media') || '';
    }
    // Safari can keep using the dark media-qualified tag after its content
    // changes. During the reader surface, expose one unconditional tag and
    // disable the original alternatives until the reader closes.
    if (index === 0) meta.removeAttribute('media');
    else meta.setAttribute('media', 'not all');
    meta.content = palette.bg;
  });
  const edge = $('.reader-safari-edge-top');
  edge?.style.setProperty('background', palette.bg, 'important');
  edge?.style.setProperty('background-color', palette.bg, 'important');
}
function applyReaderPreferences() {
  syncReaderSafariSurface();
  const shell = $('.reader-reference-shell, .reader-reading-shell'); if (!shell) return;
  const prefs = state.readerPreferences; const palette = READER_THEME_VALUES[prefs.theme] || READER_THEME_VALUES.paper;
  // Reader dialogs are mounted outside the reading shell. Their contrast must
  // follow the selected reading surface, not the app-wide theme, otherwise a
  // light note sheet can inherit light text from the global dark mode.
  const readerUiDark = prefs.theme === 'dark';
  const readerUiInk = readerUiDark ? '#ffffff' : '#000000';
  const readerUiMuted = readerUiDark ? '#bdbdbd' : '#606060';
  const readerUiPanel = palette.panel;
  const readerUiLine = palette.line;
  shell.dataset.readerTheme = prefs.theme;
  shell.style.setProperty('--reader-bg', palette.bg);
  shell.style.setProperty('--reader-panel', palette.panel);
  shell.style.setProperty('--reader-ink', palette.ink);
  shell.style.setProperty('--reader-muted', palette.muted);
  shell.style.setProperty('--reader-line', palette.line);
  shell.style.setProperty('--reader-font', READER_FONT_VALUES[prefs.fontFamily] || READER_FONT_VALUES.system);
  shell.style.setProperty('--reader-size', prefs.fontSize + 'px');
  shell.style.setProperty('--reader-line-height', prefs.lineHeight);
  shell.style.setProperty('--reader-paragraph-spacing', prefs.paragraphSpacing + 'px');
  shell.style.setProperty('--reader-letter-spacing', prefs.letterSpacing + 'px');
  // The dialogs are mounted outside the reader shell. Their surface follows
  // Mine > Settings > Theme and their text stays deliberately black/white;
  // the reading page itself keeps the selected paper/sepia/green/night ink.
  ['#readerDialog', '#annotationDialog'].forEach((selector) => {
    const dialog = $(selector); if (!dialog) return;
    dialog.dataset.readerTheme = prefs.theme;
    dialog.style.setProperty('--reader-bg', palette.bg);
    dialog.style.setProperty('--reader-panel', palette.panel);
    dialog.style.setProperty('--reader-ink', palette.ink);
    dialog.style.setProperty('--reader-muted', palette.muted);
    dialog.style.setProperty('--reader-line', palette.line);
    dialog.style.setProperty('--reader-ui-ink', readerUiInk);
    dialog.style.setProperty('--reader-ui-muted', readerUiMuted);
    dialog.style.setProperty('--reader-ui-panel', readerUiPanel);
    dialog.style.setProperty('--reader-ui-line', readerUiLine);
  });
  // Reapply after the reader variables and edge node are updated. This is
  // intentionally a second pass for iOS Safari, whose chrome samples the
  // viewport edge during style recalculation.
  if (isIosSafariReaderSurfaceActive()) {
    syncReaderSafariSurface();
    pulseReaderSafariTint(palette.bg);
    requestAnimationFrame(() => { if (isIosSafariReaderSurfaceActive()) syncReaderSafariSurface(); });
  }
}
function readerDialogMarkup(kind) {
  const dialog = $('#readerDialog'); if (!dialog) return;
  const prefs = state.readerPreferences;
  const closeButton = '<button class="reader-dialog-close" data-close-reader-dialog aria-label="' + t('close') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button>';
  const title = (heading, hint) => '<div class="reader-dialog-title"><h2>' + heading + '</h2><small>' + hint + '</small></div>';
  const themeButton = (id, label) => '<button class="reader-theme-choice ' + (prefs.theme === id ? 'active' : '') + '" data-reader-theme="' + id + '"><span class="reader-theme-dot theme-' + id + '"></span>' + label + '</button>';
  const choiceButton = (group, value, label, current) => '<button type="button" class="reader-theme-choice reader-setting-choice ' + (String(current) === String(value) ? 'active' : '') + '" data-reader-choice="' + group + '" data-reader-choice-value="' + value + '">' + label + '</button>';
  const choiceGroup = (heading, group, current, choices, className) => '<div class="reader-setting-row"><h3>' + heading + '</h3><div class="reader-choice-grid ' + (className || '') + '">' + choices.map(([value, label]) => choiceButton(group, value, label, current)).join('') + '</div></div>';
  if (kind === 'toc') {
    const items = state.readerToc || [];
    const currentIndex = currentReaderChapterIndex();
    const body = items.length ? items.map((item, position) => '<button class="reader-toc-item depth-' + Math.min(3, Number(item.depth) || 0) + (position === currentIndex ? ' active' : '') + '" data-reader-toc-id="' + escapeHtml(item.id || '') + '" data-reader-toc-section="' + (item.section == null ? '' : item.section) + '" data-reader-toc-anchor="' + escapeHtml(item.anchor || '') + '"' + (position === currentIndex ? ' aria-current="true"' : '') + '><span>' + escapeHtml(item.label || '—') + '</span></button>').join('') : '<p class="empty compact reader-dialog-empty">' + t('readerNoContents') + '</p>';
    dialog.innerHTML = '<div class="reader-dialog-card reader-panel-card" role="dialog" aria-modal="true"><div class="dialog-head reader-dialog-head">' + title(t('readerContents'), t('readerTocHint')) + closeButton + '</div><div class="reader-toc-list">' + body + '</div></div>';
  } else if (kind === 'background') {
    dialog.innerHTML = '<div class="reader-dialog-card reader-panel-card reader-sheet-card" role="dialog" aria-modal="true"><div class="dialog-head reader-dialog-head">' + title(t('readerTheme'), t('readerSettingsHint')) + closeButton + '</div><div class="reader-sheet-body"><div class="reader-theme-grid reader-theme-grid-large">' + themeButton('paper', t('readerThemePaper')) + themeButton('sepia', t('readerThemeSepia')) + themeButton('green', t('readerThemeGreen')) + themeButton('dark', t('readerThemeDark')) + '</div></div></div>';
  } else if (kind === 'comments') {
    const comments = readerCommentEntries(readerBookById(state.readerBookId)).slice().reverse();
    const body = comments.length ? comments.map((item) => '<button type="button" class="reader-comment-item" data-reader-comment-item="' + escapeHtml(item.id || '') + '"><span class="reader-comment-item-number">' + escapeHtml(item.label) + '</span><span class="reader-comment-item-copy"><strong>' + escapeHtml(item.quote || '—') + '</strong><small>' + escapeHtml(item.note || '') + '</small></span></button>').join('') : '<p class="empty compact reader-dialog-empty">' + t('noAnnotations') + '</p>';
    dialog.innerHTML = '<div class="reader-dialog-card reader-panel-card reader-comments-card" role="dialog" aria-modal="true"><div class="dialog-head reader-dialog-head">' + title(t('readerComments'), t('readerNotesHint')) + closeButton + '</div><div class="reader-comments-list">' + body + '</div></div>';
  } else if (kind === 'animation') {
    const option = (value, label) => '<button class="reader-sheet-choice ' + (prefs.pageAnimation === value ? 'active' : '') + '" data-reader-animation="' + value + '"><span>' + label + '</span><i>' + (prefs.pageAnimation === value ? '✓' : '') + '</i></button>';
    dialog.innerHTML = '<div class="reader-dialog-card reader-panel-card reader-sheet-card" role="dialog" aria-modal="true"><div class="dialog-head reader-dialog-head">' + title(t('readerAnimation'), t('readerSettingsHint')) + closeButton + '</div><div class="reader-sheet-body reader-choice-list">' + option('slide', state.language === 'en' ? 'Smooth horizontal slide' : '水平平滑翻页') + option('none', t('readerAnimationNone')) + '</div></div>';
  } else {
    const nearestChoice = (value, choices) => choices.reduce((best, choice) => Math.abs(Number(choice) - Number(value)) < Math.abs(Number(best) - Number(value)) ? choice : best, choices[0]);
    const fontSizeValues = [16, 18, 20, 22, 24];
    const lineHeightValues = [1.6, 1.8, 2];
    const paragraphSpacingValues = [8, 14, 20];
    const letterSpacingValues = [0, .5, 1];
    const fontSizeCurrent = nearestChoice(prefs.fontSize, fontSizeValues);
    const lineHeightCurrent = nearestChoice(prefs.lineHeight, lineHeightValues);
    const paragraphSpacingCurrent = nearestChoice(prefs.paragraphSpacing, paragraphSpacingValues);
    const letterSpacingCurrent = nearestChoice(prefs.letterSpacing, letterSpacingValues);
    if (prefs.fontSize !== fontSizeCurrent || prefs.lineHeight !== lineHeightCurrent || prefs.paragraphSpacing !== paragraphSpacingCurrent || prefs.letterSpacing !== letterSpacingCurrent) {
      prefs.fontSize = fontSizeCurrent; prefs.lineHeight = lineHeightCurrent; prefs.paragraphSpacing = paragraphSpacingCurrent; prefs.letterSpacing = letterSpacingCurrent; saveReaderPreferences(); applyReaderPreferences();
    }
    const fullscreenChoice = choiceGroup(t('readerFullscreenOnOpen'), 'fullscreenOnOpen', prefs.fullscreenOnOpen ? 'true' : 'false', [['true', state.language === 'en' ? 'Fullscreen' : '全屏'], ['false', state.language === 'en' ? 'Windowed' : '非全屏']], 'reader-choice-grid-2');
    const readingCurrent = state.readerReadingMode === 'scroll' ? 'scroll' : 'pages';
    const readingChoices = choiceGroup(t('readerReadingMethod'), 'readingMode', readingCurrent, [['scroll', t('readerScroll')], ['pages', t('readerPages')]], 'reader-choice-grid-2');
    const fontSizeChoices = choiceGroup(t('readerFontSize'), 'fontSize', fontSizeCurrent, fontSizeValues.map((value) => [String(value), value + 'px']), 'reader-choice-grid-5');
    const fontChoices = choiceGroup(t('readerFontFamily'), 'fontFamily', prefs.fontFamily, [['system', '系统无衬线'], ['serif', '阅读衬线'], ['mono', '等宽字体']], 'reader-choice-grid-3');
    const lineHeightChoices = choiceGroup(t('readerLineHeight'), 'lineHeight', lineHeightCurrent, lineHeightValues.map((value) => [String(value), value.toFixed(1)]), 'reader-choice-grid-3');
    const paragraphSpacingChoices = choiceGroup(t('readerParagraphSpacing'), 'paragraphSpacing', paragraphSpacingCurrent, paragraphSpacingValues.map((value) => [String(value), value + 'px']), 'reader-choice-grid-3');
    const letterSpacingChoices = choiceGroup(t('readerLetterSpacing'), 'letterSpacing', letterSpacingCurrent, [['0', '标准'], ['0.5', '0.5px'], ['1', '1px']], 'reader-choice-grid-3');
    const themeChoices = '<div class="reader-setting-row"><h3>' + t('readerTheme') + '</h3><div class="reader-theme-grid reader-theme-grid-inline">' + themeButton('paper', t('readerThemePaper')) + themeButton('sepia', t('readerThemeSepia')) + themeButton('green', t('readerThemeGreen')) + themeButton('dark', t('readerThemeDark')) + '</div></div>';
    dialog.innerHTML = '<div class="reader-dialog-card reader-panel-card" role="dialog" aria-modal="true"><div class="dialog-head reader-dialog-head">' + title(t('settings'), t('readerSettingsHint')) + closeButton + '</div><div class="reader-settings-body">' + themeChoices + fullscreenChoice + readingChoices + fontSizeChoices + fontChoices + lineHeightChoices + paragraphSpacingChoices + letterSpacingChoices + '</div></div>';
  }
  dialog.hidden = false;
}
function closeReaderDialog() { const dialog = $('#readerDialog'); if (dialog) dialog.hidden = true; state.readerDialog = ''; }
function openReaderDialog(kind) { state.readerDialog = kind; readerDialogMarkup(kind); updateReaderReferenceChrome(); if (kind === 'toc') requestAnimationFrame(() => updateReaderTocActiveState(true)); }
function readerPreferenceLabel(key, value) {
  if (key === 'fontSize' || key === 'paragraphSpacing') return value + 'px';
  if (key === 'lineHeight') return Number(value).toFixed(2);
  if (key === 'letterSpacing') return Number(value).toFixed(1) + 'px';
  return String(value);
}
function readerPreferenceChanged(input) {
  const key = input.dataset.readerPreference; if (!key) return;
  const numeric = ['fontSize', 'lineHeight', 'paragraphSpacing', 'letterSpacing'].includes(key);
  state.readerPreferences[key] = numeric ? Number(input.value) : input.value;
  saveReaderPreferences(); applyReaderPreferences();
  const value = $('[data-reader-value="' + key + '"]', $('#readerDialog'));
  if (value) value.textContent = readerPreferenceLabel(key, state.readerPreferences[key]);
}
function setReaderReadingMode(mode) {
  const nextMode = mode === 'pages' ? 'pages' : 'scroll';
  if (state.readerMode === 'reading' && state.readerReadingMode !== nextMode) {
    const content = $('[data-reader-content]');
    const book = readerBookById(state.readerBookId);
    if (content && book) {
      book.progress = state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')
        ? Math.min(1, Math.max(0, state.readerPage / Math.max(1, readerPageCount(content) - 1)))
        : readerScrollProgress(content);
      saveReaderCheckpoint(book);
      saveLibrary();
    }
  }
  readerPositionRestoring = true;
  state.readerPreferences.readingMode = nextMode;
  saveReaderPreferences();
  state.readerReadingMode = nextMode;
  state.readerChromeHidden = state.readerImmersive;
  state.readerPage = 0;
  render();
  scheduleReaderPositionRestore();
}
function hideReaderSelectionMenu() {
  if (readerSelectionHideTimer) {
    clearTimeout(readerSelectionHideTimer);
    readerSelectionHideTimer = 0;
  }
  const menu = $('[data-reader-selection-menu]');
  if (menu) menu.hidden = true;
  const dock = $('[data-reader-selection-dock]');
  if (dock) dock.hidden = true;
  // A hidden menu means the native range is no longer an actionable reader
  // selection. Clearing this transient state prevents it from swallowing the
  // next tap on the reader controls or the page surface.
  if (Date.now() >= readerSelectionSuppressUntil) {
    state.readerSelection = null;
    state.readerSelectedText = '';
  }
}
function scheduleReaderSelectionMenuHide(delay = 180) {
  if (readerSelectionHideTimer) clearTimeout(readerSelectionHideTimer);
  readerSelectionHideTimer = setTimeout(() => {
    readerSelectionHideTimer = 0;
    if (window.getSelection?.()?.rangeCount && !window.getSelection().isCollapsed) return;
    if (Date.now() < readerSelectionSuppressUntil) {
      scheduleReaderSelectionMenuHide(Math.max(80, readerSelectionSuppressUntil - Date.now()));
      return;
    }
    hideReaderSelectionMenu();
  }, delay);
}
function suppressReaderPageGesture(duration = 900) {
  readerSelectionSuppressUntil = Math.max(readerSelectionSuppressUntil, Date.now() + duration);
}
function readerHasLiveSelection() {
  const selection = window.getSelection?.();
  return Boolean(state.readerSelection || (selection?.rangeCount && !selection.isCollapsed));
}
function readerNativeSelectionRange() {
  if (!state.readerBookId || state.readerMode !== 'reading') return null;
  const selection = window.getSelection?.();
  const content = $('[data-reader-content]');
  if (!selection || !content || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  const inside = (node) => Boolean(node && (node === content || content.contains(node)));
  // WebKit can report the common ancestor as a document/column wrapper while
  // the actual endpoints are still inside the reader. Check both endpoints so
  // a valid iOS selection is not discarded before the action bar is shown.
  return inside(range.commonAncestorContainer) || (inside(range.startContainer) && inside(range.endContainer)) ? range : null;
}
function clearReaderSelectionState() {
  state.readerSelection = null;
  state.readerSelectedText = '';
  state.readerAnnotationDraft = null;
  window.getSelection?.()?.removeAllRanges();
}
function captureReaderPosition(content = $('[data-reader-content]')) {
  if (!content) return null;
  return {
    mode: state.readerReadingMode,
    page: state.readerPage,
    progress: readerScrollProgress(content),
    anchor: state.readerSelection ? { ...state.readerSelection } : null,
  };
}
function syncReaderBookProgressToSnapshot(book, position) {
  if (!book || !position) return;
  if (position.mode === 'pages') {
    const content = $('[data-reader-content]');
    const count = content?.classList.contains('reader-page-viewport') ? readerPageCount(content) : 1;
    book.progress = Math.min(1, Math.max(0, Number(position.page || 0) / Math.max(1, count - 1)));
  } else if (Number.isFinite(Number(position.progress))) {
    book.progress = Math.min(1, Math.max(0, Number(position.progress)));
  }
  saveReaderCheckpoint(book);
}
function restoreReaderSnapshotImmediately(position) {
  if (!position || state.readerMode !== 'reading') return;
  const content = $('[data-reader-content]');
  if (!content) return;
  if (position.mode === 'pages' && state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) {
    state.readerPage = Math.max(0, Number(position.page) || 0);
    setReaderPagePosition(state.readerPage, 'instant');
    updateReaderPager();
    return;
  }
  const progress = Math.min(1, Math.max(0, Number(position.progress) || 0));
  const metrics = readerDocumentScrollMetrics(content);
  if (metrics) window.scrollTo({ top: metrics.documentTop + metrics.max * progress, behavior: 'auto' });
  else content.scrollTop = progress * Math.max(0, content.scrollHeight - content.clientHeight);
  updateReaderReferenceChrome();
}
function preserveReaderPositionAfterRender(position) {
  if (!position) return;
  // workspace.innerHTML is replaced synchronously by render(). Put the old
  // page/scroll position back before the browser paints that new DOM, then
  // keep the existing delayed pass for CSS columns that settle one frame later.
  restoreReaderSnapshotImmediately(position);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (state.readerMode !== 'reading') return;
    const content = $('[data-reader-content]');
    if (!content) return;
    if (position.mode === 'pages' && state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) {
      const fallbackPage = Math.max(0, Number(position.page) || 0);
      // Markup wrappers can change Range geometry while WebKit is rebuilding
      // CSS columns. The page the user was reading is the stable source of
      // truth here; restoring from a newly measured Range can incorrectly
      // move a third-page annotation back to page 2 or page 1.
      const restorePage = () => {
        if (state.readerMode !== 'reading' || state.readerReadingMode !== 'pages') return;
        state.readerPage = fallbackPage;
        setReaderPagePosition(fallbackPage, 'instant');
        updateReaderPager();
      };
      restorePage();
      // A newly wrapped selection can make WebKit report one fewer CSS column
      // for a frame. Retry after the column track settles so that transient
      // measurement cannot clamp the captured page and leave it there.
      clearTimeout(readerMarkupRestoreTimer);
      readerMarkupRestoreTimer = setTimeout(() => {
        readerMarkupRestoreTimer = null;
        restorePage();
      }, 220);
      return;
    }
    if (state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) return;
    const range = position.anchor?.quote ? readerFindQuoteRange(content, position.anchor.quote) : null;
    const rangeRect = range?.getBoundingClientRect?.();
    const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || content.clientHeight || 1);
    if (rangeRect && rangeRect.height) {
      if (readerUsesDocumentScroll()) {
        window.scrollTo({ top: Math.max(0, window.scrollY + rangeRect.top - viewportHeight * 0.3), behavior: 'auto' });
      } else {
        const contentRect = content.getBoundingClientRect();
        content.scrollTop = Math.max(0, content.scrollTop + rangeRect.top - contentRect.top - content.clientHeight * 0.3);
      }
    } else {
      const progress = Math.min(1, Math.max(0, Number(position.progress) || 0));
      const documentMetrics = readerDocumentScrollMetrics(content);
      if (documentMetrics) window.scrollTo({ top: documentMetrics.documentTop + documentMetrics.max * progress, behavior: 'auto' });
      else content.scrollTop = progress * Math.max(0, content.scrollHeight - content.clientHeight);
    }
    updateReaderReferenceChrome();
  }));
}
function preserveReaderPageAfterRender(page) {
  preserveReaderPositionAfterRender({ mode: 'pages', page: Number(page) || 0 });
}
function readerTextOffset(root, container, offset) {
  if (!root || !container) return -1;
  try {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(container, offset);
    return range.toString().length;
  } catch { return -1; }
}
function readerRangeAtTextOffsets(root, start, end) {
  if (!root || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node; let cursor = 0; let startNode = null; let endNode = null; let startOffset = 0; let endOffset = 0;
  while ((node = walker.nextNode())) {
    const next = cursor + node.nodeValue.length;
    if (!startNode && start >= cursor && start <= next) { startNode = node; startOffset = Math.max(0, start - cursor); }
    if (end >= cursor && end <= next) { endNode = node; endOffset = Math.max(0, end - cursor); break; }
    cursor = next;
  }
  if (!startNode || !endNode) return null;
  const range = document.createRange();
  try { range.setStart(startNode, startOffset); range.setEnd(endNode, endOffset); return range; } catch { return null; }
}
function readerSelectionAnchor(root, range) {
  const start = readerTextOffset(root, range.startContainer, range.startOffset);
  const end = readerTextOffset(root, range.endContainer, range.endOffset);
  if (start < 0 || end <= start) return null;
  return { start, end, quote: range.toString().trim().slice(0, 1200) };
}
function readerSelectionMenuPosition(range) {
  const menu = $('[data-reader-selection-menu]'); const shell = $('.reader-reference-shell');
  if (!menu || !shell) return;
  menu.hidden = false;
  const shellRect = shell.getBoundingClientRect();
  const rects = [...range.getClientRects()].filter((item) => item.width > 0 && item.height > 0);
  const visibleRect = rects.find((item) => item.bottom >= shellRect.top && item.top <= shellRect.bottom && item.right >= shellRect.left && item.left <= shellRect.right);
  const rect = visibleRect || rects[0] || range.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const left = Math.min(Math.max(8, rect.left - shellRect.left + (rect.width - menuRect.width) / 2), shellRect.width - menuRect.width - 8);
  const above = rect.top - shellRect.top - menuRect.height - 8;
  const top = above >= 8 ? above : Math.min(shellRect.height - menuRect.height - 8, rect.bottom - shellRect.top + 8);
  menu.style.left = Math.max(8, left) + 'px';
  menu.style.top = Math.max(8, top) + 'px';
}
function readerShowSelectionMenu(range) {
  const root = $('[data-reader-content]');
  const inside = (node) => Boolean(node && (node === root || root?.contains(node)));
  if (!root || !range || !(inside(range.commonAncestorContainer) || (inside(range.startContainer) && inside(range.endContainer)))) return;
  const anchor = readerSelectionAnchor(root, range);
  if (!anchor || !anchor.quote) return hideReaderSelectionMenu();
  if (readerSelectionHideTimer) {
    clearTimeout(readerSelectionHideTimer);
    readerSelectionHideTimer = 0;
  }
  state.readerSelectedText = anchor.quote;
  state.readerSelection = anchor;
  suppressReaderPageGesture(1200);
  const menu = $('[data-reader-selection-menu]');
  if (menu) menu.hidden = false;
  // Keep the browser's live range intact. Clearing it here makes the native
  // selection highlight disappear on iOS/PWA and also breaks subsequent
  // copy/share actions. The OneBox menu is positioned independently.
  requestAnimationFrame(() => readerSelectionMenuPosition(range));
}
function syncReaderNativeSelectionMenu() {
  if (state.readerMode !== 'reading' || !state.readerBookId) return;
  const range = readerNativeSelectionRange();
  if (range) {
    suppressReaderPageGesture(1200);
    readerShowSelectionMenu(range);
  } else if (!state.readerSelection || Date.now() >= readerSelectionSuppressUntil) {
    scheduleReaderSelectionMenuHide();
  }
}
function scheduleReaderNativeSelectionMenuSync() {
  // iOS Safari can publish the final Range after pointerup/contextmenu. A
  // single immediate read races that hand-off, especially inside a CSS
  // column track, so keep a short bounded retry window.
  [60, 180, 360, 700, 1000].forEach((delay) => window.setTimeout(syncReaderNativeSelectionMenu, delay));
}
function readerFindQuoteRange(root, quote) {
  const text = String(quote || '').trim(); if (!text) return null;
  const start = root.textContent.indexOf(text);
  return start < 0 ? null : readerRangeAtTextOffsets(root, start, start + text.length);
}
function readerCommentEntries(book) {
  if (!book) return [];
  const comments = [];
  (book.annotations || []).filter((item) => item && item.note).forEach((item) => comments.push({ ...item, type: 'comment' }));
  (book.markups || []).filter((item) => item && item.type === 'comment' && !comments.some((comment) => comment.id === item.id)).forEach((item) => comments.push({ ...item }));
  comments.sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0));
  return comments.map((item, index) => ({ ...item, label: index + 1 > 99 ? '..' : String(index + 1) }));
}
function applyReaderMarkups() {
  const root = $('[data-reader-content]'); const book = readerBookById(state.readerBookId);
  if (!root || !book || book.type === 'pdf') return;
  const markups = (book.markups || []).map((item) => ({ ...item, type: item.type === 'comment' ? 'comment' : item.type }));
  const comments = readerCommentEntries(book);
  const commentLabels = new Map(comments.map((item) => [item.id, item.label]));
  const entries = markups.concat(comments).filter((item) => item.type === 'underline' || item.type === 'highlight' || item.type === 'comment');
  entries.sort((a, b) => Number(b.start ?? -1) - Number(a.start ?? -1));
  entries.forEach((item) => {
    const range = Number.isFinite(Number(item.start)) && Number.isFinite(Number(item.end))
      ? readerRangeAtTextOffsets(root, Number(item.start), Number(item.end))
      : readerFindQuoteRange(root, item.quote);
    if (!range || range.collapsed) return;
    const wrapper = document.createElement(item.type === 'comment' ? 'span' : 'mark');
    wrapper.className = item.type === 'comment' ? 'reader-comment-anchor' : 'reader-' + item.type;
    if (item.id) wrapper.dataset.readerMarkupId = item.id;
    const fragment = range.extractContents();
    wrapper.appendChild(fragment);
    if (item.type === 'comment') {
      const badge = document.createElement('button');
      badge.className = 'reader-comment-badge';
      badge.type = 'button';
      badge.dataset.readerCommentId = item.id || '';
      badge.setAttribute('aria-label', state.language === 'en' ? 'Show comment' : '查看评论');
      badge.textContent = commentLabels.get(item.id) || '..';
      wrapper.appendChild(badge);
    }
    range.insertNode(wrapper);
  });
}
function showReaderCommentPopover(id, trigger) {
  const book = readerBookById(state.readerBookId); const note = (book?.annotations || []).find((item) => item.id === id);
  const popover = $('[data-reader-comment-popover]'); const shell = $('.reader-reference-shell');
  if (!note || !popover || !shell) return;
  popover.innerHTML = '<strong>' + (state.language === 'en' ? 'Comment' : '评论') + '</strong><p>' + escapeHtml(note.note || '') + '</p>';
  popover.hidden = false;
  const shellRect = shell.getBoundingClientRect(); const triggerRect = trigger.getBoundingClientRect(); const popoverRect = popover.getBoundingClientRect();
  const left = Math.min(Math.max(10, triggerRect.left - shellRect.left - 8), shellRect.width - popoverRect.width - 10);
  const top = Math.min(Math.max(10, triggerRect.bottom - shellRect.top + 8), shellRect.height - popoverRect.height - 10);
  popover.style.left = left + 'px'; popover.style.top = top + 'px';
}
function hideReaderCommentPopover() { const popover = $('[data-reader-comment-popover]'); if (popover) popover.hidden = true; }
async function copyReaderText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed'; textarea.style.opacity = '0';
  document.body.appendChild(textarea); textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw Error('clipboard unavailable');
}
async function applyReaderSelectionAction(action) {
  const book = readerBookById(state.readerBookId); const selection = state.readerSelection;
  const position = captureReaderPosition();
  suppressReaderPageGesture(1200);
  hideReaderSelectionMenu();
  if (!book || !selection?.quote) return;
  if (action === 'comment') {
    // Moving focus into the note textarea collapses the native Range. Keep a
    // durable copy of the selection until the user explicitly saves/cancels;
    // otherwise delayed selection cleanup erases the note target while the
    // user is still typing.
    state.readerAnnotationDraft = {
      bookId: state.readerBookId,
      quote: selection.quote,
      start: selection.start,
      end: selection.end,
      position,
    };
    return renderAnnotationDialog();
  }
  if (action === 'copy' || action === 'share') {
    try {
      if (action === 'share' && navigator.share) await navigator.share({ title: book.name, text: selection.quote });
      else await copyReaderText(selection.quote);
      toast(state.language === 'en' ? (action === 'share' ? 'Shared' : 'Copied') : (action === 'share' ? '已分享' : '已复制'));
    } catch (error) {
      if (error?.name !== 'AbortError') toast(state.language === 'en' ? 'Copy failed' : '复制失败', 'error');
    }
    clearReaderSelectionState();
    return;
  }
  book.markups ||= [];
  book.markups.push({ id: uid(), type: action, start: selection.start, end: selection.end, quote: selection.quote, createdAt: Date.now() });
  syncReaderBookProgressToSnapshot(book, position);
  clearReaderSelectionState();
  saveLibrary(); render();
  preserveReaderPositionAfterRender(position);
}
function jumpToReaderToc(item) {
  closeReaderDialog();
  const content = $('[data-reader-content]'); if (!content || !item) return;
  const target = readerTocTarget(item);
  if (!target) return;
  if (state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) {
    const page = readerPageForTarget(content, target);
    setReaderPagePosition(page, 'smooth');
  } else if (readerUsesDocumentScroll()) {
    const header = $('.reader-reference-top');
    const chromeVisible = !(state.readerImmersive && state.readerChromeHidden);
    const offset = chromeVisible ? Math.max(12, header?.getBoundingClientRect().height || 0) : 12;
    const top = target.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0) - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    setTimeout(() => { updateReaderReferenceChrome(); updateReaderTocActiveState(); }, 260);
  } else {
    const contentRect = content.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const top = content.scrollTop + targetRect.top - contentRect.top - 12;
    content.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    setTimeout(updateReaderReferenceChrome, 260);
  }
}
function readerTocTarget(item) {
  if (!item) return null;
  if (item.section == null) return document.getElementById(item.id);
  const section = document.getElementById('reader-epub-section-' + item.section);
  if (!section || !item.anchor) return section;
  return [...section.querySelectorAll('[id]')].find((node) => node.id === item.anchor) || section;
}
function jumpToReaderComment(id) {
  const target = $$('.reader-comment-anchor').find((node) => node.dataset.readerMarkupId === String(id || ''));
  if (!target) return closeReaderDialog();
  closeReaderDialog();
  const content = $('[data-reader-content]'); if (!content) return;
  if (state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) {
    const page = readerPageForTarget(content, target);
    setReaderPagePosition(page, 'smooth');
  } else {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(updateReaderReferenceChrome, 260);
  }
}
function currentReaderChapterIndex() {
  const content = $('[data-reader-content]'); if (!content || !state.readerToc.length) return -1;
  if (state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) {
    const page = state.readerPage || 0; let index = 0;
    state.readerToc.forEach((item, position) => { const target = readerTocTarget(item); if (target && readerPageForTarget(content, target) <= page) index = position; });
    return index;
  }
  const header = $('.reader-reference-top');
  const chromeVisible = !(state.readerImmersive && state.readerChromeHidden);
  const top = readerUsesDocumentScroll()
    ? Math.max(24, chromeVisible ? (header?.getBoundingClientRect().height || 0) + 12 : 24)
    : content.getBoundingClientRect().top + 24;
  let index = 0;
  state.readerToc.forEach((item, position) => { const target = readerTocTarget(item); if (target && target.getBoundingClientRect().top <= top) index = position; });
  return index;
}
function updateReaderTocActiveState(reveal = false) {
  const currentIndex = currentReaderChapterIndex();
  const tocItems = $$('#readerDialog [data-reader-toc-id]');
  tocItems.forEach((node, index) => {
    const active = index === currentIndex;
    node.classList.toggle('active', active);
    if (active) node.setAttribute('aria-current', 'true');
    else node.removeAttribute('aria-current');
  });
  if (reveal) tocItems[currentIndex]?.scrollIntoView({ block: 'nearest' });
}
function updateReaderReferenceChrome() {
  const shell = $('.reader-reference-shell'); if (!shell) return;
  shell.classList.toggle('chrome-hidden', state.readerImmersive && state.readerChromeHidden);
  const index = currentReaderChapterIndex(); const item = state.readerToc[index];
  updateReaderTocActiveState();
  const name = $('[data-reader-chapter-name]'); const chapterIndex = $('[data-reader-chapter-index]');
  if (name) name.textContent = item?.label || '—';
  if (chapterIndex) chapterIndex.textContent = state.readerToc.length ? (index + 1) + '/' + state.readerToc.length : '0/0';
  const content = $('[data-reader-content]'); const label = $('[data-reader-progress-label]'); const slider = $('[data-reader-progress]');
  let progress = 0;
  let pageCount = 1;
  if (content) {
    if (state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) {
      pageCount = readerPageCount(content);
      progress = state.readerPage / Math.max(1, pageCount - 1);
    } else progress = readerScrollProgress(content);
  }
  progress = Math.min(1, Math.max(0, progress));
  if (label) label.textContent = Math.round(progress * 100) + '%';
  if (slider && document.activeElement !== slider) slider.value = String(Math.round(progress * 100));
  const percent = Math.round(progress * 100);
  const pageInfo = $('[data-reader-page-info]');
  let currentPage = 1;
  if (content) {
    if (state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) {
      currentPage = Math.min(pageCount, state.readerPage + 1);
    } else if (readerUsesDocumentScroll()) {
      const documentPage = readerDocumentPageInfo(content);
      if (documentPage) { currentPage = documentPage.current; pageCount = documentPage.count; }
    } else {
      pageCount = Math.max(1, Math.ceil(content.scrollHeight / Math.max(1, content.clientHeight)));
      currentPage = Math.min(pageCount, Math.floor(content.scrollTop / Math.max(1, content.clientHeight)) + 1);
    }
  }
  if (pageInfo) pageInfo.textContent = currentPage + ' / ' + pageCount;
  $$('[data-reader-progress-label]').forEach((node) => { node.textContent = percent + '%'; });
  $$('[data-reader-progress-ring]').forEach((ring) => {
    ring.style.setProperty('--reader-progress', percent + '%');
    const value = ring.querySelector('[data-reader-progress-value]');
    if (value) value.style.strokeDashoffset = String(56.55 * (1 - progress));
    ring.setAttribute('aria-label', t('readerProgress') + ' ' + percent + '%');
  });
  const fill = $('[data-reader-progress-fill]'); if (fill) fill.style.width = Math.round(progress * 100) + '%';
  const progressLine = $('[data-reader-progress-line]');
  if (progressLine) progressLine.setAttribute('aria-valuenow', String(percent));
  if (chapterIndex) chapterIndex.textContent = state.readerReadingMode === 'pages' && content?.classList.contains('reader-page-viewport') ? currentPage + ' / ' + pageCount : state.readerToc.length ? (index + 1) + ' / ' + state.readerToc.length : '—';
  const previous = $('[data-reader-chapter-prev]'); const next = $('[data-reader-chapter-next]');
  if (previous) previous.disabled = !state.readerToc.length || index <= 0;
  if (next) next.disabled = !state.readerToc.length || index >= state.readerToc.length - 1;
}
function goReaderChapter(step) {
  if (!state.readerToc.length) return toast(state.language === 'en' ? 'No contents available' : '本书暂无目录');
  const target = currentReaderChapterIndex() + step;
  if (target < 0 || target >= state.readerToc.length) return;
  jumpToReaderToc(state.readerToc[target]);
}
function toggleReaderChrome() {
  if (!state.readerImmersive) return;
  state.readerChromeHidden = !state.readerChromeHidden;
  updateReaderReferenceChrome();
}
function setReaderProgress(value) {
  const content = $('[data-reader-content]'); if (!content) return;
  const progress = Math.min(1, Math.max(0, Number(value) / 100));
  if (state.readerReadingMode === 'pages' && content.classList.contains('reader-page-viewport')) {
    const count = readerPageCount(content);
    setReaderPagePosition(Math.round(progress * Math.max(0, count - 1)), 'smooth');
  } else content.scrollTo({ top: progress * Math.max(0, content.scrollHeight - content.clientHeight), behavior: 'smooth' });
  updateReaderReferenceChrome();
}
function turnReaderPage(direction) {
  const viewport = $('.reader-page-viewport'); if (!viewport) return;
  updateReaderPager();
  const count = readerPageCount(viewport);
  const nextPage = Math.min(Math.max(0, state.readerPage + direction), count - 1);
  if (nextPage === state.readerPage) return;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const behavior = state.readerPreferences.pageAnimation !== 'none' && !prefersReducedMotion ? 'smooth' : 'instant';
  // Keep one source of truth for the visible page. Moving the real column
  // track directly avoids the Safari/PWA desynchronisation caused by a
  // second animated overlay and gives the reader a calm horizontal slide.
  setReaderPagePosition(nextPage, behavior);
}
function renderAnnotationDialog() {
  if (!state.readerSelectedText) return;
  const dialog = $('#annotationDialog'); if (!dialog) return;
  dialog.innerHTML = '<div class="reader-dialog-card reader-panel-card reader-annotation-card" role="dialog" aria-modal="true"><div class="dialog-head reader-dialog-head"><div class="reader-dialog-title"><h2>' + t('addAnnotation') + '</h2><small>' + (state.language === 'en' ? 'Keep a note with this passage' : '为这段文字留下阅读笔记') + '</small></div><button class="reader-dialog-close" data-close-annotation aria-label="' + t('close') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg></button></div><blockquote class="reader-annotation-quote">' + escapeHtml(state.readerSelectedText) + '</blockquote><label class="reader-annotation-field"><span>' + (state.language === 'en' ? 'Add note' : '添加笔记') + '</span><textarea id="annotationText" maxlength="500" placeholder="' + t('annotationPlaceholder') + '"></textarea></label><div class="reader-dialog-actions"><button type="button" class="reader-dialog-secondary" data-close-annotation>' + (state.language === 'en' ? 'Cancel' : '取消') + '</button><button type="button" class="reader-dialog-primary" data-save-annotation>' + t('saveAnnotation') + '</button></div></div>';
  dialog.hidden = false;
}
function readerReadingView(book) {
  const isPdf = book.type === 'pdf';
  const hint = state.readerHint || (book.type.toUpperCase() + ' · ' + Math.max(1, Math.round(book.size / 1024)) + ' KB');
  const contentClass = (isPdf ? 'reader-content reader-pdf-content' : state.readerReadingMode === 'pages' ? 'reader-content reader-page-viewport' : 'reader-content reader-scroll-content') + (book.type === 'epub' ? ' reader-epub-content' : '');
  const content = state.readerReadingMode === 'pages' && !isPdf ? '<div class="reader-page-flow">' + state.readerContent + '</div>' : state.readerContent;
  const chapter = state.readerToc[0]?.label || '—';
  const pageLabel = isPdf ? hint : (state.readerReadingMode === 'pages' ? '1 / 1' : hint);
  const icon = (path) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>';
  const tool = (action, path, label) => '<button class="reader-reference-tool" data-' + action + '>' + icon(path) + '<span>' + label + '</span></button>';
  const chromeClass = (state.readerImmersive && state.readerChromeHidden ? ' chrome-hidden' : '') + (state.readerImmersive ? '' : ' reader-windowed');
  const commentsIcon = '<path d="M6 4.5h9l3 3v12H6z"/><path d="M15 4.5v3h3M9 11h6M9 14h6M9 17h3"/>';
  const selectionActions = '<button type="button" data-reader-selection-action="copy">' + (state.language === 'en' ? 'Copy' : '复制') + '</button><button type="button" data-reader-selection-action="underline">' + (state.language === 'en' ? 'Underline' : '划线') + '</button><button type="button" data-reader-selection-action="highlight">' + (state.language === 'en' ? 'Highlight' : '高亮') + '</button><button type="button" data-reader-selection-action="comment">' + t('readerComments') + '</button><button type="button" data-reader-selection-action="share">' + (state.language === 'en' ? 'Share' : '分享') + '</button>';
  const pageCorners = state.readerReadingMode === 'pages' && !isPdf ? '<button type="button" class="reader-page-turn-corner reader-page-turn-corner-prev" data-reader-page-prev aria-label="' + (state.language === 'en' ? 'Previous page' : '上一页') + '"><span aria-hidden="true"></span></button><button type="button" class="reader-page-turn-corner reader-page-turn-corner-next" data-reader-page-next aria-label="' + (state.language === 'en' ? 'Next page' : '下一页') + '"><span aria-hidden="true"></span></button>' : '';
  return '<div class="reader-reference-shell' + chromeClass + '" data-reader-theme="' + escapeHtml(state.readerPreferences.theme) + '">' +
    '<div class="reader-safari-edge-top" aria-hidden="true"></div><header class="reader-reference-top"><button class="reader-ref-icon reader-fullscreen-tool reader-reference-top-fullscreen" data-reader-fullscreen aria-label="' + t('readerFullscreen') + '"></button><div class="reader-reference-title"><strong>' + escapeHtml(book.name) + '</strong><small>' + escapeHtml(hint) + '</small></div><div class="reader-reference-header-progress" data-reader-progress-line role="progressbar" aria-label="' + t('readerProgress') + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span class="reader-reference-header-track"><i data-reader-progress-fill></i></span><b class="reader-reference-header-percent" data-reader-progress-label>0%</b></div></header>' +
    '<main class="reader-reference-body"><article class="' + contentClass + ' reader-reference-viewer" data-reader-content data-reader-surface>' + content + '</article>' + pageCorners + '</main>' +
    '<footer class="reader-reference-bottom"><div class="reader-reference-chapter"><span class="reader-reference-chapter-name" data-reader-chapter-name>' + escapeHtml(chapter) + '</span><span class="reader-reference-page-meta" data-reader-page-info>—</span></div>' +
    '<div class="reader-reference-tool-row"><button class="reader-reference-tool reader-shelf-tool" data-close-reader aria-label="' + t('bookshelf') + '">' + icon('<path d="m15 5-7 7 7 7"/>') + '<span>' + t('bookshelf') + '</span></button>' + tool('reader-toc', '<path d="M5 5h14M5 12h14M5 19h9"/>', t('readerContents')) + '<button class="reader-reference-tool reader-settings-tool" data-reader-settings>' + icon('<path d="M4 7h8M16 7h4M4 12h3M11 12h9M4 17h8M16 17h4"/><circle cx="14" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="14" cy="17" r="2"/>') + '<span>' + t('settings') + '</span></button>' + '<button class="reader-reference-tool reader-comments-tool" data-reader-comments aria-label="' + t('readerComments') + '">' + icon(commentsIcon) + '<span>' + t('readerComments') + '</span></button>' + '<button class="reader-reference-tool reader-fullscreen-tool" data-reader-fullscreen aria-label="' + t('readerFullscreen') + '"></button></div></footer><div class="reader-selection-menu" data-reader-selection-menu hidden role="menu">' + selectionActions + '</div><div class="reader-comment-popover" data-reader-comment-popover hidden></div></div>';
}
function readerFormatCoverMarkup(type) {
  const icons = {
    md: '<path d="M7 4.5h7l4 4v11H7z"/><path d="M14 4.5v4h4M9.5 12h5M9.5 15h5M9.5 18h3"/>',
    txt: '<path d="M6.5 4.5h11v15h-11z"/><path d="M9 9h6M9 12.5h6M9 16h4"/>',
    pdf: '<path d="M7 4.5h7l4 4v11H7z"/><path d="M14 4.5v4h4M9 15h2.5a1.5 1.5 0 0 0 0-3H9v5M13.5 12v5h1.2a2.5 2.5 0 0 0 0-5z"/>',
    epub: '<path d="M5.5 5.5c2.3-.9 4.3-.6 6.5 1v13c-2.2-1.6-4.2-1.9-6.5-1zM18.5 5.5c-2.3-.9-4.3-.6-6.5 1v13c2.2-1.6 4.2-1.9 6.5-1z"/><path d="M12 6.5v13"/>',
  };
  const key = icons[type] ? type : 'txt';
  return '<span class="reader-cover-fallback reader-cover-' + key + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + icons[key] + '</svg><b>' + key.toUpperCase() + '</b><small>LOCAL</small></span>';
}
function readerBookCoverMarkup(book) {
  if (book._coverData && /^data:image\//i.test(book._coverData)) return '<img class="reader-book-cover-image" src="' + escapeHtml(book._coverData) + '" alt="" loading="lazy">';
  return readerFormatCoverMarkup(book.type);
}
function readerAddCardMarkup() {
  return '<button class="reader-empty-card reader-add-card" data-open-reader-file><span class="reader-empty-book"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 8.5h18.5l6 6v24H10z"/><path d="M28.5 8.5v7h6M16 24h13M16 30h9M16 36h6"/><path d="M37 24v10M32 29h10"/></svg></span><strong>' + t('addBook') + '</strong></button>';
}
function reader() {
  const activeBook = readerBookById(state.readerBookId);
  if (state.readerMode === 'reading' && activeBook) return readerReadingView(activeBook);
  const books = [...state.library].sort((a, b) => Number(b.order || 0) - Number(a.order || 0) || Number(b.lastOpenedAt || b.createdAt) - Number(a.lastOpenedAt || a.createdAt));
  books.forEach((book) => { if (!book._coverData) hydrateReaderBookCover(book); });
  const cards = books.map((book) => {
    const progress = typeof book.progress === 'number' ? book.progress : Number(book.progress?.percent || 0);
    return '<article class="book-card reader-book-card" data-reader-book-card data-reader-book-index="' + books.indexOf(book) + '" data-id="' + escapeHtml(book.id) + '"><button class="book-open reader-book-open" data-open-reader="' + escapeHtml(book.id) + '"><span class="book-cover reader-book-cover ' + book.type + '">' + readerBookCoverMarkup(book) + '</span><span class="book-copy reader-book-copy"><strong>' + escapeHtml(book.name) + '</strong>' + (book.syncFileMissing ? '<small class="reader-book-source-missing">' + t('readerMissingSource') + '</small>' : '') + '<span class="reader-book-meta"><span>' + book.type.toUpperCase() + '</span><i></i><span>' + Math.max(1, Math.round(book.size / 1024)) + ' KB</span></span><span class="reader-book-progress"><span class="prog-bar"><i style="width:' + Math.round(progress * 100) + '%"></i></span><em>' + Math.round(progress * 100) + '%</em></span></span></button><button class="book-delete reader-book-delete" data-delete-book="' + escapeHtml(book.id) + '" aria-label="' + t('deleteBook') + '" title="' + t('deleteBook') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7M7 7l1 14h8l1-14"/></svg></button></article>';
  }).join('');
  const layoutClass = state.readerLayout === 'list' ? 'reader-book-list' : 'reader-book-grid-cards';
  const libraryBody = '<div class="reader-book-grid ' + layoutClass + (!books.length ? ' reader-book-grid-empty' : '') + '">' + (books.length ? cards : '') + readerAddCardMarkup() + '</div>';
  const layoutIcon = state.readerLayout === 'list' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h14"/><path d="M5 6h.01M5 12h.01M5 18h.01"/></svg><span>宫格</span>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg><span>列表</span>';
  const cloudStatus = window.OneBoxReaderCloudSync?.status?.() || { state: 'idle', message: '' };
  return '<div class="reader-library-view"><section class="reader-library-panel"><div class="reader-library-head"><div class="reader-library-title-copy"><div class="reader-library-title-row"><h2>' + t('bookshelf') + ' <span class="reader-book-count">(' + books.length + ')</span></h2><small>' + t('readerHint') + '</small></div><small class="reader-cloud-sync-status" id="readerCloudSyncStatus" data-state="' + escapeHtml(cloudStatus.state || 'idle') + '">' + escapeHtml(readerCloudStatusLabel(cloudStatus)) + '</small></div><div class="reader-library-actions"><button class="reader-layout-toggle" data-reader-layout-toggle aria-label="切换书架布局">' + layoutIcon + '</button></div></div>' + libraryBody + '</section><input id="readerFileInput" type="file" hidden multiple accept=".md,.markdown,.txt,.pdf,.epub,text/markdown,text/plain,application/pdf,application/epub+zip"></div>';
}

// Calendar data --------------------------------------------------------------
function eventsForDate(key) {
  const direct = [...(state.events[key] || [])];
  const directIds = new Set(direct.map((event) => event.id));
  const recurring = Object.values(state.events || {}).flat().filter((event) => !directIds.has(event.id) && eventMatchesDay(event, key));
  return direct.concat(recurring);
}
const holidayStore = { ...(window.ONEBOX_HOLIDAY_DATA || {}) };
const holidayLoaded = new Set(Object.keys(holidayStore).map(String));
const holidaySource = 'https://raw.githubusercontent.com/NateScarlet/holiday-cn/master';
async function ensureHolidayYear(year) {
  if (holidayLoaded.has(String(year))) return;
  holidayLoaded.add(String(year));
  const cached = parseStored(STORAGE.holidays + '.' + year, null);
  if (cached) holidayStore[year] = cached;
  try {
    const response = await fetch(holidaySource + '/' + year + '.json', { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error();
    const data = await response.json();
    holidayStore[year] = Object.fromEntries((data.days || []).map((item) => [item.date, { name: item.name, isOffDay: Boolean(item.isOffDay) }]));
    saveStored(STORAGE.holidays + '.' + year, holidayStore[year]);
    if (state.tool === 'calendar' && state.month.getFullYear() === Number(year)) render();
  } catch { /* bundled data remains useful offline */ }
}
const holidayFor = (key) => holidayStore[key.slice(0, 4)]?.[key];
const lunarMonthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
const lunarDayNames = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
const lunarFormatters = ['zh-CN-u-ca-chinese', 'zh-TW-u-ca-chinese', 'en-US-u-ca-chinese'].map((locale) => {
  try { return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return null; }
}).filter(Boolean);
function chineseNumber(value) {
  let text = String(value || '').replace(/[月日]/g, '').replace(/^闰|^閏|^leap/i, '').replace(/^初/, '').trim();
  const numeric = text.match(/\d+/);
  if (numeric) return Number(numeric[0]);
  if (text === '廿') return 20;
  if (text === '卅') return 30;
  if (text.startsWith('廿')) return 20 + ({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }[text.slice(1)] || 0);
  if (text.startsWith('卅')) return 30 + ({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }[text.slice(1)] || 0);
  const digits = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 兩: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 正: 1, 元: 1, 冬: 11, 腊: 12, 臘: 12 };
  if (text.includes('十')) {
    const pair = text.split('十');
    return (pair[0] ? digits[pair[0]] * 10 : 10) + (pair[1] ? digits[pair[1]] : 0);
  }
  return digits[text] ?? 0;
}
function lunarFor(date) {
  for (const formatter of lunarFormatters) {
    const parts = Object.fromEntries(formatter.formatToParts(date).filter((item) => item.type !== 'literal').map((item) => [item.type, item.value]));
    const rawMonth = parts.month || '';
    const month = chineseNumber(rawMonth);
    const day = chineseNumber(parts.day || '');
    if (!month || !day) continue;
    const leap = /闰|閏|leap/i.test(rawMonth);
    const monthText = (leap ? '闰' : '') + (lunarMonthNames[month - 1] || String(month) + '月');
    const festivals = { '1-1': '春节', '1-15': '元宵节', '5-5': '端午节', '7-7': '七夕', '7-15': '中元节', '8-15': '中秋节', '9-9': '重阳节', '12-8': '腊八节', '12-23': '小年', '12-24': '小年' };
    const festival = festivals[month + '-' + day] || (month === 12 && day >= 29 ? '除夕' : '');
    return { month, day, monthText, dayText: lunarDayNames[day] || String(day), yearName: parts.yearName || '', festival, text: monthText + (lunarDayNames[day] || String(day)) };
  }
  return null;
}
const chineseStems = '甲乙丙丁戊己庚辛壬癸';
const chineseBranches = '子丑寅卯辰巳午未申酉戌亥';
function sexagenaryForDate(date) {
  const value = new Date(date);
  const jdn = Math.floor(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86400000) + 2440588;
  const index = ((jdn + 49) % 60 + 60) % 60;
  return chineseStems[index % 10] + chineseBranches[index % 12];
}
const westernZodiac = [
  { limit: 119, zh: '摩羯座', en: 'Capricorn', symbol: '♑' },
  { limit: 218, zh: '水瓶座', en: 'Aquarius', symbol: '♒' },
  { limit: 320, zh: '双鱼座', en: 'Pisces', symbol: '♓' },
  { limit: 419, zh: '白羊座', en: 'Aries', symbol: '♈' },
  { limit: 520, zh: '金牛座', en: 'Taurus', symbol: '♉' },
  { limit: 621, zh: '双子座', en: 'Gemini', symbol: '♊' },
  { limit: 722, zh: '巨蟹座', en: 'Cancer', symbol: '♋' },
  { limit: 822, zh: '狮子座', en: 'Leo', symbol: '♌' },
  { limit: 922, zh: '处女座', en: 'Virgo', symbol: '♍' },
  { limit: 1023, zh: '天秤座', en: 'Libra', symbol: '♎' },
  { limit: 1122, zh: '天蝎座', en: 'Scorpio', symbol: '♏' },
  { limit: 1221, zh: '射手座', en: 'Sagittarius', symbol: '♐' },
];
function constellationFor(date) {
  const value = new Date(date);
  const monthDay = (value.getMonth() + 1) * 100 + value.getDate();
  return westernZodiac.find((item) => monthDay <= item.limit) || westernZodiac[0];
}
const solarTermNames = ['小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑', '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'];
const solarTermConstants21 = [5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 5.678, 21.37, 7.108, 22.83, 7.5, 23.13, 7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94];
function solarTermsForYear(year) {
  const result = {};
  if (year < 1900 || year > 2099) return result;
  const y = year % 100;
  solarTermNames.forEach((name, index) => {
    const day = Math.floor(y * .2422 + solarTermConstants21[index]) - Math.floor((index < 4 ? y - 1 : y) / 4);
    const month = Math.floor(index / 2) + 1;
    result[year + '-' + pad(month) + '-' + pad(day)] = name;
  });
  return result;
}
const solarTermCache = {};
const solarTermFor = (key) => {
  const year = Number(key.slice(0, 4));
  solarTermCache[year] ||= solarTermsForYear(year);
  return solarTermCache[year][key] || '';
};
const zodiacFor = (yearName) => ({ 子: '鼠', 丑: '牛', 寅: '虎', 卯: '兔', 辰: '龙', 巳: '蛇', 午: '马', 未: '羊', 申: '猴', 酉: '鸡', 戌: '狗', 亥: '猪' }[yearName?.slice(-1)] || '');
function calendarMeta(key) {
  const lunar = lunarFor(dateFromKey(key));
  const holiday = holidayFor(key);
  const term = solarTermFor(key);
  return { lunar, holiday, term, label: term || (holiday ? (holiday.isOffDay ? holiday.name : t('makeUpWorkday')) : lunar?.festival || '') };
}
const naYinNames = ['海中金', '海中金', '炉中火', '炉中火', '大林木', '大林木', '路旁土', '路旁土', '剑锋金', '剑锋金', '山头火', '山头火', '涧下水', '涧下水', '城头土', '城头土', '白蜡金', '白蜡金', '杨柳木', '杨柳木', '泉中水', '泉中水', '屋上土', '屋上土', '霹雳火', '霹雳火', '松柏木', '松柏木', '长流水', '长流水', '沙中金', '沙中金', '山下火', '山下火', '平地木', '平地木', '壁上土', '壁上土', '金箔金', '金箔金', '覆灯火', '覆灯火', '天河水', '天河水', '大驿土', '大驿土', '钗钏金', '钗钏金', '桑柘木', '桑柘木', '大溪水', '大溪水', '沙中土', '沙中土', '天上火', '天上火', '石榴木', '石榴木', '大海水', '大海水'];
const mansionNames = ['角宿（角木蛟）', '亢宿（亢金龙）', '氐宿（氐土貉）', '房宿（房日兔）', '心宿（心月狐）', '尾宿（尾火虎）', '箕宿（箕水豹）', '斗宿（斗木獬）', '牛宿（牛金牛）', '女宿（女土蝠）', '虚宿（虚日鼠）', '危宿（危月燕）', '室宿（室火猪）', '壁宿（壁水獝）', '奎宿（奎木狼）', '娄宿（娄金狗）', '胃宿（胃土雉）', '昴宿（昴日鸡）', '毕宿（毕月乌）', '觜宿（觜火猴）', '参宿（参水猿）', '井宿（井木犴）', '鬼宿（鬼金羊）', '柳宿（柳土獐）', '星宿（星日马）', '张宿（张月鹿）', '翼宿（翼火蛇）', '轸宿（轸水蚓）'];
const stemsByGroup = { 0: 2, 5: 2, 1: 4, 6: 4, 2: 6, 7: 6, 3: 8, 8: 8, 4: 0, 9: 0 };
const monthStartTerms = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑', '立秋', '白露', '寒露', '立冬', '大雪', '小寒'];
function sexagenaryIndex(value) {
  const text = String(value || '').replace(/[年月日]/g, '');
  for (let index = 0; index < 60; index += 1) if (chineseStems[index % 10] + chineseBranches[index % 12] === text) return index;
  return -1;
}
function solarYearPillarFor(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const liChun = Object.entries(solarTermsForYear(year)).find(([, name]) => name === '立春')?.[0];
  const pillarYear = liChun && dateKey(value) < liChun ? year - 1 : year;
  const index = ((pillarYear - 4) % 60 + 60) % 60;
  return { year: pillarYear, index, text: chineseStems[index % 10] + chineseBranches[index % 12] };
}
function monthPillarFor(date) {
  const value = new Date(date);
  const key = dateKey(value);
  const yearPillar = solarYearPillarFor(value);
  const terms = [yearPillar.year - 1, yearPillar.year, yearPillar.year + 1].flatMap((year) => Object.entries(solarTermsForYear(year)).map(([termKey, name]) => ({ key: termKey, name })));
  const latest = terms.filter((item) => monthStartTerms.includes(item.name) && item.key <= key).sort((a, b) => a.key.localeCompare(b.key)).pop();
  const monthIndex = latest ? monthStartTerms.indexOf(latest.name) : 11;
  const stemIndex = (stemsByGroup[yearPillar.index % 10] + monthIndex) % 10;
  const branchIndex = (2 + monthIndex) % 12;
  const text = chineseStems[stemIndex] + chineseBranches[branchIndex];
  return { index: sexagenaryIndex(text), text };
}
function solarTermProgressFor(date) {
  const value = new Date(date);
  const key = dateKey(value);
  const terms = [value.getFullYear() - 1, value.getFullYear(), value.getFullYear() + 1].flatMap((year) => Object.entries(solarTermsForYear(year)).map(([termKey, name]) => ({ key: termKey, name })));
  const ordered = terms.sort((a, b) => a.key.localeCompare(b.key));
  const current = ordered.filter((item) => item.key <= key).pop();
  const next = ordered.find((item) => item.key > key);
  if (!current || !next) return '—';
  const elapsed = Math.floor((dateFromKey(key) - dateFromKey(current.key)) / 86400000) + 1;
  const remaining = Math.max(0, Math.ceil((dateFromKey(next.key) - dateFromKey(key)) / 86400000));
  return current.name + '第' + elapsed + '天（距下一个节气“' + next.name + '”，还有' + remaining + '天）';
}
function mansionFor(date) {
  const anchor = dateFromKey('2026-09-21');
  const current = dateFromKey(dateKey(date));
  const offset = Math.round((current - anchor) / 86400000);
  return mansionNames[((11 + offset) % mansionNames.length + mansionNames.length) % mansionNames.length] || '—';
}
function islamicDateFor(date) {
  const value = new Date(date);
  const jdn = Math.floor(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86400000) + 2440588;
  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l3) / 709);
  return { year: 30 * n + j - 30, month, day: l3 - Math.floor((709 * month) / 24) };
}
function julianDayFor(date) {
  const value = new Date(date);
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86400000 + 2440587.5;
}
function seasonFor(date) {
  return ['冬季', '冬季', '春季', '春季', '春季', '夏季', '夏季', '夏季', '秋季', '秋季', '秋季', '冬季'][new Date(date).getMonth()] || '—';
}
function pengZuFor(pillar) {
  const stems = { 甲: '不开仓财物耗散', 乙: '不栽植千株不长', 丙: '不修灶必见灾殃', 丁: '不剃头头必生疮', 戊: '不受田田主不祥', 己: '不破券二比并亡', 庚: '不经络织机虚张', 辛: '不合酱主人不尝', 壬: '不汲水更难提防', 癸: '不词讼理弱敌强' };
  const branches = { 子: '不问卜自惹祸殃', 丑: '不冠带主不还乡', 寅: '不祭祀神鬼不尝', 卯: '不穿井水泉不香', 辰: '不哭泣必主重丧', 巳: '不远行财物伏藏', 午: '不苫盖屋主更张', 未: '不服药毒气入肠', 申: '不安床鬼祟入房', 酉: '不会客醉坐颠狂', 戌: '不吃犬作怪上床', 亥: '不嫁娶不利新郎' };
  const stem = pillar?.slice(0, 1) || '';
  const branch = pillar?.slice(1, 2) || '';
  return (stem ? stem + stems[stem] : '—') + (branch ? '，' + branch + branches[branch] : '') + '。';
}
function almanacFor(key) {
  const date = dateFromKey(key);
  const meta = calendarMeta(key);
  const lunar = meta.lunar;
  const yearPillar = solarYearPillarFor(date);
  const monthPillar = monthPillarFor(date);
  const dayPillar = sexagenaryForDate(date);
  const dayIndex = sexagenaryIndex(dayPillar);
  const lunarDay = lunar?.day || 1;
  const lunarMonth = lunar?.month || 1;
  const rokuyo = ['大安', '赤口', '先胜', '友引', '先负', '佛灭'][(lunarMonth + lunarDay) % 6];
  const twelveGods = ['建', '除', '满', '平', '定', '执', '破', '危', '成', '收', '开', '闭'];
  const fetalPalaces = ['占门鸡栖房内南', '碓磨厕外东南', '仓库厕外西南', '门鸡栖外西南', '厨灶炉外正南', '仓库厕外正西', '碓磨厕外西南', '仓库厕外西南', '门鸡栖外正南', '碓磨厕外正东', '房床栖房内南', '占门鸡栖房内东'];
  const dayBranch = dayPillar.slice(1, 2);
  const oppositeBranch = chineseBranches[(chineseBranches.indexOf(dayBranch) + 6) % 12] || '';
  const clashIndex = dayIndex >= 0 ? (dayIndex + 54) % 60 : undefined;
  const clashPillar = clashIndex === undefined ? oppositeBranch : chineseStems[clashIndex % 10] + oppositeBranch;
  const sha = { 子: '南', 午: '南', 丑: '东', 未: '东', 寅: '北', 申: '北', 卯: '西', 酉: '西', 辰: '北', 戌: '北', 巳: '东', 亥: '东' }[dayBranch] || '—';
  const festivalMap = { '9-20': ['全国爱牙日', '世界爱牙日'], '9-21': ['国家网络安全宣传周', '世界阿尔茨海默病日', '国际和平日'], '10-1': ['国庆节'] };
  const festivals = [...new Set([...(festivalMap[(date.getMonth() + 1) + '-' + date.getDate()] || []), meta.holiday?.name, lunar?.festival].filter(Boolean))];
  const suit = ['嫁娶', '纳采', '祭祀', '解除', '出行', '修造', '动土', '开市', '上梁', '安床', '整手足甲', '扫舍', '求医', '治病', '起基', '定磉', '造屋', '合脊'];
  const avoid = ['造庙', '行丧', '安葬', '伐木', '作灶', '造船'];
  const islamic = islamicDateFor(date);
  return {
    zodiac: zodiacFor(yearPillar.text) || '—', constellation: constellationFor(date), yearPillar: yearPillar.text, monthPillar: monthPillar.text, dayPillar,
    yearElement: naYinNames[yearPillar.index] || '—', monthElement: naYinNames[monthPillar.index] || '—', dayElement: naYinNames[dayIndex] || '—',
    season: seasonFor(date), mansion: mansionFor(date), solarTerm: solarTermProgressFor(date),
    julian: julianDayFor(date).toFixed(1), buddhist: String(date.getFullYear() + 543) + '年', islamic: islamic.year + '年' + String(islamic.month).padStart(2, '0') + '月' + String(islamic.day).padStart(2, '0') + '日',
    clash: oppositeBranch ? zodiacFor(oppositeBranch) + '（' + clashPillar + '）' : '—', sha, sixStar: rokuyo, twelveGod: twelveGods[(lunarDay + 2) % 12] + '执位', pengZu: pengZuFor(dayPillar), fetalPalace: fetalPalaces[(lunarDay - 1) % fetalPalaces.length] || '—', festivals, suit, avoid,
  };
}

// Calculator -----------------------------------------------------------------
function tokenizeExpression(input) {
  const normalized = input.replace(/[xX]/g, '×').replace(/√/g, 'sqrt').replace(/\s+/g, '');
  const tokens = [];
  let index = 0;
  while (index < normalized.length) {
    const char = normalized[index];
    if (/[0-9.]/.test(char)) {
      const start = index; let dots = 0;
      while (index < normalized.length && /[0-9.eE+-]/.test(normalized[index])) {
        if (normalized[index] === '.') dots += 1;
        if (/[+-]/.test(normalized[index]) && index > start && !/[eE]/.test(normalized[index - 1])) break;
        index += 1;
      }
      const raw = normalized.slice(start, index);
      if (dots > 1 || raw === '.' || !Number.isFinite(Number(raw))) throw Error(state.language === 'en' ? 'Invalid number' : '数字格式不正确');
      tokens.push({ type: 'number', value: Number(raw) });
      continue;
    }
    if (/[a-zA-Zπ]/.test(char)) {
      const start = index;
      while (index < normalized.length && /[a-zA-Zπ]/.test(normalized[index])) index += 1;
      tokens.push({ type: 'identifier', value: normalized.slice(start, index).toLowerCase() });
      continue;
    }
    if ('+-−×÷*/%^(),!'.includes(char)) {
      tokens.push({ type: 'operator', value: char === '*' ? '×' : char === '/' ? '÷' : char }); index += 1; continue;
    }
    throw Error(state.language === 'en' ? 'Unsupported character' : '包含无法识别的字符');
  }
  return tokens;
}
function evaluateExpression(input) {
  const tokens = tokenizeExpression(input); if (!tokens.length) return 0;
  let position = 0;
  const peek = () => tokens[position];
  const take = () => tokens[position++];
  const match = (value) => { if (peek()?.value === value) { position += 1; return true; } return false; };
  const funcs = {
    sin: (v) => Math.sin(state.calcAngle === 'deg' ? v * Math.PI / 180 : v),
    cos: (v) => Math.cos(state.calcAngle === 'deg' ? v * Math.PI / 180 : v),
    tan: (v) => Math.tan(state.calcAngle === 'deg' ? v * Math.PI / 180 : v),
    asin: (v) => state.calcAngle === 'deg' ? Math.asin(v) * 180 / Math.PI : Math.asin(v),
    acos: (v) => state.calcAngle === 'deg' ? Math.acos(v) * 180 / Math.PI : Math.acos(v),
    atan: (v) => state.calcAngle === 'deg' ? Math.atan(v) * 180 / Math.PI : Math.atan(v),
    log: (v) => Math.log10(v), ln: (v) => Math.log(v), sqrt: (v) => Math.sqrt(v), abs: (v) => Math.abs(v), exp: (v) => Math.exp(v),
  };
  function primary() {
    if (match('(')) { const value = expression(); if (!match(')')) throw Error(state.language === 'en' ? 'Missing closing parenthesis' : '括号不匹配'); return value; }
    const token = take();
    if (!token) throw Error(state.language === 'en' ? 'Incomplete expression' : '表达式不完整');
    if (token.type === 'number') return token.value;
    if (token.type !== 'identifier') throw Error(state.language === 'en' ? 'Incomplete expression' : '表达式不完整');
    if (token.value === 'π' || token.value === 'pi') return Math.PI;
    if (token.value === 'e') return Math.E;
    if (!funcs[token.value] || !match('(')) throw Error(state.language === 'en' ? 'Unknown function' : '未知函数');
    const args = []; if (!match(')')) { args.push(expression()); while (match(',')) args.push(expression()); if (!match(')')) throw Error(state.language === 'en' ? 'Missing closing parenthesis' : '括号不匹配'); }
    if (args.length !== 1) throw Error(state.language === 'en' ? 'Functions take one argument' : '函数需要一个参数');
    return funcs[token.value](args[0]);
  }
  function postfix() {
    let value = primary();
    while (match('%') || match('!')) {
      const operator = tokens[position - 1].value;
      if (operator === '%') value /= 100;
      if (operator === '!') {
        if (value < 0 || value > 170 || !Number.isInteger(value)) throw Error(state.language === 'en' ? 'Factorial needs an integer from 0 to 170' : '阶乘只支持 0 到 170 的整数');
        let result = 1; for (let i = 2; i <= value; i += 1) result *= i; value = result;
      }
    }
    return value;
  }
  function power() { const left = postfix(); return match('^') ? left ** unary() : left; }
  function unary() { if (match('+')) return unary(); if (match('−') || match('-')) return -unary(); return power(); }
  function term() {
    let value = unary();
    while (peek() && ['×', '÷'].includes(peek().value)) { const operator = take().value; const right = unary(); if (operator === '÷' && right === 0) throw Error(state.language === 'en' ? 'Cannot divide by zero' : '不能除以零'); value = operator === '×' ? value * right : value / right; }
    return value;
  }
  function expression() {
    let value = term();
    while (peek() && ['+', '−', '-'].includes(peek().value)) { const operator = take().value; const right = term(); value = operator === '+' ? value + right : value - right; }
    return value;
  }
  const result = expression();
  if (position !== tokens.length || !Number.isFinite(result)) throw Error(state.language === 'en' ? 'Expression cannot be evaluated' : '表达式无法计算');
  return Number(result.toPrecision(12));
}
const calcPreview = () => { if (!state.calcExpr) return '0'; try { return formatNumber(evaluateExpression(state.calcExpr)); } catch { return '—'; } };
function saveCalculator() { saveStored(STORAGE.calculator, { expr: state.calcExpr, history: state.calcHistory.slice(0, 30), historyOpen: state.calcHistoryOpen === true }); }
function calculator() {
  const history = state.calcHistory.length ? state.calcHistory.slice(0, 8).map((item) => {
    const id = item.id || String(item.at || item.expression);
    return '<div class="swipe-row history-swipe-row" data-swipe-row><button class="history-item swipe-content" data-history-expression="' + escapeHtml(item.expression) + '"><span>' + escapeHtml(item.expression) + '</span><b>' + escapeHtml(item.result) + '</b></button><button class="swipe-delete" data-delete-calc-history="' + escapeHtml(id) + '">' + (state.language === 'en' ? 'Delete' : '删除') + '</button></div>';
  }).join('') : '<p class="empty compact">' + t('ready') + '</p>';
  const scienceButton = (label, key, extra = '') => '<button class="key calc-science-key" data-science-key="' + escapeHtml(key) + '" ' + extra + '>' + label + '</button>';
  const normalButton = (label, extra = '') => '<button class="key ' + (/[÷×−+%]/.test(label) ? 'op ' : '') + (label === '=' ? 'equal ' : '') + (label === 'CE' ? 'danger ' : '') + '" data-key="' + escapeHtml(label) + '" ' + extra + '>' + label + '</button>';
  const inverse = state.calcInverse;
  const angle = '<button class="key angle-toggle" data-toggle-angle aria-label="' + t('degree') + ' / ' + t('radian') + '"><span>Deg</span><i></i><span>Rad</span></button>';
  const keys = [
    angle, scienceButton('x!', '!'), normalButton('('), normalButton(')'), normalButton('%'), normalButton('CE'),
    '<button class="key calc-science-key" data-toggle-inverse aria-pressed="' + (inverse ? 'true' : 'false') + '">Inv</button>', scienceButton(inverse ? 'sin⁻¹' : 'sin', inverse ? 'asin(' : 'sin('), scienceButton('ln', 'ln('), normalButton('7'), normalButton('8'), normalButton('9'), normalButton('÷'),
    scienceButton('π', 'π'), scienceButton(inverse ? 'cos⁻¹' : 'cos', inverse ? 'acos(' : 'cos('), scienceButton('log', 'log('), normalButton('4'), normalButton('5'), normalButton('6'), normalButton('×'),
    scienceButton('e', 'e'), scienceButton(inverse ? 'tan⁻¹' : 'tan', inverse ? 'atan(' : 'tan('), scienceButton('√', 'sqrt('), normalButton('1'), normalButton('2'), normalButton('3'), normalButton('−'),
    '<button class="key calc-science-key" data-answer>Ans</button>', '<button class="key calc-science-key" data-key="EXP">EXP</button>', scienceButton('xʸ', '^'), normalButton('0'), normalButton('.'), normalButton('='), normalButton('+'),
  ].join('');
  const mobileKeys = [
    angle, scienceButton('x!', '!'), normalButton('CE'),
    '<button class="key calc-science-key" data-toggle-inverse aria-pressed="' + (inverse ? 'true' : 'false') + '">Inv</button>', scienceButton(inverse ? 'sin⁻¹' : 'sin', inverse ? 'asin(' : 'sin('), scienceButton('ln', 'ln('), normalButton('%'),
    scienceButton('π', 'π'), scienceButton(inverse ? 'cos⁻¹' : 'cos', inverse ? 'acos(' : 'cos('), scienceButton('log', 'log('), normalButton('('),
    scienceButton('e', 'e'), scienceButton(inverse ? 'tan⁻¹' : 'tan', inverse ? 'atan(' : 'tan('), scienceButton('√', 'sqrt('), normalButton(')'),
    '<button class="key calc-science-key" data-answer>Ans</button>', '<button class="key calc-science-key" data-key="EXP">EXP</button>', scienceButton('xʸ', '^'), normalButton('⌫'),
    normalButton('7'), normalButton('8'), normalButton('9'), normalButton('÷'),
    normalButton('4'), normalButton('5'), normalButton('6'), normalButton('×'),
    normalButton('1'), normalButton('2'), normalButton('3'), normalButton('−'),
    normalButton('0'), normalButton('.'), normalButton('='), normalButton('+'),
  ].join('');
  const answer = state.calcHistory[0]?.result || '0';
  return '<div class="calculator-layout"><div class="calculator-surface"><div class="display" aria-live="polite"><div class="display-meta"><button class="display-history-toggle" data-toggle-calc-history aria-expanded="' + (state.calcHistoryOpen ? 'true' : 'false') + '" aria-label="' + t('recentCalculations') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6.4"/><path d="M3.5 4.5v5h5"/><path d="M12 7.5v4.8l3 1.8"/></svg></button><span>Ans = ' + escapeHtml(String(answer)) + '</span></div><div class="expression">' + (escapeHtml(state.calcExpr) || (state.language === 'en' ? 'Ready' : '准备计算')) + '</div><div class="result" aria-hidden="true">' + calcPreview() + '</div><div class="display-history" ' + (state.calcHistoryOpen ? '' : 'hidden') + '><div class="display-history-head"><span>' + t('recentCalculations') + '</span><button class="text-btn" data-clear-calc-history ' + (state.calcHistory.length ? '' : 'disabled') + '>' + t('clear') + '</button></div><div class="display-history-list">' + history + '</div></div></div>' +
    '<div class="calculator-keyboard"><div class="keys calculator-grid">' + keys + '</div><div class="keys calculator-mobile-grid">' + mobileKeys + '</div></div></div></div>';
}
function calculatorKey(key) {
  if (key === 'AC' || key === 'CE') { state.calcExpr = ''; state.calcJustEvaluated = false; }
  else if (key === '⌫') { state.calcExpr = state.calcExpr.slice(0, -1); state.calcJustEvaluated = false; }
  else if (key === 'EXP') { state.calcExpr += '×10^'; state.calcJustEvaluated = false; }
  else if (key === '=') {
    try { const result = evaluateExpression(state.calcExpr); if (state.calcExpr) state.calcHistory.unshift({ id: uid(), expression: state.calcExpr, result: formatNumber(result), at: Date.now() }); state.calcExpr = String(result); state.calcJustEvaluated = true; }
    catch (error) { toast(error.message, 'error'); }
  } else if (key === '±') { state.calcExpr = state.calcExpr.startsWith('-') ? state.calcExpr.slice(1) : '-' + (state.calcExpr || '0'); state.calcJustEvaluated = false; }
  else { if (state.calcJustEvaluated && (/[0-9.]/.test(key) || key === '(' || key === 'π')) state.calcExpr = ''; state.calcJustEvaluated = false; state.calcExpr += key; }
  saveCalculator(); render();
}

// Calendar -------------------------------------------------------------------
function setCalendarMonth(year, month) {
  const selectedDay = Number(String(state.selectedDate || '').slice(-2)) || 1;
  const day = Math.min(selectedDay, new Date(year, month + 1, 0).getDate());
  state.month = new Date(year, month, 1);
  state.selectedDate = dateKey(new Date(year, month, day));
  render();
}
function calendarPickerYearPages() {
  const pages = [];
  for (let year = 1900; year <= 2080; year += 12) pages.push(year);
  pages.push(2089);
  return pages;
}
function calendarPickerYearPageFor(year) {
  const boundedYear = Math.max(1900, Math.min(2100, year));
  return boundedYear >= 2089 ? 2089 : 1900 + Math.floor((boundedYear - 1900) / 12) * 12;
}
let calendarPickerYearStart = calendarPickerYearPageFor(new Date().getFullYear());
function closeCalendarPickerDialog() {
  const dialog = $('#calendarPickerDialog');
  if (dialog) dialog.hidden = true;
}
function renderCalendarPickerDialog(mode, keepYearWindow = false) {
  const dialog = $('#calendarPickerDialog');
  if (!dialog) return;
  const isEnglish = state.language === 'en';
  const currentYear = state.month.getFullYear();
  const currentMonth = state.month.getMonth();
  if (mode === 'year' && !keepYearWindow) calendarPickerYearStart = calendarPickerYearPageFor(currentYear);
  const title = mode === 'year' ? (isEnglish ? 'Choose year' : '选择年份') : (isEnglish ? 'Choose month' : '选择月份');
  const closeLabel = isEnglish ? 'Close' : '关闭';
  let options = '';
  if (mode === 'year') {
    const end = Math.min(calendarPickerYearStart + 11, 2100);
    const years = Array.from({ length: end - calendarPickerYearStart + 1 }, (_, index) => calendarPickerYearStart + index);
    options = '<div class="calendar-picker-period"><button type="button" class="calendar-picker-period-btn" data-calendar-year-shift="-1" aria-label="' + (isEnglish ? 'Previous years' : '上一组年份') + '" ' + (calendarPickerYearStart === 1900 ? 'disabled' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><strong>' + calendarPickerYearStart + '–' + end + '</strong><button type="button" class="calendar-picker-period-btn" data-calendar-year-shift="1" aria-label="' + (isEnglish ? 'Next years' : '下一组年份') + '" ' + (calendarPickerYearStart === 2089 ? 'disabled' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></div><div class="calendar-picker-options year-options">' + years.map((year) => '<button type="button" class="calendar-picker-option' + (year === currentYear ? ' selected' : '') + '" data-calendar-year-option="' + year + '" aria-pressed="' + (year === currentYear) + '">' + year + '</button>').join('') + '</div>';
  } else {
    const monthNames = Array.from({ length: 12 }, (_, index) => isEnglish ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(currentYear, index, 1)) : (index + 1) + '月');
    options = '<div class="calendar-picker-options month-options">' + monthNames.map((month, index) => '<button type="button" class="calendar-picker-option' + (index === currentMonth ? ' selected' : '') + '" data-calendar-month-option="' + index + '" aria-pressed="' + (index === currentMonth) + '">' + escapeHtml(month) + '</button>').join('') + '</div>';
  }
  dialog.innerHTML = '<div class="dialog-card calendar-picker-dialog-card" role="dialog" aria-modal="true" aria-labelledby="calendarPickerTitle"><div class="calendar-picker-dialog-head"><h2 id="calendarPickerTitle">' + title + '</h2><button type="button" class="icon-btn small" data-close-calendar-picker aria-label="' + closeLabel + '">×</button></div>' + options + '</div>';
  dialog.hidden = false;
}
function calendar() {
  const year = state.month.getFullYear();
  const month = state.month.getMonth();
  const first = new Date(year, month, 1);
  const start = (first.getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const cellCount = start + days > 35 ? 42 : 35;
  let cells = '';
  for (let index = 0; index < cellCount; index += 1) {
    const number = index - start + 1;
    const date = new Date(year, month, number);
    const key = dateKey(date);
    const outside = date.getMonth() !== month;
    const meta = calendarMeta(key);
    const eventCount = eventsForDate(key).length;
    const holidayClass = meta.holiday ? (meta.holiday.isOffDay ? 'holiday' : 'workday') : '';
    const termClass = meta.term ? 'term-day' : '';
    const label = meta.holiday && !meta.holiday.isOffDay ? t('makeUpWorkday') : (meta.term || meta.holiday?.name || meta.lunar?.festival || '');
    const hasPriorityLabel = Boolean(meta.term || meta.holiday);
    const lunarCell = !hasPriorityLabel && meta.lunar ? (meta.lunar.day === 1 ? meta.lunar.monthText + meta.lunar.dayText : meta.lunar.dayText) : '';
    const cellLabel = label || lunarCell;
    const eventBadge = eventCount ? (eventCount > 99 ? '…' : String(eventCount)) : '';
    cells += '<button class="day ' + (outside ? 'muted ' : '') + (key === dateKey(today) ? 'today ' : '') + (key === state.selectedDate ? 'selected ' : '') + holidayClass + ' ' + termClass + '" data-date="' + key + '" data-outside="' + outside + '" aria-label="' + escapeHtml(formatDate(key) + (cellLabel ? '，' + cellLabel : '') + (eventCount ? '，' + eventCount + ' 个日程' : '')) + '"><span>' + date.getDate() + '</span><small class="day-meta ' + (label ? 'priority' : '') + '">' + escapeHtml(cellLabel) + '</small>' + (eventCount ? '<i aria-label="' + eventCount + ' 个日程">' + eventBadge + '</i>' : '') + '</button>';
  }
  const selectedEvents = eventsForDate(state.selectedDate).sort((a, b) => {
    const left = a.time || '00:00:00'; const right = b.time || '00:00:00';
    return right.localeCompare(left) || Number(b.createdAt || 0) - Number(a.createdAt || 0);
  });
  const eventList = selectedEvents.length
    ? selectedEvents.map((item) => '<div class="swipe-row event-swipe-row" data-swipe-row><div class="event-item swipe-content"><div><strong>' + escapeHtml(item.title) + '</strong><small>' + (item.time ? escapeHtml(item.time) : (state.language === 'en' ? 'All day' : '全天')) + '</small></div></div><button class="swipe-delete" data-delete-event="' + escapeHtml(item.id) + '">' + (state.language === 'en' ? 'Delete' : '删除') + '</button></div>').join('')
    : '<p class="empty compact">' + t('noAgenda') + '</p>';
  const isEnglish = state.language === 'en';
  const monthNames = Array.from({ length: 12 }, (_, index) => isEnglish ? new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(year, index, 1)) : String(index + 1));
  const yearPicker = '<button type="button" class="calendar-picker calendar-year-picker" data-calendar-picker="year" aria-label="' + (isEnglish ? 'Choose year' : '选择年份') + '"><span class="calendar-picker-value">' + year + '</span>' + (isEnglish ? '' : '<span class="calendar-picker-unit">年</span>') + '</button>';
  const monthPicker = '<button type="button" class="calendar-picker calendar-month-picker" data-calendar-picker="month" aria-label="' + (isEnglish ? 'Choose month' : '选择月份') + '"><span class="calendar-picker-value">' + escapeHtml(monthNames[month]) + '</span>' + (isEnglish ? '' : '<span class="calendar-picker-unit">月</span>') + '</button>';
  const monthPickers = isEnglish ? monthPicker + yearPicker : yearPicker + monthPicker;
  const weekdays = state.language === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  return heading(t('calendar'), t('calendarDesc')) +
    '<div class="calendar-layout"><div class="calendar-card"><div class="calendar-top"><button class="calendar-nav-btn" data-month="-1" aria-label="' + (isEnglish ? 'Previous month' : '上个月') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg></button><div class="calendar-month"><div class="calendar-month-pickers">' + monthPickers + '</div><button class="text-btn calendar-today" data-today>' + t('today') + '</button></div><button class="calendar-nav-btn" data-month="1" aria-label="' + (isEnglish ? 'Next month' : '下个月') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></div>' +
    '<div class="calendar-legend"><span><i class="dot off"></i>' + t('legalHoliday') + '</span><span><i class="dot work"></i>' + t('makeUpWorkday') + '</span><span><i class="dot term"></i>' + t('solarTerm') + '</span></div><div class="calendar-grid">' + weekdays.map((day) => '<div class="dow">' + day + '</div>').join('') + cells + '</div></div>' +
   '<aside class="agenda-panel"><div class="subhead"><h3>' + t('agenda') + '</h3></div><div class="event-list">' + eventList + '</div><button class="calendar-add-event" data-open-event-dialog><span aria-hidden="true">＋</span>' + t('addAgenda') + '</button></aside></div>';
}
function saveEvents() { saveStored(STORAGE.events, state.events); }

function eventDateTimeParts(selectedKey) {
  const validKey = /^\d{4}-\d{2}-\d{2}$/.test(String(selectedKey || ''));
  const date = validKey ? dateFromKey(selectedKey) : new Date();
  const now = new Date();
  const year = date.getFullYear(); const month = date.getMonth() + 1; const day = date.getDate();
  const hour = now.getHours(); const minute = now.getMinutes();
  const pad2 = (value) => String(value).padStart(2, '0');
  const dateValue = year + '-' + pad2(month) + '-' + pad2(day);
  const timeValue = pad2(hour) + ':' + pad2(minute);
  return { year, month, day, hour, minute, dateValue, timeValue, dateTimeValue: dateValue + 'T' + timeValue };
}
function eventDateTimeMarkup(selectedKey) {
  const parts = eventDateTimeParts(selectedKey);
  return {
    parts,
    control: '<span class="event-datetime-control"><span id="eventDateTimeDisplay" class="event-datetime-display" aria-hidden="true">' + escapeHtml(formatEventDateTimeDisplay(parts.dateTimeValue)) + '</span><svg class="event-datetime-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 9h16"/></svg><input id="eventDateTime" class="event-datetime-input" type="datetime-local" value="' + parts.dateTimeValue + '" step="60" aria-label="' + escapeHtml(t('eventDateTime')) + '"></span>',
    hidden: '<input type="hidden" id="eventDate" value="' + parts.dateValue + '"><input type="hidden" id="eventTime" value="' + parts.timeValue + '">',
  };
}
function formatEventDateTimeDisplay(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(String(value || ''));
  return match ? match.slice(1, 4).join('/') + ' ' + match[4] + ':' + match[5] : String(value || '');
}
function updateEventDateTimeDisplay(value = $('#eventDateTime')?.value || '') {
  const display = $('#eventDateTimeDisplay');
  if (display) display.textContent = formatEventDateTimeDisplay(value);
}
function syncEventDateTimeFields() {
  const value = $('#eventDateTime')?.value || '';
  updateEventDateTimeDisplay(value);
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return;
  const date = $('#eventDate'); if (date) date.value = match[1];
  const time = $('#eventTime'); if (time) time.value = match[2] + ':' + match[3];
}
function renderEventDialog() {
  const dialog = $('#eventDialog');
  if (!dialog) return;
  const options = ['once', 'daily', 'workdays', 'restdays', 'weekly'].map((value) => '<option value="' + value + '">' + t(value === 'daily' ? 'everyDay' : value) + '</option>').join('');
  const eventWeekdayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const weekdays = eventWeekdayLabels.map((label, index) => '<label class="weekday-option"><input type="checkbox" name="eventWeekday" value="' + index + '" ' + (index < 5 ? 'checked' : '') + '><span>' + (state.language === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] : label) + '</span></label>').join('');
  const dateTime = eventDateTimeMarkup(state.selectedDate);
  dialog.setAttribute('aria-label', t('newReminder'));
  dialog.innerHTML = '<div class="dialog-card event-dialog-card" role="dialog" aria-modal="true"><div class="dialog-head"><h2>' + t('newReminder') + '</h2><button class="icon-btn small" data-close-event-dialog aria-label="' + t('close') + '">×</button></div><form id="eventForm" class="event-form"><div class="field"><label for="eventTitle">' + t('eventContent') + '</label><textarea id="eventTitle" rows="3" required maxlength="60" placeholder="' + t('eventPlaceholder') + '"></textarea></div><div class="field"><label>' + t('reminderSchedule') + '</label><div class="event-date-time-grid"><label class="event-date-time-field event-datetime-field">' + dateTime.control + '</label></div>' + dateTime.hidden + '</div><div class="field"><label for="eventRepeat">' + t('eventRepeat') + '</label><select id="eventRepeat">' + options + '</select></div><div class="field event-weekdays-field" hidden><label>' + t('weekdays') + '</label><div class="weekday-options">' + weekdays + '</div></div><button class="primary full-width" type="submit">' + t('addEvent') + '</button></form></div>';
  dialog.hidden = false;
}
function closeEventDialog() { const dialog = $('#eventDialog'); if (dialog) dialog.hidden = true; }
function renderLunarDialog(key) {
  const dialog = $('#lunarDialog');
  if (!dialog) return;
  const date = dateFromKey(key);
  const meta = calendarMeta(key);
  const lunar = meta.lunar;
  const isEnglish = state.language === 'en';
  const labels = isEnglish ? {
    lunar: 'Lunar', yearPillar: 'Year pillar · zodiac', monthPillar: 'Month pillar', dayPillar: 'Day pillar', constellation: 'Constellation', highlights: 'Date markers', agenda: 'Agenda', offDay: 'Rest day', workday: 'Make-up workday', almanac: 'More calendar details', advice: 'Almanac advice', suitable: 'Good for', avoid: 'Avoid',
  } : {
    lunar: '农历', yearPillar: '年柱 · 生肖', monthPillar: '月柱', dayPillar: '日柱', constellation: '星座', highlights: '日期标记', agenda: '日程', offDay: '休息日', workday: '补班日', almanac: '更多历法信息', advice: '黄历宜忌', suitable: '宜', avoid: '忌',
  };
  const lunarText = lunar ? lunar.monthText + lunar.dayText : (state.language === 'en' ? 'Lunar calendar unavailable' : '当前浏览器不支持农历格式');
  const almanac = almanacFor(key);
  const constellation = constellationFor(date);
  const constellationLabel = isEnglish ? constellation.en : constellation.zh;
  const weekday = new Intl.DateTimeFormat(isEnglish ? 'en-US' : 'zh-CN', { weekday: 'long' }).format(date);
  const title = formatDate(key, { year: 'numeric', month: 'long', day: 'numeric' });
  const yearValue = [almanac.yearPillar && (isEnglish ? almanac.yearPillar : almanac.yearPillar + '年'), almanac.zodiac && (isEnglish ? almanac.zodiac : '属' + almanac.zodiac)].filter(Boolean).join(isEnglish ? ' · ' : '');
  const overviewFields = [
    [labels.yearPillar, yearValue || '—'],
    [labels.monthPillar, almanac.monthPillar ? almanac.monthPillar + (isEnglish ? '' : '月') : '—'],
    [labels.dayPillar, almanac.dayPillar ? almanac.dayPillar + (isEnglish ? '' : '日') : '—'],
    [labels.constellation, constellationLabel],
  ];
  const highlightNames = [...new Set(almanac.festivals.filter((name) => name !== meta.holiday?.name))];
  const highlights = [
    ...highlightNames.map((name) => ({ label: name, kind: 'festival' })),
    meta.holiday ? { label: meta.holiday.name + ' · ' + (meta.holiday.isOffDay ? labels.offDay : labels.workday), kind: meta.holiday.isOffDay ? 'holiday' : 'workday' } : null,
    meta.term ? { label: meta.term, kind: 'term' } : null,
  ].filter(Boolean);
  const highlightMarkup = highlights.length ? '<div class="lunar-dialog-tags" aria-label="' + labels.highlights + '">' + highlights.map((item) => '<span class="lunar-dialog-tag ' + item.kind + '">' + escapeHtml(item.label) + '</span>').join('') + '</div>' : '';
  const almanacField = (label, value, wide = false) => '<div class="lunar-dialog-almanac-field' + (wide ? ' wide' : '') + '"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value || '—') + '</strong></div>';
  const almanacFields = isEnglish ? [
    ['Year element', almanac.yearElement], ['Season', almanac.season], ['Month element', almanac.monthElement], ['Mansion', almanac.mansion], ['Day element', almanac.dayElement], ['Julian day', almanac.julian], ['Buddhist year', almanac.buddhist], ['Islamic date', almanac.islamic], ['Clash', almanac.clash], ['Sha direction', almanac.sha], ['Six star', almanac.sixStar], ['Twelve duty', almanac.twelveGod], ['Peng Zu taboos', almanac.pengZu, true], ['Fetal deity', almanac.fetalPalace, true],
  ] : [
    ['年五行', almanac.yearElement], ['季节', almanac.season], ['月五行', almanac.monthElement], ['星宿', almanac.mansion], ['日五行', almanac.dayElement], ['儒略日', almanac.julian], ['佛历年', almanac.buddhist], ['伊斯兰历', almanac.islamic], ['冲', almanac.clash], ['煞', almanac.sha], ['六曜', almanac.sixStar], ['十二神', almanac.twelveGod], ['彭祖百忌', almanac.pengZu, true], ['胎神占方', almanac.fetalPalace, true],
  ];
  const almanacMarkup = '<details class="lunar-dialog-more" open><summary>' + labels.almanac + '</summary><div class="lunar-dialog-almanac-grid">' + almanacFields.map((field) => almanacField(field[0], field[1], field[2])).join('') + '</div></details>';
  const almanacList = (items) => escapeHtml(items.join(isEnglish ? ' · ' : '、'));
  const adviceMarkup = '<details class="lunar-dialog-more" open><summary>' + labels.advice + '</summary><section class="lunar-dialog-advice"><div class="lunar-dialog-suit-avoid-grid"><div><span class="lunar-dialog-suitable-label">' + labels.suitable + '</span><p>' + almanacList(almanac.suit) + '</p></div><div><span class="lunar-dialog-avoid-label">' + labels.avoid + '</span><p>' + almanacList(almanac.avoid) + '</p></div></div></section></details>';
  const selectedEvents = eventsForDate(key);
  const agendaMarkup = selectedEvents.length ? '<div class="lunar-dialog-agenda"><span>' + labels.agenda + '</span><strong>' + (isEnglish ? selectedEvents.length + (selectedEvents.length === 1 ? ' event' : ' events') : selectedEvents.length + ' 项') + '</strong></div>' : '';
  const infoGrid = '<section class="lunar-dialog-overview"><div class="lunar-dialog-info-grid">' + overviewFields.map(([label, value]) => '<div><small>' + escapeHtml(label) + '</small><strong>' + escapeHtml(value) + '</strong></div>').join('') + '</div></section>';
  dialog.innerHTML = '<div class="dialog-card lunar-dialog-card" role="dialog" aria-modal="true"><div class="lunar-dialog-head"><div class="lunar-dialog-title-line"><h2>' + escapeHtml(title) + '</h2><div class="lunar-dialog-date-meta"><span class="lunar-dialog-weekday">' + escapeHtml(weekday) + '</span><span class="lunar-dialog-lunar">' + labels.lunar + ' · ' + escapeHtml(lunarText) + '</span>' + highlightMarkup + '</div></div><button class="icon-btn small" data-close-lunar-dialog aria-label="' + t('close') + '">×</button></div><div class="lunar-dialog-body">' + infoGrid + adviceMarkup + agendaMarkup + almanacMarkup + '</div></div>';
  dialog.hidden = false;
  state.lunarDialogDate = key;
}
function closeLunarDialog() { const dialog = $('#lunarDialog'); if (dialog) dialog.hidden = true; state.lunarDialogDate = null; }

// Weather --------------------------------------------------------------------
const weatherCode = (code) => {
  if (code === 0) return ['☀️', state.language === 'en' ? 'Clear' : '晴'];
  if ([1, 2, 3].includes(code)) return ['⛅', state.language === 'en' ? 'Cloudy' : '多云'];
  if ([45, 48].includes(code)) return ['🌫️', state.language === 'en' ? 'Fog' : '雾'];
  if ([51, 53, 55, 56, 57].includes(code)) return ['🌦️', state.language === 'en' ? 'Drizzle' : '毛毛雨'];
  if ([61, 63, 65, 66, 67].includes(code)) return ['🌧️', state.language === 'en' ? 'Rain' : '降雨'];
  if ([71, 73, 75, 77].includes(code)) return ['🌨️', state.language === 'en' ? 'Snow' : '降雪'];
  if ([80, 81, 82].includes(code)) return ['🌦️', state.language === 'en' ? 'Showers' : '阵雨'];
  return ['⛈️', state.language === 'en' ? 'Thunderstorm' : '雷雨'];
};
const weatherUrl = (lat, lon) => 'https://api.open-meteo.com/v1/forecast?latitude=' + encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon) + '&current=temperature_2m,apparent_temperature,weather_code,relative_humidity_2m,wind_speed_10m,precipitation&hourly=temperature_2m,apparent_temperature,weather_code,precipitation_probability,uv_index,wind_speed_10m,relative_humidity_2m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max,wind_speed_10m_max&wind_speed_unit=kmh&timezone=auto&past_days=3&forecast_days=16';
const weatherElevationUrl = (lat, lon) => 'https://api.open-meteo.com/v1/elevation?latitude=' + encodeURIComponent(lat) + '&longitude=' + encodeURIComponent(lon);
function normalizeWeatherCards(value) {
  const seen = new Set();
  return (Array.isArray(value) ? value : []).filter((card) => card && typeof card === 'object').map((card) => {
    let id = String(card.id || '').trim();
    if (!id || seen.has(id)) id = uid();
    seen.add(id);
    return { ...card, id };
  });
}
function saveWeatherCards() {
  state.weatherCards = normalizeWeatherCards(state.weatherCards);
  saveStored(STORAGE.weatherCards, state.weatherCards);
}
function removeWeatherCard(id, fallbackIndex = -1) {
  let index = id ? state.weatherCards.findIndex((card) => String(card.id || '') === String(id)) : -1;
  if (index < 0 && !id && Number.isInteger(fallbackIndex) && fallbackIndex >= 0 && fallbackIndex < state.weatherCards.length) index = fallbackIndex;
  if (index < 0) return false;
  const removedId = state.weatherCards[index].id;
  state.weatherCards.splice(index, 1);
  if (state.activeWeatherId === removedId || !state.weatherCards.some((card) => card.id === state.activeWeatherId)) state.activeWeatherId = state.weatherCards[0]?.id || null;
  reorderTarget = null;
  reorderDrag = null;
  saveWeatherCards();
  render();
  return true;
}
function handleWeatherDeletePointer(event) {
  const button = event.target?.closest?.('[data-delete-weather]');
  if (!button) return false;
  if (button.dataset.weatherDeleteHandled === 'true') {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  button.dataset.weatherDeleteHandled = 'true';
  event.preventDefault();
  event.stopPropagation();
  removeWeatherCard(button.dataset.deleteWeather, Number(button.dataset.deleteWeatherIndex));
  return true;
}
function weatherCardFailureText() { return state.language === 'en' ? 'Weather failed to load' : '天气获取失败'; }
function weatherLocationError(error) {
  if (!window.isSecureContext) return state.language === 'en' ? 'Location requires a secure HTTPS page. Reopen OneBox over HTTPS.' : '定位需要 HTTPS 安全页面，请通过 HTTPS 重新打开 OneBox。';
  if (error?.code === 1) return state.language === 'en' ? 'Location permission was denied. Allow location access for this site in your browser settings, then retry.' : '浏览器拒绝了定位权限。请在浏览器的网站设置中允许此网站获取位置，再重试。';
  if (error?.code === 2) return state.language === 'en' ? 'Your device could not determine its location. Check system Location Services and network, then retry.' : '设备暂时无法确定位置。请检查系统定位服务和网络后重试。';
  if (error?.code === 3) return state.language === 'en' ? 'Location timed out. Move to an area with a clearer signal or retry.' : '定位请求超时。请检查定位信号，或稍后重试。';
  return state.language === 'en' ? 'Could not get your location. Check browser and system location settings, then retry.' : '无法获取当前位置。请检查浏览器和系统定位设置后重试。';
}
async function getWeatherData(lat, lon) {
  const response = await fetchWithTimeout(weatherUrl(lat, lon), { headers: { Accept: 'application/json' } }, 9000);
  if (!response.ok) throw Error(state.language === 'en' ? 'Weather service is unavailable' : '天气服务暂时不可用');
  const data = await response.json();
  if (!Number.isFinite(Number(data.elevation))) {
    try {
      const elevationResponse = await fetchWithTimeout(weatherElevationUrl(lat, lon), { headers: { Accept: 'application/json' } }, 5000);
      if (elevationResponse.ok) {
        const elevationData = await elevationResponse.json();
        const elevation = Number(elevationData.elevation?.[0]);
        if (Number.isFinite(elevation)) data.elevation = elevation;
      }
    } catch { /* Forecast data remains usable when the elevation endpoint is unavailable. */ }
  }
  return data;
}
async function addWeatherPlace(place) {
  const request = ++state.weatherRequest;
  state.weatherSearchRequest += 1; state.weatherSearchLoading = false; state.weatherSearchError = '';
  const currentIndex = place.isCurrentLocation ? state.weatherCards.findIndex((item) => item.isCurrentLocation) : -1;
  const coordinateIndex = state.weatherCards.findIndex((item) => Math.abs(Number(item.latitude) - Number(place.latitude)) < .01 && Math.abs(Number(item.longitude) - Number(place.longitude)) < .01);
  const existingIndex = currentIndex >= 0 ? currentIndex : coordinateIndex;
  const cardId = existingIndex >= 0 ? state.weatherCards[existingIndex].id : uid();
  if (existingIndex < 0) state.weatherCards.push({ id: cardId, ...place, isCurrentLocation: Boolean(place.isCurrentLocation), loading: true, loadError: false });
  else Object.assign(state.weatherCards[existingIndex], place, { isCurrentLocation: Boolean(place.isCurrentLocation || state.weatherCards[existingIndex].isCurrentLocation), loading: true, loadError: false });
  state.activeWeatherId = cardId; state.weatherSearchResults = []; state.weatherLoading = true; state.weatherError = ''; render();
  try {
    const data = await getWeatherData(place.latitude, place.longitude);
    if (request !== state.weatherRequest) {
      const staleIndex = state.weatherCards.findIndex((item) => item.id === cardId);
      if (staleIndex >= 0) {
        state.weatherCards[staleIndex].loading = false;
        state.weatherCards[staleIndex].loadError = true;
        saveWeatherCards();
      }
      return;
    }
    const card = { ...data, id: cardId, name: place.name, admin1: place.admin1 || '', admin2: place.admin2 || '', country: place.country || '', latitude: place.latitude, longitude: place.longitude, isCurrentLocation: Boolean(place.isCurrentLocation), updatedAt: Date.now(), loading: false, loadError: false };
    const targetIndex = state.weatherCards.findIndex((item) => item.id === cardId);
    if (targetIndex >= 0) state.weatherCards[targetIndex] = card; else state.weatherCards.push(card);
    state.activeWeatherId = card.id; saveWeatherCards();
    toast(state.language === 'en' ? 'Weather card saved' : '天气卡片已保存');
  } catch (error) {
    const failedIndex = state.weatherCards.findIndex((item) => item.id === cardId);
    if (failedIndex >= 0) {
      // Keep a failed place as an explicit, removable card. Removing it here
      // made a failed add look like a frozen card and gave users no recovery
      // path when the request had already rendered on screen.
      state.weatherCards[failedIndex].loading = false;
      state.weatherCards[failedIndex].loadError = true;
      saveWeatherCards();
    }
    state.weatherError = error.message || weatherCardFailureText();
  }
  finally { if (request === state.weatherRequest) { state.weatherLoading = false; render(); } }
}
async function refreshWeatherCard(card) {
  if (!card || state.weatherLoading) return;
  const request = ++state.weatherRequest; state.weatherLoading = true; state.weatherError = ''; card.loading = true; card.loadError = false;
  try {
    const data = await getWeatherData(card.latitude, card.longitude);
    if (request !== state.weatherRequest) return;
    Object.assign(card, data, { updatedAt: Date.now(), loading: false, loadError: false }); saveWeatherCards();
  } catch (error) {
    card.loading = false;
    card.loadError = true;
    saveWeatherCards();
    state.weatherError = error.message || (state.language === 'en' ? 'Refresh failed' : '刷新失败');
  } finally {
    if (request === state.weatherRequest) { state.weatherLoading = false; render(); }
  }
}
async function searchWeather(query) {
  const value = query.trim();
  if (!value) return toast(state.language === 'en' ? 'Enter a city or district' : '请输入城市或区县名称', 'error');
  const request = ++state.weatherSearchRequest;
  state.weatherSearchQuery = value; state.weatherSearchTerm = value; state.weatherSearchLoading = true;
  state.weatherSearchError = ''; state.weatherSearchResults = []; updateWeatherSearchResults();
  let failures = 0;
  const addResults = (incoming) => {
    if (request !== state.weatherSearchRequest || !incoming.length) return;
    const merged = [...state.weatherSearchResults];
    incoming.forEach((place) => {
      const duplicate = merged.some((item) =>
        (Math.abs(Number(item.latitude) - Number(place.latitude)) < .01 && Math.abs(Number(item.longitude) - Number(place.longitude)) < .01) ||
        (String(item.name).toLocaleLowerCase() === String(place.name).toLocaleLowerCase() && String(item.admin1 || '').toLocaleLowerCase() === String(place.admin1 || '').toLocaleLowerCase() && String(item.country || '').toLocaleLowerCase() === String(place.country || '').toLocaleLowerCase())
      );
      if (!duplicate) merged.push(place);
    });
    // Keep the full useful POI range from Photon (40) alongside up to eight
    // city-level matches from Open-Meteo. The result popover scrolls, so a
    // larger result set does not shift the weather page.
    state.weatherSearchResults = merged.slice(0, 48);
    updateWeatherSearchResults();
  };
  const searchOpenMeteo = async () => {
    const response = await fetchWithTimeout('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(value) + '&count=8&language=' + (state.language === 'en' ? 'en' : 'zh') + '&format=json', { headers: { Accept: 'application/json' } }, 5000);
    if (!response.ok) throw Error('Geocoding request failed');
    const data = await response.json();
    return (data.results || []).map((place) => ({ ...place, latitude: Number(place.latitude), longitude: Number(place.longitude) }))
      .filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
  };
  const searchPhoton = async () => {
    // Photon accepts only de/en/fr as explicit languages. Leave the parameter
    // out for Chinese so it can return its normal multilingual place matches.
    const language = state.language === 'en' ? '&lang=en' : '';
    const response = await fetchWithTimeout('https://photon.komoot.io/api/?q=' + encodeURIComponent(value) + '&limit=40' + language, { headers: { Accept: 'application/json' } }, 5000);
    if (!response.ok) throw Error('Place search request failed');
    const data = await response.json();
    return (data.features || []).map((feature) => {
      const properties = feature.properties || {}; const coordinates = feature.geometry?.coordinates || [];
      return { name: properties.name || properties.city || value, admin2: properties.city || properties.district || '', admin1: properties.state || '', country: properties.country || '', latitude: Number(coordinates[1]), longitude: Number(coordinates[0]) };
    }).filter((place) => Number.isFinite(place.latitude) && Number.isFinite(place.longitude));
  };
  await Promise.all([searchOpenMeteo, searchPhoton].map(async (search) => {
    try { addResults(await search()); }
    catch { if (request === state.weatherSearchRequest) failures += 1; }
  }));
  if (request !== state.weatherSearchRequest) return;
  state.weatherSearchLoading = false;
  if (!state.weatherSearchResults.length) {
    state.weatherSearchError = failures === 2
      ? (state.language === 'en' ? 'Place search is temporarily unavailable. Please try again.' : '地点搜索服务暂时不可用，请稍后重试。')
      : t('noResults');
  }
  updateWeatherSearchResults();
}
function placeLabel(place) { return [place.name, place.admin2, place.admin1, place.country].filter(Boolean).join(' · '); }
function weatherSearchResultsMarkup() {
  const status = state.weatherSearchLoading
    ? '<div class="weather-search-status" role="status"><span class="loader" aria-hidden="true"></span><span>' + (state.language === 'en' ? 'Searching places…' : '正在搜索地点…') + '</span></div>'
    : '';
  const error = state.weatherSearchError
    ? '<div class="weather-search-message" role="status">' + escapeHtml(state.weatherSearchError) + '</div>'
    : '';
  const results = state.weatherSearchResults.length
    ? '<div class="weather-search-results"><div class="search-results-head"><strong>' + (state.language === 'en' ? 'Search results' : '搜索结果') + '</strong><small>' + (state.language === 'en' ? 'Choose a place, then add it to weather cards' : '选择地点后再添加到天气卡片') + '</small></div>' + state.weatherSearchResults.map((place, index) => '<div class="weather-result"><span><strong>' + escapeHtml(place.name) + '</strong><small>' + escapeHtml(placeLabel(place)) + '</small></span><button class="secondary" data-weather-result-index="' + index + '">' + t('addCard') + '</button></div>').join('') + '</div>'
    : '';
  return status + error + results;
}
function updateWeatherSearchResults() {
  const slot = $('#weatherSearchResults');
  if (slot) slot.innerHTML = weatherSearchResultsMarkup();
}
function closeWeatherSearchPopover() {
  if (!state.weatherSearchLoading && !state.weatherSearchError && !state.weatherSearchResults.length) return;
  state.weatherSearchRequest += 1; state.weatherSearchLoading = false; state.weatherSearchError = ''; state.weatherSearchResults = [];
  updateWeatherSearchResults();
}
async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetchWithTimeout('https://photon.komoot.io/reverse?lat=' + encodeURIComponent(latitude) + '&lon=' + encodeURIComponent(longitude), { headers: { Accept: 'application/json' } }, 5000);
    const data = await response.json(); const properties = data.features?.[0]?.properties || {};
    const district = properties.district || properties.county || '';
    const city = properties.city || properties.town || properties.municipality || '';
    return { latitude, longitude, name: district || city || properties.name || (state.language === 'en' ? 'Current location' : '当前位置'), admin2: city && city !== district ? city : '', admin1: properties.state || properties.region || '', country: properties.country || '', isCurrentLocation: true };
  } catch { return { latitude, longitude, name: state.language === 'en' ? 'Current location' : '当前位置', isCurrentLocation: true }; }
}
function currentHourIndex(weather) {
  const times = weather?.hourly?.time || []; if (!times.length) return -1;
  const now = Date.now();
  return times.reduce((best, time, index) => Math.abs(new Date(time).getTime() - now) < Math.abs(new Date(times[best]).getTime() - now) ? index : best, 0);
}
function weatherWindLevel(speed) {
  const kmh = Math.max(0, Number(speed) || 0);
  const levels = [
    { max: 1, force: 0, zh: '无风', en: 'Calm', zhAdvice: '几乎无风，户外活动基本不受影响。', enAdvice: 'Calm; outdoor activities are generally unaffected.' },
    { max: 5, force: 1, zh: '软风', en: 'Light air', zhAdvice: '风很轻，适合通勤和轻量户外活动。', enAdvice: 'Very light wind; suitable for commuting and gentle outdoor activity.' },
    { max: 11, force: 2, zh: '轻风', en: 'Light breeze', zhAdvice: '体感舒适，骑行或散步注意帽子等轻物。', enAdvice: 'Comfortable for most activities; secure hats and light items when cycling or walking.' },
    { max: 19, force: 3, zh: '和风', en: 'Gentle breeze', zhAdvice: '适合户外活动，骑行和晾晒通常没有问题。', enAdvice: 'Good for outdoor activity; cycling and drying laundry are usually fine.' },
    { max: 28, force: 4, zh: '清劲风', en: 'Moderate breeze', zhAdvice: '迎风行走会有阻力，骑行和高处作业请留意。', enAdvice: 'Walking against the wind takes effort; take care when cycling or working at height.' },
    { max: 38, force: 5, zh: '强风', en: 'Fresh breeze', zhAdvice: '不建议在树下、广告牌旁久留，户外运动适当减量。', enAdvice: 'Avoid lingering under trees or signs; reduce the intensity of outdoor exercise.' },
    { max: 49, force: 6, zh: '大风', en: 'Strong breeze', zhAdvice: '建议减少户外活动，固定阳台物品并注意高空坠物。', enAdvice: 'Limit outdoor activity, secure balcony items and watch for falling objects.' },
    { max: 61, force: 7, zh: '疾风', en: 'Near gale', zhAdvice: '尽量留在室内，避免靠近临时设施、树木和海边。', enAdvice: 'Stay indoors where possible; avoid temporary structures, trees and exposed waterfronts.' },
    { max: 74, force: 8, zh: '大风', en: 'Gale', zhAdvice: '不建议出行，关注当地大风预警和交通安排。', enAdvice: 'Avoid unnecessary travel and follow local wind warnings and transport updates.' },
    { max: Infinity, force: 9, zh: '烈风', en: 'Severe gale', zhAdvice: '强风风险很高，留在安全室内并关注官方预警。', enAdvice: 'Very hazardous winds; remain in a secure place and follow official warnings.' },
  ];
  const level = levels.find((item) => kmh <= item.max) || levels[levels.length - 1];
  return { ...level, speed: Math.round(kmh) };
}
function weatherElevationLabel(value) {
  const elevation = Number(value);
  if (!Number.isFinite(elevation)) return '—';
  return Math.round(elevation) + ' m';
}
function weatherWindLabel(value) {
  const level = weatherWindLevel(value);
  return state.language === 'en' ? 'Bft ' + level.force + ' · ' + level.en : level.force + '级 · ' + level.zh;
}
function weatherAdvice(weather, current) {
  const temperature = Number(current.temperature_2m ?? 20);
  const rain = Number(current.precipitation ?? 0);
  const probability = Number(weather.daily?.precipitation_probability_max?.[0] ?? 0);
  const wind = Number(current.wind_speed_10m ?? 0);
  const windLevel = weatherWindLevel(wind);
  const uv = Number(weather.daily?.uv_index_max?.[0] ?? 0);
  const code = Number(current.weather_code);
  const rainy = rain > .1 || probability >= 55 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
  return [
    { icon: '🚶', title: t('commute'), body: rainy ? (state.language === 'en' ? 'Take an umbrella and allow extra travel time.' : '有降雨可能，带伞并预留出行时间。') : (state.language === 'en' ? 'Good conditions for normal travel.' : '适合正常出行，路上注意安全。') },
    { icon: '🏃', title: t('sport'), body: wind > 35 || rainy ? (state.language === 'en' ? 'Consider an indoor workout.' : '风雨较明显，建议选择室内运动。') : (state.language === 'en' ? 'Suitable for outdoor exercise; hydrate.' : '适合户外运动，注意补水。') },
    { icon: '💨', title: t('windAdvice'), body: (state.language === 'en' ? 'Bft ' + windLevel.force + ' · ' + windLevel.en + ' · ' + windLevel.speed + ' km/h. ' + windLevel.enAdvice : windLevel.force + '级 · ' + windLevel.zh + ' · ' + windLevel.speed + ' km/h。' + windLevel.zhAdvice) },
    { icon: '🧥', title: t('clothing'), body: temperature < 10 ? (state.language === 'en' ? 'Layer up with a warm coat.' : '气温偏低，建议分层保暖。') : temperature > 28 ? (state.language === 'en' ? 'Light, breathable clothing is best.' : '天气偏热，穿轻薄透气衣物。') : (state.language === 'en' ? 'A light layer should be comfortable.' : '薄外套或长袖即可，体感舒适。') },
    { icon: '🕶️', title: t('sunscreen'), body: uv >= 6 ? (state.language === 'en' ? 'High UV: sunscreen, hat and sunglasses recommended.' : '紫外线偏强，建议防晒、戴帽和太阳镜。') : (state.language === 'en' ? 'UV is moderate; sunscreen is still useful.' : '紫外线中等，外出仍建议做好防晒。') },
    { icon: '🥾', title: t('hiking'), body: rainy || wind > 40 ? (state.language === 'en' ? 'Trail may be slippery or windy; check conditions first.' : '山路可能湿滑或风大，出发前确认路况。') : (state.language === 'en' ? 'Good for a short hike; bring water.' : '适合短途爬山，带足饮水。') },
  ];
}
function weather() {
  const active = state.weatherCards.find((item) => item.id === state.activeWeatherId) || state.weatherCards[0];
  const search = '<form id="weatherSearch" class="weather-search"><label class="sr-only" for="cityInput">' + t('searchPlace') + '</label><div class="weather-search-field"><input id="cityInput" value="' + escapeHtml(state.weatherSearchQuery) + '" placeholder="' + t('searchPlace') + '" autocomplete="off"><button class="weather-search-clear" type="button" data-weather-clear aria-label="' + (state.language === 'en' ? 'Clear search' : '清空搜索') + '" title="' + (state.language === 'en' ? 'Clear search' : '清空搜索') + '"' + (state.weatherSearchQuery.trim() ? '' : ' hidden') + '>×</button><button class="weather-location-button" type="button" data-locate aria-label="' + t('currentLocation') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7"></circle><circle cx="12" cy="12" r="2"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path></svg></button></div><button class="primary" type="submit">' + t('weatherSearch') + '</button></form>';
  const results = '<div id="weatherSearchResults" class="weather-search-result-slot" aria-live="polite">' + weatherSearchResultsMarkup() + '</div>';
  const searchArea = '<div class="weather-search-area">' + search + results + '</div>';
  if (!active) return heading(t('weather'), t('weatherDesc')) + searchArea + '<div class="empty weather-empty">' + (state.weatherLoading ? '<span class="loader"></span>' + t('weatherLoading') : t('noWeather')) + (state.weatherError ? '<strong class="error-text">' + escapeHtml(state.weatherError) + '</strong>' : '') + '</div>';
  const current = active.current || {};
  const cards = state.weatherCards.map((card, index) => {
    const failed = Boolean(card.loadError && !card.current);
    const item = card.loading && !card.current ? ['⏳', t('weatherLoading')] : failed ? ['⚠️', t('weatherLoadFailed')] : weatherCode(card.current?.weather_code);
    const cardCurrent = card.current || {};
    const temperature = card.loading && !card.current ? '…' : failed ? '—' : Math.round(cardCurrent.temperature_2m ?? 0) + '°';
    const details = card.loading && !card.current ? '<span class="weather-card-meta-line">' + escapeHtml(t('weatherLoading')) + '</span>' : failed ? '<span class="weather-card-meta-line">' + escapeHtml(t('weatherLoadFailed')) + '</span>' : '<span class="weather-card-meta-line">' + escapeHtml((state.language === 'en' ? 'Feels ' : '体感 ') + Math.round(cardCurrent.apparent_temperature ?? cardCurrent.temperature_2m ?? 0) + '° · ' + (state.language === 'en' ? 'Humidity ' : '湿度 ') + (cardCurrent.relative_humidity_2m ?? '—') + '%') + '</span><span class="weather-card-meta-line weather-card-meta-secondary"><span>' + escapeHtml((state.language === 'en' ? 'Wind ' : '风力 ') + weatherWindLabel(cardCurrent.wind_speed_10m) + ' · ' + Math.round(cardCurrent.wind_speed_10m ?? 0) + ' km/h') + '</span><span>' + escapeHtml(t('elevation') + ' ' + weatherElevationLabel(card.elevation)) + '</span></span>';
    return '<article class="weather-card ' + (card.id === active.id ? 'active' : '') + (card.loading ? ' loading' : '') + (failed ? ' has-error' : '') + '" draggable="true" data-weather-card="' + escapeHtml(card.id) + '" data-weather-index="' + index + '"><button type="button" class="weather-card-delete" data-delete-weather="' + escapeHtml(card.id) + '" data-delete-weather-index="' + index + '" aria-label="' + (state.language === 'en' ? 'Delete weather card' : '删除天气卡片') + '">×</button><div class="weather-card-head"><span><strong>' + escapeHtml(card.name) + '</strong><small>' + escapeHtml([card.admin2, card.admin1].filter(Boolean).join(' · ') || card.country || '') + '</small></span><span class="weather-card-icon" aria-hidden="true">' + item[0] + '</span></div><div class="weather-card-main"><span class="weather-card-temp">' + temperature + '</span><span class="weather-card-condition">' + escapeHtml(item[1]) + '</span></div><span class="weather-card-meta">' + details + '</span></article>';
  }).join('');
  const title = [active.name, active.admin2, active.admin1, active.country].filter(Boolean).join(' · ');
  if ((active.loading || active.loadError) && !active.current) {
    const failure = active.loadError ? '<div class="inline-alert">' + escapeHtml(t('weatherLoadFailed')) + '</div>' : '';
    return heading(t('weather'), escapeHtml(title)) + searchArea + failure + '<div class="weather-card-list">' + cards + '</div>';
  }
  const hourlyTimes = Array.isArray(active.hourly?.time) ? active.hourly.time : [];
  const hourlyTemperatures = Array.isArray(active.hourly?.temperature_2m) ? active.hourly.temperature_2m : [];
  const selectedHour = currentHourIndex(active);
  const currentHour = selectedHour >= 0 ? selectedHour : 0;
  const hourlyPastHours = 12;
  const hourlyFutureHours = 24;
  const hourlyWindowSize = hourlyPastHours + hourlyFutureHours;
  const hourlyStart = Math.min(Math.max(0, currentHour - hourlyPastHours), Math.max(0, hourlyTimes.length - hourlyWindowSize));
  const hourlyEnd = Math.min(hourlyTimes.length, hourlyStart + hourlyWindowSize);
  const hasTemperature = (value) => value != null && value !== '' && Number.isFinite(Number(value));
  const needsHourlyRepair = hourlyTimes.slice(hourlyStart, hourlyEnd).some((_, offset) => {
    const index = hourlyStart + offset;
    const temperature = hourlyTemperatures[index] ?? (index === currentHour ? active.current?.temperature_2m : null);
    return !hasTemperature(temperature);
  });
  if (needsHourlyRepair && Date.now() - Number(active.hourlyRepairAttemptAt || 0) > 5 * 60 * 1000) {
    active.hourlyRepairAttemptAt = Date.now();
    setTimeout(() => { if (state.activeWeatherId === active.id && !state.weatherLoading) void refreshWeatherCard(active); }, 0);
  }
  const hourly = hourlyTimes.slice(hourlyStart, hourlyEnd).map((time, offset) => {
    const index = hourlyStart + offset;
    const code = active.hourly?.weather_code?.[index] ?? active.current?.weather_code;
    const item = weatherCode(Number(code));
    const date = new Date(time);
    const isCurrent = index === currentHour;
    const label = isCurrent ? (state.language === 'en' ? 'Now' : '现在') : new Intl.DateTimeFormat(state.language === 'en' ? 'en-US' : 'zh-CN', { hour: '2-digit', minute: '2-digit' }).format(date);
    const temperature = hourlyTemperatures[index] ?? (isCurrent ? active.current?.temperature_2m : null);
    const temperatureLabel = hasTemperature(temperature) ? Math.round(Number(temperature)) + '°' : '—';
    const rainChance = active.hourly?.precipitation_probability?.[index];
    return '<div class="hour-card ' + (isCurrent ? 'current' : '') + '" ' + (isCurrent ? 'data-current-hour' : '') + '><small>' + label + '</small><strong>' + item[0] + '</strong><span>' + temperatureLabel + '</span><small>' + (Number.isFinite(Number(rainChance)) ? Number(rainChance) : 0) + '%</small></div>';
  }).join('');
  const dailyTimes = (active.daily?.time || []).slice(0, 19);
  const currentDay = String(active.current?.time || '').slice(0, 10) || dateKey(today);
  const days = dailyTimes.map((day, index) => {
    const item = weatherCode(active.daily.weather_code[index]);
    const isCurrent = day === currentDay;
    const label = isCurrent ? (state.language === 'en' ? 'Today' : '今天') : new Intl.DateTimeFormat(state.language === 'en' ? 'en-US' : 'zh-CN', { month: 'numeric', day: 'numeric', weekday: 'short' }).format(dateFromKey(day));
    return '<div class="forecast ' + (isCurrent ? 'current' : '') + '" ' + (isCurrent ? 'data-current-day' : '') + '><small>' + label + '</small><b>' + item[0] + '</b><span>' + Math.round(active.daily.temperature_2m_max[index]) + '° / ' + Math.round(active.daily.temperature_2m_min[index]) + '°</span><small>' + (active.daily.precipitation_probability_max?.[index] ?? 0) + '% ' + (state.language === 'en' ? 'rain' : '降水') + '</small></div>';
  }).join('');
  const advice = weatherAdvice(active, current).map((item) => '<article class="advice-card"><b>' + item.icon + ' ' + item.title + '</b><p>' + item.body + '</p></article>').join('');
  const updatedTime = active.updatedAt ? new Intl.DateTimeFormat(state.language === 'en' ? 'en-US' : 'zh-CN', { hour: '2-digit', minute: '2-digit' }).format(active.updatedAt) : '—';
  const weatherDataNote = t('weatherData').replace('{time}', updatedTime);
  setTimeout(() => {
    const activeCard = $$('.weather-card[data-weather-card]').find((card) => card.dataset.weatherCard === state.activeWeatherId);
    const cardList = $('.weather-card-list');
    if (activeCard && cardList) cardList.scrollTo({ left: Math.max(0, activeCard.offsetLeft - 2), behavior: 'smooth' });
    [['[data-current-hour]', '.hourly-strip'], ['[data-current-day]', '.weather-days']].forEach(([cardSelector, stripSelector]) => {
      const card = $(cardSelector); const strip = $(stripSelector); if (!card || !strip) return;
      // Keep the selected period at the leading edge. Centering the current
      // card made the strip jump on refresh and hid the beginning of the list.
      strip.scrollTo({ left: Math.max(0, card.offsetLeft - 2), behavior: 'smooth' });
    });
  }, 0);
  return heading(t('weather'), escapeHtml(title) + ' · ' + (state.language === 'en' ? 'updated' : '更新于') + ' ' + (active.updatedAt ? new Intl.DateTimeFormat(state.language === 'en' ? 'en-US' : 'zh-CN', { hour: '2-digit', minute: '2-digit' }).format(active.updatedAt) : (state.language === 'en' ? 'cached' : '本机缓存'))) +
    searchArea + (state.weatherError ? '<div class="inline-alert">' + escapeHtml(state.weatherError) + '，' + (state.language === 'en' ? 'showing the last successful result' : '当前显示上次成功结果') + '。</div>' : '') +
    '<div class="weather-card-list">' + cards + '</div>' +
    '<div class="weather-section-heading"><h3 class="weather-section-title">' + t('hourly') + '</h3><p class="weather-data-note">' + (needsHourlyRepair ? '<span class="inline-alert">' + escapeHtml(t('weatherHourlyRepairing')) + '</span> ' : '') + escapeHtml(weatherDataNote) + '</p></div><div class="hourly-strip">' + hourly + '</div><h3 class="weather-section-title">' + t('advice') + '</h3><div class="advice-strip">' + advice + '</div><h3 class="weather-section-title">' + t('daily') + '</h3><div class="weather-days">' + days + '</div>';
}

// Developer tools ------------------------------------------------------------
function saveDevTools() { saveStored(STORAGE.devTools, state.devTools); }
function devRecordText(value, limit = 50000) { return String(value || '').slice(0, limit); }
function addDevRecord(kind, record) {
  const list = Array.isArray(state.devTools.records[kind]) ? state.devTools.records[kind] : [];
  state.devTools.records[kind] = [{ id: uid(), at: Date.now(), ...record }, ...list].slice(0, 24);
  saveDevTools();
}
function devModeLabel(mode) {
  return mode === 'json-format' ? t('devJsonFormat') : mode === 'json-compare' ? t('devJsonCompare') : mode === 'text-stats' ? t('devTextStats') : t('devTimestamp');
}
function devRecordLabel(kind, item) {
  const date = new Intl.DateTimeFormat(state.language === 'en' ? 'en-US' : 'zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(Number(item.at) || Date.now());
  if (kind === 'json-format') return (item.compact ? t('devMinify') : t('devFormat')) + ' · ' + date;
  if (kind === 'json-compare') return t('devJsonCompare') + ' · ' + date;
  if (kind === 'text-stats') return t('devTextStats') + ' · ' + date;
  return (item.mode === 'date' ? t('devDateToTimestamp') : t('devTimestampToDate')) + ' · ' + date;
}
function parseDeveloperJson(value) {
  let source = String(value || '').trim();
  source = source.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const callback = source.match(/^[\w$]+\s*\(([\s\S]*)\)\s*;?$/);
  if (callback) source = callback[1].trim();
  const parseCandidate = (candidate) => {
    const parsed = JSON.parse(candidate);
    if (typeof parsed === 'string' && /^[\[{]/.test(parsed.trim())) return { value: JSON.parse(parsed), unescaped: true };
    return { value: parsed, unescaped: false };
  };
  try { return parseCandidate(source); } catch (directError) {
    if (state.devTools.formatUnescape === false) throw directError;
    let decoded = source;
    if ((decoded.startsWith('"') && decoded.endsWith('"')) || (decoded.startsWith("'") && decoded.endsWith("'"))) {
      try {
        const wrapped = decoded.startsWith("'") ? '"' + decoded.slice(1, -1).replace(/"/g, '\\"') + '"' : decoded;
        const nested = JSON.parse(wrapped);
        if (typeof nested === 'string') decoded = nested;
      } catch { /* Continue with the lighter escape decoder below. */ }
    }
    decoded = decoded.replace(/\\(["\\/])/g, '$1').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\b/g, '\b').replace(/\\f/g, '\f').replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
    const parsed = JSON.parse(decoded);
    if (typeof parsed === 'string' && /^[\[{]/.test(parsed.trim())) return { value: JSON.parse(parsed), unescaped: true };
    return { value: parsed, unescaped: true };
  }
}
function jsonValueLabel(value) {
  if (value === undefined) return '∅';
  const output = JSON.stringify(value);
  return output === undefined ? String(value) : output;
}
function compareDeveloperJson(left, right, path = '$', changes = []) {
  if (Object.is(left, right)) return changes;
  const leftObject = left && typeof left === 'object'; const rightObject = right && typeof right === 'object';
  if (leftObject && rightObject && Array.isArray(left) === Array.isArray(right)) {
    const keys = Array.isArray(left) ? Array.from({ length: Math.max(left.length, right.length) }, (_, index) => index) : [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
    keys.forEach((key) => compareDeveloperJson(left[key], right[key], Array.isArray(left) ? path + '[' + key + ']' : path + '.' + key, changes));
    return changes;
  }
  changes.push({ path, before: jsonValueLabel(left), after: jsonValueLabel(right) });
  return changes;
}
function formatDeveloperJson(value, compact = false) {
  try {
    const result = parseDeveloperJson(value);
    return { ok: true, output: JSON.stringify(result.value, null, compact ? 0 : 2), message: t('devValid') + (result.unescaped ? ' · ' + t('devUnescape') : '') };
  } catch (error) {
    return { ok: false, output: '', message: t('devInvalid') + (error?.message ? '：' + error.message : '') };
  }
}
function devJsonPathSegment(key, array) { return array ? '[' + key + ']' : '.' + String(key).replace(/([.\\])/g, '\\$1'); }
function devJsonType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
function devJsonPrimitive(value) {
  return '<span class="dev-json-value dev-json-' + devJsonType(value) + '">' + escapeHtml(jsonValueLabel(value)) + '</span>';
}
function devJsonSummary(value) {
  const count = value && typeof value === 'object' ? Object.keys(value).length : 0;
  return Array.isArray(value) ? '[… ' + count + ']' : '{… ' + count + '}';
}
function devJsonTreeNode(value, path = '$', label = '', depth = 0, trailingComma = false) {
  const container = value && typeof value === 'object';
  const entries = container ? Object.entries(value) : [];
  const empty = container && entries.length === 0;
  const collapsed = container && !empty && state.devTools.formatCollapsed.includes(path);
  const keyMarkup = label === '' ? '' : '<span class="dev-json-key">' + escapeHtml(JSON.stringify(label)) + '</span><span class="dev-json-colon">:</span> ';
  const comma = trailingComma ? ',' : '';
  if (!container) return '<div class="dev-json-line dev-json-leaf" style="--dev-depth:' + depth + '">' + keyMarkup + devJsonPrimitive(value) + comma + '</div>';
  const open = Array.isArray(value) ? '[' : '{';
  const close = Array.isArray(value) ? ']' : '}';
  const toggle = empty ? '<span class="dev-json-toggle-placeholder"></span>' : '<button class="dev-json-toggle" type="button" data-dev-json-toggle data-dev-json-path="' + encodeURIComponent(path) + '" aria-expanded="' + String(!collapsed) + '" aria-label="' + escapeHtml((collapsed ? t('devExpandAll') : t('devCollapseAll')) + ' ' + (label || '$')) + '">' + (collapsed ? '▸' : '▾') + '</button>';
  const openLine = '<div class="dev-json-line dev-json-open ' + (collapsed ? 'is-collapsed' : '') + '" style="--dev-depth:' + depth + '">' + toggle + keyMarkup + '<span class="dev-json-bracket">' + (collapsed ? devJsonSummary(value) : open) + '</span>' + (collapsed ? comma : '') + '</div>';
  if (empty || collapsed) return '<div class="dev-json-node ' + (collapsed ? 'is-collapsed' : '') + '">' + openLine + (empty ? '<span class="dev-json-close-inline">' + close + (comma ? ',' : '') + '</span>' : '') + '</div>';
  const children = entries.map(([key, child], index) => devJsonTreeNode(child, path + devJsonPathSegment(key, Array.isArray(value)), Array.isArray(value) ? '' : key, depth + 1, index < entries.length - 1)).join('');
  return '<div class="dev-json-node">' + openLine + '<div class="dev-json-children">' + children + '</div><div class="dev-json-line dev-json-close" style="--dev-depth:' + depth + '"><span class="dev-json-toggle-placeholder"></span><span class="dev-json-bracket">' + close + comma + '</span></div></div>';
}
function renderDeveloperJsonTree() {
  if (!state.devTools.formatOutput) return '<div class="dev-json-empty">' + escapeHtml(t('devOutput')) + '</div>';
  try { return '<div class="dev-json-tree" role="tree">' + devJsonTreeNode(JSON.parse(state.devTools.formatOutput)) + '</div>'; } catch { return '<pre class="dev-result-pre">' + escapeHtml(state.devTools.formatOutput) + '</pre>'; }
}
function collectDeveloperJsonPaths(value, path = '$', output = []) {
  if (!value || typeof value !== 'object' || Object.keys(value).length === 0) return output;
  output.push(path);
  Object.entries(value).forEach(([key, child]) => collectDeveloperJsonPaths(child, path + devJsonPathSegment(key, Array.isArray(value)), output));
  return output;
}
function developerTextStats(value) {
  const text = String(value || '');
  const characters = [...text].length;
  const nonSpace = [...text].filter((item) => !/\s/u.test(item)).length;
  const chinese = [...text].filter((item) => /[\u3400-\u9fff]/u.test(item)).length;
  const words = text.trim() ? text.trim().split(/\s+/u).length : 0;
  const lines = text ? text.split(/\r\n?|\n/u).length : 0;
  const paragraphs = text.trim() ? text.trim().split(/\r?\n\s*\r?\n/u).length : 0;
  return { characters, nonSpace, chinese, words, lines, paragraphs };
}
function developerTimestampResult() {
  const dev = state.devTools;
  if (dev.timestampMode === 'date') {
    const date = new Date(dev.timestampDate || '');
    if (!Number.isFinite(date.getTime())) return { ok: false, message: state.language === 'en' ? 'Enter a valid date and time.' : '请输入有效的日期和时间。', output: '' };
    const seconds = Math.floor(date.getTime() / 1000);
    return { ok: true, message: t('devDateToTimestamp'), output: seconds + ' s\n' + date.getTime() + ' ms' };
  }
  const raw = String(dev.timestampValue || '').trim();
  const value = raw ? Number(raw) : Date.now() / (dev.timestampUnit === 'ms' ? 1 : 1000);
  const milliseconds = dev.timestampUnit === 'ms' ? value : value * 1000;
  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) return { ok: false, message: state.language === 'en' ? 'Enter a valid timestamp.' : '请输入有效的时间戳。', output: '' };
  const formatted = new Intl.DateTimeFormat(state.language === 'en' ? 'en-US' : 'zh-CN', { dateStyle: 'medium', timeStyle: 'medium' }).format(date);
  return { ok: true, message: t('devTimestampToDate'), output: formatted + '\n' + localDateTimeValue(date) };
}
function devActionButton(action, label, extra = '') {
  const primary = ['json-format', 'json-compare', 'text-analyze', 'timestamp-convert'].includes(action);
  return '<button class="' + (primary ? 'primary' : 'secondary') + ' dev-action" type="button" data-dev-action="' + action + '" aria-label="' + escapeHtml(label) + '" ' + extra + '>' + escapeHtml(label) + '</button>';
}
function devInlineToggle(field, label, checked) {
  return '<label class="dev-inline-toggle"><input type="checkbox" data-dev-field="' + field + '" ' + (checked ? 'checked' : '') + '><span class="dev-toggle-track" aria-hidden="true"></span><span class="dev-toggle-label">' + escapeHtml(label) + '</span></label>';
}
function devPaneHead(title, actions = '') { return '<div class="dev-pane-head"><h3>' + escapeHtml(title) + '</h3><div class="dev-pane-actions">' + actions + '</div></div>'; }
function devStatus(message, error = false) { return message ? '<p class="dev-status ' + (error ? 'is-error' : 'is-success') + '">' + escapeHtml(message) + '</p>' : ''; }
function devHistoryIcon() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6.4"/><path d="M3.5 4.5v5h5"/><path d="M12 7.5v4.8l3 1.8"/></svg>'; }
function devRecordPreview(kind, item) {
  if (kind === 'text-stats') return String(item.text || '').replace(/\s+/g, ' ').slice(0, 44);
  if (kind === 'json-compare') return String(item.left || '').replace(/\s+/g, ' ').slice(0, 44);
  if (kind === 'timestamp') return String(item.output || '').split('\n')[0].slice(0, 44);
  return String(item.input || '').replace(/\s+/g, ' ').slice(0, 44);
}
function devRecordDetail(kind, item) {
  if (kind === 'text-stats') return String(item.text || '');
  if (kind === 'json-compare') return 'A:\n' + String(item.left || '') + '\n\nB:\n' + String(item.right || '');
  if (kind === 'timestamp') return String(item.output || '');
  return '输入:\n' + String(item.input || '') + '\n\n输出:\n' + String(item.output || '');
}
function devHistoryToggle(kind) {
  const records = state.devTools.records[kind] || [];
  const open = state.devTools.historyOpen === true;
  return '<div class="dev-history-toggle-wrap"><button class="display-history-toggle dev-history-toggle" type="button" data-toggle-dev-history aria-expanded="' + String(open) + '" aria-label="' + escapeHtml(t('devRecords')) + '" title="' + escapeHtml(t('devRecords')) + '">' + devHistoryIcon() + '</button><span class="dev-history-count">' + records.length + '</span></div>';
}
function devHistoryContent(kind) {
  const records = state.devTools.records[kind] || [];
  const list = records.length ? records.map((item) => '<div class="swipe-row dev-history-swipe-row" data-swipe-row><button class="dev-record history-item swipe-content" type="button" data-dev-record-kind="' + kind + '" data-dev-record="' + escapeHtml(item.id) + '" title="' + escapeHtml(devRecordDetail(kind, item)) + '"><strong>' + escapeHtml(devRecordLabel(kind, item)) + '</strong><small>' + escapeHtml(devRecordPreview(kind, item)) + '</small></button><button class="swipe-delete" data-delete-dev-record-kind="' + kind + '" data-delete-dev-record="' + escapeHtml(item.id) + '">' + (state.language === 'en' ? 'Delete' : '删除') + '</button></div>').join('') : '<p class="dev-history-empty">' + t('devNoRecords') + '</p>';
  const open = state.devTools.historyOpen === true;
  return '<div class="dev-history-content" ' + (open ? '' : 'hidden') + '><div class="dev-history-head"><strong>' + t('recentCalculations') + '</strong><button class="text-btn" data-clear-dev-records data-dev-record-kind="' + kind + '" ' + (records.length ? '' : 'disabled') + '>' + t('clear') + '</button></div><div class="dev-record-list">' + list + '</div></div>';
}
function devOutputPaneHead(kind, title, actions = '') {
  return '<div class="dev-pane-head dev-output-pane-head"><div class="dev-output-title"><h3>' + escapeHtml(title) + '</h3><div class="dev-history-anchor">' + devHistoryToggle(kind) + '</div></div><div class="dev-pane-actions">' + actions + '</div></div>';
}
function renderDeveloperJsonFormat() {
  const dev = state.devTools;
  return '<div class="dev-workbench dev-json-format"><div class="dev-editor-grid">' +
    '<section class="dev-pane">' + devPaneHead(t('devInput'), devInlineToggle('formatUnescape', t('devUnescape'), dev.formatUnescape) + devActionButton('json-example', t('devExample')) + devActionButton('json-clear', t('devClear'))) + '<textarea class="dev-code-editor" data-dev-field="formatInput" spellcheck="false" placeholder="{\n  &quot;name&quot;: &quot;OneBox&quot;\n}">' + escapeHtml(dev.formatInput) + '</textarea></section>' +
    '<section class="dev-pane dev-output-pane">' + devOutputPaneHead('json-format', t('devOutput'), devActionButton('json-minify', t('devMinify')) + devActionButton('json-expand-all', t('devExpandAll')) + devActionButton('json-collapse-all', t('devCollapseAll')) + devActionButton('dev-copy-output', t('devCopy'))) + devHistoryContent('json-format') + '<div class="dev-live-output" data-dev-live-output>' + developerLiveOutputMarkup() + '</div>' + '</section>' +
    '</div></div>';
}
function renderDeveloperCompare() {
  const dev = state.devTools;
  return '<div class="dev-workbench dev-json-compare"><div class="dev-compare-grid">' +
    '<section class="dev-pane">' + devPaneHead(t('devJsonA'), devActionButton('json-a-example', t('devExample')) + devActionButton('json-a-clear', t('devClear'))) + '<textarea class="dev-code-editor" data-dev-field="compareLeft" spellcheck="false" placeholder="{ &quot;version&quot;: 1 }">' + escapeHtml(dev.compareLeft) + '</textarea></section>' +
    '<section class="dev-pane">' + devPaneHead(t('devJsonB'), devActionButton('json-b-example', t('devExample')) + devActionButton('json-b-clear', t('devClear'))) + '<textarea class="dev-code-editor" data-dev-field="compareRight" spellcheck="false" placeholder="{ &quot;version&quot;: 2 }">' + escapeHtml(dev.compareRight) + '</textarea></section>' +
    '</div><section class="dev-pane dev-compare-result">' + devOutputPaneHead('json-compare', t('devOutput'), devActionButton('dev-copy-output', t('devCopy'))) + devHistoryContent('json-compare') + '<div class="dev-live-output" data-dev-live-output>' + developerLiveOutputMarkup() + '</div></section></div>';
}
function renderDeveloperStatsCards(stats) {
  return [['characters', t('devCharacters')], ['nonSpace', t('devNonSpace')], ['lines', t('devLines')], ['chinese', t('devChinese')], ['words', t('devWords')], ['paragraphs', t('devParagraphs')]].map(([key, label]) => '<div class="dev-stat-card"><strong>' + Number(stats[key] || 0).toLocaleString() + '</strong><span>' + label + '</span></div>').join('');
}
function renderDeveloperStats() {
  const dev = state.devTools;
  return '<div class="dev-workbench dev-text-stats"><div class="dev-editor-grid"><section class="dev-pane">' + devPaneHead(t('devInput'), devActionButton('text-clear', t('devClear'))) + '<textarea class="dev-text-editor" data-dev-field="textInput" spellcheck="true" placeholder="' + escapeHtml(state.language === 'en' ? 'Paste or type text here…' : '粘贴或输入文本…') + '">' + escapeHtml(dev.textInput) + '</textarea></section><section class="dev-pane dev-stats-pane">' + devOutputPaneHead('text-stats', t('devOutput')) + '<div class="dev-live-output" data-dev-live-output>' + developerLiveOutputMarkup() + '</div>' + devHistoryContent('text-stats') + '</section></div></div>';
}
function renderDeveloperTimestamp() {
  const dev = state.devTools;
  const timestampMode = '<div class="dev-segmented"><button type="button" class="' + (dev.timestampMode === 'timestamp' ? 'active' : '') + '" data-dev-action="timestamp-mode" data-dev-value="timestamp">' + t('devTimestampToDate') + '</button><button type="button" class="' + (dev.timestampMode === 'date' ? 'active' : '') + '" data-dev-action="timestamp-mode" data-dev-value="date">' + t('devDateToTimestamp') + '</button></div>';
  const input = dev.timestampMode === 'timestamp' ? '<div class="dev-timestamp-input-row"><input class="dev-plain-input" data-dev-field="timestampValue" inputmode="decimal" value="' + escapeHtml(dev.timestampValue) + '" placeholder="例如 1726905600"><select class="dev-plain-input" data-dev-field="timestampUnit"><option value="s" ' + (dev.timestampUnit === 's' ? 'selected' : '') + '>' + t('devSeconds') + '</option><option value="ms" ' + (dev.timestampUnit === 'ms' ? 'selected' : '') + '>' + t('devMilliseconds') + '</option></select></div>' : '<input class="dev-plain-input dev-date-input" data-dev-field="timestampDate" type="datetime-local" value="' + escapeHtml(dev.timestampDate) + '">';
  return '<div class="dev-workbench dev-timestamp"><section class="dev-pane dev-timestamp-card">' + devPaneHead(t('devInput'), devActionButton('timestamp-now', t('devNow')) + devActionButton('timestamp-clear', t('devClear'))) + timestampMode + input + '</section><section class="dev-pane dev-output-pane">' + devOutputPaneHead('timestamp', t('devOutput'), devActionButton('dev-copy-output', t('devCopy'))) + '<div class="dev-live-output" data-dev-live-output>' + developerLiveOutputMarkup() + '</div>' + devHistoryContent('timestamp') + '</section></div>';
}
function developerCompareResult() {
  const dev = state.devTools;
  if (!String(dev.compareLeft || '').trim() || !String(dev.compareRight || '').trim()) return { output: '', status: '' };
  try {
    const left = parseDeveloperJson(dev.compareLeft).value; const right = parseDeveloperJson(dev.compareRight).value; const changes = compareDeveloperJson(left, right);
    return { output: changes.length ? changes.map((item) => item.path + '\n− ' + item.before + '\n+ ' + item.after).join('\n\n') : '✓ ' + t('devSame'), status: changes.length ? t('devDifferent').replace('{count}', changes.length) : t('devSame') };
  } catch (error) { return { output: '', status: t('devInvalid') + (error?.message ? '：' + error.message : '') }; }
}
function syncDeveloperTimestampOutput() {
  const dev = state.devTools;
  const hasInput = dev.timestampMode === 'date' ? Boolean(dev.timestampDate) : Boolean(String(dev.timestampValue || '').trim());
  if (!hasInput) { dev.timestampOutput = ''; dev.timestampStatus = ''; return; }
  const result = developerTimestampResult(); dev.timestampOutput = result.output; dev.timestampStatus = result.message;
}
function developerLiveOutputMarkup() {
  const dev = state.devTools;
  if (dev.active === 'json-format') return renderDeveloperJsonTree() + devStatus(dev.formatStatus, dev.formatStatus.startsWith(t('devInvalid')));
  if (dev.active === 'json-compare') return '<pre class="dev-result-pre">' + escapeHtml(dev.compareOutput || t('devCompare')) + '</pre>' + devStatus(dev.compareStatus, dev.compareStatus.startsWith(t('devInvalid')));
  if (dev.active === 'text-stats') return '<div class="dev-stat-grid">' + renderDeveloperStatsCards(dev.textOutput || developerTextStats(dev.textInput)) + '</div>';
  return '<pre class="dev-result-pre">' + escapeHtml(dev.timestampOutput || t('devOutput')) + '</pre>' + devStatus(dev.timestampStatus, dev.timestampStatus.includes(state.language === 'en' ? 'valid' : '有效'));
}
function refreshDeveloperLiveOutput() {
  if (state.section !== 'tools' || state.tool !== 'dev') return;
  const host = workspace.querySelector('[data-dev-live-output]');
  if (host) host.innerHTML = developerLiveOutputMarkup();
}
function updateDeveloperLiveState(field) {
  const dev = state.devTools;
  if (dev.active === 'json-format' && (field === 'formatInput' || field === 'formatUnescape')) {
    if (!String(dev.formatInput || '').trim()) { dev.formatOutput = ''; dev.formatStatus = ''; dev.formatCollapsed = []; }
    else { const result = formatDeveloperJson(dev.formatInput, dev.formatCompact); dev.formatOutput = result.output; dev.formatStatus = result.message; dev.formatCollapsed = []; }
  } else if (dev.active === 'json-compare' && (field === 'compareLeft' || field === 'compareRight')) {
    const result = developerCompareResult(); dev.compareOutput = result.output; dev.compareStatus = result.status;
  } else if (dev.active === 'text-stats' && field === 'textInput') {
    dev.textOutput = developerTextStats(dev.textInput);
  } else if (dev.active === 'timestamp' && ['timestampValue', 'timestampUnit', 'timestampDate'].includes(field)) {
    syncDeveloperTimestampOutput();
  }
  saveDevTools(); refreshDeveloperLiveOutput();
}
function developerTool() {
  const modes = DEV_TOOL_IDS.map((id) => '<button type="button" class="dev-mode-tab ' + (state.devTools.active === id ? 'active' : '') + '" data-dev-mode="' + id + '">' + devModeLabel(id) + '</button>').join('');
  const mode = state.devTools.active;
  const content = mode === 'json-format' ? renderDeveloperJsonFormat() : mode === 'json-compare' ? renderDeveloperCompare() : mode === 'text-stats' ? renderDeveloperStats() : renderDeveloperTimestamp();
  const isFullscreen = state.devTools.fullscreen === true;
  const fullscreen = '<button type="button" class="dev-fullscreen-button ' + (isFullscreen ? 'active' : '') + '" data-dev-fullscreen aria-pressed="' + String(isFullscreen) + '" aria-label="' + escapeHtml(t(isFullscreen ? 'devExitFullscreen' : 'devFullscreen')) + '" title="' + escapeHtml(t(isFullscreen ? 'devExitFullscreen' : 'devFullscreen')) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (isFullscreen ? 'M9 4H4v5M20 9V4h-5M15 20h5v-5M4 15v5h5' : 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5') + '"/></svg></button>';
  return '<section class="dev-tools-page ' + (isFullscreen ? 'dev-is-fullscreen' : '') + '"><nav class="dev-mode-tabs" aria-label="' + escapeHtml(t('development')) + '">' + fullscreen + modes + '</nav><div class="dev-tools-body"><div class="dev-current-tool">' + content + '</div></div></section>';
}
function toggleDeveloperFullscreen(force) {
  const active = typeof force === 'boolean' ? force : !state.devTools.fullscreen;
  state.devTools.fullscreen = active;
  saveDevTools();
  render();
}
function runDeveloperAction(action, sourceEvent = null) {
  const dev = state.devTools;
  if (action === 'json-example' || action === 'json-a-example' || action === 'json-b-example') {
    const example = action === 'json-b-example' ? '{\n  "name": "OneBox",\n  "version": 2,\n  "features": ["calendar", "reader"]\n}' : '{\n  "name": "OneBox",\n  "version": 1,\n  "features": ["calendar"]\n}';
    if (action === 'json-a-example') dev.compareLeft = example; else if (action === 'json-b-example') dev.compareRight = example; else dev.formatInput = example;
    if (action === 'json-example') { const result = formatDeveloperJson(dev.formatInput, dev.formatCompact); dev.formatOutput = result.output; dev.formatStatus = result.message; dev.formatCollapsed = []; }
    else { const result = developerCompareResult(); dev.compareOutput = result.output; dev.compareStatus = result.status; }
  } else if (action === 'json-clear') dev.formatInput = '', dev.formatOutput = '', dev.formatStatus = '';
  else if (action === 'json-a-clear') dev.compareLeft = '', dev.compareOutput = '', dev.compareStatus = '';
  else if (action === 'json-b-clear') dev.compareRight = '', dev.compareOutput = '', dev.compareStatus = '';
  else if (action === 'json-format' || action === 'json-minify') {
    const compact = action === 'json-minify'; const result = formatDeveloperJson(dev.formatInput, compact); dev.formatCompact = compact; dev.formatOutput = result.output; dev.formatStatus = result.message; dev.formatCollapsed = [];
    if (result.ok) addDevRecord('json-format', { input: devRecordText(dev.formatInput), output: devRecordText(result.output), compact, unescape: dev.formatUnescape });
  } else if (action === 'json-compare') {
    try {
      const left = parseDeveloperJson(dev.compareLeft).value; const right = parseDeveloperJson(dev.compareRight).value; const changes = compareDeveloperJson(left, right); dev.compareOutput = changes.length ? changes.map((item) => item.path + '\n− ' + item.before + '\n+ ' + item.after).join('\n\n') : '✓ ' + t('devSame'); dev.compareStatus = changes.length ? t('devDifferent').replace('{count}', changes.length) : t('devSame');
      addDevRecord('json-compare', { left: devRecordText(dev.compareLeft), right: devRecordText(dev.compareRight), output: devRecordText(dev.compareOutput), status: dev.compareStatus });
    } catch (error) { dev.compareOutput = ''; dev.compareStatus = t('devInvalid') + (error?.message ? '：' + error.message : ''); }
  } else if (action === 'text-clear') dev.textInput = '', dev.textOutput = null;
  else if (action === 'text-analyze') { dev.textOutput = developerTextStats(dev.textInput); addDevRecord('text-stats', { text: devRecordText(dev.textInput, 30000), output: dev.textOutput }); }
  else if (action === 'timestamp-mode') { dev.timestampMode = sourceEvent?.target?.closest?.('[data-dev-value]')?.dataset?.devValue || dev.timestampMode; syncDeveloperTimestampOutput(); }
  else if (action === 'timestamp-now') { if (dev.timestampMode === 'date') dev.timestampDate = localDateTimeValue(new Date()); else dev.timestampValue = String(dev.timestampUnit === 'ms' ? Date.now() : Math.floor(Date.now() / 1000)); syncDeveloperTimestampOutput(); }
  else if (action === 'timestamp-clear') dev.timestampValue = '', dev.timestampDate = '', dev.timestampOutput = '', dev.timestampStatus = '';
  else if (action === 'timestamp-convert') { const result = developerTimestampResult(); dev.timestampOutput = result.output; dev.timestampStatus = result.message; if (result.ok) addDevRecord('timestamp', { mode: dev.timestampMode, unit: dev.timestampUnit, value: dev.timestampValue, date: dev.timestampDate, output: devRecordText(result.output), status: result.message }); }
  saveDevTools(); render();
}
function loadDeveloperRecord(kind, id) {
  const record = (state.devTools.records[kind] || []).find((item) => item.id === id);
  if (!record) return;
  state.devTools.active = kind;
  if (kind === 'json-format') Object.assign(state.devTools, { formatInput: record.input || '', formatOutput: record.output || '', formatCompact: record.compact === true, formatUnescape: record.unescape !== false, formatCollapsed: [], formatStatus: t('devValid') });
  if (kind === 'json-compare') Object.assign(state.devTools, { compareLeft: record.left || '', compareRight: record.right || '', compareOutput: record.output || '', compareStatus: record.status || '' });
  if (kind === 'text-stats') Object.assign(state.devTools, { textInput: record.text || '', textOutput: record.output || null });
  if (kind === 'timestamp') Object.assign(state.devTools, { timestampMode: record.mode === 'date' ? 'date' : 'timestamp', timestampUnit: record.unit === 'ms' ? 'ms' : 's', timestampValue: record.value || '', timestampDate: record.date || '', timestampOutput: record.output || '', timestampStatus: record.status || '' });
  saveDevTools(); render();
}
function developerCopyOutput() {
  const dev = state.devTools;
  const output = dev.active === 'json-format' ? dev.formatOutput : dev.active === 'json-compare' ? dev.compareOutput : dev.active === 'timestamp' ? dev.timestampOutput : JSON.stringify(dev.textOutput || developerTextStats(dev.textInput), null, 2);
  if (!output) return toast(state.language === 'en' ? 'There is no result to copy yet.' : '还没有可复制的结果。', 'error');
  navigator.clipboard?.writeText(output).then(() => toast(t('copied'))).catch(() => toast(state.language === 'en' ? 'Clipboard access was denied' : '浏览器不允许访问剪贴板，请手动复制', 'error'));
}

// Converter ------------------------------------------------------------------
const units = {
  length: { name: '长度 / Length', units: [['米', 'm', 1], ['千米', 'km', 1000], ['厘米', 'cm', .01], ['毫米', 'mm', .001], ['微米', 'μm', 1e-6], ['纳米', 'nm', 1e-9], ['英寸', 'in', .0254], ['英尺', 'ft', .3048], ['码', 'yd', .9144], ['英里', 'mi', 1609.344], ['海里', 'nmi', 1852]] },
  weight: { name: '重量 / Weight', units: [['克', 'g', 1], ['毫克', 'mg', .001], ['千克', 'kg', 1000], ['吨', 't', 1e6], ['斤', '斤', 500], ['磅', 'lb', 453.59237], ['盎司', 'oz', 28.349523125], ['英石', 'st', 6350.29318]] },
  area: { name: '面积 / Area', units: [['平方米', 'm²', 1], ['平方千米', 'km²', 1e6], ['平方厘米', 'cm²', 1e-4], ['平方毫米', 'mm²', 1e-6], ['公顷', 'ha', 1e4], ['亩', '亩', 2000 / 3], ['平方英尺', 'ft²', .09290304], ['平方码', 'yd²', .83612736], ['英亩', 'acre', 4046.8564224], ['平方英里', 'mi²', 2589988.110336]] },
  volume: { name: '体积 / Volume', units: [['升', 'L', 1], ['微升', 'μL', 1e-6], ['毫升', 'mL', .001], ['立方厘米', 'cm³', .001], ['立方米', 'm³', 1000], ['茶匙', 'tsp', .00492892159375], ['汤匙', 'tbsp', .01478676478125], ['杯', 'cup', .2365882365], ['品脱', 'pt', .473176473], ['夸脱', 'qt', .946352946], ['美制加仑', 'gal', 3.785411784]] },
  speed: { name: '速度 / Speed', units: [['米/秒', 'm/s', 1], ['厘米/秒', 'cm/s', .01], ['千米/秒', 'km/s', 1000], ['千米/时', 'km/h', 1 / 3.6], ['英尺/秒', 'ft/s', .3048], ['英里/时', 'mph', .44704], ['节', 'kn', .514444444]] },
  time: { name: '时间 / Time', units: [['纳秒', 'ns', 1e-9], ['微秒', 'μs', 1e-6], ['毫秒', 'ms', .001], ['秒', 's', 1], ['分钟', 'min', 60], ['小时', 'h', 3600], ['天', 'd', 86400], ['周', 'wk', 604800]] },
  data: { name: '数据 / Data', units: [['比特', 'bit', .125], ['字节', 'B', 1], ['千字节', 'kB', 1000], ['千字节', 'KiB', 1024], ['兆字节', 'MB', 1e6], ['兆字节', 'MiB', 1024 ** 2], ['吉字节', 'GB', 1e9], ['吉字节', 'GiB', 1024 ** 3], ['太字节', 'TB', 1e12], ['太字节', 'TiB', 1024 ** 4], ['拍字节', 'PB', 1e15]] },
  pressure: { name: '压强 / Pressure', units: [['帕斯卡', 'Pa', 1], ['千帕', 'kPa', 1000], ['兆帕', 'MPa', 1e6], ['巴', 'bar', 100000], ['标准大气压', 'atm', 101325], ['毫米汞柱', 'mmHg', 133.322387415], ['磅力/平方英寸', 'psi', 6894.757293168]] },
  energy: { name: '能量 / Energy', units: [['焦耳', 'J', 1], ['千焦', 'kJ', 1000], ['卡路里', 'cal', 4.184], ['千卡', 'kcal', 4184], ['瓦时', 'Wh', 3600], ['千瓦时', 'kWh', 3600000], ['电子伏', 'eV', 1.602176634e-19]] },
  power: { name: '功率 / Power', units: [['瓦', 'W', 1], ['千瓦', 'kW', 1000], ['兆瓦', 'MW', 1e6], ['马力', 'hp', 745.699871582]] },
  force: { name: '力 / Force', units: [['牛顿', 'N', 1], ['千牛', 'kN', 1000], ['千克力', 'kgf', 9.80665], ['磅力', 'lbf', 4.4482216152605]] },
  angle: { name: '角度 / Angle', units: [['弧度', 'rad', 1], ['度', '°', Math.PI / 180], ['百分度', 'grad', Math.PI / 200], ['角分', 'arcmin', Math.PI / 10800], ['角秒', 'arcsec', Math.PI / 648000]] },
  frequency: { name: '频率 / Frequency', units: [['赫兹', 'Hz', 1], ['千赫兹', 'kHz', 1000], ['兆赫兹', 'MHz', 1e6], ['吉赫兹', 'GHz', 1e9]] },
  torque: { name: '扭矩 / Torque', units: [['牛顿·米', 'N·m', 1], ['千克力·米', 'kgf·m', 9.80665], ['磅力·英尺', 'lbf·ft', 1.355817948]] },
  temperature: { name: '温度 / Temperature', units: [['摄氏度', '°C', 'C'], ['华氏度', '°F', 'F'], ['开尔文', 'K', 'K']] },
};
const conversion = { category: 'length', from: 0, to: 1, value: '1' };
function convertedValue() {
  const category = units[conversion.category]; const value = Number(conversion.value);
  if (!Number.isFinite(value)) return NaN;
  const from = category.units[conversion.from]; const to = category.units[conversion.to];
  if (conversion.category === 'temperature') {
    const celsius = from[2] === 'F' ? (value - 32) * 5 / 9 : from[2] === 'K' ? value - 273.15 : value;
    return to[2] === 'F' ? celsius * 9 / 5 + 32 : to[2] === 'K' ? celsius + 273.15 : celsius;
  }
  return value * from[2] / to[2];
}
function unitOptions(category, selected) {
  return category.units.map((unit, index) => '<option value="' + index + '" ' + (index === selected ? 'selected' : '') + '>' + unit[0] + ' (' + unit[1] + ')</option>').join('');
}
function conversionMarkup() {
  const category = units[conversion.category];
  const categories = Object.entries(units).map(([key, item]) => '<option value="' + key + '" ' + (key === conversion.category ? 'selected' : '') + '>' + item.name + '</option>').join('');
  return '<div class="converter-card"><div class="converter-category field"><select id="conversionCategory" aria-label="' + t('converterType') + '">' + categories + '</select></div><div class="conversion-layout">' +
    '<div class="conversion-pane conversion-source-pane"><label for="fromUnit">' + t('from') + '</label><select id="fromUnit" aria-label="' + t('from') + '">' + unitOptions(category, conversion.from) + '</select><input id="conversionValue" type="number" step="any" inputmode="decimal" value="' + escapeHtml(conversion.value) + '" aria-label="' + t('from') + '"></div>' +
    '<button class="swap" data-swap aria-label="' + t('swap') + '">⇄</button><div class="conversion-pane conversion-target-pane"><label for="toUnit">' + t('to') + '</label><select id="toUnit" aria-label="' + t('to') + '">' + unitOptions(category, conversion.to) + '</select><div class="conversion-result" aria-live="polite"><small>' + t('result') + '</small><strong>' + formatNumber(convertedValue()) + '</strong><span>' + category.units[conversion.to][1] + '</span><button class="conversion-copy" data-copy-conversion aria-label="' + t('copyResult') + '" title="' + t('copyResult') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/></svg></button></div></div></div><span class="copy-status sr-only" id="copyStatus" aria-live="polite"></span></div>';
}
function convert() { return '<section class="language-tool-card converter-panel"><div class="language-tool-head"><h2>' + t('unitConvert') + '</h2><p>' + t('convertDesc') + '</p></div>' + conversionMarkup() + '</section>'; }

// Translation ---------------------------------------------------------------
const languageOptions = [['auto', '自动检测 / Auto'], ['zh', '中文 / Chinese'], ['en', 'English'], ['ja', '日本語 / Japanese'], ['ko', '한국어 / Korean']];
const translateEndpoints = ['https://translate.argosopentech.com/translate', 'https://translate.astian.org/translate', 'https://libretranslate.com/translate'];
async function fetchWithTimeout(url, options, timeout = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(url, { ...options, signal: controller.signal }); } finally { clearTimeout(timer); }
}
async function fetchTextWithTimeout(url, options, timeout = 7000, externalSignal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const abortFromParent = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', abortFromParent, { once: true });
  }
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    return { response, text };
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', abortFromParent);
  }
}
function saveTranslationHistory() { saveStored(STORAGE.translationHistory, state.translationHistory.slice(0, 30)); }
function recordTranslation(input, result) {
  state.translation.result = result;
  state.translationHistory.unshift({ id: uid(), source: state.translation.source, target: state.translation.target, input, result, createdAt: Date.now() });
  saveTranslationHistory();
}
async function translateText() {
  const input = state.translation.input.trim();
  if (!input) return toast(state.language === 'en' ? 'Enter text to translate' : '请输入要翻译的内容', 'error');
  if (state.translation.source !== 'auto' && state.translation.source === state.translation.target) { recordTranslation(input, input); return render(); }
  state.translation.loading = true; state.translation.error = ''; render();
  try {
    let translated = '';
    for (const endpoint of translateEndpoints) {
      try {
        const response = await fetchWithTimeout(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ q: input, source: state.translation.source, target: state.translation.target, format: 'text' }) }, 4500);
        if (!response.ok) throw new Error();
        const data = await response.json(); translated = data.translatedText || data.translation || ''; if (translated) break;
      } catch { /* try next open instance */ }
    }
    if (!translated) {
      const source = state.translation.source === 'auto' ? (/^[\s\d\p{P}\p{S}]*[\u4e00-\u9fff]/u.test(input) ? 'zh-CN' : 'en') : state.translation.source;
      const target = state.translation.target === 'zh' ? 'zh-CN' : state.translation.target === 'auto' ? 'en' : state.translation.target;
      const fallbackUrl = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(input) + '&langpair=' + encodeURIComponent(source + '|' + target);
      const response = await fetchWithTimeout(fallbackUrl, { headers: { Accept: 'application/json' } }, 6000);
      if (response.ok) { const data = await response.json(); translated = data.responseData?.translatedText || ''; }
    }
    if (!translated) throw Error(state.language === 'en' ? 'Translation service unavailable' : '翻译服务暂时不可用');
    recordTranslation(input, translated);
  } catch (error) { state.translation.error = error.message; }
  finally { state.translation.loading = false; render(); }
}
function translateView() {
  const history = state.translationHistory.length
    ? state.translationHistory.slice(0, 12).map((item) => '<div class="swipe-row translation-swipe-row" data-swipe-row><button class="translation-history-item swipe-content" data-translation-history="' + escapeHtml(item.id) + '"><b>' + escapeHtml(item.input.slice(0, 70)) + '</b><small>' + escapeHtml(item.result.slice(0, 100)) + '</small></button><button class="swipe-delete" data-delete-translation="' + escapeHtml(item.id) + '">' + (state.language === 'en' ? 'Delete' : '删除') + '</button></div>').join('')
    : '<p class="empty compact">' + t('noHistory') + '</p>';
  const options = (selected) => languageOptions.map(([value, label]) => '<option value="' + value + '" ' + (selected === value ? 'selected' : '') + '>' + label + '</option>').join('');
  const result = state.translation.loading ? (state.language === 'en' ? 'Translating…' : '翻译中…') : state.translation.result || (state.language === 'en' ? 'Translate' : '翻译');
  const resultMarkup = state.translation.result
    ? '<span class="translation-result-text">' + escapeHtml(result) + '</span><button class="translation-copy-button" data-copy-translation aria-label="' + t('copyResult') + '" title="' + t('copyResult') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/></svg></button>'
    : '<span class="translation-result-text">' + escapeHtml(result) + '</span>';
  return '<div class="translation-layout"><div class="translation-card"><div class="translation-toolbar"><div class="field field-inline"><label for="translationSource">' + t('source') + '</label><select id="translationSource">' + options(state.translation.source) + '</select></div><button class="swap" data-swap-language aria-label="' + t('swap') + '">⇄</button><div class="field field-inline"><label for="translationTarget">' + t('target') + '</label><select id="translationTarget">' + options(state.translation.target) + '</select></div></div>' +
    '<div class="translation-content-grid"><div class="translation-input-pane"><div class="field"><label for="translationInput">' + t('translationInput') + '</label><div class="translation-input-wrap"><textarea id="translationInput" maxlength="5000" placeholder="' + (state.language === 'en' ? 'Type or paste text here…' : '输入或粘贴文字…') + '">' + escapeHtml(state.translation.input) + '</textarea><div class="translation-input-actions"><button class="input-action" data-translate-submit ' + (state.translation.loading ? 'disabled' : '') + ' aria-label="' + t('translateNow') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 16-8-5 16-3-6-8-2Z"/><path d="m12 14 4-4"/></svg></button></div></div></div></div><div class="translation-result-pane"><div class="translation-pane-title">' + t('translationResult') + '</div><div class="translation-result translation-result-panel"><div class="translation-result-head"><button class="display-history-toggle translation-history-toggle" data-toggle-translation-history aria-expanded="' + (state.translationHistoryOpen ? 'true' : 'false') + '" aria-label="' + t('translationHistory') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6.4"/><path d="M3.5 4.5v5h5"/><path d="M12 7.5v4.8l3 1.8"/></svg></button></div><div class="translation-result-current ' + (state.translation.result ? '' : 'placeholder') + '">' + resultMarkup + '</div><div class="translation-result-history" ' + (state.translationHistoryOpen ? '' : 'hidden') + '><div class="display-history-head"><span>' + t('translationHistory') + '</span><button class="text-btn" data-clear-translation-history ' + (state.translationHistory.length ? '' : 'disabled') + '>' + t('clear') + '</button></div><div class="translation-history-list">' + history + '</div></div></div></div></div>' + (state.translation.error ? '<p class="inline-alert">' + escapeHtml(state.translation.error) + '</p>' : '') + '</div></div>';
}
function translateConvertView() {
  return '<div class="translate-convert-page"><section class="language-tool-card translation-panel"><div class="language-tool-head"><h2>' + t('translate') + '</h2><p>' + t('translateDesc') + '</p></div>' + translateView() + '</section>' + convert() + '</div>';
}

// Notifications and calendar reminders -------------------------------------
function saveNotifications() { saveStored(STORAGE.notifications, state.notifications.slice(0, 80)); }
let alertAudioContext = null;
function unlockAlertAudio() {
  if (alertAudioContext || !window.AudioContext) return;
  try { alertAudioContext = new AudioContext(); alertAudioContext.resume().catch(() => {}); } catch { alertAudioContext = null; }
}
function playAlertChime() {
  if (!alertAudioContext) return;
  try {
    const oscillator = alertAudioContext.createOscillator(); const gain = alertAudioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(880, alertAudioContext.currentTime); oscillator.frequency.exponentialRampToValueAtTime(660, alertAudioContext.currentTime + .22);
    gain.gain.setValueAtTime(.001, alertAudioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.18, alertAudioContext.currentTime + .02); gain.gain.exponentialRampToValueAtTime(.001, alertAudioContext.currentTime + .48);
    oscillator.connect(gain).connect(alertAudioContext.destination); oscillator.start(); oscillator.stop(alertAudioContext.currentTime + .5);
  } catch { /* audio is optional */ }
}
function eventMatchesDay(event, key) {
  const weekday = (dateFromKey(key).getDay() + 6) % 7;
  if (!event.repeat || event.repeat === 'once') return false;
  if (event.repeat === 'daily') return true;
  if (event.repeat === 'workdays') return isWorkdayKey(key);
  if (event.repeat === 'restdays') return !isWorkdayKey(key);
  return event.repeat === 'weekly' && (event.weekdays || [weekday]).map(Number).includes(weekday);
}
function syncAgendaReminders() {
  const agendaItems = [];
  Object.entries(state.events || {}).forEach(([day, events]) => (events || []).forEach((event) => {
    if (!event.time) return;
    if (!event.repeat || event.repeat === 'once') {
      const at = new Date(day + 'T' + event.time).getTime();
      if (Number.isFinite(at)) agendaItems.push({ id: 'agenda:' + day + ':' + event.id, text: event.title, at, read: true, delivered: false, source: 'agenda', eventId: event.id });
      return;
    }
    for (let offset = 0; offset < 16; offset += 1) {
      const candidate = new Date(Date.now() + offset * 86400000); const key = dateKey(candidate);
      if (!eventMatchesDay(event, key)) continue;
      const at = new Date(key + 'T' + event.time).getTime();
      if (Number.isFinite(at) && at > Date.now() - 60000) agendaItems.push({ id: 'agenda:' + event.id + ':' + key, text: event.title, at, read: true, delivered: false, source: 'agenda', eventId: event.id });
    }
  }));
  const reminderIds = new Set(agendaItems.map((item) => item.id));
  state.notifications = state.notifications.filter((item) => item.source !== 'agenda' || reminderIds.has(item.id));
  agendaItems.forEach((item) => {
    const existing = state.notifications.find((entry) => entry.id === item.id);
    if (existing) { existing.text = item.text; existing.at = item.at; }
    else if (item.at > Date.now() - 86400000) state.notifications.push(item);
  });
  saveNotifications();
}
let notificationTimer = null;
function scheduleNotificationCheck() {
  clearTimeout(notificationTimer);
  const now = Date.now();
  const next = state.notifications.filter((item) => !item.delivered && Number.isFinite(Number(item.at)) && Number(item.at) > now).sort((a, b) => Number(a.at) - Number(b.at))[0];
  if (!next) return;
  notificationTimer = setTimeout(checkNotifications, Math.min(Math.max(Number(next.at) - now, 250), 2147483647));
}
async function showNativeNotification(item) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const registration = await navigator.serviceWorker?.ready;
    const options = { body: item.text, tag: item.id, icon: 'icons/bell-192.png', badge: 'icons/bell-192.png', renotify: true, silent: false, requireInteraction: true, timestamp: Number(item.at) || Date.now(), data: { notificationId: item.id } };
    if (registration?.showNotification) await registration.showNotification('OneBox', options);
    else new Notification('OneBox', options);
  } catch { /* browser blocked notifications */ }
}
function checkNotifications() {
  syncAgendaReminders();
  const due = state.notifications.filter((item) => !item.delivered && item.at && item.at <= Date.now());
  due.forEach((item) => {
    item.delivered = true; item.read = false; showNativeNotification(item); playAlertChime(); toast(item.text);
  });
  if (due.length) saveNotifications();
  updateNotificationBadge();
  if (state.notificationOpen) renderNotifications();
  scheduleNotificationCheck();
}
function updateNotificationBadge() {
  const count = state.notifications.filter((item) => !item.read).length;
  const badge = $('#notificationCount');
  if (badge) { badge.textContent = count > 99 ? '99+' : String(count); badge.hidden = count === 0; }
}
function renderNotifications() {
  const panel = $('#notificationPanel');
  const items = [...state.notifications].sort((a, b) => Number(b.at) - Number(a.at));
  const list = items.length ? items.map(notificationRowMarkup).join('') : '<p class="empty compact">' + t('noNotifications') + '</p>';
  panel.innerHTML = '<div class="notification-dialog-card" role="dialog" aria-modal="true" aria-label="' + t('notifications') + '"><div class="dialog-head notification-head"><h2>' + t('notifications') + '</h2><div class="notification-head-actions"><button class="text-btn" data-mark-notifications-read>' + t('markRead') + '</button><button class="icon-btn small" data-close-notifications aria-label="' + t('close') + '">×</button></div></div><div class="notification-list">' + list + '</div></div>';
  panel.hidden = false;
}
function closeNotifications() {
  state.notificationOpen = false;
  const panel = $('#notificationPanel'); if (panel) panel.hidden = true;
  $('#notifyBtn')?.setAttribute('aria-expanded', 'false');
}
function isStandalonePwa() { return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true; }
function isIosDevice() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function isIosSafariBrowser() {
  const userAgent = navigator.userAgent || '';
  return isIosDevice() && !isStandalonePwa() && /Safari\//.test(userAgent) && !/(CriOS|FxiOS|EdgiOS|OPiOS|GSA\/)/.test(userAgent);
}
function isIosSafariReaderSurfaceActive() {
  return isIosSafariBrowser() && state.section === 'tools' && state.tool === 'reader' && state.readerMode === 'reading' && state.readerImmersive;
}
function syncOneBoxViewportMetrics() {
  const visualViewport = window.visualViewport;
  const height = Math.max(1, Math.round(visualViewport?.height || window.innerHeight || document.documentElement.clientHeight));
  const top = Math.max(0, Math.round(visualViewport?.offsetTop || 0));
  const root = document.documentElement;
  root.style.setProperty('--onebox-visual-height', height + 'px');
  root.style.setProperty('--onebox-visual-top', top + 'px');
  root.classList.toggle('ios-safari-browser', isIosSafariBrowser());
}
function refreshOneBoxViewportMetrics() {
  syncOneBoxViewportMetrics();
  requestAnimationFrame(() => syncOneBoxViewportMetrics());
  window.setTimeout(() => syncOneBoxViewportMetrics(), 120);
  window.setTimeout(() => syncOneBoxViewportMetrics(), 420);
}
function syncHomeFeedSurface() {
  const main = document.querySelector('main');
  const panel = workspace.querySelector('.feed-panel');
  if (!main || !panel || state.section !== 'home') return;
  if (window.innerWidth > 760 || isStandalonePwa()) {
    panel.style.removeProperty('min-height');
    return;
  }
  const mainRect = main.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  const panelLayoutTop = panelRect.top - mainRect.top + main.scrollTop;
  const viewportHeight = Math.max(main.clientHeight, window.innerHeight || 0, Math.round(window.visualViewport?.height || 0));
  const availableHeight = Math.max(0, viewportHeight - panelLayoutTop);
  if (availableHeight > 0) panel.style.minHeight = Math.ceil(availableHeight) + 'px';
}
function scheduleHomeFeedSurfaceSync() {
  requestAnimationFrame(syncHomeFeedSurface);
  window.setTimeout(syncHomeFeedSurface, 120);
  window.setTimeout(syncHomeFeedSurface, 420);
}
document.documentElement.classList.toggle('standalone-pwa', isStandalonePwa());
syncOneBoxViewportMetrics();
window.addEventListener('resize', syncOneBoxViewportMetrics, { passive: true });
window.visualViewport?.addEventListener('resize', syncOneBoxViewportMetrics, { passive: true });
window.visualViewport?.addEventListener('scroll', syncOneBoxViewportMetrics, { passive: true });
window.addEventListener('resize', scheduleReaderPageLayout, { passive: true });
window.visualViewport?.addEventListener('resize', scheduleReaderPageLayout, { passive: true });
window.addEventListener('orientationchange', scheduleReaderPageLayout, { passive: true });
window.addEventListener('resize', syncHomeFeedSurface, { passive: true });
window.visualViewport?.addEventListener('resize', syncHomeFeedSurface, { passive: true });
async function requestNotifications() {
  if (!('Notification' in window)) return toast(state.language === 'en' ? 'This browser does not support notifications' : '当前浏览器不支持通知', 'error');
  if (isIosDevice() && !isStandalonePwa()) return toast(state.language === 'en' ? 'Add OneBox to the Home Screen before enabling iPhone notifications' : '请先将 OneBox 添加到主屏幕，再开启 iPhone 消息通知', 'error');
  const permission = await Notification.requestPermission();
  state.notificationPreference = permission === 'granted' ? 'allow' : permission === 'denied' ? 'deny' : state.notificationPreference;
  saveStored(STORAGE.notificationPreference, state.notificationPreference);
  if (permission === 'granted') await showNativeNotification({ id: 'permission-test', text: state.language === 'en' ? 'OneBox notifications are enabled.' : 'OneBox 消息通知已开启。' });
  toast(permission === 'granted' ? (state.language === 'en' ? 'Notifications enabled' : '通知已开启') : (state.language === 'en' ? 'Notification permission was not granted' : '通知权限未开启'), permission === 'granted' ? 'info' : 'error');
  if (state.settingsOpen) renderSettings();
}
function notificationPermissionText() {
  if (!('Notification' in window)) return state.language === 'en' ? 'Not supported by this browser' : '当前浏览器不支持';
  const permission = (state.language === 'en' ? 'Permission: ' : '权限：') + Notification.permission;
  return isIosDevice() && !isStandalonePwa() ? permission + (state.language === 'en' ? ' · Add to Home Screen first' : ' · 请先添加到主屏幕') : permission;
}

// GitHub Device Flow and private Gist sync ----------------------------------
function saveGithub() {
  saveStored(STORAGE.github, state.github);
  // Keep authorization independent of delayed full snapshots and asset caches.
  void oneBoxDbPut('snapshot', 'github-auth', { value: JSON.stringify(state.github), savedAt: Date.now() });
}
const githubResponseTokens = new WeakMap();
const githubDetailedGists = new WeakSet();
let githubRateLimitUntil = 0;
const GITHUB_RATE_LIMIT_STORAGE_KEY = 'onebox-github-rate-limit-until';
let githubSyncDismissTimer = 0;
function activeGithubRateLimitUntil() {
  const now = Date.now();
  let storedUntil = 0;
  try { storedUntil = Number(localStorage.getItem(GITHUB_RATE_LIMIT_STORAGE_KEY)) || 0; } catch { /* storage can be unavailable in private mode */ }
  githubRateLimitUntil = Math.max(githubRateLimitUntil, storedUntil);
  if (githubRateLimitUntil <= now) {
    githubRateLimitUntil = 0;
    try { localStorage.removeItem(GITHUB_RATE_LIMIT_STORAGE_KEY); } catch { /* memory cooldown still works */ }
  }
  return githubRateLimitUntil;
}
function saveGithubRateLimitUntil(until) {
  githubRateLimitUntil = until;
  try { localStorage.setItem(GITHUB_RATE_LIMIT_STORAGE_KEY, String(until)); } catch { /* memory cooldown still works */ }
}
function githubRateLimitError(resource = '', remaining = '') {
  const waitMinutes = Math.max(1, Math.ceil((activeGithubRateLimitUntil() - Date.now()) / 60000));
  const coreExhausted = resource === 'core' && remaining === '0';
  const error = Error(state.language === 'en'
    ? (coreExhausted ? 'GitHub REST API core quota is exhausted (0 requests remaining). It resets in about ' : 'GitHub temporarily limited sync requests. Please retry in about ') + waitMinutes + ' minute(s). OneBox has paused further requests until then.'
    : (coreExhausted ? 'GitHub REST API 主配额已用尽（剩余 0 次），约 ' : 'GitHub 暂时限制了同步请求，约 ') + waitMinutes + ' 分钟后重置。OneBox 已暂停后续请求，避免继续触发限流。');
  error.code = 'github-rate-limit';
  return error;
}
function githubHeaders(withBody = false) {
  const headers = { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + state.github.token, 'X-GitHub-Api-Version': '2022-11-28' };
  if (withBody) headers['Content-Type'] = 'application/json';
  return headers;
}
async function githubApiFetch(url, options = {}) {
  if (activeGithubRateLimitUntil() > Date.now()) throw githubRateLimitError();
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const controller = new AbortController();
      const abort = () => controller.abort(options.signal?.reason);
      if (options.signal?.aborted) abort();
      else options.signal?.addEventListener('abort', abort, { once: true });
      const deadline = setTimeout(() => controller.abort(), 45000);
      let response;
      try { response = await fetch(url, { cache: 'no-store', ...options, signal: controller.signal }); }
      finally { clearTimeout(deadline); options.signal?.removeEventListener('abort', abort); }
      const authorization = new Headers(options.headers).get('Authorization') || '';
      githubResponseTokens.set(response, authorization.replace(/^Bearer /i, ''));
      // Rate-limit responses are final for this request. Retrying them adds
      // avoidable load and delays the useful reset-time message.
      if (response.status === 429) return response;
      const retryableStatus = [408, 425, 500, 502, 503, 504].includes(response.status);
      if (!retryableStatus || attempt === 2) return response;
      const retryAfter = Number(response.headers.get('Retry-After'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 900 * (attempt + 1));
    } catch (error) {
      lastError = error;
      if (options.signal?.aborted) throw error;
      if (attempt === 2) {
        if (error?.name === 'AbortError') throw Error(state.language === 'en' ? 'GitHub API timed out. Please check your connection and retry.' : 'GitHub API 请求超时，请检查网络后重试。');
        const failed = Error(githubBrowserError(error));
        failed.githubRequestMethod = options.method || 'GET';
        throw failed;
      }
      await sleep(900 * (attempt + 1));
    }
  }
  throw lastError || Error(state.language === 'en' ? 'GitHub request failed' : 'GitHub 请求失败');
}
const GITHUB_SYNC_CHUNK_CHARS = 700000;
const GITHUB_SYNC_EXCLUDED_STORAGE_KEYS = new Set([STORAGE.github, STORAGE.githubAgreement, STORAGE.githubSyncSelection, STORAGE.readerCloudAgreement, STORAGE.readerProgress, STORAGE.homeFeeds, STORAGE.library, STORAGE.devTools, STORAGE.homeFeedActive, STORAGE.homeFeedVisibilityMigration, STORAGE.toolActive]);
function isSyncableStorageKey(key) {
  return String(key || '').startsWith('onebox.')
    && !GITHUB_SYNC_EXCLUDED_STORAGE_KEYS.has(key)
    && !String(key).startsWith(STORAGE.holidays + '.');
}
function syncStorageSnapshot(selection = state.githubSyncSelection) {
  const values = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!isSyncableStorageKey(key) || !githubSyncStorageKeyEnabled(key, selection)) continue;
    const value = localStorage.getItem(key);
    if (value !== null) values[key] = value;
  }
  return values;
}
function syncAssetKey(value) {
  return encodeURIComponent(String(value || '')).replace(/%/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '_').slice(0, 80) || 'book';
}
async function syncBytes(value) {
  if (!value) return null;
  if (value instanceof Blob) return new Uint8Array(await value.arrayBuffer());
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return null;
}
async function syncChunkBase64(bytes) {
  const chunks = [];
  const byteChunkSize = Math.floor(GITHUB_SYNC_CHUNK_CHARS / 4) * 3;
  for (let offset = 0; offset < bytes.length; offset += byteChunkSize) {
    chunks.push(readerBytesToBase64(bytes.subarray(offset, Math.min(bytes.length, offset + byteChunkSize))));
    if (chunks.length % 3 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return chunks;
}
async function syncMapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(items.length, Math.max(1, Number(limit) || 1));
  await Promise.all(Array.from({ length: workerCount }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index], index);
    }
  }));
  return results;
}
async function syncBytesDigest(bytes) {
  if (!globalThis.crypto?.subtle || !bytes?.byteLength) return '';
  try {
    const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes));
    return Array.from(digest, (value) => value.toString(16).padStart(2, '0')).join('');
  } catch { return ''; }
}
async function syncTextDigest(value) {
  return syncBytesDigest(new TextEncoder().encode(String(value || '')));
}
function syncCanReuseAsset(entry, digest, size, type, gist) {
  return Boolean(digest && entry?.sha256 === digest && Number(entry.size) === Number(size)
    && (!type || entry.type === type) && Array.isArray(entry.files) && entry.files.length
    && entry.files.every((name) => typeof name === 'string' && Boolean(gist?.files?.[name])));
}
async function buildReaderSyncAssets(existingRemote = null, existingGist = null, onProgress = null) {
  const files = {};
  const books = {};
  let libraryChanged = false;
  const sourceBooks = state.library.filter((book) => book?.id);
  let completed = 0;
  await syncMapLimit(sourceBooks, 2, async (book) => {
    const key = syncAssetKey(book.id);
    let binary = null;
    if (book.type === 'md') {
      if (typeof book.content !== 'string') throw Error((state.language === 'en' ? 'Markdown document is missing on this device: ' : '本机缺少 Markdown 文档：') + book.name);
      binary = new TextEncoder().encode(book.content);
    } else {
      const storedBinary = await oneBoxDbGet('books', book.id);
      binary = await syncBytes(storedBinary);
      if (!binary?.length) throw Error((state.language === 'en' ? 'Book file is missing on this device: ' : '本机缺少书籍文件：') + book.name);
    }
    if (book.syncFileMissing) { delete book.syncFileMissing; libraryChanged = true; }
    const digest = await syncBytesDigest(binary);
    const existingEntry = existingRemote?.readerFiles?.books?.[book.id];
    if (syncCanReuseAsset(existingEntry, digest, binary.byteLength, book.type, existingGist)) books[book.id] = existingEntry;
    else {
      const chunks = await syncChunkBase64(binary);
      const names = chunks.map((content, index) => {
        const name = 'onebox-book-' + key + '-' + index + '.b64'; files[name] = content; return name;
      });
      books[book.id] = { type: book.type, size: binary.byteLength, files: names, ...(digest ? { sha256: digest } : {}) };
    }
    let cover = await oneBoxDbGet('book-covers', book.id);
    if (!cover && book.type === 'md') cover = readerMarkdownCover(book.content);
    if (!cover && book.type === 'epub' && binary) cover = await epubCoverData(binary);
    if (typeof cover === 'string' && cover) {
      const coverDigest = await syncTextDigest(cover);
      const existingBook = existingEntry;
      const reuseCover = Boolean(coverDigest && existingBook?.coverSha256 === coverDigest && existingGist?.files?.[existingBook.cover]);
      const name = reuseCover ? existingBook.cover : 'onebox-book-' + key + '.cover';
      if (!reuseCover) files[name] = cover;
      books[book.id] ||= {};
      books[book.id].cover = name;
      if (coverDigest) books[book.id].coverSha256 = coverDigest;
      if (await oneBoxDbPut('book-covers', book.id, cover) && book.hasCover !== true) { book.hasCover = true; libraryChanged = true; }
    } else {
      if (book.hasCover === true) { book.hasCover = false; libraryChanged = true; }
      if (books[book.id]?.cover) {
        const { cover: _cover, coverSha256: _coverSha256, ...bookEntry } = books[book.id];
        books[book.id] = bookEntry;
      }
    }
    completed += 1;
    onProgress?.(completed, sourceBooks.length, 'reading');
  });
  if (libraryChanged) saveLibrary();
  return { files, manifest: { version: 1, books } };
}
function ticketWalletSyncImageIds(tickets = state.ticketWallet, memories = state.ticketWalletMemories) {
  return [...new Set([...(Array.isArray(tickets) ? tickets : []).map((item) => item?.sourceImageId), ...Object.values(memories || {}).map((item) => item?.imageId)].filter((id) => typeof id === 'string' && id))];
}
function ticketWalletSyncStorageValue(storage, key, fallback) {
  try { return JSON.parse(storage?.[key]) ?? fallback; } catch { return fallback; }
}
function ticketWalletRemoteImageIds(remote) {
  return ticketWalletSyncImageIds(ticketWalletSyncStorageValue(remote?.storage, STORAGE.ticketWallet, []), ticketWalletSyncStorageValue(remote?.storage, STORAGE.ticketWalletMemories, {}));
}
async function buildTicketWalletSyncAssets(existingRemote = null, existingGist = null, onProgress = null) {
  const files = {}, images = {};
  const imageIds = ticketWalletSyncImageIds();
  let completed = 0;
  await syncMapLimit(imageIds, 3, async (id) => {
    const stored = await oneBoxDbGet('ticket-images', id);
    const bytes = await syncBytes(stored?.blob);
    if (!bytes?.length) throw Error(state.language === 'en' ? 'A wallet original is missing on this device. Restore it before uploading.' : '本机缺少卡包原件，请先从保存原件的设备上传并恢复后再同步。');
    const type = stored.type || stored.blob.type || 'application/octet-stream';
    const digest = await syncBytesDigest(bytes);
    const existingEntry = existingRemote?.ticketWalletFiles?.images?.[id];
    if (syncCanReuseAsset(existingEntry, digest, bytes.byteLength, type, existingGist)) images[id] = existingEntry;
    else {
      const chunks = await syncChunkBase64(bytes);
      const names = chunks.map((content, index) => {
        const name = 'onebox-ticket-' + syncAssetKey(id) + '-' + index + '.b64';
        files[name] = content; return name;
      });
      images[id] = { name: stored.name || '', type, size: bytes.byteLength, files: names, ...(digest ? { sha256: digest } : {}) };
    }
    completed += 1;
    onProgress?.(completed, imageIds.length, 'wallet');
  });
  return { files, manifest: { version: 1, images } };
}
async function readTicketWalletSyncAsset(entry, gist) {
  if (!Array.isArray(entry?.files) || !entry.files.length || entry.files.some((name) => !gist?.files?.[name])) throw Error(state.language === 'en' ? 'GitHub wallet original is incomplete' : 'GitHub 卡包原件文件不完整');
  const chunks = await Promise.all(entry.files.map((name) => githubFileContent(gist.files[name])));
  if (chunks.some((chunk) => typeof chunk !== 'string' || !chunk)) throw Error(state.language === 'en' ? 'Could not read wallet original' : '卡包原件读取失败');
  const byteChunks = await syncDecodeBase64Chunks(chunks);
  const total = byteChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new Uint8Array(total);
  let offset = 0;
  byteChunks.forEach((chunk) => { bytes.set(chunk, offset); offset += chunk.length; });
  const expectedSize = Number(entry.size);
  if (!bytes.length || !Number.isFinite(expectedSize) || expectedSize <= 0) throw Error(state.language === 'en' ? 'Wallet original has invalid size metadata' : '卡包原件清单中的大小信息无效');
  let actualDigest = '';
  if (entry.sha256) {
    actualDigest = await syncBytesDigest(bytes);
    if (actualDigest && actualDigest.toLowerCase() !== String(entry.sha256).toLowerCase()) {
      throw Error(state.language === 'en' ? 'Wallet original checksum does not match the backup' : '卡包原件校验值与备份不一致');
    }
  }
  if (bytes.length !== expectedSize && (!entry.sha256 || !actualDigest)) {
    throw Error(state.language === 'en'
      ? 'Wallet original is incomplete: expected ' + expectedSize + ' bytes, received ' + bytes.length
      : '卡包原件数据不完整：应为 ' + expectedSize + ' 字节，实际读取 ' + bytes.length + ' 字节');
  }
  return bytes;
}
async function verifyTicketWalletSyncAssets(remote, gist) {
  const images = remote?.ticketWalletFiles?.images;
  if (!images) return; // Older backups contain ticket metadata only.
  for (const id of ticketWalletRemoteImageIds(remote)) await readTicketWalletSyncAsset(images[id], gist);
}
async function restoreTicketWalletSyncAssets(remote, gist, onProgress = null) {
  const images = remote?.ticketWalletFiles?.images;
  const imageIds = ticketWalletRemoteImageIds(remote);
  if (!images) return { missingIds: imageIds };
  let completed = 0;
  const writes = await syncMapLimit(imageIds, 3, async (id) => {
    try {
      const entry = images[id];
      const bytes = await readTicketWalletSyncAsset(entry, gist);
      return { id, value: { blob: new Blob([bytes], { type: entry.type || 'application/octet-stream' }), name: entry.name || '', type: entry.type || 'application/octet-stream', savedAt: Date.now() } };
    } catch (error) {
      if (error?.code === 'github-auth-expired') throw error;
      return { id, error };
    } finally {
      completed += 1;
      onProgress?.(completed, imageIds.length);
    }
  });
  const missingIds = writes.filter((item) => item.error).map((item) => item.id);
  await syncMapLimit(writes.filter((item) => !item.error), 3, async ({ id, value }) => {
    try {
      if (!await oneBoxDbPut('ticket-images', id, value)) throw Error(state.language === 'en' ? 'Could not save wallet original on this device' : '无法在本机保存卡包原件，请检查可用空间后重试');
      const cached = ticketWalletImageCache.get(id);
      if (cached?.src) URL.revokeObjectURL(cached.src);
      ticketWalletImageCache.delete(id);
    } catch (error) {
      if (error?.code === 'github-auth-expired') throw error;
      missingIds.push(id);
    }
  });
  return { missingIds: [...new Set(missingIds)] };
}
function mergeTicketWalletSyncStorage(first = {}, second = {}) {
  const merged = { ...first, ...second };
  const has = (key) => typeof first?.[key] === 'string' || typeof second?.[key] === 'string';
  const read = (storage, key, fallback) => ticketWalletSyncStorageValue(storage, key, fallback);
  const deleted = { ...read(first, STORAGE.ticketWalletDeleted, {}) };
  Object.entries(read(second, STORAGE.ticketWalletDeleted, {})).forEach(([id, at]) => { deleted[id] = Math.max(Number(deleted[id]) || 0, Number(at) || 0); });
  if (has(STORAGE.ticketWalletDeleted)) merged[STORAGE.ticketWalletDeleted] = JSON.stringify(deleted);
  if (has(STORAGE.ticketWallet)) {
    const records = new Map();
    for (const storage of [first, second]) {
      const tickets = read(storage, STORAGE.ticketWallet, []);
      for (const ticket of Array.isArray(tickets) ? tickets : []) {
        if (!ticket?.id) continue;
        const existing = records.get(ticket.id);
        if (!existing || Number(ticket.updatedAt || ticket.createdAt || 0) >= Number(existing.updatedAt || existing.createdAt || 0)) records.set(ticket.id, ticket);
      }
    }
    merged[STORAGE.ticketWallet] = JSON.stringify([...records.values()].filter((record) => !deleted[record.id] || Number(record.updatedAt || record.createdAt || 0) > deleted[record.id]));
  }
  if (has(STORAGE.ticketWalletMemories)) {
    const memories = { ...read(first, STORAGE.ticketWalletMemories, {}) };
    Object.entries(read(second, STORAGE.ticketWalletMemories, {})).forEach(([key, memory]) => { if (!memories[key] || Number(memory?.updatedAt || 0) >= Number(memories[key]?.updatedAt || 0)) memories[key] = memory; });
    merged[STORAGE.ticketWalletMemories] = JSON.stringify(memories);
  }
  if (has(STORAGE.ticketWalletDisplayOrder)) {
    const order = [read(second, STORAGE.ticketWalletDisplayOrder, []), read(first, STORAGE.ticketWalletDisplayOrder, [])].flatMap((value) => Array.isArray(value) ? value : []);
    merged[STORAGE.ticketWalletDisplayOrder] = JSON.stringify([...new Set(order)].filter((id) => !deleted[id]));
  }
  if (has(STORAGE.ticketWalletMapCache)) merged[STORAGE.ticketWalletMapCache] = JSON.stringify({ ...read(first, STORAGE.ticketWalletMapCache, {}), ...read(second, STORAGE.ticketWalletMapCache, {}) });
  return merged;
}
function syncLibraryMetadata() {
  return state.library.map((book) => {
    if (!book || typeof book !== 'object') return book;
    const { content, _coverData, _coverHydrating, _coverHydrated, ...metadata } = book;
    return metadata;
  });
}
function syncPayload(readerFiles = null, library = syncLibraryMetadata(), ticketWalletFiles = null) {
  const selection = normalizeGithubSyncSelection(state.githubSyncSelection);
  const enabled = (group) => selection[group] === true;
  return {
    schema: 2, app: 'OneBox', version: APP_VERSION, savedAt: new Date().toISOString(), storage: syncStorageSnapshot(selection),
    ...(enabled('settings') ? { theme: state.theme, color: state.color, languageMode: state.languageMode, language: state.language, layoutMode: state.layoutMode, topDisplay: state.topDisplay, footprint: state.footprint, mascotVisible: state.mascotVisible, mascotDisplayMode: state.mascotDisplayMode, mascotPosition: parseStored(STORAGE.mascotPosition, null), petProfile: state.petProfile } : {}),
    ...(enabled('navigation') ? { toolOrder: state.toolOrder, homeFeedOrder: state.homeFeed.order, homeFeedVisibility: state.homeFeed.visible, navigation: state.navigation, navigationLocation: state.navigationLocation, openMode: state.openMode } : {}),
    ...(enabled('reading') ? { library, readerPreferences: state.readerPreferences, readerLayout: state.readerLayout, homeFeedRead: state.homeFeedRead, readerFiles } : {}),
    ...(enabled('messages') ? { notifications: state.notifications, notificationPreference: state.notificationPreference } : {}),
    ...(selection.calendar ? { events: state.events } : {}),
    ...(selection.weather ? { weatherCards: state.weatherCards } : {}),
    ...(selection.translation ? { translationHistory: state.translationHistory, translationHistoryOpen: state.translationHistoryOpen } : {}),
    ...(selection.calculator ? { calculator: parseStored(STORAGE.calculator, {}) } : {}),
    ...(enabled('ticketWallet') ? { ticketWalletFiles } : {}),
  };
}
function preserveDisabledGithubPayloadGroups(payload, remote, selection) {
  Object.entries(GITHUB_SYNC_GROUP_FIELDS).forEach(([group, fields]) => {
    if (selection[group] !== false) return;
    fields.forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(payload, key) && Object.prototype.hasOwnProperty.call(remote, key)) payload[key] = remote[key];
    });
  });
  return payload;
}
async function buildGithubSyncBundle(existingRemote = null, existingGist = null, onProgress = null) {
  const readingEnabled = githubSyncCustomGroupEnabled('reading');
  const walletEnabled = githubSyncCustomGroupEnabled('ticketWallet');
  const readerCount = readingEnabled ? state.library.filter((book) => book?.id).length : 0;
  const walletCount = walletEnabled ? ticketWalletSyncImageIds().length : 0;
  const total = Math.max(1, readerCount + walletCount);
  let completed = 0;
  const reportProgress = (count, _total, phase) => {
    completed += 1;
    const label = phase === 'wallet'
      ? (state.language === 'en' ? 'Preparing wallet originals…' : '正在准备卡包原件…')
      : (state.language === 'en' ? 'Checking book files…' : '正在检查书籍文件…');
    onProgress?.(Math.min(100, Math.round(completed / total * 100)), label);
  };
  const assets = readingEnabled ? await buildReaderSyncAssets(existingRemote, existingGist, reportProgress) : { manifest: null, files: {} };
  const walletAssets = walletEnabled ? await buildTicketWalletSyncAssets(existingRemote, existingGist, reportProgress) : { manifest: null, files: {} };
  const payload = syncPayload(assets.manifest, readingEnabled ? syncLibraryMetadata() : [], walletAssets.manifest);
  onProgress?.(100, state.language === 'en' ? 'Preparing sync data…' : '正在整理同步数据…');
  return { payload, files: { 'onebox-settings.json': JSON.stringify(payload, null, 2), ...assets.files, ...walletAssets.files }, bookCount: Object.keys(assets.manifest?.books || {}).length };
}
function mergeGithubUploadBundle(bundle, remote = null) {
  if (!bundle?.payload || !remote || typeof remote !== 'object') return bundle;
  const payload = { ...bundle.payload };
  const selection = normalizeGithubSyncSelection(state.githubSyncSelection);
  const mergeField = (key) => {
    if (Object.prototype.hasOwnProperty.call(payload, key) && Object.prototype.hasOwnProperty.call(remote, key)) payload[key] = mergeGithubValue(remote[key], payload[key]);
  };
  ['events', 'weatherCards', 'translationHistory', 'notifications', 'library', 'homeFeedRead', 'navigation'].forEach(mergeField);
  if (selection.navigation && payload.navigation) {
    payload.navigation = mergeGithubNavigation(remoteGithubNavigation(remote), payload.navigation);
  }
  if (selection.calculator && remote.calculator && payload.calculator) payload.calculator = mergeGithubValue(remote.calculator, payload.calculator);
  if (remote.storage && payload.storage) {
    // An unchecked group is intentionally left untouched in the cloud. Keep
    // all of its existing storage instead of deleting it from the manifest.
    payload.storage = { ...remote.storage, ...payload.storage };
    GITHUB_MERGE_STORAGE_KEYS.forEach((key) => {
      if (typeof remote.storage[key] === 'string' && typeof payload.storage[key] === 'string') payload.storage[key] = mergeGithubStorageValue(key, remote.storage[key], payload.storage[key]);
    });
  }
  if (selection.ticketWallet) payload.storage = mergeTicketWalletSyncStorage(remote.storage, payload.storage);
  preserveDisabledGithubPayloadGroups(payload, remote, selection);
  if (selection.ticketWallet && remote.ticketWalletFiles?.images && payload.ticketWalletFiles?.images) {
    payload.ticketWalletFiles = { ...payload.ticketWalletFiles, images: { ...remote.ticketWalletFiles.images, ...payload.ticketWalletFiles.images } };
  }
  if (remote.readerFiles?.books && payload.readerFiles?.books) payload.readerFiles = { ...payload.readerFiles, books: { ...remote.readerFiles.books, ...payload.readerFiles.books } };
  const files = { ...bundle.files, 'onebox-settings.json': JSON.stringify(payload, null, 2) };
  return { ...bundle, payload, files, bookCount: Object.keys(payload.readerFiles?.books || {}).length };
}
function githubAvatarUrl(user) {
  const avatar = String(user?.avatar_url || '').trim();
  if (/^https?:\/\//i.test(avatar)) return avatar;
  const login = String(user?.login || '').trim();
  return login ? 'https://github.com/' + encodeURIComponent(login) + '.png?size=64' : '';
}
function githubAvatarMarkup(user) {
  const avatar = githubAvatarUrl(user);
  return avatar ? '<img src="' + escapeHtml(avatar) + '" alt="" onerror="this.remove();this.parentElement.classList.add(\'is-fallback\')">' : '';
}
async function hydrateGithubUser() {
  if (!state.github.token) return;
  const requestedToken = state.github.token;
  try {
    const response = await githubApiFetch('https://api.github.com/user', { headers: githubHeaders(), cache: 'no-store' });
    if (!response.ok) {
      if (response.status === 401) invalidateGithubToken(requestedToken);
      return;
    }
    const user = await response.json();
    if (!user?.login || state.github.token !== requestedToken) return;
    const previousLogin = state.github.user?.login || '';
    state.github.user = { ...state.github.user, ...user };
    saveGithub();
    queueReaderCloudSync(500);
    if (previousLogin !== user.login) {
      bindPetProfileToCurrentUser();
      render();
      if ($('#petDialog') && !$('#petDialog').hidden) renderPetDialog();
    }
    if (state.githubDialogOpen && !$('#githubDialog')?.hidden) renderGithubDialog();
  } catch { /* keep the last-known GitHub account when its profile cannot be refreshed */ }
}
async function githubFileContent(file) {
  if (!file) return null;
  if (!file.truncated && typeof file.content === 'string' && file.content) return file.content;
  if (!file.raw_url) return typeof file.content === 'string' ? file.content : '';
  try {
    const authorized = await fetch(file.raw_url, { headers: githubHeaders(), cache: 'no-store' });
    if (authorized.status === 401) {
      const error = Error(t('githubAuthExpired')); error.code = 'github-auth-expired'; throw error;
    }
    if (authorized.ok) return await authorized.text();
  } catch (error) {
    if (error?.code === 'github-auth-expired') throw error;
    /* some raw GitHub hosts reject browser authorization headers */
  }
  try {
    const raw = await fetch(file.raw_url, { cache: 'no-store' });
    return raw.ok ? await raw.text() : null;
  } catch { return null; }
}
async function githubGistDetails(gist, version = '') {
  if (!gist?.id) return null;
  const suffix = version ? '/' + encodeURIComponent(version) : '';
  const response = await githubApiFetch('https://api.github.com/gists/' + encodeURIComponent(gist.id) + suffix, { headers: githubHeaders(), cache: 'no-store' });
  if (!response.ok) throw await githubApiError(response, state.language === 'en' ? 'Could not read the OneBox Gist' : '无法读取 OneBox Gist');
  const details = await response.json();
  if (details?.id) { githubDetailedGists.add(details); return details; }
  return gist;
}
async function githubGistHistory(gist) {
  if (!gist?.id) return [];
  const response = await githubApiFetch('https://api.github.com/gists/' + encodeURIComponent(gist.id) + '/commits?per_page=12', { headers: githubHeaders(), cache: 'no-store' });
  if (!response.ok) throw await githubApiError(response, state.language === 'en' ? 'Could not read the OneBox Gist history' : '无法读取 OneBox Gist 历史版本');
  const history = await response.json();
  return Array.isArray(history) ? history : [];
}
async function readGithubGistPayload(candidate) {
  const latest = githubDetailedGists.has(candidate) ? candidate : await githubGistDetails(candidate);
  let lastError = null;
  try {
    const content = await githubFileContent(latest?.files?.['onebox-settings.json']);
    return { gist: latest, remote: parseGithubSyncPayload(content) };
  } catch (error) {
    lastError = error;
    if (error?.code === 'github-auth-expired') throw error;
  }
  let history = [];
  try { history = await githubGistHistory(candidate); } catch (error) {
    if (error?.code === 'github-auth-expired') throw error;
    throw lastError || error;
  }
  const latestVersion = latest?.history?.[0]?.version || '';
  for (const item of history) {
    const version = item?.version || item?.sha || '';
    if (!version || version === latestVersion) continue;
    try {
      const revision = await githubGistDetails(candidate, version);
      const content = await githubFileContent(revision?.files?.['onebox-settings.json']);
      return { gist: revision, remote: parseGithubSyncPayload(content) };
    } catch (error) {
      lastError = error;
      if (error?.code === 'github-auth-expired') throw error;
    }
  }
  throw lastError || Error(t('githubSyncInvalidData'));
}
function syncBase64Bytes(value) {
  const binary = atob(String(value || ''));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
async function syncDecodeBase64Chunks(chunks) {
  const decoded = [];
  for (let index = 0; index < chunks.length; index += 1) {
    decoded.push(syncBase64Bytes(chunks[index]));
    if ((index + 1) % 3 === 0 && index + 1 < chunks.length) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return decoded;
}
function parseGithubSyncPayload(content) {
  if (typeof content !== 'string' || !content.trim()) throw Error(t('githubSyncReadFailed'));
  const source = content.replace(/^\uFEFF/, '').trim();
  let remote = null;
  try { remote = JSON.parse(source); } catch { /* try an encoded legacy payload below */ }
  if (remote === null) {
    try {
      const bytes = syncBase64Bytes(source);
      remote = JSON.parse(new TextDecoder().decode(bytes));
    } catch { throw Error(t('githubSyncMalformed')); }
  }
  if (typeof remote === 'string') {
    try { remote = JSON.parse(remote); } catch { throw Error(t('githubSyncMalformed')); }
  }
  if (remote?.payload && typeof remote.payload === 'object' && !Array.isArray(remote.payload)) remote = remote.payload;
  if (remote?.data && typeof remote.data === 'object' && !Array.isArray(remote.data) && (remote.data.app === 'OneBox' || remote.data.storage || remote.data.theme || remote.data.toolOrder)) remote = remote.data;
  if (remote?.storage && typeof remote.storage === 'string') {
    try { remote.storage = JSON.parse(remote.storage); } catch { throw Error(t('githubSyncInvalidData')); }
  }
  const knownKeys = ['schema', 'version', 'theme', 'color', 'languageMode', 'language', 'toolOrder', 'calculator', 'events', 'weatherCards', 'translationHistory', 'notifications', 'library', 'readerPreferences', 'readerLayout', 'translationHistoryOpen', 'homeFeedRead', 'layoutMode', 'topDisplay', 'homeFeedOrder', 'homeFeedVisibility', 'navigation', 'footprint', 'mascotVisible', 'mascotDisplayMode', 'mascotPosition', 'petProfile', 'notificationPreference', 'openMode'];
  const hasRecognizableData = remote && typeof remote === 'object' && !Array.isArray(remote) && (Object.prototype.hasOwnProperty.call(remote, 'storage') || knownKeys.some((key) => Object.prototype.hasOwnProperty.call(remote, key)));
  const hasValidStorage = remote?.storage === undefined || remote?.storage === null || (typeof remote.storage === 'object' && !Array.isArray(remote.storage));
  if (!hasRecognizableData || (remote.app !== undefined && remote.app !== 'OneBox') || !hasValidStorage) throw Error(t('githubSyncInvalidData'));
  return remote;
}
function readerSyncLibrary(remote) {
  const storedLibrary = remote?.storage?.[STORAGE.library];
  let library = Array.isArray(remote?.library) ? remote.library : [];
  if (!library.length && typeof storedLibrary === 'string') {
    try { const parsed = JSON.parse(storedLibrary); if (Array.isArray(parsed)) library = parsed; } catch { /* legacy backup without readable library metadata */ }
  }
  return library;
}
function readerSyncHasLibrary(remote) {
  if (Array.isArray(remote?.library)) return true;
  const storedLibrary = remote?.storage?.[STORAGE.library];
  if (Array.isArray(storedLibrary)) return true;
  if (typeof storedLibrary === 'string') {
    try { return Array.isArray(JSON.parse(storedLibrary)); } catch { /* legacy backup without readable library metadata */ }
  }
  return false;
}
function readerSyncRequiredBooks(remote) {
  return readerSyncLibrary(remote).filter((book) => book?.id && ['md', 'txt', 'pdf', 'epub'].includes(book.type));
}
function readerSyncBookEntry(book, remote, gist) {
  const manifest = remote?.readerFiles?.books;
  const existing = manifest && typeof manifest === 'object' && !Array.isArray(manifest) ? manifest[book.id] : null;
  const entryHasFiles = (entry) => Array.isArray(entry?.files) && entry.files.length > 0
    && entry.files.every((name) => typeof name === 'string' && Boolean(gist?.files?.[name]))
    && (!Number.isFinite(Number(entry.size)) || !Number.isFinite(Number(book.size)) || Number(entry.size) === Number(book.size));
  if (entryHasFiles(existing)) return existing;
  if (book.type === 'md' && typeof book.content === 'string') return null;
  const size = Number(book.size);
  if (!Number.isFinite(size) || size <= 0) return null;
  const encodedLength = Math.ceil(size / 3) * 4;
  const prefix = 'onebox-book-' + syncAssetKey(book.id) + '-';
  const indexes = new Set(Object.keys(gist?.files || {}).flatMap((name) => {
    const match = name.match(new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\d+)\\.b64$'));
    return match ? [Number(match[1])] : [];
  }));
  const chunkCount = [GITHUB_SYNC_CHUNK_CHARS, 250000]
    .map((chunkSize) => Math.ceil(encodedLength / chunkSize))
    .find((count) => {
      if (!count || indexes.size < count || !Array.from({ length: count }, (_, index) => indexes.has(index)).every(Boolean)) return false;
      const sizes = Array.from({ length: count }, (_, index) => {
        const file = gist?.files?.[prefix + index + '.b64'];
        return Number.isFinite(Number(file?.size)) ? Number(file.size) : typeof file?.content === 'string' ? file.content.length : null;
      });
      return sizes.every((size) => Number.isFinite(size)) ? sizes.reduce((sum, size) => sum + size, 0) === encodedLength : count === indexes.size;
    });
  if (!chunkCount) return null;
  const files = Array.from({ length: chunkCount }, (_, index) => prefix + index + '.b64');
  if (files.some((name, index) => !indexes.has(index) || !gist?.files?.[name])) return null;
  return { type: book.type, size, files };
}
function repairReaderSyncManifest(remote, gist) {
  const requiredBooks = readerSyncRequiredBooks(remote);
  if (!requiredBooks.length) return { remote, hasAllSources: true };
  let books = remote?.readerFiles?.books && typeof remote.readerFiles.books === 'object' && !Array.isArray(remote.readerFiles.books)
    ? { ...remote.readerFiles.books }
    : {};
  let changed = false;
  for (const book of requiredBooks) {
    if (readerSyncBookEntry(book, { ...remote, readerFiles: { ...remote?.readerFiles, books } }, gist)) continue;
    const inferred = readerSyncBookEntry(book, { ...remote, readerFiles: null }, gist);
    if (inferred) { books[book.id] = inferred; changed = true; }
  }
  const repaired = changed ? { ...remote, readerFiles: { ...remote?.readerFiles, version: remote?.readerFiles?.version || 1, books } } : remote;
  const hasAllSources = requiredBooks.every((book) => book.type === 'md' && typeof book.content === 'string' || Boolean(readerSyncBookEntry(book, repaired, gist)));
  return { remote: repaired, hasAllSources };
}
function readerSyncHasOrphanedBookAssets(remote, gist) {
  const referenced = new Set();
  Object.values(remote?.readerFiles?.books || {}).forEach((entry) => {
    (Array.isArray(entry?.files) ? entry.files : []).forEach((name) => referenced.add(name));
  });
  return Object.keys(gist?.files || {}).some((name) => name.startsWith('onebox-book-') && name.endsWith('.b64') && !referenced.has(name));
}
async function recoverReaderBooksFromGistHistory(remote, gist) {
  if (!gist?.id) return { remote, gist, recovered: 0 };
  let history = [];
  try { history = await githubGistHistory(gist); }
  catch (error) {
    if (error?.code === 'github-auth-expired') throw error;
    return { remote, gist, recovered: 0 };
  }
  const priorVersions = history.slice(1, 6);
  if (!priorVersions.length) return { remote, gist, recovered: 0 };

  const library = readerSyncLibrary(remote).slice();
  const booksById = new Map(library.filter((book) => book?.id).map((book) => [book.id, book]));
  const manifest = remote?.readerFiles?.books && typeof remote.readerFiles.books === 'object' && !Array.isArray(remote.readerFiles.books)
    ? { ...remote.readerFiles.books }
    : {};
  const files = { ...(gist.files || {}) };
  let recovered = 0;

  for (const [versionIndex, item] of priorVersions.entries()) {
    const version = item?.version || item?.sha || '';
    if (!version) continue;
    try {
      const revision = await githubGistDetails(gist, version);
      const content = await githubFileContent(revision?.files?.['onebox-settings.json']);
      const historicalRemote = parseGithubSyncPayload(content);
      if (!readerSyncHasLibrary(historicalRemote)) continue;

      for (const historicalBook of readerSyncLibrary(historicalRemote)) {
        if (!historicalBook?.id || !['md', 'txt', 'pdf', 'epub'].includes(historicalBook.type)) continue;
        const currentBook = booksById.get(historicalBook.id) || null;
        const currentEntry = currentBook && readerSyncBookEntry(currentBook, { ...remote, readerFiles: { ...remote?.readerFiles, books: manifest } }, { ...gist, files });
        const hasCurrentSource = currentBook && (currentBook.type === 'md' && typeof currentBook.content === 'string' || Boolean(currentEntry));
        if (hasCurrentSource) continue;

        const historicalEntry = readerSyncBookEntry(historicalBook, historicalRemote, revision);
        const hasInlineMarkdown = historicalBook.type === 'md' && typeof historicalBook.content === 'string';
        if (!currentBook && !historicalEntry && !hasInlineMarkdown) continue;
        if (currentBook && historicalEntry && Number(currentBook.size) !== Number(historicalEntry.size)) continue;

        let recoveredEntry = null;
        if (historicalEntry?.files?.length) {
          const suffix = String(version).replace(/[^a-zA-Z0-9]/g, '').slice(-12) || String(versionIndex);
          const recoveredFiles = [];
          for (const [chunkIndex, oldName] of historicalEntry.files.entries()) {
            const oldFile = revision.files?.[oldName];
            if (!oldFile) break;
            const newName = 'onebox-book-recovery-' + syncAssetKey(historicalBook.id) + '-' + suffix + '-' + chunkIndex + '.b64';
            files[newName] = oldFile;
            recoveredFiles.push(newName);
          }
          if (recoveredFiles.length === historicalEntry.files.length) {
            recoveredEntry = { ...historicalEntry, files: recoveredFiles };
            if (historicalEntry.cover && revision.files?.[historicalEntry.cover]) {
              const coverName = 'onebox-book-recovery-' + syncAssetKey(historicalBook.id) + '-' + suffix + '.cover';
              files[coverName] = revision.files[historicalEntry.cover];
              recoveredEntry.cover = coverName;
            }
          }
        }
        if (!recoveredEntry && !hasInlineMarkdown) continue;

        if (!currentBook) {
          library.push(historicalBook);
          booksById.set(historicalBook.id, historicalBook);
        }
        if (recoveredEntry) manifest[historicalBook.id] = recoveredEntry;
        recovered += 1;
      }
    } catch (error) {
      if (error?.code === 'github-auth-expired') throw error;
      // A damaged older revision should not block restoring the newest backup.
    }
  }

  if (!recovered) return { remote, gist, recovered };
  return {
    remote: { ...remote, library, readerFiles: { ...remote?.readerFiles, version: remote?.readerFiles?.version || 1, books: manifest } },
    gist: { ...gist, files },
    recovered,
  };
}
async function restoreReaderSyncAssets(remote, gist, onProgress = null) {
  const repaired = repairReaderSyncManifest(remote, gist);
  remote = repaired.remote;
  const library = readerSyncLibrary(remote);
  const hasLibrary = readerSyncHasLibrary(remote);
  const manifest = remote?.readerFiles?.books;
  const requiredBooks = readerSyncRequiredBooks(remote);
  const missingIds = new Set();
  const sourceWrites = [];
  const coverWrites = [];
  const validManifest = manifest && typeof manifest === 'object' && !Array.isArray(manifest);
  let completedBooks = 0;
  await syncMapLimit(requiredBooks, 3, async (book) => {
    try {
      const entry = readerSyncBookEntry(book, remote, gist);
      if (!entry?.files?.length) {
        if (!(book.type === 'md' && typeof book.content === 'string')) missingIds.add(book.id);
        return;
      }
      const chunks = await Promise.all(entry.files.map((name) => githubFileContent(gist.files[name])));
      if (chunks.some((chunk) => typeof chunk !== 'string' || !chunk)) { missingIds.add(book.id); return; }
      const byteChunks = await syncDecodeBase64Chunks(chunks);
      const total = byteChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      if (!total || Number.isFinite(Number(entry.size)) && total !== Number(entry.size) || Number.isFinite(Number(book.size)) && total !== Number(book.size)) throw Error('book file size mismatch');
      const bytes = new Uint8Array(total); let offset = 0;
      byteChunks.forEach((chunk) => { bytes.set(chunk, offset); offset += chunk.length; });
      sourceWrites.push({ id: book.id, value: bytes.buffer, content: book.type === 'md' ? new TextDecoder().decode(bytes) : '' });
    } catch (error) {
      if (error?.code === 'github-auth-expired') throw error;
      missingIds.add(book.id);
    } finally {
      completedBooks += 1;
      onProgress?.(completedBooks, requiredBooks.length);
    }
  });
  const coverEntries = Object.entries(validManifest ? manifest : {}).filter(([, entry]) => entry?.cover);
  await syncMapLimit(coverEntries, 4, async ([id, entry]) => {
    const cover = await githubFileContent(gist.files?.[entry.cover]);
    if (typeof cover === 'string' && /^data:image\//i.test(cover)) coverWrites.push({ id, value: cover });
  });
  await syncMapLimit(sourceWrites, 3, async (item) => {
    if (!await oneBoxDbPut('books', item.id, item.value)) missingIds.add(item.id);
  });
  await syncMapLimit(coverWrites, 3, async (item) => { await oneBoxDbPut('book-covers', item.id, item.value); });
  const restoredIds = new Set(sourceWrites.filter((item) => !missingIds.has(item.id)).map((item) => item.id));
  const restoredSources = new Map(sourceWrites.filter((item) => !missingIds.has(item.id)).map((item) => [item.id, item]));
  const restoredLibrary = hasLibrary ? library.map((book) => {
    if (!book || typeof book !== 'object') return book;
    if (missingIds.has(book.id)) return { ...book, syncFileMissing: true };
    if (restoredIds.has(book.id) || book.syncFileMissing) {
      const { syncFileMissing, ...available } = book;
      const source = restoredSources.get(book.id);
      return source?.content ? { ...available, content: source.content } : available;
    }
    return book;
  }) : null;
  return { library: restoredLibrary, missingBooks: requiredBooks.filter((book) => missingIds.has(book.id)).map((book) => book.name), restoredIds: [...restoredIds] };
}
async function verifyReaderSyncAssets(readerFiles, gist, library = []) {
  const manifest = readerFiles?.books;
  const requiredBooks = (Array.isArray(library) ? library : []).filter((book) => book?.id && ['md', 'txt', 'pdf', 'epub'].includes(book.type));
  const needsManifest = requiredBooks.some((book) => !(book.type === 'md' && typeof book.content === 'string'));
  if (needsManifest && (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))) throw Error(state.language === 'en' ? 'GitHub book source manifest is missing' : 'GitHub 书籍原文件清单缺失');
  for (const book of requiredBooks) {
    const entry = manifest?.[book.id];
    if ((!Array.isArray(entry?.files) || !entry.files.length) && book.type === 'md' && typeof book.content === 'string') continue;
    if (!Array.isArray(entry?.files) || !entry.files.length) throw Error((state.language === 'en' ? 'GitHub book source is missing: ' : 'GitHub 书籍原文件缺失：') + book.name);
    const chunks = await Promise.all(entry.files.map((name) => githubFileContent(gist?.files?.[name])));
    if (chunks.some((chunk) => typeof chunk !== 'string' || !chunk)) throw Error((state.language === 'en' ? 'GitHub book source is incomplete: ' : 'GitHub 书籍原文件不完整：') + book.name);
    const total = chunks.reduce((sum, chunk) => sum + syncBase64Bytes(chunk).length, 0);
    if (!total || Number.isFinite(Number(entry.size)) && total !== Number(entry.size) || Number.isFinite(Number(book.size)) && total !== Number(book.size)) throw Error((state.language === 'en' ? 'GitHub book source size check failed: ' : 'GitHub 书籍原文件大小校验失败：') + book.name);
  }
}
function mergeGithubValue(localValue, remoteValue) {
  if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
    const merged = [];
    const positions = new Map();
    const add = (item) => {
      const key = item && typeof item === 'object' && item.id != null
        ? 'id:' + String(item.id)
        : 'value:' + JSON.stringify(item);
      if (!positions.has(key)) { positions.set(key, merged.length); merged.push(item); }
      else if (item && typeof item === 'object' && merged[positions.get(key)] && typeof merged[positions.get(key)] === 'object') {
        const current = merged[positions.get(key)];
        const mergedItem = mergeGithubValue(current, item);
        if (current.syncFileMissing !== true && item.syncFileMissing === true) delete mergedItem.syncFileMissing;
        merged[positions.get(key)] = mergedItem;
      }
    };
    localValue.forEach(add); remoteValue.forEach(add);
    return merged;
  }
  if (localValue && typeof localValue === 'object' && !Array.isArray(localValue) && remoteValue && typeof remoteValue === 'object' && !Array.isArray(remoteValue)) {
    const merged = { ...localValue };
    Object.entries(remoteValue).forEach(([key, value]) => { merged[key] = Object.prototype.hasOwnProperty.call(merged, key) ? mergeGithubValue(merged[key], value) : value; });
    return merged;
  }
  return remoteValue === undefined ? localValue : remoteValue;
}
function navigationMergeItemKey(item) {
  if (!item || typeof item !== 'object') return '';
  if (item.type === 'site') {
    const url = navigationSafeUrl(item.url);
    return url ? 'site:' + url : '';
  }
  if (item.type === 'folder') {
    const id = String(item.id || '').trim();
    if (id) return 'folder-id:' + id;
    const name = String(item.name || '').trim().toLocaleLowerCase();
    return name ? 'folder-name:' + name : '';
  }
  return '';
}
function mergeGithubNavigation(localValue, remoteValue) {
  const local = normalizeNavigation(localValue);
  const remote = normalizeNavigation(remoteValue);
  const merged = { version: 1, items: local.items.map((item) => ({ ...item, ...(item.type === 'folder' ? { children: item.children.map((child) => ({ ...child })) } : {}) })) };
  const rootByKey = new Map();
  const childByFolder = new Map();
  const rememberRoot = (item, index) => {
    const key = navigationMergeItemKey(item);
    if (key) rootByKey.set(key, index);
    if (item.type === 'folder') {
      const children = new Map();
      item.children.forEach((child, childIndex) => {
        const childKey = navigationMergeItemKey(child);
        if (childKey) children.set(childKey, childIndex);
      });
      childByFolder.set(index, children);
    }
  };
  merged.items.forEach(rememberRoot);
  remote.items.forEach((remoteItem) => {
    const key = navigationMergeItemKey(remoteItem);
    const existingIndex = key ? rootByKey.get(key) : undefined;
    if (existingIndex === undefined) {
      const nextIndex = merged.items.push({ ...remoteItem, ...(remoteItem.type === 'folder' ? { children: remoteItem.children.map((child) => ({ ...child })) } : {}) }) - 1;
      rememberRoot(merged.items[nextIndex], nextIndex);
      return;
    }
    const existing = merged.items[existingIndex];
    if (existing.type !== 'folder' || remoteItem.type !== 'folder') {
      // A URL is the stable identity of a site across devices. Keep the local
      // id so bookmarks and folder moves remain stable, but refresh its label
      // and icon from the backup when the same URL already exists locally.
      merged.items[existingIndex] = { ...existing, ...remoteItem, id: existing.id };
      return;
    }
    const children = childByFolder.get(existingIndex) || new Map();
    remoteItem.children.forEach((remoteChild) => {
      const childKey = navigationMergeItemKey(remoteChild);
      const childIndex = childKey ? children.get(childKey) : undefined;
      if (childIndex === undefined) {
        children.set(childKey || 'child:' + existing.children.length, existing.children.length);
        existing.children.push({ ...remoteChild });
      } else {
        const localChild = existing.children[childIndex];
        existing.children[childIndex] = { ...localChild, ...remoteChild, id: localChild.id };
      }
    });
    if (remoteItem.name) existing.name = remoteItem.name;
  });
  return normalizeNavigation(merged);
}
function remoteGithubNavigation(remote) {
  if (remote?.navigation && Array.isArray(remote.navigation.items)) return remote.navigation;
  const stored = remote?.storage?.[STORAGE.navigation];
  if (typeof stored === 'string') {
    try { return JSON.parse(stored); } catch { return null; }
  }
  return stored && typeof stored === 'object' ? stored : null;
}
const GITHUB_MERGE_STORAGE_KEYS = new Set([STORAGE.events, STORAGE.weatherCards, STORAGE.translationHistory, STORAGE.notifications]);
function mergeGithubStorageValue(key, localValue, remoteValue) {
  if (!GITHUB_MERGE_STORAGE_KEYS.has(key)) return remoteValue;
  try {
    const localParsed = localValue == null ? null : JSON.parse(localValue);
    const remoteParsed = JSON.parse(remoteValue);
    return JSON.stringify(mergeGithubValue(localParsed, remoteParsed));
  } catch { return remoteValue; }
}
function applyRemoteStorageSnapshot(remoteStorage) {
  if (!remoteStorage || typeof remoteStorage !== 'object') return;
  if (githubSyncCustomGroupEnabled('ticketWallet')) {
    const localWallet = Object.fromEntries([...GITHUB_CUSTOM_SYNC_STORAGE_KEYS.ticketWallet].map((key) => [key, localStorage.getItem(key)]).filter(([, value]) => value !== null));
    remoteStorage = mergeTicketWalletSyncStorage(localWallet, remoteStorage);
  }
  Object.entries(remoteStorage).forEach(([key, value]) => {
    if (isSyncableStorageKey(key) && githubSyncStorageKeyEnabled(key) && typeof value === 'string') {
      try {
        const current = localStorage.getItem(key);
        localStorage.setItem(key, mergeGithubStorageValue(key, current, value));
      } catch { /* keep the rest of the restore usable */ }
    }
  });
  queuePersistentSnapshot();
}
function hydrateCalculatorFromStorage() {
  const calculator = parseStored(STORAGE.calculator, { expr: '', history: [], historyOpen: false });
  state.calcExpr = String(calculator.expr || '');
  state.calcHistory = Array.isArray(calculator.history) ? calculator.history : [];
  state.calcHistoryOpen = calculator.historyOpen === true;
}
function hydrateGithubRuntimeState() {
  hydrateCalculatorFromStorage();
  state.ticketWallet = normalizeTicketWallet(parseStored(STORAGE.ticketWallet, []));
  state.ticketWalletDisplayOrder = parseStored(STORAGE.ticketWalletDisplayOrder, []);
  state.ticketWalletMemories = normalizeTicketMemories(parseStored(STORAGE.ticketWalletMemories, {}));
  state.ticketWalletTypeFilter = normalizeTicketWalletFilter(localStorage.getItem(STORAGE.ticketWalletTypeFilter));
  state.ticketWalletDiningKindFilter = normalizeTicketWalletDiningKindFilter(localStorage.getItem(STORAGE.ticketWalletDiningKindFilter));
  if (!state.ticketWallet.some((record) => record.id === state.ticketWalletSelectedId)) state.ticketWalletSelectedId = '';
  void hydrateTicketWalletImages();
  state.devTools = normalizeDevTools(parseStored(STORAGE.devTools, {}));
  state.events = parseStored(STORAGE.events, {}) || {};
  const storedWeather = parseStored(STORAGE.weatherCards, []);
  state.weatherCards = normalizeWeatherCards((Array.isArray(storedWeather) ? storedWeather : []).map((item) => ({ ...item, loading: false })));
  state.activeWeatherId = state.weatherCards[0]?.id || null;
  state.translationHistory = parseStored(STORAGE.translationHistory, []);
  state.notifications = parseStored(STORAGE.notifications, []);
  state.library = normalizeReaderLibrary(parseStored(STORAGE.library, []));
  state.readerPreferences = { ...state.readerPreferences, ...(parseStored(STORAGE.readerPreferences, {}) || {}) };
  state.readerLayout = localStorage.getItem(STORAGE.readerLayout) === 'list' ? 'list' : 'grid';
  state.translationHistoryOpen = parseStored(STORAGE.translationHistoryOpen, false) === true;
  state.homeFeedRead = parseStored(STORAGE.homeFeedRead, {}) || {};
  state.layoutMode = localStorage.getItem(STORAGE.layout) === 'classic' ? 'classic' : 'simple';
  const storedTopDisplay = parseStored(STORAGE.topDisplay, {}) || {};
  state.topDisplay = { theme: storedTopDisplay.theme !== false, language: storedTopDisplay.language !== false, messages: storedTopDisplay.messages !== false };
  state.homeFeed.order = normalizeHomeFeedOrder(parseStored(STORAGE.homeFeedOrder, state.homeFeed.order));
  state.homeFeed.visible = normalizeHomeFeedVisibility(parseStored(STORAGE.homeFeedVisibility, state.homeFeed.visible));
  state.navigation = normalizeNavigation(parseStored(STORAGE.navigation, state.navigation));
  state.navigationLocation = localStorage.getItem(STORAGE.navigationLocation) === 'tools' ? 'tools' : 'main';
  state.toolOrder = normalizeToolOrder(parseStored(STORAGE.toolOrder, state.toolOrder), state.navigationLocation === 'tools', state.navigationLocation === 'tools');
  state.footprint = parseStored(STORAGE.footprint, true) !== false;
  state.mascotVisible = localStorage.getItem(STORAGE.mascotVisible) !== 'false';
  state.mascotDisplayMode = localStorage.getItem(STORAGE.mascotDisplayMode) === 'full' ? 'full' : 'half';
  state.petProfile = normalizePetProfile(parseStored(STORAGE.petProfile, {}));
  state.notificationPreference = parseStored(STORAGE.notificationPreference, 'allow') === 'deny' ? 'deny' : 'allow';
  state.openMode = localStorage.getItem(STORAGE.openMode) === 'new-tab' ? 'new-tab' : 'current';
  const activeTool = localStorage.getItem(STORAGE.toolActive);
  if (Object.keys(TOOL_DEFS).includes(activeTool)) state.tool = activeTool;
  const activeHomeFeed = localStorage.getItem(STORAGE.homeFeedActive);
  if (activeHomeFeed && homeTabIds().includes(activeHomeFeed)) state.homeFeed.active = activeHomeFeed;
  syncTicketWalletCalendarEvents();
}
function githubBrowserError(error) {
  const message = String(error?.message || '');
  if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
    if (navigator.onLine === false) return state.language === 'en' ? 'Your device is offline. Reconnect and retry.' : '设备当前已离线，请联网后重试。';
    return t('githubNetworkError');
  }
  return message;
}
function invalidateGithubToken(requestedToken = state.github.token) {
  if (requestedToken !== state.github.token) return;
  if (!state.github.token && !state.github.user) return;
  state.github.token = '';
  state.github.user = null;
  state.github.deviceCode = '';
  state.github.userCode = '';
  state.github.verificationUri = '';
  state.github.verificationUriComplete = '';
  state.github.expiresAt = 0;
  state.github.manualTokenOpen = false;
  saveGithub();
  if (state.githubDialogOpen && !$('#githubDialog')?.hidden) renderGithubDialog();
}
async function githubApiError(response, fallback = '') {
  let message = '';
  let details = '';
  let data = null;
  try {
    data = await response.clone().json();
    message = data?.message || data?.error_description || data?.error || '';
    if (Array.isArray(data?.errors)) {
      details = data.errors.map((item) => {
        if (typeof item === 'string') return item;
        return [item?.resource, item?.field, item?.code, item?.message].filter(Boolean).join(' ');
      }).filter(Boolean).join('; ');
    }
  } catch { /* GitHub may return an empty or non-JSON error body. */ }
  const suffix = response?.status ? ' (' + response.status + ')' : '';
  if (response?.status === 401) {
    invalidateGithubToken(githubResponseTokens.get(response) ?? state.github.token);
    const error = Error(t('githubAuthExpired')); error.code = 'github-auth-expired'; return error;
  }
  if ([403, 429].includes(response?.status) && /(?:api )?rate limit exceeded|secondary rate limit|abuse detection|temporarily blocked/i.test(message + ' ' + details)) {
    const now = Date.now();
    const resetAt = Number(response.headers.get('X-RateLimit-Reset')) * 1000;
    const retryAfter = Number(response.headers.get('Retry-After')) * 1000;
    const resetCandidates = [resetAt, Number.isFinite(retryAfter) ? now + retryAfter : 0].filter((value) => Number.isFinite(value) && value > now);
    saveGithubRateLimitUntil(resetCandidates.length ? Math.max(...resetCandidates) : now + 60000);
    const resource = response.headers.get('X-RateLimit-Resource') || '';
    const remaining = response.headers.get('X-RateLimit-Remaining') || '';
    const error = githubRateLimitError(resource, remaining);
    error.status = response.status;
    error.code = 'github-rate-limit';
    error.githubRateLimit = { resource, remaining, resetAt: githubRateLimitUntil };
    return error;
  }
  const error = Error((message || fallback || (state.language === 'en' ? 'GitHub request failed' : 'GitHub 请求失败')) + (details ? (state.language === 'en' ? ': ' : '：') + details : '') + suffix);
  error.status = response?.status || 0;
  error.githubErrors = Array.isArray(data?.errors) ? data.errors : [];
  return error;
}
function githubSyncLabel(mode, key) {
  const english = state.language === 'en';
  const labels = {
    upload: { preparing: ['Preparing your OneBox data…', '正在准备 OneBox 数据…'], bundle: ['Reading local books and settings…', '正在读取本地书籍和设置…'], gist: ['Checking your private Gist…', '正在检查你的私有 Gist…'], upload: ['Uploading to GitHub…', '正在上传到 GitHub…'], finishing: ['Finishing sync…', '正在完成同步…'] },
    download: { preparing: ['Preparing restore…', '正在准备恢复…'], gist: ['Reading your private Gist…', '正在读取你的私有 Gist…'], download: ['Downloading GitHub data…', '正在下载 GitHub 数据…'], restore: ['Restoring books and settings…', '正在恢复书籍和设置…'], finishing: ['Finishing restore…', '正在完成恢复…'] },
  };
  return labels[mode]?.[key]?.[english ? 0 : 1] || '';
}
async function withGithubSyncTabLock(task) {
  if (!navigator.locks?.request) return task();
  let acquired = false;
  try {
    await navigator.locks.request('onebox-github-sync', { mode: 'exclusive', ifAvailable: true }, async (lock) => {
      if (!lock) return;
      acquired = true;
      return task();
    });
  } catch (error) {
    if (acquired) throw error;
    return task();
  }
  if (!acquired) toast(state.language === 'en' ? 'Another OneBox tab is already syncing. Please wait for it to finish.' : '另一个 OneBox 标签页正在同步，请等待当前同步完成。', 'info');
}
function renderGithubSyncIndicator() {
  const root = mascotRuntime.root;
  const indicator = root?.querySelector('[data-mascot-sync-progress]');
  if (!root || !indicator) return;
  const sync = state.githubSync || { active: false, mode: '', progress: 0, message: '', error: '' };
  const visible = Boolean(sync.active || sync.error || sync.message);
  const terminal = visible && !sync.active;
  indicator.hidden = !visible;
  indicator.classList.toggle('is-active', Boolean(sync.active));
  indicator.classList.toggle('is-error', Boolean(sync.error));
  indicator.classList.toggle('is-complete', terminal && !sync.error);
  indicator.dataset.mode = sync.mode || '';
  const progress = Math.max(0, Math.min(100, Number(sync.progress) || 0));
  const message = indicator.querySelector('[data-mascot-sync-message]');
  const percent = indicator.querySelector('[data-mascot-sync-percent]');
  const ring = indicator.querySelector('[data-mascot-sync-ring]');
  const trigger = indicator.querySelector('[data-mascot-sync-trigger]');
  const dismiss = indicator.querySelector('[data-mascot-sync-dismiss]');
  const label = sync.error || sync.message || (sync.mode === 'download' ? (state.language === 'en' ? 'Restoring books and settings' : '正在恢复书籍和设置') : (state.language === 'en' ? 'Syncing with GitHub' : '正在同步到 GitHub'));
  if (message) message.textContent = label;
  if (percent) percent.textContent = sync.error ? '!' : progress + '%';
  if (ring) ring.style.setProperty('--sync-progress', progress + '%');
  if (trigger) trigger.setAttribute('aria-label', (sync.error ? (state.language === 'en' ? 'Sync failed. Open details' : '同步失败，点击查看详情') : terminal ? (state.language === 'en' ? 'Sync complete. Open details' : '同步完成，点击查看详情') : sync.mode === 'download' ? (state.language === 'en' ? 'Restoring from GitHub' : '正在从 GitHub 恢复') : (state.language === 'en' ? 'Syncing with GitHub' : '正在同步到 GitHub')) + ' · ' + (sync.error ? label : progress + '%'));
  if (dismiss) {
    dismiss.hidden = !terminal;
    dismiss.setAttribute('aria-label', state.language === 'en' ? 'Dismiss sync status' : '关闭同步状态');
    dismiss.title = state.language === 'en' ? 'Dismiss' : '关闭';
  }
  root.classList.toggle('is-syncing', Boolean(sync.active));
  root.classList.toggle('has-sync-progress', visible);
  root.classList.toggle('is-sync-only', visible && !state.mascotVisible);
  if (visible) {
    root.hidden = false;
    root.classList.remove('is-docked');
    mascotClearDockTimer();
    if (indicator.dataset.syncPlace !== (root.getBoundingClientRect().top < 105 ? 'below' : 'above')) indicator.dataset.syncPlace = root.getBoundingClientRect().top < 105 ? 'below' : 'above';
  } else {
    root.hidden = !state.mascotVisible;
    if (!visible) root.classList.remove('is-sync-only');
    if (state.mascotVisible) mascotScheduleDock();
  }
  mascotUpdateOverlayLayout();
  syncMascotContext();
}
function updateGithubSync(mode, progress, message, error = '') {
  clearTimeout(githubSyncDismissTimer);
  githubSyncDismissTimer = 0;
  state.githubSync = { active: !error && progress < 100, mode, progress: Math.max(0, Math.min(100, Math.round(progress))), message: message || '', error: error || '' };
  renderGithubSyncIndicator();
  if (state.githubDialogOpen && !$('#githubDialog')?.hidden) renderGithubDialog();
}
function finishGithubSync(mode, message, error = '') {
  state.githubSync = { active: false, mode, progress: error ? state.githubSync.progress : 100, message: message || '', error: error || '' };
  renderGithubSyncIndicator();
  if (state.githubDialogOpen && !$('#githubDialog')?.hidden) renderGithubDialog();
  clearTimeout(githubSyncDismissTimer);
  githubSyncDismissTimer = window.setTimeout(dismissGithubSyncIndicator, error ? 12000 : 5000);
}
function dismissGithubSyncIndicator() {
  clearTimeout(githubSyncDismissTimer);
  githubSyncDismissTimer = 0;
  state.githubSync = { active: false, mode: '', progress: 0, message: '', error: '' };
  renderGithubSyncIndicator();
  if (state.githubDialogOpen && !$('#githubDialog')?.hidden) renderGithubDialog();
}
function githubSyncProgressMarkup(sync) {
  if (!sync?.active && !sync?.error) return '';
  const progress = Math.max(0, Math.min(100, Number(sync.progress) || 0));
  const fallback = sync.mode === 'download'
    ? (state.language === 'en' ? 'Restoring from GitHub…' : '正在从 GitHub 恢复…')
    : (state.language === 'en' ? 'Backing up to GitHub…' : '正在备份到 GitHub…');
  return '<section class="github-sync-progress' + (sync.active ? ' is-active' : '') + (sync.error ? ' is-error' : '') + '" role="status" aria-live="polite"><div class="github-sync-progress-head"><strong>' + escapeHtml(sync.error || sync.message || fallback) + '</strong><span>' + (sync.error ? '!' : progress + '%') + '</span></div><div class="github-sync-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + progress + '"><span style="width:' + progress + '%"></span></div><small>' + escapeHtml(t('githubBackgroundHint')) + '</small></section>';
}
function consumeGithubOAuthCallback() {
  const marker = '#github-callback?';
  if (!location.hash.startsWith(marker)) return null;
  const params = new URLSearchParams(location.hash.slice(marker.length));
  const result = { token: params.get('access_token') || '', login: params.get('login') || '', error: params.get('error') || '' };
  history.replaceState(null, '', '#mine');
  if (result.token) {
    state.github.token = result.token;
    state.github.user = { login: result.login || 'GitHub' };
    state.github.deviceCode = '';
    state.github.userCode = '';
    state.github.verificationUri = '';
    state.github.verificationUriComplete = '';
    saveGithub();
  }
  return result;
}
function ensureGithubAgreement() {
  if (state.githubAgreementAccepted) return true;
  renderGithubDialog();
  toast(t('githubAgreementRequired'), 'error');
  return false;
}
function githubLogin() {
  if (!ensureGithubAgreement()) return;
  if (state.github.deviceCode) return;
  state.github.clientId = GITHUB_CLIENT_ID;
  saveGithub();
  window.location.assign(GITHUB_OAUTH_PROXY + '/auth/login');
}
async function pollGithubLogin() {
  while (state.github.deviceCode && Date.now() < state.github.expiresAt) {
    await sleep(state.github.interval * 1000);
    if (!state.github.deviceCode) return;
    try {
      const response = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: state.github.clientId, device_code: state.github.deviceCode, grant_type: 'urn:ietf:params:oauth:grant-type:device_code' }) });
      const data = await response.json();
      if (data.access_token) {
        state.github.token = data.access_token; state.github.deviceCode = ''; state.github.verificationUriComplete = '';
        const userResponse = await githubApiFetch('https://api.github.com/user', { headers: githubHeaders() });
        if (!userResponse.ok) throw await githubApiError(userResponse, t('githubAuthExpired'));
        state.github.user = await userResponse.json(); saveGithub(); renderGithubDialog(); queueReaderCloudSync(500);
        toast(state.language === 'en' ? 'GitHub connected' : 'GitHub 已连接'); return;
      }
      if (data.error === 'slow_down') state.github.interval = Math.max(state.github.interval + 5, Number(data.interval || 0));
      if (['access_denied', 'expired_token', 'unsupported_grant_type', 'incorrect_client_credentials'].includes(data.error)) throw Error(data.error_description || data.error);
    } catch (error) { state.github.deviceCode = ''; const message = githubBrowserError(error); renderGithubDialog(); toast(message || (state.language === 'en' ? 'GitHub login failed' : 'GitHub 登录失败'), 'error'); return; }
  }
  state.github.deviceCode = ''; state.github.verificationUriComplete = ''; renderGithubDialog(); toast(state.language === 'en' ? 'GitHub verification expired' : 'GitHub 验证已过期', 'error');
}
function cancelGithubLogin() {
  if (!state.github.deviceCode) return;
  state.github.deviceCode = ''; state.github.userCode = ''; state.github.verificationUri = ''; state.github.verificationUriComplete = '';
  renderGithubDialog();
  toast(state.language === 'en' ? 'GitHub authorization cancelled' : '已取消 GitHub 授权');
}
async function githubUseAccessToken() {
  if (!ensureGithubAgreement()) return;
  const token = ($('#githubAccessToken')?.value || '').trim();
  if (!token) return toast(t('githubTokenMissing'), 'error');
  const previousToken = state.github.token;
  const previousUser = state.github.user;
  state.github.token = token;
  try {
    const response = await githubApiFetch('https://api.github.com/user', { headers: githubHeaders() });
    const data = await response.json();
    if (!response.ok || !data.login) throw Error(t('githubTokenInvalid'));
    state.github.user = data;
    state.github.manualTokenOpen = false;
    saveGithub(); renderGithubDialog();
    queueReaderCloudSync(500);
    toast(t('githubTokenConnected'));
  } catch (error) {
    state.github.token = previousToken;
    state.github.user = previousUser;
    renderGithubDialog();
    toast(error.message || t('githubTokenInvalid'), 'error');
  }
}
async function findGithubGists(includeOtherBackups = false, initialCandidates = []) {
  const candidates = [];
  const seen = new Set();
  const listedOrder = new Map();
  const addCandidate = (gist, order = Number.MAX_SAFE_INTEGER) => {
    if (!gist?.id || seen.has(gist.id) || gist.description !== 'OneBox settings sync' || !gist.files?.['onebox-settings.json']) return;
    seen.add(gist.id);
    candidates.push(gist);
    listedOrder.set(gist.id, order);
  };
  (Array.isArray(initialCandidates) ? initialCandidates : []).forEach((gist, index) => addCandidate(gist, index));
  if (state.github.gistId && !seen.has(state.github.gistId)) {
    const known = await githubApiFetch('https://api.github.com/gists/' + encodeURIComponent(state.github.gistId), { headers: githubHeaders(), cache: 'no-store' });
    if (known.ok) {
      const gist = await known.json();
      if (gist?.id) githubDetailedGists.add(gist);
      addCandidate(gist);
    }
    else if (![404, 410].includes(known.status)) {
      throw await githubApiError(known, state.language === 'en' ? 'Could not access the saved OneBox Gist' : '无法访问已保存的 OneBox Gist');
    }
    if (!candidates.length) {
      state.github.gistId = '';
      saveGithub();
    }
  }
  // The saved Gist is the normal sync path. Search only one page when it is
  // missing; older backups are scanned in a small, explicit recovery pass.
  if (candidates.length && !includeOtherBackups) return candidates;
  const maxPages = includeOtherBackups ? 2 : 1;
  for (let page = 1; page <= maxPages; page += 1) {
    const response = await githubApiFetch('https://api.github.com/gists?per_page=100&page=' + page, { headers: githubHeaders(), cache: 'no-store' });
    if (!response.ok) throw await githubApiError(response);
    const gists = await response.json();
    if (!Array.isArray(gists)) throw Error(t('githubSyncReadFailed'));
    gists.forEach((item, index) => {
      const order = (page - 1) * 100 + index;
      if (seen.has(item?.id)) listedOrder.set(item.id, Math.min(listedOrder.get(item.id) ?? Number.MAX_SAFE_INTEGER, order));
      else addCandidate(item, order);
    });
    if (gists.length < 100) break;
  }
  const updatedAt = (gist) => Date.parse(gist?.updated_at || gist?.created_at || '') || 0;
  return candidates.sort((left, right) => updatedAt(right) - updatedAt(left) || (listedOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (listedOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER));
}
async function findGithubGist() {
  let candidates = await findGithubGists();
  let found = candidates[0];
  if (!found) {
    candidates = await findGithubGists(true, candidates);
    found = candidates[0];
  }
  if (found?.id) {
    state.github.gistId = found.id;
    saveGithub();
  }
  return found || null;
}
const GITHUB_SYNC_UPLOAD_BATCH_CHARS = 2100000;
function githubSyncUploadBatches(entries) {
  const batches = [];
  let current = {};
  let size = 0;
  entries.forEach(([name, value]) => {
    const content = value === null ? null : String(value ?? '');
    if (content !== null && !content.trim().length) {
      throw Error((state.language === 'en' ? 'GitHub sync file is empty: ' : 'GitHub 同步文件内容为空：') + name);
    }
    const weight = (content ? content.length : 0) + String(name).length + 64;
    if (Object.keys(current).length && size + weight > GITHUB_SYNC_UPLOAD_BATCH_CHARS) {
      batches.push(current);
      current = {};
      size = 0;
    }
    current[name] = content === null ? null : { content };
    size += weight;
  });
  if (Object.keys(current).length) batches.push(current);
  return batches;
}
async function githubPatchGistFiles(id, files) {
  const normalizedFiles = {};
  Object.entries(files || {}).forEach(([name, value]) => {
    if (value === null) {
      normalizedFiles[name] = null;
      return;
    }
    const content = typeof value === 'object' && value !== null ? value.content : value;
    if (typeof content !== 'string' || !content.trim().length) {
      throw Error((state.language === 'en' ? 'GitHub sync file is empty: ' : 'GitHub 同步文件内容为空：') + name);
    }
    normalizedFiles[name] = { content };
  });
  if (!Object.keys(normalizedFiles).length) return await githubGistDetails({ id });
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await githubApiFetch('https://api.github.com/gists/' + id, { method: 'PATCH', headers: githubHeaders(true), body: JSON.stringify({ files: normalizedFiles }) });
    if (response.ok) {
      const updated = await response.json();
      return updated?.files ? updated : await githubGistDetails({ id });
    }
    lastError = await githubApiError(response);
    const retryable = response.status === 422 && !lastError.githubErrors?.length && attempt < 2;
    if (!retryable) throw lastError;
    await sleep(1200 * (attempt + 1));
  }
  throw lastError || Error(state.language === 'en' ? 'GitHub request failed' : 'GitHub 请求失败');
}
function verifyGithubAssetMetadata(payload, gist) {
  const manifests = [payload?.readerFiles?.books, payload?.ticketWalletFiles?.images].filter((value) => value && typeof value === 'object');
  for (const manifest of manifests) {
    for (const entry of Object.values(manifest)) {
      if (!Array.isArray(entry?.files) || !entry.files.length || !Number.isFinite(Number(entry.size))) continue;
      let encodedSize = 0;
      let allSizesKnown = true;
      for (const name of entry.files) {
        const file = gist?.files?.[name];
        if (!file) throw Error((state.language === 'en' ? 'GitHub response is missing an original file: ' : 'GitHub 响应中缺少原文件：') + name);
        if (Number.isFinite(Number(file.size))) encodedSize += Number(file.size);
        else allSizesKnown = false;
      }
      const expectedSize = Math.ceil(Number(entry.size) / 3) * 4;
      if (allSizesKnown && encodedSize !== expectedSize) throw Error(state.language === 'en' ? 'GitHub original file size check failed' : 'GitHub 原文件大小校验失败');
    }
  }
}
async function verifyGithubSettingsPayload(bundle, id, initialGist) {
  const expectedContent = String(bundle.files?.['onebox-settings.json'] || '');
  const expectedSize = new TextEncoder().encode(expectedContent).length;
  const candidates = [initialGist];
  let lastError = null;
  const tryCandidate = async (gist) => {
    const file = gist?.files?.['onebox-settings.json'];
    if (!file) return null;
    try {
      const payload = parseGithubSyncPayload(await githubFileContent(file));
      if (payload?.savedAt === bundle.payload.savedAt) return { payload, gist };
      lastError = Error(state.language === 'en' ? 'GitHub did not persist the latest OneBox data' : 'GitHub 没有保存最新的 OneBox 数据');
    } catch (error) {
      lastError = error;
    }
    return null;
  };
  const initialResult = await tryCandidate(initialGist);
  if (initialResult) return initialResult;
  try {
    const freshGist = await githubGistDetails({ id });
    candidates.push(freshGist);
    const freshResult = await tryCandidate(freshGist);
    if (freshResult) return freshResult;
  } catch (error) {
    lastError = error;
  }
  if (lastError?.code === 'github-auth-expired') throw lastError;
  const reportedFile = candidates[candidates.length - 1]?.files?.['onebox-settings.json'] || initialGist?.files?.['onebox-settings.json'];
  if (Number.isFinite(Number(reportedFile?.size)) && Number(reportedFile.size) === expectedSize) {
    return { payload: bundle.payload, gist: candidates[candidates.length - 1] || initialGist };
  }
  throw lastError || Error(state.language === 'en' ? 'GitHub sync settings could not be verified' : 'GitHub 同步设置无法校验');
}
async function findExistingGithubSyncTarget(onProgress = null, forceNew = false) {
  if (forceNew) return null;
  onProgress?.(14, githubSyncLabel('upload', 'gist'));
  const found = await findGithubGist();
  if (!found?.id) return null;
  const gist = githubDetailedGists.has(found) ? found : await githubGistDetails(found);
  try {
    const remote = parseGithubSyncPayload(await githubFileContent(gist.files?.['onebox-settings.json']));
    return { id: gist.id, gist, remote, created: false };
  } catch (error) {
    if (error?.code === 'github-auth-expired') throw error;
    // Replace a damaged or legacy settings file after a complete local bundle
    // has been prepared, so a failed local read never creates an empty backup.
    if (state.github.gistId === gist.id) { state.github.gistId = ''; saveGithub(); }
    return null;
  }
}
async function createGithubSyncTarget(bundle, onProgress = null) {
  onProgress?.(55, githubSyncLabel('upload', 'gist'));
  const settingsContent = bundle?.files?.['onebox-settings.json'];
  if (typeof settingsContent !== 'string') throw Error(state.language === 'en' ? 'OneBox settings file is missing' : 'OneBox 设置文件缺失');
  const created = await githubApiFetch('https://api.github.com/gists', { method: 'POST', headers: githubHeaders(true), body: JSON.stringify({ description: 'OneBox settings sync', public: false, files: { 'onebox-settings.json': { content: settingsContent } } }) });
  if (!created.ok) throw await githubApiError(created);
  const gist = await created.json();
  if (!gist.id) throw Error(state.language === 'en' ? 'GitHub did not return a Gist id' : 'GitHub 未返回 Gist 标识');
  githubDetailedGists.add(gist);
  state.github.gistId = gist.id;
  saveGithub();
  return { id: gist.id, gist, remote: null, created: true };
}
function githubFilesMissingField(error) {
  return error?.status === 422 && Array.isArray(error.githubErrors)
    && error.githubErrors.some((item) => item?.field === 'files' && item?.code === 'missing_field');
}
async function githubUpload(allowFreshGistRetry = true, forceNewGist = false) {
  if (!state.github.token) return toast(state.language === 'en' ? 'Connect GitHub first' : '请先连接 GitHub', 'error');
  if (state.githubSync.active) return;
  return withGithubSyncTabLock(() => githubUploadTask(allowFreshGistRetry, forceNewGist));
}
async function githubUploadTask(allowFreshGistRetry = true, forceNewGist = false) {
  if (state.githubSync.active) return;
  const mode = 'upload';
  updateGithubSync(mode, 4, githubSyncLabel(mode, 'preparing'));
  try {
    const target = await findExistingGithubSyncTarget((progress, message) => updateGithubSync(mode, progress, message), forceNewGist);
    updateGithubSync(mode, 18, githubSyncLabel(mode, 'bundle'));
    const bundle = await buildGithubSyncBundle(target?.remote || null, target?.gist || null, (progress, message) => updateGithubSync(mode, 18 + Math.round(progress * .3), message));
    const mergedBundle = mergeGithubUploadBundle(bundle, target?.remote || null);
    const syncTarget = target || await createGithubSyncTarget(mergedBundle, (progress, message) => updateGithubSync(mode, progress, message));
    const id = syncTarget.id;
    updateGithubSync(mode, 58, githubSyncLabel(mode, 'upload'));
    // Upload real content only. Old book chunks are intentionally retained as
    // unreachable Gist files: deleting them via PATCH is a known source of
    // GitHub's ambiguous `files missing_field` 422 response, and the manifest
    // below is the authoritative list used during restore.
    const entries = Object.entries(mergedBundle.files).filter(([name]) => name !== 'onebox-settings.json');
    const batches = githubSyncUploadBatches(entries);
    let verified = syncTarget.gist;
    for (let index = 0; index < batches.length; index += 1) {
      updateGithubSync(mode, 60 + Math.round((index / Math.max(1, batches.length)) * 23), githubSyncLabel(mode, 'upload'));
      verified = await githubPatchGistFiles(id, batches[index]);
    }
    // A newly created Gist already contains this manifest. Existing Gists get
    // the manifest last, after changed source files have been uploaded.
    if (!syncTarget.created) {
      updateGithubSync(mode, 84, githubSyncLabel(mode, 'finishing'));
      verified = await githubPatchGistFiles(id, { 'onebox-settings.json': { content: mergedBundle.files['onebox-settings.json'] } });
    }
    const settingsVerification = await verifyGithubSettingsPayload(mergedBundle, id, verified);
    verified = settingsVerification.gist || verified;
    const missingFiles = Object.keys(mergedBundle.files).filter((name) => !verified?.files?.[name]);
    if (missingFiles.length) throw Error((state.language === 'en' ? 'GitHub response is missing OneBox files: ' : 'GitHub 响应中缺少 OneBox 文件：') + missingFiles.slice(0, 3).join(', '));
    const verifiedPayload = settingsVerification.payload;
    updateGithubSync(mode, 94, githubSyncLabel(mode, 'finishing'));
    verifyGithubAssetMetadata(verifiedPayload, verified);
    finishGithubSync(mode, state.language === 'en' ? 'Upload complete' : '上传完成');
    toast(state.language === 'en' ? 'OneBox data uploaded to GitHub' : 'OneBox 数据已上传到 GitHub', 'info');
  } catch (error) {
    if (allowFreshGistRetry && githubFilesMissingField(error)) {
      state.github.gistId = '';
      saveGithub();
      state.githubSync.active = false;
      return githubUploadTask(false, true);
    }
    const detail = githubBrowserError(error) || (state.language === 'en' ? 'GitHub upload failed' : 'GitHub 上传失败，请重试');
    const stage = state.githubSync.message;
    const message = detail + (error.githubRequestMethod ? ' (' + error.githubRequestMethod + ' · ' + stage + ')' : '');
    finishGithubSync(mode, state.language === 'en' ? 'Upload failed' : '上传失败', message);
    toast((state.language === 'en' ? 'GitHub upload failed: ' : 'GitHub 上传失败：') + message, 'error');
  }
}
async function githubDownload() {
  if (!state.github.token) return toast(state.language === 'en' ? 'Connect GitHub first' : '请先连接 GitHub', 'error');
  if (state.githubSync.active) return;
  return withGithubSyncTabLock(githubDownloadTask);
}
async function githubDownloadTask() {
  if (state.githubSync.active) return;
  const mode = 'download';
  let ticketRestore = { missingIds: [] };
  updateGithubSync(mode, 5, githubSyncLabel(mode, 'preparing'));
  try {
    updateGithubSync(mode, 24, githubSyncLabel(mode, 'gist'));
    let candidates = await findGithubGists();
    if (!candidates.length) candidates = await findGithubGists(true, candidates);
    if (!candidates.length) throw Error(t('githubSyncNotFound'));
    updateGithubSync(mode, 42, githubSyncLabel(mode, 'download'));
    const readingEnabled = githubSyncCustomGroupEnabled('reading');
    let gist = null;
    let remote = null;
    let newestReadableBackup = null;
    let newestReadingBackup = null;
    const assetFiles = {};
    let lastError = null;
    const collectAssetFiles = (files) => {
      Object.entries(files || {}).forEach(([name, file]) => {
        if ((name.startsWith('onebox-book-') || name.startsWith('onebox-ticket-')) && !assetFiles[name]) assetFiles[name] = file;
      });
    };
    for (const candidate of candidates) {
      collectAssetFiles(candidate.files);
      const needsPayload = !newestReadableBackup || readingEnabled && !newestReadingBackup;
      if (!needsPayload) continue;
      try {
        const restored = await readGithubGistPayload(candidate);
        if (!newestReadableBackup) newestReadableBackup = restored;
        collectAssetFiles(restored.gist?.files);
        if (readingEnabled && !newestReadingBackup && readerSyncHasLibrary(restored.remote)) newestReadingBackup = restored;
      } catch (error) {
        lastError = error;
        if (error?.code === 'github-auth-expired') throw error;
      }
    }
    const selectedBackup = newestReadableBackup || newestReadingBackup;
    if (selectedBackup) { remote = selectedBackup.remote; gist = selectedBackup.gist; }
    if (!gist?.id || !remote) throw lastError || Error(t('githubSyncInvalidData'));
    const mergedAssetFiles = { ...(gist.files || {}) };
    Object.entries(assetFiles).forEach(([name, file]) => {
      const current = mergedAssetFiles[name];
      mergedAssetFiles[name] = current
        ? { ...file, ...current, content: typeof current.content === 'string' && current.content ? current.content : file.content }
        : file;
    });
    gist = { ...gist, files: mergedAssetFiles };
    if (readingEnabled && newestReadingBackup && newestReadingBackup !== selectedBackup) {
      const readingRemote = newestReadingBackup.remote;
      remote = { ...remote, library: readerSyncLibrary(readingRemote) };
      ['readerFiles', 'readerPreferences', 'readerLayout', 'homeFeedRead'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(readingRemote, key)) remote[key] = readingRemote[key];
      });
    }
    if (readingEnabled && gist?.id) {
      let readerRepair = repairReaderSyncManifest(remote, gist);
      if (!readerRepair.hasAllSources && readerSyncHasLibrary(remote)) {
        updateGithubSync(mode, 50, state.language === 'en' ? 'Looking for book files in older backups…' : '正在旧备份中查找书籍原文件…');
        const expandedCandidates = await findGithubGists(true, candidates);
        expandedCandidates.forEach((candidate) => collectAssetFiles(candidate.files));
        const expandedFiles = { ...(gist.files || {}) };
        Object.entries(assetFiles).forEach(([name, file]) => {
          if (!expandedFiles[name]) expandedFiles[name] = file;
        });
        gist = { ...gist, files: expandedFiles };
        readerRepair = repairReaderSyncManifest(remote, gist);
      }

      // A later backup may have removed a book from its shelf metadata while
      // older Gist revisions still retain both the book record and its file.
      // Inspect a small recent history window when the current backup is empty
      // or its source files are incomplete, then restore those recoverable books.
      if (!readerRepair.hasAllSources || readerSyncLibrary(remote).length === 0 || readerSyncHasOrphanedBookAssets(remote, gist)) {
        updateGithubSync(mode, 54, state.language === 'en' ? 'Looking through recent book backups…' : '正在最近的备份版本中查找书籍…');
        const recovered = await recoverReaderBooksFromGistHistory(remote, gist);
        remote = recovered.remote;
        gist = recovered.gist;
        readerRepair = repairReaderSyncManifest(remote, gist);
      }
      remote = readerRepair.remote;
    }
    const id = gist.id;
    updateGithubSync(mode, 67, githubSyncLabel(mode, 'restore'));
    const settingsEnabled = githubSyncCustomGroupEnabled('settings');
    const navigationEnabled = githubSyncCustomGroupEnabled('navigation');
    const messagesEnabled = githubSyncCustomGroupEnabled('messages');
    const readerRestore = readingEnabled
      ? await restoreReaderSyncAssets(remote, gist, (completed, total) => updateGithubSync(mode, 67 + Math.round(completed / Math.max(1, total) * 16), state.language === 'en' ? 'Restoring books…' : '正在恢复书籍…'))
      : { library: null, missingBooks: [] };
    if (githubSyncCustomGroupEnabled('ticketWallet')) {
      updateGithubSync(mode, 84, state.language === 'en' ? 'Restoring wallet originals…' : '正在恢复卡包原件…');
      ticketRestore = await restoreTicketWalletSyncAssets(remote, gist, (completed, total) => updateGithubSync(mode, 84 + Math.round(completed / Math.max(1, total) * 10), state.language === 'en' ? 'Restoring wallet originals…' : '正在恢复卡包原件…'));
    }
    applyRemoteStorageSnapshot(remote.storage);
    if (settingsEnabled && ['light', 'dark', 'dark-gray', 'system'].includes(remote.theme)) { state.theme = remote.theme; localStorage.setItem(STORAGE.theme, state.theme); }
    if (settingsEnabled && ['mono', 'purple', 'blue', 'green', 'yellow'].includes(remote.color)) { state.color = remote.color; saveColorPreference(); }
    if (settingsEnabled && (remote.languageMode || remote.language)) { state.languageMode = ['zh', 'en', 'system'].includes(remote.languageMode || remote.language) ? (remote.languageMode || remote.language) : 'system'; localStorage.setItem(STORAGE.language, state.languageMode); }
    const remoteNavigationLocation = remote.navigationLocation === 'tools' ? 'tools' : remote.navigationLocation === 'main' ? 'main' : null;
    if (navigationEnabled && Array.isArray(remote.toolOrder)) { state.toolOrder = normalizeToolOrder(remote.toolOrder, remoteNavigationLocation === 'tools', remoteNavigationLocation === 'tools'); saveToolOrder(); }
    if (githubSyncCustomGroupEnabled('calculator') && remote.calculator) saveStored(STORAGE.calculator, mergeGithubValue(parseStored(STORAGE.calculator, {}), remote.calculator));
    hydrateCalculatorFromStorage();
    if (githubSyncCustomGroupEnabled('calendar') && remote.events) { state.events = mergeGithubValue(state.events, remote.events); saveEvents(); }
    if (githubSyncCustomGroupEnabled('weather') && Array.isArray(remote.weatherCards)) { state.weatherCards = normalizeWeatherCards(mergeGithubValue(state.weatherCards, remote.weatherCards)); state.activeWeatherId = state.weatherCards[0]?.id || null; saveWeatherCards(); }
    if (githubSyncCustomGroupEnabled('translation') && Array.isArray(remote.translationHistory)) { state.translationHistory = mergeGithubValue(state.translationHistory, remote.translationHistory); saveTranslationHistory(); }
    if (messagesEnabled && Array.isArray(remote.notifications)) { state.notifications = mergeGithubValue(state.notifications, remote.notifications); saveNotifications(); }
    if (readingEnabled && Array.isArray(readerRestore.library)) {
      const restoredIds = new Set(readerRestore.restoredIds || []);
      state.library = mergeGithubValue(state.library, readerRestore.library).map((book) => {
        if (!book || !restoredIds.has(book.id) || !book.syncFileMissing) return book;
        const { syncFileMissing, ...available } = book;
        return available;
      });
      saveLibrary();
    }
    if (readingEnabled && remote.readerPreferences && typeof remote.readerPreferences === 'object') { state.readerPreferences = { ...state.readerPreferences, ...remote.readerPreferences }; saveReaderPreferences(); }
    if (readingEnabled && (remote.readerLayout === 'list' || remote.readerLayout === 'grid')) { state.readerLayout = remote.readerLayout; saveReaderLayout(); }
    if (githubSyncCustomGroupEnabled('translation') && typeof remote.translationHistoryOpen === 'boolean') { state.translationHistoryOpen = remote.translationHistoryOpen; saveStored(STORAGE.translationHistoryOpen, state.translationHistoryOpen); }
    if (readingEnabled && remote.homeFeedRead && typeof remote.homeFeedRead === 'object') { state.homeFeedRead = mergeGithubValue(state.homeFeedRead, remote.homeFeedRead); saveHomeFeedRead(); }
    if (settingsEnabled && (remote.layoutMode === 'simple' || remote.layoutMode === 'classic')) { state.layoutMode = remote.layoutMode; saveLayoutPreference(); }
    if (settingsEnabled && remote.topDisplay && typeof remote.topDisplay === 'object') { state.topDisplay = { theme: remote.topDisplay.theme !== false, language: remote.topDisplay.language !== false, messages: remote.topDisplay.messages !== false }; saveTopDisplay(); }
    if (navigationEnabled && Array.isArray(remote.homeFeedOrder)) { state.homeFeed.order = normalizeHomeFeedOrder(remote.homeFeedOrder); saveHomeFeedOrder(); }
    if (navigationEnabled && Array.isArray(remote.homeFeedVisibility)) { state.homeFeed.visible = normalizeHomeFeedVisibility(remote.homeFeedVisibility); saveHomeFeedVisibility(); }
    const remoteNavigation = remoteGithubNavigation(remote);
    if (navigationEnabled && remoteNavigation && Array.isArray(remoteNavigation.items)) { state.navigation = mergeGithubNavigation(state.navigation, remoteNavigation); saveNavigation(); }
    if (navigationEnabled && remoteNavigationLocation) {
      state.navigationLocation = remoteNavigationLocation;
      state.toolOrder = normalizeToolOrder(state.toolOrder, state.navigationLocation === 'tools', state.navigationLocation === 'tools');
      localStorage.setItem(STORAGE.navigationLocation, state.navigationLocation);
      saveToolOrder();
      if (state.navigationLocation === 'tools' && state.section === 'navigation') state.section = 'tools', state.tool = 'navigation';
      if (state.navigationLocation === 'main' && state.section === 'tools' && state.tool === 'navigation') state.section = 'navigation';
    }
    if (settingsEnabled && typeof remote.footprint === 'boolean') { state.footprint = remote.footprint; saveFootprintPreference(); }
    if (settingsEnabled && typeof remote.mascotVisible === 'boolean') { state.mascotVisible = remote.mascotVisible; saveMascotVisibility(); }
    if (settingsEnabled && (remote.mascotDisplayMode === 'full' || remote.mascotDisplayMode === 'half')) { state.mascotDisplayMode = remote.mascotDisplayMode; saveMascotDisplayMode(); }
    if (settingsEnabled && remote.mascotPosition && Number.isFinite(Number(remote.mascotPosition.left)) && Number.isFinite(Number(remote.mascotPosition.top))) {
      const position = { left: Number(remote.mascotPosition.left), top: Number(remote.mascotPosition.top) };
      saveStored(STORAGE.mascotPosition, position);
      if (mascotRuntime.root) mascotSetPosition(position.left, position.top, false);
    }
    if (settingsEnabled && remote.petProfile && typeof remote.petProfile === 'object') { state.petProfile = normalizePetProfile(remote.petProfile); savePetProfile(); }
    if (messagesEnabled && (remote.notificationPreference === 'deny' || remote.notificationPreference === 'allow')) { state.notificationPreference = remote.notificationPreference; saveStored(STORAGE.notificationPreference, state.notificationPreference); }
    if (navigationEnabled && (remote.openMode === 'new-tab' || remote.openMode === 'current')) { state.openMode = remote.openMode; saveStored(STORAGE.openMode, state.openMode); }
    hydrateGithubRuntimeState();
    state.github.gistId = id; saveGithub(); applyLanguage(); syncMascotDisplayMode(true); syncMascotVisibility(); renderNav(); render();
    const missingBooks = readerRestore.missingBooks || [];
    const missingWalletImages = ticketRestore.missingIds || [];
    const recoveryNotes = [];
    if (missingBooks.length) recoveryNotes.push(state.language === 'en'
      ? missingBooks.length + ' book(s) are missing source files. Upload again from the device that still has them.'
      : missingBooks.length + ' 本书缺少原文件，请在仍保存原书的设备重新上传。');
    if (missingWalletImages.length) recoveryNotes.push(state.language === 'en'
      ? missingWalletImages.length + ' wallet original(s) could not be verified. Other data was restored; upload again from the device that still has the originals.'
      : missingWalletImages.length + ' 张卡包原件未能通过校验，其他数据已恢复。请在仍保存原件的设备重新上传卡包。');
    const restoreSummary = recoveryNotes.length
      ? (state.language === 'en' ? 'Restore completed with missing files: ' : '恢复完成，但有文件缺失：') + recoveryNotes.join(' ')
      : (state.language === 'en' ? 'Restore complete' : '恢复完成');
    finishGithubSync(mode, restoreSummary);
    toast(recoveryNotes.length ? restoreSummary : (state.language === 'en' ? 'OneBox data restored from GitHub' : '已从 GitHub 恢复 OneBox 数据'), 'info');
    queueReaderCloudSync(500);
  } catch (error) {
    const message = githubBrowserError(error) || (state.language === 'en' ? 'GitHub restore failed' : 'GitHub 恢复失败');
    finishGithubSync(mode, state.language === 'en' ? 'Restore failed' : '恢复失败', message);
    toast((state.language === 'en' ? 'GitHub restore failed: ' : 'GitHub 恢复失败：') + message, 'error');
  }
}
function disconnectGithub() {
  state.github = { clientId: GITHUB_CLIENT_ID, token: '', user: null, gistId: '', deviceCode: '', userCode: '', verificationUri: '', verificationUriComplete: '', expiresAt: 0, interval: 5, manualTokenOpen: false };
  window.OneBoxReaderCloudSync?.invalidateSession();
  saveGithub(); renderGithubDialog(); toast(state.language === 'en' ? 'GitHub disconnected' : '已退出 GitHub');
}
function renderAgreementDialog() {
  const dialog = $('#agreementDialog');
  if (!dialog) return;
  const sections = ['agreementIntro', 'agreementLocal', 'agreementNetwork', 'agreementGithub', 'agreementPermissions', 'agreementDisclaimer'];
  const body = sections.map((key, index) => index === 0 ? '<p class="agreement-intro">' + escapeHtml(t(key)) + '</p>' : '<section class="agreement-section"><h3>' + escapeHtml(t(key).split('：')[0].split(':')[0]) + '</h3><p>' + escapeHtml(t(key)) + '</p></section>').join('');
  dialog.innerHTML = '<div class="dialog-card agreement-dialog-card" role="dialog" aria-modal="true"><div class="dialog-head"><div><h2>' + t('agreementTitle') + '</h2></div><button class="icon-btn small" data-close-agreement aria-label="' + t('close') + '">×</button></div><div class="agreement-body">' + body + '</div><p class="settings-note agreement-updated">' + t('agreementUpdated') + ' · OneBox ' + APP_VERSION + '</p></div>';
  dialog.hidden = false;
}
function closeAgreementDialog() { const dialog = $('#agreementDialog'); if (dialog) dialog.hidden = true; }
function startAccountLogin(providerId) {
  const provider = ACCOUNT_LOGIN_PROVIDERS.find((item) => item.id === providerId && item.enabled);
  if (!provider) return;
  return provider.connect();
}
function accountProviderIcon(providerId) {
  const icons = {
    github: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.1c-3.1.67-3.75-1.32-3.75-1.32-.5-1.29-1.24-1.63-1.24-1.63-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.62 1.22 3.26.93.1-.72.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.53 0-1.22.44-2.22 1.16-3-.12-.29-.5-1.42.11-2.96 0 0 .95-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.1-1.45 3.04-1.15 3.04-1.15.61 1.54.23 2.67.12 2.96.72.78 1.15 1.78 1.15 3.01 0 4.3-2.61 5.24-5.1 5.52.4.34.76 1.02.76 2.06v3.05c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/></svg>',
    wechat: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M10.2 3.2c-4.45 0-8.05 2.9-8.05 6.48 0 2.02 1.17 3.83 3 5.02l-.65 2.1 2.63-1.3c.94.32 1.97.5 3.07.5.18 0 .35 0 .52-.02a5.75 5.75 0 0 1-.27-1.72c0-3.22 3.15-5.83 7.03-5.83.35 0 .69.02 1.02.07-.48-3.02-3.97-5.3-8.3-5.3Z"/><path fill="currentColor" d="M21.85 14.27c0-2.76-2.76-5-6.16-5s-6.16 2.24-6.16 5 2.76 5 6.16 5c.84 0 1.64-.13 2.36-.38l2.01 1-.5-1.6c1.4-.91 2.29-2.37 2.29-4.02Z"/><circle cx="7.2" cy="9.2" r=".8" fill="#fff"/><circle cx="12.5" cy="9.2" r=".8" fill="#fff"/><circle cx="13.45" cy="14.1" r=".68" fill="#fff"/><circle cx="17.95" cy="14.1" r=".68" fill="#fff"/></svg>',
    apple: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.35 12.7c.02 2.56 2.25 3.41 2.28 3.42-.02.06-.36 1.22-1.17 2.42-.7 1.03-1.43 2.05-2.57 2.07-1.12.03-1.48-.67-2.76-.67-1.28 0-1.68.65-2.74.7-1.1.04-1.94-1.1-2.64-2.12-1.44-2.08-2.53-5.87-1.05-8.43a4.1 4.1 0 0 1 3.45-2.1c1.08-.02 2.1.73 2.76.73.65 0 1.88-.9 3.17-.77.54.02 2.06.22 3.04 1.66-.08.05-1.82 1.06-1.8 3.09ZM14.3 5.9c.58-.7.97-1.67.87-2.64-.84.03-1.86.56-2.46 1.25-.54.62-1.01 1.6-.88 2.54.94.07 1.9-.48 2.47-1.15Z"/></svg>',
  };
  return '<span class="account-provider-icon account-provider-icon-' + escapeHtml(providerId) + '" aria-hidden="true">' + (icons[providerId] || '') + '</span>';
}
function renderGithubDialog() {
  const dialog = $('#githubDialog');
  if (!dialog) return;
  const connected = Boolean(state.github.token && state.github.user);
  const sync = state.githubSync || { active: false, mode: '', progress: 0, message: '', error: '' };
  const syncing = Boolean(sync.active);
  const waiting = Boolean(state.github.deviceCode);
  const agreementChecked = state.githubAgreementAccepted === true;
  const selection = normalizeGithubSyncSelection(state.githubSyncSelection);
  const providerActions = waiting
    ? '<div class="github-waiting-actions"><button class="github-secondary-button github-connect" disabled>' + t('githubWaiting') + '</button><button class="github-secondary-button github-cancel" data-github-cancel>' + t('githubCancel') + '</button></div>'
    : ACCOUNT_LOGIN_PROVIDERS.map((provider) => '<button class="account-login-method' + (provider.enabled ? '' : ' is-unavailable') + '" ' + (provider.enabled ? 'data-auth-provider="' + escapeHtml(provider.id) + '" ' + (!agreementChecked ? 'disabled' : '') : 'disabled aria-disabled="true"') + '>' + accountProviderIcon(provider.id) + '<strong class="account-login-method-name">' + escapeHtml(provider.name) + '</strong><small class="account-login-method-detail">' + t(provider.detailKey) + '</small></button>').join('');
  const account = connected
    ? '<div class="github-status-card is-connected"><span class="github-status-icon github-avatar' + (githubAvatarUrl(state.github.user) ? '' : ' is-fallback') + '">' + githubAvatarMarkup(state.github.user) + '</span><span class="github-status-copy"><small class="github-status-provider">GitHub</small><strong>' + escapeHtml(state.github.user.login || 'GitHub') + '</strong><small>' + t('githubConnectedHint') + '</small></span><span class="github-status-badge"><i aria-hidden="true">✓</i><span>' + t('githubConnected') + '</span></span></div>'
    : '<div class="github-status-card github-not-connected-card"><div class="github-login-intro"><strong>' + t('githubLoginTitle') + '</strong><small>' + t('githubNotConnectedHint') + '</small></div><label class="github-agreement-check"><input id="githubAgreement" type="checkbox" ' + (agreementChecked ? 'checked' : '') + '><span>' + t('githubAgreementCheck') + ' <button type="button" class="github-agreement-link" data-open-agreement>' + t('viewAgreement') + '</button></span></label><div class="account-login-methods">' + providerActions + '</div></div>';
  const code = state.github.userCode ? '<div class="device-code"><div><small>' + (state.language === 'en' ? 'Authorize OneBox in GitHub' : '请在 GitHub 中授权 OneBox') + '</small><strong>' + escapeHtml(state.github.userCode) + '</strong><small>' + escapeHtml(t('githubWaiting')) + '</small></div><a class="github-device-link" href="' + escapeHtml(state.github.verificationUriComplete || state.github.verificationUri || 'https://github.com/login/device') + '" target="_blank" rel="noreferrer">' + t('openDevice') + '</a></div>' : '';
  const manualToken = state.github.manualTokenOpen && !connected ? '<section class="github-manual-token"><label for="githubAccessToken">' + t('githubAccessToken') + '</label><input id="githubAccessToken" type="password" placeholder="github_pat_…" autocomplete="off"><p>' + t('githubTokenHint') + '</p><button class="github-secondary-button" data-github-token>' + t('githubUseToken') + '</button></section>' : '';
  const actionButton = (type, label, icon, primary = false) => '<button class="github-action-button' + (primary ? ' is-primary' : '') + '" data-github-' + type + (syncing ? ' disabled' : '') + '><span class="github-action-icon" aria-hidden="true">' + icon + '</span><span class="github-action-copy"><strong>' + label + '</strong></span></button>';
  const uploadIcon = '<svg viewBox="0 0 24 24"><path d="M5 17.5a4.5 4.5 0 0 1 .8-8.93A6.5 6.5 0 0 1 18 10.5h.5a3.5 3.5 0 0 1 0 7H15"/><path d="M12 20V10m0 0-3 3m3-3 3 3"/></svg>';
  const downloadIcon = '<svg viewBox="0 0 24 24"><path d="M5 17.5a4.5 4.5 0 0 1 .8-8.93A6.5 6.5 0 0 1 18 10.5h.5a3.5 3.5 0 0 1 0 7H15"/><path d="M12 7v10m0 0-3-3m3 3 3-3"/></svg>';
  const logoutIcon = '<svg viewBox="0 0 24 24"><path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10"/><path d="M13 8l4 4-4 4M8 12h9"/></svg>';
  const syncOptionCount = Object.values(selection).filter(Boolean).length;
  const customSync = connected ? '<section class="github-custom-sync"><div class="github-custom-sync-head"><span><strong>' + t('githubCustomSync') + '</strong><small>' + t('githubCustomSyncHint') + '</small></span><span class="github-sync-selected-count">' + syncOptionCount + ' / 9</span></div><div class="github-sync-options">' + [['settings', 'githubOptionSettings'], ['navigation', 'githubOptionNavigation'], ['reading', 'githubOptionReading'], ['messages', 'githubOptionMessages'], ['calendar', 'githubOptionCalendar'], ['weather', 'githubOptionWeather'], ['translation', 'githubOptionTranslation'], ['calculator', 'githubOptionCalculator'], ['ticketWallet', 'githubOptionTicketWallet']].map(([key, label]) => '<label class="github-sync-option setting-toggle"><input type="checkbox" data-github-sync-option="' + key + '" ' + (selection[key] ? 'checked' : '') + '><span>' + t(label) + '</span></label>').join('') + '</div></section>' : '';
  const syncProgress = syncing ? githubSyncProgressMarkup(sync) : '';
  const actions = connected
    ? '<div class="github-action-grid">' + actionButton('upload', t('githubBackup'), uploadIcon, true) + actionButton('download', t('githubRestore'), downloadIcon) + actionButton('logout', t('githubLogout'), logoutIcon) + '</div>'
    : '';
  dialog.innerHTML = '<div class="dialog-card github-dialog-card" role="dialog" aria-modal="true"><div class="dialog-head github-dialog-head"><div class="github-dialog-title"><h2>' + t('oneboxAccountTitle') + '</h2></div><button class="icon-btn small github-dialog-close" data-close-github aria-label="' + t('close') + '">×</button></div><div class="github-dialog-body"><section class="github-status-section">' + account + '</section>' + code + manualToken + customSync + syncProgress + '</div>' + (actions ? '<section class="github-actions">' + actions + '</section>' : '') + '</div>';
  dialog.hidden = false; state.githubDialogOpen = true;
}
function closeGithubDialog() { const dialog = $('#githubDialog'); if (dialog) dialog.hidden = true; state.githubDialogOpen = false; }
function renderSettings() {
  const dialog = $('#settingsDialog');
  const notificationPreference = state.notificationPreference === 'deny' ? 'deny' : 'allow';
  const openMode = '<div class="settings-preference-row"><h3>' + t('openMode') + '</h3><div class="settings-preference-control"><select id="settingsOpenMode"><option value="current" ' + (state.openMode === 'current' ? 'selected' : '') + '>' + t('openCurrent') + '</option><option value="new-tab" ' + (state.openMode === 'new-tab' ? 'selected' : '') + '>' + t('openNewTab') + '</option></select></div></div>';
  const homeFeeds = '';
  const topDisplay = state.layoutMode === 'classic' ? '<div class="settings-preference-row settings-top-display-row"><h3>' + t('topDisplay') + '</h3><div class="settings-preference-control settings-top-display-control"><label class="setting-toggle"><input type="checkbox" data-top-display="theme" ' + (state.topDisplay.theme ? 'checked' : '') + '><span>' + t('theme') + '</span></label><label class="setting-toggle"><input type="checkbox" data-top-display="language" ' + (state.topDisplay.language ? 'checked' : '') + '><span>' + t('language') + '</span></label></div></div>' : '';
  dialog.innerHTML = '<div class="dialog-card settings-dialog-card" role="dialog" aria-modal="true"><div class="dialog-head"><h2>' + t('settings') + '</h2><button class="icon-btn small" data-close-settings aria-label="' + t('close') + '">×</button></div>' +
    '<div class="settings-preferences"><div class="settings-preference-row"><h3>' + t('layout') + '</h3><div class="settings-preference-control"><select id="settingsLayout"><option value="classic" ' + (state.layoutMode === 'classic' ? 'selected' : '') + '>' + t('classicLayout') + '</option><option value="simple" ' + (state.layoutMode === 'simple' ? 'selected' : '') + '>' + t('simpleLayout') + '</option></select></div></div>' + topDisplay + '<div class="settings-preference-row"><h3>' + t('theme') + '</h3><div class="settings-preference-control"><select id="settingsTheme"><option value="system" ' + (state.theme === 'system' ? 'selected' : '') + '>' + t('system') + '</option><option value="light" ' + (state.theme === 'light' ? 'selected' : '') + '>' + t('light') + '</option><option value="dark" ' + (state.theme === 'dark' ? 'selected' : '') + '>' + t('dark') + '</select></div></div><div class="settings-preference-row"><h3>' + t('color') + '</h3><div class="settings-preference-control"><select id="settingsColor"><option value="mono" ' + (state.color === 'mono' ? 'selected' : '') + '>' + t('blackWhite') + '</option><option value="purple" ' + (state.color === 'purple' ? 'selected' : '') + '>' + t('noblePurple') + '</option><option value="blue" ' + (state.color === 'blue' ? 'selected' : '') + '>' + t('skyBlue') + '</option><option value="green" ' + (state.color === 'green' ? 'selected' : '') + '>' + t('notBananaGreen') + '</option><option value="yellow" ' + (state.color === 'yellow' ? 'selected' : '') + '>' + t('meituanYellow') + '</option></select></div></div><div class="settings-preference-row"><h3>' + t('language') + '</h3><div class="settings-preference-control"><select id="settingsLanguage"><option value="system" ' + (state.languageMode === 'system' ? 'selected' : '') + '>' + t('system') + '</option><option value="zh" ' + (state.languageMode === 'zh' ? 'selected' : '') + '>中文</option><option value="en" ' + (state.languageMode === 'en' ? 'selected' : '') + '>English</option></select></div></div><div class="settings-preference-row"><h3>' + t('messages') + '</h3><div class="settings-preference-control"><select id="settingsNotifications"><option value="allow" ' + (notificationPreference === 'allow' ? 'selected' : '') + '>' + t('enableNotifications') + '</option><option value="deny" ' + (notificationPreference === 'deny' ? 'selected' : '') + '>' + t('disableNotifications') + '</option></select></div></div><div class="settings-preference-row"><h3>' + t('footprint') + '</h3><div class="settings-preference-control"><select id="settingsFootprint"><option value="hide" ' + (!state.footprint ? 'selected' : '') + '>' + t('hideFootprint') + '</option><option value="show" ' + (state.footprint ? 'selected' : '') + '>' + t('showFootprint') + '</option></select></div></div>' + homeFeeds + openMode + '</div>';
  const layoutRow = dialog.querySelector('#settingsLayout')?.closest('.settings-preference-row');
  if (layoutRow) {
    const navigationRow = document.createElement('div');
    navigationRow.className = 'settings-preference-row';
    navigationRow.innerHTML = '<h3>' + t('navigationLocation') + '</h3><div class="settings-preference-control"><select id="settingsNavigationLocation"><option value="main">' + t('navigationLocationMain') + '</option><option value="tools">' + t('navigationLocationTools') + '</option></select></div>';
    navigationRow.querySelector('select').value = state.navigationLocation;
    layoutRow.after(navigationRow);
  }
  dialog.querySelector('.settings-home-feeds-row')?.remove();
  dialog.querySelector('#settingsFootprint')?.closest('.settings-preference-row')?.remove();
  dialog.hidden = false; state.settingsOpen = true;
  const themeSelect = $('#settingsTheme');
  if (themeSelect && !themeSelect.querySelector('option[value="dark-gray"]')) {
    const option = document.createElement('option'); option.value = 'dark-gray'; option.textContent = t('darkGray'); themeSelect.append(option);
  }
  if (themeSelect) themeSelect.value = state.theme;
}
function closeSettings() { $('#settingsDialog').hidden = true; state.settingsOpen = false; }
function refreshUpdateIndicator() {
  const button = $('#updateBtn');
  if (!button) return;
  button.hidden = !state.updateAvailable || state.layoutMode === 'simple';
  button.setAttribute('aria-label', state.updateAvailable ? t('applyUpdate') : t('checkUpdate'));
  button.dataset.updateAvailable = state.updateAvailable ? 'true' : 'false';
}
function markUpdateAvailable() {
  state.updateAvailable = true;
  state.updateError = false;
  refreshUpdateIndicator();
  if (state.settingsOpen) renderSettings();
  if (state.section === 'mine') render();
}
function observeUpdateWorker(registration) {
  return new Promise((resolve) => {
    let settled = false;
    let timeout = null;
    const finish = (worker) => {
      if (settled) return;
      settled = true;
      if (timeout) clearTimeout(timeout);
      resolve(worker || registration.waiting || null);
    };
    const watch = (worker) => {
      if (!worker) return;
      if (worker.state === 'installed') return finish(worker);
      if (worker.state === 'redundant' || worker.state === 'activated') return finish(null);
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') finish(worker);
        else if (worker.state === 'redundant' || worker.state === 'activated') finish(null);
      }, { once: false });
    };
    if (registration.waiting) return finish(registration.waiting);
    if (registration.installing) watch(registration.installing);
    registration.addEventListener('updatefound', () => watch(registration.installing), { once: true });
    timeout = setTimeout(() => finish(registration.waiting), 15000);
  });
}
function versionedServiceWorkerUrl(version = APP_VERSION) {
  const url = new URL('sw.js', document.baseURI);
  url.searchParams.set('version', version);
  return url.href;
}
function registerVersionedServiceWorker(version = APP_VERSION) {
  return navigator.serviceWorker.register(versionedServiceWorkerUrl(version), { updateViaCache: 'none' });
}
async function getAppServiceWorkerRegistration() {
  const existing = await navigator.serviceWorker.getRegistration();
  const activeScript = existing?.active?.scriptURL || '';
  if (existing && !activeScript.includes('version=' + encodeURIComponent(APP_VERSION))) return registerVersionedServiceWorker();
  return existing || registerVersionedServiceWorker();
}
async function updateServiceWorkerRegistration(registration) {
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await Promise.race([registration.update(), sleep(9000).then(() => { throw Error('Update check timed out'); })]);
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 0) await sleep(350);
    }
  }
  throw lastError || Error('Update check failed');
}
function compareAppVersions(left, right) {
  const parse = (value) => String(value || '').split('.').map((part) => Number(part.match(/\d+/)?.[0] || 0));
  const leftParts = parse(left);
  const rightParts = parse(right);
  const length = Math.max(leftParts.length, rightParts.length, 3);
  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) return difference;
  }
  return 0;
}
async function fetchLatestAppVersion() {
  const versionUrl = new URL('app.js', document.baseURI);
  versionUrl.searchParams.set('update-check', Date.now() + '-' + Math.random().toString(36).slice(2));
  const response = await Promise.race([
    fetch(versionUrl.href, { cache: 'no-store', credentials: 'same-origin' }),
    sleep(8000).then(() => { throw Error('Version check timed out'); }),
  ]);
  if (!response.ok) throw Error('Version check failed');
  const source = await response.text();
  const match = source.match(/const\s+APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
  if (!match) throw Error('Version marker missing');
  return match[1];
}
async function checkForUpdate() {
  if (state.updateChecking || state.updateApplying) return;
  let registration = state.swRegistration || await navigator.serviceWorker?.getRegistration();
  if (!registration) return toast(state.language === 'en' ? 'Updates are unavailable in this browser' : '当前浏览器暂不支持更新检查', 'error');
  state.swRegistration = registration;
  state.updateError = false;
  state.updateChecking = true;
  if (state.settingsOpen) renderSettings();
  if (state.section === 'mine') render();
  try {
    const latestVersion = await fetchLatestAppVersion().catch(() => null);
    const remoteNewer = latestVersion ? compareAppVersions(latestVersion, APP_VERSION) > 0 : false;
    if (latestVersion && !remoteNewer) {
      state.updateAvailable = false;
      state.updateError = false;
      refreshUpdateIndicator();
      if (state.settingsOpen) renderSettings();
      if (state.section === 'mine') render();
      toast(t('upToDate'));
      return;
    }
    if (remoteNewer) {
      registration = await registerVersionedServiceWorker(latestVersion);
      state.swRegistration = registration;
    }
    const installingBeforeCheck = registration.installing;
    const workerPromise = observeUpdateWorker(registration);
    await updateServiceWorkerRegistration(registration);
    let worker = registration.waiting;
    if (!worker) {
      const newWorkerStarted = registration.installing && registration.installing !== installingBeforeCheck;
      const waitMilliseconds = remoteNewer || newWorkerStarted || registration.installing ? 15000 : 2500;
      worker = await Promise.race([workerPromise, sleep(waitMilliseconds).then(() => null)]);
    }
    if (!worker && remoteNewer) {
      const retryWorkerPromise = observeUpdateWorker(registration);
      await updateServiceWorkerRegistration(registration);
      worker = registration.waiting || await Promise.race([retryWorkerPromise, sleep(15000).then(() => null)]);
    }
    if (worker || registration.waiting || registration.installing?.state === 'installed') markUpdateAvailable();
    else if (remoteNewer) throw Error('The latest app version did not install');
    else { state.updateAvailable = false; state.updateError = false; refreshUpdateIndicator(); if (state.settingsOpen) renderSettings(); if (state.section === 'mine') render(); toast(t('upToDate')); }
  } catch {
    state.updateError = true;
    toast(state.language === 'en' ? 'Update check failed. Please try again.' : '更新检查失败，请重试', 'error');
  }
  finally { state.updateChecking = false; if (state.settingsOpen) renderSettings(); if (state.section === 'mine') render(); }
}
function waitForServiceWorkerActivation(registration, worker, timeoutMs = 15000) {
  return new Promise((resolve) => {
    let settled = false;
    let timeout = null;
    const finish = (activated) => {
      if (settled) return;
      settled = true;
    if (timeout) clearTimeout(timeout);
    worker.removeEventListener('statechange', onStateChange);
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    resolve(activated);
  };
  const onStateChange = () => {
    if (worker.state === 'activated' || registration.active === worker) finish(true);
    else if (worker.state === 'redundant') finish(false);
  };
  const onControllerChange = () => {
    if (worker.state === 'activated' || registration.active === worker) finish(true);
  };
  if (worker.state === 'activated' || registration.active === worker) return finish(true);
  worker.addEventListener('statechange', onStateChange);
  navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
  timeout = setTimeout(() => finish(worker.state === 'activated' || registration.active === worker), timeoutMs);
});
}
async function requestAppReload() {
  if (state.updateReloading) return;
  flushReaderProgress();
  state.updateReloading = true;
  clearTimeout(persistenceTimer);
  await writePersistentSnapshot();
  await oneBoxDbPut('snapshot', 'reader-library', { value: JSON.stringify(state.library.slice(0, 80)), savedAt: Date.now() });
  const checkpoints = localStorage.getItem(STORAGE.readerProgress);
  if (checkpoints) await oneBoxDbPut('snapshot', 'reader-progress', { value: checkpoints, savedAt: Date.now() });
  await oneBoxDbPut('snapshot', 'github-auth', { value: JSON.stringify(state.github), savedAt: Date.now() });
  window.location.reload();
}
async function applyUpdate() {
  if (state.updateApplying) return;
  let worker = state.swRegistration?.waiting;
  if (!worker) {
    await checkForUpdate();
    worker = state.swRegistration?.waiting;
    if (!worker) return;
  }
  state.updateApplying = true;
  if (state.settingsOpen) renderSettings();
  if (state.section === 'mine') render();
  try {
    worker.postMessage({ type: 'SKIP_WAITING' });
    const activated = await waitForServiceWorkerActivation(state.swRegistration, worker);
    if (!activated) throw Error('The update worker did not activate');
    requestAppReload();
  } catch {
    state.updateApplying = false;
    state.updateError = true;
    if (state.settingsOpen) renderSettings();
    if (state.section === 'mine') render();
    toast(state.language === 'en' ? 'The update could not be applied' : '更新应用失败，请重试', 'error');
  }
}
function setupServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  let controllerReady = Boolean(navigator.serviceWorker.controller);
  let didReload = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!controllerReady) { controllerReady = true; return; }
    if (!state.updateApplying && !state.updateAvailable) return;
    if (didReload) return;
    didReload = true;
    requestAppReload();
  });
  getAppServiceWorkerRegistration().then((registration) => {
    state.swRegistration = registration;
    if (registration.waiting) {
      if (!navigator.serviceWorker.controller) registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state !== 'installed') return;
        if (!navigator.serviceWorker.controller) worker.postMessage({ type: 'SKIP_WAITING' });
      });
    });
  }).catch(() => {});
}

// Rendering and interaction --------------------------------------------------
function render() {
  // Persist the last measured position before replacing the viewport, never its transient zero.
  if (state.readerMode === 'reading' && $('[data-reader-content]')) flushReaderProgress(false);
  if (state.readerMode === 'reading') readerPositionRestoring = true;
  if (state.section !== 'mine' || !state.ticketWalletOpen || state.ticketWalletView !== 'tickets' || state.ticketWalletSelectedId || state.ticketWalletEditorOpen || state.ticketWalletMemoryDraft) {
    cancelTicketWalletReorder();
    clearTicketWalletReorderTarget();
  }
  // A page swipe preview is transient. Clear it before any route/content
  // render so iOS Safari/PWA cannot retain the old 200% stage and expose an
  // empty lower half after returning from an external feed page.
  if (pageSwipeTrackState || pageSwipeStage.classList.contains('is-active')) clearPageSwipeTrack();
  syncHomeFeedLoading();
  applyLanguage();
  if (state.section === 'home') loadHomeFeeds();
  const developerFullscreen = state.section === 'tools' && state.tool === 'dev' && state.devTools.fullscreen === true;
  nav.hidden = state.section !== 'tools' || developerFullscreen;
  const renderers = { calculator, dev: developerTool, calendar, weather, convert, translate: translateConvertView, reader, navigation: renderNavigation };
  workspace.dataset.tool = state.section === 'tools' ? state.tool : state.section;
  workspace.innerHTML = state.section === 'home' ? renderHome() : state.section === 'navigation' ? renderNavigation() : state.section === 'messages' ? renderMessages() : state.section === 'mine' ? (state.ticketWalletOpen ? renderTicketWallet() : renderMine()) : (renderers[state.tool] || calculator)();
  if (state.section === 'mine' && state.ticketWalletOpen && state.ticketWalletView === 'tickets') syncTicketWalletFocusStack();
  if (state.section === 'mine' && state.ticketWalletOpen && state.ticketWalletView === 'journeys') requestAnimationFrame(() => { void hydrateTicketWalletMap(); });
  document.body.classList.toggle('dev-tools-fullscreen', developerFullscreen);
  document.body.classList.toggle('dev-history-open', developerFullscreen && state.devTools.historyOpen === true);
  renderHomeSourceNav();
  document.documentElement.classList.toggle('reader-focus', state.section === 'tools' && state.tool === 'reader' && state.readerMode === 'reading' && state.readerImmersive);
  syncReaderSafariSurface();
  if (state.section === 'tools' && state.tool === 'reader' && state.readerMode === 'reading') {
    requestAnimationFrame(() => { ensureReaderFullscreenTool(); applyReaderPreferences(); applyReaderMarkups(); updateReaderFullscreenControl(); syncReaderPageResizeObserver(); scheduleReaderPageLayout(); scheduleReaderPositionRestore(); if (state.readerDialog) { readerDialogMarkup(state.readerDialog); updateReaderReferenceChrome(); } });
  } else if (!state.readerDialog) {
    const readerDialog = $('#readerDialog'); if (readerDialog) readerDialog.hidden = true;
  }
  if (state.section === 'tools' && state.tool === 'calendar') ensureHolidayYear(state.month.getFullYear());
  renderBottomNav();
  requestAnimationFrame(() => { updateToolTabOverflowControls(); focusActiveToolTab(false); });
  updateNotificationBadge();
  syncMascotContext();
  if (state.recentReadingOpen) renderRecentReading();
  if (state.petDialogOpen) renderPetDialog();
  if (state.navigationDialog) renderNavigationDialog();
  if (state.section === 'home') scheduleHomeFeedSurfaceSync();
}
function swapWeatherCards(from, to) {
  if (from === to || from == null || to == null) return;
  [state.weatherCards[from], state.weatherCards[to]] = [state.weatherCards[to], state.weatherCards[from]];
  state.activeWeatherId = state.weatherCards[to]?.id || state.activeWeatherId;
  saveWeatherCards(); render();
  toast(state.language === 'en' ? 'Weather order saved' : '天气卡片顺序已保存');
}
let reorderTimer = null;
let reorderTarget = null;
let reorderDrag = null;
let reorderSuppressClickUntil = 0;
let ticketWalletReorder = null;
let ticketWalletReorderTargetRow = null;
let ticketWalletReorderRevealTimer = 0;
let ticketWalletReorderSuppressClickUntil = 0;
let ticketWalletReorderFrame = 0;
let ticketWalletReorderPoint = null;
let swipeGesture = null;
let swipeSuppressClickUntil = 0;
let ticketWalletSuppressSyntheticClick = false;
let ticketWalletSyntheticClickPoint = null;
let ticketWalletDetailClosingId = '';
let ticketWalletDetailClosingTimer = 0;
let ticketWalletDetailClosingCleanup = null;
let ticketWalletDetailClosingAnimation = null;
let tabSwipeGesture = null;
let tabSwipeSuppressClickUntil = 0;
let pageSwipeGesture = null;
let pageSwipeAnimationToken = 0;
let pageSwipeSuppressClickUntil = 0;
let pageSwipeTrackState = null;
let pageSwipeNavState = null;
let homePullGesture = null;
let readerSurfaceGesture = null;
let readerSelectionSuppressUntil = 0;
let readerSelectionHideTimer = 0;
let readerBookDrag = null;
let readerBookSuppressClickUntil = 0;
let navigationPressTimer = null;
let navigationDrag = null;
let navigationDialogPressTimer = null;
let navigationDialogPress = null;
let navigationSuppressClickUntil = 0;
const NAVIGATION_LONG_PRESS_MS = 390;
const NAVIGATION_MOVE_TOLERANCE = 16;
const NAVIGATION_DRAG_THRESHOLD = 5;
const NAVIGATION_COMBINE_ZONE = 0.4;
function clearNavigationCombineTimer(drag = navigationDrag) {
  if (!drag) return;
  clearTimeout(drag.combineTimer);
  drag.combineTimer = null;
  if (drag.combineOver) drag.combineOver.classList.remove('navigation-combine-ready');
  drag.combineOver = null;
  drag.combineTarget = null;
}
function clearNavigationDragClasses() {
  $$('.navigation-card.navigation-dragging, .navigation-card.navigation-long-pressed').forEach((card) => card.classList.remove('navigation-dragging', 'navigation-long-pressed'));
  $$('.navigation-card.navigation-drop-target, .navigation-card.navigation-combine-ready').forEach((card) => card.classList.remove('navigation-drop-target', 'navigation-combine-ready'));
}
function startNavigationLongPress(target, event) {
  clearTimeout(navigationPressTimer);
  navigationDrag = { target, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, longPressed: false, active: false, over: null, folderTarget: null, combineOver: null, combineTarget: null, combineTimer: null, placeholder: null, ghost: null, parent: null, reordered: false };
  navigationPressTimer = setTimeout(() => {
    if (!navigationDrag || navigationDrag.target !== target) return;
    navigationDrag.longPressed = true;
    target.classList.add('navigation-long-pressed');
  }, NAVIGATION_LONG_PRESS_MS);
}
function endNavigationLongPress() { clearTimeout(navigationPressTimer); navigationPressTimer = null; }
function startNavigationDialogLongPress(target, event) {
  clearTimeout(navigationDialogPressTimer);
  navigationDialogPress = { target, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, longPressed: false };
  navigationDialogPressTimer = setTimeout(() => {
    if (!navigationDialogPress || navigationDialogPress.target !== target) return;
    navigationDialogPress.longPressed = true;
  }, NAVIGATION_LONG_PRESS_MS);
}
function updateNavigationDialogLongPress(event) {
  const press = navigationDialogPress;
  if (!press || (press.pointerId != null && event.pointerId !== press.pointerId)) return;
  if (Math.hypot(event.clientX - press.startX, event.clientY - press.startY) > NAVIGATION_MOVE_TOLERANCE && !press.longPressed) {
    clearTimeout(navigationDialogPressTimer); navigationDialogPressTimer = null; navigationDialogPress = null;
  }
}
function finishNavigationDialogLongPress(event = null) {
  const press = navigationDialogPress;
  if (!press || (event?.pointerId != null && press.pointerId != null && event.pointerId !== press.pointerId)) return false;
  clearTimeout(navigationDialogPressTimer); navigationDialogPressTimer = null; navigationDialogPress = null;
  if (!press.longPressed) return false;
  navigationSuppressClickUntil = Date.now() + 550;
  const card = press.target;
  openNavigationActionsDialog(card.dataset.navigationId, card.dataset.navigationFolderId || '');
  return true;
}
function cancelNavigationDialogLongPress() { clearTimeout(navigationDialogPressTimer); navigationDialogPressTimer = null; navigationDialogPress = null; }
function animateNavigationReorder(container, mutate) {
  const before = new Map([...container.querySelectorAll('[data-navigation-item]')].map((card) => [card.dataset.navigationId, card.getBoundingClientRect()]));
  mutate();
  const moved = [...container.querySelectorAll('[data-navigation-item]')];
  moved.forEach((card) => {
    const oldRect = before.get(card.dataset.navigationId); if (!oldRect) return;
    const rect = card.getBoundingClientRect(); const dx = oldRect.left - rect.left; const dy = oldRect.top - rect.top;
    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
    card.style.transition = 'none'; card.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    requestAnimationFrame(() => { card.style.transition = 'transform 190ms cubic-bezier(.2,.75,.25,1)'; card.style.transform = ''; window.setTimeout(() => { card.style.transition = ''; }, 210); });
  });
}
function createNavigationDragOverlay(drag, event) {
  const target = drag.target; const rect = target.getBoundingClientRect(); const parent = target.parentElement;
  if (!parent) return;
  drag.parent = parent;
  const placeholder = document.createElement('article');
  placeholder.className = 'navigation-card navigation-drag-placeholder';
  placeholder.style.width = rect.width + 'px'; placeholder.style.height = rect.height + 'px';
  placeholder.setAttribute('aria-hidden', 'true');
  target.replaceWith(placeholder); drag.placeholder = placeholder;
  const ghost = target.cloneNode(true);
  ghost.className = 'navigation-card navigation-drag-ghost';
  ghost.style.width = rect.width + 'px'; ghost.style.height = rect.height + 'px';
  ghost.style.left = event.clientX + 'px'; ghost.style.top = event.clientY + 'px';
  document.body.appendChild(ghost); drag.ghost = ghost;
  try { workspace.setPointerCapture?.(drag.pointerId); drag.captureTarget = workspace; } catch {}
}
function restoreNavigationDrag(drag) {
  clearNavigationCombineTimer(drag);
  if (drag.over) drag.over.classList.remove('navigation-drop-target', 'navigation-combine-ready');
  if (drag.placeholder?.isConnected) drag.placeholder.replaceWith(drag.target);
  drag.ghost?.remove();
  try { if (drag.captureTarget?.hasPointerCapture?.(drag.pointerId)) drag.captureTarget.releasePointerCapture(drag.pointerId); } catch {}
  drag.target.classList.remove('navigation-dragging', 'navigation-long-pressed');
  drag.placeholder = null; drag.ghost = null;
}
function positionNavigationPlaceholder(drag, over, clientX, clientY) {
  const placeholder = drag.placeholder; const parent = over?.parentElement;
  if (!placeholder || !over || !parent || over === placeholder || over.dataset.navigationFolderId) return false;
  const rect = over.getBoundingClientRect();
  const horizontal = Math.abs(clientX - (rect.left + rect.width / 2)) >= Math.abs(clientY - (rect.top + rect.height / 2));
  const centered = Math.abs(clientX - (rect.left + rect.width / 2)) < rect.width * .22 && Math.abs(clientY - (rect.top + rect.height / 2)) < rect.height * .22;
  const after = centered && drag.target.dataset.navigationType !== 'site' ? true : horizontal ? clientX > rect.left + rect.width / 2 : clientY > rect.top + rect.height / 2;
  const next = after ? over.nextElementSibling : over;
  if (next === placeholder) return false;
  animateNavigationReorder(parent, () => parent.insertBefore(placeholder, next));
  drag.reordered = true;
  return true;
}
function persistNavigationDomOrder(drag) {
  const parent = drag.parent; if (!parent) return;
  const ids = [...parent.querySelectorAll('[data-navigation-item]')].map((card) => card.dataset.navigationId);
  const byId = new Map(state.navigation.items.map((item) => [item.id, item]));
  if (ids.length !== state.navigation.items.length) return;
  state.navigation.items = ids.map((id) => byId.get(id)).filter(Boolean);
  saveNavigation(); render(); toast(t('navigationOrderSaved'));
}
function updateNavigationDrag(event) {
  const drag = navigationDrag;
  if (!drag || (drag.pointerId != null && event.pointerId !== drag.pointerId)) return;
  const dx = event.clientX - drag.startX; const dy = event.clientY - drag.startY;
  if (!drag.longPressed) {
    if (Math.hypot(dx, dy) > NAVIGATION_MOVE_TOLERANCE) {
      endNavigationLongPress();
      navigationDrag = null;
    }
    return;
  }
  if (!drag.active) {
    if (Math.hypot(dx, dy) < NAVIGATION_DRAG_THRESHOLD) return;
    drag.active = true;
    drag.target.classList.add('navigation-dragging'); drag.target.classList.remove('navigation-long-pressed');
    createNavigationDragOverlay(drag, event);
  }
  if (drag.ghost) { drag.ghost.style.left = event.clientX + 'px'; drag.ghost.style.top = event.clientY + 'px'; }
  const hit = document.elementFromPoint?.(event.clientX, event.clientY) || event.target;
  const over = hit?.closest?.('[data-navigation-item]');
  if (drag.over && drag.over !== over) drag.over.classList.remove('navigation-drop-target', 'navigation-combine-ready');
  drag.over = over && over !== drag.target ? over : null;
  if (!drag.over) { clearNavigationCombineTimer(drag); drag.folderTarget = null; }
  else if (drag.over.dataset.navigationFolderId || drag.over.dataset.navigationType === 'folder') {
    clearNavigationCombineTimer(drag); drag.folderTarget = drag.over; drag.over.classList.add('navigation-drop-target');
  } else {
    drag.folderTarget = null;
    const rect = drag.over.getBoundingClientRect();
    const centered = Math.abs(event.clientX - (rect.left + rect.width / 2)) < rect.width * NAVIGATION_COMBINE_ZONE && Math.abs(event.clientY - (rect.top + rect.height / 2)) < rect.height * NAVIGATION_COMBINE_ZONE;
    if (centered && drag.target.dataset.navigationType === 'site' && drag.over.dataset.navigationType === 'site') {
      if (drag.combineOver !== drag.over) {
        clearNavigationCombineTimer(drag); drag.combineOver = drag.over; drag.combineTarget = drag.over; drag.over.classList.add('navigation-drop-target', 'navigation-combine-ready');
      }
    } else {
      clearNavigationCombineTimer(drag); drag.over.classList.add('navigation-drop-target'); positionNavigationPlaceholder(drag, drag.over, event.clientX, event.clientY);
    }
  }
  if (event.cancelable) event.preventDefault();
}
function finishNavigationDrag(event = null) {
  const drag = navigationDrag;
  if (!drag || (event?.pointerId != null && drag.pointerId != null && event.pointerId !== drag.pointerId)) return false;
  navigationDrag = null; endNavigationLongPress();
  const targetId = drag.target.dataset.navigationId;
  const wasActive = drag.active;
  const wasLongPressed = drag.longPressed;
  const over = drag.over;
  const combineTarget = drag.combineTarget;
  const folderTarget = drag.folderTarget;
  if (wasLongPressed) navigationSuppressClickUntil = Date.now() + 550;
  if (!wasActive) {
    restoreNavigationDrag(drag);
    if (wasLongPressed) openNavigationActionsDialog(targetId, drag.target.dataset.navigationFolderId || '');
    return wasLongPressed;
  }
  if (over && over.dataset.navigationType === 'site' && !combineTarget && !folderTarget) positionNavigationPlaceholder(drag, over, event?.clientX ?? drag.startX, event?.clientY ?? drag.startY);
  const overId = over?.dataset.navigationId;
  const source = navigationFindRootItem(targetId); const destination = navigationFindRootItem(overId);
  if (combineTarget && source?.type === 'site' && destination?.type === 'site') {
    restoreNavigationDrag(drag); render(); openNavigationCreateFolderDialog(source.id, destination.id); return true;
  }
  if (folderTarget && source?.type === 'site' && folderTarget.dataset.navigationType === 'folder') {
    const folderId = folderTarget.dataset.navigationId; restoreNavigationDrag(drag); moveNavigationSiteToFolder(source.id, folderId); return true;
  }
  if (source && destination && source.id !== destination.id && !drag.reordered && source.type !== 'site' && destination.type !== 'site') {
    restoreNavigationDrag(drag); swapNavigationRootItems(source.id, destination.id); return true;
  }
  restoreNavigationDrag(drag); if (drag.reordered) persistNavigationDomOrder(drag);
  return true;
}
function startLongPress(target, type, index, pointerEvent = null) {
  clearTimeout(reorderTimer);
  if (readerBookDrag?.active) finishReaderBookDrag(pointerEvent);
  readerBookDrag = type === 'book' ? { target, type, index, pointerId: pointerEvent?.pointerId, startX: pointerEvent?.clientX || 0, startY: pointerEvent?.clientY || 0, active: false } : null;
  reorderDrag = type !== 'book' && pointerEvent?.pointerType !== 'mouse' ? { target, type, index, pointerId: pointerEvent?.pointerId, startX: pointerEvent?.clientX || 0, startY: pointerEvent?.clientY || 0, longPressed: false, active: false, over: null } : null;
  reorderTarget = { target, type, index, pointerId: pointerEvent?.pointerId };
  reorderTimer = setTimeout(() => {
    target.classList.add('reorder-hold'); target.dataset.longPressed = 'true';
    if (type === 'weather') target.classList.add('weather-delete-ready');
    else if (type === 'book') { target.classList.add('reader-delete-ready'); if (readerBookDrag) readerBookDrag.longPressed = true; }
    if (reorderDrag) reorderDrag.longPressed = true;
    if (type !== 'weather' && type !== 'book' && !reorderDrag) toast(state.language === 'en' ? 'Reorder mode: tap another item' : '排序模式：再点一下目标位置');
  }, 520);
}
function endLongPress() { clearTimeout(reorderTimer); reorderTimer = null; }
function reorderDragSelector(type) {
  if (type === 'tool') return '[data-tool]';
  if (type === 'feed') return '[data-feed-source-index]';
  return '[data-weather-card]';
}
function reorderDragContainer(type) {
  if (type === 'tool') return nav;
  if (type === 'feed') return homeSourceNav.querySelector('.feed-source-tabs');
  return workspace.querySelector('.weather-card-list');
}
function captureReorderPointer(drag) {
  if (!drag || drag.pointerId == null) return;
  try { drag.target.setPointerCapture?.(drag.pointerId); } catch {}
}
function releaseReorderPointer(drag) {
  if (!drag || drag.pointerId == null) return;
  try { if (drag.target.hasPointerCapture?.(drag.pointerId)) drag.target.releasePointerCapture(drag.pointerId); } catch {}
}
function updateReorderDrag(event) {
  const drag = reorderDrag;
  if (!drag || (drag.pointerId != null && event.pointerId !== drag.pointerId)) return;
  const dx = event.clientX - drag.startX; const dy = event.clientY - drag.startY;
  if (!drag.longPressed) {
    if (Math.hypot(dx, dy) > 10) { endLongPress(); reorderTarget = null; reorderDrag = null; }
    return;
  }
  if (!drag.active) {
    if (Math.hypot(dx, dy) < 8) return;
    drag.active = true;
    captureReorderPointer(drag);
    drag.target.classList.add('reorder-dragging');
    drag.target.classList.remove('reorder-hold', 'weather-delete-ready');
  }
  const hit = document.elementFromPoint?.(event.clientX, event.clientY) || event.target;
  const over = hit?.closest?.(reorderDragSelector(drag.type));
  if (drag.over && drag.over !== over) drag.over.classList.remove('reorder-over');
  drag.over = over && over !== drag.target ? over : null;
  if (!drag.over || !drag.over.parentElement) {
    if (event.cancelable) event.preventDefault();
    return;
  }
  drag.over.classList.add('reorder-over');
  const rect = drag.over.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
  const horizontal = drag.type === 'feed' || Math.abs(event.clientX - centerX) > Math.abs(event.clientY - centerY);
  const insertAfter = horizontal ? event.clientX > centerX : event.clientY > centerY;
  const parent = drag.over.parentElement;
  if (insertAfter) {
    if (drag.over.nextElementSibling !== drag.target) parent.insertBefore(drag.target, drag.over.nextElementSibling);
  } else if (drag.over !== drag.target.nextElementSibling) {
    parent.insertBefore(drag.target, drag.over);
  }
  if (event.cancelable) event.preventDefault();
}
function finishReorderDrag(event = null) {
  const drag = reorderDrag;
  if (!drag || (event?.pointerId != null && drag.pointerId != null && event.pointerId !== drag.pointerId)) return false;
  if (drag.over) drag.over.classList.remove('reorder-over');
  const wasActive = drag.active;
  if (!wasActive) { reorderDrag = null; return false; }
  drag.target.classList.remove('reorder-dragging', 'reorder-hold', 'weather-delete-ready');
  delete drag.target.dataset.longPressed;
  releaseReorderPointer(drag);
  const container = reorderDragContainer(drag.type);
  const items = container ? [...container.querySelectorAll(reorderDragSelector(drag.type))] : [];
  if (drag.type === 'tool') {
    state.toolOrder = normalizeToolOrder(items.map((item) => item.dataset.tool), state.navigationLocation === 'tools');
    saveToolOrder(); renderNav();
  } else if (drag.type === 'feed') {
    const visibleIds = items.map((item) => item.dataset.feedSource).filter(Boolean);
    const visibleSet = new Set(visibleIds); let cursor = 0;
    state.homeFeed.order = state.homeFeed.order.map((id) => visibleSet.has(id) ? visibleIds[cursor++] : id);
    saveHomeFeedOrder(); render();
  } else {
    const cards = items.map((item) => state.weatherCards.find((card) => card.id === item.dataset.weatherCard)).filter(Boolean);
    state.weatherCards = cards; saveWeatherCards(); render();
  }
  reorderSuppressClickUntil = Date.now() + 500;
  reorderTarget = null; reorderDrag = null;
  toast(state.language === 'en' ? 'Order saved' : '顺序已保存');
  return true;
}
function cancelReorderDrag() {
  if (reorderDrag?.over) reorderDrag.over.classList.remove('reorder-over');
  if (reorderDrag?.target) {
    releaseReorderPointer(reorderDrag);
    reorderDrag.target.classList.remove('reorder-dragging', 'reorder-hold', 'weather-delete-ready');
    delete reorderDrag.target.dataset.longPressed;
  }
  if (reorderTarget && reorderTarget.type !== 'book') {
    reorderTarget.target.classList.remove('reorder-hold', 'weather-delete-ready');
    delete reorderTarget.target.dataset.longPressed;
    reorderTarget = null;
  }
  reorderDrag = null;
}
function readerBookCardsInDom() {
  return [...document.querySelectorAll('[data-reader-book-card]')];
}
function releaseReaderBookPointer(drag) {
  if (!drag || drag.type !== 'book' || drag.pointerId == null) return;
  try { if (drag.target.hasPointerCapture?.(drag.pointerId)) drag.target.releasePointerCapture(drag.pointerId); } catch {}
}
function updateReaderBookDrag(event) {
  const drag = readerBookDrag;
  if (!drag || (drag.pointerId != null && event.pointerId !== drag.pointerId)) return;
  const dx = event.clientX - drag.startX; const dy = event.clientY - drag.startY;
  if (!drag.active) {
    if (!drag.longPressed) {
      if (Math.hypot(dx, dy) > 10) { endLongPress(); reorderTarget = null; readerBookDrag = null; }
      return;
    }
    if (Math.hypot(dx, dy) < 8) return;
    drag.active = true;
    drag.target.classList.add('reader-book-dragging');
    drag.target.classList.remove('reader-delete-ready');
    if (event.cancelable) event.preventDefault();
  }
  const hit = document.elementFromPoint?.(event.clientX, event.clientY) || event.target;
  const over = hit?.closest?.('[data-reader-book-card]');
  if (drag.over && drag.over !== over) drag.over.classList.remove('reorder-over');
  drag.over = over && over !== drag.target ? over : null;
  if (!drag.over || !drag.over.parentElement) {
    if (event.cancelable) event.preventDefault();
    return;
  }
  drag.over.classList.add('reorder-over');
  const rect = drag.over.getBoundingClientRect();
  const insertAfter = event.clientY > rect.top + rect.height / 2;
  const parent = drag.over.parentElement;
  if (insertAfter) {
    if (drag.over.nextElementSibling !== drag.target) parent.insertBefore(drag.target, drag.over.nextElementSibling);
  } else if (drag.over !== drag.target.nextElementSibling) {
    parent.insertBefore(drag.target, drag.over);
  }
  if (event.cancelable) event.preventDefault();
}
function finishReaderBookDrag(event = null) {
  const drag = readerBookDrag;
  if (!drag || (event?.pointerId != null && drag.pointerId != null && event.pointerId !== drag.pointerId)) return false;
  const wasActive = drag.active;
  if (wasActive) {
    if (drag.over) drag.over.classList.remove('reorder-over');
    const cards = readerBookCardsInDom();
    const books = cards.map((card) => readerBookById(card.dataset.id)).filter(Boolean);
    books.forEach((book, index) => { book.order = books.length - index; });
    saveLibrary();
    readerBookSuppressClickUntil = Date.now() + 500;
    drag.target.classList.remove('reader-book-dragging');
    reorderTarget = null;
    releaseReaderBookPointer(drag);
    render();
    toast(state.language === 'en' ? 'Shelf order saved' : '书架顺序已保存');
  } else {
    releaseReaderBookPointer(drag);
  }
  readerBookDrag = null;
  return wasActive;
}
function clearReaderDeleteMode() {
  endLongPress();
  readerBookDrag?.over?.classList.remove('reorder-over');
  releaseReaderBookPointer(readerBookDrag);
  $$('.reader-book-card.reader-delete-ready, .reader-book-card.reorder-hold').forEach((card) => {
    card.classList.remove('reader-delete-ready', 'reorder-hold');
    delete card.dataset.longPressed;
  });
  $$('.reader-book-card.reader-book-dragging').forEach((card) => card.classList.remove('reader-book-dragging'));
  readerBookDrag = null;
  if (reorderTarget?.type === 'book') reorderTarget = null;
}
function handleReorderClick(target, type, index) {
  if (!reorderTarget || reorderTarget.type !== type || !reorderTarget.target.dataset.longPressed) return false;
  if (type === 'book') {
    target.classList.add('reader-delete-ready'); delete target.dataset.longPressed; reorderTarget = null;
    return true;
  }
  if (reorderTarget.index !== index) type === 'tool' ? swapToolOrder(reorderTarget.index, index) : type === 'feed' ? swapHomeFeedSources(reorderTarget.index, index) : swapWeatherCards(reorderTarget.index, index);
  reorderTarget.target.classList.remove('reorder-hold'); delete reorderTarget.target.dataset.longPressed; reorderTarget = null;
  return true;
}
function pageSwipeNavSelector(container) {
  if (container?.dataset.tabRail === 'tools') return '[data-tool]';
  if (container?.dataset.tabRail === 'ticket-filters') return '[data-ticket-wallet-filter]';
  return '[data-feed-source]';
}
function clearPageSwipeNav() {
  if (!pageSwipeNavState) return;
  pageSwipeNavState.container.classList.remove('page-swipe-nav-dragging');
  pageSwipeNavState.indicator.remove();
  pageSwipeNavState = null;
}
function setPageSwipeNavProgress(progress) {
  const swipe = pageSwipeNavState;
  if (!swipe) return;
  const amount = Math.max(0, Math.min(1, progress));
  // The rail stays outside the moving page stage. Capture its geometry once
  // when the gesture starts; reading layout on every pointermove can cause
  // Safari to reflow the rail and make the underline wobble after direction
  // has already been established.
  const left = swipe.fromLeft + (swipe.toLeft - swipe.fromLeft) * amount;
  const width = swipe.fromWidth + (swipe.toWidth - swipe.fromWidth) * amount;
  swipe.indicator.style.transition = 'none';
  swipe.indicator.style.transform = `translate3d(${left - swipe.fromLeft}px, 0, 0)`;
  swipe.indicator.style.width = Math.max(8, width) + 'px';
}
function beginPageSwipeNav(container, direction) {
  if (!container) return null;
  clearPageSwipeNav();
  const tabs = [...container.querySelectorAll(pageSwipeNavSelector(container))];
  const currentIndex = tabs.findIndex((tab) => tab.classList.contains('active'));
  const targetIndex = currentIndex + direction;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= tabs.length) return null;
  const containerRect = container.getBoundingClientRect();
  const fromRect = tabs[currentIndex].getBoundingClientRect();
  const toRect = tabs[targetIndex].getBoundingClientRect();
  const fromLeft = fromRect.left - containerRect.left + container.scrollLeft;
  const toLeft = toRect.left - containerRect.left + container.scrollLeft;
  const indicator = document.createElement('i');
  indicator.className = 'page-swipe-nav-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  indicator.style.transition = 'none';
  indicator.style.left = fromLeft + 'px';
  indicator.style.width = Math.max(8, fromRect.width) + 'px';
  container.classList.add('page-swipe-nav-dragging');
  container.appendChild(indicator);
  pageSwipeNavState = {
    container,
    from: tabs[currentIndex],
    to: tabs[targetIndex],
    indicator,
    fromLeft,
    toLeft,
    fromWidth: fromRect.width,
    toWidth: toRect.width,
    navDistance: Math.max(1, Math.abs(toLeft - fromLeft))
  };
  setPageSwipeNavProgress(0);
  return pageSwipeNavState;
}
function settlePageSwipeNav(committed) {
  if (!pageSwipeNavState) return;
  // The page itself has the settle animation. The underline should snap to
  // the resolved tab once, instead of running a second animation that can
  // continue to move after the page has landed.
  pageSwipeNavState.indicator.style.transition = 'none';
  setPageSwipeNavProgress(committed ? 1 : 0);
}
function beginTabSwipe(container, event) {
  if (!container || event.pointerType === 'mouse') return;
  tabSwipeGesture = { container, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, cancelled: false };
}
function updateTabSwipe(event) {
  if (!tabSwipeGesture) return;
  tabSwipeGesture.dx = event.clientX - tabSwipeGesture.startX;
  tabSwipeGesture.dy = event.clientY - tabSwipeGesture.startY;
  if (Math.abs(tabSwipeGesture.dy) > Math.abs(tabSwipeGesture.dx) + 12 && Math.abs(tabSwipeGesture.dy) > 8) {
    tabSwipeGesture.cancelled = true;
    endLongPress();
    return;
  }
  if (Math.abs(tabSwipeGesture.dx) > 12) endLongPress();
  if (Math.abs(tabSwipeGesture.dx) > 12 && !pageSwipeNavState) {
    const direction = tabSwipeGesture.dx < 0 ? 1 : -1;
    beginPageSwipeNav(tabSwipeGesture.container, direction);
  }
  if (pageSwipeNavState) {
    const distance = Math.max(1, pageSwipeNavState.container.clientWidth * .18);
    setPageSwipeNavProgress(Math.abs(tabSwipeGesture.dx) / distance);
  }
}
function finishTabSwipe() {
  const gesture = tabSwipeGesture;
  tabSwipeGesture = null;
  if (!gesture) return;
  if (gesture.cancelled || Math.abs(gesture.dx) < 52 || Math.abs(gesture.dx) <= Math.abs(gesture.dy) + 12) {
    settlePageSwipeNav(false);
    clearPageSwipeNav();
    return;
  }
  const isToolRail = gesture.container.dataset.tabRail === 'tools';
  const isTicketFilterRail = gesture.container.dataset.tabRail === 'ticket-filters';
  const selector = isToolRail ? '[data-tool]' : isTicketFilterRail ? '[data-ticket-wallet-filter]' : '[data-feed-source]';
  const tabs = [...gesture.container.querySelectorAll(selector)];
  const currentIndex = tabs.findIndex((tab) => tab.classList.contains('active'));
  const nextIndex = currentIndex + (gesture.dx < 0 ? 1 : -1);
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= tabs.length) {
    settlePageSwipeNav(false);
    clearPageSwipeNav();
    return;
  }
  const nextTab = tabs[nextIndex];
  tabSwipeSuppressClickUntil = Date.now() + 420;
  settlePageSwipeNav(true);
  clearPageSwipeNav();
  if (isToolRail) selectTool(nextTab.dataset.tool);
  else if (isTicketFilterRail) selectTicketWalletFilter(nextTab.dataset.ticketWalletFilter);
  else selectHomeFeedSource(nextTab.dataset.feedSource);
  if (!isTicketFilterRail) requestAnimationFrame(() => gesture.container.querySelector('.active')?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }));
}

function pageSwipeItems() {
  if (state.section === 'home') {
    return homeTabIds().map((id) => ({ kind: 'home', id }));
  }
  if (state.section === 'mine' && state.ticketWalletOpen && !state.ticketWalletEditorOpen && !state.ticketWalletMemoryDraft) {
    return Object.keys(TICKET_WALLET_CATEGORIES).map((id) => ({ kind: 'ticket-filter', id }));
  }
  if (state.section === 'tools') return (state.navigationLocation === 'tools' ? state.toolOrder : state.toolOrder.filter((id) => id !== 'navigation')).map((id) => ({ kind: 'tool', id }));
  return [];
}
function pageSwipeIndex(items) {
  const currentId = state.section === 'home' ? state.homeFeed.active : state.section === 'mine' && state.ticketWalletOpen ? state.ticketWalletTypeFilter : state.section === 'navigation' ? 'navigation' : state.tool;
  return items.findIndex((item) => item.id === currentId);
}
function pageSwipeTarget(event) {
  const main = event.target.closest('main');
  if (!main || event.pointerType === 'mouse' || pageSwipeAnimationToken) return null;
  if (state.section === 'mine' && state.ticketWalletOpen && (state.ticketWalletSelectedId || ticketWalletMapReturnContext)) return null;
  if (event.target.closest('[data-reader-surface], .reader-reference-shell, [data-reader-book-card], .navigation-page, input, textarea, select, [contenteditable="true"], .weather-card-list, .weather-days, .hourly-strip, .advice-strip, .translation-history-list, .ticket-wallet-filter-scroll, .ticket-wallet-view-switcher, .ticket-wallet-template-options.is-airlines')) return null;
  if (event.target.closest('[data-swipe-row]')) return null;
  const items = pageSwipeItems();
  const index = pageSwipeIndex(items);
  if (index < 0 || items.length < 2) return null;
  return { main, items, index, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, cancelled: false, dragging: false };
}
function beginPageSwipe(event) {
  pageSwipeGesture = pageSwipeTarget(event);
}
function pageSwipeMarkup(item) {
  if (item.kind === 'home') {
    const previousSource = state.homeFeed.active;
    state.homeFeed.active = item.id;
    const markup = renderHome();
    state.homeFeed.active = previousSource;
    return { tool: 'home', markup };
  }
  if (item.kind === 'ticket-filter') {
    const previousFilter = state.ticketWalletTypeFilter;
    state.ticketWalletTypeFilter = item.id;
    const markup = renderTicketWallet();
    state.ticketWalletTypeFilter = previousFilter;
    return { tool: 'mine', markup };
  }
  const previousTool = state.tool;
  state.tool = item.id;
  const renderers = { calculator, dev: developerTool, calendar, weather, convert, translate: translateConvertView, reader, navigation: renderNavigation };
  const markup = (renderers[item.id] || calculator)();
  state.tool = previousTool;
  return { tool: item.id, markup };
}
function ticketWalletPageSwipeBodyMarkup(markup) {
  const holder = document.createElement('div');
  holder.innerHTML = markup;
  const panel = holder.querySelector('[data-ticket-wallet-swipe-panel]');
  return panel ? panel.innerHTML : '';
}
function clearPageSwipeTrack() {
  const track = pageSwipeTrackState;
  const trackStage = track?.stage;
  if (trackStage && trackStage !== pageSwipeStage) {
    track.preview?.remove();
    trackStage.classList.remove('is-active', 'forward', 'backward', 'page-swipe-dragging', 'page-swipe-settling');
    trackStage.style.transform = '';
  } else {
    pageSwipeStage.querySelector('.page-swipe-preview')?.remove();
    pageSwipeStage.className = 'page-swipe-stage';
    pageSwipeStage.style.transform = '';
  }
  workspace.classList.remove('page-swipe-dragging', 'page-swipe-settling');
  workspace.style.transform = '';
  clearPageSwipeNav();
  pageSwipeTrackState = null;
}
function preparePageSwipeTrack(gesture, direction) {
  const nextIndex = gesture.index + direction;
  if (nextIndex < 0 || nextIndex >= gesture.items.length) {
    clearPageSwipeTrack();
    return null;
  }
  const target = gesture.items[nextIndex];
  if (pageSwipeTrackState?.target?.id === target.id && pageSwipeTrackState.direction === direction) return pageSwipeTrackState;
  clearPageSwipeTrack();
  const rendered = pageSwipeMarkup(target);
  if (target.kind === 'ticket-filter') {
    const stage = workspace.querySelector('[data-ticket-wallet-swipe-stage]');
    const panel = stage?.querySelector('[data-ticket-wallet-swipe-panel]');
    if (!stage || !panel) return null;
    const preview = document.createElement('div');
    preview.className = 'ticket-wallet-page-swipe-panel ticket-wallet-page-swipe-preview';
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = ticketWalletPageSwipeBodyMarkup(rendered.markup);
    stage.appendChild(preview);
    const pageWidth = Math.max(1, panel.getBoundingClientRect().width || stage.getBoundingClientRect().width);
    stage.classList.add('is-active', direction === 1 ? 'forward' : 'backward');
    stage.style.transform = 'translate3d(' + (direction === 1 ? 0 : -pageWidth) + 'px, 0, 0)';
    const navContainer = workspace.querySelector('.ticket-wallet-filter-scroll');
    pageSwipeTrackState = { target, direction, pageWidth, stage, preview, nav: beginPageSwipeNav(navContainer, direction) };
    return pageSwipeTrackState;
  }
  const preview = document.createElement('section');
  preview.id = 'workspace';
  preview.className = 'workspace page-swipe-preview';
  preview.dataset.tool = rendered.tool;
  preview.setAttribute('aria-hidden', 'true');
  preview.innerHTML = rendered.markup;
  preview.scrollTop = workspace.scrollTop;
  pageSwipeStage.appendChild(preview);
  const pageWidth = Math.max(1, workspace.getBoundingClientRect().width);
  pageSwipeStage.classList.add('is-active', direction === 1 ? 'forward' : 'backward');
  pageSwipeStage.style.transform = 'translate3d(' + (direction === 1 ? 0 : -pageWidth) + 'px, 0, 0)';
  const navContainer = target.kind === 'tool' ? nav : target.kind === 'ticket-filter' ? workspace.querySelector('.ticket-wallet-filter-scroll') : homeSourceNav.querySelector('.feed-source-tabs');
  pageSwipeTrackState = { target, direction, pageWidth, nav: beginPageSwipeNav(navContainer, direction) };
  return pageSwipeTrackState;
}
function resetPageSwipeTransform() {
  if (pageSwipeTrackState) clearPageSwipeTrack();
  else {
    workspace.classList.remove('page-swipe-dragging');
    workspace.style.transform = '';
  }
}
function settlePageSwipeBack() {
  const token = ++pageSwipeAnimationToken;
  const track = pageSwipeTrackState;
  const swipeStage = track?.stage || pageSwipeStage;
  settlePageSwipeNav(false);
  if (track) {
    swipeStage.classList.remove('page-swipe-dragging');
    swipeStage.classList.add('page-swipe-settling');
    swipeStage.style.transform = 'translate3d(' + (track.direction === 1 ? 0 : -track.pageWidth) + 'px, 0, 0)';
  } else {
    workspace.classList.remove('page-swipe-dragging');
    workspace.classList.add('page-swipe-settling');
    workspace.style.transform = 'translate3d(0, 0, 0)';
  }
  window.setTimeout(() => {
    if (token !== pageSwipeAnimationToken) return;
    pageSwipeAnimationToken = 0;
    clearPageSwipeTrack();
  }, 300);
}
function selectPageSwipeItem(item) {
  if (item.kind === 'tool') return selectTool(item.id);
  if (item.kind === 'ticket-filter') return selectTicketWalletFilter(item.id);
  return selectHomeFeedSource(item.id);
}
function settlePageSwipe(target, direction) {
  const token = ++pageSwipeAnimationToken;
  const track = pageSwipeTrackState;
  if (!track) return settlePageSwipeBack();
  const swipeStage = track.stage || pageSwipeStage;
  settlePageSwipeNav(true);
  swipeStage.classList.remove('page-swipe-dragging');
  swipeStage.classList.add('page-swipe-settling');
  swipeStage.style.transform = 'translate3d(' + (direction === 1 ? -track.pageWidth : 0) + 'px, 0, 0)';
  window.setTimeout(() => {
    if (token !== pageSwipeAnimationToken) return;
    pageSwipeAnimationToken = 0;
    clearPageSwipeTrack();
    selectPageSwipeItem(target);
  }, 300);
}
function updatePageSwipe(event) {
  const gesture = pageSwipeGesture;
  if (!gesture || (gesture.pointerId != null && event.pointerId !== gesture.pointerId)) return;
  gesture.dx = event.clientX - gesture.startX;
  gesture.dy = event.clientY - gesture.startY;
  if (Math.abs(gesture.dy) > Math.abs(gesture.dx) + 10 && Math.abs(gesture.dy) > 8) {
    gesture.cancelled = true;
    endLongPress();
    resetPageSwipeTransform();
    return;
  }
  if (Math.abs(gesture.dx) <= 10 || Math.abs(gesture.dx) <= Math.abs(gesture.dy) + 8) return;
  gesture.dragging = true;
  endLongPress();
  if (event.cancelable) event.preventDefault();
  const direction = gesture.dx < 0 ? 1 : -1;
  const track = preparePageSwipeTrack(gesture, direction);
  if (!track) {
    const visualDx = gesture.dx * 0.2;
    workspace.classList.add('page-swipe-dragging');
    workspace.style.transform = 'translate3d(' + visualDx + 'px, 0, 0)';
    return;
  }
  const swipeStage = track.stage || pageSwipeStage;
  swipeStage.classList.add('page-swipe-dragging');
  const baseOffset = direction === 1 ? 0 : -track.pageWidth;
  swipeStage.style.transform = 'translate3d(' + (baseOffset + gesture.dx) + 'px, 0, 0)';
  const swipeThreshold = Math.max(56, Math.min(112, window.innerWidth * 0.18));
  const indicatorDistance = Math.min(swipeThreshold, track.nav?.navDistance || swipeThreshold);
  setPageSwipeNavProgress(Math.abs(gesture.dx) / indicatorDistance);
}
function finishPageSwipe(event) {
  const gesture = pageSwipeGesture;
  pageSwipeGesture = null;
  if (!gesture || (gesture.pointerId != null && event.pointerId !== gesture.pointerId)) return;
  if (gesture.cancelled || !gesture.dragging) return;
  pageSwipeSuppressClickUntil = Date.now() + 460;
  tabSwipeSuppressClickUntil = pageSwipeSuppressClickUntil;
  const direction = gesture.dx < 0 ? 1 : -1;
  const distance = Math.abs(gesture.dx);
  const threshold = Math.max(56, Math.min(112, window.innerWidth * 0.18));
  const track = pageSwipeTrackState;
  const target = track?.direction === direction && distance >= threshold ? track.target : null;
  if (target) settlePageSwipe(target, direction);
  else settlePageSwipeBack();
}

function beginHomeFeedPull(event) {
  if (state.section !== 'home' || event.pointerType === 'mouse' || homeFeedHasRequests() || appScrollTop() > 1) return;
  if (!event.target.closest('#workspace[data-tool="home"]') || event.target.closest('button, a, input, select, textarea, [contenteditable="true"]')) return;
  homePullGesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, distance: 0, cancelled: false };
}
function updateHomeFeedPull(event) {
  const gesture = homePullGesture;
  if (!gesture || (gesture.pointerId != null && event.pointerId !== gesture.pointerId)) return;
  const dx = event.clientX - gesture.startX;
  const dy = event.clientY - gesture.startY;
  if (dy <= 0 || Math.abs(dx) > Math.abs(dy) + 12) { gesture.cancelled = true; return; }
  gesture.distance = Math.min(76, Math.max(0, (dy - 4) * .48));
  if (gesture.distance < 2) return;
  workspace.style.setProperty('--feed-pull-distance', gesture.distance + 'px');
  workspace.classList.add('feed-pulling');
  if (event.cancelable) event.preventDefault();
}
function finishHomeFeedPull(event) {
  const gesture = homePullGesture;
  homePullGesture = null;
  if (!gesture || (gesture.pointerId != null && event.pointerId !== gesture.pointerId)) return;
  const shouldRefresh = !gesture.cancelled && gesture.distance >= 42 && state.section === 'home' && !homeFeedHasRequests();
  workspace.classList.remove('feed-pulling');
  workspace.style.removeProperty('--feed-pull-distance');
  if (shouldRefresh) loadHomeFeeds(true);
}

workspace.addEventListener('pointerdown', (event) => {
  const row = event.target.closest('[data-swipe-row]');
  if (!row || event.target.closest('.swipe-delete')) {
    if (!row) $$('.swipe-row.swiped').forEach((item) => item.classList.remove('swiped'));
    swipeGesture = null;
    return;
  }
  const ticketCard = event.target.closest('[data-ticket-wallet-card]');
  const ticketWalletEditTarget = event.target.closest('button, a, [data-ticket-wallet-edit-field], [data-ticket-wallet-edit], [data-ticket-wallet-original], [data-ticket-wallet-apple], [data-ticket-wallet-delete]');
  const ticketWalletId = ticketCard && (!ticketWalletEditTarget || state.ticketWalletSelectedId !== ticketCard.dataset.ticketWalletCard) ? ticketCard.dataset.ticketWalletCard : '';
  swipeGesture = { row, ticketWalletId, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, dragging: false, ticketVertical: false, cancelled: false };
});
function ticketWalletDetailReturnMotion(shell, detail, selectedId) {
  const selectedRow = shell?.querySelector('.ticket-wallet-detail-row');
  const returnStack = detail?.querySelector('.ticket-wallet-return-pack-stack');
  if (!selectedRow || !returnStack) return null;
  const visibleRecords = ticketWalletFilteredRecords(ticketWalletDisplayRecords(state.ticketWallet));
  const selectedIndex = visibleRecords.findIndex((record) => record.id === selectedId);
  if (selectedIndex < 0) return null;
  const startRect = selectedRow.getBoundingClientRect();
  const stackRect = returnStack.getBoundingClientRect();
  const stackStyle = getComputedStyle(returnStack);
  const step = parseFloat(stackStyle.getPropertyValue('--ticket-stack-step')) || ticketWalletStackPeek(visibleRecords.length);
  const paddingTop = parseFloat(stackStyle.paddingTop) || 0;
  const paddingLeft = parseFloat(stackStyle.paddingLeft) || 0;
  // Every row shares the stack origin. Keep the moving row in that stack for
  // the entire return, so the animation's final transform already is its CSS
  // resting position and the handoff does not reparent or redraw the ticket.
  const originLeft = stackRect.left + paddingLeft;
  const originTop = stackRect.top + paddingTop;
  const fromX = startRect.left - originLeft;
  const fromY = startRect.top - originTop;
  const toY = selectedIndex * step;
  const distance = Math.hypot(fromX, toY - fromY);
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return {
    index: selectedIndex,
    count: visibleRecords.length,
    height: startRect.height,
    fromX,
    fromY,
    toY,
    duration: reducedMotion ? 0 : Math.round(Math.max(200, Math.min(300, 180 + distance * .25))),
  };
}
function returnTicketWalletToPack(animate = true) {
  const selectedId = state.ticketWalletSelectedId;
  if (!selectedId) return false;
  if (ticketWalletDetailClosingId) return true;
  const detail = document.querySelector('[data-ticket-wallet-detail]');
  if (!animate || !detail) {
    state.ticketWalletSelectedId = '';
    render();
    return true;
  }
  const shell = detail.querySelector('.ticket-wallet-detail-card-shell');
  const selectedRow = shell?.querySelector('.ticket-wallet-detail-row');
  const returnStack = detail.querySelector('.ticket-wallet-return-pack-stack');
  // Measure while the return stack is still hidden, before changing styles.
  // The same card node will move into the stack before it is revealed. That
  // lets the return end in its real pack slot without a last-frame reparent.
  const motion = ticketWalletDetailReturnMotion(shell, detail, selectedId);
  if (!motion || !selectedRow || !returnStack) {
    state.ticketWalletSelectedId = '';
    render();
    return true;
  }
  ticketWalletDetailClosingId = selectedId;
  convertTicketWalletDetailRowToPack(selectedRow);
  selectedRow.classList.add('ticket-wallet-returning-row');
  selectedRow.style.setProperty('--ticket-stack-index', String(motion.index));
  shell.style.height = motion.height + 'px';
  const insertBefore = Array.from(returnStack.children).find((row) => Number(row.style.getPropertyValue('--ticket-stack-index')) > motion.index);
  returnStack.insertBefore(selectedRow, insertBefore || null);
  returnStack.style.setProperty('--ticket-stack-count', String(motion.count));
  detail.classList.add('is-closing');
  detail.setAttribute('aria-busy', 'true');
  window.clearTimeout(ticketWalletDetailClosingTimer);
  const finish = () => {
    if (ticketWalletDetailClosingId !== selectedId) return;
    // Exposing the prepared stack changes the detail section's content height.
    // Hold the current scroll position through that single DOM handoff.
    const scrollElement = appScrollElement();
    const scrollTopBeforeHandoff = appScrollTop();
    const previousOverflowAnchor = scrollElement?.style.overflowAnchor || '';
    if (scrollElement) scrollElement.style.overflowAnchor = 'none';
    const restoreWalletScroll = (restoreAnchor = false) => {
      if (!scrollElement?.isConnected) return;
      // Avoid reading scrollHeight/clientHeight here: those reads can force a
      // full layout during the final pack handoff.
      if (Math.abs(appScrollTop() - scrollTopBeforeHandoff) > 1) scrollAppTo(scrollTopBeforeHandoff, 'instant');
      if (restoreAnchor) scrollElement.style.overflowAnchor = previousOverflowAnchor;
    };
    ticketWalletDetailClosingCleanup?.();
    ticketWalletDetailClosingTimer = 0;
    ticketWalletDetailClosingId = '';
    if (state.ticketWalletSelectedId !== selectedId) {
      if (scrollElement) scrollElement.style.overflowAnchor = previousOverflowAnchor;
      return;
    }
    state.ticketWalletSelectedId = '';
    // The detail view already contains the complete return stack underneath
    // the moving card. Rebuilding the whole workspace here makes Safari
    // synchronously recreate every filter, control, and ticket SVG on the
    // animation's last frame, which is the visible hitch in the close video.
    // Replace only this view with the settled pack so the surrounding page
    // and its layout stay intact.
    const panel = detail.closest('[data-ticket-wallet-swipe-panel]');
    const canReplaceInPlace = panel && detail.isConnected && state.section === 'mine' && state.ticketWalletOpen && state.ticketWalletView === 'tickets';
    if (canReplaceInPlace) {
      const visibleTickets = ticketWalletFilteredRecords(ticketWalletDisplayRecords(state.ticketWallet));
      const returnStack = detail.querySelector('.ticket-wallet-return-pack-stack');
      if (visibleTickets.length && returnStack && selectedRow.isConnected && selectedRow.parentElement === returnStack) {
        // The moving card is already at its indexed stack position. Only
        // expose that prepared stack; do not rebuild or move the card here.
        returnStack.classList.remove('ticket-wallet-return-pack-stack');
        returnStack.style.setProperty('--ticket-stack-count', String(visibleTickets.length));
        detail.replaceWith(returnStack);
        // Restore once now and once before the next paint. This also covers
        // engines that apply their scroll-anchor adjustment after the DOM
        // mutation has completed.
        restoreWalletScroll();
        window.requestAnimationFrame(() => restoreWalletScroll(true));
        return;
      }
    }
    render();
    restoreWalletScroll();
    window.requestAnimationFrame(() => restoreWalletScroll(true));
  };
  let fallbackTransitionEnd = null;
  let fallbackFrame = 0;
  const fromTransform = 'translate3d(' + motion.fromX + 'px, ' + motion.fromY + 'px, 0)';
  const toTransform = 'translate3d(0, ' + motion.toY + 'px, 0)';
  const easing = 'cubic-bezier(.22, .61, .36, 1)';
  ticketWalletDetailClosingAnimation = selectedRow.animate?.([
    { transform: fromTransform },
    { transform: toTransform },
  ], { duration: motion.duration, easing, fill: 'forwards' }) || null;
  if (ticketWalletDetailClosingAnimation) ticketWalletDetailClosingAnimation.onfinish = finish;
  else {
    selectedRow.style.transition = 'none';
    selectedRow.style.transform = fromTransform;
    void selectedRow.offsetWidth;
    selectedRow.style.transition = 'transform ' + motion.duration + 'ms ' + easing;
    fallbackTransitionEnd = (event) => { if (event.target === selectedRow && event.propertyName === 'transform') finish(); };
    selectedRow.addEventListener('transitionend', fallbackTransitionEnd);
    fallbackFrame = window.requestAnimationFrame(() => { selectedRow.style.transform = toTransform; });
  }
  ticketWalletDetailClosingCleanup = () => {
    if (ticketWalletDetailClosingAnimation) {
      ticketWalletDetailClosingAnimation.onfinish = null;
      ticketWalletDetailClosingAnimation.cancel();
      ticketWalletDetailClosingAnimation = null;
    }
    if (fallbackFrame) window.cancelAnimationFrame(fallbackFrame);
    if (fallbackTransitionEnd) selectedRow.removeEventListener('transitionend', fallbackTransitionEnd);
    selectedRow.style.removeProperty('transition');
    selectedRow.style.removeProperty('transform');
    selectedRow.classList.remove('ticket-wallet-returning-row');
    shell.style.removeProperty('height');
    window.clearTimeout(ticketWalletDetailClosingTimer);
    ticketWalletDetailClosingCleanup = null;
  };
  ticketWalletDetailClosingTimer = window.setTimeout(finish, motion.duration + 140);
  return true;
}
function finishTicketWalletVerticalGesture(gesture) {
  if (!gesture || gesture.cancelled || !gesture.ticketWalletId || !gesture.ticketVertical) return false;
  if (gesture.dy >= -52 || Math.abs(gesture.dy) <= Math.abs(gesture.dx) + 12) return false;
  if (state.ticketWalletSelectedId !== gesture.ticketWalletId) return false;
  returnTicketWalletToPack(true);
  swipeSuppressClickUntil = Date.now() + 500;
  return true;
}
function convertTicketWalletDetailRowToPack(row) {
  if (!row) return;
  row.classList.remove('ticket-wallet-detail-row');
  row.setAttribute('data-ticket-wallet-pack-row', 'true');
  row.querySelector('.ticket-wallet-swipe-actions')?.remove();
  row.querySelectorAll('[data-ticket-wallet-edit-field]').forEach((target) => {
    target.removeAttribute('data-ticket-wallet-id');
    target.removeAttribute('data-ticket-wallet-edit-field');
    target.removeAttribute('role');
    target.removeAttribute('tabindex');
    target.removeAttribute('aria-label');
    target.classList.remove('ticket-edit-target', 'ticket-wallet-physical-edit-target');
    target.querySelector('title')?.remove();
  });
}
function finishTicketWalletTapGesture(gesture) {
  if (!gesture || gesture.cancelled || gesture.dragging || gesture.ticketVertical || !gesture.ticketWalletId) return false;
  if (Math.max(Math.abs(gesture.dx), Math.abs(gesture.dy)) > 12) return false;
  if (state.ticketWalletSelectedId === gesture.ticketWalletId) return false;
  state.ticketWalletSelectedId = gesture.ticketWalletId;
  // iOS Safari can dispatch the synthetic click after the touchend render.
  // Keep it suppressed long enough that it cannot land on the newly moved
  // ticket's SVG edit target.
  swipeSuppressClickUntil = Date.now() + 1000;
  ticketWalletSuppressSyntheticClick = true;
  ticketWalletSyntheticClickPoint = { x: gesture.startX, y: gesture.startY, expiresAt: Date.now() + 5000 };
  window.setTimeout(() => { ticketWalletSuppressSyntheticClick = false; ticketWalletSyntheticClickPoint = null; }, 5000);
  // Render on the next frame so the synthetic click generated by Safari still
  // resolves against the original ticket, instead of a newly moved SVG field.
  window.requestAnimationFrame(() => {
    if (state.ticketWalletSelectedId === gesture.ticketWalletId) render();
  });
  return true;
}
function ticketWalletMatchesSyntheticClick(event) {
  const point = ticketWalletSyntheticClickPoint;
  return Boolean(ticketWalletSuppressSyntheticClick && point && Date.now() < point.expiresAt && Number.isFinite(event.clientX) && Number.isFinite(event.clientY) && Math.hypot(event.clientX - point.x, event.clientY - point.y) <= 28);
}
function finishTicketWalletHorizontalGesture(gesture) {
  if (!gesture?.ticketWalletId) return false;
  const isPackRow = gesture.row.dataset.ticketWalletPackRow === 'true';
  if (isPackRow) {
    if (Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy) + 8) {
      swipeSuppressClickUntil = Date.now() + 350;
      return true;
    }
    return false;
  }
  if (gesture.dx < -52 && Math.abs(gesture.dx) > Math.abs(gesture.dy) + 12) {
    $$('.swipe-row.swiped').forEach((row) => { if (row !== gesture.row) row.classList.remove('swiped'); });
    gesture.row.classList.add('swiped');
    swipeSuppressClickUntil = Date.now() + 350;
    return true;
  }
  if (gesture.dx > 24 && Math.abs(gesture.dx) > Math.abs(gesture.dy) + 8) {
    gesture.row.classList.remove('swiped');
    return true;
  }
  return false;
}
function updateTicketWalletTouchGesture(event) {
  const gesture = swipeGesture;
  const touch = event.touches?.[0];
  const reorderDrag = ticketWalletReorder;
  if (touch && reorderDrag?.longPressed) {
    if (event.cancelable) event.preventDefault();
    queueTicketWalletReorderPosition(touch.clientX, touch.clientY);
    return;
  }
  if (!gesture?.ticketWalletId || !touch) return;
  gesture.dx = touch.clientX - gesture.startX;
  gesture.dy = touch.clientY - gesture.startY;
  if (Math.abs(gesture.dy) > Math.abs(gesture.dx) + 10 && Math.abs(gesture.dy) > 8) {
    gesture.ticketVertical = true;
    // Safari may cancel the pointer stream as soon as the page claims the
    // vertical pan. Keep receiving touch events so the intended card gesture
    // can still be committed on touchend.
    if (Math.abs(gesture.dy) > 14 && event.cancelable) event.preventDefault();
  }
}
function finishTicketWalletTouchGesture(event) {
  const gesture = swipeGesture;
  if (!gesture?.ticketWalletId) return;
  const touch = event.changedTouches?.[0];
  if (touch) {
    gesture.dx = touch.clientX - gesture.startX;
    gesture.dy = touch.clientY - gesture.startY;
  }
  swipeGesture = null;
  if (finishTicketWalletVerticalGesture(gesture)) return;
  if (finishTicketWalletTapGesture(gesture)) return;
  finishTicketWalletHorizontalGesture(gesture);
}
const TICKET_WALLET_REORDER_HOLD_MS = 430;
const TICKET_WALLET_REORDER_MOVE_TOLERANCE = 12;
function ticketWalletReorderRows(stack) {
  return stack ? Array.from(stack.children).filter((row) => row.matches('[data-ticket-wallet-pack-row="true"]')) : [];
}
function ticketWalletReorderEnabled() {
  return state.section === 'mine' && state.ticketWalletOpen && state.ticketWalletView === 'tickets' && !state.ticketWalletSelectedId && !state.ticketWalletEditorOpen && !state.ticketWalletMemoryDraft;
}
function clearTicketWalletReorderTarget(row) {
  const target = ticketWalletReorderTargetRow;
  if (!target || (row && target !== row)) return;
  window.clearTimeout(ticketWalletReorderRevealTimer);
  ticketWalletReorderRevealTimer = 0;
  target.classList.remove('ticket-wallet-reorder-armed');
  ticketWalletReorderTargetRow = null;
}
function clearTicketWalletReorderStyles(drag) {
  if (!drag?.stack) return;
  drag.stack.classList.remove('ticket-wallet-reorder-active');
  drag.rows.forEach((row) => {
    row.classList.remove('ticket-wallet-reorder-dragging', 'ticket-wallet-reorder-settling', 'ticket-wallet-reorder-shifted');
    row.style.removeProperty('--ticket-reorder-offset');
  });
}
function ticketWalletReorderSlot(drag, projectedCenter) {
  const otherRows = drag.rows.filter((row) => row !== drag.row);
  let slot = 0;
  for (const row of otherRows) {
    const index = drag.rows.indexOf(row);
    if (projectedCenter > drag.centers[index]) slot += 1;
  }
  return Math.max(0, Math.min(drag.rows.length - 1, slot));
}
function applyTicketWalletReorderPositions(drag, settling = false) {
  if (!drag?.rows?.length) return;
  const step = drag.step;
  const start = drag.startIndex;
  const target = drag.currentIndex;
  drag.rows.forEach((row, index) => {
    let offset = 0;
    if (index === start) {
      offset = settling ? (target - start) * step : drag.deltaY;
    } else if (target > start && index > start && index <= target) {
      offset = -step;
    } else if (target < start && index >= target && index < start) {
      offset = step;
    }
    row.style.setProperty('--ticket-reorder-offset', offset + 'px');
    row.classList.toggle('ticket-wallet-reorder-shifted', index !== start && offset !== 0);
  });
}
function armTicketWalletReorder(drag) {
  if (!drag || ticketWalletReorder !== drag || !ticketWalletReorderEnabled()) return;
  window.clearTimeout(drag.timer);
  clearTicketWalletReorderTarget();
  drag.longPressed = true;
  ticketWalletReorderTargetRow = drag.row;
  drag.row.classList.add('ticket-wallet-reorder-armed');
  ticketWalletReorderRevealTimer = 0;
  try { if (drag.pointerId != null) drag.row.setPointerCapture?.(drag.pointerId); } catch {}
  swipeGesture = null;
  try { navigator.vibrate?.(8); } catch {}
}
function activateTicketWalletReorder(drag) {
  if (!drag || ticketWalletReorder !== drag || !ticketWalletReorderEnabled()) return;
  drag.active = true;
  drag.deltaY = 0;
  drag.stack.classList.add('ticket-wallet-reorder-active');
  drag.row.classList.add('ticket-wallet-reorder-dragging');
  try { if (drag.pointerId != null) drag.row.setPointerCapture?.(drag.pointerId); } catch {}
  swipeGesture = null;
}
function beginTicketWalletReorder(event) {
  if (!ticketWalletReorderEnabled() || !event.isPrimary || (event.button != null && event.button !== 0)) return;
  const card = event.target.closest('[data-ticket-wallet-card]');
  const row = card?.closest('.ticket-wallet-stack > [data-ticket-wallet-pack-row="true"]');
  if (!card || !row) {
    clearTicketWalletReorderTarget();
    return;
  }
  const stack = row.closest('.ticket-wallet-stack');
  const rows = ticketWalletReorderRows(stack);
  if (!stack || rows.length < 2) return;
  const alreadyArmed = ticketWalletReorderTargetRow === row;
  if (!alreadyArmed) clearTicketWalletReorderTarget();
  else {
    window.clearTimeout(ticketWalletReorderRevealTimer);
    ticketWalletReorderRevealTimer = 0;
  }
  const startIndex = rows.indexOf(row);
  const rects = rows.map((item) => item.getBoundingClientRect());
  const stepValue = parseFloat(getComputedStyle(stack).getPropertyValue('--ticket-stack-step')) || 20;
  const drag = {
    stack, row, rows, pointerId: event.pointerId,
    startX: event.clientX, startY: event.clientY,
    startIndex, currentIndex: startIndex,
    centers: rects.map((rect) => rect.top + rect.height / 2),
    step: Math.max(1, stepValue), deltaY: 0,
    active: false, moved: false, longPressed: alreadyArmed, timer: 0
  };
  ticketWalletReorder = drag;
  if (alreadyArmed) {
    try { if (drag.pointerId != null) row.setPointerCapture?.(drag.pointerId); } catch {}
  }
  if (!alreadyArmed) drag.timer = window.setTimeout(() => armTicketWalletReorder(drag), TICKET_WALLET_REORDER_HOLD_MS);
}
function updateTicketWalletReorderAtPoint(clientX, clientY) {
  const drag = ticketWalletReorder;
  if (!drag) return;
  const dx = clientX - drag.startX;
  const dy = clientY - drag.startY;
  if (!drag.active) {
    if (!drag.longPressed) {
      if (Math.hypot(dx, dy) > TICKET_WALLET_REORDER_MOVE_TOLERANCE) {
        clearTimeout(drag.timer);
        ticketWalletReorder = null;
      }
      return;
    }
    if (Math.hypot(dx, dy) < 5) return;
    activateTicketWalletReorder(drag);
    if (!drag.active) return;
  }
  drag.deltaY = dy;
  drag.moved = drag.moved || Math.abs(dy) > 4;
  drag.currentIndex = ticketWalletReorderSlot(drag, drag.centers[drag.startIndex] + dy);
  applyTicketWalletReorderPositions(drag);
}
function queueTicketWalletReorderPosition(clientX, clientY) {
  ticketWalletReorderPoint = { x: clientX, y: clientY };
  if (ticketWalletReorderFrame) return;
  ticketWalletReorderFrame = window.requestAnimationFrame(() => {
    ticketWalletReorderFrame = 0;
    const point = ticketWalletReorderPoint;
    ticketWalletReorderPoint = null;
    if (point) updateTicketWalletReorderAtPoint(point.x, point.y);
  });
}
function flushTicketWalletReorderPosition(clientX, clientY) {
  if (ticketWalletReorderFrame) window.cancelAnimationFrame(ticketWalletReorderFrame);
  ticketWalletReorderFrame = 0;
  const point = Number.isFinite(clientX) && Number.isFinite(clientY)
    ? { x: clientX, y: clientY }
    : ticketWalletReorderPoint;
  ticketWalletReorderPoint = null;
  if (point) updateTicketWalletReorderAtPoint(point.x, point.y);
}
function clearTicketWalletReorderPosition() {
  if (ticketWalletReorderFrame) window.cancelAnimationFrame(ticketWalletReorderFrame);
  ticketWalletReorderFrame = 0;
  ticketWalletReorderPoint = null;
}
function updateTicketWalletReorder(event) {
  const drag = ticketWalletReorder;
  if (!drag || (drag.pointerId != null && event.pointerId !== drag.pointerId)) return;
  if (!drag.active && !drag.longPressed) {
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > TICKET_WALLET_REORDER_MOVE_TOLERANCE) {
      clearTimeout(drag.timer);
      ticketWalletReorder = null;
      clearTicketWalletReorderPosition();
    }
    return;
  }
  if (event.cancelable) event.preventDefault();
  queueTicketWalletReorderPosition(event.clientX, event.clientY);
}
function commitTicketWalletReorder(drag) {
  if (!drag?.rows?.length) return;
  const visibleRecords = ticketWalletFilteredRecords(ticketWalletDisplayRecords(state.ticketWallet));
  const visibleIds = new Set(visibleRecords.map((record) => record.id));
  const ids = drag.rows.map((row) => row.querySelector('[data-ticket-wallet-card]')?.dataset.ticketWalletCard).filter((id) => id && visibleIds.has(id));
  const movedId = ids.splice(drag.startIndex, 1)[0];
  if (!movedId) return;
  ids.splice(drag.currentIndex, 0, movedId);
  const stackIds = new Set(drag.rows.map((row) => row.querySelector('[data-ticket-wallet-card]')?.dataset.ticketWalletCard).filter((id) => id && visibleIds.has(id)));
  const recordById = new Map(visibleRecords.map((record) => [record.id, record]));
  const reorderedStack = ids.map((id) => recordById.get(id)).filter(Boolean);
  let stackCursor = 0;
  const reorderedVisible = visibleRecords.map((record) => stackIds.has(record.id) ? reorderedStack[stackCursor++] : record);
  let visibleCursor = 0;
  state.ticketWallet = state.ticketWallet.map((record) => visibleIds.has(record.id) ? reorderedVisible[visibleCursor++] : record);
  state.ticketWalletDisplayOrder = state.ticketWallet.map((record) => record.id);
  saveTicketWallet();
  saveTicketWalletDisplayOrder();
}
function settleTicketWalletReorderDom(drag) {
  if (!drag?.stack?.isConnected || !drag.rows?.length) return;
  const orderedRows = [...drag.rows];
  const [movedRow] = orderedRows.splice(drag.startIndex, 1);
  if (movedRow) orderedRows.splice(drag.currentIndex, 0, movedRow);
  const fragment = document.createDocumentFragment();
  orderedRows.forEach((row, index) => {
    row.style.setProperty('--ticket-stack-index', String(index));
    fragment.appendChild(row);
  });
  drag.stack.appendChild(fragment);
  // The rows already reached these positions during the drop animation. Swap
  // their stack indices and remove the temporary offsets in the same frame,
  // so their ticket SVGs can be reused without rebuilding the whole wallet.
  clearTicketWalletReorderStyles(drag);
}
function finishTicketWalletReorder(event) {
  const drag = ticketWalletReorder;
  if (!drag || (drag.pointerId != null && event.pointerId !== drag.pointerId)) return false;
  clearTimeout(drag.timer);
  if (drag.active || drag.longPressed) flushTicketWalletReorderPosition(event.clientX, event.clientY);
  else clearTicketWalletReorderPosition();
  ticketWalletReorder = null;
  if (!drag.active) {
    if (!drag.longPressed) return false;
    ticketWalletReorderSuppressClickUntil = Date.now() + 900;
    ticketWalletReorderRevealTimer = window.setTimeout(() => clearTicketWalletReorderTarget(drag.row), 9000);
    return true;
  }
  if (event.cancelable) event.preventDefault();
  if (!drag.moved || drag.currentIndex === drag.startIndex) {
    clearTicketWalletReorderStyles(drag);
    clearTicketWalletReorderTarget(drag.row);
    ticketWalletReorderSuppressClickUntil = Date.now() + 900;
    return true;
  }
  clearTicketWalletReorderTarget(drag.row);
  ticketWalletReorderSuppressClickUntil = Date.now() + 900;
  drag.stack.classList.add('ticket-wallet-reorder-active');
  drag.row.classList.remove('ticket-wallet-reorder-dragging');
  drag.row.classList.add('ticket-wallet-reorder-settling');
  applyTicketWalletReorderPositions(drag, true);
  commitTicketWalletReorder(drag);
  window.setTimeout(() => {
    settleTicketWalletReorderDom(drag);
    clearTicketWalletReorderTarget(drag.row);
    toast(state.language === 'en' ? 'Ticket order saved' : '票据顺序已保存');
  }, 190);
  return true;
}
function cancelTicketWalletReorder() {
  const drag = ticketWalletReorder;
  clearTicketWalletReorderPosition();
  if (!drag) return;
  clearTimeout(drag.timer);
  ticketWalletReorder = null;
  clearTicketWalletReorderStyles(drag);
  clearTicketWalletReorderTarget(drag.row);
}
workspace.addEventListener('pointerdown', beginTicketWalletReorder, true);
workspace.addEventListener('contextmenu', (event) => {
  if (event.target.closest('.ticket-wallet-stack > [data-ticket-wallet-pack-row="true"]')) event.preventDefault();
}, true);
workspace.addEventListener('touchstart', (event) => {
  if (swipeGesture || event.target.closest('.swipe-delete')) return;
  const row = event.target.closest('[data-swipe-row]');
  const ticketCard = event.target.closest('[data-ticket-wallet-card]');
  const ticketWalletEditTarget = event.target.closest('button, a, [data-ticket-wallet-edit-field], [data-ticket-wallet-edit], [data-ticket-wallet-original], [data-ticket-wallet-apple], [data-ticket-wallet-delete]');
  if (!row || !ticketCard || (ticketWalletEditTarget && state.ticketWalletSelectedId === ticketCard.dataset.ticketWalletCard)) return;
  const touch = event.touches?.[0];
  if (!touch) return;
  swipeGesture = { row, ticketWalletId: ticketCard.dataset.ticketWalletCard, startX: touch.clientX, startY: touch.clientY, dx: 0, dy: 0, dragging: false, ticketVertical: false, cancelled: false };
}, { passive: true });
workspace.addEventListener('touchmove', updateTicketWalletTouchGesture, { passive: false });
workspace.addEventListener('touchend', finishTicketWalletTouchGesture, { passive: true });
workspace.addEventListener('touchcancel', () => {
  if (swipeGesture?.ticketWalletId) swipeGesture = null;
}, { passive: true });
$('#notificationPanel').addEventListener('pointerdown', (event) => {
  const row = event.target.closest('[data-swipe-row]');
  if (!row || event.target.closest('.swipe-delete')) { if (!row) $$('.swipe-row.swiped').forEach((item) => item.classList.remove('swiped')); swipeGesture = null; return; }
  swipeGesture = { row, startX: event.clientX, startY: event.clientY, dx: 0, dy: 0, dragging: false, cancelled: false };
});
workspace.addEventListener('pointermove', (event) => {
  if (!swipeGesture) return;
  swipeGesture.dx = event.clientX - swipeGesture.startX; swipeGesture.dy = event.clientY - swipeGesture.startY;
  if (swipeGesture.ticketWalletId && Math.abs(swipeGesture.dy) > Math.abs(swipeGesture.dx) + 10 && Math.abs(swipeGesture.dy) > 8) { swipeGesture.ticketVertical = true; return; }
  if (Math.abs(swipeGesture.dy) > Math.abs(swipeGesture.dx) + 10 && Math.abs(swipeGesture.dy) > 8) { swipeGesture.cancelled = true; return; }
  if (Math.abs(swipeGesture.dx) > 14) swipeGesture.dragging = true;
});
document.addEventListener('pointerup', () => {
  const gesture = swipeGesture; swipeGesture = null;
  if (!gesture || gesture.cancelled) return;
  if (finishTicketWalletVerticalGesture(gesture)) return;
  if (finishTicketWalletTapGesture(gesture)) return;
  finishTicketWalletHorizontalGesture(gesture);
}, { passive: true });

nav.addEventListener('pointerdown', (event) => { const tab = event.target.closest('[data-tool]'); if (tab) { startLongPress(tab, 'tool', Number(tab.dataset.toolIndex), event); beginTabSwipe(nav.querySelector('.tool-tabs') || nav, event); } });
nav.addEventListener('pointerup', endLongPress);
nav.addEventListener('pointercancel', endLongPress);
nav.addEventListener('click', (event) => {
  const scrollButton = event.target.closest('[data-tool-scroll]');
  if (scrollButton) {
    event.preventDefault();
    scrollToolTabs(scrollButton.dataset.toolScroll === 'previous' ? -1 : 1);
    return;
  }
  const tab = event.target.closest('[data-tool]'); if (!tab) return;
  if (Date.now() < reorderSuppressClickUntil || Date.now() < tabSwipeSuppressClickUntil || Date.now() < pageSwipeSuppressClickUntil) { event.preventDefault(); return; }
  if (handleReorderClick(tab, 'tool', Number(tab.dataset.toolIndex))) { event.preventDefault(); return; }
  selectTool(tab.dataset.tool);
  requestAnimationFrame(() => focusActiveToolTab(true));
  if (tab.dataset.tool === 'weather') refreshWeatherCard(state.weatherCards.find((card) => card.id === state.activeWeatherId));
});
nav.addEventListener('dragstart', (event) => { const tab = event.target.closest('[data-tool]'); if (tab) event.dataTransfer.setData('text/plain', tab.dataset.toolIndex); });
nav.addEventListener('dragover', (event) => { if (event.target.closest('[data-tool]')) event.preventDefault(); });
  nav.addEventListener('drop', (event) => { event.preventDefault(); const tab = event.target.closest('[data-tool]'); if (tab) swapToolOrder(Number(event.dataTransfer.getData('text/plain')), Number(tab.dataset.toolIndex)); });

homeSourceNav.addEventListener('pointerdown', (event) => {
  const source = event.target.closest('[data-feed-source]');
  if (source?.dataset.feedSourceIndex != null) startLongPress(source, 'feed', Number(source.dataset.feedSourceIndex), event);
});
homeSourceNav.addEventListener('pointerup', endLongPress);
homeSourceNav.addEventListener('pointercancel', endLongPress);
homeSourceNav.addEventListener('click', (event) => {
  if (event.target.closest('[data-open-home-source-picker]')) {
    event.preventDefault();
    openHomeSourceDialog();
    return;
  }
  const scrollButton = event.target.closest('[data-feed-source-scroll]');
  if (scrollButton) {
    event.preventDefault();
    scrollHomeFeedTabs(scrollButton.dataset.feedSourceScroll === 'previous' ? -1 : 1);
    return;
  }
  const feedSource = event.target.closest('[data-feed-source]');
  if (!feedSource) return;
  if (Date.now() < reorderSuppressClickUntil || Date.now() < tabSwipeSuppressClickUntil || Date.now() < pageSwipeSuppressClickUntil) { event.preventDefault(); event.stopPropagation(); return; }
  if (feedSource.dataset.feedSourceIndex != null && handleReorderClick(feedSource, 'feed', Number(feedSource.dataset.feedSourceIndex))) { event.preventDefault(); event.stopPropagation(); return; }
  // This navigation has a delegated document-level handler as well. Stop the
  // event here so one tap can only start one refresh/render transaction.
  event.preventDefault();
  event.stopPropagation();
  selectHomeFeedSource(feedSource.dataset.feedSource);
});
homeSourceNav.addEventListener('dragstart', (event) => { const source = event.target.closest('[data-feed-source]'); if (source) event.dataTransfer.setData('text/plain', source.dataset.feedSourceIndex); });
homeSourceNav.addEventListener('dragover', (event) => { if (event.target.closest('[data-feed-source]')) event.preventDefault(); });
homeSourceNav.addEventListener('drop', (event) => { event.preventDefault(); const source = event.target.closest('[data-feed-source]'); if (source) swapHomeFeedSources(Number(event.dataTransfer.getData('text/plain')), Number(source.dataset.feedSourceIndex)); });

workspace.addEventListener('pointerdown', (event) => {
  const filterRail = event.target.closest('.ticket-wallet-filter-scroll');
  if (filterRail) beginTabSwipe(filterRail, event);
});

workspace.addEventListener('pointerdown', (event) => { const card = event.target.closest('[data-weather-card]'); if (card && !event.target.closest('[data-delete-weather]')) startLongPress(card, 'weather', Number(card.dataset.weatherIndex), event); });
// Weather cards are draggable and also own a long-press gesture. Handle the
// delete control during capture so touch/PWA pointer events cannot be claimed
// by the card's reorder lifecycle before the delegated click handler sees it.
workspace.addEventListener('pointerup', handleWeatherDeletePointer, true);
workspace.addEventListener('click', handleWeatherDeletePointer, true);
workspace.addEventListener('pointerdown', (event) => { const source = event.target.closest('[data-feed-source]'); if (source?.dataset.feedSourceIndex != null) startLongPress(source, 'feed', Number(source.dataset.feedSourceIndex), event); });
workspace.addEventListener('pointerdown', (event) => {
  const navigationVisible = state.section === 'navigation' || (state.section === 'tools' && state.tool === 'navigation');
  if (!navigationVisible) return;
  const card = event.target.closest('[data-navigation-item]');
  if (card && !event.target.closest('[data-navigation-open-action], [data-navigation-delete], [data-navigation-edit]')) startNavigationLongPress(card, event);
});
$('#navigationDialog').addEventListener('pointerdown', (event) => {
  const card = event.target.closest('.navigation-folder-sites [data-navigation-item]');
  if (card && !event.target.closest('[data-navigation-open-action], [data-navigation-delete], [data-navigation-edit]')) startNavigationDialogLongPress(card, event);
});
workspace.addEventListener('pointerdown', (event) => {
  const book = event.target.closest('[data-reader-book-card]');
  if (book && event.target.closest('[data-delete-book]')) return;
  if (book) {
    startLongPress(book, 'book', Number(book.dataset.readerBookIndex), event);
    try { if (event.pointerId != null) book.setPointerCapture?.(event.pointerId); } catch {}
  }
  else if (state.tool === 'reader' && state.readerMode === 'library') clearReaderDeleteMode();
});
workspace.addEventListener('pointerup', endLongPress);
workspace.addEventListener('pointercancel', endLongPress);
document.addEventListener('pointermove', updateTicketWalletReorder, { passive: false });
document.addEventListener('pointerup', finishTicketWalletReorder, { passive: false });
document.addEventListener('pointercancel', cancelTicketWalletReorder, { passive: true });
document.addEventListener('pointermove', updateReorderDrag, { passive: false });
document.addEventListener('pointermove', updateReaderBookDrag, { passive: false });
document.addEventListener('pointermove', updateNavigationDrag, { passive: false });
document.addEventListener('pointermove', updateNavigationDialogLongPress, { passive: true });
document.addEventListener('pointerup', (event) => { if (finishReorderDrag(event) || finishReaderBookDrag(event)) endLongPress(); }, { passive: false });
document.addEventListener('pointerup', (event) => { finishNavigationDrag(event); }, { passive: false });
document.addEventListener('pointerup', (event) => { finishNavigationDialogLongPress(event); }, { passive: false });
document.addEventListener('pointerdown', (event) => {
  if (state.tool !== 'reader' || state.readerMode !== 'library') return;
  if (event.target.closest('[data-reader-book-card], [data-reader-layout-toggle], [data-open-reader-file]')) return;
  clearReaderDeleteMode();
}, true);
document.querySelector('main')?.addEventListener('pointerdown', beginHomeFeedPull);
document.querySelector('main')?.addEventListener('pointerdown', beginPageSwipe);
document.addEventListener('pointermove', updateHomeFeedPull, { passive: false });
document.addEventListener('pointermove', updateTabSwipe, { passive: false });
document.addEventListener('pointermove', updatePageSwipe, { passive: false });
document.addEventListener('pointerup', finishHomeFeedPull, { passive: true });
document.addEventListener('pointerup', finishTabSwipe, { passive: true });
document.addEventListener('pointerup', finishPageSwipe, { passive: true });
document.addEventListener('pointercancel', () => {
  const cancelledSwipeGesture = swipeGesture;
  tabSwipeGesture = null; pageSwipeGesture = null; homePullGesture = null;
  workspace.classList.remove('feed-pulling'); workspace.style.removeProperty('--feed-pull-distance');
  if (readerSurfaceGesture?.dragging) settleReaderPageDrag(readerSurfaceGesture, 0, true);
  readerSurfaceGesture = null;
  endLongPress(); cancelReorderDrag();
  if (navigationDrag) { restoreNavigationDrag(navigationDrag); navigationDrag = null; }
  endNavigationLongPress(); cancelNavigationDialogLongPress(); clearNavigationDragClasses(); if (!cancelledSwipeGesture?.ticketWalletId) swipeGesture = null; resetPageSwipeTransform();
  if (readerBookDrag) {
    releaseReaderBookPointer(readerBookDrag);
    readerBookDrag.over?.classList.remove('reorder-over');
    readerBookDrag.target.classList.remove('reader-book-dragging', 'reader-delete-ready', 'reorder-hold');
    readerBookDrag = null;
    if (reorderTarget?.type === 'book') reorderTarget = null;
  }
}, { passive: true });
workspace.addEventListener('pointerdown', (event) => {
  const surface = event.target.closest('[data-reader-surface]');
  if (state.readerMode === 'reading' && surface) {
    state.readerSelectionInput = event.pointerType === 'touch' ? 'touch' : 'mouse';
    readerSurfaceGesture = { surface, x: event.clientX, y: event.clientY, pointerId: event.pointerId, pointerType: event.pointerType, startedAt: Date.now() };
    // Do not capture a touch pointer on selectable reader text. iOS Safari
    // uses the native target to complete long-press selection; capturing it
    // here retargets the selection/callout sequence to the article and makes
    // the browser's copy menu disappear. The document-level pointerup below
    // still receives the gesture when it leaves the surface.
  }
});
workspace.addEventListener('touchstart', (event) => {
  if (readerSurfaceGesture || state.readerMode !== 'reading') return;
  const surface = event.target.closest('[data-reader-surface]');
  const touch = event.touches[0];
  if (surface && touch) readerSurfaceGesture = { surface, x: touch.clientX, y: touch.clientY, pointerId: null, pointerType: 'touch', startedAt: Date.now() };
}, { passive: true });
let readerSurfaceTapSuppressClickUntil = 0;
function suppressReaderPageNativePan(event) {
  const gesture = readerSurfaceGesture;
  if (!gesture || state.readerMode !== 'reading' || state.readerReadingMode !== 'pages') return;
  const pointerType = event.pointerType || gesture.pointerType;
  if (pointerType !== 'touch') return;
  // iOS Safari owns long-press text selection. Do not cancel a touch move
  // that started on reader text; even small finger drift before the long-press
  // threshold can otherwise abort WebKit's selection/callout pipeline.
  if (isIosSafariBrowser() && event.target.closest?.('[data-reader-content]')) return;
  const point = event.touches?.[0] || event;
  const dx = point.clientX - gesture.x;
  const dy = point.clientY - gesture.y;
  // Let a held text selection take over after the long-press threshold. Before
  // that, only cancel a clearly vertical drift; cancelling every move also
  // cancels WebKit's native long-press selection pipeline.
  if (Date.now() - gesture.startedAt < 320 && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) + 4 && event.cancelable) {
    event.preventDefault();
  }
}
function readerPageDragOffset(gesture, dx) {
  const viewport = gesture.viewport || gesture.surface?.closest('.reader-page-viewport');
  const flow = gesture.flow || viewport?.querySelector('.reader-page-flow');
  if (!viewport || !flow) return null;
  const width = gesture.width || Math.max(1, viewport.clientWidth);
  const count = gesture.count || readerPageCount(viewport);
  const current = gesture.page;
  const limit = width * .96;
  let movement = Math.max(-limit, Math.min(limit, dx));
  if ((current <= 0 && movement > 0) || (current >= count - 1 && movement < 0)) movement *= .22;
  return { viewport, flow, width, count, offset: -current * width + movement };
}
let readerPageDragFrame = 0;
let readerPageDragPending = null;
function flushReaderPageDrag() {
  readerPageDragFrame = 0;
  const pending = readerPageDragPending;
  readerPageDragPending = null;
  const gesture = readerSurfaceGesture;
  if (!pending || !gesture || gesture !== pending.gesture || !gesture.dragging || gesture.cancelled) return;
  const drag = readerPageDragOffset(gesture, pending.dx);
  if (!drag) return;
  const transform = 'translate3d(' + drag.offset + 'px, 0, 0)';
  // Keep the gesture on the compositor. Safari can dispatch several input
  // events before a paint; coalescing them prevents duplicate style commits.
  drag.flow.style.transform = transform;
}
function updateReaderPageDrag(event) {
  const gesture = readerSurfaceGesture;
  if (!gesture || gesture.pointerType !== 'touch' || state.readerMode !== 'reading' || state.readerReadingMode !== 'pages') return;
  if (gesture.pointerId != null && event.pointerId != null && event.pointerId !== gesture.pointerId) return;
  const point = event.touches?.[0] || event;
  const dx = point.clientX - gesture.x; const dy = point.clientY - gesture.y;
  if (readerHasLiveSelection()) {
    if (!gesture.cancelled) {
      if (gesture.dragging) setReaderPagePosition(gesture.page, 'smooth');
      gesture.cancelled = true;
    }
    return;
  }
  if (!gesture.dragging) {
    if (Date.now() - gesture.startedAt > 320) return;
    if (Math.abs(dy) > Math.abs(dx) + 10 && Math.abs(dy) > 8) { gesture.cancelled = true; return; }
    if (Math.abs(dx) < 10 || Math.abs(dx) <= Math.abs(dy) + 8) return;
    const viewport = gesture.surface?.closest('.reader-page-viewport');
    const flow = viewport?.querySelector('.reader-page-flow');
    if (!viewport || !flow) return;
    ensureReaderPageColumns(viewport, flow);
    gesture.page = state.readerPage;
    gesture.viewport = viewport;
    gesture.flow = flow;
    gesture.width = Math.max(1, viewport.clientWidth);
    gesture.count = readerPageCount(viewport);
    gesture.dragging = true;
    gesture.dragStartedAt = Date.now();
  }
  const drag = readerPageDragOffset(gesture, dx);
  if (!drag) return;
  if (!gesture.dragFramePrepared) {
    drag.flow.style.transition = 'none';
    drag.flow.style.webkitTransition = 'none';
    gesture.dragFramePrepared = true;
  }
  readerPageDragPending = { gesture, dx };
  if (!readerPageDragFrame) readerPageDragFrame = requestAnimationFrame(flushReaderPageDrag);
  if (event.cancelable) event.preventDefault();
}
function settleReaderPageDrag(gesture, dx, cancelled = false) {
  if (!gesture?.dragging) return false;
  if (readerPageDragPending?.gesture === gesture) {
    readerPageDragPending = null;
    if (readerPageDragFrame) cancelAnimationFrame(readerPageDragFrame);
    readerPageDragFrame = 0;
  }
  const drag = readerPageDragOffset(gesture, dx);
  if (!drag) return false;
  const elapsed = Math.max(1, Date.now() - (gesture.dragStartedAt || gesture.startedAt));
  const velocity = Math.abs(dx) / elapsed;
  const threshold = Math.max(56, Math.min(112, drag.width * .18));
  const direction = dx < 0 ? 1 : -1;
  const targetPage = gesture.page + direction;
  const commit = !cancelled && (Math.abs(dx) >= threshold || (velocity >= .55 && Math.abs(dx) >= 18)) && targetPage >= 0 && targetPage < drag.count;
  swipeSuppressClickUntil = Date.now() + 520;
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const behavior = state.readerPreferences.pageAnimation !== 'none' && !prefersReducedMotion ? 'smooth' : 'instant';
  setReaderPagePosition(commit ? targetPage : gesture.page, behavior);
  return true;
}
workspace.addEventListener('pointermove', suppressReaderPageNativePan, { passive: false });
document.addEventListener('pointermove', updateReaderPageDrag, { passive: false });
// iOS Safari with Pointer Events also emits touchmove for the same gesture.
// Listening to both paths makes one finger movement update the track twice.
// Keep touchmove only for older engines without Pointer Events.
if (!('PointerEvent' in window)) {
  workspace.addEventListener('touchmove', suppressReaderPageNativePan, { passive: false });
  document.addEventListener('touchmove', updateReaderPageDrag, { passive: false });
}
function finishReaderSurfaceGesture(clientX, clientY, target) {
  const gesture = readerSurfaceGesture; readerSurfaceGesture = null;
  if (!gesture || state.readerMode !== 'reading') return;
  const dx = clientX - gesture.x; const dy = clientY - gesture.y;
  if (gesture.dragging) {
    settleReaderPageDrag(gesture, dx, readerHasLiveSelection());
    return;
  }
  const targetElement = target instanceof Element ? target : null;
  const onInteractiveControl = targetElement?.closest('a,button,input,textarea,select,[data-reader-comment-id],[data-reader-selection-menu],[data-reader-comment-popover]');
  // A native text selection can move more than a tap while its handles are
  // being adjusted. Never reinterpret that gesture as a page turn.
  if (onInteractiveControl || readerHasLiveSelection() || Date.now() < readerSelectionSuppressUntil) return;
  if (state.readerReadingMode === 'scroll' && isIosSafariBrowser() && state.readerImmersive && Math.abs(dx) <= 12 && Math.abs(dy) <= 12) {
    readerSurfaceTapSuppressClickUntil = Date.now() + 500;
    toggleReaderChrome();
    return;
  }
  if (state.readerReadingMode !== 'pages') return;
  if (Math.abs(dx) <= 12 && Math.abs(dy) <= 12) {
    // A tap is a chrome toggle in paged reading. Page turns are deliberately
    // reserved for a horizontal swipe (or the explicit corner buttons), so a
    // light tap can never become a vertical browser scroll or a fake turn.
    readerSurfaceTapSuppressClickUntil = Date.now() + 500;
    if (state.readerImmersive) toggleReaderChrome();
    else toggleReaderFullscreen();
    return;
  }
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) + 15) {
    // Always swallow the synthetic click produced at the end of a drag. This
    // is essential for mouse text selection, where no page turn is scheduled
    // but the click would otherwise toggle the reader chrome.
    swipeSuppressClickUntil = Date.now() + 500;
    // A mouse drag over text is a selection gesture, not a page swipe. On
    // touch, a long press followed by movement is likewise selection; only a
    // short touch drag is eligible for page navigation.
    if (gesture.pointerType !== 'touch' || Date.now() - gesture.startedAt > 300) return;
    // Safari dispatches selectionchange just after pointerup for a drag that
    // started on selectable text. Suppress the synthetic click immediately,
    // then decide whether this was a page swipe after the selection has had a
    // chance to settle.
    const direction = dx < 0 ? 1 : -1;
    window.setTimeout(() => {
      if (readerHasLiveSelection() || Date.now() < readerSelectionSuppressUntil) return;
      if (state.readerMode === 'reading' && state.readerReadingMode === 'pages') turnReaderPage(direction);
    }, 70);
  }
}
document.addEventListener('pointerup', (event) => {
  finishReaderSurfaceGesture(event.clientX, event.clientY, event.target);
  // WebKit queues selectionchange after pointerup. Give that native range a
  // few bounded ticks to settle, then mirror it into the OneBox action bar.
  scheduleReaderNativeSelectionMenuSync();
}, { passive: true });
document.addEventListener('touchend', () => {
  // Some iOS versions complete the native Range on touchend without a
  // corresponding pointerup after the page gesture recognizer intervenes.
  scheduleReaderNativeSelectionMenuSync();
}, { capture: true, passive: true });
workspace.addEventListener('touchend', (event) => {
  if (!readerSurfaceGesture || readerSurfaceGesture.pointerId !== null) return;
  const touch = event.changedTouches[0];
  if (touch) finishReaderSurfaceGesture(touch.clientX, touch.clientY, event.target);
  scheduleReaderNativeSelectionMenuSync();
}, { passive: true });
workspace.addEventListener('dragstart', (event) => { const card = event.target.closest('[data-weather-card]'); if (card) event.dataTransfer.setData('text/plain', card.dataset.weatherIndex); });
workspace.addEventListener('dragover', (event) => { if (event.target.closest('[data-weather-card]')) event.preventDefault(); });
workspace.addEventListener('drop', (event) => { event.preventDefault(); const card = event.target.closest('[data-weather-card]'); if (card) swapWeatherCards(Number(event.dataTransfer.getData('text/plain')), Number(card.dataset.weatherIndex)); });
workspace.addEventListener('dragstart', (event) => { const source = event.target.closest('[data-feed-source]'); if (source) event.dataTransfer.setData('text/plain', source.dataset.feedSourceIndex); });
workspace.addEventListener('dragover', (event) => { if (event.target.closest('[data-feed-source]')) event.preventDefault(); });
workspace.addEventListener('drop', (event) => { event.preventDefault(); const source = event.target.closest('[data-feed-source]'); if (source) swapHomeFeedSources(Number(event.dataTransfer.getData('text/plain')), Number(source.dataset.feedSourceIndex)); });
workspace.addEventListener('contextmenu', (event) => {
  const navigationItem = event.target.closest('[data-navigation-item]');
  if (navigationItem && (state.section === 'navigation' || (state.section === 'tools' && state.tool === 'navigation'))) {
    // Navigation cards own the long-press gesture. Prevent Safari/Chrome from
    // replacing the app action sheet with their native callout menu.
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (state.readerMode !== 'reading') return;
  const selection = window.getSelection();
  // Safari may retarget the long-press contextmenu to the fixed reader shell
  // rather than the text node that owns the native Range. Resolve the reader
  // root independently and only intercept when the live selection belongs to
  // it; otherwise leave Safari's native selection callout untouched.
  const content = $('[data-reader-content]');
  const range = selection?.rangeCount && !selection.isCollapsed ? selection.getRangeAt(0) : null;
  const inside = (node) => Boolean(node && content && (node === content || content.contains(node)));
  const hasSelection = Boolean(range && content && (inside(range.commonAncestorContainer) || (inside(range.startContainer) && inside(range.endContainer))));
  // Do not cancel an empty contextmenu on Safari. iOS uses this event as part
  // of the long-press-to-select sequence; cancelling it before a Range exists
  // removes the native selection handles and leaves no action bar to use.
  if (!hasSelection) return;
  event.preventDefault();
  event.stopPropagation();
  readerShowSelectionMenu(range);
  scheduleReaderNativeSelectionMenuSync();
});
workspace.addEventListener('click', async (event) => {
  if (Date.now() < reorderSuppressClickUntil || Date.now() < pageSwipeSuppressClickUntil) { event.preventDefault(); return; }
  const walletPage = event.target.closest('.ticket-wallet-page');
  const blankWalletClick = walletPage && !event.target.closest('.ticket-wallet-swipe-row, button, a, input, textarea, select, [role="tab"]');
  if (ticketWalletReorderTargetRow && blankWalletClick) clearTicketWalletReorderTarget();
  if (Date.now() < ticketWalletReorderSuppressClickUntil && event.target.closest('.ticket-wallet-swipe-row')) { event.preventDefault(); event.stopPropagation(); return; }
  if (ticketWalletMatchesSyntheticClick(event) && event.target.closest('[data-ticket-wallet-edit-field]')) {
    event.preventDefault();
    return;
  }
  const navigationPage = state.section === 'navigation' || (state.section === 'tools' && state.tool === 'navigation');
  if (navigationPage && !event.target.closest('[data-navigation-item]')) clearNavigationActionCards();
  if (Date.now() < navigationSuppressClickUntil && event.target.closest('[data-navigation-item]') && !event.target.closest('[data-navigation-delete], [data-navigation-edit]')) { event.preventDefault(); return; }
  if (Date.now() < readerBookSuppressClickUntil && event.target.closest('[data-reader-book-card]')) { event.preventDefault(); return; }
  if (Date.now() < swipeSuppressClickUntil && event.target.closest('[data-swipe-row]') && !event.target.closest('.swipe-delete')) return;
  if (Date.now() < swipeSuppressClickUntil && state.readerMode === 'reading') { event.preventDefault(); event.stopPropagation(); return; }
  const readerSelectionControl = event.target.closest('[data-reader-selection-action], [data-reader-comment-popover], [data-reader-comment-id]');
  const readerSelectionSafeControl = event.target.closest('[data-reader-settings], [data-reader-toc], [data-reader-comments], [data-reader-fullscreen], [data-close-reader], [data-reader-page-prev], [data-reader-page-next], [data-reader-chapter-prev], [data-reader-chapter-next]');
  if (state.readerMode === 'reading' && readerHasLiveSelection() && !readerSelectionControl && !readerSelectionSafeControl) {
    // Safari may leave the application anchor alive for one selectionchange
    // tick after the native range has collapsed. Do not let that stale anchor
    // block the next toolbar tap; an actual native range still protects the
    // selection from accidental page gestures.
    if (!readerNativeSelectionRange() && $('[data-reader-selection-menu]')?.hidden !== false) {
      clearReaderSelectionState();
      hideReaderSelectionMenu();
    } else {
      event.preventDefault(); event.stopPropagation(); return;
    }
  }
  if (state.tool === 'reader' && state.readerMode === 'library' && !event.target.closest('[data-reader-book-card]')) clearReaderDeleteMode();
  const section = event.target.closest('[data-section]');
  if (section) return selectSection(section.dataset.section);
  if (event.target.closest('[data-open-ticket-wallet]')) return openTicketWallet();
  if (event.target.closest('[data-ticket-wallet-map-return]')) return returnFromTicketWalletMap();
  if (event.target.closest('[data-ticket-wallet-back]')) { if (returnFromTicketWalletMap()) return; return closeTicketWallet(); }
  const mapTicket = event.target.closest('[data-ticket-wallet-map-ticket]');
  if (mapTicket) {
    const record = state.ticketWallet.find((item) => item.id === mapTicket.dataset.ticketWalletMapTicket);
    if (record) {
      ticketWalletMapReturnContext = null;
      state.ticketWalletTypeFilter = ticketWalletCategoryForType(record.type); saveTicketWalletTypeFilter(); state.ticketWalletView = 'tickets'; state.ticketWalletSelectedId = record.id; state.ticketWalletEditorOpen = false;
      event.preventDefault(); return render();
    }
  }
  const mapLocate = event.target.closest('[data-ticket-wallet-map-locate]');
  if (mapLocate) {
    const record = state.ticketWallet.find((item) => item.id === mapLocate.dataset.ticketWalletMapLocate);
    if (record && ((TICKET_WALLET_TRAVEL_TYPES.includes(record.type) && record.from && record.to) || ticketWalletMapPlaceEntry(record))) {
      ticketWalletMapReturnContext = { id: record.id, filter: state.ticketWalletTypeFilter };
      ticketWalletMapFocusId = record.id; state.ticketWalletTypeFilter = ticketWalletCategoryForType(record.type); saveTicketWalletTypeFilter(); state.ticketWalletView = 'journeys'; state.ticketWalletSelectedId = '';
      event.preventDefault(); return render();
    }
  }
  const ticketWalletView = event.target.closest('[data-ticket-wallet-view]');
  if (ticketWalletView?.dataset.ticketWalletView === 'tickets' && ticketWalletMapReturnContext) return returnFromTicketWalletMap();
  if (ticketWalletView) { state.ticketWalletView = ticketWalletView.dataset.ticketWalletView === 'journeys' ? 'journeys' : 'tickets'; if (state.ticketWalletView !== 'journeys') ticketWalletMapFocusId = ''; state.ticketWalletMemoryDraft = null; return render(); }
  const cafeRatingButton = event.target.closest('[data-ticket-wallet-cafe-rate]');
  if (cafeRatingButton) {
    const index = state.ticketWallet.findIndex((item) => item.id === cafeRatingButton.dataset.ticketWalletId && item.type === 'dining');
    if (index >= 0) {
      state.ticketWallet[index] = normalizeTicketRecord({ ...state.ticketWallet[index], cafeRating: cafeRatingButton.dataset.ticketWalletCafeRate, updatedAt: Date.now() });
      saveTicketWallet(); render();
    }
    return;
  }
  const cafeMoodPreset = event.target.closest('[data-ticket-wallet-cafe-mood-preset]');
  if (cafeMoodPreset && state.ticketWalletEditorOpen && state.ticketWalletDraft?.type === 'dining') {
    const mood = cafeMoodPreset.dataset.ticketWalletCafeMoodPreset || '';
    state.ticketWalletDraft.cafeMood = mood;
    const moodInput = workspace.querySelector('[data-ticket-wallet-cafe-field="cafeMood"]');
    if (moodInput) moodInput.value = mood;
    workspace.querySelectorAll('[data-ticket-wallet-cafe-mood-preset]').forEach((button) => button.classList.toggle('active', button === cafeMoodPreset));
    return;
  }
  const cafeDrinkMode = event.target.closest('[data-ticket-wallet-drink-mode]');
  if (cafeDrinkMode && state.ticketWalletEditorOpen && state.ticketWalletDraft?.type === 'dining') {
    state.ticketWalletDraft.drinkServiceMode = cafeDrinkMode.dataset.ticketWalletDrinkMode || '';
    workspace.querySelectorAll('[data-ticket-wallet-drink-mode]').forEach((button) => {
      const active = button.dataset.ticketWalletDrinkMode === state.ticketWalletDraft.drinkServiceMode;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    updateTicketWalletCafeLabelPreview();
    return;
  }
  const ticketWalletAddCategory = event.target.closest('[data-ticket-wallet-add-category]');
  if (ticketWalletAddCategory && state.ticketWalletEditorOpen && state.ticketWalletDraft) {
    const category = ticketWalletAddCategory.dataset.ticketWalletAddCategory;
    const nextType = ticketWalletDefaultTypeForFilter(category);
    if (ticketWalletCategoryForType(state.ticketWalletDraft.type) !== category) {
      state.ticketWalletDraft.type = nextType;
      state.ticketWalletDraft.template = ticketWalletDefaultTemplate(nextType);
      state.ticketWalletDraft.title = ticketTypeLabel(nextType);
      state.ticketWalletDraft.carrier = '';
      if (nextType === 'dining') state.ticketWalletDraft.diningKind = 'drink';
    }
    return render();
  }
  const ticketWalletAddType = event.target.closest('[data-ticket-wallet-add-type]');
  if (ticketWalletAddType && state.ticketWalletEditorOpen && state.ticketWalletDraft) {
    const nextType = normalizeTicketType(ticketWalletAddType.dataset.ticketWalletAddType);
    if (state.ticketWalletDraft.type !== nextType) {
      state.ticketWalletDraft.type = nextType;
      state.ticketWalletDraft.template = ticketWalletDefaultTemplate(nextType);
      state.ticketWalletDraft.title = ticketTypeLabel(nextType);
      state.ticketWalletDraft.carrier = '';
      if (nextType === 'dining') state.ticketWalletDraft.diningKind = 'drink';
    }
    return render();
  }
  const ticketWalletTemplate = event.target.closest('[data-ticket-wallet-template]');
  if (ticketWalletTemplate && state.ticketWalletEditorOpen && state.ticketWalletDraft) {
    const draft = state.ticketWalletDraft;
    const previousTemplate = TICKET_WALLET_FLIGHT_TEMPLATES[draft.template];
    const nextTemplateId = ticketWalletTemplate.dataset.ticketWalletTemplate || ticketWalletDefaultTemplate(draft.type);
    const nextTemplate = TICKET_WALLET_FLIGHT_TEMPLATES[nextTemplateId];
    if (draft.type === 'flight' && (!draft.carrier || previousTemplate?.carrier && draft.carrier === previousTemplate.carrier)) draft.carrier = nextTemplate?.carrier || '';
    draft.template = ticketWalletNormalizeTemplate(draft.type, nextTemplateId);
    document.querySelectorAll('[data-ticket-wallet-template]').forEach((item) => {
      const selected = item === ticketWalletTemplate;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });
    return;
  }
  const ticketWalletFilter = event.target.closest('[data-ticket-wallet-filter]');
  if (ticketWalletFilter) {
    cancelTicketWalletReorder();
    clearTicketWalletReorderTarget();
    selectTicketWalletFilter(ticketWalletFilter.dataset.ticketWalletFilter || 'all');
    return;
  }
  const ticketWalletDiningKindFilter = event.target.closest('[data-ticket-wallet-dining-kind-filter]');
  if (ticketWalletDiningKindFilter) {
    const nextKind = normalizeTicketWalletDiningKindFilter(ticketWalletDiningKindFilter.dataset.ticketWalletDiningKindFilter);
    state.ticketWalletDiningKindFilter = nextKind;
    state.ticketWalletSelectedId = '';
    saveTicketWalletDiningKindFilter();
    return render();
  }
  const ticketWalletAddDiningKind = event.target.closest('[data-ticket-wallet-add-dining-kind]');
  if (ticketWalletAddDiningKind && state.ticketWalletEditorOpen && state.ticketWalletDraft?.type === 'dining') {
    state.ticketWalletDraft.diningKind = normalizeTicketWalletDiningKind(ticketWalletAddDiningKind.dataset.ticketWalletAddDiningKind, 'drink');
    return render();
  }
  const ticketWalletDrinkCategory = event.target.closest('[data-ticket-wallet-drink-category]');
  if (ticketWalletDrinkCategory && state.ticketWalletEditorOpen && state.ticketWalletDraft?.type === 'dining') {
    const value = ticketWalletDrinkCategory.dataset.ticketWalletDrinkCategory || '';
    state.ticketWalletDraft.drinkCategory = state.ticketWalletDraft.drinkCategory === value ? '' : value;
    workspace.querySelectorAll('[data-ticket-wallet-drink-category]').forEach((button) => {
      const active = button.dataset.ticketWalletDrinkCategory === state.ticketWalletDraft.drinkCategory;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    updateTicketWalletCafeLabelPreview();
    return;
  }
  const ticketWalletDrinkAttribute = event.target.closest('[data-ticket-wallet-drink-attribute]');
  if (ticketWalletDrinkAttribute && state.ticketWalletEditorOpen && state.ticketWalletDraft?.type === 'dining') {
    const field = ticketWalletDrinkAttribute.dataset.ticketWalletDrinkAttribute;
    if (Object.prototype.hasOwnProperty.call(LUCKIN_DRINK_ATTRIBUTES, field)) state.ticketWalletDraft[field] = state.ticketWalletDraft[field] === ticketWalletDrinkAttribute.dataset.value ? '' : ticketWalletDrinkAttribute.dataset.value;
    workspace.querySelectorAll('[data-ticket-wallet-drink-attribute="' + field + '"]').forEach((button) => {
      const active = button.dataset.value === state.ticketWalletDraft[field];
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    updateTicketWalletCafeLabelPreview();
    return;
  }
  if (event.target.closest('[data-ticket-wallet-add]')) { return openTicketWalletEditor(); }
  if (event.target.closest('[data-ticket-wallet-import-image]')) { $('#ticketWalletFileInput')?.click(); return; }
  const ticketWalletCreateEmpty = event.target.closest('[data-ticket-wallet-create-empty]');
  if (ticketWalletCreateEmpty) {
    state.ticketWalletEditorStage = 'details';
    if (state.ticketWalletDraft?.type === 'dining' && !state.ticketWalletDraft.departAt) state.ticketWalletDraft.departAt = localDateTimeValue(Date.now());
    return render();
  }
  if (event.target.closest('[data-ticket-wallet-stage-back]')) { state.ticketWalletEditorStage = 'choose'; return render(); }
  if (event.target.closest('[data-ticket-wallet-import-json]')) { $('#ticketWalletJsonInput')?.click(); return; }
  if (event.target.closest('[data-ticket-wallet-cancel]')) return closeTicketWalletEditor();
  if (event.target.closest('[data-ticket-wallet-save]')) return saveTicketWalletRecord();
  if (event.target.closest('[data-ticket-wallet-recognize]')) return rerunTicketWalletRecognition();
  const ticketFieldEdit = event.target.closest('[data-ticket-wallet-edit-field]');
  if (ticketFieldEdit) {
    if (ticketWalletMatchesSyntheticClick(event)) { event.preventDefault(); return; }
    ticketWalletSuppressSyntheticClick = false;
    ticketWalletSyntheticClickPoint = null;
    event.preventDefault();
    return openTicketWalletInlineField(ticketFieldEdit.dataset.ticketWalletId, ticketFieldEdit.dataset.ticketWalletEditField, ticketFieldEdit);
  }
  const ticketOriginalDraft = event.target.closest('[data-ticket-wallet-original-draft]');
  if (ticketOriginalDraft) return openTicketWalletOriginalSource(ticketOriginalDraft.dataset.ticketWalletOriginalDraft, state.ticketWalletDraft?.sourceImageName || t('ticketWalletOriginal'));
  if (event.target.closest('[data-ticket-wallet-clear-selection]')) { returnTicketWalletToPack(true); return; }
  const ticketCard = event.target.closest('[data-ticket-wallet-card]');
  if (ticketCard && !event.target.closest('[data-ticket-wallet-edit-field], [data-ticket-wallet-edit], [data-ticket-wallet-original], [data-ticket-wallet-apple], [data-ticket-wallet-delete]')) {
    // iOS may emit the synthetic click after the tap has already selected and
    // re-rendered the stack. The rendered card under that same point can be a
    // different ticket, so consume that one click instead of selecting twice.
    if (ticketWalletMatchesSyntheticClick(event)) {
      event.preventDefault();
      ticketWalletSuppressSyntheticClick = false;
      ticketWalletSyntheticClickPoint = null;
      return;
    }
    if (state.ticketWalletSelectedId !== ticketCard.dataset.ticketWalletCard) {
      state.ticketWalletSelectedId = ticketCard.dataset.ticketWalletCard;
      ticketWalletSuppressSyntheticClick = true;
      ticketWalletSyntheticClickPoint = { x: event.clientX, y: event.clientY, expiresAt: Date.now() + 5000 };
      window.setTimeout(() => { ticketWalletSuppressSyntheticClick = false; ticketWalletSyntheticClickPoint = null; }, 5000);
      window.requestAnimationFrame(() => {
        if (state.ticketWalletSelectedId === ticketCard.dataset.ticketWalletCard) render();
      });
      return;
    }
  }
  const ticketEdit = event.target.closest('[data-ticket-wallet-edit]');
  if (ticketEdit) { state.ticketWalletSelectedId = ticketEdit.dataset.ticketWalletEdit; state.ticketWalletEditorOpen = false; return render(); }
  const ticketDelete = event.target.closest('[data-ticket-wallet-delete]');
  if (ticketDelete) return deleteTicketWalletRecord(ticketDelete.dataset.ticketWalletDelete);
  const ticketNotes = event.target.closest('[data-ticket-wallet-notes]');
  if (ticketNotes) return editTicketWalletNotes(ticketNotes.dataset.ticketWalletNotes);
  const ticketOriginal = event.target.closest('[data-ticket-wallet-original]');
  if (ticketOriginal) return openTicketWalletOriginal(ticketOriginal.dataset.ticketWalletOriginal);
  const ticketApple = event.target.closest('[data-ticket-wallet-apple]');
  if (ticketApple) return exportTicketWalletPass(ticketApple.dataset.ticketWalletApple);
  const ticketMemory = event.target.closest('[data-ticket-wallet-memory]');
  if (ticketMemory) return openTicketWalletMemoryEditor(ticketMemory.dataset.ticketWalletMemory);
  if (event.target.closest('[data-ticket-wallet-memory-cancel]')) return closeTicketWalletMemoryEditor();
  if (event.target.closest('[data-ticket-wallet-memory-image]')) { $('#ticketWalletMemoryImageInput')?.click(); return; }
  if (event.target.closest('[data-ticket-wallet-memory-save]')) return saveTicketWalletMemory();
  const ticketShare = event.target.closest('[data-ticket-wallet-share]');
  if (ticketShare) return shareTicketWalletJourney(ticketShare.dataset.ticketWalletShare);
  const homeTool = event.target.closest('[data-home-tool]');
  if (homeTool) return selectTool(homeTool.dataset.homeTool);
  const devJsonToggle = event.target.closest('[data-dev-json-toggle]');
  if (devJsonToggle) {
    const path = decodeURIComponent(devJsonToggle.dataset.devJsonPath || '$');
    const collapsed = new Set(state.devTools.formatCollapsed);
    if (collapsed.has(path)) collapsed.delete(path); else collapsed.add(path);
    state.devTools.formatCollapsed = [...collapsed]; saveDevTools(); return render();
  }
  if (event.target.closest('[data-dev-fullscreen]')) return toggleDeveloperFullscreen();
  if (event.target.closest('[data-toggle-dev-history]')) { state.devTools.historyOpen = !state.devTools.historyOpen; saveDevTools(); return render(); }
  const deleteDevRecord = event.target.closest('[data-delete-dev-record]');
  if (deleteDevRecord) {
    const kind = DEV_TOOL_IDS.includes(deleteDevRecord.dataset.deleteDevRecordKind) ? deleteDevRecord.dataset.deleteDevRecordKind : state.devTools.active;
    state.devTools.records[kind] = (state.devTools.records[kind] || []).filter((item) => String(item.id) !== String(deleteDevRecord.dataset.deleteDevRecord));
    saveDevTools(); return render();
  }
  const clearDevRecords = event.target.closest('[data-clear-dev-records]');
  if (clearDevRecords) {
    const kind = DEV_TOOL_IDS.includes(clearDevRecords.dataset.devRecordKind) ? clearDevRecords.dataset.devRecordKind : state.devTools.active;
    state.devTools.records[kind] = [];
    saveDevTools(); return render();
  }
  const devMode = event.target.closest('[data-dev-mode]');
  if (devMode) { state.devTools.active = DEV_TOOL_IDS.includes(devMode.dataset.devMode) ? devMode.dataset.devMode : DEV_TOOL_IDS[0]; saveDevTools(); return render(); }
  const devRecord = event.target.closest('[data-dev-record]');
  if (devRecord) return loadDeveloperRecord(devRecord.dataset.devRecordKind, devRecord.dataset.devRecord);
  const devAction = event.target.closest('[data-dev-action]');
  if (devAction) {
    if (devAction.dataset.devAction === 'dev-copy-output') return developerCopyOutput();
    if (devAction.dataset.devAction === 'json-expand-all' || devAction.dataset.devAction === 'json-collapse-all') {
      if (devAction.dataset.devAction === 'json-expand-all') state.devTools.formatCollapsed = [];
      else { try { state.devTools.formatCollapsed = collectDeveloperJsonPaths(JSON.parse(state.devTools.formatOutput || 'null')); } catch { state.devTools.formatCollapsed = []; } }
      saveDevTools(); return render();
    }
    return runDeveloperAction(devAction.dataset.devAction, event);
  }
  if (event.target.closest('[data-open-navigation-settings]')) {
    state.navigationSettingsOpen = !state.navigationSettingsOpen;
    clearNavigationActionCards();
    return syncNavigationSettingsPopover(event.target.closest('[data-open-navigation-settings]'));
  }
  const navigationOpenMode = event.target.closest('[data-navigation-open-mode]');
  if (navigationOpenMode) {
    state.openMode = navigationOpenMode.dataset.navigationOpenMode === 'new-tab' ? 'new-tab' : 'current';
    saveStored(STORAGE.openMode, state.openMode);
    state.navigationSettingsOpen = false;
    // The opening mode is part of each card's anchor markup. Re-render the
    // navigation surface so target="_blank" is applied immediately instead
    // of only taking effect after a later route change.
    return render();
  }
  if (event.target.closest('[data-open-navigation-add]')) return openNavigationAddDialog();
  const navigationOpenAction = event.target.closest('[data-navigation-open-action]');
  if (navigationOpenAction) {
    event.preventDefault(); event.stopPropagation();
    const card = navigationOpenAction.closest('[data-navigation-item]');
    state.navigationSettingsOpen = false;
    if (card?.dataset.navigationType === 'folder') return openNavigationFolderDialog(card.dataset.navigationId);
    const link = card?.querySelector('[data-navigation-open-site]');
    if (link) return openNavigationSite(link);
    return;
  }
  const navigationPrimary = event.target.closest('[data-navigation-open-site], [data-navigation-open-folder]');
  if (navigationPrimary) {
    if (navigationPrimary.matches('[data-navigation-open-site]') && navigationPrimary.target === '_blank') {
      state.navigationSettingsOpen = false;
      // Let the real anchor perform the new-tab navigation. Safari treats
      // this native user-gesture path more reliably than a delegated
      // preventDefault() followed by window.open().
      return;
    }
    event.preventDefault(); event.stopPropagation();
    const card = navigationPrimary.closest('[data-navigation-item]');
    if (navigationPrimary.matches('[data-navigation-open-folder]')) return openNavigationFolderDialog(card.dataset.navigationId);
    return openNavigationSite(card.querySelector('[data-navigation-open-site]') || navigationPrimary);
  }
  const navigationEdit = event.target.closest('[data-navigation-edit]');
  if (navigationEdit) {
    event.preventDefault(); event.stopPropagation();
    return openNavigationEditDialog(navigationEdit.dataset.navigationEdit, navigationEdit.closest('[data-navigation-folder-id]')?.dataset.navigationFolderId || '');
  }
  const navigationDelete = event.target.closest('[data-navigation-delete]');
  if (navigationDelete) {
    event.preventDefault(); event.stopPropagation();
    return deleteNavigationSite(navigationDelete.dataset.navigationDelete, navigationDelete.closest('[data-navigation-folder-id]')?.dataset.navigationFolderId || '');
  }
  const navigationSiteLink = event.target.closest('[data-navigation-open-site]');
  if (navigationSiteLink) {
    if (navigationSiteLink.target === '_blank') return;
    event.preventDefault(); event.stopPropagation();
    state.navigationSettingsOpen = false;
    return openNavigationSite(navigationSiteLink);
  }
  const navigationFolder = event.target.closest('[data-navigation-open-folder]');
  if (navigationFolder) {
    event.preventDefault(); event.stopPropagation();
    state.navigationSettingsOpen = false;
    return openNavigationFolderDialog(navigationFolder.dataset.navigationOpenFolder);
  }
  if (event.target.closest('[data-reader-layout-toggle]')) {
    state.readerLayout = state.readerLayout === 'list' ? 'grid' : 'list';
    saveReaderLayout(); return render();
  }
  const readerBackupExportButton = event.target.closest('[data-reader-backup-export]');
  if (readerBackupExportButton) return exportReaderBackup(readerBackupExportButton);
  if (event.target.closest('[data-reader-backup-import]')) { $('#readerBackupInput')?.click(); return; }
  const newAction = event.target.closest('[data-feed-only-new]');
  if (newAction) { event.preventDefault(); event.stopPropagation(); return revealHomeFeedNew(newAction.closest('[data-feed-source]')?.dataset.feedSource || state.homeFeed.active); }
  const loadMoreAction = event.target.closest('[data-feed-load-more]');
  if (loadMoreAction) {
    event.preventDefault(); event.stopPropagation();
    const preservedPosition = captureHomeFeedPosition();
    homeFeedExpanded.add(state.homeFeed.active);
    render();
    restoreHomeFeedPosition(preservedPosition);
    return;
  }
  const feedSource = event.target.closest('[data-feed-source]');
  if (feedSource) {
    if (Date.now() < tabSwipeSuppressClickUntil) { event.preventDefault(); return; }
    if (feedSource.dataset.feedSourceIndex != null && handleReorderClick(feedSource, 'feed', Number(feedSource.dataset.feedSourceIndex))) { event.preventDefault(); return; }
    return selectHomeFeedSource(feedSource.dataset.feedSource);
  }
  const feedItem = event.target.closest('[data-feed-link]');
  const feedLink = feedItem?.dataset.feedLink;
  if (feedItem) {
    if (feedLink) {
      if (openFeedLink(feedLink, feedItem.dataset.feedOpenNewTab === 'true')) { markFeedRead(feedItem.dataset.feedId); feedItem.classList.add('is-read'); }
    } else toast(state.language === 'en' ? 'This article link is unavailable' : '这篇文章暂时没有可用链接', 'error');
    return;
  }
  if (state.readerMode === 'reading') {
    const selectionAction = event.target.closest('[data-reader-selection-action]');
    if (selectionAction) { await applyReaderSelectionAction(selectionAction.dataset.readerSelectionAction); return; }
    const commentMarker = event.target.closest('[data-reader-comment-id]');
    if (commentMarker) { showReaderCommentPopover(commentMarker.dataset.readerCommentId, commentMarker); return; }
    if (!event.target.closest('[data-reader-comment-popover]')) hideReaderCommentPopover();
    if (event.target.closest('[data-reader-chapter-prev]')) { goReaderChapter(-1); return; }
    if (event.target.closest('[data-reader-chapter-next]')) { goReaderChapter(1); return; }
    if (event.target.closest('[data-reader-background]')) { openReaderDialog('background'); return; }
    if (event.target.closest('[data-reader-animation]')) { openReaderDialog('animation'); return; }
    if (event.target.closest('[data-reader-comments]')) { openReaderDialog('comments'); return; }
    if (event.target.closest('[data-reader-fullscreen]')) { toggleReaderFullscreen(); return; }
    const surface = event.target.closest('[data-reader-surface]');
    if (surface && !event.target.closest('a,button,input,textarea,select')) {
      if (Date.now() < readerSurfaceTapSuppressClickUntil) return;
      if (Date.now() < swipeSuppressClickUntil) return;
      /* Safari webpage fullscreen has no native reader chrome layer. A tap
         on the reading surface must therefore be the same chrome toggle as
         the standalone PWA, even when the book is using the paged renderer;
         horizontal page turns remain available through an actual swipe. */
      if (isIosSafariBrowser() && state.readerImmersive) {
        toggleReaderChrome();
      } else if (state.readerReadingMode === 'pages' && surface.classList.contains('reader-page-viewport')) {
        const rect = surface.getBoundingClientRect(); const x = event.clientX - rect.left;
        if (x < rect.width * .32) turnReaderPage(-1);
        else if (x > rect.width * .68) turnReaderPage(1);
        else if (state.readerImmersive) toggleReaderChrome();
        else toggleReaderFullscreen();
      } else if (state.readerImmersive) toggleReaderChrome();
      else toggleReaderFullscreen();
      return;
    }
  }
  if (event.target.closest('[data-open-reader-file]')) { $('#readerFileInput')?.click(); return; }
  if (event.target.closest('[data-reader-toc]')) { openReaderDialog('toc'); return; }
  if (event.target.closest('[data-reader-settings]')) { openReaderDialog('settings'); return; }
  if (event.target.closest('[data-close-reader]')) return closeReader();
  const readerMode = event.target.closest('[data-reader-mode]');
  if (readerMode) {
    setReaderReadingMode(readerMode.dataset.readerMode);
    return;
  }
  const readerPageButton = event.target.closest('[data-reader-page-prev], [data-reader-page-next]');
  if (readerPageButton) {
    const direction = readerPageButton.hasAttribute('data-reader-page-next') ? 1 : -1;
    turnReaderPage(direction);
    return;
  }
  const deleteBook = event.target.closest('[data-delete-book]');
  if (deleteBook) {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(t('deleteConfirm'))) return;
    state.library = state.library.filter((book) => book.id !== deleteBook.dataset.deleteBook); await oneBoxDbDelete('books', deleteBook.dataset.deleteBook); saveLibrary(); render(); return;
  }
  const bookCard = event.target.closest('[data-reader-book-card]');
  if (bookCard && handleReorderClick(bookCard, 'book', Number(bookCard.dataset.readerBookIndex))) { event.preventDefault(); return; }
  // A touch drag keeps pointer capture on the card so the browser cannot
  // steal the gesture for page scrolling. In that case the synthetic click
  // can target the article instead of its inner open button; resolve the
  // button from the card as a fallback so a normal tap still opens the book.
  const openReader = event.target.closest('[data-open-reader]') || event.target.closest('[data-reader-book-card]')?.querySelector('[data-open-reader]');
  if (openReader) return openReaderBook(openReader.dataset.openReader);
  if (event.target.closest('[data-annotate-selection]')) return renderAnnotationDialog();
  const deleteAnnotation = event.target.closest('[data-delete-annotation]');
  if (deleteAnnotation) {
    const book = readerBookById(state.readerBookId); if (book) { book.annotations = (book.annotations || []).filter((note) => note.id !== deleteAnnotation.dataset.deleteAnnotation); saveLibrary(); render(); }
    return;
  }
  if (event.target.closest('[data-open-settings-page]')) return renderSettings();
  if (event.target.closest('[data-open-pet-page]')) return renderPetDialog();
  if (event.target.closest('[data-check-update]')) return checkForUpdate();
  if (event.target.closest('[data-apply-update]')) return applyUpdate();
  if (event.target.closest('[data-open-github-page]')) return renderGithubDialog();
  if (event.target.closest('[data-open-recent-reading]')) return renderRecentReading();
  if (event.target.closest('[data-open-agreement-page]')) return renderAgreementDialog();
  const messageDelete = event.target.closest('[data-delete-notification]');
  if (messageDelete) { state.notifications = state.notifications.filter((item) => item.id !== messageDelete.dataset.deleteNotification); saveNotifications(); render(); return; }
  if (event.target.closest('[data-mark-notifications-read]')) { state.notifications.forEach((item) => { item.read = true; }); saveNotifications(); render(); return; }
  const key = event.target.closest('[data-key]');
  if (key) return calculatorKey(key.dataset.key);
  const scienceKey = event.target.closest('[data-science-key]');
  if (scienceKey) { state.calcJustEvaluated = false; state.calcExpr += scienceKey.dataset.scienceKey; saveCalculator(); return render(); }
  if (event.target.closest('[data-answer]')) { state.calcJustEvaluated = false; state.calcExpr += state.calcHistory[0]?.result || calcPreview(); saveCalculator(); return render(); }
  if (event.target.closest('[data-toggle-inverse]')) { state.calcInverse = !state.calcInverse; return render(); }
  if (event.target.closest('[data-toggle-calc-history]')) { state.calcHistoryOpen = !state.calcHistoryOpen; saveCalculator(); return render(); }
  if (event.target.closest('[data-toggle-angle]')) { state.calcAngle = state.calcAngle === 'deg' ? 'rad' : 'deg'; return render(); }
  const history = event.target.closest('[data-history-expression]');
  if (history) { state.calcExpr = history.dataset.historyExpression || ''; state.calcJustEvaluated = false; saveCalculator(); return render(); }
  const deleteCalcHistory = event.target.closest('[data-delete-calc-history]');
  if (deleteCalcHistory) { state.calcHistory = state.calcHistory.filter((item) => String(item.id || item.at || item.expression) !== deleteCalcHistory.dataset.deleteCalcHistory); saveCalculator(); return render(); }
  if (event.target.closest('[data-clear-calc-history]')) { state.calcHistory = []; saveCalculator(); return render(); }
  if (event.target.closest('[data-open-event-dialog]')) return renderEventDialog();
  const calendarPicker = event.target.closest('[data-calendar-picker]');
  if (calendarPicker) return renderCalendarPickerDialog(calendarPicker.dataset.calendarPicker);
  const month = event.target.closest('[data-month]');
  if (month) return setCalendarMonth(state.month.getFullYear(), state.month.getMonth() + Number(month.dataset.month));
  if (event.target.closest('[data-today]')) { state.month = new Date(today.getFullYear(), today.getMonth(), 1); state.selectedDate = dateKey(today); return render(); }
  const day = event.target.closest('[data-date]');
  if (day) {
    const now = Date.now();
    const repeated = state.lastCalendarTap.key === day.dataset.date && now - state.lastCalendarTap.at < 650;
    state.lastCalendarTap = { key: day.dataset.date, at: now };
    state.selectedDate = day.dataset.date;
    if (day.dataset.outside === 'true') { const date = dateFromKey(day.dataset.date); state.month = new Date(date.getFullYear(), date.getMonth(), 1); }
    render();
    if (repeated) renderLunarDialog(day.dataset.date);
    return;
  }
  const deleteEvent = event.target.closest('[data-delete-event]');
  if (deleteEvent) {
    const removed = Object.values(state.events || {}).flat().find((item) => item.id === deleteEvent.dataset.deleteEvent);
    Object.keys(state.events).forEach((day) => { state.events[day] = (state.events[day] || []).filter((item) => item.id !== deleteEvent.dataset.deleteEvent); if (!state.events[day].length) delete state.events[day]; });
    if (removed?.sourceTicketId) {
      const ticket = state.ticketWallet.find((item) => item.id === removed.sourceTicketId);
      if (ticket) {
        ticket.calendarEventDisabled = true;
        ticket.calendarEventId = '';
        ticket.calendarEventSourceDate = ticketWalletCalendarSchedule(ticket)?.sourceDate || removed.sourceDate || '';
        saveTicketWallet();
      }
    }
    saveEvents(); syncAgendaReminders(); scheduleNotificationCheck(); return render();
  }
  const weatherClear = event.target.closest('[data-weather-clear]');
  if (weatherClear) {
    event.preventDefault(); event.stopPropagation();
    state.weatherSearchRequest += 1; state.weatherSearchQuery = ''; state.weatherSearchTerm = '';
    state.weatherSearchLoading = false; state.weatherSearchError = ''; state.weatherSearchResults = [];
    const input = $('#cityInput');
    if (input) { input.value = ''; input.focus(); }
    weatherClear.hidden = true;
    updateWeatherSearchResults();
    return;
  }
  const weatherResult = event.target.closest('[data-weather-result-index]');
  if (weatherResult) return addWeatherPlace(state.weatherSearchResults[Number(weatherResult.dataset.weatherResultIndex)]);
  const deleteWeather = event.target.closest('[data-delete-weather]');
  if (deleteWeather) {
    if (deleteWeather.dataset.weatherDeleteHandled === 'true') return;
    deleteWeather.dataset.weatherDeleteHandled = 'true';
    event.preventDefault(); event.stopPropagation();
    return removeWeatherCard(deleteWeather.dataset.deleteWeather, Number(deleteWeather.dataset.deleteWeatherIndex));
  }
  const weatherCard = event.target.closest('[data-weather-card]');
  if (weatherCard) {
    if (handleReorderClick(weatherCard, 'weather', Number(weatherCard.dataset.weatherIndex))) { event.preventDefault(); return; }
    state.activeWeatherId = weatherCard.dataset.weatherCard;
    const selectedCard = state.weatherCards.find((card) => card.id === state.activeWeatherId);
    if (selectedCard?.loadError && !selectedCard.current) return refreshWeatherCard(selectedCard);
    return render();
  }
  if (event.target.closest('[data-add-weather-card]')) { $('#cityInput')?.focus(); return toast(state.language === 'en' ? 'Search a city or district to add a card' : '搜索城市或区县即可添加天气卡片'); }
  if (event.target.closest('[data-locate]')) {
    if (!navigator.geolocation) {
      state.weatherLoading = false;
      state.weatherError = state.language === 'en' ? 'This browser does not support location access.' : '当前浏览器不支持定位。';
      return render();
    }
    state.weatherLoading = true; state.weatherError = ''; render();
    try {
      return navigator.geolocation.getCurrentPosition((position) => {
        void (async () => addWeatherPlace(await reverseGeocode(position.coords.latitude, position.coords.longitude)))().catch((error) => {
          state.weatherLoading = false; state.weatherError = weatherLocationError(error); render();
        });
      }, (error) => {
        state.weatherLoading = false; state.weatherError = weatherLocationError(error); render();
      }, { enableHighAccuracy: false, maximumAge: 120000, timeout: 15000 });
    } catch (error) {
      state.weatherLoading = false; state.weatherError = weatherLocationError(error); render();
    }
  }
  if (event.target.closest('[data-swap]')) { [conversion.from, conversion.to] = [conversion.to, conversion.from]; return render(); }
  if (event.target.closest('[data-swap-language]')) {
    const source = state.translation.source === 'auto' ? 'en' : state.translation.source;
    const target = state.translation.target === 'auto' ? 'en' : state.translation.target;
    state.translation.source = target; state.translation.target = source; return render();
  }
  if (event.target.closest('[data-copy-conversion]')) {
    const value = formatNumber(convertedValue()) + ' ' + units[conversion.category].units[conversion.to][1];
    try { await navigator.clipboard.writeText(value); const copyStatus = $('#copyStatus'); if (copyStatus) copyStatus.textContent = t('copied'); } catch { toast(state.language === 'en' ? 'Clipboard access was denied' : '浏览器不允许访问剪贴板，请手动复制', 'error'); }
    return;
  }
  if (event.target.closest('[data-copy-translation]')) {
    if (!state.translation.result) return;
    try { await navigator.clipboard.writeText(state.translation.result); toast(t('copied')); } catch { toast(state.language === 'en' ? 'Clipboard access was denied' : '浏览器不允许访问剪贴板，请手动复制', 'error'); }
    return;
  }
  if (event.target.closest('[data-translate-submit]')) return translateText();
  if (event.target.closest('[data-toggle-translation-history]')) { state.translationHistoryOpen = !state.translationHistoryOpen; saveStored(STORAGE.translationHistoryOpen, state.translationHistoryOpen); return render(); }
  const translationHistory = event.target.closest('[data-translation-history]');
  if (translationHistory) {
    const item = state.translationHistory.find((entry) => entry.id === translationHistory.dataset.translationHistory);
    if (item) { state.translation.source = item.source; state.translation.target = item.target; state.translation.input = item.input; state.translation.result = item.result; render(); }
    return;
  }
  const deleteTranslation = event.target.closest('[data-delete-translation]');
  if (deleteTranslation) { state.translationHistory = state.translationHistory.filter((item) => item.id !== deleteTranslation.dataset.deleteTranslation); saveTranslationHistory(); return render(); }
  if (event.target.closest('[data-clear-translation-history]')) { state.translationHistory = []; saveTranslationHistory(); return render(); }
});
document.addEventListener('click', (event) => {
  if (!event.target.closest('#workspace[data-tool="weather"] .weather-search-area')) closeWeatherSearchPopover();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeWeatherSearchPopover();
});
document.addEventListener('click', (event) => {
  const navigationPage = state.section === 'navigation' || (state.section === 'tools' && state.tool === 'navigation');
  if (!navigationPage || event.target.closest('#workspace[data-tool="navigation"] [data-navigation-item], #workspace[data-tool="navigation"] [data-open-navigation-add], [data-open-navigation-settings], .navigation-settings-popover, #navigationDialog')) return;
  if (state.navigationSettingsOpen) { state.navigationSettingsOpen = false; syncNavigationSettingsPopover(); }
  clearNavigationActionCards();
});
workspace.addEventListener('dblclick', (event) => {
  const day = event.target.closest('[data-date]');
  if (day && state.section === 'tools' && state.tool === 'calendar') { event.preventDefault(); renderLunarDialog(day.dataset.date); }
});
workspace.addEventListener('input', (event) => {
  if (event.target.dataset.ticketWalletCafeField && state.ticketWalletEditorOpen && state.ticketWalletDraft) {
    const field = event.target.dataset.ticketWalletCafeField;
    state.ticketWalletDraft[field] = field === 'cafeRating' ? Number(event.target.value) || 0 : event.target.value;
    if (field === 'cafeMood') workspace.querySelectorAll('[data-ticket-wallet-cafe-mood-preset]').forEach((button) => button.classList.toggle('active', button.dataset.ticketWalletCafeMoodPreset === event.target.value));
    updateTicketWalletCafeLabelPreview();
  }
  if (event.target.dataset.devField) { const field = event.target.dataset.devField; state.devTools[field] = event.target.type === 'checkbox' ? event.target.checked : event.target.value; updateDeveloperLiveState(field); }
  if (event.target.id === 'conversionValue') { conversion.value = event.target.value; const output = $('.conversion-result strong'); if (output) output.textContent = formatNumber(convertedValue()); }
  if (event.target.id === 'translationInput') state.translation.input = event.target.value;
  if (event.target.id === 'cityInput') {
    state.weatherSearchQuery = event.target.value;
    const clearButton = event.target.closest('.weather-search-field')?.querySelector('[data-weather-clear]');
    if (clearButton) clearButton.hidden = !state.weatherSearchQuery.trim();
    if (state.weatherSearchQuery.trim() !== state.weatherSearchTerm && (state.weatherSearchLoading || state.weatherSearchResults.length || state.weatherSearchError)) {
      state.weatherSearchRequest += 1; state.weatherSearchLoading = false; state.weatherSearchError = ''; state.weatherSearchResults = [];
      updateWeatherSearchResults();
    }
  }
});
workspace.addEventListener('change', (event) => {
  if (event.target.dataset.ticketWalletCafeField && state.ticketWalletEditorOpen && state.ticketWalletDraft) {
    const field = event.target.dataset.ticketWalletCafeField;
    state.ticketWalletDraft[field] = field === 'cafeRating' ? Number(event.target.value) || 0 : event.target.value;
    updateTicketWalletCafeLabelPreview();
  }
  if (event.target.dataset.devField === 'timestampUnit') { state.devTools.timestampUnit = event.target.value; updateDeveloperLiveState('timestampUnit'); }
  if (event.target.id === 'readerFileInput') { importReaderFiles(event.target.files); return; }
  if (event.target.id === 'readerBackupInput') { const file = event.target.files?.[0]; if (file) void importReaderBackup(file).finally(() => { event.target.value = ''; }); return; }
  if (event.target.id === 'ticketWalletFileInput') { importTicketWalletImage(event.target.files?.[0]); event.target.value = ''; return; }
  if (event.target.id === 'ticketWalletMemoryImageInput') { importTicketWalletImage(event.target.files?.[0]); event.target.value = ''; return; }
  if (event.target.id === 'ticketWalletJsonInput') { importTicketWalletJson(event.target.files?.[0]); event.target.value = ''; return; }
  if (event.target.id === 'conversionCategory') { conversion.category = event.target.value; conversion.from = 0; conversion.to = 1; return render(); }
  if (event.target.id === 'fromUnit') { conversion.from = Number(event.target.value); return render(); }
  if (event.target.id === 'toUnit') { conversion.to = Number(event.target.value); return render(); }
  if (event.target.id === 'translationSource') { state.translation.source = event.target.value; return render(); }
  if (event.target.id === 'translationTarget') { state.translation.target = event.target.value; return render(); }
});
workspace.addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.id === 'weatherSearch') {
    const query = $('#cityInput')?.value.trim() || '';
    return query ? searchWeather(query) : refreshWeatherCard(state.weatherCards.find((item) => item.id === state.activeWeatherId));
  }
});

$('#eventDialog').addEventListener('click', (event) => {
  if (event.target === $('#eventDialog') || event.target.closest('[data-close-event-dialog]')) closeEventDialog();
});
$('#calendarPickerDialog').addEventListener('click', (event) => {
  const dialog = $('#calendarPickerDialog');
  if (event.target === dialog || event.target.closest('[data-close-calendar-picker]')) return closeCalendarPickerDialog();
  const yearShift = event.target.closest('[data-calendar-year-shift]');
  if (yearShift && !yearShift.disabled) {
    const pages = calendarPickerYearPages();
    const currentPage = pages.indexOf(calendarPickerYearStart);
    calendarPickerYearStart = pages[Math.max(0, Math.min(pages.length - 1, currentPage + Number(yearShift.dataset.calendarYearShift)))];
    return renderCalendarPickerDialog('year', true);
  }
  const yearOption = event.target.closest('[data-calendar-year-option]');
  if (yearOption) { const year = Number(yearOption.dataset.calendarYearOption); closeCalendarPickerDialog(); return setCalendarMonth(year, state.month.getMonth()); }
  const monthOption = event.target.closest('[data-calendar-month-option]');
  if (monthOption) { const month = Number(monthOption.dataset.calendarMonthOption); closeCalendarPickerDialog(); return setCalendarMonth(state.month.getFullYear(), month); }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !$('#calendarPickerDialog').hidden) closeCalendarPickerDialog();
});
$('#eventDialog').addEventListener('change', (event) => {
  if (event.target.id === 'eventDateTime') syncEventDateTimeFields();
  if (event.target.id === 'eventRepeat') {
    const weekly = $('.event-weekdays-field', $('#eventDialog')); if (weekly) weekly.hidden = event.target.value !== 'weekly';
    const time = $('#eventTime'); if (time) time.required = event.target.value !== 'once';
  }
});
$('#eventDialog').addEventListener('input', (event) => {
  if (event.target.id === 'eventDateTime') syncEventDateTimeFields();
});
$('#eventDialog').addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.id !== 'eventForm') return;
  syncEventDateTimeFields();
  const title = $('#eventTitle').value.trim(); if (!title) return;
  const key = $('#eventDate').value || state.selectedDate; const repeat = $('#eventRepeat')?.value || 'once'; const time = $('#eventTime').value;
  if (repeat !== 'once' && !time) return toast(state.language === 'en' ? 'Choose a reminder time for a repeating event' : '周期性日程需要选择提醒时间', 'error');
  const weekdays = repeat === 'weekly' ? $$('input[name="eventWeekday"]', $('#eventDialog')).filter((input) => input.checked).map((input) => Number(input.value)) : [];
  if (repeat === 'weekly' && !weekdays.length) return toast(state.language === 'en' ? 'Choose at least one weekday' : '请至少选择一个星期', 'error');
  state.events[key] ||= [];
  state.events[key].push({ id: uid(), title, time, repeat, weekdays, createdAt: Date.now() });
  state.selectedDate = key;
  const selectedDate = dateFromKey(key); state.month = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  saveEvents(); syncAgendaReminders(); scheduleNotificationCheck(); closeEventDialog(); render(); toast(state.language === 'en' ? 'Event added' : '日程已添加');
});

$('#lunarDialog').addEventListener('click', (event) => {
  if (event.target === $('#lunarDialog') || event.target.closest('[data-close-lunar-dialog]')) closeLunarDialog();
});

function applyReaderDialogChoice(choice) {
  const group = choice.dataset.readerChoice; const value = choice.dataset.readerChoiceValue;
  if (group === 'readingMode') {
    setReaderReadingMode(value);
    closeReaderDialog();
  } else if (group === 'fontSize') {
    state.readerPreferences.fontSize = Math.min(26, Math.max(15, Number(value) || 18)); saveReaderPreferences(); applyReaderPreferences(); readerDialogMarkup('settings');
  } else if (group === 'lineHeight' || group === 'paragraphSpacing' || group === 'letterSpacing') {
    state.readerPreferences[group] = Number(value); saveReaderPreferences(); applyReaderPreferences(); readerDialogMarkup('settings');
  } else if (group === 'fullscreenOnOpen') {
    state.readerPreferences.fullscreenOnOpen = value === 'true'; saveReaderPreferences(); readerDialogMarkup('settings');
  } else if (group === 'fontFamily' || group === 'pageAnimation') {
    state.readerPreferences[group] = value; saveReaderPreferences(); applyReaderPreferences(); readerDialogMarkup('settings');
  }
  return true;
}

// Fullscreen is also handled during capture. Safari can retarget a click from
// the fixed reader footer while its browser chrome is moving; handling the
// control before the workspace delegation keeps both reader fullscreen entry
// points reliable.
document.addEventListener('click', (event) => {
  const fullscreen = event.target.closest?.('[data-reader-fullscreen]');
  if (!fullscreen) return;
  event.preventDefault();
  event.stopPropagation();
  toggleReaderFullscreen();
}, true);

// Keep settings choices reliable on installed PWAs as well as desktop. Some
// WebKit builds retarget a click from a freshly-rendered modal button to the
// modal surface, so handle the choice during capture before that retargeting
// can swallow the delegated listener below.
document.addEventListener('click', (event) => {
  const dialog = $('#readerDialog');
  const choice = event.target.closest?.('[data-reader-choice]');
  if (!dialog || !choice || !dialog.contains(choice)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  applyReaderDialogChoice(choice);
}, true);

// Page corners sit above the reading surface and need to remain a direct,
// reliable control on WebKit as well as desktop browsers. Handle them during
// capture so a surface gesture or a retargeted click cannot swallow the turn.
document.addEventListener('click', (event) => {
  const pageButton = event.target.closest?.('[data-reader-page-prev], [data-reader-page-next]');
  if (!pageButton || pageButton.disabled || state.readerMode !== 'reading' || state.readerReadingMode !== 'pages') return;
  event.preventDefault();
  event.stopImmediatePropagation();
  turnReaderPage(pageButton.hasAttribute('data-reader-page-next') ? 1 : -1);
}, true);

$('#readerDialog').addEventListener('click', (event) => {
  if (event.target === $('#readerDialog')) return closeReaderDialog();
  if (event.target.closest('[data-close-reader]')) return closeReader();
  if (event.target.closest('[data-close-reader-dialog]')) return closeReaderDialog();
  const tocItem = event.target.closest('[data-reader-toc-id]');
  if (tocItem) {
    const item = (state.readerToc || []).find((entry) => entry.id === tocItem.dataset.readerTocId && String(entry.section ?? '') === String(tocItem.dataset.readerTocSection ?? '')) || (state.readerToc || []).find((entry) => entry.id === tocItem.dataset.readerTocId);
    return jumpToReaderToc(item);
  }
  const commentItem = event.target.closest('[data-reader-comment-item]');
  if (commentItem) return jumpToReaderComment(commentItem.dataset.readerCommentItem);
  const theme = event.target.closest('[data-reader-theme]');
  if (theme) { state.readerPreferences.theme = theme.dataset.readerTheme; saveReaderPreferences(); applyReaderPreferences(); return readerDialogMarkup(state.readerDialog === 'background' ? 'background' : 'settings'); }
  const choice = event.target.closest('[data-reader-choice]');
  if (choice) return applyReaderDialogChoice(choice);
  const animation = event.target.closest('[data-reader-animation]');
  if (animation) { state.readerPreferences.pageAnimation = animation.dataset.readerAnimation; saveReaderPreferences(); closeReaderDialog(); return; }
  if (event.target.closest('[data-annotate-selection]')) return renderAnnotationDialog();
  const deleteAnnotation = event.target.closest('[data-delete-annotation]');
  if (deleteAnnotation) {
    const book = readerBookById(state.readerBookId); if (book) { book.annotations = (book.annotations || []).filter((note) => note.id !== deleteAnnotation.dataset.deleteAnnotation); saveLibrary(); render(); }
  }
});
$('#readerDialog').addEventListener('input', (event) => { if (event.target.matches('[data-reader-preference]')) readerPreferenceChanged(event.target); });
$('#readerDialog').addEventListener('change', (event) => {
  if (event.target.matches('[data-reader-preference]')) readerPreferenceChanged(event.target);
  if (event.target.matches('[data-reader-reading-mode]')) { closeReaderDialog(); setReaderReadingMode(event.target.value); }
});
workspace.addEventListener('scroll', (event) => {
  scheduleReaderProgress(event.target.closest('[data-reader-content]'));
}, true);
window.addEventListener('scroll', () => {
  if (readerUsesDocumentScroll()) scheduleReaderProgress($('[data-reader-content]'));
}, { passive: true });
$('#annotationDialog').addEventListener('click', (event) => {
  if (event.target === $('#annotationDialog') || event.target.closest('[data-close-annotation]')) { $('#annotationDialog').hidden = true; clearReaderSelectionState(); suppressReaderPageGesture(700); hideReaderSelectionMenu(); return; }
  if (!event.target.closest('[data-save-annotation]')) return;
  const draft = state.readerAnnotationDraft;
  const book = readerBookById(draft?.bookId || state.readerBookId); const note = $('#annotationText')?.value.trim();
  const selectedText = draft?.quote || state.readerSelectedText;
  if (!book || !selectedText || !note) return toast(state.language === 'en' ? 'Write a note first' : '请先写下标注内容', 'error');
  const position = draft?.position || captureReaderPosition();
  const selection = draft || state.readerSelection || {};
  book.annotations ||= []; book.annotations.push({ id: uid(), kind: 'comment', quote: selectedText, note, start: selection.start, end: selection.end, createdAt: Date.now() });
  syncReaderBookProgressToSnapshot(book, position);
  clearReaderSelectionState(); suppressReaderPageGesture(1200); hideReaderSelectionMenu(); saveLibrary(); $('#annotationDialog').hidden = true; render(); preserveReaderPositionAfterRender(position);
});
document.addEventListener('selectionchange', () => {
  if (!state.readerBookId || state.readerMode !== 'reading') return;
  const range = readerNativeSelectionRange();
  if (!range) {
    // WebKit can briefly collapse the Range after the long-press menu event
    // and restore it on the next selection tick. Keep the OneBox bar alive
    // during that hand-off instead of hiding it permanently.
    if (state.readerSelection && Date.now() < readerSelectionSuppressUntil) return;
    scheduleReaderSelectionMenuHide();
    return;
  }
  suppressReaderPageGesture(1200);
  readerShowSelectionMenu(range);
});
document.addEventListener('selectstart', () => {
  if (state.readerMode !== 'reading') return;
  scheduleReaderNativeSelectionMenuSync();
}, { passive: true });

$('#bottomNav').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-section]');
  if (!tab) return;
  if (tab.dataset.section === 'home' && event.detail >= 2) {
    if (state.section !== 'home') selectSection('home');
    toast(state.language === 'en' ? 'Refreshing home…' : '正在刷新首页…');
    loadHomeFeeds(true);
    return;
  }
  selectSection(tab.dataset.section);
});
$('#layoutNav').addEventListener('click', (event) => {
  const tab = event.target.closest('[data-section]');
  if (!tab) return;
  if (tab.dataset.section === 'home' && event.detail >= 2) {
    if (state.section !== 'home') selectSection('home');
    toast(state.language === 'en' ? 'Refreshing home…' : '正在刷新首页…');
    loadHomeFeeds(true);
    return;
  }
  selectSection(tab.dataset.section);
});
$('#brandLink').addEventListener('click', (event) => { event.preventDefault(); selectSection('home'); });
$('#languagePicker').addEventListener('change', (event) => { state.languageMode = event.target.value; saveThemeLanguage(); applyLanguage(); renderNav(); render(); if (state.settingsOpen) renderSettings(); });
let lastMainScrollTop = 0;
function handleAppScroll(current) {
  const bottomNav = $('#bottomNav');
  if (!bottomNav || state.layoutMode !== 'classic') return;
  if (current <= 8 || current < lastMainScrollTop - 4) bottomNav.classList.remove('is-blurred');
  else if (current > lastMainScrollTop + 4) bottomNav.classList.add('is-blurred');
  $('main')?.classList.toggle('bottom-nav-blurred', bottomNav.classList.contains('is-blurred'));
  lastMainScrollTop = current;
}
$('main').addEventListener('scroll', (event) => { handleAppScroll(event.currentTarget.scrollTop); updateMascotScrollState(); }, { passive: true });
window.addEventListener('scroll', () => {
  if (isIosSafariBrowser()) handleAppScroll(appScrollTop());
  updateMascotScrollState();
}, { passive: true });

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && $('#ticketWalletOriginalDialog') && !$('#ticketWalletOriginalDialog').hidden) { closeTicketWalletOriginal(); return; }
  const ticketFieldTarget = event.target.closest?.('[data-ticket-wallet-edit-field]');
  if (ticketFieldTarget && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    openTicketWalletInlineField(ticketFieldTarget.dataset.ticketWalletId, ticketFieldTarget.dataset.ticketWalletEditField, ticketFieldTarget);
    return;
  }
  if (state.readerMode === 'reading' && !event.target.matches('input, textarea, select')) {
    if (event.key === 'ArrowLeft') { event.preventDefault(); turnReaderPage(-1); return; }
    if (event.key === 'ArrowRight') { event.preventDefault(); turnReaderPage(1); return; }
    if (event.key === 'Escape') { if (state.readerDialog) closeReaderDialog(); else closeReader(); return; }
  }
  if (state.tool !== 'calculator' || event.target.matches('input, textarea, select')) return;
  const keyMap = { Enter: '=', Escape: 'AC', Backspace: '⌫', '*': '×', '/': '÷', '-': '−' };
  const key = keyMap[event.key] || event.key;
  if (/^[0-9.+()%,]$/.test(key) || ['=', 'AC', '⌫', '×', '÷', '−'].includes(key)) { event.preventDefault(); calculatorKey(key === ',' ? '.' : key); }
});

$('#themeBtn').addEventListener('click', cycleTheme);
$('#languageBtn').addEventListener('click', cycleLanguage);
$('#settingsBtn').addEventListener('click', () => renderSettings());
$('#notifyBtn').addEventListener('click', () => {
  state.notificationOpen = !state.notificationOpen;
  if (state.notificationOpen) { state.notifications.forEach((item) => { if (item.at <= Date.now()) item.read = true; }); saveNotifications(); renderNotifications(); }
  else closeNotifications();
  $('#notifyBtn').setAttribute('aria-expanded', String(state.notificationOpen));
});
$('#updateBtn')?.addEventListener('click', applyUpdate);
$('#installBtn').addEventListener('click', async () => { if (!window.installPrompt) return; window.installPrompt.prompt(); await window.installPrompt.userChoice; window.installPrompt = null; $('#installBtn').hidden = true; });
$('#settingsDialog').addEventListener('click', (event) => {
  if (event.target === $('#settingsDialog') || event.target.closest('[data-close-settings]')) return closeSettings();
  if (event.target.closest('[data-open-agreement]')) return renderAgreementDialog();
  if (event.target.closest('[data-check-update]')) return checkForUpdate();
  if (event.target.closest('[data-apply-update]')) return applyUpdate();
  if (event.target.closest('[data-request-notifications]')) return requestNotifications();
  if (event.target.closest('[data-github-login]')) return githubLogin();
  if (event.target.closest('[data-github-cancel]')) return cancelGithubLogin();
  if (event.target.closest('[data-github-upload]')) return githubUpload();
  if (event.target.closest('[data-github-download]')) return githubDownload();
  if (event.target.closest('[data-github-logout]')) return disconnectGithub();
});
$('#homeSourceDialog').addEventListener('click', (event) => {
  if (event.target === $('#homeSourceDialog') || event.target.closest('[data-close-home-source]')) return closeHomeSourceDialog();
  const toggle = event.target.closest('[data-home-source-toggle]');
  if (toggle) return setHomeTabVisibility(toggle.dataset.homeSourceToggle, !homeTabIsVisible(toggle.dataset.homeSourceToggle));
});
$('#navigationDialog').addEventListener('contextmenu', (event) => {
  if (!event.target.closest('.navigation-folder-sites [data-navigation-item]')) return;
  event.preventDefault();
  event.stopPropagation();
});
$('#navigationDialog').addEventListener('click', (event) => {
  if (event.target === $('#navigationDialog') || event.target.closest('[data-close-navigation-dialog]')) return closeNavigationDialog();
  if (Date.now() < navigationSuppressClickUntil && event.target.closest('.navigation-folder-sites [data-navigation-item]')) { event.preventDefault(); return; }
  const action = event.target.closest('[data-navigation-action]');
  if (action) {
    const { siteId, folderId = '' } = state.navigationDialog || {};
    if (action.dataset.navigationAction === 'cancel') return closeNavigationDialog();
    if (action.dataset.navigationAction === 'edit') return folderId ? openNavigationEditDialog(siteId, folderId) : (navigationFindRootItem(siteId)?.type === 'folder' ? openNavigationFolderDialog(siteId) : openNavigationEditDialog(siteId));
    if (action.dataset.navigationAction === 'delete') return folderId ? deleteNavigationSite(siteId, folderId) : (navigationFindRootItem(siteId)?.type === 'folder' ? deleteNavigationFolder(siteId) : deleteNavigationSite(siteId));
  }
  if (event.target.closest('[data-navigation-add-in-folder]')) return openNavigationAddDialog(state.navigationDialog?.folderId || '');
  const navigationOpenAction = event.target.closest('[data-navigation-open-action]');
  if (navigationOpenAction) {
    event.preventDefault(); event.stopPropagation();
    const card = navigationOpenAction.closest('[data-navigation-item]');
    const link = card?.querySelector('[data-navigation-open-site]');
    if (link) return openNavigationSite(link);
  }
  const navigationSiteLink = event.target.closest('[data-navigation-open-site]');
  if (navigationSiteLink) {
    if (navigationSiteLink.target === '_blank') return;
    event.preventDefault(); event.stopPropagation(); return openNavigationSite(navigationSiteLink);
  }
  const edit = event.target.closest('[data-navigation-edit]');
  if (edit) return openNavigationEditDialog(edit.dataset.navigationEdit, edit.closest('[data-navigation-folder-id]')?.dataset.navigationFolderId || state.navigationDialog?.folderId || '');
  const remove = event.target.closest('[data-navigation-delete]');
  if (remove) return deleteNavigationSite(remove.dataset.navigationDelete, remove.closest('[data-navigation-folder-id]')?.dataset.navigationFolderId || '');
  if (event.target.closest('[data-navigation-delete-folder]')) return deleteNavigationFolder(state.navigationDialog?.folderId || '');
});
$('#navigationDialog').addEventListener('input', (event) => {
  if (event.target.id !== 'navigationUrl') return;
  const preview = $('[data-navigation-icon-preview]', $('#navigationDialog')); if (!preview) return;
  const url = navigationSafeUrl(event.target.value); preview.innerHTML = url ? navigationIconMarkup({ name: navigationNameFromUrl(url), url, icon: navigationIconUrl(url) }, 'navigation-preview-icon') + '<span>' + escapeHtml(t('navigationIconHint')) + '</span>' : '<span class="navigation-preview-placeholder">' + escapeHtml(t('navigationIconHint')) + '</span>';
});
$('#navigationDialog').addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.id === 'navigationSiteForm') {
    const folderId = event.target.dataset.navigationFolderId || '';
    if (event.target.dataset.navigationMode === 'edit') return editNavigationSite(event.target.dataset.navigationSiteId, folderId, $('#navigationUrl', event.target)?.value, $('#navigationName', event.target)?.value);
    return addNavigationSite($('#navigationUrl', event.target)?.value, $('#navigationName', event.target)?.value, folderId);
  }
  if (event.target.id === 'navigationFolderForm') {
    const folder = navigationFindFolder(state.navigationDialog?.folderId || ''); if (!folder) return closeNavigationDialog();
    folder.name = $('#navigationFolderName', event.target)?.value.trim() || folder.name; saveNavigation(); closeNavigationDialog(); render(); return;
  }
  if (event.target.id === 'navigationCreateFolderForm') return createNavigationFolder($('#navigationFolderName', event.target)?.value, state.navigationFolderDraft?.firstId, state.navigationFolderDraft?.secondId);
});
$('#settingsDialog').addEventListener('change', (event) => {
  if (event.target.id === 'settingsLayout') { state.layoutMode = event.target.value === 'simple' ? 'simple' : 'classic'; saveLayoutPreference(); render(); renderSettings(); }
  if (event.target.id === 'settingsNavigationLocation') {
    state.navigationLocation = event.target.value === 'tools' ? 'tools' : 'main';
    localStorage.setItem(STORAGE.navigationLocation, state.navigationLocation);
    state.toolOrder = normalizeToolOrder(state.toolOrder, state.navigationLocation === 'tools', state.navigationLocation === 'tools');
    saveToolOrder();
    if (state.navigationLocation === 'tools') state.section = 'tools', state.tool = 'navigation';
    if (state.navigationLocation === 'main' && state.section === 'tools' && state.tool === 'navigation') state.section = 'navigation';
    const route = state.section === 'tools' ? state.tool : state.section;
    if (location.hash.slice(1) !== route) history.replaceState(null, '', '#' + route);
    renderNav(); renderBottomNav(); render(); renderSettings();
  }
  if (event.target.id === 'settingsTheme') { state.theme = event.target.value; saveThemeLanguage(); applyTheme(); render(); }
  if (event.target.id === 'settingsColor') { state.color = ['mono', 'purple', 'blue', 'green', 'yellow'].includes(event.target.value) ? event.target.value : 'mono'; saveColorPreference(); applyTheme(); render(); renderSettings(); }
  if (event.target.id === 'settingsLanguage') { state.languageMode = event.target.value; saveThemeLanguage(); applyLanguage(); renderNav(); render(); renderSettings(); }
  if (event.target.id === 'settingsNotifications') { state.notificationPreference = event.target.value; saveStored(STORAGE.notificationPreference, state.notificationPreference); if (state.notificationPreference === 'allow') requestNotifications(); }
  if (event.target.id === 'settingsOpenMode') { state.openMode = event.target.value === 'new-tab' ? 'new-tab' : 'current'; saveStored(STORAGE.openMode, state.openMode); }
  if (event.target.dataset.topDisplay) { state.topDisplay[event.target.dataset.topDisplay] = event.target.checked; saveTopDisplay(); renderHeaderControls(); renderSettings(); }
});
$('#settingsDialog').addEventListener('input', () => {});
$('#petDialog').addEventListener('click', (event) => {
  if (event.target === $('#petDialog') || event.target.closest('[data-close-pet]')) return closePetDialog();
  const outfit = event.target.closest('[data-pet-outfit]');
  if (outfit && setPetOutfit(outfit.dataset.petOutfit)) toast(state.language === 'en' ? 'Outfit equipped' : '服饰已换上', 'info');
});
$('#ticketWalletOriginalDialog').addEventListener('click', (event) => {
  const dialog = $('#ticketWalletOriginalDialog');
  if (event.target === dialog || event.target.closest('[data-close-ticket-wallet-original]')) closeTicketWalletOriginal();
});
$('#petDialog').addEventListener('change', (event) => {
  if (event.target.id === 'petVisibility') {
    state.mascotVisible = event.target.value !== 'hide';
    saveMascotVisibility();
    syncMascotVisibility();
    renderPetDialog();
  }
  if (event.target.id === 'petDisplayMode') {
    state.mascotDisplayMode = event.target.value === 'full' ? 'full' : 'half';
    saveMascotDisplayMode();
    syncMascotDisplayMode(true);
    renderPetDialog();
  }
});
$('#agreementDialog').addEventListener('click', (event) => {
  if (event.target === $('#agreementDialog') || event.target.closest('[data-close-agreement]')) closeAgreementDialog();
});
$('#recentReadingDialog').addEventListener('click', (event) => {
  if (event.target === $('#recentReadingDialog') || event.target.closest('[data-close-recent-reading]')) return closeRecentReading();
  const feedItem = event.target.closest('[data-feed-link]');
  if (!feedItem) return;
  if (openFeedLink(feedItem.dataset.feedLink)) {
    markFeedRead(feedItem.dataset.feedId);
    feedItem.classList.add('is-read');
  }
});
$('#githubDialog').addEventListener('click', (event) => {
  if (event.target === $('#githubDialog') || event.target.closest('[data-close-github]')) return closeGithubDialog();
  if (event.target.closest('[data-open-agreement]')) { event.preventDefault(); event.stopPropagation(); return renderAgreementDialog(); }
  const providerButton = event.target.closest('[data-auth-provider]');
  if (providerButton) return startAccountLogin(providerButton.dataset.authProvider);
  if (event.target.closest('[data-github-login]')) return githubLogin();
  if (event.target.closest('[data-github-cancel]')) return cancelGithubLogin();
  if (event.target.closest('[data-github-token]')) return githubUseAccessToken();
  if (event.target.closest('[data-github-upload]')) return githubUpload();
  if (event.target.closest('[data-github-download]')) return githubDownload();
  if (event.target.closest('[data-github-logout]')) return disconnectGithub();
});
$('#githubDialog').addEventListener('change', (event) => {
  if (event.target.id === 'githubAgreement') {
    state.githubAgreementAccepted = event.target.checked;
    localStorage.setItem(STORAGE.githubAgreement, String(state.githubAgreementAccepted));
    $$('#githubDialog [data-auth-provider]').forEach((login) => { login.disabled = !state.githubAgreementAccepted; });
  }
  const option = event.target.closest('[data-github-sync-option]');
  if (option) {
    state.githubSyncSelection = normalizeGithubSyncSelection({ ...state.githubSyncSelection, [option.dataset.githubSyncOption]: option.checked });
    saveGithubSyncSelection();
    const selectedCount = $$('#githubDialog [data-github-sync-option]').filter((item) => item.checked).length;
    const countNode = $('#githubDialog .github-sync-selected-count');
    if (countNode) countNode.textContent = selectedCount + ' / 9';
    if (option.dataset.githubSyncOption === 'reading') queueReaderCloudSync(200);
  }
});
$('#notificationPanel').addEventListener('click', (event) => {
  if (event.target === $('#notificationPanel') || event.target.closest('[data-close-notifications]')) return closeNotifications();
  const deleteNotification = event.target.closest('[data-delete-notification]');
  if (deleteNotification) { state.notifications = state.notifications.filter((item) => item.id !== deleteNotification.dataset.deleteNotification); saveNotifications(); renderNotifications(); updateNotificationBadge(); }
  if (event.target.closest('[data-mark-notifications-read]')) { state.notifications.forEach((item) => { item.read = true; }); saveNotifications(); renderNotifications(); updateNotificationBadge(); }
});
document.addEventListener('click', (event) => {
  $$('.ticket-wallet-detail-more[open]').forEach((menu) => { if (!menu.contains(event.target) || event.target.closest('button')) menu.open = false; });
  if (state.notificationOpen && !event.target.closest('#notificationPanel, #notifyBtn')) closeNotifications();
});
document.addEventListener('pointerdown', unlockAlertAudio, { once: true, passive: true });
window.addEventListener('pagehide', () => {
  // openFeedLink() already captured the real scrollTop before navigation.
  // Safari may reset the document to 0 while dispatching pagehide; do not
  // overwrite the saved position with that transient value.
  if (!feedNavigationPending) saveNavigationPosition();
  // Do not let a request that was in flight before the page was hidden keep
  // the cached homepage in an endless loading state when iOS restores it.
  homeFeedRequests.clear();
  state.homeFeed.loading = false;
  clearFeedNavigationPending();
  flushReaderProgress(false); clearTimeout(persistenceTimer); writePersistentSnapshot();
});
window.addEventListener('pageshow', (event) => {
  let returningToHome = event.persisted;
  try {
    const saved = JSON.parse(sessionStorage.getItem(NAVIGATION_SESSION_KEY) || 'null');
    returningToHome ||= Boolean(saved && saved.hash === location.hash && Date.now() - Number(saved.savedAt || 0) <= 30 * 60 * 1000);
  } catch { /* session storage may be disabled */ }
  // iOS Safari/PWA can restore the old swipe transform and viewport-sized
  // bottom inset from the external page. Clear those transient styles before
  // restoring the user's exact tab and scroll position.
  pageSwipeAnimationToken = 0;
  pageSwipeGesture = null;
  clearPageSwipeTrack();
  if (returningToHome) {
    refreshOneBoxViewportMetrics();
    scheduleHomeFeedSurfaceSync();
  } else syncOneBoxViewportMetrics();
  clearFeedNavigationPending();
  restoreNavigationPosition();
  if (returningToHome) window.setTimeout(recoverHomeLayoutAfterReturn, 360);
});
window.addEventListener('beforeinstallprompt', (event) => { event.preventDefault(); window.installPrompt = event; $('#installBtn').hidden = false; });
window.addEventListener('online', () => { $('#connectionStatus').textContent = t('online'); toast(state.language === 'en' ? 'Back online' : '网络已恢复'); });
window.addEventListener('offline', () => { $('#connectionStatus').textContent = t('offline'); toast(state.language === 'en' ? 'Offline mode' : '已切换到离线模式'); });
window.addEventListener('hashchange', () => {
  const route = location.hash.slice(1);
  if (route === 'ticket-wallet') { state.section = 'mine'; state.ticketWalletOpen = true; window.scrollTo(0, 0); renderNav(); renderBottomNav(); render(); window.scrollTo(0, 0); scheduleTicketWalletFilterFocus(false); void hydrateTicketWalletImages(); }
  else if (['home', 'navigation', 'messages', 'mine'].includes(route)) selectSection(route);
  else selectTool(route);
});
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (state.theme === 'system') applyTheme(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { flushReaderProgress(false); void writePersistentSnapshot(); } if (!document.hidden) { state.swRegistration?.update().catch(() => {}); if (state.section === 'home') scheduleHomeFeedSurfaceSync(); } });
window.addEventListener('focus', () => { state.swRegistration?.update().catch(() => {}); if (state.section === 'home') scheduleHomeFeedSurfaceSync(); });
const handleReaderFullscreenChange = () => {
  const active = Boolean(readerFullscreenElement());
  if (active) {
    readerNativeFullscreen = true;
    updateReaderFullscreenControl();
  } else if (readerNativeFullscreen && state.readerMode === 'reading' && state.readerImmersive) {
    readerNativeFullscreen = false;
    state.readerImmersive = false; render();
  } else updateReaderFullscreenControl();
};
document.addEventListener('fullscreenchange', handleReaderFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleReaderFullscreenChange);
let homeFeedPollTimer = null;
function scheduleHomeFeedPolling() {
  if (homeFeedPollTimer) return;
  homeFeedPollTimer = setInterval(() => {
    if (!document.hidden) loadHomeFeeds(true);
  }, RSS_REFRESH_INTERVAL);
}
function bootApp() {
  const githubCallback = consumeGithubOAuthCallback();
  if (githubCallback) {
    state.section = 'mine';
    state.tool = 'calculator';
  }
  syncTicketWalletCalendarEvents();
  try { history.scrollRestoration = 'manual'; } catch { /* unsupported */ }
  mountMascot();
  configureReaderCloudSync();
  setInterval(checkNotifications, 30000);
  applyLanguage(); renderNav(); render(); if (state.ticketWalletOpen) scheduleTicketWalletFilterFocus(false); checkNotifications(); scheduleHomeFeedPolling(); loadHomeFeeds(); void hydrateTicketWalletImages();
  void hydrateGithubUser();
  setupServiceWorker();
  if (githubCallback?.token) toast(state.language === 'en' ? 'GitHub connected' : 'GitHub 已连接');
  else if (githubCallback?.error) toast(githubCallback.error === 'missing_worker_secret' ? (state.language === 'en' ? 'OAuth service is not configured yet' : 'OAuth 服务尚未配置完成') : (state.language === 'en' ? 'GitHub authorization failed' : 'GitHub 授权失败'), 'error');
  return Boolean(githubCallback);
}
// Render the shell immediately. IndexedDB snapshot recovery is a best-effort
// background task; blocking boot here leaves Safari showing an empty shell while
// an OAuth callback or a slow private-mode database request is being processed.
const githubCallbackHandled = bootApp();
persistentRecovery = restorePersistentSnapshot();
persistentRecovery.then((restored) => {
  if (restored && state.readerMode !== 'reading') {
    state.library = normalizeReaderLibrary(parseStored(STORAGE.library, []));
    if (state.section === 'tools' && state.tool === 'reader') render();
  }
  // Recover auth in place even when IndexedDB takes longer than the reload limit.
  if (!githubCallbackHandled && !state.github.token) {
    const account = parseStored(STORAGE.github, {});
    if (account?.token) {
      Object.assign(state.github, { token: account.token, user: account.user || null, gistId: account.gistId || '' });
      renderNav(); render();
      if (state.githubDialogOpen) renderGithubDialog();
      void hydrateGithubUser();
    }
  }
  // A late snapshot must never reload the OAuth callback page. Also avoid
  // surprising a user with a reload after a very slow database response.
  if (restored && !githubCallbackHandled && performance.now() < 5000) { window.location.reload(); return; }
  readerCloudReady = true;
  if (state.github.token) queueReaderCloudSync(500);
}).catch(() => { /* local persistence is optional */ });

document.addEventListener('keydown', (event) => { if (event.key === 'Escape') $$('.ticket-wallet-detail-more[open]').forEach((menu) => { menu.open = false; menu.querySelector('summary')?.focus(); }); });
