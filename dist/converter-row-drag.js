(() => {
  'use strict';
  const rowSelector = '#workspace[data-tool="dev"] .converter-panel .conversion-row';
  const orderKey = 'onebox.converter-row-order.v1';
  const icon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="5" r="1.35" fill="currentColor"/><circle cx="16" cy="5" r="1.35" fill="currentColor"/><circle cx="8" cy="12" r="1.35" fill="currentColor"/><circle cx="16" cy="12" r="1.35" fill="currentColor"/><circle cx="8" cy="19" r="1.35" fill="currentColor"/><circle cx="16" cy="19" r="1.35" fill="currentColor"/></svg>';
  const styleId = 'converter-row-drag-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #workspace[data-tool="dev"] .converter-row-drag {
        display: grid; place-items: center; flex: 0 0 24px; width: 24px; height: 24px;
        padding: 0; border: 0; border-radius: 6px; background: transparent; color: var(--muted);
        cursor: grab; touch-action: none; user-select: none; -webkit-user-select: none;
      }
      #workspace[data-tool="dev"] .converter-row-drag:hover { background: var(--panel); color: var(--primary); }
      #workspace[data-tool="dev"] .converter-row-drag:active { cursor: grabbing; }
      #workspace[data-tool="dev"] .converter-row-drag svg { display:block; width:15px; height:15px; }
      #workspace[data-tool="dev"] .conversion-row.is-dragging {
        position: relative; z-index: 5; opacity: .78; transform: scale(.99);
        outline: 1px solid color-mix(in srgb, var(--primary) 45%, var(--line));
      }
      #workspace[data-tool="dev"] .conversion-row.is-drop-target {
        outline: 1px dashed color-mix(in srgb, var(--primary) 55%, var(--line));
      }
      #workspace[data-tool="dev"] .converter-panel .conversion-row-actions { gap: 2px; }
    `;
    document.head.appendChild(style);
  }

  let active = null;
  let timer = 0;
  let currentTarget = null;
  let patchQueued = false;
  const readOrder = () => {
    try { const value = JSON.parse(localStorage.getItem(orderKey) || '[]'); return Array.isArray(value) ? value.map(String) : []; }
    catch { return []; }
  };
  const getKey = (row) => row.querySelector('.conversion-row-title')?.textContent?.trim() || '';
  const saveOrder = (container) => {
    try { localStorage.setItem(orderKey, JSON.stringify([...container.querySelectorAll(':scope > .conversion-row')].map(getKey))); } catch {}
  };
  const restoreOrder = (container) => {
    const rows = [...container.querySelectorAll(':scope > .conversion-row')];
    if (rows.length < 2) return;
    const byKey = new Map(rows.map((row) => [getKey(row), row]));
    const saved = readOrder();
    const desired = [...saved.map((key) => byKey.get(key)).filter(Boolean), ...rows.filter((row) => !saved.includes(getKey(row)))];
    if (desired.every((row, index) => row === rows[index])) return;
    desired.forEach((row) => container.appendChild(row));
  };
  const setDropTarget = (row) => {
    if (currentTarget === row) return;
    currentTarget?.classList.remove('is-drop-target');
    currentTarget = row;
    currentTarget?.classList.add('is-drop-target');
  };
  const reorderAt = (x, y) => {
    if (!active) return;
    const target = document.elementFromPoint(x, y)?.closest('.conversion-row');
    if (!target || target === active.row || target.parentElement !== active.container) {
      setDropTarget(null);
      return;
    }
    setDropTarget(target);
    const rect = target.getBoundingClientRect();
    const after = y > rect.top + rect.height / 2 || (y >= rect.top && y <= rect.bottom && x > rect.left + rect.width / 2);
    if (after) {
      if (target.nextElementSibling !== active.row) target.after(active.row);
    } else if (target.previousElementSibling !== active.row) {
      target.before(active.row);
    }
  };
  const finish = () => {
    if (timer) clearTimeout(timer);
    timer = 0;
    if (!active) return;
    const { row, container, handle } = active;
    row.classList.remove('is-dragging');
    handle?.setAttribute('aria-pressed', 'false');
    setDropTarget(null);
    active = null;
    saveOrder(container);
    queuePatch();
  };
  const begin = () => {
    if (!active) return;
    active.dragging = true;
    active.row.classList.add('is-dragging');
    active.handle?.setAttribute('aria-pressed', 'true');
  };
  const pointerDown = (event, row, handle) => {
    if (event.button !== undefined && event.button !== 0) return;
    const container = row.parentElement;
    if (!container) return;
    event.preventDefault();
    if (active) finish();
    active = { row, container, handle, pointerId: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
    timer = window.setTimeout(begin, 350);
  };
  document.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.converter-row-drag');
    if (!handle) return;
    const row = handle.closest('.conversion-row');
    if (row) pointerDown(event, row, handle);
  });
  document.addEventListener('pointermove', (event) => {
    if (!active || event.pointerId !== active.pointerId) return;
    if (!active.dragging && Math.hypot(event.clientX - active.x, event.clientY - active.y) > 8) {
      clearTimeout(timer); timer = 0; active = null; return;
    }
    if (active.dragging) {
      event.preventDefault();
      reorderAt(event.clientX, event.clientY);
    }
  }, { passive: false });
  document.addEventListener('pointerup', (event) => { if (active && event.pointerId === active.pointerId) finish(); });
  document.addEventListener('pointercancel', (event) => { if (active && event.pointerId === active.pointerId) finish(); });
  document.addEventListener('click', (event) => {
    if (event.target.closest('.converter-row-drag')) event.preventDefault();
  });

  function queuePatch() {
    if (patchQueued) return;
    patchQueued = true;
    requestAnimationFrame(() => { patchQueued = false; patch(); });
  }
  function patch() {
    document.querySelectorAll('#workspace[data-tool="dev"] .converter-panel .conversion-rows').forEach((container) => {
      if (!active) restoreOrder(container);
      container.querySelectorAll(':scope > .conversion-row').forEach((row) => {
        const heading = row.querySelector('.conversion-row-heading');
        if (!heading || row.querySelector('.converter-row-drag')) return;
        let actions = heading.querySelector('.conversion-row-actions');
        if (!actions) {
          actions = document.createElement('div');
          actions.className = 'conversion-row-actions';
          const buttons = [...heading.querySelectorAll('.conversion-row-swap, .conversion-copy')];
          buttons.forEach((button) => actions.appendChild(button));
          heading.appendChild(actions);
        }
        const handle = document.createElement('button');
        handle.type = 'button';
        handle.className = 'converter-row-drag';
        handle.setAttribute('aria-label', '长按拖动换位');
        handle.setAttribute('title', '长按拖动换位');
        handle.setAttribute('aria-pressed', 'false');
        handle.innerHTML = icon;
        actions.appendChild(handle);
      });
    });
  }
  new MutationObserver(queuePatch).observe(document.documentElement, { childList: true, subtree: true });
  patch();
})();