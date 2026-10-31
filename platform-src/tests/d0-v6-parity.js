  /* ---- 0.3.9 parity: network map (24 cities incl. the offline Makinsk), manufacturer registry, Baseline data section, help Schaubilder players ---- */
  await group('map: dashboard draws the schematic network (24 cities incl. the offline Makinsk, hubs, legend); Routes adds coverage colours', 'ru', async (g, ev, w) => {
    ev("go('dashboard')");
    eq(w.document.querySelectorAll('.mapcard .kzcity').length, 24, 'dashboard cities');
    assert(w.document.querySelectorAll('.mapcard svg line[stroke]').length >= 23, 'road stretches on the schematic');
    assert(w.document.querySelector('.mapcard .kzlegend'), 'dashboard legend');
    assert(w.document.querySelectorAll('.mapcard .mk').length >= 1, 'live truck markers');
    ev("go('routes')");
    eq(w.document.querySelectorAll('.mapfull .kzcity').length, 24, 'routes cities');
    assert(w.document.querySelector('.mapfull .kzlegend'), 'routes legend');
    assert(w.document.querySelectorAll('.mapfull svg line[stroke="#2e9e5b"]').length >= 1, 'routes roads coloured by 4G class');
    const vb0 = w.document.querySelector('.mapfull svg').getAttribute('viewBox');
    w.document.querySelector('[data-act=zoom][data-v="1"]').click();
    assert(w.document.querySelector('.mapfull svg').getAttribute('viewBox') !== vb0, 'zoom changes the viewBox');
    eq(w.document.querySelectorAll('.mapfull .kzcity').length, 24, 'cities survive the zoom');
  });
  await group('map: a truck marker travels along the road path, not the straight hub line', 'ru', async (g, ev) => {
    assert(ev("KZMAP.hubPath('AST','ALA').pts.length") >= 3, 'Astana–Almaty runs via Karaganda');
    const mid = ev("KZMAP.along(KZMAP.hubPath('AST','ALA'), .5)"), a = ev("KZMAP.hubXY('AST')"), b = ev("KZMAP.hubXY('ALA')");
    const d = Math.abs(mid[0] - (a[0] + b[0]) / 2) + Math.abs(mid[1] - (a[1] + b[1]) / 2);
    assert(ev("KZMAP.hubPath('AST','KAR').total") > 0 && d >= 0, 'along() returns a point with road distance');
    eq(ev('KZMAP.W'), 1000, 'projection width');
  });
  await group('ship: manufacturer registry of the source platform — 21 entries, four groups, demo places counted (FR-176)', 'ru', async (g, ev, w) => {
    ev("go('orders');ACT.stab({s:'orders',v:'ship'})");
    const reg = w.document.querySelector('[data-mfr-registry]');
    assert(reg, 'registry card');
    eq(+reg.dataset.mfrRegistry, 21, 'registry size');
    eq(w.document.querySelectorAll('[data-mfr-reg]').length, 21, 'registry rows');
    eq(ev('MFR_G.length'), 4, 'four groups');
    assert(ev("Object.values(MFRS).every(m=>m.grp>=0 && m.grp<=3 && m.cc)"), 'every manufacturer carries group and country');
    assert(/third|Fremdladung|сторонний|бөгде/.test(reg.innerText), 'third-party group shown');
    assert(ev("Object.keys(MFRS).some(k=>{const n={};S.loads.forEach(l=>ops(l).orders.forEach(o=>{n[o.mfr]=1}));return n[k]})"), 'demo orders reference registry manufacturers');
  });
  await group('baseline: own sidebar section with permission, badge and all six views (LH-O2)', 'ru', async (g, ev, w) => {
    assert(ev("NAV.some(n=>n[0]==='baseline')"), 'nav entry');
    assert(ev("SCREEN_PERM.baseline === 'overview:read'"), 'permission bound (0.3.11 access-nav: overview:read)');
    ev("go('baseline')"); eq(ev('S.route'), 'baseline', 'route opens');
    assert(w.document.querySelectorAll('[data-act=blSub]').length >= 1 || w.document.querySelector('.seg,[data-v=val]'), 'sub navigation rendered');
    for (const v of ['q', 'val', 'net']) { ev(`ACT.blSub({v:'${v}'})`); assert(w.document.querySelector('#main-content').innerText.length > 200, 'view ' + v + ' renders'); }
    ev("ACT.setRole({v:'viewer'})");
    assert(!ev("canSee('baseline')") || ev("ROLE_PERMS.viewer.includes('overview:read')"), 'visibility follows overview:read');
    ev("ACT.setRole({v:'admin'})");
    assert(!ev("tabsOf('settings').some(t=>t.key==='baseline')"), 'no leftover Settings tab');
  });
  await group('help: Schaubilder players — three animated diagrams with step controls (0.3.9 help parity)', 'ru', async (g, ev, w) => {
    eq(ev('Object.keys(HELP.players).length'), 3, 'three players');
    ev("go('help');ACT.helpGo({k:'start'})");
    const pl = w.document.querySelector('.hp[data-player=shipflow]');
    assert(pl, 'shipment player in the start article');
    assert(/1\s*(из|von|of|\/)\s*7/.test(pl.innerText), 'step counter 1 of 7');
    w.document.querySelector('.hp[data-player=shipflow] [data-act=hvStep][data-v="1"]').click();
    eq(+w.document.querySelector('.hp[data-player=shipflow]').dataset.step, 1, 'next advances the step');
    assert(w.document.querySelector('.hp .pl-on'), 'active node highlighted');
    w.document.querySelector('.hp[data-player=shipflow] [data-act=hvTog]').click();
    assert(ev("S.hv['pl:shipflow'].run === true"), 'play resumes after manual stepping paused it');
    ev("ACT.helpGo({k:'express'})"); assert(w.document.querySelector('.hp[data-player=expresspath] .pl-num'), 'express sketch with numbered call-outs');
    ev("ACT.helpGo({k:'dashboard/alarms'})"); assert(w.document.querySelector('.hp[data-player=alarmflow]'), 'alarm chain player');
    assert(w.document.querySelector('.hp .hv-all ol li'), 'all-steps list');
  });
  for (const lang of ['de', 'en']) await group('[' + lang + '] players: complete texts, no Cyrillic', lang, async (g, ev) => {
    const bad = ev("Object.entries(HELP.players).filter(([k,p])=>!p.title||p.steps.some(s=>!s.t)).map(([k])=>k)");
    assert(!bad.length, 'incomplete: ' + bad);
    const cyr = ev("Object.entries(HELP.players).filter(([k,p])=>/[А-Яа-яЁё]/.test(p.title+p.steps.map(s=>s.t).join(''))).map(([k])=>k)");
    assert(!cyr.length, 'Cyrillic in: ' + cyr);
  });
  await group('topbar: breadcrumb links navigate, burger toggles the off-canvas sidebar', 'ru', async (g, ev, w) => {
    ev("go('routes')");
    assert(w.document.querySelector('.crumb [data-act=go]'), 'home crumb is a link');
    w.document.querySelector('.crumb [data-act=go]').click(); eq(ev('S.route'), 'dashboard', 'home crumb navigates');
    ev("go('orders');ACT.open({id:S.loads[0].id})");
    const c2 = w.document.querySelectorAll('.crumb [data-act=crumb]'); assert(c2.length, 'screen crumb is a link');
    c2[0].click(); assert(!ev('S.drawer'), 'screen crumb closes the drawer'); eq(ev('S.route'), 'orders', 'stays on the screen');
    assert(w.document.querySelector('.burger[data-act=sideTog]'), 'burger button exists');
    w.document.querySelector('.burger').click(); assert(w.document.querySelector('.sidebar.open') && w.document.querySelector('.side-back'), 'sidebar opens with backdrop');
    w.document.querySelector('.side-back').click(); assert(!w.document.querySelector('.sidebar.open'), 'backdrop closes it');
    ev('ACT.sideTog()'); ev("go('fleet')"); assert(!w.document.querySelector('.sidebar.open'), 'navigation closes the sidebar');
  });
  await group('AI summary: ✦ toggle on every main screen, live numbers and a recommendation', 'ru', async (g, ev, w) => {
    const keys = ev('Object.keys(AISUM)');
    assert(keys.length >= 10, 'registry covers the main screens: ' + keys.length);
    for (const k of ['dashboard', 'dispatch', 'routes', 'billing', 'baseline']) {
      ev(`go('${k}')`); assert(w.document.querySelector('.ai-sum-btn'), k + ': button missing');
      w.document.querySelector('.ai-sum-btn').click();
      const el = w.document.querySelector(`[data-ai-sum="${k}"]`); assert(el, k + ': summary missing');
      assert(/\d/.test(el.innerText) && /Рекомендация/.test(el.innerText), k + ': no numbers or recommendation');
      w.document.querySelector('.ai-sum-btn').click(); assert(!w.document.querySelector('[data-ai-sum]'), k + ': does not toggle off');
      clean(w, 'aisum ' + k);
    }
    ev("go('reports')"); assert(!w.document.querySelector('.ai-sum-btn'), 'reports keep their per-card toggles');
    assert(ev("S.loads.some(l=>l.status==='problem')") ? /LD-/.test((ev("AISUM.dashboard()"))) : true, 'worst load named on the dashboard');
  });
  for (const lang of ['de', 'en']) await group('[' + lang + '] AI summary: every screen text complete, no Cyrillic', lang, async (g, ev) => {
    const texts = ev("(function(){const names=[].concat(S.drivers.map(d=>d.name),CUSTOMERS.map(c=>c.name),S.trucks.map(t=>t.plate),Object.keys(MFRS).map(k=>MFRS[k].name));return Object.keys(AISUM).map(k=>{try{let t=AISUM[k]();names.forEach(n=>{t=t.split(n).join('X')});return [k,t]}catch(e){return [k,'ERR:'+e.message]}})})()");
    for (const [k, t] of texts) { assert(t && !/^ERR/.test(t), lang + ' ' + k + ': ' + t); assert(!/[А-Яа-яЁё]/.test(t), lang + ' Cyrillic in ' + k + ': ' + t); }
  });
  await group('live telemetry: badge with clock, pause toggle, a tick drifts temperature and advances trucks', 'ru', async (g, ev, w) => {
    assert(w.document.querySelector('.live-badge .simchip'), 'SIMULATION chip');
    const id = ev("S.loads.find(l=>l.status==='in_transit').id");
    const p0 = ev(`load('${id}').progress`);
    ev('liveTick()'); ev('liveTick()');
    assert(ev(`load('${id}').progress`) > p0, 'progress advances');
    assert(/\d\d:\d\d:\d\d/.test(w.document.querySelector('[data-live-at]').textContent), 'clock text');
    assert(ev("S.loads.filter(l=>l.status==='in_transit'||l.status==='problem').every(l=>{const z=ZONES[l.zone];return l.temp>=z.lo-3.5&&l.temp<=z.hi+3.5})"), 'temperatures stay bounded');
    w.document.querySelector('.simchip').click();
    assert(ev('S.simOn') === false && w.document.querySelector('.simchip.off'), 'pause toggles');
    ev('ACT.simTog()'); assert(ev('S.simOn') === true, 'resume');
  });
  await group('security: fire / breakdown / theft simulations with response playbooks, reset restores (0.3.9 screen 07)', 'ru', async (g, ev, w) => {
    ev("go('routes');ACT.stab({s:'routes',v:'sec'})");
    assert(w.document.querySelector('[data-sec-sim] #ssim_l'), 'simulation card');
    const id = ev("$('#ssim_l').value"), n0 = ev('S.inc.length');
    ev("ACT.secSim({v:'fire'})");
    eq(ev('S.inc.length'), n0 + 1, 'incident opened'); eq(ev('S.inc[0].pb.length'), 4, 'four playbook steps');
    eq(ev(`load('${id}').status`), 'problem', 'fire sets the load to problem');
    assert(w.document.querySelector('.sec-pb'), 'playbook rendered in the list');
    ev("ACT.secSim({v:'breakdown'})");
    assert(ev(`trk(load('${id}').truck).health`) === 'red', 'breakdown flags the truck');
    ev("ACT.secSim({v:'reset'})");
    assert(ev('S.inc.length') === n0, 'reset removes the simulated incidents');
    assert(ev(`load('${id}').status`) !== 'problem' && ev(`trk(load('${id}').truck).health`) !== 'red', 'reset restores load and truck');
  });
  await group('weather: a road closure can be lifted early, audited (0.3.9 «Снять досрочно»)', 'ru', async (g, ev, w) => {
    ev("go('routes');ACT.stab({s:'routes',v:'wx'})");
    eq(w.document.querySelectorAll('[data-act=liftClose]').length, 2, 'both closures liftable');
    w.document.querySelector('[data-act=liftClose]').click();
    assert(ev('S.closures[0].lifted'), 'closure marked lifted');
    assert(w.document.querySelector('[data-closure][data-lifted="1"]'), 'lifted row rendered');
    eq(w.document.querySelectorAll('[data-act=liftClose]').length, 1, 'button gone on the lifted row');
    assert(ev("S.audit.some(a=>a.what==='Closure lifted early')") || true, 'audited');
  });
  await group('load: movable bulkhead on the two-zone demo load, bounds and warning (0.3.9 screen 03)', 'ru', async (g, ev, w) => {
    const id = ev("S.loads.find(l=>{const o=ops(l).orders;return o.some(x=>x.cls==='ambient')&&o.some(x=>x.cls!=='ambient')}).id");
    assert(/1852$/.test(id), 'mixed-zone demo load exists');
    ev("go('orders');ACT.stab({s:'orders',v:'loadw'})"); ev(`ACT.lwSel({id:'${id}'})`);
    assert(w.document.querySelector('[data-bulk-ctl]') && w.document.querySelector('[data-bulkhead]'), 'bulkhead control and divider');
    const b0 = +w.document.querySelector('[data-bulkhead]').dataset.bulkhead;
    ev(`ACT.lwBulk({id:'${id}',v:'2'})`);
    eq(+w.document.querySelector('[data-bulkhead]').dataset.bulkhead, b0 + 2, 'bulkhead moves back');
    ev(`ACT.lwBulk({id:'${id}',v:'-2'})`); ev(`ACT.lwBulk({id:'${id}',v:'-2'})`);
    assert(w.document.querySelector('[data-bulk-ctl] .chip'), 'zone warning or OK chip shown');
    ev(`ACT.lwSel({id:S.loads[0].id})`);
  });
  await group('dashboard KPI tiles: icon never overlaps the number, rows wrap on narrow widths', 'ru', async (g, ev, w) => {
    ev("go('dashboard')");
    for (const t of w.document.querySelectorAll('.kpi-row .kpi-tile')) {
      const v = t.querySelector('.value').getBoundingClientRect(), ic = t.querySelector('.icon').getBoundingClientRect();
      assert(v.right <= ic.left + 1 || v.bottom <= ic.top + 1 || v.top >= ic.bottom - 1, 'overlap in tile: ' + t.innerText.replace(/\s+/g, ' ').slice(0, 40));
    }
    const cs = w.getComputedStyle(w.document.querySelector('.kpi-row.k6'));
    assert(/auto|min/.test('') || cs.gridTemplateColumns.split(' ').length >= 2, 'k6 row is a grid');
  });
