  /* ---- S4 · Architecture (docs/OPTIMISATION-FR.md wave 2): FR-199 string tables, FR-200 UI kit, FR-201 export helper, FR-202 typed state,
     FR-203 area folders, FR-204 lint / format / line endings, FR-207 test hooks, FR-220 Kazakh completeness, FR-221 locale formatting ---- */
  const g4Src = async p => { const r = await fetch(p); assert(r.ok, 'fetch ' + p + ': ' + r.status); return r.text(); };

  await group('S4 FR-204: one line-ending policy (.gitattributes / .editorconfig), LF-only bundles, lint + format in CI', 'ru', async () => {
    const ga = await g4Src('../.gitattributes'), ec = await g4Src('../.editorconfig'), pi = await g4Src('../.prettierignore');
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
