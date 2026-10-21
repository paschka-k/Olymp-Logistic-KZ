/* Help · animated Schaubilder (port of the 0.3.9 help overlays): a diagram that plays through its steps — ‹ ▶/⏸ › controls,
   "step n of m", the active node highlighted, the step text under the picture, "all steps" as a list. Since Q1 they run on the figure
   kit of 60-visuals.js (HELP.fig; since 6.4.1 also drawn with its Box / Diamond / Arrow, so labels wrap inside their boxes): auto-advance every 4 s only while visible; prefers-reduced-motion starts paused; state S.hv['pl:<id>'].
   HELP.players[id] = {title, steps[{t}], view, draw(i)}; rendered through HELP.visuals['pl:<id>'] so articles attach a player like any visual. */
(function () {
  HELP.players = {};

  /* ---------- the Q1 figure kit (60-visuals.js): boxes wrap their text, tones and arrows follow the design tokens ---------- */
  const { Box, Diamond, Arrow, Tag, Txt } = HELP.kit;
  const num = (x, y, k, on) => `<g class="pl-num${on ? ' pl-on' : ''}"><circle cx="${x}" cy="${y}" r="14"/><text x="${x}" y="${y + 5}" text-anchor="middle">${k + 1}</text></g>`;

  /* ---------- player 1: shipment lifecycle (0.3.9 "Sendungsablauf von Anfang bis Ende") ---------- */
  const SF = [
    { l: T('Бронирование', 'Buchung', 'Booking', 'Брондау'), s: T('портал · «Бронирования»', 'Portal · „Buchungen“', 'portal · "Bookings"', 'портал · «Брондау»'), t: T('Заявка клиента приходит из портала на стол бронирований (Заказы и рейсы → Бронирования); диспетчер подтверждает её, и появляется заказ.', 'Die Kundenanfrage kommt aus dem Portal auf den Buchungstisch (Aufträge & Fahrten → Buchungen); die Disposition bestätigt sie, und ein Auftrag entsteht.', 'The customer request arrives from the portal at the booking desk (Orders & Loads → Bookings); the dispatcher confirms it and an order is created.', 'Клиент өтінімі порталдан брондау үстеліне келеді; диспетчер растайды және тапсырыс пайда болады.') },
    { l: T('Планирование', 'Planung', 'Planning', 'Жоспарлау'), s: T('Диспетчерская · Планирование', 'Dispo · Planung', 'Dispatch · Planning', 'Диспетчерлік · Жоспарлау'), t: T('Заказ попадает на рейс линии: ТС, водитель, отправление. Подбор ТС проверяет зоны, вес, объём, оси и ДОПОГ.', 'Der Auftrag kommt auf eine Fahrt der Linie: Fahrzeug, Fahrer, Abfahrt. Die Fahrzeugwahl prüft Zonen, Gewicht, Volumen, Achsen und ADR.', 'The order joins a line trip: vehicle, driver, departure. The truck finder checks zones, weight, volume, axles and ADR.', 'Тапсырыс желі рейсіне қосылады: КҚ, жүргізуші, жөнелту. Таңдау аймақтарды, салмақты, осьтерді тексереді.') },
    { l: T('Погрузка', 'Beladung', 'Loading', 'Тиеу'), s: T('Загрузка и вес · SSCC', 'Beladung & Gewicht · SSCC', 'Load & weight · SSCC', 'Тиеу және салмақ · SSCC'), t: T('Склад грузит по листу LIFO, сканирует места SSCC, взвешивает ТС; сверка мест и перегруз блокируют выпуск.', 'Das Lager lädt nach LIFO-Liste, scannt SSCC-Packstücke, verwiegt das Fahrzeug; Abgleich und Überladung sperren die Freigabe.', 'The warehouse loads by the LIFO sheet, scans SSCC places and weighs the truck; reconciliation and overload block the release.', 'Қойма LIFO парағымен тиейді, SSCC сканерлейді, КҚ өлшейді; сәйкессіздік шығаруды бұғаттайды.') },
    { l: T('Выпуск Go/No-Go', 'Freigabe Go/No-Go', 'Go/No-Go release', 'Go/No-Go шығару'), s: T('Документы KZ', 'KZ-Dokumente', 'KZ documents', 'KZ құжаттары'), t: T('Гейт Go/No-Go: документы (ТТН, СНТ), сверка SSCC, взвешивание, водитель и ТС. No-Go возвращает рейс на погрузку.', 'Das Go/No-Go-Gate: Dokumente (TTN, SNT), SSCC-Abgleich, Verwiegung, Fahrer und Fahrzeug. No-Go schickt die Fahrt zurück zur Beladung.', 'The Go/No-Go gate: documents (TTN, SNT), SSCC reconciliation, weighing, driver and vehicle. No-Go sends the trip back to loading.', 'Go/No-Go қақпасы: құжаттар, SSCC, өлшеу, жүргізуші мен КҚ. No-Go рейсті тиеуге қайтарады.') },
    { l: T('В пути: контроль', 'Unterwegs: Überwachung', 'In transit: monitoring', 'Жолда: бақылау'), s: T('Термо · Погода · Связь', 'Thermo · Wetter · Netz', 'Thermo · Weather · Coverage', 'Термо · Ауа райы · Байланыс'), t: T('Маршруты и трекинг: температура камер, погодные риски, мёртвые зоны связи и SMS-канал OL1, эскалация тревог L1–L3.', 'Routen & Tracking: Kammertemperaturen, Wetterrisiken, Funklöcher mit SMS-Kanal OL1, Alarm-Eskalation L1–L3.', 'Routes & Tracking: chamber temperatures, weather risks, coverage dead zones with the OL1 SMS channel, alarm escalation L1–L3.', 'Маршруттар мен трекинг: температура, ауа райы, байланыс аймақтары, L1–L3 дабыл эскалациясы.') },
    { l: T('Доставка · ePOD', 'Zustellung · ePOD', 'Delivery · ePOD', 'Жеткізу · ePOD'), s: T('Приложение водителя', 'Fahrer-App', 'Driver app', 'Жүргізуші қосымшасы'), t: T('Водитель сдаёт места по сканам, получает подпись и фото — ePOD уходит в очередь подтверждения доставки.', 'Der Fahrer übergibt die Packstücke per Scan, nimmt Unterschrift und Foto — das ePOD geht in die Bestätigungs-Warteschlange.', 'The driver hands over places by scan, captures signature and photo — the ePOD joins the proof-of-delivery queue.', 'Жүргізуші орындарды сканмен тапсырады, қол мен фото алады — ePOD кезекке түседі.') },
    { l: T('ЭСФ · счёт', 'ESF · Rechnung', 'ESF · invoice', 'ЭШФ · шот'), s: T('Счета и ЭСФ · Отчёты', 'Rechnungen & ESF · Berichte', 'Billing & ESF · Reports', 'Шоттар мен ЭШФ · Есептер'), t: T('Подтверждённый POD создаёт счёт: ЭСФ выписывается, дебиторка стареет по корзинам, цифры попадают в отчёты и модель затрат.', 'Das bestätigte POD erzeugt die Rechnung: die ESF wird ausgestellt, Forderungen altern in Körben, die Zahlen fließen in Berichte und Kostenmodell.', 'The approved POD creates the invoice: the ESF is issued, receivables age in buckets, the numbers feed reports and the cost model.', 'Расталған POD шот жасайды: ЭШФ жазылады, сандар есептер мен шығын моделіне түседі.') },
  ];
  HELP.players.shipflow = {
    title: T('Путь отправки от начала до конца', 'Sendungsablauf von Anfang bis Ende', 'A shipment from start to finish', 'Жөнелтімнің басынан аяғына дейінгі жолы'),
    steps: SF.map(x => ({ t: x.t })),
    /* row 1 left → right: booking, planning, loading, Go/No-Go; row 2 right → left: in transit, delivery, ESF (no box overlaps, every label wraps inside its box) */
    view: '0 0 1000 300',
    draw(i) {
      const P = [{ x: 20, y: 44, w: 196, h: 84 }, { x: 250, y: 44, w: 196, h: 84 }, { x: 480, y: 44, w: 196, h: 84 }, null, { x: 724, y: 204, w: 256, h: 84 }, { x: 454, y: 204, w: 236, h: 84 }, { x: 184, y: 204, w: 236, h: 84 }];
      const D = { cx: 852, cy: 86, w: 220, h: 112 };
      const B = k => Box(Object.assign({ label: SF[k].l, sub: SF[k].s, on: i === k, done: k < i, tone: k === 6 ? 'ok' : 'base', size: 13.5, cls: i === k ? 'pl-on' : '', attrs: ` data-pl-step="${k}"` }, P[k]));
      return Arrow({ x1: 216, y1: 86, x2: 248, y2: 86, on: i === 0 }) + Arrow({ x1: 446, y1: 86, x2: 478, y2: 86, on: i === 1 }) + Arrow({ x1: 676, y1: 86, x2: 740, y2: 86, on: i === 2 })
        + Arrow({ x1: D.cx, y1: D.cy + D.h / 2, x2: D.cx, y2: 202, on: i === 3, tone: 'ok' }) + Tag(D.cx + 34, 172, 'Go', 'ok')
        + Arrow({ d: `M${D.cx - 40},${D.cy - 36} C${D.cx - 90},4 640,4 590,42`, tone: 'bad', dashed: true }) + Tag(712, 16, 'No-Go', 'bad')
        + Arrow({ x1: 724, y1: 246, x2: 692, y2: 246, on: i === 4 }) + Arrow({ x1: 454, y1: 246, x2: 422, y2: 246, on: i === 5 })
        + [0, 1, 2, 4, 5, 6].map(B).join('')
        + Diamond(Object.assign({ label: SF[3].l, on: i === 3, cls: i === 3 ? 'pl-on' : '', size: 13 }, D)) + Txt(D.cx - 14, D.cy + 74, SF[3].s, { anchor: 'end', size: 11, cls: 'hv-sb' });
    },
  };

  /* ---------- player 2: where express lives (0.3.9 "Wo ist Express", screen sketch with numbered call-outs) ---------- */
  const EXS = [
    T('Экспресс живёт на Диспетчерской доске: вкладка «Экспресс» собирает срочные запросы со сроком приёма.', 'Express lebt auf der Dispositionstafel: die Registerkarte „Express“ sammelt eilige Anfragen mit Annahmeschluss.', 'Express lives on the Dispatch Board: the "Express" tab collects urgent requests with a cut-off.', 'Экспресс Диспетчерлік тақтада тұрады: «Экспресс» қойындысы мерзімді өтінімдерді жинайды.'),
    T('Каждый запрос: маршрут, груз и подписи 0–3 из 3 — руководитель, экономика и диспетчер подтверждают по очереди.', 'Jede Anfrage: Strecke, Ware und Unterschriften 0–3 von 3 — Leitung, Wirtschaft und Disposition bestätigen nacheinander.', 'Each request: route, goods and signatures 0–3 of 3 — manager, economics and dispatch approve in turn.', 'Әр өтінім: маршрут, жүк және 0–3/3 қолдар — басшы, экономика және диспетчер кезекпен растайды.'),
    T('«К выпуску» ведёт на гейт Go/No-Go: экспресс проходит те же проверки документов, SSCC и взвешивания.', '„Zur Freigabe“ führt zum Go/No-Go-Gate: Express durchläuft dieselben Prüfungen von Dokumenten, SSCC und Verwiegung.', '"To release" leads to the Go/No-Go gate: express passes the same document, SSCC and weighing checks.', '«Шығаруға» Go/No-Go қақпасына апарады: экспресс сол тексерулерден өтеді.'),
    T('Выпущенный экспресс виден на Обзоре и на карте маршрутов; наценка и сравнение с обычным тарифом — в отчёте «Экспресс × температура».', 'Freigegebener Express erscheint auf der Übersicht und der Routenkarte; Zuschlag und Tarifvergleich im Bericht „Express × Temperatur“.', 'Released express shows on the Dashboard and the route map; the surcharge and tariff comparison live in the "Express × temperature" report.', 'Шығарылған экспресс Шолуда және картада көрінеді; үстеме «Экспресс × температура» есебінде.'),
  ];
  HELP.players.expresspath = {
    title: T('Где живёт экспресс: эскиз экрана', 'Wo ist Express: Bildschirm-Skizze', 'Where express lives: screen sketch', 'Экспресс қайда тұрады: экран эскизі'),
    steps: EXS.map(t => ({ t })),
    view: '0 0 1000 300',
    draw(i) {
      const side = [['01 · ' + navLabel('dashboard'), false], ['03 · ' + navLabel('dispatch'), i <= 1], ['02 · ' + navLabel('orders'), false], ['06 · ' + navLabel('routes'), i === 3]];
      const card = (y, id, rt, sig, on) => `<g class="hv-bx t-${on ? 'accent' : 'base'}${on ? ' on' : ''}"><rect x="290" y="${y}" width="500" height="64" rx="8"/>${Txt(306, y + 26, id, { size: 15, cls: 'hv-st' })}${Txt(306, y + 48, rt, { size: 12, cls: 'hv-sb' })}${Txt(700, y + 37, sig, { size: 14, cls: 'hv-st', anchor: 'middle' })}</g>`
        + Box({ x: 812, y: y + 12, w: 170, h: 40, label: T('К выпуску', 'Zur Freigabe', 'To release', 'Шығаруға'), tone: 'ok', size: 13 });
      return `<g class="hv-bx t-muted"><rect x="10" y="10" width="244" height="280" rx="10"/></g>`
        + side.map((r, k) => Box({ x: 22, y: 24 + k * 50, w: 220, h: 40, label: r[0], tone: r[1] ? 'accent' : 'base', on: r[1], size: 12.5 })).join('')
        + `<g class="hv-bx t-base"><rect x="274" y="10" width="716" height="280" rx="10"/></g>` + Txt(290, 42, T('Экспресс · ждут выпуска (2)', 'Express · warten auf Freigabe (2)', 'Express · waiting for release (2)', 'Экспресс · шығаруды күтуде (2)'), { size: 15, cls: 'hv-st' })
        + card(70, 'EX-0311', HUBS.ALA.city + ' → ' + HUBS.ATY.city + ' · 18 ' + LF.unit('kg') + ' · 2–8 °C', '1 / 3', i === 1) + card(150, 'EX-0312', HUBS.AST.city + ' → ' + HUBS.SHY.city + ' · 9 ' + LF.unit('kg') + ' · 15–25 °C', '0 / 3', false)
        + Txt(290, 258, T('Срок приёма 16:00 · подписи: руководитель · экономика · диспетчер', 'Annahmeschluss 16:00 · Unterschriften: Leitung · Wirtschaft · Dispo', 'Cut-off 16:00 · signatures: manager · economics · dispatch', 'Қабылдау мерзімі 16:00 · қолдар: басшы · экономика · диспетчер'), { size: 12, cls: 'hv-sb' })
        + num(264, 94, 0, i === 0) + num(700, 70, 1, i === 1) + num(897, 70, 2, i === 2) + num(264, 194, 3, i === 3);
    },
  };

  /* ---------- player 3: alarm chain sensor → playbook → deviation → CAPA ---------- */
  const AL = [
    { l: T('Датчик камеры', 'Kammersensor', 'Chamber sensor', 'Камера датчигі'), t: T('Логгер меряет каждые 2 с; выход из диапазона зоны (например, 2–8 °C) рождает событие.', 'Der Logger misst alle 2 s; das Verlassen des Zonenbereichs (z. B. 2–8 °C) erzeugt ein Ereignis.', 'The logger measures every 2 s; leaving the zone range (e.g. 2–8 °C) raises an event.', 'Логгер әр 2 с өлшейді; аймақтан шығу оқиға тудырады.') },
    { l: T('Тревога L1–L3', 'Alarm L1–L3', 'Alarm L1–L3', 'Дабыл L1–L3'), t: T('Правила холодовой цепи присваивают уровень; L3 эскалирует по дежурному списку, пока её не примут.', 'Die Kühlketten-Regeln vergeben die Stufe; L3 eskaliert über die Bereitschaftsliste, bis jemand übernimmt.', 'The cold-chain rules assign the level; L3 escalates through the on-call roster until acknowledged.', 'Суық тізбек ережелері деңгей береді; L3 кезекшілер тізімімен эскалацияланады.') },
    { l: T('Обзор: плейбук', 'Übersicht: Playbook', 'Dashboard: playbook', 'Шолу: плейбук'), t: T('На Обзоре появляется порядок действий: кому звонить, что проверить, когда останавливать рейс.', 'Auf der Übersicht erscheint das Vorgehen: wen anrufen, was prüfen, wann die Fahrt stoppen.', 'The dashboard shows the response steps: whom to call, what to check, when to stop the trip.', 'Шолуда әрекет тәртібі шығады: кімге қоңырау шалу, нені тексеру.') },
    { l: T('Отклонение QA', 'Abweichung QA', 'QA deviation', 'QA ауытқуы'), t: T('Тревога открывает отклонение в «Отклонения и качество»: шаги расследования 1–4 и решение — допуск или карантин.', 'Der Alarm öffnet eine Abweichung unter „Abweichungen & Qualität“: Untersuchungsschritte 1–4 und Entscheidung — Freigabe oder Quarantäne.', 'The alarm opens a deviation under "Deviations & quality": investigation steps 1–4 and a decision — release or quarantine.', 'Дабыл «Ауытқулар мен сапа» бөлімінде ауытқу ашады: 1–4 қадам және шешім.') },
    { l: 'CAPA', t: T('Корректирующее действие с ответственным и сроком; просроченная поверка логгера блокирует фарма-рейсы.', 'Korrekturmaßnahme mit Verantwortlichem und Frist; abgelaufene Kalibrierung sperrt Pharma-Fahrten.', 'A corrective action with owner and due date; expired calibration blocks pharma loads.', 'Жауаптысы мен мерзімі бар түзету әрекеті; мерзімі өткен поверка фарма-рейстерді бұғаттайды.') },
    { l: T('Отчёт и аудит', 'Bericht und Audit', 'Report and audit', 'Есеп және аудит'), t: T('Каждое решение пишется в журнал аудита; соблюдение температуры попадает в отчёты и KPI.', 'Jede Entscheidung landet im Audit-Protokoll; die Temperatur-Compliance fließt in Berichte und KPI.', 'Every decision is written to the audit log; temperature compliance feeds reports and KPIs.', 'Әр шешім аудит журналына жазылады; көрсеткіштер есептерге түседі.') },
  ];
  HELP.players.alarmflow = {
    title: T('Температурная тревога: от датчика до CAPA', 'Temperaturalarm: vom Sensor bis CAPA', 'A temperature alarm: from sensor to CAPA', 'Температура дабылы: датчиктен CAPA-ға дейін'),
    steps: AL.map(x => ({ t: x.t })),
    view: '0 0 1000 230',
    draw(i) {
      const bw = 290, bh = 64, pos = k => ({ x: 20 + (k % 3) * 330, y: 20 + Math.floor(k / 3) * 140 });
      let g = '';
      AL.forEach((s, k) => {
        const p = pos(k);
        if (k < AL.length - 1) g += k % 3 < 2 ? Arrow({ x1: p.x + bw, y1: p.y + bh / 2, x2: p.x + 328, y2: p.y + bh / 2, on: i === k }) : Arrow({ d: `M${p.x + bw / 2},${p.y + bh} L${p.x + bw / 2},${p.y + bh + 38} L${20 + bw / 2},${p.y + bh + 38} L${20 + bw / 2},${p.y + 138}`, on: i === k });
        g += Box({ x: p.x, y: p.y, w: bw, h: bh, label: s.l, on: i === k, done: k < i, tone: k >= 3 ? 'ok' : 'base', size: 15, cls: i === k ? 'pl-on' : '' });
      });
      return g;
    },
  };

  /* ---------- rendering: through the Q1 figure kit of 60-visuals.js (controls, step list, one timer per visible figure, in-place repaint) ---------- */
  Object.keys(HELP.players).forEach(id => { const p = HELP.players[id]; HELP.fig('pl:' + id, { title: p.title, steps: p.steps.map(s => s.t), view: p.view, draw: i => p.draw(i), ms: 4000, cls: 'hp', attrs: `data-player="${id}"` }); });
  /* 0.3.9 action names kept as aliases */
  Object.assign(ACT, { hpStep: d => ACT.hvStep({ id: 'pl:' + d.id, v: d.v }), hpTog: d => ACT.hvTog({ id: 'pl:' + d.id }) });

  /* attach the players to their articles (helpAdd merges the visuals list) */
  helpAdd({ key: 'start', visuals: ['pl:shipflow'] });
  helpAdd({ key: 'express', visuals: ['pl:expresspath'] });
  helpAdd({ key: 'dashboard/alarms', visuals: ['pl:alarmflow'] });
  helpAdd({ key: 'pod/quality', visuals: ['pl:alarmflow'] });
})();
