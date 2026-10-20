#!/usr/bin/env node
// FR-199 / FR-220 · inventory of inline T(ru, de, en, kk) tuples and keyed LT('key') calls in platform-src/v6 (espree from tools/lint).
//   node tools/i18n/scan.mjs [--json] [--kk]      --kk lists Kazakh gaps (missing, equal to RU, much shorter than RU)
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const espree = await import(pathToFileURL(join(root, 'tools', 'lint', 'node_modules', 'espree', 'dist', 'espree.cjs')).href);
const walkDir = d =>
  readdirSync(d).flatMap(f => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walkDir(p) : p.endsWith('.js') ? [p] : [];
  });
export const sources = () => walkDir(join(root, 'platform-src', 'v6'));
const lit = n =>
  n && n.type === 'Literal' && typeof n.value === 'string'
    ? n.value
    : n && n.type === 'TemplateLiteral' && !n.expressions.length
      ? n.quasis[0].value.cooked
      : null;
export function scanFile(file) {
  const src = readFileSync(file, 'utf8');
  const ast = espree.parse(src, { ecmaVersion: 2022, sourceType: 'script', range: true, loc: true });
  const out = { T: [], L: [] };
  (function walk(n) {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier') {
      if (n.callee.name === 'T') out.T.push({ range: n.range, line: n.loc.start.line, args: n.arguments.map(lit), n: n.arguments.length });
      if (n.callee.name === 'LT' && n.arguments[0]) out.L.push({ key: lit(n.arguments[0]), line: n.loc.start.line });
    }
    for (const k in n) {
      if (k === 'parent') continue;
      const v = n[k];
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v.type === 'string') walk(v);
    }
  })(ast);
  return { src, ...out };
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const equalOk = new Set(JSON.parse(readFileSync(join(root, 'tools', 'i18n', 'kk-equal-ok.json'), 'utf8')).texts); // identical in Kazakh on purpose
  const kk = process.argv.includes('--kk'),
    rows = [];
  let tot = 0,
    lits = 0,
    keyed = 0;
  for (const f of sources()) {
    const r = scanFile(f),
      rel = relative(root, f).replace(/\\/g, '/');
    tot += r.T.length;
    keyed += r.L.length;
    lits += r.T.filter(t => t.args.every(a => a != null)).length;
    if (kk)
      for (const t of r.T) {
        const [ru, , , k] = t.args;
        if (ru == null) continue;
        const why =
          t.n < 4
            ? 'missing'
            : k == null
              ? null
              : k === ru && !equalOk.has(ru) && ru.length > 12 && /[а-яё]{4}/i.test(ru)
                ? 'equal'
                : k.length < ru.length * 0.45 && ru.length > 24
                  ? 'short'
                  : null;
        if (why) rows.push({ file: rel, line: t.line, why, ru, kk: k });
      }
    else rows.push({ file: rel, T: r.T.length, L: r.L.length });
  }
  if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 1));
  else {
    for (const r of rows) console.log(kk ? `${r.file}:${r.line} [${r.why}] ${r.ru.slice(0, 70)} || ${(r.kk || '').slice(0, 50)}` : `${r.T}\t${r.L}\t${r.file}`);
    console.log(`T() calls: ${tot} (${lits} all-literal) · LT() calls: ${keyed}`);
  }
}
