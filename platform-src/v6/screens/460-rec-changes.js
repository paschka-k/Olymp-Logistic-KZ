/* W3 · Changes page (route "changes", linked from the version in the sidebar): the change register of the source platform
   (190 FR/BUG entries) with filters by type, status, group and date. The build embeds a compact per-language JSON (@@REGISTER@@);
   KK falls back to RU, titles come in RU/DE/EN. */
(function () {
  const REG = @@REGISTER@@;
  const TY = { FR: T('Функция (FR)', 'Funktion (FR)', 'Function (FR)', 'Функция (FR)'), bug: T('Ошибка (BUG)', 'Fehler (BUG)', 'Bug (BUG)', 'Қате (BUG)') };
  const STS = { implemented: ['green', T('реализовано', 'umgesetzt', 'implemented', 'жүзеге асырылды')], implemented_partial: ['yellow', T('частично', 'teilweise', 'partly implemented', 'ішінара')], fixed: ['green', T('исправлено', 'behoben', 'fixed', 'түзетілді')], planned: ['blue', T('в плане', 'geplant', 'planned', 'жоспарда')], open_question: ['red', T('открытый вопрос', 'offene Frage', 'open question', 'ашық сұрақ')], closed: ['gray', T('закрыто', 'geschlossen', 'closed', 'жабық')] };
  globalThis.CHANGES = REG;
  const C = globalThis.CHG = { ty: '', st: '', gr: '', from: '', to: '', q: '', open: '', page: 1 };
  const PER = 25;
  const num = id => +String(id).replace(/\D/g, '') || 0;
  globalThis.changesFiltered = () => REG.entries.filter(e => (!C.ty || e.type === C.ty) && (!C.st || e.status === C.st) && (!C.gr || e.group === C.gr) && (!C.from || e.date >= C.from) && (!C.to || e.date <= C.to) && (!C.q || (e.id + ' ' + e.title + ' ' + e.change).toLowerCase().includes(C.q.toLowerCase()))).sort((a, b) => (b.date || '').localeCompare(a.date || '') || num(b.id) - num(a.id));
  SCREENS.changes = {
    title: () => T('Реестр изменений', 'Änderungsregister', 'Change register', 'Өзгерістер тізілімі'),
    sub: () => T('Все запросы на изменение и ошибки исходной платформы (', 'Alle Änderungswünsche und Fehler der Quellplattform (', 'All change requests and bugs of the source platform (', 'Бастапқы платформаның барлық өзгеріс сұраулары (') + REG.n + ') · ' + T('на ', 'Stand ', 'as of ', '') + REG.as_of + (LI === 3 ? ' · RU' : ''),
    actions: () => `<button class="btn grey" data-act="chgCsv">CSV</button>`,
    body: () => {
      const all = changesFiltered(), pages = Math.max(1, Math.ceil(all.length / PER)), pg = Math.min(C.page, pages), list = all.slice((pg - 1) * PER, pg * PER);
      const groups = [...new Set(REG.entries.map(e => e.group))].filter(Boolean), cnt = k => REG.entries.filter(e => e.status === k).length;
      const rows = list.map(e => { const s = STS[e.status] || ['gray', e.status]; return `<tr class="chg-row" data-act="chgOpen" data-id="${e.id}"><td><a class="lnk">${esc(e.id)}</a><div class="sub">${esc(e.date)}</div></td><td>${chip(e.type === 'bug' ? 'red' : 'blue', e.type === 'bug' ? 'BUG' : 'FR')}</td><td>${esc(e.title)}<div class="sub">${esc(e.group)}</div></td><td>${chip(s[0], s[1])}</td></tr>${C.open === e.id ? `<tr><td colspan="4" class="chg-det">${e.finding ? `<p><b>${esc(T('Наблюдение', 'Befund', 'Finding', 'Бақылау'))}:</b> ${esc(e.finding)}</p>` : ''}<p><b>${esc(T('Изменение', 'Änderung', 'Change', 'Өзгеріс'))}:</b> ${esc(e.change || '—')}</p></td></tr>` : ''}`; }).join('');
      return `<div class="kpi-row k4">${rcTile('blue', 'list', REG.n, T('Записей', 'Einträge', 'Entries', 'Жазбалар'))}${rcTile('green', 'check', cnt('implemented') + cnt('fixed'), T('Реализовано / исправлено', 'Umgesetzt / behoben', 'Implemented / fixed', 'Жүзеге асты'))}${rcTile('yellow', 'clock', cnt('implemented_partial') + cnt('planned'), T('Частично / в плане', 'Teilweise / geplant', 'Partly / planned', 'Ішінара / жоспарда'))}${rcTile('red', 'alert', cnt('open_question'), T('Открытые вопросы', 'Offene Fragen', 'Open questions', 'Ашық сұрақтар'))}</div>
<div class="filters">${chgSel('ty', T('Тип', 'Art', 'Type', 'Түрі'), [['', ALLT], ['FR', TY.FR], ['bug', TY.bug]])}${chgSel('st', T('Статус', 'Status', 'Status', 'Күйі'), [['', ALLT], ...Object.keys(STS).map(k => [k, STS[k][1]])])}${chgSel('gr', T('Группа', 'Gruppe', 'Group', 'Топ'), [['', ALLT], ...groups.map(g => [g, g])])}<label>${esc(T('с', 'von', 'from', 'бастап'))}</label><input type="date" class="select" data-chg="from" value="${C.from}"><label>${esc(T('по', 'bis', 'to', 'дейін'))}</label><input type="date" class="select" data-chg="to" value="${C.to}"><label class="searchbox">${ic('search', 14)}<input data-chg="q" placeholder="FR-190, ${esc(T('текст…', 'Text…', 'text…', 'мәтін…'))}" value="${esc(C.q)}"></label><button class="clear-all" data-act="chgClr">× ${esc(T('Сбросить', 'Zurücksetzen', 'Clear', 'Тазалау'))}</button></div>
<div class="card tcard"><table class="table"><thead><tr><th>ID / ${esc(T('дата', 'Datum', 'date', 'күні'))}</th><th>${esc(T('Тип', 'Art', 'Type', 'Түрі'))}</th><th>${esc(T('Название', 'Titel', 'Title', 'Атауы'))}</th><th>${esc(T('Статус', 'Status', 'Status', 'Күйі'))}</th></tr></thead><tbody>${rows || `<tr><td colspan="4" class="empty">${esc(T('Ничего не найдено', 'Nichts gefunden', 'Nothing found', 'Ештеңе табылмады'))}</td></tr>`}</tbody></table><div class="pager"><span>${esc(T('Показано ', 'Angezeigt ', 'Showing ', 'Көрсетілді '))}${all.length ? (pg - 1) * PER + 1 : 0}–${Math.min(pg * PER, all.length)} ${esc(T('из', 'von', 'of', '/'))} ${all.length}</span><span>${pg > 1 ? `<button class="btn sm grey" data-act="chgPage" data-v="${pg - 1}">‹</button> ` : ''}${pg} / ${pages}${pg < pages ? ` <button class="btn sm grey" data-act="chgPage" data-v="${pg + 1}">›</button>` : ''}</span></div></div>`;
    },
  };
  function chgSel(k, label, opts) { return `<label>${esc(label)}:</label><select class="select" data-chg="${k}">${opts.map(o => `<option value="${esc(o[0])}"${C[k] === o[0] ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`; }
  document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.chg; if (k) { C[k] = e.target.value; C.page = 1; C.open = ''; render(); } });
  Object.assign(ACT, {
    chgOpen: d => { C.open = C.open === d.id ? '' : d.id; render(); }, chgPage: d => { C.page = +d.v; render(); },
    chgClr: () => { Object.assign(C, { ty: '', st: '', gr: '', from: '', to: '', q: '', open: '', page: 1 }); render(); },
    chgCsv: () => recDl('change-register.csv', csvOf([['id', 'type', 'date', 'status', 'group', 'title']].concat(changesFiltered().map(e => [e.id, e.type, e.date, e.status, e.group, e.title]))), 'text/csv'),
  });
})();
