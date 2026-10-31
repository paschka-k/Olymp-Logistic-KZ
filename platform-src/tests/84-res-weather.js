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

  /* ---- operations parity pass: D-61 forecast level rule, D-58 stale forecast in the Go/No-Go gate ---- */
  await group('parity pass: weather level rule of forecast.level() (buran 3, snow 2, frost / wind 1) and the stale forecast in the Go/No-Go gate', 'en', async (g, ev) => {
    const lv = c => ev('WEATHER.risk(' + JSON.stringify(c) + ')');
    eq(lv({ min: -5, max: 2, wind: 5, snow: false }), 1, 'frost'); eq(lv({ min: 3, max: 9, wind: 16, snow: false }), 1, 'wind >= 15'); eq(lv({ min: 1, max: 5, wind: 5, snow: true }), 2, 'snow'); eq(lv({ min: -3, max: 1, wind: 22, snow: true }), 3, 'buran'); eq(lv({ min: -41, max: -30, wind: 3, snow: false }), 3, 'critical cold'); eq(lv({ min: -26, max: -20, wind: 3, snow: false }), 2, 'severe cold'); eq(lv({ min: 5, max: 12, wind: 3, snow: false }), 0, 'calm');
    assert(ev('WEATHER.stale()'), 'stale at the start'); const wx = ev("gate(load('LD-2026-001851')).find(x => x.key === 'wx')"); assert(!wx.pass || /6 h|older than 6/.test(wx.text), 'D-58: a stale forecast is an amber manual decision, not a green gate');
  });
