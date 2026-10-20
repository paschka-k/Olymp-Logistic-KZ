#!/usr/bin/env node
// FR-220 / I-26 · Kazakh review workflow.
//   node tools/i18n/kk-review.mjs export [--all] > kk-review.csv    key;ru;kk;status  (only unreviewed machine translations, --all = every KK text)
//   node tools/i18n/kk-review.mjs import kk-review.csv --by "Name"   writes corrected kk texts back and marks them reviewed
//   node tools/i18n/kk-review.mjs status                             counts per status
// The CSV is ';'-separated, UTF-8 with BOM, every cell quoted: it opens in Excel. The reviewer edits ONLY the kk and status columns
// (status: mt = not checked, reviewed = checked by a native speaker). Entries with status reviewed need --by.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..'),
  sdir = l => join(root, 'platform-src', 'v6', 'strings', l);
const tables = l =>
  readdirSync(sdir(l))
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))
    .sort();
const read = (l, f) => JSON.parse(readFileSync(join(sdir(l), f), 'utf8'));
const revFile = join(sdir('kk'), '_review.json'),
  review = existsSync(revFile) ? JSON.parse(readFileSync(revFile, 'utf8')) : {};
const cmd = process.argv[2];
const q = v => '"' + String(v).replace(/"/g, '""') + '"',
  parse = text => {
    const rows = [];
    let row = [],
      cell = '',
      inq = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inq) {
        if (c === '"' && text[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (c === '"') inq = false;
        else cell += c;
      } else if (c === '"') inq = true;
      else if (c === ';') {
        row.push(cell);
        cell = '';
      } else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else cell += c;
    }
    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }
    return rows;
  };
if (cmd === 'export') {
  const all = process.argv.includes('--all'),
    out = [['key', 'ru', 'kk', 'status']];
  for (const f of tables('kk')) {
    const ru = read('ru', f),
      kk = read('kk', f);
    for (const k of Object.keys(kk)) {
      const st = (review[k] || {}).status || 'reviewed';
      if (all || st !== 'reviewed') out.push([k, ru[k], kk[k], st]);
    }
  }
  process.stdout.write('﻿' + out.map(r => r.map(q).join(';')).join('\n') + '\n');
} else if (cmd === 'import') {
  const by = process.argv.includes('--by') ? process.argv[process.argv.indexOf('--by') + 1] : '',
    rows = parse(readFileSync(process.argv[3], 'utf8').replace(/^﻿/, '')).slice(1);
  let changed = 0,
    marked = 0;
  for (const f of tables('kk')) {
    const kk = read('kk', f);
    let dirty = false;
    for (const r of rows) {
      const [k, , text, status] = r;
      if (!(k in kk)) continue;
      if (text !== kk[k]) {
        kk[k] = text;
        dirty = true;
        changed++;
      }
      if (status === 'reviewed') {
        if (!by) throw new Error('--by "Name" is required to mark texts as reviewed');
        review[k] = { status: 'reviewed', by, date: process.env.KK_DATE || new Date().toISOString().slice(0, 10) };
        marked++;
      }
    }
    if (dirty) writeFileSync(join(sdir('kk'), f), JSON.stringify(kk, null, 1) + '\n');
  }
  writeFileSync(revFile, JSON.stringify(review, null, 1) + '\n');
  console.log(`${changed} texts changed, ${marked} marked reviewed`);
} else if (cmd === 'status') {
  const c = {};
  for (const v of Object.values(review)) c[v.status] = (c[v.status] || 0) + 1;
  let total = 0;
  for (const f of tables('kk')) total += Object.keys(read('kk', f)).length;
  console.log(`keyed KK texts: ${total}; review entries: ${JSON.stringify(c)}`);
} else {
  console.error('usage: kk-review.mjs export|import|status');
  process.exit(2);
}
