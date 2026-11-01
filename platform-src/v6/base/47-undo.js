/* FR-214 (R10) · Undo toast: toastUndo(msg, undoFn, {ms: 10000, audit}); one slot S.undo, ACT.undoToast runs it once and appends an audit entry; the registry flag is {undo: {msg, snap, revert, watch?, ms?, audit?}}. */
let UNDO_SEQ = 0;
const UNDO_PENDING = new Map();   // id -> { fn, timer, opts, msg }
function undoExpire(id) {
  const p = UNDO_PENDING.get(id); if (!p) return;
  UNDO_PENDING.delete(id); clearTimeout(p.timer);
  if (S.undo && S.undo.id === id) { S.undo = null; renderRegion('toast'); }
}
function toastUndo(msg, undoFn, opts) {
  const o = opts || {}, ms = o.ms > 0 ? o.ms : 10000;
  if (S.undo) undoExpire(S.undo.id);   // the previous action becomes final
  const id = ++UNDO_SEQ;
  UNDO_PENDING.set(id, { fn: undoFn, opts: o, msg, timer: setTimeout(() => undoExpire(id), ms) });
  S.undo = { id, msg: String(msg), ms, until: clockNow().getTime() + ms };
  renderRegion('toast');
  return id;
}
/** run the current undo (the toast button); false when there is nothing to undo any more */
function undoRun() {
  const cur = S.undo, p = cur && UNDO_PENDING.get(cur.id); if (!p) return false;
  UNDO_PENDING.delete(cur.id); clearTimeout(p.timer); S.undo = null;
  if (p.fn) p.fn();
  const a = p.opts.audit;
  if (a !== false) { const x = a && typeof a === 'object' ? a : {}; audit(x.module || 'Undo', x.subject || p.msg, LT('undo.audit_decision'), x.reason || p.msg, x.code || 'undo.revert'); }
  toast(LT('undo.done'));
  return true;
}
(function () {
  const bind0 = bindActions;
  bindActions = function () {
    bind0();
    for (const [name, meta] of Object.entries(ACTION_REGISTRY)) {
      const u = meta.undo, fn = ACT[name];
      if (!u || !fn || fn.__undo) continue;
      if (typeof u.revert !== 'function') throw new Error('action ' + name + ': undo needs a revert function');
      const wrapped = function (d, el, e) {
        const snap = u.snap ? u.snap(d) : null, before = u.watch ? u.watch(d) : null;
        const r = fn.call(this, d, el, e);
        if (u.watch && u.watch(d) === before) return r;   // nothing changed (a refused click): no toast
        toastUndo(typeof u.msg === 'function' ? u.msg(d) : u.msg || name, () => u.revert(snap, d), { ms: u.ms, audit: u.audit });
        return r;
      };
      Object.keys(fn).forEach(k => { wrapped[k] = fn[k]; });
      wrapped.__undo = true;
      ACT[name] = wrapped;
    }
  };
})();
try { document.head.insertAdjacentHTML('beforeend', '<style>.toast.undo{bottom:76px;display:flex;align-items:center;gap:14px}</style>'); } catch (_) { /* no document */ }
