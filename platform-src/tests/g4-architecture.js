/* ---- S4 · Architecture (docs/OPTIMISATION-FR.md wave 2): FR-199 string tables, FR-200 UI kit, FR-201 export helper, FR-202 typed state,
     FR-203 area folders, FR-204 lint / format / line endings, FR-207 test hooks, FR-220 Kazakh completeness, FR-221 locale formatting ---- */
const g4Src = async p => {
  const r = await fetch(p);
  assert(r.ok, 'fetch ' + p + ': ' + r.status);
  return r.text();
};

await group('S4 FR-204: one line-ending policy (.gitattributes / .editorconfig), LF-only bundles, lint + format in CI', 'ru', async () => {
  const ga = await g4Src('../.gitattributes'),
    ec = await g4Src('../.editorconfig'),
    pi = await g4Src('../.prettierignore');
  assert(/^\* text=auto eol=lf$/m.test(ga), '.gitattributes: * text=auto eol=lf');
  assert(/^platform-v5\.3\*\.html -text$/m.test(ga), 'frozen v5.3 bundle stays byte-for-byte');
  assert(/^end_of_line = lf$/m.test(ec) && /^charset = utf-8$/m.test(ec), '.editorconfig: LF, UTF-8');
  assert(/^platform\/$/m.test(pi) && /^releases\/$/m.test(pi), 'generated / frozen output is never formatted');
  for (const f of ['index.html', 'de.html', 'en.html', 'kk.html', 'tests.html']) assert(!(await g4Src(f)).includes('\r'), f + ' has CR characters');
  const wf = await g4Src('../.github/workflows/lint.yml');
  for (const s of ['npm run --prefix tools/lint lint', 'npm run --prefix tools/lint format:check', 'i/crlf']) assert(wf.includes(s), 'lint workflow runs ' + s);
  const pk = JSON.parse(await g4Src('../tools/lint/package.json'));
  for (const d of ['eslint', 'prettier']) assert(/^\d+\.\d+\.\d+$/.test(pk.devDependencies[d] || ''), d + ' pinned to an exact version');
});
await group('S4 FR-204: sources stay valid JavaScript (data placeholders are /*@@NAME@@*/{} comments, filled by the build)', 'en', async (g, ev) => {
  const src = await g4Src('en.html');
  assert(!/@@(ROLEPERMS|REGISTER|WHATSNEW|LANG|BUILD)@@\*\/\{\}/.test(src), 'every data placeholder was filled');
  assert(ev('Object.keys(ROLE_PERMS).length') >= 11, 'role permissions embedded');
  eq(ev('LANG'), 'en', 'language placeholder');
});

/* FR-221 · locale formatting: one helper LF (v6/base/10-locale.js) for numbers, ₸, dates and units per language */
const g4Loc = {
  ru: { dec: '4,5', km: 'км', h: 'ч' },
  de: { dec: '4,5', km: 'km', h: 'h' },
  en: { dec: '4.5', km: 'km', h: 'h' },
  kk: { dec: '4,5', km: 'км', h: 'сағ' },
};
for (const lang of LANGS)
  await group('[' + lang + '] S4 FR-221: LF formats numbers, tenge, dates and units in the UI language', lang, async (g, ev, w) => {
    const x = g4Loc[lang];
    eq(ev('LF.dec(4.5)'), x.dec, 'decimal separator');
    eq(ev('LF.dec(2, 1)'), x.dec.replace('4', '2').replace('5', '0'), 'fixed digits');
    eq(ev('LF.kzt(1234567.4)'), '1 234 567 ₸', 'tenge: plain-space groups');
    eq(ev('LF.int(12345.6)'), '12 346', 'integer: no-break space groups');
    eq(ev('LF.fix(1234.5, 2)'), '1 234' + x.dec.charAt(1) + '50', 'fixed amount');
    eq(ev("LF.date('2026-10-18T09:30:00Z')"), '18.10.2026', 'date dd.mm.yyyy');
    assert(/^18\.10, \d\d:30$/.test(ev("LF.dt('2026-10-18T09:30:00Z')")), 'date + time dd.mm, hh:mm');
    eq(ev('LF.hm(14 * 60 + 32)'), '14:32', 'minutes of the day');
    eq(ev("LF.unit('km')"), x.km, 'unit km');
    eq(ev("LF.unit('h')"), x.h, 'unit h');
    eq(ev("LF.q(12345, 'km')"), '12 345 ' + x.km, 'quantity');
    eq(ev('LF.temp(-18) + "|" + LF.temp(4.5)'), '-18 °C|+' + x.dec + ' °C', 'temperature');
    eq(ev('kzt === LF.kzt && fd === LF.date && fdt === LF.dt && hmm === LF.hm'), true, 'core helpers are the LF functions');
    ev("S.loads[0].temp = 4.5; go('orders')");
    assert(w.document.querySelector('.chip[class*=temp-]').textContent.includes(x.dec), 'temperature chip uses the language separator');
    clean(w, 'orders ' + lang);
  });
await group('S4 FR-221: no screen formats numbers on its own (toLocaleString / replace(".", ",") only in LF)', 'ru', async () => {
  const src = await g4Src('index.html'),
    a = src.indexOf('const LOCALE = {'),
    b = src.indexOf('})();', a);
  assert(a > 0 && b > a, 'LF block in the bundle');
  const rest = src.slice(0, a) + src.slice(b);
  const m = rest.match(/.{0,50}(toLocaleString\(|toLocaleDateString\(|\.replace\('\.', ','\)).{0,30}/);
  assert(!m, 'formatting outside LF: ' + (m && m[0]));
});

/* FR-201 · shared export helper XP (v6/base/20-export.js) */
await group('S4 FR-201: XP.csv = BOM + ";" + quotes + formula-injection guard; numbers stay numbers', 'en', async (g, ev) => {
  eq(ev("XP.csv([['a','b'],[1,'x\"y']])"), '﻿"a";"b"\n"1";"x""y"', 'BOM, separator, quote doubling');
  eq(
    ev("XP.csv([['=1+1','+7','-x','@a','\	z','-5','ok',null]], {bom:false})"),
    '"\'=1+1";"+7";"\'-x";"\'@a";"\'\	z";"-5";"ok";""',
    'guard: text with = - @ TAB is neutralised, plain numbers are not',
  );
  eq(ev("XP.csv([['a;b','c']], {quote:'min', eol:'\\r\\n', bom:false})"), '"a;b";c', 'minimal quoting');
  eq(ev("XP.name('fleet', 'csv', '2026-10-18')"), 'fleet-2026-10-18.csv', 'dated name');
  eq(ev("XP.name('fleet', 'csv')"), 'fleet-2026-10-18.csv', 'dated name from the demo clock');
});
await group('S4 FR-201: every export goes through XP and is recorded in __downloads (no Save-as dialog)', 'ru', async (g, ev, w) => {
  const n0 = w.__downloads.length;
  ev("XP.saveCsv('t.csv', [['a']])");
  ev("XP.saveJson('t.json', {a: 1})");
  ev("XP.openDoc('<p>x</p>')");
  eq(w.__downloads.length, n0 + 3, 'three downloads recorded');
  eq(w.__downloads[n0].name, 't.csv');
  eq(w.__downloads[n0 + 1].name, 't.json');
  assert(/^blob:/.test(w.__downloads[n0 + 2].href), 'document as blob');
  const bytes = [...new Uint8Array(await (await w.fetch(w.__downloads[n0].href)).arrayBuffer())];
  eq(bytes.slice(0, 3).join(), '239,187,191', 'UTF-8 BOM first');
  eq(String.fromCharCode(...bytes.slice(3)), '"a"', 'file content');
  const src = await g4Src('index.html');
  const a = src.indexOf('const XP = (() => {'),
    b = src.indexOf('})();', a);
  const rest = src.slice(0, a) + src.slice(b);
  const m = rest.match(/.{0,50}(new Blob\(|createObjectURL).{0,30}/);
  assert(!m, 'export code outside XP: ' + (m && m[0]));
});
await group('S4 FR-201: screen exports keep their file names and content shape', 'ru', async (g, ev, w) => {
  const last = () => w.__downloads[w.__downloads.length - 1];
  ev("ACT.setRole({v:'admin'}); go('drivers')");
  ev('ACT.compRep()');
  eq(last().name, 'driver-compliance.csv');
  const t = await (await w.fetch(last().href)).text();
  assert(t.startsWith('"code";"name"'), 'driver report header: ' + t.slice(0, 40));
  ev("go('billing')");
  ev('ACT.bExp()');
  eq(last().name, 'invoices.csv');
  ev("go('fleet'); setTab('fleet','registry')");
  ev('ACT.rgCsv()');
  assert(/^fleet-register-\d{4}-\d\d-\d\d\.csv$/.test(last().name), 'fleet register name');
  assert(ev('S.res.lastCsv').startsWith('﻿'), 'fleet register keeps its BOM');
});

/* FR-199 · keyed string tables per language (v6/strings/<lang>/*.json, LT() in v6/base/05-strings.js) */
await group('S4 FR-199: string tables have the same keys in all four languages, DE / EN without Cyrillic, shell sources use LT()', 'ru', async () => {
  const tab = async l => JSON.parse(await g4Src('../platform-src/v6/strings/' + l + '/shell.json'));
  const t = { ru: await tab('ru'), de: await tab('de'), en: await tab('en'), kk: await tab('kk') };
  const keys = Object.keys(t.ru);
  assert(keys.length >= 200, 'shell table has ' + keys.length + ' keys');
  for (const l of ['de', 'en', 'kk']) eq(Object.keys(t[l]).join('|'), keys.join('|'), l + ' keys = ru keys, same order');
  for (const l of ['de', 'en']) for (const k of keys) assert(!/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(t[l][k]), l + ' key ' + k + ' contains Cyrillic');
  for (const f of ['core.js', 'roles.js', 'screens/001-shell-ext.js', 'screens/002-a11y.js']) {
    const src = await g4Src('../platform-src/v6/' + f);
    const m = src.match(/[^\w.]T\(\s*['"`][^)]{0,40}/);
    assert(!m, f + ' still has an inline T() tuple: ' + (m && m[0]));
  }
});
for (const lang of LANGS)
  await group('[' + lang + '] S4 FR-199: LT() resolves keys, fills {0} placeholders, and no menu / shell text is missing', lang, async (g, ev, w) => {
    eq(ev("LT('core.assigned')"), ev('ST.assigned.l'), 'ST label comes from the table');
    eq(ev("LT('no.such.key')"), '⟦no.such.key⟧', 'missing key is visible');
    eq(ev('LT_MISS.pop()'), 'no.such.key', 'and counted');
    ev("STRINGS['t.p'] = 'a {1} b {0}'");
    eq(ev("LT('t.p', 'X', 'Y')"), 'a Y b X', 'placeholders');
    for (const role of ['admin', 'driver', 'customer', 'partner']) {
      ev("ACT.setRole({v:'" + role + "'})");
      for (const id of ev('navItems().map(n=>n[0])')) {
        ev("go('" + id + "')");
        clean(w, role + ' ' + id);
      }
    }
    ev('S.kbd = true; render(); S.kbd = false; render()');
    eq(ev('LT_MISS.join()'), '', 'no missing string keys');
    if (lang === 'de' || lang === 'en') assert(!/[А-Яа-яЁё]/.test(w.document.querySelector('#root').innerText), 'no Cyrillic in the shell');
  });
