  /* ---- I2 · R01 / FR-191 per-language build: the page of a language carries the text of that language only (platform-src/tools-build/strip-langs.mjs) ---- */
  const I2_PAGES = { ru: 'index.html', de: 'de.html', en: 'en.html', kk: 'kk.html' };
  const I2_CYR = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/g;
  /* sizes in bytes of the pages before the strip (platform/*.html of 2026-10-31, spec R01): the known quantity the weight is compared with */
  const I2_BEFORE = { ru: 4132238, de: 4011323, en: 3992332, kk: 4137949 };
  const i2Text = async (w, p) => (await w.fetch(p, { cache: 'no-store' })).text();
  /* the build module is loaded from its text through a blob URL, so the result does not depend on the MIME type the static server gives to .mjs */
  const i2Scanner = async () => import(URL.createObjectURL(new Blob([await (await fetch('../platform-src/tools-build/strip-langs.mjs', { cache: 'no-store' })).text()], { type: 'text/javascript' })));

  await group('I2 R01 stripLangs: T(ru,de,en,kk) becomes T(<page language>), kk without a value reads RU, an empty kk stays empty', 'ru', async (g, ev, w) => {
    const { stripLangs } = await i2Scanner(), src = "x = T('р', 'd', 'e', 'қ'); y = T('р2', 'd2', 'e2'); z = T('р3', 'd3', 'e3', '');";
    eq(stripLangs(src, 'ru'), "x = T('р'); y = T('р2'); z = T('р3');", 'ru');
    eq(stripLangs(src, 'de'), "x = T('d'); y = T('d2'); z = T('d3');", 'de');
    eq(stripLangs(src, 'en'), "x = T('e'); y = T('e2'); z = T('e3');", 'en');
    eq(stripLangs(src, 'kk'), "x = T('қ'); y = T('р2'); z = T('');", 'kk: no value -> ru, empty -> empty (the runtime T does the same)');
    let bad = null; try { stripLangs(src, 'fr'); } catch (e) { bad = e; } assert(bad, 'unknown language throws');
  });
  await group('I2 R01 stripLangs: strings, templates, nested brackets, regexes, comments and member calls are read as JavaScript, not as text', 'ru', async (g, ev, w) => {
    const { stripLangs } = await i2Scanner(), st = {}, en = s => stripLangs(s, 'en', st);
    eq(en("T('a)', \"b,\", 'e\\'x', 'k')"), "T('e\\'x')", 'brackets, commas and escaped quotes inside strings');
    eq(en('T(`a${T(1, 2, 3, 4)}`, `b ${x ? T("q", "w", "e", "r") : 0}`, `e${f(1, 2)}`, `k`)'), 'T(`e${f(1, 2)}`)', 'template literal with an expression; a nested T() in a kept argument is stripped too');
    eq(en("T(f(1, 2), g([1, 2], {a: 1, b: 2}), h(x => (x, 1)), k)"), 'T(f(1, 2),f(1, 2),h(x => (x, 1)))', 'nested calls, arrays, objects, arrows (an expression member keeps the fallback to the first one)');
    eq(en("T(a, b, /[,)]\\//.test(s) ? 'x' : 'y', k)"), "T(a,a,/[,)]\\//.test(s) ? 'x' : 'y')", 'a regex literal with brackets and a slash in a class');
    eq(en("n = a / b; T('1', '2', '3', '4') / c; /T\\(/.test(s)"), "n = a / b; T('3') / c; /T\\(/.test(s)", 'division is not a regex, a regex is not a call');
    eq(en("// T('a','b')\nT('a', /* T('x','y') */ 'b', 'c', 'd')"), "// T('a','b')\nT('c')", 'comments are not calls, a comment inside a dropped argument goes with it');
    eq(en("s = \"T('a','b','c','d')\" + 'T(1,2,3)' + x.T('a', 'b', 'c', 'd') + obj?.T(1, 2, 3) + nT('a', 'b', 'c') + T$('a', 'b', 'c')"), "s = \"T('a','b','c','d')\" + 'T(1,2,3)' + x.T('a', 'b', 'c', 'd') + obj?.T(1, 2, 3) + nT('a', 'b', 'c') + T$('a', 'b', 'c')", 'only the free function T: strings, member calls and longer names stay');
    eq(en('const T = (...a) => (a[LI] != null ? a[LI] : a[0]); function T2() {}'), 'const T = (...a) => (a[LI] != null ? a[LI] : a[0]); function T2() {}', 'the definition of T is not a call');
    eq(en("T('only one'); T(...parts); T(a, ...rest)"), "T('only one'); T(...parts); T(a, ...rest)", 'one argument and spreads stay as they are');
    eq(en("T('a', 'b', 'c', 'd',)"), "T('c')", 'trailing comma');
    eq(stripLangs("T(q[0], q[1], q[2], q[3])", 'kk'), 'T(q[0],q[0],q[0],q[3])', 'an expression member can be null at run time: the fallback to the first member stays (ECO_BL tq())');
    eq(stripLangs("T(q[0], q[1], q[2], q[3])", 'ru'), 'T(q[0])', 'the first member needs no fallback');
    stripLangs("T('a', 'b', 'c', 'd'); T('x'); T(...p); T(p, ...q); x.T(1, 2)", 'en', st);
    assert(st.calls === 4 && st.stripped === 1 && st.skipped.length === 1, 'counted: ' + JSON.stringify(st));
  });
  await group('I2 R01.1 stripLangs {comments}: dropping comments and indentation keeps placeholders, strings, regexes and line breaks that matter', 'ru', async (g, ev, w) => {
    const { stripLangs } = await i2Scanner(), min = s => stripLangs(s, 'ru', {}, { comments: true });
    eq(min("  a = 1; // note\n  /* block */ b = 2;\n\n\n  c = '  // not a comment  ';\n"), "a = 1; \nb = 2;\nc = '  // not a comment  ';\n", 'line and block comments, indentation, blank lines');
    eq(min("a = 1\n/* Banner of a file\n   more text */\nb = 2"), "a = 1\n/* Banner of a file */\nb = 2", 'a comment at the start of a line is a banner: its first line stays (g4-architecture finds the file boundaries by it)');
    eq(min("a = 1\n  /* x\ny */ b = 2"), "a = 1\nb = 2", 'an indented block comment over lines goes, the line break stays (no glued statements)');
    eq(min("a = /*@@STRINGS@@*/ {};"), "a = /*@@STRINGS@@*/ {};", 'build placeholders survive');
    eq(min("a = `x\n   // y\n  ${b /* c */}`;"), "a = `x\n   // y\n  ${b  }`;", 'template text is not touched, comments inside ${} are');
    eq(min("a = b/* c */+d;"), "a = b +d;", 'a comment between tokens never glues them');
  });
  await group('I2 R01.1 verifyStrip: the stripped script must parse and keep the number of T( calls', 'ru', async (g, ev, w) => {
    const { stripLangs, verifyStrip: verify } = await i2Scanner(), verifyStrip = (a, b, l) => verify(a, b, l, code => new Function(code)), src = "a = T('1', '2', '3', '4'); b = T('5', '6', '7', '8');", out = stripLangs(src, 'de');
    eq(await verifyStrip(src, out, 'de'), 2, 'two calls before and after');
    let e1 = null; try { await verifyStrip(src, "a = T('2');", 'de'); } catch (e) { e1 = e; } assert(e1 && /calls before 2, after 1/.test(e1.message), 'a lost call is reported: ' + (e1 && e1.message));
    let e2 = null; try { await verifyStrip(src, "a = T('2'); b = T('6'", 'de'); } catch (e) { e2 = e; } assert(e2, 'a call count that matches is not enough when the result does not parse');
    let e3 = null; try { await verifyStrip(src, "a = T('2'); b = T('6'; ", 'de'); } catch (e) { e3 = e; } assert(e3 && /does not parse|calls before/.test(e3.message), 'syntax error is reported');
  });

  /* the built pages */
  await group('I2 R01 pages: every language page carries the text of its own language in T() and no other member of the tuple', 'ru', async (g, ev, w) => {
    const pages = {}; for (const l of Object.keys(I2_PAGES)) pages[l] = await i2Text(w, I2_PAGES[l]);
    /* helpGroup('start', T('Начало работы', 'Erste Schritte', 'Getting started', 'Жұмысты бастау')) in v6/help/00-framework.js */
    const mark = { ru: "T('Начало работы')", de: "T('Erste Schritte')", en: "T('Getting started')", kk: "T('Жұмысты бастау')" };
    for (const l of Object.keys(pages)) for (const m of Object.keys(mark)) eq(pages[l].includes(mark[m]), l === m, l + ' page, text of ' + m);
    /* a stripped call is T(text); T(text,text,expression) is the null guard of an expression member (same text twice), anything else with two different texts is an unstripped tuple */
    for (const l of Object.keys(pages)) assert(!/(^|[^\w.$])T\(('[^'\\\n]*'|"[^"\\\n]*"), ?(?!\2[,)])(?:'|")/.test(pages[l]), l + ': a T() with two different text arguments is left in the page');
  });
  await group('I2 R01.1 pages: all four pages keep the same number of T( calls as the sources (no call lost, none added)', 'ru', async (g, ev, w) => {
    const n = {}; for (const l of Object.keys(I2_PAGES)) n[l] = ((await i2Text(w, I2_PAGES[l])).match(/(^|[^\w.$])T\(/g) || []).length;
    assert(n.ru >= 7000, 'calls in the ru page: ' + n.ru);
    eq(n.de, n.ru, 'de'); eq(n.en, n.ru, 'en'); eq(n.kk, n.ru, 'kk');
  });
  await group('I2 R01 pages: DE and EN carry about half of the Cyrillic they carried before the strip (the rest is help quads, driver app and reference data)', 'ru', async (g, ev, w) => {
    for (const l of ['de', 'en']) { const c = ((await i2Text(w, I2_PAGES[l])).match(I2_CYR) || []).length; assert(c < 300000, l + ' page has ' + c + ' Cyrillic characters (was 498772 before the strip)'); }
  });
  await group('I2 R01 weight: every language page is at least 25 % lighter than before the strip and stays within platform-src/budget.json', 'ru', async (g, ev, w) => {
    const B = await (await w.fetch('../platform-src/budget.json', { cache: 'no-store' })).json(), P = await (await w.fetch('../platform-src/perf-budget.json', { cache: 'no-store' })).json();
    for (const l of Object.keys(I2_PAGES)) {
      const n = (await (await w.fetch(I2_PAGES[l], { cache: 'no-store' })).arrayBuffer()).byteLength;
      assert(n <= I2_BEFORE[l] * 0.75, l + ' page is ' + n + ' B, before ' + I2_BEFORE[l] + ' B: less than -25 %');
      assert(n <= B.page_kb * 1024 && n <= P.pageKB.raw * 1024, l + ' page is over the budget');
    }
    assert(B.page_kb <= 3300 && P.pageKB.raw <= 3300, 'the budget was lowered to the new weight: ' + B.page_kb + ' / ' + P.pageKB.raw + ' KB');
  });

  /* what must NOT be cut: T stays a function with the fallback, help quads and the driver app keep all four languages */
  for (const lang of ['ru', 'de', 'en', 'kk']) await group('I2 R01 [' + lang + '] T stays a function with the kk -> ru fallback; help quads and the driver app text keep all four languages', lang, async (g, ev, w) => {
    eq(ev('typeof T'), 'function', 'T is a function');
    eq(ev("T('a', 'b', 'c')"), { ru: 'a', de: 'b', en: 'c', kk: 'a' }[lang], 'T with three arguments');
    eq(ev("T('a', 'b', 'c', 'd')"), { ru: 'a', de: 'b', en: 'c', kk: 'd' }[lang], 'T with four arguments');
    eq(ev("T('one')"), 'one', 'T with one argument');
    assert(ev("HELP.articles.every(function (a) { return Array.isArray(a.title) && a.title.length >= 4 })"), 'help titles are quads on the ' + lang + ' page');
    ev("ACT.setRole({v:'driver'});ACT.daLang({v:'kk'})"); assert(/Ауысым/.test(w.document.querySelector('.da-tabs').innerText), 'the driver app switches to kk at run time on the ' + lang + ' page');
    ev("ACT.daLang({v:'de'})"); assert(/Schicht/.test(w.document.querySelector('.da-tabs').innerText), 'and to de');
  });
