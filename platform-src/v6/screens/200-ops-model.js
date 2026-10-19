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
    freshline: { name: 'FreshLine Foods', co: 'ТОО «FreshLine Foods», Алматы', url: 'freshline.example', ab: 'FL', col: 4, logo: 'freshline.svg', cc: 'KZ', grp: 2 },
    polar: { name: 'Polar Fisch GmbH', co: 'Polar Fisch GmbH, Bremerhaven', url: 'polar-fisch.example', ab: 'PF', col: 5, logo: 'polar-fisch.svg', cc: 'DE', grp: 2 },
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
    medsnab: { name: T('ТОО «МедСнаб Актобе» · сторонний груз', 'MedSnab Aktobe LLP · Fremdladung', 'MedSnab Aktobe LLP · third-party cargo', '«МедСнаб Ақтөбе» ЖШС · бөгде жүк'), co: 'ТОО «МедСнаб Актобе»', url: '', ab: 'MS', col: 6, logo: 'medsnab.svg', cc: 'KZ', grp: 3 },
    pharmchain: { name: T('Аптечная сеть · сторонний груз', 'Apothekenkette · Fremdladung', 'Pharmacy chain · third-party cargo', 'Дәріхана желісі · бөгде жүк'), co: '', url: '', ab: 'PH', col: 1, logo: 'pharmchain.svg', cc: 'KZ', grp: 3 },
  };
  /* logo file: bare name = owner-supplied PNG (515 × 380), name with extension = drawn SVG of a fictitious company */
  globalThis.mfrSrc = m => 'assets/manufacturers/' + (MFRS[m].logo.includes('.') ? MFRS[m].logo : MFRS[m].logo + '.png');
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
  /* the West trip (0.3.10 R-106: Astana → Kostanay → Aktobe): lab / IVD goods, a thermo box −20 °C with dry ice, two third-party T- orders */
  const WEST_ORD = [
    ['O-2281', 1, 'ambient', 2, 310, 5.8, 180, 0, 0, 0, 0, 'sarstedt', 'AB-705', T('Наконечники, пробирки', 'Pipettenspitzen, Röhrchen', 'Pipette tips, tubes', 'Ұштықтар, пробиркалар'), 14],
    ['O-2282', 1, 'pharma', 1, 240, 1.6, 140, 0, 0, 0, 0, 'roche', 'RX-1042', T('Реагенты Roche', 'Roche-Reagenzien', 'Roche reagents', 'Roche реагенттері'), 5],
    ['O-2290', 2, 'ambient', 3, 420, 8.9, 175, 0, 0, 0, 0, 'mercator', 'AB-720', T('Перчатки, иглы', 'Handschuhe, Nadeln', 'Gloves, needles', 'Қолғаптар, инелер'), 16],
    ['O-2291', 2, 'pharma', 1, 260, 1.5, 120, 0, 0, 0, 0, 'biorad', 'RX-2105', T('Калибраторы, контроли', 'Kalibratoren, Kontrollen', 'Calibrators, controls', 'Калибраторлар, бақылаулар'), 6],
    ['O-2292', 2, 'pharma', 1, 380, 1.4, 130, 0, 1, 0, 0, 'roche', 'RX-3390', T('Промывочные растворы · ДОПОГ (LQ)', 'Spüllösungen · ADR (LQ)', 'Wash solutions · ADR (LQ)', 'Жуу ерітінділері · ДОПОГ (LQ)'), 8],
    ['O-2295', 2, 'frozen', 0, 25, 0.2, 60, 0, 1, 0, 1, 'qiagen', 'DX-2290', T('Термобокс −20 °C, сухой лёд UN 1845', 'Thermobox −20 °C, Trockeneis UN 1845', 'Thermo box −20 °C, dry ice UN 1845', 'Термобокс −20 °C, құрғақ мұз UN 1845'), 1],
    ['O-2297', 2, 'ambient', 2, 280, 6.1, 120, 1, 0, 0, 0, 'sysmex', 'AB-700', T('Расходники Sysmex', 'Sysmex-Verbrauchsmaterial', 'Sysmex consumables', 'Sysmex шығын материалдары'), 12],
    ['O-2299', 1, 'ambient', 1, 150, 3, 160, 0, 0, 0, 0, 'sarstedt', 'AB-740', T('Пластик, штативы', 'Kunststoff, Ständer', 'Plastics, racks', 'Пластик, штативтер'), 10],
    ['T-0107', 2, 'ambient', 3, 610, 7.4, 165, 0, 0, 1, 0, 'medsnab', 'TP-0107', T('Сторонний груз · ТОО «МедСнаб Актобе»', 'Fremdfracht · MedSnab Aktobe LLP', 'Third-party cargo · MedSnab Aktobe LLP', 'Бөгде жүк · «МедСнаб Ақтөбе» ЖШС'), 9],
    ['T-0109', 1, 'pharma', 1, 190, 1.2, 120, 0, 0, 1, 0, 'pharmchain', 'TP-0109', T('Сторонний груз · аптечная сеть, 2–8 °C', 'Fremdfracht · Apothekenkette, 2–8 °C', 'Third-party cargo · pharmacy chain, 2–8 °C', 'Бөгде жүк · дәріхана желісі, 2–8 °C'), 4],
  ];
  function westOrders(l) {
    const h = hashOf(l.id);
    return WEST_ORD.map((w, k) => { const [id, stop, cls, pal, kg, m3, hh, stack, adr, third, box, mfr, art, name, perPal] = w;
      const o = { id, to: third ? MFRS[mfr].co || name.split(' · ')[1] : BRANCH(21 + (h + k * 7) % 60), city: WEST.route[stop], stop, cls, pal, kg, m3, h: hh, stack: !!stack, adr: !!adr, third: !!third, box: !!box, mfr, po: (third ? 'CT-' : 'PO-') + (84000 + (h + k * 13) % 9000), pl: 'PL-' + (3100 + (h * 3 + k) % 800),
        lines: [{ art, name, mfr, lot: 'L' + (260000 + (h * 7 + k * 11) % 9999), exp: addDays(l.eta, k === 4 ? 45 : 240 + (h * (k + 1)) % 400), qty: Math.max(1, pal) * perPal }], places: [] };
      for (let p = 0; p < Math.max(pal, 1); p++) o.places.push({ sscc: ssccMake(serial++), order: o.id, load: l.id, idx: p, scans: [] });
      return o; });
  }
  function buildOps(l) {
    const h = hashOf(l.id), n = 2 + h % 3, orders = [];
    const wf = Array.from({ length: n }, (_, k) => 0.6 + ((h * (k + 2)) % 9) / 8);   // weight factor per order so that axle loads differ
    let left = l.pallets, kgLeft = l.kg, wsum = 0;
    for (let k = 0; k < (l.west ? 0 : n); k++) {
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
    if (l.west) { westOrders(l).forEach(o => orders.push(o)); l.pallets = orders.reduce((s, o) => s + o.pal, 0); l.kg = orders.reduce((s, o) => s + o.kg, 0); }
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
  const places = l => ops(l).orders.flatMap(o => o.places);
  const findPlace = sscc => { for (const l of S.loads) { const p = places(l).find(x => x.sscc === sscc); if (p) return { l, p, o: ops(l).orders.find(o => o.id === p.order) }; } return null; };
  globalThis.opsPlaces = places; globalThis.findPlace = findPlace;
  const today = NOW.toISOString().slice(0, 10);
  const daysTo = iso => Math.floor((new Date(iso + 'T23:59:59+05:00') - NOW) / 864e5);

  /* ---------- truck catalogue (0.3.10 screen 03 · trucks.json): classes 3,5 / 6 / 7,5 / 10 / 12,5 t with the variants z1 (one thermo zone +
     thermo-container places), z2 (movable bulkhead, front zone 2–8 °C / rear zone 15–25 °C) and nt (no temperature control), plus the v6
     catalogue (reefer 20 / 12 t, van 10 t, tent 20 t, light van 3,5 t) and the target fleet 10 t (HOWO isothermal with fixed thermo containers,
     JAC). All numbers are APPROXIMATE PLANNING VALUES (EUR pallets 1200×800, single tier), not manufacturer data. ---------- */
  const CM3 = 'm³', CMU = T('см', 'cm', 'cm', 'см');
  const BODY = { ref: T('рефкузов', 'Kühlkoffer', 'reefer body', 'рефкузов'), iso: T('изотерм + термоконтейнеры', 'Isotherm + Thermocontainer', 'isothermal + thermo containers', 'изотерм + термоконтейнерлер'), nt: T('фургон / тент без термоконтроля', 'Koffer / Plane ohne Temperaturführung', 'box / curtain-sider without temperature control', 'термобақылаусыз фургон') };
  const UNIT = { roof: T('агрегат с приводом от двигателя (на крыше)', 'Kälteaggregat mit Motorantrieb (Dach)', 'engine-driven roof unit', 'шатырдағы агрегат'), eng: T('агрегат от двигателя + сетевой резерв', 'Aggregat mit Motorantrieb + Netzbetrieb', 'engine-driven unit + mains standby', 'қозғалтқыш агрегаты + желі резерві'), diesel: T('автономный дизельный агрегат (фронтальный)', 'autarkes Diesel-Kälteaggregat (Stirnwand)', 'self-powered diesel unit (front-mounted)', 'автономды дизель агрегаты'), none: T('без агрегата', 'ohne Aggregat', 'no unit', 'агрегатсыз'), two: T('два испарителя', 'zwei Verdampfer', 'two evaporators', 'екі буландырғыш') };
  const CAT = T('каталог', 'Katalog', 'catalogue', 'каталог'), REF = ['chilled', 'pharma', 'ambient'], REF_F = ['frozen', 'chilled', 'pharma', 'ambient'];
  const TYPES = {
    t35: { id: 't35', name: T('3,5 т', '3,5 t', '3.5 t', '3,5 т'), kind: CAT, cls: T('3,5 т', '3,5 t', '3.5 t', '3,5 т'), palRange: '4', gross: 3500, front: 1800, rear: 2400, axF: 0.6, axR: -0.2, adr: false, rate: 180, fuel: 14, zones: REF, body: BODY.ref + ' ≈ 3,3 m', unit: UNIT.roof,
      z1: { pal: 4, tc: 1, m3: 10, front0: 1500, rear0: 1150, H: 175, tcH: 150 }, z2: { pal: 4, m3: 9.4, front0: 1520, rear0: 1190, split: 2, splitMin: 2, splitMax: 2, step: 2, H: 175 }, nt: { pal: 4, m3: 13, front0: 1300, rear0: 950, H: 185, rate: 140 } },
    t6: { id: 't6', name: T('6 т', '6 t', '6 t', '6 т'), kind: CAT, cls: T('6 т', '6 t', '6 t', '6 т'), palRange: '6–7', gross: 6000, front: 2700, rear: 4300, axF: 0.7, axR: -0.25, adr: true, rate: 240, fuel: 17, zones: REF, body: BODY.ref + ' ≈ 4,4 m', unit: UNIT.eng,
      z1: { pal: 7, tc: 2, m3: 19, front0: 2150, rear0: 1750, H: 200, tcH: 150 }, z2: { pal: 6, m3: 18, front0: 2170, rear0: 1800, split: 2, splitMin: 2, splitMax: 4, step: 2, H: 200 }, nt: { pal: 7, m3: 22, front0: 1950, rear0: 1550, H: 210, rate: 190 } },
    t75: { id: 't75', name: T('7,5 т', '7,5 t', '7.5 t', '7,5 т'), kind: CAT, cls: T('7,5 т', '7,5 t', '7.5 t', '7,5 т'), palRange: '8–10', gross: 7500, front: 3300, rear: 5600, axF: 0.72, axR: -0.3, adr: true, rate: 290, fuel: 20, zones: REF, body: BODY.ref + ' ≈ 6,0 m', unit: UNIT.eng,
      z1: { pal: 10, tc: 2, m3: 27, front0: 2400, rear0: 2300, H: 210, tcH: 150 }, z2: { pal: 9, m3: 25.8, front0: 2430, rear0: 2340, split: 4, splitMin: 2, splitMax: 6, step: 2, H: 210 } },
    t10: { id: 't10', name: T('10 т', '10 t', '10 t', '10 т'), kind: CAT, cls: T('10 т', '10 t', '10 t', '10 т'), palRange: '10', gross: 10000, front: 4100, rear: 7100, axF: 0.72, axR: -0.3, adr: true, rate: 340, fuel: 23, zones: REF, body: BODY.ref + ' ≈ 6,2 m', unit: UNIT.diesel,
      z1: { pal: 10, tc: 3, m3: 30.5, front0: 3000, rear0: 2600, H: 220, tcH: 150 }, z2: { pal: 9, m3: 29.2, front0: 3030, rear0: 2650, split: 4, splitMin: 2, splitMax: 6, step: 2, H: 220 } },
    t125: { id: 't125', name: T('12,5 т', '12,5 t', '12.5 t', '12,5 т'), kind: CAT, cls: T('12,5 т', '12,5 t', '12.5 t', '12,5 т'), palRange: '14–16', gross: 12500, front: 4800, rear: 8400, axF: 0.74, axR: -0.3, adr: true, rate: 390, fuel: 26, zones: REF, body: BODY.ref + ' ≈ 6,6 m', unit: UNIT.diesel,
      z1: { pal: 16, tc: 4, m3: 37.5, front0: 3600, rear0: 3100, H: 230, tcH: 150 }, z2: { pal: 15, m3: 35.8, front0: 3640, rear0: 3150, split: 6, splitMin: 4, splitMax: 10, step: 2, H: 230 } },
    /* v6 catalogue (kept for the fleet mapping and the other W1 tabs) */
    r20: { id: 'r20', rearN: 3, frontN: 2, name: 'Reefer 20 t', kind: T('полуприцеп', 'Sattelzug', 'semitrailer', 'жартылай тіркеме'), pal: 33, kg: 20000, m3: 86, H: 265, tc: 6, tcH: 200, front: 12000, rear: 24000, gross: 40000, tare: 15000, rate: 420, fuel: 32, adr: true, zones: REF_F, body: BODY.ref + ' 13,6 m', unit: 'Thermo King SLXi',
      z2: { pal: 32, m3: 84, split: 12, splitMin: 4, splitMax: 24, step: 2 } },
    r12: { id: 'r12', rearN: 2, name: 'Reefer 12 t', kind: T('одиночный', 'Motorwagen', 'rigid', 'жеке'), pal: 20, kg: 10000, m3: 50, H: 240, tc: 4, tcH: 180, front: 7500, rear: 12000, gross: 18000, tare: 7800, rate: 300, fuel: 24, adr: true, zones: REF_F, body: BODY.ref + ' 8,2 m', unit: 'Carrier Supra 850',
      z2: { pal: 19, m3: 48.5, split: 6, splitMin: 2, splitMax: 12, step: 2 } },
    v10: { id: 'v10', name: 'Van 10 t', kind: T('одиночный', 'Motorwagen', 'rigid', 'жеке'), pal: 14, kg: 5500, m3: 36, H: 230, tc: 3, tcH: 150, front: 3800, rear: 6800, gross: 10000, tare: 4500, rate: 220, fuel: 18, adr: false, zones: REF, body: BODY.ref + ' 6,2 m', unit: 'Carrier Xarios 350',
      z2: { pal: 13, m3: 35, split: 4, splitMin: 2, splitMax: 8, step: 2 } },
    t20: { id: 't20', rearN: 3, frontN: 2, name: 'Tent 20 t', kind: T('полуприцеп', 'Sattelzug', 'semitrailer', 'жартылай тіркеме'), pal: 33, kg: 22000, m3: 90, H: 270, front: 12000, rear: 24500, gross: 40000, tare: 14000, rate: 330, fuel: 30, adr: false, thermo: false, zones: ['ambient'], body: BODY.nt + ' 13,6 m', unit: '—' },
    v35: { id: 'v35', name: T('Фургон 3,5 т', 'Kastenwagen 3,5 t', 'Van 3.5 t', 'Фургон 3,5 т'), kind: T('малотоннажный', 'Transporter', 'light van', 'шағын тонналық'), pal: 6, kg: 1200, m3: 17, H: 190, tc: 1, tcH: 150, front: 1800, rear: 2400, gross: 3500, tare: 2300, rate: 140, fuel: 11, adr: false, zones: REF, body: BODY.ref + ' 4,2 m', unit: UNIT.roof },
    howo: { id: 'howo', rearN: 2, name: 'HOWO T5G 10 t', kind: T('целевой парк', 'Zielflotte', 'target fleet', 'мақсатты парк'), pal: 16, kg: 10000, m3: 45, H: 240, tc: 4, tcFixed: true, tcH: 150, box: 'amb', front: 6500, rear: 11500, gross: 18000, tare: 8000, rate: 280, fuel: 22, adr: true, zones: REF, body: BODY.iso + ' 45 m³', unit: UNIT.none + ' · ' + BODY.iso },
    jac: { id: 'jac', name: 'JAC N120 10 t', kind: T('целевой парк', 'Zielflotte', 'target fleet', 'мақсатты парк'), pal: 14, kg: 7000, m3: 33.7, H: 220, tc: 4, tcFixed: true, tcH: 150, box: 'amb', front: 4500, rear: 8000, gross: 12000, tare: 5000, rate: 250, fuel: 20, adr: true, zones: REF, body: BODY.iso + ' 33,7 m³', unit: UNIT.none + ' · ' + BODY.iso },
  };
  const CATALOGUE = ['t35', 't6', 't75', 't10', 't125', 'r12', 'r20', 'v10', 't20'];
  const typeOfTruck = t => TYPES[{ 'Reefer 20 t': 'r20', 'Reefer 12 t': 'r12', 'Van 10 t': 'v10', 'Tent 20 t': 't20' }[t.model] || 'r12'];
  const ADR_TRK = { t1: true, t2: true, t3: true, t5: true, t6: true }, ADR_DRV = { d1: '2027-05-31', d3: '2027-05-31', d4: '2027-02-28', d7: '2026-12-31' };   // demo: ADR equipment of fleet trucks, ADR certificates of drivers
  /* demo vehicles of 0.3.10 (fleet screen "+ demo fleet V05–V07", "+ demo 3.5 t V08, V09") */
  const DEMO = [
    { id: 'V05', model: T('Hyundai HD120 · рефрижератор 12,5 т · 2 зоны', 'Hyundai HD120 · Kühlfahrzeug 12,5 t · 2 Zonen', 'Hyundai HD120 · reefer 12.5 t · 2 zones', 'Hyundai HD120 · 12,5 т · 2 аймақ'), set: 'fleetX', hub: 'AST', base: 't125', zones: 2, adr: true, unit: 'Thermo King T-880R · ' + UNIT.two },
    { id: 'V06', model: T('Isuzu NQR · рефрижератор 7,5 т · 2 зоны', 'Isuzu NQR · Kühlfahrzeug 7,5 t · 2 Zonen', 'Isuzu NQR · reefer 7.5 t · 2 zones', 'Isuzu NQR · 7,5 т · 2 аймақ'), set: 'fleetX', hub: 'ALA', base: 't75', zones: 2, adr: true, unit: 'Thermo King V-500 MAX · ' + UNIT.two },
    { id: 'V07', model: T('Isuzu NQR · рефрижератор 7,5 т · одна камера 2–8 °C', 'Isuzu NQR · Kühlfahrzeug 7,5 t · eine Kammer 2–8 °C', 'Isuzu NQR · reefer 7.5 t · one chamber 2–8 °C', 'Isuzu NQR · 7,5 т · бір камера'), set: 'fleetX', hub: 'ALA', base: 't75', zones: 1, tc: 0, box: 'cold', adr: false, unit: 'Carrier Xarios 600' },
    { id: 'V08', model: T('JAC N35 · рефрижератор 3,5 т · 4 пал. · 2–8 °C', 'JAC N35 · Kühlfahrzeug 3,5 t · 4 Pal. · 2–8 °C', 'JAC N35 · reefer 3.5 t · 4 pal. · 2–8 °C', 'JAC N35 · 3,5 т · 2–8 °C'), set: 'v35', hub: 'AST', base: 't35', zones: 1, tc: 0, box: 'cold', adr: false, unit: UNIT.roof },
    { id: 'V09', model: T('ГАЗель NEXT · тент 3,5 т · без термоконтроля', 'GAZelle NEXT · Plane 3,5 t · ohne Temperaturführung', 'GAZelle NEXT · curtain-sider 3.5 t · no temperature control', 'ГАЗель NEXT · 3,5 т · термобақылаусыз'), set: 'v35', hub: 'AST', base: 't35', zones: 0, adr: false, unit: '—' },
  ];
  /* road restrictions (FR-142, planning values of trucks.json — to verify with KazAvtoZhol / the regional akimat) */
  const RESTR = [
    { id: 'RS-001', kind: 'axle', a: 'KOS', b: 'AKB', maxAxle: 6000, maxGross: 15000, start: '04-01', end: '05-15', road: T('весенние ограничения: областная дорога Костанай – Актобе', 'Frühjahrsbeschränkung: Gebietsstraße Kostanay – Aktobe', 'spring limits: regional road Kostanay – Aktobe', 'көктемгі шектеу: Қостанай – Ақтөбе') },
    { id: 'RS-002', kind: 'bridge', a: 'AST', b: 'KOS', maxGross: 32000, road: T('мост через р. Ишим (трасса Астана – Костанай)', 'Brücke über den Ischim (Straße Astana – Kostanay)', 'bridge over the Ishim (road Astana – Kostanay)', 'Есіл өзеніндегі көпір (Астана – Қостанай)') },
    { id: 'RS-003', kind: 'city', city: 'ALA', maxGvw: 12000, from: '22:00', to: '07:00', road: T('Алматы: въезд ТС > 12 т только 22:00–07:00', 'Almaty: Einfahrt Fahrzeuge > 12 t nur 22:00–07:00', 'Almaty: vehicles > 12 t enter only 22:00–07:00', 'Алматы: > 12 т тек 22:00–07:00') },
    { id: 'RS-004', kind: 'city', city: 'AST', maxGvw: 15000, from: '21:00', to: '07:00', start: '2026-06-01', end: '2026-12-31', road: T('Астана: въезд ТС > 15 т только 21:00–07:00 (временно)', 'Astana: Einfahrt Fahrzeuge > 15 t nur 21:00–07:00 (befristet)', 'Astana: vehicles > 15 t enter only 21:00–07:00 (temporary)', 'Астана: > 15 т тек 21:00–07:00') },
  ];
  const restrText = id => { const r = RESTR.find(x => x.id === id); if (!r) return id; const t = r.kind === 'axle' ? T('ось ≤ ', 'Achse ≤ ', 'axle ≤ ', 'ось ≤ ') + r.maxAxle.toLocaleString('ru-RU') + ' ' + KG : r.kind === 'city' ? T('въезд > ', 'Einfahrt > ', 'entry > ', 'кіру > ') + r.maxGvw.toLocaleString('ru-RU') + ' ' + KG + ' ' + r.from + '–' + r.to : T('масса ≤ ', 'Masse ≤ ', 'mass ≤ ', 'масса ≤ ') + r.maxGross.toLocaleString('ru-RU') + ' ' + KG; return id + ' · ' + r.road + ' · ' + t + (r.start ? ' · ' + r.start + ' – ' + r.end : ''); };
  /* route legs of a load: the West trip (Astana → Kostanay → Aktobe → Atyrau cross-dock) has per-leg roads and limits; other loads one leg hub → hub */
  const WEST_ID = 'LD-2026-001856';
  const WEST = { route: [HUBS.AST.city, T('Костанай', 'Kostanay', 'Kostanay', 'Қостанай'), T('Актобе', 'Aktobe', 'Aktobe', 'Ақтөбе'), HUBS.ATY.city], ids: ['AST', 'KOS', 'AKB', 'ATY'],
    legs: [{ to: 1, km: 700, road: T('республиканская трасса Астана – Костанай', 'Republikstraße Astana – Kostanay', 'national road Astana – Kostanay', 'Астана – Қостанай тас жолы'), maxAxle: 10000, maxGross: 40000 },
      { to: 2, km: 640, road: T('областная дорога Костанай – Карабутак – Актобе', 'Gebietsstraße Kostanay – Karabutak – Aktobe', 'regional road Kostanay – Karabutak – Aktobe', 'Қостанай – Қарабұтақ – Ақтөбе жолы'), maxAxle: 8000, maxGross: 25000, spring: { from: '04-01', to: '05-15', maxAxle: 6000, maxGross: 15000 } },
      { to: 3, km: 560, road: T('трасса Актобе – Кандыагаш – Атырау', 'Straße Aktobe – Kandyagash – Atyrau', 'road Aktobe – Kandyagash – Atyrau', 'Ақтөбе – Қандыағаш – Атырау жолы'), maxAxle: 10000, maxGross: 40000 }] };
  S.loads.forEach(l => { if (l.id === WEST_ID && l.from === 'AST' && l.to === 'ATY') l.west = true; });   /* the seeded West trip (a new load may reuse the id counter) */
  const tripDay = l => l.eta.slice(0, 10);
  const inSpring = l => { const md = tripDay(l).slice(5); return md >= '04-01' && md <= '05-15'; };
  function legsOf(l, spring) {
    const base = l.west ? WEST.legs : [{ to: 1, km: dist(l.from, l.to), road: HUBS[l.from].city + ' – ' + HUBS[l.to].city, maxAxle: 11500, maxGross: 40000 }];   /* national roads: 11.5 t per drive axle (planning value) */
    const ids = l.west ? WEST.ids : [l.from, l.to], day = tripDay(l), md = day.slice(5);
    const inWin = r => !r.start || (r.start.length === 5 ? md >= r.start && md <= r.end : day >= r.start && day <= r.end);
    return base.map((g, k) => { const a = ids[k], b = ids[k + 1], rs = RESTR.filter(r => r.kind !== 'city' && ((r.a === a && r.b === b) || (r.a === b && r.b === a)) && inWin(r));
      let maxAxle = g.maxAxle, maxGross = g.maxGross; if (spring && g.spring) { maxAxle = Math.min(maxAxle, g.spring.maxAxle); maxGross = Math.min(maxGross, g.spring.maxGross); }
      rs.forEach(r => { if (r.maxAxle) maxAxle = Math.min(maxAxle, r.maxAxle); if (r.maxGross) maxGross = Math.min(maxGross, r.maxGross); });
      const city = RESTR.filter(r => r.kind === 'city' && r.city === b && inWin(r));
      return Object.assign({}, g, { a, b, maxAxle, maxGross, rs: rs.map(r => r.id).concat(city.map(r => r.id)), stopName: l.west ? WEST.route[g.to] : HUBS[l.to].city }); });
  }
  const routeOf = l => l.west ? WEST.route : [HUBS[l.from].city, HUBS[l.to].city];
  const CM = { diesel: 285, tollKm: 12, drvHour: 2500, retPct: 60, fixKm: 45 };   // full cost model (FR-143): planning values of the "cost parameters" master data
  Object.assign(globalThis, { TYPES, CATALOGUE, typeOfTruck, CM, DEMO, RESTR, restrText, legsOf, routeOf, WEST, WEST_ID, inSpring, ADR_TRK, ADR_DRV });

  /* ---------- vehicle profile: a catalogue type in a variant (1 zone / 2 zones + bulkhead / no temperature control), a fleet truck or a demo vehicle ---------- */
  const TL = { cold: '2–8 °C', amb: '15–25 °C', frz: '−20 °C' };
  const REGOF = o => o.cls === 'ambient' ? 'amb' : 'cold';
  const Z_LABEL = z => z === 0 ? T('без термоконтроля', 'ohne Temperaturführung', 'no temperature control', 'термобақылаусыз') : z === 1 ? T('1 зона', '1 Zone', '1 zone', '1 аймақ') : T('2 зоны', '2 Zonen', '2 zones', '2 аймақ');
  const hasVar = (ty, z) => z === 1 ? ty.thermo !== false : z === 2 ? !!ty.z2 : (!!ty.nt || ty.thermo === false);
  function prof(ty, zones, split, regime, own) {
    if (!ty) return null; if (ty.prof) return ty;
    let z = zones == null ? (ty.thermo === false ? 0 : 1) : zones; if (!hasVar(ty, z)) z = ty.thermo === false ? 0 : 1;
    const base = { pal: ty.pal, m3: ty.m3, H: ty.H, tc: ty.tc || 0, tcFixed: !!ty.tcFixed, tcH: ty.tcH, box: ty.box || null, front0: ty.front0 != null ? ty.front0 : Math.round(ty.tare * 0.3), rear0: ty.rear0 != null ? ty.rear0 : ty.tare - Math.round(ty.tare * 0.3), kg: ty.kg || null, rate: ty.rate };
    const v = Object.assign({}, base, z === 2 ? ty.z2 : z === 0 ? (ty.nt || {}) : (ty.z1 || {}));
    const p = { prof: true, id: ty.id, ty, zones: z, thermo: z !== 0, kind: ty.kind, own: own || null, pal: v.pal, m3: v.m3, H: v.H, tcH: v.tcH || v.H, tc: z === 1 ? (v.tc || 0) : 0, tcFixed: z === 1 && !!v.tcFixed,
      box: z === 0 ? 'amb' : (v.box || (regime && regime !== 'auto' ? regime : null)), split: 0, splitMin: v.splitMin || 0, splitMax: v.splitMax || 0, step: v.step || 2, front0: v.front0, rear0: v.rear0, tare: v.front0 + v.rear0,
      kg: v.kg || (ty.gross - v.front0 - v.rear0), front: ty.front, rear: ty.rear, rearN: ty.rearN || 1, frontN: ty.frontN || 1, gross: ty.gross, rate: Math.round((v.rate || ty.rate) * (z === 2 ? 1.05 : 1)), fuel: ty.fuel, adr: !!ty.adr, cls: z === 0 ? ['ambient'] : ty.zones.slice(), axF: ty.axF != null ? ty.axF : 0.55, axR: ty.axR != null ? ty.axR : 0.15, body: z === 0 && ty.nt ? BODY.nt : ty.body, unit: z === 0 ? '—' : ty.unit, palRange: ty.palRange || String(v.pal) };
    if (z === 2) { const s = split != null ? split : v.split; p.split = Math.min(p.splitMax, Math.max(p.splitMin, p.splitMin + Math.round((s - p.splitMin) / p.step) * p.step)); }
    p.name = own ? own.name : ty.name; p.zl = Z_LABEL(z) + (z === 2 ? T(' · перегородка ', ' · Trennwand ', ' · bulkhead ', ' · қалқа ') + p.split + ' | ' + (p.pal - p.split) : z === 1 && p.box && !p.tcFixed ? ' · ' + TL[p.box] : '');
    p.label = p.name + ' · ' + p.zl;
    return p;
  }
  /* planning profile of a fleet truck: catalogue type of its model, one zone, classes of the truck, ADR of the demo map */
  const truckProf = t => { const ty = typeOfTruck(t), p = prof(Object.assign({}, ty, { adr: !!ADR_TRK[t.id] }), ty.thermo === false ? 0 : 1, null, null, { id: t.id, name: t.plate + ' · ' + t.model, hub: t.hub, truck: t }); p.cls = t.zones.slice(); return p; };
  const demoProf = d => { const b = TYPES[d.base], ty = Object.assign({}, b, { adr: d.adr, unit: d.unit, tc: d.tc != null ? d.tc : b.z1.tc, box: d.box || null }); if (d.tc != null) ty.z1 = Object.assign({}, b.z1, { tc: d.tc }); return prof(ty, d.zones, null, null, { id: d.id, name: d.id + ' · ' + d.model, hub: d.hub, demo: d }); };
  const profFacts = p => [p.body, p.pal + ' ' + T('пал.-мест', 'Palettenplätze', 'pallet places', 'паллет орны') + (p.zones === 1 && p.tc ? T(' (из них термоконтейнеры: ', ' (davon Thermocontainer: ', ' (thermo containers: ', ' (термоконтейнерлер: ') + p.tc + ')' : ''), T('полезная нагрузка ', 'Nutzlast ', 'payload ', 'пайдалы жүктеме ') + p.kg.toLocaleString('ru-RU') + ' ' + KG, String(p.m3).replace('.', ',') + ' ' + CM3, T('полная масса ', 'zGM ', 'GVW ', 'толық масса ') + p.gross.toLocaleString('ru-RU') + ' ' + KG, T('пустая ', 'leer ', 'empty ', 'бос ') + p.front0.toLocaleString('ru-RU') + ' / ' + p.rear0.toLocaleString('ru-RU') + ' ' + KG + T(' (перед. / задн. ось)', ' (VA / HA)', ' (front / rear axle)', ' (алд. / арт. ось)'), T('допуст. ', 'zul. ', 'limits ', 'шек ') + p.front.toLocaleString('ru-RU') + ' / ' + p.rear.toLocaleString('ru-RU') + ' ' + KG, T('внутр. высота ', 'Innenhöhe ', 'internal height ', 'ішкі биіктік ') + p.H + ' ' + CMU + (p.zones === 1 && p.tc ? T(' (термоконтейнер ', ' (Thermocontainer ', ' (thermo container ', ' (термоконтейнер ') + p.tcH + ' ' + CMU + ')' : ''), p.unit, T('ДОПОГ ', 'ADR ', 'ADR ', 'ДОПОГ ') + (p.adr ? T('да', 'ja', 'yes', 'иә') : T('нет', 'nein', 'no', 'жоқ'))].filter(Boolean).join(' · ');
  Object.assign(globalThis, { prof, truckProf, demoProf, profFacts, hasVar, TL, Z_LABEL, REGOF });

  /* ---------- load calculation (FR-99 / FR-140 / FR-142 / FR-146): pallet positions per temperature zone (LIFO by stop, the 2–8 °C group at
     the front wall), thermo boxes −20 °C (dry ice, no pallet place) at the front of the cold group, stacking ×2 under the ceiling, axle loads by
     the lever rule, gross / payload / volume / height, ADR, road limits per leg, centre of gravity and lateral balance; overload always shown with
     the exact excess. `opt`: { cls: classes of the truck, legs, spring, adrDriver, season } (a plain array = classes, legacy). ---------- */
  const season = iso => { const m = +iso.slice(5, 7); return m >= 5 && m <= 9; };
  function loadCalc(orders, ty, opt) {
    if (Array.isArray(opt)) opt = { cls: opt }; opt = opt || {};
    const p = prof(ty), cls = opt.cls || p.cls;
    const sel = orders.filter(o => o.on !== false && !o.handed);
    const withPal = sel.filter(o => o.pal > 0), boxes = sel.filter(o => !(o.pal > 0));
    const pal = withPal.reduce((s, o) => s + o.pal, 0), kg = sel.reduce((s, o) => s + o.kg, 0), m3 = Math.round(sel.reduce((s, o) => s + o.m3, 0) * 10) / 10;
    const coldPal = withPal.filter(o => REGOF(o) === 'cold').reduce((s, o) => s + o.pal, 0), ambPal = pal - coldPal;
    const two = p.zones === 2, mReg = two ? 'amb' : p.box || (ambPal > coldPal ? 'amb' : 'cold'), fReg = mReg === 'amb' ? 'cold' : 'amb';
    const lifo = xs => xs.slice().sort((a, b) => b.stop - a.stop);
    const fList = lifo(withPal.filter(o => REGOF(o) === fReg)), mList = lifo(withPal.filter(o => REGOF(o) === mReg));
    const fH = two ? p.H : p.tcH, mH = p.H, tiersOf = (o, H) => o.stack && o.h * 2 <= H ? 2 : 1;
    const fNeed = fList.reduce((s, o) => s + Math.ceil(o.pal / tiersOf(o, fH)), 0);
    const fCap = two ? p.split : p.tc, tcUsed = p.tcFixed ? p.tc : Math.min(fNeed, p.tc), mStart = two ? p.split : tcUsed, mCap = p.pal - mStart, fDrawn = two || p.tcFixed ? fCap : tcUsed;
    const group = (key, reg, start, cap, drawn, H, list) => { const slots = []; let used = 0, gkg = 0;
      list.forEach(o => { const tiers = tiersOf(o, H), n = Math.ceil(o.pal / tiers); for (let j = 0; j < o.pal; j++) { const k = used + Math.floor(j / tiers); slots.push({ id: o.id, stop: o.stop, kg: o.kg / o.pal, h: o.h, pos: start + k, gpos: k, over: k >= cap, tier: j % tiers + 1, tiers, tall: o.h > H, stack: o.stack, cls: o.cls, key }); } used += n; gkg += o.kg; });
      return { key, reg, start, cap, drawn, H, used, kg: gkg, slots, pal: list.reduce((s, o) => s + o.pal, 0) }; };
    const F = group(two ? 'zone1' : 'tc', fReg, 0, fCap, fDrawn, fH, fList), M = group(two ? 'zone2' : 'main', mReg, mStart, mCap, mCap, mH, mList);
    const slots = F.slots.concat(M.slots), posUsed = F.used + M.used, cold = fReg === 'cold' ? F : M;
    /* axle loads: share of a pallet on the front axle, axF at the front wall → axR at the rear door (lever rule); boxes at the start of the cold group */
    const share = i => p.axF + (p.axR - p.axF) * ((i + 0.5) / p.pal);
    const axles = on => { let front = p.front0, rear = p.rear0, w = 0; const add = (x, i) => { const s = share(i); front += x * s; rear += x * (1 - s); w += x; };
      [F, M].forEach(g => { const last = g.cap > 0 ? g.start + g.cap - 1 : g.start; g.slots.forEach(s => { if (on(s)) add(s.kg, Math.min(s.pos, Math.max(last, g.start))); }); });
      boxes.forEach(o => { if (on(o)) add(o.kg, cold.start); }); return { front: Math.round(front), rear: Math.round(rear), gross: Math.round(p.front0 + p.rear0 + w) }; };
    const ax = axles(() => true), front = ax.front, rear = ax.rear, gross = ax.gross;
    const tallest = slots.reduce((m, s) => (s.tall && !m.tall) || (s.tall === m.tall && s.h > m.h) ? { h: s.h, id: s.id, H: s.key === F.key ? fH : mH, tall: s.tall } : m, { h: 0, id: null, H: p.H, tall: false });
    const issues = [], ex = (v, m) => Math.round((v - m) * 10) / 10;
    const PL = T(' пал.-мест', ' Palettenplätze', ' pallet places', ' паллет орны');
    const zoneName = (g) => g.key === 'zone1' ? T('зона 1 · ', 'Zone 1 · ', 'zone 1 · ', '1-аймақ · ') + TL.cold : g.key === 'zone2' ? T('зона 2 · ', 'Zone 2 · ', 'zone 2 · ', '2-аймақ · ') + TL.amb : g.key === 'tc' ? T('термоконтейнеры ', 'Thermocontainer ', 'thermo containers ', 'термоконтейнерлер ') + TL[g.reg] : T('зона ', 'Zone ', 'zone ', 'аймақ ') + TL[g.reg];
    if (two) {
      if (F.used > F.cap) issues.push({ code: 'zone', zone: 'zone1', sev: 3, text: T('Зона 1 (2–8 °C) перегружена: ', 'Zone 1 (2–8 °C) überladen: ', 'Zone 1 (2–8 °C) overloaded: ', '1-аймақ (2–8 °C) толып кетті: ') + F.used + ' / ' + F.cap + PL + ' (+' + (F.used - F.cap) + ')' + T(' — сдвинуть перегородку назад, выбрать больший тип ТС или перенести заказ.', ' — Trennwand nach hinten versetzen, größeren Fahrzeugtyp wählen oder Auftrag verschieben.', ' — move the bulkhead back, choose a larger vehicle type or postpone the order.', ' — қалқаны артқа жылжытыңыз.') });
      if (M.used > M.cap) issues.push({ code: 'zone', zone: 'zone2', sev: 3, text: T('Зона 2 (15–25 °C) перегружена: ', 'Zone 2 (15–25 °C) überladen: ', 'Zone 2 (15–25 °C) overloaded: ', '2-аймақ (15–25 °C) толып кетті: ') + M.used + ' / ' + M.cap + PL + ' (+' + (M.used - M.cap) + ')' + T(' — сдвинуть перегородку вперёд, выбрать больший тип ТС или перенести заказ.', ' — Trennwand nach vorn versetzen, größeren Fahrzeugtyp wählen oder Auftrag verschieben.', ' — move the bulkhead forward, choose a larger vehicle type or postpone the order.', ' — қалқаны алға жылжытыңыз.') });
    } else {
      if (M.used > M.cap) issues.push({ code: 'zone', zone: 'main', sev: 3, text: T('Зона ', 'Zone ', 'Zone ', 'Аймақ ') + TL[mReg] + T(' перегружена: ', ' überladen: ', ' overloaded: ', ' толып кетті: ') + M.used + ' / ' + M.cap + PL + ' (+' + (M.used - M.cap) + ')' + T(' — перенести заказ на следующий цикл или передать партнёру.', ' — Auftrag in den nächsten Zyklus verschieben oder an Partner übergeben.', ' — move the order to the next cycle or hand it to a partner.', ' — келесі циклге ауыстырыңыз.') });
      if (F.used > F.cap && p.thermo) issues.push(p.tcFixed ? { code: 'tc', sev: 3, text: T('Термоконтейнеры ', 'Thermocontainer ', 'Thermo containers ', 'Термоконтейнерлер ') + TL[fReg] + ': ' + F.used + ' / ' + F.cap + PL + ' (+' + (F.used - F.cap) + ')' + T(' — добавить контейнер или перенести.', ' — Container ergänzen oder verschieben.', ' — add a container or postpone.', ' — контейнер қосыңыз.') }
        : { code: 'mixed', sev: 3, text: T('Смешанные режимы: кузов одной зоны ', 'Gemischte Temperaturbereiche: Einzonen-Aufbau ', 'Mixed regimes: one-zone body ', 'Аралас режимдер: бір аймақты шанақ ') + TL[mReg] + T(', груз ', ', Ware ', ', ', ', жүк ') + TL[fReg] + ' — ' + F.pal + T(' пал., мест в термоконтейнерах ', ' Pal., Thermocontainer-Plätze ', ' pal., thermo-container places ', ' пал., термоконтейнер орны ') + F.cap + T(' — выбрать тип ТС с 2 зонами или перенести заказ.', ' — Fahrzeugtyp mit 2 Zonen wählen oder Auftrag verschieben.', ' — choose a 2-zone vehicle type or postpone the order.', ' — 2 аймақты КҚ таңдаңыз.') });
    }
    if (posUsed > p.pal) issues.push({ code: 'pal', sev: 3, text: T('Паллето-места: +', 'Palettenplätze: +', 'Pallet places: +', 'Паллет орындары: +') + (posUsed - p.pal) + ' (' + posUsed + ' / ' + p.pal + ')' });
    if (!p.thermo) {
      const ids = sel.filter(o => o.cls !== 'ambient').map(o => o.id);
      if (ids.length) issues.push({ code: 'thermo', sev: 3, text: T('Без термоконтроля: ', 'Ohne Temperaturführung: ', 'No temperature control: ', 'Термобақылаусыз: ') + ids.join(', ') + ' (' + TL.cold + ' / ' + TL.frz + ')' + T(' не перевозится — нужен рефрижератор (GDP).', ' darf nicht transportiert werden — Kühlfahrzeug nötig (GDP).', ' must not be carried — a reefer is required (GDP).', ' — рефрижератор қажет.') });
      const amb = sel.filter(o => o.cls === 'ambient');
      if (amb.length && !(opt.season != null ? opt.season : false)) issues.push({ code: 'season', sev: 3, text: T('Товар 15–25 °C без термоконтроля — только в тёплый сезон (05–09); нужен кузов с термоконтролем.', 'Ware 15–25 °C ohne Temperaturführung — nur in der warmen Saison (05–09); Aufbau mit Temperaturführung nötig.', '15–25 °C goods without temperature control — warm season only (05–09); a temperature-controlled body is required.', '15–25 °C тауар термобақылаусыз — тек жылы маусымда (05–09).') });
    }
    const badCls = sel.filter(o => o.pal > 0 && !cls.includes(o.cls) && !(o.cls === 'ambient' && p.thermo && p.ty.thermo !== false)).map(o => o.id);   // a temperature-controlled body keeps 15–25 °C too
    if (badCls.length && p.thermo) issues.push({ code: 'cls', sev: 3, text: T('Температурный класс не поддерживается: ', 'Temperaturklasse nicht unterstützt: ', 'Temperature class not supported: ', 'Температура класы қолдау таппайды: ') + badCls.join(', ') });
    const lim = (code, v, m, label, u) => { if (v > m) issues.push({ code, sev: 3, text: label + ': +' + ex(v, m) + ' ' + u + ' (' + v + ' / ' + m + ')' }); else if (v > m * 0.92) issues.push({ code, sev: 2, text: label + ' ' + Math.round(v / m * 100) + ' %' + T(' — резерва почти нет.', ' — kaum Reserve.', ' — almost no reserve.', ' — резерв жоқ.') }); };
    lim('kg', kg, p.kg, T('Масса груза', 'Ladungsmasse', 'Payload', 'Жүк массасы'), KG); lim('m3', m3, p.m3, T('Объём', 'Volumen', 'Volume', 'Көлем'), CM3);
    lim('front', front, p.front, T('Передняя ось', 'Vorderachse', 'Front axle', 'Алдыңғы ось'), KG); lim('rear', rear, p.rear, T('Задняя ось', 'Hinterachse', 'Rear axle', 'Артқы ось'), KG); lim('gross', gross, p.gross, T('Полная масса', 'Gesamtmasse', 'Gross weight', 'Толық масса'), KG);
    const seenH = {}; slots.forEach(s => { if (s.tall && !seenH[s.id]) { seenH[s.id] = 1; const H = s.key === F.key ? fH : mH; issues.push({ code: 'h', sev: 3, text: T('Высота груза: ', 'Ladehöhe: ', 'Height of goods: ', 'Жүк биіктігі: ') + s.id + ' — ' + s.h + ' > ' + H + ' ' + CMU + ' (+' + (s.h - H) + ')' + T(' — выбрать ТС с большей высотой кузова или перепаковать.', ' — Fahrzeug mit höherem Aufbau wählen oder umpacken.', ' — choose a vehicle with a higher body or repack.', ' — биік шанақ таңдаңыз.') }); } });
    const adr = sel.some(o => o.adr);
    if (adr && !p.adr) issues.push({ code: 'adr', sev: 3, text: T('ДОПОГ: выбранный тип ТС без оснащения ДОПОГ — опасный груз (LQ, UN 1845) не грузить или выбрать другой тип.', 'ADR: gewählter Fahrzeugtyp ohne ADR-Ausrüstung — Gefahrgut (LQ, UN 1845) nicht laden oder anderen Typ wählen.', 'ADR: the selected vehicle type has no ADR equipment — do not load the dangerous goods (LQ, UN 1845) or choose another type.', 'ДОПОГ: КҚ жабдықталмаған — қауіпті жүкті тиемеңіз.') });
    else if (adr && opt.adrDriver === false) issues.push({ code: 'adrDriver', sev: 3, text: T('ДОПОГ: машина допущена, у водителя нет свидетельства ДОПОГ.', 'ADR: Fahrzeug zugelassen, Fahrer ohne ADR-Bescheinigung.', 'ADR: vehicle approved, driver without ADR certificate.', 'ДОПОГ: жүргізушіде куәлік жоқ.') });
    else if (adr && opt.adrDriver) issues.push({ code: 'adrOk', sev: 0, text: T('ДОПОГ: машина допущена, водитель ', 'ADR: Fahrzeug zugelassen, Fahrer ', 'ADR: vehicle approved, driver ', 'ДОПОГ: КҚ рұқсат етілген, жүргізуші ') + opt.adrDriver.name + T(' — свидетельство до ', ' — Bescheinigung bis ', ' — certificate until ', ' — куәлік ') + fd(opt.adrDriver.to) + '.' });
    /* road limits per leg: after each stop the unloaded orders leave the vehicle (LIFO positions stay) */
    const legs = (opt.legs || []).map((g, k) => { const a = axles(s => s.stop >= g.to), mx = Math.round(Math.max(a.front / p.frontN, a.rear / p.rearN));   /* per axle: a tandem / tridem group shares the rear load */ const r = Object.assign({ leg: k }, g, a);
      if (g.maxAxle && mx > g.maxAxle) issues.push({ code: 'legAxle', sev: 3, text: T('Нагрузка на ось +', 'Achslast +', 'Axle load +', 'Ось жүктемесі +') + (mx - g.maxAxle).toLocaleString('ru-RU') + ' ' + KG + ' · ' + g.road + ' (≤ ' + g.maxAxle.toLocaleString('ru-RU') + ' ' + KG + ')' });
      if (g.maxGross && a.gross > g.maxGross) issues.push({ code: 'legGross', sev: 3, text: T('Полная масса +', 'Gesamtmasse +', 'Gross weight +', 'Толық масса +') + (a.gross - g.maxGross).toLocaleString('ru-RU') + ' ' + KG + ' · ' + g.road + ' (≤ ' + g.maxGross.toLocaleString('ru-RU') + ' ' + KG + ')' }); return r; });
    /* centre of gravity (FR-140): x from the front wall, height, front-axle share, left / right by position parity (odd left, even right) */
    let left = 0, right = 0, mx = 0, mz = 0, w = 0;
    slots.forEach(s => { if (s.pos % 2 === 0) left += s.kg; else right += s.kg; mx += s.kg * ((s.pos + 0.5) / p.pal); mz += s.kg * (s.tiers === 2 ? s.h : s.h / 2); w += s.kg; });
    boxes.forEach(o => { left += o.kg / 2; right += o.kg / 2; mx += o.kg * ((cold.start + 0.5) / p.pal); mz += o.kg * (o.h / 2); w += o.kg; });
    const lat = right - left, latMax = Math.round(p.kg * 0.1), cogX = w ? mx / w : null, cogZ = w ? mz / w : null, frontPct = gross ? front / gross : null;
    if (w && Math.abs(lat) > latMax) issues.push({ code: 'lat', sev: 2, text: T('Поперечный дисбаланс: ', 'Seitliche Unwucht: ', 'Lateral imbalance: ', 'Көлденең теңгерімсіздік: ') + (lat > 0 ? T('справа', 'rechts', 'right side', 'оң жақ') : T('слева', 'links', 'left side', 'сол жақ')) + T(' тяжелее на ', ' schwerer um ', ' heavier by ', ' ауырырақ: ') + Math.round(Math.abs(lat)) + ' ' + KG + ' (' + T('допуск ', 'Toleranz ', 'tolerance ', 'шек ') + latMax + ' ' + KG + ')' + T(' — переставить паллеты по сторонам.', ' — Paletten seitlich umsetzen.', ' — swap pallets between the sides.', ' — паллеттерді ауыстырыңыз.') });
    if (w && frontPct != null && frontPct < 0.2) issues.push({ code: 'cog', sev: 2, text: T('Центр тяжести слишком далеко назад: передняя (управляемая) ось несёт ', 'Schwerpunkt zu weit hinten: Vorderachse (Lenkachse) trägt ', 'Centre of gravity too far back: the front (steering) axle carries ', 'Ауырлық орталығы тым артта: алдыңғы ось ') + Math.round(frontPct * 100) + ' %' + T(' массы (мин. 20 %) — тяжёлые места к передней стенке.', ' der Masse (min. 20 %) — schwere Packstücke zur Stirnwand.', ' of the mass (min. 20 %) — move heavy packages to the front wall.', ' (мин. 20 %).') });
    const third = sel.filter(o => o.third), thirdPal = third.reduce((s, o) => s + o.pal, 0);
    if (third.length) issues.push({ code: 'third', sev: 1, text: T('Сторонний груз: ', 'Fremdfracht: ', 'Third-party cargo: ', 'Бөгде жүк: ') + third.length + T(' заказ(а), ', ' Auftrag/Aufträge, ', ' order(s), ', ' тапсырыс, ') + thirdPal + T(' пал. — отдельный договор перевозки, ТТН и ЭСФ на услугу; не смешивать паллеты с товаром KDL.', ' Pal. — eigener Beförderungsvertrag, TTN und ESF für die Leistung; Paletten nicht mit KDL-Ware mischen.', ' pal. — separate carriage contract, TTN and ESF for the service; do not mix pallets with KDL goods.', ' пал. — жеке шарт, ТТН және ЭШФ.') });
    if (boxes.length) issues.push({ code: 'box', sev: 1, text: T('Груз −20 °C: отдельный термобокс с сухим льдом (UN 1845), маркировка по ДОПОГ — ', 'Ware −20 °C: separate Thermobox mit Trockeneis (UN 1845), Kennzeichnung nach ADR — ', '−20 °C goods: separate thermo box with dry ice (UN 1845), ADR labelling — ', '−20 °C жүк: құрғақ мұзды термобокс (UN 1845), ДОПОГ таңбалауы — ') + boxes.map(o => o.id).join(', ') });
    const bars = [];
    const bar = (key, label, val, max, u) => bars.push({ key, label, val, max, u, pct: max ? Math.round(val / max * 100) : (val > 0 ? 200 : 0), over: val > max, ex: val > max ? ex(val, max) : 0 });
    if (two) { bar('zone1', T('Зона 1 · 2–8 °C · пал.-места', 'Zone 1 · 2–8 °C · Palettenplätze', 'Zone 1 · 2–8 °C · pallet places', '1-аймақ · 2–8 °C'), F.used, F.cap, ''); bar('zone2', T('Зона 2 · 15–25 °C · пал.-места', 'Zone 2 · 15–25 °C · Palettenplätze', 'Zone 2 · 15–25 °C · pallet places', '2-аймақ · 15–25 °C'), M.used, M.cap, ''); }
    else { if (p.thermo && (F.cap > 0 || F.used > 0)) bar('tc', T('Термоконтейнеры ', 'Thermocontainer ', 'Thermo containers ', 'Термоконтейнерлер ') + TL[fReg] + T(', пал.-места', ', Palettenplätze', ', pallet places', ', орын'), F.used, F.cap, ''); bar('main', T('Паллеты ', 'Paletten ', 'Pallets ', 'Паллеттер ') + (p.thermo ? TL[mReg] : T('без термоконтроля', 'ohne Temperaturführung', 'no temperature control', 'термобақылаусыз')), M.used, M.cap, ''); }
    bar('pal', T('Паллето-места', 'Palettenplätze', 'Pallet places', 'Паллет орындары'), posUsed, p.pal, ''); bar('kg', T('Масса груза', 'Ladungsmasse', 'Payload', 'Жүк массасы'), kg, p.kg, KG); bar('m3', T('Объём', 'Volumen', 'Volume', 'Көлем'), m3, p.m3, CM3);
    bar('front', T('Передняя ось', 'Vorderachse', 'Front axle', 'Алдыңғы ось'), front, p.front, KG); bar('rear', T('Задняя ось', 'Hinterachse', 'Rear axle', 'Артқы ось'), rear, p.rear, KG); bar('gross', T('Полная масса', 'Gesamtmasse', 'Gross weight', 'Толық масса'), gross, p.gross, KG);
    bar('h', T('Высота груза (самая высокая паллета)', 'Ladehöhe (höchste Palette)', 'Height of goods (tallest pallet)', 'Жүк биіктігі'), tallest.h, tallest.H, CMU);
    const vp = p.m3 ? m3 / p.m3 : 0, wp = p.kg ? kg / p.kg : 0;
    const insight = (vp > wp ? T('Ограничивающий фактор — объём и паллетоместа: объём ', 'Begrenzender Faktor — Volumen und Palettenplätze: Volumen ', 'Limiting factor — volume and pallet places: volume ', 'Шектеуші фактор — көлем: көлем ') : T('Ограничивающий фактор — вес: объём ', 'Begrenzender Faktor — Gewicht: Volumen ', 'Limiting factor — weight: volume ', 'Шектеуші фактор — салмақ: көлем ')) + Math.round(vp * 100) + ' %, ' + T('вес ', 'Gewicht ', 'weight ', 'салмақ ') + Math.round(wp * 100) + ' %. ' + T('Лёгкий объёмный товар — планировать по паллетам и м³, не только по массе.', 'Leichte, voluminöse Ware — nach Paletten und m³ planen, nicht nur nach Masse.', 'Light, bulky goods — plan by pallets and m³, not only by weight.', 'Жеңіл көлемді тауар — паллет пен м³ бойынша жоспарлаңыз.');
    const rows = Math.max(Math.ceil(p.pal / 2), ...slots.map(s => Math.floor(s.pos / 2) + 1), 1);
    const util = p.pal ? Math.round(Math.max(posUsed / p.pal, kg / p.kg, m3 / p.m3) * 100) : 0;
    return { p, pal, posUsed, kg, m3, front, rear, gross, tallest, slots, rows, bars, issues, fits: !issues.some(i => i.sev === 3), util, cogX, cogZ, lat, left, right, latMax, frontPct, groups: { front: F, main: M }, boxes, two, fReg, mReg, zones: badCls, legs, adr, third, thirdPal, insight, sel };
  }
  /* two zones: the first bulkhead position (front → rear) at which everything fits, else the default one */
  function bestSplit(ty, orders, opt, zones) { const p0 = prof(ty, zones); if (p0.zones !== 2) return loadCalc(orders, p0, opt);
    for (let s = p0.splitMin; s <= p0.splitMax; s += p0.step) { const r = loadCalc(orders, prof(ty, 2, s), opt); if (r.fits) return r; } return loadCalc(orders, p0, opt); }
  /* full trip cost (FR-143): fuel + tolls + driver hours + empty return + depreciation; "rate" cost = ₸/km × km */
  function tripCost(ty, km, extraKm) {
    const kmAll = km + (extraKm || 0), hours = Math.round(kmAll / 65 * 10) / 10;
    const fuel = Math.round(kmAll * ty.fuel / 100 * CM.diesel), toll = Math.round(kmAll * CM.tollKm), driver = Math.round(hours * CM.drvHour);
    const empty = Math.round(km * CM.retPct / 100), emptyCost = Math.round(empty * ty.fuel / 100 * CM.diesel), fixed = Math.round((kmAll + empty) * CM.fixKm);
    return { rate: ty.rate * km, fuel, toll, driver, hours, empty, emptyCost, fixed, total: fuel + toll + driver + emptyCost + fixed };
  }
  const calcOpt = l => { const d = l.driver ? drv(l.driver) : null, sp = inSpring(l) || !!S.ops.spring; return { legs: legsOf(l, sp), spring: sp, season: season(l.eta), adrDriver: d && d.id ? (ADR_DRV[d.id] ? { name: d.name, to: ADR_DRV[d.id] } : false) : null }; };
  const km_ = l => legsOf(l).reduce((s, g) => s + g.km, 0);
  /* truck finder: every catalogue type in its variants + every fleet truck (+ demo vehicles), feasibility first, then cheaper (rate or full cost), ties by utilisation */
  function finder(l, byTotal, opt) {
    opt = opt || {}; const o = ops(l), km = km_(l), rows = [], co = calcOpt(l);
    const cand = [];
    CATALOGUE.concat(opt.target ? ['howo', 'jac'] : [], opt.v35 ? ['v35'] : []).forEach(id => { const t = TYPES[id]; [1, 2, 0].forEach(z => { if (hasVar(t, z) && (z !== 0 || t.nt || t.thermo === false)) cand.push({ key: 'c:' + id + ':' + z, ty: t, z, name: t.name, kind: CAT, fleet: null }); }); });
    S.trucks.forEach(t => cand.push({ key: 'f:' + t.id, p: truckProf(t), name: t.plate + ' · ' + t.model, kind: T('парк', 'Flotte', 'fleet', 'парк'), fleet: t }));
    DEMO.filter(d => (d.set === 'fleetX' && opt.fleetX) || (d.set === 'v35' && opt.v35)).forEach(d => cand.push({ key: 'd:' + d.id, p: demoProf(d), name: d.id + ' · ' + d.model, kind: T('демо', 'Demo', 'demo', 'демо'), demo: d }));
    cand.forEach(c => {
      const r = c.p ? loadCalc(o.orders, c.p, Object.assign({ cls: c.fleet ? c.fleet.zones : c.p.cls }, co)) : bestSplit(c.ty, o.orders, co, c.z), issues = r.issues.filter(i => i.sev >= 2);
      let extra = 0; const hub = c.fleet ? c.fleet.hub : c.demo ? c.demo.hub : null;
      if (c.fleet) {
        if (c.fleet.status === 'service') issues.push({ code: 'workshop', sev: 3, text: T('в сервисе', 'in der Werkstatt', 'in the workshop', 'сервисте') });
        else if (c.fleet.status === 'busy' && loadOfTruck(c.fleet.id) && loadOfTruck(c.fleet.id).id !== l.id) issues.push({ code: 'busy', sev: 3, text: T('занята рейсом ', 'im Einsatz auf Tour ', 'assigned to trip ', 'рейсте: ') + loadOfTruck(c.fleet.id).id });
        if (l.zone === 'pharma' && docState(c.fleet.docs.calib) === 'expired') issues.push({ code: 'calib', sev: 3, text: T('поверка датчиков просрочена', 'Kalibrierung abgelaufen', 'sensor calibration expired', 'датчик поверкасы өтті') });
      }
      if (hub && hub !== l.from) { extra = dist(hub, l.from); issues.push({ code: 'hub', sev: 1, text: T('другой хаб: ', 'anderer Hub: ', 'other hub: ', 'басқа хаб: ') + HUBS[hub].city + ' · ' + T('перегон ', 'Leerfahrt ', 'empty run ', 'бос жүріс ') + extra + ' ' + T('км', 'km', 'km', 'км') }); }
      const cost = tripCost(r.p, km, extra), fits = !issues.some(i => i.sev === 3);
      const F = r.groups.front, M = r.groups.main, zones = (F.cap > 0 || F.used > 0 ? [F] : []).concat([M]).map(g => ({ label: TL[g.reg] + (g.key === 'tc' ? T(' · термоконт.', ' · Thermocont.', ' · thermo cont.', ' · термоконт.') : ''), used: g.used, cap: g.cap, over: g.used > g.cap }));
      rows.push(Object.assign(c, { ty: r.p, r, issues, cost, fits, util: r.util, perPal: r.pal ? Math.round((byTotal ? cost.total : cost.rate) / r.pal) : 0, zones, boxes: r.boxes.length, adr: r.adr ? (r.p.adr ? T('ДОПОГ ✓', 'ADR ✓', 'ADR ✓', 'ДОПОГ ✓') : T('ДОПОГ ✗', 'ADR ✗', 'ADR ✗', 'ДОПОГ ✗')) : '—', route: km + ' ' + T('км', 'km', 'km', 'км') + (r.issues.some(i => i.code === 'legAxle' || i.code === 'legGross') ? T(' · ограничение ✗', ' · Beschränkung ✗', ' · limit ✗', ' · шектеу ✗') : T(' · дороги ✓', ' · Straßen ✓', ' · roads ✓', ' · жолдар ✓')), hub }));
    });
    rows.sort((a, b) => (b.fits - a.fits) || ((byTotal ? a.cost.total : a.cost.rate) - (byTotal ? b.cost.total : b.cost.rate)) || (b.util - a.util));
    rows.forEach((r, i) => { r.rank = i + 1; });
    const best = rows.find(r => r.fits) || null;
    /* partner offers (FR-143): logistics partners with cold / GDP capability quote per pallet */
    const palRate = { gold: 32, silver: 27, bronze: 24 }, r0 = loadCalc(o.orders, TYPES.r20);
    const partners = (S.partners || []).filter(p => p.type === 'lp' && p.tier !== 'blocked').map(p => { const okCold = l.zone === 'ambient' || p.cold, okGdp = l.zone !== 'pharma' || p.gdp, okAdr = !r0.adr || p.adr, fits = okCold && okGdp && okAdr && +p.cap >= r0.pal;
      return { id: p.id, name: p.name, rate: palRate[p.tier] || 24, pal: r0.pal, cost: (palRate[p.tier] || 24) * km * r0.pal, fits, why: !okCold ? T('нет рефрижераторов', 'keine Kühlfahrzeuge', 'no reefers', 'рефрижератор жоқ') : !okGdp ? T('нет допуска GDP', 'keine GDP-Zulassung', 'no GDP approval', 'GDP рұқсаты жоқ') : !okAdr ? T('партнёр без ДОПОГ', 'Partner ohne ADR', 'partner without ADR', 'серіктесте ДОПОГ жоқ') : +p.cap < r0.pal ? T('недостаточно мест', 'zu wenig Kapazität', 'not enough capacity', 'сыйымдылық жеткіліксіз') : '' }; }).sort((a, b) => (b.fits - a.fits) || (a.cost - b.cost));
    const restr = [...new Set(co.legs.flatMap(g => g.rs))];
    return { rows, best, partners, bestPartner: partners.find(p => p.fits) || null, km, legs: co.legs, day: tripDay(l), spring: co.spring, springDate: inSpring(l), restr: restr.map(restrText), route: routeOf(l) };
  }
  /* vehicle match (0.3.10 screen 03): every catalogue type × (1 zone / 2 zones with the best bulkhead) + own vehicles; recommendation = smallest fitting catalogue type */
  function vehMatch(l) {
    const o = ops(l), co = calcOpt(l), rows = [];
    CATALOGUE.filter(id => TYPES[id].thermo !== false).sort((a, b) => TYPES[a].gross - TYPES[b].gross).forEach(id => [1, 2].forEach(z => { if (hasVar(TYPES[id], z)) { const r = bestSplit(TYPES[id], o.orders, co, z); rows.push({ key: id + ':' + z, id, z, p: r.p, r, own: null, fits: r.fits }); } }));
    const cat = rows.slice(), rec = cat.find(x => x.fits) || null;
    const own = S.trucks.map(t => { const p = truckProf(t), r = loadCalc(o.orders, p, Object.assign({ cls: t.zones }, co)); return { key: 'f:' + t.id, id: t.id, z: p.zones, p, r, own: t, fits: r.fits }; });
    const why = x => x.fits ? (x.own ? HUBS[x.own.hub].city + ' · ' + ST_T(x.own) : T('подходит', 'passt', 'fits', 'сыяды')) : x.r.issues.filter(i => i.sev === 3).map(i => i.text.split(' — ')[0]).join('; ');
    cat.concat(own).forEach(x => { x.rec = x === rec; x.why = why(x); x.palTxt = [x.r.groups.front, x.r.groups.main].filter(g => g.cap > 0 || g.used > 0).map(g => TL[g.reg] + ' ' + g.used + ' / ' + g.cap).join(' · '); x.axTxt = T('перед. ', 'VA ', 'front ', 'алд. ') + Math.round(x.r.front / x.p.front * 100) + ' % · ' + T('задн. ', 'HA ', 'rear ', 'арт. ') + Math.round(x.r.rear / x.p.rear * 100) + ' %'; });
    return { cat, own, rec };
  }
  const ST_T = t => t.status === 'service' ? T('в сервисе', 'in der Werkstatt', 'in the workshop', 'сервисте') : t.status === 'busy' && loadOfTruck(t.id) ? T('в рейсе ', 'in Tour ', 'on trip ', 'рейсте ') + loadOfTruck(t.id).id : T('доступна', 'verfügbar', 'available', 'қолжетімді');
  /* split over two trucks (FR-139): greedy by stop, smallest fitting type for each half, compared with one bigger truck */
  function splitPlan(l) {
    const o = ops(l), sel = o.orders.filter(x => x.on !== false && !x.handed), km = km_(l), co = calcOpt(l), types = CATALOGUE.map(id => TYPES[id]);
    const fitType = os => { const c = []; types.forEach(t => [1, 2].forEach(z => { if (hasVar(t, z)) { const r = bestSplit(t, os, co, z); if (r.fits) c.push(r.p); } })); return c.sort((a, b) => a.rate - b.rate)[0] || null; };
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
  /* loading sequence (FR-144): LIFO by stop, odd positions left / even right, two tiers when the order stacks under the ceiling; thermo boxes listed last */
  function sequence(l, ty) {
    const o = ops(l), r = loadCalc(o.orders, ty), rows = [], planned = {}, route = routeOf(l);
    const pl = {}; o.orders.forEach(x => { pl[x.id] = x.places.slice(); });
    const zn = s => s.key === 'zone1' ? T('зона 1', 'Zone 1', 'zone 1', '1-аймақ') : s.key === 'zone2' ? T('зона 2', 'Zone 2', 'zone 2', '2-аймақ') : s.key === 'tc' ? T('термоконтейнер', 'Thermocontainer', 'thermo container', 'термоконтейнер') : T('кузов', 'Aufbau', 'body', 'шанақ');
    const stopOf = x => x.to + (l.west ? ' · ' + route[x.stop] : '');
    r.slots.forEach((s, i) => { const p = pl[s.id].shift(), n = s.pos + 1; if (p) planned[p.sscc] = n; const ord = o.orders.find(x => x.id === s.id);
      rows.push({ n: i + 1, posN: n, pos: n + ' · ' + (n % 2 ? T('слева', 'links', 'left', 'сол') : T('справа', 'rechts', 'right', 'оң')), row: Math.floor(s.pos / 2) + 1, zone: zn(s), id: s.id, stop: stopOf(ord), tiers: s.tiers, tier: s.tier, sscc: p ? p.sscc : '—', over: s.over }); });
    r.boxes.forEach(b => { const p = pl[b.id].shift(); if (p) planned[p.sscc] = 0; rows.push({ n: rows.length + 1, posN: 0, pos: T('термобокс · у передней стенки', 'Thermobox · an der Stirnwand', 'thermo box · at the front wall', 'термобокс · алдыңғы қабырғада'), row: 1, zone: T('термобокс', 'Thermobox', 'thermo box', 'термобокс'), id: b.id, stop: stopOf(b), tiers: 1, tier: 1, sscc: p ? p.sscc : '—', over: false }); });
    return { rows, planned };
  }
  /* FEFO (FR-05): remaining shelf life at delivery below 90 days */
  const fefo = l => ops(l).orders.flatMap(o => o.lines.filter(x => (new Date(x.exp) - new Date(l.eta)) / 864e5 < 90).map(x => ({ order: o.id, art: x.art, lot: x.lot, exp: x.exp, to: o.to, days: Math.floor((new Date(x.exp) - new Date(l.eta)) / 864e5) })));
  /* SSCC reconciliation (FR-06): places scanned at loading vs. expected per order; a place scanned into another trip is a mismatch */
  const recon = l => ops(l).orders.map(o => { const n = o.places.filter(p => p.scans.some(s => s.ev === 'load' && s.load === l.id)).length, wrong = o.places.filter(p => p.scans.some(s => s.load !== l.id)).length, exp = o.places.length;
    return { id: o.id, to: o.to, exp, n, wrong, ok: n === exp && !wrong, lvl: n === exp && !wrong ? 0 : n < exp ? 3 : 2, mark: wrong ? T('не тот рейс', 'falsche Tour', 'wrong trip', 'басқа рейс') : n === exp ? T('сходится', 'stimmt', 'matches', 'сәйкес') : n < exp ? T('недостача ', 'fehlt ', 'short ', 'жетіспейді ') + (exp - n) : T('излишек', 'Überschuss', 'surplus', 'артық') }; });
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
  /* plan of the vehicle type (FR-99): a type that does not fit needs trips:override_load and a reason; `v` = { zones, split, regime } of the what-if */
  function savePlan(lid, typeId, reason, v) {
    const l = load(lid), ty = TYPES[typeId]; if (!ty) return T('Тип ТС не найден', 'Fahrzeugtyp nicht gefunden', 'Vehicle type not found', 'КҚ түрі табылмады');
    v = v || {}; const p = prof(ty, v.zones, v.split, v.regime), r = loadCalc(ops(l).orders, p, calcOpt(l));
    if (!r.fits) { if (!canDo('trips:override_load')) return T('Не помещается — план только с обоснованием руководителя (trips:override_load)', 'Passt nicht — Plan nur mit Begründung einer Leitung (trips:override_load)', 'Does not fit — plan only with a supervisor reason (trips:override_load)', 'Сыймайды — жоспар тек басшы негіздемесімен'); if (!reason || reason.trim().length < 10) return T('Обоснование перегруза ≥ 10 знаков', 'Begründung der Überschreitung ≥ 10 Zeichen', 'Reason for the overload, 10+ characters', 'Артық жүк негіздемесі ≥ 10 таңба'); }
    ops(l).plan = { type: typeId, zones: p.zones, split: p.split, regime: v.regime || 'auto', label: p.label, by: 'Sarah Johnson', t: fdt(NOW).slice(-5), fits: r.fits, reason: r.fits ? '' : reason.trim() };
    audit('Load', lid, (r.fits ? 'Plan ' : 'Plan override ') + p.label, r.fits ? '' : reason.trim()); return null;
  }
  Object.assign(globalThis, { loadCalc, bestSplit, tripCost, finder, vehMatch, splitPlan, sequence, fefo, recon, reconOk, rescan, weigh, weighOverride, weighLimits, savePlan, calcOpt, loadKm: km_ });
  S.loads.forEach(ops);

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
