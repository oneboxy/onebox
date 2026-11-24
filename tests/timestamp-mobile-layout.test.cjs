const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', 'dist', name), 'utf8');

test('timestamp swap control lives in the heading and swaps the two field columns', () => {
  const script = read('timestamp-input-output-frame.js');
  const styles = read('page-surface-flat.css');

  assert.match(script, /title\.append\(titleDate, swapButton, titleTimestamp\)/);
  assert.match(script, /fields\.append\(dateField, timestampField\)/);
  assert.match(script, /fields\.classList\.toggle\('is-reversed'\)/);
  assert.match(script, /title\.classList\.toggle\('is-reversed', reversed\)/);
  assert.doesNotMatch(script, /fields\.append\(dateField,\s*swapButton/);
  assert.match(styles, /\.dev-timestamp-bidirectional-fields\.is-reversed > \.is-datetime\s*\{\s*grid-column:\s*2/);
  assert.match(styles, /\.dev-timestamp-bidirectional-fields\.is-reversed > \.is-timestamp\s*\{\s*grid-column:\s*1/);
});

test('timestamp mobile layout keeps both inputs side by side and uses theme colors', () => {
  const styles = read('page-surface-flat.css');
  const mobileStart = styles.lastIndexOf('@media (max-width: 760px) {');
  const mobile = styles.slice(mobileStart);

  assert.ok(mobileStart >= 0);
  assert.match(mobile, /\.dev-timestamp-content\s*\{[^}]*padding-inline:\s*10px/s);
  assert.match(mobile, /\.dev-timestamp-bidirectional-fields\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\)/s);
  assert.match(mobile, /\.dev-timestamp-unit-picker\s*\{[^}]*width:\s*52px/s);
  assert.match(mobile, /\.dev-timestamp-bidirectional-label\s*\{\s*display:\s*none/);
  assert.match(mobile, /\.dev-timestamp-bidirectional\s*\{[^}]*border:\s*0/);
  assert.match(mobile, /\.dev-timestamp-summary-card\s*\{[^}]*background:\s*transparent/s);
  assert.match(mobile, /color:\s*var\(--muted\)/);
  assert.match(styles, /border-color:\s*var\(--line\)/);
});

test('timestamp mobile controls use short unit text and aligned, accessible icons', () => {
  const app = read('app.js');
  const frame = read('timestamp-input-output-frame.js');
  const dateControl = read('timestamp-date-time-control.js');
  const styles = read('page-surface-flat.css');

  assert.match(app, /english \? 'Auto' : '自动'/);
  assert.match(frame, /setAttribute\('aria-label'.*'时间戳'/);
  assert.match(dateControl, /aria-label="' \+ \(english \? 'Date and time' : '时间'\)/);
  assert.match(styles, /\.dev-timestamp-datetime-trigger svg\s*\{[^}]*right:\s*auto[^}]*left:\s*7px/s);
  assert.match(styles, /\.dev-timestamp-datetime-clear\s*\{[^}]*right:\s*3px/s);
});

test('timestamp mobile layout removes the outer input card and compacts fields and results', () => {
  const frame = read('timestamp-input-output-frame.js');

  assert.match(frame, /const scope = '#workspace\[data-tool="dev"\] \.dev-workbench\.dev-timestamp'/);
  assert.match(frame, /dev-timestamp-card\[data-unified-layout="true"\].*?border:0!important/s);
  assert.match(frame, /dev-timestamp-bidirectional-label\{display:none!important\}/);
  assert.match(frame, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)!important/);
  assert.match(frame, /dev-timestamp-summary-card\{.*?min-height:32px!important/s);
  assert.match(frame, /white-space:nowrap!important/);
  assert.match(frame, /color:var\(--muted\)!important/);
});
