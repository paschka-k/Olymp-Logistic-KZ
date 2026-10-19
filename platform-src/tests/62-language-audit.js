  /* ---- Q2 language audit: the DE / EN UI shows no Cyrillic — visible text and title / placeholder / aria-label / alt across
     every screen × tab (admin + the driver / customer / partner shells), the load drawer (all tabs) and the main drawers ---- */
  const langAudit = (ev, w) => {
    const CYR = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/, hits = new Map();
    const scan = where => {
      const root = w.document.querySelector('#root'), it = w.document.createTreeWalker(root, w.NodeFilter.SHOW_TEXT);
      for (let n = it.nextNode(); n; n = it.nextNode()) { const p = n.parentElement; if (p && /^(SCRIPT|STYLE)$/.test(p.tagName)) continue; const s = n.nodeValue.trim(); if (CYR.test(s) && !hits.has(s)) hits.set(s, where); }
      root.querySelectorAll('[title],[placeholder],[aria-label],[alt]').forEach(e => ['title', 'placeholder', 'aria-label', 'alt'].forEach(a => { const s = (e.getAttribute(a) || '').trim(); if (CYR.test(s) && !hits.has('@' + a + ': ' + s)) hits.set('@' + a + ': ' + s, where); }));
    };
    const walk = (ids, pre) => ids.forEach(id => {
      try { ev(`go(${JSON.stringify(id)})`); } catch (e) { return; }
      if (ev('S.route') !== id) return;
      const tabs = ev(`tabsOf(${JSON.stringify(id)}).map(t=>t.key)`);
      if (!tabs.length) scan(pre + id);
      tabs.forEach(k => { ev(`setTab(${JSON.stringify(id)},${JSON.stringify(k)})`); scan(pre + id + '/' + k); });
    });
    const drawer = (spec, where) => {
      try { ev(`openDrawer(${spec})`); } catch (e) { return; }
      if (!w.document.querySelector('.drawer')) return;
      scan(where);
      const tabs = [...w.document.querySelectorAll('.drawer [data-act="tab"]')].map(e => e.dataset.v);
      tabs.forEach(v => { try { ev(`S.drawer.tab=${JSON.stringify(v)};render()`); scan(where + '/' + v); } catch (e) { /* tab needs more state */ } });
      ev('closeDrawer()');
    };
    walk(ev('Object.keys(SCREENS)'), '');
    ev('go("orders")');
    ev('S.loads.map(l=>l.id)').forEach(id => drawer(`{type:'load',id:'${id}',tab:'overview'}`, 'load ' + id));
    const first = (arr, key) => { try { return ev(`(${arr}||[]).length ? (${arr})[0].${key || 'id'} : null`); } catch (e) { return null; } };
    [['driver', 'S.drivers'], ['truck', 'S.trucks'], ['regTruck', 'S.trucks'], ['route', 'S.routes'], ['job', 'S.jobs'], ['pod', 'S.loads.filter(l=>l.status==="delivered")'], ['inv', 'S.invoices'], ['alarm', 'S.alarms'], ['booking', 'S.bookings'], ['claim', 'S.claims'], ['pcontact', 'S.partners']]
      .forEach(([t, arr]) => { const id = first(arr); if (id != null) drawer(`{type:'${t}',id:${JSON.stringify(id)}}`, 'drawer ' + t); });
    ev('Object.keys(S.hubs)').forEach(h => drawer(`{type:'hub',id:'${h}',tab:'overview'}`, 'drawer hub ' + h));
    const u = first('S.users', 'username'); if (u) drawer(`{type:'user',id:${JSON.stringify(u)}}`, 'drawer user');
    ['create', 'addTruck', 'addDriver', 'newInv', 'cost', 'alarmNew', 'inboxNew', 'claimNew', 'userNew', 'oncallNew', 'keyNew', 'hookNew', 'repCustom'].forEach(t => drawer(`{type:'${t}'}`, 'drawer ' + t));
    ['otif', 'exc', 'drv', 'rev', 'mrg', 'acc'].forEach(r => drawer(`{type:'rep',id:'${r}'}`, 'report ' + r));
    for (const role of ['driver', 'customer', 'partner', 'dispatcher', 'finance']) { ev(`ACT.setRole({v:'${role}'})`); walk([ev('S.route')].concat(ev(`(SHELL_NAV['${role}']||[]).map(n=>n[0])`)), role + ':'); }
    return [...hits].map(([s, where]) => where + ' → ' + s.slice(0, 90));
  };
  for (const lang of ['de', 'en']) await group('[' + lang + '] language audit: no Cyrillic in any screen, tab or drawer', lang, async (g, ev, w) => {
    const bad = langAudit(ev, w); w.__langAudit = bad;
    assert(!bad.length, bad.length + ' Cyrillic fragments: ' + bad.slice(0, 40).join(' | '));
  });
  for (const lang of LANGS) await group('[' + lang + '] names in the UI language: RU / KK keep Cyrillic, DE / EN romanised, address check accepts both', lang, async (g, ev, w) => {
    const lat = lang === 'de' || lang === 'en';
    eq(ev("drv('d1').name"), lat ? 'Yerlan Seitkali' : 'Ерлан Сейтқали', 'driver name'); eq(ev("drv('d1').ini"), lat ? 'YS' : 'ЕС', 'initials');
    eq(ev("cust('c1').name"), lat ? 'Apteka Service LLP' : 'ТОО «Аптека Сервис»', 'customer'); eq(ev("nm('Казгидромет')"), lat ? 'Kazhydromet' : 'Казгидромет', 'agency');
    eq(ev("nm('Ерубаева')"), lat ? 'Yerubayeva' : 'Ерубаева', 'street transliteration');
    eq(ev("addrCheck('AST','ул. Туран','5').st"), 'ok', 'Cyrillic street'); if (lat) { eq(ev("addrCheck('AST','Turan St','5').st"), 'ok', 'romanised street'); eq(ev("addrCheck('AST','Turan','5').street"), 'Turan', 'street shown romanised'); }
    eq(ev("S.inbox.find(m=>m.kind==='weather_warning').src"), lat ? 'Kazhydromet' : 'Казгидромет', 'inbox source');
  });
