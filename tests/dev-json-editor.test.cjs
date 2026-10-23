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

test('comparison scroll mapping pairs rows across different line numbers', () => {
  const anchors = [
    { leftLine: 1, rightLine: 1 },
    { leftLine: 20, rightLine: 32 },
    { leftLine: 40, rightLine: 64 },
  ];
  assert.equal(editor.mapLine(anchors, 10, 'left'), 16);
  assert.equal(editor.mapLine(anchors, 16, 'right'), 10);
  assert.equal(editor.mapLine(anchors, 48, 'right'), 30);
  assert.equal(editor.mapLine([
    { leftLine: 10, rightLine: 20 },
    { leftLine: 10, rightLine: 30 },
  ], 10, 'left'), 25);
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
  assert.match(app, /developerJsonFindMappedPathRange/);
  assert.match(app, /data-dev-compare-line-map/);
  assert.match(app, /rowMappings: monotonicRows/);
  assert.match(app, /syncDeveloperCompareScroll/);
  assert.match(css, /dev-compare-map-line/);
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
  assert.match(html, /dev-json-editor\.js\?v=2\.18\.726/);
  assert.match(sw, /dev-json-editor\.js\?v=2\.18\.726/);
  assert.match(sw, /CORE_APP_SHELL = APP_SHELL\.slice\(0, 10\)/);
});


test('timestamp conversion uses a horizontal country matrix with aligned city rows', () => {
  const app = read('dist/app.js');
  const css = read('dist/style.css');
  const html = read('dist/index.html');
  const sw = read('dist/sw.js');
  const timestampMatrix = css.slice(css.lastIndexOf('/* 2.18.726: show timestamp countries'));
  const inputStart = app.indexOf('function renderDeveloperTimestamp()');
  const inputEnd = app.indexOf('let lastDeveloperCompareResult', inputStart);
  const outputStart = app.indexOf('function renderDeveloperTimestampResult()');
  const outputEnd = app.indexOf('function refreshDeveloperLiveOutput(', outputStart);
  assert.ok(inputStart >= 0 && inputEnd > inputStart);
  assert.ok(outputStart >= 0 && outputEnd > outputStart);
  const inputMarkup = app.slice(inputStart, inputEnd);
  const outputMarkup = app.slice(outputStart, outputEnd);
  assert.doesNotThrow(() => new vm.Script(app, { filename: 'app.js' }));
  assert.match(app, /const APP_VERSION = '2\.18\.726';/);
  assert.match(inputMarkup, /dev-timestamp-mode-bar[^]*dev-timestamp-content/);
  assert.match(inputMarkup, /dev-timestamp-content[^]*devPaneHead\(t\('devInput'\)\)[^]*devOutputPaneHead\('timestamp', t\('devOutput'\)/);
  assert.match(inputMarkup, /timestampUnit[^]*<\/select>' \+ inputActions/);
  assert.doesNotMatch(inputMarkup, /自动识别常见的秒或毫秒时间戳/);
  assert.match(outputMarkup, /dev-timestamp-country-header-row/);
  assert.match(outputMarkup, /dev-timestamp-city-row/);
  assert.match(outputMarkup, /data-dev-country-id=/);
  assert.match(outputMarkup, /data-dev-country-key=/);
  assert.match(outputMarkup, /data-dev-action="timestamp-city-add-open"/);
  assert.match(outputMarkup, /dev-timestamp-city-add-inline/);
  assert.match(outputMarkup, /data-dev-action="timestamp-city-expand"/);
  assert.match(outputMarkup, /countryFlags\[country\]/);
  assert.doesNotMatch(outputMarkup, /个城市|\d+ cities/);
  assert.match(timestampMatrix, /grid-template-columns:\s*repeat\(var\(--dev-timestamp-country-count/);
  assert.match(timestampMatrix, /\.dev-timestamp-city-row\s*\{[^}]*border-bottom/s);
  assert.match(timestampMatrix, /\.dev-timestamp-city-card\s*\{[^}]*border:\s*0/s);
  assert.match(timestampMatrix, /\.dev-timestamp-country-list\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(html, /app\.js\?v=2\.18\.726/);
  assert.match(sw, /app\.js\?v=2\.18\.726/);
  assert.match(sw, /onebox-v657/);
});

test('timestamp cities collapse, can be added and reordered; country drag reorders the full matrix', () => {
  const app = read('dist/app.js');
  const css = read('dist/style.css');
  const timestampMatrix = css.slice(css.lastIndexOf('/* 2.18.726: show timestamp countries'));
  const stateStart = app.indexOf('function normalizeDevTools(value)');
  const stateEnd = app.indexOf('const initialDevTools', stateStart);
  const rowsStart = app.indexOf('function developerTimestampRows(date, mode)');
  const rowsEnd = app.indexOf('function developerTimestampResult()', rowsStart);
  const outputStart = app.indexOf('function renderDeveloperTimestampResult()');
  const outputEnd = app.indexOf('function refreshDeveloperLiveOutput(', outputStart);
  const actionStart = app.indexOf('function runDeveloperAction(action, sourceEvent = null)');
  const actionEnd = app.indexOf('function loadDeveloperRecord(', actionStart);
  const stateMarkup = app.slice(stateStart, stateEnd);
  const rowMarkup = app.slice(rowsStart, rowsEnd);
  const outputMarkup = app.slice(outputStart, outputEnd);
  const timestampRowsSource = rowMarkup.slice(0, rowMarkup.indexOf('function developerTimestampResult()')).trim();
  const timestampRows = vm.runInNewContext('(' + timestampRowsSource + ')', {
    state: { language: 'en', devTools: { timestampCustomCities: [], timestampCityOrder: {} } },
    DEV_TIMESTAMP_COUNTRIES: [],
    developerTimestampRelative: () => 'now',
  });
  assert.equal(timestampRows(new Date(0), 'timestamp').filter((row) => row.city).length, 23);
  const actionMarkup = app.slice(actionStart, actionEnd);
  const countryDragStart = app.indexOf('let activeTimestampCountryDrag = null;');
  const countryDragEnd = app.indexOf('let activeTimestampCityDrag = null;', countryDragStart);
  const countryDragMarkup = app.slice(countryDragStart, countryDragEnd);
  const cityDragMarkup = app.slice(countryDragEnd, app.indexOf("document.addEventListener('pointerup', finishTimestampCityDrag)", countryDragEnd));

  assert.match(app, /devTimestamp: '时间'/);
  assert.match(app, /DEV_TIMESTAMP_COUNTRIES = Object\.freeze/);
  assert.match(stateMarkup, /timestampCustomCities/);
  assert.match(stateMarkup, /timestampCityOrder/);
  assert.match(stateMarkup, /timestampExpandedCountries/);
  assert.match(stateMarkup, /timestampCountryOrder/);
  assert.match(rowMarkup, /const customCities =/);
  assert.match(rowMarkup, /countryKey,/);
  assert.match(rowMarkup, /cityRows\.sort/);
  assert.match(outputMarkup, /rows\.slice\(0, 3\)/);
  assert.match(outputMarkup, /data-dev-action="timestamp-city-expand"/);
  assert.match(outputMarkup, /data-dev-action="timestamp-city-add-open"/);
  assert.match(outputMarkup, /dev-timestamp-city-add-inline/);
  assert.match(outputMarkup, /data-dev-country-id=/);
  assert.match(outputMarkup, /data-dev-timestamp-row=/);
  assert.match(actionMarkup, /timestamp-city-add/);
  assert.match(actionMarkup, /validDeveloperTimeZone\(timeZone\)/);
  assert.match(app, /timestampCityOrder\[drag\.countryKey\]/);
  assert.match(countryDragMarkup, /finishTimestampCountryDrag/);
  assert.match(countryDragMarkup, /timestampCountryOrder =/);
  assert.match(countryDragMarkup, /cell\.animate\?\.\(/);
  assert.match(countryDragMarkup, /\.dev-timestamp-city-row/);
  assert.match(cityDragMarkup, /timestampCityOrderInMatrix/);
  assert.match(cityDragMarkup, /dataset\.devCountryKey/);
  assert.match(actionMarkup, /timestampLive = true/);
  assert.match(actionMarkup, /stopDeveloperTimestampLive\(\)/);
  assert.match(app, /document\.addEventListener\('touchmove'[^]*passive: false/);
  assert.match(app, /document\.addEventListener\('pointermove'/);
  assert.match(app, /refreshDeveloperLiveOutput\(\)/);
  assert.match(timestampMatrix, /grid-template-columns:\s*repeat\(var\(--dev-timestamp-country-count/);
  assert.match(timestampMatrix, /\.dev-timestamp-city-row\s*\{[^}]*border-bottom/s);
  assert.match(timestampMatrix, /\.dev-timestamp-city-form-row/);
  assert.match(timestampMatrix, /font-size:\s*12px/);
});
test('JSON editor helper passes JavaScript syntax checking', () => {
  assert.doesNotThrow(() => new vm.Script(helperSource, { filename: 'dev-json-editor.js' }));
  assert.equal(typeof editor.mapLine, 'function');
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


test('JSON comparison keeps its change count with JSON B and provides zoom plus paired fullscreen', () => {
  const app = read('dist/app.js');
  const css = read('dist/style.css');
  const compareStart = app.indexOf('function renderDeveloperCompare()');
  const compareEnd = app.indexOf('function renderDeveloperStatsCards(', compareStart);
  const compareMarkup = app.slice(compareStart, compareEnd);

  assert.ok(compareStart >= 0 && compareEnd > compareStart);
  assert.match(compareMarkup, /dev-compare-right-head/);
  assert.match(compareMarkup, /developerCompareInlineStatusMarkup\(comparison\)/);
  assert.match(compareMarkup, /jsonCompareLeftFontSize/);
  assert.match(compareMarkup, /jsonCompareRightFontSize/);
  assert.match(compareMarkup, /devJsonCompareFullscreenButton\(dev\.compareFullscreen\)/);
  assert.doesNotMatch(compareMarkup, /dev-json-compare-backdrop/);
  const toolStart = app.indexOf('function developerTool()');
  const toolEnd = app.indexOf('function syncDeveloperFullscreenFrame()', toolStart);
  const toolMarkup = app.slice(toolStart, toolEnd);
  assert.match(toolMarkup, /const modalOverlay = mode === 'json-compare'/);
  assert.ok(toolMarkup.includes("+ modalOverlay + '<nav class=\"dev-mode-tabs\""));
  assert.doesNotMatch(compareMarkup, /dev-compare-inline-status[^<]*<div class="dev-compare-grid"/);
  assert.match(app, /jsonCompareLeftFontSize: DeveloperJsonEditor\.clampSetting/);
  assert.match(app, /jsonCompareRightFontSize: DeveloperJsonEditor\.clampSetting/);
  assert.match(app, /dev\.compareFullscreen = !dev\.compareFullscreen/);
  assert.match(css, /dev-json-compare\.is-floating/);
  assert.match(css, /dev-compare-editor \{\s*font-size: var\(--dev-json-compare-font-size, 13px\)/);
  assert.match(css, /dev-compare-modal-open/);
  assert.match(css, /\.dev-json-compare \.dev-compare-right-head \.dev-pane-actions \{\s*margin-left:\s*auto;/);
});
