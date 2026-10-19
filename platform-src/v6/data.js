/* v6 demo data (Kazakhstan cold chain). Fixed clock so the demo is deterministic. */
const NOW = new Date('2026-10-18T14:30:00+05:00');
const HUBS = {
  AST: { name: T('Хаб Астана-Север', 'Hub Astana-Nord', 'Astana North Hub', 'Астана-Солтүстік хабы'), city: T('Астана', 'Astana', 'Astana', 'Астана'), x: 330, y: 95 },
  ALA: { name: T('Хаб Алматы-Жетысу', 'Hub Almaty-Zhetysu', 'Almaty Zhetysu Hub', 'Алматы-Жетісу хабы'), city: T('Алматы', 'Almaty', 'Almaty', 'Алматы'), x: 478, y: 262 },
  KAR: { name: T('Хаб Караганда', 'Hub Karaganda', 'Karaganda Hub', 'Қарағанды хабы'), city: T('Караганда', 'Karaganda', 'Karaganda', 'Қарағанды'), x: 352, y: 150 },
  SHY: { name: T('Хаб Шымкент', 'Hub Schymkent', 'Shymkent Hub', 'Шымкент хабы'), city: T('Шымкент', 'Shymkent', 'Shymkent', 'Шымкент'), x: 330, y: 288 },
  /* West KZ (P86 / FR-36: the West is served from Astana; Atyrau is the transshipment point of the temperature flows, baseline V-xx): a cross-dock hub for Atyrau, Uralsk, Aktau, Aktobe */
  ATY: { name: T('Хаб Атырау-Запад (перевалка)', 'Hub Atyrau-West (Umschlag)', 'Atyrau West Hub (cross-dock)', 'Атырау-Батыс хабы (қайта тиеу)'), city: T('Атырау', 'Atyrau', 'Atyrau', 'Атырау'), x: 92, y: 178, west: true },
};
const DIST = { 'AST-ALA': 1200, 'AST-KAR': 220, 'AST-SHY': 1300, 'ALA-KAR': 1000, 'ALA-SHY': 690, 'KAR-SHY': 1100, 'AST-ATY': 1900, 'KAR-ATY': 2100, 'ALA-ATY': 2650, 'SHY-ATY': 2200 };
const dist = (a, b) => DIST[a + '-' + b] || DIST[b + '-' + a] || 0;
const ZONES = {
  frozen:  { label: '−18 °C',    lo: -25, hi: -15, mid: -19, rate: 640 },
  chilled: { label: '0…+4 °C',   lo: 0,   hi: 4,   mid: 2,   rate: 560 },
  pharma:  { label: '+2…+8 °C',  lo: 2,   hi: 8,   mid: 5,   rate: 700 },
  ambient: { label: '+15…+25 °C', lo: 15,  hi: 25,  mid: 20,  rate: 420 },
};
const CUSTOMERS = [
  { id: 'c1', name: 'ТОО «Аптека Сервис»',        bin: '120340005671', ini: 'АС', av: 1 },
  { id: 'c2', name: 'ТОО «Фрэш Маркет»',          bin: '110740012345', ini: 'ФМ', av: 5 },
  { id: 'c3', name: 'ТОО «МедФарм Дистрибьюшн»', bin: '150240008812', ini: 'МД', av: 4 },
  { id: 'c4', name: 'ТОО «Ледяной Путь Ритейл»',  bin: '130940007790', ini: 'ЛП', av: 2 },
  { id: 'c5', name: 'ТОО «СеверПродукт»',         bin: '090640003321', ini: 'СП', av: 3 },
];
const D = (type, to) => ({ type, to });
const mkDrivers = () => [
  { id: 'd1', code: 'DRV-001', name: 'Ерлан Сейтқали',     ini: 'ЕС', rto: 8.5, status: 'available', lic: 'CE', exp: 11, rating: 4.9, phone: '+7 701 123 45 67', hub: 'KAR', onDuty: 2.5, week: 41,
    docs: [D('lic', '2029-05-14'), D('med', '2027-02-03'), D('gdp', '2027-06-01')] },
  { id: 'd2', code: 'DRV-002', name: 'Асхат Нургалиев',    ini: 'АН', rto: 9,   status: 'available', lic: 'CE', exp: 8,  rating: 4.7, phone: '+7 702 234 56 78', hub: 'ALA', onDuty: 0,   week: 38,
    docs: [D('lic', '2028-09-22'), D('med', '2027-04-18'), D('gdp', '2026-11-02')] },
  { id: 'd3', code: 'DRV-003', name: 'Дмитрий Орлов',      ini: 'ДО', rto: 3.5, status: 'available', lic: 'C',  exp: 12, rating: 4.8, phone: '+7 705 345 67 89', hub: 'AST', onDuty: 5.5, week: 51,
    docs: [D('lic', '2027-12-15'), D('med', '2027-08-22'), D('gdp', '2027-03-10')] },
  { id: 'd4', code: 'DRV-004', name: 'Марат Жунусов',      ini: 'МЖ', rto: 9,   status: 'busy',      lic: 'CE', exp: 6,  rating: 4.6, phone: '+7 707 456 78 90', hub: 'AST', onDuty: 4,   week: 33,
    docs: [D('lic', '2030-01-30'), D('med', '2027-01-12'), D('gdp', '2027-09-09')] },
  { id: 'd5', code: 'DRV-005', name: 'Алишер Бектурганов', ini: 'АБ', rto: 6,   status: 'available', lic: 'C',  exp: 9,  rating: 4.9, phone: '+7 708 567 89 01', hub: 'AST', onDuty: 3,   week: 29,
    docs: [D('lic', '2028-03-03'), D('med', '2026-10-30'), D('gdp', '2027-05-05')] },
  { id: 'd6', code: 'DRV-006', name: 'Сергей Ким',         ini: 'СК', rto: 9,   status: 'rest',      lic: 'CE', exp: 15, rating: 4.5, phone: '+7 700 678 90 12', hub: 'SHY', onDuty: 0,   week: 56,
    docs: [D('lic', '2027-07-07'), D('med', '2027-06-06'), D('gdp', '2027-02-02')] },
  { id: 'd7', code: 'DRV-007', name: 'Нұрлан Омаров',      ini: 'НО', rto: 9,   status: 'busy',      lic: 'CE', exp: 7,  rating: 4.8, phone: '+7 771 789 01 23', hub: 'AST', onDuty: 6,   week: 44,
    docs: [D('lic', '2029-11-11'), D('med', '2026-10-05'), D('gdp', '2027-04-04')] },
];
const mkTrucks = () => [
  { id: 't1', plate: '123 ABC 01', make: 'Volvo FH 500 + Schmitz', year: 2023, km: 148200, model: 'Reefer 20 t', zones: ['frozen', 'chilled', 'pharma'], cap: 33, status: 'available', hub: 'AST', ping: 2,   health: 'green', unit: 'Thermo King SLXi', unitH: 3120,
    docs: { osago: '2027-03-01', cargo: '2027-01-15', calib: '2027-02-20', to: '2027-01-10' }, svc: { last: '2026-09-02', lastKm: 140000, nextKm: 155000 } },
  { id: 't2', plate: '456 DEF 02', make: 'MAN TGL 12.250',          year: 2021, km: 262900, model: 'Reefer 12 t', zones: ['chilled', 'pharma'],           cap: 20, status: 'available', hub: 'ALA', ping: 5,   health: 'amber', unit: 'Carrier Supra 850', unitH: 6410,
    docs: { osago: '2027-02-10', cargo: '2026-12-20', calib: '2026-10-10', to: '2026-11-25' }, svc: { last: '2026-07-14', lastKm: 255000, nextKm: 270000 } },
  { id: 't3', plate: '789 GHI 01', make: 'Scania R 450 + Krone',    year: 2022, km: 205500, model: 'Reefer 20 t', zones: ['frozen', 'chilled'],           cap: 33, status: 'available', hub: 'KAR', ping: 8,   health: 'green', unit: 'Thermo King SLXi', unitH: 4980,
    docs: { osago: '2027-05-01', cargo: '2027-03-01', calib: '2027-04-01', to: '2027-02-18' }, svc: { last: '2026-08-20', lastKm: 198000, nextKm: 213000 } },
  { id: 't4', plate: '321 JKL 02', make: 'Isuzu NPR 10 t',          year: 2020, km: 301400, model: 'Van 10 t',    zones: ['ambient', 'chilled'],          cap: 14, status: 'available', hub: 'ALA', ping: 11,  health: 'green', unit: 'Carrier Xarios 350', unitH: 7800,
    docs: { osago: '2026-12-01', cargo: '2026-12-01', calib: '2027-01-12', to: '2026-12-15' }, svc: { last: '2026-06-01', lastKm: 290000, nextKm: 305000 } },
  { id: 't5', plate: '654 MNO 09', make: 'DAF XF 480 + Schmitz',    year: 2023, km: 119800, model: 'Reefer 20 t', zones: ['pharma', 'chilled', 'frozen'], cap: 33, status: 'busy',      hub: 'AST', ping: 1,   health: 'green', unit: 'Thermo King SLXi', unitH: 2210,
    docs: { osago: '2027-06-01', cargo: '2027-04-01', calib: '2027-05-01', to: '2027-03-12' }, svc: { last: '2026-09-25', lastKm: 115000, nextKm: 130000 } },
  { id: 't6', plate: '987 PQR 01', make: 'Mercedes Actros + Krone', year: 2021, km: 233300, model: 'Reefer 12 t', zones: ['chilled', 'frozen'],           cap: 20, status: 'busy',      hub: 'AST', ping: 3,   health: 'green', unit: 'Carrier Supra 950', unitH: 5400,
    docs: { osago: '2027-01-20', cargo: '2027-01-20', calib: '2026-12-30', to: '2026-12-02' }, svc: { last: '2026-08-02', lastKm: 226000, nextKm: 241000 } },
  { id: 't7', plate: '135 STU 02', make: 'Hyundai HD 120',          year: 2019, km: 389000, model: 'Tent 20 t',   zones: ['ambient'],                     cap: 33, status: 'service',   hub: 'ALA', ping: 120, health: 'amber', unit: '—', unitH: 0,
    docs: { osago: '2026-11-18', cargo: '2026-11-18', calib: '2027-01-01', to: '2026-10-20' }, svc: { last: '2026-04-10', lastKm: 372000, nextKm: 387000 } },
];
const mkLoad = (id, c, from, to, zone, pal, kg, pri, st, eta, o = {}) => Object.assign({
  id: 'LD-2026-' + id, cust: c, from, to, zone, pallets: pal, kg, priority: pri, status: st, eta,
  driver: null, truck: null, temp: ZONES[zone].mid, progress: 0, pod: 'none', esf: 'none', notes: [],
  created: '2026-10-17T09:00:00+05:00',
}, o);
const mkLoads = () => [
  mkLoad('001847', 'c1', 'AST', 'ALA', 'pharma', 24, 8200, 'high', 'in_transit', '2026-10-19T08:00:00+05:00', { driver: 'd4', truck: 't5', progress: 0.58, temp: 5.1 }),
  mkLoad('001848', 'c2', 'AST', 'KAR', 'chilled', 18, 6100, 'medium', 'in_transit', '2026-10-18T18:30:00+05:00', { driver: 'd7', truck: 't6', progress: 0.72, temp: 3.4 }),
  mkLoad('001849', 'c3', 'ALA', 'SHY', 'pharma', 12, 3400, 'high', 'problem', '2026-10-18T20:00:00+05:00', { driver: 'd2', truck: 't2', progress: 0.4, temp: 9.6, notes: [{ who: 'System', t: '14:12', text: T('Температура вне диапазона 2–8 °C более 10 мин', 'Temperatur seit über 10 Min außerhalb 2–8 °C', 'Temperature outside 2–8 °C for over 10 min', 'Температура 2–8 °C-тан тыс 10 мин астам') }] }),
  mkLoad('001850', 'c4', 'KAR', 'AST', 'frozen', 30, 15200, 'medium', 'loading', '2026-10-19T10:00:00+05:00', { driver: 'd1', truck: 't3' }),
  mkLoad('001851', 'c5', 'AST', 'SHY', 'ambient', 14, 4800, 'low', 'assigned', '2026-10-20T09:00:00+05:00', { driver: 'd5', truck: 't4' }),
  mkLoad('001852', 'c1', 'ALA', 'AST', 'pharma', 20, 5600, 'high', 'unassigned', '2026-10-19T16:00:00+05:00'),
  mkLoad('001856', 'c3', 'AST', 'ATY', 'pharma', 16, 4900, 'high', 'assigned', '2026-10-21T07:00:00+05:00', { driver: 'd3', truck: 't1' }),
  mkLoad('001853', 'c2', 'SHY', 'ALA', 'chilled', 26, 9800, 'medium', 'unassigned', '2026-10-19T12:00:00+05:00'),
  mkLoad('001854', 'c4', 'ALA', 'KAR', 'frozen', 22, 11800, 'low', 'unassigned', '2026-10-21T08:00:00+05:00'),
  mkLoad('001855', 'c3', 'AST', 'KAR', 'pharma', 8, 1900, 'high', 'unassigned', '2026-10-18T22:00:00+05:00'),
  mkLoad('001840', 'c5', 'KAR', 'ALA', 'chilled', 28, 10400, 'medium', 'delivered', '2026-10-17T15:00:00+05:00', { driver: 'd1', truck: 't3', pod: 'pending', progress: 1 }),
  mkLoad('001841', 'c1', 'AST', 'ALA', 'pharma', 16, 4300, 'high', 'delivered', '2026-10-17T10:30:00+05:00', { driver: 'd4', truck: 't5', pod: 'approved', esf: 'issued', progress: 1, temp: 5.2, podDocs: ['ttn', 'act', 'photo', 'logger'], sig: true }),
  mkLoad('001842', 'c2', 'SHY', 'AST', 'chilled', 24, 8800, 'low', 'delivered', '2026-10-16T19:00:00+05:00', { driver: 'd2', truck: 't1', pod: 'approved', esf: 'none', progress: 1, podDocs: ['ttn', 'act', 'photo', 'logger'], sig: true }),
  mkLoad('001843', 'c4', 'ALA', 'SHY', 'frozen', 18, 9100, 'medium', 'delivered', '2026-10-16T11:00:00+05:00', { driver: 'd7', truck: 't6', pod: 'approved', esf: 'confirmed', progress: 1, podDocs: ['ttn', 'act', 'photo', 'logger'], sig: true }),
  mkLoad('001844', 'c3', 'KAR', 'SHY', 'pharma', 10, 2500, 'medium', 'delivered', '2026-10-15T14:00:00+05:00', { driver: 'd5', truck: 't2', pod: 'submitted', esf: 'none', progress: 1, podDocs: ['ttn', 'act', 'photo', 'logger'], exc: 30 }),
  mkLoad('001845', 'c5', 'AST', 'KAR', 'ambient', 20, 7000, 'low', 'delivered', '2026-10-15T09:00:00+05:00', { driver: 'd3', truck: 't4', pod: 'rejected', esf: 'none', progress: 1, podDocs: ['ttn'], rejectWhy: 'Нет акта приёма-передачи и фото груза' }),
];

S.loads = mkLoads(); S.drivers = mkDrivers(); S.trucks = mkTrucks();

/* ---------- hubs & goods receiving (phase 4; ports the logic of legacy screen 17) ---------- */
const RECV = { rate: 6000, step: 30, free: 45 };   // Standgeld: 6 000 ₸ per started 30 min after the free time
const mkHubs = () => ({
  AST: { addr: T('г. Астана, пр. Кабанбай батыра, 15', 'Astana, Qabanbay-Batyr-Allee 15', 'Astana, 15 Kabanbay Batyr Ave', 'Астана қ., Қабанбай батыр даңғ., 15'), places: { frozen: [500, 430], chilled: [800, 700], pharma: [600, 520], ambient: [1200, 1030] }, ramps: ['ambient', 'ambient', 'chilled', 'pharma', 'frozen'], blocked: [], io: [142, 238], done: [212, 300], maint: false },
  ALA: { addr: T('г. Алматы, ул. Рыскулова, 87', 'Almaty, Ryskulov-Str. 87', 'Almaty, 87 Ryskulov St', 'Алматы қ., Рысқұлов к-сі, 87'), places: { frozen: [400, 390], chilled: [700, 670], pharma: [500, 480], ambient: [900, 830] }, ramps: ['ambient', 'chilled', 'pharma', 'frozen'], blocked: [2, 4], io: [89, 156], done: [160, 190], maint: false },
  KAR: { addr: T('г. Караганда, ул. Ермекова, 54', 'Karaganda, Ermekov-Str. 54', 'Karaganda, 54 Ermekov St', 'Қарағанды қ., Ермеков к-сі, 54'), places: { frozen: [200, 80], chilled: [400, 170], pharma: [200, 90], ambient: [600, 300] }, ramps: ['ambient', 'chilled', 'frozen'], blocked: [], io: [34, 67], done: [60, 90], maint: true },
  SHY: { addr: T('г. Шымкент, пр. Байдибек би, 120', 'Schymkent, Baidibek-Bi-Allee 120', 'Shymkent, 120 Baidibek Bi Ave', 'Шымкент қ., Байдібек би даңғ., 120'), places: { frozen: [200, 120], chilled: [500, 320], pharma: [300, 190], ambient: [800, 520] }, ramps: ['ambient', 'chilled'], blocked: [], io: [76, 124], done: [90, 140], maint: false },
  ATY: { addr: T('г. Атырау, ул. Сатпаева, 44 (кросс-док)', 'Atyrau, Satpayev-Str. 44 (Cross-Dock)', 'Atyrau, 44 Satpayev St (cross-dock)', 'Атырау қ., Сәтбаев к-сі, 44 (кросс-док)'), places: { frozen: [120, 40], chilled: [240, 110], pharma: [160, 70], ambient: [400, 180] }, ramps: ['ambient', 'chilled', 'pharma'], blocked: [], locked: [], io: [18, 31], done: [22, 36], maint: false },
});
const mkJob = (id, hub, zone, o) => Object.assign({ id: 'IN-' + id, hub, zone, carrier: '', plate: '', veh: '', senders: [], plan: true, ramp: null, win: null, pallets: 10, load: null,
  ev: { ci: null, rp: null, st: null, en: null }, chk: { temp: null, logger: false }, delay: null, reason: '', booked: 0, flags: [], log: [] }, o);
const mkJobs = () => [
  mkJob('0611', 'AST', 'pharma',  { plate: '075 KGN 02', veh: 'Reefer 20 t', carrier: 'ТОО «Север Карго»',    senders: ['ТОО «МедФарм Дистрибьюшн»'],       win: [900, 930],  ramp: 4, pallets: 14, flags: ['gdp'] }),
  mkJob('0613', 'AST', 'ambient', { plate: '',           veh: 'Tent 20 t',   carrier: 'ТОО «Центр Транзит»', senders: ['ТОО «СеверПродукт»'],              win: [1020, 1050], plan: false, pallets: 22, flags: ['fix'] }),
  mkJob('0614', 'AST', 'frozen',  { plate: '630 CTR 09', veh: 'Reefer −20 °C', carrier: 'ТОО «Север Карго»',  senders: ['ТОО «Ледяной Путь Ритейл»'],       win: [840, 870],  ramp: 5, pallets: 26, ev: { ci: 850, rp: null, st: null, en: null }, flags: ['gdp', 'adr'] }),
  mkJob('0615', 'AST', 'ambient', { plate: '470 JTS 05', veh: 'Tent 20 t',   carrier: 'ТОО «Центр Транзит»', senders: ['ТОО «СеверПродукт»'],              win: [720, 765],  ramp: 1, pallets: 31, ev: { ci: 715, rp: 718, st: 730, en: 760 } }),
  mkJob('0616', 'AST', 'chilled', { plate: '987 PQR 01', veh: 'Reefer 12 t', carrier: 'ТОО «Север Карго»',    senders: ['ТОО «Фрэш Маркет»'],               win: [790, 820],  ramp: 3, pallets: 18, ev: { ci: 800, rp: 805, st: 815, en: null }, chk: { temp: 3.2, logger: true } }),
  mkJob('0621', 'ALA', 'pharma',  { plate: '908 KEX 05', veh: 'Reefer 20 t', carrier: 'ТОО «Жетісу Карго»',   senders: ['ТОО «Аптека Сервис»', 'ТОО «МедФарм Дистрибьюшн»'], win: [870, 900],  ramp: 3, pallets: 20, ev: { ci: 860, rp: null, st: null, en: null }, flags: ['gdp', 'block'] }),
  mkJob('0622', 'ALA', 'ambient', { plate: '321 JKL 02', veh: 'Van 10 t',    carrier: 'ТОО «Жетісу Карго»',   senders: ['Филиал Талдыкорган'],             win: [990, 1020], ramp: 1, pallets: 9 }),
  mkJob('0623', 'ALA', 'chilled', { plate: '',           veh: 'Reefer 12 t', carrier: 'ТОО «Алатау Логистик»', senders: ['ТОО «Фрэш Маркет»'],             win: [1080, 1110], plan: false, pallets: 16, flags: ['fix'] }),
  mkJob('0624', 'ALA', 'frozen',  { plate: '135 STU 02', veh: 'Reefer −20 °C', carrier: 'ТОО «Алатау Логистик»', senders: ['ТОО «Ледяной Путь Ритейл»'],    win: [600, 630],  ramp: 4, pallets: 24, ev: { ci: 600, rp: 604, st: 610, en: 730 }, chk: { temp: -19, logger: true }, flags: ['gdp'] }),
  mkJob('0631', 'KAR', 'chilled', { plate: '987 PQR 01', veh: 'Reefer 12 t', carrier: 'собственный парк',     senders: ['ТОО «Фрэш Маркет»'],               win: [1100, 1130], ramp: 2, pallets: 18, load: 'LD-2026-001848', flags: ['gdp'] }),
];
S.hubs = mkHubs(); S.jobs = mkJobs();
S.costs = [
  { id: 'C-1', date: '2026-10-12', hub: 'AST', text: T('Дизельное топливо', 'Diesel', 'Diesel fuel', 'Дизель отыны'), amount: 1850000, ref: '', cat: 'fuel' },
  { id: 'C-2', date: '2026-10-14', hub: 'ALA', text: T('Сервис ТС 135 STU 02', 'Service Fzg. 135 STU 02', 'Service truck 135 STU 02', 'КҚ сервисі 135 STU 02'), amount: 420000, ref: '', cat: 'service' },
  { id: 'C-3', date: '2026-10-01', hub: 'AST', text: T('Страхование груза (КАСКО/CMR)', 'Frachtversicherung', 'Cargo insurance', 'Жүкті сақтандыру'), amount: 310000, ref: '', cat: 'insurance' },
  { id: 'C-4', date: '2026-10-10', hub: 'ALA', text: T('Налог на транспорт', 'Fahrzeugsteuer', 'Vehicle tax', 'Көлік салығы'), amount: 96000, ref: '', cat: 'tax' },
  { id: 'C-5', date: '2026-10-15', hub: 'KAR', text: T('Дизельное топливо', 'Diesel', 'Diesel fuel', 'Дизель отыны'), amount: 780000, ref: '', cat: 'fuel' },
];
