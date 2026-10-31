/* FR-202 · Typed state model: JSDoc types for the demo state, a schema check at startup, and a named action registry that
   feeds the audit log. This is a mock-up: the state is a plain object S in the browser, so the "types" are documentation for
   editors (VS Code reads the JSDoc) plus a runtime check that fails loudly when a seed or a screen writes a malformed record.

   @typedef {'unassigned'|'assigned'|'loading'|'in_transit'|'delivered'|'problem'} LoadStatus
   @typedef {'frozen'|'chilled'|'pharma'|'ambient'} ZoneId
   @typedef {Object} Load           one transport order / trip
   @property {string} id            'LD-2026-001847'
   @property {string} cust          customer id (CUSTOMERS)
   @property {string} from          hub code (HUBS), e.g. 'AST'
   @property {string} to
   @property {ZoneId} zone          temperature zone (ZONES)
   @property {number} pallets
   @property {number} kg
   @property {'high'|'medium'|'low'} priority
   @property {LoadStatus} status
   @property {string} eta           ISO date-time
   @property {?string} driver       driver id or 'p:<partner>' when handed to a partner
   @property {?string} truck
   @property {number} temp          current chamber temperature, deg C
   @property {number} progress      0..1
   @property {Array<{who:string,t:string,text:string}>} notes
   @typedef {Object} Driver         { id, code, name, rto (h of driving time left), status 'available'|'busy'|'rest', docs[] ... }
   @typedef {Object} Truck          { id, plate, zones[], cap (pallet places), status 'available'|'busy'|'service', docs{}, svc{} ... }
   @typedef {Object} AuditEntry     { t, user, module, subject, decision, reason, seq, role, prev, hash }
   @typedef {Object} AppState       S: { loads, drivers, trucks, audit, route, role, drawer, tab{}, f{}, clock, costs[] ... }
*/

/* ---------- schema ---------- */
const SCHEMA_ENUM = {
  loadStatus: () => ORDER,
  priority: () => ['high', 'medium', 'low'],
  zone: () => Object.keys(ZONES),
  hub: () => Object.keys(HUBS),
  driverStatus: () => ['available', 'busy', 'rest'],
  truckStatus: () => ['available', 'busy', 'service'],
};
/* field -> 'string' | 'number' | 'array' | 'object' | 'isoDate' | ['enum', name] ; trailing '?' allows null / undefined */
const STATE_SCHEMA = {
  loads: {
    id: 'string',
    cust: 'string',
    from: ['enum', 'hub'],
    to: ['enum', 'hub'],
    zone: ['enum', 'zone'],
    pallets: 'number',
    kg: 'number',
    priority: ['enum', 'priority'],
    status: ['enum', 'loadStatus'],
    eta: 'isoDate',
    driver: 'string?',
    truck: 'string?',
    temp: 'number',
    progress: 'number',
    notes: 'array',
  },
  drivers: { id: 'string', code: 'string', name: 'string', rto: 'number', status: ['enum', 'driverStatus'], docs: 'array' },
  trucks: { id: 'string', plate: 'string', zones: 'array', cap: 'number', status: ['enum', 'truckStatus'], docs: 'object' },
};
function schemaCheck(state) {
  const st = state || S,
    bad = [];
  const test = (kind, v) => {
    const opt = typeof kind === 'string' && kind.endsWith('?'),
      k = opt ? kind.slice(0, -1) : kind;
    if (v == null) return opt;
    if (Array.isArray(k)) return SCHEMA_ENUM[k[1]]().includes(v);
    if (k === 'number') return typeof v === 'number' && isFinite(v);
    if (k === 'array') return Array.isArray(v);
    if (k === 'object') return typeof v === 'object' && !Array.isArray(v);
    if (k === 'isoDate') return typeof v === 'string' && !isNaN(Date.parse(v));
    return typeof v === k;
  };
  for (const [coll, fields] of Object.entries(STATE_SCHEMA)) {
    const rows = st[coll];
    if (!Array.isArray(rows)) {
      bad.push(coll + ': not an array');
      continue;
    }
    const ids = new Set();
    rows.forEach((r, i) => {
      if (ids.has(r.id)) bad.push(coll + '[' + i + '] duplicate id ' + r.id);
      ids.add(r.id);
      for (const [f, kind] of Object.entries(fields))
        if (!test(kind, r[f])) bad.push(coll + '[' + i + '] ' + (r.id || '?') + '.' + f + ' = ' + JSON.stringify(r[f]) + ' is not ' + JSON.stringify(kind));
    });
  }
  if (!ROLES.includes(st.role)) bad.push('role ' + st.role);
  if (typeof st.route !== 'string') bad.push('route');
  if (!Array.isArray(st.audit)) bad.push('audit: not an array');
  return bad;
}

/* ---------- named action registry ----------
   Every data-act handler is a function in ACT (many files add to it). The registry adds what ACT cannot say: the permission an action
   needs (checked before it runs, FR R6 / 0.3.9 FR-82) and an optional audit rule - the action then writes the audit log entry itself,
   only when it changed what the rule watches (so a rejected click leaves no entry). registerAction() declares, bindActions() wraps the
   handlers once all screens are loaded (app.js). Audit texts come from the keyed table `actions`.
     registerAction('doAssign', { area: 'orders', perm: 'trips:write', audit: { module: 'Dispatch', subject: d => d.id,
       watch: d => load(d.id).driver + '|' + load(d.id).truck, decision: () => LT('actions.load_assigned') } }); */
const ACTION_REGISTRY = {};
function registerAction(name, meta) {
  if (ACTION_REGISTRY[name]) throw new Error('action registered twice: ' + name);
  ACTION_REGISTRY[name] = Object.assign({ area: 'core' }, meta);
}
function bindActions() {
  for (const [name, meta] of Object.entries(ACTION_REGISTRY)) {
    const fn = ACT[name],
      a = meta.audit;
    if (!a || !fn || fn.__audited) continue;
    const wrapped = function (d, el, e) {
      const before = a.watch ? a.watch(d) : null;
      const r = fn.call(this, d, el, e);
      const after = a.watch ? a.watch(d) : null;
      if (!a.watch || before !== after) audit(a.module, a.subject ? a.subject(d) : name, a.decision(d), a.reason ? a.reason(d) : '', a.code || meta.area + '.' + name.toLowerCase());
      return r;
    };
    wrapped.__audited = true;
    ACT[name] = wrapped;
  }
}
