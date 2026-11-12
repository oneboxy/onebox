(() => {
  'use strict';
  const isFontControl = (element) => {
    const text = (element.textContent || '').replace(/\s+/g, '').replace(/[−–]/g, '-');
    return text === 'A-' || text === 'A+';
  };
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
        fontButtons.setAttribute('aria-label', '编辑器字体大小');
      }
      const controls = [...pane.querySelectorAll('button, [role="button"]')].filter(isFontControl);
      controls.forEach((button) => {
        button.setAttribute('aria-label', button.textContent.trim() === 'A+' ? '放大字体' : '缩小字体');
        if (button.parentElement !== fontButtons) fontButtons.appendChild(button);
      });
      if (fontButtons.parentElement !== head) title.insertAdjacentElement('afterend', fontButtons);
    });
  };
  new MutationObserver(relocate).observe(document.documentElement, { childList: true, subtree: true });
  relocate();
})();