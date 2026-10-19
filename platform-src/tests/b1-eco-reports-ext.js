  /* ---- P5 · Reports parity: six KPI tiles with sparklines, driver report, catalogue with audited exports; Quality linked orders ---- */
  for (const lang of LANGS) await group('[' + lang + '] P5 reports / quality tabs render without undefined/NaN', lang, async (g, ev, w) => {
    for (const t of ['kpi', 'catalogue']) { ev(`go('reports');ACT.stab({s:'reports',v:'${t}'})`); clean(w, 'reports/' + t); }
    ev("ACT.ecoRepExp({g:'ops',i:'0',v:'pdf'})"); clean(w, 'catalogue after export');
    ev("go('pod');ACT.stab({s:'pod',v:'quality'});ACT.qDev({id:'DEV-0011'})"); clean(w, 'pod/quality DEV-0011');
    ev("ACT.qClaim({id:'DEV-0011',o:'O-1844-2'})"); clean(w, 'claim drawer from deviation');
    for (const k of ['reports/kpi', 'reports/catalogue']) { ev(`go('help');ACT.helpGo({k:'${k}'})`); clean(w, 'help ' + k); }
  });
  await group('reports: six KPI tiles with 8-week sparklines, cost per pallet from the actuals register (FR-125)', 'ru', async (g, ev, w) => {
    const k = ev('ecoRepKpis()'); eq(k.length, 6, 'tiles'); assert(k.every(x => x.bars.length === 8 && x.bars[7].last), '8 bars, last marked');
    eq(k.map(x => x.k).join(','), 'otif,temp,vol,empty,pal,inc');
    assert(k[4].live && /₸/.test(k[4].value), 'cost per pallet not from the ledger');
    const pal = ev("S.loads.filter(l=>l.status==='delivered').reduce((s,l)=>s+l.pallets,0)"), cost = ev('S.costs.reduce((s,c)=>s+c.amount,0)'); eq(k[4].value, Math.round(cost / pal).toLocaleString('ru-RU') + ' ₸', 'per pallet formula');
    ev("go('reports');ACT.stab({s:'reports',v:'kpi'})"); eq(w.document.querySelectorAll('[data-rep-kpi]').length, 6, 'tiles rendered'); eq(w.document.querySelectorAll('[data-rep-kpi="otif"] .spark-bars i').length, 8, 'sparkline bars');
    assert(w.document.querySelector('[data-drv-report]'), 'driver report missing'); eq(w.document.querySelectorAll('[data-drvrep]').length, 7, 'seven drivers');
  });
  await group('reports: driver report follows the fine register (attribution, open amounts)', 'ru', async (g, ev, w) => {
    const r0 = ev("ecoDrvRep().find(r=>r.id==='d2')"); eq(r0.fines.length, 2, 'd2 has FN-1018 and FN-1009'); eq(r0.open, 0, 'paid and disputed fines are closed');
    ev('ACT.ecoFineImport()'); const r1 = ev("ecoDrvRep().find(r=>r.id==='d2')"); eq(r1.fines.length, 3, 'imported fine attributed to d2'); eq(r1.open, 14750, 'unpaid fine is open');
    const d5 = ev("ecoDrvRep().find(r=>r.id==='d5')"); eq(d5.open, 29500, 'FN-1021 open for d5');
  });
  await group('reports: catalogue has 6 groups × 4 reports; PDF / Excel exports are audited', 'ru', async (g, ev, w) => {
    eq(ev('ECO_REP_GROUPS.length'), 6); assert(ev('ECO_REP_GROUPS.every(g=>g.items.length===4)'), '4 reports per group');
    ev("go('reports');ACT.stab({s:'reports',v:'catalogue'})"); eq(w.document.querySelectorAll('[data-rep-group]').length, 6, 'group cards'); eq(w.document.querySelectorAll('[data-act=ecoRepExp]').length, 48, 'PDF + Excel per report');
    const a0 = ev('S.audit.length'); const r = ev("ecoRepExport('cold',1,'pdf')"); eq(r.id, 'RP-001'); eq(ev('S.audit.length'), a0 + 1, 'export not audited'); assert(/PDF/.test(ev('S.audit[0].decision')), 'audit decision names the format');
    eq(ev("ecoRepExport('cold',9,'pdf')"), null, 'unknown report accepted'); eq(ev("ecoRepExport('cold',1,'doc')"), null, 'unknown format accepted');
    ev("ACT.ecoRepExp({g:'fin',i:'2',v:'xlsx'})"); eq(ev('S.eco.rep.exports.length'), 2); assert(w.document.querySelector('[data-rep-exports]').innerText.includes('RP-002'), 'recent exports list');
    eq(ev("S.eco.rep.exports[0].name"), ev("ECO_REP_GROUPS.find(g=>g.id==='fin').items[2]"), 'export names the report');
  });
  await group('quality: linked orders with outcome and hold tag; insurance claim opens with DEV and order pre-filled (FR-153)', 'ru', async (g, ev, w) => {
    const os = ev("devOrders(S.devs.find(d=>d.id==='DEV-0011'))"); eq(os.length, 2); eq(os[1].out, 'hold'); assert(os[1].hold && !os[0].hold, 'hold tag');
    ev("go('pod');ACT.stab({s:'pod',v:'quality'});ACT.qDev({id:'DEV-0011'})"); eq(w.document.querySelectorAll('[data-dev-order]').length, 2, 'order rows'); assert(w.document.querySelector('[data-dev-orders] .chip.yellow'), 'hold chip');
    const auto = ev("S.devs.find(d=>d.load)"); assert(auto, 'no load-bound deviation'); const ao = ev(`devOrders(S.devs.find(d=>d.id==='${auto.id}'))`); assert(ao.length >= 2 && ao.every(o => o.out === 'hold' && o.hold), 'orders of an open deviation are on hold');
    ev(`ACT.qDev({id:'${auto.id}'});S.devs.find(d=>d.id==='${auto.id}').step=3;ACT.qDec({id:'${auto.id}',v:'release'})`); assert(ev(`devOrders(S.devs.find(d=>d.id==='${auto.id}')).every(o=>o.out==='released'&&!o.hold)`), 'release did not clear the hold');
    ev("ACT.qClaim({id:'DEV-0011',o:'O-1844-2'})"); eq(ev('S.route'), 'billing'); eq(ev('S.tab.billing'), 'insurance'); eq(ev('S.drawer.type'), 'claimNew'); eq(ev('S.drawer.dev'), 'DEV-0011');
    eq(w.document.querySelector('#cn_dev').value, 'DEV-0011', 'deviation not pre-selected'); assert(w.document.querySelector('[data-claim-prefill]').innerText.includes('O-1844-2'), 'order chip'); assert(/O-1844-2/.test(w.document.querySelector('#cn_note').value), 'order not in the description');
    ev("ACT.setRole({v:'viewer'})"); ev("go('pod')"); assert(!ev("ACT.qClaim({id:'DEV-0011',o:'O-1844-1'})") && ev('S.route') !== 'billing', 'viewer reached the claim');
  });
