#!/usr/bin/env node
// Assemble the v6 platform (standalone vanilla JS, no template engine) into platform/: index.html (RU), de.html, en.html, kk.html + tests.html
//   node platform-src/build-v6.mjs [--out <dir>] [--lang ru,de,en,kk] [--split [--split-update]]
// --split additionally writes <out>/split/<lang>/ (core.js + area-<id>.js chunks loaded on the first visit of a section; see tools-build/split-build.mjs). The pages above are unchanged.
// Bundle order: v6/base/*.js -> core -> roles -> data -> v6/screens/*.js (file-name order, NN-name.js) -> v6/help/*.js -> app.
// Areas add their own files (screens/NNN-area.js, help/area.js, tests/NN-area.js); no manifest to edit. Placeholders: @@LANG@@ @@BUILD@@ @@ROLEPERMS@@.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripLangs, verifyStrip } from './tools-build/strip-langs.mjs';
import { buildSplit, planChunks, LOCK_FILE } from './tools-build/split-build.mjs';
import { whatsNewData, optimiseAssets, finishDelivery } from './delivery.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? process.argv[i + 1] : d;
};
const outDir = resolve(arg('out', join(here, '..', 'platform')));
const stripHelp = process.argv.includes('--strip-help'); // opt-in: also reduce the help text quads HQ(ru,de,en,kk); off, because help tests read the quads of the page language whole
const split = process.argv.includes('--split'), splitUpdate = process.argv.includes('--split-update'); // R02: extra output platform/split/<lang>/, the single-file pages stay the main build
const keepLangs = process.argv.includes('--keep-langs'); // diagnostic: the unstripped bundle (every T() keeps all four languages)
const langs = arg('lang', 'ru,de,en,kk').split(',');
const rd = (...p) => readFileSync(join(here, ...p), 'utf8').replace(/\r\n/g, '\n'); // FR-204: sources are LF; a stray CRLF checkout must not reach the bundle
const list = (dir, ext) =>
  existsSync(join(here, dir))
    ? readdirSync(join(here, dir))
        .filter(f => f.endsWith(ext))
        .sort()
    : [];
// FR-203: screens live in one folder per menu area (v6/screens/<area>/NNN-name.js, ownership: platform-src/OWNERS.json). The BUNDLE ORDER
// is unchanged: every file of every area folder, sorted by file name (NNN prefix), exactly the order of the former flat folder.
const screenFiles = () => {
  const out = [];
  for (const area of readdirSync(join(here, 'v6', 'screens'), { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)) {
    for (const f of list(`v6/screens/${area}`, '.js')) out.push([f, `${area}/${f}`]);
  }
  const names = out.map(o => o[0]);
  if (new Set(names).size !== names.length) throw new Error('screens: file names must be unique across area folders (build order is by name)');
  return out.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(o => o[1]);
};
const cssSrc =
  ['tokens.css', 'shell.css', 'components.css', 'components-kz.css', 'theme-kokzhol.css'].map(f => rd('shared', 'design', f)).join('\n') +
  '\n' +
  rd('v6', 'app.css');
const css = keepLangs ? cssSrc : cssSrc.replace(/\/\*[\s\S]*?\*\//g, c => (c.length <= 40 ? c : c.slice(0, 40).split('\n')[0].replace(/\*\/?$/, '') + ' */')); // R01: stylesheet comments are cut to a landmark (tests find the print block by its comment)
// the bundle as a list of files (name, text, menu area, whether it can never leave the core): the single page joins them, the split build places them (tools-build/split-graph.mjs)
const bundleFiles = [
  ...list('v6/base', '.js').map(f => ({ name: 'base/' + f, src: rd('v6', 'base', f), fixed: true })), // S4: language, locale (FR-221), strings (FR-199), kit (FR-200), export (FR-201), state (FR-202)
  { name: 'core.js', src: rd('v6', 'core.js'), fixed: true },
  { name: 'roles.js', src: rd('v6', 'roles.js'), fixed: true },
  { name: 'data.js', src: rd('v6', 'data.js'), fixed: true },
  ...screenFiles().map(f => ({ name: f, src: rd('v6', 'screens', f), area: f.split('/')[0], fixed: f.startsWith('shell/') || f.startsWith('shared/') })),
  ...list('v6/help', '.js').map(f => ({ name: 'help/' + f, src: rd('v6', 'help', f), fixed: true })),
  { name: 'app.js', src: rd('v6', 'app.js'), fixed: true },
];
const js = bundleFiles.map(f => f.src).join('\n');
let build = new Date().toISOString().slice(0, 16).replace('T', ' ');
try {
  build = execSync('git log -1 --format=%cI', { cwd: here }).toString().trim().slice(0, 16).replace('T', ' ');
} catch (_) {
  /* no git: build time = now */
}
const rolePerms = rd('v6', 'role-perms.json').trim();
// FR-199 / FR-220: keyed string tables v6/strings/<lang>/*.json (flat key -> text). Only the language being built is embedded.
// The build fails when the four languages differ in their keys, when DE / EN contain Cyrillic, or when a KK review entry names no key.
const STR_LANGS = ['ru', 'de', 'en', 'kk'];
const readStrings = l => {
  const dir = join(here, 'v6', 'strings', l),
    out = {};
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)
    .filter(x => x.endsWith('.json') && !x.startsWith('_'))
    .sort()) {
    for (const [k, v] of Object.entries(JSON.parse(readFileSync(join(dir, f), 'utf8')))) {
      if (k in out) throw new Error(`strings: duplicate key ${k} (${l}/${f})`);
      out[k] = v;
    }
  }
  return out;
};
const strings = Object.fromEntries(STR_LANGS.map(l => [l, readStrings(l)]));
for (const l of STR_LANGS) {
  const miss = Object.keys(strings.ru).filter(k => !(k in strings[l])),
    extra = Object.keys(strings[l]).filter(k => !(k in strings.ru));
  if (miss.length || extra.length) throw new Error(`strings: ${l} differs from ru (missing ${miss.slice(0, 5)}, extra ${extra.slice(0, 5)})`);
  if (l === 'de' || l === 'en')
    for (const [k, v] of Object.entries(strings[l])) if (/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(v)) throw new Error(`strings: Cyrillic in ${l} key ${k}: ${v}`);
}
const kkReviewFile = join(here, 'v6', 'strings', 'kk', '_review.json');
const kkReview = existsSync(kkReviewFile) ? JSON.parse(readFileSync(kkReviewFile, 'utf8')) : {};
for (const k of Object.keys(kkReview)) if (!(k in strings.kk)) throw new Error(`strings: kk/_review.json names an unknown key ${k}`);
const kkOpen = Object.fromEntries(
  Object.entries(kkReview)
    .filter(([, v]) => v.status !== 'reviewed')
    .map(([k]) => [k, 1]),
);
// Changes page (W3): docs/source-platform/register.json -> compact per-language JSON (@@REGISTER@@); KK falls back to RU
const reg = JSON.parse(readFileSync(join(here, '..', 'docs', 'source-platform', 'register.json'), 'utf8'));
const regFor = lang => {
  const L = lang === 'kk' ? 'ru' : lang;
  return JSON.stringify({
    as_of: reg.as_of,
    n: reg.entries.length,
    entries: reg.entries.map(e => ({
      id: e.id,
      type: e.type,
      date: e.date || e.date_approx || '',
      status: e.status,
      group: (e.group || {})[L] || (e.group || {}).en || '',
      module: e.module || '',
      title: (e[L] || e.en || {}).title || '',
      change: (e[L] || e.en || {}).change || '',
      finding: (e[L] || e.en || {}).finding || '',
    })),
  });
};
mkdirSync(outDir, { recursive: true });
// S2 delivery: What's new data (FR-223, @@WHATSNEW@@), optimised assets (FR-196) before the pages reference them
const whatsNew = JSON.stringify(whatsNewData(join(here, '..')));
const VERSION = (rd('v6', 'roles.js').match(/VERSION = '([^']+)'/) || [])[1] || '6';
if (existsSync(join(outDir, 'assets'))) optimiseAssets(outDir);
const preload = '<link rel="preload" as="image" type="image/svg+xml" href="assets/brand/kokzhol-mark-on-ink.svg">';
const skipText = lang => ({ ru: "Перейти к содержимому", de: "Zum Inhalt springen", en: "Skip to content", kk: "Мазмұнға өту" })[lang] || "Skip to content";
// the text of a part of the bundle (or all of it) as the page of `lang` carries it
const finish = (src, lang, stats) =>
  // FR-204: data placeholders are written as /*@@NAME@@*/{} so the sources stay valid JavaScript for ESLint / Prettier
  (keepLangs ? src : stripLangs(src, lang, stats, { hq: stripHelp, comments: true }))
    .replace(/\/\*@@STRINGS@@\*\/\s*\{\}/, () => JSON.stringify(strings[lang]))
    .replace(/\/\*@@STRINGS_MT@@\*\/\s*\{\}/, () => JSON.stringify(lang === 'kk' ? kkOpen : {}))
    .replaceAll('/*@@ROLEPERMS@@*/{}', () => rolePerms)
    .replaceAll('/*@@REGISTER@@*/{}', () => regFor(lang))
    .replaceAll('/*@@WHATSNEW@@*/{}', () => whatsNew)
    .replaceAll('@@LANG@@', lang)
    .replaceAll('@@BUILD@@', build)
    .replaceAll('@@ROLEPERMS@@', rolePerms)
    .replaceAll('@@REGISTER@@', () => regFor(lang))
    .replaceAll('@@WHATSNEW@@', () => whatsNew)
    .replace(/<\/script/gi, '<\\/script');
for (const lang of langs) {
  const stripStats = {};
  const code = finish(js, lang, stripStats);
  if (!keepLangs) await verifyStrip(js, code, lang); // R01.1: same number of T( calls, result parses
  const html = `<!doctype html><html lang="${lang}" data-design="kokzhol"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kökzhol · Platform v6 (${lang})</title><link rel="icon" type="image/svg+xml" href="assets/brand/kokzhol-favicon.svg">${preload}<style>\n${css}\n</style></head><body><a class="skip" href="#main-content">${skipText(lang)}</a><div id="root"></div><script>\n${code}\n</script></body></html>\n`;
  const file = join(outDir, lang === 'ru' ? 'index.html' : `${lang}.html`);
  writeFileSync(file, html);
  if (!keepLangs) console.log('  T(): ' + stripStats.calls + ' calls, ' + stripStats.stripped + ' stripped, ' + stripStats.skipped.length + ' kept as is');
  console.log(`${lang}: ${file} (${(html.length / 1024).toFixed(0)} KB)`);
}
// tests.html = harness + every suite in tests/NN-*.js. Each file starts with __suite(i) so the harness can run one shard
// (FR-205: ?shard=k/n, split by tests/shard-weights.json = recorded ms per file, new files estimated from their size)
// and skip the groups of the other files; tests/quarantine.json lists group names whose failures are reported, not failed (FR-210).
const testFiles = list('tests', '.js');
const readJson = (f, d) => (existsSync(join(here, 'tests', f)) ? JSON.parse(rd('tests', f)) : d);
const weights = readJson('shard-weights.json', {}).ms || {};
const suiteList = JSON.stringify(testFiles.map(f => ({ name: f, ms: weights[f] || Math.max(200, Math.round(rd('tests', f).length / 20)) })));
const quarantine = JSON.stringify(readJson('quarantine.json', { groups: [] }).groups || []);
const suites = testFiles.map((f, i) => `__suite(${i});   /* ${f} */\n` + rd('tests', f)).join('\n');
writeFileSync(
  join(outDir, 'tests.html'),
  rd('tests', 'template.html')
    .replace('/*@@SUITELIST@@*/[]', () => suiteList)
    .replace('/*@@QUARANTINE@@*/[]', () => quarantine)
    .replace('/*@@SUITES@@*/', () => suites),
);
console.log(`tests: ${testFiles.length} suites -> ${join(outDir, 'tests.html')}`);
if (existsSync(join(outDir, 'assets')))
  finishDelivery(outDir, { version: VERSION, pages: langs.map(l => (l === 'ru' ? 'index.html' : `${l}.html`)).concat('tests.html') });
// FR-218: axe-core (MPL-2.0) is a test-only file next to tests.html; the product pages never load it
mkdirSync(join(outDir, 'test-vendor'), { recursive: true });
for (const f of list('tests/vendor', '')) writeFileSync(join(outDir, 'test-vendor', f), rd('tests', 'vendor', f));
// R02: EVERY build (with or without --split) leaves the split plan and the lock next to tests.html, so the plan tests always have something to check
{
  let data;
  try {
    const p = planChunks(bundleFiles);
    data = { splitBuilt: split, core: { files: p.core }, chunks: p.chunks, reasons: p.notes, lock: existsSync(LOCK_FILE) ? JSON.parse(readFileSync(LOCK_FILE, 'utf8')) : null };
  } catch (e) {
    data = { splitBuilt: split, error: String(e.message).slice(0, 2000) };
  }
  writeFileSync(join(outDir, 'split-plan.json'), JSON.stringify(data, null, 2) + '\n');
}
// R02 / FR-192: the split build is an extra output; it runs after every single-file page is written and cannot change them
if (split)
  await buildSplit({
    files: bundleFiles, langs, outDir, css, skipText, update: splitUpdate,
    prepare: (src, lang, stats) => finish(src, lang, stats),
    verify: async (before, after, lang) => { if (!keepLangs) await verifyStrip(before, after, lang); },
  });
