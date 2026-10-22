(() => {
  'use strict';
  function clampSetting(value, min, max, fallback) {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }
  window.OneBoxDeveloperJsonEditor = Object.freeze({ clampSetting });
})();
