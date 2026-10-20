// FR-205 / FR-210 · merges the report.json files of the UI-test jobs (one per shard + the legacy suite) into one summary:
// totals, failures, the flaky report (groups that passed only on a retry), quarantined groups and the slowest suites
// with fresh shard weights. Fails when the shards did not cover every suite file exactly once.
//   node tools/ci/ui-report.cjs <dir with */report.json> [--out <dir>]
const fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2] || 'ui-results');
const oi = process.argv.indexOf('--out'), out = path.resolve(oi > 0 ? process.argv[oi + 1] : dir);
const files = [];
const walk = d => { if (!fs.existsSync(d)) return; for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'report.json') files.push(p); } };
walk(dir);
const reps = files.map(f => Object.assign({ file: path.relative(dir, f) }, JSON.parse(fs.readFileSync(f, 'utf8'))));
const sum = k => reps.reduce((s, r) => s + (r[k] || 0), 0);
const flaky = reps.flatMap(r => (r.flaky || []).map(f => Object.assign({ job: r.file }, f)));
const quar = reps.flatMap(r => (r.quarantined || []).map(q => Object.assign({ job: r.file }, q)));
const failures = reps.flatMap(r => r.failures || []);
const suites = Object.assign({}, ...reps.map(r => r.suites || {}));
const shards = reps.filter(r => r.shard), problems = [];
if (shards.length) {
  const n = shards[0].shard.n, seen = {};
  shards.forEach(r => r.shard.files.forEach(f => { seen[f] = (seen[f] || 0) + 1; }));
  const ks = new Set(shards.map(r => r.shard.k));
  if (ks.size !== n) problems.push(`only ${ks.size} of ${n} shard reports found`);
  if (Object.keys(seen).length !== shards[0].shard.of) problems.push(`shards covered ${Object.keys(seen).length} of ${shards[0].shard.of} suite files`);
  Object.entries(seen).filter(([, c]) => c > 1).forEach(([f]) => problems.push(`${f} ran in more than one shard`));
}
const esc = s => String(s).replace(/\|/g, '\\|');
const md = [`## UI tests · merged report (${reps.length} job reports)`, '',
  `**${sum('passed')}/${sum('total')} passed, ${sum('failed')} failed, ${flaky.length} flaky, ${quar.length} quarantined**`, '',
  '| job | tests | failed | flaky | time |', '|---|---:|---:|---:|---:|',
  ...reps.map(r => `| ${esc(r.file.replace(/[\\/]report\.json$/, ''))}${r.shard ? ` (shard ${r.shard.k}/${r.shard.n})` : ''} | ${r.total} | ${r.failed} | ${(r.flaky || []).length} | ${(r.ms / 1000).toFixed(0)} s |`), ''];
if (problems.length) md.push('**Shard coverage problems**', '', ...problems.map(p => '- ' + p), '');
if (failures.length) md.push('**Failures**', '', ...failures.map(f => '- ' + esc(f)), '');
md.push('### Flaky report (FR-210)', '');
if (flaky.length) md.push('Passed only on a retry. Fix the cause, or quarantine the group in `platform-src/tests/quarantine.json` with an owner and a reason.', '', '| group | job | attempts | error before the retry |', '|---|---|---:|---|', ...flaky.map(f => `| ${esc(f.name)} | ${esc(f.job.replace(/[\\/]report\.json$/, ''))} | ${f.attempts} | ${esc(f.errors[0])} |`), '');
else md.push('No flaky groups in this run.', '');
if (quar.length) md.push('**Quarantined groups that failed**', '', ...quar.map(q => `- ${esc(q.name)} — ${esc(q.error)}`), '');
const top = Object.entries(suites).sort((a, b) => b[1] - a[1]);
if (top.length) md.push('<details><summary>Slowest suites and fresh shard weights (FR-205)</summary>', '', '| suite | ms |', '|---|---:|', ...top.slice(0, 10).map(([f, ms]) => `| ${f} | ${ms} |`), '', 'For `platform-src/tests/shard-weights.json` → `"ms"`:', '', '```json', JSON.stringify(Object.fromEntries(Object.entries(suites).sort())), '```', '</details>', '');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'flaky-report.json'), JSON.stringify({ total: sum('total'), passed: sum('passed'), failed: sum('failed'), flaky, quarantined: quar, problems, suites }, null, 2));
fs.writeFileSync(path.join(out, 'ui-report.md'), md.join('\n') + '\n');
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md.join('\n') + '\n');
console.log(md.join('\n'));
if (!reps.length) { console.error('no report.json found in ' + dir); process.exit(1); }
if (problems.length) process.exit(1);
