  /* ---- W1 operations: Load & weight (FR-99/139/140/143/144/145/146, FR-05/06) ---- */
  await group('ops model: SSCC check digit, one place per pallet, lines and places are separate records (FR-73)', 'ru', async (g, ev) => {
    assert(ev('ssccValid(ssccMake(1)) && ssccValid(ssccMake(987654))'), 'generated SSCC must be valid'); assert(!ev("ssccValid(ssccMake(1).slice(0,17) + ((+ssccMake(1)[17] + 1) % 10))"), 'wrong check digit must be detected');
    assert(ev('S.loads.every(l => opsPlaces(l).length === l.pallets)'), 'places per load must equal pallets'); assert(ev('S.loads.every(l => ops(l).orders.every(o => o.lines.length >= 1 && o.po && o.pl))'), 'every order has lines, PO and PL');
    eq(ev("ssccFromScan('(00) ' + ssccMake(5))"), ev('ssccMake(5)'), 'AI 00 prefix stripped'); assert(ev("tabsOf('orders').map(t => t.key).join()") === 'orders,loadw,ship,docs', 'orders keeps its base tab');
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
    const sq = ev("sequence(load('LD-2026-001850'), TYPES.r20)"); eq(sq.rows.length, 30, 'one row per pallet'); assert(sq.rows[0].stop === ev("ops(load('LD-2026-001850')).orders.slice().sort((a,b)=>b.stop-a.stop)[0].to"), 'last stop at the front wall'); assert(/слева/.test(sq.rows[0].pos) && /справа/.test(sq.rows[1].pos), 'odd left, even right');
    const s = sq.rows[2].sscc; eq(sq.planned[s], 3, 'planned position'); ev("S.ops.sel='LD-2026-001850'; go('orders'); ACT.stab({s:'orders',v:'loadw'})");
    w.document.querySelector('#lw_sscc').value = s; w.document.querySelector('#lw_pos').value = '3'; w.document.querySelector('[data-act=lwScan]').click(); eq(ev('S.ops.seqMsg.lvl'), 0, 'right position accepted');
    w.document.querySelector('#lw_sscc').value = s; w.document.querySelector('#lw_pos').value = '7'; w.document.querySelector('[data-act=lwScan]').click(); eq(ev('S.ops.seqMsg.lvl'), 2, 'wrong position warned'); clean(w, 'load & weight after scan');
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
