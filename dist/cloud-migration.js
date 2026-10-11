(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const status = $('#cloudStatus'), details = $('#migrationDetails'), already = $('#cloudAlready'), login = $('#loginLink'), refresh = $('#refreshCloud');
  const consent = $('#migrationConsent'), migrateButton = $('#migrateButton'), progress = $('#progressBox');
  const groups = [
    ['设置与偏好', ['onebox.theme','onebox.language','onebox.layout','onebox.color','onebox.color-explicit','onebox.top-display','onebox.footprint','onebox.open-mode','onebox.mascot-position','onebox.mascot-visible','onebox.mascot-display-mode','onebox.pet-profile']],
    ['导航与首页', ['onebox.tool-order','onebox.navigation','onebox.navigation-location','onebox.home-feed-order','onebox.home-feed-visibility','onebox.home-feed-active']],
    ['阅读', ['onebox.home-feed-read','onebox.reader-progress','onebox.reader-preferences','onebox.reader-layout','onebox.library']],
    ['日程与天气', ['onebox.events','onebox.weather-cards','onebox.weather']],
    ['消息与工具', ['onebox.notifications','onebox.notification-preference','onebox.translation-history','onebox.translation-history-open','onebox.calculator','onebox.dev-tools']],
    ['卡包', ['onebox.ticket-wallet','onebox.ticket-wallet-display-order','onebox.ticket-wallet-type-filter','onebox.ticket-wallet-memories','onebox.ticket-wallet-deleted']],
  ];
  function formatSize(value) { const size = Number(value) || 0; if (size < 1024) return size + ' B'; if (size < 1048576) return (size / 1024).toFixed(1) + ' KB'; return (size / 1048576).toFixed(1) + ' MB'; }
  function setStatus(message, error = false) { status.textContent = message; status.classList.toggle('is-error', error); }
  function setProgress(done, total, hint) { const percent = total ? Math.round(done / total * 100) : 100; $('#progressLabel').textContent = percent + '%'; $('#progressBar').style.width = percent + '%'; if (hint) $('#progressHint').textContent = hint; }
  function currentSnapshot() { return window.OneBoxCloudSync?.snapshot?.() || {}; }
  async function inspect() {
    const cloud = window.OneBoxCloudSync;
    if (!cloud?.configured()) { setStatus('Cloudflare 云端服务尚未配置。完成 Worker 部署后才能迁移。', true); login.hidden = true; refresh.hidden = true; return; }
    try {
      const token = await cloud.getSession();
      if (!token) { setStatus('请先在 OneBox 前台连接 GitHub，再返回此页面。'); login.hidden = false; refresh.hidden = false; return; }
      login.hidden = true; refresh.hidden = false;
      const account = await cloud.api('/v1/cloud/account');
      $('#migratedAt').textContent = account.migratedAt ? '迁移完成于 ' + new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(account.migratedAt)) : '账号已创建，尚未迁移当前设备的数据。';
      if (account.migratedAt) {
        already.hidden = false; details.hidden = true;
        const localDataCount = Object.keys(currentSnapshot()).length, localFileCount = (await cloud.localFiles()).length;
        $('#syncHint').textContent = '本机有 ' + localDataCount + ' 项数据、' + localFileCount + ' 个附件。首次同步时，云端同名数据优先；云端没有的本机项目会补充上传。';
        const auto = $('#autoSync'); auto.checked = cloud.enabled();
        setStatus('已识别 GitHub 账号：' + (account.login || account.id));
        return;
      }
      const snapshot = currentSnapshot(), keys = Object.keys(snapshot), bytes = new Blob(Object.values(snapshot)).size;
      const files = await cloud.localFiles();
      const modules = groups.map(([name, list]) => ({ name, count: list.filter((key) => Object.hasOwn(snapshot, key)).length })).filter((item) => item.count);
      $('#keyCount').textContent = keys.length; $('#fileCount').textContent = files.length;
      $('#totalSize').textContent = formatSize(bytes + files.reduce((sum, file) => sum + file.blob.size, 0));
      $('#moduleSummary').innerHTML = modules.map((item) => '<span>' + item.name + ' · ' + item.count + ' 项</span>').join('') || '<span>当前设备暂无可迁移的数据</span>';
      details.hidden = false; setStatus('已识别 GitHub 账号：' + (account.login || account.id));
    } catch (error) { login.hidden = false; refresh.hidden = false; setStatus(error.message || '云端账号检查失败', true); }
  }
  async function migrate() {
    if (!consent.checked || migrateButton.disabled) return;
    migrateButton.disabled = true; consent.disabled = true; progress.hidden = false;
    $('#progressTitle').textContent = '正在迁移 OneBox 数据'; setProgress(0, 1, '请保持页面打开，完成后再关闭。');
    try {
      const cloud = window.OneBoxCloudSync, snapshot = currentSnapshot(), entries = Object.entries(snapshot);
      await cloud.api('/v1/cloud/migration', { method: 'POST', body: JSON.stringify({ action: 'start', consented: true }) });
      const tasks = entries.length + (await cloud.localFiles()).length + 1; let done = 0;
      for (const [key, value] of entries) {
        await cloud.api('/v1/cloud/data/' + encodeURIComponent(key), { method: 'PUT', body: JSON.stringify({ value, updatedAt: Date.now() }) });
        done += 1; setProgress(done, tasks, '正在迁移设置、日程、天气、阅读和卡包数据…');
      }
      await cloud.uploadLocalFiles((current, total, name) => { done = entries.length + current; setProgress(done, tasks, '正在上传附件：' + name); });
      await cloud.api('/v1/cloud/migration', { method: 'POST', body: JSON.stringify({ action: 'complete' }) });
      cloud.enable(true); await cloud.syncNow();
      setProgress(tasks, tasks, '迁移完成。此设备已开启自动同步。');
      setStatus('数据已加密传输到 OneBox 云端存储。');
      window.setTimeout(() => location.reload(), 700);
    } catch (error) {
      setStatus(error.message || '迁移未完成，请检查网络后重试。', true);
      $('#progressHint').textContent = '已上传部分内容；重试会覆盖相同数据并继续迁移。';
      migrateButton.disabled = false; consent.disabled = false;
    }
  }
  consent?.addEventListener('change', () => { migrateButton.disabled = !consent.checked; });
  migrateButton?.addEventListener('click', () => { void migrate(); });
  refresh?.addEventListener('click', async () => {
    refresh.disabled = true; refresh.textContent = '正在检查…';
    await inspect();
    refresh.disabled = false; refresh.textContent = '重新检查';
  });
  $('#autoSync')?.addEventListener('change', (event) => {
    const cloud = window.OneBoxCloudSync;
    if (event.target.checked && !confirm('首次同步时，云端已有的同名数据会覆盖本机；云端没有的本机数据会补充上传。继续开启自动同步？')) { event.target.checked = false; return; }
    cloud?.enable(event.target.checked);
    if (event.target.checked) { setStatus('已开启此设备自动同步，正在同步…'); void cloud?.syncNow().then(() => setStatus('此设备自动同步已开启。')).catch((error) => setStatus(error.message, true)); }
    else setStatus('已关闭此设备自动同步。云端数据仍保留。');
  });
  $('#syncNow')?.addEventListener('click', async (event) => {
    const button = event.currentTarget; button.disabled = true;
    try {
      if (!confirm('云端已有的同名数据将覆盖本机；云端没有的本机数据会补充上传。继续吗？')) return;
      await window.OneBoxCloudSync?.syncNow(); setStatus('已完成此设备同步。');
    }
    catch (error) { setStatus(error.message, true); }
    finally { button.disabled = false; }
  });
  void inspect();
})();
