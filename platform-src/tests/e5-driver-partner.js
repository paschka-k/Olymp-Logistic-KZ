  /* ---- R5 driver, partner and network ideas (I-11/FR-188, I-17/FR-68, I-18/FR-70, I-24/FR-189, I-27, I-28): every new place renders in
     4 languages without undefined and (DE / EN) without Cyrillic; the flows work end to end with audit entries ---- */
  const E5_CYR = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/;
  const E5_TAB = (s, t) => `ACT.setRole({v:'admin'});go('${s}');ACT.stab({s:'${s}',v:'${t}'})`;
  const E5_PLACES = [['orders/recipients', E5_TAB('orders', 'recipients'), '[data-cp]'], ['dispatch/backhaul', E5_TAB('dispatch', 'backhaul'), '[data-leg]'],
    ['dispatch/partners', E5_TAB('dispatch', 'partners'), '#r5_hsacts'], ['drivers/daadmin', E5_TAB('drivers', 'daadmin'), '[data-pin-row]'], ['drivers/app', E5_TAB('drivers', 'app'), '[data-pin-strip]'],
    ['settings/notify', E5_TAB('settings', 'notify'), '#r5_legal'], ['orders/commercial', E5_TAB('orders', 'commercial'), '[data-kgd="cm"]'],
    ['driver:dahand', "ACT.setRole({v:'driver'});go('dahand')", '[data-hs-drv]'], ['partner:phscan', "ACT.setRole({v:'partner'});go('phscan')", '[data-pbh]'],
    ['partner:pprofile', "ACT.setRole({v:'partner'});go('pprofile')", '[data-kgd="pp"]'], ['new load drawer', "ACT.setRole({v:'admin'});go('orders');ACT.r5UseRcp({id:'CP-0300'})", '[data-r5-rcp="CP-0300"]']];
  for (const lang of LANGS) {
    await group('R5: all new places render in place, clean' + (lang === 'de' || lang === 'en' ? ', without Cyrillic' : '') + ' · ' + lang.toUpperCase(), lang, async (g, ev, w) => {
      for (const [k, setup, sel] of E5_PLACES) {
        ev(setup); assert(w.document.querySelector(sel), k + ': ' + sel + ' missing'); clean(w, k);
        if (lang === 'de' || lang === 'en') { const t = w.document.querySelector('#root').innerText, m = t.match(new RegExp('.{0,20}' + E5_CYR.source + '+.{0,20}')); assert(!m, k + ' has Cyrillic in ' + lang + ': ' + (m && m[0])); }
      }
      for (const key of ['orders/recipients', 'dispatch/backhaul', 'drivers/daadmin', 'settings/notify', 'dahand', 'phscan']) assert(ev(`!!helpArt('${key}')`), 'help article ' + key);
    });
  }
  await group('R5 I-27: 21 cities ↔ 27 lab complexes ↔ 600+ collection points, Zhezkazgan in the city table, paging + search, picker sets the destination', 'ru', async (g, ev, w) => {
    eq(ev('R5.NETC.length'), 21, 'cities'); eq(ev('R5.LABS.length'), 27, 'lab complexes'); assert(ev('R5.PTS.length') >= 600, 'points ' + ev('R5.PTS.length'));
    assert(ev("!!LOCS.ZHE && LOCS.ZHE.hub==='KAR'"), 'Zhezkazgan in LOCS'); assert(ev("R5.NETC.every(c=>LOCS[c.k])"), 'every network city in LOCS'); assert(ev("routeFor('ZHE','ALA').km>0"), 'route to Zhezkazgan');
    assert(ev("R5.PTS.every(p=>R5.LABS.some(x=>x.id===p.lab&&x.city===p.city))"), 'every point belongs to a lab complex of its city');
    ev(E5_TAB('orders', 'recipients')); eq(ev("document.querySelectorAll('[data-cp]').length"), 20, 'one page = 20 rows'); assert(/^1\/\d+$/.test(ev("document.querySelector('[data-r5-pager]').dataset.r5Pager")), 'pager');
    ev("ACT.r5Page({v:2})"); assert(/^2\//.test(ev("document.querySelector('[data-r5-pager]').dataset.r5Pager")), 'page 2');
    ev("const i=document.querySelector('#r5_rq');i.value='CP-0042';i.dispatchEvent(new Event('input',{bubbles:true}))"); eq(ev("document.querySelectorAll('[data-cp]').length"), 1, 'search by number'); eq(ev("document.querySelector('[data-cp]').dataset.cp"), 'CP-0042');
    ev("S.r5.rq='';ACT.r5City({v:'ZHE'})"); eq(ev("document.querySelectorAll('[data-cp]').length"), 10, 'Zhezkazgan points');
    const pid = ev("R5.PTS.find(p=>p.city==='SHY').id"); ev(`ACT.r5UseRcp({id:'${pid}'})`); eq(ev("document.querySelector('#n_to').value"), 'SHY', 'destination hub from the point');
    ev("document.querySelector('#n_from').value='AST';ACT.saveLoad()"); const lid = ev('S.drawer && S.drawer.id'); assert(lid, 'load created'); eq(ev(`load('${lid}').recipient`), pid); eq(ev(`load('${lid}').to`), 'SHY');
    assert(w.document.querySelector(`[data-trip-rcp="${pid}"]`), 'recipient on the trip'); clean(w, 'recipients');
  });
  await group('R5 I-28: West / South return legs, bids, accept → order on the return trip with revenue; partner bids from the portal', 'ru', async (g, ev, w) => {
    ev(E5_TAB('dispatch', 'backhaul')); assert(ev("S.r5.legs.some(l=>l.corr==='west')&&S.r5.legs.some(l=>l.corr==='south')"), 'west and south legs'); assert(ev("S.r5.legs.every(l=>l.km>0&&l.cap>0)"), 'legs with km and capacity');
    const draft = ev("(S.r5.legs.find(l=>l.st==='draft')||{}).id"); if (draft) { ev(`ACT.r5BhOffer({id:'${draft}'})`); assert(ev(`S.r5.bids.some(b=>b.leg==='${draft}')`), 'bids after offer'); }
    const b = ev("S.r5.bids.find(b=>b.st==='open').id"), n0 = ev('S.loads.length'); ev(`ACT.r5BhAccept({id:'${b}'})`);
    eq(ev(`S.r5.bids.find(x=>x.id==='${b}').st`), 'accepted'); eq(ev('S.loads.length'), n0 + 1, 'order created');
    const lid = ev(`S.r5.bids.find(x=>x.id==='${b}').load`), leg = ev(`R5.legOf(S.r5.bids.find(x=>x.id==='${b}').leg)`);
    eq(ev(`load('${lid}').from`), leg.from); eq(ev(`load('${lid}').to`), leg.to); eq(ev(`S.loads.filter(l=>l.id==='${lid}').length`), 1, 'unique load id'); assert(ev(`load('${lid}').backhaul.price>0`), 'revenue on the load');
    assert(ev(`+document.querySelector('[data-leg="${leg.id}"] [data-leg-rev]').dataset.legRev`) > 0, 'leg revenue shown'); assert(ev("S.audit.some(a=>a.module==='Backhaul')"), 'audited');
    ev(`ACT.open({id:'${lid}'})`); assert(w.document.querySelector(`[data-trip-bh="${leg.id}"]`), 'backhaul on the trip'); ev('closeDrawer()');
    const big = ev(`S.r5.bids.find(x=>x.st==='open')`); if (big) { ev(`S.r5.bids.find(x=>x.id==='${big.id}').pallets=999`); assert(ev(`!!backhaulAccept('${big.id}')`), 'over-capacity bid refused'); }
    ev("ACT.setRole({v:'viewer'})"); const o = ev("(S.r5.bids.find(x=>x.st==='open')||{}).id"); if (o) assert(ev(`!!backhaulAccept('${o}')`), 'viewer cannot accept');
    ev("ACT.setRole({v:'partner'});go('phscan')"); const pl = ev("document.querySelector('[data-pbh]').dataset.pbh"), nb = ev('S.r5.bids.length');
    ev(`document.querySelector('#pbh_pal_${pl}').value=2;ACT.r5BhBid({id:'${pl}'})`); eq(ev('S.r5.bids.length'), nb + 1, 'partner bid'); eq(ev('S.r5.bids[S.r5.bids.length-1].p'), 'PL-01'); clean(w, 'backhaul');
  });
  await group('R5 I-17 / FR-68: driver scans SSCC in the app, partner confirms in the portal; clean act → confirmed, discrepancy → deviation; visible on trip and in Partners', 'ru', async (g, ev, w) => {
    const a = ev('S.r5.acts[0].id'); ev("ACT.setRole({v:'driver'});go('dahand')"); assert(w.document.querySelector(`[data-hs-drv="${a}"]`), 'act in the driver app');
    const items = ev('S.r5.acts[0].items'); items.forEach(s => ev(`document.querySelector('#r5_sscc_${a}').value='${s}';ACT.r5HsScan({id:'${a}'})`)); eq(ev('S.r5.acts[0].scanned.length'), items.length, 'all scanned');
    assert(/не входит/.test(ev(`hsScan('${a}','004870000000099990')`)), 'unexpected package refused'); eq(ev('S.r5.acts[0].extra.length'), 1, 'recorded as unexpected');
    ev(`ACT.r5HsSend({id:'${a}'})`); eq(ev('S.r5.acts[0].st'), 'sent');
    ev("ACT.setRole({v:'partner'});go('phscan')"); eq(ev(`document.querySelectorAll('[data-hs-p="${a}"] [data-hs-pitem]').length`), items.length, 'partner sees every package');
    const sel = w.document.querySelector(`[data-r5rcv="${a}|${items[0]}"]`); sel.value = 'damaged'; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
    const nd = ev('S.devs.length'); ev(`ACT.r5HsConfirm({id:'${a}'})`); eq(ev('S.r5.acts[0].st'), 'discrepancy'); assert(ev('S.r5.acts[0].dev'), 'deviation id'); assert(ev('S.devs.length') >= nd, 'deviation exists');
    assert(ev("S.devs.some(d=>d.id===S.r5.acts[0].dev&&d.load===S.r5.acts[0].load)"), 'deviation linked to the load'); eq(ev('S.r5.acts[0].disc.length'), 2, 'damaged + unexpected');
    ev(E5_TAB('dispatch', 'partners')); assert(w.document.querySelector(`[data-hs-row="${a}"]`), 'act in Partners');
    ev(`ACT.open({id:S.r5.acts[0].load})`); assert(w.document.querySelector('[data-trip-hs]'), 'act on the trip'); ev('closeDrawer()');
    assert(ev("S.audit.some(x=>x.module==='Partners'&&/discrepancy/.test(x.decision))"), 'audited');
    /* a second act from an approved handover, scanned completely → confirmed without deviation */
    ev("go('dashboard');S.handovers.push({id:'HO-T01',load:'LD-2026-001848',p:'PL-01',st:'approved',mode:'part',items:[ssccOf(load('LD-2026-001848'),0),ssccOf(load('LD-2026-001848'),1)],portal:0});render()");
    ev("ACT.r5HsMk({id:'HO-T01'})"); const b = ev("S.r5.acts.find(x=>x.ho==='HO-T01').id"); ev(`ACT.r5HsNext({id:'${b}'});ACT.r5HsNext({id:'${b}'});ACT.r5HsSend({id:'${b}'})`);
    eq(ev(`hsConfirm('${b}')`), null); eq(ev(`S.r5.acts.find(x=>x.id==='${b}').st`), 'confirmed'); assert(!ev(`S.r5.acts.find(x=>x.id==='${b}').dev`), 'no deviation'); clean(w, 'handover');
  });
  await group('R5 I-18 / FR-70: PIN sign-in on the bound MDM device, lockout after 5 tries, dispatcher reset, non-compliant and unbound devices blocked', 'ru', async (g, ev, w) => {
    ev(E5_TAB('drivers', 'app')); assert(w.document.querySelector('[data-pin-strip="d4"]'), 'signed-in strip'); assert(w.document.querySelector('.da-phone'), 'phone');
    ev("ACT.r5PinOut({id:'d4'})"); assert(w.document.querySelector('[data-pin-lock="d4"]'), 'lock screen after sign-out');
    for (let i = 1; i <= 4; i++) assert(/4|\d \/ 5/.test(ev("pinLogin('d4','0000')")), 'wrong try ' + i);
    ev("document.querySelector('#r5_pin').value='0000';ACT.r5PinIn({id:'d4'})"); assert(ev('S.r5.pin.d4.locked'), 'locked after 5'); assert(w.document.querySelector('[data-pin-block]'), 'lock message');
    assert(ev("!!pinLogin('d4','5402')"), 'correct PIN refused while locked');
    ev("ACT.setRole({v:'dispatcher'});go('drivers');setTab('drivers','daadmin')"); ev("ACT.r5PinReset({id:'d4'})"); assert(!ev('S.r5.pin.d4.locked'), 'reset unlocks'); const tmp = ev('S.r5.pinShown.pin'); assert(/^\d{4}$/.test(tmp), 'temporary PIN');
    assert(w.document.querySelector('[data-pin-shown="d4"]'), 'temporary PIN shown once'); eq(ev('S.r5.pin.d4.temp'), true);
    eq(ev(`pinLogin('d4','${tmp}')`), null, 'login with the temporary PIN'); assert(ev('S.r5.pin.d4.sess'), 'session');
    assert(/MDM/.test(ev("pinLogin('d6','1735')")), 'non-compliant device blocked'); ev("ACT.r5MdmCheck({id:'d6'})"); eq(ev("pinLogin('d6','1735')"), null, 'after MDM re-check');
    assert(ev("!!pinLogin('d3','')"), 'no device bound'); ev("ACT.r5MdmEnrol({id:'d3'})"); assert(ev('S.r5.pin.d3.bound') && ev("S.r5.pin.d3.mdm==='ok'"), 'enrolled + bound');
    ev("ACT.r5PinUnbind({id:'d7'})"); assert(/привязано/.test(ev("pinLogin('d7','2694')")), 'unbound device blocked');
    ev("ACT.setRole({v:'viewer'})"); ev("ACT.r5PinReset({id:'d1'})"); eq(ev('S.r5.pin.d1.temp'), false, 'viewer cannot reset');
    assert(ev("S.audit.filter(a=>a.module==='Driver app').length") >= 8, 'audited'); ev("ACT.setRole({v:'driver'});S.da.drv='d6';ACT.r5PinOut({id:'d6'});go('driverapp')"); assert(w.document.querySelector('[data-pin-lock="d6"]'), 'driver shell gated'); clean(w, 'pin');
  });
  await group('R5 I-11 / FR-188: SMS + e-mail by default; WhatsApp / Telegram only with consent and four-eyes legal approval; templates in 4 languages; delivery log', 'ru', async (g, ev, w) => {
    ev(E5_TAB('settings', 'notify')); eq(ev("document.querySelector('#r5_legal').dataset.legal"), 'off', 'off by default'); eq(ev("ntfChannels('c1').join()"), 'sms,email', 'consent alone is not enough');
    const n0 = ev('S.r5.ntf.log.length'); ev("setStatus('LD-2026-001851','loading');setStatus('LD-2026-001851','in_transit')"); assert(ev('S.r5.ntf.log.length') > n0, 'status change notifies');
    ev("ACT.setRole({v:'dispatcher'});go('settings');setTab('settings','notify');ACT.r5LegalReq()"); eq(ev("document.querySelector('#r5_legal').dataset.legal"), 'req');
    ev("ACT.setRole({v:'admin'});go('settings');setTab('settings','notify');ACT.r5LegalOk()"); eq(ev('S.r5.ntf.legal.on'), true, 'other role approves');
    ev("ACT.r5LegalOff();ACT.r5LegalReq();ACT.r5LegalOk()"); eq(ev('S.r5.ntf.legal.on'), false, 'same role cannot approve its own request');
    ev("ACT.setRole({v:'manager'});go('settings');setTab('settings','notify');ACT.r5LegalOk()"); eq(ev('S.r5.ntf.legal.on'), true);
    eq(ev("ntfChannels('c1').join()"), 'sms,email,wa'); eq(ev("ntfChannels('c3').join()"), 'sms,email,tg'); eq(ev("ntfChannels('c2').join()"), 'sms,email', 'no consent → no messenger');
    ev("ACT.setRole({v:'admin'});go('settings');setTab('settings','notify');ACT.r5Consent({id:'c2',v:'tg'})"); eq(ev("ntfChannels('c2').join()"), 'sms,email,tg', 'consent recorded');
    const n1 = ev('S.r5.ntf.log.length'); ev("ACT.r5NtfTest({id:'c1'})"); eq(ev('S.r5.ntf.log.length'), n1 + 3, 'SMS + e-mail + WhatsApp'); assert(ev("S.r5.ntf.log.slice(0,3).some(m=>m.ch==='wa'&&m.lang==='ru')"), 'WhatsApp in the customer language');
    assert(w.document.querySelectorAll('#r5_log [data-msg]').length >= 3, 'log rows'); ev("ACT.r5Consent({id:'c1',v:'wa'})"); eq(ev("ntfChannels('c1').join()"), 'sms,email', 'withdrawn');
    for (const l of ['ru', 'de', 'en', 'kk']) { ev(`ACT.r5TplLang({v:'${l}'})`); eq(ev("document.querySelectorAll('#r5_tpl tr').length"), 4, 'templates ' + l); }
    assert(ev("S.audit.filter(a=>a.module==='Notifications').length") >= 5, 'audited'); clean(w, 'notify');
  });
  await group('R5 I-24 / FR-189: KGD online check — active fills the form, liquidated blocks creation, not found → manual; also in the partner registration', 'ru', async (g, ev, w) => {
    ev(E5_TAB('orders', 'commercial')); ev("cmSet('bin',R5.KGD_DEMO.active);ACT.r5Kgd({s:'cm'})"); eq(ev("document.querySelector('[data-kgd-res]').dataset.kgdRes"), 'active');
    ev("ACT.r5KgdFill({s:'cm'})"); eq(ev("cmGet('name')"), ev('kgdOnline(R5.KGD_DEMO.active).name'), 'name filled'); assert(ev("!!LOCS[cmGet('city')]"), 'city filled');
    ev("cmSet('bin',R5.KGD_DEMO.liquidated);ACT.r5Kgd({s:'cm'})"); eq(ev("document.querySelector('[data-kgd-res]').dataset.kgdRes"), 'liquidated');
    const c0 = ev('S.customers.length'); ev("cmSet('name','ТОО «Тест»');ACT.cmCustAdd()"); eq(ev('S.customers.length'), c0, 'liquidated company not created');
    ev("cmSet('bin',R5.KGD_DEMO.notfound);ACT.r5Kgd({s:'cm'})"); eq(ev("document.querySelector('[data-kgd-res]').dataset.kgdRes"), 'notfound');
    eq(ev("kgdOnline('123').st"), 'invalid'); assert(ev("S.audit.some(a=>a.module==='KGD'&&/liquidated/.test(a.decision))"), 'audited');
    ev("ACT.setRole({v:'partner'});go('pprofile');PP.reg.bin=R5.KGD_DEMO.partner;ACT.r5Kgd({s:'pp'});ACT.r5KgdFill({s:'pp'})"); assert(ev('PP.reg.company.length') > 3, 'partner company filled'); eq(ev("kgdOnline(R5.KGD_DEMO.partner).partner"), 'PL-01');
    ev("PP.reg.bin=R5.KGD_DEMO.liquidated;PP.reg.company='X Y';render()"); const q0 = ev('S.pquals.length'); ev('ACT.ppReg()'); eq(ev('S.pquals.length'), q0, 'liquidated partner not registered'); clean(w, 'kgd');
  });
