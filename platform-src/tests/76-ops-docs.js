  /* ---- P2: Documents KZ — full 0.3.10 set, "Generate all", gate 9 + 2, "Clear without weather forecast" ---- */
  await group('Documents KZ: 12 document types in the catalogue; the set follows the load (third-party, ADR, partner handover)', 'ru', async (g, ev, w) => {
    const keys = ev("Object.keys(KDOC)"); for (const k of ['order', 'waybill', 'ttn', 'transfer', 'temp', 'reg', 'contract', 'esf', 'snt', 'adrdoc', 'adrinst', 'adrcert', 'ho', 'hottn', 'epod']) assert(keys.includes(k), 'type ' + k);
    const base = ev("docSet(load('LD-2026-001851')).map(d => d.k)"); for (const k of ['order', 'waybill', 'ttn', 'transfer', 'temp', 'reg', 'esf', 'snt']) assert(base.includes(k), 'base ' + k); assert(!base.includes('adrdoc'), 'no ADR docs without dangerous goods');
    const fr = ev("docSet(load('LD-2026-001850')).map(d => d.k)"); assert(fr.includes('adrdoc') && fr.includes('adrinst') && fr.includes('adrcert'), 'frozen load with dry ice has ADR documents'); assert(base.length >= 8 && base.length <= 12, 'set size ' + base.length);
  });
  await group('Documents KZ: generate → PDF → sign → IS ESF per row, signature only where the type needs it, "Generate all"', 'ru', async (g, ev, w) => {
    ev("S.ops.docSel = 'LD-2026-001851'; go('orders'); ACT.stab({s:'orders',v:'docs'})"); const d = w.document; assert(d.querySelectorAll('[data-doc]').length >= 8, 'rows');
    eq(ev("ops(load('LD-2026-001851')).kdocs.reg"), 'ready', 'E-11: the pre-trip set is ready as soon as the load has a crew'); eq(ev("ops(load('LD-2026-001851')).kdocs.order"), 'signed', 'E-11: the order is ready and signed'); d.querySelector('[data-act=dkGen][data-k=transfer]').click(); eq(ev("ops(load('LD-2026-001851')).kdocs.transfer"), 'ready'); assert(d.querySelector('[data-act=dkPdf][data-k=transfer]') && d.querySelector('[data-act=dkSign][data-k=transfer]'), 'PDF + sign for the transfer note'); assert(!d.querySelector('[data-act=dkSign][data-k=reg]'), 'copies of certificates need no signature');
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

  /* ---- operations parity pass: E-4 / E-25 / E-42 permission gates, E-44 critical alarm withdraws the release, E-6 rejection ---- */
  await group('parity pass: documents and release need documents:sign, a critical alarm withdraws the release with its id, a state system can reject an ESF', 'en', async (g, ev) => {
    const L = 'LD-2026-001851';
    ev("ACT.setRole({v:'warehouse'})"); assert(/documents:sign/.test(ev("docGen('" + L + "', 'transfer')")), 'E-4: generate needs documents:sign'); assert(/documents:sign/.test(ev("docSend('" + L + "', 'ttn')")), 'E-4: send needs documents:sign'); ev("ACT.setRole({v:'admin'})");
    ev("ops(load('" + L + "')).released = { by: 'test', t: '08:00', override: false }"); ev("raiseAlarm({ lvl: 2, cat: 'door', src: 'wialon', hub: 'AST', load: '" + L + "', truck: 't4', text: 'level 2' })"); assert(ev("released(load('" + L + "'))"), 'a level-2 alarm keeps the release');
    ev("raiseAlarm({ lvl: 3, cat: 'temperature', src: 'wialon', hub: 'AST', load: '" + L + "', truck: 't4', text: 'level 3' })"); assert(!ev("released(load('" + L + "'))") && ev("ops(load('" + L + "')).revoked.why") === 'alarm' && /^ALM-/.test(ev("ops(load('" + L + "')).revoked.alarm")), 'E-44: a critical alarm withdraws the release, reason alarm + id');
    ev("cust('c1').bin = '12'; ops(load('LD-2026-001841')).kdocs.esf = 'sent'"); eq(ev("docPoll('LD-2026-001841')"), 0); eq(ev("ops(load('LD-2026-001841')).kdocs.esf"), 'rejected', 'E-6: an ESF with an invalid BIN is rejected'); assert(ev("ops(load('LD-2026-001841')).inbox.some(x => x.lvl === 3)"), 'E-6: level-3 hint');
  });
