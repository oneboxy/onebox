const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const layoutSource = read('dist/ticket-wallet-layout.js');
const getLayout = () => {
  const context = { window: {} };
  vm.runInNewContext(layoutSource, context, { filename: 'ticket-wallet-layout.js' });
  return context.window.OneBoxTicketWalletLayout;
};

test('tile layout stays paused and safely defaults to stacked mode', () => {
  const layout = getLayout();
  assert.equal(layout.normalize(null), 'stack');
  assert.equal(layout.normalize('unknown'), 'stack');
  assert.equal(layout.normalize('tile'), 'stack');
  assert.equal(layout.next('stack'), 'stack');
  assert.equal(layout.next('tile'), 'stack');

  const saved = [];
  const storage = { setItem: (key, value) => saved.push([key, value]) };
  const state = { ticketWalletCardLayout: 'stack' };
  assert.equal(layout.toggle(state, storage, 'wallet.layout'), 'stack');
  assert.equal(state.ticketWalletCardLayout, 'stack');
  assert.deepEqual(saved.pop(), ['wallet.layout', 'stack']);
  assert.equal(layout.toggle(state, storage, 'wallet.layout'), 'stack');
  assert.deepEqual(saved.pop(), ['wallet.layout', 'stack']);
});

test('tile layout switch stays hidden while the tiled view is paused', () => {
  const layout = getLayout();
  const stackMarkup = layout.toggleButtonMarkup('stack', 'zh-CN');
  assert.equal(stackMarkup, '');

  const tileMarkup = layout.toggleButtonMarkup('tile', 'en');
  assert.equal(tileMarkup, '');
});

test('reordering uses actual card centers for variable-height tiled cards', () => {
  const layout = getLayout();
  const centers = [100, 500, 700, 900];
  assert.deepEqual(Array.from(layout.reorderOffsets(0, 2, centers, 430)), [430, -400, -200, 0]);
  assert.deepEqual(Array.from(layout.reorderOffsets(0, 2, centers, 430, true)), [600, -400, -200, 0]);
  assert.deepEqual(Array.from(layout.reorderOffsets(3, 1, centers, -430)), [0, 200, 200, -430]);
  assert.deepEqual(Array.from(layout.reorderOffsets(3, 1, centers, -430, true)), [0, 200, 200, -400]);
  assert.deepEqual(Array.from(layout.reorderOffsets(1, 1, centers, 0)), [0, 0, 0, 0]);
  assert.deepEqual(Array.from(layout.reorderOffsets(-1, 1, centers, 0)), []);
});

test('ticket wallet app, document, styles and offline shell wire up the layout mode', () => {
  const app = read('dist/app.js');
  const css = read('dist/style.css');
  const html = read('dist/index.html');
  const serviceWorker = read('dist/sw.js');

  assert.doesNotThrow(() => new vm.Script(app, { filename: 'app.js' }));
  assert.match(app, /ticketWalletCardLayout:\s*'onebox\.ticket-wallet-card-layout'/);
  assert.match(app, /TicketWalletLayout\.normalize\(localStorage\.getItem\(STORAGE\.ticketWalletCardLayout\)\)/);
  assert.match(app, /TicketWalletLayout\.pageAttribute\(ticketWalletCardLayout\)/);
  assert.match(app, /TicketWalletLayout\.toggle\(state, localStorage, STORAGE\.ticketWalletCardLayout\)/);
  assert.match(app, /TicketWalletLayout\.reorderOffsets\(drag\.startIndex, drag\.currentIndex, drag\.centers, drag\.deltaY, settling\)/);
  assert.match(app, /ticketWalletTopAdd \+ ticketWalletViewSwitcher \+ ticketWalletLayoutToggle/);

  const helperTag = html.indexOf('ticket-wallet-layout.js');
  const appTag = html.indexOf('app.js?v=');
  assert.ok(helperTag !== -1 && appTag !== -1 && helperTag < appTag, 'layout helper must load before app.js');

  assert.match(css, /ticket-wallet-page\[data-ticket-wallet-layout="tile"\].*?ticket-wallet-stack/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css, /--ticket-reorder-offset/);
  assert.match(css, /ticket-wallet-reorder-dragging,[\s\S]*?z-index:1000!important/);
  assert.match(serviceWorker, /ticket-wallet-layout\.js\?v=/);
});

test('layout helper script passes JavaScript syntax checking', () => {
  assert.doesNotThrow(() => new vm.Script(layoutSource, { filename: 'ticket-wallet-layout.js' }));
});

