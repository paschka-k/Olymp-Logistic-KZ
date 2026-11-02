  /* ---- I8 · FR-213 / FR-214 (R09, R10): the screens use KIT.state for every empty list and toastUndo / in-page confirmations instead of confirm() ---- */
  const I8_RESET = { ru: 'Сбросить фильтры', de: 'Filter zurücksetzen', en: 'Reset filters', kk: 'Сүзгілерді тастау' };
  const I8_PREFS = { ru: 'Сбросить сохранённые настройки', de: 'Gespeicherte Einstellungen zurücksetzen', en: 'Reset saved preferences', kk: 'Сақталған баптауларды тастау' };
  /* a stand-in for localStorage, the test seam of PREFS.attach */
  const I8_STORE = init => "(function(){ var m = " + JSON.stringify(init || {}) + "; return { m: m, getItem: function(k){ return k in m ? m[k] : null; }, setItem: function(k, v){ m[k] = String(v); }, removeItem: function(k){ delete m[k]; } }; })()";

  for (const lang of LANGS) await group('[' + lang + '] R09/R09.1 orders: a filter that finds nothing shows the "nofilter" state with a working "Reset filters"', lang, async (g, ev, w) => {
    ev("go('orders'); S.f.q = 'zzzz-no-such-load'; render()");
    const d = w.document, cell = d.querySelector('table td.empty');
    assert(cell, 'the empty row is there'); assert(cell.querySelector('[data-test="state:nofilter"]'), 'the empty row carries the nofilter state, not hand-written text');
    const btn = cell.querySelector('button[data-act="resetFilters"]'); assert(btn, 'reset button'); eq(btn.textContent.trim(), I8_RESET[lang], 'button text in ' + lang);
    assert(!/⟦/.test(cell.textContent), 'no missing string marker: ' + cell.textContent);
    if (lang === 'de' || lang === 'en') assert(!/[А-Яа-яӘәҒғҚқҢңӨөҰұҮүІі]/.test(cell.textContent), 'no Cyrillic outside RU/KK: ' + cell.textContent);
    btn.click(); eq(ev("S.f.q"), '', 'the filter is cleared'); assert(d.querySelectorAll('table tbody tr').length > 1 && !d.querySelector('table td.empty'), 'rows are back');
    clean(w, 'orders reset ' + lang);
  });

  for (const lang of ['ru', 'en']) await group('[' + lang + '] R09.1 billing / drivers / fleet: the local filters empty the list, the state offers a reset that clears them', lang, async (g, ev, w) => {
    const d = w.document, set = (el, v) => { el.value = v; el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); };
    ev("go('billing')"); const from = d.querySelector('[data-bf="from"]'); assert(from, 'billing: date filter'); set(from, '2099-01-01');
    let cell = d.querySelector('table td.empty'); assert(cell && cell.querySelector('[data-test="state:nofilter"]'), 'billing: nofilter state');
    let b = cell.querySelector('button[data-act="bClr"]'); assert(b && b.textContent.trim() === I8_RESET[lang], 'billing: the reset button is the screen\'s own, text ' + (b && b.textContent)); b.click();
    assert(!d.querySelector('table td.empty'), 'billing: rows are back after the reset');
    /* drivers and fleet: find any filter combination without a match, the screen must then show the nofilter state */
    for (const [route, attr, act] of [['drivers', 'data-df', 'clrD'], ['fleet', 'data-ff', 'clrF']]) {
      ev("go('" + route + "')"); const sels = Array.from(d.querySelectorAll('select[' + attr + ']')); assert(sels.length >= 2, route + ': filters');
      let hit = false;
      outer: for (const o1 of Array.from(sels[0].options).slice(1)) for (const o2 of Array.from(sels[1].options).slice(1)) {
        set(d.querySelector('select[' + attr + '="' + sels[0].getAttribute(attr) + '"]'), o1.value); set(d.querySelector('select[' + attr + '="' + sels[1].getAttribute(attr) + '"]'), o2.value);
        if (d.querySelector('table td.empty')) { hit = true; break outer; }
      }
      assert(hit, route + ': some filter pair finds nothing');
      cell = d.querySelector('table td.empty'); assert(cell.querySelector('[data-test="state:nofilter"]'), route + ': nofilter state'); b = cell.querySelector('button[data-act="' + act + '"]'); assert(b, route + ': reset button ' + act);
      b.click(); assert(!d.querySelector('table td.empty'), route + ': rows are back after the reset');
    }
    clean(w, 'local filters ' + lang);
  });

  await group('R09 no hand-written empty state is left: every .empty of every screen holds a KIT.state, the shipped code has no td.empty text and no native confirm()', 'ru', async (g, ev, w) => {
    const d = w.document, code = Array.from(d.scripts).map(s => s.textContent).join('\n');
    eq((code.match(/class="empty">\$\{esc\(/g) || []).length, 0, 'no class="empty" with a hand-written text');
    eq((code.match(/class="empty">—/g) || []).length, 0, 'no class="empty" with a dash');
    eq((code.match(/window\.confirm\(/g) || []).length, 0, 'no native confirm() in the code');
    /* the screens: every .empty node of an opened screen wraps a state */
    const routes = ev("navItems().map(function(x){ return x[0]; })"), bad = [];
    for (const r of routes) { ev("go('" + r + "')"); d.querySelectorAll('#root .empty').forEach(e => { if (!e.querySelector('.state')) bad.push(r + ': ' + e.textContent.trim().slice(0, 30)); }); }
    eq(bad.join(' | '), '', 'every .empty holds a state');
    clean(w, 'sweep');
  });

  for (const lang of LANGS) await group('[' + lang + '] R09 migrated note-empties are states: no open deviations, no order notes', lang, async (g, ev, w) => {
    const d = w.document, bad = x => /⟦/.test(x) || (lang !== 'ru' && lang !== 'kk' && /[А-Яа-я]/.test(x));
    /* the empty collection of three screens that had a hand-written <p class="note"> */
    ev("go('pod'); S.devs = []; S.tab.pod = 'quality'; render()"); let st = d.querySelector('[data-no-devs] [data-test="state:empty"]'); assert(st, 'quality: no open deviations is a state'); assert(!bad(st.textContent), 'quality text ' + st.textContent);
    ev("S.loads[0].notes = []; ACT.open({id: S.loads[0].id}); S.drawer.tab = 'notes'; render()"); st = d.querySelector('.drawer [data-test="state:empty"]'); assert(st, 'order drawer: no notes is a state'); assert(!bad(st.textContent), 'notes text ' + st.textContent); ev('closeDrawer()');
    ev("go('ai')"); assert(ev("typeof SCREENS.ai.body") === 'function', 'ai screen'); clean(w, 'note empties ' + lang);
  });

  await group('R10 tracking link renewal: no confirm(), applied at once, Undo brings the old link back, final after 10 s', 'ru', async (g, ev, w) => {
    w.confirm = () => { throw new Error('native confirm() must not be called'); };
    const id = 'O-26-0102', tok = () => ev("orderToken(findOrder('" + id + "').o)"), t0 = tok(), a0 = ev("S.audit.length");
    ev("ACT.orRenew({id:'" + id + "'})"); const t1 = tok(); assert(t1 !== t0, 'renewed at once'); assert(ev("!!S.undo"), 'Undo toast offered');
    ev("ACT.undoToast({})"); eq(tok(), t0, 'Undo restores the old token'); eq(ev("S.audit.length"), a0 + 2, 'renewal + undo are two audit entries (nothing deleted)'); eq(ev("auditVerify().ok"), true, 'hash chain ok');
    ev("ACT.undoToast({})"); eq(tok(), t0, 'a second Undo does nothing');
    ev("ACT.orRenew({id:'" + id + "'})"); const t2 = tok(); assert(t2 !== t0, 'renewed again'); ev("undoExpire(S.undo.id)"); ev("ACT.undoToast({})"); eq(tok(), t2, 'after the timer the renewal is final');
    ev("S.role = 'viewer'"); ev("ACT.orRenew({id:'" + id + "'})"); eq(tok(), t2, 'a role without orders:write renews nothing'); eq(ev("S.undo"), null, 'and gets no Undo toast');
  });

  await group('R10 price list: deactivation is applied at once and reversible; the lead erase stays irreversible and asks in the page', 'ru', async (g, ev, w) => {
    w.confirm = () => { throw new Error('native confirm() must not be called'); };
    const pl = ev("S.priceLists.find(function(p){ return p.active; }).id");
    ev("ACT.cmPlOff({id:'" + pl + "'})"); eq(ev("S.priceLists.find(function(p){ return p.id === " + pl + "; }).active"), false, 'price list off at once'); assert(ev("!!S.undo"), 'Undo toast');
    ev("ACT.undoToast({})"); eq(ev("S.priceLists.find(function(p){ return p.id === " + pl + "; }).active"), true, 'Undo switches it on'); eq(ev("auditVerify().ok"), true, 'chain ok');
    /* personal data erase: irreversible = confirmation stays, in the page */
    ev("ACT.cmLeadOpen({id:'L-101'})"); ev("ACT.cmLeadErase({id:'L-101'})");
    eq(ev("S.leads.find(function(l){ return l.id === 'L-101'; }).erased || ''"), '', 'the first click only asks'); const d = w.document;
    const yes = d.querySelector('[data-lead-erase-ask] button[data-act="cmLeadErase"][data-force]'); assert(yes, 'in-page question with a Yes button'); assert(d.querySelector('[data-lead-erase-ask] [data-act="cmLeadEraseNo"]'), 'and a Cancel button');
    eq(ev("!!S.undo"), false, 'an irreversible action offers no Undo');
    yes.click(); assert(ev("S.leads.find(function(l){ return l.id === 'L-101'; }).erased"), 'erased after Yes'); eq(ev("!!S.undo"), false, 'still no Undo toast');
  });

  for (const lang of LANGS) await group('[' + lang + '] F1 settings: a visible "Reset saved preferences" button wipes the prefs keys and the saved views', lang, async (g, ev, w) => {
    ev('window.__st = ' + I8_STORE({ 'kokzhol.v6.prefs': JSON.stringify({ hub: 'AST' }), 'kz-r4-views': '[{"name":"x"}]' })); ev('PREFS.attach(window.__st)');
    eq(ev('Object.keys(window.__st.m).length'), 2, 'two keys are stored before the reset');
    ev("go('settings')"); const b = w.document.querySelector('[data-act="prefsReset"]'); assert(b, 'the button is on the settings screen'); eq(b.textContent.trim(), I8_PREFS[lang], 'button text in ' + lang);
    b.click(); await new Promise(r => setTimeout(r, 60)); eq(ev('Object.keys(window.__st.m).length'), 0, 'the prefs key and the saved views are gone'); eq(ev("PREFS.get('hub', 'none')"), 'none', 'nothing is remembered any more');
    clean(w, 'prefs reset ' + lang);
  });
