(() => {
  'use strict';

  const isFontControl = (element) => {
    const text = (element.textContent || '').replace(/\s+/g, '').replace(/[−–]/g, '-');
    return /^A-$/.test(text) || /^A\+$/.test(text);
  };

  const directChildUnder = (element, ancestor) => {
    let current = element;
    while (current && current.parentElement !== ancestor) current = current.parentElement;
    return current && current.parentElement === ancestor ? current : null;
  };

  const relocate = () => {
    document.querySelectorAll('#workspace[data-tool="dev"] .dev-pane').forEach((pane) => {
      const head = pane.querySelector('.dev-pane-head, .dev-output-pane-head');
      if (!head) return;

      const actions = pane.querySelector('.dev-pane-actions');
      if (actions && actions.parentElement !== head) head.appendChild(actions);

      const title = head.querySelector(':scope > h3, :scope > .dev-output-title');
      const row = pane.querySelector(':scope > .dev-pane-tools-row')
        || head.nextElementSibling?.classList.contains('dev-pane-tools-row') && head.nextElementSibling;
      const toolsRow = row || document.createElement('div');
      if (!row) {
        toolsRow.className = 'dev-pane-tools-row';
        head.insertAdjacentElement('afterend', toolsRow);
      }

      // The editor font/line controls are nested inside the actions container.
      // Lift their own toolbar group out so primary actions stay beside the title.
      const buttons = [...(actions || head).querySelectorAll('button, [role="button"]')];
      const fontButtons = buttons.filter(isFontControl);
      const source = actions || head;
      fontButtons.forEach((button) => {
        const group = directChildUnder(button, source);
        if (!group || group === actions || group === title || group.classList.contains('dev-pane-tools-row')) return;
        if (group.parentElement !== toolsRow) toolsRow.appendChild(group);
      });

      // Preserve any non-button toolbar node already placed in the heading by
      // the earlier mobile layout script.
      [...head.children].forEach((child) => {
        if (child === title || child === actions || child === toolsRow || child.matches('button, .dev-fullscreen-button')) return;
        if (child.classList.contains('dev-pane-tools-row')) {
          if (child !== toolsRow) toolsRow.append(...child.childNodes);
          child.remove();
          return;
        }
        toolsRow.appendChild(child);
      });
    });
  };

  new MutationObserver(relocate).observe(document.documentElement, { childList: true, subtree: true });
  relocate();
})();