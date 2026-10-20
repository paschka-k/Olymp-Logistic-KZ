// S2 · Delivery helpers for build-v6.mjs (FR-196 asset pipeline, FR-223 What's new data, FR-225 offline service worker).
//   whatsNewData(root)        -> releases + streams parsed from docs/TRACEABILITY.md (mapping in platform-src/v6/whatsnew.json)
//   optimiseAssets(outDir)    -> minify SVG in place, PNG -> WebP (Python Pillow when available, otherwise the committed .webp stays)
//   finishDelivery(outDir, o) -> assets/manifest.json (sizes + budget check) and sw.js (versioned cache of pages and assets)
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, relative, extname } from 'node:path';

const walk = dir => readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const rel = (base, p) => relative(base, p).split('\\').join('/');

/* FR-223: every "## KEY — title" section of TRACEABILITY.md is one stream; its key prefix (W, P, Q, R, S …) maps to a release */
export function whatsNewData(root) {
  const md = readFileSync(join(root, 'docs', 'TRACEABILITY.md'), 'utf8');
  const cfg = JSON.parse(readFileSync(join(root, 'platform-src', 'v6', 'whatsnew.json'), 'utf8'));
  const parts = md.split(/^## /m).slice(1);
  const streams = parts.map(p => {
    const head = p.split('\n')[0].trim(), body = p.slice(head.length);
    const m = head.match(/^([A-Z]\d+)\b/), key = m ? m[1] : '';
    const title = head.replace(/^([A-Z]\d+)\s*[—·:\-–]?\s*/, '').replace(/\s*\(files? `.*$/, '').replace(/`/g, '').trim();
    const rows = body.split('\n').filter(l => /^\|/.test(l) && !/^\|\s*-/.test(l)).length - (body.match(/^\|\s*-/gm) || []).length;   // table rows minus one header per table
    const frs = [...new Set(body.match(/FR-\d+/g) || [])].sort((a, b) => a.slice(3) - b.slice(3));
    const rel0 = cfg.releases.find(r => (r.prefixes || []).includes(key.slice(0, 1))) || cfg.releases.find(r => r.v === 'next');
    return { k: key, h: title, rows: Math.max(0, rows), frs, v: rel0.v };
  });
  return { releases: cfg.releases.map(r => ({ v: r.v, date: r.date || '' })), streams };
}

/* FR-196: SVG minify (comments, XML prolog, metadata, whitespace between tags, indentation) — idempotent */
const minSvg = s => s.replace(/<\?xml[^>]*>/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/<metadata[\s\S]*?<\/metadata>/g, '')
  .replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').replace(/\s*\/>/g, '/>').trim() + '\n';
const PY = `import sys
from PIL import Image
for a in sys.argv[1:]:
    Image.open(a).save(a[:-4] + '.webp', 'WEBP', quality=90, method=6)
`;
export function optimiseAssets(outDir) {
  const files = walk(join(outDir, 'assets'));
  let svgSaved = 0;
  for (const f of files.filter(f => extname(f) === '.svg')) { const a = readFileSync(f, 'utf8'), b = minSvg(a); if (b !== a) { writeFileSync(f, b); svgSaved += a.length - b.length; } }
  const todo = files.filter(f => extname(f) === '.png').filter(f => { const w = f.slice(0, -4) + '.webp'; return !existsSync(w) || statSync(w).mtimeMs < statSync(f).mtimeMs; });
  let webp = 'up to date';
  if (todo.length) {
    for (const py of ['python', 'python3']) { try { execFileSync(py, ['-c', PY, ...todo], { stdio: 'pipe' }); webp = todo.length + ' converted'; break; } catch (_) { webp = 'skipped (no Python Pillow) — committed .webp kept'; } }
  }
  console.log(`assets: SVG minified (-${svgSaved} B), PNG -> WebP ${webp}`);
}

/* FR-196 budget + FR-225 service worker */
export function finishDelivery(outDir, { version, pages }) {
  const budget = JSON.parse(readFileSync(join(outDir, '..', 'platform-src', 'budget.json'), 'utf8'));
  const assets = walk(join(outDir, 'assets')).filter(f => !/manifest\.json$/.test(f)).map(f => ({ path: rel(outDir, f), bytes: statSync(f).size }));
  const webp = assets.filter(a => a.path.endsWith('.png')).map(a => { const w = assets.find(x => x.path === a.path.slice(0, -4) + '.webp'); return { png: a.path, webp: w ? w.path : null, png_bytes: a.bytes, webp_bytes: w ? w.bytes : null }; });
  const pageSizes = Object.fromEntries(pages.map(p => [p, statSync(join(outDir, p)).size]));
  const over = [];
  for (const [p, b] of Object.entries(pageSizes)) { const lim = (p === 'tests.html' ? budget.tests_kb : budget.page_kb) * 1024; if (b > lim) over.push(`${p} ${(b / 1024).toFixed(0)} KB > ${lim / 1024} KB`); }
  const assetSum = assets.filter(a => !a.path.endsWith('.png')).reduce((s, a) => s + a.bytes, 0);   // PNG are fallbacks only; the app loads WebP / SVG
  if (assetSum > budget.assets_kb * 1024) over.push(`assets ${(assetSum / 1024).toFixed(1)} KB > ${budget.assets_kb} KB`);
  assets.filter(a => a.bytes > budget.asset_file_kb * 1024).forEach(a => over.push(`${a.path} ${(a.bytes / 1024).toFixed(1)} KB > ${budget.asset_file_kb} KB`));
  writeFileSync(join(outDir, 'assets', 'manifest.json'), JSON.stringify({ version, budget, pages: pageSizes, assets_bytes: assetSum, assets, webp }, null, 1) + '\n');
  console.log(`budget: pages ${Object.entries(pageSizes).map(([p, b]) => p + ' ' + (b / 1024).toFixed(0) + ' KB').join(', ')}; assets ${(assetSum / 1024).toFixed(1)} KB` + (over.length ? '\nBUDGET EXCEEDED: ' + over.join('; ') : ' — within budget'));
  if (over.length) process.exitCode = 1;

  // precache: the four language pages + every asset except PNG fallbacks; tests.html and legacy/ are never cached
  const pre = ['./', ...pages.filter(p => p !== 'tests.html'), ...assets.filter(a => !a.path.endsWith('.png')).map(a => a.path), 'assets/manifest.json'];
  const h = createHash('sha256'); pre.filter(p => p !== './').forEach(p => h.update(readFileSync(join(outDir, p))));
  const cache = `kokzhol-v6-${version}-${h.digest('hex').slice(0, 8)}`;
  writeFileSync(join(outDir, 'sw.js'), `/* FR-225 offline demo — generated by platform-src/delivery.mjs, do not edit. Cache "${cache}" (version + content hash).
   Pages: network first (always fresh online, cached copy offline). Assets: cache first. Never touches tests.html, requests made
   by the test harness (referrer tests.html), ?nosw, other origins or non-GET requests. Registered only outside iframes and
   not on localhost unless ?sw=1 (see v6/screens/990-delivery.js), so python -m http.server development stays uncached. */
const CACHE = ${JSON.stringify(cache)};
const PRECACHE = ${JSON.stringify(pre)};
const skip = r => { const u = new URL(r.url); return r.method !== 'GET' || u.origin !== self.location.origin || /\\/tests\\.html$/.test(u.pathname) || /\\/tests\\.html/.test(r.referrer || '') || u.searchParams.has('nosw') || !u.pathname.startsWith(new URL('./', self.location).pathname); };
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('kokzhol-v6-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (skip(r)) return;
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(new URL(r.url).pathname, c)); } return res; })
      .catch(() => caches.match(r.url, { ignoreSearch: true }).then(m => m || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r.url, { ignoreSearch: true }).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(r.url, c)); } return res; })));
});
`);
  console.log(`sw: ${cache}, ${pre.length} files precached`);
}
