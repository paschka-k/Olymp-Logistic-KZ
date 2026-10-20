  /* ---- R1 · Mirror 0.3.9 operations: shell, dashboard, dispatcher board, inbox, tasks (docs/MIRROR-0.3.9-ops.md S*, O5, D2, D3, I*, K1, Y2) ---- */
  await group('R1 shell: alarm button counts level ≥ 2 only; search shows goods and "article · LOT · qty → consignee · where", total count, up to 12 rows', 'en', async (g, ev, w) => {
    eq(ev('activeAlarms()'), ev("S.alarms.filter(a => a.status !== 'closed' && a.lvl >= 2).length"), 'level ≥ 2'); assert(ev("S.alarms.some(a => a.lvl < 2 && a.status !== 'closed')"), 'seed has a level-1 alarm that is not counted');
    ev("S.gs.q = 'L26'; render()"); const d = w.document, tot = +d.querySelector('[data-gs-total]').dataset.gsTotal; assert(tot > 12, 'many LOT hits: ' + tot); assert(d.querySelectorAll('.gs-row [data-gs-where]').length <= 12, 'at most 12 rows');
    assert(/Found in current shipments: \d+/.test(d.querySelector('[data-gs-total]').textContent), 'header'); const wh = d.querySelector('[data-gs-where]').textContent; assert(/LOT L\d+/.test(wh) && / → /.test(wh), 'where line: ' + wh); assert(d.querySelector('[data-gs-goods]'), 'goods line');
    ev("S.gs.q = 'zzqqxx'; render()"); assert(/Nothing found in current shipments/.test(d.querySelector('[data-gs-none]').textContent), 'empty text'); ev("S.gs.q = ''; render()"); clean(w, 'search');
  });
  await group('R1 shell: deep links ?veh= ?city= ?item= ?alarm= ?order= (0.3.9 SEL_PARAM, /r/:type/:id)', 'en', async () => {
    const f = async q => { const fr = document.createElement('iframe'); fr.style.cssText = 'width:1316px;height:760px'; fr.src = 'en.html?' + q; document.getElementById('frames').appendChild(fr); await new Promise(ok => { fr.onload = ok; }); await new Promise(r => setTimeout(r, 100)); return fr; };
    let fr = await f('veh=t3'); eq(fr.contentWindow.eval('S.route + "/" + S.tab.routes'), 'routes/temp', '?veh='); fr.remove();
    fr = await f('veh=t3&t=sec'); eq(fr.contentWindow.eval('S.tab.routes'), 'sec', '?veh=&t=sec'); fr.remove();
    fr = await f('city=KAR'); eq(fr.contentWindow.eval('S.route + "/" + S.tab.routes + "/" + S.wx.sel'), 'routes/wx/KAR', '?city='); fr.remove();
    fr = await f('alarm=ALM-101'); eq(fr.contentWindow.eval('S.drawer && S.drawer.type + ":" + S.drawer.id'), 'alarm:ALM-101', '?alarm='); fr.remove();
    fr = await f('order=O-26-0103'); eq(fr.contentWindow.eval('S.route + "/" + S.tab.orders + "/" + S.ops.orq'), 'orders/rec/O-26-0103', '?order='); fr.remove();
    fr = await f('order=O-99-9999'); assert(/not found/.test(fr.contentWindow.eval('S.toast && S.toast.msg')), 'unknown order → not found'); fr.remove();
    const sscc = (await (async () => { const g2 = await fresh('en'); const v = g2.ev("ops(S.loads.find(l => l.status === 'in_transit')).orders[0].places[0].sscc"); g2.done(); return v; })());
    fr = await f('item=' + sscc); eq(fr.contentWindow.eval('S.route + "/" + S.tab.orders'), 'orders/ship', '?item= opens Shipments'); eq(fr.contentWindow.eval('S.ops.shipSel'), sscc, 'package selected'); fr.remove();
  });
  await group('R1 login: first sign-in without 2FA → enrolment (QR, manual key, code); forced change asks the current password', 'en', async (g, ev, w) => {
    ev("ACT.signOut(); S.auth.role = 'viewer'; S.auth.pw = 'demo-pass'"); ev('ACT.authPw()'); const d = w.document; assert(d.querySelector('[data-login-step=enrol]'), 'enrolment step'); assert(d.querySelector('[data-enrol-qr] svg') && /^[A-Z2-7]{4}( [A-Z2-7]{4}){3}$/.test(d.querySelector('[data-enrol-key]').textContent), 'QR + key');
    ev("S.auth.code = '111111'; ACT.authMfa()"); assert(d.querySelector('[data-login-step=enrol] .login-err'), 'wrong code refused'); ev("S.auth.code = '123456'; ACT.authMfa()"); assert(d.querySelector('[data-login-step=recovery]'), 'recovery codes');
    ev('ACT.authCodes()'); assert(d.querySelector('#au_cur'), 'current password field'); ev("S.auth.np = S.auth.np2 = 'correct horse battery'; ACT.authChange()"); assert(/current password/i.test(d.querySelector('.login-err').textContent), 'current password required');
    ev("S.auth.cur = 'wrong'; ACT.authChange()"); assert(/wrong/i.test(d.querySelector('.login-err').textContent), 'current password checked'); ev("S.auth.cur = 'demo-pass'; ACT.authChange()"); assert(!d.querySelector('.login-layer'), 'signed in'); eq(ev('S.role'), 'viewer');
    ev("ACT.signOut(); S.auth.role = 'viewer'; S.auth.pw = 'x'; ACT.authPw()"); assert(d.querySelector('[data-login-step=mfa]'), 'second sign-in: enrolled → code only'); clean(w, 'login');
  });
  await group('R1 shell: sidebar "Alarm simulation" (5 sims with vehicle, Stop ·, toast to the Dashboard playbook, alarms:write)', 'en', async (g, ev, w) => {
    const d = w.document; eq(d.querySelectorAll('[data-side-sim] [data-sim-k]').length, 5, 'five sims'); d.querySelector('[data-sim-k=freeze]').click(); assert(ev("simActive().some(x => x.kind === 'freeze')"), 'freeze running');
    assert(/Dashboard/.test(ev('S.toast.msg')), 'toast points to the Dashboard'); assert(/Stop · /.test(d.querySelector('[data-sim-k=freeze]').textContent), 'Stop ·'); assert(ev("S.audit.some(a => /Simulation/.test(JSON.stringify(a)))"), 'audited');
    ev("go('dashboard')"); assert(w.document.querySelector('.ov-pb'), 'playbook card on the Dashboard'); w.document.querySelector('[data-sim-k=freeze]').click(); assert(!ev("simActive().some(x => x.kind === 'freeze')"), 'stopped');
    ev("ACT.setRole({v:'viewer'})"); const n = ev('simActive().length'); ev("ACT.sideSim({k:'fire'})"); eq(ev('simActive().length'), n, 'viewer cannot start'); clean(w, 'sidebar sims');
  });
  await group('R1 dispatcher: menu badge = express awaiting my signature; card issue tag Road / Weather / Load; unassigned orders "To trip"', 'en', async (g, ev, w) => {
    const mine = ev('exAwaitingMine()'); assert(mine > 0, 'admin has slots to sign'); eq(String(ev('NAV_BADGE.dispatch()')), String(mine), 'badge');
    ev("ACT.setRole({v:'viewer'})"); eq(ev('exAwaitingMine()'), 0, 'viewer signs nothing'); ev("ACT.setRole({v:'admin'})");
    ev("inboxAdd({kind:'road_closure', via:'connector', src:'KazAvtoZhol', lvl:3, cc:'KAR', ccTo:'AST', road:'M-36', title:'Closure test M-36'})"); ev("go('dispatch')"); const d = w.document;
    const tag = d.querySelector('.kcard[data-id="LD-2026-001847"] [data-issue]'); assert(tag && tag.dataset.issue === '3' && /Road: M-36/.test(tag.textContent), 'road tag on the Astana–Almaty trip: ' + (tag && tag.textContent));
    assert([...d.querySelectorAll('[data-issue]')].every(e => +e.dataset.issue >= 2), 'only level ≥ 2');
    const rows = d.querySelectorAll('[data-open-order]').length; assert(rows > 0, 'unassigned orders'); const b = d.querySelector('[data-act=ooTrip]'); assert(b, 'To trip button'); const oid = b.dataset.id, lid = b.dataset.l; b.click();
    assert(ev(`ops(load('${lid}')).orders.some(o => o.id === '${oid}')`), 'order joined the trip'); eq(w.document.querySelectorAll('[data-open-order]').length, rows - 1, 'row gone');
    ev("S.orders.filter(o => o.status === 'new' && !o.load).forEach(o => o.status = 'planned'); render()"); assert(/All orders assigned/.test(w.document.querySelector('[data-open-empty]').textContent), 'empty state'); clean(w, 'board');
  });
  await group('R1 inbox: 0.3.9 KPIs, Done on new messages, kind-specific form, effects (road risk, fine, workshop, document, incident), error line "inbox only", demo messages', 'en', async (g, ev, w) => {
    ev("go('dashboard'); S.tab.dashboard = 'inbox'; render()"); const d = w.document; const k = d.querySelector('[data-inbox-kpis]').textContent;
    assert(/Acknowledged · in progress/.test(k) && /Roads and weather · active/.test(k) && /Critical · open/.test(k), 'KPI set'); const nNew = d.querySelectorAll('[data-act=inDone]').length; assert(nNew >= ev("S.inbox.filter(m => m.st !== 'done').length") - 1, 'Done also on new messages');
    ev('ACT.inNew()'); eq(w.document.querySelector('[data-inbox-form]').dataset.inboxForm, 'road_closure'); assert(w.document.querySelector('#inf_city') && w.document.querySelector('#inf_until'), 'road fields');
    ev("S.inF = Object.assign(S.inF, {city:'', title:'Closure without city'})"); ev('ACT.inSave()'); assert(/city/i.test(ev('S.inF.err')), 'city required');
    const sel = w.document.querySelector('#in_kind'); sel.value = 'traffic_fine'; sel.dispatchEvent(new w.Event('change', { bubbles: true })); assert(w.document.querySelector('#inf_veh') && w.document.querySelector('#inf_off'), 'fine fields');
    eq(ev("INBOX_SRC.traffic_fine.join(',')"), 'SMS 1414,Kaspi,eGov,Sergek,Police', 'fixed sources');
    const f0 = ev('S.eco.fines.length'); ev("Object.assign(S.inF, {veh: S.loads.find(l => l.status === 'in_transit').truck, off: 'sp40', amount: '29500', title: 'Fine 20 MCI speeding'})"); ev('ACT.inSave()'); eq(ev('S.eco.fines.length'), f0 + 1, 'fine in Reports → Fines'); assert(ev('S.eco.fines[0].drv'), 'attributed to the driver of the trip');
    const m1 = ev("inboxAdd(inboxForm({kind:'workshop_status', src:'Phone', ptn: RES.PARTNERS_SVC[0], veh:'t1', wst:'onsite', title:'Workshop on site'}))"); eq(m1.err, ev('INBOX_ERR.noreq'), 'no open request → error');
    const m2 = ev("inboxAdd(inboxForm({kind:'workshop_status', src:'Phone', ptn: RES.PARTNERS_SVC[0], veh:'t7', wst:'onsite', title:'Workshop on site'}))"); assert(!m2.err && ev("S.res.svc.find(s => s.truck === 't7' && s.status !== 'done').status") === 'in_work', 'service request updated');
    const h0 = ev("ops(load('LD-2026-001851')).inbox.length"); ev("inboxAdd(inboxForm({kind:'doc_status', src:'IS ESF', trip:'LD-2026-001851', doc:'snt', dst:'rejected', title:'SNT rejected by KGD'}))"); eq(ev("ops(load('LD-2026-001851')).inbox.length"), h0 + 1, 'hint on Documents KZ');
    const i0 = ev('S.inc.length'); ev("inboxAdd(inboxForm({kind:'security_event', src:'Phone', veh:'t5', atype:'seal', title:'Seal broken at parking'}))"); eq(ev('S.inc.length'), i0 + 1, 'Security incident (FR-136)'); eq(ev('S.inc[0].lvl'), 3);
    ev("inboxAdd(inboxForm({kind:'road_closure', src:'Police', city:'KAR', cto:'', title:'Karaganda ring closed', lvl:3}))"); assert(ev("S.loads.filter(isActive).some(l => (roadRisk(l) || {}).lvl === 3)"), 'road risk raised on the route');
    ev('ACT.inDemo()'); const e = ev("S.inbox.find(m => m.err)"); assert(e && e.err === ev('INBOX_ERR.veh'), 'demo: unknown tracker → error'); ev('render()'); assert(w.document.querySelector('[data-in-err]') && w.document.querySelector('[data-in-only]'), 'error line + inbox only'); assert(w.document.querySelector('[data-in-meta]'), 'meta line');
    ev("ACT.setRole({v:'dispatcher'}); go('dashboard'); S.tab.dashboard = 'inbox'; render()"); assert(!w.document.querySelector('[data-act=inDemo]'), 'demo button needs integrations:admin'); clean(w, 'inbox');
  });
  await group('R1 dashboard: compact inbox "All messages (N)" counts open messages', 'en', async (g, ev, w) => {
    ev("S.inbox[0].st = 'done'; go('dashboard')"); const t = w.document.querySelector('[data-act=ovTab][data-v=inbox]').textContent, n = ev("S.inbox.filter(m => m.st !== 'done').length"); assert(t.includes('(' + n + ')'), t + ' vs ' + n);
  });
  await group('R1 tasks: Mine / All, assignee, CRM #lead, done checkbox, crm:write, empty state', 'en', async (g, ev, w) => {
    ev("go('orders'); S.tab.orders = 'commercial'; ACT.cmSec({v:'tasks'})"); const d = w.document; assert(d.querySelector('[data-task-seg] .pill-tab.active').dataset.v === '0', 'Mine by default'); eq(d.querySelectorAll('[data-task]').length, ev("S.tasks.filter(t => t.who === taskMe()).length"));
    assert(/CRM #L-101/.test(d.querySelector('[data-task=T-1]').textContent), 'CRM link'); d.querySelector('[data-task=T-2] input[type=checkbox]').click(); assert(ev("S.tasks.find(t => t.id === 'T-2').done"), 'done checkbox');
    ev("ACT.cmTkSeg({v:'1'})"); eq(w.document.querySelectorAll('[data-task]').length, ev('S.tasks.length'), 'All');
    ev("ACT.cmTkSeg({v:'0'}); ACT.setRole({v:'viewer'}); go('orders'); S.tab.orders = 'commercial'; render()"); if (ev("tabsOf('orders').some(t => t.key === 'commercial')")) { ev("ACT.cmSec({v:'tasks'})"); assert(!w.document.querySelector('[data-act=cmTaskAdd]'), 'no form without crm:write'); assert(w.document.querySelector('[data-task-empty]'), 'empty state for the viewer'); } clean(w, 'tasks');
  });
  await group('R1 shell / dashboard / board / inbox / tasks render in 4 languages, DE / EN without Cyrillic in the new blocks', 'ru', async () => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { const d = gg.w.document;
      gg.ev("go('dispatch')"); clean(gg.w, lang + ' board'); gg.ev("go('dashboard'); S.tab.dashboard = 'inbox'; render(); ACT.inDemo(); ACT.inNew()"); clean(gg.w, lang + ' inbox');
      gg.ev("S.gs.q = 'L26'; render()"); const sb = d.querySelector('.gs-list').innerText; gg.ev("S.gs.q = ''; go('orders'); S.tab.orders = 'commercial'; ACT.cmSec({v:'tasks'})"); clean(gg.w, lang + ' tasks');
      const txt = [...d.querySelectorAll('[data-side-sim], [data-sec=open-orders], [data-inbox-kpis], [data-in-meta], [data-in-err], [data-in-only], [data-issue], [data-task-seg]')].map(e => e.innerText).join(' ');
      gg.ev("go('dispatch')"); const txt2 = [...d.querySelectorAll('[data-sec=open-orders], [data-issue]')].map(e => e.innerText).join(' ');
      gg.ev("ACT.signOut(); S.auth.role = 'auditor'; S.auth.pw = 'x'; ACT.authPw()"); const lg = d.querySelector('.login-layer').innerText;
      if (lang === 'de' || lang === 'en') assert(!/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(txt + txt2 + lg + sb), lang + ' Cyrillic in the R1 blocks'); } finally { gg.done(); } }
  });
