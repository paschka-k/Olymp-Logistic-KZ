/* P4 · Fleet / Staff parity with platform 0.3.10 (screens 10 and 12): model class and cooling of every truck, demo fleets
   (extended +5, 3.5 t +2) that never join S.trucks, insurance / taxes / fees status (OGPO, KASKO, inspection, tax, tolls, fines),
   West-ring approval, 60-day compliance list of the registry and the 90-day document deadlines of the drivers. Pure functions on RES. */
(function () {
  const R = RES;
  S.res.fleet = { ext: false, demo35: false, taxPaid: { v6: false }, kasko: {}, booked: {}, tasks: [] };
  /* ---- class and cooling derived from the model (new trucks of Fleet → Add vehicle get it too) ---- */
  const CLS = { t1: '20 т', t2: '12 т', t3: '20 т', t4: '10 т', t5: '20 т', t6: '12 т', t7: '20 т' };
  R.COOL = { active: T('активный холод', 'aktive Kühlung', 'active cooling', 'белсенді суыту'), iso: T('изотерм · термоконтейнеры', 'Isotherm · Thermocontainer', 'isothermal · thermo containers', 'изотерм · термоконтейнерлер'), none: T('без термоконтроля', 'ohne Temperaturführung', 'no temperature control', 'термобақылаусыз') };
  R.truckClass = t => { if (!t.cls) t.cls = CLS[t.id] || ((t.model.match(/(\d+(?:,\d)?) t/) || [])[1] || (t.cap > 20 ? '20' : '12')) + ' ' + T('т', 't', 't', 'т'); return String(t.cls).replace(' т', ' ' + T('т', 't', 't', 'т')); };
  R.truckCooling = t => t.cool || (t.cool = t.unit && t.unit !== '—' ? 'active' : t.zones.some(z => z !== 'ambient') ? 'iso' : 'none');
  S.trucks.forEach(t => { R.truckClass(t); R.truckCooling(t); });
  /* ---- demo fleets (FR-38: the real plan stays at the registered trucks; demo rows are not used in trips, thermo status or costs) ---- */
  const D = (id, plate, make, model, cls, cool, cap, zones, hub, unit, calib, note) => ({ id, plate, make, model, cls, cool, cap, zones, hub, unit, demo: true, status: 'available', km: 0, year: 2024, ping: 0, health: 'green', unitH: 0, docs: { osago: '2027-04-08', cargo: '2027-04-08', calib, to: '2027-04-01' }, svc: { last: '2026-09-01', lastKm: 0, nextKm: 15000 }, note });
  R.DEMO_X = [D('v5', '629 LGK 02', 'Isuzu FSR90', 'Reefer 12,5 t', '12,5 т', 'active', 15, ['chilled', 'frozen', 'pharma'], 'AST', 'Thermo King T-880R', '2027-02-01'),
    D('v6', '471 LGK 02', 'Mercedes Atego 818', 'Reefer 7,5 t', '7,5 т', 'active', 9, ['chilled', 'frozen'], 'ALA', 'Thermo King V-500 MAX', '2027-06-01'),
    D('v7', '903 BRT 02', 'Isuzu NPR75', 'Reefer 7,5 t', '7,5 т', 'active', 9, ['chilled'], 'ALA', 'Carrier Xarios 600', '2026-11-01'),
    D('p1', '04 AAR 02', T('Прицеп-фургон 2-осный', 'Kofferanhänger 2-achsig', 'Box trailer, 2 axles', '2 осьті фургон тіркемесі'), 'Trailer', T('Прицеп', 'Anhänger', 'Trailer', 'Тіркеме'), 'none', 18, ['ambient'], 'AST', '—', '2099-01-01'),
    D('p2', '05 AAR 02', T('Прицеп-фургон 2-осный', 'Kofferanhänger 2-achsig', 'Box trailer, 2 axles', '2 осьті фургон тіркемесі'), 'Trailer', T('Прицеп', 'Anhänger', 'Trailer', 'Тіркеме'), 'none', 18, ['ambient'], 'ALA', '—', '2099-01-01')];
  R.DEMO_35 = [D('v8', '218 JAC 02', 'JAC N35', 'Reefer 3,5 t', '3,5 т', 'active', 4, ['chilled'], 'ALA', 'Carrier Xarios 150', '2027-03-01'),
    D('v9', '377 GAZ 02', 'GAZelle NEXT', 'Van 3,5 t', '3,5 т', 'none', 5, ['ambient'], 'AST', '—', '2099-01-01')];
  R.demoTrucks = () => (S.res.fleet.ext ? R.DEMO_X : []).concat(S.res.fleet.demo35 ? R.DEMO_35 : []);
  R.fleetAll = () => S.trucks.concat(R.demoTrucks());
  /* KPIs by model class: one tile per class of the shown fleet, plus "without active cooling" and "on the road" */
  R.fleetKpis = () => { const all = R.fleetAll(), by = {}; all.forEach(t => { const k = R.truckClass(t) + ' · ' + R.COOL[R.truckCooling(t)]; by[k] = (by[k] || 0) + 1; });
    return [[T('Всего ТС', 'Fahrzeuge gesamt', 'Vehicles total', 'КҚ барлығы'), all.length]].concat(Object.keys(by).sort().map(k => [k, by[k]]), [[T('Без активного холода', 'Ohne aktive Kühlung', 'Without active cooling', 'Белсенді суытусыз'), all.filter(t => R.truckCooling(t) !== 'active').length], [T('На линии', 'Auf Tour', 'On the road', 'Желіде'), all.filter(t => !t.demo && truckState(t) === 'busy').length]]); };
  /* ---- insurance, taxes, fees (screen 10 column): OGPO = docs.osago, KASKO = same policy unless set, inspection = docs.to,
     tax from S.res.fleet.taxPaid, tolls by class, fines = open fines of the plate (FR-122) ---- */
  const TOLL = { '20 т': 64300, '12 т': 40800, '12,5 т': 47600, '10 т': 31200, '7,5 т': 9700, '3,5 т': 0 };
  const until = iso => (iso && iso < '2099' ? T('до ', 'bis ', 'until ', '') + fd(iso) + (LANG === 'kk' ? ' дейін' : '') : '—');
  R.fees = t => {
    const osago = t.docs.osago, kasko = S.res.fleet.kasko[t.id] || t.docs.osago, taxPaid = S.res.fleet.taxPaid[t.id] !== false;
    const fines = (S.res.fines || []).filter(f => f.plate === t.plate && !['deducted', 'paid_company', 'dismissed'].includes(f.status));
    const dOs = docState(osago), dTo = docState(t.docs.to), dKa = docState(kasko), days = Math.floor((new Date(osago + 'T23:59:59+05:00') - NOW) / 864e5);
    let lvl = 0, note = '';
    if (!taxPaid) { lvl = 3; note = T('транспортный налог 2026 не оплачен — оформить до выпуска', 'Kfz-Steuer 2026 nicht bezahlt — vor der Freigabe begleichen', 'vehicle tax 2026 not paid — settle before release', '2026 көлік салығы төленбеген — шығаруға дейін төлеу'); }
    else if (dOs === 'expired') { lvl = 3; note = T('ОГПО истекла — выпуск на линию запрещён', 'OGPO abgelaufen — keine Freigabe', 'OGPO expired — release blocked', 'ОГПО мерзімі өтті — шығаруға тыйым'); }
    else if (fines.length) { lvl = 2; note = fines.map(f => fdt(f.at) + ' · ' + f.article + (f.drv ? ' · ' + drv(f.drv).name + (f.wb ? ' (' + f.wb + ')' : '') : '')).join(' · '); }
    else if (dOs === 'soon' || dKa === 'soon') { lvl = 2; note = T('ОГПО / КАСКО истекают через ', 'OGPO / KASKO laufen ab in ', 'OGPO / KASKO expire in ', 'ОГПО / КАСКО мерзімі: ') + days + T(' дн.', ' Tagen', ' days', ' күн'); }
    else if (dTo === 'soon' || dTo === 'expired') { lvl = dTo === 'expired' ? 3 : 1; note = T('техосмотр ', 'HU ', 'inspection ', 'техқарау ') + DOCST[dTo].l.toLowerCase() + ' · ' + fd(t.docs.to); }
    const toll = t.demo && t.cool === 'none' ? T('по классу автопоезда', 'nach Klasse des Lastzugs', 'by road-train class', 'автопойыз класы бойынша') : TOLL[t.cls] ? kzt(TOLL[t.cls]) + T(' / мес', ' / Monat', ' / month', ' / ай') : '—';
    return { lvl, note, ogpo: until(osago), kasko: t.demo && t.cool === 'none' ? T('нет', 'nein', 'none', 'жоқ') : until(kasko), ti: until(t.docs.to), tax: taxPaid ? T('2026 оплачен', '2026 bezahlt', '2026 paid', '2026 төленген') : T('не оплачен', 'nicht bezahlt', 'not paid', 'төленбеген'), toll,
      fines: fines.length ? fines.length + T(' неоплачен · ', ' offen · ', ' unpaid · ', ' төленбеген · ') + kzt(fines.reduce((s, f) => s + f.amount, 0)) : T('нет', 'keine', 'none', 'жоқ'),
      st: lvl >= 3 ? T('блокирует выпуск', 'blockiert Freigabe', 'blocks release', 'шығаруды бұғаттайды') : lvl === 2 ? T('требует действий', 'Handlung nötig', 'action needed', 'әрекет қажет') : lvl === 1 ? T('скоро срок', 'Frist naht', 'due soon', 'мерзім жақын') : T('в порядке', 'in Ordnung', 'OK', 'тәртіпте'), c: ['green', 'yellow', 'yellow', 'red'][lvl] };
  };
  R.taxPay = t => { S.res.fleet.taxPaid[t.id] = true; audit('Fleet', t.plate, T('Транспортный налог 2026 оплачен', 'Kfz-Steuer 2026 bezahlt', 'Vehicle tax 2026 paid', '2026 көлік салығы төленді'), ''); };
  /* West ring (Atyrau cross-dock): temperature-controlled body, valid logger calibration, not in service, nothing blocking release */
  R.west = t => { const why = []; if (R.truckCooling(t) === 'none') why.push(T('нет термоконтроля', 'keine Temperaturführung', 'no temperature control', 'термобақылау жоқ')); if (docState(t.docs.calib) === 'expired') why.push(T('поверка истекла', 'Kalibrierung abgelaufen', 'calibration expired', 'поверка өтті')); if (t.status === 'service') why.push(T('в сервисе', 'im Service', 'in service', 'сервисте')); if (R.fees(t).lvl >= 3) why.push(T('страховка / налог', 'Versicherung / Steuer', 'insurance / tax', 'сақтандыру / салық')); if (!t.zones.includes('chilled')) why.push(T('нет зоны 2–8 °C', 'keine Zone 2–8 °C', 'no 2–8 °C zone', '2–8 °C аймағы жоқ')); return { ok: !why.length, why }; };
  /* fleet rules join the assignment check: a truck whose fees level blocks release is not assigned (FR-15 style gate) */
  const tb0 = R.truckBlocks; R.truckBlocks = t => { const why = tb0(t); if (t && t.id && !t.demo && R.fees(t).lvl >= 3) why.push(T('Страховка / налог блокируют выпуск: ', 'Versicherung / Steuer blockieren die Freigabe: ', 'Insurance / tax block release: ', 'Сақтандыру / салық шығаруды бұғаттайды: ') + R.fees(t).note); return why; };
  /* ---- compliance 60 days (registry): every truck document that expires within 60 days or has expired ---- */
  R.DOCN = { calib: T('Поверка датчиков', 'Sensorkalibrierung', 'Sensor calibration', 'Датчик поверкасы'), to: T('Техосмотр', 'HU', 'Technical inspection', 'Техқарау'), osago: T('ОГПО', 'OGPO', 'OGPO', 'ОГПО'), cargo: T('Страхование груза', 'Frachtversicherung', 'Cargo insurance', 'Жүк сақтандыруы'), kasko: T('КАСКО', 'KASKO', 'KASKO', 'КАСКО') };
  R.compliance = (days) => { const out = []; S.trucks.forEach(t => { const docs = Object.assign({}, t.docs, { kasko: S.res.fleet.kasko[t.id] || t.docs.osago }); Object.keys(R.DOCN).forEach(k => { const n = R.daysTo(docs[k]); if (n <= (days || 60)) out.push({ key: t.id + ':' + k, t, kind: k, date: docs[k], n, booked: S.res.fleet.booked[t.id + ':' + k] || '' }); }); }); return out.sort((a, b) => a.n - b.n); };
  R.complyBook = key => { const [tid, kind] = key.split(':'), t = trk(tid); if (!t.id || S.res.fleet.booked[key]) return; let note;
    if (kind === 'calib') { const r = R.svcCreate({ truck: tid, kind: 'calib', partner: R.PARTNERS_SVC[1], etaH: 72, cost: 85000, text: T('Поверка по списку соответствия', 'Kalibrierung aus der Compliance-Liste', 'Calibration from the compliance list', 'Сәйкестік тізімінен поверка') }); note = typeof r === 'string' ? r : r.ok; }
    else note = T('записано на ', 'angemeldet für ', 'booked for ', 'жазылды: ') + fd(R.addDays(R.TODAY, kind === 'to' ? 5 : 3));
    S.res.fleet.booked[key] = note; audit('Fleet', t.plate, T('Соответствие: ', 'Compliance: ', 'Compliance: ', 'Сәйкестік: ') + R.DOCN[kind], note); return note; };
  /* ---- staff: document deadlines 90 days (licence, medical certificate, GDP, ADR) with renewal booking ---- */
  R.DDOC = { lic: T('Водительское удостоверение', 'Führerschein', 'Driving licence', 'Жүргізуші куәлігі'), med: T('Медсправка', 'Ärztliches Attest', 'Medical certificate', 'Медициналық анықтама'), gdp: T('Сертификат GDP', 'GDP-Zertifikat', 'GDP certificate', 'GDP сертификаты'), adr: T('Свидетельство ДОПОГ', 'ADR-Bescheinigung', 'ADR certificate', 'ДОПОГ куәлігі') };
  R.docDeadlines = (days) => { const out = []; S.drivers.forEach(d => { R.initDriver(d); const list = d.docs.map(x => [x.type, x.to]).concat(d.res.adr ? [['adr', d.res.adr]] : []); list.forEach(([kind, to]) => { if (!R.DDOC[kind] || !to) return; const n = R.daysTo(to); if (n <= (days || 90)) out.push({ key: d.id + ':' + kind, d, kind, date: to, n, booked: kind === 'adr' ? (d.res.adrBooked ? T('курс ДОПОГ ', 'ADR-Kurs ', 'ADR course ', 'ДОПОГ курсы ') + fd(d.res.adrBooked) : '') : S.res.fleet.booked[d.id + ':' + kind] || '' }); }); }); return out.sort((a, b) => a.n - b.n); };
  R.docBook = key => { const [did, kind] = key.split(':'), d = drv(did); if (!d || !d.id) return; if (kind === 'adr') { R.adrBook(d); return d.res.adrBooked; } const when = kind === 'lic' ? T('ЦОН ', 'Bürgerservice (ZON) ', 'Public service centre ', 'ХҚКО ') + fd(R.addDays(R.TODAY, 9)) : kind === 'med' ? T('медкомиссия ', 'Untersuchung ', 'medical board ', 'медкомиссия ') + fd(R.addDays(R.TODAY, 4)) : T('курс GDP ', 'GDP-Kurs ', 'GDP course ', 'GDP курсы ') + fd(R.addDays(R.TODAY, 12)); S.res.fleet.booked[key] = when; audit('Staff', d.name, T('Запись на продление: ', 'Verlängerung angemeldet: ', 'Renewal booked: ', 'Ұзартуға жазылды: ') + R.DDOC[kind], when); return when; };
  /* where every driver is now: hub, vehicle, place (road / hub / absence) */
  R.whereNow = d => { const l = loadOfDriver(d.id), t = l ? trk(l.truck) : null, a = R.absence(d, R.TODAY);
    if (l && (l.status === 'in_transit' || l.status === 'problem')) return { veh: t.plate, hub: HUBS[l.from].city, place: l.id + ' · ' + T('трасса ', 'Strecke ', 'road ', 'трасса ') + HUBS[l.from].city + ' → ' + HUBS[l.to].city + ' · ' + Math.round(l.progress * 100) + ' %' };
    if (l) return { veh: t.plate, hub: HUBS[l.from].city, place: l.id + ' · ' + HUBS[l.from].name + ' · ' + ST[l.status].l };
    if (a) return { veh: '—', hub: HUBS[d.hub].city, place: R.ABS[a.type].l + ' ' + T('до', 'bis', 'until', 'дейін') + ' ' + fd(a.to) + (a.note ? ' · ' + a.note : '') };
    const nxt = S.loads.find(x => x.status === 'unassigned' && x.from === d.hub); return { veh: '—', hub: HUBS[d.hub].city, place: HUBS[d.hub].name + (d.status === 'rest' ? ' · ' + T('отдых', 'Ruhe', 'rest', 'демалыс') : nxt ? ' · ' + T('резерв · ближайший рейс ', 'Reserve · nächste Fahrt ', 'reserve · next load ', 'резерв · келесі рейс ') + nxt.id : ' · ' + T('дежурство', 'Bereitschaft', 'standby', 'кезекшілік')) }; };
})();
