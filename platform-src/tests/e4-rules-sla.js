  /* ---- R4 · SLA & penalties (I-13), winter concept as rules (I-14), express × temperature overlap (I-12), saved views / column filters / CSV (I-8) ---- */
  const E4_TABS = [['orders', 'orders'], ['orders', 'rec'], ['fleet', 'fleet'], ['drivers', 'drivers'], ['dispatch', 'partners'], ['billing', 'inv'], ['dispatch', 'winter'], ['settings', 'rules'], ['reports', 'sla'], ['billing', 'sla'], ['reports', 'cross']];
  const E4_CYR = /[Ѐ-ӿ]/;
  const e4Clear = w => { try { w.localStorage.removeItem('kz-r4-views'); } catch (_) { /* storage blocked */ } };
  for (const lang of LANGS) await group('[' + lang + '] R4: list tools, winter, rules, SLA and overlap tabs render without undefined / NaN' + (lang === 'de' || lang === 'en' ? ' and without Cyrillic' : ''), lang, async (g, ev, w) => {
    e4Clear(w);
    const run = where => { clean(w, where); if (lang === 'de' || lang === 'en') { const t = w.document.querySelector('#root').innerText, m = t.match(/.{0,20}[Ѐ-ӿ]+.{0,20}/); assert(!m, where + ' has Cyrillic: ' + (m && m[0])); } };
    for (const [s, t] of E4_TABS) { ev(`ACT.setRole({v:'admin'});go('${s}');ACT.stab({s:'${s}',v:'${t}'})`); run(s + '/' + t); }
    for (const k of ['orders', 'loads', 'fleet', 'drivers', 'partners', 'invoices']) {
      const L = ev(`LV_LISTS.find(x=>x.key==='${k}')`); ev(`go('${L.screen}');ACT.stab({s:'${L.screen}',v:'${L.tab}'})`);
      assert(w.document.querySelector(`[data-lv-bar="${k}"]`), k + ': tool bar missing'); assert(w.document.querySelectorAll(`[data-lv-table="${k}"] .lv-in`).length >= 4, k + ': column filters missing');
    }
    ev('winterSnap(true)'); ev("go('dispatch');ACT.stab({s:'dispatch',v:'winter'})"); run('winter with cold snap'); assert(w.document.querySelectorAll('[data-wl]').length >= 3, 'winter trips listed');
    ev("go('reports');ACT.stab({s:'reports',v:'sla'});ACT.slaM({v:'2026-08'})"); run('sla August'); ev("ACT.slaDis({k:'otif'})"); run('sla dispute box');
    for (const by of ['route', 'cust']) { ev(`go('reports');ACT.stab({s:'reports',v:'cross'});ACT.xoBy({v:'${by}'})`); run('overlap by ' + by); }
    for (const k of ['settings/rules', 'dispatch/winter', 'reports/sla', 'billing/sla', 'reports/cross', 'lists-views']) { ev(`go('help');ACT.helpGo({k:'${k}'})`); run('help ' + k); }
  });
  await group('I-8 lists: column filter narrows rows, CSV walks every page with the filters, views store column + screen filters', 'ru', async (g, ev, w) => {
    e4Clear(w);
    ev("go('orders');ACT.stab({s:'orders',v:'orders'})");
    const rows = () => w.document.querySelectorAll('[data-lv-table="loads"] tbody tr:not(:has(td.empty))').length;
    eq(rows(), 8, 'first page has 8 loads');
    const inp = w.document.getElementById('lv_loads_2'); inp.value = 'Алматы'; inp.dispatchEvent(new w.Event('input', { bubbles: true }));
    const n = rows(); assert(n > 0 && n < 8, 'route filter did not narrow: ' + n);
    assert([...w.document.querySelectorAll('[data-lv-table="loads"] tbody tr')].every(r => r.children[2].textContent.includes('Алматы')), 'non-matching row left');
    assert(/по фильтрам/.test(w.document.querySelector('[data-lv-count]').textContent), 'count line');
    const all = ev("lvRows('loads')"), expect = ev("S.loads.filter(l=>HUBS[l.from].city==='Алматы'||HUBS[l.to].city==='Алматы').length");
    eq(all.rows.length, expect, 'CSV covers all pages'); eq(all.head.length, 11, 'header (R1 added a column)'); eq(ev('S.f.page'), 1, 'page restored');
    const d0 = w.__downloads.length; ev("ACT.lvCsv({k:'loads'})"); eq(w.__downloads.length, d0 + 1, 'download recorded'); eq(w.__downloads[d0].name, 'loads-view.csv');
    eq(ev('S.audit[0].decision'), 'Экспорт CSV', 'CSV audited');
    ev("S.f.zone='pharma'");
    const v = ev("lvSaveView('loads','Алматы фарма')"); eq(v.c[2], 'Алматы'); eq(v.s.zone, 'pharma', 'screen filter stored');
    assert(typeof ev("lvSaveView('loads','Алматы фарма')") === 'string', 'duplicate name accepted'); assert(typeof ev("lvSaveView('loads','x')") === 'string', 'one-letter name accepted');
    assert(/Алматы фарма/.test(w.localStorage.getItem('kz-r4-views')), 'view not persisted');
    ev("ACT.lvReset({k:'loads'})"); eq(ev('JSON.stringify(S.lv.loads.c)'), '{}', 'reset clears columns'); eq(ev('S.f.zone'), '', 'reset clears screen filters');
    ev(`lvApply('loads','${v.id}');render()`); eq(ev('S.f.zone'), 'pharma', 'view restores zone'); eq(ev('S.lv.loads.c[2]'), 'Алматы', 'view restores column filter');
    ev("lvApply('loads','p-problem');render()"); eq(ev('S.f.status'), 'problem', 'preset view'); assert(rows() >= 1, 'problem loads shown');
    ev(`lvApply('loads','${v.id}');render()`); assert(w.document.querySelector('[data-act="lvDel"]'), 'delete button for own view'); ev("ACT.lvDel({k:'loads'})"); eq(ev('S.lv.loads.views.length'), 0, 'view deleted');
    assert(ev("S.audit.some(a=>a.decision==='Вид сохранён')") && ev("S.audit.some(a=>a.decision==='Вид удалён')"), 'view save / delete audited');
    /* Orders · records is a div list: the filter row is a div row, matching works on its cells */
    ev("ACT.lvReset({k:'loads'});go('orders');ACT.stab({s:'orders',v:'rec'})");
    const n0 = w.document.querySelectorAll('.or-row[data-order]').length; ev("S.lv.orders.c[1]='−18';render()");
    const n1 = w.document.querySelectorAll('.or-row[data-order]').length; assert(n1 > 0 && n1 < n0, 'orders filter: ' + n0 + ' → ' + n1);
    eq(ev("lvRows('orders')").rows.length, n1, 'orders CSV = filtered rows');
    /* invoices: filter by status text */
    ev("go('billing');ACT.stab({s:'billing',v:'inv'})"); const i0 = w.document.querySelectorAll('[data-lv-table="invoices"] tbody tr').length;
    ev("S.lv.invoices.c[1]='Аптека';render()"); const i1 = w.document.querySelectorAll('[data-lv-table="invoices"] tbody tr').length; assert(i1 >= 1 && i1 <= i0, 'invoice filter');
    ev("S.lv.invoices.c[1]='zzzz';render()"); assert(w.document.querySelector('[data-lv-table="invoices"] td.empty'), 'empty state row');
    e4Clear(w);
  });
  await group('I-14 winter rules: tier by forecast, Go/No-Go check until pre-conditioning is confirmed, surcharge in price and offer', 'en', async (g, ev, w) => {
    eq(ev('S.loads.filter(l=>winterOf(l).tier).length'), 0, 'no tier in October forecast');
    ev('winterSnap(true)'); eq(ev("winterTier('AST','KAR').tier"), 2, 'Karaganda −42 → tier 2'); eq(ev("winterTier('AST','ALA').tier"), 1, 'Astana −34 → tier 1'); eq(ev("winterTier('ALA','SHY').tier"), 0, 'south → none');
    eq(ev("winterTier('AST','KAR').pre"), 60); eq(ev("winterTier('AST','ALA').sur"), 8);
    const lid = ev("S.loads.find(l=>winterOf(l).tier&&['assigned','loading'].includes(l.status)).id");
    const g0 = ev(`gate(load('${lid}')).find(x=>x.key==='winter')`); assert(g0 && !g0.pass && g0.lvl === 3, 'winter check must be red'); assert(/pre-conditioning not confirmed/.test(g0.text), g0.text);
    eq(ev("gate(load('LD-2026-001853')||S.loads.find(l=>!winterOf(l).tier)).some(x=>x.key==='winter')"), false, 'no check when no tier');
    ev("go('dispatch');ACT.stab({s:'dispatch',v:'winter'})"); const btn = w.document.querySelector(`[data-wl="${lid}"] [data-act="wPre"]`); assert(btn, 'confirm button'); btn.click();
    assert(ev(`gate(load('${lid}')).find(x=>x.key==='winter').pass`), 'confirmed → green'); assert(ev("S.audit[0].decision==='Pre-conditioning confirmed'"), 'audited');
    const moving = ev("S.loads.find(l=>winterOf(l).tier&&l.status==='in_transit').id"); assert(typeof ev(`winterPreconfirm('${moving}')`) === 'string', 'confirm after departure accepted');
    const p = ev("bookingPrice({from:'AST',to:'KAR',zone:'pharma',pallets:20})"); eq(p.wTier, 2); eq(p.winter, Math.round(p.base * 0.15), '15 % of base'); eq(p.net, p.base + p.winter); eq(p.total, p.net + Math.round(p.net * ev('VAT')));
    eq(ev("bookingPrice({from:'ALA',to:'SHY',zone:'pharma',pallets:20}).winter"), 0, 'no surcharge without tier');
    ev("go('orders');ACT.stab({s:'orders',v:'bookings'});openDrawer({type:'booking',id:'BK-26-000004',view:'offer'})"); assert(/Winter surcharge \+15 %/.test(w.document.querySelector('.drawer').innerText), 'offer shows the winter line');
    const wp = ev(`winterPrice(load('${lid}'))`); eq(wp.total, wp.base + wp.sur); assert(wp.sur > 0, 'trip surcharge');
    ev('winterSnap(false)'); eq(ev('S.loads.filter(l=>winterOf(l).tier).length'), 0, 'back to normal');
  });
  await group('rules: every change is a version with four eyes (propose, self-approval refused, second role approves or rejects), audited', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'viewer'})"); assert(typeof ev("ruleSave('winter',{sur1:9})") === 'string', 'viewer proposed');
    ev("ACT.setRole({v:'dispatcher'})"); assert(typeof ev("ruleSave('winter',{sur1:9})") === 'string', 'dispatcher proposed');
    ev("ACT.setRole({v:'admin'})");
    assert(/холоднее/.test(ev("ruleSave('winter',{t2:-20})")), 'tier order check'); assert(typeof ev("ruleSave('winter',{sur1:80})") === 'string', 'range check'); assert(typeof ev("ruleSave('winter',{sur1:8})") === 'string', 'no-change accepted');
    const pv = ev("ruleSave('winter',{sur1:10,sur2:18},'2026-11-01')"); eq(pv.status, 'pending'); eq(pv.version, 2); eq(ev("rule('winter','sur1')"), 8, 'pending does not apply');
    assert(typeof ev("ruleSave('winter',{sur1:11})") === 'string', 'second proposal while pending');
    assert(/Четыре глаза/.test(ev("ruleDecide('winter',true)")), 'self-approval');
    ev("go('settings');ACT.stab({s:'settings',v:'rules'})"); assert(w.document.querySelector('[data-rule-pending]'), 'pending card'); clean(w, 'rules pending');
    ev("ACT.setRole({v:'finance'})"); assert(/approvals:sign/.test(ev("ruleDecide('winter',true)")), 'finance cannot approve');
    ev("ACT.setRole({v:'manager'})"); eq(ev("ruleDecide('winter',true)"), null); eq(ev("rule('winter','sur1')"), 10); eq(ev('RULES.sets.winter.version'), 2); eq(ev('RULES.sets.winter.valid_from'), '2026-11-01');
    eq(ev("RULES.sets.winter.history.map(h=>h.status).join(',')"), 'active,superseded'); eq(ev('RULES.sets.winter.history[0].approved_by'), 'manager');
    ev('winterSnap(true)'); eq(ev("winterTier('AST','ALA').sur"), 10, 'new version applies to operations');
    /* SLA definitions use the same path; a rejected version leaves the data untouched */
    ev("ACT.setRole({v:'finance'})"); eq(ev("ruleSave('sla',{otifRate:200000}).status"), 'pending'); ev("ACT.setRole({v:'admin'})"); eq(ev("ruleDecide('sla',false,'too high')"), null); eq(ev("rule('sla','otifRate')"), 150000); eq(ev('RULES.sets.sla.history[0].status'), 'rejected');
    const au = ev("S.audit.filter(a=>a.module==='Правила').map(a=>a.decision)"); assert(au.includes('Предложено (4 глаза)') && au.includes('Утверждено') && au.includes('Отклонено'), 'audit trail: ' + au);
    /* UI path */
    ev("RULES.cur='winter';render()"); w.document.getElementById('ru_door1').value = '12'; ev('ACT.ruSave()'); eq(ev('RULES.sets.winter.pending.data.door1'), 12, 'UI proposal'); eq(ev('RULES.sets.winter.pending.by'), 'admin');
    ev("ACT.setRole({v:'manager'})"); ev("go('settings');ACT.stab({s:'settings',v:'rules'})"); w.document.querySelector('[data-act="ruDecide"][data-v="1"]').click(); eq(ev("rule('winter','door1')"), 12, 'UI approval');
  });
  await group('I-13 SLA: monthly measurement, penalty per point with caps, overall cap, dispute with four-eyes waiver, freeze and statement lines', 'ru', async (g, ev, w) => {
    const aug = ev("slaPenalty('2026-08')"); eq(aug.lines.map(x => x.amt).join(','), '270000,225000,150000,50000', 'August per KPI'); eq(aug.payable, 695000); eq(aug.totalCap, Math.round(51700000 * 0.05));
    eq(ev("slaPenalty('2026-07').payable"), 0, 'July met all targets');
    const oct = ev("slaPenalty('2026-10')"); assert(oct.ms.live, 'October live'); assert(oct.lines.every(x => x.amt <= x.cap), 'per-KPI cap'); assert(oct.payable <= oct.totalCap, 'overall cap');
    const exp = ev("(()=>{const dv=S.loads.filter(l=>l.status==='delivered');return dv.filter(l=>!l.exc&&l.pod!=='rejected'&&Math.abs(slaArrDev(l))<=120).length/dv.length*100})()"); eq(Math.round(oct.ms.otif * 10), Math.round(exp * 10), 'OTIF from loads');
    ev("ACT.setRole({v:'viewer'})"); assert(typeof ev("slaDispute('2026-08','otif','Ошибка телеметрии на трёх рейсах')") === 'string', 'viewer opened dispute');
    ev("ACT.setRole({v:'finance'})"); assert(typeof ev("slaDispute('2026-08','otif','short')") === 'string', 'short reason'); eq(ev("slaDispute('2026-08','otif','Ошибка телеметрии на трёх рейсах')"), null);
    const a2 = ev("slaPenalty('2026-08')"); eq(a2.held, 270000, 'held'); eq(a2.payable, 425000, 'disputed line not deducted'); eq(a2.lines[0].st, 'disputed');
    assert(/approvals:sign/.test(ev("slaResolve('2026-08','otif','waived')")), 'finance cannot waive');
    ev("ACT.setRole({v:'admin'})"); eq(ev("slaResolve('2026-08','otif','waived')"), null); eq(ev("slaPenalty('2026-08').lines[0].st"), 'waived'); eq(ev("slaPenalty('2026-08').payable"), 425000);
    ev("ACT.setRole({v:'finance'})"); eq(ev("slaDispute('2026-08','temp','Датчик неисправен, акт сервиса')"), null); eq(ev("slaResolve('2026-08','temp','withdrawn')"), null); eq(ev("slaPenalty('2026-08').payable"), 425000, 'withdrawn dispute → penalty stands');
    assert(typeof ev("slaPost('2026-10')") === 'string', 'live month posted'); eq(ev("slaFreeze('2026-10')"), null); assert(typeof ev("slaFreeze('2026-10')") === 'string', 'double freeze');
    const frozenOtif = ev("slaMeasure('2026-10').otif"); ev("S.loads.filter(l=>l.status==='delivered').forEach(l=>{l.exc=true})"); eq(ev("slaMeasure('2026-10').otif"), frozenOtif, 'frozen month does not change');
    eq(ev("slaPost('2026-10')"), null); assert(typeof ev("slaPost('2026-10')") === 'string', 'posted twice');
    ev("ACT.setRole({v:'admin'})");
    const st = ev("slaStatement('2026-08')"); eq(st.lines[0].kind, 'service'); eq(st.total, Math.round(51700000) - 425000, 'statement total'); eq(st.lines.filter(x => x.kind === 'penalty').length, 4);
    ev("go('billing');ACT.stab({s:'billing',v:'sla'});ACT.slaM({v:'2026-08'})"); clean(w, 'statement'); eq(w.document.querySelectorAll('[data-stmt^="penalty"]').length, 4); assert(w.document.querySelector('[data-stmt="penalty-otif"] s'), 'waived line struck through');
    ev("go('reports');ACT.stab({s:'reports',v:'sla'})"); eq(w.document.querySelectorAll('[data-sla-month]').length, 4); eq(w.document.querySelectorAll('[data-sla-line]').length, 4);
    const d0 = w.__downloads.length; ev('ACT.slaCsv()'); eq(w.__downloads[d0].name, 'sla-2026-08.csv');
    const au = ev("S.audit.filter(a=>a.module==='SLA').map(a=>a.decision)"); ['Спор открыт', 'Спор: пеня снята', 'Спор: пеня в силе', 'Замер месяца зафиксирован', 'Пени внесены в выписку клиента'].forEach(x => assert(au.includes(x), 'audit missing ' + x));
    /* a changed SLA definition (after the second signature) recalculates closed months */
    ev("ACT.setRole({v:'admin'});ruleSave('sla',{docRate:100000})"); ev("ACT.setRole({v:'manager'});ruleDecide('sla',true)"); eq(ev("slaPenalty('2026-09').lines.find(x=>x.k==='otif').amt"), 60000, 'Sep OTIF 0.4 pts × 150 000');
    eq(ev("slaPenalty('2026-07').payable"), 0);
  });
  await group('I-12 overlap: groups by week / route / customer add up, secured share against 78 %, moving a load is counted, CSV', 'de', async (g, ev, w) => {
    const tot = ev("xoOverlap('week').total"), ex = ev('S.loads.filter(ecoIsExpress).length'); eq(tot.n, ex, 'all express loads');
    for (const by of ['week', 'route', 'cust']) { const o = ev(`xoOverlap('${by}')`); eq(o.rows.reduce((s, r) => s + r.n, 0), ex, by + ' sums'); assert(o.rows.every(r => r.secured <= r.plan + 1 && r.temp <= r.n), by + ' bounds'); eq(o.target, 78); }
    eq(Math.round(tot.overlap * 10), Math.round(ev("S.loads.filter(l=>ecoIsExpress(l)&&l.zone!=='ambient').length") / ex * 1000), 'overlap = temperature share of express');
    ev("go('reports');ACT.stab({s:'reports',v:'cross'})"); assert(w.document.querySelector('[data-xo-section]'), 'section appended'); assert(w.document.querySelector('[data-xo-table="week"]').innerText.includes('KW'), 'week label');
    const lid = ev("S.loads.find(ecoIsExpress).id"); ev(`ACT.ecoMove({id:'${lid}'})`); assert(ev("xoOverlap('route').total.moved") > 0, 'moved saving counted');
    ev("ACT.xoBy({v:'cust'})"); eq(w.document.querySelectorAll('[data-xo-table="cust"] tbody tr').length, ev("xoOverlap('cust').rows.length") + 1, 'rows + total');
    const d0 = w.__downloads.length; ev('ACT.xoCsv()'); eq(w.__downloads[d0].name, 'express-overlap-cust.csv');
  });
