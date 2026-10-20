  /* ---- S3 accessibility: FR-215 keyboard and focus, FR-218 WCAG 2.2 AA (axe-core on every screen, contrast tokens, labels,
     landmarks), FR-219 high contrast, reduced motion, every chart also as a table or text (screens/002-a11y.js) ---- */
  const A11Y_AXE = await fetch('test-vendor/axe.min.js').then(r => (r.ok ? r.text() : '')).catch(() => '');
  /* focus, layout and contrast need a rendered iframe: shown off-screen (display:none has no layout) */
  const a11yShow = async w => { w.frameElement.style.cssText = 'display:block;position:absolute;left:-10000px;top:0;width:1316px;height:760px;border:0'; await new Promise(r => setTimeout(r, 30)); };
  const a11yKey = (w, key, o) => { const t = w.document.activeElement || w.document.body; const e = new w.KeyboardEvent('keydown', Object.assign({ key, bubbles: true, cancelable: true }, o || {})); t.dispatchEvent(e); return e; };
  const a11yCyr = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/;
  /* axe: WCAG 2.0 / 2.1 / 2.2 A + AA, serious and critical violations, as scripts/axe_probe.py in the platform repository */
  const a11yAxe = async (w, where) => {
    if (!w.axe) w.eval(A11Y_AXE);
    const r = await w.axe.run(w.document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => where + ': ' + v.id + ' ×' + v.nodes.length + ' ' + v.nodes[0].target.join(' ') + ' ' + v.nodes[0].html.slice(0, 80));
  };
  const a11ySweep = async (ev, w, routes, tag, firstTabOnly) => {
    const bad = [];
    for (const id of routes) {
      ev(`go('${id}')`); if (ev('S.route') !== id) continue;
      const tabs = ev(`tabsOf('${id}').map(t=>t.key)`);
      for (const t of (tabs.length ? (firstTabOnly ? tabs.slice(0, 1) : tabs) : [null])) { if (t) ev(`setTab('${id}','${t}')`); bad.push(...await a11yAxe(w, tag + ' ' + id + (t ? '/' + t : ''))); }
    }
    return bad;
  };
  const a11yNone = (bad, n) => assert(!bad.length, bad.length + ' axe violation(s): ' + bad.slice(0, n || 4).join(' | '));

  /* ---------- FR-215 keyboard and focus ---------- */
  await group('[ru] FR-215 drawer: modal dialog, focus moves in, Tab / Shift+Tab stay inside, Esc closes, focus returns to the row that opened it', 'ru', async (g, ev, w) => {
    await a11yShow(w); const d = w.document;
    ev("go('orders');setTab('orders','orders')"); const id = ev('S.loads[0].id');
    const row = d.querySelector(`tr[data-act=open][data-id="${id}"]`); assert(row, 'load row'); eq(row.getAttribute('tabindex'), '0', 'row reachable with Tab');
    row.focus(); row.click();
    const dr = d.querySelector('.drawer.open'); assert(dr, 'drawer open');
    eq(dr.getAttribute('role'), 'dialog'); eq(dr.getAttribute('aria-modal'), 'true'); eq(d.getElementById(dr.getAttribute('aria-labelledby')).textContent.trim().length > 0, true, 'dialog title');
    assert(dr.contains(d.activeElement), 'focus moved into the drawer, is on ' + d.activeElement.outerHTML.slice(0, 60));
    const x = dr.querySelector('.drawer-head .x'); eq(x.tagName, 'BUTTON', 'close is a button'); assert(x.getAttribute('aria-label'), 'close has a name');
    const f = ev('a11yFocusables(document.querySelector(".drawer.open")).length'); assert(f >= 3, 'focusable controls in the drawer: ' + f);
    const list = () => w.a11yFocusables(d.querySelector('.drawer.open'));
    list()[list().length - 1].focus(); assert(a11yKey(w, 'Tab').defaultPrevented, 'Tab on the last control is trapped'); eq(d.activeElement, list()[0], 'Tab wraps to the first control');
    a11yKey(w, 'Tab', { shiftKey: true }); eq(d.activeElement, list()[list().length - 1], 'Shift+Tab wraps to the last control');
    d.querySelector('main').querySelector('a,button,[tabindex="0"]').focus(); a11yKey(w, 'Tab'); assert(d.querySelector('.drawer.open').contains(d.activeElement), 'Tab from outside comes back into the drawer');
    a11yKey(w, 'Escape'); assert(!ev('S.drawer'), 'Esc closes the drawer');
    const back = d.activeElement; eq(back.dataset.act, 'open', 'focus back on the row'); eq(back.dataset.id, id, 'the same row');
    /* ✕ closes as well and gives focus back */
    d.querySelector(`tr[data-act=open][data-id="${id}"]`).click(); d.querySelector('.drawer.open .x').click(); assert(!ev('S.drawer'), '✕ closes'); eq(d.activeElement.dataset.id, id, 'focus back after ✕');
    /* a tab switch inside the drawer keeps focus inside (re-render) */
    d.querySelector(`tr[data-act=open][data-id="${id}"]`).click(); const tb = d.querySelector('.drawer.open .drawer-tabs [data-act]:not(.active)');
    if (tb) { tb.focus(); tb.click(); assert(d.querySelector('.drawer.open').contains(d.activeElement), 'focus stays in the drawer after a tab switch'); }
    clean(w, 'drawer focus');
  });
  await group('[ru] FR-215 every data-act control is reachable with Tab (all screens and tabs) and Enter activates a focused tab', 'ru', async (g, ev, w) => {
    await a11yShow(w); const d = w.document, miss = [];
    for (const id of ev('Object.keys(SCREENS)')) {
      ev(`go('${id}')`); if (ev('S.route') !== id) continue;
      const tabs = ev(`tabsOf('${id}').map(t=>t.key)`);
      for (const t of (tabs.length ? tabs : [null])) {
        if (t) ev(`setTab('${id}','${t}')`);
        d.querySelectorAll('#root [data-act]').forEach(e => { if (/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|OPTION|LABEL)$/.test(e.tagName) || e.hasAttribute('tabindex') || e.matches('.side-back,.a11y-back,.login-layer,.diag-back') || e.closest('[aria-hidden="true"]')) return; miss.push(id + '/' + t + ' ' + e.outerHTML.slice(0, 70)); });
      }
    }
    assert(!miss.length, miss.length + ' controls without a tab stop: ' + miss.slice(0, 3).join(' | '));
    ev("go('orders')"); const tab = d.querySelector('.pill-tab:not(.active)'); tab.focus(); a11yKey(w, 'Enter'); eq(ev("curTab('orders').key"), tab.dataset.v, 'Enter switches the tab');
    clean(w, 'tab stops');
  });
  for (const lang of LANGS) await group('[' + lang + '] FR-215 shortcut list: "?" opens it from the menu link or the keyboard, Esc closes and focus returns, / Alt+N [ ] work, text in the UI language', lang, async (g, ev, w) => {
    await a11yShow(w); const d = w.document;
    const link = d.querySelector('.sidebar [data-act=kbdOpen]'); assert(link, 'menu link'); link.focus(); link.click();
    const dlg = d.querySelector('[data-a11y-dlg]'); assert(dlg, 'dialog'); eq(dlg.getAttribute('role'), 'dialog'); eq(dlg.getAttribute('aria-modal'), 'true');
    assert(dlg.contains(d.activeElement), 'focus in the dialog'); eq(d.querySelectorAll('[data-kbd-list] tbody tr').length, ev('A11Y_KEYS().length'), 'one row per shortcut'); assert(ev('A11Y_KEYS().length') >= 8, 'shortcuts listed');
    if (lang === 'de' || lang === 'en') assert(!a11yCyr.test(dlg.textContent), lang + ' dialog has Cyrillic: ' + (dlg.textContent.match(/.{0,20}[А-Яа-яЁё].{0,20}/) || [''])[0]);
    a11yKey(w, 'Escape'); assert(!d.querySelector('[data-a11y-dlg]'), 'Esc closes'); eq(d.activeElement.dataset.act, 'kbdOpen', 'focus back on the menu link');
    d.body.focus(); a11yKey(w, '?'); assert(d.querySelector('[data-a11y-dlg]'), '"?" opens'); a11yKey(w, '?'); assert(!d.querySelector('[data-a11y-dlg]'), '"?" closes again');
    ev("go('dashboard')"); d.body.focus(); a11yKey(w, '/'); eq(d.activeElement && d.activeElement.id, 'gsearch', '/ focuses the search');
    d.body.focus(); a11yKey(w, '3', { code: 'Digit3', altKey: true }); eq(ev('S.route'), ev('navItems()[2][0]'), 'Alt+3 opens menu item 3');
    ev("go('orders')"); const t0 = ev("curTab('orders').key"); d.body.focus(); a11yKey(w, ']'); assert(ev("curTab('orders').key") !== t0, '] next tab'); a11yKey(w, '['); eq(ev("curTab('orders').key"), t0, '[ previous tab');
    clean(w, 'shortcuts');
  });

  /* ---------- FR-218 WCAG 2.2 AA ---------- */
  await group('FR-218 axe-core is test-only: it is next to tests.html and not in any product page', 'ru', async () => {
    assert(A11Y_AXE.length > 100000 && /axe/.test(A11Y_AXE.slice(0, 400)), 'test-vendor/axe.min.js loads');
    for (const lang of LANGS) { const s = await fetch(file(lang)).then(r => r.text()); assert(!/test-vendor|axe\.run\(|axe\.min\.js/.test(s), file(lang) + ' references axe'); }
  });
  await group('[ru] FR-218 axe WCAG 2.2 AA: every screen and tab, Kökzhol design — no serious or critical violation', 'ru', async (g, ev, w) => { await a11yShow(w); a11yNone(await a11ySweep(ev, w, ev('Object.keys(SCREENS)'), 'kokzhol')); });
  await group('[ru] FR-218 axe WCAG 2.2 AA: every screen and tab, Olymp design', 'ru', async (g, ev, w) => { await a11yShow(w); ev('ACT.setDesign()'); eq(w.document.documentElement.dataset.design, 'olymp'); a11yNone(await a11ySweep(ev, w, ev('Object.keys(SCREENS)'), 'olymp')); });
  await group('[ru] FR-218 axe WCAG 2.2 AA: high contrast in both designs, the load drawer, the shortcut dialog, roles customer / partner / driver / warehouse', 'ru', async (g, ev, w) => {
    await a11yShow(w); ev('ACT.a11yHc({})'); eq(w.document.documentElement.dataset.contrast, 'high');
    const bad = await a11ySweep(ev, w, ev('navItems().map(n=>n[0])'), 'hc kokzhol', true); ev('ACT.setDesign()'); bad.push(...await a11ySweep(ev, w, ev('navItems().map(n=>n[0])'), 'hc olymp', true)); ev('ACT.setDesign();ACT.a11yHc({})');
    ev("go('orders');ACT.open({id:S.loads[0].id})"); for (const t of [...w.document.querySelectorAll('.drawer-tabs .tab')].map(e => e.dataset.v)) { ev(`ACT.tab({v:'${t}'})`); bad.push(...await a11yAxe(w, 'load drawer/' + t)); } ev('closeDrawer()');
    ev('ACT.kbdOpen()'); bad.push(...await a11yAxe(w, 'shortcut dialog')); ev('ACT.kbdClose()');
    for (const r of ['customer', 'partner', 'driver', 'warehouse']) { ev(`ACT.setRole({v:'${r}'})`); bad.push(...await a11ySweep(ev, w, ev('navItems().map(n=>n[0])'), r)); }
    a11yNone(bad);
  });
  for (const lang of ['de', 'en', 'kk']) await group('[' + lang + '] FR-218 axe WCAG 2.2 AA: every menu screen (first tab) and the load drawer', lang, async (g, ev, w) => {
    await a11yShow(w); const bad = await a11ySweep(ev, w, ev('navItems().map(n=>n[0])'), lang, true);
    ev("go('orders');ACT.open({id:S.loads[0].id})"); bad.push(...await a11yAxe(w, 'load drawer')); a11yNone(bad);
  });
  await group('FR-218 contrast tokens: text and button colours reach 4.5 : 1 in both designs (7 : 1 for text in high contrast)', 'ru', async (g, ev, w) => {
    await a11yShow(w); const d = w.document;
    const rgb = c => { const x = d.createElement('i'); x.style.color = c; d.body.appendChild(x); const m = w.getComputedStyle(x).color.match(/\d+/g).map(Number); x.remove(); return m; };
    const lum = c => { const [r, g2, b] = rgb(c).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g2 + 0.0722 * b; };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const tok = k => w.getComputedStyle(d.documentElement).getPropertyValue(k).trim();
    const bad = [];
    const check = (tag, min, pairs) => pairs.forEach(([fg, bg]) => { const f = fg.startsWith('--') ? tok(fg) : fg, b = bg.startsWith('--') ? tok(bg) : bg, r = ratio(f, b); if (r < min) bad.push(`${tag}: ${fg} ${f} on ${bg} ${b} = ${r.toFixed(2)}`); });
    const base = [['--text-strong', '#fff'], ['--text-muted', '#fff'], ['--text-faint', '#fff'], ['--text-muted', '--bg-subtle'], ['--text-faint', '--bg-page'], ['--ok-text', '#fff'], ['#fff', '--btn-blue'], ['#fff', '--btn-green'], ['#fff', '--btn-red'], ['#fff', '--btn-orange'], ['#fff', '--primary']];
    for (const des of ['kokzhol', 'olymp']) {
      if (d.documentElement.dataset.design !== des) ev('ACT.setDesign()');
      check(des, 4.5, base);
      ev('ACT.a11yHc({})'); check(des + ' high contrast', 7, [['--text-strong', '#fff'], ['--text-muted', '#fff'], ['--text-faint', '#fff'], ['#fff', '--primary'], ['#fff', '--btn-blue']]); ev('ACT.a11yHc({})');
    }
    assert(!bad.length, bad.join(' | '));
  });
  for (const lang of LANGS) await group('[' + lang + '] FR-218 landmarks and labels: one main and h1, labelled menu, skip link, page language, every field and image has a name', lang, async (g, ev, w) => {
    await a11yShow(w); const d = w.document, miss = [];
    eq(d.documentElement.lang, lang, 'html lang'); const skip = d.querySelector('a.skip'); assert(skip && d.querySelector(skip.getAttribute('href')), 'skip link target');
    for (const id of ev('navItems().map(n=>n[0])')) {
      ev(`go('${id}')`); eq(d.querySelectorAll('main').length, 1, id + ' main'); eq(d.querySelectorAll('h1').length, 1, id + ' h1');
      const nav = d.querySelector('[role=navigation],nav'); assert(nav && nav.getAttribute('aria-label'), id + ' labelled navigation');
      d.querySelectorAll('#root select, #root textarea, #root input:not([type=hidden])').forEach(e => { if (e.closest('[aria-hidden="true"]')) return; const n = e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.title || (e.id && d.querySelector(`label[for="${e.id}"]`)) || e.closest('label') || e.placeholder; if (!n) miss.push(id + ' ' + e.outerHTML.slice(0, 60)); if (lang === 'de' || lang === 'en') { const al = e.getAttribute('aria-label') || ''; if (a11yCyr.test(al)) miss.push(id + ' Cyrillic name "' + al + '"'); } });
      d.querySelectorAll('#root img').forEach(e => { if (!e.hasAttribute('alt')) miss.push(id + ' img without alt ' + e.src); });
    }
    assert(!miss.length, miss.length + ': ' + miss.slice(0, 3).join(' | '));
  });

  /* ---------- FR-219 high contrast, reduced motion, charts as tables ---------- */
  await group('[ru] FR-219 high contrast and reduced motion: switches in the dialog and Alt+Shift+C / M, tokens and motion change, diagrams start paused', 'ru', async (g, ev, w) => {
    await a11yShow(w); const h = w.document.documentElement, d = w.document;
    eq(h.dataset.contrast, ev('matchMedia("(prefers-contrast: more)").matches') ? 'high' : 'normal', 'contrast follows the OS'); eq(h.dataset.motion, ev('matchMedia("(prefers-reduced-motion: reduce)").matches') ? 'reduce' : 'full', 'motion follows the OS');
    ev('S.a11y.hc=false;S.a11y.rm=false;render()');
    const muted = () => w.getComputedStyle(h).getPropertyValue('--text-muted').trim().toLowerCase();
    const m0 = muted(); ev('ACT.kbdOpen()'); d.getElementById('a11y_hc').click(); eq(h.dataset.contrast, 'high', 'checkbox switches high contrast on'); eq(muted(), '#1f2937', 'muted text is darker'); assert(muted() !== m0, 'token changed');
    assert(d.getElementById('a11y_hc').checked, 'checkbox stays checked'); d.getElementById('a11y_hc').click(); eq(h.dataset.contrast, 'normal', 'and off'); ev('ACT.kbdClose()');
    d.body.focus(); a11yKey(w, 'C', { code: 'KeyC', altKey: true, shiftKey: true }); eq(h.dataset.contrast, 'high', 'Alt+Shift+C'); a11yKey(w, 'C', { code: 'KeyC', altKey: true, shiftKey: true }); eq(h.dataset.contrast, 'normal', 'Alt+Shift+C again');
    ev("go('dispatch')"); const tr = () => w.getComputedStyle(d.querySelector('.kcard')).transitionDuration; assert(!/^0s(, 0s)*$/.test(tr()), 'cards animate normally: ' + tr());
    d.body.focus(); a11yKey(w, 'M', { code: 'KeyM', altKey: true, shiftKey: true }); eq(h.dataset.motion, 'reduce', 'Alt+Shift+M'); assert(/^0s(, 0s)*$/.test(tr()), 'no transitions with reduced motion: ' + tr());
    const live = d.querySelector('.live-dot'); if (live) eq(w.getComputedStyle(live).animationName, 'none', 'live dot does not pulse');
    ev("S.hv={};S.help.key='start';go('help')"); const hv = ev('Object.values(S.hv||{})'); assert(hv.length >= 1, 'a help diagram is shown'); assert(hv.every(x => !x.run), 'help diagrams start paused with reduced motion');
    ev('ACT.a11yRm({})'); eq(h.dataset.motion, 'full', 'motion back on'); ev("S.hv={};go('dashboard');S.help.key='start';go('help')"); assert(ev('Object.values(S.hv).some(x=>x.run)'), 'diagrams play again');
    clean(w, 'contrast / motion');
  });
  for (const lang of LANGS) await group('[' + lang + '] FR-219 every chart has a table or text: all screens and tabs, report cards and detail drawer, temperature chart', lang, async (g, ev, w) => {
    await a11yShow(w); const d = w.document, miss = []; let n = 0;
    const box = c => c.closest('tr, .kpi-tile, .th-chart, .report-card, .drawer-section, .card, .drawer');
    const scan = where => d.querySelectorAll('#root [data-chart]').forEach(c => { n++; const b = box(c); if (!b || !b.querySelector('[data-chart-alt]')) miss.push(where + ' ' + c.outerHTML.slice(0, 60)); if (c.tagName.toLowerCase() === 'svg' && !c.getAttribute('aria-label')) miss.push(where + ' svg chart without a name'); });
    const ids = lang === 'ru' ? ev('Object.keys(SCREENS)') : ['reports', 'routes', 'billing', 'dashboard'];
    for (const id of ids) { ev(`go('${id}')`); if (ev('S.route') !== id) continue; const tabs = ev(`tabsOf('${id}').map(t=>t.key)`); for (const t of (tabs.length ? tabs : [null])) { if (t) ev(`setTab('${id}','${t}')`); scan(id + '/' + t); } }
    assert(!miss.length, miss.length + ' chart(s) without a table / text: ' + miss.slice(0, 3).join(' | '));
    ev("go('reports');setTab('reports',tabsOf('reports')[0].key)");
    const alts = d.querySelectorAll('.report-card details[data-chart-alt]'); eq(alts.length, 6, 'six report cards with a data table');
    alts.forEach(a => { assert(a.querySelector('caption').textContent.trim(), 'caption'); assert(a.querySelectorAll('tbody tr').length >= 3, 'rows'); assert(a.querySelectorAll('thead th').length >= 2, 'columns'); });
    if (lang === 'de' || lang === 'en') alts.forEach(a => assert(!a11yCyr.test(a.textContent), lang + ' chart table has Cyrillic: ' + (a.textContent.match(/.{0,20}[А-Яа-яЁё].{0,20}/) || [''])[0]));
    d.querySelector('[data-act=rOpen]').click(); assert(d.querySelector('.drawer.open details[data-chart-alt] table'), 'detail drawer chart has a table'); ev('closeDrawer()');
    ev("go('routes');setTab('routes','temp')"); const th = d.querySelector('.th-chart'); if (th) { const t = th.querySelector('[data-chart-alt] table'); assert(t, 'temperature chart table'); eq(t.querySelectorAll('tbody tr').length, 3, 'three series'); }
    assert(n >= 6, 'charts found: ' + n); clean(w, 'chart tables');
  });
