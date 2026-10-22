const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const helperSource = read('dist/dev-json-editor.js');
const context = { window: {} };
vm.runInNewContext(helperSource, context, { filename: 'dev-json-editor.js' });
const editor = context.window.OneBoxDeveloperJsonEditor;

test('JSON editor settings clamp to readable, usable ranges', () => {
  assert.equal(editor.clampSetting(9, 10, 24, 13), 10);
  assert.equal(editor.clampSetting(28, 10, 24, 13), 24);
  assert.equal(editor.clampSetting('480', 240, 1200, 460), 480);
  assert.equal(editor.clampSetting('bad', 240, 1200, 460), 460);
});

test('source highlighting colors JSON tokens and escapes untrusted markup', () => {
  const markup = editor.highlightMarkup('{"name":"OneBox","n":2,"ok":true,"none":null,"html":"<tag>"}');
  assert.match(markup, /class="dev-json-key">&quot;name&quot;/);
  assert.match(markup, /class="dev-json-string">&quot;OneBox&quot;/);
  assert.match(markup, /class="dev-json-number">2/);
  assert.match(markup, /class="dev-json-boolean">true/);
  assert.match(markup, /class="dev-json-null">null/);
  assert.match(markup, /&lt;tag&gt;/);
  assert.doesNotMatch(markup, /<tag>/);
});

test('JSON formatter renders wrapped, adjustable, line-numbered output with a fullscreen overlay', () => {
  const app = read('dist/app.js');
  const css = read('dist/style.css');
  const html = read('dist/index.html');
  const sw = read('dist/sw.js');
  assert.doesNotThrow(() => new vm.Script(app, { filename: 'app.js' }));
  assert.match(app, /wrap="soft"/);
  assert.match(app, /DeveloperJsonEditor\.highlightMarkup/);
  assert.match(app, /dev-json-line-number/);
  assert.match(app, /data-dev-json-adjust/);
  assert.match(app, /json-output-fullscreen/);
  assert.match(app, /lineCounter\.value/);
  assert.match(css, /white-space:pre-wrap/);
  assert.match(css, /dev-json-output-pane\.is-floating/);
  assert.match(css, /resize:vertical/);
  assert.match(css, /\.dev-json-line-number/);
  const helperTag = html.indexOf('dev-json-editor.js');
  const appTag = html.indexOf('app.js?v=');
  assert.ok(helperTag !== -1 && helperTag < appTag);
  assert.match(sw, /dev-json-editor\.js\?v=/);
  assert.match(sw, /CORE_APP_SHELL = APP_SHELL\.slice\(0, 10\)/);
});

test('JSON editor helper passes JavaScript syntax checking', () => {
  assert.doesNotThrow(() => new vm.Script(helperSource, { filename: 'dev-json-editor.js' }));
});
