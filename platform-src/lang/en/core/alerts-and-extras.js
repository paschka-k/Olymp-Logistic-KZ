  alertsAll(load) {
    const s = this.state, L = s.live, out = [];
    VEH.forEach(v => {
      const r = L[v.id];
      if (!v.thermo) return;
      if (v.id === 'V03' && s.sim.fire) { out.push({ lvl: 3, src: 'Security · V03', text: 'V03: FIRE / smoke — smoke detector, cargo temperature ' + fmt(r.amb) + ' °C', scr: 'security' }); return; }
      if (r.cold < 2) out.push({ lvl: 3, src: 'Thermo status · ' + v.id, text: v.id + ': freezing risk in the 2–8 °C chamber — ' + fmt(r.cold) + ' °C', scr: 'thermo', veh: v.id });
      if (r.cold > 8) out.push({ lvl: 3, src: 'Thermo status · ' + v.id, text: v.id + ': 2–8 °C chamber overheating — ' + fmt(r.cold) + ' °C', scr: 'thermo', veh: v.id });
      if (r.amb < 15) out.push({ lvl: 2, src: 'Thermo status · ' + v.id, text: v.id + ': 15–25 °C chamber cooling down — ' + fmt(r.amb) + ' °C', scr: 'thermo', veh: v.id });
      if (v.id === 'V04' && s.door) out.push({ lvl: s.doorSec > 180 ? 2 : 1, src: 'Thermo status · V04', text: 'V04: 2–8 °C chamber door open ' + Math.round(s.doorSec / 60) + ' min', scr: 'thermo', veh: 'V04' });
      if (r.out < 0 && v.id === 'V04') out.push({ lvl: 1, src: 'Thermo status · V04', text: 'V04: outside ' + fmt(r.out) + ' °C — winter mode, heating on', scr: 'thermo', veh: 'V04' });
    });
    if (s.sim.breakdown) out.push({ lvl: 3, src: 'Partners · V01', text: 'V01: technical breakdown (gearbox) on the Astana–Karaganda road, km 112 — call Saryarka Auto LLP service, Karaganda', scr: 'partners' });
    if (s.sim.theft) out.push({ lvl: 3, src: 'Security · V01', text: 'V01: cargo door opened away from a delivery point, seal broken, stop 22 min — suspected theft', scr: 'security' });
    TRIPS.filter(r => r.status !== 'done').forEach(r => { const w = this.wxRisk(r); if (w.lvl >= 2) out.push({ lvl: w.lvl, src: 'Weather · ' + r.id, text: r.id + ': ' + w.cond.toLowerCase() + ' — ' + w.city + ', ' + w.day + ', wind ' + w.wind + ' m/s', scr: 'weather', city: w.city }); });
    if (load.maxLvl >= 2) load.alerts.filter(a => a.lvl >= 2).forEach(a => out.push({ lvl: a.lvl, src: 'Load · R-106', text: a.text, scr: 'load' }));
    [...s.extraInc, ...INC].forEach(i => { const st = s.inc[i.id]; if (st === 'new' || st === 'esc') out.push({ lvl: i.lvl, src: 'Security · ' + i.id, text: i.type + ': ' + i.text, scr: 'security' }); });
    return out.sort((a, b) => b.lvl - a.lvl);
  }

  extra(load, trips) {
    const s = this.state, L = s.live, ok = LV[0], bad = LV[3];
    const docTrips = TRIPS.filter(r => r.status !== 'done');
    const dt = docTrips.find(r => r.id === s.selTrip) || docTrips[docTrips.length - 1];
    const veh = VM[dt.veh], drv = DRV[dt.drv], is106 = dt.id === 'R-106';
    const D = [['order','Trip order / instruction','internal order of the logistics company'],['waybill','Trip sheet','pre-trip medical check of driver and vehicle inspection'],['ttn','TTN — goods transport waybill','shipper, consignee, packages, weight'],['transfer','Internal stock transfer note','own KDL Olymp goods · hub → branch'],['temp','Temperature sheet and logger assignment','Logger ID for every 2–8 °C shipment'],['reg','Registration certificates MD / IVD (copies)','on request at checkpoints']];
    if (is106 && load.third.length) D.push(['contract','Carriage contract / third-party customer order','third-party cargo · ' + load.third.map(o => o.id).join(', ')],['esf','ESF for transport service (IS ESF)','third-party cargo only'],['snt','SNT in IS ESF — if applicable','verify applicability with a KZ lawyer']);
    if (is106 && load.adr) D.push(['adrdoc','ADR transport document','UN number, class, packing group, LQ'],['adrinst','ADR instructions in writing','in the crew’s language: Russian / Kazakh'],['adrcert','ADR certificates driver and vehicle','O. Petrenko until 05.2027 · V02 approved']);
    (s.hos || []).filter(r => r.trip === dt.id && r.st === 'done').forEach(r => D.push(['ho_' + r.id, 'Handover report to partner · ' + r.partner, r.id + ' · ' + r.scope], ['hottn_' + r.id, 'Carrier waybill · ' + r.partner, 'handover point: ' + r.city]));
    D.push(['epod','Handover report (ePOD)','with temperature receipt — at delivery']);
    const preReady = ['order','temp','reg','adrcert']; D.forEach(([k]) => { if (k.startsWith('ho')) preReady.push(k); });
    const docs = D.map(([k, name, sub]) => { const key = dt.id + ':' + k, wait = k === 'epod';
      const ready = !wait && (dt.status !== 'plan' || preReady.includes(k) || !!s.docs[key]);
      const dst = s.docSt[key], esf = k === 'esf' || k === 'snt';
      const pdf = () => { const rows = LINES.filter(l => l.trip === dt.id).map(l => '<tr><td>' + l.sscc + '</td><td>' + l.po + '</td><td>' + l.pl + '</td><td>' + l.art + '</td><td>' + l.name + '</td><td>' + l.lot + '</td><td>' + l.exp + '</td><td>' + l.qty + '</td><td>' + TL[l.cls] + '</td></tr>').join('');
        const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + name + '</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin-top:12px}td,th{border:1px solid #444;padding:4px 6px;font-size:11px;text-align:left}p{font-size:12px}</style></head><body><h1>' + name + '</h1><p>Trip ' + dt.id + ' · ' + dt.route.join(' → ') + ' · ' + veh.id + ' ' + veh.plate + ' · driver ' + drv.name + '</p><p>Sender: Olymp Logistic LLP · Date: 06.10.2026</p><table><tr><th>SSCC</th><th>PO</th><th>PL</th><th>Article</th><th>Goods</th><th>LOT</th><th>Expiry</th><th>Qty</th><th>Class</th></tr>' + rows + '</table><p>Demo document. Form and details to be reviewed by a KZ lawyer and tax adviser.</p></body></html>';
        try { const u = URL.createObjectURL(new Blob([html], { type: 'text/html' })); window.open(u, '_blank'); } catch (e) {} this.log('Documents · ' + dt.id + ' · PDF: ' + name); this.showToast('Document “' + name + '” opened for print / PDF'); };
      return { name, sub, ready: !wait && ready, canSign: !wait && ready && !dst, canSend: esf && dst === 'signed', pdf,
        sign: () => { this.setState(x => ({ docSt: { ...x.docSt, [key]: 'signed' } })); this.log('E-signature · ' + dt.id + ' · ' + name + ' signed (NCALayer, demo)'); },
        send: () => { this.setState(x => ({ docSt: { ...x.docSt, [key]: 'sent' } })); this.log('IS ESF · ' + dt.id + ' · ' + name + ' sent'); this.showToast(name + ': sent to IS ESF (demo)'); },
        l: wait ? LV[1] : ready ? ok : LV[2], st: wait ? 'at delivery' : dst === 'sent' ? 'sent to IS ESF' : dst === 'signed' ? 'signed (e-signature)' : ready ? 'ready' : 'not generated', can: !wait && !ready,
        gen: () => { this.setState(x => ({ docs: { ...x.docs, [key]: true } })); this.log('Documents · ' + dt.id + ' · generated: ' + name); } }; });
    const missing = docs.filter(d => d.can).length;
    const w = this.wxRisk(dt), calibOk = !/expired/.test(veh.calib);
    const gate = [
      ['Vehicle available', (s.vehSt[veh.id] || veh.st) !== 'workshop', veh.id + ' · ' + veh.where],
      ['Suitable for the temperature class', veh.thermo, veh.thermo ? 'two chambers 2–8 / 15–25 °C' : 'no temperature control'],
      ['Driver qualified', true, drv.name + ' · driving time OK'],
      ['Documents complete', missing === 0, missing ? 'missing: ' + missing : 'set complete'],
      ['Insurance, tax and inspection OK', ((FEES[veh.id] || {}).lvl || 0) < 3, (FEES[veh.id] || {}).note || 'OGPO, KASKO, tax, inspection valid'],
      ['Packages reconciled (SSCC = order)', !is106 || load.recOk, is106 ? (load.recOk ? 'all packages scanned' : 'packages missing') : 'checked at loading'],
      ['Logger calibrated', calibOk, 'calibration: ' + veh.calib],
      ['ADR met', !(is106 && load.adr) || (veh.adr && !!drv.adr), is106 && load.adr ? 'vehicle and driver approved' : 'no dangerous goods'],
      ['Route cleared for weather', w.lvl < 3, w.lvl ? w.cond + ' · ' + w.city + ', ' + w.day : 'no restrictions']
    ].map(([label, pass, text]) => ({ label, text, l: pass ? ok : bad, mark: pass ? 'YES' : 'NO' }));
    const goOk = gate.every(g => g.mark === 'YES'), released = !!s.released[dt.id] || dt.status !== 'plan';
    const docTripChips = docTrips.map(r => ({ id: r.id, sub: r.route.join(' → '), select: () => this.setState({ selTrip: r.id }), bc: r.id === dt.id ? 'var(--color-accent-700)' : 'var(--color-divider)', bg: r.id === dt.id ? 'var(--color-accent-100)' : 'transparent' }));

    const QSTEPS = ['Alarm recorded','Dispatcher checked','Security checked','Quality manager decision','Goods released / blocked','Customer notified','CAPA recorded'];
    const devs = [];
    devs.push({ id:'DEV-0011', lvl:3, title:'Partner PL-10 “Syrdarya Trans”: +14 °C, lot lost', text:'Kyzylorda · partner blocked until CAPA closed', capa:'Partner audit, re-validation of reefer transport, GDP training; unblock only after CAPA is closed.' });
    devs.push({ id:'CAPA-0019', lvl:2, title:'Partner PW-08 “Ertis Auto”: repeated poor repair', text:'Pavlodar · service blocked', capa:'Complaint, workshop audit, supervised test repair; unblock after CAPA is closed.' });
    if (s.sim.freeze) devs.push({ id:'DEV-SIM-F', lvl:3, title:'Freezing 2–8 °C · V04 · R-102', text:'Chamber ' + fmt(L.V04.cold) + ' °C, outside −3 °C, heating failure', capa:'Pre-trip heating check when outside temperature < +5 °C; spare thermo boxes on board.' });
    if (s.sim.overheat) devs.push({ id:'DEV-SIM-O', lvl:3, title:'Overheating 2–8 °C · V01 · R-103', text:'Chamber ' + fmt(L.V01.cold) + ' °C, heating will not switch off', capa:'Unit service, setpoint logic check; alarm when chamber–setpoint difference > 3 °C.' });
    if ((s.thc || {})['TH-02']) devs.push({ id:'DEV-0041', lvl:2, title: X('Термохрон 15–25 °C ниже +15 °C · V03 · R-105','Thermochron 15–25 °C unter +15 °C · V03 · R-105','Thermochron 15–25 °C below +15 °C · V03 · R-105'), text: X('TH-02: 38 мин при 13,6–15 °C, Cellpack DCL, Талдыкорган','TH-02: 38 Min. bei 13,6–15 °C, Cellpack DCL, Taldykorgan','TH-02: 38 min at 13.6–15 °C, Cellpack DCL, Taldykorgan'), capa: X('Утеплённый термоконтейнер для 15–25 °C зимой; приёмка без открытия двери > 3 мин.','Isolierter Thermocontainer für 15–25 °C im Winter; Annahme ohne Türöffnung > 3 Min.','Insulated container for 15–25 °C in winter; receipt without door open > 3 min.') });
    devs.push({ id:'DEV-0033', lvl:2, title:'Logger calibration expired · V01 · R-103', text:'Logger L-2208 — calibrated until 09.2026; trip under way', capa:'Release block on expired calibration (Go/No-Go), logger swap in Almaty.' });
    devs.push({ id:'DEV-0029', lvl:1, title:'Brief excursion +9.1 °C · R-098 · Shymkent', text:'14 min during unloading, logger L-2141', capa:'Pre-cool the chamber before loading, unload 2–8 °C goods first.', done:true });
    const selDev = devs.find(d => d.id === s.qaSel) || devs[0];
    const q = s.qa[selDev.id] || (selDev.done ? { step: 7, decision: 'release' } : { step: 1, decision: null });
    const setQ = v => this.setState(x => ({ qa: { ...x.qa, [selDev.id]: { ...q, ...v } } }));
    const qaSteps = QSTEPS.map((t, i) => ({ n: i + 1, t: i === 4 && q.decision ? (q.decision === 'release' ? 'Goods released' : 'Goods blocked (quarantine)') : t,
      fill: i < q.step ? 'var(--color-accent)' : 'transparent', fg: i < q.step ? 'var(--color-bg)' : i === q.step ? 'var(--color-accent-800)' : 'var(--color-neutral-600)', bc: i <= q.step ? 'var(--color-accent)' : 'var(--color-divider)', tfg: i <= q.step ? 'var(--color-text)' : 'var(--color-neutral-600)' }));
    const atDecision = q.step === 3;
    const LOG = VEH.filter(v => v.thermo).map((v, i) => ({ id: 'L-22' + String(i + 1).padStart(2, '0'), veh: v.id, calib: v.calib, l: /expired/.test(v.calib) ? bad : /11\.2026/.test(v.calib) ? LV[1] : ok,
      st: /expired/.test(v.calib) ? 'EXPIRED' : /11\.2026/.test(v.calib) ? 'expiring' : 'valid' }));

    const STL = { line: 'on the road', hub: 'at hub', reserve: 'reserve', workshop: 'workshop' };
    const FL = s.fleetX ? VEH.concat(VEH_X) : VEH;
    const fleet = FL.map(v => { const west = v.thermo && /HOWO/.test(v.model) && !CAL_RX.test(v.calib) && v.st !== 'workshop';
      const fe = FEES[v.id] || {}; return { ...v, fe, feeL: LV[fe.lvl || 0], feeSt: fe.lvl >= 3 ? X('блокирует выпуск','blockiert Freigabe','blocks release') : fe.lvl === 2 ? X('требует действий','Handlung nötig','action needed') : fe.lvl === 1 ? X('скоро срок','Frist naht','due soon') : X('в порядке','in Ordnung','OK'), hasNote: !!fe.note, stLabel: STL[s.vehSt[v.id] || v.st], chambers: !v.thermo ? X('без термоконтроля','ohne Temperaturführung','no temperature control') : v.regimes ? v.regimes : v.active ? X('активный холод · 2–8 / 15–25 / −20 °C','aktive Kühlung · 2–8 / 15–25 / −20 °C','active cooling · 2–8 / 15–25 / −20 °C') : X('изотерм · термоконтейнеры 2–8 °C','Isotherm · Thermocontainer 2–8 °C','isothermal · thermo containers 2–8 °C'), adrL: v.adr ? X('да','ja','yes') : '—', west: west ? X('допуск','Freigabe','approved') : X('нет','nein','no'), westL: west ? ok : LV[1],
        winter: !v.thermo ? X('зимние шины','Winterreifen','winter tyres') : v.demo ? X('зимние шины, автономный отопитель','Winterreifen, Standheizung','winter tyres, parking heater') : X('зимние шины, цепи, утеплённые термоконтейнеры','Winterreifen, Ketten, isolierte Thermocontainer','winter tyres, chains, insulated thermo containers'), stLabel: STL[s.vehSt[v.id] || v.st] + (v.demo ? X(' · демо',' · Demo',' · demo') : ''), calibL: CAL_RX.test(v.calib) ? bad : ok }; });
    const fleetSum = [[X('Всего ТС','Fahrzeuge gesamt','Vehicles total'), FL.length], [X('HOWO T5G · активный холод','HOWO T5G · aktive Kühlung','HOWO T5G · active cooling'), FL.filter(v => v.active && /HOWO/.test(v.model)).length], [X('HOWO T5G · изотерм','HOWO T5G · Isotherm','HOWO T5G · isothermal'), FL.filter(v => /HOWO/.test(v.model) && !v.active).length], [X('JAC N120 · изотерм','JAC N120 · Isotherm','JAC N120 · isothermal'), FL.filter(v => /JAC/.test(v.model)).length], [X('Без активного холода','Ohne aktive Kühlung','Without active cooling'), FL.filter(v => v.thermo && !v.active).length], [X('На линии','Auf Tour','On the road'), FL.filter(v => v.st === 'line').length]].concat(s.fleetX ? [[X('Рефрижераторы 7,5–12,5 т','Kühlfahrzeuge 7,5–12,5 t','Reefers 7.5–12.5 t'), FL.filter(v => v.demo && v.thermo).length], [X('Без термоконтроля','Ohne Temperaturführung','No temperature control'), FL.filter(v => !v.thermo).length]] : []).map(([label, value]) => ({ label, value: String(value) }));

    const DS = ['Arrival', 'Temperature', 'Photo', 'Signature', 'Done'];
    const ds = s.drvStep;
    return {
      docTripChips, docTrip: { id: dt.id, route: dt.route.join(' → '), veh: veh.id + ' · ' + veh.plate + ' · ' + veh.cls, drv: drv.name }, docs, gate, missing,
      releaseLabel: released ? 'Trip released' : goOk ? 'Release trip' : 'Release blocked', releaseOp: released || !goOk ? 0.5 : 1,
      release: () => { if (released || !goOk) return; this.setState(x => ({ released: { ...x.released, [dt.id]: true } })); this.log('Go/No-Go · ' + dt.id + ' released'); this.showToast(dt.id + ' released: all checks passed'); },
      genAll: () => { const add = {}; D.forEach(([k]) => { if (k !== 'epod') add[dt.id + ':' + k] = true; }); this.setState(x => ({ docs: { ...x.docs, ...add } })); this.log('Documents · ' + dt.id + ' · set generated'); this.showToast('Document set ' + dt.id + ' generated (demo)'); },
      devs: devs.map(d => ({ ...d, l: LV[d.done ? 0 : d.lvl], select: () => this.setState({ qaSel: d.id }), bc: d.id === selDev.id ? 'var(--color-accent-700)' : 'var(--color-divider)', bg: d.id === selDev.id ? 'var(--color-accent-100)' : 'transparent' })),
      dev: selDev, qaSteps, atDecision, canNext: q.step < 7 && !atDecision, qaDone: q.step >= 7,
      qaNext: () => { setQ({ step: q.step + 1 }); this.log('Quality · ' + selDev.id + ' · ' + QSTEPS[q.step]); },
      qaRelease: () => { setQ({ step: 5, decision: 'release' }); this.log('Quality · ' + selDev.id + ' · goods released'); },
      qaBlock: () => { setQ({ step: 5, decision: 'block' }); this.log('Quality · ' + selDev.id + ' · goods blocked'); },
      loggers: LOG, orderCalib: () => this.showToast('Calibration request L-2208 sent to the lab (demo)'),
      fleet, fleetSum, fleetXOn: !!s.fleetX, fleetXLabel: s.fleetX ? X('Только реальный парк · 4 ТС','Nur reale Flotte · 4 Fahrzeuge','Real fleet only · 4 vehicles') : X('Показать расширенный парк · +' + VEH_X.length + ' ТС','Erweiterte Flotte zeigen · +' + VEH_X.length + ' Fahrzeuge','Show extended fleet · +' + VEH_X.length + ' vehicles'), toggleFleetX: () => this.setState(x => ({ fleetX: !x.fleetX })),
      drvSteps: DS.map((t, i) => ({ t, bg: i <= ds ? 'var(--color-accent)' : 'var(--color-neutral-200)' })),
      dIs: Object.fromEntries(DS.map((_, i) => ['s' + i, ds === i])),
      drvCold: fmt(L.V01.cold) + ' °C', drvAmb: fmt(L.V01.amb) + ' °C', drvColdOk: L.V01.cold >= 2 && L.V01.cold <= 8 ? 'normal' : 'EXCURSION',
      drvNext: () => { const n = Math.min(4, (this.state.drvStep || 0) + 1); this.setState({ drvStep: n }); if (n === 4) { this.dEv('disp', X('ePOD Караганда: 2 места, подпись Г. Абдрахмановой, фото','ePOD Karaganda: 2 Stücke, Unterschrift G. Abdrachmanowa, Foto','ePOD Karaganda: 2 items, signed by G. Abdrakhmanova, photo')); this.dEv('docs', X('Акт приёма-передачи R-103 / Караганда сформирован','Übergabeprotokoll R-103 / Karaganda erstellt','Receipt note R-103 / Karaganda created')); } }, drvReset: () => this.setState({ drvStep: 0 })
    };
  }
