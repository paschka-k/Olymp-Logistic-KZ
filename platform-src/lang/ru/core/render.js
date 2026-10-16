  renderVals() {
    const s = this.state, L = s.live;
    const hubOk = h => s.hub === 'all' || s.hub === h;
    const load = this.loadCalc();
    const alerts = this.alertsAll(load);
    const crit = alerts.filter(a => a.lvl >= 2).length;
    const nav0 = NAV.find(n => n[0] === s.screen);
    const badges = { baseline: BLV.filter(v => v.lvl >= 3).length, overview: alerts.filter(a => a.lvl >= 2).length, thermo: alerts.filter(a => a.scr === 'thermo' && a.lvl >= 2).length, weather: alerts.filter(a => a.scr === 'weather').length, security: alerts.filter(a => a.scr === 'security').length, load: load.maxLvl >= 2 ? load.alerts.filter(a => a.lvl >= 2).length : 0 };
    const nav = NAV.map(([id, , label], i) => { const code = String(i + 1).padStart(2, '0'); const on = id === s.screen, b = badges[id] || 0;
      return { code, label, go: () => this.go(id), bg: on ? 'var(--color-accent-100)' : 'transparent', fg: on ? 'var(--color-accent-900)' : 'var(--color-text)', hasBadge: b > 0, badge: b,
        badgeBg: 'oklch(0.55 0.19 27)', badgeFg: 'var(--color-bg)' }; });
    const seg = (cur, val) => ({ bg: cur === val ? 'var(--color-accent)' : 'transparent', fg: cur === val ? 'var(--color-bg)' : 'var(--color-text)' });
    const hubOpts = [['all', 'Все хабы'], ['ast', 'Астана'], ['alm', 'Алматы']].map(([k, label]) => ({ label, go: () => this.setState({ hub: k }), ...seg(s.hub, k) }));

    const trips = TRIPS.filter(r => hubOk(r.hub)).map(r => {
      const status = r.id === 'R-106' && s.sent[r.id] ? 'loading' : r.status;
      const w = this.wxRisk(r), day = this.tripDay(r);
      const dep = r.id === 'R-106' && day !== r.day ? '10.10 · 06:00' : r.dep, eta = r.id === 'R-106' && day !== r.day ? '11.10 · 14:00' : r.eta;
      const stl = status === 'done' ? LV[0] : status === 'transit' ? LV[1] : LV[0];
      return { ...r, status, dep, eta, w, routeStr: r.route.join(' → '), pct: Math.round(r.prog * 100) + '%', statusLabel: STATUS[status], st: stl,
        open: () => this.setState({ screen: 'dispatch', selTrip: r.id }), select: () => this.setState({ selTrip: r.id }),
        bc: r.id === s.selTrip ? 'var(--color-accent-700)' : 'var(--color-divider)', bg: r.id === s.selTrip ? 'var(--color-accent-100)' : 'transparent',
        hasIssue: w.lvl >= 2 || (r.id === 'R-106' && load.maxLvl >= 2), issue: LV[Math.max(w.lvl, r.id === 'R-106' ? load.maxLvl : 0)],
        issueText: w.lvl >= 2 ? 'Погода: ' + w.cond.toLowerCase() + ' · ' + w.city : 'Загрузка: проверить' };
    });
    const board = ['plan', 'loading', 'transit', 'done'].map(k => { const list = trips.filter(r => r.status === k); return { label: STATUS[k], count: list.length, trips: list }; });

    const T0 = TRIPS.find(r => r.id === s.selTrip), cold0 = LINES.some(l => l.trip === T0.id && l.cls !== 'amb');
    const wsNear = PARTNERS.filter(p => p.type === 'ws' && p.tier !== 'blocked' && T0.route.includes(p.city)).sort((a, b) => (cold0 ? (b.reefer ? 1 : 0) - (a.reefer ? 1 : 0) : 0) || T0.route.indexOf(a.city) - T0.route.indexOf(b.city) || TIER[b.tier].rank - TIER[a.tier].rank)[0];
    const T = TRIPS.find(r => r.id === s.selTrip), tw = this.wxRisk(T), tDay = this.tripDay(T), drv = DRV[T.drv], veh = VM[T.veh];
    const checks = [];
    if (T.id === 'R-106') checks.push({ lvl: load.maxLvl >= 3 ? 3 : load.maxLvl, label: 'Вместимость', text: fmt(load.coldPal + load.ambPal, 0) + ' / ' + veh.pal + ' паллет, ' + fmt(load.m3, 1) + ' м³, ' + fmt(load.kg, 0) + ' кг' });
    else checks.push({ lvl: 0, label: 'Вместимость', text: T.pal + ' паллет' });
    checks.push({ lvl: 0, label: X('Температурные классы','Temperaturklassen','Temperature classes'), text: veh.active ? X('активный холод Carrier: 2–8 / 15–25 / −20 °C','aktive Kühlung Carrier: 2–8 / 15–25 / −20 °C','active Carrier cooling: 2–8 / 15–25 / −20 °C') : X('изотерм: 2–8 °C в термоконтейнерах с логгерами ≤ 48 ч, 15–25 °C в кузове (FR-39)','Isotherm: 2–8 °C in Thermocontainern mit Logger ≤ 48 h, 15–25 °C im Koffer (FR-39)','isothermal: 2–8 °C in thermo containers with loggers ≤ 48 h, 15–25 °C in the body (FR-39)') });
    if (T.id === 'R-106') checks.push({ lvl: load.adr ? (veh.adr && drv.adr ? 1 : 3) : 0, label: 'ДОПОГ', text: load.adr ? 'опасный груз (LQ, UN 1845): машина и водитель допущены' : 'нет опасных грузов' });
    else checks.push({ lvl: 0, label: 'ДОПОГ', text: veh.adr ? 'машина допущена' : 'без опасных грузов' });
    checks.push({ lvl: tw.lvl, label: 'Погода', text: tw.lvl ? tw.cond + ' · ' + tw.city + ', ' + tw.day + ', ' + sg(tw.min) + ' °C, ветер ' + tw.wind + ' м/с' : 'без ограничений' });
    checks.push({ lvl: /истекла/.test(veh.calib) || ((FEES[veh.id] || {}).lvl || 0) >= 3 ? 3 : ((FEES[veh.id] || {}).lvl || 0) === 2 ? 1 : 0, label: 'Логгер и страховка', text: /истекла/.test(veh.calib) ? 'калибровка логгера ' + veh.calib + ' — выпуск заблокирован' : (FEES[veh.id] || {}).note || 'калибровка и ОГПО действуют' });
    checks.push({ lvl: T.km > 700 ? 1 : 0, label: 'Режим труда', text: T.km > 700 ? T.km + ' км — ночёвка или второй водитель' : 'в пределах дневной нормы' });
    { const mn = Math.min(...T.route.map(c => ((WX[c] || [])[Math.min(6, tDay)] || { min: 99 }).min)); checks.push({ lvl: mn <= -45 ? 3 : mn <= -35 ? 2 : 0, label: X('Мороз −45 °C','Frost −45 °C','Frost −45 °C'), text: mn <= -45 ? X('прогноз ' + sg(mn) + ' °C — движение запрещено, выпуск заблокирован (E19)','Prognose ' + sg(mn) + ' °C — Fahrverbot, Freigabe gesperrt (E19)','forecast ' + sg(mn) + ' °C — driving prohibited, release blocked (E19)') : X('минимум на маршруте ' + sg(mn) + ' °C · порог −45 °C (E19)','Minimum auf der Route ' + sg(mn) + ' °C · Schwelle −45 °C (E19)','route minimum ' + sg(mn) + ' °C · threshold −45 °C (E19)') }); }
    { const m = /(\d{2}):(\d{2})\s*$/.exec(T.eta || ''), h = m ? +m[1] + +m[2] / 60 : 12, out = h < 9 || h > 17, hm = m ? m[1] + ':' + m[2] : '—'; checks.push({ lvl: out ? 1 : 0, label: X('Окно склада 9–17','Lagerfenster 9–17','Warehouse window 9–17'), text: out ? X('прибытие ' + hm + ' вне окна — выгрузка с 09:00 (F22)','Ankunft ' + hm + ' außerhalb — Entladung ab 09:00 (F22)','arrival ' + hm + ' outside the window — unloading from 09:00 (F22)') : X('прибытие ' + hm + ' в окне 9:00–17:00','Ankunft ' + hm + ' im Fenster 9:00–17:00','arrival ' + hm + ' within 9:00–17:00') }); }
    if (LINES.some(l => l.trip === T.id && l.adr)) checks.push({ lvl: 0, label: X('ДОПОГ-ответственный','Gefahrgutbeauftragter','DG safety adviser'), text: X('Н. Абенов (D7) · регламент СМК по ДОПОГ (Q101/Q109)','N. Abenow (D7) · QMS-Regelung ADR (Q101/Q109)','N. Abenov (D7) · QMS ADR procedure (Q101/Q109)') });
    const sent = !!s.sent[T.id], canSend = T.status === 'plan' || T.status === 'loading';
    const trip = { ...T, routeStr: T.route.join(' → '), dep: trips.find(r => r.id === T.id)?.dep ?? T.dep, eta: trips.find(r => r.id === T.id)?.eta ?? T.eta,
      vehStr: veh.id + ' · ' + veh.plate + ' · ' + veh.model + ' · ' + veh.cls, drvStr: drv.name + (drv.adr ? ' · ДОПОГ' : ''), chambers: '2–8 °C (' + fmt(L[veh.id].cold) + ') · 15–25 °C (' + fmt(L[veh.id].amb) + ')',
      stops: T.route.map((c, i) => { const w = WX[c][Math.min(6, tDay + (i > 1 ? 1 : 0))]; const passed = i === 0 ? T.prog > 0 : T.prog >= i / (T.route.length - 1);
        return { name: c + (i === 0 ? ' · хаб' : ''), fill: passed ? 'var(--color-accent)' : 'transparent', info: sg(w.max) + '/' + sg(w.min) + ' °C · ' + w.cond }; }),
      checks: checks.map(c => ({ ...c, l: LV[c.lvl] })),
      sendLabel: !canSend ? 'Путевой лист отправлен' : sent ? 'Путевой лист отправлен ✓' : 'Отправить путевой лист',
      sendOp: !canSend || sent ? 0.55 : 1,
      send: () => { if (!canSend || sent) return; this.setState(st => ({ sent: { ...st.sent, [T.id]: true } })); this.log('Диспетчер · путевой лист ' + T.id + ' отправлен водителю'); this.showToast('Путевой лист ' + T.id + ' отправлен в приложение водителя'); },
      canReplan: T.id === 'R-106' && tw.lvl >= 2 && tDay === T.day,
      replan: () => { this.setState(st => ({ tripDay: { ...st.tripDay, 'R-106': 4 } })); this.log('Диспетчер · R-106 перенесён на 10.10 из-за бурана'); this.showToast('R-106 перенесён на 10.10 · филиалы Костанай и Актобе уведомлены'); },
      hasLoad: T.id === 'R-106' };

    const orders = ORD.map(o => ({ ...o, clsLabel: TL[o.cls], palLabel: o.pal ? fmt(o.pal, 0) : 'бокс', m3s: fmt(o.m3, 1), box: s.ord[o.id] ? 'var(--color-accent)' : 'transparent',
      toggle: () => this.setState(st => ({ ord: { ...st.ord, [o.id]: !st.ord[o.id] } })) }));
    const openOrders = ORD.filter(o => !s.ord[o.id] && hubOk('ast')).map(o => ({ ...o, clsLabel: TL[o.cls], palLabel: o.pal ? o.pal + ' пал.' : 'бокс',
      add: () => { this.setState(st => ({ ord: { ...st.ord, [o.id]: true } })); this.showToast(o.id + ' добавлен в R-106 — проверьте загрузку'); } }));

    const vehs = VEH.filter(v => hubOk(v.hub));
    const vehChips = vehs.map(v => { const r = L[v.id], l = LV[this.thermoLvl(v, L)];
      return { id: v.id, plate: v.plate, where: v.where, temps: v.thermo ? fmt(r.cold) + ' · ' + fmt(r.amb) + ' · нар. ' + fmt(r.out) + ' °C' : 'без термоконтроля · нар. ' + fmt(r.out) + ' °C', l, select: () => this.setState({ selVeh: v.id }),
        bc: v.id === s.selVeh ? 'var(--color-accent-700)' : 'var(--color-divider)', bg: v.id === s.selVeh ? 'var(--color-accent-100)' : 'transparent' }; });
    const sv = VM[s.selVeh], sr = L[sv.id];
    const simOn = Object.keys(SIMS).find(k => s.sim[k] && SIMS[k].veh === sv.id), fail = simOn === 'freeze';
    const unitTxt = { freeze: ' · ОШИБКА H-21: нет обогрева', overheat: ' · ОШИБКА: обогрев не отключается', fire: ' · ДАТЧИК ДЫМА: пожар', theft: ' · в работе' };
    const y = t => (160 - (t + 15) / 50 * 160);
    const pts = a => a.map((t, i) => (i * 480 / 47).toFixed(1) + ',' + y(t).toFixed(1)).join(' ');
    const coldL = sr.cold < 2 || sr.cold > 8 ? 3 : 0, ambL = sr.amb < 15 || sr.amb > 25 ? 2 : 0, outL = sr.out < -25 ? 3 : sr.out < -10 ? 2 : sr.out < 0 ? 1 : 0;
    const th = { id: sv.id,
      readouts: sv.active ? [
        { label: X('Камера 1 · 2–8 °C','Kammer 1 · 2–8 °C','Chamber 1 · 2–8 °C'), value: fmt(sr.cold) + ' °C', sub: X('Уставка +5 °C · ','Sollwert +5 °C · ','Setpoint +5 °C · ') + (fail ? X('обогрев: НЕТ ОТКЛИКА','Heizung: KEINE REAKTION','heating: NO RESPONSE') : sr.out < 4 ? X('режим: обогрев','Modus: Heizen','mode: heating') : X('режим: охлаждение','Modus: Kühlen','mode: cooling')), l: LV[coldL] },
        { label: X('Камера 2 · 15–25 °C','Kammer 2 · 15–25 °C','Chamber 2 · 15–25 °C'), value: fmt(sr.amb) + ' °C', sub: X('Уставка +20 °C · ','Sollwert +20 °C · ','Setpoint +20 °C · ') + (sr.out < 15 ? X('режим: обогрев','Modus: Heizen','mode: heating') : X('режим: вентиляция','Modus: Lüften','mode: ventilation')), l: LV[ambL] },
        { label: X('Наружная','Außen','Outside'), value: fmt(sr.out) + ' °C', sub: sv.where + X(' · датчик ТС + прогноз',' · Fahrzeugsensor + Prognose',' · vehicle sensor + forecast'), l: LV[outL] }
      ] : [
        { label: X('Термоконтейнеры 2–8 °C · логгеры','Thermocontainer 2–8 °C · Logger','Thermo containers 2–8 °C · loggers'), value: fmt(sr.cold) + ' °C', sub: X('пассивно: хладоэлементы +4 °C, ≤ 48 ч в пути (B8) · ','passiv: Kühlakkus +4 °C, ≤ 48 h unterwegs (B8) · ','passive: ice packs +4 °C, ≤ 48 h in transit (B8) · ') + (fail ? X('ТЕМПЕРАТУРА ПАДАЕТ — кузов не отапливается','TEMPERATUR FÄLLT — Koffer unbeheizt','TEMPERATURE FALLING — body is unheated') : X('в норме','normal','normal')), l: LV[coldL] },
        { label: X('Кузов изотерм · 15–25 °C','Isothermkoffer · 15–25 °C','Isothermal body · 15–25 °C'), value: fmt(sr.amb) + ' °C', sub: X('без агрегата · датчик Wialon','ohne Aggregat · Wialon-Sensor','no unit · Wialon sensor'), l: LV[ambL] },
        { label: X('Наружная','Außen','Outside'), value: fmt(sr.out) + ' °C', sub: sv.where + X(' · датчик ТС + прогноз',' · Fahrzeugsensor + Prognose',' · vehicle sensor + forecast'), l: LV[outL] }
      ],
      bandColdY: y(8).toFixed(1), bandColdH: (y(2) - y(8)).toFixed(1), bandAmbY: y(25).toFixed(1), bandAmbH: (y(15) - y(25)).toFixed(1), zeroY: y(0).toFixed(1),
      ptsCold: pts(sr.hist.cold), ptsAmb: pts(sr.hist.amb), ptsOut: pts(sr.hist.out),
      status: [
        { k: 'Машина', v: sv.plate + ' · ' + sv.model + ' · ' + sv.cls }, { k: 'Агрегат', v: sv.thermo ? sv.unit + (simOn ? unitTxt[simOn] : ' · в работе') : 'нет' },
        { k: 'Дверь камеры', v: sv.id === 'V04' && s.door ? 'ОТКРЫТА · ' + Math.round(s.doorSec / 60) + ' мин' : simOn === 'theft' ? 'ОТКРЫТА вне точки доставки · пломба нарушена' : 'закрыта · пломба цела' },
        { k: 'Логгеры', v: '2 онлайн · передача каждые 2 мин' }, { k: 'Топливо агрегата', v: '72 %' }, { k: 'Калибровка логгера', v: sv.calib }
      ] };

    const wxN = s.wxDays;
    const cities = CITY.filter(c => hubOk(c[1]));
    const wxRows = cities.map(([n, hub]) => ({ city: n, hubLabel: hub === 'ast' ? 'Астана' : 'Алматы', bg: n === s.selCity ? 'var(--color-accent-100)' : 'transparent', select: () => this.setState({ selCity: n }),
      cells: WX[n].slice(0, wxN).map(w => ({ temp: sg(w.max) + ' / ' + sg(w.min) + '°', cond: w.cond, wind: w.wind + ' м/с', l: LV[w.lvl] })) }));
    const cHub = (CITY.find(c => c[0] === s.selCity) || CITY[0])[1];
    const wxCity = { city: s.selCity, hubLabel: HUBL[cHub], days: WX[s.selCity].slice(0, wxN).map((w, i) => ({ day: DAYS[i], temp: sg(w.max) + '/' + sg(w.min) + ' °C', cond: w.cond, wind: w.wind + ' м/с', l: LV[w.lvl] })) };
    const routeWx = trips.filter(r => r.status !== 'done').map(r => ({ id: r.id, l: LV[r.w.lvl], text: r.w.lvl ? r.w.city + ' · ' + r.w.day + ' · ' + r.w.cond.toLowerCase() : r.routeStr + ' · без ограничений', open: () => this.setState({ screen: 'dispatch', selTrip: r.id }) }));

    const simInc = Object.keys(SIMS).filter(k => s.sim[k]).map(k => ({ id: 'SIM-' + k.toUpperCase(), lvl: 3, time: 'сейчас', type: SIMS[k].title, text: SIMS[k].where + ' · симуляция' }));
    const allInc = [...simInc, ...s.extraInc, ...INC];
    const stLabel = { new: 'новый', ack: 'принят · в работе', esc: 'эскалирован · начальник СБ', closed: 'закрыт' };
    const setInc = (i, st, verb) => { this.setState(x => ({ inc: { ...x.inc, [i.id]: st } })); this.log('Служба безопасности · ' + i.id + ' ' + verb); };
    const incidents = allInc.map(i => { const st = s.inc[i.id] ?? 'new';
      return { ...i, l: st === 'closed' ? LV[0] : LV[i.lvl], statusLabel: stLabel[st], canAck: st === 'new', canEsc: st === 'new' || st === 'ack', canClose: st !== 'closed',
        ack: () => setInc(i, 'ack', 'принят'), esc: () => setInc(i, 'esc', 'эскалирован'), close: () => setInc(i, 'closed', 'закрыт') }; });
    const openInc = allInc.filter(i => (s.inc[i.id] ?? 'new') !== 'closed').length;

    const sc = s.scen;
    const need = [5, 6, 6, 6, 5, 2, 5].map((n, d) => { let x = sc.peak ? Math.ceil(n * 1.3) : n; if (sc.buran && (d === 2 || d === 3)) x -= 1; if (sc.buran && d === 4) x += 2; return x; });
    const avail = [6, 6, 6, 6, 6, 6, 6].map((n, d) => n - (sc.repair && d <= 2 ? 1 : 0) - (d === 3 ? 1 : 0));
    const drvAvail = [8, 8, 7, 7, 6, 6, 8];
    const gap = need.map((n, d) => n - avail[d]);
    const planRows = [
      { label: 'Требуется машин', cells: need.map(v => ({ v, l: LV[0] })) },
      { label: 'Доступно машин', cells: avail.map((v, d) => ({ v: v + (d === 3 ? ' · ТО V03' : ''), l: LV[0] })) },
      { label: 'Резерв / дефицит', cells: gap.map(g => ({ v: g > 0 ? '−' + g : '+' + (-g), l: LV[g > 0 ? 3 : g === 0 ? 1 : 0] })) },
      { label: 'Водители доступны', cells: drvAvail.map((v, d) => ({ v, l: LV[v < need[d] + 1 ? 2 : 0] })) },
      { label: 'Погодный риск (запад)', cells: DAYS.map((_, d) => { const lv = Math.max(WX['Костанай'][d].lvl, WX['Актобе'][d].lvl); return { v: LV[lv].label, l: LV[lv] }; }) }
    ];
    const recs = [];
    gap.forEach((g, d) => { if (g > 0) recs.push(DAYS[d] + ': дефицит ' + g + ' маш. — подключить субподрядчика по рамочному договору (S130).'); });
    if (sc.buran) recs.push('Буран 08–09.10 на западе: рейс R-106 перенести на 10.10, филиалам Костанай и Актобе — запас на 2 дня.');
    if (sc.repair) recs.push('V01 в ремонте до 08.10: магистраль Астана–Алматы выполняет V02, западный рейс сдвигается.');
    if (sc.peak) recs.push('Пик +30 %: объединить Кокшетау и Петропавловск в один рейс, догрузить обратные плечи (P85, P91).');
    if (!recs.length) recs.push('Мощности достаточно на 7 дней. Резерв — 1 машина в Астане.');
    const scenarios = [['buran', 'Буран на западе 08–09.10', 'Закрытие трассы Костанай–Актобе (прогноз)'], ['repair', 'V01 в ремонте 06–08.10', 'Внеплановый ремонт агрегата'], ['peak', 'Пик объёма +30 %', 'Конец квартала / сезон заболеваний']]
      .map(([k, label, sub]) => ({ label, sub, box: sc[k] ? 'var(--color-accent)' : 'transparent', bc: sc[k] ? 'var(--color-accent)' : 'var(--color-divider)', bg: sc[k] ? 'var(--color-accent-100)' : 'transparent',
        toggle: () => this.setState(x => ({ scen: { ...x.scen, [k]: !x.scen[k] } })) }));

    const bars = (arr, max) => arr.map((v, i) => ({ h: Math.max(8, v / max * 100).toFixed(0) + '%', c: i === arr.length - 1 ? 'var(--color-accent-700)' : 'var(--color-accent-300)' }));
    const repKpis = [
      { label: 'OTIF', value: '96,4 %', sub: 'цель SLA ≥ 95 % · 8 недель', bars: bars([93, 94, 95, 94, 96, 95, 97, 96], 100) },
      { label: 'Температурное соответствие', value: '99,6 %', sub: 'отправок без отклонений', bars: bars([98, 99, 99, 98, 100, 99, 100, 99.6], 100) },
      { label: 'Загрузка по объёму', value: '81 %', sub: 'по весу — 37 %', bars: bars([70, 74, 76, 79, 77, 80, 82, 81], 100) },
      { label: 'Порожний пробег', value: '38 %', sub: 'цель < 30 % через догрузку', bars: bars([46, 45, 43, 42, 41, 40, 39, 38], 50) },
      { label: 'Стоимость паллеты', value: '18 400 ₸', sub: 'в среднем по сети', bars: bars([21, 20.5, 20, 19.6, 19.1, 18.9, 18.6, 18.4], 22) },
      { label: 'Инциденты на 100 рейсов', value: '0,7', sub: 'безопасность и холодовая цепь', bars: bars([1.4, 1.2, 1.1, 1.0, 0.9, 0.9, 0.8, 0.7], 1.5) }
    ];
    const repGroups = REP_GROUPS.map(g => ({ name: g.name, items: g.items.map(n => ({ name: n, gen: () => this.showToast('Отчёт «' + n + '» сформирован (демо)') })) }));

    const kpis = [
      { label: 'Рейсы сегодня', value: String(trips.length), sub: board.map(b => b.label.toLowerCase() + ' ' + b.count).join(' · ') },
      { label: 'В пути', value: String(trips.filter(r => r.status === 'transit').length), sub: 'онлайн-трекинг и ETA' },
      { label: 'OTIF · 7 дней', value: '96,4 %', sub: 'цель SLA ≥ 95 %' },
      { label: 'Темп. соответствие', value: '99,6 %', sub: 'отправок без отклонений' },
      { label: 'Загрузка по объёму', value: '81 %', sub: 'по весу 37 %' },
      { label: 'Тревоги', value: String(crit), sub: 'риск и критично' }
    ];
    const hubWx = ['Астана', 'Алматы'].filter(c => hubOk(c === 'Астана' ? 'ast' : 'alm')).flatMap(c => WX[c].slice(0, 3).map((w, i) => ({ city: c, day: DAYS[i].slice(3), temp: sg(w.max) + ' / ' + sg(w.min) + ' °C', cond: w.cond, wind: w.wind + ' м/с', l: LV[w.lvl] })));

    const alertsOut = alerts.slice(0, 9).map(a => ({ ...a, l: LV[a.lvl], go: () => this.setState({ screen: a.scr, ...(a.veh ? { selVeh: a.veh } : {}), ...(a.city ? { selCity: a.city } : {}) }) }));
    const is = Object.fromEntries(NAV.map(n => [n[0], n[0] === s.screen]));

    return {
      nav, is, hubOpts, clock: this.clockStr(s.t), screenCode: String(NAV.indexOf(nav0) + 1).padStart(2, '0'), screenTitle: nav0[2], screenSub: nav0[3],
      liveDot: this.props.liveSimulation === false ? 'var(--color-neutral-500)' : 'var(--color-accent)', liveLabel: this.props.liveSimulation === false ? 'Симуляция на паузе' : 'Онлайн · обновление каждые 2 с',
      alertCount: crit, alertBtnBg: crit ? 'oklch(0.55 0.19 27)' : 'transparent', alertBtnFg: crit ? 'var(--color-bg)' : 'var(--color-text)', alertBtnBc: crit ? 'oklch(0.55 0.19 27)' : 'var(--color-divider)',
      goOverview: () => this.go('overview'), goLoad: () => this.go('load'), goThermo: () => this.setState({ screen: 'thermo', selVeh: T.veh }),
      kpis, tripsLive: trips, alerts: alertsOut, hubWx,
      board, trip, openOrders, noOpenOrders: openOrders.length === 0,
      orders, load,
      vehChips, th, thermoRules: THERMO_RULES.map(r => ({ ...r, l: LV[r.lvl] })),
      doorLabel: s.door ? 'Закрыть дверь V04' : 'Открыть дверь камеры V04',
      simBtns: Object.keys(SIMS).map(k => ({ label: (s.sim[k] ? 'Стоп · ' : '') + SIMS[k].label + ' · ' + SIMS[k].veh, bg: s.sim[k] ? 'var(--color-accent-900)' : 'transparent', fg: s.sim[k] ? 'var(--color-bg)' : 'var(--color-text)',
        toggle: () => { const on = !s.sim[k]; this.setState(x => ({ sim: { ...x.sim, [k]: on }, simSel: k, ...(on && SIMS[k].veh ? { selVeh: SIMS[k].veh } : {}) })); this.log((on ? 'Симуляция · ' : 'Сброс · ') + SIMS[k].title); if (on) this.showToast('Тревога: ' + SIMS[k].title + ' — инструкция на экране «Обзор»'); } })),
      playbooks: Object.keys(SIMS).filter(k => s.sim[k]).map(k => ({ hasContact: !!SIMS[k].ws, contactLabel: SIMS[k].ws ? 'Контакты сервиса · ' + (PARTNERS.find(p => p.id === SIMS[k].ws) || {}).name : '', openContact: () => this.setState({ contactP: SIMS[k].ws }), title: SIMS[k].title, where: SIMS[k].where, steps: SIMS[k].play.map((t, i) => ({ n: i + 1, t })), stop: () => this.setState(x => ({ sim: { ...x.sim, [k]: false } })) })),
      hasPlaybook: Object.values(s.sim).some(Boolean),
      toggleDoor: () => this.setState({ door: !s.door, doorSec: 0, selVeh: 'V04' }),
      wxOpts: [3, 7].map(n => ({ label: n + ' дня'.replace('дня', n === 7 ? 'дней' : 'дня'), go: () => this.setState({ wxDays: n }), ...seg(wxN, n) })),
      wxHead: DAYS.slice(0, wxN), wxCols: '130px repeat(' + wxN + ',minmax(0,1fr))', wxMinW: wxN === 7 ? '820px' : '440px', wxRows, wxCity, routeWx, wxRules: WX_RULES,
      secKpis: [{ label: 'Открытые инциденты', value: String(openInc) }, { label: 'ТС на линии', value: VEH.filter(v => v.st === 'line').length + ' / ' + VEH.length }, { label: 'Двери и пломбы', value: (VEH.length - (s.door ? 1 : 0) - (s.sim.theft ? 1 : 0)) + ' / ' + VEH.length + ' ок' }, { label: 'Водители с ДОПОГ', value: '4 / 6' }],
      incidents, audit: s.audit, geo: GEO,
      panicTest: () => { const id = 'INC-04' + (13 + s.extraInc.length); const time = this.clockStr(s.t).slice(0, 5);
        this.setState(x => ({ extraInc: [{ id, lvl: 3, time, type: 'Тревожная кнопка', text: 'V01 · А. Нурланов · трасса Астана–Караганда, км 168' }, ...x.extraInc], inc: { ...x.inc, [id]: 'new' } }));
        this.log('Система · тревожная кнопка V01 → ' + id); this.showToast('Тревожная кнопка V01: диспетчер и СБ оповещены'); },
      drivers: Object.values(DRV).filter(d => hubOk(VM[d.veh].hub)).map(d => ({ name: d.name, veh: d.veh, drive: fmt(d.drive) + ' / 9 ч', adr: d.adr ?? '—', adrFg: d.adr === '14.11.2026' ? 'var(--color-accent-900)' : 'var(--color-text)' })),
      seals: vehs.map(v => ({ id: v.id, door: (v.id === 'V04' && s.door) || (v.id === 'V01' && s.sim.theft) ? 'ОТКРЫТА' : 'закрыты', seal: v.id === 'V01' && s.sim.theft ? 'НАРУШЕНА' : v.id === 'V02' || !v.thermo ? 'не установлена' : 'цела', route: v.id === 'V01' && s.sim.theft ? 'остановка 22 мин' : v.id === 'V04' ? 'отклонение 4,2 км' : v.id === 'V02' || v.id === 'V03' ? 'на хабе' : 'по плану' })),
      scenarios, planHead: DAYS, planRows, planRecs: recs,
      planFactors: BL_PF,
      repKpis, repGroups,
      tips: Object.fromEntries(Object.entries(TIPS).map(([k, text]) => [k, { text, show: s.tip === k, on: () => this.setState({ tip: k }) }])), tipOff: () => this.setState({ tip: null }),
      ...this.extra(load, trips),
      ...this.staffVals(),
      ...this.shipVals(),
      ...this.drvVals(),
      ...this.partnerVals(),
      tripWs: wsNear ? { name: wsNear.name, city: wsNear.city, tierL: TIER[wsNear.tier].label, t: TIER[wsNear.tier], resp: wsNear.resp, open: () => this.setState({ contactP: wsNear.id }) } : null, hasTripWs: !!wsNear,
      goQuality: () => this.go('quality'), goDriver: () => this.go('driver'),
      drvFeatures: [{ k: 'Маршрут и точки', v: 'последовательность, окна приёмки, навигация' }, { k: 'Температурная квитанция', v: 'значения логгера подтверждает получатель' }, { k: 'Фото-POD и подпись', v: 'акт приёма-передачи формируется автоматически' }, { k: 'Офлайн-режим', v: 'данные сохраняются без связи и отправляются позже' }, { k: 'Языки', v: 'русский · казахский' }, { k: 'SOS и отклонения', v: 'тревога в СБ, отклонение в модуль качества' }],
      ...this.blVals(),
      ...this.costVals(),
      ...this.inbVals(),
      ...this.thcVals(),
      ...this.dappVals(),
      hasToast: !!s.toast, toast: s.toast
    };
  }
