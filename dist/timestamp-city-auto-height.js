(function () {
  'use strict';
  const workbench = '.dev-workbench.dev-timestamp';
  const schedule = window.requestAnimationFrame.bind(window);
  let observer;
  let lastMatrix = null;
  function fit() {
    const content = document.querySelector(workbench + ' .dev-timestamp-content');
    const world = content?.querySelector('.dev-timestamp-world-result');
    const list = world?.querySelector('.dev-timestamp-country-list');
    const matrix = list?.querySelector('.dev-timestamp-country-matrix');
    if (!content || !world || !list || !matrix) return;
    [content, world, list, matrix].forEach((node) => {
      node.style.setProperty('height', 'max-content', 'important');
      node.style.setProperty('min-height', '0', 'important');
      node.style.setProperty('max-height', 'none', 'important');
    });
    content.style.setProperty('grid-auto-rows', 'max-content', 'important');
    content.style.setProperty('align-content', 'start', 'important');
    world.style.setProperty('align-self', 'start', 'important');
    list.style.setProperty('align-self', 'start', 'important');
    matrix.style.setProperty('align-content', 'start', 'important');
    matrix.style.setProperty('grid-auto-rows', 'max-content', 'important');
    if (lastMatrix !== matrix) {
      observer?.disconnect();
      observer = new ResizeObserver(() => schedule(measure));
      observer.observe(matrix);
      lastMatrix = matrix;
    }
    schedule(measure);
  }
  function measure() {
    if (window.matchMedia('(max-width: 760px)').matches) return;
    const world = document.querySelector(workbench + ' .dev-timestamp-world-result');
    const list = world?.querySelector('.dev-timestamp-country-list');
    const matrix = list?.querySelector('.dev-timestamp-country-matrix');
    if (!matrix) return;
    const rows = [
      ...matrix.querySelectorAll(':scope > .dev-timestamp-country-header-row'),
      ...matrix.querySelectorAll(':scope > .dev-timestamp-city-row')
    ];
    if (!rows.length) return;
    const style = getComputedStyle(matrix);
    const rowGap = parseFloat(style.rowGap) || 0;
    const height = rows.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0) + rowGap * Math.max(0, rows.length - 1);
    if (height > 0) {
      matrix.style.setProperty('height', Math.ceil(height) + 'px', 'important');
      list.style.setProperty('height', Math.ceil(height) + 'px', 'important');
    }
  }
  const mutations = new MutationObserver(() => schedule(fit));
  mutations.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('resize', () => schedule(fit), { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fit, { once: true });
  else fit();
})();