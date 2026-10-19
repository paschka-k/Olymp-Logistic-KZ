  /* ---- W2 coverage, lines & tariffs, thermochron (FR-39/40/96/97/109/110/111/155) ---- */
  await group('W2 coverage: escalation L1/L2/L3 by expected zone, window and cold cargo (FR-109)', 'ru', async (g, ev, w) => {
    ev("go('routes');ACT.stab({s:'routes',v:'coverage'})"); assert(w.document.querySelector('#cov_contacts'), 'contacts'); clean(w, 'coverage');
    const l = ev("S.loads.find(l=>l.status==='in_transit'&&l.zone!=='ambient').id"); eq(ev(`RES.covSet('${l}',10).lvl`), 0, 'on line'); eq(ev(`RES.covSet('${l}',40).lvl`) >= 1, true);
    eq(ev(`RES.covSet('${l}',75).lvl`), 3, 'cold cargo > 60 min'); assert(ev(`S.inc.some(i=>i.id==='COV-${l}3')`), 'incident created');
  });
  await group('W2 coverage: dispatcher SMS delivery status, timeout and retry (FR-110)', 'ru', async (g, ev) => {
    const l = ev("S.loads.find(l=>l.status==='in_transit').id"); const r = ev(`RES.smsSend('${l}','test')`); eq(ev(`S.res.cov.sms[0].st`), 'sent'); ev('RES.smsTick(2)'); assert(['sent', 'delivered'].includes(ev('S.res.cov.sms[0].st')), 'delivering');
    ev('RES.smsTick(10)'); eq(ev('S.res.cov.sms[0].st'), 'no_ack', 'timeout'); ev(`RES.smsRetry('${r.ok}')`); eq(ev('S.res.cov.sms[0].tries'), 2); eq(ev('S.res.cov.sms[0].st'), 'sent'); ev(`RES.smsAck('${r.ok}')`); eq(ev('S.res.cov.sms[0].st'), 'acked');
  });
  await group('W2 coverage: dead zones from telematics gaps need 3 passes and analyst decision (FR-111)', 'ru', async (g, ev) => {
    const n = ev('RES.covProposals().length'); assert(n >= 2, 'seeded proposals'); const seg = 'ALA-SHY'; assert(!ev(`RES.covProposals().some(p=>p.seg.id==='${seg}')`), 'one gap -> no proposal'); ev(`RES.covGapAdd('${seg}',30);RES.covGapAdd('${seg}',25)`); assert(ev(`RES.covProposals().some(p=>p.seg.id==='${seg}')`), 'three passes -> proposal');
    ev(`RES.covDecide('SHY-KAR',true)`); eq(ev(`RES.COV.segs.find(s=>s.id==='SHY-KAR').conf`), 'measured'); eq(ev(`RES.COV.segs.find(s=>s.id==='SHY-KAR').cls`), 'none');
    assert(ev(`RES.covNote(S.loads.find(l=>l.id==='LD-2026-001849'))`) !== undefined, 'note builds');
  });
  await group('W2 lines: multi-leg routing never says "no line"; fallback via hub (FR-155)', 'ru', async (g, ev, w) => {
    const places = ev("Object.keys(HUBS).concat(Object.keys(RES.PLACES))"); let n = 0; for (const a of places) for (const b of places) { if (a === b) continue; const r = ev(`RES.route(${JSON.stringify(a)},${JSON.stringify(b)},'chilled')`); assert(r.ok && r.legs.length >= 1 && r.price > 0 && r.days >= 1, a + '->' + b + ' unroutable'); n++; }
    assert(n > 100, 'pairs'); const r = ev("RES.route('Taldykorgan','SHY','pharma')"); assert(r.legs.some(l => l.kind === 'pickup') && r.legs.some(l => l.kind === 'line' || l.kind === 'consol'), 'pickup + hub leg');
    const r2 = ev("RES.route('SHY','KAR','frozen')"); assert(r2.ok, 'pair without direct line');
    ev("go('routes');ACT.stab({s:'routes',v:'lines'})"); assert(w.document.querySelector('[data-route-out]'), 'route shown'); clean(w, 'lines');
  });
  await group('W2 lines: exceptions cancel departures, vehicles drive capacity, tariffs editable (FR-96/97/118)', 'ru', async (g, ev) => {
    const d0 = ev("RES.departures(14).filter(d=>d.cancelled).length"); eq(d0, 1, 'seeded holiday'); const dep = ev("RES.departures(14).find(d=>!d.cancelled&&d.line.id==='LN-2')"); ev(`ACT.lnExc({id:'LN-2',d:'${dep.iso}'})`); eq(ev("RES.departures(14).filter(d=>d.cancelled).length"), 2);
    const cap = ev("RES.lineCap(S.res.lines[0])"); ev("RES.svcCreate({truck:'t1',kind:'repair',etaH:10,cost:1})"); assert(ev("RES.lineCap(S.res.lines[0])") < cap, 'capacity falls with service'); ev("S.res.lines[0].veh=[]"); eq(ev("RES.lineCap(S.res.lines[0])"), 0);
    ev("S.res.tariff['AST-ALA'].chilled=999"); eq(ev("RES.tariff('ALA','AST','chilled')"), 999, 'tariff both directions');
  });
  await group('W2 thermo: thermochron log creates deviation, loggers, passive containers (FR-39/40)', 'ru', async (g, ev, w) => {
    ev("go('routes');ACT.stab({s:'routes',v:'thermochron'})"); assert(w.document.querySelector('#thc_log'), 'log'); clean(w, 'thermochron'); const n = ev('S.devs.length');
    const l = ev("S.loads.find(l=>l.status==='in_transit'&&l.zone==='pharma').id"); ev(`RES.thermoLog({load:'${l}',min:3,max:11,src:'file'})`); assert(ev('S.devs.length') >= n, 'deviation'); eq(ev('S.res.thc[0].ok'), false);
    ev(`RES.thermoLog({load:'${l}',min:3,max:7,src:'file'})`); eq(ev('S.res.thc[0].ok'), true);
    eq(ev("RES.contState(S.res.cont[2]).ok"), false, 'no logger'); ev("S.res.cont[1].since=-3"); eq(ev("RES.contState(S.res.cont[1]).lvl"), 'red', '> 2 days'); ev("ACT.contTurn({id:'PB-02'})"); eq(ev("RES.contState(S.res.cont[1]).ok"), true, 'turn resets');
  });
  await group('W2: 4 languages render all W2 tabs without undefined/NaN, DE/EN without Cyrillic', 'ru', async (g, ev) => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { for (const [s, k] of [['fleet', 'registry'], ['drivers', 'staff'], ['drivers', 'app'], ['routes', 'coverage'], ['routes', 'lines'], ['routes', 'thermochron']]) { gg.ev(`go('${s}');ACT.stab({s:'${s}',v:'${k}'})`); clean(gg.w, lang + ' ' + s + '/' + k);
      if (lang === 'de' || lang === 'en') { let txt = gg.ev("document.querySelector('#root').innerText"); const known = gg.ev("S.drivers.flatMap(d=>[d.name,d.ini]).concat(CUSTOMERS.flatMap(c=>[c.name,c.ini]))"); known.forEach(n => { txt = txt.split(n).join(''); }); const cyr = txt.match(/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІі]+/g) || []; assert(!cyr.length, lang + ' Cyrillic in ' + s + '/' + k + ': ' + cyr.slice(0, 5)); } } } finally { gg.done(); } }
  });
