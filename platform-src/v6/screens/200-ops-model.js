/* W1 operations model (shared by the Load & weight, Shipments & labels, Documents KZ, Dispatch release / express / planning files 21x–24x).
   Ports the rules of source screens 02/03/04/08/14 (LH-B, C, D, H, N1): GS1 SSCC, orders → lines → places per load, truck catalogue,
   load calculation (pallets / volume / weight / axles / height, overload always shown), full trip cost model, split over two trucks,
   loading sequence (LIFO by stop), departure weighing, FEFO, SSCC reconciliation, KZ documents, Go/No-Go release gate, double-booking
   block, unassign / replan, express approval (3 functions, deadline), KZ working-day calendar. State lives in S / on the load (l.ops). */
(function () {
  const KG = T('кг', 'kg', 'kg', 'кг');
  /* ---------- GS1 SSCC (AI 00): extension digit + company prefix (fictitious, KZ 487) + serial + mod-10 check digit ---------- */
  const GCP = '4870012';
  const ssccCheck = s => { let sum = 0; for (let i = 0; i < 17; i++) sum += +s[i] * (i % 2 === 0 ? 3 : 1); return (10 - sum % 10) % 10; };
  const ssccMake = serial => { const b = '3' + GCP + String(serial).padStart(9, '0'); return b + ssccCheck(b); };
  const ssccValid = s => /^\d{18}$/.test(s) && ssccCheck(s.slice(0, 17)) === +s[17];
  const ssccFromScan = raw => { const s = String(raw).replace(/[^\d]/g, ''); if (s.length === 20 && s.startsWith('00')) return s.slice(2); return s.length === 18 ? s : null; };

  /* ---------- goods catalogue: fictitious manufacturers (FR-176 logo badges) and articles per temperature class ---------- */
  /* Manufacturers of the source platform (screen 04): the six with static logos (platform/assets/manufacturers/<logo>.png, 515 × 380 px,
     supplied by the product owner) plus two food producers without a logo (initials badge only). */
  const MFRS = {
    roche: { name: 'Roche Diagnostics', co: 'Roche Diagnostics GmbH, Mannheim', url: 'diagnostics.roche.com', ab: 'RO', col: 1, logo: 'roche', cc: 'CH', grp: 0 },
    abbott: { name: 'Abbott', co: 'Abbott Laboratories, Abbott Park', url: 'abbott.com', ab: 'AB', col: 2, logo: 'abbott', cc: 'US', grp: 0 },
    qiagen: { name: 'QIAGEN', co: 'QIAGEN GmbH, Hilden', url: 'qiagen.com', ab: 'QG', col: 3, logo: 'qiagen', cc: 'DE · NL', grp: 0 },
    sysmex: { name: 'Sysmex', co: 'Sysmex Europe SE, Norderstedt', url: 'sysmex-europe.com', ab: 'SX', col: 4, logo: 'sysmex', cc: 'JP', grp: 2 },
    biomerieux: { name: 'bioMérieux', co: 'bioMérieux SA, Marcy-l\'Étoile', url: 'biomerieux.com', ab: 'BM', col: 5, logo: 'biomerieux', cc: 'FR', grp: 1 },
    beckman: { name: 'Beckman Coulter', co: 'Beckman Coulter Inc., Brea', url: 'beckmancoulter.com', ab: 'BC', col: 6, logo: 'beckman-coulter', cc: 'US', grp: 0 },
    freshline: { name: 'FreshLine Foods', co: 'ТОО «FreshLine Foods», Алматы', url: 'freshline.example', ab: 'FL', col: 4, cc: 'KZ', grp: 2 },
    polar: { name: 'Polar Fisch GmbH', co: 'Polar Fisch GmbH, Bremerhaven', url: 'polar-fisch.example', ab: 'PF', col: 5, cc: 'DE', grp: 2 },
    /* registry of the source platform (0.3.9 screen 04 "Производители · 19"): the remaining manufacturers without demo orders */
    bd: { name: 'BD Biosciences', co: 'Becton Dickinson, Franklin Lakes', url: 'bdbiosciences.com', ab: 'BD', col: 1, cc: 'US', grp: 0 },
    roxall: { name: 'Roxall Medizin', co: 'Roxall Medizin GmbH, Hamburg', url: 'roxall.de', ab: 'RX', col: 2, cc: 'DE', grp: 0 },
    gongdong: { name: 'Zhejiang Gongdong Medical', co: 'Zhejiang Gongdong Medical Technology', url: 'en.gongdong.com', ab: 'GD', col: 3, cc: 'CN', grp: 0 },
    siemens: { name: 'Siemens Healthineers', co: 'Siemens Healthineers AG, Erlangen', url: 'siemens-healthineers.com', ab: 'SH', col: 4, cc: 'DE', grp: 1 },
    thermofisher: { name: 'Thermo Fisher Scientific', co: 'Thermo Fisher Scientific Inc., Waltham', url: 'thermofisher.com', ab: 'TF', col: 5, cc: 'US', grp: 1 },
    biorad: { name: 'Bio-Rad Laboratories', co: 'Bio-Rad Laboratories Inc., Hercules', url: 'bio-rad.com', ab: 'BR', col: 6, cc: 'US', grp: 1 },
    werfen: { name: 'Werfen', co: 'Werfen SA, Barcelona', url: 'werfen.com', ab: 'WF', col: 1, cc: 'ES', grp: 1 },
    diasorin: { name: 'DiaSorin', co: 'DiaSorin S.p.A., Saluggia', url: 'diasorin.com', ab: 'DS', col: 2, cc: 'IT', grp: 1 },
    sarstedt: { name: 'Sarstedt', co: 'Sarstedt AG & Co. KG, Nümbrecht', url: 'sarstedt.com', ab: 'SA', col: 3, cc: 'DE', grp: 2 },
    mercator: { name: 'Mercator Medical', co: 'Mercator Medical S.A., Kraków', url: 'mercatormedical.eu', ab: 'MM', col: 4, cc: 'PL', grp: 2 },
    immundiagnostik: { name: 'Immundiagnostik', co: 'Immundiagnostik AG, Bensheim', url: 'immundiagnostik.com', ab: 'ID', col: 5, cc: 'DE', grp: 2 },
    medsnab: { name: T('ТОО «МедСнаб Актобе» · сторонний груз', 'MedSnab Aktobe LLP · Fremdladung', 'MedSnab Aktobe LLP · third-party cargo', '«МедСнаб Ақтөбе» ЖШС · бөгде жүк'), co: 'ТОО «МедСнаб Актобе»', url: '', ab: 'MS', col: 6, cc: 'KZ', grp: 3 },
    pharmchain: { name: T('Аптечная сеть · сторонний груз', 'Apothekenkette · Fremdladung', 'Pharmacy chain · third-party cargo', 'Дәріхана желісі · бөгде жүк'), co: '', url: '', ab: 'PH', col: 1, cc: 'KZ', grp: 3 },
  };
  /* registry groups of the source platform; the six logo manufacturers of v6 belong to "added in v5" / "top western IVD" */
  const MFR_G = [T('добавлен в v5', 'in v5 ergänzt', 'added in v5', 'v5-те қосылды'), T('топ западной IVD', 'Top westliche IVD', 'top western IVD', 'батыс IVD көшбасшысы'), T('в ассортименте', 'im Sortiment', 'in range', 'ассортиментте'), T('сторонний груз', 'Fremdladung', 'third-party cargo', 'бөгде жүк')];
  const ART = {
    pharma: [['RX-1042', T('Реагенты иммунохимии, набор', 'Immunchemie-Reagenzien, Kit', 'Immunochemistry reagents, kit', 'Иммунохимия реагенттері, жинақ'), 'roche', 5], ['DX-2210', T('Реагент ПЦР, набор', 'PCR-Reagenz, Kit', 'PCR reagent kit', 'ПТР реагенті, жинақ'), 'qiagen', 3], ['RX-3307', T('Питательные среды, флаконы', 'Nährmedien, Flaschen', 'Culture media, bottles', 'Қоректік орталар, құтылар'), 'biomerieux', 4]],
    chilled: [['FD-501', T('Йогурт 2,5 %, 12×400 г', 'Joghurt 2,5 %, 12×400 g', 'Yoghurt 2.5 %, 12×400 g', 'Йогурт 2,5 %, 12×400 г'), 'freshline', 7], ['FD-517', T('Сыр полутвёрдый', 'Schnittkäse', 'Semi-hard cheese', 'Жартылай қатты ірімшік'), 'freshline', 9]],
    frozen: [['FZ-114', T('Филе лосося, −18 °C', 'Lachsfilet, −18 °C', 'Salmon fillet, −18 °C', 'Лосось филесі, −18 °C'), 'polar', 11], ['FZ-120', T('Мороженое, 24×120 мл', 'Speiseeis, 24×120 ml', 'Ice cream, 24×120 ml', 'Балмұздақ, 24×120 мл'), 'polar', 6]],
    ambient: [['AB-700', T('Расходники гематологии', 'Hämatologie-Verbrauchsmaterial', 'Haematology consumables', 'Гематология шығын материалдары'), 'sysmex', 12], ['AB-712', T('Тест-полоски глюкоза, 10×100', 'Glukose-Teststreifen, 10×100', 'Glucose test strips, 10×100', 'Глюкоза тест-жолақтары, 10×100'), 'abbott', 14], ['AB-730', T('Кюветы и контрольные материалы', 'Küvetten und Kontrollmaterial', 'Cuvettes and control material', 'Кюветалар мен бақылау материалдары'), 'beckman', 10]],
  };
  const BRANCH = n => T('Филиал №', 'Filiale Nr. ', 'Branch no. ', '№') + n;

  /* ---------- deterministic orders / lines / places per load (FR-73: lines and places are separate records) ---------- */
  const hashOf = s => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 100003; return h; };
  const addDays = (iso, d) => new Date(new Date(iso).getTime() + d * 864e5).toISOString().slice(0, 10);
  let serial = 100;
  function buildOps(l) {
    const h = hashOf(l.id), n = 2 + h % 3, orders = [];
    const wf = Array.from({ length: n }, (_, k) => 0.6 + ((h * (k + 2)) % 9) / 8);   // weight factor per order so that axle loads differ
    let left = l.pallets, kgLeft = l.kg, wsum = 0;
    for (let k = 0; k < n; k++) {
      const pal = k === n - 1 ? left : Math.max(1, Math.round(l.pallets / n) + (k === 0 ? h % 2 : 0));
      if (k === 0) { let lf = l.pallets; for (let j = 0; j < n; j++) { const pj = j === n - 1 ? lf : Math.max(1, Math.round(l.pallets / n) + (j === 0 ? h % 2 : 0)); lf -= pj; wsum += pj * wf[j]; } }
      const kg = k === n - 1 ? kgLeft : Math.round(l.kg * pal * wf[k] / wsum);
      left -= pal; kgLeft -= kg;
      const art = ART[l.zone][(h + k) % ART[l.zone].length], tall = (h + k) % 9 === 4;
      const exp = addDays(l.eta, k === 1 && h % 3 === 0 ? 40 + h % 30 : 240 + (h * (k + 1)) % 400);   // one order per ~2nd load has a short expiry (FEFO)
      const o = { id: 'O-' + l.id.slice(-4) + '-' + (k + 1), to: BRANCH(12 + (h + k * 7) % 80), city: HUBS[l.to].city, stop: k + 1, cls: l.zone, pal, kg, m3: Math.round(pal * (1.05 + (h % 5) / 20) * 10) / 10,
        h: tall ? 250 : 120 + (h * (k + 1)) % 60, stack: !tall && (h + k) % 3 !== 0, mfr: art[2], po: 'PO-' + (84000 + (h + k * 13) % 9000), pl: 'PL-' + (3100 + (h * 3 + k) % 800),
        lines: [{ art: art[0], name: art[1], mfr: art[2], lot: 'L' + (260000 + (h * 7 + k * 11) % 9999), exp, qty: pal * art[3] }], places: [] };
      /* one demo load carries two temperature zones (0.3.9 screen 03: bulkhead between zone 1 and zone 2) */
      if (l.id.endsWith('1852') && k === n - 1) { const a2 = ART.ambient[0]; o.cls = 'ambient'; o.mfr = a2[2]; o.lines = [{ art: a2[0], name: a2[1], mfr: a2[2], lot: 'L' + (260000 + (h * 7 + k * 11) % 9999), exp, qty: pal * a2[3] }]; }
      for (let p = 0; p < pal; p++) o.places.push({ sscc: ssccMake(serial++), order: o.id, load: l.id, idx: p, scans: [] });
      orders.push(o);
    }
    const ops = { orders, type: null, plan: null, weigh: [], fefoOk: false, seqPrinted: false, scanLog: [], kdocs: { ttn: 'none', waybill: 'none', snt: 'none', esf: 'none' }, released: null, revoked: null, replans: [], inbox: [] };
    /* places of loads that are already loading / on the road / delivered were scanned at loading; one order of a loading load is one place short (demo of FR-06) */
    const scanned = ['loading', 'in_transit', 'problem', 'delivered'].includes(l.status);
    if (scanned) orders.forEach((o, i) => o.places.forEach((p, j) => { if (!(l.status === 'loading' && i === 0 && j === o.places.length - 1)) p.scans.push({ t: '07:4' + j % 10, ev: 'load', where: HUBS[l.from].city, load: l.id }); }));
    if (['in_transit', 'problem', 'delivered'].includes(l.status)) orders.forEach(o => o.places.forEach(p => p.scans.push({ t: '08:30', ev: 'depart', where: HUBS[l.from].city, load: l.id })));
    if (l.status === 'delivered') orders.forEach(o => o.places.forEach(p => { p.scans.push({ t: '15:10', ev: 'unload', where: HUBS[l.to].city, load: l.id }); if (l.pod === 'approved') p.scans.push({ t: '15:25', ev: 'receive', where: o.to, load: l.id }); }));
    if (l.id === 'LD-2026-001840') orders[1].places[0].scans.push({ t: '07:52', ev: 'load', where: HUBS[l.from].city, load: 'LD-2026-001841' });   // FR-03: place scanned into the wrong trip → alarm
    if (scanned) { ops.kdocs.ttn = 'signed'; ops.kdocs.waybill = l.status === 'delivered' ? 'closed' : 'signed'; ops.kdocs.snt = l.status === 'delivered' ? 'accepted' : 'sent'; if (l.status !== 'loading') ops.released = { by: 'Sarah Johnson', t: '08:05', override: false }; }
    if (l.status === 'delivered') ops.kdocs.esf = l.esf === 'confirmed' ? 'accepted' : l.esf === 'issued' ? 'sent' : 'none';
    if (l.status === 'delivered' && l.pod === 'approved') ops.epod = 'EPOD-' + l.id.slice(-4);
    return ops;
  }
  if (!(SCREENS.orders.tabs || []).some(t => t.key === 'orders')) { const body0 = SCREENS.orders.body; addTab('orders', 'orders', T('Заказы', 'Aufträge', 'Orders', 'Тапсырыстар'), body0); }   // the base table becomes the first tab once tabs exist
  const ops = l => { if (!l.ops) l.ops = buildOps(l); return l.ops; };
  globalThis.ops = ops; globalThis.ssccMake = ssccMake; globalThis.ssccValid = ssccValid; globalThis.ssccFromScan = ssccFromScan; globalThis.MFRS = MFRS; globalThis.MFR_G = MFR_G;
  S.loads.forEach(ops);
  const places = l => ops(l).orders.flatMap(o => o.places);
  const findPlace = sscc => { for (const l of S.loads) { const p = places(l).find(x => x.sscc === sscc); if (p) return { l, p, o: ops(l).orders.find(o => o.id === p.order) }; } return null; };
  globalThis.opsPlaces = places; globalThis.findPlace = findPlace;
  const today = NOW.toISOString().slice(0, 10);
  const daysTo = iso => Math.floor((new Date(iso + 'T23:59:59+05:00') - NOW) / 864e5);

  /* ---------- truck catalogue: capacity, payload, volume, internal height, axle limits, tare, rate, fuel (demo values) ---------- */
  const TYPES = {
    r20: { id: 'r20', name: 'Reefer 20 t', kind: T('полуприцеп', 'Sattelzug', 'semitrailer', 'жартылай тіркеме'), pal: 33, kg: 20000, m3: 86, H: 265, front: 12000, rear: 24000, gross: 40000, tare: 15000, rate: 420, fuel: 32, zones: ['frozen', 'chilled', 'pharma', 'ambient'] },
    r12: { id: 'r12', name: 'Reefer 12 t', kind: T('одиночный', 'Motorwagen', 'rigid', 'жеке'), pal: 20, kg: 10000, m3: 50, H: 240, front: 7500, rear: 12000, gross: 18000, tare: 7800, rate: 300, fuel: 24, zones: ['frozen', 'chilled', 'pharma', 'ambient'] },
    v10: { id: 'v10', name: 'Van 10 t', kind: T('одиночный', 'Motorwagen', 'rigid', 'жеке'), pal: 14, kg: 5500, m3: 36, H: 230, front: 3800, rear: 6800, gross: 10000, tare: 4500, rate: 220, fuel: 18, zones: ['chilled', 'pharma', 'ambient'] },
    t20: { id: 't20', name: 'Tent 20 t', kind: T('полуприцеп', 'Sattelzug', 'semitrailer', 'жартылай тіркеме'), pal: 33, kg: 22000, m3: 90, H: 270, front: 12000, rear: 24500, gross: 40000, tare: 14000, rate: 330, fuel: 30, zones: ['ambient'] },
    v35: { id: 'v35', name: T('Фургон 3,5 т', 'Kastenwagen 3,5 t', 'Van 3.5 t', 'Фургон 3,5 т'), kind: T('малотоннажный', 'Transporter', 'light van', 'шағын тонналық'), pal: 6, kg: 1200, m3: 17, H: 190, front: 1800, rear: 2400, gross: 3500, tare: 2300, rate: 140, fuel: 11, zones: ['chilled', 'pharma', 'ambient'] },
    howo: { id: 'howo', name: 'HOWO T5G 10 t', kind: T('целевой парк', 'Zielflotte', 'target fleet', 'мақсатты парк'), pal: 16, kg: 10000, m3: 45, H: 240, front: 6500, rear: 12200, gross: 18000, tare: 8000, rate: 280, fuel: 22, zones: ['frozen', 'chilled', 'pharma', 'ambient'] },
    jac: { id: 'jac', name: 'JAC N120 10 t', kind: T('целевой парк', 'Zielflotte', 'target fleet', 'мақсатты парк'), pal: 14, kg: 7000, m3: 40, H: 235, front: 4200, rear: 8200, gross: 12000, tare: 5000, rate: 250, fuel: 20, zones: ['frozen', 'chilled', 'pharma', 'ambient'] },
  };
  const typeOfTruck = t => TYPES[{ 'Reefer 20 t': 'r20', 'Reefer 12 t': 'r12', 'Van 10 t': 'v10', 'Tent 20 t': 't20' }[t.model] || 'r12'];
  const CM = { diesel: 285, tollKm: 12, drvHour: 2500, retPct: 60, fixKm: 45 };   // full cost model (FR-143): planning values of the "cost parameters" master data
  globalThis.TYPES = TYPES; globalThis.typeOfTruck = typeOfTruck; globalThis.CM = CM;

  /* ---------- load calculation (FR-99 / FR-140 / FR-146): LIFO positions, lever-rule axle loads, height per pallet, overload with exact excess ---------- */
  function loadCalc(orders, ty, zones) {
    const sel = orders.filter(o => o.on !== false);
    const pal = sel.reduce((s, o) => s + o.pal, 0), kg = sel.reduce((s, o) => s + o.kg, 0), m3 = Math.round(sel.reduce((s, o) => s + o.m3, 0) * 10) / 10;
    const seq = sel.slice().sort((a, b) => b.stop - a.stop);   // last stop first = at the front wall
    const slots = []; let pos = 0;
    seq.forEach(o => { for (let i = 0; i < o.pal; i++) slots.push({ id: o.id, stop: o.stop, kg: o.kg / o.pal, h: o.h, pos: pos++, over: pos > ty.pal, stack: o.stack }); });
    const rows = Math.max(1, Math.ceil(ty.pal / 2));
    let front = ty.tare * 0.3;   // lever rule: a pallet in row r of n (x = (r + 0.5) / n) bears 55 % on the front axle group at the wall and 15 % at the door
    slots.forEach(s => { const x = Math.min(1, (Math.floor(s.pos / 2) + 0.5) / rows); front += s.kg * (0.55 - 0.4 * x); });
    let rear = ty.tare + kg - front;
    front = Math.round(front); rear = Math.round(rear);
    const tallest = sel.reduce((m, o) => o.h > m.h ? { h: o.h, id: o.id } : m, { h: 0, id: null });
    const gross = ty.tare + kg;
    const badZone = sel.filter(o => !ty.zones.includes(o.cls) || !(zones || ty.zones).includes(o.cls)).map(o => o.id);
    const bars = [
      { key: 'pal', label: T('Паллето-места', 'Palettenplätze', 'Pallet places', 'Паллет орындары'), val: pal, max: ty.pal, u: '' },
      { key: 'kg', label: T('Масса груза', 'Ladungsmasse', 'Payload', 'Жүк массасы'), val: kg, max: ty.kg, u: KG },
      { key: 'm3', label: T('Объём', 'Volumen', 'Volume', 'Көлем'), val: m3, max: ty.m3, u: 'm³' },
      { key: 'front', label: T('Передняя ось', 'Vorderachse', 'Front axle', 'Алдыңғы ось'), val: front, max: ty.front, u: KG },
      { key: 'rear', label: T('Задняя ось', 'Hinterachse', 'Rear axle', 'Артқы ось'), val: rear, max: ty.rear, u: KG },
      { key: 'gross', label: T('Полная масса', 'Gesamtmasse', 'Gross weight', 'Толық масса'), val: gross, max: ty.gross, u: KG },
      { key: 'h', label: T('Высота груза', 'Ladehöhe', 'Load height', 'Жүк биіктігі'), val: tallest.h, max: ty.H, u: T('см', 'cm', 'cm', 'см') },
    ].map(b => Object.assign(b, { pct: b.max ? Math.round(b.val / b.max * 100) : 0, over: b.val > b.max, ex: b.val > b.max ? Math.round((b.val - b.max) * 10) / 10 : 0 }));
    const issues = bars.filter(b => b.over).map(b => ({ code: b.key, sev: 3, text: b.label + ': +' + b.ex + ' ' + b.u + ' (' + b.val + ' / ' + b.max + ')' }));
    if (badZone.length) issues.push({ code: 'zone', sev: 3, text: T('Температурный класс не поддерживается: ', 'Temperaturklasse nicht unterstützt: ', 'Temperature class not supported: ', 'Температура класы қолдау таппайды: ') + badZone.join(', ') });
    const lat = slots.reduce((s, x) => s + (x.pos % 2 === 0 ? -x.kg : x.kg), 0);   // lateral balance: odd positions left, even right
    if (Math.abs(lat) > kg * 0.25 && kg > 0) issues.push({ code: 'lat', sev: 2, text: T('Поперечный дисбаланс ', 'Querungleichgewicht ', 'Lateral imbalance ', 'Көлденең теңгерімсіздік ') + Math.round(Math.abs(lat)) + ' ' + KG });
    const cogX = kg ? slots.reduce((s, x) => s + x.kg * ((Math.floor(x.pos / 2) + 0.5) / rows), 0) / kg : null;
    if (cogX != null && (cogX < 0.2 || cogX > 0.75)) issues.push({ code: 'cog', sev: cogX > 0.75 ? 2 : 1, text: T('Центр тяжести смещён: ', 'Schwerpunkt verschoben: ', 'Centre of gravity shifted: ', 'Ауырлық орталығы ығысқан: ') + Math.round(cogX * 100) + ' %' });
    const util = ty.pal ? Math.round(Math.max(pal / ty.pal, kg / ty.kg) * 100) : 0;
    return { pal, kg, m3, front, rear, gross, tallest, slots, rows, bars, issues, fits: !issues.some(i => i.sev === 3), util, cogX, lat, zones: badZone };
  }
  /* full trip cost (FR-143): fuel + tolls + driver hours + empty return + depreciation; "rate" cost = ₸/km × km */
  function tripCost(ty, km, extraKm) {
    const kmAll = km + (extraKm || 0), hours = Math.round(kmAll / 65 * 10) / 10;
    const fuel = Math.round(kmAll * ty.fuel / 100 * CM.diesel), toll = Math.round(kmAll * CM.tollKm), driver = Math.round(hours * CM.drvHour);
    const empty = Math.round(km * CM.retPct / 100), emptyCost = Math.round(empty * ty.fuel / 100 * CM.diesel), fixed = Math.round((kmAll + empty) * CM.fixKm);
    return { rate: ty.rate * km, fuel, toll, driver, hours, empty, emptyCost, fixed, total: fuel + toll + driver + emptyCost + fixed };
  }
  /* truck finder: every catalogue type + every fleet truck, feasibility first, then cheaper (rate or full cost), ties by utilisation */
  function finder(l, byTotal, opt) {
    const o = ops(l), km = dist(l.from, l.to), rows = [];
    const cand = Object.values(TYPES).filter(t => !['howo', 'jac'].includes(t.id) || (opt && opt.target)).filter(t => t.id !== 'v35' || (opt && opt.v35)).map(t => ({ key: 'c:' + t.id, ty: t, name: t.name, kind: T('каталог', 'Katalog', 'catalogue', 'каталог'), fleet: null }));
    S.trucks.forEach(t => cand.push({ key: 'f:' + t.id, ty: typeOfTruck(t), name: t.plate + ' · ' + t.model, kind: T('парк', 'Flotte', 'fleet', 'парк'), fleet: t }));
    cand.forEach(c => {
      const zones = c.fleet ? c.fleet.zones : c.ty.zones, r = loadCalc(o.orders, c.ty, zones), issues = r.issues.slice();
      let extra = 0;
      if (c.fleet) {
        if (c.fleet.status === 'service') issues.push({ code: 'workshop', sev: 3, text: T('ТС в сервисе', 'Fahrzeug im Service', 'Truck in workshop', 'КҚ сервисте') });
        else if (c.fleet.status === 'busy' && loadOfTruck(c.fleet.id) && loadOfTruck(c.fleet.id).id !== l.id) issues.push({ code: 'busy', sev: 3, text: T('ТС занято рейсом ', 'Fahrzeug in Tour ', 'Truck busy on load ', 'КҚ рейсте: ') + loadOfTruck(c.fleet.id).id });
        if (c.fleet.hub !== l.from) { extra = dist(c.fleet.hub, l.from); issues.push({ code: 'hub', sev: 1, text: T('Перегон из ', 'Leerfahrt von ', 'Empty run from ', 'Бос жүріс: ') + HUBS[c.fleet.hub].city + ' · ' + extra + ' ' + T('км', 'km', 'km', 'км') }); }
        if (l.zone === 'pharma' && docState(c.fleet.docs.calib) === 'expired') issues.push({ code: 'calib', sev: 3, text: T('Поверка датчиков просрочена', 'Kalibrierung abgelaufen', 'Sensor calibration expired', 'Датчик поверкасы өтті') });
      }
      const cost = tripCost(c.ty, km, extra), fits = !issues.some(i => i.sev === 3);
      rows.push(Object.assign(c, { r, issues, cost, fits, util: r.util, perPal: r.pal ? Math.round((byTotal ? cost.total : cost.rate) / r.pal) : 0 }));
    });
    rows.sort((a, b) => (b.fits - a.fits) || ((byTotal ? a.cost.total : a.cost.rate) - (byTotal ? b.cost.total : b.cost.rate)) || (b.util - a.util));
    rows.forEach((r, i) => { r.rank = i + 1; });
    const best = rows.find(r => r.fits) || null;
    /* partner offers (FR-143): logistics partners with cold / GDP capability quote per pallet */
    const palRate = { gold: 32, silver: 27, bronze: 24 }, r0 = loadCalc(o.orders, TYPES.r20);
    const partners = (S.partners || []).filter(p => p.type === 'lp' && p.tier !== 'blocked').map(p => { const okCold = l.zone === 'ambient' || p.cold, okGdp = l.zone !== 'pharma' || p.gdp, fits = okCold && okGdp && +p.cap >= r0.pal;
      return { id: p.id, name: p.name, rate: palRate[p.tier] || 24, pal: r0.pal, cost: (palRate[p.tier] || 24) * km * r0.pal, fits, why: !okCold ? T('нет рефрижераторов', 'keine Kühlfahrzeuge', 'no reefers', 'рефрижератор жоқ') : !okGdp ? T('нет допуска GDP', 'keine GDP-Zulassung', 'no GDP approval', 'GDP рұқсаты жоқ') : +p.cap < r0.pal ? T('недостаточно мест', 'zu wenig Kapazität', 'not enough capacity', 'сыйымдылық жеткіліксіз') : '' }; }).sort((a, b) => (b.fits - a.fits) || (a.cost - b.cost));
    return { rows, best, partners, bestPartner: partners.find(p => p.fits) || null, km };
  }
  /* split over two trucks (FR-139): greedy by stop, smallest fitting type for each half, compared with one bigger truck */
  function splitPlan(l) {
    const o = ops(l), sel = o.orders.filter(x => x.on !== false), km = dist(l.from, l.to), types = Object.values(TYPES).filter(t => !['howo', 'jac', 'v35'].includes(t.id));
    const fitType = os => types.filter(t => loadCalc(os, t).fits).sort((a, b) => a.rate - b.rate)[0] || null;
    const single = fitType(sel);
    const props = [];
    if (sel.length >= 2) {
      const byStop = sel.slice().sort((a, b) => a.stop - b.stop);
      for (let cut = 1; cut < byStop.length; cut++) {
        const A = byStop.slice(0, cut), B = byStop.slice(cut), ta = fitType(A), tb = fitType(B);
        if (!ta || !tb) continue;
        const cost = tripCost(ta, km).total + tripCost(tb, km).total;
        props.push({ a: A.map(x => x.id), b: B.map(x => x.id), ta, tb, palA: A.reduce((s, x) => s + x.pal, 0), palB: B.reduce((s, x) => s + x.pal, 0), cost, diff: single ? cost - tripCost(single, km).total : null });
      }
      props.sort((a, b) => a.cost - b.cost);
    }
    return { single, singleCost: single ? tripCost(single, km).total : null, props: props.slice(0, 3), needed: !single };
  }
  /* loading sequence (FR-144): LIFO by stop, odd positions left / even right, two tiers when both pallets are stackable */
  function sequence(l, ty) {
    const r = loadCalc(ops(l).orders, ty), rows = [], planned = {};
    const pl = {}; ops(l).orders.forEach(o => { pl[o.id] = o.places.slice(); });
    r.slots.forEach((s, i) => { const p = pl[s.id].shift(); const n = i + 1; if (p) planned[p.sscc] = n;
      rows.push({ n, pos: n + ' · ' + (n % 2 ? T('слева', 'links', 'left', 'сол') : T('справа', 'rechts', 'right', 'оң')), row: Math.floor(i / 2) + 1, zone: ZONES[ops(l).orders.find(o => o.id === s.id).cls].label, id: s.id, stop: ops(l).orders.find(o => o.id === s.id).to, tiers: s.stack && i % 2 === 1 && r.slots[i - 1].stack ? 2 : 1, sscc: p ? p.sscc : '—', over: s.over }); });
    return { rows, planned };
  }
  /* FEFO (FR-05): remaining shelf life at delivery below 90 days */
  const fefo = l => ops(l).orders.flatMap(o => o.lines.filter(x => (new Date(x.exp) - new Date(l.eta)) / 864e5 < 90).map(x => ({ order: o.id, art: x.art, lot: x.lot, exp: x.exp, days: Math.floor((new Date(x.exp) - new Date(l.eta)) / 864e5) })));
  /* SSCC reconciliation (FR-06): places scanned at loading vs. expected per order; a place scanned into another trip is a mismatch */
  const recon = l => ops(l).orders.map(o => { const n = o.places.filter(p => p.scans.some(s => s.ev === 'load' && s.load === l.id)).length, wrong = o.places.filter(p => p.scans.some(s => s.load !== l.id)).length;
    return { id: o.id, to: o.to, exp: o.pal, n, wrong, ok: n === o.pal && !wrong, lvl: n === o.pal && !wrong ? 0 : n < o.pal ? 3 : 2, mark: wrong ? T('не тот рейс', 'falsche Tour', 'wrong trip', 'басқа рейс') : n === o.pal ? T('сходится', 'stimmt', 'matches', 'сәйкес') : n < o.pal ? T('недостача ', 'fehlt ', 'short ', 'жетіспейді ') + (o.pal - n) : T('излишек', 'Überschuss', 'surplus', 'артық') }; });
  const reconOk = l => recon(l).every(r => r.ok);
  function rescan(lid, oid) { const l = load(lid), o = ops(l).orders.find(x => x.id === oid); const p = o && o.places.find(x => !x.scans.some(s => s.ev === 'load' && s.load === lid)); if (!p) return false;
    p.scans.push({ t: fdt(NOW).slice(-5), ev: 'load', where: HUBS[l.from].city, load: lid }); ops(l).scanLog.push(p.sscc + ' → ' + o.id); audit('Load', lid, 'Rescan ' + p.sscc, ''); return true; }
  /* departure weighing (FR-145): record → excess against the limits of the planned type; override only with trips:override_load + reason */
  function weighLimits(l) { const o = ops(l); const ty = (o.plan && TYPES[o.plan.type]) || (l.truck ? typeOfTruck(trk(l.truck)) : null) || TYPES.r12; return ty; }
  function weigh(lid, f) {
    const l = load(lid), ty = weighLimits(l), ex = [];
    const front = f.front == null ? null : +f.front, rear = f.rear == null ? null : +f.rear, gross = f.gross == null ? (front != null && rear != null ? front + rear : null) : +f.gross;
    if (gross == null) return T('Укажите полную массу или обе оси', 'Gesamtmasse oder beide Achsen angeben', 'Enter the gross weight or both axles', 'Толық массаны немесе екі осьті көрсетіңіз');
    if (front != null && front > ty.front) ex.push({ code: 'front', val: front, max: ty.front, excess: front - ty.front });
    if (rear != null && rear > ty.rear) ex.push({ code: 'rear', val: rear, max: ty.rear, excess: rear - ty.rear });
    if (gross > ty.gross) ex.push({ code: 'gross', val: gross, max: ty.gross, excess: gross - ty.gross });
    const w = { id: ops(l).weigh.length + 1, source: f.source || 'weighbridge', ticket: f.ticket || '', front, rear, gross, at: fdt(NOW), excess: ex, ok: !ex.length, override: false, reason: '' };
    ops(l).weigh.unshift(w); audit('Load', lid, 'Weighing ' + gross + ' kg', ex.length ? ex.map(x => x.code + ' +' + x.excess).join(', ') : 'ok');
    return w;
  }
  function weighOverride(lid, reason) {
    const w = ops(load(lid)).weigh[0]; if (!w || w.ok) return T('Нет перегруза для допуска', 'Keine Überladung freizugeben', 'No overload to release', 'Рұқсат беретін артық жүк жоқ');
    if (!canDo('trips:override_load')) return T('Нет права trips:override_load', 'Kein Recht trips:override_load', 'No permission trips:override_load', 'trips:override_load құқығы жоқ');
    if (!reason || reason.trim().length < 10) return T('Обоснование ≥ 10 знаков', 'Begründung ≥ 10 Zeichen', 'Reason of 10+ characters', 'Негіздеме ≥ 10 таңба');
    w.override = true; w.reason = reason.trim(); audit('Load', lid, 'Weighing override', w.reason); return null;
  }
  /* plan of the vehicle type (FR-99): a type that does not fit needs trips:override_load and a reason */
  function savePlan(lid, typeId, reason) {
    const l = load(lid), ty = TYPES[typeId]; if (!ty) return T('Тип ТС не найден', 'Fahrzeugtyp nicht gefunden', 'Vehicle type not found', 'КҚ түрі табылмады');
    const r = loadCalc(ops(l).orders, ty);
    if (!r.fits) { if (!canDo('trips:override_load')) return T('Не помещается — план только с обоснованием руководителя (trips:override_load)', 'Passt nicht — Plan nur mit Begründung einer Leitung (trips:override_load)', 'Does not fit — plan only with a supervisor reason (trips:override_load)', 'Сыймайды — жоспар тек басшы негіздемесімен'); if (!reason || reason.trim().length < 10) return T('Обоснование перегруза ≥ 10 знаков', 'Begründung der Überschreitung ≥ 10 Zeichen', 'Reason for the overload, 10+ characters', 'Артық жүк негіздемесі ≥ 10 таңба'); }
    ops(l).plan = { type: typeId, label: ty.name, by: 'Sarah Johnson', t: fdt(NOW).slice(-5), fits: r.fits, reason: r.fits ? '' : reason.trim() };
    audit('Load', lid, (r.fits ? 'Plan ' : 'Plan override ') + ty.name, r.fits ? '' : reason.trim()); return null;
  }
  Object.assign(globalThis, { loadCalc, tripCost, finder, splitPlan, sequence, fefo, recon, reconOk, rescan, weigh, weighOverride, weighLimits, savePlan });

  /* ---------- KZ documents (LH-H1 / FR-12 / FR-116): TTN, waybill, SNT (ESUTD), ESF (IS ESF); statuses none → ready → signed → sent → accepted ---------- */
  const KDOC = {
    ttn: { name: T('ТТН (товарно-транспортная накладная)', 'TTN (Frachtbrief)', 'TTN (consignment note)', 'ТТН (тауар-көлік жүкқұжаты)'), sign: true, send: null },
    waybill: { name: T('Путевой лист', 'Fahrtenschreiber / Wegeliste', 'Waybill (trip sheet)', 'Жол парағы'), sign: true, send: null },
    snt: { name: T('СНТ (сопроводительная накладная на товары)', 'SNT (Warenbegleitschein)', 'SNT (goods accompanying note)', 'ТІЖ (тауарларға ілеспе жүкқұжат)'), sign: true, send: 'ЕСУТД' },
    esf: { name: T('ЭСФ (электронная счёт-фактура)', 'ESF (elektronische Rechnung)', 'ESF (electronic invoice)', 'ЭШФ (электрондық шот-фактура)'), sign: true, send: T('ИС ЭСФ', 'IS ESF', 'IS ESF', 'ЭШФ АЖ') },
  };
  const DST = { none: ['gray', T('не сформирован', 'nicht erstellt', 'not generated', 'жасалмаған')], ready: ['blue', T('сформирован', 'erstellt', 'generated', 'жасалды')], signed: ['purple', T('подписан ЭЦП', 'mit EDS signiert', 'signed (EDS)', 'ЭЦҚ қол қойылды')], sent: ['yellow', T('отправлен', 'gesendet', 'sent', 'жіберілді')], accepted: ['green', T('принят', 'angenommen', 'accepted', 'қабылданды')], rejected: ['red', T('отклонён', 'abgelehnt', 'rejected', 'қабылданбады')], closed: ['green', T('закрыт', 'geschlossen', 'closed', 'жабылды')] };
  const docCan = (l, k) => { if (k === 'esf') return l.status === 'delivered' && l.pod === 'approved'; if (k === 'waybill') return !!l.driver && !!l.truck && drv(l.driver).medcheck === today; return l.status !== 'unassigned'; };
  const docWhy = (l, k) => k === 'esf' ? T('ЭСФ формируется из доставленного заказа после подтверждения POD', 'ESF entsteht aus dem gelieferten Auftrag nach POD-Freigabe', 'ESF is generated from the delivered order once the POD is approved', 'ЭШФ POD расталған соң жеткізілген тапсырыстан жасалады') : k === 'waybill' ? (l.driver && l.truck ? T('Нужен предрейсовый медосмотр водителя (FR-114)', 'Vorfahrtuntersuchung des Fahrers nötig (FR-114)', 'Pre-trip medical check of the driver required (FR-114)', 'Жүргізушінің рейс алдындағы медтексеруі қажет (FR-114)') : T('Нужны водитель и ТС', 'Fahrer und Fahrzeug nötig', 'Driver and truck required', 'Жүргізуші мен КҚ қажет')) : T('Рейс не назначен', 'Fahrt nicht zugewiesen', 'Load not assigned', 'Рейс тағайындалмаған');
  function docGen(lid, k) { const l = load(lid), o = ops(l); if (!docCan(l, k)) return docWhy(l, k); if (o.kdocs[k] !== 'none' && o.kdocs[k] !== 'rejected') return null; o.kdocs[k] = 'ready'; if (k === 'esf') l.esf = 'issued'; audit('Docs', lid, 'Generate ' + k, ''); return null; }
  function docSign(lid, k) { const o = ops(load(lid)); if (o.kdocs[k] !== 'ready') return T('Сначала сформируйте документ', 'Erst Dokument erstellen', 'Generate the document first', 'Алдымен құжатты жасаңыз'); if (!canDo('documents:sign')) return T('Нет права documents:sign', 'Kein Recht documents:sign', 'No permission documents:sign', 'documents:sign құқығы жоқ'); o.kdocs[k] = 'signed'; audit('Docs', lid, 'Sign ' + k + ' (NCALayer, demo)', 'cert KZ-NCA-2026-4471'); return null; }
  function docSend(lid, k) { const l = load(lid), o = ops(l); if (!KDOC[k].send) return T('Документ не передаётся в госсистему', 'Dokument geht an kein Staatssystem', 'Document is not sent to a state system', 'Құжат мемлекеттік жүйеге жіберілмейді'); if (o.kdocs[k] !== 'signed') return T('Сначала подпишите ЭЦП', 'Erst mit EDS signieren', 'Sign with the e-signature first', 'Алдымен ЭЦҚ қол қойыңыз'); o.kdocs[k] = 'sent'; o.inbox.push({ key: k.toUpperCase(), lvl: 1, text: T('Отправлено в ', 'Gesendet an ', 'Sent to ', 'Жіберілді: ') + KDOC[k].send + ' · ' + fdt(NOW) }); if (k === 'esf') l.esf = 'issued'; audit('Docs', lid, 'Send ' + k + ' → ' + KDOC[k].send, ''); return null; }
  function docPoll(lid) { const l = load(lid), o = ops(l); let n = 0; Object.keys(o.kdocs).forEach(k => { if (o.kdocs[k] === 'sent') { o.kdocs[k] = 'accepted'; n++; o.inbox.push({ key: k.toUpperCase(), lvl: 0, text: KDOC[k].send + ': ' + T('принят, рег. № ', 'angenommen, Reg.-Nr. ', 'accepted, reg. no. ', 'қабылданды, тіркеу № ') + 'KZ-' + hashOf(lid + k) }); if (k === 'esf') l.esf = 'confirmed'; } }); return n; }
  const docSet = l => Object.keys(KDOC).map(k => ({ k, name: KDOC[k].name, st: ops(l).kdocs[k], chip: DST[ops(l).kdocs[k]] || DST.none, can: docCan(l, k), why: docWhy(l, k), send: KDOC[k].send }));
  Object.assign(globalThis, { KDOC, DST, docGen, docSign, docSend, docPoll, docSet });

  /* ---------- Go/No-Go release gate (LH-B2 / FR-11 / FR-91 / FR-92 / FR-114): every control checks data, never a text flag ---------- */
  function gate(l) {
    const o = ops(l), d = l.driver ? drv(l.driver) : null, t = l.truck ? trk(l.truck) : null, c = [];
    const add = (key, pass, label, text, warn) => c.push({ key, pass, lvl: pass ? (warn ? 1 : 0) : 3, label, text });
    add('docs', ['signed', 'sent', 'accepted'].includes(o.kdocs.ttn) && ['signed', 'sent', 'accepted', 'closed'].includes(o.kdocs.waybill), T('Документы', 'Dokumente', 'Documents', 'Құжаттар'), T('ТТН и путевой лист подписаны ЭЦП', 'TTN und Wegeliste mit EDS signiert', 'TTN and waybill signed with e-signature', 'ТТН мен жол парағы ЭЦҚ қол қойылған'));
    add('calib', !!t && docState(t.docs.calib) !== 'expired', T('Поверка датчиков', 'Kalibrierung', 'Sensor calibration', 'Датчик поверкасы'), t ? T('до ', 'bis ', 'until ', 'дейін ') + fd(t.docs.calib) : T('ТС не назначено', 'kein Fahrzeug', 'no truck', 'КҚ жоқ'), t && docState(t.docs.calib) === 'soon');
    add('ins', !!t && docState(t.docs.osago) !== 'expired' && docState(t.docs.cargo) !== 'expired', T('Страхование', 'Versicherung', 'Insurance', 'Сақтандыру'), t ? T('ОСАГО до ', 'Haftpflicht bis ', 'MTPL until ', 'ОСАГО дейін ') + fd(t.docs.osago) + ' · ' + T('груз до ', 'Fracht bis ', 'cargo until ', 'жүк дейін ') + fd(t.docs.cargo) : '—', t && (docState(t.docs.osago) === 'soon' || docState(t.docs.cargo) === 'soon'));
    const med = d && d.docs.find(x => x.type === 'med');
    add('med', !!d && !!med && docState(med.to) !== 'expired' && d.medcheck === today, T('Медосмотр', 'Untersuchung', 'Medical check', 'Медтексеру'), d ? (d.medcheck === today ? T('предрейсовый осмотр пройден сегодня', 'Vorfahrtuntersuchung heute bestanden', 'pre-trip check passed today', 'рейс алдындағы тексеру бүгін өтті') : T('нет предрейсового осмотра на сегодня (FR-114)', 'keine Vorfahrtuntersuchung heute (FR-114)', 'no pre-trip medical check today (FR-114)', 'бүгін рейс алдындағы тексеру жоқ')) + (med ? ' · ' + T('справка до ', 'Attest bis ', 'certificate until ', 'анықтама дейін ') + fd(med.to) : '') : T('водитель не назначен', 'kein Fahrer', 'no driver', 'жүргізуші жоқ'));
    const rc = recon(l), short = rc.filter(r => !r.ok).length;
    add('places', !short, T('Сверка мест (SSCC)', 'Packstückabgleich (SSCC)', 'Place reconciliation (SSCC)', 'Орындарды салыстыру (SSCC)'), short ? short + ' ' + T('заказ(а) с расхождением', 'Auftrag/Aufträge mit Abweichung', 'order(s) with a mismatch', 'тапсырыста айырмашылық') : rc.reduce((s, r) => s + r.n, 0) + ' / ' + l.pallets + ' ' + T('мест отсканировано', 'Packstücke gescannt', 'places scanned', 'орын сканерленді'));
    const w = o.weigh[0], lc = t ? loadCalc(o.orders, typeOfTruck(t), t.zones) : null;
    add('load', w ? (w.ok || w.override) : (lc ? lc.fits : true), T('Загрузка и вес', 'Beladung und Gewicht', 'Load and weight', 'Тиеу және салмақ'), w ? (w.ok ? T('взвешивание в пределах ТС', 'Verwiegung innerhalb der Grenzen', 'weighing within limits', 'өлшеу шегінде') : w.override ? T('перегруз допущен с обоснованием', 'Überladung mit Begründung freigegeben', 'overload released with a reason', 'артық жүк негіздемемен рұқсат етілді') : T('перегруз по взвешиванию: ', 'Überladung laut Verwiegung: ', 'overload by weighing: ', 'өлшеу бойынша артық жүк: ') + w.excess.map(x => x.code + ' +' + x.excess + ' ' + KG).join(', ')) : lc ? (lc.fits ? T('расчёт: помещается', 'Berechnung: passt', 'calculation: fits', 'есеп: сыяды') : lc.issues[0].text) : T('без взвешивания — проверяется расчёт', 'ohne Verwiegung — Berechnung gilt', 'no weighing — the calculation applies', 'өлшеусіз — есеп қолданылады'), !w && !t);
    add('temp', !!t && t.zones.includes(l.zone), T('Температурный класс', 'Temperaturklasse', 'Temperature class', 'Температура класы'), t ? ZONES[l.zone].label + (t.zones.includes(l.zone) ? ' ✓' : ' ✗ ' + t.model) : '—');
    const lic = d && d.docs.find(x => x.type === 'lic');
    add('driver', !!d && !!lic && docState(lic.to) !== 'expired' && d.rto >= needRto(l), T('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'), d ? T('права до ', 'Führerschein bis ', 'licence until ', 'куәлік дейін ') + (lic ? fd(lic.to) : '—') + ' · РТО ' + d.rto + ' ' + T('ч', 'h', 'h', 'сағ') : '—');
    const storm = (S.ops.storm || []).filter(h => h === l.from || h === l.to);
    add('wx', !storm.length, T('Погода и дороги', 'Wetter und Straßen', 'Weather and roads', 'Ауа райы және жолдар'), storm.length ? T('штормовое предупреждение: ', 'Sturmwarnung: ', 'storm warning: ', 'дауыл ескертуі: ') + storm.map(h => HUBS[h].city).join(', ') : T('предупреждений нет', 'keine Warnungen', 'no warnings', 'ескерту жоқ'));
    return c;
  }
  const gateOk = l => gate(l).every(x => x.pass);
  function release(lid, reason) {
    const l = load(lid), o = ops(l); if (!['assigned', 'loading'].includes(l.status)) return T('Выпуск возможен для назначенного рейса до отправления', 'Freigabe nur für zugewiesene Fahrten vor Abfahrt', 'Release applies to an assigned load before departure', 'Шығару тек жөнелтуге дейін');
    if (gateOk(l)) { o.released = { by: 'Sarah Johnson', t: fdt(NOW).slice(-5), override: false }; o.revoked = null; audit('Release', lid, 'Go', ''); return null; }
    if (!canDo('trips:override_release')) return T('Go/No-Go не пройден — исключение только с правом trips:override_release', 'Go/No-Go nicht bestanden — Ausnahme nur mit Recht trips:override_release', 'Go/No-Go failed — exception only with permission trips:override_release', 'Go/No-Go өтпеді — тек trips:override_release құқығымен');
    if (!reason || reason.trim().length < 10) return T('Укажите обоснование исключения (≥ 10 знаков)', 'Begründung der Ausnahme angeben (≥ 10 Zeichen)', 'Give a reason for the exception (10+ characters)', 'Ерекшелік негіздемесін көрсетіңіз (≥ 10 таңба)');
    o.released = { by: 'Sarah Johnson', t: fdt(NOW).slice(-5), override: true, reason: reason.trim(), failed: gate(l).filter(x => !x.pass).map(x => x.key) }; o.revoked = null;
    audit('Release', lid, 'Override release', reason.trim()); return null;
  }
  const REVOKE = { weather: T('погода / дорога', 'Wetter / Straße', 'weather / road', 'ауа райы / жол'), vehicle: T('транспорт', 'Fahrzeug', 'vehicle', 'көлік'), driver: T('водитель', 'Fahrer', 'driver', 'жүргізуші'), documents: T('документы', 'Dokumente', 'documents', 'құжаттар'), load: T('загрузка', 'Beladung', 'load', 'тиеу'), alarm: T('критическая тревога', 'kritischer Alarm', 'critical alarm', 'сыни дабыл'), planning: T('рейс изменён', 'Tour geändert', 'trip changed', 'рейс өзгерді'), other: T('другое', 'Sonstiges', 'other', 'басқа') };
  function revoke(lid, why) { const o = ops(load(lid)); if (!o.released) return false; o.released = null; o.revoked = { why: why || 'other', t: fdt(NOW).slice(-5) }; audit('Release', lid, 'Revoke', REVOKE[why] || why); return true; }
  const released = l => !!ops(l).released;
  Object.assign(globalThis, { gate, gateOk, release, revoke, released, REVOKE });
  /* the status rule: loading → in_transit only with a valid release (FR-91); the dispatch drag & drop and the drawer button both go through canMove */
  const canMove0 = canMove;
  canMove = function (l, to) { const e = canMove0(l, to); if (e) return e; if (to === 'in_transit' && l.status === 'loading' && !released(l)) return T('Нужен выпуск Go/No-Go (вкладка «Документы РК» или карточка рейса)', 'Go/No-Go-Freigabe nötig (Reiter „Dokumente KZ“ oder Fahrtkarte)', 'Go/No-Go release required (tab "Documents KZ" or the load card)', 'Go/No-Go шығару қажет'); return null; };
  /* double booking (FR-93): a driver or truck that already carries an active load cannot be assigned again, whatever its status flag says */
  const assign0 = assign;
  /* FR-93: a resource is double-booked when it is flagged busy or sits on a load this platform assigned (seeded demo loads with free-flagged resources stay re-plannable) */
  const booked = (l, res) => !!l && (l.booked === true || res.status === 'busy');
  S.loads.forEach(l => { if (isActive(l) && l.driver && drv(l.driver).status === 'busy') l.booked = true; });   // seeded loads whose resources are flagged busy are firm bookings
  assign = function (id, did, tid) { let ld = did && loadOfDriver(did), lt = tid && loadOfTruck(tid); if (!booked(ld, drv(did))) ld = null; if (!booked(lt, trk(tid))) lt = null;
    if (ld && ld.id !== id) return T('Двойное бронирование: водитель уже в рейсе ', 'Doppelbuchung: Fahrer bereits in Fahrt ', 'Double booking: driver already on load ', 'Қос брондау: жүргізуші рейсте ') + ld.id;
    if (lt && lt.id !== id) return T('Двойное бронирование: ТС уже в рейсе ', 'Doppelbuchung: Fahrzeug bereits in Fahrt ', 'Double booking: truck already on load ', 'Қос брондау: КҚ рейсте ') + lt.id;
    const e = assign0(id, did, tid); if (!e) load(id).booked = true; return e; };
  const createLoad0 = createLoad;
  createLoad = function (f) { const r = createLoad0(f); if (r && r.ok) ops(load(r.ok)); return r; };   // the ops record is built at creation, so later status changes never look seeded
  /* replanning (FR-94): unassign (frees driver and truck, back to Unassigned) and a new departure with a reason; both withdraw a release */
  function unassign(lid) { const l = load(lid); if (!['assigned', 'loading'].includes(l.status)) return T('Снять назначение можно до отправления', 'Zuweisung nur vor Abfahrt lösbar', 'Unassign only before departure', 'Тағайындауды тек жөнелтуге дейін алуға болады');
    const d = drv(l.driver), t = trk(l.truck); const was = l.status; l.driver = null; l.truck = null; l.status = 'unassigned'; l.booked = false; if (d.id) d.status = 'available'; if (t.id) t.status = 'available';
    l.notes.push({ who: 'System', t: fdt(NOW).slice(-5), text: T('Назначение снято', 'Zuweisung gelöst', 'Assignment removed', 'Тағайындау алынды') + ' (' + ST[was].l + ')' }); if (released(l)) revoke(lid, 'planning'); ops(l).kdocs.waybill = 'none'; audit('Dispatch', lid, 'Unassign', ''); return null; }
  function replan(lid, etaIso, why) { const l = load(lid); if (!etaIso || isNaN(new Date(etaIso))) return T('Укажите новое время', 'Neue Zeit angeben', 'Enter the new time', 'Жаңа уақытты көрсетіңіз'); if (['in_transit', 'problem', 'delivered'].includes(l.status)) return T('Рейс уже в пути', 'Fahrt bereits unterwegs', 'Load already on the road', 'Рейс жолда');
    const old = l.eta; l.eta = new Date(/Z|[+-]\d\d:\d\d$/.test(etaIso) ? etaIso : etaIso.length === 16 ? etaIso + ':00+05:00' : etaIso + '+05:00').toISOString();   /* a datetime-local value is KZ time */ ops(l).replans.push({ from: old, to: l.eta, why: why || 'other', t: fdt(NOW).slice(-5) }); l.notes.push({ who: 'System', t: fdt(NOW).slice(-5), text: T('Перенос: ', 'Verschiebung: ', 'Replanned: ', 'Ауыстыру: ') + fdt(old) + ' → ' + fdt(l.eta) + ' · ' + (REVOKE[why] || why) }); if (released(l)) revoke(lid, 'planning'); audit('Dispatch', lid, 'Replan → ' + fdt(l.eta), REVOKE[why] || why || ''); return null; }
  function medcheck(did) { const d = drv(did); if (!d.id) return false; d.medcheck = today; audit('Drivers', d.name, 'Pre-trip medical check', ''); return true; }
  Object.assign(globalThis, { unassign, replan, medcheck });
  S.drivers.forEach(d => { if (['d1', 'd2', 'd4', 'd7'].includes(d.id)) d.medcheck = today; });   // drivers that are already on the road passed today's check; d5 (assigned) has not yet
  HOOKS.status.push((l, was, st) => { if (st === 'problem' && was === 'loading' && released(l)) revoke(l.id, 'alarm'); });

  /* ---------- KZ working-day calendar (FR-156): holidays with weekend transfers; used for deadlines ---------- */
  const HOL = { '2026-01-01': 1, '2026-01-02': 1, '2026-01-07': 1, '2026-03-08': 1, '2026-03-21': 1, '2026-03-22': 1, '2026-03-23': 1, '2026-05-01': 1, '2026-05-07': 1, '2026-05-09': 1, '2026-07-06': 1, '2026-08-30': 1, '2026-10-25': 1, '2026-12-16': 1, '2027-01-01': 1, '2027-01-02': 1, '2027-01-07': 1, '2027-03-08': 1, '2027-03-21': 1, '2027-03-22': 1, '2027-03-23': 1, '2027-05-01': 1, '2027-05-07': 1, '2027-05-09': 1, '2027-07-06': 1, '2027-08-30': 1, '2027-10-25': 1, '2027-12-16': 1 };
  const HOLNAME = { '01-01': T('Новый год', 'Neujahr', 'New Year', 'Жаңа жыл'), '01-02': T('Новый год', 'Neujahr', 'New Year', 'Жаңа жыл'), '01-07': T('Рождество', 'Weihnachten (orth.)', 'Orthodox Christmas', 'Рождество'), '03-08': T('Международный женский день', 'Frauentag', 'Women’s Day', 'Халықаралық әйелдер күні'), '03-21': T('Наурыз', 'Nauryz', 'Nauryz', 'Наурыз'), '03-22': T('Наурыз', 'Nauryz', 'Nauryz', 'Наурыз'), '03-23': T('Наурыз', 'Nauryz', 'Nauryz', 'Наурыз'), '05-01': T('День единства народа', 'Tag der Einheit', 'Unity Day', 'Халық бірлігі күні'), '05-07': T('День защитника Отечества', 'Tag der Verteidiger', 'Defender of the Fatherland Day', 'Отан қорғаушы күні'), '05-09': T('День Победы', 'Tag des Sieges', 'Victory Day', 'Жеңіс күні'), '07-06': T('День столицы', 'Tag der Hauptstadt', 'Capital City Day', 'Астана күні'), '08-30': T('День Конституции', 'Tag der Verfassung', 'Constitution Day', 'Конституция күні'), '10-25': T('День Республики', 'Tag der Republik', 'Republic Day', 'Республика күні'), '12-16': T('День Независимости', 'Tag der Unabhängigkeit', 'Independence Day', 'Тәуелсіздік күні') };
  const dow = iso => new Date(iso + 'T12:00:00+05:00').getDay();
  /* a holiday on a weekend moves to the next working day (transfer rule of the KZ labour code) */
  const transfers = (() => { const t = {}; Object.keys(HOL).forEach(h => { if (dow(h) === 0 || dow(h) === 6) { let d = h; do { d = addDays(d, 1); } while (dow(d) === 0 || dow(d) === 6 || HOL[d] || t[d]); t[d] = h; } }); return t; })();
  const dayKind = iso => HOL[iso] ? 'holiday' : transfers[iso] ? 'transfer' : (dow(iso) === 0 || dow(iso) === 6) ? 'weekend' : 'work';
  const isWorkDay = iso => dayKind(iso) === 'work';
  const addWorkDays = (iso, n) => { let d = iso, k = 0; while (k < n) { d = addDays(d, 1); if (isWorkDay(d)) k++; } return d; };
  const holName = iso => HOLNAME[(HOL[iso] ? iso : transfers[iso] || iso).slice(5)] || '';
  const nextHolidays = (from, n) => Object.keys(HOL).concat(Object.keys(transfers)).filter(d => d >= from).sort().slice(0, n).map(d => ({ d, kind: dayKind(d), name: holName(d) + (transfers[d] ? ' (' + T('перенос', 'verlegt', 'transferred', 'ауыстырылды') + ')' : '') }));
  Object.assign(globalThis, { dayKind, isWorkDay, addWorkDays, holName, nextHolidays, KZ_HOL: HOL });

  /* ---------- express approval (LH-N1 / FR-41 / FR-126 / FR-154): three business functions, deadline, consequences, KPI ---------- */
  const EXFN = { ceo: T('Генеральный директор', 'Geschäftsführer', 'CEO', 'Бас директор'), ana: T('Аналитика', 'Analytik', 'Analytics', 'Аналитика'), log: T('Закупки / логистика', 'Einkauf / Logistik', 'Procurement / logistics', 'Сатып алу / логистика') };
  const ROLE_FN = { admin: ['ceo', 'ana', 'log'], manager: ['ceo'], finance: ['ana'], dispatcher: ['log'] };
  const myFns = () => ROLE_FN[S.role] || [];
  const EX = (id, cust, from, to, zone, pal, kg, want, due, o) => Object.assign({ id, cust, from, to, zone, pal, kg, want, due, sig: { ceo: null, ana: null, log: null }, status: 'pending', surcharge: 35, notified: fdt(addDays(NOW.toISOString(), -1) + 'T09:00:00+05:00'), log: [], load: null }, o);
  S.express = [
    EX('EX-1041', 'c3', 'AST', 'ALA', 'pharma', 6, 1500, '2026-10-19T12:00:00+05:00', '2026-10-18T17:00:00+05:00', { sig: { ceo: { by: 'A. Smirnov', t: '09:40' }, ana: { by: 'D. Lee', t: '10:15' }, log: null } }),
    EX('EX-1042', 'c2', 'ALA', 'SHY', 'chilled', 10, 3800, '2026-10-20T09:00:00+05:00', '2026-10-19T12:00:00+05:00'),
    EX('EX-1039', 'c1', 'AST', 'KAR', 'pharma', 4, 900, '2026-10-18T18:00:00+05:00', '2026-10-18T11:00:00+05:00', { sig: { ceo: { by: 'A. Smirnov', t: '08:10' }, ana: null, log: null } }),
    EX('EX-1035', 'c4', 'KAR', 'AST', 'frozen', 8, 4200, '2026-10-16T10:00:00+05:00', '2026-10-15T12:00:00+05:00', { status: 'approved', sig: { ceo: { by: 'A. Smirnov', t: '09:00' }, ana: { by: 'D. Lee', t: '09:30' }, log: { by: 'S. Johnson', t: '10:00' } }, load: 'LD-2026-001843' }),
    EX('EX-1031', 'c5', 'AST', 'KAR', 'ambient', 12, 4000, '2026-10-14T10:00:00+05:00', '2026-10-13T12:00:00+05:00', { status: 'rejected', sig: { ceo: { by: 'A. Smirnov', t: '09:00' }, ana: { reject: true, by: 'D. Lee', t: '09:30', why: T('регулярный рейс успевает', 'Regelfahrt reicht', 'the regular trip is on time', 'тұрақты рейс үлгереді') }, log: null }, load: 'LD-2026-001845' }),
  ];
  const exCount = e => Object.values(e.sig).filter(s => s && !s.reject).length;
  function exFinish(e, approved) {
    e.status = approved ? 'approved' : 'rejected';
    const r = createLoad({ cust: e.cust, from: e.from, to: e.to, zone: e.zone, pallets: e.pal, priority: approved ? 'high' : 'medium' });
    if (r && r.ok) { e.load = r.ok; const l = load(r.ok); l.express = approved; l.notes.push({ who: 'System', t: fdt(NOW).slice(-5), text: approved ? T('Экспресс согласован 3/3, надбавка +', 'Express 3/3 freigegeben, Zuschlag +', 'Express approved 3/3, surcharge +', 'Экспресс 3/3 келісілді, үстеме +') + e.surcharge + ' % · ' + e.id : T('Экспресс отклонён → регулярный рейс · ', 'Express abgelehnt → Regelfahrt · ', 'Express rejected → regular trip · ', 'Экспресс қабылданбады → тұрақты рейс · ') + e.id }); }
    e.log.push({ t: fdt(NOW).slice(-5), text: approved ? T('Согласовано, создан срочный рейс ', 'Freigegeben, Eilfahrt angelegt ', 'Approved, express load created ', 'Келісілді, жедел рейс құрылды ') + e.load : T('Отказ → регулярный рейс ', 'Abgelehnt → Regelfahrt ', 'Rejected → regular load ', 'Қабылданбады → тұрақты рейс ') + e.load });
  }
  function exSign(id, fn) { const e = S.express.find(x => x.id === id); if (!e || e.status !== 'pending') return T('Заявка закрыта', 'Anfrage geschlossen', 'Request closed', 'Өтінім жабық'); if (!myFns().includes(fn)) return T('Ваша роль не выполняет функцию ', 'Ihre Rolle hat nicht die Funktion ', 'Your role does not hold the function ', 'Рөліңізде функция жоқ: ') + EXFN[fn]; if (e.sig[fn]) return T('Уже подписано', 'Bereits unterschrieben', 'Already signed', 'Қол қойылған');
    e.sig[fn] = { by: 'Sarah Johnson', t: fdt(NOW).slice(-5) }; e.log.push({ t: fdt(NOW).slice(-5), text: EXFN[fn] + ': ✓' }); audit('Express', id, 'Sign ' + fn, ''); if (exCount(e) === 3) exFinish(e, true); return null; }
  function exReject(id, fn, why) { const e = S.express.find(x => x.id === id); if (!e || e.status !== 'pending') return T('Заявка закрыта', 'Anfrage geschlossen', 'Request closed', 'Өтінім жабық'); if (!myFns().includes(fn)) return T('Ваша роль не выполняет функцию ', 'Ihre Rolle hat nicht die Funktion ', 'Your role does not hold the function ', 'Рөліңізде функция жоқ: ') + EXFN[fn];
    e.sig[fn] = { reject: true, by: 'Sarah Johnson', t: fdt(NOW).slice(-5), why: why || '' }; e.log.push({ t: fdt(NOW).slice(-5), text: EXFN[fn] + ': ✗ ' + (why || '') }); audit('Express', id, 'Reject ' + fn, why || ''); exFinish(e, false); return null; }
  /* deadline consequence (FR-126): a request still open at its cut-off is closed as rejected and goes as a regular trip */
  function exTick(at) { const t = at || NOW.toISOString(); let n = 0; S.express.filter(e => e.status === 'pending' && e.due < t).forEach(e => { e.status = 'expired'; e.log.push({ t: fdt(NOW).slice(-5), text: T('Срок истёк без 3 подписей', 'Frist ohne 3 Unterschriften abgelaufen', 'Deadline passed without 3 signatures', 'Мерзім 3 қолсыз өтті') }); exFinish(e, false); e.status = 'expired'; audit('Express', e.id, 'Expired', ''); n++; }); return n; }
  const exKpi = () => { const all = S.loads.length, ex = S.loads.filter(l => l.express).length; return { all, ex, share: all ? Math.round(ex / all * 1000) / 10 : 0, target: 10, trend: [{ m: T('−12 мес', '−12 Mon.', '−12 mo', '−12 ай'), v: 18 }, { m: T('−6 мес', '−6 Mon.', '−6 mo', '−6 ай'), v: 12 }, { m: T('сейчас', 'jetzt', 'now', 'қазір'), v: all ? Math.round(ex / all * 1000) / 10 : 0 }] }; };
  Object.assign(globalThis, { EXFN, myFns, exSign, exReject, exTick, exCount, exKpi });
  S.ops = { storm: [], scen: { storm: false, repair: false, peak: false }, target: false, byTotal: false, split: false, v35: false, sel: null, shipSel: null, shipQ: '', shipArch: false, shipFrom: '', zpl: false, docSel: null, exWhy: {}, seqMsg: null, weighMsg: null };
  globalThis.opsToday = today; globalThis.opsDaysTo = daysTo;
})();
