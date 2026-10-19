  /* ---- foundation: roles, tabs API, help, design switch, version, skip link ---- */
  await group('roles: admin sees 12 items, shells for customer / partner / driver, access refused', 'ru', async (g, ev, w) => {
    eq(ev('ROLES.length'), 11, 'roles'); eq(ev('navItems().length'), 12, 'admin menu');
    for (const r of ['customer', 'partner', 'driver']) { ev(`ACT.setRole({v:'${r}'})`); assert(ev('navItems().every(n=>n[0]==="help"||SHELL_NAV[S.role].some(m=>m[0]===n[0]))'), r + ' menu'); assert(!ev("canSee('billing')"), r + ' must not see billing'); clean(w, 'role ' + r); }
    ev("ACT.setRole({v:'admin'})"); ev("go('billing')"); eq(ev('S.route'), 'billing'); ev("ACT.setRole({v:'customer'})"); ev("go('billing')"); assert(ev('S.route') !== 'billing', 'customer opened billing');
    for (const r of ev('ROLES')) { ev(`ACT.setRole({v:'${r}'})`); assert(ev('navItems().length') >= 1, r + ' has no menu'); assert(ev('canSee(S.route)'), r + ' stays on a forbidden route'); clean(w, 'role ' + r); }
  });
  await group('roles: permissions follow the platform matrix', 'ru', async (g, ev) => { assert(ev("ROLE_PERMS.admin.includes('users:admin')"), 'admin'); assert(!ev("ROLE_PERMS.viewer.includes('users:admin')"), 'viewer admin'); assert(ev("ROLE_PERMS.customer.includes('portal')"), 'customer portal'); assert(ev("ROLE_PERMS.driver.includes('driver:app')"), 'driver app'); });
  await group('tabs API: addTab registers, perm hides, tab bar and badge render', 'ru', async (g, ev, w) => {
    ev("addTab('reports','t_ok','Tab OK',()=>'<p id=\"t_ok\">ok</p>',{badge:()=>3});addTab('reports','t_no','Tab NO',()=>'<p id=\"t_no\">no</p>',{perm:'users:admin'})");
    ev("go('reports')"); assert(w.document.querySelector('[data-s=reports][data-v=t_ok] .n'), 'badge'); ev("ACT.stab({s:'reports',v:'t_ok'})"); assert(w.document.querySelector('#t_ok'), 'tab body');
    assert(w.document.querySelector('[data-v=t_no]'), 'admin sees perm tab'); ev("ACT.setRole({v:'viewer'});go('reports')"); assert(!w.document.querySelector('[data-v=t_no]'), 'viewer sees admin tab');
  });
  await group('help: opens from the top bar, searches, links to screens, roles matrix', 'ru', async (g, ev, w) => {
    ev("go('dashboard')"); w.document.querySelector('[data-act=helpHere]').click(); eq(ev('S.route'), 'help'); assert(w.document.querySelector('.help-art h2'), 'article'); assert(ev('HELP.articles.length') >= 2, 'articles');
    ev("ACT.helpGo({k:'roles'})"); assert(w.document.querySelector('.help-art table'), 'roles matrix'); const q = w.document.querySelector('#hq'); q.value = 'zzzz-no-hit'; q.dispatchEvent(new w.Event('input', { bubbles: true })); assert(/Ничего не найдено/.test(w.document.querySelector('.help-nav').innerText), 'empty search');
  });
  await group('help: every article of every language is complete and DE/EN have no Cyrillic', 'ru', async (g, ev) => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { const bad = gg.ev(`HELP.articles.filter(a=>!tx(a.title)||!tx(a.purpose)).map(a=>a.key)`); assert(!bad.length, lang + ' incomplete: ' + bad); if (lang === 'de' || lang === 'en') { const cyr = gg.ev(`HELP.articles.filter(a=>/[А-Яа-яЁё]/.test([tx(a.title),tx(a.sub),tx(a.purpose),tx(a.who),(a.see||[]).map(tx).join(),(a.rules||[]).map(tx).join(),(a.howto||[]).map(h=>tx(h.t)+h.steps.map(tx).join()).join()].join(' '))).map(a=>a.key)`); assert(!cyr.length, lang + ' Cyrillic in: ' + cyr); } } finally { gg.done(); } }
  });
  await group('design switch Olymp / Kökzhol, version block, skip link', 'ru', async (g, ev, w) => {
    eq(w.document.documentElement.dataset.design, 'kokzhol'); ev('ACT.setDesign()'); eq(w.document.documentElement.dataset.design, 'olymp'); ev('ACT.setDesign()'); eq(w.document.documentElement.dataset.design, 'kokzhol');
    assert(new RegExp('v' + ev('VERSION').replace(/\./g, '\\.')).test(w.document.querySelector('.ver').innerText), 'version'); assert(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(w.document.querySelector('.ver').innerText), 'build time'); assert(w.document.querySelector('a.skip') && w.document.getElementById('main-content'), 'skip link target');
  });
