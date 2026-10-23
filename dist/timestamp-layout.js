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
      .dev-timestamp-city-row { border: 0 !important; border-bottom: 0 !important; min-height: 0 !important; }
      .dev-timestamp-city-cell { box-sizing: border-box; min-width: 0; padding: 3px 10px 5px !important; border-left: 1px solid var(--line, #dce2ee); border-right: 1px solid var(--line, #dce2ee); border-bottom: 1px solid var(--line, #dce2ee); background: var(--panel, #fff); }
      .dev-timestamp-city-row.is-first-city-row .dev-timestamp-city-cell:not(.is-empty) { border-top: 0 !important; }
      .dev-timestamp-city-cell.is-country-last-city { border-radius: 0 0 10px 10px; }
      .dev-timestamp-city-cell.is-empty { border: 0 !important; background: transparent !important; }
      .dev-timestamp-city-card { position: relative; min-height: 56px !important; padding: 7px 0 !important; }
      .dev-timestamp-city-card-head { min-width: 0; display: grid !important; grid-template-columns: minmax(0, 1fr) 42px; grid-template-areas: "name actions" "zone actions"; align-items: start !important; gap: 3px 5px; }
      .dev-timestamp-city-name { grid-area: name; min-width: 0; font-size: 13px !important; white-space: nowrap; }
      .dev-timestamp-city-zone.is-inline { grid-area: zone; display: block !important; min-width: 0; overflow: visible; white-space: normal; overflow-wrap: anywhere; word-break: break-word; color: var(--muted, #697386); font-size: 10px !important; line-height: 1.3; }
      .dev-timestamp-city-zone.is-inline code { display: inline; font-size: inherit !important; }
      .dev-timestamp-city-actions { grid-area: actions; display: flex; align-items: flex-start; justify-content: flex-end; gap: 2px; min-width: 0; }
      .dev-timestamp-city-actions .dev-timestamp-city-copy,
      .dev-timestamp-city-actions .dev-timestamp-city-delete { position: static !important; inset: auto !important; flex: 0 0 18px; width: 18px !important; height: 18px !important; min-width: 18px; min-height: 18px !important; padding: 2px !important; opacity: .78; }
      .dev-timestamp-city-actions .dev-timestamp-city-delete { color: var(--muted, #697386) !important; }
      .dev-timestamp-city-delete:hover, .dev-timestamp-city-delete:focus-visible { color: #dc2626 !important; opacity: 1; }
      .dev-timestamp-city-delete svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      .dev-timestamp-city-cell.is-deleted { visibility: hidden !important; pointer-events: none !important; }
      .dev-timestamp-city-card.is-dragging { z-index: 3; box-shadow: 0 8px 24px #17255428; }
      .dev-timestamp-city-form-row.dev-timestamp-country-row.is-modal {
        position: fixed !important; inset: 0 !important; z-index: 9999 !important; display: grid !important;
        align-content: center; justify-items: center; gap: 12px; padding: 24px !important;
        margin: 0 !important; background: rgb(15 23 42 / .42) !important; backdrop-filter: blur(3px);
      }
      .dev-timestamp-city-form-row.is-modal > strong { display: block; width: min(100%, 440px); padding: 0 2px; color: #fff; font-size: 16px; }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form {
        box-sizing: border-box; display: grid !important; grid-template-columns: 1fr 1fr; gap: 10px;
        width: min(100%, 440px); padding: 18px; border: 1px solid var(--line, #dce2ee);
        border-radius: 14px; background: var(--panel, #fff); box-shadow: 0 20px 60px #0f172a35;
      }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form input { min-width: 0; width: 100%; }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form button { min-height: 40px; }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form button:first-of-type { grid-column: 1; }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-form button:last-of-type { grid-column: 2; }
      @media (max-width: 720px) {
        .dev-timestamp-country-list { overflow-x: auto !important; }
        .dev-timestamp-country-matrix { min-width: max(100%, calc(var(--dev-timestamp-country-count, 1) * 210px)) !important; }
        .dev-timestamp-country-header-row, .dev-timestamp-city-row { column-gap: 8px !important; }
        .dev-timestamp-city-cell { padding-inline: 8px !important; }
        .dev-timestamp-city-card-head { grid-template-columns: minmax(0, 1fr) 38px; gap: 3px 4px; }
        .dev-timestamp-city-actions { gap: 2px; }
        .dev-timestamp-city-card-head { gap: 5px; }
        .dev-timestamp-city-zone.is-inline { font-size: 9px !important; }
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
        addForm.classList.add('dev-timestamp-country-row');
        addForm.setAttribute('role', 'dialog');
        addForm.setAttribute('aria-modal', 'true');
        addForm.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Add a city' : '添加城市');
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
          let actions = head?.querySelector('.dev-timestamp-city-actions');
          if (head && !actions) {
            actions = document.createElement('span');
            actions.className = 'dev-timestamp-city-actions';
            head.append(actions);
          }
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
      modal.querySelector('[data-dev-action="timestamp-city-add-cancel"]')?.click();
      return;
    }
    const action = event.target.closest?.('[data-dev-action="timestamp-city-add"], [data-dev-action="timestamp-city-add-cancel"]');
    if (!action) return;
    const list = document.querySelector('.dev-timestamp-country-list');
    if (!list) return;
    modal.classList.remove('is-modal');
    list.append(modal);
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
