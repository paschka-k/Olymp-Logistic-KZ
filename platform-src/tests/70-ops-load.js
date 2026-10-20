  /* ---- W1 operations: Load & weight (FR-99/139/140/143/144/145/146, FR-05/06) ---- */
  await group('ops model: SSCC check digit, one place per pallet, lines and places are separate records (FR-73)', 'ru', async (g, ev) => {
    assert(ev('ssccValid(ssccMake(1)) && ssccValid(ssccMake(987654))'), 'generated SSCC must be valid'); assert(!ev("ssccValid(ssccMake(1).slice(0,17) + ((+ssccMake(1)[17] + 1) % 10))"), 'wrong check digit must be detected');
    assert(ev('S.loads.every(l => opsPlaces(l).length === l.pallets + ops(l).orders.filter(o => !(o.pal > 0)).length)'), 'places per load must equal pallets plus thermo boxes'); assert(ev('S.loads.every(l => ops(l).orders.every(o => o.lines.length >= 1 && o.po && o.pl))'), 'every order has lines, PO and PL');
    eq(ev("ssccFromScan('(00) ' + ssccMake(5))"), ev('ssccMake(5)'), 'AI 00 prefix stripped'); const ot = ev("tabsOf('orders').map(t => t.key)"); assert(ot[0] === 'orders' && ['loadw', 'ship', 'docs'].every(k => ot.includes(k)), 'orders keeps its base tab and the W1 tabs');
  });
  await group('load calc: overload always shown with exact excess, truck finder ranks feasible first, smallest fitting recommended (FR-99/143/146)', 'ru', async (g, ev) => {
    const r = ev("loadCalc(ops(load('LD-2026-001845')).orders, TYPES.v10)"); assert(!r.fits && r.issues.some(i => i.code === 'pal') && r.issues.some(i => i.code === 'kg'), 'van 10 t must be overloaded by pallets and weight');
    assert(r.bars.find(b => b.key === 'pal').ex === 20 - 14, 'exact pallet excess'); assert(ev("loadCalc(ops(load('LD-2026-001848')).orders, TYPES.r12).issues.some(i => i.code === 'h')"), 'a 250 cm pallet must fail the 240 cm body');
    const f = ev("finder(load('LD-2026-001850'), false, {})"); assert(f.best && f.best.fits, 'a recommendation exists'); assert(f.rows.every((x, i) => i === 0 || f.rows[i - 1].fits >= x.fits), 'feasible rows come first');
    const ft = ev("finder(load('LD-2026-001850'), true, {}).rows.filter(x => x.fits)"); assert(ft.every((x, i) => i === 0 || ft[i - 1].cost.total <= x.cost.total), 'full-cost ranking is ascending'); assert(f.partners.length >= 2 && f.partners.some(p => p.fits), 'partner offers listed');
  });
  await group('plan of the vehicle type: an unfitting type needs trips:override_load and a reason, audited (FR-99)', 'ru', async (g, ev) => {
    assert(typeof ev("savePlan('LD-2026-001845', 'v10', '')") === 'string', 'no reason must be refused'); eq(ev("savePlan('LD-2026-001845', 'v10', 'demo reason: one more pallet, cleared by ops lead')"), null, 'admin with reason');
    assert(ev("ops(load('LD-2026-001845')).plan.fits === false && S.audit.some(a => a.decision.startsWith('Plan override'))"), 'plan stored with override + audit'); ev("ACT.setRole({v:'dispatcher'})"); assert(/override_load/.test(ev("savePlan('LD-2026-001845', 'v35', 'dispatcher tries with a long reason')")), 'dispatcher has no override right');
    eq(ev("savePlan('LD-2026-001845', 'r12', '')"), null, 'fitting type needs no reason');
  });
  await group('split over two trucks when no single vehicle takes the load; cost compared with one bigger truck (FR-139)', 'ru', async (g, ev) => {
    const ok = ev("splitPlan(load('LD-2026-001850'))"); assert(!ok.needed && ok.props.length > 0 && ok.props.every(p => typeof p.diff === 'number'), 'split proposals with cost difference');
    ev("ops(load('LD-2026-001850')).orders.forEach((o, i) => { o.kg = i < 2 ? 12000 : 800; })"); const sp = ev("splitPlan(load('LD-2026-001850'))"); assert(sp.needed, 'no single truck takes 24 800 kg'); assert(sp.props.length > 0 && sp.props[0].cost > 0, 'a split proposal exists'); assert(!ev("finder(load('LD-2026-001850'), false, {}).best"), 'finder has no single recommendation');
  });
  await group('loading sequence: LIFO by stop, planned positions, scan check right / wrong (FR-144)', 'ru', async (g, ev, w) => {
    const sq = ev("sequence(load('LD-2026-001850'), TYPES.r20)"); eq(sq.rows.length, 30, 'one row per pallet'); assert(sq.rows[0].stop === ev("ops(load('LD-2026-001850')).orders.slice().sort((a,b)=>b.stop-a.stop)[0].to"), 'last stop at the front wall'); assert(sq.rows.every(r => (r.posN % 2 ? /слева/ : /справа/).test(r.pos)), 'odd left, even right');
    assert(sq.rows.every(r => r.tiers === 1 || r.tier <= 2), 'tiers 1 or 2'); const s = sq.rows[2].sscc; eq(sq.planned[s], sq.rows[2].posN, 'planned position'); ev("S.ops.sel='LD-2026-001850'; go('orders'); ACT.stab({s:'orders',v:'loadw'})");
    w.document.querySelector('#lw_sscc').value = s; w.document.querySelector('#lw_pos').value = String(sq.rows[2].posN); w.document.querySelector('[data-act=lwScan]').click(); eq(ev('S.ops.seqMsg.lvl'), 0, 'right position accepted');
    w.document.querySelector('#lw_sscc').value = s; w.document.querySelector('#lw_pos').value = String(sq.rows[2].posN + 5); w.document.querySelector('[data-act=lwScan]').click(); eq(ev('S.ops.seqMsg.lvl'), 2, 'wrong position warned'); clean(w, 'load & weight after scan');
  });
  await group('departure weighing: excess turns the gate red with the exact excess; override needs permission and a reason (FR-145)', 'ru', async (g, ev) => {
    const r = ev("weigh('LD-2026-001850', { source: 'weighbridge', ticket: 'W-1', gross: 45000 })"); assert(!r.ok && r.excess[0].code === 'gross' && r.excess[0].excess === 5000, 'gross excess 5 000 kg');
    assert(!ev("gate(load('LD-2026-001850')).find(x => x.key === 'load').pass"), 'gate control load must fail'); assert(typeof ev("weighOverride('LD-2026-001850', 'short')") === 'string', 'short reason refused');
    ev("ACT.setRole({v:'dispatcher'})"); assert(/override_load/.test(ev("weighOverride('LD-2026-001850', 'dispatcher reason long enough')")), 'dispatcher cannot override'); ev("ACT.setRole({v:'admin'})"); eq(ev("weighOverride('LD-2026-001850', 'police weighbridge differs, re-weighed at hub')"), null, 'admin overrides');
    assert(ev("gate(load('LD-2026-001850')).find(x => x.key === 'load').pass && S.audit.some(a => a.decision === 'Weighing override')"), 'gate passes after audited override'); assert(ev("weigh('LD-2026-001851', { gross: 9000 }).ok"), 'weighing within limits');
  });
  await group('FEFO warning and SSCC reconciliation: short expiry listed, rescan completes, gate control "places" follows (FR-05/06)', 'ru', async (g, ev) => {
    assert(ev("fefo(load('LD-2026-001849')).length") > 0 && ev("fefo(load('LD-2026-001849'))[0].days") < 90, 'FEFO finds a short shelf life'); assert(ev("S.loads.some(l => fefo(l).length === 0)"), 'not every load is short');
    assert(!ev("reconOk(load('LD-2026-001850'))") && ev("recon(load('LD-2026-001850')).some(r => /недостача/.test(r.mark))"), 'loading load is one place short'); assert(!ev("gate(load('LD-2026-001850')).find(x => x.key === 'places').pass"), 'gate places red');
    const o = ev("recon(load('LD-2026-001850')).find(r => !r.ok).id"); assert(ev(`rescan('LD-2026-001850', '${o}')`), 'rescan'); assert(ev("reconOk(load('LD-2026-001850'))") && ev("gate(load('LD-2026-001850')).find(x => x.key === 'places').pass"), 'reconciled after rescan');
  });
  await group('Load & weight tab renders in every language without undefined / NaN', 'ru', async () => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { gg.ev("go('orders'); ACT.stab({s:'orders',v:'loadw'}); S.ops.split = true; S.ops.target = true; render()"); clean(gg.w, lang + ' load & weight'); gg.ev("ACT.lwSel({id:'LD-2026-001845'})"); clean(gg.w, lang + ' load & weight overloaded van'); } finally { gg.done(); } }
  });

  /* ---- P1 · Load & weight parity with 0.3.10 screen 03 ---- */
  const W = 'LD-2026-001856';
  await group('West trip (R-106-like): Astana → Kostanay → Aktobe → Atyrau, lab / IVD goods, thermo box, two third-party T- orders, ADR', 'ru', async (g, ev) => {
    eq(ev(`routeOf(load('${W}')).length`), 4, 'four route points'); const os = ev(`ops(load('${W}')).orders.map(o => ({ id: o.id, third: o.third, box: o.box, adr: o.adr, pal: o.pal, h: o.h }))`);
    assert(os.length >= 8 && os.length <= 10, '8–10 orders'); eq(os.filter(o => o.third).length, 2, 'two third-party orders'); assert(os.filter(o => o.third).every(o => /^T-/.test(o.id)), 'T- prefix');
    assert(os.some(o => o.box && o.pal === 0 && o.adr), 'thermo box −20 °C with dry ice'); assert(os.every(o => o.h > 0), 'every order has a height');
    eq(ev(`load('${W}').pallets`), os.reduce((s, o) => s + o.pal, 0), 'load pallets follow the orders'); eq(ev("S.ops.sel = null, (go('orders'), ACT.stab({s:'orders',v:'loadw'}), S.ops.sel)"), W, 'the tab opens on the West trip');
    const r = ev(`lwCalc(load('${W}'))`); assert(r.adr && r.thirdPal === 4 && r.boxes.length === 1, 'ADR, third-party pallets and box counted'); assert(r.issues.some(i => i.code === 'adrOk' && /31\.05\.2027/.test(i.text)), 'ADR: vehicle approved, driver certificate until');
  });
  await group('vehicle type card: catalogue + own vehicles, thermo zones, body regime, bulkhead −/+ with zone split, facts line, show plan', 'ru', async (g, ev, w) => {
    ev(`go('orders'); ACT.stab({s:'orders',v:'loadw'}); ACT.lwSel({id:'${W}'})`); const d = w.document;
    for (const id of ['t35', 't6', 't75', 't10', 't125']) assert(d.querySelector(`[data-act=lwType][data-v="${id}"]`), 'catalogue ' + id);
    assert(d.querySelector('[data-act=lwType][data-v="f:t1"].on'), 'actual own vehicle selected'); assert(/ДОПОГ да/.test(d.querySelector('[data-lfacts]').textContent), 'facts line has ADR');
    ev(`ACT.lwType({id:'${W}', v:'t10', z:'1'})`); assert(d.querySelectorAll('[data-act=lwZones]').length >= 2, 'zones segment'); assert(d.querySelectorAll('[data-act=lwReg]').length === 3, 'body regime auto / 2–8 / 15–25');
    ev(`ACT.lwReg({id:'${W}', v:'cold'})`); eq(ev(`lwTypeFor(load('${W}')).box`), 'cold', 'regime 2–8 °C'); assert(ev(`lwCalc(load('${W}')).issues.some(i => i.code === 'mixed')`), 'one-zone 2–8 °C body: 15–25 °C goods only in thermo containers → mixed');
    ev(`ACT.lwZones({id:'${W}', v:'2'})`); const b0 = +d.querySelector('[data-bulkhead]').dataset.bulkhead; assert(d.querySelector('[data-bulk-ctl]') && d.querySelector('[data-bulkline]'), 'bulkhead control and divider');
    ev(`ACT.lwBulk({id:'${W}', v:'2'})`); eq(+d.querySelector('[data-bulkhead]').dataset.bulkhead, b0 + 2, 'bulkhead back'); eq(ev(`lwCalc(load('${W}')).groups.front.cap`), b0 + 2, 'zone 1 places follow the bulkhead');
    ev(`ACT.lwBulk({id:'${W}', v:'-20'})`); eq(+d.querySelector('[data-bulkhead]').dataset.bulkhead, ev(`lwTypeFor(load('${W}')).splitMin`), 'bounded at splitMin');
    eq(ev(`savePlan('${W}', 't125', 'demo: plan for the test, cleared by ops lead', { zones: 2, split: 6 })`), null, 'plan saved'); ev(`ACT.lwType({id:'${W}', v:'t35'})`); assert(d.querySelector('[data-act=lwShowPlan]'), 'show plan button'); ev(`ACT.lwShowPlan({id:'${W}'})`);
    eq(ev(`lwTypeFor(load('${W}')).id + ':' + lwTypeFor(load('${W}')).zones + ':' + lwTypeFor(load('${W}')).split`), 't125:2:6', 'show plan restores type, zones and bulkhead'); clean(w, 'vehicle type card');
  });
  await group('orders table: height, stackable, third-party tags, partner hand-over locked, summary with third-party and ADR', 'ru', async (g, ev, w) => {
    ev(`go('orders'); ACT.stab({s:'orders',v:'loadw'}); ACT.lwSel({id:'${W}'})`); const d = w.document;
    assert(d.querySelector('[data-order="T-0107"] .chip.purple') && d.querySelector('[data-order="O-2297"]').textContent.includes('×2'), 'third-party tag and stackable mark');
    eq(d.querySelector('[data-sum=third] b').textContent.trim(), '4 пал.', 'third-party pallets'); assert(/Да · LQ/.test(d.querySelector('[data-sum=adr] b').textContent), 'ADR yes LQ');
    ev(`ops(load('${W}')).orders.find(o => o.id === 'T-0107').handed = 'PL-04'; render()`); assert(d.querySelector('[data-order="T-0107"][data-locked]'), 'handed order locked'); assert(d.querySelector('[data-sum=handed]'), 'handed summary');
    ev(`ACT.lwOrd({id:'${W}', o:'T-0107'})`); assert(ev(`ops(load('${W}')).orders.find(o => o.id === 'T-0107').on !== false`), 'locked order cannot be toggled'); eq(ev(`lwCalc(load('${W}')).thirdPal`), 1, 'handed order not counted');
    ev(`ACT.lwOrd({id:'${W}', o:'O-2290'})`); assert(d.querySelector('[data-order="O-2290"]').classList.contains('off'), 'ticked off'); clean(w, 'orders table');
  });
  await group('loading diagram by chambers: thermo containers at the front wall, −20 °C thermo boxes, LIFO, the SVG fits its card', 'ru', async (g, ev, w) => {
    ev(`go('orders'); ACT.stab({s:'orders',v:'loadw'}); ACT.lwSel({id:'${W}'})`); const d = w.document;
    assert(d.querySelector('[data-chamber=front]') && d.querySelector('[data-chamber=main]'), 'two chambers in the legend'); assert(d.querySelector('[data-box="O-2295"]') && d.querySelector('[data-boxmark]'), 'thermo box at the front wall');
    const front = ev(`lwCalc(load('${W}')).groups.front`); assert(front.reg === 'cold' && front.start === 0 && front.used === 4, '2–8 °C thermo containers first, 4 places'); assert(d.querySelectorAll('[data-slot][data-zone=tc]').length === 4, 'thermo-container cells drawn');
    const sl = ev(`lwCalc(load('${W}')).slots`); assert(sl.filter(s => s.key === 'main').every((s, i, a) => i === 0 || a[i - 1].stop >= s.stop), 'LIFO within the body: last stop first');
    for (const id of ['t35', 'r20', 't125']) { ev(`ACT.lwType({id:'${W}', v:'${id}'})`); const c = d.querySelector('[data-diagram]').getBoundingClientRect(), s = d.querySelector('[data-top-chambers]').getBoundingClientRect(); assert(s.right <= c.right + 1 && s.left >= c.left - 1, id + ': diagram wider than its card'); }
    clean(w, 'diagram');
  });
  await group('bars and checks: thermo-container and 15–25 bars, limiting factor, Risk / Watch / Normal incl. ADR, dry ice, FEFO, SSCC', 'ru', async (g, ev, w) => {
    ev(`go('orders'); ACT.stab({s:'orders',v:'loadw'}); ACT.lwSel({id:'${W}'})`); const d = w.document;
    assert(d.querySelector('[data-bar=tc]') && d.querySelector('[data-bar=main]'), 'thermo-container and 15–25 bars'); assert(/Ограничивающий фактор — объём/.test(d.querySelector('[data-insight]').textContent), 'limiting factor: volume');
    assert(d.querySelector('[data-check=box]') && d.querySelector('[data-check=adrOk]') && d.querySelector('[data-check=third]'), 'dry ice, ADR and third-party checks'); assert(d.querySelector('[data-check=fefo]') && /LOT/.test(d.querySelector('[data-check=fefo]').textContent), 'FEFO with LOT and branch');
    assert(d.querySelector('[data-check=sscc][data-lvl="2"]'), 'SSCC package check on watch'); assert(/Риск|Внимание|Норма/.test(d.querySelector('[data-check] .chip').textContent), 'levels Risk / Watch / Normal');
    ev(`ACT.lwType({id:'${W}', v:'t35'})`); assert(d.querySelector('[data-check][data-lvl="3"]') && d.querySelector('[data-overloads]'), 'risk with overload tags'); assert(ev(`lwCalc(load('${W}')).issues.some(i => i.code === 'adr')`), '3.5 t has no ADR equipment');
    ev(`ACT.lwType({id:'${W}', v:'f:t1'})`); ev("drv('d3').id && (ADR_DRV.d3 = null)"); ev('render()'); assert(ev(`lwCalc(load('${W}')).issues.some(i => i.code === 'adrDriver')`), 'driver without ADR certificate is a risk'); clean(w, 'bars and checks');
  });
  await group('centre of gravity facts: CoG from the front wall, CoG height, front-axle share, left / right with Δ ≤ tolerance; ×2 marks', 'ru', async (g, ev, w) => {
    ev(`go('orders'); ACT.stab({s:'orders',v:'loadw'}); ACT.lwSel({id:'${W}'})`); const d = w.document;
    for (const k of ['cogx', 'cogz', 'front', 'lat']) assert(d.querySelector(`[data-v2="${k}"] b`), 'fact box ' + k);
    assert(/%$/.test(d.querySelector('[data-v2=cogx] b').textContent.trim()) && /см$/.test(d.querySelector('[data-v2=cogz] b').textContent.trim()) && /Δ .* ≤ /.test(d.querySelector('[data-v2=lat] b').textContent), 'fact formats');
    const r = ev(`lwCalc(load('${W}'))`); assert(r.cogX > 0 && r.cogX < 1 && r.frontPct > 0 && Math.round(r.left + r.right) === r.kg, 'CoG values consistent'); assert(d.querySelector('[data-top-view] [data-cog]'), 'CoG marker');
    assert(/×2/.test(d.querySelector('[data-top-view]').textContent), 'double-stacked mark'); clean(w, 'cog');
  });
  await group('vehicle match: every catalogue type × 1 / 2 zones with bulkhead, own fleet, smallest fitting recommended, click shows the calculation', 'ru', async (g, ev, w) => {
    ev(`go('orders'); ACT.stab({s:'orders',v:'loadw'}); ACT.lwSel({id:'${W}'})`); const d = w.document, m = ev(`vehMatch(load('${W}'))`);
    for (const id of ['t35', 't6', 't75', 't10', 't125']) assert(d.querySelector(`[data-match="${id}:1"]`) && d.querySelector(`[data-match="${id}:2"]`), 'match rows ' + id);
    assert(m.own.length === ev('S.trucks.length'), 'own fleet rows'); assert(m.rec && m.rec.fits && m.cat.slice(0, m.cat.indexOf(m.cat.find(x => x.key === m.rec.key))).every(x => !x.fits), 'smallest fitting type recommended'); eq(d.querySelector('[data-match-rec]').dataset.matchRec, m.rec.key, 'recommendation line');
    assert(m.cat.filter(x => !x.fits).every(x => x.why.length > 0), 'reasons for unfitting types'); assert(m.cat.some(x => x.z === 2 && /\d+ \| \d+/.test(d.querySelector(`[data-match="${x.key}"]`).textContent)), 'two-zone rows show the bulkhead split');
    d.querySelector('[data-match="t125:2"] [data-act=lwType]').click(); eq(ev(`lwTypeFor(load('${W}')).id + ':' + lwTypeFor(load('${W}')).zones`), 't125:2', 'row opens the calculation'); clean(w, 'vehicle match');
  });
  await group('truck finder: demo fleets, spring limits, restrictions per travel day, places per zone, ADR and roads, how it decides', 'ru', async (g, ev, w) => {
    ev(`go('orders'); ACT.stab({s:'orders',v:'loadw'}); ACT.lwSel({id:'${W}'})`); const d = w.document;
    assert(/RS-002/.test(d.querySelector('[data-sim-restr]').textContent) && /32\s000/.test(d.querySelector('[data-sim-restr]').textContent), 'bridge restriction on the travel day'); assert(/700/.test(d.querySelector('[data-sim-legs]').textContent), 'legs with km');
    assert(d.querySelector('[data-sim-how]'), 'how it decides'); assert(d.querySelectorAll('[data-sim] [data-sim-zones] div').length > 10, 'places per zone'); assert(/ДОПОГ ✓/.test(d.querySelector('[data-sim="f:t1"] [data-sim-adr]').textContent) && /дороги ✓/.test(d.querySelector('[data-sim="f:t1"] [data-sim-adr]').textContent), 'ADR and roads ok for t1');
    const n0 = d.querySelectorAll('[data-sim]').length; ev("ACT.lwOpt({v:'fleetX'})"); ev("ACT.lwOpt({v:'v35'})"); assert(d.querySelector('[data-sim="d:V05"]') && d.querySelector('[data-sim="d:V09"]') && d.querySelectorAll('[data-sim]').length > n0, 'demo fleets V05–V09');
    assert(d.querySelector('[data-sim="d:V06"] [data-test="issue:hub"]'), 'other-hub reason'); assert(/ДОПОГ ✗/.test(d.querySelector('[data-sim="d:V09"] [data-sim-adr]').textContent), 'ADR ✗ for V09');
    assert(!ev(`finder(load('${W}'), false, {}).spring`), 'no spring limits in October'); ev("ACT.lwOpt({v:'spring'})"); const f = ev(`finder(load('${W}'), false, {})`);
    assert(f.spring && f.legs[1].maxGross === 15000 && f.legs[1].maxAxle === 6000, 'spring limits on Kostanay – Aktobe'); assert(f.rows.some(r => r.issues.some(i => i.code === 'legGross')), 'a heavy vehicle fails the spring leg');
    assert(/ограничение ✗/.test(d.querySelector('[data-sim="f:t1"] [data-sim-adr]').textContent), 'route limit marked'); clean(w, 'finder');
  });
  await group('P1 Load & weight on the West trip renders in every language without undefined / NaN or Cyrillic in DE / EN', 'ru', async () => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { gg.ev(`go('orders'); ACT.stab({s:'orders',v:'loadw'}); ACT.lwSel({id:'${W}'}); S.ops.fleetX = true; S.ops.v35 = true; S.ops.split = true; S.ops.spring = true; render()`); clean(gg.w, lang + ' west load');
      if (lang === 'de' || lang === 'en') { const t = ['[data-sec=vtype] h3', '[data-diagram]', '[data-sec=bars]', '[data-sec=view2]', '[data-sec=match] .lw-ins', '[data-sim-how]'].map(q => gg.w.document.querySelector(q).textContent).join(' '); assert(!/[А-Яа-яЁё]/.test(t.replace(/Дмитрий Орлов/g, '')), lang + ' has Cyrillic: ' + (t.match(/.{0,20}[А-Яа-яЁё].{0,20}/) || [''])[0]); }
      gg.ev(`ACT.lwType({id:'${W}', v:'t20'})`); clean(gg.w, lang + ' tent without temperature control'); gg.ev(`ACT.lwType({id:'${W}', v:'t75'}); ACT.lwZones({id:'${W}', v:'2'})`); clean(gg.w, lang + ' two zones'); } finally { gg.done(); } }
  });
