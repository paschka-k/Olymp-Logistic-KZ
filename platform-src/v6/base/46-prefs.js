/* FR-212 (R08) · PREFS.get/set over localStorage 'kokzhol.v6.prefs' (try/catch, damaged JSON ignored). Off in test frames (self !== top) and with ?nopref=1; 'kz-r4-views' is guarded the same way. PREFS.attach(store) is the test seam. */
const PREFS = (() => {
  const KEY = 'kokzhol.v6.prefs', VIEWS = 'kz-r4-views', LANGS_OK = ['ru', 'de', 'en', 'kk'];
  const allowed = () => { try { return self === top && !/[?&]nopref=1\b/.test(location.search); } catch (_) { return false; } };
  let store = null;
  try { store = allowed() ? localStorage : null; } catch (_) { store = null; }
  /* the guard of 'kz-r4-views': where preferences are off, the key lives in memory of the page (read and write), the shared storage is not touched */
  if (!store) {
    try {
      const mem = {}, SP = Storage.prototype, g = SP.getItem, s = SP.setItem, r = SP.removeItem;
      SP.getItem = function (k) { return String(k) === VIEWS ? (VIEWS in mem ? mem[VIEWS] : null) : g.call(this, k); };
      SP.setItem = function (k, v) { if (String(k) === VIEWS) mem[VIEWS] = String(v); else s.call(this, k, v); };
      SP.removeItem = function (k) { if (String(k) === VIEWS) delete mem[VIEWS]; else r.call(this, k); };
    } catch (_) { /* no Storage */ }
  }
  const read = () => {
    try { const o = store && JSON.parse(store.getItem(KEY) || 'null'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch (_) { return {}; }
  };
  const P = {
    get enabled() { return !!store; },
    /** the stand-in storage of a test: any object with getItem / setItem / removeItem (null switches the preferences off) */
    attach(st) { store = st || null; },
    get(k, def) { const o = read(); return k in o ? o[k] : def; },
    set(k, v) {
      if (!store) return false;
      try { const o = read(); o[k] = v; store.setItem(KEY, JSON.stringify(o)); return true; } catch (_) { return false; }
    },
    /** forget everything that was remembered (Settings -> "Reset saved preferences"), the saved list views included */
    reset() { try { if (store) { store.removeItem(KEY); store.removeItem(VIEWS); } return true; } catch (_) { return false; } },
    /** the language to open instead of the current one, or null */
    langPick() { const l = P.get('lang', null); return LANGS_OK.includes(l) ? l : null; },
    /** apply the remembered hub filter, last tabs and theme to S; true when something changed (the caller redraws) */
    restore() {
      if (!store) return false;
      let ch = false;
      const hub = P.get('hub', ''), tab = P.get('tab', null), design = P.get('design', null);
      if (hub && typeof hub === 'string' && HUBS[hub] && S.hub !== hub) { S.hub = hub; ch = true; }
      if (tab && typeof tab === 'object' && !Array.isArray(tab)) Object.keys(tab).forEach(id => {
        try { if (SCREENS[id] && tabsOf(id).some(t => t.key === tab[id]) && S.tab[id] !== tab[id]) { S.tab[id] = tab[id]; ch = true; } } catch (_) { /* unknown screen */ }
      });
      if ((design === 'olymp' || design === 'kokzhol') && S.design !== design) { S.design = design; ch = true; }
      if (ch) document.documentElement.dataset.design = S.design;
      return ch;
    },
    /** remember the current hub filter, tabs and theme (only the values that changed are written) */
    capture() {
      if (!store) return;
      const cur = { hub: S.hub || '', tab: S.tab || {}, design: S.design };
      Object.keys(cur).forEach(k => { if (JSON.stringify(P.get(k, undefined)) !== JSON.stringify(cur[k])) P.set(k, cur[k]); });
    },
  };
  return P;
})();
