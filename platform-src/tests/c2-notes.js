  /* ---- Q3 explanatory notes parity with 0.3.10: every ported note renders in its place (data-note) in 4 languages; DE / EN without Cyrillic ---- */
  const Q3_TAB = (s, t) => `ACT.setRole({v:'admin'});go('${s}');ACT.stab({s:'${s}',v:'${t}'})`;
  const Q3_NOTES = [
    ['third', Q3_TAB('orders', 'loadw')], ['axle', Q3_TAB('orders', 'loadw')], ['trailers', Q3_TAB('orders', 'loadw')],
    ['track', Q3_TAB('orders', 'ship')], ['gate', Q3_TAB('orders', 'docs')], ['gonogo', Q3_TAB('orders', 'docs')],
    ['tariff', Q3_TAB('orders', 'bookings')], ['leadHint', Q3_TAB('orders', 'commercial') + ";ACT.cmSec({v:'crm'})"],
    ['bookTerms', "ACT.setRole({v:'customer'});S.custId='c2';go('book')"],
    ['tiers', Q3_TAB('dispatch', 'partners')], ['handover', Q3_TAB('dispatch', 'partners')],
    ['fees', Q3_TAB('fleet', 'fleet')], ['west', Q3_TAB('fleet', 'fleet')],
    ['urgent', Q3_TAB('drivers', 'staff')], ['pdNote', Q3_TAB('drivers', 'drivers') + ";openDrawer({type:'driver',id:S.drivers[0].id})"], ['drvOnly', Q3_TAB('drivers', 'app')],
    ['twolevel', Q3_TAB('routes', 'temp')], ['sim', Q3_TAB('routes', 'temp')], ['wxrisk', Q3_TAB('routes', 'wx')], ['escal', Q3_TAB('routes', 'sec')],
    ['covSchem', Q3_TAB('routes', 'coverage')], ['thChron', Q3_TAB('routes', 'thermochron')],
    ['capa', Q3_TAB('pod', 'quality')], ['costExcl', Q3_TAB('billing', 'model')], ['fineLink', Q3_TAB('reports', 'fines')], ['mdVerified', Q3_TAB('settings', 'ref')],
    ['ibDwell', Q3_TAB('hubs', 'inbound')], ['ibSlot', Q3_TAB('hubs', 'slots')], ['ibPre', Q3_TAB('hubs', 'pre')], ['ibDem', Q3_TAB('hubs', 'dem')], ['ibGate', Q3_TAB('hubs', 'inbound') + ";openDrawer({type:'ibGate',id:'IN-0614'})"],
  ];
  const Q3_CYR = /[Ѐ-ӿ]/;
  await group('notes: every key in NOTES has RU / DE / EN / KK text, DE and EN without Cyrillic, and is placed on a screen', 'ru', async (g, ev) => {
    const keys = ev('Object.keys(NOTES)');
    eq(keys.slice().sort().join(','), Q3_NOTES.map(n => n[0]).sort().join(','), 'every note in NOTES is checked by this suite');
    const bad = ev('Object.keys(NOTES).filter(k => NOTES[k].length !== 4 || NOTES[k].some(s => !s || s.length < 20 && k !== "pdNote"))'); assert(!bad.length, 'incomplete texts: ' + bad);
    const cyr = ev(`Object.keys(NOTES).filter(k => ${Q3_CYR}.test(NOTES[k][1]) || ${Q3_CYR}.test(NOTES[k][2]))`); assert(!cyr.length, 'Cyrillic in DE / EN: ' + cyr);
    assert(ev("howNote('nope') === '' && /data-note=\"axle\"/.test(howNote('axle'))"), 'howNote renders <p class=note data-note> and ignores unknown keys');
  });
  for (const lang of LANGS) {
    await group('notes: all ' + Q3_NOTES.length + ' ported 0.3.10 notes render in place · ' + lang.toUpperCase(), lang, async (g, ev, w) => {
      const miss = [];
      for (const [k, setup] of Q3_NOTES) {
        ev(setup); const el = w.document.querySelector(`[data-note="${k}"]`);
        if (!el) { miss.push(k); continue; }
        const txt = el.textContent.trim(); assert(txt.length > 10, k + ' is empty');
        if (lang === 'de' || lang === 'en') assert(!Q3_CYR.test(txt), k + ' has Cyrillic in ' + lang + ': ' + txt.slice(0, 60));
      }
      assert(!miss.length, 'not rendered: ' + miss.join(', ')); clean(w, lang + ' notes');
    });
  }
