/* R4 · Rule sets with versioning and four-eyes (I-13 SLA definitions, I-14 winter concept) + the winter rules in operation.
   RULES.sets.winter / RULES.sets.sla: active data, version, valid-from date, history; every change is a proposal that a second
   person with approvals:sign (other role than the author) approves or rejects; each step is audited ("Rules").
   Settings → "Rules · SLA & winter" edits them. I-14 in operation: Dispatch → "Winter rules" (forecast minimum per hub, cold-snap
   scenario, trips under a winter tier, pre-conditioning confirmation, heating windows, surcharge); the Go/No-Go release gets a
   "Winter rules" check while a tier applies and bookingPrice() adds the winter surcharge (shown on the offer). */
(function () {
  const today = NOW.toISOString().slice(0, 10);
  const nf = n => LF.int(n);
  const H = LF.unit('h'), MIN = LF.unit('min');
  const deg = v => (v < 0 ? '−' + -v : v > 0 ? '+' + v : '0') + ' °C';
  /* field meta: [key, label, unit, min, max] */
  const FIELDS = {
    winter: [
      ['t1', T('Порог уровня 1', 'Schwelle Stufe 1', 'Tier 1 threshold', '1-деңгей шегі'), '°C', -60, 0],
      ['t2', T('Порог уровня 2', 'Schwelle Stufe 2', 'Tier 2 threshold', '2-деңгей шегі'), '°C', -70, 0],
      ['pre1', T('Предкондиционирование, уровень 1', 'Vorkonditionierung, Stufe 1', 'Pre-conditioning, tier 1', 'Алдын ала дайындау, 1-деңгей'), MIN, 0, 240],
      ['pre2', T('Предкондиционирование, уровень 2', 'Vorkonditionierung, Stufe 2', 'Pre-conditioning, tier 2', 'Алдын ала дайындау, 2-деңгей'), MIN, 0, 240],
      ['door1', T('Двери открыты макс., уровень 1', 'Tür offen max., Stufe 1', 'Doors open max, tier 1', 'Есік ашық макс., 1-деңгей'), MIN, 1, 60],
      ['door2', T('Двери открыты макс., уровень 2', 'Tür offen max., Stufe 2', 'Doors open max, tier 2', 'Есік ашық макс., 2-деңгей'), MIN, 1, 60],
      ['heat1', T('Окно обогрева каждые, уровень 1', 'Heizfenster alle, Stufe 1', 'Heating window every, tier 1', 'Жылыту терезесі әр, 1-деңгей'), H, 1, 12],
      ['heat2', T('Окно обогрева каждые, уровень 2', 'Heizfenster alle, Stufe 2', 'Heating window every, tier 2', 'Жылыту терезесі әр, 2-деңгей'), H, 1, 12],
      ['sur1', T('Зимняя надбавка, уровень 1', 'Winterzuschlag, Stufe 1', 'Winter surcharge, tier 1', 'Қысқы үстеме, 1-деңгей'), '%', 0, 50],
      ['sur2', T('Зимняя надбавка, уровень 2', 'Winterzuschlag, Stufe 2', 'Winter surcharge, tier 2', 'Қысқы үстеме, 2-деңгей'), '%', 0, 50],
    ],
    sla: [
      ['otif', T('OTIF, цель', 'OTIF, Ziel', 'OTIF, target', 'OTIF, мақсат'), '%', 50, 100], ['otifRate', T('OTIF, пеня за 1 п.п.', 'OTIF, Pönale je Prozentpunkt', 'OTIF, penalty per point', 'OTIF, 1 п.п. айыппұлы'), '₸', 0, 1e8], ['otifCap', T('OTIF, потолок в месяц', 'OTIF, Deckel je Monat', 'OTIF, cap per month', 'OTIF, айлық шек'), '₸', 0, 1e9],
      ['temp', T('Температурный режим, цель', 'Temperaturtreue, Ziel', 'Temperature compliance, target', 'Температура режимі, мақсат'), '%', 50, 100], ['tempRate', T('Температура, пеня за 1 п.п.', 'Temperatur, Pönale je Prozentpunkt', 'Temperature, penalty per point', 'Температура, 1 п.п. айыппұлы'), '₸', 0, 1e8], ['tempCap', T('Температура, потолок в месяц', 'Temperatur, Deckel je Monat', 'Temperature, cap per month', 'Температура, айлық шек'), '₸', 0, 1e9],
      ['eta', T('Окно ETA, цель', 'ETA-Fenster, Ziel', 'ETA window, target', 'ETA терезесі, мақсат'), '%', 50, 100], ['etaWin', T('Окно ETA ±', 'ETA-Fenster ±', 'ETA window ±', 'ETA терезесі ±'), H, 0.5, 12], ['etaRate', T('ETA, пеня за 1 п.п.', 'ETA, Pönale je Prozentpunkt', 'ETA, penalty per point', 'ETA, 1 п.п. айыппұлы'), '₸', 0, 1e8], ['etaCap', T('ETA, потолок в месяц', 'ETA, Deckel je Monat', 'ETA, cap per month', 'ETA, айлық шек'), '₸', 0, 1e9],
      ['doc', T('Документы заранее, цель', 'Dokumentvorlauf, Ziel', 'Document lead time, target', 'Құжаттар алдын ала, мақсат'), '%', 50, 100], ['docLead', T('Документы не позже чем за', 'Dokumente spätestens vorab', 'Documents at least before', 'Құжаттар кемінде бұрын'), H, 1, 96], ['docRate', T('Документы, пеня за 1 п.п.', 'Dokumente, Pönale je Prozentpunkt', 'Documents, penalty per point', 'Құжаттар, 1 п.п. айыппұлы'), '₸', 0, 1e8], ['docCap', T('Документы, потолок в месяц', 'Dokumente, Deckel je Monat', 'Documents, cap per month', 'Құжаттар, айлық шек'), '₸', 0, 1e9],
      ['totalCap', T('Общий потолок пеней от выручки месяца', 'Gesamtdeckel der Pönalen vom Monatsumsatz', 'Overall penalty cap, share of monthly revenue', 'Айыппұлдардың жалпы шегі, айлық түсімнен'), '%', 0, 30],
    ],
  };
  const SET_L = { winter: T('Зимний регламент', 'Winterkonzept', 'Winter concept', 'Қысқы регламент'), sla: T('SLA · KDL Olymp', 'SLA · KDL Olymp', 'SLA · KDL Olymp', 'SLA · KDL Olymp') };
  const mk = (key, data, at) => ({ key, version: 1, valid_from: '2026-01-01', data, pending: null, history: [{ version: 1, valid_from: '2026-01-01', data: Object.assign({}, data), changed: Object.keys(data), status: 'active', by: 'admin', approved_by: 'manager', at }] });
  const R = globalThis.RULES = { cur: 'winter', sets: {
    winter: mk('winter', { t1: -30, t2: -40, pre1: 45, pre2: 60, door1: 15, door2: 8, heat1: 4, heat2: 2, sur1: 8, sur2: 15 }, '2025-10-20T10:00:00+05:00'),
    sla: mk('sla', { otif: 95, otifRate: 150000, otifCap: 1500000, temp: 99, tempRate: 250000, tempCap: 2500000, eta: 92, etaWin: 2, etaRate: 100000, etaCap: 1000000, doc: 98, docLead: 24, docRate: 50000, docCap: 500000, totalCap: 5 }, '2026-01-05T10:00:00+05:00'),
  } };
  const RM = T('Правила', 'Regeln', 'Rules', 'Ережелер');
  globalThis.rule = (set, k) => R.sets[set].data[k];
  globalThis.ruleSave = (set, data, valid_from) => {
    const s = R.sets[set], F = FIELDS[set]; if (!s) return 'unknown set';
    if (!(canDo('planning:admin') || canDo('costs:approve'))) return T('Нужно право planning:admin или costs:approve', 'Recht planning:admin oder costs:approve nötig', 'Needs planning:admin or costs:approve', 'planning:admin не costs:approve құқығы қажет');
    if (s.pending) return T('Уже есть версия, ожидающая второй подписи', 'Es wartet bereits eine Version auf die 2. Freigabe', 'A version is already awaiting the second approval', 'Екінші қолтаңбаны күтетін нұсқа бар');
    const nd = Object.assign({}, s.data);
    for (const f of F) { const v = data[f[0]]; if (v === undefined || v === '') continue; const n = +String(v).replace(',', '.'); if (!isFinite(n) || n < f[3] || n > f[4]) return f[1] + ': ' + T('допустимо от ', 'erlaubt von ', 'allowed from ', 'рұқсат ') + f[3] + T(' до ', ' bis ', ' to ', ' — ') + f[4]; nd[f[0]] = n; }
    if (set === 'winter' && !(nd.t2 < nd.t1)) return T('Порог уровня 2 должен быть холоднее уровня 1', 'Schwelle Stufe 2 muss kälter als Stufe 1 sein', 'Tier 2 threshold must be colder than tier 1', '2-деңгей шегі 1-деңгейден суық болуы керек');
    if (set === 'winter' && !(nd.sur2 >= nd.sur1 && nd.pre2 >= nd.pre1)) return T('Уровень 2 не может быть мягче уровня 1', 'Stufe 2 darf nicht milder als Stufe 1 sein', 'Tier 2 cannot be milder than tier 1', '2-деңгей 1-деңгейден жұмсақ болмауы керек');
    const changed = F.map(f => f[0]).filter(k => nd[k] !== s.data[k]); if (!changed.length) return T('Нет изменений', 'Keine Änderungen', 'No changes', 'Өзгеріс жоқ');
    const vf = valid_from || today; if (!/^\d{4}-\d{2}-\d{2}$/.test(vf)) return T('Дата вступления: ГГГГ-ММ-ДД', 'Gültig ab: JJJJ-MM-TT', 'Valid from: YYYY-MM-DD', 'Күшіне енуі: ЖЖЖЖ-АА-КК');
    s.pending = { version: s.version + 1, valid_from: vf, data: nd, changed, status: 'pending', by: S.role, approved_by: '', at: clockNow().toISOString() };
    audit(RM, set + ' v' + s.pending.version, T('Предложено (4 глаза)', 'Vorgeschlagen (4 Augen)', 'Proposed (four eyes)', 'Ұсынылды (4 көз)'), changed.map(k => k + ' ' + s.data[k] + '→' + nd[k]).join(', '));
    return s.pending;
  };
  globalThis.ruleDecide = (set, ok, why) => {
    const s = R.sets[set]; if (!s || !s.pending) return T('Нет ожидающей версии', 'Keine wartende Version', 'No pending version', 'Күтудегі нұсқа жоқ');
    if (!canDo('approvals:sign')) return T('Нужно право approvals:sign', 'Recht approvals:sign nötig', 'Needs the right approvals:sign', 'approvals:sign құқығы қажет');
    if (s.pending.by === S.role) return T('Четыре глаза: подтвердить должен другой пользователь (роль)', 'Vier Augen: ein anderer Nutzer (Rolle) muss freigeben', 'Four eyes: another user (role) must approve', 'Төрт көз: басқа пайдаланушы растауы керек');
    const v = s.pending; v.approved_by = S.role; s.pending = null;
    if (ok) { s.history.forEach(h => { if (h.status === 'active') h.status = 'superseded'; }); v.status = 'active'; s.history.unshift(v); s.data = Object.assign({}, v.data); s.version = v.version; s.valid_from = v.valid_from; audit(RM, set + ' v' + v.version, T('Утверждено', 'Freigegeben', 'Approved', 'Бекітілді'), v.changed.join(', ')); }
    else { v.status = 'rejected'; s.history.unshift(v); audit(RM, set + ' v' + v.version, T('Отклонено', 'Abgelehnt', 'Rejected', 'Қабылданбады'), (why || '') + ' ' + v.changed.join(', ')); }
    return null;
  };

  /* ---------- winter rules in operation ---------- */
  const FC0 = { AST: -4, ALA: 6, KAR: -6, SHY: 10, ATY: -2 }, SNAP = { AST: -34, ALA: -12, KAR: -42, SHY: -6, ATY: -31 };
  const W = S.winter = { fc: Object.assign({}, FC0), snap: false, pre: {} };
  globalThis.winterFc = h => (W.fc[h] != null ? W.fc[h] : 0);
  globalThis.winterTier = (from, to) => { const d = R.sets.winter.data, min = Math.min(winterFc(from), winterFc(to)), tier = min <= d.t2 ? 2 : min <= d.t1 ? 1 : 0; return { tier, min, pre: tier ? d['pre' + tier] : 0, door: tier ? d['door' + tier] : 0, heat: tier ? d['heat' + tier] : 0, sur: tier ? d['sur' + tier] : 0 }; };
  globalThis.winterOf = l => winterTier(l.from, l.to);
  globalThis.winterPrice = l => { const w = winterOf(l), base = Math.round(revenue(l)), sur = Math.round(base * w.sur / 100); return { base, sur, total: base + sur, tier: w.tier }; };
  globalThis.winterSnap = on => { W.snap = !!on; W.fc = Object.assign({}, on ? SNAP : FC0); audit(RM, 'winter', on ? T('Сценарий: похолодание', 'Szenario: Kälteeinbruch', 'Scenario: cold snap', 'Сценарий: суық') : T('Сценарий: обычный прогноз', 'Szenario: normale Prognose', 'Scenario: normal forecast', 'Сценарий: қалыпты болжам'), Object.keys(W.fc).map(h => h + ' ' + W.fc[h]).join(', ')); };
  globalThis.winterPreconfirm = lid => {
    const l = load(lid); if (!l) return T('Рейс не найден', 'Fahrt nicht gefunden', 'Trip not found', 'Рейс табылмады');
    if (!winterOf(l).tier) return T('Зимний регламент к рейсу не применяется', 'Winterkonzept gilt für diese Fahrt nicht', 'The winter concept does not apply to this trip', 'Қысқы регламент бұл рейске қолданылмайды');
    if (!['unassigned', 'assigned', 'loading'].includes(l.status)) return T('Только до выезда', 'Nur vor der Abfahrt', 'Only before departure', 'Тек шыққанға дейін');
    if (!(canDo('trips:status') || canDo('orders:write') || canDo('planning:admin'))) return T('Нет права на рейсы', 'Kein Recht für Fahrten', 'No permission for trips', 'Рейс құқығы жоқ');
    W.pre[lid] = { by: S.role, t: fdt(NOW).slice(-5), tier: winterOf(l).tier };
    audit(RM, lid, T('Предкондиционирование подтверждено', 'Vorkonditionierung bestätigt', 'Pre-conditioning confirmed', 'Алдын ала дайындау расталды'), T('уровень ', 'Stufe ', 'tier ', 'деңгей ') + W.pre[lid].tier + ' · ' + winterOf(l).pre + ' ' + MIN);
    return null;
  };
  /* release gate: one more check while a winter tier applies */
  const gateW0 = gate;
  gate = function (l) {
    const c = gateW0(l), w = winterOf(l); if (!w.tier) return c;
    const p = W.pre[l.id], label = T('Зимний регламент', 'Winterkonzept', 'Winter rules', 'Қысқы регламент');
    const rule = T('уровень ', 'Stufe ', 'tier ', 'деңгей ') + w.tier + ' (' + deg(w.min) + '): ' + T('предкондиционирование ', 'Vorkonditionierung ', 'pre-conditioning ', 'алдын ала дайындау ') + w.pre + ' ' + MIN + ' · ' + T('двери ≤ ', 'Tür ≤ ', 'doors ≤ ', 'есік ≤ ') + w.door + ' ' + MIN + ' · ' + T('обогрев каждые ', 'Heizfenster alle ', 'heating every ', 'жылыту әр ') + w.heat + ' ' + H + ' · ' + T('надбавка +', 'Zuschlag +', 'surcharge +', 'үстеме +') + w.sur + ' %';
    c.push({ key: 'winter', x: true, pass: !!p, lvl: p ? 1 : 3, label, text: p ? rule + ' · ' + T('подтверждено ', 'bestätigt ', 'confirmed ', 'расталды ') + p.t : T('нет подтверждения предкондиционирования · ', 'Vorkonditionierung nicht bestätigt · ', 'pre-conditioning not confirmed · ', 'алдын ала дайындау расталмаған · ') + rule });
    return c;
  };
  /* price: the winter surcharge joins the booking price (offer row in 420) */
  const bp0 = bookingPrice;
  globalThis.bookingPrice = b => { const p = bp0(b), w = winterTier(b.from, b.to); if (!w.tier) return Object.assign({}, p, { winter: 0, wTier: 0, wPct: 0 }); const winter = Math.round(p.base * w.sur / 100), net = p.net + winter, vat = Math.round(net * (globalThis.VAT || 0.12)); return Object.assign({}, p, { winter, wTier: w.tier, wPct: w.sur, net, vat, total: net + vat }); };

  /* ---------- Settings → Rules · SLA & winter ---------- */
  const VST = { active: ['green', T('действует', 'gültig', 'active', 'жарамды')], pending: ['yellow', T('ждёт 2-й подписи', 'wartet auf 2. Freigabe', 'awaiting 2nd approval', '2-қолтаңбаны күтуде')], rejected: ['red', T('отклонено', 'abgelehnt', 'rejected', 'қабылданбады')], superseded: ['gray', T('заменено', 'ersetzt', 'superseded', 'ауыстырылды')] };
  const vchip = s => chip(VST[s][0], VST[s][1]);
  const fmt = (f, v) => (f[2] === '₸' ? nf(v) + ' ₸' : LF.dec(v) + ' ' + f[2]);
  function rulesBody() {
    const set = R.cur, s = R.sets[set], F = FIELDS[set], w = canDo('planning:admin') || canDo('costs:approve');
    const nav = Object.keys(R.sets).map(k => `<span class="pill-tab${k === set ? ' active' : ''}" role="tab" tabindex="0" data-act="ruSet" data-v="${k}">${esc(SET_L[k])}${R.sets[k].pending ? ' <span class="n">1</span>' : ''}</span>`).join('');
    const rows = F.map(f => `<tr style="cursor:default" data-rule="${f[0]}"><td>${esc(f[1])}</td><td><b>${esc(fmt(f, s.data[f[0]]))}</b></td><td>${s.pending && s.pending.changed.includes(f[0]) ? chip('yellow', '→ ' + fmt(f, s.pending.data[f[0]])) : ''}</td>${w ? `<td><input class="select" id="ru_${f[0]}" inputmode="decimal" value="${esc(s.data[f[0]])}" aria-label="${esc(f[1])}" style="max-width:130px"></td>` : ''}</tr>`).join('');
    const pend = s.pending ? `<div class="card card-body" data-rule-pending><b>v${s.pending.version}</b> ${vchip('pending')} <span class="note">${esc(T('с ', 'ab ', 'from ', 'бастап '))}${fd(s.pending.valid_from)} · ${esc(T('автор: ', 'Autor: ', 'author: ', 'автор: '))}${esc(ROLE_NAME[s.pending.by] || s.pending.by)} · ${esc(s.pending.changed.join(', '))}</span>${canDo('approvals:sign') ? `<div class="actbar" style="margin-top:8px"><button class="btn green" data-act="ruDecide" data-v="1">${esc(T('Утвердить (2-я подпись)', 'Freigeben (2. Unterschrift)', 'Approve (2nd signature)', 'Бекіту (2-қолтаңба)'))}</button><button class="btn red" data-act="ruDecide" data-v="0">${esc(T('Отклонить', 'Ablehnen', 'Reject', 'Қабылдамау'))}</button></div>` : ''}<p class="note" id="ru_derr" style="color:var(--label-red)"></p></div>` : '';
    const hist = s.history.slice(0, 6).map(h => `<div class="docrow ${h.status === 'active' ? 'valid' : h.status === 'rejected' ? 'expired' : ''}"><span><b>v${h.version}</b> ${vchip(h.status)} <span class="sub">${esc(T('с ', 'ab ', 'from ', 'бастап '))}${fd(h.valid_from)} · ${esc(ROLE_NAME[h.by] || h.by)}${h.approved_by ? ' → ' + esc(ROLE_NAME[h.approved_by] || h.approved_by) : ''}</span></span><span class="sub">${esc(h.changed.slice(0, 5).join(', '))}${h.changed.length > 5 ? ' …' : ''}</span></div>`).join('');
    return `<div class="pill-tabs" role="tablist" style="margin-bottom:12px">${nav}</div>${howNote('r4Rules')}
<div class="card tcard"><table class="table" data-rules="${set}"><thead><tr><th>${esc(T('Параметр', 'Parameter', 'Parameter', 'Параметр'))}</th><th>${esc(T('Действует', 'Gültig', 'Current', 'Қолданыста'))} · v${s.version} ${esc(T('с ', 'ab ', 'from ', 'бастап '))}${fd(s.valid_from)}</th><th>${esc(T('Предложено', 'Vorgeschlagen', 'Proposed', 'Ұсынылған'))}</th>${w ? `<th>${esc(T('Новое значение', 'Neuer Wert', 'New value', 'Жаңа мән'))}</th>` : ''}</tr></thead><tbody>${rows}</tbody></table></div>
${pend}${w ? `<div class="card card-body rec-form"><div class="actbar"><label class="fl" style="margin:0">${esc(T('Действует с', 'Gültig ab', 'Valid from', 'Күшіне енуі'))}<input class="select" type="date" id="ru_from" value="${today}"></label><button class="btn primary" data-act="ruSave">${esc(T('Предложить новую версию', 'Neue Version vorschlagen', 'Propose new version', 'Жаңа нұсқа ұсыну'))}</button></div><p class="note" id="ru_err" style="color:var(--label-red)"></p><p class="note">${esc(T('Любое изменение правила вступает в силу только после второй подписи другого пользователя с правом approvals:sign; каждая версия и решение — в журнале аудита.', 'Jede Regeländerung gilt erst nach der zweiten Unterschrift eines anderen Nutzers mit approvals:sign; jede Version und Entscheidung steht im Audit-Protokoll.', 'Every rule change takes effect only after the second signature of another user with approvals:sign; every version and decision is in the audit log.', 'Ереже өзгерісі тек approvals:sign құқығы бар басқа пайдаланушының екінші қолынан кейін күшіне енеді; әр нұсқа аудит журналында.'))}</p></div>` : `<p class="note">${esc(T('Только чтение для этой роли.', 'Nur Lesen für diese Rolle.', 'Read-only for this role.', 'Бұл рөлге тек оқу.'))}</p>`}
<div class="card card-body"><h4 style="margin:0 0 8px">${esc(T('История версий', 'Versionsverlauf', 'Version history', 'Нұсқалар тарихы'))}</h4>${hist}</div>`;
  }
  addTab('settings', 'rules', T('Правила · SLA и зима', 'Regeln · SLA & Winter', 'Rules · SLA & winter', 'Ережелер · SLA және қыс'), rulesBody, { badge: () => Object.values(R.sets).filter(s => s.pending).length || '' });

  /* ---------- Dispatch → Winter rules ---------- */
  const tierChip = t => t === 2 ? chip('red', T('уровень 2', 'Stufe 2', 'tier 2', '2-деңгей')) : t === 1 ? chip('yellow', T('уровень 1', 'Stufe 1', 'tier 1', '1-деңгей')) : chip('green', T('не применяется', 'gilt nicht', 'not applied', 'қолданылмайды'));
  const winterLoads = () => S.loads.filter(l => ['unassigned', 'assigned', 'loading', 'in_transit', 'problem'].includes(l.status));
  function winterBody() {
    const d = R.sets.winter.data, ls = winterLoads().map(l => ({ l, w: winterOf(l), p: winterPrice(l) })), hit = ls.filter(x => x.w.tier);
    const hubs = Object.keys(HUBS).map(h => { const fc = winterFc(h), t = fc <= d.t2 ? 2 : fc <= d.t1 ? 1 : 0; return `<div class="docrow ${t === 2 ? 'expired' : t ? 'soon' : 'valid'}" data-wfc="${h}"><span><b>${esc(HUBS[h].city)}</b><div class="sub">${esc(T('мин. по прогнозу', 'Prognose-Minimum', 'forecast minimum', 'болжам минимумы'))}</div></span><span><b>${deg(fc)}</b> ${tierChip(t)}</span></div>`; }).join('');
    const rows = hit.map(({ l, w, p }) => { const pre = W.pre[l.id], before = ['unassigned', 'assigned', 'loading'].includes(l.status);
      return `<tr style="cursor:default" data-wl="${l.id}"><td><a class="lnk" data-act="open" data-id="${l.id}">${l.id}</a><div class="sub">${esc(HUBS[l.from].city)} → ${esc(HUBS[l.to].city)} · ${stChip(l.status)}</div></td><td>${tierChip(w.tier)}<div class="sub">${deg(w.min)}</div></td><td>${w.pre} ${esc(MIN)}<div class="sub">${esc(T('двери ≤ ', 'Tür ≤ ', 'doors ≤ ', 'есік ≤ '))}${w.door} ${esc(MIN)} · ${esc(T('обогрев каждые ', 'Heizen alle ', 'heat every ', 'жылыту әр '))}${w.heat} ${esc(H)}</div></td><td>${nf(p.base)} ₸<div class="sub">+${w.sur} % = <b>${nf(p.sur)} ₸</b></div></td><td><b>${nf(p.total)} ₸</b></td><td>${pre ? chip('green', T('подтверждено ', 'bestätigt ', 'confirmed ', 'расталды ') + pre.t) : before ? `<button class="btn sm primary" data-act="wPre" data-id="${l.id}">${esc(T('Подтвердить', 'Bestätigen', 'Confirm', 'Растау'))}</button>` : chip('gray', T('в пути', 'unterwegs', 'en route', 'жолда'))}</td></tr>`; }).join('');
    return `${howNote('r4Winter')}<div class="card card-body" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><b>${esc(T('Регламент', 'Regelwerk', 'Rule set', 'Регламент'))} v${R.sets.winter.version}</b><span class="note">${esc(T('уровень 1 ≤ ', 'Stufe 1 ≤ ', 'tier 1 ≤ ', '1-деңгей ≤ '))}${deg(d.t1)} · ${esc(T('уровень 2 ≤ ', 'Stufe 2 ≤ ', 'tier 2 ≤ ', '2-деңгей ≤ '))}${deg(d.t2)} · ${esc(T('надбавка ', 'Zuschlag ', 'surcharge ', 'үстеме '))}${d.sur1} / ${d.sur2} %</span><button class="btn sm ${W.snap ? 'grey' : 'primary'}" data-act="wSnap">${esc(W.snap ? T('Вернуть обычный прогноз', 'Normale Prognose', 'Back to normal forecast', 'Қалыпты болжам') : T('Сценарий: похолодание −34 / −42 °C', 'Szenario: Kälteeinbruch −34 / −42 °C', 'Scenario: cold snap −34 / −42 °C', 'Сценарий: суық −34 / −42 °C'))}</button><a class="lnk" data-act="ruGo">${esc(T('Изменить правила (Настройки)', 'Regeln ändern (Einstellungen)', 'Edit rules (Settings)', 'Ережелерді өзгерту (Баптаулар)'))}</a></div>
<div class="grid2 eq"><div class="card card-body"><h4 style="margin:0 0 8px">${esc(T('Прогноз Казгидромет по хабам', 'Kazhydromet-Prognose je Hub', 'Kazhydromet forecast by hub', 'Хабтар бойынша Қазгидромет болжамы'))}</h4>${hubs}</div>
<div class="card card-body"><h4 style="margin:0 0 8px">${esc(T('Что делает регламент', 'Was das Regelwerk tut', 'What the rule set does', 'Регламент не істейді'))}</h4><div class="docrow"><span>${esc(T('Перед погрузкой кузов доводится до уставки (предкондиционирование) и это подтверждается — иначе Go/No-Go красный.', 'Vor dem Beladen wird der Aufbau auf Sollwert gebracht (Vorkonditionierung) und bestätigt — sonst ist Go/No-Go rot.', 'Before loading the body is brought to the set point (pre-conditioning) and confirmed — otherwise Go/No-Go is red.', 'Тиеу алдында шанақ белгіленген температураға жеткізіліп, расталады — әйтпесе Go/No-Go қызыл.'))}</span></div><div class="docrow"><span>${esc(T('Окна обогрева и лимит открытых дверей попадают в путевой лист.', 'Heizfenster und Türöffnungslimit kommen in die Wegeliste.', 'Heating windows and the door-open limit go into the waybill.', 'Жылыту терезелері мен есік шегі жол парағына түседі.'))}</span></div><div class="docrow"><span>${esc(T('Зимняя надбавка добавляется к тарифу: в бронировании и коммерческом предложении — отдельной строкой.', 'Der Winterzuschlag kommt zum Tarif: in Buchung und Angebot als eigene Zeile.', 'The winter surcharge is added to the tariff: a separate line in the booking and the offer.', 'Қысқы үстеме тарифке қосылады: броньда және ұсыныста бөлек жол.'))}</span></div></div></div>
${KIT.table([T('Рейс', 'Fahrt', 'Trip', 'Рейс'), T('Уровень', 'Stufe', 'Tier', 'Деңгей'), T('Предкондиц. · окна', 'Vorkond. · Fenster', 'Pre-cond. · windows', 'Дайындау · терезелер'), T('Ставка + надбавка', 'Satz + Zuschlag', 'Rate + surcharge', 'Баға + үстеме'), T('Цена', 'Preis', 'Price', 'Баға'), T('Предкондиционирование', 'Vorkonditionierung', 'Pre-conditioning', 'Алдын ала дайындау')], rows, { cols: 6, empty: T('Сейчас ни один рейс не попадает под зимний регламент', 'Derzeit fällt keine Fahrt unter das Winterkonzept', 'No trip falls under the winter concept right now', 'Қазір бірде-бір рейс қысқы регламентке түспейді'), attrs: 'data-winter-trips' })}`;
  }
  addTab('dispatch', 'winter', T('Зимний регламент', 'Winterkonzept', 'Winter rules', 'Қысқы регламент'), winterBody, { badge: () => winterLoads().filter(l => winterOf(l).tier && !W.pre[l.id] && ['unassigned', 'assigned', 'loading'].includes(l.status)).length || '' });

  Object.assign(ACT, {
    ruSet: d => { R.cur = d.v; render(); },
    ruGo: () => { go('settings'); setTab('settings', 'rules'); },
    ruSave: () => { const data = {}; FIELDS[R.cur].forEach(f => { const e = document.getElementById('ru_' + f[0]); if (e) data[f[0]] = e.value; }); const fe = document.getElementById('ru_from'); const r = ruleSave(R.cur, data, fe ? fe.value : ''); if (typeof r === 'string') { const e = document.getElementById('ru_err'); if (e) e.textContent = r; return toast(r, 'err'); } toast(T('Версия предложена — нужна вторая подпись', 'Version vorgeschlagen — zweite Unterschrift nötig', 'Version proposed — second signature needed', 'Нұсқа ұсынылды — екінші қол қажет')); },
    ruDecide: d => { const e = ruleDecide(R.cur, d.v === '1'); if (e) { const x = document.getElementById('ru_derr'); if (x) x.textContent = e; return toast(e, 'err'); } toast(d.v === '1' ? T('Утверждено', 'Freigegeben', 'Approved', 'Бекітілді') : T('Отклонено', 'Abgelehnt', 'Rejected', 'Қабылданбады')); },
    wSnap: () => { winterSnap(!W.snap); render(); },
    wPre: d => { const e = winterPreconfirm(d.id); if (e) return toast(e, 'err'); toast(T('Предкондиционирование подтверждено', 'Vorkonditionierung bestätigt', 'Pre-conditioning confirmed', 'Алдын ала дайындау расталды')); },
  });
})();

/* Operations parity glue (0.3.11): a new alarm withdraws the release of its trip (E-44), a temperature alarm opens the deviation and puts the orders on hold (E-62),
   and the board button "To trip" checks hub / temperature class / capacity / ADR before an ERP order joins a trip (B-27). Loaded after 410 and 475, so the globals exist. */
(function () {
  const r0 = globalThis.raiseAlarm;
  if (r0 && !r0.opsWrapped) {
    globalThis.raiseAlarm = function (o) {
      const n0 = (S.alarms || []).length, a = r0.apply(this, arguments);
      if (a && (S.alarms || []).length > n0) {
        if (a.lvl >= 3 && typeof alarmRevoke === 'function') alarmRevoke(a);
        const l = a.cat === 'temperature' && a.load ? load(a.load) : null;
        if (l && typeof openDeviation === 'function') {
          openDeviation(l, T('Выход за диапазон ', 'Bereichsverletzung ', 'Out of range ', 'Диапазоннан шығу ') + ZONES[l.zone].label + ' · ' + (trk(l.truck) || { plate: '—' }).plate, l.id + ' · ' + String(a.text || ''));
          if (typeof ops === 'function') ops(l).orders.forEach(x => { (x.events = x.events || []).push({ t: NOW.toISOString(), kind: 'quality_hold' }); });
        }
      }
      return a;
    };
    globalThis.raiseAlarm.opsWrapped = true;
  }
  const t0 = ACT.ooTrip;
  if (t0 && !t0.opsWrapped) {
    ACT.ooTrip = function (d) { if (typeof orderAttachCheck === 'function' && canDo('trips:write')) { const e = orderAttachCheck(d.l, d.id); if (e) return toast(e, 'err'); } return t0.apply(this, arguments); };
    ACT.ooTrip.opsWrapped = true;
  }
})();
