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
