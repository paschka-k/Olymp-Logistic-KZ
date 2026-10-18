/* ---- phase 6: reports, AI, settings ---- */
  await group('reports: six cards with exactly three KPIs, filters re-query', 'ru', async (g, ev, w) => {
    ev("go('reports')"); const cs = w.document.querySelectorAll('.report-card'); eq(cs.length, 6, 'cards'); cs.forEach(c => eq(c.querySelectorAll('.kpi3 > div').length, 3, 'KPIs per card'));
    const before = w.document.querySelector('.report-card[data-id=rev] .kpi3 b').textContent; w.document.querySelector('[data-rf=zone]').value = 'pharma'; w.document.querySelector('[data-rf=zone]').dispatchEvent(new w.Event('input', { bubbles: true }));
    assert(w.document.querySelector('.report-card[data-id=rev] .kpi3 b').textContent !== before, 'filter did not change revenue');
  });
  await group('settings: dirty state, validation blocks save, save applies values', 'ru', async (g, ev, w) => {
    ev("go('settings')"); const set = (id, v) => { const e = w.document.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); };
    assert(!w.document.querySelector('#dirtyChip').classList.contains('on'), 'dirty at start'); set('cf_params_rate', 9000); assert(w.document.querySelector('#dirtyChip').classList.contains('on'), 'not dirty after edit'); eq(ev('RECV.rate'), 6000, 'applied before save');
    set('cf_params_free', 999); ev("ACT.cfgSave()"); eq(ev('RECV.rate'), 6000, 'invalid save applied'); set('cf_params_free', 30); set('cf_params_shift', 8); ev("ACT.cfgSave()");
    eq(ev('RECV.rate'), 9000); eq(ev('RECV.free'), 30); eq(ev('CFG.live.shift'), 8); eq(ev("needRto({from:'AST',to:'ALA'})"), 8, 'RTO shift not applied'); assert(!w.document.querySelector('#dirtyChip').classList.contains('on'), 'dirty after save');
  });
  await group('AI: accept assigns, override needs a reason, decisions are audited', 'ru', async (g, ev, w) => {
    ev("go('ai')"); const n0 = ev("S.loads.filter(l=>l.status==='unassigned').length"); ev(`ACT.aiAcc({k:document.querySelector('[data-act=aiAcc]').dataset.k})`); eq(ev("S.loads.filter(l=>l.status==='unassigned').length"), n0 - 1, 'accept did not assign'); eq(ev('S.audit[0].decision'), 'Accept');
    ev(`ACT.aiOvr({k:document.querySelector('[data-act=aiOvr]').dataset.k})`); ev(`ACT.aiOvrGo({k:S.drawer.k})`); assert(w.document.querySelector('#ov_e').textContent, 'override without reason accepted');
    w.document.querySelector('#ov_r').value = 'test'; ev(`ACT.aiOvrGo({k:S.drawer.k})`); eq(ev('S.audit[0].decision'), 'Override'); eq(ev('S.audit[0].reason'), 'test');
  });
  await group('AI modules can be switched off in settings', 'ru', async (g, ev, w) => { ev("CFG.cur.ai.mod.match=false;ACT.cfgSave()"); ev("go('ai')"); assert(!w.document.querySelector('[data-act=aiAcc]'), 'matching card still active'); });
