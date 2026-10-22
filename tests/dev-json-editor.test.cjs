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

test('formatter input displays raw text without syntax highlighting', () => {
  const app = read('dist/app.js');
  const css = read('dist/style.css');
  const editorStart = app.indexOf('function developerJsonEditor(');
  const formatStart = app.indexOf('if (!isCompare) {', editorStart);
  const compareStart = app.indexOf("  const side = field === 'compareLeft'", formatStart);
  assert.ok(editorStart >= 0 && formatStart > editorStart && compareStart > formatStart);
  const inputMarkup = app.slice(formatStart, compareStart);
  assert.match(inputMarkup, /wrap="soft"/);
  assert.match(inputMarkup, /data-dev-field=/);
  const rawBranchStart = inputMarkup.indexOf("? '<textarea class=\"dev-code-input\"");
  const rawBranchEnd = inputMarkup.indexOf("\n      :", rawBranchStart);
  assert.ok(rawBranchStart >= 0 && rawBranchEnd > rawBranchStart);
  const rawBranch = inputMarkup.slice(rawBranchStart, rawBranchEnd);
  assert.match(rawBranch, /wrap="soft"/);
  assert.doesNotMatch(rawBranch, /highlight/);
  assert.match(rawBranch, /data-dev-line-numbered/);
  assert.match(inputMarkup, /dev-line-numbers/);
  assert.doesNotMatch(app, /DeveloperJsonEditor\.highlightMarkup/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /color:var\(--ink\)!important/);
  assert.match(css, /-webkit-text-fill-color:var\(--ink\)!important/);
  assert.match(css, /white-space:pre-wrap!important/);
  assert.match(css, /overflow-wrap:anywhere!important/);
});

test('JSON formatter output keeps syntax colors, line numbers, resizing, and fullscreen overlay', () => {
  const app = read('dist/app.js');
  const css = read('dist/style.css');
  const html = read('dist/index.html');
  const sw = read('dist/sw.js');
  assert.doesNotThrow(() => new vm.Script(app, { filename: 'app.js' }));
  assert.match(app, /dev-json-line-number/);
  assert.match(app, /devJsonTreeNode/);
  assert.match(app, /dev-json-key/);
  assert.match(app, /data-dev-json-adjust/);
  assert.match(app, /json-output-fullscreen/);
  assert.match(app, /lineCounter\.value/);
  assert.match(css, /dev-json-output-pane\.is-floating/);
  const scrollStyles = css.slice(css.lastIndexOf('/* Keep long formatted JSON'));
  assert.ok(scrollStyles.includes('.dev-json-format .dev-json-live-output {'));
  assert.ok(scrollStyles.includes('.dev-json-format .dev-json-live-output > .dev-json-tree,'));
  assert.ok(scrollStyles.includes('.dev-json-output-pane.is-floating .dev-json-live-output {'));
  assert.ok(scrollStyles.includes('overflow:auto!important'));
  assert.ok(scrollStyles.includes('-webkit-overflow-scrolling:touch'));
  assert.ok(scrollStyles.includes('overscroll-behavior:contain'));
  assert.match(css, /resize:vertical/);
  assert.match(css, /\.dev-json-line-number/);
  assert.match(html, /dev-json-editor\.js\?v=2\.18\.707/);
  assert.match(sw, /dev-json-editor\.js\?v=2\.18\.707/);
  assert.match(sw, /CORE_APP_SHELL = APP_SHELL\.slice\(0, 10\)/);
});

test('JSON editor helper passes JavaScript syntax checking', () => {
  assert.doesNotThrow(() => new vm.Script(helperSource, { filename: 'dev-json-editor.js' }));
});

test('JSON formatter shows parse errors in the output pane and keeps successful output clean', () => {
  const app = read('dist/app.js');
  const inputStart = app.indexOf('function renderDeveloperJsonFormat()');
  const inputEnd = app.indexOf('function renderDeveloperCompare()', inputStart);
  const inputMarkup = app.slice(inputStart, inputEnd);
  const outputStart = app.indexOf('function developerLiveOutputMarkup(');
  const outputEnd = app.indexOf('function renderDeveloperCompareResult(', outputStart);
  const outputMarkup = app.slice(outputStart, outputEnd);
  const refreshStart = app.indexOf('function refreshDeveloperLiveOutput(');
  const refreshEnd = app.indexOf('function updateDeveloperLiveState(', refreshStart);
  const refreshMarkup = app.slice(refreshStart, refreshEnd);

  assert.doesNotMatch(inputMarkup, /data-dev-json-input-error|devStatus\(dev\.formatStatus/);
  assert.match(outputMarkup, /if \(dev\.active === 'json-format'\) return String\(dev\.formatInput \|\| ''\)\.trim\(\) && dev\.formatStatus\.startsWith\(t\('devInvalid'\)\) \? devStatus\(dev\.formatStatus, true\) : renderDeveloperJsonTree\(\);/);
  assert.doesNotMatch(outputMarkup, /devStatus\(dev\.formatStatus, dev\.formatStatus\.startsWith/);
  assert.doesNotMatch(refreshMarkup, /data-dev-json-input-error/);
});
