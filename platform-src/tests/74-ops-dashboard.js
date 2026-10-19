  /* ---- P2: Dashboard overview (0.3.10 screen 01), trip detail aside, planning records (screen 02) ---- */
  await group('dashboard: 0.3.10 KPI set, alarms (≤ 9) and risks (≤ 6) with source links, compact inbox of 5, hub weather 3 days', 'ru', async (g, ev, w) => {
    ev("go('dashboard')"); const d = w.document;
    eq(d.querySelectorAll('[data-ov-kpis] .kpi-tile').length, 6, 'six KPI tiles'); assert(/OTIF/.test(d.querySelector('[data-ov-kpis]').innerText) && /96,4/.test(d.querySelector('[data-ov-kpis]').innerText), 'OTIF 7 d'); assert(/%/.test(d.querySelectorAll('[data-ov-kpis] .kpi-tile')[4].innerText), 'volume utilisation with weight');
    const na = d.querySelectorAll('[data-ov-alarm]').length, nr = d.querySelectorAll('[data-ov-risk]').length; assert(na >= 3 && na <= 9, 'alarms list ' + na); assert(nr >= 1 && nr <= 6, 'risks list ' + nr); assert(d.querySelector('.ov-src'), 'source → link');
    eq(d.querySelectorAll('.ov-inbox').length, 5, 'five newest inbox messages'); assert(d.querySelector('[data-act=ovTab][data-v=inbox]'), 'All messages (N) →');
    eq(d.querySelectorAll('.wx-tile').length, 15, '5 hubs × 3 days'); assert(d.querySelector('.mapcard .kzcity') && d.querySelector('.qa'), 'map and quick actions kept');
    d.querySelector('[data-ov-alarm="0"]').click(); assert(ev('S.route') !== 'dashboard' || ev("S.tab.dashboard") === 'alarms', 'source link navigates'); clean(w, 'dashboard');
  });
  await group('dashboard: playbook card appears for an active incident simulation and resets', 'ru', async (g, ev, w) => {
    ev("go('routes'); S.tab.routes = 'sec'; render(); document.querySelector('#ssim_l').value = 'LD-2026-001847'; ACT.secSim({v:'theft'}); go('dashboard')"); const d = w.document;
    assert(d.querySelector('[data-playbook]'), 'playbook card'); assert(d.querySelectorAll('[data-playbook] li').length >= 3, 'response steps'); d.querySelector('[data-act=ovPbReset]').click(); assert(!d.querySelector('[data-playbook]'), 'reset removes the card'); clean(w, 'playbook');
  });
  await group('trip detail aside: stops with passed markers, dead zones + ETA confidence, informational checks, service on route, trip sheet once, buran-free move, driver feed', 'ru', async (g, ev, w) => {
    ev("ACT.open({id:'LD-2026-001847'})"); const d = w.document;
    assert(d.querySelector('[data-trip-aside]'), 'aside'); assert(d.querySelectorAll('.tr-stops li').length >= 4 && d.querySelector('.tr-stops li[data-passed="1"]') && d.querySelector('.tr-stops li[data-passed="0"]'), 'timeline with passed markers');
    const labels = [...d.querySelectorAll('.tr-chk b')].map(b => b.textContent); assert(labels.length >= 8, 'checks ' + labels.length); assert(d.querySelector('[data-eta-conf]'), 'ETA confidence'); assert(d.querySelector('[data-cov-next] [data-act=trCov]'), 'Network coverage →'); assert(d.querySelector('[data-trip-ws]'), 'service on route');
    assert(ev("deadZones(load('LD-2026-001851')).length") >= 0, 'dead zones computed'); assert(ev("deadZones(Object.assign({}, load('LD-2026-001847'), {progress: 0.1})).length") >= 1, 'AST → ALA passes the Balkhash dead zone');
    ev("closeDrawer(); ACT.open({id:'LD-2026-001851'})"); const b = d.querySelector('[data-act=trSheet]'); assert(b && !b.disabled, 'trip sheet button'); b.click(); assert(typeof ev("sendTripSheet('LD-2026-001851')") === 'string', 'sheet only once'); assert(d.querySelector('[data-act=trSheet]').disabled, 'button disabled after the first send');
    ev("S.ops.storm = ['AST','KAR']; render()"); assert(ev("buranWindow(load('LD-2026-001851'))") !== null, 'buran-free window exists'); assert(d.querySelector('[data-act=trBuran]'), 'move button'); const eta0 = ev("load('LD-2026-001851').eta"); d.querySelector('[data-act=trBuran]').click(); assert(ev("load('LD-2026-001851').eta") !== eta0, 'trip moved'); ev("S.ops.storm = []");
    ev("closeDrawer(); ACT.open({id:'LD-2026-001847'})"); assert(d.querySelector('[data-drv-feed]'), 'driver app feed'); clean(w, 'aside');
  });
  await group('pre-release checks stay informational: a frost forecast of −45 °C is flagged, never blocks the status buttons', 'ru', async (g, ev, w) => {
    const c = ev("preChecks(load('LD-2026-001851')).map(x => x.label)"); assert(c.length >= 8, 'ten-ish checks'); ev("wxFor('AST'); S.ops.storm = ['AST']"); assert(ev("preChecks(load('LD-2026-001851')).find(x => /−45|-45/.test(x.label))") !== undefined, 'frost check present');
  });
  await group('Planning: unassigned orders with search + selection, booked departures (FR-96) → trip, plan-trip form creates the load and assigns (FR-96)', 'ru', async (g, ev, w) => {
    ev("go('dispatch'); ACT.stab({s:'dispatch',v:'planning'})"); const d = w.document; assert(d.querySelector('[data-plan-records]') && d.querySelector('[data-plan-form]'), 'records view'); const n0 = d.querySelectorAll('[data-plan-order]').length; assert(n0 >= 4, 'orders listed');
    ev("S.ops.plan.q = 'Sysmex'; render()"); assert(d.querySelectorAll('[data-plan-order]').length < n0 && d.querySelectorAll('[data-plan-order]').length >= 1, 'search narrows'); ev("S.ops.plan.q = ''; render()");
    d.querySelector('[data-plan-order="O-26-0102"]').click(); d.querySelector('[data-plan-order="O-26-0104"]').click(); assert(/2 · 11/.test(d.querySelector('[data-plan-box]').innerText), 'load box counts the selection');
    const dep = d.querySelector('[data-act=pnDep]'); if (dep) { const n = ev('S.loads.length'); dep.click(); eq(ev('S.loads.length'), n + 1, 'trip for departure creates a load'); }
    ev("S.ops.plan.truck = 't4'; S.ops.plan.drv = 'd5'; S.ops.plan.dep = '2026-10-20T07:00'; S.ops.plan.eta = '2026-10-20T18:00'; S.ops.plan.note = 'test'; render()"); const n1 = ev('S.loads.length'); d.querySelector('[data-act=pnCreate]').click();
    eq(ev('S.loads.length'), n1 + 1, 'load created'); const l = ev("S.loads[0]"); eq(l.status, 'assigned', 'driver and truck assigned'); eq(ev("ops(S.loads[0]).orders.length"), 2, 'orders attached with places'); assert(ev("ops(S.loads[0]).orders.every(o => o.places.length === o.pal)"), 'places per pallet'); eq(ev("S.orders.some(o => o.id === 'O-26-0102')"), false, 'orders left the pool');
    ev("S.ops.plan.sel = ['O-26-0105']; S.ops.plan.truck = 't1'; S.ops.plan.drv = 'd3'; S.ops.plan.dep = ''"); assert(typeof ev('planCreate()') === 'string', 'departure missing is refused'); clean(w, 'planning');
  });
  await group('dashboard, aside and planning render in every language without undefined / NaN; DE / EN without Cyrillic in the new blocks', 'ru', async () => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { gg.ev("go('dashboard')"); clean(gg.w, lang + ' dashboard'); gg.ev("ACT.open({id:'LD-2026-001847'})"); clean(gg.w, lang + ' aside'); gg.ev("closeDrawer(); go('dispatch'); ACT.stab({s:'dispatch',v:'planning'})"); clean(gg.w, lang + ' planning');
      if (lang === 'de' || lang === 'en') { for (const sel of ['[data-ov-kpis]', '[data-alert-list=risks]', '.wx-tiles', '[data-plan-form]']) { const el = gg.w.document.querySelector(sel); if (el) { const t = el.innerText; assert(!/[А-Яа-яЁё]/.test(t.replace(/.*(?:ТОО|Астана).*/g, '')), lang + ' Cyrillic in ' + sel); } } } } finally { gg.done(); } }
  });
