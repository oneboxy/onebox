const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', 'dist', name), 'utf8');

test('JSON format and compare panes stay aligned on desktop', () => {
  const styles = read('dev-json-workbench-clean.css');

  assert.match(styles, /@media \(min-width: 761px\)/);
  assert.match(styles, /\.dev-workbench\.dev-json-format > \.dev-editor-grid[\s\S]*?align-items:\s*stretch/);
  assert.match(styles, /\.dev-workbench\.dev-json-compare > \.dev-compare-grid[\s\S]*?align-items:\s*stretch/);
  assert.match(styles, /\.dev-json-output-pane\s*\{\s*padding-bottom:\s*0 !important/);
  assert.match(styles, /\.dev-json-output-pane:not\(\.is-floating\) \.dev-json-live-output\s*\{[\s\S]*?height:\s*var\(--dev-json-output-height, 460px\) !important/);
  assert.match(styles, /\.dev-workbench\.dev-json-compare \.dev-code-editor\s*\{[\s\S]*?flex:\s*1 1 auto/);
});

test('JSON history badges are hidden and the popup controls are unboxed', () => {
  const styles = read('dev-json-workbench-clean.css');
  const app = read('app.js');
  const index = read('index.html');
  const sw = read('sw.js');

  assert.match(styles, /\.dev-workbench\.dev-json-format \.dev-history-count[\s\S]*?\.dev-workbench\.dev-json-compare \.dev-history-count[\s\S]*?display:\s*none/);
  assert.match(styles, /\.dev-workbench:is\(\.dev-json-format, \.dev-json-compare\) \.dev-history-modal \.dev-history-modal-card/);
  assert.match(styles, /\.dev-history-modal \.dev-history-clear,[\s\S]*?\.dev-history-modal \.dev-history-close[\s\S]*?border:\s*0 !important/);
  assert.match(styles, /\.dev-history-modal-head h2\s*\{[^}]*font-size:\s*16px/s);
  assert.match(index, /dev-json-workbench-clean\.css\?v=1\.0\.3/);
  assert.match(sw, /onebox-v1212/);
  assert.match(sw, /dev-json-workbench-clean\.css\?v=1\.0\.3/);
  assert.match(index, /app\.js\?v=2\.18\.1041/);
  assert.match(sw, /app\.js\?v=2\.18\.1041/);
  assert.match(app, /const historyActions = floating \? '' : devHistoryToggle\('json-format'\)/);
  assert.match(app, /const historyContent = floating \? '' : devHistoryContent\('json-format'\)/);
});

test('developer history delete action uses the existing trash glyph', () => {
  const app = read('app.js');
  const historyMarkup = app.slice(app.indexOf('function devHistoryContent(kind)'), app.indexOf('\nfunction developerJsonFormattedLineCount'));

  assert.match(historyMarkup, /class="swipe-delete dev-history-delete" type="button"[\s\S]*?aria-label=/);
  assert.match(historyMarkup, /<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5M14 11v5"\/><\/svg><\/button>/);
  assert.match(read('dev-json-workbench-clean.css'), /\.dev-history-delete svg\s*\{[^}]*stroke-width:\s*1\.7/s);
});
