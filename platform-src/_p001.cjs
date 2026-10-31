const fs=require('fs');
let p='platform-src/v6/base/30-kit.js',k=fs.readFileSync(p,'utf8');
k=k.replace("field: (id, label, type, val, hint) =>","field: (id, label, type, val, hint, attrs) =>").replace("autocomplete=\"off\"${hint ? ` placeholder=\"${esc(hint)}\"` : ''}></label>`,","autocomplete=\"off\"${hint ? ` placeholder=\"${esc(hint)}\"` : ''}${attrs || ''}></label>`,");
if(!k.includes('attrs || ')) throw new Error('kit');
fs.writeFileSync(p,k);
p='platform-src/v6/screens/shell/001-shell-ext.js';let s=fs.readFileSync(p,'utf8');
const rep=(a,b)=>{if(!s.includes(a))throw new Error('missing: '+a.slice(0,70));s=s.replace(a,()=>b)};
const cut=(from,to,b)=>{const i=s.indexOf(from),j=s.indexOf(to);if(i<0||j<0||j<i)throw new Error('cut '+from.slice(0,40));s=s.slice(0,i)+b+s.slice(j);};
rep("codes: [], lastLogin: null };","codes: [], lastLogin: null, stored: {}, fails: 0, used: [] };");
rep("ALWAYS.push('account');","ALWAYS.push('account', 'forbidden');");
// ---------- auth block
cut("  const fld = KIT.field;","  document.addEventListener('input', e => { const t = e.target; if (!t.dataset || !t.dataset.au)",
`  const fld = KIT.field;
  /* 0.3.11 passwords.py: 12..128 characters, no username inside, not a common one, >= 5 distinct characters, differs from the current one */
  const COMMON_PW = ['password1234', '123456789012', 'qwertyuiop12', 'qwerty123456', 'passwort1234', 'administrator', 'admin1234567', 'welcome12345', 'letmein12345', 'iloveyou1234', '1q2w3e4r5t6y', 'qwertyuiopas', '000000000000', '111111111111', 'abc123456789', 'olymp1234567', 'olymplogistic', 'kazakhstan123', 'astana123456', 'almaty123456'];
  const accOf = role => (typeof userOf === 'function' ? userOf(role) : null);
  const mustChange = role => { const u = accOf(role); return !!(u && u.mustChange); };   // set by "new user" and "reset password / 2FA" (450-rec-admin.js)
  const lockedAcc = role => { const u = accOf(role); return !!(u && u.locked); };
  const A_PW = ' maxlength="128" required autocomplete="current-password"', A_NEW = ' minlength="12" maxlength="128" required autocomplete="new-password"';
  const loginLayer = () => {
    if (!S.auth.on) return '';
    const A = S.auth, cyr = LANG === 'ru' || LANG === 'kk', err = A.err ? \`<p class="login-err" role="alert">\${esc(A.err)}</p>\` : '';
    const lang = ['ru', 'de', 'en', 'kk'].map(l => \`<a href="\${fileFor(l)}"\${l === LANG ? ' class="on"' : ''}>\${l.toUpperCase()}</a>\`).join(' ');
    let body = '';
    if (A.step === 'password') body = \`<h1>\${esc(LT('shell.sign_in'))}</h1><p class="note">\${esc(LT('shell.demo_pick_an_account_any_password_th'))}</p>
<label class="fl">\${esc(LT('shell.account'))}<select class="select" id="au_role" data-au="role" autocomplete="username">\${ROLES.map(r => \`<option value="\${r}"\${r === A.role ? ' selected' : ''}>\${esc(USERS[r])} · \${esc(ROLE_NAME[r])}</option>\`).join('')}</select></label>\${fld('au_pw', LT('shell.password'), 'password', A.pw, '••••••••', A_PW)}\${err}<button class="btn primary block" data-act="authPw">\${esc(LT('shell.sign_in_2'))}</button>\`;
    else if (A.step === 'enrol') body = \`<h1>\${esc(LT('shell.set_up_two_factor_protection'))}</h1><p class="note">\${esc(LT('shell.scan_the_qr_code_with_an_authenticat'))}<b>\${DEMO_CODE}</b></p><div class="login-qr" data-enrol-qr>\${qrSvg(A.role)}</div><p class="note">\${esc(LT('shell.key_for_manual_entry'))}: <code data-enrol-key>\${otpKey(A.role)}</code></p>\${fld('au_code', LT('shell.code'), 'text', A.code, '000000', ' inputmode="numeric" autocomplete="one-time-code" maxlength="6" required')}\${err}<button class="btn primary block" data-act="authMfa">\${esc(LT('shell.confirm'))}</button>\`;
    else if (A.step === 'mfa') body = \`<h1>\${esc(LT('shell.second_factor'))}</h1><p class="note">\${esc(LT('shell.enter_the_6_digit_code_from_the_auth'))}<b>\${DEMO_CODE}</b> · \${esc(LT('shell.recovery_code_hint'))}</p>\${fld('au_code', LT('shell.code'), 'text', A.code, '000000', ' inputmode="numeric" autocomplete="one-time-code" maxlength="32" required')}\${err}<button class="btn primary block" data-act="authMfa">\${esc(LT('shell.verify'))}</button>\`;
    else if (A.step === 'recovery') body = \`<h1>\${esc(LT('shell.recovery_codes'))}</h1><p class="note">\${esc(LT('shell.shown_once_each_works_once_store_the'))}</p><ol class="codes">\${A.codes.map(c => \`<li><code>\${c}</code></li>\`).join('')}</ol><button class="btn primary block" data-act="authCodes">\${esc(LT('shell.i_saved_the_codes_continue'))}</button>\`;
    else body = \`<h1>\${esc(LT('shell.change_password'))}</h1><p class="note">\${esc(LT('shell.first_sign_in_set_your_own_password_'))}</p>\${fld('au_cur', LT('shell.current_password'), 'password', A.cur, '', A_PW)}\${fld('au_np', LT('shell.new_password'), 'password', A.np, '', A_NEW)}\${fld('au_np2', LT('shell.repeat_the_password'), 'password', A.np2, '', A_NEW)}\${err}<button class="btn primary block" data-act="authChange">\${esc(LT('shell.save_and_sign_in'))}</button>\`;
    return \`<div class="login-layer" data-login-step="\${A.step}"><div class="login-card card"><div class="brand"><img src="assets/brand/kokzhol-mark.svg" alt="Kökzhol" width="36" height="36"><span><span class="wordmark">\${cyr ? 'көкжол' : 'kökzhol'}</span><span class="claim">\${esc(LT('shell.cold_chain_on_schedule'))}</span></span></div>\${body}<div class="login-foot"><span class="langs">\${lang}</span><button type="button" class="btn grey sm design-btn" data-act="setDesign" title="\${esc(LT('shell.design_switch'))}" aria-label="\${esc(LT('shell.design_switch'))}">\${S.design === 'olymp' ? '◐' : '◑'}</button><span>v\${VERSION} · \${esc(BUILD)}</span></div></div></div>\`;
  };
  const pwCheck = (a, b, username, cur) => {
    const low = a.toLowerCase();
    return a.length < MIN_PW ? LT('shell.at_least_12_characters') : a.length > 128 ? LT('shell.at_most_128_characters')
      : username && low.includes(String(username).toLowerCase()) ? LT('shell.pw_contains_username')
      : COMMON_PW.includes(low) || new Set(a).size < 5 ? LT('shell.pw_too_common')
      : cur && a === cur ? LT('shell.the_new_password_equals_the_current_') : a !== b ? LT('shell.passwords_do_not_match') : '';
  };
  globalThis.pwCheck = pwCheck;
  const aud = (who, decision, reason, code) => { if (typeof audit === 'function') audit('Auth', who, decision, reason || '', code); };
  function finishLogin() {
    const A = S.auth, role = A.role; A.lastLogin = kzNow().toISOString(); const u = accOf(role); if (u) u.last = clockNow().toISOString();
    Object.assign(A, { on: false, step: 'password', pw: '', cur: '', code: '', np: '', np2: '', err: '', codes: [], fails: 0 });
    aud(USERS[role] || role, LT('shell.signed_in'), '', 'auth.login_success'); ACT.setRole({ v: role }); toast(LT('shell.welcome') + ROLE_NAME[role]);
  }
  /* 0.3.11: recovery codes are shown only after enrolment; the forced password change only when must_change_password is set */
  function afterMfa() { const A = S.auth; A.err = ''; if (mustChange(A.role)) { A.step = 'change'; A.cur = ''; A.np = ''; A.np2 = ''; render(); } else finishLogin(); }
  Object.assign(ACT, {
    signOut: () => { const u = USERS[S.role] || S.role; aud(u, LT('shell.sign_out'), '', 'auth.logout'); S.auth = Object.assign(S.auth, { on: true, step: 'password', role: S.role, pw: '', cur: '', code: '', np: '', np2: '', err: '', codes: [], fails: 0 }); S.drawer = null; S.diag = null; S.sideOpen = false; render(); },
    authPw: () => { const A = S.auth, who = USERS[A.role] || A.role; if (!A.pw) { A.err = LT('shell.enter_the_password'); return render(); } if (lockedAcc(A.role)) { A.err = LT('shell.account_locked'); aud(who, LT('shell.login_failed_short'), 'locked', 'auth.login_failed'); return render(); } A.err = ''; A.step = (S.auth.enrolled || ENROLLED).includes(A.role) ? 'mfa' : 'enrol'; A.code = ''; render(); },
    authMfa: () => {
      const A = S.auth, who = USERS[A.role] || A.role, c = A.code.trim(), rc = c.toUpperCase();
      const rec = !!c && A.step === 'mfa' && mkCodes(who).includes(rc) && !A.used.includes(rc);   // a recovery code works once
      if (c !== DEMO_CODE && !rec) {
        A.fails++; aud(who, LT('shell.mfa_failed'), A.step, 'auth.mfa_failed');
        if (A.fails >= 5) { const u = accOf(A.role); if (u) u.locked = true; A.fails = 0; A.step = 'password'; A.err = LT('shell.account_locked'); } else A.err = LT('shell.wrong_code_demo_code_123456');
        return render();
      }
      A.fails = 0; if (rec) A.used.push(rc);
      if (A.step === 'enrol') { S.auth.enrolled = (S.auth.enrolled || ENROLLED).concat(A.role); aud(who, LT('shell.2fa_set_up'), '', 'auth.mfa_enabled'); A.codes = mkCodes(who); A.step = 'recovery'; A.err = ''; return render(); }
      afterMfa();
    },
    authCodes: () => afterMfa(),
    authChange: () => { const A = S.auth, who = USERS[A.role] || A.role, e = !A.cur ? LT('shell.enter_the_current_password') : A.cur !== A.pw ? LT('shell.current_password_is_wrong') : A.np === A.cur ? LT('shell.the_new_password_equals_the_current_') : pwCheck(A.np, A.np2, who, A.cur); if (e) { A.err = e; return render(); } const u = accOf(A.role); if (u) u.mustChange = false; A.stored[A.role] = A.np; aud(who, LT('shell.password_change'), '', 'auth.password_changed'); finishLogin(); },
    acctPw: () => { const who = USERS[S.role] || S.role, st = S.auth.stored[S.role], e = !String(S.acct.cp || '').length ? LT('shell.enter_the_current_password') : st && S.acct.cp !== st ? LT('shell.current_password_is_wrong') : pwCheck(S.acct.np, S.acct.np2, who, S.acct.cp); S.acct.ok = !e; S.acct.msg = e || LT('shell.password_changed_demo'); if (!e) { S.auth.stored[S.role] = S.acct.np; S.acct.cp = ''; S.acct.np = ''; S.acct.np2 = ''; aud(who, LT('shell.password_change'), '', 'auth.password_changed'); } render(); },
    resetAsk: () => { S.resetAsk = !S.resetAsk; render(); },
    resetGo: () => { demoReset(); },
  });
`);
// account password field attrs
rep("id=\"ac_np\" data-ac=\"np\" type=\"password\" value=\"${esc(S.acct.np)}\" autocomplete=\"new-password\">","id=\"ac_np\" data-ac=\"np\" type=\"password\" value=\"${esc(S.acct.np)}\" autocomplete=\"new-password\" minlength=\"12\" maxlength=\"128\" required>");
rep("id=\"ac_np2\" data-ac=\"np2\" type=\"password\" value=\"${esc(S.acct.np2)}\" autocomplete=\"new-password\" maxlength=\"128\">","id=\"ac_np2\" data-ac=\"np2\" type=\"password\" value=\"${esc(S.acct.np2)}\" autocomplete=\"new-password\" minlength=\"12\" maxlength=\"128\" required>");
// ---------- demo reset
cut("  /* Reset demo data: re-seed","  globalThis.demoReset = demoReset;",
`  /* Reset demo data (0.3.11 resetDemo restores the whole snapshot): the core arrays are re-seeded, every record store is restored from the
     snapshot taken once all screen files have run; other areas can push their own function to HOOKS.reset. Outside the test harness the page reloads. */
  HOOKS.reset = HOOKS.reset || [];
  const SNAP_KEYS = ['users', 'oncall', 'alarms', 'inbox', 'audit', 'bookings', 'apiKeys', 'integ', 'webhooks', 'claims', 'devs'];
  let SNAP = null;
  const snapshot = () => { SNAP = {}; SNAP_KEYS.forEach(k => { try { if (S[k] !== undefined) SNAP[k] = JSON.stringify(S[k]); } catch (_) { /* not plain data */ } }); SNAP.seq = typeof REC !== 'undefined' ? REC.seq : 0; };
  function demoReset() {
    S.loads = mkLoads(); S.drivers = mkDrivers(); S.trucks = mkTrucks(); S.hubs = mkHubs(); S.jobs = mkJobs();
    if (SNAP) { SNAP_KEYS.forEach(k => { if (SNAP[k] !== undefined) S[k] = JSON.parse(SNAP[k]); }); if (typeof REC !== 'undefined') REC.seq = SNAP.seq; }
    HOOKS.reset.forEach(f => { try { f(); } catch (e) { console.error(e); } });
    S.hub = ''; S.gs.q = ''; S.drawer = null; S.diag = null; S.resetAsk = false; S.f = { q: '', status: '', cust: '', zone: '', pri: '', hub: '', drv: '', page: 1 };
    if (typeof audit === 'function') audit('Demo', 'reset', LT('shell.demo_data_reset'), '', 'demo.reset');
    if (typeof window !== 'undefined' && !window.frameElement) { location.reload(); return; }
    toast(LT('shell.demo_data_reset_2'));
  }
`);
// ---------- deep links + history + records + 403
cut("  /* ---------- 6. deep links (FR-175)","  /* ---------- overlays + render hook",
`  /* ---------- 403 page and the /records landing page (10.1) ---------- */
  SCREENS.forbidden = {
    title: () => LT('shell.no_access_403'),
    body: () => \`<section class="card card-body forbidden" data-page="forbidden" data-status="403" role="alert"><p class="note">\${esc(LT('shell.forbidden_text'))}</p><button type="button" class="btn primary" data-act="go" data-v="\${homeRoute()}" data-forbidden-home>\${esc(LT('shell.go_to_start'))}</button></section>\`,
  };
  const RGROUPS = () => [
    [T('Заказы и рейсы', 'Aufträge und Fahrten', 'Orders and trips', 'Тапсырыстар мен рейстер'), T('Бронирования клиентов, покрытие сети, линии и тарифы, планирование мощностей.', 'Kundenbuchungen, Netzabdeckung, Linien und Tarife, Kapazitätsplanung.', 'Customer bookings, network coverage, lines and tariffs, capacity planning.', 'Клиент броньдары, желі қамтуы, желілер мен тарифтер, қуат жоспарлау.'), [['orders', 'bookings'], ['routes', 'coverage'], ['routes', 'lines'], ['dispatch', 'planning']]],
    [T('Холодовая цепь и безопасность', 'Kühlkette und Sicherheit', 'Cold chain and safety', 'Суық тізбек және қауіпсіздік'), T('Тревоги, дежурства по уровням эскалации, страховые случаи.', 'Alarme, Bereitschaft je Eskalationsstufe, Versicherungsfälle.', 'Alarms, on-call roster per escalation level, insurance claims.', 'Дабылдар, эскалация деңгейлері бойынша кезекшілік, сақтандыру жағдайлары.'), [['dashboard', 'alarms'], ['settings', 'oncall'], ['billing', 'insurance']]],
    [T('CRM', 'CRM', 'CRM', 'CRM'), T('Лиды, сделки, клиенты и задачи.', 'Leads, Abschlüsse, Kunden und Aufgaben.', 'Leads, deals, customers and tasks.', 'Лидтер, мәмілелер, клиенттер және тапсырмалар.'), [['orders', 'commercial']]],
    [T('Справочники', 'Stammdaten', 'Registers', 'Анықтамалықтар'), T('Места, партнёры, ставки, пороги и ограничения с версиями и вторым согласованием.', 'Orte, Partner, Sätze, Schwellen und Beschränkungen mit Versionen und zweiter Freigabe.', 'Places, partners, rates, thresholds and restrictions with versions and a second approval.', 'Орындар, серіктестер, мөлшерлемелер, шектер және шектеулер нұсқалармен.'), [['settings', 'ref']]],
    [T('Администрирование', 'Verwaltung', 'Administration', 'Әкімшілік'), T('Пользователи и роли, журнал аудита.', 'Benutzer und Rollen, Audit-Protokoll.', 'Users and roles, audit log.', 'Пайдаланушылар мен рөлдер, аудит журналы.'), [['settings', 'users'], ['settings', 'audit']]],
    [T('Каналы', 'Kanäle', 'Channels', 'Арналар'), T('Входящие сообщения внешних систем и каталог интеграций.', 'Eingang externer Systeme und Integrationskatalog.', 'Inbox of external systems and the integrations catalogue.', 'Сыртқы жүйелердің кіріс хабарлары және интеграциялар каталогы.'), [['dashboard', 'inbox'], ['settings', 'integ']]],
  ];
  const recTab = ([s, k]) => (canSee(s) ? tabsOf(s).find(t => t.key === k) : null);
  globalThis.recordsNavHtml = () => {
    if (SHELL_NAV[S.role]) return '';
    const items = RGROUPS().flatMap(g => g[2]).map(x => [x, recTab(x)]).filter(x => x[1]); if (!items.length) return '';
    const head = canSee('records') ? \`<a class="side-h side-h-link\${S.route === 'records' ? ' on' : ''}" data-act="go" data-v="records" role="link" tabindex="0" data-nav-records>\${esc(LT('shell.records_admin'))}</a>\` : \`<div class="side-h">\${esc(LT('shell.records_admin'))}</div>\`;
    return \`<div class="side-tools rec-nav">\${head}\${items.map(([x, t]) => \`<a class="side-link\${S.route === x[0] && tabKey() === x[1] ? ' on' : ''}" data-act="helpOpen" data-s="\${x[0]}" data-t="\${x[1]}" role="link" tabindex="0"><span>\${esc(t.label)}</span></a>\`).join('')}</div>\`;
  };
  SCREENS.records = {
    title: () => LT('shell.records_admin'),
    sub: () => T('Журналы, справочники и администрирование — страницы, которых нет среди ежедневных экранов.', 'Register, Stammdaten und Verwaltung — Seiten, die nicht zu den täglichen Bildschirmen gehören.', 'Logs, master data and administration — pages that are not among the daily screens.', 'Журналдар, анықтамалықтар және әкімшілік — күнделікті экрандарға кірмейтін беттер.'),
    body: () => {
      const cards = RGROUPS().map(g => [g[0], g[1], g[2].filter(recTab)]).filter(g => g[2].length).map(g => \`<div class="card card-body rec-card" data-rec-group><h3 style="margin:0 0 6px">\${esc(g[0])}</h3><p class="note">\${esc(g[1])}</p><div class="actbar">\${g[2].map(x => \`<button type="button" class="btn grey sm" data-act="helpOpen" data-s="\${x[0]}" data-t="\${x[1]}">\${esc(recTab(x).label)} →</button>\`).join('')}</div></div>\`).join('');
      return \`<div class="rec-grid" data-records>\${cards}</div>\${typeof HELP !== 'undefined' && HELP.visuals.split ? \`<figure class="hv" data-visual="split">\${HELP.visuals.split()}</figure>\` : ''}\`;
    },
  };

  /* ---------- 6. deep links (FR-175) and the browser history (BUG-31): ?s=&t= + the selected record live in the URL ---------- */
  const SAFE = /^[\\w.:\\- ]{1,40}$/;
  const MANAGED = ['s', 't', 'load', 'trip', 'dev', 'fine', 'veh', 'city', 'item', 'alarm', 'order', 'booking', 'help', 'k', 'view', 'r'];
  let applying = false;
  const H = { key: null };
  const forbid = () => { S.route = 'forbidden'; S.drawer = null; S.diag = null; render(); return true; };
  /* one resolver for the first load, links and Back / Forward; returns false when the URL is not ours (public pages) */
  function applyUrl() {
    const sp = new URLSearchParams(location.search); if (sp.get('track') || sp.get('request')) return false;
    const r = sp.get('r'); if (r) { const m = /^(trip|order|booking|alarm|deviation|help):(.+)$/.exec(r); const key = m && { trip: 'load', order: 'order', booking: 'booking', alarm: 'alarm', deviation: 'dev', help: 'help' }[m[1]]; if (!key) return forbid(); sp.set(key, m[2]); }
    if (MANAGED.some(k => sp.has(k) && !SAFE.test(sp.get(k)))) return forbid();   // id sanitising as in 0.3.11 DeepLink.tsx
    const s = sp.get('s'), t0 = sp.get('t') || sp.get('view'), ld = sp.get('load') || sp.get('trip'), dev = sp.get('dev'), fine = sp.get('fine'), veh = sp.get('veh'), city = sp.get('city'), item = sp.get('item'), alarm = sp.get('alarm'), order = sp.get('order'), booking = sp.get('booking'), help = sp.get('help');
    S.drawer = null; S.diag = null;
    const tabOk = (scr, t) => !!t && tabsOf(scr).some(x => x.key === t);
    if (ld) {
      const l = S.loads.find(x => numMatch(x.id, ld) === 2) || S.loads.find(x => numMatch(x.id, ld)); const scr = s && SCREENS[s] ? s : 'orders';
      if (!l || !canSee(scr)) return forbid();
      S.route = scr;
      if (scr === 'orders' && ['ship', 'docs', 'loadw'].includes(t0) && tabOk('orders', t0)) { S.tab.orders = t0; if (S.ops) { if (t0 === 'ship') { S.ops.shipLoad = l.id; S.ops.shipSel = sp.get('item') || null; } else if (t0 === 'docs') S.ops.docSel = l.id; else S.ops.sel = l.id; } }
      else { if (scr === 'orders') S.tab.orders = tabOk('orders', t0) ? t0 : 'orders'; else if (tabOk(scr, t0)) S.tab[scr] = t0; S.drawer = { type: 'load', id: l.id, tab: 'overview' }; }
      render(); return true;
    }
    if (dev) { if (!canSee('pod') || !(S.devs || []).some(d => d.id === dev)) return forbid(); S.tab.pod = 'quality'; S.route = 'pod'; if (ACT.qDev) ACT.qDev({ id: dev }); else render(); return true; }
    if (fine) { if (!canSee('reports') || !(S.eco && S.eco.fines && S.eco.fines.some(f => f.id === fine))) return forbid(); S.tab.reports = 'fines'; S.eco.fineSel = fine; S.route = 'reports'; render(); return true; }
    /* R1 · 0.3.9 SEL_PARAM and /r/:type/:id: ?veh= (Temperature, or Security with t=sec), ?city= (Weather), ?item= (package / line on Shipments), ?alarm=, ?order=, ?booking=, ?help= */
    if (veh) { const tr = S.trucks.find(x => x.id === veh || norm(x.plate) === norm(veh)); if (!canSee('routes') || !tr) return forbid(); S.tab.routes = ['sec', 'temp', 'thermochron'].includes(t0) && tabOk('routes', t0) ? t0 : 'temp'; S.route = 'routes'; if (ACT.thSel) ACT.thSel({ id: tr.id }); else render(); return true; }
    if (city) { const h = city.toUpperCase(); if (!canSee('routes') || (!HUBS[h] && !(globalThis.ROAD_CITY && ROAD_CITY[h]))) return forbid(); S.tab.routes = 'wx'; S.route = 'routes'; if (ACT.wxCity) ACT.wxCity({ id: h }); else render(); return true; }
    if (item) { const rr = canSee('orders') && (gsLines(item).find(x => x.exact) || gsDb(item).find(x => x.exact && (x.type === 'package' || x.type === 'order'))); if (!rr) return forbid(); gsGo(rr, false); return true; }
    if (alarm) { const n = alarm.replace(/^ALM-/i, ''); const a = (S.alarms || []).find(x => numMatch(x.id, n) === 2); if (!canSee('dashboard') || !tabsOf('dashboard').some(x => x.key === 'alarms') || !a) return forbid(); S.tab.dashboard = 'alarms'; S.route = 'dashboard'; if (typeof RC !== 'undefined') RC.ast = 'all'; S.drawer = { type: 'alarm', id: a.id }; render(); return true; }
    if (order) { if (!canSee('orders') || !tabsOf('orders').some(x => x.key === 'rec') || (typeof findOrder === 'function' && !findOrder(order))) return forbid(); S.tab.orders = 'rec'; if (S.ops) S.ops.orq = order; S.route = 'orders'; render(); return true; }
    if (booking) {
      if (canSee('orders') && tabsOf('orders').some(x => x.key === 'bookings')) { if (!(S.bookings || []).some(b => b.id === booking)) return forbid(); S.tab.orders = 'bookings'; S.route = 'orders'; if (DRAWERS.booking) S.drawer = { type: 'booking', id: booking }; render(); return true; }
      if (SCREENS.mybookings && canSee('mybookings') && (S.bookings || []).some(b => b.id === booking)) { S.route = 'mybookings'; render(); return true; }
      return forbid();
    }
    if (help || (s === 'help' && sp.get('k'))) { const key = help || sp.get('k'); if (typeof helpArt === 'function' && !helpArt(key)) return forbid(); S.help.key = key; S.help.q = ''; S.route = 'help'; render(); return true; }
    if (s) { if (!SCREENS[s]) return forbid(); S.route = canSee(s) ? s : homeRoute(); if (S.route === s && tabOk(s, t0)) S.tab[s] = t0; render(); return true; }
    S.route = H.home || S.route; render(); return true;
  }
  globalThis.applyDeepLinks = () => { applying = true; try { return applyUrl(); } finally { applying = false; H.key = navKey(); } };
  const navKey = () => S.route + '|' + tabKey() + '|' + (S.route === 'help' ? S.help.key : '');
  /* what the URL says about the screen: selected record(s) of the route */
  function selection() {
    const sel = {}, d = S.drawer, tk = tabKey();
    if (d && d.id) { if (d.type === 'load') sel.load = d.id; else if (d.type === 'alarm') sel.alarm = d.id; else if (d.type === 'booking') sel.booking = d.id; }
    if (S.route === 'routes') { if ((tk === 'temp' || tk === 'sec' || tk === 'thermochron') && S.thermo && S.thermo.sel) sel.veh = S.thermo.sel; if (tk === 'wx' && S.wx && S.wx.sel) sel.city = S.wx.sel; }
    else if (S.route === 'reports' && tk === 'fines' && S.eco && S.eco.fineSel) sel.fine = S.eco.fineSel;
    else if (S.route === 'pod' && tk === 'quality' && S.selDev) sel.dev = S.selDev;
    else if (S.route === 'orders' && S.ops && !sel.load) { const v = tk === 'ship' ? S.ops.shipLoad : tk === 'docs' ? S.ops.docSel : tk === 'loadw' ? S.ops.sel : null; if (typeof v === 'string' && SAFE.test(v)) sel.load = v; if (tk === 'ship' && S.ops.shipSel && SAFE.test(String(S.ops.shipSel))) sel.item = S.ops.shipSel; }
    else if (S.route === 'help' && S.help.key) sel.k = S.help.key;
    return sel;
  }
  function urlFor() {
    if (['track', 'request', 'forbidden'].includes(S.route)) return null;
    const sp = new URLSearchParams(location.search); MANAGED.forEach(k => sp.delete(k));
    sp.set('s', S.route); const tk = tabKey(); if (tk) sp.set('t', tk);
    Object.entries(selection()).forEach(([k, v]) => { if (v != null && v !== '') sp.set(k, v); });
    return '?' + sp.toString().replace(/%3A/g, ':');
  }
  /* a new screen / tab / article is a new history entry (PUSH); a selection inside it only rewrites the entry (REPLACE, like SelSync) */
  function syncUrl() {
    if (applying || typeof history === 'undefined' || !history.replaceState || (S.auth && S.auth.on)) return;
    const q = urlFor(); if (q == null) return;
    const nk = navKey(); if (q === location.search) { H.key = nk; return; }
    try {
      if (H.key != null && nk !== H.key) { const m = $('main'); history.replaceState(Object.assign({}, history.state, { y: m ? m.scrollTop : 0 }), ''); history.pushState({ y: 0 }, '', q); }
      else history.replaceState(history.state || {}, '', q);
    } catch (_) { /* file:// or sandboxed frame: no history API */ }
    H.key = nk;
  }
  window.addEventListener('popstate', e => {
    applying = true;
    try { if (!applyUrl()) return; } finally { applying = false; }
    H.key = navKey(); const y = e.state && e.state.y;
    if (y != null) setTimeout(() => { const m = $('main'); if (m) m.scrollTop = y; }, 0);
  });
  /* language switch keeps the state (1.6): the choice is stored, role / hub / tabs travel in sessionStorage, the URL carries screen and selection */
  const saveState = () => { try { sessionStorage.setItem('olymp.state', JSON.stringify({ t: Date.now(), role: S.role, hub: S.hub, route: S.route, tab: S.tab, design: S.design, auth: S.auth.on ? { step: S.auth.step, role: S.auth.role } : null })); } catch (_) { /* storage blocked */ } };
  function restoreState() {
    try {
      const j = sessionStorage.getItem('olymp.state'); if (!j) return; sessionStorage.removeItem('olymp.state');
      const o = JSON.parse(j); if (!o || Date.now() - o.t > 20000) return;
      if (ROLES.includes(o.role)) S.role = o.role; if (o.hub === '' || HUBS[o.hub]) S.hub = o.hub; if (o.tab) Object.assign(S.tab, o.tab);
      if (o.design === 'olymp' || o.design === 'kokzhol') { S.design = o.design; document.documentElement.dataset.design = o.design; }
      if (o.route && SCREENS[o.route] && canSee(o.route)) S.route = o.route;
      if (o.auth && ROLES.includes(o.auth.role)) { S.auth.on = true; S.auth.step = o.auth.step === 'recovery' ? 'password' : o.auth.step; S.auth.role = o.auth.role; }
    } catch (_) { /* damaged state */ }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('.langs a[href]'); if (!a) return;
    const l = a.textContent.trim().toLowerCase(); if (!/^(ru|de|en|kk)$/.test(l)) return;
    saveState(); try { if (!window.frameElement) localStorage.setItem('olymp.lang', l); } catch (_) { /* private mode */ }
    e.preventDefault(); location.href = a.getAttribute('href') + location.search + location.hash;
  });
  (function langStart() {   // ?lang=xx wins, else the stored choice opens the matching bundle from index.html
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q && /^(ru|de|en|kk)$/.test(q)) { if (!window.frameElement) localStorage.setItem('olymp.lang', q); if (q !== LANG) location.replace(fileFor(q) + location.search + location.hash); }
      else if (!window.frameElement && LANG === 'ru' && /(^|\\/)(index\\.html)?$/.test(location.pathname)) { const st = localStorage.getItem('olymp.lang'); if (/^(de|en|kk)$/.test(st || '')) location.replace(fileFor(st) + location.search + location.hash); }
    } catch (_) { /* storage blocked */ }
  })();
  (function designStart() {   // the design choice survives a reload (not inside test frames)
    const sd = ACT.setDesign; if (typeof sd === 'function') ACT.setDesign = d => { sd(d); try { if (!window.frameElement) localStorage.setItem('olymp.design', S.design); } catch (_) { /* private mode */ } };
    try { const st = !window.frameElement && localStorage.getItem('olymp.design'); if ((st === 'olymp' || st === 'kokzhol') && st !== S.design) { S.design = st; document.documentElement.dataset.design = st; } } catch (_) { /* private mode */ }
  })();
  document.addEventListener('DOMContentLoaded', () => {
    H.home = S.route;
    if (ACT.qDev) { const q = ACT.qDev; ACT.qDev = d => { S.selDev = d.id; return q(d); }; }   // the quality screen keeps its selection private: remember it for the URL
    snapshot(); restoreState();
    applying = true; try { applyUrl(); } finally { applying = false; }
    H.key = null; syncUrl();
  });

`);
// ---------- title + url sync in the render hook
rep("document.title = [S.drawer && S.drawer.id, navLabel(S.route), 'Kökzhol'].filter(Boolean).join(' · ');","document.title = docTitle(); syncUrl();\n    if (S.auth.on && S.auth.step !== loginStep) { loginStep = S.auth.step; const f = $('.login-layer input, .login-layer select'); if (f) f.focus(); } else if (!S.auth.on) loginStep = null;");
rep("  function shellAfter() {","  let loginStep = null;\n  /* 0.3.11 docTitle.ts: \"<record> · <tab> · <NN screen> · brand\"; help \"Help · <article> · brand\"; 403 and account pages by name; adjacent repeats dropped */\n  function docTitle() {\n    const brand = 'Kökzhol', sc = SCREENS[S.route], parts = [];\n    if (S.route === 'forbidden') parts.push('403');\n    else if (S.route === 'help') { const a = typeof helpArt === 'function' ? helpArt(S.help.key) : null; parts.push(LT('core.help'), a ? tx(a.title) : null); }\n    else if (S.route === 'account' || S.route === 'records') parts.push(navLabel(S.route));\n    else { const sel = selection(), rec = (S.drawer && S.drawer.id) || sel.load || sel.alarm || sel.booking || sel.dev || sel.fine || sel.veh || sel.city; const tabs = sc && sc.tabs ? tabsOf(S.route) : [], ct = tabs.length > 1 ? curTab(S.route) : null; const e = eyeOf(); parts.push(rec, ct && ct.label, ((e && e[0]) ? e[0] + ' ' : '') + navLabel(S.route)); }\n    parts.push(brand); return parts.filter((x, i, a) => x && x !== a[i - 1]).join(' · ');\n  }\n  function shellAfter() {");
fs.writeFileSync(p,s);console.log('ok');
