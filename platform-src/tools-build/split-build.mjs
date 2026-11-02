// R02 / FR-192 split build: platform/split/<lang>/ = index.html + core.js + area-<id>.js (one chunk per group of menu areas nothing else depends on).
//   node platform-src/build-v6.mjs --split [--out <dir>] [--split-update]
// The single-file pages are written first and are not touched by this module. See split-graph.mjs for how a file gets its place and split-runtime.js for the loader.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planChunks, checkLock, lockOf } from './split-graph.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export { planChunks, checkLock, lockOf };
const MANIFEST_SLOT = /\/\*@@SPLIT@@\*\/\s*\{ chunks: \{\}, routeChunk: \{\} \}/; // the placeholder of split-runtime.js (Prettier may put a space after the comment)
export const LOCK_FILE = join(here, 'split-lock.json');
const hash = s => createHash('sha1').update(s).digest('hex').slice(0, 8);
// the small differences a page two folders deeper (platform/split/<lang>/) needs; every rule must match, so a refactor of the source is noticed by the build
const REWRITES = [
  {
    what: 'fileFor (language links)',
    re: /const fileFor = l => \(l === 'ru' \? 'index\.html' : l \+ '\.html'\);/,
    to: "const fileFor = l => '../' + l + '/index.html';",
    min: 1,
    max: 1,
  },
  { what: 'service worker path', re: /register\('sw\.js'\)/g, to: "register('../../sw.js')", min: 1, max: 1 },
  { what: 'assets', re: /(["'`])assets\//g, to: '$1../../assets/', min: 1 },
  { what: 'versions page', re: /"\.\.\/versions\.html"/g, to: '"../../../versions.html"', min: 0 },
];
export function rewritePaths(code, counts) {
  for (const r of REWRITES)
    code = code.replace(r.re, (...m) => {
      counts[r.what] = (counts[r.what] || 0) + 1;
      return r.to.replace('$1', m[1]);
    });
  return code;
}

/**
 * ctx: { files, langs, outDir, css, prepare(src, lang) -> code, verify(before, after, lang), preload, skipText(lang), lock?: object|null, update?: boolean }
 * Writes <outDir>/split/<lang>/{index.html, core.js, area-<id>.js, manifest.json} and <outDir>/split/plan.json. Returns the plan.
 */
export async function buildSplit(ctx) {
  const { files, langs, outDir } = ctx;
  const plan = planChunks(files);
  const lock = ctx.lock === undefined ? (existsSync(LOCK_FILE) ? JSON.parse(readFileSync(LOCK_FILE, 'utf8')) : null) : ctx.lock;
  if (ctx.update) {
    const was = lock ? lock.chunks || {} : {}, now = lockOf(plan.chunks).chunks;
    const out = [];
    for (const id of Object.keys(was)) if (!now[id]) out.push('left the lock: chunk ' + id + ' (' + was[id].files.join(', ') + ')');
    for (const id of Object.keys(now)) {
      if (!was[id]) out.push('added to the lock: chunk ' + id + ' (' + now[id].files.join(', ') + ')');
      else {
        for (const f of was[id].files) if (!now[id].files.includes(f)) out.push('left the lock: ' + f + ' (chunk ' + id + ')');
        for (const f of now[id].files) if (!was[id].files.includes(f)) out.push('added to the lock: ' + f + ' (chunk ' + id + ')');
      }
    }
    writeFileSync(LOCK_FILE, JSON.stringify(lockOf(plan.chunks), null, 2) + '\n');
    console.log('split-lock.json updated' + (out.length ? ':\n  ' + out.join('\n  ') : ': no change'));
  } else if (!lock) {
    throw new Error('split: ' + LOCK_FILE + ' is missing; a build without the lock cannot notice a file falling back into the core. Create it on purpose with --split-update');
  } else {
    const problems = checkLock(plan.chunks, lock);
    if (problems.length)
      throw new Error(
        'split: a file left its chunk (the dependencies that did it are listed in platform/split/plan.json):\n  ' +
          problems.join('\n  ') +
          '\n  remove the dependency or run with --split-update',
      );
  }
  const runtime = readFileSync(join(here, 'split-runtime.js'), 'utf8').replace(/\r\n/g, '\n');
  const byName = new Map(files.map(f => [f.name, f]));
  const root = join(outDir, 'split');
  mkdirSync(root, { recursive: true });
  const counts = {};
  const summary = { langs: {} };
  for (const lang of langs) {
    const dir = join(root, lang);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const stats = {};
    const part = async names => {
      const before = names.map(n => byName.get(n).src).join('\n'),
        code = rewritePaths(ctx.prepare(before, lang, stats), counts);
      await ctx.verify(before, code, lang);
      return code;
    };
    const chunkText = {};
    for (const [id, c] of Object.entries(plan.chunks)) chunkText[id] = await part(c.files);
    const manifest = { chunks: {}, routeChunk: {} };
    for (const [id, c] of Object.entries(plan.chunks)) {
      manifest.chunks[id] = { file: `area-${id}.js`, v: hash(chunkText[id]), routes: c.routes };
      c.routes.forEach(r => {
        manifest.routeChunk[r] = id;
      });
    }
    if (!MANIFEST_SLOT.test(runtime)) throw new Error('split: split-runtime.js lost its manifest placeholder');
    const coreFiles = plan.core.filter(n => n !== 'app.js');
    const coreText =
      runtime.replace(MANIFEST_SLOT, () => JSON.stringify(manifest)) + '\n' + (await part(coreFiles)) + '\nSPLIT.install();\n';
    const appText = await part(['app.js']);
    writeFileSync(join(dir, 'core.js'), coreText);
    for (const [id, text] of Object.entries(chunkText)) writeFileSync(join(dir, `area-${id}.js`), text);
    const v = hash(coreText);
    const asset = p => '../../' + p;
    const html = `<!doctype html><html lang="${lang}" data-design="kokzhol"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kökzhol · Platform v6 (${lang}) · split</title><link rel="icon" type="image/svg+xml" href="${asset('assets/brand/kokzhol-favicon.svg')}"><link rel="preload" as="image" type="image/svg+xml" href="${asset('assets/brand/kokzhol-mark-on-ink.svg')}"><style>\n${ctx.css}\n</style></head><body><a class="skip" href="#main-content">${ctx.skipText(lang)}</a><div id="root"></div><script src="core.js?nosw&v=${v}" data-split="core"></script><script>\nSPLIT.boot(function () {\n${appText.replace(/<\/script/gi, '<\\/script')}\n});\n</script></body></html>\n`;
    writeFileSync(join(dir, 'index.html'), html);
    const sizes = { core: coreText.length + appText.length, chunks: Object.fromEntries(Object.entries(chunkText).map(([id, t]) => [id, t.length])) };
    writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ lang, core: 'core.js', v, bytes: sizes, chunks: manifest.chunks }, null, 2) + '\n');
    summary.langs[lang] = sizes;
    console.log(
      `split/${lang}: core ${(sizes.core / 1024).toFixed(0)} KB` +
        Object.entries(sizes.chunks)
          .map(([id, n]) => `, area-${id}.js ${(n / 1024).toFixed(0)} KB`)
          .join(''),
    );
  }
  for (const r of REWRITES) {
    const n = counts[r.what] || 0;
    if (n < r.min * langs.length) throw new Error(`split: path rewrite "${r.what}" matched ${n} times in total, expected at least ${r.min} per language`);
    if (r.max && n > r.max * langs.length * 1) throw new Error(`split: path rewrite "${r.what}" matched ${n} times, expected at most ${r.max} per language`);
  }
  const bytes = f => f.src.length;
  // the one line that says how much the split gives (R02 narrowing, D01): areas fully out of the core, and the core's share of the ru page
  const areas = [...new Set(files.filter(f => !f.fixed && f.area).map(f => f.area))];
  const out = areas.filter(a => files.filter(f => f.area === a && !f.fixed).every(f => plan.placement.get(f.name) !== 'core'));
  const partly = areas.filter(a => !out.includes(a) && files.some(f => f.area === a && !f.fixed && plan.placement.get(f.name) !== 'core'));
  const lang0 = summary.langs.ru ? 'ru' : langs[0], sz = summary.langs[lang0], chunkSum = Object.values(sz.chunks).reduce((x, y) => x + y, 0);
  console.log(
    `split: moved out of the core: ${out.length} of ${areas.length} menu areas (${out.join(', ') || '-'})${partly.length ? `, ${partly.length} in part (${partly.join(', ')})` : ''}; the core is ${Math.round((100 * sz.core) / (sz.core + chunkSum))} % of the ${lang0} page. Why files stay in the core: ${join(root, 'plan.json')} ("reasons")`,
  );
  writeFileSync(
    join(root, 'plan.json'),
    JSON.stringify(
      {
        _note:
          'R02 split plan (generated by build-v6.mjs --split). core = files every page needs; chunks = files that load with their route; reasons = why a file could not leave the core.',
        core: { files: plan.core, kb: Math.round(plan.core.reduce((s, n) => s + bytes(byName.get(n)), 0) / 1024) },
        chunks: Object.fromEntries(
          Object.entries(plan.chunks).map(([id, c]) => [
            id,
            { routes: c.routes, files: c.files, kb: Math.round(c.files.reduce((s, n) => s + bytes(byName.get(n)), 0) / 1024) },
          ]),
        ),
        reasons: plan.notes,
      },
      null,
      2,
    ) + '\n',
  );
  return plan;
}
