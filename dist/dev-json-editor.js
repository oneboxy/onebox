(() => {
  'use strict';
  function clampSetting(value, min, max, fallback) {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }
  function mapLine(rowMappings, sourceLine, sourceSide = 'left') {
    const from = sourceSide === 'right' ? 'rightLine' : 'leftLine';
    const to = sourceSide === 'right' ? 'leftLine' : 'rightLine';
    const grouped = new Map();
    (Array.isArray(rowMappings) ? rowMappings : []).forEach((mapping) => {
      const source = Number(mapping?.[from]);
      const target = Number(mapping?.[to]);
      if (!Number.isFinite(source) || !Number.isFinite(target) || source < 1 || target < 1) return;
      if (!grouped.has(source)) grouped.set(source, []);
      grouped.get(source).push(target);
    });
    const anchors = Array.from(grouped, ([source, targets]) => {
      const ordered = targets.sort((a, b) => a - b);
      const middle = Math.floor(ordered.length / 2);
      const target = ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
      return { source, target };
    }).sort((a, b) => a.source - b.source);
    const line = Number(sourceLine);
    if (!Number.isFinite(line) || !anchors.length) return Number.isFinite(line) ? Math.max(1, line) : 1;
    let lower = null;
    let upper = null;
    for (const anchor of anchors) {
      if (anchor.source <= line) lower = anchor;
      if (anchor.source >= line) { upper = anchor; break; }
    }
    if (lower && upper) {
      if (lower.source === upper.source) return Math.max(1, lower.target);
      const progress = (line - lower.source) / (upper.source - lower.source);
      return Math.max(1, Math.round(lower.target + progress * (upper.target - lower.target)));
    }
    const edge = lower || upper;
    return Math.max(1, Math.round(edge.target + line - edge.source));
  }
  window.OneBoxDeveloperJsonEditor = Object.freeze({ clampSetting, mapLine });
})();