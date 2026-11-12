(() => {
  'use strict';
  const moveActions = () => {
    document.querySelectorAll('#workspace[data-tool="dev"] .dev-pane').forEach((pane) => {
      const head = pane.querySelector('.dev-pane-head');
      const actions = pane.querySelector('.dev-pane-actions');
      if (!head || !actions || actions.parentElement === head) return;
      head.appendChild(actions);
    });
  };
  new MutationObserver(moveActions).observe(document.documentElement, { childList: true, subtree: true });
  moveActions();
})();