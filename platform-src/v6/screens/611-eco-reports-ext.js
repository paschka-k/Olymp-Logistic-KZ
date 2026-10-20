/* P5 · Reports parity with 0.3.10 screen 15 (FR-64, FR-125, FR-07): six KPI tiles with 8-week bar sparklines
   (OTIF, temperature compliance, volume utilisation, empty running, cost per pallet from the ledger, incidents / 100 trips),
   the 30-day driver report and the report catalogue (6 groups × 4 reports, PDF / Excel demo exports, audited).
   The six tiles and the driver report are prepended / appended to the KPI tab of 610; the catalogue is a new tab. */
(function () {
  const nf = n => Math.round(n).toLocaleString('ru-RU');
  const f1 = (n, d = 1) => (LANG === 'en' ? n.toFixed(d) : n.toFixed(d).replace('.', ','));
  const tg = n => nf(n) + ' ₸';
  const X = S.eco = S.eco || {}; X.rep = { exports: [] };
  const csvText = rows => '﻿' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n');
  const dl = (name, text, mime) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; a.click(); };
  /* ---------- six KPI tiles (values of the 0.3.10 demo; cost per pallet = actuals register / delivered pallets when the ledger has data, FR-125) ---------- */
  globalThis.ecoRepKpis = () => {
    const dv = S.loads.filter(l => l.status === 'delivered'), pal = dv.reduce((s, l) => s + l.pallets, 0), cost = S.costs.reduce((s, c) => s + c.amount, 0);
    const perPal = pal ? cost / pal : null;
    const bars = (a, max) => a.map((v, i) => ({ v, h: Math.max(8, v / max * 100), last: i === a.length - 1 }));
    return [
      { k: 'otif', label: 'OTIF', value: '96,4 %', sub: T('цель SLA ≥ 95 % · 8 недель', 'Ziel SLA ≥ 95 % · 8 Wochen', 'SLA target ≥ 95 % · 8 weeks', 'SLA мақсаты ≥ 95 % · 8 апта'), bars: bars([93, 94, 95, 94, 96, 95, 97, 96], 100), cls: 'green' },
      { k: 'temp', label: T('Температурное соответствие', 'Temperatur-Compliance', 'Temperature compliance', 'Температуралық сәйкестік'), value: '99,6 %', sub: T('отправок без отклонений', 'Sendungen ohne Abweichung', 'shipments without excursion', 'ауытқусыз жөнелтімдер'), bars: bars([98, 99, 99, 98, 100, 99, 100, 99.6], 100), cls: 'purple' },
      { k: 'vol', label: T('Загрузка по объёму', 'Auslastung nach Volumen', 'Volume utilisation', 'Көлем бойынша жүктеме'), value: '81 %', sub: T('по весу — 37 %', 'nach Gewicht — 37 %', 'by weight — 37 %', 'салмақ бойынша — 37 %'), bars: bars([70, 74, 76, 79, 77, 80, 82, 81], 100), cls: 'blue' },
      { k: 'empty', label: T('Порожний пробег', 'Leerkilometer', 'Empty running', 'Бос жүріс'), value: '38 %', sub: T('цель < 30 % через догрузку', 'Ziel < 30 % durch Zuladung', 'target < 30 % via backhaul', 'мақсат < 30 %'), bars: bars([46, 45, 43, 42, 41, 40, 39, 38], 50), cls: 'yellow' },
      { k: 'pal', label: T('Стоимость паллеты', 'Kosten je Palette', 'Cost per pallet', 'Паллет құны'), value: perPal != null ? tg(perPal) : '18 400 ₸', sub: perPal != null ? T('факт месяца · реестр затрат / ', 'Ist des Monats · Kostenregister / ', 'actual of the month · actuals register / ', 'ай нақтысы · шығыс тізілімі / ') + pal + T(' паллет', ' Paletten', ' pallets', ' паллет') : T('в среднем по сети', 'Netzdurchschnitt', 'network average', 'желі бойынша орташа'), bars: bars([21, 20.5, 20, 19.6, 19.1, 18.9, 18.6, 18.4], 22), cls: 'orange', live: perPal != null },
      { k: 'inc', label: T('Инциденты на 100 рейсов', 'Vorfälle je 100 Touren', 'Incidents per 100 trips', '100 рейске оқиға'), value: '0,7', sub: T('безопасность и холодовая цепь', 'Sicherheit und Kühlkette', 'security and cold chain', 'қауіпсіздік және суық тізбек'), bars: bars([1.4, 1.2, 1.1, 1.0, 0.9, 0.9, 0.8, 0.7], 1.5), cls: 'red' },
    ];
  };
  const spark = b => `<span class="spark-bars" aria-hidden="true" data-chart style="display:inline-flex;gap:3px;align-items:flex-end;height:30px;margin-top:6px">${b.map(x => `<i title="${f1(x.v)}" style="display:block;width:9px;height:${Math.round(x.h / 100 * 30)}px;background:${x.last ? 'var(--primary)' : 'var(--chart-grid)'};border-radius:2px"></i>`).join('')}</span>`;
  const tiles = () => `<div class="kpi-row k6" data-rep-kpis>${ecoRepKpis().map(k => `<div class="kpi-tile tint ${k.cls}" data-rep-kpi="${k.k}"><div><div class="label">${esc(k.label)}</div><div class="value">${esc(k.value)}</div>${spark(k.bars)}${typeof chartTxt === 'function' ? chartTxt(k.label + ' · ' + T('8 недель: ', '8 Wochen: ', '8 weeks: ', '8 апта: ') + k.bars.map(x => f1(x.v)).join(' · '), true) : ''}<div class="delta">${esc(k.sub)}</div></div></div>`).join('')}</div>`;

  /* ---------- driver report · 30 days (trips, km, on time, excursions, driving events per driver; fines from the fine register) ---------- */
  const DREP = { d1: [11, 8420, 100, 0, 1], d2: [10, 7960, 90, 1, 2], d3: [12, 9120, 92, 0, 4], d4: [9, 6850, 100, 0, 0], d5: [13, 9880, 85, 2, 3], d6: [6, 4210, 100, 0, 1], d7: [10, 8030, 100, 0, 2] };
  globalThis.ecoDrvRep = () => S.drivers.filter(d => DREP[d.id]).map(d => {
    const r = DREP[d.id], fines = (X.fines || []).filter(f => (typeof ecoFineDriver === 'function' ? ecoFineDriver(f) : f.drv) === d.id), open = fines.filter(f => ['unpaid', 'recharge', 'ack', 'drvDisp'].includes(f.st));
    return { id: d.id, name: d.name, hub: d.hub, trips: r[0], km: r[1], ontime: r[2], temp: r[3], ev: r[4], fines, open: open.reduce((a, f) => a + f.amt, 0) };
  });
  const drvTable = () => `<div class="card tcard" data-drv-report><div class="card-body" style="padding-bottom:0"><h4 style="margin:0">${esc(T('Отчёт по водителям · 30 дней', 'Fahrerbericht · 30 Tage', 'Driver report · 30 days', 'Жүргізушілер есебі · 30 күн'))}</h4></div><table class="table"><thead><tr><th>${esc(T('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'))}</th><th>${esc(T('Хаб', 'Hub', 'Hub', 'Хаб'))}</th><th>${esc(T('Рейсы', 'Touren', 'Trips', 'Рейстер'))}</th><th>${esc(T('км', 'km', 'km', 'км'))}</th><th>${esc(T('Вовремя', 'Pünktlich', 'On time', 'Уақытында'))}</th><th>${esc(T('Темп. откл.', 'Temp.-Abw.', 'Temp. exc.', 'Темп. ауытқу'))}</th><th>${esc(T('События вождения', 'Fahrereignisse', 'Driving events', 'Жүргізу оқиғалары'))}</th><th>${esc(T('Штрафы', 'Bußgelder', 'Fines', 'Айыппұлдар'))}</th><th>${esc(T('Не закрыто', 'Offen', 'Open', 'Жабылмаған'))}</th></tr></thead><tbody>${ecoDrvRep().map(r => `<tr style="cursor:default" data-drvrep="${r.id}"><td><b>${esc(r.name)}</b></td><td>${esc(HUBS[r.hub].city)}</td><td>${r.trips}</td><td>${nf(r.km)}</td><td>${chip(r.ontime >= 95 ? 'green' : r.ontime >= 90 ? 'yellow' : 'red', r.ontime + ' %')}</td><td>${r.temp || '—'}</td><td>${r.ev}</td><td>${r.fines.length ? r.fines.length + ' · ' + tg(r.fines.reduce((a, f) => a + f.amt, 0)) : '—'}</td><td>${r.open ? chip('yellow', tg(r.open)) : chip('green', '—')}</td></tr>`).join('')}</tbody></table></div>`;

  /* wrap the KPI tab of 610: tiles first, then the original KPI table, then the driver report */
  const kpi = (SCREENS.reports.tabs || []).find(t => t.key === 'kpi');
  if (kpi) { const body0 = kpi.body; kpi.body = () => tiles() + body0() + drvTable(); }

  /* ---------- report catalogue: 6 groups × 4 reports, PDF / Excel (demo, audited) ---------- */
  const G = (id, name, items) => ({ id, name, items });
  globalThis.ECO_REP_GROUPS = [
    G('ops', T('Операции', 'Operationen', 'Operations', 'Операциялар'), [T('Ежедневный отчёт диспетчера', 'Täglicher Dispositionsbericht', 'Daily dispatch report', 'Күнделікті диспетчер есебі'), T('Выполнение рейсов и опоздания', 'Fahrtabschluss und Verspätungen', 'Trip completion and delays', 'Рейстердің орындалуы және кешігулер'), 'ePOD', T('Исключения и отклонения', 'Ausnahmen und Abweichungen', 'Exceptions and deviations', 'Ерекшеліктер мен ауытқулар')]),
    G('cold', T('Холодовая цепь', 'Kühlkette', 'Cold chain', 'Суық тізбек'), [T('Температурное соответствие', 'Temperatur-Compliance', 'Temperature compliance', 'Температуралық сәйкестік'), T('Температурные отклонения', 'Temperaturabweichungen', 'Temperature excursions', 'Температура ауытқулары'), T('История температуры по отправке', 'Temperaturverlauf je Sendung', 'Temperature history per shipment', 'Жөнелтім бойынша температура тарихы'), T('Калибровка датчиков', 'Sensorkalibrierung', 'Sensor calibration', 'Датчиктерді калибрлеу')]),
    G('sec', T('Безопасность', 'Sicherheit', 'Security', 'Қауіпсіздік'), [T('Инциденты', 'Vorfälle', 'Incidents', 'Оқиғалар'), T('Отклонения маршрута и геозоны', 'Routenabweichungen und Geofences', 'Route deviations and geofences', 'Маршрут ауытқулары мен геоаймақтар'), T('Безопасность вождения', 'Fahrsicherheit', 'Driving safety', 'Жүргізу қауіпсіздігі'), T('Соответствие ДОПОГ', 'ADR-Konformität', 'ADR compliance', 'ДОПОГ сәйкестігі')]),
    G('load', T('Загрузка и вес', 'Ladung und Gewicht', 'Load and weight', 'Жүктеме және салмақ'), [T('Загрузка по объёму и паллетам', 'Auslastung nach Volumen und Paletten', 'Utilisation by volume and pallets', 'Көлем мен паллет бойынша жүктеме'), T('Загрузка по весу', 'Auslastung nach Gewicht', 'Weight utilisation', 'Салмақ бойынша жүктеме'), T('Осевые нагрузки и перегрузы', 'Achslasten und Überladungen', 'Axle loads and overloads', 'Ось жүктемелері және артық жүк'), T('Взвешивание при отправке', 'Abfahrtsverwiegung', 'Departure weighing', 'Жөнелту кезіндегі өлшеу')]),
    G('fin', T('Финансы', 'Finanzen', 'Finance', 'Қаржы'), [T('Стоимость отправки / паллеты / км', 'Kosten je Sendung / Palette / km', 'Cost per shipment / pallet / km', 'Жөнелтім / паллет / км құны'), T('Расход топлива', 'Kraftstoffverbrauch', 'Fuel consumption', 'Отын шығыны'), T('Затраты на обслуживание', 'Wartungskosten', 'Maintenance costs', 'Қызмет көрсету шығындары'), T('OPEX и амортизация CAPEX', 'OPEX und CAPEX-Abschreibung', 'OPEX and CAPEX depreciation', 'OPEX және CAPEX амортизациясы')]),
    G('mgmt', T('Руководство KDL Olymp', 'Management KDL Olymp', 'KDL Olymp management', 'KDL Olymp басшылығы'), [T('OTIF и SLA', 'OTIF und SLA', 'OTIF and SLA', 'OTIF және SLA'), T('Влияние погоды на рейсы', 'Wettereinfluss auf Fahrten', 'Weather impact on trips', 'Ауа райының рейстерге әсері'), T('Порожние км и CO₂', 'Leerkilometer und CO₂', 'Empty km and CO₂', 'Бос км және CO₂'), T('Дашборд клиента', 'Kunden-Dashboard', 'Customer dashboard', 'Клиент дашборды')]),
  ];
  const FMT = { pdf: 'PDF', xlsx: 'Excel' };
  globalThis.ecoRepExport = (gid, i, fmt) => {
    const g = ECO_REP_GROUPS.find(x => x.id === gid); if (!g || !g.items[i] || !FMT[fmt]) return null;
    const name = g.items[i], rec = { id: 'RP-' + String(X.rep.exports.length + 1).padStart(3, '0'), group: g.name, name, fmt, t: fdt(NOW), by: S.role };
    X.rep.exports.unshift(rec);
    audit(T('Отчёты', 'Berichte', 'Reports', 'Есептер'), rec.id, T('Экспорт ', 'Export ', 'Export ', 'Экспорт ') + FMT[fmt], g.name + ' · ' + name);
    return rec;
  };
  Object.assign(ACT, {
    ecoRepExp: d => { const r = ecoRepExport(d.g, +d.i, d.v); if (!r) return; if (d.v === 'xlsx') dl(r.id + '.csv', csvText([['report', 'group', 'generated', 'by'], [r.name, r.group, r.t, r.by]]), 'text/csv'); toast(T('Отчёт «', 'Bericht „', 'Report “', '«') + r.name + T('» сформирован (демо) · ', '“ erstellt (Demo) · ', '” generated (demo) · ', '» есебі дайын (демо) · ') + FMT[d.v]); },
  });
  function catBody() {
    const groups = ECO_REP_GROUPS.map(g => `<div class="card card-body" data-rep-group="${g.id}"><h4 style="margin:0 0 8px">${esc(g.name)}</h4>${g.items.map((n, i) => `<div class="docrow valid"><span><b>${esc(n)}</b></span><span style="display:flex;gap:6px"><button class="btn sm grey" data-act="ecoRepExp" data-g="${g.id}" data-i="${i}" data-v="pdf">PDF</button><button class="btn sm grey" data-act="ecoRepExp" data-g="${g.id}" data-i="${i}" data-v="xlsx">Excel</button></span></div>`).join('')}</div>`).join('');
    const last = X.rep.exports.slice(0, 6).map(r => `<div class="sub">${esc(r.t)} · <b>${r.id}</b> · ${esc(r.name)} · ${FMT[r.fmt]} · ${esc(ROLE_NAME[r.by] || r.by)}</div>`).join('');
    return `<p class="note">${esc(T('Каталог отчётов 0.3.10 (экран 15): шесть групп по четыре отчёта. Кнопки PDF / Excel формируют демо-выгрузку, каждая выгрузка пишется в журнал аудита (кто, когда, какой отчёт). Данные отчётов — текущие значения макета.', 'Berichtskatalog 0.3.10 (Bildschirm 15): sechs Gruppen zu je vier Berichten. PDF / Excel erzeugen einen Demo-Export; jeder Export wird im Auditprotokoll festgehalten (wer, wann, welcher Bericht). Datenbasis sind die aktuellen Werte des Mock-ups.', 'Report catalogue of 0.3.10 (screen 15): six groups of four reports. PDF / Excel produce a demo export; every export is written to the audit log (who, when, which report). The data are the current values of the mock-up.', '0.3.10 есептер каталогы: төрт есептен тұратын алты топ. PDF / Excel — демо экспорт, әрқайсысы аудит журналына жазылады.'))}</p>
<div class="grid3" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px">${groups}</div>
<div class="card card-body" style="margin-top:16px" data-rep-exports><h4 style="margin:0 0 8px">${esc(T('Последние выгрузки', 'Letzte Exporte', 'Recent exports', 'Соңғы экспорттар'))} · ${X.rep.exports.length}</h4>${last || `<p class="note">${esc(T('Выгрузок ещё не было', 'Noch keine Exporte', 'No exports yet', 'Экспорт әлі жоқ'))}</p>`}</div>`;
  }
  addTab('reports', 'catalogue', T('Каталог', 'Katalog', 'Catalogue', 'Каталог'), catBody, { badge: () => X.rep.exports.length || '' });
})();
