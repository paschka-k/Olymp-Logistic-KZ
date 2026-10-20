#!/usr/bin/env node
// FR-203 · area folders and ownership.
//   node tools/check-areas.mjs                       structure check (exit 1 on a violation): every screen file sits in a known area
//                                                    folder, is named NNN-kebab.js, names are unique across areas, OWNERS.json is complete
//   node tools/check-areas.mjs --base origin/main    also report which areas the branch touched (git diff base...HEAD)
//   node tools/check-areas.mjs --base origin/main --own orders,dispatch    exit 1 when a file of ANOTHER area (or shell / shared) changed
// Tests, help articles, strings, docs and tooling are common ground and never count as a cross-area edit.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'),
  arg = k => {
    const i = process.argv.indexOf('--' + k);
    return i > 0 ? process.argv[i + 1] : null;
  };
const owners = JSON.parse(readFileSync(join(root, 'platform-src', 'OWNERS.json'), 'utf8')),
  sdir = join(root, 'platform-src', 'v6', 'screens');
const problems = [],
  seen = new Map(),
  perArea = {};
for (const entry of readdirSync(sdir)) {
  const p = join(sdir, entry);
  if (entry === 'ORDER.txt') continue;
  if (!statSync(p).isDirectory()) {
    problems.push(`screens/${entry}: files must live in an area folder`);
    continue;
  }
  if (!owners.areas[entry]) problems.push(`screens/${entry}/: folder is not an area in OWNERS.json`);
  for (const f of readdirSync(p)) {
    if (!/^\d{3}-[a-z0-9]+(-[a-z0-9]+)*\.js$/.test(f)) problems.push(`screens/${entry}/${f}: name must be NNN-kebab-name.js`);
    if (seen.has(f)) problems.push(`screens/${entry}/${f}: name also used in ${seen.get(f)}`);
    else seen.set(f, entry);
    perArea[entry] = (perArea[entry] || 0) + 1;
  }
}
// the bundle order (all area folders, sorted by file name) must equal ORDER.txt: moving a file between areas never changes the build
const order = readFileSync(join(sdir, 'ORDER.txt'), 'utf8')
  .split('\n')
  .filter(l => l && !l.startsWith('#'));
const now = [...seen.keys()].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
if (order.join() !== now.join())
  problems.push(
    'screens/ORDER.txt differs from the files on disk (' +
      now
        .filter(f => !order.includes(f))
        .concat(order.filter(f => !now.includes(f)))
        .join(', ') +
      '): update it deliberately',
  );
for (const a of Object.keys(owners.areas)) if (!perArea[a] && !owners.areas[a].common) problems.push(`OWNERS.json: area ${a} has no files`);
const base = arg('base');
let touched = {};
if (base) {
  const files = execSync(`git diff --name-only ${base}...HEAD`, { cwd: root }).toString().split('\n').filter(Boolean);
  for (const f of files) {
    const m = /^platform-src\/v6\/screens\/([^/]+)\//.exec(f);
    if (m) (touched[m[1]] = touched[m[1]] || []).push(f);
  }
  const names = Object.keys(touched);
  console.log(names.length ? `areas touched: ${names.map(a => `${a} (${touched[a].length})`).join(', ')}` : 'no screen files changed');
  const common = names.filter(a => owners.areas[a] && owners.areas[a].common);
  if (common.length) console.log(`note: common ground edited (${common.join(', ')}): agree with every running branch`);
  const own = arg('own');
  if (own) {
    const allowed = own.split(',');
    const foreign = names.filter(a => !allowed.includes(a));
    if (foreign.length) problems.push(`cross-area edit: ${foreign.join(', ')} (allowed: ${allowed.join(', ')})`);
  }
}
if (problems.length) {
  console.error(problems.map(p => '✗ ' + p).join('\n'));
  process.exit(1);
}
console.log(`areas ok: ${Object.keys(perArea).length} folders, ${seen.size} screen files, unique names, NNN-name rule`);
