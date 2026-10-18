/* Help framework: articles are registered with helpAdd({key, group, screen, tab, title, sub, purpose, who, see[], howto[{t,steps[]}], rules[], fr, related[]}),
   every text T(ru, de, en, kk) (KK may be omitted -> falls back to RU with a marker). Content files: v6/help/NN-<area>.js. */
const HELP = { groups: [], articles: [], glossary: [], faq: [] };
const helpGroup = (key, title) => HELP.groups.push({ key, title });
const helpAdd = a => { HELP.articles.push(a); return a; };
const tx = v => (Array.isArray(v) ? v[LI] || (LI === 3 && v[0] ? v[0] : '') : v == null ? '' : v);   // T-quads are arrays only in help data
const HQ = (...a) => a;   // helper to write a text quad in help data: HQ(ru, de, en, kk)
helpGroup('start', T('Начало работы', 'Erste Schritte', 'Getting started', 'Жұмысты бастау'));
helpGroup('ops', T('Операции', 'Betrieb', 'Operations', 'Операциялар'));
helpGroup('records', T('Учёт и администрирование', 'Stammdaten und Verwaltung', 'Records and administration', 'Есеп және әкімшілік'));
helpGroup('portals', T('Порталы и приложение водителя', 'Portale und Fahrer-App', 'Portals and driver app', 'Порталдар және жүргізуші қосымшасы'));
helpGroup('ref', T('Справочник', 'Nachschlagen', 'Reference', 'Анықтамалық'));
S.help = { key: 'start', q: '' };
const helpKeyFor = () => { const r = S.route, t = (S.tab[r] || ''); const ks = HELP.articles.map(a => a.key); return ks.includes(r + '/' + t) ? r + '/' + t : ks.includes(r) ? r : 'start'; };
const hText = a => [tx(a.title), tx(a.sub), tx(a.purpose), tx(a.who), (a.see || []).map(tx).join(' '), (a.rules || []).map(tx).join(' ')].join(' ').toLowerCase();
const hl = (s, q) => (q ? esc(s).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>') : esc(s));
function rolesTable() {
  const scr = Object.keys(SCREEN_PERM);
  return `<div style="overflow:auto"><table><thead><tr><th>${esc(T('Экран', 'Bildschirm', 'Screen', 'Экран'))}</th>${ROLES.map(r => `<th>${esc(ROLE_NAME[r])}</th>`).join('')}</tr></thead><tbody>${scr.map(s => `<tr><td>${esc(navLabel(s))}</td>${ROLES.map(r => `<td>${(ROLE_PERMS[r] || []).includes(SCREEN_PERM[s]) ? '✓' : '·'}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function articleHtml(a) {
  const q = S.help.q.trim(), sec = (h, body) => (body ? `<h4>${esc(h)}</h4>${body}</div>`.replace('</div>', '') : '');
  const ul = (arr, ord) => (arr && arr.length ? `<${ord ? 'ol' : 'ul'}>${arr.map(x => `<li>${hl(tx(x), q)}</li>`).join('')}</${ord ? 'ol' : 'ul'}>` : '');
  const rel = (a.related || []).map(k => HELP.articles.find(x => x.key === k)).filter(Boolean);
  return `<div class="card card-body help-art"><h2>${hl(tx(a.title), q)}</h2>${a.sub ? `<div class="note">${hl(tx(a.sub), q)}</div>` : ''}
${a.screen && canSee(a.screen) ? `<p><a class="lnk" data-act="helpOpen" data-s="${a.screen}" data-t="${a.tab || ''}">▸ ${esc(T('Открыть экран', 'Bildschirm öffnen', 'Open the screen', 'Экранды ашу'))}</a></p>` : ''}
<p>${hl(tx(a.purpose), q)}</p>${a.who ? `<h4>${esc(T('Кто работает', 'Wer arbeitet damit', 'Who uses it', 'Кім жұмыс істейді'))}</h4><p>${hl(tx(a.who), q)}</p>` : ''}
${a.see ? `<h4>${esc(T('Что видно', 'Was man sieht', 'What you see', 'Не көрінеді'))}</h4>${ul(a.see)}` : ''}
${(a.howto || []).map(h => `<h4>${esc(T('Как сделать: ', 'So geht es: ', 'How to: ', 'Қалай: '))}${hl(tx(h.t), q)}</h4><div class="howto">${ul(h.steps, true)}</div>`).join('')}
${a.rules ? `<h4>${esc(T('Правила', 'Regeln', 'Rules', 'Ережелер'))}</h4>${ul(a.rules)}` : ''}
${a.special === 'roles' ? `<h4>${esc(T('Матрица ролей', 'Rollenmatrix', 'Roles matrix', 'Рөлдер матрицасы'))}</h4>${rolesTable()}` : ''}
${a.special === 'glossary' ? `<dl>${HELP.glossary.map(g => `<dt><b>${hl(tx(g[0]), q)}</b></dt><dd>${hl(tx(g[1]), q)}</dd>`).join('')}</dl>` : ''}
${a.special === 'faq' ? HELP.faq.map(g => `<h4>${hl(tx(g[0]), q)}</h4><p>${hl(tx(g[1]), q)}</p>`).join('') : ''}
${a.fr ? `<p class="note">FR: ${esc(a.fr)}</p>` : ''}${rel.length ? `<h4>${esc(T('См. также', 'Siehe auch', 'See also', 'Сондай-ақ қараңыз'))}</h4><p>${rel.map(x => `<a class="lnk" data-act="helpGo" data-k="${x.key}">${esc(tx(x.title))}</a>`).join(' · ')}</p>` : ''}${LI === 3 && !a.title[3] ? `<p class="note">${esc('KK: ' + 'мәтін орыс тілінде / текст на русском')}</p>` : ''}</div>`;
}
SCREENS.help = {
  title: () => T('Справка и инструкции', 'Hilfe und Anleitungen', 'Help & how-to', 'Анықтама және нұсқаулар'),
  sub: () => T('Статьи по экранам, роли, глоссарий, вопросы и ответы', 'Artikel zu den Bildschirmen, Rollen, Glossar, FAQ', 'Articles per screen, roles, glossary, FAQ', 'Экрандар бойынша мақалалар, рөлдер, глоссарий, FAQ'),
  actions: () => `<label class="searchbox">${ic('search', 14)}<input id="hq" placeholder="${esc(T('Поиск по справке…', 'Hilfe durchsuchen…', 'Search help…', 'Анықтамадан іздеу…'))}" value="${esc(S.help.q)}"></label>`,
  body: () => {
    const q = S.help.q.trim().toLowerCase(), vis = HELP.articles.filter(a => (!a.screen || canSee(a.screen) || a.portal) && (!q || hText(a).includes(q)));
    const cur = vis.find(a => a.key === S.help.key) || vis[0];
    const nav = HELP.groups.map(g => { const as = vis.filter(a => a.group === g.key); return as.length ? `<h5>${esc(g.title)}</h5>${as.map(a => `<a class="${cur === a ? 'on' : ''}" data-act="helpGo" data-k="${a.key}">${esc(tx(a.title))}</a>`).join('')}` : ''; }).join('');
    return `<div class="help"><nav class="card help-nav" aria-label="Help">${nav || `<p class="note" style="padding:12px">${esc(T('Ничего не найдено', 'Nichts gefunden', 'Nothing found', 'Ештеңе табылмады'))}</p>`}</nav>${cur ? articleHtml(cur) : ''}</div>`;
  },
};
Object.assign(ACT, {
  helpHere: () => { S.help.key = helpKeyFor(); S.help.q = ''; go('help'); },
  helpGo: d => { S.help.key = d.k; render(); const m = $('main'); if (m) m.scrollTop = 0; },
  helpOpen: d => { go(d.s); if (d.t) S.tab[d.s] = d.t; render(); },
});
document.addEventListener('input', e => { if (e.target.id === 'hq') { S.help.q = e.target.value; render(); } });
helpAdd({ key: 'start', group: 'start', title: HQ('Обзор платформы', 'Überblick über die Plattform', 'Platform overview', 'Платформа шолуы'),
  purpose: HQ('Olymp Logistic — макет единой платформы холодовой цепи KDL Olymp: 12 разделов меню, внутри — вкладки. Все данные вымышленные.', 'Olymp Logistic — Mock-up der zentralen Kühlketten-Plattform von KDL Olymp: 12 Menüpunkte mit Registerkarten. Alle Daten sind fiktiv.', 'Olymp Logistic is the mock-up of the central cold-chain platform of KDL Olymp: 12 menu items with tabs inside. All data is fictitious.', 'Olymp Logistic — KDL Olymp суық тізбегінің бірыңғай платформасының макеті: мәзірде 12 бөлім, ішінде қойындылар. Барлық дерек ойдан шығарылған.'),
  rules: [HQ('Роль меняется в верхней панели; меню и вкладки показывают только доступное роли.', 'Die Rolle wird oben gewechselt; Menü und Registerkarten zeigen nur Erlaubtes.', 'Switch the role in the top bar; menu and tabs show only what the role may use.', 'Рөлді жоғарғы панельде ауыстырыңыз; мәзір мен қойындылар тек рұқсат етілгенді көрсетеді.')] });
helpAdd({ key: 'roles', group: 'ref', special: 'roles', title: HQ('Роли и права', 'Rollen und Rechte', 'Roles and permissions', 'Рөлдер мен құқықтар'), purpose: HQ('Какая роль какой экран видит (матрица создана из матрицы прав платформы).', 'Welche Rolle welchen Bildschirm sieht (Matrix aus der Rechtematrix der Plattform).', 'Which role sees which screen (generated from the platform permission matrix).', 'Қай рөл қай экранды көреді (платформа құқықтар матрицасынан жасалған).') });
