/* Dashboard (spec 5.1): 6 KPI, schematic KZ map + dispatch list, alerts + quick actions. */
(function () {
  const kpi = (cls, ic_, label, val, sub, subCls) => `<div class="kpi-tile"><div><div class="label">${esc(label)}</div><div class="value">${val}</div><div class="delta ${subCls || ''}">${sub}</div></div><div class="icon" style="background:var(--tint-${cls}-100);color:var(--label-${cls})">${ic(ic_, 20)}</div></div>`;
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
  function dispatchList() {
    const rows = S.loads.filter(l => l.status !== 'delivered').slice(0, 7).map(l => `<div class="drow" data-act="open" data-id="${l.id}"><div><a class="lnk">${l.id}</a><div class="sub">${esc(HUBS[l.from].city)} → ${esc(HUBS[l.to].city)} · ${zoneChip(l.zone)}</div></div><div class="r">${stChip(l.status)}<div class="sub">${l.driver ? esc(drv(l.driver).name) : '—'}</div></div></div>`).join('');
    return `<div class="card"><div class="card-head">${esc(T('Рейсы сегодня', 'Fahrten heute', "Today's Dispatch", 'Бүгінгі рейстер'))}</div><div class="dlist">${rows}</div></div>`;
  }
  function alerts() {
    const a = [];
    S.loads.filter(l => isActive(l) && tempState(l) === 'breach').forEach(l => a.push(['red', T('Температурная тревога', 'Temperatur-Alarm', 'Temperature alert', 'Температуралық дабыл'), `${l.id}: ${l.temp > 0 ? '+' : ''}${String(l.temp).replace('.', ',')} °C (${ZONES[l.zone].label})`, l.id]));
    S.drivers.filter(d => d.status === 'available' && d.rto < 4).forEach(d => a.push(['orange', T('Предупреждение РТО', 'RTO-Warnung', 'Driving-time warning', 'РТО ескертуі'), `${d.name}: ${T('осталось', 'noch', 'left', 'қалды')} ${String(d.rto).replace('.', ',')} ${T('ч', 'h', 'h', 'сағ')}`]));
    S.loads.filter(l => l.status === 'delivered' && l.esf === 'none' && l.pod === 'approved').forEach(l => a.push(['yellow', T('ЭСФ не выписана', 'ESF nicht ausgestellt', 'ESF not issued', 'ЭШФ жазылмаған'), `${l.id} · ${kzt(revenue(l))}`, l.id]));
    S.loads.filter(l => l.status === 'delivered' && l.pod === 'pending').forEach(l => a.push(['blue', T('Ожидает POD', 'POD ausstehend', 'POD pending', 'POD күтілуде'), l.id, l.id]));
    return `<div class="card"><div class="card-head">${esc(T('Оповещения', 'Meldungen', 'Alerts', 'Дабылдар'))}</div><div class="card-body">${a.length ? a.slice(0, 5).map(x => `<div class="alert-card al-${x[0]}"${x[3] ? ` data-act="open" data-id="${x[3]}"` : ''}><b>${esc(x[1])}</b><div>${esc(x[2])}</div></div>`).join('') : `<p class="note">${esc(T('Нет активных оповещений', 'Keine aktiven Meldungen', 'No active alerts', 'Белсенді дабыл жоқ'))}</p>`}</div></div>`;
  }
  function quick() {
    const b = (cls, i, t, act) => `<button class="btn block ${cls}" data-act="${act}">${ic(i)} ${esc(t)}</button>`;
    return `<div class="card"><div class="card-head">${esc(T('Быстрые действия', 'Schnellaktionen', 'Quick Actions', 'Жылдам әрекеттер'))}</div><div class="card-body qa">${b('primary', 'plus', T('Создать рейс', 'Fahrt anlegen', 'Create Load', 'Рейс құру'), 'create')}${b('green', 'user', T('Назначить водителя', 'Fahrer zuweisen', 'Assign Driver', 'Жүргізуші тағайындау'), 'toDispatch')}${b('purple', 'receipt', T('Сформировать ЭСФ', 'ESF erstellen', 'Generate ESF', 'ЭШФ қалыптастыру'), 'esfAll')}${b('orange', 'route', T('План маршрута', 'Route planen', 'Plan Route', 'Маршрут жоспары'), 'planRoute')}</div></div>`;
  }
  Object.assign(ACT, {
    toDispatch: () => go('dispatch'),
    esfAll: () => { const t = S.loads.filter(l => l.status === 'delivered' && l.pod === 'approved' && l.esf === 'none'); t.forEach(l => l.esf = 'issued'); toast(t.length ? T('Выписано ЭСФ: ', 'ESF ausgestellt: ', 'ESF issued: ', 'ЭШФ жазылды: ') + t.length : T('Нет рейсов для ЭСФ', 'Keine Fahrten für ESF', 'No loads need an ESF', 'ЭШФ үшін рейс жоқ')); },
    planRoute: () => { S.tab.dispatch = 'planning'; go('dispatch'); },
  });
  SCREENS.dashboard = {
    title: () => navLabel('dashboard'),
    sub: () => T('Холодовая цепь: Астана · Алматы · Караганда · Шымкент · Атырау (Запад)', 'Kühlkette: Astana · Almaty · Karaganda · Schymkent · Atyrau (West)', 'Cold chain: Astana · Almaty · Karaganda · Shymkent · Atyrau (West)', 'Суық тізбек: Астана · Алматы · Қарағанды · Шымкент'),
    actions: () => `<button class="btn primary" data-act="create">${ic('plus')} ${esc(T('Создать рейс', 'Fahrt anlegen', 'Create Load', 'Рейс құру'))}</button>`,
    body: () => {
      const act = S.loads.filter(isActive), breach = act.filter(l => tempState(l) === 'breach').length;
      const done = S.loads.filter(l => l.status === 'delivered').length;
      const comp = act.length ? Math.round((act.length - breach) / act.length * 100) : 100;
      const rev = S.loads.reduce((s, l) => s + revenue(l), 0) / 1e6;
      const free = S.trucks.filter(t => t.status === 'available' && t.zones.some(z => z !== 'ambient')).length;
      return `<div class="kpi-row k6">
${kpi('blue', 'package', T('Активные рейсы', 'Aktive Fahrten', 'Active loads', 'Белсенді рейстер'), act.length, '↑ ' + done + ' ' + T('доставлено', 'geliefert', 'delivered', 'жеткізілді'))}
${kpi('green', 'check', T('Соблюдение температуры', 'Temperatur-Compliance', 'Temp. compliance', 'Температура сақталуы'), comp + ' %', breach ? '↓ ' + breach + ' ' + T('откл.', 'Abw.', 'excursion', 'ауытқу') : '✓', breach ? 'neg' : 'pos')}
${kpi('purple', 'truck', T('Свободные рефрижераторы', 'Freie Kühlfahrzeuge', 'Free reefers', 'Бос рефрижераторлар'), free, T('из ', 'von ', 'of ', '/ ') + S.trucks.length)}
${kpi('red', 'alert', T('Отклонения температуры', 'Temperaturabweichungen', 'Temp. excursions', 'Температура ауытқулары'), breach, breach ? T('требует реакции', 'Handlungsbedarf', 'needs action', 'әрекет қажет') : 'OK', breach ? 'neg' : 'pos')}
${kpi('orange', 'therm', T('Топливо MTD', 'Kraftstoff MTD', 'Fuel MTD', 'Отын MTD'), '18,4 млн ₸', '↑ 3 %')}
${kpi('green', 'chart', T('Выручка', 'Umsatz', 'Revenue', 'Түсім'), String(rev.toFixed(1)).replace('.', ',') + ' млн ₸', '↑ 12 %', 'pos')}</div>
<div class="grid2">${map()}${dispatchList()}</div><div class="grid2 eq">${alerts()}${quick()}</div>`;
    },
  };
  IC.check = '<path d="M5 13l4 4L19 7"/>';
})();
