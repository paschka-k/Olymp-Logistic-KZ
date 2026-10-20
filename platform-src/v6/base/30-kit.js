/* FR-200 · Shared UI kit: ONE implementation each for table, filter bar, KPI tile, drawer, form field and chip (+ key/value row and
   drawer section). Screens call KIT.* instead of carrying their own copies (the 12 identical `tk`, 10 `kv`, 9 `sel` helpers and the
   ~40 hand-written <table> shells are gone); look and behaviour change in one place. All markup uses the design-system classes of
   shared/design/components.css; texts that belong to the kit come from the `kit` string table (FR-199).
   Loaded after the base helpers and before core.js: only esc / ic / LT, which core.js defines with function-level hoisting below,
   are resolved when a KIT function RUNS (never at load time). */
const KIT = {
  /** coloured KPI tile: KIT.kpi('blue', 'truck', 12, 'Vehicles') */
  kpi: (cls, ico, val, label) =>
    `<div class="kpi-tile tint ${cls}" data-test="kpi"><div><div class="value">${val}</div><div class="label">${esc(label)}</div></div><div class="icon" style="background:var(--${cls});color:#fff;border-radius:50%">${ic(ico, 18)}</div></div>`,
  /** KPI tile with a sub line under the label (SLA, reports) */
  kpiSub: (cls, ico, val, label, sub) =>
    `<div class="kpi-tile tint ${cls}" data-test="kpi"><div><div class="value">${val}</div><div class="label">${esc(label)}</div>${sub ? `<div class="delta">${esc(sub)}</div>` : ''}</div><div class="icon" style="background:var(--${cls});color:#fff;border-radius:50%">${ic(ico, 18)}</div></div>`,
  /** white KPI tile with a delta line (dashboard) */
  kpiDelta: (cls, ico, label, val, sub, subCls) =>
    `<div class="kpi-tile" data-test="kpi"><div><div class="label">${esc(label)}</div><div class="value">${val}</div><div class="delta ${subCls || ''}">${sub}</div></div><div class="icon" style="background:var(--tint-${cls}-100);color:var(--label-${cls})">${ic(ico, 20)}</div></div>`,
  /** key / value cell of a detail grid (v is HTML, k is text) */
  kv: (k, v) => `<div><small>${esc(k)}</small><b>${v}</b></div>`,
  /** status chip: KIT.chip('green', 'On time'); attrs = raw attributes, e.g. 'data-test="issue:hub"' */
  chip: (c, t, attrs) => `<span class="chip ${c}"${attrs ? ' ' + attrs : ''}>${esc(t)}</span>`,
  /** <select> of a filter bar bound to a state object through a data attribute:
      const sel = KIT.filterSelect('data-f', () => S.f);  sel('status', 'Status', [['', 'All'], ['x', 'X']]) */
  filterSelect: (attr, state) => (key, label, opts) =>
    `<label>${esc(label)}:</label><select class="select" ${attr}="${key}">${opts.map(o => `<option value="${esc(o[0])}"${state()[key] === o[0] ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`,
  /** filter bar container around already built controls */
  filterBar: (html, attrs) => `<div class="filters"${attrs ? ' ' + attrs : ''}>${html}</div>`,
  /** card with a table: head = column titles (text), bodyHtml = <tr> rows. o = { id, attrs (raw attributes, e.g. 'data-list'),
      cols (colspan of the empty row, default head.length), empty (text of the empty row; false = no empty row) } */
  table: (head, bodyHtml, o = {}) =>
    `<div class="card tcard"><table class="table" data-test="table"${o.id ? ` id="${o.id}"` : ''}${o.attrs ? ' ' + o.attrs : ''}><thead><tr>${head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${bodyHtml || (o.empty === false ? '' : `<tr><td colspan="${o.cols || head.length}" class="empty">${esc(o.empty || LT('kit.empty'))}</td></tr>`)}</tbody></table></div>`,
  /** labelled text input of the account / settings forms: KIT.field('au_name', 'Name', 'text', value, 'placeholder') */
  field: (id, label, type, val, hint) =>
    `<label class="fl">${esc(label)}<input class="inp" id="${id}" data-au="${id.slice(3)}" type="${type}" value="${esc(val || '')}" autocomplete="off"${hint ? ` placeholder="${esc(hint)}"` : ''}></label>`,
  /** heading of a drawer section: opens <div class="drawer-section"> (close it with </div>) */
  sectionHead: title => `<div class="drawer-section"><h4>${esc(title)}</h4>`,
  /** drawer frame (labelled modal dialog, FR-215): r = { title, html, xl } as returned by DRAWERS[type] */
  drawer: r =>
    `<aside class="drawer open${r.xl ? ' xl' : ''}" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabindex="-1" data-test="drawer"><div class="drawer-head"><span id="drawer-title">${esc(r.title)}</span><button type="button" class="x" data-test="drawer-close" data-act="close" aria-label="${esc(LT('core.close'))}">${ic('x', 18)}</button></div>${r.html}</aside>`,
};
