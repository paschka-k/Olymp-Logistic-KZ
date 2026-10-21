  /* ---- Q4 narrow-window layout: at 375 and 768 px no screen / tab / load-drawer tab scrolls sideways, the page title never breaks
     word by word, header buttons stay one line, the burger opens and closes the off-canvas menu, search and "⋯" overflow work ---- */
  const narrow = async (w, px) => { w.frameElement.style.cssText = `display:block;position:absolute;left:-10000px;top:0;width:${px}px;height:760px;border:0`; await new Promise(r => setTimeout(r, 30)); /* not requestAnimationFrame: it never fires in a hidden tab */ assert(Math.abs(w.innerWidth - px) <= 2, 'iframe width ' + w.innerWidth + ' for ' + px + ' px'); /* ±2: display scaling rounds 768 css px to 767 on some screens */ };
  const sideways = (w, where) => {
    const d = w.document, de = d.documentElement, m = d.querySelector('main');
    assert(de.scrollWidth <= de.clientWidth + 1, where + ': page scrolls sideways ' + de.scrollWidth + ' > ' + de.clientWidth);
    assert(m.scrollWidth <= m.clientWidth + 1, where + ': main scrolls sideways ' + m.scrollWidth + ' > ' + m.clientWidth);
  };
  const headOk = (w, where) => {
    const t = w.document.querySelector('.page-title'); if (!t) return;
    const cs = w.getComputedStyle(t), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.25;
    const lines = Math.round(t.getBoundingClientRect().height / lh), words = t.textContent.trim().split(/\s+/).length;
    assert(lines <= Math.max(1, Math.ceil(words / 2)), where + ': title "' + t.textContent + '" breaks into ' + lines + ' lines');
    w.document.querySelectorAll('.page-head .actions .btn').forEach(b => { if (b.offsetParent) assert(b.getBoundingClientRect().height <= 44, where + ': header button wraps: ' + b.textContent.trim()); });
  };
  for (const lang of LANGS) for (const px of [375, 768]) await group('[' + lang + '] narrow ' + px + ' px: every screen, tab and load-drawer tab fits without sideways scroll, titles and header buttons stay whole', lang, async (g, ev, w) => {
    await narrow(w, px);
    const navs = ev('navItems().map(n=>n[0])'); eq(navs.length, 13, 'menu items');
    for (const id of navs) {
      ev(`go('${id}')`); const tabs = ev(`tabsOf('${id}').map(t=>t.key)`);
      if (!tabs.length) { sideways(w, id); headOk(w, id); continue; }
      for (const t of tabs) { ev(`setTab('${id}','${t}')`); sideways(w, id + '/' + t); headOk(w, id + '/' + t); }
    }
    ev("go('orders');setTab('orders','orders');ACT.open({id:S.loads[0].id})");
    const dtabs = [...w.document.querySelectorAll('.drawer-tabs .tab')].map(e => e.dataset.v); assert(dtabs.length >= 3, 'load drawer tabs');
    for (const t of dtabs) {
      ev(`ACT.tab({v:'${t}'})`); const dr = w.document.querySelector('.drawer');
      assert(dr.getBoundingClientRect().right <= px + 1 && dr.getBoundingClientRect().width <= px + 1, 'drawer/' + t + ': wider than the window');
      assert(dr.scrollWidth <= dr.clientWidth + 1, 'drawer/' + t + ': scrolls sideways ' + dr.scrollWidth + ' > ' + dr.clientWidth); sideways(w, 'drawer/' + t);
    }
    if (px <= 700) eq(Math.round(w.document.querySelector('.drawer').getBoundingClientRect().width), px, 'drawer is full-width on a phone');
    ev('closeDrawer()'); clean(w, 'narrow ' + px);
  });
  for (const px of [375, 768]) await group('narrow ' + px + ' px: burger opens and closes the menu, breadcrumb one line or hidden, search and "⋯" overflow, alarms stay', 'ru', async (g, ev, w) => {
    await narrow(w, px); const d = w.document, vis = s => { const e = d.querySelector(s); return !!(e && e.offsetParent && e.getBoundingClientRect().width > 0); };
    ev("go('routes')");
    assert(vis('.burger'), 'burger visible'); assert(d.querySelector('.sidebar').getBoundingClientRect().right <= 0, 'menu off-canvas while closed');
    d.querySelector('.burger').click(); assert(ev('S.sideOpen'), 'burger opens'); assert(d.querySelector('.sidebar.open') && d.querySelector('.side-back'), 'menu + backdrop');
    d.querySelector('.side-back').click(); assert(!ev('S.sideOpen') && !d.querySelector('.sidebar.open'), 'backdrop closes');
    d.querySelector('.burger').click(); d.querySelector('.sidebar .nav-item[data-v="fleet"]').click(); eq(ev('S.route'), 'fleet', 'menu item navigates'); assert(!ev('S.sideOpen'), 'menu closes after navigation');
    assert(vis('[data-alarms]'), 'alarms button stays'); const tb = d.querySelector('.topbar'); assert(tb.scrollWidth <= tb.clientWidth + 1, 'topbar fits');
    if (px <= 700) {
      assert(!vis('.crumb'), 'breadcrumb hidden on a phone'); assert(!vis('.gs .searchbox') && vis('.gs-ico'), 'search collapsed to a magnifier');
      d.querySelector('.gs-ico').click(); assert(d.querySelector('.gs.open') && vis('.gs .searchbox'), 'magnifier opens the search');
      assert(d.querySelector('.gs .searchbox').getBoundingClientRect().width >= px * 0.5, 'search is wide when open'); eq(d.activeElement && d.activeElement.id, 'gsearch', 'search focused');
      ev("gsInput('1847')"); const gl = d.querySelector('.gs-list').getBoundingClientRect(); assert(gl.left >= 0 && gl.right <= px + 1, 'result list inside the window');
      d.querySelector('.gs-ico').click(); assert(!d.querySelector('.gs.open') && ev('S.gs.q') === '', 'second click closes and clears');
    } else {
      const c = d.querySelector('.crumb'); assert(vis('.crumb') && c.getBoundingClientRect().height <= 30, 'breadcrumb on one line'); assert(vis('.gs .searchbox'), 'search box inline');
    }
    assert(!vis('.hubseg') && !vis('.clock') && vis('.tb-morebtn'), 'hub filter and clock behind "⋯"');
    d.querySelector('.tb-morebtn').click(); assert(vis('.hubseg') && vis('.clock') && vis('.rolebox'), '"⋯" shows hub filter, clock, role');
    const p = d.querySelector('.tb-x.open').getBoundingClientRect(); assert(p.left >= 0 && p.right <= px + 1, '"⋯" panel inside the window');
    d.querySelector('.hubseg .hs[data-v="ALA"]').click(); eq(ev('S.hub'), 'ALA', 'hub filter usable from "⋯"'); ev("ACT.hubSet({v:''})");
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); assert(!ev('S.tbMore'), 'Esc closes "⋯"');
    clean(w, 'narrow shell ' + px);
  });
  await group('wide 1316 px: topbar shows search, hub filter, clock and role inline, no burger or "⋯"', 'en', async (g, ev, w) => {
    await narrow(w, 1316); const d = w.document, vis = s => { const e = d.querySelector(s); return !!(e && e.offsetParent && e.getBoundingClientRect().width > 0); };
    ev("go('routes')"); sideways(w, 'routes 1316'); assert(vis('.gs .searchbox') && vis('.hubseg') && vis('.clock') && vis('.rolebox'), 'inline items'); assert(!vis('.burger') && !vis('.tb-morebtn') && !vis('.gs-ico'), 'no narrow controls');
    assert(/active alarms/.test(d.querySelector('[data-alarms]').textContent), 'alarms label');
  });
