  /* ---- a field without the selection API (type="email") keeps its caret through a redraw (base/45-region.js caretNodeOf / caretNodeBack).
     Before: the booking form redraws on every key, focus() put the caret at the start, "clasberg" was written as "grebsalc".
     Test frames may not get real focus (background window), so the focused element is pinned through document.activeElement. ---- */
  const j1Book = (ev, w) => {
    ev("ACT.setRole({ v: 'customer' }); go('book')");
    ev("(function(){ var t = document.querySelector('[data-bk=\"payerOn\"]'); if (t && !t.checked) t.click(); })()");
    const d = w.document, pin = { el: null };
    Object.defineProperty(d, 'activeElement', { configurable: true, get: () => pin.el || d.body });
    return { d, pin };
  };
  await group('caret: the focused e-mail field of the booking form is the same element after each keystroke render (full render and region render)', 'en', async (g, ev, w) => {
    const { d, pin } = j1Book(ev, w), f0 = d.getElementById('bk_payer.email');
    assert(f0 && f0.type === 'email', 'payer e-mail field is type=email');
    pin.el = f0;
    for (const v of ['c', 'cl', 'cla']) {
      f0.value = v; f0.dispatchEvent(new w.Event('input', { bubbles: true }));
      const f = d.getElementById('bk_payer.email');
      assert(f === f0, 'after "' + v + '" the typed-in element survives the redraw');
      eq(f.value, v, 'value "' + v + '"');
    }
    ev("renderRegion('main')");
    assert(d.getElementById('bk_payer.email') === f0, 'region render keeps the element');
    eq(f0.value, 'cla', 'value after region render');
    pin.el = null; ev('render()');
    assert(d.getElementById('bk_payer.email') !== f0, 'a field that is not focused is rebuilt as before');
    eq(d.getElementById('bk_payer.email').value, 'cla', 'rebuilt field shows the typed value');
  });
  await group('caret: the kept element takes the fresh attributes; a focused text field is rebuilt (its caret comes back by setSelectionRange)', 'en', async (g, ev, w) => {
    const { d, pin } = j1Book(ev, w), f0 = d.getElementById('bk_payer.email');
    pin.el = f0; f0.setAttribute('data-stale', '1'); ev('render()');
    assert(d.getElementById('bk_payer.email') === f0 && !f0.hasAttribute('data-stale'), 'stale attribute dropped, element kept');
    eq(f0.getAttribute('autocomplete'), d.getElementById('bk_payer.email').getAttribute('autocomplete'), 'fresh attributes present');
    const p = d.getElementById('bk_payer.contact');
    pin.el = p; ev('render()');
    assert(d.getElementById('bk_payer.contact') !== p, 'text field is not swapped');
    eq(w.eval('caretNodeOf(document.getElementById("bk_payer.contact"))'), null, 'caretNodeOf ignores fields with a selection API');
  });
