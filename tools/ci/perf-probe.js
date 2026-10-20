/* FR-198 · in-page probe for the performance budget. Evaluated by tools/ci/perf-budget.cjs in a top-level platform page
   (not an iframe); also usable by hand in the browser console: paste it, then  await perfProbe(['dashboard', 'orders']).
   Returns { startMs, tickMs, renderMs: { screen: ms } } — medians, so one slow frame does not fail the budget. */
async function perfProbe(screens, reps) {
  reps = reps || 7;
  const med = a => { const s = a.slice().sort((x, y) => x - y); return Math.round(s[s.length >> 1] * 10) / 10; };
  const mark = performance.getEntriesByName('v6-ready')[0];
  const startMs = mark ? Math.round(mark.startTime) : null;
  S.simOn = false;                       // stop the 2 s telemetry interval: the probe ticks by hand
  const renderMs = {};
  for (const id of screens) {
    go(id); const t = [];
    for (let i = 0; i < reps; i++) { const a = performance.now(); render(); t.push(performance.now() - a); }
    renderMs[id] = med(t);
  }
  go('dashboard'); const tk = [];         // the dashboard is a LIVE route: each tick re-renders it
  for (let i = 0; i < reps * 3; i++) { const a = performance.now(); liveTick(); tk.push(performance.now() - a); }
  return { startMs, tickMs: med(tk), renderMs };
}
if (typeof module !== 'undefined') module.exports = { perfProbe };
