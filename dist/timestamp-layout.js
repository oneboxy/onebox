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
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-search-wrap { position: relative; grid-column: 1 / -1; min-width: 0; }
      .dev-timestamp-city-form-row.is-modal .dev-timestamp-city-search-wrap > input { width: 100%; }
      .dev-timestamp-city-search-results {
        position: relative; z-index: 1; max-height: min(180px, 30vh); overflow: auto; margin-top: 4px;
        padding: 4px; border: 1px solid var(--line); border-radius: 9px;
        background: var(--panel); box-shadow: var(--shadow);
      }
      .dev-timestamp-city-search-results[hidden] { display: none !important; }
      .dev-timestamp-city-search-option {
        display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%;
        min-height: 34px; padding: 6px 8px; border: 0 !important; border-radius: 6px !important;
        background: transparent !important; color: var(--ink); text-align: left; cursor: pointer;
      }
      .dev-timestamp-city-search-option:hover,
      .dev-timestamp-city-search-option:focus-visible { background: var(--soft) !important; outline: none; }
      .dev-timestamp-city-search-option code { color: var(--muted); font-size: 10px; }
      .dev-timestamp-city-search-empty { padding: 10px 8px; color: var(--muted); font-size: 11px; }
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
  const modalLayoutProperties = ['position', 'inset', 'width', 'height', 'display', 'align-items', 'justify-content', 'box-sizing', 'padding', 'margin', 'z-index', 'background', 'backdrop-filter'];
  const centerModal = (modal) => {
    modal.style.setProperty('position', 'fixed', 'important');
    modal.style.setProperty('inset', '0', 'important');
    modal.style.setProperty('width', '100vw', 'important');
    modal.style.setProperty('height', '100vh', 'important');
    modal.style.setProperty('height', '100dvh', 'important');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('align-items', 'center', 'important');
    modal.style.setProperty('justify-content', 'center', 'important');
    modal.style.setProperty('box-sizing', 'border-box', 'important');
    modal.style.setProperty('padding', 'calc(var(--app-header-height, 56px) + 12px) 16px 20px', 'important');
    modal.style.setProperty('margin', '0', 'important');
    modal.style.setProperty('z-index', '9999', 'important');
    modal.style.setProperty('background', 'rgb(17 19 26 / .28)', 'important');
    modal.style.setProperty('backdrop-filter', 'blur(2px)', 'important');
    const panel = modal.querySelector('.dev-timestamp-city-form');
    if (!panel) return;
    panel.style.setProperty('flex', '0 1 400px', 'important');
    panel.style.setProperty('width', 'min(100%, 400px)', 'important');
    panel.style.setProperty('max-height', 'calc(100dvh - 80px)', 'important');
    panel.style.setProperty('overflow-y', 'auto', 'important');
  };
  const clearModalPosition = (modal) => {
    modalLayoutProperties.forEach((property) => modal.style.removeProperty(property));
    const panel = modal.querySelector('.dev-timestamp-city-form');
    ['flex', 'width', 'max-height', 'overflow-y'].forEach((property) => panel?.style.removeProperty(property));
  };
  const EXTRA_CITY_OPTIONS = [
    ['美国', [['西雅图', 'Seattle', 'America/Los_Angeles'], ['旧金山', 'San Francisco', 'America/Los_Angeles'], ['拉斯维加斯', 'Las Vegas', 'America/Los_Angeles'], ['凤凰城', 'Phoenix', 'America/Phoenix'], ['休斯敦', 'Houston', 'America/Chicago'], ['迈阿密', 'Miami', 'America/New_York'], ['波士顿', 'Boston', 'America/New_York']]],
    ['日本', [['京都', 'Kyoto', 'Asia/Tokyo'], ['札幌', 'Sapporo', 'Asia/Tokyo'], ['福冈', 'Fukuoka', 'Asia/Tokyo']]],
    ['英国', [['曼彻斯特', 'Manchester', 'Europe/London'], ['爱丁堡', 'Edinburgh', 'Europe/London'], ['伯明翰', 'Birmingham', 'Europe/London']]],
    ['德国', [['慕尼黑', 'Munich', 'Europe/Berlin'], ['法兰克福', 'Frankfurt', 'Europe/Berlin'], ['汉堡', 'Hamburg', 'Europe/Berlin']]],
    ['加拿大', [['蒙特利尔', 'Montreal', 'America/Toronto'], ['卡尔加里', 'Calgary', 'America/Edmonton'], ['温哥华', 'Vancouver', 'America/Vancouver'], ['渥太华', 'Ottawa', 'America/Toronto']]],
    ['中国', [['成都', 'Chengdu', 'Asia/Shanghai'], ['深圳', 'Shenzhen', 'Asia/Shanghai'], ['重庆', 'Chongqing', 'Asia/Shanghai'], ['乌鲁木齐', 'Urumqi', 'Asia/Urumqi']]],
    ['越南', [['河内', 'Hanoi', 'Asia/Ho_Chi_Minh'], ['岘港', 'Da Nang', 'Asia/Ho_Chi_Minh']]],
  ];
  const normalizeSearch = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().replace(/[\s_./-]+/g, '');
  const fuzzyScore = (query, candidate) => {
    if (!query) return 1;
    const q = normalizeSearch(query);
    const text = normalizeSearch(candidate);
    const direct = text.indexOf(q);
    if (direct >= 0) return 1000 - direct;
    let at = 0;
    for (const char of q) {
      at = text.indexOf(char, at);
      if (at < 0) return 0;
      at += 1;
    }
    return 100 - text.length;
  };
  const cityOptionsFor = (matrix, countryKey, countryName) => {
    const options = [];
    const seen = new Set();
    const add = (name, timeZone, aliases = []) => {
      if (!name || !timeZone || seen.has(name.toLocaleLowerCase())) return;
      seen.add(name.toLocaleLowerCase());
      options.push({ name, timeZone, aliases: [name, timeZone, timeZone.split('/').pop().replace(/_/g, ' '), ...aliases] });
    };
    const existing = new Set();
    matrix.querySelectorAll('.dev-timestamp-city-cell[data-dev-country-key="' + CSS.escape(countryKey) + '"] .dev-timestamp-city-card[data-dev-city-id]').forEach((card) => {
      const name = card.querySelector('.dev-timestamp-city-name')?.textContent?.trim();
      const zoneText = card.querySelector('.dev-timestamp-city-zone')?.textContent || '';
      const timeZone = zoneText.match(/(?:Africa|America|Antarctica|Asia|Atlantic|Australia|Europe|Indian|Pacific)\/[A-Za-z0-9_+.-]+(?:\/[A-Za-z0-9_+.-]+)*/)?.[0];
      if (name) existing.add(name.toLocaleLowerCase());
      add(name, timeZone);
    });
    const extras = EXTRA_CITY_OPTIONS.find(([country]) => countryName.includes(country))?.[1] || [];
    extras.forEach(([name, alias, timeZone]) => add(name, timeZone, [alias]));
    return options.filter((option) => !existing.has(option.name.toLocaleLowerCase()));
  };
  const installCitySearch = (form, matrix) => {
    const nameInput = form.querySelector('.dev-timestamp-city-name-input');
    const zoneInput = form.querySelector('.dev-timestamp-city-zone-input');
    const countrySelect = form.querySelector('.dev-timestamp-city-country-select');
    const addButton = form.querySelector('[data-dev-action="timestamp-city-add"]');
    if (!nameInput || !zoneInput || !countrySelect || nameInput.dataset.fuzzyReady) return;
    nameInput.dataset.fuzzyReady = '1';
    nameInput.placeholder = document.documentElement.lang === 'en' ? 'Search for a city' : '模糊搜索城市名称或时区';
    nameInput.setAttribute('autocomplete', 'off');
    zoneInput.type = 'hidden';
    zoneInput.setAttribute('aria-hidden', 'true');
    const wrap = document.createElement('div');
    wrap.className = 'dev-timestamp-city-search-wrap';
    nameInput.parentNode.insertBefore(wrap, nameInput);
    wrap.append(nameInput);
    const results = document.createElement('div');
    results.className = 'dev-timestamp-city-search-results';
    results.setAttribute('role', 'listbox');
    results.hidden = true;
    wrap.append(results);
    const closeResults = () => { results.hidden = true; results.replaceChildren(); };
    const search = () => {
      const countryKey = countrySelect.value;
      const header = matrix.querySelector('.dev-timestamp-country-header-cell[data-dev-country-key="' + CSS.escape(countryKey) + '"]');
      const countryName = header?.querySelector('.dev-timestamp-country-name')?.textContent?.trim() || '';
      const options = cityOptionsFor(matrix, countryKey, countryName);
      const query = nameInput.value.trim();
      if (!query) {
        closeResults();
        return;
      }
      const matches = options.map((option) => ({ option, score: Math.max(...option.aliases.map((alias) => fuzzyScore(query, alias))) }))
        .filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
      results.replaceChildren();
      if (!matches.length) {
        if (query) {
          const empty = document.createElement('div');
          empty.className = 'dev-timestamp-city-search-empty';
          empty.textContent = document.documentElement.lang === 'en' ? 'No matching cities' : '没有匹配的城市';
          results.append(empty);
        }
      } else {
        matches.forEach(({ option }) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'dev-timestamp-city-search-option';
          button.setAttribute('role', 'option');
          const city = document.createElement('span');
          city.textContent = option.name;
          const zone = document.createElement('code');
          zone.textContent = option.timeZone;
          button.append(city, zone);
          button.addEventListener('pointerdown', (event) => event.preventDefault());
          button.addEventListener('click', () => {
            nameInput.value = option.name;
            zoneInput.value = option.timeZone;
            if (addButton) addButton.disabled = false;
            closeResults();
          });
          results.append(button);
        });
      }
      results.hidden = false;
    };
    nameInput.addEventListener('input', () => {
      zoneInput.value = '';
      if (addButton) addButton.disabled = true;
      search();
    });
    nameInput.addEventListener('focus', search);
    countrySelect.addEventListener('change', () => {
      nameInput.value = '';
      zoneInput.value = '';
      if (addButton) addButton.disabled = true;
      closeResults();
    });
    form.addEventListener('submit', (event) => event.preventDefault());
    if (addButton) addButton.disabled = true;
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
        if (form) installCitySearch(form, matrix);
        if (!addForm.classList.contains('is-modal')) {
          addForm.classList.add('is-modal');
          centerModal(addForm);
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
    clearModalPosition(modal);
    list.append(modal);
    action.click();
    if (action.dataset.devAction === 'timestamp-city-add') {
      setTimeout(() => {
        if (!modal.isConnected || !modal.closest('.dev-timestamp-country-list')) return;
        modal.classList.add('is-modal');
        centerModal(modal);
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
