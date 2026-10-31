const APP_ORIGIN = 'https://oneboxy.github.io';
const APP_PATH = '/onebox/';
const GITHUB_AUTHORIZE = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';
const GITHUB_USER = 'https://api.github.com/user';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=UTF-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': APP_ORIGIN,
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      vary: 'Origin',
    },
  });
}

function getCookie(header, name) {
  if (!header) return '';
  const item = header.split(';').map((value) => value.trim()).find((value) => value.startsWith(name + '='));
  if (!item) return '';
  try { return decodeURIComponent(item.slice(name.length + 1)); }
  catch { return item.slice(name.length + 1); }
}

function redirectToApp(params) {
  const target = new URL(APP_PATH, APP_ORIGIN);
  target.hash = 'github-callback?' + new URLSearchParams(params).toString();
  return target.toString();
}

function redirectResponse(params, clearState = false) {
  const headers = new Headers({ location: redirectToApp(params), 'cache-control': 'no-store' });
  if (clearState) headers.set('set-cookie', 'oauth_state=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax');
  return new Response(null, { status: 302, headers });
}

async function readJson(response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; }
  catch { return {}; }
}

async function handleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  const savedState = getCookie(request.headers.get('cookie'), 'oauth_state');
  if (!code) return redirectResponse({ error: 'missing_code' });
  if (!state || !savedState || state !== savedState) return redirectResponse({ error: 'invalid_state' }, true);
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return redirectResponse({ error: 'missing_worker_secret' }, true);

  const tokenResponse = await fetch(GITHUB_TOKEN, {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: new URL('/auth/callback', request.url).toString(),
    }),
  });
  const token = await readJson(tokenResponse);
  if (!tokenResponse.ok || !token.access_token) return redirectResponse({ error: token.error || 'github_token_exchange_failed' }, true);

  const userResponse = await fetch(GITHUB_USER, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: 'Bearer ' + token.access_token,
      'user-agent': 'OneBox-GitHub-OAuth',
    },
  });
  const user = await readJson(userResponse);
  if (!userResponse.ok || !user.login) return redirectResponse({ error: 'github_user_failed' }, true);

  const callback = {
    access_token: token.access_token,
    token_type: token.token_type || 'bearer',
    login: user.login,
  };
  if (token.refresh_token) callback.refresh_token = token.refresh_token;
  if (Number(token.expires_in) > 0) callback.expires_in = String(token.expires_in);
  if (Number(token.refresh_token_expires_in) > 0) callback.refresh_token_expires_in = String(token.refresh_token_expires_in);
  const headers = new Headers({
    location: redirectToApp(callback),
    'cache-control': 'no-store',
    'set-cookie': 'oauth_state=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax',
  });
  return new Response(null, { status: 302, headers });
}

async function handleRefresh(request, env) {
  if (request.headers.get('origin') !== APP_ORIGIN) return json({ ok: false, error: 'origin_not_allowed' }, 403);
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return json({ ok: false, error: 'missing_worker_secret' }, 503);
  const length = Number(request.headers.get('content-length')) || 0;
  if (length > 4096) return json({ ok: false, error: 'request_too_large' }, 413);
  let body = {};
  try { body = await request.json(); }
  catch { return json({ ok: false, error: 'invalid_request' }, 400); }
  const refreshToken = String(body?.refresh_token || '').trim();
  if (!refreshToken || refreshToken.length > 2048) return json({ ok: false, error: 'invalid_request' }, 400);

  let response;
  try {
    response = await fetch(GITHUB_TOKEN, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });
  } catch {
    return json({ ok: false, error: 'github_refresh_unavailable' }, 502);
  }
  const token = await readJson(response);
  if (!response.ok || !token.access_token) {
    const invalidGrant = token.error === 'invalid_grant';
    return json({ ok: false, error: invalidGrant ? 'invalid_grant' : 'github_refresh_failed' }, invalidGrant ? 401 : 502);
  }
  return json({
    ok: true,
    access_token: token.access_token,
    token_type: token.token_type || 'bearer',
    expires_in: Number(token.expires_in) || 0,
    refresh_token: token.refresh_token || refreshToken,
    refresh_token_expires_in: Number(token.refresh_token_expires_in) || 0,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') {
      if (request.headers.get('origin') !== APP_ORIGIN) return json({ ok: false, error: 'origin_not_allowed' }, 403);
      return json({ ok: true });
    }
    if (url.pathname === '/health' && request.method === 'GET') return json({ ok: true, service: 'onebox-github-oauth' });
    if (url.pathname === '/auth/config' && request.method === 'GET') return json({ ok: true, client_id: env.GITHUB_CLIENT_ID || '' });
    if (url.pathname === '/auth/login' && request.method === 'GET') {
      const state = crypto.randomUUID();
      const target = new URL(GITHUB_AUTHORIZE);
      target.search = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID || '',
        redirect_uri: new URL('/auth/callback', request.url).toString(),
        scope: 'gist read:user',
        state,
      }).toString();
      return new Response(null, {
        status: 302,
        headers: {
          location: target.toString(),
          'cache-control': 'no-store',
          'set-cookie': 'oauth_state=' + encodeURIComponent(state) + '; Max-Age=600; Path=/; HttpOnly; Secure; SameSite=Lax',
        },
      });
    }
    if (url.pathname === '/auth/callback' && request.method === 'GET') {
      try { return await handleCallback(request, env); }
      catch { return redirectResponse({ error: 'oauth_callback_failed' }, true); }
    }
    if (url.pathname === '/auth/refresh' && request.method === 'POST') return handleRefresh(request, env);
    return json({ ok: false, error: 'not_found' }, 404);
  },
};
