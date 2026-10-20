/* Settings (spec 5.12): one long page of cards, one global "Save All Changes" with a dirty state, JSON export, audit log.
   Values that drive the prototype (Standgeld, RTO shift, AI confidence thresholds) are applied on save. */
(function () {
  const dup = o => JSON.parse(JSON.stringify(o));
  const ago = m => m === 0 ? T('только что', 'gerade eben', 'just now', 'жаңа ғана') : agoTxt(m);
  const base = {
    company: { legal: 'ТОО «Олимп Логистик KZ»', bin: '190340012345', sites: [
      { n: T('Хаб Астана-Север', 'Hub Astana-Nord', 'Astana North Hub', 'Астана-Солтүстік хабы'), lic: 'GDP-KZ-2026-017', st: 'active', hq: 1 },
      { n: T('Хаб Алматы-Жетысу', 'Hub Almaty-Zhetysu', 'Almaty Zhetysu Hub', 'Алматы-Жетісу хабы'), lic: 'GDP-KZ-2026-021', st: 'active' },
      { n: T('Хаб Караганда', 'Hub Karaganda', 'Karaganda Hub', 'Қарағанды хабы'), lic: 'GDP-KZ-2026-033', st: 'active' },
      { n: T('Хаб Шымкент', 'Hub Schymkent', 'Shymkent Hub', 'Шымкент хабы'), lic: T('заявка подана', 'beantragt', 'application filed', 'өтінім берілді'), st: 'pending' }] },
    integ: [
      { k: 'gps', ic: 'route', tint: 'blue', t: T('GPS-трекинг', 'GPS-Tracking', 'GPS tracking', 'GPS-трекинг'), p: 'Wialon (Gurtam)', on: true, m: 2 },
      { k: 'reefer', ic: 'therm', tint: 'green', t: T('Реф-телематика', 'Kühl-Telematik', 'Reefer telematics', 'Реф-телематика'), p: 'Thermo King TracKing / Carrier Lynx', on: true, m: 5 },
      { k: 'acc', ic: 'receipt', tint: 'yellow', t: T('Бухгалтерия', 'Buchhaltung', 'Accounting', 'Бухгалтерия'), p: T('1С:Предприятие', '1C:Enterprise', '1C:Enterprise', '1С:Кәсіпорын'), on: false, m: 0 },
      { k: 'esf', ic: 'file', tint: 'red', t: T('Счета-фактуры', 'Rechnungen', 'Invoicing', 'Шот-фактуралар'), p: nm('ИС ЭСФ (esf.gov.kz)'), on: true, m: 60 },
      { k: 'wx', ic: 'alert', tint: 'purple', t: T('Погода', 'Wetter', 'Weather', 'Ауа райы'), p: nm('Open-Meteo / Казгидромет'), on: true, m: 15 },
      { k: 'fuel', ic: 'truck', tint: 'orange', t: T('Топливные карты', 'Tankkarten', 'Fuel cards', 'Отын карталары'), p: 'Helios / Sinooil', on: false, m: 0 }],
    notify: { rules: {
      temp: { on: true, v: 15 }, door: { on: true, v: 5 }, sensor: { on: true }, setp: { on: true }, delay: { on: true, v: 30 },
      route: { on: true, v: 5 }, calib: { on: true, v: 30 }, gdp: { on: true }, esf: { on: false } }, sens: 'medium', ch: { app: true, mail: true, sms: true, tg: false } },
    ai: { mod: { match: true, exc: true, leak: true, anom: true }, thr: { high: 85, medium: 65, low: 45 }, expl: true, ovr: true },
    sec: { esign: true, twofa: true, sess: 30 },
    params: { shift: 9, free: 45, step: 30, rate: 6000 },
  };
  const ROLES = [
    ['admin', 'red', 'Admin', T('Полный доступ к системе', 'Voller Systemzugriff', 'Full system access', 'Жүйеге толық қолжетімділік'), 4],
    ['dispatcher', 'blue', T('Диспетчер', 'Disponent', 'Dispatcher', 'Диспетчер'), T('Рейсы и маршруты', 'Fahrten und Routen', 'Load & route management', 'Рейстер мен маршруттар'), 12],
    ['finance', 'green', T('Финансы', 'Finanzen', 'Finance', 'Қаржы'), T('Счета, ЭСФ, затраты', 'Rechnungen, ESF, Kosten', 'Billing, ESF, costs', 'Шоттар, ЭШФ, шығыстар'), 6],
    ['qa', 'purple', T('QA / ответственное лицо (GDP)', 'QA / Verantwortliche Person (GDP)', 'QA / Responsible Person (GDP)', 'QA / жауапты тұлға (GDP)'), T('Выпуск партий, отклонения', 'Chargenfreigabe, Abweichungen', 'Batch release, deviations', 'Партия шығару, ауытқулар'), 3],
    ['driver', 'orange', T('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'), T('Мобильное приложение', 'Mobile App', 'Mobile app', 'Мобильді қосымша'), 38],
    ['viewer', 'gray', T('Просмотр', 'Lesen', 'Viewer', 'Көру'), T('Только чтение', 'Nur lesen', 'Read-only', 'Тек оқу'), 9]];
  const RULES = [
    ['temp', 'therm', 'red', T('Температура вне диапазона', 'Temperatur außerhalb Bereich', 'Temperature out of range', 'Температура диапазоннан тыс'), T('дольше (мин)', 'länger als (Min)', 'longer than (min)', 'ұзағырақ (мин)')],
    ['door', 'warehouse', 'orange', T('Дверь рефрижератора открыта', 'Kühltür offen', 'Reefer door open', 'Рефрижератор есігі ашық'), T('дольше (мин)', 'länger als (Min)', 'longer than (min)', 'ұзағырақ (мин)')],
    ['sensor', 'alert', 'yellow', T('Датчик offline', 'Sensor offline', 'Sensor offline', 'Датчик offline'), ''],
    ['setp', 'cog', 'blue', T('Set-point ≠ заказу', 'Set-Point ≠ Auftrag', 'Set-point ≠ order', 'Set-point ≠ тапсырыс'), ''],
    ['delay', 'route', 'yellow', T('Задержка рейса', 'Verspätung', 'Delivery delay', 'Рейстің кешігуі'), T('более (мин)', 'mehr als (Min)', 'more than (min)', 'артық (мин)')],
    ['route', 'route', 'blue', T('Отклонение от маршрута', 'Routenabweichung', 'Route deviation', 'Маршруттан ауытқу'), T('более (км)', 'mehr als (km)', 'more than (km)', 'артық (км)')],
    ['calib', 'therm', 'purple', T('Истечение поверки датчиков', 'Kalibrierung läuft ab', 'Calibration expiring', 'Поверка мерзімі аяқталуда'), T('за (дн.)', 'in (Tagen)', 'within (days)', '(күн) бұрын')],
    ['gdp', 'file', 'green', T('Создано отклонение GDP', 'GDP-Abweichung erstellt', 'GDP deviation created', 'GDP ауытқуы құрылды'), ''],
    ['esf', 'receipt', 'red', T('ЭСФ отклонена', 'ESF abgelehnt', 'ESF rejected', 'ЭШФ қабылданбады'), '']];
  const AIM = [
    ['match', 'user', 'blue', T('Подбор водитель–реф-юнит', 'Fahrer-Kühlfahrzeug-Zuordnung', 'Driver–reefer matching', 'Жүргізуші–реф-юнит таңдау'), T('Предлагает пары по правилам допуска', 'Schlägt Paare nach Zulassungsregeln vor', 'Proposes pairs by eligibility rules', 'Рұқсат ережелері бойынша жұп ұсынады')],
    ['exc', 'therm', 'red', T('Прогноз температурных отклонений', 'Prognose Temperaturabweichungen', 'Excursion risk prediction', 'Температура ауытқуын болжау'), T('Заблаговременные предупреждения', 'Frühwarnungen', 'Proactive warnings', 'Алдын ала ескертулер')],
    ['leak', 'chart', 'yellow', T('Поиск утечек затрат', 'Kostenlecks erkennen', 'Cost-leak detection', 'Шығын ағып кетуін іздеу'), T('Простои, порожние пробеги, топливо', 'Standzeiten, Leerfahrten, Treibstoff', 'Detention, empty legs, fuel', 'Тұрып қалу, бос жүріс, отын')],
    ['anom', 'receipt', 'green', T('Аномалии ЭСФ и счетов', 'ESF-/Rechnungsanomalien', 'ESF / invoice anomalies', 'ЭШФ және шот ауытқулары'), T('Дубли, расхождения, пропущенные позиции', 'Dubletten, Abweichungen, fehlende Positionen', 'Duplicates, mismatches, missing lines', 'Қайталанулар, айырмашылықтар')]];
  globalThis.CFG = { cur: dup(base), saved: JSON.stringify(base), live: { shift: 9 }, tab: false, auditOpen: false };
  S.audit = [];
  globalThis.audit = (module, subject, decision, reason) => { const d = new Date(); S.audit.unshift({ t: p2(d.getHours()) + ':' + p2(d.getMinutes()) + ':' + p2(d.getSeconds()), user: 'Sarah Johnson', module, subject, decision, reason: reason || '' }); };
  const getp = (p) => p.split('.').reduce((o, k) => o[k], CFG.cur);
  const setp = (p, v) => { const a = p.split('.'), k = a.pop(); a.reduce((o, x) => o[x], CFG.cur)[k] = v; };
  const dirty = () => JSON.stringify(CFG.cur) !== CFG.saved;
  const num = (v, lo, hi) => typeof v === 'number' && isFinite(v) && v >= lo && v <= hi;
  function errors() {
    const c = CFG.cur, e = {}, P = c.params, t = c.ai.thr;
    if (!/^\d{12}$/.test(c.company.bin)) e['company.bin'] = T('БИН: ровно 12 цифр', 'BIN: genau 12 Ziffern', 'BIN: exactly 12 digits', 'БСН: нақты 12 цифр');
    if (!c.company.legal.trim()) e['company.legal'] = T('Укажите название', 'Name angeben', 'Enter a name', 'Атауын көрсетіңіз');
    if (!num(P.shift, 4, 9)) e['params.shift'] = T('4–9 ч', '4–9 Std.', '4–9 h', '4–9 сағ');
    if (!num(P.free, 0, 240)) e['params.free'] = T('0–240 мин', '0–240 Min.', '0–240 min', '0–240 мин');
    if (!num(P.step, 5, 120)) e['params.step'] = T('5–120 мин', '5–120 Min.', '5–120 min', '5–120 мин');
    if (!num(P.rate, 0, 100000)) e['params.rate'] = T('0–100 000 ₸', '0–100 000 ₸', '0–100,000 ₸', '0–100 000 ₸');
    if (!(t.high > t.medium && t.medium > t.low && t.low >= 1 && t.high <= 99)) e['ai.thr'] = T('Нужно: High > Medium > Low, 1–99 %', 'Erforderlich: High > Medium > Low, 1–99 %', 'Required: High > Medium > Low, 1–99 %', 'Қажет: High > Medium > Low, 1–99 %');
    if (!num(c.sec.sess, 5, 240)) e['sec.sess'] = T('5–240 мин', '5–240 Min.', '5–240 min', '5–240 мин');
    RULES.forEach(r => { const x = c.notify.rules[r[0]]; if (r[4] && !num(x.v, 1, 999)) e['notify.rules.' + r[0] + '.v'] = '1–999'; });
    return e;
  }
  function apply() {   // saved values drive the prototype
    const P = JSON.parse(CFG.saved).params, T_ = JSON.parse(CFG.saved).ai.thr;
    RECV.free = P.free; RECV.step = P.step; RECV.rate = P.rate; CFG.live.shift = P.shift; CFG.live.thr = T_;
  }
  globalThis.aiThr = () => JSON.parse(CFG.saved).ai.thr;
  globalThis.aiOn = k => JSON.parse(CFG.saved).ai.mod[k];
  const idOf = p => 'cf_' + p.replace(/\./g, '_');
  const ERR = () => errors();
  const sw = (p, lock) => `<span class="switch${getp(p) ? ' on' : ''}${lock ? ' lock' : ''}"${lock ? '' : ` data-act="cfgT" data-p="${p}"`} role="switch" aria-checked="${!!getp(p)}"></span>`;
  const tile = (n, t, s, tint) => `<span class="itile ${tint}">${ic(n, 18)}</span>`;
  const field = (lab, p, type, extra) => { const er = ERR()[p]; return `<label class="fl">${esc(lab)}<input class="inp${er ? ' bad' : ''}" id="${idOf(p)}" data-cf="${p}"${type === 'number' ? ' data-num="1" type="number"' : ' type="text"'} value="${esc(getp(p))}" ${extra || ''}>${er ? `<span class="note" style="color:var(--label-red)">${esc(er)}</span>` : ''}</label>`; };
  const prm = (p, lab, hint, unit) => { const er = ERR()[p]; return `<div class="prm"><span>${esc(lab)}<small>${esc(hint)}</small></span><input class="inp${er ? ' bad' : ''}" id="${idOf(p)}" data-cf="${p}" data-num="1" type="number" value="${esc(getp(p))}">${er ? `<span title="${esc(er)}" style="color:var(--label-red)">!</span>` : `<small>${esc(unit)}</small>`}</div>`; };

  const cCompany = () => {
    const C = CFG.cur.company, users = ROLES.reduce((s, r) => s + r[4], 0);
    return `<div class="card set-card" id="sc-company"><div class="card-head">${tile('warehouse', '', '', 'blue')}<div><h3>Company Setup</h3><small>${esc(T('Юрлицо, площадки и лицензии GDP, роли', 'Rechtsträger, Standorte und GDP-Lizenzen, Rollen', 'Legal entity, sites & GDP licences, roles', 'Заңды тұлға, алаңдар және GDP лицензиялары, рөлдер'))}</small></div></div>
<div class="set-body"><div class="set-col"><h5>${esc(T('Юрлицо и площадки', 'Rechtsträger und Standorte', 'Legal entity & sites', 'Заңды тұлға және алаңдар'))}</h5>
<div class="two">${field(T('Наименование', 'Name', 'Name', 'Атауы'), 'company.legal', 'text')}${field(T('БИН', 'BIN', 'BIN', 'БСН'), 'company.bin', 'text', 'inputmode="numeric" maxlength="12"')}</div>
${C.sites.map(s => `<div class="trow">${tile('warehouse', '', '', s.st === 'active' ? 'green' : 'yellow')}<span class="tx"><b>${esc(s.n)}${s.hq ? ' · HQ' : ''}</b><small>${esc(T('Лицензия: ', 'Lizenz: ', 'Licence: ', 'Лицензия: '))}${esc(s.lic)}</small></span>${chip(s.st === 'active' ? 'green' : 'yellow', s.st === 'active' ? T('Активен', 'Aktiv', 'Active', 'Белсенді') : T('Ожидает', 'Ausstehend', 'Pending', 'Күтуде'))}</div>`).join('')}
<div style="display:flex;gap:8px"><input class="inp" id="newsite" placeholder="${esc(T('Новая площадка / склад', 'Neuer Standort / Lager', 'New site / warehouse', 'Жаңа алаң / қойма'))}"><button class="btn grey" data-act="siteAdd">${ic('plus')} ${esc(T('Добавить', 'Hinzufügen', 'Add', 'Қосу'))}</button></div></div>
<div class="set-col"><h5>${esc(T('Роли и права', 'Rollen und Rechte', 'User roles & permissions', 'Рөлдер мен құқықтар'))} · ${users} ${esc(T('польз.', 'Nutzer', 'users', 'пайд.'))}</h5>
${ROLES.map(r => `<div class="trow">${tile('user', '', '', r[1])}<span class="tx"><b>${esc(r[2])}</b><small>${esc(r[3])}</small></span><b>${r[4]}</b></div>`).join('')}</div></div></div>`;
  };
  const cInteg = () => `<div class="card set-card" id="sc-integ"><div class="card-head">${tile('route', '', '', 'purple')}<div><h3>System Integrations</h3><small>${esc(T('Внешние системы и обмен данными', 'Externe Systeme und Datenaustausch', 'External systems and data exchange', 'Сыртқы жүйелер мен деректер алмасу'))}</small></div></div>
<div style="padding:0 24px 24px"><div class="integration-grid">${CFG.cur.integ.map((x, i) => `<div class="integration-tile"><div class="it">${tile(x.ic, '', '', x.tint)}<span><b>${esc(x.t)}</b><small>${esc(x.p)}</small></span></div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">${chip(x.on ? 'green' : 'red', x.on ? T('Подключено', 'Verbunden', 'Connected', 'Қосылған') : T('Не подключено', 'Nicht verbunden', 'Not connected', 'Қосылмаған'))}<small class="faint">${x.on ? esc(ago(x.m)) : esc(T('нужна настройка', 'Einrichtung nötig', 'Setup required', 'баптау қажет'))}</small></div>${x.on ? `<button class="btn grey block" data-act="intCfg" data-i="${i}">Configure</button>` : `<button class="btn primary block" data-act="intConn" data-i="${i}">Connect</button>`}</div>`).join('')}</div></div></div>`;
  const cNotify = () => { const N = CFG.cur.notify, er = ERR();
    return `<div class="card set-card" id="sc-notify"><div class="card-head">${tile('bell', '', '', 'orange')}<div><h3>Notifications &amp; Alerts</h3><small>${esc(T('Правила событий, чувствительность, каналы', 'Ereignisregeln, Empfindlichkeit, Kanäle', 'Event rules, sensitivity, channels', 'Оқиға ережелері, сезімталдық, арналар'))}</small></div></div>
<div class="set-body"><div class="set-col"><h5>${esc(T('Правила событий', 'Ereignisregeln', 'Event-based rules', 'Оқиға ережелері'))}</h5>${RULES.map(r => { const x = N.rules[r[0]]; return `<div class="trow">${tile(r[1], '', '', r[2])}<span class="tx"><b>${esc(r[3])}</b>${r[4] ? `<small>${esc(r[4])}</small>` : ''}</span>${r[4] ? `<input class="inp${er['notify.rules.' + r[0] + '.v'] ? ' bad' : ''}" style="width:68px" id="${idOf('notify.rules.' + r[0] + '.v')}" data-cf="notify.rules.${r[0]}.v" data-num="1" type="number" value="${x.v}">` : ''}${sw('notify.rules.' + r[0] + '.on')}</div>`; }).join('')}</div>
<div class="set-col"><h5>${esc(T('Чувствительность', 'Empfindlichkeit', 'Alert sensitivity', 'Сезімталдық'))}</h5>
${[['low', T('Низкая', 'Niedrig', 'Low', 'Төмен'), T('Только критичное', 'Nur Kritisches', 'Critical issues only', 'Тек сыни жағдайлар')], ['medium', T('Средняя', 'Mittel', 'Medium', 'Орташа'), T('Важные операционные оповещения', 'Wichtige operative Meldungen', 'Important operational alerts', 'Маңызды операциялық хабарлар')], ['high', T('Высокая', 'Hoch', 'High', 'Жоғары'), T('Все системные уведомления', 'Alle Systemmeldungen', 'All system notifications', 'Барлық жүйе хабарлары')]].map(o => `<label class="opt"><input type="radio" name="sens" data-act="cfgS" data-p="notify.sens" data-v="${o[0]}"${N.sens === o[0] ? ' checked' : ''}><span><b>${esc(o[1])}</b><small>${esc(o[2])}</small></span></label>`).join('')}
<h5 style="margin-top:20px">${esc(T('Каналы', 'Kanäle', 'Communication channels', 'Байланыс арналары'))}</h5>
${[['app', 'In-App', T('Оповещения на панели', 'Dashboard-Meldungen', 'Real-time dashboard alerts', 'Панельдегі хабарлар')], ['mail', 'Email', T('На зарегистрированный адрес', 'An registrierte Adresse', 'Send to registered email', 'Тіркелген мекенжайға')], ['sms', 'SMS', T('Критично для холодовой цепи', 'Kritisch für die Kühlkette', 'Critical for the cold chain', 'Суық тізбек үшін маңызды')], ['tg', 'Telegram / WhatsApp', T('Сообщения водителям и клиентам', 'Nachrichten an Fahrer und Kunden', 'Messages to drivers and customers', 'Жүргізушілер мен клиенттерге хабар')]].map(o => `<label class="opt"><input type="checkbox" data-act="cfgT" data-p="notify.ch.${o[0]}"${N.ch[o[0]] ? ' checked' : ''}><span><b>${esc(o[1])}</b><small>${esc(o[2])}</small></span></label>`).join('')}</div></div></div>`; };
  const cAI = () => { const A = CFG.cur.ai, er = ERR()['ai.thr'];
    return `<div class="card set-card" id="sc-ai"><div class="card-head">${tile('spark', '', '', 'blue')}<div><h3>AI &amp; Automation Controls</h3><small>${esc(T('AI предлагает, решает человек; пороги и журнал решений', 'KI schlägt vor, Mensch entscheidet; Schwellen und Entscheidungsprotokoll', 'AI proposes, humans decide; thresholds and decision log', 'AI ұсынады, адам шешеді; шектер мен шешім журналы'))}</small></div></div>
<div class="set-body"><div class="set-col"><h5>${esc(T('Модули AI', 'KI-Module', 'AI module controls', 'AI модульдері'))}</h5>${AIM.map(m => `<div class="trow">${tile(m[1], '', '', m[2])}<span class="tx"><b>${esc(m[3])}</b><small>${esc(m[4])}</small></span>${sw('ai.mod.' + m[0])}</div>`).join('')}</div>
<div class="set-col"><h5>${esc(T('Пороги уверенности', 'Konfidenz-Schwellen', 'Confidence thresholds', 'Сенімділік шектері'))}</h5>
${[['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(x => `<div class="slider"><label>${x[1]}</label><input type="range" min="1" max="99" id="${idOf('ai.thr.' + x[0])}" data-cf="ai.thr.${x[0]}" data-num="1" data-live="o_${x[0]}" value="${A.thr[x[0]]}"><output id="o_${x[0]}">${A.thr[x[0]]}%</output></div>`).join('')}
${er ? `<p class="note" style="color:var(--label-red)">${esc(er)}</p>` : `<p class="note">${esc(T('Эскалация только для уведомлений — никогда для выпуска товара.', 'Eskalation nur für Benachrichtigungen — nie für Warenfreigabe.', 'Escalation applies to notifications only — never to goods release.', 'Эскалация тек хабарламаларға қатысты — тауарды шығаруға ешқашан.'))}</p>`}
<div class="trow"><span class="tx"><b>AI Explainability</b><small>${esc(T('Показывать обоснование рекомендаций', 'Begründung der Empfehlungen zeigen', 'Show reasoning behind recommendations', 'Ұсыныстардың негіздемесін көрсету'))}</small></span>${sw('ai.expl')}</div>
<div class="trow"><span class="tx"><b>Override Tracking</b><small>${esc(T('Обязателен: журнал GDP (кто/когда/почему)', 'Pflicht: GDP-Protokoll (wer/wann/warum)', 'Mandatory: GDP audit trail (who/when/why)', 'Міндетті: GDP журналы (кім/қашан/неге)'))}</small></span>${sw('ai.ovr', true)}</div></div></div></div>`; };
  const cSec = () => { const Sx = CFG.cur.sec, er = ERR()['sec.sess'];
    return `<div class="card set-card" id="sc-sec"><div class="card-head">${tile('alert', '', '', 'red')}<div><h3>Security &amp; Compliance</h3><small>${esc(T('Контроль доступа и журнал аудита', 'Zugriffskontrolle und Audit-Protokoll', 'Access control and audit trail management', 'Қолжетімділікті бақылау және аудит журналы'))}</small></div></div>
<div class="set-body"><div class="set-col"><div class="trow"><span class="tx"><b>${esc(T('Подпись ЭЦП (NCALayer)', 'E-Signatur (NCALayer)', 'E-signature (NCALayer)', 'ЭЦҚ (NCALayer)'))}</b><small>${esc(T('Для актов, ЭСФ и решений QA', 'Für Akte, ESF und QA-Entscheidungen', 'For acts, ESF and QA decisions', 'Актілер, ЭШФ және QA шешімдері үшін'))}</small></span>${sw('sec.esign')}</div>
<div class="trow"><span class="tx"><b>${esc(T('Двухфакторный вход', 'Zwei-Faktor-Anmeldung', 'Two-factor sign-in', 'Екі факторлы кіру'))}</b></span>${sw('sec.twofa')}</div>
${field(T('Тайм-аут сессии, мин', 'Sitzungs-Timeout, Min.', 'Session timeout, min', 'Сессия тайм-ауты, мин'), 'sec.sess', 'number')}</div>
<div class="set-col"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h5 style="margin:0">${esc(T('Журнал аудита', 'Audit-Protokoll', 'Audit log', 'Аудит журналы'))} · ${S.audit.length}</h5><span><button class="btn sm grey" data-act="auditToggle">${esc(CFG.auditOpen ? T('Скрыть', 'Ausblenden', 'Hide', 'Жасыру') : T('Показать журнал', 'Protokoll zeigen', 'Show audit log', 'Журналды көрсету'))}</button> <button class="btn sm grey" data-act="auditCsv">CSV</button></span></div>${CFG.auditOpen ? auditTable() : `<p class="note">${esc(T('Каждое решение AI и каждое сохранение настроек фиксируется.', 'Jede KI-Entscheidung und jedes Speichern wird protokolliert.', 'Every AI decision and every settings save is recorded.', 'Әрбір AI шешімі мен сақтау тіркеледі.'))}</p>`}</div></div></div>`; };
  globalThis.auditTable = () => S.audit.length ? `<div class="audit"><table class="table"><thead><tr><th>${esc(T('Время', 'Zeit', 'Time', 'Уақыт'))}</th><th>${esc(T('Пользователь', 'Nutzer', 'User', 'Пайдаланушы'))}</th><th>${esc(T('Модуль', 'Modul', 'Module', 'Модуль'))}</th><th>${esc(T('Решение', 'Entscheidung', 'Decision', 'Шешім'))}</th></tr></thead><tbody>${S.audit.slice(0, 12).map(a => `<tr style="cursor:default"><td>${a.t}</td><td>${esc(a.user)}</td><td>${esc(a.module)}</td><td><b>${esc(a.decision)}</b> · ${esc(a.subject)}${a.reason ? `<div class="sub">${esc(a.reason)}</div>` : ''}</td></tr>`).join('')}</tbody></table></div>` : `<p class="note">${esc(T('Записей пока нет.', 'Noch keine Einträge.', 'No entries yet.', 'Жазбалар жоқ.'))}</p>`;
  const cSrc = () => { const er = ERR(), bad = Object.keys(er).filter(k => k.startsWith('params.') || k === 'ai.thr').length;
    return `<div class="card set-card" id="sc-src"><div class="card-head">${tile('file', '', '', 'gray')}<div><h3>${esc(T('Исходные данные и валидация', 'Basisdaten und Validierung', 'Source data & validation', 'Бастапқы деректер және валидация'))}</h3><small>${esc(T('Параметры, которые управляют расчётами; применяются после «Save All Changes»', 'Parameter der Berechnungen; wirken nach „Save All Changes“', 'Parameters that drive the calculations; applied after “Save All Changes”', 'Есептеулерді басқаратын параметрлер; «Save All Changes» кейін қолданылады'))}</small></div><span style="margin-left:auto">${chip(bad ? 'red' : 'green', bad ? T('Ошибок: ', 'Fehler: ', 'Errors: ', 'Қателер: ') + bad : T('Проверка пройдена', 'Validierung ok', 'Validation passed', 'Тексеру өтті'))}</span></div>
<div class="set-body"><div class="set-col"><h5>${esc(T('Приёмка и Standgeld', 'Wareneingang und Standgeld', 'Receiving & Standgeld', 'Қабылдау және Standgeld'))}</h5>
${prm('params.free', T('Бесплатное время разгрузки', 'Freie Entladezeit', 'Free unloading time', 'Тегін түсіру уақыты'), T('Далее начисляется Standgeld', 'Danach fällt Standgeld an', 'Standgeld accrues afterwards', 'Одан кейін Standgeld есептеледі'), T('мин', 'Min.', 'min', 'мин'))}
${prm('params.step', T('Шаг начисления', 'Abrechnungsschritt', 'Billing step', 'Есептеу қадамы'), T('За каждые начатые N минут', 'Je angefangene N Minuten', 'Per started N minutes', 'Басталған әр N минутқа'), T('мин', 'Min.', 'min', 'мин'))}
${prm('params.rate', T('Ставка за шаг', 'Satz je Schritt', 'Rate per step', 'Қадам үшін тариф'), T('Стоимость одного шага', 'Preis eines Schrittes', 'Price of one step', 'Бір қадам құны'), '₸')}</div>
<div class="set-col"><h5>${esc(T('Время вождения (РТО) и налоги', 'Lenkzeit (RTO) und Steuern', 'Driving time (RTO) & tax', 'Жүргізу уақыты (РТО) және салық'))}</h5>
${prm('params.shift', T('Максимум смены', 'Maximale Schicht', 'Maximum shift', 'Ауысымның максимумы'), T('Ориентировочно, сверить с нормами РК (Q5)', 'Richtwert, mit KZ-Normen abgleichen (Q5)', 'Indicative, verify against KZ norms (Q5)', 'Болжамды, ҚР нормаларымен салыстыру (Q5)'), T('ч', 'Std.', 'h', 'сағ'))}
<div class="prm"><span>${esc(T('Ставка НДС', 'MwSt-Satz', 'VAT rate', 'ҚҚС мөлшерлемесі'))}<small>${esc(T('Налоговый кодекс РК — не редактируется', 'Steuergesetz KZ — nicht editierbar', 'KZ tax code — not editable', 'ҚР Салық кодексі — өзгертілмейді'))}</small></span><input class="inp" value="12" disabled><small>%</small></div>
<p class="note" style="margin-top:12px">${esc(T('Пороги уверенности AI и правила допуска (права, медосмотр, поверка) настраиваются выше и в профилях водителей/ТС.', 'KI-Schwellen und Zulassungsregeln (Führerschein, Untersuchung, Kalibrierung) siehe oben und in Fahrer-/Fahrzeugprofilen.', 'AI thresholds and eligibility rules (licence, medical, calibration) are set above and in driver/truck profiles.', 'AI шектері мен рұқсат ережелері жоғарыда және профильдерде баптауға болады.'))}</p></div></div></div>`; };

  SCREENS.settings = {
    title: () => navLabel('settings'),
    sub: () => T('Центр конфигурации и управления', 'Konfigurations- und Governance-Center', 'Company Configuration & Governance Center', 'Конфигурация және басқару орталығы'),
    actions: () => `<span class="dirty${dirty() ? ' on' : ''}" id="dirtyChip"><i class="dot warn"></i>${esc(T('Есть несохранённые изменения', 'Ungespeicherte Änderungen', 'Unsaved changes', 'Сақталмаған өзгерістер'))}</span><button class="btn grey" data-act="cfgExport">${esc(T('Экспорт конфигурации', 'Konfiguration exportieren', 'Export Configuration', 'Конфигурацияны экспорттау'))}</button><button class="btn primary${dirty() ? '' : ' idle'}" data-act="cfgSave">${esc(T('Сохранить всё', 'Alles speichern', 'Save All Changes', 'Барлығын сақтау'))}</button>`,
    body: () => cCompany() + cInteg() + cNotify() + cAI() + cSec() + cSrc(),
  };
  DRAWERS.integ = d => { const x = CFG.cur.integ[d.i]; return { title: x.t, html: `<div class="drawer-section"><div class="ident">${tile(x.ic, '', '', x.tint)}<div><b>${esc(x.p)}</b><div class="sub">${esc(ago(x.m))}</div></div></div><div class="kv"><div><small>${esc(T('Статус', 'Status', 'Status', 'Күйі'))}</small>${chip('green', T('Подключено', 'Verbunden', 'Connected', 'Қосылған'))}</div><div><small>${esc(T('Последняя синхронизация', 'Letzte Synchronisation', 'Last sync', 'Соңғы синхрондау'))}</small><b>${esc(ago(x.m))}</b></div></div></div><div class="drawer-section actbar"><button class="btn primary" data-act="intSync" data-i="${d.i}">${esc(T('Синхронизировать', 'Jetzt synchronisieren', 'Sync now', 'Синхрондау'))}</button><button class="btn red" data-act="intOff" data-i="${d.i}">${esc(T('Отключить', 'Trennen', 'Disconnect', 'Ажырату'))}</button></div>` }; };
  const dl = (name, text, mime) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; a.click(); };
  Object.assign(ACT, {
    cfgT: d => { setp(d.p, !getp(d.p)); render(); },
    cfgS: d => { setp(d.p, d.v); render(); },
    intConn: d => { const x = CFG.cur.integ[+d.i]; x.on = true; x.m = 0; render(); },
    intCfg: d => openDrawer({ type: 'integ', i: +d.i }),
    intSync: d => { CFG.cur.integ[+d.i].m = 0; toast(T('Синхронизация выполнена', 'Synchronisation abgeschlossen', 'Sync completed', 'Синхрондау аяқталды')); },
    intOff: d => { CFG.cur.integ[+d.i].on = false; S.drawer = null; render(); },
    siteAdd: () => { const v = ($('#newsite') || {}).value || ''; if (!v.trim()) return toast(T('Укажите название площадки', 'Standortname angeben', 'Enter a site name', 'Алаң атауын көрсетіңіз'), 'err'); CFG.cur.company.sites.push({ n: v.trim(), lic: T('заявка не подана', 'nicht beantragt', 'not applied', 'өтінім берілмеген'), st: 'pending' }); render(); },
    auditToggle: () => { CFG.auditOpen = !CFG.auditOpen; render(); },
    auditCsv: () => dl('audit-log.csv', '﻿' + [['time', 'user', 'module', 'subject', 'decision', 'reason']].concat(S.audit.map(a => [a.t, a.user, a.module, a.subject, a.decision, a.reason])).map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n'), 'text/csv'),
    cfgExport: () => { dl('olymp-config.json', JSON.stringify({ exportedAt: new Date().toISOString(), lang: LANG, saved: JSON.parse(CFG.saved), unsaved: dirty() ? CFG.cur : null }, null, 2), 'application/json'); },
    cfgSave: () => {
      const e = errors(); if (Object.keys(e).length) { toast(T('Исправьте ошибки: ', 'Fehler beheben: ', 'Fix errors first: ', 'Қателерді түзетіңіз: ') + Object.keys(e).length, 'err'); return; }
      if (!dirty()) return toast(T('Нет изменений', 'Keine Änderungen', 'Nothing to save', 'Өзгеріс жоқ'));
      const was = JSON.parse(CFG.saved), now = CFG.cur, ch = Object.keys(now).filter(k => JSON.stringify(now[k]) !== JSON.stringify(was[k]));
      CFG.saved = JSON.stringify(CFG.cur); apply(); audit('Settings', ch.join(', '), T('Сохранено', 'Gespeichert', 'Saved', 'Сақталды'), '');
      toast(T('Настройки сохранены и применены', 'Einstellungen gespeichert und angewendet', 'Settings saved and applied', 'Баптаулар сақталды және қолданылды'));
    },
  });
  const paint = () => { const c = $('#dirtyChip'); if (c) c.classList.toggle('on', dirty()); const b = $('[data-act=cfgSave]'); if (b) b.classList.toggle('idle', !dirty()); };   // FR-218: "nothing to save" keeps readable contrast (no opacity)
  const read = el => (el.dataset.num ? (el.value === '' ? NaN : +el.value) : el.value);
  document.addEventListener('input', e => {
    const el = e.target, p = el.dataset && el.dataset.cf; if (!p || S.route !== 'settings') return;
    setp(p, read(el));
    if (el.type === 'range') { const o = document.getElementById(el.dataset.live); if (o) o.textContent = el.value + '%'; paint(); } else render();
  });
  document.addEventListener('change', e => { const el = e.target; if (el.type === 'range' && el.dataset.cf && S.route === 'settings') render(); });
  apply();
})();
