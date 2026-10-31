(() => {
  'use strict';
  const PAGE = '.ticket-wallet-page';
  const STACK = '.ticket-wallet-stack';
  const TILED_CLASS = 'ticket-wallet-stack-tiled';
  function syncTicketWalletGrid() {
    const page = document.querySelector(PAGE);
    const tiled = page?.getAttribute('data-ticket-wallet-layout') === 'tile';
    document.querySelectorAll(STACK).forEach((stack) => {
      stack.classList.toggle(TILED_CLASS, Boolean(tiled && page.contains(stack)));
    });
  }
  const root = document.getElementById('workspace') || document.body;
  new MutationObserver(syncTicketWalletGrid).observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-ticket-wallet-layout'],
  });
  syncTicketWalletGrid();
})();
