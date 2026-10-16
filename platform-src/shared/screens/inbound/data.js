/* ===== Goods receipt at the hubs (screen 17) — Wareneingang Astana / Almaty ===== */
const INB_DAY = '06.10.';
const INB_NOW0 = 14 * 60 + 32;
const INB_RATE = 6000;
const INB_STEP = 30;
const INB_TR = { '2–8': [2, 8], '15–25': [15, 25], '−20': [-30, -18] };
const hmm = m => { const x = Math.floor(m + 1e-9); return String(Math.floor(x / 60) % 24).padStart(2, '0') + ':' + String(x % 60).padStart(2, '0'); };
const INB_ZONE = {
  amb: X('Сухая зона 15–25 °C', 'Trockenzone 15–25 °C', 'Ambient zone 15–25 °C'),
  cold: X('Холодная зона 2–8 °C', 'Kühlzone 2–8 °C', 'Cold zone 2–8 °C'),
  frz: X('Морозильная зона −20 °C · ДОПОГ', 'Tiefkühlzone −20 °C · ADR', 'Frozen zone −20 °C · ADR')
};
const INB_RAMPS = { ast: ['amb', 'amb', 'cold', 'frz'], alm: ['amb', 'cold', 'frz'] };
const INB_HUB = {
  ast: X('Астана · Хаб «Север»', 'Astana · Hub „Nord“', 'Astana · Hub “North”'),
  alm: X('Алматы · Хаб «Юг»', 'Almaty · Hub „Süd“', 'Almaty · Hub “South”')
};
const INB_OP = {
  ast: X('Д. Оразова (приёмка, Астана)', 'D. Orazowa (Wareneingang Astana)', 'D. Orazova (receiving, Astana)'),
  alm: X('Т. Жаксыбеков (приёмка, Алматы)', 'T. Zhaksybekow (Wareneingang Almaty)', 'T. Zhaksybekov (receiving, Almaty)')
};
const inbRampName = (hub, n) => X('Рампа ', 'Rampe ', 'Ramp ') + n + ' · ' + INB_ZONE[INB_RAMPS[hub][n - 1]];
const inbMfr = (key, place) => ({ ab: MFR[key][0], name: MFR[key][1] + (place ? ' · ' + place : '') });
const inbBr = (ab, ru, de, en) => ({ ab, name: X(ru, de, en) });
const inbPN = id => (PARTNERS.find(p => p.id === id) || {}).name || id;
const INB_REASON = [
  X('Рампа занята', 'Rampe belegt', 'Ramp occupied'), X('Нет документов', 'Dokumente fehlen', 'Documents missing'),
  X('Температура / логгер', 'Temperatur / Logger', 'Temperature / logger'), X('Расхождение SSCC', 'SSCC-Abweichung', 'SSCC mismatch'),
  X('Нехватка персонала', 'Personalmangel', 'Staff shortage')
];
const INBJ = [
  { id: 'IN-0611', hub: 'ast', dir: 'in', prio: 1, src: 'ptn', carrier: 'PL-01', plate: '884 TLK 01', veh: X('Рефрижератор 20 т', 'Kühlkoffer 20 t', 'Reefer 20 t'), pick: '06.10. 09:30', plan: true,
    snd: [inbMfr('Roche', X('склад Алматы', 'Lager Almaty', 'Almaty warehouse')), inbMfr('BD', X('склад Алматы', 'Lager Almaty', 'Almaty warehouse'))],
    stops: [{ r: 3, kg: 2140, m3: 11.8, pcs: 36, w: [830, 855] }, { r: 1, kg: 860, m3: 6.2, pcs: 22, w: [855, 870] }], sd: [true, false],
    ev: { ci: 828, rp: 832, st: 838, en: null }, fl: { gdp: 1, tc: '2–8', tl: '2–8 °C', esf: 'ok', esu: 'ok' }, free: 30, chk: { temp: 5.4, lg: 'LG-44712', ss: null }, exp: 58, miss: 1,
    cr: { by: X('Система · API партнёра СтепьЛогистик', 'System · Partner-API StepLogistik', 'System · partner API StepLogistik'), d: '06.10.', t: '08:12' },
    log: [{ t: '13:58', by: 'D', text: X('начата разгрузка, рампа 3', 'Entladung begonnen, Rampe 3', 'unloading started, ramp 3') }, { t: '13:52', by: 'D', text: X('прибытие на рампу 3', 'Ankunft an Rampe 3', 'arrived at ramp 3') }, { t: '13:48', by: 'D', text: X('въезд на КПП зарегистрирован', 'Einfahrt am Tor erfasst', 'gate check-in recorded') }, { t: '08:12', by: 'S', text: X('создано из заявки партнёра', 'aus Partnerauftrag angelegt', 'created from partner order') }] },
  { id: 'IN-0612', hub: 'ast', dir: 'col', prio: 2, src: 'col', carrier: null, plate: '', veh: X('Изотерм 33,7 м³ · собственный парк', 'Isotherm 33,7 m³ · eigener Fuhrpark', 'Isothermal 33.7 m³ · own fleet'), pick: '06.10. 15:00', plan: true,
    snd: [inbBr('КО', 'Филиал Костанай', 'Filiale Kostanay', 'Kostanay branch'), inbBr('КК', 'Филиал Кокшетау', 'Filiale Kokshetau', 'Kokshetau branch')],
    stops: [{ r: 2, kg: 820, m3: 5.1, pcs: 14, w: [940, 970] }, { r: 3, kg: 350, m3: 1.9, pcs: 6, w: [970, 990] }], sd: [false, false],
    ev: { ci: null, rp: null, st: null, en: null }, fl: { gdp: 1, tc: '2–8', tl: '2–8 / 15–25 °C', esf: 'ok', esu: 'pend' }, free: 45, chk: {}, exp: 20, miss: 0,
    cr: { by: X('Система · сборный рейс Ring A', 'System · Sammellauf Ring A', 'System · collection run ring A'), d: '06.10.', t: '11:20' },
    log: [{ t: '11:20', by: 'S', text: X('создано из сборного рейса на хаб', 'aus Sammellauf zum Hub angelegt', 'created from collection run to the hub') }] },
  { id: 'IN-0613', hub: 'ast', dir: 'in', prio: 3, src: 'ptn', carrier: 'PL-11', plate: '', veh: X('Тент 20 т', 'Planenauflieger 20 t', 'Curtain-side 20 t'), pick: '06.10. 08:00', plan: false,
    snd: [inbMfr('Sarstedt', 'Nümbrecht'), inbMfr('Mercator', 'Krakow')],
    stops: [{ r: 1, kg: 1560, m3: 14.2, pcs: 52, fix: 1020 }], sd: [false],
    ev: { ci: null, rp: null, st: null, en: null }, fl: { fix: 1, short: 1, cust: 1, gdp: 0, tc: '', tl: '15–25 °C', esf: 'miss', esu: 'miss' }, free: 45, chk: {}, exp: 52, miss: 0,
    cr: { by: X('Система · API партнёра GarantA', 'System · Partner-API GarantA', 'System · partner API GarantA'), d: '05.10.', t: '16:40' },
    log: [{ t: '16:40', by: 'S', text: X('создано из заявки партнёра', 'aus Partnerauftrag angelegt', 'created from partner order') }] },
  { id: 'IN-0614', hub: 'ast', dir: 'in', prio: 1, src: 'ptn', carrier: 'PL-13', plate: '075 KGN 02', veh: X('Рефрижератор −20 °C, сухой лёд', 'Kühlkoffer −20 °C, Trockeneis', 'Reefer −20 °C, dry ice'), pick: '06.10. 11:45', plan: true,
    snd: [inbMfr('QIAGEN', 'Hilden')],
    stops: [{ r: 4, kg: 310, m3: 1.4, pcs: 9, w: [920, 950] }], sd: [false],
    ev: { ci: null, rp: null, st: null, en: null }, fl: { adr: 1, gdp: 1, tc: '−20', tl: '−20 °C', esf: 'ok', esu: 'ok' }, free: 45, chk: {}, exp: 9, miss: 0,
    cr: { by: X('Система · API партнёра KazGen', 'System · Partner-API KazGen', 'System · partner API KazGen'), d: '06.10.', t: '07:55' },
    log: [{ t: '10:30', by: 'O', text: X('назначено окно рампы 4', 'Fenster Rampe 4 zugewiesen', 'ramp 4 slot assigned') }, { t: '07:55', by: 'S', text: X('создано из заявки партнёра', 'aus Partnerauftrag angelegt', 'created from partner order') }] },
  { id: 'IN-0615', hub: 'ast', dir: 'in', prio: 2, src: 'ptn', carrier: 'PL-03', plate: '630 CTR 09', veh: X('Изотерм 20 т', 'Isotherm 20 t', 'Isothermal 20 t'), pick: '06.10. 06:30', plan: true,
    snd: [inbMfr('Siemens', 'Erlangen')],
    stops: [{ r: 2, kg: 1240, m3: 9.0, pcs: 31, w: [720, 765] }], sd: [true],
    ev: { ci: 715, rp: 718, st: 730, en: 760 }, fl: { gdp: 0, tc: '', tl: '15–25 °C', esf: 'ok', esu: 'ok' }, free: 45, chk: {}, exp: 31, miss: 0,
    cr: { by: X('Система · API партнёра Центр Транзит', 'System · Partner-API Zentr Tranzit', 'System · partner API Centr Tranzit'), d: '05.10.', t: '17:05' },
    log: [{ t: '12:40', by: 'D', text: X('разгрузка завершена, все места приняты', 'Entladung beendet, alle Stellen angenommen', 'unloading finished, all stops received') }, { t: '12:10', by: 'D', text: X('начата разгрузка, рампа 2', 'Entladung begonnen, Rampe 2', 'unloading started, ramp 2') }, { t: '11:55', by: 'D', text: X('въезд на КПП зарегистрирован', 'Einfahrt am Tor erfasst', 'gate check-in recorded') }, { t: '17:05', by: 'S', text: X('создано из заявки партнёра', 'aus Partnerauftrag angelegt', 'created from partner order') }] },
  { id: 'IN-0621', hub: 'alm', dir: 'in', prio: 1, src: 'ptn', carrier: 'PL-02', plate: '470 JTS 05', veh: X('Рефрижератор 20 т', 'Kühlkoffer 20 t', 'Reefer 20 t'), pick: '06.10. 10:15', plan: true,
    snd: [inbMfr('Abbott', 'Wiesbaden'), inbMfr('bioMérieux', 'Marcy-l’Étoile')],
    stops: [{ r: 2, kg: 1480, m3: 8.4, pcs: 27, w: [870, 900] }, { r: 1, kg: 520, m3: 3.7, pcs: 11, w: [900, 915] }], sd: [false, false],
    ev: { ci: 860, rp: null, st: null, en: null }, fl: { block: 1, gdp: 1, tc: '2–8', tl: '2–8 °C', esf: 'ok', esu: 'ok' }, free: 45, chk: {}, exp: 41, miss: 0,
    cr: { by: X('Система · API партнёра Жетісу Карго', 'System · Partner-API Zhetisu Cargo', 'System · partner API Zhetisu Cargo'), d: '06.10.', t: '08:40' },
    log: [{ t: '14:20', by: 'T', text: X('въезд на КПП зарегистрирован', 'Einfahrt am Tor erfasst', 'gate check-in recorded') }, { t: '13:05', by: 'Q', text: X('партия AB-7741 заблокирована QA до получения CoA', 'Charge AB-7741 durch QA gesperrt bis CoA vorliegt', 'lot AB-7741 on QA hold until CoA arrives') }, { t: '08:40', by: 'S', text: X('создано из заявки партнёра', 'aus Partnerauftrag angelegt', 'created from partner order') }] },
  { id: 'IN-0622', hub: 'alm', dir: 'col', prio: 3, src: 'ptn', carrier: 'PL-12', plate: '908 KEX 05', veh: X('Тент 10 т', 'Planenauflieger 10 t', 'Curtain-side 10 t'), pick: '06.10. 12:30', plan: true,
    snd: [inbBr('ТК', 'Филиал Талдыкорган', 'Filiale Taldykorgan', 'Taldykorgan branch'), inbBr('ТЗ', 'Филиал Тараз', 'Filiale Taraz', 'Taraz branch')],
    stops: [{ r: 1, kg: 640, m3: 4.4, pcs: 18, w: [990, 1020] }], sd: [false],
    ev: { ci: null, rp: null, st: null, en: null }, fl: { gdp: 0, tc: '', tl: '15–25 °C', esf: 'ok', esu: 'ok' }, free: 45, chk: {}, exp: 18, miss: 0,
    cr: { by: X('Система · сборный рейс на хаб (KazExpress)', 'System · Sammellauf zum Hub (KazExpress)', 'System · collection run to the hub (KazExpress)'), d: '06.10.', t: '09:50' },
    log: [{ t: '09:50', by: 'S', text: X('создано из сборного рейса на хаб', 'aus Sammellauf zum Hub angelegt', 'created from collection run to the hub') }] },
  { id: 'IN-0623', hub: 'alm', dir: 'in', prio: 2, src: 'ptn', carrier: 'PL-08', plate: '', veh: X('Контейнер 40′ → тент', 'Container 40′ → Plane', '40′ container → curtain-side'), pick: '05.10. 18:00', plan: false,
    snd: [inbMfr('Gongdong', 'Hangzhou')],
    stops: [{ r: 1, kg: 3200, m3: 24.0, pcs: 80, w: [1080, 1110] }], sd: [false],
    ev: { ci: null, rp: null, st: null, en: null }, fl: { cust: 1, gdp: 0, tc: '', tl: '15–25 °C', esf: 'pend', esu: 'pend' }, free: 45, chk: {}, exp: 80, miss: 0,
    cr: { by: X('Система · API партнёра Юг Рефтранс', 'System · Partner-API Yug Reftrans', 'System · partner API Yug Reftrans'), d: '05.10.', t: '14:10' },
    log: [{ t: '14:10', by: 'S', text: X('создано из заявки партнёра', 'aus Partnerauftrag angelegt', 'created from partner order') }] },
  { id: 'IN-0620', hub: 'alm', dir: 'in', prio: 1, src: 'ptn', carrier: 'PL-02', plate: '311 JTS 05', veh: X('Рефрижератор 20 т', 'Kühlkoffer 20 t', 'Reefer 20 t'), pick: '06.10. 05:40', plan: true,
    snd: [inbMfr('Beckman Coulter', 'Krefeld')],
    stops: [{ r: 2, kg: 1790, m3: 10.3, pcs: 33, w: [735, 765] }], sd: [true],
    ev: { ci: 710, rp: 718, st: 742, en: 778 }, fl: { gdp: 1, tc: '2–8', tl: '2–8 °C', esf: 'ok', esu: 'ok' }, free: 45, chk: { temp: 4.1, lg: 'LG-39980', ss: 33 }, exp: 33, miss: 0,
    cr: { by: X('Система · API партнёра Жетісу Карго', 'System · Partner-API Zhetisu Cargo', 'System · partner API Zhetisu Cargo'), d: '05.10.', t: '19:30' },
    log: [{ t: '12:58', by: 'T', text: X('разгрузка завершена, все места приняты', 'Entladung beendet, alle Stellen angenommen', 'unloading finished, all stops received') }, { t: '12:22', by: 'T', text: X('начата разгрузка, рампа 2', 'Entladung begonnen, Rampe 2', 'unloading started, ramp 2') }, { t: '11:58', by: 'T', text: X('прибытие на рампу 2 (рампа была занята)', 'Ankunft an Rampe 2 (Rampe war belegt)', 'arrived at ramp 2 (ramp was occupied)') }, { t: '11:50', by: 'T', text: X('въезд на КПП зарегистрирован', 'Einfahrt am Tor erfasst', 'gate check-in recorded') }, { t: '19:30', by: 'S', text: X('создано из заявки партнёра', 'aus Partnerauftrag angelegt', 'created from partner order') }] }
];
