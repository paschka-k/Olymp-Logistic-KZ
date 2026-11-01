  /* ---- I5 · FR-195 (R05) windowing of long tables: KIT.vlist keeps only the visible rows (+ margin) in the DOM; 612 collection points, audit log,
     readings and the hub inbound lists use it; nothing is cut any more (counter "N из M"); CSV and print take every row ---- */
  const I5_AXE = await fetch('test-vendor/axe.min.js').then(r => (r.ok ? r.text() : '')).catch(() => '');
  /* scrolling and the row measurement need layout: the iframe is shown off-screen (display:none has none) */
  const i5Show = async w => { w.frameElement.style.cssText = 'display:block;position:absolute;left:-10000px;top:0;width:1316px;height:760px;border:0'; await new Promise(r => setTimeout(r, 30)); };
  const i5Axe = async (w, where) => {
    if (!w.axe) w.eval(I5_AXE);
    const r = await w.axe.run(w.document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => where + ': ' + v.id + ' ×' + v.nodes.length + ' ' + v.nodes[0].html.slice(0, 80));
  };
  const i5Count = (w, id) => w.document.querySelector(`[data-vlist-count="${id}"]`).textContent.replace(/(\d)\s(?=\d)/g, '$1').replace(/\s+/g, ' ').trim();
  const i5Ids = (w, attr) => [...w.document.querySelectorAll(`[${attr}]`)].map(e => e.getAttribute(attr));
  /* a table of n synthetic rows mounted on the page; returns the id */
  const i5Mount = (ev, id, n) => ev(`(function(){ const rows = Array.from({length:${n}}, (_, i) => ({ i })); const h = document.createElement('div'); h.id = 'i5_host'; h.innerHTML = KIT.vlist({ id: '${id}', head: ['#', 'x'], rows, row: r => '<tr data-i5="' + r.i + '"><td>' + r.i + '</td><td>row ' + r.i + '</td></tr>', rowH: 40, label: 'i5' }); document.body.appendChild(h); return '${id}'; })()`);

  await group('I5 FR-195: 612 collection points — only the window is in the DOM, the counter is "N из M", no 20-row pages, scrolling shows the right rows', 'ru', async (g, ev, w) => {
    await i5Show(w);
    ev("go('orders');ACT.stab({s:'orders',v:'recipients'})");
    const n = ev('R5.PTS.length'); assert(n >= 600, 'points ' + n);
    const c0 = ev("vlistCount('r5_tbl')"); assert(c0 > 5 && c0 < 70, 'window rows in the DOM: ' + c0);
    eq(i5Count(w, 'r5_tbl'), n + ' из ' + n, 'counter');
    assert(!w.document.querySelector('[data-r5-pager]'), 'no pager');
    eq(i5Ids(w, 'data-cp')[0], 'CP-0001', 'first row at the top');
    ev("vlistTo('r5_tbl', 300)"); const mid = i5Ids(w, 'data-cp'); assert(mid.includes('CP-0301'), 'row 300 is in the window: ' + mid[0] + '…' + mid[mid.length - 1]); assert(!mid.includes('CP-0001'), 'the top rows left the DOM');
    assert(ev("vlistCount('r5_tbl')") < 70, 'still a window after scrolling');
    ev("vlistTo('r5_tbl', R5.PTS.length - 1)"); assert(i5Ids(w, 'data-cp').includes('CP-' + String(n).padStart(4, '0')), 'the last point is reachable');
    clean(w, 'recipients');
  });

  await group('I5 FR-195: search / filter run over all points and the scroll position survives render()', 'ru', async (g, ev, w) => {
    await i5Show(w);
    ev("go('orders');ACT.stab({s:'orders',v:'recipients'})"); const n = ev('R5.PTS.length');
    ev("const i=document.querySelector('#r5_rq');i.value='CP-0612';i.dispatchEvent(new Event('input',{bubbles:true}))");
    eq(ev("document.querySelectorAll('[data-cp]').length"), 1, 'the last point is found by number'); eq(i5Count(w, 'r5_tbl'), '1 из ' + n, 'counter of the hits');
    ev("const i=document.querySelector('#r5_rq');i.value='zzzz-nothing';i.dispatchEvent(new Event('input',{bubbles:true}))");
    assert(w.document.querySelector('[data-test="state:nofilter"]'), 'KIT.state nofilter for an empty result'); eq(i5Count(w, 'r5_tbl'), '0 из ' + n);
    ev("S.r5.rq='';render();vlistTo('r5_tbl', 200)"); assert(i5Ids(w, 'data-cp').includes('CP-0201'), 'row 200 in the window');
    ev('render()'); assert(i5Ids(w, 'data-cp').includes('CP-0201') && !i5Ids(w, 'data-cp').includes('CP-0001'), 'same position after a full render'); ev("renderRegion('main')"); assert(i5Ids(w, 'data-cp').includes('CP-0201') && !i5Ids(w, 'data-cp').includes('CP-0001'), 'same position after a region render');
    ev("S.r5.rq='';S.r5.rcity='ZHE';render()"); eq(ev("document.querySelectorAll('[data-cp]').length"), 10, 'a filter returns to the top and shows its rows'); ev("S.r5.rcity=''");
  });

  await group('I5 FR-195: the cost does not grow with the row count (600 vs 5000 rows: same rows in the DOM, scroll time within 3x)', 'ru', async (g, ev, w) => {
    await i5Show(w);
    ev("go('dashboard')"); i5Mount(ev, 'i5_a', 600);
    const ca = ev("vlistCount('i5_a')"); ev("document.getElementById('i5_host').remove()");
    i5Mount(ev, 'i5_b', 5000); const cb = ev("vlistCount('i5_b')");
    eq(ca, cb, 'same number of DOM rows for 600 and 5000'); assert(cb > 5 && cb < 70, 'window size ' + cb);
    ev("document.getElementById('i5_host').remove()");
    const time = (id, n) => { i5Mount(ev, id, n); const t = ev(`(function(){ const t0 = performance.now(); for (let k = 0; k < 60; k++) vlistTo('${id}', (k * 37) % ${n - 40}); return performance.now() - t0; })()`); ev("document.getElementById('i5_host').remove()"); return t; };
    const small = [time('i5_c', 600), time('i5_d', 600), time('i5_e', 600)].sort((a, b) => a - b)[1], big = [time('i5_f', 5000), time('i5_g', 5000), time('i5_h', 5000)].sort((a, b) => a - b)[1];
    assert(big <= Math.max(small * 3, 150), '60 scroll steps: 600 rows ' + small.toFixed(1) + ' ms, 5000 rows ' + big.toFixed(1) + ' ms');
  });

  await group('I5 FR-195: audit log — no 200-row cap, every entry reachable, the counter shows N из M, the filter reads all entries', 'ru', async (g, ev, w) => {
    await i5Show(w);
    ev("for (let i = 0; i < 1500; i++) audit('I5', 'I5-SUBJ-' + i, 'ok', 'bulk')"); const m = ev('S.audit.length'); assert(m > 1500, 'audit entries ' + m);
    ev("ACT.setRole({v:'admin'});go('settings');ACT.stab({s:'settings',v:'audit'})");
    eq(i5Count(w, 'au_tbl'), m + ' из ' + m, 'counter shows all entries'); const c = ev("vlistCount('au_tbl')"); assert(c > 5 && c < 80, 'window rows ' + c);
    const oldest = ev('S.audit[S.audit.length - 1].subject');
    ev("RC.aq = " + JSON.stringify(oldest) + "; render()"); assert(w.document.querySelector('#au_tbl').innerText.includes(oldest), 'the oldest entry (far beyond 200) is found by the search');
    ev("RC.aq = ''; render(); vlistTo('au_tbl', S.audit.length - 1)"); assert(w.document.querySelector('#au_tbl tbody').innerText.includes(oldest), 'the last entry is reachable by scrolling');
    ev("RC.aq = 'I5-SUBJ-1499'; render()"); eq(i5Count(w, 'au_tbl'), '1 из ' + m, 'filter counter');
    ev("RC.aq = 'no-such-entry-xyz'; render()"); assert(w.document.querySelector('[data-test="state:nofilter"]'), 'nofilter state'); ev("RC.aq = ''");
    clean(w, 'audit');
  });

  await group('I5 FR-195: readings — no 40-row cap, a full list in a window, empty state through KIT.state', 'ru', async (g, ev, w) => {
    await i5Show(w);
    const t = ev("S.loads.find(l=>l.status==='in_transit'&&l.zone==='pharma').truck");
    ev(`go('routes');ACT.stab({s:'routes',v:'templog'});S.thermo.sel='${t}';render()`);
    ev(`for (let i = 0; i < 150; i++) THERMO.rec({truck:'${t}',cls:'pharma',val:5.0})`); ev('render()');
    const mine = ev(`S.thermo.log.filter(r=>r.truck==='${t}').length`), all = ev('S.thermo.log.length'); assert(mine > 140, 'readings of the vehicle ' + mine);
    eq(i5Count(w, 'tl_tbl'), mine + ' из ' + all, 'counter');
    const cnt = ev("vlistCount('tl_tbl')"); assert(cnt < 70, 'window rows ' + cnt);
    const oldestId = ev(`S.thermo.log.filter(r=>r.truck==='${t}').pop().id`);
    ev(`vlistTo('tl_tbl', ${mine - 1})`); assert(i5Ids(w, 'data-tl-row').includes(oldestId), 'the oldest reading is reachable');
    ev("S.thermo.log.length = 0; render()"); assert(w.document.querySelector('#tl_tbl .state-empty, #tl_tbl [data-test="state:empty"]'), 'empty state through KIT.state');
    clean(w, 'templog');
  });

  await group('I5 FR-195: hub inbound lists use the window (small lists show every row; an empty filter gives the nofilter state)', 'ru', async (g, ev, w) => {
    await i5Show(w);
    ev("ACT.setRole({v:'admin'});go('hubs')"); const tabs = ev("tabsOf('hubs').map(t=>t.key)");
    for (const k of ['recv', 'inbound']) {
      assert(tabs.includes(k), 'tab ' + k); ev(`setTab('hubs','${k}')`);
      const id = k === 'recv' ? 'rv_tbl' : 'ib_tbl'; assert(w.document.querySelector(`[data-vlist="${id}"]`), k + ': the table is a window'); assert(/^\d+ из \d+$/.test(i5Count(w, id)), k + ' counter: ' + i5Count(w, id));
      eq(ev(`vlistCount('${id}')`), +i5Count(w, id).split(' ')[0], k + ': a short list is fully in the DOM');
    }
    ev("S.rf.q = 'zzzz-nothing'; setTab('hubs','recv')"); assert(w.document.querySelector('[data-test="state:nofilter"]'), 'receiving nofilter'); ev("S.rf.q = ''");
    clean(w, 'hubs');
  });

  await group('I5 FR-195: CSV and print take every row, not the window', 'ru', async (g, ev, w) => {
    await i5Show(w);
    ev("for (let i = 0; i < 400; i++) audit('I5', 'I5-CSV-' + i, 'ok', 'bulk')"); const m = ev('S.audit.length');
    ev("ACT.setRole({v:'admin'});go('settings');ACT.stab({s:'settings',v:'audit'});ACT.auditCsv()");
    const d = ev('__downloads').find(x => /audit/.test(x.name)); assert(d, 'audit CSV recorded'); const txt = await w.fetch(d.href).then(r => r.text());
    eq(txt.trim().split('\n').length, m + 1, 'every audit entry + the header in the CSV (' + m + ')');
    ev("go('orders');ACT.stab({s:'orders',v:'recipients'})"); const n = ev('R5.PTS.length');
    w.dispatchEvent(new w.Event('beforeprint')); eq(ev("vlistCount('r5_tbl')"), n, 'print: every point is in the DOM'); w.dispatchEvent(new w.Event('afterprint')); assert(ev("vlistCount('r5_tbl')") < 70, 'after print the window is back');
  });

  await group('I5 FR-195: keyboard and a11y — the scroll box is focusable and named, rows carry their real position, axe has no serious violation', 'ru', async (g, ev, w) => {
    await i5Show(w); const d = w.document;
    ev("go('orders');ACT.stab({s:'orders',v:'recipients'})"); const sc = d.querySelector('[data-vlist="r5_tbl"]'), n = ev('R5.PTS.length');
    eq(sc.getAttribute('tabindex'), '0', 'reachable with Tab'); eq(sc.getAttribute('role'), 'region'); assert(sc.getAttribute('aria-label'), 'named');
    eq(d.querySelector('#r5_tbl').getAttribute('aria-rowcount'), String(n + 1), 'aria-rowcount = all rows + header');
    eq(d.querySelector('[data-cp]').getAttribute('aria-rowindex'), '2', 'first data row is row 2'); ev("vlistTo('r5_tbl', 100)"); eq(d.querySelector('[data-cp="CP-0101"]').getAttribute('aria-rowindex'), '102', 'row index after scrolling');
    sc.focus(); eq(d.activeElement, sc, 'focus lands on the scroll box');
    const bad = await i5Axe(w, 'recipients'); ev("S.r5.rq='';render()");
    ev("for (let i = 0; i < 300; i++) audit('I5', 'I5-AX-' + i, 'ok', 'bulk')"); ev("ACT.setRole({v:'admin'});go('settings');ACT.stab({s:'settings',v:'audit'})"); bad.push(...await i5Axe(w, 'audit'));
    ev("go('routes');ACT.stab({s:'routes',v:'templog'})"); bad.push(...await i5Axe(w, 'templog'));
    assert(!bad.length, bad.length + ' axe violation(s): ' + bad.slice(0, 4).join(' | '));
  });

  await group('I5 FR-195: a control focused in a row keeps the focus when the window moves (back on the same button, or on the scroll box when its row left the window)', 'ru', async (g, ev, w) => {
    await i5Show(w); const d = w.document;
    ev("go('orders');ACT.stab({s:'orders',v:'recipients'})"); const sc = d.querySelector('[data-vlist="r5_tbl"]');
    const b = d.querySelector('[data-cp="CP-0003"] button'); assert(b, 'row button'); b.focus(); eq(d.activeElement, b);
    ev("vlistTo('r5_tbl', 100)"); assert(!d.querySelector('[data-cp="CP-0003"]'), 'row left the window'); eq(d.activeElement, sc, 'row left the window: the scroll box holds the focus');
    ev("vlistTo('r5_tbl', 0)"); const b2 = d.querySelector('[data-cp="CP-0003"] button'); b2.focus(); ev("vlistTo('r5_tbl', 1)");
    eq(d.activeElement && d.activeElement.closest('[data-cp]') && d.activeElement.closest('[data-cp]').dataset.cp, 'CP-0003', 'same row keeps the focus after the window repainted');
  });

  for (const lang of ['de', 'en', 'kk']) await group('[' + lang + '] I5 FR-195: counter and states are translated, no Cyrillic in DE / EN', lang, async (g, ev, w) => {
    ev("go('orders');ACT.stab({s:'orders',v:'recipients'})"); const n = ev('R5.PTS.length'); const t = i5Count(w, 'r5_tbl');
    eq(t, n + ' ' + ({ de: 'von', en: 'of', kk: '/' })[lang] + ' ' + n, 'counter in ' + lang);
    ev("S.r5.rq='zzzz-nothing';render()"); assert(w.document.querySelector('[data-test="state:nofilter"]'), 'nofilter state'); ev("S.r5.rq=''");
    if (lang !== 'kk') assert(!/[А-Яа-яЁё]/.test(w.document.querySelector('#root').innerText.replace(/CP-\d+/g, '')), 'no Cyrillic in ' + lang + ' (point names are translated)');
    clean(w, 'recipients ' + lang);
  });
