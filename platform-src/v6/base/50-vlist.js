/* FR-195 (R05) · KIT.vlist: windowing for long tables. Only the rows in (and just around) the visible part of the scroll box are in the DOM;
   the rest is two spacer rows whose height is rows x row height, so the scroll bar is true for all rows. The scroll box is a keyboard-focusable
   region (arrows, PageUp/PageDown, Home/End scroll it natively), the table carries aria-rowcount and every row aria-rowindex, so a screen reader
   knows the real position. Before printing the whole table is put into the DOM (beforeprint), afterwards the window comes back.
   KIT.vlist({ id, head: [titles], rows: [data], row: (r, i) => '<tr>…</tr>', total?, sig?, h?, rowH?, cols?, label, empty?, nofilter?, action?, attrs? })
   id    = id of the <table> (and key of the scroll state that survives render()); sig = signature of the filters: a change scrolls back to the top;
   total = rows before filtering (the counter reads "N из M"); label = accessible name of the scroll box. vlistCount(id) = rows now in the DOM,
   vlistTo(id, index) scrolls to a row. Row height is measured after the first paint, so rows of two lines need no hand-set value. */
const VLS = {};   // id → { ctx, sig, top, rowH } — what survives a render()
const VL = {};    // id → the entry of the table now on the page { rows, row, rowH, h, over, a, b, meas }
const vlCtx = () => S.route + '|' + ((S.tab && S.tab[S.route]) || '');
const vlSp = px => px > 0 ? `<tr class="vl-sp" aria-hidden="true"><td colspan="99" style="height:${Math.round(px)}px;padding:0;border:0"></td></tr>` : '';
const vlScroller = id => document.querySelector('[data-vlist="' + id + '"]');
function vlRows(e, a, b) {
  let h = '';
  for (let i = a; i < b; i++) {
    const r = String(e.row(e.rows[i], i));
    if (!/^\s*<tr/.test(r)) console.warn('KIT.vlist: row() of ' + e.id + ' must return a <tr>; aria-rowindex skipped');
    h += r.replace(/^\s*<tr/, '<tr aria-rowindex="' + (i + 2) + '"');
  }
  return h;
}
/** paints the rows around the scroll position (all = the whole table, for printing); skips when the rows on the page still cover the view */
function vlPaint(id, all) {
  const e = VL[id], sc = vlScroller(id), tb = sc && sc.querySelector('tbody'); if (!e || !tb) return;
  const n = e.rows.length, rh = e.rowH, top = sc.scrollTop, vh = sc.clientHeight || e.h;
  let a = 0, b = n;
  if (!all) {
    const v0 = Math.floor(top / rh), v1 = Math.ceil((top + vh) / rh);
    if (e.a != null && v0 >= e.a && v1 <= e.b) return;
    a = Math.max(0, v0 - e.over); b = Math.min(n, v1 + e.over);
  }
  e.a = a; e.b = b;
  /* the focused control of a row (a button in the "Действие" column) dies with the old rows: remember row + control, give the focus back afterwards */
  const fa = document.activeElement, ftr = fa && tb.contains(fa) && fa.closest('tr:not(.vl-sp)'), fk = ftr && { row: ftr.getAttribute('aria-rowindex'), tag: fa.tagName, act: fa.getAttribute('data-act'), n: [...ftr.querySelectorAll(fa.tagName)].indexOf(fa) };
  tb.innerHTML = vlSp(a * rh) + vlRows(e, a, b) + vlSp((n - b) * rh);
  if (fk) {
    const nr = tb.querySelector('tr[aria-rowindex="' + fk.row + '"]'), ne = nr && nr.querySelectorAll(fk.tag)[fk.n];
    try { (ne && ne.getAttribute('data-act') === fk.act ? ne : sc).focus({ preventScroll: true }); } catch (_) { /* not focusable */ }   // the row left the window: the scroll box keeps the keyboard
  }
  /* the real height of a row replaces the first guess once; the first visible row stays where it is */
  const dr = tb.querySelectorAll('tr:not(.vl-sp)');
  if (!e.meas && !all && dr.length) {
    e.meas = 1;
    let sum = 0; dr.forEach(r => { sum += r.getBoundingClientRect().height; });
    const m = sum / dr.length;
    if (m > 8 && Math.abs(m - rh) > 0.5 && b - a < n) { VLS[id].rowH = e.rowH = m; sc.scrollTop = VLS[id].top = Math.round(top / rh * m); e.a = null; vlPaint(id); }
  }
}
/** a freshly built table: scroll to the remembered position and paint (the full render restores scroll positions of its own, the region render too) */
function vlSync() {
  document.querySelectorAll('[data-vl-fresh]').forEach(sc => {
    sc.removeAttribute('data-vl-fresh');
    const id = sc.dataset.vlist, t = +sc.dataset.vlTop || 0;
    if (sc.scrollTop !== t) sc.scrollTop = t;
    if (VL[id]) { VL[id].a = null; vlPaint(id); }
  });
}
KIT.vlist = o => {
  const rows = o.rows || [], n = rows.length, id = o.id, head = o.head, cols = o.cols || head.length, total = o.total != null ? o.total : n;
  const ctx = vlCtx(), old = VLS[id], st = old && old.ctx === ctx && old.sig === o.sig ? old : (VLS[id] = { ctx, sig: o.sig, top: 0, rowH: old && old.rowH });
  const rh = st.rowH || o.rowH || 44, h = o.h || 440, over = o.over || 8;
  const count = `<div class="vl-count sub" data-vlist-count="${esc(id)}">${LF.int(n)} ${esc(T('из', 'von', 'of', '/'))} ${LF.int(total)}</div>`;
  if (!n) { delete VL[id]; return KIT.table(head, '', { id, cols, empty: o.empty, nofilter: o.nofilter, action: o.action, attrs: o.attrs }) + count; }
  const top = Math.max(0, Math.min(st.top, n * rh - h));
  const e = VL[id] = { id, rows, row: o.row, rowH: rh, h, over, a: null, b: null, meas: 0 };
  const v0 = Math.floor(top / rh), v1 = Math.ceil((top + h) / rh), a = Math.max(0, v0 - over), b = Math.min(n, v1 + over);
  e.a = a; e.b = b;
  queueMicrotask(vlSync);
  return `<div class="vl-box"><div class="tcard vl" data-vlist="${esc(id)}" data-vl-fresh="1" data-vl-top="${Math.round(top)}" tabindex="0"${o.label ? ` role="region" aria-label="${esc(o.label)}"` : ''} style="max-height:${h}px"><table class="table" data-test="table" id="${esc(id)}" aria-rowcount="${n + 1}"${o.attrs ? ' ' + o.attrs : ''}><thead><tr>${head.map(t => `<th scope="col">${esc(t)}</th>`).join('')}</tr></thead><tbody>${vlSp(a * rh)}${vlRows(e, a, b)}${vlSp((n - b) * rh)}</tbody></table></div>${count}</div>`;
};
globalThis.vlistCount = id => { const sc = vlScroller(id); return sc ? sc.querySelectorAll('tbody tr:not(.vl-sp)').length : 0; };
/* approximate when the rows differ in height: the position is index x the measured average row height */
globalThis.vlistTo = (id, index) => {
  const sc = vlScroller(id), e = VL[id]; if (!sc || !e) return;
  for (let k = 0; k < 2; k++) { const rh = e.rowH; sc.scrollTop = VLS[id].top = Math.round(Math.max(0, index) * rh); vlPaint(id); if (e.rowH === rh) break; }   // the first paint may measure a new row height
};
/* the scroll event does not bubble: it is caught on the way down */
document.addEventListener('scroll', ev => {
  const sc = ev.target; if (!sc || !sc.dataset || !sc.dataset.vlist || sc.hasAttribute('data-vl-fresh')) return;
  if (VLS[sc.dataset.vlist]) VLS[sc.dataset.vlist].top = sc.scrollTop;
  vlPaint(sc.dataset.vlist);
}, true);
regionHook('after', 30, () => vlSync());
/* print: every row, not the window */
window.addEventListener('beforeprint', () => { Object.keys(VL).forEach(id => vlPaint(id, true)); });
window.addEventListener('afterprint', () => { Object.keys(VL).forEach(id => { if (VL[id]) { VL[id].a = null; vlPaint(id); } }); });
try { document.head.insertAdjacentHTML('beforeend', '<style>.vl{overflow:auto;overflow-anchor:none} .vl:focus-visible{outline:2px solid var(--primary);outline-offset:-2px} .vl thead th{position:sticky;top:0;z-index:1;background:var(--bg-surface)} .vl-count{padding:8px 16px} @media print{.vl{max-height:none!important;overflow:visible}}</style>'); } catch (_) { /* no document */ }
