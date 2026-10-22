(() => {
  'use strict';
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function clampSetting(value, min, max, fallback) {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
  }
  function highlightMarkup(value) {
    const source = String(value ?? '');
    const token = /"(?:\\.|[^"\\])*"|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|[{}\[\],:]/g;
    let cursor = 0;
    let markup = '';
    let match;
    while ((match = token.exec(source))) {
      const raw = match[0];
      markup += escapeHtml(source.slice(cursor, match.index));
      let type = '';
      if (raw[0] === '"') type = /^\s*:/.test(source.slice(match.index + raw.length)) ? 'key' : 'string';
      else if (raw === 'true' || raw === 'false') type = 'boolean';
      else if (raw === 'null') type = 'null';
      else if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(raw)) type = 'number';
      else type = 'bracket';
      markup += '<span class="dev-json-' + type + '">' + escapeHtml(raw) + '</span>';
      cursor = match.index + raw.length;
    }
    markup += escapeHtml(source.slice(cursor));
    return markup + (source.endsWith('\n') ? ' ' : '');
  }
  window.OneBoxDeveloperJsonEditor = Object.freeze({ clampSetting, highlightMarkup });
})();
