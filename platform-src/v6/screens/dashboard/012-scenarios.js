/* FR-222 (R13) demo scenario presets: SCENARIOS + the pieces demoReset() uses (see shell/001-shell-ext.js). */
(function () {
  /* FR-222 (R13) demo scenario presets: a preset = a seed (the base data of mkLoads / mkHubs / mkJobs and the snapshot) plus a fixed set of edits,
     so the same preset always gives the same data. The weather, closure and cost stores that demoReset() leaves to the page reload are
     captured once (scBase) and restored before a preset is applied, so a preset never stacks on another one. */
  let scBase = null, scCur = 'normal';
  const scIso = (iso, h) => new Date(Date.parse(iso) + h * 3600e3 + 5 * 3600e3).toISOString().slice(0, 19) + '+05:00';
  const scLoad = id => S.loads.find(l => l.id === 'LD-2026-' + id);
  const scLate = (l, h, sc, why) => { l.eta = scIso(l.eta, h); l.notes.push({ who: 'System', t: '06:00', text: why, scen: sc }); };
  const scAlarm = (n, o) => S.alarms.unshift(Object.assign({ id: 'ALM-S' + n, lvl: 2, cat: 'temperature', src: 'wialon', hub: 'AST', load: null, truck: null, text: '', status: 'open', created: NOW.toISOString(), ackAt: null, ackBy: null, esc: [], step: 0, closed: null, key: 'scen:' + n }, o));
  const scCost = (n, text, amount, cat, hub) => S.costs.push({ id: 'C-S' + n, date: '2026-10-17', hub, text, amount, ref: '', cat });
  const scClose = (id, hub, route, note) => S.closures.push({ id, route, note, hub, lifted: null });
  const scNew = (from, to, zone, i) => { const q = (i * 7 + 3) % 5; return mkLoad(String(1900 + i), CUSTOMERS[i % CUSTOMERS.length].id, from, to, zone, 8 + q * 4, 2200 + q * 1900, ['high', 'medium', 'low'][i % 3], 'unassigned', scIso('2026-10-19T08:00:00+05:00', 4 + i * 3)); };
  const SCENARIOS = {
    normal: { id: 'normal', name: T('Обычный день', 'Normaler Tag', 'Normal day', 'Қарапайым күн'), sub: T('Данные демо по умолчанию', 'Standard-Demodaten', 'Default demo data', 'Әдепкі демо деректер'), apply: () => {} },
    storm: {
      id: 'storm', name: T('Зимняя буря', 'Wintersturm', 'Winter storm', 'Қысқы дауыл'), sub: T('Снег и гололёд на северо-западе: закрытия, задержки, тревоги по температуре, хабы в ограничении', 'Schnee und Glatteis im Nordwesten: Sperren, Verspätungen, Temperaturalarme, Hubs eingeschränkt', 'Snow and ice in the north-west: closures, delays, temperature alarms, hubs restricted', 'Солтүстік-батыста қар мен мұз: жабылулар, кешігулер, температура дабылдары, шектелген хабтар'),
      apply: () => {
        S.ops.scen.storm = true; S.ops.storm = ['KAR', 'AST'];
        scClose('RC-S1', 'KAR', T('Астана — Караганда, км 60–140', 'Astana — Karaganda, km 60–140', 'Astana — Karaganda, km 60–140', 'Астана — Қарағанды, км 60–140'), T('снег и гололёд · проезд колоннами', 'Schnee und Glatteis · Kolonnenfahrt', 'snow and ice · convoys only', 'қар мен мұз · колоннамен'));
        scClose('RC-S2', 'AST', T('Астана — Кокшетау, км 20–90', 'Astana — Kökschetau, km 20–90', 'Astana — Kokshetau, km 20–90', 'Астана — Көкшетау, км 20–90'), T('метель · движение закрыто', 'Schneesturm · gesperrt', 'blizzard · road closed', 'боран · жол жабық'));
        scClose('RC-S3', 'ATY', T('Атырау — Актобе', 'Atyrau — Aktobe', 'Atyrau — Aktobe', 'Атырау — Ақтөбе'), T('гололёд · ограничение скорости', 'Glatteis · Tempolimit', 'ice · speed limit', 'мұз · жылдамдық шектеуі'));
        S.loads.filter(l => isActive(l) && [l.from, l.to].some(h => h === 'AST' || h === 'KAR' || h === 'ATY')).forEach(l => scLate(l, 6, 'storm', T('Зимняя буря: задержка +6 ч', 'Wintersturm: Verspätung +6 h', 'Winter storm: delay +6 h', 'Қысқы дауыл: +6 сағ кешігу')));
        const a = scLoad('001847'), b = scLoad('001848'); a.temp = ZONES[a.zone].hi + 0.6; b.temp = ZONES[b.zone].hi - 0.4;
        scAlarm('03', { lvl: 2, cat: 'contact', src: 'wialon', hub: 'KAR', load: 'LD-2026-001850', truck: 't3', text: T('Нет связи с трекером, метель, трасса Астана – Караганда', 'Kein Trackerkontakt, Schneesturm, Strecke Astana – Karaganda', 'No tracker contact, blizzard, Astana – Karaganda highway', 'Трекермен байланыс жоқ, боран, Астана – Қарағанды трассасы') });
        scAlarm('02', { lvl: 2, hub: 'AST', load: b.id, truck: b.truck, text: T('Температура у верхней границы, задержка в метель', 'Temperatur nahe Obergrenze, Verspätung im Schneesturm', 'Temperature near the upper limit, delay in the blizzard', 'Температура жоғарғы шекке жақын, боранда кешігу') });
        scAlarm('01', { lvl: 3, src: 'reefer', hub: 'AST', load: a.id, truck: a.truck, text: T('Температура выше нормы: рефагрегат не держит режим при −25 °C', 'Temperatur zu hoch: Kühlaggregat hält bei −25 °C nicht', 'Temperature too high: the unit fails at −25 °C', 'Температура жоғары: агрегат −25 °C кезінде ұстамайды') });
        S.hubs.AST.blocked = [1, 2]; S.hubs.KAR.blocked = [1]; S.hubs.ATY.maint = true;
        scCost('1', T('Противогололёдная обработка и сопровождение', 'Enteisung und Begleitung', 'De-icing and escort', 'Мұзға қарсы өңдеу және алып жүру'), 640000, 'service', 'AST'); scCost('2', T('Дизель: прогрев агрегатов и простой в пути', 'Diesel: Aggregat-Vorwärmung und Standzeit', 'Diesel: unit pre-heating and idling', 'Дизель: агрегатты қыздыру және тұрып қалу'), 520000, 'fuel', 'KAR'); scCost('3', T('Простой на хабах (Standgeld)', 'Standgeld an den Hubs', 'Hub waiting charges', 'Хабтағы тұрып қалу'), 380000, 'service', 'AST');
      },
    },
    peak: {
      id: 'peak', name: T('Пик сезона', 'Hochsaison', 'Peak season', 'Маусым шыңы'), sub: T('Заявок и нагрузки хабов в 2–3 раза больше, дефицит ТС и водителей, очереди на рампах', '2–3-faches Auftrags- und Hub-Volumen, Mangel an Fahrzeugen und Fahrern, Rampenschlangen', '2–3x orders and hub load, truck and driver shortage, ramp queues', 'Өтінімдер мен хаб жүктемесі 2–3 есе, КҚ мен жүргізуші тапшылығы, рампадағы кезектер'),
      apply: () => {
        S.ops.scen.peak = true;
        const R = [['AST', 'ALA', 'pharma'], ['ALA', 'AST', 'chilled'], ['KAR', 'SHY', 'frozen'], ['SHY', 'KAR', 'ambient'], ['AST', 'KAR', 'chilled'], ['ALA', 'SHY', 'pharma']];
        for (let i = 0; i < 12; i++) S.loads.push(scNew(R[i % R.length][0], R[i % R.length][1], R[i % R.length][2], i));
        Object.keys(S.hubs).forEach(h => { const x = S.hubs[h]; Object.keys(x.places).forEach(z => { x.places[z][1] = Math.min(x.places[z][0], Math.round(x.places[z][1] * 1.7 + x.places[z][0] * 0.15)); }); x.io = x.io.map(v => Math.round(v * 2.5)); x.done = x.done.map(v => Math.round(v * 2.5)); });
        S.trucks.forEach(x => { if (x.status === 'available' && x.id !== 't1') x.status = 'busy'; }); S.drivers.forEach(d => { if (d.status === 'available' && d.id !== 'd1') d.status = 'busy'; });
        [['AST', 'ambient', 840], ['AST', 'chilled', 860], ['ALA', 'pharma', 870], ['ALA', 'frozen', 900], ['SHY', 'ambient', 920]].forEach((q, i) => S.jobs.push(mkJob('069' + (i + 1), q[0], q[1], { plate: (500 + i * 11) + ' PKS 0' + (i + 1), veh: 'Reefer 12 t', carrier: nm('ТОО «Центр Транзит»'), senders: [nm('ТОО «СеверПродукт»')], win: [q[2], q[2] + 30], pallets: 24 + i * 2, ev: { ci: q[2] - 20, rp: null, st: null, en: null } })));
        scAlarm('02', { lvl: 2, cat: 'stop', hub: 'AST', text: T('Очередь на рампах: 5 ТС ждут разгрузки', 'Rampenschlange: 5 Fahrzeuge warten auf Entladung', 'Ramp queue: 5 trucks waiting to unload', 'Рампадағы кезек: 5 КҚ түсіруді күтуде') });
        scAlarm('01', { lvl: 2, cat: 'power', src: 'driver', hub: 'ALA', text: T('Дефицит: свободен 1 водитель и 1 ТС на 12 новых рейсов', 'Engpass: 1 Fahrer und 1 Fahrzeug frei für 12 neue Fahrten', 'Shortage: 1 driver and 1 truck free for 12 new trips', 'Тапшылық: 12 жаңа рейске 1 жүргізуші мен 1 КҚ бос') });
        scCost('1', T('Сверхурочные водителей и грузчиков', 'Überstunden Fahrer und Lader', 'Driver and loader overtime', 'Жүргізушілер мен жүк тиеушілердің қосымша сағаттары'), 1250000, 'service', 'AST'); scCost('2', T('Привлечённые ТС партнёров', 'Zugekaufte Partnerfahrzeuge', 'Hired partner trucks', 'Тартылған серіктес КҚ'), 2800000, 'service', 'ALA'); scCost('3', T('Простой на рампах (Standgeld)', 'Standgeld an den Rampen', 'Ramp waiting charges', 'Рампадағы тұрып қалу'), 540000, 'service', 'AST');
      },
    },
    west: {
      id: 'west', name: T('Западный маршрут', 'Westroute', 'West route', 'Батыс бағыты'), sub: T('Рейсы и точки сбора запада, погода и тревоги по западным коридорам, остальные регионы спокойны', 'Fahrten und Sammelpunkte im Westen, Wetter und Alarme auf den Westkorridoren, übrige Regionen ruhig', 'West trips and collection points, weather and alarms on the western corridors, other regions calm', 'Батыс рейстері мен жинау нүктелері, батыс дәліздеріндегі ауа райы мен дабылдар, қалған өңірлер тыныш'),
      apply: () => {
        S.ops.scen.west = true; S.ops.storm = ['ATY'];
        S.closures.forEach(c => { c.lifted = { by: T('Сценарий «Западный маршрут»', 'Szenario „Westroute“', 'Scenario “West route”', '«Батыс бағыты» сценарийі'), at: '06:00' }; });
        scClose('RC-W1', 'ATY', T('Атырау — Актобе, км 140–230', 'Atyrau — Aktobe, km 140–230', 'Atyrau — Aktobe, km 140–230', 'Атырау — Ақтөбе, км 140–230'), T('ветер 23 м/с · ограничение для рефрижераторов', 'Wind 23 m/s · Beschränkung für Kühlfahrzeuge', 'wind 23 m/s · reefer restriction', 'жел 23 м/с · рефрижераторларға шектеу'));
        scClose('RC-W2', 'ATY', T('Атырау — Кульсары', 'Atyrau — Kulsary', 'Atyrau — Kulsary', 'Атырау — Құлсары'), T('заносы · проезд по согласованию', 'Verwehungen · Durchfahrt nach Absprache', 'drifts · passage by arrangement', 'жолды басу · келісіммен өту'));
        const R = [['ATY', 'AST', 'pharma'], ['AST', 'ATY', 'chilled'], ['ATY', 'KAR', 'ambient'], ['ATY', 'AST', 'frozen'], ['KAR', 'ATY', 'chilled'], ['AST', 'ATY', 'pharma']];
        R.forEach((r, i) => S.loads.push(scNew(r[0], r[1], r[2], i)));
        const w = scLoad('001856'); scLate(w, 3, 'west', T('Западный коридор: задержка +3 ч', 'Westkorridor: Verspätung +3 h', 'West corridor: delay +3 h', 'Батыс дәлізі: +3 сағ кешігу'));
        S.hubs.ATY.io = S.hubs.ATY.io.map(v => v * 2); S.hubs.ATY.done = S.hubs.ATY.done.map(v => v * 2); Object.keys(S.hubs.ATY.places).forEach(z => { const p = S.hubs.ATY.places[z]; p[1] = Math.min(p[0], Math.round(p[1] * 1.6)); });
        scAlarm('02', { lvl: 2, cat: 'geofence', hub: 'ATY', load: w.id, truck: w.truck, text: T('Отклонение от маршрута: объезд по западному коридору', 'Routenabweichung: Umfahrung im Westkorridor', 'Route deviation: detour on the west corridor', 'Маршруттан ауытқу: батыс дәлізі бойынша айналма жол') });
        scAlarm('01', { lvl: 2, cat: 'contact', hub: 'ATY', load: w.id, truck: w.truck, text: T('Нет связи с трекером, зона без покрытия Атырау – Актобе', 'Kein Trackerkontakt, Funkloch Atyrau – Aktobe', 'No tracker contact, no coverage on Atyrau – Aktobe', 'Трекермен байланыс жоқ, Атырау – Ақтөбе қамту жоқ аймақ') });
        scCost('1', T('Топливо: западный коридор', 'Kraftstoff: Westkorridor', 'Fuel: west corridor', 'Отын: батыс дәлізі'), 960000, 'fuel', 'ATY'); scCost('2', T('Сопровождение колонны', 'Kolonnenbegleitung', 'Convoy escort', 'Колоннаны алып жүру'), 450000, 'service', 'ATY');
      },
    },
  };
  const scReset = () => { if (!scBase) return; S.closures = JSON.parse(scBase.closures); S.costs = JSON.parse(scBase.costs); S.ops.scen = Object.assign({}, scBase.scen); S.ops.storm = scBase.storm.slice(); };
  const scApply = id => { scReset(); SCENARIOS[id].apply(); scCur = id; };
  /* demoReset() (shell/001-shell-ext.js) keeps the stores it leaves to the page reload through these: capture once the screens have run,
     apply = restore + preset edits; the picker is the select on the account page */
  const picker = pick => { const cur = SCENARIOS[pick] ? pick : scCur; return `<label class="fl">${esc(T('Сценарий демо', 'Demo-Szenario', 'Demo scenario', 'Демо сценарийі'))}<select class="inp" id="scenSel" data-scenario>${Object.keys(SCENARIOS).map(k => `<option value="${k}"${cur === k ? ' selected' : ''}>${esc(SCENARIOS[k].name)}</option>`).join('')}</select></label><p class="note" data-scenario-sub>${esc(SCENARIOS[cur].sub)}</p>`; };
  Object.assign(globalThis, { SCENARIOS, scenarioApply: scApply, scenarioCurrent: () => scCur, scenarioPicker: picker, scenarioCapture: () => { S.ops.scen.west = false; scBase = { closures: JSON.stringify(S.closures), costs: JSON.stringify(S.costs), scen: Object.assign({}, S.ops.scen), storm: S.ops.storm.slice() }; } });
})();
