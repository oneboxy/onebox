const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const XLSX = require('../dist/vendor/xlsx.full.min.js');

test('Excel worker parses workbook sheets and preserves cell values', () => {
  const source = fs.readFileSync(path.join(__dirname, '../dist/file-compare-worker.js'), 'utf8');
  const messages = [];
  let onMessage;
  const self = {
    XLSX,
    addEventListener(type, listener) { if (type === 'message') onMessage = listener; },
    postMessage(message) { messages.push(message); },
  };
  vm.runInNewContext(source, { self, importScripts() {} }, { filename: 'file-compare-worker.js' });

  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([['id', 'name'], [1, 'OneBox'], [2, 'local']]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Main');
  const result = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const buffer = result instanceof ArrayBuffer
    ? result
    : result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);

  onMessage({ data: { id: 41, buffer } });
  assert.equal(messages[0].id, 41);
  assert.equal(messages[0].stage, 'parsing');
  assert.equal(messages[1].ok, true);
  assert.equal(JSON.stringify(messages[1].workbook.sheets), JSON.stringify([
    { name: 'Main', rows: [['id', 'name'], [1, 'OneBox'], [2, 'local']] },
  ]));
});

test('Excel worker returns a parse error when the parser rejects a workbook', () => {
  const source = fs.readFileSync(path.join(__dirname, '../dist/file-compare-worker.js'), 'utf8');
  const messages = [];
  let onMessage;
  const self = {
    XLSX: { read() { throw new Error('damaged workbook'); } },
    addEventListener(type, listener) { if (type === 'message') onMessage = listener; },
    postMessage(message) { messages.push(message); },
  };
  vm.runInNewContext(source, { self, importScripts() {} }, { filename: 'file-compare-worker.js' });
  onMessage({ data: { id: 42, buffer: new ArrayBuffer(8) } });
  assert.equal(messages.at(-1).id, 42);
  assert.equal(messages.at(-1).ok, false);
  assert.equal(messages.at(-1).error, 'excel-parse-error');
});
