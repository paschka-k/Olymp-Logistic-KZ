  /* ---- S1 · CI and test infrastructure: deterministic clock (FR-206), shard plan (FR-205), retry / quarantine (FR-210) ---- */
  await group('deterministic clock: only CLOCK reads the wall clock, default today = 18.10.2026 14:30 Astana', 'ru', async (g, ev, w) => {
    const src = await (await fetch('index.html')).text();
    const a = src.indexOf('const CLOCK = (() => {'), b = src.indexOf('})();', a);
    assert(a > 0 && b > a, 'CLOCK block in the bundle');
    const rest = src.slice(0, a) + src.slice(b);
    const m = rest.match(/.{0,40}(new Date\(\)|Date\.now\(\)).{0,40}/);
    assert(!m, 'wall-clock read outside CLOCK: ' + (m && m[0]));
    eq(ev('NOW.toISOString()'), '2026-10-18T09:30:00.000Z', 'NOW'); eq(ev('CLOCK.injected'), false, 'not injected'); eq(ev('opsToday'), '2026-10-18', 'ops today');
    const d = ev('clockNow().getTime() - NOW.getTime()'); assert(d >= 0 && d < 600000, 'clockNow runs from NOW: ' + d);
    eq(ev('S.liveAt'), null, 'no live tick in the iframe'); ev('liveTick()'); assert(ev('S.liveAt.getTime() - NOW.getTime()') < 600000, 'live stamp on the demo clock');
  });
  for (const lang of LANGS) await group('[' + lang + '] deterministic clock: ?today=2026-11-02 moves NOW, ops day and header date', lang + '?today=2026-11-02', async (g, ev, w) => {
    eq(ev('CLOCK.injected'), true, 'injected'); eq(ev('NOW.toISOString()'), '2026-11-02T09:30:00.000Z', 'NOW'); eq(ev('opsToday'), '2026-11-02', 'ops today');
    const bd = w.document.querySelector('[data-bizdate]').textContent;
    assert(bd.includes('02.11.2026'), 'header business date: ' + bd);
    assert(bd.startsWith({ ru: 'Пн', de: 'Mo', en: 'Mon', kk: 'Дс' }[lang]), 'weekday (Monday): ' + bd);
    const k = w.document.querySelector('[data-clock]').textContent; assert(/^1[45]:\d\d:\d\d$/.test(k), 'clock on the demo time: ' + k);
    clean(w, 'dashboard ' + lang);
  });
  await group('deterministic clock: ?today with a time, and a bad value falls back to the default', 'en?today=2026-11-02T07:05', async (g, ev) => {
    eq(ev('NOW.toISOString()'), '2026-11-02T02:05:00.000Z', 'time of day in Astana time');
    const g2 = await fresh('en?today=garbage'); try { eq(g2.ev('CLOCK.injected'), false, 'bad value'); eq(g2.ev('NOW.toISOString()'), '2026-10-18T09:30:00.000Z', 'default'); } finally { g2.done(); }
  });
  await group('deterministic clock: time machine +74 days, every menu screen renders clean', 'ru?today=2026-12-31', async (g, ev, w) => {
    eq(ev('opsToday'), '2026-12-31', 'ops today');
    for (const id of ev('NAV.map(n=>n[0])')) { ev(`go('${id}')`); clean(w, '+74 d ' + id); }
  });
  await group('shard plan: every suite file in exactly one shard, shards balanced', 'ru', async () => {
    for (const n of [1, 2, 4, 6]) {
      const p = __HARNESS.plan(n), ks = Object.values(p.of);
      eq(ks.length, __SUITES.length, n + ' shards: every file'); assert(ks.every(k => k >= 1 && k <= n), n + ' shards: index');
      const max = Math.max(...p.load), tot = p.load.reduce((s, x) => s + x, 0), big = Math.max(...__SUITES.map(s => s.ms));
      assert(max <= Math.max(big, tot / n) * 1.35 + 1, n + ' shards balanced: ' + p.load.join('/'));
    }
    assert(__SUITES.some(s => s.name === 'f0-ci-infra.js'), 'suite list from the build');
  });
  await group('retry and quarantine: flaky = passes on retry, real failures stay failures', 'ru', async () => {
    let n = 0; const r1 = await __HARNESS.attempts(async () => { if (n++ === 0) throw new Error('opsPlaces is not defined'); }, 1);
    assert(r1.ok && r1.errs.length === 1 && r1.errs[0] === 'opsPlaces is not defined', 'flaky once: ' + JSON.stringify(r1));
    const r2 = await __HARNESS.attempts(async () => { throw new Error('always'); }, 2); assert(!r2.ok && r2.errs.length === 3, 'always fails');
    const r3 = await __HARNESS.attempts(async () => {}, 1); assert(r3.ok && !r3.errs.length, 'green');
    assert(Array.isArray(__QUARANTINE), 'quarantine list from the build'); const QL = ['opsPlaces', '/^\\[de\\] load/i'];
    assert(__HARNESS.quarantined('[ru] trips: opsPlaces check', QL) && __HARNESS.quarantined('[DE] Load & weight', QL) && !__HARNESS.quarantined('[en] load & weight', QL), 'quarantine match (substring and /regex/)');
  });
