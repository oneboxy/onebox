(function () {
  'use strict';
  const scope = '.dev-workbench.dev-timestamp';
  const styleId = 'timestamp-input-output-frame-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent =
      scope + ' .dev-timestamp-content { display:grid; grid-template-columns:minmax(0,1fr)!important; grid-auto-rows:max-content!important; align-content:start!important; gap:12px!important; }' +
      scope + ' .dev-timestamp-input-output-frame { display:block; width:100%; min-width:0; box-sizing:border-box; padding:0; border:0; background:transparent; box-shadow:none; }';
    document.head.appendChild(style);
  }

  const localDateTime = (date) =>
    date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0') + 'T' +
    String(date.getHours()).padStart(2, '0') + ':' +
    String(date.getMinutes()).padStart(2, '0') + ':' +
    String(date.getSeconds()).padStart(2, '0');

  function pairGroups() {
    const content = document.querySelector(scope + ' .dev-timestamp-content');
    if (!content) return;
    const input = content.querySelector('.dev-timestamp-card');
    const output = content.querySelector('.dev-timestamp-output-card');
    if (!input || !output || input.dataset.pairedLayout === 'true') return;

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
    const sharedResult = resultBlocks[1] || resultBlocks[0];
    if (!sharedResult) return;

    const inputHead = input.querySelector('.dev-timestamp-input-head');
    if (inputHead) {
      const buttons = Array.from(inputHead.querySelectorAll('button'));
      const nowButton = buttons.find((button) => /当前时间|现在|now|current/i.test((button.textContent || '').trim()));
      const clearButton = buttons.find((button) => /清空|clear/i.test((button.textContent || '').trim()));
      if (nowButton || clearButton) {
        let shell = timestampRow.querySelector('.dev-timestamp-input-shell');
        if (!shell) {
          shell = document.createElement('div');
          shell.className = 'dev-timestamp-input-shell';
          timestampRow.insertBefore(shell, timestampInput);
          shell.appendChild(timestampInput);
        }
        const setupIcon = (button, kind, label, svg) => {
          if (!button) return;
          button.type = 'button';
          button.classList.add('dev-timestamp-field-icon', 'is-' + kind);
          button.dataset.timestampFieldAction = kind;
          button.setAttribute('aria-label', label);
          button.title = label;
          button.innerHTML = svg;
          shell.appendChild(button);
        };
        setupIcon(nowButton, 'now', '当前时间', '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.25"/><path d="M12 7.25v4.9l3.35 1.95"/></svg>');
        setupIcon(clearButton, 'clear', '清空', '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.25"/><path d="m9.2 9.2 5.6 5.6m0-5.6-5.6 5.6"/></svg>');

        let currentTimeTimer = 0;
        let writingCurrentTime = false;
        const unitSelect = timestampRow.querySelector('select');
        const unitHint = () => ((unitSelect?.value || '') + ' ' + (unitSelect?.selectedOptions?.[0]?.textContent || '')).toLowerCase();
        const writeCurrentTime = () => {
          if (!timestampInput.isConnected) {
            if (currentTimeTimer) window.clearInterval(currentTimeTimer);
            currentTimeTimer = 0;
            return;
          }
          const milliseconds = /毫秒|milli|(^|[^a-z])ms([^a-z]|$)/.test(unitHint());
          writingCurrentTime = true;
          timestampInput.value = String(milliseconds ? Date.now() : Math.floor(Date.now() / 1000));
          timestampInput.dispatchEvent(new Event('input', { bubbles: true }));
          timestampInput.dispatchEvent(new Event('change', { bubbles: true }));
          writingCurrentTime = false;
        };
        const setNowSelected = (selected) => {
          nowButton?.setAttribute('aria-pressed', String(selected));
          nowButton?.classList.toggle('is-selected', selected);
          if (selected) {
            if (!currentTimeTimer) {
              writeCurrentTime();
              currentTimeTimer = window.setInterval(writeCurrentTime, 1000);
            }
          } else if (currentTimeTimer) {
            window.clearInterval(currentTimeTimer);
            currentTimeTimer = 0;
          }
        };

        if (nowButton && nowButton.dataset.toggleReady !== 'true') {
          nowButton.dataset.toggleReady = 'true';
          nowButton.setAttribute('aria-pressed', 'false');
          nowButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            setNowSelected(nowButton.getAttribute('aria-pressed') !== 'true');
          }, true);
          timestampInput.addEventListener('input', () => {
            if (!writingCurrentTime) setNowSelected(false);
          });
          timestampInput.addEventListener('change', () => {
            if (!writingCurrentTime) setNowSelected(false);
          });
          unitSelect?.addEventListener('change', () => {
            if (nowButton.getAttribute('aria-pressed') === 'true') writeCurrentTime();
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
            setNowSelected(false);
          }, true);
        }
      }
      inputHead.remove();
    }

    const module = document.createElement('section');
    module.className = 'dev-timestamp-bidirectional';
    const title = document.createElement('h3');
    title.className = 'dev-timestamp-bidirectional-title';
    title.textContent = '年月日时间 ⇄ 时间戳';
    module.appendChild(title);

    const fields = document.createElement('div');
    fields.className = 'dev-timestamp-bidirectional-fields';
    const dateField = document.createElement('div');
    dateField.className = 'dev-timestamp-bidirectional-field is-datetime';
    const timestampField = document.createElement('div');
    timestampField.className = 'dev-timestamp-bidirectional-field is-timestamp';
    const dateLabel = document.createElement('span');
    dateLabel.className = 'dev-timestamp-bidirectional-label';
    dateLabel.textContent = '年月日时间';
    const timestampLabel = document.createElement('span');
    timestampLabel.className = 'dev-timestamp-bidirectional-label';
    timestampLabel.textContent = '时间戳';
    dateField.append(dateLabel, dateRow);
    timestampField.append(timestampLabel, timestampRow);
    const arrow = document.createElement('span');
    arrow.className = 'dev-timestamp-bidirectional-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '⇄';
    fields.append(dateField, arrow, timestampField);
    module.appendChild(fields);

    const resultHeading = sharedResult.querySelector(':scope > h4');
    if (resultHeading) resultHeading.remove();
    module.appendChild(sharedResult);

    const unitSelect = timestampRow.querySelector('select');
    let syncing = false;
    const isMilliseconds = (raw) => {
      const hint = ((unitSelect?.value || '') + ' ' + (unitSelect?.selectedOptions?.[0]?.textContent || '')).toLowerCase();
      if (/毫秒|milli|(^|[^a-z])ms([^a-z]|$)/.test(hint)) return true;
      if (/秒|second|(^|[^a-z])s([^a-z]|$)/.test(hint) && !/毫秒|milli|ms/.test(hint)) return false;
      return Math.abs(Number(raw)) >= 1e12;
    };
    const updateDateFromTimestamp = () => {
      if (syncing) return;
      const raw = String(timestampInput.value || '').trim().replaceAll(',', '');
      syncing = true;
      if (!raw || !Number.isFinite(Number(raw))) {
        dateInput.value = '';
      } else {
        const numeric = Number(raw);
        const date = new Date(isMilliseconds(raw) ? numeric : numeric * 1000);
        dateInput.value = Number.isNaN(date.getTime()) ? '' : localDateTime(date);
      }
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      syncing = false;
    };
    const updateTimestampFromDate = () => {
      if (syncing) return;
      syncing = true;
      const date = dateInput.value ? new Date(dateInput.value) : null;
      if (!date || Number.isNaN(date.getTime())) {
        timestampInput.value = '';
      } else {
        const millis = date.getTime();
        timestampInput.value = String(isMilliseconds('') ? millis : Math.floor(millis / 1000));
      }
      timestampInput.dispatchEvent(new Event('input', { bubbles: true }));
      timestampInput.dispatchEvent(new Event('change', { bubbles: true }));
      syncing = false;
    };
    timestampInput.addEventListener('input', updateDateFromTimestamp);
    timestampInput.addEventListener('change', updateDateFromTimestamp);
    dateInput.addEventListener('input', updateTimestampFromDate);
    dateInput.addEventListener('change', updateTimestampFromDate);
    unitSelect?.addEventListener('change', updateDateFromTimestamp);

    if (timestampInput.value) updateDateFromTimestamp();
    else updateTimestampFromDate();

    input.dataset.pairedLayout = 'true';
    inputGrid?.remove();
    input.replaceChildren(module);
    output.remove();
    frame.replaceChildren(input);
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; pairGroups(); });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once:true });
  else schedule();
})();