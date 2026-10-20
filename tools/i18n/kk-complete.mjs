#!/usr/bin/env node
// FR-220 · apply completed Kazakh texts: node tools/i18n/kk-complete.mjs <fill.json> [--table kkfill]
// fill.json = [{ file, line, ru, kk }] as printed by `scan.mjs --kk --json` with the `kk` text replaced by the full translation.
// Each matching inline T(ru, de, en, kk) call becomes LT('<file>.<slug>') in table <table>; the new KK text is listed in
// strings/kk/_review.json as a machine translation (status "mt") until a native speaker marks it reviewed (kk-review.mjs).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanFile } from './scan.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? process.argv[i + 1] : d;
};
const fillFile = process.argv[2],
  table = arg('table', 'kkfill'),
  LANGS = ['ru', 'de', 'en', 'kk'];
const tdir = l => join(root, 'platform-src', 'v6', 'strings', l);
const tab = {};
for (const l of LANGS) {
  const f = join(tdir(l), table + '.json');
  tab[l] = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
}
const used = new Set();
for (const l of ['ru'])
  for (const f of existsSync(tdir(l)) ? readdirSync(tdir(l)) : [])
    if (f.endsWith('.json') && !f.startsWith('_')) Object.keys(JSON.parse(readFileSync(join(tdir(l), f), 'utf8'))).forEach(k => used.add(k));
const revFile = join(tdir('kk'), '_review.json'),
  review = existsSync(revFile) ? JSON.parse(readFileSync(revFile, 'utf8')) : {};
const slug = s =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 36);
const today = process.env.KK_DATE || '2026-10-20';
const byFile = {};
for (const e of JSON.parse(readFileSync(fillFile, 'utf8'))) (byFile[e.file] = byFile[e.file] || []).push(e);
let n = 0;
for (const [rel, list] of Object.entries(byFile)) {
  const file = join(root, rel),
    r = scanFile(file),
    plan = [];
  const pre = basename(rel)
    .replace(/^\d+-/, '')
    .replace(/\.js$/, '')
    .replace(/[^a-z0-9]+/gi, '_')
    .toLowerCase();
  for (const e of list) {
    const c = r.T.find(t => t.line === e.line && t.args[0] === e.ru && !plan.some(p => p[0] === t.range));
    if (!c) throw new Error(`no T() at ${rel}:${e.line} for "${e.ru.slice(0, 40)}"`);
    const base = pre + '.' + (slug(c.args[2]) || 'x');
    let key = base,
      i = 1;
    while (used.has(key)) key = base + '_' + ++i;
    used.add(key);
    LANGS.forEach((l, j) => {
      tab[l][key] = j === 3 ? e.kk : c.args[j];
    });
    review[key] = { status: 'mt', by: 'machine translation (Claude)', date: today };
    plan.push([c.range, key]);
  }
  let src = r.src;
  for (const [range, key] of plan.sort((a, b) => b[0][0] - a[0][0])) {
    src = src.slice(0, range[0]) + `LT('${key}')` + src.slice(range[1]);
    n++;
  }
  writeFileSync(file, src);
}
for (const l of LANGS) {
  mkdirSync(tdir(l), { recursive: true });
  writeFileSync(join(tdir(l), table + '.json'), JSON.stringify(tab[l], null, 1) + '\n');
}
writeFileSync(revFile, JSON.stringify(review, null, 1) + '\n');
console.log(`${n} shortened Kazakh texts completed -> table ${table}, ${Object.keys(review).length} entries in kk/_review.json`);
