#!/usr/bin/env node
// FR-199 · move inline T(ru, de, en, kk) tuples of one source file into the keyed string tables.
//   node tools/i18n/migrate.mjs <file under platform-src/v6> --table <name> [--prefix <key prefix>] [--dry]
// Every all-literal 4-argument T(...) call becomes LT('<prefix>.<slug>') and the four texts are appended to
//   platform-src/v6/strings/{ru,de,en,kk}/<name>.json   (flat { key: text }, insertion order = source order).
// Same four texts -> same key (reused); same slug with different texts -> slug_2, slug_3 ... Calls with non-literal or fewer
// than four arguments stay as they are (the T bridge keeps working). Re-running is safe: migrated calls are no longer T().
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanFile } from './scan.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? process.argv[i + 1] : d;
};
const file = resolve(process.argv[2] || ''),
  table = arg('table'),
  dry = process.argv.includes('--dry');
if (!process.argv[2] || !table) {
  console.error('usage: migrate.mjs <file> --table <name> [--prefix p] [--dry]');
  process.exit(2);
}
const prefix = arg('prefix', table),
  LANGS = ['ru', 'de', 'en', 'kk'];
const tdir = l => join(root, 'platform-src', 'v6', 'strings', l);
const load = l => {
  const f = join(tdir(l), table + '.json');
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
};
const T = Object.fromEntries(LANGS.map(l => [l, load(l)]));
// keys of ALL tables (a key must be unique across tables)
const allKeys = new Set();
for (const l of LANGS)
  for (const f of existsSync(tdir(l)) ? (await import('node:fs')).readdirSync(tdir(l)) : [])
    if (f.endsWith('.json') && f !== 'kk.review.json') Object.keys(JSON.parse(readFileSync(join(tdir(l), f), 'utf8'))).forEach(k => allKeys.add(k));
const slug = s =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36);
const same = (k, a) => LANGS.every((l, i) => T[l][k] === a[i]);
const r = scanFile(file);
let src = r.src,
  n = 0,
  skipped = 0;
const plan = [];
for (const c of r.T) {
  // source order: keys are created in the order they are used
  if (c.n !== 4 || c.args.some(a => a == null)) {
    skipped++;
    continue;
  }
  const base = prefix + '.' + (slug(c.args[2]) || slug(c.args[1]) || 'x');
  let key = base,
    i = 1;
  while (allKeys.has(key) && !same(key, c.args)) key = base + '_' + ++i;
  if (!allKeys.has(key)) {
    allKeys.add(key);
    LANGS.forEach((l, j) => {
      T[l][key] = c.args[j];
    });
  }
  plan.push([c.range, key]);
  n++;
}
for (const [range, key] of plan.reverse()) src = src.slice(0, range[0]) + `LT('${key}')` + src.slice(range[1]);
console.log(`${relative(root, file)}: ${n} T() calls -> LT(), ${skipped} left (non-literal or not 4 arguments)`);
if (!dry) {
  writeFileSync(file, src);
  for (const l of LANGS) {
    mkdirSync(tdir(l), { recursive: true });
    writeFileSync(join(tdir(l), table + '.json'), JSON.stringify(T[l], null, 2) + '\n');
  }
}
