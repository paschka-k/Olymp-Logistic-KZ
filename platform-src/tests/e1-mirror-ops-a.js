  /* ---- R1-a · Mirror 0.3.9 → v6, Routes & Tracking (docs/MIRROR-0.3.9-ops.md section 3): Temperature, Temperature log, Thermochrons, Weather, Security, Coverage ---- */
  const E1A_TAB = k => `ACT.setRole({v:'admin'});go('routes');ACT.stab({s:'routes',v:'${k}'})`;
  await group('R1-a T1t: chips of every non-service truck incl. parked ones; "no temperature control · outside" without thermo', 'en', async (g, ev, w) => {
    ev(E1A_TAB('temp')); clean(w, 'temp');
    const n = ev("S.trucks.filter(t=>t.status!=='service').length"); eq(w.document.querySelectorAll('[data-th-chips] .th-chip').length, n, 'one chip per non-service truck'); eq(ev('THERMO.vehicles().length'), n);
    assert(w.document.querySelector('[data-th-veh="t1"]'), 'parked truck t1 has a chip'); assert(!w.document.querySelector('[data-th-veh="t7"]'), 'service truck has no chip');
    ev("trk('t1').zones=['ambient'];render()"); const c = w.document.querySelector('[data-th-veh="t1"]'); eq(c.dataset.nothermo, '1'); assert(/no temperature control · outside [+−-]?\d/.test(c.innerText), 'no-thermo chip text: ' + c.innerText);
    assert(/ · outside /.test(w.document.querySelector('[data-th-veh="t5"]').innerText), 'thermo chip shows outside');
    ev("ACT.hubSet({v:'ALA'})"); const ids = [...w.document.querySelectorAll('[data-th-chips] .th-chip')].map(e => e.dataset.id); assert(ids.length && ids.every(id => ev(`trk('${id}').hub`) === 'ALA'), 'C16 hub filter on chips');
  });
  await group('R1-a T3t: truck without a unit shows the passive readouts (thermo containers + isothermal body), freeze → "TEMPERATURE FALLING"', 'en', async (g, ev, w) => {
    eq(ev("trk('t4').unit"), '—', 't4 runs without a unit'); ev(E1A_TAB('temp')); ev("ACT.thSel({id:'t4'})");
    const ro = [...w.document.querySelectorAll('[data-th-ro]')]; eq(ro.length, 3); eq(ro.filter(e => e.dataset.passive).length, 2, 'two passive tiles');
    assert(/Thermo containers 2–8 °C · loggers/.test(ro[0].innerText) && /passive: ice packs \+4 °C, ≤ 48 h in transit \(B8\) · normal/.test(ro[0].innerText), 'tile 1: ' + ro[0].innerText);
    assert(/Isothermal body · 15–25 °C/.test(ro[1].innerText) && /no unit · Wialon sensor/.test(ro[1].innerText), 'tile 2');
    ev("load('LD-2026-001851').status='in_transit';simStart('freeze','LD-2026-001851');ACT.thSel({id:'t4'})");
    assert(/TEMPERATURE FALLING — body is unheated/.test(w.document.querySelector('[data-th-ro]').innerText), 'falling under freeze'); clean(w, 'passive');
    ev("ACT.thSel({id:'t5'})"); eq(w.document.querySelectorAll('[data-th-ro][data-passive]').length, 0, 'active unit keeps chamber tiles');
  });
  await group('R1-a T6t: status texts under the fire / theft security sims', 'en', async (g, ev, w) => {
    ev(E1A_TAB('temp')); const l = 'LD-2026-001847', t = ev(`load('${l}').truck`);
    ev(`simStart('fire','${l}');ACT.thSel({id:'${t}'})`); assert(/ · SMOKE DETECTOR: fire/.test(w.document.querySelector('[data-th-status]').innerText), 'smoke detector');
    ev(`simStop('fire');simStart('theft','${l}');ACT.thSel({id:'${t}'})`); assert(/OPEN away from a delivery point · seal broken/.test(w.document.querySelector('[data-th-status]').innerText), 'door under theft');
    ev("simStop('theft')"); ev(`ACT.thSel({id:'${t}'})`); assert(/closed · seal intact/.test(w.document.querySelector('[data-th-status]').innerText), 'back to closed'); clean(w, 'status');
  });
  await group('R1-a T7t / O1 / Y2: freeze and overheat open a level-3 Security incident with the playbook, Dashboard card, toast; reset removes it', 'en', async (g, ev, w) => {
    const l = 'LD-2026-001847', n0 = ev('S.inc.length'); ev(E1A_TAB('temp')); w.document.querySelector('#sim_l').value = l; ev("ACT.sim({v:'freeze'})");
    eq(ev('S.inc.length'), n0 + 1, 'incident opened'); const i = ev('S.inc[0]'); eq(i.lvl, 3); eq(i.sim, l); eq(i.pb.length, 4); assert(/^Freezing risk 2–8 °C/.test(i.type), 'title ' + i.type);
    eq(i.pb[0], 'Contact driver, check unit and heating mode'); eq(i.pb[3], 'Notify branch and KDL Olymp, open deviation and CAPA');
    assert(/^Alarm: Freezing risk 2–8 °C — instructions on the “Dashboard” screen$/.test(ev('S.toast.msg')), 'toast ' + ev('S.toast.msg')); eq(ev(`load('${l}').status`), 'problem'); assert(ev(`S.devs.some(d=>d.load==='${l}')`), 'deviation kept');
    eq(JSON.stringify(ev('simActive()')), JSON.stringify([{ kind: 'freeze', load: l, truck: ev(`load('${l}').truck`) }]), 'simActive');
    ev("go('dashboard')"); assert(w.document.querySelector(`[data-playbook="${i.id}"]`), 'Dashboard playbook card'); clean(w, 'dashboard');
    w.document.querySelector(`[data-playbook="${i.id}"] [data-act=ovPbReset]`).click(); eq(ev(`S.inc.some(x=>x.id==='${i.id}')`), false, 'Dashboard reset removes it'); eq(ev(`load('${l}').temp`), ev(`ZONES[load('${l}').zone].mid`), 'temperature restored'); eq(ev('simActive().length'), 0);
    eq(typeof ev(`simStart('heat','${l}')`), 'object'); const h = ev('S.inc[0]'); assert(/^2–8 °C chamber overheating/.test(h.type), 'overheat title'); eq(h.pb[0], 'Check setpoint and unit mode (heating stuck?)'); eq(h.pb[3], 'Deviation + CAPA, unit service');
    eq(ev("simStop('heat')"), 1); eq(ev(`S.inc.some(x=>x.id==='${h.id}')`), false, 'simStop removes the incident'); eq(ev(`load('${l}').status`), 'in_transit');
    eq(typeof ev("simStart('freeze')"), 'object', 'default vehicle picked'); ev("simStop('freeze')"); eq(ev('simActive().length'), 0);
    ev("ACT.setRole({v:'viewer'})"); eq(typeof ev("simStart('freeze')"), 'string', 'alarms:write needed'); eq(typeof ev("simStop('freeze')"), 'string');
  });
  await group('R1-a T11t: thermochrons expected at receipt, import → min · max · Ø, excursion → DEV, second import refused, temperature:write', 'en', async (g, ev, w) => {
    ev(E1A_TAB('thermochron')); clean(w, 'thermochron'); const rows = [...w.document.querySelectorAll('[data-thc-exp]')].map(e => e.dataset.thcExp);
    eq(rows.join(','), ev("S.loads.filter(l=>l.status==='delivered'&&l.zone!=='ambient'&&!S.res.thc.some(r=>r.load===l.id)).map(l=>l.id).join(',')"), 'one row per delivered cold load without a thermochron');
    assert(rows.length >= 2, 'rows'); assert(/thermochron file expected at receipt/.test(w.document.querySelector('#thc_expected').innerText), 'expected text');
    w.document.querySelector('[data-thc-exp="LD-2026-001840"] [data-act=thcExp]').click(); const r1 = w.document.querySelector('[data-thc-exp="LD-2026-001840"] [data-thc-res]').innerText;
    assert(/^min [-\d.,]+ · max [-\d.,]+ · Ø [-\d.,]+ °C · no excursion$/.test(r1), 'result ' + r1);
    const d0 = ev('S.devs.length'); ev("ACT.thcExp({id:'LD-2026-001842'})"); const x = ev("S.res.thcExp['LD-2026-001842']"); assert(x.exc > 0 && /^DEV-/.test(x.dev), 'excursion → DEV'); assert(ev('S.devs.length') > d0, 'deviation opened');
    assert(/ · out of range \d+ min → DEV-/.test(x.txt), 'text ' + x.txt); eq(typeof ev("ACT.thcExp({id:'LD-2026-001842'})"), 'string', 'second import refused'); assert(w.document.querySelector('[data-thc-exp="LD-2026-001842"][data-done="1"]'), 'row stays with result');
    ev("ACT.setRole({v:'viewer'});go('routes');ACT.stab({s:'routes',v:'thermochron'})"); assert(!w.document.querySelector('[data-act=thcExp]'), 'no button without temperature:write'); eq(typeof ev("RES.thcExpImport('LD-2026-001843')"), 'string');
  });
  await group('R1-a T13t: temperature log rights (temperature:write / fleet:write) and the −60…80 °C range', 'en', async (g, ev, w) => {
    ev(E1A_TAB('templog')); const t = ev("S.loads.find(l=>l.status==='in_transit').truck"); ev(`S.thermo.sel='${t}';render()`);
    w.document.querySelector('#tl_val').value = '99'; const n0 = ev('S.thermo.log.length'); eq(ev('ACT.tlRec()'), 'Temperature: −60 to 80 °C', 'range error'); eq(ev('S.thermo.log.length'), n0, 'nothing recorded');
    w.document.querySelector('#tl_val').value = '-61'; eq(typeof ev('ACT.tlRec()'), 'string'); w.document.querySelector('#tl_val').value = '5'; ev('ACT.tlRec()'); eq(ev('S.thermo.log.length'), n0 + 1, 'valid reading recorded');
    ev("ACT.setRole({v:'dispatcher'});go('routes');ACT.stab({s:'routes',v:'templog'})"); assert(w.document.querySelector('[data-act=tlRec]') && w.document.querySelector('[data-act=tlCsv]'), 'dispatcher records (temperature:write)');
    assert(!w.document.querySelector('[data-act=tlSensAdd]') && w.document.querySelector('[data-noright="fleet:write"]'), 'no sensor mapping without fleet:write'); eq(typeof ev('ACT.tlSensAdd()'), 'string');
    ev("ACT.setRole({v:'viewer'});go('routes');ACT.stab({s:'routes',v:'templog'})"); assert(!w.document.querySelector('[data-act=tlRec]') && !w.document.querySelector('[data-act=tlCsv]'), 'viewer read-only'); eq(typeof ev('ACT.tlRec()'), 'string'); eq(typeof ev('ACT.tlCsv()'), 'string'); clean(w, 'templog viewer');
  });
  await group('R1-a W4 / W6 / W8: inbox road messages with Lift early (trips:write), source row, risk per trip raised by the inbox', 'en', async (g, ev, w) => {
    ev(E1A_TAB('wx')); clean(w, 'wx'); const ms = ev('roadMsgs().map(m=>m.id)'); assert(ms.length >= 1, 'active road messages'); eq(w.document.querySelectorAll('[data-road-msg]').length, ms.length, 'one row per message');
    const r = w.document.querySelector('[data-road-msg="IN-0002"]').innerText; assert(/L2 · IN-0002/.test(r) && /until /.test(r) && /affects: /.test(r) && /LD-2026-001848/.test(r), 'row ' + r);
    assert(/no trips on this road|affects: /.test(w.document.querySelector('[data-road-msg="IN-0001"]').innerText), 'affects or none'); assert(/Inbox messages · roads and weather\s*\d+ active/.test(w.document.querySelector('[data-wx-sources]').innerText), 'source row');
    const lv = +w.document.querySelector('[data-wx-risk="LD-2026-001848"]').dataset.lvl; assert(lv >= ev("roadRisk(load('LD-2026-001848')).lvl") && lv >= ev("WEATHER.routeRisk(load('LD-2026-001848'))"), 'risk = max'); assert(/Storm warning/.test(w.document.querySelector('[data-wx-risk="LD-2026-001848"]').innerText), 'inbox text appended');
    eq(w.document.querySelectorAll('[data-act=liftClose]').length, 2, 'static closures unchanged'); w.document.querySelector('[data-road-msg="IN-0002"] [data-act=roadLift]').click(); assert(ev("S.inbox.find(m=>m.id==='IN-0002').lifted"), 'lifted'); assert(!w.document.querySelector('[data-road-msg="IN-0002"]'), 'row gone');
    assert(ev("S.audit.some(a=>a.id==='IN-0002'||JSON.stringify(a).includes('IN-0002'))"), 'audited');
    ev("ACT.setRole({v:'warehouse'});go('routes');ACT.stab({s:'routes',v:'wx'})"); assert(!w.document.querySelector('[data-act=wxRefresh]') && !w.document.querySelector('[data-act=liftClose]') && !w.document.querySelector('[data-act=roadLift]'), 'trips:status is not enough');
    eq(typeof ev("ACT.wxRefresh()"), 'string'); eq(typeof ev("ACT.roadLift({id:'IN-0001'})"), 'string'); eq(typeof ev("ACT.liftClose({id:'RC-1'})"), 'string');
  });
  await group('R1-a Y1 / Y4 / Y10 / Y11 / Y12: Security KPIs of 0.3.9, level-3 acknowledged before close, drivers x / 9 h + ADR, doors / seals / route, alarms:write', 'en', async (g, ev, w) => {
    ev(E1A_TAB('sec')); clean(w, 'sec'); const k = w.document.querySelector('[data-sec-kpis]').innerText;
    ['Open incidents', 'Vehicles on the road', 'Doors and seals', 'Drivers with ADR'].forEach(s => assert(k.includes(s), s)); assert(new RegExp('\\d+ / ' + ev('S.trucks.length') + ' ok').test(k), 'doors ok / N'); assert(w.document.querySelector('[data-sec-extra]'), 'v6 KPIs kept');
    const id = ev("S.inc.find(i=>!i.sim&&i.lvl>=3&&i.st==='open').id"); assert(!w.document.querySelector(`[data-inc="${id}"] [data-act=incClose]`), 'no Close on new level 3'); assert(w.document.querySelector(`[data-l3="${id}"]`), 'hint');
    eq(ev(`SECURITY.close('${id}','technical','long enough text here')`), 'Level-3 incident must be acknowledged before it is closed'); eq(ev(`ACT.incClose({id:'${id}'})`), 'Level-3 incident must be acknowledged before it is closed');
    ev(`ACT.incSt({id:'${id}',v:'accepted'})`); assert(w.document.querySelector(`[data-inc="${id}"] [data-act=incClose]`), 'Close after accept'); eq(ev(`SECURITY.close('${id}','technical','long enough text here')`), null);
    const dr = w.document.querySelector('[data-sec-drivers]').innerText; assert(/Drivers · driving time and ADR/.test(dr) && /ADR UNTIL|ADR until/.test(dr) && / \/ 9 h/.test(dr), 'drivers table');
    assert(ev("S.drivers.some(d=>{const a=RES.adrState(d);return a.has&&a.state!=='valid'})") === !!w.document.querySelector('[data-adr-warn]'), 'ADR red when expiring');
    eq(w.document.querySelector('[data-seal="t4"]').dataset.sealSt, 'none', 'not fitted without a unit'); eq(w.document.querySelector('[data-seal="t1"]').dataset.route, 'hub', 'parked at hub');
    const l = 'LD-2026-001848', t = ev(`load('${l}').truck`); eq(w.document.querySelector(`[data-seal="${t}"]`).dataset.door, 'closed', 'no door-open from temperature');
    ev(`load('${l}').temp=30;render()`); eq(w.document.querySelector(`[data-seal="${t}"]`).dataset.door, 'closed', 'breach does not open the door');
    ev(`ACT.thDoor({id:'${t}'})`); ev(E1A_TAB('sec')); eq(w.document.querySelector(`[data-seal="${t}"]`).dataset.door, 'open', 'chamber door sim'); ev(`ACT.thDoor({id:'${t}'})`);
    ev(`simStart('theft','${l}');render()`); const row = w.document.querySelector(`[data-seal="${t}"]`); eq(row.dataset.door, 'open'); eq(row.dataset.sealSt, 'broken'); eq(row.dataset.route, 'stop'); assert(/stop 22 min/.test(row.innerText) && /BROKEN/.test(row.innerText), 'theft texts');
    assert(w.document.querySelector('[data-seal][data-route="dev"]'), 'deviation 4.2 km'); ev("simStop('theft')");
    ev("ACT.setRole({v:'viewer'});go('routes');ACT.stab({s:'routes',v:'sec'})"); assert(!w.document.querySelector('[data-act=incSt]') && !w.document.querySelector('[data-act=incClose]') && !w.document.querySelector('[data-act=panic]') && !w.document.querySelector('[data-act=secSim]'), 'viewer has no alarm buttons');
    eq(typeof ev(`ACT.incSt({id:'${ev('S.inc[0].id')}',v:'accepted'})`), 'string'); eq(typeof ev('ACT.panic()'), 'string'); ev("go('routes');ACT.stab({s:'routes',v:'temp'})"); assert(!w.document.querySelector('[data-act=sim]'), 'no temperature sim buttons');
  });
  await group('R1-a C5 / C15 / C16: offline windows for planned trips from departure, coverage rights, hub filter', 'en', async (g, ev, w) => {
    ev(E1A_TAB('coverage')); const p = 'LD-2026-001856'; assert(w.document.querySelector(`[data-act=covTrip][data-id="${p}"]`), 'assigned trip chip'); ev(`ACT.covTrip({id:'${p}'})`);
    eq(w.document.querySelector('[data-trip-phase]').dataset.tripPhase, 'dep'); assert(/^departure \d\d\.\d\d, \d\d:\d\d$/.test(w.document.querySelector('[data-trip-phase]').innerText), 'departure text');
    const ws = ev(`RES.tripWindows(load('${p}'))`); assert(ws.length >= 1 && /^\d\d:\d\d$/.test(ws[0].from), 'windows of the planned trip'); eq(w.document.querySelectorAll(`[data-cov-zone^="${p}:"]`).length, ws.length);
    eq(w.document.querySelector('[data-cov-70]').innerText, 'Times from departure (trips in transit: from the current position) at 70 km/h, without stops and rest.');
    ev("ACT.covTrip({id:'LD-2026-001847'})"); assert(/in transit/.test(w.document.querySelector('[data-trip-phase]').innerText), 'in transit'); clean(w, 'coverage');
    ev("ACT.setRole({v:'dispatcher'});go('routes');ACT.stab({s:'routes',v:'coverage'})"); assert(w.document.querySelector('[data-cov-check]') && w.document.querySelector('[data-sms-send]'), 'dispatcher: trips:write'); assert(w.document.querySelector('[data-noright="planning:admin"]'), 'no accept without planning:admin'); eq(typeof ev("ACT.covDec({id:'SHY-KAR',v:'1'})"), 'string');
    ev("ACT.setRole({v:'warehouse'});go('routes');ACT.stab({s:'routes',v:'coverage'})"); assert(!w.document.querySelector('[data-cov-check]') && !w.document.querySelector('[data-sms-send]'), 'warehouse read-only'); eq(typeof ev('ACT.covCheck()'), 'string'); eq(typeof ev('ACT.covSms()'), 'string');
    ev("ACT.setRole({v:'admin'});ACT.hubSet({v:'SHY'});go('routes');ACT.stab({s:'routes',v:'coverage'})"); const ids = [...w.document.querySelectorAll('[data-cov]')].map(e => e.dataset.cov); assert(ids.every(id => ev(`hubOfLoad(load('${id}')).includes('SHY')`)), 'contacts by hub');
    assert([...w.document.querySelectorAll('.pill-tab[data-act=covTrip]')].every(e => ev(`hubOfLoad(load('${e.dataset.id}')).includes('SHY')`)), 'trip chips by hub');
    ev("go('routes');ACT.stab({s:'routes',v:'sec'})"); assert([...w.document.querySelectorAll('[data-seal]')].every(e => ev(`trk('${e.dataset.seal}').hub`) === 'SHY'), 'seals by hub'); assert([...w.document.querySelectorAll('[data-sec-drv]')].every(e => ev(`drv('${e.dataset.secDrv}').hub`) === 'SHY'), 'drivers by hub');
    ev("go('routes');ACT.stab({s:'routes',v:'wx'})"); assert([...w.document.querySelectorAll('[data-wx-city]')].every(e => ev(`WEATHER.cityHub('${e.dataset.wxCity}')`) === 'SHY'), 'cities by hub');
  });
  await group('R1-a: touched Routes tabs render in 4 languages, DE / EN without Cyrillic in the new blocks', 'ru', async () => {
    const CYR = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІі]/;
    for (const lang of LANGS) { const gg = await fresh(lang); try {
      gg.ev("simStart('freeze','LD-2026-001847');simStart('theft','LD-2026-001848');load('LD-2026-001851').status='in_transit'");
      for (const k of ['temp', 'templog', 'thermochron', 'wx', 'sec', 'coverage']) { gg.ev(`go('routes');ACT.stab({s:'routes',v:'${k}'})`); if (k === 'temp') gg.ev("ACT.thSel({id:'t4'})"); clean(gg.w, lang + ' routes/' + k);
        if (lang === 'de' || lang === 'en') { const sel = ['[data-th-ro]', '[data-th-status]', '#thc_expected', '[data-road-msg] b', '[data-road-msg] [data-road-affects]', '[data-sec-kpis]', '[data-seal]', '[data-sec-drivers] th', '[data-cov-70]', '[data-trip-phase]', '[data-l3]', '[data-sec-sim] h3'];
          sel.forEach(s => gg.w.document.querySelectorAll(s).forEach(e => assert(!CYR.test(e.innerText), lang + ' ' + k + ' ' + s + ': ' + e.innerText.slice(0, 80)))); } }
      gg.ev("go('dashboard')"); clean(gg.w, lang + ' dashboard'); const pb = gg.w.document.querySelector('[data-playbook]'); assert(pb, 'playbook card ' + lang);
      if (lang === 'de' || lang === 'en') assert(!CYR.test(gg.ev('S.inc.filter(i=>i.tsim).map(i=>i.type+i.pb.join()).join()')), lang + ' playbook text');
      if (lang === 'kk') assert(/Қатып қалу қаупі/.test(pb.parentElement.innerText), 'kk playbook');
    } finally { gg.done(); } }
  });
