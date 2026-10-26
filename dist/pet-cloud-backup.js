/* Pet dialog cloud backup controls reuse OneBox's authenticated GitHub Gist backup. */
(() => {
  'use strict';

  let syncingAction = '';

  function ensureStyles() {
    if (document.getElementById('pet-cloud-backup-styles')) return;
    const style = document.createElement('style');
    style.id = 'pet-cloud-backup-styles';
    style.textContent = `
      .onebox-mascot-cloud-backup { display: grid; gap: 5px; margin-top: 6px; }
      .onebox-mascot-cloud-backup-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
      .onebox-mascot-cloud-backup .github-action-button { box-sizing: border-box; min-width: 0; min-height: 34px; gap: 6px; padding: 5px 7px; border-radius: 10px; box-shadow: none; font-size: 11px; white-space: nowrap; }
      .onebox-mascot-cloud-backup .github-action-button.is-primary { border-color: transparent; background: var(--primary); color: var(--primary-contrast, #fff); }
      .onebox-mascot-cloud-backup .github-action-icon { flex: 0 0 22px; width: 22px; height: 22px; border-radius: 7px; }
      .onebox-mascot-cloud-backup .github-action-icon svg { width: 13px; height: 13px; }
      .onebox-mascot-cloud-backup button:disabled { cursor: wait; opacity: .58; }
      .onebox-mascot-cloud-backup .onebox-mascot-cloud-backup-connect { justify-content: flex-start; text-align: left; }
      .onebox-mascot-cloud-backup-status { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
    `;
    document.head.append(style);
  }

  const copy = () => {
    const forced = localStorage.getItem('onebox.language') || 'system';
    const english = forced === 'en' || (forced !== 'zh' && /^en/i.test(navigator.language || ''));
    return english ? {
      title: 'System backup',
      backup: 'Backup',
      restore: 'Restore',
      backupHint: 'Save the current system data to your OneBox backup.',
      restoreHint: 'Restore data from your latest OneBox backup.',
      note: 'Uses the connected GitHub account and its selected sync data.',
      connect: 'Log in to GitHub',
      workingBackup: 'Backing up system data…',
      workingRestore: 'Restoring system data…',
      backupDone: 'Cloud backup completed.',
      restoreDone: 'Cloud restore completed.',
      noBackup: 'No cloud backup found. Back up this device first.',
      offline: 'Connect to the internet and try again.',
      busy: 'A sync is already running. Please wait.',
      failed: 'Could not complete the cloud operation.',
      confirm: 'Restore the latest cloud backup to this device?',
      ready: 'Ready to back up or restore system data.'
    } : {
      title: '系统备份',
      backup: '备份',
      restore: '恢复',
      backupHint: '将当前系统信息保存到 OneBox 云备份。',
      restoreHint: '从最近一次 OneBox 云备份恢复数据。',
      note: '使用当前 GitHub 账号，并遵循云同步中已选择的数据范围。',
      connect: '登录GitHub',
      workingBackup: '正在备份系统信息…',
      workingRestore: '正在恢复系统信息…',
      backupDone: '云备份完成。',
      restoreDone: '云端恢复完成。',
      noBackup: '还没有云端备份，请先备份此设备。',
      offline: '请联网后重试。',
      busy: '已有同步任务正在运行，请稍候。',
      failed: '云端操作未能完成。',
      confirm: '确定从云端最近一次备份恢复到此设备吗？',
      ready: '可以备份或恢复系统信息。'
    };
  };

  const account = () => {
    try { return JSON.parse(localStorage.getItem('onebox.github') || '{}'); } catch { return {}; }
  };

  function backupExists(user) {
    if (!user?.token || !user?.user?.login) return false;
    const login = String(user.user.login).trim().toLowerCase();
    return Boolean(user.gistId || localStorage.getItem('onebox.github-sync-v2-initialized:' + login) === 'true');
  }

  function updateAvailability(section) {
    const user = account(), connected = Boolean(user.token && user.user?.login);
    const busy = Boolean(syncingAction) || section.dataset.busy === 'true';
    section.querySelectorAll('[data-pet-cloud-backup-action]').forEach((button) => {
      button.disabled = !connected || busy;
      button.setAttribute('aria-disabled', String(button.disabled));
    });
    const connect = section.querySelector('[data-pet-cloud-backup-connect]');
    if (connect) {
      const label = connect.querySelector('[data-pet-github-status]');
      const login = String(user.user?.login || '').trim();
      if (label) label.textContent = connected ? login : copy().connect;
      connect.title = connected ? login : copy().connect;
      connect.setAttribute('aria-label', connected ? 'GitHub · ' + login : copy().connect);
    }
    const status = section.querySelector('[data-pet-cloud-backup-status]');
    if (status && syncingAction) { status.textContent = syncingAction === 'backup' ? copy().workingBackup : copy().workingRestore; status.hidden = false; }
  }

  function install() {
    ensureStyles();
    const actions = document.querySelector('.onebox-mascot-panel .onebox-mascot-cloud-actions');
    if (!actions) return false;
    let widget = actions.parentElement.querySelector('.onebox-mascot-cloud-backup');
    if (widget) return false;

    const labels = copy();
    widget = document.createElement('div');
    widget.className = 'onebox-mascot-cloud-backup';
    widget.dataset.petCloudBackupRoot = 'true';
    widget.innerHTML =
      '<div class="onebox-mascot-cloud-backup-row">' +
        '<button type="button" class="github-action-button is-primary" data-pet-cloud-backup-action="backup" aria-disabled="false"><span class="github-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 17.5a4.5 4.5 0 0 1 .8-8.93A6.5 6.5 0 0 1 18 10.5h.5a3.5 3.5 0 0 1 0 7H15"/><path d="M12 20V10m0 0-3 3m3-3 3 3"/></svg></span><span class="github-action-copy"><strong>' + labels.backup + '</strong></span></button>' +
        '<button type="button" class="github-action-button" data-pet-cloud-backup-action="restore" aria-disabled="false"><span class="github-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 17.5a4.5 4.5 0 0 1 .8-8.93A6.5 6.5 0 0 1 18 10.5h.5a3.5 3.5 0 0 1 0 7H15"/><path d="M12 7v10m0 0-3-3m3 3 3-3"/></svg></span><span class="github-action-copy"><strong>' + labels.restore + '</strong></span></button>' +
        '<button type="button" class="github-action-button onebox-mascot-cloud-backup-connect" data-open-github-page data-pet-cloud-backup-connect><span class="github-action-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 18h10a3.5 3.5 0 0 0 .5-6.96A5.5 5.5 0 0 0 7 9.5a4.25 4.25 0 0 0 0 8.5Z"/><path d="m12 12 2-2m-2 2-2-2m2 2v4"/></svg></span><span class="github-action-copy"><strong data-pet-github-status>' + labels.connect + '</strong></span></button>' +
      '</div>' +
      '<small class="onebox-mascot-cloud-backup-status" data-pet-cloud-backup-status role="status" aria-live="polite"></small>';
    actions.insertAdjacentElement('afterend', widget);
    updateAvailability(widget);
    return true;
  }

  async function run(action, section) {
    const labels = copy();
    const status = section.querySelector('[data-pet-cloud-backup-status]');
    const user = account();
    if (!user.token || !user.user?.login) {
      status.textContent = labels.connect;
      return;
    }
    if (!navigator.onLine) {
      status.textContent = labels.offline;
      return;
    }
    if (action === 'restore') {
      if (!backupExists(user)) {
        status.textContent = labels.noBackup;
        return;
      }
      if (!window.confirm(labels.confirm)) return;
    }
    const sync = window.OneBoxGithubAutoSync;
    if (typeof sync?.syncNow !== 'function') {
      status.textContent = labels.failed;
      return;
    }
    if (syncingAction) {
      status.textContent = labels.busy;
      return;
    }

    const login = String(user.user.login).trim().toLowerCase();
    const initKey = 'onebox.github-sync-v2-initialized:' + login;
    const previousInit = localStorage.getItem(initKey);
    let resultMessage = action === 'backup' ? labels.workingBackup : labels.workingRestore;
    syncingAction = action;
    section.dataset.busy = 'true';
    updateAvailability(section);
    status.textContent = resultMessage;

    // A requested backup must upload this device first, without applying an
    // older cloud snapshot during the one-time Gist initialization path.
    if (action === 'backup' && previousInit !== 'true') localStorage.setItem(initKey, 'true');
    try {
      const result = await sync.syncNow({ restore: action === 'restore' });
      if (result?.error) resultMessage = result.error;
      else if (result?.synced) resultMessage = action === 'backup' ? labels.backupDone : labels.restoreDone;
      else if (result?.pending) resultMessage = labels.busy;
      else resultMessage = labels.failed;
    } catch (error) {
      resultMessage = String(error?.message || labels.failed);
    } finally {
      syncingAction = '';
      if (action === 'backup' && resultMessage !== labels.backupDone && previousInit !== 'true') {
        if (previousInit === null) localStorage.removeItem(initKey);
        else localStorage.setItem(initKey, previousInit);
      }
      delete section.dataset.busy;
      updateAvailability(section);
      document.querySelectorAll('[data-pet-cloud-backup-root]').forEach((liveSection) => {
        const liveStatus = liveSection.querySelector('[data-pet-cloud-backup-status]');
        if (liveStatus) liveStatus.textContent = resultMessage;
        updateAvailability(liveSection);
      });
    }
  }
  document.addEventListener('click', (event) => {
    const connectButton = event.target.closest?.('[data-pet-cloud-backup-connect]');
    if (connectButton) {
      event.preventDefault();
      event.stopPropagation();
      const workspace = document.querySelector('#workspace');
      if (!workspace) return;
      // The mascot is rendered outside #workspace, while the app's existing
      // GitHub dialog click handler is delegated from #workspace.
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.dataset.openGithubPage = '';
      trigger.hidden = true;
      workspace.append(trigger);
      try { trigger.click(); } finally { trigger.remove(); }
      return;
    }
    const button = event.target.closest?.('[data-pet-cloud-backup-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const section = button.closest('[data-pet-cloud-backup-root]');
    if (section) void run(button.dataset.petCloudBackupAction, section);
  });

  const refreshConnectionLabel = () => {
    const widget = document.querySelector('[data-pet-cloud-backup-root]');
    if (widget) updateAvailability(widget);
  };
  const githubDialog = document.querySelector('#githubDialog');
  if (githubDialog) {
    const githubDialogObserver = new MutationObserver(refreshConnectionLabel);
    githubDialogObserver.observe(githubDialog, { childList: true, subtree: true });
  }
  window.addEventListener('storage', (event) => {
    if (event.key === 'onebox.github') refreshConnectionLabel();
  });

  let panelObserver = null;
  const watchPanel = (panel) => {
    if (!panel || panelObserver) return;
    panelObserver = new MutationObserver(install);
    panelObserver.observe(panel, { childList: true, subtree: true });
    install();
  };
  const panel = document.querySelector('.onebox-mascot-panel');
  if (panel) {
    watchPanel(panel);
  } else {
    const discoveryObserver = new MutationObserver(() => {
      const discoveredPanel = document.querySelector('.onebox-mascot-panel');
      if (!discoveredPanel) return;
      discoveryObserver.disconnect();
      watchPanel(discoveredPanel);
    });
    discoveryObserver.observe(document.body, { childList: true, subtree: true });
  }
})();
