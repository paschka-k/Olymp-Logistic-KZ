/* ---- H3 · 0.3.11 parity for dispatch, Go/No-Go release, safety simulations, the working-day header, inbox texts and the weather data
   (docs/parity-0311/autotests-gap.md, file h3). 0.3.11 scenarios: «FR-33 Авария» 313, «FR-33 Диспетчер» 314, «FR-51 ДОПОГ» 430,
   «Версии и дата» 552–553, «FR-91…100 Рейсы и Go/No-Go» 612/614, «FR-135 Справочник мест, казахский, системные тексты» 666/669–671,
   «FR-173 Формы для существующих API» 709, and «Данные · погода» 121–133 (the forecast of every network city: a data gap in v6,
   WEATHER.WX had 10 of 23 cities and the others silently fell back to hub AST). v6 differs from the 0.3.11 seed: no R-103 / R-106,
   so the scenarios run on the v6 trips that have the same properties (a chilled trip through Karaganda, an ADR trip with a certified driver). ---- */
{
  const CYR = /[А-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ]/;

  /* ---------- «Данные · погода» 121–133: every network city has its own forecast ---------- */
  await group('weather data (0.3.11 «Данные · погода» 121–133): every city of the network map has its own 7-day forecast with risk 0–3 — no silent fallback to hub AST', 'ru', async (g, ev) => {
    const cities = ev('KZMAP.CITY.map(c => c[0])'); eq(cities.length, 23, 'network cities on the map');
    const keys = cities.map(c => ev(`WEATHER.cityKey(${JSON.stringify(c)})`)); const bad = cities.filter((c, i) => !keys[i]); eq(bad.length, 0, 'cities without a forecast key: ' + bad.join(', ')); eq(new Set(keys).size, 23, 'one forecast per city (no shared key)');
    for (let i = 0; i < cities.length; i++) {
      const k = keys[i], f = ev(`WEATHER.WX['${k}'] ? WEATHER.WX['${k}'].map(c => ({ max: c.max, min: c.min, wind: c.wind, snow: c.snow, risk: WEATHER.risk(c) })) : null`); assert(f, cities[i] + ' (' + k + '): own forecast, not the fallback of hub AST');
      eq(f.length, 7, cities[i] + ': 7 days'); assert(f.every(c => Number.isFinite(c.max) && Number.isFinite(c.min) && c.min <= c.max && c.wind >= 0 && c.wind < 40), cities[i] + ': min ≤ max, plausible wind'); assert(f.every(c => [0, 1, 2, 3].includes(c.risk)), cities[i] + ': risk levels 0–3');
      assert(f.every(c => c.min > -45 && c.max < 40), cities[i] + ': October / November climate, no extremes'); const hub = ev(`WEATHER.cityHub('${k}')`); assert(ev(`!!HUBS['${hub}']`), cities[i] + ': serving hub ' + hub);
      eq(ev(`WEATHER.cityName('${k}')`), cities[i], cities[i] + ': name in the forecast table');
    }
    /* regional variation: south warmer than north, the plan rows are not copies of the hub rows */
    const mx = k => ev(`WEATHER.WX['${k}'][0].max`); assert(mx('SAR') > mx('AST') + 8 && mx('TUR') > mx('KAR') + 8, 'the south is warmer than the steppe'); assert(mx('PET') < mx('ALA') && mx('OSK') < mx('TAR'), 'north-east colder than the south');
    const sig = k => ev(`JSON.stringify(WEATHER.WX['${k}'])`), own = keys.filter(k => ev(`!HUBS['${k}']`)); assert(own.every(k => sig(k) !== sig(ev(`WEATHER.cityHub('${k}')`))), 'no city repeats the forecast of its hub');
  });
  await group('weather data: the other network cities are listed under the main table, selectable, and the free-text spelling resolves to one city (0.3.11 666 «Қарағанды» = «Karaganda» = «Караганда»)', 'ru', async (g, ev, w) => {
    ev("go('routes'); ACT.stab({s:'routes',v:'wx'})"); const d = w.document;
    eq(d.querySelectorAll('#wx_grid tbody tr').length, 10, 'main table: 5 hubs + 5 West cities'); eq(d.querySelectorAll('#wx_grid_more tbody tr').length, 13, 'second table: the other 13 network cities'); assert(d.querySelector('[data-wx-more]'), 'heading of the second table');
    for (const k of ['TAR', 'PAV', 'OSK', 'SAR']) assert(d.querySelector(`#wx_grid_more [data-wx-city="${k}"]`), k + ' row');
    ev("ACT.wxCity({id:'OSK'})"); eq(ev('S.wx.sel'), 'OSK'); assert(d.querySelector('[data-wx-card]').innerText.includes('Усть-Каменогорск') && d.querySelectorAll('[data-wx-card] .prm').length === 7, 'city card of Oskemen with 7 days');
    for (const t of ['Қарағанды', 'Karaganda', 'Караганда', 'karaganda', ' KARAGANDA ', 'KAR']) eq(ev(`WEATHER.cityKey(${JSON.stringify(t)})`), 'KAR', 'cityKey ' + t);
    eq(ev("WEATHER.cityKey('Өскемен')"), 'OSK'); eq(ev("WEATHER.cityKey('Усть-Каменогорск')"), 'OSK'); eq(ev("WEATHER.cityKey('Oskemen')"), 'OSK'); eq(ev("WEATHER.cityKey('Köln')"), null, 'unknown town'); eq(ev("WEATHER.cityKey('')"), null);
    ev("S.hub = 'SHY'; render()"); const hubs = [...d.querySelectorAll('[data-wx-city]')].map(e => ev(`WEATHER.cityHub('${e.dataset.wxCity}')`)); assert(hubs.length >= 5 && hubs.every(h => h === 'SHY'), 'the hub filter reaches the second table: ' + hubs.join(',')); assert(d.querySelector('#wx_grid_more [data-wx-city="TUR"]'), 'Turkistan belongs to hub Shymkent'); ev("S.hub = ''"); clean(w, 'weather');
  });
  await group('weather data renders in every language without undefined / NaN; DE / EN without Cyrillic', 'ru', async () => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { gg.ev("go('routes'); ACT.stab({s:'routes',v:'wx'}); ACT.wxCity({id:'SAR'})"); clean(gg.w, lang + ' weather'); const t = gg.w.document.querySelector('#wx_grid_more').innerText + ' ' + gg.w.document.querySelector('[data-wx-card]').innerText;
      if (lang === 'de' || lang === 'en') assert(!CYR.test(t), lang + ' has Cyrillic: ' + (t.match(/.{0,20}[А-Яа-яЁё].{0,20}/) || [''])[0]); eq(gg.ev('Object.keys(WEATHER.WX).length'), 23, lang + ': 23 forecasts'); } finally { gg.done(); } }
  });

  /* ---------- FR-33 Авария 313 / Диспетчер 314 / ДОПОГ 430 ---------- */
  await group('FR-33 breakdown (0.3.11 313): the «Breakdown» simulation on a trip through Karaganda opens a playbook and offers the contacts of the service partner of Karaganda', 'ru', async (g, ev, w) => {
    const L = ev("S.loads.find(l => ['in_transit', 'loading', 'assigned'].includes(l.status) && l.truck && routeCities(l).includes('KAR')).id"); const h0 = ev(`trk(load('${L}').truck).health`); ev(`go('routes'); ACT.stab({s:'routes',v:'sec'}); document.querySelector('#ssim_l').value = '${L}'; ACT.secSim({v:'breakdown'})`);
    const inc = ev('S.inc[0]'); assert(inc.sim === L && inc.pb.length >= 3 && inc.pb.every(x => x.length > 10), 'playbook with ≥ 3 steps: ' + JSON.stringify(inc.pb)); assert(ev(`trk(load('${L}').truck).health`) === 'red', 'the truck is flagged');
    const ws = ev(`serviceOnRoute(load('${L}'))`); assert(ws, 'a service partner on the route'); const ahead = ev(`tripStops(load('${L}')).filter(s => !s.passed && s.cc).map(s => s.cc)`), wsCc = ev(`(S.partners.find(p => p.id === '${ws.id}') || {}).city`); assert(ahead.includes(wsCc === 'KST' ? 'KOS' : wsCc), 'the service is ahead on the route, not behind (stops ahead: ' + ahead.join('>') + ', service in ' + wsCc + ')');   /* v6: the nearest workshop ahead of the broken-down truck; 0.3.11 always had it in Karaganda */ assert(ev(`S.partners.find(p => p.id === '${ws.id}').type`) === 'ws', 'it is a workshop');
    const people = ev(`partnerContacts(S.partners.find(p => p.id === '${ws.id}'))`); assert(people.length >= 2 && people.every(c => c.name && c.role && c.tel && c.mob), 'contacts with name, role, phone, mobile: ' + people.length);
    ev('go("dashboard")'); const d = w.document, card = d.querySelector('[data-playbook]'); assert(card && d.querySelectorAll('[data-playbook] li').length === inc.pb.length, 'playbook card on the dashboard'); const b = card.querySelector(`[data-act=trPartner][data-id="${ws.id}"]`); assert(b && b.textContent.includes(ws.name), 'button with the contacts of the service');
    b.click(); assert(d.querySelectorAll('[data-contact]').length >= 2, 'the contact drawer lists the people'); ev(`ACT.ovPbReset({id:'${L}'})`); assert(!d.querySelector('[data-playbook]'), 'reset removes the playbook card'); eq(ev(`trk(load('${L}').truck).health`), h0, 'reset restores the truck health'); clean(w, 'breakdown');
  });
  await group('FR-33 dispatcher (0.3.11 314): the trip detail of a chilled load shows the service on the route with its contacts', 'ru', async (g, ev, w) => {
    const L = ev("S.loads.find(l => ['assigned', 'loading', 'in_transit'].includes(l.status) && l.zone !== 'ambient' && serviceOnRoute(l)).id"); ev(`ACT.open({id:'${L}'})`); const d = w.document, ws = ev(`serviceOnRoute(load('${L}'))`);
    const box = d.querySelector('[data-trip-ws]'); assert(box && box.dataset.tripWs === ws.id, 'service on the route ' + ws.id); assert(box.textContent.includes(ws.name) && box.textContent.includes(ws.tier), 'name and tier'); const n = ev(`partnerContacts(S.partners.find(p => p.id === '${ws.id}')).length`); assert(n >= 2, 'contacts of the service: ' + n);
    const cold = ev(`ops(load('${L}')).orders.some(o => o.cls !== 'ambient')`); if (cold) assert(ev(`S.partners.find(p => p.id === '${ws.id}').reefer`) || ev("!S.partners.some(p => p.type === 'ws' && p.reefer && p.tier !== 'blocked')"), 'a chilled load is served by a reefer workshop when there is one'); clean(w, 'service on route');
  });
  await group('FR-51 ADR (0.3.11 430): a trip with dangerous goods shows the responsible driver with the certificate date in its Go / No-Go checks', 'ru', async (g, ev, w) => {
    const L = ev("S.loads.find(l => ['assigned', 'loading', 'in_transit'].includes(l.status) && loadAdr(l) && l.driver && ADR_DRV[l.driver]).id"), dr = ev(`drv(load('${L}').driver)`); ev(`ACT.open({id:'${L}'})`); const d = w.document;
    const row = [...d.querySelectorAll('.tr-chk')].find(r => /ДОПОГ|ADR/.test(r.textContent)); assert(row, 'ADR check in the trip detail'); assert(row.textContent.includes(dr.name), 'the check names the responsible driver ' + dr.name + ': ' + row.textContent);
    assert(row.textContent.includes(ev(`fd(RES.adrState(drv(load('${L}').driver)).to)`)), 'certificate date in the check'); const g1 = ev(`gate(load('${L}')).find(x => x.key === 'adr')`); assert(g1 && g1.pass && g1.text.includes(dr.name), 'the gate row names the driver too'); clean(w, 'ADR');
  });

  /* ---------- Версии и дата (FR-74/76) 552–553 ---------- */
  for (const lang of LANGS) await group('working-day header (0.3.11 «Версии и дата» 552–553) [' + lang + ']: weekday, date and the Astana zone in the language of the interface', lang, async (g, ev, w) => {
    const t = w.document.querySelector('[data-bizdate]').textContent.trim(); assert(t.startsWith({ ru: 'Вс', de: 'So', en: 'Sun', kk: 'Жс' }[lang]), 'weekday (Sunday): ' + t); assert(t.includes('18.10.2026'), 'demo date: ' + t);
    assert(t.includes({ ru: 'Астана', de: 'Astana', en: 'Astana', kk: 'Астана' }[lang]) && /UTC\+5/.test(t), 'zone: ' + t); if (lang === 'de' || lang === 'en') assert(!CYR.test(t), lang + ' header has Cyrillic: ' + t);
    eq(ev('opsToday'), '2026-10-18', 'ops day'); const d2 = ev('fd(opsToday)'); assert(/18/.test(d2) && /2026/.test(d2), 'fd() date: ' + d2); clean(w, 'header ' + lang);
  });

  /* ---------- FR-91…100 Рейсы и Go/No-Go 612 / 614 ---------- */
  await group('Go / No-Go (0.3.11 FR-91 612): revoking a release — a trip without a release is refused, a reason outside the list is refused, a valid revoke withdraws the permission', 'ru', async (g, ev, w) => {
    const L = 'LD-2026-001851'; assert(!ev(`released(load('${L}'))`), 'not released at the start'); assert(typeof ev(`revokeErr('${L}', 'weather')`) === 'string', '409: no release to revoke'); eq(ev(`revoke('${L}', 'weather')`), false, 'revoke without a release does nothing');
    eq(ev(`release('${L}', 'exception for the revoke test, cleared by ops lead')`), null, 'released with an audited exception'); assert(ev(`released(load('${L}'))`), 'released');
    for (const bad of ['nonsense', 'x', 'constructor', '__proto__']) { assert(typeof ev(`revokeErr('${L}', ${JSON.stringify(bad)})`) === 'string', '422: reason "' + bad + '" is outside the list'); eq(ev(`revoke('${L}', ${JSON.stringify(bad)})`), false, bad + ' is refused'); assert(ev(`released(load('${L}'))`), 'still released after "' + bad + '"'); }
    const keys = ev('Object.keys(REVOKE)'); assert(keys.length >= 6 && keys.includes('weather') && keys.includes('other'), 'the reason list: ' + keys.join(','));
    ev("ACT.open({id:'" + L + "'}); S.ops.docSel = '" + L + "'"); eq(ev(`revoke('${L}', 'weather')`), true, 'a valid reason revokes'); assert(!ev(`released(load('${L}'))`), 'permission withdrawn'); eq(ev(`ops(load('${L}')).revoked.why`), 'weather', 'reason stored'); assert(ev("S.audit.some(a => a.decision === 'Revoke' && /#?weather|погода|Wetter|weather/i.test(a.note || a.reason || a.detail || JSON.stringify(a)))"), 'audit record');
    assert(typeof ev(`revokeErr('${L}', 'weather')`) === 'string', 'a second revoke is refused (409)');
    ev("setStatus('" + L + "','loading')"); assert(ev(`canMove(load('${L}'), 'in_transit')`), 'the trip is blocked again until the gate is passed and released'); clean(w, 'revoke');
  });
  await group('dashboard KPI (0.3.11 FR-100 614): «Alarms» counts every open risk / critical alarm even when the list shows only the first 9', 'ru', async (g, ev, w) => {
    const kpi = () => num(w.document.querySelectorAll('[data-ov-kpis] .kpi-tile')[5].querySelector('.value').textContent); const num = s => parseInt(String(s).replace(/\D/g, ''), 10);
    ev("go('dashboard')"); const k0 = kpi(), n0 = w.document.querySelectorAll('[data-ov-alarm]').length; assert(n0 >= 3 && n0 <= 9, 'list before ' + n0);
    const cats = ev('Object.keys(ALARM_CAT)'), hubs = ev('Object.keys(HUBS)'); let made = 0; for (const c of cats) for (const h of hubs) if (made < 14 && ev(`(() => { const n = S.alarms.length; raiseAlarm({ lvl: 3, cat: '${c}', hub: '${h}', load: null, truck: null, text: 'H3 alarm ${c} ${h}' }); return S.alarms.length > n; })()`)) made++;
    assert(made === 14, 'created alarms ' + made); ev('render()'); const k1 = kpi(), n1 = w.document.querySelectorAll('[data-ov-alarm]').length;
    eq(n1, 9, 'the list is capped at 9'); eq(k1, k0 + 14, 'the KPI counts all of them (' + k0 + ' + 14), not only the 9 listed'); assert(k1 > n1, 'the KPI exceeds the list'); assert(w.document.querySelector('[data-ov-kpis] .kpi-tile:nth-child(6)').innerText.length > 0, 'tile text');
    ev("S.alarms.filter(a => /^H3 alarm/.test(a.text)).forEach(a => { a.status = 'closed'; }); render()"); eq(kpi(), k0, 'closed alarms leave the KPI'); clean(w, 'kpi alarms');
  });

  /* ---------- FR-135 666 / 669–671: inbox texts ---------- */
  await group('inbox (0.3.11 666): a message about «Қарағанды» / «Karaganda» is routed as one city — the road / weather message acts on the trip through Karaganda', 'ru', async (g, ev, w) => {
    const L = ev("S.loads.find(l => ['in_transit', 'loading', 'assigned'].includes(l.status) && routeCities(l).includes('KAR')).id"); const before = ev(`roadRisk(load('${L}')) ? roadRisk(load('${L}')).lvl : 0`);
    const keys = ['Қарағанды', 'Karaganda', 'Караганда'].map(t => ev(`WEATHER.cityKey(${JSON.stringify(t)})`)); assert(keys.every(k => k === 'KAR'), 'three spellings, one city: ' + keys.join(','));
    for (const t of ['Қарағанды', 'Karaganda']) { const cc = ev(`WEATHER.cityKey(${JSON.stringify(t)})`); const m = ev(`inboxAdd({ kind: 'weather_warning', via: 'manual', src: 'Kazhydromet', title: 'Storm warning ${t}', city: ${JSON.stringify(t)}, cc: '${cc}', lvl: 3 })`); assert(m.cc === 'KAR', 'message city code'); assert(ev(`roadRisk(load('${L}')) && roadRisk(load('${L}')).lvl === 3`), t + ': the trip through Karaganda is at risk level 3'); ev(`S.inbox.find(x => x.id === '${m.id}').st = 'done'`); }
    eq(ev(`roadRisk(load('${L}')) ? roadRisk(load('${L}')).lvl : 0`), before, 'closed messages leave the risk'); eq(ev("ROAD_CITY.KAR"), ev('HUBS.KAR.city'), 'the city list names Karaganda'); clean(w, 'inbox city');
  });
  await group('inbox (0.3.11 669–671, BUG-34): demo connector messages (storm, security) and the simulations exist in all four languages — DE / EN without Cyrillic, no transliteration', 'ru', async () => {
    const texts = async lang => { const gg = await fresh(lang); try { return gg.ev("({ inbox: S.inbox.map(m => [m.id, m.title, m.text]), sims: MIRROR_SIMS.map(s => s[1]), kinds: Object.keys(INBOX_KIND).map(k => INBOX_KIND[k]), sims2: S.inc.map(i => [i.type, i.text]), pb: ['fire', 'breakdown', 'theft'].map(k => (globalThis.SIM_PB && SIM_PB[k]) || null) })"); } finally { gg.done(); } };
    const ru = await texts('ru'), kk = await texts('kk'), de = await texts('de'), en = await texts('en'); assert(ru.inbox.length >= 8, 'seed messages ' + ru.inbox.length); const storm = ru.inbox.findIndex(m => m[0] === 'IN-0002'), sec = ru.inbox.findIndex(m => /Wialon|Дверь/.test(m[1] + m[2]));
    assert(storm >= 0 && sec >= 0, 'storm and security demo messages found');
    for (const [name, L] of [['de', de], ['en', en]]) { L.inbox.forEach(m => assert(!CYR.test(m[1] + ' ' + m[2]) || /ТОО|[A-Z0-9]{3} [A-Z]{3} \d\d/.test(m[1] + m[2]), name + ': ' + m[0] + ' is not translated: ' + m[1])); L.sims.forEach(s => assert(!CYR.test(s), name + ': simulation name ' + s)); L.kinds.forEach(s => assert(!CYR.test(s), name + ': message kind ' + s)); }
    for (const i of [storm, sec]) { assert(de.inbox[i][1] !== ru.inbox[i][1] && en.inbox[i][1] !== ru.inbox[i][1] && kk.inbox[i][1] !== ru.inbox[i][1], 'message ' + ru.inbox[i][0] + ' differs per language'); assert(/[ӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(kk.inbox[i][1] + kk.inbox[i][2]), 'kk text uses Kazakh letters: ' + kk.inbox[i][1]); assert(de.inbox[i][1] !== en.inbox[i][1] || /^[A-Za-z0-9 ]+$/.test(de.inbox[i][1]), 'de differs from en'); }
    assert(!/[ӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(de.inbox[storm][1] + en.inbox[storm][1]), 'no Kazakh letters in DE / EN'); assert(/Qaragandy|Karaganda/.test(en.inbox[storm][1]), 'EN names the city in Latin: ' + en.inbox[storm][1]);
  });

  /* ---------- FR-173 709: vehicles of a line ---------- */
  await group('lines (0.3.11 709, FR-173): a truck can be assigned to a line only from the hub where the line starts; every change is audited and versioned', 'ru', async (g, ev, w) => {
    const ln = ev("S.res.lines.find(l => l.active && l.veh.length < 9)"); assert(ln, 'a line with room for another truck'); const hub = ln.from, ok = ev(`S.trucks.find(t => t.hub === '${hub}' && !S.res.lines.find(x => x.id === '${ln.id}').veh.includes(t.id))`), other = ev(`S.trucks.find(t => t.hub !== '${hub}' && t.hub !== '${ln.to}')`);   /* the seed lines of the return legs (LN-5, LN-7) run with a truck of the destination hub, so the rule is: a hub at either end of the line */
    assert(other, 'a truck of another hub'); const v0 = ev(`S.res.lines.find(x => x.id === '${ln.id}').veh.slice()`), n0 = ev('S.audit.length');
    if (ok) { eq(ev(`lineVehSet('${ln.id}', ${JSON.stringify(v0.concat(ok.id))})`), true, 'same-hub truck assigned'); assert(ev(`S.res.lines.find(x => x.id === '${ln.id}').veh.includes('${ok.id}')`), 'stored'); assert(ev('S.audit.length') > n0, 'audited'); ev(`lineVehSet('${ln.id}', ${JSON.stringify(v0)})`); }
    eq(ev(`lineVehSet('${ln.id}', ${JSON.stringify(v0.concat(other.id))})`), false, 'a truck of hub ' + other.hub + ' cannot serve the line ' + hub + ' → ' + ln.to); eq(ev(`S.res.lines.find(x => x.id === '${ln.id}').veh.join()`), v0.join(), 'the line vehicles are unchanged');
    ev("S.tab.routes = 'lines'; go('routes')"); const sel = w.document.querySelector(`[data-lnadd="${ln.id}"]`); if (sel) assert([...sel.options].every(o => !o.value || ev(`trk('${o.value}').hub`) === hub), 'the add-vehicle list offers only trucks of ' + hub);
    ev("ACT.setRole({v:'dispatcher'})"); eq(ev(`lineVehSet('${ln.id}', [])`), false, 'planning:admin is required'); clean(w, 'line vehicles');
  });
}
