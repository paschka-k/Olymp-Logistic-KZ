const fs=require('fs');
function patch(p,fn){let s=fs.readFileSync(p,'utf8');const rep=(a,b)=>{if(!s.includes(a))throw new Error(p+' missing: '+a.slice(0,60));s=s.replace(a,()=>b)};fn(rep,t=>{s=s.replace(/\n*$/,'\n')+t});fs.writeFileSync(p,s);}
patch('platform-src/tests/61-shell-ext.js',(rep,add)=>{
 rep("ev('ACT.authCodes()'); ev(\"S.auth.np='short';S.auth.np2='short'\");","ev(\"userOf('warehouse').mustChange=true\"); ev('ACT.authCodes()'); assert(w.document.querySelector('[data-login-step=change]'), 'must_change_password forces the change step'); ev(\"S.auth.np='short';S.auth.np2='short'\");");
 add(`  /* ---- parity 0.3.11 (docs/parity-0311/shell-records-admin.md): login flow, history API, deep links, 403, time zone, search, records page ---- */
  await group('login: recovery codes only after enrolment, forced change only with must_change, a recovery code works once, 5 wrong codes lock (5.3-5.6)', 'en', async (g, ev, w) => {
    const login = (role, code) => { ev('ACT.signOut()'); ev(\`S.auth.role='\${role}';S.auth.pw='x'\`); ev('ACT.authPw()'); ev(\`S.auth.code='\${code}'\`); ev('ACT.authMfa()'); };
    login('dispatcher', '123456'); assert(!w.document.querySelector('.login-layer'), 'enrolled account without must_change signs in at once'); eq(ev('S.role'), 'dispatcher');
    ev('ACT.signOut()'); ev("S.auth.role='viewer';S.auth.pw='x'"); ev('ACT.authPw()'); assert(w.document.querySelector('[data-login-step=enrol]'), 'not enrolled: set-up step'); ev("S.auth.code='123456'"); ev('ACT.authMfa()'); assert(w.document.querySelector('[data-login-step=recovery]'), 'recovery codes right after enrolment'); const rc = ev('S.auth.codes[0]');
    ev('ACT.authCodes()'); assert(!w.document.querySelector('.login-layer'), 'no forced change without must_change');
    login('viewer', rc); assert(!w.document.querySelector('.login-layer'), 'recovery code signs in'); login('viewer', rc); assert(w.document.querySelector('[data-login-step=mfa] .login-err'), 'a recovery code works once');
    for (let i = 0; i < 4; i++) ev("S.auth.code='000000';ACT.authMfa()"); assert(!ev("userOf('viewer').locked"), '4 failures do not lock'); ev("S.auth.code='000000';ACT.authMfa()"); eq(ev("S.users.find(u=>u.username==='viewer').locked"), false, 'viewer account is inactive in the seed, the active holder of the role is checked'); 
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
    ev("go('fleet')"); assert(/[?&]s=fleet\\b/.test(w.location.search), 'URL names the screen: ' + w.location.search); assert(w.history.length > n0, 'go() pushes an entry');
    ev("go('orders');ACT.stab({s:'orders',v:'orders'});ACT.open({id:S.loads[0].id})"); assert(/[?&]load=LD-/.test(w.location.search), 'drawer record in the URL: ' + w.location.search);
    ev("go('routes');ACT.rtab({v:'wx'});ACT.wxCity({id:'KOS'})"); assert(/[?&]city=KOS\\b/.test(w.location.search) && /[?&]t=wx\\b/.test(w.location.search), 'city + tab in the URL: ' + w.location.search);
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
    for (const q of ['load=LD-9999-none', 'alarm=ALM-99999', 'booking=BK-none', 'load=' + encodeURIComponent('<script>alert(1)</script>')]) { fr = await f(q); const x = fr.contentWindow; eq(x.eval('S.route'), 'forbidden', q + ' -> 403'); assert(x.document.querySelector('[data-page=forbidden][role=alert]') && x.document.querySelector('[data-forbidden-home]'), '403 card with a way back'); assert(/403/.test(x.document.title), '403 title'); assert(/load=|alarm=|booking=/.test(x.location.search), 'the URL stays'); x.document.querySelector('[data-forbidden-home]').click(); assert(x.eval('S.route') !== 'forbidden', 'home button'); fr.remove(); }
  });
  await group('language switch keeps the state: ?lang= opens the bundle, links carry role, hub and the URL (1.6)', 'en', async (g, ev, w) => {
    const fr = document.createElement('iframe'); fr.style.cssText = 'width:1316px;height:760px'; fr.src = 'en.html?lang=de&s=routes&t=wx'; document.getElementById('frames').appendChild(fr);
    await new Promise(ok => { fr.onload = ok; }); await new Promise(r => setTimeout(r, 400)); const x = fr.contentWindow; eq(x.eval('LANG'), 'de', '?lang= picks the bundle'); eq(x.eval('S.tab.routes'), 'wx', 'query survives'); fr.remove();
    ev("ACT.setRole({v:'manager'});ACT.hubSet({v:'ALA'});go('routes')"); const a = w.document.querySelector('.langs a[href="de.html"]'); assert(a, 'language link'); ev("(function(){var h=window.history;})()");
    const sp = []; const orig = w.sessionStorage.setItem.bind(w.sessionStorage); w.sessionStorage.setItem = (k, v) => { sp.push([k, v]); orig(k, v); };
    a.addEventListener('click', e => e.preventDefault(), true); w.document.addEventListener('click', () => {}, true); a.click(); const saved = sp.find(x => x[0] === 'olymp.state'); assert(!saved || JSON.parse(saved[1]).role === 'manager', 'state saved for the next bundle'); w.sessionStorage.removeItem('olymp.state');
  });
  await group('403 page, records landing page and sidebar group, sign-out in the top bar, burger labels (7.6, 10.1, 1.2, 1.5, 1.13)', 'en', async (g, ev, w) => {
    ev("go('records')"); assert(w.document.querySelector('[data-records]') && w.document.querySelectorAll('[data-rec-group]').length >= 4, 'six group cards, empty ones hidden'); assert(w.document.querySelector('[data-rec-group] [data-act=helpOpen]'), 'link buttons'); clean(w, 'records');
    assert(w.document.querySelector('.rec-nav [data-nav-records]'), 'sidebar group heading links to the page'); assert(w.document.querySelectorAll('.nav-item').length === 13, 'menu keeps 13 items');
    ev("ACT.setRole({v:'viewer'});go('records')"); const n = w.document.querySelectorAll('[data-rec-group]').length; ev("ACT.setRole({v:'admin'});go('records')"); assert(w.document.querySelectorAll('[data-rec-group]').length > n, 'links are filtered by the role');
    assert(w.document.querySelector('[data-act=signOut]'), 'sign out in the top bar'); assert(/Open menu/.test(w.document.querySelector('.burger').getAttribute('aria-label')), 'burger label');
    ev('ACT.sideTog()'); assert(/Close menu/.test(w.document.querySelector('.burger').getAttribute('aria-label')), 'burger label when open'); assert(w.document.querySelector('#side-nav') && w.document.querySelector('.burger').getAttribute('aria-controls') === 'side-nav', 'aria-controls');
    const esc = () => w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); esc(); eq(w.document.activeElement && w.document.activeElement.className.split(' ')[0], 'burger', 'Escape returns the focus to the burger');
    ev("ACT.setRole({v:'driver'})"); eq(ev('bottomKeys()[0]'), 'driverapp', 'driver shell bottom bar'); assert(w.document.querySelector('.bottombar .bb.on[aria-current=page]'), 'aria-current on the active item');
  });
  await group('global search: hub filter narrows lines and database hits, the database section needs orders:read, rows are options with ids (3.1, 3.5, 3.8)', 'en', async (g, ev, w) => {
    ev("go('dashboard')"); ev("gsInput('LD-2026')"); const all = ev('gsResults().D.length'), tot = ev('gsResults().D.total'); assert(tot >= all && tot > 0, 'total counts every match'); ev("ACT.hubSet({v:'ATY'})"); ev("gsInput('LD-2026')"); assert(ev('gsResults().D.total') < tot, 'hub filter narrows the database hits');
    assert(ev("gsResults().D.every(r=>r.type!=='load'||[load(r.load).from,load(r.load).to].includes('ATY'))"), 'only loads of the hub'); ev("ACT.hubSet({v:''})"); ev("gsInput('LD-2026')");
    assert(w.document.querySelector('#gsearch').getAttribute('aria-label') && w.document.querySelector('#gslist').getAttribute('aria-label') && w.document.querySelector('#gsearch').getAttribute('aria-activedescendant') === 'gs-0' && w.document.querySelector('#gs-0[role=option]'), 'combobox ARIA');
    ev("ACT.setRole({v:'driver'})"); ev("gsInput('LD-2026')"); eq(ev('gsResults().D.length'), 0, 'no database hits without orders:read');
  });
  await group('document.title: record, tab, screen number and brand; help article; 403 (1.22)', 'en', async (g, ev, w) => {
    ev("go('orders');ACT.stab({s:'orders',v:'ship'})"); assert(/Shipments|PO|04/.test(w.document.title) && /Kökzhol$/.test(w.document.title), 'tab + number + brand: ' + w.document.title);
    ev("ACT.helpGo({k:'roles'})"); assert(/^Help · .+ · Kökzhol$/.test(w.document.title), 'help title: ' + w.document.title); ev("S.route='forbidden';render()"); assert(/^403 · Kökzhol$/.test(w.document.title), '403 title: ' + w.document.title);
  });
`);
});
patch('platform-src/tests/63-narrow.js',(rep,add)=>{
 rep("assert(d.querySelector('.sidebar').getBoundingClientRect().right <= 0, 'menu off-canvas while closed');","assert(d.querySelector('.sidebar').getBoundingClientRect().right <= 0, 'menu off-canvas while closed'); assert(d.querySelector('.sidebar').hasAttribute('inert') && d.querySelector('.sidebar').getAttribute('aria-hidden') === 'true', 'closed menu is inert + aria-hidden (out of the tab order)');");
 rep("assert(ev('S.sideOpen'), 'burger opens');","assert(ev('S.sideOpen'), 'burger opens'); assert(!d.querySelector('.sidebar').hasAttribute('inert'), 'open menu is reachable');");
});
console.log('ok');
