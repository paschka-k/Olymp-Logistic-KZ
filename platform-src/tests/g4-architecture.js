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
  for (const f of ['core.js', 'roles.js', 'screens/shell/001-shell-ext.js', 'screens/shell/002-a11y.js']) {
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

/* FR-220 · Kazakh completeness and review workflow (I-26) */
await group('S4 FR-220: completed KK texts are keyed, full length, and listed as machine translations in kk/_review.json', 'ru', async () => {
  const j = async p => JSON.parse(await g4Src('../platform-src/v6/strings/' + p));
  const kk = await j('kk/kkfill.json'),
    ru = await j('ru/kkfill.json'),
    rev = await j('kk/_review.json');
  const keys = Object.keys(kk);
  assert(keys.length >= 90, 'at least 90 completed texts: ' + keys.length);
  for (const k of keys) {
    assert(k in rev, k + ' is not listed in _review.json');
    assert(['mt', 'reviewed'].includes(rev[k].status) && rev[k].by && rev[k].date, k + ': review entry needs status, by, date');
    assert(kk[k].length >= ru[k].length * 0.45 || ru[k].length < 25, k + ' is still much shorter than the Russian text');
    assert(!/^\s*$/.test(kk[k]), k + ' is empty');
  }
  for (const k of Object.keys(rev)) assert(k in kk || k in (await j('kk/shell.json')), '_review.json names unknown key ' + k);
  const eq = await j('../../../tools/i18n/kk-equal-ok.json');
  assert(Array.isArray(eq.texts) && eq.texts.length > 10, 'allow-list of intentionally identical texts');
});
await group('S4 FR-220: ?kkreview=1 marks unreviewed machine translations [MT]; the normal page does not', 'kk', async (g, ev) => {
  eq(ev("LT('routes.no_routes_match')"), 'Сүзгілер бойынша маршруттар жоқ', 'plain text');
  const r = await fresh('kk?kkreview=1');
  try {
    eq(r.ev("LT('routes.no_routes_match')"), 'Сүзгілер бойынша маршруттар жоқ [MT]', 'marked in review mode');
    eq(r.ev("LT('core.assigned')"), r.ev('ST.assigned.l'), 'reviewed shell texts are not marked');
  } finally {
    r.done();
  }
});
for (const lang of ['ru', 'de', 'en'])
  await group('[' + lang + '] S4 FR-220: ?kkreview=1 changes nothing outside Kazakh', lang + '?kkreview=1', async (g, ev) => {
    assert(!/\[MT\]/.test(ev("LT('routes.no_routes_match')")), 'no [MT] marker');
  });

/* FR-200 · shared UI kit KIT (v6/base/30-kit.js) */
await group('S4 FR-200: KIT builds the six components and escapes its inputs', 'en', async (g, ev, w) => {
  const html = ev(
    `KIT.kpi('blue','truck','12','Vehicles <b>') + '|' + KIT.kv('A&B','<i>1</i>') + '|' + KIT.chip('green','x<y') + '|' + KIT.table(['H1','H&2'], '', {empty:'none', cols:2}) + '|' + KIT.table(['H'], '<tr><td>r</td></tr>', {id:'t1', attrs:'data-z', empty:false}) + '|' + KIT.field('au_name','Name','text','v"1','hint')`,
  );
  const box = w.document.createElement('div');
  box.innerHTML = html.split('|').join('<hr>');
  eq(box.querySelectorAll('.kpi-tile.tint.blue .value')[0].textContent, '12', 'kpi value');
  eq(box.querySelector('.kpi-tile .label').textContent, 'Vehicles <b>', 'kpi label escaped');
  eq(box.querySelector('small').textContent, 'A&B', 'kv key escaped');
  eq(box.querySelector('.chip.green').textContent, 'x<y', 'chip text escaped');
  const t = box.querySelectorAll('table.table');
  eq(t[0].querySelectorAll('th').length, 2, 'head cells');
  eq(t[0].querySelector('td.empty').textContent, 'none', 'empty row');
  eq(t[0].querySelector('td.empty').colSpan, 2, 'colspan');
  eq(t[1].id, 't1', 'table id');
  assert(t[1].hasAttribute('data-z'), 'raw attribute');
  eq(t[1].querySelectorAll('tbody tr').length, 1, 'rows, empty:false adds no empty row');
  eq(box.querySelector('input#au_name').value, 'v"1', 'field value');
  eq(box.querySelector('input#au_name').getAttribute('placeholder'), 'hint', 'field hint');
  eq(ev("KIT.table(['H'], '').includes('" + ev('LT("kit.empty")') + "')"), true, 'default empty text comes from the kit table');
});
await group('S4 FR-200: filter select and drawer frame come from the kit and behave as before', 'ru', async (g, ev, w) => {
  ev("go('orders')");
  const sel = w.document.querySelector('select[data-f="status"]');
  assert(sel && sel.options.length >= 6, 'orders status filter rendered by KIT.filterSelect');
  sel.value = 'delivered';
  sel.dispatchEvent(new w.Event('input', { bubbles: true }));
  eq(ev('S.f.status'), 'delivered', 'filter writes to the state object');
  ev("S.f.status=''; openDrawer({type:'load', id:S.loads[0].id, tab:'overview'})");
  const d = w.document.querySelector('aside.drawer[role=dialog][aria-modal=true]');
  assert(d && d.querySelector('#drawer-title') && d.querySelector('button.x[data-act=close]'), 'drawer frame');
  eq(d.getAttribute('aria-labelledby'), 'drawer-title', 'labelled');
});
await group('S4 FR-200: screens use the kit instead of private copies', 'ru', async () => {
  const src = await g4Src('index.html');
  const calls = (src.match(/KIT\.table\(/g) || []).length;
  assert(calls >= 28, 'KIT.table call sites: ' + calls);
  assert((src.match(/const tk = \(/g) || []).length <= 1, 'private KPI tile copies left: ' + (src.match(/const tk = \(/g) || []).length);
  assert((src.match(/const kv = \(/g) || []).length <= 4, 'private kv copies left');
  assert((src.match(/const sel = \(/g) || []).length <= 5, 'private filter-select copies left');
  assert((src.match(/class="kpi-tile tint \$\{cls\}"/g) || []).length <= 5, 'KPI tile markup outside KIT');
});

/* FR-202 · typed state model (JSDoc + schema check at startup) and the named action registry that feeds the audit log */
for (const lang of LANGS)
  await group('[' + lang + '] S4 FR-202: the demo state passes the schema check at startup; a malformed record is reported', lang, async (g, ev) => {
    eq(ev('S.schemaProblems.join("; ")'), '', 'no schema problems at startup');
    ev("S.loads[0].status = 'weird'; S.drivers[0].rto = NaN; S.loads.push(Object.assign({}, S.loads[1]))");
    const bad = ev('schemaCheck()');
    assert(
      bad.some(m => /loads\[0\].*status/.test(m)),
      'status enum: ' + bad.join('; '),
    );
    assert(
      bad.some(m => /drivers\[0\].*rto/.test(m)),
      'number field',
    );
    assert(
      bad.some(m => /duplicate id/.test(m)),
      'duplicate id',
    );
    eq(
      ev('schemaCheck({ loads: 1, drivers: [], trucks: [], role: "admin", route: "x", audit: [] }).join()').indexOf('loads: not an array') >= 0,
      true,
      'wrong container type',
    );
  });
await group('S4 FR-202: the action registry lists permissions and audit rules; every registered action exists in ACT', 'en', async (g, ev) => {
  const names = ev('Object.keys(ACTION_REGISTRY)');
  assert(names.length >= 9, 'registered actions: ' + names.length);
  for (const n of names) eq(ev('typeof ACT.' + n), 'function', n + ' is bound');
  eq(ev('ACTION_REGISTRY.doAssign.perm'), 'trips:write', 'permission lives in the registry');
  eq(ev('ACTION_REGISTRY.setRole.audit.module'), 'Roles', 'audit rule');
  let threw = false;
  try {
    ev("registerAction('doAssign', {})");
  } catch (e) {
    threw = true;
  }
  assert(threw, 'double registration is refused');
});
await group('S4 FR-202: registered actions write the audit log themselves, and only when something changed', 'en', async (g, ev, w) => {
  const n = () => ev('S.audit.length');
  let a = n();
  ev("ACT.setRole({v:'dispatcher'})");
  eq(n(), a + 1, 'role switch audited');
  eq(ev('S.audit[0].module + "|" + S.audit[0].subject'), 'Roles|dispatcher', 'entry');
  a = n();
  ev("ACT.setRole({v:'dispatcher'})");
  eq(n(), a, 'same role again: no entry');
  ev("ACT.setRole({v:'admin'})");
  const id = ev("S.loads.find(l => l.status === 'unassigned').id");
  a = n();
  ev("ACT.adv({id:'" + id + "', to:'delivered'})");
  eq(n(), a, 'rejected status change: no entry');
  const ok = ev("(() => { const l = S.loads.find(x => x.status === 'assigned'); return l ? l.id : null; })()");
  if (ok) {
    a = n();
    ev("ACT.adv({id:'" + ok + "', to:'loading'})");
    eq(n(), a + 1, 'accepted status change audited');
    assert(/Dispatch/.test(ev('S.audit[0].module')) && ev('S.audit[0].subject') === ok, 'entry names the load');
  }
  a = n();
  ev('ACT.auto()');
  assert(n() <= a + 1, 'auto-assign writes at most one entry');
  eq(ev('auditVerify().ok'), true, 'audit chain stays valid');
  ev("ACT.setRole({v:'viewer'})");
  w.document.body.insertAdjacentHTML('beforeend', '<button id="g4b" data-act="auto">x</button>');
  a = n();
  w.document.getElementById('g4b').click();
  eq(n(), a, 'a click blocked by the registry permission audits nothing');
  assert(/permission|Berechtigung|Нет прав|Құқық/i.test(ev('S.toast.msg')), 'viewer is refused by the registry permission: ' + ev('S.toast.msg'));
});

/* FR-203 · area folders and ownership (platform-src/OWNERS.json, tools/check-areas.mjs) */
await group('S4 FR-203: OWNERS.json covers every menu item; each area has an owner; numbering rule is documented', 'en', async (g, ev) => {
  const o = JSON.parse(await g4Src('../platform-src/OWNERS.json'));
  const menus = new Set(Object.values(o.areas).flatMap(a => a.menu));
  for (const id of ev('NAV.map(n => n[0])')) assert(menus.has(id), 'menu item ' + id + ' has no area in OWNERS.json');
  for (const [name, a] of Object.entries(o.areas)) assert(a.owner && a.owner.length > 3, 'area ' + name + ' needs an owner');
  assert(/NNN-kebab-name\.js/.test(o.numbering) && /BUILD ORDER/.test(o.numbering), 'numbering rule');
  assert(o.areas.shell.common && o.areas.shared.common, 'shell and shared are common ground');
  const order = (await g4Src('../platform-src/v6/screens/ORDER.txt')).split('\n').filter(l => l && !l.startsWith('#'));
  eq(order.join() === [...order].sort().join(), true, 'ORDER.txt is in name order');
  assert(order.length >= 64 && order[0] === '001-shell-ext.js' && order[order.length - 1] === '990-delivery.js', 'first and last file of the bundle order');
  const wf = await g4Src('../.github/workflows/lint.yml');
  assert(wf.includes('node tools/check-areas.mjs'), 'CI runs the area check');
});
await group('S4 FR-203: the bundle still follows the file-name order (first and last screens, no area-dependent order)', 'ru', async () => {
  const src = await g4Src('index.html');
  const at = s => src.indexOf(s);
  const marks = ['/* P6 · Shell parity', '/* S3 accessibility (docs/OPTIMISATION-FR.md, section E)', '/* Dashboard · Overview', '/* Orders & Loads (spec 5.2)', '/* S2 · Delivery'];
  const pos = marks.map(at);
  assert(
    pos.every(p => p > 0),
    'markers found: ' + pos.join(),
  );
  assert(
    pos.every((p, i) => !i || p > pos[i - 1]),
    'screens are assembled in NNN order: ' + pos.join(),
  );
});
