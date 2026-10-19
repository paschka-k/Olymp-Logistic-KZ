  /* ---- Q1 animated help diagrams: figure kit (stepper, controls, step list, timers), every figure in 4 languages, truck seesaw, Load & weight ---- */
  const HV_IDS = ['flow', 'split', 'gonogo', 'load', 'booking', 'express', 'coldchain', 'truck', 'coverage', 'approvals', 'driver', 'dispatchMock'];
  for (const lang of LANGS) await group('[' + lang + '] help visuals: every figure renders every step as SVG with caption' + (lang === 'de' || lang === 'en' ? ', no Cyrillic' : ''), lang, async (g, ev) => {
    const ids = ev('Object.keys(HELP.visuals)');
    for (const id of HV_IDS) assert(ids.includes(id), 'visual missing: ' + id);
    const r = ev(`S.hv=S.hv||{};Object.keys(HELP.hv.defs).map(function(id){var d=HELP.hv.defs[id],n=d.steps.length,out=[];S.hv[id]=S.hv[id]||{i:0,run:false};var keep=S.hv[id].i;for(var i=0;i<n;i++){S.hv[id].i=i;out.push(HELP.visuals[id]())}S.hv[id].i=keep;return [id,n,out.join(' '),d.steps.map(tx).join(' ')+' '+tx(d.title)+' '+(d.lead?tx(d.lead):'')]})`);
    assert(r.length >= HV_IDS.length + 3, 'figures registered: ' + r.length);
    for (const [id, n, html, txt] of r) {
      assert(n >= 4, id + ' has ' + n + ' steps');
      assert(/<svg[^>]+viewBox/.test(html) && /role="img" aria-label="[^"]+"/.test(html), id + ' svg / aria-label');
      assert(/data-hv-cap/.test(html) && /data-act="hvStep"/.test(html) && /class="hv-all"/.test(html), id + ' caption, controls, step list');
      assert(!/undefined|NaN|\[object/.test(html), id + ' undefined / NaN');
      assert(txt.trim().length > 20, id + ' texts');
      if (lang === 'de' || lang === 'en') { const plain = html.replace(/<[^>]+>/g, ' ') + ' ' + txt; const m = plain.match(/.{0,20}[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі].{0,20}/); assert(!m, lang + ' Cyrillic in ' + id + ': ' + (m && m[0])); }
    }
  });
  await group('help visuals: stepper next / prev / step list change data-step and the caption, play / pause, no full render', 'ru', async (g, ev, w) => {
    ev("go('help');ACT.helpGo({k:'orders/loadw'})");
    const d = w.document, fig = () => d.querySelector('.help-art .hvk[data-hv=truck]');
    assert(fig(), 'animated truck figure in the Load & weight article'); assert(d.querySelector('.help-art .hvk[data-hv=load]'), 'loading instruction figure in the article');
    eq(fig().dataset.step, '0', 'starts at step 1'); assert(/1 из 8/.test(fig().querySelector('[data-hv-count]').textContent), 'counter 1 of 8');
    const cap0 = fig().querySelector('[data-hv-cap]').textContent, el0 = fig();
    fig().querySelector('[data-act=hvStep][data-v="1"]').click();
    eq(fig().dataset.step, '1', 'next → step 2'); assert(fig() === el0, 'same element: repainted in place, not re-rendered');
    assert(fig().querySelector('[data-hv-cap]').textContent !== cap0, 'caption changed'); eq(ev("S.hv.truck.run"), false, 'manual step pauses');
    assert(/2 из 8/.test(fig().querySelector('[data-hv-count]').textContent), 'counter 2 of 8');
    fig().querySelector('[data-act=hvStep][data-v="-1"]').click(); eq(fig().dataset.step, '0', 'prev → step 1');
    fig().querySelector('[data-act=hvStep][data-v="-1"]').click(); eq(fig().dataset.step, '7', 'prev wraps to the last step');
    fig().querySelectorAll('.hv-all button')[2].click(); eq(fig().dataset.step, '2', 'step list jumps to step 3'); assert(fig().querySelectorAll('.hv-all li')[2].classList.contains('on'), 'list marks the step');
    fig().querySelector('[data-act=hvTog]').click(); eq(ev("S.hv.truck.run"), true, 'play'); eq(fig().dataset.playing, '1', 'data-playing');
    assert(ev("HELP.hv.timers.has('truck')"), 'timer runs while visible / in the DOM');
    fig().querySelector('[data-act=hvTog]').click(); eq(ev("S.hv.truck.run"), false, 'pause'); assert(!ev("HELP.hv.timers.has('truck')"), 'pause clears the timer');
    clean(w, 'help truck');
  });
  await group('help visuals: truck seesaw — matrix 5 × 8, rear axle over the limit on step 4, recommendation on step 8', 'en', async (g, ev, w) => {
    ev("go('help');ACT.helpGo({k:'orders/loadw'})");
    const d = w.document, fig = () => d.querySelector('.help-art .hvk[data-hv=truck]');
    ev("ACT.hvGo({id:'truck',v:0})");
    eq(fig().querySelectorAll('[data-cand-row]').length, 5, 'five candidates'); eq(ev("HELP.hv.defs.truck.steps.length"), 8, 'eight checks');
    eq(fig().querySelector('[data-axle=rear]').dataset.over, '0', 'empty truck: rear axle fine');
    ev("ACT.hvGo({id:'truck',v:3})");
    eq(fig().querySelector('[data-axle=rear]').dataset.over, '1', 'step 4: rear axle over the limit');
    const ax = ev('HELP.truckAxles(3)'); assert(ax.rear > ax.rmax, 'rear ' + ax.rear + ' > ' + ax.rmax);
    assert(fig().querySelector('[data-axle=rear]').textContent.includes('+' + (ax.rear - ax.rmax)), 'excess tag +' + (ax.rear - ax.rmax));
    assert(+fig().querySelector('[data-seesaw-tilt]').dataset.seesawTilt > 0, 'beam tilts to the rear');
    eq(fig().querySelector('[data-axle=front]').dataset.over, '0', 'front axle fine');
    ev("ACT.hvGo({id:'truck',v:4})"); eq(fig().querySelector('[data-axle=rear]').dataset.over, '0', 'step 5: re-sequenced, rear axle fine');
    assert(+fig().querySelector('[data-cand-row="0"]').getAttribute('opacity') < 1, 'the 3.5 t candidate dropped out');
    assert(!fig().querySelector('[data-truck-reco]'), 'no recommendation before the last step');
    ev("ACT.hvGo({id:'truck',v:7})"); assert(/recommendation: 7\.5 t/.test(fig().querySelector('[data-truck-reco]').textContent), 'recommendation tag on step 8');
    ev("ACT.hvGo({id:'load',v:2})"); eq(d.querySelector('.hvk[data-hv=load] [data-lbar=ra]').dataset.over, '1', 'loading instruction: rear axle over before the split');
    ev("ACT.hvGo({id:'load',v:3})"); eq(d.querySelector('.hvk[data-hv=load] [data-lbar=ra]').dataset.over, '0', 'after the split both axles fine');
    assert(d.querySelectorAll('.hvk[data-hv=load] [data-place2]').length === 3, 'three pallets on truck 2');
    clean(w, 'help truck seesaw');
  });
  for (const lang of LANGS) await group('[' + lang + '] help visuals: Load & weight "◇ Diagram" shows truck + loading instruction; timers cleared after closing', lang, async (g, ev, w) => {
    const d = w.document;
    ev("S.tab.orders='loadw';go('orders')");
    const btn = d.querySelector('.diag-btn'); assert(btn, 'diagram button on Load & weight'); btn.click();
    assert(d.querySelector('.diag-pop .hvk[data-hv=truck]') && d.querySelector('.diag-pop .hvk[data-hv=load]'), 'popover shows the truck figure and the loading instruction');
    if (!ev('S.hv.truck.run')) ev("ACT.hvTog({id:'truck'})");   // prefers-reduced-motion starts paused
    assert(ev("HELP.hv.timers.has('truck')"), 'truck timer runs in the popover');
    const tf = () => d.querySelector('.diag-pop .hvk[data-hv=truck]'), s0 = +tf().dataset.step;
    tf().querySelector('[data-act=hvStep][data-v="1"]').click(); eq(+tf().dataset.step, (s0 + 1) % 8, 'next step in the popover'); eq(ev('S.hv.truck.run'), false, 'paused');
    ev("ACT.hvTog({id:'truck'})"); assert(ev('HELP.hvTimers()') >= 1, 'timers present while open');
    d.querySelector('.diag-pop [data-act=diagTog]').click();
    assert(!d.querySelector('.diag-pop'), 'popover closed'); eq(ev('HELP.hvTimers()'), 0, 'all figure timers cleared after closing');
    clean(w, 'diagram popover');
  });
  await group('help visuals: articles embed the animated figures (dispatchMock on Express, gonogo on documents, players on the kit)', 'de', async (g, ev, w) => {
    const d = w.document;
    ev("go('help');ACT.helpGo({k:'dispatch/express'})"); assert(d.querySelector('.help-art .hvk[data-hv=dispatchMock]'), 'dispatch mock on the express tab article');
    ev("ACT.helpGo({k:'orders/docs'})"); assert(d.querySelector('.help-art .hvk[data-hv=gonogo] [data-gate="8"]'), 'nine gates');
    ev("ACT.hvGo({id:'gonogo',v:2})"); assert(d.querySelector('.hvk[data-hv=gonogo] [data-gate="5"]').classList.contains('t-bad'), 'packages gate red on step 3');
    ev("ACT.hvGo({id:'gonogo',v:4})"); assert(!d.querySelector('.hvk[data-hv=gonogo] .t-bad'), 'all green on step 5');
    ev("ACT.helpGo({k:'start'})"); assert(d.querySelector('.hvk.hp[data-player=shipflow]'), 'player on the kit');
    ev("go('dashboard')"); eq(ev('HELP.hvTimers()'), 0, 'leaving help clears the timers');
    clean(w, 'help articles');
  });
