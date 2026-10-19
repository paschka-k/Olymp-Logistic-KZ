/* ---- phase 7: legacy screens as tabs ---- */
  await group('temperature alarm: load turns problem, deviation opens, QA flow closes it', 'ru', async (g, ev, w) => {
    const L = 'LD-2026-001847'; ev("go('routes');ACT.rtab({v:'temp'})"); w.document.querySelector('#sim_l').value = L; ev("ACT.sim({v:'freeze'})");
    eq(ev(`load('${L}').status`), 'problem'); const d = ev(`S.devs.find(x=>x.load==='${L}').id`); assert(d, 'no deviation');
    ev(`for(let i=0;i<3;i++)ACT.qNext({id:'${d}'});ACT.qDec({id:'${d}',v:'quarantine'});for(let i=0;i<3;i++)ACT.qNext({id:'${d}'})`); eq(ev(`S.devs.find(x=>x.id==='${d}').step`), 7); eq(ev(`load('${L}').qa`), 'quarantine');
  });
  await group('calibration registry unblocks pharma assignment', 'ru', async (g, ev) => { ev(`trk('t1').docs.calib='2020-01-01'`); assert(ev(`compat(load('LD-2026-001852'),drv('d2'),trk('t1')).some(x=>/GDP/.test(x))`), 'not blocked'); ev(`ACT.qCal({id:'t1'})`); assert(!ev(`compat(load('LD-2026-001852'),drv('d2'),trk('t1')).some(x=>/GDP/.test(x))`), 'still blocked'); });
  await group('partner handover: capability check, approval, load keeps working everywhere', 'ru', async (g, ev, w) => {
    ev("go('dispatch');ACT.dtab({v:'partners'})"); w.document.querySelector('#ho_l').value = 'LD-2026-001852'; w.document.querySelector('#ho_p').value = 'PL-04'; ev('ACT.hoNew()'); assert(w.document.querySelector('#ho_e').textContent, 'unsuitable partner accepted'); eq(ev('S.handovers.length'), 0);
    w.document.querySelector('#ho_p').value = 'PL-01'; ev('ACT.hoNew()'); eq(ev('S.handovers.length'), 1); ev('ACT.hoOk({id:S.handovers[0].id})'); eq(ev("load('LD-2026-001852').status"), 'assigned');
    for (const id of ev('NAV.map(n=>n[0])')) { ev(`go('${id}')`); clean(w, id + ' after handover'); } ev(`ACT.open({id:'LD-2026-001852'})`); clean(w, 'drawer');
  });
  await group('blocked partners cannot be chosen; unblock only after CAPA closes', 'ru', async (g, ev, w) => {
    ev("go('dispatch');ACT.dtab({v:'partners'})"); assert(w.document.querySelector('#ho_p option[value=PL-10]').disabled, 'blocked partner selectable'); assert(!/data-act="ptUnb" data-id="PL-10"/.test(w.document.body.innerHTML), 'unblock offered while CAPA open');
    ev("S.devs.find(d=>d.id==='DEV-0011').step=7;render()"); assert(/data-act="ptUnb" data-id="PL-10"/.test(w.document.body.innerHTML), 'unblock not offered after CAPA'); ev("ACT.ptUnb({id:'PL-10'})"); eq(ev("S.partners.find(p=>p.id==='PL-10').tier"), 'bronze');
  });
  await group('workshop request books a service cost', 'ru', async (g, ev, w) => { ev("go('dispatch');ACT.dtab({v:'partners'});ACT.wrNew()"); const n = ev('S.costs.length'); w.document.querySelector('#wc_WR-001').value = 85000; ev("ACT.wrClose({id:'WR-001'})"); eq(ev('S.costs.length'), n + 1); eq(ev('S.costs[S.costs.length-1].cat'), 'service'); });
  await group('security incidents: accept / escalate / close are audited', 'ru', async (g, ev) => { const id = ev('S.inc[0].id'); ev(`ACT.incSt({id:'${id}',v:'accepted'})`); eq(ev('S.inc[0].st'), 'accepted'); ev(`ACT.incSt({id:'${id}',v:'closed',cat:'resolved_on_site',note:'Checked with the driver, route restored'})`); eq(ev('S.inc[0].st'), 'closed'); assert(ev('S.audit.length') >= 2, 'not audited'); });
  await group('weather risk is computed for every active load', 'ru', async (g, ev, w) => { ev("go('routes');ACT.rtab({v:'wx'})"); assert(w.document.querySelectorAll('table tbody tr').length >= 4, 'forecast matrix'); assert(w.document.querySelector('main').innerText.includes('LD-2026-001847'), 'route risk list'); });
