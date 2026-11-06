(function () {
  'use strict';
  const rootSelector = '.dev-workbench.dev-timestamp .dev-timestamp-country-matrix';
  const hiddenKey = 'onebox.timestamp-hidden-cities.v1';
  let matrixObserver = null;
  let observedMatrix = null;
  let frame = 0;

  function hiddenCities() {
    try {
      const value = JSON.parse(localStorage.getItem(hiddenKey) || '[]');
      return new Set(Array.isArray(value) ? value.map(String) : []);
    } catch {
      return new Set();
    }
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(compact);
  }

  function compact() {
    frame = 0;
    const matrix = document.querySelector(rootSelector);
    if (!matrix) return;

    if (matrix !== observedMatrix) {
      matrixObserver?.disconnect();
      matrixObserver = new MutationObserver(schedule);
      matrixObserver.observe(matrix, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
      observedMatrix = matrix;
    }

    const rows = [...matrix.children].filter((node) => node.classList.contains('dev-timestamp-city-row'));
    const headers = [...matrix.querySelectorAll(':scope > .dev-timestamp-country-header-row .dev-timestamp-country-header-cell[data-dev-country-key]')];
    const hidden = hiddenCities();

    for (const header of headers) {
      const key = header.dataset.devCountryKey;
      const cells = rows.map((row) =>
        [...row.querySelectorAll(':scope > .dev-timestamp-city-cell[data-dev-country-key]')]
          .find((cell) => cell.dataset.devCountryKey === key)
      ).filter(Boolean);

      const records = [];
      let nextOrder = 0;
      for (const cell of cells) {
        const card = cell.querySelector(':scope > .dev-timestamp-city-card[data-dev-city-id]');
        if (!card) continue;
        if (!card.hasAttribute('data-dev-compact-order')) {
          card.dataset.devCompactOrder = String(nextOrder);
        }
        const order = Number(card.dataset.devCompactOrder);
        nextOrder = Math.max(nextOrder + 1, Number.isFinite(order) ? order + 1 : nextOrder + 1);
        records.push({ card, deleted: hidden.has(card.dataset.devCityId) });
      }

      const ordered = records
        .filter((record) => !record.deleted)
        .sort((a, b) => Number(a.card.dataset.devCompactOrder) - Number(b.card.dataset.devCompactOrder))
        .concat(records
          .filter((record) => record.deleted)
          .sort((a, b) => Number(a.card.dataset.devCompactOrder) - Number(b.card.dataset.devCompactOrder)));

      cells.forEach((cell, index) => {
        const record = ordered[index] || null;
        const current = cell.querySelector(':scope > .dev-timestamp-city-card[data-dev-city-id]');
        if (current !== (record?.card || null)) {
          current?.remove();
          if (record) cell.append(record.card);
        }

        const isEmpty = !record;
        const isDeleted = Boolean(record?.deleted);
        if (cell.classList.contains('is-empty') !== isEmpty) cell.classList.toggle('is-empty', isEmpty);
        if (cell.classList.contains('is-deleted') !== isDeleted) cell.classList.toggle('is-deleted', isDeleted);
        if (cell.hasAttribute('aria-hidden') !== isDeleted) cell.toggleAttribute('aria-hidden', isDeleted);
      });
    }
  }

  const rootObserver = new MutationObserver(schedule);
  rootObserver.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
  else schedule();
})();