/* Orders & Loads → tab "Shipments & labels" (source screen 04, LH-D1/D3): PO / lines / places with SSCC (GS1-128), scanner search that opens
   the label of a place, manufacturer directory with logo badges, GS1 transport label with ZPL print / export, track & trace per place,
   archive of delivered shipments (incl. ePOD search). FR-01..06, FR-73, FR-176. */
(function () {
  const css = document.createElement('style');
  css.textContent = `.sh-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(360px,1fr);gap:16px;align-items:start}.sh-pkg{display:grid;grid-template-columns:170px 90px 90px 80px minmax(170px,1.4fr) 120px 56px 80px;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid var(--border);cursor:pointer;font-size:12px}.sh-pkg.sel{background:var(--bg-selected)}.sh-pkg.hd{color:var(--text-faint);cursor:default}
.mlogo{display:inline-flex;align-items:center;justify-content:center;border-radius:8px;color:#fff;font-weight:700;flex:none}.mlogo.c1{background:#1d4ed8}.mlogo.c2{background:#0f766e}.mlogo.c3{background:#7c3aed}.mlogo.c4{background:#16a34a}.mlogo.c5{background:#0369a1}.mlogo.c6{background:#b45309}
.sh-mfr{display:flex;gap:10px;align-items:center;padding:8px 10px;border:1px solid var(--border);border-radius:var(--r-btn);margin:0 8px 8px 0;min-width:260px}.sh-mfrs{display:flex;flex-wrap:wrap}.sh-logo{margin-left:auto;width:64px;height:40px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;letter-spacing:.5px;color:#fff}
.sh-lab{border:2px solid #111;border-radius:6px;padding:12px;background:#fff;font-size:12px;color:#111}.sh-lab .k{display:block;font-size:10px;color:#555;text-transform:uppercase}.sh-lab dl{display:grid;grid-template-columns:90px 1fr;gap:2px 8px;margin:8px 0}.sh-lab dt{color:#555}.sh-lab .bar{margin:8px 0;text-align:center;font-family:monospace}.sh-temp{border:2px solid #111;border-radius:6px;padding:8px;text-align:center;font-weight:700}.sh-temp.dark{background:#111;color:#fff}
.sh-zpl{background:#111827;color:#d1d5db;padding:10px;border-radius:8px;font:11px/1.4 monospace;white-space:pre-wrap;max-height:220px;overflow:auto}.sh-ev{display:grid;grid-template-columns:110px 14px minmax(0,1fr);gap:6px;padding:4px 0;font-size:12px}.sh-ev i{width:8px;height:8px;border-radius:50%;background:var(--step-done);margin-top:5px;display:block}.sh-ev.bad i{background:var(--label-red)}.sh-ev.bad{color:var(--label-red)}.sh-ev.todo{color:var(--text-faint)}.sh-ev.todo i{background:var(--step-todo)}
.sh-marks{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}.sh-mark{border:1.5px solid #111;border-radius:4px;padding:1px 5px;font-size:10px;font-weight:700;letter-spacing:.2px}.sh-short{display:inline-block;background:var(--tint-yellow-50);color:#854d0e;border-radius:4px;padding:0 4px;font-size:10px}.sh-in{border:1px solid var(--border-input);border-radius:999px;height:36px;padding:0 12px;font:inherit;width:320px}`;
  document.head.appendChild(css);
  /* logo in a fixed 515:380 box, contain-fit (same visual weight for every logo, no frame); manufacturers without a file keep the initials badge */
  const mlogo = (m, size) => MFRS[m].logo ? `<span class="mlogo img" style="width:${Math.round(size * 515 / 380)}px;height:${size}px" title="${esc(MFRS[m].name)}"><img src="${mfrSrc(m)}" alt="${esc(MFRS[m].name)}" loading="lazy"></span>`
    : `<span class="mlogo c${MFRS[m].col}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px" title="${esc(MFRS[m].name)}">${MFRS[m].ab}</span>`;
  const logoBadge = m => MFRS[m].logo ? `<span class="sh-logo img" data-mfr-logo="${m}" title="${esc(MFRS[m].name)}"><img src="${mfrSrc(m)}" alt="${esc(MFRS[m].name)}" loading="lazy"></span>`
    : `<span class="sh-logo" style="background:${['#1d4ed8', '#0f766e', '#7c3aed', '#16a34a', '#0369a1', '#b45309'][MFRS[m].col - 1]}" data-mfr-logo="${m}">${esc(MFRS[m].name.split(' ')[0].toUpperCase())}</span>`;
  const EV = { create: T('место создано, этикетка напечатана', 'Packstück angelegt, Etikett gedruckt', 'place created, label printed', 'орын құрылды, затбелгі басылды'), load: T('погружено в ТС', 'ins Fahrzeug geladen', 'loaded into the truck', 'КҚ-ға тиелді'), depart: T('выезд с хаба', 'Abfahrt vom Hub', 'departed from the hub', 'хабтан шықты'), unload: T('выгружено на хабе', 'am Hub entladen', 'unloaded at the hub', 'хабта түсірілді'), receive: T('Принято филиалом · ePOD, температурная квитанция', 'Von der Filiale angenommen · ePOD, Temperaturquittung', 'Received by branch · ePOD, temperature receipt', 'Филиал қабылдады · ePOD, температуралық түбіртек') };
  /* R1 · mirror 0.3.9 engine/ship.ts: label sender / recipient (H4), handling marks (H5), track & trace events (H7–H9) */
  const SH_CO = T('ТОО «Olymp Logistic»', 'TOO „Olymp Logistic“', 'Olymp Logistic LLP', '«Olymp Logistic» ЖШС');
  const shHub = h => T('хаб ', 'Hub ', 'Hub ', '') + HUBS[h].city + (LANG === 'kk' ? ' хабы' : '');
  const shThird = o => !!o.third || /^T-/.test(o.id);
  const shSender = l => SH_CO + ' · ' + shHub(l.from);
  const shRecipient = o => shThird(o) ? o.to : T('Филиал KDL Olymp · ', 'Filiale KDL Olymp · ', 'KDL Olymp branch · ', 'KDL Olymp филиалы · ') + o.city + (/\d/.test(o.to) ? ' · №' + o.to.replace(/\D/g, '') : '');
  function shMarks(l, x) {
    const o = x.o, m = [];
    if (o.box) m.push(T('−20 °C · СУХОЙ ЛЁД UN 1845', '−20 °C · TROCKENEIS UN 1845', '−20 °C · DRY ICE UN 1845', '−20 °C · ҚҰРҒАҚ МҰЗ UN 1845'));
    else if (o.cls === 'pharma') m.push(T('+2…+8 °C · НЕ ЗАМОРАЖИВАТЬ', '+2…+8 °C · NICHT EINFRIEREN', '+2…+8 °C · DO NOT FREEZE', '+2…+8 °C · МҰЗДАТПАУ'));
    else if (o.cls === 'chilled') m.push(T('0…+4 °C · НЕ ЗАМОРАЖИВАТЬ', '0…+4 °C · NICHT EINFRIEREN', '0…+4 °C · DO NOT FREEZE', '0…+4 °C · МҰЗДАТПАУ'));
    else if (o.cls === 'frozen') m.push(T('−18 °C · НЕ РАЗМОРАЖИВАТЬ', '−18 °C · NICHT AUFTAUEN', '−18 °C · DO NOT THAW', '−18 °C · ЕРІТПЕУ'));
    else m.push(T('+15…+25 °C · БЕРЕЧЬ ОТ МОРОЗА', '+15…+25 °C · VOR FROST SCHÜTZEN', '+15…+25 °C · PROTECT FROM FROST', '+15…+25 °C · АЯЗДАН САҚТАУ'));
    if (o.adr && !o.box) m.push(T('ДОПОГ · LQ', 'ADR · LQ', 'ADR · LQ', 'ДОПОГ · LQ'));
    if (shThird(o)) m.push(T('СТОРОННИЙ ГРУЗ', 'FREMDFRACHT', 'THIRD-PARTY CARGO', 'БӨГДЕ ЖҮК'));
    if (x.short) m.push(T('КОРОТКИЙ СРОК · FEFO', 'KURZE RESTLAUFZEIT · FEFO', 'SHORT EXPIRY · FEFO', 'МЕРЗІМІ ҚЫСҚА · FEFO'));
    m.push(T('IVD · медицинские изделия', 'IVD · Medizinprodukte', 'IVD · medical devices', 'IVD · медициналық бұйымдар'), T('Хрупкое · не кантовать', 'Zerbrechlich · nicht kippen', 'Fragile · do not tilt', 'Сынғыш · аудармау'));
    return m;
  }
  /* partner hand-overs that carry this place (full hand-over or a partial one listing the place; 160 numbers handed places by their index in the load) */
  const shHos = (l, p) => { const i = opsPlaces(l).indexOf(p), code = typeof ssccOf === 'function' ? ssccOf(l, i) : '';
    return (S.handovers || []).filter(h => h.load === l.id && h.st === 'approved' && (h.mode !== 'part' || (h.items || []).includes(code) || (h.items || []).includes(p.sscc))); };
  const shCity = c => (HUBS[c] ? HUBS[c].city : (globalThis.ROAD_CITY || {})[c] || c || '');
  const visibleLoads = () => S.loads.filter(l => (S.ops.shipArch || l.status !== 'delivered') && (!S.ops.shipFrom || l.eta.slice(0, 10) >= S.ops.shipFrom));
  const curLoad = () => { const v = visibleLoads(); let l = v.find(x => x.id === S.ops.shipLoad); if (!l) { l = v[0]; S.ops.shipLoad = l && l.id; } return l; };
  const linesOf = l => ops(l).orders.flatMap(o => o.places.map(p => ({ p, o, ln: o.lines[0], short: (new Date(o.lines[0].exp) - new Date(l.eta)) / 864e5 < 90 })));
  const gtin = art => { let h = 0; for (const c of art) h = (h * 31 + c.charCodeAt(0)) % 1e6; const b = '0487' + String(h).padStart(6, '0') + '00'; let s = 0; for (let i = 0; i < 12; i++) s += +b[i] * (i % 2 ? 3 : 1); return b + (10 - s % 10) % 10; };
  const yymmdd = iso => iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10);
  function label(l, x) {
    const o = x.o, ln = x.ln, z = ZONES[o.cls], dark = o.cls === 'frozen';
    const tNote = { pharma: T('Не замораживать · GDP', 'Nicht einfrieren · GDP', 'Do not freeze · GDP', 'Мұздатпаңыз · GDP'), chilled: T('Хранить при 0…+4 °C', 'Bei 0…+4 °C lagern', 'Keep at 0…+4 °C', '0…+4 °C сақтаңыз'), frozen: T('Глубокая заморозка', 'Tiefgekühlt', 'Deep frozen', 'Терең мұздату'), ambient: T('Беречь от влаги', 'Vor Nässe schützen', 'Keep dry', 'Ылғалдан сақтаңыз') }[o.cls];
    const marks = ['(02) ' + gtin(ln.art), '(37) ' + ln.qty, '(10) ' + ln.lot, '(17) ' + yymmdd(ln.exp), '(401) ' + l.id.replace(/\D/g, '')];
    const bars = x.p.sscc.split('').map((c, i) => `<rect x="${i * 14 + (+c % 3)}" y="0" width="${2 + (+c % 4)}" height="40" fill="#111"/><rect x="${i * 14 + 7 + (+c % 2)}" y="0" width="${1 + (+c % 3)}" height="40" fill="#111"/>`).join('');
    const zpl = `^XA\n^CI28\n^PW812^LL1218\n^FO30,30^A0N,26,26^FD${T('Отправитель: ', 'Absender: ', 'Sender: ', 'Жөнелтуші: ')}${shSender(l)}^FS\n^FO30,70^A0N,26,26^FDPO ${o.po}  PL ${o.pl}  ${o.id} / ${l.id}^FS\n^FO30,110^A0N,30,30^FD${T('Получатель: ', 'Empfänger: ', 'Recipient: ', 'Алушы: ')}${shRecipient(o)}^FS\n^FO30,160^A0N,26,26^FD${ln.art} ${ln.name}^FS\n^FO30,195^A0N,26,26^FDLOT ${ln.lot}  EXP ${ln.exp}  QTY ${ln.qty}^FS\n^FO30,235^A0N,26,26^FD${MFRS[o.mfr].name}^FS\n^FO30,280^GB750,60,3^FS^FO45,295^A0N,30,30^FD${z.label} ${tNote}^FS\n^FO30,380^BY3,3,120^BCN,120,Y,N,N\n^FD>;>80${x.p.sscc}^FS\n^FO30,560^BY2,3,80^BCN,80,Y,N,N\n^FD>;>802${gtin(ln.art)}>837${ln.qty}^FS\n^FO30,700^BY2,3,80^BCN,80,Y,N,N\n^FD>;>810${ln.lot}>817${yymmdd(ln.exp)}^FS\n^FO30,850^A0N,24,24^FDSSCC ${x.p.sscc}^FS\n^XZ`;
    return { o, ln, dark, tNote, marks, hmarks: shMarks(l, x), bars, zpl, from: shSender(l), to: shRecipient(o) };
  }
  function track(l, p) {
    const o = ops(l).orders.find(x => x.id === p.order) || {}, scanned = p.scans.some(s => s.ev === 'load' && s.load === l.id), begun = ['loading', 'in_transit', 'problem', 'delivered'].includes(l.status);
    const ev = [{ t: fdt(l.created), text: EV.create + ' · ' + HUBS[l.from].city, done: true }, { t: fdt(l.created), text: T('Проверка SSCC ↔ ', 'Prüfung SSCC ↔ ', 'Check SSCC ↔ ', 'SSCC тексеру ↔ ') + (o.pl || '—'), done: true, key: 'pl' }];
    p.scans.forEach(s => { const bad = s.load !== l.id; ev.push({ t: s.t, text: EV[s.ev] + ' · ' + s.where + (bad ? ' · ' + T('ТРЕВОГА: место отсканировано в рейс ', 'ALARM: Packstück in Tour ', 'ALARM: place scanned into trip ', 'ДАБЫЛ: орын рейске сканерленді ') + s.load : ''), done: true, bad }); });
    /* H8 discrepancy of the order (until rescan) and H9 a place missing at the loading scan */
    const rc = begun ? recon(l).find(r => r.id === o.id) : null;
    if (rc && rc.n < rc.exp) ev.push({ t: '—', text: T('Расхождение: отсканировано {0} из {1} мест заказа {2}', 'Abweichung: gescannt {0} von {1} Packstücke des Auftrags {2}', 'Discrepancy: scanned {0} of {1} packages of order {2}', 'Сәйкессіздік: {2} тапсырысының {1} орнынан {0} сканерленді').replace('{0}', rc.n).replace('{1}', rc.exp).replace('{2}', o.id), done: true, bad: true, key: 'diff' });
    if (begun && !scanned) ev.push({ t: '—', text: T('Место не найдено при сканировании', 'Packstück beim Scannen nicht gefunden', 'Package not found at scanning', 'Орын сканерлеу кезінде табылмады'), done: true, bad: true, key: 'missing' });
    /* H7 partner hand-over and the steps of the partner portal */
    shHos(l, p).forEach(h => { const pt = (S.partners || []).find(x => x.id === h.p) || {}, at = h.at || fdt(NOW);
      ev.push({ t: at, text: T('Передано партнёру · ', 'An Partner übergeben · ', 'Handed to partner · ', 'Серіктеске берілді · ') + (pt.name || h.p) + ' · ' + shCity(pt.city), done: true, key: 'ho' });
      if (h.portal >= 1) ev.push({ t: at, text: T('Партнёр: груз принят', 'Partner: Ware angenommen', 'Partner: goods accepted', 'Серіктес: жүк қабылданды'), done: true, key: 'ho1' });
      if (h.portal >= 2) ev.push({ t: at, text: T('Партнёр: SSCC отсканированы', 'Partner: SSCC gescannt', 'Partner: SSCC scanned', 'Серіктес: SSCC сканерленді'), done: true, key: 'ho2' });
      if (h.portal >= 3) ev.push({ t: h.epodAt || at, text: T('Партнёр: ePOD загружен', 'Partner: ePOD hochgeladen', 'Partner: ePOD uploaded', 'Серіктес: ePOD жүктелді'), done: true, key: 'ho3' }); });
    if (['unassigned', 'assigned'].includes(l.status)) ev.push({ t: fdt(new Date(new Date(l.eta).getTime() - dist(l.from, l.to) / 65 * 3600e3).toISOString()), text: T('Ожидает погрузки (план)', 'Wartet auf Verladung (Plan)', 'Awaiting loading (plan)', 'Тиеуді күтуде (жоспар)'), done: false, key: 'plan' });
    const have = new Set(p.scans.filter(s => s.load === l.id).map(s => s.ev));
    ['load', 'depart', 'unload', 'receive'].filter(k => !have.has(k)).forEach(k => ev.push({ t: '—', text: EV[k], done: false }));
    if (l.status === 'in_transit' || l.status === 'problem') ev.splice(ev.findIndex(e => !e.done), 0, { t: fdt(NOW).slice(-5), text: T('GPS: в пути, ', 'GPS: unterwegs, ', 'GPS: on the road, ', 'GPS: жолда, ') + Math.round(l.progress * 100) + ' % · ' + tempChip(l), done: true, html: true });
    return ev;
  }
  function body() {
    const l = curLoad();
    const q = S.ops.shipQ.trim(), ssccQ = ssccFromScan(q);
    const head = `<div class="actbar" style="align-items:center;margin-bottom:12px"><label class="searchbox" style="width:380px"><input class="sh-in" id="shipScan" style="border:0;width:100%" placeholder="${esc(T('Сканер: SSCC (00)…, артикул, заказ, PO, ePOD', 'Scanner: SSCC (00)…, Artikel, Auftrag, PO, ePOD', 'Scanner: SSCC (00)…, article, order, PO, ePOD', 'Сканер: SSCC (00)…, артикул, тапсырыс, PO, ePOD'))}" value="${esc(S.ops.shipQ)}"></label>
<label class="note"><input type="checkbox" data-act="shArch"${S.ops.shipArch ? ' checked' : ''}> ${esc(T('Включая доставленные (архив)', 'Inkl. gelieferte (Archiv)', 'Including delivered (archive)', 'Жеткізілгендерді қоса (мұрағат)'))}</label><label class="note">${esc(T('с даты', 'ab Datum', 'from date', 'күннен бастап'))} <input class="lw-inp" type="date" id="shipFrom" value="${esc(S.ops.shipFrom)}"></label>${ssccQ ? chip(ssccValid(ssccQ) ? 'green' : 'red', ssccValid(ssccQ) ? T('SSCC: контрольная цифра верна', 'SSCC: Prüfziffer korrekt', 'SSCC: check digit valid', 'SSCC: бақылау цифры дұрыс') : T('SSCC: неверная контрольная цифра', 'SSCC: Prüfziffer falsch', 'SSCC: wrong check digit', 'SSCC: бақылау цифры қате')) : ''}</div>`;
    if (!l) return head + `<div class="card card-body"><p class="note">${esc(T('Нет отправок по фильтру', 'Keine Sendungen im Filter', 'No shipments match the filter', 'Сүзгі бойынша жөнелтулер жоқ'))}</p></div>`;
    const chips = `<div class="lw-chips">${visibleLoads().map(x => `<span class="lw-chip${x.id === l.id ? ' on' : ''}" data-act="shSel" data-id="${x.id}">${x.id} · ${esc(HUBS[x.from].city)} → ${esc(HUBS[x.to].city)} · ${x.pallets} ${esc(T('мест', 'Packst.', 'places', 'орын'))}${x.status === 'delivered' ? ' · ' + esc(ST.delivered.l) + (ops(x).epod ? ' · ' + ops(x).epod : '') : ''}</span>`).join('')}</div>`;
    const lines = linesOf(l).filter(x => !q || ssccQ ? !ssccQ || x.p.sscc === ssccQ : (x.ln.art + ' ' + x.ln.name + ' ' + x.o.id + ' ' + x.o.po + ' ' + x.o.pl + ' ' + (ops(l).epod || '') + ' ' + MFRS[x.o.mfr].name).toLowerCase().includes(q.toLowerCase()));
    const sel = lines.find(x => x.p.sscc === S.ops.shipSel) || lines[0];
    const mfrs = {}; ops(l).orders.forEach(o => { mfrs[o.mfr] = (mfrs[o.mfr] || 0) + o.places.length; });
    const mfrCard = `<div class="card lw-card"><h3 class="lw-h" style="margin-top:0">${esc(T('Производители', 'Hersteller', 'Manufacturers', 'Өндірушілер'))} · ${Object.keys(mfrs).length}</h3><div class="sh-mfrs">${Object.keys(mfrs).map(m => `<div class="sh-mfr" data-mfr="${m}">${mlogo(m, 34)}<span><b>${esc(MFRS[m].name)}</b><div class="sub">${esc(MFRS[m].co)} · ${esc(MFRS[m].url)}</div><div class="sub">${mfrs[m]} ${esc(T('мест', 'Packst.', 'places', 'орын'))}</div></span>${logoBadge(m)}</div>`).join('')}</div><p class="note">${esc(T('Логотип у правого края карточки — поле 64×40 без рамки (FR-176); в макете — цветной бейдж.', 'Logo am rechten Rand der Karte — Feld 64×40 ohne Rahmen (FR-176); im Mock-up ein farbiges Badge.', 'Logo at the right edge of the card, 64×40 field without a frame (FR-176); a coloured badge in the mock-up.', 'Логотип карточканың оң жағында (FR-176); макетте түсті бейдж.'))}</p></div>`;
    const pk = `<div class="card lw-card"><h3 class="lw-h" style="margin-top:0">${esc(T('Грузовые места', 'Packstücke', 'Packages', 'Жүк орындары'))} · ${l.id} · ${lines.length}</h3><div style="overflow:auto"><div class="sh-pkg hd"><span>SSCC</span><span>${esc(T('Заказ', 'Auftrag', 'Order', 'Тапсырыс'))}</span><span>PO</span><span>PL</span><span>${esc(T('Артикул · товар', 'Artikel · Ware', 'Article · goods', 'Артикул · тауар'))}</span><span>${esc(T('LOT · годен до', 'LOT · verwendbar bis', 'LOT · expiry', 'LOT · жарамды'))}</span><span>${esc(T('Кол-во', 'Menge', 'Qty', 'Саны'))}</span><span>${esc(T('Режим', 'Klasse', 'Class', 'Режим'))}</span></div>
${lines.map(x => `<div class="sh-pkg${sel && x.p.sscc === sel.p.sscc ? ' sel' : ''}" data-act="shPick" data-s="${x.p.sscc}" data-line="${x.p.sscc}"><span style="font-family:monospace">${x.p.sscc}</span><span>${x.o.id}</span><span>${x.o.po}</span><span>${x.o.pl}</span><span class="cell">${mlogo(x.o.mfr, 26)}<span><b>${x.ln.art}</b><div class="sub">${esc(x.ln.name)} · ${esc(MFRS[x.o.mfr].name)}</div></span></span><span>${x.short ? `<span class="sh-short">${esc(T('короткий срок', 'kurze Restlaufzeit', 'short expiry', 'қысқа мерзім'))}</span><br>` : ''}${x.ln.lot}<div class="sub">${fd(x.ln.exp)}</div></span><span>${x.ln.qty}</span><span>${zoneChip(x.o.cls)}</span></div>`).join('') || `<p class="note">${esc(T('Ничего не найдено', 'Nichts gefunden', 'Nothing found', 'Ештеңе табылмады'))}</p>`}</div></div>`;
    let lab = '';
    if (sel) {
      const L = label(l, sel), ev = track(l, sel.p);
      lab = `<div class="card lw-card" data-label="${sel.p.sscc}"><div class="note" style="text-transform:uppercase;font-size:11px">${esc(T('Транспортная маркировка · этикетка места', 'Transportkennzeichnung · Packstücketikett', 'Transport marking · package label', 'Көлік таңбалауы · орын затбелгісі'))}</div>
<div class="cell" style="margin:8px 0">${mlogo(L.o.mfr, 40)}<span><b>${esc(MFRS[L.o.mfr].name)}</b><div class="sub">${esc(MFRS[L.o.mfr].co)} · ${esc(MFRS[L.o.mfr].url)}</div></span>${logoBadge(L.o.mfr)}</div>
<div class="sh-lab"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><span class="k">${esc(T('Отправитель', 'Absender', 'Sender', 'Жөнелтуші'))}</span><b>${esc(L.from)}</b></div><div><span class="k">${esc(T('Получатель', 'Empfänger', 'Recipient', 'Алушы'))}</span><b>${esc(L.to)}</b></div></div>
<dl><dt>PO</dt><dd><b>${L.o.po}</b></dd><dt>PL</dt><dd><b>${L.o.pl}</b></dd><dt>${esc(T('Заказ · рейс', 'Auftrag · Fahrt', 'Order · load', 'Тапсырыс · рейс'))}</dt><dd>${L.o.id} · ${l.id}</dd><dt>${esc(T('Артикул', 'Artikel', 'Article', 'Артикул'))}</dt><dd><b>${L.ln.art}</b></dd><dt>${esc(T('Товар', 'Ware', 'Goods', 'Тауар'))}</dt><dd>${esc(L.ln.name)}</dd><dt>LOT</dt><dd>${L.ln.lot}</dd><dt>${esc(T('Годен до', 'Verwendbar bis', 'Expiry', 'Жарамды'))}</dt><dd>${fd(L.ln.exp)}${sel.short ? ' <span class="sh-short">FEFO</span>' : ''}</dd><dt>${esc(T('Кол-во', 'Menge', 'Qty', 'Саны'))}</dt><dd>${L.ln.qty}</dd></dl>
<div class="sh-temp${L.dark ? ' dark' : ''}">${ZONES[L.o.cls].label} · ${esc(L.tNote)}</div><div class="bar"><svg viewBox="0 0 252 40" style="width:100%;max-width:300px;height:40px">${L.bars}</svg><div>(00) ${sel.p.sscc}</div></div><div class="sh-marks" data-marks="${L.hmarks.length}">${L.hmarks.map(m => `<span class="sh-mark">${esc(m)}</span>`).join('')}</div><div class="sub" style="font-family:monospace">${L.marks.join('  ')}</div></div>
<div class="actbar" style="margin-top:10px"><button class="btn sm primary" data-act="shPrint" data-s="${sel.p.sscc}">${esc(T('Печать этикетки (демо)', 'Etikett drucken (Demo)', 'Print label (demo)', 'Затбелгіні басып шығару (демо)'))}</button><button class="btn sm grey" data-act="shZpl">${S.ops.zpl ? esc(T('Скрыть ZPL', 'ZPL ausblenden', 'Hide ZPL', 'ZPL жасыру')) : esc(T('ZPL для Zebra (GS1-128)', 'ZPL für Zebra (GS1-128)', 'ZPL for Zebra (GS1-128)', 'Zebra үшін ZPL (GS1-128)'))}</button><button class="btn sm grey" data-act="shExport" data-s="${sel.p.sscc}">${esc(T('Экспорт .zpl', 'Export .zpl', 'Export .zpl', '.zpl экспорты'))}</button></div>
${S.ops.zpl ? `<pre class="sh-zpl" data-zpl="1">${esc(L.zpl)}</pre>` : ''}
<h3 class="lw-h">${esc(T('История сканирования места (Track & Trace)', 'Scanverlauf des Packstücks (Track & Trace)', 'Package scan history (track & trace)', 'Орынды сканерлеу тарихы (Track & Trace)'))}</h3>${howNote('track')}${ev.map(e => `<div class="sh-ev${e.bad ? ' bad' : e.done ? '' : ' todo'}"><span class="faint">${esc(e.t)}</span><i></i><span>${e.html ? e.text : esc(e.text)}</span></div>`).join('')}</div>`;
    }
    return head + chips + mfrCard + `<div class="sh-grid" style="margin-top:16px">${pk}${lab}</div>` + mfrRegistry();
  }
  /* full manufacturer registry of the source platform (0.3.9 screen 04): all entries with group chip and places across the demo loads */
  function mfrRegistry() {
    const n = {}; S.loads.forEach(l => ops(l).orders.forEach(o => { n[o.mfr] = (n[o.mfr] || 0) + o.places.length; }));
    const GC = ['blue', 'purple', 'green', 'gray'];
    const rows = Object.keys(MFRS).map(k => { const m = MFRS[k];
      return `<div class="sh-mfr" data-mfr-reg="${k}">${mlogo(k, 34)}<span style="flex:1;min-width:0"><b>${esc(m.name)}</b><div class="sub">${esc(m.cc)}${m.url ? ' · ' + esc(m.url) : ''}</div><div class="sub">${chip(GC[m.grp], MFR_G[m.grp])}${n[k] ? ' ' + n[k] + ' ' + esc(T('мест', 'Packst.', 'places', 'орын')) : ''}</div></span></div>`; }).join('');
    return `<div class="card lw-card" style="margin-top:16px" data-mfr-registry="${Object.keys(MFRS).length}"><h3 class="lw-h" style="margin-top:0">${esc(T('Реестр производителей', 'Herstellerregister', 'Manufacturer registry', 'Өндірушілер тізілімі'))} · ${Object.keys(MFRS).length}</h3><p class="note">${esc(T('Полный каталог источника (экран 04 платформы 0.3.9): группа и число грузовых мест в демо-рейсах.', 'Vollständiger Katalog der Quelle (Bildschirm 04 der Plattform 0.3.9): Gruppe und Packstücke in den Demo-Fahrten.', 'Full catalogue of the source (screen 04 of platform 0.3.9): group and demo-load places.', 'Бастапқы платформаның (0.3.9, 04-экран) толық каталогы.'))}</p><div class="sh-mfrs">${rows}</div></div>`;
  }
  addTab('orders', 'ship', T('Отправки и маркировка', 'Sendungen & Etiketten', 'Shipments & labels', 'Жөнелтулер мен таңбалау'), body, { perm: 'orders:read' });
  const dl = XP.save;
  /* scanner search (FR-01): a scanned GS1-128 (AI 00) opens the label of the place at once, also across loads and the archive */
  function scanTo(raw) {
    const ep = String(raw).trim().match(/^(EPOD-d{3,}|LD-d{4}-d{6})$/i);   // ePOD number or load id (archive search, FR-02)
    if (ep) { const l = S.loads.find(x => x.id.toLowerCase() === ep[1].toLowerCase() || (ops(x).epod || '').toLowerCase() === ep[1].toLowerCase()); if (!l) return false; if (l.status === 'delivered') S.ops.shipArch = true; S.ops.shipLoad = l.id; S.ops.shipSel = null; return true; }
    const s = ssccFromScan(raw); if (!s) return false;
    const f = findPlace(s); if (!f) return false;
    if (f.l.status === 'delivered') S.ops.shipArch = true;
    S.ops.shipLoad = f.l.id; S.ops.shipSel = s; ops(f.l).scanLog.push('search ' + s); return true;
  }
  globalThis.shipScanTo = scanTo; globalThis.shipLabelZpl = (lid, sscc) => { const l = load(lid), x = linesOf(l).find(y => y.p.sscc === sscc); return x ? label(l, x).zpl : ''; }; globalThis.shipTrack = (lid, sscc) => { const l = load(lid), p = opsPlaces(l).find(y => y.sscc === sscc); return p ? track(l, p) : []; };
  Object.assign(ACT, {
    shSel: d => { S.ops.shipLoad = d.id; S.ops.shipSel = null; render(); },
    shPick: d => { S.ops.shipSel = d.s; render(); },
    shArch: () => { S.ops.shipArch = !S.ops.shipArch; render(); },
    shZpl: () => { S.ops.zpl = !S.ops.zpl; render(); },
    shPrint: d => { audit('Ship', d.s, 'Print label', ''); toast(T('Этикетка ', 'Etikett ', 'Label ', 'Затбелгі ') + d.s + T(' отправлена на принтер (демо)', ' an den Drucker gesendet (Demo)', ' sent to the printer (demo)', ' принтерге жіберілді (демо)')); },
    shExport: d => { const l = curLoad(); dl(d.s + '.zpl', globalThis.shipLabelZpl(l.id, d.s), 'text/plain'); audit('Ship', d.s, 'Export ZPL', ''); },
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'shipScan') { S.ops.shipQ = e.target.value; if (scanTo(e.target.value)) { S.ops.shipQ = ''; render(); toast(T('Место найдено: ', 'Packstück gefunden: ', 'Place found: ', 'Орын табылды: ') + S.ops.shipSel); } else render(); }
    else if (e.target.id === 'shipFrom') { S.ops.shipFrom = e.target.value; render(); }
  });
})();
