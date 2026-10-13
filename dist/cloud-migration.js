(() => {
  'use strict';
  const status = document.querySelector('#cloudStatus');
  const toggle = document.querySelector('#autoSync');
  const AUTO_SYNC_KEY = 'onebox.github-auto-sync';

  function githubAccount() {
    try { return JSON.parse(localStorage.getItem('onebox.github') || '{}'); } catch { return {}; }
  }
  function render() {
    const account = githubAccount();
    const connected = Boolean(account.token);
    status.textContent = connected
      ? '已连接 GitHub' + (account.user?.login ? '：' + account.user.login : '') + '。数据会保存到此账号自己的 Gist。'
      : '尚未连接 GitHub。返回 OneBox，在「我的 → 账号」连接 GitHub 后即可同步。';
    toggle.checked = localStorage.getItem(AUTO_SYNC_KEY) === 'true';
    toggle.disabled = !connected;
  }

  toggle.addEventListener('change', () => {
    localStorage.setItem(AUTO_SYNC_KEY, String(toggle.checked));
    status.textContent = toggle.checked ? '已开启自动同步。返回 OneBox 后会同步到个人 Gist。' : '已暂停自动同步，现有 Gist 备份会保留。';
  });
  window.addEventListener('storage', render);
  render();
})();
