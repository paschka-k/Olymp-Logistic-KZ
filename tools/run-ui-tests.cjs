// Runs tests.html in headless Chromium and exits 1 if any test fails (FR-18).
// Usage: node tools/run-ui-tests.cjs <url> [--out <dir>]
//   node tools/run-ui-tests.cjs http://localhost:8080/tests.html
//   node tools/run-ui-tests.cjs "http://localhost:8080/platform/tests.html?shard=2/4&keepfail=1" --out ui-results/v6-2
// With --out it writes report.json (totals, failures, flaky and quarantined groups, suite times) and, when tests fail,
// screenshots of the result list and of every failed group's iframe (FR-209; the v6 harness keeps them with ?keepfail=1).
// The flaky report (FR-210) and the failures also go to the GitHub job summary when GITHUB_STEP_SUMMARY is set.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const url = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://localhost:8080/tests.html';
  const out = arg('out', ''), t0 = Date.now();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const pageErrors = [];
  page.on('pageerror', e => { pageErrors.push(e.message); console.log('PAGE ERROR', e.message); });
  await page.goto(url);
  await page.waitForFunction(() => window.__TESTS && window.__TESTS.done, null, { timeout: 600000, polling: 500 });
  const r = await page.evaluate(() => window.__TESTS);
  const flaky = r.flaky || [], quar = r.quarantined || [], ms = Date.now() - t0;
  console.log(`UI tests${r.shard ? ` (shard ${r.shard.k}/${r.shard.n}, ${r.shard.files.length} files)` : ''}: ${r.passed}/${r.total} passed, ${r.failed} failed, ${flaky.length} flaky, ${quar.length} quarantined · ${(ms / 1000).toFixed(1)} s`);
  r.failures.forEach(f => console.log('FAIL ' + f));
  flaky.forEach(f => console.log(`FLAKY ${f.name} — passed on attempt ${f.attempts}; before: ${f.errors.join(' | ')}`));
  quar.forEach(q => console.log(`QUARANTINED ${q.name} — ${q.error}`));
  if (out) {
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ url, ms, total: r.total, passed: r.passed, failed: r.failed, failures: r.failures, flaky, quarantined: quar, shard: r.shard || null, suites: r.suites || {}, pageErrors }, null, 2));
    if (r.failed) {
      await page.screenshot({ path: path.join(out, 'results.png'), fullPage: true });
      const figs = await page.$$('#frames iframe.kept');
      for (let i = 0; i < figs.length; i++) { await figs[i].scrollIntoViewIfNeeded(); await figs[i].screenshot({ path: path.join(out, `fail-${String(i + 1).padStart(2, '0')}.png`) }); }
      console.log(`screenshots: results.png + ${figs.length} failed group(s) in ${out}`);
    }
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    const md = [`### ${r.failed ? '❌' : '✅'} ${url.replace(/^https?:\/\/[^/]+/, '')} — ${r.passed}/${r.total} passed, ${r.failed} failed, ${flaky.length} flaky, ${quar.length} quarantined (${(ms / 1000).toFixed(0)} s)`, ''];
    if (r.failures.length) md.push('**Failures**', '', ...r.failures.map(f => '- ' + f.replace(/\|/g, '\\|')), '');
    if (flaky.length) md.push('**Flaky (passed on retry)**', '', '| group | attempts | first error |', '|---|---:|---|', ...flaky.map(f => `| ${f.name.replace(/\|/g, '\\|')} | ${f.attempts} | ${f.errors[0].replace(/\|/g, '\\|')} |`), '');
    if (quar.length) md.push('**Quarantined (failure ignored, see platform-src/tests/quarantine.json)**', '', ...quar.map(q => `- ${q.name} — ${q.error}`), '');
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n') + '\n');
  }
  await browser.close();
  process.exit(r.failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
