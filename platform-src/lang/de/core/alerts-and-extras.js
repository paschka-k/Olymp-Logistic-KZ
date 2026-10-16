  alertsAll(load) {
    const s = this.state, L = s.live, out = [];
    VEH.forEach(v => {
      const r = L[v.id];
      if (!v.thermo) return;
      if (v.id === 'V03' && s.sim.fire) { out.push({ lvl: 3, src: 'Sicherheit · V03', text: 'V03: BRAND / Rauch — Rauchmelder, Warentemperatur ' + fmt(r.amb) + ' °C', scr: 'security' }); return; }
      if (r.cold < 2) out.push({ lvl: 3, src: 'Thermostatus · ' + v.id, text: v.id + ': Einfrierrisiko in der 2–8 °C-Kammer — ' + fmt(r.cold) + ' °C', scr: 'thermo', veh: v.id });
      if (r.cold > 8) out.push({ lvl: 3, src: 'Thermostatus · ' + v.id, text: v.id + ': Überhitzung der 2–8 °C-Kammer — ' + fmt(r.cold) + ' °C', scr: 'thermo', veh: v.id });
      if (r.amb < 15) out.push({ lvl: 2, src: 'Thermostatus · ' + v.id, text: v.id + ': Kammer 15–25 °C kühlt aus — ' + fmt(r.amb) + ' °C', scr: 'thermo', veh: v.id });
      if (v.id === 'V04' && s.door) out.push({ lvl: s.doorSec > 180 ? 2 : 1, src: 'Thermostatus · V04', text: 'V04: Tür der 2–8 °C-Kammer offen ' + Math.round(s.doorSec / 60) + ' Min', scr: 'thermo', veh: 'V04' });
      if (r.out < 0 && v.id === 'V04') out.push({ lvl: 1, src: 'Thermostatus · V04', text: 'V04: außen ' + fmt(r.out) + ' °C — Wintermodus, Heizung aktiv', scr: 'thermo', veh: 'V04' });
    });
    if (s.sim.breakdown) out.push({ lvl: 3, src: 'Partner · V01', text: 'V01: technische Panne (Getriebe) auf der Strecke Astana–Karaganda, km 112 — Service TOO „Saryarka Auto“, Karaganda anfordern', scr: 'partners' });
    if (s.sim.theft) out.push({ lvl: 3, src: 'Sicherheit · V01', text: 'V01: Laderaumtür außerhalb eines Lieferpunkts geöffnet, Plombe verletzt, Halt 22 Min — Diebstahlverdacht', scr: 'security' });
    TRIPS.filter(r => r.status !== 'done').forEach(r => { const w = this.wxRisk(r); if (w.lvl >= 2) out.push({ lvl: w.lvl, src: 'Wetter · ' + r.id, text: r.id + ': ' + w.cond.toLowerCase() + ' — ' + w.city + ', ' + w.day + ', Wind ' + w.wind + ' m/s', scr: 'weather', city: w.city }); });
    if (load.maxLvl >= 2) load.alerts.filter(a => a.lvl >= 2).forEach(a => out.push({ lvl: a.lvl, src: 'Beladung · R-106', text: a.text, scr: 'load' }));
    [...s.extraInc, ...INC].forEach(i => { const st = s.inc[i.id]; if (st === 'new' || st === 'esc') out.push({ lvl: i.lvl, src: 'Sicherheit · ' + i.id, text: i.type + ': ' + i.text, scr: 'security' }); });
    return out.sort((a, b) => b.lvl - a.lvl);
  }

  extra(load, trips) {
    const s = this.state, L = s.live, ok = LV[0], bad = LV[3];
    const docTrips = TRIPS.filter(r => r.status !== 'done');
    const dt = docTrips.find(r => r.id === s.selTrip) || docTrips[docTrips.length - 1];
    const veh = VM[dt.veh], drv = DRV[dt.drv], is106 = dt.id === 'R-106';
    const D = [['order','Anordnung / Verfügung zur Tour','interne Anordnung der Logistikgesellschaft'],['waybill','Fahrauftrag','ärztliche Vorabkontrolle des Fahrers und Fahrzeugcheck'],['ttn','TTN — Waren-Transport-Frachtbrief','Versender, Empfänger, Packstücke, Masse'],['transfer','Beleg für interne Umlagerung','eigene Ware KDL Olymp · Hub → Filiale'],['temp','Temperaturblatt und Logger-Zuordnung','Logger-ID zu jeder 2–8 °C-Sendung'],['reg','Registrierungszertifikate MP / IVD (Kopien)','auf Anfrage an Kontrollposten']];
    if (is106 && load.third.length) D.push(['contract','Beförderungsvertrag / Auftrag des Fremdkunden','Fremdfracht · ' + load.third.map(o => o.id).join(', ')],['esf','ESF für Transportleistung (IS ESF)','nur für Fremdfracht'],['snt','SNT im IS ESF — falls zutreffend','Anwendbarkeit mit KZ-Anwalt prüfen']);
    if (is106 && load.adr) D.push(['adrdoc','ADR-Beförderungspapier','UN-Nummer, Klasse, Verpackungsgruppe, LQ'],['adrinst','Schriftliche ADR-Weisungen','in der Sprache der Besatzung: Russisch / Kasachisch'],['adrcert','ADR-Bescheinigungen Fahrer und Fahrzeug','O. Petrenko bis 05.2027 · V02 zugelassen']);
    (s.hos || []).filter(r => r.trip === dt.id && r.st === 'done').forEach(r => D.push(['ho_' + r.id, 'Übergabeprotokoll an Partner · ' + r.partner, r.id + ' · ' + r.scope], ['hottn_' + r.id, 'Frachtbrief des Frachtführers · ' + r.partner, 'Übergabeort: ' + r.city]));
    D.push(['epod','Übergabeprotokoll (ePOD)','mit Temperaturquittung — bei Zustellung']);
    const preReady = ['order','temp','reg','adrcert']; D.forEach(([k]) => { if (k.startsWith('ho')) preReady.push(k); });
    const docs = D.map(([k, name, sub]) => { const key = dt.id + ':' + k, wait = k === 'epod';
      const ready = !wait && (dt.status !== 'plan' || preReady.includes(k) || !!s.docs[key]);
      const dst = s.docSt[key], esf = k === 'esf' || k === 'snt';
      const pdf = () => { const rows = LINES.filter(l => l.trip === dt.id).map(l => '<tr><td>' + l.sscc + '</td><td>' + l.po + '</td><td>' + l.pl + '</td><td>' + l.art + '</td><td>' + l.name + '</td><td>' + l.lot + '</td><td>' + l.exp + '</td><td>' + l.qty + '</td><td>' + TL[l.cls] + '</td></tr>').join('');
        const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + name + '</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{font-size:20px}table{border-collapse:collapse;width:100%;margin-top:12px}td,th{border:1px solid #444;padding:4px 6px;font-size:11px;text-align:left}p{font-size:12px}</style></head><body><h1>' + name + '</h1><p>Tour ' + dt.id + ' · ' + dt.route.join(' → ') + ' · ' + veh.id + ' ' + veh.plate + ' · Fahrer ' + drv.name + '</p><p>Absender: TOO „Olymp Logistic“ · Datum: 06.10.2026</p><table><tr><th>SSCC</th><th>PO</th><th>PL</th><th>Artikel</th><th>Ware</th><th>LOT</th><th>Verwendbar bis</th><th>Menge</th><th>Klasse</th></tr>' + rows + '</table><p>Demo-Dokument. Form und Angaben sind von einem Anwalt und Steuerberater in KZ zu prüfen.</p></body></html>';
        try { const u = URL.createObjectURL(new Blob([html], { type: 'text/html' })); window.open(u, '_blank'); } catch (e) {} this.log('Dokumente · ' + dt.id + ' · PDF: ' + name); this.showToast('Dokument „' + name + '“ zum Drucken / PDF geöffnet'); };
      return { name, sub, ready: !wait && ready, canSign: !wait && ready && !dst, canSend: esf && dst === 'signed', pdf,
        sign: () => { this.setState(x => ({ docSt: { ...x.docSt, [key]: 'signed' } })); this.log('EDS · ' + dt.id + ' · ' + name + ' signiert (NCALayer, Demo)'); },
        send: () => { this.setState(x => ({ docSt: { ...x.docSt, [key]: 'sent' } })); this.log('IS ESF · ' + dt.id + ' · ' + name + ' gesendet'); this.showToast(name + ': an IS ESF gesendet (Demo)'); },
        l: wait ? LV[1] : ready ? ok : LV[2], st: wait ? 'bei Zustellung' : dst === 'sent' ? 'an IS ESF gesendet' : dst === 'signed' ? 'mit EDS signiert' : ready ? 'bereit' : 'nicht erstellt', can: !wait && !ready,
        gen: () => { this.setState(x => ({ docs: { ...x.docs, [key]: true } })); this.log('Dokumente · ' + dt.id + ' · erstellt: ' + name); } }; });
    const missing = docs.filter(d => d.can).length;
    const w = this.wxRisk(dt), calibOk = !/abgelaufen/.test(veh.calib);
    const gate = [
      ['Fahrzeug verfügbar', (s.vehSt[veh.id] || veh.st) !== 'workshop', veh.id + ' · ' + veh.where],
      ['Für die Temperaturklasse geeignet', veh.thermo, veh.thermo ? 'zwei Kammern 2–8 / 15–25 °C' : 'keine Temperaturführung'],
      ['Fahrer zugelassen', true, drv.name + ' · Lenkzeiten in Ordnung'],
      ['Dokumente vollständig', missing === 0, missing ? 'es fehlen: ' + missing : 'Satz vollständig'],
      ['Versicherung, Steuer und technische Prüfung in Ordnung', ((FEES[veh.id] || {}).lvl || 0) < 3, (FEES[veh.id] || {}).note || 'OGPO, KASKO, Steuer, technische Prüfung gültig'],
      ['Packstücke abgeglichen (SSCC = Auftrag)', !is106 || load.recOk, is106 ? (load.recOk ? 'alle Packstücke gescannt' : 'Packstücke fehlen') : 'Abgleich beim Verladen'],
      ['Logger kalibriert', calibOk, 'Kalibrierung: ' + veh.calib],
      ['ADR erfüllt', !(is106 && load.adr) || (veh.adr && !!drv.adr), is106 && load.adr ? 'Fahrzeug und Fahrer zugelassen' : 'kein Gefahrgut'],
      ['Route wetterseitig freigegeben', w.lvl < 3, w.lvl ? w.cond + ' · ' + w.city + ', ' + w.day : 'ohne Einschränkungen']
    ].map(([label, pass, text]) => ({ label, text, l: pass ? ok : bad, mark: pass ? 'JA' : 'NEIN' }));
    const goOk = gate.every(g => g.mark === 'JA'), released = !!s.released[dt.id] || dt.status !== 'plan';
    const docTripChips = docTrips.map(r => ({ id: r.id, sub: r.route.join(' → '), select: () => this.setState({ selTrip: r.id }), bc: r.id === dt.id ? 'var(--color-accent-700)' : 'var(--color-divider)', bg: r.id === dt.id ? 'var(--color-accent-100)' : 'transparent' }));

    const QSTEPS = ['Alarm erfasst','Disponent hat geprüft','Sicherheit hat geprüft','Entscheidung des Qualitätsverantwortlichen','Ware freigegeben / gesperrt','Kunde informiert','CAPA erfasst'];
    const devs = [];
    devs.push({ id:'DEV-0011', lvl:3, title:'Partner PL-10 „Syrdarya Trans“: +14 °C, Verlust einer Charge', text:'Kyzylorda · Partner gesperrt bis CAPA abgeschlossen', capa:'Partneraudit, erneute Validierung des Kühltransports, GDP-Schulung; Entsperrung nur nach Abschluss der CAPA.' });
    devs.push({ id:'CAPA-0019', lvl:2, title:'Partner PW-08 „Ertis Auto“: wiederholt mangelhafte Reparatur', text:'Pavlodar · Service gesperrt', capa:'Reklamation, Werkstattaudit, Kontrollreparatur unter Aufsicht; Entsperrung nach Abschluss der CAPA.' });
    if (s.sim.freeze) devs.push({ id:'DEV-SIM-F', lvl:3, title:'Einfrieren 2–8 °C · V04 · R-102', text:'Kammer ' + fmt(L.V04.cold) + ' °C, außen −3 °C, Heizungsausfall', capa:'Vorabprüfung des Heizmodus bei Außentemperatur < +5 °C; Reserve-Thermoboxen an Bord.' });
    if (s.sim.overheat) devs.push({ id:'DEV-SIM-O', lvl:3, title:'Überhitzung 2–8 °C · V01 · R-103', text:'Kammer ' + fmt(L.V01.cold) + ' °C, Heizung schaltet nicht ab', capa:'Aggregatservice, Prüfung der Sollwertlogik; Alarm bei Differenz Kammer–Sollwert > 3 °C.' });
    if ((s.thc || {})['TH-02']) devs.push({ id:'DEV-0041', lvl:2, title: X('Термохрон 15–25 °C ниже +15 °C · V03 · R-105','Thermochron 15–25 °C unter +15 °C · V03 · R-105','Thermochron 15–25 °C below +15 °C · V03 · R-105'), text: X('TH-02: 38 мин при 13,6–15 °C, Cellpack DCL, Талдыкорган','TH-02: 38 Min. bei 13,6–15 °C, Cellpack DCL, Taldykorgan','TH-02: 38 min at 13.6–15 °C, Cellpack DCL, Taldykorgan'), capa: X('Утеплённый термоконтейнер для 15–25 °C зимой; приёмка без открытия двери > 3 мин.','Isolierter Thermocontainer für 15–25 °C im Winter; Annahme ohne Türöffnung > 3 Min.','Insulated container for 15–25 °C in winter; receipt without door open > 3 min.') });
    devs.push({ id:'DEV-0033', lvl:2, title:'Loggerkalibrierung abgelaufen · V01 · R-103', text:'Logger L-2208 — Kalibrierung bis 09.2026; Tour unterwegs', capa:'Freigabesperre bei abgelaufener Kalibrierung (Go/No-Go), Loggertausch in Almaty.' });
    devs.push({ id:'DEV-0029', lvl:1, title:'Kurze Überschreitung +9,1 °C · R-098 · Shymkent', text:'14 Min beim Entladen, Logger L-2141', capa:'Kammer vor dem Laden vorkühlen, 2–8 °C-Ware zuerst entladen.', done:true });
    const selDev = devs.find(d => d.id === s.qaSel) || devs[0];
    const q = s.qa[selDev.id] || (selDev.done ? { step: 7, decision: 'release' } : { step: 1, decision: null });
    const setQ = v => this.setState(x => ({ qa: { ...x.qa, [selDev.id]: { ...q, ...v } } }));
    const qaSteps = QSTEPS.map((t, i) => ({ n: i + 1, t: i === 4 && q.decision ? (q.decision === 'release' ? 'Ware freigegeben' : 'Ware gesperrt (Quarantäne)') : t,
      fill: i < q.step ? 'var(--color-accent)' : 'transparent', fg: i < q.step ? 'var(--color-bg)' : i === q.step ? 'var(--color-accent-800)' : 'var(--color-neutral-600)', bc: i <= q.step ? 'var(--color-accent)' : 'var(--color-divider)', tfg: i <= q.step ? 'var(--color-text)' : 'var(--color-neutral-600)' }));
    const atDecision = q.step === 3;
    const LOG = VEH.filter(v => v.thermo).map((v, i) => ({ id: 'L-22' + String(i + 1).padStart(2, '0'), veh: v.id, calib: v.calib, l: /abgelaufen/.test(v.calib) ? bad : /11\.2026/.test(v.calib) ? LV[1] : ok,
      st: /abgelaufen/.test(v.calib) ? 'ABGELAUFEN' : /11\.2026/.test(v.calib) ? 'läuft ab' : 'gültig' }));

    const STL = { line: 'im Einsatz', hub: 'am Hub', reserve: 'Reserve', workshop: 'Werkstatt' };
    const FL = s.fleetX ? VEH.concat(VEH_X) : VEH;
    const fleet = FL.map(v => { const west = v.thermo && /HOWO/.test(v.model) && !CAL_RX.test(v.calib) && v.st !== 'workshop';
      const fe = FEES[v.id] || {}; return { ...v, fe, feeL: LV[fe.lvl || 0], feeSt: fe.lvl >= 3 ? X('блокирует выпуск','blockiert Freigabe','blocks release') : fe.lvl === 2 ? X('требует действий','Handlung nötig','action needed') : fe.lvl === 1 ? X('скоро срок','Frist naht','due soon') : X('в порядке','in Ordnung','OK'), hasNote: !!fe.note, stLabel: STL[s.vehSt[v.id] || v.st], chambers: !v.thermo ? X('без термоконтроля','ohne Temperaturführung','no temperature control') : v.regimes ? v.regimes : v.active ? X('активный холод · 2–8 / 15–25 / −20 °C','aktive Kühlung · 2–8 / 15–25 / −20 °C','active cooling · 2–8 / 15–25 / −20 °C') : X('изотерм · термоконтейнеры 2–8 °C','Isotherm · Thermocontainer 2–8 °C','isothermal · thermo containers 2–8 °C'), adrL: v.adr ? X('да','ja','yes') : '—', west: west ? X('допуск','Freigabe','approved') : X('нет','nein','no'), westL: west ? ok : LV[1],
        winter: !v.thermo ? X('зимние шины','Winterreifen','winter tyres') : v.demo ? X('зимние шины, автономный отопитель','Winterreifen, Standheizung','winter tyres, parking heater') : X('зимние шины, цепи, утеплённые термоконтейнеры','Winterreifen, Ketten, isolierte Thermocontainer','winter tyres, chains, insulated thermo containers'), stLabel: STL[s.vehSt[v.id] || v.st] + (v.demo ? X(' · демо',' · Demo',' · demo') : ''), calibL: CAL_RX.test(v.calib) ? bad : ok }; });
    const fleetSum = [[X('Всего ТС','Fahrzeuge gesamt','Vehicles total'), FL.length], [X('HOWO T5G · активный холод','HOWO T5G · aktive Kühlung','HOWO T5G · active cooling'), FL.filter(v => v.active && /HOWO/.test(v.model)).length], [X('HOWO T5G · изотерм','HOWO T5G · Isotherm','HOWO T5G · isothermal'), FL.filter(v => /HOWO/.test(v.model) && !v.active).length], [X('JAC N120 · изотерм','JAC N120 · Isotherm','JAC N120 · isothermal'), FL.filter(v => /JAC/.test(v.model)).length], [X('Без активного холода','Ohne aktive Kühlung','Without active cooling'), FL.filter(v => v.thermo && !v.active).length], [X('На линии','Auf Tour','On the road'), FL.filter(v => v.st === 'line').length]].concat(s.fleetX ? [[X('Рефрижераторы 7,5–12,5 т','Kühlfahrzeuge 7,5–12,5 t','Reefers 7.5–12.5 t'), FL.filter(v => v.demo && v.thermo).length], [X('Без термоконтроля','Ohne Temperaturführung','No temperature control'), FL.filter(v => !v.thermo).length]] : []).map(([label, value]) => ({ label, value: String(value) }));

    const DS = ['Ankunft', 'Temperatur', 'Foto', 'Unterschrift', 'Fertig'];
    const ds = s.drvStep;
    return {
      docTripChips, docTrip: { id: dt.id, route: dt.route.join(' → '), veh: veh.id + ' · ' + veh.plate + ' · ' + veh.cls, drv: drv.name }, docs, gate, missing,
      releaseLabel: released ? 'Tour freigegeben' : goOk ? 'Tour freigeben' : 'Freigabe gesperrt', releaseOp: released || !goOk ? 0.5 : 1,
      release: () => { if (released || !goOk) return; this.setState(x => ({ released: { ...x.released, [dt.id]: true } })); this.log('Go/No-Go · ' + dt.id + ' freigegeben'); this.showToast(dt.id + ' freigegeben: alle Prüfungen bestanden'); },
      genAll: () => { const add = {}; D.forEach(([k]) => { if (k !== 'epod') add[dt.id + ':' + k] = true; }); this.setState(x => ({ docs: { ...x.docs, ...add } })); this.log('Dokumente · ' + dt.id + ' · Satz erstellt'); this.showToast('Dokumentensatz ' + dt.id + ' erstellt (Demo)'); },
      devs: devs.map(d => ({ ...d, l: LV[d.done ? 0 : d.lvl], select: () => this.setState({ qaSel: d.id }), bc: d.id === selDev.id ? 'var(--color-accent-700)' : 'var(--color-divider)', bg: d.id === selDev.id ? 'var(--color-accent-100)' : 'transparent' })),
      dev: selDev, qaSteps, atDecision, canNext: q.step < 7 && !atDecision, qaDone: q.step >= 7,
      qaNext: () => { setQ({ step: q.step + 1 }); this.log('Qualität · ' + selDev.id + ' · ' + QSTEPS[q.step]); },
      qaRelease: () => { setQ({ step: 5, decision: 'release' }); this.log('Qualität · ' + selDev.id + ' · Ware freigegeben'); },
      qaBlock: () => { setQ({ step: 5, decision: 'block' }); this.log('Qualität · ' + selDev.id + ' · Ware gesperrt'); },
      loggers: LOG, orderCalib: () => this.showToast('Kalibrierauftrag L-2208 an das Labor gesendet (Demo)'),
      fleet, fleetSum, fleetXOn: !!s.fleetX, fleetXLabel: s.fleetX ? X('Только реальный парк · 4 ТС','Nur reale Flotte · 4 Fahrzeuge','Real fleet only · 4 vehicles') : X('Показать расширенный парк · +' + VEH_X.length + ' ТС','Erweiterte Flotte zeigen · +' + VEH_X.length + ' Fahrzeuge','Show extended fleet · +' + VEH_X.length + ' vehicles'), toggleFleetX: () => this.setState(x => ({ fleetX: !x.fleetX })),
      drvSteps: DS.map((t, i) => ({ t, bg: i <= ds ? 'var(--color-accent)' : 'var(--color-neutral-200)' })),
      dIs: Object.fromEntries(DS.map((_, i) => ['s' + i, ds === i])),
      drvCold: fmt(L.V01.cold) + ' °C', drvAmb: fmt(L.V01.amb) + ' °C', drvColdOk: L.V01.cold >= 2 && L.V01.cold <= 8 ? 'normal' : 'ABWEICHUNG',
      drvNext: () => { const n = Math.min(4, (this.state.drvStep || 0) + 1); this.setState({ drvStep: n }); if (n === 4) { this.dEv('disp', X('ePOD Караганда: 2 места, подпись Г. Абдрахмановой, фото','ePOD Karaganda: 2 Stücke, Unterschrift G. Abdrachmanowa, Foto','ePOD Karaganda: 2 items, signed by G. Abdrakhmanova, photo')); this.dEv('docs', X('Акт приёма-передачи R-103 / Караганда сформирован','Übergabeprotokoll R-103 / Karaganda erstellt','Receipt note R-103 / Karaganda created')); } }, drvReset: () => this.setState({ drvStep: 0 })
    };
  }
