  blVals() {
    const s = this.state, tab = s.blTab, flt = s.blF;
    const on = (a, b) => a === b ? { bg: 'var(--color-accent)', fg: 'var(--color-bg)' } : { bg: 'transparent', fg: 'var(--color-text)' };
    const blTabs = BL_TABS.map(([k, label]) => ({ label, go: () => this.setState({ blTab: k }), ...on(tab, k) }));
    const blIs = Object.fromEntries(BL_TABS.map(([k]) => [k, tab === k]));
    const grp = v => v.lvl >= 3 ? 'crit' : v.lvl === 0 ? 'ok' : 'risk';
    const cnt = { all: BLV.length, crit: 0, risk: 0, ok: 0 }; BLV.forEach(v => cnt[grp(v)]++);
    const blFOpts = [['all', X('Все','Alle','All')], ['crit', LV[3].label], ['risk', LV[1].label + ' / ' + LV[2].label], ['ok', LV[0].label]].map(([k, l]) => ({ label: l + ' · ' + cnt[k], go: () => this.setState({ blF: k }), ...on(flt, k) }));
    const blFind = BLV.filter(v => flt === 'all' || grp(v) === flt).map(v => ({ ...v, l: LV[v.lvl], stL: v.lvl === 0 ? X('учтено','umgesetzt','covered') : v.q ? X('вопрос к KDL','Frage an KDL','question to KDL') : X('открыто','offen','open') }));
    const ringName = { hub: X('хаб','Hub','hub'), T: X('Юг · отдельный рейс','Süd · eigene Fahrt','South · separate trip'), out: X('аутсорсинг SpezAvto','Outsourcing SpezAvto','outsourced, SpezAvto') };
    BLR.forEach(r => { ringName[r.id] = r.id + ' · ' + r.name; });
    const maxKg = Math.max(...BLC.map(c => c[3]));
    const blCities = BLC.map(c => { const n = CN(c[0], c[1]), cc = CITY.find(x => x[0] === n);
      return { name: n, ring: ringName[c[2]], kg: nf(c[3]), kgw: nf(c[4]), m3: fmt(c[5]), w: (c[3] / maxKg * 100).toFixed(1) + '%', temp: c[6] + ' / ' + c[7] + ' / ' + c[8],
        hub: cc ? HUBL[cc[1]].split(' · ').pop() : '—', l: cc ? LV[0] : LV[3], net: cc ? '✓' : X('нет','fehlt','missing') }; });
    const tt = BLC.reduce((a, c) => [a[0] + c[6], a[1] + c[7], a[2] + c[8]], BLD.makinsk.slice());
    const blCitySum = { kg: nf(BLC.reduce((a, c) => a + c[3], 0)), kgw: nf(BLC.reduce((a, c) => a + c[4], 0)), m3: fmt(BLC.reduce((a, c) => a + c[5], 0)), temp: tt.join(' / ') };
    const unitKm = {}; BLR.forEach(r => { unitKm[r.unit] = (unitKm[r.unit] || 0) + r.km * r.per; });
    const blRings = BLR.map(r => { const sum = r.legs.reduce((a, b) => a + b, 0), V = BLF.find(f => f.id === r.veh);
      const chk = r.full ? (sum === r.km ? { l: LV[0], t: 'Σ ' + nf(sum) + ' ✓' } : { l: LV[3], t: 'Σ ' + nf(sum) + ' ≠ ' + nf(r.km) }) : { l: LV[1], t: X('плечи частично','Legs teilweise','legs partial') };
      return { id: r.id, name: r.name, hub: HUBL[r.hub], route: r.route.map(x => CN(x[0], x[1])).join(' → '), km: nf(r.km) + ' ' + U.km, chk, cad: r.cad, yr: nf(r.km * r.per) + ' ' + U.km + X('/год','/Jahr','/yr'),
        load: r.kg ? nf(r.kg) + ' ' + U.kg + ' · ' + fmt(r.m3) + ' ' + U.m3 : '—', fill: r.m3 ? X('заполнение ','Füllung ','fill ') + Math.round(r.m3 / V.m3 * 100) + ' %' : '', veh: V.model + ' · ' + r.unit, crew: r.crew ? r.crew + ' ' + X('вод.','Fahrer','drivers') : X('общий','geteilt','shared'), kmDay: r.kmDay + ' ' + U.km + X('/день','/Tag','/day'), start: r.start, note: r.note }; });
    const blFleet = BLF.map(f => { const units = [...new Set(BLR.filter(r => r.veh === f.id).map(r => r.unit))];
      const wm = f.wKm ? units.map(u => ({ u, m: Math.min(f.wYr * 12, f.wKm / unitKm[u] * 12) })) : [];
      const wex = !f.qty ? '' : f.wKm ? wm.map(x => x.u + ': ' + fmt(x.m, 0) + ' ' + U.mo).join(' · ') : X('лимита нет','kein Limit','no limit');
      const minM = wm.length ? Math.min(...wm.map(x => x.m)) : 99;
      return { model: f.model, body: f.body, cap: (f.kg ? nf(f.kg) + ' ' + U.kg + ' · ' : '') + fmt(f.m3) + ' ' + U.m3, price: f.price ? fmt(f.price / 1e6, 2) + ' ' + U.mln : '—', warr: f.warr, wex, wl: minM < 18 ? LV[2] : LV[0], hasWex: !!wex,
        fuel: f.fuel ? f.fuel + X(' л/100 км · ',' l/100 km · ',' l/100 km · ') + fmt(f.fuel * BLD.diesel / 100) + ' ₸/' + U.km + (f.svc ? ' + ' + X('ТО ','Wartung ','service ') + f.svc + ' ₸/' + U.km : '') : '—',
        qty: f.qty ? f.qty + ' × · ' + units.join(', ') : '—', l: LV[f.st], stL: f.qty ? X('в плане','im Plan','planned') : f.st === 3 ? X('исключён','ausgeschlossen','ruled out') : X('альтернатива','Alternative','alternative'), note: f.note, hasNote: !!f.note }; });
    const vehSum = BLF.reduce((a, f) => a + f.qty * f.price, 0);
    const blFleetSum = X('Σ ' + BLF.reduce((a, f) => a + f.qty, 0) + ' ТС = ' + fmt(vehSum / 1e6, 2) + ' млн ₸ с НДС · поставка HOWO 35, JAC 30 р. д. · лизинг: аванс 30 %, 16,5 %, 37 мес. (N74). Симуляция платформы работает на этом парке: ' + VEH.length + ' ТС (FR-38).',
      'Σ ' + BLF.reduce((a, f) => a + f.qty, 0) + ' Fahrzeuge = ' + fmt(vehSum / 1e6, 2) + ' Mio. ₸ inkl. MwSt. · Lieferung HOWO 35, JAC 30 AT · Leasing: Anzahlung 30 %, 16,5 %, 37 Mon. (N74). Die Plattformsimulation läuft auf dieser Flotte: ' + VEH.length + ' Fahrzeuge (FR-38).',
      'Σ ' + BLF.reduce((a, f) => a + f.qty, 0) + ' vehicles = ' + fmt(vehSum / 1e6, 2) + ' M ₸ incl. VAT · delivery HOWO 35, JAC 30 working days · leasing: 30 % down, 16.5 %, 37 mo. (N74). The platform simulation runs on this fleet: ' + VEH.length + ' vehicles (FR-38).');
    const blRates = [[X('Свой рейс','Eigenes Fahrzeug','Own vehicle'), BLD.ownRate], [X('Сборный тариф','Stückguttarif','LTL rate'), BLD.ltlRate], [X('Экспресс','Express','Express'), BLD.expRate]].map(([k, v]) => ({ k, val: nf(v) + ' ₸/' + U.kg, w: (v / BLD.expRate * 100).toFixed(1) + '%' }));
    const blSens = BLS.map(([k, y]) => ({ k, val: fmt(y, 2) + ' ' + U.yr, w: (y / 3.03 * 100).toFixed(1) + '%' }));
    const outs = BLD.garanta + BLD.kazexp, expM = BLD.expKg * BLD.expRate;
    const blEcon = [
      { k: X('Аутсорсинг (G25)','Outsourcing (G25)','Outsourcing (G25)'), v: 'GarantA ' + nf(BLD.garanta) + ' + KazExpress ' + nf(BLD.kazexp) + ' = ' + nf(outs) + ' ₸/' + U.mo + ' · ' + fmt(outs * 12 / 1e6) + ' ' + U.mln + X('/год','/Jahr','/yr') },
      { k: X('Экспресс (A2)','Express (A2)','Express (A2)'), v: nf(BLD.expKg) + ' ' + U.kg + ' × ' + nf(BLD.expRate) + ' ₸ = ' + nf(expM) + ' ₸/' + U.mo + ' · ' + fmt(expM / outs * 100) + X(' % бюджета при ',' % des Budgets bei ',' % of budget at ') + fmt(BLD.expKg / BLD.kgMon * 100) + X(' % веса',' % des Gewichts',' % of weight') },
      { k: X('Надбавка экспресса (T140)','Express-Aufpreis (T140)','Express premium (T140)'), v: fmt((BLD.expRate - BLD.ltlRate) * BLD.expKg * 12 / 1e6) + ' ' + U.mln + X('/год','/Jahr','/yr') },
      { k: X('Экономия (N77)','Einsparung (N77)','Savings (N77)'), v: nf(BLD.saveMon) + ' ₸/' + U.mo + ' · ' + fmt(BLD.saveMon * 12 / 1e6) + ' ' + U.mln + X('/год · ROI ','/Jahr · ROI ','/yr · ROI ') + fmt(BLD.roi) + ' % · IRR ' + fmt(BLD.irr) + ' %' },
      { k: X('Водитель (J46)','Fahrer (J46)','Driver (J46)'), v: X('200 000 ₸ + 15 ₸/км; суточные 6 000 ₸/день (лимит 6 МРП = ','200 000 ₸ + 15 ₸/km; Spesen 6 000 ₸/Tag (Limit 6 MRP = ','200,000 ₸ + 15 ₸/km; per diem 6,000 ₸/day (limit 6 MRP = ') + nf(6 * BLD.mrp) + ' ₸)' },
      { k: X('ИТ (H36/I43)','IT (H36/I43)','IT (H36/I43)'), v: 'Wialon + 1C: ' + nf(BLD.itOnce.reduce((a, b) => a + b, 0)) + X(' ₸ разово + ',' ₸ einmalig + ',' ₸ one-off + ') + nf(BLD.itMon.reduce((a, b) => a + b, 0)) + ' ₸/' + U.mo },
      { k: X('Налоги (M67/N75)','Steuern (M67/N75)','Taxes (M67/N75)'), v: X('КПН 20 %, НДС 16 %, транспортный налог 9 МРП = ','KSt 20 %, MwSt. 16 %, Kfz-Steuer 9 MRP = ','CIT 20 %, VAT 16 %, vehicle tax 9 MRP = ') + nf(9 * BLD.mrp) + ' ₸/' + X('год','Jahr','yr') },
      { k: X('Топливо (I38)','Kraftstoff (I38)','Fuel (I38)'), v: X('дизель ','Diesel ','diesel ') + BLD.diesel + X(' ₸/л; зимняя надбавка не учтена',' ₸/l; Winterzuschlag nicht berücksichtigt',' ₸/l; winter surcharge not included') }
    ];
    const blEx = BLEX.map(e => { const a = s.exAp[e.id] || {}, ap = a.a || [false, false, false], n = ap.filter(Boolean).length, st = a.rej ? 2 : n === 3 ? 1 : 0;
      const set = upd => this.setState(x => ({ exAp: { ...x.exAp, [e.id]: { ...(x.exAp[e.id] || {}), ...upd } } }));
      return { id: e.id, route: CN(e.from[0], e.from[1]) + ' → ' + CN(e.to[0], e.to[1]), what: e.what, kg: e.kg + ' ' + U.kg + ' · ' + TL[e.cls], cost: nf(e.kg * BLD.expRate) + ' ₸', reg: nf(e.kg * BLD.ltlRate) + ' ₸', save: nf(e.kg * (BLD.expRate - BLD.ltlRate)) + ' ₸',
        l: st === 1 ? LV[0] : st === 2 ? LV[3] : LV[1], stL: st === 1 ? X('согласовано · экспресс','freigegeben · Express','approved · express') : st === 2 ? X('отклонено → регулярный рейс','abgelehnt → Regelfahrt','rejected → regular trip') : n + ' / 3 ' + X('подписи','Unterschriften','signatures'), open: st === 0,
        signers: BLAP.map((role, i) => ({ role, mark: ap[i] ? '✓' : '—', bg: ap[i] ? LV[0].bg : 'transparent', fg: ap[i] ? LV[0].fg : 'var(--color-text)', bc: ap[i] ? LV[0].bc : 'var(--color-accent)',
          sign: () => { if (st !== 0 || ap[i]) return; this.setState(x => { const cur = x.exAp[e.id] || {}, a0 = (cur.a || [false, false, false]).slice(); if (cur.rej || a0[i]) return null; a0[i] = true; if (a0.every(Boolean)) setTimeout(() => this.showToast(e.id + ': ' + X('согласовано 3/3','3/3 freigegeben','approved 3/3')), 0); return { exAp: { ...x.exAp, [e.id]: { ...cur, a: a0 } } }; }); this.log(X('Экспресс · ','Express · ','Express · ') + e.id + ' · ' + role + ' ✓'); } })),
        reject: () => { set({ rej: true }); this.log(X('Экспресс · ','Express · ','Express · ') + e.id + X(' отклонён → регулярный рейс',' abgelehnt → Regelfahrt',' rejected → regular trip')); this.showToast(e.id + X(': отклонено, экономия ',': abgelehnt, Einsparung ',': rejected, saving ') + nf(e.kg * (BLD.expRate - BLD.ltlRate)) + ' ₸'); } }; });
    const blLaunch = BLT.map(([d, t, ref, lvl]) => ({ d, t, ref, l: LV[lvl] }));
    const PR = [[X('Высокий','Hoch','High'), 'var(--color-accent-900)', 'var(--color-bg)', 'var(--color-accent-900)'], [X('Средний','Mittel','Medium'), 'var(--color-accent-200)', 'var(--color-accent-900)', 'var(--color-accent-400)'], [X('Низкий','Niedrig','Low'), 'transparent', 'var(--color-neutral-800)', 'var(--color-divider)']];
    const FST3 = [[X('реализовано','umgesetzt','done'), LV[0]], [X('план v5','Plan v5','plan v5'), { bg: 'transparent', fg: 'var(--color-neutral-800)', bc: 'var(--color-divider)' }], [X('вопрос к KDL','Frage an KDL','question to KDL'), LV[1]]];
    const blFrs = BLFR.map(([id, mod, p, title, why, ac, st]) => ({ id, mod, prio: PR[p][0], pbg: PR[p][1], pfg: PR[p][2], pbc: PR[p][3], title, why, ac, stL: FST3[st][0], l: FST3[st][1] }));
    const blKpis = [
      { k: X('Объём сети','Netzvolumen','Network volume'), v: nf(BLD.kgMon) + ' ' + U.kg + '/' + U.mo, sub: nf(BLD.waybills) + X(' накладных/мес · ~17 000 кг/нед (A1)',' Frachtbriefe/Monat · ~17 000 kg/Woche (A1)',' waybills/month · ~17,000 kg/week (A1)') },
      { k: X('Темп. отправки 2026','Temperatursendungen 2026','Temperature shipments 2026'), v: String(BLD.tempN), sub: X('≈ 35/мес · 2–8 °C — 77 % (A1)','≈ 35/Monat · 2–8 °C — 77 % (A1)','≈ 35/month · 2–8 °C — 77 % (A1)') },
      { k: X('Аутсорсинг сегодня','Outsourcing heute','Outsourcing today'), v: fmt(outs * 12 / 1e6) + ' ' + U.mln, sub: X('в год · GarantA + KazExpress (G25)','pro Jahr · GarantA + KazExpress (G25)','per year · GarantA + KazExpress (G25)') },
      { k: X('Экспресс','Express','Express'), v: fmt(expM / outs * 100) + ' %', sub: X('бюджета при ','des Budgets bei ','of budget at ') + fmt(BLD.expKg / BLD.kgMon * 100) + X(' % веса (A2)',' % Gewicht (A2)',' % of weight (A2)') },
      { k: X('Ставка ₸/кг','Satz ₸/kg','Rate ₸/kg'), v: BLD.ownRate + ' · ' + BLD.ltlRate + ' · ' + nf(BLD.expRate), sub: X('свой · сборный · экспресс (G30)','eigen · Stückgut · Express (G30)','own · LTL · express (G30)') },
      { k: X('Инвестиции','Investition','Investment'), v: fmt(BLD.capexNet) + ' ' + U.mln, sub: X('без НДС · ','ohne MwSt. · ','excl. VAT · ') + fmt(BLD.capexVat) + X(' с НДС 16 % (H31)',' inkl. 16 % MwSt. (H31)',' incl. 16 % VAT (H31)') },
      { k: X('Окупаемость','Amortisation','Payback'), v: fmt(BLD.payback, 2) + ' ' + U.yr, sub: 'NPV ' + fmt(BLD.npv) + ' ' + U.mln + ' · IRR ' + fmt(BLD.irr) + ' % (N77)' },
      { k: X('Старт R1','Start R1','R1 start'), v: X('12.2026','12.2026','12.2026'), sub: X('Запад 01.2027 · остальные 02–03.2027 (S133)','West 01.2027 · übrige 02–03.2027 (S133)','West 01.2027 · rest 02–03.2027 (S133)') }
    ];
    return { blTabs, blIs, blFOpts, blFind, blGaps: BLG.map(([t, ref]) => ({ t, ref })), blCities, blCitySum, blRings, blFleet, blFleetSum, blRates, blSens, blEcon, blEx, blLaunch, blPilot: BLPILOT, blFrs, blKpis,
      blFrDone: BLFR.filter(f => f[6] === 0).length, blFrN: BLFR.length };
  }
