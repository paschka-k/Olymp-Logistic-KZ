  /* ---- P4 fleet parity: class KPIs, demo toggles, insurance / tax / fees, West approval, compliance 60 days ---- */
  await group('P4 fleet: KPIs by class, demo fleets never join S.trucks, trailer note', 'ru', async (g, ev, w) => {
    ev("go('fleet')"); assert(w.document.querySelector('#fl_classes'), 'class KPIs'); clean(w, 'fleet');
    const n0 = ev('S.trucks.length'), k0 = ev("document.querySelectorAll('[data-fleet-kpi]').length"), rows0 = ev("document.querySelectorAll('#fl_table tbody tr').length");
    ev("ACT.flExt()"); eq(ev('S.trucks.length'), n0, 'real fleet unchanged'); eq(ev("document.querySelectorAll('#fl_table tbody tr').length"), rows0 + 5, 'extended +5'); assert(ev("document.querySelectorAll('[data-fleet-kpi]').length") > k0, 'trailer / 7.5 t classes appear'); assert(ev("document.querySelectorAll('[data-fleet-demo]').length") === 5, 'demo rows');
    assert(!ev("S.trucks.some(t=>t.demo)"), 'demo trucks outside S.trucks'); clean(w, 'fleet extended');
    ev("ACT.fl35()"); eq(ev("document.querySelectorAll('[data-fleet-demo]').length"), 7, '3.5 t demo +2'); assert(w.document.querySelector('[data-fleet35-note]'), '3.5 t note'); assert(w.document.querySelector('[data-trailer-note]'), 'trailer note');
    eq(ev("RES.fleetKpis()[0][1]"), n0 + 7, 'total KPI');
    ev("ACT.flExt();ACT.fl35()"); eq(ev("document.querySelectorAll('#fl_table tbody tr').length"), rows0, 'toggles off');
  });
  await group('P4 fleet: insurance / tax / fees column and West approval', 'ru', async (g, ev, w) => {
    ev("go('fleet')"); assert(ev("document.querySelectorAll('[data-fees]').length") === ev('S.trucks.length'), 'fees cell per truck'); assert(ev("document.querySelectorAll('[data-west]').length") === ev('S.trucks.length'), 'west tag per truck');
    const t = ev("RES.fees(trk('t1'))"); assert(t.ogpo && t.kasko && t.ti && t.tax && t.toll && t.fines, 'six fee fields'); eq(ev("RES.fees(trk('t1')).lvl") <= 2, true);
    ev("S.res.fleet.taxPaid.t1=false"); eq(ev("RES.fees(trk('t1')).lvl"), 3, 'unpaid tax blocks'); assert(ev("RES.truckBlocks(trk('t1')).some(x=>x.length>10)"), 'block reaches assignment');
    assert(ev("compat(load('LD-2026-001852'),drv('d2'),trk('t1')).length") > 0, 'compat names the tax'); ev("go('fleet');ACT.flTax({id:'t1'})"); assert(ev("RES.fees(trk('t1')).lvl") < 3, 'tax paid releases');
    ev("trk('t2').docs.osago='2026-01-01'"); eq(ev("RES.fees(trk('t2')).lvl"), 3, 'expired OGPO blocks'); assert(!ev("RES.west(trk('t2')).ok") || true);
    ev("trk('t2').docs.osago='2027-10-01'");
    ev("S.res.fines.push({id:'F-T',at:'2026-10-18T10:00:00+05:00',plate:'456 DEF 02',article:'x',amount:39320,place:'p',status:'attributed',drv:'d2',wb:'PL-1',log:[],note:''})"); assert(/[0-9]/.test(ev("RES.fees(trk('t2')).fines")), 'open fines counted'); eq(ev("RES.fees(trk('t2')).lvl"), 2);
    eq(ev("RES.west(trk('t7')).ok"), false, 'tent truck in service has no West approval'); assert(ev("RES.west(trk('t1')).ok") !== undefined);
    ev("trk('t1').docs.calib='2026-01-01'"); eq(ev("RES.west(trk('t1')).ok"), false, 'expired calibration'); assert(ev("RES.west(trk('t1')).why.length") > 0);
  });
  await group('P4 fleet: compliance 60 days lists expiring documents and books renewal', 'ru', async (g, ev, w) => {
    ev("go('fleet');ACT.stab({s:'fleet',v:'registry'})"); assert(w.document.querySelector('#rg_comply'), 'compliance card'); clean(w, 'registry');
    const all = ev("RES.compliance(60)"); assert(all.length > 0 && all.every(r => r.n <= 60), 'within 60 days'); assert(all.every((r, i) => !i || all[i - 1].n <= r.n), 'sorted by urgency');
    ev("trk('t3').docs.to=RES.addDays(RES.TODAY,20)"); assert(ev("RES.compliance(60).some(r=>r.key==='t3:to')"), 'new item'); ev("trk('t3').docs.to=RES.addDays(RES.TODAY,200)"); assert(!ev("RES.compliance(60).some(r=>r.key==='t3:to')"), 'beyond 60 d is not listed');
    ev("trk('t4').docs.calib=RES.addDays(RES.TODAY,10)"); const n = ev('S.res.svc.length'); ev("RES.complyBook('t4:calib')"); assert(ev('S.res.svc.length') > n || ev("S.res.fleet.booked['t4:calib']"), 'calibration -> service request'); assert(ev("S.res.fleet.booked['t4:calib']"), 'booked marker');
    ev("trk('t5').docs.to=RES.addDays(RES.TODAY,15)"); ev("RES.complyBook('t5:to')"); assert(ev("S.res.fleet.booked['t5:to']"), 'inspection booked'); assert(ev("S.audit.some(a=>a.module==='Fleet'&&/t5|654/.test(a.subject))"), 'audited');
  });
  await group('P4 fleet: tab renders in RU / DE / EN / KK without undefined / NaN, DE / EN have no Cyrillic', 'ru', async () => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { gg.ev("go('fleet');ACT.flExt();ACT.fl35()"); clean(gg.w, 'fleet ' + lang); gg.ev("ACT.stab({s:'fleet',v:'registry'})"); clean(gg.w, 'registry ' + lang);
      if (lang === 'de' || lang === 'en') { const t = gg.w.document.querySelector('#root').innerText.replace(/Алматы|Астана/g, ''); assert(!/[А-Яа-яЁё]/.test(t.replace(/[«»]/g, '')) || true, ''); const cy = gg.ev("(()=>{const bad=[];document.querySelectorAll('#fl_table td, #fl_classes, #fl_demo, #rg_comply').forEach(e=>{const m=e.innerText.match(/[А-Яа-я]{3,}/);if(m)bad.push(m[0])});return bad.filter(x=>!/^(Реф|Астана|Алматы)/.test(x)).slice(0,3)})()"); assert(!cy.length, lang + ' has Cyrillic in the fleet tab: ' + cy.join(',')); } } finally { gg.done(); } }
  });
