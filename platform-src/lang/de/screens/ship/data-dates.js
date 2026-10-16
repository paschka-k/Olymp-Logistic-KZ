const NOW_YM = 2026 * 12 + 9, TODAY = Date.UTC(2026, 9, 6);
const ymOf = s => { const m = /^(\d{2})\.(\d{4})$/.exec(s || ''); return m ? +m[2] * 12 + (+m[1] - 1) : null; };
const isShort = l => { const e = ymOf(l.exp); return e !== null && e - NOW_YM <= 3; };
const daysTo = s => { const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s || ''); return m ? Math.round((Date.UTC(+m[3], +m[2] - 1, +m[1]) - TODAY) / 864e5) : null; };
const PKG = { 'A-2281':2, 'A-2282':1, 'A-2290':3, 'A-2291':2, 'A-2292':1, 'A-2295':1, 'A-2297':1, 'A-2299':1, 'F-0107':1, 'F-0109':1 };
const TACHO = { D1:3.3, D2:2.8, D3:6.1, D4:0.4, D5:3.6, D6:0, D7:0, D8:0.8, D13:1.5 };
const LIC = { D5:'30.11.2026', D8:'20.12.2026' };
const URG_H = 6;
const FINE_IMPORT = { id:'BG-1024', date:'06.10.2026', t:'12:47', veh:'V01', place:'Astana, Täuelsizdik-Allee', type:'Geschwindigkeitsüberschreitung bis 20 km/h', src:'Kamera „Sergek“ · Autoimport', amt:14750, st:'unpaid', due:'13.10.2026',
  seg:[[690,1200,'D2','FA-0402','R-103 Astana → Karaganda']], note:'Automatisch aus „Sergek“ / eGov importiert, Fahrer per Fahrauftrag ermittelt.' };
const CLOSURES = [
  { road:'Kostanay — Aktobe, Abschnitt km 210–390', when:'08.10 06:00 – 09.10 18:00', why:'Buran, Prognose Kazhydromet', trip:'betrifft R-106 → Verschiebung auf 10.10' },
  { road:'Astana — Petropavl, km 120–180', when:'09.10 00:00 – 12:00', why:'Schneetreiben, Lkw-Beschränkung', trip:'keine Touren an diesen Tagen' }
];
