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
  assert.match(mobile, /color:\s*var\(--muted\)/);
  assert.match(styles, /border-color:\s*var\(--line\)/);
});
