/* FR-221 · Locale formatting: ONE helper for numbers, ₸, dates and units per UI language. Every screen formats through LF
   (no toLocaleString / replace('.', ',') in screens; test g4 "FR-221" scans the bundle).
   Profile per language = the single place to change a format. Kept from 6.3: digit groups with a (no-break) space in every
   language (KZ / ISO 80000-1 style, so "12 345 ₸" reads the same in all four UIs) and dates dd.mm.yyyy; the decimal
   separator follows the language (RU / DE / KK comma, EN point). Changing EN / DE grouping is a product decision: edit LOCALE. */
const LOCALE = {
  ru: { num: 'ru-RU', dec: ',', date: 'dmy', time: 'hm' },
  de: { num: 'ru-RU', dec: ',', date: 'dmy', time: 'hm' },
  en: { num: 'ru-RU', dec: '.', date: 'dmy', time: 'hm' },
  kk: { num: 'ru-RU', dec: ',', date: 'dmy', time: 'hm' },
};
const LF = (() => {
  const P = LOCALE[LANG] || LOCALE.ru,
    pad = n => String(n).padStart(2, '0');
  const UNITS = {
    km: ['км', 'km', 'km', 'км'],
    kg: ['кг', 'kg', 'kg', 'кг'],
    t: ['т', 't', 't', 'т'],
    h: ['ч', 'h', 'h', 'сағ'],
    min: ['мин', 'Min.', 'min', 'мин'],
    pal: ['пал.', 'Pal.', 'pal.', 'пал.'],
    m3: ['м³', 'm³', 'm³', 'м³'],
    pct: ['%', '%', '%', '%'],
    c: ['°C', '°C', '°C', '°C'],
    l: ['л', 'l', 'l', 'л'],
  };
  /* 0.3.11 fmtDate formats every timestamp in Asia/Almaty (UTC+5, no DST): the instant is shifted so the local getters read KZ wall time.
     A user in Berlin sees the same "14:30" as the dispatcher in Astana and the header clock. */
  const KZ_OFF = 300;
  const kz = iso => { const d = iso instanceof Date ? iso : new Date(iso); return new Date(d.getTime() + (d.getTimezoneOffset() + KZ_OFF) * 60000); };
  const lc = {
    profile: P,
    /** time zone of every formatted timestamp (FR-221 / 0.3.11 fmtDate): Asia/Almaty, UTC+5 */
    tz: 'Asia/Almaty',
    /** Date shifted so that getHours() etc. read Kazakhstan wall time: LF.kz(iso).getHours() */
    kz,
    /** yyyy-mm-ddThh:mm in Kazakhstan time (value of a datetime-local input) */
    local: iso => { const d = kz(iso); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()); },
    /** hh:mm:ss in Kazakhstan time (header clock, audit stamps) */
    time: iso => { const d = kz(iso); return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); },
    /** dd.mm.yyyy hh:mm in Kazakhstan time (records tables) */
    dtFull: iso => { const d = kz(iso); return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); },
    /** grouped number (no-break space groups, decimals as the number has them, separator of the language): 12 345 */
    n: v => Number(v).toLocaleString(P.num).replace(',', P.dec),
    /** rounded integer, grouped: LF.int(12345.6) = "12 346" */
    int: v => Math.round(v).toLocaleString(P.num),
    /** fixed decimals, grouped with plain spaces (amounts in tables / documents): LF.fix(1234.5, 2) = "1 234,50" (RU) */
    fix: (v, d) => Number(v).toLocaleString(P.num, { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/[  ]/g, ' ').replace(',', P.dec),
    /** decimal without grouping, separator of the UI language; d = fixed digits (toFixed), omitted = as the value prints */
    dec: (v, d) => (d == null ? String(v) : Number(v).toFixed(d)).replace('.', P.dec),
    /** tenge, plain-space groups: LF.kzt(1234.4) = "1 234 ₸" */
    kzt: v => Math.round(v).toLocaleString(P.num).replace(/[  ]/g, ' ') + ' ₸',
    /** dd.mm.yyyy */
    date: iso => {
      const d = kz(iso);
      return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
    },
    /** dd.mm, hh:mm */
    dt: iso => {
      const d = kz(iso);
      return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    },
    /** minutes of the day -> hh:mm (wraps at 24 h) */
    hm: m => {
      const x = Math.floor(m + 1e-9);
      return pad(Math.floor(x / 60) % 24) + ':' + pad(x % 60);
    },
    /** unit label in the UI language; LF.unit('km') = "km" (EN) / "км" (RU) */
    unit: u => {
      const r = UNITS[u];
      return r ? r[LI] : u;
    },
    /** value + unit: LF.q(12345, 'km') = "12 345 km"; decimals use LF.dec */
    q: (v, u, d) => (Number.isInteger(+v) && d == null ? lc.n(v) : lc.dec(v, d)) + ' ' + lc.unit(u),
    /** signed temperature: +4,5 °C / −18 °C style used by the chips ("+" only above zero) */
    temp: v => (v > 0 ? '+' : '') + lc.dec(v) + ' °C',
  };
  return lc;
})();
