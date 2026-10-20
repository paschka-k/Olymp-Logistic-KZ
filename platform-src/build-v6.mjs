#!/usr/bin/env node
// Assemble the v6 platform (standalone vanilla JS, no template engine) into platform/: index.html (RU), de.html, en.html, kk.html + tests.html
//   node platform-src/build-v6.mjs [--out <dir>] [--lang ru,de,en,kk]
// Bundle order: core -> roles -> data -> v6/screens/*.js (file-name order, NN-name.js) -> v6/help/*.js -> app.
// Areas add their own files (screens/NNN-area.js, help/area.js, tests/NN-area.js); no manifest to edit. Placeholders: @@LANG@@ @@BUILD@@ @@ROLEPERMS@@.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const outDir = resolve(arg('out', join(here, '..', 'platform')));
const langs = arg('lang', 'ru,de,en,kk').split(',');
const rd = (...p) => readFileSync(join(here, ...p), 'utf8');
const list = (dir, ext) => (existsSync(join(here, dir)) ? readdirSync(join(here, dir)).filter(f => f.endsWith(ext)).sort() : []);
const css = ['tokens.css', 'shell.css', 'components.css', 'components-kz.css', 'theme-kokzhol.css'].map(f => rd('shared', 'design', f)).join('\n') + '\n' + rd('v6', 'app.css');
const js = [rd('v6', 'core.js'), rd('v6', 'roles.js'), rd('v6', 'data.js'), ...list('v6/screens', '.js').map(f => rd('v6', 'screens', f)), ...list('v6/help', '.js').map(f => rd('v6', 'help', f)), rd('v6', 'app.js')].join('\n');
let build = new Date().toISOString().slice(0, 16).replace('T', ' ');
try { build = execSync('git log -1 --format=%cI', { cwd: here }).toString().trim().slice(0, 16).replace('T', ' '); } catch (_) { /* no git: build time = now */ }
const rolePerms = rd('v6', 'role-perms.json').trim();
// Changes page (W3): docs/source-platform/register.json -> compact per-language JSON (@@REGISTER@@); KK falls back to RU
const reg = JSON.parse(readFileSync(join(here, '..', 'docs', 'source-platform', 'register.json'), 'utf8'));
const regFor = lang => { const L = lang === 'kk' ? 'ru' : lang; return JSON.stringify({ as_of: reg.as_of, n: reg.entries.length, entries: reg.entries.map(e => ({ id: e.id, type: e.type, date: e.date || e.date_approx || '', status: e.status, group: (e.group || {})[L] || (e.group || {}).en || '', module: e.module || '', title: (e[L] || e.en || {}).title || '', change: (e[L] || e.en || {}).change || '', finding: (e[L] || e.en || {}).finding || '' })) }); };
mkdirSync(outDir, { recursive: true });
for (const lang of langs) {
  const code = js.replaceAll('@@LANG@@', lang).replaceAll('@@BUILD@@', build).replaceAll('@@ROLEPERMS@@', rolePerms).replaceAll('@@REGISTER@@', () => regFor(lang)).replace(/<\/script/gi, '<\\/script');
  const html = `<!doctype html><html lang="${lang}" data-design="kokzhol"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kökzhol · Platform v6 (${lang})</title><link rel="icon" type="image/svg+xml" href="assets/brand/kokzhol-favicon.svg"><style>\n${css}\n</style></head><body><a class="skip" href="#main-content">Skip to content</a><div id="root"></div><script>\n${code}\n</script></body></html>\n`;
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
writeFileSync(join(outDir, 'tests.html'), rd('tests', 'template.html').replace('/*@@SUITELIST@@*/[]', () => suiteList).replace('/*@@QUARANTINE@@*/[]', () => quarantine).replace('/*@@SUITES@@*/', () => suites));
console.log(`tests: ${testFiles.length} suites -> ${join(outDir, 'tests.html')}`);
