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
      .dev-timestamp-country-header-row { padding: 0 0 8px !important; }
      .dev-timestamp-country-header-cell {
        box-sizing: border-box; min-width: 0; border: 1px solid var(--line, #dce2ee) !important;
        border-radius: 10px !important; background: var(--panel, #fff) !important;
        padding: 0 10px !important; gap: 7px; transition: box-shadow .18s ease, transform .18s ease;
      }
      .dev-timestamp-country-header-cell.is-dragging { z-index: 3; box-shadow: 0 10px 26px #17255425; transform: scale(1.025); }
      .dev-timestamp-country-name { flex: 0 0 auto; }
      .dev-timestamp-country-add { flex: 0 0 auto; }
      .dev-timestamp-city-row { border: 0 !important; min-height: 0 !important; }
      .dev-timestamp-city-cell { box-sizing: border-box; min-width: 0; padding: 3px 10px 5px !important; border-bottom: 1px solid var(--line, #dce2ee); }
      .dev-timestamp-city-card { position: relative; min-height: 56px !important; padding: 7px 54px 7px 0 !important; }
      .dev-timestamp-city-card-head { min-width: 0; display: flex; align-items: baseline; gap: 7px; padding-right: 0; }
      .dev-timestamp-city-name { flex: 0 0 auto; font-size: 13px !important; }
      .dev-timestamp-city-zone.is-inline { display: block !important; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: var(--muted, #697386); font-size: 10px !important; }
      .dev-timestamp-city-zone.is-inline code { display: inline; font-size: inherit !important; }
      .dev-timestamp-city-time { display: block; margin-top: 4px; font-size: 12px !important; }
      .dev-timestamp-city-copy { right: 0 !important; top: 4px !important; }
      .dev-timestamp-city-delete { position: absolute; top: 4px; right: 28px; z-index: 2; width: 22px !important; height: 22px !important; padding: 3px !important; color: var(--muted, #697386) !important; opacity: .72; }
      .dev-timestamp-city-delete:hover, .dev-timestamp-city-delete:focus-visible { color: #dc2626 !important; opacity: 1; }
      .dev-timestamp-city-delete svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      .dev-timestamp-city-cell.is-deleted { visibility: hidden !important; pointer-events: none !important; }
      .dev-timestamp-city-card.is-dragging { z-index: 3; box-shadow: 0 8px 24px #17255428; }
      .dev-timestamp-city-form-row.dev-timestamp-country-row { padding: 10px 12px !important; }
      @media (max-width: 720px) {
        .dev-timestamp-country-list { overflow-x: auto !important; }
        .dev-timestamp-country-matrix { min-width: max(100%, calc(var(--dev-timestamp-country-count, 1) * 210px)) !important; }
        .dev-timestamp-country-header-row, .dev-timestamp-city-row { column-gap: 8px !important; }
        .dev-timestamp-city-cell { padding-inline: 8px !important; }
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
      list.querySelector('.dev-timestamp-city-form-row')?.classList.add('dev-timestamp-country-row');
      const headers = [...matrix.querySelectorAll('.dev-timestamp-country-header-cell[data-dev-country-key]')];
      for (const header of headers) {
        const key = header.dataset.devCountryKey;
        const cityCells = [...matrix.querySelectorAll('.dev-timestamp-city-cell[data-dev-country-key="' + CSS.escape(key) + '"]')];
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
          if (!card.querySelector('.dev-timestamp-city-delete')) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'dev-timestamp-icon-button dev-timestamp-city-delete';
            button.dataset.devCityNoDrag = 'true';
            button.dataset.cityId = card.dataset.devCityId;
            button.setAttribute('aria-label', (document.documentElement.lang === 'en' ? 'Delete ' : '删除城市 ') + (cityName?.textContent || ''));
            button.title = document.documentElement.lang === 'en' ? 'Delete city' : '删除城市';
            button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 4v5m4-5v5"/></svg>';
            head?.append(button);
          }
        });
      }
    });
  };
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
  const observer = new MutationObserver(() => {
    if (document.querySelector('.dev-timestamp-country-list')) requestAnimationFrame(enhance);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once: true });
  else enhance();
})();
