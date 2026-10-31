/* Help framework (W6). Articles are registered with helpAdd({key, group, screen, tab, title, sub, purpose, who, see[], howto[{t,steps[]}], rules[],
   fr, related[], visuals[], special, portal}); every text is a quad HQ(ru, de, en, kk) — KK may be omitted or shorter: it then falls back to RU and
   the article shows the "text in Russian" marker (FR-135/170). Content files: v6/help/10-start.js … 50-reference.js; visuals 60-visuals.js
   (HELP.visuals[id] → SVG/HTML string); guided tours 70-tours.js (HELP.tours, FR-160). Article key = v6 screen id or "screen/tab" so the
   "?" button of the top bar (ACT.helpHere) opens the article of the current screen / tab; a tab without its own article falls back to the screen. */
const HELP = { groups: [], articles: [], glossary: [], faq: [], deadlines: [], visuals: {}, tours: [] };
const helpGroup = (key, title) => HELP.groups.push({ key, title });
/* helpAdd merges a second article with the same key (the ported manual 10-70 and a workstream file both describe a tab):
   the group of the first stays, scalar fields of the later (workstream) article win, list fields are concatenated. */
const helpAdd = a => {
  const i = HELP.articles.findIndex(x => x.key === a.key);
  if (i < 0) { HELP.articles.push(a); return a; }
  const p = HELP.articles[i], m = Object.assign({}, p, a, { group: p.group });
  for (const f of ['see', 'howto', 'rules']) if (p[f] && a[f]) m[f] = p[f].concat(a[f]);
  for (const f of ['related', 'visuals']) if (p[f] || a[f]) m[f] = Array.from(new Set((p[f] || []).concat(a[f] || []).filter(k => k !== a.key)));
  HELP.articles[i] = m; return m;
};
const tx = v => (Array.isArray(v) ? (v[LI] != null && v[LI] !== '' ? v[LI] : v[0]) : v == null ? '' : v);   // T-quads are arrays only in help data
const HQ = (...a) => a;   // helper to write a text quad in help data: HQ(ru, de, en, kk)
helpGroup('start', T('Начало работы', 'Erste Schritte', 'Getting started', 'Жұмысты бастау'));
helpGroup('ops', T('Операции · 12 разделов', 'Betrieb · 12 Bereiche', 'Operations · 12 sections', 'Операциялар · 12 бөлім'));
helpGroup('records', T('Учёт и администрирование', 'Stammdaten und Verwaltung', 'Records and administration', 'Есеп және әкімшілік'));
helpGroup('portals', T('Порталы и приложение водителя', 'Portale und Fahrer-App', 'Portals and driver app', 'Порталдар және жүргізуші қосымшасы'));
helpGroup('channels', T('Интеграции и каналы', 'Integrationen und Kanäle', 'Integrations and channels', 'Интеграциялар және арналар'));
helpGroup('ref', T('Справочник', 'Nachschlagen', 'Reference', 'Анықтамалық'));
S.help = { key: 'start', q: '' };
const helpArt = k => HELP.articles.find(a => a.key === k);
/* article of the current screen / tab: "screen/tab" if it exists, else the screen article, else the overview */
const helpKeyFor = () => { const r = S.route, sc = SCREENS[r], t = sc && sc.tabs ? (curTab(r) || {}).key : (S.tab[r] || ''); return helpArt(r + '/' + t) ? r + '/' + t : helpArt(r) ? r : 'start'; };
const hText = a => [tx(a.title), tx(a.sub), tx(a.purpose), tx(a.who), a.fr || '', a.key, (a.see || []).map(tx).join(' '), (a.rules || []).map(tx).join(' '),
  (a.howto || []).map(h => tx(h.t) + ' ' + h.steps.map(tx).join(' ')).join(' '),
  a.special === 'glossary' ? HELP.glossary.map(g => tx(g[0]) + ' ' + tx(g[1])).join(' ') : '', a.special === 'faq' ? HELP.faq.map(g => tx(g[0]) + ' ' + tx(g[1])).join(' ') : '',
  a.special === 'deadlines' ? HELP.deadlines.map(d => d.date + ' ' + tx(d.what)).join(' ') : ''].join(' ').toLowerCase();
const hl = (s, q) => (q ? esc(s).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>') : esc(s));
const hasKK = v => Array.isArray(v) && v[3] != null && v[3] !== '';
/* a KK reader sees the marker when the body (purpose) of the article is not translated yet */
const kkFallback = a => LI === 3 && !hasKK(a.purpose);
/* 0.3.11 help/roles.ts PERMS: description of every permission (RU / DE / EN; KK reads the Russian text) */
HELP.permDesc = [["overview:read","Обзор, сводки, планирование, отчёты, исходные данные, входящие","Übersicht, Auswertungen, Planung, Berichte, Ausgangsdaten, Eingang","Overview, summaries, planning, reports, baseline data, inbox"],["orders:read","Видеть заказы и отправки (SSCC)","Aufträge und Sendungen (SSCC) sehen","See orders and shipments (SSCC)"],["orders:write","Создавать и отменять заказы, отмечать заказы к загрузке, досканировать места","Aufträge anlegen und stornieren, Aufträge zur Beladung markieren, Packstücke nachscannen","Create and cancel orders, tick orders for loading, rescan packages"],["trips:read","Видеть рейсы, диспетчер, загрузку, погоду, документы, партнёров","Touren, Disponent, Beladung, Wetter, Dokumente, Partner sehen","See trips, dispatcher, load, weather, documents, partners"],["trips:write","Создавать рейсы, отправлять путевой лист, переносить рейс, планировать тип ТС","Touren anlegen, Fahrauftrag senden, Tour verschieben, Fahrzeugtyp planen","Create trips, send trip sheet, replan trip, plan vehicle type"],["trips:status","Менять статус рейса и точки доставки","Status von Tour und Stopp ändern","Change trip and stop status"],["fleet:read","Видеть автопарк","Fuhrpark sehen","See the fleet"],["fleet:write","Изменять данные ТС","Fahrzeugdaten ändern","Change vehicle data"],["drivers:read","Видеть водителей и персонал (данные замаскированы)","Fahrer und Personal sehen (Daten maskiert)","See drivers and staff (data masked)"],["drivers:write","Назначать срочный рейс, записывать на продление документов","Eilfahrt zuweisen, zur Dokumentverlängerung anmelden","Assign urgent trip, book document renewal"],["pii:read","Открывать персональные данные (ИИН, телефон) — каждое открытие в журнале аудита","Personendaten öffnen (IIN, Telefon) — jede Anzeige im Audit-Protokoll","Reveal personal data (IIN, phone) — every reveal is audited"],["temperature:read","Видеть температуру, термостатус, качество","Temperatur, Thermostatus, Qualität sehen","See temperature, thermo status, quality"],["temperature:write","Записывать показания, импортировать термохроны","Messwerte erfassen, Thermochrone importieren","Record readings, import thermochrons"],["alarms:read","Видеть тревоги и безопасность","Alarme und Sicherheit sehen","See alarms and security"],["alarms:write","Принимать, эскалировать и закрывать тревоги и инциденты","Alarme und Vorfälle annehmen, eskalieren, schließen","Acknowledge, escalate and close alarms and incidents"],["users:admin","Управлять пользователями, ролями, 2FA","Benutzer, Rollen, 2FA verwalten","Manage users, roles, 2FA"],["audit:read","Читать журнал аудита и проверять цепочку","Audit-Protokoll lesen und Kette prüfen","Read the audit log and verify the chain"],["crm:read","Видеть заявки, клиентов, задачи","Anfragen, Kunden, Aufgaben sehen","See leads, customers, tasks"],["crm:write","Вести заявки, клиентов, задачи, тендеры","Anfragen, Kunden, Aufgaben, Ausschreibungen bearbeiten","Work on leads, customers, tasks, tenders"],["data:export","Полная выгрузка всех данных (в журнале аудита)","Vollständiger Datenexport (im Audit-Protokoll)","Full data export (audited)"],["portal","Портал клиента: бронирование и свои бронирования","Kundenportal: Buchen und eigene Buchungen","Customer portal: book and own bookings"],["bookings:manage","Подтверждать / отклонять бронирования, видеть линии и тарифы","Buchungen bestätigen / ablehnen, Linien und Tarife sehen","Confirm / reject bookings, see lines and tariffs"],["planning:admin","Изменять линии и тарифы","Linien und Tarife ändern","Change lines and tariffs"],["integrations:admin","Интеграции, API-ключи, webhooks","Integrationen, API-Schlüssel, Webhooks","Integrations, API keys, webhooks"],["documents:sign","Документы РК: формировать, подписывать ЭЦП, выпуск Go/No-Go","KZ-Dokumente: erstellen, EDS-Signatur, Go/No-Go-Freigabe","KZ documents: generate, e-sign, Go/No-Go release"],["quality:write","Отклонения, CAPA, решение по карантину","Abweichungen, CAPA, Quarantäne-Entscheidung","Deviations, CAPA, quarantine decision"],["partners:write","Передача партнёру, вызов сервиса, договоры","Übergabe an Partner, Serviceeinsatz, Verträge","Partner hand-over, service call, contracts"],["fines:write","Штрафы: импорт, оплата, удержание, оспаривание","Bußgelder: Import, Zahlung, Abzug, Einspruch","Fines: import, pay, deduct, dispute"],["costs:read","Видеть затраты","Kosten sehen","See costs"],["costs:approve","Подпись решения «свой / внешний» (2 подписи)","Unterschrift Eigen-/Fremd-Entscheidung (2 Unterschriften)","Sign own-vs-external decision (2 signatures)"],["approvals:sign","Подпись руководства: экспресс (3 подписи)","Unterschrift der Leitung: Express (3 Unterschriften)","Management signature: express (3 signatures)"],["driver:app","Приложение водителя: чек-лист, путевой лист, ePOD, смена, SOS","Fahrer-App: Checkliste, Fahrauftrag, ePOD, Schicht, SOS","Driver app: checklist, trip sheet, ePOD, shift, SOS"],["partner:portal","Портал партнёра-перевозчика: свои передачи и загрузка ePOD","Portal des Partner-Frachtführers: eigene Übergaben und ePOD-Upload","Partner carrier portal: own hand-overs and ePOD upload"],["trips:override_release","Отправить рейс без действующего выпуска Go/No-Go (с причиной, в журнал аудита)","Tour ohne gültige Go/No-Go-Freigabe abfahren lassen (mit Begründung, im Audit-Protokoll)","Let a trip depart without a valid Go/No-Go release (with a reason, audited)"],["trips:override_load","Запланировать загрузку сверх лимитов ТС (с причиной, в журнал аудита)","Beladung über den Fahrzeuggrenzen planen (mit Begründung, im Audit-Protokoll)","Plan a load above the vehicle limits (with a reason, audited)"]];
function permTable() {
  return `<div style="overflow:auto"><table class="help-perms" data-help-perms><thead><tr><th>${esc(T('Право', 'Recht', 'Permission', 'Құқық'))}</th><th>${esc(T('Что даёт', 'Was es erlaubt', 'What it allows', 'Не береді'))}</th>${ROLES.map(r => `<th${r === S.role ? ' class="you" data-you="1"' : ''}>${esc(ROLE_NAME[r])}</th>`).join('')}</tr></thead><tbody>${HELP.permDesc.map(p => `<tr><td><code>${p[0]}</code></td><td>${esc(tx([p[1], p[2], p[3]]))}</td>${ROLES.map(r => `<td${r === S.role ? ' class="you"' : ''}>${(ROLE_PERMS[r] || []).includes(p[0]) ? '✓' : '·'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
/* access line of an article (0.3.11 Help.tsx): roles that may open the screen / tab, the permission and whether the signed-in role may */
const helpPermOf = a => { if (!a.screen || !SCREENS[a.screen]) return null; const t = (SCREENS[a.screen].tabs || []).find(x => x.key === a.tab); return (t && t.perm) || SCREEN_PERM[a.screen] || (ALWAYS.includes(a.screen) ? null : 'overview:read'); };
const helpRoleCan = (r, a) => { const sn = SHELL_NAV[r]; if (sn) return ALWAYS.includes(a.screen) || sn.some(n => n[0] === a.screen); const p = helpPermOf(a); return !p || (ROLE_PERMS[r] || []).includes(p); };
function accessLine(a) {
  if (!a.screen || !SCREENS[a.screen]) return '';
  const perm = helpPermOf(a), roles = ROLES.filter(r => helpRoleCan(r, a)), mine = canSee(a.screen) && (!perm || canDo(perm) || !!SHELL_NAV[S.role]);
  return `<div class="help-access small" data-help-access>${esc(T('Доступ: ', 'Zugriff: ', 'Access: ', 'Қолжетімділік: '))}${roles.length === ROLES.length ? esc(T('все роли', 'alle Rollen', 'all roles', 'барлық рөлдер')) : esc(roles.map(r => ROLE_NAME[r]).join(', '))}${perm ? ` <code class="help-perm">${perm}</code>` : ''} <span class="chip ${mine ? 'green' : 'gray'}" data-help-mine="${mine ? 1 : 0}">${esc(mine ? T('у вас есть доступ', 'Sie haben Zugriff', 'you have access', 'сізде қолжетімділік бар') : T('нет доступа у вашей роли', 'Ihre Rolle hat keinen Zugriff', 'your role has no access', 'рөліңізде қолжетімділік жоқ'))}</span></div>`;
}
function rolesTable() {
  const scr = Object.keys(SCREEN_PERM);
  return `<div style="overflow:auto"><table><thead><tr><th>${esc(T('Экран', 'Bildschirm', 'Screen', 'Экран'))}</th>${ROLES.map(r => `<th>${esc(ROLE_NAME[r])}</th>`).join('')}</tr></thead><tbody>${scr.map(s => `<tr><td>${esc(navLabel(s))}</td>${ROLES.map(r => `<td>${(ROLE_PERMS[r] || []).includes(SCREEN_PERM[s]) ? '✓' : '·'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
const deadlinesTable = () => `<div style="overflow:auto"><table class="help-dl"><thead><tr><th>${esc(T('Срок', 'Frist', 'Deadline', 'Мерзім'))}</th><th>${esc(T('Что', 'Was', 'What', 'Не'))}</th><th>${esc(T('Где в платформе', 'Wo in der Plattform', 'Where in the platform', 'Платформада қайда'))}</th></tr></thead><tbody>${HELP.deadlines.map(d => `<tr><td><b>${esc(d.date)}</b></td><td>${esc(tx(d.what))}</td><td>${d.screen ? `<a class="lnk" data-act="helpOpen" data-s="${d.screen}" data-t="${d.tab || ''}">${esc(tx(d.where))}</a>` : esc(tx(d.where))}</td></tr>`).join('')}</tbody></table></div>`;
const tourStartScreen = t => t.steps[0].screen;
const tourCan = t => canSee(tourStartScreen(t));
const toursList = () => `<div class="help-tours">${HELP.tours.map(t => `<div class="help-tour" data-tour="${t.id}"><b>${esc(tx(t.title))}</b><span class="note">${esc(T('для: ', 'für: ', 'for: ', 'кімге: '))}${esc(tx(t.who))} · ${t.steps.length} ${esc(T('шагов', 'Schritte', 'steps', 'қадам'))}</span>${tourCan(t) ? `<button class="btn sm primary" data-act="tourStart" data-id="${t.id}">▶ ${esc(T('Начать тур', 'Tour starten', 'Start the tour', 'Турды бастау'))}</button>` : `<span class="chip gray">${esc(T('недоступно вашей роли', 'für Ihre Rolle nicht verfügbar', 'not available to your role', 'рөліңізге қолжетімсіз'))}</span>`}</div>`).join('')}</div>`;
const visualHtml = id => (HELP.visuals[id] ? `<figure class="hv" data-visual="${id}">${HELP.visuals[id]()}</figure>` : '');
function articleHtml(a) {
  const q = S.help.q.trim();
  const ul = (arr, ord) => (arr && arr.length ? `<${ord ? 'ol' : 'ul'}>${arr.map(x => `<li>${hl(tx(x), q)}</li>`).join('')}</${ord ? 'ol' : 'ul'}>` : '');
  const rel = (a.related || []).map(k => helpArt(k)).filter(Boolean);
  const tour = HELP.tours.find(t => t.at === a.key);
  return `<article class="card card-body help-art" data-help="${a.key}"><h2>${hl(tx(a.title), q)}</h2>${a.sub ? `<div class="note">${hl(tx(a.sub), q)}</div>` : ''}
${accessLine(a)}<p class="help-links">${a.screen && canSee(a.screen) ? `<a class="lnk" data-act="helpOpen" data-s="${a.screen}" data-t="${a.tab || ''}" role="button" tabindex="0">▸ ${esc(T('Открыть экран', 'Bildschirm öffnen', 'Open the screen', 'Экранды ашу'))}</a>` : ''}${tour && tourCan(tour) ? ` <a class="lnk" data-act="tourStart" data-id="${tour.id}" role="button" tabindex="0">▶ ${esc(T('Тур', 'Tour', 'Tour', 'Тур'))}: ${esc(tx(tour.title))}</a>` : ''}</p>
<p>${hl(tx(a.purpose), q)}</p>${(a.visuals || []).map(visualHtml).join('')}${a.who ? `<h4>${esc(T('Кто работает', 'Wer arbeitet damit', 'Who uses it', 'Кім жұмыс істейді'))}</h4><p>${hl(tx(a.who), q)}</p>` : ''}
${a.see ? `<h4>${esc(T('Что видно', 'Was man sieht', 'What you see', 'Не көрінеді'))}</h4>${ul(a.see)}` : ''}
${(a.howto || []).map(h => `<h4>${esc(T('Как сделать: ', 'So geht es: ', 'How to: ', 'Қалай: '))}${hl(tx(h.t), q)}</h4><div class="howto">${ul(h.steps, true)}</div>`).join('')}
${a.rules ? `<h4>${esc(T('Правила', 'Regeln', 'Rules', 'Ережелер'))}</h4>${ul(a.rules)}` : ''}
${a.special === 'roles' ? `<h4>${esc(T('Матрица ролей', 'Rollenmatrix', 'Roles matrix', 'Рөлдер матрицасы'))}</h4>${rolesTable()}<h4>${esc(T('Права и роли', 'Rechte und Rollen', 'Permissions by role', 'Құқықтар мен рөлдер'))}</h4>${permTable()}<h4>${esc(T('Описание ролей', 'Rollenbeschreibung', 'Role descriptions', 'Рөлдер сипаттамасы'))}</h4><dl>${ROLES.map(r => `<dt><b>${esc(ROLE_NAME[r])}</b></dt><dd>${hl(tx((HELP.roleDesc || {})[r] || ''), q)}</dd>`).join('')}</dl>` : ''}
${a.special === 'glossary' ? `<dl>${HELP.glossary.map(g => `<dt><b>${hl(tx(g[0]), q)}</b></dt><dd>${hl(tx(g[1]), q)}</dd>`).join('')}</dl>` : ''}
${a.special === 'faq' ? HELP.faq.map(g => `<h4>${hl(tx(g[0]), q)}</h4><p>${hl(tx(g[1]), q)}</p>`).join('') : ''}
${a.special === 'deadlines' ? deadlinesTable() : ''}${a.special === 'tours' ? toursList() : ''}
${a.fr ? `<p class="note">FR: ${esc(a.fr)}</p>` : ''}${rel.length ? `<h4>${esc(T('См. также', 'Siehe auch', 'See also', 'Сондай-ақ қараңыз'))}</h4><p>${rel.map(x => `<a class="lnk" data-act="helpGo" data-k="${x.key}" role="button" tabindex="0">${esc(tx(x.title))}</a>`).join(' · ')}</p>` : ''}${kkFallback(a) ? `<p class="note kk-fallback">${esc('KK: мәтін орыс тілінде / текст на русском')}</p>` : ''}</article>`;
}
SCREENS.help = {
  title: () => T('Справка и инструкции', 'Hilfe und Anleitungen', 'Help & how-to', 'Анықтама және нұсқаулар'),
  sub: () => T('Статьи по экранам и вкладкам, роли, схемы процессов, туры, глоссарий, вопросы и ответы', 'Artikel zu Bildschirmen und Registerkarten, Rollen, Prozessbilder, Touren, Glossar, FAQ', 'Articles per screen and tab, roles, process diagrams, tours, glossary, FAQ', 'Экрандар мен қойындылар бойынша мақалалар, рөлдер, процесс сызбалары, турлар, глоссарий, FAQ'),
  actions: () => `<label class="searchbox">${ic('search', 14)}<input id="hq" maxlength="80" placeholder="${esc(T('Поиск по справке…', 'Hilfe durchsuchen…', 'Search help…', 'Анықтамадан іздеу…'))}" value="${esc(S.help.q)}" aria-label="${esc(T('Поиск по справке', 'Hilfe durchsuchen', 'Search help', 'Анықтамадан іздеу'))}"></label><button class="btn grey" data-act="helpPrint">${esc(T('Печать', 'Drucken', 'Print', 'Басып шығару'))}</button>`,
  body: () => {
    const q = S.help.q.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean), vis = HELP.articles.filter(a => (!a.screen || canSee(a.screen) || a.portal) && (!q || words.every(w => hText(a).includes(w))));   // 0.3.11: every word must match
    const cur = vis.find(a => a.key === S.help.key) || vis[0];
    const nav = HELP.groups.map(g => { const as = vis.filter(a => a.group === g.key); return as.length ? `<h5>${esc(g.title)}</h5>${as.map(a => `<a class="${cur === a ? 'on' : ''}" data-act="helpGo" data-k="${a.key}" role="button" tabindex="0"${cur === a ? ' aria-current="true"' : ''}>${esc(tx(a.title))}</a>`).join('')}` : ''; }).join('');
    return `<div class="help"><nav class="card help-nav" aria-label="Help">${q ? `<p class="note help-found" style="padding:10px 12px 0">${esc(T('Найдено статей: ', 'Gefundene Artikel: ', 'Articles found: ', 'Табылған мақалалар: '))}${vis.length}</p>` : ''}${nav || `<p class="note" style="padding:12px">${esc(T('Ничего не найдено', 'Nichts gefunden', 'Nothing found', 'Ештеңе табылмады'))}</p>`}</nav>${cur ? articleHtml(cur) : ''}</div>`;
  },
};
Object.assign(ACT, {
  helpHere: () => { S.help.key = helpKeyFor(); S.help.q = ''; go('help'); },
  helpGo: d => { S.help.key = d.k; S.help.q = ''; if (S.route !== 'help') go('help'); else render(); const m = $('main'); if (m) m.scrollTop = 0; },
  helpOpen: d => { if (!canSee(d.s)) return go(d.s); if (d.t) S.tab[d.s] = d.t; go(d.s); },
  helpPrint: () => window.print(),
});
document.addEventListener('input', e => { if (e.target.id === 'hq') { S.help.q = e.target.value; render(); } });
/* FR-134 / FR-17: links and pills with role=button or tabindex react to Enter / Space like a click */
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const el = e.target.closest && e.target.closest('[data-act][tabindex], [data-act][role="button"], .pill-tab[data-act]');
  if (el && el.tagName !== 'INPUT' && el.tagName !== 'SELECT' && el.tagName !== 'TEXTAREA' && el.tagName !== 'BUTTON') { e.preventDefault(); el.click(); }
});
/* context help: a small "?" (and "Tour") in the page header of every screen that has an article; the tooltip names the article */
function helpDecorate() {
  if (S.route === 'help') return;
  const act = $('.page-head .actions'); if (!act || $('.help-q', act)) return;
  const k = helpKeyFor(), a = helpArt(k); if (!a) return;
  const tour = HELP.tours.find(t => tourStartScreen(t) === S.route && tourCan(t));
  act.insertAdjacentHTML('beforeend', `${tour ? `<button class="btn grey sm help-q" data-act="tourStart" data-id="${tour.id}" title="${esc(tx(tour.title))}" aria-label="${esc(T('Тур: ', 'Tour: ', 'Tour: ', 'Тур: ') + tx(tour.title))}">▶</button>` : ''}<button class="btn grey sm help-q" data-act="helpHere" title="${esc(T('Справка: ', 'Hilfe: ', 'Help: ', 'Анықтама: ') + tx(a.title))}" aria-label="${esc(T('Справка: ', 'Hilfe: ', 'Help: ', 'Анықтама: ') + tx(a.title))}">?</button>`);
}
/* render hook: after every render add the context help links and the tour layer (70-tours.js registers HELP.afterRender) */
HELP.afterRender = [helpDecorate];
const renderCore = render;
render = function () { renderCore(); HELP.afterRender.forEach(f => { try { f(); } catch (e) { console.error(e); } }); };
