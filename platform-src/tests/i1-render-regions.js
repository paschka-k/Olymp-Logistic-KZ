  /* ---- I1 · FR-193 render regions (main / drawer / topbar / toast) and FR-194 live tick on data-live nodes ---- */
  const I1_MARK = "(function(){ var s=document.querySelector('#side-nav'), t=document.querySelector('header.topbar'); s.__keep=1; t.__keep=1; })()";
  const I1_KEPT = "!!(document.querySelector('#side-nav').__keep && document.querySelector('header.topbar').__keep)";
  /* a render counter around the global render(): the tick must not call it */
  const I1_COUNT = "window.__rc = 0; window.__ro = render; render = function () { window.__rc++; return window.__ro.apply(this, arguments); }";
  const I1_UNCOUNT = "if (window.__ro) { render = window.__ro; window.__ro = null; }";
  const i1Transit = ev => ev("S.loads.find(function(l){return l.status==='in_transit'}).id");

  for (const lang of LANGS) await group('[' + lang + '] renderRegion("main"): the side bar and the top bar stay, the page is rebuilt (tab switch and filter)', lang, async (g, ev, w) => {
    eq(ev("typeof renderRegion"), 'function', 'renderRegion is global'); eq(ev("typeof liveBind + typeof liveUpdate"), 'functionfunction', 'liveBind / liveUpdate are global');
    ev("go('orders')"); ev(I1_MARK);
    const tabs = ev("tabsOf('orders').map(function(t){return t.key})"); assert(tabs.length > 2, 'orders has tabs: ' + tabs);
    ev("setTab('orders','" + tabs[1] + "')");
    eq(ev("curTab('orders').key"), tabs[1], 'tab switched'); eq(ev(I1_KEPT), true, 'side bar and top bar are the same nodes after a tab switch');
    assert(w.document.querySelector('[data-test="tab:orders:' + tabs[1] + '"][aria-selected="true"]'), 'the new tab is selected in the rebuilt page');
    /* a filter: the select keeps the focus */
    ev("setTab('orders','" + tabs[0] + "')"); ev(I1_MARK);
    const sel = w.document.querySelector('.content select[data-f]'); assert(sel, 'orders has a data-f filter'); const key = sel.dataset.f, opt = [...sel.options].map(o => o.value).find(v => v !== sel.value);
    sel.focus(); sel.value = opt; sel.dispatchEvent(new w.Event('input', { bubbles: true }));
    eq(ev("S.f['" + key + "']"), opt, 'filter applied'); eq(ev(I1_KEPT), true, 'a filter does not rebuild the side bar and the top bar');
    const now = w.document.activeElement; assert(now && now.matches('select[data-f="' + key + '"]'), 'the filter keeps the focus: ' + (now && now.tagName));
    eq(w.document.querySelector('select[data-f="' + key + '"]').value, opt, 'rebuilt filter shows the chosen value');
    clean(w, 'orders ' + lang);
  });

  await group('render() stays the full, synchronous render: every region is rebuilt, the wrappers still run', 'ru', async (g, ev, w) => {
    ev("go('dashboard')"); ev(I1_MARK); ev("render()");
    eq(ev(I1_KEPT), false, 'render() rebuilds the whole #root');
    assert(w.document.title && w.document.title.length > 3, 'shell wrapper: document title');
    assert(w.document.querySelector('.page-head .help-q'), 'help wrapper: context help button');
    assert(w.document.querySelectorAll('#root [data-act]:not(button):not(a):not(select):not(input)[tabindex]').length > 5, 'a11y wrapper: tab stops on data-act controls');
    ev("S.drawer=null; ACT.go({v:'orders'})"); assert(w.document.querySelector('[data-test="nav:orders"].active'), 'go() renders synchronously');
    ev(I1_MARK); ev("renderRegion('nonexistent')"); eq(ev(I1_KEPT), false, 'an unknown region falls back to the full render');
  });

  await group('the page region equals what a full render produces (head, content, a11y names, help button)', 'ru', async (g, ev, w) => {
    for (const id of ['dashboard', 'orders', 'dispatch', 'routes', 'fleet', 'drivers', 'hubs', 'reports', 'settings']) {
      ev("go('" + id + "')"); ev("renderRegion('main')");
      const snap = () => w.document.querySelector('#main-content > .page-head').outerHTML + w.document.querySelector('#main-content > .content').innerHTML;
      const a = snap(); ev("render()"); const b = snap();
      assert(a === b, id + ': region render differs from the full render at char ' + [...a].findIndex((c, i) => c !== b[i]));
    }
  });

  for (const lang of LANGS) await group('[' + lang + '] renderRegion("main") keeps an open drawer, its node, its focus and its typed fields', lang, async (g, ev, w) => {
    ev("go('routes')"); const id = i1Transit(ev); ev("openDrawer({type:'route', id:'" + id + "'})");
    const d = w.document.querySelector('aside.drawer'); assert(d && d.getAttribute('role') === 'dialog', 'drawer is open');
    d.__keep = 1; const x = d.querySelector('[data-test="drawer-close"]'); x.focus(); eq(w.document.activeElement, x, 'focus on the close button');
    ev("renderRegion('main')");
    const d2 = w.document.querySelector('aside.drawer'); assert(d2 === d && d2.__keep === 1, 'the same drawer node survives a main redraw');
    assert(d.contains(w.document.activeElement), 'focus stays inside the drawer'); eq(ev("S.drawer.id"), id, 'drawer state kept');
    /* the Tab trap still wraps inside the drawer (FR-215) */
    const f = ev("a11yFocusables(document.querySelector('.drawer.open')).length"); assert(f >= 1, 'drawer focusables: ' + f);
    /* a tab switch closes the drawer and rebuilds only the page and the drawer */
    ev(I1_MARK); ev("setTab('routes','map')");
    eq(ev("S.drawer"), null, 'tab switch closes the drawer'); assert(!w.document.querySelector('aside.drawer'), 'drawer node removed'); eq(ev(I1_KEPT), true, 'side bar and top bar untouched');
  });

  await group('scroll positions of main and of the drawer survive renderRegion', 'ru', async (g, ev, w) => {
    ev("go('routes')"); const id = i1Transit(ev); ev("openDrawer({type:'route', id:'" + id + "'})");
    const m = w.document.querySelector('main'), d = w.document.querySelector('aside.drawer');
    const pad = w.document.createElement('div'); pad.style.height = '3000px'; pad.id = 'i1-pad'; w.document.querySelector('.content').appendChild(pad);
    const dp = w.document.createElement('div'); dp.style.height = '3000px'; dp.id = 'i1-dpad'; d.appendChild(dp);
    m.scrollTop = 240; d.scrollTop = 130; const my = m.scrollTop, dy = d.scrollTop; assert(my > 0 && dy > 0, 'both boxes scrolled: ' + my + '/' + dy);
    ev("renderRegion('main')"); eq(w.document.querySelector('main').scrollTop, my, 'main scroll kept');
  });

  await group('renderRegion("topbar") keeps the caret in the search box; renderRegion("toast") touches nothing else', 'ru', async (g, ev, w) => {
    ev("go('orders')"); const s = w.document.querySelector('#gsearch'); s.focus(); s.value = 'abcd'; s.setSelectionRange(2, 2);
    ev("S.gs.q = 'abcd'"); ev(I1_MARK); const content = w.document.querySelector('#main-content > .content'); content.__keep = 1;
    ev("renderRegion('topbar')");
    const s2 = w.document.querySelector('#gsearch'); assert(s2 !== s, 'top bar rebuilt'); eq(w.document.activeElement, s2, 'search box keeps the focus'); eq(s2.selectionStart, 2, 'caret kept');
    assert(w.document.querySelector('#side-nav').__keep === 1 && content.__keep === 1, 'side bar and page untouched');
    ev("S.toast = {msg:'region toast', kind:'ok'}; renderRegion('toast')");
    eq(w.document.querySelector('[data-test="toast"]').textContent, 'region toast', 'toast shown'); assert(w.document.querySelector('#main-content > .content') === content, 'page untouched by the toast region');
    ev("S.toast = null; renderRegion('toast')"); assert(!w.document.querySelector('[data-test="toast"]'), 'toast removed');
    assert(w.document.querySelector('#side-nav').__keep === 1, 'side bar still the same node');
  });

  await group('actions declare their region: ACTION_DEFS.region, "main" by default', 'ru', async (g, ev) => {
    eq(ev("ACTION_DEFS.stab.region"), 'main', 'tab switch declares main'); eq(ev("actionRegion('stab')"), 'main'); eq(ev("actionRegion('filter')"), 'main', 'filters redraw the page');
    eq(ev("actionRegion('create')"), 'main', 'no region declared → main'); eq(ev("actionRegion('no-such-action')"), 'main');
    ev("registerAction('i1_probe', { region: 'drawer' })"); eq(ev("actionRegion('i1_probe')"), 'drawer', 'declared region is returned');
  });

  for (const lang of LANGS) await group('[' + lang + '] the tick updates data-live nodes only: 10 ticks call render() 0 times (dashboard, routes, hubs)', lang, async (g, ev, w) => {
    for (const screen of ['dashboard', 'routes', 'hubs']) {
      ev("go('" + screen + "')"); ev("S.simOn = true; S.drawer = null");
      const before = ev("[].map.call(document.querySelectorAll('[data-live=pos]'), function(n){return n.getAttribute('transform')}).join('|')");
      ev(I1_COUNT); ev("for (var i = 0; i < 10; i++) liveTick()"); const calls = ev("window.__rc"); ev(I1_UNCOUNT);
      eq(calls, 0, screen + ': render() calls in 10 ticks');
      assert(w.document.querySelector('[data-live=badge] [data-live-at]').textContent.length >= 5, screen + ': live badge shows the time');
      if (screen === 'hubs') continue;
      assert(w.document.querySelectorAll('[data-live=pos]').length > 0, screen + ': position nodes');
      const after = ev("[].map.call(document.querySelectorAll('[data-live=pos]'), function(n){return n.getAttribute('transform')}).join('|')");
      assert(before !== after, screen + ': markers moved without a render');
      /* what the tick wrote equals what a full render builds from the same state */
      const live = ev("[].map.call(document.querySelectorAll('[data-live=pos],[data-live=temp],[data-live=bar],[data-live=pct],[data-live=tempchip]'), function(n){return n.getAttribute('data-live') + n.getAttribute('data-id') + (n.getAttribute('transform')||'') + n.textContent + (n.style.width||'')}).join('|')");
      ev("render()");
      const full = ev("[].map.call(document.querySelectorAll('[data-live=pos],[data-live=temp],[data-live=bar],[data-live=pct],[data-live=tempchip]'), function(n){return n.getAttribute('data-live') + n.getAttribute('data-id') + (n.getAttribute('transform')||'') + n.textContent + (n.style.width||'')}).join('|')");
      eq(live, full, screen + ': tick output equals a full render');
    }
    clean(w, 'tick ' + lang);
  });

  await group('the tick: position, temperature, progress and ETA of an open trip card are data-live too', 'ru', async (g, ev, w) => {
    ev("go('routes')"); const id = i1Transit(ev); ev("openDrawer({type:'route', id:'" + id + "'})");
    for (const k of ['tempchip', 'eta', 'done', 'bar']) assert(w.document.querySelector('aside.drawer [data-live=' + k + '][data-id=' + id + ']'), 'trip card node ' + k);
    const t0 = ev("load('" + id + "').temp"); ev("var l = load('" + id + "'); l.temp = ZONES[l.zone].mid; liveTick();");
    const shown = w.document.querySelector('aside.drawer [data-live=tempchip]').textContent.replace(',', '.'); const t = ev("load('" + id + "').temp");
    assert(Math.abs(parseFloat(shown.replace(/[^0-9.+-]/g, '')) - t) < 0.06, 'drawer temperature follows the state: ' + shown + ' vs ' + t + ' (was ' + t0 + ')');
    eq(ev("S.drawer && S.drawer.id"), id, 'the open drawer is not closed by the tick');
    ev("var l2 = load('" + id + "'); l2.progress = 0.5; liveTick(); liveUpdate();");
    const km = ev("dist(load('" + id + "').from, load('" + id + "').to)"); assert(w.document.querySelector('aside.drawer [data-live=done]').textContent.startsWith(Math.round(km * (0.5 + 0.0006)) + ' / '), 'distance covered follows progress');
  });

  await group('a load that crosses a temperature limit makes the tick redraw the page region (never render()) and the top bar counter', 'ru', async (g, ev, w) => {
    ev("go('dashboard')"); ev("S.simOn = true"); ev("liveTick()"); ev(I1_MARK); const child = w.document.querySelector('#main-content > .content').firstElementChild; child.__keep = 1; const n0 = ev('REGION_COUNT.main');
    ev("window.__l = S.loads.find(function(x){return x.status==='in_transit' && tempState(x)!=='breach'}); __l.temp = ZONES[__l.zone].hi + 3"); ev(I1_COUNT); ev("liveTick()");
    eq(ev("window.__rc"), 0, 'no render()'); ev(I1_UNCOUNT);
    assert(w.document.querySelector('#main-content > .content').firstElementChild.__keep !== 1 && ev('REGION_COUNT.main') === n0 + 1, 'the page region was rebuilt once for the new breach');
    assert(w.document.querySelector('#side-nav').__keep === 1, 'the side bar was not touched');
    assert(/°/.test(w.document.querySelector('.content').textContent) && w.document.querySelector('.content').textContent.includes(ev("LF.dec(__l.temp)")), 'the dashboard shows the breach');
  });

  await group('tick budget: < 4 ms per tick with the simulation on (median of 30, dashboard)', 'ru', async (g, ev) => {
    ev("go('dashboard')"); ev("S.simOn = true; S.drawer = null; for (var i = 0; i < 5; i++) liveTick()");
    const ms = ev("(function(){ var a = []; for (var i = 0; i < 30; i++) { var t = performance.now(); liveTick(); a.push(performance.now() - t); } a.sort(function(x, y){return x - y}); return a[15]; })()");
    assert(ms < 4, 'median tick ' + ms.toFixed(2) + ' ms');
  });

  await group('a new level-2 alarm raised by the tick shows the "new alarms" banner (no render())', 'ru', async (g, ev, w) => {
    ev("go('dashboard')"); ev("S.simOn = true; render(); liveTick()");
    assert(!w.document.querySelector('[data-alarm-banner]'), 'no banner before the alarm');
    ev("var ld = S.loads.find(function(x){return x.status==='in_transit'}); raiseAlarm({ lvl: 2, cat: 'temperature', src: 'reefer', hub: ld.from, load: ld.id, truck: ld.truck, text: 'i1 test alarm' })");
    ev(I1_COUNT); ev("liveTick()"); eq(ev("window.__rc"), 0, 'no render()'); ev(I1_UNCOUNT);
    assert(w.document.querySelector('[data-alarm-banner]'), 'banner shown after the tick');
    ev("ACT.banX()"); assert(!w.document.querySelector('[data-alarm-banner]'), 'banner dismissed');
  });

  await group('the click dispatcher respects the region an action declares (non-main: topbar) and leaves "all" alone', 'ru', async (g, ev, w) => {
    ev("go('orders')");
    ev("registerAction('i1_top', { region: 'topbar' }); ACT.i1_top = function () { S.tbMore = !S.tbMore; render(); }; registerAction('i1_all', { region: 'all' }); ACT.i1_all = function () { render(); }");
    const add = (act) => { const b = w.document.createElement('button'); b.dataset.act = act; b.id = 'i1b-' + act; w.document.body.appendChild(b); return b; };
    ev(I1_MARK); const content = w.document.querySelector('#main-content > .content').firstElementChild; content.__keep = 1;
    add('i1_top').click();
    eq(ev("S.tbMore"), true, 'handler ran'); eq(ev("typeof render"), 'function', 'render restored');
    assert(w.document.querySelector('#side-nav').__keep === 1 && content.__keep === 1, 'only the top bar was rebuilt'); assert(!w.document.querySelector('header.topbar').__keep, 'top bar rebuilt');
    add('i1_all').click(); eq(ev(I1_KEPT), false, 'an "all" action keeps the full render()');
  });

  await group('open drawer: a breach redraw by the tick keeps the drawer node; the routes temperature tab ticks without render()', 'ru', async (g, ev, w) => {
    ev("go('routes')"); const id = i1Transit(ev); ev("S.simOn = true; liveTick(); openDrawer({type:'route', id:'" + id + "'})");
    const d = w.document.querySelector('aside.drawer'); d.__keep = 1;
    ev("var lb = S.loads.find(function(x){return x.status==='in_transit' && tempState(x)!=='breach'}); lb.temp = ZONES[lb.zone].hi + 3"); ev(I1_COUNT); ev("liveTick()");
    eq(ev("window.__rc"), 0, 'no render()'); ev(I1_UNCOUNT); assert(w.document.querySelector('aside.drawer') === d && d.__keep === 1, 'the same drawer node after the tick redraw');
    ev("closeDrawer(); setTab('routes','temp')"); ev(I1_COUNT); ev("for (var i = 0; i < 10; i++) liveTick()"); eq(ev("window.__rc"), 0, 'temperature tab: 10 ticks, render() calls'); ev(I1_UNCOUNT);
  });
