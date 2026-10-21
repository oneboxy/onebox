const test = require('node:test');
const assert = require('node:assert/strict');
const compare = require('../dist/file-compare-core.js');

test('recognizes the supported local file types', () => {
  assert.equal(compare.fileKind('book.xlsx'), 'workbook');
  assert.equal(compare.fileKind('book.xls'), 'workbook');
  assert.equal(compare.fileKind('data.csv'), 'table');
  assert.equal(compare.fileKind('data.tsv'), 'table');
  assert.equal(compare.fileKind('settings.json'), 'json');
  assert.equal(compare.fileKind('notes.txt'), 'text');
  assert.equal(compare.fileKind('scan.pdf'), '');
});

test('parses CSV quoting, escaped quotes, BOM and CRLF', () => {
  const rows = compare.parseCsv('\uFEFFname,note\r\nA,"has, comma"\r\nB,"says ""hi"""\r\n');
  assert.deepEqual(rows, [
    ['name', 'note'],
    ['A', 'has, comma'],
    ['B', 'says "hi"'],
  ]);
  assert.deepEqual(compare.parseCsv('姓名\t城市\n小明\t杭州'), [['姓名', '城市'], ['小明', '杭州']]);
  assert.deepEqual(compare.parseCsv('id,note\n1,"first line\nsecond line"'), [['id', 'note'], ['1', 'first line\nsecond line']]);
});

test('compares JSON structurally and ignores object key order', () => {
  const same = compare.compareJson('{"b":2,"a":{"x":1}}', '{"a":{"x":1},"b":2}');
  assert.equal(same.error, '');
  assert.deepEqual(same.changes, []);

  const result = compare.compareJson(
    '{"users":[{"id":1,"name":"A"}],"gone":true}',
    '{"users":[{"id":1,"name":"B"},{"id":2}],"added":3}',
  );
  assert.deepEqual(result.changes.map((item) => [item.path, item.kind]), [
    ['$.added', 'added'],
    ['$.gone', 'removed'],
    ['$.users[0].name', 'changed'],
    ['$.users[1]', 'added'],
  ]);
});

test('reports invalid JSON on the correct side', () => {
  assert.equal(compare.compareJson('{', '{}').error, 'invalid-left-json');
  assert.equal(compare.compareJson('{}', '{').error, 'invalid-right-json');
});

test('aligns text edits and distinguishes additions and removals', () => {
  const result = compare.compareText('alpha\nbeta\ngamma', 'alpha\nbetter\ngamma\ndelta');
  assert.equal(result.truncatedAlignment, false);
  assert.deepEqual(result.rows.map((row) => row.kind), ['changed', 'added']);
  assert.deepEqual(result.rows[0], { kind: 'changed', leftLine: 2, rightLine: 2, before: 'beta', after: 'better' });
  assert.equal(result.rows[1].after, 'delta');
});

test('ignores line ending style when comparing text', () => {
  assert.deepEqual(compare.compareText('first\r\nsecond\r\n', 'first\nsecond\n').rows, []);
});

test('returns an aligned fallback for very large text inputs', () => {
  const left = Array.from({ length: 1800 }, (_, index) => 'left-' + index).join('\n');
  const right = Array.from({ length: 1800 }, (_, index) => 'right-' + index).join('\n');
  const result = compare.compareText(left, right);
  assert.equal(result.truncatedAlignment, true);
  assert.ok(result.rows.length > 0);
});

test('compares spreadsheet cell addresses and treats blank cells as empty', () => {
  const changes = compare.compareMatrices([[1, 'same'], ['old', '']], [[1, 'same'], ['new', 'added']]);
  assert.deepEqual(changes, [
    { kind: 'changed', sheet: '', address: 'A2', before: 'old', after: 'new' },
    { kind: 'added', sheet: '', address: 'B2', before: '', after: 'added' },
  ]);
  assert.equal(compare.columnLabel(26), 'AA');
  assert.deepEqual(compare.compareMatrices([[1]], [['1']]), []);
});

test('matches table rows by key regardless of order and finds field edits', () => {
  const result = compare.compareRowsByKey(
    [['id', 'name', 'city'], ['1', 'An', 'Hangzhou'], ['2', 'Bo', 'Ningbo']],
    [['city', 'id', 'name'], ['Ningbo', '2', 'Bo'], ['Suzhou', '3', 'Cy'], ['Hangzhou', '1', 'Ann']],
    'id',
  );
  assert.equal(result.error, '');
  assert.deepEqual(result.changes.map(({ kind, key, field }) => [kind, key, field]), [
    ['changed', '1', 'name'],
    ['added', '3', ''],
  ]);
});

test('reports duplicate and missing record keys instead of guessing', () => {
  const result = compare.compareRowsByKey(
    [['id', 'value'], ['1', 'a'], ['1', 'b'], ['', 'missing']],
    [['id', 'value'], ['1', 'c'], ['2', 'new']],
    'id',
  );
  assert.deepEqual(result.duplicates, { left: ['1'], right: [] });
  assert.deepEqual(result.missingKeys, { left: 1, right: 0 });
  assert.ok(result.changes.some((item) => item.kind === 'added' && item.key === '2'));
  assert.ok(!result.changes.some((item) => item.key === '1'));
});

test('compares workbooks and reports added and removed worksheets', () => {
  const result = compare.compareWorkbooks(
    { sheets: [{ name: 'Main', rows: [['a'], ['old']] }, { name: 'Gone', rows: [] }] },
    { sheets: [{ name: 'Main', rows: [['a'], ['new']] }, { name: 'New', rows: [] }] },
  );
  assert.deepEqual(result.changes.map((item) => [item.kind, item.sheet, item.address]), [
    ['sheet-removed', 'Gone', ''],
    ['sheet-added', 'New', ''],
    ['changed', 'Main', 'A2'],
  ]);
});

test('cell comparison respects the selected worksheet while listing added and removed sheets', () => {
  const left = { sheets: [
    { name: 'Main', rows: [['value'], ['same']] },
    { name: 'Other', rows: [['value'], ['before']] },
    { name: 'Removed', rows: [] },
  ] };
  const right = { sheets: [
    { name: 'Main', rows: [['value'], ['same']] },
    { name: 'Other', rows: [['value'], ['after']] },
    { name: 'Added', rows: [] },
  ] };
  const selectedMain = compare.compareWorkbooks(left, right, { sheetName: 'Main' });
  assert.deepEqual(selectedMain.changes.map(({ kind, sheet }) => [kind, sheet]), [
    ['sheet-removed', 'Removed'],
    ['sheet-added', 'Added'],
  ]);
  const selectedOther = compare.compareWorkbooks(left, right, { sheetName: 'Other' });
  assert.ok(selectedOther.changes.some((item) => item.kind === 'changed' && item.sheet === 'Other' && item.address === 'A2'));
});
