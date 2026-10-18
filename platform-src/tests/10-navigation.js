  /* ---- navigation: 12 items, every screen / tab / drawer renders in all four languages ---- */
  for (const lang of LANGS) await group('[' + lang + '] 12 menu items, every screen renders', lang, async (g, ev, w) => {
    eq(ev('NAV.length'), 12, 'menu items'); eq(w.document.querySelectorAll('.nav-item').length, 12, 'rendered items');
    const ids = ev('NAV.map(n=>n[0])'); const labels = ev('NAV.map(n=>n[2])'); assert(labels.every(Boolean) && new Set(labels).size === 12, 'labels empty or duplicated');
    for (const id of ids) { ev(`go('${id}')`); eq(w.document.querySelector('.nav-item.active').dataset.v, id, 'active item'); assert(!w.document.querySelector('.card-body .note') || !/phase|фазе|Phase/.test(w.document.querySelector('main').innerText.slice(0, 400)), id + ' is still a placeholder'); clean(w, id); }
  });
  for (const lang of LANGS) await group('[' + lang + '] tabs and drawers render', lang, async (g, ev, w) => {
    for (const t of ['board', 'planning', 'partners']) { ev(`go('dispatch');ACT.dtab({v:'${t}'})`); clean(w, 'dispatch/' + t); }
    for (const t of ['map', 'temp', 'wx', 'sec']) { ev(`go('routes');ACT.rtab({v:'${t}'})`); clean(w, 'routes/' + t); }
    for (const t of ['queue', 'quality']) { ev(`go('pod');ACT.podTab({v:'${t}'})`); clean(w, 'pod/' + t); }
    for (const t of ['hubs', 'recv']) { ev(`go('hubs');ACT.htab({v:'${t}'})`); clean(w, 'hubs/' + t); }
    for (const t of ['inv', 'cost']) { ev(`go('billing');ACT.bTab({v:'${t}'})`); clean(w, 'billing/' + t); }
    for (const id of ['otif', 'exc', 'drv', 'rev', 'mrg', 'acc']) { ev(`go('reports');ACT.rOpen({id:'${id}'})`); assert(w.document.querySelector('.drawer.xl'), 'report drawer'); clean(w, 'report ' + id); ev('closeDrawer()'); }
    ev(`ACT.open({id:S.loads[0].id})`); clean(w, 'load drawer'); ev('closeDrawer()');
    ev(`go('settings');ACT.intCfg({i:0})`); clean(w, 'integration drawer');
  });
  await group('language switcher links to all four files', 'ru', async (g, ev, w) => { const hrefs = [...w.document.querySelectorAll('.langs a')].map(a => a.getAttribute('href')); eq(hrefs.join(','), LANGS.map(file).join(','), 'links'); });
