/* R1 · Mirror 0.3.9: road and weather messages of the inbox act on trips (0.3.9 engine/inbox.ts roadClosures / roadRisk).
   An active message (kind road_closure / weather_warning, not done, not lifted, younger than 24 h or before its "until") whose city
   lies on the route of a load raises that load's risk: Weather tab (closures + risk per trip), informational check "Roads · inbox"
   and card tag on the Dispatch board, weather control of the Go/No-Go gate at level ≥ 3. Message fields: cc / ccTo (city codes of the stretch), road, until. Globals: roadMsgs(), roadRisk(l), routeCities(l), ROAD_CITY. */
(function () {
  const ROAD_TTL_H = 24;
  const CN = { AST: HUBS.AST.city, ALA: HUBS.ALA.city, KAR: HUBS.KAR.city, SHY: HUBS.SHY.city, ATY: HUBS.ATY.city,
    KZO: T('Кызылорда', 'Kysylorda', 'Kyzylorda', 'Қызылорда'), ZHE: T('Жезказган', 'Scheskasgan', 'Zhezkazgan', 'Жезқазған'), BAL: T('Балхаш', 'Balchasch', 'Balkhash', 'Балқаш'),
    TAR: T('Тараз', 'Taras', 'Taraz', 'Тараз'), KOS: T('Костанай', 'Kostanai', 'Kostanay', 'Қостанай'), AKT: T('Актобе', 'Aqtöbe', 'Aktobe', 'Ақтөбе') };
  /* the seed messages get the structured fields that a connector delivers (city, end of the stretch, valid until) */
  const SEED = { road_closure: { cc: 'KZO', ccTo: 'ZHE', road: 'A-17', until: '2026-10-19T06:00:00+05:00' }, weather_warning: { cc: 'KAR', ccTo: '', road: '', until: '2026-10-19T14:30:00+05:00' } };
  /* S.inbox is created by 410 (later in the bundle) → seed lazily on first use; only the two seed messages IN-0001 / IN-0002 */
  const seed = () => (S.inbox || []).forEach(m => { if (SEED[m.kind] && !m.cc && !m.seeded && /^IN-000[12]$/.test(m.id)) Object.assign(m, SEED[m.kind], { seeded: true }); });
  const routeCities = l => [l.from].concat(typeof viaOf === 'function' ? viaOf(l) : [], [l.to]);
  const alive = m => { if (m.st === 'done' || m.lifted) return false; const t = NOW.getTime(); if (m.until) return Date.parse(m.until) > t; return t - Date.parse(m.at) < ROAD_TTL_H * 3600e3; };
  const roadMsgs = () => { seed(); return (S.inbox || []).filter(m => (m.kind === 'road_closure' || m.kind === 'weather_warning') && m.cc && alive(m)); };
  const touches = (m, l) => { const rc = routeCities(l); return rc.includes(m.cc) && (!m.ccTo || rc.includes(m.ccTo)); };
  const msgText = m => (m.kind === 'road_closure' ? (m.road ? m.road + ' ' : '') : '') + (CN[m.cc] || m.cc) + (m.ccTo ? ' — ' + (CN[m.ccTo] || m.ccTo) : '') + (m.until ? ' · ' + T('до ', 'bis ', 'until ', 'дейін ') + fdt(m.until) : '');
  /* the strongest message on the route: { lvl, text, msg } or null */
  const roadRisk = l => { let best = null; roadMsgs().filter(m => touches(m, l)).forEach(m => { if (!best || m.lvl > best.lvl) best = { lvl: m.lvl, text: (INBOX_KIND[m.kind] || m.kind) + ' · ' + msgText(m), msg: m }; }); return best; };
  const loadsOfMsg = m => S.loads.filter(l => isActive(l) && touches(m, l));
  Object.assign(globalThis, { roadMsgs, roadRisk, routeCities, roadMsgText: msgText, loadsOfMsg, ROAD_CITY: CN });
})();
