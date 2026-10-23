/* Timestamp page refinements: country/city controls and persistent city hiding. */
(() => {
  const HIDDEN_KEY = 'onebox.timestamp-hidden-cities.v1';
  const readHidden = () => {
    try { const value = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]'); return new Set(Array.isArray(value) ? value.map(String) : []); }
    catch { return new Set(); }
  };
  const writeHidden = (values) => {
    try { localStorage.setItem(HIDDEN_KEY, JSON.stringify([...values])); } catch {}
  };
  const addStyle = () => {
    if (document.getElementById('timestamp-layout-refinements')) return;
    const style = document.createElement('style');
    style.id = 'timestamp-layout-refinements';
    style.textContent = `
      .dev-timestamp-mode { border: 0 !important; border-radius: 0 !important; background: transparent !important; }
      .dev-timestamp-mode-bar { padding-inline: 12px; }
      .dev-timestamp-mode button.active::after { bottom: -1px !important; }
      .dev-timestamp-country-header-row, .dev-timestamp-city-row { column-gap: 10px !important; }
      .dev-timestamp-country-header-row { padding: 0 !important; border-bottom: 0 !important; background: transparent !important; }
      .dev-timestamp-country-header-cell {
        box-sizing: border-box; min-width: 0; border: 1px solid var(--line, #dce2ee) !important;
        border-bottom: 0 !important; border-radius: 10px 10px 0 0 !important; background: var(--panel, #fff) !important;
        padding: 0 10px !important; gap: 7px; transition: box-shadow .18s ease, transform .18s ease;
      }
      .dev-timestamp-country-header-cell.is-empty-country { border-bottom: 1px solid var(--line, #dce2ee) !important; border-radius: 10px !important; }
      .dev-timestamp-country-header-cell.is-dragging,
      .dev-timestamp-country-header-cell.is-long-press { opacity: 1 !important; }
      .dev-timestamp-country-header-cell.is-country-dragging {
        z-index: 3; background: color-mix(in srgb, var(--accent) 6%, var(--panel, #fff)) !important;
        box-shadow: 0 8px 22px #17255425; transform: translateY(-2px);
      }
      .dev-timestamp-city-cell.is-country-dragging {
        z-index: 2; opacity: 1 !important; transform: translateY(-2px);
        background: color-mix(in srgb, var(--accent) 4%, var(--panel, #fff));
        box-shadow: inset 2px 0 var(--accent), inset -2px 0 var(--accent);
      }
      .dev-timestamp-city-row.is-first-city-row .dev-timestamp-city-cell.is-country-dragging { box-shadow: inset 2px 0 var(--accent), inset -2px 0 var(--accent); }
      .dev-timestamp-city-cell.is-country-last-city.is-country-dragging { box-shadow: inset 2px 0 var(--accent), inset -2px 0 var(--accent), inset 0 -2px var(--accent); }
      .dev-timestamp-country-name { flex: 0 0 auto; }
      .dev-timestamp-country-add { flex: 0 0 auto; }
      .dev-timestamp-expand-cities { flex: 0 0 23px; margin-left: auto; }
      .dev-timestamp-expand-cities.is-no-extra-cities { opacity: .48; cursor: default; }
      .dev-timestamp-city-row { border: 0 !important; border-bottom: 0 !important; min-height: 0 !important; }
      .dev-timestamp-city-cell { box-sizing: border-box; min-width: 0; padding: 3px 10px 5px !important; border-left: 1px solid var(--line, #dce2ee); border-right: 1px solid var(--line, #dce2ee); border-bottom: 1px solid var(--line, #dce2ee); background: var(--panel, #fff); }
      .dev-timestamp-city-row.is-first-city-row .dev-timestamp-city-cell:not(.is-empty) { border-top: 1px solid var(--line, #dce2ee) !important; }
      .dev-timestamp-city-cell.is-country-last-city { border-radius: 0 0 10px 10px; }
      .dev-timestamp-city-cell.is-empty { border: 0 !important; background: transparent !important; }
      .dev-timestamp-city-card { position: relative; min-height: 56px !important; padding: 7px 0 !important; }
      .dev-timestamp-city-card-head { min-width: 0; display: flex !important; align-items: baseline !important; gap: 5px; white-space: nowrap; }
      .dev-timestamp-city-heading { display: flex; align-items: baseline; flex-wrap: nowrap; gap: 5px; min-width: 0; white-space: nowrap; }
      .dev-timestamp-city-name { flex: 0 0 auto; font-size: 13px !important; white-space: nowrap; }
      .dev-timestamp-city-zone.is-inline { display: inline !important; flex: 0 0 auto; min-width: 0; overflow: visible; white-space: nowrap; color: var(--muted, #697386); font-size: 8px !important; line-height: 1.25; }
      .dev-timestamp-city-zone.is-inline code { display: inline; font-size: inherit !important; }
      .dev-timestamp-city-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; }
      .dev-timestamp-city-actions { display: flex; align-items: center; justify-content: flex-end; gap: 2px; min-width: 0; }
      .dev-timestamp-city-time { display: block; margin-top: 0; font-size: 11px !important; white-space: nowrap; }
      .dev-timestamp-city-actions .dev-timestamp-city-copy,
      .dev-timestamp-city-actions .dev-timestamp-city-delete { position: static !important; inset: auto !important; flex: 0 0 18px; width: 18px !important; height: 18px !important; min-width: 18px; min-height: 18px !important; padding: 2px !important; opacity: .78; }
      .dev-timestamp-city-actions .dev-timestamp-city-delete { color: var(--muted, #697386) !important; }
      .dev-timestamp-city-delete:hover, .dev-timestamp-city-delete:focus-visible { color: #dc2626 !important; opacity: 1; }
      .dev-timestamp-city-delete svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      .dev-timestamp-city-cell.is-deleted { visibility: hidden !important; pointer-events: none !important; }
      .dev-timestamp-city-card.is-dragging { z-index: 3; box-shadow: 0 8px 24px #17255428; }
      .dev-timestamp-city-form-row.dev-timestamp-country-row.is-modal {
        position: fixed !important; inset: 0 !important; z-index: 9999 !important; display: grid !important;
        place-items: center; box-sizing: border-box; padding: calc(var(--app-header-height, 56px) + 12px) 16px 20px !important;
        margin: 0 !important; background: rgb(17 19 26 / .28) !important; backdrop-filter: blur(2px);
      }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form {
        box-sizing: border-box; display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 7px;
        width: min(100%, 400px); padding: 4px; border: 1px solid var(--line);
        border-radius: 10px; background: color-mix(in srgb, var(--soft) 10%, var(--panel));
        color: var(--ink); box-shadow: var(--shadow);
      }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form > strong {
        grid-column: 1 / -1; margin: 0; padding: 8px 9px; border-bottom: 1px solid var(--line);
        color: var(--ink); font-size: 12px; font-weight: 700;
      }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-country-select,
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form input {
        box-sizing: border-box; width: 100%; min-width: 0; min-height: 36px; padding: 6px 9px;
        border: 1px solid var(--line); border-radius: 8px; background: var(--panel);
        color: var(--ink); font: inherit; font-size: 12px;
      }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-country-select { grid-column: 1 / -1; }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form button {
        min-height: 30px; padding: 5px 8px; border: 1px solid var(--line); border-radius: 8px;
        background: var(--panel); color: var(--ink); font-size: 10px; cursor: pointer;
      }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form button:hover {
        background: var(--soft); border-color: color-mix(in srgb, var(--primary) 22%, var(--line));
      }
      @media (max-width: 480px) {
        .dev-timestamp-city-form-row.is-modal { padding: calc(var(--app-header-height, 56px) + 8px) 12px 12px !important; }
        .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form { width: 100%; }
      }
      @media (max-width: 720px) {
        .dev-timestamp-country-list { overflow-x: auto !important; }
        .dev-timestamp-country-matrix { min-width: max(100%, calc(var(--dev-timestamp-country-count, 1) * 210px)) !important; }
        .dev-timestamp-country-header-row, .dev-timestamp-city-row { column-gap: 8px !important; }
        .dev-timestamp-city-cell { padding-inline: 8px !important; }
        .dev-timestamp-city-card-head { gap: 4px; }
        .dev-timestamp-city-heading { gap: 4px; }
        .dev-timestamp-city-zone.is-inline { font-size: 8px !important; }
      }
    `;
    document.head.append(style);
  };
  const enhance = () => {
    addStyle();
    document.querySelectorAll('.dev-timestamp-country-list').forEach((list) => {
      const matrix = list.querySelector('.dev-timestamp-country-matrix');
      if (!matrix) return;
      const addForm = list.querySelector('.dev-timestamp-city-form-row');
      if (addForm) {
        const form = addForm.querySelector('.dev-timestamp-city-form');
        const title = addForm.querySelector('strong');
        addForm.classList.add('dev-timestamp-country-row');
        addForm.setAttribute('role', 'dialog');
        addForm.setAttribute('aria-modal', 'true');
        addForm.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Add a city' : '添加城市');
        if (form && title && title.parentElement !== form) form.prepend(title);
        if (form && !form.querySelector('.dev-timestamp-city-country-select')) {
          const select = document.createElement('select');
          select.className = 'dev-timestamp-city-country-select';
          select.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Country' : '选择国家');
          const currentKey = form.dataset.devCountryKey || form.querySelector('[data-dev-country-key]')?.dataset.devCountryKey || '';
          for (const header of matrix.querySelectorAll('.dev-timestamp-country-header-cell[data-dev-country-key]')) {
            const option = document.createElement('option');
            option.value = header.dataset.devCountryKey;
            option.textContent = header.querySelector('.dev-timestamp-country-name')?.textContent?.trim() || option.value;
            select.append(option);
          }
          select.value = currentKey;
          title.textContent = document.documentElement.lang === 'en' ? 'Add city' : '添加城市';
          form.insertBefore(select, form.querySelector('.dev-timestamp-city-name-input'));
        }
        const select = form?.querySelector('.dev-timestamp-city-country-select');
        const syncCountry = () => {
          const key = select?.value || '';
          if (form) form.dataset.devCountryKey = key;
          form?.querySelectorAll('[data-dev-action="timestamp-city-add"], [data-dev-action="timestamp-city-add-cancel"]').forEach((button) => {
            button.dataset.devCountryKey = key;
          });
        };
        if (select && !select.dataset.bound) {
          select.dataset.bound = 'true';
          select.addEventListener('change', syncCountry);
        }
        syncCountry();
        if (!addForm.classList.contains('is-modal')) {
          addForm.classList.add('is-modal');
          document.body.append(addForm);
          requestAnimationFrame(() => addForm.querySelector('.dev-timestamp-city-name-input')?.focus());
        }
      }
      matrix.querySelector('.dev-timestamp-city-row')?.classList.add('is-first-city-row');
      const headers = [...matrix.querySelectorAll('.dev-timestamp-country-header-cell[data-dev-country-key]')];
      for (const header of headers) {
        const key = header.dataset.devCountryKey;
        if (!header.querySelector('.dev-timestamp-expand-cities')) {
          const expandButton = document.createElement('button');
          expandButton.type = 'button';
          expandButton.className = 'dev-timestamp-icon-button dev-timestamp-expand-cities is-no-extra-cities';
          expandButton.disabled = true;
          expandButton.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'All cities are visible' : '所有城市均已显示');
          expandButton.title = document.documentElement.lang === 'en' ? 'All cities are visible' : '所有城市均已显示';
          expandButton.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
          header.append(expandButton);
        }
        const cityCells = [...matrix.querySelectorAll('.dev-timestamp-city-cell[data-dev-country-key="' + CSS.escape(key) + '"]')];
        cityCells.forEach((cell) => cell.classList.remove('is-country-last-city'));
        const cityCellsWithCards = cityCells.filter((cell) => {
          const card = cell.querySelector('.dev-timestamp-city-card[data-dev-city-id]');
          return card && !readHidden().has(card.dataset.devCityId);
        });
        header.classList.toggle('is-empty-country', cityCellsWithCards.length === 0);
        cityCellsWithCards[cityCellsWithCards.length - 1]?.classList.add('is-country-last-city');
        const firstAdd = cityCells.map((cell) => cell.querySelector('.dev-timestamp-city-add-inline')).find(Boolean);
        if (firstAdd) {
          firstAdd.classList.add('dev-timestamp-country-add');
          firstAdd.setAttribute('aria-label', (document.documentElement.lang === 'en' ? 'Add a city to ' : '添加城市到 ') + (header.querySelector('.dev-timestamp-country-name')?.textContent || ''));
          firstAdd.title = document.documentElement.lang === 'en' ? 'Add city' : '添加城市';
          const name = header.querySelector('.dev-timestamp-country-name');
          if (name && name.nextElementSibling !== firstAdd) name.insertAdjacentElement('afterend', firstAdd);
        }
        cityCells.forEach((cell) => {
          const add = cell.querySelector('.dev-timestamp-city-add-inline');
          if (add) add.remove();
          const card = cell.querySelector('.dev-timestamp-city-card[data-dev-city-id]');
          if (!card) return;
          const hidden = readHidden().has(card.dataset.devCityId);
          cell.classList.toggle('is-deleted', hidden);
          cell.toggleAttribute('aria-hidden', hidden);
          const cityName = card.querySelector('.dev-timestamp-city-name');
          const zone = card.querySelector('.dev-timestamp-city-zone');
          const head = card.querySelector('.dev-timestamp-city-card-head');
          if (zone && head && !zone.dataset.inlineReady) {
            zone.dataset.inlineReady = '1';
            zone.classList.add('is-inline');
            const value = [...zone.querySelectorAll('code')].map((item) => item.textContent.trim()).filter(Boolean).join(' · ');
            zone.replaceChildren(document.createTextNode(value));
            if (cityName && cityName.nextElementSibling !== zone) cityName.insertAdjacentElement('afterend', zone);
          }
          let actions = card.querySelector('.dev-timestamp-city-actions');
          if (head && !actions) {
            actions = document.createElement('span');
            actions.className = 'dev-timestamp-city-actions';
            head.append(actions);
          }
          let heading = card.querySelector('.dev-timestamp-city-heading');
          if (head && !heading) {
            heading = document.createElement('div');
            heading.className = 'dev-timestamp-city-heading';
            head.insertBefore(heading, cityName || head.firstChild);
          }
          if (heading && cityName && cityName.parentElement !== heading) heading.append(cityName);
          if (heading && zone && zone.parentElement !== heading) heading.append(zone);
          let footer = card.querySelector('.dev-timestamp-city-footer');
          if (!footer) {
            footer = document.createElement('div');
            footer.className = 'dev-timestamp-city-footer';
            card.append(footer);
          }
          const cityTime = card.querySelector('.dev-timestamp-city-time');
          if (cityTime && cityTime.parentElement !== footer) footer.append(cityTime);
          if (actions && actions.parentElement !== footer) footer.append(actions);
          const copyButton = card.querySelector('.dev-timestamp-city-copy');
          if (copyButton && actions && copyButton.parentElement !== actions) actions.append(copyButton);
          if (!card.querySelector('.dev-timestamp-city-delete')) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'dev-timestamp-icon-button dev-timestamp-city-delete';
            button.dataset.devCityNoDrag = 'true';
            button.dataset.cityId = card.dataset.devCityId;
            button.setAttribute('aria-label', (document.documentElement.lang === 'en' ? 'Delete ' : '删除城市 ') + (cityName?.textContent || ''));
            button.title = document.documentElement.lang === 'en' ? 'Delete city' : '删除城市';
            button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 4v5m4-5v5"/></svg>';
            actions?.append(button);
          }
        });
      }
    });
  };
  document.addEventListener('click', (event) => {
    const modal = event.target.closest?.('.dev-timestamp-city-form-row.is-modal');
    if (!modal) return;
    if (event.target === modal) {
      event.preventDefault();
      event.stopImmediatePropagation();
      modal.querySelector('[data-dev-action="timestamp-city-add-cancel"]')?.click();
      return;
    }
    const action = event.target.closest?.('[data-dev-action="timestamp-city-add"], [data-dev-action="timestamp-city-add-cancel"]');
    if (!action) return;
    const list = document.querySelector('.dev-timestamp-country-list');
    if (!list) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    modal.classList.remove('is-modal');
    list.append(modal);
    action.click();
    if (action.dataset.devAction === 'timestamp-city-add') {
      setTimeout(() => {
        if (!modal.isConnected || !modal.closest('.dev-timestamp-country-list')) return;
        modal.classList.add('is-modal');
        document.body.append(modal);
        modal.querySelector('.dev-timestamp-city-name-input')?.focus();
      }, 0);
    }
  }, true);
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    document.querySelector('.dev-timestamp-city-form-row.is-modal [data-dev-action="timestamp-city-add-cancel"]')?.click();
  });
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.dev-timestamp-city-delete[data-city-id]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const hidden = readHidden();
    hidden.add(button.dataset.cityId);
    writeHidden(hidden);
    const cell = button.closest('.dev-timestamp-city-cell');
    if (cell) {
      cell.classList.add('is-deleted');
      cell.setAttribute('aria-hidden', 'true');
    }
  }, true);
  const syncCountryDragGroup = (header) => {
    const matrix = header?.closest('.dev-timestamp-country-matrix');
    const key = header?.dataset?.devCountryKey;
    if (!matrix || !key) return;
    const active = header.classList.contains('is-dragging') || header.classList.contains('is-long-press');
    header.classList.toggle('is-country-dragging', active);
    matrix.querySelectorAll('.dev-timestamp-city-cell[data-dev-country-key="' + CSS.escape(key) + '"]').forEach((cell) => {
      cell.classList.toggle('is-country-dragging', active);
    });
  };
  const dragStateObserver = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.target.matches?.('.dev-timestamp-country-header-cell[data-dev-country-key]')) syncCountryDragGroup(record.target);
    });
  });
  dragStateObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'], subtree: true });
  document.querySelectorAll('.dev-timestamp-country-header-cell[data-dev-country-key]').forEach(syncCountryDragGroup);
  const observer = new MutationObserver(() => {
    if (document.querySelector('.dev-timestamp-country-list')) requestAnimationFrame(enhance);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once: true });
  else enhance();
})();
