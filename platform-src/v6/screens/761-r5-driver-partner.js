/* R5 · Driver and partner ideas (Ideenliste I-17, I-18, I-11; FR-68, FR-70, FR-188), all simulated:
   - FR-70 PIN login on a managed device: the driver app (role shell and Drivers → Driver app) opens only with an active PIN session on the
     bound, MDM-compliant device; 5 wrong PINs lock it; Drivers → Driver app admin binds / enrols devices and resets PINs (dispatcher).
   - FR-68 handover act with scan: the driver scans the SSCCs in the app (Handover scan), the partner confirms receipt in the partner
     portal (Handover acceptance); a missing / damaged / unexpected package opens a deviation. Shown on the trip and in Partners.
   - FR-188 customer notifications: SMS / e-mail by default; WhatsApp / Telegram only with the customer's consent AND the legal
     approval switch (off by default, four eyes); templates in 4 languages; delivery log (Settings → Customer notifications). */
(function () {
  const Q = S.r5;
  const { card, tk, AUD, clock } = R5;
  const drvId = () => S.da.drv || (S.drivers.find(d => d.id === 'd4') || S.drivers[0]).id;
  const canPin = () => canDo('drivers:write') || canDo('trips:write');

  /* ---------- FR-70 / I-18 · PIN login, MDM, device binding, lockout ---------- */
  const DV = (dev, model, mdm, pin, sess) => ({ dev, model, mdm, bound: !!dev, pin, temp: false, fails: 0, locked: false, sess, last: sess ? '06:1' + (dev.length % 10) : '' });
  Q.pin = {
    d1: DV('MDM-ZB-0141', 'Zebra TC58', 'ok', '4826', true), d2: DV('MDM-ZB-0142', 'Zebra TC58', 'ok', '3917', true), d3: DV('', '', 'none', '', false),
    d4: DV('MDM-SG-0170', 'Samsung Galaxy XCover 6 Pro', 'ok', '5402', true), d5: DV('MDM-SG-0171', 'Samsung Galaxy XCover 6 Pro', 'ok', '8150', true),
    d6: DV('MDM-SG-0177', 'Samsung Galaxy XCover 6 Pro', 'bad', '1735', false), d7: DV('MDM-ZB-0145', 'Zebra TC58', 'ok', '2694', true),
  };
  Q.pinMsg = ''; Q.pinShown = null; Q.nextPin = 0;
  const TMP = ['5173', '9042', '2268', '7731', '4405', '6619', '3087', '8524'];
  const MDM = { ok: ['green', T('соответствует', 'konform', 'compliant', 'сәйкес')], bad: ['red', T('не соответствует · патч ОС', 'nicht konform · OS-Patch', 'non-compliant · OS patch', 'сәйкес емес · ОЖ патчы')], none: ['gray', T('не зарегистрировано', 'nicht registriert', 'not enrolled', 'тіркелмеген')] };
  const pinOf = id => Q.pin[id];
  const pinState = s => !s ? 'in' : s.locked ? 'locked' : s.sess ? 'in' : 'out';
  const PST = { in: ['green', T('вход выполнен', 'angemeldet', 'signed in', 'кірді')], out: ['gray', T('не в системе', 'abgemeldet', 'signed out', 'шықты')], locked: ['red', T('заблокировано (5 попыток)', 'gesperrt (5 Versuche)', 'locked (5 tries)', 'бұғатталды (5 әрекет)')] };
  /* the device check before the PIN: bound to this driver, enrolled and compliant in MDM, not locked */
  const devBlock = s => !s.bound ? T('Устройство не привязано к водителю — обратитесь к диспетчеру', 'Gerät ist dem Fahrer nicht zugeordnet — Disposition kontaktieren', 'Device not bound to the driver — contact dispatch', 'Құрылғы жүргізушіге байланбаған — диспетчерге хабарласыңыз')
    : s.mdm !== 'ok' ? T('Устройство не соответствует политике MDM — вход запрещён', 'Gerät verletzt die MDM-Richtlinie — Anmeldung gesperrt', 'Device violates the MDM policy — sign-in blocked', 'Құрылғы MDM саясатына сай емес — кіруге тыйым')
      : s.locked ? T('ПИН заблокирован после 5 неверных попыток — диспетчер сбрасывает ПИН', 'PIN nach 5 Fehlversuchen gesperrt — Disposition setzt die PIN zurück', 'PIN locked after 5 wrong tries — dispatch resets the PIN', 'ПИН 5 қате әрекеттен кейін бұғатталды — диспетчер қалпына келтіреді') : '';
  globalThis.pinLogin = (id, pin) => {
    const s = pinOf(id); if (!s) return null; const b = devBlock(s); if (b) return b;
    if (String(pin || '') === s.pin) { s.sess = true; s.fails = 0; s.last = clock(); const tmp = s.temp; s.temp = false; AUD('Driver app', id, 'PIN login' + (tmp ? ' (temporary PIN, new PIN required)' : ''), s.dev); return null; }
    s.fails++; if (s.fails >= 5) { s.locked = true; s.sess = false; AUD('Driver app', id, 'PIN locked after 5 wrong tries', s.dev); return devBlock(s); }
    AUD('Driver app', id, 'Wrong PIN ' + s.fails + '/5', s.dev);
    return T('Неверный ПИН · попытка ', 'Falsche PIN · Versuch ', 'Wrong PIN · try ', 'ПИН қате · әрекет ') + s.fails + ' / 5';
  };
  const pinStrip = id => { const s = pinOf(id); if (!s) return ''; return `<div class="tinted-row green" data-pin-strip="${id}" style="margin-bottom:var(--gap)"><span style="flex:1">🔒 ${esc(T('Вход по ПИН', 'PIN-Anmeldung', 'PIN sign-in', 'ПИН арқылы кіру'))} · ${esc(drv(id).name)} · ${esc(s.model)} ${s.dev} · MDM ${chip(MDM[s.mdm][0], MDM[s.mdm][1])} · ${esc(T('с ', 'seit ', 'since ', ''))}${s.last}</span><button class="btn sm grey" data-act="r5PinOut" data-id="${id}">${esc(T('Выйти', 'Abmelden', 'Sign out', 'Шығу'))}</button></div>`; };
  function lockView(id, admin) {
    const s = pinOf(id), d = drv(id), b = devBlock(s);
    const phone = `<div class="da-phone" data-pin-lock="${id}"><div class="da-status"><span>${clock()}</span><span>🔒 MDM</span></div><div class="da-body" style="min-height:420px;align-content:center">
<div class="da-head" style="text-align:center"><span class="cap">kökzhol · ${esc(T('приложение водителя', 'Fahrer-App', 'driver app', 'жүргізуші қосымшасы'))}</span><span class="ttl">${esc(d.name)}</span><span class="da-sub">${s.bound ? esc(s.model) + ' · ' + s.dev : esc(T('устройство не привязано', 'kein Gerät zugeordnet', 'no device bound', 'құрылғы байланбаған'))}</span></div>
<div class="da-card"><span class="da-cap">MDM</span>${chip(MDM[s.mdm][0], MDM[s.mdm][1])}${b ? `<div class="da-bad" data-pin-block>${esc(b)}</div>` : ''}
<label class="da-sub">${esc(T('ПИН (4 цифры)', 'PIN (4 Ziffern)', 'PIN (4 digits)', 'ПИН (4 цифр)'))}<input class="da-in" id="r5_pin" type="password" inputmode="numeric" maxlength="6" autocomplete="off"${b ? ' disabled' : ''}></label>
<button class="da-main" data-act="r5PinIn" data-id="${id}"${b ? ' disabled' : ''}>${esc(T('Войти', 'Anmelden', 'Sign in', 'Кіру'))}</button>
<span class="da-sub">${esc(T('Неверных попыток: ', 'Fehlversuche: ', 'Wrong tries: ', 'Қате әрекеттер: '))}${s.fails} / 5</span>${Q.pinMsg ? `<span class="da-bad" id="r5_pinmsg">${esc(Q.pinMsg)}</span>` : ''}</div></div></div>`;
    const side = `<div>${admin ? `<div class="card card-body" style="margin-bottom:var(--gap)"><label class="fl" style="margin:0">${esc(T('Водитель (вход в приложение)', 'Fahrer (App-Anmeldung)', 'Driver (signed in)', 'Жүргізуші (қосымшаға кіру)'))}<select class="select" id="da_drv">${S.drivers.map(x => `<option value="${x.id}"${x.id === id ? ' selected' : ''}>${esc(x.name)} · ${esc(PST[pinState(pinOf(x.id))][1])}</option>`).join('')}</select></label></div>` : ''}${card(T('Вход по ПИН на управляемом устройстве', 'PIN-Anmeldung auf verwaltetem Gerät', 'PIN sign-in on a managed device', 'Басқарылатын құрылғыда ПИН арқылы кіру'), howNote('pinMdm'))}</div>`;
    return `<div class="da-wrap">${phone}${side}</div>`;
  }
  const gateOr = (fn, admin) => { const id = drvId(), s = pinOf(id); return !s || s.sess ? pinStrip(id) + fn() : lockView(id, admin); };
  { const sc = SCREENS.driverapp, b0 = sc.body; sc.body = () => gateOr(b0, S.role !== 'driver'); }
  { const t = (SCREENS.drivers.tabs || []).find(x => x.key === 'app'); if (t) { const b0 = t.body; t.body = () => gateOr(b0, true); } }

  function pinAdmin() {
    const can = canPin();
    const rows = S.drivers.map(d => { const s = pinOf(d.id); if (!s) return ''; const st = pinState(s);
      const acts = !can ? '' : [s.mdm === 'none' ? `<button class="btn sm grey" data-act="r5MdmEnrol" data-id="${d.id}">${esc(T('Зарегистрировать в MDM', 'In MDM registrieren', 'Enrol in MDM', 'MDM-ге тіркеу'))}</button>` : '',
        s.mdm === 'bad' ? `<button class="btn sm grey" data-act="r5MdmCheck" data-id="${d.id}">${esc(T('Перепроверить MDM', 'MDM neu prüfen', 'Re-check MDM', 'MDM қайта тексеру'))}</button>` : '',
        s.mdm !== 'none' ? (s.bound ? `<button class="btn sm grey" data-act="r5PinUnbind" data-id="${d.id}">${esc(T('Отвязать', 'Lösen', 'Unbind', 'Ажырату'))}</button>` : `<button class="btn sm grey" data-act="r5PinBind" data-id="${d.id}">${esc(T('Привязать', 'Zuordnen', 'Bind', 'Байлау'))}</button>`) : '',
        s.bound ? `<button class="btn sm primary" data-act="r5PinReset" data-id="${d.id}">${esc(T('Сбросить ПИН', 'PIN zurücksetzen', 'Reset PIN', 'ПИН қалпына келтіру'))}</button>` : '',
        s.sess ? `<button class="btn sm grey" data-act="r5PinOut" data-id="${d.id}">${esc(T('Завершить сеанс', 'Sitzung beenden', 'End session', 'Сеансты аяқтау'))}</button>` : ''].join('');
      return `<tr data-pin-row="${d.id}"><td><b>${esc(d.name)}</b><div class="sub">${d.code}</div></td><td>${s.dev ? esc(s.model) + '<div class="sub">' + s.dev + '</div>' : '<span class="faint">—</span>'}</td><td>${chip(MDM[s.mdm][0], MDM[s.mdm][1])}</td><td>${s.bound ? chip('green', T('привязано', 'zugeordnet', 'bound', 'байланған')) : chip('gray', T('нет', 'nein', 'no', 'жоқ'))}</td><td>${s.pin ? (s.temp ? chip('yellow', T('временный', 'temporär', 'temporary', 'уақытша')) : chip('green', T('задан', 'gesetzt', 'set', 'берілген'))) : chip('gray', '—')}</td><td>${s.fails} / 5</td><td>${chip(PST[st][0], PST[st][1])}</td><td><div class="actbar">${acts}</div></td></tr>`; }).join('');
    const shown = Q.pinShown ? `<div class="tinted-row yellow" data-pin-shown="${Q.pinShown.id}"><span style="flex:1"><b>${esc(T('Временный ПИН для ', 'Temporäre PIN für ', 'Temporary PIN for ', 'Уақытша ПИН: '))}${esc(drv(Q.pinShown.id).name)}: ${Q.pinShown.pin}</b><div class="sub">${esc(T('Показан один раз; отправлен водителю по SMS (симуляция); при входе нужно задать новый ПИН.', 'Wird einmal angezeigt; per SMS an den Fahrer (Simulation); bei der Anmeldung ist eine neue PIN zu setzen.', 'Shown once; sent to the driver by SMS (simulation); a new PIN must be set at sign-in.', 'Бір рет көрсетіледі; жүргізушіге SMS-пен жіберілді (симуляция).'))}</div></span><button class="btn sm grey" data-act="r5PinHide">${esc(T('Скрыть', 'Ausblenden', 'Hide', 'Жасыру'))}</button></div>` : '';
    const st = k => S.drivers.filter(d => pinState(pinOf(d.id)) === k).length;
    return `<div class="kpi-row k4">${tk('green', 'user', st('in'), PST.in[1])}${tk('blue', 'user', st('out'), PST.out[1])}${tk('red', 'alert', st('locked'), T('Заблокировано', 'Gesperrt', 'Locked', 'Бұғатталған'))}${tk('yellow', 'cog', S.drivers.filter(d => pinOf(d.id) && pinOf(d.id).mdm !== 'ok').length, T('Устройства вне MDM', 'Geräte außerhalb MDM', 'Devices outside MDM', 'MDM-нен тыс құрылғылар'))}</div>
${howNote('pinMdm')}${shown}<div class="card tcard" id="r5_pinadm"><table class="table"><thead><tr><th>${esc(T('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'))}</th><th>${esc(T('Устройство', 'Gerät', 'Device', 'Құрылғы'))}</th><th>MDM</th><th>${esc(T('Привязка', 'Zuordnung', 'Binding', 'Байлау'))}</th><th>${esc(T('ПИН', 'PIN', 'PIN', 'ПИН'))}</th><th>${esc(T('Ошибки', 'Fehler', 'Fails', 'Қателер'))}</th><th>${esc(T('Статус', 'Status', 'Status', 'Күйі'))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  addTab('drivers', 'daadmin', T('Приложение: устройства и ПИН', 'App: Geräte und PIN', 'Driver app admin', 'Қосымша: құрылғылар мен ПИН'), () => pinAdmin(), { perm: 'drivers:read', badge: () => S.drivers.filter(d => pinState(pinOf(d.id)) === 'locked').length || '' });
  const pinAct = (d, fn, what) => { const s = pinOf(d.id); if (!s) return; if (!canPin()) return toast(T('Нет права: диспетчер или администратор', 'Kein Recht: Disposition oder Administrator', 'No permission: dispatcher or administrator', 'Құқық жоқ'), 'err'); fn(s); AUD('Driver app', d.id, what, s.dev); render(); };
  Object.assign(ACT, {
    r5PinIn: d => { const e = pinLogin(d.id, ($('#r5_pin') || {}).value); Q.pinMsg = e || ''; if (!e) toast(T('Вход выполнен', 'Angemeldet', 'Signed in', 'Кірдіңіз')); else render(); },
    r5PinOut: d => { const s = pinOf(d.id); if (!s) return; s.sess = false; Q.pinMsg = ''; AUD('Driver app', d.id, 'Session ended', s.dev); render(); },
    r5PinReset: d => pinAct(d, s => { s.pin = TMP[Q.nextPin++ % TMP.length]; s.temp = true; s.fails = 0; s.locked = false; s.sess = false; Q.pinShown = { id: d.id, pin: s.pin }; Q.pinMsg = ''; }, 'PIN reset (temporary PIN by SMS)'),
    r5PinBind: d => pinAct(d, s => { s.bound = true; }, 'Device bound'),
    r5PinUnbind: d => pinAct(d, s => { s.bound = false; s.sess = false; }, 'Device unbound'),
    r5MdmEnrol: d => pinAct(d, s => { s.mdm = 'ok'; s.dev = 'MDM-ZB-0' + (150 + S.drivers.findIndex(x => x.id === d.id)); s.model = 'Zebra TC58'; s.bound = true; }, 'Enrolled in MDM'),
    r5MdmCheck: d => pinAct(d, s => { s.mdm = 'ok'; }, 'MDM re-check: compliant'),
    r5PinHide: () => { Q.pinShown = null; render(); },
  });

  /* ---------- FR-68 / I-17 · handover act with scan: driver scans, partner confirms, discrepancy → deviation ---------- */
  Q.acts = []; Q.nextAct = 1; Q.hsSel = {};
  const sscc = (l, i) => (globalThis.ssccOf ? ssccOf(l, i) : '00' + '4870' + l.id.replace(/\D/g, '').padStart(9, '0').slice(-9) + String(i + 1).padStart(4, '0') + '0');
  const pName = id => ((S.partners || []).find(p => p.id === id) || { name: id }).name;
  const mkAct = (l, pid, items, at, ho) => { const a = { id: 'HA-' + String(Q.nextAct++).padStart(3, '0'), load: l.id, p: pid, items, at, ho: ho || '', scanned: [], extra: [], rcv: {}, st: 'scan', created: clock() }; Q.acts.push(a); return a; };
  { const l = load('LD-2026-001847'); if (l) mkAct(l, 'PL-01', [20, 21, 22, 23].filter(i => i < l.pallets).map(i => sscc(l, i)), 'KAR'); }
  const ASTL = { scan: ['blue', T('водитель сканирует', 'Fahrer scannt', 'driver scanning', 'жүргізуші сканерлейді')], sent: ['yellow', T('ждёт партнёра', 'wartet auf Partner', 'awaiting partner', 'серіктесті күтеді')], confirmed: ['green', T('принято без расхождений', 'ohne Abweichung angenommen', 'accepted, no discrepancy', 'айырмашылықсыз қабылданды')], discrepancy: ['red', T('расхождение → отклонение', 'Abweichung → Abweichungsfall', 'discrepancy → deviation', 'айырмашылық → ауытқу')] };
  const RCV = { ok: T('получено', 'erhalten', 'received', 'алынды'), missing: T('не получено', 'fehlt', 'missing', 'жоқ'), damaged: T('повреждено', 'beschädigt', 'damaged', 'зақымданған') };
  const actOf = id => Q.acts.find(a => a.id === id);
  const atName = a => (HUBS[a.at] ? HUBS[a.at].city : a.at);
  const actLine = a => `${a.id} · ${a.load} → ${esc(pName(a.p))} · ${esc(T('точка: ', 'Ort: ', 'at: ', 'нүкте: '))}${esc(atName(a))} · ${esc(T('сканировано ', 'gescannt ', 'scanned ', 'сканерленді '))}${a.scanned.length}/${a.items.length}${a.extra.length ? ' · ' + esc(T('лишние: ', 'unerwartet: ', 'unexpected: ', 'артық: ')) + a.extra.length : ''}`;
  const discOf = a => { const out = []; a.items.forEach(s => { const r = a.rcv[s] || (a.scanned.includes(s) ? 'ok' : 'missing'); if (!a.scanned.includes(s)) out.push([s, T('водитель не отсканировал', 'vom Fahrer nicht gescannt', 'not scanned by the driver', 'жүргізуші сканерлемеді')]); else if (r !== 'ok') out.push([s, RCV[r]]); }); a.extra.forEach(s => out.push([s, T('лишнее место (нет в акте)', 'unerwartetes Packstück (nicht im Protokoll)', 'unexpected package (not in the act)', 'артық орын (актіде жоқ)')])); return out; };
  globalThis.hsScan = (id, code) => {
    const a = actOf(id), c = String(code || '').replace(/\D/g, ''); if (!a || a.st !== 'scan') return T('Акт не в режиме сканирования', 'Protokoll nicht im Scanmodus', 'Act is not in scan mode', 'Акт сканерлеу режимінде емес');
    if (!/^\d{18,20}$/.test(c)) return T('SSCC: 18 цифр', 'SSCC: 18 Ziffern', 'SSCC: 18 digits', 'SSCC: 18 цифр');
    const s = a.items.find(x => x.slice(-18) === c.slice(-18));
    if (!s) { if (!a.extra.includes(c)) a.extra.push(c); return T('Место не входит в акт передачи', 'Packstück gehört nicht zum Übergabeprotokoll', 'Package is not part of the handover act', 'Орын тапсыру актісіне кірмейді'); }
    if (a.scanned.includes(s)) return T('Уже отсканировано', 'Schon gescannt', 'Already scanned', 'Сканерленген'); a.scanned.push(s); return null;
  };
  globalThis.hsConfirm = id => {
    const a = actOf(id); if (!a || a.st !== 'sent') return T('Акт не ожидает подтверждения', 'Protokoll wartet nicht auf Bestätigung', 'Act is not awaiting confirmation', 'Акт растауды күтпейді');
    const l = load(a.load), disc = discOf(a); a.partnerAt = clock(); a.disc = disc;
    if (!disc.length) { a.st = 'confirmed'; l.notes.push({ who: pName(a.p), t: a.partnerAt, text: T('Передача принята без расхождений: ', 'Übergabe ohne Abweichung angenommen: ', 'Handover accepted, no discrepancy: ', 'Тапсыру айырмашылықсыз қабылданды: ') + a.id + ' · ' + a.items.length + ' SSCC' }); AUD('Partners', a.id, 'Handover confirmed by partner', a.p); return null; }
    a.st = 'discrepancy';
    const dv = openDeviation(l, T('Расхождение при передаче партнёру ', 'Abweichung bei Übergabe an Partner ', 'Discrepancy at partner handover ', 'Серіктеске тапсырудағы айырмашылық ') + a.id + ' · ' + disc.length + ' SSCC', l.id + ' · ' + pName(a.p) + ' · ' + disc.map(x => '…' + x[0].slice(-6) + ' ' + x[1]).join('; '));
    if (dv) { if (dv.step == null || dv.step < 1) dv.lvl = 2; a.dev = dv.id; }
    l.notes.push({ who: pName(a.p), t: a.partnerAt, text: T('Расхождение при передаче ', 'Abweichung bei Übergabe ', 'Handover discrepancy ', 'Тапсырудағы айырмашылық ') + a.id + ': ' + disc.length + ' SSCC → ' + (a.dev || '') });
    AUD('Partners', a.id, 'Handover discrepancy → ' + (a.dev || ''), disc.length + ' SSCC'); return null;
  };
  Object.assign(R5, { actOf, discOf });

  /* driver app screen: scan the packages of the act */
  function hsDriver() {
    const id = drvId(), mine = Q.acts.filter(a => load(a.load) && load(a.load).driver === id && a.st !== 'confirmed');
    const body = mine.map(a => { const l = load(a.load);
      return `<div class="da-card" data-hs-drv="${a.id}"><span class="da-cap">${a.id} · ${esc(T('передача партнёру', 'Übergabe an Partner', 'handover to partner', 'серіктеске тапсыру'))}</span><b>${esc(pName(a.p))}</b><span class="da-sub">${l.id} · ${esc(T('точка: ', 'Ort: ', 'at: ', 'нүкте: '))}${esc(atName(a))} · ${chip(ASTL[a.st][0], ASTL[a.st][1])}</span>
${a.items.map(s => `<div class="da-row" data-hs-item="${s}"><span style="font-family:monospace;font-size:11px">${s}</span>${a.scanned.includes(s) ? '<span class="da-ok">✓</span>' : '<span class="da-sub">—</span>'}</div>`).join('')}
${a.extra.map(s => `<div class="da-row"><span style="font-family:monospace;font-size:11px">${s}</span><span class="da-bad">${esc(T('лишнее', 'unerwartet', 'unexpected', 'артық'))}</span></div>`).join('')}
${a.st === 'scan' ? `<input class="da-in" id="r5_sscc_${a.id}" placeholder="SSCC" inputmode="numeric"><div class="da-grid2"><button class="da-ghost" data-act="r5HsScan" data-id="${a.id}">${esc(T('Скан', 'Scan', 'Scan', 'Скан'))}</button><button class="da-ghost" data-act="r5HsNext" data-id="${a.id}">📷 ${esc(T('Камера: следующее', 'Kamera: nächstes', 'Camera: next', 'Камера: келесі'))}</button></div>
<button class="da-main" data-act="r5HsSend" data-id="${a.id}">${esc(T('Передать партнёру', 'An Partner übergeben', 'Hand over to partner', 'Серіктеске тапсыру'))} · ${a.scanned.length}/${a.items.length}</button>` : `<span class="da-sub">${esc(T('Передано ', 'Übergeben ', 'Handed over ', 'Тапсырылды '))}${a.drvAt || ''}${a.dev ? ' · ' + a.dev : ''}</span>`}</div>`; }).join('');
    const phone = `<div class="da-phone"><div class="da-status"><span>${clock()}</span><span>${esc(drv(id).name)}</span></div><div class="da-body"><div class="da-head"><span class="cap">${esc(T('Передача со сканом', 'Übergabe mit Scan', 'Handover with scan', 'Сканмен тапсыру'))}</span><span class="ttl">${mine.length} ${esc(T('акт(ов)', 'Protokoll(e)', 'act(s)', 'акт'))}</span></div>${body || `<div class="da-card"><span class="da-sub">${esc(T('Нет передач партнёру для вашего рейса.', 'Keine Übergaben an Partner für Ihre Fahrt.', 'No partner handovers for your trip.', 'Рейсіңізге тапсырулар жоқ.'))}</span></div>`}</div></div>`;
    return `<div class="da-wrap">${phone}<div>${card(T('Акт передачи со сканом (FR-68)', 'Übergabeprotokoll mit Scan (FR-68)', 'Handover act with scan (FR-68)', 'Сканмен тапсыру актісі (FR-68)'), howNote('hoScan'))}</div></div>`;
  }
  SHELL_NAV.driver.push(['dahand', 'package', T('Передача партнёру', 'Übergabe an Partner', 'Partner handover', 'Серіктеске тапсыру'), 0]);
  SCREENS.dahand = { title: () => T('Передача партнёру со сканом', 'Übergabe an Partner mit Scan', 'Partner handover with scan', 'Серіктеске сканмен тапсыру'), sub: () => T('Каждое место SSCC сканируется перед передачей', 'Jedes SSCC-Packstück wird vor der Übergabe gescannt', 'Every SSCC package is scanned before the handover', 'Әр SSCC орны тапсыру алдында сканерленеді'), body: () => gateOr(hsDriver, S.role !== 'driver') };

  /* partner portal screen: confirm receipt per package; backhaul bids */
  function hsPartner() {
    const mine = Q.acts.filter(a => a.p === S.partnerId);
    const open = mine.filter(a => a.st === 'sent').map(a => `<div class="card card-body" data-hs-p="${a.id}" style="margin-bottom:var(--gap)">${R5.H3(a.id + ' · ' + a.load)}<p class="sub">${esc(drv(load(a.load).driver).name)} · ${esc(T('передано ', 'übergeben ', 'handed over ', 'тапсырылды '))}${a.drvAt} · ${esc(atName(a))}</p>
${a.items.map(s => `<div class="tinted-row ${a.scanned.includes(s) ? 'green' : 'yellow'}" data-hs-pitem="${s}"><span style="flex:1;font-family:monospace;font-size:12px">${s}<div class="sub" style="font-family:inherit">${a.scanned.includes(s) ? esc(T('отсканировано водителем', 'vom Fahrer gescannt', 'scanned by the driver', 'жүргізуші сканерледі')) : esc(T('водитель не отсканировал', 'vom Fahrer nicht gescannt', 'not scanned by the driver', 'жүргізуші сканерлемеді'))}</div></span><select class="select" data-r5rcv="${a.id}|${s}" style="width:auto">${Object.keys(RCV).map(k => `<option value="${k}"${(a.rcv[s] || (a.scanned.includes(s) ? 'ok' : 'missing')) === k ? ' selected' : ''}>${esc(RCV[k])}</option>`).join('')}</select></div>`).join('')}
${a.extra.length ? `<p class="note">${esc(T('Лишние места от водителя: ', 'Unerwartete Packstücke vom Fahrer: ', 'Unexpected packages from the driver: ', 'Жүргізушіден артық орындар: '))}${a.extra.join(', ')}</p>` : ''}<button class="btn primary" data-act="r5HsConfirm" data-id="${a.id}">${esc(T('Подтвердить приёмку', 'Annahme bestätigen', 'Confirm receipt', 'Қабылдауды растау'))}</button></div>`).join('');
    const done = mine.filter(a => a.st === 'confirmed' || a.st === 'discrepancy').map(a => `<div class="tinted-row ${a.st === 'confirmed' ? 'green' : 'red'}" data-hs-done="${a.id}"><span style="flex:1"><b>${actLine(a)}</b><div class="sub">${a.partnerAt || ''}${a.dev ? ' · ' + a.dev : ''}</div></span>${chip(ASTL[a.st][0], ASTL[a.st][1])}</div>`).join('');
    const wait = mine.filter(a => a.st === 'scan').map(a => `<div class="tinted-row blue"><span style="flex:1">${actLine(a)}</span>${chip(ASTL.scan[0], ASTL.scan[1])}</div>`).join('');
    return `${howNote('hoScan')}<div class="grid2 eq"><div>${open || card(T('Приёмка по скану', 'Annahme per Scan', 'Receipt by scan', 'Скан бойынша қабылдау'), `<p class="note">${esc(T('Нет передач, ожидающих подтверждения.', 'Keine Übergaben zur Bestätigung.', 'No handovers awaiting confirmation.', 'Растауды күтетін тапсырулар жоқ.'))}</p>`)}${wait || done ? card(T('Остальные акты', 'Weitere Protokolle', 'Other acts', 'Басқа актілер'), wait + done) : ''}</div>
<div>${card(T('Биржа обратной загрузки: ставка партнёра', 'Rückladungsbörse: Partnergebot', 'Backhaul exchange: partner bid', 'Кері жүктеу биржасы: серіктес ұсынысы'), howNote('backhaul') + R5.bhPartner(S.partnerId))}</div></div>`;
  }
  SHELL_NAV.partner.push(['phscan', 'package', T('Приёмка по скану и биржа', 'Annahme per Scan und Börse', 'Scan receipt and exchange', 'Скан қабылдау және биржа'), 0]);
  SCREENS.phscan = { title: () => T('Приёмка передачи по скану', 'Übernahme per Scan', 'Handover receipt by scan', 'Тапсыруды скан бойынша қабылдау'), sub: () => T('Подтверждение каждого места SSCC; расхождение создаёт отклонение', 'Bestätigung je SSCC-Packstück; eine Abweichung erzeugt einen Abweichungsfall', 'Confirmation per SSCC package; a discrepancy raises a deviation', 'Әр SSCC орнын растау; айырмашылық ауытқу тудырады'), body: () => hsPartner() };

  /* Dispatch → Partners: acts list + create an act from an approved handover */
  const pb0 = globalThis.partnersBody;
  globalThis.partnersBody = () => {
    const can = canDo('partners:write') || canDo('trips:write');
    const free = (S.handovers || []).filter(h => h.st === 'approved' && !Q.acts.some(a => a.ho === h.id));
    const rows = Q.acts.map(a => `<div class="tinted-row ${ASTL[a.st][0] === 'red' ? 'red' : ASTL[a.st][0] === 'green' ? 'green' : 'blue'}" data-hs-row="${a.id}"><span style="flex:1"><b>${actLine(a)}</b>${a.disc && a.disc.length ? `<div class="sub">${a.disc.map(x => '…' + x[0].slice(-6) + ' ' + esc(x[1])).join(' · ')}</div>` : ''}</span>${chip(ASTL[a.st][0], ASTL[a.st][1])}${a.dev ? ` <a class="lnk" data-act="ptQ">${a.dev}</a>` : ''}</div>`).join('');
    const mk = free.map(h => `<button class="btn sm grey" data-act="r5HsMk" data-id="${h.id}"${can ? '' : ' disabled'}>${esc(T('Акт со сканом для ', 'Scan-Protokoll für ', 'Scan act for ', 'Скан актісі: '))}${h.id}</button>`).join('');
    return pb0() + `<div class="card card-body" id="r5_hsacts" style="margin-top:var(--gap)">${R5.H3(T('Передачи со сканом: водитель → партнёр (FR-68)', 'Übergaben mit Scan: Fahrer → Partner (FR-68)', 'Handovers with scan: driver → partner (FR-68)', 'Сканмен тапсыру: жүргізуші → серіктес (FR-68)'))}${howNote('hoScan')}${rows}${mk ? `<div class="actbar" style="margin-top:8px">${mk}</div>` : ''}</div>`;
  };
  /* the trip (load drawer, overview): handover acts and the recipient */
  const ld0 = DRAWERS.load;
  DRAWERS.load = d => {
    const r = ld0(d), l = load(d.id); if (!l || d.tab !== 'overview') return r;
    const acts = Q.acts.filter(a => a.load === l.id), p = l.recipient ? R5.ptOf(l.recipient) : null, bh = l.backhaul;
    let add = '';
    if (acts.length) add += `<div class="drawer-section" data-trip-hs="${l.id}"><h4>${esc(T('Передача партнёру со сканом', 'Übergabe an Partner mit Scan', 'Partner handover with scan', 'Серіктеске сканмен тапсыру'))}</h4>${acts.map(a => `<div class="tinted-row ${ASTL[a.st][0] === 'red' ? 'red' : ASTL[a.st][0] === 'green' ? 'green' : 'blue'}"><span style="flex:1">${actLine(a)}${a.dev ? ' · ' + a.dev : ''}</span>${chip(ASTL[a.st][0], ASTL[a.st][1])}</div>`).join('')}</div>`;
    if (p) add += `<div class="drawer-section" data-trip-rcp="${p.id}"><h4>${esc(T('Получатель', 'Empfänger', 'Recipient', 'Алушы'))}</h4><p class="sub">${p.id} · ${esc(R5.ptName(p))} · ${esc(R5.ptAddr(p))} · ${esc(R5.labOf(p.lab).n)}</p></div>`;
    if (bh) add += `<div class="drawer-section" data-trip-bh="${bh.leg}"><h4>${esc(T('Обратная загрузка', 'Rückladung', 'Backhaul', 'Кері жүктеу'))}</h4><p class="sub">${bh.leg} · ${esc(T('обратное плечо рейса ', 'Rückfahrt von ', 'return leg of ', 'кері иық: '))}${bh.out} · ${esc(trk(bh.truck).plate)} · ${esc(T('выручка ', 'Erlös ', 'revenue ', 'түсім '))}${kzt(bh.price)}</p></div>`;
    return add ? Object.assign({}, r, { html: r.html + add }) : r;
  };
  Object.assign(ACT, {
    r5HsScan: d => { const e = hsScan(d.id, ($('#r5_sscc_' + d.id) || {}).value); if (e) toast(e, 'err'); else render(); },
    r5HsNext: d => { const a = actOf(d.id); if (!a) return; const s = a.items.find(x => !a.scanned.includes(x)); if (!s) return toast(T('Все места отсканированы', 'Alle Packstücke gescannt', 'All packages scanned', 'Барлық орын сканерленді')); hsScan(d.id, s); render(); },
    r5HsSend: d => { const a = actOf(d.id); if (!a || a.st !== 'scan') return; if (!a.scanned.length) return toast(T('Сначала отсканируйте места', 'Erst Packstücke scannen', 'Scan the packages first', 'Алдымен орындарды сканерлеңіз'), 'err'); a.st = 'sent'; a.drvAt = clock(); const l = load(a.load); l.notes.push({ who: drv(l.driver).name, t: a.drvAt, text: T('Передано партнёру со сканом: ', 'Mit Scan an Partner übergeben: ', 'Handed to partner with scan: ', 'Серіктеске сканмен тапсырылды: ') + a.id + ' · ' + a.scanned.length + '/' + a.items.length + ' SSCC' }); AUD('Driver app', a.id, 'Handover scanned ' + a.scanned.length + '/' + a.items.length, a.p); toast(T('Акт отправлен партнёру', 'Protokoll an Partner gesendet', 'Act sent to the partner', 'Акт серіктеске жіберілді')); },
    r5HsConfirm: d => { const e = hsConfirm(d.id); if (e) return toast(e, 'err'); const a = actOf(d.id); toast(a.st === 'confirmed' ? T('Приёмка подтверждена', 'Annahme bestätigt', 'Receipt confirmed', 'Қабылдау расталды') : T('Расхождение: создано отклонение ', 'Abweichung: Abweichungsfall ', 'Discrepancy: deviation ', 'Айырмашылық: ауытқу ') + (a.dev || ''), a.st === 'confirmed' ? 'ok' : 'err'); },
    r5HsMk: d => { const h = (S.handovers || []).find(x => x.id === d.id), l = h && load(h.load); if (!l) return; const items = h.mode === 'part' && h.items.length ? h.items.slice() : Array.from({ length: l.pallets }, (_, i) => sscc(l, i)); const a = mkAct(l, h.p, items, l.from, h.id); AUD('Partners', a.id, 'Scan act created for ' + h.id); render(); },
  });
  document.addEventListener('change', e => { const v = e.target.dataset && e.target.dataset.r5rcv; if (!v) return; const [id, s] = v.split('|'), a = actOf(id); if (a) { a.rcv[s] = e.target.value; render(); } });

  /* ---------- FR-188 / I-11 · customer notifications: SMS / e-mail default, WhatsApp / Telegram gated ---------- */
  const N = Q.ntf = { legal: { on: false, req: null, ok: null }, consent: { c1: { wa: { at: '2026-09-12', src: 'portal' } }, c3: { tg: { at: '2026-10-02', src: 'contract' } } }, lang: { c1: 'ru', c2: 'kk', c3: 'en', c4: 'ru', c5: 'de' }, log: [], prev: LANG };
  const CH = { sms: 'SMS', email: T('E-mail', 'E-Mail', 'E-mail', 'E-mail'), wa: 'WhatsApp', tg: 'Telegram' };
  const EVT = { pickup: T('Груз забран', 'Abgeholt', 'Picked up', 'Жүк алынды'), eta: T('ETA', 'ETA', 'ETA', 'ETA'), delay: T('Задержка', 'Verspätung', 'Delay', 'Кешігу'), delivered: T('Доставлено', 'Zugestellt', 'Delivered', 'Жеткізілді') };
  const TPL = {
    pickup: ['Kökzhol: заказ {id} забран и едет в {city}. Ожидаемое прибытие {eta}.', 'Kökzhol: Auftrag {id} wurde abgeholt und fährt nach {city}. Ankunft voraussichtlich {eta}.', 'Kökzhol: order {id} was picked up and is on its way to {city}. Expected arrival {eta}.', 'Kökzhol: {id} тапсырысы алынды, {city} қаласына бара жатыр. Келуі {eta}.'],
    eta: ['Kökzhol: заказ {id} прибудет в {city} {eta}.', 'Kökzhol: Auftrag {id} erreicht {city} am {eta}.', 'Kökzhol: order {id} will arrive in {city} at {eta}.', 'Kökzhol: {id} тапсырысы {city} қаласына {eta} жетеді.'],
    delay: ['Kökzhol: заказ {id} задерживается. Новое время прибытия {eta}; холодовая цепь под контролем.', 'Kökzhol: Auftrag {id} verspätet sich. Neue Ankunft {eta}; die Kühlkette wird überwacht.', 'Kökzhol: order {id} is delayed. New arrival {eta}; the cold chain is monitored.', 'Kökzhol: {id} тапсырысы кешігеді. Жаңа келу уақыты {eta}; суық тізбек бақылауда.'],
    delivered: ['Kökzhol: заказ {id} доставлен в {city}. Подтверждение доставки — в портале.', 'Kökzhol: Auftrag {id} wurde in {city} zugestellt. Lieferbestätigung im Portal.', 'Kökzhol: order {id} was delivered in {city}. Proof of delivery in the portal.', 'Kökzhol: {id} тапсырысы {city} қаласына жеткізілді. Растау — порталда.'],
  };
  const LIX = { ru: 0, de: 1, en: 2, kk: 3 };
  const fill = (evt, lang, l) => TPL[evt][LIX[lang]].replace('{id}', l.id).replace('{city}', HUBS[l.to].city).replace('{eta}', fdt(l.eta));
  const custs = () => CUSTOMERS.filter(c => !c.partner);
  globalThis.ntfChannels = cid => { const c = N.consent[cid] || {}; return ['sms', 'email'].concat(N.legal.on ? ['wa', 'tg'].filter(k => c[k]) : []); };
  globalThis.ntfSend = (l, evt) => { if (!l) return []; const chs = ntfChannels(l.cust), lang = N.lang[l.cust] || LANG, t = clock();
    const out = chs.map((ch, i) => ({ id: 'MSG-' + String(N.log.length + 1 + i).padStart(4, '0'), t, cust: l.cust, load: l.id, evt, ch, lang, st: ch === 'email' ? 'sent' : ch === 'wa' ? 'read' : 'delivered' }));
    N.log.unshift(...out.reverse()); N.log = N.log.slice(0, 200); return out; };
  HOOKS.status.push((l, was, st) => { const evt = { in_transit: was === 'problem' ? '' : 'pickup', delivered: 'delivered', problem: 'delay' }[st]; if (evt && CUSTOMERS.some(c => c.id === l.cust && !c.partner)) ntfSend(l, evt); });
  const canReq = () => canDo('crm:write') || canDo('approvals:sign');
  function notify() {
    const L = N.legal, st = L.on ? ['green', T('включено', 'aktiv', 'on', 'қосулы')] : L.req ? ['yellow', T('ждёт второй подписи', 'wartet auf 2. Freigabe', 'awaiting 2nd approval', '2-қолтаңбаны күтуде')] : ['gray', T('выключено (по умолчанию)', 'aus (Standard)', 'off (default)', 'өшірулі (әдепкі)')];
    const legal = `<div class="tinted-row ${st[0] === 'gray' ? 'gray' : st[0]}" id="r5_legal" data-legal="${L.on ? 'on' : L.req ? 'req' : 'off'}"><span style="flex:1"><b>${esc(T('Юридическое согласование мессенджеров', 'Rechtliche Freigabe der Messenger', 'Legal approval of messengers', 'Мессенджерлерді заңдық келісу'))}</b> ${chip(st[0], st[1])}<div class="sub">${L.req ? esc(T('запрос: ', 'Antrag: ', 'requested: ', 'сұрау: ')) + esc(ROLE_NAME[L.req.by]) + ' ' + L.req.at : ''}${L.on && L.ok ? ' · ' + esc(T('одобрил: ', 'freigegeben: ', 'approved: ', 'мақұлдады: ')) + esc(ROLE_NAME[L.ok.by]) + ' ' + L.ok.at : ''}</div></span>${!L.on && !L.req ? `<button class="btn sm primary" data-act="r5LegalReq"${canReq() ? '' : ' disabled'}>${esc(T('Запросить включение', 'Aktivierung beantragen', 'Request activation', 'Қосуды сұрау'))}</button>` : ''}${L.req && !L.on ? `<button class="btn sm green" data-act="r5LegalOk"${canDo('approvals:sign') ? '' : ' disabled'}>${esc(T('Одобрить (4 глаза)', 'Freigeben (4 Augen)', 'Approve (four eyes)', 'Мақұлдау (4 көз)'))}</button><button class="btn sm grey" data-act="r5LegalNo">${esc(T('Отклонить', 'Ablehnen', 'Reject', 'Қабылдамау'))}</button>` : ''}${L.on ? `<button class="btn sm grey" data-act="r5LegalOff"${canReq() ? '' : ' disabled'}>${esc(T('Выключить', 'Ausschalten', 'Switch off', 'Өшіру'))}</button>` : ''}</div>`;
    const yes = (c, k) => { const x = (N.consent[c.id] || {})[k]; return `<button class="btn sm ${x ? 'green' : 'grey'}" data-act="r5Consent" data-id="${c.id}" data-v="${k}" aria-pressed="${x ? 'true' : 'false'}">${x ? '✓ ' + fd(x.at) : esc(T('нет согласия', 'keine Einwilligung', 'no consent', 'келісім жоқ'))}</button>`; };
    const rows = custs().map(c => `<tr data-ntf-cust="${c.id}"><td><b>${esc(c.name)}</b></td><td>${(N.lang[c.id] || LANG).toUpperCase()}</td><td>${chip('green', 'SMS')} ${chip('green', CH.email)}</td><td>${yes(c, 'wa')}</td><td>${yes(c, 'tg')}</td><td data-ntf-ch="${ntfChannels(c.id).join(',')}">${ntfChannels(c.id).map(k => chip(k === 'wa' || k === 'tg' ? 'blue' : 'green', CH[k])).join(' ')}</td><td><button class="btn sm grey" data-act="r5NtfTest" data-id="${c.id}">${esc(T('Отправить ETA', 'ETA senden', 'Send ETA', 'ETA жіберу'))}</button></td></tr>`).join('');
    const sample = S.loads.find(l => isActive(l)) || S.loads[0];
    const tpl = Object.keys(TPL).map(k => `<tr><td><b>${esc(EVT[k])}</b></td><td>${esc(fill(k, N.prev, sample))}</td></tr>`).join('');
    const log = N.log.slice(0, 30).map(m => { const l = load(m.load); return `<tr data-msg="${m.id}"><td>${m.t}</td><td>${esc((CUSTOMERS.find(c => c.id === m.cust) || { name: m.cust }).name)}</td><td>${m.load}</td><td>${esc(EVT[m.evt])}</td><td>${chip(m.ch === 'wa' || m.ch === 'tg' ? 'blue' : 'green', CH[m.ch])}</td><td>${m.lang.toUpperCase()}</td><td>${chip(m.st === 'read' ? 'purple' : 'green', { sent: T('отправлено', 'gesendet', 'sent', 'жіберілді'), delivered: T('доставлено', 'zugestellt', 'delivered', 'жеткізілді'), read: T('прочитано', 'gelesen', 'read', 'оқылды') }[m.st])}</td><td class="sub">${l ? esc(fill(m.evt, LANG, l)) : ''}</td></tr>`; }).join('');
    return `${howNote('msgGate')}${legal}
<div class="card tcard" id="r5_consent" style="margin-bottom:var(--gap)"><div class="card-body" style="padding-bottom:0">${R5.H3(T('Каналы и согласия клиентов', 'Kanäle und Einwilligungen der Kunden', 'Customer channels and consents', 'Клиенттердің арналары мен келісімдері'))}</div><table class="table"><thead><tr><th>${esc(T('Клиент', 'Kunde', 'Customer', 'Клиент'))}</th><th>${esc(T('Язык', 'Sprache', 'Language', 'Тіл'))}</th><th>${esc(T('По умолчанию', 'Standard', 'Default', 'Әдепкі'))}</th><th>WhatsApp</th><th>Telegram</th><th>${esc(T('Действует', 'Wirksam', 'Effective', 'Қолданыста'))}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
<div class="grid2 eq"><div class="card tcard" id="r5_tpl"><div class="card-body" style="padding-bottom:0">${R5.H3(T('Шаблоны сообщений · 4 языка', 'Nachrichtenvorlagen · 4 Sprachen', 'Message templates · 4 languages', 'Хабарлама үлгілері · 4 тіл'))}<div class="actbar">${['ru', 'de', 'en', 'kk'].map(x => `<button class="btn sm ${N.prev === x ? 'primary' : 'grey'}" data-act="r5TplLang" data-v="${x}">${x.toUpperCase()}</button>`).join('')}</div></div><table class="table"><tbody>${tpl}</tbody></table></div>
<div class="card tcard" id="r5_log"><div class="card-body" style="padding-bottom:0">${R5.H3(T('Журнал доставки', 'Zustellprotokoll', 'Delivery log', 'Жеткізу журналы') + ' · ' + N.log.length)}</div><table class="table"><thead><tr><th>${esc(T('Время', 'Zeit', 'Time', 'Уақыт'))}</th><th>${esc(T('Клиент', 'Kunde', 'Customer', 'Клиент'))}</th><th>${esc(T('Рейс', 'Fahrt', 'Load', 'Рейс'))}</th><th>${esc(T('Событие', 'Ereignis', 'Event', 'Оқиға'))}</th><th>${esc(T('Канал', 'Kanal', 'Channel', 'Арна'))}</th><th>${esc(T('Яз.', 'Spr.', 'Lang', 'Тіл'))}</th><th>${esc(T('Статус', 'Status', 'Status', 'Күйі'))}</th><th>${esc(T('Текст (язык интерфейса)', 'Text (UI-Sprache)', 'Text (UI language)', 'Мәтін (интерфейс тілі)'))}</th></tr></thead><tbody>${log || `<tr><td colspan="8" class="faint">${esc(T('Сообщений пока нет', 'Noch keine Nachrichten', 'No messages yet', 'Хабарламалар жоқ'))}</td></tr>`}</tbody></table></div></div>`;
  }
  addTab('settings', 'notify', T('Уведомления клиентов', 'Kundenbenachrichtigungen', 'Customer notifications', 'Клиент хабарламалары'), () => notify(), { badge: () => (N.legal.req && !N.legal.on ? 1 : '') });
  Object.assign(ACT, {
    r5LegalReq: () => { if (!canReq()) return; N.legal.req = { by: S.role, at: clock() }; AUD('Notifications', 'WhatsApp/Telegram', 'Legal activation requested'); render(); },
    r5LegalOk: () => { const L = N.legal; if (!L.req) return; if (!canDo('approvals:sign')) return toast(T('Нужно право approvals:sign', 'Recht approvals:sign nötig', 'Permission approvals:sign required', 'approvals:sign құқығы қажет'), 'err');
      if (L.req.by === S.role) return toast(T('Четыре глаза: одобрить должен другой сотрудник (другая роль)', 'Vier Augen: ein anderer Mitarbeiter (andere Rolle) muss freigeben', 'Four eyes: another employee (another role) must approve', 'Төрт көз: басқа қызметкер мақұлдауы керек'), 'err');
      L.on = true; L.ok = { by: S.role, at: clock() }; AUD('Notifications', 'WhatsApp/Telegram', 'Legal activation approved', ROLE_NAME[L.req.by] + ' + ' + ROLE_NAME[S.role]); toast(T('Мессенджеры включены для клиентов с согласием', 'Messenger für Kunden mit Einwilligung aktiv', 'Messengers active for customers with consent', 'Келісімі бар клиенттерге мессенджерлер қосылды')); },
    r5LegalNo: () => { if (!N.legal.req) return; N.legal.req = null; AUD('Notifications', 'WhatsApp/Telegram', 'Legal activation rejected'); render(); },
    r5LegalOff: () => { N.legal = { on: false, req: null, ok: null }; AUD('Notifications', 'WhatsApp/Telegram', 'Switched off'); render(); },
    r5Consent: d => { if (!canDo('crm:write') && !canDo('approvals:sign')) return toast(T('Нужно право crm:write', 'Recht crm:write nötig', 'Permission crm:write required', 'crm:write құқығы қажет'), 'err'); const c = N.consent[d.id] = N.consent[d.id] || {}; if (c[d.v]) { delete c[d.v]; AUD('Notifications', d.id, CH[d.v] + ' consent withdrawn'); } else { c[d.v] = { at: NOW.toISOString().slice(0, 10), src: 'staff' }; AUD('Notifications', d.id, CH[d.v] + ' consent recorded'); } render(); },
    r5NtfTest: d => { const l = S.loads.find(x => x.cust === d.id && isActive(x)) || S.loads.find(x => x.cust === d.id); if (!l) return toast(T('У клиента нет рейса', 'Kunde hat keine Fahrt', 'Customer has no load', 'Клиентте рейс жоқ'), 'err'); const out = ntfSend(l, 'eta'); AUD('Notifications', l.id, 'ETA sent', out.map(m => m.ch).join('+')); toast(T('Отправлено: ', 'Gesendet: ', 'Sent: ', 'Жіберілді: ') + out.map(m => CH[m.ch]).join(', ')); },
    r5TplLang: d => { N.prev = d.v; render(); },
  });
})();
