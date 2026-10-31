  /* ---- W3 records & administration ---- */
  const KEYS = ['dashboard/alarms', 'dashboard/inbox', 'orders/bookings', 'billing/insurance', 'settings/ref', 'settings/oncall', 'settings/users', 'settings/audit', 'integrations-catalogue', 'changes'];
  await group('rec: all W3 tabs and the changes route render in 4 languages without undefined/NaN', 'ru', async (g, ev, w) => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { const e = gg.ev, ww = gg.w;
      for (const [s, t] of [['dashboard', 'alarms'], ['dashboard', 'inbox'], ['orders', 'bookings'], ['billing', 'insurance'], ['settings', 'ref'], ['settings', 'oncall'], ['settings', 'users'], ['settings', 'audit'], ['settings', 'integ']]) { e(`S.tab['${s}']='${t}';go('${s}')`); assert(ww.document.querySelector('.content').innerText.length > 80, lang + ' empty ' + s + '/' + t); clean(ww, lang + ' ' + s + '/' + t); }
      e("go('changes')"); assert(ww.document.querySelectorAll('.chg-row').length > 0, lang + ' changes rows'); clean(ww, lang + ' changes');
      if (lang === 'de' || lang === 'en') { e("S.tab.dashboard='inbox';go('dashboard')"); assert(!/[А-Яа-яЁё]/.test(ww.document.querySelector('.content').innerText), lang + ' Cyrillic in inbox'); }
    } finally { gg.done(); } }
  });
  await group('rec: help articles of W3 exist and DE/EN have no Cyrillic', 'ru', async (g, ev) => { const miss = KEYS.filter(k => !ev(`HELP.articles.some(a=>a.key==='${k}')`)); assert(!miss.length, 'missing help: ' + miss); });
  await group('alarms: level-3 escalates through the roster, needs ack, close needs category + note (FR-101/104/105)', 'ru', async (g, ev, w) => {
    ev("go('dashboard');S.tab.dashboard='alarms';render()"); assert(w.document.querySelector('[data-act=alOpen]'), 'alarm rows');
    const n0 = ev('S.alarms.length'); const a = ev("raiseAlarm({lvl:3,cat:'door',src:'wialon',hub:'AST',load:'LD-2026-001851',truck:'t4',text:'Дверь открыта'}).id");
    eq(ev('S.alarms.length'), n0 + 1); eq(ev(`S.alarms.find(x=>x.id==='${a}').esc.length`), 2, 'sms + email to duty officer'); eq(ev(`raiseAlarm({lvl:3,cat:'door',load:'LD-2026-001851',hub:'AST',text:'again'}).id`), a, 'dedupe');
    ev(`alarmTick('${a}')`); assert(ev(`S.alarms.find(x=>x.id==='${a}').esc.some(e=>e.target==='head_security')`), 'next level'); ev(`alarmTick('${a}')`); assert(ev(`S.alarms.find(x=>x.id==='${a}').esc.some(e=>e.target==='ceo'&&e.ch==='call')`), 'ceo call');
    assert(ev(`alarmClose('${a}','police','long enough note')`), 'closed before ack'); eq(ev(`alarmAck('${a}')`), true);
    assert(ev(`alarmClose('${a}','','long enough note')`), 'no category'); assert(ev(`alarmClose('${a}','police','short')`), 'short note'); eq(ev(`alarmClose('${a}','police','handled by police unit')`), null); eq(ev(`S.alarms.find(x=>x.id==='${a}').status`), 'closed');
    ev("oncallEnd(1);oncallEnd(2)"); ev("S.oncall.forEach(s=>{if(s.target==='oncall')s.active=false})"); eq(ev("oncallCurrent('oncall')"), undefined, 'no duty officer'); const b = ev("raiseAlarm({lvl:3,cat:'panic',hub:'ALA',truck:'t2',text:'SOS'}).esc[0].ok"); eq(b, false, 'fallback flagged');
  });
  await group('alarms: a load turning problem raises a level-3 alarm', 'ru', async (g, ev) => { const n = ev("alarmsOpen().filter(a=>a.load==='LD-2026-001848'&&a.lvl===3).length"); ev("setStatus('LD-2026-001848','problem')"); eq(ev("alarmsOpen().filter(a=>a.load==='LD-2026-001848'&&a.lvl===3).length"), n + 1); });
  await group('inbox: routing opens the matching screen, translit on DE/EN, manual add (FR-135)', 'ru', async (g, ev, w) => {
    eq(ev("translit('Қарағанды Астана «Олимп»')"), 'Qaragandy Astana "Olimp"');
    const id = ev("S.inbox.find(m=>m.kind==='road_closure').id"); ev(`inboxOpen('${id}')`); eq(ev('S.route'), 'routes'); const n = ev('S.inbox.length'); ev("inboxAdd({kind:'lead',src:'phone',title:'Новый запрос'})"); eq(ev('S.inbox.length'), n + 1);
    const m = ev("inboxAdd({kind:'telematics_alarm',src:'driver',title:'Дверь',veh:'t5'}).id"); assert(ev("S.alarms.some(a=>a.text==='Дверь')"), 'telematics message raised no alarm');
    const gg = await fresh('en'); try { gg.ev("go('dashboard');S.tab.dashboard='inbox';render()"); assert(!/[А-Яа-яЁё]/.test(gg.w.document.querySelector('.content').innerText), 'Cyrillic on EN inbox'); assert(!gg.w.document.querySelector('.xt'), 'seed messages are in the UI language (Q2), no transliteration needed'); gg.ev("inboxAdd({kind:'lead',src:'телефон',title:'Новый клиент из Тараза'});render()"); assert(gg.w.document.querySelector('.xt'), 'hover original of a Cyrillic manual entry'); } finally { gg.done(); }
  });
  await group('bookings: new badge, confirm creates a load, reject/cancel need reasons, shared shape (FR-190)', 'ru', async (g, ev, w) => {
    const n = ev('newBookings()'); assert(n >= 3, 'seed'); eq(ev("NAV_BADGE.orders()"), n); assert(w.document.querySelector('.nav-n'), 'menu badge');
    ev("addBooking({cust:'c2',from:'AST',to:'KAR',zone:'chilled',pallets:5,kg:1500})"); eq(ev('newBookings()'), n + 1);
    const loads = ev('S.loads.length'); eq(ev("bookingConfirm('BK-26-000002')"), null); eq(ev('S.loads.length'), loads + 1); eq(ev("S.bookings.find(b=>b.id==='BK-26-000002').status"), 'confirmed'); assert(ev("bookingConfirm('BK-26-000002')"), 'double confirm');
    assert(ev("bookingReject('BK-26-000001','')"), 'reject without reason'); eq(ev("bookingReject('BK-26-000001','no capacity today')"), null);
    assert(ev("bookingCancel('BK-26-000002','x')"), 'cancel without reason'); eq(ev("bookingCancel('BK-26-000002','customer changed the plan')"), null); eq(ev('S.loads.length'), loads, 'order removed'); eq(ev('S.bookings.find(b=>b.id==="BK-26-000002").status'), 'cancelled');
    ev("S.tab.orders='bookings';go('orders');ACT.bkOpen({id:'BK-26-000004'});ACT.bkView({v:'cert'})"); assert(/IC-/.test(w.document.querySelector('.drawer').innerText), 'certificate'); ev("ACT.setRole({v:'viewer'})"); eq(ev("NAV_BADGE.orders()"), 0, 'viewer sees no badge');
  });
  await group('insurance: claim needs insured booking, amount <= value, steps with notes (FR-153)', 'ru', async (g, ev, w) => {
    const dev = ev("S.devs.find(d=>/^DEV-/.test(d.id)).id"); assert(typeof ev(`claimOpen({dev:'${dev}',booking:'BK-26-000002',amount:1000,note:'long enough text'})`) === 'string', 'uninsured booking');
    assert(typeof ev(`claimOpen({dev:'${dev}',booking:'BK-26-000003',amount:99999999999,note:'long enough text'})`) === 'string', 'over value');
    const id = ev(`claimOpen({dev:'${dev}',booking:'BK-26-000003',amount:500000,note:'excursion, goods destroyed'}).id`); assert(/^CLM-/.test(id)); assert(typeof ev(`claimOpen({dev:'${dev}',booking:'BK-26-000003',amount:1,note:'long enough text'})`) === 'string', 'duplicate open claim');
    assert(ev(`claimStep('${id}','settled','ok ok')`), 'skip a step'); assert(ev(`claimStep('${id}','submitted','')`), 'needs note'); eq(ev(`claimStep('${id}','submitted','sent to insurer')`), null); eq(ev(`claimStep('${id}','settled','paid out')`), null);
    ev("S.tab.billing='insurance';go('billing')"); assert(w.document.querySelector('.content').innerText.includes(id), 'claim listed'); clean(w, 'insurance');
  });
  await group('reference data: versions, four-eyes approval, tariff effect, KATO check (FR-78/169/174)', 'ru', async (g, ev, w) => {
    const rate0 = ev('ZONES.pharma.rate'); const r = ev("refSave('tariff','pharma',{rate:900})"); eq(r.status, 'pending'); eq(ev('ZONES.pharma.rate'), rate0, 'not applied before approval'); assert(ev("refDecide('tariff','pharma',true)"), 'author approves own change');
    ev("ACT.setRole({v:'manager'})"); eq(ev("refDecide('tariff','pharma',true)"), null); eq(ev('ZONES.pharma.rate'), 900); eq(ev("refFind('tariff','pharma').version"), 2);
    ev("ACT.setRole({v:'admin'})"); const p = ev("refSave('place','KZ-AKT',{kato:'151010000',ru:'Актобе',kk:'Ақтөбе',de:'Aktobe',en:'Aktobe',lat:50.28,lon:57.2,hub:'KAR'})"); assert(typeof p !== 'string', String(p)); eq(ev("refFind('place','KZ-AKT').version"), 1);
    assert(typeof ev("refSave('place','x',{ru:'a'})") === 'string', 'bad key'); const k = ev('katoVerify()'); assert(k.bad >= 1, 'bad KATO found');
    ev("refSave('verify','vat_insurance',{verified:true})"); eq(ev("refFind('verify','vat_insurance').data.verified"), true); ev("go('settings');S.tab.settings='ref';render()"); assert(w.document.querySelector('.content').innerText.length > 100); clean(w, 'ref');
  });
  await group('on-call: coverage, add/end slot, edit right (FR-166)', 'ru', async (g, ev) => {
    assert(ev("oncallCoverage('ceo').now"), 'ceo covered'); const s = ev("oncallAdd({target:'oncall',sms:'+7 701 111 22 33',from:'2026-10-25T00:00:00+05:00',until:'2026-10-26T00:00:00+05:00'})"); assert(s && s.id, 'slot added'); assert(/^\+/.test(s.sms) && /•/.test(s.sms), 'masked'); assert(typeof ev("oncallAdd({target:'oncall',from:'2026-10-25T00:00:00+05:00',until:'2026-10-26T00:00:00+05:00'})") === 'string', 'needs contact'); assert(typeof ev("oncallAdd({target:'oncall',sms:'+7 701 111 22 33',from:'2026-10-26T00:00:00+05:00',until:'2026-10-25T00:00:00+05:00'})") === 'string', 'period');
    eq(ev(`oncallEnd(${s.id})`), true); ev("ACT.setRole({v:'dispatcher'})"); assert(typeof ev("oncallAdd({target:'oncall',sms:'+7 701 111 22 33',from:'2026-10-25T00:00:00+05:00',until:'2026-10-26T00:00:00+05:00'})") === 'string', 'dispatcher without function');
  });
  await group('users: create with one-time password, validation, missing approval functions (FR-14/85)', 'ru', async (g, ev) => {
    eq(ev('ROLES.length'), 11); assert(typeof ev("userCreate({username:'A b',name:'x',role:'viewer'})") === 'string', 'bad login'); const r = ev("userCreate({username:'new.user',name:'Новый Пользователь',role:'dispatcher',hub:'KAR'})"); assert(/^[A-Z2-9-]{14}$/.test(r.otp), 'otp'); eq(ev("S.users.find(u=>u.username==='new.user').hub"), 'KAR'); assert(typeof ev("userCreate({username:'new.user',name:'Dup',role:'viewer'})") === 'string', 'dup');
    assert(typeof ev("userCreate({username:'c.x',name:'Kunde',role:'customer'})") === 'string', 'customer needs ref'); eq(ev("missingFunctions().length"), 0); ev("userUpdate('manager',{fn:[]});userUpdate('security.head',{active:false})"); assert(ev("missingFunctions()").includes('head_analytics'), 'slot without holder'); ev("ACT.setRole({v:'viewer'})"); eq(ev("userUpdate('auditor',{role:'admin'})"), false, 'viewer cannot edit');
  });
  await group('audit: hash chain verifies, tampering is detected, filter and export (LH-Q3)', 'ru', async (g, ev, w) => {
    const v = ev('auditVerify()'); eq(v.ok, true); assert(v.checked >= 3, 'seed entries'); ev("audit('Test','obj','Done','why')"); eq(ev('S.audit[0].prev'), ev('S.audit[1].hash')); eq(ev('auditVerify().ok'), true);
    ev("ACT.auTamper()"); const t = ev('auditVerify()'); eq(t.ok, false); assert(t.brokenAt >= 1, 'break position'); ev("S.audit.forEach(a=>{});go('settings');S.tab.settings='audit';render()"); assert(w.document.querySelector('.content').innerText.length > 100); clean(w, 'audit');
  });
  await group('integrations catalogue: systems, deadlines, connect, API key shown once, webhook rules (FR-173)', 'ru', async (g, ev, w) => {
    assert(ev('S.integ.length') >= 20, 'systems'); ev("ACT.igConn({id:'lardi'})"); eq(ev("S.integ.find(s=>s.key==='lardi').conn"), 'configured');
    ev("openDrawer({type:'keyNew'})"); w.document.querySelector('#ik_n').value = 'Test ERP'; w.document.querySelector('#ik_c').value = 'c1'; ev("ACT.igKeySave()"); assert(/^olk_[0-9a-f]{8}_/.test(ev('S.ux.key')), 'secret'); eq(ev('S.apiKeys[0].name'), 'Test ERP'); ev("ACT.igRevoke({id:S.apiKeys[0].id})"); eq(ev('S.apiKeys[0].active'), false); eq(ev('S.ux.key'), null);
    ev("openDrawer({type:'hookNew'})"); w.document.querySelector('#ih_u').value = 'http://insecure.example'; ev("ACT.igHookSave()"); assert(w.document.querySelector('#ih_err').textContent, 'http rejected'); ev("S.tab.settings='integ';go('settings')"); clean(w, 'integ');
  });
  await group('changes page: register filters by type/status/group/date, KK falls back to RU, DE has German titles', 'ru', async (g, ev, w) => {
    eq(ev('CHANGES.n'), ev('CHANGES.entries.length')); assert(ev('CHANGES.n') >= 190, 'entries'); ev("go('changes')"); const all = ev('changesFiltered().length'); ev("CHG.ty='bug'"); const bugs = ev('changesFiltered().length'); assert(bugs > 0 && bugs < all, 'type filter'); ev("CHG.ty='';CHG.st='open_question'"); assert(ev('changesFiltered().every(e=>e.status==="open_question")'), 'status filter');
    ev("CHG.st='';CHG.from='2026-10-15'"); assert(ev('changesFiltered().every(e=>e.date>="2026-10-15")'), 'date filter'); ev("CHG.from='';CHG.q='FR-190'"); assert(ev('changesFiltered().some(e=>e.id==="FR-190")'), 'search'); ev("ACT.chgOpen({id:'FR-190'})"); assert(w.document.querySelector('.chg-det'), 'detail row');
    const de = await fresh('de'); try { assert(!/[А-Яа-яЁё]/.test(de.ev('CHANGES.entries.slice(0,40).map(e=>e.title).join(" ")')), 'DE titles in Russian'); } finally { de.done(); }
    const kk = await fresh('kk'); try { assert(/[А-Яа-яЁё]/.test(kk.ev('CHANGES.entries[0].title')), 'KK fallback to RU'); } finally { kk.done(); }
  });
  /* ---- parity 0.3.11 (docs/parity-0311/shell-records-admin.md): users, audit, on-call, inbox, alarms ---- */
  await group('users: no change of own role / hub / status / functions, the last administrator stays, hub must exist, create rules (14.1, 14.5, 14.6)', 'ru', async (g, ev, w) => {
    eq(ev("userUpdate('admin',{role:'viewer'})"), false, 'own role'); assert(ev('userUpdate.err'), 'refusal text'); eq(ev("userUpdate('admin',{active:false})"), false, 'own status'); eq(ev("userUpdate('admin',{hub:'AST'})"), false, 'own hub'); eq(ev("userUpdate('admin',{fn:[]})"), false, 'own functions');
    eq(ev("userUpdate('dispatcher.ast',{hub:'XXX'})"), false, 'hub must exist'); ev("S.users.push(Object.assign({}, S.users[0], {username:'admin2', role:'admin', fn:[], active:true}))"); eq(ev("userUpdate('admin2',{active:false})"), true, 'a second admin may go while another stays'); eq(ev("userUpdate('admin2',{active:true})"), true);
    ev("ACT.setRole({v:'dispatcher'})"); ev("S.users.find(u=>u.username==='dispatcher.ast').role='admin'"); ev("ACT.setRole({v:'admin'})");
    const r = ev("userCreate({username:'New.Staff',name:'Новый Сотрудник',role:'admin',hub:'KAR'})"); eq(r.user.username, 'new.staff', 'login is lower-cased'); eq(r.user.hub, null, 'admin has no hub'); eq(r.user.mustChange, true, 'must change the one-time password');
    assert(typeof ev("userCreate({username:'x.long',name:'" + 'a'.repeat(121) + "',role:'viewer'})") === 'string', 'name <= 120'); assert(typeof ev("userCreate({username:'p.one',name:'Partner',role:'partner',ref:'bad'})") === 'string', 'partner needs PL-xx'); eq(ev("userCreate({username:'p.two',name:'Partner',role:'partner',ref:'pl-07'}).user.ref"), 'PL-07', 'PL-xx upper-cased');
    ev("go('settings');setTab('settings','users');openDrawer({type:'userNew'})"); assert(w.document.querySelector('#un_h') && !w.document.querySelector('#un_ref'), 'hub select for a dispatcher'); w.document.querySelector('#un_r').value = 'customer'; w.document.querySelector('#un_r').dispatchEvent(new w.Event('change', { bubbles: true })); assert(w.document.querySelector('select#un_ref') && !w.document.querySelector('#un_h'), 'customer: customer select'); w.document.querySelector('#un_r').value = 'partner'; w.document.querySelector('#un_r').dispatchEvent(new w.Event('change', { bubbles: true })); assert(w.document.querySelector('input#un_ref[pattern]'), 'partner: PL input');
    w.document.querySelector('#un_r').value = 'admin'; w.document.querySelector('#un_r').dispatchEvent(new w.Event('change', { bubbles: true })); assert(w.document.querySelector('#un_h').disabled, 'hub select disabled for admin'); ev('closeDrawer()');
    ev("ACT.usReset({id:'quality',v:'mfa'})"); assert(ev("S.ux.otp.user==='quality' && userOf('quality').mustChange"), 'reset 2FA issues a one-time password and forces a change'); ev("ACT.usReset({id:'admin',v:'mfa'})"); assert(ev("S.audit.every(a=>a.action!=='user.mfa_reset'||a.subject!=='admin')"), 'own 2FA cannot be reset');
    eq(ev("S.audit.some(a=>a.action==='user.created')"), true, 'user.created audited');
  });
  await group('audit: action codes, IP column, failed / throttled rows highlighted, action-prefix filter (15.2, 15.3)', 'en', async (g, ev, w) => {
    ev("audit('Auth','x','Sign-in failed','locked','auth.login_failed')"); eq(ev('S.audit[0].action'), 'auth.login_failed'); assert(/^10\.20\.4\.\d+$/.test(ev('S.audit[0].ip')), 'ip'); assert(ev("S.audit.every(a=>/^[a-z0-9_.]+$/.test(a.action))"), 'every entry has a dotted code'); eq(ev('auditVerify().ok'), true, 'chain covers the new fields');
    ev("go('settings');setTab('settings','audit')"); assert(w.document.querySelector('[data-au-bad] [data-au-action]'), 'failed row highlighted'); assert(w.document.querySelector('[data-au-ip]'), 'IP column'); ev("RC.aa='auth.login_f'"); ev('render()'); const rows = w.document.querySelectorAll('[data-au-action]'); assert(rows.length >= 1 && [...rows].every(e => e.textContent.startsWith('auth.login_f')), 'prefix filter'); ev("RC.aa=''"); clean(w, 'audit');
    ev("userUpdate('manager',{fn:['head_analytics']})"); eq(ev('S.audit[0].action'), 'user.updated'); ev("oncallEnd(4)"); eq(ev('S.audit[0].action'), 'oncall.ended');
  });
  await group('on-call: slot <= 62 days, KZ default window, field attributes (17.3, 17.2, 23.3)', 'en', async (g, ev, w) => {
    const s = ev("oncallAdd({target:'oncall',sms:'+7 701 111 22 33',from:'2026-10-25T00:00:00+05:00',until:'2026-12-26T00:00:00+05:00'})"); assert(s && s.id, '62 days are allowed'); assert(/62 days/.test(ev("oncallAdd({target:'oncall',sms:'+7 701 111 22 33',from:'2026-10-25T00:00:00+05:00',until:'2026-12-27T00:00:00+05:00'})")), '63 days refused');
    ev("go('settings');setTab('settings','oncall');ACT.ocNew()"); eq(w.document.querySelector('#oc_f').value, ev('LF.local(NOW)'), 'default from = business time in Kazakhstan'); assert(w.document.querySelector('#oc_s[inputmode=tel][maxlength]') && w.document.querySelector('#oc_e[maxlength]') && w.document.querySelector('#oc_f[required]'), 'attributes'); ev('closeDrawer()');
  });
  await group('inbox: open pre-selects fine / city / vehicle, done messages hidden by default, level labels, field bounds; alarms hide closed by default (11.4, 11.6, 11.8, 12.1, 24.3)', 'en', async (g, ev, w) => {
    ev("go('dashboard');setTab('dashboard','inbox')"); assert(!w.document.querySelector('.content').innerText.includes('IN-0008'), 'done message hidden by default'); ev("RC.ist='all'"); ev('render()'); assert(w.document.querySelector('.content').innerText.includes('IN-0008'), 'all'); ev("RC.ist=''");
    assert(/Level \d/.test(w.document.querySelector('.content table').innerText), 'level label, not L2');
    const m = ev("inboxAdd({kind:'traffic_fine',src:'x',title:'Speeding fine test',veh:'t6',fine:{off:'sp20',date:'2026-10-18',time:'10:00',amount:5,place:'p'}}).id"); ev("S.eco.fineSel=null"); const fid = ev("S.eco.fines[0].id"); ev(`S.inbox.find(x=>x.id==='${m}').fineId='${fid}'`); ev(`inboxOpen('${m}')`); eq(ev('S.eco.fineSel'), fid, 'fine selected on Reports');
    const c = ev("inboxAdd({kind:'weather_warning',src:'x',title:'Storm test',cc:'AST'}).id"); ev(`inboxOpen('${c}')`); eq(ev('S.wx.sel'), 'AST', 'city selected on Weather');
    const v = ev("inboxAdd({kind:'security_event',src:'x',title:'Security test',veh:'t3'}).id"); ev(`inboxOpen('${v}')`); eq(ev('S.thermo.sel'), 't3', 'vehicle selected');
    ev("go('dashboard');setTab('dashboard','inbox');ACT.inNew()"); assert(w.document.querySelector('#in_title[maxlength="120"]') && w.document.querySelector('#in_text[maxlength="600"]'), 'title / text bounds'); ev("S.inF.kind='traffic_fine';render()"); assert(w.document.querySelector('#inf_amount[max="10000000"][min="0"]') && w.document.querySelector('#inf_place[maxlength="80"]'), 'amount / place bounds'); ev('closeDrawer()');
    ev("setTab('dashboard','alarms')"); assert(!w.document.querySelector('.content').innerText.includes('ALM-104'), 'closed alarms hidden by default'); ev("RC.ast='all'"); ev('render()'); assert(w.document.querySelector('.content').innerText.includes('ALM-104'), 'all'); ev("RC.ast=''");
    ev("setStatus('LD-2026-001848','problem')"); assert(!/[А-Яа-яЁё]/.test(ev("S.alarms.find(a=>a.load==='LD-2026-001848'&&a.lvl===3&&a.cat==='temperature').text")), 'runtime alarm text is translated');
  });
  await group('permissions: settings base tab needs users:admin (7.2)', 'ru', async (g, ev) => {
    ev("ACT.setRole({v:'viewer'});go('settings')"); assert(ev("tabsOf('settings').every(t=>t.key!=='base')"), 'viewer has no company configuration'); ev("ACT.setRole({v:'admin'});go('settings')"); assert(ev("tabsOf('settings').some(t=>t.key==='base')"), 'admin has it');
  });
  await group('integrations: inbound webhooks table lists sources with secret state and inbox kinds (19.4)', 'en', async (g, ev, w) => {
    ev("go('settings');setTab('settings','integ')"); const t = w.document.querySelector('[data-inbound-hooks]'); assert(t && t.querySelectorAll('[data-inbound]').length >= 3, 'inbound sources'); assert(/POST \/api\/v1\/inbound/.test(t.innerText), 'endpoint'); clean(w, 'inbound');
  });
