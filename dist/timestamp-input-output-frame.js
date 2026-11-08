(function () {
  'use strict';
  const scope = '.dev-workbench.dev-timestamp';
  const styleId = 'timestamp-input-output-frame-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent =
      scope + ' .dev-timestamp-content{display:grid;grid-template-columns:minmax(0,1fr)!important;grid-auto-rows:max-content!important;gap:12px!important}' +
      scope + ' .dev-timestamp-input-output-frame{display:block;width:100%;min-width:0;box-sizing:border-box;padding:0;border:0;background:transparent;box-shadow:none}';
    document.head.appendChild(style);
  }
  const localDateTime = (date) =>
    date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0') + 'T' +
    String(date.getHours()).padStart(2, '0') + ':' +
    String(date.getMinutes()).padStart(2, '0') + ':' +
    String(date.getSeconds()).padStart(2, '0');

  function build() {
    const content = document.querySelector(scope + ' .dev-timestamp-content');
    if (!content) return;
    const input = content.querySelector('.dev-timestamp-card');
    const output = content.querySelector('.dev-timestamp-output-card');
    if (!input || !output || input.dataset.unifiedLayout === 'true') return;

    let frame = content.querySelector(':scope > .dev-timestamp-input-output-frame');
    if (!frame) {
      frame = document.createElement('div');
      frame.className = 'dev-timestamp-input-output-frame';
      content.insertBefore(frame, input);
    }
    if (input.parentElement !== frame) frame.appendChild(input);
    if (output.parentElement !== frame) frame.appendChild(output);

    const inputGrid = input.querySelector('.dev-timestamp-input-grid');
    const cards = Array.from(input.querySelectorAll('.dev-timestamp-input-card'));
    const timestampCard = cards.find((card) => /时间戳|timestamp/i.test(card.textContent || '')) || cards[0];
    const dateCard = cards.find((card) => card !== timestampCard) || cards[1];
    const timestampRow = timestampCard?.querySelector('.dev-timestamp-input-row:not(.dev-timestamp-date-row)');
    const dateRow = dateCard?.querySelector('.dev-timestamp-input-row.dev-timestamp-date-row');
    const timestampInput = timestampRow?.querySelector('.dev-plain-input');
    const dateInput = dateRow?.querySelector('input[data-dev-field="timestampDate"]');
    if (!timestampRow || !dateRow || !timestampInput || !dateInput) return;

    const resultBlocks = Array.from(output.querySelectorAll('.dev-timestamp-overview-results > .dev-timestamp-result-block'));
    const result = resultBlocks[1] || resultBlocks[0];
    if (!result) return;

    const inputHead = input.querySelector('.dev-timestamp-input-head');
    if (inputHead) {
      const buttons = Array.from(inputHead.querySelectorAll('button'));
      const nowButton = buttons.find((button) => /当前时间|现在|now|current/i.test((button.textContent || '').trim()));
      const clearButton = buttons.find((button) => /清空|clear/i.test((button.textContent || '').trim()));
      let shell = timestampRow.querySelector('.dev-timestamp-input-shell');
      if (!shell) {
        shell = document.createElement('div');
        shell.className = 'dev-timestamp-input-shell';
        timestampRow.insertBefore(shell, timestampInput);
        shell.appendChild(timestampInput);
      }
      if (clearButton) {
        clearButton.type = 'button';
        clearButton.classList.add('dev-timestamp-field-icon', 'is-clear');
        clearButton.dataset.timestampFieldAction = 'clear';
        clearButton.setAttribute('aria-label', '清空');
        clearButton.title = '清空';
        clearButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.25"/><path d="m9.2 9.2 5.6 5.6m0-5.6-5.6 5.6"/></svg>';
        shell.appendChild(clearButton);
      }
      if (nowButton) {
        nowButton.type = 'button';
        nowButton.classList.add('dev-timestamp-live-button');
        nowButton.dataset.timestampFieldAction = 'now';
        nowButton.setAttribute('aria-label', '当前时间');
        nowButton.title = '当前时间';
        nowButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.25"/><path d="M12 7.25v4.9l3.35 1.95"/></svg><span>当前时间</span>';
        timestampRow.appendChild(nowButton);
      }

      let timer = 0;
      let writingNow = false;
      const unitSelect = timestampRow.querySelector('select');
      const unitHint = () => ((unitSelect?.value || '') + ' ' + (unitSelect?.selectedOptions?.[0]?.textContent || '')).toLowerCase();
      const writeNow = () => {
        if (!timestampInput.isConnected) {
          if (timer) window.clearInterval(timer);
          timer = 0;
          return;
        }
        const milliseconds = /毫秒|milli|(^|[^a-z])ms([^a-z]|$)/.test(unitHint());
        writingNow = true;
        timestampInput.value = String(milliseconds ? Date.now() : Math.floor(Date.now() / 1000));
        timestampInput.dispatchEvent(new Event('input', { bubbles: true }));
        timestampInput.dispatchEvent(new Event('change', { bubbles: true }));
        writingNow = false;
      };
      const selectNow = (selected) => {
        nowButton?.setAttribute('aria-pressed', String(selected));
        nowButton?.classList.toggle('is-selected', selected);
        if (selected) {
          if (!timer) {
            writeNow();
            timer = window.setInterval(writeNow, 1000);
          }
        } else if (timer) {
          window.clearInterval(timer);
          timer = 0;
        }
      };
      if (nowButton && nowButton.dataset.toggleReady !== 'true') {
        nowButton.dataset.toggleReady = 'true';
        nowButton.setAttribute('aria-pressed', 'false');
        nowButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          selectNow(nowButton.getAttribute('aria-pressed') !== 'true');
        }, true);
        timestampInput.addEventListener('input', () => { if (!writingNow) selectNow(false); });
        timestampInput.addEventListener('change', () => { if (!writingNow) selectNow(false); });
        unitSelect?.addEventListener('change', () => {
          if (nowButton.getAttribute('aria-pressed') === 'true') writeNow();
        });
      }
      if (clearButton && clearButton.dataset.clearToggleReady !== 'true') {
        clearButton.dataset.clearToggleReady = 'true';
        clearButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          timestampInput.value = '';
          timestampInput.dispatchEvent(new Event('input', { bubbles: true }));
          timestampInput.dispatchEvent(new Event('change', { bubbles: true }));
          selectNow(false);
        }, true);
      }
      inputHead.remove();
    }

    const module = document.createElement('section');
    module.className = 'dev-timestamp-bidirectional';
    const title = document.createElement('h3');
    title.className = 'dev-timestamp-bidirectional-title';
    title.textContent = '时间 ⇄ 时间戳';
    module.appendChild(title);

    const fields = document.createElement('div');
    fields.className = 'dev-timestamp-bidirectional-fields';
    const dateField = document.createElement('div');
    dateField.className = 'dev-timestamp-bidirectional-field is-datetime';
    const timestampField = document.createElement('div');
    timestampField.className = 'dev-timestamp-bidirectional-field is-timestamp';
    const dateLabel = document.createElement('span');
    dateLabel.className = 'dev-timestamp-bidirectional-label';
    dateLabel.textContent = '时间';
    const timestampLabel = document.createElement('span');
    timestampLabel.className = 'dev-timestamp-bidirectional-label';
    timestampLabel.textContent = '时间戳';
    dateField.append(dateLabel, dateRow);
    timestampField.append(timestampLabel, timestampRow);
    const swapButton = document.createElement('button');
    swapButton.type = 'button';
    swapButton.className = 'dev-timestamp-bidirectional-swap';
    swapButton.setAttribute('aria-label', '交换时间和时间戳的位置');
    swapButton.title = '交换位置';
    swapButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/></svg>';
    swapButton.addEventListener('click', () => {
      const reversed = fields.classList.toggle('is-reversed');
      swapButton.setAttribute('aria-pressed', String(reversed));
    });
    fields.append(dateField, swapButton, timestampField);
    module.appendChild(fields);

    const resultTitle = result.querySelector(':scope > h4');
    if (resultTitle) resultTitle.remove();
    module.appendChild(result);

    let syncing = false;
    const unitSelect = timestampRow.querySelector('select');
    const isMilliseconds = (raw) => {
      const hint = ((unitSelect?.value || '') + ' ' + (unitSelect?.selectedOptions?.[0]?.textContent || '')).toLowerCase();
      if (/毫秒|milli|(^|[^a-z])ms([^a-z]|$)/.test(hint)) return true;
      if (/秒|second|(^|[^a-z])s([^a-z]|$)/.test(hint) && !/毫秒|milli|ms/.test(hint)) return false;
      return Math.abs(Number(raw)) >= 1e12;
    };
    const fromTimestamp = () => {
      if (syncing) return;
      const raw = String(timestampInput.value || '').trim().replaceAll(',', '');
      syncing = true;
      if (!raw || !Number.isFinite(Number(raw))) dateInput.value = '';
      else {
        const numeric = Number(raw);
        const date = new Date(isMilliseconds(raw) ? numeric : numeric * 1000);
        dateInput.value = Number.isNaN(date.getTime()) ? '' : localDateTime(date);
      }
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      syncing = false;
    };
    const fromDate = () => {
      if (syncing) return;
      syncing = true;
      const date = dateInput.value ? new Date(dateInput.value) : null;
      if (!date || Number.isNaN(date.getTime())) timestampInput.value = '';
      else timestampInput.value = String(isMilliseconds('') ? date.getTime() : Math.floor(date.getTime() / 1000));
      timestampInput.dispatchEvent(new Event('input', { bubbles: true }));
      timestampInput.dispatchEvent(new Event('change', { bubbles: true }));
      syncing = false;
    };
    timestampInput.addEventListener('input', fromTimestamp);
    timestampInput.addEventListener('change', fromTimestamp);
    dateInput.addEventListener('input', fromDate);
    dateInput.addEventListener('change', fromDate);
    unitSelect?.addEventListener('change', fromTimestamp);
    if (timestampInput.value) fromTimestamp();
    else fromDate();

    input.dataset.unifiedLayout = 'true';
    inputGrid?.remove();
    input.replaceChildren(module);
    output.remove();
    frame.replaceChildren(input);
  }

  function relocateUnit() {
    const row = document.querySelector(scope + ' .dev-timestamp-bidirectional-field.is-timestamp .dev-timestamp-input-row');
    const shell = row?.querySelector('.dev-timestamp-input-shell');
    const unit = row?.querySelector('.dev-timestamp-unit-picker');
    if (shell && unit && !shell.contains(unit)) shell.appendChild(unit);
  }
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; build(); relocateUnit(); });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once:true });
  else schedule();
})();