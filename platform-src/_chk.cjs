(async()=>{__suite(6);   /* 61-shell-ext.js */
  /* ---- P6 shell parity: hub filter, global search, clock / alarms / banner, bottom bar, eyebrow / diagram, deep links, sign-in, account ---- */
  for (const lang of LANGS) await group('[' + lang + '] shell: hub filter narrows lists, menu stays 13, topbar has clock and alarms button', lang, async (g, ev, w) => {
    eq(ev('NAV.length'), 13, 'menu items');
    const n0 = ev('hubFilter(S.loads, hubOfLoad).length'); eq(n0, ev('S.loads.length'), 'no filter keeps all');
    ev("ACT.hubSet({v:'ATY'})"); const n1 = ev('hubFilter(S.loads, hubOfLoad).length'); assert(n1 > 0 && n1 < n0, 'ATY narrows loads: ' + n1);
    ev("go('orders')"); assert(w.document.querySelectorAll('.hubseg .hs').length === 6, 'segment: all + 5 hubs');
    ev("ACT.hubSet({v:'KAR'})"); ev("go('fleet')"); assert(ev("hubFilter(S.trucks).every(t=>t.hub==='KAR')"), 'fleet by hub');
    ev("go('drivers')"); ev("go('hubs')"); eq(ev("hubFilter(Object.keys(S.hubs),h=>h).join()"), 'KAR', 'hubs by hub');
    ev("ACT.hubSet({v:''})"); ev("go('dashboard')");
    assert(/\d\d:\d\d:\d\d/.test(w.document.querySelector('[data-clock]').textContent), 'clock'); assert(/Astana UTC\+5/.test(w.document.querySelector('[data-bizdate]').textContent), 'business date');
    assert(w.document.querySelector('[data-alarms]'), 'alarms button'); clean(w, 'topbar');
  });
  await group('shell: search finds lines and database hits, keyboard moves, Enter opens, scanner needs an exact hit', 'en', async (g, ev, w) => {
    ev("go('dashboard')");
    const po = ev("ops(S.loads.find(l=>l.status!=='delivered')).orders[0].po");
    ev(`gsInput(${JSON.stringify(po)})`); assert(w.document.querySelector('.gs-list'), 'list open'); assert(w.document.querySelectorAll('.gs-row').length >= 1, 'rows');
    ev("gsInput('1847')"); assert(ev("gsResults().D.some(r=>r.type==='load' && r.exact)"), 'number variant 1847 → LD-2026-001847');
    ev("gsInput('ld-2026-1847')"); assert(ev("gsResults().D.some(r=>r.id==='LD-2026-001847' && r.exact)"), 'variant ld-2026-1847');
    const k = k => w.document.querySelector('#gsearch').dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true }));
    ev("gsInput('00')"); ev("gsInput('LD-2026')"); k('ArrowDown'); eq(ev('S.gs.idx'), 1, 'arrow down'); k('ArrowUp'); eq(ev('S.gs.idx'), 0, 'arrow up');
    k('Escape'); eq(ev('S.gs.q'), '', 'Esc clears');
    ev("gsInput('1847')"); k('Enter'); eq(ev('S.route'), 'orders', 'Enter opens the hit'); eq(ev('S.drawer && S.drawer.id'), 'LD-2026-001847', 'load drawer');
    ev('closeDrawer()'); ev('ACT.gsScan()'); ev("gsInput('zzzz-none')"); k('Enter'); assert(w.document.querySelector('.toast.err'), 'scan not recognised toast'); ev('ACT.gsScan()');
    ev("gsInput('delivered-none')"); ev('S.gs.q=""');
    const dl = ev("S.loads.find(l=>l.status==='delivered').id"); const dpo = ev(`ops(load('${dl}')).orders[0].po`);
    ev('S.gs.arch=false'); ev(`gsInput(${JSON.stringify(dpo)})`); const a = ev("gsResults().L.filter(r=>load(r.load).status==='delivered').length");
    ev('ACT.gsArch()'); assert(ev("gsResults().L.filter(r=>load(r.load).status==='delivered').length") > a - 1, 'archive toggle includes delivered'); clean(w, 'search');
  });
  await group('shell: alarm banner shows new level >= 2 alarms (max 3), click opens alarms, dismiss clears', 'en', async (g, ev, w) => {
    ev("go('dashboard')"); assert(!w.document.querySelector('[data-alarm-banner]'), 'no banner for alarms present on load');
    ev("raiseAlarm({lvl:2,cat:'door',hub:'AST',load:'LD-2026-001850',truck:'t3',text:'Test door alarm'})"); ev('render()');
    assert(w.document.querySelector('[data-alarm-banner]'), 'banner'); w.document.querySelector('[data-act=banX]').click(); assert(!w.document.querySelector('[data-alarm-banner]'), 'dismissed');
    for (let i = 0; i < 5; i++) ev(`raiseAlarm({lvl:3,cat:'temperature',hub:'ALA',load:'LD-X${i}',text:'T${i}'})`); ev('render()');
    eq(+w.document.querySelector('[data-alarm-banner]').dataset.alarmBanner, 3, 'max 3 items');
    w.document.querySelector('.ab-item').click(); eq(ev('S.route'), 'dashboard', 'goes to the dashboard'); eq(ev('S.tab.dashboard'), 'alarms', 'alarms tab');
  });
  await group('shell: bottom bar has 4 screens per role, Escape closes drawer and sidebar', 'en', async (g, ev, w) => {
    for (const r of ev('ROLES')) { ev(`ACT.setRole({v:'${r}'})`); const n = ev('bottomKeys().length'); assert(n >= 1 && n <= 4, r + ' bottom keys ' + n); assert(ev('bottomKeys().every(k=>canSee(k))'), r + ' bottom keys visible'); }
    ev("ACT.setRole({v:'admin'})"); eq(ev('bottomKeys().length'), 4, 'admin 4'); eq(w.document.querySelectorAll('.bottombar .bb').length, 4, 'rendered');
    const esc = () => w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    ev("go('orders');ACT.open({id:S.loads[0].id})"); assert(ev('S.drawer'), 'open'); esc(); assert(!ev('S.drawer'), 'Esc closes the drawer');
    ev('ACT.sideTog()'); assert(ev('S.sideOpen'), 'sidebar open'); esc(); assert(!ev('S.sideOpen'), 'Esc closes the sidebar');
  });
  for (const lang of LANGS) await group('[' + lang + '] shell: eyebrow numbers and diagram popover', lang, async (g, ev, w) => {
    ev("go('dispatch')"); eq(w.document.querySelector('.eyebrow').dataset.eyebrow, '02', 'dispatch = 02');
    ev("go('orders');ACT.stab({s:'orders',v:'ship'})"); eq(w.document.querySelector('.eyebrow').dataset.eyebrow, '04', 'ship = 04');
    ev("go('orders');ACT.stab({s:'orders',v:'docs'})"); eq(w.document.querySelector('.eyebrow').dataset.eyebrow, '08', 'docs = 08');
    ev("go('baseline')"); eq(w.document.querySelector('.eyebrow').dataset.eyebrow, '17', 'baseline = 17');
    ev("go('dispatch')"); w.document.querySelector('.diag-btn').click(); assert(w.document.querySelector('.diag-pop svg'), 'diagram popover'); clean(w, 'diagram');
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); assert(!w.document.querySelector('.diag-pop'), 'Esc closes the popover');
    assert(/Kökzhol/.test(w.document.title), 'document.title');
  });
  await group('shell: deep links ?load= ?s=&t= open the target, ?track= still works', 'en', async (g, ev, w) => {
    const f = async q => { const fr = document.createElement('iframe'); fr.style.cssText = 'width:1316px;height:760px'; fr.src = 'en.html?' + q; document.getElementById('frames').appendChild(fr); await new Promise(ok => { fr.onload = ok; }); await new Promise(r => setTimeout(r, 100)); return fr; };
    let fr = await f('load=1847'); eq(fr.contentWindow.eval('S.drawer && S.drawer.id'), 'LD-2026-001847', '?load='); eq(fr.contentWindow.eval('S.route'), 'orders'); fr.remove();
    fr = await f('s=routes&t=wx'); eq(fr.contentWindow.eval('S.route'), 'routes'); eq(fr.contentWindow.eval('S.tab.routes'), 'wx', '?s=&t='); fr.remove();
    fr = await f('dev=DEV-0011'); eq(fr.contentWindow.eval('S.route'), 'pod', '?dev='); fr.remove();
    fr = await f('track=LD-2026-001847'); eq(fr.contentWindow.eval('S.route'), 'track', '?track='); fr.remove();
    fr = await f('request=1'); eq(fr.contentWindow.eval('S.route'), 'request', '?request=1'); fr.remove();
  });
  for (const lang of LANGS) await group('[' + lang + '] shell: demo sign-in (password, 2FA 123456, recovery codes, forced change >= 12), account, reset', lang, async (g, ev, w) => {
    ev("ACT.setRole({v:'dispatcher'})"); ev('ACT.signOut()'); assert(w.document.querySelector('[data-login-step=password]'), 'login card');
    ev("S.auth.role='warehouse';S.auth.pw='x'"); ev('ACT.authPw()'); assert(w.document.querySelector('[data-login-step=mfa]'), '2FA step');
    ev("S.auth.code='000000'"); ev('ACT.authMfa()'); assert(w.document.querySelector('[data-login-step=mfa] .login-err'), 'wrong code refused');
    ev("S.auth.code='123456'"); ev('ACT.authMfa()'); eq(w.document.querySelectorAll('.codes li').length, 10, '10 recovery codes');
    ev("userOf('warehouse').mustChange=true"); ev('ACT.authCodes()'); assert(w.document.querySelector('[data-login-step=change]'), 'must_change_password forces the change step'); ev("S.auth.np='short';S.auth.np2='short'"); ev('ACT.authChange()'); assert(w.document.querySelector('[data-login-step=change] .login-err'), 'short password refused');
    ev("S.auth.cur='x';S.auth.np='correct horse battery';S.auth.np2='correct horse battery'"); ev('ACT.authChange()');   /* R1: 0.3.9 asks the current password */
    assert(!w.document.querySelector('.login-layer'), 'login closed'); eq(ev('S.role'), 'warehouse', 'sign-in ends in setRole');
    ev("go('account')"); assert(w.document.querySelector('[data-account]') && w.document.querySelector('[data-demo-reset]'), 'account page'); clean(w, 'account');
    ev("S.acct.np='abc';S.acct.np2='abc'"); ev('ACT.acctPw()'); assert(w.document.querySelector('[data-acct-msg]'), 'password message');
    ev("ACT.setRole({v:'admin'});S.loads[0].status='problem'"); ev('ACT.resetAsk()'); ev('ACT.resetGo()'); assert(ev("S.loads[0].status!=='problem'"), 'reset restores demo data');
  });
  /* ---- parity 0.3.11 (docs/parity-0311/shell-records-admin.md): login flow, history API, deep links, 403, time zone, search, records page ---- */
  await group('login: recovery codes only after enrolment, forced change only with must_change, a recovery code works once, 5 wrong codes lock (5.3-5.6)', 'en', async (g, ev, w) => {
    const login = (role, code) => { ev('ACT.signOut()'); ev(`S.auth.role='${role}';S.auth.pw='x'`); ev('ACT.authPw()'); ev(`S.auth.code='${code}'`); ev('ACT.authMfa()'); };
    login('dispatcher', '123456'); assert(!w.document.querySelector('.login-layer'), 'enrolled account without must_change signs in at once'); eq(ev('S.role'), 'dispatcher');
    ev('ACT.signOut()'); ev("S.auth.role='viewer';S.auth.pw='x'"); ev('ACT.authPw()'); assert(w.document.querySelector('[data-login-step=enrol]'), 'not enrolled: set-up step'); ev("S.auth.code='123456'"); ev('ACT.authMfa()'); assert(w.document.querySelector('[data-login-step=recovery]'), 'recovery codes right after enrolment'); const rc = ev('S.auth.codes[0]');
    ev('ACT.authCodes()'); assert(!w.document.querySelector('.login-layer'), 'no forced change without must_change');
    login('viewer', rc); assert(!w.document.querySelector('.login-layer'), 'recovery code signs in'); login('viewer', rc); assert(w.document.querySelector('[data-login-step=mfa] .login-err'), 'a recovery code works once');
    login('manager', '000000'); for (let i = 0; i < 3; i++) ev("S.auth.code='000000';ACT.authMfa()"); assert(!ev("userOf('manager').locked"), '4 failures do not lock'); ev("S.auth.code='000000';ACT.authMfa()"); eq(ev("userOf('manager').locked"), true, 'the 5th wrong code locks the account'); eq(ev('S.auth.step'), 'password'); ev("S.auth.role='manager';S.auth.pw='x'"); ev('ACT.authPw()'); assert(w.document.querySelector('[data-login-step=password] .login-err'), 'a locked account is refused'); ev("userOf('manager').locked=false");
    const e = ev("S.audit.filter(a=>a.action==='auth.mfa_failed').length"); assert(e >= 5, 'auth.mfa_failed audited: ' + e);
    ev("userOf('finance').mustChange=true"); login('finance', '123456'); assert(w.document.querySelector('[data-login-step=change]'), 'forced change'); ev("S.auth.cur='x';S.auth.np='sarah.johnson-long-1';S.auth.np2='sarah.johnson-long-1'"); ev('ACT.authChange()'); assert(w.document.querySelector('.login-err'), 'a password with the username is refused');
    ev("S.auth.np='aaaaaaaaaaaaaaaa';S.auth.np2='aaaaaaaaaaaaaaaa'"); ev('ACT.authChange()'); assert(w.document.querySelector('.login-err'), 'a simple password is refused'); ev("S.auth.np='tulip river moon 42';S.auth.np2='tulip river moon 42'"); ev('ACT.authChange()'); assert(!w.document.querySelector('.login-layer') && !ev("userOf('finance').mustChange"), 'changed, flag cleared');
  });
  for (const lang of LANGS) await group('[' + lang + '] time zone: every timestamp is Asia/Almaty (UTC+5) whatever the browser zone (23.3), T() falls back to RU on an empty KK text (23.2)', lang, async (g, ev, w) => {
    eq(ev("LF.dtFull('2026-10-18T09:30:00Z')"), '18.10.2026 14:30', 'dtFull'); eq(ev("LF.dt('2026-10-18T20:15:00Z')"), '19.10, 01:15', 'dt crosses midnight in KZ'); eq(ev("LF.date('2026-12-31T20:00:00Z')"), '01.01.2027', 'date'); eq(ev("LF.local('2026-10-18T09:30:00Z')"), '2026-10-18T14:30', 'datetime-local value'); eq(ev("LF.time('2026-10-18T09:30:05Z')"), '14:30:05', 'time');
    eq(ev("fdtKZ('2026-10-18T09:30:00Z')"), '18.10.2026 14:30', 'records formatter'); eq(ev("T('ru','de','en','')"), lang === 'de' ? 'de' : lang === 'en' ? 'en' : 'ru', 'empty 4th argument -> RU in KK');
    eq(ev("(function(){var d=new Date('2026-10-18T09:30:00Z');return LF.kz(d).getHours()})()"), 14, 'kz() getters read KZ wall time');
  });
  await group('history: navigation pushes entries, selection rewrites the URL, Back/Forward restore screen, tab and record (1.20, 1.21, 8.4)', 'en', async (g, ev, w) => {
    const wait = ms => new Promise(r => setTimeout(r, ms)), n0 = w.history.length;
    ev("go('fleet')"); assert(/[?&]s=fleet\b/.test(w.location.search), 'URL names the screen: ' + w.location.search); assert(w.history.length > n0, 'go() pushes an entry');
    ev("go('orders');ACT.stab({s:'orders',v:'orders'});ACT.open({id:S.loads[0].id})"); assert(/[?&]load=LD-/.test(w.location.search), 'drawer record in the URL: ' + w.location.search);
    ev("go('routes');ACT.rtab({v:'wx'});ACT.wxCity({id:'KOS'})"); assert(/[?&]city=KOS\b/.test(w.location.search) && /[?&]t=wx\b/.test(w.location.search), 'city + tab in the URL: ' + w.location.search);
    ev("go('reports')"); const l = w.location.search; w.history.back(); await wait(150); eq(ev('S.route'), 'routes', 'Back returns to the previous screen'); eq(ev('S.tab.routes'), 'wx'); w.history.back(); await wait(150); eq(ev('S.route'), 'orders', 'Back twice'); eq(ev('S.drawer && S.drawer.type'), 'load', 'drawer restored from the URL');
    w.history.forward(); await wait(150); eq(ev('S.route'), 'routes', 'Forward'); w.history.go(2); await wait(150); eq(ev('S.route'), 'reports', 'Forward to the newest entry'); eq(w.location.search, l, 'URL of the entry');
    assert(!ev("document.title").includes('undefined'), 'title');
  });
  await group('deep links: ?trip= alias, ?booking=, ?help=, ?r=type:id, ?s=help&k=, id sanitising, 403 page for unknown or forbidden records (8.1-8.6)', 'en', async (g, ev, w) => {
    const f = async (q, lang) => { const fr = document.createElement('iframe'); fr.style.cssText = 'width:1316px;height:760px'; fr.src = (lang || 'en') + '.html?' + q; document.getElementById('frames').appendChild(fr); await new Promise(ok => { fr.onload = ok; }); await new Promise(r => setTimeout(r, 120)); return fr; };
    let fr = await f('trip=1847'); eq(fr.contentWindow.eval('S.drawer && S.drawer.id'), 'LD-2026-001847', '?trip= is the old name of ?load='); fr.remove();
    fr = await f('s=orders&t=ship&load=LD-2026-001847'); eq(fr.contentWindow.eval('S.tab.orders'), 'ship'); eq(fr.contentWindow.eval('S.ops.shipLoad'), 'LD-2026-001847', 'selects the trip on the Shipments tab'); fr.remove();
    fr = await f('s=dispatch&load=LD-2026-001847'); eq(fr.contentWindow.eval('S.route'), 'dispatch'); eq(fr.contentWindow.eval('S.drawer && S.drawer.id'), 'LD-2026-001847', 'trip card on the dispatch board'); fr.remove();
    fr = await f('booking=BK-26-000004'); eq(fr.contentWindow.eval('S.tab.orders'), 'bookings', '?booking='); eq(fr.contentWindow.eval('S.drawer && S.drawer.id'), 'BK-26-000004'); fr.remove();
    fr = await f('help=roles'); eq(fr.contentWindow.eval('S.route + "/" + S.help.key'), 'help/roles', '?help='); fr.remove();
    fr = await f('s=help&k=r-users'); eq(fr.contentWindow.eval('S.route'), 'help', '?s=help&k='); fr.remove();
    fr = await f('r=alarm:ALM-101'); eq(fr.contentWindow.eval('S.drawer && S.drawer.type'), 'alarm', '?r=alarm:id'); fr.remove();
    fr = await f('view=wx&s=routes'); eq(fr.contentWindow.eval('S.tab.routes'), 'wx', '?view= maps to the tab'); fr.remove();
    for (const q of ['load=LD-9999-none', 'alarm=ALM-99999', 'booking=BK-none', 'load=' + encodeURIComponent('<script>alert(1)})