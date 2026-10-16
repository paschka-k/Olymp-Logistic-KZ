#!/usr/bin/env node
// Assemble platform-v5*.html from the modular sources.
//   node platform-src/build.mjs [--out <dir>] [--lang ru,de,en]
// Zero dependencies. Segments listed in manifest.json are concatenated in order,
// JSON-encoded and injected into lang/<xx>/bundle.html (the Claude-Design bundle wrapper).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const outDir = resolve(arg('out', join(here, '..')));
const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));
const langs = arg('lang', Object.keys(manifest.outputs).join(',')).split(',');

for (const lang of langs) {
  const parts = [];
  for (const seg of manifest.segments) {
    if (seg.off) continue;                                   // "off": true disables a segment
    const file = seg.scope === 'shared' ? join(here, 'shared', seg.path) : join(here, 'lang', lang, seg.path);
    if (!existsSync(file)) throw new Error(`missing segment: ${file}`);
    parts.push(readFileSync(file, 'utf8'));
  }
  const template = parts.join('')
    .replaceAll('@@VERSION@@', manifest.version).replaceAll('@@FILE_RU@@', manifest.outputs.ru)
    .replaceAll('@@FILE_DE@@', manifest.outputs.de).replaceAll('@@FILE_EN@@', manifest.outputs.en);
  const encoded = JSON.stringify(template).replace(/<\//g, '<\\u002F');
  const wrapper = readFileSync(join(here, 'lang', lang, 'bundle.html'), 'utf8');
  const html = wrapper.replace('/*@TEMPLATE@*/', () => encoded);
  mkdirSync(outDir, { recursive: true });
  const target = join(outDir, manifest.outputs[lang]);
  writeFileSync(target, html);
  console.log(`${lang}: ${manifest.segments.length} segments -> ${target} (${(html.length / 1024).toFixed(0)} KB)`);
}
