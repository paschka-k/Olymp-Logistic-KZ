  loadCalc() {
    const handedO = ORD.filter(o => this.state.ord[o.id] && this.fullyHanded(o.id)).map(o => o.id);
    const sel = ORD.filter(o => this.state.ord[o.id] && !handedO.includes(o.id));
    const sum = k => sel.reduce((a, o) => a + o[k], 0), by = c => sel.filter(o => o.cls === c);
    const coldPal = by('cold').reduce((a, o) => a + o.pal, 0), ambPal = by('amb').reduce((a, o) => a + o.pal, 0);
    const coldKg = by('cold').reduce((a, o) => a + o.kg, 0) + by('frz').reduce((a, o) => a + o.kg, 0), ambKg = by('amb').reduce((a, o) => a + o.kg, 0);
    const kg = sum('kg'), m3 = sum('m3'), m3c = by('cold').concat(by('frz')).reduce((a, o) => a + o.m3, 0), m3a = by('amb').reduce((a, o) => a + o.m3, 0);
    const front = 4300 + coldKg * 0.75 + ambKg * 0.3, rear = 3700 + coldKg * 0.25 + ambKg * 0.7, gross = 8000 + kg;
    const third = sel.filter(o => o.third), thirdPal = third.reduce((a, o) => a + o.pal, 0);
    const adr = sel.some(o => o.adr), frz = by('frz').length > 0;
    const slot = (list, n) => { const out = []; list.forEach(o => { for (let i = 0; i < o.pal; i++) out.push(o.id); }); const res = [];
      for (let i = 0; i < Math.max(n, out.length); i++) { const id = out[i], over = i >= n;
        res.push(id ? { label: over ? id + ' · über Kapazität' : id, bs: over ? 'dashed' : 'solid', bc: over ? 'var(--color-accent-900)' : 'var(--color-accent-500)', bg: over ? 'var(--color-accent-900)' : 'var(--color-accent-200)', fg: over ? 'var(--color-bg)' : 'var(--color-accent-900)' }
          : { label: 'frei', bs: 'dashed', bc: 'var(--color-divider)', bg: 'transparent', fg: 'var(--color-neutral-600)' }); }
      return res; };
    const pct = (v, m) => v / m;
    const lvlOf = p => p > 1 ? 3 : p > 0.92 ? 2 : p > 0.8 ? 1 : 0;
    const bar = (label, v, m, unit) => { const p = pct(v, m), l = lvlOf(p); return { label, w: Math.min(100, p * 100).toFixed(0) + '%', fill: l >= 3 ? 'var(--color-accent-900)' : l === 2 ? 'var(--color-accent-700)' : 'var(--color-accent)', val: unit(v) + ' / ' + unit(m) + ' · ' + Math.round(p * 100) + '%', p }; };
    const bars = [
      bar(X('Термоконтейнеры 2–8 °C, пал.-места','Thermocontainer 2–8 °C, Palettenplätze','Thermo containers 2–8 °C, pallet places'), coldPal, 4, x => fmt(x, 0)), bar(X('Паллеты 15–25 °C','Paletten 15–25 °C','Pallets 15–25 °C'), ambPal, 14, x => fmt(x, 0)),
      bar(X('Объём, м³','Volumen, m³','Volume, m³'), m3, 50.4, x => fmt(x, 1)), bar(X('Полезная нагрузка, кг','Nutzlast, kg','Payload, kg'), kg, 10000, x => fmt(x, 0)),
      bar(X('Передняя ось, кг','Vorderachse, kg','Front axle, kg'), front, 6500, x => fmt(x, 0)), bar(X('Задняя ось, кг','Hinterachse, kg','Rear axle, kg'), rear, 11500, x => fmt(x, 0)), bar(X('Полная масса, кг','Gesamtmasse, kg','Gross weight, kg'), gross, 18000, x => fmt(x, 0))
    ];
    const alerts = [];
    if (ambPal > 14) alerts.push({ lvl: 3, text: X('Зона 15–25 °C перегружена: ' + ambPal + ' / 14 паллет — перенести заказ на следующий цикл или передать партнёру.','Zone 15–25 °C überladen: ' + ambPal + ' / 14 Paletten — Auftrag in den nächsten Zyklus verschieben oder an Partner übergeben.','15–25 °C zone overloaded: ' + ambPal + ' / 14 pallets — move the order to the next cycle or hand it to a partner.') });
    if (coldPal > 4) alerts.push({ lvl: 3, text: X('Термоконтейнеры 2–8 °C: ' + coldPal + ' / 4 пал.-места — добавить контейнер или перенести.','Thermocontainer 2–8 °C: ' + coldPal + ' / 4 Palettenplätze — Container ergänzen oder verschieben.','Thermo containers 2–8 °C: ' + coldPal + ' / 4 pallet places — add a container or postpone.') });
    if (front > 6500) alerts.push({ lvl: 3, text: X('Перегруз передней оси: ','Überladung Vorderachse: ','Front axle overload: ') + fmt(front, 0) + ' ' + U.kg + '.' });
    else if (front > 6500 * 0.92) alerts.push({ lvl: 2, text: X('Передняя ось ','Vorderachse ','Front axle ') + Math.round(front / 65) + X(' % — тяжёлые реагенты у передней стенки.',' % — schwere Reagenzien an der Stirnwand.',' % — heavy reagents at the front wall.') });
    const fix = this.state.scanFix || {};
    const rec = sel.map(o => { const exp = PKG[o.id] || 1, real = LINES.filter(l => l.ord === o.id).length, n = fix[o.id] ? exp : Math.min(real, exp), okR = n >= exp;
      return { id: o.id, to: o.to, desc: o.desc, n, exp, l: LV[okR ? 0 : 2], mark: okR ? 'abgeglichen' : 'fehlt', canFix: !okR, fix: () => { this.setState(x => ({ scanFix: { ...x.scanFix, [o.id]: true } })); this.showToast(o.id + ': Packstück nachgescannt, Abgleich bestanden'); } }; });
    rec.filter(r => r.n < r.exp).forEach(r => alerts.push({ lvl: 2, text: 'Packstückabgleich: ' + r.id + ' — gescannt ' + r.n + ' von ' + r.exp + ' (SSCC). Tourfreigabe gesperrt bis zum Nachscannen.' }));
    LINES.filter(l => sel.some(o => o.id === l.ord) && isShort(l)).forEach(l => alerts.push({ lvl: 2, text: 'FEFO: ' + l.art + ' (LOT ' + l.lot + ') verwendbar bis ' + l.exp + ' — kurze Restlaufzeit, mit Filiale abstimmen ' + l.to + '.' }));
    if (handedO.length) alerts.push({ lvl: 1, text: 'An Partner übergeben: ' + handedO.join(', ') + ' — Packstücke aus der eigenen Beladung entfernt.' });
    if (third.length) alerts.push({ lvl: 1, text: 'Fremdfracht: ' + third.length + ' Auftrag/Aufträge, ' + thirdPal + ' Pal. — eigener Beförderungsvertrag, TTN und ESF für die Leistung; Paletten nicht mit KDL-Ware mischen.' });
    if (frz) alerts.push({ lvl: 1, text: 'Ware −20 °C: separate Thermobox mit Trockeneis (UN 1845), Kennzeichnung nach ADR.' });
    if (adr) alerts.push({ lvl: VM.V02.adr && DRV.D6.adr ? 0 : 3, text: 'ADR: Fahrzeug zugelassen, Fahrer O. Petrenko — Bescheinigung bis 05.2027.' });
    if (!alerts.length) alerts.push({ lvl: 0, text: 'Keine Einschränkungen.' });
    const vp = m3 / 50.4, wp = kg / 10000;
    return { rec, recOk: rec.every(r => r.n >= r.exp), sel, coldPal, ambPal, kg, m3, adr, front, bars,
      alerts: alerts.map(a => ({ ...a, l: LV[a.lvl] })), maxLvl: Math.max(...alerts.map(a => a.lvl)),
      coldSlots: slot(by('cold'), 4), ambSlots: slot(by('amb'), 14), third,
      insight: 'Begrenzender Faktor — ' + (vp > wp ? 'Volumen und Palettenplätze' : 'Gewicht') + ': Volumen ' + Math.round(vp * 100) + ' %, Gewicht ' + Math.round(wp * 100) + ' %. Leichte, voluminöse Ware — nach Paletten und m³ planen, nicht nur nach Masse.',
      sum: [{ label: X('Паллеты','Paletten','Pallets'), value: fmt(coldPal + ambPal, 0) + ' / 18' }, { label: X('Сторонний груз','Fremdfracht','Third-party cargo'), value: thirdPal + X(' пал.',' Pal.',' pal.') }, { label: X('Объём','Volumen','Volume'), value: fmt(m3, 1) + ' ' + U.m3 + ' / 50,4' }, { label: X('Масса груза','Lademasse','Cargo weight'), value: fmt(kg, 0) + ' ' + U.kg }, { label: X('ДОПОГ','ADR','ADR'), value: adr ? X('Да · LQ','Ja · LQ','Yes · LQ') : X('Нет','Nein','No') }] };
  }
