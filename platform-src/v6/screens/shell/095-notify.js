/* R12 / FR-217 · Notification centre: alarms (S.alarms), inbox messages (S.inbox) and CRM tasks (S.tasks) in ONE list.
   The sources stay as they are and keep their screens and counters; the centre only adds an overlay S.nc[<type>:<id>] =
   { read: bool, until: ms, who: name } with <type> = alarm | inbox | task. Without an overlay an item is unread while its source
   says so (alarm open, message new, task not done).
     NC.list(filter)       'all' | 'unread' | 'mine' -> items { key, type, id, title, sub, at, lvl, read, who, mine }; snoozed items are left out
     NC.count()            unread items (the bell)             NC.snoozed()  items that are asleep now
     NC.read(key, on=true) read / unread                       NC.snooze(key, ms)  asleep for ms (back as unread when the time is over)
     NC.assign(key, user)  who works on it, written to the audit log (needs the write permission of the source)
     NC.now()              the clock of the demo (clockNow, the injectable simulator clock); tests may replace it
   The dialog sits outside #root like the palette (data-a11y-dlg: focus trap and Esc come from 002-a11y.js); ncBell() is the bell of
   the top bar (core.js), its number is a data-live node and follows the tick. */
(function () {
  S.nc = {};
  const NC = globalThis.NC = { now: () => clockNow().getTime() };
  const L = { title: T('Уведомления', 'Benachrichtigungen', 'Notifications', 'Хабарландырулар'), close: T('Закрыть', 'Schließen', 'Close', 'Жабу'),
    all: T('Все', 'Alle', 'All', 'Барлығы'), unread: T('Непрочитанные', 'Ungelesen', 'Unread', 'Оқылмаған'), mine: T('Мои', 'Meine', 'Mine', 'Менікі'),
    filter: T('Фильтр', 'Filter', 'Filter', 'Сүзгі'), open: T('Открыть', 'Öffnen', 'Open', 'Ашу'), asRead: T('Прочитано', 'Gelesen', 'Mark read', 'Оқылды'), asUnread: T('Непрочитано', 'Ungelesen', 'Mark unread', 'Оқылмаған'),
    snooze: T('Отложить', 'Zurückstellen', 'Snooze', 'Кейінге қалдыру'), h1: T('1 ч', '1 Std.', '1 h', '1 сағ'), h4: T('4 ч', '4 Std.', '4 h', '4 сағ'), tom: T('Завтра', 'Morgen', 'Tomorrow', 'Ертең'),
    assign: T('Назначить…', 'Zuweisen …', 'Assign…', 'Тағайындау…'), isNew: T('Новое', 'Neu', 'New', 'Жаңа'), asleep: T('Отложено', 'Zurückgestellt', 'Snoozed', 'Кейінге қалдырылған'),
    types: { alarm: T('Тревога', 'Alarm', 'Alarm', 'Дабыл'), inbox: T('Входящее', 'Eingang', 'Inbox', 'Кіріс'), task: T('Задача', 'Aufgabe', 'Task', 'Тапсырма') },
    none: T('Нет уведомлений', 'Keine Benachrichtigungen', 'No notifications', 'Хабарландыру жоқ'), noneHint: T('Здесь появятся тревоги, входящие и задачи', 'Hier erscheinen Alarme, Eingänge und Aufgaben', 'Alarms, inbox messages and tasks appear here', 'Мұнда дабылдар, кіріс және тапсырмалар шығады'),
    assigned: T('Назначено: ', 'Zugewiesen: ', 'Assigned: ', 'Тағайындалды: '), snoozedMsg: T('Отложено', 'Zurückgestellt', 'Snoozed', 'Кейінге қалдырылды'), readMsg: T('Прочитано', 'Als gelesen markiert', 'Marked as read', 'Оқылды деп белгіленді'), unreadMsg: T('Непрочитано', 'Als ungelesen markiert', 'Marked as unread', 'Оқылмаған деп белгіленді') };

  /* ---------- sources: one reader per type; perm = read permission, wperm = permission to assign ---------- */
  const iso = v => { const t = Date.parse(v); return isNaN(t) ? 0 : t; };
  const SRC = {
    alarm: { perm: 'alarms:read', wperm: () => 'alarms:write', rows: () => (S.alarms || []).filter(a => a.status !== 'closed').map(a => ({ id: a.id, title: a.id + ' · ' + a.text, sub: [a.hub, a.load].filter(Boolean).join(' · '), at: iso(a.created), lvl: a.lvl, base: a.status === 'open', who: '' })) },
    inbox: { perm: 'overview:read', wperm: m => (globalThis.INBOX_KPERM || {})[m] || 'alarms:write', rows: () => (S.inbox || []).filter(m => m.st !== 'done').map(m => ({ id: m.id, kind: m.kind, title: m.title, sub: m.src || '', at: iso(m.at), lvl: m.lvl, base: m.st === 'new', who: '' })) },
    task: { perm: 'crm:read', wperm: () => 'crm:write', rows: () => (S.tasks || []).filter(t => !t.done).map(t => ({ id: t.id, title: t.title, sub: t.due || '', at: iso(t.due), lvl: 0, base: true, who: t.who || '' })) },
  };
  const me = () => (typeof taskMe === 'function' ? taskMe() : ROLE_NAME[S.role]);
  /* the item with its overlay applied; an expired snooze is cleared here: the item is unread again */
  const build = () => {
    const now = NC.now(), out = [];
    for (const type of Object.keys(SRC)) {
      if (!canDo(SRC[type].perm)) continue;
      for (const r of SRC[type].rows()) {
        const key = type + ':' + r.id, o = S.nc[key];
        if (o && o.until && o.until <= now) { delete o.until; o.read = false; }
        const who = o && o.who != null ? o.who : r.who;
        out.push(Object.assign(r, { key, type, read: o && o.read != null ? o.read : !r.base, until: (o && o.until) || 0, who, mine: !!who && who === me() }));
      }
    }
    return out.sort((a, b) => (b.lvl || 0) - (a.lvl || 0) || b.at - a.at);
  };
  NC.list = f => build().filter(x => !x.until && (f === 'unread' ? !x.read : f === 'mine' ? x.mine : true));
  NC.count = () => NC.list('unread').length;
  NC.snoozed = () => build().filter(x => x.until);
  const find = key => build().find(x => x.key === key);
  const put = (key, patch) => { S.nc[key] = Object.assign({}, S.nc[key], patch); };
  /* a change of the overlay can be taken back with the undo toast */
  const undoable = (key, msg, audit) => { const before = S.nc[key] ? Object.assign({}, S.nc[key]) : null; return { go: () => toastUndo(msg, () => { if (before) S.nc[key] = before; else delete S.nc[key]; draw(); bellRefresh(); }, { audit: audit || false }) }; };
  NC.read = (key, on) => { if (!find(key)) return false; const u = undoable(key, on === false ? L.unreadMsg : L.readMsg); put(key, { read: on !== false }); u.go(); return true; };
  NC.snooze = (key, ms) => { if (!find(key) || !(ms > 0)) return false; const u = undoable(key, L.snoozedMsg); put(key, { until: NC.now() + ms, read: true }); u.go(); return true; };
  NC.assign = (key, user) => {
    const it = find(key); if (!it || !user) return false;
    if (!canDo(SRC[it.type].wperm(it.kind))) { toast(LT('core.no_permission') + SRC[it.type].wperm(it.kind), 'err'); return false; }
    const u = undoable(key, L.assigned + user, { module: 'Notifications', subject: key });
    put(key, { who: user });
    audit('Notifications', key, T('Назначено', 'Zugewiesen', 'Assigned', 'Тағайындалды'), user, 'notify.assigned');
    u.go(); return true;
  };
  /* "tomorrow" = 09:00 of the next day in Kazakhstan time (UTC+5) */
  NC.tomorrow = () => { const d = new Date(NC.now() + 5 * 36e5); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 4) - NC.now(); };
  HOOKS.reset = HOOKS.reset || []; HOOKS.reset.push(() => { S.nc = {}; });

  /* ---------- bell ---------- */
  const bellLabel = n => L.title + (n ? ': ' + n : '');
  globalThis.ncBell = () => { const n = NC.count();
    return `${typeof palButton === 'function' ? palButton() : ''}<button type="button" class="bell nc-bell" data-act="ncOpen" data-test="bell" aria-haspopup="dialog" aria-label="${esc(bellLabel(n))}">${ic('bell', 18)}<span class="badge-count" data-live="nc"${n ? '' : ' hidden'}>${n}</span></button>`; };
  const bellRefresh = () => liveUpdate();
  liveBind('nc', n => { const c = NC.count(); n.textContent = c; n.hidden = !c; if (n.parentElement) n.parentElement.setAttribute('aria-label', bellLabel(c)); });

  /* ---------- dialog ---------- */
  const D = { open: false, f: PREFS.get('ncFilter', 'all'), opener: null };
  if (!['all', 'unread', 'mine'].includes(D.f)) D.f = 'all';
  const root = () => document.getElementById('nc-root');
  const users = () => { const n = [me()].concat((S.users || []).map(u => u.name)); return n.filter((x, i) => x && n.indexOf(x) === i); };
  const when = at => (!at ? '' : typeof fdtKZ === 'function' ? fdtKZ(new Date(at).toISOString()) : new Date(at).toISOString().slice(0, 16));
  const short = s => esc(String(s).slice(0, 60));
  const row = x => {
    const sub = [x.sub, when(x.at), x.who ? '→ ' + x.who : ''].filter(Boolean).join(' · ');
    const t60 = String(x.title).slice(0, 60);
    const b = (act, text, label, extra) => `<button type="button" class="btn sm grey" data-nc="${act}" data-k="${esc(x.key)}"${extra || ''} aria-label="${esc(label + ': ' + t60)}">${esc(text)}</button>`;
    const sn = (text, ms) => b('snooze', text, L.snooze + ' ' + text, ` data-ms="${ms}"`);
    return `<li class="nc-it${x.read ? '' : ' unread'}" data-k="${esc(x.key)}"><div class="nc-main"><span class="chip ${x.lvl >= 3 ? 'red' : x.lvl === 2 ? 'yellow' : 'grey'}">${esc(L.types[x.type])}</span>${x.read ? '' : `<span class="chip blue">${esc(L.isNew)}</span>`} <b>${esc(x.title)}</b><small>${esc(sub)}</small></div>
<div class="nc-act">${b('open', L.open, L.open)}${b('read', x.read ? L.asUnread : L.asRead, x.read ? L.asUnread : L.asRead, ` data-on="${x.read ? 0 : 1}"`)}<span role="group" aria-label="${esc(L.snooze)}">${sn(L.h1, 3600000)}${sn(L.h4, 14400000)}${sn(L.tom, 0)}</span>
<select class="select" data-nc-who data-k="${esc(x.key)}" aria-label="${esc(L.assign.replace('…', '') + ': ' + t60)}"><option value="">${esc(L.assign)}</option>${users().map(u => `<option value="${esc(u)}">${esc(u)}</option>`).join('')}</select></div></li>`;
  };
  const body = () => {
    const rows = NC.list(D.f), z = NC.snoozed().length;
    const pill = k => `<button type="button" class="btn sm ${D.f === k ? 'primary' : 'grey'}" data-nc-f="${k}" aria-pressed="${D.f === k}">${esc(L[k])}</button>`;
    return `<div class="nc-filters" role="group" aria-label="${esc(L.filter)}">${['all', 'unread', 'mine'].map(pill).join('')}${z ? `<small class="nc-z">${esc(L.asleep)}: ${z}</small>` : ''}</div>
${rows.length ? `<ul class="nc-list">${rows.map(row).join('')}</ul>` : KIT.state('empty', { title: L.none, hint: L.noneHint, action: false })}`;
  };
  const draw = () => {
    const r = root(); if (!r) return;
    const a = document.activeElement, sig = a && a.closest && a.closest('#nc-root') ? { n: a.dataset.nc, k: a.dataset.k, f: a.dataset.ncF, w: a.hasAttribute('data-nc-who') } : null;
    r.querySelector('.nc-body').innerHTML = body();
    if (typeof a11yPass === 'function') a11yPass(r);
    if (!sig) return;
    const sel = sig.f ? `[data-nc-f="${sig.f}"]` : sig.n ? `[data-nc="${sig.n}"][data-k="${CSS.escape(sig.k)}"]` : null;
    const t = (sel && r.querySelector(sel)) || r.querySelector('.nc-it [data-nc]') || r.querySelector('[data-nc-f]');   // the row is gone (snoozed): next row
    if (t) t.focus();
  };
  globalThis.openNotify = () => {
    if (D.open) return; D.open = true; D.opener = document.activeElement;
    const d = document.createElement('div'); d.id = 'nc-root';
    d.innerHTML = `<div class="a11y-back" data-nc-close></div><div class="a11y-dlg nc-dlg" role="dialog" aria-modal="true" aria-labelledby="nc-h" tabindex="-1" data-a11y-dlg><div class="drawer-head"><h2 id="nc-h">${esc(L.title)}</h2><button type="button" class="x" data-nc-close aria-label="${esc(L.close)}">${ic('x', 18)}</button></div><div class="nc-body"></div></div>`;
    document.body.appendChild(d); draw();
    const f = d.querySelector('[data-nc-f][aria-pressed="true"]'); if (f) f.focus();
  };
  globalThis.closeNotify = () => {
    if (!D.open) return; D.open = false; const r = root(); if (r) r.remove();
    const o = D.opener; D.opener = null; const t = o && o.isConnected ? o : document.querySelector('[data-act="ncOpen"]'); if (t && t.focus) t.focus();
  };
  const openItem = key => {
    const it = find(key); if (!it) return;
    put(key, { read: true }); closeNotify();
    if (it.type === 'alarm') { if (typeof ACT.alarmsGo === 'function') ACT.alarmsGo(); if (ACT.alOpen && S.route === 'dashboard') ACT.alOpen({ id: it.id }); }
    else if (it.type === 'inbox') { if (typeof inboxOpen === 'function') inboxOpen(it.id); }
    else if (canSee('orders')) { if (tabsOf('orders').some(t => t.key === 'commercial')) S.tab.orders = 'commercial'; go('orders'); }
    renderRegion('topbar');
  };
  Object.assign(ACT, { ncOpen: () => openNotify() });

  document.addEventListener('keydown', e => {
    if (D.open && e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closeNotify(); }
  }, true);
  document.addEventListener('click', e => {
    if (!D.open || !e.target.closest) return;
    if (e.target.closest('[data-nc-close]')) return closeNotify();
    const f = e.target.closest('[data-nc-f]'); if (f) { D.f = f.dataset.ncF; PREFS.set('ncFilter', D.f); return draw(); }
    const b = e.target.closest('[data-nc]'); if (!b) return;
    const k = b.dataset.k, a = b.dataset.nc;
    if (a === 'open') return openItem(k);
    if (a === 'read') NC.read(k, b.dataset.on === '1');
    else if (a === 'snooze') NC.snooze(k, +b.dataset.ms || NC.tomorrow());
    draw(); bellRefresh();
  });
  document.addEventListener('change', e => {
    const s = e.target.closest && e.target.closest('[data-nc-who]'); if (!s || !D.open || !s.value) return;
    NC.assign(s.dataset.k, s.value); draw(); bellRefresh();
  });

  try { document.head.insertAdjacentHTML('beforeend', '<style>.nc-bell{background:none;border:0;padding:4px;cursor:pointer;color:var(--text-muted);flex:none} @media (max-width:1100px){.nc-bell{padding:2px;margin:0 -4px}} .nc-bell .badge-count[hidden]{display:none} @media (max-width:480px){.bell.nc-bell{display:flex}} .nc-dlg{width:min(760px,calc(100vw - 32px))} .nc-body{padding:8px 20px 20px} .nc-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 12px} .nc-z{color:var(--text-muted);margin-left:auto} .nc-list{list-style:none;margin:0;padding:0} .nc-it{padding:12px 0;border-top:1px solid var(--border)} .nc-it.unread .nc-main b{font-weight:700} .nc-main{display:flex;flex-wrap:wrap;gap:6px;align-items:center} .nc-main small{flex-basis:100%;color:var(--text-muted)} .nc-act{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;align-items:center} .nc-act [role=group]{display:inline-flex;gap:4px}</style>'); } catch (_) { /* no document */ }
})();
