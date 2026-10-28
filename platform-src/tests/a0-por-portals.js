  /* ---- W4 Customers & portals: Commercial tab, customer portal, partner portal, public views ---- */
  await group('por: BIN/IIN check digit, mask, register autofill, customer created (FR-189)', 'ru', async (g, ev, w) => {
    assert(ev("tinCheck(CUSTOMERS[0].bin).valid && tinCheck(CUSTOMERS[0].bin).kind==='bin'"), 'seed BIN valid'); eq(ev("tinCheck('123').reason"), 'format'); eq(ev("tinCheck(tinFix('18014000123').slice(0,11)+'0').valid || tinCheck(tinFix('18014000123').slice(0,11)+'1').valid"), false, 'wrong digit must fail at least once');
    assert(ev("tinCheck(tinFix('85011512345')).kind==='iin'"), 'iin kind'); assert(/••••••/.test(ev("maskTin(tinFix('85011512345'))")), 'mask');
    ev("go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'customers'})"); const n = ev('S.customers.length');
    ev("COMM.q.bin='12034000567';ACT.cmCustAdd()"); eq(ev('S.customers.length'), n, 'invalid BIN accepted');
    ev("COMM.q.bin=KGD_BINS[1];COMM.q.name='';ACT.cmCustAdd()"); eq(ev('S.customers.length'), n, 'duplicate BIN accepted');
    ev("COMM.q.bin=tinFix('17054000777');COMM.q.name='ТОО «Тест»';COMM.q.city='KAR';ACT.cmCustAdd()"); eq(ev('S.customers.length'), n + 1, 'customer created'); eq(ev('CUSTOMERS.length'), n + 1, 'shared register'); clean(w, 'customers');
    eq(ev("addrCheck('AST','ул. Туран','5').st"), 'ok'); eq(ev("addrCheck('AST','Неизвестная','5').st"), 'manual'); eq(ev("addrCheck('AST','','5').st"), 'bad');
  });
  await group('por: price lists — framework discount, fuel surcharge, deactivate falls back to line tariff (FR-148)', 'ru', async (g, ev, w) => {
    const base = ev("priceFor({from:'AST',to:'ALA',zone:'pharma',pallets:10,kg:4000}).freight"), c1 = ev("priceFor({from:'AST',to:'ALA',zone:'pharma',pallets:10,kg:4000,cust:'c1'})");
    eq(c1.discount, Math.floor(base * 0.10 / 100) * 100, 'discount 10 %'); eq(c1.freight, base - c1.discount); assert(c1.fuel > 0, 'fuel surcharge (diesel 340 > base 300)'); eq(c1.terms.kind, 'framework');
    assert(!ev("priceFor({from:'AST',to:'ALA',zone:'pharma',pallets:10,kg:4000,cust:'c2'}).discount"), 'spot has no discount'); assert(!ev("termsOf('c4')"), 'c4 line tariff');
    ev("go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'prices'});COMM.q.pl_cust='c4';COMM.q.pl_kind='framework';COMM.q.pl_disc='20';COMM.q.pl_base='300';ACT.cmPlAdd()"); eq(ev("termsOf('c4').disc"), 20, 'new list in force'); clean(w, 'prices');
    ev("ACT.cmPlOff({id:String(termsOf('c4').id)})"); assert(!ev("termsOf('c4')"), 'deactivated → line tariff'); assert(ev("S.audit.some(a=>/Price list/.test(a.decision))"), 'audited');
    eq(ev("chargeable(2, 1500)"), 3, 'chargeable by weight');
  });
  await group('por: offers lock the price for 14 days and accept into S.bookings (FR-147)', 'ru', async (g, ev, w) => {
    ev("go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'offers'})"); const n = ev('S.offers.length');
    ev("COMM.q.of_cust='c2';COMM.q.of_from='KAR';COMM.q.of_to='TAR';COMM.q.of_zone='chilled';COMM.q.of_pal='5';COMM.q.of_kg='2000';ACT.cmOfAdd()"); eq(ev('S.offers.length'), n + 1); const o = ev('S.offers[0]'); eq(o.status, 'open'); eq(o.until, '2026-11-01', 'valid 14 days'); assert(w.document.querySelector('#cm_offer'), 'offer sheet'); clean(w, 'offers');
    const bk = ev('(S.bookings||[]).length'); ev("ACT.cmOfAccept({id:S.offers[0].id})"); eq(ev('S.bookings.length'), bk + 1, 'booking created'); eq(ev('S.bookings[0].gross'), o.gross, 'locked price'); eq(ev('S.bookings[0].status'), 'new'); eq(ev('S.offers[0].status'), 'accepted');
    assert(ev("S.offers.find(o=>o.id==='KP-26-0006').status==='expired'"), 'expired offer');
  });
  await group('por: contracts — draft → sent → signed in the portal; framework enables payment on account (FR-149)', 'ru', async (g, ev, w) => {
    ev("go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'contracts'});COMM.q.ct_cust='c2';COMM.q.ct_kind='framework';COMM.q.ct_disc='8';COMM.q.ct_base='340';ACT.cmCtAdd()"); const c = ev('S.contracts[0]'); eq(c.status, 'draft'); eq(c.sha.length, 64, 'sha-256 length'); clean(w, 'contracts');
    assert(!ev("activeFramework('c2')"), 'c2 has no framework yet'); ev("ACT.cmCtSend({id:S.contracts[0].id})"); eq(ev('S.contracts[0].status'), 'sent');
    ev("ACT.setRole({v:'customer'});S.custId='c2';go('book')"); assert(!/on_account/.test(w.document.querySelector('#bk_payment').innerHTML), 'on account offered without contract');
    ev("go('mybookings')"); assert(w.document.querySelector('[data-act=bkSign]'), 'sign button'); ev("ACT.bkSign({id:S.contracts[0].id})"); eq(ev('S.contracts[0].status'), 'signed'); assert(ev("activeFramework('c2')"), 'framework active');
    ev("go('book')"); assert(/on_account/.test(w.document.querySelector('#bk_payment').innerHTML), 'on account now offered'); clean(w, 'book after sign');
  });
  await group('por: CRM — public request becomes a lead, tender needs deadline, won lead onboards a customer with a task (FR-02/127)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'viewer'});go('request')"); const n = ev('S.leads.length');
    ev("ACT.pqSend()"); assert(w.document.querySelector('#pq_err'), 'empty form accepted'); eq(ev('S.leads.length'), n);
    ev("PUBQ.company='ТОО «Новый»';PUBQ.contact='Иван';PUBQ.email='a@b.kz';PUBQ.consent=true;PUBQ.from='TAR';PUBQ.to='AST';ACT.pqSend()"); eq(ev('S.leads.length'), n + 1, 'lead from form'); eq(ev('S.leads[0].src'), 'web'); assert(w.document.querySelector('#pq_done'), 'thank-you'); clean(w, 'request');
    ev("PUBQ.sent=null;PUBQ.company='Бот';PUBQ.contact='Бот';PUBQ.email='x@y.kz';PUBQ.consent=true;PUBQ.website='spam';ACT.pqSend()"); eq(ev('S.leads.length'), n + 1, 'honeypot stored a lead');
    ev("ACT.setRole({v:'admin'});go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'crm'})"); assert(w.document.querySelector('[data-act=cmPqOk], .kcard'), 'crm renders'); clean(w, 'crm');
    ev("COMM.q.ld_company='ТОО «Тендер»';COMM.q.ld_src='tender';COMM.q.ld_deadline='';ACT.cmLeadAdd()"); eq(ev('S.leads.length'), n + 1, 'tender without deadline accepted');
    ev("COMM.q.ld_deadline='2026-11-05';COMM.q.ld_tender='T-1';COMM.q.ld_bin=tinFix('19024000555');ACT.cmLeadAdd()"); eq(ev('S.leads.length'), n + 2); eq(ev('S.leads[0].tender'), 'T-1');
    const cu = ev('S.customers.length'), tk = ev('S.tasks.length'); ev("ACT.cmLead({id:S.leads[0].id,v:'won'})"); eq(ev('S.customers.length'), cu + 1, 'customer onboarded'); eq(ev('S.tasks.length'), tk + 1, 'onboarding task'); assert(ev('S.leads[0].custId'), 'lead linked'); clean(w, 'crm after won');
    ev("ACT.cmSec({v:'tasks'})"); assert(ev('S.tasks.some(overdue)'), 'overdue task in seed'); ev("ACT.cmTaskDone({id:'T-2'})"); assert(!ev("overdue(S.tasks.find(t=>t.id==='T-2'))"), 'done task not overdue'); clean(w, 'tasks');
    ev("ACT.cmSec({v:'fx'})"); assert(ev('fxLatest().stale') === false, 'rate of 16.10 fresh on 18.10'); ev("COMM.q.fx_day='2026-10-18';COMM.q.fx_eur='640';COMM.q.fx_usd='545';ACT.cmFxAdd()"); eq(ev('fxLatest().EUR'), 640); clean(w, 'fx');
  });
  await group('por: routing never answers "no line" — every city pair has a route; slots and price at once (FR-155/146)', 'ru', async (g, ev) => {
    const bad = ev("Object.keys(LOCS).flatMap(a=>Object.keys(LOCS).map(b=>[a,b])).filter(([a,b])=>!routeFor(a,b)||routeFor(a,b).legs.length===0||!(routeFor(a,b).km>0)).length"); eq(bad, 0, 'pairs without route');
    eq(ev("routeFor('TAR','KST').mode"), 'transship'); eq(ev("routeFor('KST','AST').mode"), 'direct'); eq(ev("routeFor('KST','PAV').mode"), 'via_hub'); eq(ev("routeFor('ALA','ALA').mode"), 'city');
    assert(ev("priceFor({from:'TAR',to:'KST',zone:'pharma',pallets:4,kg:1600}).handling") > 0, 'transship handling fee'); eq(ev("priceFor({from:'AST',to:'KAR',zone:'ambient',pallets:1,kg:100}).handling"), 0);
    assert(ev("slotsFor('AST','ALA',4,1600).length") >= 2, 'slots'); assert(ev("slotsFor('AST','ALA',4,1600).every(s=>s.free<=33 && s.ok)"), 'free capacity');
    assert(ev("loadWarnings(4, 40, []).length") === 1, 'low kg warning'); assert(ev("loadWarnings(1, 1300, []).length") >= 1, 'limit warning'); eq(ev("loadWarnings(4, 1600, [{n:1,l:130,w:90,h:100,kg:400}]).length"), 2, 'oversize + sum mismatch');
  });
  await group('por: customer books with DG, insurance, payer, SMS — booking lands in S.bookings with messages; cancel; express pending (FR-150/151/152/154/185/186/187)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'customer'});go('book')"); assert(w.document.querySelector('#bk_price'), 'price block at once'); assert(w.document.querySelector('[data-act=bkSend]').disabled, 'send enabled before slot');
    ev("BK.pCity='TAR';BK.pStreet='Абая';BK.pHouse='5';BK.dCity='KST';BK.dStreet='Космонавтов';BK.dHouse='9';BK.goods=['vaccines'];BK.zone='pharma';BK.pallets=4;BK.kg=1600;BK.dgOn=true;BK.dg.un='1845';BK.dg.name='Dry ice';BK.dg.cls='9';BK.dg.dry='20';BK.insured=true;BK.declared='5000000';BK.payerOn=true;BK.payer.company='ТОО «Экспедитор»';BK.payer.bin=CUSTOMERS[1].bin;BK.notifySms=true;BK.phone='+7 701 123 45 67';BK.slot=slotsFor('TAR','KST',4,1600)[0].date;render()");
    assert(!w.document.querySelector('#bk_price ul'), 'form has errors: ' + (w.document.querySelector('#bk_price ul') || {}).innerText); const n = ev('S.bookings.length'); w.document.querySelector('[data-act=bkSend]').click(); eq(ev('S.bookings.length'), n + 1, 'booking stored'); const b = ev('S.bookings[0]');
    eq(b.cust, 'c1'); eq(b.status, 'new'); eq(b.mode, 'transship'); eq(b.addrCheck, 'manual', 'unknown street → manual'); assert(b.price.adr > 0 && b.price.premium >= 3000 && b.payer.invoiceTo === 'payer', 'adr, premium, payer'); eq(b.messages.length, 2, 'e-mail + sms'); assert(w.document.querySelector('#bk_done'), 'confirmation card'); clean(w, 'book done');
    ev("go('mybookings')"); assert(new RegExp(b.id).test(w.document.querySelector('#root').innerText), 'listed'); clean(w, 'mybookings'); ev(`ACT.bkCancel({id:'${b.id}'})`); eq(ev('S.bookings[0].status'), 'cancelled');
    ev("go('book');ACT.bkReset();BK.kg=1600;BK.express=true;BK.deliverBy='2026-10-21';render()"); assert(/3/.test(w.document.querySelector('[data-bk=express]').closest('label').innerText), 'three managers note'); w.document.querySelector('[data-act=bkSend]').click(); eq(ev('S.bookings[0].exSt'), 'pending', 'express pending'); assert(ev('S.bookings[0].price.express') > 0, 'express surcharge');
    ev("BK.goods=['labcons'];render()"); eq(ev("goodsZones(['labcons'])[0]"), 'ambient'); eq(ev("goodsZones(['vaccines','labcons']).length"), 0, 'incompatible goods');
  });
  await group('por: partner portal — own handovers only, ePOD needs signature and scans, GDP self-registration approved in CRM (FR-30/172)', 'ru', async (g, ev, w) => {
    ev("go('dispatch');ACT.dtab({v:'partners'})"); w.document.querySelector('#ho_l').value = 'LD-2026-001852'; w.document.querySelector('#ho_p').value = 'PL-02'; ev('ACT.hoNew();ACT.hoOk({id:S.handovers[0].id})');
    ev("ACT.setRole({v:'partner'});go('phandovers')"); assert(!/001852/.test(w.document.querySelector('#root').innerText), 'other partner handover visible'); assert(/HO-000/.test(w.document.querySelector('#root').innerText), 'own seeded handover'); clean(w, 'phandovers');
    ev("PP.signer='';ACT.ppEpod({id:'HO-000'})"); assert(!ev("trackFind('HO-000')"), ''); assert(ev('PP.msg'), 'epod without signer accepted'); ev("PP.signer='Иванов';PP.role='кладовщик';ACT.ppEpod({id:'HO-000'})"); assert(ev('PP.msg'), 'epod without signature accepted');
    ev("ACT.ppSig();ACT.ppEpod({id:'HO-000'})"); assert(/\d\/\d/.test(ev('PP.msg')), 'epod without scans accepted'); ev("ACT.ppScanAll({id:'HO-000'});ACT.ppEpod({id:'HO-000'})"); assert(/EPOD-/.test(w.document.querySelector('#root').innerText), 'epod recorded'); assert(ev("load(S.loads.find(l=>l.partner==='PL-01').id).notes.some(n=>/EPOD/.test(n.text))"), 'load note'); clean(w, 'after epod');
    ev("go('pprofile')"); clean(w, 'pprofile'); const pn = ev('S.partners.length'); ev("PP.reg.company='ТОО «Новый Партнёр»';PP.reg.bin='120340005671';PP.reg.cert='x.pdf';ACT.ppReg()"); eq(ev('S.partners.length'), pn, 'invalid BIN registered'); ev("PP.reg.bin=tinFix('20014000999');ACT.ppReg()"); eq(ev('S.partners.length'), pn + 1, 'partner registered'); eq(ev('S.pquals.filter(q=>q.status==="pending").length'), 1);
    ev("ACT.setRole({v:'admin'});go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'crm'})"); assert(w.document.querySelector('[data-act=cmPqOk]'), 'approval offered'); ev("ACT.cmPqOk({id:S.pquals.find(q=>q.status==='pending').id})"); eq(ev('S.partners[S.partners.length-1].gdp'), 1, 'gdp approved'); clean(w, 'crm after approval');
    for (const id of ev('NAV.map(n=>n[0])')) { ev(`go('${id}')`); clean(w, id + ' after partner flows'); }
  });
  await group('por: public tracking — deep link ?track for every role, no personal data, not found (FR-112/175)', 'ru', async (g, ev, w) => {
    for (const r of ['viewer', 'customer', 'partner', 'driver']) { ev(`ACT.setRole({v:'${r}'})`); assert(ev("canSee('track') && canSee('request')"), r + ' cannot see public views'); }
    ev("ACT.setRole({v:'viewer'});S.trackId='LD-2026-001840';go('track')"); assert(w.document.querySelector('#trk_card'), 'load card'); const txt = w.document.querySelector('#trk_card').innerText; assert(!/СеверПродукт|Сейтқали|\+7/.test(txt), 'personal data in tracking'); assert(/Караганда|Алматы/.test(txt), 'cities'); clean(w, 'track load');
    ev("S.trackId='LD-2026-999999';render()"); assert(w.document.querySelector('#trk_none'), 'not found'); assert(!w.document.querySelector('#trk_card'));
    ev("ACT.setRole({v:'customer'});go('book');BK.slot=slotsFor(BK.pCity,BK.dCity,4,1600)[0].date;render();ACT.bkSend()"); const id = ev('S.bookings[0].id'); ev(`ACT.trackOpen({id:'${id}'})`); eq(ev('S.route'), 'track'); assert(w.document.querySelector('#trk_card'), 'booking card'); assert(/hub|хаб/i.test(w.document.querySelector('#trk_card').innerText), 'route via hub'); clean(w, 'track booking');
    const gg = await fresh('en'); try { gg.w.history.replaceState(null, '', 'en.html?track=LD-2026-001841'); gg.ev("S.route='dashboard';S.trackId='';(function(){const sp=new URLSearchParams(location.search);if(sp.get('track')){S.trackId=sp.get('track');S.route='track';}})();render()"); eq(gg.ev('S.route'), 'track'); assert(gg.w.document.querySelector('#trk_card'), 'deep link card'); } finally { gg.done(); }
  });
  await group('por: all W4 screens render in 4 languages without undefined/NaN; DE/EN without Cyrillic', 'ru', async () => {
    for (const lang of LANGS) { const gg = await fresh(lang); try {
      gg.ev("go('orders');ACT.stab({s:'orders',v:'commercial'})"); for (const s of ['customers', 'prices', 'offers', 'contracts', 'crm', 'tasks', 'fx']) { gg.ev(`ACT.cmSec({v:'${s}'})`); clean(gg.w, lang + ' commercial/' + s); if (lang !== 'ru' && lang !== 'kk') { const t = gg.w.document.querySelector('.content').innerText.replace(/ТОО «[^»]*»|ИП «[^»]*»|[А-ЯЁ]\. [А-ЯЁа-яё]+|Туран|Аль-Фараби|Сатпаева|Бухар жырау|Сарыарка|Ерубаева|Тауке хана|Абая|Достык|Космонавтов|Sarah Johnson|SPOT-RU|FW-RU|ЭЦП НУЦ РК|Айгерим С\.|Марат Б\.|Елена К\.|Тимур Ж\.|Ольга П\.|Д\. Ахметов|С\. Нурланова|А\. Ким|Б\. Садыков|демо-подпись/g, ''); const m = t.match(/[А-Яа-яЁё]{3,}/); assert(!m, lang + ' commercial/' + s + ' Cyrillic: ' + (m && m[0])); } }
      gg.ev("ACT.setRole({v:'customer'});go('book')"); clean(gg.w, lang + ' book'); gg.ev("go('mybookings')"); clean(gg.w, lang + ' mybookings');
      gg.ev("ACT.setRole({v:'partner'});go('phandovers')"); clean(gg.w, lang + ' phandovers'); gg.ev("go('pprofile')"); clean(gg.w, lang + ' pprofile');
      gg.ev("ACT.setRole({v:'viewer'});S.trackId='LD-2026-001840';go('track')"); clean(gg.w, lang + ' track'); gg.ev("go('request')"); clean(gg.w, lang + ' request');
      gg.ev("ACT.setRole({v:'customer'});S.help.key='book';go('help')"); assert(/book|Buch|брон/i.test(gg.w.document.querySelector('.help-art h2').innerText), lang + ' portal help article'); clean(gg.w, lang + ' help');
    } finally { gg.done(); } }
  });
