(function () {
  'use strict';
  const scope = '.dev-workbench.dev-timestamp';
  const styleId = 'timestamp-input-output-frame-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent =
      scope + ' .dev-timestamp-content { display:grid; grid-template-columns:minmax(0,1fr)!important; grid-auto-rows:max-content!important; align-content:start!important; gap:12px!important; }' +
      scope + ' .dev-timestamp-input-output-frame { display:block; width:100%; min-width:0; box-sizing:border-box; padding:0; border:0; background:transparent; box-shadow:none; }';
    document.head.appendChild(style);
  }
  function pairGroups() {
    const content = document.querySelector(scope + ' .dev-timestamp-content');
    if (!content) return;
    const input = content.querySelector('.dev-timestamp-card');
    const output = content.querySelector('.dev-timestamp-output-card');
    if (!input) return;
    let frame = content.querySelector(':scope > .dev-timestamp-input-output-frame');
    if (!frame) {
      frame = document.createElement('div');
      frame.className = 'dev-timestamp-input-output-frame';
      content.insertBefore(frame, input);
    }
    if (input.parentElement !== frame) frame.appendChild(input);
    if (output && output.parentElement !== frame) frame.appendChild(output);
    if (!output || input.dataset.pairedLayout === 'true') return;

    const inputGrid = input.querySelector('.dev-timestamp-input-grid');
    const cards = Array.from(input.querySelectorAll('.dev-timestamp-input-card'));
    const resultBlocks = Array.from(output.querySelectorAll('.dev-timestamp-overview-results > .dev-timestamp-result-block'));
    const inputHead = input.querySelector('.dev-timestamp-input-head');
    const outputHead = output.querySelector(':scope > .dev-pane-head');

    if (inputHead) {
      const buttons = Array.from(inputHead.querySelectorAll('button'));
      const timestampCard = cards.find((card) => /时间戳|timestamp/i.test(card.textContent || '')) || cards[0];
      const timestampRow = timestampCard?.querySelector('.dev-timestamp-input-row:not(.dev-timestamp-date-row)');
      if (timestampRow && buttons.length) {
        const nowButton = buttons.find((button) => /当前时间|现在|now|current/i.test((button.textContent || '').trim()));
        const clearButton = buttons.find((button) => /清空|clear/i.test((button.textContent || '').trim()));
        const timestampInput = timestampRow.querySelector('.dev-plain-input');
        if (timestampInput && (nowButton || clearButton)) {
          let shell = timestampRow.querySelector('.dev-timestamp-input-shell');
          if (!shell) {
            shell = document.createElement('div');
            shell.className = 'dev-timestamp-input-shell';
            timestampRow.insertBefore(shell, timestampInput);
            shell.appendChild(timestampInput);
          }
          const setupIcon = (button, kind, label, svg) => {
            if (!button) return;
            button.type = 'button';
            button.classList.add('dev-timestamp-field-icon', 'is-' + kind);
            button.dataset.timestampFieldAction = kind;
            button.setAttribute('aria-label', label);
            button.title = label;
            button.innerHTML = svg;
            shell.appendChild(button);
          };
          setupIcon(nowButton, 'now', '当前时间', '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/></svg>');
          setupIcon(clearButton, 'clear', '清空', '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>');
          const setNowSelected = (selected) => {
            if (nowButton) {
              nowButton.setAttribute('aria-pressed', String(selected));
              nowButton.classList.toggle('is-selected', selected);
            }
          };
          if (nowButton && nowButton.dataset.toggleReady !== 'true') {
            nowButton.dataset.toggleReady = 'true';
            nowButton.setAttribute('aria-pressed', 'false');
            nowButton.addEventListener('click', (event) => {
              if (nowButton.getAttribute('aria-pressed') === 'true') {
                event.preventDefault();
                event.stopImmediatePropagation();
                setNowSelected(false);
              }
            }, true);
            nowButton.addEventListener('click', () => requestAnimationFrame(() => setNowSelected(true)));
            timestampInput.addEventListener('input', () => setNowSelected(false));
            timestampInput.addEventListener('change', () => setNowSelected(false));
          }
          if (clearButton && clearButton.dataset.clearToggleReady !== 'true') {
            clearButton.dataset.clearToggleReady = 'true';
            clearButton.addEventListener('click', () => setNowSelected(false));
          }
        }
      }
      inputHead.remove();
    }

    if (outputHead) outputHead.remove();

    resultBlocks.slice(0, cards.length).forEach((block, index) => {
      const heading = block.querySelector(':scope > h4');
      if (heading) heading.remove();
      cards[index].appendChild(block);
    });
    if (inputGrid) inputGrid.dataset.paired = 'true';
    input.dataset.pairedLayout = 'true';
    output.remove();
  }
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; pairGroups(); });
  };
  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once:true });
  else schedule();
})();