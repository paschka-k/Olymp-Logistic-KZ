  /* ---- embed mode ?embed=customer: the customer portal inside the marketing site's iframe (screens/shell/004-embed.js) ---- */
  const j0Open = async (file, q) => { const fr = document.createElement('iframe'); fr.style.cssText = 'width:1000px;height:760px'; fr.src = file + '?' + q; document.getElementById('frames').appendChild(fr); await new Promise(ok => { fr.onload = ok; }); await new Promise(r => setTimeout(r, 200)); return fr; };
  await group('embed: ?embed=customer starts in the customer role on its home screen, without operator chrome, marked as a simulation', 'en', async () => {
    const fr = await j0Open('en.html', 'embed=customer'), w = fr.contentWindow;
    eq(w.eval('S.role'), 'customer', 'role');
    eq(w.eval('S.route'), 'book', 'home screen of the customer');
    eq(w.document.documentElement.dataset.embed, 'customer', 'html[data-embed]');
    ['.topbar .who', '.side-tools'].forEach(s => { const e = w.document.querySelector(s); assert(!e || w.getComputedStyle(e).display === 'none', s + ' is hidden'); });
    assert(w.document.querySelector('[data-test="embed-demo"]'), 'the simulation note is drawn');
    eq(w.document.querySelector('[data-test="embed-demo"]').textContent, w.eval("LT('shell.embed_demo')"), 'note text from the strings');
    fr.remove();
  });
  await group('embed: Escape asks the host page to close, but only when nothing inside the portal is open', 'en', async () => {
    const fr = await j0Open('en.html', 'embed=customer'), w = fr.contentWindow, got = [];
    const on = e => { if (e.source === w && e.data && e.data.type === 'kz-embed') got.push(e.data.action); };
    window.addEventListener('message', on);
    w.eval('S.drawer = { type: "booking", id: "x" }'); w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 100)); assert(!got.includes('close'), 'an open drawer takes the Escape');
    w.eval('S.drawer = null'); w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 100)); assert(got.includes('close'), 'a plain screen sends close');
    window.removeEventListener('message', on); fr.remove();
  });
  await group('embed: without the parameter the shell is unchanged; an unknown value is ignored', 'en', async () => {
    const fr = await j0Open('en.html', 'embed=driver'), w = fr.contentWindow;
    assert(!w.document.documentElement.dataset.embed, 'no data-embed'); assert(!w.document.querySelector('[data-test="embed-demo"]'), 'no note'); fr.remove();
  });
  await group('embed: every language has the note', 'ru', async () => {
    for (const [f, l] of [['index.html', 'ru'], ['de.html', 'de'], ['kk.html', 'kk']]) { const fr = await j0Open(f, 'embed=customer'), w = fr.contentWindow; eq(w.eval('S.role'), 'customer', l + ' role'); assert(w.document.querySelector('[data-test="embed-demo"]').textContent.length > 5, l + ' note'); fr.remove(); }
  });
  /* public Kökzhol material never names the group companies: the embed forces the Kökzhol design, hides the switch and leaves no "Olymp" / "KombiMED" in anything visible */
  await group('embed: Kökzhol design only, no design switch, no banned names on any reachable screen, tab or drawer (every language)', 'en', async () => {
    for (const f of ['en.html', 'index.html', 'de.html', 'kk.html']) {
      const fr = await j0Open(f, 'embed=customer&brand=olymp'), w = fr.contentWindow;
      eq(w.eval('S.design'), 'kokzhol', f + ' design is Kökzhol even with ?brand=olymp');
      eq(w.document.documentElement.dataset.design, 'kokzhol', f + ' html[data-design]');
      w.eval('ACT.setDesign()'); eq(w.eval('S.design'), 'kokzhol', f + ' the switch does nothing');
      const b = w.document.querySelector('.design-btn'); assert(!b || w.getComputedStyle(b).display === 'none', f + ' design switch hidden');
      const found = await w.eval('embedAudit({ maxClicks: 25 })');
      eq(found.length, 0, f + ' banned names: ' + found.slice(0, 5).join(' | '));
      fr.remove();
    }
  });
  await group('embed: the name scrub rewrites client and company names to neutral placeholders', 'en', async () => {
    const fr = await j0Open('en.html', 'embed=customer'), w = fr.contentWindow, s = x => w.eval('embedScrub')(x);
    eq(s('KDL Olymp branch · Almaty'), 'Client · Almaty', 'branch label');
    eq(s('own KDL Olymp goods · hub → branch'), "the client's own goods · hub → branch", 'own goods');
    eq(s('Deviation closed · report for KDL Olymp ready'), 'Deviation closed · report for the client ready', 'QA report');
    eq(s('Design: Olymp / Kökzhol'), 'Design: Kökzhol', 'design label');
    assert(!/olymp|kombimed/i.test(s('KombiMED GmbH · Olymp Logistic LLP · olymp')), 'fallbacks');
    const p = w.document.createElement('p'); p.title = 'KDL Olymp'; p.textContent = 'KDL Olymp branch · Aktobe'; w.document.body.appendChild(p);
    await new Promise(r => setTimeout(r, 20)); eq(p.textContent, 'Client · Aktobe', 'DOM text'); eq(p.title, 'Client', 'DOM title');
    fr.remove();
    const fr2 = await j0Open('index.html', 'embed=customer'), s2 = x => fr2.contentWindow.eval('embedScrub')(x);
    eq(s2('Филиал KDL Olymp · Алматы'), 'Клиент · Алматы', 'ru branch label'); fr2.remove();
  });
