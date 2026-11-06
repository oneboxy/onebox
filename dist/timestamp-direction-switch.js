(function () {
  'use strict';
  let direction = 'timestamp';
  const pad = (n) => String(n).padStart(2, '0');
  const emit = (input) => {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const timestampUnit = (card, value) => {
    const select = card.querySelector('select');
    const selected = select?.selectedOptions?.[0]?.textContent || '';
    if (/毫秒|millisecond|\bms\b/i.test(selected)) return 'ms';
    if (/秒|second/i.test(selected)) return 's';
    return String(value).replace(/\D/g, '').length > 10 ? 'ms' : 's';
  };
  const cardsFor = (grid) => [...grid.querySelectorAll('.dev-timestamp-input-card')];
  const cardDirection = (card) => {
    const label = [...card.children].map((el) => el.textContent.trim()).find((text) => /时间戳|timestamp|日期/.test(text)) || card.textContent;
    return /日期\s*(?:→|->|至|到)\s*时间戳|date\s*(?:→|->|to)\s*timestamp/i.test(label) ? 'date' : 'timestamp';
  };
  const dateInputValue = (date, input) => {
    if (!Number.isFinite(date.getTime())) return '';
    const local = date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
    return input.type === 'date' ? local : local + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
  };
  const switchValue = (from, to, currentDirection) => {
    const fromInput = from.querySelector('input');
    const toInput = to.querySelector('input');
    if (!fromInput || !toInput || !fromInput.value.trim()) return;
    if (currentDirection === 'timestamp') {
      const raw = Number(fromInput.value);
      if (!Number.isFinite(raw)) return;
      const unit = timestampUnit(from, fromInput.value);
      const date = new Date(unit === 's' ? raw * 1000 : raw);
      toInput.value = dateInputValue(date, toInput);
    } else {
      const date = new Date(fromInput.value);
      if (!Number.isFinite(date.getTime())) return;
      const currentTimestamp = toInput.value.trim();
      const unit = timestampUnit(to, currentTimestamp);
      const stamp = date.getTime() / (unit === 's' ? 1000 : 1);
      toInput.value = String(Math.trunc(stamp));
    }
    emit(toInput);
  };
  const addStyles = () => {
    if (document.getElementById('timestamp-single-input-style')) return;
    const style = document.createElement('style');
    style.id = 'timestamp-single-input-style';
    style.textContent = [
      '.dev-workbench.dev-timestamp .dev-timestamp-input-grid { grid-template-columns:minmax(0,1fr)!important; }',
      '.dev-workbench.dev-timestamp .dev-timestamp-input-card.is-direction-inactive { display:none!important; }',
      '.dev-workbench.dev-timestamp .dev-timestamp-direction-switch { display:inline-grid; flex:0 0 36px; width:36px; height:36px; place-items:center; padding:0; border:1px solid var(--line); border-radius:10px; background:var(--panel-2); color:var(--primary); cursor:pointer; }',
      '.dev-workbench.dev-timestamp .dev-timestamp-direction-switch svg { width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }',
      '.dev-workbench.dev-timestamp .dev-timestamp-direction-switch:hover { background:var(--soft); }',
      '.dev-workbench.dev-timestamp .dev-timestamp-result-block.is-direction-inactive { display:none!important; }',
      '@media(max-width:760px){.dev-workbench.dev-timestamp .dev-timestamp-input-grid{gap:0!important} .dev-workbench.dev-timestamp .dev-timestamp-direction-switch{width:34px;height:34px;flex-basis:34px}}'
    ].join('\n');
    document.head.appendChild(style);
  };
  const enhance = () => {
    const grid = document.querySelector('.dev-workbench.dev-timestamp .dev-timestamp-input-grid');
    const head = document.querySelector('.dev-workbench.dev-timestamp .dev-timestamp-input-head');
    if (!grid || !head) return;
    addStyles();
    const cards = cardsFor(grid);
    if (cards.length < 2) return;
    const stampCard = cards.find((card) => cardDirection(card) === 'timestamp') || cards[0];
    const dateCard = cards.find((card) => cardDirection(card) === 'date') || cards[1];
    if (!head.querySelector('.dev-timestamp-direction-switch')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dev-timestamp-direction-switch';
      button.setAttribute('aria-label', '切换时间戳和日期转换方向');
      button.title = '切换转换方向';
      button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h15l-4-4m4 4-4 4M20 16H5l4 4m-4-4 4-4"/></svg>';
      const actions = head.querySelector('.dev-pane-actions');
      if (actions) actions.prepend(button);
      else head.appendChild(button);
    }
    const update = () => {
      const active = direction === 'timestamp' ? stampCard : dateCard;
      const inactive = direction === 'timestamp' ? dateCard : stampCard;
      cards.forEach((card) => {
        card.classList.toggle('is-direction-inactive', card !== active);
        card.setAttribute('aria-hidden', String(card !== active));
      });
      grid.dataset.direction = direction;
      const button = head.querySelector('.dev-timestamp-direction-switch');
      button?.setAttribute('aria-label', direction === 'timestamp' ? '当前时间戳转日期，点击切换为日期转时间戳' : '当前日期转时间戳，点击切换为时间戳转日期');
      button?.setAttribute('title', direction === 'timestamp' ? '时间戳 → 日期' : '日期 → 时间戳');
      const output = document.querySelector('.dev-workbench.dev-timestamp .dev-timestamp-output-card');
      output?.querySelectorAll('.dev-timestamp-result-block').forEach((block) => {
        const title = block.querySelector(':scope > h4')?.textContent || '';
        const isDate = /日期\s*(?:→|->|至|到)\s*时间戳|date\s*(?:→|->|to)\s*timestamp/i.test(title);
        const isStamp = /时间戳\s*(?:→|->|至|到)\s*日期|timestamp\s*(?:→|->|to)\s*date/i.test(title);
        const hidden = (direction === 'timestamp' && isDate) || (direction === 'date' && isStamp);
        block.classList.toggle('is-direction-inactive', hidden);
      });
    };
    update();
  };
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.dev-timestamp-direction-switch');
    if (button) return;
    const grid = document.querySelector('.dev-workbench.dev-timestamp .dev-timestamp-input-grid');
    if (!grid) return;
    const cards = cardsFor(grid);
    const active = cards.find((card) => !card.classList.contains('is-direction-inactive'));
    if (!active || !document.querySelector('.dev-timestamp-input-head')?.contains(event.target)) return;
    const text = event.target.closest('button')?.textContent?.trim() || '';
    const input = active.querySelector('input');
    if (!input) return;
    if (/清空|clear/i.test(text)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = '';
      emit(input);
    } else if (/当前时间|current time/i.test(text) && direction === 'date') {
      event.preventDefault();
      event.stopImmediatePropagation();
      input.value = dateInputValue(new Date(), input);
      emit(input);
    }
  }, true);
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.dev-timestamp-direction-switch');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const grid = document.querySelector('.dev-workbench.dev-timestamp .dev-timestamp-input-grid');
    const cards = grid ? cardsFor(grid) : [];
    const from = cards.find((card) => !card.classList.contains('is-direction-inactive'));
    const to = cards.find((card) => card !== from);
    if (!from || !to) return;
    switchValue(from, to, direction);
    direction = direction === 'timestamp' ? 'date' : 'timestamp';
    enhance();
  }, true);
  const observer = new MutationObserver(() => requestAnimationFrame(enhance));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once: true });
  else enhance();
})();