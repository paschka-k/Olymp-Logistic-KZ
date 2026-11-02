  /* ---- H9 · 0.3.11 parity, one row per record. 0.3.11 counted «Место #1…#22», «Город #1…#23», «Партнёр #1…#22» … as separate scenarios; f1 / f4 / b1 / f0 walk
     the same records inside ONE group. This file re-expresses those families with rows() (template.html): every record of the v6 seed is its own scenario in the
     same iframe, so a failing record names itself and the header counts what 0.3.11 counted. v6 has other seed sizes (7 trucks / 7 drivers / 17 partners / 3 fines /
     306 places / 37 current article lines), so the rule is asserted per ACTUAL v6 record, never ported by count. Row titles carry the 0.3.11 number they answer;
     records beyond the 0.3.11 count say «rule of #a–b». 0.3.11 numbers without a record in v6 are mapped in docs/parity-0311/autotests-trace.tsv
     (tools/check-autotest-trace.mjs keeps all 757 accounted for). The whole-set group of each family stays in f1 / f4 / b1 / f0 (uniqueness, cross-record sums). ---- */

  /* 0.3.11 numbers answered by the family, in record order: row k carries nums[k]; further records carry the range. */
  const h9num = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const h9name = (what, nums) => (it, i) => what + ' #' + (i + 1) + ' (0.3.11 ' + (i < nums.length ? '#' + nums[i] : 'rule of #' + nums[0] + '–' + nums[nums.length - 1]) + ')';
  const H9_PLATE_REGION = { '01': 'AST', '02': 'ALA', '09': 'KAR', '17': 'SHY', '06': 'ATY' };   // region code of a KZ plate -> hub city (as in h1)

  await rows(h9name('data: truck plate is a KZ plate of a hub region, unique, truck at a hub', h9num(22, 25)), 'ru', ev => ev(`(() => { const all = S.trucks.map(t => t.plate); return S.trucks.map(t => ({ id: t.id, plate: t.plate, hub: t.hub, dup: all.filter(p => p === t.plate).length, hubs: Object.keys(HUBS) })); })()`), (t, i, ev) => {
    assert(/^\d{3} [A-Z]{3} \d{2}$/.test(t.plate), t.id + ': plate format ' + t.plate);
    assert(H9_PLATE_REGION[t.plate.slice(-2)] && t.hubs.includes(H9_PLATE_REGION[t.plate.slice(-2)]), t.id + ': region ' + t.plate.slice(-2) + ' is not the region of a network hub');
    eq(t.dup, 1, t.id + ': plate repeated'); assert(t.hubs.includes(t.hub), t.id + ': hub ' + t.hub);
  });

  /* places: one flat list per family, read once from the page (306 places in the v6 seed) */
  const H9_PLACES = `(() => { const out = [], now = NOW.getTime(), all = {}; S.loads.forEach(l => ops(l).orders.forEach(o => o.places.forEach(p => { all[p.sscc] = (all[p.sscc] || 0) + 1; })));
    S.loads.forEach(l => { const t = S.trucks.find(x => x.id === l.truck), fe = fefo(l);
      ops(l).orders.forEach(o => o.places.forEach(p => out.push({ s: p.sscc, ok: ssccValid(p.sscc), dup: all[p.sscc], po: p.order, pl: p.load, o: o.id, l: l.id, cls: o.cls, adr: !!o.adr, zone: l.zone, truck: l.truck || null, zones: t ? t.zones : null,
        adrT: !!ADR_TRK[l.truck], adrD: !!ADR_DRV[l.driver], drv: l.driver || null, drvOk: !l.driver || S.drivers.some(d => d.id === l.driver), clsOk: !!ZONES[o.cls],
        lines: o.lines.map(x => ({ art: x.art, exp: x.exp, live: new Date(x.exp).getTime() > now, short: (new Date(x.exp) - new Date(l.eta)) / 864e5 < 90 })), fefo: fe.filter(x => x.order === o.id).map(x => x.art) }))); });
    return out; })()`;
  await rows(h9name('data: place SSCC is 18 digits with a valid GS1 check digit, unique, linked to its order and load', [...h9num(27, 48), ...h9num(473, 482)]), 'ru', ev => ev(H9_PLACES), (p, i, ev) => {
    assert(/^\d{18}$/.test(p.s), 'not 18 digits: ' + p.s); assert(p.ok, 'GS1 check digit wrong: ' + p.s); eq(p.dup, 1, p.s + ' is not unique');
    eq(p.po, p.o, p.s + ' order link'); eq(p.pl, p.l, p.s + ' load link');
    assert(!ev(`ssccValid('${p.s.slice(0, 17) + ((+p.s[17] + 1) % 10)}')`), p.s + ': a changed check digit is still accepted');
  });
  await rows(h9name('data: place belongs to a load that exists; the truck fits temperature class and ADR, the driver is known', h9num(49, 70)), 'ru', ev => ev(H9_PLACES), (p) => {
    assert(p.clsOk, p.s + ': unknown temperature class ' + p.cls); assert(p.drvOk, p.s + ': load ' + p.l + ' names an unknown driver ' + p.drv);
    if (!p.truck) return;   // a load still waiting for a truck: nothing to fit yet (its orders are checked once a truck is booked)
    assert(p.zones, p.s + ': truck ' + p.truck + ' of ' + p.l + ' missing'); assert(p.zones.includes(p.zone), p.s + ': zone ' + p.zone + ' not on truck ' + p.truck + ' (' + p.zones + ')');
    if (p.adr) assert(p.adrT && p.adrD, p.s + ': ADR order ' + p.o + ' on a load without ADR truck / driver');
  });
  await rows(h9name('data: shelf life of the place — no line of its order expired at the demo date, short-life lines are exactly its FEFO entries', h9num(71, 92)), 'ru', ev => ev(H9_PLACES), (p) => {
    assert(p.lines.length > 0, p.s + ': order ' + p.o + ' has no lines');
    for (const x of p.lines) { assert(/^\d{4}-\d{2}-\d{2}$/.test(x.exp), p.o + ' ' + x.art + ': expiry format ' + x.exp); assert(x.live, p.o + ' ' + x.art + ': expired ' + x.exp); }
    eq(p.fefo.slice().sort().join(','), p.lines.filter(x => x.short).map(x => x.art).sort().join(','), p.o + ': FEFO list');
  });

  await rows(h9name('data: fine falls into a waybill of that driver and truck at the violation time', h9num(93, 97)), 'ru', ev => ev(`S.res.fines.map(f => { const w = S.res.waybills.find(x => x.id === f.wb), t = S.trucks.find(x => x.plate === f.plate); return { id: f.id, drv: f.drv, at: f.at, st: f.status, wbId: f.wb, art: f.article, amount: f.amount, wb: w ? { drv: w.drv, truck: w.truck, from: w.from, to: w.to } : null, truck: t ? t.id : null }; })`), (f, i, ev) => {
    assert(f.truck, f.id + ': plate not in the fleet'); assert(f.art && Number.isInteger(f.amount) && f.amount > 0, f.id + ': article / amount');
    assert(ev(`Object.keys(RES.FINE_ST).includes('${f.st}')`), f.id + ': status ' + f.st + ' is not in the fine state machine');
    if (!f.drv) { assert(!f.wb, f.id + ': waybill without driver'); return; }
    if (!f.wb) { assert(['deducted', 'paid', 'closed'].includes(f.st), f.id + ': open fine with an archived waybill'); assert(/^PL-26-\d{4}$/.test(f.wbId), f.id + ': waybill number ' + f.wbId); return; }
    eq(f.wb.drv, f.drv, f.id + ': waybill driver'); eq(f.wb.truck, f.truck, f.id + ': waybill truck');
    const at = Date.parse(f.at); assert(at >= Date.parse(f.wb.from) && (!f.wb.to || at <= Date.parse(f.wb.to)), f.id + ': ' + f.at + ' outside the waybill');
  });

  await rows(h9name('data: driver has a 14-day plan from next Monday with known codes; absences and licence dates are consistent', h9num(98, 110)), 'ru', ev => ev('S.drivers.map(d => d.id)'), (id, i, ev) => {
    const days = ev('RES.planDays()'), codes = ['r', 'd', 'o', 'm'].concat(ev('Object.keys(RES.ABS)')), p = ev(`RES.plan14(drv('${id}'))`);
    eq(days.length, 14, 'plan days'); eq(new Date(days[0] + 'T12:00:00').getDay(), 1, 'plan starts on a Monday'); assert(days[0] > ev('RES.TODAY'), 'plan lies after the demo date');
    eq(p.length, 14, id + ': plan length');
    p.forEach((x, k) => { eq(x.iso, days[k], id + ': day ' + k); assert(codes.includes(x.k), id + ': code ' + x.k); if (x.k === 'r') assert(ev(`RES.LINE_TRUCKS.includes('${x.truck}')`), id + ': trip on a non-line truck ' + x.truck); });
    for (const a of ev(`S.res.abs.filter(a => a.drv === '${id}')`)) assert(p.filter(x => x.iso >= a.from && x.iso <= a.to).every(x => x.k === a.type), a.id + ': absence not in the plan');
    assert(ev(`drv('${id}').docs.every(x => /^\\d{4}-\\d{2}-\\d{2}$/.test(x.to))`), id + ': driver document dates');
  });

  await rows(h9name('data: weather city has a 7-day forecast, min ≤ max, risk 0–3 per day and a serving hub', h9num(111, 133)), 'ru', ev => ev('Object.keys(WEATHER.WX)'), (k, i, ev) => {
    const r = ev(`({ n: WEATHER.WX['${k}'].length, ok: WEATHER.WX['${k}'].every(c => c.min <= c.max && typeof c.wind === 'number'), risk: WEATHER.WX['${k}'].map(c => WEATHER.risk(c)), hub: WEATHER.cityHub('${k}'), name: WEATHER.cityName('${k}'), hubs: Object.keys(HUBS) })`);
    eq(r.n, 7, k + ': forecast days'); assert(r.ok, k + ': min / max / wind'); assert(r.risk.every(x => Number.isInteger(x) && x >= 0 && x <= 3), k + ': risk ' + r.risk);
    assert(r.hubs.includes(r.hub), k + ': serving hub ' + r.hub); assert(r.name && r.name !== k, k + ': city name');
  });

  await rows(h9name('fleet: truck row shows the insurance / tax / fee status and the West approval tag', h9num(134, 137)), 'ru', ev => ev('S.trucks.map(t => t.id)'), (id, i, ev, w) => {
    ev("go('fleet')"); const f = ev(`RES.fees(trk('${id}'))`), cell = w.document.querySelector(`[data-fees="${id}"]`);
    assert(cell, id + ': no fees cell'); assert(f.ogpo && f.kasko && f.ti && f.tax && f.toll && f.fines, id + ': six fee fields');
    assert([0, 1, 2, 3].includes(+cell.dataset.lvl), id + ': level ' + cell.dataset.lvl); assert(cell.innerText.includes(f.ogpo), id + ': OGPO ' + f.ogpo + ' not in the cell «' + cell.innerText.replace(/\s+/g, ' ') + '»');
    assert(w.document.querySelector(`[data-west="${id}"]`), id + ': no West approval tag'); clean(w, 'fleet ' + id);
  });

  await rows(h9name('thermo: vehicle chip and readouts show temperatures (cold chain chips of the thermo screen)', h9num(138, 141)), 'ru', ev => ev('THERMO.vehicles().map(v => ({ id: v.id, plate: v.plate }))'), (v, i, ev, w) => {
    ev(`go('routes');ACT.stab({s:'routes',v:'temp'});ACT.thSel({id:'${v.id}'})`);
    const chip = w.document.querySelector(`[data-th-veh="${v.id}"]`); assert(chip, v.id + ': no chip'); const t = chip.innerText.replace(/\s+/g, ' ');
    assert(t.includes(v.plate), v.id + ': plate missing in «' + t + '»'); assert(/[+−-]?\d+(,\d)? °C/.test(t), v.id + ': no temperature in «' + t + '»');
    eq(w.document.querySelector('.th-chip.sel').dataset.id, v.id, 'selected chip'); eq(w.document.querySelectorAll('[data-th-ro]').length, 3, v.id + ': readout tiles');
    assert([...w.document.querySelectorAll('[data-th-ro]')].every(x => /°C/.test(x.innerText)), v.id + ': readout without a temperature'); clean(w, 'thermo ' + v.id);
  });

  await rows(h9name('reports: driver report row has trips, km and punctuality — numbers only, on-time 0–100 %', h9num(142, 150)), 'ru', ev => ev('ecoDrvRep()'), (r, i, ev, w) => {
    ev("ACT.setRole({v:'admin'});go('reports');ACT.stab({s:'reports',v:'kpi'})");
    const row = w.document.querySelector(`[data-drvrep="${r.id}"]`); assert(row, r.id + ': no row'); const t = row.innerText.replace(/\s/g, ' ');
    assert(Number.isInteger(r.trips) && r.trips >= 0, r.id + ': trips ' + r.trips); assert(Number.isFinite(r.km) && r.km >= 0, r.id + ': km ' + r.km);
    assert(Number.isFinite(r.ontime) && r.ontime >= 0 && r.ontime <= 100, r.id + ': on-time ' + r.ontime); assert(t.includes(r.name), r.id + ': driver name missing'); assert(t.includes(r.ontime + ' %'), r.id + ': punctuality not in «' + t + '»'); assert(!/NaN|undefined|null/.test(t), r.id + ': ' + t);
  });

  await rows(h9name('search: article of a current load is found and points to its load and order', h9num(178, 199)), 'ru', ev => ev(`(() => { const out = []; S.loads.filter(l => l.status !== 'delivered').forEach(l => ops(l).orders.forEach(o => o.lines.forEach(x => out.push({ l: l.id, o: o.id, art: x.art })))); return out; })()`), (x, i, ev) => {
    const hit = ev(`(S.gs.q = ${JSON.stringify(x.art)}, gsResults().L.filter(y => y.kind === 'line' && y.hit === ${JSON.stringify(x.art)}).map(y => y.load + '|' + y.order))`);
    assert(hit.includes(x.l + '|' + x.o), x.art + ': no hit for ' + x.o + ' on ' + x.l); ev('S.gs.q = ""');
  });

  const H9_PARTNER_ROW = (ev, w, id) => { ev("go('dispatch');setTab('dispatch','partners')"); return [...w.document.querySelectorAll('#main-content tr')].map(tr => tr.innerText).find(t => t.includes(id)) || ''; };
  await rows(h9name('data: partner city is in the network, tier and type allowed, Blocked has a reason, SLA 0–100, row on the Partners screen', h9num(232, 253)), 'ru', ev => ev('S.partners.map(p => ({ id: p.id, city: p.city, tier: p.tier, type: p.type, block: p.block, sla: p.sla, dup: S.partners.filter(x => x.id === p.id).length }))'), (p, i, ev, w) => {
    const row = H9_PARTNER_ROW(ev, w, p.id); assert(row, p.id + ': no row in the partner table'); assert(ev('KZMAP.CITY.map(c => c[0])').some(n => row.includes(n)), p.id + ': city ' + p.city + ' not one of the network cities');
    assert(['gold', 'silver', 'bronze', 'blocked'].includes(p.tier), p.id + ': tier ' + p.tier); assert(typeof p.type === 'string' && p.type.length > 1, p.id + ': type');
    if (p.tier === 'blocked') assert(String(p.block).trim().length >= 5, p.id + ': blocked without reason'); assert(p.sla >= 0 && p.sla <= 100, p.id + ': SLA ' + p.sla); eq(p.dup, 1, p.id + ': duplicate id');
  });
  await rows(h9name('data: partner contacts — managers with role, name, phone, mobile and masked variants', h9num(254, 275)), 'ru', ev => ev('S.partners.map(p => ({ id: p.id, c: partnerContacts(p) }))'), (p) => {
    /* 0.3.11: 3 managers per partner; v6 (FR-82): 2 persons per partner, numbers masked until an audited reveal */
    assert(p.c.length >= 2, p.id + ': contacts ' + p.c.length); eq(new Set(p.c.map(c => c.name)).size, p.c.length, p.id + ': the same person twice');
    for (const c of p.c) {
      for (const k of ['id', 'role', 'name', 'tel', 'mob', 'telM', 'mobM']) assert(c[k] && String(c[k]).trim(), p.id + ': contact field ' + k + ' empty');
      assert(/^\+7 7\d\d\d? ?[\d ]+$/.test(c.tel) || /^\+7 \d{3,4} [\d ]+$/.test(c.tel), c.id + ': landline ' + c.tel); assert(/^\+7 7\d\d \d{3} \d{2} \d{2}$/.test(c.mob), c.id + ': mobile ' + c.mob);
      assert(/^\+7 7•• ••• •• \d\d$/.test(c.telM) && c.telM.slice(-2) === c.tel.slice(-2), c.id + ': masked landline ' + c.telM); assert(/^\+7 7•• ••• •• \d\d$/.test(c.mobM) && c.mobM.slice(-2) === c.mob.slice(-2), c.id + ': masked mobile ' + c.mobM);
    }
  });

  await rows(h9name('baseline: city is on the network map, kg/week = kg/month ÷ 4.33, m³/week at 164 kg/m³, temperature split', h9num(355, 377)), 'ru', ev => ev('ECO_BL.BLC.map(c => ({ id: c.id, name: c.name[0], hub: c.hub, kg: c.kg, kgw: c.kgw, m3: c.m3, t: c.t }))'), (c, i, ev) => {
    const d = ev('ECO_BL.BLD.density'); assert(ev('KZMAP.CITY.map(x => x[0])').includes(c.name), c.id + ': ' + c.name + ' not on the network map'); assert(Array.isArray(c.t) && c.t.length === 3, c.id + ': temperature split');
    if (!c.kg) { eq(c.kgw, 0, c.id + ': no volume, no weekly weight'); return; }
    assert(Math.abs(c.kgw - c.kg / 4.33) <= 1.5, c.id + ': kg/week ' + c.kgw + ' vs ' + (c.kg / 4.33).toFixed(1)); assert(Math.abs(c.m3 - c.kgw / d) <= 0.15, c.id + ': m³/week ' + c.m3 + ' vs ' + (c.kgw / d).toFixed(2));
    assert(['ast', 'alm'].includes(c.hub), c.id + ': baseline hub ' + c.hub + ' (the baseline plans two hubs, Astana and Almaty)');
  });
  /* rings R1 / W / A / S (0.3.11 380–386: legs add up to the ring, load fits the planned vehicle at 164 kg/m³); B has no load yet and only the day rule applies */
  const H9_RING_NUMS = { R1: '#380, #383', W: '#381, #384', A: '#382, #385', S: '#386', B: 'rule of #380–386' };
  await rows((r, i) => 'baseline: ring ' + (r ? r.id : '?') + ' legs add up to the ring, load fits the planned vehicle, density 164 kg/m³, ≤ 630 km a day (0.3.11 ' + (r ? H9_RING_NUMS[r.id] || 'rule of #380–386' : '#380–386') + ')', 'ru', ev => ev('ECO_BL.BLR.map(r => ({ id: r.id, full: r.full, km: r.km, kmDay: r.kmDay, kg: r.kg, m3: r.m3, veh: r.veh, legs: r.legs }))'), (r, i, ev) => {
    if (r.full) eq(r.legs.reduce((a, b) => a + b, 0), r.km, r.id + ': Σ legs');
    const v = ev(`ECO_BL.BLF.find(f => '${r.veh}'.startsWith(f.id)) || null`); assert(v, r.id + ': planned vehicle ' + r.veh + ' is not in the target fleet'); assert(r.kg <= v.kg && r.m3 <= v.m3, r.id + ': load over ' + v.model);
    if (r.kg) assert(Math.abs(r.kg / r.m3 - ev('ECO_BL.BLD.density')) < 6, r.id + ': density ' + (r.kg / r.m3).toFixed(0));
    assert(Math.max(...String(r.kmDay).match(/\d+/g).map(Number)) <= 630, r.id + ': ' + r.kmDay + ' km/day > 70 km/h × 9 h');
  });

  /* navigation: the 17 sections of 0.3.11 were merged into 13 menu items; a menu item carries the 0.3.11 section numbers it absorbed (RU 2–18, DE 318–334, EN 335–351) */
  const H9_NAV = [['dashboard', [2]], ['orders', [4, 5, 9]], ['dispatch', [3, 12, 15]], ['fleet', [11]], ['drivers', [13, 14]], ['routes', [6, 7, 8]], ['hubs', []], ['pod', [10]], ['billing', [17]], ['reports', [16]], ['ai', []], ['baseline', [18]], ['settings', []]];
  for (const lang of ['ru', 'de', 'en']) {
    const off = { ru: 0, de: 316, en: 333 }[lang];
    await rows((it, i) => 'nav [' + lang + ']: section «' + H9_NAV[i][0] + '» opens, its heading is the menu label (0.3.11 ' + (H9_NAV[i][1].length ? H9_NAV[i][1].map(n => '#' + (n + off)).join(', ') : 'no counterpart: v6 section') + ')', lang, H9_NAV, ([id], i, ev, w) => {
      eq(ev('NAV.map(n => n[0]).join()'), H9_NAV.map(x => x[0]).join(), 'menu items'); const label = ev(`NAV.find(n => n[0] === '${id}')[2]`);
      ev(`go('${id}')`); eq(w.document.querySelector('.nav-item.active').dataset.v, id, 'active item'); const h = [...w.document.querySelectorAll('#main-content h1, main h1')].map(x => x.innerText.trim());
      eq(h.length, 1, id + ': headings'); eq(h[0], label, id + ': heading = menu label'); clean(w, lang + ' ' + id);
    });
  }
