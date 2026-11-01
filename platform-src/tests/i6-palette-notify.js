  /* ---- I6 · R07 / R12 (FR-211, FR-217): command palette (Ctrl+K) and notification centre (screens/shell/090-palette.js, 095-notify.js) ---- */
  const i6Show = async w => { w.frameElement.style.cssText = 'display:block;position:absolute;left:-10000px;top:0;width:1316px;height:760px;border:0'; await new Promise(r => setTimeout(r, 30)); };
  const i6Key = (w, key, o) => { const t = w.document.activeElement || w.document.body; const e = new w.KeyboardEvent('keydown', Object.assign({ key, bubbles: true, cancelable: true }, o || {})); t.dispatchEvent(e); return e; };
  const i6Type = (w, text) => { const q = w.document.getElementById('pal-q'); q.value = text; q.dispatchEvent(new w.Event('input', { bubbles: true })); };
  const i6Cyr = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/;
  /* the three group names of the brief ("Go to / Find / Actions") per page language */
  const I6_GROUPS = { ru: ['Перейти', 'Найти', 'Действия'], de: ['Gehe zu', 'Finden', 'Aktionen'], en: ['Go to', 'Find', 'Actions'], kk: ['Өту', 'Іздеу', 'Әрекеттер'] };
  const I6_UNREAD = "S.alarms.filter(a=>a.status==='open').length+S.inbox.filter(m=>m.st==='new').length+S.tasks.filter(t=>!t.done).length";
  const I6_ALL = "S.alarms.filter(a=>a.status!=='closed').length+S.inbox.filter(m=>m.st!=='done').length+S.tasks.filter(t=>!t.done).length";
  const i6Axe = async (w, where) => {
    const src = await fetch('test-vendor/axe.min.js').then(r => (r.ok ? r.text() : '')).catch(() => '');
    if (!w.axe) w.eval(src);
    const r = await w.axe.run(w.document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return r.violations.filter(v => v.impact === 'serious' || v.impact === 'critical').map(v => where + ': ' + v.id + ' ×' + v.nodes.length + ' ' + v.nodes[0].target.join(' ') + ' ' + v.nodes[0].html.slice(0, 80));
  };

  for (const lang of LANGS) await group('[' + lang + '] R07 Ctrl+K: dialog with the field focused, groups Go / Find / Actions, arrows, Enter opens, Esc closes and gives the focus back', lang, async (g, ev, w) => {
    await i6Show(w); const d = w.document;
    ev("go('dashboard')"); const link = d.querySelector('.nav-item'); link.focus();
    const e = i6Key(w, 'k', { ctrlKey: true }); assert(e.defaultPrevented, 'Ctrl+K is taken');
    const dlg = d.querySelector('#pal-root [data-a11y-dlg]'); assert(dlg, 'dialog'); eq(dlg.getAttribute('role'), 'dialog'); eq(dlg.getAttribute('aria-modal'), 'true');
    const inp = d.getElementById('pal-q'); eq(d.activeElement, inp, 'focus is in the field'); eq(inp.getAttribute('role'), 'combobox');
    assert(ev("A11Y_KEYS().some(k => k[0].includes('Ctrl+K'))"), 'Ctrl+K is in the shortcut list KEYS()');
    /* the query "load" style number brings the third group; the heading texts are the page language */
    i6Type(w, 'LD-2026-0018');
    const heads = [...d.querySelectorAll('#pal-list .pal-gh')].map(x => x.textContent);
    assert(heads.includes(I6_GROUPS[lang][1]), 'group "' + I6_GROUPS[lang][1] + '" in ' + heads.join('|'));
    i6Type(w, '');
    const h0 = [...d.querySelectorAll('#pal-list .pal-gh')].map(x => x.textContent); eq(h0.join('|'), I6_GROUPS[lang][0] + '|' + I6_GROUPS[lang][2], 'empty query: Go and Actions');
    if (lang === 'de' || lang === 'en') assert(!i6Cyr.test(dlg.textContent), lang + ' dialog has Cyrillic: ' + (dlg.textContent.match(/.{0,20}[А-Яа-яЁё].{0,20}/) || [''])[0]);
    assert(!/⟦/.test(dlg.textContent), 'no missing string keys');
    /* arrows move the selection (aria-activedescendant), wrap around */
    const opts = () => [...d.querySelectorAll('#pal-list [role=option]')];
    eq(opts()[0].getAttribute('aria-selected'), 'true', 'first row selected'); eq(inp.getAttribute('aria-activedescendant'), opts()[0].id);
    i6Key(w, 'ArrowDown'); eq(opts()[1].getAttribute('aria-selected'), 'true', 'ArrowDown'); eq(inp.getAttribute('aria-activedescendant'), opts()[1].id);
    i6Key(w, 'ArrowUp'); i6Key(w, 'ArrowUp'); eq(opts()[opts().length - 1].getAttribute('aria-selected'), 'true', 'ArrowUp wraps to the last row');
    /* Enter on a menu item goes there */
    const target = ev("navItems().find(n => n[0] !== S.route && n[0] !== 'help')"); i6Type(w, target[2]);
    i6Key(w, 'Enter'); eq(ev('S.route'), target[0], 'Enter opens the section'); assert(!d.getElementById('pal-root'), 'the dialog closes after the pick');
    /* Esc closes and the focus goes back */
    ev("go('dashboard')"); const b = d.querySelector('.nav-item'); b.focus(); i6Key(w, 'k', { ctrlKey: true }); assert(d.getElementById('pal-root'), 'opens again');
    i6Key(w, 'Escape'); assert(!d.getElementById('pal-root'), 'Esc closes'); eq(d.activeElement, b, 'the focus returns to the control that had it');
    i6Key(w, 'k', { metaKey: true }); assert(d.getElementById('pal-root'), '⌘K opens too'); i6Key(w, 'k', { ctrlKey: true }); assert(!d.getElementById('pal-root'), 'Ctrl+K again closes');
    clean(w, 'palette');
  });

  await group('[ru] R07 sources: Go = menu and tabs of the role, Find = the header search (no second index), Actions = ACTION_DEFS with the role rights', 'ru', async (g, ev, w) => {
    const keys = (src, q) => ev(`paletteSources.${src}(${JSON.stringify(q)}).map(x => x.key)`);
    const nav = ev("navItems().map(n => n[0])");
    assert(keys('go', '').length >= 5 && keys('go', '').every(k => nav.includes(k.slice(3))), 'empty query: only the menu of the role');
    const tabItem = ev("(() => { for (const n of navItems()) { const t = tabsOf(n[0])[1]; if (t) return [n[0], t.key, n[2] + ' › ' + (typeof t.label === 'function' ? t.label() : t.label)]; } })()");
    eq(keys('go', tabItem[2].toLowerCase()).includes('go:' + tabItem[0] + '/' + tabItem[1]), true, 'a tab is found by "Section › Tab"');
    /* Find returns what the header search finds for the same text, in the same order */
    const q = ev("S.loads[0].id");
    assert(ev(`paletteSources.find('${q}').length`) > 0, 'find: hits for ' + q);
    ev(`(() => { const old = S.gs.q; S.gs.q = '${q}'; globalThis.__gs = gsResults().all.length; S.gs.q = old; })()`);
    assert(ev('__gs') >= ev(`paletteSources.find('${q}').length`), 'find never shows more than the header search');
    eq(ev("S.gs.q"), '', 'the header search text is untouched');
    ev(`paletteSources.find('${q}')[0].run()`); eq(ev('S.route'), 'orders', 'a hit opens the orders screen');
    /* Actions: rights of the role come from the registry (create needs orders:write) */
    assert(keys('actions', '').includes('act:create'), 'admin: Create a load');
    ev("ACT.setRole({v:'viewer'})"); assert(!keys('actions', '').includes('act:create'), 'viewer: no create');
    eq(ev("canDo('orders:write')"), false); assert(!keys('actions', '').includes('act:auto') && !keys('actions', '').includes('act:addD'), 'viewer: no write actions');
    const nv = ev("navItems().map(n => n[0])"); assert(keys('go', 'a').every(k => nv.includes(k.slice(3).split('/')[0])), 'viewer: Go only has screens of the viewer');
    ev("ACT.setRole({v:'warehouse'})"); const nw = ev("navItems().map(n => n[0])");
    assert(keys('go', 'a').every(k => nw.includes(k.slice(3).split('/')[0])), 'warehouse: Go only has its screens');
  });

  await group('[ru] R07.1 nothing found: the uniform empty state with a hint; a hit that the role may not see is not offered', 'ru', async (g, ev, w) => {
    await i6Show(w); const d = w.document; ev("go('dashboard')");
    i6Key(w, 'k', { ctrlKey: true }); i6Type(w, 'zzqxj');
    eq(d.querySelectorAll('#pal-list [role=option]').length, 0, 'no rows'); const st = d.querySelector('#pal-none [data-test="state:empty"]'); assert(st, 'KIT.state empty');
    assert(/Ничего не найдено/.test(st.textContent) && /Попробуйте/.test(st.textContent), 'text with a next step: ' + st.textContent);
    eq(d.getElementById('pal-q').getAttribute('aria-expanded'), 'false'); assert(!d.getElementById('pal-q').hasAttribute('aria-activedescendant'), 'no active row');
    i6Key(w, 'Enter'); assert(d.getElementById('pal-root'), 'Enter on nothing keeps the dialog'); i6Key(w, 'Escape');
    ev("ACT.setRole({v:'finance'})"); i6Key(w, 'k', { ctrlKey: true }); i6Type(w, 'Create a load'); i6Type(w, 'Создать рейс');
    eq(d.querySelectorAll('#pal-list [role=option]').length, 0, 'finance may not create: the action is not offered'); i6Key(w, 'Escape');
  });

  await group('[ru] R07.2 Ctrl+K inside input fields keeps the text, the header button opens the dialog, Esc returns to the field', 'ru', async (g, ev, w) => {
    await i6Show(w); const d = w.document; ev("go('orders')");
    const f = d.createElement('input'); f.id = 'i6-field'; f.value = 'typed text'; d.body.appendChild(f); f.focus(); f.setSelectionRange(2, 4);
    const e = i6Key(w, 'k', { ctrlKey: true }); assert(e.defaultPrevented, 'the browser shortcut is not left to the field');
    assert(d.getElementById('pal-root'), 'opens from a field'); eq(f.value, 'typed text', 'the field keeps its text');
    i6Type(w, 'abc'); eq(f.value, 'typed text', 'typing goes to the palette field only');
    i6Key(w, 'Escape'); eq(d.activeElement, f, 'focus is back in the field'); eq(f.value, 'typed text');
    const s = d.getElementById('gsearch'); s.focus(); s.value = 'LD'; i6Key(w, 'k', { ctrlKey: true }); assert(d.getElementById('pal-root'), 'opens from the header search'); eq(s.value, 'LD'); i6Key(w, 'Escape'); eq(d.activeElement, s);
    f.remove();
    const btn = d.querySelector('.topbar [data-act="palOpen"]'); assert(btn, 'button in the header'); assert(btn.getAttribute('aria-label') && btn.getAttribute('aria-haspopup') === 'dialog', 'named button');
    btn.focus(); btn.click(); assert(d.getElementById('pal-root'), 'the button opens the dialog'); d.querySelector('[data-pal-close].x').click(); assert(!d.getElementById('pal-root'), 'the close button works'); eq(d.activeElement, btn, 'focus back on the button');
    await i6Show(w); w.frameElement.style.width = '375px'; await new Promise(r => setTimeout(r, 60));
    const r = btn.getBoundingClientRect(); assert(r.width > 0 && r.right <= 375, 'the button is visible on a phone width: ' + r.right);
    assert(w.document.documentElement.scrollWidth <= 376, 'no horizontal scroll at 375 px: ' + w.document.documentElement.scrollWidth);
  });

  for (const lang of ['ru', 'en']) await group('[' + lang + '] R07 a11y: axe on the open palette (with results and empty) and on the notification dialog', lang, async (g, ev, w) => {
    await i6Show(w); const d = w.document; ev("go('dashboard')"); const bad = [];
    i6Key(w, 'k', { ctrlKey: true }); bad.push(...await i6Axe(w, 'palette'));
    i6Type(w, 'LD-2026-0018'); bad.push(...await i6Axe(w, 'palette results')); i6Type(w, 'zzqxj'); bad.push(...await i6Axe(w, 'palette empty'));
    const back = d.querySelector('#pal-root .a11y-back'); assert(back, 'backdrop'); i6Key(w, 'Escape');
    d.querySelector('[data-act="ncOpen"]').click(); bad.push(...await i6Axe(w, 'notifications'));
    assert(!bad.length, bad.length + ' axe violation(s): ' + bad.slice(0, 4).join(' | '));
  });

  for (const lang of LANGS) await group('[' + lang + '] R12 bell: counter = unread of alarms + inbox + tasks, one list with filters All / Unread / Mine, read / unread buttons', lang, async (g, ev, w) => {
    await i6Show(w); const d = w.document; ev("go('dashboard')");
    const bell = d.querySelector('.topbar [data-act="ncOpen"]'); assert(bell, 'bell button'); const n0 = ev(I6_UNREAD);
    eq(+bell.querySelector('[data-live="nc"]').textContent, n0, 'counter = unread of the three sources'); eq(ev('NC.count()'), n0);
    assert(new RegExp('\\b' + n0 + '\\b').test(bell.getAttribute('aria-label')), 'the number is in the accessible name: ' + bell.getAttribute('aria-label'));
    bell.focus(); bell.click(); const dlg = d.querySelector('#nc-root [data-a11y-dlg]'); assert(dlg, 'dialog'); eq(dlg.getAttribute('aria-modal'), 'true');
    eq(d.querySelectorAll('#nc-root .nc-it').length, ev(I6_ALL), 'one list: every open alarm, inbox message and task');
    const types = new Set([...d.querySelectorAll('#nc-root .nc-it .chip:first-child')].map(x => x.textContent)); eq(types.size, 3, 'three kinds in one list: ' + [...types].join(','));
    if (lang === 'de' || lang === 'en') assert(!i6Cyr.test(dlg.textContent), lang + ' notification dialog has Cyrillic: ' + (dlg.textContent.match(/.{0,20}[А-Яа-яЁё].{0,20}/) || [''])[0]);
    assert(!/⟦/.test(dlg.textContent), 'no missing string keys');
    const fl = [...d.querySelectorAll('#nc-root [data-nc-f]')]; eq(fl.map(x => x.dataset.ncF).join(), 'all,unread,mine', 'three filters'); eq(fl[0].getAttribute('aria-pressed'), 'true');
    const flt = k => d.querySelector(`#nc-root [data-nc-f="${k}"]`);   // the filter bar is redrawn on every click
    flt('unread').click(); eq(d.querySelectorAll('#nc-root .nc-it').length, n0, 'Unread shows the unread ones'); eq(flt('unread').getAttribute('aria-pressed'), 'true');
    flt('mine').click(); eq(d.querySelectorAll('#nc-root .nc-it').length, ev("NC.list('mine').length"), 'Mine'); assert(ev("NC.list('mine').every(x => x.who === taskMe())"), 'mine = assigned to me');
    flt('unread').click();
    const first = d.querySelector('#nc-root .nc-it.unread'); const key = first.dataset.k;
    first.querySelector('[data-nc="read"]').click();
    eq(ev('NC.count()'), n0 - 1, 'read: counter -1'); eq(+d.querySelector('.topbar [data-live="nc"]').textContent, n0 - 1, 'the bell follows');
    eq(ev(`S.nc[${JSON.stringify(key)}].read`), true, 'the overlay S.nc holds the state'); assert(!d.querySelector(`#nc-root .nc-it[data-k="${key}"]`), 'it left the Unread list');
    flt('all').click(); const row = d.querySelector(`#nc-root .nc-it[data-k="${key}"]`); assert(row && !row.classList.contains('unread'), 'read row in All');
    row.querySelector('[data-nc="read"]').click(); eq(ev('NC.count()'), n0, 'unread again'); eq(ev(`NC.list('unread').some(x => x.key === ${JSON.stringify(key)})`), true);
    i6Key(w, 'Escape'); assert(!d.getElementById('nc-root'), 'Esc closes'); eq(d.activeElement.dataset.act, 'ncOpen', 'focus back on the bell');
    clean(w, 'notifications');
  });

  await group('[ru] R12.1 the sources are not touched: S.alarms / S.inbox / S.tasks and their screens and counters stay as they were', 'ru', async (g, ev, w) => {
    const h = () => ev("[S.alarms, S.inbox, S.tasks].map(lazyHash).join()"), before = h();
    const badge = () => ev("[tabsOf('dashboard').map(t => t.badge ? t.badge() : 0).join(), activeAlarms(), alertsCount()].join('/')"), b0 = badge();
    ev("NC.list('all').slice(0, 6).forEach((x, i) => { i % 3 === 0 ? NC.read(x.key) : i % 3 === 1 ? NC.snooze(x.key, 3600000) : NC.assign(x.key, 'Max Keller'); })");
    eq(h(), before, 'sources unchanged by read / snooze / assign'); eq(badge(), b0, 'tab badges and header counters as before');
    eq(ev("Object.keys(S.nc).every(k => /^(alarm|inbox|task):/.test(k))"), true, 'overlay keys are <type>:<id>');
    ev("go('dashboard'); setTab('dashboard','alarms')"); clean(w, 'alarms screen');
    ev("setTab('dashboard','inbox')"); clean(w, 'inbox screen');
    /* a closed alarm / a done task leaves the list, the unread count follows the source */
    const k = ev("NC.list('all').find(x => x.type === 'task').key"); ev("S.tasks.find(t => 'task:' + t.id === " + JSON.stringify(k) + ").done = true");
    eq(ev(`NC.list('all').some(x => x.key === ${JSON.stringify(k)})`), false, 'a done task leaves the centre');
    /* rights: the customer sees nothing, finance only the inbox, a viewer no tasks */
    ev("ACT.setRole({v:'customer'})"); eq(ev("NC.list('all').length"), 0, 'customer: nothing'); ev("ACT.setRole({v:'finance'})"); eq(ev("[...new Set(NC.list('all').map(x => x.type))].join()"), 'inbox', 'finance: inbox only');
    ev("ACT.setRole({v:'viewer'})"); eq(ev("NC.list('all').some(x => x.type === 'task')"), false, 'viewer: no tasks');
  });

  await group('[ru] R12.2 snooze 1 h / 4 h / tomorrow hides the item and counter, it returns unread by the clock of the demo', 'ru', async (g, ev, w) => {
    await i6Show(w); const d = w.document; ev("go('dashboard')");
    const n0 = ev('NC.count()'), key = ev("NC.list('unread')[0].key"), K = JSON.stringify(key), t0 = ev('NC.now()');
    eq(ev(`NC.snooze(${K}, 3600000)`), true); eq(ev('NC.count()'), n0 - 1, 'counter -1'); eq(ev(`NC.list('all').some(x => x.key === ${K})`), false, 'hidden from the list'); eq(ev('NC.snoozed().length'), 1);
    eq(ev(`S.nc[${K}].until`), t0 + 3600000, 'until = clock + 1 h');
    ev(`NC.now = () => ${t0 + 3599999}`); eq(ev(`NC.list('all').some(x => x.key === ${K})`), false, 'one ms before: still asleep');
    ev(`NC.now = () => ${t0 + 3600000}`); eq(ev(`NC.list('unread').some(x => x.key === ${K})`), true, 'at the time: back and UNREAD'); eq(ev('NC.count()'), n0); eq(ev(`S.nc[${K}].until`), undefined, 'the snooze is cleared');
    /* the buttons of the dialog: 1 h, 4 h, tomorrow */
    ev(`NC.now = () => ${t0}`); d.querySelector('[data-act="ncOpen"]').click();
    const row = () => d.querySelector(`#nc-root .nc-it[data-k=${K}]`); assert(row(), 'row');
    const sn = [...row().querySelectorAll('[data-nc="snooze"]')]; eq(sn.length, 3, 'three snooze buttons'); eq(sn.map(b => b.dataset.ms).join(), '3600000,14400000,0');
    sn[1].click(); assert(!row(), 'the row is gone after 4 h'); eq(ev(`S.nc[${K}].until - ${t0}`), 4 * 3600000, '4 h');
    assert(d.querySelector('#nc-root .nc-z'), 'the footer counts the snoozed'); assert(d.activeElement && d.activeElement.closest('#nc-root'), 'focus stays in the dialog');
    ev(`NC.now = () => ${t0 + 4 * 3600000 + 1}`); ev(`NC.snooze(${K}, 1)`);   // a stray call keeps working
    const key2 = ev(`NC.list('unread').find(x => x.key !== ${K}).key`), K2 = JSON.stringify(key2); ev(`NC.now = () => ${t0}`); d.querySelector('#nc-root [data-nc-f="all"]').click();
    d.querySelector(`#nc-root .nc-it[data-k=${K2}] [data-nc="snooze"][data-ms="0"]`).click();
    const tom = ev(`S.nc[${K2}].until - ${t0}`); assert(tom > 0 && tom <= 33 * 3600000, 'tomorrow is within the next day: ' + tom / 3600000 + ' h');
    eq(ev(`new Date(S.nc[${K2}].until + 5 * 3600000).getUTCHours()`), 9, 'tomorrow 09:00 Astana time');
    assert(ev("S.undo && S.undo.msg.length > 0"), 'an undo toast follows'); ev("ACT.undoToast({})"); eq(ev(`NC.list('all').some(x => x.key === ${K2})`), true, 'undo brings it back');
  });

  await group('[ru] R12.2 assign: written to the audit log (chain intact), appears in Mine, needs the right of the source', 'ru', async (g, ev, w) => {
    const a0 = ev('S.audit.length'), me = ev('taskMe()');
    const tk = ev("NC.list('all').find(x => x.type === 'task' && x.who === taskMe()).key"), TK = JSON.stringify(tk);
    assert(ev(`NC.list('mine').some(x => x.key === ${TK})`), 'my task is in Mine');
    eq(ev(`NC.assign(${TK}, 'Max Keller')`), true); eq(ev('S.audit.length'), a0 + 1, 'one audit entry');
    const e = ev('JSON.stringify(S.audit[0])'); const o = JSON.parse(e);
    eq(o.module, 'Notifications'); eq(o.subject, tk); eq(o.reason, 'Max Keller'); eq(o.action, 'notify.assigned'); assert(o.decision && !/⟦/.test(o.decision), 'decision text');
    assert(ev('auditVerify().ok'), 'the audit hash chain is intact'); eq(ev(`NC.list('mine').some(x => x.key === ${TK})`), false, 'assigned away: not mine any more');
    eq(ev(`S.tasks.find(t => 'task:' + t.id === ${TK}).who`), me, 'the task of the CRM screen keeps its own owner (overlay only)');
    const ak = ev("NC.list('all').find(x => x.type === 'alarm').key"), AK = JSON.stringify(ak);
    eq(ev(`NC.assign(${AK}, taskMe())`), true); assert(ev(`NC.list('mine').some(x => x.key === ${AK})`), 'an alarm assigned to me is in Mine');
    eq(ev(`NC.assign(${AK}, '')`), false, 'no name: refused'); eq(ev("NC.assign('alarm:NOPE', 'x')"), false, 'unknown key: refused');
    ev("ACT.setRole({v:'viewer'})"); const a1 = ev('S.audit.length');
    eq(ev(`NC.assign(${AK}, 'Max Keller')`), false, 'viewer has no alarms:write'); eq(ev('S.audit.length'), a1, 'a refused assign writes nothing');
    /* the dialog: a select per row, choosing a name assigns */
    await i6Show(w); ev("ACT.setRole({v:'admin'})"); ev("go('dashboard')"); const d = w.document; d.querySelector('[data-act="ncOpen"]').click();
    const sel = d.querySelector('#nc-root .nc-it[data-k^="alarm:"] select[data-nc-who]'); assert(sel && sel.getAttribute('aria-label'), 'named select'); const pick = [...sel.options].find(o => o.value && o.value !== me).value; sel.value = pick; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    eq(ev('S.audit[0].action'), 'notify.assigned', 'the dialog assigns too'); assert(d.querySelector('#nc-root .nc-it[data-k^="alarm:"] small').textContent.includes(pick), 'the name shows in the row');
  });
