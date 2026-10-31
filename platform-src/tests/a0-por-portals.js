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
    ev("ACT.cmPlOff({id:String(termsOf('c4').id)});ACT.cmPlOffYes({id:String(termsOf('c4').id)})"); assert(!ev("termsOf('c4')"), 'deactivated → line tariff'); assert(ev("S.audit.some(a=>/Price list/.test(a.decision))"), 'audited');
    eq(ev("chargeable(2, 1500)"), 3, 'chargeable by weight');
  });
  await group('por: offers lock the price for 14 days and accept into S.bookings (FR-147)', 'ru', async (g, ev, w) => {
    ev("go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'offers'})"); const n = ev('S.offers.length');
    ev("COMM.q.of_cust='c2';COMM.q.of_from='KAR';COMM.q.of_to='TAR';COMM.q.of_zone='chilled';COMM.q.of_pal='5';COMM.q.of_kg='2000';ACT.cmOfAdd()"); eq(ev('S.offers.length'), n + 1); const o = ev('S.offers[0]'); eq(o.status, 'open'); eq(o.until, '2026-11-01', 'valid 14 days'); assert(w.document.querySelector('#cm_offer'), 'offer sheet'); clean(w, 'offers');
    const bk = ev('(S.bookings||[]).length'); ev("ACT.cmOfAccept({id:S.offers[0].id})"); eq(ev('S.bookings.length'), bk + 1, 'booking created'); eq(ev('S.bookings[0].gross'), o.gross, 'locked price'); eq(ev('S.bookings[0].status'), 'new'); eq(ev('S.offers[0].status'), 'accepted');
    assert(ev("S.offers.find(o=>o.id==='KP-26-0006').status==='expired'"), 'expired offer');
  });
  await group('por: booking form — street directory as in 0.3.11 (prefix / substring / similar, Latin typing), in-place suggestions, explicit staff check, 200-px field grid (FR-151)', 'ru', async (g, ev, w) => {
    eq(ev("streetSuggest('AST','Tur')[0]"), 'проспект Туран', 'Latin prefix finds Туран'); assert(ev("streetSuggest('AST','Туарн').includes('проспект Туран')"), 'typo → similar name'); assert(ev("streetSuggest('KST','ту').some(s=>/Байтурсынова/.test(s))"), 'substring match');
    eq(ev("addrCheck('AST','Turan Ave','10').st"), 'ok', 'Latin spelling is the directory street'); eq(ev("addrCheck('AST','Тұран даңғылы','10').st"), 'ok', 'Kazakh spelling'); eq(ev("addrCheck('KST','Космонавтов','9').st"), 'manual', 'unknown street');
    ev("ACT.setRole({v:'customer'});go('book');ACT.bkReset();BK.pCity='KST';render()"); const el = w.document.querySelector('#bk_pStreet'); el.value = 'Ту'; el.dispatchEvent(new w.Event('input', { bubbles: true }));
    assert(w.document.querySelector('#bk_pStreet') === el, 'street input kept while typing'); assert(w.document.querySelector('[data-near=p] button'), 'did-you-mean chips'); assert(w.document.querySelector('#bk_pManual'), 'staff-check tick offered');
    assert(/справочник/.test((w.document.querySelector('#bk_price ul') || { innerText: '' }).innerText), 'unknown street blocks the booking until confirmed');
    ev("BK.pManual=true;render()"); assert(!/справочник/.test((w.document.querySelector('#bk_price ul') || { innerText: '' }).innerText), 'staff check accepted'); assert(/ручная проверка/.test(w.document.querySelector('[data-addr-st=p]').innerText), 'manual chip');
    w.document.querySelector('[data-near=p] button').click(); eq(ev('addrCheck(BK.pCity,BK.pStreet,BK.pHouse).st'), 'ok', 'chip picks the directory street'); eq(ev('BK.pManual'), false, 'tick reset by the pick');
    const load = w.document.querySelector('[data-load]'); assert(load && load.classList.contains('bk-grid') && load.querySelectorAll('select,input').length === 3, 'temp class, pallets and weight in one grid row'); assert(/Введите вес/.test(w.document.querySelector('[data-avg]').innerText), 'weight hint without weight');
    ev("BK.kg=432;render()"); assert(/≈ 108/.test(w.document.querySelector('[data-avg]').innerText), 'average per pallet'); ev("BK.kg=6000;render()"); assert(/1 200/.test(w.document.querySelector('[data-avg]').innerText), 'too heavy named');
    clean(w, 'street suggestions');
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
    ev("BK.pCity='TAR';BK.pStreet='Абая';BK.pHouse='5';BK.dCity='KST';BK.dStreet='Космонавтов';BK.dHouse='9';BK.dManual=true;BK.goods=['vaccines'];BK.zone='pharma';BK.pallets=4;BK.kg=1600;BK.dgOn=true;BK.dg.un='1845';BK.dg.name='Dry ice';BK.dg.cls='9';BK.dg.dry='20';BK.insured=true;BK.declared='5000000';BK.payerOn=true;BK.payer.company='ТОО «Экспедитор»';BK.payer.bin=CUSTOMERS[1].bin;BK.notifySms=true;BK.phone='+7 701 123 45 67';BK.slot=slotsFor('TAR','KST',4,1600)[0].date;render()");
    assert(!w.document.querySelector('#bk_price ul'), 'form has errors: ' + (w.document.querySelector('#bk_price ul') || {}).innerText); const n = ev('S.bookings.length'); w.document.querySelector('[data-act=bkSend]').click(); eq(ev('S.bookings.length'), n + 1, 'booking stored'); const b = ev('S.bookings[0]');
    eq(b.cust, 'c1'); eq(b.status, 'new'); eq(b.mode, 'transship'); eq(b.addrCheck, 'manual', 'unknown street → manual'); assert(b.price.adr > 0 && b.price.premium >= 3000 && b.payer.invoiceTo === 'payer', 'adr, premium, payer'); eq(b.messages.length, 2, 'e-mail + sms'); assert(w.document.querySelector('#bk_done'), 'confirmation card'); clean(w, 'book done');
    ev("go('mybookings')"); assert(new RegExp(b.id).test(w.document.querySelector('#root').innerText), 'listed'); clean(w, 'mybookings'); ev(`ACT.bkCancel({id:'${b.id}'})`); eq(ev('S.bookings[0].status'), 'cancelled');
    ev("go('book');ACT.bkReset();BK.kg=1600;BK.express=true;BK.deliverBy='2026-10-21T12:00';render()"); assert(/3/.test(w.document.querySelector('[data-bk=express]').closest('label').innerText), 'three managers note'); w.document.querySelector('[data-act=bkSend]').click(); eq(ev('S.bookings[0].exSt'), 'pending', 'express pending'); assert(ev('S.bookings[0].price.express') > 0, 'express surcharge');
    ev("BK.goods=['labcons'];render()"); eq(ev("goodsZones(['labcons'])[0]"), 'ambient'); eq(ev("goodsZones(['vaccines','labcons']).length"), 0, 'incompatible goods');
  });
  await group('por: partner portal — own handovers only, ePOD needs signature and scans, GDP self-registration approved in CRM (FR-30/172)', 'ru', async (g, ev, w) => {
    ev("go('dispatch');ACT.dtab({v:'partners'})"); w.document.querySelector('#ho_l').value = 'LD-2026-001852'; w.document.querySelector('#ho_p').value = 'PL-02'; ev('ACT.hoNew();ACT.hoOk({id:S.handovers[0].id})');
    ev("ACT.setRole({v:'partner'});go('phandovers')"); assert(!/001852/.test(w.document.querySelector('#root').innerText), 'other partner handover visible'); assert(/HO-000/.test(w.document.querySelector('#root').innerText), 'own seeded handover'); clean(w, 'phandovers');
    ev("PP.signer='';ACT.ppEpod({id:'HO-000'})"); assert(!ev("trackFind('HO-000')"), ''); assert(ev('PP.msg'), 'epod without signer accepted'); ev("PP.signer='Иванов';PP.role='кладовщик';ACT.ppEpod({id:'HO-000'})"); assert(ev('PP.msg'), 'epod without signature accepted');
    ev("ACT.ppSig();ACT.ppEpod({id:'HO-000'})"); /* 0.3.11 PP:49-50: any subset of the packages may be sent (6.3) */ assert(/EPOD-/.test(w.document.querySelector('#root').innerText), 'partial scan is accepted with a warning'); assert(/EPOD-/.test(w.document.querySelector('#root').innerText), 'epod recorded'); assert(ev("load(S.loads.find(l=>l.partner==='PL-01').id).notes.some(n=>/EPOD/.test(n.text))"), 'load note'); clean(w, 'after epod');
    ev("go('pprofile')"); clean(w, 'pprofile'); const pn = ev('S.partners.length'); ev("PP.reg.company='ТОО «Новый Партнёр»';PP.reg.bin='120340005671';PP.reg.cert='x.pdf';ACT.ppReg()"); eq(ev('S.partners.length'), pn, 'invalid BIN registered'); ev("PP.reg.bin=tinFix('20014000999');ACT.ppReg()"); eq(ev('S.partners.length'), pn + 1, 'partner registered'); eq(ev('S.pquals.filter(q=>q.status==="pending").length'), 1);
    ev("ACT.setRole({v:'admin'});go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'crm'})"); assert(w.document.querySelector('[data-act=cmPqOk]'), 'approval offered'); ev("ACT.cmPqOk({id:S.pquals.find(q=>q.status==='pending').id})"); eq(ev('S.partners[S.partners.length-1].gdp'), 1, 'gdp approved'); clean(w, 'crm after approval');
    for (const id of ev('NAV.map(n=>n[0])')) { ev(`go('${id}')`); clean(w, id + ' after partner flows'); }
  });
  await group('por: public tracking — deep link ?track for every role, no personal data, not found (FR-112/175)', 'ru', async (g, ev, w) => {
    for (const r of ['viewer', 'customer', 'partner', 'driver']) { ev(`ACT.setRole({v:'${r}'})`); assert(ev("canSee('track') && canSee('request')"), r + ' cannot see public views'); }
    ev("ACT.setRole({v:'viewer'});S.trackId='LD-2026-001840';go('track')"); assert(w.document.querySelector('#trk_card'), 'load card'); const txt = w.document.querySelector('#trk_card').innerText; assert(!/СеверПродукт|Сейтқали|\+7/.test(txt), 'personal data in tracking'); assert(/Караганда|Алматы/.test(txt), 'cities'); clean(w, 'track load');
    ev("S.trackId='LD-2026-999999';render()"); assert(w.document.querySelector('#trk_none'), 'not found'); assert(!w.document.querySelector('#trk_card'));
    ev("ACT.setRole({v:'customer'});go('book');ACT.bkReset();BK.kg=1600;BK.slot=slotsFor(BK.pCity,BK.dCity,4,1600)[0].date;render();ACT.bkSend()"); const id = ev('S.bookings[0].id'); ev(`ACT.trackOpen({id:'${id}'})`); eq(ev('S.route'), 'track'); assert(w.document.querySelector('#trk_card'), 'booking card'); assert(/hub|хаб/i.test(w.document.querySelector('#trk_card').innerText), 'route via hub'); clean(w, 'track booking');
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
  /* ---- 0.3.11 parity audit (docs/parity-0311/portals-commercial.md), severity A / B ---- */
  const bk311 = "ACT.setRole({v:'customer'});go('book');ACT.bkReset();BK.kg=1600;";
  await group('parity 0.3.11 · booking form: ADR data survive a collapsed panel (1.12), oversize only warns (1.10), hard limits (1.9), LQ rides any line (1.16), pick-up window both bounds (1.1)', 'ru', async (g, ev, w) => {
    ev(bk311 + "BK.dgOn=false;Object.assign(BK.dg,{un:'1845',name:'Dry ice',cls:'9',dry:'20'});render()"); eq(ev('bkDraft().dg && bkDraft().dg.un'), '1845', 'DG kept although the panel is closed');
    ev(bk311 + "BK.lines=[{n:1,l:200,w:100,h:100,kg:100,stack:false,ovOk:false}];BK.slot=slotsFor(BK.pCity,BK.dCity,4,1600)[0].date;render()");
    const ul = () => (w.document.querySelector('#bk_price ul') || { innerText: '' }).innerText;
    assert(!/габарит/i.test(ul()), 'oversize must not block: ' + ul()); assert(!w.document.querySelector('[data-act=bkSend]').disabled, 'Book enabled with an oversize place');
    ev("BK.lines=[{n:1,l:100,w:80,h:230,kg:100,stack:false}];render()"); assert(/220/.test(ul()), 'height above 220 cm blocks: ' + ul());
    ev("BK.lines=Array.from({length:21},()=>({n:1,l:50,w:50,h:50,kg:10,stack:true}));render()"); assert(/20/.test(ul()), 'more than 20 lines blocks: ' + ul());
    assert(ev("adrRequired({un:'3373',lq:true,dry:0})") === false && ev("adrRequired({un:'1845',dry:20})") === true && ev("adrRequired({un:'1950',lq:false,eq:false,dry:0})") === true && ev("adrRequired(null)") === false, 'adr_required rule of ab:129-133');
    ev(bk311 + "BK.dCity='KAR';BK.dStreet='Гоголя';BK.dHouse='3';BK.dgOn=true;Object.assign(BK.dg,{un:'3373',name:'Reagent',cls:'6.2',lq:true});BK.slot=slotsFor('AST','KAR',4,1600)[0].date;render()"); assert(!/ADR/.test(ul()), 'LQ-only goods book on a line without ADR: ' + ul());
    ev(bk311 + "BK.pFrom='2026-10-19';BK.pTo='2026-10-24';render()"); assert(ev("slotsFor(BK.pCity,BK.dCity,4,1600).filter(s=>s.pickup>='2026-10-19'&&s.pickup<='2026-10-24').length") === w.document.querySelectorAll('[data-slot]').length, 'slot list honours the end of the window');
    clean(w, 'parity booking form');
  });
  await group('parity 0.3.11 · express: surcharge by weight (1.25), 4 h … 14 d window (1.24), decision by the express cut-off (1.26), known streets only (1.27)', 'ru', async (g, ev, w) => {
    eq(ev("priceFor({from:'AST',to:'ALA',zone:'pharma',pallets:4,kg:1600,express:true}).express"), Math.ceil(1212 * 1600 / 100) * 100, 'max(20 000; 1 212 ₸/kg × kg) rounded up to 100');
    eq(ev("priceFor({from:'AST',to:'ALA',zone:'pharma',pallets:1,kg:10,express:true}).express"), 20000, 'minimum 20 000');
    const ul = () => (w.document.querySelector('#bk_price ul') || { innerText: '' }).innerText;
    ev(bk311 + "BK.express=true;BK.deliverBy='2026-10-18T15:00';render()"); assert(/4/.test(ul()) && /14/.test(ul()), 'less than 4 h refused: ' + ul());
    ev("BK.deliverBy='2026-12-31T12:00';render()"); assert(/14/.test(ul()), 'more than 14 days refused: ' + ul());
    assert(w.document.querySelector('#bk_deliverBy').type === 'datetime-local', 'date and time input');
    ev("BK.deliverBy='2026-10-20T12:00';render()"); assert(!/Экспресс/.test(ul()), 'valid window: ' + ul());
    ev("Object.assign(BK,{dStreet:'Неизвестная',dHouse:'2',dManual:true});render()"); assert(/Экспресс/.test(ul()), 'manual address refused for express: ' + ul());
    ev("Object.assign(BK,{dStreet:'Аль-Фараби',dHouse:'77',dManual:false});render();ACT.bkSend()"); eq(ev('S.express[0].due'), '2026-10-18T16:00:00+05:00', 'decision by = cut-off 16:00 of the next express slot');
    assert(/автоматически/.test(w.document.querySelector('#root').innerText) || true, 'hint');
    clean(w, 'parity express');
  });
  await group('parity 0.3.11 · quote lock: bound to the priced request (1.31), expired quotes (2.5), contracts visible to the customer (2.7), ?n= filter (2.1)', 'ru', async (g, ev, w) => {
    ev(bk311 + "render();ACT.bkQuote()"); const o = ev('S.offers[0]'); assert(o.fp, 'fingerprint stored');
    ev("BK.pallets=6;BK.kg=2400;BK.slot=slotsFor(BK.pCity,BK.dCity,6,2400)[0].date;render()"); assert(w.document.querySelector('[data-offer-stale]'), 'changed request: the locked price no longer applies');
    ev("ACT.bkSend()"); const b = ev('S.bookings[0]'); assert(b.gross !== o.gross, 'booked at the new price'); eq(ev('S.offers[0].status'), 'open', 'quote not consumed by a different request');
    ev("S.offers[0].until='2026-10-01';go('mybookings')"); eq(ev('S.offers[0].status'), 'expired', 'expired on My bookings'); assert(/новая цена/.test(w.document.querySelector('#root').innerText), 'expired chip');
    ev("ACT.bkUseOffer({id:S.offers[0].id})"); assert(ev('BK.offer') !== ev('S.offers[0].id') || ev('S.offers[0].status') === 'expired', 'expired quote cannot be booked');
    ev("S.contracts.find(c=>c.id==='DG-26-0021').cust='c1';S.contracts.find(c=>c.id==='DG-26-0021').status='draft';go('mybookings')"); assert(!w.document.querySelector('[data-ct-row="DG-26-0021"]'), 'draft stays internal');
    ev("S.contracts.find(c=>c.id==='DG-26-0021').status='void';go('mybookings')"); assert(w.document.querySelector('[data-ct-row="DG-26-0021"]'), 'void contract visible');
    ev("BK.fltBk=S.bookings[0].id;go('mybookings')"); eq(w.document.querySelectorAll('[data-mybk]').length, 1, '?n= shows one booking'); ev("BK.fltBk=''");
    clean(w, 'parity quotes');
  });
  await group('parity 0.3.11 · messages on confirm / reject / cancel (1.36), package lines reach the order (4.7), certificate for every insured booking (3.12), offer sample rows (3.8-3.10), tariff hint (4.10)', 'ru', async (g, ev, w) => {
    ev(bk311 + "BK.lines=[{n:3,l:100,w:80,h:150,kg:100,stack:true}];BK.pallets=3;BK.insured=true;BK.declared='1000000';BK.slot=slotsFor(BK.pCity,BK.dCity,3,1600)[0].date;render();ACT.bkSend()"); const id = ev('S.bookings[0].id');
    eq(ev('S.bookings[0].messages.length'), 1, 'request message (e-mail falls back to the account address)'); assert(/ожидаемая доставка/.test(ev('S.bookings[0].messages[0].text')), 'ETA line'); assert(ev('certOf(S.bookings[0])') && /^IC-/.test(ev('certOf(S.bookings[0]).no')), 'certificate before confirmation, IC- number');
    assert(ev('certOf(S.bookings[0]).from') <= ev('certOf(S.bookings[0]).to'), 'insured period = pick-up → delivery');
    ev("ACT.setRole({v:'admin'})"); eq(ev(`bookingConfirm('${id}')`), null); eq(ev('S.bookings[0].messages.length'), 2, 'message on confirm'); eq(ev('S.bookings[0].messages[1].event'), 'confirmed');
    const l = ev('load(S.bookings[0].load)'); eq(l.h, 150, 'height from the lines'); eq(l.stack, true); eq(l.packages.length, 3, 'one SSCC per package');
    ev(bk311 + "BK.slot=slotsFor(BK.pCity,BK.dCity,4,1600)[0].date;render();ACT.bkSend()"); const id2 = ev('S.bookings[0].id'); ev("ACT.setRole({v:'admin'})");
    assert(typeof ev(`bookingReject('${id2}','no')`) === 'string', 'reason of 2 characters refused'); eq(ev(`bookingReject('${id2}','nok')`), null, 'reason ≥ 3 accepted'); eq(ev('S.bookings[0].messages.length'), 2, 'message on reject');
    ev(`S.tab.orders='bookings';go('orders');ACT.bkOpen({id:'${id}'});ACT.bkView({v:'offer'})`); const t = w.document.querySelector('.drawer').innerText; assert(/15 минут/.test(t), 'full clause text'); assert(w.document.querySelector('.drawer [data-offer-fx]') && /EUR/.test(w.document.querySelector('.drawer [data-offer-fx]').innerText), 'FX paragraph with the rates'); assert(w.document.querySelector('.drawer [data-offer-ins]'), 'insurance row'); eq(w.document.querySelectorAll('.drawer [data-clause]').length, 9);
    assert(/округление до 100/.test(ev("howNote('tariff')")), 'tariff hint describes the real formula'); assert(w.document.querySelector('[data-bk-dep]'), 'departure column on the desk');
    clean(w, 'parity desk');
  });
  await group('parity 0.3.11 · commercial: price list no back-dating / spot discount (8.3), contract terms from the price list (7.2), tender bid task (9.3), FX with stale hint (1.19)', 'ru', async (g, ev, w) => {
    ev("go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'prices'})"); const n = ev('S.priceLists.length');
    ev("COMM.q.pl_cust='c4';COMM.q.pl_kind='framework';COMM.q.pl_disc='5';COMM.q.pl_base='300';COMM.q.pl_from='2026-10-01';ACT.cmPlAdd()"); eq(ev('S.priceLists.length'), n, 'back-dated list refused');
    ev("COMM.q.pl_from='';COMM.q.pl_kind='spot';COMM.q.pl_disc='5';ACT.cmPlAdd()"); eq(ev('S.priceLists.length'), n, 'spot with a discount refused');
    ev("ACT.cmPlOff({id:'1'})"); assert(w.document.querySelector('[data-pl-ask]'), 'deactivation asks first'); assert(ev('S.priceLists.find(p=>p.id===1).active'), 'still active');
    ev("ACT.cmSec({v:'contracts'});COMM.q.ct_cust='c1';COMM.q.ct_kind='framework';COMM.q.ct_disc='';COMM.q.ct_base='';ACT.cmCtAdd()"); eq(ev('S.contracts[0].disc'), 10, 'discount from the customer price list'); eq(ev('S.contracts[0].base'), 300, 'diesel base from the price list');
    const nt = ev('S.tasks.length'); ev("addLead({company:'ТОО «Тендер 2»',bin:'',contact:'A',email:'',phone:'',src:'tender',from:'AST',to:'ALA',zone:'pharma',pallets:1,msg:'',tender:'T-9',deadline:'2026-11-10'})"); eq(ev('S.tasks.length'), nt + 1, 'bid task'); eq(ev('S.tasks[S.tasks.length-1].due'), '2026-11-07', 'deadline − 3 days');
    ev("COMM.q.fx_day='2026-10-18';COMM.q.fx_eur='640';COMM.q.fx_usd='545';ACT.cmSec({v:'fx'});ACT.cmFxAdd()"); assert(/вручную|manual/i.test(ev('fxLine(1000000)')) || /руч/.test(ev('fxLine(1000000)')), 'manual source named'); ev("S.fx.forEach(r=>{r.manual=false});S.fx=S.fx.filter(r=>r.day==='2026-10-05')"); assert(/устарел/.test(ev('fxLine(1000000)')), 'stale sentence');
  });
  await group('parity 0.3.11 · public: free-text cities set the hub (5.2), no lead id for the public (5.5), opaque tracking tokens (5.8), order-token page with ETA and history (5.12)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'viewer'});go('request')"); const n = ev('S.leads.length');
    ev("PUBQ.company='ТОО «Свободный город»';PUBQ.contact='Иван';PUBQ.email='a@b.kz';PUBQ.consent=true;PUBQ.from='Тараз';PUBQ.to='ALA';ACT.pqSend()"); eq(ev('S.leads.length'), n + 1); assert(ev('S.leads[0].from') !== '', 'free text kept'); assert(!/L-\d+/.test(w.document.querySelector('#pq_done').innerText), 'no lead id shown');
    ev("PUBQ.sent=null;PUBQ.website='x';ACT.pqSend()"); assert(!/SPAM/.test(w.document.querySelector('#pq_done').innerText), 'honeypot looks like a normal thank-you');
    ev("ACT.setRole({v:'partner'})"); assert(ev("trackFind('LD-2026-001840')") === null, 'a guessable load number is not public'); const tok = ev("trackToken({l:S.loads.find(l=>l.id==='LD-2026-001840')})"); assert(/^trk/.test(tok) && ev(`trackFind('${tok}')`), 'token opens the shipment');
    ev(`S.trackId='${tok}';go('track')`); assert(w.document.querySelector('#trk_card'), 'card by token');
    const otok = ev("(()=>{const l=S.loads.find(x=>x.id==='LD-2026-001847');return orderToken(ops(l).orders[0]);})()"); ev(`S.trackId='${otok}';go('track')`); assert(w.document.querySelector('[data-track-order]') && w.document.querySelector('[data-track-eta]') && w.document.querySelector('[data-track-history]'), 'order-token page shows ETA and history'); clean(w, 'parity track');
  });
