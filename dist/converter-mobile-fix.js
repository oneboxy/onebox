(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = [
    '#workspace[data-tool="dev"] .converter-panel .conversion-rows { align-items:start!important; grid-auto-rows:max-content!important; }',
    '#workspace[data-tool="dev"] .converter-panel .conversion-row { height:max-content!important; min-height:0!important; max-height:none!important; grid-template-rows:max-content max-content!important; align-content:start!important; align-self:start!important; }',
    '#workspace[data-tool="dev"] .converter-panel .conversion-row-actions { display:inline-flex; flex:0 0 auto; align-items:center; gap:2px; }',
    '#workspace[data-tool="dev"] .converter-panel .conversion-row-actions .conversion-row-swap, #workspace[data-tool="dev"] .converter-panel .conversion-row-actions .conversion-copy { display:grid!important; flex:0 0 30px; width:30px!important; height:30px!important; min-height:30px; place-items:center; padding:0!important; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--muted); opacity:1; cursor:pointer; }',
    '#workspace[data-tool="dev"] .converter-panel .conversion-row-actions .conversion-row-swap:hover, #workspace[data-tool="dev"] .converter-panel .conversion-row-actions .conversion-copy:hover { border-color:var(--line); background:var(--panel); color:var(--primary); }',
    '#workspace[data-tool="dev"] .converter-panel .conversion-row-actions svg { display:block; width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }',
    '@media(max-width:760px) { #workspace[data-tool="dev"] .converter-panel, #workspace[data-tool="dev"] .converter-panel .converter-card, #workspace[data-tool="dev"] .converter-panel .conversion-rows { height:max-content!important; min-height:0!important; max-height:none!important; flex:0 0 auto!important; align-self:flex-start!important; align-content:start!important; } #workspace[data-tool="dev"] .converter-panel .conversion-rows { grid-auto-rows:max-content!important; } #workspace[data-tool="dev"] .converter-panel .conversion-row-controls { grid-template-columns:minmax(0,1fr)!important; grid-template-rows:max-content max-content!important; grid-auto-rows:max-content!important; height:max-content!important; min-height:0!important; align-content:start!important; gap:7px; } #workspace[data-tool="dev"] .converter-panel .conversion-row-controls > * { grid-column:1!important; grid-row:auto!important; height:max-content!important; min-height:0!important; align-self:start!important; } #workspace[data-tool="dev"] .converter-panel .conversion-field { grid-template-rows:36px!important; height:36px!important; min-height:0!important; } }'
  ].join('\n');
  style.textContent += '\n@media(max-width:760px){.dev-tools-page.dev-is-fullscreen .dev-mode-tabs{display:flex!important;flex-wrap:nowrap!important;justify-content:flex-start!important;align-items:center!important;width:100%;max-width:100%;min-width:0;overflow-x:auto!important;overflow-y:hidden!important;overscroll-behavior-x:contain;scrollbar-width:none;white-space:nowrap!important}.dev-tools-page.dev-is-fullscreen .dev-mode-tabs::-webkit-scrollbar{display:none!important}.dev-tools-page.dev-is-fullscreen .dev-mode-tab{display:inline-flex!important;flex:0 0 auto!important;width:auto!important;min-width:max-content!important;min-height:36px!important;padding:5px 7px!important;font-size:10px!important;white-space:nowrap!important;overflow-wrap:normal!important}}';
  (document.head || document.documentElement).appendChild(style);
  const swapIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h15l-4-4m4 4-4 4M20 17H5l4 4m-4-4 4-4"/></svg>';
  function patchRows() {
    document.querySelectorAll('#workspace[data-tool="dev"] .conversion-row').forEach(function (row) {
      const swap = row.querySelector('[data-conversion-swap]');
      const copy = row.querySelector('[data-copy-conversion]');
      const heading = row.querySelector('.conversion-row-heading');
      if (!heading) return;
      let actions = heading.querySelector('.conversion-row-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'conversion-row-actions';
        heading.appendChild(actions);
      }
      if (swap && swap.parentElement !== actions) actions.appendChild(swap);
      if (copy && copy.parentElement !== actions) actions.appendChild(copy);
      if (swap && !swap.dataset.iconUpdated) {
        swap.innerHTML = swapIcon;
        swap.dataset.iconUpdated = 'true';
      }
    });
  }
  const observer = new MutationObserver(patchRows);
  observer.observe(document.documentElement, { childList:true, subtree:true });
  patchRows();
})();