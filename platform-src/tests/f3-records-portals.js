  /* ---- R6 · 0.3.9 parity, records and portals: «Новые записи» (720–722), «Логотипы производителей» (714), «Портал: бронирование v2»
     (BUG-29 / FR-150 / FR-185: weight per pallet, address book) ---- */
  await group('reference data: a new manufacturer entry is active at once, named in the list and audited in the hash chain; a bad key or a read-only master is refused (0.3.9 «Новые записи» / logos)', 'ru', async (g, ev, w) => {
    const n = ev("refItems('manufacturer').length"); assert(n >= 6, 'manufacturer master ' + n);
    eq(typeof ev("refSave('manufacturer', 'x y!', {name:'Bad'})"), 'string', 'bad key refused');
    const v = ev("refSave('manufacturer', 'r6labs', {ab:'R6', name:'R6 Labs GmbH', co:'R6 Labs GmbH, Bremen', url:'r6labs.example'})");
    eq(v && v.status, 'active', 'new entry active without a second approval'); eq(ev("refItems('manufacturer').length"), n + 1, 'listed');
    eq(ev("refFind('manufacturer','r6labs').label"), 'R6 Labs GmbH', 'label = name');
    eq(typeof ev("refSave('manufacturer', 'r6labs', {name:'R6 Labs GmbH'})"), 'string', 'no change → refused');
    assert(/manufacturer\/r6labs/.test(ev('S.audit[0].subject')), 'audit entry'); assert(ev('auditVerify().ok'), 'audit chain still verifies');
    ev("go('settings');setTab('settings','ref')"); w.document.querySelector('[data-act="rfKind"][data-v="manufacturer"]').click();
    assert(/R6 Labs GmbH/.test(w.document.querySelector('#main-content').innerText), 'entry visible in the manufacturer master');
    clean(w, 'reference data');
  });
  await group('drivers: "+ Driver" needs a name of 3–150 characters, creates the driver with a masked phone; read-only roles are refused (0.3.9 722 / FR-82)', 'ru', async (g, ev, w) => {
    const d = w.document, n = ev('S.drivers.length');
    ev("go('drivers')"); d.querySelector('[data-act="addD"]').click(); assert(d.querySelector('#nd_name'), 'form opens');
    d.querySelector('#nd_name').value = 'Ма'; d.querySelector('[data-act="saveD"]').click();
    assert(d.querySelector('#nd_err').textContent.length > 5, 'two characters refused (0.3.9: min 3)'); eq(ev('S.drivers.length'), n, 'not created');
    d.querySelector('#nd_name').value = 'Мадина Оспанова'; d.querySelector('[data-act="saveD"]').click();
    eq(ev('S.drivers.length'), n + 1, 'created'); const x = ev('S.drivers[S.drivers.length - 1]');
    eq(x.name, 'Мадина Оспанова'); assert(!/\d{3} \d{2} \d{2}$/.test(x.phone), 'phone not a real number: ' + x.phone); eq(ev('S.drawer.type'), 'driver', 'driver card opens');
    ev('closeDrawer()'); ev("ACT.setRole({v:'viewer'})"); ev("go('drivers')");
    const b = d.querySelector('[data-act="addD"]'); if (b) { b.click(); assert(!ev("S.drawer && S.drawer.type === 'addDriver'"), 'viewer cannot open the form'); assert(d.querySelector('.toast.err'), 'refusal shown'); }
    ev("ACT.setRole({v:'admin'})"); clean(w, 'drivers');
  });
  await group('portal booking: weight per pallet above 1 200 kg blocks the price with a message, 1 200 kg passes; an address-book entry fills the pickup address (0.3.9 BUG-29 / FR-185 / FR-150)', 'ru', async (g, ev, w) => {
    const d = w.document; ev("ACT.setRole({v:'customer'});go('book')");
    ev("BK.pCity='TAR';BK.pStreet='Абая';BK.pHouse='5';BK.dCity='KST';BK.dStreet='Космонавтов';BK.dHouse='9';BK.dManual=true;BK.goods=['vaccines'];BK.zone='pharma';BK.pallets=2;BK.kg=2600;render()");
    const err = () => (d.querySelector('#bk_price ul') || { innerText: '' }).innerText;
    assert(/1 200/.test(err()), 'over 1 200 kg per pallet named: ' + err());
    ev('BK.kg=2400;render()'); assert(!/1 200/.test(err()), '1 200 kg per pallet accepted: ' + err());
    const book = ev('custOf(S.custId).book'); assert(book.length >= 1, 'customer has an address book');
    const sel = d.querySelector('[data-bk="pBook"]'); assert(sel, 'address-book select'); sel.value = book[0].id; sel.dispatchEvent(new w.Event('change', { bubbles: true })); sel.dispatchEvent(new w.Event('input', { bubbles: true }));
    eq(ev('BK.pCity'), book[0].city, 'city from the book'); eq(ev('BK.pStreet'), book[0].street, 'street from the book'); eq(ev('BK.pHouse'), book[0].house, 'house from the book');
    ev("ACT.setRole({v:'admin'})"); clean(w, 'booking');
  });
