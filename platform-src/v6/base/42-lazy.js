/* FR-197 lazy demo data: lazy('name', () => value) replaces S.name = value; the first read of S.name builds it once (memoised, seeded),
   then S.name is a plain field. lazyForce(n) builds now, lazyBuilt(n) asks, lazyReset(n) re-arms (demo reset), lazyHash(v) fingerprints data,
   lazyFn(n, fn) returns a getter for a collection kept in a closure. A builder must not depend on when it runs (reset its own counters). */
const LAZY = {};
const LAZY_LOG = [];
function lazyHash(v) {
  let s;
  try { s = JSON.stringify(v); } catch (_) { s = String(v); }
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(16).padStart(8, '0') + ':' + s.length;
}
function lazyKeep(name, v) {
  Object.defineProperty(S, name, { value: v, writable: true, enumerable: true, configurable: true });
}
function lazyArm(name) {
  const rec = LAZY[name];
  rec.built = false;
  Object.defineProperty(S, name, {
    configurable: true,
    enumerable: true,
    get() { return lazyForce(name); },
    set(v) { rec.built = true; lazyKeep(name, v); },
  });
}
function lazy(name, fn) {
  if (typeof fn !== 'function') throw new Error('lazy(' + name + '): the builder must be a function');
  LAZY[name] = { fn, built: false, building: false, own: false, val: undefined };
  lazyArm(name);
}
function lazyFn(name, fn) {
  if (typeof fn !== 'function') throw new Error('lazyFn(' + name + '): the builder must be a function');
  LAZY[name] = { fn, built: false, building: false, own: true, val: undefined };
  return () => lazyForce(name);
}
function lazyForce(name) {
  const rec = LAZY[name];
  if (!rec) return S[name];
  if (rec.built) return rec.own ? rec.val : S[name];
  if (rec.building) throw new Error('lazy: ' + name + ' is read inside its own builder');
  rec.building = true;
  let v;
  try { v = rec.fn(); } finally { rec.building = false; }
  rec.built = true;
  if (rec.own) rec.val = v;
  else lazyKeep(name, v);
  LAZY_LOG.push(name);
  return v;
}
function lazyBuilt(name) { return !LAZY[name] || LAZY[name].built; }
function lazyReset(name) {
  const rec = LAZY[name];
  if (!rec) return;
  if (rec.own) { rec.built = false; rec.val = undefined; }
  else lazyArm(name);
}
function lazyNames() { return Object.keys(LAZY); }
