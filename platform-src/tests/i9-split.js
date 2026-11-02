  /* ---- I9 · R02 / FR-192 split build: core + one chunk per menu area, loaded on the first visit (platform-src/tools-build/split-*.mjs, platform/split/<lang>/) ---- */
  const I9_PAGE = l => 'split/' + l + '/index.html';
  const I9_WAIT = ms => new Promise(r => setTimeout(r, ms));
  /* the graph module is loaded from its text through a blob URL (no imports inside: it runs in the browser as it runs in the build) */
  const i9Graph = async () => import(URL.createObjectURL(new Blob([await (await fetch('../platform-src/tools-build/split-graph.mjs', { cache: 'no-store' })).text()], { type: 'text/javascript' })));
  const i9Json = async p => (await fetch(p, { cache: 'no-store' })).json();
  const i9Text = async p => { const r = await fetch(p, { cache: 'no-store' }); assert(r.ok, p + ' is served (' + r.status + ')'); return r.text(); };
  /* a split page in its own hidden frame; resolves when the first screen is drawn (the chunk of the first screen is loaded before that) */
  async function i9Open(lang, q) {
    const f = document.createElement('iframe'); f.style.cssText = 'position:absolute;left:-9999px;top:0;width:1316px;height:760px;border:0'; f.src = I9_PAGE(lang) + (q ? '?' + q : ''); document.body.appendChild(f);
    await new Promise((ok, no) => { f.onload = ok; f.onerror = no; setTimeout(() => no(new Error('split frame timeout')), 20000); });
    const w = f.contentWindow; w.__errs = []; w.addEventListener('error', e => w.__errs.push(e.message));
    const up = () => { try { return w.eval('typeof SPLIT !== "undefined" && SPLIT.state.booted') && w.document.querySelector('.page-title'); } catch (_) { return false; } };
    for (let i = 0; i < 120 && !up(); i++) await I9_WAIT(50);
    assert(up(), 'the split page booted');
    return { w, f, ev: c => w.eval(c), SPLIT: w.eval('SPLIT'), done: () => f.remove() };
  }
  /* waits until no section shows the loading state any more */
  async function i9Settle(w) { for (let i = 0; i < 100 && w.document.querySelector('[data-test="state:loading"]'); i++) await I9_WAIT(40); }
  /* Every build writes split-plan.json next to tests.html (plan, lock, and whether --split ran). The plan groups always run on it. The groups that read the built
     chunks run when split/ exists; split/ missing while split-plan.json says the build ran with --split (or the reverse) is a failure, never a skip. */
  const i9PlanData = async () => { const r = await fetch('split-plan.json', { cache: 'no-store' }); assert(r.ok, 'split-plan.json is served: every build writes it next to tests.html'); const p = await r.json(); assert(!p.error, 'the file graph is valid: ' + p.error); return p; };
  const i9Built = async () => { const p = await i9PlanData(), ok = (await fetch('split/plan.json', { cache: 'no-store' })).ok; eq(ok, !!p.splitBuilt, 'split/ is present exactly when the build ran with --split'); return ok; };
  const I9_MK = (name, src, area, fixed) => ({ name, src, area: area || null, fixed: !!fixed });
  /* the shared frame of the synthetic bundles: the registries the real core defines */
  const I9_BASE = I9_MK('core.js', "const SCREENS = {}; const ACT = {}; const DRAWERS = {}; const HOOKS = { status: [] }; const S = { route: 'a', tab: {} }; function addTab(id, key, label, body) { SCREENS[id].tabs = (SCREENS[id].tabs || []).concat([{ key, label, body }]); } const go = r => { S.route = r; };", null, true);
  const I9_APP = I9_MK('app.js', 'go("a");', null, true);
  const i9Plan = async (...files) => { const g = await i9Graph(); return g.planChunks([I9_BASE, ...files, I9_APP]); };
  const i9Where = (plan, name) => plan.placement.get(name);

  await group('R02.3 plan: an area nothing depends on gets its own chunk, a shared global pulls its definer into the core', 'ru', async () => {
    const a = I9_MK('a/010-a.js', "(() => { globalThis.helperA = x => x + 1; SCREENS.a = { title: () => 'A', body: () => 'a' }; })();", 'a');
    const b = I9_MK('b/020-b.js', "(() => { SCREENS.b = { title: () => 'B', body: () => 'b' + helperA(1) }; })();", 'b');
    const c = I9_MK('c/030-c.js', "(() => { SCREENS.c = { title: () => 'C', body: () => 'c' }; })();", 'c');
    const p = await i9Plan(a, b, c);
    eq(i9Where(p, 'c/030-c.js'), 'c', 'an independent area stays in its own chunk');
    eq(i9Where(p, 'a/010-a.js'), 'core', 'helperA is used by area b: its definer cannot be loaded later than b, so it goes to the core');
    eq(i9Where(p, 'b/020-b.js'), 'b', 'the user of the global stays in its chunk');
    eq(JSON.stringify(p.chunks.c.routes), '["c"]', 'the chunk lists the route it opens with');
  });

  await group('R02.3 plan: addTab into another area\'s screen and wrappers of another area\'s action travel with the owner', 'ru', async () => {
    const a = I9_MK('a/010-a.js', "(() => { SCREENS.a = { title: () => 'A', body: () => 'a' }; ACT.work = d => d; })();", 'a');
    const b = I9_MK('b/020-b.js', "(() => { SCREENS.b = { title: () => 'B', body: () => 'b' }; addTab('a', 'extra', 'X', () => 'x'); const w0 = ACT.work; ACT.work = d => w0(d) + 1; })();", 'b');
    const c = I9_MK('c/030-c.js', "(() => { SCREENS.c = { title: () => 'C', body: () => 'c' }; })();", 'c');
    const p = await i9Plan(a, b, c);
    eq(i9Where(p, 'a/010-a.js'), 'a+b', 'a tab pushed into screen a and a wrapper of ACT.work put area b into the chunk of area a');
    eq(i9Where(p, 'b/020-b.js'), 'a+b', 'both files are in the same chunk, in bundle order');
    eq(i9Where(p, 'c/030-c.js'), 'c', 'the third area is unaffected');
    eq(JSON.stringify(p.chunks['a-b'].files), '["a/010-a.js","b/020-b.js"]', 'chunk files keep the bundle order');
    eq(JSON.stringify(p.chunks['a-b'].routes), '["a","b"]', 'the chunk opens with either route');
  });

  await group('R02.3 plan: hooks and patches of what the core defines run on every page, so those files go to the core', 'ru', async () => {
    const h = I9_MK('h/010-h.js', "(() => { SCREENS.h = { body: () => 'h' }; HOOKS.status.push((l, st) => st); })();", 'h');
    const w = I9_MK('w/020-w.js', "(() => { SCREENS.w = { body: () => 'w' }; const g0 = ACT.go; ACT.go = d => g0(d); })();", 'w');
    const t = I9_MK('t/030-t.js', "(() => { SCREENS.t = { body: () => 't' }; })();", 't');
    const core = I9_MK('core2.js', "Object.assign(ACT, { go: d => go(d.v) });", null, true);
    const g = await i9Graph(), p = g.planChunks([I9_BASE, core, h, w, t, I9_APP]);
    eq(p.placement.get('h/010-h.js'), 'core', 'HOOKS.status.push: the hook must exist before any status changes');
    eq(p.placement.get('w/020-w.js'), 'core', 'a wrapper of an action the core defines');
    eq(p.placement.get('t/030-t.js'), 't', 'the untouched area keeps its chunk');
  });

  await group('R02.3 plan: S members, markup actions, tabs patched from outside and chunks without a route', 'ru', async () => {
    const e = I9_MK('e/010-e.js', "(() => { S.eco = { fines: [] }; SCREENS.e = { body: () => 'e' }; })();", 'e');
    const r = I9_MK('r/020-r.js', "(() => { SCREENS.r = { body: () => 'r' }; ACT.tmp = () => { S.scratch = 1; }; })();", 'r');
    const m = I9_MK('m/030-m.js', "(() => { SCREENS.m = { body: () => `<button data-act=\"doB\">x</button>` }; })();", 'm');
    const n = I9_MK('n/040-n.js', "(() => { ACT.doB = () => 1; SCREENS.n = { body: () => 'n' }; })();", 'n');
    const x = I9_MK('x/050-x.js', "(() => { ACT.lonely = () => 1; })();", 'x');
    const shell = I9_MK('shell/001-shell.js', "function banner() { return S.eco && S.eco.fines.length + S.scratch; }", 'shell', true);
    const o = I9_MK('o/060-o.js', "(() => { SCREENS.o = { body: () => 'o' }; })();", 'o');
    const q = I9_MK('q/070-q.js', "(() => { const t = SCREENS.o.tabs.find(k => k.key === 'z'); if (t) t.body = () => 'q'; })();", 'q');
    const p = await i9Plan(e, r, m, n, x, shell, o, q);
    eq(i9Where(p, 'e/010-e.js'), 'core', 'S.eco is created by a chunk and read by the core: its writer is core');
    eq(i9Where(p, 'r/020-r.js'), 'r', 'S.scratch is only set inside a handler: that is not a definition, the area stays out of the core');
    eq(i9Where(p, 'n/040-n.js'), 'core', 'area m draws data-act="doB": ACT.doB must exist whenever m is open, so its definer is core');
    eq(i9Where(p, 'm/030-m.js'), 'm', 'the area with the button stays in its chunk');
    eq(i9Where(p, 'x/050-x.js'), 'core', 'a chunk without a route of its own would never be loaded: core');
    eq(i9Where(p, 'q/070-q.js'), 'core', 'a file that only patches a screen of another area has no route to be loaded by: core');
    eq(i9Where(p, 'o/060-o.js'), 'core', 'and the screen it patches must exist when it runs: core too');
  });

  await group('R02.3 build fails: a plan that breaks the file graph is refused, a chunk that lost a file fails against the lock', 'ru', async () => {
    const g = await i9Graph();
    const a = I9_MK('a/010-a.js', "(() => { globalThis.helperA = x => x; SCREENS.a = { body: () => 'a' }; })();", 'a');
    const b = I9_MK('b/020-b.js', "(() => { SCREENS.b = { body: () => helperA(1) }; })();", 'b');
    const files = [I9_BASE, a, b, I9_APP], graph = g.buildGraph(files);
    const bad = g.checkPlacement(files, new Map([['core.js', 'core'], ['a/010-a.js', 'a'], ['b/020-b.js', 'b'], ['app.js', 'core']]), graph);
    assert(bad.length === 1 && /b\/020-b\.js \(b\) needs g:helperA .* a\/010-a\.js in chunk a/.test(bad[0]), 'chunk b needs a global defined in chunk a: ' + JSON.stringify(bad));
    const bad2 = g.checkPlacement(files, new Map([['core.js', 'a'], ['a/010-a.js', 'core'], ['b/020-b.js', 'b'], ['app.js', 'core']]), graph);
    assert(bad2.some(x => /a core file placed in chunk a/.test(x)), 'a core file placed in a chunk is refused: ' + JSON.stringify(bad2));
    const plan = g.planChunks(files);
    eq(JSON.stringify(g.checkLock(plan.chunks, { chunks: { b: { files: ['b/020-b.js'] } } })), '[]', 'the lock is met');
    const lost = g.checkLock(plan.chunks, { chunks: { b: { files: ['b/020-b.js'] }, a: { files: ['a/010-a.js'] } } });
    assert(lost.length === 1 && /a\/010-a\.js left chunk a|chunk a is gone/.test(lost[0]), 'a locked chunk that became core is reported: ' + JSON.stringify(lost));
    let thrown = null; try { g.planChunks([I9_BASE, I9_MK('d1.js', 'const dupG = 1;', 'd1'), I9_MK('d2.js', 'const dupG = 2;', 'd2'), I9_APP]); } catch (e) { thrown = e; }
    assert(thrown && /declared in d1\.js and in d2\.js/.test(thrown.message), 'the same global declared in two files fails the plan: ' + (thrown && thrown.message));
  });

  await group('R02 plan: the reader of the source sees strings, templates, regexes and division as the bundle runs them', 'ru', async () => {
    const g = await i9Graph(), s = g.scanFile('x.js', "const a = /['\"]/.test(s) ? `x${`y${b}`}` : c / d / 2; function f() { return 1; } let h = 1, k = { z: 1 };\n(() => { const inner = 1; })();\nclass K {}");
    eq([...s.globalsDeclared].sort().join(), 'K,a,f,h,k', 'top-level declarations; names inside the IIFE are local');
    eq([...s.localDeclared].join(), 'inner', 'a name inside the IIFE is local');
    const t = g.lex("x = a /* c */ / b; y = 'it\\'s'; z = `a${ {k: 1}.k }b`;").map(k => k.k + ':' + k.v).join(' ');
    assert(t.includes("str:it\\'s") && t.includes('tpl:a') && t.includes('tpl:b') && !t.includes('re:'), 'tokens: ' + t);
  });

  await group('R02 plan data: split-plan.json (written by every build) - chunks own routes, the core keeps app.js, no file in two places, the lock is met', 'ru', async () => {
    const plan = await i9PlanData(), g = await i9Graph();
    assert(plan.core.files.includes('app.js') && plan.core.files.includes('core.js'), 'app.js and core.js are in the core');
    const ids = Object.keys(plan.chunks); assert(ids.length >= 1, 'at least one chunk');
    for (const id of ids) { assert(plan.chunks[id].routes.length >= 1, 'chunk ' + id + ' opens with a route'); for (const f of plan.chunks[id].files) assert(!plan.core.files.includes(f), f + ' is in the core and in chunk ' + id); }
    assert(plan.lock && plan.lock.chunks, 'platform-src/tools-build/split-lock.json exists');
    eq(JSON.stringify(g.checkLock(plan.chunks, plan.lock)), '[]', 'the lock is met by the plan');
  });

  await group('R02 built plan: platform/split/plan.json lists chunks whose routes the manifest maps, core keeps app.js, the lock is met', 'ru', async () => {
    if (!(await i9Built())) return;
    const plan = await i9Json('split/plan.json'), g = await i9Graph(), data = await i9PlanData(), lock = data.lock;
    eq(JSON.stringify(Object.keys(plan.chunks).sort()), JSON.stringify(Object.keys(data.chunks).sort()), 'split/plan.json and split-plan.json agree on the chunks');
    assert(plan.core.files.includes('app.js') && plan.core.files.includes('core.js'), 'app.js and core.js are in the core');
    const ids = Object.keys(plan.chunks); assert(ids.length >= 1, 'at least one chunk');
    for (const id of ids) { assert(plan.chunks[id].routes.length >= 1, 'chunk ' + id + ' opens with a route'); for (const f of plan.chunks[id].files) assert(!plan.core.files.includes(f), f + ' is in the core and in chunk ' + id); }
    eq(JSON.stringify(g.checkLock(plan.chunks, lock)), '[]', 'split-lock.json is met by the built plan');
    for (const lang of LANGS) {
      const man = await i9Json('split/' + lang + '/manifest.json'), html = await i9Text(I9_PAGE(lang)), core = await i9Text('split/' + lang + '/core.js');
      eq(JSON.stringify(Object.keys(man.chunks).sort()), JSON.stringify(ids.sort()), lang + ': a chunk file per chunk of the plan');
      for (const id of ids) { const txt = await i9Text('split/' + lang + '/' + man.chunks[id].file); assert(txt.length > 200, lang + ' ' + id + ' is not empty'); assert(core.includes('"file":"area-' + id + '.js"'), lang + ': the core knows chunk ' + id); }
      assert(html.includes('<' + 'script src="core.js?nosw&v=') && html.includes('data-split="core"'), lang + ': the page loads core.js, bypassing the service worker');
      assert(html.includes('../../assets/brand/kokzhol-favicon.svg') && !/(href|src)="assets\//.test(html), lang + ': the page reaches platform/assets two folders up');
      assert(core.includes("'../' + l + '/index.html'") && !/l \+ '\.html'/.test(core), lang + ': language links point to the sibling split pages');
    }
  });

  for (const lang of LANGS) await group('[' + lang + '] R02 smoke: every section of the split page opens, a chunk loads once, the screens equal the single-file page', lang, async (g, ev, w) => {
    if (!(await i9Built())) return;
    const sp = await i9Open(lang);
    try {
      const man = sp.SPLIT.manifest, chunkRoutes = Object.keys(man.routeChunk);
      assert(chunkRoutes.length >= 1, 'the page has chunk routes');
      const routes = ev("NAV.filter(function(n){ return canSee(n[0]); }).map(function(n){ return n[0]; })");
      for (const r of chunkRoutes) if (!routes.includes(r)) routes.push(r);
      eq(sp.ev("SPLIT.stubs().join()"), chunkRoutes.join(), 'before a visit every chunk route is a stub');
      const chunkScripts = () => [...sp.w.document.scripts].map(s => s.src).filter(u => /\/area-[\w-]+\.js\?/.test(u));
      eq(chunkScripts().length, 0, 'no chunk is loaded by the first screen (the dashboard is in the core)');
      for (const r of routes) {
        sp.ev("go('" + r + "')"); await i9Settle(sp.w);
        assert(!sp.w.document.querySelector('[data-test="state:error"]'), r + ': no error state');
        assert(sp.w.document.querySelector('[data-test="state:loading"]') === null, r + ': not loading any more');
        assert(sp.w.document.querySelector('.page-title').textContent.trim().length > 0, r + ': the screen has a title');
        clean(sp.w, lang + ' split ' + r);
        eq(ev("(function(){ go('" + r + "'); return shellContent(); })()"), sp.ev("shellContent()"), r + ': the section equals the single-file page'); await i9Settle(sp.w);
      }
      eq(sp.ev("SPLIT.stubs().length"), 0, 'all stubs are replaced after the visits');
      eq(chunkScripts().length, chunkRoutes.map(r => man.routeChunk[r]).filter((v, i, a) => a.indexOf(v) === i).length, 'each chunk was requested exactly once');
      assert(chunkScripts().every(u => u.includes('nosw')), 'chunk requests bypass the service worker');
      const before = chunkScripts().length; for (const r of routes) { sp.ev("go('" + r + "')"); } await i9Settle(sp.w);
      eq(chunkScripts().length, before, 'visiting the sections again loads nothing');
      for (const k of ['SCREENS', 'ACT', 'DRAWERS', 'ACTION_REGISTRY']) eq(sp.ev("Object.keys(" + k + ").sort().join()"), ev("Object.keys(" + k + ").sort().join()"), k + ' has the same members once every chunk is loaded');
      eq(sp.ev("HOOKS.status.length"), ev("HOOKS.status.length"), 'the same status hooks');
      assert(!sp.w.__errs.length, 'no script error: ' + sp.w.__errs[0]);
    } finally { sp.done(); }
  });

  await group('R02 dry run: a chunk section opened first after the load, or by a link, draws the same as in the single-file page', 'ru', async (g, ev, w) => {
    if (!(await i9Built())) return;
    const man = (await i9Json('split/ru/manifest.json')).chunks;
    for (const id of Object.keys(man)) for (const route of man[id].routes) {
      const sp = await i9Open('ru');
      try {
        sp.ev("go('" + route + "')"); await i9Settle(sp.w);
        eq(sp.ev("SPLIT.isLoaded('" + id + "')"), true, route + ': the chunk loaded on the first visit');
        eq(sp.ev("shellContent()"), ev("(function(){ go('" + route + "'); return shellContent(); })()"), route + ': first visit draws the same section');
      } finally { sp.done(); }
      const dl = await i9Open('ru', 's=' + route);
      try {
        eq(dl.ev("S.route"), route, route + ': a link to the section opens it'); eq(dl.ev("SPLIT.isLoaded('" + id + "')"), true, route + ': the chunk of the linked section is loaded before the first draw');
        assert(!dl.w.document.querySelector('[data-test="state:loading"]'), route + ': the first draw is not a loading state');
      } finally { dl.done(); }
    }
  });

  await group('R02.2 a chunk that does not load shows KIT.state error with "Try again"; the rest works; Try again loads it', 'ru', async () => {
    if (!(await i9Built())) return;
    const sp = await i9Open('ru');
    try {
      const id = Object.keys(sp.SPLIT.manifest.chunks)[0], route = sp.SPLIT.manifest.chunks[id].routes[0], good = sp.SPLIT.manifest.chunks[id].file;
      sp.SPLIT.manifest.chunks[id].file = 'missing-' + good;
      sp.ev("go('" + route + "')"); await i9Settle(sp.w); await I9_WAIT(200);
      const err = sp.w.document.querySelector('[data-test="state:error"]'); assert(err, 'the section shows the error state');
      const btn = err.querySelector('button[data-act="retry"]'); assert(btn && btn.dataset.v === 'chunk:' + id, 'the error state has "Try again" bound to chunk:' + id);
      sp.ev("go('orders')"); await i9Settle(sp.w);
      assert(!sp.w.document.querySelector('[data-test="state:error"]') && sp.w.document.querySelector('.page-title').textContent.trim(), 'another section still works');
      sp.ev("go('" + route + "')"); await i9Settle(sp.w);
      assert(sp.w.document.querySelector('[data-test="state:error"]'), 'the failed chunk is not retried by itself');
      eq(sp.SPLIT.isLoaded(id), false, 'not loaded');
      sp.SPLIT.manifest.chunks[id].file = good;
      sp.w.document.querySelector('[data-test="state:error"] button').click(); await i9Settle(sp.w); await I9_WAIT(200); await i9Settle(sp.w);
      assert(!sp.w.document.querySelector('[data-test="state:error"]'), 'Try again: the error is gone'); eq(sp.SPLIT.isLoaded(id), true, 'Try again loaded the chunk');
      eq(sp.ev("S.route"), route, 'the visitor is still on the section');
      assert(![...sp.w.document.scripts].some(s => /missing-/.test(s.src)), 'the failed script element is removed');
    } finally { sp.done(); }
  });

  await group('R02.2 ACT.retry runs the handler named in data-v / data-id, without one it redraws; the single-file page has no split runtime', 'ru', async (g, ev) => {
    eq(ev("typeof RETRY"), 'object', 'RETRY is a registry');
    eq(ev("typeof SPLIT"), 'undefined', 'the single-file page carries no split runtime');
    ev("window.__r = []; RETRY['t:one'] = function(d){ window.__r.push('one:' + d.v); }; RETRY['t:two'] = function(d){ window.__r.push('two:' + d.id); };");
    ev("ACT.retry({ v: 't:one' }); ACT.retry({ id: 't:two' });");
    eq(ev("window.__r.join()"), 'one:t:one,two:t:two', 'handlers found by data-v and by data-id, called with the dataset');
    ev("window.__n = 0; var r0 = render; render = function(){ window.__n++; return r0.apply(this, arguments); }; ACT.retry({ v: 'nobody' }); ACT.retry({}); ACT.retry(); render = r0;");
    eq(ev("window.__n"), 3, 'an unknown name, no name and no argument redraw (as before)');
    const html = ev("KIT.state('error', { action: { label: 'Again', act: 'retry', v: 't:one' } })");
    assert(/data-act="retry" data-v="t:one">Again</.test(html), 'KIT.state error carries the handler name: ' + html);
    ev("go('orders')"); ev("window.__r = []"); ev("document.getElementById('root').insertAdjacentHTML('beforeend', " + JSON.stringify(html) + ")");
    g.w.document.querySelector('#root [data-test="state:error"] button').click();
    eq(ev("window.__r.join()"), 'one:t:one', 'a click on the button runs the registered handler');
  });

  await group('R02 sw.js: chunk and core requests of the split page bypass the service worker, the pages it serves are inside its scope', 'ru', async () => {
    const sw = await i9Text('sw.js'), m = /const skip = (r => \{[^\n]*\});/.exec(sw); assert(m, 'sw.js has its skip rule');
    const skip = new Function('self', 'URL', 'return (' + m[1] + ');')({ location: new URL('http://h/platform/sw.js') }, URL);
    const req = (u, o) => Object.assign({ url: u, method: 'GET', mode: 'no-cors', referrer: '' }, o);
    eq(skip(req('http://h/platform/split/ru/area-ai.js?nosw&v=1')), true, 'a chunk request is not served by the worker');
    eq(skip(req('http://h/platform/split/ru/core.js?nosw&v=1')), true, 'core.js is not served from the cache (a stale core would not match a new chunk)');
    eq(skip(req('http://h/platform/split/ru/index.html', { mode: 'navigate' })), false, 'the split page itself is a normal page of the scope (network first)');
    eq(skip(req('http://h/platform/tests.html')), true, 'the test harness is still left alone');
    assert(!/split\//.test(sw.split('const PRECACHE')[1].split(';')[0]), 'the offline cache does not list split files: the single-file pages are the offline demo');
  });

  await group('R02.2 ACT.retry: a name like "constructor" / "toString" is not a handler (RETRY has no prototype)', 'ru', async (g, ev) => {
    eq(ev("Object.getPrototypeOf(RETRY) === null"), true, 'RETRY is a bare dictionary');
    ev("window.__n = 0; var r0 = render; render = function(){ window.__n++; return r0.apply(this, arguments); };");
    ev("ACT.retry({ v: 'constructor' }); ACT.retry({ v: 'toString' }); ACT.retry({ id: '__proto__' }); ACT.retry({ v: 'hasOwnProperty' }); render = r0;");
    eq(ev("window.__n"), 4, 'each of them only redraws');
  });

  await group('R02 split: a link naming Object.prototype members (?s=constructor, ?s=__proto__) loads no chunk and breaks nothing', 'ru', async () => {
    if (!(await i9Built())) return;
    for (const q of ['s=constructor', 's=__proto__', 's=toString']) {
      const sp = await i9Open('ru', q);
      try {
        eq(sp.ev("SPLIT.chunkOf('constructor') === null && SPLIT.chunkOf('__proto__') === null && SPLIT.chunkOf('toString') === null"), true, q + ': not a chunk route');
        eq(Object.keys(sp.SPLIT.state.failed).length + Object.keys(sp.SPLIT.state.loading).length + Object.keys(sp.SPLIT.state.loaded).length, 0, q + ': nothing was requested');
        assert(sp.w.document.querySelector('.page-title'), q + ': the page is drawn');
      } finally { sp.done(); }
    }
  });
