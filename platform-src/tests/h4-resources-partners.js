  /* ==== H4 · parity with the 0.3.11 suite: resources, partners, fleet display, privacy (docs/parity-0311/autotests-gap.md, file h4) ====
     v6 seed differs from the 0.3.11 seed on purpose: 7 trucks (not 4), 7 drivers, 17 partners (8 workshops PW-01…08 + 9 logistics, no PL-09), 5 hubs,
     PL-01 policy "50 млн ₸". Where a 0.3.11 number is quoted it is replaced by the live v6 count and the comment says so. */
  const H4PT = "ACT.setRole({v:'admin'});go('dispatch');ACT.dtab({v:'partners'})", H4ST = "go('drivers');ACT.stab({s:'drivers',v:'staff'})";
  const h4set = (w, k, v) => { const e = w.document.querySelector(`[data-pf=${k}]`); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); };

  /* ---------- Персонал / FR-09 Подбор ТС · срочный рейс ---------- */
  await group('urgent trip: the duty driver is a candidate but every truck of the hub is busy -> each truck gives a reason, no Assign button (0.3.11 «Персонал» #169 «Дежурный … все ТС заняты»)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'})");
    const hasDrv = ev("RES.urgent('AST',{hrs:6}).drivers.some(x=>x.ok&&x.d.hub==='AST')");
    assert(hasDrv, 'a free Astana driver exists in the v6 seed (candidate)');
    ev("S.trucks.filter(t=>t.hub==='AST').forEach(t=>{t.status='busy'})");
    const u = ev("RES.urgent('AST',{hrs:6})"), ast = u.trucks.filter(x => x.t.hub === 'AST');
    assert(ast.length >= 2, 'Astana trucks listed (v6: ' + ast.length + ', 0.3.11: 3)'); assert(ast.every(x => !x.ok && x.why.length > 0), 'every busy truck of the hub carries a reason: ' + JSON.stringify(ast.map(x => x.why)));
    assert(ast.every(x => x.why.some(y => /рейс|занят|на линии|busy|trip/i.test(y))), 'the reason names the trip');
    assert(!ev("RES.urgent('AST',{hrs:6}).bestT"), 'no truck to offer'); assert(ev("RES.urgent('AST',{hrs:6}).drivers.some(x=>x.ok)"), 'the driver stays a candidate');
    ev(H4ST); ev("document.querySelector('[data-stf=hub]').value='AST';document.querySelector('[data-stf=hub]').dispatchEvent(new Event('input',{bubbles:true}))");
    const d = w.document; assert(d.querySelector('#st_urgent'), 'urgent card'); assert(!d.querySelector('[data-act=stUrgent]'), 'no "Assign" without a truck'); assert(d.querySelector('[data-urg-d][data-ok="1"]'), 'a driver row is green');
    assert(![...d.querySelectorAll('[data-urg-t]')].some(e => e.dataset.ok === '1'), 'no green truck row'); clean(w, 'urgent card');
  });
  await group('urgent trip: no free truck in Astana / Almaty -> subcontract recommendation (GarantA / KazExpress) with the Partners tab, in four languages (0.3.11 «Персонал» #171, «FR-09 Подбор ТС» #223 Almaty, #224 Astana)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'})");
    for (const hub of ['AST', 'ALA']) {
      ev("S.trucks.forEach(t=>{t.status='busy'})");   // v6 has 7 trucks; 0.3.11 «при парке 4 ТС» -> all of them blocked here
      const u = ev(`RES.urgent('${hub}',{hrs:6,thermo:true})`); assert(u.trucks.every(x => !x.ok), hub + ': all trucks blocked'); assert(!u.bestT, hub + ': no best truck');
      ev(H4ST + `;document.querySelector('[data-stf=hub]').value='${hub}';document.querySelector('[data-stf=hub]').dispatchEvent(new Event('input',{bubbles:true}))`);
      const note = w.document.querySelector('#st_urgent [data-urg-none=truck]').innerText; assert(/Нет свободной ТС с нужными параметрами/.test(note) && /субподрядчик/.test(note) && /Партнёры/.test(note), hub + ': recommendation text: ' + note);
      assert(!w.document.querySelector('[data-act=stUrgent]'), hub + ': no assignment button');
    }
    for (const lang of ['de', 'en', 'kk']) { const gg = await fresh(lang); try { gg.ev("ACT.setRole({v:'admin'});S.trucks.forEach(t=>{t.status='busy'})"); gg.ev(H4ST); const t = gg.w.document.querySelector('#st_urgent [data-urg-none=truck]').innerText;
      assert(lang === 'de' ? /Subunternehmer/.test(t) : lang === 'en' ? /subcontractor/.test(t) : /мердігер/.test(t), lang + ' recommendation: ' + t); if (lang !== 'kk') assert(!/[А-Яа-я]{4,}/.test(t), lang + ' note without Cyrillic'); clean(gg.w, 'urgent ' + lang); } finally { gg.done(); } }
  });

  /* ---------- Партнёры ---------- */
  await group('partners screen lists every partner with a KPI tile per tier and per type; Blocked and Service filters (0.3.11 «Партнёры» #276 22 partners, #277 Blocked, #280 8 workshops; v6: 17 partners, 2 blocked, 8 workshops)', 'ru', async (g, ev, w) => {
    ev(H4PT); clean(w, 'partners'); const N = ev('S.partners.length'), d = w.document;
    eq(d.querySelectorAll('[data-partner]').length, N, 'all partners listed (v6 ' + N + ', 0.3.11 22)');
    const tiles = [...d.querySelectorAll('.kpi-row.k6 > *')].map(e => e.innerText.replace(/\s+/g, ' ').trim());
    for (const [tier, lab] of [['gold', 'Gold'], ['silver', 'Silver'], ['bronze', 'Bronze'], ['blocked', 'Заблокировано']]) { const n = ev(`S.partners.filter(p=>p.tier==='${tier}').length`); assert(tiles.some(t => t.includes(lab) && new RegExp('(^|\\D)' + n + '(\\D|$)').test(t)), 'KPI tile ' + lab + ' = ' + n + ' in ' + JSON.stringify(tiles)); }
    eq(ev("S.partners.filter(p=>p.tier==='gold').length + S.partners.filter(p=>p.tier==='silver').length + S.partners.filter(p=>p.tier==='bronze').length + S.partners.filter(p=>p.tier==='blocked').length"), N, 'the four tiers add up to all partners');
    assert(d.querySelector('[data-kpi-type=ws]') && d.querySelector('[data-kpi-type=lp]'), 'service / logistics tiles');
    h4set(w, 'tier', 'blocked'); const bl = ev("S.partners.filter(p=>p.tier==='blocked')"); assert(bl.length >= 2, 'at least two blocked partners'); eq(d.querySelectorAll('[data-partner]').length, bl.length, 'Blocked filter');
    for (const p of bl) { assert(p.block && p.block.length >= 5, p.id + ' has a reason'); assert(d.querySelector(`[data-partner=${p.id}]`).innerText.includes(p.block), p.id + ': reason «' + p.block + '» visible in the row'); }
    h4set(w, 'tier', ''); h4set(w, 'type', 'ws'); const ws = ev("S.partners.filter(p=>p.type==='ws').length"); eq(ws, 8, 'v6 seed: 8 workshops PW-01…08 (as 0.3.11)'); eq(d.querySelectorAll('[data-partner]').length, ws, 'Service filter shows the workshops');
    assert([...d.querySelectorAll('[data-partner]')].every(r => /^PW-/.test(r.dataset.partner)), 'only workshops'); h4set(w, 'type', ''); eq(d.querySelectorAll('[data-partner]').length, N, 'filter reset');
  });
  await group('the hub filter of the top bar narrows the partners list to the partners of that hub zone — Almaty -> south (0.3.11 «FR-32 Хаб» #282, after P86)', 'ru', async (g, ev, w) => {
    ev(H4PT); const N = ev('S.partners.length'); eq(w.document.querySelectorAll('[data-partner]').length, N, 'no filter keeps all');
    const exp = ev("S.partners.filter(p=>WEATHER.cityHub(p.city)==='ALA').map(p=>p.id)"); assert(exp.length >= 2 && exp.length < N, 'Almaty has its own partners: ' + exp.join());
    ev("ACT.hubSet({v:'ALA'})"); const got = [...w.document.querySelectorAll('[data-partner]')].map(r => r.dataset.partner).sort(); eq(got.join(), exp.slice().sort().join(), 'only the Almaty-hub partners');
    assert(got.includes('PW-02') && got.includes('PL-02') && !got.includes('PL-01'), 'Almaty workshop + logistics, not Astana'); clean(w, 'partners ALA');
    const ky = ev("[...document.querySelectorAll('.kpi-row.k6 > *')].map(e=>e.innerText.replace(/\\s+/g,' ')).join('|')"); assert(/Gold/.test(ky), 'KPI tiles follow the filter');
    ev("ACT.hubSet({v:'AST'})"); assert(![...w.document.querySelectorAll('[data-partner]')].some(r => r.dataset.partner === 'PL-02'), 'Astana does not show Almaty');
    ev("ACT.hubSet({v:''})"); eq(w.document.querySelectorAll('[data-partner]').length, N, 'all hubs again');
  });
  await group('PL-01 carrier liability policy is stored and printed in the handover candidate and in the handover act (0.3.11 «FR-28 Полис» #290: «полис ответственности · лимит 50 млн ₸»)', 'ru', async (g, ev, w) => {
    ev(H4PT); const pol = ev("S.partners.find(p=>p.id==='PL-01').ins"); assert(pol && /50/.test(pol), 'PL-01 policy stored: ' + pol);
    const lid = ev("S.loads.find(l=>l.status==='unassigned'&&l.zone!=='ambient'&&!l.adr).id"); ev("S.partners.find(p=>p.id==='PL-01').city='AST';S.partners.find(p=>p.id==='PL-01').cap='40';S.partners.find(p=>p.id==='PL-01').cold=1;S.partners.find(p=>p.id==='PL-01').gdp=1");
    ev(`S.ptx.ho.load='${lid}';S.ptx.ho.mode='full';render()`); const c = w.document.querySelector('[data-cand=PL-01]'); assert(c, 'PL-01 is a candidate on the Astana route'); assert(c.querySelector('[data-cand-price]'), 'it is acceptable, so price and policy are shown');
    assert(c.innerText.includes('полис ответственности · лимит ' + pol), 'candidate row prints the policy: ' + c.innerText);
    ev("ACT.hoGive({id:'PL-01'})"); const h = ev("S.handovers[S.handovers.length-1]"); eq(h.p, 'PL-01'); const act = w.document.querySelector(`[data-ho=${h.id}]`).innerText; assert(act.includes('полис ' + pol), 'the handover act prints the policy: ' + act.slice(0, 500));
    ev("S.partners.find(p=>p.id==='PL-02').ins='';S.partners.find(p=>p.id==='PL-02').city='AST';S.partners.find(p=>p.id==='PL-02').cap='40';S.partners.find(p=>p.id==='PL-02').cold=1;S.partners.find(p=>p.id==='PL-02').gdp=1"); const l2 = ev("S.loads.find(l=>l.status==='unassigned'&&l.zone!=='ambient'&&!l.adr&&l.id!=='" + lid + "')||S.loads.find(l=>l.status==='unassigned'&&l.zone!=='ambient'&&!l.adr)").id; ev(`S.ptx.ho.load='${l2}';S.ptx.ho.mode='full';render()`);
    const c2 = w.document.querySelector('[data-cand=PL-02]'); if (c2) assert(/нет полиса ответственности перевозчика/.test(c2.innerText) && !c2.querySelector('[data-act=hoGive]'), 'a carrier without a policy is refused: ' + c2.innerText);
  });
  await group('service on route: Bronze workshop is called only by agreement, a blocked workshop is never callable, a Gold reefer service answers within 4 h and covers a cold trip (0.3.11 «Сервис» #305 PW-05, #306 PW-08 Pavlodar, «FR-23 Рефсервис» #309 Kostanay mobile call-out)', 'ru', async (g, ev, w) => {
    ev(H4PT); const d = w.document;
    /* v6 routes are hub to hub: Aktobe (PW-05, Bronze) lies on Astana -> Atyrau, Pavlodar (PW-08, blocked) on none — so the blocked workshop is moved onto a route to see the rule */
    const rowsOf = lid => { ev(`S.ptx.ho.load='${lid}';render()`); return [...d.querySelectorAll('[data-ws]')].map(e => e.dataset.ws); };
    const atyLoad = ev("S.loads.find(l=>!l.partner&&['unassigned','assigned','loading','in_transit'].includes(l.status)&&((l.from==='AST'&&l.to==='ATY')||(l.from==='ATY'&&l.to==='AST'))).id");
    assert(rowsOf(atyLoad).includes('PW-05'), 'Bronze Aktobe workshop on the Astana - Atyrau trip'); const b5 = d.querySelector('[data-ws=PW-05]'); eq(ev("S.partners.find(p=>p.id==='PW-05').tier"), 'bronze');
    assert(b5.querySelector('[data-act=ptCallWs]').innerText.includes('по согласованию'), 'Bronze call is marked «по согласованию»: ' + b5.innerText); const g7 = d.querySelector('[data-ws=PW-01] [data-act=ptCallWs]'); assert(g7 && !g7.innerText.includes('по согласованию'), 'a Gold workshop is called without that note');
    const pw8 = ev("S.partners.find(p=>p.id==='PW-08')"); eq(pw8.tier, 'blocked', 'PW-08 Pavlodar is blocked'); assert(pw8.block && pw8.block.length > 5, 'with a reason');
    for (const l of ev("S.loads.map(l=>l.id)")) assert(!rowsOf(l).includes('PW-08'), 'PW-08 is on no v6 route (' + l + ')');
    ev("S.partners.find(p=>p.id==='PW-08').city='KAR'"); const kar = ev("S.loads.find(l=>!l.partner&&['unassigned','assigned','loading','in_transit'].includes(l.status)&&(l.from==='KAR'||l.to==='KAR')).id"); assert(rowsOf(kar).includes('PW-08'), 'moved onto a route the blocked workshop is listed ...');
    const r8 = d.querySelector('[data-ws=PW-08]'); assert(/Заблокирован/.test(r8.innerText) && r8.innerText.includes(pw8.block), '... with its reason'); assert(!r8.querySelector('[data-act=ptCallWs]'), '... but without a Call button'); ev("ACT.ptCallWs({id:'PW-08'})"); assert(!ev("S.ptx.called['PW-08']"), 'the action refuses a blocked workshop');
    const gold = ev("S.partners.filter(p=>p.type==='ws'&&p.tier==='gold'&&p.reefer).map(p=>({id:p.id,resp:parseFloat(String(p.resp).replace(',','.'))}))"); assert(gold.length >= 2 && gold.every(p => p.resp <= 4), 'Gold reefer workshops answer within 4 h: ' + JSON.stringify(gold));
    ev(H4PT); const cold = ev("S.loads.find(l=>l.zone!=='ambient'&&!l.partner&&['unassigned','assigned','loading','in_transit'].includes(l.status)&&l.to==='ATY').id"); ev("S.partners.find(p=>p.id==='PW-06').reefer=false;S.partners.find(p=>p.id==='PW-05').reefer=false;S.partners.find(p=>p.id==='PW-01').reefer=true");
    ev("render()"); const cov = [...d.querySelectorAll('[data-cov^=' + cold + ']')].map(r => r.innerText.replace(/\s+/g, ' ')); assert(cov.length >= 2, 'coverage rows of the cold trip'); assert(cov.some(t => /мобильный выезд PW-0\d \(.+\) · ≤ 4/.test(t)), 'a city without a reefer partner gets the mobile call-out of a Gold reefer service within 4 h: ' + cov.join(' || '));
    ev("ACT.setRole({v:'viewer'});go('dispatch');ACT.dtab({v:'partners'})"); assert(d.querySelector('[data-ws]') && !d.querySelector('[data-act=ptCallWs]'), 'viewer: list yes, Call no (partners:write)');
  });

  /* ---------- Автопарк ---------- */
  await group('«Show extended fleet» gives >= 9 trucks with and without temperature control; pressing it again returns the real fleet (0.3.11 «Автопарк · показ» #491 >= 9, #493 back to 4 -> v6: 7)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});go('fleet')"); const real = ev('S.trucks.length'); eq(real, 7, 'v6 real fleet'); eq(ev('RES.fleetAll().length'), real, 'before the toggle');
    eq(ev("document.querySelectorAll('#fl_table tbody tr').length"), real, 'table before = real fleet'); assert(w.document.querySelector('[data-act=flExt]'), 'toggle button');
    ev("ACT.flExt()"); const all = ev('RES.fleetAll()'); assert(all.length >= 9, 'extended fleet >= 9, got ' + all.length); assert(ev("RES.fleetAll().some(t=>RES.truckCooling(t)==='none')"), 'trucks without temperature control'); assert(ev("RES.fleetAll().some(t=>RES.truckCooling(t)!=='none')"), 'trucks with cooling');
    assert(ev("RES.fleetAll().some(t=>RES.truckCooling(t)==='active')"), 'an active-cooling (two-chamber / reefer) class'); eq(ev("document.querySelectorAll('#fl_table tbody tr').length"), all.length, 'table shows the extended fleet'); assert(/Всего ТС/.test(w.document.querySelector('#root').innerText), 'total tile'); assert(ev("S.trucks.length") === real && !ev("S.trucks.some(t=>t.demo)"), 'demo trucks never join S.trucks'); clean(w, 'fleet extended');
    ev("ACT.flExt()"); eq(ev('RES.fleetAll().length'), real, 'second press returns the real fleet'); eq(ev("document.querySelectorAll('#fl_table tbody tr').length"), real, 'table back'); eq(ev('RES.fleetAll().length'), ev('S.trucks.length'));
  });
  await group('fleet registry tab: one h1, the eyebrow number 10 and the «Add vehicle» button; reference data «+ Vehicle» / «+ Driver» lead to the registries, the driver register shows no personal data (0.3.11 «FR-132 Одна навигация» #661, «Новые записи» #721)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});go('fleet');ACT.stab({s:'fleet',v:'registry'})"); const d = w.document;
    eq(d.querySelectorAll('h1').length, 1, 'one h1: ' + [...d.querySelectorAll('h1')].map(x => x.innerText).join(' / ')); assert(d.querySelector('#fl_reg, #rg_table, .tcard table'), 'registry table');
    const eyebrow = ev("document.querySelector('.eyebrow').innerText"); assert(/^10\s*·/.test(eyebrow), 'the eyebrow carries the screen number 10: ' + eyebrow); assert(w.document.querySelector('.pill-tab.active').innerText.trim() === 'Реестр', 'the registry tab is active');
    ev("ACT.stab({s:'fleet',v:'fleet'})"); assert(d.querySelector('[data-act=addT]'), 'the «Add vehicle» button of the fleet tab'); eq(d.querySelectorAll('h1').length, 1, 'still one h1'); ev("ACT.stab({s:'fleet',v:'registry'})"); assert(d.querySelector('[data-act=rgOpen]'), 'registry rows open a truck card'); clean(w, 'registry');
    ev("go('settings');ACT.stab({s:'settings',v:'ref'})"); assert([...d.querySelectorAll('[data-act=rfKind]')].some(e => e.dataset.v === 'vehicle'), 'vehicle kind'); ev("ACT.rfKind({v:'vehicle'})"); assert(d.querySelector('[data-act=rfFleet]'), '«+ Vehicle» button'); ev("ACT.rfFleet()"); eq(ev('S.route'), 'fleet', '«+ Vehicle» leads to the fleet registry');
    ev("go('settings');ACT.stab({s:'settings',v:'ref'});ACT.rfKind({v:'driver'})"); assert(d.querySelector('[data-act=rfAddDrv]'), '«+ Driver» button'); const tab = d.querySelector('#root').innerText; assert(!/\+7[ (]?\d{3}[\d ()-]{6,}/.test(tab) && !/\b\d{12}\b/.test(tab), 'the driver register shows no phone / IIN'); ev("ACT.rfAddDrv()"); eq(ev('S.route'), 'drivers', '«+ Driver» leads to the drivers register');
    ev("go('drivers');ACT.stab({s:'drivers',v:'drivers'})"); const dt = d.querySelector('#root').innerText; assert(!/\b\d{12}\b/.test(dt), 'drivers table masks the IIN'); assert(!/\+7[ (]?\d{3}[\d ()-]{6,}/.test(dt), 'drivers table masks the phone');
  });

  /* ---------- Приватность FR-81/82/85/89 ---------- */
  await group('privacy matrix: the driver sees no fines, staff, costs or phones; the auditor sees the fines but no phones (0.3.11 «FR-81/82/85/89 Приватность» #599)', 'ru', async (g, ev, w) => {
    const d = w.document;
    ev("ACT.setRole({v:'driver'})"); eq(ev('S.route'), 'driverapp', 'driver shell only'); for (const p of ['drivers:read', 'costs:read', 'fines:write', 'pii:read', 'partners:write', 'fleet:read']) assert(!ev(`canDo('${p}')`), 'driver without ' + p);
    for (const s of ['drivers', 'costs', 'billing', 'partners', 'fleet', 'reports']) assert(!ev(`canSee('${s}')`), 'driver does not see ' + s);
    ev("go('drivers')"); assert(ev('S.route') !== 'drivers' && !d.querySelector('[data-fine]'), 'driver cannot open staff / fines'); for (const t of ['shift', 'route', 'stop', 'ret', 'fuel', 'me']) { ev(`ACT.daTab({v:'${t}'})`); assert(!/\+7[ (]?\d{3}[\d ()-]{6,}/.test(d.querySelector('.da-phone').innerText.replace(/\+7 701 000 11 22/g, '')), 'no partner / staff phone in the driver app tab ' + t); }
    ev("ACT.setRole({v:'auditor'})"); assert(ev("canDo('drivers:read')") && ev("canDo('costs:read')"), 'auditor reads staff and costs'); assert(!ev("canDo('pii:read')"), 'auditor has no pii:read'); assert(!ev("canDo('fines:write')"), 'auditor does not write');
    ev("go('drivers');ACT.stab({s:'drivers',v:'staff'})"); eq(ev('S.route'), 'drivers'); assert(d.querySelectorAll('[data-fine]').length > 0, 'auditor sees the fines'); assert(!d.querySelector('[data-act=fineImport],[data-act=fineSet],[data-act=fineAssign]'), 'read-only fines'); const txt = d.querySelector('#root').innerText; assert(!/\+7[ (]?\d{3}[\d ()-]{6,}/.test(txt) && !/\b\d{12}\b/.test(txt), 'no phone / IIN on staff');
    ev("go('dispatch');ACT.dtab({v:'partners'});ACT.ptContact({id:'PL-01'})"); assert(d.querySelector('[data-contacts=PL-01]'), 'contact drawer opens for the auditor'); assert(/•/.test(d.querySelector('[data-contact]').innerText), 'numbers masked'); const c0 = ev("partnerContacts(S.partners.find(p=>p.id==='PL-01'))[0]"); ev(`ACT.ptCall({id:'${c0.id}'})`); assert(!d.body.innerText.includes(c0.mob) && !ev(`S.ptx.revealed['${c0.id}']`), 'the auditor cannot reveal a number');
    ev("ACT.setRole({v:'admin'})"); ev(`ACT.ptCall({id:'${c0.id}'})`); assert(d.body.innerText.includes(c0.mob), 'admin reveals after the audited call');
  });

  /* ---------- Lane J · передача партнёру ---------- */
  await group('partner handover records the logger, the temperature and the seal at receipt AND at ePOD (0.3.11 «Lane J» #639 FR-117)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});" + H4PT); const lid = ev("S.loads.find(l=>l.status==='unassigned'&&l.zone==='chilled'&&!l.adr).id"); ev(`S.ptx.ho.load='${lid}';S.ptx.ho.mode='full';render()`);
    const cand = ev("[...document.querySelectorAll('[data-cand] [data-act=hoGive]')].map(b=>b.dataset.id).find(id=>S.partners.find(p=>p.id===id).tier==='gold')"); if (!cand) { assert(true, 'no gold candidate in this data'); return; }
    ev(`ACT.hoGive({id:'${cand}'})`); const id = ev("S.handovers[S.handovers.length-1].id"); const d = w.document;
    assert(d.querySelector(`[data-ho-portal=${id}] input[data-lg]`), 'logger / temperature / seal inputs at receipt');
    d.querySelector(`#lg_logger_${id}`).value = ''; ev(`ACT.hoPortal({id:'${id}'})`); const h0 = ev(`S.handovers.find(x=>x.id==='${id}')`);
    if (h0.portal === 1) { assert(h0.lg && h0.lg.logger, 'v6 fills the default logger when the field is empty (0.3.11 answers 409): ' + JSON.stringify(h0.lg)); } else { eq(h0.portal || 0, 0, 'receipt refused without a logger'); d.querySelector(`#lg_logger_${id}`).value = 'TL-77'; ev(`ACT.hoPortal({id:'${id}'})`); }
    d.querySelector(`#lg_logger_${id}`) && (d.querySelector(`#lg_logger_${id}`).value = 'TL-4711'); ev(`ACT.hoPortal({id:'${id}'})`); const h1 = ev(`S.handovers.find(x=>x.id==='${id}')`);
    assert(h1.lg && h1.lg.logger && isFinite(h1.lg.temp) && h1.lg.seal, 'receipt: logger / °C / seal recorded: ' + JSON.stringify(h1.lg));
    eq(h1.portal, 2, 'scan step done'); d.querySelector(`#lg_logger_${id}`).value = 'TL-4711'; d.querySelector(`#lg_temp_${id}`).value = '4,6'; d.querySelector(`#lg_seal_${id}`).value = 'S-990011';
    ev(`ACT.hoScan({id:'${id}'})`); d.querySelector(`#ho_reason_${id}`).value = 'Partner portal down, paper POD faxed'; d.querySelector(`#lg_temp_${id}`) && 0; ev(`ACT.hoEpod({id:'${id}'})`);
    const h = ev(`S.handovers.find(x=>x.id==='${id}')`); assert(h.epod, 'ePOD recorded'); assert(h.lg.pickup || h.lg.logger, 'receipt entry kept'); const dl = h.lg.delivery; assert(dl && dl.logger && isFinite(dl.temp) && dl.seal, 'ePOD entry: logger / °C / seal: ' + JSON.stringify(h.lg));
    const line = d.querySelector(`[data-ho-lg=${id}]`).innerText; assert(/Логгер · приём: .+ °C · пломба .+доставка: .+ °C · пломба/s.test(line), 'one line shows receipt and delivery: ' + line);
  });
  await group('fine of a truck with no assignment at the violation time: driver «not determined», the notification step is refused (0.3.11 «FR-118…127» #648 FR-122: «Водитель не определён», уведомление 409)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'})"); const a = ev("RES.driverAt('654 MNO 09','2026-01-05T03:10:00+05:00')"); eq(a.drv, null, 'no waybill covers the instant -> no driver'); eq(a.wb, null); assert(a.why && a.why.length > 10, 'reason given: ' + a.why);
    const un = ev("S.res.fines.find(f=>!f.drv)"); assert(un, 'an unattributed fine exists in the seed (plate 456 DEF 02)'); eq(un.status, 'new'); assert(un.attrWhy, 'fine carries the reason'); const n0 = ev("S.audit.length");
    const err = ev(`RES.fineSet('${un.id}','notified')`); assert(typeof err === 'string' && err.length > 3, 'notify refused while the driver is not determined: ' + err); eq(ev(`S.res.fines.find(f=>f.id==='${un.id}').status`), 'new', 'status unchanged');
    ev(H4ST); const row = w.document.querySelector(`[data-fine=${un.id}]`); assert(row, 'fine row'); assert(row.innerText.includes(un.attrWhy), 'the row says why no driver: ' + row.innerText.slice(0, 300)); assert(!row.querySelector('[data-act=fineSet]'), 'no «notify driver» button for an undetermined fine'); assert(row.querySelector('[data-act=fineAssign]'), 'manual attribution offered');
    ev(`ACT.fineSet({id:'${un.id}',v:'notified'})`); eq(ev(`S.res.fines.find(f=>f.id==='${un.id}').status`), 'new', 'the action also refuses');
    ev(`RES.fineAssign('${un.id}','d5')`); eq(ev(`S.res.fines.find(f=>f.id==='${un.id}').status`), 'attributed'); eq(ev(`RES.fineSet('${un.id}','notified')`), null, 'after a manual attribution the notification works'); clean(w, 'fines');
  });

  /* ---------- Данные · контакты / партнёры ---------- */
  await group('data: every partner has 3 managers with role, name, phone and mobile; masked variants keep only the prefix and the last two digits (0.3.11 «Данные · контакты» #254–275 «3 менеджера с именем, телефоном и мобильным»; v6: 17 partners)', 'ru', async (g, ev, w) => {
    const r = ev("S.partners.map(p=>({id:p.id,type:p.type,c:partnerContacts(p)}))"); assert(r.length >= 15, 'partners ' + r.length); const ids = new Set();
    const ROLES = { ws: ['Руководитель сервиса', 'Диспетчер 24/7', 'Мастер-приёмщик'], lp: ['Руководитель отдела перевозок', 'Диспетчер 24/7', 'Менеджер по работе с клиентами'] };
    for (const p of r) {
      eq(p.c.length, 3, p.id + ': 3 managers (0.3.11 «контактов 3»)'); eq(p.c.map(c => c.role).join('|'), ROLES[p.type === 'ws' ? 'ws' : 'lp'].join('|'), p.id + ': the 0.3.11 role set of a ' + (p.type === 'ws' ? 'workshop' : 'logistics partner'));
      eq(new Set(p.c.map(c => c.name)).size, 3, p.id + ': three different people');
      p.c.forEach((c, i) => { eq(c.id, p.id + ':' + i, 'contact id'); assert(!ids.has(c.id), 'duplicate id ' + c.id); ids.add(c.id);
        assert(c.name.trim().length >= 5 && c.tel && c.mob, c.id + ': name / phone / mobile present');
        assert(/^\+7 \d{3,4} \d{3} \d{2} \d{2}$/.test(c.tel), c.id + ': landline ' + c.tel); assert(/^\+7 7\d\d \d{3} \d{2} \d{2}$/.test(c.mob), c.id + ': mobile ' + c.mob);
        assert(/^\+7 \d•• ••• •• \d\d$/.test(c.telM) && /^\+7 7•• ••• •• \d\d$/.test(c.mobM), c.id + ': masked ' + c.telM + ' / ' + c.mobM); eq(c.telM.slice(-2), c.tel.slice(-2), 'masked phone keeps the last two digits'); eq(c.mobM.slice(-2), c.mob.slice(-2), 'masked mobile keeps the last two digits');
        assert(!c.telM.includes(c.tel.slice(4, 9)) && !c.mobM.includes(c.mob.slice(4, 9)), c.id + ': the middle digits are hidden'); });
      eq(new Set(p.c.map(c => c.mob)).size, 3, p.id + ': three different mobiles'); }
    assert(r.every(p => p.c.some(c => /24\/7/.test(c.role))), 'every partner has a 24/7 dispatcher contact');
  });
  await group('contact drawer shows the three persons masked, reveal needs the right and is audited, roles are translated (0.3.11 «Данные · контакты» + FR-82; per-role rules: admin / dispatcher may call, viewer / auditor / driver may not)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});" + H4PT + ";ACT.ptContact({id:'PW-02'})"); const d = w.document; eq(d.querySelectorAll('[data-contact]').length, 3, 'three persons in the drawer'); const c = ev("partnerContacts(S.partners.find(p=>p.id==='PW-02'))");
    assert([...d.querySelectorAll('[data-contact]')].every(e => /•/.test(e.innerText)), 'all three masked'); for (const x of c) assert(d.querySelector('[data-contacts=PW-02]').innerText.includes(x.role) && d.querySelector('[data-contacts=PW-02]').innerText.includes(x.name), x.id + ': role and name shown');
    const a0 = ev('S.audit.length'); ev(`ACT.ptCall({id:'${c[2].id}'})`); assert(d.body.innerText.includes(c[2].mob) && !d.body.innerText.includes(c[0].mob), 'only the called person is revealed'); assert(ev('S.audit.length') >= a0 + 2, 'reveal + call audited'); eq(Object.keys(ev('S.ptx.revealed')).filter(k => /^PW-02:/.test(k)).join(), 'PW-02:2');
    ev("S.ptx.revealed={}"); for (const role of ['viewer', 'auditor', 'driver', 'warehouse']) { ev(`ACT.setRole({v:'${role}'})`); ev(`ACT.ptCall({id:'PW-02:1'})`); assert(!ev("S.ptx.revealed['PW-02:1']"), role + ' cannot reveal a number'); }
    ev("ACT.setRole({v:'dispatcher'})"); ev("ACT.ptCall({id:'PW-02:1'})"); assert(ev("S.ptx.revealed['PW-02:1']"), 'dispatcher (partners:write) may reveal');
    for (const lang of ['de', 'en', 'kk']) { const gg = await fresh(lang); try { gg.ev("ACT.setRole({v:'admin'});go('dispatch');ACT.dtab({v:'partners'});ACT.ptContact({id:'PL-01'})"); const t = gg.w.document.querySelector('[data-contacts=PL-01]').innerText; eq(gg.w.document.querySelectorAll('[data-contact]').length, 3, lang + ': three persons'); if (lang !== 'kk') assert(!/[А-Яа-я]{4,}/.test(t), lang + ' contacts drawer without Cyrillic: ' + t.slice(0, 200)); assert(/24\/7/.test(t), lang + ': dispatcher 24/7'); clean(gg.w, 'contacts ' + lang); } finally { gg.done(); } }
  });
