  /* ---- I7 · FR-216 role home pages (R11) and FR-222 demo scenario presets (R13) ---- */
  const I7_ROLES = ['admin', 'dispatcher', 'warehouse', 'driver', 'auditor', 'viewer', 'manager', 'finance', 'quality', 'customer', 'partner'];
  /* the data a scenario owns, as one fingerprint: trips, drivers, trucks, hubs and inbound jobs, alarms, closures, costs, weather switches */
  const I7_HASH = "lazyHash({ l: S.loads, d: S.drivers, t: S.trucks, h: S.hubs, j: S.jobs, a: S.alarms, c: S.closures, k: S.costs, sc: S.ops.scen, st: S.ops.storm })";
  /* the data a preset owns, without the memos the screens add to the records when they draw: from the live store (f = S) or from the generators (f = fresh) */
  const I7_PROJ = (src) => "(function(L, D, T, H, J){ return lazyHash({ l: L.map(function(l){ return [l.id, l.status, l.eta, l.driver, l.truck, l.temp, l.progress, l.pallets, l.zone, l.from, l.to, l.priority]; }), d: D.map(function(d){ return [d.id, d.status, d.rto]; }), t: T.map(function(t){ return [t.id, t.status, t.health]; }), h: JSON.stringify(H), j: J.map(function(j){ return [j.id, j.hub, j.ramp, j.ev.ci]; }), a: S.alarms.map(function(a){ return [a.id, a.lvl, a.status]; }), c: S.closures, k: S.costs, sc: S.ops.scen, st: S.ops.storm }); })" + src;
  const I7_DEFAULT = I7_PROJ("(mkLoads(), mkDrivers(), mkTrucks(), mkHubs(), mkJobs())");
  const I7_LIVE = I7_PROJ("(S.loads, S.drivers, S.trucks, S.hubs, S.jobs)");
  const I7_FRESH = "(function(){ S.role = 'admin'; S.route = 'dashboard'; S.drawer = null; })()";

  for (const lang of LANGS) await group('[' + lang + '] ROLE_HOME: 4–6 tiles for each of the 11 roles, only tiles the role may open, real KPI values', lang, async (g, ev) => {
    eq(ev("Object.keys(ROLE_HOME).sort().join()"), I7_ROLES.slice().sort().join(), 'ROLE_HOME has exactly the 11 roles');
    for (const role of I7_ROLES) {
      const n = ev("ROLE_HOME['" + role + "'].length"); assert(n >= 4 && n <= 6, role + ': 4–6 tiles are defined, got ' + n);
      const vis = ev("roleHomeTiles('" + role + "').length"); assert(vis >= 4 && vis <= 6, role + ': at least 4 tiles are visible, got ' + vis);
      const bad = ev("(function(){ var r = '" + role + "', old = S.role; S.role = r; var out = roleHomeTiles(r).filter(function(t){ var k = t.kpi(); return !(t.id && t.route && canSee(t.route) && (!t.perm || canDo(t.perm)) && k && String(k.v).length && typeof t.label === 'string' && t.label.length); }).map(function(t){ return t.id; }); S.role = old; return out.join(); })()");
      eq(bad, '', role + ': every visible tile opens a screen the role can see, has its right and a KPI value (' + bad + ')');
      const ids = ev("ROLE_HOME['" + role + "'].map(function(t){return t.id}).join()").split(','); eq(new Set(ids).size, ids.length, role + ': tile ids are unique');
    }
    /* R11.1: a tile without access is not shown */
    const before = ev("roleHomeTiles('finance').map(function(t){return t.id})");
    const after = ev("(function(){ var p = ROLE_PERMS.finance; ROLE_PERMS.finance = p.filter(function(x){ return x !== 'costs:read'; }); var ids = roleHomeTiles('finance').map(function(t){return t.id}); ROLE_PERMS.finance = p; return ids; })()");
    assert(after.length < before.length, 'finance without costs:read loses a tile: ' + before + ' -> ' + after);
    eq(ev("roleHomeTiles('finance').length"), before.length, 'the right is restored');
  });

  for (const lang of LANGS) await group('[' + lang + '] homeRoute() leads to the role start page: tiles, links, full dashboard', lang, async (g, ev) => {
    for (const role of I7_ROLES) {
      ev("ACT.setRole({ v: '" + role + "' }); S.route = homeRoute(); S.drawer = null; render();");
      const home = ev("(function(){ var h = document.querySelector('[data-role-home]'); if (!h) return null; return { role: h.getAttribute('data-role-home'), tiles: h.querySelectorAll('[data-home-tile]').length, want: roleHomeTiles(S.role).length, full: !!h.querySelector('[data-home-full]'), main: !!document.querySelector('main') && document.querySelector('main').contains(h) }; })()");
      assert(home, role + ': the start page (' + ev("S.route") + ') shows the role home block');
      eq(home.role, role, role + ': the block belongs to the role'); eq(home.tiles, home.want, role + ': all visible tiles are drawn'); assert(home.main, role + ': the block is in the main region');
      assert(home.tiles >= 4 && home.tiles <= 6, role + ': 4–6 tiles on the page, got ' + home.tiles);
      if (ev("canSee('dashboard')")) { assert(home.full, role + ': there is a link to the full dashboard'); }
    }
    ev("ACT.setRole({ v: 'admin' }); go('dashboard'); render();");
    /* the full dashboard stays under the tiles for the roles that have it */
    eq(ev("!!document.querySelector('[data-ov-kpis]')"), true, 'admin: the full dashboard (KPI row) is still on the page');
    /* a tile is a real control: it carries the screen it opens */
    eq(ev("(function(){ var t = document.querySelector('[data-home-tile]'); return !!(t && (t.getAttribute('data-act') === 'ovGo' || t.getAttribute('data-act') === 'go') && (t.dataset.s || t.dataset.v)); })()"), true, 'tile is a button with the target screen');
    ev("document.querySelector('[data-home-tile][data-s=\"dispatch\"]').click()");
    eq(ev("S.route"), 'dispatch', 'a click on the dispatch tile opens Dispatch');
  });

  for (const lang of LANGS) await group('[' + lang + '] SCENARIOS: four presets, applyScenario(id) resets trips, weather, alarms, hubs and finance consistently', lang, async (g, ev) => {
    eq(ev("typeof SCENARIOS + typeof applyScenario"), 'objectfunction', 'SCENARIOS and applyScenario are global');
    eq(ev("Object.keys(SCENARIOS).join()"), 'normal,storm,peak,west', 'four presets in the order of the brief');
    eq(ev("Object.keys(SCENARIOS).every(function(k){ var s = SCENARIOS[k]; return s.id === k && typeof s.name === 'string' && s.name.length > 2 && typeof s.sub === 'string' && s.sub.length > 2; })"), true, 'every preset has an id, a name and a hint in the page language');
    ev(I7_FRESH);
    const base = ev(I7_DEFAULT);
    const m0 = ev("({ loads: S.loads.length, alarms: S.alarms.filter(function(a){return a.status!=='closed'}).length, clos: S.closures.filter(function(c){return !c.lifted}).length, costs: S.costs.reduce(function(s,c){return s+c.amount},0), used: Object.keys(S.hubs).reduce(function(s,h){ return s + Object.keys(S.hubs[h].places).reduce(function(q,z){ return q + S.hubs[h].places[z][1]; },0); },0), free: S.trucks.filter(function(t){return t.status==='available'}).length, fdrv: S.drivers.filter(function(d){return d.status==='available'}).length, jobs: S.jobs.length, atyLoads: S.loads.filter(function(l){return l.from==='ATY'||l.to==='ATY'}).length, io: S.hubs.AST.io[0], iosum: Object.keys(S.hubs).reduce(function(s,h){ return s + S.hubs[h].io[0] + S.hubs[h].io[1]; },0) })");
    const snap = id => ev("(function(){ applyScenario('" + id + "'); return { p: " + I7_LIVE + ", h: " + I7_HASH + ", scen: S.ops.scen, storm: S.ops.storm, loads: S.loads.length, alarms: S.alarms.filter(function(a){return a.status!=='closed'}).length, ids: S.alarms.map(function(a){return a.id}), clos: S.closures.filter(function(c){return !c.lifted}).length, costs: S.costs.reduce(function(s,c){return s+c.amount},0), used: Object.keys(S.hubs).reduce(function(s,h){ return s + Object.keys(S.hubs[h].places).reduce(function(q,z){ return q + S.hubs[h].places[z][1]; },0); },0), restr: Object.keys(S.hubs).filter(function(h){ return S.hubs[h].maint || S.hubs[h].blocked.length; }).length, free: S.trucks.filter(function(t){return t.status==='available'}).length, fdrv: S.drivers.filter(function(d){return d.status==='available'}).length, jobs: S.jobs.length, atyLoads: S.loads.filter(function(l){return l.from==='ATY'||l.to==='ATY'}).length, io: S.hubs.AST.io[0], iosum: Object.keys(S.hubs).reduce(function(s,h){ return s + S.hubs[h].io[0] + S.hubs[h].io[1]; },0), delayed: S.loads.filter(function(l){ return l.notes.some(function(n){ return n.scen === '" + id + "'; }); }).length, wxKar: wxFor('KAR')[0].risk, wxAty: wxFor('ATY')[0].risk, wxAla: wxFor('ALA')[0].risk, }; })()");
    const normal = snap('normal'); eq(normal.p, base, 'normal day = the default state (same data)');
    const storm = snap('storm'), peak = snap('peak'), west = snap('west');
    const hs = [normal.p, storm.p, peak.p, west.p]; eq(new Set(hs).size, 4, 'the four presets give four different data sets');
    /* Winter storm: the storm switch, north-west weather, closures, temperature alarms, hubs under restriction, finance */
    eq(storm.scen.storm, true, 'storm: S.ops.scen.storm is on'); assert(storm.storm.includes('KAR') || storm.storm.includes('AST'), 'storm: north hubs are in S.ops.storm: ' + storm.storm);
    assert(storm.wxKar >= 2, 'storm: weather risk at KAR is raised'); assert(storm.clos > m0.clos, 'storm: more road closures'); assert(storm.alarms > m0.alarms, 'storm: more open alarms');
    assert(storm.restr > 0, 'storm: some hubs are restricted'); assert(storm.costs > m0.costs, 'storm: finance carries the storm costs');
    eq(storm.loads, m0.loads, 'storm: the same trips, delayed'); assert(storm.delayed > 0, 'storm: delays are written to the trips'); assert(west.delayed > 0, 'west: the delay of the west trip is written');
    /* Peak season: peak switch, more orders, hubs fuller, deficit of trucks and drivers, ramp queue */
    eq(peak.scen.peak, true, 'peak: S.ops.scen.peak is on'); assert(peak.loads >= m0.loads + 8, 'peak: many more trips'); assert(peak.iosum >= m0.iosum * 2 && peak.iosum <= m0.iosum * 3.2, 'peak: hub traffic x2–3 (' + m0.iosum + ' -> ' + peak.iosum + ')'); assert(peak.used > m0.used * 1.2, 'peak: the hub stores fill up (' + m0.used + ' -> ' + peak.used + ')');
    assert(peak.free <= 1 && peak.fdrv <= 1, 'peak: deficit of trucks and drivers (' + peak.free + ' / ' + peak.fdrv + ')'); assert(peak.jobs > m0.jobs, 'peak: queue of inbound jobs at the ramps'); eq(peak.scen.storm, false, 'peak: no storm');
    /* West route: west trips, West weather and alarms, other regions calm */
    eq(west.scen.west, true, 'west: S.ops.scen.west is on'); assert(west.atyLoads > m0.atyLoads, 'west: more trips to and from the west'); assert(west.wxAty >= 2, 'west: weather risk at ATY'); eq(west.wxKar, normal.wxKar, 'west: the north keeps its weather'); eq(west.wxAla, normal.wxAla, 'west: the south keeps its weather');
    assert(west.alarms > m0.alarms, 'west: west alarms'); eq(west.io, m0.io, 'west: other hubs are calm (AST traffic unchanged)'); assert(west.costs > m0.costs, 'west: finance carries the west costs');
    eq(ev("S.closures.filter(function(c){return !c.lifted}).every(function(c){ return c.hub === 'ATY'; })"), true, 'west: the only open closures are on the west corridors');
    /* consistency: unique alarm ids, every alarm points to an existing trip, hub and truck */
    for (const s of [storm, peak, west]) eq(new Set(s.ids).size, s.ids.length, 'alarm ids are unique');
    eq(ev("(function(){ var ids = {}; S.loads.forEach(function(l){ ids[l.id] = 1; }); return S.alarms.every(function(a){ return (!a.load || ids[a.load]) && HUBS[a.hub]; }); })()"), true, 'alarms refer to existing trips and hubs');
    /* repeatable (seed): the same preset twice gives the same data, also through another preset in between */
    for (const id of ['storm', 'peak', 'west']) { const a = snap(id).p; snap('normal'); eq(snap(id).p, a, id + ': the same data after a repeat'); }
    eq(snap('normal').p, base, 'normal day again = default');
    /* the pages draw in every preset */
    for (const id of ['storm', 'peak', 'west']) { ev("applyScenario('" + id + "'); go('dashboard'); render();"); eq(ev("!!document.querySelector('[data-ov-kpis]') && !!document.querySelector('[data-role-home]')"), true, id + ': the dashboard draws'); }
    ev("applyScenario('normal')");
  });

  for (const lang of LANGS) await group('[' + lang + '] a scenario reset closes the drawer, returns to the role start page and keeps the R08 preferences', lang, async (g, ev) => {
    ev("window.__mem = {}; PREFS.attach({ getItem: function(k){ return k in window.__mem ? window.__mem[k] : null; }, setItem: function(k, v){ window.__mem[k] = String(v); }, removeItem: function(k){ delete window.__mem[k]; } }); PREFS.set('lang', 'de'); PREFS.set('design', 'kokzhol');");
    for (const role of ['dispatcher', 'driver', 'customer']) {
      ev("ACT.setRole({ v: '" + role + "' }); S.route = 'help'; S.hub = 'ALA'; S.drawer = { type: 'load', id: S.loads[0].id, tab: 'overview' }; render();");
      ev("applyScenario('storm')");
      eq(ev("S.drawer"), null, role + ': the drawer is closed'); eq(ev("S.route === homeRoute()"), true, role + ': back on the role start page (' + ev("S.route") + ')'); eq(ev("S.hub"), '', role + ': the hub filter is cleared');
      eq(ev("S.role"), role, role + ': the role stays');
    }
    eq(ev("PREFS.get('lang')"), 'de', 'the saved language stays'); eq(ev("PREFS.get('design')"), 'kokzhol', 'the saved theme stays');
    eq(ev("PREFS.get('scen')"), 'storm', 'the chosen preset is remembered for the next start');
    ev("applyScenario('normal')"); eq(ev("PREFS.get('scen')"), 'normal', 'normal day is remembered too');
    /* demoReset() without an id repeats the current preset */
    ev("applyScenario('peak'); S.loads.pop();"); const n = ev("S.loads.length"); ev("demoReset()"); assert(ev("S.loads.length") > n, 'demoReset() restores the current preset (peak trips are back)');
    ev("applyScenario('normal'); PREFS.attach(null); ACT.setRole({ v: 'admin' });");
    /* the demo card of the account page offers the presets; the reset button applies the chosen one */
    ev("go('account'); render();"); eq(ev("document.querySelectorAll('#scenSel option').length"), 4, 'the account page lists the four presets');
    ev("var s = document.querySelector('#scenSel'); s.value = 'west'; s.dispatchEvent(new Event('change', { bubbles: true }));"); eq(ev("document.querySelector('#scenSel').value"), 'west', 'the choice is kept on the page');
    ev("ACT.resetGo()"); eq(ev("S.ops.scen.west"), true, 'the reset button applied the chosen preset'); ev("applyScenario('normal')");
    eq(ev("(function(){ try { applyScenario('nope'); return 'no error'; } catch (e) { return 'throws'; } })()"), 'throws', 'an unknown preset id is refused');
    eq(ev("S.ops.scen.storm || S.ops.scen.peak || S.ops.scen.west"), false, 'the refused id changed nothing');
  });
