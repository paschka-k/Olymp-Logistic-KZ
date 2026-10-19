/* P6 · Shell parity with 0.3.10 (docs/PARITY-0.3.10-v6.md, shell rows): hub filter segment + hubFilter() helper, global search combobox
   with scanner mode (FR-74 / FR-163), clock + business date, "N active alarms" button and alarm banner (FR-131), phone bottom bar
   (FR-133), Escape closes drawers / sidebar, eyebrow "NN · subtitle" with the 0.3.10 screen number per tab, "◇ Diagram" popover with
   HELP.visuals, deep links ?load= ?dev= ?fine= ?s=&t= + document.title (FR-175), demo sign-in (password → 2FA → recovery codes →
   forced change ≥ 12) ending in setRole, "My account" page, Sign out, Reset demo data. Bundled before the other screens; core.js calls
   the hooks shellSearchBox / shellTopExtra / shellEyebrow / shellOverlays and gsInput when they exist. Mock-up only: no backend. */
(function () {
  S.hub = ''; S.gs = { q: '', idx: 0, arch: false, scan: false }; S.diag = null; S.ban = { seen: null, items: [] }; S.resetAsk = false;
  S.auth = { on: false, step: 'password', role: 'admin', pw: '', code: '', np: '', np2: '', err: '', codes: [], lastLogin: null };
  S.acct = { np: '', np2: '', msg: '', ok: false };
  ALWAYS.push('account');   // "My account" is reachable for every role, incl. the role shells

  /* ---------- 1. hub filter (0.3.10: All hubs / Astana / Almaty on every screen; v6 has five hubs) ---------- */
  const HUBK = () => Object.keys(HUBS);
  /* hubFilter(items, field): field = property name (default 'hub') or a function returning a hub code or an array of codes */
  globalThis.hubFilter = (items, field) => {
    if (!S.hub) return items;
    const f = typeof field === 'function' ? field : (x => x[field || 'hub']);
    return items.filter(x => { const v = f(x); return Array.isArray(v) ? v.includes(S.hub) : v === S.hub; });
  };
  globalThis.hubOfLoad = l => [l.from, l.to];
  const hubSeg = () => `<div class="hubseg" role="group" aria-label="Hub" data-hub="${S.hub}">${[['', T('Все хабы', 'Alle Hubs', 'All hubs', 'Барлық хабтар')]].concat(HUBK().map(h => [h, h])).map(o => `<button type="button" class="hs${S.hub === o[0] ? ' on' : ''}" data-act="hubSet" data-v="${o[0]}" aria-pressed="${S.hub === o[0]}" title="${esc(o[0] ? HUBS[o[0]].name : T('Все экраны: все хабы', 'Alle Bildschirme: alle Hubs', 'All screens: all hubs', 'Барлық экрандар: барлық хабтар'))}">${esc(o[1])}</button>`).join('')}</div>`;
  ACT.hubSet = d => { S.hub = d.v; S.drawer = null; S.f.page = 1; render(); };

  /* ---------- 3. clock (real Kazakhstan time, UTC+5) + business date of the demo, "N active alarms" ---------- */
  const kzNow = () => { const d = new Date(); return new Date(d.getTime() + (d.getTimezoneOffset() + 300) * 60000); };
  const clockTxt = () => { const d = kzNow(); return p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()); };
  const bizDate = () => { const WD = T('Пн,Вт,Ср,Чт,Пт,Сб,Вс', 'Mo,Di,Mi,Do,Fr,Sa,So', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', 'Дс,Сс,Ср,Бс,Жм,Сб,Жс').split(','); return WD[(NOW.getDay() + 6) % 7] + ' ' + fd(NOW); };
  if (typeof window !== 'undefined' && !window.frameElement) setInterval(() => { const e = $('[data-clock]'); if (e && !document.hidden) e.textContent = clockTxt(); }, 1000);
  const activeAlarms = () => (S.alarms ? S.alarms.filter(a => a.status !== 'closed').length : alertsCount());
  globalThis.activeAlarms = activeAlarms;
  ACT.alarmsGo = () => { if (tabsOf('dashboard').some(t => t.key === 'alarms')) S.tab.dashboard = 'alarms'; go('dashboard'); };
  globalThis.shellTopExtra = () => {
    const n = activeAlarms();
    return `${hubSeg()}<span class="clock" title="${esc(T('Время Казахстана · операционная дата демо', 'Zeit in Kasachstan · Geschäftsdatum der Demo', 'Kazakhstan time · business date of the demo', 'Қазақстан уақыты · демо операциялық күні'))}"><b data-clock>${clockTxt()}</b><small data-bizdate>${esc(bizDate())} · Astana UTC+5</small></span><button type="button" class="btn sm alarms-btn ${n ? 'red' : 'grey'}" data-act="alarmsGo" data-alarms="${n}" title="${esc(T('Открыть тревоги', 'Alarme öffnen', 'Open the alarms', 'Дабылдарды ашу'))}">${n} ${esc(T('активных тревог', 'aktive Alarme', 'active alarms', 'белсенді дабыл'))}</button>`;
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
  const TYPE = { order: T('Заказ', 'Auftrag', 'Order', 'Тапсырыс'), load: T('Рейс', 'Fahrt', 'Load', 'Рейс'), package: T('Место', 'Packstück', 'Package', 'Орын'), booking: T('Бронь', 'Buchung', 'Booking', 'Брондау') };
  function gsLines(q) {   // in current shipments: goods, PO, PL, article, LOT, SSCC (archive toggle adds delivered loads)
    const out = []; if (typeof ops !== 'function') return out;
    const ql = q.toLowerCase(), qn = norm(q), dq = digits(q), sscc = typeof ssccFromScan === 'function' ? ssccFromScan(q) : null;
    for (const l of S.loads) {
      if (!S.gs.arch && l.status === 'delivered') continue;
      for (const o of ops(l).orders) {
        const hit = (what, val, exact, p) => out.push({ kind: 'line', load: l.id, order: o.id, mfr: o.mfr, what, hit: val, sscc: p || null, exact: !!exact });
        if (norm(o.po).includes(qn)) hit('PO', o.po, norm(o.po) === qn);
        if (norm(o.pl).includes(qn)) hit('PL', o.pl, norm(o.pl) === qn);
        for (const x of o.lines) {
          if (norm(x.art).includes(qn)) hit(T('Артикул', 'Artikel', 'Article', 'Артикул'), x.art, norm(x.art) === qn);
          else if (String(x.name).toLowerCase().includes(ql)) hit(T('Товар', 'Ware', 'Goods', 'Тауар'), x.name);
          if (norm(x.lot).includes(qn)) hit('LOT', x.lot, norm(x.lot) === qn);
        }
        if (dq.length >= 4) for (const p of o.places) if (p.sscc.includes(dq)) hit('SSCC', p.sscc, p.sscc === (sscc || dq), p.sscc);
      }
    }
    return out.sort((a, b) => b.exact - a.exact).slice(0, 8);
  }
  function gsDb(q) {   // in the database: orders, loads, packages, bookings
    const out = [], add = (type, id, label, m, extra) => { if (m) out.push(Object.assign({ kind: 'db', type, id, label, exact: m === 2 }, extra)); };
    S.loads.forEach(l => add('load', l.id, HUBS[l.from].city + ' → ' + HUBS[l.to].city + ' · ' + ST[l.status].l, numMatch(l.id, q), { load: l.id }));
    if (typeof ops === 'function') S.loads.forEach(l => ops(l).orders.forEach(o => add('order', o.id, l.id + ' · ' + o.city + ' · ' + o.pal + ' pal', numMatch(o.id, q), { load: l.id, order: o.id })));
    const d = digits(q); if (d.length >= 6 && typeof opsPlaces === 'function') S.loads.forEach(l => opsPlaces(l).forEach(p => { if (p.sscc.includes(d)) add('package', p.sscc, l.id + ' · ' + p.order, p.sscc === d ? 2 : 1, { load: l.id, sscc: p.sscc, order: p.order }); }));
    (S.bookings || []).forEach(b => add('booking', b.id, ((HUBS[b.from] || {}).city || b.from || '') + ' → ' + ((HUBS[b.to] || {}).city || b.to || '') + ' · ' + (b.status || ''), numMatch(b.id, q), { booking: b.id }));
    return out.sort((a, b) => b.exact - a.exact).slice(0, 8);
  }
  const gsAll = () => { const q = S.gs.q.trim(); if (q.length < 2) return { L: [], D: [], all: [] }; const L = gsLines(q), D = gsDb(q); return { L, D, all: L.concat(D) }; };
  globalThis.gsResults = gsAll;
  const logo = m => (typeof MFRS !== 'undefined' && MFRS[m] && MFRS[m].logo) ? `<span class="mlogo img gs-logo" title="${esc(MFRS[m].name)}"><img src="${mfrSrc(m)}" alt="${esc(MFRS[m].name)}" loading="lazy"></span>` : `<span class="gs-type">${esc(m || '')}</span>`;
  const plateOf = id => { const l = load(id); return l && l.truck ? trk(l.truck).plate : '—'; };
  globalThis.shellSearchBox = () => {
    const { L, D } = gsAll(), open = S.gs.q.trim().length >= 2;
    const row = (r, i) => `<div class="gs-row${i === S.gs.idx ? ' on' : ''}${r.exact ? ' exact' : ''}" role="option" aria-selected="${i === S.gs.idx}" data-act="gsOpen" data-i="${i}">${r.kind === 'line'
      ? `${logo(r.mfr)}<span class="gs-main"><b>${esc(r.what)}: ${esc(r.hit)}</b><small>${r.load} · ${esc(plateOf(r.load))} · ${esc(ST[load(r.load).status].l)}</small></span>`
      : `<span class="gs-type">${esc(TYPE[r.type])}</span><span class="gs-main"><b>${esc(r.id)}</b><small>${esc(r.label)}</small></span>`}${r.exact ? '<span class="chip green">=</span>' : ''}</div>`;
    const empty = `<div class="gs-empty">${esc(T('Нет совпадений', 'Keine Treffer', 'No matches', 'Сәйкестік жоқ'))}</div>`;
    const list = open ? `<div class="gs-list" role="listbox" id="gslist"><div class="gs-h"><span>${esc(T('В текущих отправках', 'In aktuellen Sendungen', 'In current shipments', 'Ағымдағы жөнелтімдерде'))} · ${L.length}</span><label class="gs-arch"><input type="checkbox" data-act="gsArch"${S.gs.arch ? ' checked' : ''}> ${esc(T('включая доставленные', 'inkl. zugestellter', 'incl. delivered', 'жеткізілгендерді қоса'))}</label></div>${L.map(row).join('') || empty}<div class="gs-h"><span>${esc(T('В базе: заказы, рейсы, места, брони', 'In der Datenbank: Aufträge, Fahrten, Packstücke, Buchungen', 'In the database: orders, loads, packages, bookings', 'Базада: тапсырыстар, рейстер, орындар, броньдар'))} · ${D.length}</span></div>${D.map((r, i) => row(r, L.length + i)).join('') || empty}<div class="gs-foot">↑ ↓ · Enter · Esc</div></div>` : '';
    return `<div class="gs"><label class="searchbox">${ic('search', 14)}<input id="gsearch" role="combobox" aria-expanded="${open}" aria-controls="gslist" aria-autocomplete="list" autocomplete="off" placeholder="${esc(S.gs.scan ? T('Скан SSCC (00)… · Enter', 'SSCC-Scan (00)… · Enter', 'SSCC scan (00)… · Enter', 'SSCC сканы (00)… · Enter') : T('Товар, PO, PL, артикул, LOT, SSCC, рейс, бронь…', 'Ware, PO, PL, Artikel, LOT, SSCC, Fahrt, Buchung…', 'Goods, PO, PL, article, LOT, SSCC, load, booking…', 'Тауар, PO, PL, артикул, LOT, SSCC, рейс, брондау…'))}" value="${esc(S.gs.q)}"></label><button type="button" class="btn sm ${S.gs.scan ? 'primary' : 'grey'} scanbtn" data-act="gsScan" aria-pressed="${S.gs.scan}" title="${esc(T('Режим сканера штрихкода GS1-128', 'Barcode-Scannermodus GS1-128', 'GS1-128 barcode scanner mode', 'GS1-128 штрихкод сканері режимі'))}">${esc(S.gs.scan ? T('Сканер · вкл', 'Scanner · an', 'Scanner · on', 'Сканер · қосулы') : T('Сканер', 'Scanner', 'Scanner', 'Сканер'))}</button>${list}</div>`;
  };
  function gsGo(r, scanned) {
    S.gs.q = ''; S.gs.idx = 0;
    if (r.kind === 'line' || r.type === 'order' || r.type === 'package') {
      const l = load(r.load);
      if (S.ops) { if (l && l.status === 'delivered') S.ops.shipArch = true; S.ops.shipLoad = r.load; S.ops.shipSel = r.sscc || null; }
      S.tab.orders = 'ship'; if (scanned) toast(T('Скан: ', 'Scan: ', 'Scan: ', 'Скан: ') + (r.hit || r.id) + ' → ' + r.load); go('orders');
    } else if (r.type === 'load') { S.tab.orders = 'orders'; go('orders'); if (S.route === 'orders') openDrawer({ type: 'load', id: r.id, tab: 'overview' }); }
    else if (r.type === 'booking') { S.tab.orders = 'bookings'; go('orders'); if (S.route === 'orders' && DRAWERS.booking) openDrawer({ type: 'booking', id: r.id }); }
  }
  function gsEnter() {
    const { D, all } = gsAll(); if (!all.length && !S.gs.scan) return;
    const exact = all.find(r => r.exact);
    const pick = exact || (!S.gs.scan ? (all[S.gs.idx] || (D.length === 1 ? D[0] : null)) : null);   // a scan only opens an exact hit
    if (pick) gsGo(pick, S.gs.scan);
    else if (S.gs.scan) toast(T('Скан не распознан как SSCC', 'Scan nicht als SSCC erkannt', 'Scan not recognised as SSCC', 'Скан SSCC ретінде танылмады'), 'err');
  }
  globalThis.gsEnter = gsEnter;
  globalThis.gsInput = v => { S.gs.q = v; S.gs.idx = 0; if (S.gs.scan && typeof ssccFromScan === 'function' && ssccFromScan(v)) { const ex = gsAll().all.find(r => r.exact && r.what === 'SSCC'); if (ex) return gsGo(ex, true); } render(); };
  Object.assign(ACT, {
    gsOpen: d => { const r = gsAll().all[+d.i]; if (r) gsGo(r, false); },
    gsScan: () => { S.gs.scan = !S.gs.scan; render(); const e = $('#gsearch'); if (e) e.focus(); },
    gsArch: () => { S.gs.arch = !S.gs.arch; S.gs.idx = 0; render(); },
  });

  /* ---------- 4. keyboard: ↑ ↓ Enter Esc in the search box; Escape closes diagram / drawer / sidebar ---------- */
  document.addEventListener('keydown', e => {
    if (e.target && e.target.id === 'gsearch') {
      if (e.key === 'ArrowDown') { e.preventDefault(); S.gs.idx = Math.min(S.gs.idx + 1, Math.max(0, gsAll().all.length - 1)); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); S.gs.idx = Math.max(0, S.gs.idx - 1); render(); }
      else if (e.key === 'Enter') { e.preventDefault(); gsEnter(); }
      else if (e.key === 'Escape') { S.gs.q = ''; S.gs.idx = 0; render(); }
      return;
    }
    if (e.key !== 'Escape') return;
    if (typeof HELP !== 'undefined' && HELP.tour) return;   // 70-tours.js handles its own Escape
    if (S.diag) { S.diag = null; render(); } else if (S.drawer) closeDrawer(); else if (S.sideOpen) { S.sideOpen = false; render(); }
  });

  /* ---------- 4. phone bottom bar: 4 screens per role (0.3.10 BOTTOM map translated to the v6 sections) ---------- */
  const BOTTOM = { admin: ['dashboard', 'dispatch', 'routes', 'orders'], dispatcher: ['dashboard', 'dispatch', 'routes', 'orders'], warehouse: ['orders', 'hubs', 'pod', 'routes'], auditor: ['dashboard', 'reports', 'pod', 'billing'], viewer: ['dashboard', 'routes', 'orders', 'dispatch'], manager: ['dashboard', 'reports', 'dispatch', 'billing'], finance: ['billing', 'reports', 'orders', 'dashboard'], quality: ['pod', 'routes', 'orders', 'dashboard'] };
  const bottomKeys = () => { const all = navItems().map(n => n[0]), pref = (BOTTOM[S.role] || []).filter(k => all.includes(k)); return pref.concat(all.filter(k => !pref.includes(k))).slice(0, 4); };
  globalThis.bottomKeys = bottomKeys;
  const bottomBar = () => `<nav class="bottombar" aria-label="${esc(T('Быстрый доступ', 'Schnellzugriff', 'Quick access', 'Жылдам қолжетімділік'))}">${bottomKeys().map(k => { const n = navItems().find(x => x[0] === k), b = NAV_BADGE[k] && NAV_BADGE[k](); return `<a class="bb${S.route === k ? ' on' : ''}" data-act="go" data-v="${k}" role="link" tabindex="0">${ic(n[1], 18)}<span>${esc(n[2])}</span>${b ? `<i class="badge-count">${b}</i>` : ''}</a>`; }).join('')}</nav>`;

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
  };
  const tabKey = () => { const sc = SCREENS[S.route]; return sc && sc.tabs ? (curTab(S.route) || {}).key : ''; };
  const eyeOf = () => EYE[S.route + '/' + tabKey()] || EYE[S.route];
  globalThis.shellEyebrow = () => { const e = eyeOf(); return e ? `<div class="eyebrow" data-eyebrow="${e[0]}">${e[0] ? e[0] + ' · ' : ''}${esc(e[1])}</div>` : ''; };
  const DIAG = { dashboard: 'flow', orders: 'load', 'orders/loadw': 'truck,load', 'orders/ship': 'truck', 'orders/docs': 'gonogo', 'orders/bookings': 'booking', dispatch: 'gonogo', 'dispatch/express': 'express', 'dispatch/partners': 'approvals', routes: 'coverage', 'routes/temp': 'coldchain', 'routes/thermochron': 'coldchain', drivers: 'driver', hubs: 'coldchain', pod: 'approvals', 'pod/quality': 'coldchain', billing: 'truck', baseline: 'split', settings: 'approvals' };
  /* a diagram key may list several visuals ("truck,load"); the popover shows all of them (Q1: animated figures, timers cleared on close) */
  const diagIds = k => String(k || '').split(',').filter(id => HELP.visuals[id]);
  const diagOf = () => { if (typeof HELP === 'undefined') return null; const id = DIAG[S.route + '/' + tabKey()] || DIAG[S.route]; return id && diagIds(id).length ? id : null; };
  ACT.diagTog = () => { S.diag = S.diag ? null : diagOf(); render(); };
  const diagPop = () => S.diag && typeof HELP !== 'undefined' && diagIds(S.diag).length ? `<div class="diag-pop" role="dialog" aria-label="${esc(T('Схема', 'Schaubild', 'Diagram', 'Сызба'))}" data-diag="${S.diag}"><div class="diag-head"><b>◇ ${esc(T('Схема процесса', 'Prozess-Schaubild', 'Process diagram', 'Процесс сызбасы'))}</b><button type="button" class="ab-x" data-act="diagTog" aria-label="${esc(T('Закрыть', 'Schließen', 'Close', 'Жабу'))}">×</button></div>${diagIds(S.diag).map(id => `<figure class="hv" data-visual="${id}">${HELP.visuals[id]()}</figure>`).join('')}<p class="note">${esc(T('Полная статья — кнопка «?» в шапке.', 'Vollständiger Artikel — Knopf „?“ in der Kopfzeile.', 'Full article — the "?" button in the header.', 'Толық мақала — тақырыптағы «?» түймесі.'))}</p></div>` : '';

  /* ---------- 3. alarm banner: new alarms of level ≥ 2 since the page opened, up to 3, click → alarm, × dismisses ---------- */
  const alarmsL2 = () => (S.alarms || []).filter(a => a.lvl >= 2 && a.status !== 'closed');
  function bannerSync() {
    if (!S.alarms) return;
    const cur = alarmsL2(), ids = new Set(cur.map(a => a.id));
    if (!S.ban.seen) { S.ban.seen = ids; return; }   // alarms present on load are not "new"
    const add = cur.filter(a => !S.ban.seen.has(a.id)).map(a => a.id); S.ban.seen = ids;
    S.ban.items = add.concat(S.ban.items.filter(id => ids.has(id) && !add.includes(id))).slice(0, 3);
  }
  const banner = () => { const its = S.ban.items.map(id => S.alarms.find(a => a.id === id)).filter(Boolean); return its.length ? `<div class="alarm-banner" role="alert" data-alarm-banner="${its.length}"><div class="ab-head"><b>${esc(T('Новые тревоги уровня ≥ 2', 'Neue Alarme ab Stufe 2', 'New alarms of level ≥ 2', '≥ 2 деңгейдегі жаңа дабылдар'))}</b><button type="button" class="ab-x" data-act="banX" aria-label="${esc(T('Скрыть уведомление', 'Hinweis ausblenden', 'Dismiss notice', 'Хабарламаны жасыру'))}">×</button></div>${its.map(a => `<button type="button" class="ab-item" data-act="banGo" data-id="${a.id}" data-lvl="${a.lvl}"><span class="ab-src">L${a.lvl} · ${esc(a.hub || '')}</span><span>${esc(a.text)}</span></button>`).join('')}</div>` : ''; };
  Object.assign(ACT, {
    banX: () => { S.ban.items = []; render(); },
    banGo: d => { S.ban.items = S.ban.items.filter(id => id !== d.id); if (tabsOf('dashboard').some(t => t.key === 'alarms')) S.tab.dashboard = 'alarms'; go('dashboard'); if (S.route === 'dashboard' && DRAWERS.alarm) openDrawer({ type: 'alarm', id: d.id }); },
  });

  /* ---------- 7. demo sign-in (password → 2FA 123456 → recovery codes → forced change ≥ 12) → setRole; My account; Sign out; Reset ---------- */
  const USERS = { admin: 'sarah.johnson', dispatcher: 'a.saparova', warehouse: 'b.ermekov', driver: 'e.seitkali', auditor: 'o.berg', viewer: 't.akhmetov', manager: 'm.keller', finance: 'd.zhumabayeva', quality: 'a.schulz', customer: 'apteka.service', partner: 'transholod' };
  const DEMO_CODE = '123456', MIN_PW = 12;
  const mkCodes = seed => { let h = 7; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 100003; return Array.from({ length: 10 }, (_, i) => { h = (h * 1103515245 + 12345 + i) % 2147483648; const s = h.toString(36).toUpperCase().padStart(8, 'X').slice(-8); return s.slice(0, 4) + '-' + s.slice(4); }); };
  const sessEnd = () => fdt(new Date(NOW.getTime() + 12 * 3600e3));
  const fld = (id, label, type, val, hint) => `<label class="fl">${esc(label)}<input class="inp" id="${id}" data-au="${id.slice(3)}" type="${type}" value="${esc(val || '')}" autocomplete="off"${hint ? ` placeholder="${esc(hint)}"` : ''}></label>`;
  const loginLayer = () => {
    if (!S.auth.on) return '';
    const A = S.auth, cyr = LANG === 'ru' || LANG === 'kk', err = A.err ? `<p class="login-err" role="alert">${esc(A.err)}</p>` : '';
    const lang = ['ru', 'de', 'en', 'kk'].map(l => `<a href="${fileFor(l)}"${l === LANG ? ' class="on"' : ''}>${l.toUpperCase()}</a>`).join(' ');
    let body = '';
    if (A.step === 'password') body = `<h1>${esc(T('Вход в платформу', 'Anmeldung', 'Sign in', 'Платформаға кіру'))}</h1><p class="note">${esc(T('Демо: выберите учётную запись, пароль любой. Дальше — код 2FA, резервные коды и смена пароля, как в настоящей платформе.', 'Demo: Konto wählen, beliebiges Passwort. Danach 2FA-Code, Wiederherstellungscodes und Passwortwechsel wie in der echten Plattform.', 'Demo: pick an account, any password. Then the 2FA code, recovery codes and a password change, as in the real platform.', 'Демо: есептік жазбаны таңдаңыз, құпиясөз кез келген. Әрі қарай 2FA коды, резервтік кодтар және құпиясөзді ауыстыру.'))}</p>
<label class="fl">${esc(T('Учётная запись', 'Konto', 'Account', 'Есептік жазба'))}<select class="select" id="au_role" data-au="role">${ROLES.map(r => `<option value="${r}"${r === A.role ? ' selected' : ''}>${esc(USERS[r])} · ${esc(ROLE_NAME[r])}</option>`).join('')}</select></label>${fld('au_pw', T('Пароль', 'Passwort', 'Password', 'Құпиясөз'), 'password', A.pw, '••••••••')}${err}<button class="btn primary block" data-act="authPw">${esc(T('Войти', 'Anmelden', 'Sign in', 'Кіру'))}</button>`;
    else if (A.step === 'mfa') body = `<h1>${esc(T('Второй фактор', 'Zweiter Faktor', 'Second factor', 'Екінші фактор'))}</h1><p class="note">${esc(T('Введите 6-значный код из приложения-аутентификатора. Демо-код: ', 'Geben Sie den 6-stelligen Code aus der Authenticator-App ein. Demo-Code: ', 'Enter the 6-digit code from the authenticator app. Demo code: ', 'Аутентификатор қосымшасындағы 6 таңбалы кодты енгізіңіз. Демо коды: '))}<b>${DEMO_CODE}</b></p>${fld('au_code', T('Код', 'Code', 'Code', 'Код'), 'text', A.code, '000000')}${err}<button class="btn primary block" data-act="authMfa">${esc(T('Подтвердить', 'Bestätigen', 'Verify', 'Растау'))}</button>`;
    else if (A.step === 'recovery') body = `<h1>${esc(T('Резервные коды', 'Wiederherstellungscodes', 'Recovery codes', 'Резервтік кодтар'))}</h1><p class="note">${esc(T('Показываются один раз, каждый действует один раз. Сохраните их в надёжном месте.', 'Werden einmal gezeigt, jeder gilt einmal. Bewahren Sie sie sicher auf.', 'Shown once, each works once. Store them in a safe place.', 'Бір рет көрсетіледі, әрқайсысы бір рет жарамды. Сенімді жерде сақтаңыз.'))}</p><ol class="codes">${A.codes.map(c => `<li><code>${c}</code></li>`).join('')}</ol><button class="btn primary block" data-act="authCodes">${esc(T('Я сохранил коды — продолжить', 'Codes gesichert — weiter', 'I saved the codes — continue', 'Кодтарды сақтадым — жалғастыру'))}</button>`;
    else body = `<h1>${esc(T('Смена пароля', 'Passwort ändern', 'Change password', 'Құпиясөзді ауыстыру'))}</h1><p class="note">${esc(T('Первый вход: задайте свой пароль — минимум 12 символов, лучше фраза из нескольких слов.', 'Erste Anmeldung: eigenes Passwort festlegen — mindestens 12 Zeichen, am besten eine Passphrase.', 'First sign-in: set your own password — at least 12 characters, a passphrase works best.', 'Алғашқы кіру: өз құпиясөзіңізді орнатыңыз — кемінде 12 таңба.'))}</p>${fld('au_np', T('Новый пароль', 'Neues Passwort', 'New password', 'Жаңа құпиясөз'), 'password', A.np)}${fld('au_np2', T('Повторите пароль', 'Passwort wiederholen', 'Repeat the password', 'Құпиясөзді қайталаңыз'), 'password', A.np2)}${err}<button class="btn primary block" data-act="authChange">${esc(T('Сохранить и войти', 'Speichern und anmelden', 'Save and sign in', 'Сақтау және кіру'))}</button>`;
    return `<div class="login-layer" data-login-step="${A.step}"><div class="login-card card"><div class="brand"><img src="assets/brand/kokzhol-mark.svg" alt="Kökzhol" width="36" height="36"><span><span class="wordmark">${cyr ? 'көкжол' : 'kökzhol'}</span><span class="claim">${esc(T('Холодовая цепь точно по графику.', 'Kühlkette im Takt.', 'Cold chain, on schedule.', 'Суық тізбек — кестемен.'))}</span></span></div>${body}<div class="login-foot"><span class="langs">${lang}</span><span>v${VERSION} · ${esc(BUILD)}</span></div></div></div>`;
  };
  const pwCheck = (a, b) => a.length < MIN_PW ? T('Минимум 12 символов', 'Mindestens 12 Zeichen', 'At least 12 characters', 'Кемінде 12 таңба') : a !== b ? T('Пароли не совпадают', 'Passwörter stimmen nicht überein', 'Passwords do not match', 'Құпиясөздер сәйкес емес') : '';
  globalThis.pwCheck = pwCheck;
  Object.assign(ACT, {
    signOut: () => { const u = USERS[S.role] || S.role; if (typeof audit === 'function') audit('Auth', u, T('Выход', 'Abmeldung', 'Sign out', 'Шығу'), ''); S.auth = Object.assign(S.auth, { on: true, step: 'password', role: S.role, pw: '', code: '', np: '', np2: '', err: '', codes: [] }); S.drawer = null; S.diag = null; S.sideOpen = false; render(); },
    authPw: () => { const A = S.auth; if (!A.pw) { A.err = T('Введите пароль', 'Passwort eingeben', 'Enter the password', 'Құпиясөзді енгізіңіз'); return render(); } A.err = ''; A.step = 'mfa'; A.code = ''; render(); },
    authMfa: () => { const A = S.auth; if (A.code.trim() !== DEMO_CODE) { A.err = T('Неверный код. Демо-код 123456.', 'Falscher Code. Demo-Code 123456.', 'Wrong code. Demo code 123456.', 'Код қате. Демо коды 123456.'); return render(); } A.err = ''; A.codes = mkCodes(USERS[A.role] || A.role); A.step = 'recovery'; render(); },
    authCodes: () => { S.auth.step = 'change'; S.auth.np = ''; S.auth.np2 = ''; S.auth.err = ''; render(); },
    authChange: () => { const A = S.auth, e = pwCheck(A.np, A.np2); if (e) { A.err = e; return render(); } const role = A.role; A.lastLogin = kzNow().toISOString(); Object.assign(A, { on: false, step: 'password', pw: '', code: '', np: '', np2: '', err: '', codes: [] }); if (typeof audit === 'function') audit('Auth', USERS[role] || role, T('Вход · 2FA · смена пароля', 'Anmeldung · 2FA · Passwortwechsel', 'Sign-in · 2FA · password change', 'Кіру · 2FA · құпиясөз ауыстыру'), ''); ACT.setRole({ v: role }); toast(T('Добро пожаловать, ', 'Willkommen, ', 'Welcome, ', 'Қош келдіңіз, ') + ROLE_NAME[role]); },
    acctPw: () => { const e = pwCheck(S.acct.np, S.acct.np2); S.acct.ok = !e; S.acct.msg = e || T('Пароль изменён (демо).', 'Passwort geändert (Demo).', 'Password changed (demo).', 'Құпиясөз өзгертілді (демо).'); if (!e) { S.acct.np = ''; S.acct.np2 = ''; if (typeof audit === 'function') audit('Auth', USERS[S.role] || S.role, T('Смена пароля', 'Passwortwechsel', 'Password change', 'Құпиясөз ауыстыру'), ''); } render(); },
    resetAsk: () => { S.resetAsk = !S.resetAsk; render(); },
    resetGo: () => { demoReset(); },
  });
  document.addEventListener('input', e => { const t = e.target; if (!t.dataset || !t.dataset.au) return; S.auth[t.dataset.au] = t.value; S.auth.err = ''; });
  document.addEventListener('change', e => { const t = e.target; if (t.id === 'au_role') { S.auth.role = t.value; } });
  document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.ac) { S.acct[t.dataset.ac] = t.value; S.acct.msg = ''; } });
  document.addEventListener('keydown', e => { if (e.key !== 'Enter' || !S.auth.on || !e.target.dataset || !e.target.dataset.au) return; e.preventDefault(); ({ password: ACT.authPw, mfa: ACT.authMfa, change: ACT.authChange }[S.auth.step] || (() => {}))(); });
  /* Reset demo data: re-seed the core demo arrays in place and reload the page outside the test harness (the whole state lives in memory) */
  function demoReset() {
    S.loads = mkLoads(); S.drivers = mkDrivers(); S.trucks = mkTrucks(); S.hubs = mkHubs(); S.jobs = mkJobs();
    S.hub = ''; S.gs.q = ''; S.drawer = null; S.diag = null; S.resetAsk = false; S.f = { q: '', status: '', cust: '', zone: '', pri: '', hub: '', drv: '', page: 1 };
    if (typeof audit === 'function') audit('Demo', 'reset', T('Сброс демо-данных', 'Demo-Daten zurückgesetzt', 'Demo data reset', 'Демо деректер қалпына келтірілді'), '');
    if (typeof window !== 'undefined' && !window.frameElement) { location.reload(); return; }
    toast(T('Демо-данные сброшены', 'Demo-Daten zurückgesetzt', 'Demo data reset', 'Демо деректер қалпына келтірілді'));
  }
  globalThis.demoReset = demoReset;
  const kv = (k, v) => `<div><small>${esc(k)}</small><b>${v}</b></div>`;
  SCREENS.account = {
    title: () => T('Мой аккаунт', 'Mein Konto', 'My account', 'Менің аккаунтым'),
    sub: () => T('Логин, роль, 2FA, сессия, смена пароля, выход, сброс демо-данных', 'Benutzer, Rolle, 2FA, Sitzung, Passwortwechsel, Abmeldung, Demo-Daten zurücksetzen', 'Username, role, 2FA, session, password change, sign out, reset demo data', 'Логин, рөл, 2FA, сессия, құпиясөз ауыстыру, шығу, демо деректерді қалпына келтіру'),
    actions: () => `<button class="btn grey" data-act="signOut">${esc(T('Выйти', 'Abmelden', 'Sign out', 'Шығу'))}</button>`,
    body: () => {
      const USER = { admin: 'Sarah Johnson', dispatcher: nm('Айгерим Сапарова'), warehouse: nm('Болат Ермеков'), driver: nm('Ерлан Сейтқали'), auditor: 'Olga Berg', viewer: 'Timur Akhmetov', manager: 'Max Keller', finance: nm('Дана Жумабаева'), quality: 'Anna Schulz', customer: nm('ТОО «Аптека Сервис»'), partner: nm('ТОО «ТрансХолод»') };
      const last = S.auth.lastLogin ? fdt(S.auth.lastLogin) : fdt(NOW);
      return `<div class="acct"><div class="card card-body" data-account><h3 style="margin:0 0 12px">${esc(T('Учётная запись', 'Konto', 'Account', 'Есептік жазба'))}</h3><div class="kv">${kv(T('Логин', 'Benutzername', 'Username', 'Логин'), esc(USERS[S.role] || S.role))}${kv(T('Имя', 'Name', 'Name', 'Аты'), esc(USER[S.role] || '—'))}${kv(T('Роль', 'Rolle', 'Role', 'Рөл'), esc(ROLE_NAME[S.role]))}${kv(T('Хаб по умолчанию', 'Standard-Hub', 'Default hub', 'Әдепкі хаб'), S.hub ? esc(HUBS[S.hub].city) : esc(T('все', 'alle', 'all', 'барлығы')))}${kv('2FA', chip('green', T('включена', 'aktiv', 'on', 'қосулы')))}${kv(T('Сессия до', 'Sitzung bis', 'Session until', 'Сессия дейін'), sessEnd())}${kv(T('Последний вход', 'Letzte Anmeldung', 'Last sign-in', 'Соңғы кіру'), last)}${kv(T('Права', 'Rechte', 'Permissions', 'Құқықтар'), (ROLE_PERMS[S.role] || []).length)}</div>
<p class="note" style="margin-top:12px">${esc(T('Сессия заканчивается через 30 минут бездействия и не позже чем через 12 часов. Все права роли — в справке «Роли и права».', 'Die Sitzung endet nach 30 Minuten Inaktivität und spätestens nach 12 Stunden. Alle Rechte der Rolle — Hilfe „Rollen und Rechte“.', 'The session ends after 30 minutes of inactivity and after 12 hours at the latest. All rights of the role — help "Roles and permissions".', 'Сессия 30 минут әрекетсіздіктен кейін және ең кеш 12 сағаттан соң аяқталады.'))} <a class="lnk" data-act="helpGo" data-k="roles" role="button" tabindex="0">${esc(T('Открыть', 'Öffnen', 'Open', 'Ашу'))} →</a></p></div>
<div><div class="card card-body" data-acct-pw><h3 style="margin:0 0 12px">${esc(T('Смена пароля', 'Passwort ändern', 'Change password', 'Құпиясөзді ауыстыру'))}</h3><label class="fl">${esc(T('Новый пароль (≥ 12 символов)', 'Neues Passwort (≥ 12 Zeichen)', 'New password (≥ 12 characters)', 'Жаңа құпиясөз (≥ 12 таңба)'))}<input class="inp" id="ac_np" data-ac="np" type="password" value="${esc(S.acct.np)}" autocomplete="new-password"></label><label class="fl">${esc(T('Повторите', 'Wiederholen', 'Repeat', 'Қайталаңыз'))}<input class="inp" id="ac_np2" data-ac="np2" type="password" value="${esc(S.acct.np2)}" autocomplete="new-password"></label>${S.acct.msg ? `<p class="note ${S.acct.ok ? 'tone-g' : 'tone-r'}" data-acct-msg>${esc(S.acct.msg)}</p>` : ''}<button class="btn primary" data-act="acctPw">${esc(T('Сохранить', 'Speichern', 'Save', 'Сақтау'))}</button></div>
<div class="card card-body" style="margin-top:var(--gap)" data-demo-reset><h3 style="margin:0 0 8px">${esc(T('Онлайн-демо', 'Online-Demo', 'Online demo', 'Онлайн демо'))}</h3><p class="note">${esc(T('Симулированные данные, сервера нет. Сброс возвращает рейсы, водителей, транспорт, хабы и приёмку к исходному состоянию.', 'Simulierte Daten, kein Server. Zurücksetzen stellt Fahrten, Fahrer, Fahrzeuge, Hubs und Wareneingang auf den Ausgangszustand.', 'Simulated data, no server. Reset returns loads, drivers, trucks, hubs and receiving to the initial state.', 'Симуляцияланған деректер, сервер жоқ. Қалпына келтіру рейстерді, жүргізушілерді, көлікті, хабтарды бастапқы күйге қайтарады.'))}</p>${S.resetAsk ? `<div class="actbar"><button class="btn red" data-act="resetGo">${esc(T('Да, сбросить', 'Ja, zurücksetzen', 'Yes, reset', 'Иә, қалпына келтіру'))}</button><button class="btn grey" data-act="resetAsk">${esc(T('Отмена', 'Abbrechen', 'Cancel', 'Болдырмау'))}</button></div>` : `<button class="btn grey" data-act="resetAsk">${esc(T('Сбросить демо-данные', 'Demo-Daten zurücksetzen', 'Reset demo data', 'Демо деректерді қалпына келтіру'))}</button>`}</div></div></div>`;
    },
  };

  /* ---------- 6. deep links (FR-175): ?load= ?dev= ?fine= ?s=&t= — applied once every screen file has registered; ?track= / ?request=1 stay with 530-public.js ---------- */
  function deepLinks() {
    const sp = new URLSearchParams(location.search); if (sp.get('track') || sp.get('request')) return;
    const s = sp.get('s'), t = sp.get('t'), ld = sp.get('load'), dev = sp.get('dev'), fine = sp.get('fine');
    const notFound = (what, v) => toast(what + ' ' + T('не найден: ', 'nicht gefunden: ', 'not found: ', 'табылмады: ') + v, 'err');
    if (ld) { const l = S.loads.find(x => numMatch(x.id, ld) === 2) || S.loads.find(x => numMatch(x.id, ld)); if (!l) return notFound(T('Рейс', 'Fahrt', 'Load', 'Рейс'), ld); if (!canSee('orders')) return go('orders'); S.tab.orders = 'orders'; S.route = 'orders'; S.drawer = { type: 'load', id: l.id, tab: 'overview' }; return render(); }
    if (dev) { if (!canSee('pod')) return go('pod'); if (!(S.devs || []).some(d => d.id === dev)) return notFound(T('Отклонение', 'Abweichung', 'Deviation', 'Ауытқу'), dev); S.tab.pod = 'quality'; S.route = 'pod'; if (ACT.qDev) ACT.qDev({ id: dev }); else render(); return; }
    if (fine) { if (!canSee('reports')) return go('reports'); if (!(S.eco && S.eco.fines && S.eco.fines.some(f => f.id === fine))) return notFound(T('Штраф', 'Bußgeld', 'Fine', 'Айыппұл'), fine); S.tab.reports = 'fines'; S.eco.fineSel = fine; S.route = 'reports'; return render(); }
    if (s) { if (!canSee(s)) return go(s); if (t) S.tab[s] = t; S.route = s; render(); }
  }
  globalThis.applyDeepLinks = deepLinks;
  document.addEventListener('DOMContentLoaded', deepLinks);

  /* ---------- overlays + render hook (document.title, ◇ Diagram button) ---------- */
  globalThis.shellOverlays = () => banner() + bottomBar() + diagPop() + loginLayer();
  function shellAfter() {
    document.title = [S.drawer && S.drawer.id, navLabel(S.route), 'Kökzhol'].filter(Boolean).join(' · ');
    if (S.route === 'help') return;
    const act = $('.page-head .actions'); if (!act || $('.diag-btn', act) || !diagOf()) return;
    act.insertAdjacentHTML('beforeend', `<button type="button" class="btn grey sm diag-btn" data-act="diagTog" aria-expanded="${!!S.diag}" title="${esc(T('Схема процесса', 'Prozess-Schaubild', 'Process diagram', 'Процесс сызбасы'))}">◇ ${esc(T('Схема', 'Schaubild', 'Diagram', 'Сызба'))}</button>`);
  }
  const render0 = render;
  render = function () { bannerSync(); render0(); shellAfter(); };
})();
