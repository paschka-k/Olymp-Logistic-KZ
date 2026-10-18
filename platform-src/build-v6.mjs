#!/usr/bin/env node
// Assemble the v6 prototype (standalone vanilla JS, no template engine): platform-v6{,-de,-en,-kk}.html
//   node platform-src/build-v6.mjs [--out <dir>] [--lang ru,de,en,kk]
// Order matters: core (T, helpers, store) -> data -> screens -> app. '@@LANG@@' is replaced per language.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const outDir = resolve(arg('out', join(here, '..')));
const langs = arg('lang', 'ru,de,en,kk').split(',');
const rd = (...p) => readFileSync(join(here, ...p), 'utf8');
const css = ['tokens.css', 'shell.css', 'components.css', 'components-kz.css'].map(f => rd('shared', 'design', f)).join('\n') + '\n' + rd('v6', 'app.css');
const js = ['core.js', 'data.js', 'screens/dashboard.js', 'screens/orders.js', 'screens/dispatch.js', 'screens/fleet.js', 'screens/drivers.js', 'screens/routes.js', 'screens/hubs.js', 'screens/receiving.js', 'app.js'].map(f => rd('v6', f)).join('\n');
mkdirSync(outDir, { recursive: true });
for (const lang of langs) {
  const code = js.replaceAll('@@LANG@@', lang).replace(/<\/script/gi, '<\\/script');
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Olymp Logistic KZ · Platform v6 (${lang})</title><style>\n${css}\n</style></head><body><div id="root"></div><script>\n${code}\n</script></body></html>\n`;
  const file = join(outDir, lang === 'ru' ? 'platform-v6.html' : `platform-v6-${lang}.html`);
  writeFileSync(file, html);
  console.log(`${lang}: ${file} (${(html.length / 1024).toFixed(0)} KB)`);
}
