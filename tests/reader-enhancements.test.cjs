const test=require('node:test');const assert=require('node:assert/strict');const core=require('../dist/reader-enhancements-core.js');
test('normalizes malformed and bounded reader statistics',()=>{const value=core.normalizeStats({days:{'2026-11-01':90000,bad:20,'2026-11-02':-4},books:{book:12,empty:0}});assert.deepEqual(value.days,{'2026-11-01':86400});assert.deepEqual(value.books,{book:12});});
test('adds reading seconds to day and book totals',()=>{const value=core.addSeconds({days:{},books:{}},'2026-11-01','b1',30);assert.equal(value.days['2026-11-01'],30);assert.equal(value.books.b1,30);assert.equal(core.addSeconds(value,'bad','b1',30).books.b1,30);});
test('builds stable local date keys and validates HTTP sources',()=>{assert.equal(core.recentDays(new Date(2026,10,1,1),3).join(','),'2026-10-30,2026-10-31,2026-11-01');assert.equal(core.safeHttpUrl('/catalog','https://example.org/root/'),'https://example.org/catalog');assert.equal(core.safeHttpUrl('javascript:alert(1)'), '');});

const fs=require('node:fs');const path=require('node:path');const root=path.resolve(__dirname,'..');
const app=fs.readFileSync(path.join(root,'dist/app.js'),'utf8');const cloud=fs.readFileSync(path.join(root,'dist/cloud-sync.js'),'utf8');const worker=fs.readFileSync(path.join(root,'cloudflare/reader-sync/src/index.js'),'utf8');
test('reader keeps note/progress sync and adds FB2, MOBI, AZW3 imports',()=>{assert.match(app,/\['fb2', 'mobi', 'azw3'\]/);assert.match(app,/onebox:reader-session-start/);assert.match(app,/readerFoliateFormat/);assert.match(app,/book\.annotations/);});
test('reader stats and OPDS settings join the existing reading sync group',()=>{for(const key of ['onebox.reader-stats','onebox.reader-opds']){assert.ok(cloud.includes(key));assert.ok(worker.includes(key));}});

test('OPDS search templates retain placeholders and reject unsafe schemes',()=>{assert.equal(core.safeTemplateUrl('/search{?query}','https://catalog.example/opds'),'https://catalog.example/search{?query}');assert.equal(core.safeTemplateUrl('javascript:{query}'), '');});
test('reading sync selection includes stats and OPDS',()=>{const start=cloud.indexOf('reading: new Set'),end=cloud.indexOf('messages:',start);const group=cloud.slice(start,end);assert.ok(group.includes('onebox.reader-stats'));assert.ok(group.includes('onebox.reader-opds'));});
