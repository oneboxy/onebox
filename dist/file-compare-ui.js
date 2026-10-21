(() => {
  'use strict';

  const core = window.OneBoxFileCompare;
  const workspace = document.querySelector('#workspace');
  if (!core || !workspace) return;

  const MAX_FILE_BYTES = 20 * 1024 * 1024;
  const WORKER_SRC = 'file-compare-worker.js?v=2.18.692';
  const state = {
    left: { file: null, kind: '', data: null, loading: false, error: '' },
    right: { file: null, kind: '', data: null, loading: false, error: '' },
    mode: 'cells',
    sheetName: '',
    keyColumn: '',
    filter: 'all',
    result: null,
    status: '',
    progress: '',
    worker: null,
    requestId: 0,
  };

  const english = () => String(document.documentElement.lang || '').toLowerCase().startsWith('en');
  const words = (zh, en) => english() ? en : zh;
  const escape = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const formatSize = (size) => size < 1024 * 1024 ? Math.max(1, Math.round(size / 1024)) + ' KB' : (size / (1024 * 1024)).toFixed(1) + ' MB';
  const typeLabel = (kind) => ({ workbook: words('Excel 工作簿', 'Excel workbook'), table: words('CSV 表格', 'CSV table'), json: 'JSON', text: words('文本', 'Text') }[kind] || kind);
  const active = () => workspace.querySelector('.dev-file-compare');

  function currentSpreadsheetPair() {
    const leftKind = state.left.kind;
    const rightKind = state.right.kind;
    return ['workbook', 'table'].includes(leftKind) && ['workbook', 'table'].includes(rightKind);
  }

  function commonSheets() {
    if (!currentSpreadsheetPair() || !state.left.data || !state.right.data) return [];
    if (state.left.kind === 'table' && state.right.kind === 'workbook') return state.right.data.sheets.map((sheet) => sheet.name);
    if (state.right.kind === 'table' && state.left.kind === 'workbook') return state.left.data.sheets.map((sheet) => sheet.name);
    const rightNames = new Set(state.right.data.sheets.map((sheet) => sheet.name));
    return state.left.data.sheets.map((sheet) => sheet.name).filter((name) => rightNames.has(name));
  }

  function sheetData(side, name) {
    if (state[side].kind === 'table') return state[side].data?.sheets[0];
    return state[side].data?.sheets.find((sheet) => sheet.name === name);
  }

  function workbookForComparison(side) {
    const data = state[side].data;
    if (state.left.kind === 'table' || state.right.kind === 'table') {
      const sheet = sheetData(side, state.sheetName);
      return { sheets: sheet ? [{ ...sheet, name: state.sheetName || 'Sheet1' }] : [] };
    }
    return data;
  }

  function ensureSelectedSheet() {
    const sheets = commonSheets();
    if (!sheets.includes(state.sheetName)) state.sheetName = sheets[0] || '';
    const leftSheet = sheetData('left', state.sheetName);
    const rightSheet = sheetData('right', state.sheetName);
    const headers = (leftSheet?.rows?.[0] || []).map((value) => String(value == null ? '' : value).trim());
    const rightHeaders = new Set((rightSheet?.rows?.[0] || []).map((value) => String(value == null ? '' : value).trim()));
    const keyChoices = headers.filter((value, index) => value && headers.indexOf(value) === index && rightHeaders.has(value));
    if (!keyChoices.includes(state.keyColumn)) state.keyColumn = keyChoices[0] || '';
    return { sheets, keyChoices };
  }

  function fileCard(side) {
    const item = state[side];
    const sideLabel = side === 'left' ? words('文件 A', 'File A') : words('文件 B', 'File B');
    if (!item.file) {
      return '<label class="dev-file-compare-dropzone" data-fc-drop="' + side + '">' +
        '<input class="dev-file-compare-input" type="file" data-fc-input="' + side + '" accept=".xlsx,.xls,.csv,.tsv,.json,.txt,.log,.md,application/json,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel">' +
        '<span class="dev-file-compare-upload-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5"/></svg></span>' +
        '<strong>' + sideLabel + '</strong><span>' + words('点击选择或拖放文件到这里', 'Choose a file or drop it here') + '</span>' +
        '<small>' + words('XLSX、XLS、CSV、JSON、TXT', 'XLSX, XLS, CSV, JSON, TXT') + '</small></label>';
    }
    return '<div class="dev-file-compare-file-card' + (item.loading ? ' is-loading' : '') + '">' +
      '<div class="dev-file-compare-file-icon" aria-hidden="true">' + escape(item.file.name.split('.').pop().slice(0, 4).toUpperCase()) + '</div>' +
      '<div class="dev-file-compare-file-meta"><strong title="' + escape(item.file.name) + '">' + escape(item.file.name) + '</strong><span>' + typeLabel(item.kind) + ' · ' + formatSize(item.file.size) + '</span></div>' +
      (item.loading ? '<span class="dev-file-compare-spinner" role="status" aria-label="' + words('正在解析', 'Parsing') + '"></span>' : '<button type="button" class="dev-file-compare-remove" data-fc-action="remove-' + side + '" aria-label="' + words('移除文件', 'Remove file') + '">×</button>') +
      (item.error ? '<p class="dev-file-compare-file-error">' + escape(item.error) + '</p>' : '') + '</div>';
  }

  function renderSettings() {
    if (!currentSpreadsheetPair()) {
      if (state.left.kind === 'json' && state.right.kind === 'json') return '<div class="dev-file-compare-mode-note">' + words('按字段路径比较 JSON，忽略对象字段顺序；数组顺序敏感。', 'JSON is compared by field path. Object key order is ignored; array order matters.') + '</div>';
      if (state.left.kind === 'text' && state.right.kind === 'text') return '<div class="dev-file-compare-mode-note">' + words('按行对齐比较文本，换行风格不会单独标记为差异。', 'Text is aligned line by line; line-ending style alone is ignored.') + '</div>';
      return '<div class="dev-file-compare-mode-note">' + words('两侧请选择相同类型的文件；Excel 和 CSV 可以互相比对。', 'Choose matching file types. Excel and CSV can be compared together.') + '</div>';
    }
    const { sheets, keyChoices } = ensureSelectedSheet();
    const cellOption = '<option value="cells"' + (state.mode === 'cells' ? ' selected' : '') + '>' + words('按单元格位置', 'By cell position') + '</option>';
    const rowOption = '<option value="rows"' + (state.mode === 'rows' ? ' selected' : '') + '>' + words('按关键列匹配行', 'Match rows by key') + '</option>';
    const sheetSelect = '<label class="dev-file-compare-control"><span>' + words('工作表', 'Worksheet') + '</span><select data-fc-setting="sheet" ' + (sheets.length ? '' : 'disabled') + '>' +
      (sheets.length ? sheets.map((name) => '<option value="' + escape(name) + '"' + (state.sheetName === name ? ' selected' : '') + '>' + escape(name) + '</option>').join('') : '<option>' + words('没有同名工作表', 'No matching worksheet') + '</option>') + '</select></label>';
    const keySelect = state.mode === 'rows' ? '<label class="dev-file-compare-control"><span>' + words('匹配列', 'Key column') + '</span><select data-fc-setting="key" ' + (keyChoices.length ? '' : 'disabled') + '>' +
      (keyChoices.length ? keyChoices.map((name) => '<option value="' + escape(name) + '"' + (state.keyColumn === name ? ' selected' : '') + '>' + escape(name) + '</option>').join('') : '<option>' + words('找不到双方共有的表头', 'No shared header found') + '</option>') + '</select></label>' : '';
    return '<div class="dev-file-compare-settings"><label class="dev-file-compare-control"><span>' + words('比较方式', 'Compare by') + '</span><select data-fc-setting="mode">' + cellOption + rowOption + '</select></label>' + sheetSelect + keySelect + '</div>';
  }

  function kindLabel(kind) {
    return ({ added: words('新增', 'Added'), removed: words('删除', 'Removed'), changed: words('修改', 'Changed'), 'sheet-added': words('新增工作表', 'Sheet added'), 'sheet-removed': words('删除工作表', 'Sheet removed') })[kind] || kind;
  }

  function visibleChanges(result) {
    const changes = result?.changes || result?.rows || [];
    if (state.filter === 'all') return changes;
    return changes.filter((item) => item.kind === state.filter || state.filter === 'added' && item.kind === 'sheet-added' || state.filter === 'removed' && item.kind === 'sheet-removed');
  }

  function renderResultRows(rows, mode) {
    if (!rows.length) return '<div class="dev-file-compare-empty-result">' + words('没有符合筛选条件的差异', 'No differences match this filter') + '</div>';
    const shown = rows.slice(0, 500);
    const header = mode === 'text'
      ? [words('行', 'Line'), words('文件 A', 'File A'), words('行', 'Line'), words('文件 B', 'File B'), words('类型', 'Type')]
      : mode === 'json'
        ? [words('字段路径', 'Path'), words('文件 A', 'File A'), words('文件 B', 'File B'), words('类型', 'Type')]
        : [words('位置', 'Location'), words('文件 A', 'File A'), words('文件 B', 'File B'), words('类型', 'Type')];
    const body = shown.map((item) => {
      const cls = 'is-' + (item.kind.startsWith('sheet-') ? item.kind.slice(6) : item.kind);
      const type = '<span class="dev-file-compare-badge ' + cls + '">' + escape(kindLabel(item.kind)) + '</span>';
      if (mode === 'text') return '<tr class="' + cls + '"><td class="dev-file-compare-position">' + escape(item.leftLine || '') + '</td><td><pre>' + escape(item.before) + '</pre></td><td class="dev-file-compare-position">' + escape(item.rightLine || '') + '</td><td><pre>' + escape(item.after) + '</pre></td><td>' + type + '</td></tr>';
      if (mode === 'json') return '<tr class="' + cls + '"><td class="dev-file-compare-path"><code>' + escape(item.path) + '</code></td><td><pre>' + escape(item.before) + '</pre></td><td><pre>' + escape(item.after) + '</pre></td><td>' + type + '</td></tr>';
      const location = item.sheet ? item.sheet + (item.address ? ' · ' + item.address : '') : item.key ? item.key + (item.field ? ' · ' + item.field : '') : item.address;
      return '<tr class="' + cls + '"><td class="dev-file-compare-path">' + escape(location) + '</td><td><pre>' + escape(item.before) + '</pre></td><td><pre>' + escape(item.after) + '</pre></td><td>' + type + '</td></tr>';
    }).join('');
    return '<div class="dev-file-compare-table-wrap"><table class="dev-file-compare-table"><thead><tr>' + header.map((title) => '<th>' + escape(title) + '</th>').join('') + '</tr></thead><tbody>' + body + '</tbody></table></div>' +
      (rows.length > shown.length ? '<p class="dev-file-compare-truncated">' + words('仅显示前 500 条差异；可缩小文件或使用关键列匹配。', 'Showing the first 500 differences. Narrow the files or match rows by key.') + '</p>' : '');
  }

  function renderResult() {
    if (!state.result) return '';
    const result = state.result;
    if (result.error) {
      const messages = {
        'invalid-left-json': words('文件 A 的 JSON 格式无效。', 'File A contains invalid JSON.'),
        'invalid-right-json': words('文件 B 的 JSON 格式无效。', 'File B contains invalid JSON.'),
        'key-not-found': words('请选择双方都存在的匹配列。', 'Choose a key column present in both files.'),
        'sheet-not-found': words('所选工作表在两侧都必须存在。', 'The selected worksheet must exist in both files.'),
      };
      return '<section class="dev-file-compare-result"><div class="dev-file-compare-error" role="alert">' + escape(messages[result.error] || words('无法比较这两个文件。', 'These files could not be compared.')) + (result.detail ? '<small>' + escape(result.detail) + '</small>' : '') + '</div></section>';
    }
    if (result.duplicates?.left?.length || result.duplicates?.right?.length || result.missingKeys?.left || result.missingKeys?.right) {
      const duplicates = [...new Set([...(result.duplicates?.left || []), ...(result.duplicates?.right || [])])];
      const notices = [];
      if (duplicates.length) notices.push(words('重复关键值未参与匹配：', 'Duplicate keys were skipped: ') + duplicates.join(', '));
      if (result.missingKeys?.left || result.missingKeys?.right) notices.push(words('空关键值行未参与匹配。', 'Rows with empty keys were skipped.'));
      result.notice = notices.join(' ');
    }
    const changes = result.changes || result.rows || [];
    const counts = changes.reduce((acc, item) => {
      const kind = item.kind === 'sheet-added' ? 'added' : item.kind === 'sheet-removed' ? 'removed' : item.kind;
      acc[kind] = (acc[kind] || 0) + 1;
      return acc;
    }, {});
    const total = changes.length;
    const summary = total ? words('发现 ' + total + ' 处差异', total + ' differences found') : words('两个文件内容相同', 'The files are identical');
    const mode = state.left.kind === 'json' ? 'json' : state.left.kind === 'text' ? 'text' : 'spreadsheet';
    const filter = '<label class="dev-file-compare-filter"><span>' + words('筛选', 'Filter') + '</span><select data-fc-setting="filter">' +
      [['all', words('全部差异', 'All differences')], ['changed', words('修改', 'Changed')], ['added', words('新增', 'Added')], ['removed', words('删除', 'Removed')]].map(([value, label]) => '<option value="' + value + '"' + (state.filter === value ? ' selected' : '') + '>' + label + (value === 'all' ? ' (' + total + ')' : ' (' + (counts[value] || 0) + ')') + '</option>').join('') + '</select></label>';
    const notice = result.notice ? '<p class="dev-file-compare-notice">' + escape(result.notice) + '</p>' : '';
    return '<section class="dev-file-compare-result"><div class="dev-file-compare-result-head"><div><strong>' + escape(summary) + '</strong><span>' + words('本次比较在浏览器内完成', 'Compared locally in this browser') + '</span></div>' + filter + '</div>' + notice +
      (total ? renderResultRows(visibleChanges(result), mode) : '<div class="dev-file-compare-identical"><span aria-hidden="true">✓</span><strong>' + words('没有发现差异', 'No differences found') + '</strong></div>') + '</section>';
  }

  function render() {
    const itemsReady = state.left.data && state.right.data;
    const canCompare = Boolean(itemsReady) && !state.left.loading && !state.right.loading && !state.status;
    const hasFiles = state.left.file || state.right.file;
    const loading = state.left.loading || state.right.loading;
    const actions = '<button type="button" class="secondary dev-file-compare-swap" data-fc-action="swap" ' + (state.left.file && state.right.file ? '' : 'disabled') + '>' + words('交换', 'Swap') + '</button>' +
      '<button type="button" class="secondary" data-fc-action="clear" ' + (hasFiles ? '' : 'disabled') + '>' + words('清空', 'Clear') + '</button>';
    const error = state.status ? '<p class="dev-file-compare-status is-error" role="alert">' + escape(state.status) + '</p>' : '';
    const busy = loading ? '<p class="dev-file-compare-status is-loading" role="status">' + escape(state.progress || words('正在读取文件…', 'Reading file…')) + '<button type="button" data-fc-action="cancel">' + words('取消', 'Cancel') + '</button></p>' : '';
    return '<div class="dev-file-compare">' +
      '<header class="dev-file-compare-heading"><div><h2>' + words('文件对比', 'File comparison') + '</h2><p>' + words('选择两个文件，查看内容差异', 'Choose two files to inspect their differences') + '</p></div><div class="dev-file-compare-actions">' + actions + '</div></header>' +
      '<div class="dev-file-compare-privacy"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="10" width="15" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span>' + words('文件只在此浏览器内读取和比较，不会上传或保存。支持单文件最大 20 MB。', 'Files are read and compared in this browser; they are not uploaded or saved. Up to 20 MB per file.') + '</span></div>' +
      '<div class="dev-file-compare-pair">' + fileCard('left') + '<div class="dev-file-compare-vs" aria-hidden="true">↔</div>' + fileCard('right') + '</div>' +
      (state.left.error || state.right.error ? '<p class="dev-file-compare-status is-error" role="alert">' + escape(state.left.error || state.right.error) + '</p>' : '') + error + busy +
      (itemsReady && currentSpreadsheetPair() ? renderSettings() : itemsReady ? renderSettings() : '') +
      '<div class="dev-file-compare-run"><button type="button" class="primary" data-fc-action="compare" ' + (canCompare ? '' : 'disabled') + '>' + words('开始对比', 'Compare files') + '</button></div>' +
      renderResult() + '</div>';
  }

  function renderIntoPage() {
    const root = active();
    if (root) root.outerHTML = render();
  }

  function stopWorker() {
    if (!state.worker) return;
    const worker = state.worker;
    state.worker = null;
    worker.onmessage = null;
    worker.terminate();
    if (state.workerReject) {
      const reject = state.workerReject;
      state.workerReject = null;
      reject(new Error(words('已取消读取。', 'Reading cancelled.')));
    }
  }

  function cancelPendingReads() {
    stopWorker();
    state.progress = '';
    for (const side of ['left', 'right']) {
      if (state[side].loading) state[side] = { file: null, kind: '', data: null, loading: false, error: '' };
    }
  }

  function parseWorkbook(file, requestId) {
    return file.arrayBuffer().then((buffer) => {
      if (requestId !== state.requestId) throw new Error(words('已取消读取。', 'Reading cancelled.'));
      return new Promise((resolve, reject) => {
      const worker = new Worker(new URL(WORKER_SRC, document.baseURI));
      state.worker = worker;
      state.workerReject = reject;
      worker.onmessage = (event) => {
        if (event.data?.id !== requestId) return;
        if (event.data.stage === 'parsing') {
          state.progress = words('正在解析工作表…', 'Parsing worksheets…');
          renderIntoPage();
          return;
        }
        if (state.worker === worker) {
          state.worker = null;
          state.workerReject = null;
        }
        worker.terminate();
        if (event.data.ok) resolve(event.data.workbook);
        else reject(new Error(event.data.error || words('Excel 文件无法读取。', 'Could not read the Excel file.')));
      };
      worker.onerror = (event) => {
        if (state.worker === worker) {
          state.worker = null;
          state.workerReject = null;
        }
        worker.terminate();
        reject(new Error(event.message || words('Excel 文件无法读取。', 'Could not read the Excel file.')));
      };
      worker.postMessage({ id: requestId, buffer }, [buffer]);
      });
    });
  }

  async function readSelectedFile(side, file) {
    cancelPendingReads();
    const requestId = ++state.requestId;
    const kind = core.fileKind(file.name);
    if (!kind) {
      state.status = words('暂不支持此格式，请选择 Excel、CSV、JSON 或文本文件。', 'Unsupported format. Choose Excel, CSV, JSON, or a text file.');
      return renderIntoPage();
    }
    if (file.size > MAX_FILE_BYTES) {
      state.status = words('单个文件不能超过 20 MB。', 'Each file must be 20 MB or smaller.');
      return renderIntoPage();
    }
    const item = state[side];
    item.file = file;
    item.kind = kind;
    item.data = null;
    item.error = '';
    item.loading = true;
    state.result = null;
    state.status = '';
    state.progress = '';
    renderIntoPage();
    try {
      if (kind === 'workbook') {
        item.data = await parseWorkbook(file, requestId);
      } else {
        const content = await file.text();
        item.data = kind === 'table' ? { sheets: [{ name: 'Sheet1', rows: core.parseCsv(content, file.name.toLowerCase().endsWith('.tsv') ? '\t' : undefined) }] } : { content };
      }
      if (state.requestId !== requestId || state[side] !== item) return;
      if (item.kind === 'workbook' || item.kind === 'table') ensureSelectedSheet();
    } catch (error) {
      if (state.requestId !== requestId || state[side] !== item) return;
      item.file = null;
      item.kind = '';
      item.data = null;
        item.error = error?.message === 'excel-parse-error'
          ? words('Excel 文件无法解析，可能已损坏或受密码保护。', 'The Excel file could not be parsed. It may be damaged or password-protected.')
          : error?.message || words('文件读取失败。', 'Could not read the file.');
    } finally {
      if (state.requestId !== requestId || state[side] !== item) return;
      item.loading = false;
      state.progress = '';
      state.result = null;
      renderIntoPage();
    }
  }

  function compatibleFiles() {
    if (!state.left.data || !state.right.data) return false;
    const leftKind = state.left.kind;
    const rightKind = state.right.kind;
    return leftKind === rightKind || ['workbook', 'table'].includes(leftKind) && ['workbook', 'table'].includes(rightKind);
  }

  function runCompare() {
    state.result = null;
    state.status = '';
    if (!state.left.data || !state.right.data) {
      state.status = words('请先选择两个文件。', 'Choose both files first.');
      renderIntoPage();
      return;
    }
    if (!compatibleFiles()) {
      state.status = words('文件类型不匹配；请使用相同类型，或将 CSV 与 Excel 互相比对。', 'File types do not match. Choose matching types, or compare CSV with Excel.');
      renderIntoPage();
      return;
    }
    const kind = state.left.kind;
    if (kind === 'json') state.result = core.compareJson(state.left.data.content, state.right.data.content);
    else if (kind === 'text') state.result = core.compareText(state.left.data.content, state.right.data.content);
    else {
      ensureSelectedSheet();
      const left = workbookForComparison('left');
      const right = workbookForComparison('right');
      state.result = core.compareWorkbooks(left, right, { mode: state.mode, sheetName: state.sheetName, keyColumn: state.keyColumn });
    }
    if (state.result?.truncatedAlignment) state.result.notice = words('文件较大，使用了近似行对齐；差异内容仍完整保留。', 'Large text input used approximate line alignment; changed content is still included.');
    state.filter = 'all';
    renderIntoPage();
  }

  function clearSide(side) {
    cancelPendingReads();
    state[side] = { file: null, kind: '', data: null, loading: false, error: '' };
    state.result = null;
    state.status = '';
    renderIntoPage();
  }

  function handleAction(action) {
    if (action === 'compare') return runCompare();
    if (action === 'clear') {
      cancelPendingReads();
      state.requestId += 1;
      state.left = { file: null, kind: '', data: null, loading: false, error: '' };
      state.right = { file: null, kind: '', data: null, loading: false, error: '' };
      state.result = null;
      state.status = '';
      state.progress = '';
      state.sheetName = '';
      state.keyColumn = '';
      return renderIntoPage();
    }
    if (action === 'remove-left' || action === 'remove-right') return clearSide(action.slice(7));
    if (action === 'swap') {
      [state.left, state.right] = [state.right, state.left];
      state.result = null;
      state.status = '';
      return renderIntoPage();
    }
    if (action === 'cancel') {
      cancelPendingReads();
      state.requestId += 1;
      for (const side of ['left', 'right']) if (state[side].loading) state[side] = { file: null, kind: '', data: null, loading: false, error: '' };
      state.status = words('已取消读取。', 'Reading cancelled.');
      state.progress = '';
      state.result = null;
      return renderIntoPage();
    }
  }

  function onClick(event) {
    const button = event.target.closest('[data-fc-action]');
    if (!button || !active()?.contains(button)) return;
    event.preventDefault();
    handleAction(button.dataset.fcAction);
  }

  function onChange(event) {
    const input = event.target.closest('[data-fc-input]');
    if (input) {
      const side = input.dataset.fcInput;
      const file = input.files?.[0];
      input.value = '';
      if (file) void readSelectedFile(side, file);
      return;
    }
    const setting = event.target.closest('[data-fc-setting]');
    if (!setting || !active()?.contains(setting)) return;
    if (setting.dataset.fcSetting === 'mode') state.mode = setting.value;
    else if (setting.dataset.fcSetting === 'sheet') { state.sheetName = setting.value; state.keyColumn = ''; ensureSelectedSheet(); }
    else if (setting.dataset.fcSetting === 'key') state.keyColumn = setting.value;
    else if (setting.dataset.fcSetting === 'filter') state.filter = setting.value;
    if (setting.dataset.fcSetting !== 'filter') state.result = null;
    renderIntoPage();
  }

  function onDragOver(event) {
    const target = event.target.closest('[data-fc-drop]');
    if (!target || !active()?.contains(target)) return;
    event.preventDefault();
    target.classList.add('is-dragging');
  }

  function onDragLeave(event) {
    const target = event.target.closest('[data-fc-drop]');
    if (target && !target.contains(event.relatedTarget)) target.classList.remove('is-dragging');
  }

  function onDrop(event) {
    const target = event.target.closest('[data-fc-drop]');
    if (!target || !active()?.contains(target)) return;
    event.preventDefault();
    target.classList.remove('is-dragging');
    const file = event.dataTransfer?.files?.[0];
    if (file) void readSelectedFile(target.dataset.fcDrop, file);
  }

  workspace.addEventListener('click', onClick);
  workspace.addEventListener('change', onChange);
  workspace.addEventListener('dragover', onDragOver);
  workspace.addEventListener('dragleave', onDragLeave);
  workspace.addEventListener('drop', onDrop);

  window.OneBoxFileCompareUI = { render };
})();
