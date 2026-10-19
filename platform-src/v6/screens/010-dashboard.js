/* Dashboard · Overview (source screen 01 "Live monitoring", spec 5.1): alarm playbook cards of active simulations, 0.3.10 KPI set
   (trips today with breakdown, in transit, OTIF 7 d, temperature compliance, volume / weight utilisation, alarms), live map,
   live trips with progress, "Alarms and events" (9) + "Risks · weather, roads, load" (6) with level tags and "source →" links,
   compact inbox (5 newest, "All messages (N) →"), hub weather 3-day tiles, quick actions. P2 port; helpers wxFor / lvChip live in 250. */
(function () {
  const css = document.createElement('style');
  css.textContent = `.ov-list{display:grid;gap:4px;padding:8px 12px 12px}.ov-row{display:grid;grid-template-columns:76px minmax(0,1fr);gap:10px;align-items:start;padding:7px 6px;border-radius:var(--r-btn);cursor:pointer;font-size:13px}.ov-row:hover{background:var(--bg-hover)}.ov-src{display:block;color:var(--primary);font-size:12px}.ov-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);padding:10px 6px 2px}
.ov-trip{display:grid;grid-template-columns:118px minmax(0,1fr) 150px;gap:10px;align-items:center;padding:9px 8px;border-bottom:1px solid var(--border);cursor:pointer;font-size:13px}.ov-trip:hover{background:var(--bg-hover)}.ov-trip .progress{margin-top:4px}.ov-trip .r{text-align:right}
.ov-pb{border-left:4px solid var(--label-red);background:var(--tint-red-50);border-radius:var(--r-btn);padding:12px 16px;margin-bottom:10px}.ov-pb ol{margin:6px 0 0;padding-left:20px;font-size:13px}.ov-pb .eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--label-red)}
.ov-inbox{display:grid;grid-template-columns:84px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 6px;border-bottom:1px solid var(--border);font-size:13px}`;
  document.head.appendChild(css);
  const kpi = (cls, ic_, label, val, sub, subCls) => `<div class="kpi-tile"><div><div class="label">${esc(label)}</div><div class="value">${val}</div><div class="delta ${subCls || ''}">${sub}</div></div><div class="icon" style="background:var(--tint-${cls}-100);color:var(--label-${cls})">${ic(ic_, 20)}</div></div>`;
  const dec = s => String(s).replace('.', ',');
  function map() {
    const pathD = l => KZMAP.hubPath(l.from, l.to).pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
    const lines = S.loads.filter(l => isActive(l) && l.status !== 'assigned').map(l => `<path d="${pathD(l)}" fill="none" stroke="#173a5e" stroke-opacity=".55" stroke-width="2.5" stroke-dasharray="2 7" stroke-linecap="round"/>`).join('');
    const mk = S.loads.filter(l => l.status === 'in_transit' || l.status === 'problem').map(l => {
      const [x, y] = KZMAP.along(KZMAP.hubPath(l.from, l.to), l.progress), ts = tempState(l);
      const col = ts === 'breach' ? 'var(--mk-red)' : ts === 'warn' ? 'var(--mk-status-yellow)' : 'var(--mk-green)', t = trk(l.truck);
      return `<g class="mk" data-act="open" data-id="${l.id}" transform="translate(${x},${y}) scale(1.5)"><circle r="14" fill="${col}"/><path d="M-7 -3h9v6h-9zM2 -1h4l3 3v2h-7z" fill="#fff"/><circle cx="10" cy="-10" r="4.5" fill="${ts === 'ok' ? 'var(--mk-status-green)' : ts === 'warn' ? 'var(--mk-status-yellow)' : 'var(--red)'}" stroke="#fff" stroke-width="1.5"/><rect x="-44" y="18" width="88" height="17" rx="6" fill="#fff" stroke="var(--border-input)"/><text x="0" y="30" text-anchor="middle" class="maplbl sm">${esc(t ? t.plate.slice(0, 10) : '')} · ${l.temp > 0 ? '+' : ''}${String(l.temp).replace('.', ',')}°</text></g>`;
    }).join('');
    const free = S.trucks.filter(t => t.status === 'available').length, act = S.loads.filter(isActive).length;
    return `<div class="card mapcard"><div class="card-head">${esc(T('Живые операции', 'Live-Betrieb', 'Live Operations', 'Тікелей операциялар'))}</div><div class="mapwrap">
<svg viewBox="0 0 ${KZMAP.W} ${KZMAP.H}" class="kzmap">${KZMAP.base()}${lines}${mk}</svg>${KZMAP.legend()}
<div class="legend card"><b>${esc(T('Состояние ТС', 'Fahrzeugstatus', 'Vehicle status', 'КҚ күйі'))}</b><div><i style="background:var(--mk-status-green)"></i>${esc(T('В норме', 'In Ordnung', 'On time', 'Қалыпты'))}</div><div><i style="background:var(--mk-status-yellow)"></i>${esc(T('Близко к границе', 'Nahe Grenzwert', 'Near limit', 'Шекке жақын'))}</div><div><i style="background:var(--red)"></i>${esc(T('Темп. тревога', 'Temp.-Alarm', 'Temp. alarm', 'Темп. дабыл'))}</div></div>
<div class="statstrip card"><span><b>${S.trucks.length}</b> ${esc(T('ТС всего', 'Fahrzeuge', 'Total vehicles', 'КҚ барлығы'))}</span><span><b class="g">${free}</b> ${esc(T('свободно', 'frei', 'available', 'бос'))}</span><span><b class="b">${act}</b> ${esc(T('активных рейсов', 'aktive Fahrten', 'active loads', 'белсенді рейс'))}</span></div></div></div>`;
  }
  /* live trips: id, route, progress bar, status, ETA; a click opens the trip card */
  function liveTrips() {
    const rows = (globalThis.hubFilter ? hubFilter(S.loads, hubOfLoad) : S.loads).filter(l => l.status !== 'delivered' && l.status !== 'aborted').slice(0, 8).map(l => { const pct = Math.round((l.status === 'in_transit' || l.status === 'problem' ? l.progress : l.status === 'loading' ? 0.03 : 0) * 100); return `<div class="ov-trip" data-act="open" data-id="${l.id}" data-live-trip="${l.id}"><span><a class="lnk">${l.id}</a><div class="sub">${l.driver ? esc(drv(l.driver).name.split(' ')[0]) : '—'}</div></span><span>${esc(HUBS[l.from].city)} → ${esc(HUBS[l.to].city)} ${zoneChip(l.zone)}<div class="progress${l.status === 'problem' ? ' crit' : ''}" aria-label="${pct} %"><i style="width:${pct}%"></i></div></span><span class="r">${stChip(l.status)}<div class="sub">ETA ${fdt(l.eta)}</div></span></div>`; }).join('');
    return `<div class="card"><div class="card-head">${esc(T('Рейсы в реальном времени', 'Touren in Echtzeit', 'Live trips', 'Нақты уақыттағы рейстер'))}</div><div style="padding:0 12px 8px">${rows}</div></div>`;
  }
  /* FR-101: alarms (alarm store, telemetry, coverage, documents) and risks (weather, roads, load) in separate lists, each with the screen where it is handled */
  function alarmItems() {
    const a = [], CAT = globalThis.ALARM_CAT || {};
    (S.alarms || []).filter(x => x.status !== 'closed').forEach(x => a.push({ lvl: x.lvl, text: (CAT[x.cat] || x.cat) + ' · ' + (x.load || (x.truck && trk(x.truck).id ? trk(x.truck).plate : HUBS[x.hub].city)) + (x.status === 'acked' ? ' · ' + T('принята', 'bestätigt', 'acknowledged', 'қабылданды') : ''), src: T('Тревоги', 'Alarme', 'Alarms', 'Дабылдар'), s: 'dashboard', t: 'alarms', id: x.load }));
    S.loads.filter(l => isActive(l) && tempState(l) === 'breach').forEach(l => a.push({ lvl: 3, text: T('Температура вне диапазона ', 'Temperatur außerhalb ', 'Temperature out of range ', 'Температура диапазоннан тыс ') + l.id + ' · ' + dec(l.temp) + ' °C (' + ZONES[l.zone].label + ')', src: T('Температура', 'Temperatur', 'Temperature', 'Температура'), s: 'routes', t: 'temp', id: l.id }));
    if (globalThis.RES && RES.covLevel) S.loads.filter(l => l.status === 'in_transit' || l.status === 'problem').forEach(l => { const lv = RES.covLevel(l); if (lv.lvl >= 2) a.push({ lvl: lv.lvl, text: T('Потеря связи ', 'Verbindungsverlust ', 'Contact lost ', 'Байланыс жоғалды ') + l.id + ' · ' + lv.why, src: T('Покрытие связи', 'Netzabdeckung', 'Network coverage', 'Байланыс қамтуы'), s: 'routes', t: 'coverage', id: l.id }); });
    S.drivers.filter(d => d.status === 'available' && d.rto < 4).forEach(d => a.push({ lvl: 2, text: T('РТО: у ', 'RTO: ', 'RTO: ', 'РТО: ') + d.name + T(' осталось ', ' hat noch ', ' has ', ' ') + dec(d.rto) + ' ' + T('ч вождения', 'h Lenkzeit', 'h of driving time', 'сағ жүргізу'), src: T('Водители', 'Fahrer', 'Drivers', 'Жүргізушілер'), s: 'drivers', t: '' }));
    (S.inc || []).filter(i => i.st === 'open').forEach(i => a.push({ lvl: i.lvl, text: i.type + ' · ' + i.text, src: T('Безопасность', 'Sicherheit', 'Security', 'Қауіпсіздік'), s: 'routes', t: 'sec' }));
    S.loads.filter(l => l.status === 'delivered' && l.pod === 'pending').forEach(l => a.push({ lvl: 1, text: T('Ожидает POD ', 'POD ausstehend ', 'POD pending ', 'POD күтілуде ') + l.id, src: T('Подтверждение доставки', 'Lieferbestätigung', 'Proof of delivery', 'Жеткізуді растау'), s: 'pod', t: '', id: l.id }));
    S.loads.filter(l => l.status === 'delivered' && l.esf === 'none' && l.pod === 'approved').forEach(l => a.push({ lvl: 1, text: T('ЭСФ не выписана ', 'ESF nicht ausgestellt ', 'ESF not issued ', 'ЭШФ жазылмаған ') + l.id + ' · ' + kzt(revenue(l)), src: T('Документы РК', 'Dokumente KZ', 'Documents KZ', 'ҚР құжаттары'), s: 'orders', t: 'docs', id: l.id }));
    return a.sort((x, y) => y.lvl - x.lvl).slice(0, 9);
  }
  function riskItems() {
    const r = [], KIND = globalThis.INBOX_KIND || {};
    S.loads.filter(l => isActive(l)).forEach(l => { const w = routeRisk(l, 3); if (w >= 1) r.push({ lvl: w, text: T('Погода на маршруте ', 'Wetter auf der Route ', 'Weather on route ', 'Маршруттағы ауа райы ') + l.id + ' · ' + HUBS[l.from].city + ' → ' + HUBS[l.to].city + (w >= 2 ? T(' · буран / сильный ветер, 3 дня', ' · Buran / starker Wind, 3 Tage', ' · blizzard / strong wind, 3 days', ' · боран, 3 күн') : T(' · снег, усилить контроль', ' · Schnee, Kontrolle verstärken', ' · snow, monitor closely', ' · қар')), src: T('Погода и риски', 'Wetter & Risiken', 'Weather & risks', 'Ауа райы'), s: 'routes', t: 'wx', id: l.id }); });
    (S.closures || []).filter(c => !c.lifted).forEach(c => r.push({ lvl: 2, text: T('Закрытие: ', 'Sperre: ', 'Closure: ', 'Жабылу: ') + c.route + ' · ' + c.note, src: T('КазАвтоЖол', 'KazAvtoZhol', 'KazAvtoZhol', 'ҚазАвтоЖол'), s: 'routes', t: 'wx' }));
    (S.inbox || []).filter(m => (m.kind === 'road_closure' || m.kind === 'weather_warning') && m.st === 'new').forEach(m => r.push({ lvl: m.lvl, text: (KIND[m.kind] || m.kind) + ' · ' + xt(m.title), src: T('Входящие', 'Eingang', 'Inbox', 'Кіріс'), s: 'dashboard', t: 'inbox' }));
    S.loads.filter(l => ['assigned', 'loading'].includes(l.status) && l.truck).forEach(l => { const t = trk(l.truck); if (!t.id) return; const c = loadCalc(ops(l).orders, typeOfTruck(t), t.zones); if (!c.fits) r.push({ lvl: 2, text: T('Загрузка не помещается ', 'Beladung passt nicht ', 'Load does not fit ', 'Тиеу сыймайды ') + l.id + ' · ' + c.issues[0].text, src: T('Загрузка и вес', 'Beladung', 'Load & weight', 'Тиеу'), s: 'orders', t: 'loadw', id: l.id }); const f = fefo(l); if (f.length) r.push({ lvl: 1, text: T('FEFO: короткий срок ', 'FEFO: kurze Restlaufzeit ', 'FEFO: short shelf life ', 'FEFO: қысқа мерзім ') + l.id + ' · ' + f[0].art + ' · ' + f[0].days + ' ' + T('дн.', 'Tg.', 'd', 'күн'), src: T('Загрузка и вес', 'Beladung', 'Load & weight', 'Тиеу'), s: 'orders', t: 'loadw', id: l.id }); });
    S.loads.filter(l => l.status === 'in_transit').forEach(l => { const z = deadZones(l)[0]; if (z && !z.now) r.push({ lvl: 1, text: T('Зона без связи через ', 'Funkloch in ', 'Dead zone in ', 'Байланыссыз аймақ ') + z.inMin + ' ' + T('мин', 'Min.', 'min', 'мин') + ' · ' + l.id + ' · ' + z.name, src: T('Покрытие связи', 'Netzabdeckung', 'Network coverage', 'Байланыс қамтуы'), s: 'routes', t: 'coverage', id: l.id }); });
    return r.sort((x, y) => y.lvl - x.lvl).slice(0, 6);
  }
  const row = (x, i, k) => `<div class="ov-row" data-act="ovGo" data-s="${x.s}" data-t="${x.t || ''}" data-id="${x.id || ''}" data-ov-${k}="${i}">${lvChip(x.lvl)}<span>${esc(x.text)}<span class="ov-src">${esc(x.src)} →</span></span></div>`;
  function alarmsCard() {
    const a = alarmItems(), r = riskItems();
    return `<div class="card"><div class="card-head">${esc(T('Тревоги и события', 'Alarme und Ereignisse', 'Alarms and events', 'Дабылдар мен оқиғалар'))} · ${a.length}</div><div class="ov-list" data-alert-list="alarms">${a.map((x, i) => row(x, i, 'alarm')).join('') || `<p class="note">${esc(T('Нет активных тревог', 'Keine aktiven Alarme', 'No active alarms', 'Белсенді дабыл жоқ'))}</p>`}</div>
<div class="ov-list" data-alert-list="risks"><span class="ov-kicker">${esc(T('Риски · погода, дороги, загрузка', 'Risiken · Wetter, Straßen, Beladung', 'Risks · weather, roads, load', 'Тәуекелдер · ауа райы, жолдар, тиеу'))} · ${r.length}</span>${r.map((x, i) => row(x, i, 'risk')).join('') || `<p class="note">${esc(T('Рисков нет', 'Keine Risiken', 'No risks', 'Тәуекел жоқ'))}</p>`}</div></div>`;
  }
  const IROUTE = { road_closure: 'routes', weather_warning: 'routes', traffic_fine: 'reports', workshop_status: 'dispatch', security_event: 'routes', telematics_alarm: 'dashboard', lead: 'orders', tender: 'orders', doc_status: 'orders', sms_ack_timeout: 'dispatch' };
  function inboxCard() {
    const KIND = globalThis.INBOX_KIND || {}, all = (S.inbox || []).filter(m => m.st !== 'done'), list = all.slice().sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 5), LV = { 3: 'red', 2: 'yellow', 1: 'blue', 0: 'gray' };
    return `<div class="card" data-inbox-compact="${list.length}"><div class="card-head" style="display:flex;justify-content:space-between;align-items:center">${esc(T('Входящие · внешние сообщения', 'Eingang · externe Meldungen', 'Inbox · external messages', 'Кіріс · сыртқы хабарламалар'))}<button class="btn sm grey" data-act="ovTab" data-v="inbox">${esc(T('Все сообщения', 'Alle Meldungen', 'All messages', 'Барлық хабарламалар'))} (${(S.inbox || []).length}) →</button></div><div style="padding:0 12px 8px">${list.map(m => `<div class="ov-inbox"><span>${chip(LV[m.lvl], 'L' + m.lvl)} <span class="sub">${fdtKZ(m.at).slice(11)}</span></span><span><b>${esc(KIND[m.kind] || m.kind)}</b> · ${ext(m.title)}<div class="sub">${ext(m.src)}</div></span><button class="btn sm grey" data-act="inGo" data-id="${m.id}">→ ${esc(navLabel(IROUTE[m.kind] || 'dashboard'))}</button></div>`).join('') || `<p class="note">${esc(T('Новых сообщений нет', 'Keine neuen Meldungen', 'No new messages', 'Жаңа хабарлама жоқ'))}</p>`}</div></div>`;
  }
  function hubWx() {
    const RC = ['var(--tint-green-50)', 'var(--tint-yellow-50)', 'var(--tint-red-50)', '#fca5a5'];
    const tiles = Object.keys(HUBS).flatMap(h => wxFor(h).slice(0, 3).map((c, d) => `<div class="wx-tile" data-wx="${h}-${d}" data-wx-lvl="${c.risk}" style="background:${RC[c.risk]}"><span class="wd">${esc(HUBS[h].city)} · ${esc(wxDayLbl(d))}</span><b>${c.max}° / ${c.min}°</b><span>${esc(wxCond(c))} · ${c.wind} m/s${(S.ops.wxStale || []).includes(h) ? ' · ' + esc(T('прогноз устарел', 'Prognose veraltet', 'forecast stale', 'болжам ескірген')) : ''}</span></div>`));
    return `<div class="card"><div class="card-head">${esc(T('Погода на хабах · 3 дня', 'Wetter an den Hubs · 3 Tage', 'Hub weather · 3 days', 'Хабтардағы ауа райы · 3 күн'))} <span class="note">${esc(T('цвет = риск для рейса; подробности и 7 дней в «Маршруты → Погода»', 'Farbe = Risiko für die Fahrt; Details und 7 Tage unter „Routen → Wetter“', 'colour = trip risk; details and 7 days under Routes → Weather', 'түс = рейс тәуекелі'))}</span></div><div class="card-body wx-tiles">${tiles.join('')}</div></div>`;
  }
  /* alarm playbook cards: one per active incident simulation (Fire / Breakdown / Theft from Routes → Security) with its response steps */
  function playbooks() {
    const pbs = (S.inc || []).filter(i => i.sim && i.pb && i.st !== 'closed');
    if (!pbs.length) return '';
    return `<div data-playbooks="${pbs.length}">${pbs.map(i => { const l = load(i.sim), ws = l ? serviceOnRoute(l) : null; return `<div class="ov-pb" role="alert" data-playbook="${i.id}"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><div class="eyebrow">${esc(T('Тревога · порядок действий', 'Alarm · Vorgehen', 'Alarm · response steps', 'Дабыл · әрекет тәртібі'))}</div><b>${esc(i.type)}</b><div class="sub">${esc(i.text)}</div></div><button class="btn sm grey" data-act="ovPbReset" data-id="${i.sim}">${esc(T('Сбросить', 'Zurücksetzen', 'Reset', 'Қалпына келтіру'))}</button></div>${ws ? `<button class="btn sm grey" style="margin-top:6px" data-act="trPartner" data-id="${ws.id}">${esc(T('Контакты сервиса · ', 'Servicekontakte · ', 'Service contacts · ', 'Сервис байланысы · '))}${esc(ws.name)}</button>` : ''}<ol>${i.pb.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>`; }).join('')}</div>`;
  }
  function quick() {
    const b = (cls, i, t, act) => `<button class="btn block ${cls}" data-act="${act}">${ic(i)} ${esc(t)}</button>`;
    return `<div class="card"><div class="card-head">${esc(T('Быстрые действия', 'Schnellaktionen', 'Quick Actions', 'Жылдам әрекеттер'))}</div><div class="card-body qa">${b('primary', 'plus', T('Создать рейс', 'Fahrt anlegen', 'Create Load', 'Рейс құру'), 'create')}${b('green', 'user', T('Назначить водителя', 'Fahrer zuweisen', 'Assign Driver', 'Жүргізуші тағайындау'), 'toDispatch')}${b('purple', 'receipt', T('Сформировать ЭСФ', 'ESF erstellen', 'Generate ESF', 'ЭШФ қалыптастыру'), 'esfAll')}${b('orange', 'route', T('План маршрута', 'Route planen', 'Plan Route', 'Маршрут жоспары'), 'planRoute')}</div></div>`;
  }
  /* KPI set of 0.3.10: trips today (status breakdown), in transit, OTIF 7 days, temperature compliance, volume / weight utilisation, alarms */
  function kpis() {
    const HL = globalThis.hubFilter ? hubFilter(S.loads, hubOfLoad) : S.loads;
    const today = HL.filter(l => l.status !== 'aborted' && (isActive(l) || l.eta.slice(0, 10) === opsToday || l.status === 'unassigned'));
    const cnt = s => today.filter(l => l.status === s).length, brk = ['unassigned', 'assigned', 'loading', 'in_transit', 'delivered'].map(s => ST[s].l.toLowerCase() + ' ' + cnt(s)).join(' · ');
    const transit = HL.filter(l => l.status === 'in_transit' || l.status === 'problem').length;
    const delivered = S.loads.filter(l => l.status === 'delivered'), base = 56, late = delivered.filter(l => l.exc || l.pod === 'rejected').length, otif = Math.round((base - late) / base * 1000) / 10;
    const monitored = S.loads.filter(l => isActive(l) || l.status === 'delivered'), exc = monitored.filter(l => tempState(l) === 'breach' || l.exc).length, tcomp = monitored.length ? Math.round((monitored.length - exc) / monitored.length * 1000) / 10 : 100;
    const util = S.loads.filter(l => isActive(l) && l.truck && trk(l.truck).id).map(l => { const ty = typeOfTruck(trk(l.truck)), c = loadCalc(ops(l).orders, ty); return { m3: Math.min(1, c.m3 / ty.m3), kg: Math.min(1, c.kg / ty.kg) }; }), avg = k => util.length ? Math.round(util.reduce((s, u) => s + u[k], 0) / util.length * 100) : 0;
    const crit = (S.alarms || []).filter(a => a.status !== 'closed' && a.lvl >= 2).length + S.loads.filter(l => isActive(l) && tempState(l) === 'breach' && !(S.alarms || []).some(a => a.load === l.id && a.status !== 'closed')).length;
    return `<div class="kpi-row k6" data-ov-kpis>
${kpi('blue', 'package', T('Рейсы сегодня', 'Touren heute', 'Trips today', 'Бүгінгі рейстер'), today.length, esc(brk))}
${kpi('green', 'truck', T('В пути', 'Unterwegs', 'In transit', 'Жолда'), transit, esc(T('онлайн-трекинг и ETA', 'Online-Tracking und ETA', 'live tracking and ETA', 'онлайн трекинг және ETA')))}
${kpi('purple', 'check', T('OTIF · 7 дней', 'OTIF · 7 Tage', 'OTIF · 7 days', 'OTIF · 7 күн'), dec(otif) + ' %', esc(T('цель SLA ≥ 95 %', 'Ziel SLA ≥ 95 %', 'SLA target ≥ 95 %', 'SLA мақсаты ≥ 95 %')), otif >= 95 ? 'pos' : 'neg')}
${kpi('green', 'therm', T('Темп. соответствие', 'Temp.-Compliance', 'Temp. compliance', 'Темп. сәйкестік'), dec(tcomp) + ' %', esc(T('отправок без отклонений', 'Sendungen ohne Abweichung', 'shipments without excursion', 'ауытқусыз жөнелтулер')), exc ? 'neg' : 'pos')}
${kpi('orange', 'chart', T('Загрузка по объёму', 'Auslastung nach Volumen', 'Volume utilisation', 'Көлем бойынша жүктеме'), avg('m3') + ' %', esc(T('по весу ', 'nach Gewicht ', 'by weight ', 'салмақ бойынша ')) + avg('kg') + ' %')}
${kpi('red', 'alert', T('Тревоги', 'Alarme', 'Alarms', 'Дабылдар'), crit, esc(T('риск и критично', 'Risiko und kritisch', 'risk and critical', 'қауіп және сыни')), crit ? 'neg' : 'pos')}</div>`;
  }
  Object.assign(ACT, {
    toDispatch: () => go('dispatch'),
    esfAll: () => { const t = S.loads.filter(l => l.status === 'delivered' && l.pod === 'approved' && l.esf === 'none'); t.forEach(l => l.esf = 'issued'); toast(t.length ? T('Выписано ЭСФ: ', 'ESF ausgestellt: ', 'ESF issued: ', 'ЭШФ жазылды: ') + t.length : T('Нет рейсов для ЭСФ', 'Keine Fahrten für ESF', 'No loads need an ESF', 'ЭШФ үшін рейс жоқ')); },
    planRoute: () => { S.tab.dispatch = 'planning'; go('dispatch'); },
    ovGo: d => { if (!canSee(d.s)) return toast(T('Нет доступа к экрану', 'Kein Zugriff auf den Bildschirm', 'No access to the screen', 'Экранға рұқсат жоқ'), 'err'); if (d.t && tabsOf(d.s).some(t => t.key === d.t)) S.tab[d.s] = d.t; go(d.s); if (d.id && load(d.id) && ['orders', 'dispatch', 'pod'].includes(d.s)) openDrawer({ type: 'load', id: d.id, tab: 'overview' }); },
    ovTab: d => setTab('dashboard', d.v),
    ovPbReset: d => { const l = load(d.id), t = l && trk(l.truck); S.inc = (S.inc || []).filter(i => i.sim !== d.id); if (S.secSim) delete S.secSim[d.id]; if (t && t.id) t.health = 'green'; if (l && l.status === 'problem') setStatus(l.id, 'in_transit'); audit('Security', d.id, 'Simulation reset', 'dashboard'); render(); },
  });
  SCREENS.dashboard = {
    title: () => navLabel('dashboard'),
    sub: () => T('Холодовая цепь: Астана · Алматы · Караганда · Шымкент · Атырау (Запад)', 'Kühlkette: Astana · Almaty · Karaganda · Schymkent · Atyrau (West)', 'Cold chain: Astana · Almaty · Karaganda · Shymkent · Atyrau (West)', 'Суық тізбек: Астана · Алматы · Қарағанды · Шымкент'),
    actions: () => `<button class="btn primary" data-act="create">${ic('plus')} ${esc(T('Создать рейс', 'Fahrt anlegen', 'Create Load', 'Рейс құру'))}</button>`,
    body: () => `${playbooks()}${kpis()}<div class="grid2">${map()}${liveTrips()}</div><div class="grid2 eq">${alarmsCard()}${inboxCard()}</div><div class="grid2 eq">${hubWx()}${quick()}</div>`,
  };
  IC.check = '<path d="M5 13l4 4L19 7"/>';
})();
