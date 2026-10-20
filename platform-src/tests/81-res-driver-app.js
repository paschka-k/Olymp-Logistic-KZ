  /* ---- W2 driver app (FR-52…67, 83, 107, 108) ---- */
  const DAPP = "ACT.setRole({v:'driver'})";   // R2/D2: only the driver role acts in the app (admin = read-only preview)
  await group('W2 driver app: role shell, own trip binding, all tabs render (FR-83)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'driver'})"); eq(ev('S.route'), 'driverapp'); assert(w.document.querySelector('.da-phone'), 'phone frame'); assert(!ev("canSee('billing')"), 'driver sees billing');
    for (const t of ['shift', 'route', 'stop', 'ret', 'fuel', 'me']) { ev(`ACT.daTab({v:'${t}'})`); clean(w, 'driver tab ' + t); }
    ev(DAPP); assert(w.document.querySelector('.da-phone'), 'admin tab'); eq(ev('S.da.drv'), 'd4');
  });
  await group('W2 driver app: shift start gates waybill by medical + checklist (FR-52/53/114)', 'ru', async (g, ev) => {
    ev("S.res.rules.medEnforce=true;delete S.res.med.d1;S.da.drv='d1';load('LD-2026-001850').status='assigned'"); ev(DAPP); ev("S.da.drv='d1';render()");
    ev("ACT.daChk({v:'tyres',s:'bad'})"); eq(ev("S.da.sh.d1.chk.tyres"), 'bad', 'defect set'); assert(ev("S.da.feed.some(e=>e.mod==='fleet')"), 'defect event to fleet');
    ev("ACT.daMed({v:'1'})"); eq(ev("S.da.sh.d1.med"), true); assert(ev("RES.medOk(drv('d1'))"), 'staff medical record');
    for (const c of ['tyres', 'lights', 'reefer', 'logger', 'seal', 'docs', 'kit']) ev(`ACT.daChk({v:'${c}',s:'ok'})`);
    ev("document.querySelector('#da_odo').value=205600;ACT.daSignWb()"); assert(ev("S.da.sh.d1.wb"), 'waybill signed'); assert(ev("S.res.waybills.some(w=>w.load==='LD-2026-001850'&&w.odoStart===205600)"), 'waybill stored');
  });
  await group('W2 driver app: delivery flow thermochron -> SSCC -> photo -> signature -> ePOD (FR-57/58/107/108)', 'ru', async (g, ev, w) => {
    ev(DAPP); eq(ev("loadOfDriver('d4').id"), 'LD-2026-001847'); ev("RES.daSeed();S.da.sh.d4.departed=true;const ss=S.da.sh.d4.stops;ss.forEach((s,i)=>{if(i<ss.length-1)s.st='done'});ss[ss.length-1].st='arrived'"); ev("ACT.daTab({v:'stop'})"); assert(w.document.querySelector('.da-steps'), 'stop flow');
    ev("ACT.daStep({v:'1'})"); ev("document.querySelector('#da_tmin').value=3.1;document.querySelector('#da_tmax').value=11;ACT.daThermo()"); assert(ev("S.res.thc[0].load==='LD-2026-001847'&&S.res.thc[0].ok===false"), 'thermochron logged as excursion'); assert(ev("S.devs.some(d=>d.load==='LD-2026-001847')"), 'deviation opened');
    ev("ACT.daScanAll()"); ev("ACT.daStep({v:'3'})"); ev("ACT.daPhoto()"); ev("ACT.daStep({v:'4'})"); ev("RES.daSignDemo()"); ev("document.querySelector('#da_signer').value='Aigul Saparova';document.querySelector('#da_role').value='clerk';ACT.daSign()");
    const e = ev("load('LD-2026-001847').epod"); assert(e && e.signer === 'Aigul Saparova' && e.lat && e.lon && e.photo && e.temp, 'epod evidence'); eq(ev("load('LD-2026-001847').status"), 'delivered'); eq(ev("load('LD-2026-001847').pod"), 'submitted'); eq(ev("drv('d4').status"), 'available');
  });
  await group('W2 driver app: signature required, exceptions open deviations, incidents reach security (FR-59/62)', 'ru', async (g, ev) => {
    ev(DAPP); ev("RES.daSeed();const ss=S.da.sh.d4.stops;ss.forEach((s,i)=>{if(i<ss.length-1)s.st='done'});const u=ss[ss.length-1];u.st='arrived';u.step=4"); ev("ACT.daTab({v:'stop'})");
    ev("document.querySelector('#da_signer').value='X Y';ACT.daSign()"); eq(ev("load('LD-2026-001847').status"), 'in_transit', 'no signature -> no delivery');
    ev("ACT.daExc({v:'damage'})"); assert(ev("S.devs.some(d=>/Повреждение/.test(d.title))"), 'damage deviation'); const n = ev('S.inc.length'); ev("ACT.daInc({v:'breakdown'})"); assert(ev('S.inc.length') > n, 'incident'); assert(ev("S.res.svc.some(s=>s.truck==='t5'&&/Поломка/.test(s.text))"), 'breakdown -> service request');
    const eta = ev("load('LD-2026-001847').eta"); ev("ACT.daInc({v:'delay'})"); assert(ev("load('LD-2026-001847').eta") !== eta, 'delay moves ETA');
  });
  await group('W2 driver app: offline queue, sync and SMS mode (FR-67/109)', 'ru', async (g, ev) => {
    ev("ACT.setRole({v:'driver'});S.da.drv='d4'"); ev("ACT.daNet()"); assert(ev('S.da.off'), 'offline'); ev("RES.daSeed();ACT.daAck({v:'m1'})"); eq(ev('S.da.queue.length'), 1);
    ev("ACT.daOffAdd();ACT.daOffAdd();ACT.daOffAdd()"); assert(ev('S.da.offMin') >= 30, '30 min'); ev("ACT.daInc({v:'accident'})"); assert(ev("S.da.smsOut.length") > 0, 'critical event by SMS'); assert(ev("S.da.smsOut.some(m=>/^OL1;/.test(m.text))"), 'OL1 format'); assert(ev('S.da.smsOut.every(m=>m.text.length<=160)'), 'SMS <= 160');
    ev("ACT.daNet()"); eq(ev('S.da.queue.length'), 0, 'synced'); assert(ev("S.da.feed.some(e=>e.st==='synced')"), 'synced marker');
  });
  await group('W2 driver app: fines notice, fuel, returns, shift end (FR-60/61/64/65)', 'ru', async (g, ev) => {
    ev(DAPP); const fid = ev("S.res.fines.find(f=>f.plate==='654 MNO 09').id"); ev(`ACT.daFine({v:'${fid}',s:'accepted'})`); eq(ev(`S.res.fines.find(f=>f.id==='${fid}').status`), 'accepted');
    const c0 = ev('S.costs.length'); ev("ACT.daTab({v:'fuel'});document.querySelector('#da_fl').value=300;document.querySelector('#da_fp').value=290;document.querySelector('#da_fo').value=120400;ACT.daFuel()"); eq(ev('S.costs.length'), c0 + 1, 'fuel cost'); assert(ev('S.da.sh.d4.fuel[0].cons') > 0, 'consumption');
    ev("ACT.daRet({v:'boxes'})"); assert(ev("S.da.sh.d4.ret.boxes"), 'return accepted');
    ev("ACT.daTab({v:'me'});ACT.daDef({v:'tyres'})"); const hw = ev('drv("d4").res.year'); ev("document.querySelector('#da_odoE').value=120600;ACT.daEnd()"); assert(ev('S.da.sh.d4.ended'), 'ended'); assert(ev('drv("d4").res.year') > hw, 'hours to staff'); assert(ev("S.res.svc.some(s=>s.kind==='defect')"), 'defect -> service request');
  });
  await group('W2 driver app: Kazakh UI and 4 languages without undefined (FR-66)', 'ru', async (g, ev, w) => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { gg.ev("ACT.setRole({v:'driver'})"); for (const t of ['shift', 'route', 'stop', 'ret', 'fuel', 'me']) { gg.ev(`ACT.daTab({v:'${t}'})`); clean(gg.w, 'driver ' + lang + ' ' + t); } if (lang === 'kk') assert(/Ауысым|Маршрут/.test(gg.w.document.querySelector('.da-tabs').innerText), 'kazakh tabs'); } finally { gg.done(); } }
    ev("ACT.setRole({v:'driver'});ACT.daLang({v:'kk'})"); assert(/Ауысым/.test(w.document.querySelector('.da-tabs').innerText), 'app language independent of page');
  });
