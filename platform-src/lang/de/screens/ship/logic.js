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
      if (sel.cls === 'cold') marks.push('+2…+8 °C · NICHT EINFRIEREN'); if (sel.cls === 'frz') marks.push('−20 °C · TROCKENEIS UN 1845'); if (sel.cls === 'amb') marks.push('+15…+25 °C · VOR FROST SCHÜTZEN');
      if (sel.adr) marks.push('ADR · LQ'); if (sel.third) marks.push('FREMDFRACHT'); if (isShort(sel)) marks.push('KURZE RESTLAUFZEIT · FEFO');
      marks.push('IVD · Medizinprodukte'); marks.push('Zerbrechlich · nicht kippen');
      lab = { ...sel, ...ML(sel.mfr), clsL: clsL(sel.cls), from: 'TOO „Olymp Logistic“ · ' + (r.hub === 'ast' ? 'Hub Astana' : 'Hub Almaty'), toFull: sel.third ? ORD.find(o => o.id === sel.ord)?.desc.split('· ')[1] || sel.to : 'Filiale KDL Olymp · ' + sel.to,
        track: (() => { const st = r.id === 'R-106' && s.sent[r.id] ? 'loading' : r.status, tm = x => x.includes('·') ? x.replace(' · ', ' ') : '06.10 ' + x, E = [];
          const add = (t, text, bad) => E.push({ t, text, fill: bad ? 'transparent' : 'var(--color-accent)', fg: bad ? 'var(--color-accent-900)' : 'var(--color-text)', fw: bad ? 600 : 400 });
          add('05.10 18:20', 'Kommissioniert · ' + (r.hub === 'ast' ? 'Hub Astana' : 'Hub Almaty') + ', Zone ' + TL[sel.cls]); add('05.10 18:24', 'Prüfung SSCC ↔ ' + sel.pl); const hr = this.handedMap()[sel.id];
          if (hr) { add('06.10 15:10', 'An Partner übergeben · ' + hr.partner + ' · ' + hr.city); if (hr.portal >= 1) add('06.10 15:40', 'Partner: Ware angenommen'); if (hr.portal >= 2) add('06.10 15:55', 'Partner: SSCC gescannt'); if (hr.portal >= 3) add('07.10 11:20', 'Partner: ePOD hochgeladen'); }
          const exp = PKG[sel.ord], real = LINES.filter(l => l.ord === sel.ord).length; if (exp && real < exp && !(s.scanFix || {})[sel.ord]) add('—', 'Abweichung: gescannt ' + real + ' von ' + exp + ' Packstücke des Auftrags ' + sel.ord, true);
          if (['loading', 'transit', 'done'].includes(st)) add(tm(r.dep), 'Verladen in ' + r.veh + ' ' + VM[r.veh].plate + ' · Kammer ' + TL[sel.cls]);
          if (['transit', 'done'].includes(st)) add('06.10 ' + this.clockStr(s.t).slice(0, 5), 'Unterwegs · GPS: ' + VM[r.veh].where);
          if (st === 'done') { add(tm(r.eta), 'Entladen · Filiale ' + sel.to); add(tm(r.eta), 'Von der Filiale angenommen · ePOD, Temperaturquittung'); }
          if (st === 'plan') add('08.10 06:00', 'Wartet auf Verladung (Plan)', false);
          return E; })(),
        zpl: ['^XA', '^CI28', '^PW812^LL1218', '^FO40,40^A0N,28,28^FDAbsender: ' + 'TOO „Olymp Logistic“' + '^FS', '^FO40,80^A0N,28,28^FDEmpfänger: ' + (sel.third ? sel.to : 'Filiale KDL Olymp · ' + sel.to) + '^FS',
          '^FO40,140^A0N,34,34^FDPO ' + sel.po + '   PL ' + sel.pl + '^FS', '^FO40,190^A0N,28,28^FD' + sel.art + ' · LOT ' + sel.lot + ' · EXP ' + sel.exp + '^FS', '^FO40,230^A0N,28,28^FD' + sel.qty + ' · ' + sel.name + '^FS',
          '^FO40,300^A0N,64,64^FD' + clsL(sel.cls) + '^FS', '^FO40,420^BY3^BCN,220,Y,N,N,D^FD(00)' + sel.sscc + '^FS', '^XZ'].join('\n'),
        tNote: sel.cls === 'cold' ? 'NICHT EINFRIEREN' : sel.cls === 'frz' ? 'TROCKENEIS' : 'VOR FROST SCHÜTZEN', tBg: sel.cls === 'amb' ? 'transparent' : 'var(--color-text)', tFg: sel.cls === 'amb' ? 'var(--color-text)' : 'var(--color-bg)', marks }; }
    const q = s.q.trim().toLowerCase(), qn = q.replace(/\s/g, '');
    let qRes = [];
    if (q.length >= 2) {
      const ai = s.q.replace(/[()\s]/g, ''), scanS = /^00\d{18}$/.test(ai) ? ai.slice(2) : /^\d{18}$/.test(ai) ? ai : null;
      LINES.forEach(l => { const r = tripOf(l.trip); if (!r || (!s.qArch && r.status === 'done') || !hubOk(r.hub)) return;
        const f = scanS && l.sscc === scanS ? ['sscc', 'SSCC (Scan)'] : QF.find(([k]) => { const v = String(l[k]).toLowerCase(); return v.includes(q) || (qn && v.replace(/\s/g, '').includes(qn)); });
        if (f) qRes.push({ ...ML(l.mfr), exact: !!(scanS && l.sscc === scanS), lineId: l.id, tripId: l.trip, field: f[1], hit: l[f[0]], name: l.name, art: l.art, lot: l.lot, qty: l.qty, to: l.to, trip: l.trip, veh: r.veh, status: stOf(r), where: VM[r.veh].where,
          go: () => this.setState({ screen: 'ship', shipTrip: l.trip, shipSel: l.id, q: '' }) }); });
    }
    return { mfrList: Object.keys(MFR).map(k => { const n = LINES.filter(l => l.mfr === k).length, r = ML(k); return { key: k, ...r, grp: MFR_G[MFR[k][4]], n: n + ' ' + X('мест','Stück','items'), bc: MFR[k][4] === 0 ? 'var(--color-accent)' : 'var(--color-divider)' }; }), mfrN: Object.keys(MFR).length, shipTrips, shipTripId: s.shipTrip, shipLines, lab, hasLabel: !!lab,
      printLabel: () => this.showToast('Etikett ' + (sel ? sel.sscc : '') + ' an den Drucker gesendet (Demo)'),
      q: s.q, onQ: e => this.setState({ q: e.target.value, qIdx: 0 }), hasQ: q.length >= 2,
      qRes: qRes.slice(0, 12).map((r, i) => ({ ...r, active: i === s.qIdx, bg: i === s.qIdx ? 'var(--color-accent-100)' : 'transparent', ol: i === s.qIdx ? '2px solid var(--color-accent)' : 'none' })),
      onQKey: e => { const list = qRes.slice(0, 12);
        if (e.key === 'ArrowDown') { e.preventDefault(); this.setState({ qIdx: Math.min(list.length - 1, s.qIdx + 1) }); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); this.setState({ qIdx: Math.max(0, s.qIdx - 1) }); }
        else if (e.key === 'Escape') this.setState({ q: '', qIdx: 0 });
        else if (e.key === 'Enter') { const pick = list.find(r => r.exact) || (s.scan ? null : list[s.qIdx]); if (pick) { pick.go(); if (s.scan) this.showToast('Scan: ' + pick.hit + ' → ' + pick.tripId); } else if (s.scan) this.showToast('Scan nicht als SSCC erkannt'); } },
      toggleScan: () => this.setState({ scan: !s.scan }), scanPressed: s.scan, scanLabel: s.scan ? 'Scanner · an' : 'Scanner', scanBg: s.scan ? 'var(--color-accent)' : 'transparent', scanFg: s.scan ? 'var(--color-bg)' : 'var(--color-accent-800)',
      qPlaceholder: s.scan ? 'Barcode des Packstücks scannen (GS1-128)…' : 'Suche: Ware, PO, PL, Artikel, Charge, SSCC',
      toggleArch: () => this.setState({ qArch: !s.qArch }), qArch: s.qArch, archBox: s.qArch ? 'var(--color-accent)' : 'transparent',
      toggleZpl: () => this.setState({ zpl: !s.zpl }), zplOpen: s.zpl, zplLabel: s.zpl ? 'ZPL ausblenden' : 'ZPL für Zebra (GS1-128)', noQ: q.length >= 2 && !qRes.length,
      qCount: 'In laufenden Sendungen gefunden: ' + qRes.length };
  }
