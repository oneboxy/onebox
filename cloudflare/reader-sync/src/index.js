const MAX_BOOK_BYTES = 64 * 1024 * 1024;
const MAX_JSON_BYTES = 1024 * 1024;
const MAX_BOOKS_PER_USER = 80;
const SESSION_TTL_SECONDS = 12 * 60 * 60;

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
    'access-control-allow-headers': 'authorization, content-type, x-content-sha256',
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
    ? { id: String(user.id), login: String(user.login || '').slice(0, 100) }
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
  return responseJson({ token, expiresAt, user: { id: identity.id, login: identity.login } });
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

async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method === 'GET' && path === '/healthz') return responseJson({ ok: true, service: 'onebox-reader-sync' });
  if (request.method === 'POST' && path === '/v1/session') return handleSession(request, env);
  const identity = await authenticate(request, env);
  if (!identity) return responseJson({ error: 'session_invalid' }, 401);
  if (request.method === 'GET' && path === '/v1/library') return listBooks(identity.sub, env);
  if (request.method === 'PUT' && path === '/v1/library') return upsertBooks(request, identity.sub, env);
  const bookId = bookIdFromPath(path);
  if (!bookId) return responseJson({ error: 'not_found' }, 404);
  if (request.method === 'PUT' && path.endsWith('/file')) return putBookFile(request, identity.sub, bookId, env);
  if (request.method === 'GET' && path.endsWith('/file')) return getBookFile(identity.sub, bookId, env);
  if (request.method === 'DELETE' && !path.endsWith('/file')) return deleteBook(identity.sub, bookId, env);
  return responseJson({ error: 'not_found' }, 404);
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
};

export const __test = { verifySession, signSession, cleanMetadata, progressValue, bookIdFromPath, MAX_BOOK_BYTES };
