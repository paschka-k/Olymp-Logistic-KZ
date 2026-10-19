  /* ---- P3 weather: horizon 3 / 7, stale warning + refresh, sources card, city card, West cities (0.3.10 screen 06, FR-16/42/106) ---- */
  await group('P3 weather: grid has hubs + West cities, horizon 3 / 7 switches the columns', 'ru', async (g, ev, w) => {
    ev("go('routes');ACT.stab({s:'routes',v:'wx'})"); clean(w, 'wx');
    const rows = w.document.querySelectorAll('#wx_grid tbody tr'); eq(rows.length, 10, '5 hubs + 5 West cities'); for (const k of ['ATY', 'KOS', 'AKT', 'KHR', 'ORA', 'AKU']) assert(w.document.querySelector(`[data-wx-city="${k}"]`), k + ' row');
    eq(w.document.querySelectorAll('#wx_grid thead th').length, 8, '7 day columns'); ev("ACT.wxN({v:'3'})"); eq(w.document.querySelectorAll('#wx_grid thead th').length, 4, '3 day columns'); eq(ev('S.wx.n'), 3);
    assert(w.document.querySelectorAll('[data-wx-card] .prm').length === 3, 'city card follows the horizon'); ev("ACT.wxN({v:'7'})");
  });
  await group('P3 weather: stale forecast warning disappears after Refresh (audited); city card follows the selection', 'ru', async (g, ev, w) => {
    ev("go('routes');ACT.stab({s:'routes',v:'wx'})"); assert(ev('WEATHER.stale()'), 'stale at start (imported 08:00, clock 14:32)'); assert(w.document.querySelector('[data-wx-stale]'), 'warning shown');
    assert(w.document.querySelector('[data-wx-sources] [data-act=wxRefresh]'), 'refresh button'); ev('ACT.wxRefresh()'); assert(!ev('WEATHER.stale()'), 'fresh'); assert(!w.document.querySelector('[data-wx-stale]'), 'warning gone'); assert(ev("S.audit.some(a=>a.module==='Weather')"), 'audited');
    assert(w.document.querySelectorAll('[data-wx-sources] .prm').length >= 3, 'three sources'); ev("ACT.wxCity({id:'AKU'})"); eq(ev('S.wx.sel'), 'AKU'); assert(w.document.querySelector('[data-wx-card]').innerText.includes(ev("WEATHER.cityName('AKU')")), 'city card');
    assert(w.document.querySelectorAll('[data-act=liftClose]').length === 2, 'closures kept'); assert(w.document.querySelector('main').innerText.includes('LD-2026-001847'), 'risk list kept');
  });
  await group('P3: weather tab renders in 4 languages, DE/EN without Cyrillic', 'ru', async (g, ev) => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { gg.ev("go('routes');ACT.stab({s:'routes',v:'wx'})"); clean(gg.w, lang + ' routes/wx');
      if (lang === 'de' || lang === 'en') { const txt = gg.ev("document.querySelector('.content').innerText"); const cyr = txt.match(/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІі]+/g) || []; assert(!cyr.length, lang + ' Cyrillic: ' + cyr.slice(0, 5)); } } finally { gg.done(); } }
  });
