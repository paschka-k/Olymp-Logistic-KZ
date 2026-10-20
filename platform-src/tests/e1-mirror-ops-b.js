  /* ---- R1-b · mirror 0.3.9: Load & weight (L3, L9), Shipments (H4, H5, H7, H8, H9), Documents KZ gate (G6–G10) ---- */
  const E1_CYR = /[Ѐ-ӿ]/;
  await group('R1 L3: ticking an order on Load & weight needs orders:write or trips:write; rows stay disabled otherwise', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'viewer'}); S.ops.sel = 'LD-2026-001850'; go('orders'); ACT.stab({s:'orders',v:'loadw'})"); const d = w.document;
    assert(!ev('lwCanTick()'), 'viewer has no write right'); assert(d.querySelector('[data-order][data-ro]') && !d.querySelector('[data-act=lwOrd]'), 'rows read-only'); assert(d.querySelector('[data-order][data-ro] input[type=checkbox]').disabled, 'checkbox disabled');
    const o = ev("ops(load('LD-2026-001850')).orders[0].id"); ev(`ACT.lwOrd({id:'LD-2026-001850', o:'${o}'})`); assert(ev("ops(load('LD-2026-001850')).orders[0].on") !== false, 'action refused without the right');
    ev("ACT.setRole({v:'warehouse'})"); assert(ev('lwCanTick()') && d.querySelector('[data-act=lwOrd]'), 'warehouse (orders:write) may tick'); d.querySelector(`[data-act=lwOrd][data-o="${o}"]`).click(); eq(ev("ops(load('LD-2026-001850')).orders[0].on"), false, 'order unticked');
    ev("ACT.setRole({v:'dispatcher'})"); assert(ev('lwCanTick()'), 'dispatcher (trips:write) may tick'); clean(w, 'load read-only');
  });
  await group('R1 L9: truck finder empty state "No ticked orders" and the trailers note', 'ru', async (g, ev, w) => {
    ev("ACT.setRole({v:'admin'}); S.ops.sel = 'LD-2026-001850'; go('orders'); ACT.stab({s:'orders',v:'loadw'})"); const d = w.document;
    assert(d.querySelector('[data-note=trailers]'), 'trailers note (fleet catalogue has trailers P01 / P02)'); assert(!d.querySelector('[data-sim-empty]'), 'no empty state with ticked orders');
    ev("ops(load('LD-2026-001850')).orders.forEach(o => { o.on = false; }); render()"); const e = d.querySelector('[data-sim-empty]'); assert(e && /Нет отмеченных заказов — нечего подбирать\./.test(e.textContent), 'empty state text'); eq(e.getAttribute('data-sim-best'), '', 'nothing recommended');
    ev("RES.DEMO_X = RES.DEMO_X.filter(t => !/^p/.test(t.id)); render()"); assert(!d.querySelector('[data-note=trailers]'), 'no trailers → no note'); clean(w, 'finder empty');
  });
  await group('R1 H4 / H5: label sender = company · hub, recipient = KDL branch or third-party consignee (also ZPL); handling marks row', 'ru', async (g, ev, w) => {
    const L = 'LD-2026-001856', o = ev(`ops(load('${L}')).orders.find(x => /^T-/.test(x.id)).id`), s3 = ev(`ops(load('${L}')).orders.find(x => x.id === '${o}').places[0].sscc`), s1 = ev(`ops(load('${L}')).orders.find(x => !/^T-/.test(x.id) && x.cls === 'pharma').places[0].sscc`);
    ev(`S.ops.shipLoad = '${L}'; S.ops.shipSel = '${s3}'; go('orders'); ACT.stab({s:'orders',v:'ship'})`); const d = w.document, lab = () => d.querySelector('[data-label] .sh-lab').textContent;
    assert(/ТОО «Olymp Logistic» · хаб Астана/.test(lab()), 'sender with hub'); assert(lab().includes(ev(`ops(load('${L}')).orders.find(x => x.id === '${o}').to`)) && !/Филиал KDL Olymp/.test(lab()), 'third-party consignee');
    const m3 = [...d.querySelectorAll('[data-marks] .sh-mark')].map(e => e.textContent); assert(m3.includes('СТОРОННИЙ ГРУЗ') && m3.includes('IVD · медицинские изделия') && m3.includes('Хрупкое · не кантовать') && m3.includes('+15…+25 °C · БЕРЕЧЬ ОТ МОРОЗА'), 'third-party ambient marks: ' + m3.join(' | '));
    assert(d.querySelector('[data-label] .sh-lab .sub') && /\(02\)/.test(d.querySelector('[data-label] .sh-lab .sub').textContent), 'GS1 AI line kept');
    const z3 = ev(`shipLabelZpl('${L}', '${s3}')`); assert(/Отправитель: ТОО «Olymp Logistic» · хаб Астана/.test(z3) && /Получатель: /.test(z3) && !/Филиал KDL Olymp/.test(z3), 'ZPL sender / consignee');
    ev(`ACT.shPick({s:'${s1}'})`); assert(/Филиал KDL Olymp · /.test(lab()), 'own order → KDL branch'); assert(/Филиал KDL Olymp · /.test(ev(`shipLabelZpl('${L}', '${s1}')`)), 'ZPL branch');
    const m1 = [...d.querySelectorAll('[data-marks] .sh-mark')].map(e => e.textContent); assert(m1.includes('+2…+8 °C · НЕ ЗАМОРАЖИВАТЬ') && !m1.includes('СТОРОННИЙ ГРУЗ'), '2–8 °C mark');
    const box = ev(`ops(load('${L}')).orders.find(x => x.box).places[0].sscc`); ev(`ACT.shPick({s:'${box}'})`); assert([...d.querySelectorAll('[data-marks] .sh-mark')].some(e => e.textContent === '−20 °C · СУХОЙ ЛЁД UN 1845'), 'dry ice mark');
    const adr = ev(`(ops(load('${L}')).orders.find(x => x.adr && !x.box) || {places:[{}]}).places[0].sscc`); if (adr) { ev(`ACT.shPick({s:'${adr}'})`); assert([...d.querySelectorAll('[data-marks] .sh-mark')].some(e => e.textContent === 'ДОПОГ · LQ'), 'ADR LQ mark'); }
    const sh = ev("(() => { for (const l of S.loads) for (const o of ops(l).orders) if ((new Date(o.lines[0].exp) - new Date(l.eta)) / 864e5 < 90) return [l.id, o.places[0].sscc]; return null; })()"); if (sh) { ev(`S.ops.shipArch = true; ACT.shSel({id:'${sh[0]}'}); ACT.shPick({s:'${sh[1]}'})`); assert([...d.querySelectorAll('[data-marks] .sh-mark')].some(e => e.textContent === 'КОРОТКИЙ СРОК · FEFO'), 'short expiry mark'); }
    clean(w, 'label');
  });
  await group('R1 H7: track & trace shows the partner hand-over and the partner portal steps', 'ru', async (g, ev) => {
    const L = 'LD-2026-001851', s = ev(`opsPlaces(load('${L}'))[0].sscc`), p = ev("S.partners.find(x => x.type === 'lp') || S.partners[0]");
    assert(!ev(`shipTrack('${L}', '${s}')`).some(e => e.key === 'ho'), 'no hand-over yet');
    ev(`S.handovers.push({ id: 'HO-T01', load: '${L}', p: '${p.id}', st: 'approved', mode: 'full', items: [], portal: 1 })`);
    let t = ev(`shipTrack('${L}', '${s}')`); const ho = t.find(e => e.key === 'ho'); assert(ho && ho.text.startsWith('Передано партнёру · ' + p.name + ' · '), 'hand-over event: ' + (ho && ho.text)); assert(t.some(e => e.text === 'Партнёр: груз принят') && !t.some(e => e.text === 'Партнёр: SSCC отсканированы'), 'portal step 1');
    ev("S.handovers.find(h => h.id === 'HO-T01').portal = 3"); t = ev(`shipTrack('${L}', '${s}')`); assert(t.some(e => e.text === 'Партнёр: SSCC отсканированы') && t.some(e => e.text === 'Партнёр: ePOD загружен'), 'portal steps 2 and 3');
    ev(`S.handovers.find(h => h.id === 'HO-T01').mode = 'part'; S.handovers.find(h => h.id === 'HO-T01').items = [ssccOf(load('${L}'), 1)]`); assert(!ev(`shipTrack('${L}', '${s}')`).some(e => e.key === 'ho'), 'partial hand-over of another place'); assert(ev(`shipTrack('${L}', opsPlaces(load('${L}'))[1].sscc)`).some(e => e.key === 'ho'), 'partial hand-over of this place');
  });
  await group('R1 H8 / H9: discrepancy until rescan, "not found at scanning", SSCC ↔ PL check, awaiting loading (plan), received by branch', 'ru', async (g, ev) => {
    const L = 'LD-2026-001850', r = ev(`recon(load('${L}')).find(x => !x.ok)`), s = ev(`opsPlaces(load('${L}')).find(p => !p.scans.some(x => x.ev === 'load')).sscc`);
    let t = ev(`shipTrack('${L}', '${s}')`); const df = t.find(e => e.key === 'diff'); eq(df && df.text, 'Расхождение: отсканировано ' + r.n + ' из ' + r.exp + ' мест заказа ' + r.id, 'discrepancy text'); assert(df.bad, 'red');
    assert(t.some(e => e.key === 'missing' && e.bad && e.text === 'Место не найдено при сканировании'), 'not found at scanning'); assert(t.some(e => e.key === 'pl' && e.text === 'Проверка SSCC ↔ ' + ev(`ops(load('${L}')).orders.find(o => o.id === '${r.id}').pl`)), 'SSCC ↔ PL check');
    ev(`rescan('${L}', '${r.id}')`); t = ev(`shipTrack('${L}', '${s}')`); assert(!t.some(e => e.key === 'diff' || e.key === 'missing'), 'gone after rescan');
    const sa = ev("opsPlaces(load('LD-2026-001851'))[0].sscc"); assert(ev(`shipTrack('LD-2026-001851', '${sa}')`).some(e => e.key === 'plan' && e.text === 'Ожидает погрузки (план)'), 'awaiting loading (plan)');
    const sd = ev("opsPlaces(load('LD-2026-001841'))[0].sscc"); assert(ev(`shipTrack('LD-2026-001841', '${sd}')`).some(e => e.done && e.text.startsWith('Принято филиалом · ePOD, температурная квитанция')), 'received by branch'); assert(!ev(`shipTrack('LD-2026-001841', '${sd}')`).some(e => e.key === 'plan'), 'no plan event after delivery');
  });
  await group('R1 G6 / G8: gate "Vehicle available" (service / workshop) and "Insurance, tax and inspection OK" (fees level 3 blocks)', 'ru', async (g, ev) => {
    const G = k => ev(`gate(load('LD-2026-001850')).find(x => x.key === '${k}')`);
    let v = G('veh'); assert(v.pass && v.label === 'Транспорт доступен' && v.text.startsWith(ev("trk('t3').plate") + ' · '), 'vehicle available: ' + v.text);
    ev("trk('t3').status = 'service'"); v = G('veh'); assert(!v.pass && /в сервисе/.test(v.text), 'truck in service → No-Go'); ev("trk('t3').status = 'available'; S.res.svc.push({ id: 'SR-T1', truck: 't3', status: 'in_work', eta: NOW.toISOString() })"); assert(!G('veh').pass, 'service request in work → No-Go'); ev("S.res.svc.find(s => s.id === 'SR-T1').status = 'planned'"); assert(G('veh').pass, 'planned service does not block');
    let i = G('ins'); assert(i.pass && i.label === 'Страховка, налог и техосмотр в порядке' && i.text.startsWith('ОГПО, КАСКО, налог, техосмотр действуют'), 'default text: ' + i.text);
    ev("S.res.fleet.taxPaid.t3 = false"); i = G('ins'); assert(!i.pass && /налог/.test(i.text), 'unpaid tax (fees level 3) → No-Go'); ev("S.res.fleet.taxPaid.t3 = true; trk('t3').docs.osago = '2020-01-01'"); assert(!G('ins').pass, 'OGPO expired → No-Go');
    ev("trk('t3').docs.osago = '2027-03-01'; trk('t3').docs.cargo = '2020-01-01'"); assert(!G('ins').pass, 'cargo insurance expired → No-Go'); assert(G('calib'), 'logger calibration stays a control');
  });
  await group('R1 G7: "Documents complete" = whole applicable set (except ePOD / ESF) + TTN and waybill signed; "missing: N" / "set complete"', 'ru', async (g, ev) => {
    const L = 'LD-2026-001850', G = () => ev(`gate(load('${L}')).find(x => x.key === 'docs')`), miss = ev(`docSet(load('${L}')).filter(d => !['epod', 'esf'].includes(d.k) && d.st === 'none').length`);
    let c = G(); assert(!c.pass && c.label === 'Документы полные' && c.text.startsWith('не хватает: ' + miss), 'missing: ' + c.text); assert(miss > 0, 'seed has missing documents');
    ev(`docSet(load('${L}')).forEach(d => { if (d.st === 'none' && d.can) docGen('${L}', d.k); })`); c = G(); assert(c.pass && c.text.startsWith('комплект готов'), 'set complete: ' + c.text); assert(ev(`docSet(load('${L}')).some(d => d.k === 'epod' && d.st === 'none')`), 'ePOD still open and not counted');
    ev(`ops(load('${L}')).kdocs.ttn = 'ready'`); c = G(); assert(!c.pass && /не подписаны/.test(c.text), 'unsigned TTN keeps the control red');
  });
  await group('R1 G9 / G10: road message level 3 blocks the weather control; driver licence on the arrival date, medical check refused / older than 8 h / after departure', 'ru', async (g, ev) => {
    const L = 'LD-2026-001850', G = k => ev(`gate(load('${L}')).find(x => x.key === '${k}')`);
    assert(G('wx').pass, 'no warnings'); ev("S.inbox.unshift({ id: 'IN-T9', kind: 'road_closure', lvl: 2, cc: 'KAR', ccTo: '', road: 'M-36', at: NOW.toISOString(), st: 'new', title: 'road' })");
    let x = G('wx'); assert(x.pass && x.lvl === 1 && x.text.includes(ev(`roadRisk(load('${L}')).text`)), 'level 2: warning only'); ev("S.inbox.find(m => m.id === 'IN-T9').lvl = 3"); x = G('wx'); assert(!x.pass && x.text.includes('M-36'), 'level 3 blocks: ' + x.text);
    let d = G('driver'); assert(d.pass && d.label === 'Водитель допущен', 'driver qualified: ' + d.text);
    ev(`drv('d1').docs.find(x => x.type === 'lic').to = opsToday`); d = G('driver'); assert(!d.pass && d.text.includes('права недействительны на дату прибытия'), 'licence valid today but not on the arrival date'); ev("drv('d1').docs.find(x => x.type === 'lic').to = '2029-05-14'");
    ev("S.res.med.d1 = { date: opsToday, ok: false, at: '09:00', by: 'x' }"); d = G('driver'); assert(!d.pass && d.text.includes('медосмотр: водитель не допущен'), 'medical check refused');
    ev("S.res.med.d1 = { date: opsToday, ok: true, at: '08:20', by: 'x' }"); assert(G('driver').pass, 'before 01.01.2027 the 8 h rule is not applied');
    ev('S.res.rules.medEnforce = true'); d = G('driver'); assert(!d.pass && d.text.includes('медосмотр старше 8 ч до выезда'), 'older than 8 h before departure: ' + d.text);
    ev(`load('${L}').eta = new Date(new Date(opsToday + 'T07:00:00+05:00').getTime() + dist('KAR', 'AST') / 65 * 3600e3).toISOString()`);   /* planned departure 07:00, check 08:20 */ d = G('driver'); assert(!d.pass && d.text.includes('медосмотр после выезда'), 'after departure: ' + d.text);
    ev(`load('${L}').eta = new Date(new Date(opsToday + 'T14:00:00+05:00').getTime() + dist('KAR', 'AST') / 65 * 3600e3).toISOString()`); assert(G('driver').pass, 'departure within 8 h after the check');
    eq(ev(`gate(load('${L}')).filter(x => !x.x).length`), 9, 'still nine controls (+ two extras of 250)');
  });
  await group('R1 render: Load & weight, Shipments and Documents KZ in 4 languages, DE / EN without Cyrillic in the new blocks', 'ru', async () => {
    for (const lang of LANGS) { const gg = await fresh(lang); try {
      gg.ev("ACT.setRole({v:'viewer'}); S.ops.sel = 'LD-2026-001850'; ops(load('LD-2026-001850')).orders.forEach(o => { o.on = false; }); go('orders'); ACT.stab({s:'orders',v:'loadw'})"); clean(gg.w, lang + ' loadw');
      const d = gg.w.document, txt = [d.querySelector('[data-sim-empty]').textContent, d.querySelector('[data-order][data-ro]').getAttribute('title')];
      gg.ev("ACT.setRole({v:'admin'}); S.ops.shipLoad = 'LD-2026-001856'; S.ops.shipSel = ops(load('LD-2026-001856')).orders.find(x => /^T-/.test(x.id)).places[0].sscc; ACT.stab({s:'orders',v:'ship'})"); clean(gg.w, lang + ' ship');
      txt.push(d.querySelector('[data-marks]').textContent, ...gg.ev("shipTrack('LD-2026-001850', opsPlaces(load('LD-2026-001850')).find(p => !p.scans.some(x => x.ev === 'load')).sscc).map(e => e.text)"), gg.ev("shipLabelZpl('LD-2026-001856', S.ops.shipSel)"));
      gg.ev("S.handovers.push({ id: 'HO-T02', load: 'LD-2026-001851', p: S.partners[0].id, st: 'approved', mode: 'full', items: [], portal: 3 })"); txt.push(...gg.ev("shipTrack('LD-2026-001851', opsPlaces(load('LD-2026-001851'))[0].sscc).map(e => e.text)"));
      gg.ev("S.ops.docSel = 'LD-2026-001850'; ACT.stab({s:'orders',v:'docs'})"); clean(gg.w, lang + ' docs'); eq(d.querySelectorAll('[data-gate]').length, 9, lang + ' nine controls'); txt.push(...[...d.querySelectorAll('[data-gate], [data-gate2]')].map(e => e.textContent));
      if (lang === 'de' || lang === 'en') { const bad = txt.filter(s => E1_CYR.test(s || '')); assert(!bad.length, lang + ' Cyrillic: ' + bad.join(' | ').slice(0, 300)); }
      if (lang === 'kk') assert(/Белгіленген тапсырыстар жоқ/.test(txt[0]) && /Көлік қолжетімді/.test(txt.join(' ')), 'kk texts');
    } finally { gg.done(); } }
  });
