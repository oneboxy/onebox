/* Pet dialog cloud backup controls reuse OneBox's authenticated GitHub Gist backup. */
(() => {
  'use strict';

  const copy = () => {
    const forced = localStorage.getItem('onebox.language') || 'system';
    const english = forced === 'en' || (forced !== 'zh' && /^en/i.test(navigator.language || ''));
    return english ? {
      title: 'System backup',
      backup: 'Back up to cloud',
      restore: 'Restore backup',
      backupHint: 'Save the current system data to your OneBox backup.',
      restoreHint: 'Restore data from your latest OneBox backup.',
      note: 'Uses the connected GitHub account and its selected sync data.',
      connect: 'Connect GitHub to use cloud backup',
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
      backup: '云端备份',
      restore: '恢复备份',
      backupHint: '将当前系统信息保存到 OneBox 云备份。',
      restoreHint: '从最近一次 OneBox 云备份恢复数据。',
      note: '使用当前 GitHub 账号，并遵循云同步中已选择的数据范围。',
      connect: '连接 GitHub 后即可使用云备份',
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
    const busy = section.dataset.busy === 'true';
    section.querySelectorAll('[data-pet-cloud-backup-action]').forEach((button) => {
      button.disabled = !connected || busy;
      button.setAttribute('aria-disabled', String(button.disabled));
    });
    const connect = section.querySelector('[data-pet-cloud-backup-connect]');
    if (connect) connect.hidden = connected;
    const note = section.querySelector('[data-pet-cloud-backup-note]');
    if (note) note.textContent = connected ? copy().note : copy().connect;
  }

  function install() {
    const dialog = document.querySelector('#petDialog');
    const body = dialog?.querySelector('.pet-dialog-body');
    if (!body) return;
    let section = body.querySelector('.pet-cloud-backup-section');
    if (section) return updateAvailability(section);

    const labels = copy();
    section = document.createElement('section');
    section.className = 'pet-outfits-section pet-cloud-backup-section';
    section.innerHTML =
      '<div class="pet-section-head"><h3>' + labels.title + '</h3></div>' +
      '<div class="pet-cloud-backup-actions">' +
        '<button type="button" class="pet-outfit-card pet-cloud-backup-button" data-pet-cloud-backup-action="backup" aria-disabled="false">' +
          '<span class="pet-outfit-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5"/></svg></span>' +
          '<span class="pet-outfit-copy"><strong>' + labels.backup + '</strong><small>' + labels.backupHint + '</small></span>' +
        '</button>' +
        '<button type="button" class="pet-outfit-card pet-cloud-backup-button" data-pet-cloud-backup-action="restore" aria-disabled="false">' +
          '<span class="pet-outfit-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 8V20m0 0 4.5-4.5M12 20l-4.5-4.5M5 10V5h14v5"/></svg></span>' +
          '<span class="pet-outfit-copy"><strong>' + labels.restore + '</strong><small>' + labels.restoreHint + '</small></span>' +
        '</button>' +
      '</div>' +
      '<button type="button" class="pet-outfit-card pet-cloud-backup-connect" data-open-github-page data-pet-cloud-backup-connect hidden>' + labels.connect + '</button>' +
      '<p class="pet-cloud-backup-note" data-pet-cloud-backup-note aria-live="polite">' + labels.note + '</p>' +
      '<p class="pet-cloud-backup-status" data-pet-cloud-backup-status role="status" aria-live="polite">' + labels.ready + '</p>';
    const settings = body.querySelector('.pet-settings-section');
    if (settings) settings.insertAdjacentElement('afterend', section);
    else body.append(section);
    updateAvailability(section);
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
    if (section.dataset.busy === 'true') {
      status.textContent = labels.busy;
      return;
    }
    section.dataset.busy = 'true';
    updateAvailability(section);
    status.textContent = action === 'backup' ? labels.workingBackup : labels.workingRestore;
    try {
      const result = await sync.syncNow({ restore: action === 'restore' });
      if (result?.error) status.textContent = result.error;
      else if (result?.synced) status.textContent = action === 'backup' ? labels.backupDone : labels.restoreDone;
      else if (result?.pending) status.textContent = labels.busy;
      else status.textContent = labels.failed;
    } catch (error) {
      status.textContent = String(error?.message || labels.failed);
    } finally {
      delete section.dataset.busy;
      updateAvailability(section);
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-pet-cloud-backup-action]');
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    const section = button.closest('.pet-cloud-backup-section');
    if (section) void run(button.dataset.petCloudBackupAction, section);
  });

  const observer = new MutationObserver(install);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
