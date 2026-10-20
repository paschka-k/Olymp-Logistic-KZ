  /* ---- R6 · 0.3.9 parity, shell: «Навигация» / «Навигация DE / EN» (1–18, 318–351: every screen opens, title = menu item),
     «Иконки навигации» (728), «Поиск» (175–199: PO, PL, SSCC and every article of the current loads), FR-81/82 read-only roles ---- */
  for (const lang of LANGS) await group('[' + lang + '] navigation: every menu item opens its screen, the page title and the breadcrumb name the menu item, the item is marked current (0.3.9 «Навигация»)', lang, async (g, ev, w) => {
    const d = w.document, items = ev('navItems().map(n => [n[0], n[2]])');
    eq(items.length, 13, 'menu items');
    for (const [id, label] of items) {
      ev(`go('${id}')`); eq(ev('S.route'), id, id + ' opens');
      const t = d.querySelector('.page-title'); assert(t, id + ': page title');
      eq(t.textContent.trim(), label, id + ': title = menu item');
      assert(d.querySelector('.crumb b').textContent.trim() === label, id + ': breadcrumb');
      const cur = d.querySelector('.nav-item[aria-current="page"]'); assert(cur && cur.dataset.v === id, id + ': aria-current on the menu item');
      eq(d.querySelectorAll('.nav-item[aria-current]').length, 1, id + ': one current item');
    }
    if (lang === 'de' || lang === 'en') assert(!/[А-Яа-яЁё]/.test(items.map(x => x[1]).join(' ')), 'menu labels without Cyrillic');
    clean(w, 'navigation ' + lang);
  });
  await group('navigation icons: every menu item and portal link carries an SVG glyph and a plain label; both designs (0.3.9 «Иконки навигации»)', 'ru', async (g, ev, w) => {
    for (const des of ['kokzhol', 'olymp']) {
      ev(`S.design = '${des}'; render()`);
      const items = [...w.document.querySelectorAll('.sidebar .nav-item')];
      eq(items.length, 13, des + ': items');
      for (const it of items) {
        const svg = it.querySelector('svg'); assert(svg && svg.querySelector('path,circle,rect,polyline,line'), des + ': no glyph on ' + it.dataset.v);
        const txt = it.querySelector('span').textContent.trim(); assert(txt.length >= 3 && !/^[\d\s\p{P}\p{S}]/u.test(txt), des + ': label "' + txt + '"');
      }
      w.document.querySelectorAll('.side-link').forEach(a => assert(a.querySelector('svg') && a.textContent.trim().length > 3, des + ': portal link ' + a.textContent));
    }
  });
  await group('search: every article of every current load is found and points to its load and order; PO finds the load, PL lists all places of the packing list, SSCC opens the place (0.3.9 «Поиск»)', 'ru', async (g, ev, w) => {
    const rows = ev(`(() => { const out = []; S.loads.filter(l => l.status !== 'delivered').forEach(l => ops(l).orders.forEach(o => o.lines.forEach(x => out.push({ l: l.id, o: o.id, art: x.art })))); return out; })()`);
    assert(rows.length >= 15, 'lines ' + rows.length);
    for (const r of rows) {
      const hit = ev(`(S.gs.q = ${JSON.stringify(r.art)}, gsResults().L.filter(x => x.kind === 'line' && x.hit === ${JSON.stringify(r.art)}).map(x => x.load + '|' + x.order))`);
      assert(hit.includes(r.l + '|' + r.o), r.art + ': no hit for ' + r.o + ' on ' + r.l);
    }
    const l = ev("S.loads.find(l => l.status !== 'delivered' && ops(l).orders.length > 1).id");
    const o = ev(`ops(load('${l}')).orders[0]`);
    const byPo = ev(`(S.gs.q = '${o.po}', gsResults().all.map(x => x.load || x.id))`); assert(byPo.includes(l), 'PO ' + o.po + ' → ' + l);
    const byPl = ev(`(S.gs.q = '${o.pl}', gsResults().L.filter(x => x.what === 'PL' && x.exact).map(x => x.order))`); assert(byPl.includes(o.id), 'PL ' + o.pl + ' → order ' + o.id);
    ev('S.gs.q = ""'); ev(`gsInput('${o.pl}')`); ev('gsEnter()'); const shown = w.document.querySelector('#main-content').innerText;
    const want = o.places.map(p => p.sscc); assert(want.every(s => shown.includes(s) || shown.includes(s.slice(-8))), 'the packing list opens with all ' + want.length + ' places');
    ev('S.gs.q = ""'); ev("go('dashboard')"); ev(`gsInput('${want[0]}')`); ev('gsEnter()');
    eq(ev('S.route'), 'orders', 'SSCC opens Orders'); assert(w.document.querySelector('#main-content').innerText.includes(want[0]), 'label of the place shown');
    clean(w, 'search');
  });
  await group('roles: read-only roles see data but no write actions; the driver only reaches the driver shell and help (0.3.9 FR-81 / FR-82 / FR-137)', 'ru', async (g, ev, w) => {
    for (const role of ['auditor', 'viewer']) {
      ev(`ACT.setRole({v:'${role}'})`);
      for (const p of ['orders:write', 'trips:write', 'fleet:write', 'drivers:write', 'approvals:sign', 'users:admin']) assert(!ev(`canDo('${p}')`), role + ' must not have ' + p);
      ev("go('orders')"); assert(!w.document.querySelector('.page-head [data-act="create"], .page-head [data-act="imp"]'), role + ': no "Create load" / import in the header');
      ev("go('dispatch')"); assert(!w.document.querySelector('[data-act="auto"]'), role + ': no auto-assign');
      /* a stale button (e.g. from a cached page) is refused at the click as well */
      const n = ev('S.loads.length'), u = ev("S.loads.filter(l => l.status === 'unassigned').length"), b = w.document.createElement('button'); b.dataset.act = 'auto'; w.document.querySelector('#main-content').appendChild(b); b.click();
      assert(w.document.querySelector('.toast.err'), role + ': refusal toast'); eq(ev('S.loads.length'), n, role + ': nothing created'); eq(ev("S.loads.filter(l => l.status === 'unassigned').length"), u, role + ': nothing assigned');
    }
    ev("ACT.setRole({v:'auditor'})"); assert(ev("canDo('audit:read')"), 'auditor reads the audit log');
    ev("ACT.setRole({v:'driver'})"); const nav = ev('navItems().map(n => n[0])');
    assert(nav.length <= 3 && nav.includes('help'), 'driver shell: ' + nav);
    for (const s of ['dispatch', 'fleet', 'billing', 'settings']) { ev(`go('${s}')`); assert(ev('S.route') !== s, 'driver must not open ' + s); }
    assert(ev("canDo('driver:app')") && !ev("ROLE_PERMS.admin.includes('driver:app')"), 'driver:app only for the driver role (FR-83)');
    ev("ACT.setRole({v:'admin'})"); clean(w, 'roles');
  });
  await group('[kk] Kazakh UI: menu labels are Kazakh (not the Russian ones), every screen and tab shows Kazakh-specific letters, titles follow the menu (0.3.9 FR-170 KK 673–675)', 'kk', async (g, ev, w) => {
    const ru = await fresh('ru'); let ruLabels; try { ruLabels = ru.ev('NAV.map(n => n[2])'); } finally { ru.done(); }
    const kk = ev('NAV.map(n => n[2])'); eq(kk.length, ruLabels.length, 'menu size');
    const same = kk.filter((x, i) => x === ruLabels[i]); assert(same.length <= 2, 'menu labels left in Russian: ' + same.join(', '));   // «Автопарк» is the same word in both
    const KZ = /[ӘәҒғҚқҢңӨөҰұҮүҺһІі]/, bad = [];
    for (const id of ev('navItems().map(n => n[0])')) {
      ev(`go('${id}')`); const tabs = ev(`tabsOf('${id}').map(t => t.key)`);
      for (const t of (tabs.length ? tabs : [null])) { if (t) ev(`setTab('${id}','${t}')`); if (!KZ.test(w.document.querySelector('#main-content').innerText)) bad.push(id + (t ? '/' + t : '')); }
    }
    assert(!bad.length, 'screens without Kazakh text: ' + bad.join(', '));
    clean(w, 'kk');
  });
