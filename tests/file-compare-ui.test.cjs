const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../dist/file-compare-core.js');

function renderPage(language) {
  const workspace = { querySelector() { return null; }, addEventListener() {} };
  const document = { documentElement: { lang: language }, querySelector(selector) { return selector === '#workspace' ? workspace : null; } };
  const window = { OneBoxFileCompare: core };
  const source = fs.readFileSync(path.join(__dirname, '../dist/file-compare-ui.js'), 'utf8');
  vm.runInNewContext(source, { window, document }, { filename: 'file-compare-ui.js' });
  return window.OneBoxFileCompareUI.render();
}

test('puts the file selection instruction before the local-only notice', () => {
  const html = renderPage('zh-CN');
  const instruction = html.indexOf('选择两个文件，查看内容差异');
  const privacy = html.indexOf('文件只在此浏览器内读取和比较');
  assert.ok(instruction >= 0 && privacy > instruction);
  assert.match(html, /class="dev-file-compare-privacy-copy"/);
});

test('uses the center arrow as the accessible swap action and removes the old button', () => {
  const html = renderPage('zh-CN');
  assert.equal((html.match(/data-fc-action="swap"/g) || []).length, 1);
  assert.match(html, /aria-label="交换文件 A 与文件 B"/);
  assert.doesNotMatch(html, />交换</);
  assert.match(html, /class="dev-file-compare-vs" data-fc-action="swap"/);
});

test('keeps the instruction order and swap label in English', () => {
  const html = renderPage('en');
  assert.ok(html.indexOf('Choose two files to inspect their differences') < html.indexOf('Files are read and compared in this browser'));
  assert.match(html, /aria-label="Swap File A and File B"/);
});
