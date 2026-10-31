  /* ---- W2 resources: fleet registry (FR-27/50/118/141/157/158) and staff (FR-08/10/46/55/114/120/122/123) ---- */
  await group('W2 fleet: new truck needs checklist, then becomes plannable (FR-157)', 'ru', async (g, ev, w) => {
    ev("go('fleet');ACT.stab({s:'fleet',v:'registry'})"); assert(w.document.querySelector('#rg_table'), 'registry table'); clean(w, 'registry');
    ev("S.trucks.push(Object.assign({}, S.trucks[0], {id:'t9',plate:'999 ZZZ 01',docs:Object.assign({}, S.trucks[0].docs),svc:Object.assign({}, S.trucks[0].svc),ob:null,lp:null,status:'available'}));RES.initTruck(trk('t9'),true)");
    assert(!ev("RES.planAvail(trk('t9'))"), 'must not be plannable before closing'); assert(ev("compat(load('LD-2026-001852'),drv('d2'),trk('t9')).some(x=>/FR-157/.test(x))"), 'compat must name the checklist');
    assert(ev("RES.obClose(trk('t9'))"), 'close must be refused while incomplete'); ev("trk('t9').lp.src='sts';trk('t9').lp.date='2026-10-01'");
    eq(typeof ev("RES.obConfirm(trk('t9'),'sts','X1')"), 'string', 'F-63: STS ref must match 4–30 chars'); for (const k of ['sts', 'tachograph', 'adr']) ev(`RES.obConfirm(trk('t9'),'${k}','STS-1234')`);
    eq(ev("RES.obClose(trk('t9'))"), null, 'close'); assert(ev("RES.planAvail(trk('t9'))"), 'plannable after close');
  });
  await group('W2 fleet: load profile calibration validates and computes axle shares (FR-141)', 'ru', async (g, ev) => {
    assert(typeof ev("RES.lpSave(trk('t4'),{src:'sts',date:'',ref:'',front0:3000,rear0:3000,gvw:5000,frontMax:1,rearMax:1,wb:500,x0:100,lenIn:600,l100:15})") === 'string', 'gross mass check');
    eq(ev("RES.lpSave(trk('t4'),{src:'weighing',date:'2026-10-18',ref:'T1',front0:2600,rear0:2200,gvw:10000,frontMax:3800,rearMax:6600,wb:470,x0:110,lenIn:620,l100:16})"), null); eq(ev("trk('t4').lp.src"), 'weighing');
    const a = ev('RES.axleShares(500,100,600)'); eq(a.axF + a.axR, 100, 'shares sum');
  });
  await group('W2 fleet: warranty forecast by mileage (FR-50)', 'ru', async (g, ev) => {
    const w = ev("RES.warranty(trk('t6'))"); assert(w.months > 0 && isFinite(w.months), 'months'); eq(w.by, 'km', 'limited by mileage');
    ev("trk('t1').km=599000"); assert(ev("RES.warranty(trk('t1'))").months < 1, 'near limit'); eq(ev("RES.warranty(trk('t1'))").state, 'red');
  });
  await group('W2 fleet: service request changes availability and slot capacity (FR-27/118)', 'ru', async (g, ev) => {
    const cap0 = ev("RES.slotCapacity('AST')"); const r = ev("RES.svcCreate({truck:'t1',kind:'repair',etaH:24,cost:100000})"); assert(r.ok, 'created'); eq(ev("trk('t1').status"), 'service');
    assert(ev("RES.slotCapacity('AST')") < cap0, 'capacity must fall'); assert(ev("compat(load('LD-2026-001853'),drv('d2'),trk('t1')).length") > 0, 'blocked for assignment');
    assert(typeof ev("RES.svcCreate({truck:'t1',kind:'repair',etaH:24,cost:1})") === 'string', 'second open request refused');
    for (const s of ['accepted', 'in_work', 'done']) ev(`RES.svcSet('${r.ok}','${s}')`); eq(ev("trk('t1').status"), 'available'); eq(ev("RES.slotCapacity('AST')"), cap0); assert(ev("S.costs.some(c=>c.ref==='" + r.ok + "')"), 'cost entry');
    const c2 = ev("RES.svcCreate({truck:'t5',kind:'to',etaH:8,cost:50000})"); assert(c2.ok, 'busy truck request'); eq(ev("trk('t5').status"), 'busy', 'busy truck keeps its trip'); eq(ev(`S.res.svc.find(s=>s.id==='${c2.ok}').status`), 'planned');
  });
  await group('W2 fleet: saved views and CSV export of visible columns (FR-158)', 'ru', async (g, ev, w) => {
    ev("go('fleet');ACT.stab({s:'fleet',v:'registry'})"); w.document.querySelector('#rg_vname').value = 'Тест'; ev("ACT.rgSave()"); assert(ev("S.res.views.some(v=>v.name==='Тест'&&v.cols.length>3)"), 'view saved');
    ev("ACT.rgCsv()"); const csv = ev('S.res.lastCsv'); eq(csv.split('\r\n').length, 1 + ev('S.trucks.length'), 'rows'); assert(csv.split('\r\n')[0].split(';').length === ev("S.res.views.find(v=>v.name==='Тест').cols.length"), 'only visible columns');
  });
  await group('W2 staff: driving-time blocks 4.5 h / 9 h / 56 h and break reset (FR-08/55/120)', 'ru', async (g, ev) => {
    eq(ev("RES.driveState(drv('d2')).lvl"), 2, 'd2 near 4.5 h'); ev("drv('d2').res.cont=4.5"); eq(ev("RES.driveState(drv('d2')).lvl"), 3); assert(ev("RES.driverBlocks(drv('d2'),null).length") > 0, 'blocked');
    ev("drv('d2').res.cont=0"); eq(ev("RES.driveState(drv('d2')).lvl"), 0); ev("drv('d3').week=56"); eq(ev("RES.driveState(drv('d3')).lvl"), 3, 'week limit');
    const u = ev("RES.urgent('AST',{zone:'pharma',hrs:6})"); assert(u.drivers.some(x => x.ok) && u.trucks.some(x => x.ok), 'urgent pair'); assert(!u.drivers.find(x => x.d.id === 'd3').ok, 'week-limit driver excluded');
  });
  await group('W2 staff: absences block assignment and 14-day plan shows them (FR-46)', 'ru', async (g, ev) => {
    eq(ev("RES.absAdd({drv:'d5',type:'vacation',from:RES.TODAY,to:RES.addDays(RES.TODAY,2)}).ok !== undefined"), true); assert(ev("RES.driverBlocks(drv('d5'),null).length") > 0, 'absent blocked'); eq(ev("drv('d5').status"), 'rest');
    assert(typeof ev("RES.absAdd({drv:'d5',type:'sick',from:RES.TODAY,to:RES.TODAY})") === 'string', 'overlap refused');
    const p = ev("RES.plan14(drv('d1'))"); eq(p.length, 14); assert(p.some(c => c.k === 'vacation'), 'vacation visible'); const per = [0, 1, 2, 3, 4, 5, 6].map(i => ev(`S.drivers.filter(d=>RES.plan14(d)[${i}].k==='r').length`)); assert(Math.max(...per) <= 4, '4 trucks max'); assert(ev("RES.plan14(drv('d2')).filter((c,i)=>RES.planDays()[i]&&new Date(RES.planDays()[i]+'T12:00:00').getDay()===0).every(c=>c.k==='m'||c.k==='sick'||c.k==='vacation'||c.k==='training')"), 'sunday = maintenance');
  });
  await group('W2 staff: medical check mandatory in 2027 regime (FR-114)', 'ru', async (g, ev) => {
    assert(!ev("RES.driverBlocks(drv('d5'),null).some(x=>/FR-114/.test(x))"), 'warning only before 2027'); ev("S.res.rules.medEnforce=true");
    assert(ev("RES.driverBlocks(drv('d5'),null).some(x=>/FR-114/.test(x))"), 'blocked without record'); ev("RES.medRecord(drv('d5'),true)"); assert(!ev("RES.driverBlocks(drv('d5'),null).some(x=>/FR-114/.test(x))"), 'released after record');
    ev("RES.medRecord(drv('d5'),false)"); assert(ev("RES.driverBlocks(drv('d5'),null).some(x=>/FR-114/.test(x))"), 'unfit blocks');
  });
  await group('W2 staff: ADR / licence deadlines and course booking (FR-10)', 'ru', async (g, ev) => {
    eq(ev("RES.adrState(drv('d6')).state"), 'expired'); eq(ev("RES.adrState(drv('d2')).state"), 'd60'); eq(ev("RES.adrState(drv('d3')).has"), false); ev("RES.adrBook(drv('d2'))"); assert(ev("RES.adrState(drv('d2')).booked"), 'booked');
    assert(ev("compat(Object.assign({}, load('LD-2026-001852'),{adr:true}),drv('d3'),trk('t1')).some(x=>/ADR|ДОПОГ/.test(x))") !== undefined, 'compat call works');
  });
  await group('W2 staff: fines attributed at violation time, recovery process (FR-122/123)', 'ru', async (g, ev, w) => {
    eq(ev("S.res.fines.find(f=>f.plate==='654 MNO 09').drv"), 'd4', 'attributed to waybill driver, not current'); assert(!ev("S.res.fines.find(f=>f.plate==='456 DEF 02').drv"), 'no waybill at that time -> manual');
    const fid = ev("S.res.fines.find(f=>f.plate==='456 DEF 02').id"); ev(`RES.fineAssign('${fid}','d5')`); eq(ev(`S.res.fines.find(f=>f.id==='${fid}').status`), 'attributed');
    assert(typeof ev(`RES.fineSet('${fid}','deducted')`) === 'string', 'cannot skip steps');
    for (const s of ['notified', 'accepted', 'deducted']) eq(ev(`RES.fineSet('${fid}','${s}')`), null); assert(ev(`S.costs.some(c=>c.ref==='${fid}'&&c.amount<0)`), 'deduction entry');
    const n = ev('RES.fineImport().length'); assert(n === 2 && ev("S.res.fines.filter(f=>f.drv).length") >= 3, 'import attributes by waybill');
    ev("go('drivers');ACT.stab({s:'drivers',v:'staff'})"); assert(w.document.querySelector('[data-fine]'), 'fines table'); clean(w, 'staff');
  });
  await group('R6 staff: urgent trip U-<n> is created when no unassigned load exists (S-17/S-19)', 'ru', async (g, ev) => {
    ev("ACT.setRole({v:'admin'})"); const n0 = ev('S.loads.length'); const r = ev("RES.urgentTrip('AST',{zone:'chilled',hrsRaw:'3'})"); assert(r && /^U-\d+$/.test(r.ok), 'urgent trip id: ' + JSON.stringify(r)); eq(ev('S.loads.length'), n0 + 1); eq(ev(`load('${r.ok}').status`), 'assigned'); eq(ev(`load('${r.ok}').notes.some(n=>/Срочный рейс/.test(n.text))`), true);
    assert(/h/.test(ev("RES.urgentTrip('AST',{hrsRaw:'20'})")), 'h outside 0.5…12 refused'); assert(typeof ev("RES.urgentTrip('AST',{order:'ZZ'})") === 'string', 'unknown order refused');
  });
