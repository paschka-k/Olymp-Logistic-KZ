  /* ---- R6 · 0.3.9 parity «Данные · …» (suite.dc.js 22–133, 232–275, 354–399, 421–424, 470–482): the seed data is consistent.
     0.3.9 ran one scenario per record (place, city, driver, partner); here one group walks every record of a dataset and names the
     first bad one. Dates are compared with the demo's own "today" (NOW / RES.TODAY), never with the wall clock. ---- */
  await group('data: fleet plates are KZ format (NNN LLL RR, region of a KZ oblast), unique; every truck sits at a hub (0.3.9 «Данные · ТС»)', 'ru', async (g, ev) => {
    const tr = ev('S.trucks.map(t=>({id:t.id,plate:t.plate,hub:t.hub}))'), hubs = ev('Object.keys(HUBS)');
    assert(tr.length >= 4, 'fleet size ' + tr.length);
    for (const t of tr) {
      assert(/^\d{3} [A-Z]{3} (0[1-9]|1[0-9]|20)$/.test(t.plate), t.id + ': plate format ' + t.plate);
      assert(hubs.includes(t.hub), t.id + ': hub ' + t.hub);
    }
    eq(new Set(tr.map(t => t.plate)).size, tr.length, 'duplicate plates');
    eq(new Set(tr.map(t => t.id)).size, tr.length, 'duplicate truck ids');
  });
  await group('data: every place has an 18-digit SSCC with a valid GS1 check digit, unique, and belongs to its order and load (0.3.9 «Данные · SSCC»)', 'ru', async (g, ev) => {
    const r = ev(`(() => { const out = []; S.loads.forEach(l => ops(l).orders.forEach(o => o.places.forEach(p => out.push({ s: p.sscc, ok: ssccValid(p.sscc), o: p.order, oid: o.id, l: p.load, lid: l.id })))); return out; })()`);
    assert(r.length >= 30, 'places ' + r.length);
    for (const p of r) {
      assert(/^\d{18}$/.test(p.s), 'not 18 digits: ' + p.s);
      assert(p.ok, 'GS1 check digit wrong: ' + p.s);
      eq(p.o, p.oid, p.s + ' order link'); eq(p.l, p.lid, p.s + ' load link');
    }
    eq(new Set(r.map(p => p.s)).size, r.length, 'duplicate SSCC');
    /* the check digit really is checked: a changed last digit is refused */
    const s0 = r[0].s, bad = s0.slice(0, 17) + ((+s0[17] + 1) % 10);
    assert(!ev(`ssccValid('${bad}')`), 'wrong check digit accepted');
    eq(ev(`ssccFromScan('00${s0}')`), s0, 'GS1 (00) scan strips the AI');
  });
  await group('data: every order of a load fits the assigned truck — temperature class among its zones, ADR only on ADR truck and driver (0.3.9 «Данные · рейс»)', 'ru', async (g, ev) => {
    const r = ev(`S.loads.filter(l => l.truck).map(l => { const t = S.trucks.find(x => x.id === l.truck); return { id: l.id, zone: l.zone, zones: t ? t.zones : null, drv: l.driver,
      orders: ops(l).orders.map(o => ({ id: o.id, cls: o.cls, adr: !!o.adr })), adrT: !!ADR_TRK[l.truck], adrD: !!ADR_DRV[l.driver] }; })`);
    assert(r.length >= 5, 'assigned loads ' + r.length);
    for (const l of r) {
      assert(l.zones, l.id + ': truck missing');
      assert(l.zones.includes(l.zone), l.id + ': zone ' + l.zone + ' not on truck ' + l.zones);
      for (const o of l.orders) {
        assert(ev(`!!ZONES['${o.cls}']`), o.id + ': unknown class ' + o.cls);
        if (o.adr) assert(l.adrT && l.adrD, o.id + ': ADR order on a load without ADR truck / driver');
      }
    }
    assert(ev("S.loads.every(l => !l.driver || S.drivers.some(d => d.id === l.driver))"), 'load references an unknown driver');
  });
  await group('data: shelf life — no line is expired at the demo date; lines under 90 days at delivery are exactly the FEFO list (0.3.9 «Данные · срок»)', 'ru', async (g, ev) => {
    const r = ev(`(() => { const now = NOW.getTime(); const out = []; S.loads.forEach(l => ops(l).orders.forEach(o => o.lines.forEach(x => out.push({ l: l.id, o: o.id, art: x.art, exp: x.exp, ok: new Date(x.exp).getTime() > now, short: (new Date(x.exp) - new Date(l.eta)) / 864e5 < 90 })))); return out; })()`);
    assert(r.length >= 20, 'lines ' + r.length);
    for (const x of r) { assert(/^\d{4}-\d{2}-\d{2}$/.test(x.exp), x.o + ': expiry format ' + x.exp); assert(x.ok, x.o + ' ' + x.art + ': expired ' + x.exp); }
    const loads = [...new Set(r.map(x => x.l))];
    for (const id of loads) {
      const short = r.filter(x => x.l === id && x.short).map(x => x.o + x.art).sort().join(',');
      const listed = ev(`fefo(S.loads.find(l => l.id === '${id}')).map(x => x.order + x.art).sort().join(',')`);
      eq(listed, short, id + ': FEFO list');
    }
    assert(r.some(x => x.short), 'the demo has at least one FEFO case');
  });
  await group('data: fines — every attributed fine falls into a waybill of that driver on that truck at the time of the violation (0.3.9 «Данные · штрафы»)', 'ru', async (g, ev) => {
    const r = ev(`S.res.fines.map(f => { const w = S.res.waybills.find(x => x.id === f.wb); const t = S.trucks.find(x => x.plate === f.plate); return { id: f.id, drv: f.drv, at: f.at, wb: w ? { drv: w.drv, truck: w.truck, from: w.from, to: w.to } : null, truck: t ? t.id : null }; })`);
    assert(r.length >= 3, 'fines ' + r.length);
    for (const f of r) {
      assert(f.truck, f.id + ': plate not in the fleet');
      if (!f.drv) { assert(!f.wb, f.id + ': waybill without driver'); continue; }
      if (!f.wb) { /* waybill already archived (not in the live list): only a closed fine may point there */ assert(['deducted', 'paid', 'closed'].includes(ev(`S.res.fines.find(x => x.id === '${f.id}').status`)), f.id + ': open fine with an archived waybill'); assert(/^PL-26-\d{4}$/.test(ev(`S.res.fines.find(x => x.id === '${f.id}').wb`)), f.id + ': waybill number'); continue; }
      eq(f.wb.drv, f.drv, f.id + ': waybill driver'); eq(f.wb.truck, f.truck, f.id + ': waybill truck');
      const at = Date.parse(f.at); assert(at >= Date.parse(f.wb.from) && (!f.wb.to || at <= Date.parse(f.wb.to)), f.id + ': ' + f.at + ' outside the waybill');
    }
    assert(r.some(f => !f.drv), 'one fine without a waybill stays unattributed');
  });
  await group('data: staff — every driver has a 14-day plan from next Monday with known codes; absences show up in the plan (0.3.9 «Данные · персонал»)', 'ru', async (g, ev) => {
    const days = ev('RES.planDays()'); eq(days.length, 14, 'plan days');
    eq(new Date(days[0] + 'T12:00:00').getDay(), 1, 'plan starts on a Monday');
    assert(days[0] > ev('RES.TODAY'), 'plan lies after the demo date');
    const codes = ['r', 'd', 'o', 'm'].concat(ev('Object.keys(RES.ABS)'));
    const plans = ev('S.drivers.map(d => ({ id: d.id, p: RES.plan14(d) }))');
    eq(plans.length, ev('S.drivers.length'), 'one plan per driver');
    for (const { id, p } of plans) {
      eq(p.length, 14, id + ': plan length');
      p.forEach((x, i) => { eq(x.iso, days[i], id + ': day ' + i); assert(codes.includes(x.k), id + ': code ' + x.k); if (x.k === 'r') assert(ev(`RES.LINE_TRUCKS.includes('${x.truck}')`), id + ': trip on a non-line truck ' + x.truck); });
    }
    for (const a of ev('S.res.abs')) { const p = plans.find(x => x.id === a.drv).p; const hit = p.filter(x => x.iso >= a.from && x.iso <= a.to); assert(hit.every(x => x.k === a.type), a.id + ': absence not in the plan'); }
    /* licence / medical deadlines are dates */
    assert(ev("S.drivers.every(d => d.docs.every(x => /^\\d{4}-\\d{2}-\\d{2}$/.test(x.to)))"), 'driver document dates');
  });
  await group('data: weather — every city of the forecast has 7 days, min ≤ max, risk level 0–3 per day, every city has a serving hub (0.3.9 «Данные · погода»)', 'ru', async (g, ev) => {
    const r = ev(`Object.keys(WEATHER.WX).map(k => ({ k, n: WEATHER.WX[k].length, ok: WEATHER.WX[k].every(c => c.min <= c.max && typeof c.wind === 'number'), risk: WEATHER.WX[k].map(c => WEATHER.risk(c)), hub: WEATHER.cityHub(k), name: WEATHER.cityName(k) }))`);
    assert(r.length >= 10, 'forecast cities ' + r.length);
    const hubs = ev('Object.keys(HUBS)');
    for (const c of r) {
      eq(c.n, 7, c.k + ': forecast days'); assert(c.ok, c.k + ': min / max / wind');
      assert(c.risk.every(x => Number.isInteger(x) && x >= 0 && x <= 3), c.k + ': risk ' + c.risk);
      assert(hubs.includes(c.hub), c.k + ': hub ' + c.hub); assert(c.name && c.name !== c.k, c.k + ': name');
    }
    for (const h of hubs) assert(r.some(c => c.k === h), 'hub ' + h + ' has a forecast');
    assert(r.some(c => c.risk.some(x => x >= 2)), 'the demo week has a storm day');
  });
  await group('data: partners — city in the network, tier and type allowed, Blocked always with a reason, SLA 0–100; contacts with name, phone and mobile (0.3.9 «Данные · партнёры / контакты»)', 'ru', async (g, ev) => {
    const r = ev(`S.partners.map(p => ({ id: p.id, city: p.city, tier: p.tier, type: p.type, block: p.block, sla: p.sla, c: partnerContacts(p) }))`);
    assert(r.length >= 15, 'partners ' + r.length);
    /* the network = the 23 cities of the map; a partner row names one of them (codes are local to the partners screen) */
    ev("go('dispatch');setTab('dispatch','partners')");
    const names = ev('KZMAP.CITY.map(c => c[0])'), rows = ev("[...document.querySelectorAll('#main-content tr')].map(tr => tr.innerText)");
    for (const p of r) {
      const row = rows.find(t => t.includes(p.id)) || ''; assert(row, p.id + ': no row in the partner table');
      assert(names.some(n => row.includes(n)), p.id + ': city ' + p.city + ' not one of the 23 network cities');
      assert(['gold', 'silver', 'bronze', 'blocked'].includes(p.tier), p.id + ': tier ' + p.tier);
      assert(['ws', 'log', 'svc', 'carrier', 'lsp'].includes(p.type) || typeof p.type === 'string' && p.type.length > 1, p.id + ': type');
      if (p.tier === 'blocked') assert(String(p.block).trim().length >= 5, p.id + ': blocked without reason');
      assert(p.sla >= 0 && p.sla <= 100, p.id + ': SLA ' + p.sla);
      assert(Array.isArray(p.c) && p.c.length >= 2, p.id + ': contacts ' + (p.c && p.c.length));
      for (const c of p.c) { const s = JSON.stringify(c); assert(/\+7[\s\d•*]{6,}/.test(s), p.id + ': contact without a KZ phone ' + s.slice(0, 80)); }
    }
    eq(new Set(r.map(p => p.id)).size, r.length, 'duplicate partner ids');
    assert(r.some(p => p.tier === 'blocked'), 'a blocked partner exists');
  });
  await group('data: manufacturers — every order line names a registry manufacturer; every registry entry with a logo has a demo place (0.3.9 «Производители» 470–472)', 'ru', async (g, ev) => {
    const r = ev(`(() => { const used = {}; let bad = []; S.loads.forEach(l => ops(l).orders.forEach(o => { [o.mfr].concat(o.lines.map(x => x.mfr)).forEach(m => { if (!MFRS[m]) bad.push(o.id + ':' + m); else used[m] = 1; }); })); return { bad, used: Object.keys(used), logo: Object.keys(MFRS).filter(k => MFRS[k].logo) }; })()`);
    eq(r.bad.length, 0, 'lines with unknown manufacturer: ' + r.bad.slice(0, 3));
    for (const k of r.logo) assert(r.used.includes(k), 'manufacturer with logo but no place: ' + k);
    assert(ev("Object.values(MFRS).every(m => m.name && m.ab && (m.url || m.grp === 3))"), 'name / site / badge for every manufacturer (third-party cargo owners need no site)');
  });
  await group('data: rings of the baseline — load ≤ volume and payload, weekly km per trip pattern, density in the expected band (0.3.9 «Fragenkatalog · кольца»)', 'ru', async (g, ev) => {
    const rings = ev('ECO_RINGS');
    assert(rings.length >= 4, 'rings ' + rings.length);
    for (const r of rings) {
      assert(r.km > 0 && r.per > 0, r.id + ': km / trips per year');
      if (!r.kg) continue;
      const dens = r.kg / r.m3; assert(dens > 140 && dens < 190, r.id + ': density ' + dens.toFixed(0) + ' kg/m³');
      assert(r.m3 <= 50.4 + 1e-9, r.id + ': volume ' + r.m3 + ' over a 10-t isotherm body');
      assert(r.kg <= 10000, r.id + ': payload ' + r.kg);
    }
    assert(rings.some(r => r.id === 'W'), 'West ring');
    clean(g.w, 'data');
  });
