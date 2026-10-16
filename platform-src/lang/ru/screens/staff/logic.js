  staffVals() {
    const s = this.state, hubOk = h => s.hub === 'all' || s.hub === h;
    const SN = Object.fromEntries(STAFF.map(p => [p.id, p]));
    const short = n => { const a = n.split(' '); return a[0][0] + '. ' + a[1]; };
    const stOf = p => s.urg[p.id] ? 'trip' : p.st;
    const hubL = h => h === 'ast' ? 'Астана' : 'Алматы';
    const staff = STAFF.filter(p => hubOk(p.hub)).map(p => { const k = stOf(p);
      return { ...p, stLabel: STYPE[k].label, l: LV[STYPE[k].lvl], where: s.urg[p.id] ? 'Срочный рейс U-01 · выезд через 40 мин' : p.where,
        vehS: s.urgV[p.id] || p.veh || '—', adrS: p.adr || '—', tacho: TACHO[p.id] != null ? 'вожд. ' + fmt(TACHO[p.id]) + ' ч · ост. ' + fmt(9 - TACHO[p.id]) + ' ч' : '—', adrWarn: (daysTo(p.adr) ?? 999) <= 60, adrWarnT: 'истекает через ' + daysTo(p.adr) + ' дн.', hubS: hubL(p.hub), avail: s.urg[p.id] ? 'назначен на срочный рейс' : p.u[1], availL: LV[s.urg[p.id] ? 1 : p.u[0] === 2 ? 0 : p.u[0] === 1 ? 1 : 2],
        cal: p.cal.slice(0, 14).split('').map((c, i) => { const C = CAL[(i === 0 && s.urg[p.id]) ? 'r' : c] || CAL.o; return { a: C.a, bg: C.bg, fg: C.fg, bd: C.bd }; }) }; });
    const cnt = k => STAFF.filter(p => hubOk(p.hub) && stOf(p) === k).length;
    const staffKpis = [['В рейсе', cnt('trip')], ['Дежурство / резерв', cnt('duty')], ['Больничный', cnt('sick')], ['Отпуск', cnt('vac')], ['Обучение', cnt('train')], ['Онбординг', cnt('onb')], ['Увольнение', cnt('exit')]].map(([label, v]) => ({ label, value: String(v) }));
    const cand = STAFF.filter(p => p.hub === s.urgHub).map(p => { let ok = s.urg[p.id] ? 0 : p.u[0], why = s.urg[p.id] ? 'уже назначен' : p.u[1];
      const th = TACHO[p.id]; if (ok && th != null && 9 - th < URG_H) { ok = 0; why = 'мало времени вождения: ост. ' + fmt(9 - th) + ' ч (нужно ' + URG_H + ')'; }
      if (ok && s.urgAdr && !p.adr) { ok = 0; why = 'нет свидетельства ДОПОГ'; }
      if (ok && s.urgHeavy && p.cat === 'B') { ok = 0; why = 'нужна категория C (7,5 / 12,5 т)'; }
      return { id: p.id, name: p.name, cat: 'кат. ' + p.cat + (p.adr ? ' · ДОПОГ' : ''), why, ok, l: LV[ok === 2 ? 0 : ok === 1 ? 1 : 3], mark: ok === 2 ? 'сейчас' : ok === 1 ? 'позже' : 'нет' }; })
      .sort((a, b) => b.ok - a.ok);
    const best = cand.find(c => c.ok === 2);
    const busy = { V02: 'закреплена за R-106 (08.10)', V03: 'погрузка R-104' }, usedV = Object.values(s.urgV);
    const vcand = VEH.filter(v => v.hub === s.urgHub && v.thermo).map(v => { const fe = FEES[v.id] || {}; let ok = 1, why = 'свободна · ' + v.cls + ' · ' + v.where;
      if (usedV.includes(v.id)) { ok = 0; why = 'назначена на срочный рейс'; } else if (s.vehSt[v.id] === 'workshop') { ok = 0; why = 'в сервисе'; } else if (v.st === 'line') { ok = 0; why = 'на линии · ' + v.where; } else if (busy[v.id]) { ok = 0; why = busy[v.id]; }
      else if (/истекла/.test(v.calib)) { ok = 0; why = 'калибровка логгера истекла'; } else if ((fe.lvl || 0) >= 3) { ok = 0; why = fe.note || 'блокирует выпуск'; }
      else if (s.urgHeavy && v.cls === '3,5 т') { ok = 0; why = 'класс 3,5 т — нужна 7,5 / 12,5 т'; } else if (s.urgAdr && !v.adr) { ok = 0; why = 'нет допуска ДОПОГ'; }
      return { id: v.id, plate: v.plate, why, ok, l: LV[ok ? 0 : 3], mark: ok ? 'свободна' : 'нет' }; }).sort((a, b) => b.ok - a.ok);
    const bestV = vcand.find(v => v.ok);
    const docExp = [];
    STAFF.forEach(p => { [['adr', 'Свидетельство ДОПОГ', p.adr], ['lic', 'Водительское удостоверение', LIC[p.id]]].forEach(([k, doc, d]) => { const n = daysTo(d); if (n == null || n > 90) return; const key = p.id + k, bk = s.booked[key];
      docExp.push({ name: p.name, doc, date: d, left: n + ' дн.', l: LV[n <= 60 ? 2 : 1], can: !bk, booked: !!bk, bookedT: 'записан · ' + (k === 'adr' ? 'курс ДОПОГ 20.10' : 'ЦОН 15.10'),
        book: () => { this.setState(x => ({ booked: { ...x.booked, [key]: true } })); this.log('Персонал · ' + p.name + ' · запись на продление: ' + doc); this.showToast(p.name + ': записан на продление (' + doc + ')'); } }); }); });
    const seg2 = (cur, v) => ({ bg: cur === v ? 'var(--color-accent)' : 'transparent', fg: cur === v ? 'var(--color-bg)' : 'var(--color-text)' });
    const toMin = t => { const [a, b] = t.split(':'); return +a * 60 + +b; };
    const money = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
    const fines = [...s.fineImp, ...FINES].filter(f => hubOk(VM[f.veh].hub)).map(f => { const tm = toMin(f.t), g = f.seg.find(x => tm >= x[0] && tm < x[1]) || f.seg[0], d = SN[g[2]], stc = s.fineSt[f.id] || f.st;
      return { ...f, tm, drvId: d.id, drvName: d.name, pl: g[3], amtS: money(f.amt), stc, stLabel: FST[stc].label, l: LV[FST[stc].lvl], plate: VM[f.veh].plate,
        select: () => this.setState({ fineSel: f.id }), bc: f.id === s.fineSel ? 'var(--color-accent-700)' : 'transparent', bg: f.id === s.fineSel ? 'var(--color-accent-100)' : 'transparent' }; });
    const fs = fines.find(f => f.id === s.fineSel) || fines[0];
    const pct = m => (m / 1440 * 100).toFixed(2) + '%';
    const setF = (st, txt) => { this.setState(x => ({ fineSt: { ...x.fineSt, [fs.id]: st } })); this.log('Штрафы · ' + fs.id + ' · ' + txt); this.showToast(fs.id + ': ' + txt); };
    const fine = fs ? { ...fs,
      segs: fs.seg.map((g, i) => { const hit = fs.tm >= g[0] && fs.tm < g[1];
        return { left: pct(g[0]), width: pct(g[1] - g[0]), label: short(SN[g[2]].name) + ' · ' + g[3], sub: g[4], bg: hit ? 'var(--color-accent-700)' : i % 2 ? 'var(--color-neutral-300)' : 'var(--color-accent-200)', fg: hit ? 'var(--color-bg)' : 'var(--color-text)' }; }),
      mark: pct(fs.tm), canAct: fs.stc === 'unpaid',
      pay: () => setF('paid50', 'оплачен со скидкой 50 %'), deduct: () => setF('deduct', 'удержание из зарплаты согласовано'), dispute: () => setF('disputed', 'подано возражение'),
      notify: () => { this.log('Штрафы · ' + fs.id + ' · уведомление водителю ' + fs.drvName); this.showToast('Уведомление отправлено: ' + fs.drvName + ' (приложение водителя)'); } } : null;
    const drvRep = STAFF.filter(p => DREP[p.id] && hubOk(p.hub)).map(p => { const r = DREP[p.id], my = fines.filter(f => f.drvId === p.id), open = my.filter(f => f.stc === 'unpaid' || f.stc === 'deduct');
      return { name: p.name, hubS: hubL(p.hub), ...r, fines: my.length ? my.length + ' · ' + money(my.reduce((a, f) => a + f.amt, 0)) : '—', open: open.length ? money(open.reduce((a, f) => a + f.amt, 0)) : '—', openL: LV[open.length ? 2 : 0] }; });
    return {
      staff, staffKpis, calDays: CAL_DAYS, cand, hasBest: !!(best && bestV), noVeh: !bestV, bestLabel: best && bestV ? 'Назначить: ' + best.name + ' + ' + bestV.id : '', vcand, docExp, urgHubName: hubL(s.urgHub),
      assign: () => { if (!best || !bestV) return; this.setState(x => ({ urg: { ...x.urg, [best.id]: true }, urgV: { ...x.urgV, [best.id]: bestV.id } })); this.log('Персонал · срочный рейс U-01 → ' + best.name); this.showToast('Срочный рейс U-01 назначен: ' + best.name + ' · ' + bestV.id); },
      urgHubOpts: [['ast', 'Астана'], ['alm', 'Алматы']].map(([k, label]) => ({ label, go: () => this.setState({ urgHub: k }), ...seg2(s.urgHub, k) })),
      urgAdrBox: s.urgAdr ? 'var(--color-accent)' : 'transparent', urgHeavyBox: s.urgHeavy ? 'var(--color-accent)' : 'transparent',
      toggleUrgAdr: () => this.setState({ urgAdr: !s.urgAdr }), toggleUrgHeavy: () => this.setState({ urgHeavy: !s.urgHeavy }),
      fines, fine, hasFine: !!fine, drvRep,
      importFines: () => { if (s.fineImp.length) return; this.setState({ fineImp: [FINE_IMPORT] }); this.log('Штрафы · автоимпорт «Сергек» / eGov: 1 новое постановление'); this.showToast('Импортировано 1 постановление: ' + FINE_IMPORT.id + ' · водитель определён автоматически'); },
      importLabel: s.fineImp.length ? 'Импорт выполнен · 06.10 ' + this.clockStr(s.t).slice(0, 5) : 'Импорт постановлений («Сергек», eGov)', importOp: s.fineImp.length ? 0.6 : 1,
      importNote: 'ежедневно в 07:00 · сверка по госномеру и времени с журналом ТС',
      fineRem: [...s.fineImp, ...FINES].filter(f => (s.fineSt[f.id] || f.st) === 'unpaid' && daysTo(f.due) != null && daysTo(f.due) <= 7).map(f => 'Скидка 50 % истекает: ' + f.id + ' до ' + f.due + ' — осталось ' + daysTo(f.due) + ' дн. · напоминание отправлено водителю и бухгалтерии')
    };
  }
