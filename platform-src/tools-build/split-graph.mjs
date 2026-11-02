// R02 / FR-192 split build: dependency graph of the bundle files and their placement (core or one chunk per menu area).
// The bundle is ONE classic script whose files talk through globals, so a file may only move out of the core when nothing outside its chunk needs it
// at load time or at run time. The graph is read from the sources (a small tokenizer, not regexes over text):
//   - global names a file declares (top-level const/let/var/function/class, globalThis.X = ..) and the files that use them;
//   - members of the shared registries: SCREENS (addTab / SCREENS.x = ..), DRAWERS, ACT (also data-act="x" in markup), HOOKS (HOOKS.status.push), S (load-time writes);
//   - every file that WRITES the same registry member (a wrapper around ACT.x, a tab pushed into another screen) must travel with the file that defines it.
// planSplit() returns { placement, why } and throws when the rules cannot be met; verifyPlan() re-checks a finished plan (the build calls it, tests call it with broken plans).
const KEYWORDS_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do', 'yield', 'await', 'instanceof']);
const NAMESPACES = new Set(['S', 'ACT', 'DRAWERS', 'HOOKS', 'SCREENS']);
const BLOCK_KEYWORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'with']);
const isIdStart = c => /[A-Za-z_$]/.test(c);
const isIdChar = c => c !== undefined && /[A-Za-z0-9_$]/.test(c);
const PUNCT3 = ['>>>', '...', '===', '!==', '**=', '<<=', '>>=', '&&=', '||=', '??='];
const PUNCT2 = ['=>', '==', '!=', '<=', '>=', '&&', '||', '??', '?.', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '**', '<<', '>>'];

/** tokens: { k: 'id'|'num'|'str'|'tpl'|'re'|'p', v, i }. Template text is one 'tpl' token per literal part; "${" and its "}" are punctuation ('${' / '}'). */
export function lex(src) {
  const out = [],
    n = src.length,
    tplStack = []; // tplStack: brace depth at which a ${ was opened
  let i = 0,
    braces = 0;
  const prevSig = () => out[out.length - 1];
  const regexAllowed = () => {
    const p = prevSig();
    if (!p) return true;
    if (p.k === 'id') return KEYWORDS_BEFORE_REGEX.has(p.v);
    if (p.k === 'num' || p.k === 'str' || p.k === 'tpl' || p.k === 're') return false;
    return !(p.v === ')' || p.v === ']' || p.v === '}');
  };
  const readTemplate = () => {
    // at the char after ` or after the } closing a ${ ; reads until ` or ${
    let j = i,
      text = '';
    while (j < n) {
      const c = src[j];
      if (c === '\\') {
        text += src.slice(j, j + 2);
        j += 2;
        continue;
      }
      if (c === '`') {
        out.push({ k: 'tpl', v: text, i });
        i = j + 1;
        return;
      }
      if (c === '$' && src[j + 1] === '{') {
        out.push({ k: 'tpl', v: text, i });
        out.push({ k: 'p', v: '${', i: j });
        tplStack.push(braces);
        braces++;
        i = j + 2;
        return;
      }
      text += c;
      j++;
    }
    throw new Error('lex: unterminated template literal');
  };
  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') {
      i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      const e = src.indexOf('\n', i);
      i = e < 0 ? n : e;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      i = e < 0 ? n : e + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1,
        text = '';
      while (j < n && src[j] !== c) {
        if (src[j] === '\\') {
          text += src.slice(j, j + 2);
          j += 2;
        } else text += src[j++];
      }
      out.push({ k: 'str', v: text, i });
      i = j + 1;
      continue;
    }
    if (c === '`') {
      i++;
      readTemplate();
      continue;
    }
    if (c === '/' && regexAllowed()) {
      let j = i + 1,
        cls = false;
      while (j < n) {
        const d = src[j];
        if (d === '\\') {
          j += 2;
          continue;
        }
        if (d === '[') cls = true;
        else if (d === ']') cls = false;
        else if (d === '/' && !cls) break;
        else if (d === '\n') throw new Error('lex: bad regex literal near ' + src.slice(i, i + 40));
        j++;
      }
      j++;
      while (isIdChar(src[j])) j++;
      out.push({ k: 're', v: src.slice(i, j), i });
      i = j;
      continue;
    }
    if (isIdStart(c)) {
      let j = i + 1;
      while (isIdChar(src[j])) j++;
      out.push({ k: 'id', v: src.slice(i, j), i });
      i = j;
      continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i + 1;
      while (/[0-9A-Za-z_.]/.test(src[j] || '')) {
        if ((src[j] === 'e' || src[j] === 'E') && (src[j + 1] === '+' || src[j + 1] === '-')) j++;
        j++;
      }
      out.push({ k: 'num', v: src.slice(i, j), i });
      i = j;
      continue;
    }
    const p3 = src.slice(i, i + 3),
      p2 = src.slice(i, i + 2);
    const pv = PUNCT3.includes(p3) ? p3 : PUNCT2.includes(p2) ? p2 : c;
    if (pv === '{') braces++;
    if (pv === '}') {
      braces--;
      if (tplStack.length && tplStack[tplStack.length - 1] === braces) {
        tplStack.pop();
        out.push({ k: 'p', v: '}', i, tplEnd: true });
        i++;
        readTemplate();
        continue;
      }
    }
    out.push({ k: 'p', v: pv, i });
    i += pv.length;
  }
  return out;
}

/** structure: for every token the number of enclosing run-time function bodies (fn) and of open brackets (nest), match of every bracket, IIFE flags */
function structure(t) {
  const match = new Array(t.length).fill(-1),
    stack = [];
  for (let x = 0; x < t.length; x++) {
    const v = t[x].k === 'p' ? t[x].v : null;
    if (v === '(' || v === '[' || v === '{' || v === '${') stack.push(x);
    else if (v === ')' || v === ']' || v === '}') {
      const o = stack.pop();
      if (o === undefined) throw new Error('lex: unbalanced bracket near ' + t[x].i);
      match[o] = x;
      match[x] = o;
    }
  }
  const isFnBody = o => {
    // o: index of a "{"
    const p = t[o - 1];
    if (!p) return false;
    if (p.k === 'p' && p.v === '=>') return true;
    if (p.k === 'p' && p.v === ')') {
      const m = match[o - 1],
        tb = t[m - 1];
      if (!tb) return false;
      if (tb.k === 'id') {
        if (BLOCK_KEYWORDS.has(tb.v)) return false;
        return true;
      } // function (..), name (..) {, method shorthand
      if (tb.k === 'p' && (tb.v === '=>' || tb.v === ')' || tb.v === ']')) return false;
      return true; // "(" before: anonymous (..) {  e.g. async (a) => handled above; keep as function
    }
    return false;
  };
  const isIife = o => {
    const c = match[o];
    return (t[c + 1] && t[c + 1].v === '(' && t[c + 1].k === 'p') || (t[c + 1] && t[c + 1].v === ')' && t[c + 2] && t[c + 2].v === '(' && t[c + 2].k === 'p');
  };
  const fn = new Array(t.length).fill(0),
    nest = new Array(t.length).fill(0),
    cur = [];
  let depthFn = 0;
  for (let x = 0; x < t.length; x++) {
    const tok = t[x];
    fn[x] = depthFn;
    nest[x] = cur.length;
    if (tok.k !== 'p') continue;
    if (tok.v === '{') {
      const body = isFnBody(x) && !isIife(x);
      cur.push(body);
      if (body) depthFn++;
      fn[x] = depthFn - (body ? 1 : 0);
    } else if (tok.v === '(' || tok.v === '[' || tok.v === '${') cur.push(false);
    else if (tok.v === '}' || tok.v === ')' || tok.v === ']') {
      const b = cur.pop();
      if (b) depthFn--;
      fn[x] = depthFn;
      nest[x] = cur.length;
    }
  }
  for (let x = 0; x < t.length; x++) {
    // x => expr : the tokens of the expression body are run-time code
    if (!(t[x].k === 'p' && t[x].v === '=>') || (t[x + 1] && t[x + 1].v === '{')) continue;
    const n0 = nest[x];
    for (let j = x + 1; j < t.length; j++) {
      if (
        nest[j] < n0 ||
        (nest[j] === n0 && t[j].k === 'p' && (t[j].v === ',' || t[j].v === ';')) ||
        (nest[j] === n0 && t[j].k === 'id' && ['const', 'let', 'var', 'function', 'class'].includes(t[j].v) && !prop(t, j))
      )
        break;
      fn[j]++;
    }
  }
  return { match, fn, nest };
}

const prop = (t, x) => t[x - 1] && t[x - 1].k === 'p' && (t[x - 1].v === '.' || t[x - 1].v === '?.');
const isAssignOp = v => v === '=' || v === '+=' || v === '-=' || v === '*=' || v === '||=' || v === '&&=' || v === '??=';

/** keys of an object literal whose "{" is at token index o */
function objectKeys(t, st, o) {
  const keys = [],
    close = st.match[o];
  for (let x = o + 1; x < close; x++) {
    if (st.nest[x] !== st.nest[o] + 1) continue;
    const tk = t[x],
      pv = t[x - 1];
    if ((tk.k === 'id' || tk.k === 'str') && pv && pv.k === 'p' && (pv.v === '{' || pv.v === ',')) keys.push(tk.v);
  }
  return keys;
}

/** what one file declares and touches. Pass 1: declared globals, registry definitions. */
export function scanFile(name, src) {
  const t = lex(src),
    st = structure(t);
  const globalsDeclared = new Set(),
    globalsAssigned = new Set(),
    localDeclared = new Set(),
    nsDefs = new Map(),
    nsLoadRefs = new Map(),
    nsRuntimeRefs = new Map(),
    actMarkup = new Set(),
    routes = [];
  const defKey = (key, why) => {
    if (!nsDefs.has(key)) nsDefs.set(key, why);
  };
  const declList = (x, add) => {
    // after const/let/var: names of the declarators (comma list, destructuring)
    let nest0 = st.nest[x],
      j = x + 1;
    const patternNames = o => {
      for (let y = o + 1; y < st.match[o]; y++)
        if (
          t[y].k === 'id' &&
          !prop(t, y) &&
          !(t[y + 1] && t[y + 1].v === ':' && t[y - 1] && (t[y - 1].v === '{' || t[y - 1].v === ',')) &&
          !(t[y - 1] && t[y - 1].v === '=')
        )
          add(t[y].v);
    };
    for (;;) {
      const a = t[j];
      if (!a) return;
      if (a.k === 'id') {
        add(a.v);
        j++;
      } else if (a.k === 'p' && (a.v === '{' || a.v === '[')) {
        patternNames(j);
        j = st.match[j] + 1;
      } else return;
      if (t[j] && t[j].v === '=') {
        // skip the initialiser up to "," or ";" at this nesting
        j++;
        while (j < t.length && st.nest[j] >= nest0) {
          const q = t[j];
          if (st.nest[j] === nest0 && q.k === 'p' && (q.v === ',' || q.v === ';')) break;
          if (st.nest[j] === nest0 && q.k === 'id' && ['const', 'let', 'var', 'function', 'class'].includes(q.v) && !(t[j - 1] && t[j - 1].v === '.')) return; // the next statement (no ";")
          if (q.k === 'p' && (q.v === '{' || q.v === '(' || q.v === '[' || q.v === '${')) j = st.match[j];
          j++;
        }
      }
      if (t[j] && t[j].k === 'p' && t[j].v === ',' && st.nest[j] === nest0) {
        j++;
        continue;
      }
      return;
    }
  };
  for (let x = 0; x < t.length; x++) {
    const tk = t[x];
    if (tk.k === 'str' || tk.k === 'tpl') {
      for (const m of tk.v.matchAll(/data-act=\\?["']([A-Za-z0-9_-]+)/g)) actMarkup.add(m[1]);
      continue;
    }
    if (tk.k !== 'id') continue;
    if (prop(t, x)) continue;
    const v = tk.v;
    if ((v === 'const' || v === 'let' || v === 'var') && (!t[x - 1] || t[x - 1].v !== '.')) {
      if (st.nest[x] === 0) declList(x, nm => globalsDeclared.add(nm));
      else declList(x, nm => localDeclared.add(nm));
    } else if ((v === 'function' || v === 'class') && t[x + 1] && t[x + 1].k === 'id') {
      if (st.nest[x] === 0) globalsDeclared.add(t[x + 1].v);
      else localDeclared.add(t[x + 1].v);
    }
    if ((v === 'globalThis' || v === 'window') && t[x + 1] && t[x + 1].v === '.' && t[x + 2] && t[x + 2].k === 'id' && t[x + 3] && isAssignOp(t[x + 3].v))
      globalsAssigned.add(t[x + 2].v);
    if (
      v === 'Object' &&
      t[x + 1] &&
      t[x + 1].v === '.' &&
      t[x + 2] &&
      t[x + 2].v === 'assign' &&
      t[x + 3] &&
      t[x + 3].v === '(' &&
      t[x + 4] &&
      t[x + 4].k === 'id' &&
      t[x + 5] &&
      t[x + 5].v === ',' &&
      t[x + 6] &&
      t[x + 6].v === '{'
    ) {
      const target = t[x + 4].v,
        keys = objectKeys(t, st, x + 6);
      if (target === 'globalThis' || target === 'window') keys.forEach(k => globalsAssigned.add(k));
      else if (NAMESPACES.has(target)) keys.forEach(k => defKey(target + '.' + k, 'Object.assign'));
    }
    if (NAMESPACES.has(v) && t[x + 1] && t[x + 1].v === '=' && x > 0 && (t[x - 1].v === 'const' || t[x - 1].v === 'let') && t[x + 2] && t[x + 2].v === '{')
      objectKeys(t, st, x + 2).forEach(k => defKey(v + '.' + k, 'literal'));
    // registry members: NS.name / NS['name']
    if (NAMESPACES.has(v)) {
      let nameTok = null,
        y = x + 1;
      if (t[y] && t[y].v === '.' && t[y + 1] && t[y + 1].k === 'id') {
        nameTok = t[y + 1].v;
        y += 2;
      } else if (t[y] && t[y].v === '[' && t[y + 1] && t[y + 1].k === 'str' && t[y + 2] && t[y + 2].v === ']') {
        nameTok = t[y + 1].v;
        y += 3;
      }
      if (nameTok == null) continue;
      const key = v + '.' + nameTok,
        runtime = st.fn[x] > 0;
      // chain: .a.b[..]... then an assignment operator, or .push( on HOOKS
      let z = y;
      while (t[z] && (t[z].v === '.' && t[z + 1] && t[z + 1].k === 'id' ? ((z += 2), true) : t[z].v === '[' ? ((z = st.match[z] + 1), true) : false));
      const assign = t[z] && t[z].k === 'p' && isAssignOp(t[z].v),
        isPush = v === 'HOOKS' && t[y] && t[y].v === '.' && t[y + 1] && t[y + 1].v === 'push';
      const rec = (map, k) => map.set(k, (map.get(k) || 0) + 1);
      if (assign || isPush) {
        if (v === 'S') {
          if (!runtime) defKey(key, 'write');
          else rec(nsRuntimeRefs, key);
        } // S.x = .. inside a handler is not a definition
        else {
          defKey(key, assign ? 'assign' : 'push');
        }
        if (v === 'SCREENS' && assign && z === y && t[z].v === '=') routes.push(nameTok); // SCREENS.x = {..}: the file defines the route
      } else if (runtime) rec(nsRuntimeRefs, key);
      else rec(nsLoadRefs, key);
    }
    // addTab('x', ..) / ensureTabs('x', ..) push into a screen
    if (
      (v === 'addTab' || v === 'ensureTabs') &&
      t[x + 1] &&
      t[x + 1].v === '(' &&
      t[x + 2] &&
      t[x + 2].k === 'str' &&
      !(t[x - 1] && t[x - 1].v === 'function')
    )
      defKey('SCREENS.' + t[x + 2].v, v);
    if (v === 'registerAction' && t[x + 1] && t[x + 1].v === '(' && t[x + 2] && t[x + 2].k === 'str') defKey('ACT.' + t[x + 2].v, 'registerAction');
    if ((v === 'lazy' || v === 'lazyFn') && t[x + 1] && t[x + 1].v === '(' && t[x + 2] && t[x + 2].k === 'str' && st.fn[x] === 0 && v === 'lazy')
      defKey('S.' + t[x + 2].v, 'lazy');
  }
  return { name, t, st, globalsDeclared, globalsAssigned, localDeclared, nsDefs, nsLoadRefs, nsRuntimeRefs, actMarkup, routes };
}

/** Pass 2 over all files: which global each file reassigns (wrapper) and uses. Returns per-file { defs:Set<key>, uses:Set<key>, ... }. */
export function buildGraph(files) {
  // files: [{name, src, fixed:boolean}]
  const scans = files.map(f => Object.assign(scanFile(f.name, f.src), { fixed: !!f.fixed }));
  const globalOwner = new Map(); // name -> file name of the declaration
  const declaredBy = new Map();
  for (const s of scans)
    for (const g of s.globalsDeclared) {
      if (declaredBy.has(g)) throw new Error(`split: global "${g}" is declared in ${declaredBy.get(g)} and in ${s.name}`);
      declaredBy.set(g, s.name);
      globalOwner.set(g, s.name);
    }
  for (const s of scans) for (const g of s.globalsAssigned) if (!globalOwner.has(g)) globalOwner.set(g, s.name);
  const res = new Map();
  for (const s of scans) {
    const defs = new Map(),
      uses = new Map(),
      t = s.t,
      st = s.st; // key -> why
    const add = (m, k, why) => {
      if (!m.has(k)) m.set(k, why);
    };
    for (const g of s.globalsDeclared) add(defs, 'g:' + g, 'declared');
    for (const g of s.globalsAssigned) add(defs, 'g:' + g, 'globalThis');
    for (const [k, why] of s.nsDefs) add(defs, 'm:' + k, why);
    for (let x = 0; x < t.length; x++) {
      const tk = t[x];
      if (tk.k !== 'id' || prop(t, x)) continue;
      const v = tk.v,
        own = s.globalsDeclared.has(v) || s.globalsAssigned.has(v),
        owner = globalOwner.get(v);
      if (owner && !own && !(t[x + 1] && t[x + 1].v === ':' && t[x - 1] && (t[x - 1].v === '{' || t[x - 1].v === ','))) {
        if (st.fn[x] === 0 && t[x + 1] && isAssignOp(t[x + 1].v) && !s.localDeclared.has(v)) add(defs, 'g:' + v, 'reassigned'); // a load-time wrapper of a global (liveTick = ..)
        add(uses, 'g:' + v, 'name');
      }
      if (
        (v === 'globalThis' || v === 'window') &&
        t[x + 1] &&
        t[x + 1].v === '.' &&
        t[x + 2] &&
        t[x + 2].k === 'id' &&
        globalOwner.has(t[x + 2].v) &&
        !s.globalsDeclared.has(t[x + 2].v) &&
        !s.globalsAssigned.has(t[x + 2].v)
      )
        add(uses, 'g:' + t[x + 2].v, 'globalThis');
    }
    const touches = new Set(); // registry members read while the file loads (a tab looked up and patched, an action wrapped)
    for (const [k] of s.nsLoadRefs) {
      add(uses, 'm:' + k, 'load');
      if (!k.startsWith('S.')) touches.add('m:' + k);
    }
    for (const [k] of s.nsRuntimeRefs) if (!k.startsWith('SCREENS.')) add(uses, 'm:' + k, 'runtime'); // SCREENS.x read at run time is answered by the stub of an unloaded route
    for (const a of s.actMarkup) add(uses, 'm:ACT.' + a, 'markup');
    // drawers opened by type: { type: 'x' } / openDrawer({ type: 'x' })
    for (let x = 0; x + 2 < t.length; x++)
      if (t[x].k === 'id' && t[x].v === 'type' && t[x + 1].v === ':' && t[x + 2].k === 'str' && /^[A-Za-z0-9_]+$/.test(t[x + 2].v))
        add(uses, 'm:DRAWERS.' + t[x + 2].v, 'type');
    res.set(s.name, { defs, uses, touches, routes: s.routes, fixed: s.fixed });
  }
  return res;
}

class DSU {
  constructor() {
    this.p = new Map();
  }
  find(x) {
    if (!this.p.has(x)) this.p.set(x, x);
    let r = x;
    while (this.p.get(r) !== r) r = this.p.get(r);
    this.p.set(x, r);
    return r;
  }
  union(a, b) {
    a = this.find(a);
    b = this.find(b);
    if (a !== b) this.p.set(b, a);
  }
}

/**
 * files: [{ name, src, area, fixed }] in bundle order. area = chunk the file would live in (null = core). fixed = may never leave the core.
 * Returns { placement: Map<name, 'core'|areaId>, notes: [string], graph }.
 */
export function planSplit(files) {
  const graph = buildGraph(files),
    byName = new Map(files.map(f => [f.name, f]));
  const order = new Map(files.map((f, i) => [f.name, i]));
  // the definers of each registry member / global travel together (wrapper with the base)
  const dsu = new DSU(),
    definers = new Map(); // key -> [file]
  for (const f of files)
    for (const [k] of graph.get(f.name).defs) {
      if (!definers.has(k)) definers.set(k, []);
      definers.get(k).push(f.name);
    }
  const coreProvided = key => (definers.get(key) || []).some(n => byName.get(n).fixed);
  const forced = new Map(); // file -> why: it patches something the core itself defines (a hook, a wrapped function, a core action), so it must run on every page
  for (const [k, list] of definers) {
    if (coreProvided(k)) {
      // the base of the member is in the core: S.x only needs it to exist (no company), the rest must be patched at start
      if (!k.startsWith('m:S.')) for (const n of list) if (!byName.get(n).fixed) forced.set(n, k);
      continue;
    }
    if (k.startsWith('m:S.')) continue; // S.x written by several files: every writer is needed wherever S.x is read (below), they do not wrap one another
    for (let i = 1; i < list.length; i++) dsu.union(list[0], list[i]);
  }
  const placement = new Map(),
    notes = [];
  const label = names => (names.length > 3 ? names.slice(0, 3).join(' + ') + ' + ' + (names.length - 3) + ' more' : names.join(' + '));
  const compOf = n => dsu.find(n),
    comps = new Map();
  for (const f of files) {
    const c = compOf(f.name);
    if (!comps.has(c)) comps.set(c, []);
    comps.get(c).push(f.name);
  }
  const compPlace = new Map();
  for (const [c, names] of comps) {
    if (names.some(n => byName.get(n).fixed || !byName.get(n).area)) {
      compPlace.set(c, 'core');
      continue;
    }
    const areas = [...new Set(names.map(n => byName.get(n).area))].sort(); // files of several areas that wrap one another share ONE chunk
    compPlace.set(c, areas.join('+'));
    if (areas.length > 1) notes.push(label(names) + ': write the same registry member from ' + areas.join(' / ') + ' -> one chunk ' + areas.join('+'));
  }
  for (const [n, k] of forced) {
    const c = compOf(n);
    if (compPlace.get(c) !== 'core') {
      compPlace.set(c, 'core');
      notes.push(label(comps.get(c)) + ' -> core (patches ' + k + ' which the core defines)');
    }
  }
  const promote = (c, why) => {
    if (compPlace.get(c) !== 'core') {
      compPlace.set(c, 'core');
      notes.push(`${label(comps.get(c))} -> core (${why})`);
      return true;
    }
    return false;
  };
  const hasRoute = c => comps.get(c).some(n => graph.get(n).routes.length);
  for (let changed = true; changed; ) {
    changed = false;
    for (const [c] of comps)
      if (compPlace.get(c) !== 'core' && !hasRoute(c)) {
        promote(c, 'no route of its own: nothing would ever load this chunk');
        changed = true;
      }
    for (const f of files) {
      const me = compPlace.get(compOf(f.name));
      if (me !== 'core')
        for (const k of graph.get(f.name).touches) {
          const ds = definers.get(k) || [];
          if (
            ds.length &&
            !ds.some(d => compOf(d) === compOf(f.name)) &&
            ds.some(d => compPlace.get(compOf(d)) === 'core') &&
            promote(compOf(f.name), `patches ${k} which is defined in the core`)
          )
            changed = true;
        }
      for (const [k, how] of graph.get(f.name).uses) {
        const ds = definers.get(k);
        if (!ds) continue;
        for (const d of ds) {
          if (compOf(d) === compOf(f.name)) continue;
          const dp = compPlace.get(compOf(d));
          if (dp !== 'core' && dp !== me) {
            if (promote(compOf(d), `${k} (${how}) is used by ${f.name}${me === 'core' ? ' in the core' : ' of chunk ' + me}`)) changed = true;
          }
        }
      }
    }
  }
  for (const f of files) placement.set(f.name, compPlace.get(compOf(f.name)));
  return { placement, notes, graph, order };
}

/** Re-check a finished placement against the graph: every dependency of a file is in the core or in the same chunk. Returns the list of violations. */
export function checkPlacement(files, placement, graph) {
  const bad = [],
    definers = new Map();
  for (const f of files)
    for (const [k] of graph.get(f.name).defs) {
      if (!definers.has(k)) definers.set(k, []);
      definers.get(k).push(f.name);
    }
  const coreProvided = key => (definers.get(key) || []).some(n => files.find(f => f.name === n).fixed);
  for (const f of files) {
    const me = placement.get(f.name);
    if (f.fixed && me !== 'core') bad.push(`${f.name}: a core file placed in chunk ${me}`);
    for (const [k, how] of graph.get(f.name).uses)
      for (const d of definers.get(k) || []) {
        const dp = placement.get(d);
        if (d === f.name) continue;
        if (dp !== 'core' && dp !== me) bad.push(`${f.name} (${me}) needs ${k} (${how}) defined by ${d} in chunk ${dp}`);
      }
  }
  for (const [k, list] of definers) {
    if (coreProvided(k)) {
      for (const n of list) if (placement.get(n) !== 'core') bad.push(n + ' patches ' + k + ' (defined by the core) but is in chunk ' + placement.get(n));
      continue;
    }
    if (k.startsWith('m:S.')) continue;
    const places = new Set(list.map(n => placement.get(n)));
    if (places.size > 1) bad.push(`${k} is written by files placed apart: ${list.map(n => n + '@' + placement.get(n)).join(', ')}`);
  }
  return bad;
}

export const chunkId = placement => placement.replace(/\+/g, '-');

/** files: [{ name, src, area, fixed }] in bundle order (the last one is app.js). Returns { placement, chunks: { id: { files, routes } }, core: [names], notes, graph } and throws on a broken plan. */
export function planChunks(files) {
  const { placement, notes, graph } = planSplit(files);
  const bad = checkPlacement(files, placement, graph);
  if (bad.length) throw new Error('split: the file graph is violated:\n  ' + bad.join('\n  '));
  const chunks = {},
    core = [];
  for (const f of files) {
    const p = placement.get(f.name);
    if (p === 'core') {
      core.push(f.name);
      continue;
    }
    const id = chunkId(p),
      c = chunks[id] || (chunks[id] = { files: [], routes: [] });
    c.files.push(f.name);
    c.routes.push(...graph.get(f.name).routes);
  }
  for (const [id, c] of Object.entries(chunks)) if (!c.routes.length) throw new Error(`split: chunk ${id} defines no route, nothing would load it`);
  const seen = new Map();
  for (const [id, c] of Object.entries(chunks))
    for (const r of c.routes) {
      if (seen.has(r)) throw new Error(`split: route ${r} is defined in chunks ${seen.get(r)} and ${id}`);
      seen.set(r, id);
    }
  if (placement.get('app.js') !== 'core') throw new Error('split: app.js must stay in the core');
  return { placement, chunks, core, notes, graph };
}

/** The lock file records which files must stay in which chunk. A dependency that pulls one of them into the core (or drops a chunk) fails the build until it is removed or the lock is updated on purpose. */
export function checkLock(chunks, lock) {
  const problems = [];
  for (const [id, want] of Object.entries(lock.chunks || {})) {
    const got = chunks[id];
    if (!got) {
      problems.push(`chunk ${id} is gone: ${want.files.join(', ')} moved to the core`);
      continue;
    }
    for (const f of want.files) if (!got.files.includes(f)) problems.push(`${f} left chunk ${id}`);
  }
  return problems;
}
export const lockOf = chunks => ({
  _note:
    'R02 split build: files that must stay out of the core. Written by `node platform-src/build-v6.mjs --split --split-update`; the build fails when a dependency pulls one of them into the core.',
  chunks: Object.fromEntries(Object.entries(chunks).map(([id, c]) => [id, { routes: c.routes, files: c.files }])),
});
