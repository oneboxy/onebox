(function () {
  'use strict';
  const root = '.dev-workbench.dev-timestamp';
  let resizeObserver = null;
  let currentMatrix = null;
  let frame = 0;
  function measure() {
    frame = 0;
    const workbench = document.querySelector(root);
    const content = workbench?.querySelector('.dev-timestamp-content');
    const world = content?.querySelector('.dev-timestamp-world-result');
    const results = world?.querySelector('.dev-timestamp-results');
    const section = world?.querySelector('.dev-timestamp-city-section');
    const list = section?.querySelector('.dev-timestamp-country-list') || world?.querySelector('.dev-timestamp-country-list');
    const matrix = list?.querySelector('.dev-timestamp-country-matrix');
    if (!workbench || !content || !world || !list || !matrix) return;
    const nodes = [world, results, section, list, matrix].filter(Boolean);
    if (window.matchMedia('(max-width: 760px)').matches) {
      nodes.forEach((node) => {
        node.style.setProperty('height', 'auto', 'important');
        node.style.setProperty('min-height', '0', 'important');
        node.style.setProperty('max-height', 'none', 'important');
      });
      return;
    }
    content.style.setProperty('grid-auto-rows', 'max-content', 'important');
    content.style.setProperty('align-content', 'start', 'important');
    matrix.style.setProperty('align-content', 'start', 'important');
    matrix.style.setProperty('grid-auto-rows', 'max-content', 'important');
    const headerRows = [...matrix.children].filter((node) =>
      node.classList.contains('dev-timestamp-country-header-row')
    );
    const cityRows = [...matrix.children].filter((node) =>
      node.classList.contains('dev-timestamp-city-row')
    );
    const populatedCityRows = cityRows.filter((row) => {
      const hasVisibleCity = [...row.querySelectorAll('.dev-timestamp-city-cell')].some((cell) => {
        const card = cell.querySelector('.dev-timestamp-city-card[data-dev-city-id]');
        return card && !cell.classList.contains('is-deleted') && !cell.classList.contains('is-country-cities-collapsed');
      });
      if (hasVisibleCity) row.style.removeProperty('display');
      else row.style.setProperty('display', 'none', 'important');
      return hasVisibleCity;
    });
    const rows = [...headerRows, ...populatedCityRows];
    if (!rows.length) return;
    const matrixStyle = getComputedStyle(matrix);
    const gap = parseFloat(matrixStyle.rowGap) || 0;
    const matrixHeight = Math.ceil(rows.reduce((sum, row) => sum + row.getBoundingClientRect().height, 0) + gap * (rows.length - 1));
    matrix.style.setProperty('height', matrixHeight + 'px', 'important');
    list.style.setProperty('height', matrixHeight + 'px', 'important');
    const title = section?.querySelector(':scope > h4') || section?.querySelector('h4');
    const titleHeight = title?.getBoundingClientRect().height || 0;
    const titleStyle = title ? getComputedStyle(title) : null;
    const titleGap = titleStyle ? (parseFloat(titleStyle.marginBottom) || 0) : 0;
    const sectionHeight = Math.ceil(titleHeight + titleGap + matrixHeight);
    if (section) section.style.setProperty('height', sectionHeight + 'px', 'important');
    if (results) results.style.setProperty('height', sectionHeight + 'px', 'important');
    const worldStyle = getComputedStyle(world);
    const outerSpace = ['paddingTop','paddingBottom','borderTopWidth','borderBottomWidth']
      .reduce((sum, key) => sum + (parseFloat(worldStyle[key]) || 0), 0);
    world.style.setProperty('height', Math.ceil(sectionHeight + outerSpace) + 'px', 'important');
    world.style.setProperty('min-height', '0', 'important');
    if (currentMatrix !== matrix && window.ResizeObserver) {
      resizeObserver?.disconnect();
      resizeObserver = new ResizeObserver(schedule);
      resizeObserver.observe(matrix);
      currentMatrix = matrix;
    }
  }
  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(measure);
  }
  const mutations = new MutationObserver(schedule);
  mutations.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  window.addEventListener('resize', schedule, { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();