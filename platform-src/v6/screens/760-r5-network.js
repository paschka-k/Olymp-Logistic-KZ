/* R5 · Network ideas (Ideenliste I-27, I-28, I-24): recipient structure 21 cities ↔ 27 lab complexes ↔ 612 collection points
   (Orders → Recipients, paging + search, picker in the New load drawer; Zhezkazgan and four more cities join the city table LOCS),
   backhaul / co-load exchange for the West and South return legs (Dispatch → Backhaul: offer, partner bids, accept → order on the
   return trip, revenue), KGD online check of a BIN (simulated register with "not found" and "liquidated") in the customer and partner
   forms. All external services are simulated. State: S.r5 (shared with 761-r5-driver-partner.js). Map: docs/IDEAS-R5.md. */
(function () {
  const Q = S.r5 = S.r5 || {};
  Object.assign(Q, { rq: '', rcity: '', rlab: '', rpage: 1, nrq: '', nrcp: '', kgd: {}, legs: [], bids: [], nextBid: 1 });
  const H3 = t => `<h3 style="margin:0 0 8px;font-size:15px">${esc(t)}</h3>`;
  const card = (t, body, id) => `<div class="card card-body"${id ? ` id="${id}"` : ''}>${H3(t)}${body}</div>`;
  const tk = (cls, ico, val, label) => `<div class="kpi-tile tint ${cls}"><div><div class="value">${val}</div><div class="label">${esc(label)}</div></div><div class="icon" style="background:var(--${cls});color:#fff;border-radius:50%">${ic(ico, 18)}</div></div>`;
  const AUD = (m, s, d, r) => { if (typeof audit === 'function') audit(m, s, d, (r ? r + ' · ' : '') + ROLE_NAME[S.role]); };
  const clock = () => (globalThis.RES && RES.clock ? RES.clock() : fdt(NOW).slice(-5));
  globalThis.R5 = globalThis.R5 || {};
  Object.assign(R5, { H3, card, tk, AUD, clock });

  /* ---------- I-27 · recipient structure: 21 cities ↔ 27 lab complexes ↔ 612 collection points ---------- */
  const CT = (k, ru, de, en, kk, hub, km, w) => ({ k, n: T(ru, de, en, kk), hub, km, w });
  const NETC = [
    CT('AST', 'Астана', 'Astana', 'Astana', 'Астана', 'AST', 0, 90), CT('ALA', 'Алматы', 'Almaty', 'Almaty', 'Алматы', 'ALA', 0, 120), CT('SHY', 'Шымкент', 'Schymkent', 'Shymkent', 'Шымкент', 'SHY', 0, 55),
    CT('KAR', 'Караганда', 'Karaganda', 'Karaganda', 'Қарағанды', 'KAR', 0, 45), CT('AKT', 'Актобе', 'Aktobe', 'Aktobe', 'Ақтөбе', 'ATY', 600, 25), CT('ATY', 'Атырау', 'Atyrau', 'Atyrau', 'Атырау', 'ATY', 0, 22),
    CT('URA', 'Уральск', 'Uralsk', 'Uralsk', 'Орал', 'ATY', 500, 18), CT('AKU', 'Актау', 'Aktau', 'Aktau', 'Ақтау', 'ATY', 850, 20), CT('KST', 'Костанай', 'Kostanai', 'Kostanay', 'Қостанай', 'AST', 700, 22),
    CT('PAV', 'Павлодар', 'Pawlodar', 'Pavlodar', 'Павлодар', 'AST', 450, 24), CT('KOK', 'Кокшетау', 'Kökschetau', 'Kokshetau', 'Көкшетау', 'AST', 300, 15), CT('PET', 'Петропавловск', 'Petropawl', 'Petropavl', 'Петропавл', 'AST', 490, 15),
    CT('SEM', 'Семей', 'Semei', 'Semey', 'Семей', 'KAR', 800, 18), CT('OSK', 'Усть-Каменогорск', 'Öskemen', 'Oskemen', 'Өскемен', 'KAR', 850, 22), CT('TAR', 'Тараз', 'Taras', 'Taraz', 'Тараз', 'SHY', 190, 22),
    CT('KZO', 'Кызылорда', 'Kysylorda', 'Kyzylorda', 'Қызылорда', 'SHY', 450, 18), CT('TAL', 'Талдыкорган', 'Taldykorgan', 'Taldykorgan', 'Талдықорған', 'ALA', 270, 15),
    CT('ZHE', 'Жезказган', 'Scheskasgan', 'Zhezkazgan', 'Жезқазған', 'KAR', 540, 10), CT('TUR', 'Туркестан', 'Türkistan', 'Turkistan', 'Түркістан', 'SHY', 165, 14),
    CT('TEM', 'Темиртау', 'Temirtau', 'Temirtau', 'Теміртау', 'KAR', 40, 12), CT('EKB', 'Экибастуз', 'Ekibastus', 'Ekibastuz', 'Екібастұз', 'AST', 580, 10)];
  /* the city table of the order pickers (LOCS, 500-commercial) gets the cities it was missing — Zhezkazgan first (I-27) */
  NETC.forEach(c => { if (!LOCS[c.k]) LOCS[c.k] = { n: c.n, hub: c.hub, km: c.km }; });
  const LABN = { AST: 3, ALA: 4, KAR: 2 };
  const LABS = [];
  NETC.forEach(c => { const n = LABN[c.k] || 1; for (let i = 1; i <= n; i++) LABS.push({ id: 'LC-' + c.k + (n > 1 ? '-' + i : ''), city: c.k, hub: c.hub, n: T('Лабораторный комплекс ', 'Laborkomplex ', 'Lab complex ', 'Зертханалық кешен ') + c.n + (n > 1 ? ' ' + i : '') }); });
  const STR = ['Абая', 'Достык', 'Республики', 'Толе би', 'Жибек жолы', 'Сейфуллина', 'Байтурсынова', 'Кунаева', 'Сатпаева', 'Момышулы', 'Гагарина', 'Женис'];
  const PTS = []; let pn = 0;
  NETC.forEach(c => { const labs = LABS.filter(x => x.city === c.k); for (let i = 0; i < c.w; i++) { pn++; PTS.push({ id: 'CP-' + String(pn).padStart(4, '0'), city: c.k, lab: labs[i % labs.length].id, no: i + 1, street: nm(STR[(pn * 7) % STR.length]), house: 1 + (pn * 13) % 180, hours: i % 5 === 0 ? '08:00–14:00' : '07:30–17:00', sat: i % 3 === 0 }); } });
  const cityOf = k => NETC.find(c => c.k === k) || { n: k, hub: 'AST' };
  const labOf = id => LABS.find(x => x.id === id) || { n: id, city: '' };
  const ptOf = id => PTS.find(p => p.id === id);
  const ptName = p => T('Пункт забора № ', 'Entnahmestelle Nr. ', 'Collection point no. ', 'Сынама алу пункті № ') + p.no + ' · ' + cityOf(p.city).n;
  const ptAddr = p => T(`ул. ${p.street}, ${p.house}`, `${p.street}-Str. ${p.house}`, `${p.house} ${p.street} St`, `${p.street} көш., ${p.house}`);
  const hay = p => (p.id + ' ' + ptName(p) + ' ' + ptAddr(p) + ' ' + labOf(p.lab).n + ' ' + cityOf(p.city).n).toLowerCase();
  const search = (q, city, lab) => { const s = String(q || '').trim().toLowerCase(); return PTS.filter(p => (!city || p.city === city) && (!lab || p.lab === lab) && (!s || hay(p).includes(s))); };
  Object.assign(R5, { NETC, LABS, PTS, ptOf, ptName, ptAddr, labOf, cityOf, search });

  function recipients() {
    const all = search(Q.rq, Q.rcity, Q.rlab), per = 20, pages = Math.max(1, Math.ceil(all.length / per)), pg = Math.min(Math.max(1, Q.rpage), pages), rows = all.slice((pg - 1) * per, pg * per);
    const cityRows = NETC.map(c => `<tr data-r5-city="${c.k}"${Q.rcity === c.k ? ' class="is-selected"' : ''}><td><a class="lnk" data-act="r5City" data-v="${c.k}">${esc(c.n)}</a></td><td>${esc(HUBS[c.hub].city)}</td><td>${LABS.filter(x => x.city === c.k).length}</td><td>${PTS.filter(p => p.city === c.k).length}</td></tr>`).join('');
    const labs = LABS.filter(x => !Q.rcity || x.city === Q.rcity);
    const trs = rows.map(p => `<tr data-cp="${p.id}"><td><b>${p.id}</b><div class="sub">${esc(ptName(p))}</div></td><td>${esc(labOf(p.lab).n)}</td><td>${esc(ptAddr(p))}<div class="sub">${p.hours}${p.sat ? ' · ' + esc(T('сб до 13:00', 'Sa bis 13:00', 'Sat until 13:00', 'сн 13:00 дейін')) : ''}</div></td><td>${esc(HUBS[cityOf(p.city).hub].city)}</td><td>${canDo('orders:write') ? `<button class="btn sm grey" data-act="r5UseRcp" data-id="${p.id}">${esc(T('Рейс сюда', 'Fahrt hierher', 'Load to here', 'Осында рейс'))}</button>` : ''}</td></tr>`).join('');
    return `<div class="kpi-row k4">${tk('blue', 'route', NETC.length, T('Городов', 'Städte', 'Cities', 'Қалалар'))}${tk('purple', 'warehouse', LABS.length, T('Лабораторных комплексов', 'Laborkomplexe', 'Lab complexes', 'Зертханалық кешендер'))}${tk('green', 'package', PTS.length, T('Пунктов забора', 'Entnahmestellen', 'Collection points', 'Сынама алу пункттері'))}${tk('yellow', 'truck', Object.keys(HUBS).length, T('Хабов доставки', 'Liefer-Hubs', 'Delivery hubs', 'Жеткізу хабтары'))}</div>
${howNote('recNet')}
<div class="grid2"><div class="card tcard" id="r5_rcp"><div class="card-body" style="display:flex;gap:8px;flex-wrap:wrap;align-items:end">
<label class="fl" style="flex:1;min-width:180px;margin:0">${esc(T('Поиск: номер, адрес, комплекс', 'Suche: Nummer, Adresse, Komplex', 'Search: number, address, complex', 'Іздеу: нөмір, мекенжай, кешен'))}<input class="inp" id="r5_rq" data-r5="rq" value="${esc(Q.rq)}" placeholder="${esc(T('например, CP-0042 или Абая', 'z. B. CP-0042 oder Abaya', 'e.g. CP-0042 or Abaya', 'мысалы, CP-0042'))}"></label>
<label class="fl" style="margin:0">${esc(T('Город', 'Stadt', 'City', 'Қала'))}<select class="select" id="r5_rcity" data-r5="rcity"><option value="">${esc(T('все', 'alle', 'all', 'барлығы'))}</option>${NETC.map(c => `<option value="${c.k}"${Q.rcity === c.k ? ' selected' : ''}>${esc(c.n)}</option>`).join('')}</select></label>
<label class="fl" style="margin:0">${esc(T('Комплекс', 'Komplex', 'Complex', 'Кешен'))}<select class="select" id="r5_rlab" data-r5="rlab"><option value="">${esc(T('все', 'alle', 'all', 'барлығы'))}</option>${labs.map(x => `<option value="${x.id}"${Q.rlab === x.id ? ' selected' : ''}>${esc(x.n)}</option>`).join('')}</select></label></div>
<table class="table"><thead><tr><th>${esc(T('Пункт', 'Stelle', 'Point', 'Пункт'))}</th><th>${esc(T('Лабораторный комплекс', 'Laborkomplex', 'Lab complex', 'Зертханалық кешен'))}</th><th>${esc(T('Адрес · часы', 'Adresse · Zeiten', 'Address · hours', 'Мекенжай · уақыт'))}</th><th>${esc(T('Хаб', 'Hub', 'Hub', 'Хаб'))}</th><th></th></tr></thead><tbody>${trs || `<tr><td colspan="5" class="faint">${esc(T('Ничего не найдено', 'Nichts gefunden', 'Nothing found', 'Ештеңе табылмады'))}</td></tr>`}</tbody></table>
<div class="card-body actbar" style="align-items:center" data-r5-pager="${pg}/${pages}"><button class="btn sm grey" data-act="r5Page" data-v="${pg - 1}"${pg <= 1 ? ' disabled' : ''}>‹</button><span class="sub">${esc(T('стр.', 'Seite', 'page', 'бет'))} ${pg} / ${pages} · ${all.length} ${esc(T('найдено', 'gefunden', 'found', 'табылды'))}</span><button class="btn sm grey" data-act="r5Page" data-v="${pg + 1}"${pg >= pages ? ' disabled' : ''}>›</button></div></div>
<div class="card tcard">${'<div class="card-body" style="padding-bottom:0">' + H3(T('Города сети', 'Städte des Netzes', 'Network cities', 'Желі қалалары')) + '</div>'}<table class="table"><thead><tr><th>${esc(T('Город', 'Stadt', 'City', 'Қала'))}</th><th>${esc(T('Хаб', 'Hub', 'Hub', 'Хаб'))}</th><th>${esc(T('Компл.', 'Kompl.', 'Compl.', 'Кеш.'))}</th><th>${esc(T('Пункты', 'Stellen', 'Points', 'Пункттер'))}</th></tr></thead><tbody>${cityRows}</tbody></table></div></div>`;
  }
  addTab('orders', 'recipients', T('Получатели', 'Empfänger', 'Recipients', 'Алушылар'), () => recipients(), { perm: 'orders:read' });

  /* New load drawer: recipient picker (search → collection point → destination hub) */
  const create0 = DRAWERS.create;
  DRAWERS.create = d => {
    const r = create0(d), pick = (d && d.rcp) || Q.nrcp, hits = search(Q.nrq).slice(0, 40), cur = pick ? ptOf(pick) : null;
    const opts = (cur && !hits.includes(cur) ? [cur] : []).concat(hits).map(p => `<option value="${p.id}"${p.id === pick ? ' selected' : ''}>${p.id} · ${esc(cityOf(p.city).n)} · ${esc(ptAddr(p))}</option>`).join('');
    const sec = `<div class="fl" data-r5-rcp="${pick || ''}"><span>${esc(T('Получатель в сети (необязательно)', 'Empfänger im Netz (optional)', 'Recipient in the network (optional)', 'Желідегі алушы (міндетті емес)'))}</span><input class="inp" id="n_rq" data-r5="nrq" value="${esc(Q.nrq)}" placeholder="${esc(T('поиск пункта забора', 'Entnahmestelle suchen', 'search a collection point', 'пунктті іздеу'))}"><select class="select" id="n_rcp" data-r5="nrcp" style="margin-top:4px"><option value="">${esc(T('— без получателя —', '— ohne Empfänger —', '— no recipient —', '— алушысыз —'))}</option>${opts}</select>${cur ? `<div class="sub">${esc(labOf(cur.lab).n)} · ${esc(T('хаб назначения: ', 'Ziel-Hub: ', 'destination hub: ', 'межелі хаб: '))}${esc(HUBS[cityOf(cur.city).hub].city)}</div>` : ''}</div>`;
    let html = r.html.replace('<p class="note" id="n_err"', sec + '<p class="note" id="n_err"');
    if (cur) { const hub = cityOf(cur.city).hub; html = html.replace(/(<select class="select" id="n_to">)([\s\S]*?)(<\/select>)/, (m, a, b, c) => a + b.replace(/ selected/g, '').replace(`<option value="${hub}">`, `<option value="${hub}" selected>`) + c); }
    return Object.assign({}, r, { html });
  };
  const setTo = () => { const p = ptOf(Q.nrcp), e = $('#n_to'); if (p && e) e.value = cityOf(p.city).hub; };
  const save0 = ACT.saveLoad;
  ACT.saveLoad = d => {
    const rid = ($('#n_rcp') || {}).value || ''; save0(d);
    if (rid && S.drawer && S.drawer.type === 'load') { const l = load(S.drawer.id), p = ptOf(rid); if (l && p) { l.recipient = rid; l.notes.push({ who: 'System', t: fdt(NOW).slice(-5), text: T('Получатель: ', 'Empfänger: ', 'Recipient: ', 'Алушы: ') + p.id + ' · ' + labOf(p.lab).n }); AUD('Orders', l.id, 'Recipient ' + rid); } Q.nrcp = ''; Q.nrq = ''; render(); }
  };

  /* ---------- I-28 · backhaul / co-load exchange (West = return from Atyrau, South = return from Shymkent) ---------- */
  const CORR = { ATY: 'west', SHY: 'south' };
  const CORRL = { west: T('Запад', 'West', 'West', 'Батыс'), south: T('Юг', 'Süd', 'South', 'Оңтүстік') };
  const EMPTY_KM = 240;   // own cost of an empty kilometre, ₸ (diesel 32 l/100 km × 295 ₸ + driver + wear; plausible default, to be verified)
  const legOf = id => Q.legs.find(x => x.id === id);
  const bidOf = id => Q.bids.find(x => x.id === id);
  const sold = leg => Q.bids.filter(b => b.leg === leg.id && b.st === 'accepted').reduce((a, b) => a + b.pallets, 0);
  const priceOf = (km, zone, pal) => Math.round(km * ZONES[zone].rate * pal / 33 * 0.6 / 1000) * 1000;
  const mkBid = (leg, pid, pallets, zone, f) => { const b = { id: 'BID-' + String(Q.nextBid++).padStart(3, '0'), leg: leg.id, p: pid, pallets, zone, price: Math.round(priceOf(leg.km, zone, pallets) * (f || 1) / 1000) * 1000, st: 'open', at: clock() }; Q.bids.push(b); return b; };
  S.loads.filter(l => isActive(l) && CORR[l.to] && trk(l.truck).id).forEach((l, i) => {
    const t = trk(l.truck); Q.legs.push({ id: 'BH-' + String(i + 1).padStart(3, '0'), out: l.id, from: l.to, to: l.from, corr: CORR[l.to], truck: t.id, cap: t.cap, zones: t.zones.slice(), dep: new Date(new Date(l.eta).getTime() + 12 * 3600e3).toISOString(), km: dist(l.to, l.from), st: 'draft' });
  });
  const BIDDERS = { west: ['PL-05', 'PL-06', 'PL-01'], south: ['PL-04', 'PL-02', 'PL-03'] };
  const pOf = id => (S.partners || []).find(p => p.id === id) || { id, name: id, tier: 'bronze', city: 'AST' };
  const seedBids = leg => { const ps = BIDDERS[leg.corr].filter(id => pOf(id).tier !== 'blocked'); const z1 = leg.zones[0], z2 = leg.zones[1] || leg.zones[0]; mkBid(leg, ps[0], Math.min(leg.cap, Math.round(leg.cap * 0.55)), z1, 1); mkBid(leg, ps[1], Math.min(leg.cap, Math.max(4, Math.round(leg.cap * 0.3))), z2, 0.92); };
  Q.legs.forEach((leg, i) => { if (i < 2) { leg.st = 'offered'; seedBids(leg); } });
  Object.assign(R5, { legOf, bidOf, sold, priceOf });

  function backhaul() {
    const can = canDo('trips:write'), open = Q.bids.filter(b => b.st === 'open').length, acc = Q.bids.filter(b => b.st === 'accepted'), rev = acc.reduce((a, b) => a + b.price, 0), km = Q.legs.reduce((a, l) => a + l.km, 0);
    const legs = Q.legs.map(leg => {
      const out = load(leg.out), t = trk(leg.truck), free = leg.cap - sold(leg), bids = Q.bids.filter(b => b.leg === leg.id), lrev = bids.filter(b => b.st === 'accepted').reduce((a, b) => a + b.price, 0), cover = Math.round(lrev / (leg.km * EMPTY_KM) * 100);
      const brow = b => { const p = pOf(b.p); return `<div class="tinted-row ${b.st === 'accepted' ? 'green' : b.st === 'declined' ? 'gray' : 'blue'}" data-bid="${b.id}"><span style="flex:1"><b>${b.id} · ${esc(p.name)}</b> ${chip(b.st === 'accepted' ? 'green' : b.st === 'declined' ? 'gray' : 'blue', b.st === 'accepted' ? T('принято', 'angenommen', 'accepted', 'қабылданды') : b.st === 'declined' ? T('отклонено', 'abgelehnt', 'declined', 'қабылданбады') : T('ставка', 'Gebot', 'bid', 'ұсыныс'))}<div class="sub">${b.pallets} ${esc(T('пал.', 'Pal.', 'pal.', 'пал.'))} · ${ZONES[b.zone].label} · ${kzt(b.price)} · ${kzt(b.price / leg.km)}/${esc(LF.unit('km'))}${b.load ? ' · ' + esc(T('заказ ', 'Auftrag ', 'order ', 'тапсырыс ')) + b.load : ''}</div></span>${b.st === 'open' && can ? `<button class="btn sm green" data-act="r5BhAccept" data-id="${b.id}">${esc(T('Принять', 'Annehmen', 'Accept', 'Қабылдау'))}</button><button class="btn sm grey" data-act="r5BhDecline" data-id="${b.id}">${esc(T('Отклонить', 'Ablehnen', 'Decline', 'Бас тарту'))}</button>` : ''}</div>`; };
      return `<div class="card card-body" data-leg="${leg.id}" style="margin-bottom:var(--gap)"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="flex:1">${leg.id} · ${esc(CORRL[leg.corr])} · ${esc(HUBS[leg.from].city)} → ${esc(HUBS[leg.to].city)}</b>${chip(leg.st === 'offered' ? 'blue' : 'gray', leg.st === 'offered' ? T('на бирже', 'an der Börse', 'on the exchange', 'биржада') : T('черновик', 'Entwurf', 'draft', 'жоба'))}${leg.st === 'draft' && can ? `<button class="btn sm primary" data-act="r5BhOffer" data-id="${leg.id}">${esc(T('Выставить на биржу', 'An Börse stellen', 'Offer on the exchange', 'Биржаға шығару'))}</button>` : ''}</div>
<div class="sub">${esc(T('обратное плечо рейса ', 'Rückfahrt der Fahrt ', 'return leg of trip ', 'рейстің кері иығы '))}${out ? out.id : leg.out} · ${esc(t.plate)} · ${esc(T('выезд ', 'Abfahrt ', 'departure ', 'шығу '))}${fdt(leg.dep)} · ${leg.km} ${esc(LF.unit('km'))} · ${leg.zones.map(z => ZONES[z].label).join(', ')} · ${esc(T('свободно ', 'frei ', 'free ', 'бос '))}${free}/${leg.cap} ${esc(T('пал.', 'Pal.', 'pal.', 'пал.'))}</div>
<div class="sub" data-leg-rev="${lrev}">${esc(T('Выручка обратного плеча: ', 'Erlös der Rückfahrt: ', 'Return-leg revenue: ', 'Кері иық түсімі: '))}<b>${kzt(lrev)}</b> · ${esc(T('покрытие порожнего пробега ', 'Deckung der Leerfahrt ', 'empty-run cost covered ', 'бос жүріс шығынын жабу '))}${cover} % (${kzt(leg.km * EMPTY_KM)})</div>
<div style="margin-top:8px">${bids.map(brow).join('') || `<p class="note">${esc(T('Ставок пока нет.', 'Noch keine Gebote.', 'No bids yet.', 'Ұсыныстар әлі жоқ.'))}</p>`}</div></div>`;
    }).join('');
    return `<div class="kpi-row k4">${tk('blue', 'route', Q.legs.length, T('Обратных плеч', 'Rückfahrten', 'Return legs', 'Кері иықтар'))}${tk('yellow', 'truck', LF.n(km) + ' ' + LF.unit('km'), T('Порожний пробег', 'Leerkilometer', 'Empty kilometres', 'Бос жүріс'))}${tk('purple', 'spark', open, T('Открытых ставок', 'Offene Gebote', 'Open bids', 'Ашық ұсыныстар'))}${tk('green', 'receipt', kzt(rev), T('Выручка догруза', 'Erlös Beiladung', 'Co-load revenue', 'Қосымша жүк түсімі'))}</div>
${howNote('backhaul')}<div id="r5_bh">${legs || `<p class="note">${esc(T('Нет рейсов на Запад или Юг.', 'Keine Fahrten nach West oder Süd.', 'No trips to the West or South.', 'Батысқа немесе Оңтүстікке рейс жоқ.'))}</p>`}</div>`;
  }
  addTab('dispatch', 'backhaul', T('Обратная загрузка', 'Rückladung', 'Backhaul', 'Кері жүктеу'), () => backhaul(), { perm: 'trips:read', badge: () => Q.bids.filter(b => b.st === 'open').length || '' });
  /* partner portal bid form (used by the partner screen in 761) */
  R5.bhPartner = pid => {
    const legs = Q.legs.filter(l => l.st === 'offered');
    return legs.map(leg => { const mine = Q.bids.filter(b => b.leg === leg.id && b.p === pid); return `<div class="tinted-row blue" style="display:block" data-pbh="${leg.id}"><b>${leg.id} · ${esc(HUBS[leg.from].city)} → ${esc(HUBS[leg.to].city)}</b> · ${fdt(leg.dep)} · ${leg.cap - sold(leg)} ${esc(T('пал. свободно', 'Pal. frei', 'pal. free', 'пал. бос'))} · ${leg.zones.map(z => ZONES[z].label).join(', ')}
${mine.map(b => `<div class="sub">${b.id} · ${b.pallets} ${esc(T('пал.', 'Pal.', 'pal.', 'пал.'))} · ${kzt(b.price)} · ${esc(b.st)}</div>`).join('')}
<div class="actbar" style="margin-top:6px;align-items:end"><label class="fl" style="margin:0">${esc(T('Паллет', 'Paletten', 'Pallets', 'Паллет'))}<input class="inp" id="pbh_pal_${leg.id}" type="number" min="1" value="6" style="width:80px"></label><label class="fl" style="margin:0">${esc(T('Режим', 'Bereich', 'Range', 'Режим'))}<select class="select" id="pbh_z_${leg.id}">${leg.zones.map(z => `<option value="${z}">${ZONES[z].label}</option>`).join('')}</select></label><label class="fl" style="margin:0">${esc(T('Цена, ₸', 'Preis, ₸', 'Price, ₸', 'Баға, ₸'))}<input class="inp" id="pbh_pr_${leg.id}" type="number" min="1000" value="${priceOf(leg.km, leg.zones[0], 6)}" style="width:120px"></label><button class="btn sm primary" data-act="r5BhBid" data-id="${leg.id}">${esc(T('Сделать ставку', 'Gebot abgeben', 'Place a bid', 'Ұсыныс беру'))}</button></div></div>`; }).join('') || `<p class="note">${esc(T('Открытых обратных плеч нет.', 'Keine offenen Rückfahrten.', 'No open return legs.', 'Ашық кері иықтар жоқ.'))}</p>`;
  };
  globalThis.backhaulAccept = id => {
    const b = bidOf(id); if (!b || b.st !== 'open') return LT('r5_network.bid_not_found_or_already_handled');
    if (!canDo('trips:write')) return T('Нужно право trips:write', 'Recht trips:write nötig', 'Permission trips:write required', 'trips:write құқығы қажет');
    const leg = legOf(b.leg), p = pOf(b.p);
    if (b.pallets > leg.cap - sold(leg)) return T('Не хватает свободных паллето-мест на обратном плече', 'Zu wenige freie Palettenplätze auf der Rückfahrt', 'Not enough free pallet places on the return leg', 'Кері иықта бос паллет орны жеткіліксіз');
    if (!leg.zones.includes(b.zone)) return T('ТС обратного плеча не поддерживает этот режим', 'Fahrzeug der Rückfahrt unterstützt diesen Bereich nicht', 'The return-leg truck does not support this range', 'КҚ бұл режимді қолдамайды');
    const cid = 'cp-' + p.id; if (!CUSTOMERS.find(c => c.id === cid)) CUSTOMERS.push({ id: cid, name: p.name, bin: '', ini: String(p.name).replace(/ТОО|ИП|LLP|IE|[«»"]/g, '').trim().split(/\s+/).map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase() || 'P', av: 6, partner: p.id });
    while (S.loads.some(x => x.id === 'LD-2026-' + String(S.nextId).padStart(6, '0'))) S.nextId++;   // the seed already holds LD-2026-001856 = the first free nextId
    const r = createLoad({ cust: cid, from: leg.from, to: leg.to, zone: b.zone, pallets: b.pallets, priority: 'medium' }); if (typeof r === 'string') return r;
    const l = load(r.ok); l.eta = new Date(new Date(leg.dep).getTime() + hrs(l) * 3600e3).toISOString(); l.backhaul = { leg: leg.id, bid: b.id, price: b.price, out: leg.out, truck: leg.truck }; l.note = T('Догруз обратного плеча ', 'Beiladung Rückfahrt ', 'Co-load on return leg ', 'Кері иық жүгі ') + leg.id;
    l.notes.push({ who: 'System', t: fdt(NOW).slice(-5), text: T('Обратная загрузка: ', 'Rückladung: ', 'Backhaul: ', 'Кері жүктеу: ') + leg.id + ' · ' + trk(leg.truck).plate + ' · ' + b.id + ' · ' + kzt(b.price) });
    b.st = 'accepted'; b.load = l.id; AUD('Backhaul', b.id, 'Bid accepted → ' + l.id, kzt(b.price)); return null;
  };
  Object.assign(ACT, {
    r5City: d => { Q.rcity = Q.rcity === d.v ? '' : d.v; Q.rlab = ''; Q.rpage = 1; render(); },
    r5Page: d => { Q.rpage = +d.v; render(); },
    r5UseRcp: d => { Q.nrcp = d.id; Q.nrq = ''; openDrawer({ type: 'create', rcp: d.id }); setTo(); },
    r5BhOffer: d => { const leg = legOf(d.id); if (!leg || !canDo('trips:write')) return; leg.st = 'offered'; if (!Q.bids.some(b => b.leg === leg.id)) seedBids(leg); AUD('Backhaul', leg.id, 'Offered on the exchange'); toast(T('Обратное плечо выставлено, ставки партнёров получены', 'Rückfahrt angeboten, Partnergebote erhalten', 'Return leg offered, partner bids received', 'Кері иық шығарылды, ұсыныстар алынды')); },
    r5BhAccept: d => { const e = backhaulAccept(d.id); if (e) return toast(e, 'err'); toast(T('Ставка принята: заказ создан на обратном рейсе', 'Gebot angenommen: Auftrag auf der Rückfahrt angelegt', 'Bid accepted: order created on the return trip', 'Ұсыныс қабылданды: кері рейсте тапсырыс құрылды')); },
    r5BhDecline: d => { const b = bidOf(d.id); if (!b || b.st !== 'open' || !canDo('trips:write')) return; b.st = 'declined'; AUD('Backhaul', b.id, 'Bid declined'); render(); },
    r5BhBid: d => { const leg = legOf(d.id), pal = +($('#pbh_pal_' + d.id) || {}).value, z = ($('#pbh_z_' + d.id) || {}).value, pr = +($('#pbh_pr_' + d.id) || {}).value; if (!leg) return;
      if (!(pal >= 1 && pal <= leg.cap - sold(leg))) return toast(T('Паллет: от 1 до свободных мест', 'Paletten: 1 bis freie Plätze', 'Pallets: 1 up to the free places', 'Паллет: 1-ден бос орынға дейін'), 'err'); if (!(pr >= 1000)) return toast(T('Укажите цену', 'Preis angeben', 'Enter a price', 'Бағаны көрсетіңіз'), 'err');
      const b = mkBid(leg, S.partnerId, pal, z || leg.zones[0], 1); b.price = Math.round(pr); AUD('Backhaul', b.id, 'Partner bid', S.partnerId); toast(T('Ставка отправлена', 'Gebot gesendet', 'Bid sent', 'Ұсыныс жіберілді')); },
  });
  const onR5 = e => { const t = e.target; if (!t.dataset || !t.dataset.r5) return; const k = t.dataset.r5; Q[k] = t.value; if (k === 'nrcp' && S.drawer && S.drawer.type === 'create') S.drawer.rcp = t.value; if (k === 'rq' || k === 'rcity' || k === 'rlab') { if (k === 'rcity') Q.rlab = ''; Q.rpage = 1; } render(); if (k === 'nrcp') setTo(); };
  document.addEventListener('input', e => { if (e.target.tagName === 'INPUT') onR5(e); });
  document.addEventListener('change', e => { if (e.target.tagName === 'SELECT') onR5(e); });

  /* ---------- I-24 / FR-189 · KGD online check (simulated register): active / liquidated / not found ---------- */
  const tn = s => String(s == null ? '' : s).replace(/[\s-]/g, '');
  const OKED = { '49410': T('Грузовые перевозки автотранспортом', 'Güterbeförderung im Straßenverkehr', 'Freight transport by road', 'Автокөлікпен жүк тасымалы'), '46460': T('Оптовая торговля фармацевтическими товарами', 'Großhandel mit pharmazeutischen Erzeugnissen', 'Wholesale of pharmaceutical goods', 'Фармацевтикалық тауарлармен көтерме сауда'), '52101': T('Складирование и хранение', 'Lagerei', 'Warehousing and storage', 'Қоймалау және сақтау') };
  const DIRS = ['Айдар Касымов', 'Гульмира Ахметова', 'Ерболат Нурланов', 'Светлана Ли', 'Тимур Садыков', 'Жанар Есенова'];
  const KREG = {}, CITIES9 = ['AST', 'ALA', 'KAR', 'SHY', 'AST', 'ALA', 'PAV', 'SHY', 'AKT'];
  (globalThis.KGD_BINS || []).forEach((b, i) => { KREG[b] = { st: 'active', name: kgdLookup(b), dir: nm(DIRS[i % DIRS.length]), city: CITIES9[i % 9], street: nm(STR[(i * 5) % STR.length]), house: 10 + i * 7, reg: (2009 + i) + '-' + p2(1 + i % 9) + '-15', vat: i % 3 !== 2, oked: ['46460', '49410', '52101'][i % 3] }; });
  const fix = pre => (globalThis.tinFix ? tinFix(pre) : null);
  const firstFix = pres => { for (const p of pres) { const f = fix(p); if (f) return f; } return null; };
  /* partners of the register (logistics partners PL-01…PL-08) */
  (S.partners || []).filter(p => p.type === 'lp').slice(0, 8).forEach((p, i) => { const b = firstFix(['12054000' + p2(11 + i) + '1', '12054000' + p2(31 + i) + '3', '12064000' + p2(51 + i) + '5']); if (b && !KREG[b]) KREG[b] = { st: 'active', name: p.name, dir: nm(DIRS[(i + 2) % DIRS.length]), city: LOCS[p.city] ? p.city : 'AST', street: nm(STR[(i * 3) % STR.length]), house: 20 + i, reg: (2012 + i) + '-0' + (1 + i % 9) + '-01', vat: true, oked: '49410', partner: p.id }; });
  const LIQ = firstFix(['19054000555', '19054000556', '19054000557']), NF = firstFix(['20064000777', '20064000778', '20064000779']);
  if (LIQ) KREG[LIQ] = { st: 'liquidated', name: nm('ТОО «Северный Холод»'), dir: nm('Олег Ким'), city: 'PET', street: nm('Гагарина'), house: 4, reg: '2019-05-20', liq: '2025-11-30', vat: false, oked: '49410' };
  globalThis.kgdOnline = bin => {
    const b = tn(bin), chk = globalThis.tinCheck ? tinCheck(b) : { valid: /^\d{12}$/.test(b) };
    if (!chk.valid) return { st: 'invalid', bin: b }; const r = KREG[b]; return r ? Object.assign({ bin: b }, r) : { st: 'notfound', bin: b };
  };
  R5.KGD_DEMO = { active: (globalThis.KGD_BINS || [])[0], partner: Object.keys(KREG).find(k => KREG[k].partner), liquidated: LIQ, notfound: NF };
  const getBin = s => (s === 'cm' ? (globalThis.cmGet ? cmGet('bin') : '') : s === 'pp' ? (globalThis.PP ? PP.reg.bin : '') : '');
  const KST = { active: ['green', T('действует', 'aktiv', 'active', 'жұмыс істейді')], liquidated: ['red', T('ликвидировано', 'liquidiert', 'liquidated', 'таратылған')], notfound: ['yellow', T('не найдено в реестре', 'nicht im Register', 'not found in the register', 'тізілімде табылмады')], invalid: ['red', T('БИН некорректен', 'BIN ungültig', 'BIN invalid', 'БСН қате')] };
  globalThis.kgdOnlineBox = (scope, bin) => {
    const r = Q.kgd[scope], res = r && r.bin === tn(bin) ? r.res : null, st = res ? KST[res.st] : null;
    const body = !res ? '' : res.st === 'active' ? `<div class="tinted-row green" style="display:block" data-kgd-res="active"><b>${esc(res.name)}</b> ${chip(st[0], st[1])}<div class="sub">${esc(T('Руководитель: ', 'Leitung: ', 'Director: ', 'Басшы: '))}${esc(res.dir)} · ${esc(locName(res.city))}, ${esc(res.street)} ${res.house}</div><div class="sub">${esc(T('ОКЭД ', 'OKED ', 'OKED ', 'ЭҚЖЖ '))}${res.oked} — ${esc(OKED[res.oked])} · ${esc(T('рег. ', 'reg. ', 'reg. ', 'тірк. '))}${fd(res.reg)} · ${res.vat ? esc(T('плательщик НДС', 'MwSt-pflichtig', 'VAT payer', 'ҚҚС төлеушісі')) : esc(T('без НДС', 'ohne MwSt', 'no VAT', 'ҚҚС жоқ'))}</div><button class="btn sm primary" data-act="r5KgdFill" data-s="${scope}" style="margin-top:6px">${esc(T('Заполнить форму', 'Formular füllen', 'Fill the form', 'Форманы толтыру'))}</button></div>`
      : res.st === 'liquidated' ? `<div class="tinted-row red" style="display:block" data-kgd-res="liquidated"><b>${esc(res.name)}</b> ${chip(st[0], st[1])}<div class="sub">${esc(T('Ликвидировано ', 'Liquidiert am ', 'Liquidated on ', 'Таратылған күні '))}${fd(res.liq)} — ${esc(T('создание запрещено', 'Anlage gesperrt', 'creation blocked', 'құруға тыйым'))}</div></div>`
        : `<div class="tinted-row ${res.st === 'invalid' ? 'red' : 'yellow'}" style="display:block" data-kgd-res="${res.st}">${chip(st[0], st[1])}<div class="sub">${esc(res.st === 'invalid' ? T('Проверьте 12 цифр и контрольную цифру', '12 Ziffern und Prüfziffer prüfen', 'Check the 12 digits and the check digit', '12 цифр мен тексеру цифрасын тексеріңіз') : T('Введите данные вручную — сотрудник проверит документы', 'Daten manuell eingeben — ein Mitarbeiter prüft die Unterlagen', 'Enter the data manually — staff checks the documents', 'Деректерді қолмен енгізіңіз — қызметкер тексереді'))}</div></div>`;
    return `<div data-kgd="${scope}" style="margin:6px 0">${howNote('kgdOnline')}<button class="btn sm grey" data-act="r5Kgd" data-s="${scope}">${esc(T('Проверить в КГД онлайн', 'Online im KGD prüfen', 'Check online in KGD', 'ҚМД-да онлайн тексеру'))}</button>${r && res ? ` <span class="sub">${esc(T('проверено ', 'geprüft ', 'checked ', 'тексерілді '))}${r.at} · ${esc(T('КГД (симуляция)', 'KGD (Simulation)', 'KGD (simulation)', 'ҚМД (симуляция)'))}</span>` : ''}${body}</div>`;
  };
  const liqBlock = bin => { const r = kgdOnline(bin); if (r.st !== 'liquidated') return false; AUD('KGD', r.bin, 'Blocked: liquidated'); toast(T('Компания ликвидирована (КГД) — создание запрещено', 'Firma liquidiert (KGD) — Anlage gesperrt', 'Company liquidated (KGD) — creation blocked', 'Компания таратылған (ҚМД) — құруға тыйым'), 'err'); return true; };
  const cmAdd0 = ACT.cmCustAdd, ppReg0 = ACT.ppReg;
  Object.assign(ACT, {
    r5Kgd: d => { const bin = getBin(d.s), res = kgdOnline(bin); Q.kgd[d.s] = { bin: tn(bin), res, at: clock() }; AUD('KGD', res.bin ? res.bin.slice(0, 4) + '…' + res.bin.slice(-2) : '—', 'Online check: ' + res.st); render(); },
    r5KgdFill: d => { const r = Q.kgd[d.s], res = r && r.res; if (!res || res.st !== 'active') return; if (d.s === 'cm' && globalThis.cmSet) { cmSet('name', res.name); cmSet('city', res.city); } if (d.s === 'pp' && globalThis.PP) { PP.reg.company = res.name; PP.reg.city = res.city; } AUD('KGD', res.bin.slice(0, 4) + '…', 'Form filled from KGD'); render(); },
    cmCustAdd: d => { if (globalThis.cmGet && liqBlock(cmGet('bin'))) return; if (cmAdd0) cmAdd0(d); },
    ppReg: d => { if (globalThis.PP && liqBlock(PP.reg.bin)) return; if (ppReg0) ppReg0(d); },
  });
})();
