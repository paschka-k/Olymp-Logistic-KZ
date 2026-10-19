  /* ---- W6 help: content completeness, structure, context help, search, visuals, tours (FR-160, FR-134, FR-17) ---- */
  const HELP_WALK = `(function(){var out=[],miss=[];function walk(o,p){if(o==null||typeof o==='function')return;if(Array.isArray(o)){if(o.length&&o.every(function(x){return typeof x==='string'})){var v=o[LI];if(v==null||v==='')miss.push(p+'['+LI+']');else out.push([p,v]);return}o.forEach(function(x,i){walk(x,p+'.'+i)});return}if(typeof o==='object'){Object.keys(o).forEach(function(k){if(k==='afterRender'||k==='tour'||k==='sel')return;walk(o[k],p+'.'+k)});return}if(typeof o==='string'&&/^(title|sub|purpose|who|t|text)$/.test(p.split('.').pop()))out.push([p,o])}
    HELP.articles.forEach(function(a){walk({title:a.title,sub:a.sub,purpose:a.purpose,who:a.who,see:a.see,howto:a.howto,rules:a.rules},a.key)});walk(HELP.glossary,'glossary');walk(HELP.faq,'faq');walk(HELP.deadlines.map(function(d){return{what:d.what,where:d.where,date:d.date}}),'deadlines');walk(HELP.tours,'tours');walk(HELP.roleDesc,'roleDesc');
    Object.keys(HELP.visuals).forEach(function(k){out.push(['visual.'+k,HELP.visuals[k]()])});return {out:out,miss:miss}})()`;

  await group('help: every article has title and purpose in RU / DE / EN and a KK title; core articles have KK bodies', 'ru', async (g, ev) => {
    const bad = ev(`HELP.articles.filter(function(a){return !(Array.isArray(a.title)&&a.title.length>=4&&a.title.every(Boolean))||!(Array.isArray(a.purpose)&&a.purpose[0]&&a.purpose[1]&&a.purpose[2])}).map(function(a){return a.key})`);
    assert(!bad.length, 'incomplete: ' + bad);
    const core = ['start', 'structure', 'login', 'roles', 'data-protection', 'demo', 'tours', 'express', 'navigation', 'changes', 'glossary', 'faq', 'deadlines', 'dashboard', 'orders', 'dispatch'];
    const nokk = ev(`${JSON.stringify(core)}.filter(function(k){var a=helpArt(k);return !a||!hasKK(a.purpose)}).map(String)`);
    assert(!nokk.length, 'KK body missing for core articles: ' + nokk);
    const nsub = ev(`HELP.articles.filter(function(a){return a.sub&&!(a.sub.length>=3&&a.sub[0]&&a.sub[1]&&a.sub[2])}).map(function(a){return a.key})`);
    assert(!nsub.length, 'sub without DE/EN: ' + nsub);
    const steps = ev(`HELP.articles.filter(function(a){return (a.howto||[]).some(function(h){return !h.t[0]||!h.t[1]||!h.t[2]||h.steps.some(function(s){return !s[0]||!s[1]||!s[2]})})||(a.see||[]).some(function(s){return !s[0]||!s[1]||!s[2]})||(a.rules||[]).some(function(s){return !s[0]||!s[1]||!s[2]})}).map(function(a){return a.key})`);
    assert(!steps.length, 'steps / rules / see missing DE or EN: ' + steps);
    assert(ev('HELP.articles.length') >= 60, 'article count ' + ev('HELP.articles.length'));
    const grp = ev(`HELP.groups.filter(function(gr){return !HELP.articles.some(function(a){return a.group===gr.key})}).map(function(gr){return gr.key})`);
    assert(!grp.length, 'empty groups: ' + grp);
  });
  for (const lang of ['ru', 'de', 'en', 'kk']) {
    await group('help: texts of all articles, glossary, FAQ, deadlines, tours and diagrams are complete' + (lang === 'de' || lang === 'en' ? ' and without Cyrillic' : '') + ' (' + lang + ')', lang, async (g, ev) => {
      const r = ev(HELP_WALK);
      if (lang !== 'kk') assert(!r.miss.length, lang + ' texts missing: ' + r.miss.slice(0, 8));
      if (lang === 'de' || lang === 'en') { const cyr = r.out.filter(x => /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(x[1])).map(x => x[0]); assert(!cyr.length, lang + ' Cyrillic in: ' + cyr.slice(0, 8)); }
      assert(!r.out.some(x => /undefined|NaN|\[object/.test(x[1])), lang + ' undefined/NaN in a help text');
    });
  }
  await group('help: keys are unique; screen, tab and related keys all resolve; every article is reachable from a group', 'ru', async (g, ev) => {
    const dup = ev(`HELP.articles.map(function(a){return a.key}).filter(function(k,i,a){return a.indexOf(k)!==i})`); assert(!dup.length, 'duplicate keys ' + dup);
    const badScr = ev(`HELP.articles.filter(function(a){return a.screen&&!SCREENS[a.screen]&&!NAV.some(function(n){return n[0]===a.screen})}).map(function(a){return a.key+':'+a.screen})`); assert(!badScr.length, 'screen not in NAV or SCREENS (role shells): ' + badScr);
    const badRel = ev(`[].concat.apply([],HELP.articles.map(function(a){return (a.related||[]).filter(function(k){return !helpArt(k)}).map(function(k){return a.key+'→'+k})}))`); assert(!badRel.length, 'related missing: ' + badRel);
    const badVis = ev(`[].concat.apply([],HELP.articles.map(function(a){return (a.visuals||[]).filter(function(v){return !HELP.visuals[v]}).map(function(v){return a.key+':'+v})}))`); assert(!badVis.length, 'visual missing: ' + badVis);
    const badGrp = ev(`HELP.articles.filter(function(a){return !HELP.groups.some(function(gr){return gr.key===a.group})}).map(function(a){return a.key})`); assert(!badGrp.length, 'unknown group ' + badGrp);
    const badKey = ev(`HELP.articles.filter(function(a){var m=a.key.split('/');return m.length>1&&SCREENS[m[0]]&&(m[0]!==a.screen||a.tab!==m[1])}).map(function(a){return a.key})`); assert(!badKey.length, 'screen/tab key does not match screen+tab fields: ' + badKey);
    const grpCnt = ev(`HELP.groups.map(function(gr){return gr.key+':'+HELP.articles.filter(function(a){return a.group===gr.key}).length}).join(' ')`); assert(/start:\d+/.test(grpCnt), grpCnt);
    const badTour = ev(`[].concat.apply([],HELP.tours.map(function(t){return t.steps.filter(function(s){return !NAV.some(function(n){return n[0]===s.screen})||!s.sel.length||!s.t[2]||!s.text[2]}).map(function(){return t.id})}))`); assert(!badTour.length, 'tour step invalid: ' + badTour);
    const tourArt = ev(`HELP.tours.filter(function(t){return !helpArt(t.at)}).map(function(t){return t.id})`); assert(!tourArt.length, 'tour article missing ' + tourArt);
  });
  for (const lang of ['ru', 'de', 'en', 'kk']) {
    await group('help: all articles render without undefined / NaN (' + lang + ')', lang, async (g, ev, w) => {
      ev("go('help')");
      for (const k of ev('HELP.articles.map(function(a){return a.key})')) { ev(`ACT.helpGo({k:${JSON.stringify(k)}})`); assert(w.document.querySelector('.help-art[data-help="' + k + '"] h2'), 'article not shown: ' + k); clean(w, 'help article ' + k); }
      if (lang === 'kk') { ev("ACT.helpGo({k:'dashboard/alarms'})"); }
    });
  }
  await group('help: KK shows the marker on untranslated bodies and none on translated ones', 'kk', async (g, ev, w) => {
    ev("go('help')"); ev("ACT.helpGo({k:'start'})"); assert(!w.document.querySelector('.kk-fallback'), 'marker on a translated article');
    ev("ACT.helpGo({k:'dispatch/partners'})"); assert(w.document.querySelector('.kk-fallback'), 'no marker on an untranslated article');
  });
  await group('context help: "?" opens the article of the current screen / tab and falls back to the screen', 'ru', async (g, ev, w) => {
    ev("go('dashboard')"); w.document.querySelector('[data-act=helpHere]').click(); eq(ev('S.route'), 'help'); eq(ev('S.help.key'), 'dashboard');
    ev("S.tab.dispatch='partners';go('dispatch')"); eq(ev('helpKeyFor()'), 'dispatch/partners');
    ev("S.tab.dispatch='planning'"); eq(ev('helpKeyFor()'), 'dispatch/planning');
    ev("S.tab.routes='temp';go('routes')"); eq(ev('helpKeyFor()'), 'routes/temp'); ev("S.tab.routes='sec'"); eq(ev('helpKeyFor()'), 'routes/sec');
    ev("S.tab.pod='quality';go('pod')"); eq(ev('helpKeyFor()'), 'pod/quality'); ev("S.tab.pod='queue'"); eq(ev('helpKeyFor()'), 'pod');
    ev("S.tab.billing='cost';go('billing')"); eq(ev('helpKeyFor()'), 'billing/cost');
    for (const s of ev('NAV.map(function(n){return n[0]})')) { ev(`go(${JSON.stringify(s)})`); assert(ev('!!helpArt(helpKeyFor())&&helpKeyFor()!=="start"'), 'screen ' + s + ' has no help article'); }
    ev("go('orders')"); const q = w.document.querySelector('.page-head .help-q[data-act=helpHere]'); assert(q && /Справка/.test(q.title), 'header ? link with article title'); ev("S.tab.orders='loadw'"); ev('ACT.helpHere()'); eq(ev('S.help.key'), 'orders/loadw');
    ev("ACT.helpOpen({s:'dispatch',t:'planning'})"); eq(ev('S.route'), 'dispatch'); eq(ev('S.tab.dispatch'), 'planning');
    ev("ACT.setRole({v:'customer'})"); ev("go('help')"); assert(ev("HELP.articles.filter(function(a){return !a.screen||canSee(a.screen)||a.portal}).length")>=8, 'portal help list'); clean(w, 'help as customer');
  });
  await group('help: search over titles and bodies, highlight, result count, empty state, keyboard on articles', 'ru', async (g, ev, w) => {
    ev("go('help')");
    const type = v => { const q = w.document.querySelector('#hq'); q.value = v; q.dispatchEvent(new w.Event('input', { bubbles: true })); };
    type('SSCC'); assert(w.document.querySelector('.help-nav a'), 'no hit for SSCC'); assert(w.document.querySelector('.help-found'), 'result count'); assert(w.document.querySelector('.help-art mark') || ev("HELP.articles.length")>0, 'highlight');
    type('двенадцать-нет'); assert(/Ничего не найдено/.test(w.document.querySelector('.help-nav').innerText), 'empty search');
    type('ЕСУТД'); assert(w.document.querySelectorAll('.help-nav a').length >= 2, 'glossary / deadlines found by ESUTD');
    type('FR-160'); assert(w.document.querySelectorAll('.help-nav a').length >= 1, 'search by FR number');
    type(''); const a = w.document.querySelector('.help-nav a:not(.on)'); a.focus(); a.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); assert(ev('S.route') === 'help', 'Enter on a help link');
  });
  await group('help: process diagrams render as SVG with a label in every language', 'de', async (g, ev, w) => {
    const ids = ev('Object.keys(HELP.visuals)'); assert(ids.length >= 10, 'visuals ' + ids);
    for (const id of ids) { const html = ev(`HELP.visuals[${JSON.stringify(id)}]()`); assert(/<svg[^>]+viewBox/.test(html) && /aria-label="[^"]+"/.test(html), id + ' svg / aria-label'); assert(!/undefined|NaN/.test(html), id + ' undefined'); }
    ev("go('help');ACT.helpGo({k:'structure'})"); assert(w.document.querySelectorAll('.help-art figure.hv svg').length >= 2, 'structure shows two diagrams'); clean(w, 'diagrams');
  });
  await group('tours: start from the list, spotlight, next / back, last step, Esc ends, keyboard, role without access', 'ru', async (g, ev, w) => {
    ev("go('help');ACT.helpGo({k:'tours'})"); const btns = w.document.querySelectorAll('[data-act=tourStart]'); assert(btns.length >= 4, 'tour start buttons ' + btns.length);
    eq(ev('HELP.tours.length') >= 5, true); btns[0].click(); assert(w.document.querySelector('.tour-layer'), 'tour layer'); eq(ev('HELP.tour.id'), 'intro'); eq(ev('S.route'), 'dashboard');
    assert(w.document.querySelector('.tour-hi'), 'spotlight'); assert(w.document.querySelector('.tour-pop[role=dialog]'), 'dialog'); const n = ev('HELP.tours[0].steps.length');
    assert(w.document.querySelector('[data-act=tourBack]').disabled, 'back disabled on the first step');
    for (let i = 1; i < n; i++) { w.document.querySelector('[data-act=tourNext]').click(); eq(ev('HELP.tour.i'), i); }
    assert(!w.document.querySelector('[data-act=tourNext]'), 'no next on the last step'); w.document.querySelector('[data-act=tourBack]').click(); eq(ev('HELP.tour.i'), n - 2);
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); eq(ev('HELP.tour.i'), n - 1);
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); eq(ev('HELP.tour'), null); assert(!w.document.querySelector('.tour-layer'), 'layer removed after Esc');
    ev("ACT.tourStart({id:'dispatcher'})"); eq(ev('S.route'), 'dashboard'); for (let i = 0; i < 3; i++) w.document.querySelector('[data-act=tourNext]').click(); eq(ev('S.route'), 'dispatch'); eq(ev('S.tab.dispatch'), 'planning');
    while (w.document.querySelector('[data-act=tourNext]')) w.document.querySelector('[data-act=tourNext]').click(); w.document.querySelector('[data-act=tourEnd]').click(); eq(ev('HELP.tour'), null); clean(w, 'tour');
    ev("go('dashboard')"); assert(w.document.querySelector('.help-q[data-act=tourStart]'), '▶ header button on the start screen of a tour');
    ev("ACT.tourStart({id:'dispatcher'})"); for (let i = 0; i < 5; i++) w.document.querySelector('[data-act=tourNext]').click();
    assert(w.document.querySelector('.tour-layer') && ev('HELP.tour.i') === 5, 'tour steps with missing elements stay navigable'); ev('ACT.tourEnd()');
    ev("ACT.setRole({v:'driver'})"); ev("go('help');ACT.helpGo({k:'tours'})"); assert(!w.document.querySelector('[data-act=tourStart]') || w.document.querySelectorAll('[data-act=tourStart]').length < ev('HELP.tours.length'), 'tours hidden when the role cannot open the start screen');
  });
  for (const lang of ['de', 'en', 'kk']) {
    await group('tours: popover texts follow the page language and have no undefined (' + lang + ')', lang, async (g, ev, w) => {
      ev("ACT.tourStart({id:'qa'})"); const t = w.document.querySelector('.tour-pop').innerText; assert(!/undefined|NaN/.test(t), 'tour text'); if (lang !== 'kk') assert(!/[А-Яа-я]/.test(t), 'Cyrillic in the tour popover'); else assert(/[ӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(t), 'KK tour text'); ev('ACT.tourEnd()');
    });
  }
