/* ---- phases 3-5: hubs, POD -> invoice -> ESF -> payment ---- */
  await group('receiving: Standgeld 6 000 ₸ per started 30 min after 45 min', 'ru', async (g, ev) => { eq(ev('RECV.rate'), 6000); eq(ev('RECV.free'), 45); eq(ev('RECV.step'), 30); });
  await group('delivered -> POD -> invoice -> ESF -> paid', 'ru', async (g, ev, w) => {
    const L = 'LD-2026-001840'; ev(`ACT.pDemo({id:'${L}'});ACT.pSubmit({id:'${L}'})`); eq(ev(`load('${L}').pod`), 'submitted');
    ev(`ACT.pApprove({id:'${L}'})`); if (ev(`load('${L}').pod`) !== 'approved') { ev(`openDrawer({type:'pod',id:'${L}'})`); const acc = w.document.querySelector('#pacc'); if (acc) acc.checked = true; ev(`ACT.pApprove({id:'${L}'})`); }
    eq(ev(`load('${L}').pod`), 'approved', 'POD approved'); const inv = ev(`invOfLoad('${L}').id`); assert(inv, 'invoice created on approval');
    ev(`ACT.bEsf({id:'${inv}'})`); eq(ev(`load('${L}').esf`), 'issued'); ev(`ACT.bEsfOk({id:'${inv}'})`); eq(ev(`load('${L}').esf`), 'confirmed'); ev(`ACT.bPay({id:'${inv}'})`); assert(ev(`invOfLoad('${L}').paidAt`), 'not paid');
  });
  await group('open dispute blocks sending, ESF and payment; resolving frees them', 'ru', async (g, ev) => {
    const inv = ev(`invOfLoad('LD-2026-001841').id`); ev(`invOfLoad('LD-2026-001841').dispute={open:true,reason:'temp',text:'x',notes:[]}`);
    ev(`ACT.bSend({id:'${inv}'});ACT.bPay({id:'${inv}'})`); assert(!ev(`invOfLoad('LD-2026-001841').sent`) && !ev(`invOfLoad('LD-2026-001841').paidAt`), 'blocked actions went through');
    ev(`ACT.bDisClose({id:'${inv}'});ACT.bPay({id:'${inv}'})`); assert(ev(`invOfLoad('LD-2026-001841').paidAt`), 'payment still blocked after resolve');
  });
  await group('invoice maths: VAT 12 % and totals', 'ru', async (g, ev) => { assert(ev(`S.invoices.every(i=>Math.abs(i.vat-Math.round(i.net*0.12))<=1&&i.net+i.vat===i.total&&i.lines.reduce((s,x)=>s+x.amount,0)===i.net)`), 'invoice arithmetic'); });
