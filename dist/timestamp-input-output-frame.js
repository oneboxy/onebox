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
        let actionGroup = timestampRow.querySelector('.dev-timestamp-inline-actions');
        if (!actionGroup) {
          actionGroup = document.createElement('div');
          actionGroup.className = 'dev-timestamp-inline-actions';
          timestampRow.appendChild(actionGroup);
        }
        buttons.forEach((button) => {
          const text = (button.textContent || '').trim();
          if (/当前时间|现在|now|current/i.test(text) || /清空|clear/i.test(text)) actionGroup.appendChild(button);
        });
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