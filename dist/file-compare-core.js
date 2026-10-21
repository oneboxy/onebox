((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OneBoxFileCompare = api;
})(typeof globalThis === 'undefined' ? this : globalThis, () => {
  'use strict';

  const MAX_LCS_CELLS = 3_000_000;

  function fileKind(name) {
    const extension = String(name || '').split('.').pop().toLowerCase();
    if (['xlsx', 'xls'].includes(extension)) return 'workbook';
    if (['csv', 'tsv'].includes(extension)) return 'table';
    if (extension === 'json') return 'json';
    if (['txt', 'log', 'md'].includes(extension)) return 'text';
    return '';
  }

  function detectCsvDelimiter(text) {
    const sample = String(text || '').replace(/^\uFEFF/, '').slice(0, 8192);
    const candidates = [',', '\t', ';', '|'];
    const counts = new Map(candidates.map((delimiter) => [delimiter, 0]));
    let quoted = false;
    for (let i = 0; i < sample.length; i += 1) {
      const char = sample[i];
      if (char === '"') {
        if (quoted && sample[i + 1] === '"') i += 1;
        else quoted = !quoted;
      } else if (!quoted && counts.has(char)) counts.set(char, counts.get(char) + 1);
      else if (!quoted && (char === '\n' || char === '\r')) {
        // Favor the delimiter that recurs across records instead of stray punctuation.
      }
    }
    return candidates.reduce((best, delimiter) => counts.get(delimiter) > counts.get(best) ? delimiter : best, ',');
  }

  function parseCsv(text, delimiter) {
    const source = String(text == null ? '' : text).replace(/^\uFEFF/, '');
    const separator = delimiter || detectCsvDelimiter(source);
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < source.length; i += 1) {
      const char = source[i];
      if (quoted) {
        if (char === '"' && source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"' && field.length === 0) quoted = true;
      else if (char === separator) {
        row.push(field);
        field = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && source[i + 1] === '\n') i += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else field += char;
    }
    if (field.length || row.length || (!rows.length && source.length)) {
      row.push(field);
      rows.push(row);
    }
    while (rows.length && rows[rows.length - 1].every((value) => value === '')) rows.pop();
    return rows;
  }

  function comparable(value) {
    if (value == null) return '';
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }

  function display(value) {
    if (value == null || value === '') return '';
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString();
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  function columnLabel(index) {
    let value = index + 1;
    let label = '';
    while (value > 0) {
      const remainder = (value - 1) % 26;
      label = String.fromCharCode(65 + remainder) + label;
      value = Math.floor((value - 1) / 26);
    }
    return label;
  }

  function compareMatrices(leftRows, rightRows, sheetName) {
    const left = Array.isArray(leftRows) ? leftRows : [];
    const right = Array.isArray(rightRows) ? rightRows : [];
    const changes = [];
    const rowCount = Math.max(left.length, right.length);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      const leftRow = Array.isArray(left[rowIndex]) ? left[rowIndex] : [];
      const rightRow = Array.isArray(right[rowIndex]) ? right[rowIndex] : [];
      const columnCount = Math.max(leftRow.length, rightRow.length);
      for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
        const before = leftRow[columnIndex] == null ? '' : leftRow[columnIndex];
        const after = rightRow[columnIndex] == null ? '' : rightRow[columnIndex];
        const leftValue = comparable(before);
        const rightValue = comparable(after);
        if (leftValue === rightValue) continue;
        changes.push({
          kind: leftValue === '' ? 'added' : rightValue === '' ? 'removed' : 'changed',
          sheet: sheetName || '',
          address: columnLabel(columnIndex) + (rowIndex + 1),
          before: display(before),
          after: display(after),
        });
      }
    }
    return changes;
  }

  function rowObject(headers, row) {
    const result = {};
    headers.forEach((header, index) => { result[String(header || columnLabel(index))] = row[index] == null ? '' : row[index]; });
    return result;
  }

  function compareRowsByKey(leftRows, rightRows, keyColumn) {
    const left = Array.isArray(leftRows) ? leftRows : [];
    const right = Array.isArray(rightRows) ? rightRows : [];
    const leftHeaders = (left[0] || []).map((value) => String(value == null ? '' : value).trim());
    const rightHeaders = (right[0] || []).map((value) => String(value == null ? '' : value).trim());
    const key = String(keyColumn == null ? '' : keyColumn).trim();
    const leftKeyIndex = typeof keyColumn === 'number' ? keyColumn : leftHeaders.indexOf(key);
    const rightKeyIndex = typeof keyColumn === 'number' ? keyColumn : rightHeaders.indexOf(key);
    if (!key || leftKeyIndex < 0 || rightKeyIndex < 0) return { changes: [], duplicates: { left: [], right: [] }, missingKeys: { left: 0, right: 0 }, error: 'key-not-found' };

    const collect = (rows, index) => {
      const grouped = new Map();
      let missingKeys = 0;
      rows.slice(1).forEach((row, offset) => {
        const values = Array.isArray(row) ? row : [];
        const rawKey = values[index];
        const normalizedKey = rawKey == null ? '' : String(rawKey).trim();
        if (!normalizedKey) { missingKeys += 1; return; }
        const list = grouped.get(normalizedKey) || [];
        list.push({ row: values, rowNumber: offset + 2 });
        grouped.set(normalizedKey, list);
      });
      const duplicates = [...grouped.entries()].filter(([, records]) => records.length > 1).map(([value]) => value);
      return { grouped, duplicates, missingKeys };
    };
    const leftData = collect(left, leftKeyIndex);
    const rightData = collect(right, rightKeyIndex);
    const ambiguous = new Set([...leftData.duplicates, ...rightData.duplicates]);
    const changes = [];
    const keys = new Set([...leftData.grouped.keys(), ...rightData.grouped.keys()]);
    for (const value of keys) {
      if (ambiguous.has(value)) continue;
      const leftRecord = leftData.grouped.get(value)?.[0];
      const rightRecord = rightData.grouped.get(value)?.[0];
      if (!leftRecord) {
        changes.push({ kind: 'added', key: value, field: '', before: '', after: JSON.stringify(rowObject(rightHeaders, rightRecord.row)), rightRow: rightRecord.rowNumber });
        continue;
      }
      if (!rightRecord) {
        changes.push({ kind: 'removed', key: value, field: '', before: JSON.stringify(rowObject(leftHeaders, leftRecord.row)), after: '', leftRow: leftRecord.rowNumber });
        continue;
      }
      const fields = [...new Set([...leftHeaders, ...rightHeaders])];
      for (const field of fields) {
        if (field === key) continue;
        const leftIndex = leftHeaders.indexOf(field);
        const rightIndex = rightHeaders.indexOf(field);
        const before = leftIndex < 0 ? '' : display(leftRecord.row[leftIndex]);
        const after = rightIndex < 0 ? '' : display(rightRecord.row[rightIndex]);
        if (comparable(before) !== comparable(after)) changes.push({ kind: 'changed', key: value, field, before, after, leftRow: leftRecord.rowNumber, rightRow: rightRecord.rowNumber });
      }
    }
    return { changes, duplicates: { left: leftData.duplicates, right: rightData.duplicates }, missingKeys: { left: leftData.missingKeys, right: rightData.missingKeys }, error: '' };
  }

  function compareWorkbooks(leftWorkbook, rightWorkbook, options = {}) {
    const leftSheets = new Map((leftWorkbook?.sheets || []).map((sheet) => [String(sheet.name), sheet]));
    const rightSheets = new Map((rightWorkbook?.sheets || []).map((sheet) => [String(sheet.name), sheet]));
    const changes = [];
    const commonNames = [...leftSheets.keys()].filter((name) => rightSheets.has(name));
    for (const [name, sheet] of leftSheets) if (!rightSheets.has(name)) changes.push({ kind: 'sheet-removed', sheet: name, address: '', before: '工作表存在', after: '' });
    for (const [name, sheet] of rightSheets) if (!leftSheets.has(name)) changes.push({ kind: 'sheet-added', sheet: name, address: '', before: '', after: '工作表新增' });
    if (options.mode === 'rows') {
      const name = options.sheetName || commonNames[0];
      if (!name || !leftSheets.has(name) || !rightSheets.has(name)) return { changes, error: 'sheet-not-found', duplicates: { left: [], right: [] }, missingKeys: { left: 0, right: 0 } };
      if (!options.keyColumn) return { changes, error: 'key-not-found', duplicates: { left: [], right: [] }, missingKeys: { left: 0, right: 0 } };
      const rowResult = compareRowsByKey(leftSheets.get(name).rows, rightSheets.get(name).rows, options.keyColumn);
      return { ...rowResult, changes: changes.concat(rowResult.changes.map((item) => ({ ...item, sheet: name }))) };
    }
    const namesToCompare = options.sheetName ? commonNames.filter((name) => name === options.sheetName) : commonNames;
    for (const name of namesToCompare) changes.push(...compareMatrices(leftSheets.get(name).rows, rightSheets.get(name).rows, name));
    return { changes, error: '', duplicates: { left: [], right: [] }, missingKeys: { left: 0, right: 0 } };
  }

  function compareJsonValues(left, right, path, changes) {
    const leftArray = Array.isArray(left);
    const rightArray = Array.isArray(right);
    const leftObject = left !== null && typeof left === 'object';
    const rightObject = right !== null && typeof right === 'object';
    if (leftArray !== rightArray || leftObject !== rightObject) {
      if (!leftObject && !rightObject && Object.is(left, right)) return;
      changes.push({ kind: 'changed', path, before: display(left), after: display(right) });
      return;
    }
    if (!leftObject) {
      if (!Object.is(left, right)) changes.push({ kind: 'changed', path, before: display(left), after: display(right) });
      return;
    }
    if (leftArray) {
      const length = Math.max(left.length, right.length);
      for (let index = 0; index < length; index += 1) {
        const childPath = path + '[' + index + ']';
        if (index >= left.length) changes.push({ kind: 'added', path: childPath, before: '', after: display(right[index]) });
        else if (index >= right.length) changes.push({ kind: 'removed', path: childPath, before: display(left[index]), after: '' });
        else compareJsonValues(left[index], right[index], childPath, changes);
      }
      return;
    }
    const leftKeys = Object.keys(left).sort();
    const rightKeys = Object.keys(right).sort();
    const keys = [...new Set([...leftKeys, ...rightKeys])].sort();
    for (const key of keys) {
      const childPath = path + ( /^[A-Za-z_$][\w$]*$/.test(key) ? '.' + key : '[' + JSON.stringify(key) + ']');
      if (!Object.prototype.hasOwnProperty.call(left, key)) changes.push({ kind: 'added', path: childPath, before: '', after: display(right[key]) });
      else if (!Object.prototype.hasOwnProperty.call(right, key)) changes.push({ kind: 'removed', path: childPath, before: display(left[key]), after: '' });
      else compareJsonValues(left[key], right[key], childPath, changes);
    }
  }

  function compareJson(leftText, rightText) {
    let left;
    let right;
    try { left = JSON.parse(String(leftText)); } catch (error) { return { changes: [], error: 'invalid-left-json', detail: error.message }; }
    try { right = JSON.parse(String(rightText)); } catch (error) { return { changes: [], error: 'invalid-right-json', detail: error.message }; }
    const changes = [];
    compareJsonValues(left, right, '$', changes);
    return { changes, error: '' };
  }

  function fallbackTextDiff(left, right) {
    let prefix = 0;
    while (prefix < left.length && prefix < right.length && left[prefix] === right[prefix]) prefix += 1;
    let suffix = 0;
    while (suffix < left.length - prefix && suffix < right.length - prefix && left[left.length - 1 - suffix] === right[right.length - 1 - suffix]) suffix += 1;
    const leftMiddle = left.slice(prefix, left.length - suffix);
    const rightMiddle = right.slice(prefix, right.length - suffix);
    const rows = [];
    for (let index = 0; index < Math.max(leftMiddle.length, rightMiddle.length); index += 1) {
      const before = leftMiddle[index];
      const after = rightMiddle[index];
      rows.push({ kind: before == null ? 'added' : after == null ? 'removed' : 'changed', leftLine: before == null ? null : prefix + index + 1, rightLine: after == null ? null : prefix + index + 1, before: before || '', after: after || '' });
    }
    return rows;
  }

  function compareText(leftText, rightText) {
    const left = String(leftText == null ? '' : leftText).replace(/\r\n?/g, '\n').split('\n');
    const right = String(rightText == null ? '' : rightText).replace(/\r\n?/g, '\n').split('\n');
    const columns = right.length + 1;
    const cells = (left.length + 1) * columns;
    if (cells > MAX_LCS_CELLS) return { rows: fallbackTextDiff(left, right), truncatedAlignment: true };
    const lcs = new Uint32Array(cells);
    for (let i = left.length - 1; i >= 0; i -= 1) {
      const rowOffset = i * columns;
      const nextRowOffset = (i + 1) * columns;
      for (let j = right.length - 1; j >= 0; j -= 1) {
        lcs[rowOffset + j] = left[i] === right[j]
          ? lcs[nextRowOffset + j + 1] + 1
          : Math.max(lcs[nextRowOffset + j], lcs[rowOffset + j + 1]);
      }
    }
    const operations = [];
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      if (left[i] === right[j]) {
        operations.push({ kind: 'same', leftLine: i + 1, rightLine: j + 1, before: left[i], after: right[j] });
        i += 1;
        j += 1;
      } else if (lcs[(i + 1) * columns + j] >= lcs[i * columns + j + 1]) {
        operations.push({ kind: 'removed', leftLine: i + 1, rightLine: null, before: left[i], after: '' });
        i += 1;
      } else {
        operations.push({ kind: 'added', leftLine: null, rightLine: j + 1, before: '', after: right[j] });
        j += 1;
      }
    }
    while (i < left.length) { operations.push({ kind: 'removed', leftLine: i + 1, rightLine: null, before: left[i], after: '' }); i += 1; }
    while (j < right.length) { operations.push({ kind: 'added', leftLine: null, rightLine: j + 1, before: '', after: right[j] }); j += 1; }

    const rows = [];
    for (let cursor = 0; cursor < operations.length;) {
      if (operations[cursor].kind === 'same') { cursor += 1; continue; }
      const removed = [];
      const added = [];
      while (cursor < operations.length && operations[cursor].kind !== 'same') {
        const operation = operations[cursor++];
        (operation.kind === 'removed' ? removed : added).push(operation);
      }
      const paired = Math.min(removed.length, added.length);
      for (let index = 0; index < paired; index += 1) rows.push({ kind: 'changed', leftLine: removed[index].leftLine, rightLine: added[index].rightLine, before: removed[index].before, after: added[index].after });
      for (let index = paired; index < removed.length; index += 1) rows.push(removed[index]);
      for (let index = paired; index < added.length; index += 1) rows.push(added[index]);
    }
    return { rows, truncatedAlignment: false };
  }

  return { fileKind, detectCsvDelimiter, parseCsv, comparable, display, columnLabel, compareMatrices, compareRowsByKey, compareWorkbooks, compareJson, compareText };
});
