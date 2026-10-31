  /* ---- H6 parity 0.3.11 (docs/parity-0311/autotests-gap.md, file h6): insurance and FX in price and sample, customer price-list line,
     NCALayer message, second lead with the same BIN, FR-190 help article, FR-185 warnings in DE / EN ---- */
  await group('por: insurance premium 0.15 % (min 3 000 tenge) outside VAT; EUR / USD at the NBK rate with its date in price and offer sample (0.3.11 «Страхование: премия … BUG-30», 575)', 'ru', async (g, ev, w) => {
    eq(ev('INS.rate'), 0.0015, 'rate'); eq(ev('INS.min'), 3000, 'minimum');
    const b = { from: 'TAR', to: 'SHY', zone: 'pharma', pallets: 4, kg: 1600 }, J = JSON.stringify;
    eq(ev(`priceFor(${J(Object.assign({ insured: true, declared: 10000000 }, b))}).premium`), 15000, '10 M x 0.15 %');
    eq(ev(`priceFor(${J(Object.assign({ insured: true, declared: 1000000 }, b))}).premium`), 3000, 'minimum applies below 2 M');
    eq(ev(`priceFor(${J(Object.assign({ insured: false, declared: 10000000 }, b))}).premium`), 0, 'not insured: no premium');
    const p = ev(`priceFor(${J(Object.assign({ insured: true, declared: 10000000 }, b))})`);
    eq(p.vat, Math.round(p.net * ev('VAT')), 'VAT is taken on the net without the premium'); eq(p.gross, p.net + p.vat + 15000, 'gross = net + VAT + premium');
    const fx = ev('fxLatest()'); assert(fx.EUR > 0 && fx.USD > 0 && /^\d{4}-\d\d-\d\d$/.test(fx.day), 'NBK rate with a date'); eq(ev('fxConv(10000000, S.fx[2].EUR)'), Math.round(10000000 / 631.8 * 100) / 100, 'conversion');
    ev("ACT.setRole({v:'customer'});go('book');ACT.bkReset();BK.pCity='TAR';BK.pStreet='Абая';BK.pHouse='5';BK.dCity='SHY';BK.dStreet='Абая';BK.dHouse='10';BK.goods=['vaccines'];BK.zone='pharma';BK.pallets=4;BK.kg=1600;BK.insured=true;BK.declared=10000000;render()");
    const root = w.document.querySelector('#root').innerText;
    assert(/15 000 ₸/.test(w.document.querySelector('#bk_price').innerText), 'premium in the price block'); assert(/Страхов/.test(w.document.querySelector('#bk_price').innerText), 'premium row labelled');
    assert(/€ \/ .*\$ · по курсу НБ РК на \d\d\.\d\d\.2026/.test(w.document.querySelector('#bk_price').innerText), 'price block: € and $ at the NBK rate with the date');
    assert(/€/.test(root) && /\$/.test(root) && /по курсу НБ РК на \d\d\.\d\d\.2026/.test(w.document.querySelector('.bk-grid .sub') ? root : ''), 'insurance field shows € and $ at the NBK date');
    ev('ACT.bkOfferDoc()'); const doc = w.document.querySelector('[data-offer-doc]'); assert(doc, 'sample opens');
    assert(/Страховая премия \(без НДС\)/.test(doc.innerText) && /10 000 000/.test(doc.innerText), 'sample: insurance row (not subject to VAT) and the insured value');
    const dfx = w.document.querySelector('[data-offer-fx]'); assert(dfx && /€/.test(dfx.textContent) && /\$/.test(dfx.textContent) && /курс НБ РК на \d\d\.\d\d\.2026/.test(dfx.textContent), 'sample: € / $ with the NBK date: ' + (dfx && dfx.textContent));
    assert(/страховая стоимость/.test(dfx.textContent) && /премия/.test(dfx.textContent), 'sample: insured value and premium converted'); clean(w, 'offer sample');
  });
  await group('por: portal price shows the customer price-list line (framework · -10 % · diesel 340 / base 300), discount and fuel rows; the sample repeats it (0.3.11 753)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'customer'});S.custId='c1';go('book');ACT.bkReset();BK.pCity='ALA';BK.pStreet='Абая';BK.pHouse='5';BK.dCity='TAR';BK.dStreet='Абая';BK.dHouse='10';BK.goods=['vaccines'];BK.zone='pharma';BK.pallets=4;BK.kg=1600;render()");
    const pl = w.document.querySelector('#bk_price [data-price-list]'); assert(pl, 'price-list line');
    assert(/Прайс-лист клиента #1/.test(pl.textContent) && /рамочный/.test(pl.textContent) && /−10 %/.test(pl.textContent) && /дизель 340 \/ база 300/.test(pl.textContent), 'line: ' + pl.textContent);
    const price = w.document.querySelector('#bk_price').innerText; assert(/Скидка по рамочному договору/.test(price) && /-\d[\d ]* ₸/.test(price), 'discount row'); assert(/Топливная надбавка\s+\d[\d ]* ₸/.test(price), 'fuel surcharge row');
    const pf = ev("priceFor({from:'ALA',to:'TAR',zone:'pharma',pallets:4,kg:1600,cust:'c1'})"); assert(pf.discount > 0 && pf.fuel > 0, 'discount and surcharge in the model'); eq(pf.terms.diesel, 340); eq(pf.terms.base, 300);
    ev('ACT.bkOfferDoc()'); const doc = w.document.querySelector('[data-offer-doc]'); assert(doc, 'sample'); const line = [...doc.querySelectorAll('p.note')].find(e => /Прайс-лист клиента/.test(e.textContent));
    assert(line && /−10 %/.test(line.textContent) && /дизель 340 \/ база 300/.test(line.textContent), 'sample repeats the price-list line'); assert(/Топливная надбавка/.test(doc.innerText) && /Скидка/.test(doc.innerText), 'sample shows discount and surcharge'); eq(line.textContent, pl.textContent, 'same line in price and sample');
    ev('closeDrawer()'); ev("S.custId='c4';render()"); assert(!w.document.querySelector('#bk_price [data-price-list]'), 'a customer without a list has no price-list line (line tariff)');
    ev("S.custId='c2';render()"); assert(/спот/.test((w.document.querySelector('#bk_price [data-price-list]') || { textContent: '' }).textContent), 'spot list is named spot'); clean(w, 'price-list line');
  });
  await group('por: «Sign with EDS (NCALayer)» without NCALayer shows the message «NCALayer не запущен» and the contract stays sent (0.3.11 «NCALayer не запущен», 732)', 'ru', async (g, ev, w) => {
    /* 0.3.11 talked to a local NCALayer socket; v6 mocks it: NCA.running=false is the "not started" state of that mock */
    assert(ev("typeof NCA==='object' && NCA.running===true"), 'NCALayer mock is running by default');
    ev("go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'contracts'});COMM.q.ct_cust='c2';COMM.q.ct_kind='framework';COMM.q.ct_disc='8';COMM.q.ct_base='340';ACT.cmCtAdd();ACT.cmCtSend({id:S.contracts[0].id})");
    const id = ev('S.contracts[0].id'); eq(ev('S.contracts[0].status'), 'sent');
    ev("NCA.running=false;ACT.setRole({v:'customer'});S.custId='c2';go('mybookings')"); ev(`ACT.bkCtOpen({id:'${id}'});closeDrawer();render()`);
    const btn = w.document.querySelector(`[data-act=bkSign][data-id="${id}"]`); assert(btn && !btn.disabled, 'sign button after reading the text'); btn.click();
    const err = w.document.querySelector('[data-ct-err]'); assert(err && /NCALayer не запущен/.test(err.textContent), 'message: ' + (err && err.textContent)); eq(ev('S.contracts[0].status'), 'sent', 'status unchanged without a signature'); assert(!ev("activeFramework('c2')"), 'framework not active'); assert(!w.document.querySelector('[data-ct-msg]'), 'no success notice'); clean(w, 'ncalayer message');
    ev("NCA.running=true"); w.document.querySelector(`[data-act=bkSign][data-id="${id}"]`).click(); eq(ev('S.contracts[0].status'), 'signed', 'signs when NCALayer runs'); assert(!w.document.querySelector('[data-ct-err]'), 'message cleared');
  });
  for (const lang of ['de', 'en']) await group('[' + lang + '] por: NCALayer message and booking warnings (weight per pallet, places) without Cyrillic (0.3.11 744-745, FR-185)', lang, async (g, ev, w) => {
    ev("ACT.setRole({v:'customer'});go('book');ACT.bkReset();BK.kg=6000;BK.pallets=4;render()"); const t = w.document.querySelector('#root').innerText;
    assert(w.document.querySelector('[data-avg]') && /1[ ,.  ]?200/.test(w.document.querySelector('[data-avg]').innerText), 'too heavy per pallet is named'); assert(!/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(t), 'Cyrillic in the booking form: ' + (t.match(/.{0,20}[А-Яа-яЁё].{0,20}/) || [''])[0]);
    ev("NCA.running=false;ACT.setRole({v:'admin'})"); ev("go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'contracts'});COMM.q.ct_cust='c2';COMM.q.ct_kind='spot';ACT.cmCtAdd();ACT.cmCtSend({id:S.contracts[0].id})");
    const id = ev('S.contracts[0].id'); ev(`ACT.setRole({v:'customer'});S.custId='c2';go('mybookings');ACT.bkCtOpen({id:'${id}'});closeDrawer();render()`); w.document.querySelector(`[data-act=bkSign][data-id="${id}"]`).click();
    const err = w.document.querySelector('[data-ct-err]'); assert(err && /NCALayer/.test(err.textContent) && /not|nicht/.test(err.textContent), 'message in the page language: ' + (err && err.textContent)); assert(!/[А-Яа-яЁё]/.test(err.textContent), 'Cyrillic in the NCALayer message'); eq(ev('S.contracts[0].status'), 'sent');
  });
  await group('por: a second lead with the same BIN joins the same customer; the first one creates it (0.3.11 FR-127 «тот же клиент», 652)', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'});go('orders');ACT.stab({s:'orders',v:'commercial'});ACT.cmSec({v:'crm'})"); const bin = ev("tinFix('19024000999')"); assert(ev(`tinCheck(${JSON.stringify(bin)}).valid`), 'test BIN valid');
    const add = (name) => { ev(`COMM.q.ld_company='${name}';COMM.q.ld_src='tender';COMM.q.ld_deadline='2026-12-01';COMM.q.ld_tender='T-1';COMM.q.ld_bin=${JSON.stringify(bin)};ACT.cmLeadAdd()`); return ev('S.leads[0].id'); };
    const n0 = ev('S.leads.length'), cu0 = ev('S.customers.length'); const a = add('BIN Test A'), b = add('BIN Test B'); eq(ev('S.leads.length'), n0 + 2, 'two leads'); assert(a !== b, 'two ids'); eq(ev(`S.leads.find(l=>l.id==='${a}').bin`), bin); eq(ev(`S.leads.find(l=>l.id==='${b}').bin`), bin);
    ev(`ACT.cmLead({id:'${a}',v:'won'})`); eq(ev('S.customers.length'), cu0 + 1, 'first lead creates the customer'); const c1 = ev(`S.leads.find(l=>l.id==='${a}').custId`); assert(c1, 'customer id on the first lead');
    ev(`ACT.cmLead({id:'${b}',v:'won'})`); eq(ev('S.customers.length'), cu0 + 1, 'second lead creates no duplicate'); eq(ev(`S.leads.find(l=>l.id==='${b}').custId`), c1, 'same customer'); eq(ev(`S.customers.filter(c=>c.bin===${JSON.stringify(bin)}).length`), 1, 'one customer per BIN');
    eq(ev(`S.leads.find(l=>l.id==='${b}').onbExisted`), true, 'marked as joining an existing customer'); clean(w, 'crm after dedup');
  });
  await group('help: FR-190 article «Bookings – confirm, reject or cancel» exists with DE / EN text and no Cyrillic (0.3.11 744-745)', 'ru', async (g, ev) => {
    const a = ev("(function(){var a=helpArt('orders/bookings');return a&&{key:a.key,fr:a.fr,title:a.title,purpose:a.purpose,who:a.who,rules:a.rules}})()"); assert(a, 'article orders/bookings'); assert(/FR-190/.test(a.fr), 'FR-190 named: ' + a.fr);
    assert(/подтвердить, отклонить или отменить/.test(a.purpose[0]), 'RU: confirm, reject or cancel'); assert(/bestätigen, ablehnen oder stornieren/.test(a.purpose[1]), 'DE purpose'); assert(/confirm, reject or cancel/.test(a.purpose[2]), 'EN purpose');
    assert(a.title[1] && a.title[2], 'DE / EN title'); const cyr = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/; assert(![a.title[1], a.title[2], a.purpose[1], a.purpose[2]].concat((a.rules || []).flatMap(r => [r[1], r[2]])).some(s => cyr.test(s)), 'Cyrillic in the DE / EN text');
    assert(ev("HELP.articles.some(function(x){return x.screen==='mybookings'&&/\\b190\\b/.test(x.fr)})"), 'portal article mybookings carries FR-190 as well');
  });
