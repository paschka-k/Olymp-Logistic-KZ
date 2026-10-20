#!/usr/bin/env node
// Assemble the v6 platform (standalone vanilla JS, no template engine) into platform/: index.html (RU), de.html, en.html, kk.html + tests.html
//   node platform-src/build-v6.mjs [--out <dir>] [--lang ru,de,en,kk]
// Bundle order: v6/base/*.js -> core -> roles -> data -> v6/screens/*.js (file-name order, NN-name.js) -> v6/help/*.js -> app.
// Areas add their own files (screens/NNN-area.js, help/area.js, tests/NN-area.js); no manifest to edit. Placeholders: @@LANG@@ @@BUILD@@ @@ROLEPERMS@@.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { whatsNewData, optimiseAssets, finishDelivery } from './delivery.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => {
  const i = process.argv.indexOf('--' + k);
  return i > 0 ? process.argv[i + 1] : d;
};
const outDir = resolve(arg('out', join(here, '..', 'platform')));
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
  for (const area of readdirSync(join(here, 'v6', 'screens'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)) {
    for (const f of list(`v6/screens/${area}`, '.js')) out.push([f, `${area}/${f}`]);
  }
  const names = out.map(o => o[0]);
  if (new Set(names).size !== names.length) throw new Error('screens: file names must be unique across area folders (build order is by name)');
  return out.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)).map(o => o[1]);
};
const css =
  ['tokens.css', 'shell.css', 'components.css', 'components-kz.css', 'theme-kokzhol.css'].map(f => rd('shared', 'design', f)).join('\n') +
  '\n' +
  rd('v6', 'app.css');
const js = [
  ...list('v6/base', '.js').map(f => rd('v6', 'base', f)), // S4: language, locale (FR-221), strings (FR-199), kit (FR-200), export (FR-201), state (FR-202)
  rd('v6', 'core.js'),
  rd('v6', 'roles.js'),
  rd('v6', 'data.js'),
  ...screenFiles().map(f => rd('v6', 'screens', f)),
  ...list('v6/help', '.js').map(f => rd('v6', 'help', f)),
  rd('v6', 'app.js'),
].join('\n');
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
for (const lang of langs) {
  // FR-204: data placeholders are written as /*@@NAME@@*/{} so the sources stay valid JavaScript for ESLint / Prettier
  const code = js
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
  const html = `<!doctype html><html lang="${lang}" data-design="kokzhol"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kökzhol · Platform v6 (${lang})</title><link rel="icon" type="image/svg+xml" href="assets/brand/kokzhol-favicon.svg">${preload}<style>\n${css}\n</style></head><body><a class="skip" href="#main-content">Skip to content</a><div id="root"></div><script>\n${code}\n</script></body></html>\n`;
  const file = join(outDir, lang === 'ru' ? 'index.html' : `${lang}.html`);
  writeFileSync(file, html);
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
