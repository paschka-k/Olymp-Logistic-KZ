  alertsAll(load) {
    const s = this.state, L = s.live, out = [];
    VEH.forEach(v => {
      const r = L[v.id];
      if (!v.thermo) return;
      if (v.id === 'V03' && s.sim.fire) { out.push({ lvl: 3, src: 'Безопасность · V03', text: 'V03: ПОЖАР / задымление — датчик дыма, температура груза ' + fmt(r.amb) + ' °C', scr: 'security' }); return; }
      if (r.cold < 2) out.push({ lvl: 3, src: 'Термостатус · ' + v.id, text: v.id + ': риск замерзания в камере 2–8 °C — ' + fmt(r.cold) + ' °C', scr: 'thermo', veh: v.id });
      if (r.cold > 8) out.push({ lvl: 3, src: 'Термостатус · ' + v.id, text: v.id + ': перегрев камеры 2–8 °C — ' + fmt(r.cold) + ' °C', scr: 'thermo', veh: v.id });
      if (r.amb < 15) out.push({ lvl: 2, src: 'Термостатус · ' + v.id, text: v.id + ': камера 15–25 °C остывает — ' + fmt(r.amb) + ' °C', scr: 'thermo', veh: v.id });
      if (v.id === 'V04' && s.door) out.push({ lvl: s.doorSec > 180 ? 2 : 1, src: 'Термостатус · V04', text: 'V04: дверь камеры 2–8 °C открыта ' + Math.round(s.doorSec / 60) + ' мин', scr: 'thermo', veh: 'V04' });
      if (r.out < 0 && v.id === 'V04') out.push({ lvl: 1, src: 'Термостатус · V04', text: 'V04: наружная ' + fmt(r.out) + ' °C — зимний режим, обогрев активен', scr: 'thermo', veh: 'V04' });
    });
    if (s.sim.breakdown) out.push({ lvl: 3, src: 'Партнёры · V01', text: 'V01: техническая поломка (КПП) на трассе Астана–Караганда, км 112 — вызвать сервис ТОО «Сарыарка Авто», Караганда', scr: 'partners' });
    if (s.sim.theft) out.push({ lvl: 3, src: 'Безопасность · V01', text: 'V01: дверь грузового отсека открыта вне точки доставки, пломба нарушена, остановка 22 мин — подозрение на кражу', scr: 'security' });
    TRIPS.filter(r => r.status !== 'done').forEach(r => { const w = this.wxRisk(r); if (w.lvl >= 2) out.push({ lvl: w.lvl, src: 'Погода · ' + r.id, text: r.id + ': ' + w.cond.toLowerCase() + ' — ' + w.city + ', ' + w.day + ', ветер ' + w.wind + ' м/с', scr: 'weather', city: w.city }); });
    if (load.maxLvl >= 2) load.alerts.filter(a => a.lvl >= 2).forEach(a => out.push({ lvl: a.lvl, src: 'Загрузка · R-106', text: a.text, scr: 'load' }));
    [...s.extraInc, ...INC].forEach(i => { const st = s.inc[i.id]; if (st === 'new' || st === 'esc') out.push({ lvl: i.lvl, src: 'Безопасность · ' + i.id, text: i.type + ': ' + i.text, scr: 'security' }); });
    return out.sort((a, b) => b.lvl - a.lvl);
  }

  extra(load, trips) {
    const s = this.state, L = s.live, ok = LV[0], bad = LV[3];
    const docTrips = TRIPS.filter(r => r.status !== 'done');
    const dt = docTrips.find(r => r.id === s.selTrip) || docTrips[docTrips.length - 1];
    const veh = VM[dt.veh], drv = DRV[dt.drv], is106 = dt.id === 'R-106';
    const D = [['order','Приказ / распоряжение на рейс','внутренний приказ логистической компании'],['waybill','Путевой лист','предрейсовый медосмотр водителя и техосмотр ТС'],['ttn','ТТН — товарно-транспортная накладная','грузоотправитель, грузополучатель, места, масса'],['transfer','Накладная на внутреннее перемещение запасов','собственный товар KDL Olymp · хаб → филиал'],['temp','Температурный лист и привязка логгеров','ID логгера к каждой отправке 2–8 °C'],['reg','Регистрационные удостоверения МИ / IVD (копии)','по запросу на постах контроля']];
    if (is106 && load.third.length) D.push(['contract','Договор перевозки / заявка стороннего клиента','сторонний груз · ' + load.third.map(o => o.id).join(', ')],['esf','ЭСФ на услугу перевозки (ИС ЭСФ)','только для стороннего груза'],['snt','СНТ в ИС ЭСФ — если применимо','проверить применимость с юристом РК']);
    if (is106 && load.adr) D.push(['adrdoc','Транспортный документ ДОПОГ','UN-номер, класс, группа упаковки, LQ'],['adrinst','Письменные инструкции ДОПОГ','на языке экипажа: русский / казахский'],['adrcert','Свидетельства ДОПОГ водителя и ТС','О. Петренко до 05.2027 · V02 допущен']);
    (s.hos || []).filter(r => r.trip === dt.id && r.st === 'done').forEach(r => D.push(['ho_' + r.id, 'Акт приёма-передачи партнёру · ' + r.partner, r.id + ' · ' + r.scope], ['hottn_' + r.id, 'ТТН перевозчика · ' + r.partner, 'точка передачи: ' + r.city]));
    D.push(['epod','Акт приёма-передачи (ePOD)','с температурной квитанцией — при доставке']);
    const preReady = ['order','temp','reg','adrcert']; D.forEach(([k]) => { if (k.startsWith('ho')) preReady.push(k); });
    const docs = D.map(([k, name, sub]) => { const key = dt.id + ':' + k, wait = k === 'epod';
      const ready = !wait && (dt.status !== 'plan' || preReady.includes(k) || !!s.docs[key]);
      const dst = s.docSt[key], esf = k === 'esf' || k === 'snt';
      const pdf = () => { const rows = LINES.filter(l => l.trip === dt.id).map(l => '<tr><td>' + l.sscc + '</td><td>' + l.po + '</td><td>' + l.pl + '</td><td>' + l.art + '</td><td>' + l.name + '</td><td>' + l.lot + '</td><td>' + l.exp + '</td><td>' + l.qty + '</td><td>' + TL[l.cls] + '</td></tr>').join('');
        const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + name + '</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin-top:12px}td,th{border:1px solid #444;padding:4px 6px;font-size:11px;text-align:left}p{font-size:12px}</style></head><body><h1>' + name + '</h1><p>Рейс ' + dt.id + ' · ' + dt.route.join(' → ') + ' · ' + veh.id + ' ' + veh.plate + ' · водитель ' + drv.name + '</p><p>Отправитель: ТОО «Olymp Logistic» · Дата: 06.10.2026</p><table><tr><th>SSCC</th><th>PO</th><th>PL</th><th>Артикул</th><th>Товар</th><th>LOT</th><th>Годен до</th><th>Кол-во</th><th>Режим</th></tr>' + rows + '</table><p>Демо-документ. Форма и реквизиты подлежат проверке юристом и налоговым консультантом РК.</p></body></html>';
        try { const u = URL.createObjectURL(new Blob([html], { type: 'text/html' })); window.open(u, '_blank'); } catch (e) {} this.log('Документы · ' + dt.id + ' · PDF: ' + name); this.showToast('Документ «' + name + '» открыт для печати / PDF'); };
      return { name, sub, ready: !wait && ready, canSign: !wait && ready && !dst, canSend: esf && dst === 'signed', pdf,
        sign: () => { this.setState(x => ({ docSt: { ...x.docSt, [key]: 'signed' } })); this.log('ЭЦП · ' + dt.id + ' · ' + name + ' подписан (NCALayer, демо)'); },
        send: () => { this.setState(x => ({ docSt: { ...x.docSt, [key]: 'sent' } })); this.log('ИС ЭСФ · ' + dt.id + ' · ' + name + ' отправлен'); this.showToast(name + ': отправлено в ИС ЭСФ (демо)'); },
        l: wait ? LV[1] : ready ? ok : LV[2], st: wait ? 'при доставке' : dst === 'sent' ? 'отправлен в ИС ЭСФ' : dst === 'signed' ? 'подписан ЭЦП' : ready ? 'готов' : 'не сформирован', can: !wait && !ready,
        gen: () => { this.setState(x => ({ docs: { ...x.docs, [key]: true } })); this.log('Документы · ' + dt.id + ' · сформирован: ' + name); } }; });
    const missing = docs.filter(d => d.can).length;
    const w = this.wxRisk(dt), calibOk = !/истекла/.test(veh.calib);
    const gate = [
      ['Транспорт доступен', (s.vehSt[veh.id] || veh.st) !== 'workshop', veh.id + ' · ' + veh.where],
      ['Подходит по температурному режиму', veh.thermo, veh.thermo ? 'две камеры 2–8 / 15–25 °C' : 'нет термоконтроля'],
      ['Водитель допущен', true, drv.name + ' · режим труда в норме'],
      ['Документы полные', missing === 0, missing ? 'не хватает: ' + missing : 'комплект готов'],
      ['Страховка, налог и техосмотр в порядке', ((FEES[veh.id] || {}).lvl || 0) < 3, (FEES[veh.id] || {}).note || 'ОГПО, КАСКО, налог, техосмотр действуют'],
      ['Места сверены (SSCC = заказ)', !is106 || load.recOk, is106 ? (load.recOk ? 'все места отсканированы' : 'есть недостающие места') : 'сверка при погрузке'],
      ['Логгер откалиброван', calibOk, 'калибровка: ' + veh.calib],
      ['ДОПОГ выполнен', !(is106 && load.adr) || (veh.adr && !!drv.adr), is106 && load.adr ? 'ТС и водитель допущены' : 'опасного груза нет'],
      ['Маршрут одобрен по погоде', w.lvl < 3, w.lvl ? w.cond + ' · ' + w.city + ', ' + w.day : 'без ограничений']
    ].map(([label, pass, text]) => ({ label, text, l: pass ? ok : bad, mark: pass ? 'ДА' : 'НЕТ' }));
    const goOk = gate.every(g => g.mark === 'ДА'), released = !!s.released[dt.id] || dt.status !== 'plan';
    const docTripChips = docTrips.map(r => ({ id: r.id, sub: r.route.join(' → '), select: () => this.setState({ selTrip: r.id }), bc: r.id === dt.id ? 'var(--color-accent-700)' : 'var(--color-divider)', bg: r.id === dt.id ? 'var(--color-accent-100)' : 'transparent' }));

    const QSTEPS = ['Тревога зафиксирована','Диспетчер проверил','СБ проверила','Решение ответственного за качество','Товар допущен / заблокирован','Клиент уведомлён','CAPA оформлена'];
    const devs = [];
    devs.push({ id:'DEV-0011', lvl:3, title:'Партнёр PL-10 «Сырдария Транс»: +14 °C, потеря партии', text:'Кызылорда · партнёр заблокирован до закрытия CAPA', capa:'Аудит партнёра, повторная валидация рефтранспорта, обучение GDP; снятие блокировки только после закрытия CAPA.' });
    devs.push({ id:'CAPA-0019', lvl:2, title:'Партнёр PW-08 «Ертіс Авто»: повторный некачественный ремонт', text:'Павлодар · сервис заблокирован', capa:'Рекламация, аудит мастерской, контрольный ремонт под наблюдением; снятие блокировки после закрытия CAPA.' });
    if (s.sim.freeze) devs.push({ id:'DEV-SIM-F', lvl:3, title:'Замерзание 2–8 °C · V04 · R-102', text:'Камера ' + fmt(L.V04.cold) + ' °C, наружная −3 °C, отказ обогрева', capa:'Предрейсовая проверка режима обогрева при наружной < +5 °C; резервные термобоксы на борту.' });
    if (s.sim.overheat) devs.push({ id:'DEV-SIM-O', lvl:3, title:'Перегрев 2–8 °C · V01 · R-103', text:'Камера ' + fmt(L.V01.cold) + ' °C, обогрев не отключается', capa:'Сервис агрегата, проверка логики уставок; тревога при разнице камеры и уставки > 3 °C.' });
    if ((s.thc || {})['TH-02']) devs.push({ id:'DEV-0041', lvl:2, title: X('Термохрон 15–25 °C ниже +15 °C · V03 · R-105','Thermochron 15–25 °C unter +15 °C · V03 · R-105','Thermochron 15–25 °C below +15 °C · V03 · R-105'), text: X('TH-02: 38 мин при 13,6–15 °C, Cellpack DCL, Талдыкорган','TH-02: 38 Min. bei 13,6–15 °C, Cellpack DCL, Taldykorgan','TH-02: 38 min at 13.6–15 °C, Cellpack DCL, Taldykorgan'), capa: X('Утеплённый термоконтейнер для 15–25 °C зимой; приёмка без открытия двери > 3 мин.','Isolierter Thermocontainer für 15–25 °C im Winter; Annahme ohne Türöffnung > 3 Min.','Insulated container for 15–25 °C in winter; receipt without door open > 3 min.') });
    devs.push({ id:'DEV-0033', lvl:2, title:'Калибровка логгера истекла · V01 · R-103', text:'Логгер L-2208 — калибровка до 09.2026; рейс в пути', capa:'Блокировка выпуска при истёкшей калибровке (Go/No-Go), замена логгера в Алматы.' });
    devs.push({ id:'DEV-0029', lvl:1, title:'Краткое превышение +9,1 °C · R-098 · Шымкент', text:'14 мин при выгрузке, логгер L-2141', capa:'Предохлаждение камеры перед загрузкой, выгрузка 2–8 °C первой.', done:true });
    const selDev = devs.find(d => d.id === s.qaSel) || devs[0];
    const q = s.qa[selDev.id] || (selDev.done ? { step: 7, decision: 'release' } : { step: 1, decision: null });
    const setQ = v => this.setState(x => ({ qa: { ...x.qa, [selDev.id]: { ...q, ...v } } }));
    const qaSteps = QSTEPS.map((t, i) => ({ n: i + 1, t: i === 4 && q.decision ? (q.decision === 'release' ? 'Товар допущен' : 'Товар заблокирован (карантин)') : t,
      fill: i < q.step ? 'var(--color-accent)' : 'transparent', fg: i < q.step ? 'var(--color-bg)' : i === q.step ? 'var(--color-accent-800)' : 'var(--color-neutral-600)', bc: i <= q.step ? 'var(--color-accent)' : 'var(--color-divider)', tfg: i <= q.step ? 'var(--color-text)' : 'var(--color-neutral-600)' }));
    const atDecision = q.step === 3;
    const LOG = VEH.filter(v => v.thermo).map((v, i) => ({ id: 'L-22' + String(i + 1).padStart(2, '0'), veh: v.id, calib: v.calib, l: /истекла/.test(v.calib) ? bad : /11\.2026/.test(v.calib) ? LV[1] : ok,
      st: /истекла/.test(v.calib) ? 'ИСТЕКЛА' : /11\.2026/.test(v.calib) ? 'истекает' : 'действительна' }));

    const STL = { line: 'на линии', hub: 'на хабе', reserve: 'резерв', workshop: 'сервис' };
    const FL = s.fleetX ? VEH.concat(VEH_X) : VEH;
    const fleet = FL.map(v => { const west = v.thermo && /HOWO/.test(v.model) && !CAL_RX.test(v.calib) && v.st !== 'workshop';
      const fe = FEES[v.id] || {}; return { ...v, fe, feeL: LV[fe.lvl || 0], feeSt: fe.lvl >= 3 ? X('блокирует выпуск','blockiert Freigabe','blocks release') : fe.lvl === 2 ? X('требует действий','Handlung nötig','action needed') : fe.lvl === 1 ? X('скоро срок','Frist naht','due soon') : X('в порядке','in Ordnung','OK'), hasNote: !!fe.note, stLabel: STL[s.vehSt[v.id] || v.st], chambers: !v.thermo ? X('без термоконтроля','ohne Temperaturführung','no temperature control') : v.regimes ? v.regimes : v.active ? X('активный холод · 2–8 / 15–25 / −20 °C','aktive Kühlung · 2–8 / 15–25 / −20 °C','active cooling · 2–8 / 15–25 / −20 °C') : X('изотерм · термоконтейнеры 2–8 °C','Isotherm · Thermocontainer 2–8 °C','isothermal · thermo containers 2–8 °C'), adrL: v.adr ? X('да','ja','yes') : '—', west: west ? X('допуск','Freigabe','approved') : X('нет','nein','no'), westL: west ? ok : LV[1],
        winter: !v.thermo ? X('зимние шины','Winterreifen','winter tyres') : v.demo ? X('зимние шины, автономный отопитель','Winterreifen, Standheizung','winter tyres, parking heater') : X('зимние шины, цепи, утеплённые термоконтейнеры','Winterreifen, Ketten, isolierte Thermocontainer','winter tyres, chains, insulated thermo containers'), stLabel: STL[s.vehSt[v.id] || v.st] + (v.demo ? X(' · демо',' · Demo',' · demo') : ''), calibL: CAL_RX.test(v.calib) ? bad : ok }; });
    const fleetSum = [[X('Всего ТС','Fahrzeuge gesamt','Vehicles total'), FL.length], [X('HOWO T5G · активный холод','HOWO T5G · aktive Kühlung','HOWO T5G · active cooling'), FL.filter(v => v.active && /HOWO/.test(v.model)).length], [X('HOWO T5G · изотерм','HOWO T5G · Isotherm','HOWO T5G · isothermal'), FL.filter(v => /HOWO/.test(v.model) && !v.active).length], [X('JAC N120 · изотерм','JAC N120 · Isotherm','JAC N120 · isothermal'), FL.filter(v => /JAC/.test(v.model)).length], [X('Без активного холода','Ohne aktive Kühlung','Without active cooling'), FL.filter(v => v.thermo && !v.active).length], [X('На линии','Auf Tour','On the road'), FL.filter(v => v.st === 'line').length]].concat(s.fleetX ? [[X('Рефрижераторы 7,5–12,5 т','Kühlfahrzeuge 7,5–12,5 t','Reefers 7.5–12.5 t'), FL.filter(v => v.demo && v.thermo).length], [X('Без термоконтроля','Ohne Temperaturführung','No temperature control'), FL.filter(v => !v.thermo).length]] : []).map(([label, value]) => ({ label, value: String(value) }));

    const DS = ['Прибытие', 'Температура', 'Фото', 'Подпись', 'Готово'];
    const ds = s.drvStep;
    return {
      docTripChips, docTrip: { id: dt.id, route: dt.route.join(' → '), veh: veh.id + ' · ' + veh.plate + ' · ' + veh.cls, drv: drv.name }, docs, gate, missing,
      releaseLabel: released ? 'Рейс выпущен' : goOk ? 'Выпустить рейс' : 'Выпуск заблокирован', releaseOp: released || !goOk ? 0.5 : 1,
      release: () => { if (released || !goOk) return; this.setState(x => ({ released: { ...x.released, [dt.id]: true } })); this.log('Go/No-Go · ' + dt.id + ' выпущен'); this.showToast(dt.id + ' выпущен: все проверки пройдены'); },
      genAll: () => { const add = {}; D.forEach(([k]) => { if (k !== 'epod') add[dt.id + ':' + k] = true; }); this.setState(x => ({ docs: { ...x.docs, ...add } })); this.log('Документы · ' + dt.id + ' · комплект сформирован'); this.showToast('Комплект документов ' + dt.id + ' сформирован (демо)'); },
      devs: devs.map(d => ({ ...d, l: LV[d.done ? 0 : d.lvl], select: () => this.setState({ qaSel: d.id }), bc: d.id === selDev.id ? 'var(--color-accent-700)' : 'var(--color-divider)', bg: d.id === selDev.id ? 'var(--color-accent-100)' : 'transparent' })),
      dev: selDev, qaSteps, atDecision, canNext: q.step < 7 && !atDecision, qaDone: q.step >= 7,
      qaNext: () => { setQ({ step: q.step + 1 }); this.log('Качество · ' + selDev.id + ' · ' + QSTEPS[q.step]); },
      qaRelease: () => { setQ({ step: 5, decision: 'release' }); this.log('Качество · ' + selDev.id + ' · товар допущен'); },
      qaBlock: () => { setQ({ step: 5, decision: 'block' }); this.log('Качество · ' + selDev.id + ' · товар заблокирован'); },
      loggers: LOG, orderCalib: () => this.showToast('Заявка на калибровку L-2208 отправлена в лабораторию (демо)'),
      fleet, fleetSum, fleetXOn: !!s.fleetX, fleetXLabel: s.fleetX ? X('Только реальный парк · 4 ТС','Nur reale Flotte · 4 Fahrzeuge','Real fleet only · 4 vehicles') : X('Показать расширенный парк · +' + VEH_X.length + ' ТС','Erweiterte Flotte zeigen · +' + VEH_X.length + ' Fahrzeuge','Show extended fleet · +' + VEH_X.length + ' vehicles'), toggleFleetX: () => this.setState(x => ({ fleetX: !x.fleetX })),
      drvSteps: DS.map((t, i) => ({ t, bg: i <= ds ? 'var(--color-accent)' : 'var(--color-neutral-200)' })),
      dIs: Object.fromEntries(DS.map((_, i) => ['s' + i, ds === i])),
      drvCold: fmt(L.V01.cold) + ' °C', drvAmb: fmt(L.V01.amb) + ' °C', drvColdOk: L.V01.cold >= 2 && L.V01.cold <= 8 ? 'в норме' : 'ОТКЛОНЕНИЕ',
      drvNext: () => { const n = Math.min(4, (this.state.drvStep || 0) + 1); this.setState({ drvStep: n }); if (n === 4) { this.dEv('disp', X('ePOD Караганда: 2 места, подпись Г. Абдрахмановой, фото','ePOD Karaganda: 2 Stücke, Unterschrift G. Abdrachmanowa, Foto','ePOD Karaganda: 2 items, signed by G. Abdrakhmanova, photo')); this.dEv('docs', X('Акт приёма-передачи R-103 / Караганда сформирован','Übergabeprotokoll R-103 / Karaganda erstellt','Receipt note R-103 / Karaganda created')); } }, drvReset: () => this.setState({ drvStep: 0 })
    };
  }
