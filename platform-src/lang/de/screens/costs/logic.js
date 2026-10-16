  costCalc() {
    const s = this.state, dp = s.cDiesel || 340, win = !!s.cWinter;
    const ringKm = {}; BLR.forEach(r => { ringKm[r.id] = r.km * r.per / 12; });
    const veh = CV.map(c => { const v = VM[c.id], kmMo = c.rings.reduce((a, r) => a + ringKm[r], 0), l100 = (c.l100 + c.unitL) * (win ? 1 + CP.winterPct / 100 : 1);
      const fuelL = kmMo * l100 / 100, fuel = fuelL * dp, svc = kmMo * c.svcKm + c.unitSvc, fin = c.price * (1 - CP.lease.down), r = CP.lease.rate / 100 / 12;
      const lease = fin / CP.lease.months + fin * r * (CP.lease.months + 1) / (2 * CP.lease.months);
      const days = kmMo / c.kmDay, kasko = c.price * CP.kaskoPct / 100, ogpo = CP.ogpo * CP.mrp, tax = CP.tax * CP.mrp, ti = CP.ti * CP.mrp;
      const down = kmMo / CP.to1 * CP.to1d + kmMo / CP.to2 * CP.to2d, ktg = 1 - down / CP.workDays;
      const fixDay = (lease + CP.ins / 12 + tax / 12 + c.crew * CP.drvBase * (1 + CP.empTax / 100)) / 30.4;
      return { ...c, v, kmMo, l100, fuelL, fuel, svc, lease, days, kasko, ogpo, tax, ti, down, ktg, fixDay, toLeft: CP.to1 - c.odo % CP.to1, to2Left: CP.to2 - c.odo % CP.to2 }; });
    const sum = k => veh.reduce((a, x) => a + x[k], 0);
    const kmMo = sum('kmMo'), days = sum('days'), crew = veh.reduce((a, x) => a + x.crew, 0);
    const drvKm = kmMo * CP.drvKm, base = crew * CP.drvBase, empTax = (base + drvKm) * CP.empTax / 100, adm = CP.admGross * (1 + CP.empTax / 100);
    const A = X('допущение','Annahme','assumption');
    const rows = [
      ['var', X('Дизель','Diesel','Diesel'), 'I38', sum('fuel'), 0, X(fmt(sum('fuelL'), 0) + ' л/мес × ' + dp + ' ₸/л', fmt(sum('fuelL'), 0) + ' l/Monat × ' + dp + ' ₸/l', fmt(sum('fuelL'), 0) + ' l/month × ' + dp + ' ₸/l')],
      ['var', X('ТО, ремонт, шины','Wartung, Reparatur, Reifen','Service, repair, tyres'), 'I39', sum('svc'), 0, X('HOWO 18 ₸/км, JAC 14 ₸/км + агрегат V01','HOWO 18 ₸/km, JAC 14 ₸/km + Aggregat V01','HOWO 18 ₸/km, JAC 14 ₸/km + V01 unit')],
      ['var', X('Сдельная часть водителей','Kilometergeld Fahrer','Driver mileage pay'), 'J46', drvKm, 0, nf(kmMo) + ' ' + U.km + ' × 15 ₸'],
      ['var', X('Суточные','Spesen','Per diem'), 'J46/I40', days * CP.perDiem, 0, fmt(days, 0) + X(' дней в рейсе × 6 000 ₸',' Tage auf Tour × 6 000 ₸',' days on road × 6,000 ₸')],
      ['var', X('Сухой лёд, хладоэлементы','Trockeneis, Kühlakkus','Dry ice, ice packs'), 'Q95', CP.dryIce, 1, X('≈ 6 отправок −20 °C вне R1','≈ 6 Sendungen −20 °C außerhalb R1','≈ 6 shipments at −20 °C off R1')],
      ['var', X('Платные дороги','Mautstraßen','Toll roads'), 'I40', CP.tolls, 1, X('в модели не учтены','im Modell nicht enthalten','not in the model')],
      ['var', X('Предрейсовые медосмотры','Vorfahrt-Medizincheck','Pre-trip medical checks'), 'J53', days * CP.medCheck, 1, fmt(days, 0) + ' × 1 500 ₸'],
      ['var', X('Мойка и санобработка кузова (GDP)','Wäsche und Desinfektion Koffer (GDP)','Body wash and sanitising (GDP)'), 'D14', CV.length * CP.wash, 1, '4 × 15 000 ₸'],
      ['var', X('Аутсорсинг Жезказган (SpezAvto)','Outsourcing Zhezkazgan (SpezAvto)','Outsourcing Zhezkazgan (SpezAvto)'), 'P92', CP.zhez, 0, '1 529 ' + U.kg + ' × 228 ₸'],
      ['fix', X('Лизинг 4 ТС','Leasing 4 Fahrzeuge','Leasing 4 vehicles'), 'N74', sum('lease'), 0, X('аванс 30 %, 16,5 %, 37 мес.','Anzahlung 30 %, 16,5 %, 37 Mon.','30 % down, 16.5 %, 37 mo.')],
      ['fix', X('Оклады водителей','Grundgehalt Fahrer','Driver base salaries'), 'J46', base, 0, crew + ' × 200 000 ₸'],
      ['fix', X('Налоги работодателя','Arbeitgeberabgaben','Employer payroll taxes'), 'J49', empTax, 0, '17,5 % (3,5 + 5 + 6 + 3)'],
      ['fix', X('Администрация ТК','Verwaltung Transportgesellschaft','Transport company admin'), 'J48', adm, 0, '1 650 000 × 1,175'],
      ['fix', X('Страхование (КАСКО, ОГПО, груз)','Versicherung (Kasko, OGPO, Fracht)','Insurance (comprehensive, OGPO, cargo)'), 'I41', CV.length * CP.ins / 12, 0, '4 × 900 000 ₸ / 12'],
      ['fix', X('Транспортный налог','Kfz-Steuer','Vehicle tax'), 'M67', sum('tax') / 12, 0, '4 × 9 МРП / 12'.replace('МРП', X('МРП','MRP','MRP'))],
      ['fix', X('Техосмотр','Technische Prüfung','Technical inspection'), '—', sum('ti') / 12, 1, X('1 МРП / год на ТС','1 MRP / Jahr je Fahrzeug','1 MRP / yr per vehicle')],
      ['fix', X('ИТ: Wialon + 1С','IT: Wialon + 1C','IT: Wialon + 1C'), 'I43', CP.it, 0, '15 000 + 75 000 ₸'],
      ['fix', X('Термоконтейнеры и логгеры','Thermocontainer und Logger','Thermo containers and loggers'), 'H34', CV.length * CP.cont / CP.contMo, 0, X('4 × 400 000 ₸ / 36 мес.','4 × 400 000 ₸ / 36 Mon.','4 × 400,000 ₸ / 36 mo.')],
      ['fix', X('Обучение ДОПОГ','ADR-Schulung','ADR training'), 'Q99', crew * CP.adrTrain / (CP.adrYears * 12), 1, X('свидетельство на 5 лет','Bescheinigung 5 Jahre','5-year certificate')]
    ].concat(this.inbBooked() > 0 ? [['var', X('Стоянка на рампах хаба (Standgeld)','Standgeld Hub-Rampen','Hub ramp demurrage'), 'INB', this.inbBooked(), 0, X('проводок из приёмки (экран 17): ','Buchungen aus Wareneingang (Bildschirm 17): ','entries from goods receipt (screen 17): ') + this.inbBookedN()]] : []).map(([g, k, ref, v, a, b]) => ({ g, k, ref, v, a: !!a, basis: b }));
    const tot = rows.reduce((a, r) => a + r.v, 0), totVar = rows.filter(r => r.g === 'var').reduce((a, r) => a + r.v, 0);
    const kgMo = BLR.reduce((a, r) => a + r.kg * r.per / 12, 0) + 1529;
    return { veh, rows, tot, totVar, totFix: tot - totVar, kmMo, kgMo, days, crew, dp, win, A };
  }
  costVals() {
    const s = this.state, C = this.costCalc(), tab = s.cTab || 'sum';
    const on = (a, b) => a === b ? { bg: 'var(--color-accent)', fg: 'var(--color-bg)' } : { bg: 'transparent', fg: 'var(--color-text)' };
    const mln = v => fmt(v / 1e6, 2) + ' ' + U.mln, tg = v => nf(v) + ' ₸';
    const cTabs = C_TABS.map(([k, label]) => ({ label, go: () => this.setState({ cTab: k }), ...on(tab, k) }));
    const cIs = Object.fromEntries(C_TABS.map(([k]) => [k, tab === k]));
    const save = CP.outs - C.tot, tariffKg = C.tot * 1.05 / C.kgMo;
    const cKpis = [
      { k: X('Затраты в месяц','Kosten pro Monat','Running cost / month'), v: mln(C.tot), sub: X('переменные ','variabel ','variable ') + mln(C.totVar) + X(' · постоянные ',' · fix ',' · fixed ') + mln(C.totFix), l: LV[0] },
      { k: X('Против аутсорсинга','Gegenüber Outsourcing','vs. outsourcing'), v: (save >= 0 ? '−' : '+') + fmt(Math.abs(save) / CP.outs * 100, 0) + ' %', sub: X('сегодня ','heute ','today ') + mln(CP.outs) + X('/мес · разница ','/Monat · Differenz ','/month · gap ') + mln(save), l: LV[save > 0 ? 0 : 3] },
      { k: X('Стоимость км','Kosten je km','Cost per km'), v: nf(C.tot / C.kmMo) + ' ₸', sub: nf(C.kmMo) + ' ' + U.km + X('/мес','/Monat','/month'), l: LV[0] },
      { k: X('Тариф себест. + 5 %','Tarif Kosten + 5 %','Tariff cost + 5 %'), v: nf(tariffKg) + ' ₸/' + U.kg, sub: X('сборный 228 ₸/кг · ','Stückgut 228 ₸/kg · ','LTL 228 ₸/kg · ') + nf(C.kgMo) + ' ' + U.kg + X('/мес (K54/T142)','/Monat (K54/T142)','/month (K54/T142)'), l: LV[tariffKg < CP.ltl ? 0 : 2] },
      { k: X('Доля дизеля','Dieselanteil','Diesel share'), v: fmt(C.rows[0].v / C.tot * 100, 0) + ' %', sub: C.dp + X(' ₸/л',' ₸/l',' ₸/l') + (C.win ? X(' · зима +10 %',' · Winter +10 %',' · winter +10 %') : ''), l: LV[C.dp > 400 || C.win ? 1 : 0] },
      { k: X('КТГ парка','Techn. Bereitschaft','Fleet availability'), v: fmt(Math.min(...C.veh.map(x => x.ktg)), 2) + ' – ' + fmt(Math.max(...C.veh.map(x => x.ktg)), 2), sub: X('порог пилота 0,92 (O80)','Pilotschwelle 0,92 (O80)','pilot threshold 0.92 (O80)'), l: LV[Math.min(...C.veh.map(x => x.ktg)) >= CP.ktgMin ? 0 : 2] }
    ];
    const maxV = Math.max(...C.rows.map(r => r.v));
    const cRows = C.rows.map(r => ({ ...r, grp: r.g === 'var' ? X('переменные','variabel','variable') : X('постоянные','fix','fixed'), mo: tg(r.v), yr: mln(r.v * 12), share: fmt(r.v / C.tot * 100, 1) + ' %', w: (r.v / maxV * 100).toFixed(1) + '%', tagL: r.a ? C.A : X('Fragenkatalog','Fragenkatalog','catalogue'), l: r.a ? LV[1] : LV[0] }));
    const cTotal = { mo: tg(C.tot), yr: mln(C.tot * 12), perKm: nf(C.tot / C.kmMo) + ' ₸/' + U.km, perKg: nf(C.tot / C.kgMo) + ' ₸/' + U.kg, n77: X('Модель N77: экономия 6,92 млн ₸/мес → затраты ≈ ','Modell N77: Einsparung 6,92 Mio. ₸/Monat → Kosten ≈ ','Model N77: savings 6.92 M ₸/month → cost ≈ ') + mln(CP.outs - CP.saveN77) + X('. Снизу вверх: ','. Bottom-up: ','. Bottom-up: ') + mln(C.tot) + X(' — разница ',' — Differenz ',' — gap ') + mln(CP.outs - CP.saveN77 - C.tot) + X(' (остаточный экспресс и параллельный аутсорсинг пилота не включены).',' (Rest-Express und paralleles Pilot-Outsourcing nicht enthalten).',' (residual express and parallel pilot outsourcing not included).') };
    const cExcl = [X('Картирование GDP и квалификация трёх режимов — не оценено (C13/H37)','GDP-Mapping und Qualifizierung dreier Regime — nicht geschätzt (C13/H37)','GDP mapping and qualification of three regimes — not estimated (C13/H37)'), X('Аванс по лизингу 30 % — инвестиция, не текущие затраты (N74)','Leasinganzahlung 30 % — Investition, keine laufenden Kosten (N74)','30 % leasing down payment — investment, not running cost (N74)'), X('Штрафы — ответственность водителя (FR-07)','Bußgelder — Verantwortung des Fahrers (FR-07)','Fines — driver liability (FR-07)')];
    const cDash = [
      [X('Затраты / мес и / км','Kosten / Monat und / km','Cost / month and / km'), mln(C.tot) + ' · ' + nf(C.tot / C.kmMo) + ' ₸/' + U.km],
      [X('Экономия к аутсорсингу','Einsparung gg. Outsourcing','Savings vs outsourcing'), mln(save) + X('/мес','/Monat','/month')],
      [X('Доля экспресса (T148)','Express-Anteil (T148)','Express share (T148)'), '36,3 % → ' + X('цель < 10 %','Ziel < 10 %','target < 10 %')],
      [X('Дизель факт / план','Diesel Ist / Plan','Diesel actual / plan'), fmt(C.veh.reduce((a, x) => a + x.act, 0) / C.veh.reduce((a, x) => a + x.l100, 0) * 100, 0) + ' %'],
      [X('КТГ / простои','Bereitschaft / Ausfall','Availability / downtime'), fmt(C.veh.reduce((a, x) => a + x.down, 0), 1) + X(' дн./мес',' Tage/Monat',' days/month')],
      [X('Согласования > 50 %','Freigaben > 50 %','Approvals > 50 %'), String(COWN.filter(o => this.ownCalc(o, C).need && !this.ownCalc(o, C).done).length) + X(' ожидают',' offen',' pending')]
    ].map(([k, v]) => ({ k, v }));
    const cDieselOpts = [340, 400, 450].map(p => ({ label: p + X(' ₸/л',' ₸/l',' ₸/l'), go: () => this.setState({ cDiesel: p }), ...on(C.dp, p) }));
    const cWinterOpt = { label: X('Зимний расход +10 % (I38)','Winterverbrauch +10 % (I38)','Winter consumption +10 % (I38)'), go: () => this.setState(x => ({ cWinter: !x.cWinter })), ...on(C.win, true) };
    const cFuel = C.veh.map(x => { const dev = (x.act - x.l100) / x.l100 * 100, lv = Math.abs(dev) > 15 ? 3 : Math.abs(dev) > 8 ? 2 : Math.abs(dev) > 4 ? 1 : 0;
      const wk = CW.map((f, i) => { const a = x.act * f * (i === 6 && x.id === 'V02' ? 1.06 : 1); return { h: Math.min(100, a / (x.l100 * 1.3) * 100).toFixed(0) + '%', c: a > x.l100 * 1.08 ? 'oklch(0.70 0.15 80)' : 'var(--color-accent)' }; });
      return { id: x.id, model: x.v.model, plan: fmt(x.l100, 1), act: fmt(x.act, 1), dev: (dev > 0 ? '+' : '') + fmt(dev, 1) + ' %', l: LV[lv], liters: nf(x.fuelL) + X(' л/мес',' l/Monat',' l/month'), cost: tg(x.fuel), perKm: fmt(x.fuel / x.kmMo, 1) + ' ₸/' + U.km, co2: fmt(x.fuelL * 2.68 / 1000, 1) + X(' т CO₂',' t CO₂',' t CO₂'), wk,
        note: (x.id === 'V01' && s.drvFuel ? X('заправка из приложения: 180 л · ','Tankung aus der App: 180 l · ','fill from the app: 180 l · ') : '') + (lv >= 2 ? X('проверить: датчик уровня Wialon, слив, зимний прогрев, стиль вождения','prüfen: Wialon-Füllstandssensor, Abzapfen, Winter-Vorwärmung, Fahrstil','check: Wialon level sensor, siphoning, winter idling, driving style') : X('в пределах плана','im Plan','within plan')) }; });
    const fuelTot = { liters: nf(C.veh.reduce((a, x) => a + x.fuelL, 0)) + X(' л/мес',' l/Monat',' l/month'), cost: tg(C.rows[0].v), winter: tg(C.veh.reduce((a, x) => a + x.fuelL / (C.win ? 1.1 : 1) * 0.1 * C.dp, 0) * 5) + X(' за ноябрь–март при +10 %',' für Nov–März bei +10 %',' for Nov–Mar at +10 %') };
    const svcKey = id => (s.vehSt || {})[id] === 'workshop';
    const cSvc = C.veh.map(x => { const ws = svcKey(x.id), lost = BLR.filter(r => x.rings.includes(r.id)).reduce((a, r) => a + r.kg, 0) * CP.ltl;
      return { id: x.id, model: x.v.model, km: nf(x.kmMo) + ' ' + U.km, svc: tg(x.svc), to1: nf(x.toLeft) + ' ' + U.km, to2: nf(x.to2Left) + ' ' + U.km, down: fmt(x.down, 2) + X(' дн.',' Tage',' days'), ktg: fmt(x.ktg, 2), kl: LV[x.ktg >= CP.ktgMin ? 0 : 2], perDay: tg(x.fixDay), lost: tg(lost), st: ws ? X('в сервисе','in Werkstatt','in workshop') : x.v.st === 'line' ? X('на линии','auf Tour','on the road') : X('на хабе','am Hub','at hub'), sl: LV[ws ? 3 : 0] }; });
    const brk = !!(s.sim && s.sim.breakdown), v1 = C.veh[0];
    const cOut = { on: brk, title: brk ? X('Активный простой: V01 · поломка КПП, R1','Aktiver Ausfall: V01 · Getriebeschaden, R1','Active downtime: V01 · gearbox failure, R1') : X('Сценарий простоя V01 на R1 (запустите «Поломка · V01» слева)','Ausfallszenario V01 auf R1 (links „Panne · V01“ starten)','Downtime scenario V01 on R1 (start “Breakdown · V01” on the left)'),
      items: [[X('Эвакуация / выезд механика','Abschleppen / mobiler Mechaniker','Towing / mobile mechanic'), 150000], [X('Ремонт КПП (смета PW-03)','Getriebereparatur (Angebot PW-03)','Gearbox repair (PW-03 estimate)'), 120000], [X('Постоянные затраты V01 × 3 дня','Fixkosten V01 × 3 Tage','V01 fixed cost × 3 days'), v1.fixDay * 3], [X('Замена рейса R1: аутсорсинг 7 325 кг × 228 ₸','Ersatz R1: Outsourcing 7 325 kg × 228 ₸','R1 replacement: outsourcing 7,325 kg × 228 ₸'), 7325 * CP.ltl]].map(([k, v]) => ({ k, v: tg(v), n: v })) };
    cOut.total = tg(cOut.items.reduce((a, i) => a + i.n, 0));
    const idle = { V02: s.cIdleW ? 2 : 0, V04: s.cIdleB ? 3 : 0 };
    const cIns = C.veh.map(x => { const fe = FEES[x.id] || {}, m = idle[x.id] || 0, sav = m * (x.tax / 12 + x.ogpo / 12), cost = CP.reReg * CP.mrp, leaseM = m * x.lease;
      const rec = !m ? X('используется по графику — учёт сохранить','planmäßig im Einsatz — Zulassung behalten','in scheduled use — keep registration') : X('не снимать с учёта: КАСКО по лизингу обязательно, лизинг ' + mln(leaseM) + ' идёт дальше; экономия ' + tg(sav - cost) + ' — лучше перераспределить на R1 / вместо аутсорсинга','nicht abmelden: Kasko laut Leasing Pflicht, Leasing ' + mln(leaseM) + ' läuft weiter; Einsparung ' + tg(sav - cost) + ' — besser auf R1 / statt Outsourcing einsetzen','do not deregister: comprehensive cover mandatory under leasing, leasing ' + mln(leaseM) + ' continues; saving ' + tg(sav - cost) + ' — better redeploy to R1 / replace outsourcing');
      return { id: x.id, model: x.v.model, kasko: tg(x.kasko), ogpo: tg(x.ogpo), tax: tg(x.tax), ti: tg(x.ti), total: tg(x.kasko + x.ogpo + x.tax + x.ti), due: (fe.ogpo || '—'), fl: LV[fe.lvl || 0], fnote: fe.note || X('в порядке','in Ordnung','OK'), idle: m ? m + ' ' + U.mo : '—', rec, rl: LV[m ? 2 : 0] }; });
    const cIdleOpts = [{ label: X('Запад зимой закрыт 2 мес. → V02 стоит (B7)','West im Winter 2 Mon. gesperrt → V02 steht (B7)','West closed 2 mo. in winter → V02 idle (B7)'), go: () => this.setState(x => ({ cIdleW: !x.cIdleW })), ...on(!!s.cIdleW, true) }, { label: X('Кольцо B на аутсорсинг 3 мес. → V04 частично стоит','Ring B 3 Mon. im Outsourcing → V04 teilweise frei','Ring B outsourced 3 mo. → V04 partly idle'), go: () => this.setState(x => ({ cIdleB: !x.cIdleB })), ...on(!!s.cIdleB, true) }];
    const cRule = X('Правило: снимать ТС с учёта (или не продлевать ОГПО) только если простой ≥ 3 мес., ТС не в лизинге и экономия налога и ОГПО больше затрат на повторную регистрацию (≈ 3 МРП). Для ТС в лизинге — согласие лизингодателя, КАСКО продолжается.','Regel: Fahrzeug nur abmelden (oder OGPO nicht verlängern), wenn Stillstand ≥ 3 Mon., kein Leasing und Ersparnis aus Steuer und OGPO größer als Neuzulassung (≈ 3 MRP). Bei Leasing — Zustimmung des Leasinggebers, Kasko läuft weiter.','Rule: deregister a vehicle (or let OGPO lapse) only if idle ≥ 3 months, not leased, and tax + OGPO savings exceed re-registration (≈ 3 MRP). Leased vehicles need lessor consent; comprehensive cover continues.');
    const cOwn = COWN.map(o => { const r = this.ownCalc(o, C), ap = (s.cAp || {})[o.id] || [];
      return { id: o.id, name: o.name, kg: nf(o.kg) + ' ' + U.kg, own: tg(r.own), ext: tg(r.ext), extL: o.extL, best: r.ownBetter ? X('свой рейс','eigenes Fahrzeug','own vehicle') : X('внешний','extern','external'), save: fmt(r.pct, 0) + ' %', l: r.need ? (r.done ? LV[0] : LV[2]) : LV[0],
        st: r.need ? (r.done ? X('согласовано 2/2','freigegeben 2/2','approved 2/2') : X('> 50 % · нужны 2 подписи · ','> 50 % · 2 Unterschriften nötig · ','> 50 % · 2 signatures needed · ') + ap.filter(Boolean).length + '/2') : X('≤ 50 % · решение диспетчера','≤ 50 % · Entscheidung Disponent','≤ 50 % · dispatcher decides'), need: r.need && !r.done,
        signers: CAPR.map((role, i) => ({ role, mark: ap[i] ? '✓' : '—', bg: ap[i] ? LV[0].bg : 'transparent', fg: ap[i] ? LV[0].fg : 'var(--color-text)', bc: ap[i] ? LV[0].bc : 'var(--color-accent)',
          sign: () => this.setState(x => { const cur = ((x.cAp || {})[o.id] || [false, false]).slice(); if (cur[i]) return null; cur[i] = true; return { cAp: { ...(x.cAp || {}), [o.id]: cur } }; }) })) }; });
    const cDrv = C.veh.map(x => { const kmY = x.kmMo * 12, hDrive = kmY / 70, hTot = hDrive * 1.15, fte = hTot / 1814;
      return { id: x.id, rings: x.rings.join(' + '), kmY: nf(kmY) + ' ' + U.km, h: nf(hTot) + X(' ч',' h',' h'), fte: fmt(fte, 2), crew: String(x.crew), l: LV[fte > x.crew ? 3 : fte > x.crew * 0.9 ? 1 : 0], days: fmt(x.days, 1) + X(' дн./мес',' Tage/Monat',' days/month') }; });
    const drvSum = { crew: C.crew, fte: fmt(cDrv.reduce((a, d) => a + parseFloat(d.fte.replace(',', '.')), 0), 1), base: tg(C.crew * CP.drvBase), tax: fmt(CP.empTax, 1) + ' % (' + X('в модели','im Modell','in model') + ' ' + fmt(CP.empTaxModel, 1) + ' %)' };
    return { cTabs, cIs, cKpis, cRows, cTotal, cExcl, cDash, cDieselOpts, cWinterOpt, cFuel, fuelTot, cSvc, cOut, cIns, cIdleOpts, cRule, cOwn, cDrv, drvSum };
  }
  ownCalc(o, C) {
    const x = C.veh.find(v => v.id === o.veh), varKm = x.fuel / x.kmMo + x.svcKm + CP.drvKm, own = o.km * varKm + o.days * CP.perDiem + (o.ring === 'out' || o.id === 'OW-6' || o.id === 'OW-7' ? 0 : x.fixDay * o.days);
    const ext = o.ext, ownBetter = own <= ext, pct = Math.abs(ext - own) / Math.max(ext, own) * 100, ap = ((this.state.cAp || {})[o.id] || []);
    return { own, ext, ownBetter, pct, need: pct > 50, done: ap.filter(Boolean).length === 2 };
  }
