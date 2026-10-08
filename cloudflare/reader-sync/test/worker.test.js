import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { __test } from '../src/index.js';

const secret = 'test-only-secret-with-adequate-entropy';

class FakeDatabase {
  constructor() { this.rows = new Map(); this.deletions = new Map(); }
  prepare(sql) {
    const db = this;
    let params = [];
    return {
      bind(...values) { params = values; return this; },
      async first() {
        if (sql.includes('COUNT(*)')) return { count: [...db.rows.values()].filter((row) => row.user_id === params[0]).length };
        if (sql.includes('SELECT metadata_json')) return db.rows.get(params[0] + ':' + params[1]) || null;
        if (sql.includes('SELECT file_key, file_sha256')) {
          const row = db.rows.get(params[0] + ':' + params[1]);
          return row ? { file_key: row.file_key, file_sha256: row.file_sha256, file_size: row.file_size, file_type: row.file_type } : null;
        }
        if (sql.includes('SELECT file_key FROM')) {
          const row = db.rows.get(params[0] + ':' + params[1]);
          return row ? { file_key: row.file_key } : null;
        }
        return null;
      },
      async all() {
        if (sql.includes('SELECT book_id, metadata_json')) {
          return { results: [...db.rows.values()].filter((row) => row.user_id === params[0]).map((row) => ({ ...row })) };
        }
        if (sql.includes('FROM reader_book_deletions')) {
          const userId = params[0];
          if (sql.includes(' IN (')) return { results: params.slice(1).filter((id) => db.deletions.has(userId + ':' + id)).map((book_id) => ({ book_id })) };
          return { results: [...db.deletions.values()].filter((row) => row.user_id === userId).map((row) => ({ book_id: row.book_id, deleted_at: row.deleted_at })) };
        }
        if (sql.includes('SELECT book_id FROM')) return { results: [...db.rows.values()].filter((row) => row.user_id === params[0]).map((row) => ({ book_id: row.book_id })) };
        return { results: [] };
      },
      async run() {
        if (sql.includes('UPDATE reader_books SET file_key')) {
          const row = db.rows.get(params[4] + ':' + params[5]);
          if (row) Object.assign(row, { file_key: params[0], file_sha256: params[1], file_size: params[2], file_type: params[3] });
          return {};
        }
        if (sql.includes('DELETE FROM reader_books')) { db.rows.delete(params[0] + ':' + params[1]); return {}; }
        if (sql.includes('INSERT INTO reader_book_deletions')) {
          const key = params[0] + ':' + params[1];
          const current = db.deletions.get(key);
          db.deletions.set(key, { user_id: params[0], book_id: params[1], deleted_at: Math.max(current?.deleted_at || 0, params[2]) });
          return {};
        }
        return {};
      },
      params() { return params; },
      sql() { return sql; },
    };
  }
  async batch(statements) {
    statements.forEach((statement) => {
      const [user_id, book_id, metadata_json, progress_json, progress_updated_at, updated_at] = statement.params();
      const key = user_id + ':' + book_id;
      const current = this.rows.get(key);
      if (!current) {
        this.rows.set(key, { user_id, book_id, metadata_json, progress_json, progress_updated_at, updated_at, file_key: null, file_sha256: null, file_size: null, file_type: null });
        return;
      }
      if (updated_at >= current.updated_at) { current.metadata_json = metadata_json; current.updated_at = updated_at; }
      if (progress_updated_at >= current.progress_updated_at) { current.progress_json = progress_json; current.progress_updated_at = progress_updated_at; }
    });
    return statements.map(() => ({ meta: { changes: 1 } }));
  }
}

function testEnv() {
  const files = new Map();
  return {
    SESSION_SECRET: secret,
    ALLOWED_ORIGIN: 'https://oneboxy.github.io',
    DB: new FakeDatabase(),
    BOOKS_BUCKET: {
      async put(key, value, options = {}) { files.set(key, { bytes: value, options }); },
      async get(key) {
        const item = files.get(key);
        if (!item) return null;
        return { body: item.bytes, size: item.bytes.byteLength, writeHttpMetadata(headers) { headers.set('content-type', item.options.httpMetadata.contentType); } };
      },
      async delete(key) { files.delete(key); },
      files,
    },
  };
}

async function sessionToken(userId = '1234') {
  return __test.signSession({ iss: 'onebox-reader-sync', sub: userId, login: 'reader', exp: Math.floor(Date.now() / 1000) + 3600 }, secret);
}

function apiRequest(path, token, options = {}) {
  return new Request('https://reader-sync.test' + path, {
    ...options,
    headers: { ...(options.headers || {}), ...(token ? { authorization: 'Bearer ' + token } : {}), origin: 'https://oneboxy.github.io' },
  });
}

test('session tokens are signed, expire, and reject altered payloads', async () => {
  const good = await sessionToken();
  assert.equal((await __test.verifySession(good, secret))?.sub, '1234');
  assert.equal(await __test.verifySession(good, secret, Date.now() + 2 * 60 * 60 * 1000), null);
  const altered = good.replace(/.$/, good.endsWith('A') ? 'B' : 'A');
  assert.equal(await __test.verifySession(altered, secret), null);
  assert.equal(await __test.verifySession(good, 'wrong-secret'), null);
});

test('book IDs, metadata, and progress are normalized', () => {
  assert.equal(__test.bookIdFromPath('/v1/books/abc-123/file'), 'abc-123');
  assert.equal(__test.bookIdFromPath('/v1/books/../file'), '');
  assert.equal(__test.bookIdFromPath('/v1/books/a%2Fb/file'), '');
  assert.equal(__test.progressValue(2), 1);
  assert.equal(__test.progressValue(-1), 0);
  assert.deepEqual(__test.cleanMetadata({ id: 'x', type: 'epub', name: 'book.epub', size: 20, content: 'omit', _cache: true }, 'x'), { id: 'x', type: 'epub', name: 'book.epub', size: 20 });
  assert.equal(__test.cleanMetadata({ id: 'x', type: 'exe', name: 'book.exe', size: 20 }, 'x'), null);
});

test('health check and CORS are available without exposing storage', async () => {
  const env = testEnv();
  const response = await worker.fetch(new Request('https://reader-sync.test/healthz', { headers: { origin: 'https://oneboxy.github.io' } }), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'https://oneboxy.github.io');
  assert.deepEqual(await response.json(), { ok: true, service: 'onebox-reader-sync' });
});

test('session endpoint validates the existing GitHub token and returns a short-lived private session', async () => {
  const env = testEnv();
  const originalFetch = globalThis.fetch;
  let forwardedAuthorization = '';
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'https://api.github.com/user');
    forwardedAuthorization = options.headers.authorization;
    return Response.json({ id: 4321, login: 'onebox-reader' });
  };
  try {
    const request = new Request('https://reader-sync.test/v1/session', { method: 'POST', headers: { authorization: 'Bearer github-test-token', origin: 'https://oneboxy.github.io' } });
    const response = await worker.fetch(request, env);
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(forwardedAuthorization, 'Bearer github-test-token');
    assert.equal((await __test.verifySession(result.token, secret))?.sub, '4321');
    assert.ok(result.expiresAt > Math.floor(Date.now() / 1000));
    assert.equal(env.DB.rows.size, 0);
  } finally { globalThis.fetch = originalFetch; }
});

test('unauthenticated callers cannot list or write private books', async () => {
  const env = testEnv();
  const response = await worker.fetch(apiRequest('/v1/library'), env);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: 'session_invalid' });
});

test('book metadata, binary upload, download, progress, and delete stay user-scoped', async () => {
  const env = testEnv();
  const token = await sessionToken('1234');
  const otherToken = await sessionToken('5678');
  const bytes = new TextEncoder().encode('chapter one');
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  const metadata = { id: 'book-1', name: 'book.txt', type: 'txt', size: bytes.byteLength, updatedAt: 100, progressUpdatedAt: 110, progress: 0.25 };

  let response = await worker.fetch(apiRequest('/v1/library', token, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ books: [{ id: metadata.id, metadata, progress: metadata.progress, progressUpdatedAt: metadata.progressUpdatedAt, updatedAt: metadata.updatedAt }] }) }), env);
  assert.equal(response.status, 200);
  response = await worker.fetch(apiRequest('/v1/library', token, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ books: [{ id: metadata.id, metadata: { ...metadata, progress: 0.05 }, progress: 0.05, progressUpdatedAt: 90, updatedAt: 100 }] }) }), env);
  assert.equal(response.status, 200);
  response = await worker.fetch(apiRequest('/v1/books/book-1/file', token, { method: 'PUT', headers: { 'content-type': 'text/plain', 'content-length': String(bytes.byteLength), 'x-content-sha256': hash }, body: bytes }), env);
  assert.equal(response.status, 200);

  response = await worker.fetch(apiRequest('/v1/library', token), env);
  const ownLibrary = await response.json();
  assert.equal(ownLibrary.books[0].progress, 0.25);
  assert.equal(ownLibrary.books[0].file.sha256, hash);

  response = await worker.fetch(apiRequest('/v1/library', otherToken), env);
  assert.deepEqual(await response.json(), { books: [], deleted: [] });
  response = await worker.fetch(apiRequest('/v1/books/book-1/file', otherToken), env);
  assert.equal(response.status, 404);

  response = await worker.fetch(apiRequest('/v1/books/book-1/file', token), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-sha256'), hash);
  assert.deepEqual(new Uint8Array(await response.arrayBuffer()), bytes);

  response = await worker.fetch(apiRequest('/v1/books/book-1', token, { method: 'DELETE' }), env);
  assert.equal(response.status, 200);
  assert.equal(env.BOOKS_BUCKET.files.size, 0);
  response = await worker.fetch(apiRequest('/v1/library', token), env);
  const deletedLibrary = await response.json();
  assert.deepEqual(deletedLibrary.books, []);
  assert.deepEqual(deletedLibrary.deleted.map((item) => item.id), ['book-1']);
  response = await worker.fetch(apiRequest('/v1/library', token, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ books: [{ id: 'book-1', metadata, progress: 0, progressUpdatedAt: 0, updatedAt: 200 }] }) }), env);
  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: 'book_deleted', bookId: 'book-1' });
});

test('rejects bad metadata and mismatched or oversized source files', async () => {
  const env = testEnv();
  const token = await sessionToken();
  let response = await worker.fetch(apiRequest('/v1/library', token, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ books: [{ id: 'bad', metadata: { id: 'bad', name: 'bad.exe', type: 'exe', size: 1 } }] }) }), env);
  assert.equal(response.status, 400);
  response = await worker.fetch(apiRequest('/v1/library', token, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ books: [{ id: 'book-1', metadata: { id: 'book-1', name: 'book.txt', type: 'txt', size: 1 } }] }) }), env);
  assert.equal(response.status, 200);
  const bytes = new Uint8Array([1, 2]);
  response = await worker.fetch(apiRequest('/v1/books/book-1/file', token, { method: 'PUT', headers: { 'content-length': '2', 'x-content-sha256': '0'.repeat(64) }, body: bytes }), env);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'file_size_mismatch' });
  assert.equal(__test.MAX_BOOK_BYTES, 64 * 1024 * 1024);
});
