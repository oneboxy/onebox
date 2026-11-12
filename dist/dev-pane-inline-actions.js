(() => {
  'use strict';
  const relocate = () => {
    document.querySelectorAll('#workspace[data-tool="dev"] .dev-pane').forEach((pane) => {
      const head = pane.querySelector('.dev-pane-head, .dev-output-pane-head');
      if (!head) return;
      const actions = pane.querySelector('.dev-pane-actions');
      if (actions && actions.parentElement !== head) head.appendChild(actions);
      const title = head.querySelector(':scope > h3, :scope > .dev-output-title');
      const keep = new Set([title, actions]);
      [...head.children].forEach((child) => {
        if (keep.has(child) || child.matches('button, .dev-fullscreen-button')) return;
        if (child.classList.contains('dev-pane-tools-row')) return;
        child.classList.add('dev-pane-tools-row');
        head.insertAdjacentElement('afterend', child);
      });
    });
  };
  new MutationObserver(relocate).observe(document.documentElement, { childList: true, subtree: true });
  relocate();
})();