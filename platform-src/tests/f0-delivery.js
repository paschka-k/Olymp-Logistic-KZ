  /* ---- S2 · Delivery: FR-196 asset pipeline + weight budget, FR-223 What's new, FR-224 print / PDF (A4), FR-225 offline demo ---- */
  const S2_CYR = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/;
  await group('S2 FR-196 assets: brand mark preloaded, SVG minified, every PNG logo has a lighter WebP, logos load as WebP', 'ru', async (g, ev, w) => {
    const pre = [...w.document.querySelectorAll('link[rel=preload][as=image]')].map(l => l.getAttribute('href'));
    assert(pre.includes('assets/brand/kokzhol-mark-on-ink.svg'), 'sidebar brand mark preloaded: ' + pre);
    const man = await (await w.fetch('assets/manifest.json', { cache: 'no-store' })).json();
    const svgs = man.assets.filter(a => a.path.endsWith('.svg')); assert(svgs.length >= 8, 'SVG assets listed');
    for (const a of svgs) { const t = await (await w.fetch(a.path, { cache: 'no-store' })).text(); assert(!/>\s+</.test(t) && !/<!--|<\?xml/.test(t), a.path + ' is not minified'); }
    assert(man.webp.length >= 6, 'PNG logos listed');
    man.webp.forEach(x => { assert(x.webp, x.png + ' has no WebP'); assert(x.webp_bytes < x.png_bytes, x.webp + ' is not lighter than the PNG'); });
    eq(ev("mfrSrc('roche')"), 'assets/manufacturers/roche.webp', 'logos use WebP');
    const r = await w.fetch(ev("mfrSrc('roche')")); assert(r.ok, 'WebP served'); const b = new Uint8Array(await r.arrayBuffer());
    eq(String.fromCharCode(...b.slice(8, 12)), 'WEBP', 'RIFF/WEBP signature');
    ev("ACT.setRole({v:'admin'});go('orders');ACT.stab({s:'orders',v:'ship'})");
    const imgs = [...w.document.querySelectorAll('#root img[src*="manufacturers/"]')].map(i => i.getAttribute('src'));
    assert(!imgs.some(s => /\.png$/.test(s)), 'no PNG logo on the shipments tab: ' + imgs.filter(s => /\.png$/.test(s)));
    clean(w, 'assets');
  });
  await group('S2 FR-196 weight budget: every page and the asset set stay within platform-src/budget.json', 'ru', async (g, ev, w) => {
    const man = await (await w.fetch('assets/manifest.json', { cache: 'no-store' })).json(), B = man.budget;
    assert(B.page_kb > 0 && B.tests_kb > 0 && B.assets_kb > 0 && B.asset_file_kb > 0, 'budget values present');
    eq(man.version, ev('VERSION'), 'manifest built for this version');
    for (const p of ['index.html', 'de.html', 'en.html', 'kk.html', 'tests.html']) {
      const n = (await (await w.fetch(p, { cache: 'no-store' })).arrayBuffer()).byteLength;
      assert(n <= (p === 'tests.html' ? B.tests_kb : B.page_kb) * 1024, p + ' is ' + Math.round(n / 1024) + ' KB, over budget');
      assert(Math.abs(n - man.pages[p]) < 1024, p + ' size differs from the manifest (stale build?)');
    }
    assert(man.assets_bytes <= B.assets_kb * 1024, 'assets ' + man.assets_bytes + ' B over budget');
    man.assets.forEach(a => assert(a.bytes <= B.asset_file_kb * 1024, a.path + ' over the per-file budget'));
  });

  await group('S2 FR-223 What\'s new: data generated from docs/TRACEABILITY.md (one stream per section, releases from whatsnew.json)', 'ru', async (g, ev, w) => {
    const md = await (await w.fetch('../docs/TRACEABILITY.md', { cache: 'no-store' })).text();
    const heads = md.split('\n').filter(l => /^## /.test(l)), WN = ev('WHATSNEW');
    eq(WN.streams.length, heads.length, 'one stream per "## " section');
    const keys = heads.map(h => (h.match(/^## ([A-Z]\d+)\b/) || [])[1] || '');
    eq(WN.streams.map(s => s.k).join(','), keys.join(','), 'stream keys in document order');
    assert(WN.streams.some(s => s.k === 'S2' && s.frs.includes('FR-223')), 'this stream (S2) is listed with its FRs');
    assert(WN.releases.some(r => r.v === 'next') && WN.releases.some(r => r.v === '6.2.0'), 'releases present');
    WN.streams.forEach(s => assert(WN.releases.some(r => r.v === s.v), s.k + ' points to an unknown release ' + s.v));
    eq(WN.streams.find(s => s.k === 'P1').v, '6.2.0'); eq(WN.streams.find(s => s.k === 'W1').v, '6.1.0');
    assert(WN.streams.find(s => s.k === 'W1').rows > 10, 'row count parsed from the table');
  });
  for (const lang of LANGS) {
    await group('S2 FR-223 What\'s new panel: sidebar link opens it, versions with streams, link to versions.html, UI language · ' + lang.toUpperCase(), lang, async (g, ev, w) => {
      try { w.localStorage.removeItem('kokzhol.v6.whatsnew.seen'); } catch (_) { /* storage blocked */ }
      ev('render()');
      const link = w.document.querySelector('.sidebar .ver [data-act="whatsNew"]'); assert(link, 'link next to the version');
      assert(link.querySelector('.wn-dot'), 'unseen dot before the first visit');
      link.click();
      const d = w.document.querySelector('.drawer'); assert(d, 'drawer opened');
      const WN = ev('WHATSNEW'), cur = ev('VERSION');
      eq(d.querySelectorAll('[data-wn-rel]').length, WN.releases.length, 'one block per release');
      eq(d.querySelectorAll('[data-wn-stream]').length, WN.streams.length, 'every stream listed');
      assert(d.querySelector('[data-wn-rel] .chip.green'), 'current version marked');
      assert(d.innerText.includes('v' + cur), 'current version shown');
      const a = d.querySelector('a[data-wn-versions]'); eq(a.getAttribute('href'), '../versions.html', 'linked to versions.html');
      assert(d.querySelector('[data-wn-offline]').textContent.trim().length > 20, 'offline note');
      d.querySelectorAll('[data-wn-stream]').forEach(li => assert(li.textContent.trim().length > 6, 'empty stream ' + li.dataset.wnStream));
      if (lang === 'de' || lang === 'en') { const m = d.innerText.match(/.{0,20}[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі].{0,20}/); assert(!m, 'Cyrillic in ' + lang + ': ' + (m && m[0])); }
      if (lang === 'ru') assert(/Что нового/.test(d.innerText) && /Все версии/.test(d.innerText), 'RU texts');
      if (lang === 'kk') assert(/Не жаңа/.test(d.innerText) && /Барлық нұсқалар/.test(d.innerText), 'KK texts');
      ev('closeDrawer()'); assert(!w.document.querySelector('.sidebar .ver .wn-dot'), 'dot gone after opening');
      clean(w, 'whats new ' + lang); eq(w.__downloads.length, 0, 'nothing downloaded');
    });
  }
  await group('S2 FR-223 deep link ?whatsnew=1 (from versions.html) opens the panel', 'en', async (g, ev, w) => {
    const f = w.frameElement; await new Promise(ok => { f.onload = ok; setTimeout(ok, 15000); f.src = 'en.html?whatsnew=1'; });
    const w2 = f.contentWindow; assert(w2.document.querySelector('.drawer [data-wn-rel]'), 'panel open after the deep link');
    assert(!S2_CYR.test(w2.document.querySelector('.drawer').innerText), 'EN without Cyrillic');
  });

  await group('S2 FR-224 print: A4 page, print-only header, navigation hidden, drawer printed alone, print button calls window.print', 'de', async (g, ev, w) => {
    const css = [...w.document.querySelectorAll('style')].map(s => s.textContent).join('\n');
    assert(/@page\s*\{\s*size:\s*A4/.test(css), '@page A4');
    const pm = css.slice(css.indexOf('S2 · FR-224'));
    ['.sidebar', '.topbar', '.pill-tabs', '.btn', '.bottombar', 'thead{display:table-header-group}', 'break-inside:avoid', 'break-after:avoid', '.app:has(.drawer.open) main'].forEach(k => assert(pm.includes(k), 'print rule for ' + k));
    let printed = 0; w.print = () => { printed++; };
    ev("ACT.setRole({v:'admin'});go('reports')");
    const ph = w.document.querySelector('main .print-head'); assert(ph, 'print header in main');
    eq(w.getComputedStyle(ph).display, 'none', 'header hidden on screen');
    assert(ph.innerText.includes(ev('SCREENS.reports.title()')) && ph.innerText.includes('v' + ev('VERSION')) && /Gedruckt/.test(ph.textContent), 'header: screen, version, date label');
    assert(!S2_CYR.test(ph.textContent), 'DE header without Cyrillic');
    const btn = w.document.querySelector('.topbar [data-act="printPage"]'); assert(btn && btn.getAttribute('aria-label'), 'print button with label');
    btn.click(); eq(printed, 1, 'window.print called'); eq(w.__downloads.length, 0, 'no download');
    ev("setTab('reports', tabsOf('reports')[1].key)"); assert(w.document.querySelector('.print-head').innerText.includes(ev("tabsOf('reports')[1].label")), 'tab in the header');
    clean(w, 'print');
  });
  await group('S2 FR-224 stand-alone documents (KZ document PDF, booking offer) carry the A4 sheet style and header', 'en', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'})");
    ev("ACT.dkPdf({id:S.loads[0].id,k:Object.keys(KDOC)[0]})");
    const d1 = w.__downloads[w.__downloads.length - 1]; assert(d1 && /^blob:/.test(d1.href), 'document opened as blob (intercepted)');
    const t1 = await (await w.fetch(d1.href)).text();
    assert(/@page\{size:A4/.test(t1) && /class="doc-head"/.test(t1), 'KZ document: A4 + header');
    assert(!S2_CYR.test(t1.match(/<div class="doc-head">[\s\S]*?<\/div>/)[0]), 'EN header without Cyrillic');
    const n0 = w.__downloads.length; ev("ACT.bkPrint({id:S.bookings[0].id,v:'offer'})"); eq(w.__downloads.length, n0 + 1, 'offer recorded as download');
    const t2 = await (await w.fetch(w.__downloads[n0].href)).text();
    assert(/@page\{size:A4/.test(t2) && /class="doc-head"/.test(t2), 'offer: A4 + header');
    clean(w, 'documents');
  });

  await group('S2 FR-225 offline: sw.js has a versioned cache, precaches the four pages and assets, never tests.html', 'ru', async (g, ev, w) => {
    const src = await (await w.fetch('sw.js', { cache: 'no-store' })).text(), v = ev('VERSION');
    const cache = (src.match(/const CACHE = "([^"]+)"/) || [])[1]; assert(cache && cache.startsWith('kokzhol-v6-' + v + '-') && /-[0-9a-f]{8}$/.test(cache), 'versioned cache name: ' + cache);
    const pre = JSON.parse(src.match(/const PRECACHE = (\[.*\]);/)[1]);
    ['index.html', 'de.html', 'en.html', 'kk.html', 'assets/brand/kokzhol-mark-on-ink.svg', 'assets/manufacturers/roche.webp'].forEach(p => assert(pre.includes(p), 'precached: ' + p));
    assert(!pre.some(p => /tests\.html|legacy\/|\.png$/.test(p)), 'tests, legacy and PNG fallbacks not precached');
    /* run the worker in a stub scope: which requests does it answer? */
    const L = {}, put = [], self = { location: new URL('sw.js', w.location.href), addEventListener: (t, f) => { L[t] = f; }, skipWaiting: () => {}, clients: { claim: () => {} } };
    const caches = { open: () => Promise.resolve({ addAll: () => Promise.resolve(), put: (k) => { put.push(k); } }), keys: () => Promise.resolve([]), match: () => Promise.resolve(null), delete: () => Promise.resolve(true) };
    new Function('self', 'caches', 'fetch', src)(self, caches, () => Promise.resolve(new Response('x')));
    assert(L.install && L.activate && L.fetch, 'install / activate / fetch handlers');
    const answers = (url, o) => { let r = false; L.fetch({ request: Object.assign({ url: new URL(url, w.location.href).href, method: 'GET', mode: 'no-cors', referrer: '' }, o || {}), respondWith: () => { r = true; } }); return r; };
    assert(answers('index.html', { mode: 'navigate' }), 'page answered (network first)');
    assert(answers('assets/brand/kokzhol-mark.svg'), 'asset answered (cache first)');
    assert(!answers('tests.html', { mode: 'navigate' }), 'tests.html untouched');
    assert(!answers('index.html', { mode: 'navigate', referrer: new URL('tests.html', w.location.href).href }), 'test harness iframes untouched');
    assert(!answers('index.html?nosw=1', { mode: 'navigate' }), '?nosw bypass');
    assert(!answers('index.html', { method: 'POST' }), 'non-GET untouched');
    assert(!answers('https://example.com/x.js'), 'other origins untouched');
    assert(!answers('../versions.html', { mode: 'navigate' }), 'outside the platform scope untouched');
  });
  await group('S2 FR-225 registration policy: not in test iframes, not on localhost (python -m http.server) unless ?sw=1, not on tests.html', 'ru', async (g, ev, w) => {
    eq(ev('SW_STATE.why'), 'frame', 'test iframe never registers');
    const why = (href, framed) => ev(`(() => { const u = new URL(${JSON.stringify(href)}); return swWhy(u, ${!!framed}, { serviceWorker: {} }); })()`);
    eq(why('http://localhost:8871/platform/index.html'), 'dev'); eq(why('http://127.0.0.1:8871/platform/de.html'), 'dev');
    eq(why('http://localhost:8871/platform/index.html?sw=1'), '', '?sw=1 opts in on localhost');
    eq(why('https://example.github.io/repo/platform/en.html'), '', 'GitHub Pages registers');
    eq(why('https://example.github.io/repo/platform/tests.html'), 'tests');
    eq(why('https://example.github.io/repo/platform/en.html', true), 'frame');
    eq(ev('swWhy(location, false, {})'), 'unsupported');
  });
