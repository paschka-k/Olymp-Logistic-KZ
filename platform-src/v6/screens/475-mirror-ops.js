/* R1 · Mirror 0.3.9 (operations, shell part): Dispatcher menu badge "express awaiting my signature" (Shell useV5Nav), sidebar block
   "Alarm simulation" (Shell SimButtons), inbox registration form with the 0.3.9 kind-specific fields, fixed sources and side effects
   (Inbox.tsx InboxForm + engine/inbox.ts), "Demo: receive test messages", error / meta lines, security and telematics messages as
   Security incidents (FR-136). Sources: 0.3.9 v5/Shell.tsx, v5/Inbox.tsx, v5/engine/inbox.ts. Map: docs/MIRROR-0.3.9-ops.md (S2, S3, I3–I5, Y2). */
(function () {
  const css = document.createElement('style');
  css.textContent = `.side-sim{margin:8px 12px 0;padding:8px 0 0;border-top:1px solid rgba(255,255,255,.12)}.side-sim .side-link{font-size:12.5px}.side-sim .side-link.on{color:var(--label-red);font-weight:600}
.in-meta{font-size:12px;color:var(--text-muted)}.in-err{font-size:12px;color:var(--chip-red-fg);font-weight:600}`;
  document.head.appendChild(css);

  /* ---------- S2 · Dispatcher menu badge: pending express requests in which one of my functions still has to sign ---------- */
  const exMine = () => (S.express || []).filter(e => e.status === 'pending' && (typeof myFns === 'function' ? myFns() : []).some(fn => !(e.sig || {})[fn])).length;
  globalThis.exAwaitingMine = exMine;
  const nb0 = NAV_BADGE.dispatch;
  NAV_BADGE.dispatch = () => (nb0 ? +nb0() || 0 : 0) + exMine() || '';

  /* ---------- S3 · sidebar "Alarm simulation": five sims of 0.3.9, each with its vehicle; start → toast pointing to the Dashboard playbook ---------- */
  const SIMS = [['freeze', T('Замерзание 2–8 °C', 'Einfrieren 2–8 °C', 'Freezing 2–8 °C', 'Қатып қалу 2–8 °C')], ['heat', T('Перегрев камеры', 'Kammer-Überhitzung', 'Chamber overheating', 'Камераның қызып кетуі')],
    ['fire', T('Пожар', 'Brand', 'Fire', 'Өрт')], ['breakdown', T('Поломка', 'Panne', 'Breakdown', 'Бұзылу')], ['theft', T('Кража / вскрытие', 'Diebstahl / Aufbruch', 'Theft / break-in', 'Ұрлық / бұзып ашу')]];
  globalThis.MIRROR_SIMS = SIMS;
  const running = () => (typeof simActive === 'function' ? simActive() : []);
  globalThis.shellSideExtra = () => {
    if (S.role === 'customer' || S.role === 'partner' || S.role === 'driver' || typeof simStart !== 'function') return '';
    const on = running();
    return `<div class="side-tools side-sim" data-side-sim><div class="side-h">${esc(T('Симуляция тревог', 'Alarmsimulation', 'Alarm simulation', 'Дабыл симуляциясы'))}</div>${SIMS.map(([k, l]) => { const r = on.find(x => x.kind === k), v = r && r.truck ? trk(r.truck).plate : ''; return `<a class="side-link${r ? ' on' : ''}" role="button" tabindex="0" data-act="sideSim" data-k="${k}" data-sim-k="${k}" aria-pressed="${!!r}">${ic('alert', 14)}<span>${r ? esc(T('Стоп · ', 'Stopp · ', 'Stop · ', 'Тоқтату · ')) : ''}${esc(l)}${v ? ' · ' + esc(v) : ''}</span></a>`; }).join('')}</div>`;
  };
  ACT.sideSim = d => {
    if (!canDo('alarms:write')) return toast(T('Нужно право alarms:write', 'Recht alarms:write nötig', 'Needs alarms:write', 'alarms:write құқығы қажет'), 'err');
    const r = running().find(x => x.kind === d.k), title = (SIMS.find(x => x[0] === d.k) || [])[1];
    if (r) { simStop(d.k); audit('Simulation', d.k, T('Сброс · ', 'Zurückgesetzt · ', 'Reset · ', 'Қалпына келтіру · ') + title, ''); return render(); }
    const e = simStart(d.k); if (typeof e === 'string') return toast(e, 'err');
    audit('Simulation', d.k, T('Симуляция · ', 'Simulation · ', 'Simulation · ', 'Симуляция · ') + title, '');
    toast(T('Тревога: ', 'Alarm: ', 'Alarm: ', 'Дабыл: ') + title + T(' — инструкция на экране «', ' — Anleitung auf dem Bildschirm „', ' — instructions on the “', ' — нұсқаулық «') + navLabel('dashboard') + T('»', '“', '” screen', '» экранында'));
  };

  /* ---------- D3 · Dispatch → Board: unassigned ERP orders with one-click "To trip X" (0.3.9 screen 02 "open-orders") ---------- */
  const PAL = T('пал.', 'Pal.', 'pal.', 'пал.');
  /* the planned trip of the same hub that passes the destination (else any planned trip of the hub); never a released or departed one */
  const tripFor = o => { const pl = S.loads.filter(l => ['unassigned', 'assigned'].includes(l.status) && l.from === o.hub && !(typeof released === 'function' && released(l))); return pl.find(l => l.to === o.to || (typeof routeCities === 'function' && routeCities(l).includes(o.to))) || pl[0] || null; };
  globalThis.openOrderTrip = tripFor;
  function openOrders() {
    const list = (S.orders || []).filter(o => o.status === 'new' && !o.load), can = canDo('trips:write');
    const rows = list.map(o => { const l = tripFor(o); return `<div class="pn-ord" style="grid-template-columns:96px minmax(0,1fr) 96px 64px 150px;cursor:default" data-open-order="${o.id}"><b>${o.id}</b><span>${esc(o.city)} · ${esc(o.goods)}</span><span>${zoneChip(o.cls)}</span><span>${o.pal < 1 ? esc(T('бокс', 'Box', 'box', 'бокс')) : o.pal + ' ' + esc(PAL)}</span><span>${can && l ? `<button class="btn sm primary" data-act="ooTrip" data-id="${o.id}" data-l="${l.id}">${esc(T('В рейс ', 'In Tour ', 'To trip ', 'Рейске '))}${l.id.slice(-4)}</button>` : ''}</span></div>`; }).join('');
    return `<div class="card lw-card" data-sec="open-orders" style="margin-top:16px"><h3 class="lw-h" style="margin-top:0">${esc(T('Нераспределённые заказы', 'Nicht zugewiesene Aufträge', 'Unassigned orders', 'Тағайындалмаған тапсырыстар'))} · ${list.length} <span class="note">${esc(T('из ERP KDL Olymp · хаб Астана', 'aus ERP KDL Olymp · Hub Astana', 'from KDL Olymp ERP · hub Astana', 'KDL Olymp ERP · Астана хабы'))}</span></h3>${rows || `<p class="note" data-open-empty>${esc(T('Все заказы распределены.', 'Alle Aufträge verteilt.', 'All orders assigned.', 'Барлық тапсырыстар бөлінді.'))}</p>`}</div>`;
  }
  const bt = (SCREENS.dispatch.tabs || []).find(t => t.key === 'board');
  if (bt) { const b0 = bt.body; bt.body = () => b0() + openOrders(); }
  ACT.ooTrip = d => {
    if (!canDo('trips:write')) return toast(T('Нужно право trips:write', 'Recht trips:write nötig', 'Needs trips:write', 'trips:write құқығы қажет'), 'err');
    const o = S.orders.find(x => x.id === d.id), l = load(d.l); if (!o || !l || !['unassigned', 'assigned'].includes(l.status)) return toast(T('Рейс недоступен', 'Fahrt nicht verfügbar', 'Trip not available', 'Рейс қолжетімсіз'), 'err');
    const p0 = l.pallets, k0 = l.kg; orderAttach(l.id, o.id); if (l.pallets === p0) { l.pallets = Math.min(33, p0 + Math.ceil(o.pal)); l.kg = k0 + o.kg; }
    l.notes.push({ who: 'System', t: fdt(NOW).slice(-5), text: o.id + T(' добавлен в рейс', ' der Fahrt hinzugefügt', ' added to the trip', ' рейске қосылды') });
    audit('Dispatch', l.id, 'Order to trip', o.id); toast(o.id + ' → ' + l.id);
  };

  /* ---------- I3 · inbox registration form of 0.3.9: fixed sources and fields per kind, side effects ---------- */
  const L4 = (r, d, e, k) => T(r, d, e, k);
  const SRC = {
    road_closure: ['KazAvtoZhol', L4('Полиция', 'Polizei', 'Police', 'Полиция'), L4('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'), L4('МЧС', 'Katastrophenschutz (MChS)', 'Emergencies ministry (MChS)', 'ТЖМ'), L4('Вручную', 'Manuell', 'Manual', 'Қолмен')],
    weather_warning: [nm('Казгидромет'), L4('МЧС', 'Katastrophenschutz (MChS)', 'Emergencies ministry (MChS)', 'ТЖМ'), L4('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'), L4('Вручную', 'Manuell', 'Manual', 'Қолмен')],
    traffic_fine: ['SMS 1414', 'Kaspi', 'eGov', 'Sergek', L4('Полиция', 'Polizei', 'Police', 'Полиция')],
    workshop_status: [L4('Телефон', 'Telefon', 'Phone', 'Телефон'), L4('Сервис', 'Werkstatt', 'Workshop', 'Сервис'), L4('Водитель', 'Fahrer', 'Driver', 'Жүргізуші')],
    security_event: [L4('Центр безопасности', 'Sicherheitszentrale', 'Security centre', 'Қауіпсіздік орталығы'), L4('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'), L4('Телефон', 'Telefon', 'Phone', 'Телефон')],
    telematics_alarm: ['Wialon', L4('Водитель', 'Fahrer', 'Driver', 'Жүргізуші')],
    lead: [L4('Телефон', 'Telefon', 'Phone', 'Телефон'), L4('Сайт', 'Website', 'Website', 'Сайт'), 'ATI', 'Lardi'],
    tender: ['goszakup.gov.kz', nm('СК-Фармация')],
    doc_status: [nm('ИС ЭСФ'), nm('ЕСУТД')] };
  const OFF = { sp20: L4('Превышение до 20 км/ч', 'Geschwindigkeit bis 20 km/h', 'Speeding up to 20 km/h', '20 км/сағ дейін асыру'), sp40: L4('Превышение на 20–40 км/ч', 'Geschwindigkeit um 20–40 km/h', 'Speeding by 20–40 km/h', '20–40 км/сағ асыру'), red: L4('Проезд на красный', 'Rotlichtverstoß', 'Red light', 'Қызыл шамнан өту'), axle: L4('Перегруз по оси', 'Achsüberladung', 'Axle overload', 'Ось бойынша артық жүк'), park: L4('Стоянка', 'Parken', 'Parking', 'Тұрақ') };
  const WST = { accepted: L4('принята', 'angenommen', 'accepted', 'қабылданды'), eta: L4('ETA сообщено', 'ETA gemeldet', 'ETA reported', 'ETA хабарланды'), onsite: L4('на месте / в работе', 'vor Ort / in Arbeit', 'on site / in work', 'орнында / жұмыста'), done: L4('выполнено', 'erledigt', 'done', 'орындалды'), cancelled: L4('отменено', 'storniert', 'cancelled', 'болдырылмады') };
  const WST2SVC = { accepted: 'accepted', eta: 'accepted', onsite: 'in_work', done: 'done', cancelled: 'cancelled' };
  const DOCK = { esf: L4('ЭСФ', 'ESF', 'ESF', 'ЭШФ'), snt: L4('СНТ', 'SNT', 'SNT', 'СНТ'), ettn: L4('э-ТТН', 'E-TTN', 'e-TTN', 'э-ТТЖ'), sheet: L4('Путевой лист', 'Fahrauftrag', 'Trip sheet', 'Жол парағы'), other: L4('Другое', 'Sonstiges', 'Other', 'Басқа') };
  const DOCST = { registered: L4('зарегистрирован', 'registriert', 'registered', 'тіркелді'), accepted: L4('принят', 'angenommen', 'accepted', 'қабылданды'), sent: L4('отправлен', 'gesendet', 'sent', 'жіберілді'), rejected: L4('отклонён', 'abgelehnt', 'rejected', 'қабылданбады'), error: L4('ошибка', 'Fehler', 'error', 'қате') };
  const ERR = { veh: L4('ТС не найдено', 'Fahrzeug unbekannt', 'vehicle unknown', 'КҚ табылмады'), ptn: L4('сервис-партнёр не найден', 'Servicepartner unbekannt', 'service partner unknown', 'сервис-серіктес табылмады'), noreq: L4('нет открытой заявки', 'kein offener Auftrag', 'no open request', 'ашық өтінім жоқ'), closed: L4('заявка уже закрыта', 'Auftrag bereits geschlossen', 'request already closed', 'өтінім жабылған'), trip: L4('рейс не найден', 'Tour unbekannt', 'trip unknown', 'рейс табылмады') };
  globalThis.INBOX_SRC = SRC; globalThis.INBOX_ERR = ERR;
  const F0 = k => ({ kind: k, lvl: null, src: '', title: '', text: '', city: '', cto: '', km: '', until: '', veh: '', date: NOW.toISOString().slice(0, 10), time: '12:00', amount: '', off: '', place: '', ptn: '', wst: 'accepted', eta: '', atype: 'door', trip: '', doc: 'esf', dst: 'accepted' });
  const kinds = () => Object.keys(INBOX_KIND).filter(k => k !== 'sms_ack_timeout' && (!INBOX_KPERM || canDo(INBOX_KPERM[k])));
  const kv = (lbl, ctl, req) => `<label class="fl">${esc(lbl)}${req ? ' *' : ''}${ctl}</label>`;
  const inp = (k, type, ph) => `<input class="select" data-inf="${k}" id="inf_${k}" type="${type || 'text'}" value="${esc(S.inF[k] || '')}"${ph ? ` placeholder="${esc(ph)}"` : ''}>`;
  const sel = (k, opts, none) => `<select class="select" data-inf="${k}" id="inf_${k}">${none ? `<option value="">${esc(none)}</option>` : ''}${opts.map(([v, l]) => `<option value="${esc(v)}"${String(S.inF[k]) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  const CITY_OPTS = () => Object.keys(ROAD_CITY).map(c => [c, ROAD_CITY[c]]);
  const TRUCK_OPTS = () => S.trucks.map(t => [t.id, t.plate + ' · ' + t.make]);
  const WS_OPTS = () => (globalThis.RES && RES.PARTNERS_SVC ? RES.PARTNERS_SVC : []).map(p => [p, p]);
  function kindFields(k) {
    const F = S.inF;
    if (k === 'road_closure' || k === 'weather_warning') return `<div class="two">${kv(T('Город / начало участка', 'Stadt / Beginn des Abschnitts', 'City / start of the stretch', 'Қала / учаскенің басы'), sel('city', CITY_OPTS(), '—'), true)}${kv(T('Конец участка', 'Ende des Abschnitts', 'End of the stretch', 'Учаскенің соңы'), sel('cto', CITY_OPTS(), '—'))}</div><div class="two">${kv(T('Участок, км', 'Abschnitt, km', 'Stretch, km', 'Учаске, км'), inp('km', 'text', 'км 120–180'.replace('км', T('км', 'km', 'km', 'км'))))}${kv(T('Действует до', 'Gültig bis', 'Valid until', 'Дейін жарамды'), inp('until', 'datetime-local'))}</div>`;
    if (k === 'traffic_fine') return `<div class="two">${kv(T('ТС', 'Fahrzeug', 'Vehicle', 'КҚ'), sel('veh', TRUCK_OPTS(), '—'), true)}${kv(T('Нарушение', 'Verstoß', 'Offence', 'Бұзушылық'), sel('off', Object.keys(OFF).map(x => [x, OFF[x]]), '—'), true)}</div><div class="two">${kv(T('Дата', 'Datum', 'Date', 'Күні'), inp('date', 'date'))}${kv(T('Время', 'Uhrzeit', 'Time', 'Уақыт'), inp('time', 'time'))}</div><div class="two">${kv(T('Сумма, ₸', 'Betrag, ₸', 'Amount, ₸', 'Сомасы, ₸'), inp('amount', 'number'))}${kv(T('Место', 'Ort', 'Place', 'Орны'), inp('place'))}</div>`;
    if (k === 'workshop_status') return `${kv(T('Сервис-партнёр', 'Servicepartner', 'Service partner', 'Сервис-серіктес'), sel('ptn', WS_OPTS(), '—'), true)}<div class="two">${kv(T('ТС', 'Fahrzeug', 'Vehicle', 'КҚ'), sel('veh', TRUCK_OPTS(), '—'))}${kv(T('Статус', 'Status', 'Status', 'Күйі'), sel('wst', Object.keys(WST).map(x => [x, WST[x]])))}</div>${kv('ETA', inp('eta', 'datetime-local'))}`;
    if (k === 'security_event' || k === 'telematics_alarm') return `<div class="two">${kv(T('ТС', 'Fahrzeug', 'Vehicle', 'КҚ'), sel('veh', TRUCK_OPTS(), '—'))}${kv(T('Тип тревоги', 'Alarmart', 'Alarm type', 'Дабыл түрі'), sel('atype', Object.keys(ALARM_CAT).map(x => [x, ALARM_CAT[x]])))}</div>${kv(T('Город', 'Stadt', 'City', 'Қала'), sel('city', CITY_OPTS(), '—'))}`;
    if (k === 'doc_status') return `${kv(T('Рейс', 'Fahrt', 'Trip', 'Рейс'), sel('trip', S.loads.map(l => [l.id, l.id + ' · ' + HUBS[l.from].city + ' → ' + HUBS[l.to].city]), '—'), true)}<div class="two">${kv(T('Документ', 'Dokument', 'Document', 'Құжат'), sel('doc', Object.keys(DOCK).map(x => [x, DOCK[x]])))}${kv(T('Статус', 'Status', 'Status', 'Күйі'), sel('dst', Object.keys(DOCST).map(x => [x, DOCST[x]])))}</div>`;
    return '';
  }
  const ROUTE_OF = k => ({ road_closure: 'routes', weather_warning: 'routes', traffic_fine: 'reports', workshop_status: 'dispatch', security_event: 'routes', telematics_alarm: 'dashboard', lead: 'orders', tender: 'orders', doc_status: 'orders' }[k]);
  DRAWERS.inboxNew = () => {
    if (!S.inF || !kinds().includes(S.inF.kind)) S.inF = F0(kinds()[0]);
    const F = S.inF, k = F.kind, lvl = F.lvl == null ? INBOX_DEF_LVL[k] : F.lvl, srcs = SRC[k] || [];
    if (!F.src || !srcs.includes(F.src)) F.src = srcs[0] || '';
    return { title: T('Сообщение зарегистрировать', 'Meldung erfassen', 'Register a message', 'Хабарды тіркеу'), html: `<div class="drawer-section rec-form" data-inbox-form="${k}"><p class="note">${esc(T('Для систем без API (звонок, SMS, письмо): сообщение попадает во входящие и действует как из коннектора.', 'Für Systeme ohne API (Anruf, SMS, E-Mail): die Meldung landet im Eingang und wirkt wie aus einem Konnektor.', 'For systems without an API (call, SMS, e-mail): the message lands in the inbox and acts like one from a connector.', 'API жоқ жүйелер үшін (қоңырау, SMS, хат): хабар кіріске түседі және коннектордан келгендей әрекет етеді.'))}</p>
<div class="two">${kv(T('Тип', 'Art', 'Kind', 'Түрі'), `<select class="select" id="in_kind" data-inf="kind">${kinds().map(x => `<option value="${x}"${x === k ? ' selected' : ''}>${esc(INBOX_KIND[x])}</option>`).join('')}</select>`)}${kv(T('Уровень', 'Stufe', 'Level', 'Деңгей'), `<select class="select" id="in_lvl" data-inf="lvl">${[0, 1, 2, 3].map(l => `<option value="${l}"${l === lvl ? ' selected' : ''}>${l}</option>`).join('')}</select>`)}</div>
${kv(T('Источник', 'Quelle', 'Source', 'Дереккөз'), `<select class="select" id="in_src" data-inf="src">${srcs.map(s => `<option${s === F.src ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select>`)}
${kindFields(k)}${kv(T('Заголовок', 'Titel', 'Title', 'Тақырып'), `<input class="select" id="in_title" data-inf="title" value="${esc(F.title)}">`, true)}${kv(T('Текст', 'Text', 'Text', 'Мәтін'), `<textarea class="ta" id="in_text" data-inf="text" rows="3">${esc(F.text)}</textarea>`)}
<p class="note" id="in_err" style="color:var(--chip-red-fg)">${esc(F.err || '')}</p><button class="btn primary block" data-act="inSave">${esc(T('Зарегистрировать сообщение', 'Meldung erfassen', 'Register message', 'Хабарды тіркеу'))}</button><p class="note" data-in-target>${esc(T('цель: ', 'Ziel: ', 'target: ', 'мақсат: '))}${esc(navLabel(ROUTE_OF(k)))}</p></div>` };
  };
  document.addEventListener('input', e => { const t = e.target; if (t.dataset && t.dataset.inf && S.inF && t.dataset.inf !== 'kind') { S.inF[t.dataset.inf] = t.dataset.inf === 'lvl' ? +t.value : t.value; S.inF.err = ''; } });
  document.addEventListener('change', e => { const t = e.target; if (!t.dataset || !t.dataset.inf || !S.inF) return; if (t.dataset.inf === 'kind') { S.inF = F0(t.value); render(); } else S.inF[t.dataset.inf] = t.dataset.inf === 'lvl' ? +t.value : t.value; });
  /* validation + structured message; the side effects run in inboxApply (also for the demo messages) */
  function inboxForm(F) {
    const k = F.kind, req = (v, l) => (!v ? l : '');
    const e = (!F.title || F.title.trim().length < 5 ? T('Заголовок (≥ 5 символов)', 'Titel (≥ 5 Zeichen)', 'Title (≥ 5 characters)', 'Тақырып (≥ 5 таңба)') : '')
      || ((k === 'road_closure' || k === 'weather_warning') ? req(F.city, T('Укажите город', 'Stadt angeben', 'Choose the city', 'Қаланы таңдаңыз')) : '')
      || (k === 'traffic_fine' ? req(F.veh, T('Укажите ТС', 'Fahrzeug angeben', 'Choose the vehicle', 'КҚ таңдаңыз')) || req(F.off, T('Укажите нарушение', 'Verstoß angeben', 'Choose the offence', 'Бұзушылықты таңдаңыз')) : '')
      || (k === 'workshop_status' ? req(F.ptn, T('Укажите сервис-партнёра', 'Servicepartner angeben', 'Choose the service partner', 'Сервис-серіктесті таңдаңыз')) : '')
      || (k === 'doc_status' ? req(F.trip, T('Укажите рейс', 'Fahrt angeben', 'Choose the trip', 'Рейсті таңдаңыз')) : '');
    if (e) return e;
    const m = { kind: k, via: 'manual', src: F.src, title: F.title.trim(), text: (F.text || '').trim() };
    if (F.lvl != null) m.lvl = +F.lvl;
    if (k === 'road_closure' || k === 'weather_warning') Object.assign(m, { cc: F.city, ccTo: F.cto || '', km: F.km || '', until: F.until ? F.until + ':00+05:00' : '' });
    if (k === 'traffic_fine') Object.assign(m, { veh: F.veh, fine: { off: F.off, date: F.date, time: F.time, amount: +F.amount || 0, place: F.place } });
    if (k === 'workshop_status') Object.assign(m, { veh: F.veh, ptn: F.ptn, wst: F.wst, wEta: F.eta });
    if (k === 'security_event' || k === 'telematics_alarm') Object.assign(m, { veh: F.veh, atype: F.atype, cc: F.city });
    if (k === 'doc_status') Object.assign(m, { link: F.trip, doc: F.doc, dst: F.dst });
    return m;
  }
  globalThis.inboxForm = inboxForm;
  let nFine = 30;
  /* I3 / I5 · side effects of a structured message; an unresolvable reference leaves the message in the inbox only, with an error line */
  function inboxApply(m) {
    const k = m.kind, t = m.veh ? S.trucks.find(x => x.id === m.veh || x.plate === m.veh) : null;
    if (m.veh && !t) { m.err = ERR.veh; return m; }
    if (k === 'traffic_fine' && m.fine && S.eco && S.eco.fines) {
      const l = S.loads.find(x => x.truck === t.id && isActive(x)), f = { id: 'FN-' + (1100 + nFine++), date: m.fine.date, t: m.fine.time, truck: t.id, type: m.fine.off, place: m.fine.place || '—', src: /sergek/i.test(m.src) ? 'sergek' : 'egov', amt: m.fine.amount || 0, st: 'unpaid', due: '—', seg: [], hist: [], drv: l && l.driver ? l.driver : null, note: m.id };
      S.eco.fines.unshift(f); m.fineId = f.id; audit('Fines', f.id, T('Штраф из входящих', 'Bußgeld aus dem Eingang', 'Fine from the inbox', 'Кірістен айыппұл'), t.plate + ' · ' + (f.drv ? drv(f.drv).name : '—'));
    }
    if (k === 'workshop_status') {
      if (globalThis.RES && RES.PARTNERS_SVC && !RES.PARTNERS_SVC.includes(m.ptn)) { m.err = ERR.ptn; return m; }
      if (t && globalThis.RES) { const s = RES.svcOpen(t); if (!s) { m.err = ERR.noreq; return m; } if (['done', 'cancelled'].includes(s.status)) { m.err = ERR.closed; return m; } RES.svcSet(s.id, WST2SVC[m.wst] || 'accepted'); if (m.wEta) s.eta = m.wEta + ':00+05:00'; m.svc = s.id; }
    }
    if (k === 'doc_status') { const l = load(m.link); if (!l) { m.err = ERR.trip; return m; } if (typeof ops === 'function') ops(l).inbox.push({ key: (DOCK[m.doc] || m.doc), lvl: m.dst === 'rejected' || m.dst === 'error' ? 2 : 0, text: (DOCK[m.doc] || m.doc) + ': ' + (DOCST[m.dst] || m.dst) + ' · ' + m.id }); }
    if ((k === 'security_event' || k === 'telematics_alarm') && S.inc) {
      /* Y2 · FR-136: the message also becomes a Security incident (level 3 for security events, 2 for telematics alarms) */
      if (!S.inc.some(i => i.id === 'INB-' + m.id)) S.inc.unshift({ id: 'INB-' + m.id, lvl: k === 'security_event' ? 3 : 2, time: fdt(m.at).slice(-5), type: INBOX_KIND[k], text: (t ? t.plate + ' · ' : '') + m.title, st: 'open', inbox: m.id });
    }
    return m;
  }
  globalThis.inboxApply = inboxApply;
  /* inboxAdd of 410 + the side effects (connector messages created by code go through the same path) */
  const add0 = inboxAdd;
  globalThis.inboxAdd = o => inboxApply(add0(o));
  ACT.inNew = () => { S.inF = null; openDrawer({ type: 'inboxNew' }); };
  ACT.inSave = () => { const m = inboxForm(S.inF || {}); if (typeof m === 'string') { S.inF.err = m; return render(); } const r = inboxAdd(m); S.inF = null; closeDrawer(); toast(r.err ? T('Сообщение зарегистрировано (только во входящих): ', 'Meldung erfasst (nur im Eingang): ', 'Message registered (inbox only): ', 'Хабар тіркелді (тек кірісте): ') + r.err : T('Сообщение зарегистрировано', 'Meldung erfasst', 'Message registered', 'Хабарлама тіркелді')); };

  /* ---------- I4 · "Demo: receive test messages" (admin / integrations:admin): a road closure on the Karaganda stretch, a fine, a telematics alarm ---------- */
  ACT.inDemo = () => {
    if (!canDo('integrations:admin')) return toast(T('Нужно право integrations:admin', 'Recht integrations:admin nötig', 'Needs integrations:admin', 'integrations:admin құқығы қажет'), 'err');
    const until = new Date(NOW.getTime() + 18 * 3600e3 + 5 * 3600e3).toISOString().slice(0, 16) + ':00+05:00';
    inboxAdd({ kind: 'road_closure', via: 'connector', src: 'KazAvtoZhol', lvl: 3, cc: 'KAR', ccTo: 'AST', road: 'M-36', km: T('км 74–118', 'km 74–118', 'km 74–118', '74–118 км'), until, title: T('М-36 Караганда – Астана: закрытие, гололёд', 'M-36 Karaganda – Astana: Sperrung, Glatteis', 'M-36 Karaganda – Astana: closed, black ice', 'М-36 Қарағанды – Астана: жабық, көктайғақ'), text: T('Демо-сообщение коннектора', 'Demo-Meldung des Konnektors', 'Demo connector message', 'Коннектордың демо хабары') });
    inboxAdd({ kind: 'traffic_fine', via: 'webhook', src: 'Sergek', veh: S.trucks[0].id, fine: { off: 'sp20', date: NOW.toISOString().slice(0, 10), time: '11:20', amount: 14750, place: T('Астана, пр. Республики', 'Astana, Respublika-Allee', 'Astana, Respublika Ave', 'Астана, Республика даңғ.') }, title: T('Штраф 5 МРП: превышение до 20 км/ч', 'Bußgeld 5 MRP: bis 20 km/h zu schnell', 'Fine 5 MCI: speeding up to 20 km/h', 'Айыппұл 5 АЕК: 20 км/сағ дейін асыру') });
    inboxAdd({ kind: 'telematics_alarm', via: 'connector', src: 'Wialon', veh: 'X-000', atype: 'door', title: T('Дверь открыта: неизвестный трекер', 'Tür offen: unbekannter Tracker', 'Door open: unknown tracker', 'Есік ашық: белгісіз трекер') });
    audit('Inbox', 'demo', T('Демо: тестовые сообщения', 'Demo: Testmeldungen', 'Demo: test messages', 'Демо: тест хабарлары'), '3');
    toast(T('Принято 3 тестовых сообщения', '3 Testmeldungen empfangen', '3 test messages received', '3 тест хабары қабылданды'));
  };
  /* I5 · meta line of a message: workshop status, alarm type, document · status, stretch and "until" */
  globalThis.inboxMeta = m => [m.cc ? ROAD_CITY[m.cc] + (m.ccTo ? ' — ' + ROAD_CITY[m.ccTo] : '') + (m.road ? ' · ' + m.road : '') + (m.km ? ' · ' + m.km : '') : '', m.wst ? WST[m.wst] + (m.svc ? ' · ' + m.svc : '') : '', m.atype ? ALARM_CAT[m.atype] : '', m.doc ? (DOCK[m.doc] || m.doc) + ' · ' + (DOCST[m.dst] || m.dst) : '', m.fineId ? m.fineId : '', m.until ? T('до ', 'bis ', 'until ', 'дейін ') + fdt(m.until) : ''].filter(Boolean).join(' · ');
})();
