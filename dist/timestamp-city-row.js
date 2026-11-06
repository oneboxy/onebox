(function () {
  'use strict';
  const placeCityRow = () => {
    const content = document.querySelector('.dev-workbench.dev-timestamp .dev-timestamp-content');
    const cityRow = content?.querySelector('.dev-timestamp-world-result');
    if (content && cityRow && cityRow.parentElement !== content) content.appendChild(cityRow);
  };
  const observer = new MutationObserver(() => requestAnimationFrame(placeCityRow));
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', placeCityRow, { once: true });
  else placeCityRow();
})();