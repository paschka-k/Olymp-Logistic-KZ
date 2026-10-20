  /* ---- R6 · 0.3.9 parity, economics: «Fragenkatalog · данные / города / сеть / экономика» (354–379, 392–399) and «Исходные данные»
     V-12 / V-21 (403–404). The baseline figures are recomputed from their inputs, so a changed input shows up as a failure. ---- */
  await group('baseline volumes: 23 cities sum to 64 249 kg/month, kg/week = kg/month ÷ 4.33, m³/week at 164 kg/m³, Semey and Oskemen served by Astana; 9 366 kg/month unassigned (0.3.9 354–379, V-12)', 'ru', async (g, ev, w) => {
    const C = ev('ECO_BL.BLC'), D = ev('ECO_BL.BLD');
    eq(C.length, 23, 'cities'); const sum = C.reduce((a, c) => a + c.kg, 0); eq(sum, 64249, 'Σ kg/month');
    eq(D.kgMon - sum, 9366, 'unassigned = A1 − sheet');
    for (const c of C) {
      if (!c.kg) continue;
      assert(Math.abs(c.kgw - c.kg / 4.33) <= 1.5, c.id + ': kg/week ' + c.kgw + ' vs ' + (c.kg / 4.33).toFixed(1));
      assert(Math.abs(c.m3 - c.kgw / D.density) <= 0.15, c.id + ': m³/week ' + c.m3 + ' vs ' + (c.kgw / D.density).toFixed(2));
      assert(Array.isArray(c.t) && c.t.length === 3, c.id + ': temperature split');
    }
    for (const id of ['KZ-SEM', 'KZ-UKK']) { const c = C.find(x => x.id === id); assert(c && c.hub === 'ast', id + ' → Astana hub (P86)'); }
    const names = ev('KZMAP.CITY.map(c => c[0])'); for (const c of C) assert(names.includes(c.name[0]), c.id + ': ' + c.name[0] + ' not on the network map');
    ev("go('baseline')"); const t = w.document.querySelector('#main-content').innerText; assert(/9\s?366/.test(t), 'V-12 finding with 9 366 kg on the baseline screen');
  });
  await group('baseline rings and fleet: legs add up to the ring, load fits the planned vehicle (kg and m³), ≤ 630 km per day, target fleet 4 vehicles (0.3.9 380–391)', 'ru', async (g, ev) => {
    const R = ev('ECO_BL.BLR'), F = ev('ECO_BL.BLF');
    for (const r of R) {
      if (r.full) eq(r.legs.reduce((a, b) => a + b, 0), r.km, r.id + ': Σ legs');
      const v = F.find(f => r.veh.startsWith(f.id)) || F[0]; assert(r.kg <= v.kg && r.m3 <= v.m3, r.id + ': load over ' + v.model);
      if (r.kg) assert(Math.abs(r.kg / r.m3 - ev('ECO_BL.BLD.density')) < 6, r.id + ': density ' + (r.kg / r.m3).toFixed(0));
      const kmd = Math.max(...String(r.kmDay).match(/\d+/g).map(Number)); assert(kmd <= 630, r.id + ': ' + r.kmDay + ' km/day > 70 km/h × 9 h');
    }
    const r1 = R.find(r => r.id === 'R1'); eq(Math.round(r1.km / 6), +r1.kmDay, 'R1: 2 430 km in a 6-day week = 405 km/day');
    eq(F.reduce((a, f) => a + f.qty, 0), 4, 'target fleet 4 vehicles');
  });
  await group('baseline economics: investment net × VAT 16 % = 118.6 M ₸, saving 6 916 410 ₸/month ≈ 83.0 M ₸/year, MRP 4 325 → per diem 6 MRP 25 950 ₸ and tax 9 MRP 38 925 ₸, employer-tax shortfall 49 500 ₸/month (V-21), return leg 2.6× heavier (0.3.9 392–399, 404)', 'ru', async (g, ev, w) => {
    const D = ev('ECO_BL.BLD');
    assert(Math.abs(D.capexNet * (1 + D.vatPct / 100) - D.capexVat) < 0.1, 'capex with VAT ' + D.capexNet + ' × 1.16 vs ' + D.capexVat);
    eq(Math.round(D.saveMon * 12 / 1e5) / 10, 83, 'saving per year (M ₸)');
    eq(6 * D.mrp, 25950, 'per diem 6 MRP'); eq(9 * D.mrp, 38925, 'transport tax 9 MRP');
    eq(D.adminGross * (1 + D.empStated / 100), D.adminCost, 'admin cost with the stated 14.5 %');
    eq(D.adminGross * (D.empRates.reduce((a, b) => a + b, 0) - D.empStated) / 100, 49500, 'shortfall at 17.5 %');
    eq(D.itOnce.reduce((a, b) => a + b, 0), 4800000, 'IT once'); eq(D.itMon.reduce((a, b) => a + b, 0), 90000, 'IT per month');
    eq(Math.round(D.almAstKg / D.astAlmKg * 10) / 10, 2.6, 'Almaty → Astana 2.6× heavier');
    assert(ev("ECO_BL.BLV.some(v => /36,3 %/.test(v.fk[0]))"), 'express share 36,3 % of the budget named');
    ev("go('baseline')"); clean(w, 'baseline');
  });
