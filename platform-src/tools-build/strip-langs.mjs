// R01 / FR-191: build-time language strip. stripLangs(src, lang) rewrites every T(ru, de, en, kk) call of the bundle into T(<text of lang>)
// (kk without a value -> ru, like the runtime T). A real tokenizer: strings, template literals with ${...}, regex literals, comments and nested brackets.
// T itself stays the runtime function (a[LI] ?? a[0]); a one-argument call returns its argument for every LI, so the stripped page behaves the same.
const LANG_INDEX = { ru: 0, de: 1, en: 2, kk: 3 };
const KEYWORDS_BEFORE_REGEX = new Set(['return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do', 'yield', 'await', 'instanceof']);
const isWordChar = c => c !== undefined && /[A-Za-z0-9_$]/.test(c);

export function stripLangs(src, lang, stats = {}, { hq = false, comments = false } = {}) {
  const li = LANG_INDEX[lang];
  if (li === undefined) throw new Error('stripLangs: unknown language ' + lang);
  stats.calls = 0; stats.stripped = 0; stats.skipped = [];
  const n = src.length;

  // scan code from i until a terminator at bracket depth 0 (term: chars) or the end; returns [output, index of the terminator]
  function code(i, term) {
    let out = '', lineStart = true, col0 = true, depth = 0, prev = 'start'; // prev: start | punct | close | word | str | re  (what the last significant token was)
    let prevWord = '', toks = 0; // toks: tokens seen; a single string / template token cannot be null at run time
    while (i < n) {
      const c = src[i];
      const ws = c === ' ' || c === '\t' || c === '\n' || c === '\r', cm = c === '/' && (src[i + 1] === '/' || src[i + 1] === '*');
      const wasCol0 = col0; col0 = ws && c === '\n';
      if (!ws && !(cm && comments)) lineStart = false;
      if (ws) {
        // code context only (strings and templates are copied elsewhere): with `comments` set, indentation and blank lines are dropped
        if (comments && lineStart) { i++; continue; }
        lineStart = c === '\n'; out += c; i++; continue;
      }
      if (c === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); const j = e < 0 ? n : e; if (!comments) out += src.slice(i, j); i = j; continue; }
      if (c === '/' && src[i + 1] === '*') {
        const e = src.indexOf('*/', i + 2); const j = e < 0 ? n : e + 2, body = src.slice(i, j);
        // build placeholders (/*@@NAME@@*/{}) and license banners (/*!) survive; any other comment is dropped, keeping one newline so ASI does not change
        if (!comments || body.startsWith('/*@@') || body.startsWith('/*!')) out += body;
        // a comment at the start of a line is a file / section banner: its first line stays as a landmark (tests and readers find the file boundaries by it)
        else if (wasCol0) { out += (body.length <= 60 && !body.includes('\n') ? body : body.slice(0, 60).split('\n')[0].replace(/\*\/?$/, '') + ' */') + '\n'; lineStart = true; }
        else if (body.includes('\n')) { if (!lineStart) out += '\n'; lineStart = true; } else if (!lineStart) out += ' ';
        i = j; continue;
      }
      toks++;
      if (c === "'" || c === '"') {
        let j = i + 1;
        while (j < n && src[j] !== c) j += src[j] === '\\' ? 2 : 1;
        out += src.slice(i, j + 1); i = j + 1; prev = 'str'; continue;
      }
      if (c === '`') {
        out += c; i++;
        while (i < n && src[i] !== '`') {
          if (src[i] === '\\') { out += src.slice(i, i + 2); i += 2; continue; }
          if (src[i] === '$' && src[i + 1] === '{') { const [o, j] = code(i + 2, '}'); out += '${' + o + '}'; i = j + 1; continue; }
          out += src[i++];
        }
        out += '`'; i++; prev = 'str'; continue;
      }
      if (c === '/') {
        const regexOk = prev === 'start' || prev === 'punct' || (prev === 'word' && KEYWORDS_BEFORE_REGEX.has(prevWord));
        if (regexOk) {
          let j = i + 1, cls = false;
          while (j < n) {
            const d = src[j];
            if (d === '\\') { j += 2; continue; }
            if (d === '\n') break;
            if (cls) { if (d === ']') cls = false; } else if (d === '[') cls = true; else if (d === '/') break;
            j++;
          }
          j++;
          while (isWordChar(src[j])) j++;
          out += src.slice(i, j); i = j; prev = 're'; continue;
        }
        out += c; i++; prev = 'punct'; continue;
      }
      if (isWordChar(c)) {
        let j = i; while (isWordChar(src[j])) j++;
        const word = src.slice(i, j);
        if ((word === 'T' || (word === 'HQ' && hq)) && src[i - 1] !== '.' && prevWord !== 'function' && !(prev === 'word' && prevWord === 'function')) {
          let k = j; while (src[k] === ' ' || src[k] === '\t') k++;
          if (src[k] === '(') {
            stats.calls++;
            const [rep, end] = call(k + 1, word);
            out += rep; i = end; prev = 'close'; prevWord = ''; continue;
          }
        }
        out += word; i = j; prev = 'word'; prevWord = word; continue;
      }
      if (c === '(' || c === '[' || c === '{') { depth++; out += c; i++; prev = 'punct'; continue; }
      if (c === ')' || c === ']' || c === '}') {
        if (depth === 0 && term.includes(c)) return [out, i, toks === 2 && prev === 'str'];
        depth--; out += c; i++; prev = 'close'; continue;
      }
      if (c === ',' && depth === 0 && term.includes(',')) return [out, i, toks === 2 && prev === 'str'];
      out += c; i++; prev = 'punct';
    }
    return [out, i, toks === 1 && prev === 'str'];
  }

  // i is right after "T(": parse arguments, return [replacement text, index after the closing paren]
  function call(i, name) {
    const args = [], lits = [];
    for (;;) {
      const [a, j, lit] = code(i, ',)');
      args.push(a); lits.push(lit);
      i = j + 1;
      if (src[j] === ')' || j >= n) break;
    }
    if (args.length > 1 && args[args.length - 1].trim() === '') args.pop(); // trailing comma
    const t = args.map(a => a.trim());
    if (args.length === lits.length - 1) lits.pop(); // a trailing comma dropped its empty last argument
    if (args.length < 2 || t.some(a => a.startsWith('...') || a === '')) {
      if (args.length >= 2) stats.skipped.push(t.join(',').slice(0, 60));
      return [name + '(' + args.join(',') + ')', i];
    }
    const isEmpty = a => a === undefined || a === 'null' || a === 'undefined' || a === "''" || a === '""' || a === '``';
    if (name === 'HQ') {
      // help text quad (array, read by tx() and hasKK()): tx() falls back to the first member when the language member is empty
      stats.stripped++;
      if (li === 3 && !isEmpty(t[3])) return ["HQ('','','', " + t[3] + ')', i]; // hasKK() looks at v[3] on the KK page
      return ['HQ(' + (isEmpty(t[li]) ? t[0] : t[li]) + ')', i];
    }
    const pick = t[li] !== undefined && t[li] !== 'null' && t[li] !== 'undefined' ? t[li] : t[0];
    stats.stripped++;
    // a member that is an expression (a[3], f(x)) can be null at run time and the runtime T then reads the first one: keep that fallback
    if (pick !== t[0] && !lits[li]) return ['T(' + Array(li).fill(t[0]).join(',') + ',' + pick + ')', i];
    return ['T(' + pick + ')', i];
  }

  const [out] = code(0, '');
  return out;
}

// default syntax check (Node); node:vm is imported lazily because the browser test suite loads this module too and passes its own parser
const nodeParse = async (code, filename) => { const vm = await import('node:vm'); new vm.Script(code, { filename }); };

// R01.1: the stripped script must still be JavaScript and must keep every T( call (the scan of the result finds as many calls as the scan of the source).
// Throws with the reason; returns the number of calls.
export async function verifyStrip(before, after, lang, parse = nodeParse) {
  const a = {}, b = {};
  stripLangs(before, lang, a);
  stripLangs(after, lang, b);
  if (a.calls !== b.calls) throw new Error(`stripLangs(${lang}): T( calls before ${a.calls}, after ${b.calls}`);
  try { await parse(after, `bundle-${lang}.js`); } catch (e) { throw new Error(`stripLangs(${lang}): result does not parse: ${e.message}`); }
  return a.calls;
}
