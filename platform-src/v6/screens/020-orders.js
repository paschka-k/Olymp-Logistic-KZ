/* Orders & Loads (spec 5.2): filters, table 8/page, 6-tab drawer, create form. */
(function () {
  const PER = 8;
  const sel = (key, label, opts) => `<label>${esc(label)}:</label><select class="select" data-f="${key}">${opts.map(o => `<option value="${esc(o[0])}"${S.f[key] === o[0] ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
  const ALL = T('Все', 'Alle', 'All', 'Барлығы');
  const filtered = () => {
    const f = S.f, q = f.q.trim().toLowerCase();
    return S.loads.filter(l => (!f.status || l.status === f.status) && (!f.cust || l.cust === f.cust) && (!f.zone || l.zone === f.zone) && (!f.pri || l.priority === f.pri) &&
      (!q || (l.id + ' ' + cust(l.cust).name + ' ' + HUBS[l.from].city + ' ' + HUBS[l.to].city + ' ' + (l.truck ? trk(l.truck).plate : '') + ' ' + (l.driver ? drv(l.driver).name : '')).toLowerCase().includes(q)));
  };
  function table() {
    const all = filtered(), pages = Math.max(1, Math.ceil(all.length / PER)); if (S.f.page > pages) S.f.page = pages;
    const rows = all.slice((S.f.page - 1) * PER, S.f.page * PER).map(l => { const c = cust(l.cust), d = l.driver && drv(l.driver), t = l.truck && trk(l.truck), m = Math.round((revenue(l) - cost(l)) / revenue(l) * 100);
      return `<tr class="${S.drawer && S.drawer.id === l.id ? 'is-selected' : ''}" data-act="open" data-id="${l.id}"><td><a class="lnk">${l.id}</a><div class="sub">${esc(T('создан', 'erstellt', 'created', 'құрылды'))} ${fdt(l.created).slice(0, 5)}</div></td>
<td><div class="cell">${avatar(c.ini, c.av)}<div><b>${esc(c.name)}</b><div class="sub">${esc(T('БИН', 'BIN', 'BIN', 'БСН'))} ${c.bin}</div></div></div></td>
<td><b>${esc(HUBS[l.from].city)} → ${esc(HUBS[l.to].city)}</b><div class="sub">${dist(l.from, l.to)} ${esc(T('км', 'km', 'km', 'км'))} · ${l.pallets} ${esc(T('пал.', 'Pal.', 'pal.', 'пал.'))}</div></td>
<td>${fdt(l.eta)}</td><td>${zoneChip(l.zone)}<div class="sub">${tempChip(l)}</div></td><td>${stChip(l.status)}</td><td>${chip(PRI[l.priority].c, PRI[l.priority].l)}</td>
<td>${d ? `<b>${esc(d.name)}</b><div class="sub">${esc(t.plate)}</div>` : '<span class="faint">—</span>'}</td>
<td><b>${kzt(revenue(l))}</b><div class="sub">${esc(T('маржа', 'Marge', 'margin', 'маржа'))} ${m} %</div></td><td>${chip(ESF[l.esf].c, ESF[l.esf].l)}</td></tr>`; }).join('');
    const th = [T('Рейс', 'Fahrt', 'Load ID', 'Рейс'), T('Клиент', 'Kunde', 'Customer', 'Клиент'), T('Маршрут', 'Route', 'Route', 'Маршрут'), 'ETA', T('Темп. зона', 'Temp.-Zone', 'Temp zone', 'Темп. аймақ'), T('Статус', 'Status', 'Status', 'Күйі'), T('Приоритет', 'Priorität', 'Priority', 'Басымдық'), T('Водитель / ТС', 'Fahrer / Fzg.', 'Driver / Truck', 'Жүргізуші / КҚ'), T('Ставка', 'Satz', 'Rate', 'Бағасы'), 'ЭСФ'];
    const pg = Array.from({ length: pages }, (_, i) => `<button class="pgb${i + 1 === S.f.page ? ' on' : ''}" data-act="page" data-v="${i + 1}">${i + 1}</button>`).join('');
    return `<div class="card tcard"><table class="table"><thead><tr>${th.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="10" class="empty">${esc(T('Ничего не найдено', 'Nichts gefunden', 'No loads match the filters', 'Ештеңе табылмады'))}</td></tr>`}</tbody></table>
<div class="pager"><span>${esc(T('Показано', 'Angezeigt', 'Showing', 'Көрсетілді'))} ${all.length ? (S.f.page - 1) * PER + 1 : 0}–${Math.min(S.f.page * PER, all.length)} ${esc(T('из', 'von', 'of', '/'))} ${all.length}</span><span>${pg}</span></div></div>`;
  }
  SCREENS.orders = {
    title: () => navLabel('orders'),
    sub: () => T('Все рейсы: кто, что, куда, когда, статус и маржа', 'Alle Fahrten: wer, was, wohin, wann, Status und Marge', 'Every load: who, what, where, when, status and margin', 'Барлық рейстер: кім, не, қайда, қашан, күйі және маржа'),
    actions: () => `<button class="btn grey" data-act="imp">${esc(T('Импорт', 'Import', 'Import Loads', 'Импорт'))}</button><button class="btn primary" data-act="create">${ic('plus')} ${esc(T('Создать рейс', 'Fahrt anlegen', 'Create New Load', 'Рейс құру'))}</button>`,
    body: () => `<div class="filters">${sel('status', T('Статус', 'Status', 'Status', 'Күйі'), [['', ALL], ...ORDER.map(s => [s, ST[s].l])])}${sel('cust', T('Клиент', 'Kunde', 'Customer', 'Клиент'), [['', ALL], ...CUSTOMERS.map(c => [c.id, c.name])])}${sel('zone', T('Зона', 'Zone', 'Zone', 'Аймақ'), [['', ALL], ...Object.keys(ZONES).map(z => [z, ZONES[z].label])])}${sel('pri', T('Приоритет', 'Priorität', 'Priority', 'Басымдық'), [['', ALL], ...Object.keys(PRI).map(p => [p, PRI[p].l])])}<button class="clear-all" data-act="clear">× ${esc(T('Сбросить', 'Zurücksetzen', 'Clear All', 'Тазалау'))}</button></div>${table()}`,
  };

  /* ---------- drawer: load ---------- */
  function spark(l) {
    let h = 0; for (const ch of l.id) h = (h * 31 + ch.charCodeAt(0)) % 997;
    const z = ZONES[l.zone], pts = Array.from({ length: 24 }, (_, i) => z.mid + Math.sin((i + h) / 2.3) * (z.hi - z.lo) * 0.18 + ((h + i * 7) % 5 - 2) * 0.12);
    if (tempState(l) === 'breach') for (let i = 18; i < 24; i++) pts[i] = l.temp + (i - 21) * 0.1;
    else pts[23] = l.temp;
    const mn = Math.min(z.lo - 1, ...pts), mx = Math.max(z.hi + 1, ...pts), Y = v => 80 - (v - mn) / (mx - mn) * 76, p = pts.map((v, i) => `${i * 12.4},${Y(v).toFixed(1)}`).join(' ');
    const ex = pts.filter(v => v < z.lo || v > z.hi).length * 15;
    return { ex, svg: `<svg viewBox="0 0 285 84" class="spark"><rect x="0" y="${Y(z.hi)}" width="285" height="${Y(z.lo) - Y(z.hi)}" fill="var(--temp-ok-bg)"/><polyline points="${p}" fill="none" stroke="var(--chart-blue)" stroke-width="2"/></svg>` };
  }
  globalThis.sparkOf = spark;
  const kv = (k, v) => `<div><small>${esc(k)}</small><b>${v}</b></div>`;
  DRAWERS.load = d => {
    const l = load(d.id), c = cust(l.cust), tab = d.tab, dd = l.driver && drv(l.driver), tt = l.truck && trk(l.truck), pr = [['overview', T('Обзор', 'Übersicht', 'Overview', 'Шолу')], ['stops', T('Остановки', 'Stopps', 'Stops', 'Аялдамалар')], ['docs', T('Документы', 'Dokumente', 'Docs', 'Құжаттар')], ['notes', T('Заметки', 'Notizen', 'Notes', 'Жазбалар')], ['billing', T('Счёт', 'Abrechnung', 'Billing', 'Шот')], ['temp', T('Температура', 'Temperatur', 'Temperature', 'Температура')]];
    const tabs = `<div class="drawer-tabs">${pr.map(p => `<span class="tab${tab === p[0] ? ' active' : ''}" data-act="tab" data-v="${p[0]}">${esc(p[1])}</span>`).join('')}</div>`;
    let b = '';
    if (tab === 'overview') {
      let asg;
      if (l.status === 'unassigned') {
        const ds = S.drivers.filter(x => x.status === 'available'), ts = S.trucks.filter(x => x.status === 'available');
        asg = `<div class="drawer-section"><h4>${esc(T('Назначение', 'Zuweisung', 'Assignment', 'Тағайындау'))}</h4><label class="fl">${esc(T('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'))}<select class="select" id="as_d"><option value="">—</option>${ds.map(x => `<option value="${x.id}">${esc(x.name)} · РТО ${x.rto} ${esc(T('ч', 'h', 'h', 'сағ'))}</option>`).join('')}</select></label>
<label class="fl">${esc(T('Транспорт', 'Fahrzeug', 'Truck', 'Көлік'))}<select class="select" id="as_t"><option value="">—</option>${ts.map(x => `<option value="${x.id}">${esc(x.plate)} · ${esc(x.model)} · ${x.cap} ${esc(T('пал.', 'Pal.', 'pal.', 'пал.'))}</option>`).join('')}</select></label>
<button class="btn primary block" data-act="doAssign" data-id="${l.id}">${esc(T('Назначить', 'Zuweisen', 'Assign', 'Тағайындау'))}</button><p class="note">${esc(T('Требуется ТС с подходящей температурной зоной и водитель с достаточным временем вождения (РТО ≥ ', 'Benötigt: passende Temperaturzone und ausreichende Lenkzeit (RTO ≥ ', 'Needs a truck for the temperature zone and a driver with enough driving time (RTO ≥ ', 'Температура аймағына сай КҚ және жеткілікті жүргізу уақыты (РТО ≥ '))}${needRto(l)} ${esc(T('ч)', 'h)', 'h)', 'сағ)'))}</p></div>`;
      } else asg = `<div class="drawer-section"><h4>${esc(T('Назначение', 'Zuweisung', 'Assignment', 'Тағайындау'))}</h4><div class="kv">${kv(T('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'), esc(dd.name))}${kv(T('Транспорт', 'Fahrzeug', 'Truck', 'Көлік'), esc(tt.plate))}${kv(T('Тип', 'Typ', 'Type', 'Түрі'), esc(tt.model))}${kv('РТО', String(dd.rto).replace('.', ',') + ' ' + T('ч', 'h', 'h', 'сағ'))}</div></div>`;
      const nx = NEXT[l.status];
      const act = l.status === 'delivered' ? '' : `<div class="drawer-section actbar">${nx ? `<button class="btn green" data-act="adv" data-id="${l.id}" data-to="${nx}">→ ${esc(ST[nx].l)}</button>` : ''}${['loading', 'in_transit'].includes(l.status) ? `<button class="btn red" data-act="adv" data-id="${l.id}" data-to="problem">${esc(T('Сообщить о проблеме', 'Problem melden', 'Report problem', 'Мәселе туралы хабарлау'))}</button>` : ''}${l.status === 'problem' ? `<button class="btn primary" data-act="adv" data-id="${l.id}" data-to="in_transit">${esc(T('Проблема решена', 'Problem gelöst', 'Resolved — resume', 'Шешілді'))}</button>` : ''}</div>`;
      b = `<div class="drawer-section"><div class="ident">${avatar(c.ini, c.av)}<div><b>${esc(c.name)}</b><div class="sub">${esc(T('БИН', 'BIN', 'BIN', 'БСН'))} ${c.bin}</div></div></div><div class="kv">${kv(T('Маршрут', 'Route', 'Route', 'Маршрут'), esc(HUBS[l.from].city) + ' → ' + esc(HUBS[l.to].city))}${kv(T('Расстояние', 'Strecke', 'Distance', 'Қашықтық'), dist(l.from, l.to) + ' ' + T('км', 'km', 'km', 'км'))}${kv('ETA', fdt(l.eta))}${kv(T('Статус', 'Status', 'Status', 'Күйі'), stChip(l.status))}${kv(T('Зона', 'Zone', 'Zone', 'Аймақ'), zoneChip(l.zone))}${kv(T('Темп. сейчас', 'Temp. aktuell', 'Temp now', 'Қазіргі темп.'), tempChip(l))}${kv(T('Паллеты', 'Paletten', 'Pallets', 'Паллеттер'), l.pallets)}${kv(T('Вес', 'Gewicht', 'Weight', 'Салмағы'), l.kg.toLocaleString('ru-RU') + ' ' + T('кг', 'kg', 'kg', 'кг'))}</div></div>${asg}${act}`;
    } else if (tab === 'stops') {
      const st = l.status, done = x => x ? 'done' : '';
      b = `<div class="drawer-section stops">${[[T('Погрузка', 'Beladung', 'Pickup', 'Тиеу'), HUBS[l.from].name, st !== 'unassigned' && st !== 'assigned'], [T('В пути', 'Unterwegs', 'In transit', 'Жолда'), dist(l.from, l.to) + ' ' + T('км', 'km', 'km', 'км'), ['in_transit', 'problem', 'delivered'].includes(st)], [T('Выгрузка', 'Entladung', 'Delivery', 'Түсіру'), HUBS[l.to].name, st === 'delivered']].map(s => `<div class="stop ${done(s[2])}"><i></i><div><b>${esc(s[0])}</b><div class="sub">${esc(s[1])}</div></div></div>`).join('')}</div>`;
    } else if (tab === 'docs') {
      const ds = [[T('ТТН / накладная', 'Frachtbrief (TTN)', 'Waybill (TTN)', 'ТТН / жүкқұжат'), l.status !== 'unassigned'], [T('Лог температуры (PDF/CSV)', 'Temperaturlog (PDF/CSV)', 'Temperature log (PDF/CSV)', 'Температура журналы'), ['in_transit', 'problem', 'delivered'].includes(l.status)], [T('Акт приёма-передачи', 'Übergabeprotokoll', 'Handover act', 'Қабылдау-тапсыру актісі'), l.status === 'delivered'], ['POD', l.pod === 'approved'], [T('ЭСФ / ЭСУТД', 'ESF / ESUTD', 'ESF / ESUTD', 'ЭШФ / ЭЖТД'), l.esf !== 'none']];
      b = `<div class="drawer-section">${ds.map(x => `<div class="tinted-row ${x[1] ? 'green' : 'gray'}"><span>${esc(x[0])}</span><span>${x[1] ? esc(T('Доступно', 'Verfügbar', 'Available', 'Қолжетімді')) : '<span class="faint">' + esc(T('Нет', 'Nein', 'Not available', 'Жоқ')) + '</span>'}</span></div>`).join('')}</div>`;
    } else if (tab === 'notes') {
      b = `<div class="drawer-section">${l.notes.map(n => `<div class="note-i"><b>${esc(n.who)}</b> <small>${esc(n.t)}</small><div>${esc(n.text)}</div></div>`).join('') || `<p class="note">${esc(T('Заметок пока нет', 'Noch keine Notizen', 'No notes yet', 'Жазба әзірге жоқ'))}</p>`}<textarea id="newnote" class="ta" rows="3" placeholder="${esc(T('Добавить заметку…', 'Notiz hinzufügen…', 'Add a note…', 'Жазба қосу…'))}"></textarea><button class="btn primary" data-act="addNote" data-id="${l.id}">${esc(T('Добавить', 'Hinzufügen', 'Add note', 'Қосу'))}</button></div>`;
    } else if (tab === 'billing') {
      const r = revenue(l), vat = Math.round(r * 0.12 / 1.12), c = cost(l);
      b = `<div class="drawer-section"><div class="kv">${kv(T('Ставка', 'Satz', 'Rate', 'Бағасы'), kzt(r))}${kv(T('в т.ч. НДС 12 %', 'inkl. MwSt 12 %', 'incl. VAT 12 %', 'оның ішінде ҚҚС 12 %'), kzt(vat))}${kv(T('Затраты', 'Kosten', 'Cost', 'Шығыс'), kzt(c))}${kv(T('Прибыль', 'Gewinn', 'Profit', 'Пайда'), kzt(r - c))}${kv(T('Отсрочка', 'Zahlungsziel', 'Terms', 'Кейінге қалдыру'), T('30 дн.', '30 Tage', '30 days', '30 күн'))}${kv('ЭСФ', chip(ESF[l.esf].c, ESF[l.esf].l))}</div>
${l.status === 'delivered' ? (l.pod === 'approved' && l.esf === 'none' ? `<button class="btn purple block" data-act="issueEsf" data-id="${l.id}">${esc(T('Выписать ЭСФ', 'ESF ausstellen', 'Issue ESF', 'ЭШФ жазу'))}</button>` : l.pod !== 'approved' ? `<p class="note">${esc(T('ЭСФ доступна после подтверждения POD (фаза 5).', 'ESF nach POD-Freigabe verfügbar (Phase 5).', 'ESF becomes available once the POD is approved (phase 5).', 'ЭШФ POD расталғаннан кейін қолжетімді (5-кезең).'))}</p>` : '') : ''}</div>`;
    } else if (tab === 'temp') {
      const s = spark(l);
      b = `<div class="drawer-section"><div class="kv">${kv(T('Диапазон', 'Bereich', 'Range', 'Диапазон'), zoneChip(l.zone))}${kv(T('Сейчас', 'Aktuell', 'Now', 'Қазір'), tempChip(l))}${kv(T('Отклонение, мин', 'Abweichung, Min', 'Excursion, min', 'Ауытқу, мин'), s.ex)}</div>${s.svg}<p class="note">${esc(T('Серия за последние 6 ч (демо-данные).', 'Verlauf der letzten 6 h (Demodaten).', 'Last 6 h series (demo data).', 'Соңғы 6 сағат (демо).'))}</p></div>`;
    }
    return { title: l.id, html: tabs + b };
  };
  DRAWERS.create = () => {
    const o = (arr, fn) => arr.map(fn).join('');
    return { title: T('Новый рейс', 'Neue Fahrt', 'New Load', 'Жаңа рейс'), html: `<div class="drawer-section"><label class="fl">${esc(T('Клиент', 'Kunde', 'Customer', 'Клиент'))}<select class="select" id="n_cust">${o(CUSTOMERS, c => `<option value="${c.id}">${esc(c.name)}</option>`)}</select></label>
<div class="two"><label class="fl">${esc(T('Откуда', 'Von', 'From', 'Қайдан'))}<select class="select" id="n_from">${o(Object.keys(HUBS), k => `<option value="${k}">${esc(HUBS[k].city)}</option>`)}</select></label><label class="fl">${esc(T('Куда', 'Nach', 'To', 'Қайда'))}<select class="select" id="n_to">${o(Object.keys(HUBS), k => `<option value="${k}"${k === 'ALA' ? ' selected' : ''}>${esc(HUBS[k].city)}</option>`)}</select></label></div>
<label class="fl">${esc(T('Температурная зона', 'Temperaturzone', 'Temperature zone', 'Температура аймағы'))}<select class="select" id="n_zone">${o(Object.keys(ZONES), z => `<option value="${z}">${ZONES[z].label}</option>`)}</select></label>
<div class="two"><label class="fl">${esc(T('Паллет', 'Paletten', 'Pallets', 'Паллет'))}<input class="select" id="n_pal" type="number" min="1" max="33" value="12"></label><label class="fl">${esc(T('Приоритет', 'Priorität', 'Priority', 'Басымдық'))}<select class="select" id="n_pri">${o(Object.keys(PRI), p => `<option value="${p}"${p === 'medium' ? ' selected' : ''}>${esc(PRI[p].l)}</option>`)}</select></label></div>
<p class="note" id="n_err" style="color:var(--chip-red-fg)"></p><button class="btn primary block" data-act="saveLoad">${esc(T('Создать рейс', 'Fahrt anlegen', 'Create load', 'Рейс құру'))}</button></div>` };
  };
  Object.assign(ACT, {
    imp: () => toast(T('Импорт CSV: будет в фазе 2б', 'CSV-Import: Phase 2b', 'CSV import: phase 2b', 'CSV импорты: 2б кезең')),
    doAssign: d => { const e = assign(d.id, $('#as_d').value, $('#as_t').value); if (e) toast(e, 'err'); else { S.drawer.tab = 'overview'; toast(T('Рейс назначен', 'Fahrt zugewiesen', 'Load assigned', 'Рейс тағайындалды')); } },
    adv: d => { const l = load(d.id), e = canMove(l, d.to); if (e) return toast(e, 'err'); setStatus(d.id, d.to); render(); },
    addNote: d => { const v = $('#newnote').value.trim(); if (!v) return; load(d.id).notes.push({ who: 'Sarah Johnson', t: fdt(NOW).slice(-5), text: v }); render(); },
    issueEsf: d => { const l = load(d.id); l.esf = 'issued'; toast(T('ЭСФ выписана', 'ESF ausgestellt', 'ESF issued', 'ЭШФ жазылды')); },
    saveLoad: () => { const r = createLoad({ cust: $('#n_cust').value, from: $('#n_from').value, to: $('#n_to').value, zone: $('#n_zone').value, pallets: +$('#n_pal').value, priority: $('#n_pri').value });
      if (typeof r === 'string') { $('#n_err').textContent = r; return; } S.drawer = { type: 'load', id: r.ok, tab: 'overview' }; toast(T('Рейс создан: ', 'Fahrt angelegt: ', 'Load created: ', 'Рейс құрылды: ') + r.ok); },
  });
})();
