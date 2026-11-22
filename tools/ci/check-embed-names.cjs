// Banned-name check for the embedded customer view (?embed=customer), the page the Kökzhol marketing site shows in its preview iframe.
// Public Kökzhol material must never show "Olymp" or "KombiMED" (or "Олимп"). For every language bundle this opens the embed in headless Chromium,
// runs the page's own embedAudit() (platform-src/v6/screens/shell/004-embed.js: every reachable screen, tab and drawer; visible text, tooltips,
// labels, field values, the tab title) and also scans the first screen's visible text from the outside. Exits 1 on any finding.
// Usage: node tools/ci/check-embed-names.cjs [base-url]
//   node tools/ci/check-embed-names.cjs http://localhost:8080/platform/
//   node tools/ci/check-embed-names.cjs https://paschka-k.github.io/Olymp-Logistic-KZ/platform/
const { chromium } = require('playwright');
const BANNED = /olymp|kombimed|олимп/i;
const base = (process.argv[2] || 'http://localhost:8080/platform/').replace(/\/?$/, '/');
const PAGES = [
  ['en.html', 'en'],
  ['index.html', 'ru'],
  ['de.html', 'de'],
  ['kk.html', 'kk'],
];
(async () => {
  const browser = await chromium.launch();
  let bad = 0;
  for (const [file, lang] of PAGES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}${file}?embed=customer&lang=${lang}`, { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.embedAudit === 'function' && document.documentElement.dataset.embed === 'customer', null, {
      timeout: 30000,
    });
    await page.waitForTimeout(300);
    const first = await page.evaluate(() => [document.body.innerText, document.title, document.documentElement.dataset.design]);
    const found = await page.evaluate(() => window.embedAudit({ maxClicks: 40 }));
    if (BANNED.test(first[0]) || BANNED.test(first[1])) found.unshift('first screen · visible text or tab title');
    if (first[2] !== 'kokzhol') found.unshift(`design is "${first[2]}", not kokzhol`);
    console.log(`${found.length ? 'FAIL' : 'ok  '} ${file} (${lang}) · ${found.length} finding(s)${errors.length ? ` · ${errors.length} page error(s)` : ''}`);
    found.forEach(f => console.log('     ' + f));
    errors.forEach(e => console.log('     PAGE ERROR ' + e));
    bad += found.length;
    await page.close();
  }
  await browser.close();
  if (bad) {
    console.log(`\n${bad} banned-name finding(s) in the embed view`);
    process.exit(1);
  }
  console.log('\nembed view: no banned names');
})().catch(e => {
  console.error(e);
  process.exit(2);
});
