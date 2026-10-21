/* Local-only Excel parser. The workbook buffer is received through postMessage and is never sent over the network. */
importScripts('vendor/xlsx.full.min.js?v=2.18.692');

self.addEventListener('message', (event) => {
  const { id, buffer } = event.data || {};
  try {
    self.postMessage({ id, stage: 'parsing' });
    const workbook = self.XLSX.read(buffer, { type: 'array', cellDates: true, cellFormula: false });
    const sheets = workbook.SheetNames.map((name) => ({
      name,
      rows: self.XLSX.utils.sheet_to_json(workbook.Sheets[name], {
        header: 1,
        raw: true,
        defval: '',
        blankrows: true,
      }),
    }));
    self.postMessage({ id, ok: true, workbook: { sheets } });
  } catch (error) {
    self.postMessage({ id, ok: false, error: 'excel-parse-error' });
  }
});
