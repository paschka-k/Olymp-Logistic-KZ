#!/usr/bin/env node
// Build the v6 design-system preview (standalone, no template engine).
//   node platform-src/build-design.mjs [--out <dir>] [--lang ru,de,en,kk]
// Concatenates shared/design/*.css + preview/body.html; texts use [[ru::de::en::kk]] and are resolved per language.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const outDir = resolve(arg('out', join(here, '..')));
const langs = arg('lang', 'ru,de,en,kk').split(',');
const IDX = { ru: 0, de: 1, en: 2, kk: 3 };
const d = join(here, 'shared', 'design');
const css = ['tokens.css', 'shell.css', 'components.css', 'components-kz.css', 'preview/preview.css'].map(f => readFileSync(join(d, f), 'utf8')).join('\n');
const body = readFileSync(join(d, 'preview', 'body.html'), 'utf8');
mkdirSync(outDir, { recursive: true });

for (const lang of langs) {
  const i = IDX[lang];
  const text = body.replace(/\[\[(.+?)\]\]/gs, (m, g) => {
    const parts = g.split('::');
    if (parts.length !== 4) throw new Error(`i18n token needs 4 parts (ru::de::en::kk): ${m}`);
    return parts[i];
  });
  const nav = langs.map(l => `<a href="design-preview-v6-${l}.html"${l === lang ? ' class="on"' : ''}>${l.toUpperCase()}</a>`).join('');
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Olymp Logistic KZ · design preview v6 (${lang})</title><style>\n${css}\n</style></head><body>\n${text}\n<div class="langs">${nav}</div></body></html>\n`;
  const target = join(outDir, `design-preview-v6-${lang}.html`);
  writeFileSync(target, html);
  console.log(`${lang}: ${target} (${(html.length / 1024).toFixed(0)} KB)`);
}
