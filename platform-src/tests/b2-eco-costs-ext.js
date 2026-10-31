  /* ---- P5 · Costs parity: workshop & downtime, drivers FTE, plan / actual per vehicle, toll CSV, incoming ESF, 6 indicators, idle toggles ---- */
  for (const lang of LANGS) await group('[' + lang + '] P5 cost-model sub-tabs render without undefined/NaN', lang, async (g, ev, w) => {
    ev("go('billing');ACT.stab({s:'billing',v:'model'})"); for (const s of ['sum', 'svc', 'ins', 'drv']) { ev(`ACT.ecoSub({v:'${s}'})`); clean(w, 'billing/model/' + s); }
    ev("ACT.ecoSub({v:'ins'});ACT.ecoIdle({v:'idleW'});ACT.ecoIdle({v:'idleB'})"); clean(w, 'ins with idle toggles');
    ev("ACT.ecoSub({v:'svc'});ACT.ecoWs({id:'V01'})"); clean(w, 'svc with breakdown');
    ev("ACT.ecoSub({v:'sum'});ACT.setRole({v:'finance'});go('billing');ACT.stab({s:'billing',v:'model'})"); clean(w, 'sum as finance (forms)');
    ev("go('billing');ACT.stab({s:'billing',v:'cost'})"); clean(w, 'billing/cost with seeded ledger');
    ev("go('help');ACT.helpGo({k:'billing/model'})"); clean(w, 'help billing/model');
  });
  await group('costs: workshop & downtime — TO-1 / TO-2 distance, availability, downtime cost card with breakdown scenario', 'ru', async (g, ev, w) => {
    const v = ev('ecoCostCalc().veh'); eq(v.length, 4); assert(v.every(x => x.toLeft > 0 && x.toLeft <= 15000 && x.to2Left > 0 && x.to2Left <= 45000), 'TO distances'); eq(v[0].toLeft, 15000 - 11600 % 15000, 'V01 km to TO-1');
    assert(v.every(x => x.ktg > 0.9 && x.ktg <= 1 && x.fixDay > 0), 'availability and downtime day');
    ev("go('billing');ACT.stab({s:'billing',v:'model'});ACT.ecoSub({v:'svc'})"); eq(w.document.querySelectorAll('[data-svc]').length, 4, 'rows'); eq(w.document.querySelector('[data-outage]').dataset.outage, '0', 'scenario active at start');
    const tot = w.document.querySelector('[data-outage-total]').innerText; assert(/₸/.test(tot), 'total');
    const a0 = ev('S.audit.length'); ev("ACT.ecoWs({id:'V01'})"); eq(w.document.querySelector('[data-outage]').dataset.outage, '1', 'scenario not active'); assert(w.document.querySelector('[data-svc=V01]').dataset.ws === '1', 'V01 not in workshop'); eq(ev('S.audit.length'), a0 + 1, 'scenario not audited');
    ev("ACT.ecoWs({id:'V01'})"); eq(w.document.querySelector('[data-outage]').dataset.outage, '0', 'scenario not ended');
  });
  await group('costs: drivers — FTE = km / 70 × 1.15 / 1814, crew colour, totals (FR-46)', 'ru', async (g, ev, w) => {
    const D = ev('ecoDrvNeed()'); eq(D.rows.length, 4); eq(D.crew, 7); const r = D.rows[0]; assert(Math.abs(r.fte - r.kmY / 70 * 1.15 / 1814) < 1e-9, 'fte formula'); assert(D.fte > 0 && D.base === 7 * 200000, 'totals');
    assert(D.rows.every(x => x.lvl === (x.fte > x.crew ? 'red' : x.fte > x.crew * 0.9 ? 'yellow' : 'green')), 'crew colour rule');
    ev("go('billing');ACT.stab({s:'billing',v:'model'});ACT.ecoSub({v:'drv'})"); eq(w.document.querySelectorAll('[data-cdrv]').length, 4, 'rows');
  });
  await group('costs: summary — 6-indicator card and plan / actual per vehicle from the ledger (FR-125)', 'ru', async (g, ev, w) => {
    ev("go('billing');ACT.stab({s:'billing',v:'model'});ACT.ecoSub({v:'sum'})"); eq(w.document.querySelectorAll('[data-dash] .kv > div').length, 6, 'six indicators'); assert(w.document.querySelector('[data-cost-actual]'), 'plan / actual table');
    const A = ev('ecoActualByVeh()'); eq(A.rows.length, 4); const v1 = A.rows.find(r => r.id === 'V01'); eq(v1.by.fuel, 139256 + 135320, 'V01 fuel fills'); eq(v1.by.tolls, 4300, 'V01 toll'); assert(v1.l100 != null && Math.abs(v1.l100 - 398 / (12690 - 11210) * 100) < 1e-6, 'K-9: l/100 by the full-tank method (litres after the first fill / odometer delta)');
    const v2 = A.rows.find(r => r.id === 'V02'); eq(v2.by.service, 86000, 'V02 closed request'); assert(A.unattributed >= 5, 'seed entries without vehicle counted');
    eq(w.document.querySelectorAll('[data-cost-act]').length, 4, 'rows rendered');
    ev("ACT.setRole({v:'dispatcher'});go('billing');ACT.stab({s:'billing',v:'model'})"); assert(!w.document.querySelector('[data-toll-import]'), 'dispatcher sees the import forms');
  });
  await group('costs: toll CSV import — plate or code, de-duplication by reference, error lines (FR-125)', 'ru', async (g, ev, w) => {
    const n = ev('S.costs.length'), csv = 'date;vehicle;amount;ref\\n2026-10-15;V01;4300;TR-77210\\n2026-10-15;123 ABC 01;2150;TR-77211\\n2026-10-07;V01;4300;TR-77102\\n2026-10-16;999 ZZZ 99;100;TR-77212\\nbad line';
    const r = ev(`ecoTollImport('${csv}')`); eq(r.imported, 2); eq(r.duplicates, 1, 'known reference re-imported'); eq(r.errors.length, 2, 'bad vehicle + bad line'); eq(ev('S.costs.length'), n + 2, 'ledger entries');
    eq(ev("S.costs[S.costs.length-1].veh"), 'V01', 'plate 123 ABC 01 mapped to V01'); eq(ev("S.costs[S.costs.length-1].kind"), 'tolls');
    const r2 = ev(`ecoTollImport('${csv}')`); eq(r2.imported, 0, 'second import duplicated'); eq(r2.duplicates, 3);
    eq(ev("ecoActualByVeh().rows.find(r=>r.id==='V01').by.tolls"), 4300 + 4300 + 2150, 'tolls per vehicle');
    ev("ACT.setRole({v:'finance'});go('billing');ACT.stab({s:'billing',v:'model'})"); w.document.querySelector('#ct_csv').value = '2026-10-17;V03;990;TR-80001'; ev('ACT.ecoToll()'); eq(ev('S.costs.length'), n + 3, 'UI import'); assert(/1/.test(w.document.querySelector('[data-cost-msg]').innerText), 'result message');
  });
  await group('costs: incoming partner / workshop ESF — validation, SR link attributes the vehicle, booked to the ledger (FR-116)', 'ru', async (g, ev, w) => {
    const bad = s => assert(typeof ev(s) === 'string', 'accepted: ' + s);
    bad("ecoInvRegister({bin:'123',no:'ESF-1',date:'2026-10-12',net:1000,vat:120,link:'SR-0104'})");
    bad("ecoInvRegister({bin:'120540012345',no:'ESF-1',date:'12.10.2026',net:1000,vat:120,link:'SR-0104'})");
    bad("ecoInvRegister({bin:'120540012345',no:'ESF-1',date:'2026-10-12',net:0,vat:0,link:'SR-0104'})");
    bad("ecoInvRegister({bin:'120540012345',no:'ESF-1',date:'2026-10-12',net:1000,vat:500,link:'SR-0104'})");
    bad("ecoInvRegister({bin:'120540012345',no:'ESF-1',date:'2026-10-12',net:1000,vat:120,link:'XO-101'})");
    const n = ev('S.costs.length'), a0 = ev('S.audit.length');
    const r = ev("ecoInvRegister({bin:'120540012345',no:'ESF-2026-0412',date:'2026-10-12',net:85000,vat:10200,link:'SR-0104'})"); eq(r.id, 'IN-001'); eq(r.veh, 'V03', 'SR-0104 (truck t2) maps to V03'); eq(r.kind, 'service');
    eq(ev('S.costs.length'), n + 1, 'ledger entry'); eq(ev('S.audit.length'), a0 + 1, 'not audited'); eq(ev("ecoActualByVeh().rows.find(r=>r.id==='V03').by.service"), 85000, 'service actual of V03');
    assert(typeof ev("ecoInvRegister({bin:'120540012345',no:'ESF-2026-0412',date:'2026-10-12',net:85000,vat:0,link:'SR-0104'})") === 'string', 'duplicate ESF accepted');
    const r2 = ev("ecoInvRegister({bin:'120540012345',no:'ESF-2026-0413',date:'2026-10-14',net:230000,vat:27600,link:'HO-021'})"); eq(r2.kind, 'partners'); eq(r2.veh, null, 'handover has no vehicle');
    ev("ACT.setRole({v:'finance'});go('billing');ACT.stab({s:'billing',v:'model'})"); const set = (id, v) => { w.document.getElementById(id).value = v; };
    set('ci_bin', '120540012345'); set('ci_no', 'ESF-2026-0500'); set('ci_date', '2026-10-15'); set('ci_net', '12000'); set('ci_vat', '1440'); set('ci_link', 'HO-022'); ev('ACT.ecoInv()'); eq(ev('S.eco.cost.inv.length'), 3, 'UI registration'); assert(w.document.querySelector('[data-inv="IN-003"]'), 'invoice listed');
    ev("ACT.setRole({v:'dispatcher'});go('billing');ACT.stab({s:'billing',v:'model'})"); ev('ACT.ecoInv()'); eq(ev('S.eco.cost.inv.length'), 3, 'dispatcher registered an ESF');
  });
  await group('costs: insurance idle toggles add idle months and a registration recommendation (B7)', 'ru', async (g, ev, w) => {
    ev("go('billing');ACT.stab({s:'billing',v:'model'});ACT.ecoSub({v:'ins'})"); eq(w.document.querySelectorAll('[data-ins]').length, 4); eq(w.document.querySelector('[data-ins=V02] [data-ins-idle]').dataset.insIdle, '0', 'idle before toggle');
    ev("ACT.ecoIdle({v:'idleW'})"); assert(ev('S.eco.cost.idleW'), 'toggle state'); eq(w.document.querySelector('[data-ins=V02] [data-ins-idle]').dataset.insIdle, '2', 'V02 idle 2 months'); assert(/R1/.test(w.document.querySelector('[data-ins-rec=V02]').innerText), 'recommendation names R1');
    eq(w.document.querySelector('[data-ins=V04] [data-ins-idle]').dataset.insIdle, '0', 'V04 idle without its toggle'); ev("ACT.ecoIdle({v:'idleB'})"); eq(w.document.querySelector('[data-ins=V04] [data-ins-idle]').dataset.insIdle, '3', 'V04 idle 3 months');
    ev("ACT.ecoIdle({v:'idleW'})"); eq(w.document.querySelector('[data-ins=V02] [data-ins-idle]').dataset.insIdle, '0', 'toggle off');
  });
