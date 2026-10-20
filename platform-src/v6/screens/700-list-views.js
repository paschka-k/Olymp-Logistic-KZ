/* R4 · I-8 Saved views, column filters and CSV export for the main lists (Loads, Orders · records, Fleet, Drivers, Partners, Invoices).
   One shared helper: lvWrap(key, html) parses the list's table, adds a filter row under the header, hides rows that do not match,
   and puts a tool bar above it (saved views, reset, CSV). The screens are not edited: this file wraps their tab bodies (LISTS below).
   A view stores the column filters and, for Loads, the screen filters (S.f). Views persist per browser (localStorage, guarded). */
(function () {
  const LISTS = [
    { key: 'loads', screen: 'orders', tab: 'orders', paged: true, state: () => ({ status: S.f.status, cust: S.f.cust, zone: S.f.zone, pri: S.f.pri, q: S.f.q }), setState: v => Object.assign(S.f, v || {}, { page: 1 }),
      presets: [{ id: 'p-problem', name: T('Проблемные рейсы', 'Problemfahrten', 'Problem loads', 'Мәселелі рейстер'), c: {}, s: { status: 'problem', cust: '', zone: '', pri: '', q: '' } },
        { id: 'p-high', name: T('Высокий приоритет', 'Hohe Priorität', 'High priority', 'Жоғары басымдық'), c: {}, s: { status: '', cust: '', zone: '', pri: 'high', q: '' } }] },
    { key: 'orders', screen: 'orders', tab: 'rec', head: '.or-row:not([data-order])', rows: '.or-row[data-order]' },   // div rows, no <table>
    { key: 'fleet', screen: 'fleet', tab: 'fleet' },
    { key: 'drivers', screen: 'drivers', tab: 'drivers' },
    { key: 'partners', screen: 'dispatch', tab: 'partners', sel: '#pt_table table' },
    { key: 'invoices', screen: 'billing', tab: 'inv' },
  ];
  const STORE = 'kz-r4-views';
  const readViews = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (_) { return {}; } };
  const writeViews = () => { try { const o = {}; Object.keys(LV).forEach(k => { o[k] = LV[k].views; }); localStorage.setItem(STORE, JSON.stringify(o)); } catch (_) { /* storage blocked: views live for this session */ } };
  const LV = S.lv = {};
  const stored = readViews();
  LISTS.forEach(L => { LV[L.key] = { c: {}, views: Array.isArray(stored[L.key]) ? stored[L.key] : [], cur: '', name: '' }; });
  const byKey = k => LISTS.find(L => L.key === k);
  const allViews = L => (L.presets || []).concat(LV[L.key].views);
  /* cell text: sub-lines are joined with " · " so "Name / BIN" stays readable in filters and CSV */
  const cellTxt = td => { if (!td) return ''; const c = td.cloneNode(true); c.querySelectorAll('.avatar, svg').forEach(x => x.remove()); c.querySelectorAll('.sub, div').forEach(d => d.prepend(' · ')); return c.textContent.replace(/\s+/g, ' ').replace(/^ · /, '').trim(); };
  function parse(L, html) {
    const tp = document.createElement('template'); tp.innerHTML = html;
    const st = LV[L.key]; let tb, ths, data;
    if (L.rows) { tb = tp.content.querySelector(L.head); if (!tb) return null; ths = [...tb.children]; data = [...tp.content.querySelectorAll(L.rows)]; }
    else { tb = tp.content.querySelector(L.sel || 'table.table'); if (!tb) return null; ths = [...tb.querySelectorAll('thead tr:first-child th')]; data = [...tb.querySelectorAll('tbody tr')].filter(r => !r.querySelector('td.empty') && r.children.length >= ths.length - 1); }
    const act = Object.keys(st.c).filter(i => st.c[i] && String(st.c[i]).trim());
    const keep = data.filter(r => act.every(i => cellTxt(r.children[i]).toLowerCase().includes(String(st.c[i]).trim().toLowerCase())));
    return { tp, tb, ths, data, keep, act };
  }
  /* the wrapper: returns the original html with the filter row, hidden rows and the tool bar */
  function lvWrap(key, html) {
    const L = byKey(key), p = L && parse(L, html); if (!p) return html;
    const st = LV[key];
    p.data.filter(r => !p.keep.includes(r)).forEach(r => r.remove());
    if (p.act.length && !p.keep.length && !L.rows) { const tr = document.createElement('tr'); tr.innerHTML = `<td colspan="${p.ths.length}" class="empty">${esc(T('Нет строк под фильтры столбцов', 'Keine Zeilen für die Spaltenfilter', 'No rows match the column filters', 'Баған сүзгілеріне жол жоқ'))}</td>`; p.tb.tBodies[0].appendChild(tr); }
    const fr = document.createElement(L.rows ? 'div' : 'tr'); fr.className = L.rows ? p.tb.className + ' lv-f' : 'lv-f';
    p.ths.forEach((th, i) => { const h = document.createElement(L.rows ? 'span' : 'td'), lab = th.textContent.trim(); if (lab) h.innerHTML = `<input class="lv-in" id="lv_${key}_${i}" data-lv="${key}" data-c="${i}" value="${esc(st.c[i] || '')}" placeholder="${esc(T('фильтр', 'Filter', 'filter', 'сүзгі'))}" aria-label="${esc(T('Фильтр: ', 'Filter: ', 'Filter: ', 'Сүзгі: ') + lab)}">`; fr.appendChild(h); });
    if (L.rows) { p.tb.after(fr); p.tb.parentElement.setAttribute('data-lv-table', key); }
    else { (p.tb.tHead || p.tb.createTHead()).appendChild(fr); p.tb.setAttribute('data-lv-table', key); }
    const vs = allViews(L), cur = vs.find(v => v.id === st.cur), own = cur && !String(cur.id).startsWith('p-');
    const bar = `<div class="lv-bar" data-lv-bar="${key}"><label class="lv-l">${esc(T('Вид', 'Ansicht', 'View', 'Көрініс'))}<select class="select" id="lv_${key}_view" data-lvview="${key}"><option value="">${esc(T('— все записи —', '— alle Einträge —', '— all records —', '— барлық жазба —'))}</option>${vs.map(v => `<option value="${esc(v.id)}"${v.id === st.cur ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label>
<input class="select lv-name" id="lv_${key}_name" data-lvname="${key}" value="${esc(st.name)}" placeholder="${esc(T('Имя нового вида', 'Name der neuen Ansicht', 'Name of the new view', 'Жаңа көрініс атауы'))}" aria-label="${esc(T('Имя вида', 'Name der Ansicht', 'View name', 'Көрініс атауы'))}">
<button type="button" class="btn sm grey" data-act="lvSave" data-k="${key}">${esc(T('Сохранить вид', 'Ansicht speichern', 'Save view', 'Көріністі сақтау'))}</button>${own ? `<button type="button" class="btn sm grey" data-act="lvDel" data-k="${key}">${esc(T('Удалить вид', 'Ansicht löschen', 'Delete view', 'Көріністі жою'))}</button>` : ''}
<button type="button" class="btn sm grey" data-act="lvReset" data-k="${key}">${esc(T('Сбросить фильтры', 'Filter zurücksetzen', 'Reset filters', 'Сүзгілерді тазалау'))}</button><button type="button" class="btn sm grey" data-act="lvCsv" data-k="${key}">CSV</button>
<span class="lv-n" data-lv-count>${p.act.length ? esc(T('по фильтрам: ', 'gefiltert: ', 'filtered: ', 'сүзгі бойынша: ')) + p.keep.length + ' / ' + p.data.length : p.data.length + ' ' + esc(T('строк', 'Zeilen', 'rows', 'жол'))}${L.paged ? esc(T(' на странице', ' auf der Seite', ' on this page', ' бетте')) : ''}</span></div>`;
    return bar + p.tp.innerHTML;
  }
  /* CSV of the filtered rows; a paged list (Loads) walks every page with the same screen filters */
  function lvRows(key) {
    const L = byKey(key), orig = L.orig; let head = null; const out = [];
    const take = html => { const p = parse(L, html); if (!p) return null; if (!head) head = p.ths.map(th => th.textContent.trim()); p.keep.forEach(r => out.push(p.ths.map((_, i) => cellTxt(r.children[i])))); return p.keep[0] ? p.keep[0].outerHTML + (p.data[0] ? p.data[0].outerHTML : '') : (p.data[0] ? p.data[0].outerHTML : ''); };
    if (!L.paged) take(orig());
    else { const p0 = S.f.page, seen = new Set(); for (let pg = 1; pg < 200; pg++) { S.f.page = pg; const html = orig(); const p = parse(L, html); const sig = p && p.data[0] ? p.data[0].outerHTML : ''; if (!sig || seen.has(sig)) break; seen.add(sig); take(html); } S.f.page = p0; }
    const cols = (head || []).map((h, i) => h ? i : -1).filter(i => i >= 0);
    return { head: cols.map(i => head[i]), rows: out.map(r => cols.map(i => r[i])) };
  }
  const csvText = (head, rows) => '﻿' + [head].concat(rows).map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n');
  function lvSaveView(key, name) {
    const st = LV[key], L = byKey(key), n = String(name || '').trim();
    if (n.length < 2) return T('Имя вида: минимум 2 знака', 'Name der Ansicht: mindestens 2 Zeichen', 'View name: at least 2 characters', 'Көрініс атауы: кемінде 2 таңба');
    if (allViews(L).some(v => v.name.toLowerCase() === n.toLowerCase())) return T('Вид с таким именем уже есть', 'Eine Ansicht mit diesem Namen gibt es schon', 'A view with this name already exists', 'Бұл атаумен көрініс бар');
    const v = { id: 'v' + Date.now().toString(36) + st.views.length, name: n, c: Object.assign({}, st.c), s: L.state ? L.state() : null };
    st.views.push(v); st.cur = v.id; st.name = ''; writeViews();
    audit(T('Списки', 'Listen', 'Lists', 'Тізімдер'), key, T('Вид сохранён', 'Ansicht gespeichert', 'View saved', 'Көрініс сақталды'), n);
    return v;
  }
  function lvApply(key, id) {
    const st = LV[key], L = byKey(key), v = allViews(L).find(x => x.id === id);
    st.cur = v ? v.id : ''; st.c = v ? Object.assign({}, v.c) : {};
    if (L.setState) L.setState(v && v.s ? v.s : (v ? null : { status: '', cust: '', zone: '', pri: '', q: '' }));
    return !!v;
  }
  function lvDelete(key) {
    const st = LV[key], i = st.views.findIndex(v => v.id === st.cur); if (i < 0) return false;
    const [v] = st.views.splice(i, 1); st.cur = ''; writeViews();
    audit(T('Списки', 'Listen', 'Lists', 'Тізімдер'), key, T('Вид удалён', 'Ansicht gelöscht', 'View deleted', 'Көрініс жойылды'), v.name); return true;
  }
  /* wire the lists: wrap the tab body (or the screen body) once; the original body stays available for CSV paging */
  LISTS.forEach(L => {
    const sc = SCREENS[L.screen]; if (!sc) return;
    const t = (sc.tabs || []).find(x => x.key === L.tab);
    if (t) { L.orig = t.body; t.body = () => lvWrap(L.key, L.orig()); } else if (sc.body && !sc.tabs) { L.orig = sc.body; sc.body = () => lvWrap(L.key, L.orig()); }
  });
  Object.assign(globalThis, { lvWrap, lvRows, lvSaveView, lvApply, lvDelete, LV_LISTS: LISTS });
  Object.assign(ACT, {
    lvSave: d => { const e = document.getElementById('lv_' + d.k + '_name'); const r = lvSaveView(d.k, e ? e.value : LV[d.k].name); if (typeof r === 'string') return toast(r, 'err'); toast(T('Вид сохранён: ', 'Ansicht gespeichert: ', 'View saved: ', 'Көрініс сақталды: ') + r.name); },
    lvDel: d => { if (lvDelete(d.k)) { LV[d.k].c = {}; toast(T('Вид удалён', 'Ansicht gelöscht', 'View deleted', 'Көрініс жойылды')); } },
    lvReset: d => { lvApply(d.k, ''); render(); },
    lvCsv: d => { const r = lvRows(d.k), a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csvText(r.head, r.rows)], { type: 'text/csv' })); a.download = d.k + '-view.csv'; a.click(); audit(T('Списки', 'Listen', 'Lists', 'Тізімдер'), d.k, T('Экспорт CSV', 'CSV-Export', 'CSV export', 'CSV экспорт'), r.rows.length + ' ' + T('строк', 'Zeilen', 'rows', 'жол')); },
  });
  document.addEventListener('input', e => {
    const el = e.target, ds = el.dataset || {};
    if (ds.lv) { LV[ds.lv].c[ds.c] = el.value; LV[ds.lv].cur = ''; render(); }
    else if (ds.lvname) LV[ds.lvname].name = el.value;
  });
  document.addEventListener('change', e => { const ds = e.target.dataset || {}; if (ds.lvview) { lvApply(ds.lvview, e.target.value); render(); } });
})();
