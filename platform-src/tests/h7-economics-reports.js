  /* ---- H7 · 0.3.11 parity, economics and reports: the «Отчёты», «Исходные данные», «Затраты», «Затраты · дизель», «Затраты · свой/внешний»
     and FR-174 scenarios that b0/b1/b2 only covered in part (docs/parity-0311/autotests-gap.md, h7). v6 differs from 0.3.11 on purpose:
     the baseline has six views instead of five tabs, the menu badge counts open questions to KDL (FR-49) instead of critical findings,
     and the cost model works on the 4 target vehicles V01..V04. ---- */

  await group('reports: driver report has one row per driver with trips, km and punctuality — numbers only, on-time 0–100 %, no NaN (0.3.11 Отчёты · по водителям 142–150)', 'ru', async (g, ev, w) => {
    const drv = ev('S.drivers.map(d=>d.id)'), rep = ev('ecoDrvRep()');
    eq(rep.length, drv.length, 'one report row per driver');
    ev("ACT.setRole({v:'admin'});go('reports');ACT.stab({s:'reports',v:'kpi'})");
    const rows = [...w.document.querySelectorAll('[data-drvrep]')];
    eq(rows.length, drv.length, 'rows rendered');
    for (const r of rep) {
      assert(Number.isInteger(r.trips) && r.trips >= 0, r.id + ': trips ' + r.trips);
      assert(Number.isFinite(r.km) && r.km >= 0, r.id + ': km ' + r.km);
      assert(Number.isFinite(r.ontime) && r.ontime >= 0 && r.ontime <= 100, r.id + ': on-time ' + r.ontime);
      const row = rows.find(x => x.getAttribute('data-drvrep') === r.id); assert(row, r.id + ': no row');
      const t = row.innerText.replace(/\s/g, ' ');
      assert(t.includes(r.name), r.id + ': driver name missing');
      assert(t.replace(/ | /g, ' ').includes(String(r.km).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')), r.id + ': km ' + r.km + ' not in the row «' + t + '»');
      assert(t.includes(r.ontime + ' %'), r.id + ': punctuality ' + r.ontime + ' % not in the row');
      assert(!/NaN|undefined|null/.test(t), r.id + ': ' + t);
    }
  });

  await group('baseline: section opens with the KPI row (≥ 8 tiles over the two rows), six views, and every finding of the validation view links to a question (0.3.11 Исходные данные 400–401)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});go('baseline');ACT.blSub({v:'q'})");
    const tiles = w.document.querySelectorAll('#main-content .kpi-row > *').length;
    assert(tiles >= 8, 'KPI tiles ' + tiles);
    eq(w.document.querySelectorAll('#main-content [data-act=blSub]').length, 6, 'views (0.3.11 had 5 tabs, v6 adds the plan-values view)');
    ev("ACT.blSub({v:'val'})");
    const rows = [...w.document.querySelectorAll('[data-finding]')], codes = new Set(ev('ecoQuestions().map(x=>x.code)'));
    eq(rows.length, ev('ECO_BL.BLV.length'), 'one row per finding');
    for (const r of rows) {
      const id = r.getAttribute('data-finding'), refs = ev(`ECO_BL.BLV.find(v=>v.id==='${id}').ref`);
      const c = String(refs).match(/[A-T]\d{1,3}/g) || [];
      assert(c.length >= 1, id + ': finding without a question reference («' + refs + '»)');
      for (const x of c) assert(codes.has(x), id + ': question ' + x + ' is not in the catalogue');
      assert(r.innerText.includes(String(refs).split(/[\s,/]/)[0]), id + ': reference not shown on the row');
    }
  });

  await group('baseline: filter «Критично» shows only the critical findings and their count equals the findings with level 3 (0.3.11 Исходные данные 402)', 'ru', async (g, ev, w) => {
    ev("go('baseline');ACT.blSub({v:'val'});ACT.blVf({v:''})");
    const crit = ev('ECO_BL.BLV.filter(v=>v.lvl>=3).map(v=>v.id)'); assert(crit.length >= 2, 'the demo has critical findings');
    eq(w.document.querySelectorAll('[data-finding]').length, ev('ECO_BL.BLV.length'), 'all findings before the filter');
    const btn = w.document.querySelector('[data-act=blVf][data-v=crit]'); assert(btn, 'filter «Критично» missing'); btn.click();
    const shown = [...w.document.querySelectorAll('[data-finding]')].map(r => r.getAttribute('data-finding'));
    eq(shown.join(','), crit.join(','), 'filtered findings');
    assert(/Критично · \d+/.test(btn.textContent) || /\d+/.test(btn.textContent), 'count on the filter');
    ev("ACT.blVf({v:''})"); eq(w.document.querySelectorAll('[data-finding]').length, ev('ECO_BL.BLV.length'), 'filter resets');
  });

  await group('baseline: menu badge equals the number of open questions to KDL (FR-49) and falls as they are clarified (0.3.11 Исходные данные 405: there the badge counted critical findings)', 'ru', async (g, ev, w) => {
    /* v6 decision: the badge is the FR-49 counter (open questions to KDL), the critical count is shown on the filter chip of the validation view */
    ev("ACT.setRole({v:'admin'});go('baseline')");
    const open = ev('ecoFr49().open'), total = ev('ecoFr49().total');
    assert(open > 0 && open <= total, 'open ' + open + ' of ' + total);
    const link = w.document.querySelector('[data-test="nav:baseline"]'); assert(link, 'baseline link in the menu');
    assert(link.textContent.includes(String(open)), 'badge «' + link.textContent.trim() + '» vs open ' + open);
    eq(ev('NAV_BADGE.baseline()'), open, 'NAV_BADGE.baseline');
    const q = ev('ECO_BL.BLV.find(v=>v.q).id'); ev(`ACT.blClar({id:'${q}'})`);
    eq(ev('NAV_BADGE.baseline()') || 0, open - 1, 'badge after one clarification'); ev(`ACT.blClar({id:'${q}'})`);
    eq(ev('NAV_BADGE.baseline()'), open, 'badge after undo');
  });

  await group('costs: section opens with 6 KPI tiles and 6 tabs; own transport is cheaper than outsourcing (0.3.11 Затраты 432, 434)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});go('billing');ACT.stab({s:'billing',v:'model'});ACT.ecoSub({v:'sum'})");
    eq(w.document.querySelectorAll('#main-content .kpi-row > *').length, 6, 'KPI tiles');
    eq(w.document.querySelectorAll('#main-content [data-act=ecoSub]').length, 6, 'tabs');
    const M = ev('ecoCostCalc()'), outs = ev('ECO_CP.outs');
    eq(Math.round(outs / 1e5) / 10, 24.2, 'outsourcing per month (M ₸)');
    assert(M.save > 0, 'own transport is dearer than outsourcing: ' + M.save);
    eq(Math.round(M.save), Math.round(outs - M.tot), 'saving = outsourcing − running costs');
    const t = w.document.querySelector('#main-content .kpi-row').innerText;
    assert(/Против аутсорсинга/.test(t) && /−\d+ %/.test(t), 'KPI «Против аутсорсинга» shows a saving: ' + t.replace(/\s+/g, ' ').slice(0, 200));
  });

  await group('costs: summary has ≥ 18 items and the total row equals the sum of the items, year = 12 × month, shares add up to 100 % (0.3.11 Затраты 433)', 'ru', async (g, ev, w) => {
    ev("go('billing');ACT.stab({s:'billing',v:'model'});ACT.ecoSub({v:'sum'})");
    const rows = [...w.document.querySelectorAll('tr[data-cost]')], tot = w.document.querySelector('tr[data-cost-total]');
    assert(rows.length >= 18, 'items ' + rows.length); assert(tot, 'total row');
    const n = s => +s.replace(/[^\d]/g, ''), cell = (r, i) => r.children[i].innerText;
    const sum = rows.reduce((a, r) => a + n(cell(r, 3)), 0), total = n(cell(tot, 3));
    assert(Math.abs(sum - total) <= rows.length, 'Σ items ' + sum + ' ≠ total ' + total);
    const M = ev('ecoCostCalc()'); eq(rows.length, M.rows.length, 'rows vs model'); assert(Math.abs(M.rows.reduce((a, r) => a + r.v, 0) - M.tot) < 1e-6, 'model rows ≠ model total');
    assert(Math.abs(M.totVar + M.totFix - M.tot) < 1e-6, 'variable + fixed ≠ total');
    for (const r of M.rows) assert(r.v >= 0 && Number.isFinite(r.v), r.k + ': ' + r.v);
  });

  await group('costs: diesel — 4 vehicles with 8 weekly values, the overrun over 8 % is flagged (V02), the price switch recalculates (0.3.11 Затраты · дизель 437–438)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});go('billing');ACT.stab({s:'billing',v:'model'});ACT.ecoSub({v:'fuel'})");
    const rows = [...w.document.querySelectorAll('tr[data-fuel]')];
    eq(rows.length, 4, 'vehicles'); assert(rows.every(r => r.querySelectorAll('[data-fuel-wk] i').length === 8), 'eight weekly bars per vehicle');
    for (const v of ['V01', 'V02', 'V03', 'V04']) { const wk = ev(`ecoFuelWeeks('${v}')`); eq(wk.length, 8, v + ': weeks'); assert(wk.every(x => x > 0 && Number.isFinite(x)), v + ': weekly values'); }
    const M = ev('ecoCostCalc()');
    for (const x of M.veh) {
      const dev = (x.act - x.l100) / x.l100 * 100, row = rows.find(r => r.getAttribute('data-fuel') === x.id);
      eq(row.hasAttribute('data-overrun'), dev > 8, x.id + ': overrun flag at ' + dev.toFixed(1) + ' %');
    }
    const v2 = rows.find(r => r.getAttribute('data-fuel') === 'V02'); assert(v2.hasAttribute('data-overrun') && /\+11/.test(v2.innerText) && /> 8 %/.test(v2.innerText), 'V02 overrun +11 % flagged: ' + v2.innerText.replace(/\s+/g, ' '));
    const before = rows[0].innerText; ev("ACT.ecoDiesel({v:450})"); const after = w.document.querySelector('tr[data-fuel=V01]').innerText; ev("ACT.ecoDiesel({v:340})");
    assert(before !== after, 'price 450 ₸/l did not change the fuel cost');
  });

  await group('costs: own vs external — 7 shipments, the cheaper option is named for each, a gap over 50 % needs two signatures (0.3.11 Затраты · свой/внешний 444–445)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});go('billing');ACT.stab({s:'billing',v:'model'});ACT.ecoSub({v:'own'})");
    const rows = [...w.document.querySelectorAll('tr[data-own]')]; eq(rows.length, 7, 'shipments');
    const M = ev('ecoCostCalc()'), O = ev('ECO_COWN.map(o=>o.id)');
    for (const id of O) {
      const r = ev(`ecoOwnCalc(ECO_COWN.find(o=>o.id==='${id}'),ecoCostCalc())`), row = rows.find(x => x.getAttribute('data-own') === id);
      eq(r.ownBetter, r.own <= r.ext, id + ': ownBetter vs the numbers (' + Math.round(r.own) + ' / ' + Math.round(r.ext) + ')');
      assert(r.own > 0 && r.ext > 0, id + ': cost');
      const cheaper = row.children[4].innerText.toLowerCase();
      assert(r.ownBetter ? /свой/.test(cheaper) : /внешн/.test(cheaper), id + ': «Выгоднее» says «' + cheaper + '» but ownBetter=' + r.ownBetter);
      eq(r.need, Math.abs(r.own - r.ext) / Math.max(r.own, r.ext) * 100 > 50, id + ': two signatures needed at gap ' + Math.round(r.pct) + ' %');
      assert(r.need === /2 подписи|2 Unterschrift|2 signatures/.test(row.innerText) || /2\/2/.test(row.innerText), id + ': signature hint');
    }
    assert(O.some(id => ev(`ecoOwnCalc(ECO_COWN.find(o=>o.id==='${id}'),ecoCostCalc())`).need), 'at least one shipment with a gap over 50 %');
  });

  await group('baseline: planned values (FR-174) — 26 values, each with area and source, the unverified counter equals the values not marked «checked», a confirmation is audited (0.3.11 Плановые значения 715)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});go('baseline');ACT.blSub({v:'pv'})");
    const PV = ev('ECO_BL.PV.map(p=>({id:p.id,area:p.area,src:p.source,where:p.where}))'); eq(PV.length, 26, 'planned values');
    eq(new Set(PV.map(p => p.id)).size, 26, 'duplicate ids');
    for (const p of PV) { assert(p.src && p.src.length > 3, p.id + ': source'); assert(p.where && p.where.length > 3, p.id + ': where used'); }
    const rows = [...w.document.querySelectorAll('[data-pv]')]; eq(rows.length, 26, 'rows');
    for (const p of PV) assert(rows.find(r => r.getAttribute('data-pv') === p.id).innerText.includes(p.src), p.id + ': source not shown');
    const isOpen = p => ev(`(()=>{const a=S.eco.bl.pv['${p.id}'];return !(a==='checked'||(!a&&!['legal','integration'].includes('${p.area}')&&!['insurer','handling_fee','express_rate','truck_planning'].includes('${p.id}')));})()`);
    const txt = () => w.document.querySelector('#main-content').innerText;
    const open = PV.filter(isOpen); assert(open.length > 0, 'the demo has unverified values');
    /* the chips above the table count the values per check status: the «to verify» chip equals the values the model flags as not checked and not assumption */
    const toVerify = PV.filter(p => ev(`(()=>{const a=S.eco.bl.pv['${p.id}'];return a==='open'||(!a&&['legal','integration'].includes('${p.area}'));})()`)).length;
    assert(new RegExp('проверить\\s*·\\s*' + toVerify).test(txt()), 'counter chip «проверить · ' + toVerify + '»');
    const t = open.find(p => p.area === 'legal'), a0 = ev('S.audit.length');
    ev(`ACT.blPv({id:'${t.id}',v:'checked'})`);
    eq(ev('S.audit.length'), a0 + 1, 'confirmation not audited'); eq(ev('S.audit[0].subject'), t.id, 'audit subject'); eq(ev('S.audit[0].module'), ev("T('Исходные данные', 'Basisdaten', 'Baseline data', 'Бастапқы деректер')"), 'audit module');
    eq(ev(`S.eco.bl.pv['${t.id}']`), 'checked'); assert(new RegExp('проверить\\s*·\\s*' + (toVerify - 1)).test(txt()), 'counter falls to ' + (toVerify - 1));
    ev(`ACT.blPv({id:'${t.id}',v:'open'})`);
    ev("ACT.setRole({v:'dispatcher'});go('baseline');ACT.blSub({v:'pv'})"); const a1 = ev('S.audit.length'); ev(`ACT.blPv({id:'${t.id}',v:'checked'})`);
    eq(ev('S.audit.length'), a1, 'a role without costs:approve must not confirm'); eq(ev(`S.eco.bl.pv['${t.id}']`), 'open'); ev("ACT.setRole({v:'admin'})");
  });
