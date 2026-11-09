(() => {
  'use strict';
  const fieldSelector = '#workspace[data-tool="dev"] .converter-panel .conversion-field select';
  const styleId = 'converter-select-popup-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .converter-select-wrap { position: relative; display: block; width: 100%; min-width: 0; }
      .converter-select-native { display: none !important; }
      .converter-select-trigger {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        box-sizing: border-box; width: 100%; min-width: 0; height: 38px; padding: 0 10px;
        border: 1px solid var(--line); border-radius: 8px; background: var(--panel);
        color: var(--ink); font: inherit; font-size: 14px; text-align: left; cursor: pointer;
      }
      .converter-select-trigger:hover { border-color: color-mix(in srgb, var(--muted) 45%, var(--line)); }
      .converter-select-trigger:focus-visible { outline: 1px solid var(--line); outline-offset: 1px; box-shadow: none; }
      .converter-select-trigger-label { min-width: 0; overflow: hidden; text-overflow: clip; white-space: nowrap; }
      .converter-select-trigger svg { flex: 0 0 14px; width: 14px; height: 14px; color: var(--muted); }
      .converter-select-menu {
        position: fixed; z-index: 10050; box-sizing: border-box; max-width: calc(100vw - 24px);
        max-height: min(280px, calc(100dvh - 24px)); overflow: auto; overscroll-behavior: contain;
        scrollbar-width: thin; scrollbar-color: color-mix(in srgb, var(--muted) 36%, transparent) transparent;
        padding: 4px; border: 1px solid var(--line); border-radius: 10px;
        background: var(--panel); color: var(--ink); box-shadow: 0 10px 28px rgb(15 23 42 / .14);
      }
      .converter-select-menu::-webkit-scrollbar { width: 5px; height: 5px; }
      .converter-select-menu::-webkit-scrollbar-track { background: transparent; }
      .converter-select-menu::-webkit-scrollbar-thumb { border: 1px solid transparent; border-radius: 99px; background: color-mix(in srgb, var(--muted) 36%, transparent); background-clip: padding-box; }
      .converter-select-option {
        display: block; box-sizing: border-box; width: 100%; min-height: 34px; padding: 7px 10px;
        border: 0; border-radius: 6px; background: transparent; color: var(--ink);
        font: inherit; font-size: 14px; line-height: 1.35; text-align: left;
        white-space: nowrap; cursor: pointer;
      }
      .converter-select-option:hover,
      .converter-select-option:focus-visible { outline: none; background: color-mix(in srgb, var(--primary) 8%, var(--panel)); }
      .converter-select-option[aria-selected="true"] { background: color-mix(in srgb, var(--primary) 10%, var(--panel)); color: var(--primary); font-weight: 600; }
      @media (max-width: 640px) {
        .converter-select-trigger { height: 44px; font-size: 15px; }
        .converter-select-option { min-height: 42px; padding: 9px 12px; font-size: 15px; }
      }
    `;
    document.head.appendChild(style);
  }

  let active = null;
  let id = 0;
  const updateLabel = (wrap) => {
    const select = wrap.querySelector('select');
    const label = wrap.querySelector('.converter-select-trigger-label');
    if (select && label) label.textContent = select.selectedOptions[0]?.textContent?.trim() || '';
  };
  const closeMenu = (restoreFocus) => {
    if (!active) return;
    const { menu, button } = active;
    menu.remove();
    button.setAttribute('aria-expanded', 'false');
    active = null;
    if (restoreFocus) button.focus({ preventScroll: true });
  };
  const openMenu = (wrap) => {
    if (active) closeMenu(false);
    const select = wrap.querySelector('select');
    const button = wrap.querySelector('.converter-select-trigger');
    if (!select || !button) return;
    const menu = document.createElement('div');
    menu.className = 'converter-select-menu';
    menu.id = 'converter-select-menu-' + (++id);
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', button.getAttribute('aria-label') || '选择单位');
    const optionButtons = [];
    Array.from(select.options).forEach((option, index) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'converter-select-option';
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', String(option.selected));
      item.disabled = option.disabled;
      item.textContent = option.textContent.trim();
      item.addEventListener('click', () => {
        select.value = option.value;
        select.dispatchEvent(new Event('input', { bubbles: true }));
        select.dispatchEvent(new Event('change', { bubbles: true }));
        updateLabel(wrap);
        closeMenu(true);
      });
      menu.appendChild(item);
      optionButtons.push(item);
    });
    document.body.appendChild(menu);
    const rect = button.getBoundingClientRect();
    const naturalWidth = Math.max(rect.width, menu.scrollWidth);
    const width = Math.min(naturalWidth, window.innerWidth - 24);
    menu.style.width = width + 'px';
    const height = Math.min(menu.scrollHeight, window.innerHeight - 24);
    const below = window.innerHeight - rect.bottom;
    const top = below >= height + 8 || rect.top < height + 16
      ? Math.min(rect.bottom + 5, window.innerHeight - height - 12)
      : Math.max(12, rect.top - height - 5);
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-controls', menu.id);
    active = { menu, button };
    const selected = optionButtons.find((item) => item.getAttribute('aria-selected') === 'true' && !item.disabled);
    (selected || optionButtons.find((item) => !item.disabled))?.focus({ preventScroll: true });
  };
  const enhance = (select) => {
    if (select.dataset.customPopupReady === 'true') return;
    select.dataset.customPopupReady = 'true';
    const wrap = document.createElement('div');
    wrap.className = 'converter-select-wrap';
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('converter-select-native');
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'converter-select-trigger';
    const label = document.createElement('span');
    label.className = 'converter-select-trigger-label';
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
    button.append(label, icon);
    const field = select.closest('.conversion-field');
    const context = field?.querySelector('.conversion-inline-label')?.textContent?.trim();
    button.setAttribute('aria-label', (context ? context + '：' : '') + '选择单位');
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => active?.button === button ? closeMenu(false) : openMenu(wrap));
    button.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMenu(wrap);
      }
    });
    select.addEventListener('change', () => updateLabel(wrap));
    wrap.appendChild(button);
    updateLabel(wrap);
  };
  const patch = () => document.querySelectorAll(fieldSelector).forEach(enhance);
  document.addEventListener('pointerdown', (event) => {
    if (!active || active.menu.contains(event.target) || active.button.contains(event.target)) return;
    closeMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      closeMenu(true);
    }
  });
  window.addEventListener('resize', () => closeMenu(false));
  window.addEventListener('scroll', (event) => { if (active && !active.menu.contains(event.target)) closeMenu(false); }, true);
  new MutationObserver(patch).observe(document.documentElement, { childList: true, subtree: true });
  patch();
})();