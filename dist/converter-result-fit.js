(() => {
  'use strict';
  const selector = '#workspace[data-tool="dev"] .converter-panel .conversion-result';
  const pending = new Set();
  let frame = 0;
  const fit = (result) => {
    const value = result.querySelector('strong');
    if (!value || !value.textContent.trim()) return;
    let size = 13;
    value.style.setProperty('font-size', size + 'px', 'important');
    while (size > 8 && value.scrollWidth > value.clientWidth + 0.5) {
      size = Math.max(8, size - 0.25);
      value.style.setProperty('font-size', size + 'px', 'important');
    }
  };
  const schedule = (result) => {
    pending.add(result);
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      pending.forEach(fit);
      pending.clear();
    });
  };
  const observe = (result) => {
    if (result.dataset.valueFitReady === 'true') return;
    result.dataset.valueFitReady = 'true';
    const value = result.querySelector('strong');
    if (!value) return;
    if (window.ResizeObserver) {
      const sizeObserver = new ResizeObserver(() => schedule(result));
      sizeObserver.observe(result);
      const unit = result.querySelector(':scope > span');
      if (unit) sizeObserver.observe(unit);
    }
    new MutationObserver(() => schedule(result)).observe(result, { childList: true, characterData: true, subtree: true });
    schedule(result);
  };
  const patch = () => document.querySelectorAll(selector).forEach(observe);
  new MutationObserver(patch).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', patch);
  patch();
})();