  /* ---- P2: Documents KZ — full 0.3.10 set, "Generate all", gate 9 + 2, "Clear without weather forecast" ---- */
  await group('Documents KZ: 12 document types in the catalogue; the set follows the load (third-party, ADR, partner handover)', 'ru', async (g, ev, w) => {
    const keys = ev("Object.keys(KDOC)"); for (const k of ['order', 'waybill', 'ttn', 'transfer', 'temp', 'reg', 'contract', 'esf', 'snt', 'adrdoc', 'adrinst', 'adrcert', 'ho', 'hottn', 'epod']) assert(keys.includes(k), 'type ' + k);
    const base = ev("docSet(load('LD-2026-001851')).map(d => d.k)"); for (const k of ['order', 'waybill', 'ttn', 'transfer', 'temp', 'reg', 'esf', 'snt']) assert(base.includes(k), 'base ' + k); assert(!base.includes('adrdoc'), 'no ADR docs without dangerous goods');
    const fr = ev("docSet(load('LD-2026-001850')).map(d => d.k)"); assert(fr.includes('adrdoc') && fr.includes('adrinst') && fr.includes('adrcert'), 'frozen load with dry ice has ADR documents'); assert(base.length >= 8 && base.length <= 12, 'set size ' + base.length);
  });
  await group('Documents KZ: generate → PDF → sign → IS ESF per row, signature only where the type needs it, "Generate all"', 'ru', async (g, ev, w) => {
    ev("S.ops.docSel = 'LD-2026-001851'; go('orders'); ACT.stab({s:'orders',v:'docs'})"); const d = w.document; assert(d.querySelectorAll('[data-doc]').length >= 8, 'rows');
    d.querySelector('[data-act=dkGen][data-k=order]').click(); eq(ev("ops(load('LD-2026-001851')).kdocs.order"), 'ready'); assert(d.querySelector('[data-act=dkPdf][data-k=order]') && d.querySelector('[data-act=dkSign][data-k=order]'), 'PDF + sign for the order'); d.querySelector('[data-act=dkGen][data-k=reg]').click(); assert(!d.querySelector('[data-act=dkSign][data-k=reg]'), 'copies of certificates need no signature');
    assert(typeof ev("docGen('LD-2026-001851', 'epod')") === 'string', 'ePOD only after delivery'); d.querySelector('[data-act=dkAll]').click(); const left = ev("docSet(load('LD-2026-001851')).filter(x => x.st === 'none' && x.can).length"); eq(left, 0, 'generate all leaves nothing generable');
    ev("ACT.dkSel({id:'LD-2026-001841'})"); eq(ev("docGen('LD-2026-001841', 'epod')"), null, 'ePOD of a delivered, approved trip'); clean(w, 'documents');
  });
  await group('Documents KZ: gate shows 9 + 2 controls; stale forecast blocks until "Clear without weather forecast" (audited, permission)', 'ru', async (g, ev, w) => {
    ev("S.ops.docSel = 'LD-2026-001856'; go('orders'); ACT.stab({s:'orders',v:'docs'})"); const d = w.document; eq(d.querySelectorAll('[data-gate]').length, 9, 'nine'); eq(d.querySelectorAll('[data-gate2]').length, 2, 'plus two');
    const wx = ev("gate(load('LD-2026-001856')).find(x => x.key === 'wx')"); assert(!wx.pass && wx.stale, 'Atyrau forecast is stale → blocked'); const btn = d.querySelector('[data-wx-override]'); assert(btn, 'clear button'); const n0 = ev('S.audit.length'); btn.click();
    assert(ev("gate(load('LD-2026-001856')).find(x => x.key === 'wx').pass"), 'weather control passes after the clearance'); assert(ev('S.audit.length') > n0 && /forecast|прогноз/i.test(ev('S.audit[0].decision') || ev('S.audit[0].text') || JSON.stringify(ev('S.audit[0]'))), 'audited'); assert(!d.querySelector('[data-wx-override]'), 'button gone');
    ev("ACT.setRole({v:'viewer'}); ops(load('LD-2026-001856')).wxOverride = null"); assert(typeof ev("wxOverride('LD-2026-001856')") === 'string', 'needs trips:override_release'); clean(w, 'gate');
  });
  await group('Documents KZ renders the new set in every language without undefined / NaN', 'ru', async () => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { for (const id of ['LD-2026-001850', 'LD-2026-001856', 'LD-2026-001841']) { gg.ev("S.ops.docSel = '" + id + "'; go('orders'); ACT.stab({s:'orders',v:'docs'})"); clean(gg.w, lang + ' documents ' + id); } if (lang === 'de' || lang === 'en') assert(!/[А-Яа-яЁё]/.test([...gg.w.document.querySelectorAll('[data-doc] b, [data-doc] .sub')].map(e => e.innerText).join(' ')), lang + ' Cyrillic in document names'); } finally { gg.done(); } }
  });
