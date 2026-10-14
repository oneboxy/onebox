(() => {
  'use strict';

  const API = String(window.ONEBOX_READER_SYNC_API || '').replace(/\/+$/, '');
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escape = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const state = { session: '', github: null, admin: null, permissions: [], page: 'overview', kind: 'ads', modules: {}, user: null, userData: [], userFiles: [], userOffset: 0, editingContent: null };
  const pages = { overview: '总览', users: '用户管理', content: '广告与公告', modules: '模块管理', admins: '管理员', recycle: '数据回收站', audit: '审计记录' };
  const roles = { super_admin: '超级管理员', user_admin: '用户管理员', personal_data_admin: '个人数据管理员', content_operator: '内容运营', read_only_auditor: '只读审计' };
  const modules = { home: '首页消息', navigation: '导航', reading: '阅读', calendar: '日历', weather: '天气', calculator: '计算器', conversion: '转换', translation: '翻译', messages: '消息', 'ticket-wallet': '卡包', settings: '设置', developer: '开发工具' };
  const dataKeys = {
    'onebox.theme': '主题', 'onebox.language': '语言', 'onebox.layout': '布局', 'onebox.color': '配色', 'onebox.color-explicit': '自定义配色', 'onebox.top-display': '顶部显示', 'onebox.footprint': '使用足迹', 'onebox.open-mode': '打开方式', 'onebox.mascot-position': '宠物位置', 'onebox.mascot-visible': '宠物显示', 'onebox.mascot-display-mode': '宠物样式', 'onebox.pet-profile': '宠物档案', 'onebox.tool-order': '工具顺序', 'onebox.navigation': '导航收藏', 'onebox.navigation-location': '导航位置', 'onebox.home-feed-order': '首页来源顺序', 'onebox.home-feed-visibility': '首页来源显示', 'onebox.home-feed-read': '首页阅读标记', 'onebox.reader-progress': '阅读进度', 'onebox.reader-preferences': '阅读设置', 'onebox.reader-layout': '书架布局', 'onebox.library': '阅读书架', 'onebox.notifications': '站内消息', 'onebox.notification-preference': '消息设置', 'onebox.events': '日程', 'onebox.weather-cards': '天气卡片', 'onebox.weather': '旧版天气数据', 'onebox.translation-history': '翻译记录', 'onebox.translation-history-open': '翻译记录显示', 'onebox.calculator': '计算器状态', 'onebox.dev-tools': '开发工具状态', 'onebox.ticket-wallet': '卡包票据', 'onebox.ticket-wallet-display-order': '卡包顺序', 'onebox.ticket-wallet-type-filter': '卡包筛选', 'onebox.ticket-wallet-memories': '卡包回忆', 'onebox.ticket-wallet-deleted': '卡包删除记录'
  };
  const rolePermissionMap = {
    super_admin: ['*'], user_admin: ['users.read', 'users.manage', 'stats.read'],
    personal_data_admin: ['users.read', 'data.read', 'data.edit'], content_operator: ['content.manage', 'modules.manage', 'stats.read'],
    read_only_auditor: ['audit.read', 'stats.read']
  };
  let toastTimer = 0;
  let githubToken = '';

  function toast(message, error = false) {
    const node = $('#toast');
    node.textContent = message;
    node.style.background = error ? '#9f3242' : '';
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2800);
  }

  function formatTime(value) {
    const number = Number(value);
    if (!number) return '—';
    return new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', year: 'numeric' }).format(new Date(number));
  }

  function formatSize(value) {
    const size = Number(value) || 0;
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
    return (size / 1024 / 1024).toFixed(1) + ' MB';
  }

  function statusLabel(value) { return ({ active: '正常', suspended: '已停用', deleted: '回收站中', purged: '已清除', draft: '草稿', scheduled: '待投放', published: '投放中', paused: '已暂停' })[value] || value || '—'; }
  function statusPill(value) { return '<span class="status-pill ' + escape(value) + '">' + escape(statusLabel(value)) + '</span>'; }
  function has(permission) { return state.permissions.includes('*') || state.permissions.includes(permission); }

  function readLocalGithub() {
    try {
      const value = JSON.parse(localStorage.getItem('onebox.github') || '{}');
      if (value.token) { state.github = value.user || null; return value.token; }
    } catch {}
    return '';
  }

  function readGithubFromIndexedDb() {
    if (!window.indexedDB) return Promise.resolve('');
    return new Promise((resolve) => {
      let request;
      try { request = indexedDB.open('onebox-local-data'); } catch { resolve(''); return; }
      request.onerror = () => resolve('');
      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('snapshot')) { db.close(); resolve(''); return; }
        const get = db.transaction('snapshot', 'readonly').objectStore('snapshot').get('github-auth');
        get.onsuccess = () => {
          try { const value = JSON.parse(get.result?.value || '{}'); state.github = value.user || state.github; resolve(value.token || ''); }
          catch { resolve(''); }
          db.close();
        };
        get.onerror = () => { db.close(); resolve(''); };
      };
      request.onupgradeneeded = () => { request.transaction.abort(); };
    });
  }

  async function findGithubToken() {
    const direct = readLocalGithub();
    return direct || await readGithubFromIndexedDb();
  }

  async function newSession() {
    if (!githubToken) githubToken = await findGithubToken();
    if (!githubToken) throw Error('请先在 OneBox 前台连接 GitHub，再返回后台。');
    const response = await fetch(API + '/v1/session', { method: 'POST', headers: { authorization: 'Bearer ' + githubToken, accept: 'application/json' }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.token) throw Error(data.error === 'service_not_configured' ? '云端服务还未配置完成。' : 'GitHub 登录状态无效，请重新连接。');
    state.session = data.token;
    state.github = data.user || state.github;
  }

  async function api(path, options = {}, retried = false) {
    if (!API) throw Error('当前没有集中式后台服务。');
    if (!state.session) await newSession();
    const response = await fetch(API + path, { ...options, headers: { accept: 'application/json', ...(options.body && !(options.body instanceof Blob) ? { 'content-type': 'application/json' } : {}), ...(options.headers || {}), authorization: 'Bearer ' + state.session }, cache: 'no-store' });
    if (response.status === 401 && !retried) { state.session = ''; return api(path, options, true); }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(Error(payload.error || ('HTTP ' + response.status)), { status: response.status });
    return payload;
  }

  async function apiBlob(path, retried = false) {
    if (!state.session) await newSession();
    const response = await fetch(API + path, { headers: { authorization: 'Bearer ' + state.session }, cache: 'no-store' });
    if (response.status === 401 && !retried) { state.session = ''; return apiBlob(path, true); }
    if (!response.ok) { const payload = await response.json().catch(() => ({})); throw Error(payload.error || '附件下载失败'); }
    return response.blob();
  }

  function setOnline() {
    const online = navigator.onLine;
    $('#connectionLabel').textContent = online ? '在线' : '离线';
    $('#connectionLabel').previousElementSibling.classList.toggle('online', online);
    if (!online) {
      $('#appContent').hidden = true;
      $('#apiPanel').hidden = false;
      $('#apiPanel').innerHTML = '<strong>当前离线</strong><br>个人数据不会保存在后台离线缓存中。联网后重新打开后台。';
      $('#loginPanel').hidden = true;
    }
  }

  function showSetupError(message) {
    $('#apiPanel').hidden = false;
    $('#apiPanel').innerHTML = '<strong>Cloudflare 后台服务暂不可用</strong><br>' + escape(message) + '<br><small>完成 Worker 部署并在 reader-sync-config.js 配置 Worker 地址后，可使用 D1 管理账号数据、使用 R2 保存卡包图片。书籍原件和封面仍保存在用户自己的 GitHub Gist。</small>';
    $('#loginPanel').hidden = true;
    $('#appContent').hidden = true;
  }

  function showLogin(message = '') {
    $('#loginPanel').hidden = false;
    $('#appContent').hidden = true;
    $('#permissionPanel').hidden = true;
    if (message) $('#loginMessage').textContent = message;
  }

  function showDenied(message) {
    $('#loginPanel').hidden = true;
    $('#appContent').hidden = true;
    $('#permissionPanel').hidden = false;
    $('#permissionPanel').textContent = message;
  }

  function updateVisiblePages() {
    const rules = { users: 'users.read', content: 'content.manage', modules: 'modules.manage', admins: 'super_admin', recycle: 'data.read', audit: 'audit.read' };
    $$('[data-page]').forEach((button) => {
      const key = button.dataset.page, required = rules[key];
      button.hidden = required === 'super_admin' ? state.admin?.role !== 'super_admin' : required ? !has(required) : false;
    });
    if (state.page !== 'overview' && $(`[data-page="${state.page}"]`)?.hidden) selectPage('overview');
  }

  async function boot() {
    setOnline();
    window.addEventListener('online', () => { setOnline(); window.location.reload(); }, { once: true });
    window.addEventListener('offline', setOnline);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
    if (!navigator.onLine) return;
    if (!API) return showSetupError('Worker 地址为空。部署 Cloudflare Worker 后，把 workers.dev 地址写入 reader-sync-config.js。');
    try {
      const me = await api('/v1/admin/me');
      state.admin = me.admin;
      state.permissions = me.permissions || rolePermissionMap[me.admin?.role] || [];
      $('#loginPanel').hidden = true;
      $('#apiPanel').hidden = true;
      $('#permissionPanel').hidden = true;
      $('#appContent').hidden = false;
      $('#accountButton').hidden = false;
      $('#accountButton').textContent = state.admin.login + ' · ' + (roles[state.admin.role] || state.admin.role);
      $('#connectionLabel').textContent = '已授权';
      $('#connectionLabel').previousElementSibling.classList.add('online');
      updateVisiblePages();
      await loadPage('overview');
    } catch (error) {
      if (error.status === 403) return showDenied(error.message === 'admin_access_required' ? '此 GitHub 账号没有管理员权限。请让超级管理员按你的 GitHub 数字 ID 授权。' : '当前角色没有访问该管理功能的权限。');
      showLogin(error.message || '请先在 OneBox 前台连接 GitHub。');
    }
  }

  function selectPage(page) {
    if (!pages[page]) return;
    state.page = page;
    $$('[data-page]').forEach((button) => button.classList.toggle('active', button.dataset.page === page));
    $$('.page-section').forEach((section) => section.classList.toggle('active', section.dataset.section === page));
    $('#pageTitle').textContent = pages[page];
    if (!$('#appContent').hidden) void loadPage(page);
  }

  async function loadPage(page) {
    try {
      if (page === 'overview') await loadOverview();
      if (page === 'users') await loadUsers();
      if (page === 'content') await loadContent();
      if (page === 'modules') await loadModules();
      if (page === 'admins') await loadAdmins();
      if (page === 'recycle') await loadRecycle();
      if (page === 'audit') await loadAudit();
    } catch (error) { toast(error.message || '加载失败', true); }
  }

  async function loadOverview() {
    let summary = {};
    if (has('stats.read') || has('*')) summary = await api('/v1/admin/summary');
    $('#statsGrid').innerHTML = [
      ['云端用户', summary.users || 0, '已开通 OneBox 云端账号'], ['已迁移', summary.migratedUsers || 0, '完成用户授权迁移'],
      ['正常账号', summary.activeUsers || 0, '当前可访问云端数据'], ['运营内容', (summary.liveAds || 0) + (summary.liveAnnouncements || 0), '正在投放的广告与公告']
    ].map(([label, number, hint]) => '<article class="stat-card"><span>' + label + '</span><strong>' + Number(number).toLocaleString('zh-CN') + '</strong><small>' + hint + '</small></article>').join('');
    if (has('audit.read') || has('*')) {
      const result = await api('/v1/admin/audit?limit=8');
      $('#recentAudit').innerHTML = auditMarkup(result.items || []);
    } else $('#recentAudit').innerHTML = '<div class="empty-state">当前角色没有查看审计记录的权限</div>';
  }

  async function loadUsers(reset = false) {
    if (reset) state.userOffset = 0;
    const query = new URLSearchParams({ q: $('#userSearch').value.trim(), status: $('#userStatus').value, limit: '100', offset: String(state.userOffset) });
    const result = await api('/v1/admin/users?' + query.toString());
    const users = result.users || [];
    if (!users.length && state.userOffset > 0) { state.userOffset = Math.max(0, state.userOffset - 100); return loadUsers(); }
    $('#userCount').textContent = '第 ' + (Math.floor(state.userOffset / 100) + 1) + ' 页 · ' + users.length + ' 位用户';
    const pagination = '<div class="pagination-controls"><button class="button subtle" data-user-page="previous" ' + (state.userOffset ? '' : 'disabled') + '>上一页</button><button class="button subtle" data-user-page="next" ' + (users.length === 100 ? '' : 'disabled') + '>下一页</button></div>';
    $('#userTable').innerHTML = userTableMarkup(users) + pagination;
  }

  function userTableMarkup(users) {
    if (!users.length) return '<div class="empty-state">暂无匹配的云端用户</div>';
    return '<table class="data-table"><thead><tr><th>用户</th><th>状态</th><th>数据</th><th>最后活跃</th><th>操作</th></tr></thead><tbody>' + users.map((user) => '<tr><td><div class="user-cell">' + (user.avatarUrl ? '<img src="' + escape(user.avatarUrl) + '" alt="">' : '<span class="avatar-fallback">' + escape((user.login || '?').slice(0, 1).toUpperCase()) + '</span>') + '<span><strong>' + escape(user.login || 'GitHub 用户') + '</strong><small>ID ' + escape(user.id) + (user.migratedAt ? ' · 已迁移' : ' · 未迁移') + '</small></span></div></td><td>' + statusPill(user.status) + '</td><td>' + Number(user.dataCount || 0) + ' 项</td><td>' + formatTime(user.lastSeenAt) + '</td><td><div class="row-actions"><button class="text-button" data-user-open="' + escape(user.id) + '">详情</button>' + (has('users.manage') && ['active','suspended'].includes(user.status) ? '<button class="text-button" data-user-status="' + escape(user.id) + '" data-status="' + (user.status === 'suspended' ? 'active' : 'suspended') + '">' + (user.status === 'suspended' ? '恢复' : '停用') + '</button>' : '') + (has('data.delete') && ['active','suspended'].includes(user.status) ? '<button class="text-button danger" data-user-delete="' + escape(user.id) + '">删除</button>' : '') + '</div></td></tr>').join('') + '</tbody></table>';
  }

  async function openUser(userId) {
    const [detail, data] = await Promise.all([api('/v1/admin/users/' + encodeURIComponent(userId)), has('data.read') ? api('/v1/admin/users/' + encodeURIComponent(userId) + '/data') : Promise.resolve({ data: [], files: [] })]);
    state.user = detail.user;
    state.userData = data.data || [];
    state.userFiles = data.files || [];
    const user = state.user;
    $('#dialogContent').innerHTML = '<div class="dialog-heading"><h2>' + escape(user.login || 'GitHub 用户') + '</h2><p>ID ' + escape(user.id) + ' · ' + statusLabel(user.status) + ' · 最近活跃 ' + formatTime(user.lastSeenAt) + '</p></div><div class="content-meta"><span>创建 ' + formatTime(user.createdAt) + '</span><span>迁移 ' + (user.migratedAt ? formatTime(user.migratedAt) : '未迁移') + '</span><span>' + user.fileCount + ' 个附件 · ' + formatSize(user.fileBytes) + '</span></div>' + (has('data.read') ? '<div class="dialog-heading" style="margin-top:22px"><h2>个人数据</h2><p>按业务模块查看，修改与删除会写入审计记录</p></div><div class="data-items">' + userDataMarkup(state.userData) + '</div>' : '<div class="notice" style="margin-top:18px">当前角色只管理账号信息，不能查看个人内容。</div>') + '<div class="dialog-actions">' + (has('data.export') ? '<button class="button" data-user-export="' + escape(user.id) + '">完整导出</button>' : '') + '</div>';
    showDialog();
  }

  function userDataMarkup(items) {
    if (!items.length && !state.userFiles.length) return '<div class="empty-state">用户尚未迁移数据</div>';
    const rows = items.map((item) => '<div class="data-item"><div><strong>' + escape(dataKeys[item.key] || item.key) + '</strong><small>' + escape(item.module || '其他') + ' · 更新 ' + formatTime(item.updatedAt) + ' · ' + formatSize(new Blob([JSON.stringify(item.value)]).size) + '</small></div><button class="text-button" data-data-view="' + escape(item.key) + '">查看</button>' + (has('data.edit') ? '<button class="text-button" data-data-edit="' + escape(item.key) + '">编辑</button>' : '') + (has('data.delete') ? '<button class="text-button danger" data-data-delete="' + escape(item.key) + '">删除</button>' : '') + '</div>').join('');
    const files = state.userFiles.map((file) => '<div class="data-item"><div><strong>附件 · ' + escape(file.name || file.id) + '</strong><small>' + escape(file.key || '个人附件') + ' · ' + formatSize(file.size) + ' · ' + formatTime(file.createdAt) + '</small></div><button class="text-button" data-file-view="' + escape(file.id) + '">查看</button>' + (has('data.delete') ? '<button class="text-button danger" data-file-delete="' + escape(file.id) + '">删除</button>' : '') + '</div>').join('');
    return rows + files;
  }

  function openDataEditor(key, edit) {
    const item = state.userData.find((entry) => entry.key === key);
    if (!item) return;
    $('#dialogContent').innerHTML = '<div class="dialog-heading"><h2>' + (edit ? '编辑数据' : '查看数据') + ' · ' + escape(dataKeys[key] || key) + '</h2><p>数据键：' + escape(key) + '</p></div><textarea class="json-editor" id="jsonEditor" ' + (edit ? '' : 'readonly') + ' spellcheck="false">' + escape(JSON.stringify(item.value, null, 2)) + '</textarea><div class="dialog-actions"><button class="button" data-user-back="' + escape(state.user.id) + '">返回用户</button>' + (edit ? '<button class="button primary" data-data-save="' + escape(key) + '">保存</button>' : '') + '</div>';
  }

  async function saveData(key) {
    let value;
    try { value = JSON.parse($('#jsonEditor').value); } catch { return toast('JSON 格式无效', true); }
    await api('/v1/admin/users/' + encodeURIComponent(state.user.id) + '/data/' + encodeURIComponent(key), { method: 'PUT', body: JSON.stringify({ value }) });
    toast('已保存并记录审计');
    await openUser(state.user.id);
  }

  async function deleteUserData(key) {
    if (!confirm('删除此数据项？它会进入 30 天回收站。')) return;
    await api('/v1/admin/users/' + encodeURIComponent(state.user.id) + '/data/' + encodeURIComponent(key), { method: 'DELETE' });
    toast('已移入回收站');
    await openUser(state.user.id);
  }

  async function deleteUser(userId) {
    if (!confirm('删除该用户的全部云端数据？数据会进入 30 天回收站，之后自动永久清除。')) return;
    await api('/v1/admin/users/' + encodeURIComponent(userId), { method: 'DELETE' });
    closeDialog(); toast('用户数据已移入回收站'); await loadUsers();
  }

  async function setUserStatus(userId, status) {
    await api('/v1/admin/users/' + encodeURIComponent(userId), { method: 'PUT', body: JSON.stringify({ status }) });
    toast(status === 'active' ? '账号已恢复' : '账号已停用');
    await loadUsers();
  }

  async function viewUserFile(fileId) {
    const blob = await apiBlob('/v1/admin/users/' + encodeURIComponent(state.user.id) + '/files/' + encodeURIComponent(fileId));
    const url = URL.createObjectURL(blob); window.open(url, '_blank', 'noopener'); window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  async function deleteUserFile(fileId) {
    if (!confirm('删除该附件？它会保留在回收站 30 天。')) return;
    await api('/v1/admin/users/' + encodeURIComponent(state.user.id) + '/files/' + encodeURIComponent(fileId), { method: 'DELETE' });
    toast('附件已移入回收站'); await openUser(state.user.id);
  }

  function crc32(bytes) {
    let crc = -1;
    for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320); }
    return (crc ^ -1) >>> 0;
  }

  function dosDateTime() {
    const now = new Date();
    return { time: (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2), date: ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate() };
  }

  async function zipStore(files) {
    const encoder = new TextEncoder(), locals = [], centrals = [];
    let offset = 0;
    const stamp = dosDateTime();
    for (const entry of files) {
      const name = encoder.encode(entry.name), data = entry.blob instanceof Uint8Array ? entry.blob : new Uint8Array(await entry.blob.arrayBuffer()), crc = crc32(data);
      const local = new Uint8Array(30 + name.length), ld = new DataView(local.buffer);
      ld.setUint32(0, 0x04034b50, true); ld.setUint16(4, 20, true); ld.setUint16(6, 0x0800, true); ld.setUint16(8, 0, true); ld.setUint16(10, stamp.time, true); ld.setUint16(12, stamp.date, true); ld.setUint32(14, crc, true); ld.setUint32(18, data.length, true); ld.setUint32(22, data.length, true); ld.setUint16(26, name.length, true); ld.setUint16(28, 0, true); local.set(name, 30);
      const central = new Uint8Array(46 + name.length), cd = new DataView(central.buffer);
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true); cd.setUint16(12, stamp.time, true); cd.setUint16(14, stamp.date, true); cd.setUint32(16, crc, true); cd.setUint32(20, data.length, true); cd.setUint32(24, data.length, true); cd.setUint16(28, name.length, true); cd.setUint16(30, 0, true); cd.setUint16(32, 0, true); cd.setUint16(34, 0, true); cd.setUint16(36, 0, true); cd.setUint32(38, 0, true); cd.setUint32(42, offset, true); central.set(name, 46);
      locals.push(local, data); centrals.push(central); offset += local.length + data.length;
    }
    const centralBytes = centrals.reduce((sum, bytes) => sum + bytes.length, 0), end = new Uint8Array(22), view = new DataView(end.buffer);
    view.setUint32(0, 0x06054b50, true); view.setUint16(4, 0, true); view.setUint16(6, 0, true); view.setUint16(8, files.length, true); view.setUint16(10, files.length, true); view.setUint32(12, centralBytes, true); view.setUint32(16, offset, true); view.setUint16(20, 0, true);
    return new Blob([...locals, ...centrals, end], { type: 'application/zip' });
  }

  async function exportUser(userId) {
    const button = $(`[data-user-export="${CSS.escape(userId)}"]`); if (button) { button.disabled = true; button.textContent = '正在导出…'; }
    try {
      const exported = await api('/v1/admin/users/' + encodeURIComponent(userId) + '/export');
      const entries = [{ name: 'onebox-data.json', blob: new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' }) }];
      for (const file of exported.files || []) {
        const blob = await apiBlob('/v1/admin/users/' + encodeURIComponent(userId) + '/files/' + encodeURIComponent(file.id));
        const clean = String(file.name || file.id).replace(/[\\/:*?"<>|]/g, '_').slice(0, 180);
        entries.push({ name: 'attachments/' + encodeURIComponent(file.id) + '-' + clean, blob });
      }
      const zip = await zipStore(entries), link = document.createElement('a');
      link.href = URL.createObjectURL(zip); link.download = 'onebox-user-' + userId + '-export.zip'; link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 30000);
      toast('完整数据包已生成');
    } catch (error) { toast(error.message || '导出失败', true); }
    finally { if (button) { button.disabled = false; button.textContent = '完整导出'; } }
  }

  const adPlacements = [['home-top', '首页顶部'], ['home-feed', '首页消息流'], ['tools-top', '工具页面顶部'], ['weather-top', '天气页面'], ['calendar-top', '日历页面'], ['ticket-wallet-top', '卡包页面']];
  async function loadContent() {
    const kind = state.kind;
    $('#contentHeading').textContent = kind === 'ads' ? '广告投放' : '公告管理';
    $('#addContent').hidden = !has('content.manage');
    const result = await api('/v1/admin/content?kind=' + kind);
    window.__adminContent = result.items || [];
    $('#contentList').innerHTML = window.__adminContent.length ? window.__adminContent.map((item) => '<article class="content-row"><div class="content-main"><strong>' + escape(item.title) + '</strong><p>' + escape(item.body) + '</p><div class="content-meta"><span>' + escape(kind === 'ads' ? placementName(item.placement) : audienceName(item.audience, item.targetUsers)) + '</span><span>' + escape(statusLabel(item.status)) + '</span><span>' + formatTime(item.startsAt) + ' – ' + formatTime(item.endsAt) + '</span></div></div><div class="row-actions"><button class="text-button" data-content-edit="' + escape(item.id) + '">编辑</button><button class="text-button danger" data-content-pause="' + escape(item.id) + '">暂停</button></div></article>').join('') : '<div class="empty-state">还没有' + (kind === 'ads' ? '广告' : '公告') + '，可以从这里新建。</div>';
  }

  function placementName(value) { return (Object.fromEntries(adPlacements))[value] || value || '未设置位置'; }
  function audienceName(value, users) { return value === 'selected' ? '指定用户 · ' + (users || []).length + ' 位' : '全体用户'; }

  function toDateInput(value) {
    if (!value) return '';
    const date = new Date(Number(value) || value); if (Number.isNaN(date.getTime())) return '';
    const pad = (number) => String(number).padStart(2, '0');
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  }

  function editContent(item = null) {
    state.editingContent = item;
    const kind = state.kind, isAd = kind === 'ads', current = item || {};
    const placement = isAd ? '<label class="field">页面位置<select name="placement">' + adPlacements.map(([value, label]) => '<option value="' + value + '" ' + (current.placement === value ? 'selected' : '') + '>' + label + '</option>').join('') + '</select></label>' : '<label class="field">显示位置<select name="placement">' + [['message-center','消息中心'],['banner','页内横幅'],['modal','弹窗']].map(([value,label]) => '<option value="' + value + '" ' + ((current.placement || 'message-center') === value ? 'selected' : '') + '>' + label + '</option>').join('') + '</select></label>';
    const audience = !isAd ? '<label class="field">发送对象<select name="audience"><option value="all" ' + (current.audience !== 'selected' ? 'selected' : '') + '>全体用户</option><option value="selected" ' + (current.audience === 'selected' ? 'selected' : '') + '>指定用户</option></select></label><label class="field wide target-field" ' + (current.audience === 'selected' ? '' : 'hidden') + '>指定用户 GitHub ID<input name="targetUsers" placeholder="多个 ID 用逗号分隔" value="' + escape((current.targetUsers || []).join(', ')) + '"><small class="target-users-hint">只会发送给填入 ID 的用户。</small></label>' : '';
    $('#dialogContent').innerHTML = '<div class="dialog-heading"><h2>' + (current.id ? '编辑' : '新建') + (isAd ? '广告' : '公告') + '</h2><p>投放时间按此设备本地时区解析；保存后服务端会校验内容。</p></div><form id="contentForm" class="content-editor"><label class="field wide">标题<input name="title" maxlength="160" required value="' + escape(current.title || '') + '"></label><label class="field wide">' + (isAd ? '广告文案' : '公告内容') + '<textarea name="body" maxlength="6000" required>' + escape(current.body || '') + '</textarea></label>' + placement + '<label class="field">状态<select name="status">' + [['draft','草稿'],['scheduled','待投放'],['published','立即投放'],['paused','暂停']].map(([value,label]) => '<option value="' + value + '" ' + ((current.status || 'draft') === value ? 'selected' : '') + '>' + label + '</option>').join('') + '</select></label>' + (isAd ? '<label class="field">素材图片 URL<input name="imageUrl" type="url" value="' + escape(current.imageUrl || '') + '" placeholder="https://"></label><label class="field">点击跳转 URL<input name="targetUrl" type="url" value="' + escape(current.targetUrl || '') + '" placeholder="https://"></label>' : audience) + '<label class="field">开始时间<input name="startsAt" type="datetime-local" value="' + escape(toDateInput(current.startsAt)) + '"></label><label class="field">结束时间<input name="endsAt" type="datetime-local" value="' + escape(toDateInput(current.endsAt)) + '"></label><div class="dialog-actions"><button class="button" type="button" data-dialog-close>取消</button><button class="button primary" type="submit">保存</button></div></form>';
    showDialog();
  }

  async function saveContent(form) {
    const fields = new FormData(form), parseDate = (name) => fields.get(name) ? new Date(fields.get(name)).getTime() : null;
    const item = { title: fields.get('title'), body: fields.get('body'), placement: fields.get('placement'), status: fields.get('status'), startsAt: parseDate('startsAt'), endsAt: parseDate('endsAt'), targetUrl: fields.get('targetUrl') || '', imageUrl: fields.get('imageUrl') || '', audience: fields.get('audience') || 'all', targetUsers: String(fields.get('targetUsers') || '').split(/[\s,;]+/).filter(Boolean) };
    if (state.editingContent?.id) await api('/v1/admin/content/' + state.kind + '/' + encodeURIComponent(state.editingContent.id), { method: 'PUT', body: JSON.stringify({ item }) });
    else await api('/v1/admin/content', { method: 'POST', body: JSON.stringify({ kind: state.kind, item }) });
    closeDialog(); toast('内容已保存'); await loadContent();
  }

  async function pauseContent(id) {
    if (!confirm('暂停这条内容？')) return;
    await api('/v1/admin/content/' + state.kind + '/' + encodeURIComponent(id), { method: 'DELETE' });
    toast('已暂停'); await loadContent();
  }

  async function loadModules() {
    const response = await api('/v1/admin/modules'); state.modules = response.modules || {};
    $('#moduleList').innerHTML = Object.entries(modules).map(([key, label]) => '<label class="module-row"><span><strong>' + label + '</strong><small>' + (state.modules[key] === false ? '全站下架，直达路由将被拦截' : '当前全站可用') + '</small></span><span class="switch"><input type="checkbox" data-module="' + key + '" ' + (state.modules[key] !== false ? 'checked' : '') + '><i></i></span></label>').join('');
  }

  async function saveModules() {
    const next = Object.fromEntries($$('[data-module]').map((input) => [input.dataset.module, input.checked]));
    await api('/v1/admin/modules', { method: 'PUT', body: JSON.stringify({ modules: next }) });
    state.modules = next; toast('模块状态已全站更新'); await loadModules();
  }

  async function loadAdmins() {
    if (state.admin?.role !== 'super_admin') return;
    const result = await api('/v1/admin/admins');
    $('#adminList').innerHTML = (result.admins || []).map((admin) => '<article class="admin-row"><div class="content-main"><strong>' + escape(admin.login || 'GitHub 用户') + ' · ID ' + escape(admin.id) + '</strong><p>' + (admin.grants?.export ? '允许导出' : '') + (admin.grants?.delete ? ' · 允许删除' : '') + (admin.bootstrap ? ' · 初始超级管理员' : '') + '</p></div><span class="role-tag">' + escape(roles[admin.role] || admin.role) + '</span>' + (!admin.bootstrap && admin.status === 'active' ? '<button class="text-button danger" data-admin-revoke="' + escape(admin.id) + '">撤销</button>' : statusPill(admin.status)) + '</article>').join('') || '<div class="empty-state">还没有管理员</div>';
  }

  async function inviteAdmin(form) {
    const fields = new FormData(form), role = fields.get('role');
    await api('/v1/admin/admins', { method: 'POST', body: JSON.stringify({ githubId: fields.get('githubId'), githubLogin: fields.get('githubLogin'), role, grants: { export: fields.has('grantExport'), delete: fields.has('grantDelete') } }) });
    form.reset(); toast('管理员权限已保存'); await loadAdmins();
  }

  async function revokeAdmin(id) {
    if (!confirm('撤销这个管理员的后台权限？')) return;
    await api('/v1/admin/admins/' + encodeURIComponent(id), { method: 'DELETE' }); toast('管理员权限已撤销'); await loadAdmins();
  }

  async function loadRecycle() {
    const result = await api('/v1/admin/recycle-bin');
    $('#recycleList').innerHTML = (result.items || []).map((item) => '<article class="recycle-row"><div class="content-main"><strong>' + escape(item.login || item.userId) + ' · ' + escape(item.key === '__account__' ? '账号' : item.key === '__file__' ? '附件' : (dataKeys[item.key] || item.key)) + '</strong><p>删除于 ' + formatTime(item.deletedAt) + ' · 清除于 ' + formatTime(item.purgeAt) + '</p></div><button class="button" data-restore="' + escape(item.id) + '" ' + (has('data.delete') ? '' : 'disabled') + '>恢复</button></article>').join('') || '<div class="empty-state">回收站为空</div>';
  }

  async function restoreItem(id) {
    if (!confirm('恢复这项数据？')) return;
    await api('/v1/admin/recycle-bin/' + encodeURIComponent(id) + '/restore', { method: 'POST', body: '{}' }); toast('已恢复'); await loadRecycle();
  }

  const actionLabels = { 'user_data.view': '查看用户数据', 'user_data.file_view': '查看用户附件', 'user_data.edit': '编辑用户数据', 'user_data.delete': '删除用户数据', 'user_data.export': '导出用户数据', 'user_data.restore': '恢复用户数据', 'user.delete': '删除用户', 'user.status_change': '修改用户状态', 'admin.invite_or_update': '邀请或更新管理员', 'admin.revoke': '撤销管理员', 'modules.update': '更新模块状态', 'ads.create': '创建广告', 'ads.update': '更新广告', 'ads.pause': '暂停广告', 'announcements.create': '创建公告', 'announcements.update': '更新公告', 'announcements.pause': '暂停公告', 'user_data.migration_start': '用户开始数据迁移', 'user_data.migration_complete': '用户完成数据迁移' };
  function auditMarkup(items) {
    if (!items.length) return '<div class="empty-state">暂无审计记录</div>';
    return items.map((item) => '<article class="audit-row"><span class="audit-time">' + formatTime(item.createdAt) + '</span><span class="audit-action"><strong>' + escape(actionLabels[item.action] || item.action) + '</strong><small>' + escape(item.actorLogin || item.actorId) + ' · ' + escape(JSON.stringify(item.metadata || {})) + '</small></span><span class="audit-target">' + escape(item.targetType || '') + ' ' + escape(item.targetId || '') + '</span></article>').join('');
  }

  async function loadAudit() {
    const result = await api('/v1/admin/audit?limit=100');
    $('#auditList').innerHTML = auditMarkup(result.items || []);
  }

  function showDialog() { const dialog = $('#adminDialog'); if (!dialog.open) dialog.showModal(); }
  function closeDialog() { const dialog = $('#adminDialog'); if (dialog.open) dialog.close(); }

  document.addEventListener('click', async (event) => {
    const page = event.target.closest('[data-page]');
    if (page) return selectPage(page.dataset.page);
    const userPage = event.target.closest('[data-user-page]');
    if (userPage) { state.userOffset = Math.max(0, state.userOffset + (userPage.dataset.userPage === 'next' ? 100 : -100)); return loadUsers().catch((error) => toast(error.message, true)); }
    const go = event.target.closest('[data-go]'); if (go) return selectPage(go.dataset.go);
    const kind = event.target.closest('[data-kind]'); if (kind) { state.kind = kind.dataset.kind; $$('[data-kind]').forEach((button) => button.classList.toggle('active', button === kind)); return loadContent(); }
    const userOpen = event.target.closest('[data-user-open]'); if (userOpen) { try { await openUser(userOpen.dataset.userOpen); } catch (error) { toast(error.message, true); } return; }
    const back = event.target.closest('[data-user-back]'); if (back) { try { await openUser(back.dataset.userBack); } catch (error) { toast(error.message, true); } return; }
    const view = event.target.closest('[data-data-view]'); if (view) return openDataEditor(view.dataset.dataView, false);
    const edit = event.target.closest('[data-data-edit]'); if (edit) return openDataEditor(edit.dataset.dataEdit, true);
    const save = event.target.closest('[data-data-save]'); if (save) { try { await saveData(save.dataset.dataSave); } catch (error) { toast(error.message, true); } return; }
    const removeData = event.target.closest('[data-data-delete]'); if (removeData) { try { await deleteUserData(removeData.dataset.dataDelete); } catch (error) { toast(error.message, true); } return; }
    const fileView = event.target.closest('[data-file-view]'); if (fileView) { try { await viewUserFile(fileView.dataset.fileView); } catch (error) { toast(error.message, true); } return; }
    const fileDelete = event.target.closest('[data-file-delete]'); if (fileDelete) { try { await deleteUserFile(fileDelete.dataset.fileDelete); } catch (error) { toast(error.message, true); } return; }
    const removeUser = event.target.closest('[data-user-delete]'); if (removeUser) { try { await deleteUser(removeUser.dataset.userDelete); } catch (error) { toast(error.message, true); } return; }
    const status = event.target.closest('[data-user-status]'); if (status) { try { await setUserStatus(status.dataset.userStatus, status.dataset.status); } catch (error) { toast(error.message, true); } return; }
    const exportButton = event.target.closest('[data-user-export]'); if (exportButton) return exportUser(exportButton.dataset.userExport);
    const contentEdit = event.target.closest('[data-content-edit]'); if (contentEdit) { const item = window.__adminContent?.find((entry) => entry.id === contentEdit.dataset.contentEdit); return editContent(item || null); }
    const contentPause = event.target.closest('[data-content-pause]'); if (contentPause) { try { await pauseContent(contentPause.dataset.contentPause); } catch (error) { toast(error.message, true); } return; }
    const revoke = event.target.closest('[data-admin-revoke]'); if (revoke) { try { await revokeAdmin(revoke.dataset.adminRevoke); } catch (error) { toast(error.message, true); } return; }
    const restore = event.target.closest('[data-restore]'); if (restore) { try { await restoreItem(restore.dataset.restore); } catch (error) { toast(error.message, true); } return; }
    if (event.target.closest('[data-dialog-close]')) { event.preventDefault(); return closeDialog(); }
  });

  $('#searchUsers').addEventListener('click', () => loadUsers(true).catch((error) => toast(error.message, true)));
  $('#userSearch').addEventListener('keydown', (event) => { if (event.key === 'Enter') loadUsers(true).catch((error) => toast(error.message, true)); });
  $('#userStatus').addEventListener('change', () => loadUsers(true).catch((error) => toast(error.message, true)));
  $('#addContent').addEventListener('click', () => editContent(null));
  $('#saveModules').addEventListener('click', () => saveModules().catch((error) => toast(error.message, true)));
  $('#refreshRecycle').addEventListener('click', () => loadRecycle().catch((error) => toast(error.message, true)));
  $('#refreshAudit').addEventListener('click', () => loadAudit().catch((error) => toast(error.message, true)));
  $('#inviteAdmin').addEventListener('submit', (event) => { event.preventDefault(); inviteAdmin(event.currentTarget).catch((error) => toast(error.message, true)); });
  $('#dialogContent').addEventListener('submit', (event) => { if (event.target.id === 'contentForm') { event.preventDefault(); saveContent(event.target).catch((error) => toast(error.message, true)); } });
  $('#dialogContent').addEventListener('change', (event) => { if (event.target.name === 'role') { const enabled = event.target.value === 'personal_data_admin'; $('[name="grantExport"]', $('#inviteAdmin')).disabled = !enabled; $('[name="grantDelete"]', $('#inviteAdmin')).disabled = !enabled; } if (event.target.name === 'audience') { $('.target-field')?.toggleAttribute('hidden', event.target.value !== 'selected'); } });
  $('#adminDialog').addEventListener('click', (event) => { if (event.target === event.currentTarget) closeDialog(); });
  $('#accountButton').addEventListener('click', () => { if (confirm('退出管理后台？GitHub 登录状态仍由 OneBox 前台管理。')) { state.session = ''; githubToken = ''; showLogin('已退出后台会话。'); } });
  $('#retryLogin').addEventListener('click', () => window.location.reload());

  function syncGrantControls() {
    const enabled = $('[name="role"]', $('#inviteAdmin')).value === 'personal_data_admin';
    $('[name="grantExport"]', $('#inviteAdmin')).disabled = !enabled;
    $('[name="grantDelete"]', $('#inviteAdmin')).disabled = !enabled;
  }
  syncGrantControls();

  boot();
})();
