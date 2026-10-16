  shipVals() {
    const s = this.state, hubOk = h => s.hub === 'all' || s.hub === h;
    const tripOf = id => TRIPS.find(r => r.id === id);
    const stOf = r => STATUS[r.id === 'R-106' && s.sent[r.id] ? 'loading' : r.status];
    const clsL = c => TL[c];
    const shipTrips = TRIPS.filter(r => hubOk(r.hub) && LINES.some(l => l.trip === r.id)).map(r => ({ id: r.id, n: LINES.filter(l => l.trip === r.id).length, sub: r.route.join(' → ') + ' · ' + stOf(r),
      select: () => this.setState({ shipTrip: r.id, shipSel: null }), bc: r.id === s.shipTrip ? 'var(--color-accent-700)' : 'var(--color-divider)', bg: r.id === s.shipTrip ? 'var(--color-accent-100)' : 'transparent' }));
    const lines = LINES.filter(l => l.trip === s.shipTrip);
    const sel = lines.find(l => l.id === s.shipSel) || lines[0];
    const shipLines = lines.map(l => ({ ...l, ...ML(l.mfr), short: isShort(l), clsL: clsL(l.cls), select: () => this.setState({ shipSel: l.id }),
      bc: sel && l.id === sel.id ? 'var(--color-accent-700)' : 'transparent', bg: sel && l.id === sel.id ? 'var(--color-accent-100)' : 'transparent' }));
    let lab = null;
    if (sel) { const r = tripOf(sel.trip), marks = [];
      if (sel.cls === 'cold') marks.push('+2…+8 °C · НЕ ЗАМОРАЖИВАТЬ'); if (sel.cls === 'frz') marks.push('−20 °C · СУХОЙ ЛЁД UN 1845'); if (sel.cls === 'amb') marks.push('+15…+25 °C · БЕРЕЧЬ ОТ МОРОЗА');
      if (sel.adr) marks.push('ДОПОГ · LQ'); if (sel.third) marks.push('СТОРОННИЙ ГРУЗ'); if (isShort(sel)) marks.push('КОРОТКИЙ СРОК · FEFO');
      marks.push('IVD · медицинские изделия'); marks.push('Хрупкое · не кантовать');
      lab = { ...sel, ...ML(sel.mfr), clsL: clsL(sel.cls), from: 'ТОО «Olymp Logistic» · ' + (r.hub === 'ast' ? 'хаб Астана' : 'хаб Алматы'), toFull: sel.third ? ORD.find(o => o.id === sel.ord)?.desc.split('· ')[1] || sel.to : 'Филиал KDL Olymp · ' + sel.to,
        track: (() => { const st = r.id === 'R-106' && s.sent[r.id] ? 'loading' : r.status, tm = x => x.includes('·') ? x.replace(' · ', ' ') : '06.10 ' + x, E = [];
          const add = (t, text, bad) => E.push({ t, text, fill: bad ? 'transparent' : 'var(--color-accent)', fg: bad ? 'var(--color-accent-900)' : 'var(--color-text)', fw: bad ? 600 : 400 });
          add('05.10 18:20', 'Скомплектовано · ' + (r.hub === 'ast' ? 'хаб Астана' : 'хаб Алматы') + ', зона ' + TL[sel.cls]); add('05.10 18:24', 'Проверка SSCC ↔ ' + sel.pl); const hr = this.handedMap()[sel.id];
          if (hr) { add('06.10 15:10', 'Передано партнёру · ' + hr.partner + ' · ' + hr.city); if (hr.portal >= 1) add('06.10 15:40', 'Партнёр: груз принят'); if (hr.portal >= 2) add('06.10 15:55', 'Партнёр: SSCC отсканированы'); if (hr.portal >= 3) add('07.10 11:20', 'Партнёр: ePOD загружен'); }
          const exp = PKG[sel.ord], real = LINES.filter(l => l.ord === sel.ord).length; if (exp && real < exp && !(s.scanFix || {})[sel.ord]) add('—', 'Расхождение: отсканировано ' + real + ' из ' + exp + ' мест заказа ' + sel.ord, true);
          if (['loading', 'transit', 'done'].includes(st)) add(tm(r.dep), 'Погружено в ' + r.veh + ' ' + VM[r.veh].plate + ' · камера ' + TL[sel.cls]);
          if (['transit', 'done'].includes(st)) add('06.10 ' + this.clockStr(s.t).slice(0, 5), 'В пути · GPS: ' + VM[r.veh].where);
          if (st === 'done') { add(tm(r.eta), 'Выгружено · филиал ' + sel.to); add(tm(r.eta), 'Принято филиалом · ePOD, температурная квитанция'); }
          if (st === 'plan') add('08.10 06:00', 'Ожидает погрузки (план)', false);
          return E; })(),
        zpl: ['^XA', '^CI28', '^PW812^LL1218', '^FO40,40^A0N,28,28^FDОтправитель: ' + 'ТОО «Olymp Logistic»' + '^FS', '^FO40,80^A0N,28,28^FDПолучатель: ' + (sel.third ? sel.to : 'Филиал KDL Olymp · ' + sel.to) + '^FS',
          '^FO40,140^A0N,34,34^FDPO ' + sel.po + '   PL ' + sel.pl + '^FS', '^FO40,190^A0N,28,28^FD' + sel.art + ' · LOT ' + sel.lot + ' · EXP ' + sel.exp + '^FS', '^FO40,230^A0N,28,28^FD' + sel.qty + ' · ' + sel.name + '^FS',
          '^FO40,300^A0N,64,64^FD' + clsL(sel.cls) + '^FS', '^FO40,420^BY3^BCN,220,Y,N,N,D^FD(00)' + sel.sscc + '^FS', '^XZ'].join('\n'),
        tNote: sel.cls === 'cold' ? 'НЕ ЗАМОРАЖИВАТЬ' : sel.cls === 'frz' ? 'СУХОЙ ЛЁД' : 'БЕРЕЧЬ ОТ МОРОЗА', tBg: sel.cls === 'amb' ? 'transparent' : 'var(--color-text)', tFg: sel.cls === 'amb' ? 'var(--color-text)' : 'var(--color-bg)', marks }; }
    const q = s.q.trim().toLowerCase(), qn = q.replace(/\s/g, '');
    let qRes = [];
    if (q.length >= 2) {
      const ai = s.q.replace(/[()\s]/g, ''), scanS = /^00\d{18}$/.test(ai) ? ai.slice(2) : /^\d{18}$/.test(ai) ? ai : null;
      LINES.forEach(l => { const r = tripOf(l.trip); if (!r || (!s.qArch && r.status === 'done') || !hubOk(r.hub)) return;
        const f = scanS && l.sscc === scanS ? ['sscc', 'SSCC (скан)'] : QF.find(([k]) => { const v = String(l[k]).toLowerCase(); return v.includes(q) || (qn && v.replace(/\s/g, '').includes(qn)); });
        if (f) qRes.push({ ...ML(l.mfr), exact: !!(scanS && l.sscc === scanS), lineId: l.id, tripId: l.trip, field: f[1], hit: l[f[0]], name: l.name, art: l.art, lot: l.lot, qty: l.qty, to: l.to, trip: l.trip, veh: r.veh, status: stOf(r), where: VM[r.veh].where,
          go: () => this.setState({ screen: 'ship', shipTrip: l.trip, shipSel: l.id, q: '' }) }); });
    }
    return { mfrList: Object.keys(MFR).map(k => { const n = LINES.filter(l => l.mfr === k).length, r = ML(k); return { key: k, ...r, grp: MFR_G[MFR[k][4]], n: n + ' ' + X('мест','Stück','items'), bc: MFR[k][4] === 0 ? 'var(--color-accent)' : 'var(--color-divider)' }; }), mfrN: Object.keys(MFR).length, shipTrips, shipTripId: s.shipTrip, shipLines, lab, hasLabel: !!lab,
      printLabel: () => this.showToast('Этикетка ' + (sel ? sel.sscc : '') + ' отправлена на принтер (демо)'),
      q: s.q, onQ: e => this.setState({ q: e.target.value, qIdx: 0 }), hasQ: q.length >= 2,
      qRes: qRes.slice(0, 12).map((r, i) => ({ ...r, active: i === s.qIdx, bg: i === s.qIdx ? 'var(--color-accent-100)' : 'transparent', ol: i === s.qIdx ? '2px solid var(--color-accent)' : 'none' })),
      onQKey: e => { const list = qRes.slice(0, 12);
        if (e.key === 'ArrowDown') { e.preventDefault(); this.setState({ qIdx: Math.min(list.length - 1, s.qIdx + 1) }); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); this.setState({ qIdx: Math.max(0, s.qIdx - 1) }); }
        else if (e.key === 'Escape') this.setState({ q: '', qIdx: 0 });
        else if (e.key === 'Enter') { const pick = list.find(r => r.exact) || (s.scan ? null : list[s.qIdx]); if (pick) { pick.go(); if (s.scan) this.showToast('Скан: ' + pick.hit + ' → ' + pick.tripId); } else if (s.scan) this.showToast('Скан не распознан как SSCC'); } },
      toggleScan: () => this.setState({ scan: !s.scan }), scanPressed: s.scan, scanLabel: s.scan ? 'Сканер · вкл' : 'Сканер', scanBg: s.scan ? 'var(--color-accent)' : 'transparent', scanFg: s.scan ? 'var(--color-bg)' : 'var(--color-accent-800)',
      qPlaceholder: s.scan ? 'Отсканируйте штрихкод места (GS1-128)…' : 'Поиск: товар, PO, PL, артикул, партия, SSCC',
      toggleArch: () => this.setState({ qArch: !s.qArch }), qArch: s.qArch, archBox: s.qArch ? 'var(--color-accent)' : 'transparent',
      toggleZpl: () => this.setState({ zpl: !s.zpl }), zplOpen: s.zpl, zplLabel: s.zpl ? 'Скрыть ZPL' : 'ZPL для Zebra (GS1-128)', noQ: q.length >= 2 && !qRes.length,
      qCount: 'Найдено в текущих отправках: ' + qRes.length };
  }
