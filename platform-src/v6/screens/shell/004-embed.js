/* Embed mode (?embed=customer): the customer portal inside an iframe of the marketing site. Starts in the customer role on its home screen, hides the
   operator chrome (top bar tools, role switch, portal links, sign-out) through html[data-embed], marks the data as a simulation and tells the host page
   to close on Escape (postMessage 'kz-embed'). The host picks the language by the bundle it loads (index = ru, en, de, kk).
   The marketing site is public Kökzhol material, where the names of the group companies must not appear: the embed forces the Kökzhol design,
   hides the design switch and rewrites every visible client / company name (text, tooltips, labels, field values, the tab title, downloads) to a
   neutral placeholder, e.g. "KDL Olymp branch · Almaty" -> "Client · Almaty". The check is tests/j0-embed.js + tools/ci/check-embed-names.cjs. */
(() => {
  const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : ''), mode = q.get('embed');
  if (mode !== 'customer') return;
  globalThis.EMBED = mode;
  document.documentElement.dataset.embed = mode;
  /* ---- the Kökzhol design only: S.design reads 'kokzhol' whatever the prefs, the stored choice or ?brand= say, and the switch does nothing ---- */
  try { Object.defineProperty(S, 'design', { get: () => 'kokzhol', set: () => {}, configurable: true, enumerable: true }); } catch (_) { S.design = 'kokzhol'; }
  document.documentElement.dataset.design = 'kokzhol';
  const setDesign0 = ACT.setDesign;
  ACT.setDesign = () => { document.documentElement.dataset.design = 'kokzhol'; };
  ACT.setDesign.embedOff = setDesign0;
  /* ---- neutral names: ordered rules per language (specific phrases first), then the fallbacks for every language ---- */
  const BANNED = /olymp|kombimed|олимп/i;
  const RULES = {
    en: [[/\bthe KDL Olymp branch\b/g, 'the client'], [/KDL Olymp branch/g, 'Client'], [/\bown KDL Olymp goods\b/g, "the client's own goods"],
      [/\b(for|to|from|of|and) KDL Olymp\b/g, '$1 the client'], [/KDL Olymp management/g, 'Client management'], [/Olymp Logistic LLP/g, 'Kökzhol'],
      [/KDL Olymp/g, 'Client']],
    ru: [[/Филиал KDL Olymp/g, 'Клиент'], [/филиал KDL Olymp/g, 'клиент'], [/собственный товар KDL Olymp/g, 'собственный товар клиента'],
      [/(для|в|от|и) KDL Olymp/g, '$1 клиента'], [/ТОО «Olymp Logistic»/g, 'Kökzhol'], [/KDL Olymp/g, 'Клиент']],
    de: [[/Filiale KDL Olymp/g, 'Kunde'], [/eigene Ware KDL Olymp/g, 'eigene Ware des Kunden'], [/\bfür KDL Olymp\b/g, 'für den Kunden'],
      [/\b(an die Disposition und) KDL Olymp\b/g, '$1 den Kunden'], [/TOO „Olymp Logistic“/g, 'Kökzhol'], [/KDL Olymp/g, 'Kunde']],
    kk: [[/KDL Olymp филиалы/g, 'Клиент'], [/KDL Olymp өз тауары/g, 'клиенттің өз тауары'], [/KDL Olymp-(қа|ке|ға|ге)/g, 'клиентке'],
      [/KDL Olymp үшін/g, 'клиент үшін'], [/«Olymp Logistic» ЖШС/g, 'Kökzhol'], [/KDL Olymp/g, 'Клиент']],
  };
  const ALL = [[/Olymp\s*(↔|→|\/)\s*Kökzhol|Kökzhol\s*(↔|→|\/)\s*Olymp/g, 'Kökzhol'], [/KombiMED(\s+GmbH)?/gi, 'Kökzhol'], [/Olymp Logistic/gi, 'Kökzhol'],
    [/олимп/gi, 'Көкжол'], [/olymp/gi, 'Kökzhol']];
  const rules = [...(RULES[typeof LANG === 'string' ? LANG : 'en'] || RULES.en), ...ALL];
  const scrub = s => { if (typeof s !== 'string' || !BANNED.test(s)) return s; for (const [re, to] of rules) s = s.replace(re, to); return s; };
  globalThis.embedScrub = scrub;
  /* the DOM pass: text nodes, the attributes a person sees or hears, and field values; a MutationObserver runs it before the next paint */
  const ATTRS = ['title', 'aria-label', 'aria-description', 'aria-valuetext', 'placeholder', 'alt', 'value', 'label', 'data-tip', 'data-tooltip', 'data-label'];
  const fixEl = el => {
    for (const a of ATTRS) { const v = el.getAttribute(a); if (v != null) { const w = scrub(v); if (w !== v) el.setAttribute(a, w); } }
    if ((el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') && typeof el.value === 'string') { const w = scrub(el.value); if (w !== el.value) el.value = w; }
  };
  /* code and style text is not shown: left alone (the bundle's own scripts sit in the page) */
  const CODE = /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/;
  const inCode = n => { const p = n.nodeType === 3 ? n.parentNode : n; return !!(p && p.nodeType === 1 && CODE.test(p.tagName)); };
  const fixText = t => { if (inCode(t)) return; const w = scrub(t.nodeValue); if (w !== t.nodeValue) t.nodeValue = w; };
  const walker = root => document.createTreeWalker(root, 1 | 4, { acceptNode: n => (n.nodeType === 1 && CODE.test(n.tagName) ? 2 : 1) });
  const fix = root => {
    if (!root) return;
    if (root.nodeType === 3) return fixText(root);
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (CODE.test(root.tagName)) return; fixEl(root); }
    if (!BANNED.test(root.textContent || '') && !(root.querySelector && root.querySelector('[title],[aria-label],[placeholder],[alt],[value],[label],input,textarea,[data-tip],[data-tooltip],[data-label],[aria-description],[aria-valuetext]'))) return;
    const tw = walker(root);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) (n.nodeType === 3 ? fixText(n) : fixEl(n));
  };
  globalThis.embedScrubDom = fix;
  const mo = new MutationObserver(list => {
    for (const m of list) {
      if (m.type === 'characterData') fixText(m.target);
      else if (m.type === 'attributes') fixEl(m.target);
      else m.addedNodes.forEach(fix);
    }
  });
  mo.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  fix(document.documentElement);
  /* typed-in field values are set as a property (no mutation): clean them on focus-out and before the host reads the page */
  document.addEventListener('input', e => { const t = e.target; if (t && BANNED.test(t.value || '')) fixEl(t); }, true);
  /* downloads made in the portal (CSV, print text) go through Blob: their text parts are cleaned too */
  if (typeof Blob === 'function') {
    const B = Blob;
    globalThis.Blob = class extends B { constructor(parts, opts) { super(Array.isArray(parts) ? parts.map(p => (typeof p === 'string' ? scrub(p) : p)) : parts, opts); } };
  }
  /* self-check (tests/j0-embed.js, tools/ci/check-embed-names.cjs): walks every screen the embedded customer can reach, its tabs and the drawers /
     documents its buttons open, and returns each visible text, tooltip, label or field value that still carries a banned name */
  globalThis.embedAudit = async (opts = {}) => {
    const found = [], wait = () => new Promise(r => setTimeout(r, opts.wait || 40)), max = opts.maxClicks || 40;
    /* visibility from the computed style of the element and its ancestors, not from layout: a test frame that is not painted still answers */
    let memo = new Map();
    const shown = el => {
      if (!el || el.nodeType !== 1) return true;
      if (memo.has(el)) return memo.get(el);
      const cs = getComputedStyle(el);
      const v = !CODE.test(el.tagName) && !el.hidden && cs.display !== 'none' && cs.visibility !== 'hidden' && cs.contentVisibility !== 'hidden' && shown(el.parentElement);
      memo.set(el, v); return v;
    };
    const hit = (where, kind, s) => { if (typeof s === 'string' && BANNED.test(s)) { const i = s.search(BANNED); found.push(`${where} · ${kind}: …${s.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, ' ')}…`); } };
    const scan = where => {
      memo = new Map(); hit(where, 'tab title', document.title);
      const tw = document.createTreeWalker(document.body, 4);
      for (let t = tw.nextNode(); t; t = tw.nextNode()) if (BANNED.test(t.nodeValue) && shown(t.parentElement)) hit(where, 'text', t.nodeValue);
      document.querySelectorAll('body *').forEach(el => {
        if (!shown(el)) return;
        for (const a of ATTRS) hit(where, a, el.getAttribute(a));
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') hit(where, 'field', el.value);
        if (el.tagName === 'SELECT') [...el.options].forEach(o => hit(where, 'option', o.text));
      });
    };
    const SKIP = /del|cancel|reset|send|sign|setRole|setDesign|print|lang|undo|logout/i;
    const routes = [...new Set([homeRoute(), ...navItems().map(n => n[0]), 'track', 'request'])].filter(r => canSee(r) && (SCREENS[r] || r === homeRoute()));
    const open0 = window.open, print0 = window.print; window.open = () => null; window.print = () => {};
    for (const r of routes) {
      go(r); await wait(); scan(r);
      for (const t of tabsOf(r)) { S.tab[r] = t.key; render(); await wait(); scan(`${r}/${t.key}`); }
      const seen = new Set(), keyOf = e => [e.dataset.act, e.dataset.v || '', e.dataset.id || ''].join('|');
      for (let n = 0; n < max; n++) {
        const next = [...document.querySelectorAll('main [data-act], .drawer [data-act]')].find(e => !SKIP.test(e.dataset.act) && e.dataset.act !== 'go' && !seen.has(keyOf(e)) && shown(e));
        if (!next) break;
        const k = keyOf(next); seen.add(k);
        try { next.click(); } catch (_) { /* a demo action that throws is not this check's business */ }
        await wait(); scan(`${r} → ${k}`);
        if (S.route !== r) { go(r); await wait(); }
      }
      S.drawer = null; S.diag = null; render();
    }
    window.open = open0; window.print = print0;
    go(homeRoute()); await wait();
    return found;
  };
  const host = () => { try { if (window.parent === window) return null; return (location.ancestorOrigins && location.ancestorOrigins[0]) || (document.referrer ? new URL(document.referrer).origin : '*'); } catch (_) { return '*'; } };
  const tell = action => { const o = host(); if (o) try { window.parent.postMessage({ type: 'kz-embed', action }, o); } catch (_) { /* detached */ } };
  const open = () => !!(S.drawer || S.diag || S.sideOpen || S.kbd || S.tbMore);
  /* capture phase: the shell's own Escape handler closes a drawer first, so the state is read before it runs */
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !open()) tell('close'); }, true);
  const shellOverlays0 = globalThis.shellOverlays;
  globalThis.shellOverlays = () => (shellOverlays0 ? shellOverlays0() : '') + `<div class="embed-demo" role="note" data-test="embed-demo">${esc(LT('shell.embed_demo'))}</div>`;
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.dataset.design = 'kokzhol';
    if (S.role !== 'customer') ACT.setRole({ v: 'customer' });
    if (S.route === 'forbidden' || !canSee(S.route)) go(homeRoute());
    fix(document.documentElement);
    document.title = scrub(document.title);
    tell('ready');
  });
})();
