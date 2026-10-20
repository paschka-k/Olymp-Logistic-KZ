/* FR-201 · Shared export helper for CSV / JSON / Excel / PDF demo exports (replaces 14 copies in the screens).
   One place for: BOM (Excel reads UTF-8), separator ";" (Excel in RU / DE / KK locales), quoting, the formula-injection guard
   (a text cell starting with = + - @ TAB CR gets a leading apostrophe, numbers stay numbers), dated file names, and the
   download itself. The test harness records every download in w.__downloads (tests/template.html) - no Save-as dialogs.
   XP.csv(rows)                    text of a CSV file (BOM + ; + quotes + guard)
   XP.save(name, text, mime)       download any text file (also the fallback when the browser blocks it: silent)
   XP.saveCsv(name, rows, opts)    csv + save (Excel demo export = the same file: Excel opens .csv)
   XP.saveJson(name, obj)          pretty JSON
   XP.openDoc(html)                "PDF" demo: an HTML document opened in a new tab for printing (Save as PDF)
   XP.name(base, ext, date?)       'base-2026-10-18.ext' - dated name from the demo clock (never the wall clock) */
const XP = (() => {
  const GUARD = /^[=+\-@\t\r]/,
    PLAIN_NUM = /^[+-]?\d+([.,]\d+)?$/;
  const guard = v => {
    if (v == null) return '';
    if (typeof v === 'number') return String(v);
    const s = String(v);
    return GUARD.test(s) && !PLAIN_NUM.test(s) && s !== '-' ? "'" + s : s;
  };
  const cell = v => '"' + guard(v).replace(/"/g, '""') + '"';
  const xp = {
    guard,
    /** CSV text. opts: { eol: '\n' | '\r\n', quote: 'all' | 'min' (quote only when needed), bom: true } */
    csv: (rows, o = {}) => {
      const q = o.quote === 'min' ? v => (/[;"\n\r]/.test(guard(v)) ? cell(v) : guard(v)) : cell;
      return (o.bom === false ? '' : '﻿') + rows.map(r => r.map(q).join(';')).join(o.eol || '\n');
    },
    save: (name, text, mime, attrs) => {
      try {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain' }));
        a.download = name;
        if (attrs) Object.assign(a.dataset, attrs);
        a.click();
      } catch (_) {
        /* no download available (sandboxed frame): the screen still shows its toast */
      }
    },
    saveCsv: (name, rows, o) => xp.save(name, xp.csv(rows, o), 'text/csv', o && o.attrs),
    saveJson: (name, obj) => xp.save(name, JSON.stringify(obj, null, 2), 'application/json'),
    openDoc: html => {
      try {
        window.open(URL.createObjectURL(new Blob([html], { type: 'text/html' })), '_blank', 'noopener');
      } catch (_) {
        /* pop-up blocked */
      }
    },
    name: (base, ext, date) => base + '-' + (date || clockNow().toISOString().slice(0, 10)) + '.' + ext,
  };
  return xp;
})();
