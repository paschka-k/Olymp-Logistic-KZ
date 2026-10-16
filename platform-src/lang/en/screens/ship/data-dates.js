const NOW_YM = 2026 * 12 + 9, TODAY = Date.UTC(2026, 9, 6);
const ymOf = s => { const m = /^(\d{2})\.(\d{4})$/.exec(s || ''); return m ? +m[2] * 12 + (+m[1] - 1) : null; };
const isShort = l => { const e = ymOf(l.exp); return e !== null && e - NOW_YM <= 3; };
const daysTo = s => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s || ''); return m ? Math.round((Date.UTC(+m[3], +m[2] - 1, +m[1]) - TODAY) / 864e5) : null; };
const PKG = { 'O-2281':2, 'O-2282':1, 'O-2290':3, 'O-2291':2, 'O-2292':1, 'O-2295':1, 'O-2297':1, 'O-2299':1, 'T-0107':1, 'T-0109':1 };
const TACHO = { D1:3.3, D2:2.8, D3:6.1, D4:0.4, D5:3.6, D6:0, D7:0, D8:0.8, D13:1.5 };
const LIC = { D5:'30.11.2026', D8:'20.12.2026' };
const URG_H = 6;
const FINE_IMPORT = { id:'FN-1024', date:'06.10.2026', t:'12:47', veh:'V01', place:'Astana, Tauelsizdik Ave', type:'Speeding up to 20 km/h', src:'“Sergek” camera · auto-import', amt:14750, st:'unpaid', due:'13.10.2026',
  seg:[[690,1200,'D2','TS-0402','R-103 Astana → Karaganda']], note:'Imported automatically from “Sergek” / eGov, driver identified via trip sheet.' };
const CLOSURES = [
  { road:'Kostanay — Aktobe, section km 210–390', when:'08.10 06:00 – 09.10 18:00', why:'buran, Kazhydromet forecast', trip:'affects R-106 → moved to 10.10' },
  { road:'Astana — Petropavl, km 120–180', when:'09.10 00:00 – 12:00', why:'snowstorm, truck restriction', trip:'no trips on these dates' }
];
