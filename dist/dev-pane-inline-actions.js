(() => {
  'use strict';
  const normalize = (element) => (element.textContent || '').replace(/\s+/g, '').replace(/[−–]/g, '-');
  const isFontControl = (element) => {
    const text = normalize(element);
    return text === 'A-' || text === 'A+';
  };
  const directChildUnder = (element, ancestor) => {
    let current = element;
    while (current && current.parentElement !== ancestor) current = current.parentElement;
    return current && current.parentElement === ancestor ? current : null;
  };
  const icon = (plus) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 19 9 5h2l5.5 14M6.2 12.2h8.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="${plus ? 'M18.5 9.5v6M15.5 12.5h6' : 'M15.5 12.5h6'}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
  const relocate = () => {
    document.querySelectorAll('#workspace[data-tool="dev"] .dev-pane').forEach((pane) => {
      const head = pane.querySelector('.dev-pane-head, .dev-output-pane-head');
      if (!head) return;
      const actions = pane.querySelector('.dev-pane-actions');
      if (actions && actions.parentElement !== head) head.appendChild(actions);
      const title = head.querySelector(':scope > h3, :scope > .dev-output-title');
      if (!title) return;

      let fontButtons = head.querySelector(':scope > .dev-pane-font-buttons');
      if (!fontButtons) {
        fontButtons = document.createElement('div');
        fontButtons.className = 'dev-pane-font-buttons';
        fontButtons.setAttribute('role', 'group');
        fontButtons.setAttribute('aria-label', '字体大小');
      }
      const controls = [...pane.querySelectorAll('button, [role="button"]')].filter(isFontControl);
      controls.forEach((button) => {
        const plus = normalize(button) === 'A+';
        button.setAttribute('aria-label', plus ? '放大字体' : '缩小字体');
        button.title = plus ? '放大字体' : '缩小字体';
        button.innerHTML = icon(plus);
        if (button.parentElement !== fontButtons) fontButtons.appendChild(button);
      });
      if (fontButtons.parentElement !== head) title.insertAdjacentElement('afterend', fontButtons);

      // Remove the old line-height and size readout group, wherever it was nested.
      const sizeReadout = [...pane.querySelectorAll('*')].find((el) => /^\d+\s*px\s*[·•|/]\s*\d+\s*px$/i.test((el.textContent || '').trim()) && el.children.length === 0);
      if (sizeReadout) {
        const group = directChildUnder(sizeReadout, actions || head);
        if (group && group !== actions) group.classList.add('dev-pane-extra-font-controls');
        else {
          const headerGroup = directChildUnder(sizeReadout, head);
          if (headerGroup && headerGroup !== title && headerGroup !== actions && headerGroup !== fontButtons) headerGroup.classList.add('dev-pane-extra-font-controls');
        }
      }
      [...(actions || pane).querySelectorAll('button, [role="button"]')].forEach((button) => {
        if (!/[↕⇵⬍⬆⬇]/.test(button.textContent || '')) return;
        const group = directChildUnder(button, actions || pane);
        if (group && group !== actions) group.classList.add('dev-pane-extra-font-controls');
      });
    });
  };
  new MutationObserver(relocate).observe(document.documentElement, { childList: true, subtree: true });
  relocate();
})();