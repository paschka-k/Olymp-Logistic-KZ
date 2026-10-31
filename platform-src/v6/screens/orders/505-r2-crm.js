/* R2 mirror (0.3.9 Crm.tsx / Contracts.tsx → v6), audit C specs P13–P17. Extends 500-commercial.js without rewriting it:
   P13 Commercial tab needs crm:read, every write action crm:write (FX manual rate: costs:approve), forms hidden for read-only roles;
   P14 lead detail drawer (contacts, consent, status / hub / owner / lost reason, erase personal data, task) + e-mail / phone / message on new leads;
   P15 onboarding card (portal user with a one-time password, API client with scopes + webhook, key shown once);
   P16 customers: e-mail / phone masked, "Show personal data" (pii:read, audited);
   P17 contracts: "Void" needs a reason (≥ 3), staff no longer signs for the customer, template language.
   The section HTML of 500 is post-processed (DOM template) so the booking / pricing / offer code of 500 stays untouched. */
(function () {
  const C = COMM;
  C.revealed = C.revealed || {};
  const today = () => NOW.toISOString().slice(0, 10);
  const W = () => canDo('crm:write');
  const DEMO = (() => { try { return new URLSearchParams(location.search).get('demo') === '1'; } catch (e) { return false; } })();
  const NOPERM = p => toast(T('Нет права: ', 'Kein Recht: ', 'No permission: ', 'Құқық жоқ: ') + p, 'err');
  const v = k => (C.q[k] == null ? '' : String(C.q[k]));
  const fail = m => { C.msg = m; render(); };
  const OWNERS = ['Sarah Johnson', 'A. Smirnov', 'D. Lee', 'S. Johnson'];
  const myName = () => (globalThis.taskMe ? taskMe() : S.role === 'admin' ? 'Sarah Johnson' : ROLE_NAME[S.role]);
  const hex = n => { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 16).toString(16); return s; };
  const otp8 = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; let s = ''; for (let i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)]; return s; };
  /* same text hash as 500 (FNV-style, 64 hex) — needed when the template language changes the contract text */
  const hash = s => { let h1 = 0x811c9dc5, h2 = 0x01000193; for (const c of s) { h1 = Math.imul(h1 ^ c.charCodeAt(0), 16777619) >>> 0; h2 = Math.imul(h2 + c.charCodeAt(0), 2246822519) >>> 0; } return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).repeat(4); };
  const tpl = html => { const t = document.createElement('template'); t.innerHTML = html; return t; };
  const rm = (root, sel, up) => root.querySelectorAll(sel).forEach(e => { const x = up ? e.closest(up) : e; if (x) x.remove(); });
  const Lbl = (ru, de, en, kk) => esc(T(ru, de, en, kk));

  /* ---------- masks (P16) ---------- */
  globalThis.maskEmail = e => { const s = String(e || ''); const i = s.indexOf('@'); return i > 0 ? s[0] + '***' + s.slice(i) : (s ? '***' : '—'); };
  globalThis.maskPhone = p => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 4 ? '+7 7•• ••• •• ' + d.slice(-2) : '—'; };

  /* ---------- seed additions: owner, hub, consent date (web leads), contract language ---------- */
  const SEEDL = { 'L-101': ['Sarah Johnson', 'ALA', 'weekly'], 'L-102': ['D. Lee', 'KAR', null], 'L-103': ['', '', null], 'L-099': ['A. Smirnov', 'AST', null] };
  S.leads.forEach(l => { const s = SEEDL[l.id] || ['', '', null]; if (l.owner == null) l.owner = s[0]; if (l.hub == null) l.hub = s[1]; if (l.freq == null) l.freq = s[2] ? T('2 раза в неделю', '2× pro Woche', 'twice a week', 'аптасына 2 рет') : ''; if (l.consent == null) l.consent = l.src === 'web' ? l.created : null; });
  S.contracts.forEach(c => { if (!c.lang) c.lang = 'RU'; });
  const addLead0 = globalThis.addLead;
  globalThis.addLead = o => { const l = addLead0(Object.assign({ owner: '', hub: '', freq: '' }, o)); if (l.consent == null) l.consent = l.src === 'web' ? today() : null; return l; };

  /* ---------- P13: tab permission + gated write actions (getter / setter keeps the gate if another file re-assigns the handler; the getter captures the current handler so a wrapper that saved it does not call itself) ---------- */
  (SCREENS.orders.tabs || []).forEach(t => { if (t.key === 'commercial') t.perm = 'crm:read'; });
  const B = {};
  const gate = (k, perm) => { let f = ACT[k]; B[k] = f;   /* B = the 500 handler as loaded; overrides below wrap it */ Object.defineProperty(ACT, k, { configurable: true, enumerable: true, get: () => { const g = f; return (...a) => (canDo(perm) ? (g ? g(...a) : undefined) : NOPERM(perm)); }, set: nf => { f = nf; } }); };
  ['cmCustAdd', 'cmAddrAdd', 'cmAddrOk', 'cmAddrDel', 'cmPlAdd', 'cmPlOff', 'cmPlOffYes', 'cmOfAdd', 'cmOfVoid', 'cmOfAccept', 'cmCtAdd', 'cmCtSend', 'cmCtVoid', 'cmCtSign', 'cmLead', 'cmLeadAdd', 'cmLeadSave', 'cmLeadErase', 'cmLeadTask', 'cmTaskFor', 'cmTaskAdd', 'cmTaskDone', 'cmCtVoidOk'].forEach(k => gate(k, 'crm:write'));
  gate('cmFxAdd', 'costs:approve');

  /* ---------- section post-processing ---------- */
  const base = globalThis.commercialBody;
  function postCustomers(t) {
    const r = t.content;
    r.querySelectorAll('tr[data-act="cmCust"][data-id]').forEach(tr => {
      const c = custOf(tr.dataset.id), td = tr.children[2]; if (!td) return;
      const open = !!C.revealed[c.id];
      td.innerHTML = `${esc(c.contact || '—')}<div class="sub" data-pii="${open ? 'clear' : 'masked'}" data-pii-id="${c.id}">${esc(open ? (c.email || '—') : maskEmail(c.email))} · ${esc(open ? (c.phone || '—') : maskPhone(c.phone))}</div>${!open && canDo('pii:read') ? `<button class="btn sm grey" data-act="cmPiiShow" data-id="${c.id}" style="margin-top:4px">${Lbl('Показать ПДн', 'Personendaten zeigen', 'Show personal data', 'ДЖД көрсету')}</button>` : ''}`;
    });
    if (!W()) { rm(r, '[data-act="cmCustAdd"]', '.card'); rm(r, '[data-act="cmAddrOk"], [data-act="cmAddrDel"]'); rm(r, '#cm_a_city, #cm_a_street', '.grid2'); rm(r, '#cm_addrmsg, [data-act="cmAddrAdd"]'); return; }
    const btn = r.querySelector('[data-act="cmCustAdd"]');
    if (btn) btn.insertAdjacentHTML('beforebegin', `<div class="grid2 eq" data-cu-pd><label class="fl">E-mail<input class="inp" id="cm_cu_email" data-cm="cu_email" type="email" maxlength="120" value="${esc(v('cu_email'))}"></label><label class="fl">${Lbl('Телефон', 'Telefon', 'Phone', 'Телефон')}<input class="inp" id="cm_cu_phone" data-cm="cu_phone" maxlength="20" placeholder="+7 7__ ___ __ __" value="${esc(v('cu_phone'))}"></label></div><p class="note">${Lbl('Контакты хранятся зашифрованно и в таблице показываются маской; раскрытие (pii:read) пишется в журнал аудита.', 'Kontakte werden verschlüsselt gespeichert und in der Tabelle maskiert; das Aufdecken (pii:read) wird protokolliert.', 'Contacts are stored encrypted and shown masked in the table; revealing them (pii:read) is written to the audit log.', 'Байланыстар шифрланып сақталады және кестеде маскамен көрсетіледі; ашу (pii:read) аудит журналына жазылады.')}</p>`);
  }
  const LANGS_CT = ['RU', 'DE', 'EN'];
  const ctTpl = (kind, lang) => (kind === 'framework' ? 'FW-' + lang + ' v3' : 'SPOT-' + lang + ' v2');
  function postContracts(t) {
    const r = t.content;
    r.querySelectorAll('[data-act="cmCtView"][data-id]').forEach(a => {
      const c = S.contracts.find(x => x.id === a.dataset.id), tr = a.closest('tr'); if (!c || !tr) return;
      tr.dataset.ct = c.id;
      const sig = tr.children[6], act = tr.children[7];
      if (sig && c.status === 'void') sig.innerHTML = `${c.voided ? fd(c.voided) : '—'}<div class="sub" data-ct-void="${c.id}">${Lbl('Причина аннулирования: ', 'Stornogrund: ', 'Void reason: ', 'Жою себебі: ')}${esc(c.voidReason || T('не указана', 'nicht angegeben', 'not given', 'көрсетілмеген'))}</div>`;
      if (act) {
        act.querySelectorAll('[data-act="cmCtSign"]').forEach(s => { if (DEMO && W()) { s.textContent = T('Подпись клиента (демо-ярлык)', 'Kundenunterschrift (Demo-Abkürzung)', 'Customer signature (demo shortcut)', 'Клиент қолтаңбасы (демо жарлық)'); } else s.remove(); });
        if (!W()) act.querySelectorAll('[data-act="cmCtSend"], [data-act="cmCtVoid"]').forEach(s => s.remove());
        while (act.firstChild && act.firstChild.nodeType === 3 && /^\s*·?\s*$/.test(act.firstChild.nodeValue)) act.firstChild.remove();
        if (act.firstChild && act.firstChild.nodeType === 3) act.firstChild.nodeValue = act.firstChild.nodeValue.replace(/^\s*·\s*/, '');
        if (W() && C.voidId === c.id && c.status !== 'void') act.insertAdjacentHTML('beforeend', `<div class="rec-row" data-ct-voidform style="margin-top:6px"><input class="inp" id="cm_ct_vr" data-cm="ct_vr" maxlength="200" placeholder="${esc(T('Причина аннулирования', 'Stornogrund', 'Reason for voiding', 'Жою себебі'))}" value="${esc(v('ct_vr'))}"><button class="btn sm red" data-act="cmCtVoidOk" data-id="${c.id}">${Lbl('Аннулировать', 'Annullieren', 'Void', 'Жою')}</button><button class="btn sm grey" data-act="cmCtVoidNo">×</button></div>${C.voidErr ? `<p class="note" id="cm_ct_vrerr" style="color:var(--chip-red-fg)">${esc(C.voidErr)}</p>` : ''}`);
      }
    });
    const sel = r.querySelector('#cm_ct_kind');
    if (sel) { const cur = v('ct_kind') || 'framework:RU'; sel.innerHTML = ['framework', 'spot'].flatMap(k => LANGS_CT.map(lg => [k + ':' + lg, CTKIND[k] + ' · ' + ctTpl(k, lg).replace('-' + lg, '') + ' · ' + lg])).map(o => `<option value="${o[0]}"${o[0] === cur || o[0] === cur + ':RU' ? ' selected' : ''}>${esc(o[1])}</option>`).join(''); }
    const cv = S.contracts.find(c => c.id === C.ctView), pre = r.querySelector('pre');
    if (cv && pre) { const cardEl = pre.closest('.card'); pre.insertAdjacentHTML('beforebegin', `<p class="note" data-ct-meta>${Lbl('Шаблон', 'Vorlage', 'Template', 'Үлгі')}: ${esc(cv.tpl)} · ${Lbl('язык', 'Sprache', 'language', 'тілі')} ${esc(cv.lang || 'RU')} · ${Lbl('срок', 'Laufzeit', 'validity', 'мерзімі')} ${fd(cv.from)} – ${cv.to ? fd(cv.to) : '∞'}</p>`); if (cv.status === 'void') cardEl.insertAdjacentHTML('beforeend', `<p class="note" data-ct-voidtext style="color:var(--chip-red-fg)">${Lbl('Аннулирован', 'Annulliert', 'Voided', 'Жойылды')} ${cv.voided ? fd(cv.voided) : ''} · ${esc(cv.voidReason || '—')}</p>`); if (cv.status === 'signed') cardEl.insertAdjacentHTML('beforeend', `<p class="note">${Lbl('Проверка подписи', 'Signaturprüfung', 'Signature check', 'Қолтаңбаны тексеру')}: CMS ok</p>`); cardEl.insertAdjacentHTML('beforeend', `<button class="btn grey sm" data-act="cmCtPrint" data-id="${cv.id}">${Lbl('Печать / PDF', 'Drucken / PDF', 'Print / PDF', 'Басып шығару / PDF')}</button>`); }
    const note = r.querySelector('[data-act="cmCtAdd"]');
    if (note) note.insertAdjacentHTML('afterend', ` <span class="note" data-ct-signnote>${Lbl('Подписывает только клиент — в портале (ЭЦП NCALayer).', 'Nur der Kunde unterschreibt – im Portal (NCALayer).', 'Only the customer signs — in the portal (NCALayer).', 'Тек клиент қол қояды — порталда (NCALayer).')}</span>`);
    if (!W()) rm(r, '[data-act="cmCtAdd"]', '.card');
  }
  function postCrm(t) {
    const r = t.content;
    r.querySelectorAll('.kcard').forEach(k => {
      const a = k.querySelector('[data-act="cmTaskFor"][data-id]'); if (!a) return; const l = S.leads.find(x => x.id === a.dataset.id); if (!l) return;
      k.dataset.act = 'cmLeadOpen'; k.dataset.id = l.id; k.dataset.lead = l.id; k.style.cursor = 'pointer';
      const first = k.querySelector('.sub');
      const meta = `<div class="sub" data-lead-meta>${esc(SRC_L[l.src] || l.src)} · ${fd(l.created)}${l.owner ? ' · ' + esc(l.owner) : ''}${l.hub && HUBS[l.hub] ? ' · ' + esc(HUBS[l.hub].city) : ''}</div>${l.erased ? `<div class="sub" data-lead-erased>${chip('gray', T('персональные данные удалены', 'Personendaten gelöscht', 'personal data erased', 'жеке деректер жойылды'))}</div>` : ''}`;
      if (first) first.insertAdjacentHTML('afterend', meta);
      if (!W()) rm(k, '.actbar');
    });
    const src = r.querySelector('#cm_ld_src'); if (src) { const o = src.querySelector('option[value="web"]'); if (o) o.remove(); }
    if (!W()) { rm(r, '[data-act="cmLeadAdd"]', '.card'); return; }
    const btn = r.querySelector('[data-act="cmLeadAdd"]');
    if (btn) btn.insertAdjacentHTML('beforebegin', `<div class="grid2 eq" data-ld-pd><label class="fl">E-mail<input class="inp" id="cm_ld_email" data-cm="ld_email" type="email" maxlength="120" value="${esc(v('ld_email'))}"></label><label class="fl">${Lbl('Телефон', 'Telefon', 'Phone', 'Телефон')}<input class="inp" id="cm_ld_phone" data-cm="ld_phone" maxlength="20" value="${esc(v('ld_phone'))}"></label></div><label class="fl">${Lbl('Сообщение', 'Nachricht', 'Message', 'Хабарлама')}<textarea class="inp" id="cm_ld_msg" data-cm="ld_msg" maxlength="2000" rows="2">${esc(v('ld_msg'))}</textarea></label>`);
  }
  globalThis.commercialBody = () => {
    const html = base();
    const t = tpl(html), r = t.content;
    if (C.sec === 'customers' || !C.sec) postCustomers(t);
    else if (C.sec === 'contracts') postContracts(t);
    else if (C.sec === 'crm') postCrm(t);
    else if (C.sec === 'prices') { if (!W()) { rm(r, '[data-act="cmPlAdd"]', '.card'); rm(r, '[data-act="cmPlOff"]'); } }
    else if (C.sec === 'offers') { if (!W()) { rm(r, '[data-act="cmOfAdd"]', '.card'); rm(r, '[data-act="cmOfAccept"], [data-act="cmOfVoid"]'); } }
    else if (C.sec === 'fx') { if (!canDo('costs:approve')) rm(r, '[data-act="cmFxAdd"]', '.card'); }
    if (!W()) r.firstElementChild && r.firstElementChild.insertAdjacentHTML('afterend', `<p class="note" data-crm-ro>${Lbl('Только просмотр (crm:read): изменения доступны ролям с правом crm:write.', 'Nur Lesen (crm:read): Änderungen nur mit dem Recht crm:write.', 'Read only (crm:read): changes need the right crm:write.', 'Тек қарау (crm:read): өзгерту crm:write құқығымен.')}</p>`);
    return t.innerHTML;
  };

  /* ---------- P14 lead drawer ---------- */
  const STL = () => PIPE.map(s => [s, PIPE_L[s]]);
  const SHOWN = {};   // one-time secrets, shown once in the open drawer
  const kv = (k, val, attr) => `<div${attr ? ' ' + attr : ''}><small>${esc(k)}</small><b>${val}</b></div>`;
  function onboardCard(l) {
    const cu = custOf(l.custId); if (!l.custId) return '';
    const sh = SHOWN[l.id] || {};
    const pu = S.users && S.users.find(u => u.role === 'customer' && u.ref === cu.id);
    const ak = S.apiKeys && S.apiKeys.find(k => k.cust === cu.id && k.active);
    const first = l.onbExisted ? T('Клиент с таким БИН уже есть — лид привязан к нему (без дубликата).', 'Ein Kunde mit dieser BIN existiert – der Lead ist mit ihm verknüpft (kein Duplikat).', 'A customer with this BIN exists — the lead is linked to it (no duplicate).', 'Мұндай БСН бар клиент бар — лид соған байланыстырылды (қайталанбайды).') : T('Клиент создан.', 'Kunde angelegt.', 'Customer created.', 'Клиент құрылды.');
    let row1 = '', row2 = '';
    if (canDo('users:admin')) {
      const slug = portalSlug(cu);
      row1 = `<div class="drawer-section" data-onb-user>${sh.pw ? `<div class="card rec-card lvl1" data-onb-secret><b>${Lbl('Показывается один раз — передайте клиенту по защищённому каналу:', 'Wird nur einmal angezeigt – dem Kunden über einen sicheren Kanal übergeben:', 'Shown once — hand it to the customer over a secure channel:', 'Бір рет көрсетіледі — клиентке қорғалған арна арқылы беріңіз:')}</b><div class="mono" data-onb-pw>${esc(sh.login)} · ${esc(sh.pw)}</div></div>` : ''}${pu ? `<p class="note" data-onb-userok>✓ ${Lbl('Пользователь портала есть', 'Portalbenutzer existiert', 'Portal user exists', 'Портал пайдаланушысы бар')} · <span class="mono">${esc(pu.username)}</span></p>` : `<button class="btn primary sm" data-act="cmOnbUser" data-id="${l.id}">${Lbl('Создать пользователя портала', 'Portalbenutzer anlegen', 'Create portal user', 'Портал пайдаланушысын құру')} · ${esc(slug)}</button>`}</div>`;
    }
    if (canDo('integrations:admin')) {
      row2 = `<div class="drawer-section rec-form" data-onb-api>${sh.key ? `<div class="card rec-card lvl1" data-onb-secret><b>${Lbl('Показывается один раз — передайте клиенту по защищённому каналу:', 'Wird nur einmal angezeigt – dem Kunden über einen sicheren Kanal übergeben:', 'Shown once — hand it to the customer over a secure channel:', 'Бір рет көрсетіледі — клиентке қорғалған арна арқылы беріңіз:')}</b><div class="mono" data-onb-key>${esc(sh.key)}</div></div>` : ''}${ak ? `<p class="note" data-onb-apiok>✓ ${Lbl('API-клиент есть', 'API-Client existiert', 'API client exists', 'API клиенті бар')} · <span class="mono">${esc(ak.prefix)}…</span></p>` : `<h4>${Lbl('API-клиент', 'API-Client', 'API client', 'API клиенті')}</h4>${API_SCOPES.map(s => `<div><label><input type="checkbox" id="onb_sc_${s.replace(':', '_')}" data-onb-scope checked> ${s}</label></div>`).join('')}<label class="fl">${Lbl('URL вебхука (необязательно)', 'Webhook-URL (optional)', 'Webhook URL (optional)', 'Вебхук URL (міндетті емес)')}<input class="select" id="onb_hook" placeholder="https://erp.example/hook"></label><p class="note" id="onb_err" style="color:var(--chip-red-fg)"></p><button class="btn primary sm" id="onb_apibtn" data-act="cmOnbApi" data-id="${l.id}">${Lbl('Создать API-клиента', 'API-Client anlegen', 'Create API client', 'API клиентін құру')}</button>`}</div>`;
    }
    return `<div class="drawer-section" data-onb><h4 style="margin:0 0 6px">${Lbl('Онбординг клиента', 'Kunden-Onboarding', 'Customer onboarding', 'Клиент онбордингі')}</h4><p class="note" data-onb-first>${esc(first)} <b>${esc(cu.name)}</b></p></div>${row1}${row2}`;
  }
  const API_SCOPES = ['slots:read', 'quotes:write', 'bookings:write', 'bookings:read', 'shipments:read'];
  const portalSlug = cu => { let s = nmLat(String(cu.name || '')).toLowerCase().replace(/\b(too|llp|ip|tov)\b/g, ' ').replace(/[^a-z0-9]+/g, '').slice(0, 24); if (s.length < 3) s = 'cust' + String(cu.id).replace(/\W/g, ''); let u = s + '.portal', i = 2; while (S.users && S.users.some(x => x.username === u)) u = s + i++ + '.portal'; return u; };
  DRAWERS.lead = d => {
    const l = S.leads.find(x => x.id === d.id); if (!l) return { title: '—', html: '' };
    const w = W(), st = d.st || l.status, dash = '—';
    const contacts = `<div class="drawer-section"><div class="rec-row">${chip(l.status === 'won' ? 'green' : l.status === 'lost' ? 'red' : 'blue', PIPE_L[l.status])}${l.erased ? ' ' + chip('gray', T('ПДн удалены ', 'Personendaten gelöscht ', 'personal data erased ', 'ДЖД жойылды ') + fd(l.erased)) : ''}</div><div class="kv" style="margin-top:12px" data-lead-kv>
${kv(T('Контактное лицо', 'Ansprechpartner', 'Contact person', 'Байланыс тұлғасы'), esc(l.contact || dash))}
${kv('E-mail', l.email ? `<a class="lnk" href="mailto:${esc(l.email)}" data-lead-mail>${esc(l.email)}</a>` : dash)}
${kv(T('Телефон', 'Telefon', 'Phone', 'Телефон'), l.phone ? `<a class="lnk" href="tel:${esc(String(l.phone).replace(/\s/g, ''))}" data-lead-tel>${esc(l.phone)}</a>` : dash)}
${kv(T('Маршрут', 'Route', 'Route', 'Маршрут'), esc(locName(l.from)) + ' → ' + esc(locName(l.to)))}
${kv(T('Температурный режим', 'Temperaturklasse', 'Temperature class', 'Температура режимі'), ZONES[l.zone] ? esc(ZONES[l.zone].label) : dash)}
${kv(T('Паллеты · частота', 'Paletten · Häufigkeit', 'Pallets · frequency', 'Паллет · жиілік'), (l.pallets || dash) + (l.freq ? ' · ' + esc(l.freq) : ''))}
${kv(T('Источник · дата', 'Quelle · Datum', 'Source · date', 'Дереккөз · күні'), esc(SRC_L[l.src] || l.src) + ' · ' + fd(l.created))}
${kv(T('Согласие на обработку ПДн', 'Einwilligung Datenverarbeitung', 'Data-processing consent', 'ДЖД өңдеуге келісім'), l.consent ? fd(l.consent) : dash, 'data-lead-consent')}
${kv(T('БИН', 'BIN', 'BIN', 'БСН'), l.bin ? esc(l.bin) : dash)}
${kv(T('№ тендера', 'Ausschreibungs-Nr.', 'Tender no.', 'Тендер №'), l.tender ? esc(l.tender) : dash)}
${kv(T('Срок подачи', 'Abgabefrist', 'Submission deadline', 'Тапсыру мерзімі'), l.deadline ? fd(l.deadline) : dash)}
${kv(T('Ответственный · хаб', 'Verantwortlich · Hub', 'Owner · hub', 'Жауапты · хаб'), esc(l.owner || dash) + ' · ' + (l.hub && HUBS[l.hub] ? esc(HUBS[l.hub].city) : dash))}
${l.status === 'lost' ? kv(T('Причина проигрыша', 'Verlustgrund', 'Lost reason', 'Жеңіліс себебі'), esc(l.lost || dash)) : ''}
</div>${l.msg ? `<blockquote class="note" data-lead-msg style="margin:12px 0 0;padding:8px 12px;border-left:3px solid var(--border);white-space:pre-wrap">${esc(l.msg)}</blockquote>` : ''}<p class="note" data-lead-pdnote>${Lbl('Просмотр персональных данных записывается в журнал аудита.', 'Die Anzeige personenbezogener Daten wird im Audit-Protokoll erfasst.', 'Viewing personal data is recorded in the audit log.', 'Жеке деректерді қарау аудит журналына жазылады.')}</p></div>`;
    const sel = (id, opts, cur) => `<select class="select" id="${id}">${opts.map(o => `<option value="${esc(o[0])}"${o[0] === (cur || '') ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
    const edit = !w ? '' : `<div class="drawer-section rec-form" data-lead-edit><div class="two"><label class="fl">${Lbl('Статус', 'Status', 'Status', 'Күйі')}${sel('ld_st', STL(), st)}</label><label class="fl">${Lbl('Хаб', 'Hub', 'Hub', 'Хаб')}${sel('ld_hub', [['', T('Хаб: —', 'Hub: —', 'Hub: —', 'Хаб: —')], ...Object.keys(HUBS).map(h => [h, HUBS[h].city])], l.hub)}</label></div><label class="fl">${Lbl('Ответственный', 'Verantwortlich', 'Owner', 'Жауапты')}${sel('ld_own', [['', T('Ответственный: —', 'Verantwortlich: —', 'Owner: —', 'Жауапты: —')], ...OWNERS.map(o => [o, o])], l.owner)}</label><label class="fl" id="ld_reason_row" style="${st === 'lost' ? '' : 'display:none'}">${Lbl('Причина', 'Grund', 'Reason', 'Себебі')}<input class="select" id="ld_reason" maxlength="200" value="${esc(l.status === 'lost' ? l.lost || '' : '')}"></label><p class="note" id="ld_err" style="color:var(--chip-red-fg)">${esc(d.err || '')}</p><div class="rec-row"><button class="btn primary" data-act="cmLeadSave" data-id="${l.id}">${Lbl('Сохранить', 'Speichern', 'Save', 'Сақтау')}</button>${l.custId ? chip('green', T('Выиграно', 'Gewonnen', 'Won', 'Жеңіс')) : `<button class="btn green" data-act="cmLead" data-id="${l.id}" data-v="won">${Lbl('Сделать клиентом', 'Zum Kunden machen', 'Convert to customer', 'Клиентке айналдыру')}</button>`}${l.erased ? '' : `<button class="btn ghost red" style="color:var(--chip-red-fg)" data-act="cmLeadErase" data-id="${l.id}">${Lbl('Удалить персональные данные', 'Personendaten löschen', 'Erase personal data', 'Жеке деректерді жою')}</button>`}</div></div>`;
    const tks = S.tasks.filter(t => t.lead === l.id);
    const tasks = `<div class="drawer-section rec-form" data-lead-tasks><h4 style="margin:0 0 6px">${Lbl('Задачи', 'Aufgaben', 'Tasks', 'Тапсырмалар')} · ${tks.length}</h4>${tks.map(t => `<div class="sub" data-lead-task="${t.id}">${t.done ? '✓ ' : ''}${esc(t.title)} · ${t.due ? fd(t.due) : '—'} · ${esc(t.who || '—')}</div>`).join('')}${w ? `<div class="two" style="margin-top:8px"><label class="fl">${Lbl('Новая задача', 'Neue Aufgabe', 'New task', 'Жаңа тапсырма')}<input class="select" id="ld_tk_title" maxlength="200"></label><label class="fl">${Lbl('Срок', 'Fällig am', 'Due date', 'Мерзімі')}<input class="select" id="ld_tk_due" type="date"></label></div><p class="note" id="ld_tk_err" style="color:var(--chip-red-fg)"></p><button class="btn grey sm" data-act="cmLeadTask" data-id="${l.id}">${Lbl('Создать', 'Anlegen', 'Create', 'Құру')}</button>` : ''}</div>`;
    return { title: l.id + ' · ' + l.company, html: contacts + edit + onboardCard(l) + tasks };
  };
  document.addEventListener('change', e => {
    const el = e.target; if (!el || !el.id) return;
    if (el.id === 'ld_st') { const r = document.getElementById('ld_reason_row'); if (r) r.style.display = el.value === 'lost' ? '' : 'none'; }
    if (el.dataset && el.dataset.onbScope !== undefined) { const b = document.getElementById('onb_apibtn'); if (b) b.disabled = !document.querySelectorAll('[data-onb-scope]:checked').length; }
  });

  const okLost = s => String(s || '').trim().length >= 3;
  const REASON_MSG = () => T('Причина (минимум 3 символа)', 'Grund (mindestens 3 Zeichen)', 'Reason (min. 3 characters)', 'Себебі (кемінде 3 таңба)');
  Object.assign(ACT, {
    cmLeadOpen: d => { const l = S.leads.find(x => x.id === d.id); if (!l) return; delete SHOWN[l.id]; audit('CRM', l.id, 'PD viewed'); openDrawer({ type: 'lead', id: l.id }); },
    cmPiiShow: d => { if (!canDo('pii:read')) return NOPERM('pii:read'); C.revealed[d.id] = true; audit('Commercial', d.id, 'PD viewed'); render(); },
    cmTaskSeg: d => ACT.cmTkSeg({ v: d.v === 'all' ? 1 : 0 }),   /* the tasks list itself is R1's (500-commercial.js: Mine by default, assignee, CRM link) */
    cmCtVoidNo: () => { C.voidId = null; C.voidErr = ''; render(); },
    cmCtPrint: d => { const c = S.contracts.find(x => x.id === d.id); if (!c) return; const a = document.createElement('a'); a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(c.text + '\n\nSHA-256: ' + c.sha); a.setAttribute('download', c.id + '.txt'); a.click(); },
    cmOnbUser: d => {
      if (!canDo('users:admin')) return NOPERM('users:admin');
      const l = S.leads.find(x => x.id === d.id); if (!l || !l.custId) return; const cu = custOf(l.custId);
      const login = portalSlug(cu), r = typeof userCreate === 'function' ? userCreate({ username: login, name: cu.name, role: 'customer', ref: cu.id }) : { user: { username: login } };
      if (typeof r === 'string') return toast(r, 'err');
      cu.portal = true; const pw = otp8(); SHOWN[l.id] = Object.assign(SHOWN[l.id] || {}, { login, pw });
      audit('CRM', cu.id, 'Portal user created', login); render();
    },
    cmOnbApi: d => {
      if (!canDo('integrations:admin')) return NOPERM('integrations:admin');
      const l = S.leads.find(x => x.id === d.id); if (!l || !l.custId) return; const cu = custOf(l.custId);
      const scopes = d.scopes ? String(d.scopes).split(',') : API_SCOPES.filter(s => fval('onb_sc_' + s.replace(':', '_')));
      const err = m => { toast(m, 'err'); const e = document.getElementById('onb_err'); if (e) e.textContent = m; };
      if (!scopes.length) return err(T('Выберите хотя бы одно право', 'Mindestens ein Recht wählen', 'Choose at least one scope', 'Кемінде бір құқықты таңдаңыз'));
      const hook = String(d.hook != null ? d.hook : fval('onb_hook') || '').trim();
      if (hook && !/^https:\/\/[^\s]+$/.test(hook)) return err(T('Вебхук: нужен https-URL', 'Webhook: https-URL nötig', 'Webhook: an https URL is needed', 'Вебхук: https-URL қажет'));
      const key = 'olk_' + hex(8) + '_' + hex(24);
      S.apiKeys = S.apiKeys || []; S.apiKeys.unshift({ id: 'k' + (S.apiKeys.length + 1), name: cu.name, prefix: key.slice(0, 12), scopes, created: today(), last: '', active: true, cust: cu.id });
      if (hook) { S.webhooks = S.webhooks || []; S.webhooks.push({ id: 'w' + (S.webhooks.length + 1), url: hook, events: ['booking.confirmed', 'booking.rejected', 'shipment.status'], secret: 'whsec_•••• ' + hex(4), active: true, log: [], cust: cu.id }); audit('Integrations', 'webhook ' + hook, 'Webhook created', cu.id); }
      SHOWN[l.id] = Object.assign(SHOWN[l.id] || {}, { key }); audit('Integrations', 'apikey ' + key.slice(0, 12), 'API client created', scopes.join(',')); render();
    },
  });
  /* write actions (assigned through the gate setter, so they stay crm:write-gated) */
  ACT.cmLead = d => {
    const l = S.leads.find(x => x.id === d.id); if (!l) return;
    if (d.v === 'lost' && !okLost(d.reason)) { openDrawer({ type: 'lead', id: l.id, st: 'lost' }); return toast(REASON_MSG(), 'err'); }
    if (d.v === 'won' && !l.custId) l.onbExisted = !!S.customers.find(c => l.bin && c.bin === l.bin);
    B.cmLead(d);
    if (d.v === 'lost') l.lost = String(d.reason).trim();
    if (d.v === 'won') { delete SHOWN[l.id]; S.drawer = { type: 'lead', id: l.id }; render(); }
  };
  ACT.cmLeadSave = d => {
    const l = S.leads.find(x => x.id === d.id); if (!l) return;
    const st = d.st || fval('ld_st') || l.status, reason = d.reason != null ? d.reason : fval('ld_reason');
    const err = m => { S.drawer = { type: 'lead', id: l.id, st, err: m }; toast(m, 'err'); };
    if (st === 'lost' && !okLost(reason)) return err(REASON_MSG());
    l.hub = d.hub != null ? d.hub : fval('ld_hub'); l.owner = d.owner != null ? d.owner : fval('ld_own');
    if (st === 'won' && !l.custId) { ACT.cmLead({ id: l.id, v: 'won' }); }
    else { l.status = st; if (st === 'lost') l.lost = String(reason).trim(); }
    audit('CRM', l.id, 'Lead updated', st); if (S.drawer && S.drawer.type === 'lead') S.drawer = { type: 'lead', id: l.id };
    toast(T('Сохранено', 'Gespeichert', 'Saved', 'Сақталды'));
  };
  ACT.cmLeadErase = d => {
    const l = S.leads.find(x => x.id === d.id); if (!l || l.erased) return;
    if (!d.force && !window.confirm(T('Безвозвратно удалить контактные данные этого лида?', 'Kontaktdaten dieses Leads endgültig löschen?', 'Permanently erase the contact data of this lead?', 'Осы лидтің байланыс деректерін біржола жою керек пе?'))) return;
    l.contact = '—'; l.email = ''; l.phone = ''; l.msg = ''; l.erased = today();
    audit('CRM', l.id, 'PD erased'); toast(T('Персональные данные удалены', 'Personendaten gelöscht', 'Personal data erased', 'Жеке деректер жойылды'));
  };
  ACT.cmLeadTask = d => {
    const l = S.leads.find(x => x.id === d.id); if (!l) return;
    const title = String(d.title != null ? d.title : fval('ld_tk_title')).trim(), due = d.due != null ? d.due : fval('ld_tk_due');
    if (title.length < 2) { const e = document.getElementById('ld_tk_err'); if (e) e.textContent = T('Опишите задачу (минимум 2 символа)', 'Aufgabe beschreiben (mindestens 2 Zeichen)', 'Describe the task (min. 2 characters)', 'Тапсырманы сипаттаңыз (кемінде 2 таңба)'); return; }
    const n = S.tasks.reduce((m, t) => Math.max(m, +String(t.id).replace(/\D/g, '') || 0), 0) + 1;
    S.tasks.push({ id: 'T-' + n, title, due: due || null, lead: l.id, cust: l.custId || null, done: false, who: l.owner || myName() });
    audit('CRM', 'T-' + n, 'Task created', l.id); const t1 = document.getElementById('ld_tk_title'); if (t1) t1.value = ''; render();
  };
  ACT.cmLeadAdd = d => {
    const email = (v('ld_email')).trim(), phone = v('ld_phone').trim(), msg = v('ld_msg').slice(0, 2000);
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(T('E-mail указан неверно', 'E-Mail ungültig', 'Invalid e-mail', 'E-mail қате'));
    if (phone.length > 20) return fail(T('Телефон: не более 20 символов', 'Telefon: höchstens 20 Zeichen', 'Phone: at most 20 characters', 'Телефон: 20 таңбадан аспайды'));
    const n = S.leads.length; B.cmLeadAdd(d);
    if (S.leads.length > n) { const l = S.leads[0]; l.email = email; l.phone = phone; l.msg = msg; ['ld_email', 'ld_phone', 'ld_msg'].forEach(k => { C.q[k] = ''; }); render(); }
  };
  ACT.cmCustAdd = d => {
    const email = v('cu_email').trim(), phone = v('cu_phone').trim();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(T('E-mail указан неверно', 'E-Mail ungültig', 'Invalid e-mail', 'E-mail қате'));
    if (phone.length > 20) return fail(T('Телефон: не более 20 символов', 'Telefon: höchstens 20 Zeichen', 'Phone: at most 20 characters', 'Телефон: 20 таңбадан аспайды'));
    const n = S.customers.length; B.cmCustAdd(d);
    if (S.customers.length > n) { const c = S.customers[S.customers.length - 1]; if (email) c.email = email; if (phone) c.phone = phone; C.q.cu_email = ''; C.q.cu_phone = ''; render(); }
  };
  ACT.cmCtAdd = d => {
    const raw = v('ct_kind') || 'framework', kind = raw.split(':')[0] === 'spot' ? 'spot' : 'framework', lang = LANGS_CT.includes(raw.split(':')[1]) ? raw.split(':')[1] : 'RU';
    const n = S.contracts.length; C.q.ct_kind = kind; try { B.cmCtAdd(d); } finally { C.q.ct_kind = raw; }
    if (S.contracts.length > n) { const c = S.contracts[0]; c.lang = lang; c.tpl = ctTpl(kind, lang); c.text = T('Язык шаблона', 'Vorlagensprache', 'Template language', 'Үлгі тілі') + ': ' + lang + ' · ' + c.tpl + '\n' + c.text; c.sha = hash(c.text); render(); }
  };
  ACT.cmCtVoid = d => {
    const c = S.contracts.find(x => x.id === d.id); if (!c || c.status === 'void') return;
    if (d.reason == null) { C.voidId = c.id; C.voidErr = ''; C.q.ct_vr = ''; return render(); }
    const r = String(d.reason).trim();
    if (r.length < 3) { C.voidId = c.id; C.voidErr = T('Причина аннулирования (минимум 3 символа)', 'Stornogrund (mindestens 3 Zeichen)', 'Reason for voiding (min. 3 characters)', 'Жою себебі (кемінде 3 таңба)'); toast(C.voidErr, 'err'); return; }
    c.status = 'void'; c.voidReason = r; c.voided = today(); C.voidId = null; C.voidErr = ''; C.q.ct_vr = '';
    audit('Commercial', c.id, 'Contract void', r); render();
  };
  ACT.cmCtVoidOk = d => ACT.cmCtVoid({ id: d.id, reason: v('ct_vr') });
  /* staff must not sign for the customer: only the demo shortcut (?demo=1) remains */
  ACT.cmCtSign = d => { if (!DEMO) return toast(T('Договор подписывает только клиент — в портале', 'Nur der Kunde unterschreibt den Vertrag – im Portal', 'Only the customer signs the contract — in the portal', 'Шартқа тек клиент қол қояды — порталда'), 'err'); signContract(d.id, T('Клиент (демо-ярлык)', 'Kunde (Demo-Abkürzung)', 'Customer (demo shortcut)', 'Клиент (демо жарлық)')); };
})();
