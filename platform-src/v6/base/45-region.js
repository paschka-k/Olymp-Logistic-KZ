/* FR-193 / FR-194 · render regions and live nodes.
   render() (core.js) stays the one FULL render: it rebuilds #root and runs every wrapper (shell, driver app, help, a11y). renderRegion(name)
   rebuilds only what changed — 'main' (page head + content), 'drawer', 'topbar' or 'toast' — keeps the focus (control, caret) and the scroll
   positions, leaves the other regions untouched (an open drawer keeps its focus trap while main is redrawn) and runs the same after-render
   hooks for that region only: the shell title/URL, the help buttons, the a11y pass. It is synchronous like render(): the DOM is ready on return.
   The telemetry tick does not render at all: it updates the nodes marked data-live="<key>" through the functions bound with liveBind(). */

const REGION_HOOKS = { before: [], after: [] };
/** hook of a region render: phase 'before' (returns a state handed to 'after') or 'after'; lower prio runs first */
function regionHook(phase, prio, fn) { const l = REGION_HOOKS[phase]; l.push({ prio, fn }); l.sort((a, b) => a.prio - b.prio); }
/** how often each region was rebuilt (read by tests and the perf probe) */
const REGION_COUNT = { main: 0, drawer: 0, topbar: 0, toast: 0, fallback: 0 };
const REGIONS = {};
/** the region an action redraws (FR-193): ACTION_DEFS[name].region, 'main' by default */
function actionRegion(name) { return ((typeof ACTION_REGISTRY !== 'undefined' && ACTION_REGISTRY[name]) || {}).region || 'main'; }

/* what must survive a rebuild: the focused control (by id, else by tag + data attribute + position) with its caret, and the typed value of drawer fields */
function regionFocusKey(el, nodes) {
  if (!el || el === document.body || !nodes.some(n => n && n.contains(el))) return null;
  let sel = el.tagName.toLowerCase();
  if (el.id) return { id: el.id, a: selOf(el) };
  ['data-f', 'data-test', 'data-act', 'name', 'data-id'].some(a => { const v = el.getAttribute(a); if (v == null) return false; sel += '[' + a + '="' + String(v).replace(/["\\]/g, '\\$&') + '"]'; return true; });
  return { sel, n: [...document.querySelectorAll(sel)].indexOf(el), a: selOf(el) };
}
function selOf(el) { try { return el.selectionStart == null ? null : [el.selectionStart, el.selectionEnd, el.selectionDirection]; } catch (_) { return null; } }
/* a field without the selection API (type="email", "number", …) cannot get its caret back by setSelectionRange: after focus() the caret sat at
   the start, so a screen that redraws on every key wrote the text backwards ("clasberg" -> "grebsalc", booking form, payer e-mail). The rebuilt
   copy is swapped for the very element the person is typing in, which keeps its caret, IME state and undo; the fresh attributes are copied over. */
const CARET_SKIP = /^(checkbox|radio|button|submit|reset|file|range|color|hidden|image)$/;
function caretNodeOf(el) { return el && el.tagName === 'INPUT' && el.id && !CARET_SKIP.test(el.type) && selOf(el) == null ? el : null; }
function caretNodeBack(old) {
  if (!old) return;
  const n = document.getElementById(old.id);
  if (!n || n === old || n.tagName !== 'INPUT' || n.type !== old.type) return;
  [...old.attributes].forEach(a => { if (!n.hasAttribute(a.name)) old.removeAttribute(a.name); });
  [...n.attributes].forEach(a => { if (old.getAttribute(a.name) !== a.value) old.setAttribute(a.name, a.value); });
  if (n.value !== old.value) old.value = n.value;   // the screen normalised what was typed: its value wins
  n.replaceWith(old);
}
function regionFocusBack(k) {
  if (!k) return;
  const e = k.id ? document.getElementById(k.id) : [...document.querySelectorAll(k.sel)][k.n];
  if (!e) return;
  try { e.focus({ preventScroll: true }); } catch (_) { e.focus(); }
  if (k.a) try { e.setSelectionRange(k.a[0], k.a[1], k.a[2] || undefined); } catch (_) { /* not a text field */ }
}
const drawerEl = () => document.querySelector('#root .app > aside.drawer');

REGIONS.main = {
  ready: () => !!(document.querySelector('#main-content > .page-head') && document.querySelector('#main-content > .content')),
  nodes: () => ['#main-content > .print-head', '#main-content > .page-head', '#main-content > .content'].map(s => document.querySelector(s)).filter(Boolean),
  build: () => { const body = shellContent(), ph = typeof printHead === 'function' ? printHead() : ''; return { body, ph, head: shellHead() }; },
  apply: b => {
    const m = document.getElementById('main-content'), old = m.querySelector(':scope > .print-head');
    if (old) { if (b.ph) old.outerHTML = b.ph; else old.remove(); } else if (b.ph) m.insertAdjacentHTML('afterbegin', b.ph);
    m.querySelector(':scope > .page-head').outerHTML = b.head;
    m.querySelector(':scope > .content').innerHTML = b.body;
    return [m.querySelector(':scope > .page-head'), m.querySelector(':scope > .content')];
  },
};
REGIONS.topbar = {
  ready: () => !!document.querySelector('#main-content > .topbar'),
  nodes: () => [document.querySelector('#main-content > .topbar')],
  build: () => shellTop(),
  apply: h => { const t = document.querySelector('#main-content > .topbar'); t.outerHTML = h; return [document.querySelector('#main-content > .topbar')]; },
};
REGIONS.toast = {
  ready: () => !!document.querySelector('#root .app > .toast-live'),
  nodes: () => [],
  build: () => toastInner(),
  apply: h => { const t = document.querySelector('#root .app > .toast-live'); t.innerHTML = h; return []; },
};
REGIONS.drawer = {
  ready: () => !!document.querySelector('#root .app > .toast-live'),
  nodes: () => [drawerEl()].filter(Boolean),
  build: () => drawerHtml(),
  apply: h => {
    const old = drawerEl();
    if (old && h) old.outerHTML = h; else if (old) old.remove();
    else if (h) (document.querySelector('#root .app > .a11y-back') || document.querySelector('#root .app > .toast-live')).insertAdjacentHTML('beforebegin', h);
    return [drawerEl()].filter(Boolean);
  },
};

function renderRegion(name) {
  const R = REGIONS[name], root = document.getElementById('root');
  /* no shell yet, an unknown region, or a screen whose canvas is redrawn by the full-render wrapper (driver signature pad) → the full render */
  if (!R || !root || !R.ready() || (name === 'main' && document.getElementById('da_sig'))) { REGION_COUNT.fallback++; return render(); }
  REGION_COUNT[name]++;
  const states = REGION_HOOKS.before.map(h => { try { return h.fn(name); } catch (e) { console.error(e); return null; } });
  const old = R.nodes(), caretEl = caretNodeOf(document.activeElement), caretNode = caretEl && old.some(n => n && n.contains(caretEl)) ? caretEl : null, keep = {
    focus: regionFocusKey(document.activeElement, old),
    sc: name === 'toast' ? null : scrollKeep(),
    y: name === 'main' ? (document.getElementById('main-content') || {}).scrollTop || 0 : 0,
    fields: {},
  };
  if (name === 'drawer') document.querySelectorAll('#root .app > aside.drawer input[id], #root .app > aside.drawer select[id], #root .app > aside.drawer textarea[id]').forEach(e => { keep.fields[e.id] = e.type === 'checkbox' ? e.checked : e.value; });
  const built = R.build(), fresh = R.apply(built);
  caretNodeBack(caretNode);   // decided before apply: the old region nodes no longer contain the field once rebuilt
  fresh.forEach(n => { if (n) nameControls(n); });
  Object.keys(keep.fields).forEach(id => { const e = document.getElementById(id); if (e && e.closest('.drawer')) { if (e.type === 'checkbox') e.checked = keep.fields[id]; else e.value = keep.fields[id]; } });
  if (name === 'main') { const m = document.getElementById('main-content'); if (m) m.scrollTop = keep.y; }
  if (keep.sc) scrollRestore(keep.sc);
  regionFocusBack(keep.focus);
  REGION_HOOKS.after.forEach((h, i) => { try { h.fn(name, states, fresh); } catch (e) { console.error(e); } });
  /* the hooks add buttons to the page head (diagram, help): the browser's scroll anchoring may have moved the page meanwhile */
  if (name === 'main') { const m = document.getElementById('main-content'); if (m && m.scrollTop !== keep.y) m.scrollTop = keep.y; }
  if (keep.sc) scrollRestore(keep.sc);
}
globalThis.renderRegion = renderRegion; globalThis.regionHook = regionHook; globalThis.actionRegion = actionRegion;
globalThis.REGION_COUNT = REGION_COUNT; globalThis.REGION_HOOKS = REGION_HOOKS;
/* the help buttons / tour layer are added by the full-render wrapper of help/00-framework.js through HELP.afterRender: a rebuilt page head needs them too */
regionHook('after', 20, name => { if (name === 'main' && typeof HELP !== 'undefined' && HELP.afterRender) HELP.afterRender.forEach(f => { try { f(); } catch (e) { console.error(e); } }); });

/* ---------- live nodes (FR-194) ---------- */
const LIVE_FNS = {};
/** liveBind('pos', node => …): node is any element carrying data-live="pos"; liveUpdate() calls the functions bound to its key */
function liveBind(key, fn) { (LIVE_FNS[key] || (LIVE_FNS[key] = [])).push(fn); }
function liveUpdate(root) {
  const nodes = (root || document).querySelectorAll('[data-live]');
  for (let i = 0; i < nodes.length; i++) {
    const fs = LIVE_FNS[nodes[i].getAttribute('data-live')];
    if (fs) for (let j = 0; j < fs.length; j++) { try { fs[j](nodes[i]); } catch (e) { console.error(e); } }
  }
}
globalThis.liveBind = liveBind; globalThis.liveUpdate = liveUpdate;
