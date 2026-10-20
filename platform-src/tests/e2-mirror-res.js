  /* ==== R2 · Mirror 0.3.9 resources, economics, records and portals (docs/MIRROR-0.3.9-res.md). Sections: a Quality/Fleet/Staff · b Driver app/Planning · c Partners/partner portal/Fines · d Drivers/Lines/Reference data/Users/Integrations/Account · e Bookings/customer portal/public/Insurance · f CRM/Customers/Contracts ==== */

  /* ---- R2 section a ---- */
  /* ---- R2 · 0.3.9 mirror, audit A: Quality (Q2/Q7/Q9/Q11/Q13), Fleet (F5/F10/F14/F15/F18/F19/F21), Staff (S1/S3/S4/S5/S6/S7/S8/S11) ---- */
  const R2Q = "go('pod');ACT.stab({s:'pod',v:'quality'})", R2REG = "go('fleet');ACT.stab({s:'fleet',v:'registry'})", R2FL = "go('fleet');ACT.stab({s:'fleet',v:'fleet'})", R2ST = "go('drivers');ACT.stab({s:'drivers',v:'staff'})";
  await group('R2 Q7 quality: CAPA step buttons and handlers need quality:write', 'en', async (g, ev, w) => {
    const d = w.document, open = ev("S.devs.find(x=>x.step<7&&x.step!==3).id");
    ev(R2Q + `;ACT.qDev({id:'${open}'})`); assert(d.querySelector('[data-act=qNext]'), 'admin sees Complete step');
    for (const r of ['viewer', 'dispatcher']) {
      ev(`ACT.setRole({v:'${r}'});` + R2Q + `;ACT.qDev({id:'${open}'})`); assert(!d.querySelector('[data-act=qNext],[data-act=qDec],[data-act=qCal]'), r + ' sees step / calibration buttons');
      assert(/quality:write/.test(d.querySelector('[data-q-ro]').innerText), r + ' read-only note'); const s0 = ev(`S.devs.find(x=>x.id==='${open}').step`);
      ev(`ACT.qNext({id:'${open}'})`); eq(ev(`S.devs.find(x=>x.id==='${open}').step`), s0, r + ' advanced the step'); eq(ev('S.toast.kind'), 'err', r + ' toast'); assert(/quality:write/.test(ev('S.toast.msg')), 'toast names the right');
      ev("trk('t1').docs.calib='2020-01-01'"); ev("ACT.qCal({id:'t1'})"); eq(ev("trk('t1').docs.calib"), '2020-01-01', r + ' calibrated');
    }
    for (const r of ['warehouse', 'quality']) { ev(`ACT.setRole({v:'${r}'});` + R2Q + `;ACT.qDev({id:'${open}'})`); assert(d.querySelector('[data-act=qNext]'), r + ' must see the step button'); const s0 = ev(`S.devs.find(x=>x.id==='${open}').step`); ev(`ACT.qNext({id:'${open}'})`); eq(ev(`S.devs.find(x=>x.id==='${open}').step`), s0 + 1, r + ' step'); }
    ev("ACT.setRole({v:'quality'});S.devs.find(x=>x.id==='DEV-0011').step=3;" + R2Q + ";ACT.qDev({id:'DEV-0011'})"); assert(d.querySelector('[data-act=qDec]'), 'quality decides'); ev("ACT.qDec({id:'DEV-0011',v:'release'})"); eq(ev("S.devs.find(x=>x.id==='DEV-0011').decision"), 'release');
    clean(w, 'quality as quality role');
  });
  await group('R2 Q2/Q9/Q11/Q13 quality: first open deviation pre-selected, closed DEV-0029, logger IDs in the calibration registry', 'en', async (g, ev, w) => {
    const d = w.document; ev(R2Q); assert(d.querySelector('[data-act=qNext],[data-act=qDec]'), 'a deviation is pre-selected'); assert(d.querySelector('[data-dev]'), 'list rows have data-dev');
    ev("ACT.qDev({id:'DEV-0029'})"); assert(/report for KDL Olymp ready/.test(d.querySelector('#root').innerText), 'closed wording'); assert(/Released/.test(d.querySelector('.stops').innerText), 'decision of the closed deviation');
    eq(ev("S.devs.find(x=>x.id==='DEV-0029').step"), 7); const id = ev("openDeviation(S.loads[0],'t','x').id"); assert(id !== 'DEV-0029' && /^DEV-\d{4}$/.test(id), 'new id ' + id);
    assert(/^L-22\d\d$/.test(ev("trk('t1').logger")), 'logger id'); assert(d.querySelector('[data-calib=t1]').innerText.includes(ev("trk('t1').logger")), 'logger shown in the registry');
    ev("S.devs.forEach(x=>x.step=7);" + R2Q + ";ACT.qDev({id:''})"); assert(d.querySelector('[data-no-devs]'), 'empty state "No open deviations"'); clean(w, 'quality closed');
  });
  await group('R2 F5 fleet: ADR flag and winter kit under the model (Fleet table)', 'en', async (g, ev, w) => {
    const d = w.document; ev(R2FL); const c1 = d.querySelector('[data-fleet-adr=t1]'), c4 = d.querySelector('[data-fleet-adr=t4]');
    eq(c1.dataset.adr, '1', 't1 ADR'); assert(/ADR yes/.test(c1.innerText) && /winter tyres, chains, insulated thermo containers/.test(c1.innerText), 't1 text ' + c1.innerText);
    eq(c4.dataset.adr, '0', 't4 no ADR'); assert(/ADR —/.test(c4.innerText), 't4 text');
    ev("ACT.flExt()"); assert(/parking heater/.test(d.querySelector('#fl_table').innerText), 'demo reefer winter kit'); assert(/winter tyres/.test(d.querySelector('#fl_table').innerText), 'trailers');
    eq(ev("trk('t1').kg"), ev("typeOfTruck(trk('t1')).kg"), 'payload from type'); clean(w, 'fleet table');
  });
  await group('R2 F14/F10 registry: ID, capacity kg · pal, KASKO, ADR columns, logger ID in calibration, CSV and default view', 'en', async (g, ev, w) => {
    const d = w.document; ev(R2REG); const th = [...d.querySelectorAll('#rg_table th')].map(x => x.innerText); assert(th.includes('ADR'), 'ADR column default ' + th); assert(th.some(x => /Logger/.test(x)), 'logger in calibration header');
    assert(d.querySelector('[data-logger=t1]'), 'logger cell');
    ev("ACT.rgCols()"); for (const k of ['code', 'kg', 'kasko']) { const cb = d.querySelector(`.rg_col[value=${k}]`); assert(cb && !cb.checked, k + ' optional column'); cb.checked = true; cb.dispatchEvent(new w.Event('change', { bubbles: true })); }
    const th2 = [...d.querySelectorAll('#rg_table th')].map(x => x.innerText); assert(th2.includes('ID') && th2.includes('Capacity') && th2.includes('Comprehensive until'), 'added ' + th2);
    assert(/\d kg · \d+ pal/.test(d.querySelector('#rg_table').innerText), 'kg · pal cell'); ev("S.res.fleet.kasko.t1='2026-11-01';render()"); assert(d.querySelector('#rg_table').innerText.includes('01.11.2026'), 'kasko date');
    ev('ACT.rgCsv()'); const csv = ev('S.res.lastCsv'); const hd = csv.split(String.fromCharCode(13, 10))[0].replace(/^﻿/, '').split(';'); assert(hd.includes('ADR') && hd.includes('ID') && hd.includes('Capacity'), 'csv header ' + hd); assert(csv.includes(ev("trk('t1').logger")), 'csv logger');
    w.document.querySelector('#rg_vname').value = 'Mine'; ev('ACT.rgSave()'); eq(ev("S.res.views.find(v=>v.name==='Mine').def"), true, 'default view'); clean(w, 'registry columns');
  });
  await group('R2 F15 fleet: edit vehicle master data (fleet:write), validation, audit', 'en', async (g, ev, w) => {
    const d = w.document; ev(R2FL + ";ACT.openT({id:'t2'})"); assert(d.querySelector('[data-act=truckEdit][data-id=t2]'), 'Edit button'); ev("ACT.truckEdit({id:'t2'})"); assert(d.querySelector('[data-edit-truck=t2]'), 'edit drawer');
    for (const k of ['code', 'plate', 'make', 'model', 'hub', 'st', 'kg', 'cap', 'adr', 'next', 'cargo', 'osago', 'kasko', 'to', 'logger', 'calib']) assert(d.querySelector('#et_' + k), 'field ' + k);
    clean(w, 'edit drawer'); d.querySelector('#et_plate').value = '12 AB'; ev("ACT.truckSave({id:'t2'})"); assert(/Plate format/.test(d.querySelector('#et_err').innerText), 'plate check');
    d.querySelector('#et_plate').value = ev("trk('t1').plate"); ev("ACT.truckSave({id:'t2'})"); assert(/already exists/.test(d.querySelector('#et_err').innerText), 'duplicate plate');
    d.querySelector('#et_plate').value = '222 XYZ 02'; d.querySelector('#et_kg').value = '9500'; d.querySelector('#et_kasko').value = '2027-03-31'; d.querySelector('#et_logger').value = 'L-2299'; d.querySelector('#et_adr').checked = false;
    const a0 = ev('S.audit.length'); ev("ACT.truckSave({id:'t2'})"); eq(ev("trk('t2').plate"), '222 XYZ 02'); eq(ev("trk('t2').kg"), 9500); eq(ev("S.res.fleet.kasko.t2"), '2027-03-31'); eq(ev("trk('t2').logger"), 'L-2299'); eq(ev("trk('t2').adr"), false);
    eq(ev('S.audit.length'), a0 + 1, 'audited'); assert(/Vehicle edited/.test(JSON.stringify(ev('S.audit[0]'))) && /kg/.test(JSON.stringify(ev('S.audit[0]'))), 'audit names fields'); eq(ev('S.drawer.type'), 'truck', 'back to the card');
    ev("ACT.truckEdit({id:'t2'})"); d.querySelectorAll('.et_z').forEach(x => { x.checked = false; x.dispatchEvent(new w.Event('change', { bubbles: true })); }); assert(d.querySelector('#et_save').disabled, 'save disabled without chamber');
    eq(typeof ev("truckSave('t2',{code:'V02',plate:'222 XYZ 02',kg:1,cap:1,zones:[],cargo:'2027-01-01',osago:'2027-01-01',to:'2027-01-01',calib:'2027-01-01'})"), 'string', 'no chamber refused');
    ev("ACT.setRole({v:'dispatcher'});" + R2FL + ";ACT.openT({id:'t2'})"); assert(!d.querySelector('[data-act=truckEdit]'), 'dispatcher sees Edit'); ev("ACT.truckEdit({id:'t2'})"); eq(ev('S.drawer.type'), 'truck', 'dispatcher opened the edit drawer'); eq(ev('S.toast.kind'), 'err');
  });
  await group('R2 F19 registry: full load profile (zones, pallets, volume, height, width, thermo containers / bulkhead) used by the load engine', 'en', async (g, ev, w) => {
    const d = w.document; ev(R2REG + ";ACT.rgOpen({id:'t1'})"); for (const k of ['var', 'pal', 'm3', 'hIn', 'widIn', 'tc', 'split', 'splitMin', 'splitMax', 'step']) assert(d.querySelector('#lp_' + k), 'field ' + k);
    const sel = d.querySelector('#lp_var'); sel.value = 'z2'; sel.dispatchEvent(new w.Event('change', { bubbles: true })); assert(!d.querySelector('#lp_z2box').hidden && d.querySelector('#lp_z1box').hidden, 'z2 block shown');
    d.querySelector('#lp_pal').value = '30'; d.querySelector('#lp_split').value = '30'; d.querySelector('#lp_splitMin').value = '4'; d.querySelector('#lp_splitMax').value = '24'; d.querySelector('#lp_step').value = '2';
    ev("ACT.lpSave({id:'t1'})"); assert(/Bulkhead/.test(d.querySelector('#lp_err').innerText), 'bulkhead check');
    d.querySelector('#lp_split').value = '12'; ev("ACT.lpSave({id:'t1'})"); eq(ev("trk('t1').lp.var"), 'z2'); eq(ev("trk('t1').lp.pal"), 30); eq(ev("trk('t1').lp.split"), 12); eq(ev("trk('t1').lp.tc"), null, 'tc only for z1');
    eq(ev("truckProf(trk('t1')).pal"), 30, 'engine uses the calibrated pallet places'); eq(ev("truckProf(trk('t1')).gross"), ev("trk('t1').lp.gvw"), 'gross from profile'); assert(/vehicle profile/.test(ev("profFacts(truckProf(trk('t1')))")), 'profile source marked');
    eq(ev("truckProf(trk('t4')).lpSrc"), 'class', 'class default for a catalogue profile'); assert(/class default/.test(ev("profFacts(truckProf(trk('t4')))")), 'class default marked');
    eq(ev("RES.lpSave(trk('t4'),{src:'sts',date:'2026-10-01',ref:'X',front0:2600,rear0:2200,gvw:10000,frontMax:3800,rearMax:6600,wb:470,x0:110,lenIn:620,l100:16,var:'z1',pal:'12',m3:'30.5',hIn:'220',widIn:'240',tc:'2'})"), null); eq(ev("truckProf(trk('t4')).pal"), 12); eq(ev("truckProf(trk('t4')).m3"), 30.5);
    clean(w, 'registry drawer');
  });
  await group('R2 F18/F5 onboarding: tachograph fitted / not fitted buttons, ADR item only for ADR-approved trucks', 'en', async (g, ev, w) => {
    const d = w.document; ev(R2FL + ";ACT.addT()"); d.querySelector('#nt_plate').value = '777 NEW 01'; d.querySelector('#nt_kg').value = '9000'; ev('ACT.saveT()'); const id = ev("S.trucks[S.trucks.length-1].id");
    eq(ev(`trk('${id}').adr`), false, 'ADR unchecked'); eq(ev(`trk('${id}').kg`), 9000); assert(/^V\d\d$/.test(ev(`trk('${id}').code`)), 'code');
    assert(ev(`RES.obState(trk('${id}')).items.find(i=>i.key==='adr').ok`), 'ADR item not required without ADR approval');
    ev(R2REG + `;ACT.rgOpen({id:'${id}'})`); assert(d.querySelector('[data-tacho-btns]'), 'two tachograph buttons'); ev(`ACT.obOk({id:'${id}',v:'tachograph',ref:'not fitted'})`); eq(ev(`trk('${id}').ob.items.tachograph.ref`), 'not fitted');
    ev("ACT.setRole({v:'admin'});" + R2FL + ";ACT.addT()"); d.querySelector('#nt_plate').value = '778 NEW 01'; d.querySelector('#nt_adr').checked = true; ev('ACT.saveT()'); const id2 = ev("S.trucks[S.trucks.length-1].id"); eq(ev(`trk('${id2}').adr`), true); assert(!ev(`RES.obState(trk('${id2}')).items.find(i=>i.key==='adr').ok`), 'ADR truck needs the certificate');
  });
  await group('R2 F21 fleet: fleet:write gating of registry drawer, fleet table and ACT handlers', 'en', async (g, ev, w) => {
    const d = w.document; ev("trk('t1').ob.required=true;trk('t1').ob.items.sts.ok=false;S.res.fleet.taxPaid.t1=false");
    for (const r of ['dispatcher', 'viewer', 'auditor']) {
      ev(`ACT.setRole({v:'${r}'});` + R2FL); assert(!d.querySelector('[data-act=addT]'), r + ' Add Vehicle'); assert(!d.querySelector('[data-act=flTax]'), r + ' Mark tax paid');
      ev(R2REG + ";ACT.rgOpen({id:'t1'})"); for (const a of ['obOk', 'obClose', 'lpSave', 'svcNew', 'svcSet', 'rgComply', 'truckEdit']) assert(!d.querySelector(`[data-act=${a}]`), r + ' sees ' + a);
      assert(d.querySelector('#lp_gvw').disabled && d.querySelector('#lp_src').disabled, r + ' inputs disabled'); assert(d.querySelector('[data-ro-fleet]'), 'read-only note'); assert(d.querySelector('[data-act=rgCsv]'), 'CSV stays');
      ev("ACT.obOk({id:'t1',v:'sts'})"); eq(ev("trk('t1').ob.items.sts.ok"), false, r + ' confirmed'); eq(ev('S.toast.kind'), 'err');
      ev("ACT.flTax({id:'t1'})"); eq(ev("S.res.fleet.taxPaid.t1"), false, r + ' paid tax'); const n = ev('S.trucks.length'); ev('ACT.addT()'); assert(!ev("S.drawer&&S.drawer.type==='addTruck'"), r + ' add drawer');
      const s0 = ev("trk('t3').status"); ev("ACT.toSvc({id:'t3'})"); eq(ev("trk('t3').status"), s0, r + ' toSvc'); eq(ev('S.trucks.length'), n); clean(w, r + ' registry');
    }
    ev("ACT.setRole({v:'admin'});" + R2REG + ";ACT.rgOpen({id:'t1'})"); assert(d.querySelector('[data-act=obOk]') && d.querySelector('[data-act=lpSave]'), 'admin edits');
  });
  await group('R2 S4 staff: global hub filter applies to KPIs, table, deadlines and plan', 'en', async (g, ev, w) => {
    const d = w.document; ev(R2ST); const all = d.querySelectorAll('[data-staff]').length; eq(all, ev('S.drivers.length'));
    ev("ACT.hubSet({v:'ALA'});" + R2ST); const ala = ev("S.drivers.filter(x=>x.hub==='ALA').map(x=>x.id)"); eq(d.querySelectorAll('[data-staff]').length, ala.length, 'table rows'); eq(d.querySelectorAll('[data-cal]').length, ala.length, 'plan rows');
    assert([...d.querySelectorAll('[data-docexp]')].every(x => ala.includes(x.dataset.docexp.split(':')[0])), 'deadlines filtered');
    assert(d.querySelector('.kpi-row').innerText.includes('/' + ala.length), 'medical KPI of the hub'); clean(w, 'staff ALA');
  });
  await group('R2 S5/S6/S7 staff urgent trip: vehicle 7.5 / 12.5 t, ADR approval, logger calibration, licence reasons, "later" grade', 'en', async (g, ev, w) => {
    const d = w.document; ev("trk('t2').docs.calib='2020-01-01'"); let u = ev("RES.urgent(trk('t2').hub,{hrs:6})"); assert(u.trucks.find(x => x.t.id === 't2').why.some(x => /logger calibration expired/.test(x)), 'logger reason');
    ev("trk('t4').cls='3,5 т'"); u = ev("RES.urgent(trk('t4').hub,{heavy:true})"); assert(u.trucks.find(x => x.t.id === 't4').why.some(x => /3.5 t class/.test(x)), '3.5 t reason');
    u = ev("RES.urgent(trk('t4').hub,{adr:true})"); assert(u.trucks.find(x => x.t.id === 't4').why.some(x => /no ADR approval/.test(x)), 'no ADR approval'); assert(!u.trucks.find(x => x.t.id === 't4').why.some(x => /3.5 t/.test(x)), '3.5 t only with heavy');
    ev("drv('d2').lic='B'"); u = ev("RES.urgent('ALA',{heavy:true})"); assert(u.drivers.find(x => x.d.id === 'd2').why.some(x => /licence C needed/.test(x)), 'licence C');
    ev("drv('d2').docs.find(x=>x.type==='lic').to='2020-01-01'"); u = ev("RES.urgent('ALA',{})"); assert(u.drivers.find(x => x.d.id === 'd2').why.some(x => /licence not valid/.test(x)), 'licence not valid');
    const rz = ev("(S.drivers.find(x=>x.id!=='d2'&&!loadOfDriver(x.id)&&!RES.absence(x,RES.TODAY))||{}).id"); if (rz) { ev(`drv('${rz}').status='rest';drv('${rz}').rto=9;RES.medRecord(drv('${rz}'),true);drv('${rz}').res.cont=0`); u = ev(`RES.urgent(drv('${rz}').hub,{})`); const x = u.drivers.find(y => y.d.id === rz); if (x.why.length === 1) assert(x.later, 'resting driver graded later ' + x.why); }
    ev(R2ST); assert(d.querySelector('[data-act=stHeavyTog]'), 'toggle'); ev('ACT.stHeavyTog()'); eq(d.querySelector('[data-act=stHeavyTog]').getAttribute('aria-pressed'), 'true'); assert(d.querySelector('[data-urg-t]'), 'truck rows'); clean(w, 'urgent heavy');
  });
  await group('R2 S8/S11 staff: drivers:write and fines:write gating of buttons and handlers', 'en', async (g, ev, w) => {
    const d = w.document; ev(R2ST); assert(d.querySelector('[data-act=stMed]') && d.querySelector('[data-act=absAdd]') && d.querySelector('[data-act=fineImport]'), 'admin buttons');
    for (const r of ['dispatcher', 'auditor', 'manager', 'finance']) {
      ev(`ACT.setRole({v:'${r}'});` + R2ST); for (const a of ['stMed', 'stAdr', 'stDocBook', 'stAssign', 'absAdd', 'absDel', 'stMedTog']) assert(!d.querySelector(`[data-act=${a}]`), r + ' sees ' + a);
      const fw = r === 'finance'; eq(!!d.querySelector('[data-act=fineImport]'), fw, r + ' fineImport'); clean(w, r + ' staff');
      const m0 = JSON.stringify(ev("S.res.med.d3||null")); ev("ACT.stMed({id:'d3',v:'1'})"); eq(JSON.stringify(ev("S.res.med.d3||null")), m0, r + ' recorded medical'); eq(ev('S.toast.kind'), 'err');
      const a0 = ev('S.res.abs.length'); ev("ACT.absDel({id:'AB-1'})"); eq(ev('S.res.abs.length'), a0, r + ' deleted absence');
      const l = ev("(S.loads.find(l=>l.status==='unassigned')||{}).id"); if (l) { ev(`ACT.stAssign({l:'${l}',d:'d5',t:'t4'})`); eq(ev(`load('${l}').driver||null`), null, r + ' assigned'); }
      const f0 = ev('S.res.fines.length'); ev('ACT.fineImport()'); eq(ev('S.res.fines.length'), fw ? f0 + 2 : f0, r + ' import');
    }
  });
  await group('R2 S1/S3 staff: absence-type counts and status chip from the absence type', 'en', async (g, ev, w) => {
    const d = w.document; ev(R2ST); assert(d.querySelector('#st_abs_chips'), 'chips row'); assert(d.querySelector('[data-abs-kpi=sick]'), 'sick count (d6)'); assert(/Sick leave/.test(d.querySelector('[data-st=d6]').innerText), 'status chip ' + d.querySelector('[data-st=d6]').innerText);
  });
  for (const lang of LANGS) await group('[' + lang + '] R2 audit-A screens render without undefined/NaN', lang, async (g, ev, w) => {
    ev(R2Q); clean(w, 'pod/quality'); ev("ACT.qDev({id:'DEV-0029'})"); clean(w, 'closed deviation');
    ev(R2FL); clean(w, 'fleet'); ev("ACT.flExt();ACT.fl35()"); clean(w, 'fleet demo'); ev("ACT.openT({id:'t1'})"); clean(w, 'truck drawer'); ev("ACT.truckEdit({id:'t1'})"); clean(w, 'edit drawer'); ev("ACT.addT()"); clean(w, 'add drawer');
    ev(R2REG); ev("ACT.rgCols()"); clean(w, 'registry'); ev("ACT.rgOpen({id:'t2'})"); clean(w, 'registry drawer');
    ev(R2ST); ev("ACT.stHeavyTog();ACT.stAdrTog()"); clean(w, 'staff'); ev("ACT.hubSet({v:'AST'});" + R2ST); clean(w, 'staff AST');
    for (const r of ['dispatcher', 'viewer', 'finance', 'warehouse']) { ev(`ACT.setRole({v:'${r}'})`); for (const s of ['pod', 'fleet', 'drivers']) if (ev(`canSee('${s}')`)) { ev(`go('${s}')`); clean(w, r + ' ' + s); } }
    ev("ACT.setRole({v:'admin'});go('help');ACT.helpGo({k:'fleet/registry'})"); clean(w, 'help registry'); ev("ACT.helpGo({k:'drivers/staff'})"); clean(w, 'help staff'); ev("ACT.helpGo({k:'pod/quality'})"); clean(w, 'help quality');
  });

  /* ---- R2 section b ---- */
  /* ---- R2 mirror of 0.3.9 screens 13 Driver app (D2, D7, D8, D18–D20) and 14 Planning (P5–P10) ---- */
  await group('R2 D2 driver app: non-driver roles see a read-only preview (banner, disabled buttons, gated actions)', 'ru', async (g, ev, w) => {
    const d = w.document;
    ev("go('drivers');ACT.stab({s:'drivers',v:'app'})"); assert(d.querySelector('[data-da-ro]'), 'preview banner for admin'); assert(/FR-83/.test(d.querySelector('[data-da-ro]').innerText), 'banner text');
    assert([...d.querySelectorAll('.da-phone [data-act=daChk]')].every(b => b.disabled), 'checklist buttons disabled'); assert(d.querySelector('[data-da-foot] .da-sos').disabled, 'SOS disabled in preview');
    assert(![...d.querySelectorAll('.da-tabs button')].some(b => b.disabled), 'tabs stay usable'); assert(![...d.querySelectorAll('.da-langs button')].some(b => b.disabled), 'language stays usable');
    ev("S.da.drv='d1';delete S.da.sh.d1;load('LD-2026-001850').status='assigned';render()"); ev("RES.daSeed()");
    ev("ACT.daChk({v:'tyres',s:'bad'})"); eq(ev('S.da.sh.d1.chk.tyres'), null, 'admin cannot set a checklist item'); eq(ev('S.da.feed.length'), 0, 'no event from the preview');
    const n = ev('S.inc.length'); ev("ACT.daInc({v:'sos'})"); eq(ev('S.inc.length'), n, 'SOS gated in preview');
    ev("ACT.daTab({v:'me'})"); eq(ev('S.da.tab'), 'me', 'tab switch works'); ev("ACT.daLang({v:'kk'})"); eq(ev('S.da.lang'), 'kk', 'language works'); ev("ACT.daAdr()"); assert(d.querySelector('[data-adr-text]'), 'ADR text opens in preview');
    ev("ACT.setRole({v:'dispatcher'});go('drivers');ACT.stab({s:'drivers',v:'app'})"); assert(d.querySelector('[data-da-ro]'), 'dispatcher sees the preview'); ev("ACT.daChk({v:'tyres',s:'bad'})"); eq(ev('S.da.sh.d1.chk.tyres'), null, 'dispatcher gated');
    ev("ACT.setRole({v:'driver'})"); eq(ev('S.route'), 'driverapp'); assert(!d.querySelector('[data-da-ro]'), 'no banner for the driver'); ev("ACT.daTab({v:'shift'})"); assert([...d.querySelectorAll('.da-phone [data-act=daChk]')].every(b => !b.disabled), 'driver buttons active');
    ev("ACT.daChk({v:'tyres',s:'bad'})"); eq(ev('S.da.sh.d1.chk.tyres'), 'bad', 'driver acts'); assert(ev("S.da.feed.some(e=>e.mod==='fleet')"), 'driver event sent');
  });
  await group('R2 D7/D8 driver app: multi-drop — one unload stop per consignee, ePOD sent + Next stop, delivered only after the last stop', 'ru', async (g, ev, w) => {
    const d = w.document;
    ev("ACT.setRole({v:'driver'});S.da.drv='d4'"); ev("RES.daSeed()");
    const nU = ev("S.da.sh.d4.stops.filter(s=>s.kind==='unload').length"), nC = ev("new Set(ops(load('LD-2026-001847')).orders.map(o=>o.to+'|'+o.city)).size");
    assert(nU >= 2, 'several unload stops'); eq(nU, nC, 'one stop per consignee'); eq(ev("S.da.sh.d4.stops.filter(s=>s.kind==='unload').reduce((a,s)=>a+s.pal,0)"), ev("ops(load('LD-2026-001847')).orders.reduce((a,o)=>a+o.pal,0)"), 'pallets split over the stops');
    ev("const sh=S.da.sh.d4;sh.departed=true;sh.stops.forEach(s=>{if(s.kind!=='unload')s.st='done'})"); ev("ACT.daTab({v:'route'})"); eq(d.querySelectorAll('[data-act=daArrive]').length, 1, 'arrive button at the current stop');
    const sign = (id) => { ev(`ACT.daArrive({v:'${id}'})`); eq(ev('S.da.tab'), 'stop'); ev("ACT.daStep({v:'1'})"); ev("document.querySelector('#da_tmin').value=3;document.querySelector('#da_tmax').value=6;ACT.daThermo()"); ev("ACT.daScanAll();ACT.daStep({v:'3'});ACT.daPhoto();ACT.daStep({v:'4'});RES.daSignDemo()"); ev("document.querySelector('#da_signer').value='Aigul Saparova';document.querySelector('#da_role').value='clerk';ACT.daSign()"); };
    const ids = ev("S.da.sh.d4.stops.filter(s=>s.kind==='unload').map(s=>s.id)");
    sign(ids[0]); assert(d.querySelector('[data-epod-sent]'), 'ePOD sent card'); assert(/Следующая точка/.test(d.querySelector('[data-act=daNext]').innerText), 'Next stop button');
    assert(d.querySelector('[data-epod-scan]') && /\d+ \/ \d+/.test(d.querySelector('[data-epod-scan]').innerText), 'D8 scanned n / m'); assert(d.querySelector('[data-epod-sig]') && /SHA-256/.test(d.querySelector('[data-epod-sig]').innerText), 'D8 signature hash');
    eq(ev("load('LD-2026-001847').status"), 'in_transit', 'not delivered after the first stop'); eq(ev("load('LD-2026-001847').epodStops.length"), 1);
    ev(`ACT.daNext({v:'${ids[0]}'})`); eq(ev(`S.da.sh.d4.stops.find(s=>s.id==='${ids[0]}').st`), 'done'); eq(ev('S.da.tab'), 'route', 'back to the route');
    for (let i = 1; i < ids.length - 1; i++) { sign(ids[i]); ev(`ACT.daNext({v:'${ids[i]}'})`); }
    sign(ids[ids.length - 1]); eq(ev("load('LD-2026-001847').status"), 'delivered', 'delivered after the last stop'); eq(ev("load('LD-2026-001847').epodStops.length"), ids.length, 'one ePOD per stop'); eq(ev("load('LD-2026-001847').pod"), 'submitted');
  });
  await group('R2 D18 driver app: "ADR instructions in writing" toggle in the footer of every tab', 'en', async (g, ev, w) => {
    const d = w.document;
    ev("ACT.setRole({v:'driver'});ACT.daLang({v:'en'})");
    for (const t of ['shift', 'route', 'stop', 'ret', 'fuel', 'me']) { ev(`ACT.daTab({v:'${t}'})`); assert(d.querySelector('[data-da-foot] [data-act=daAdr]'), 'ADR button on ' + t); }
    assert(!d.querySelector('[data-adr-text]'), 'closed by default'); assert(/ADR instructions in writing/.test(d.querySelector('[data-act=daAdr]').innerText), 'label');
    ev("ACT.daAdr()"); assert(/call 112 and the dispatcher/.test(d.querySelector('[data-adr-text]').innerText), 'instruction text'); eq(d.querySelector('[data-act=daAdr]').getAttribute('aria-expanded'), 'true');
    ev("ACT.daAdr()"); assert(!d.querySelector('[data-adr-text]'), 'toggles closed');
  });
  await group('R2 D19/D20 driver app: footer "Report deviation" and SOS on every tab', 'ru', async (g, ev, w) => {
    const d = w.document;
    ev("ACT.setRole({v:'driver'});S.da.drv='d4'");
    for (const t of ['shift', 'route', 'stop', 'ret', 'fuel', 'me']) { ev(`ACT.daTab({v:'${t}'})`); assert(d.querySelector('[data-da-foot] [data-da-dev]') && d.querySelector('[data-da-foot] .da-sos'), 'footer buttons on ' + t); }
    const n = ev('S.inc.length'); d.querySelector('[data-da-foot] .da-sos').click(); eq(ev('S.inc.length'), n + 1, 'SOS from the footer'); eq(ev('S.inc[0].lvl'), 3, 'SOS is level 3');
    d.querySelector('[data-da-foot] [data-da-dev]').click(); assert(ev("S.devs.some(x=>x.load==='LD-2026-001847')"), 'deviation opened in Quality'); assert(ev("S.da.feed.some(e=>e.mod==='quality')"), 'event to dispatch');
    ev("ACT.setRole({v:'admin'});go('drivers');ACT.stab({s:'drivers',v:'app'})"); d.querySelector('[data-da-foot] [data-da-dev]').click(); eq(ev('S.route'), 'pod', 'preview → Quality'); eq(ev('S.tab.pod'), 'quality');
  });
  const R2PL = "go('dispatch');ACT.stab({s:'dispatch',v:'planning'})";
  await group('R2 P7 planning: row "Weather / road risk" per day, blizzard scenario = high on days 2–3', 'ru', async (g, ev, w) => {
    const d = w.document;
    ev(R2PL); assert(d.querySelector('[data-wx-row]'), 'row label'); eq(d.querySelectorAll('[data-wx-day]').length, 7, '7 cells');
    for (let i = 0; i < 7; i++) eq(+d.querySelectorAll('[data-wx-day]')[i].dataset.wxLvl, ev(`planWx(${i}).lvl`), 'level day ' + i);
    ev("ACT.plScen({v:'storm'})"); const c = d.querySelectorAll('[data-wx-day]'); eq(c[2].dataset.wxLvl, '3'); eq(c[3].dataset.wxLvl, '3'); assert(c[2].classList.contains('crit'), 'red'); eq(c[2].innerText.trim(), 'высокий');
  });
  await group('R2 P8 planning: recommendation kinds — shortfall with affected trips, weather, scenario texts, capacity sufficient', 'ru', async (g, ev, w) => {
    const d = w.document;
    ev("S.trucks.forEach(t=>t.status='service')"); ev(R2PL);
    const sf = [...d.querySelectorAll('[data-plan-rec=shortfall]')]; assert(sf.length >= 1, 'shortfall recs'); assert(/затронуты: LD-/.test(sf.map(x => x.innerText).join(' ')), 'affected trips'); assert(/запрос передачи партнёру/.test(sf[0].innerText), 'actions text');
    ev("ACT.plScen({v:'storm'});ACT.plScen({v:'repair'});ACT.plScen({v:'peak'})"); eq(d.querySelectorAll('[data-plan-rec=scen]').length, 3, 'three scenario texts'); assert(d.querySelectorAll('[data-plan-rec=weather]').length >= 2, 'weather recs (days 2–3)');
    assert(/Костанай и Актобе/.test(d.querySelector('[data-plan-recs]').innerText), 'blizzard text');
    ev("S.trucks.forEach(t=>t.status='available');S.ops.scen={storm:false,repair:false,peak:false};S.ops.storm=[];S.loads.forEach(l=>{if(l.status!=='delivered')l.eta='2031-01-10T10:00:00+05:00'});S.express.forEach(e=>e.status='expired');render()");
    eq(d.querySelectorAll('[data-plan-rec=shortfall]').length, 0); const ok = d.querySelector('[data-plan-rec=ok]'); assert(ok && /Мощности достаточно на 7 дней\. Резерв — \d+ пал\./.test(ok.innerText), 'capacity sufficient with reserve');
    eq(ev("planRecs().find(r=>r[0]==='ok')[1].match(/(\\d+) пал/)[1]*1"), ev("Math.min(...planCapacity(false).map(r=>r.cap-r.dem))"), 'reserve = min(cap - demand)');
  });
  await group('R2 P9 planning: shortfall action buttons route to Partners, Cost model, Express; hidden without trips:write', 'ru', async (g, ev, w) => {
    const d = w.document;
    ev("S.trucks.forEach(t=>t.status='service')"); ev(R2PL); assert(d.querySelector('[data-plan-actions]'), 'buttons with a shortfall'); eq(d.querySelectorAll('[data-act=r2PlGo]').length, 3);
    d.querySelector('[data-act=r2PlGo][data-v=partners]').click(); eq(ev('S.route'), 'dispatch'); eq(ev('S.tab.dispatch'), 'partners');
    ev(R2PL); d.querySelector('[data-act=r2PlGo][data-v=cost]').click(); eq(ev('S.route'), 'billing'); eq(ev('S.tab.billing'), 'model');
    ev(R2PL); d.querySelector('[data-act=r2PlGo][data-v=express]').click(); eq(ev('S.route'), 'dispatch'); eq(ev('S.tab.dispatch'), 'express');
    ev("ACT.setRole({v:'manager'})"); if (ev("canSee('dispatch')")) { ev(R2PL); if (ev("S.tab.dispatch")==='planning') assert(!d.querySelector('[data-plan-actions]'), 'no buttons without trips:write'); }
    ev("ACT.setRole({v:'admin'});S.trucks.forEach(t=>t.status='available');" + R2PL); ev("S.loads.forEach(l=>{if(l.status!=='delivered')l.eta='2031-01-10T10:00:00+05:00'});S.express.forEach(e=>e.status='expired');render()"); assert(!d.querySelector('[data-plan-actions]'), 'no buttons without a shortfall');
  });
  await group('R2 P10/P5/P6 planning: "Planning factors" card (7 rows), service note in Trucks available, drivers row amber', 'ru', async (g, ev, w) => {
    const d = w.document;
    ev(R2PL); const pf = d.querySelector('[data-plan-factors]'); assert(pf && /Факторы планирования/.test(pf.innerText), 'card'); eq(pf.querySelectorAll('[data-pf]').length, 7, '7 factors'); assert(/Прогноз спроса/.test(pf.innerText) && /KazAvtoZhol/.test(pf.innerText), 'factor texts');
    const day0 = ev('planCapacity(false)[0].d'); assert(ev(`planDown('${day0}').some(t=>t.id==='t7')`), 't7 has an open service request today'); const sv = d.querySelector(`[data-svc-note][data-day="${day0}"]`); assert(sv && sv.innerText.includes(ev("trk('t7').plate")), 'service note with the plate');
    const rows = ev('planCapacity(false)'); eq(d.querySelectorAll('[data-drv-warn]').length, rows.filter(r => r.drivers < r.trucks + 1).length, 'amber drivers cells');
  });
  for (const lang of LANGS) await group('[' + lang + '] R2 driver app footer / preview and planning extensions render without undefined/NaN', lang, async (g, ev, w) => {
    ev("go('drivers');ACT.stab({s:'drivers',v:'app'});ACT.daAdr()"); clean(w, 'driver app preview'); assert(w.document.querySelector('[data-da-ro]'), 'banner ' + lang);
    ev("ACT.setRole({v:'driver'})"); for (const t of ['shift', 'route', 'stop', 'ret', 'fuel', 'me']) { ev(`ACT.daTab({v:'${t}'})`); clean(w, 'driver ' + t); }
    ev("RES.daSeed();const sh=S.da.sh[S.da.drv];sh.departed=true;sh.stops.forEach(s=>{if(s.kind!=='unload')s.st='done'});const u=sh.stops.find(s=>s.kind==='unload');if(u){u.st='arrived';u.step=5;u.epod={at:'20.10 10:00',lat:'43.2',lon:'76.9',temp:{min:3,max:5,ok:true},photo:'a7f3…c2',signer:'Aigul',role:'clerk',sig:true,stop:u.name,scanned:2,exp:2,sigHash:'e1…9d'}};ACT.daTab({v:'stop'})"); clean(w, 'stop ePOD sent');
    ev("ACT.setRole({v:'admin'});" + R2PL); clean(w, 'planning'); ev("ACT.plScen({v:'storm'});ACT.plScen({v:'repair'});ACT.plScen({v:'peak'})"); clean(w, 'planning scenarios'); ev("ACT.plTarget()"); clean(w, 'planning target fleet');
    ev("go('help');ACT.helpGo({k:'drivers/app'})"); clean(w, 'help drivers/app'); ev("ACT.helpGo({k:'dispatch/planning'})"); clean(w, 'help dispatch/planning');
  });

  /* ---- R2 section c ---- */
  /* ---- R2 mirror (letter c): 0.3.9 functions of Partners, partner portal and Reports → Fines ported into v6 ---- */
  const R2PT = "go('dispatch');ACT.dtab({v:'partners'})", R2FN = "go('reports');ACT.stab({s:'reports',v:'fines'})";
  await group('R2 P14 partners: GDP qualification date per candidate, expired qualification refuses a pharma handover (FR-117)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'})"); eq(ev("partnerGdpUntil(S.partners.find(p=>p.id==='PL-01'))"), '2027-11-12', 'PL-01 = Q-001'); eq(ev("partnerGdpUntil(S.partners.find(p=>p.id==='PL-04'))"), '2026-09-30', 'PL-04 expired');
    ev("const p4=S.partners.find(p=>p.id==='PL-04');p4.city='ALA';p4.cap='40';S.ptx.ho.load='LD-2026-001852';S.ptx.ho.mode='full';" + R2PT);
    const ok2 = w.document.querySelector('[data-cand-gdp=PL-02]'); assert(ok2, 'chip for PL-02'); eq(ok2.dataset.gdpSt, 'valid'); assert(/GDP-квалификация до 30\.06\.2027/.test(ok2.innerText), 'green text: ' + ok2.innerText);
    const x4 = w.document.querySelector('[data-cand-gdp=PL-04]'); assert(x4, 'chip for PL-04'); eq(x4.dataset.gdpSt, 'expired'); assert(/истекла 30\.09\.2026/.test(x4.innerText), 'red text: ' + x4.innerText);
    assert(/нет GDP для фармы/.test(w.document.querySelector('[data-cand=PL-04]').innerText), 'reason shown on the candidate'); assert(!w.document.querySelector('[data-cand=PL-04] [data-act=hoGive]'), 'no handover button for the expired partner');
    const n = ev('S.handovers.length'); ev("ACT.hoGive({id:'PL-04'})"); eq(ev('S.handovers.length'), n, 'expired qualification refused'); assert(/30\.09\.2026/.test(ev('S.ptx.ho.err')), 'refusal names the date'); eq(ev('S.toast.kind'), 'err');
    w.document.querySelector('#ho_l').value = 'LD-2026-001852'; ev("document.querySelector('#ho_p').value='PL-04';ACT.hoNew()"); eq(ev('S.handovers.length'), n, 'classic form refuses too');
    ev("S.pquals.push({id:'Q-090',partner:'PL-04',company:'x',cert:'c.pdf',audit:'2026-10-01',until:'2027-12-31',status:'pending'});ACT.cmPqOk({id:'Q-090'})"); eq(ev("partnerGdpUntil(S.partners.find(p=>p.id==='PL-04'))"), '2027-12-31', 'approved submission sets the date');
    ev(R2PT); eq(w.document.querySelector('[data-cand-gdp=PL-04]').dataset.gdpSt, 'valid'); ev("ACT.hoGive({id:'PL-04'})"); eq(ev('S.handovers.length'), n + 1, 'handover now possible'); eq(ev('S.handovers[S.handovers.length-1].st'), 'pending', 'silver needs approval');
    clean(w, 'partners after GDP checks');
  });
  await group('R2 P17 partners: one service-request list on S.res.svc, close with actual cost, discard draft (FR-125)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});" + R2PT); const seeded = ev("S.res.svc.map(s=>s.id)"); assert(seeded.length >= 2, 'seeded SRs'); for (const id of seeded) assert(w.document.querySelector(`[data-sr="${id}"]`), 'listed ' + id);
    const free = ev("[...document.querySelectorAll('[data-act=ptCallWs]')].map(b=>b.dataset.id)[0]"); if (free) { ev(`ACT.ptCallWs({id:'${free}'})`); const ref = ev(`S.ptx.called['${free}']`); if (/^SR-/.test(ref)) assert(w.document.querySelector(`[data-sr="${ref}"]`), 'Call service request in the same list'); }
    const n = ev('S.res.svc.length'); ev('ACT.wrNew()'); eq(ev('S.res.svc.length'), n + 1, 'created through RES.svcCreate'); const s = ev('S.res.svc[0]'); eq(s.wr, 'WR-001'); assert(/^SR-\d{4}$/.test(s.id), 'SR id');
    const inp = w.document.querySelector('#wc_WR-001'); assert(inp, 'actual cost field'); eq(inp.value, '120000', 'prefilled with the lower bound of the estimate'); eq(inp.step, '100');
    inp.value = '0'; ev("ACT.wrClose({id:'WR-001'})"); assert(ev(`S.res.svc.find(x=>x.id==='${s.id}').status`) !== 'done', 'zero cost refused');
    const c0 = ev('S.costs.length'); w.document.querySelector('#wc_WR-001').value = '95000'; ev("ACT.wrClose({id:'WR-001'})"); const done = ev(`S.res.svc.find(x=>x.id==='${s.id}')`); eq(done.status, 'done'); eq(done.cost, 95000);
    eq(ev('S.costs.length'), c0 + 1, 'ledger entry'); const c = ev(`S.costs.find(x=>x.ref==='${s.id}')`); eq(c.cat, 'service'); eq(c.amount, 95000); eq(c.veh, ev(`(ECO_VOF||{})['${s.truck}']||null`), 'vehicle mapped by ECO_VOF');
    assert(/факт 95 000/.test(w.document.querySelector(`[data-sr-actual="${s.id}"]`).innerText.replace(/\s/g, ' ')), 'actual line'); eq(w.document.querySelector(`[data-sr="${s.id}"]`).dataset.srSt, 'done');
    ev("S.res.svc.unshift({id:'SR-0900',truck:'t3',kind:'defect',status:'draft',src:'defect',partner:'',cost:0,log:[],created:NOW.toISOString(),text:'x'});render()");
    const dr = w.document.querySelector('[data-sr="SR-0900"]'); eq(dr.dataset.srSt, 'draft'); assert(/черновик из приложения водителя · дефект в конце смены/.test(dr.innerText) && /сервис не выбран/.test(dr.innerText), 'draft texts'); assert(!dr.querySelector('[data-act=wrClose]') && dr.querySelector('[data-act=wrDiscard]'), 'draft: discard only');
    ev("ACT.wrDiscard({id:'SR-0900'})"); eq(ev("S.res.svc.find(x=>x.id==='SR-0900').status"), 'cancelled'); clean(w, 'service requests');
    ev("S.res.svc=[];render()"); assert(/Заявок нет\./.test(w.document.querySelector('#pt_sr').innerText), 'empty state');
  });
  await group('R2 P21 partners: write controls only with partners:write, read-only roles keep lists and contacts', 'ru', async (g, ev, w) => {
    const WSEL = '[data-act=ptRenew],[data-act=ptRenewOk],[data-act=ptDemote],[data-act=ptDemoteOk],[data-act=ptUnb],[data-act=ptTask],[data-act=hoGive],[data-act=hoOk],[data-act=hoPortal],[data-act=hoEpod],[data-act=ptCallWs],[data-act=wrNew],[data-act=wrClose],[data-act=wrDiscard]';
    ev("ACT.setRole({v:'dispatcher'});" + R2PT); assert(w.document.querySelectorAll(WSEL).length >= 3, 'dispatcher sees write controls');
    ev("ACT.ptDemote({id:'PW-06'})"); eq(ev("S.ptx.demote['PW-06'].st"), 'wait', 'dispatcher proposes');
    for (const r of ['warehouse', 'auditor', 'viewer', 'manager', 'finance', 'quality']) {
      ev(`ACT.setRole({v:'${r}'})`); if (!ev("canSee('dispatch')")) continue; ev(R2PT); clean(w, 'partners as ' + r);
      eq(w.document.querySelectorAll(WSEL).length, 0, r + ': write controls hidden'); assert(w.document.querySelector('#pt_table [data-act=ptContact]'), r + ': contacts kept'); assert(w.document.querySelectorAll('[data-partner]').length > 0 && w.document.querySelector('#pt_cov') && w.document.querySelector('#pt_sr'), r + ': lists kept');
      const t0 = ev('(S.tasks||[]).length'), s0 = ev('S.res.svc.length'), sec = ev('!!S.ptx.sec.KST'); ev("ACT.ptTask({id:'LD-X:0',c:'BAL'});ACT.wrNew();ACT.ptSec({id:'KST'});ACT.ptDemoteOk({id:'PW-06'})");
      eq(ev('(S.tasks||[]).length'), t0, r + ': task'); eq(ev('S.res.svc.length'), s0, r + ': request'); eq(ev('!!S.ptx.sec.KST'), sec, r + ': city toggle'); eq(ev("S.partners.find(p=>p.id==='PW-06').tier"), 'silver', r + ': demotion approval'); assert(/partners:write/.test(ev('S.toast.msg')), r + ': error toast');
    }
    ev("ACT.setRole({v:'admin'});ACT.ptDemoteOk({id:'PW-06'})"); eq(ev("S.partners.find(p=>p.id==='PW-06').tier"), 'bronze', 'second person with partners:write approves');
  });
  await group('R2 PP8 partner portal: full GDP certificate submission form with server rules (FR-172)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'partner'});go('pprofile')"); assert(w.document.querySelector('[data-pp-cur=Q-001]'), 'current qualification'); assert(/3 ТС/.test(w.document.querySelector('[data-pp-cur=Q-001]').innerText), 'vehicle count'); assert(!w.document.querySelector('#pp_qform'), 'form closed');
    ev('ACT.ppQOpen()'); const f = w.document.querySelector('#pp_qform'); assert(f, 'form opens'); for (const k of ['q.vehicles', 'q.audit', 'q.until', 'q.ins', 'q.note']) assert(w.document.getElementById('pp_' + k), 'field ' + k); eq(w.document.querySelectorAll('[data-ppcls]').length, 3, 'three classes'); assert(w.document.querySelector('[data-ppcls=cold]').checked, 'cold checked by default');
    const n = ev('S.pquals.length'), send = () => ev('ACT.ppQual()'), msg = () => ev('PP.msg');
    send(); assert(/сертификат/.test(msg()), 'certificate required'); ev("ACT.ppCert({v:'q'})"); assert(/SHA-256/.test(w.document.querySelector('#pp_qform').innerText), 'sha shown');
    ev("PP.q.cls={cold:false,frozen:false,ambient:false}"); send(); assert(/класс/.test(msg()), 'one class required'); ev("PP.q.cls.cold=true;PP.q.cls.frozen=true");
    send(); assert(/даты/.test(msg()), 'dates required');
    ev("PP.q.audit='2026-11-01';PP.q.until='2028-01-01';PP.q.ins='2027-06-30'"); send(); assert(/будущем/.test(msg()), 'audit in the future');
    ev("PP.q.audit='2026-09-01';PP.q.until='2026-08-01'"); send(); assert(/раньше/.test(msg()), 'valid until before audit');
    ev("PP.q.until='2028-09-01';PP.q.ins='2026-10-01'"); send(); assert(/Страховка/.test(msg()), 'insurance expired');
    ev("PP.q.ins='2027-06-30';PP.q.vehicles='123 ABC 01, 456 DEF 01;789 GHI 01';PP.q.note='Audit by KZ inspector'"); send(); eq(ev('S.pquals.length'), n + 1, 'stored');
    const q = ev('S.pquals[S.pquals.length-1]'); eq(q.status, 'pending'); eq(q.vehicles.length, 3); eq(q.classes.join(','), 'cold,frozen'); eq(q.audit, '2026-09-01'); eq(q.until, '2028-09-01'); eq(q.insuranceUntil, '2027-06-30'); assert(q.created_by && q.sha.length === 64, 'creator and sha');
    assert(!w.document.querySelector('#pp_qform'), 'form closed after sending'); assert(new RegExp('Заявка № ' + q.id + ' · ждёт проверки').test(w.document.querySelector('[data-pp-qmsg]').innerText), 'confirmation message'); assert(w.document.querySelector(`[data-pp-sub="${q.id}"]`), 'own submission listed'); clean(w, 'pprofile after submit');
    ev("ACT.ppQOpen();ACT.ppCert({v:'q'});PP.q.audit='2026-09-01';PP.q.until='2028-09-01';PP.q.ins='2027-06-30';ACT.ppQual()"); eq(ev('S.pquals.length'), n + 1, 'second pending refused'); assert(/уже ожидает/.test(msg()), 'one pending submission per partner'); ev('ACT.ppQCancel()'); assert(!w.document.querySelector('#pp_qform'), 'cancel closes');
    ev("ACT.setRole({v:'admin'});" + R2PT); assert(/3 ТС/.test(w.document.querySelector('[data-gdp-pending]').innerText), 'staff sees the vehicle count');
    ev("go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'crm'})"); const pv = w.document.querySelector('[data-pq-veh]'); assert(pv && /3 ТС/.test(pv.innerText), 'CRM GDP review shows the vehicle count'); ev(R2PT);
    ev(`ACT.cmPqOk({id:'${q.id}'})`); eq(ev("partnerGdpUntil(S.partners.find(p=>p.id==='PL-01'))"), '2028-09-01', 'approval extends the qualification');
  });
  await group('R2 R3 fines: 50 % discount reminder lines above the table (FR-124)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});S.eco.fines.find(f=>f.id==='FN-1021').due='2026-10-23';" + R2FN); let r = w.document.querySelector('[data-fine-rem="FN-1021"]'); assert(r, 'reminder line');
    assert(/Скидка 50 % истекает: FN-1021 до 23\.10\.2026 — осталось 5 дн\. · напоминание за 2 дня и в день срока/.test(r.innerText), 'default suffix: ' + r.innerText); assert(r.classList.contains('yellow'), 'yellow hint');
    ev("S.eco.fines.find(f=>f.id==='FN-1021').due='2026-10-12';render()"); r = w.document.querySelector('[data-fine-rem="FN-1021"]'); assert(/до 12\.10\.2026 — осталось -6 дн\. · напоминание отправлено бухгалтерии/.test(r.innerText), 'due reached -> accounting: ' + r.innerText);
    eq(w.document.querySelectorAll('[data-fine-rem]').length, 1, 'only unpaid fines within 7 days'); ev('ACT.ecoFineImport()'); assert(w.document.querySelector('[data-fine-rem="FN-1024"]'), 'imported FN-1024 qualifies'); assert(/Импорт выполнен · 18\.10 \d\d:\d\d/.test(w.document.querySelector('[data-act=ecoFineImport]').innerText), 'import timestamp');
    ev("ACT.ecoFineSt({id:'FN-1024',v:'paid50'})"); assert(!w.document.querySelector('[data-fine-rem="FN-1024"]'), 'paid fine leaves the reminders'); clean(w, 'fines reminders');
  });
  await group('R2 R7 fines: Notify driver once, already sent, no app account, role rule', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});" + R2FN + ";ACT.ecoFineSel({id:'FN-1021'})"); const b = w.document.querySelector('[data-act=ecoFineNotify][data-id=FN-1021]'); assert(b, 'Notify driver button'); eq(b.innerText.trim(), 'Уведомить водителя');
    const a0 = ev('S.audit.length'); ev("ACT.ecoFineNotify({id:'FN-1021'})"); const f = ev("S.eco.fines.find(f=>f.id==='FN-1021')"); eq(f.notified, 'N-1'); assert(/Уведомление отправлено: .+ \(приложение водителя\)/.test(ev('S.toast.msg')), 'toast'); eq(ev('S.audit.length'), a0 + 1, 'audited');
    const m = ev('S.eco.notifs[0]'); eq(m.kind, 'fine'); eq(m.drv, 'd5'); eq(m.params.fine, 'FN-1021'); eq(m.params.amount, 29500); assert(m.params.veh && m.params.date && m.params.time, 'plate, date, time');
    assert(/Штрафы · FN-1021 · уведомление водителю DRV-005/.test(w.document.querySelector('[data-fine-log=FN-1021]').innerText), 'log line'); assert(/водителю и бухгалтерии/.test(w.document.querySelector('[data-fine-rem="FN-1021"]').innerText), 'reminder says driver and accounting');
    ev("ACT.ecoFineNotify({id:'FN-1021'})"); eq(ev('S.eco.notifs.length'), 1, 'only once'); assert(/уже отправлено/.test(ev('S.toast.msg')), 'already sent');
    ev("ACT.ecoFineImport();drv('d2').app=false;ACT.ecoFineNotify({id:'FN-1024'})"); assert(!ev("S.eco.fines.find(f=>f.id==='FN-1024').notified"), 'no app account -> not sent'); assert(/нет учётной записи приложения/.test(ev('S.toast.msg')), 'no account message');
    ev("ACT.ecoFineSel({id:'FN-1002'})"); assert(!w.document.querySelector('[data-act=ecoFineNotify]'), 'unattributed fine: no button');
    ev("ACT.setRole({v:'dispatcher'});" + R2FN + ";ACT.ecoFineSel({id:'FN-1021'})"); assert(!w.document.querySelector('[data-act=ecoFineNotify]') && !w.document.querySelector('[data-act=ecoFineSt]'), 'no fines:write -> no fine buttons');
    ev("ACT.setRole({v:'finance'});" + R2FN + ";ACT.ecoFineSel({id:'FN-1015'})"); assert(w.document.querySelector('[data-act=ecoFineNotify][data-id=FN-1015]'), 'finance may notify'); clean(w, 'fines as finance');
  });
  for (const lang of LANGS) await group('R2 [' + lang + '] partners, portal GDP form and fines render without undefined / NaN', lang, async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});S.ptx.ho.load='LD-2026-001852';" + R2PT); clean(w, 'partners ' + lang); assert(w.document.querySelectorAll('[data-cand-gdp]').length >= 1, 'GDP chips'); assert(w.document.querySelector('[data-kpi-type=ws]') && w.document.querySelector('[data-kpi-type=lp]'), 'KPI by type');
    ev("ACT.wrNew();S.res.svc.unshift({id:'SR-0901',truck:'t3',kind:'defect',status:'draft',partner:'',cost:0,log:[],created:NOW.toISOString(),text:'x'});render()"); clean(w, 'service requests ' + lang);
    ev("ACT.setRole({v:'viewer'});" + R2PT); clean(w, 'partners read-only ' + lang);
    ev("ACT.setRole({v:'partner'});go('pprofile');ACT.ppQOpen();ACT.ppCert({v:'q'})"); clean(w, 'GDP form ' + lang); ev("PP.q.audit='2026-09-01';PP.q.until='2028-09-01';PP.q.ins='2027-06-30';ACT.ppQual()"); clean(w, 'GDP submitted ' + lang);
    ev("ACT.setRole({v:'admin'});" + R2FN + ";ACT.ecoFineImport();ACT.ecoFineSel({id:'FN-1021'});ACT.ecoFineNotify({id:'FN-1021'})"); clean(w, 'fines ' + lang); assert(w.document.querySelectorAll('[data-fine-rem]').length >= 2, 'reminders');
    if (lang === 'de' || lang === 'en') { const cy = ev("(()=>{const t=document.querySelector('#root').innerText.replace(/ТОО|ИП/g,'');const m=t.match(/[А-Яа-яЁё]{3,}/);return m?m[0]:''})()"); eq(cy, '', lang + ' fines without Cyrillic');
      ev(R2PT); const cp = ev("(()=>{const bad=[];document.querySelectorAll('#pt_sr, #pt_ho, #pt_table .actbar').forEach(e=>{const m=e.innerText.replace(/ТОО|ИП/g,'').match(/[А-Яа-я]{3,}/);if(m)bad.push(m[0])});return bad.join(',')})()"); eq(cp, '', lang + ' partner panels without Cyrillic'); }
    ev("go('help');ACT.helpGo({k:'dispatch/partners'})"); clean(w, 'help partners ' + lang); ev("ACT.helpGo({k:'reports/fines'})"); clean(w, 'help fines ' + lang);
  });

  /* ---- R2 section d ---- */
  /* ---- R2 · port d: 0.3.9 /drivers, /planning, /master-data, /users, /account, /integrations (audit D) ---- */
  await group('R2 drivers: IIN / phone masked, "Show personal data" only with pii:read and audited (D2 / D3 / D6)', 'ru', async (g, ev, w) => {
    ev("go('drivers')"); eq(w.document.querySelector('[data-pii-iin="d1"]').innerText, '••••••••1960', 'IIN mask'); assert(w.document.querySelector('[data-pii-phone="d3"]').innerText.startsWith('•••• 68'), 'phone mask');
    assert(w.document.querySelector('[data-pii-note]'), 'audit note above the table'); assert(w.document.querySelector('[data-pii-btn="d1"]'), 'admin has the button');
    const a0 = ev('S.audit.length'); ev("ACT.drvPii({id:'d1'})"); eq(w.document.querySelector('[data-pii-iin="d1"]').innerText, '880512301960', 'revealed'); eq(ev('S.audit.length'), a0 + 1, 'one audit entry'); eq(ev('S.audit[0].reason'), 'iin,phone,license_no'); eq(w.document.querySelector('[data-pii-iin="d2"]').innerText, '••••••••7940', 'other driver stays masked');
    ev("ACT.openD({id:'d2'})"); eq(w.document.querySelector('[data-pii-iin="d1"]').innerText, '••••••••1960', 'masked again after opening another driver'); eq(w.document.querySelector('[data-dpii="phone"]').innerText, '•••• 99', 'drawer phone masked');
    for (const r of ['dispatcher', 'viewer']) { ev(`ACT.setRole({v:'${r}'});go('drivers')`); if (ev("S.route") !== 'drivers') continue; assert(!w.document.querySelector('[data-pii-btn]'), r + ' sees the button'); assert(!w.document.querySelector('[data-act="addD"]') && !w.document.querySelector('[data-act="impD"]'), r + ' sees add / import'); eq(ev("driverPiiReveal('d1')"), false, r + ' can reveal'); assert(/^•+/.test(w.document.querySelector('[data-pii-iin="d1"]').innerText), r + ' mask'); }
  });
  await group('R2 drivers: add-driver form — name 3–150, IIN 12 digits, phone pattern, licence / ADR dates, drivers:write (D5 / D7)', 'en', async (g, ev, w) => {
    ev("go('drivers');ACT.addD()"); const f = w.document.querySelector('[data-add-driver]'); assert(f, 'form'); eq(w.document.querySelector('#nd_iin').placeholder, '12 digits'); eq(w.document.querySelector('#nd_phone').placeholder, '+7 7xx xxx xx xx');
    assert(/stored encrypted and shown masked/.test(f.innerText), 'encryption note');
    eq(ev("driverCreate({name:'Al'})"), 'Invalid input: full_name'); eq(ev("driverCreate({name:'Aidos Test',iin:'12345'})"), 'Invalid input: iin'); eq(ev("driverCreate({name:'Aidos Test',phone:'abc'})"), 'Invalid input: phone');
    const n = ev('S.drivers.length'); w.document.querySelector('#nd_name').value = 'Aidos Testov'; w.document.querySelector('#nd_iin').value = '900101300123'; w.document.querySelector('#nd_phone').value = '+7 701 555 00 11'; w.document.querySelector('#nd_licno').value = 'KZ 04 999999'; w.document.querySelector('#nd_licto').value = '2031-03-01'; w.document.querySelector('#nd_adr').value = '2027-04-30';
    ev('ACT.saveD()'); eq(ev('S.drivers.length'), n + 1, 'created'); const d = ev('S.drivers[S.drivers.length-1]'); eq(d.docs[0].to, '2031-03-01', 'licence until'); eq(d.res.adr, '2027-04-30', 'ADR until'); eq(d.iin, '900101300123');
    assert(/driver\.created/.test(ev('S.audit[0].reason')), 'audit driver.created'); ev("closeDrawer();go('drivers')"); eq(w.document.querySelector(`[data-pii-iin="${d.id}"]`).innerText, '••••••••0123', 'new driver masked');
    ev("ACT.setRole({v:'auditor'})"); assert(typeof ev("driverCreate({name:'No Right'})") === 'string', 'auditor creates drivers'); ev("ACT.addD()"); assert(!w.document.querySelector('[data-add-driver]'), 'auditor opens the form');
  });
  await group('R2 lines: cancel departure needs a reason (≥ 3), flags bookings on the lane, chip on Orders → Bookings, restore (P3)', 'en', async (g, ev, w) => {
    ev("S.tab.routes='lines';go('routes')"); const dep = ev("RES.departures(14).find(d=>!d.cancelled&&d.line.id==='LN-5')"); ev(`ACT.lnExcAsk({id:'LN-5',d:'${dep.iso}'})`);
    assert(w.document.querySelector('[data-ln-ask]'), 'inline form'); eq(w.document.querySelector('#ln_date').value, dep.iso, 'date prefilled'); w.document.querySelector('#ln_why').value = 'ab'; ev("ACT.lnExc({id:'LN-5'})"); eq(w.document.querySelector('#ln_err').innerText, 'At least 3 characters');
    w.document.querySelector('#ln_why').value = 'Road closed by akimat'; ev("ACT.lnExc({id:'LN-5'})"); const ex = ev(`S.res.exc.find(e=>e.line==='LN-5'&&e.date==='${dep.iso}')`); assert(ex, 'exception stored'); eq(ex.note, 'Road closed by akimat');
    eq(ev("S.bookings.find(b=>b.id==='BK-26-000001').depCancelled"), ex.id, 'ALA→AST booking flagged'); assert(/Departure cancelled/.test(ev('S.audit[0].decision')) && /Road closed/.test(ev('S.audit[0].reason')), 'audit with reason');
    ev("S.tab.orders='bookings';go('orders')"); assert(w.document.querySelector('[data-dep-cancelled="BK-26-000001"]'), 'chip on bookings'); clean(w, 'bookings with chip');
    ev(`lineRestore('${ex.id}')`); assert(!ev("S.bookings.find(b=>b.id==='BK-26-000001').depCancelled"), 'restore removes the flag');
    assert(ev("refFind('schedule','LN-5').version") >= 2, 'Lines · history version');
  });
  await group('R2 lines: planning:admin gates cancel / vehicles / tariffs; read-only view for other roles (P4)', 'ru', async (g, ev, w) => {
    ev("S.tab.routes='lines';go('routes')"); assert(w.document.querySelector('.ln_veh') && w.document.querySelector('[data-act="lnExcAsk"]') && w.document.querySelector('[data-act="lnTarEdit"]'), 'admin controls');
    ev("ACT.setRole({v:'dispatcher'});S.tab.routes='lines';go('routes')"); if (ev('S.route') === 'routes') { assert(!w.document.querySelector('.ln_veh') && !w.document.querySelector('[data-lnadd]') && !w.document.querySelector('[data-act="lnExcAsk"]') && !w.document.querySelector('[data-act="lnTarEdit"]'), 'dispatcher has edit controls'); assert(w.document.querySelector('[data-ln-ro]'), 'read-only note'); clean(w, 'lines as dispatcher'); }
    assert(typeof ev("lineCancel('LN-1','2026-10-25','Holiday')") === 'string', 'dispatcher cancels'); assert(typeof ev("lineTariffSave('AST','frozen',{base:1,rate:1,min:1})") === 'string', 'dispatcher edits tariff'); eq(ev("lineVehSet('LN-1',[])"), false, 'dispatcher edits vehicles');
  });
  await group('R2 lines: tariffs (net) hub × class, formula max(min; base + pal × km × rate) rounded to 100 ₸ + 16 % VAT, one source (P5 / P6)', 'en', async (g, ev, w) => {
    const t = ev("RES.tnetOf('AST','frozen')"); eq([t.base, t.rate, t.min].join(), '30000,60,50000'); const c = ev("RES.tnetOf('ALA','ambient')"); eq([c.base, c.rate, c.min].join(), '20000,35,30000');
    const p = ev("RES.netPrice('AST','frozen',1200,10)"); eq(p.net, 30000 + 10 * 1200 * 60); eq(p.vat, Math.round(p.net * 0.16)); eq(ev("RES.netPrice('AST','frozen',10,1).net"), 50000, 'minimum applies'); eq(ev("RES.netPrice('KAR','chilled',220,1).net"), Math.round(Math.max(40000, 25000 + 220 * 45) / 100) * 100, 'hub without row uses Astana');
    eq(ev("RES.tariff('AST','ALA','frozen')"), ev("RES.netPrice('AST','frozen',1200,1).net"), 'lane table computed from the net tariff');
    ev("S.tab.routes='lines';go('routes')"); assert(/Price = max\(minimum; base \+ pallets × km × rate\), rounded to 100 ₸, plus 16 % VAT\./.test(w.document.querySelector('[data-tariff-formula]').innerText), 'formula note'); assert(!w.document.querySelector('input.ln_tar'), 'lane table is read-only');
    ev("ACT.lnTarEdit({v:'AST:frozen'})"); w.document.querySelector('#tn_base').value = '-5'; ev("ACT.lnTarSave({h:'AST',z:'frozen'})"); eq(w.document.querySelector('#tn_err').innerText, 'Invalid input');
    w.document.querySelector('#tn_base').value = '32000'; w.document.querySelector('#tn_rate').value = '62.5'; w.document.querySelector('#tn_min').value = '50000'; ev("ACT.lnTarSave({h:'AST',z:'frozen'})");
    eq(ev("RES.tnetOf('AST','frozen').rate"), 62.5); eq(ev('S.audit[0].reason'), 'base_fee 30000→32000, per_pallet_km 60→62.5, min_price 50000→50000', 'audit old→new'); eq(ev("RES.route('AST','ALA','frozen').legs[0].price"), Math.round((32000 + 1200 * 62.5) / 100) * 100, 'route leg price follows');
    const h = ev("refFind('tariffh','AST-frozen')"); eq(h.version, 2, 'Tariffs · history'); eq(h.data.base, 32000); clean(w, 'lines after save');
  });
  await group('R2 reference data: alarm thresholds with ranges feed coverage rules and the urgent-trip window (M4)', 'en', async (g, ev) => {
    eq(ev("refItems('threshold').map(i=>i.key).join()"), 'URG_H,offMin,coldMin,graceMin,hbMin'); eq(ev("refFind('threshold','URG_H').data.value"), 6);
    eq(ev("refSave('threshold','hbMin',{value:500})"), 'Invalid input: value'); eq(ev("refSave('threshold','URG_H',{value:0})"), 'Invalid input: value');
    eq(ev("refSave('threshold','hbMin',{value:45}).status"), 'active', 'no four-eyes'); eq(ev('RES.COV.rules.hbMin'), 45, 'coverage rule follows');
    ev("refSave('threshold','URG_H',{value:3})"); eq(ev('alarmThreshold("URG_H")'), 3); ev("drv('d1').rto=4"); assert(!ev("RES.urgent('KAR',{}).drivers.find(x=>x.d.id==='d1').why.some(y=>/driving time left/.test(y))"), 'rto 4 h ≥ window 3 h passes'); ev("refSave('threshold','URG_H',{value:8})"); assert(ev("RES.urgent('KAR',{}).drivers.find(x=>x.d.id==='d1').why.some(y=>/driving time left/.test(y))"), 'window 8 h blocks rto 4 h');
    ev("ACT.setRole({v:'dispatcher'})"); assert(/No write permission/.test(ev("refSave('threshold','hbMin',{value:40})")), 'dispatcher writes thresholds');
  });
  await group('R2 reference data: road restrictions — four-eyes on every field, rules, effective version written into RESTR (M5)', 'en', async (g, ev) => {
    eq(ev("refItems('restriction').map(i=>i.key).join()"), 'RS-001,RS-002,RS-003,RS-004'); const n = ev('RESTR.length');
    eq(ev("refSave('restriction','RS-1',{kind:'axle'})"), 'Invalid input: key'); eq(ev("refSave('restriction','RS-010',{kind:'city',road:'Karaganda centre',city:'KAR',maxGvw:12000,from:'22:00'})"), 'Invalid input: city', 'city needs from / to');
    eq(ev("refSave('restriction','RS-010',{kind:'axle',road:'Test road',a:'AST',b:'AST',maxAxle:8000})"), 'Invalid input: a'); eq(ev("refSave('restriction','RS-010',{kind:'axle',road:'Test road',a:'AST',b:'KAR',maxAxle:500})"), 'Invalid input: maxAxle');
    const v = ev("refSave('restriction','RS-010',{kind:'city',road:'Karaganda: trucks > 10 t at night only',city:'KAR',maxGvw:10000,from:'22:00',to:'06:00'})"); eq(v.status, 'pending', 'new restriction waits'); eq(ev('RESTR.length'), n, 'not effective before approval');
    assert(/Four eyes/.test(ev("refDecide('restriction','RS-010',true)")), 'author approves'); ev("ACT.setRole({v:'manager'})"); eq(ev("refDecide('restriction','RS-010',true)"), null); eq(ev('RESTR.length'), n + 1, 'written into RESTR'); eq(ev("RESTR.find(r=>r.id==='RS-010').maxGvw"), 10000);
    ev("ACT.setRole({v:'admin'})"); eq(ev("refSave('restriction','RS-002',{maxGross:30000}).status"), 'pending', 'every field is critical'); eq(ev("RESTR.find(r=>r.id==='RS-002').maxGross"), 32000);
    ev("ACT.setRole({v:'manager'})"); ev("refDecide('restriction','RS-002',true)"); eq(ev("RESTR.find(r=>r.id==='RS-002').maxGross"), 30000, 'truck finder reads the new limit'); ev("ACT.setRole({v:'admin'})"); ev("refSave('restriction','RS-002',{off:true})"); ev("ACT.setRole({v:'manager'})"); ev("refDecide('restriction','RS-002',true)"); assert(!ev("RESTR.some(r=>r.id==='RS-002')"), 'switched off');
  });
  await group('R2 reference data: valid-from not in the past; future version stays scheduled until its date (M9)', 'en', async (g, ev) => {
    eq(ev("refSave('verify','esf_deadline',{note:'x'},'2026-01-05')"), 'Valid from cannot be in the past');
    const v = ev("refSave('manufacturer','ABT',{co:'IE'},'2026-12-01')"); eq(v.status, 'scheduled'); eq(ev("refFind('manufacturer','ABT').data.co"), 'US', 'not applied before the date'); eq(ev("refFind('manufacturer','ABT').next.version"), 2);
    assert(/already scheduled/.test(ev("refSave('manufacturer','ABT',{co:'FR'})")), 'one scheduled version at a time');
    ev("REF_TODAY='2026-12-01'"); eq(ev('refTick()'), 1); eq(ev("refFind('manufacturer','ABT').data.co"), 'IE', 'applied on its date'); eq(ev("refFind('manufacturer','ABT').history[0].status"), 'active');
    ev("REF_TODAY=''"); ev("ACT.setRole({v:'admin'});S.tab.settings='ref';go('settings');ACT.rfKind({v:'manufacturer'});ACT.rfOpen({k:'manufacturer',key:'ROC'})"); const g2 = ev("document.querySelector('#rf_from').min"); eq(g2, ev('NOW.toISOString().slice(0,10)'), 'date input min = business date');
  });
  await group('R2 reference data: lines / tariffs history read-only, single tariff source, zone rates renamed (M6)', 'en', async (g, ev, w) => {
    assert(/read-only/.test(ev("refSave('schedule','LN-1',{dep:'19:00'})")), 'history read-only'); assert(/read-only/.test(ev("refSave('tariffh','AST-frozen',{base:1})")), 'tariff history read-only');
    ev("S.tab.settings='ref';go('settings');ACT.rfKind({v:'schedule'})"); assert(w.document.querySelector('[data-ref-hist]'), 'note + button'); eq(w.document.querySelectorAll('[data-ref-row]').length, ev('S.res.lines.length'));
    ev("lineVehSet('LN-2',['t3'])"); eq(ev("refFind('schedule','LN-2').version"), 2, 'vehicle change versioned'); eq(ev("refFind('schedule','LN-2').history[0].changed.join()"), 'veh');
    ev("ACT.rfLines()"); eq(ev('S.route'), 'routes'); eq(ev('S.tab.routes'), 'lines'); eq(ev("REF.kinds.tariff.l"), 'Zone rates (cost model)');
  });
  await group('R2 reference data: kinds visible / writable per permission; approve needs the kind right (M12)', 'en', async (g, ev, w) => {
    const vis = r => { ev(`ACT.setRole({v:'${r}'});S.tab.settings='ref';go('settings')`); const e = w.document.querySelector('[data-ref-kinds]'); return e ? e.dataset.refKinds.split(',') : []; };
    eq(vis('admin').length, 12, 'admin sees all kinds'); const v = vis('viewer'); if (v.length) { assert(!v.includes('cost') && !v.includes('verify') && !v.includes('driver'), 'viewer sees cost / verify / driver'); }
    const f = vis('finance'); if (f.length) { assert(f.includes('cost') && f.includes('tariff') && !f.includes('verify'), 'finance kinds'); ev("ACT.rfKind({v:'cost'});ACT.rfOpen({k:'cost',key:'diesel_price'})"); assert(w.document.querySelector('#rf_value'), 'finance writes cost'); ev("ACT.rfOpen({k:'place',key:'KZ-AST'})"); assert(!w.document.querySelector('#rf_kato'), 'finance writes places'); }
    ev("ACT.setRole({v:'dispatcher'})"); assert(/No write permission/.test(ev("refSave('manufacturer','ROC',{co:'DE'})")), 'dispatcher writes manufacturers'); assert(typeof ev("refSave('partner',refItems('partner')[1].key,{sla:'6 h'})") !== 'string', 'dispatcher writes partners');
    ev("ACT.setRole({v:'auditor'})"); assert(/write right/.test(ev("refDecide('partner',refItems('partner')[0].key,true)")), 'auditor approves partner');
    ev("ACT.setRole({v:'admin'})"); eq(ev("refDecide('partner',refItems('partner')[0].key,true)"), null, 'admin approves dispatcher proposal'); eq(ev("refItems('partner')[0].next.status"), 'scheduled', 'future valid-from → scheduled');
  });
  await group('R2 reference data: manufacturer logo upload PNG / WebP ≤ 300 KB, source column, label helper prefers it (M13)', 'en', async (g, ev, w) => {
    ev("S.tab.settings='ref';go('settings');ACT.rfKind({v:'manufacturer'})"); assert(/PNG or WebP, max\. 300 KB, recommended size 515 × 380 px/.test(w.document.querySelector('[data-logo-note]').innerText), 'note');
    eq(w.document.querySelector('[data-logo="ROC"]').dataset.logoSrc, 'standard'); eq(w.document.querySelector('[data-logo="NIP"]').dataset.logoSrc, 'none'); assert(/none \(initials only\)/.test(w.document.querySelector('[data-logo="NIP"]').innerText));
    assert(w.document.querySelector('[data-rf-logo="ROC"]').accept === 'image/png,image/webp', 'file input');
    eq(ev("refLogo('ROC',{type:'image/jpeg',size:1000,dataUrl:'data:image/jpeg;base64,AA'})"), 'PNG or WebP only.'); eq(ev("refLogo('ROC',{type:'image/png',size:400*1024,dataUrl:'data:image/png;base64,AA'})"), 'File larger than 300 KB.');
    const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; const r = ev(`refLogo('ROC',{type:'image/png',size:68,dataUrl:'${png}'})`); eq(r.status, 'active'); eq(ev("mfrSrc('roche')"), png, 'label helper prefers the upload'); eq(ev("mfrSrc('abbott')"), 'assets/manufacturers/abbott.png', 'others standard');
    ev('render()'); assert(/uploaded · v2/.test(w.document.querySelector('[data-logo="ROC"]').innerText), 'source uploaded · v2'); assert(w.document.querySelector('[data-logo="ROC"] [data-act="rfLogoDel"]'), 'remove button');
    ev("ACT.rfLogoDel({key:'ROC'})"); eq(ev("mfrSrc('roche')"), 'assets/manufacturers/roche.png', 'removed'); eq(ev("refFind('manufacturer','ROC').version"), 3);
    ev("ACT.setRole({v:'dispatcher'})"); assert(typeof ev(`refLogo('ROC',{type:'image/png',size:68,dataUrl:'${png}'})`) === 'string', 'dispatcher uploads');
  });
  await group('R2 users: approval-slot wizard — not to yourself, only FN roles, assign to manager (U3)', 'en', async (g, ev, w) => {
    ev("userUpdate('finance',{active:false});S.tab.settings='users';go('settings')"); assert(w.document.querySelector('[data-fn-assign="fin_controller"]'), 'wizard row'); const opts = [...w.document.querySelectorAll('#fa_fin_controller option')].map(o => o.value); assert(!opts.includes('admin') && opts.includes('manager') && !opts.includes('viewer') && !opts.includes('cust.apteka'), 'candidates ' + opts);
    assert(/health check “approval_functions”/.test(w.document.querySelector('[data-fn-missing]').innerText), 'tail text');
    eq(ev("fnAssign('admin','fin_controller')"), 'You cannot change your own approval functions'); eq(ev("fnAssign('driver.001','fin_controller')"), 'This role cannot hold approval functions');
    w.document.querySelector('#fa_fin_controller').value = 'manager'; ev("ACT.usFnAssign({v:'fin_controller'})"); assert(ev("S.users.find(u=>u.username==='manager').fn.includes('fin_controller')"), 'assigned'); assert(!ev('missingFunctions()').includes('fin_controller'), 'slot covered'); assert(!w.document.querySelector('[data-fn-assign="fin_controller"]'), 'row gone');
  });
  await group('R2 users: "Export all data" — admin without hub restriction, JSON with personal data, audited, no real download (U7)', 'en', async (g, ev, w) => {
    ev("S.tab.settings='users';go('settings')"); const c = w.document.querySelector('[data-export-all]'); assert(c && /Your data belongs to you/.test(c.innerText) && /Store the file encrypted/.test(c.innerText), 'card');
    ev('ACT.usExport()'); const dl = ev('window.__downloads'); eq(dl[dl.length - 1].name, 'olymp-export.json'); eq(ev('S.audit[0].decision'), 'Data exported');
    const len = ev('dataExportAll()'); assert(len > 10000, 'export size'); ev("ACT.setRole({v:'dispatcher'})"); eq(ev('dataExportAll()'), null, 'dispatcher exports');
  });
  await group('R2 account: change password needs the current password, 12–128 characters (AC2)', 'en', async (g, ev, w) => {
    ev("go('account')"); assert(w.document.querySelector('#ac_cp'), 'current password field');
    ev("S.acct.cp='';S.acct.np='correct horse battery';S.acct.np2='correct horse battery';ACT.acctPw()"); eq(w.document.querySelector('[data-acct-msg]').innerText, 'Enter the current password');
    ev("S.acct.cp='old';S.acct.np='x'.repeat(130);S.acct.np2=S.acct.np;ACT.acctPw()"); eq(w.document.querySelector('[data-acct-msg]').innerText, 'At most 128 characters');
    ev("S.acct.cp='old';S.acct.np='correct horse battery';S.acct.np2='correct horse batterz';ACT.acctPw()"); eq(w.document.querySelector('[data-acct-msg]').innerText, 'Passwords do not match');
    ev("S.acct.cp='old';S.acct.np='correct horse battery';S.acct.np2='correct horse battery';ACT.acctPw()"); eq(w.document.querySelector('[data-acct-msg]').innerText, 'Password changed (demo).'); eq(ev('S.acct.cp'), '');
  });
  await group('R2 integrations: ESUTD readiness panel — deadlines with chips, per hub trip sheet / TTN / medical / readiness (I3)', 'en', async (g, ev, w) => {
    ev("S.tab.settings='integ';go('settings')"); const p = w.document.querySelector('[data-esutd-panel]'); assert(p, 'panel'); eq(p.querySelectorAll('[data-esutd]').length, 5, 'five hubs'); eq(p.querySelectorAll('[data-esutd-dl]').length, 2);
    assert(/Pre-trip medical check in ESUTD \(vehicles > 3\.5 t\)/.test(p.innerText) && /ESUTD: e-TTN and electronic trip sheet/.test(p.innerText) && /days left/.test(p.innerText), 'deadline texts');
    const r = ev('esutdReadiness()'); assert(r.every(x => x.sheet <= x.trips && x.ttn <= x.trips && (x.trips ? x.ready >= 0 && x.ready <= 100 : x.ready === null)), 'consistent'); assert(r.some(x => x.trips > 0), 'some trips');
    assert(/Open trips and the last 30 days/.test(p.innerText), 'footnote'); clean(w, 'integrations');
  });
  await group('R2 integrations: catalogue has the 0.3.9 systems with notes and "unverified" chips; DE without Cyrillic (I5)', 'de', async (g, ev, w) => {
    eq(ev('S.integ.length'), 47); for (const k of ['yandex_delivery', 'wialon_telemetry', 'esutd_medcheck', 'gdp', 'pd_localisation', 'tachograph', 'adr', 'is_mpt', 'weigh_stations', 'kazavtozhol_monitoring', 'open_data', 'nav_seals', 'astana1', 'routing_2gis', 'yandex_router', 'kazavtozhol_1403', 'tyre_tow', 'cargo_escort', 'sk_pharmacy', 'trans_eu', 'amocrm', 'della', 'indrive_cargo']) assert(ev(`!!S.integ.find(s=>s.key==='${k}')`), k);
    eq(ev("S.integ.find(s=>s.key==='kaztoll').cat"), 'government'); eq(ev("S.integ.find(s=>s.key==='esutd_medcheck').deadline"), '2027-01-01'); eq(ev("S.integ.filter(s=>s.unv).length"), 7);
    assert(/KR DSM-15\/2021/.test(ev("S.integ.find(s=>s.key==='gdp').basis")), 'GDP basis transliterated');
    ev("S.tab.settings='integ';go('settings')"); assert(w.document.querySelectorAll('[data-int-note]').length >= 23, 'notes'); assert(!/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(w.document.querySelector('#root').innerText), 'Cyrillic in DE'); clean(w, 'integ de');
  });
  await group('R2 integrations: API key bound to a customer, https webhook, key / secret shown once, revoke with confirm (I8 / I9 / I10)', 'en', async (g, ev, w) => {
    ev("S.tab.settings='integ';go('settings');ACT.igKeyNew()"); const sc = ['slots:read', 'quotes:write', 'bookings:write', 'bookings:read', 'shipments:read']; for (const s of sc) assert(w.document.querySelector('#ik_' + s.replace(':', '_')).checked, s + ' ticked');
    assert(/docs\/partner-api\.json/.test(w.document.querySelector('.drawer').innerText), 'spec hint');
    w.document.querySelector('#ik_n').value = 'ERP Fresh'; ev('ACT.igKeySave()'); eq(w.document.querySelector('#ik_err').innerText, 'Choose a customer');
    w.document.querySelector('#ik_c').value = 'c2'; w.document.querySelector('#ik_h').value = 'http://erp.example/hook'; ev('ACT.igKeySave()'); eq(w.document.querySelector('#ik_err').innerText, 'Webhook URL must use https');
    w.document.querySelector('#ik_h').value = 'https://erp.example/hook'; ev('ACT.igKeySave()'); assert(/^olk_[0-9a-f]{8}_[0-9a-f]{32}$/.test(ev('S.ux.key')), 'key format'); assert(/^[0-9a-f]{64}$/.test(ev('S.ux.keySecret')), 'webhook secret');
    const k = ev('S.apiKeys[0]'); eq(k.cust, 'c2'); eq(k.hook, 'https://erp.example/hook'); assert(/api_client\.created · c2/.test(ev('S.audit[0].reason')), 'audit');
    assert(w.document.querySelector('[data-key-once] [data-hook-secret]'), 'secret shown'); ev('ACT.igKeyClose()'); assert(!w.document.querySelector('[data-key-once]'), 'closed'); eq(ev('S.ux.key'), null);
    ev(`ACT.igRevokeAsk({id:'${k.id}'})`); assert(/Revoke key\? The partner integration will stop working\./.test(w.document.querySelector(`[data-revoke-ask="${k.id}"]`).innerText), 'confirm'); eq(ev('S.apiKeys[0].active'), true, 'not revoked before confirm');
    ev("ACT.igRevokeAsk({id:''})"); assert(!w.document.querySelector('[data-revoke-ask]'), 'cancel'); ev(`ACT.igRevoke({id:'${k.id}'})`); eq(ev('S.apiKeys[0].active'), false); assert(/api_client\.revoked/.test(ev('S.audit[0].reason')));
  });
  for (const lang of LANGS) await group('R2 [' + lang + '] port d: changed tabs and drawers render clean (drivers, lines, reference kinds, users, integrations, account)', lang, async (g, ev, w) => {
    ev("go('drivers')"); clean(w, 'drivers'); ev("ACT.drvPii({id:'d1'})"); clean(w, 'drivers revealed'); ev("ACT.openD({id:'d1'})"); clean(w, 'driver drawer'); ev('ACT.addD()'); clean(w, 'add driver');
    ev("closeDrawer();S.tab.routes='lines';go('routes')"); clean(w, 'lines'); const dep = ev("RES.departures(14).find(d=>!d.cancelled)"); ev(`ACT.lnExcAsk({id:'${dep.line.id}',d:'${dep.iso}'})`); clean(w, 'lines cancel form'); ev("ACT.lnTarEdit({v:'ALA:pharma'})"); clean(w, 'tariff edit');
    ev("S.tab.settings='ref';go('settings')"); for (const k of ev('Object.keys(REF.kinds)')) { ev(`ACT.rfKind({v:'${k}'})`); clean(w, 'ref ' + k); const key = ev(`(refItems('${k}')[0]||{}).key`); if (key) { ev(`ACT.rfOpen({k:'${k}',key:'${key}'})`); clean(w, 'ref drawer ' + k); ev('closeDrawer()'); } }
    ev("ACT.rfKind({v:'restriction'});ACT.rfOpen({k:'restriction',key:''})"); clean(w, 'new restriction form'); ev('closeDrawer()');
    ev("userUpdate('finance',{active:false});S.tab.settings='users';go('settings')"); clean(w, 'users with wizard');
    ev("S.tab.settings='integ';go('settings');ACT.igKeyNew()"); clean(w, 'key drawer'); ev("closeDrawer();ACT.igRevokeAsk({id:'k1'})"); clean(w, 'revoke confirm');
    ev("go('account')"); clean(w, 'account'); ev("go('help');ACT.helpGo({k:'settings/reference'})"); clean(w, 'help reference');
    if (lang === 'de' || lang === 'en') { for (const [s, t] of [['drivers', ''], ['routes', 'lines'], ['settings', 'ref'], ['settings', 'users'], ['settings', 'integ']]) { if (t) ev(`S.tab['${s}']='${t}'`); ev(`go('${s}')`); const m = w.document.querySelector('#root').innerText.match(/.{0,20}[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі].{0,20}/); assert(!m, lang + ' ' + s + '/' + t + ' Cyrillic: ' + (m && m[0])); } }
  });

  /* ---- R2 section e ---- */
  /* ---- R2 letter e: 0.3.9 parity of the booking form, My bookings, booking desk, insurance and public tracking ---- */
  const bkPortal = "ACT.setRole({v:'customer'});go('book');ACT.bkReset();";
  await group('R2 D1/D2/D3/P10: portal booking KST → TAR opens on the desk, price equals the portal total, confirm creates a hub load', 'ru', async (g, ev, w) => {
    ev(bkPortal + "Object.assign(BK,{pCity:'KST',pStreet:'Абая',pHouse:'5',dCity:'TAR',dStreet:'Абая',dHouse:'9'});BK.slot=slotsFor('KST','TAR',4,1600)[0].date;render()");
    ev('ACT.bkSend()'); const b = ev('S.bookings[0]'); assert(Array.isArray(b.hist), 'hist missing'); eq(b.load, null); eq(b.by, 'customer');
    ev("ACT.setRole({v:'dispatcher'});go('orders');ACT.stab({s:'orders',v:'bookings'})"); assert(w.document.querySelector(`[data-bk-row="${b.id}"]`), 'row'); clean(w, 'desk');
    ev(`ACT.bkOpen({id:'${b.id}'})`); clean(w, 'drawer'); eq(w.document.querySelector('[data-bk-total]').innerText.replace(/\D/g, ''), String(b.gross), 'desk price = portal total');
    eq(ev(`bookingPrice(S.bookings[0]).total`), b.gross); eq(ev("bookingPrice({from:'AST',to:'ALA',zone:'pharma',pallets:4,kg:1600}).vat"), ev("priceFor({from:'AST',to:'ALA',zone:'pharma',pallets:4,kg:1600}).vat"), 'VAT 16 % everywhere');
    eq(b.addrCheck, 'manual', 'no street directory for Taraz'); eq(ev(`bookingAddrReview('${b.id}','адрес подтверждён по телефону')`), null); const n = ev('S.loads.length'); eq(ev(`bookingConfirm('${b.id}')`), null); eq(ev('S.loads.length'), n + 1); const l = ev('load(S.bookings[0].load)'); eq(l.from, 'AST'); eq(l.to, 'SHY'); eq(l.booking, b.id); assert(/Тараз/.test(l.city), 'city on the order');
    ev(`ACT.bkOpen({id:'${b.id}'})`); clean(w, 'drawer confirmed'); eq(ev(`bookingCancel('${b.id}','клиент передумал')`), null); eq(ev('S.bookings[0].status'), 'cancelled');
  });
  await group('R2 P1/P2/P7: pick-up window, incompatible goods, LOT on the booking and the order', 'ru', async (g, ev, w) => {
    ev(bkPortal + "BK.pFrom='2026-10-25';BK.pTo='2026-10-20';render()"); assert(/Окно забора/.test(w.document.querySelector('#bk_price').innerText), 'window error'); assert(w.document.querySelector('[data-pick-window]'), 'inputs');
    ev("BK.pTo='2026-10-30';render()"); assert(ev("slotsFor(BK.pCity,BK.dCity,4,1600).filter(s=>s.pickup>='2026-10-25').length") === w.document.querySelectorAll('[data-slot]').length, 'slots filtered by the window');
    ev("BK.slot=document.querySelector('[data-slot]').dataset.slot;BK.lot='LOT-2026-17';render();ACT.bkSend()"); const b = ev('S.bookings[0]'); eq(b.pickup.from, '2026-10-25'); eq(b.pickup.to, '2026-10-30'); eq(b.lot, 'LOT-2026-17');
    ev(`ACT.setRole({v:'admin'});go('orders');ACT.stab({s:'orders',v:'bookings'});ACT.bkOpen({id:'${b.id}'})`); assert(w.document.querySelector('[data-bk-window]'), 'window on the desk'); eq(w.document.querySelector('[data-bk-lot]').innerText, 'LOT-2026-17'); eq(ev(`bookingConfirm('${b.id}')`), null); eq(ev('load(S.bookings[0].load).lot'), 'LOT-2026-17', 'LOT on the order');
    ev(bkPortal + "render()"); const cbx = c => w.document.querySelector(`[data-bkg="${c}"]`);
    cbx('medicines').click(); cbx('food_frozen').click(); cbx('labcons').click(); eq(ev('BK.goods.join()'), 'food_frozen,labcons'); assert(w.document.querySelector('[data-goods-mix]'), 'incompatible note'); assert(w.document.querySelector('[data-act=bkSend]').disabled, 'Book disabled'); assert(ev('ZONES[BK.zone]'), 'zone kept');
  });
  await group('R2 P3: dangerous goods need an ADR departure (AST → KAR has none)', 'ru', async (g, ev, w) => {
    ev(bkPortal + "Object.assign(BK,{dCity:'KAR',dStreet:'Гоголя',dHouse:'3',dgOn:true});Object.assign(BK.dg,{un:'1845',name:'Dry ice',cls:'9',dry:'20'});render()");
    assert(w.document.querySelector('[data-adr-note]'), 'ADR note'); assert(w.document.querySelector('[data-no-adr]'), 'no ADR departure'); eq(w.document.querySelectorAll('[data-slot-ok="1"]').length, 0, 'all slots blocked');
    ev("BK.slot=slotsFor('AST','KAR',4,1600)[0].date;render()"); assert(/ADR/.test(w.document.querySelector('#bk_price ul').innerText), 'ready blocks a non-ADR slot'); clean(w, 'adr');
    ev("BK.dCity='ALA';BK.dStreet='Абая';BK.slot='';render()"); assert(w.document.querySelectorAll('[data-slot-ok="1"]').length > 0, 'ALA line has ADR');
  });
  await group('R2 P4: payer with contact data, KGD autofill, masked on the booking and shown on the desk', 'ru', async (g, ev, w) => {
    ev(bkPortal + "BK.payerOn=true;render()"); const bin = ev('KGD_BINS[1]'); const i = w.document.querySelector('#bk_payer\\.bin'); i.value = bin; i.dispatchEvent(new w.Event('input', { bubbles: true })); assert(ev('BK.payer.company.length') > 2, 'KGD autofill');
    ev("BK.payer.bin='123';render()"); assert(w.document.querySelector('[data-payer-err]'), 'invalid BIN error');
    ev(`Object.assign(BK.payer,{bin:'${bin}',role:'other',contact:'Иван Петров',email:'ivan@fw.kz',phone:'+7 701 555 12 34',addr:'Алматы, Абая 1',ref:'PO-9'});BK.slot=slotsFor(BK.pCity,BK.dCity,4,1600)[0].date;render();ACT.bkSend()`);
    const p = ev('S.bookings[0].payer'); eq(p.contact, 'И***'); eq(p.email, 'i***@fw.kz'); eq(p.phone, '+7 7•• ••• •• 34'); eq(p.role, 'other'); eq(p.addr, 'Алматы, Абая 1');
    ev("ACT.setRole({v:'dispatcher'});go('orders');ACT.stab({s:'orders',v:'bookings'});ACT.bkOpen({id:S.bookings[0].id})"); const t = w.document.querySelector('[data-bk-payer]').innerText; assert(/PO-9/.test(t) && /И\*\*\*/.test(t) && !/Петров/.test(t), 'payer line masked: ' + t);
  });
  await group('R2 D5/P5: portal express → S.express approval → booking approved with the express load; desk cannot confirm while pending', 'ru', async (g, ev, w) => {
    ev(bkPortal + "BK.express=true;BK.deliverBy='2026-10-21';render();ACT.bkSend()"); const b = ev('S.bookings[0]'), ex = ev('S.express[0]');
    eq(b.express_id, ex.id); eq(ex.booking, b.id); eq(ex.status, 'pending'); eq(ex.due.slice(0, 10), '2026-10-20'); assert(w.document.querySelector('[data-ex-done]'), 'EX line in the done card');
    ev("go('mybookings')"); assert(w.document.querySelector(`[data-ex-row="${ex.id}"]`), 'express table'); clean(w, 'mybookings express');
    ev(`ACT.setRole({v:'dispatcher'});go('orders');ACT.stab({s:'orders',v:'bookings'});ACT.bkOpen({id:'${b.id}'})`); assert(w.document.querySelector('[data-express-gate]'), 'express note'); assert(!w.document.querySelector('[data-act=bkConfirm]'), 'confirm hidden'); assert(ev(`bookingConfirm('${b.id}')`), 'confirm refused');
    ev("go('dispatch');ACT.stab({s:'dispatch',v:'express'})"); assert(w.document.querySelector(`[data-express="${ex.id}"]`), 'listed in dispatch'); clean(w, 'dispatch express');
    ev(`ACT.setRole({v:'admin'});['ceo','ana','log'].forEach(f=>exSign('${ex.id}',f))`); const b2 = ev(`S.bookings.find(x=>x.id==='${b.id}')`); eq(b2.exSt, 'approved'); eq(b2.status, 'confirmed'); assert(/^LD-/.test(b2.load), 'express load linked');
    ev(bkPortal + "BK.express=true;BK.deliverBy='2026-10-22';render();ACT.bkSend()"); const id2 = ev('S.bookings[0].express_id'); ev(`ACT.setRole({v:'admin'});ACT.exTick({id:'${id2}'})`); eq(ev('S.bookings[0].exSt'), 'timeout', 'deadline passed → timeout');
    ev("ACT.setRole({v:'customer'});go('mybookings')"); assert(/срок истёк/.test(w.document.querySelector('[data-ex-table]').innerText), 'timeout chip'); clean(w, 'mybookings after decisions');
  });
  await group('R2 P6: customer locks a quote; one offer / contract sample for form, booking, offer and desk', 'ru', async (g, ev, w) => {
    ev(bkPortal + "render()"); const n = ev('S.offers.length'); ev('ACT.bkQuote()'); eq(ev('S.offers.length'), n + 1); const o = ev('S.offers[0]'); eq(o.src, 'portal'); eq(o.status, 'open'); eq(ev('BK.offer'), o.id); eq(o.until, '2026-11-01');
    assert(w.document.querySelector('[data-quote-msg]'), 'notice'); assert(w.document.querySelector('[data-act=bkQuote]').disabled, 'locked once');
    ev('ACT.bkOfferDoc()'); eq(w.document.querySelectorAll('.drawer [data-clause]').length, 9, '9 clauses'); assert(/Kökzhol Logistics KZ/.test(w.document.querySelector('.drawer').innerText), 'carrier'); clean(w, 'draft sample');
    w.document.querySelector('.drawer [data-act=ofPrint]').click(); assert((w.__downloads || []).length >= 1, 'print recorded'); ev('closeDrawer()');
    ev("BK.slot=slotsFor(BK.pCity,BK.dCity,4,1600)[0].date;render();ACT.bkSend()"); eq(ev('S.offers[0].status'), 'accepted'); eq(ev('S.bookings[0].gross'), o.gross, 'booked at the locked price');
    ev("go('mybookings');ACT.bkDoc({id:S.bookings[0].id})"); assert(w.document.querySelector('.drawer [data-offer-doc]'), 'sample from My bookings'); clean(w, 'mybookings sample');
    ev("ACT.setRole({v:'admin'});go('orders');ACT.stab({s:'orders',v:'bookings'});ACT.bkOpen({id:S.bookings[0].id});ACT.bkView({v:'offer'})"); assert(w.document.querySelector('.drawer [data-offer-doc] [data-clause]'), 'desk sample'); clean(w, 'desk sample');
    ev("ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'offers'});ACT.cmOfView({id:'KP-26-0007'})"); assert(w.document.querySelector('#cm_offer [data-offer-doc]'), 'commercial sample'); clean(w, 'commercial sample');
  });
  await group('R2 P8/P9: My bookings — certificate, cancel with confirmation, contract text before signing', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'customer'});go('mybookings')"); assert(w.document.querySelector('[data-act=bkCert][data-id="BK-26-000004"]'), 'certificate link'); ev("ACT.bkCert({id:'BK-26-000004'})"); assert(w.document.querySelector('.drawer [data-cert]'), 'certificate drawer'); assert(/€/.test(w.document.querySelector('.drawer').innerText), 'EUR/USD'); clean(w, 'cert'); ev('closeDrawer()');
    ev(bkPortal + "BK.slot=slotsFor(BK.pCity,BK.dCity,4,1600)[0].date;render();ACT.bkSend();go('mybookings')"); const id = ev('S.bookings[0].id');
    ev(`ACT.bkCancelAsk({id:'${id}'})`); assert(w.document.querySelector(`[data-cancel-ask="${id}"]`), 'confirmation'); ev('ACT.bkCancelNo()'); eq(ev('S.bookings[0].status'), 'new'); ev(`ACT.bkCancelAsk({id:'${id}'})`); w.document.querySelector(`[data-cancel-ask="${id}"] [data-act=bkCancel]`).click(); eq(ev('S.bookings[0].status'), 'cancelled');
    ev("ACT.setRole({v:'admin'});S.contracts.find(c=>c.id==='DG-26-0021').status='sent';S.contracts.find(c=>c.id==='DG-26-0021').cust='c1';ACT.setRole({v:'customer'});go('mybookings')");
    assert(w.document.querySelector('[data-fw]'), 'framework chip'); assert(w.document.querySelector('[data-ct-row="DG-26-0021"] [data-act=bkSign]').disabled, 'sign before reading');
    ev("ACT.bkCtOpen({id:'DG-26-0021'})"); eq(w.document.querySelector('.drawer [data-ct-sha]').innerText.length, 64, 'full hash'); clean(w, 'contract text'); w.document.querySelector('.drawer [data-act=bkSign]').click(); eq(ev("S.contracts.find(c=>c.id==='DG-26-0021').status"), 'signed'); assert(/DG-26-0021/.test(ev('BK_CT.msg')), 'signed notice');
    ev("closeDrawer();S.custId='c4';render()"); assert(w.document.querySelector('[data-no-ct]') && w.document.querySelector('[data-no-fw]'), 'empty contracts / no framework');
  });
  await group('R2 P11: address review four-eyes on the desk', 'ru', async (g, ev, w) => {
    ev(bkPortal + "Object.assign(BK,{dStreet:'Неизвестная',dHouse:'2'});BK.slot=slotsFor(BK.pCity,BK.dCity,4,1600)[0].date;render();ACT.bkSend()"); const id = ev('S.bookings[0].id'); eq(ev('S.bookings[0].addrCheck'), 'manual');
    ev(`ACT.setRole({v:'dispatcher'});go('orders');ACT.stab({s:'orders',v:'bookings'});ACT.bkOpen({id:'${id}'})`); assert(w.document.querySelector('[data-addr-review]'), 'review section'); assert(w.document.querySelector('[data-act=bkConfirm]').disabled, 'confirm disabled');
    w.document.querySelector('#bk_rev').value = 'ok'; ev(`ACT.bkAddrOk({id:'${id}'})`); assert(w.document.querySelector('#bk_reverr').textContent, 'short note refused');
    w.document.querySelector('#bk_rev').value = 'улица есть на карте'; ev(`ACT.bkAddrOk({id:'${id}'})`); eq(ev('S.bookings[0].addrCheck'), 'reviewed'); eq(ev('S.bookings[0].addrReview.by'), 'dispatcher'); assert(!w.document.querySelector('[data-act=bkConfirm]').disabled, 'confirm enabled'); clean(w, 'reviewed');
    ev("const b=newBooking({cust:'c2',from:'AST',to:'ALA',zone:'pharma',pallets:2,kg:500,src:'offer'});b.addrCheck='manual'"); eq(ev('S.bookings[0].by'), 'dispatcher'); assert(/Автор заявки/.test(ev("bookingAddrReview(S.bookings[0].id,'checked ok')")), 'requester refused'); ev("ACT.setRole({v:'admin'})"); eq(ev("bookingAddrReview(S.bookings[0].id,'checked ok')"), null, 'other role may review');
  });
  await group('R2 P12: public tracking shows a shipment history without personal data', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'viewer'});S.trackId='BK-26-000004';go('track')"); const li = [...w.document.querySelectorAll('[data-track-history] li')]; assert(li.length >= 4, 'at least 4 events: ' + li.length); const ks = li.map(x => x.dataset.ev); assert(ks.includes('booked') && ks.includes('order') && ks.includes('eta'), ks.join());
    assert(w.document.querySelector('[data-track-eta]'), 'planned / current ETA'); assert(!/\+7|@/.test(w.document.querySelector('#trk_card').innerText), 'no personal data'); clean(w, 'track');
    const l = ev("S.loads.find(l=>l.status==='in_transit').id"); ev(`S.trackId='${l}';render()`); const k2 = [...w.document.querySelectorAll('[data-track-history] li')].map(x => x.dataset.ev); assert(k2.includes('assigned') && k2.includes('in_transit'), k2.join());
    const u = ev("S.loads.find(l=>l.status==='assigned').id"); ev(`setStatus('${u}','loading');S.trackId='${u}';render()`); assert([...w.document.querySelectorAll('[data-track-history] li')].some(x => x.dataset.ev === 'loading'), 'recorded status event');
  });
  await group('R2 insurance: claim cap uses the portal declared value, overdue for submitted, note column, certificate details', 'ru', async (g, ev, w) => {
    ev(bkPortal + "BK.insured=true;BK.declared='2000000';BK.slot=slotsFor(BK.pCity,BK.dCity,4,1600)[0].date;render();ACT.bkSend()"); const id = ev('S.bookings[0].id'); eq(ev('S.bookings[0].value'), 2000000);
    ev(`ACT.setRole({v:'admin'});bookingConfirm('${id}')`); const dev = ev("S.devs.find(d=>/^DEV-/.test(d.id)&&!S.claims.some(c=>c.dev===d.id&&['open','submitted'].includes(c.status))).id");
    assert(/2\D000\D000/.test(ev(`claimOpen({dev:'${dev}',booking:'${id}',amount:2500000,note:'long enough text'})`)), 'cap by declared value'); assert(/^CLM-/.test(ev(`claimOpen({dev:'${dev}',booking:'${id}',amount:1500000,note:'long enough text'}).id`)), 'claim within value');
    ev("S.claims.find(c=>c.status==='submitted').deadline='2026-10-01';S.tab.billing='insurance';go('billing')"); assert(/срок истёк/.test(w.document.querySelector('.content').innerText), 'overdue for submitted'); assert(w.document.querySelector('[data-claim-note]'), 'note column'); assert(/BIN|БИН/.test(w.document.querySelector('.content').innerText), 'insurer BIN'); clean(w, 'insurance');
    ev(`S.tab.orders='bookings';go('orders');ACT.bkOpen({id:'${id}'});ACT.bkView({v:'cert'})`); const t = w.document.querySelector('[data-cert]').innerText; assert(/2\D000\D000/.test(t) && /€/.test(t) && /30/.test(t), 'certificate: value, FX, claim days');
  });
  for (const lang of LANGS) await group('[' + lang + '] R2 portal / desk / insurance / tracking render without undefined/NaN; DE/EN without Cyrillic in new texts', lang, async (g, ev, w) => {
    const cyr = where => { if (lang !== 'de' && lang !== 'en') return; const t = w.document.querySelector('.drawer') ? w.document.querySelector('.drawer').innerText : ''; const m = t.replace(/ТОО «[^»]*»|ИП «[^»]*»|[А-ЯЁ][а-яё]+ [А-ЯЁ]\.|Айгерим С\./g, '').match(/[А-Яа-яЁё]{3,}/); assert(!m, where + ' Cyrillic: ' + (m && m[0])); };
    ev(bkPortal + "BK.pFrom='2026-10-19';BK.dStreet='Unknownstreet';BK.dgOn=true;Object.assign(BK.dg,{un:'1845',name:'Dry ice',cls:'9',dry:'20'});BK.payerOn=true;BK.insured=true;BK.declared='1000000';render()"); clean(w, lang + ' book');
    ev('ACT.bkQuote();ACT.bkOfferDoc()'); clean(w, lang + ' draft sample'); cyr('draft sample'); ev('closeDrawer()');
    ev("BK.slot=slotsFor(BK.pCity,BK.dCity,4,1600).find(s=>s.adr).date;BK.payer.company='Forwarder LLP';render();ACT.bkSend()"); clean(w, lang + ' done');
    ev("ACT.bkReset();BK.express=true;BK.deliverBy='2026-10-21';render();ACT.bkSend();go('mybookings')"); clean(w, lang + ' mybookings');
    ev("ACT.bkDoc({id:S.bookings[1].id})"); clean(w, lang + ' booking sample'); ev("ACT.bkCtOpen({id:'DG-26-0012'})"); clean(w, lang + ' contract'); cyr('contract'); ev("ACT.bkCert({id:'BK-26-000004'})"); clean(w, lang + ' certificate'); cyr('certificate'); ev('closeDrawer()');
    ev("ACT.setRole({v:'admin'});go('orders');ACT.stab({s:'orders',v:'bookings'})"); clean(w, lang + ' desk');
    for (const id of ev('S.bookings.slice(0,3).map(b=>b.id)')) for (const v of ['info', 'offer']) { ev(`ACT.bkOpen({id:'${id}'});ACT.bkView({v:'${v}'})`); clean(w, lang + ' drawer ' + id + ' ' + v); cyr('drawer ' + v); }
    ev("go('dispatch');ACT.stab({s:'dispatch',v:'express'})"); clean(w, lang + ' dispatch express');
    ev("S.tab.billing='insurance';go('billing')"); clean(w, lang + ' insurance');
    ev("ACT.setRole({v:'viewer'});S.trackId='BK-26-000004';go('track')"); clean(w, lang + ' track'); ev("go('request')"); clean(w, lang + ' request');
    ev("ACT.setRole({v:'customer'});S.help.key='book';go('help')"); clean(w, lang + ' help book');
  });

  /* ---- R2 section f ---- */
  /* ---- R2 mirror f: CRM / customers / contracts parity with 0.3.9 (audit C, P13–P17) — screens/505-r2-crm.js ---- */
  const CM = s => `go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'${s}'})`;
  await group('R2 P13 Commercial needs crm:read, writing needs crm:write, auditor is read-only, FX needs costs:approve', 'ru', async (g, ev, w) => {
    for (const r of ['viewer', 'warehouse', 'driver', 'finance', 'manager']) { ev(`ACT.setRole({v:'${r}'})`); assert(!ev("tabsOf('orders').some(t=>t.key==='commercial')"), r + ' sees Commercial'); }
    for (const r of ['admin', 'dispatcher', 'auditor']) { ev(`ACT.setRole({v:'${r}'})`); assert(ev("tabsOf('orders').some(t=>t.key==='commercial')"), r + ' misses Commercial'); }
    ev("ACT.setRole({v:'auditor'});" + CM('customers')); assert(w.document.querySelector('[data-crm-ro]'), 'read-only note'); assert(!w.document.querySelector('[data-act=cmCustAdd], [data-act=cmAddrAdd], [data-act=cmAddrOk]'), 'customer forms for auditor'); clean(w, 'auditor customers');
    for (const [s, sel] of [['prices', 'cmPlAdd'], ['offers', 'cmOfAdd'], ['contracts', 'cmCtAdd'], ['crm', 'cmLeadAdd'], ['tasks', 'cmTaskAdd'], ['fx', 'cmFxAdd']]) { ev(`ACT.cmSec({v:'${s}'})`); assert(!w.document.querySelector(`[data-act=${sel}]`), 'auditor sees ' + sel); clean(w, 'auditor ' + s); }
    ev("ACT.cmSec({v:'crm'})"); assert(!w.document.querySelector('.kcard .actbar'), 'stage buttons for auditor'); assert(w.document.querySelector('.kcard[data-act=cmLeadOpen]'), 'auditor can open a lead');
    const n = ev('S.leads.length'); ev("COMM.q.ld_company='ТОО «Аудит»';ACT.cmLeadAdd()"); eq(ev('S.leads.length'), n, 'auditor created a lead'); assert(/crm:write/.test(ev('S.toast&&S.toast.msg')), 'no-permission toast');
    ev("ACT.cmTaskDone({id:'T-1'})"); eq(ev("S.tasks.find(t=>t.id==='T-1').done"), false, 'auditor closed a task');
    ev("ACT.cmCtVoid({id:'DG-26-0021',reason:'test reason'})"); eq(ev("S.contracts.find(c=>c.id==='DG-26-0021').status"), 'draft', 'auditor voided');
    ev("ACT.setRole({v:'dispatcher'});" + CM('crm') + ";COMM.q.ld_company='ТОО «Диспетчер»';ACT.cmLeadAdd()"); eq(ev('S.leads.length'), n + 1, 'dispatcher (crm:write) cannot create a lead');
    ev(CM('fx')); assert(!w.document.querySelector('[data-act=cmFxAdd]'), 'FX form without costs:approve'); const fx = ev('S.fx.length'); ev("COMM.q.fx_day='2026-10-19';COMM.q.fx_eur='650';COMM.q.fx_usd='550';ACT.cmFxAdd()"); eq(ev('S.fx.length'), fx, 'dispatcher saved an FX rate');
    ev("ACT.setRole({v:'admin'});" + CM('fx')); assert(w.document.querySelector('[data-act=cmFxAdd]'), 'admin FX form'); ev('ACT.cmFxAdd()'); eq(ev('S.fx.length'), fx + 1, 'admin FX rate');
  });
  await group('R2 P14 lead drawer: contacts, consent, PD audit, status / hub / owner, lost reason, erase PD, task, new lead e-mail / phone / message', 'ru', async (g, ev, w) => {
    ev(CM('crm')); const card = w.document.querySelector('.kcard[data-lead="L-102"]'); assert(card, 'lead card'); assert(/13\.10\.2026/.test(card.querySelector('[data-lead-meta]').innerText) && /D\. Lee/.test(card.innerText), 'source date + owner on the card');
    const a0 = ev('S.audit.length'); card.click(); eq(ev('S.drawer&&S.drawer.type'), 'lead', 'drawer opened'); eq(ev('S.audit.length'), a0 + 1, 'PD viewed audited'); eq(ev('S.audit[0].decision'), 'PD viewed');
    const dr = () => w.document.querySelector('.drawer');
    assert(dr().querySelector('a[href^="mailto:lab@example.kz"]') && dr().querySelector('a[href^="tel:"]'), 'mailto / tel links'); assert(/13\.10\.2026/.test(dr().querySelector('[data-lead-consent]').innerText), 'consent date'); assert(dr().querySelector('[data-lead-pdnote]'), 'PD note'); clean(w, 'lead drawer');
    eq(ev("S.leads.find(l=>l.id==='L-103').consent"), null, 'phone lead has no consent');
    eq(w.document.querySelector('#ld_reason_row').style.display, 'none', 'reason hidden unless lost');
    w.document.querySelector('#ld_st').value = 'lost'; w.document.querySelector('#ld_st').dispatchEvent(new w.Event('change', { bubbles: true })); eq(w.document.querySelector('#ld_reason_row').style.display, '', 'reason shown for lost');
    ev("ACT.cmLeadSave({id:'L-102'})"); eq(ev("S.leads.find(l=>l.id==='L-102').status"), 'contacted', 'lost without reason'); assert(/3/.test(w.document.querySelector('#ld_err').innerText), 'reason message');
    ev("ACT.cmLeadSave({id:'L-102',st:'lost',reason:'цена выше',hub:'ALA',owner:'A. Smirnov'})"); const l = ev("S.leads.find(l=>l.id==='L-102')"); eq(l.status, 'lost'); eq(l.lost, 'цена выше'); eq(l.hub, 'ALA'); eq(l.owner, 'A. Smirnov');
    ev("ACT.cmLead({id:'L-103',v:'lost'})"); eq(ev("S.leads.find(l=>l.id==='L-103').status"), 'new', 'stage button lost without reason'); eq(ev('S.drawer.st'), 'lost', 'drawer opened at lost');
    ev("ACT.cmLeadOpen({id:'L-101'})"); w.document.querySelector('#ld_tk_title').value = 'Позвонить'; w.document.querySelector('#ld_tk_due').value = '2026-10-25'; const tk = ev('S.tasks.length'); ev("ACT.cmLeadTask({id:'L-101'})"); eq(ev('S.tasks.length'), tk + 1, 'task'); eq(ev('S.tasks[S.tasks.length-1].who'), 'Sarah Johnson', 'assignee = owner'); eq(ev('S.tasks[S.tasks.length-1].due'), '2026-10-25');
    ev("ACT.cmLeadTask({id:'L-101',title:'x'})"); eq(ev('S.tasks.length'), tk + 1, 'one-char task accepted');
    w.confirm = () => false; ev("ACT.cmLeadErase({id:'L-101'})"); eq(ev("S.leads.find(l=>l.id==='L-101').email"), 'tender@example.kz', 'erased without confirm');
    w.confirm = () => true; ev("ACT.cmLeadErase({id:'L-101'})"); const e = ev("S.leads.find(l=>l.id==='L-101')"); eq(e.email, ''); eq(e.contact, '—'); eq(e.msg, ''); eq(e.erased, '2026-10-18'); eq(ev('S.audit[0].decision'), 'PD erased');
    ev("ACT.close?ACT.close():closeDrawer()"); ev(CM('crm')); assert(w.document.querySelector('.kcard[data-lead="L-101"] [data-lead-erased]'), 'card marked erased');
    assert(!w.document.querySelector('#cm_ld_src option[value="web"]'), 'web source in manual select'); assert(w.document.querySelector('#cm_ld_email') && w.document.querySelector('#cm_ld_phone') && w.document.querySelector('textarea#cm_ld_msg'), 'new lead e-mail / phone / message');
    const n = ev('S.leads.length'); ev("COMM.q.ld_company='ТОО «Почта»';COMM.q.ld_email='bad';ACT.cmLeadAdd()"); eq(ev('S.leads.length'), n, 'invalid e-mail accepted');
    ev("COMM.q.ld_email='sales@pochta.kz';COMM.q.ld_phone='+7 701 555 44 33';COMM.q.ld_msg='Нужна доставка';ACT.cmLeadAdd()"); eq(ev('S.leads.length'), n + 1); const nl = ev('S.leads[0]'); eq(nl.email, 'sales@pochta.kz'); eq(nl.phone, '+7 701 555 44 33'); eq(nl.msg, 'Нужна доставка'); clean(w, 'crm after new lead');
  });
  await group('R2 P15 onboarding card: customer created / linked, portal user with one-time password, API client with scopes, shown once', 'ru', async (g, ev, w) => {
    ev(CM('crm') + ";COMM.q.ld_company='ТОО «Онборд Тест»';COMM.q.ld_bin=tinFix('19024000555');ACT.cmLeadAdd()"); const id = ev('S.leads[0].id'), cu = ev('S.customers.length');
    ev(`ACT.cmLead({id:'${id}',v:'won'})`); eq(ev('S.customers.length'), cu + 1, 'customer created'); eq(ev('S.drawer.type'), 'lead', 'drawer after convert');
    const dr = () => w.document.querySelector('.drawer'); assert(/Клиент создан/.test(dr().querySelector('[data-onb-first]').innerText), 'created line');
    assert(dr().querySelector('[data-act=cmOnbUser]') && dr().querySelector('[data-act=cmOnbApi]'), 'admin sees both rows'); assert(/\.portal/.test(dr().querySelector('[data-act=cmOnbUser]').innerText), 'login preview'); clean(w, 'onboarding');
    const us = ev('S.users.length'); ev(`ACT.cmOnbUser({id:'${id}'})`); eq(ev('S.users.length'), us + 1, 'portal user'); const u = ev('S.users[S.users.length-1]'); eq(u.role, 'customer'); eq(u.ref, ev(`S.leads.find(l=>l.id==='${id}').custId`)); assert(/^[a-z0-9]+\.portal$/.test(u.username), 'login ' + u.username);
    assert(/\.portal · \S{8}$/.test(dr().querySelector('[data-onb-pw]').innerText.trim()), 'one-time password shown'); assert(dr().querySelector('[data-onb-userok]'), 'portal user exists');
    w.document.querySelectorAll('[data-onb-scope]').forEach(c => { c.checked = false; }); w.document.querySelector('[data-onb-scope]').dispatchEvent(new w.Event('change', { bubbles: true })); assert(w.document.querySelector('#onb_apibtn').disabled, 'button disabled without scope');
    const k = ev('S.apiKeys.length'); ev(`ACT.cmOnbApi({id:'${id}'})`); eq(ev('S.apiKeys.length'), k, 'API client without scope');
    ev(`ACT.cmOnbApi({id:'${id}',scopes:'slots:read,bookings:write',hook:'http://x'})`); eq(ev('S.apiKeys.length'), k, 'http webhook accepted');
    const wh = ev('S.webhooks.length'); ev(`ACT.cmOnbApi({id:'${id}',scopes:'slots:read,bookings:write',hook:'https://erp.onbord.example/hook'})`); eq(ev('S.apiKeys.length'), k + 1, 'API client'); eq(ev('S.webhooks.length'), wh + 1, 'webhook');
    assert(/^olk_[0-9a-f]{8}_[0-9a-f]{24}$/.test(dr().querySelector('[data-onb-key]').innerText.trim()), 'key shown'); assert(dr().querySelector('[data-onb-apiok]'), 'API client exists'); assert(ev("S.audit.some(a=>a.decision==='API client created')") && ev("S.audit.some(a=>a.decision==='Portal user created')"), 'audited');
    ev(`closeDrawer();ACT.cmLeadOpen({id:'${id}'})`); assert(!dr().querySelector('[data-onb-secret]'), 'secret shown twice');
    ev(CM('crm') + ";COMM.q.ld_company='ТОО «Дубль»';COMM.q.ld_bin=CUSTOMERS[0].bin;ACT.cmLeadAdd()"); const id2 = ev('S.leads[0].id'), cu2 = ev('S.customers.length'); ev(`ACT.cmLead({id:'${id2}',v:'won'})`); eq(ev('S.customers.length'), cu2, 'duplicate customer'); assert(/без дубликата/.test(dr().querySelector('[data-onb-first]').innerText), 'linked line'); assert(dr().querySelector('[data-onb-userok]'), 'c1 already has a portal user');
    ev(`ACT.setRole({v:'dispatcher'});ACT.cmLeadOpen({id:'${id2}'})`); assert(dr().querySelector('[data-onb-first]'), 'dispatcher sees the first line'); assert(!dr().querySelector('[data-onb-user], [data-onb-api]'), 'dispatcher sees admin rows'); clean(w, 'onboarding dispatcher');
    ev(`ACT.cmOnbUser({id:'${id2}'})`); assert(/users:admin/.test(ev('S.toast.msg')), 'dispatcher refused');
  });
  await group('R2 P16 customers: e-mail and phone masked, "Show personal data" only with pii:read and audited, new customer stores contacts', 'ru', async (g, ev, w) => {
    ev(CM('customers')); const root = () => w.document.querySelector('.content');
    assert(!/office@example\.kz/.test(root().innerText), 'clear e-mail in the table'); assert(/o\*\*\*@example\.kz/.test(root().innerText), 'masked e-mail'); assert(/\+7 7•• ••• •• 00/.test(root().innerText), 'masked phone');
    const a0 = ev('S.audit.length'); w.document.querySelector('[data-act=cmPiiShow][data-id=c2]').click(); eq(ev('S.audit.length'), a0 + 1, 'reveal audited'); eq(ev('S.audit[0].decision'), 'PD viewed'); eq(w.document.querySelector('[data-pii-id=c2]').dataset.pii, 'clear'); assert(/office@example\.kz/.test(w.document.querySelector('[data-pii-id=c2]').innerText), 'revealed');
    eq(w.document.querySelector('[data-pii-id=c1]').dataset.pii, 'masked', 'only that row'); clean(w, 'customers revealed');
    ev("ACT.setRole({v:'dispatcher'});" + CM('customers')); assert(!w.document.querySelector('[data-act=cmPiiShow]'), 'dispatcher can reveal'); ev("ACT.cmPiiShow({id:'c3'})"); assert(!ev("COMM.revealed.c3"), 'dispatcher revealed');
    const n = ev('S.customers.length'); ev("COMM.q.bin=tinFix('17054000888');COMM.q.name='ТОО «Контакт»';COMM.q.cu_email='x@contact.kz';COMM.q.cu_phone='+7 702 111 22 33';ACT.cmCustAdd()"); eq(ev('S.customers.length'), n + 1); const c = ev('S.customers[S.customers.length-1]'); eq(c.email, 'x@contact.kz'); eq(c.phone, '+7 702 111 22 33');
    assert(/x\*\*\*@contact\.kz/.test(w.document.querySelector(`[data-pii-id=${c.id}]`).innerText), 'new customer masked'); clean(w, 'customers dispatcher');
  });
  await group('R2 P17 contracts: void needs a reason (≥ 3), staff cannot sign for the customer, template language', 'ru', async (g, ev, w) => {
    ev(CM('contracts')); assert(!w.document.querySelector('[data-act=cmCtSign]'), 'staff sign link'); assert(w.document.querySelector('[data-ct-signnote]'), 'customer-signs note');
    ev("ACT.cmCtSign({id:'DG-26-0019'})"); eq(ev("S.contracts.find(c=>c.id==='DG-26-0019').status"), 'sent', 'staff signed');
    w.document.querySelector('[data-act=cmCtVoid][data-id="DG-26-0019"]').click(); assert(w.document.querySelector('#cm_ct_vr'), 'reason field');
    ev("COMM.q.ct_vr='ab';ACT.cmCtVoidOk({id:'DG-26-0019'})"); eq(ev("S.contracts.find(c=>c.id==='DG-26-0019').status"), 'sent', 'void with 2 chars'); assert(w.document.querySelector('#cm_ct_vrerr'), 'reason error');
    ev("COMM.q.ct_vr='Клиент отказался';ACT.cmCtVoidOk({id:'DG-26-0019'})"); const c = ev("S.contracts.find(c=>c.id==='DG-26-0019')"); eq(c.status, 'void'); eq(c.voidReason, 'Клиент отказался'); eq(ev('S.audit[0].reason'), 'Клиент отказался', 'audited with reason');
    assert(/Клиент отказался/.test(w.document.querySelector('[data-ct-void="DG-26-0019"]').innerText), 'reason in the Signature column');
    ev("ACT.cmCtView({id:'DG-26-0019'})"); assert(/Клиент отказался/.test(w.document.querySelector('[data-ct-voidtext]').innerText), 'reason in the text card'); clean(w, 'contracts void');
    const opts = [...w.document.querySelectorAll('#cm_ct_kind option')].map(o => o.value); assert(['framework:RU', 'framework:DE', 'framework:EN', 'spot:EN'].every(x => opts.includes(x)), 'template languages ' + opts);
    ev("COMM.q.ct_cust='c4';COMM.q.ct_kind='framework:EN';ACT.cmCtAdd()"); const n = ev('S.contracts[0]'); eq(n.kind, 'framework'); eq(n.tpl, 'FW-EN v3'); eq(n.lang, 'EN'); assert(/EN/.test(n.text.split('\n')[0]), 'language in the header'); eq(n.sha.length, 64);
    assert(/EN/.test(w.document.querySelector('[data-ct-meta]').innerText), 'language in the text card'); ev("ACT.cmCtPrint({id:S.contracts[0].id})"); eq(w.__downloads.length, 1, 'print recorded'); clean(w, 'contracts new');
  });
  await group('R2 tasks: Mine / All, assignee select, CRM link opens the lead', 'ru', async (g, ev, w) => {
    ev(CM('tasks')); assert(w.document.querySelector('[data-task-seg]'), 'segments'); ev("ACT.cmTaskSeg({v:'all'})"); const all = w.document.querySelectorAll('[data-task]').length;
    ev("COMM.q.tk_title='Отправить КП';COMM.q.tk_who='D. Lee';ACT.cmTaskAdd()"); eq(ev('S.tasks[S.tasks.length-1].who'), 'D. Lee', 'assignee'); eq(w.document.querySelectorAll('[data-task]').length, all + 1);
    ev("ACT.cmTaskSeg({v:'mine'})"); assert(w.document.querySelectorAll('[data-task]').length < all + 1, 'mine filter'); assert(![...w.document.querySelectorAll('[data-task]')].some(r => /D\. Lee/.test(r.innerText)), 'other assignee in mine'); clean(w, 'tasks mine');
    ev("ACT.cmTaskSeg({v:'all'})"); w.document.querySelector('[data-task] [data-act=cmLeadOpen]').click(); eq(ev('S.drawer.type'), 'lead', 'CRM link');
  });
  for (const lang of LANGS) await group('[' + lang + '] R2 CRM / customers / contracts / onboarding render without undefined/NaN; DE/EN drawers without Cyrillic', lang, async (g, ev, w) => {
    const CYR = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/;
    for (const r of ['admin', 'dispatcher', 'auditor']) { ev(`ACT.setRole({v:'${r}'})`); for (const s of ['customers', 'prices', 'offers', 'contracts', 'crm', 'tasks', 'fx']) { ev(CM(s)); clean(w, r + ' ' + s); } }
    ev("ACT.setRole({v:'admin'});" + CM('customers') + ";ACT.cmPiiShow({id:'c1'})"); clean(w, 'revealed');
    ev(CM('contracts') + ";ACT.cmCtVoid({id:'DG-26-0021'})"); clean(w, 'void form'); ev("ACT.cmCtVoid({id:'DG-26-0021',reason:'duplicate'});ACT.cmCtView({id:'DG-26-0021'})"); clean(w, 'void text');
    for (const id of ['L-101', 'L-102', 'L-103', 'L-099']) { ev(`ACT.cmLeadOpen({id:'${id}'})`); clean(w, 'lead ' + id); if (lang === 'de' || lang === 'en') { const t = w.document.querySelector('.drawer').innerText.replace(/Sarah Johnson/g, ''); assert(!CYR.test(t), lang + ' Cyrillic in lead ' + id + ': ' + (t.match(/.{0,20}[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі].{0,20}/) || [''])[0]); } }
    ev("ACT.cmLead({id:'L-103',v:'won'})"); clean(w, 'onboarding'); if (lang === 'de' || lang === 'en') assert(!CYR.test(w.document.querySelector('[data-onb]').innerText), lang + ' Cyrillic in onboarding');
    ev("ACT.cmOnbUser({id:'L-103'});ACT.cmOnbApi({id:'L-103',scopes:'slots:read'})"); clean(w, 'onboarding done');
    ev("ACT.setRole({v:'dispatcher'});ACT.cmLeadOpen({id:'L-103'})"); clean(w, 'onboarding dispatcher');
    ev("closeDrawer();ACT.setRole({v:'auditor'});ACT.cmLeadOpen({id:'L-102'})"); clean(w, 'lead auditor'); assert(!w.document.querySelector('.drawer [data-lead-edit]'), 'auditor edit form');
    ev("go('help');ACT.helpGo({k:'orders/commercial'})"); clean(w, 'help orders/commercial');
  });
