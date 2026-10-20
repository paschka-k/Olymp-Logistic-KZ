/* S3 accessibility (docs/OPTIMISATION-FR.md, section E):
   FR-215 keyboard and focus: drawers and dialogs trap Tab, Esc closes them (001-shell-ext.js), focus returns to the trigger,
          every data-act control is reachable with Tab, "?" opens the keyboard-shortcut list.
   FR-218 WCAG 2.2 AA: after every render the a11y pass gives unlabeled fields a name, scrollable regions a tab stop and toggles a
          name; tests/f0-a11y.js runs axe-core on every screen (axe is a test-only file, never in the product pages).
   FR-219 high contrast + reduced motion (html[data-contrast] / html[data-motion], OS preference by default, CSS in app.css) and
          chartAlt(): every chart also as a data table or text. */
(function () {
  /* ---------- preferences: OS default, own choice kept in localStorage (not inside test iframes, which must stay isolated) ---------- */
  const KEY = 'kz-a11y', store = typeof window !== 'undefined' && !window.frameElement;
  const mq = q => { try { return !!(window.matchMedia && window.matchMedia(q).matches); } catch (_) { return false; } };
  let saved = {}; if (store) { try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (_) { saved = {}; } }
  S.a11y = { hc: saved.hc != null ? !!saved.hc : mq('(prefers-contrast: more)'), rm: saved.rm != null ? !!saved.rm : mq('(prefers-reduced-motion: reduce)') };
  S.kbd = false;
  const applyPrefs = () => { const h = document.documentElement; h.dataset.contrast = S.a11y.hc ? 'high' : 'normal'; h.dataset.motion = S.a11y.rm ? 'reduce' : 'full'; };
  const savePrefs = () => { if (store) { try { localStorage.setItem(KEY, JSON.stringify({ hc: S.a11y.hc, rm: S.a11y.rm })); } catch (_) { /* private mode */ } } };
  applyPrefs();
  globalThis.a11yReducedMotion = () => !!S.a11y.rm;

  /* ---------- FR-219: chart as table / text ---------- */
  const TBL = () => LT('a11y.data_table');
  /* chartAlt(caption, head[], rows[][]) -> <details data-chart-alt> with a real table; the first cell of a row is its header */
  globalThis.chartAlt = (caption, head, rows) => `<details class="chart-alt" data-chart-alt><summary>${esc(TBL())}</summary><table class="table chart-tbl"><caption>${esc(caption)}</caption><thead><tr>${head.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => (i ? `<td>${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`)).join('')}</tr>`).join('')}</tbody></table></details>`;
  /* chartTxt(text) -> one line of text that says what a sparkline shows (screen readers and high contrast read it) */
  globalThis.chartTxt = (txt, quiet) => `<span class="chart-txt${quiet ? ' quiet' : ''}" data-chart-alt>${esc(txt)}</span>`;   // quiet: for screen readers, shown in high contrast

  /* ---------- FR-215: keyboard-shortcut list (also holds the FR-219 display switches) ---------- */
  const KEYS = () => [
    [['?'], LT('a11y.open_this_list')],
    [['/'], LT('a11y.jump_to_search')],
    [['Esc'], LT('a11y.close_a_dialog_card_or_menu_focus_re')],
    [['Tab', 'Shift+Tab'], LT('a11y.next_previous_control_inside_an_open')],
    [['Enter', LT('a11y.space')], LT('a11y.activate_a_link_tab_or_table_row')],
    [['Alt+1…9'], LT('a11y.menu_item_1_9')],
    [['[', ']'], LT('a11y.previous_next_tab_of_the_screen')],
    [['Alt+Shift+C'], LT('a11y.high_contrast_on_off')],
    [['Alt+Shift+M'], LT('a11y.reduced_motion_on_off')],
  ];
  globalThis.A11Y_KEYS = KEYS;
  const kbdLabel = () => LT('a11y.keyboard_and_display');
  globalThis.a11ySideLink = () => `<a class="side-link" data-act="kbdOpen" role="button" tabindex="0" aria-haspopup="dialog" aria-keyshortcuts="Shift+?">${ic('cog', 14)}<span>${esc(kbdLabel())}</span></a>`;
  const opt = (id, act, on, label, hint) => `<label class="a11y-opt" for="${id}"><input type="checkbox" id="${id}" data-act="${act}"${on ? ' checked' : ''}><span><b>${esc(label)}</b><small>${esc(hint)}</small></span></label>`;
  globalThis.a11yOverlay = () => !S.kbd ? '' : `<div class="a11y-back" data-act="kbdClose"></div><div class="a11y-dlg" role="dialog" aria-modal="true" aria-labelledby="a11y-h" tabindex="-1" data-a11y-dlg><div class="drawer-head"><h2 id="a11y-h">${esc(kbdLabel())}</h2><button type="button" class="x" data-act="kbdClose" aria-label="${esc(LT('a11y.close'))}">${ic('x', 18)}</button></div>
<div class="a11y-body"><h3>${esc(LT('a11y.keyboard_shortcuts'))}</h3><table class="table kbd-tbl" data-kbd-list><thead><tr><th scope="col">${esc(LT('a11y.keys'))}</th><th scope="col">${esc(LT('a11y.action'))}</th></tr></thead><tbody>${KEYS().map(k => `<tr><td>${k[0].map(x => `<kbd>${esc(x)}</kbd>`).join(' ')}</td><td>${esc(k[1])}</td></tr>`).join('')}</tbody></table>
<h3>${esc(LT('a11y.display'))}</h3>${opt('a11y_hc', 'a11yHc', S.a11y.hc, LT('a11y.high_contrast'), LT('a11y.dark_text_clear_borders_underlined_l'))}${opt('a11y_rm', 'a11yRm', S.a11y.rm, LT('a11y.reduced_motion'), LT('a11y.no_transitions_pulsing_or_auto_playi'))}
<p class="note">${esc(LT('a11y.every_chart_is_also_available_as_a_t'))}</p></div></div>`;
  const setPref = (k, v) => { S.a11y[k] = v; savePrefs(); applyPrefs(); render(); };
  Object.assign(ACT, {
    kbdOpen: () => { S.kbd = true; S.tbMore = false; render(); },
    kbdClose: () => { S.kbd = false; render(); },
    a11yHc: (d, el) => setPref('hc', el && el.type === 'checkbox' ? el.checked : !S.a11y.hc),
    a11yRm: (d, el) => setPref('rm', el && el.type === 'checkbox' ? el.checked : !S.a11y.rm),
  });

  /* ---------- FR-215: focus memory — which control opened a drawer / dialog, so Esc or ✕ can give focus back ---------- */
  const SIGK = ['v', 'id', 's', 'k', 'i', 't', 'p'];
  const sigOf = el => {
    const t = el && el.closest && el.closest('[data-act],button,a[href],input,select,textarea,[tabindex]'); if (!t || t === document.body) return null;
    const s = { el: t.id || '', act: (t.dataset && t.dataset.act) || '', d: {} }; SIGK.forEach(k => { if (t.dataset && t.dataset[k] != null) s.d[k] = t.dataset[k]; }); return s.el || s.act ? s : null;
  };
  const findSig = s => {
    if (!s) return null; if (s.el) { const e = document.getElementById(s.el); if (e) return e; } if (!s.act) return null;
    const q = `[data-act="${CSS.escape(s.act)}"]` + Object.keys(s.d).map(k => `[data-${k}="${CSS.escape(s.d[k])}"]`).join('');
    return $(q);
  };
  const FOC = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';
  const shown = e => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
  const focusables = box => $$(FOC, box).filter(e => shown(e) && !e.closest('[inert],[aria-hidden="true"]'));
  globalThis.a11yFocusables = focusables;
  const focusEl = e => { if (!e) return false; if (!e.matches(FOC) && !e.hasAttribute('tabindex')) e.setAttribute('tabindex', '-1'); try { e.focus({ preventScroll: true }); } catch (_) { e.focus(); } return document.activeElement === e; };
  const topBox = () => $('[data-a11y-dlg]') || $('.login-layer') || $('.drawer.open');
  let last = null;   // signature of the control the user last pressed
  document.addEventListener('click', e => { last = sigOf(e.target); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') last = sigOf(e.target); }, true);
  const A = { drawer: null, kbd: false, dSig: null, kSig: null, dRoute: null };
  globalThis.a11yFocusState = () => ({ dSig: A.dSig, kSig: A.kSig });

  /* ---------- FR-218: the a11y pass after every render (names, tab stops, roles) ---------- */
  const txt = s => String(s || '').replace(/\s+/g, ' ').trim();
  const hasName = el => el.hasAttribute('aria-label') || el.hasAttribute('aria-labelledby') || (el.title && el.title.trim()) || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`)) || (el.closest('label') && txt(el.closest('label').textContent.replace(el.tagName === 'SELECT' ? el.textContent : '', '')));
  const ownText = (box, stop) => { let s = ''; for (const n of box.childNodes) { if (n === stop) break; if (n.nodeType === 3) s += n.textContent + ' '; else if (n.nodeType === 1 && !n.matches('input,select,textarea,button,svg,script,style') && !n.querySelector('input,select,textarea')) s += n.textContent + ' '; } return txt(s); };
  const colHead = el => { const td = el.closest('td'); if (!td) return ''; const tbl = td.closest('table'), th = tbl && tbl.tHead && tbl.tHead.rows[0] && tbl.tHead.rows[0].cells[td.cellIndex]; return th ? txt(th.textContent) : ''; };
  const nameFor = el => {
    let n = ownText(el.parentElement, el);
    if (!n && el.parentElement && el.parentElement.parentElement && !el.parentElement.matches('td,.card,.card-body')) n = ownText(el.parentElement.parentElement, el.parentElement);
    if (!n) n = colHead(el);
    if (!n) n = txt(el.getAttribute('placeholder'));
    if (!n && el.tagName === 'SELECT' && el.options.length) n = txt(el.options[0].textContent);
    if (!n) { const row = el.closest('tr,.tinted-row,.cfg-row,.row,li'); if (row) n = txt(row.textContent).slice(0, 80); }
    return (n || LT('a11y.field')).replace(/[:：]\s*$/, '').slice(0, 90);
  };
  const NATIVE = /^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY|OPTION|LABEL)$/;
  function a11yPass() {
    const root = $('#root'); if (!root) return;
    /* 1. form fields without a name get one from the visible text next to them (label, column header, placeholder) */
    $$('select, textarea, input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset])', root).forEach(el => {
      if (el.closest('[aria-hidden="true"]') || hasName(el)) return;
      el.setAttribute('aria-label', nameFor(el));
    });
    /* 2. toggles (role=switch / checkbox) without text: name from their row */
    $$('[role=switch],[role=checkbox]', root).forEach(el => { if (!txt(el.textContent) && !el.hasAttribute('aria-label') && !el.hasAttribute('aria-labelledby')) { const row = el.closest('tr,.cfg-row,.row,label,li,div'); el.setAttribute('aria-label', txt(row ? row.textContent : '').slice(0, 90) || LT('a11y.switch')); } });
    /* 3. every data-act control is reachable with Tab; plain spans / divs act as buttons (Enter / Space: help/00-framework.js) */
    $$('[data-act]', root).forEach(el => {
      if (NATIVE.test(el.tagName) || el.hasAttribute('tabindex') || el.matches('.side-back,.a11y-back,.login-layer,.diag-back') || el.closest('[aria-hidden="true"]')) return;
      el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role') && !/^(TR|TD|TH|LI|SVG|G|svg|g|circle|rect|path|text)$/.test(el.tagName) && !el.querySelector('a[href],button,input,select,textarea,[data-act]')) el.setAttribute('role', 'button');
    });
    /* 4. aria-pressed / aria-label on an element without a role is not allowed: such pills are toggle buttons */
    $$('span[aria-pressed]:not([role]),div[aria-pressed]:not([role])', root).forEach(el => { el.setAttribute('role', 'button'); $$('input[type=checkbox]', el).forEach(c => { c.setAttribute('aria-hidden', 'true'); c.tabIndex = -1; }); });
    $$('div.progress[aria-label]:not([role])', root).forEach(el => { const w = parseFloat((el.firstElementChild && el.firstElementChild.style.width) || el.getAttribute('aria-label')) || 0; el.setAttribute('role', 'progressbar'); el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100'); el.setAttribute('aria-valuenow', String(Math.round(w))); });
    /* 5. regions that scroll get a tab stop so keyboard users can scroll them (WCAG 2.1.1, axe scrollable-region-focusable) */
    const all = $$('div,section,aside,ul,table,pre', root);
    for (const el of all) {
      if (el.hasAttribute('tabindex') || !(el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)) continue;
      const cs = getComputedStyle(el), ox = cs.overflowX, oy = cs.overflowY;
      if (!/(auto|scroll)/.test(ox + oy)) continue;
      if (el.querySelector(FOC)) continue;
      el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) { const h = el.querySelector('h2,h3,h4,caption,th') || (el.parentElement && el.parentElement.querySelector('h2,h3,h4')); el.setAttribute('role', 'region'); el.setAttribute('aria-label', txt(h ? h.textContent : '').slice(0, 80) || LT('a11y.scrollable_area')); }
    }
    /* 6. charts: an svg with role=img needs a name (axe svg-img-alt) */
    $$('svg[role=img]:not([aria-label]):not([aria-labelledby])', root).forEach(el => { const t = el.querySelector('title'); if (!t) el.setAttribute('aria-label', LT('a11y.chart')); });
  }
  globalThis.a11yPass = a11yPass;

  /* ---------- render wrapper: preferences, the a11y pass, focus into an opened dialog and back to its trigger.
     app.js installs it last (a11yInstall), so it wraps every other render hook (shell, driver app, help) ---------- */
  globalThis.a11yInstall = () => { const render0 = render; render = function () {
    const before = sigOf(document.activeElement), had = document.activeElement && document.activeElement !== document.body;
    render0();
    applyPrefs();
    try { a11yPass(); } catch (e) { console.error(e); }
    const box = topBox(), ae = document.activeElement;
    if (S.kbd && !A.kbd) { A.kSig = last; const d = $('[data-a11y-dlg]'); focusEl((d && focusables(d)[0]) || d); }
    else if (!S.kbd && A.kbd) focusEl(findSig(A.kSig) || (S.drawer && $('.drawer.open')));
    else if (S.drawer && !A.drawer) { A.dSig = last; A.dRoute = S.route; const d = $('.drawer.open'); focusEl((d && $('.drawer-tabs [data-act], input, select, textarea', d)) || d); }
    else if (!S.drawer && A.drawer) { if (S.route === A.dRoute) focusEl(findSig(A.dSig)); }
    else if (had && (!ae || ae === document.body)) { const e = findSig(before); if (e && (!box || box.contains(e))) focusEl(e); else if (box) focusEl(box); }
    A.drawer = S.drawer; A.kbd = S.kbd;
  }; };

  /* ---------- keyboard: focus trap (Tab), shortcuts ---------- */
  const typing = t => t && (t.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName));
  document.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      const box = topBox(); if (!box) return;
      const f = focusables(box), a = document.activeElement;
      if (!f.length) { e.preventDefault(); focusEl(box); return; }
      const first = f[0], lastF = f[f.length - 1];
      if (!box.contains(a)) { e.preventDefault(); focusEl(e.shiftKey ? lastF : first); }
      else if (e.shiftKey && (a === first || a === box)) { e.preventDefault(); focusEl(lastF); }
      else if (!e.shiftKey && a === lastF) { e.preventDefault(); focusEl(first); }
      return;
    }
    if (e.altKey && e.shiftKey && !e.ctrlKey && (e.code === 'KeyC' || e.code === 'KeyM')) { e.preventDefault(); return e.code === 'KeyC' ? setPref('hc', !S.a11y.hc) : setPref('rm', !S.a11y.rm); }
    if (e.altKey && !e.shiftKey && !e.ctrlKey && /^Digit[1-9]$/.test(e.code)) { const n = navItems()[+e.code.slice(5) - 1]; if (n) { e.preventDefault(); go(n[0]); const m = $('#main-content'); if (m) focusEl(m); } return; }
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e.target) || (typeof HELP !== 'undefined' && HELP.tour)) return;
    if (e.key === '?') { e.preventDefault(); S.kbd ? ACT.kbdClose() : ACT.kbdOpen(); }
    else if (e.key === '/' && !S.kbd && !S.drawer) { const g = $('#gsearch'); if (g) { e.preventDefault(); g.focus(); } else if (ACT.gsTog) { e.preventDefault(); ACT.gsTog(); } }
    else if ((e.key === '[' || e.key === ']') && !S.kbd && !S.drawer) { const ts = tabsOf(S.route), c = curTab(S.route); if (ts.length > 1) { e.preventDefault(); const i = (ts.indexOf(c) + (e.key === ']' ? 1 : ts.length - 1)) % ts.length; setTab(S.route, ts[i].key); const t = $(`.pill-tab[data-v="${CSS.escape(ts[i].key)}"]`); if (t) focusEl(t); } }
  });
})();
