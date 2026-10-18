/* v6 demo data (Kazakhstan cold chain). Fixed clock so the demo is deterministic. */
const NOW = new Date('2026-10-18T14:30:00+05:00');
const HUBS = {
  AST: { name: T('Хаб Астана-Север', 'Hub Astana-Nord', 'Astana North Hub', 'Астана-Солтүстік хабы'), city: T('Астана', 'Astana', 'Astana', 'Астана'), x: 330, y: 95 },
  ALA: { name: T('Хаб Алматы-Жетысу', 'Hub Almaty-Zhetysu', 'Almaty Zhetysu Hub', 'Алматы-Жетісу хабы'), city: T('Алматы', 'Almaty', 'Almaty', 'Алматы'), x: 478, y: 262 },
  KAR: { name: T('Хаб Караганда', 'Hub Karaganda', 'Karaganda Hub', 'Қарағанды хабы'), city: T('Караганда', 'Karaganda', 'Karaganda', 'Қарағанды'), x: 352, y: 150 },
  SHY: { name: T('Хаб Шымкент', 'Hub Schymkent', 'Shymkent Hub', 'Шымкент хабы'), city: T('Шымкент', 'Shymkent', 'Shymkent', 'Шымкент'), x: 330, y: 288 },
};
const DIST = { 'AST-ALA': 1200, 'AST-KAR': 220, 'AST-SHY': 1300, 'ALA-KAR': 1000, 'ALA-SHY': 690, 'KAR-SHY': 1100 };
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
const mkDrivers = () => [
  { id: 'd1', name: 'Ерлан Сейтқали',   ini: 'ЕС', rto: 8.5, status: 'available' },
  { id: 'd2', name: 'Асхат Нургалиев',  ini: 'АН', rto: 9,   status: 'available' },
  { id: 'd3', name: 'Дмитрий Орлов',    ini: 'ДО', rto: 3.5, status: 'available' },
  { id: 'd4', name: 'Марат Жунусов',    ini: 'МЖ', rto: 9,   status: 'busy' },
  { id: 'd5', name: 'Алишер Бектурганов', ini: 'АБ', rto: 6, status: 'available' },
  { id: 'd6', name: 'Сергей Ким',       ini: 'СК', rto: 9,   status: 'rest' },
  { id: 'd7', name: 'Нұрлан Омаров',    ini: 'НО', rto: 9,   status: 'busy' },
];
const mkTrucks = () => [
  { id: 't1', plate: '123 ABC 01', model: 'Reefer 20 t', zones: ['frozen', 'chilled', 'pharma'], cap: 33, status: 'available' },
  { id: 't2', plate: '456 DEF 02', model: 'Reefer 12 t', zones: ['chilled', 'pharma'],             cap: 20, status: 'available' },
  { id: 't3', plate: '789 GHI 01', model: 'Reefer 20 t', zones: ['frozen', 'chilled'],              cap: 33, status: 'available' },
  { id: 't4', plate: '321 JKL 02', model: 'Van 10 t',    zones: ['ambient', 'chilled'],             cap: 14, status: 'available' },
  { id: 't5', plate: '654 MNO 09', model: 'Reefer 20 t', zones: ['pharma', 'chilled', 'frozen'],    cap: 33, status: 'busy' },
  { id: 't6', plate: '987 PQR 01', model: 'Reefer 12 t', zones: ['chilled', 'frozen'],              cap: 20, status: 'busy' },
  { id: 't7', plate: '135 STU 02', model: 'Tent 20 t',   zones: ['ambient'],                        cap: 33, status: 'service' },
];
const mkLoad = (id, c, from, to, zone, pal, kg, pri, st, eta, o = {}) => Object.assign({
  id: 'LD-2026-' + id, cust: c, from, to, zone, pallets: pal, kg, priority: pri, status: st, eta,
  driver: null, truck: null, temp: ZONES[zone].mid, progress: 0, pod: 'none', esf: 'none', notes: [],
  created: '2026-10-17T09:00:00+05:00',
}, o);
const mkLoads = () => [
  mkLoad('001847', 'c1', 'AST', 'ALA', 'pharma', 24, 8200, 'high', 'in_transit', '2026-10-19T08:00:00+05:00', { driver: 'd4', truck: 't5', progress: 0.58, temp: 5.1 }),
  mkLoad('001848', 'c2', 'AST', 'KAR', 'chilled', 18, 6100, 'medium', 'in_transit', '2026-10-18T18:30:00+05:00', { driver: 'd7', truck: 't6', progress: 0.72, temp: 4.9 }),
  mkLoad('001849', 'c3', 'ALA', 'SHY', 'pharma', 12, 3400, 'high', 'problem', '2026-10-18T20:00:00+05:00', { driver: 'd2', truck: 't2', progress: 0.4, temp: 9.6, notes: [{ who: 'System', t: '14:12', text: T('Температура вне диапазона 2–8 °C более 10 мин', 'Temperatur seit über 10 Min außerhalb 2–8 °C', 'Temperature outside 2–8 °C for over 10 min', 'Температура 2–8 °C-тан тыс 10 мин астам') }] }),
  mkLoad('001850', 'c4', 'KAR', 'AST', 'frozen', 30, 15200, 'medium', 'loading', '2026-10-19T10:00:00+05:00', { driver: 'd1', truck: 't3' }),
  mkLoad('001851', 'c5', 'AST', 'SHY', 'ambient', 14, 4800, 'low', 'assigned', '2026-10-20T09:00:00+05:00', { driver: 'd5', truck: 't4' }),
  mkLoad('001852', 'c1', 'ALA', 'AST', 'pharma', 20, 5600, 'high', 'unassigned', '2026-10-19T16:00:00+05:00'),
  mkLoad('001853', 'c2', 'SHY', 'ALA', 'chilled', 26, 9800, 'medium', 'unassigned', '2026-10-19T12:00:00+05:00'),
  mkLoad('001854', 'c4', 'ALA', 'KAR', 'frozen', 22, 11800, 'low', 'unassigned', '2026-10-21T08:00:00+05:00'),
  mkLoad('001855', 'c3', 'AST', 'KAR', 'pharma', 8, 1900, 'high', 'unassigned', '2026-10-18T22:00:00+05:00'),
  mkLoad('001840', 'c5', 'KAR', 'ALA', 'chilled', 28, 10400, 'medium', 'delivered', '2026-10-17T15:00:00+05:00', { pod: 'pending', progress: 1 }),
  mkLoad('001841', 'c1', 'AST', 'ALA', 'pharma', 16, 4300, 'high', 'delivered', '2026-10-17T10:30:00+05:00', { pod: 'approved', esf: 'issued', progress: 1, temp: 5.2 }),
  mkLoad('001842', 'c2', 'SHY', 'AST', 'chilled', 24, 8800, 'low', 'delivered', '2026-10-16T19:00:00+05:00', { pod: 'approved', esf: 'none', progress: 1 }),
  mkLoad('001843', 'c4', 'ALA', 'SHY', 'frozen', 18, 9100, 'medium', 'delivered', '2026-10-16T11:00:00+05:00', { pod: 'approved', esf: 'confirmed', progress: 1 }),
  mkLoad('001844', 'c3', 'KAR', 'SHY', 'pharma', 10, 2500, 'medium', 'delivered', '2026-10-15T14:00:00+05:00', { pod: 'approved', esf: 'confirmed', progress: 1 }),
  mkLoad('001845', 'c5', 'AST', 'KAR', 'ambient', 20, 7000, 'low', 'delivered', '2026-10-15T09:00:00+05:00', { pod: 'approved', esf: 'confirmed', progress: 1 }),
];

S.loads = mkLoads(); S.drivers = mkDrivers(); S.trucks = mkTrucks();
