/* R02 / FR-192 · runtime of the split build (platform/split/<lang>/). Written first into core.js; the manifest below is filled by tools-build/split-build.mjs.
   A menu area whose files nothing else depends on lives in its own file area-<id>.js. Its route is a STUB in SCREENS until the chunk is loaded: the first draw of the
   screen asks for the chunk (once), shows KIT.state('loading'), and redraws when the chunk has run. A chunk that does not load shows KIT.state('error') with "Try again"
   (ACT.retry -> RETRY['chunk:<id>']); everything else keeps working. The single-file pages platform/{index,de,en,kk}.html do not contain this file. */
const SPLIT = (function () {
  const M = /*@@SPLIT@@*/ { chunks: {}, routeChunk: {} }; // chunks: id -> { file, v, routes[] }; routeChunk: route -> id
  const st = { loaded: {}, loading: {}, failed: {}, late: {}, booted: false };
  /* DOMContentLoaded handlers registered by a split script wait for boot() / the end of their chunk: the browser event has long been fired when a chunk arrives */
  const docAdd = document.addEventListener,
    winAdd = window.addEventListener;
  const part = () => {
    const cs = document.currentScript;
    return cs && cs.dataset && cs.dataset.split ? cs.dataset.split : null;
  };
  document.addEventListener = function (type, fn, opt) {
    const id = type === 'DOMContentLoaded' ? part() : null;
    if (id && (id !== 'core' || !st.booted)) {
      (st.late[id] = st.late[id] || []).push(fn);
      return;
    }
    return docAdd.call(this, type, fn, opt);
  };
  window.addEventListener = function (type, fn, opt) {
    const id = type === 'load' ? part() : null;
    if (id && id !== 'core' && document.readyState === 'complete') {
      setTimeout(fn, 0);
      return;
    } // a chunk comes after the page "load" event
    return winAdd.call(this, type, fn, opt);
  };
  const runLate = id => {
    const l = st.late[id] || [];
    st.late[id] = [];
    l.forEach(f => {
      try {
        f.call(document, new Event('DOMContentLoaded'));
      } catch (e) {
        console.error(e);
      }
    });
  };
  const stubs = () => Object.keys(M.routeChunk).filter(r => SCREENS[r] && SCREENS[r].__stub);
  function load(id, o) {
    if (st.loaded[id]) return Promise.resolve();
    if (st.loading[id]) return st.loading[id];
    delete st.failed[id];
    const c = M.chunks[id];
    const p = new Promise((ok, no) => {
      if (!c) return no(new Error('unknown chunk ' + id));
      const s = document.createElement('script');
      s.src = c.file + '?nosw&v=' + c.v; // nosw: the service worker (offline demo) leaves chunk requests alone, a stale chunk can never meet a new core
      s.async = false;
      s.dataset.split = id;
      s.onload = () => {
        if (c.routes.some(r => SCREENS[r] && SCREENS[r].__stub)) return no(new Error('chunk ' + id + ' ran but did not define its screens'));
        try {
          bindActions();
        } catch (e) {
          return no(e);
        } // the actions the chunk registered get their audit / undo wrappers
        if (!(o && o.defer)) runLate(id);
        ok();
      };
      s.onerror = () => {
        s.remove();
        no(new Error('chunk ' + id + ' did not load'));
      };
      document.head.appendChild(s);
    }).then(
      () => {
        st.loaded[id] = true;
        delete st.loading[id];
      },
      err => {
        delete st.loading[id];
        st.failed[id] = err;
        throw err;
      },
    );
    st.loading[id] = p;
    return p;
  }
  /* a stub screen: the draw that needs the chunk starts the load once; a failed chunk is an error state with "Try again" */
  const ask = id => {
    if (st.loaded[id] || st.loading[id]) return;
    load(id).then(
      () => {
        try {
          PREFS.restore();
        } catch (_) {
          /* no memory */
        }
        render();
      },
      () => {
        render();
      },
    );
  };
  const stub = (route, id) => ({
    __stub: true,
    title: () => (NAV.find(n => n[0] === route) || [])[2] || route,
    sub: () => '',
    actions: () => '',
    body: () => {
      if (st.failed[id]) return KIT.state('error', { action: { label: LT('state.retry'), act: 'retry', v: 'chunk:' + id } });
      ask(id);
      return KIT.state('loading');
    },
  });
  /* after the last core file: a stub for every route that lives in a chunk, the "Try again" handler of every chunk */
  function install() {
    Object.keys(M.routeChunk).forEach(r => {
      if (!SCREENS[r]) SCREENS[r] = stub(r, M.routeChunk[r]);
    });
    Object.keys(M.chunks).forEach(id => {
      RETRY['chunk:' + id] = () => {
        delete st.failed[id];
        render();
      };
    });
  }
  /* the routes the first draw may need: the stored route, the home route, the screen named by the address (deep links) */
  function firstRoutes() {
    const out = [];
    try {
      out.push(S.route, homeRoute());
    } catch (_) {
      /* no role yet */
    }
    try {
      const j = JSON.parse(sessionStorage.getItem('olymp.state') || 'null');
      if (j && j.route) out.push(j.route);
    } catch (_) {
      /* no stored state */
    }
    try {
      const sp = new URLSearchParams(location.search),
        by = {
          load: 'orders',
          trip: 'orders',
          order: 'orders',
          booking: 'orders',
          item: 'orders',
          alarm: 'dashboard',
          dev: 'pod',
          fine: 'reports',
          veh: 'routes',
          city: 'routes',
        };
      if (sp.get('s')) out.push(sp.get('s'));
      Object.keys(by).forEach(k => {
        if (sp.has(k)) out.push(by[k]);
      });
      if (sp.has('booking')) out.push('mybookings');
      const r = /^(trip|order|booking|alarm|deviation|help):/.exec(sp.get('r') || '');
      if (r) out.push({ trip: 'orders', order: 'orders', booking: 'orders', alarm: 'dashboard', deviation: 'pod', help: 'help' }[r[1]]);
    } catch (_) {
      /* no location */
    }
    return out;
  }
  /* start: load the chunks of the first screen, then run what app.js does at the end of the single-file page and the DOMContentLoaded handlers, in that order */
  function boot(app) {
    const ids = [
      ...new Set(
        firstRoutes()
          .map(r => (Object.hasOwn(M.routeChunk, r) ? M.routeChunk[r] : null))
          .filter(Boolean),
      ),
    ];
    return Promise.all(ids.map(id => load(id, { defer: true }).catch(() => null))).then(() => {
      st.booted = true;
      app();
      runLate('core');
      ids.forEach(id => {
        if (st.loaded[id]) runLate(id);
      });
      return ids;
    });
  }
  return { manifest: M, state: st, load, boot, install, stub, chunkOf: r => (Object.hasOwn(M.routeChunk, r) ? M.routeChunk[r] : null), isLoaded: id => !!st.loaded[id], stubs };
})();
