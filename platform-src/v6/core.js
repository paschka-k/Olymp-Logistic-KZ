/* v6 core: i18n, helpers, icons, store + dispatch rules, shell, drawer, router. */
const LANG = '@@LANG@@';
const LI = { ru: 0, de: 1, en: 2, kk: 3 }[LANG];
const HOOKS = { status: [] };   // screens subscribe here (e.g. hubs create inbound jobs when a load departs)
const hmm = m => { const x = Math.floor(m + 1e-9); return p2(Math.floor(x / 60) % 24) + ':' + p2(x % 60); };
const fileFor = l => (l === 'ru' ? 'platform-v6.html' : 'platform-v6-' + l + '.html');
const T = (...a) => (a[LI] != null ? a[LI] : a[0]);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const kzt = n => Math.round(n).toLocaleString('ru-RU').replace(/ | /g, ' ') + ' ₸';
const p2 = n => String(n).padStart(2, '0');
const fdt = iso => { const d = new Date(iso); return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + ', ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); };

const IC = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  package: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  kanban: '<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>',
  truck: '<path d="M2 6h11v10H2z"/><path d="M13 9h4l4 4v3h-8z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  route: '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h8a3 3 0 000-6H8a3 3 0 010-6h8"/>',
  warehouse: '<path d="M3 21V9l9-5 9 5v12"/><path d="M7 21v-8h10v8"/>',
  file: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6"/><path d="M9 15l2 2 4-4"/>',
  receipt: '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  chart: '<path d="M4 20V4"/><path d="M4 20h16"/><rect x="8" y="11" width="3" height="6"/><rect x="14" y="7" width="3" height="10"/>',
  spark: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  bell: '<path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 21a2 2 0 004 0"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  therm: '<path d="M14 14.8V5a2 2 0 00-4 0v9.8a4 4 0 104 0z"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>',
  up: '<path d="M7 17L17 7M9 7h8v8"/>',
};
const ic = (n, s = 16) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${IC[n] || ''}</svg>`;

/* ---------- labels & status vocabulary (one palette everywhere, spec P3) ---------- */
const ST = {
  unassigned: { c: 'gray',   l: T('Не назначен', 'Offen', 'Unassigned', 'Тағайындалмаған') },
  assigned:   { c: 'blue',   l: T('Назначен', 'Zugewiesen', 'Assigned', 'Тағайындалған') },
  loading:    { c: 'yellow', l: T('Погрузка', 'Beladung', 'Loading', 'Тиеу') },
  in_transit: { c: 'green',  l: T('В пути', 'Unterwegs', 'In Transit', 'Жолда') },
  delivered:  { c: 'purple', l: T('Доставлен', 'Geliefert', 'Delivered', 'Жеткізілді') },
  problem:    { c: 'red',    l: T('Проблема', 'Problem', 'Problem', 'Мәселе') },
};
const ORDER = ['unassigned', 'assigned', 'loading', 'in_transit', 'delivered', 'problem'];
const PRI = { high: { c: 'red', l: T('Высокий', 'Hoch', 'High', 'Жоғары') }, medium: { c: 'yellow', l: T('Средний', 'Mittel', 'Medium', 'Орташа') }, low: { c: 'green', l: T('Низкий', 'Niedrig', 'Low', 'Төмен') } };
const ESF = {
  none:      { c: 'gray',   l: T('ЭСФ: нет', 'ESF: keine', 'ESF: none', 'ЭШФ: жоқ') },
  issued:    { c: 'blue',   l: T('ЭСФ: выписана', 'ESF: ausgestellt', 'ESF: issued', 'ЭШФ: жазылды') },
  confirmed: { c: 'green',  l: T('ЭСФ: подтверждена', 'ESF: bestätigt', 'ESF: confirmed', 'ЭШФ: расталды') },
};
const chip = (c, t) => `<span class="chip ${c}">${esc(t)}</span>`;
const stChip = s => chip(ST[s].c, ST[s].l);
const zoneChip = z => `<span class="chip zone-${z}">${ZONES[z].label}</span>`;
const fd = iso => { const d = new Date(iso); return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear(); };
/* document validity: expired / renew soon (<= 30 d) / valid */
const docState = iso => { const days = Math.floor((new Date(iso + 'T23:59:59+05:00') - NOW) / 864e5); return days < 0 ? 'expired' : days <= 30 ? 'soon' : 'valid'; };
const DOCST = { valid: { c: 'green', l: T('Действует', 'Gültig', 'Valid', 'Жарамды') }, soon: { c: 'yellow', l: T('Скоро истекает', 'Läuft bald ab', 'Renew soon', 'Жақында аяқталады') }, expired: { c: 'red', l: T('Просрочен', 'Abgelaufen', 'Expired', 'Мерзімі өтті') } };
const avatar = (ini, n) => `<span class="avatar sm" style="background:var(--av-${n || 1})">${esc(ini)}</span>`;

/* ---------- store ---------- */
const S = {
  loads: [], drivers: [], trucks: [],
  route: 'dashboard', drawer: null, toast: null,
  f: { q: '', status: '', cust: '', zone: '', pri: '', hub: '', drv: '', page: 1 },
  dispTab: 'board', nextId: 1856,
  hubTab: 'hubs', hubView: 'cards', clock: 14 * 60 + 32, costs: [], views: [], rf: { st: '', hub: '', q: '', flag: '' },
};
const loadOfTruck = id => S.loads.find(l => l.truck === id && isActive(l));
const loadOfDriver = id => S.loads.find(l => l.driver === id && isActive(l));
const truckLoc = t => { const l = loadOfTruck(t.id); return l && (l.status === 'in_transit' || l.status === 'problem') ? { city: HUBS[l.from].city + ' → ' + HUBS[l.to].city, sub: T('в пути', 'unterwegs', 'en route', 'жолда') } : { city: HUBS[t.hub].city, sub: HUBS[t.hub].name }; };
const truckState = t => { const l = loadOfTruck(t.id); if (t.status === 'service') return 'service'; if (t.health === 'red' || (l && tempState(l) === 'breach')) return 'critical'; return t.status === 'busy' ? 'busy' : 'available'; };
const TS = { available: { c: 'green', l: T('Свободен', 'Frei', 'Available', 'Бос') }, busy: { c: 'yellow', l: T('В рейсе', 'Im Einsatz', 'In use', 'Рейсте') }, service: { c: 'red', l: T('Сервис', 'Service', 'Maintenance', 'Сервис') }, critical: { c: 'red', l: T('Критично', 'Kritisch', 'Critical', 'Сыни') } };
const rtoDot = d => (d.status === 'rest' || d.rto < 4) ? 'bad' : d.rto < 6 ? 'warn' : 'good';
const agoTxt = m => m < 60 ? m + ' ' + T('мин назад', 'Min. her', 'min ago', 'мин бұрын') : Math.round(m / 60) + ' ' + T('ч назад', 'Std. her', 'h ago', 'сағ бұрын');
const cust = id => CUSTOMERS.find(c => c.id === id);
const drv = id => S.drivers.find(d => d.id === id);
const trk = id => S.trucks.find(t => t.id === id);
const load = id => S.loads.find(l => l.id === id);
const hrs = l => Math.round(dist(l.from, l.to) / 65 * 10) / 10;
/* driving time the driver must still have: one shift (max 9 h); longer routes get planned rest stops (norms to be verified, spec Q5) */
const needRto = l => Math.min(hrs(l), typeof CFG !== 'undefined' ? CFG.live.shift : 9);
const tempState = l => { const z = ZONES[l.zone]; if (l.temp < z.lo || l.temp > z.hi) return 'breach'; return (l.temp - z.lo < 0.8 || z.hi - l.temp < 0.8) ? 'warn' : 'ok'; };
const tempChip = l => `<span class="chip temp-${tempState(l)}">${l.temp > 0 ? '+' : ''}${String(l.temp).replace('.', ',')} °C</span>`;
const revenue = l => dist(l.from, l.to) * ZONES[l.zone].rate;
const cost = l => Math.round(revenue(l) * 0.78);
const isActive = l => ['assigned', 'loading', 'in_transit', 'problem'].includes(l.status);

function compat(l, d, t) {
  const why = [];
  if (!t.zones.includes(l.zone)) why.push(T('ТС не подходит по температурной зоне', 'Fahrzeug passt nicht zur Temperaturzone', 'Truck does not support the temperature zone', 'КҚ температура аймағына сәйкес емес'));
  if (t.cap < l.pallets) why.push(T('Недостаточно паллето-мест', 'Zu wenige Palettenplätze', 'Not enough pallet places', 'Паллет орны жеткіліксіз'));
  if (t.status !== 'available') why.push(T('ТС занято или в сервисе', 'Fahrzeug belegt oder im Service', 'Truck busy or in service', 'КҚ бос емес немесе сервисте'));
  if (d.status !== 'available') why.push(T('Водитель недоступен', 'Fahrer nicht verfügbar', 'Driver unavailable', 'Жүргізуші қолжетімсіз'));
  if (d.rto < needRto(l)) why.push(T('Не хватает времени вождения (РТО)', 'Lenkzeit reicht nicht (RTO)', 'Not enough driving time (RTO)', 'Жүргізу уақыты (РТО) жеткіліксіз'));
  if (d.docs && d.docs.some(x => (x.type === 'lic' || x.type === 'med') && docState(x.to) === 'expired')) why.push(T('У водителя просрочены права или медосмотр', 'Führerschein oder Untersuchung des Fahrers abgelaufen', 'Driver licence or medical certificate expired', 'Жүргізушінің куәлігі немесе медтексеруі мерзімі өтті'));
  if (l.zone === 'pharma' && t.docs && docState(t.docs.calib) === 'expired') why.push(T('Поверка датчиков ТС просрочена (GDP, фарма)', 'Kalibrierung der Sensoren abgelaufen (GDP, Pharma)', 'Sensor calibration expired (GDP, pharma)', 'Датчиктер поверкасы мерзімі өтті (GDP, фарма)'));
  return why;
}
function assign(id, did, tid) {
  const l = load(id), d = drv(did), t = trk(tid);
  if (!l || !d || !t) return T('Выберите водителя и ТС', 'Fahrer und Fahrzeug wählen', 'Select driver and truck', 'Жүргізуші мен КҚ таңдаңыз');
  const why = compat(l, d, t); if (why.length) return why[0];
  l.driver = did; l.truck = tid; l.status = 'assigned'; d.status = 'busy'; t.status = 'busy';
  l.notes.push({ who: 'System', t: fdt(NOW).slice(-5), text: T('Назначено: ', 'Zugewiesen: ', 'Assigned: ', 'Тағайындалды: ') + d.name + ' / ' + t.plate });
  return null;
}
function autoAssign() {
  let ok = 0, fail = 0;
  const rank = { high: 0, medium: 1, low: 2 };
  S.loads.filter(l => l.status === 'unassigned').sort((a, b) => rank[a.priority] - rank[b.priority] || a.eta.localeCompare(b.eta)).forEach(l => {
    const ts = S.trucks.filter(t => t.zones.includes(l.zone)).sort((a, b) => a.cap - b.cap);
    const ds = S.drivers.slice().sort((a, b) => a.rto - b.rto);
    let done = false;
    for (const t of ts) { for (const d of ds) { if (!compat(l, d, t).length && !assign(l.id, d.id, t.id)) { done = true; break; } } if (done) break; }
    if (done) ok++; else fail++;
  });
  return { ok, fail };
}
const NEXT = { assigned: 'loading', loading: 'in_transit', in_transit: 'delivered' };
function setStatus(id, st) {
  const l = load(id); if (!l) return;
  const was = l.status; l.status = st;
  if (st === 'in_transit' && l.progress === 0) l.progress = 0.05;
  if (st === 'delivered') {
    l.progress = 1; l.pod = 'pending';
    const d = drv(l.driver), t = trk(l.truck); if (d) d.status = 'available'; if (t) t.status = 'available';
  }
  if (st === 'problem') { l.temp = ZONES[l.zone].hi + 1.4; }
  if (was === 'problem' && st === 'in_transit') { l.temp = ZONES[l.zone].mid; }
  l.notes.push({ who: 'System', t: fdt(NOW).slice(-5), text: ST[was].l + ' → ' + ST[st].l });
  HOOKS.status.forEach(f => f(l, was, st));
}
function canMove(l, to) {
  if (to === 'assigned' && l.status === 'unassigned') return T('Сначала назначьте водителя и ТС', 'Erst Fahrer und Fahrzeug zuweisen', 'Assign a driver and truck first', 'Алдымен жүргізуші мен КҚ тағайындаңыз');
  if (NEXT[l.status] === to) return null;
  if (to === 'problem' && ['loading', 'in_transit'].includes(l.status)) return null;
  if (l.status === 'problem' && to === 'in_transit') return null;
  return T('Недопустимый переход статуса', 'Statuswechsel nicht erlaubt', 'Status change not allowed', 'Күй ауысуына рұқсат жоқ');
}
function createLoad(f) {
  if (f.from === f.to) return T('Пункты отправления и назначения совпадают', 'Start und Ziel sind gleich', 'Origin and destination are the same', 'Жөнелту және межелі пункт бірдей');
  if (!(f.pallets >= 1 && f.pallets <= 33)) return T('Паллет: от 1 до 33', 'Paletten: 1 bis 33', 'Pallets: 1 to 33', 'Паллет: 1-ден 33-ке дейін');
  const id = String(S.nextId++).padStart(6, '0');
  const l = mkLoad(id, f.cust, f.from, f.to, f.zone, f.pallets, f.pallets * 330, f.priority, 'unassigned', new Date(NOW.getTime() + hrs({ from: f.from, to: f.to }) * 3600e3 + 6 * 3600e3).toISOString());
  S.loads.unshift(l); return { ok: l.id };
}

/* ---------- navigation (spec 2.1) ---------- */
const NAV = [
  ['dashboard', 'grid', T('Обзор', 'Übersicht', 'Dashboard', 'Шолу'), 2],
  ['orders', 'package', T('Заказы и рейсы', 'Aufträge & Fahrten', 'Orders & Loads', 'Тапсырыстар мен рейстер'), 2],
  ['dispatch', 'kanban', T('Диспетчерская доска', 'Dispositionstafel', 'Dispatch Board', 'Диспетчерлік тақта'), 2],
  ['fleet', 'truck', T('Автопарк', 'Fuhrpark', 'Fleet', 'Автопарк'), 3],
  ['drivers', 'user', T('Водители', 'Fahrer', 'Drivers', 'Жүргізушілер'), 3],
  ['routes', 'route', T('Маршруты и трекинг', 'Routen & Tracking', 'Routes & Tracking', 'Маршруттар және трекинг'), 3],
  ['hubs', 'warehouse', T('Хабы и склады', 'Hubs & Lager', 'Warehouses & Hubs', 'Хабтар мен қоймалар'), 4],
  ['pod', 'file', T('Подтверждение доставки', 'Lieferbestätigung', 'Proof of Delivery', 'Жеткізуді растау'), 5],
  ['billing', 'receipt', T('Счета и ЭСФ', 'Rechnungen & ESF', 'Billing & Invoices', 'Шоттар және ЭШФ'), 5],
  ['reports', 'chart', T('Отчёты', 'Berichte', 'Reports', 'Есептер'), 6],
  ['ai', 'spark', T('AI-ассистент', 'KI-Assistent', 'AI Ops Assistant', 'AI-көмекші'), 6],
  ['settings', 'cog', T('Настройки', 'Einstellungen', 'Settings', 'Баптаулар'), 6],
];
const SCREENS = {};   // id -> { title, sub, actions(), body(), search }
const navLabel = id => (NAV.find(n => n[0] === id) || [])[2] || id;

function toast(msg, kind) { S.toast = { msg, kind: kind || 'ok' }; render(); clearTimeout(toast.t); toast.t = setTimeout(() => { S.toast = null; render(); }, 3200); }
function go(r) { S.route = r; S.drawer = null; S.f.page = 1; render(); const m = $('main'); if (m) m.scrollTop = 0; }
function openDrawer(d) { S.drawer = d; render(); }
const closeDrawer = () => { S.drawer = null; render(); };
const alertsCount = () => S.loads.filter(l => tempState(l) === 'breach' && isActive(l)).length + S.drivers.filter(d => d.rto < 4 && d.status === 'available').length;

function shell() {
  const sc = SCREENS[S.route];
  const nav = NAV.map(n => `<div class="nav-item${n[0] === S.route ? ' active' : ''}" data-act="go" data-v="${n[0]}">${ic(n[1])}<span>${esc(n[2])}</span></div>`).join('');
  const lang = ['ru', 'de', 'en', 'kk'].map(l => `<a href="${fileFor(l)}"${l === LANG ? ' class="on"' : ''}>${l.toUpperCase()}</a>`).join('');
  const body = sc ? sc.body() : placeholder(S.route);
  const title = sc ? sc.title() : navLabel(S.route);
  return `<div class="app"><aside class="sidebar"><div class="logo">Olymp&nbsp;Logistic</div>${nav}<div class="langs">${lang}</div></aside>
<main><header class="topbar"><span class="crumb">${esc(navLabel('dashboard'))} › <b>${esc(navLabel(S.route))}</b></span>
<div class="who"><label class="searchbox">${ic('search', 14)}<input id="gsearch" placeholder="${esc(T('Поиск рейсов, ТС, водителей…', 'Fahrten, Fahrzeuge, Fahrer suchen…', 'Search loads, trucks, drivers…', 'Рейс, КҚ, жүргізуші іздеу…'))}" value="${esc(S.f.q)}"></label>
<span class="bell">${ic('bell', 18)}${alertsCount() ? `<span class="badge-count">${alertsCount()}</span>` : ''}</span>
<div class="usr"><b>Sarah Johnson</b><small>${esc(T('Руководитель операций', 'Betriebsleiterin', 'Operations Manager', 'Операциялар басшысы'))}</small></div><span class="avatar" style="background:var(--primary)">SJ</span></div></header>
<div class="page-head"><div><h1 class="page-title">${esc(title)}</h1>${sc && sc.sub ? `<p class="page-sub">${esc(sc.sub())}</p>` : ''}</div><div class="actions">${sc && sc.actions ? sc.actions() : ''}</div></div>
<div class="content">${body}</div></main>${drawerHtml()}${S.toast ? `<div class="toast ${S.toast.kind}">${esc(S.toast.msg)}</div>` : ''}</div>`;
}
function placeholder(id) {
  const ph = NAV.find(n => n[0] === id)[3];
  return `<div class="card card-body"><h3 style="margin:0 0 8px">${esc(navLabel(id))}</h3><p class="note">${esc(T('Экран будет перенесён на новую дизайн-систему в фазе ', 'Der Screen wird in Phase ', 'This screen moves to the new design system in phase ', 'Бұл экран жаңа дизайн-жүйеге '))}${ph}${esc(T(' (см. спецификацию, раздел 7).', ' auf das neue Designsystem migriert (siehe Spezifikation, Abschnitt 7).', ' (see specification, section 7).', '-кезеңде көшіріледі (спецификация, 7-бөлім).'))}</p></div>`;
}
function drawerHtml() {
  const d = S.drawer; if (!d) return '';
  const r = DRAWERS[d.type](d);
  return `<aside class="drawer open${r.xl ? ' xl' : ''}"><div class="drawer-head"><span>${esc(r.title)}</span><span class="x" data-act="close">${ic('x', 18)}</span></div>${r.html}</aside>`;
}
const DRAWERS = {};

/* ---------- render + events ---------- */
function render() {
  const keep = { y: ($('main') || {}).scrollTop || 0, f: document.activeElement && document.activeElement.id };
  const pos = document.activeElement && document.activeElement.selectionStart;
  const keepIn = {};   // keep what the user typed in drawer fields across re-renders (e.g. a toast)
  $$('.drawer input[id], .drawer select[id], .drawer textarea[id]').forEach(e => { keepIn[e.id] = e.type === 'checkbox' ? e.checked : e.value; });
  $('#root').innerHTML = shell();
  Object.keys(keepIn).forEach(id => { const e = document.getElementById(id); if (e && e.closest('.drawer')) { if (e.type === 'checkbox') e.checked = keepIn[id]; else e.value = keepIn[id]; } });
  const m = $('main'); if (m) m.scrollTop = keep.y;
  if (keep.f) { const e = document.getElementById(keep.f); if (e) { e.focus(); try { e.setSelectionRange(pos, pos); } catch (_) {} } }
}
const ACT = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACT[el.dataset.act]; if (fn) { fn(el.dataset, el, e); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'gsearch') { S.f.q = e.target.value; S.f.page = 1; if (S.route !== 'orders') S.route = 'orders'; render(); }
  else if (e.target.dataset && e.target.dataset.f) { S.f[e.target.dataset.f] = e.target.value; S.f.page = 1; render(); }
});
Object.assign(ACT, {
  go: d => go(d.v), close: closeDrawer,
  open: d => openDrawer({ type: 'load', id: d.id, tab: 'overview' }),
  tab: d => { S.drawer.tab = d.v; render(); },
  clear: () => { S.f = { q: '', status: '', cust: '', zone: '', pri: '', hub: '', drv: '', page: 1 }; render(); },
  page: d => { S.f.page = +d.v; render(); },
  create: () => openDrawer({ type: 'create' }),
});
