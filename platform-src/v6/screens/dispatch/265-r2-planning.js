/* R2 · Planning parity with 0.3.9 screen 14 (Dispatch → Planning, FR-119): extends the 7-day capacity view of 240-ops-dispatch.js
   without editing it — wraps the Planning tab body after 240/260 registered it.
   P7 row "Weather / road risk" per day · P8 recommendation kinds (shortfall with affected trips, drivers, weather, scenario texts,
   "capacity sufficient") · P9 shortfall action buttons · P10 "Planning factors" card · P5 service note in "Trucks available" ·
   P6 drivers row amber when drivers < trucks + 1. */
(function () {
  const pt = SCREENS.dispatch && (SCREENS.dispatch.tabs || []).find(t => t.key === 'planning');
  if (!pt || typeof planCapacity !== 'function') return;
  const css = document.createElement('style');
  css.textContent = `.pl-pf{display:grid;grid-template-columns:minmax(120px,190px) minmax(0,1fr);gap:4px 12px;font-size:13px}.pl-pf b{font-weight:600}.pl-pf span{color:var(--text-muted)}.pl-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}`;
  document.head.appendChild(css);
  const PAL = T('пал.', 'Pal.', 'pal.', 'пал.');
  const DAYN = [T('Вс', 'So', 'Sun', 'Жс'), T('Пн', 'Mo', 'Mon', 'Дс'), T('Вт', 'Di', 'Tue', 'Сс'), T('Ср', 'Mi', 'Wed', 'Ср'), T('Чт', 'Do', 'Thu', 'Бс'), T('Пт', 'Fr', 'Fri', 'Жм'), T('Сб', 'Sa', 'Sat', 'Сб')];
  const dl = d => DAYN[new Date(d + 'T12:00:00+05:00').getDay()] + ' ' + d.slice(8) + '.' + d.slice(5, 7);
  const LV = [T('нет', 'keins', 'none', 'жоқ'), T('низкий', 'niedrig', 'low', 'төмен'), T('средний', 'mittel', 'medium', 'орташа'), T('высокий', 'hoch', 'high', 'жоғары')];
  const LVC = ['ok', 'warn', 'warn', 'crit'];
  const MAIN = ['AST', 'KAR', 'ALA', 'SHY'];
  const loadsOn = d => S.loads.filter(l => l.status !== 'delivered' && l.eta.slice(0, 10) === d);
  const city = h => (globalThis.WEATHER && WEATHER.cityName ? WEATHER.cityName(h) : (HUBS[h] || {}).city || h);
  /* P7: weather / road risk of a day = worst forecast level (150-monitor WEATHER.risk 0…3) on the hubs used by that day's loads
     (no loads → the four main hubs); an active road closure on such a hub raises days 0–1 to ≥ 2; the blizzard scenario sets days 2–3 to 3 */
  function wxDay(d, i) {
    const ls = loadsOn(d), hubs = ls.length ? Array.from(new Set([].concat(...ls.map(l => [l.from, l.to])))) : MAIN.slice();
    const W = globalThis.WEATHER, lv = {};
    hubs.forEach(h => { const c = W && W.WX[h] && W.WX[h][i]; lv[h] = c ? W.risk(c) : 0; if (i <= 1 && (S.closures || []).some(x => !x.lifted && x.hub === h)) lv[h] = Math.max(lv[h], 2); });
    let lvl = Math.max(0, ...hubs.map(h => lv[h])), cities = hubs.filter(h => lvl > 0 && lv[h] === lvl);
    if (S.ops.scen.storm && (i === 2 || i === 3)) { lvl = 3; cities = Array.from(new Set(cities.concat(['KAR', 'AST']))); }
    const trips = ls.filter(l => cities.includes(l.from) || cities.includes(l.to)).map(l => l.id);
    return { lvl, cities, trips };
  }
  globalThis.planWx = (i) => { const d = planCapacity(false)[i].d; return wxDay(d, i); };
  /* P5: trucks with an open service request on that day (request created on / before the day, ETA on / after it) */
  const downOn = d => S.trucks.filter(t => (S.res && S.res.svc || []).some(s => s.truck === t.id && !['done', 'cancelled'].includes(s.status) && (s.created || '').slice(0, 10) <= d && (!s.eta || s.eta.slice(0, 10) >= d)));
  globalThis.planDown = downOn;
  /* P8: recommendation texts */
  function recs(rows) {
    const out = [], short = rows.filter(r => r.pct > 100);
    short.forEach(r => { const ids = loadsOn(r.d).map(l => l.id); out.push(['shortfall', dl(r.d) + ': ' + T('дефицит ', 'Defizit ', 'shortfall ', 'тапшылық ') + Math.max(0, r.dem - r.cap) + ' ' + PAL + ' — ' + T('затронуты: ', 'betroffen: ', 'affected: ', 'әсер етеді: ') + (ids.join(', ') || T('без рейсов', 'ohne Fahrten', 'no trips', 'рейссіз')) + T('. Действия: запрос передачи партнёру · внешний перевозчик (сравнить в «Затраты») · экспресс-решение.', '. Maßnahmen: Übergabeanfrage an Partner · externer Frachtführer (in „Kosten“ vergleichen) · Express-Entscheidung.', '. Actions: handover request to a partner · external carrier (compare in “Costs”) · express decision.', '. Әрекеттер: серіктеске беру сұрауы · сыртқы тасымалдаушы («Шығындарда» салыстыру) · экспресс шешім.')]); });
    rows.forEach(r => { const need = Math.ceil(r.dem / 33); if (r.drivers < need) out.push(['drivers', dl(r.d) + ': ' + T('водителей ', 'Fahrer ', 'drivers ', 'жүргізушілер ') + r.drivers + T(' при потребности ', ' bei Bedarf ', ' for a need of ', ' қажеттілік ') + need + T(' — резерв / субподряд.', ' — Reserve / Subunternehmer.', ' — reserve / subcontractor.', ' — резерв / қосалқы мердігер.')]); });
    rows.forEach(r => { const w = wxDay(r.d, r.i); if (w.lvl >= 2) out.push(['weather', dl(r.d) + ': ' + T('погодный риск ', 'Wetterrisiko ', 'weather risk ', 'ауа райы тәуекелі ') + LV[w.lvl] + ' (' + w.cities.map(city).join(', ') + ')' + (w.trips.length ? T(' — рейсы ', ' — Fahrten ', ' — trips ', ' — рейстер ') + w.trips.join(', ') : '')]); });
    const sc = S.ops.scen;
    if (sc.storm) out.push(['scen', T('Буран на западе: западный рейс перенести на следующий рабочий день, филиалам Костанай и Актобе — запас на 2 дня.', 'Buran im Westen: die Westtour auf den nächsten Arbeitstag verschieben, Filialen Kostanay und Aktobe — Vorrat für 2 Tage.', 'Blizzard in the west: move the western trip to the next working day, branches Kostanay and Aktobe — 2 days of stock.', 'Батыста боран: батыс рейсін келесі жұмыс күніне ауыстыру, Қостанай мен Ақтөбе филиалдарына — 2 күндік қор.')]);
    if (sc.repair) out.push(['scen', T('123 ABC 01 в ремонте: магистраль выполняет следующий свободный рефрижератор, западный рейс сдвигается.', '123 ABC 01 in Reparatur: den Hauptlauf übernimmt das nächste freie Kühlfahrzeug, die Westtour verschiebt sich.', '123 ABC 01 in repair: trunk run taken by the next free reefer, the western trip shifts.', '123 ABC 01 жөндеуде: магистральды келесі бос рефрижератор орындайды, батыс рейсі жылжиды.')]);
    if (sc.peak) out.push(['scen', T('Пик +30 %: объединить Кокшетау и Петропавловск в один рейс, догрузить обратные плечи (P85, P91).', 'Spitze +30 %: Kokshetau und Petropavl zu einer Tour bündeln, Rückfahrten beladen (P85, P91).', 'Peak +30 %: merge Kokshetau and Petropavl into one trip, fill backhauls (P85, P91).', 'Шың +30 %: Көкшетау мен Петропавлды бір рейске біріктіру, кері иықтарды толтыру (P85, P91).')]);
    if (!short.length) out.push(['ok', T('Мощности достаточно на 7 дней. Резерв — ', 'Kapazität reicht für 7 Tage. Reserve — ', 'Capacity sufficient for 7 days. Reserve — ', 'Қуат 7 күнге жеткілікті. Резерв — ') + Math.max(0, Math.min(...rows.map(r => r.cap - r.dem))) + ' ' + PAL]);
    return out;
  }
  globalThis.planRecs = () => recs(planCapacity(S.ops.target));
  const PF = [
    [T('Прогноз спроса', 'Bedarfsprognose', 'Demand forecast', 'Сұраныс болжамы'), T('заказы ERP; сезонность слабая, пик ≤ 1,2× (A3)', 'ERP-Aufträge; schwache Saisonalität, Spitze ≤ 1,2× (A3)', 'ERP orders; weak seasonality, peak ≤ 1.2× (A3)', 'ERP тапсырыстары; маусымдылық әлсіз, шың ≤ 1,2× (A3)')],
    [T('Балансировка хабов', 'Hub-Ausgleich', 'Hub balancing', 'Хабтарды теңгеру'), T('R1 Астана – Караганда – Алматы 1× в неделю; обратное плечо в 2,6× тяжелее (R121/B9)', 'R1 Astana – Karaganda – Almaty 1× pro Woche; Rückleg 2,6× schwerer (R121/B9)', 'R1 Astana – Karaganda – Almaty once a week; return leg 2.6× heavier (R121/B9)', 'R1 Астана – Қарағанды – Алматы аптасына 1×; кері иық 2,6× ауыр (R121/B9)')],
    [T('Окна приёмки', 'Annahmefenster', 'Receiving windows', 'Қабылдау терезелері'), T('склады 9:00–17:00, приёмка со считыванием термохрона (F22)', 'Lager 9–17 Uhr, Annahme mit Thermochron-Auslesung (F22)', 'warehouses 9:00–17:00, receipt with thermochron reading (F22)', 'қоймалар 9:00–17:00, термохронды оқумен қабылдау (F22)')],
    [T('Режим труда', 'Arbeitszeit', 'Working time', 'Еңбек режимі'), T('4,5 ч + 45 мин, смена ~9 ч, отдых ≥ 11 ч, 6 дней, вс — ТО (E20/J51)', '4,5 h + 45 min, Schicht ~9 h, Ruhe ≥ 11 h, 6 Tage, So Wartung (E20/J51)', '4.5 h + 45 min, shift ~9 h, rest ≥ 11 h, 6 days, Sunday maintenance (E20/J51)', '4,5 сағ + 45 мин, ауысым ~9 сағ, демалыс ≥ 11 сағ, 6 күн, жексенбі — ТҚ (E20/J51)')],
    [T('Техобслуживание', 'Wartung', 'Maintenance', 'Техникалық қызмет'), T('ТО-1 каждые 15 000 км, ТО-2 каждые 45 000 км; КТГ ≥ 0,92 (I45/O80)', 'TO-1 alle 15 000 km, TO-2 alle 45 000 km; Bereitschaft ≥ 0,92 (I45/O80)', 'TO-1 every 15,000 km, TO-2 every 45,000 km; availability ≥ 0.92 (I45/O80)', 'ТҚ-1 әр 15 000 км, ТҚ-2 әр 45 000 км; дайындық ≥ 0,92 (I45/O80)')],
    [T('Субподряд', 'Subunternehmer', 'Subcontracting', 'Қосалқы мердігерлік'), T('GarantA и KazExpress — резерв; KazGen — −20 °C; SpezAvto — Жезказган (E18/C11/P92)', 'GarantA und KazExpress — Reserve; KazGen — −20 °C; SpezAvto — Zhezkazgan (E18/C11/P92)', 'GarantA and KazExpress — fallback; KazGen — −20 °C; SpezAvto — Zhezkazgan (E18/C11/P92)', 'GarantA және KazExpress — резерв; KazGen — −20 °C; SpezAvto — Жезқазған (E18/C11/P92)')],
    [T('Ограничения дорог', 'Straßenbeschränkungen', 'Road restrictions', 'Жол шектеулері'), T('зимние закрытия — KazAvtoZhol; при −45 °C движение запрещено (B7/E19)', 'Wintersperrungen — KazAvtoZhol; bei −45 °C Fahrverbot (B7/E19)', 'winter closures — KazAvtoZhol; no driving at −45 °C (B7/E19)', 'қысқы жабылулар — KazAvtoZhol; −45 °C кезінде қозғалысқа тыйым (B7/E19)')]];
  globalThis.PLAN_FACTORS = PF;
  /* index of the </div> closing the <div …> that starts at `from` */
  const closeOf = (h, from) => { const re = /<div\b|<\/div>/g; re.lastIndex = from; let depth = 0, m; while ((m = re.exec(h))) { depth += m[0] === '</div>' ? -1 : 1; if (!depth) return m.index; } return -1; };
  function extend(html) {
    const t0 = html.indexOf('<div class="pl-tbl">'); if (t0 < 0) return html;
    const t1 = closeOf(html, t0); if (t1 < 0) return html;
    const target = !!S.ops.target, rows = planCapacity(target);
    let tbl = html.slice(t0, t1), n = 0;
    /* P5 / P6: the capacity cells come in row order demand · trucks · drivers · capacity · utilisation (7 each) */
    tbl = tbl.replace(/<div class="c ([^"]*)" data-day="([^"]+)">([^<]*)<\/div>/g, (m, cls, d, v) => {
      const row = Math.floor(n / 7), r = rows[n % 7]; n++;
      if (row === 1 && !target && r) { const dn = downOn(d); if (dn.length) return `<div class="c ${cls}" data-day="${d}" data-svc-note="${dn.length}">${v}<br><small>${esc(T('сервис ', 'Service ', 'service ', 'сервис '))}${dn.map(t => esc(t.plate)).join(', ')}</small></div>`; }
      if (row === 2 && r && r.drivers < r.trucks + 1) return `<div class="c warn" data-day="${d}" data-drv-warn="1">${v}</div>`;
      return m;
    });
    const wxRow = `<div class="l" data-wx-row="1">${esc(T('Погодный / дорожный риск', 'Wetter- / Straßenrisiko', 'Weather / road risk', 'Ауа райы / жол тәуекелі'))}</div>` + rows.map(r => { const w = wxDay(r.d, r.i); return `<div class="c ${LVC[w.lvl]}" data-wx-day="${r.d}" data-wx-lvl="${w.lvl}"${w.cities.length ? ` title="${esc(w.cities.map(city).join(', '))}"` : ''}>${esc(LV[w.lvl])}</div>`; }).join('');
    html = html.slice(0, t0) + tbl + wxRow + html.slice(t1);
    /* P8 / P9: recommendations replace the shortfall-only list of 240; buttons only for trips:write */
    const rc = recs(rows), short = rows.some(r => r.pct > 100);
    const acts = short && canDo('trips:write') ? `<div class="pl-acts" data-plan-actions="1"><button class="btn sm" data-act="r2PlGo" data-v="partners">${esc(T('Запрос передачи партнёру', 'Übergabeanfrage an Partner', 'Handover request to a partner', 'Серіктеске беру сұрауы'))}</button><button class="btn sm" data-act="r2PlGo" data-v="cost">${esc(T('Внешний перевозчик · сравнение затрат', 'Externer Frachtführer · Kostenvergleich', 'External carrier · cost check', 'Сыртқы тасымалдаушы · шығындарды салыстыру'))}</button><button class="btn sm" data-act="r2PlGo" data-v="express">${esc(T('Экспресс-решение', 'Express-Entscheidung', 'Express decision', 'Экспресс шешім'))}</button></div>` : '';
    html = html.replace(/(<ul class="note"[^>]*data-plan-recs="\d+">)[\s\S]*?<\/ul>/, (m, open) => open + rc.map(x => `<li data-plan-rec="${x[0]}">${esc(x[1])}</li>`).join('') + '</ul>' + acts);
    /* P10: planning factors card (0.3.9 BL_PF) */
    const pf = `<div class="card lw-card" style="margin-top:16px" data-plan-factors="1"><h3 class="lw-h" style="margin-top:0">${esc(T('Факторы планирования', 'Planungsfaktoren', 'Planning factors', 'Жоспарлау факторлары'))}</h3><div class="pl-pf">${PF.map((f, i) => `<b data-pf="${i}">${esc(f[0])}</b><span>${esc(f[1])}</span>`).join('')}</div></div>`;
    const g0 = html.indexOf('<div class="grid2 eq" style="margin-top:12px">');
    if (g0 >= 0) { const card0 = html.lastIndexOf('<div class="card lw-card"', g0), card1 = card0 >= 0 ? closeOf(html, card0) : -1; if (card1 > g0) return html.slice(0, card1 + 6) + pf + html.slice(card1 + 6); }
    return html + pf;
  }
  const b0 = pt.body; pt.body = () => extend(b0());
  Object.assign(ACT, {
    r2PlGo: d => { if (!canDo('trips:write')) return toast(T('Нет права trips:write', 'Kein Recht trips:write', 'No permission trips:write', 'trips:write құқығы жоқ'), 'err');
      if (d.v === 'cost') { go('billing'); S.tab.billing = 'model'; } else { go('dispatch'); S.tab.dispatch = d.v === 'partners' ? 'partners' : 'express'; } render(); },
  });
})();
