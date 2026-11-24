(function () {
  'use strict';
  const scope = '#workspace[data-tool="dev"] .dev-workbench.dev-timestamp';
  const styleId = 'timestamp-input-output-frame-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent =
      scope + ' .dev-timestamp-content{display:grid;grid-template-columns:minmax(0,1fr)!important;grid-auto-rows:max-content!important;gap:12px!important}' +
      scope + ' .dev-timestamp-input-output-frame{display:block;width:100%;min-width:0;box-sizing:border-box;padding:0;border:0;background:transparent;box-shadow:none}' +
      '@media(max-width:760px){' +
      scope + ' .dev-timestamp-card[data-unified-layout="true"]{padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}' +
      scope + ' .dev-timestamp-bidirectional{display:grid!important;gap:8px!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}' +
      scope + ' .dev-timestamp-bidirectional-title{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:6px!important;margin:0!important;font-size:14px!important;line-height:1.3!important}' +
      scope + ' .dev-timestamp-bidirectional-title .dev-timestamp-bidirectional-swap{flex:0 0 26px!important;width:26px!important;min-width:26px!important;height:26px!important;min-height:26px!important;padding:0!important;border:0!important;background:transparent!important;color:var(--muted)!important;font-size:18px!important}' +
      scope + ' .dev-timestamp-bidirectional-fields{display:grid!important;grid-template-columns:minmax(0,37%) minmax(0,37%)!important;justify-content:space-between!important;align-items:end!important;gap:7px!important}' +
      scope + ' .dev-timestamp-bidirectional-field{display:flex!important;min-width:0!important;flex-direction:column!important;gap:0!important}' +
      scope + ' .dev-timestamp-bidirectional-label{display:none!important}' +
      scope + ' .dev-timestamp-bidirectional-field>.dev-timestamp-input-row{display:block!important;width:100%!important;min-width:0!important;margin:0!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-datetime .dev-timestamp-datetime-trigger,' +
      scope + ' .dev-timestamp-bidirectional-field.is-timestamp .dev-timestamp-input-shell{box-sizing:border-box!important;width:100%!important;min-width:0!important;height:36px!important;min-height:36px!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-datetime .dev-timestamp-datetime-trigger{justify-content:flex-start!important;padding:4px 22px!important;font-size:9px!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-datetime .dev-timestamp-datetime-trigger svg{right:auto!important;left:6px!important;width:14px!important;height:14px!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-datetime .dev-timestamp-datetime-clear{right:2px!important;width:20px!important;min-width:20px!important;height:20px!important;min-height:20px!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-timestamp .dev-timestamp-input-shell>.dev-plain-input{box-sizing:border-box!important;width:100%!important;min-width:0!important;padding:4px 70px 4px 7px!important;font-size:10px!important;font-variant-numeric:tabular-nums}' +
      scope + ' .dev-timestamp-bidirectional-field.is-timestamp .dev-timestamp-unit-picker{right:24px!important;width:48px!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-timestamp .dev-timestamp-unit-trigger{display:flex!important;justify-content:center!important;white-space:nowrap!important;width:48px!important;min-height:24px!important;padding:2px!important;font-size:9px!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-timestamp .dev-timestamp-unit-trigger svg{width:10px!important;height:10px!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-timestamp .dev-timestamp-field-icon.is-clear{right:0!important;width:21px!important;min-width:21px!important;height:21px!important;min-height:21px!important;padding:4px!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-timestamp .dev-timestamp-live-button{width:max-content!important;height:22px!important;min-height:22px!important;margin:2px 0 0!important;padding:1px 4px!important;border:0!important;background:transparent!important;color:var(--muted)!important;font-size:10px!important}' +
      scope + ' .dev-timestamp-bidirectional>.dev-timestamp-result-block{max-height:116px!important;min-height:0!important;margin:2px 0 0!important;padding:4px 0 0!important;overflow:auto!important;border:0!important;border-top:1px solid var(--line)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}' +
      scope + ' .dev-timestamp-bidirectional .dev-timestamp-standard-grid{display:grid!important;grid-template-columns:minmax(0,1fr)!important;max-height:110px!important;gap:0!important;overflow:auto!important}' +
      scope + ' .dev-timestamp-bidirectional .dev-timestamp-summary-card{display:grid!important;grid-template-columns:max-content minmax(0,1fr) 22px!important;grid-template-rows:minmax(0,1fr)!important;align-items:center!important;gap:6px!important;box-sizing:border-box!important;min-height:32px!important;padding:2px 0!important;border:0!important;border-bottom:1px solid var(--line)!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}' +
      scope + ' .dev-timestamp-bidirectional .dev-timestamp-summary-card>span{grid-column:1!important;grid-row:1!important;white-space:nowrap!important;font-size:10px!important;color:var(--muted)!important}' +
      scope + ' .dev-timestamp-bidirectional .dev-timestamp-summary-card>code{grid-column:2!important;grid-row:1!important;min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;text-align:left!important;font-size:11px!important}' +
      scope + ' .dev-timestamp-bidirectional .dev-timestamp-summary-card .dev-timestamp-row-copy{grid-column:3!important;grid-row:1!important;justify-self:end!important;width:20px!important;min-width:20px!important;height:20px!important;min-height:20px!important;padding:3px!important;border:0!important;background:transparent!important;color:var(--muted)!important}' +
      '}' +
      '@media(max-width:430px){' +
      scope + ' .dev-timestamp-bidirectional-fields{grid-template-columns:minmax(0,132px) minmax(0,132px)!important;justify-content:space-between!important;gap:4px!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-datetime .dev-timestamp-datetime-trigger{font-size:8.5px!important}' +
      scope + ' .dev-timestamp-bidirectional-field.is-timestamp .dev-timestamp-input-shell>.dev-plain-input{font-size:9px!important}' +
      '}';
    document.head.appendChild(style);
  }
  const localDateTime = (date) =>
    date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' +
    String(date.getDate()).padStart(2, '0') + 'T' +
    String(date.getHours()).padStart(2, '0') + ':' +
    String(date.getMinutes()).padStart(2, '0') + ':' +
    String(date.getSeconds()).padStart(2, '0');

  const updateCityClocks = (date) => {
    document.querySelectorAll('.dev-timestamp-city-card').forEach((card) => {
      const time = card.querySelector('.dev-timestamp-city-time');
      const zoneText = card.querySelector('.dev-timestamp-city-zone')?.textContent || '';
      const zone = zoneText.match(/(?:Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z0-9_+.-]+(?:\/[A-Za-z0-9_+.-]+)*/)?.[0];
      if (!time || !zone) return;
      try {
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
          timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
        }).formatToParts(date).map((part) => [part.type, part.value]));
        time.textContent = parts.year + '/' + parts.month + '/' + parts.day + ' ' + parts.hour + ':' + parts.minute + ':' + parts.second;
      } catch {}
    });
  };
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
    timestampInput.setAttribute('aria-label', /^en(?:-|$)/i.test(document.documentElement.lang || '') ? 'Timestamp' : '时间戳');

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
        const now = Date.now();
        const milliseconds = /毫秒|milli|(^|[^a-z])ms([^a-z]|$)/.test(unitHint());
        writingNow = true;
        timestampInput.value = String(milliseconds ? now : Math.floor(now / 1000));
        dateInput.value = localDateTime(new Date(now));
        timestampInput.dispatchEvent(new Event('input', { bubbles: true }));
        timestampInput.dispatchEvent(new Event('change', { bubbles: true }));
        dateInput.dispatchEvent(new Event('input', { bubbles: true }));
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        updateCityClocks(new Date(now));
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
    const titleDate = document.createElement('span');
    titleDate.textContent = '时间';
    const titleTimestamp = document.createElement('span');
    titleTimestamp.textContent = '时间戳';
    const swapButton = document.createElement('button');
    swapButton.type = 'button';
    swapButton.className = 'dev-timestamp-bidirectional-swap';
    swapButton.setAttribute('aria-label', '交换时间和时间戳的位置');
    swapButton.title = '交换时间和时间戳的位置';
    swapButton.setAttribute('aria-pressed', 'false');
    swapButton.textContent = '⇄';
    title.append(titleDate, swapButton, titleTimestamp);
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
    swapButton.addEventListener('click', () => {
      const reversed = fields.classList.toggle('is-reversed');
      title.classList.toggle('is-reversed', reversed);
      swapButton.setAttribute('aria-pressed', String(reversed));
    });
    fields.append(dateField, timestampField);
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
    // Keep the complete output pane attached. It contains the reverse conversion,
    // world clocks, history and copy/save actions; dropping it also drops those features.
    frame.replaceChildren(input, output);
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
