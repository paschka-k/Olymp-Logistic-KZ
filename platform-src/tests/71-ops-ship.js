  /* ---- W1 operations: Shipments & labels (FR-01..06, 73, 176) ---- */
  await group('scanner search: a GS1-128 scan (AI 00) opens the label of the place, also from the archive (FR-01/02)', 'ru', async (g, ev, w) => {
    ev("go('orders'); ACT.stab({s:'orders',v:'ship'})"); assert(!ev("S.loads.filter(l => (S.ops.shipArch || l.status !== 'delivered')).some(l => l.status === 'delivered')"), 'archive hidden by default');
    const s = ev("opsPlaces(load('LD-2026-001841'))[2].sscc"); const inp = w.document.querySelector('#shipScan'); inp.value = '(00)' + s; inp.dispatchEvent(new w.Event('input', { bubbles: true }));
    eq(ev('S.ops.shipSel'), s, 'place selected'); eq(ev('S.ops.shipLoad'), 'LD-2026-001841', 'load switched'); assert(ev('S.ops.shipArch'), 'archive switched on'); assert(w.document.querySelector(`[data-label="${s}"]`), 'label card shown');
    inp.value = 'EPOD-1841'; inp.dispatchEvent(new w.Event('input', { bubbles: true })); eq(ev('S.ops.shipLoad'), 'LD-2026-001841', 'ePOD search finds the load'); clean(w, 'shipments after scan');
  });
  await group('GS1-128 label: ZPL encodes AI 00 / 02 / 10 / 17, print and export are audited (FR-04)', 'ru', async (g, ev, w) => {
    const s = ev("opsPlaces(load('LD-2026-001847'))[0].sscc"); const z = ev(`shipLabelZpl('LD-2026-001847', '${s}')`); assert(z.includes('^BCN') && z.includes('>80' + s) && /\>810L\d+/.test(z) && /\>817\d{6}/.test(z), 'ZPL with SSCC, LOT and expiry');
    ev("go('orders'); ACT.stab({s:'orders',v:'ship'}); ACT.shSel({id:'LD-2026-001847'})"); ev(`ACT.shPick({s:'${s}'})`); w.document.querySelector('[data-act=shZpl]').click(); assert(w.document.querySelector('[data-zpl]'), 'ZPL shown');
    w.document.querySelector('[data-act=shPrint]').click(); assert(ev("S.audit.some(a => a.decision === 'Print label')"), 'print audited'); assert(w.document.querySelector('[data-label] svg'), 'barcode drawn');
  });
  await group('track & trace per place follows the load; a scan into another trip is an alarm; FEFO marker (FR-03/05)', 'ru', async (g, ev) => {
    const s = ev("opsPlaces(load('LD-2026-001847'))[0].sscc"); const ev1 = ev(`shipTrack('LD-2026-001847', '${s}')`); assert(ev1.some(e => e.done && /погружено/.test(e.text)) && ev1.some(e => !e.done && /выгружено/.test(e.text)), 'loaded done, unloaded pending');
    const bad = ev("ops(load('LD-2026-001840')).orders[1].places[0].sscc"); assert(ev(`shipTrack('LD-2026-001840', '${bad}')`).some(e => e.bad), 'wrong-trip scan flagged'); const sd = ev("opsPlaces(load('LD-2026-001841'))[0].sscc"); assert(ev(`shipTrack('LD-2026-001841', '${sd}')`).every(e => e.done), 'delivered place fully traced');
    ev("S.ops.shipArch = false; S.ops.shipLoad = 'LD-2026-001849'; go('orders'); ACT.stab({s:'orders',v:'ship'})"); assert(ev("document.querySelectorAll('.sh-short').length") > 0, 'FEFO marker on a short-expiry place');
  });
  await group('manufacturer directory with logo badges; archive date filter (FR-176/02)', 'ru', async (g, ev, w) => {
    ev("S.ops.shipLoad = 'LD-2026-001847'; go('orders'); ACT.stab({s:'orders',v:'ship'})"); assert(w.document.querySelectorAll('.sh-mfr').length >= 1 && w.document.querySelectorAll('[data-mfr-logo]').length >= 1, 'manufacturer cards with logo badge');
    ev("S.ops.shipArch = true; S.ops.shipFrom = '2026-10-17'; render()"); assert(!w.document.querySelector('[data-act=shSel][data-id="LD-2026-001844"]') && w.document.querySelector('[data-act=shSel][data-id="LD-2026-001841"]'), 'date filter hides older shipments'); clean(w, 'archive');
  });
  await group('Shipments & labels tab renders in every language without undefined / NaN', 'ru', async () => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { gg.ev("go('orders'); ACT.stab({s:'orders',v:'ship'}); S.ops.zpl = true; render()"); clean(gg.w, lang + ' shipments'); } finally { gg.done(); } }
  });
