/* R07 / FR-211 · Command palette: Ctrl+K (⌘K) opens ONE dialog that combines three groups.
     Go      the menu of the current role (navItems) and the tabs of each screen (tabsOf), so only what the role may open;
     Find    the global search of the header: gsResults() (gsLines + gsDb of 001-shell-ext.js) — no second search index;
     Actions a short list of commands; the permission comes from ACTION_REGISTRY (ACTION_DEFS of core.js), `perm` below only for
             commands that are no registered action.
   The dialog lives outside #root (a full render() does not touch the typed query); it uses the shared a11y dialog markup
   (data-a11y-dlg: focus trap and Esc of 002-a11y.js), the combobox/listbox pattern, and KIT.state('empty') when nothing matches.
   Public: openPalette(), closePalette(), paletteSources.{go,find,actions}(q) -> [{group, key, label, hint, run}], PALETTE (state).
   Narrow screens: the header button palButton() (data-act="palOpen"). The last picks are remembered with PREFS ('palRecent'). */
(function () {
  const P = globalThis.PALETTE = { open: false, q: '', idx: 0, items: [], opener: null };
  const GROUPS = [['go', T('Перейти', 'Gehe zu', 'Go to', 'Өту')], ['find', T('Найти', 'Finden', 'Find', 'Іздеу')], ['act', T('Действия', 'Aktionen', 'Actions', 'Әрекеттер')]];
  const L = { title: T('Палитра команд', 'Befehlspalette', 'Command palette', 'Пәрмендер палитрасы'), ph: T('Раздел, заказ, рейс или действие…', 'Bereich, Auftrag, Fahrt oder Aktion …', 'Section, order, load or action…', 'Бөлім, тапсырыс, рейс немесе әрекет…'),
    close: T('Закрыть', 'Schließen', 'Close', 'Жабу'), none: T('Ничего не найдено', 'Nichts gefunden', 'Nothing found', 'Ештеңе табылмады'),
    tryHint: T('Попробуйте номер заказа или рейса, название раздела или действия', 'Versuchen Sie eine Auftrags- oder Fahrtnummer, einen Bereich oder eine Aktion', 'Try an order or load number, a section or an action name', 'Тапсырыс не рейс нөмірін, бөлім не әрекет атауын енгізіңіз'),
    btn: T('Палитра команд', 'Befehlspalette', 'Command palette', 'Пәрмендер палитрасы'), res: T('Результаты', 'Ergebnisse', 'Results', 'Нәтижелер') };
  const TYPE = { order: T('Заказ', 'Auftrag', 'Order', 'Тапсырыс'), load: T('Рейс', 'Fahrt', 'Load', 'Рейс'), package: T('Место', 'Packstück', 'Package', 'Орын'), booking: T('Бронь', 'Buchung', 'Booking', 'Брон') };

  globalThis.paletteKeyText = () => T('Палитра команд: переход, поиск, действия', 'Befehlspalette: Navigation, Suche, Aktionen', 'Command palette: go to, find, actions', 'Пәрмендер палитрасы: өту, іздеу, әрекеттер');   // row of KEYS() in 002-a11y.js

  /* ---------- sources ---------- */
  const tabLabel = t => (typeof t.label === 'function' ? t.label() : t.label);
  const norm = s => String(s == null ? '' : s).toLowerCase();
  /* 3 = starts with the query, 2 = a word starts with it, 1 = contains it, 0 = no match */
  const score = (it, q) => { const a = norm(it.label); if (a.startsWith(q)) return 3; if (a.includes(' ' + q) || a.includes('› ' + q)) return 2; return a.includes(q) || norm(it.hint).includes(q) ? 1 : 0; };
  const rank = (items, q, max) => {
    if (!q) return items.slice(0, max);
    return items.map((it, i) => ({ it, s: score(it, q), i })).filter(x => x.s).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, max).map(x => x.it);
  };
  const recent = () => { const r = PREFS.get('palRecent', []); return Array.isArray(r) ? r : []; };
  const remember = key => { const r = [key].concat(recent().filter(k => k !== key)).slice(0, 5); PREFS.set('palRecent', r); };
  const byRecent = items => { const r = recent(); return items.slice().sort((a, b) => { const x = r.indexOf(a.key), y = r.indexOf(b.key); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y); }); };

  const sGo = q => {
    const out = [];
    navItems().forEach(n => {
      out.push({ group: 'go', key: 'go:' + n[0], label: n[2], hint: '', run: () => go(n[0]) });
      if (q) tabsOf(n[0]).forEach(t => out.push({ group: 'go', key: 'go:' + n[0] + '/' + t.key, label: n[2] + ' › ' + tabLabel(t), hint: '', run: () => { go(n[0]); if (S.route === n[0]) setTab(n[0], t.key); } }));
    });
    return rank(q ? out : byRecent(out), q, 8);
  };
  /* the header search is the only index: put the query into S.gs.q for one call and give it back */
  const sFind = q => {
    if (q.length < 2 || typeof gsResults !== 'function') return [];
    const old = S.gs.q; let r;
    S.gs.q = q; try { r = gsResults(); } finally { S.gs.q = old; }
    const mk = (x, i) => x.kind === 'line'
      ? { group: 'find', key: 'find:' + x.load + ':' + x.order + ':' + x.what + ':' + x.hit, label: x.what + ': ' + x.hit, hint: [x.load, x.name].filter(Boolean).join(' · '), i }
      : { group: 'find', key: 'find:' + x.type + ':' + x.id, label: x.id, hint: (TYPE[x.type] || '') + ' · ' + x.label, i };
    return r.L.slice(0, 6).map((x, i) => mk(x, i)).concat(r.D.slice(0, 4).map((x, j) => mk(x, r.L.length + j))).map(it => Object.assign(it, {
      run: () => { S.gs.q = q; try { ACT.gsOpen({ i: it.i }); } finally { S.gs.q = ''; } },   // gsOpen reads the same result list by position
    }));
  };
  /* [action, text, extra permission, hide when …] — the permission of a registered action (core.js ACTION_DEFS) is always applied */
  const ACTS = () => [
    ['create', T('Создать рейс', 'Fahrt anlegen', 'Create a load', 'Рейс құру')],
    ['addD', T('Добавить водителя', 'Fahrer anlegen', 'Add a driver', 'Жүргізуші қосу')],
    ['auto', T('Автоназначение рейсов', 'Fahrten automatisch zuweisen', 'Auto-assign loads', 'Рейстерді автоматты тағайындау')],
    ['alarmsGo', T('Открыть тревоги', 'Alarme öffnen', 'Open alarms', 'Дабылдарды ашу'), 'alarms:read'],
    ['ncOpen', T('Центр уведомлений', 'Benachrichtigungen', 'Notification centre', 'Хабарландыру орталығы')],
    ['helpHere', T('Справка по этому экрану', 'Hilfe zu diesem Bildschirm', 'Help for this screen', 'Осы экран бойынша анықтама')],
    ['kbdOpen', T('Клавиши и экран', 'Tastatur und Anzeige', 'Keyboard and display', 'Пернелер және көрсету')],
    ['a11yHc', T('Высокий контраст: вкл./выкл.', 'Hoher Kontrast an/aus', 'High contrast on/off', 'Жоғары контраст: қосу/өшіру')],
    ['a11yRm', T('Меньше движения: вкл./выкл.', 'Weniger Bewegung an/aus', 'Reduced motion on/off', 'Қозғалысты азайту: қосу/өшіру')],
    ['setDesign', T('Сменить оформление', 'Design wechseln', 'Switch the design', 'Дизайнды ауыстыру')],
  ];
  const sActs = q => {
    const allowed = a => { const p = (ACTION_REGISTRY[a[0]] || {}).perm || a[2]; return typeof ACT[a[0]] === 'function' && (!p || canDo(p)); };
    const out = ACTS().filter(allowed)
      .map(a => ({ group: 'act', key: 'act:' + a[0], label: a[1], hint: '', run: () => ACT[a[0]]({}, null, null) }));
    return rank(q ? out : byRecent(out), q, 6);
  };
  globalThis.paletteSources = { go: sGo, find: sFind, actions: sActs };

  /* ---------- dialog ---------- */
  const items = () => { const q = norm(P.q).trim(); return sGo(q).concat(sFind(P.q.trim()), sActs(q)); };
  const listHtml = () => {
    if (!P.items.length) return '';
    return GROUPS.map(g => {
      const rows = P.items.filter(x => x.group === g[0]); if (!rows.length) return '';
      return `<div role="group" aria-labelledby="pal-g-${g[0]}"><div class="pal-gh" id="pal-g-${g[0]}">${esc(g[1])}</div>${rows.map(it => { const n = P.items.indexOf(it), on = n === P.idx;
        return `<div class="pal-o${on ? ' on' : ''}" role="option" id="pal-o${n}" aria-selected="${on}" data-pal="${n}"><span class="pal-l">${esc(it.label)}</span>${it.hint ? `<small class="pal-s">${esc(it.hint)}</small>` : ''}</div>`; }).join('')}</div>`;
    }).join('');
  };
  const root = () => document.getElementById('pal-root');
  const draw = () => {
    P.items = items(); P.idx = Math.min(P.idx, Math.max(0, P.items.length - 1));
    const r = root(); if (!r) return;
    const ls = r.querySelector('#pal-list'); ls.innerHTML = listHtml(); ls.hidden = !P.items.length;   // an empty listbox is not valid ARIA: the state takes its place
    r.querySelector('#pal-none').innerHTML = P.items.length ? '' : KIT.state('empty', { title: L.none, hint: L.tryHint, action: false });
    const inp = r.querySelector('#pal-q'); inp.setAttribute('aria-expanded', String(P.items.length > 0));
    if (P.items.length) inp.setAttribute('aria-activedescendant', 'pal-o' + P.idx); else inp.removeAttribute('aria-activedescendant');
  };
  const mark = () => {   // only the selection moved: no list rebuild
    const r = root(); if (!r) return;
    r.querySelectorAll('.pal-o').forEach(e => { const on = +e.dataset.pal === P.idx; e.classList.toggle('on', on); e.setAttribute('aria-selected', String(on)); if (on) e.scrollIntoView({ block: 'nearest' }); });
    r.querySelector('#pal-q').setAttribute('aria-activedescendant', 'pal-o' + P.idx);
  };
  globalThis.openPalette = () => {
    if (P.open || document.querySelector('.login-layer')) return;
    P.open = true; P.q = ''; P.idx = 0; P.opener = document.activeElement;
    const d = document.createElement('div'); d.id = 'pal-root';
    d.innerHTML = `<div class="a11y-back" data-pal-close></div><div class="a11y-dlg pal-dlg" role="dialog" aria-modal="true" aria-labelledby="pal-h" tabindex="-1" data-a11y-dlg><h2 id="pal-h" class="pal-h">${esc(L.title)}</h2><div class="pal-in"><input id="pal-q" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" aria-label="${esc(L.title)}" autocomplete="off" placeholder="${esc(L.ph)}"><button type="button" class="x" data-pal-close aria-label="${esc(L.close)}">${ic('x', 18)}</button></div><div id="pal-list" role="listbox" aria-label="${esc(L.res)}"></div><div id="pal-none" class="pal-none"></div><div class="pal-foot">↑ ↓ · Enter · Esc</div></div>`;
    document.body.appendChild(d); draw();
    if (typeof a11yPass === 'function') a11yPass(d);
    d.querySelector('#pal-q').focus();
  };
  globalThis.closePalette = back => {
    const r = root(); if (!P.open) return; P.open = false; if (r) r.remove();
    const o = P.opener; P.opener = null;
    if (back !== false) { const t = o && o.isConnected ? o : document.querySelector('[data-act="palOpen"]'); if (t && t.focus) t.focus(); }
  };
  const pick = n => { const it = P.items[n]; if (!it) return; remember(it.key); closePalette(false); it.run(); };
  globalThis.palettePick = pick;   // the same as Enter on the n-th row

  Object.assign(ACT, { palOpen: () => { P.open ? closePalette() : openPalette(); } });
  globalThis.palButton = () => `<button type="button" class="btn grey sm pal-btn" data-act="palOpen" data-test="pal-btn" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" aria-label="${esc(L.btn)}" title="${esc(L.btn)} · Ctrl+K">${ic('spark', 16)}</button>`;

  /* ---------- keyboard: capture phase, so Esc / arrows of the open dialog never reach the handlers behind it ---------- */
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K' || e.code === 'KeyK')) {
      e.preventDefault(); e.stopImmediatePropagation();   // a field keeps its text; the browser's own Ctrl+K is taken too
      P.open ? closePalette() : openPalette(); return;
    }
    if (!P.open) return;
    const k = e.key, n = P.items.length;
    if (k === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closePalette(); }
    else if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); if (n) { P.idx = (P.idx + (k === 'ArrowDown' ? 1 : n - 1)) % n; mark(); } }
    else if (k === 'Enter' && e.target && e.target.id === 'pal-q') { e.preventDefault(); e.stopImmediatePropagation(); pick(P.idx); }
  }, true);
  document.addEventListener('input', e => { if (e.target && e.target.id === 'pal-q') { P.q = e.target.value; P.idx = 0; draw(); } });
  document.addEventListener('click', e => {
    if (!P.open || !e.target.closest) return;
    const o = e.target.closest('[data-pal]'); if (o) return pick(+o.dataset.pal);
    if (e.target.closest('[data-pal-close]')) closePalette();
  });

  try { document.head.insertAdjacentHTML('beforeend', '<style>.pal-dlg{top:10vh;padding:0} .pal-h{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)} .pal-in{display:flex;align-items:center;gap:8px;padding:12px 16px;position:sticky;top:0;background:var(--bg-card,#fff);border-bottom:1px solid var(--border)} #pal-q{flex:1;min-width:0;height:38px;padding:0 12px;font:inherit;color:inherit;background:var(--bg-card,#fff);border:1px solid var(--border-input,var(--border));border-radius:6px} .pal-gh{padding:10px 20px 4px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--text-muted)} .pal-o{display:flex;flex-direction:column;gap:2px;padding:8px 20px;cursor:pointer} .pal-o.on{background:var(--bg-subtle);box-shadow:inset 3px 0 0 var(--primary)} .pal-s{color:var(--text-muted)} .pal-none{padding:16px} .pal-foot{padding:8px 20px;font-size:12px;color:var(--text-muted);border-top:1px solid var(--border)} .pal-btn{flex:none;padding:0 8px;min-width:32px} @media (max-width:1100px){.pal-btn{padding:0 5px;min-width:28px;margin-right:-4px} .topbar .crumb{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}}   /* the two header buttons take room: a long breadcrumb gives way */ @media (max-width:700px){.pal-dlg{top:4vh}} @media (max-width:480px){.pal-btn{padding:0 6px}}</style>'); } catch (_) { /* no document */ }
})();
