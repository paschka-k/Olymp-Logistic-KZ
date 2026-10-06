// Runs tests.html in headless Chromium and exits 1 if any test fails (FR-18).
// Usage: node tools/run-ui-tests.cjs http://localhost:8080/tests.html
const { chromium } = require('playwright');
(async () => {
  const url = process.argv[2] || 'http://localhost:8080/tests.html';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  page.on('pageerror', e => console.log('PAGE ERROR', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__TESTS && window.__TESTS.done, null, { timeout: 240000 });
  const r = await page.evaluate(() => window.__TESTS);
  console.log(`UI tests: ${r.passed}/${r.total} passed, ${r.failed} failed`);
  r.failures.forEach(f => console.log('FAIL ' + f));
  await browser.close();
  process.exit(r.failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
