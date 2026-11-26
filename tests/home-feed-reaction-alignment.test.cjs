const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (name) => fs.readFileSync(path.join(__dirname, '..', 'dist', name), 'utf8');

test('home feed reactions align to the full card width with or without an image', () => {
  const styles = read('style.css');
  const app = read('app.js');
  const finalFeedRules = styles.indexOf('2.18.38 final overrides');
  const metaRuleStart = styles.indexOf('#workspace[data-tool="home"] .feed-item-meta {', finalFeedRules);
  const metaRuleEnd = styles.indexOf('}', metaRuleStart);
  const metaRule = styles.slice(metaRuleStart, metaRuleEnd + 1);
  const reactionRule = styles.match(/\.feed-item-reactions\s*\{([^}]*)\}/);
  const renderStart = app.indexOf('function renderFeedItem(item');
  const renderEnd = app.indexOf('\nfunction isMobileSurface()', renderStart);
  const renderMarkup = app.slice(renderStart, renderEnd);

  assert.ok(finalFeedRules >= 0 && metaRuleStart >= 0);
  assert.match(metaRule, /grid-column:\s*1\s*\/\s*-1\s*;/);
  assert.ok(reactionRule);
  assert.match(reactionRule[1], /margin-left:\s*auto/);
  assert.match(renderMarkup, /const meta = '<div class="feed-item-meta"/);
  assert.match(renderMarkup, /\+ \(image \? '<div class="feed-item-side"/);
  assert.match(renderMarkup, /\+ meta \+ '<\/article>'/);

  const mobileRulesStart = styles.indexOf('@media (max-width: 600px)', metaRuleEnd);
  const mobileRulesEnd = styles.indexOf('\n}', mobileRulesStart);
  const mobileRules = styles.slice(mobileRulesStart, mobileRulesEnd + 2);
  assert.ok(mobileRulesStart >= 0 && mobileRulesEnd > mobileRulesStart);
  assert.match(mobileRules, /#workspace\[data-tool="home"\] \.feed-item \{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+84px/s);
  assert.doesNotMatch(mobileRules, /#workspace\[data-tool="home"\] \.feed-item-meta\s*\{[^}]*grid-column:/s);
});
