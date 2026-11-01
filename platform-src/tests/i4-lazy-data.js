  /* ---- I4 · FR-197 lazy demo data: heavy collections are built on first use, memoised, seeded; start under the budget ---- */
  /* Golden hashes: lazyHash() (FNV-1a over JSON.stringify + length) of every lazy collection as the page built it at load BEFORE FR-197
     (taken from the eager build at 982f57c, same four languages, simulation off). ru and kk share the hashes of the numbers, not the texts. */
  const I4_GOLD = {
    ru: { alarms: '0112b8da:2218', inbox: '98a45d93:2619', oncall: '9f7ccbba:1007', claims: 'ff824c57:845', users: 'c0760bdd:2498', integ: '1b406d2a:12093', apiKeys: '269e44d2:627', webhooks: '0641f3ca:508', 'r5.points': '19eda0de:72541' },
    de: { alarms: 'e9435bad:2260', inbox: '5857f2cb:2643', oncall: 'fb3f60df:1005', claims: 'd09073d5:847', users: 'b2715a90:2502', integ: '79b7825b:12150', apiKeys: '832b99c8:627', webhooks: '0641f3ca:508', 'r5.points': '9a61b01d:72898' },
    en: { alarms: '54f2c81e:2241', inbox: '8ee8d976:2596', oncall: '2cf99c3c:999', claims: 'bed4281c:841', users: '09e2f04d:2503', integ: '4dd69ba6:11886', apiKeys: '832b99c8:627', webhooks: '0641f3ca:508', 'r5.points': '9a61b01d:72898' },
    kk: { alarms: '1f38e39e:2218', inbox: '474e4af5:2619', oncall: '59d222e3:1004', claims: 'eaf4c909:834', users: '51f2bc01:2498', integ: 'c90e3ccc:11716', apiKeys: '269e44d2:627', webhooks: '0641f3ca:508', 'r5.points': '19eda0de:72541' },
  };
  const I4_NAMES = Object.keys(I4_GOLD.ru);
  /* collections nothing on the first screen (dashboard) reads: they must still be unbuilt after the page has started */
  const I4_COLD = ['oncall', 'claims', 'users', 'integ', 'apiKeys', 'webhooks', 'r5.points'];
  const I4_VAL = "(function(n){ return lazyForce(n); })";

  for (const lang of LANGS) await group('[' + lang + '] lazy(name, fn): built on the first read, memoised, S.name stays a plain field', lang, async (g, ev) => {
    eq(ev("typeof lazy + typeof lazyForce + typeof lazyBuilt + typeof lazyReset + typeof lazyHash + typeof lazyFn"), 'functionfunctionfunctionfunctionfunctionfunction', 'the lazy API is global');
    ev("window.__n = 0; lazy('i4x', function(){ window.__n++; return [{ id: 1 }, { id: 2 }]; })");
    eq(ev("window.__n"), 0, 'declaring does not build'); eq(ev("lazyBuilt('i4x')"), false, 'not built after declaring');
    assert(ev("'i4x' in S && Object.keys(S).includes('i4x')"), 'the name is an enumerable key of S before the first read');
    eq(ev("S.i4x.length"), 2, 'first read builds'); eq(ev("window.__n"), 1, 'builder ran once');
    eq(ev("S.i4x === S.i4x && S.i4x === lazyForce('i4x')"), true, 'memoised: the same array every time'); eq(ev("window.__n"), 1, 'no second build');
    eq(ev("typeof Object.getOwnPropertyDescriptor(S, 'i4x').get"), 'undefined', 'after the build S.i4x is an ordinary data property');
    ev("S.i4x.push({ id: 3 })"); eq(ev("S.i4x.length"), 3, 'a built collection is writable like any other');
    ev("S.i4x = []"); eq(ev("S.i4x.length"), 0, 'assignment after the build replaces it');
    ev("lazyReset('i4x')"); eq(ev("lazyBuilt('i4x')"), false, 'lazyReset arms it again'); eq(ev("S.i4x.length + ':' + window.__n"), '2:2', 'the next read builds the seed again');
    /* a write before the first read wins and the builder never runs */
    ev("window.__m = 0; lazy('i4y', function(){ window.__m++; return [1]; }); S.i4y = ['own']");
    eq(ev("S.i4y[0] + ':' + window.__m + ':' + lazyBuilt('i4y')"), 'own:0:true', 'S.name = v before the first read keeps v, no build');
    /* a builder that reads its own collection fails loudly, and the failure leaves the collection unbuilt */
    ev("lazy('i4z', function(){ return S.i4z.length; })");
    eq(ev("(function(){ try { S.i4z; return 'no error'; } catch (e) { return /own builder/.test(e.message) ? 'cycle' : e.message; } })()"), 'cycle', 'cyclic read is reported');
    eq(ev("lazyBuilt('i4z')"), false, 'still unbuilt after the failed build');
    /* lazyFn: the same for a collection kept in a closure */
    ev("window.__f = 0; window.__g = lazyFn('i4f', function(){ window.__f++; return [7, 8]; })");
    eq(ev("window.__f + ':' + lazyBuilt('i4f')"), '0:false', 'lazyFn declares without building');
    eq(ev("window.__g().length + ':' + (window.__g() === window.__g()) + ':' + window.__f"), '2:true:1', 'lazyFn memoises');
    eq(ev("lazyHash([1, 2]) === lazyHash([1, 2]) && lazyHash([1, 2]) !== lazyHash([2, 1])"), true, 'lazyHash tells different data apart');
  });

  for (const lang of LANGS) await group('[' + lang + '] heavy collections are lazy: not built at load, read-only screens leave them alone', lang, async (g, ev) => {
    const names = ev("lazyNames()"); I4_NAMES.concat(['audit']).forEach(n => assert(names.includes(n), n + ' is declared lazy: ' + names));
    const built = ev("LAZY_LOG.slice()");
    I4_COLD.forEach(n => { eq(ev("lazyBuilt('" + n + "')"), false, n + ' is not built after the page has started (built: ' + built + ')'); });
    /* a screen that does not need them does not build them */
    ev("go('fleet')"); ev("go('dispatch')");
    ['users', 'integ', 'apiKeys', 'webhooks', 'claims', 'r5.points'].forEach(n => eq(ev("lazyBuilt('" + n + "')"), false, n + ' still unbuilt after Fleet and Dispatch'));
    /* the collection points are built by the first read, and R5.PTS stays readable */
    eq(ev("R5.PTS.length > 100"), true, 'R5.PTS is readable (a getter over the lazy list)'); eq(ev("lazyBuilt('r5.points')"), true, 'built by the first read');
    eq(ev("R5.search('', '', '').length"), ev("R5.PTS.length"), 'the search runs over the lazy list');
  });

  for (const lang of LANGS) await group('[' + lang + '] lazy and eager build give the same data (hash of the data against the pre-FR-197 build)', lang, async (g, ev) => {
    for (const n of I4_NAMES) {
      eq(ev("lazyHash(lazyForce('" + n + "'))"), I4_GOLD[lang][n], n + ': the lazily built data equals the data the eager build made');
      ev("lazyReset('" + n + "')"); ev("render()");   /* screens that finish a seed on first use (the road messages of the inbox, 265-mirror-roads) do it again on the draw */
      eq(ev("lazyHash(lazyForce('" + n + "'))"), I4_GOLD[lang][n], n + ': the same seed gives the same values after a reset');
    }
    /* S.* stays readable as plain JSON: nothing in a collection is a getter or a function that only works in a builder */
    eq(ev("JSON.parse(JSON.stringify(S.users)).length"), ev("S.users.length"), 'S.users survives a JSON round trip');
  });

  await group('counters of the seeds do not depend on the moment of the build (new ids follow the seeded ones)', 'ru', async (g, ev) => {
    ev("lazyReset('alarms'); lazyReset('inbox'); lazyReset('claims')");
    ev("raiseAlarm({ cat: 'door', lvl: 1, hub: 'AST', truck: 't1', text: 'i4 test' })");
    eq(ev("S.alarms.length + ':' + S.alarms[0].id"), '6:ALM-106', 'a new alarm on an unbuilt store takes the next id after the 5 seeded ones, at the top');
    eq(ev("S.alarms.filter(function(a){return /^ALM-10[1-5]$/.test(a.id)}).length"), 5, 'the five seeded alarms are all there');
    ev("inboxAdd({ kind: 'lead', title: 'i4 lead', src: 'i4' })");
    eq(ev("S.inbox.length + ':' + S.inbox[0].id"), '10:IN-0010', 'a new inbox message on an unbuilt store takes IN-0010');
    eq(ev("S.inbox.filter(function(m){return m.id === 'IN-0001'}).length"), 1, 'seeds keep their ids');
    eq(ev("lazyBuilt('claims')"), false, 'untouched claims stay unbuilt');
    ev("lazyForce('claims')"); eq(ev("S.claims.map(function(c){return c.id}).join()"), 'CLM-2026-001,CLM-2026-002', 'claim ids restart at 001 whenever the seed is built');
  });

  await group('demo reset and the snapshot work with lazy collections', 'ru', async (g, ev) => {
    const gold = I4_GOLD.ru;
    /* snapshot() at page start must not have built the cold collections */
    ['users', 'integ', 'webhooks', 'apiKeys'].forEach(n => eq(ev("lazyBuilt('" + n + "')"), false, n + ' was not built by the start-up snapshot'));
    /* change a built one and an unbuilt one, then reset */
    const nUsers = ev("S.users.length"); ev("S.users.push({ id: 'U-i4', username: 'i4.tester', role: 'admin', active: true, fn: [] })"); eq(ev("S.users.length"), nUsers + 1, 'users changed');
    ev("S.alarms.length = 2"); ev("S.webhooks.push({ id: 'w-i4' })");
    ev("demoReset()");
    eq(ev("lazyHash(S.users)"), gold.users, 'users back to the seed after demoReset');
    eq(ev("lazyHash(S.alarms)"), gold.alarms, 'alarms back to the seed after demoReset');
    eq(ev("lazyHash(S.webhooks)"), gold.webhooks, 'webhooks (built, then changed) back to the seed');
    /* a collection that was never read is not built by the reset either */
    ev("lazyReset('integ')"); ev("demoReset()"); eq(ev("lazyBuilt('integ')"), false, 'an untouched lazy collection stays unbuilt through demoReset');
    eq(ev("lazyHash(S.integ)"), gold.integ, 'and reads as the seed afterwards');
    eq(ev("S.audit.length > 0 && S.audit[0].module"), 'Demo', 'the reset is written to the audit log (the lazy audit store works)');
  });

  /* the dry test: every route of the menu, opened first after the load, shows what it shows when everything has been built in advance */
  const I4_TXT = "(function(){ var m = document.querySelector('#main-content') || document.body; return m.innerText.replace(/\\s+/g, ' '); })()";
  const I4_ROUTES = ['dashboard', 'orders', 'dispatch', 'fleet', 'drivers', 'routes', 'hubs', 'pod', 'billing', 'reports', 'ai', 'baseline', 'settings'];
  for (const route of I4_ROUTES) await group('dry test: "' + route + '" opened first after the load equals "' + route + '" after everything was built', 'ru', async (g, ev, w) => {
    assert(ev("NAV.map(function(n){return n[0]}).includes('" + route + "')"), route + ' is a menu route');
    const keys = ev("tabsOf('" + route + "').map(function(t){return t.key})");
    const grab = () => { const out = [ev("go('" + route + "');" + I4_TXT)]; for (const k of keys) { ev("setTab('" + route + "','" + k + "')"); out.push(k + ' | ' + ev(I4_TXT)); } return out; };
    const first = grab(); const lazyBefore = ev("LAZY_LOG.length");
    const g2 = await fresh('ru'); const ev2 = g2.ev, w2 = g2.w;
    ev2("lazyNames().forEach(function(n){ lazyForce(n); })");
    const grab2 = () => { const out = [ev2("go('" + route + "');" + I4_TXT)]; for (const k of keys) { ev2("setTab('" + route + "','" + k + "')"); out.push(k + ' | ' + ev2(I4_TXT)); } return out; };
    const second = grab2();
    first.forEach((t, i) => { if (t !== second[i]) { let d = 0; while (d < t.length && t[d] === second[i][d]) d++; assert(false, route + ' tab #' + i + ' (' + (keys[i - 1] || 'first') + ') differs at char ' + d + ': "' + t.slice(Math.max(0, d - 40), d + 40) + '" vs "' + second[i].slice(Math.max(0, d - 40), d + 40) + '"'); } });
    clean(w, route + ' first'); clean(w2, route + ' after all'); g2.done();
    assert(lazyBefore >= 0, 'lazy log readable');
  });

  /* time to interactive: from the start of the page to the first rendered screen with S ready (mark v6-ready of app.js), against the budget file */
  for (const lang of ['ru', 'en']) await group('[' + lang + '] time to interactive is under the budget of perf-budget.json', lang, async (g, ev, w) => {
    const budget = await (await fetch('../platform-src/perf-budget.json', { cache: 'no-store' })).json();
    assert(budget.interactiveMs > 0 && budget.interactiveMs <= 1500, 'perf-budget.json has interactiveMs <= 1500: ' + budget.interactiveMs);
    const t = w.performance.getEntriesByName('v6-ready'); assert(t.length === 1, 'the v6-ready mark exists');
    const ms = Math.round(t[0].startTime); 
    assert(ms < budget.interactiveMs, 'ready after ' + ms + ' ms, budget ' + budget.interactiveMs + ' ms');
    assert(ev("!!document.querySelector('#root .nav-item') && S.loads.length > 0 && S.schemaProblems.length === 0"), 'at the mark the first screen is drawn and S is ready');
    assert(ms >= 0 && (!budget.measured || typeof budget.measured[lang] === 'number' && budget.measured[lang] > 0), 'the measured value is recorded in the budget file for ' + lang);
  });
