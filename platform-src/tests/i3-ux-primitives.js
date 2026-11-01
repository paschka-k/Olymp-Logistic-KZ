  /* ---- I3 · R08 / R09 / R10 (FR-212..214): remembered preferences, uniform states, undo toast ---- */
  const I3_WAIT = ms => new Promise(r => setTimeout(r, ms));
  const I3_RESET = { ru: 'Сбросить фильтры', de: 'Filter zurücksetzen', en: 'Reset filters', kk: 'Сүзгілерді тастау' };
  const I3_UNDO = { ru: 'Отменить', de: 'Rückgängig', en: 'Undo', kk: 'Болдырмау' };
  const I3_DECISION = { ru: 'Отмена', de: 'Rückgängig gemacht', en: 'Undone', kk: 'Қайтарылды' };
  /* a stand-in for localStorage: PREFS.attach(store) is the test seam (the platform frame itself never reads or writes storage) */
  const I3_STORE = (init, broken) => "(function(){ var m = " + JSON.stringify(init || {}) + "; return { m: m, getItem: function(k){ if (" + !!broken + ") throw new Error('blocked'); return k in m ? m[k] : null; }, setItem: function(k,v){ if (" + !!broken + ") throw new Error('blocked'); m[k] = String(v); }, removeItem: function(k){ delete m[k]; } }; })()";

  for (const lang of LANGS) await group('[' + lang + '] R09 KIT.state: empty / loading / error / nofilter, roles, text of the page language', lang, async (g, ev, w) => {
    eq(ev("typeof KIT.state"), 'function', 'KIT.state exists');
    for (const [kind, role] of [['empty', 'status'], ['loading', 'status'], ['error', 'alert'], ['nofilter', 'status']]) {
      const el = (() => { const d = w.document.createElement('div'); d.innerHTML = ev("KIT.state('" + kind + "', {})"); return d.firstElementChild; })();
      assert(el, kind + ': markup'); eq(el.getAttribute('role'), role, kind + ': a11y role'); eq(el.dataset.test, 'state:' + kind, kind + ': hook');
      assert(el.textContent.trim().length > 2 && !/⟦/.test(el.textContent), kind + ': text from the string table: ' + el.textContent);
      if (lang === 'de' || lang === 'en') assert(!/[А-Яа-я]/.test(el.textContent), kind + ': no Cyrillic outside RU');
    }
    eq(ev("KIT.state('loading', {})").includes('aria-busy="true"'), true, 'loading is aria-busy');
    /* title / hint / action are the caller's */
    const d = w.document.createElement('div'); d.innerHTML = ev("KIT.state('empty', {title: 'No <b>x</b>', hint: 'Add one', action: {label: 'Add', act: 'create'}})");
    eq(d.querySelector('.state-t').textContent, 'No <b>x</b>', 'title is escaped text'); eq(d.querySelector('.state-h').textContent, 'Add one', 'hint');
    const b = d.querySelector('button[data-act="create"]'); assert(b && b.textContent === 'Add', 'caller action button');
    /* R09.1: "nothing found by the filter" offers the reset button */
    const n = w.document.createElement('div'); n.innerHTML = ev("KIT.state('nofilter', {})"); const rb = n.querySelector('button[data-act="resetFilters"]');
    assert(rb, 'nofilter: reset button'); eq(rb.textContent, I3_RESET[lang], 'nofilter: button text');
    eq(ev("KIT.state('empty', {}).includes('<button')"), false, 'empty without action has no button');
    /* KIT.table: the empty row keeps td.empty and shows the state; a filtered table shows nofilter */
    const t = w.document.createElement('div'); t.innerHTML = ev("KIT.table(['H','I'], '', {empty: 'none'})");
    eq(t.querySelector('td.empty').textContent, 'none', 'KIT.table empty text'); assert(t.querySelector('td.empty [data-test="state:empty"]'), 'KIT.table empty row carries the state');
    t.innerHTML = ev("KIT.table(['H','I'], '', {nofilter: true})"); assert(t.querySelector('td.empty button[data-act="resetFilters"]'), 'KIT.table nofilter: reset button');
  });

  await group('R09.1 resetFilters clears the screen filters, the record filters and the column filters', 'ru', async (g, ev, w) => {
    ev("go('orders'); S.f.status = 'problem'; S.f.q = 'x'; S.f.page = 3; RC.q = 'zz'; S.lv.loads.c = {1: 'abc'}; render()");
    ev("ACT.resetFilters({})");
    eq(ev("S.f.status + '|' + S.f.q + '|' + S.f.page"), '||1', 'S.f cleared, page 1'); eq(ev("RC.q"), '', 'RC cleared'); eq(ev("JSON.stringify(S.lv.loads.c)"), '{}', 'column filters cleared');
    ev("ACT.retry({})"); clean(w, 'after reset');
  });

  await group('R08 PREFS: get / set over kokzhol.v6.prefs, broken JSON ignored, blocked storage survives', 'ru', async (g, ev, w) => {
    eq(ev("typeof PREFS"), 'object', 'PREFS is global');
    ev("window.__st = " + I3_STORE({})); ev("PREFS.attach(window.__st)"); eq(ev("PREFS.enabled"), true, 'enabled on an attached store');
    eq(ev("PREFS.get('nothing', 'dflt')"), 'dflt', 'default'); eq(ev("PREFS.set('hub', 'AST')"), true, 'set returns true');
    eq(ev("JSON.parse(window.__st.m['kokzhol.v6.prefs']).hub"), 'AST', 'stored under kokzhol.v6.prefs'); eq(ev("PREFS.get('hub', '')"), 'AST', 'round trip');
    ev("PREFS.set('tab', {orders: 'rec'})"); eq(ev("PREFS.get('tab', {}).orders"), 'rec', 'object value'); eq(ev("PREFS.get('hub', '')"), 'AST', 'other keys kept');
    for (const bad of ['{not json', 'null', '[1,2]', '"str"', '42']) { ev("window.__st.m['kokzhol.v6.prefs'] = " + JSON.stringify(bad)); eq(ev("PREFS.get('hub', 'dflt')"), 'dflt', 'damaged value ignored: ' + bad); eq(ev("PREFS.set('hub', 'ALA')"), true, 'set repairs: ' + bad); eq(ev("PREFS.get('hub', '')"), 'ALA', 'after repair'); }
    ev("PREFS.reset()"); eq(ev("'kokzhol.v6.prefs' in window.__st.m"), false, 'reset removes the key'); eq(ev("PREFS.get('hub', 'd')"), 'd', 'reset: defaults');
    ev("PREFS.attach(" + I3_STORE({}, true) + ")"); eq(ev("PREFS.get('hub', 'd')"), 'd', 'blocked storage: get gives the default'); eq(ev("PREFS.set('hub', 'x')"), false, 'blocked storage: set returns false, no throw');
    ev("PREFS.reset()"); ev("render()"); clean(w, 'blocked storage');
  });

  await group('R08 PREFS restore / capture: hub filter, last tab, theme; invalid values are ignored', 'ru', async (g, ev, w) => {
    const hub = ev("Object.keys(HUBS)[1]"), tabs = ev("tabsOf('orders').map(function(t){return t.key})"), other = tabs[1];
    ev("PREFS.attach(" + I3_STORE({ 'kokzhol.v6.prefs': JSON.stringify({ hub: 'ZZZ', tab: { orders: 'nope', fleet: 'nope' }, design: 'neon' }) }) + ")");
    ev("PREFS.restore()"); eq(ev("S.hub"), '', 'unknown hub ignored'); eq(ev("S.tab.orders"), undefined, 'unknown tab ignored'); eq(ev("S.design"), 'kokzhol', 'unknown theme ignored');
    ev("PREFS.attach(" + I3_STORE({ 'kokzhol.v6.prefs': JSON.stringify({ hub: hub, tab: { orders: other }, design: 'olymp' }) }) + ")");
    eq(ev("PREFS.restore()"), true, 'restore reports a change'); eq(ev("S.hub"), hub, 'hub filter restored'); eq(ev("S.tab.orders"), other, 'last tab restored'); eq(ev("S.design"), 'olymp', 'theme restored');
    eq(ev("document.documentElement.dataset.design"), 'olymp', 'theme applied to the page');
    ev("PREFS.attach(" + I3_STORE({}) + ")"); ev("S.hub = '" + hub + "'; S.tab.fleet = 'x'; S.design = 'kokzhol'; PREFS.capture()");
    eq(ev("PREFS.get('hub', null)"), hub, 'capture stores the hub'); eq(ev("PREFS.get('design', null)"), 'kokzhol', 'capture stores the theme'); eq(ev("PREFS.get('tab', {}).fleet"), 'x', 'capture stores the tab');
    /* a click on the hub filter goes through the real action and is captured */
    ev("PREFS.attach(" + I3_STORE({}) + ")"); ev("render()"); const btn = w.document.querySelector('.hubseg [data-v="' + hub + '"]'); assert(btn, 'hub button'); btn.click();
    eq(ev("PREFS.get('hub', null)"), hub, 'a click on the hub filter is remembered');
    /* language */
    ev("PREFS.attach(" + I3_STORE({ 'kokzhol.v6.prefs': JSON.stringify({ lang: 'de' }) }) + ")"); eq(ev("PREFS.langPick()"), 'de', 'stored language');
    ev("PREFS.attach(" + I3_STORE({ 'kokzhol.v6.prefs': JSON.stringify({ lang: 'xx' }) }) + ")"); eq(ev("PREFS.langPick()"), null, 'unknown language ignored');
    ev("PREFS.attach(" + I3_STORE({}) + ")"); w.document.querySelector('[data-test="lang:en"]').addEventListener('click', e => e.preventDefault(), true); w.document.querySelector('[data-test="lang:en"]').click();
    eq(ev("PREFS.get('lang', null)"), 'en', 'a click on a language link is remembered');
  });

  await group('R08.2 test frames neither read nor write preferences; kz-r4-views gets the same guard', 'ru', async (g, ev, w) => {
    eq(ev("PREFS.enabled"), false, 'PREFS is off in the test frame'); eq(ev("PREFS.set('hub', 'AST')"), false, 'set is a no-op'); eq(ev("PREFS.get('hub', 'd')"), 'd', 'get gives the default');
    eq(localStorage.getItem('kokzhol.v6.prefs'), null, 'harness storage untouched by PREFS.set');
    /* a stored value of the harness is not read by the frame, and what the frame saves does not reach the harness */
    const KEY = 'kz-r4-views'; const had = localStorage.getItem(KEY);
    try {
      localStorage.setItem(KEY, JSON.stringify({ loads: [{ id: 'v-leak', name: 'leak', c: {}, s: {} }] }));
      const g2 = await new Promise(res => { const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;left:-9999px;width:1200px;height:800px'; f.src = file('ru'); f.onload = () => res(f); document.body.appendChild(f); });
      try { await I3_WAIT(300); const w2 = g2.contentWindow; eq(w2.eval("S.lv.loads.views.length"), 0, 'saved views of the harness storage are not read in a test frame');
        w2.eval("S.lv.loads.views.push({id:'v-new', name:'new', c:{}, s:{}}); localStorage.setItem('kz-r4-views', JSON.stringify({loads: S.lv.loads.views}))");
        assert(!/v-new/.test(localStorage.getItem(KEY) || ''), 'the frame does not write kz-r4-views'); } finally { g2.remove(); }
    } finally { if (had == null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, had); }
  });

  for (const lang of LANGS) await group('[' + lang + '] R10 toastUndo: button, one undo, audit entry "undo", chain valid, nothing deleted', lang, async (g, ev, w) => {
    eq(ev("typeof toastUndo"), 'function', 'toastUndo is global');
    ev("window.__n = 0; go('fleet')"); const audit0 = ev("S.audit.length");
    ev("toastUndo('Moved', function(){ window.__n++; }, {ms: 5000, audit: {module: 'Test', subject: 'T-1'}})");
    const t = w.document.querySelector('[data-test="toast-undo"]'); assert(t, 'undo toast shown'); assert(t.textContent.includes('Moved'), 'message');
    const b = t.querySelector('button[data-act="undoToast"]'); assert(b, 'undo button'); eq(b.textContent.trim(), I3_UNDO[lang], 'button text in ' + lang);
    eq(ev("S.undo.ms"), 5000, 'duration');
    /* the toast survives a change of screen */
    ev("go('drivers')"); assert(w.document.querySelector('[data-test="toast-undo"]'), 'the toast stays after a screen change');
    w.document.querySelector('[data-test="toast-undo"] button').click();
    eq(ev("window.__n"), 1, 'undo function ran'); eq(w.document.querySelector('[data-test="toast-undo"]'), null, 'undo toast closed');
    ev("ACT.undoToast({})"); w.document.querySelectorAll('[data-act="undoToast"]').forEach(x => x.click()); eq(ev("window.__n"), 1, 'a second undo is impossible');
    eq(ev("S.audit.length"), audit0 + 1, 'exactly one audit entry added (nothing deleted)'); const e = ev("S.audit[0]");
    eq(e.decision, I3_DECISION[lang], 'audit decision "undo"'); eq(e.module, 'Test', 'audit module'); eq(e.subject, 'T-1', 'audit subject');
    const v = ev("auditVerify()"); eq(v.ok, true, 'hash chain still verifies'); eq(v.checked, audit0 + 1, 'chain length');
    clean(w, 'undo ' + lang);
  });

  await group('R10.2 the timer makes the action final; a new undo toast finalises the old one; default 10 s', 'ru', async (g, ev, w) => {
    ev("window.__n = 0; toastUndo('A', function(){ window.__n++; }, {ms: 80})"); assert(w.document.querySelector('[data-test="toast-undo"]'), 'shown');
    await I3_WAIT(250); eq(w.document.querySelector('[data-test="toast-undo"]'), null, 'toast gone after the timer'); eq(ev("S.undo"), null, 'state cleared');
    ev("ACT.undoToast({})"); eq(ev("window.__n"), 0, 'too late: the action is final, undo does nothing'); eq(ev("S.audit[0].decision === 'Отмена'"), false, 'no audit entry for a late undo');
    ev("toastUndo('B', function(){ window.__n += 10; }, {ms: 5000})"); ev("toastUndo('C', function(){ window.__n += 100; }, {ms: 5000})");
    ev("ACT.undoToast({})"); eq(ev("window.__n"), 100, 'only the latest toast can be undone; the older one is final');
    ev("toastUndo('D', function(){}, {})"); eq(ev("S.undo.ms"), 10000, 'default duration is 10 s'); assert(ev("S.undo.until - clockNow().getTime()") > 9000, 'deadline about 10 s ahead');
    ev("toast('plain')"); assert(w.document.querySelector('[data-test="toast-undo"]'), 'an ordinary toast does not remove the undo toast'); assert(w.document.querySelector('[data-test="toast"]'), 'ordinary toast shown too');
  });

  await group('R10 action registry flag undo: the action shows the toast, undo restores, audit entry written', 'ru', async (g, ev, w) => {
    ev("window.__v = 1; ACT.tUndo = function(){ window.__v = 2; }; registerAction('tUndo', {area: 'core', undo: {msg: function(){ return 'changed'; }, snap: function(){ return window.__v; }, revert: function(s){ window.__v = s; }, watch: function(){ return window.__v; }, audit: {module: 'Test', subject: 'tUndo'}}}); bindActions()");
    const a0 = ev("S.audit.length"); ev("ACT.tUndo({})"); eq(ev("window.__v"), 2, 'action applied'); assert(w.document.querySelector('[data-test="toast-undo"]'), 'undo toast after a flagged action');
    ev("ACT.undoToast({})"); eq(ev("window.__v"), 1, 'undo restored the snapshot'); eq(ev("S.audit.length"), a0 + 1, 'audit entry'); eq(ev("auditVerify().ok"), true, 'chain ok');
    ev("ACT.tUndo({})"); ev("ACT.tUndo({})"); /* second call changes nothing: watch() unchanged, no new toast */
    eq(ev("S.undo === null"), false, 'toast of the first change is still the current one');
    ev("bindActions()"); eq(ev("ACT.tUndo.__undo"), true, 'wrapped once'); ev("window.__v = 1; ACT.tUndo({})"); ev("ACT.undoToast({})"); eq(ev("window.__v"), 1, 'double bindActions does not double the toast / undo');
  });
