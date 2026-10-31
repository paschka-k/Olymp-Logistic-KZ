/* ---- H2 · 0.3.11 parity for Load & weight, Shipments and the vehicle match (docs/parity-0311/autotests-gap.md, file h2).
   0.3.11 scenarios: «Производители» 484–486, «Загрузка · типы ТС» 497/502/504/507, «Загрузка · согласованность» 554/555/556/564,
   «Подбор ТС · симуляция» 557/559, FR-143 676, «Логотипы производителей · экран 04» 711–712.
   v6 seed differs from the 0.3.11 demo: the West trip LD-2026-001856 runs on the fleet truck t1 (Reefer 20 t, 33 places) and not on
   the 0.3.11 V02 (HOWO 10 t, 18 places), so absolute figures of 0.3.11 (4 + 14 places, 50,4 m³, R-106) are replaced by the invariants
   they stood for: drawn = ticked = counted, the recommendation is the smallest fitting type, an unfitting type names its reason. ---- */
{
  const W = 'LD-2026-001856';
  const open = (ev, id = W) => ev(`go('orders'); ACT.stab({s:'orders',v:'loadw'}); ACT.lwSel({id:'${id}'})`);
  const num = s => parseFloat(String(s).replace(/ | |\s/g, '').replace(',', '.'));
  /* the first number of «a / b …» of a tile or a bar, whatever the thousands separator is */
  const first = s => num(String(s).split('/')[0]);
  const second = s => num(String(s).split('/')[1]);
  /* 0.3.11 sameState(): what is ticked = what is drawn = what is counted (tiles) = what the bars show */
  const same = (ev, w, id, where) => {
    const d = w.document, r = ev(`(() => { const c = lwCalc(load('${id}')); return { posUsed: c.posUsed, pal: c.p.pal, thermo: c.p.thermo, fUsed: c.groups.front.used, mUsed: c.groups.main.used, kg: Math.round(c.kg), kgMax: c.p.kg, m3: Math.round(c.m3 * 10) / 10, m3Max: c.p.m3, nTick: ops(load('${id}')).orders.filter(o => o.on !== false && !o.handed).length, palTick: ops(load('${id}')).orders.filter(o => o.on !== false && !o.handed && o.pal > 0).reduce((s, o) => s + o.pal, 0) }; })()`);
    const drawn = d.querySelectorAll('[data-diagram] [data-slot]').length;
    eq(drawn, (r.thermo ? r.fUsed : 0) + r.mUsed, where + ': places drawn in the diagram = places counted');
    const tile = d.querySelector('[data-sum=pal] b').textContent, barEl = d.querySelector('[data-bar=pal] .bar-lab span:last-child');
    eq(first(tile), r.posUsed, where + ': pallet tile'); eq(second(tile), r.pal, where + ': pallet tile capacity');
    if (barEl) { eq(first(barEl.textContent), r.posUsed, where + ': pallet bar'); eq(second(barEl.textContent), r.pal, where + ': pallet bar capacity'); }
    else assert(r.posUsed > r.pal && d.querySelector('[data-bar][data-over="1"]'), where + ': the pallet bar is folded into the zone bar only when that zone is overloaded');   /* barsCard() hides a duplicate overloaded «pallets» bar */
    eq(first(d.querySelector('[data-sum=kg] b').textContent), r.kg, where + ': weight tile'); eq(first(d.querySelector('[data-bar=kg] .bar-lab span:last-child').textContent), r.kg, where + ': weight bar');
    eq(first(d.querySelector('[data-sum=m3] b').textContent), r.m3, where + ': volume tile'); eq(first(d.querySelector('[data-bar=m3] .bar-lab span:last-child').textContent), r.m3, where + ': volume bar');
    eq(d.querySelectorAll('[data-order]:not(.off):not([data-locked])').length, r.nTick, where + ': ticked rows = ticked orders');
    return r;
  };

  /* ---------- Производители (484–486): logos on the place rows, the label and the search ---------- */
  await group('manufacturers (0.3.11 «Производители» 484): place rows of the West trip carry the logo of their manufacturer, every id exists in MFRS and its logo file loads', 'ru', async (g, ev, w) => {
    ev(`S.ops.shipLoad = '${W}'; go('orders'); ACT.stab({s:'orders',v:'ship'})`); const d = w.document;
    const ms = ev(`[...new Set(ops(load('${W}')).orders.map(o => o.mfr))]`); assert(ms.length >= 2, 'the West trip has goods of several manufacturers: ' + ms.join(','));
    for (const m of ms) assert(ev(`!!MFRS['${m}']`), m + ' is in the registry');
    const rows = [...d.querySelectorAll('[data-line]')]; assert(rows.length >= 8, 'place rows ' + rows.length);
    assert(rows.every(r => r.querySelector('.mlogo')), 'every place row has a logo or an initials badge');
    for (const m of ms) { assert(d.querySelector(`.sh-mfr[data-mfr="${m}"]`), m + ': manufacturer card'); assert(d.querySelector(`.sh-mfr[data-mfr="${m}"] [data-mfr-logo="${m}"]`), m + ': card logo badge'); }
    const named = ev(`['Beckman', 'Werfen'].map(n => Object.keys(MFRS).find(k => MFRS[k].name.includes(n)) || null)`); assert(named.every(Boolean), 'Beckman Coulter and Werfen are in the registry');
    for (const m of ms.filter(m => ev(`!!MFRS['${m}'].logo`))) { const src = d.querySelector(`.sh-mfr[data-mfr="${m}"] img`).getAttribute('src'); assert(/manufacturers\/.+\.(webp|png|svg|jpe?g)$/i.test(src), m + ': logo path ' + src); const ok = await w.fetch(src).then(r => r.ok, () => false); assert(ok, m + ': logo file ' + src + ' is served'); }
    clean(w, 'place rows with logos');
  });
  await group('manufacturers (0.3.11 485): the place label shows the manufacturer name, company and logo in its header', 'ru', async (g, ev, w) => {
    ev(`S.ops.shipLoad = '${W}'; go('orders'); ACT.stab({s:'orders',v:'ship'})`); const d = w.document, rows = [...d.querySelectorAll('[data-line]')];
    for (const r of [rows[0], rows[Math.floor(rows.length / 2)], rows[rows.length - 1]]) {
      const s = r.dataset.s; ev(`ACT.shPick({s:'${s}'})`); const lab = d.querySelector(`[data-label="${s}"]`); assert(lab, s + ': label drawn');
      const m = ev(`opsPlaces(load('${W}')).find(p => p.sscc === '${s}').mfr || ops(load('${W}')).orders.find(o => o.places.some(p => p.sscc === '${s}')).mfr`), name = ev(`MFRS['${m}'].name`);
      assert(lab.querySelector('b').textContent.includes(name), s + ': header names ' + name); assert(lab.querySelector('.mlogo') && lab.querySelector('[data-mfr-logo]'), s + ': header has the logo element');
    }
    clean(w, 'label');
  });
  await group('manufacturers (0.3.11 486): a search result of goods carries the logo (or the manufacturer badge) of the line', 'ru', async (g, ev, w) => {
    const hit = ev(`(() => { const l = load('${W}'), o = ops(l).orders.find(x => MFRS[x.mfr].logo) || ops(l).orders[0]; return { art: o.lines[0].art, mfr: o.mfr, logo: !!MFRS[o.mfr].logo }; })()`);
    ev(`go('dashboard'); gsInput(${JSON.stringify(hit.art)})`); const d = w.document, rows = [...d.querySelectorAll('.gs-row')].filter(r => r.querySelector('.gs-main'));
    assert(rows.length >= 1, 'a result for the article ' + hit.art);
    const mine = ev(`gsResults().L.filter(x => x.kind === 'line' && x.hit === ${JSON.stringify(hit.art)}).map(x => x.mfr)`); assert(mine.includes(hit.mfr), 'the result row knows its manufacturer ' + hit.mfr);
    assert(hit.logo ? !!d.querySelector('.gs-row .gs-logo img') : !!d.querySelector('.gs-row .gs-type'), 'logo (' + hit.logo + ') or badge in the search row'); clean(w, 'search with logos');
  });

  /* ---------- Загрузка · типы ТС (497, 502, 504, 507) ---------- */
  await group('vehicle types (0.3.11 497): the default view is the actual vehicle; places per zone, pallets and volume are what the orders add up to', 'ru', async (g, ev, w) => {
    open(ev); const d = w.document;
    assert(d.querySelector('[data-act=lwType][data-v="f:t1"].on'), 'default = actual vehicle t1 (0.3.11: V02)'); const r = same(ev, w, W, 'default');
    const o = ev(`(() => { const c = lwCalc(load('${W}')); return { f: c.groups.front.used, m: c.groups.main.used, pal: c.pal, m3: Math.round(c.m3 * 10) / 10, sumPal: ops(load('${W}')).orders.filter(o => o.on !== false && !o.handed).reduce((s, o) => s + o.pal, 0), sumM3: Math.round(ops(load('${W}')).orders.filter(o => o.on !== false && !o.handed).reduce((s, o) => s + o.m3, 0) * 10) / 10, fits: c.fits }; })()`);
    eq(o.pal, o.sumPal, 'pallets = sum of the ticked orders'); eq(o.m3, o.sumM3, 'volume = sum of the ticked orders'); eq(o.f + o.m, r.posUsed, 'places per zone add up to the places used'); assert(o.f > 0 && o.m > 0, 'both chambers are used (thermo containers and the 15–25 °C body)');
    assert(ev(`lwCalc(load('${W}')).issues.filter(i => i.sev === 3).length`) === 0, 'no critical check on the default vehicle'); assert(d.querySelector('[data-chamber=front]') && d.querySelector('[data-chamber=main]'), 'two chambers in the legend');
    clean(w, 'default vehicle');
  });
  await group('vehicle types (0.3.11 502): 7.5 t with 2 zones — a bulkhead pushed to the minimum overloads zone 1 (2–8 °C) as a critical check, moving it back clears it', 'ru', async (g, ev, w) => {
    open(ev); const d = w.document; ev(`ACT.lwType({id:'${W}', v:'t75', z:'2'})`);
    const cold = ev(`lwCalc(load('${W}')).groups.front.pal`), t = ev('TYPES.t75.z2'); assert(cold > t.splitMin, 'the cold pallets (' + cold + ') exceed the minimum of zone 1 (' + t.splitMin + ')');
    ev(`ACT.lwBulk({id:'${W}', v:'-20'})`); eq(+d.querySelector('[data-bulkhead]').dataset.bulkhead, t.splitMin, 'bulkhead at the minimum'); assert(d.querySelector('[data-bulk-ctl] [data-v^="-"]').disabled, 'cannot move further forward');
    const z = ev(`lwCalc(load('${W}')).issues.find(i => i.code === 'zone' && i.zone === 'zone1')`); assert(z && z.sev === 3 && /\+\d/.test(z.text), 'zone 1 overloaded: ' + (z && z.text)); assert(d.querySelector('[data-check=zone][data-lvl="3"]') && d.querySelector('[data-bar=zone1][data-over="1"]'), 'check and bar show the overload');
    ev(`ACT.lwBulk({id:'${W}', v:'20'})`); assert(!ev(`lwCalc(load('${W}')).issues.some(i => i.code === 'zone' && i.zone === 'zone1')`), 'zone 1 fits with the bulkhead at the maximum'); clean(w, 'bulkhead');
  });
  await group('vehicle types (0.3.11 504): ticking another order recomputes the vehicle match — the recommendation follows the load (smallest fitting type), and returns when the order is unticked', 'ru', async (g, ev, w) => {
    open(ev); const d = w.document, rec = () => d.querySelector('[data-match-rec]').dataset.matchRec, calc = () => ev(`vehMatch(load('${W}')).rec ? vehMatch(load('${W}')).rec.key : ''`);
    const k0 = rec(); eq(k0, calc(), 'the card shows the computed recommendation'); assert(k0, 'a catalogue type fits the default load');
    const ords = ev(`ops(load('${W}')).orders.filter(o => o.pal > 0 && !o.handed).map(o => ({ id: o.id, on: o.on !== false, pal: o.pal }))`);
    const keys = new Set([k0]), rank = k => ev(`vehMatch(load('${W}')).cat.findIndex(x => x.key === '${k}')`);
    for (const o of ords) { ev(`ACT.lwOrd({id:'${W}', o:'${o.id}'})`); eq(rec(), calc(), o.id + ': card follows the model after the tick'); keys.add(rec()); ev(`ACT.lwOrd({id:'${W}', o:'${o.id}'})`); eq(rec(), k0, o.id + ': the recommendation returns after the order is ticked back'); }
    ords.filter(o => o.on).forEach(o => ev(`ACT.lwOrd({id:'${W}', o:'${o.id}'})`)); const k1 = rec(); assert(k1 === '' || rank(k1) <= rank(k0), 'a lighter load never recommends a bigger type: ' + k0 + ' → ' + k1);
    ords.filter(o => !o.on).forEach(o => ev(`ACT.lwOrd({id:'${W}', o:'${o.id}'})`)); assert(keys.size >= 1, 'recommendations seen: ' + [...keys].join(',')); ev(`ops(load('${W}')).orders.forEach(o => { if (o.pal > 0 && !o.handed) o.on = true; }); render()`);
    const k2 = rec(); assert(k2 === '' || rank(k2) >= rank(k0), 'all orders ticked never recommend a smaller type: ' + k0 + ' → ' + k2); clean(w, 'match recompute');
  });
  await group('vehicle types (0.3.11 507): alarms and the dispatcher compute with the actual truck, not with a saved plan of another type', 'ru', async (g, ev, w) => {
    const L = W; eq(ev(`savePlan('${L}', 't35', 'demo: plan of another type, cleared by the ops lead')`), null, 'plan t35 saved with override'); assert(ev(`ops(load('${L}')).plan.fits === false`), 'the plan does not fit');
    const act = ev(`(() => { const t = trk(load('${L}').truck); return { id: t.id, fits: loadCalc(ops(load('${L}')).orders, typeOfTruck(t), t.zones).fits }; })()`); assert(act.id, 'the trip has an actual truck'); eq(ev(`load('${L}').truck`), act.id, 'actual truck unchanged by the plan');
    ev("go('dashboard'); S.tab.dashboard = 'overview'; render()"); const risk = [...w.document.querySelectorAll('[data-ov-risk]')].map(e => e.textContent).filter(t => t.includes(L) && /не помещается|does not fit|passt nicht/i.test(t));
    eq(risk.length > 0, !act.fits, 'dashboard risk "load does not fit" follows the actual truck (fits=' + act.fits + '), not the plan');
    const view = ev(`lwTypeFor(load('${L}')).id`); eq(view, 't35', 'the load card opens on the saved plan'); ev(`ACT.lwType({id:'${L}', v:'f:${act.id}'})`); eq(ev(`lwTypeFor(load('${L}')).own.truck.id`), act.id, 'the actual truck is selectable next to the plan');
    clean(w, 'actual vs plan');
  });

  /* ---------- Загрузка · согласованность (554, 555, 556, 564) ---------- */
  await group('load consistency (0.3.11 554): fresh state — ticked orders = places drawn = tiles = bars', 'ru', async (g, ev, w) => {
    open(ev); const r = same(ev, w, W, 'fresh West trip'); assert(r.nTick >= 6, 'ticked orders in the fresh state ' + r.nTick); eq(ev(`ops(load('${W}')).orders.filter(o => o.on === false).length`) + r.nTick, ev(`ops(load('${W}')).orders.length`), 'every order is either ticked or off');
    clean(w, 'consistency');
  });
  await group('load consistency (0.3.11 555): every catalogue type × 1 / 2 thermo zones / no control × bulkhead − / + — the diagram, the tiles and the bars agree', 'ru', async (g, ev, w) => {
    open(ev); let n = 0;
    for (const t of ['t35', 't6', 't75', 't10', 't125']) {
      for (const z of ev(`[1, 2, 0].filter(z => hasVar(TYPES.${t}, z) && (z !== 0 || TYPES.${t}.nt || TYPES.${t}.thermo === false))`)) {
        ev(`ACT.lwType({id:'${W}', v:'${t}', z:'${z}'})`); same(ev, w, W, t + ' · ' + z + ' zones'); n++;
        if (z === 2) for (const dv of [-20, 20, -2, 2]) { ev(`ACT.lwBulk({id:'${W}', v:'${dv}'})`); same(ev, w, W, t + ' · bulkhead ' + w.document.querySelector('[data-bulkhead]').dataset.bulkhead); n++; }
      }
    }
    for (const id of ['r12', 'r20', 'v10', 't20']) { ev(`ACT.lwType({id:'${W}', v:'${id}', z:'${id === 't20' ? 0 : 1}'})`); same(ev, w, W, id); n++; }
    ev(`ACT.lwType({id:'${W}', v:'f:t1'})`); same(ev, w, W, 'back on the actual vehicle'); assert(n >= 25, 'variants compared ' + n); clean(w, 'all variants');
  });
  await group('load consistency (0.3.11 556): ticking an order redraws the diagram, the tiles and the bars in the same tick', 'ru', async (g, ev, w) => {
    open(ev); const d = w.document, snap = () => [d.querySelectorAll('[data-diagram] [data-slot]').length, d.querySelector('[data-sum=pal] b').textContent, d.querySelector('[data-sum=kg] b').textContent, d.querySelector('[data-bar=pal] .bar-lab').textContent, d.querySelector('[data-bar=kg] .bar-lab').textContent].join('|');
    const s0 = snap(), id = ev(`ops(load('${W}')).orders.find(o => o.on !== false && !o.handed && o.pal > 0).id`);
    ev(`ACT.lwOrd({id:'${W}', o:'${id}'})`); assert(snap() !== s0, 'unticking ' + id + ' changed the diagram, tiles and bars at once'); assert(d.querySelector(`[data-order="${id}"]`).classList.contains('off') && !d.querySelector(`[data-diagram] [data-slot="${id}"]`), id + ' left the diagram'); same(ev, w, W, 'after unticking');
    ev(`ACT.lwOrd({id:'${W}', o:'${id}'})`); eq(snap(), s0, 'ticking it back restores everything'); assert(d.querySelector(`[data-diagram] [data-slot="${id}"]`), id + ' is drawn again'); same(ev, w, W, 'after ticking back');
    assert(/LIFO/.test(d.querySelector('[data-diagram]').textContent), 'the diagram explains LIFO'); clean(w, 'ticking');
  });
  await group('load consistency (0.3.11 564): after a full hand-over to a partner every order row is locked, nothing is ticked, the diagram is empty and the tiles read 0', 'ru', async (g, ev, w) => {
    ev(`S.handovers.push({ id: 'HO-H2', load: '${W}', p: 'PL-01', st: 'approved', mode: 'full', items: [] })`); open(ev); const d = w.document;
    const rows = [...d.querySelectorAll('[data-order]')]; assert(rows.length >= 8 && rows.every(r => r.dataset.locked === '1'), 'every order row is locked: ' + rows.filter(r => r.dataset.locked !== '1').map(r => r.dataset.order).join(','));
    eq(d.querySelectorAll('[data-diagram] [data-slot]').length, 0, 'no place in the diagram'); eq(first(d.querySelector('[data-sum=pal] b').textContent), 0, 'pallet tile 0'); eq(first(d.querySelector('[data-sum=kg] b').textContent), 0, 'weight tile 0');
    eq(d.querySelectorAll('[data-order]:not([data-locked]) input:checked').length, 0, 'nothing ticked'); assert(d.querySelector('[data-sim-best][data-sim-empty]'), 'the finder asks for ticked orders'); assert(!ev(`ops(load('${W}')).orders.some(o => !o.handed)`), 'every order is handed over');
    clean(w, 'full hand-over');
  });

  /* ---------- Подбор ТС · симуляция (557, 559) and FR-143 cost (676) ---------- */
  await group('truck finder (0.3.11 557): small types do not fit, fitting ones are ranked above the others, the recommendation is the cheapest fitting one', 'ru', async (g, ev, w) => {
    const f = ev(`(() => { const x = finder(load('${W}'), false, {}); return { n: x.rows.length, best: x.best && x.best.key, rows: x.rows.map(r => ({ key: r.key, fits: r.fits, rate: r.cost.rate, why: r.issues.filter(i => i.sev === 3).map(i => i.code) })) }; })()`);
    assert(f.n >= 16, 'candidates ' + f.n); assert(f.best, 'a recommendation exists'); const firstBad = f.rows.findIndex(r => !r.fits); assert(firstBad > 0 && f.rows.slice(firstBad).every(r => !r.fits), 'fitting rows are all above the unfitting: ' + f.rows.map(r => r.key + (r.fits ? '+' : '-')).join(' '));
    const fit = f.rows.filter(r => r.fits); assert(fit.every((r, i) => !i || fit[i - 1].rate <= r.rate), 'fitting rows ascend by cost'); eq(f.rows[0].key, f.best, 'recommended = first row');
    const small = f.rows.filter(r => /^c:t35:|^c:t6:/.test(r.key)); assert(small.length >= 4 && small.every(r => !r.fits), '3.5 t and 6 t do not take the West trip: ' + small.filter(r => r.fits).map(r => r.key));
    assert(f.rows.filter(r => !r.fits).every(r => r.why.length > 0), 'every unfitting candidate names a critical reason');
    ev(`go('orders'); ACT.stab({s:'orders',v:'loadw'}); ACT.lwSel({id:'${W}'})`); eq(w.document.querySelector('[data-sim-best]').dataset.simBest, f.best, 'the card shows the recommendation'); assert(w.document.querySelector('[data-sim][data-fits="1"].rec, [data-sim].rec'), 'recommended row is marked');
    clean(w, 'finder ranking');
  });
  await group('truck finder (0.3.11 559): a pallet taller than the body is flagged in the simulation, the bars, the side view, the diagram and the checks', 'ru', async (g, ev, w) => {
    open(ev); const d = w.document; const id = ev(`ops(load('${W}')).orders.find(o => o.on !== false && !o.handed && o.pal > 0).id`);
    ev(`ops(load('${W}')).orders.find(o => o.id === '${id}').h = 180; ACT.lwType({id:'${W}', v:'t35', z:'1'})`); const H = ev('TYPES.t35.z1.H'); eq(H, 175, 'the 3.5 t body is 175 cm');
    const c = ev(`lwCalc(load('${W}')).issues.find(i => i.code === 'h')`); assert(c && c.sev === 3 && c.text.includes(id) && /180/.test(c.text) && /175/.test(c.text) && /\+5/.test(c.text), 'critical height check: ' + (c && c.text));
    const hv = d.querySelector('[data-height-view]'); assert(hv && hv.dataset.over === '1' && hv.dataset.h === '180' && hv.dataset.hin === '175', 'side view shows 180 > 175'); assert(d.querySelector('[data-bar=h][data-over="1"]') && d.querySelector('[data-ex=h]'), 'height bar over'); assert(d.querySelector('[data-check=h][data-lvl="3"]'), 'height check');
    assert(/↑/.test(d.querySelector(`[data-diagram] [data-slot="${id}"]`) ? d.querySelector('[data-diagram]').textContent : ''), 'the tall pallet is marked ↑ in the diagram'); assert(ev(`finder(load('${W}'), false, {}).rows.find(r => r.key === 'c:t35:1').issues.some(i => i.code === 'h')`), 'the finder row of 3.5 t names the height'); assert(ev(`vehMatch(load('${W}')).cat.find(x => x.key === 't35:1').r.issues.some(i => i.code === 'h')`), 'vehicle match row too');
    ev(`ACT.lwType({id:'${W}', v:'f:t1'})`); eq(d.querySelector('[data-height-view]').dataset.over, '0', 'the 20-t reefer (265 cm) takes 180 cm'); assert(!ev(`lwCalc(load('${W}')).issues.some(i => i.code === 'h')`), 'no height check on the actual vehicle'); clean(w, 'height');
  });
  await group('truck finder (0.3.11 FR-143 676): "cheapest" ranks by the full trip cost — fuel, tolls, driver hours, empty return and fixed costs — and the total is exactly their sum', 'ru', async (g, ev, w) => {
    const f = ev(`(() => { const x = finder(load('${W}'), true, {}); return x.rows.map(r => ({ key: r.key, fits: r.fits, c: r.cost })); })()`);
    assert(f.length >= 16, 'rows ' + f.length); for (const r of f) { const c = r.c; assert([c.fuel, c.toll, c.driver, c.emptyCost, c.fixed].every(v => Number.isFinite(v) && v >= 0), r.key + ': components are numbers'); eq(c.total, c.fuel + c.toll + c.driver + c.emptyCost + c.fixed, r.key + ': total = sum of the components'); assert(c.fuel > 0 && c.toll > 0 && c.driver > 0 && c.emptyCost > 0, r.key + ': every component counts'); }
    const fit = f.filter(r => r.fits); assert(fit.length >= 2 && fit.every((r, i) => !i || fit[i - 1].c.total <= r.c.total), 'fitting rows ascend by total cost'); const rate = ev(`finder(load('${W}'), false, {}).rows.filter(r => r.fits).map(r => r.key)`), tot = fit.map(r => r.key); assert(rate.length === tot.length, 'the same candidates fit under both rankings');
    ev(`ACT.lwOpt({v:'total'})`); open(ev); const d = w.document; assert(d.querySelector('[data-sim-how]'), 'how it decides'); const rows = [...d.querySelectorAll('[data-sim][data-fits="1"]')].map(r => r.dataset.sim); eq(rows[0], tot[0], 'the UI lists the cheapest by total cost first'); clean(w, 'finder cost');
  });

  /* ---------- Логотипы производителей · экран 04 (711–712): no overlap, logo at the right ---------- */
  for (const px of [1500, 1024]) await group('manufacturer cards at ' + px + ' px (0.3.11 «Логотипы производителей» ' + (px === 1500 ? '711' : '712') + '): the logo sits at the right edge of the card and does not overlap the text', 'ru', async (g, ev, w) => {
    g.f.style.width = px + 'px'; await new Promise(r => setTimeout(r, 400)); ev(`S.ops.shipLoad = '${W}'; go('orders'); ACT.stab({s:'orders',v:'ship'})`); const d = w.document, cards = [...d.querySelectorAll('.sh-mfr[data-mfr]')];
    assert(cards.length >= 2, 'manufacturer cards ' + cards.length); const inter = (a, b) => a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5;
    for (const c of cards) { const m = c.dataset.mfr, cr = c.getBoundingClientRect(), logo = c.querySelector('[data-mfr-logo]').getBoundingClientRect(), text = c.children[1].getBoundingClientRect(), small = c.querySelector('.mlogo').getBoundingClientRect();
      assert(logo.width > 0 && logo.right <= cr.right + 1 && logo.left >= cr.left, m + ': logo inside the card'); assert(cr.right - logo.right < 40, m + ': logo at the right edge (gap ' + Math.round(cr.right - logo.right) + ')'); assert(!inter(logo, text), m + ': logo overlaps the text'); assert(!inter(small, text), m + ': initials / small logo overlaps the text'); assert(text.right <= logo.left + 1, m + ': text ends before the logo'); }
    const withFile = cards.filter(c => ev(`!!MFRS['${c.dataset.mfr}'].logo`)).length; assert(withFile === 0 || cards.every(c => c.querySelector('[data-mfr-logo]')), 'cards without a logo file keep the badge'); assert(d.documentElement.scrollWidth <= px + 2, 'no horizontal page scroll at ' + px + ' px: ' + d.documentElement.scrollWidth); clean(w, 'cards ' + px);
  });
}
