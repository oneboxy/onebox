const MAX_BOOK_BYTES = 64 * 1024 * 1024;
const MAX_JSON_BYTES = 1024 * 1024;
const MAX_BOOKS_PER_USER = 80;
const SESSION_TTL_SECONDS = 12 * 60 * 60;
const MAX_USER_FILE_BYTES = 64 * 1024 * 1024;
const DATA_KEYS = Object.freeze({
  'onebox.theme': 'settings', 'onebox.language': 'settings', 'onebox.layout': 'settings', 'onebox.color': 'settings',
  'onebox.color-explicit': 'settings', 'onebox.top-display': 'settings', 'onebox.footprint': 'settings',
  'onebox.open-mode': 'settings', 'onebox.mascot-position': 'settings', 'onebox.mascot-visible': 'settings',
  'onebox.mascot-display-mode': 'settings', 'onebox.pet-profile': 'settings', 'onebox.tool-order': 'navigation',
  'onebox.navigation': 'navigation', 'onebox.navigation-location': 'navigation', 'onebox.home-feed-order': 'navigation',
  'onebox.home-feed-visibility': 'navigation', 'onebox.home-feed-active': 'navigation', 'onebox.home-feed-read': 'reading', 'onebox.reader-progress': 'reading',
  'onebox.reader-preferences': 'reading', 'onebox.reader-layout': 'reading', 'onebox.library': 'reading',
  'onebox.notifications': 'messages', 'onebox.notification-preference': 'messages', 'onebox.events': 'calendar',
  'onebox.weather-cards': 'weather', 'onebox.weather': 'weather', 'onebox.translation-history': 'translation',
  'onebox.translation-history-open': 'translation', 'onebox.calculator': 'calculator', 'onebox.dev-tools': 'calculator',
  'onebox.ticket-wallet': 'ticket-wallet', 'onebox.ticket-wallet-display-order': 'ticket-wallet',
  'onebox.ticket-wallet-type-filter': 'ticket-wallet', 'onebox.ticket-wallet-memories': 'ticket-wallet',
  'onebox.ticket-wallet-deleted': 'ticket-wallet',
});
const CLOUD_MODULES = Object.freeze(['home', 'navigation', 'reading', 'calendar', 'weather', 'calculator', 'conversion', 'translation', 'messages', 'ticket-wallet', 'settings', 'developer']);
const ADMIN_ROLES = Object.freeze(['super_admin', 'user_admin', 'personal_data_admin', 'content_operator', 'read_only_auditor']);
const CONTENT_KINDS = Object.freeze(['ads', 'announcements']);
const CONTENT_PLACEMENTS = Object.freeze(['home-top', 'home-feed', 'tools-top', 'weather-top', 'calendar-top', 'ticket-wallet-top']);

function responseJson(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

function safeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function encodeBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function decodeBase64Url(value) {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized + '='.repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function signSession(payload, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const head = encodeBase64Url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const input = head + '.' + body;
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input)));
  return input + '.' + encodeBase64Url(signature);
}

async function verifySession(token, secret, now = Date.now()) {
  const [head, body, signature, extra] = String(token || '').split('.');
  if (!head || !body || !signature || extra) return null;
  const input = head + '.' + body;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  let valid = false;
  try { valid = await crypto.subtle.verify('HMAC', key, decodeBase64Url(signature), new TextEncoder().encode(input)); } catch { return null; }
  if (!valid) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(head)));
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(body)));
    if (header.alg !== 'HS256' || payload.iss !== 'onebox-reader-sync' || !/^\d+$/.test(String(payload.sub || '')) || Number(payload.exp) * 1000 <= now) return null;
    return payload;
  } catch { return null; }
}

function requestOrigin(request) {
  try { return new URL(request.url).origin; } catch { return ''; }
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = new Set([env.ALLOWED_ORIGIN || 'https://oneboxy.github.io', 'http://localhost:4173', 'http://127.0.0.1:4173']);
  return {
    'access-control-allow-origin': allowed.has(origin) ? origin : (origin === requestOrigin(request) ? origin : (env.ALLOWED_ORIGIN || 'https://oneboxy.github.io')),
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, x-content-sha256, x-file-name',
    'access-control-expose-headers': 'content-type, x-content-sha256',
    'access-control-max-age': '86400',
    vary: 'Origin',
  };
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  Object.entries(corsHeaders(request, env)).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function bookIdFromPath(path) {
  const match = path.match(/^\/v1\/books\/([^/]+)(?:\/file)?$/);
  if (!match) return '';
  let id = '';
  try { id = decodeURIComponent(match[1]); } catch { return ''; }
  return /^[A-Za-z0-9_-]{1,120}$/.test(id) ? id : '';
}

function validSha256(value) { return /^[a-f0-9]{64}$/i.test(String(value || '')); }

function cleanMetadata(value, id) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.id !== id) return null;
  const metadata = {};
  Object.entries(value).forEach(([key, field]) => {
    if (key.startsWith('_') || ['content', 'syncFileMissing'].includes(key)) return;
    metadata[key] = field;
  });
  if (typeof metadata.name !== 'string' || metadata.name.length > 500 || !['md', 'txt', 'pdf', 'epub'].includes(metadata.type)) return null;
  const encodedSize = Number(metadata.size);
  if (!Number.isFinite(encodedSize) || encodedSize < 0 || encodedSize > MAX_BOOK_BYTES) return null;
  return metadata;
}

function progressValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0;
}

function contentTypeForBook(type) {
  return ({ md: 'text/markdown; charset=utf-8', txt: 'text/plain; charset=utf-8', pdf: 'application/pdf', epub: 'application/epub+zip' })[type] || 'application/octet-stream';
}

function fileKeyFor(userId, bookId, sha256) { return userId + '/' + bookId + '/' + sha256.toLowerCase(); }

async function readJson(request, maxBytes = MAX_JSON_BYTES) {
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > maxBytes) throw Object.assign(Error('Request body is too large'), { status: 413 });
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw Object.assign(Error('Request body is too large'), { status: 413 });
  try { return JSON.parse(raw); } catch { throw Object.assign(Error('Invalid JSON'), { status: 400 }); }
}

async function githubIdentity(request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token || token.length > 4096) return null;
  const response = await fetch('https://api.github.com/user', {
    headers: { accept: 'application/vnd.github+json', authorization: 'Bearer ' + token, 'user-agent': 'OneBox-Reader-Sync' },
  });
  if (!response.ok) return null;
  const user = await response.json().catch(() => null);
  return user && Number.isSafeInteger(Number(user.id)) && Number(user.id) > 0
    ? { id: String(user.id), login: String(user.login || '').slice(0, 100), avatarUrl: String(user.avatar_url || '').slice(0, 500) }
    : null;
}

async function authenticate(request, env) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim();
  if (!token || !env.SESSION_SECRET) return null;
  return verifySession(token, env.SESSION_SECRET);
}

async function handleSession(request, env) {
  if (!env.SESSION_SECRET) return responseJson({ error: 'service_not_configured' }, 503);
  let identity;
  try { identity = await githubIdentity(request); } catch { return responseJson({ error: 'github_unavailable' }, 502); }
  if (!identity) return responseJson({ error: 'github_auth_invalid' }, 401);
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + SESSION_TTL_SECONDS;
  const token = await signSession({ iss: 'onebox-reader-sync', sub: identity.id, login: identity.login, iat: issuedAt, exp: expiresAt }, env.SESSION_SECRET);
  return responseJson({ token, expiresAt, user: { id: identity.id, login: identity.login, avatarUrl: identity.avatarUrl } });
}

async function listBooks(userId, env) {
  const result = await env.DB.prepare('SELECT book_id, metadata_json, progress_json, progress_updated_at, updated_at, file_key, file_sha256, file_size, file_type FROM reader_books WHERE user_id = ? ORDER BY updated_at DESC')
    .bind(userId).all();
  const deletionResult = await env.DB.prepare('SELECT book_id, deleted_at FROM reader_book_deletions WHERE user_id = ?').bind(userId).all();
  const books = (result.results || []).map((row) => {
    let metadata = {};
    let progress = 0;
    try { metadata = JSON.parse(row.metadata_json || '{}'); } catch { /* skip invalid data */ }
    try { progress = JSON.parse(row.progress_json || '0'); } catch { /* use default progress */ }
    return { id: row.book_id, metadata, progress: progressValue(progress), progressUpdatedAt: Number(row.progress_updated_at) || 0, updatedAt: Number(row.updated_at) || 0, file: row.file_key ? { sha256: row.file_sha256, size: Number(row.file_size) || 0, type: row.file_type || '' } : null };
  });
  return responseJson({ books, deleted: (deletionResult.results || []).map((row) => ({ id: row.book_id, deletedAt: Number(row.deleted_at) || 0 })) });
}

async function upsertBooks(request, userId, env) {
  const body = await readJson(request);
  if (!Array.isArray(body?.books) || body.books.length > MAX_BOOKS_PER_USER) return responseJson({ error: 'invalid_book_list' }, 400);
  const current = await env.DB.prepare('SELECT COUNT(*) AS count FROM reader_books WHERE user_id = ?').bind(userId).first();
  const existingIds = new Set((await env.DB.prepare('SELECT book_id FROM reader_books WHERE user_id = ?').bind(userId).all()).results.map((row) => row.book_id));
  const newIds = new Set();
  const statements = [];
  for (const item of body.books) {
    const id = String(item?.id || '');
    if (!/^[A-Za-z0-9_-]{1,120}$/.test(id) || newIds.has(id)) return responseJson({ error: 'invalid_book_id' }, 400);
    newIds.add(id);
    const metadata = cleanMetadata(item.metadata, id);
    if (!metadata) return responseJson({ error: 'invalid_book_metadata', bookId: id }, 400);
    const encodedMetadata = JSON.stringify(metadata);
    if (new TextEncoder().encode(encodedMetadata).byteLength > 96 * 1024) return responseJson({ error: 'book_metadata_too_large', bookId: id }, 413);
    const progress = progressValue(item.progress ?? metadata.progress);
    const progressUpdatedAt = Math.max(0, Math.floor(Number(item.progressUpdatedAt ?? metadata.progressUpdatedAt) || 0));
    const updatedAt = Math.max(0, Math.floor(Number(item.updatedAt ?? metadata.updatedAt) || Date.now()));
    statements.push(env.DB.prepare(`INSERT INTO reader_books (user_id, book_id, metadata_json, progress_json, progress_updated_at, updated_at)
      SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (
        SELECT 1 FROM reader_book_deletions WHERE user_id = ? AND book_id = ?
      )
      ON CONFLICT(user_id, book_id) DO UPDATE SET
        metadata_json = CASE WHEN excluded.updated_at >= reader_books.updated_at THEN excluded.metadata_json ELSE reader_books.metadata_json END,
        updated_at = MAX(reader_books.updated_at, excluded.updated_at),
        progress_json = CASE WHEN excluded.progress_updated_at >= reader_books.progress_updated_at THEN excluded.progress_json ELSE reader_books.progress_json END,
        progress_updated_at = MAX(reader_books.progress_updated_at, excluded.progress_updated_at)`)
      .bind(userId, id, encodedMetadata, JSON.stringify(progress), progressUpdatedAt, updatedAt, userId, id));
  }
  const wouldCount = Number(current?.count || 0) + [...newIds].filter((id) => !existingIds.has(id)).length;
  if (wouldCount > MAX_BOOKS_PER_USER) return responseJson({ error: 'book_limit_exceeded', limit: MAX_BOOKS_PER_USER }, 413);
  if (newIds.size) {
    const ids = [...newIds];
    const placeholders = ids.map(() => '?').join(',');
    const deleted = await env.DB.prepare('SELECT book_id FROM reader_book_deletions WHERE user_id = ? AND book_id IN (' + placeholders + ')').bind(userId, ...ids).all();
    if (deleted.results?.length) return responseJson({ error: 'book_deleted', bookId: deleted.results[0].book_id }, 409);
  }
  if (statements.length) {
    const results = await env.DB.batch(statements);
    if (results.some((result) => Number(result?.meta?.changes) === 0)) return responseJson({ error: 'book_deleted' }, 409);
  }
  return responseJson({ saved: statements.length });
}

async function putBookFile(request, userId, bookId, env) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > MAX_BOOK_BYTES) return responseJson({ error: 'book_file_too_large', maxBytes: MAX_BOOK_BYTES }, 413);
  const sha256 = request.headers.get('X-Content-SHA256') || '';
  if (!validSha256(sha256)) return responseJson({ error: 'invalid_file_hash' }, 400);
  const row = await env.DB.prepare('SELECT metadata_json, file_key FROM reader_books WHERE user_id = ? AND book_id = ?').bind(userId, bookId).first();
  if (!row) return responseJson({ error: 'book_metadata_missing' }, 404);
  const metadata = JSON.parse(row.metadata_json || '{}');
  const expectedSize = Number(metadata.size) || 0;
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BOOK_BYTES) return responseJson({ error: 'invalid_file_size' }, 413);
  if (expectedSize !== bytes.byteLength) return responseJson({ error: 'file_size_mismatch' }, 400);
  const actualHash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  if (!safeEqual(actualHash, sha256.toLowerCase())) return responseJson({ error: 'file_hash_mismatch' }, 400);
  const key = fileKeyFor(userId, bookId, actualHash);
  await env.BOOKS_BUCKET.put(key, bytes, { httpMetadata: { contentType: contentTypeForBook(metadata.type) }, customMetadata: { userId, bookId, sha256: actualHash } });
  await env.DB.prepare('UPDATE reader_books SET file_key = ?, file_sha256 = ?, file_size = ?, file_type = ? WHERE user_id = ? AND book_id = ?')
    .bind(key, actualHash, bytes.byteLength, contentTypeForBook(metadata.type), userId, bookId).run();
  if (row.file_key && row.file_key !== key) await env.BOOKS_BUCKET.delete(row.file_key);
  return responseJson({ saved: true, sha256: actualHash, size: bytes.byteLength });
}

async function getBookFile(userId, bookId, env) {
  const row = await env.DB.prepare('SELECT file_key, file_sha256, file_size, file_type FROM reader_books WHERE user_id = ? AND book_id = ?')
    .bind(userId, bookId).first();
  if (!row?.file_key) return responseJson({ error: 'book_file_missing' }, 404);
  const object = await env.BOOKS_BUCKET.get(row.file_key);
  if (!object) return responseJson({ error: 'book_file_missing' }, 404);
  const headers = new Headers({ 'content-type': row.file_type || 'application/octet-stream', 'content-length': String(row.file_size || object.size), 'cache-control': 'private, no-store', 'x-content-sha256': row.file_sha256 || '' });
  object.writeHttpMetadata(headers);
  headers.set('cache-control', 'private, no-store');
  headers.set('x-content-sha256', row.file_sha256 || '');
  return new Response(object.body, { headers });
}

async function deleteBook(userId, bookId, env) {
  const row = await env.DB.prepare('SELECT file_key FROM reader_books WHERE user_id = ? AND book_id = ?').bind(userId, bookId).first();
  const deletedAt = Date.now();
  await env.DB.prepare('INSERT INTO reader_book_deletions (user_id, book_id, deleted_at) VALUES (?, ?, ?) ON CONFLICT(user_id, book_id) DO UPDATE SET deleted_at = MAX(reader_book_deletions.deleted_at, excluded.deleted_at)')
    .bind(userId, bookId, deletedAt).run();
  await env.DB.prepare('DELETE FROM reader_books WHERE user_id = ? AND book_id = ?').bind(userId, bookId).run();
  if (row?.file_key) await env.BOOKS_BUCKET.delete(row.file_key);
  return responseJson({ deleted: true, deletedAt });
}

function cloudError(message, status = 400) { return responseJson({ error: message }, status); }
function safeId(value) { return /^[A-Za-z0-9_-]{1,120}$/.test(String(value || '')); }
function safeUserId(value) { return /^\d{1,24}$/.test(String(value || '')); }
function csvIds(value) { return String(value || '').split(/[\s,;]+/).map((item) => item.trim()).filter((item) => /^\d{1,24}$/.test(item)); }
function parseJson(value, fallback = {}) { try { return JSON.parse(value || ''); } catch { return fallback; } }
function dataModule(key) { return DATA_KEYS[key] || ''; }
function adminGrants(row) { return parseJson(row?.grants_json, {}); }
function isBootstrapSuperadmin(identity, env) { return csvIds(env.BOOTSTRAP_SUPERADMIN_GITHUB_IDS).includes(String(identity.id)); }

async function touchUser(identity, env) {
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO onebox_users (user_id, github_login, avatar_url, status, created_at, updated_at, last_seen_at)
    VALUES (?, ?, ?, 'active', ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET github_login = excluded.github_login, avatar_url = excluded.avatar_url,
      updated_at = excluded.updated_at, last_seen_at = excluded.last_seen_at`)
    .bind(identity.id, identity.login || '', identity.avatarUrl || '', now, now, now).run();
  return env.DB.prepare('SELECT user_id, github_login, avatar_url, status, created_at, updated_at, last_seen_at, migrated_at FROM onebox_users WHERE user_id = ?')
    .bind(identity.id).first();
}

async function requireActiveUser(identity, env, create = true) {
  const user = create ? await touchUser(identity, env) : await env.DB.prepare('SELECT user_id, status FROM onebox_users WHERE user_id = ?').bind(identity.id).first();
  if (user && user.status !== 'active') throw Object.assign(Error('account_unavailable'), { status: 403 });
  return user;
}

async function ensureBootstrapAdmin(identity, env) {
  if (!isBootstrapSuperadmin(identity, env)) return;
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO onebox_admins (github_id, github_login, role, grants_json, status, invited_by, created_at, updated_at)
    VALUES (?, ?, 'super_admin', '{}', 'active', 'bootstrap', ?, ?)
    ON CONFLICT(github_id) DO UPDATE SET github_login = excluded.github_login, role = 'super_admin', status = 'active', updated_at = excluded.updated_at`)
    .bind(identity.id, identity.login || '', now, now).run();
}

async function auditAdmin(env, identity, action, targetType = '', targetId = '', metadata = {}) {
  await env.DB.prepare('INSERT INTO onebox_audit_log (audit_id, actor_id, actor_login, action, target_type, target_id, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(crypto.randomUUID(), identity.id, identity.login || '', String(action).slice(0, 100), String(targetType).slice(0, 80), String(targetId).slice(0, 120), JSON.stringify(metadata).slice(0, 4000), Date.now()).run();
}

async function requireAdmin(identity, env, permission = '') {
  await ensureBootstrapAdmin(identity, env);
  const row = await env.DB.prepare('SELECT github_id, github_login, role, grants_json, status, invited_by, created_at, updated_at FROM onebox_admins WHERE github_id = ?')
    .bind(identity.id).first();
  if (!row || row.status !== 'active') throw Object.assign(Error('admin_access_required'), { status: 403 });
  const grants = adminGrants(row);
  const rolePermissions = {
    super_admin: ['*'],
    user_admin: ['users.read', 'users.manage', 'stats.read'],
    personal_data_admin: ['users.read', 'data.read', 'data.edit', ...(grants.export ? ['data.export'] : []), ...(grants.delete ? ['data.delete'] : [])],
    content_operator: ['content.manage', 'modules.manage', 'stats.read'],
    read_only_auditor: ['audit.read', 'stats.read'],
  };
  const permissions = rolePermissions[row.role] || [];
  if (permission && !permissions.includes('*') && !permissions.includes(permission)) throw Object.assign(Error('permission_denied'), { status: 403 });
  return { ...row, grants, permissions };
}

function adminSummary(row, bootstrap = false) {
  return { id: row.github_id, login: row.github_login, role: row.role, grants: adminGrants(row), status: row.status, invitedBy: row.invited_by, createdAt: Number(row.created_at) || 0, updatedAt: Number(row.updated_at) || 0, bootstrap };
}

async function listUsers(url, env) {
  const search = (url.searchParams.get('q') || '').trim().slice(0, 100);
  const status = url.searchParams.get('status') || '';
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit')) || 50));
  const offset = Math.max(0, Math.min(10000, Number(url.searchParams.get('offset')) || 0));
  let sql = 'SELECT u.user_id, u.github_login, u.avatar_url, u.status, u.created_at, u.updated_at, u.last_seen_at, u.migrated_at, (SELECT COUNT(*) FROM onebox_user_data d WHERE d.user_id = u.user_id AND d.deleted_at IS NULL) AS data_count FROM onebox_users u';
  const conditions = [], params = [];
  if (search) { conditions.push('(u.github_login LIKE ? OR u.user_id LIKE ?)'); params.push('%' + search + '%', '%' + search + '%'); }
  if (['active', 'suspended', 'deleted', 'purged'].includes(status)) { conditions.push('u.status = ?'); params.push(status); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY u.last_seen_at DESC LIMIT ? OFFSET ?'; params.push(limit, offset);
  const rows = await env.DB.prepare(sql).bind(...params).all();
  return (rows.results || []).map((row) => ({ id: row.user_id, login: row.github_login, avatarUrl: row.avatar_url, status: row.status, createdAt: Number(row.created_at) || 0, updatedAt: Number(row.updated_at) || 0, lastSeenAt: Number(row.last_seen_at) || 0, migratedAt: Number(row.migrated_at) || 0, dataCount: Number(row.data_count) || 0 }));
}

async function getUserDetails(userId, env) {
  const row = await env.DB.prepare('SELECT user_id, github_login, avatar_url, status, created_at, updated_at, last_seen_at, migrated_at FROM onebox_users WHERE user_id = ?').bind(userId).first();
  if (!row) return null;
  const data = await env.DB.prepare('SELECT data_key, length(value_json) AS size_bytes, updated_at FROM onebox_user_data WHERE user_id = ? AND deleted_at IS NULL ORDER BY data_key').bind(userId).all();
  const files = await env.DB.prepare('SELECT COUNT(*) AS count, COALESCE(SUM(size_bytes), 0) AS size_bytes FROM onebox_user_files WHERE user_id = ?').bind(userId).first();
  return { id: row.user_id, login: row.github_login, avatarUrl: row.avatar_url, status: row.status, createdAt: Number(row.created_at) || 0, updatedAt: Number(row.updated_at) || 0, lastSeenAt: Number(row.last_seen_at) || 0, migratedAt: Number(row.migrated_at) || 0, data: (data.results || []).map((item) => ({ key: item.data_key, module: dataModule(item.data_key), sizeBytes: Number(item.size_bytes) || 0, updatedAt: Number(item.updated_at) || 0 })), fileCount: Number(files?.count) || 0, fileBytes: Number(files?.size_bytes) || 0 };
}

async function getUserData(userId, env) {
  const rows = await env.DB.prepare('SELECT data_key, value_json, updated_at FROM onebox_user_data WHERE user_id = ? AND deleted_at IS NULL ORDER BY data_key').bind(userId).all();
  const files = await env.DB.prepare('SELECT file_id, data_key, file_name, content_type, size_bytes, sha256, created_at FROM onebox_user_files WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all();
  return { data: (rows.results || []).map((row) => ({ key: row.data_key, module: dataModule(row.data_key), value: parseJson(row.value_json, row.value_json), updatedAt: Number(row.updated_at) || 0 })), files: (files.results || []).map((row) => ({ id: row.file_id, key: row.data_key, name: row.file_name, type: row.content_type, size: Number(row.size_bytes) || 0, sha256: row.sha256, createdAt: Number(row.created_at) || 0 })) };
}

function contentKindPath(value) { return CONTENT_KINDS.includes(value) ? value : ''; }
function contentTable(kind) { return kind === 'ads' ? 'onebox_ads' : 'onebox_announcements'; }
function contentIdColumn(kind) { return kind === 'ads' ? 'ad_id' : 'announcement_id'; }
function normalizeContent(kind, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const title = String(value.title || '').trim().slice(0, 160);
  const body = String(value.body || value.text || '').trim().slice(0, kind === 'ads' ? 700 : 6000);
  const placement = kind === 'ads' ? String(value.placement || 'home-feed') : String(value.placement || 'message-center');
  const status = ['draft', 'scheduled', 'published', 'paused'].includes(value.status) ? value.status : 'draft';
  const startsAt = Math.max(0, Number(value.startsAt) || 0) || null;
  const endsAt = Math.max(0, Number(value.endsAt) || 0) || null;
  if (!title || !body || (kind === 'ads' && !CONTENT_PLACEMENTS.includes(placement)) || (kind === 'announcements' && !['message-center', 'banner', 'modal'].includes(placement)) || (startsAt && endsAt && endsAt <= startsAt)) return null;
  const targetUrl = String(value.targetUrl || '').trim().slice(0, 1000);
  if (targetUrl) { try { if (!['http:', 'https:'].includes(new URL(targetUrl).protocol)) return null; } catch { return null; } }
  const imageUrl = String(value.imageUrl || '').trim().slice(0, 1000);
  if (imageUrl) { try { if (!['http:', 'https:'].includes(new URL(imageUrl).protocol)) return null; } catch { return null; } }
  const audience = value.audience === 'selected' ? 'selected' : 'all';
  const targetUsers = audience === 'selected' && kind === 'announcements' ? [...new Set((Array.isArray(value.targetUsers) ? value.targetUsers : []).map(String).filter(safeUserId))].slice(0, 5000) : [];
  if (audience === 'selected' && kind === 'announcements' && !targetUsers.length) return null;
  return { title, body, placement, status, startsAt, endsAt, targetUrl, imageUrl, audience, targetUsers };
}

async function publicConfig(request, env) {
  const now = Date.now();
  const flagsResult = await env.DB.prepare('SELECT module_key, enabled FROM onebox_module_flags').all();
  const modules = Object.fromEntries(CLOUD_MODULES.map((key) => [key, true]));
  (flagsResult.results || []).forEach((row) => { if (Object.hasOwn(modules, row.module_key)) modules[row.module_key] = Number(row.enabled) === 1; });
  const adRows = await env.DB.prepare("SELECT ad_id, content_json FROM onebox_ads WHERE status IN ('published', 'scheduled') AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?) ORDER BY created_at DESC LIMIT 30")
    .bind(now, now).all();
  const ads = (adRows.results || []).map((row) => ({ id: row.ad_id, ...parseJson(row.content_json, {}) }));
  let identity = null;
  try { identity = await authenticate(request, env); } catch { identity = null; }
  let announcements = [];
  if (identity) {
    const user = await env.DB.prepare('SELECT status FROM onebox_users WHERE user_id = ?').bind(identity.id).first();
    if (!user || user.status === 'active') {
      const readRows = await env.DB.prepare('SELECT announcement_id FROM onebox_announcement_reads WHERE user_id = ?').bind(identity.id).all();
      const readSet = new Set((readRows.results || []).map((row) => row.announcement_id));
      const items = await env.DB.prepare("SELECT announcement_id, content_json, audience, target_users_json FROM onebox_announcements WHERE status IN ('published', 'scheduled') AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?) ORDER BY created_at DESC LIMIT 100")
        .bind(now, now).all();
      announcements = (items.results || []).filter((row) => row.audience === 'all' || parseJson(row.target_users_json, []).includes(identity.id))
        .map((row) => ({ id: row.announcement_id, ...parseJson(row.content_json, {}), read: readSet.has(row.announcement_id) }));
    }
  }
  return responseJson({ modules, ads, announcements, generatedAt: now });
}

async function adminGetData(userId, env) {
  return getUserData(userId, env);
}

async function writeUserData(userId, key, value, env, updatedAt = Date.now()) {
  if (!dataModule(key)) throw Object.assign(Error('data_key_not_allowed'), { status: 400 });
  const encodedValue = JSON.stringify(value);
  if (new TextEncoder().encode(encodedValue).byteLength > 900 * 1024) throw Object.assign(Error('data_value_too_large'), { status: 413 });
  await env.DB.prepare(`INSERT INTO onebox_user_data (user_id, data_key, value_json, updated_at, deleted_at) VALUES (?, ?, ?, ?, NULL)
    ON CONFLICT(user_id, data_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at, deleted_at = NULL`)
    .bind(userId, key, encodedValue, Math.max(0, Math.floor(Number(updatedAt) || Date.now()))).run();
}

async function softDeleteData(userId, key, identity, env) {
  const row = await env.DB.prepare('SELECT value_json FROM onebox_user_data WHERE user_id = ? AND data_key = ? AND deleted_at IS NULL').bind(userId, key).first();
  if (!row) return false;
  const now = Date.now();
  const files = await env.DB.prepare('SELECT file_id, data_key, object_key, file_name, content_type, size_bytes, sha256, created_at FROM onebox_user_files WHERE user_id = ? AND data_key = ?').bind(userId, key).all();
  const statements = [
    env.DB.prepare('INSERT INTO onebox_recycle_bin (recycle_id, user_id, data_key, value_json, deleted_at, purge_at, deleted_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), userId, key, row.value_json, now, now + 30 * 24 * 60 * 60 * 1000, identity.id),
    env.DB.prepare('UPDATE onebox_user_data SET deleted_at = ?, updated_at = ? WHERE user_id = ? AND data_key = ?').bind(now, now, userId, key),
  ];
  for (const file of files.results || []) {
    statements.push(
      env.DB.prepare('INSERT INTO onebox_recycle_bin (recycle_id, user_id, data_key, value_json, deleted_at, purge_at, deleted_by) VALUES (?, ?, \'__file__\', ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), userId, JSON.stringify(file), now, now + 30 * 24 * 60 * 60 * 1000, identity.id),
      env.DB.prepare('DELETE FROM onebox_user_files WHERE user_id = ? AND file_id = ?').bind(userId, file.file_id),
      env.DB.prepare('INSERT INTO onebox_file_tombstones (user_id, file_id, deleted_at) VALUES (?, ?, ?) ON CONFLICT(user_id, file_id) DO UPDATE SET deleted_at = excluded.deleted_at').bind(userId, file.file_id, now),
    );
  }
  for (let index = 0; index < statements.length; index += 90) await env.DB.batch(statements.slice(index, index + 90));
  await auditAdmin(env, identity, 'user_data.delete', 'user_data', userId, { key, retentionDays: 30, filesMoved: (files.results || []).length });
  return true;
}

async function softDeleteUserFile(userId, fileId, identity, env) {
  const row = await userFileObject(userId, fileId, env);
  if (!row) return false;
  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO onebox_recycle_bin (recycle_id, user_id, data_key, value_json, deleted_at, purge_at, deleted_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(crypto.randomUUID(), userId, '__file__', JSON.stringify(row), now, now + 30 * 24 * 60 * 60 * 1000, identity.id),
    env.DB.prepare('DELETE FROM onebox_user_files WHERE user_id = ? AND file_id = ?').bind(userId, fileId),
    env.DB.prepare('INSERT INTO onebox_file_tombstones (user_id, file_id, deleted_at) VALUES (?, ?, ?) ON CONFLICT(user_id, file_id) DO UPDATE SET deleted_at = excluded.deleted_at').bind(userId, fileId, now),
  ]);
  await auditAdmin(env, identity, 'user_data.file_delete', 'user_data', userId, { fileId, retentionDays: 30 });
  return true;
}

async function userFileObject(userId, fileId, env) {
  return env.DB.prepare('SELECT file_id, data_key, object_key, file_name, content_type, size_bytes, sha256, created_at FROM onebox_user_files WHERE user_id = ? AND file_id = ?').bind(userId, fileId).first();
}

async function cloudRoute(request, url, env, identity) {
  const path = url.pathname, method = request.method;
  if (method === 'GET' && path === '/v1/public/config') return publicConfig(request, env);
  if (path.startsWith('/v1/cloud/')) {
    let user;
    try { user = await requireActiveUser(identity, env, true); } catch (error) { return cloudError(error.message, error.status || 500); }
    if (method === 'GET' && path === '/v1/cloud/account') {
      return responseJson({ id: user.user_id, login: user.github_login, avatarUrl: user.avatar_url, status: user.status, createdAt: Number(user.created_at) || 0, lastSeenAt: Number(user.last_seen_at) || 0, migratedAt: Number(user.migrated_at) || 0 });
    }
    if (method === 'GET' && path === '/v1/cloud/data') {
      const snapshot = await getUserData(identity.id, env);
      const deleted = await env.DB.prepare('SELECT data_key, updated_at FROM onebox_user_data WHERE user_id = ? AND deleted_at IS NOT NULL').bind(identity.id).all();
      const deletedFiles = await env.DB.prepare('SELECT file_id, deleted_at FROM onebox_file_tombstones WHERE user_id = ?').bind(identity.id).all();
      return responseJson({ ...snapshot, deleted: (deleted.results || []).map((row) => ({ key: row.data_key, updatedAt: Number(row.updated_at) || 0 })), deletedFiles: (deletedFiles.results || []).map((row) => ({ id: row.file_id, deletedAt: Number(row.deleted_at) || 0 })), migratedAt: Number(user.migrated_at) || 0 });
    }
    if (method === 'POST' && path === '/v1/cloud/migration') {
      const body = await readJson(request, 64 * 1024);
      if (body.action === 'complete') {
        const current = await env.DB.prepare('SELECT migrated_at, migration_consent_at FROM onebox_users WHERE user_id = ?').bind(identity.id).first();
        if (!current?.migration_consent_at) return cloudError('migration_consent_required', 403);
        const now = Date.now();
        await env.DB.prepare('UPDATE onebox_users SET migrated_at = COALESCE(migrated_at, ?), updated_at = ? WHERE user_id = ?').bind(now, now, identity.id).run();
        await auditAdmin(env, identity, 'user_data.migration_complete', 'user', identity.id, { consentedAt: Number(current.migration_consent_at) || 0 });
        return responseJson({ migrated: true });
      }
      if (body.action !== 'start') return cloudError('invalid_migration_action');
      if (body.consented !== true) return cloudError('migration_consent_required', 403);
      const current = await env.DB.prepare('SELECT migrated_at FROM onebox_users WHERE user_id = ?').bind(identity.id).first();
      if (current?.migrated_at) return cloudError('already_migrated', 409);
      const now = Date.now();
      await env.DB.prepare('UPDATE onebox_users SET migration_started_at = ?, migration_consent_at = ?, updated_at = ? WHERE user_id = ?')
        .bind(now, now, now, identity.id).run();
      await auditAdmin(env, identity, 'user_data.migration_start', 'user', identity.id, { consented: body.consented === true });
      return responseJson({ ready: true, userId: identity.id });
    }
    const dataMatch = path.match(/^\/v1\/cloud\/data\/([^/]+)$/);
    if (method === 'PUT' && dataMatch) {
      const key = decodeURIComponent(dataMatch[1]);
      const body = await readJson(request, 1024 * 1024);
      if (!dataModule(key) || !Object.hasOwn(body || {}, 'value')) return cloudError('invalid_data_key');
      await writeUserData(identity.id, key, body.value, env, body.updatedAt);
      return responseJson({ saved: true, key, updatedAt: Date.now() });
    }
    if (method === 'DELETE' && dataMatch) {
      const key = decodeURIComponent(dataMatch[1]);
      if (!dataModule(key)) return cloudError('invalid_data_key');
      const deleted = await softDeleteData(identity.id, key, identity, env);
      return responseJson({ deleted, key, deletedAt: Date.now() });
    }
    const fileMatch = path.match(/^\/v1\/cloud\/files\/([^/]+)$/);
    if (fileMatch) {
      const fileId = decodeURIComponent(fileMatch[1]);
      if (!safeId(fileId)) return cloudError('invalid_file_id');
      if (method === 'PUT') {
        const key = String(url.searchParams.get('key') || '');
        if (!dataModule(key)) return cloudError('invalid_data_key');
        const size = Number(request.headers.get('Content-Length') || 0);
        if (size > MAX_USER_FILE_BYTES) return cloudError('file_too_large', 413);
        const bytes = await request.arrayBuffer();
        if (!bytes.byteLength || bytes.byteLength > MAX_USER_FILE_BYTES) return cloudError('invalid_file_size', 413);
        const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
        const existing = await userFileObject(identity.id, fileId, env);
        const objectKey = 'user-data/' + identity.id + '/' + key + '/' + fileId + '/' + Date.now() + '-' + crypto.randomUUID();
        const contentType = String(request.headers.get('Content-Type') || 'application/octet-stream').slice(0, 160);
        let fileName = String(request.headers.get('X-File-Name') || fileId).slice(0, 720);
        try { fileName = decodeURIComponent(fileName); } catch { /* keep a safe literal filename */ }
        fileName = fileName.slice(0, 240).replace(/[\\/\r\n]/g, '_');
        await env.BOOKS_BUCKET.put(objectKey, bytes, { httpMetadata: { contentType }, customMetadata: { userId: identity.id, dataKey: key, fileId, sha256: digest } });
        await env.DB.batch([env.DB.prepare(`INSERT INTO onebox_user_files (user_id, file_id, data_key, object_key, file_name, content_type, size_bytes, sha256, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, file_id) DO UPDATE SET data_key = excluded.data_key, object_key = excluded.object_key,
          file_name = excluded.file_name, content_type = excluded.content_type, size_bytes = excluded.size_bytes, sha256 = excluded.sha256, created_at = excluded.created_at`)
          .bind(identity.id, fileId, key, objectKey, fileName, contentType, bytes.byteLength, digest, Date.now()),
          env.DB.prepare('DELETE FROM onebox_file_tombstones WHERE user_id = ? AND file_id = ?').bind(identity.id, fileId)]);
        if (existing?.object_key && existing.object_key !== objectKey) await env.BOOKS_BUCKET.delete(existing.object_key);
        return responseJson({ saved: true, id: fileId, size: bytes.byteLength, sha256: digest });
      }
      if (method === 'GET') {
        const row = await userFileObject(identity.id, fileId, env);
        if (!row) return cloudError('file_not_found', 404);
        const object = await env.BOOKS_BUCKET.get(row.object_key);
        if (!object) return cloudError('file_not_found', 404);
        const headers = new Headers({ 'content-type': row.content_type, 'content-length': String(row.size_bytes), 'cache-control': 'private, no-store', 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name)}`, 'x-content-sha256': row.sha256 });
        object.writeHttpMetadata(headers);
        headers.set('cache-control', 'private, no-store');
        return new Response(object.body, { headers });
      }
      if (method === 'DELETE') {
        const deleted = await softDeleteUserFile(identity.id, fileId, identity, env);
        return responseJson({ deleted, id: fileId, retentionDays: 30 });
      }
    }
    return cloudError('not_found', 404);
  }
  if (path.startsWith('/v1/public/announcements/') && method === 'POST' && path.endsWith('/read')) {
    const match = path.match(/^\/v1\/public\/announcements\/([^/]+)\/read$/);
    if (!match) return cloudError('not_found', 404);
    const id = decodeURIComponent(match[1]);
    const user = await env.DB.prepare('SELECT status FROM onebox_users WHERE user_id = ?').bind(identity.id).first();
    if (user && user.status !== 'active') return cloudError('account_unavailable', 403);
    const now = Date.now();
    const item = await env.DB.prepare("SELECT audience, target_users_json FROM onebox_announcements WHERE announcement_id = ? AND status IN ('published', 'scheduled') AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?)").bind(id, now, now).first();
    if (!item || (item.audience !== 'all' && !parseJson(item.target_users_json, []).includes(identity.id))) return cloudError('not_found', 404);
      await env.DB.prepare('INSERT INTO onebox_announcement_reads (announcement_id, user_id, read_at) VALUES (?, ?, ?) ON CONFLICT(announcement_id, user_id) DO UPDATE SET read_at = excluded.read_at')
      .bind(id, identity.id, Date.now()).run();
    return responseJson({ read: true });
  }
  if (!path.startsWith('/v1/admin/')) return null;
  let admin;
  try { admin = await requireAdmin(identity, env); } catch (error) { return cloudError(error.message, error.status || 500); }
  const requirePermission = async (permission) => requireAdmin(identity, env, permission);
  if (method === 'GET' && path === '/v1/admin/me') return responseJson({ admin: adminSummary(admin, isBootstrapSuperadmin(identity, env)), permissions: admin.permissions });
  if (method === 'GET' && path === '/v1/admin/summary') {
    if (!admin.permissions.includes('*') && !admin.permissions.includes('stats.read')) return cloudError('permission_denied', 403);
    const users = await env.DB.prepare('SELECT COUNT(*) AS total, SUM(CASE WHEN migrated_at IS NOT NULL THEN 1 ELSE 0 END) AS migrated, SUM(CASE WHEN status = \'active\' THEN 1 ELSE 0 END) AS active FROM onebox_users').first();
    const content = await env.DB.prepare("SELECT (SELECT COUNT(*) FROM onebox_ads WHERE status = 'published') AS ads, (SELECT COUNT(*) FROM onebox_announcements WHERE status = 'published') AS announcements").first();
    return responseJson({ users: Number(users?.total) || 0, migratedUsers: Number(users?.migrated) || 0, activeUsers: Number(users?.active) || 0, liveAds: Number(content?.ads) || 0, liveAnnouncements: Number(content?.announcements) || 0 });
  }
  if (method === 'GET' && path === '/v1/admin/users') {
    try { await requirePermission('users.read'); } catch (error) { return cloudError(error.message, error.status || 403); }
    return responseJson({ users: await listUsers(url, env) });
  }
  const userPath = path.match(/^\/v1\/admin\/users\/([^/]+)(?:\/(.*))?$/);
  if (userPath) {
    const userId = decodeURIComponent(userPath[1]), rest = userPath[2] || '';
    if (!safeUserId(userId)) return cloudError('invalid_user_id');
    if (method === 'GET' && !rest) {
      try { await requirePermission('users.read'); } catch (error) { return cloudError(error.message, error.status || 403); }
      const user = await getUserDetails(userId, env);
      if (!user) return cloudError('user_not_found', 404);
      return responseJson({ user });
    }
    if (method === 'PUT' && !rest) {
      try { await requirePermission('users.manage'); } catch (error) { return cloudError(error.message, error.status || 403); }
      const body = await readJson(request, 64 * 1024), status = String(body.status || '');
      if (!['active', 'suspended'].includes(status)) return cloudError('invalid_user_status');
      const result = await env.DB.prepare('UPDATE onebox_users SET status = ?, updated_at = ? WHERE user_id = ?').bind(status, Date.now(), userId).run();
      if (!Number(result?.meta?.changes)) return cloudError('user_not_found', 404);
      await auditAdmin(env, identity, 'user.status_change', 'user', userId, { status });
      return responseJson({ updated: true, status });
    }
    if (method === 'DELETE' && !rest) {
      try { await requirePermission('data.delete'); } catch (error) { return cloudError(error.message, error.status || 403); }
      const user = await env.DB.prepare('SELECT status FROM onebox_users WHERE user_id = ?').bind(userId).first();
      if (!user) return cloudError('user_not_found', 404);
      if (user.status === 'deleted' || user.status === 'purged') return cloudError('user_already_deleted', 409);
      const rows = await env.DB.prepare('SELECT data_key, value_json FROM onebox_user_data WHERE user_id = ? AND deleted_at IS NULL').bind(userId).all();
      const now = Date.now(), purgeAt = now + 30 * 24 * 60 * 60 * 1000;
      const statements = (rows.results || []).map((row) => env.DB.prepare('INSERT INTO onebox_recycle_bin (recycle_id, user_id, data_key, value_json, deleted_at, purge_at, deleted_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), userId, row.data_key, row.value_json, now, purgeAt, identity.id));
      statements.push(env.DB.prepare('INSERT INTO onebox_recycle_bin (recycle_id, user_id, data_key, value_json, deleted_at, purge_at, deleted_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(crypto.randomUUID(), userId, '__account__', '{}', now, purgeAt, identity.id));
      statements.push(env.DB.prepare('UPDATE onebox_user_data SET deleted_at = ?, updated_at = ? WHERE user_id = ?').bind(now, now, userId));
      statements.push(env.DB.prepare("UPDATE onebox_users SET status = 'deleted', updated_at = ? WHERE user_id = ?").bind(now, userId));
      await env.DB.batch(statements);
      await auditAdmin(env, identity, 'user.delete', 'user', userId, { retentionDays: 30, movedKeys: (rows.results || []).length });
      return responseJson({ deleted: true, purgeAt });
    }
    if (method === 'GET' && rest === 'data') {
      try { await requirePermission('data.read'); } catch (error) { return cloudError(error.message, error.status || 403); }
      const data = await adminGetData(userId, env);
      await auditAdmin(env, identity, 'user_data.view', 'user', userId, { keyCount: data.data.length });
      return responseJson(data);
    }
    if (method === 'GET' && rest === 'export') {
      try { await requirePermission('data.export'); } catch (error) { return cloudError(error.message, error.status || 403); }
      const user = await getUserDetails(userId, env);
      if (!user) return cloudError('user_not_found', 404);
      const data = await adminGetData(userId, env);
      await auditAdmin(env, identity, 'user_data.export', 'user', userId, { keyCount: data.data.length, fileCount: data.files.length });
      return responseJson({ exportedAt: Date.now(), user: { id: user.id, login: user.login }, data: data.data, files: data.files });
    }
    const dataMatch = rest.match(/^data\/([^/]+)$/);
    if (dataMatch && method === 'PUT') {
      try { await requirePermission('data.edit'); } catch (error) { return cloudError(error.message, error.status || 403); }
      const key = decodeURIComponent(dataMatch[1]), body = await readJson(request, 1024 * 1024);
      if (!dataModule(key) || !Object.hasOwn(body || {}, 'value')) return cloudError('invalid_data_key');
      await writeUserData(userId, key, body.value, env);
      await auditAdmin(env, identity, 'user_data.edit', 'user', userId, { key });
      return responseJson({ saved: true });
    }
    if (dataMatch && method === 'DELETE') {
      try { await requirePermission('data.delete'); } catch (error) { return cloudError(error.message, error.status || 403); }
      const key = decodeURIComponent(dataMatch[1]);
      if (!dataModule(key)) return cloudError('invalid_data_key');
      const deleted = await softDeleteData(userId, key, identity, env);
      return deleted ? responseJson({ deleted: true, retentionDays: 30 }) : cloudError('data_not_found', 404);
    }
    const fileMatch = rest.match(/^files\/([^/]+)$/);
    if (fileMatch && ['GET', 'DELETE'].includes(method)) {
      try { await requirePermission(method === 'GET' ? 'data.read' : 'data.delete'); } catch (error) { return cloudError(error.message, error.status || 403); }
      const fileId = decodeURIComponent(fileMatch[1]);
      const row = await userFileObject(userId, fileId, env);
      if (!row) return cloudError('file_not_found', 404);
      if (method === 'DELETE') {
        await softDeleteUserFile(userId, fileId, identity, env);
        return responseJson({ deleted: true, retentionDays: 30 });
      }
      const object = await env.BOOKS_BUCKET.get(row.object_key);
      if (!object) return cloudError('file_not_found', 404);
      await auditAdmin(env, identity, 'user_data.file_view', 'user', userId, { fileId });
      const headers = new Headers({ 'content-type': row.content_type, 'content-length': String(row.size_bytes), 'cache-control': 'private, no-store', 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(row.file_name)}`, 'x-content-sha256': row.sha256 });
      object.writeHttpMetadata(headers);
      headers.set('cache-control', 'private, no-store');
      return new Response(object.body, { headers });
    }
  }
  if (method === 'GET' && path === '/v1/admin/admins') {
    if (admin.role !== 'super_admin') return cloudError('permission_denied', 403);
    const rows = await env.DB.prepare('SELECT github_id, github_login, role, grants_json, status, invited_by, created_at, updated_at FROM onebox_admins ORDER BY created_at ASC').all();
    return responseJson({ admins: (rows.results || []).map((row) => adminSummary(row, isBootstrapSuperadmin({ id: row.github_id }, env))) });
  }
  if (method === 'POST' && path === '/v1/admin/admins') {
    if (admin.role !== 'super_admin') return cloudError('permission_denied', 403);
    const body = await readJson(request, 64 * 1024);
    const githubId = String(body.githubId || ''), role = String(body.role || '');
    if (!safeUserId(githubId) || !ADMIN_ROLES.includes(role)) return cloudError('invalid_admin');
    const grants = role === 'personal_data_admin' ? { export: body.grants?.export === true, delete: body.grants?.delete === true } : {};
    const now = Date.now();
    await env.DB.prepare(`INSERT INTO onebox_admins (github_id, github_login, role, grants_json, status, invited_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?, ?) ON CONFLICT(github_id) DO UPDATE SET github_login = excluded.github_login, role = excluded.role, grants_json = excluded.grants_json, status = 'active', invited_by = excluded.invited_by, updated_at = excluded.updated_at`)
      .bind(githubId, String(body.githubLogin || '').slice(0, 100), role, JSON.stringify(grants), identity.id, now, now).run();
    await auditAdmin(env, identity, 'admin.invite_or_update', 'admin', githubId, { role, grants });
    return responseJson({ saved: true });
  }
  const adminPath = path.match(/^\/v1\/admin\/admins\/([^/]+)$/);
  if (adminPath && method === 'DELETE') {
    if (admin.role !== 'super_admin') return cloudError('permission_denied', 403);
    const target = decodeURIComponent(adminPath[1]);
    if (!safeUserId(target) || isBootstrapSuperadmin({ id: target }, env)) return cloudError('protected_admin', 409);
    const row = await env.DB.prepare('SELECT role FROM onebox_admins WHERE github_id = ? AND status = \'active\'').bind(target).first();
    if (!row) return cloudError('admin_not_found', 404);
    if (row.role === 'super_admin') {
      const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM onebox_admins WHERE role = 'super_admin' AND status = 'active'").first();
      if (Number(count?.count) <= 1) return cloudError('last_super_admin', 409);
    }
    await env.DB.prepare("UPDATE onebox_admins SET status = 'revoked', updated_at = ? WHERE github_id = ?").bind(Date.now(), target).run();
    await auditAdmin(env, identity, 'admin.revoke', 'admin', target, {});
    return responseJson({ revoked: true });
  }
  if (method === 'GET' && path === '/v1/admin/modules') {
    try { await requirePermission('modules.manage'); } catch (error) { return cloudError(error.message, error.status || 403); }
    const rows = await env.DB.prepare('SELECT module_key, enabled, updated_at, updated_by FROM onebox_module_flags ORDER BY module_key').all();
    const flags = Object.fromEntries(CLOUD_MODULES.map((key) => [key, true]));
    (rows.results || []).forEach((row) => { if (Object.hasOwn(flags, row.module_key)) flags[row.module_key] = Number(row.enabled) === 1; });
    return responseJson({ modules: flags });
  }
  if (method === 'PUT' && path === '/v1/admin/modules') {
    try { await requirePermission('modules.manage'); } catch (error) { return cloudError(error.message, error.status || 403); }
    const body = await readJson(request, 64 * 1024), flags = body.modules || {};
    const statements = [];
    for (const key of CLOUD_MODULES) {
      if (typeof flags[key] !== 'boolean') continue;
      statements.push(env.DB.prepare('INSERT INTO onebox_module_flags (module_key, enabled, updated_at, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(module_key) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at, updated_by = excluded.updated_by')
        .bind(key, flags[key] ? 1 : 0, Date.now(), identity.id));
    }
    if (statements.length) await env.DB.batch(statements);
    await auditAdmin(env, identity, 'modules.update', 'modules', 'global', { enabled: Object.entries(flags).filter(([, value]) => value === false).map(([key]) => key) });
    return responseJson({ saved: true });
  }
  if (method === 'GET' && path === '/v1/admin/content') {
    try { await requirePermission('content.manage'); } catch (error) { return cloudError(error.message, error.status || 403); }
    const kind = contentKindPath(url.searchParams.get('kind'));
    if (!kind) return cloudError('invalid_content_kind');
    const table = contentTable(kind), idColumn = contentIdColumn(kind);
    const rows = await env.DB.prepare('SELECT ' + idColumn + ' AS item_id, content_json, status, starts_at, ends_at, created_at, updated_at FROM ' + table + ' ORDER BY updated_at DESC LIMIT 200').all();
    return responseJson({ kind, items: (rows.results || []).map((row) => ({ id: row.item_id, ...parseJson(row.content_json, {}), status: row.status, startsAt: Number(row.starts_at) || 0, endsAt: Number(row.ends_at) || 0, createdAt: Number(row.created_at) || 0, updatedAt: Number(row.updated_at) || 0 })) });
  }
  if (method === 'POST' && path === '/v1/admin/content') {
    try { await requirePermission('content.manage'); } catch (error) { return cloudError(error.message, error.status || 403); }
    const body = await readJson(request, 128 * 1024), kind = contentKindPath(body.kind), item = normalizeContent(body.kind, body.item);
    if (!kind || !item) return cloudError('invalid_content');
    const id = crypto.randomUUID(), now = Date.now(), table = contentTable(kind), idColumn = contentIdColumn(kind);
    const columns = kind === 'announcements' ? idColumn + ', content_json, audience, target_users_json, status, starts_at, ends_at, created_at, updated_at, created_by' : idColumn + ', content_json, status, starts_at, ends_at, created_at, updated_at, created_by';
    const values = kind === 'announcements' ? [id, JSON.stringify(item), item.audience, JSON.stringify(item.targetUsers), item.status, item.startsAt, item.endsAt, now, now, identity.id] : [id, JSON.stringify(item), item.status, item.startsAt, item.endsAt, now, now, identity.id];
    await env.DB.prepare('INSERT INTO ' + table + ' (' + columns + ') VALUES (' + values.map(() => '?').join(', ') + ')').bind(...values).run();
    await auditAdmin(env, identity, kind + '.create', kind, id, { status: item.status, placement: item.placement });
    return responseJson({ saved: true, id });
  }
  const contentPath = path.match(/^\/v1\/admin\/content\/([^/]+)\/([^/]+)$/);
  if (contentPath) {
    const kind = contentKindPath(decodeURIComponent(contentPath[1])), id = decodeURIComponent(contentPath[2]);
    if (!kind || !safeId(id)) return cloudError('invalid_content_id');
    try { await requirePermission('content.manage'); } catch (error) { return cloudError(error.message, error.status || 403); }
    const table = contentTable(kind), idColumn = contentIdColumn(kind);
    if (method === 'PUT') {
      const body = await readJson(request, 128 * 1024), item = normalizeContent(kind, body.item);
      if (!item) return cloudError('invalid_content');
      const result = await env.DB.prepare('UPDATE ' + table + ' SET content_json = ?, ' + (kind === 'announcements' ? 'audience = ?, target_users_json = ?, ' : '') + 'status = ?, starts_at = ?, ends_at = ?, updated_at = ? WHERE ' + idColumn + ' = ?')
        .bind(...(kind === 'announcements' ? [JSON.stringify(item), item.audience, JSON.stringify(item.targetUsers), item.status, item.startsAt, item.endsAt, Date.now(), id] : [JSON.stringify(item), item.status, item.startsAt, item.endsAt, Date.now(), id])).run();
      if (!Number(result?.meta?.changes)) return cloudError('content_not_found', 404);
      await auditAdmin(env, identity, kind + '.update', kind, id, { status: item.status, placement: item.placement });
      return responseJson({ saved: true });
    }
    if (method === 'DELETE') {
      const result = await env.DB.prepare("UPDATE " + table + " SET status = 'paused', updated_at = ? WHERE " + idColumn + ' = ?').bind(Date.now(), id).run();
      if (!Number(result?.meta?.changes)) return cloudError('content_not_found', 404);
      await auditAdmin(env, identity, kind + '.pause', kind, id, {});
      return responseJson({ paused: true });
    }
  }
  if (method === 'GET' && path === '/v1/admin/recycle-bin') {
    try { await requirePermission('data.read'); } catch (error) { return cloudError(error.message, error.status || 403); }
    const rows = await env.DB.prepare('SELECT r.recycle_id, r.user_id, u.github_login, r.data_key, r.deleted_at, r.purge_at, r.deleted_by FROM onebox_recycle_bin r LEFT JOIN onebox_users u ON u.user_id = r.user_id WHERE r.restored_at IS NULL ORDER BY r.deleted_at DESC LIMIT 500').all();
    return responseJson({ items: (rows.results || []).map((row) => ({ id: row.recycle_id, userId: row.user_id, login: row.github_login || '', key: row.data_key, deletedAt: Number(row.deleted_at) || 0, purgeAt: Number(row.purge_at) || 0, deletedBy: row.deleted_by })) });
  }
  const recycleMatch = path.match(/^\/v1\/admin\/recycle-bin\/([^/]+)\/restore$/);
  if (method === 'POST' && recycleMatch) {
    try { await requirePermission('data.delete'); } catch (error) { return cloudError(error.message, error.status || 403); }
    const id = decodeURIComponent(recycleMatch[1]), item = await env.DB.prepare('SELECT recycle_id, user_id, data_key, value_json, deleted_at FROM onebox_recycle_bin WHERE recycle_id = ? AND restored_at IS NULL').bind(id).first();
    if (!item) return cloudError('recycle_item_not_found', 404);
    if (item.data_key === '__account__') {
      const rows = await env.DB.prepare('SELECT recycle_id, data_key, value_json FROM onebox_recycle_bin WHERE user_id = ? AND deleted_at = ? AND restored_at IS NULL AND data_key NOT IN (\'__account__\', \'__file__\')').bind(item.user_id, item.deleted_at).all();
      const statements = (rows.results || []).map((row) => env.DB.prepare('INSERT INTO onebox_user_data (user_id, data_key, value_json, updated_at, deleted_at) VALUES (?, ?, ?, ?, NULL) ON CONFLICT(user_id, data_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at, deleted_at = NULL')
        .bind(item.user_id, row.data_key, row.value_json, Date.now()));
      statements.push(env.DB.prepare("UPDATE onebox_users SET status = 'active', updated_at = ? WHERE user_id = ?").bind(Date.now(), item.user_id));
      statements.push(env.DB.prepare("UPDATE onebox_recycle_bin SET restored_at = ? WHERE user_id = ? AND deleted_at = ? AND restored_at IS NULL AND data_key != '__file__'").bind(Date.now(), item.user_id, item.deleted_at));
      await env.DB.batch(statements);
    } else if (item.data_key === '__file__') {
      const file = parseJson(item.value_json, {});
      if (!file.file_id || !file.object_key) return cloudError('recycle_file_invalid', 409);
      if (await userFileObject(item.user_id, file.file_id, env)) return cloudError('file_already_active', 409);
      await env.DB.batch([
        env.DB.prepare(`INSERT INTO onebox_user_files (user_id, file_id, data_key, object_key, file_name, content_type, size_bytes, sha256, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, file_id) DO UPDATE SET data_key = excluded.data_key, object_key = excluded.object_key,
          file_name = excluded.file_name, content_type = excluded.content_type, size_bytes = excluded.size_bytes, sha256 = excluded.sha256, created_at = excluded.created_at`)
          .bind(item.user_id, file.file_id, file.data_key, file.object_key, file.file_name, file.content_type, file.size_bytes, file.sha256, Date.now()),
        env.DB.prepare('UPDATE onebox_recycle_bin SET restored_at = ? WHERE recycle_id = ?').bind(Date.now(), id),
        env.DB.prepare('DELETE FROM onebox_file_tombstones WHERE user_id = ? AND file_id = ?').bind(item.user_id, file.file_id),
      ]);
    } else {
      await env.DB.batch([
        env.DB.prepare('INSERT INTO onebox_user_data (user_id, data_key, value_json, updated_at, deleted_at) VALUES (?, ?, ?, ?, NULL) ON CONFLICT(user_id, data_key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at, deleted_at = NULL').bind(item.user_id, item.data_key, item.value_json, Date.now()),
        env.DB.prepare('UPDATE onebox_recycle_bin SET restored_at = ? WHERE recycle_id = ?').bind(Date.now(), id),
      ]);
    }
    await auditAdmin(env, identity, 'user_data.restore', 'user', item.user_id, { key: item.data_key });
    return responseJson({ restored: true });
  }
  if (method === 'GET' && path === '/v1/admin/audit') {
    try { await requirePermission('audit.read'); } catch (error) { return cloudError(error.message, error.status || 403); }
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit')) || 50));
    const rows = await env.DB.prepare('SELECT audit_id, actor_id, actor_login, action, target_type, target_id, metadata_json, created_at FROM onebox_audit_log ORDER BY created_at DESC LIMIT ?').bind(limit).all();
    return responseJson({ items: (rows.results || []).map((row) => ({ id: row.audit_id, actorId: row.actor_id, actorLogin: row.actor_login, action: row.action, targetType: row.target_type, targetId: row.target_id, metadata: parseJson(row.metadata_json), createdAt: Number(row.created_at) || 0 })) });
  }
  return cloudError('not_found', 404);
}

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method === 'GET' && path === '/healthz') return responseJson({ ok: true, service: 'onebox-reader-sync' });
  if (request.method === 'POST' && path === '/v1/session') return handleSession(request, env);
  if (request.method === 'GET' && path === '/v1/public/config') return cloudRoute(request, url, env, null);
  const identity = await authenticate(request, env);
  if (!identity) return responseJson({ error: 'session_invalid' }, 401);
  const cloudResponse = await cloudRoute(request, url, env, identity);
  if (cloudResponse) return cloudResponse;
  if (path === '/v1/library' || path.startsWith('/v1/books/')) {
    const user = await requireActiveUser(identity, env, false);
    if (user && user.status !== 'active') return responseJson({ error: 'account_unavailable' }, 403);
  }
  if (request.method === 'GET' && path === '/v1/library') return listBooks(identity.sub, env);
  if (request.method === 'PUT' && path === '/v1/library') return upsertBooks(request, identity.sub, env);
  const bookId = bookIdFromPath(path);
  if (!bookId) return responseJson({ error: 'not_found' }, 404);
  if (request.method === 'PUT' && path.endsWith('/file')) return putBookFile(request, identity.sub, bookId, env);
  if (request.method === 'GET' && path.endsWith('/file')) return getBookFile(identity.sub, bookId, env);
  if (request.method === 'DELETE' && !path.endsWith('/file')) return deleteBook(identity.sub, bookId, env);
  return responseJson({ error: 'not_found' }, 404);
}

async function purgeExpiredUserData(env) {
  const now = Date.now();
  const expired = await env.DB.prepare('SELECT recycle_id, user_id, data_key, deleted_at FROM onebox_recycle_bin WHERE restored_at IS NULL AND purge_at <= ? ORDER BY purge_at LIMIT 40').bind(now).all();
  for (const item of expired.results || []) {
    if (item.data_key === '__account__') {
      const userFiles = await env.DB.prepare('SELECT object_key FROM onebox_user_files WHERE user_id = ?').bind(item.user_id).all();
      for (const file of userFiles.results || []) await env.BOOKS_BUCKET.delete(file.object_key);
      const recycledFiles = await env.DB.prepare("SELECT value_json FROM onebox_recycle_bin WHERE user_id = ? AND data_key = '__file__' AND restored_at IS NULL").bind(item.user_id).all();
      for (const row of recycledFiles.results || []) { const file = parseJson(row.value_json, {}); if (file.object_key) await env.BOOKS_BUCKET.delete(file.object_key); }
      const bookFiles = await env.DB.prepare('SELECT file_key FROM reader_books WHERE user_id = ? AND file_key IS NOT NULL').bind(item.user_id).all();
      for (const file of bookFiles.results || []) await env.BOOKS_BUCKET.delete(file.file_key);
      await env.DB.batch([
        env.DB.prepare('DELETE FROM onebox_user_files WHERE user_id = ?').bind(item.user_id),
        env.DB.prepare('DELETE FROM onebox_file_tombstones WHERE user_id = ?').bind(item.user_id),
        env.DB.prepare('DELETE FROM onebox_user_data WHERE user_id = ?').bind(item.user_id),
        env.DB.prepare('DELETE FROM reader_books WHERE user_id = ?').bind(item.user_id),
        env.DB.prepare('DELETE FROM reader_book_deletions WHERE user_id = ?').bind(item.user_id),
        env.DB.prepare("UPDATE onebox_users SET status = 'purged', github_login = '', avatar_url = '', migrated_at = NULL, updated_at = ? WHERE user_id = ?").bind(now, item.user_id),
      ]);
    } else if (item.data_key === '__file__') {
      const file = parseJson(item.value_json, {});
      if (file.object_key) await env.BOOKS_BUCKET.delete(file.object_key);
      await env.DB.prepare('DELETE FROM onebox_file_tombstones WHERE user_id = ? AND file_id = ?').bind(item.user_id, file.file_id || '').run();
    } else {
      const current = await env.DB.prepare('SELECT deleted_at FROM onebox_user_data WHERE user_id = ? AND data_key = ?').bind(item.user_id, item.data_key).first();
      if (Number(current?.deleted_at) === Number(item.deleted_at)) {
        const files = await env.DB.prepare('SELECT object_key FROM onebox_user_files WHERE user_id = ? AND data_key = ?').bind(item.user_id, item.data_key).all();
        for (const file of files.results || []) await env.BOOKS_BUCKET.delete(file.object_key);
        await env.DB.batch([
          env.DB.prepare('DELETE FROM onebox_user_files WHERE user_id = ? AND data_key = ?').bind(item.user_id, item.data_key),
          env.DB.prepare('DELETE FROM onebox_user_data WHERE user_id = ? AND data_key = ? AND deleted_at = ?').bind(item.user_id, item.data_key, item.deleted_at),
        ]);
      }
    }
    await env.DB.prepare('DELETE FROM onebox_recycle_bin WHERE recycle_id = ? AND restored_at IS NULL').bind(item.recycle_id).run();
  }
}

export default {
  async fetch(request, env) {
    try {
      const response = await route(request, env);
      return withCors(response, request, env);
    } catch (error) {
      const status = Number(error?.status) || 500;
      return withCors(responseJson({ error: status === 500 ? 'internal_error' : error.message }, status), request, env);
    }
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(purgeExpiredUserData(env));
  },
};

export const __test = { verifySession, signSession, cleanMetadata, progressValue, bookIdFromPath, MAX_BOOK_BYTES };
