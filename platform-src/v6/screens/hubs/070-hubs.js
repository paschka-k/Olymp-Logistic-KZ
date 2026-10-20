/* Warehouses & Hubs (spec 5.7): hub cards by temperature zone, hub drawer (zones, ramps, reefer queue), receiving tab (receiving.js). */
(function () {
  const ALL = T('Все', 'Alle', 'All', 'Барлығы');
  const F = { hub: '', st: '', cap: '' };
  const ZK = Object.keys(ZONES);
  const util = h => { const p = S.hubs[h].places; let u = 0, t = 0; ZK.forEach(z => { u += p[z][1]; t += p[z][0]; }); return { u, t, pct: t ? u / t * 100 : 0 }; };
  const zPct = (h, z) => S.hubs[h].places[z][1] / S.hubs[h].places[z][0] * 100;
  const barCls = p => p >= 90 ? 'crit' : p >= 80 ? 'warn' : p < 50 ? 'low' : '';
  const tempAlarm = h => S.loads.some(l => isActive(l) && tempState(l) === 'breach' && (l.from === h || l.to === h)) || S.jobs.some(j => j.hub === h && j.ev.en == null && j.chk.temp != null && (j.chk.temp < ZONES[j.zone].lo || j.chk.temp > ZONES[j.zone].hi));
  const hubState = h => { const H = S.hubs[h]; if (H.maint) return 'maintenance'; if (util(h).pct >= 90 || H.blocked.length >= 2 || tempAlarm(h)) return 'critical'; return 'active'; };
  const HS = { active: { c: 'green', l: T('Активен', 'Aktiv', 'Active', 'Белсенді') }, critical: { c: 'red', l: T('Критично', 'Kritisch', 'Critical', 'Сыни') }, maintenance: { c: 'yellow', l: T('Обслуживание', 'Wartung', 'Maintenance', 'Қызмет көрсету') } };
  const yard = h => S.jobs.filter(j => j.hub === h && j.ev.ci != null && j.ev.rp == null && j.ev.en == null);
  globalThis.HUBX = { util, zPct, barCls, hubState, HS, yard, tempAlarm, ZK };
  const tk = KIT.kpi;
  const sel = KIT.filterSelect('data-hf', () => F);
  const list = () => hubFilter(Object.keys(S.hubs), h => h).filter(h => (!F.hub || h === F.hub) && (!F.st || hubState(h) === F.st) && (!F.cap || (F.cap === 'hi' ? util(h).pct >= 80 : F.cap === 'mid' ? util(h).pct >= 50 && util(h).pct < 80 : util(h).pct < 50)));
  const pf = v => LF.dec(v, 1) + ' %';
  function card(h) {
    const H = S.hubs[h], u = util(h), st = hubState(h), free = H.ramps.length - H.blocked.length, q = yard(h).length, appt = S.jobs.filter(j => j.hub === h).length;
    const seg = ZK.map(z => `<i class="z-${z}" style="width:${H.places[z][1] / u.t * 100}%" title="${ZONES[z].label} ${Math.round(zPct(h, z))} %"></i>`).join('');
    return `<div class="hub-card${S.drawer && S.drawer.id === h ? ' is-selected' : ''}" data-act="openH" data-id="${h}"><div class="row"><h4>${esc(HUBS[h].name)}</h4>${chip(HS[st].c, HS[st].l)}</div><div class="addr">${esc(H.addr)}</div>
<div class="row" style="font-size:12px;margin-bottom:6px"><span>${esc(T('Загрузка по зонам', 'Auslastung nach Zonen', 'Zone utilization', 'Аймақтар бойынша жүктеме'))}</span><b>${pf(u.pct)}</b></div><div class="zonebar">${seg}</div><div class="progress ${barCls(u.pct)}" style="margin-top:6px"><i style="width:${u.pct}%"></i></div>
<div class="mini-tiles"><div class="mini-tile blue"><b>${H.io[0]}</b><small>${esc(T('Вход', 'Eingang', 'Inbound', 'Кіріс'))}</small></div><div class="mini-tile green"><b>${H.io[1]}</b><small>${esc(T('Выход', 'Ausgang', 'Outbound', 'Шығыс'))}</small></div><div class="mini-tile purple"><b>${LF.n(u.u)}</b><small>${esc(T('Мест занято', 'Plätze belegt', 'On-hand places', 'Орын бос емес'))}</small></div></div>
<div class="row" style="font-size:12px"><span><span class="dot ${H.blocked.length ? 'bad' : 'good'}" style="width:8px;height:8px"></span> ${esc(T('Рампы: ', 'Rampen: ', 'Docks: ', 'Рампалар: '))}${free} ${esc(T('свободно', 'frei', 'available', 'бос'))}${H.blocked.length ? ', ' + H.blocked.length + ' ' + esc(T('закрыто', 'gesperrt', 'blocked', 'жабық')) : ''}</span><span><span class="dot ${q > 1 ? 'warn' : 'good'}" style="width:8px;height:8px"></span> ${esc(T('Двор: ', 'Hof: ', 'Yard: ', 'Аула: '))}${q ? q + ' ' + esc(T('в очереди', 'wartend', 'queued', 'кезекте')) : esc(T('пусто', 'leer', 'empty', 'бос'))}</span></div>
<div class="foot">${esc(T('Приёмок сегодня: ', 'Wareneingänge heute: ', "Today's receiving: ", 'Бүгінгі қабылдау: '))}${appt}${tempAlarm(h) ? ' ' + chip('temp-breach', T('Темп. тревога', 'Temp.-Alarm', 'Temp. alarm', 'Темп. дабыл')) : ''}</div></div>`;
  }
  function mapView() {
    const hs = list().map(h => { const p = HUBS[h], u = util(h).pct, col = u >= 90 ? 'var(--bar-crit)' : u >= 80 ? 'var(--bar-warn)' : u < 50 ? 'var(--bar-low)' : 'var(--bar-ok)'; return `<g class="mk" data-act="openH" data-id="${h}"><circle cx="${p.x}" cy="${p.y}" r="${10 + u / 8}" fill="${col}" fill-opacity=".85" stroke="#fff" stroke-width="3"/><text x="${p.x}" y="${p.y + 4}" text-anchor="middle" class="maplbl sm" fill="#fff" style="fill:#fff">${Math.round(u)}%</text><text x="${p.x + 24}" y="${p.y - 10}" class="maplbl">${esc(p.city)}</text></g>`; }).join('');
    return `<div class="mapfull"><svg viewBox="0 0 600 340" class="kzmap"><path d="M40 120 L110 70 L230 60 L330 40 L450 60 L560 90 L580 160 L540 230 L560 290 L440 310 L330 318 L230 300 L140 250 L60 200 Z" fill="#eef2f6" stroke="#d7dee7" stroke-width="2"/>${hs}</svg></div>`;
  }
  function hubsBody() {
    const hs = Object.keys(S.hubs), act = hs.filter(h => hubState(h) !== 'maintenance'), avg = act.reduce((s, h) => s + util(h).pct, 0) / (act.length || 1);
    const crit = hs.filter(h => hubState(h) === 'critical').length, dn = hs.reduce((s, h) => s + S.hubs[h].done[0] + S.hubs[h].done[1], 0), pl = hs.reduce((s, h) => s + S.hubs[h].io[0] + S.hubs[h].io[1], 0) + 270;
    const ls = list();
    return `<div class="kpi-row k4">${tk('blue', 'warehouse', act.length, T('Активные хабы', 'Aktive Hubs', 'Active hubs', 'Белсенді хабтар'))}${tk('green', 'chart', pf(avg), T('Средняя загрузка', 'Ø Auslastung', 'Average utilization', 'Орташа жүктеме'))}${tk('red', 'alert', crit, T('Критические тревоги', 'Kritische Alarme', 'Critical alerts', 'Сыни дабылдар'))}${tk('purple', 'truck', dn + ' / ' + pl, T('Паллет сегодня (факт / план)', 'Paletten heute (Ist / Plan)', "Today's pallets (done / plan)", 'Бүгінгі паллет (факт / жоспар)'))}</div>
<div class="filters" data-test="filters">${sel('hub', T('Хаб', 'Hub', 'Hub', 'Хаб'), [['', ALL], ...hs.map(h => [h, HUBS[h].city])])}${sel('st', T('Статус', 'Status', 'Status', 'Күйі'), [['', ALL], ...Object.keys(HS).map(k => [k, HS[k].l])])}${sel('cap', T('Загрузка', 'Auslastung', 'Capacity', 'Жүктеме'), [['', ALL], ['hi', '≥ 80 %'], ['mid', '50–80 %'], ['lo', '< 50 %']])}<button class="clear-all" data-act="clrH">× ${esc(T('Сбросить', 'Zurücksetzen', 'Clear Filters', 'Тазалау'))}</button><span style="margin-left:auto" class="pill-tabs"><span class="pill-tab${S.hubView === 'cards' ? ' active' : ''}" data-act="hview" data-v="cards">${esc(T('Карточки', 'Karten', 'Cards', 'Карточкалар'))}</span><span class="pill-tab${S.hubView === 'map' ? ' active' : ''}" data-act="hview" data-v="map">${esc(T('Карта', 'Karte', 'Map', 'Карта'))}</span></span></div>
${S.hubView === 'map' ? mapView() : `<div class="hub-grid">${ls.map(card).join('') || `<div class="empty">${esc(T('Нет хабов по фильтрам', 'Keine Hubs', 'No hubs match', 'Хаб жоқ'))}</div>`}</div>`}`;
  }
  SCREENS.hubs = {
    title: () => navLabel('hubs'),
    sub: () => T('Загрузка по температурным зонам, рампы, очередь рефрижераторов и приёмка', 'Auslastung je Temperaturzone, Rampen, Kühl-Warteschlange und Wareneingang', 'Utilization by temperature zone, ramps, reefer queue and goods receipt', 'Температура аймақтары бойынша жүктеме, рампалар, рефрижератор кезегі және қабылдау'),
    actions: () => `<button class="btn grey" data-act="hset">${esc(T('Настройки', 'Einstellungen', 'Settings', 'Баптаулар'))}</button><button class="btn primary" data-act="hadd">${ic('plus')} ${esc(T('Добавить хаб', 'Hub hinzufügen', 'Add New Warehouse', 'Хаб қосу'))}</button>`,
    tabs: [{ key: 'hubs', label: T('Хабы', 'Hubs', 'Warehouses', 'Хабтар'), body: () => hubsBody() }, { key: 'recv', label: T('Приёмка', 'Wareneingang', 'Receiving', 'Қабылдау'), badge: () => S.jobs.filter(j => j.ev.ci != null && j.ev.en == null).length, body: () => recvBody() }],
  };
  const kv = KIT.kv;
  const ZN = { frozen: T('Заморозка', 'Tiefkühl', 'Frozen', 'Мұздатылған'), chilled: T('Охлаждённые', 'Gekühlt', 'Chilled', 'Салқындатылған'), pharma: T('Фарма 2–8 °C', 'Pharma 2–8 °C', 'Pharma 2–8 °C', 'Фарма 2–8 °C'), ambient: T('Сухая зона', 'Trocken', 'Ambient', 'Құрғақ аймақ') };
  DRAWERS.hub = d => {
    const h = d.id, H = S.hubs[h], u = util(h), st = hubState(h), tab = d.tab || 'overview';
    const tabs = [['overview', T('Обзор', 'Übersicht', 'Overview', 'Шолу')], ['ramps', T('Рампы', 'Rampen', 'Docks', 'Рампалар')], ['yard', T('Очередь', 'Warteschlange', 'Yard queue', 'Кезек')], ['loads', T('Рейсы', 'Fahrten', 'Loads', 'Рейстер')]];
    let b = '';
    if (tab === 'overview') {
      b = `<div class="drawer-section"><div class="ident"><span class="avatar" style="background:var(--green)">${ic('warehouse', 18)}</span><div><b>${esc(HUBS[h].name)}</b><div class="sub">${esc(H.addr)}</div></div></div><div class="kv">${kv(T('Загрузка', 'Auslastung', 'Utilization', 'Жүктеме'), pf(u.pct))}${kv(T('Мест всего', 'Plätze gesamt', 'Places total', 'Орын барлығы'), LF.n(u.t))}${kv(T('Рамп', 'Rampen', 'Dock doors', 'Рампа'), H.ramps.length)}${kv(T('Статус', 'Status', 'Status', 'Күйі'), chip(HS[st].c, HS[st].l))}</div></div>
${KIT.sectionHead(T('Разбивка по температурным зонам', 'Aufteilung nach Temperaturzonen', 'Inventory by temperature zone', 'Температура аймақтары бойынша бөліну'))}${ZK.map(z => { const p = zPct(h, z); return `<div class="bar-lab"><span><span class="chip zone-${z}">${ZONES[z].label}</span> ${esc(ZN[z])}</span><b>${H.places[z][1]} / ${H.places[z][0]} · ${Math.round(p)} %</b></div><div class="progress ${barCls(p)}"><i style="width:${p}%"></i></div>`; }).join('')}</div>
<div class="drawer-section actbar"><button class="btn primary" data-act="hrecv" data-id="${h}">${esc(T('Открыть приёмку хаба', 'Wareneingang des Hubs', 'Open hub receiving', 'Хаб қабылдауын ашу'))}</button>${H.maint ? `<button class="btn green" data-act="hmaint" data-id="${h}">${esc(T('Вернуть в работу', 'Wieder aktiv', 'Back to active', 'Жұмысқа қайтару'))}</button>` : `<button class="btn grey" data-act="hmaint" data-id="${h}">${esc(T('Перевести в обслуживание', 'In Wartung setzen', 'Set to maintenance', 'Қызмет көрсетуге ауыстыру'))}</button>`}</div>`;
    } else if (tab === 'ramps') {
      const slots = [480, 600, 720, 840, 960, 1080], col = H.ramps.length;
      const head = `<div class="h"></div>` + H.ramps.map((z, i) => `<div class="h" title="${ZONES[z].label}">${esc(T('Р', 'R', 'R', 'Р'))}${i + 1}<br><span class="chip zone-${z}" style="font-size:10px;padding:0 6px">${ZONES[z].label}</span></div>`).join('');
      const cells = slots.map(s => `<div class="h">${hmm(s)}</div>` + H.ramps.map((z, i) => { const j = S.jobs.find(x => x.hub === h && x.ramp === i + 1 && x.win && x.win[0] >= s && x.win[0] < s + 120); const bl = H.blocked.includes(i + 1);
        return j ? `<div class="slot in" data-act="openJ" data-id="${j.id}" style="cursor:pointer">${j.id.slice(3)}${j.zone !== 'ambient' ? ' ❄' : ''}</div>` : `<div class="slot">${bl ? '✕' : '—'}</div>`; }).join('')).join('');
      b = `${KIT.sectionHead(T('График рамп (приёмка)', 'Rampenplan (Wareneingang)', 'Dock schedule (receiving)', 'Рампа кестесі (қабылдау)'))}<div class="dock-grid" style="grid-template-columns:44px repeat(${col},1fr)">${head}${cells}</div></div>
${KIT.sectionHead(T('Статус рамп', 'Rampenstatus', 'Dock status', 'Рампа күйі'))}${H.ramps.map((z, i) => { const bl = H.blocked.includes(i + 1); return `<div class="tinted-row ${bl ? 'red' : 'green'}"><span><b>${esc(T('Рампа ', 'Rampe ', 'Dock ', 'Рампа '))}${i + 1}</b> · ${ZONES[z].label}</span><span>${bl ? esc(T('Размораживание / ремонт', 'Abtauen / Reparatur', 'Defrost / repair', 'Еріту / жөндеу')) : esc(T('Доступна', 'Verfügbar', 'Available', 'Қолжетімді'))} <button class="btn sm ${bl ? 'green' : 'grey'}" data-act="blk" data-id="${h}" data-v="${i + 1}">${bl ? esc(T('Открыть', 'Öffnen', 'Open', 'Ашу')) : esc(T('Закрыть', 'Sperren', 'Block', 'Жабу'))}</button></span></div>`; }).join('')}</div>`;
    } else if (tab === 'yard') {
      const q = yard(h);
      b = `${KIT.sectionHead(T('Очередь рефрижераторов', 'Kühlfahrzeug-Warteschlange', 'Reefer queue', 'Рефрижератор кезегі'))}${q.map(j => { const w = Math.round(S.clock - j.ev.ci), cold = j.zone !== 'ambient', cls = cold && w > 30 ? 'red' : w > 15 ? 'yellow' : 'green';
        return `<div class="tinted-row ${cls}" data-act="openJ" data-id="${j.id}" style="cursor:pointer"><span><b>${esc(j.plate || '—')}</b><div class="sub">${esc(j.id)} · ${zoneChip(j.zone)} ${esc(T('ожидает рампу', 'wartet auf Rampe', 'waiting for a dock', 'рампаны күтуде'))}</div></span><b>${w} ${esc(T('мин', 'min', 'min', 'мин'))}</b></div>`; }).join('') || `<p class="note">${esc(T('Очередь пуста', 'Warteschlange leer', 'Queue is empty', 'Кезек бос'))}</p>`}<p class="note">${esc(T('Красный: холодовой груз ждёт дольше 30 мин — риск для цепи.', 'Rot: Kühlgut wartet über 30 Min — Risiko für die Kette.', 'Red: cold cargo waits over 30 min — cold-chain risk.', 'Қызыл: суық жүк 30 мин астам күтеді — тізбек тәуекелі.'))}</p></div>`;
    } else {
      const ls = S.loads.filter(l => (l.from === h || l.to === h) && l.status !== 'delivered');
      b = `${KIT.sectionHead(T('Связанные рейсы', 'Verknüpfte Fahrten', 'Linked loads', 'Байланысты рейстер'))}${ls.map(l => `<div class="tinted-row ${ST[l.status].c === 'gray' ? 'gray' : ST[l.status].c === 'red' ? 'red' : ST[l.status].c === 'yellow' ? 'yellow' : ST[l.status].c === 'green' ? 'green' : 'blue'}" data-act="open" data-id="${l.id}" style="cursor:pointer"><span><b>${l.id}</b><div class="sub">${esc(HUBS[l.from].city)} → ${esc(HUBS[l.to].city)} · ETA ${fdt(l.eta)}</div></span>${stChip(l.status)}</div>`).join('') || `<p class="note">—</p>`}</div>`;
    }
    return { title: T('Детали хаба', 'Hub-Details', 'Warehouse Details', 'Хаб мәліметтері'), html: `<div class="drawer-tabs">${tabs.map(t => `<span class="tab${tab === t[0] ? ' active' : ''}" data-act="htabd" data-v="${t[0]}">${esc(t[1])}</span>`).join('')}</div>${b}` };
  };
  Object.assign(ACT, {
    openH: d => openDrawer({ type: 'hub', id: d.id, tab: 'overview' }),
    htabd: d => { S.drawer.tab = d.v; render(); },
    hview: d => { S.hubView = d.v; render(); },
    clrH: () => { Object.keys(F).forEach(k => F[k] = ''); render(); },
    hset: () => toast(T('Настройки хабов: фаза 6 (Settings)', 'Hub-Einstellungen: Phase 6', 'Hub settings: phase 6 (Settings)', 'Хаб баптаулары: 6-кезең')),
    hadd: () => toast(T('Добавление хаба: фаза 6 (Settings)', 'Hub hinzufügen: Phase 6', 'Add hub: phase 6 (Settings)', 'Хаб қосу: 6-кезең')),
    hrecv: d => { S.rf.hub = d.id; setTab('hubs', 'recv'); },
    hmaint: d => { const H = S.hubs[d.id]; H.maint = !H.maint; toast(H.maint ? T('Хаб переведён в обслуживание', 'Hub in Wartung', 'Hub set to maintenance', 'Хаб қызмет көрсетуге ауысты') : T('Хаб снова активен', 'Hub wieder aktiv', 'Hub active again', 'Хаб қайта белсенді')); },
    blk: d => { const H = S.hubs[d.id], n = +d.v; H.blocked = H.blocked.includes(n) ? H.blocked.filter(x => x !== n) : H.blocked.concat(n); render(); },
  });
  document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.hf; if (k) { F[k] = e.target.value; render(); } });
})();
