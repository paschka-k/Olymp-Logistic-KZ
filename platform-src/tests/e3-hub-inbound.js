  /* ---- R3 hub inbound (ideas I-1 … I-7, docs/IDEAS-R3.md): inbound list, sender chips, pre-carriage, gate slots, dwell, demurrage, gate check ---- */
  const E3_CYR = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/;
  for (const lang of LANGS) {
    await group('[' + lang + '] hub inbound: four tabs and three drawers render without undefined / NaN; DE / EN without Cyrillic', lang, async (g, ev, w) => {
      const lat = lang === 'de' || lang === 'en';
      for (const t of ['inbound', 'slots', 'pre', 'dem']) {
        ev(`go('hubs');ACT.stab({s:'hubs',v:'${t}'})`); const c = w.document.querySelector('.content'); assert(c.innerText.length > 120, t + ' empty'); clean(w, lang + ' hubs/' + t);
        if (lat) assert(!E3_CYR.test(c.innerText), lang + ' Cyrillic on hubs/' + t + ': ' + (c.innerText.match(/.{0,30}[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі].{0,30}/) || [''])[0]);
      }
      for (const spec of ["{type:'ibGate',id:'IN-0614'}", "{type:'ibSlot',job:'IN-0613'}", "{type:'ibPre'}"]) {
        ev(`openDrawer(${spec})`); const d = w.document.querySelector('.drawer'); assert(d && d.innerText.length > 60, 'drawer ' + spec); clean(w, lang + ' drawer ' + spec);
        if (lat) assert(!E3_CYR.test(d.innerText), lang + ' Cyrillic in drawer ' + spec);
        ev('closeDrawer()');
      }
      for (const k of ['hubs/inbound', 'hubs/slots', 'hubs/pre', 'hubs/dem']) { assert(ev(`!!helpArt('${k}')`), 'help ' + k); ev(`go('hubs');ACT.stab({s:'hubs',v:'${k.split('/')[1]}'})`); eq(ev('helpKeyFor()'), k, '"?" opens ' + k); }
    });
  }
  await group('I-1 inbound list: every arriving vehicle with direction, job, priority and status; filters respect the global hub filter', 'ru', async (g, ev, w) => {
    ev("go('hubs');ACT.stab({s:'hubs',v:'inbound'})");
    const n = ev('ibList().length'); eq(n, ev('S.jobs.length'), 'all jobs listed'); eq(w.document.querySelectorAll('[data-ib-list] tbody tr[data-ib-row]').length, n, 'one row per vehicle');
    eq(ev("ibDirOf(S.jobs.find(j=>j.id==='IN-0611'))"), 'line'); eq(ev("ibDirOf(S.jobs.find(j=>j.id==='IN-0631'))"), 'line', 'linked load'); eq(ev("ibDirOf(S.jobs.find(j=>j.id==='IN-P01'))"), 'pre'); eq(ev("ibDirOf(S.jobs.find(j=>j.id==='IN-0613'))"), 'local');
    eq(ev("S.jobs.find(j=>j.id==='IN-0611').ib.pri"), 'high', 'pharma is high');
    const row = w.document.querySelector('[data-ib-row="IN-0614"]').innerText; assert(/КПП|воротах/i.test(row) || /Караганда|Қарағанды/.test(row), 'row shows status / origin: ' + row.slice(0, 80));
    ev("ACT.hubSet({v:'ALA'})"); ev("go('hubs');ACT.stab({s:'hubs',v:'inbound'})"); assert(ev("ibList().every(j=>j.hub==='ALA')"), 'global hub filter'); eq(w.document.querySelectorAll('[data-ib-row]').length, ev("S.jobs.filter(j=>j.hub==='ALA').length"));
    ev("ACT.hubSet({v:''});S.ib.f.dir='pre';render()"); assert(ev("ibList().length>=2&&ibList().every(j=>j.pre)"), 'direction filter');
    ev("S.ib.f.dir='';S.ib.f.pri='high';render()"); assert(ev("ibList().every(j=>j.ib.pri==='high')"), 'priority filter');
    ev("S.ib.f.pri='';S.ib.f.st='3';render()"); assert(ev("ibList().length>0&&ibList().every(j=>j.ev.en!=null)"), 'status filter'); ev('ACT.ibClr()'); eq(ev('ibList().length'), n, 'clear');
  });
  await group('I-2 senders as numbered chips with plain text on hover, colour by status', 'ru', async (g, ev, w) => {
    ev("go('hubs');ACT.stab({s:'hubs',v:'inbound'})");
    const chips = [...w.document.querySelectorAll('[data-ib-row="IN-0621"] [data-ib-sender]')]; eq(chips.length, 2, 'two senders'); eq(chips[0].textContent, '1'); eq(chips[1].textContent, '2');
    assert(/Аптека Сервис/.test(chips[0].title), 'hover text: ' + chips[0].title); eq(chips[0].dataset.ibSender, 'bad', 'QA hold is red'); assert(chips[0].classList.contains('red'));
    eq(ev("ibSenderSt(S.jobs.find(j=>j.id==='IN-0624'),0)"), 'done', 'unloaded is green'); eq(ev("ibSenderSt(S.jobs.find(j=>j.id==='IN-0616'),0)"), 'unl', 'unloading is blue'); eq(ev("ibSenderSt(S.jobs.find(j=>j.id==='IN-0614'),0)"), 'gate', 'at gate is yellow'); eq(ev("ibSenderSt(S.jobs.find(j=>j.id==='IN-0622'),0)"), 'plan');
    assert(w.document.querySelectorAll('[data-ib-row="IN-P01"] [data-ib-sender]').length === 2, 'pre-carriage points are chips too');
  });
  await group('I-3 pre-carriage: pickup date, forwarder, plate to follow, kg / m³ / pieces per point; creates an expected inbound', 'ru', async (g, ev, w) => {
    assert(typeof ev("ibPreAdd({date:'',fwd:'x',hub:'AST',zone:'chilled',points:[{name:'a',kg:1,m3:1,pcs:1}]})") === 'string', 'needs date');
    assert(typeof ev("ibPreAdd({date:'2026-10-22',fwd:'x',hub:'AST',zone:'chilled',points:[]})") === 'string', 'needs a point');
    assert(typeof ev("ibPreAdd({date:'2026-10-22',fwd:'x',hub:'AST',zone:'chilled',points:[{name:'a',kg:0,m3:1,pcs:1}]})") === 'string', 'kg > 0');
    const n = ev('S.jobs.length');
    ev("go('hubs');ACT.stab({s:'hubs',v:'pre'});ACT.ibPreNew()"); const set = (id, v) => { const e = w.document.getElementById(id); e.value = v; };
    set('ibp_hub', 'SHY'); set('ibp_zone', 'chilled'); set('ibp_n0', 'Склад Тараз'); set('ibp_kg0', '1200'); set('ibp_m30', '4.5'); set('ibp_pcs0', '5'); set('ibp_n1', 'Склад Туркестан'); set('ibp_kg1', '300'); set('ibp_m31', '1'); set('ibp_pcs1', '2');
    ev('ACT.ibPreSave()'); eq(ev('S.jobs.length'), n + 1, 'expected inbound created'); const pc = ev('S.ib.pre[S.ib.pre.length-1]'); eq(pc.points.length, 2); eq(pc.plate, '', 'plate to follow'); eq(pc.points[0].kg, 1200); eq(pc.points[0].m3, 4.5);
    const j = ev(`S.jobs.find(x=>x.id==='${pc.job}')`); eq(j.hub, 'SHY'); eq(j.pallets, 7, 'pieces → expected places'); eq(j.plan, false); eq(j.senders.length, 2);
    assert(w.document.querySelector(`[data-ib-pre="${pc.id}"] [data-ib-tofollow]`), '"plate to follow" chip'); assert(/1 200 kg|1 200 kg/.test(w.document.querySelector(`[data-ib-pre="${pc.id}"]`).innerText), 'kg per point shown');
    assert(typeof ev(`ibPrePicked('${pc.id}')`) === 'string', 'picked needs a plate'); assert(typeof ev(`ibPrePlate('${pc.id}','x')`) === 'string', 'plate format');
    eq(ev(`ibPrePlate('${pc.id}','777 abc 13')`), null); eq(ev(`S.jobs.find(x=>x.id==='${pc.job}').plate`), '777 ABC 13', 'plate reaches the inbound job'); eq(ev(`ibPrePicked('${pc.id}')`), null); eq(ev(`S.jobs.find(x=>x.id==='${pc.job}').plan`), true);
    ev("ACT.stab({s:'hubs',v:'inbound'})"); assert(w.document.querySelector(`[data-ib-row="${pc.job}"]`), 'expected inbound in the inbound list'); clean(w, 'pre-carriage');
  });
  await group('I-4 gate slots: 30-min units per gate, fixed appointments refused, overlaps and zone / blocked conflicts shown, booking from the list', 'ru', async (g, ev, w) => {
    const c0 = ev("ibConflicts('AST')"); assert(c0.some(c => c.gate === 3), 'seeded overlap on AST gate 3'); ev("go('hubs');ACT.stab({s:'hubs',v:'slots'})"); assert(w.document.querySelector('[data-ib-grid="AST"]'), 'grid'); assert(w.document.querySelector('[data-ib-conflict]'), 'conflict cell red'); assert(w.document.querySelectorAll('[data-ib-cf]').length >= 1, 'conflict list');
    assert(/фиксир/i.test(ev("ibSlotBook({hub:'AST',gate:1,s:960,len:1,job:'IN-0613'})")), 'fixed appointment refused');
    assert(typeof ev("ibSlotBook({hub:'AST',gate:3,s:1020,len:1,job:'IN-0613'})") === 'string', 'zone mismatch refused');
    assert(typeof ev("ibSlotBook({hub:'ALA',gate:2,s:1020,len:1})") === 'string', 'blocked gate refused'); assert(typeof ev("ibSlotBook({hub:'AST',gate:2,s:1015,len:1})") === 'string', '30-min grid');
    ev("ACT.stab({s:'hubs',v:'inbound'})"); assert(w.document.querySelector('[data-ib-row="IN-0613"] [data-act="ibSlotNew"]'), 'book button in the inbound list');
    ev("ACT.ibSlotNew({id:'IN-0613'})"); w.document.getElementById('ibs_g').value = '2'; w.document.getElementById('ibs_s').value = '1020'; w.document.getElementById('ibs_fix').checked = true; ev("ACT.ibSlotSave({hub:'AST'})");
    const j = ev("S.jobs.find(j=>j.id==='IN-0613')"); eq(j.ramp, 2); eq(JSON.stringify(j.win), '[1020,1050]'); eq(j.plan, true); assert(ev("S.ib.slots.some(s=>s.job==='IN-0613'&&s.fixed)"), 'fixed slot stored');
    const r = ev("ibSlotBook({hub:'AST',gate:2,s:990,len:2,kind:'load',ref:'LD-X'})"); assert(typeof r === 'string', 'overlap with the new fixed appointment refused');
    const r2 = ev("ibSlotBook({hub:'AST',gate:4,s:900,len:1,kind:'load',ref:'LD-Y'})"); eq(typeof r2, 'string', 'IN-0611 is a fixed GDP appointment');
    const r3 = ev("ibSlotBook({hub:'AST',gate:5,s:840,len:1,kind:'load',ref:'LD-Z'})"); assert(r3 && r3.warn && r3.warn.includes('IN-0614'), 'ordinary overlap allowed with a warning'); assert(ev("ibConflicts('AST').length") > c0.length, 'new conflict listed');
    const sid = r3.id; eq(ev(`ibSlotDel('${sid}')`), null); eq(ev("ibConflicts('AST').length"), c0.length, 'removed'); assert(ev("S.audit.some(a=>a.module==='Hub inbound')"), 'audited');
  });
  await group('I-5 overdue dwell red with hover: period, minutes, delay yes / no', 'ru', async (g, ev, w) => {
    ev("go('hubs');ACT.stab({s:'hubs',v:'inbound'})"); const el = w.document.querySelector('[data-ib-row="IN-0616"] [data-ib-dwell]'); eq(el.dataset.ibDwell, 'over', '0616 past free time'); assert(/13:20–14:32/.test(el.title), 'period in hover: ' + el.title); assert(/72/.test(el.title), 'minutes'); assert(/задержка/i.test(el.title), 'delay answer');
    eq(w.document.querySelector('[data-ib-row="IN-0614"] [data-ib-dwell]').dataset.ibDwell, 'ok', 'within free time'); ev("S.jobs.find(j=>j.id==='IN-0624').delay=false;render()"); assert(/нет/.test(w.document.querySelector('[data-ib-row="IN-0624"] [data-ib-dwell]').title), 'delay no');
    ev('ACT.tick();ACT.tick()'); eq(w.document.querySelector('[data-ib-row="IN-0614"] [data-ib-dwell]').dataset.ibDwell, 'over', 'turns red as the clock runs');
  });
  await group('I-6 demurrage: auto ₸ from the overrun, four eyes, booked into Costs, re-charge with reason for waiver', 'ru', async (g, ev, w) => {
    const d = ev("ibDemOf(S.jobs.find(j=>j.id==='IN-0624'))"); eq(d.amount, 3 * ev('RECV.rate'), '85 min over → 3 steps'); eq(d.st, 'ready'); eq(ev("ibDemOf(S.jobs.find(j=>j.id==='IN-0616')).st"), 'accruing', 'still unloading');
    ev("ACT.setRole({v:'warehouse'})"); assert(typeof ev("ibDemPropose('IN-0624')") === 'string', 'delay question first'); ev("S.jobs.find(j=>j.id==='IN-0624').delay=false");
    eq(ev("ibDemPropose('IN-0624')"), null); eq(ev("ibDemOf(S.jobs.find(j=>j.id==='IN-0624')).st"), 'wait'); assert(typeof ev("ibDemApprove('IN-0624')") === 'string', 'warehouse cannot approve');
    ev("ACT.setRole({v:'finance'})"); const n = ev('S.costs.length'); const c = ev("ibDemApprove('IN-0624')"); eq(ev('S.costs.length'), n + 1, 'line in costs'); eq(c.cat, 'detention'); eq(c.ref, 'IN-0624'); eq(c.amount, d.amount); eq(c.recharge.st, 'open', 're-chargeable (not hub-caused)');
    eq(ev("S.jobs.find(j=>j.id==='IN-0624').booked"), d.amount); assert(ev("S.audit.some(a=>/4/.test(a.decision)&&a.subject==='IN-0624')"), 'four-eyes audit');
    assert(typeof ev(`ibRecharge('${c.id}','waived','short')`) === 'string', 'waiver needs reason'); eq(ev(`ibRecharge('${c.id}','invoiced')`), null); eq(ev(`S.costs.find(x=>x.id==='${c.id}').recharge.st`), 'invoiced'); eq(ev(`ibRecharge('${c.id}','paid')`), null); assert(typeof ev(`ibRecharge('${c.id}','waived','customer goodwill gesture')`) === 'string', 'paid cannot be waived');
    ev("ACT.setRole({v:'admin'});go('billing');setTab('billing','cost')"); assert(w.document.querySelector('.content').innerText.includes('IN-0624'), 'visible in Billing → Costs');
    ev("S.jobs.find(j=>j.id==='IN-0616').ev.en=S.clock;S.jobs.find(j=>j.id==='IN-0616').delay=true"); eq(ev("ibDemPropose('IN-0616')"), null); const c2 = ev("ibDemApprove('IN-0616')"); eq(c2.recharge, null, 'hub-caused: not re-chargeable'); assert(ev("S.audit.some(a=>/override/.test(a.reason)&&a.subject==='IN-0616')"), 'admin self-approval audited as override');
    ev("go('hubs');ACT.stab({s:'hubs',v:'dem'})"); assert(w.document.querySelector(`[data-ib-rc="${c.id}"]`), 're-charge row'); clean(w, 'demurrage');
  });
  await group('I-7 gate check: actual temperature, logger take-over, SSCC reconciliation (ops SSCC model read-only)', 'ru', async (g, ev, w) => {
    ev("go('hubs');ACT.stab({s:'hubs',v:'recv'});ACT.openJ({id:'IN-0614'})"); assert(w.document.querySelector('.drawer [data-act="ibGate"]'), 'gate-check button in the job card'); ev("ACT.ibGate({id:'IN-0614'})");
    w.document.getElementById('ibg_t').value = '-30'; ev("ACT.ibTemp({id:'IN-0614'})"); eq(ev("recvCalc(S.jobs.find(j=>j.id==='IN-0614'),S.clock).tempOk"), false, 'out of range'); assert(w.document.querySelector('[data-ib-gate-temp] .temp-breach'), 'breach chip');
    eq(ev("ibGateTemp('IN-0614',-20)"), null); eq(ev("recvCalc(S.jobs.find(j=>j.id==='IN-0614'),S.clock).tempOk"), true);
    ev("ACT.ibLogger({id:'IN-0614'})"); const lg = ev("S.jobs.find(j=>j.id==='IN-0614').ib.logger"); eq(lg.pts.length, 12); assert(lg.exc >= 30, 'excursion found'); eq(ev("S.jobs.find(j=>j.id==='IN-0614').chk.logger"), true, 'logger flag for unloading'); assert(w.document.querySelector('[data-ib-gate-logger] svg'), 'logger curve');
    const r = ev("ibRecStart('IN-0614')"); eq(r.exp.length, 26, 'one SSCC per pallet'); assert(ev(`ssccValid('${r.exp[0]}')`), 'GS1 check digit');
    eq(ev(`ibRecScan('IN-0614','00${r.exp[0]}')`), 'ok', 'AI 00 scan'); eq(ev(`ibRecScan('IN-0614','${r.exp[0]}')`), 'dup'); eq(ev(`ibRecScan('IN-0614','${r.exp[1].slice(0, 17) + ((+r.exp[1][17] + 1) % 10)}')`), 'bad', 'wrong check digit'); eq(ev("ibRecScan('IN-0614',ssccMake(999999))"), 'foreign');
    assert(typeof ev("ibRecClose('IN-0614','')") === 'string', 'mismatch needs reason'); ev("ACT.ibScanAll({id:'IN-0614'})"); const st = ev("ibRecState(S.jobs.find(j=>j.id==='IN-0614'))"); eq(st.ok, 26); eq(st.miss.length, 0); eq(st.foreign, 1);
    eq(ev("ibRecClose('IN-0614','foreign pallet from IN-0611 set aside')"), null); eq(ev("ibRecState(S.jobs.find(j=>j.id==='IN-0614')).closed"), true); clean(w, 'gate check');
    const kar = ev("ibRecStart('IN-0631')"); assert(kar.exp.length > 0 && ev(`${JSON.stringify(kar.exp)}.every(ssccValid)`), 'linked load: SSCCs from the ops model');
    ev("ibRecStart('IN-0621');ibRecClose('IN-0621','driver lost two pallets en route')"); eq(ev("ibSenderSt(S.jobs.find(j=>j.id==='IN-0621'),0)"), 'bad', 'QA hold still wins');
    ev("S.jobs.find(j=>j.id==='IN-0621').qa=true"); eq(ev("ibSenderSt(S.jobs.find(j=>j.id==='IN-0621'),0)"), 'miss', 'shortage colours the sender red');
  });
