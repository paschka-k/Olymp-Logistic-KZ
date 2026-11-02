#!/usr/bin/env node
// 0.3.11 autotest traceability: every one of the 757 scenarios of the 0.3.11 test page must be mapped to v6.
//   node tools/check-autotest-trace.mjs        exit 1 when a 0.3.11 number has no mapping or a mapping points at nothing
// docs/parity-0311/autotests-0311.tsv   the 757 rows of releases/0.3.11/tests.html (n, module, scenario, result, ms, error)
// docs/parity-0311/autotests-trace.tsv  n -> status: ROW (one v6 row of rows() in platform-src/tests/h9-0311-rows.js), GROUP (a v6 group covers it:
//                                       «file.js: group») or NA (concept gone in v6, reason given)
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..'),
  tests = join(root, 'platform-src', 'tests'),
  rd = f => readFileSync(join(root, f), 'utf8').split(/\r?\n/).filter(Boolean).map(l => l.split('\t'));
const src = rd('docs/parity-0311/autotests-0311.tsv').slice(1),
  trace = rd('docs/parity-0311/autotests-trace.tsv'),
  h9 = readFileSync(join(tests, 'h9-0311-rows.js'), 'utf8');
const problems = [],
  seen = new Map(),
  count = { ROW: 0, GROUP: 0, NA: 0 };
if (trace[0].slice(0, 5).join() !== 'n,module,scenario,status,v6') problems.push('trace header must start with n, module, scenario, status, v6');
for (const [n, module, scenario, status, v6] of trace.slice(1)) {
  if (seen.has(n)) problems.push(`#${n}: mapped twice`);
  seen.set(n, status);
  if (!(status in count)) {
    problems.push(`#${n}: unknown status «${status}»`);
    continue;
  }
  count[status]++;
  if (!v6 || v6.length < 8) problems.push(`#${n}: empty target`);
  if (status === 'NA' && v6.length < 30) problems.push(`#${n}: NA needs a reason`);
  if (status === 'GROUP') {
    const f = /^((?:[\w.-]+\.js(?: \/ )?)+):/.exec(v6);   // «file.js: group» or «a.js / b.js: group»
    if (!f || !f[1].split(' / ').every(x => existsSync(join(tests, x)))) problems.push(`#${n}: GROUP target «${v6.slice(0, 50)}» does not start with existing test files`);
  }
  if (status === 'ROW') {
    const m = /^(.*) (?:#\d+ )?\(0\.3\.11 ([^)]*)\)$/.exec(v6);
    if (!m || !new RegExp(`#${n}(?!\\d)`).test(m[2])) problems.push(`#${n}: ROW title «${v6.slice(0, 60)}» does not carry its 0.3.11 number`);
    else if (!h9.includes(m[1].replace(/ #\d+$/, '').replace(/ \[(?:ru|de|en)\]:.*/, '')) && !/^nav \[|^baseline: ring /.test(m[1])) problems.push(`#${n}: ROW family «${m[1].slice(0, 60)}» is not in h9-0311-rows.js`);
  }
}
for (const [n] of src) if (!seen.has(n)) problems.push(`#${n}: 0.3.11 scenario has no mapping`);
for (const n of seen.keys()) if (!src.some(r => r[0] === n)) problems.push(`#${n}: not a 0.3.11 scenario`);
console.log(`0.3.11 scenarios ${src.length}, mapped ${seen.size}: ROW ${count.ROW}, GROUP ${count.GROUP}, NA ${count.NA}`);
if (problems.length) {
  console.log(problems.slice(0, 40).join('\n') + (problems.length > 40 ? `\n… ${problems.length - 40} more` : ''));
  process.exit(1);
}
console.log('every 0.3.11 scenario is accounted for');
