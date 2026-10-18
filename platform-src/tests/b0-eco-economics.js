  /* ---- W5 economics, reports & baseline data ---- */
  for (const lang of LANGS) await group('[' + lang + '] W5 tabs render without undefined/NaN', lang, async (g, ev, w) => {
    ev("go('billing');ACT.stab({s:'billing',v:'model'})"); for (const s of ['sum', 'fuel', 'ins', 'own']) { ev(`ACT.ecoSub({v:'${s}'})`); clean(w, 'billing/model/' + s); }
    for (const t of ['cards', 'kpi', 'cross', 'fines']) { ev(`go('reports');ACT.stab({s:'reports',v:'${t}'})`); clean(w, 'reports/' + t); }
    ev("ACT.ecoFineImport()"); clean(w, 'fines after import');
    ev("go('settings');ACT.stab({s:'settings',v:'main'})"); clean(w, 'settings/main');
    for (const s of ['q', 'val', 'pv', 'net', 'fleet', 'launch']) { ev(`go('settings');ACT.stab({s:'settings',v:'baseline'});ACT.blSub({v:'${s}'})`); clean(w, 'settings/baseline/' + s); }
    for (const k of ['billing/model', 'reports/kpi', 'reports/cross', 'reports/fines', 'settings/baseline']) { ev(`go('help');ACT.helpGo({k:'${k}'})`); clean(w, 'help ' + k); }
  });
  await group('cost model: bottom-up categories, cost + 5 %, transfer prices, diesel what-if (FR-47/125)', 'ru', async (g, ev) => {
    const M = ev('ecoCostCalc(340,false)'); assert(M.tot > 0 && M.rows.length === 19, 'rows'); for (const c of ['fuel', 'service', 'detention', 'insurance', 'tax']) assert(M.byCat[c] > 0, 'category ' + c);
    assert(Math.abs(M.tariff - M.perKg * 1.05) < 1e-6, 'cost + 5 %'); assert(M.rings.length === 4 && M.rings.every(r => Math.abs(r.transfer - r.cost * 1.05) < 1e-6), 'transfer prices');
    assert(ev('ecoCostCalc(450,false).tot') > M.tot, 'diesel 450 not more expensive'); assert(ev('ecoCostCalc(340,true).rows[0].v') > M.rows[0].v, 'winter not applied');
  });
  await group('own vs external: >50 % gap needs two signatures of different functions (FR-85)', 'ru', async (g, ev) => {
    const id = ev("ECO_COWN.find(o=>ecoOwnCalc(o).need).id"); assert(id, 'no >50 % case');
    ev(`ACT.ecoExec({id:'${id}',v:'external'})`); assert(!ev(`S.eco.cost.ex['${id}']`), 'executed without signatures');
    ev(`ACT.ecoSign({id:'${id}',i:0})`); ev(`ACT.ecoSign({id:'${id}',i:1})`); eq(ev(`S.eco.cost.ap['${id}'].filter(Boolean).length`), 1, 'same person signed twice');
    ev("ACT.setRole({v:'dispatcher'})"); ev(`ACT.ecoSign({id:'${id}',i:1})`); eq(ev(`S.eco.cost.ap['${id}'].filter(Boolean).length`), 1, 'dispatcher signed');
    ev("ACT.setRole({v:'finance'})"); ev(`ACT.ecoSign({id:'${id}',i:1})`); eq(ev(`S.eco.cost.ap['${id}'].filter(Boolean).length`), 2, 'finance could not sign');
    const n = ev('S.costs.length'); ev(`ACT.ecoExec({id:'${id}',v:'external'})`); eq(ev(`S.eco.cost.ex['${id}'].ref`), 'XO-101'); eq(ev('S.costs.length'), n + 1, 'no ledger entry'); assert(ev('S.audit.length') >= 3, 'not audited');
  });
  await group('own vs external: diesel price change makes signatures stale', 'ru', async (g, ev) => {
    const id = ev("ECO_COWN.find(o=>ecoOwnCalc(o).need).id"); ev(`ACT.ecoSign({id:'${id}',i:0})`); ev("ACT.setRole({v:'finance'})"); ev(`ACT.ecoSign({id:'${id}',i:1})`);
    ev("ACT.ecoDiesel({v:400})"); assert(ev(`S.eco.cost.stale['${id}']`), 'not stale'); ev(`ACT.ecoExec({id:'${id}',v:'own'})`); assert(!ev(`S.eco.cost.ex['${id}']`), 'executed with stale signatures');
  });
  await group('reports: KPI and express × temperature crossing react to decisions (LH-O1, I-12)', 'ru', async (g, ev, w) => {
    const k = ev('ecoKpi()'); assert(k.otif >= 0 && k.otif <= 100 && k.lf > 0 && k.exShare > 0 && k.perKg > 0, 'kpi values');
    const c = ev('ecoCross()'); eq(c.rows.length, 4, 'zones'); assert(c.tot.exN > 0 && c.coldShare > 0, 'cold express');
    const id = ev("S.loads.find(ecoIsExpress).id"); ev(`ACT.ecoMove({id:'${id}'})`); eq(ev('ecoCross().moved'), 1); assert(ev('ecoCross().tot.exCost') < c.tot.exCost, 'express cost unchanged');
    ev("go('reports');ACT.stab({s:'reports',v:'cross'})"); assert(w.document.querySelectorAll('[data-zone]').length === 4, 'matrix rows');
  });
  await group('fines: import attributes driver by time, recharge → ack → deduction → payroll (FR-122/123)', 'ru', async (g, ev, w) => {
    ev("go('reports');ACT.stab({s:'reports',v:'fines'})"); eq(ev("ecoFineDriver(S.eco.fines.find(f=>f.id==='FN-1021'))"), 'd5', 'driver at 16:42');
    ev('ACT.ecoFineImport()'); eq(ev("S.eco.fines[0].id"), 'FN-1024'); eq(ev("ecoFineDriver(S.eco.fines[0])"), 'd2');
    const n = ev('S.costs.length'); ev("ACT.ecoFineSt({id:'FN-1024',v:'paid50'})"); eq(ev("S.eco.fines[0].paid"), 7375); eq(ev('S.costs.length'), n + 1, 'company payment not in ledger');
    ev("ACT.ecoFineSt({id:'FN-1024',v:'deducted'})"); eq(ev("S.eco.fines[0].st"), 'paid50', 'deducted without recharge');
    ev("ACT.ecoFineSt({id:'FN-1024',v:'recharge'})"); ev("ACT.ecoFineSt({id:'FN-1024',v:'ack'})"); ev("ACT.ecoFineSt({id:'FN-1024',v:'deducted'})"); eq(ev("S.eco.fines[0].st"), 'deducted');
    ev('ACT.ecoPayroll()'); eq(ev('S.eco.payroll.length'), 1); eq(ev("S.eco.fines[0].exp"), 1);
    ev("ACT.ecoFineSt({id:'FN-1002',v:'paid50'})"); eq(ev("S.eco.fines.find(f=>f.id==='FN-1002').st"), 'unattributed', 'unattributed fine paid without driver');
  });
  await group('fines: deduction without acknowledgement needs an HR reason', 'ru', async (g, ev, w) => {
    ev("go('reports');ACT.stab({s:'reports',v:'fines'});ACT.ecoFineSel({id:'FN-1015'})"); ev("ACT.ecoFineSt({id:'FN-1015',v:'deducted'})"); eq(ev("S.eco.fines.find(f=>f.id==='FN-1015').st"), 'recharge', 'deducted without reason');
    w.document.querySelector('#fd_r').value = 'HR decision after hearing'; ev("ACT.ecoFineSt({id:'FN-1015',v:'deducted'})"); eq(ev("S.eco.fines.find(f=>f.id==='FN-1015').st"), 'deducted');
  });
  await group('baseline: 150 questions, FR-49 open until all KDL questions clarified (FR-35/49)', 'ru', async (g, ev, w) => {
    eq(ev('ecoQuestions().length'), 150); const fr = ev('ecoFr49()'); assert(fr.total > 0 && fr.open === fr.total, 'FR-49 not open');
    ev("go('settings');ACT.stab({s:'settings',v:'baseline'});ACT.blSub({v:'val'})"); for (const v of ev("ECO_BL.BLV.filter(v=>v.q).map(v=>v.id)")) ev(`ACT.blClar({id:'${v}'})`); eq(ev('ecoFr49().open'), 0, 'FR-49 still open');
    ev("ACT.setRole({v:'viewer'})"); eq(ev("S.route"), 'settings');
  });
  await group('baseline: 23 cities on two hubs, target fleet 4, legs check, critical path (FR-36/38/48/174)', 'ru', async (g, ev, w) => {
    eq(ev('ECO_BL.BLC.length'), 23); assert(ev("ECO_BL.BLC.every(c=>c.hub==='ast'||c.hub==='alm')"), 'hub'); eq(ev('ECO_BL.BLF.reduce((a,f)=>a+f.qty,0)'), 4, 'target fleet');
    ev("go('settings');ACT.stab({s:'settings',v:'baseline'});ACT.blSub({v:'net'})"); eq(w.document.querySelectorAll('[data-city]').length, 23); assert(/✓/.test(w.document.querySelector('[data-ring=R1]').innerText), 'R1 legs sum');
    ev("ACT.blSub({v:'launch'})"); assert(/15\.12\.2026/.test(w.document.querySelector('main').innerText), 'mid-December target'); ev("ACT.blLaunch({i:'1',v:'done'})"); eq(ev('S.eco.bl.launch[1]'), 'done');
    ev("ACT.blLegal({id:'vat16'})"); assert(ev('S.eco.bl.legal.vat16'), 'legal check'); ev("ACT.blWest({id:'cool',v:'1'})"); eq(ev('S.eco.bl.west.cool'), 1);
    ev("ACT.blSub({v:'pv'});ACT.blPv({id:'deduct_cap',v:'checked'})"); eq(ev('S.eco.bl.pv.deduct_cap'), 'checked'); eq(ev('ECO_BL.PV.length'), 26);
    ev("ACT.setRole({v:'dispatcher'})"); ev("ACT.blLegal({id:'cit'})"); assert(!ev('S.eco.bl.legal.cit'), 'dispatcher checked a legal item');
  });
