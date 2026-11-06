(function () {
  'use strict';
  const scope = '.dev-workbench.dev-timestamp';
  if (!document.getElementById('timestamp-input-output-frame-style')) {
    const style = document.createElement('style');
    style.id = 'timestamp-input-output-frame-style';
    style.textContent = [
      scope + ' .dev-timestamp-content { grid-template-columns:minmax(0,1fr)!important; grid-auto-rows:max-content!important; align-content:start!important; gap:12px; }',
      scope + ' .dev-timestamp-input-output-frame { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); align-items:start; gap:16px; width:100%; min-width:0; box-sizing:border-box; padding:12px; border:1px solid var(--line); border-radius:14px; background:var(--panel); }',
      scope + ' .dev-timestamp-input-output-frame > .dev-timestamp-card, ' + scope + ' .dev-timestamp-input-output-frame > .dev-timestamp-output-card { box-sizing:border-box; width:100%; min-width:0; margin:0; padding:0!important; border:0!important; border-radius:0!important; background:transparent!important; box-shadow:none!important; }',
      scope + ' .dev-timestamp-input-output-frame > .dev-timestamp-card { padding-right:12px!important; border-right:1px solid var(--line)!important; }',
      '@media(max-width:760px){' +
        scope + ' .dev-timestamp-content{gap:9px!important}' +
        scope + ' .dev-timestamp-input-output-frame{grid-template-columns:minmax(0,1fr);gap:10px;padding:10px;border-radius:13px}' +
        scope + ' .dev-timestamp-input-output-frame > .dev-timestamp-card{padding:0 0 10px!important;border-right:0!important;border-bottom:1px solid var(--line)!important}' +
        scope + ' .dev-timestamp-input-output-frame > .dev-timestamp-output-card{padding-top:2px!important}' +
      '}'
    ].join('\n');
    document.head.appendChild(style);
  }
  function wrap() {
    const content = document.querySelector(scope + ' .dev-timestamp-content');
    if (!content) return;
    const input = content.querySelector('.dev-timestamp-card');
    const output = content.querySelector('.dev-timestamp-output-card');
    if (!input || !output) return;
    let frame = content.querySelector(':scope > .dev-timestamp-input-output-frame');
    if (!frame) {
      frame = document.createElement('div');
      frame.className = 'dev-timestamp-input-output-frame';
      content.insertBefore(frame, input);
    }
    if (input.parentElement !== frame) frame.appendChild(input);
    if (output.parentElement !== frame) frame.appendChild(output);
  }
  const observer = new MutationObserver(() => requestAnimationFrame(wrap));
  observer.observe(document.documentElement, { childList:true, subtree:true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wrap, { once:true });
  else wrap();
})();