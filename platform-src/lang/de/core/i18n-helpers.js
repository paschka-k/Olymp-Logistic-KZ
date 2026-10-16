const LANG = 'de';
const X = (r, d, e) => LANG === 'de' ? d : LANG === 'en' ? e : r;
const CN = (r, l) => LANG === 'ru' ? r : l;
const fmt = (n, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toFixed(d).replace('.', ',').replace('-', '−');
const sg = n => (n > 0 ? '+' : '') + fmt(n, 0);
const C_OK = { bg:'oklch(0.94 0.06 150)', fg:'oklch(0.36 0.11 150)', bc:'oklch(0.72 0.12 150)' }, C_WARN = { bg:'oklch(0.95 0.09 92)', fg:'oklch(0.40 0.09 75)', bc:'oklch(0.80 0.13 88)' }, C_RISK = { bg:'oklch(0.88 0.14 85)', fg:'oklch(0.34 0.08 70)', bc:'oklch(0.70 0.15 80)' }, C_BAD = { bg:'oklch(0.55 0.19 27)', fg:'#ffffff', bc:'oklch(0.55 0.19 27)' };
const LV = [
  { label: 'Normal', ...C_OK, bgSoft: 'transparent' },
  { label: 'Achtung', ...C_WARN, bgSoft: 'transparent' },
  { label: 'Risiko', ...C_RISK, bgSoft: 'oklch(0.97 0.05 90)' },
  { label: 'Kritisch', ...C_BAD, bgSoft: 'oklch(0.95 0.04 27)' }
];
