/* Dispatch Board (spec 5.3) + Planning tab (decision Q4): kanban, Auto-Assign, drag & drop with status rules. */
(function () {
  const ALL = T('Все', 'Alle', 'All', 'Барлығы');
  const sel = (key, label, opts) => `<label>${esc(label)}:</label><select class="select" data-f="${key}">${opts.map(o => `<option value="${esc(o[0])}"${S.f[key] === o[0] ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
  const DRV = { available: T('Свободен', 'Frei', 'Available', 'Бос'), busy: T('В рейсе', 'Im Einsatz', 'On trip', 'Рейсте'), rest: T('Отдых', 'Ruhe', 'Resting', 'Демалыс') };
  function card(l) {
    const d = l.driver && drv(l.driver), t = l.truck && trk(l.truck);
    return `<div class="kcard${S.drawer && S.drawer.id === l.id ? ' sel' : ''}" draggable="true" data-id="${l.id}" data-act="open"><div class="r1"><a class="lnk">${l.id}</a>${chip(PRI[l.priority].c, PRI[l.priority].l)}</div>
<div class="rt">${esc(HUBS[l.from].city)} → ${esc(HUBS[l.to].city)}</div><div class="sub">${zoneChip(l.zone)} ${l.status === 'in_transit' || l.status === 'problem' ? tempChip(l) : ''}</div>
<div class="sub">ETA ${fdt(l.eta)} · ${l.pallets} ${esc(T('пал.', 'Pal.', 'pal.', 'пал.'))}</div>
${l.status === 'problem' ? `<div class="prob">${ic('alert', 14)} ${esc(T('Температура вне диапазона', 'Temperatur außerhalb Bereich', 'Temperature out of range', 'Температура диапазоннан тыс'))}</div>` : ''}
<div class="r2">${d ? `<span class="cell">${avatar(d.ini, 1)}<span>${esc(d.name.split(' ')[0])}</span><small>${esc(t.plate)}</small></span>` : `<span class="faint">${esc(T('не назначен', 'offen', 'unassigned', 'тағайындалмаған'))}</span>`}<b>${kzt(revenue(l))}</b></div></div>`;
  }
  function board() {
    const f = S.f;
    const ls = S.loads.filter(l => (!f.pri || l.priority === f.pri) && (!f.hub || l.from === f.hub || l.to === f.hub) && (!f.drv || (l.driver && drv(l.driver).status === f.drv)));
    return `<div class="board">${ORDER.map(s => { const c = ls.filter(l => l.status === s);
      return `<div class="col" data-col="${s}"><div class="colh"><span class="d ${ST[s].c}"></span><b>${esc(ST[s].l)}</b><span class="cnt">${c.length}</span></div><div class="colb">${c.map(card).join('') || `<div class="empty">—</div>`}</div></div>`; }).join('')}</div>`;
  }
  function planning() {
    const un = S.loads.filter(l => l.status === 'unassigned');
    const rows = Object.keys(ZONES).map(z => {
      const dem = un.filter(l => l.zone === z).reduce((s, l) => s + l.pallets, 0), n = un.filter(l => l.zone === z).length;
      const cap = S.trucks.filter(t => t.status === 'available' && t.zones.includes(z)).reduce((s, t) => s + t.cap, 0), pct = cap ? Math.round(dem / cap * 100) : (dem ? 100 : 0);
      const cls = pct >= 90 ? 'crit' : pct >= 80 ? 'warn' : pct < 50 ? 'low' : '';
      return `<tr><td>${zoneChip(z)}</td><td>${n}</td><td>${dem}</td><td>${cap}</td><td style="width:32%"><div class="progress ${cls}"><i style="width:${Math.min(100, pct)}%"></i></div></td><td><b>${pct} %</b></td></tr>`;
    }).join('');
    const dr = S.drivers.map(d => `<tr><td><span class="cell">${avatar(d.ini, 1)}<b>${esc(d.name)}</b></span></td><td>${chip(d.status === 'available' ? 'green' : d.status === 'busy' ? 'blue' : 'gray', DRV[d.status])}</td><td><span class="dot ${d.rto >= 6 ? 'good' : d.rto >= 4 ? 'warn' : 'bad'}" style="width:12px;height:12px"></span> ${String(d.rto).replace('.', ',')} ${esc(T('ч', 'h', 'h', 'сағ'))}</td></tr>`).join('');
    return `<div class="grid2 eq"><div class="card tcard"><div class="card-head">${esc(T('Спрос и ёмкость по температурным зонам', 'Bedarf und Kapazität je Temperaturzone', 'Demand vs capacity by temperature zone', 'Температура аймақтары бойынша сұраныс пен сыйымдылық'))}</div><table class="table"><thead><tr><th>${esc(T('Зона', 'Zone', 'Zone', 'Аймақ'))}</th><th>${esc(T('Рейсов', 'Fahrten', 'Loads', 'Рейс'))}</th><th>${esc(T('Паллет', 'Paletten', 'Pallets', 'Паллет'))}</th><th>${esc(T('Места', 'Plätze', 'Places', 'Орын'))}</th><th></th><th>${esc(T('Загрузка', 'Auslastung', 'Utilization', 'Жүктеме'))}</th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="card tcard"><div class="card-head">${esc(T('Водители и время вождения (РТО)', 'Fahrer und Lenkzeit (RTO)', 'Drivers and driving time (RTO)', 'Жүргізушілер және жүргізу уақыты (РТО)'))}</div><table class="table"><thead><tr><th>${esc(T('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'))}</th><th>${esc(T('Статус', 'Status', 'Status', 'Күйі'))}</th><th>${esc(T('Осталось', 'Verbleibend', 'Remaining', 'Қалды'))}</th></tr></thead><tbody>${dr}</tbody></table></div></div>`;
  }
  Object.assign(ACT, {
    auto: () => { const r = autoAssign(); toast(r.ok ? T('Назначено автоматически: ', 'Automatisch zugewiesen: ', 'Auto-assigned: ', 'Автоматты тағайындалды: ') + r.ok + (r.fail ? T('; не удалось: ', '; nicht möglich: ', '; could not assign: ', '; болмады: ') + r.fail : '') : T('Нет подходящих ТС/водителей для свободных рейсов', 'Keine passenden Fahrzeuge/Fahrer', 'No matching trucks/drivers for unassigned loads', 'Сәйкес КҚ/жүргізуші жоқ'), r.ok ? 'ok' : 'err'); },
    
  });
  SCREENS.dispatch = {
    title: () => navLabel('dispatch'),
    sub: () => T('Перетащите карточку в следующий столбец или откройте её для назначения', 'Karte in die nächste Spalte ziehen oder öffnen, um zuzuweisen', 'Drag a card to the next column or open it to assign', 'Картаны келесі бағанға сүйреңіз немесе тағайындау үшін ашыңыз'),
    actions: () => `<button class="btn green" data-act="auto">${ic('spark')} ${esc(T('Авто-назначение', 'Auto-Zuweisung', 'Auto-Assign', 'Авто-тағайындау'))}</button><button class="btn primary" data-act="create">${ic('plus')} ${esc(T('Создать рейс', 'Fahrt anlegen', 'Create New Load', 'Рейс құру'))}</button>`,
    tabs: [{ key: 'board', label: T('Доска', 'Tafel', 'Board', 'Тақта'), body: () => `<div class="filters">${sel('pri', T('Приоритет', 'Priorität', 'Priority', 'Басымдық'), [['', ALL], ...Object.keys(PRI).map(p => [p, PRI[p].l])])}${sel('drv', T('Статус водителя', 'Fahrerstatus', 'Driver status', 'Жүргізуші күйі'), [['', ALL], ...Object.keys(DRV).map(k => [k, DRV[k]])])}${sel('hub', T('Хаб', 'Hub', 'Hub', 'Хаб'), [['', ALL], ...Object.keys(HUBS).map(k => [k, HUBS[k].city])])}<button class="clear-all" data-act="clear">× ${esc(T('Сбросить', 'Zurücksetzen', 'Clear All', 'Тазалау'))}</button></div>${board()}` }, { key: 'planning', label: T('Планирование', 'Planung', 'Planning', 'Жоспарлау'), body: () => planning() }],
  };
  /* drag & drop (HTML5) */
  let dragId = null;
  document.addEventListener('dragstart', e => { const c = e.target.closest && e.target.closest('.kcard'); if (c) { dragId = c.dataset.id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (_) {} } });
  const colOf = e => e.target.closest && e.target.closest('.col');
  const clearHi = () => $$('.col.drop-ok,.col.drop-no').forEach(c => c.classList.remove('drop-ok', 'drop-no'));
  document.addEventListener('dragover', e => { const col = colOf(e); if (!dragId || !col) return; e.preventDefault(); const l = load(dragId), ok = l.status === col.dataset.col || !canMove(l, col.dataset.col) || (l.status === 'unassigned' && col.dataset.col === 'assigned'); if (!col.classList.contains(ok ? 'drop-ok' : 'drop-no')) { clearHi(); col.classList.add(ok ? 'drop-ok' : 'drop-no'); } });
  document.addEventListener('dragend', () => { dragId = null; clearHi(); });
  document.addEventListener('drop', e => {
    const col = colOf(e); clearHi(); if (!col || !dragId) return; e.preventDefault();
    const l = load(dragId), to = col.dataset.col; dragId = null; if (l.status === to) return;
    if (l.status === 'unassigned' && to === 'assigned') {   // dropping an open load on "Assigned" picks the best eligible driver + truck
      const ts = S.trucks.filter(t => t.zones.includes(l.zone)).sort((a, b) => a.cap - b.cap), ds = S.drivers.slice().sort((a, b) => a.rto - b.rto);
      for (const t of ts) for (const d of ds) if (!compat(l, d, t).length && !assign(l.id, d.id, t.id)) { return toast(T('Назначено: ', 'Zugewiesen: ', 'Assigned: ', 'Тағайындалды: ') + d.name + ' / ' + t.plate); }
      openDrawer({ type: 'load', id: l.id, tab: 'overview' }); return toast(T('Нет подходящей пары водитель + ТС — назначьте вручную', 'Kein passendes Paar Fahrer + Fahrzeug — manuell zuweisen', 'No eligible driver + truck pair — assign manually', 'Жарамды жұп жоқ — қолмен тағайындаңыз'), 'err');
    }
    const err = canMove(l, to); if (err) return toast(err, 'err');
    setStatus(l.id, to); render();
  });
})();
