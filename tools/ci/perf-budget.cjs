// FR-198 · performance budget. Fails (exit 1) when page weight, start time, telemetry tick or render cost of the v6 platform
// exceed the budget in platform-src/perf-budget.json.
//   node tools/ci/perf-budget.cjs [--base http://localhost:8080/platform/] [--out perf-results] [--weight-only]
// Weight is read from platform/*.html on disk (raw and gzip, as GitHub Pages serves it); the timings come from
// tools/ci/perf-probe.js in headless Chromium (median of several runs per page, best of --runs page loads).
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const root = path.resolve(__dirname, '..', '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const has = k => process.argv.includes('--' + k);
const budget = JSON.parse(fs.readFileSync(path.join(root, 'platform-src', 'perf-budget.json'), 'utf8'));
const base = arg('base', 'http://localhost:8080/platform/'), outDir = path.resolve(arg('out', 'perf-results')), runs = +arg('runs', budget.runs || 3);
const PAGES = budget.pages || { ru: 'index.html', de: 'de.html', en: 'en.html', kk: 'kk.html' };
const rows = [], fail = [];
const check = (what, val, max, unit) => { const ok = val != null && val <= max; rows.push({ what, val, max, unit, ok }); if (!ok) fail.push(`${what}: ${val} ${unit} > budget ${max} ${unit}`); };

(async () => {
  for (const [lang, f] of Object.entries(PAGES)) {
    const buf = fs.readFileSync(path.join(root, 'platform', f));
    check(`${lang} page weight (raw)`, Math.round(buf.length / 1024), budget.pageKB.raw, 'KB');
    check(`${lang} page weight (gzip)`, Math.round(zlib.gzipSync(buf, { level: 9 }).length / 1024), budget.pageKB.gzip, 'KB');
  }
  if (!has('weight-only')) {
    const { chromium } = require('playwright');
    const probe = fs.readFileSync(path.join(__dirname, 'perf-probe.js'), 'utf8');
    const browser = await chromium.launch();
    for (const lang of budget.timedLangs || ['ru', 'en']) {
      let best = null;
      for (let r = 0; r < runs; r++) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await page.goto(base + PAGES[lang], { waitUntil: 'load' });
        await page.waitForFunction(() => performance.getEntriesByName('v6-ready').length > 0, null, { timeout: 30000 });
        await page.addScriptTag({ content: probe });
        const m = await page.evaluate(([s, n]) => perfProbe(s, n), [budget.renderMs.screens, budget.reps || 7]);
        await page.close();
        if (!best) best = m; else { best.startMs = Math.min(best.startMs, m.startMs); best.tickMs = Math.min(best.tickMs, m.tickMs); for (const k in m.renderMs) best.renderMs[k] = Math.min(best.renderMs[k], m.renderMs[k]); }
      }
      check(`${lang} start (navigation → first render)`, best.startMs, budget.startMs, 'ms');
      check(`${lang} telemetry tick (dashboard re-render)`, best.tickMs, budget.tickMs, 'ms');
      for (const [id, ms] of Object.entries(best.renderMs)) check(`${lang} render ${id}`, ms, (budget.renderMs.max || {})[id] || budget.renderMs.default, 'ms');
    }
    await browser.close();
  }
  const table = ['| check | value | budget | |', '|---|---:|---:|---|', ...rows.map(r => `| ${r.what} | ${r.val} ${r.unit} | ${r.max} ${r.unit} | ${r.ok ? '✅' : '❌'} |`)].join('\n');
  console.log(table);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'perf-report.json'), JSON.stringify({ budget, rows, fail }, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `## Performance budget (FR-198)\n\n${table}\n\n${fail.length ? '**Over budget:** ' + fail.join('; ') : 'All within budget.'}\n`);
  if (fail.length) { fail.forEach(f => console.log('OVER BUDGET ' + f)); process.exit(1); }
  console.log('performance budget: ' + rows.length + ' checks within budget');
})().catch(e => { console.error(e); process.exit(1); });
