/* P6 · Shell parity with 0.3.10 (docs/PARITY-0.3.10-v6.md, shell rows): hub filter segment + hubFilter() helper, global search combobox
   with scanner mode (FR-74 / FR-163), clock + business date, "N active alarms" button and alarm banner (FR-131), phone bottom bar
   (FR-133), Escape closes drawers / sidebar, eyebrow "NN · subtitle" with the 0.3.10 screen number per tab, "◇ Diagram" popover with
   HELP.visuals, deep links ?load= ?dev= ?fine= ?s=&t= + document.title (FR-175), demo sign-in (password → 2FA → recovery codes →
   forced change ≥ 12) ending in setRole, "My account" page, Sign out, Reset demo data. Bundled before the other screens; core.js calls
   the hooks shellSearchBox / shellTopExtra / shellEyebrow / shellOverlays and gsInput when they exist. Mock-up only: no backend. */
(function () {
  S.hub = ''; S.gs = { q: '', idx: 0, arch: false, scan: false }; S.diag = null; S.ban = { seen: null, items: [] }; S.resetAsk = false;
  S.auth = { on: false, step: 'password', role: 'admin', pw: '', cur: '', code: '', np: '', np2: '', err: '', codes: [], lastLogin: null, stored: {}, fails: 0, used: [] };
  S.acct = { cp: '', np: '', np2: '', msg: '', ok: false };
  ALWAYS.push('account', 'forbidden');   // "My account" is reachable for every role, incl. the role shells

  /* ---------- 1. hub filter (0.3.10: All hubs / Astana / Almaty on every screen; v6 has five hubs) ---------- */
  const HUBK = () => Object.keys(HUBS);
  /* hubFilter(items, field): field = property name (default 'hub') or a function returning a hub code or an array of codes */
  globalThis.hubFilter = (items, field) => {
    if (!S.hub) return items;
    const f = typeof field === 'function' ? field : (x => x[field || 'hub']);
    return items.filter(x => { const v = f(x); return Array.isArray(v) ? v.includes(S.hub) : v === S.hub; });
  };
  globalThis.hubOfLoad = l => [l.from, l.to];
  const hubSeg = () => `<div class="hubseg" role="group" aria-label="Hub" data-hub="${S.hub}">${[['', LT('shell.all_hubs')]].concat(HUBK().map(h => [h, h])).map(o => `<button type="button" class="hs${S.hub === o[0] ? ' on' : ''}" data-act="hubSet" data-v="${o[0]}" aria-pressed="${S.hub === o[0]}" title="${esc(o[0] ? HUBS[o[0]].name : LT('shell.all_screens_all_hubs'))}">${esc(o[1])}</button>`).join('')}</div>`;
  ACT.hubSet = d => { S.hub = d.v; S.drawer = null; S.f.page = 1; render(); };

  /* ---------- 3. clock (demo clock, FR-206: business instant NOW + time since load, shown as Kazakhstan time UTC+5) + business date of the demo, "N active alarms" ---------- */
  const kzNow = () => { const d = clockNow(); return new Date(d.getTime() + (d.getTimezoneOffset() + 300) * 60000); };
  const clockTxt = () => { const d = kzNow(); return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); };
  const bizDate = () => { const WD = LT('shell.mon_tue_wed_thu_fri_sat_sun').split(','); return WD[(NOW.getDay() + 6) % 7] + ' ' + fd(NOW); };
  if (typeof window !== 'undefined' && !window.frameElement) setInterval(() => { const e = $('[data-clock]'); if (e && !document.hidden) e.textContent = clockTxt(); }, 1000);
  /* R1 · 0.3.9 counts only alarms of level ≥ 2 (risk, critical) on the header button */
  const activeAlarms = () => (S.alarms ? S.alarms.filter(a => a.status !== 'closed' && (a.lvl == null || a.lvl >= 2)).length : alertsCount());
  globalThis.activeAlarms = activeAlarms;
  ACT.alarmsGo = () => { if (tabsOf('dashboard').some(t => t.key === 'alarms')) S.tab.dashboard = 'alarms'; go('dashboard'); };
  /* hub segment + clock sit in core's ".tb-x" box: inline on wide windows, behind the "⋯" button on narrow ones (Q4); the alarms button always stays */
  globalThis.shellTopMore = () => `${hubSeg()}<span class="clock" title="${esc(LT('shell.kazakhstan_time_business_date_of_the'))}"><b data-clock>${clockTxt()}</b><small data-bizdate>${esc(bizDate())} · ${esc(LT('shell.astana_utc5'))}</small></span>`;
  globalThis.shellTopExtra = () => {
    const n = activeAlarms();
    return `<button type="button" class="btn sm alarms-btn ${n ? 'red' : 'grey'}" data-act="alarmsGo" data-alarms="${n}" title="${esc(LT('shell.open_the_alarms'))}">${n}<span class="al-t"> ${esc(LT('shell.active_alarms'))}</span></button>`;
  };

  /* ---------- 2. global search combobox: "In current shipments" + "In the database", keyboard, scanner rule ---------- */
  const norm = s => String(s == null ? '' : s).toLowerCase().replace(/[\s\-_./]/g, '');
  const digits = s => String(s == null ? '' : s).replace(/\D/g, '');
  /* number variants (FR-163): 1847 · ld1847 · LD-2026-001847 · bk-26-4 → 2 = exact, 1 = partial, 0 = no */
  const numMatch = (id, q) => {
    const a = norm(id), b = norm(q); if (!b) return 0;
    if (a === b) return 2;
    const da = digits(id), db = digits(q);
    const lt = s => (String(s).match(/\d+/g) || []).pop(), ta = lt(id), tb = lt(q);
    if (ta && tb && tb.length >= 3 && +ta === +tb && /[a-z]/i.test(q)) return 2;   // ld-2026-1847 → last number group
    if (db && da && (+da === +db || (db.length >= 4 && da.endsWith(db) && +da.slice(-6) === +db))) return 2;
    if (a.includes(b)) return 1;
    if (db.length >= 3 && da.endsWith(db)) return 1;
    return 0;
  };
  globalThis.gsNumMatch = numMatch;
  const TYPE = { order: LT('shell.order'), load: LT('shell.load'), package: LT('shell.package'), booking: LT('shell.booking') };
  function gsLines(q) {   // in current shipments: goods, PO, PL, article, LOT, SSCC (archive toggle adds delivered loads)
    const out = []; if (typeof ops !== 'function') return out;
    const ql = q.toLowerCase(), qn = norm(q), dq = digits(q), sscc = typeof ssccFromScan === 'function' ? ssccFromScan(q) : null;
    for (const l of hubFilter(S.loads, hubOfLoad)) {   // 0.3.11 search.ts: results respect the hub segment
      if (!S.gs.arch && l.status === 'delivered') continue;
      for (const o of ops(l).orders) {
        const hit = (what, val, exact, p, x) => { x = x || o.lines[0] || {}; out.push({ kind: 'line', load: l.id, order: o.id, mfr: o.mfr, what, hit: val, sscc: p || null, exact: !!exact, name: x.name || '', art: x.art || '', lot: x.lot || '', qty: x.qty || 0, to: o.city || o.to || '' }); };
        if (norm(o.po).includes(qn)) hit('PO', o.po, norm(o.po) === qn);
        if (norm(o.pl).includes(qn)) hit('PL', o.pl, norm(o.pl) === qn);
        for (const x of o.lines) {
          if (norm(x.art).includes(qn)) hit(LT('shell.article'), x.art, norm(x.art) === qn, null, x);
          else if (String(x.name).toLowerCase().includes(ql)) hit(LT('shell.goods'), x.name, false, null, x);
          if (norm(x.lot).includes(qn)) hit('LOT', x.lot, norm(x.lot) === qn, null, x);
        }
        if (dq.length >= 4) for (const p of o.places) if (p.sscc.includes(dq)) hit('SSCC', p.sscc, p.sscc === (sscc || dq), p.sscc);
      }
    }
    /* R1 · 0.3.9: up to 12 rows, the header counts every match */
    const all = out.sort((a, b) => b.exact - a.exact), r = all.slice(0, 12); r.total = all.length; return r;
  }
  function gsDb(q) {   // in the database: orders, loads, packages, bookings
    const out = [], add = (type, id, label, m, extra) => { if (m) out.push(Object.assign({ kind: 'db', type, id, label, exact: m === 2 }, extra)); };
    if (!canDo('orders:read')) { out.total = 0; return out; }   // 0.3.11 Shell.tsx: the "In the database" section needs orders:read
    const loads = hubFilter(S.loads, hubOfLoad);
    loads.forEach(l => add('load', l.id, HUBS[l.from].city + ' → ' + HUBS[l.to].city + ' · ' + ST[l.status].l, numMatch(l.id, q), { load: l.id }));
    if (typeof ops === 'function') loads.forEach(l => ops(l).orders.forEach(o => add('order', o.id, l.id + ' · ' + o.city + ' · ' + o.pal + ' pal', numMatch(o.id, q), { load: l.id, order: o.id })));
    const d = digits(q); if (d.length >= 6 && typeof opsPlaces === 'function') loads.forEach(l => opsPlaces(l).forEach(p => { if (p.sscc.includes(d)) add('package', p.sscc, l.id + ' · ' + p.order, p.sscc === d ? 2 : 1, { load: l.id, sscc: p.sscc, order: p.order }); }));
    hubFilter(S.bookings || [], b => [b.from, b.to]).forEach(b => add('booking', b.id, ((HUBS[b.from] || {}).city || b.from || '') + ' → ' + ((HUBS[b.to] || {}).city || b.to || '') + ' · ' + (b.status || ''), numMatch(b.id, q), { booking: b.id }));
    const all = out.sort((a, b) => b.exact - a.exact), r = all.slice(0, 8); r.total = all.length; return r;   // header counts every match, list shows 8
  }
  const gsAll = () => { const q = S.gs.q.trim(); if (q.length < 2) return { L: [], D: [], all: [] }; const L = gsLines(q), D = gsDb(q); return { L, D, all: L.concat(D) }; };
  globalThis.gsResults = gsAll;
  const logo = m => (typeof MFRS !== 'undefined' && MFRS[m] && MFRS[m].logo) ? `<span class="mlogo img gs-logo" title="${esc(MFRS[m].name)}"><img src="${mfrSrc(m)}" alt="${esc(MFRS[m].name)}" loading="lazy"></span>` : `<span class="gs-type">${esc(m || '')}</span>`;
  const plateOf = id => { const l = load(id); return l && l.truck ? trk(l.truck).plate : '—'; };
  /* current location of the goods: hub before departure, "en route" while under way, the destination after delivery */
  const locOf = id => { const l = load(id); if (!l) return '—'; return l.status === 'delivered' ? LT('shell.delivered') : ['in_transit', 'problem'].includes(l.status) ? LT('shell.en_route') : HUBS[l.from].name; };
  globalThis.shellSearchBox = () => {
    const { L, D } = gsAll(), open = S.gs.q.trim().length >= 2;
    const row = (r, i) => `<div class="gs-row${i === S.gs.idx ? ' on' : ''}${r.exact ? ' exact' : ''}" role="option" id="gs-${i}" aria-selected="${i === S.gs.idx}" data-act="gsOpen" data-i="${i}">${r.kind === 'line'
      ? `${logo(r.mfr)}<span class="gs-main"><b>${esc(r.what)}: ${esc(r.hit)}</b><small>${r.load} · ${esc(plateOf(r.load))} · ${esc(ST[load(r.load).status].l)}</small>${r.name ? `<small class="gs-l2" data-gs-goods>${esc(r.name)}</small>` : ''}<small class="gs-l3" data-gs-where>${esc([r.art, r.lot ? 'LOT ' + r.lot : '', r.qty ? r.qty + ' ' + LT('shell.pcs') : ''].filter(Boolean).join(' · '))} → ${esc(r.to)} · ${esc(locOf(r.load))}</small></span>`
      : `<span class="gs-type">${esc(TYPE[r.type])}</span><span class="gs-main"><b>${esc(r.id)}</b><small>${esc(r.label)}</small></span>`}${r.exact ? '<span class="chip green">=</span>' : ''}</div>`;
    const empty = `<div class="gs-empty">${esc(LT('shell.no_matches'))}</div>`;
    const list = open ? `<div class="gs-list" role="listbox" id="gslist" aria-label="${esc(LT('shell.search'))}"><div class="gs-h"><span><span data-gs-total="${L.total || 0}">${esc(LT('shell.found_in_current_shipments'))}${L.total || 0}</span></span><label class="gs-arch"><input type="checkbox" data-act="gsArch"${S.gs.arch ? ' checked' : ''}> ${esc(LT('shell.incl_delivered'))}</label></div>${L.map(row).join('') || `<div class="gs-empty" data-gs-none>${esc(LT('shell.nothing_found_in_current_shipments'))}</div>`}${canDo('orders:read') ? `<div class="gs-h"><span data-gs-db="${D.total || 0}">${esc(LT('shell.in_the_database_orders_loads_package'))} · ${D.total || 0}</span></div>${D.map((r, i) => row(r, L.length + i)).join('') || empty}` : ''}<div class="gs-foot">↑ ↓ · Enter · Esc</div></div>` : '';
    const total = L.length + D.length;
    /* narrow windows (≤ 700 px, Q4): only the magnifier shows; it opens the full-width combobox (".gs.open") */
    return `<div class="gs${S.gsOpen || S.gs.q ? ' open' : ''}"><button type="button" class="btn grey sm gs-ico" data-act="gsTog" aria-expanded="${!!(S.gsOpen || S.gs.q)}" aria-label="${esc(LT('shell.search'))}">${ic(S.gsOpen ? 'x' : 'search', 16)}</button><label class="searchbox">${ic('search', 14)}<input id="gsearch" role="combobox" aria-label="${esc(LT('shell.search'))}" aria-expanded="${open}" aria-controls="gslist" aria-autocomplete="list"${open && total ? ` aria-activedescendant="gs-${Math.min(S.gs.idx, total - 1)}"` : ''} autocomplete="off" placeholder="${esc(S.gs.scan ? LT('shell.sscc_scan_00_enter') : LT('shell.goods_po_pl_article_lot_sscc_load_bo'))}" value="${esc(S.gs.q)}"></label><button type="button" class="btn sm ${S.gs.scan ? 'primary' : 'grey'} scanbtn" data-act="gsScan" aria-pressed="${S.gs.scan}" title="${esc(LT('shell.gs1_128_barcode_scanner_mode'))}">${esc(S.gs.scan ? LT('shell.scanner_on') : LT('shell.scanner'))}</button>${list}</div>`;
  };
  function gsGo(r, scanned) {
    S.gs.q = ''; S.gs.idx = 0; S.gsOpen = false;
    if (r.kind === 'line' || r.type === 'order' || r.type === 'package') {
      const l = load(r.load);
      if (S.ops) { if (l && l.status === 'delivered') S.ops.shipArch = true; S.ops.shipLoad = r.load; S.ops.shipSel = r.sscc || null; }
      S.tab.orders = 'ship'; if (scanned) toast(LT('shell.scan') + (r.hit || r.id) + ' → ' + r.load); go('orders');
    } else if (r.type === 'load') { S.tab.orders = 'orders'; go('orders'); if (S.route === 'orders') openDrawer({ type: 'load', id: r.id, tab: 'overview' }); }
    else if (r.type === 'booking') { S.tab.orders = 'bookings'; go('orders'); if (S.route === 'orders' && DRAWERS.booking) openDrawer({ type: 'booking', id: r.id }); }
  }
  function gsEnter() {
    const { D, all } = gsAll(); if (!all.length && !S.gs.scan) return;
    const exact = all.find(r => r.exact);
    const pick = exact || (!S.gs.scan ? (all[S.gs.idx] || (D.length === 1 ? D[0] : null)) : null);   // a scan only opens an exact hit
    if (pick) gsGo(pick, S.gs.scan);
    else if (S.gs.scan) toast(LT('shell.scan_not_recognised_as_sscc'), 'err');
  }
  globalThis.gsEnter = gsEnter;
  globalThis.gsInput = v => { S.gs.q = v; S.gs.idx = 0; if (S.gs.scan && typeof ssccFromScan === 'function' && ssccFromScan(v)) { const ex = gsAll().all.find(r => r.exact && r.what === 'SSCC'); if (ex) return gsGo(ex, true); } render(); };
  Object.assign(ACT, {
    gsOpen: d => { const r = gsAll().all[+d.i]; if (r) gsGo(r, false); },
    gsScan: () => { S.gs.scan = !S.gs.scan; render(); const e = $('#gsearch'); if (e) e.focus(); },
    gsArch: () => { S.gs.arch = !S.gs.arch; S.gs.idx = 0; render(); },
    gsTog: () => { S.gsOpen = !S.gsOpen; if (!S.gsOpen) { S.gs.q = ''; S.gs.idx = 0; } S.tbMore = false; render(); const e = S.gsOpen && $('#gsearch'); if (e) e.focus(); },
  });

  /* ---------- 4. keyboard: ↑ ↓ Enter Esc in the search box; Escape closes diagram / drawer / sidebar ---------- */
  document.addEventListener('keydown', e => {
    if (e.target && e.target.id === 'gsearch') {
      if (e.key === 'ArrowDown') { e.preventDefault(); S.gs.idx = Math.min(S.gs.idx + 1, Math.max(0, gsAll().all.length - 1)); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); S.gs.idx = Math.max(0, S.gs.idx - 1); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); gsEnter(); }
      else if (e.key === 'Escape') { S.gs.q = ''; S.gs.idx = 0; S.gsOpen = false; render(); }
      return;
    }
    if (e.key !== 'Escape') return;
    if (typeof HELP !== 'undefined' && HELP.tour) return;   // 70-tours.js handles its own Escape
    if (S.kbd) { S.kbd = false; render(); } else if (S.diag) { S.diag = null; render(); diagFocus(); } else if (S.drawer) closeDrawer(); else if (S.tbMore) { S.tbMore = false; render(); } else if (S.sideOpen) { S.sideOpen = false; render(); const b = $('.burger'); if (b) b.focus(); }   // 0.3.11 Layout.tsx: Escape returns the focus to the menu button
  });

  /* ---------- 4. phone bottom bar: 4 screens per role (0.3.10 BOTTOM map translated to the v6 sections) ---------- */
  const BOTTOM = { admin: ['dashboard', 'dispatch', 'routes', 'orders'], dispatcher: ['dashboard', 'dispatch', 'routes', 'orders'], warehouse: ['orders', 'hubs', 'pod', 'routes'], auditor: ['dashboard', 'reports', 'pod', 'billing'], viewer: ['dashboard', 'routes', 'orders', 'dispatch'], manager: ['dashboard', 'reports', 'dispatch', 'billing'], finance: ['billing', 'reports', 'orders', 'dashboard'], quality: ['pod', 'routes', 'orders', 'dashboard'], driver: ['driverapp', 'dahand', 'help'] };
  const bottomKeys = () => { const all = navItems().map(n => n[0]), pref = (BOTTOM[S.role] || []).filter(k => all.includes(k)); return pref.concat(all.filter(k => !pref.includes(k))).slice(0, 4); };
  globalThis.bottomKeys = bottomKeys;
  const bottomBar = () => `<nav class="bottombar" aria-label="${esc(LT('shell.quick_access'))}">${bottomKeys().map(k => { const n = navItems().find(x => x[0] === k), b = NAV_BADGE[k] && NAV_BADGE[k](); return `<a class="bb${S.route === k ? ' on' : ''}" data-act="go" data-v="${k}" role="link" tabindex="0"${S.route === k ? ' aria-current="page"' : ''}>${ic(n[1], 18)}<span>${esc(n[2])}</span>${b ? `<i class="badge-count">${b}</i>` : ''}</a>`; }).join('')}</nav>`;

  /* ---------- 5. eyebrow "NN · subtitle" (0.3.10 screen numbers) and "◇ Diagram" popover ---------- */
  const E = (n, ru, de, en, kk) => [n, T(ru, de, en, kk)];
  const EYE = {
    dashboard: E('01', 'Живой мониторинг', 'Live-Monitoring', 'Live monitoring', 'Тікелей мониторинг'), 'dashboard/alarms': E('01', 'Тревоги и события', 'Alarme und Ereignisse', 'Alarms and events', 'Дабылдар мен оқиғалар'), 'dashboard/inbox': E('', 'Учёт · входящие', 'Stammdaten · Eingang', 'Records · inbox', 'Есеп · кіріс'),
    orders: E('', 'Учёт · заказы и рейсы', 'Stammdaten · Aufträge und Fahrten', 'Records · orders and loads', 'Есеп · тапсырыстар мен рейстер'), 'orders/loadw': E('03', 'Паллеты, объём, оси', 'Paletten, Volumen, Achsen', 'Pallets, volume, axles', 'Паллеттер, көлем, осьтер'), 'orders/ship': E('04', 'PO, PL, SSCC, артикулы, партии', 'PO, PL, SSCC, Artikel, Chargen', 'PO, PL, SSCC, articles, lots', 'PO, PL, SSCC, артикулдар, партиялар'), 'orders/docs': E('08', 'Комплект документов и выпуск рейса', 'Dokumentensatz und Fahrtfreigabe', 'Document set and trip release', 'Құжаттар жинағы және рейсті шығару'), 'orders/bookings': E('', 'Учёт · бронирования', 'Stammdaten · Buchungen', 'Records · bookings', 'Есеп · броньдар'), 'orders/commercial': E('', 'Учёт · лиды и сделки', 'Stammdaten · Leads und Abschlüsse', 'Records · leads and deals', 'Есеп · лидтер мен мәмілелер'),
    dispatch: E('02', 'Рейсы, назначения, путевые листы', 'Fahrten, Zuweisungen, Fahraufträge', 'Trips, assignments, trip sheets', 'Рейстер, тағайындаулар, жол парақтары'), 'dispatch/planning': E('14', 'Мощности, сценарии, ресурсы', 'Kapazität, Szenarien, Ressourcen', 'Capacity, scenarios, resources', 'Қуаттар, сценарийлер, ресурстар'), 'dispatch/partners': E('11', 'Сервисные и логистические партнёры, передача отправок', 'Service- und Logistikpartner, Sendungsübergabe', 'Service and logistics partners, shipment handover', 'Сервистік және логистикалық серіктестер'), 'dispatch/express': E('02', 'Экспресс-заявки и согласования', 'Express-Anfragen und Freigaben', 'Express requests and approvals', 'Экспресс өтінімдер мен келісулер'),
    fleet: E('10', 'Статус, сервис, допуски', 'Status, Service, Freigaben', 'Status, service, approvals', 'Күйі, сервис, рұқсаттар'), 'fleet/registry': E('10', 'Реестр транспортных средств', 'Fahrzeugregister', 'Vehicle register', 'Көлік құралдарының тізілімі'),
    drivers: E('12', 'Где водители, доступность, отсутствия', 'Wo die Fahrer sind, Verfügbarkeit, Abwesenheiten', 'Where drivers are, availability, absences', 'Жүргізушілер қайда, қолжетімділік'), 'drivers/app': E('13', 'Экран водителя в рейсе', 'Fahrerbildschirm auf der Fahrt', 'Driver screen on trip', 'Рейстегі жүргізуші экраны'),
    routes: E('', 'Живой трекинг на карте', 'Live-Tracking auf der Karte', 'Live tracking on the map', 'Картадағы тікелей трекинг'), 'routes/temp': E('05', 'Камеры груза и наружная температура', 'Ladekammern und Außentemperatur', 'Cargo chambers and outside temperature', 'Жүк камералары және сыртқы температура'), 'routes/thermochron': E('05', 'Журнал температуры', 'Temperaturprotokoll', 'Temperature log', 'Температура журналы'), 'routes/wx': E('06', 'Прогноз и риски маршрута', 'Vorhersage und Routenrisiken', 'Forecast and route risks', 'Болжам және маршрут тәуекелдері'), 'routes/sec': E('07', 'Инциденты, геозоны, ДОПОГ', 'Vorfälle, Geofences, ADR', 'Incidents, geofences, ADR', 'Оқиғалар, геоаймақтар, ДОПОГ'), 'routes/coverage': E('', 'Учёт · покрытие сети', 'Stammdaten · Netzabdeckung', 'Records · network coverage', 'Есеп · желі қамтуы'), 'routes/lines': E('', 'Учёт · линии и тарифы', 'Stammdaten · Linien und Tarife', 'Records · lines and tariffs', 'Есеп · желілер мен тарифтер'),
    hubs: E('', 'Хабы, рампы, очередь', 'Hubs, Rampen, Warteschlange', 'Hubs, ramps, queue', 'Хабтар, рампалар, кезек'), 'hubs/recv': E('', 'Приёмка товара', 'Wareneingang', 'Goods receiving', 'Тауар қабылдау'),
    pod: E('', 'Очередь ePOD', 'ePOD-Warteschlange', 'ePOD queue', 'ePOD кезегі'), 'pod/quality': E('09', 'Отклонения, CAPA, калибровка', 'Abweichungen, CAPA, Kalibrierung', 'Deviations, CAPA, calibration', 'Ауытқулар, CAPA, калибрлеу'),
    billing: E('', 'Счета и ЭСФ', 'Rechnungen und ESF', 'Invoices and ESF', 'Шоттар мен ЭШФ'), 'billing/cost': E('16', 'Дизель, мастерская, простой, страховка, налоги', 'Diesel, Werkstatt, Stillstand, Versicherung, Steuern', 'Diesel, workshop, downtime, insurance, taxes', 'Дизель, шеберхана, тоқтап тұру, сақтандыру, салықтар'), 'billing/model': E('16', 'Модель затрат', 'Kostenmodell', 'Cost model', 'Шығындар моделі'), 'billing/insurance': E('', 'Учёт · страхование груза', 'Stammdaten · Frachtversicherung', 'Records · cargo insurance', 'Есеп · жүкті сақтандыру'),
    reports: E('15', 'Отчёты и KPI', 'Berichte und KPIs', 'Reports and KPIs', 'Есептер мен KPI'), 'reports/fines': E('15', 'Штрафы', 'Bußgelder', 'Fines', 'Айыппұлдар'),
    ai: E('', 'AI-ассистент операций', 'KI-Assistent für den Betrieb', 'AI ops assistant', 'Операциялар AI-көмекшісі'), baseline: E('17', 'Каталог вопросов · 150 ответов · валидация', 'Fragenkatalog · 150 Antworten · Validierung', 'Question catalogue · 150 answers · validation', 'Сұрақтар каталогы · 150 жауап · валидация'),
    settings: E('', 'Учёт · пользователи, интеграции, аудит', 'Stammdaten · Benutzer, Integrationen, Audit', 'Records · users, integrations, audit', 'Есеп · пайдаланушылар, интеграциялар, аудит'), account: E('', 'Логин, роль, 2FA, сессия', 'Benutzer, Rolle, 2FA, Sitzung', 'Username, role, 2FA, session', 'Логин, рөл, 2FA, сессия'),
    /* 0.3.11 records pages: "— · section" eyebrow per tab (PageHead code="—") */
    'settings/users': E('', 'Учёт · пользователи и роли', 'Stammdaten · Benutzer und Rollen', 'Records · users and roles', 'Есеп · пайдаланушылар мен рөлдер'), 'settings/audit': E('', 'Учёт · журнал аудита', 'Stammdaten · Audit-Protokoll', 'Records · audit log', 'Есеп · аудит журналы'), 'settings/oncall': E('', 'Учёт · дежурства', 'Stammdaten · Bereitschaft', 'Records · on-call roster', 'Есеп · кезекшілік'), 'settings/integ': E('', 'Учёт · интеграции', 'Stammdaten · Integrationen', 'Records · integrations', 'Есеп · интеграциялар'), 'settings/ref': E('', 'Учёт · справочники', 'Stammdaten · Stammdaten', 'Records · master data', 'Есеп · анықтамалықтар'), 'settings/rules': E('', 'Учёт · правила', 'Stammdaten · Regeln', 'Records · rules', 'Есеп · ережелер'), 'settings/notify': E('', 'Учёт · уведомления', 'Stammdaten · Benachrichtigungen', 'Records · notifications', 'Есеп · хабарламалар'),
    'routes/templog': E('05', 'Журнал температуры', 'Temperaturprotokoll', 'Temperature log', 'Температура журналы'), 'drivers/staff': E('12', 'Персонал и отсутствия', 'Personal und Abwesenheiten', 'Staff and absences', 'Персонал және болмау'), 'reports/kpi': E('15', 'KPI и целевые значения', 'KPIs und Zielwerte', 'KPIs and targets', 'KPI және мақсатты мәндер'), 'reports/sla': E('15', 'SLA и сроки', 'SLA und Fristen', 'SLA and deadlines', 'SLA және мерзімдер'), 'billing/sla': E('', 'Учёт · SLA и штрафные санкции', 'Stammdaten · SLA und Vertragsstrafen', 'Records · SLA and penalties', 'Есеп · SLA және айыппұлдар'), 'dispatch/winter': E('02', 'Зимние правила и ограничения', 'Winterregeln und Beschränkungen', 'Winter rules and restrictions', 'Қысқы ережелер мен шектеулер'), 'dispatch/backhaul': E('02', 'Обратные загрузки', 'Rückladungen', 'Backhaul loads', 'Кері тиеулер'),
    forbidden: E('403', 'Нет доступа', 'Kein Zugriff', 'No access', 'Қолжетімділік жоқ'), records: E('', 'Учёт и администрирование', 'Stammdaten und Verwaltung', 'Records and administration', 'Есеп және әкімшілік'),
  };
  globalThis.EYEBROW = EYE;
  const tabKey = () => { const sc = SCREENS[S.route]; return sc && sc.tabs ? (curTab(S.route) || {}).key : ''; };
  const eyeOf = () => EYE[S.route + '/' + tabKey()] || EYE[S.route];
  globalThis.shellEyebrow = () => { const e = eyeOf(); return e ? `<div class="eyebrow" data-eyebrow="${e[0]}">${e[0] ? e[0] + ' · ' : ''}${esc(e[1])}</div>` : ''; };
  const DIAG = { dashboard: 'flow', orders: 'load', 'orders/loadw': 'truck,load', 'orders/ship': 'truck', 'orders/docs': 'gonogo', 'orders/bookings': 'booking', dispatch: 'gonogo', 'dispatch/express': 'express', 'dispatch/partners': 'approvals', routes: 'coverage', 'routes/temp': 'coldchain', 'routes/thermochron': 'coldchain', drivers: 'driver', hubs: 'coldchain', pod: 'approvals', 'pod/quality': 'coldchain', billing: 'truck', baseline: 'split', settings: 'approvals' };
  /* a diagram key may list several visuals ("truck,load"); the popover shows all of them (Q1: animated figures, timers cleared on close) */
  const diagIds = k => String(k || '').split(',').filter(id => HELP.visuals[id]);
  const diagOf = () => { if (typeof HELP === 'undefined') return null; const id = DIAG[S.route + '/' + tabKey()] || DIAG[S.route]; return id && diagIds(id).length ? id : null; };
  /* 0.3.11 Popover.tsx: Esc, backdrop and × close the popover and the focus returns to the "◇ Diagram" button */
  const diagFocus = () => { const b = $('.diag-btn'); if (b) b.focus(); };
  ACT.diagTog = () => { const was = !!S.diag; S.diag = S.diag ? null : diagOf(); render(); if (was) diagFocus(); };
  const diagPop = () => S.diag && typeof HELP !== 'undefined' && diagIds(S.diag).length ? `<div class="diag-back" data-act="diagTog" aria-hidden="true"></div><div class="diag-pop" role="dialog" aria-label="${esc(LT('shell.diagram'))}" data-diag="${S.diag}"><div class="diag-head"><b>◇ ${esc(LT('shell.process_diagram'))}</b><button type="button" class="ab-x" data-act="diagTog" aria-label="${esc(LT('shell.close'))}">×</button></div>${diagIds(S.diag).map(id => `<figure class="hv" data-visual="${id}">${HELP.visuals[id]()}</figure>`).join('')}<p class="note"><a class="lnk" data-act="helpHere" role="button" tabindex="0" data-diag-help>${esc(LT('shell.help_article'))}</a></p></div>` : '';

  /* ---------- 3. alarm banner: new alarms of level ≥ 2 since the page opened, up to 3, click → alarm, × dismisses ---------- */
  const alarmsL2 = () => (S.alarms || []).filter(a => a.lvl >= 2 && a.status !== 'closed');
  function bannerSync() {
    if (!S.alarms) return;
    const cur = alarmsL2(), ids = new Set(cur.map(a => a.id));
    if (!S.ban.seen) { S.ban.seen = ids; return; }   // alarms present on load are not "new"
    const add = cur.filter(a => !S.ban.seen.has(a.id)).map(a => a.id); S.ban.seen = ids;
    S.ban.items = add.concat(S.ban.items.filter(id => ids.has(id) && !add.includes(id))).slice(0, 3);
  }
  const banner = () => { const its = S.ban.items.map(id => S.alarms.find(a => a.id === id)).filter(Boolean); return its.length ? `<div class="alarm-banner" role="alert" data-alarm-banner="${its.length}"><div class="ab-head"><b>${esc(LT('shell.new_alarms_of_level_2'))}</b><button type="button" class="ab-x" data-act="banX" aria-label="${esc(LT('shell.dismiss_notice'))}">×</button></div>${its.map(a => `<button type="button" class="ab-item" data-act="banGo" data-id="${a.id}" data-lvl="${a.lvl}"><span class="ab-src">L${a.lvl} · ${esc(a.hub || '')}</span><span>${esc(a.text)}</span></button>`).join('')}</div>` : ''; };
  Object.assign(ACT, {
    banX: () => { S.ban.items = []; render(); },
    banGo: d => { S.ban.items = S.ban.items.filter(id => id !== d.id); if (tabsOf('dashboard').some(t => t.key === 'alarms')) S.tab.dashboard = 'alarms'; go('dashboard'); if (S.route === 'dashboard' && DRAWERS.alarm) openDrawer({ type: 'alarm', id: d.id }); },
  });

  /* ---------- 7. demo sign-in (password → 2FA 123456 → recovery codes → forced change ≥ 12) → setRole; My account; Sign out; Reset ---------- */
  const USERS = { admin: 'sarah.johnson', dispatcher: 'a.saparova', warehouse: 'b.ermekov', driver: 'e.seitkali', auditor: 'o.berg', viewer: 't.akhmetov', manager: 'm.keller', finance: 'd.zhumabayeva', quality: 'a.schulz', customer: 'apteka.service', partner: 'transholod' };
  const DEMO_CODE = '123456', MIN_PW = 12;
  /* R1 · 0.3.9 Login.tsx: an account without 2FA goes through the enrolment step (QR + manual key + code) on its first sign-in; in the demo the
     viewer and auditor accounts are not enrolled yet. The forced password change asks for the current password. */
  const ENROLLED = ['admin', 'dispatcher', 'warehouse', 'driver', 'manager', 'finance', 'quality', 'customer', 'partner'];
  const otpKey = r => { let h = 11; for (const c of (USERS[r] || r)) h = (h * 33 + c.charCodeAt(0)) % 1048573; let k = ''; for (let i = 0; i < 16; i++) { h = (h * 1103515245 + 12345) % 2147483648; k += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[h % 32]; } return k.replace(/(.{4})(?=.)/g, '$1 '); };
  /* a deterministic 21 × 21 pattern with the three finder squares — a picture of a QR code for the demo, not a scannable one */
  const qrSvg = r => { const n = 21, key = otpKey(r).replace(/ /g, ''); let h = 5; for (const c of key) h = (h * 31 + c.charCodeAt(0)) % 2147483647; const fin = (x, y) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7); const on = (x, y) => { const [a, b] = [[0, 0], [n - 7, 0], [0, n - 7]].find(([a, b]) => x >= a && x < a + 7 && y >= b && y < b + 7); const dx = x - a, dy = y - b; return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4); }; let px = ''; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { h = (h * 1103515245 + 12345) % 2147483648; if (fin(x, y) ? on(x, y) : (h >> 7) % 2) px += `<rect x="${x}" y="${y}" width="1" height="1"/>`; } return `<svg viewBox="-1 -1 23 23" width="200" height="200" role="img" aria-label="QR" style="background:#fff;fill:#111;display:block;margin:8px auto">${px}</svg>`; };
  const mkCodes = seed => { let h = 7; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 100003; return Array.from({ length: 10 }, (_, i) => { h = (h * 1103515245 + 12345 + i) % 2147483648; const s = h.toString(36).toUpperCase().padStart(8, 'X').slice(-8); return s.slice(0, 4) + '-' + s.slice(4); }); };
  const sessEnd = () => fdt(new Date(NOW.getTime() + 12 * 3600e3));
  const fld = KIT.field;
  /* 0.3.11 passwords.py: 12..128 characters, no username inside, not a common one, >= 5 distinct characters, differs from the current one */
  const COMMON_PW = ['password1234', '123456789012', 'qwertyuiop12', 'qwerty123456', 'passwort1234', 'administrator', 'admin1234567', 'welcome12345', 'letmein12345', 'iloveyou1234', '1q2w3e4r5t6y', 'qwertyuiopas', '000000000000', '111111111111', 'abc123456789', 'olymp1234567', 'olymplogistic', 'kazakhstan123', 'astana123456', 'almaty123456'];
  const accOf = role => (typeof userOf === 'function' ? userOf(role) : null);
  const mustChange = role => { const u = accOf(role); return !!(u && u.mustChange); };   // set by "new user" and "reset password / 2FA" (450-rec-admin.js)
  const lockedAcc = role => { const u = accOf(role); return !!(u && u.locked); };
  const A_PW = ' maxlength="128" required autocomplete="current-password"', A_NEW = ' minlength="12" maxlength="128" required autocomplete="new-password"';
  const loginLayer = () => {
    if (!S.auth.on) return '';
    const A = S.auth, cyr = LANG === 'ru' || LANG === 'kk', err = A.err ? `<p class="login-err" role="alert">${esc(A.err)}</p>` : '';
    const lang = ['ru', 'de', 'en', 'kk'].map(l => `<a href="${fileFor(l)}"${l === LANG ? ' class="on"' : ''}>${l.toUpperCase()}</a>`).join(' ');
    let body = '';
    if (A.step === 'password') body = `<h1>${esc(LT('shell.sign_in'))}</h1><p class="note">${esc(LT('shell.demo_pick_an_account_any_password_th'))}</p>
<label class="fl">${esc(LT('shell.account'))}<select class="select" id="au_role" data-au="role" autocomplete="username">${ROLES.map(r => `<option value="${r}"${r === A.role ? ' selected' : ''}>${esc(USERS[r])} · ${esc(ROLE_NAME[r])}</option>`).join('')}</select></label>${fld('au_pw', LT('shell.password'), 'password', A.pw, '••••••••', A_PW)}${err}<button class="btn primary block" data-act="authPw">${esc(LT('shell.sign_in_2'))}</button>`;
    else if (A.step === 'enrol') body = `<h1>${esc(LT('shell.set_up_two_factor_protection'))}</h1><p class="note">${esc(LT('shell.scan_the_qr_code_with_an_authenticat'))}<b>${DEMO_CODE}</b></p><div class="login-qr" data-enrol-qr>${qrSvg(A.role)}</div><p class="note">${esc(LT('shell.key_for_manual_entry'))}: <code data-enrol-key>${otpKey(A.role)}</code></p>${fld('au_code', LT('shell.code'), 'text', A.code, '000000', ' inputmode="numeric" autocomplete="one-time-code" maxlength="6" required')}${err}<button class="btn primary block" data-act="authMfa">${esc(LT('shell.confirm'))}</button>`;
    else if (A.step === 'mfa') body = `<h1>${esc(LT('shell.second_factor'))}</h1><p class="note">${esc(LT('shell.enter_the_6_digit_code_from_the_auth'))}<b>${DEMO_CODE}</b> · ${esc(LT('shell.recovery_code_hint'))}</p>${fld('au_code', LT('shell.code'), 'text', A.code, '000000', ' inputmode="numeric" autocomplete="one-time-code" maxlength="32" required')}${err}<button class="btn primary block" data-act="authMfa">${esc(LT('shell.verify'))}</button>`;
    else if (A.step === 'recovery') body = `<h1>${esc(LT('shell.recovery_codes'))}</h1><p class="note">${esc(LT('shell.shown_once_each_works_once_store_the'))}</p><ol class="codes">${A.codes.map(c => `<li><code>${c}</code></li>`).join('')}</ol><button class="btn primary block" data-act="authCodes">${esc(LT('shell.i_saved_the_codes_continue'))}</button>`;
    else body = `<h1>${esc(LT('shell.change_password'))}</h1><p class="note">${esc(LT('shell.first_sign_in_set_your_own_password_'))}</p>${fld('au_cur', LT('shell.current_password'), 'password', A.cur, '', A_PW)}${fld('au_np', LT('shell.new_password'), 'password', A.np, '', A_NEW)}${fld('au_np2', LT('shell.repeat_the_password'), 'password', A.np2, '', A_NEW)}${err}<button class="btn primary block" data-act="authChange">${esc(LT('shell.save_and_sign_in'))}</button>`;
    return `<div class="login-layer" data-login-step="${A.step}"><div class="login-card card"><div class="brand"><img src="assets/brand/kokzhol-mark.svg" alt="Kökzhol" width="36" height="36"><span><span class="wordmark">${cyr ? 'көкжол' : 'kökzhol'}</span><span class="claim">${esc(LT('shell.cold_chain_on_schedule'))}</span></span></div>${body}<div class="login-foot"><span class="langs">${lang}</span><button type="button" class="btn grey sm design-btn" data-act="setDesign" title="${esc(LT('shell.design_switch'))}" aria-label="${esc(LT('shell.design_switch'))}">${S.design === 'olymp' ? '◐' : '◑'}</button><span>v${VERSION} · ${esc(BUILD)}</span></div></div></div>`;
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
  document.addEventListener('input', e => { const t = e.target; if (!t.dataset || !t.dataset.au) return; S.auth[t.dataset.au] = t.value; S.auth.err = ''; });
  document.addEventListener('change', e => { const t = e.target; if (t.id === 'au_role') { S.auth.role = t.value; } });
  document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.ac) { S.acct[t.dataset.ac] = t.value; S.acct.msg = ''; } });
  document.addEventListener('keydown', e => { if (e.key !== 'Enter' || !S.auth.on || !e.target.dataset || !e.target.dataset.au) return; e.preventDefault(); ({ password: ACT.authPw, enrol: ACT.authMfa, mfa: ACT.authMfa, change: ACT.authChange }[S.auth.step] || (() => {}))(); });
  /* Reset demo data (0.3.11 resetDemo restores the whole snapshot): the core arrays are re-seeded, every record store is restored from the
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
  globalThis.demoReset = demoReset;
  const kv = KIT.kv;
  SCREENS.account = {
    title: () => LT('shell.my_account'),
    sub: () => LT('shell.username_role_2fa_session_password_c'),
    actions: () => `<button class="btn grey" data-act="signOut">${esc(LT('shell.sign_out_2'))}</button>`,
    body: () => {
      const USER = { admin: 'Sarah Johnson', dispatcher: nm('Айгерим Сапарова'), warehouse: nm('Болат Ермеков'), driver: nm('Ерлан Сейтқали'), auditor: 'Olga Berg', viewer: 'Timur Akhmetov', manager: 'Max Keller', finance: nm('Дана Жумабаева'), quality: 'Anna Schulz', customer: nm('ТОО «Аптека Сервис»'), partner: nm('ТОО «ТрансХолод»') };
      const last = S.auth.lastLogin ? fdt(S.auth.lastLogin) : fdt(NOW);
      return `<div class="acct"><div class="card card-body" data-account><h3 style="margin:0 0 12px">${esc(LT('shell.account'))}</h3><div class="kv">${kv(LT('shell.username'), esc(USERS[S.role] || S.role))}${kv(LT('shell.name'), esc(USER[S.role] || '—'))}${kv(LT('shell.role'), esc(ROLE_NAME[S.role]))}${kv(LT('shell.default_hub'), S.hub ? esc(HUBS[S.hub].city) : esc(LT('shell.all')))}${kv('2FA', chip('green', LT('shell.on')))}${kv(LT('shell.session_until'), sessEnd())}${kv(LT('shell.last_sign_in'), last)}${kv(LT('shell.permissions'), (ROLE_PERMS[S.role] || []).length)}</div>
<p class="note" style="margin-top:12px">${esc(LT('shell.the_session_ends_after_30_minutes_of'))} <a class="lnk" data-act="helpGo" data-k="roles" role="button" tabindex="0">${esc(LT('shell.open'))} →</a></p></div>
<div><div class="card card-body" data-acct-pw><h3 style="margin:0 0 12px">${esc(LT('shell.change_password'))}</h3><label class="fl">${esc(LT('shell.current_password'))}<input class="inp" id="ac_cp" data-ac="cp" type="password" value="${esc(S.acct.cp || '')}" autocomplete="current-password" required></label><label class="fl">${esc(LT('shell.new_password_12_characters'))}<input class="inp" id="ac_np" data-ac="np" type="password" value="${esc(S.acct.np)}" autocomplete="new-password" minlength="12" maxlength="128" required></label><label class="fl">${esc(LT('shell.repeat'))}<input class="inp" id="ac_np2" data-ac="np2" type="password" value="${esc(S.acct.np2)}" autocomplete="new-password" minlength="12" maxlength="128" required></label><p class="note">${esc(LT('shell.at_least_12_characters_a_passphrase_'))}</p>${S.acct.msg ? `<p class="note ${S.acct.ok ? 'tone-g' : 'tone-r'}" data-acct-msg>${esc(S.acct.msg)}</p>` : ''}<button class="btn primary" data-act="acctPw">${esc(LT('shell.save'))}</button></div>
<div class="card card-body" style="margin-top:var(--gap)" data-demo-reset><h3 style="margin:0 0 8px">${esc(LT('shell.online_demo'))}</h3><p class="note">${esc(LT('shell.simulated_data_no_server_reset_retur'))}</p>${S.resetAsk ? `<div class="actbar"><button class="btn red" data-act="resetGo">${esc(LT('shell.yes_reset'))}</button><button class="btn grey" data-act="resetAsk">${esc(LT('shell.cancel'))}</button></div>` : `<button class="btn grey" data-act="resetAsk">${esc(LT('shell.reset_demo_data'))}</button>`}</div></div></div>`;
    },
  };

  /* ---------- 403 page and the /records landing page (10.1) ---------- */
  SCREENS.forbidden = {
    title: () => LT('shell.no_access_403'),
    body: () => `<section class="card card-body forbidden" data-page="forbidden" data-status="403" role="alert"><p class="note">${esc(LT('shell.forbidden_text'))}</p><button type="button" class="btn primary" data-act="go" data-v="${homeRoute()}" data-forbidden-home>${esc(LT('shell.go_to_start'))}</button></section>`,
  };
  const Q = (ru, de, en, kk) => T(ru, de, en, kk);   // same bridge as E() below: the long descriptions of the records page stay inline
  const RGROUPS = () => [
    [Q('Заказы и рейсы', 'Aufträge und Fahrten', 'Orders and trips', 'Тапсырыстар мен рейстер'), Q('Бронирования клиентов, покрытие сети, линии и тарифы, планирование мощностей.', 'Kundenbuchungen, Netzabdeckung, Linien und Tarife, Kapazitätsplanung.', 'Customer bookings, network coverage, lines and tariffs, capacity planning.', 'Клиент броньдары, желі қамтуы, желілер мен тарифтер, қуат жоспарлау.'), [['orders', 'bookings'], ['routes', 'coverage'], ['routes', 'lines'], ['dispatch', 'planning']]],
    [Q('Холодовая цепь и безопасность', 'Kühlkette und Sicherheit', 'Cold chain and safety', 'Суық тізбек және қауіпсіздік'), Q('Тревоги, дежурства по уровням эскалации, страховые случаи.', 'Alarme, Bereitschaft je Eskalationsstufe, Versicherungsfälle.', 'Alarms, on-call roster per escalation level, insurance claims.', 'Дабылдар, эскалация деңгейлері бойынша кезекшілік, сақтандыру жағдайлары.'), [['dashboard', 'alarms'], ['settings', 'oncall'], ['billing', 'insurance']]],
    [Q('CRM', 'CRM', 'CRM', 'CRM'), Q('Лиды, сделки, клиенты и задачи.', 'Leads, Abschlüsse, Kunden und Aufgaben.', 'Leads, deals, customers and tasks.', 'Лидтер, мәмілелер, клиенттер және тапсырмалар.'), [['orders', 'commercial']]],
    [Q('Справочники', 'Stammdaten', 'Registers', 'Анықтамалықтар'), Q('Места, партнёры, ставки, пороги и ограничения с версиями и вторым согласованием.', 'Orte, Partner, Sätze, Schwellen und Beschränkungen mit Versionen und zweiter Freigabe.', 'Places, partners, rates, thresholds and restrictions with versions and a second approval.', 'Орындар, серіктестер, мөлшерлемелер, шектер және шектеулер нұсқалармен.'), [['settings', 'ref']]],
    [Q('Администрирование', 'Verwaltung', 'Administration', 'Әкімшілік'), Q('Пользователи и роли, журнал аудита.', 'Benutzer und Rollen, Audit-Protokoll.', 'Users and roles, audit log.', 'Пайдаланушылар мен рөлдер, аудит журналы.'), [['settings', 'users'], ['settings', 'audit']]],
    [Q('Каналы', 'Kanäle', 'Channels', 'Арналар'), Q('Входящие сообщения внешних систем и каталог интеграций.', 'Eingang externer Systeme und Integrationskatalog.', 'Inbox of external systems and the integrations catalogue.', 'Сыртқы жүйелердің кіріс хабарлары және интеграциялар каталогы.'), [['dashboard', 'inbox'], ['settings', 'integ']]],
  ];
  const recTab = ([s, k]) => (canSee(s) ? tabsOf(s).find(t => t.key === k) : null);
  globalThis.recordsNavHtml = () => {
    if (SHELL_NAV[S.role]) return '';
    const items = RGROUPS().flatMap(g => g[2]).map(x => [x, recTab(x)]).filter(x => x[1]); if (!items.length) return '';
    const head = canSee('records') ? `<a class="side-h side-h-link${S.route === 'records' ? ' on' : ''}" data-act="go" data-v="records" role="link" tabindex="0" data-nav-records>${esc(LT('shell.records_admin'))}</a>` : `<div class="side-h">${esc(LT('shell.records_admin'))}</div>`;
    return `<div class="side-tools rec-nav">${head}${items.map(([x, t]) => `<a class="side-link${S.route === x[0] && tabKey() === x[1] ? ' on' : ''}" data-act="helpOpen" data-s="${x[0]}" data-t="${x[1]}" role="link" tabindex="0">${ic('list', 14)}<span>${esc(t.label)}</span></a>`).join('')}</div>`;
  };
  SCREENS.records = {
    title: () => LT('shell.records_admin'),
    sub: () => Q('Журналы, справочники и администрирование — страницы, которых нет среди ежедневных экранов.', 'Register, Stammdaten und Verwaltung — Seiten, die nicht zu den täglichen Bildschirmen gehören.', 'Logs, master data and administration — pages that are not among the daily screens.', 'Журналдар, анықтамалықтар және әкімшілік — күнделікті экрандарға кірмейтін беттер.'),
    body: () => {
      const cards = RGROUPS().map(g => [g[0], g[1], g[2].filter(recTab)]).filter(g => g[2].length).map(g => `<div class="card card-body rec-card" data-rec-group><h3 style="margin:0 0 6px">${esc(g[0])}</h3><p class="note">${esc(g[1])}</p><div class="actbar">${g[2].map(x => `<button type="button" class="btn grey sm" data-act="helpOpen" data-s="${x[0]}" data-t="${x[1]}">${esc(recTab(x).label)} →</button>`).join('')}</div></div>`).join('');
      return `<div class="rec-grid" data-records>${cards}</div>${typeof HELP !== 'undefined' && HELP.visuals.split ? `<figure class="hv" data-visual="split">${HELP.visuals.split()}</figure>` : ''}`;
    },
  };

  /* ---------- 6. deep links (FR-175) and the browser history (BUG-31): ?s=&t= + the selected record live in the URL ---------- */
  const SAFE = /^[\w.:\- ]{1,40}$/;
  const MANAGED = ['s', 't', 'load', 'trip', 'dev', 'fine', 'veh', 'city', 'item', 'alarm', 'order', 'booking', 'help', 'k', 'view', 'r'];
  let applying = false, started = false;   // the URL is written only after the first load has been resolved
  const H = { key: null };
  const forbid = () => { S.route = 'forbidden'; S.drawer = null; S.diag = null; render(); return true; };
  /* one resolver for the first load, links and Back / Forward; returns false when the URL is not ours (public pages) */
  function applyUrl() {
    const sp = new URLSearchParams(location.search); if (sp.get('track') || sp.get('request')) return false;
    const r = sp.get('r'); if (r) { const m = /^(trip|order|booking|alarm|deviation|help):(.+)$/.exec(r); const key = m && { trip: 'load', order: 'order', booking: 'booking', alarm: 'alarm', deviation: 'dev', help: 'help' }[m[1]]; if (!key) return forbid(); sp.set(key, m[2]); }
    if (MANAGED.some(k => sp.has(k) && !SAFE.test(sp.get(k)))) return forbid();   // id sanitising as in 0.3.11 DeepLink.tsx
    const s = sp.get('s'), t0 = sp.get('t') || sp.get('view'), ld = sp.get('load') || sp.get('trip'), dev = sp.get('dev'), fine = sp.get('fine'), veh = sp.get('veh'), city = sp.get('city'), item = sp.get('item'), alarm = sp.get('alarm'), order = sp.get('order'), booking = sp.get('booking'), help = sp.get('help');
    S.drawer = sp.get('whatsnew') === '1' && S.drawer && S.drawer.type === 'whatsNew' ? S.drawer : null; S.diag = null;
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
    if (order) { if (!canSee('orders') || !tabsOf('orders').some(x => x.key === 'rec')) return forbid(); if (typeof findOrder === 'function' && !findOrder(order)) { toast(LT('shell.order_not_found'), 'err'); return true; } S.tab.orders = 'rec'; if (S.ops) S.ops.orq = order; S.route = 'orders'; render(); return true; }
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
    if (applying || !started || typeof history === 'undefined' || !history.replaceState || (S.auth && S.auth.on)) return;
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
  const saveState = () => { try { sessionStorage.setItem('olymp.state', JSON.stringify({ t: (performance.timeOrigin + performance.now()), role: S.role, hub: S.hub, route: S.route, tab: S.tab, design: S.design, auth: S.auth.on ? { step: S.auth.step, role: S.auth.role } : null })); } catch (_) { /* storage blocked */ } };
  function restoreState() {
    try {
      const j = sessionStorage.getItem('olymp.state'); if (!j) return; sessionStorage.removeItem('olymp.state');
      const o = JSON.parse(j); if (!o || (performance.timeOrigin + performance.now()) - o.t > 20000) return;
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
      else if (!window.frameElement && LANG === 'ru' && /(^|\/)(index\.html)?$/.test(location.pathname)) { const st = localStorage.getItem('olymp.lang'); if (/^(de|en|kk)$/.test(st || '')) location.replace(fileFor(st) + location.search + location.hash); }
    } catch (_) { /* storage blocked */ }
  })();
  /* the design choice survives a reload (0.3.11 «olymp.design»): saved in localStorage — not inside test frames, which share the origin of the harness — and ?brand=olymp|kokzhol wins over the stored choice and replaces it.
     designSave / designLoad take the storage as an argument so the contract is testable with a stand-in */
  const DESIGNS = ['olymp', 'kokzhol'];
  globalThis.designSave = st => { try { if (st) st.setItem('olymp.design', S.design); } catch (_) { /* private mode */ } };
  globalThis.designLoad = (st, search) => {
    try {
      const q = new URLSearchParams(search == null ? location.search : search).get('brand'), stored = st && st.getItem('olymp.design'), pick = DESIGNS.includes(q) ? q : DESIGNS.includes(stored) ? stored : null;
      if (pick && pick !== S.design) S.design = pick; if (pick) document.documentElement.dataset.design = S.design;
      if (DESIGNS.includes(q)) designSave(st);
    } catch (_) { /* private mode */ }
    return S.design;
  };
  (function designStart() {
    const sd = ACT.setDesign, store = () => (window.frameElement ? null : localStorage); if (typeof sd === 'function') ACT.setDesign = d => { sd(d); try { designSave(store()); } catch (_) { /* private mode */ } };
    try { designLoad(store()); } catch (_) { /* private mode */ }
  })();
  document.addEventListener('DOMContentLoaded', () => {
    H.home = S.route;
    if (ACT.qDev) { const q = ACT.qDev; ACT.qDev = d => { S.selDev = d.id; return q(d); }; }   // the quality screen keeps its selection private: remember it for the URL
    snapshot(); restoreState();
    applying = true; try { applyUrl(); } finally { applying = false; }
    H.key = null; started = true; syncUrl();
  });

  /* ---------- overlays + render hook (document.title, ◇ Diagram button) ---------- */
  globalThis.shellOverlays = () => banner() + bottomBar() + diagPop() + loginLayer();
  let loginStep = null;
  /* 0.3.11 docTitle.ts: "<record> · <tab> · <NN screen> · brand"; help "Help · <article> · brand"; 403 and account pages by name; adjacent repeats dropped */
  function docTitle() {
    const brand = 'Kökzhol', sc = SCREENS[S.route], parts = [];
    if (S.route === 'forbidden') parts.push('403');
    else if (S.route === 'help') { const a = typeof helpArt === 'function' ? helpArt(S.help.key) : null; parts.push(LT('core.help'), a ? tx(a.title) : null); }
    else if (S.route === 'account' || S.route === 'records') parts.push(navLabel(S.route));
    else { const sel = selection(), rec = (S.drawer && S.drawer.id) || sel.load || sel.alarm || sel.booking || sel.dev || sel.fine || sel.veh || sel.city; const tabs = sc && sc.tabs ? tabsOf(S.route) : [], ct = tabs.length > 1 ? curTab(S.route) : null; const e = eyeOf(); parts.push(rec, ct && ct.label, ((e && e[0]) ? e[0] + ' ' : '') + navLabel(S.route)); }
    parts.push(brand); return parts.filter((x, i, a) => x && x !== a[i - 1]).join(' · ');
  }
  function shellAfter() {
    document.title = docTitle(); syncUrl();
    if (S.auth.on && S.auth.step !== loginStep) { loginStep = S.auth.step; const f = $('.login-layer input, .login-layer select'); if (f) f.focus(); } else if (!S.auth.on) loginStep = null;
    if (S.route === 'help') return;
    const act = $('.page-head .actions'); if (!act || $('.diag-btn', act) || !diagOf()) return;
    act.insertAdjacentHTML('beforeend', `<button type="button" class="btn grey sm diag-btn" data-act="diagTog" aria-haspopup="dialog" aria-expanded="${!!S.diag}" title="${esc(LT('shell.process_diagram'))}">◇ ${esc(LT('shell.diagram'))}</button>`);
  }
  const render0 = render;
  render = function () { bannerSync(); render0(); shellAfter(); };
})();
