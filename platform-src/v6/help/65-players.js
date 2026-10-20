/* Help · animated Schaubilder (port of the 0.3.9 help overlays): a diagram that plays through its steps — ‹ ▶/⏸ › controls,
   "step n of m", the active node highlighted, the step text under the picture, "all steps" as a list. Since Q1 they run on the figure
   kit of 60-visuals.js (HELP.fig): auto-advance every 4 s only while visible; prefers-reduced-motion starts paused; state S.hv['pl:<id>'].
   HELP.players[id] = {title, steps[{t}], svg(i)}; rendered through HELP.visuals['pl:<id>'] so articles attach a player like any visual. */
(function () {
  HELP.players = {};

  /* ---------- small SVG kit (uses the hv- classes of 60-visuals) ---------- */
  const box = (x, y, w, h, l1, l2, on, cls) => `<g class="hv-box hv-${cls || 'a'}${on ? ' pl-on' : ''}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9"/><text x="${x + w / 2}" y="${y + (l2 ? h / 2 - 3 : h / 2 + 4)}" text-anchor="middle" style="font-weight:600">${esc(l1)}</text>${l2 ? `<text x="${x + w / 2}" y="${y + h / 2 + 13}" text-anchor="middle" style="font-size:10px;opacity:.75">${esc(l2)}</text>` : ''}</g>`;
  const dia = (cx, cy, rx, ry, l1, on) => `<g class="hv-box hv-b${on ? ' pl-on' : ''}"><path d="M${cx} ${cy - ry} L${cx + rx} ${cy} L${cx} ${cy + ry} L${cx - rx} ${cy} Z" style="stroke-width:1.5"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" style="font-weight:600">${esc(l1)}</text></g>`;
  const ar = (x1, y1, x2, y2, dash, cls) => { const a = Math.atan2(y2 - y1, x2 - x1), h = 6; return `<g class="${cls || 'hv-ar'}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${dash ? ' stroke-dasharray="5 4"' : ''}/><path d="M${x2} ${y2} L${x2 - h * Math.cos(a - .5)} ${y2 - h * Math.sin(a - .5)} L${x2 - h * Math.cos(a + .5)} ${y2 - h * Math.sin(a + .5)} Z" style="fill:currentColor;stroke:none"/></g>`; };

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
    svg(i) {
      const W = 640, bw = 138, bh = 48, y1 = 26, y2 = 120, xs = [10, 176, 342, 0], gx = 540;
      let g = box(xs[0], y1, bw, bh, SF[0].l, SF[0].s, i === 0) + ar(xs[0] + bw + 2, y1 + bh / 2, xs[1] - 4, y1 + bh / 2, i === 0)
        + box(xs[1], y1, bw, bh, SF[1].l, SF[1].s, i === 1) + ar(xs[1] + bw + 2, y1 + bh / 2, xs[2] - 4, y1 + bh / 2, i === 1)
        + box(xs[2], y1, bw, bh, SF[2].l, SF[2].s, i === 2) + ar(xs[2] + bw + 2, y1 + bh / 2, gx - 62, y1 + bh / 2, i === 2)
        + dia(gx, y1 + bh / 2, 58, 34, 'Go/No-Go', i === 3)
        + `<g class="pl-nogo"><path d="M${gx - 20} ${y1 - 8} C ${gx - 120} ${-14} ${xs[2] + bw - 20} ${-12} ${xs[2] + 70} ${y1 - 4}" fill="none" stroke-dasharray="5 4"/><path d="M${xs[2] + 70} ${y1 - 4} l8 -5 l-2 8 Z" style="stroke:none;fill:currentColor"/><text x="${gx - 92}" y="2" text-anchor="middle">No-Go</text></g>`
        + ar(gx, y1 + bh / 2 + 36, gx, y2 - 4, false, i === 3 ? 'hv-ar pl-go' : 'hv-ar')
        + box(gx - 69, y2, bw, bh, SF[4].l, SF[4].s, i === 4) + ar(gx - 71, y2 + bh / 2, xs[1] + 166 + bw + 4, y2 + bh / 2, i === 4)
        + box(xs[1] + 166, y2, bw, bh, SF[5].l, SF[5].s, i === 5) + ar(xs[1] + 164, y2 + bh / 2, xs[1] + bw + 4, y2 + bh / 2, i === 5)
        + box(xs[1] - 70, y2, bw, bh, SF[6].l, SF[6].s, i === 6, 'c');
      return `<svg viewBox="0 0 ${W} 184" class="hv-svg">${g}</svg>`;
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
    svg(i) {
      const row = (y, txt, on) => `<g class="hv-box hv-${on ? 'a' : 'n'}"><rect x="14" y="${y}" width="128" height="22" rx="6"/><text x="22" y="${y + 15}">${esc(txt)}</text></g>`;
      const n = (x, y, k) => `<g class="pl-num${i === k ? ' pl-on' : ''}"><circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y + 4}" text-anchor="middle">${k + 1}</text></g>`;
      const card = (y, id, rt, sig, on) => `<g class="hv-box hv-${on ? 'a' : 'n'}"><rect x="170" y="${y}" width="380" height="40" rx="8"/><text x="182" y="${y + 17}" style="font-weight:700">${id}</text><text x="182" y="${y + 32}" style="font-size:10px;opacity:.75">${esc(rt)}</text><text x="408" y="${y + 24}" style="font-size:10px">${esc(sig)}</text></g><g class="hv-box hv-c"><rect x="556" y="${y + 6}" width="72" height="26" rx="7"/><text x="${556 + 36}" y="${y + 23}" text-anchor="middle" style="font-size:10px">${esc(T('К выпуску', 'Zur Freigabe', 'To release', 'Шығаруға'))}</text></g>`;
      return `<svg viewBox="0 0 650 190" class="hv-svg"><rect x="6" y="6" width="140" height="176" rx="10" style="fill:var(--bg-subtle,#f3f4f6);stroke:var(--border,#e5e7eb)"/>
${row(16, '01 · ' + navLabel('dashboard'), false)}${row(42, '03 · ' + navLabel('dispatch'), i <= 1)}${row(68, '02 · ' + navLabel('orders'), false)}${row(94, '06 · ' + navLabel('routes'), i === 3)}
<g class="hv-box hv-e"><rect x="160" y="6" width="484" height="176" rx="10" style="fill:var(--surface,#fff)"/><text x="176" y="30" style="font-weight:700">${esc(T('Экспресс · ждут выпуска (2)', 'Express · warten auf Freigabe (2)', 'Express · waiting for release (2)', 'Экспресс · шығаруды күтуде (2)'))}</text></g>
${card(44, 'EX-0311', HUBS.ALA.city + ' → ' + HUBS.ATY.city + ' · 18 ' + LF.unit('kg') + ' · 2–8 °C', '1 / 3', i === 1)}${card(94, 'EX-0312', HUBS.AST.city + ' → ' + HUBS.SHY.city + ' · 9 ' + LF.unit('kg') + ' · 15–25 °C', '0 / 3', false)}
<text x="176" y="166" style="font-size:10px;opacity:.7">${esc(T('Срок приёма 16:00 · подписи: руководитель · экономика · диспетчер', 'Annahmeschluss 16:00 · Unterschriften: Leitung · Wirtschaft · Dispo', 'Cut-off 16:00 · signatures: manager · economics · dispatch', 'Қабылдау мерзімі 16:00 · қолдар: басшы · экономика · диспетчер'))}</text>
${n(152, 53, 0)}${n(428, 36, 1)}${n(592, 36, 2)}${n(152, 105, 3)}</svg>`;
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
    svg(i) {
      const W = 640, bw = 192, bh = 44, per = 3;
      let g = '';
      AL.forEach((s, k) => {
        const r = Math.floor(k / per), c = k % per, x = 10 + c * (bw + 21), y = 14 + r * (bh + 44);
        g += box(x, y, bw, bh, s.l, '', i === k, k >= 3 ? 'c' : 'a');
        if (k < AL.length - 1) g += (c < per - 1) ? ar(x + bw + 2, y + bh / 2, x + bw + 19, y + bh / 2, false) : ar(x + bw / 2, y + bh + 2, 10 + bw / 2, y + bh + 42, false);
      });
      return `<svg viewBox="0 0 ${W} 192" class="hv-svg">${g}</svg>`;
    },
  };

  /* ---------- rendering: through the Q1 figure kit of 60-visuals.js (controls, step list, one timer per visible figure, in-place repaint) ---------- */
  Object.keys(HELP.players).forEach(id => { const p = HELP.players[id]; HELP.fig('pl:' + id, { title: p.title, steps: p.steps.map(s => s.t), svg: i => p.svg(i), ms: 4000, cls: 'hp', attrs: `data-player="${id}"` }); });
  /* 0.3.9 action names kept as aliases */
  Object.assign(ACT, { hpStep: d => ACT.hvStep({ id: 'pl:' + d.id, v: d.v }), hpTog: d => ACT.hvTog({ id: 'pl:' + d.id }) });

  /* attach the players to their articles (helpAdd merges the visuals list) */
  helpAdd({ key: 'start', visuals: ['pl:shipflow'] });
  helpAdd({ key: 'express', visuals: ['pl:expresspath'] });
  helpAdd({ key: 'dashboard/alarms', visuals: ['pl:alarmflow'] });
  helpAdd({ key: 'pod/quality', visuals: ['pl:alarmflow'] });
})();
