/* R4 · I-13 SLA measurement and penalties for the main customer KDL Olymp (100 % cluster risk).
   Definitions come from the versioned rule set RULES.sets.sla (Settings → Rules · SLA & winter, four-eyes): OTIF, temperature
   compliance, ETA window, document lead time — each with a target, a penalty per percentage point of shortfall and a monthly cap,
   plus an overall cap as a share of the month's revenue. Months Jul–Sep are closed demo measurements; the current month (Oct) is
   computed from the loads. A KPI line can be flagged as disputed (excluded until resolved: withdrawn or waived), the month can be
   frozen, and the penalty lines go onto the customer statement (Billing → SLA statement). Every step is audited ("SLA"). */
(function () {
  const nf = n => Math.round(n).toLocaleString('ru-RU');
  const f1 = v => (LANG === 'en' ? v.toFixed(1) : v.toFixed(1).replace('.', ','));
  const tg = n => nf(n) + ' ₸';
  const SM = 'SLA';
  const KPIS = [
    { k: 'otif', l: T('OTIF (вовремя и полностью)', 'OTIF (pünktlich und vollständig)', 'OTIF (on time, in full)', 'OTIF (уақытында және толық)') },
    { k: 'temp', l: T('Соблюдение температуры', 'Temperaturtreue', 'Temperature compliance', 'Температураны сақтау') },
    { k: 'eta', l: T('Прибытие в окне ETA', 'Ankunft im ETA-Fenster', 'Arrival within the ETA window', 'ETA терезесінде келу') },
    { k: 'doc', l: T('Документы заранее', 'Dokumente rechtzeitig', 'Documents in time', 'Құжаттар уақытында') },
  ];
  const MONTHS = ['2026-07', '2026-08', '2026-09', '2026-10'], CUR = '2026-10';
  const MN = { '07': T('июль', 'Juli', 'July', 'шілде'), '08': T('август', 'August', 'August', 'тамыз'), '09': T('сентябрь', 'September', 'September', 'қыркүйек'), '10': T('октябрь', 'Oktober', 'October', 'қазан') };
  const mLabel = m => MN[m.slice(5)] + ' ' + m.slice(0, 4);
  /* closed months: measured values and revenue (demo history of the framework contract) */
  const HIST = {
    '2026-07': { otif: 96.1, temp: 99.4, eta: 93.0, doc: 98.6, n: 212, rev: 48200000 },
    '2026-08': { otif: 93.2, temp: 98.1, eta: 90.5, doc: 97.0, n: 226, rev: 51700000 },
    '2026-09': { otif: 94.6, temp: 99.2, eta: 91.4, doc: 99.1, n: 231, rev: 53900000 },
  };
  const SL = S.sla = { month: CUR, disp: {}, frozen: {}, posted: {} };
  const h = id => { let x = 0; for (const c of id) x = (x * 31 + c.charCodeAt(0)) % 9973; return x; };
  /* demo telemetry until arrival times and document timestamps are recorded: deterministic per load id */
  globalThis.slaArrDev = l => (h(l.id) % 300) - 90;   // minutes after ETA (negative = early)
  globalThis.slaDocLead = l => 6 + (h(l.id + 'd') % 60);   // hours the documents reached the customer before arrival
  globalThis.slaMeasure = m => {
    const d = R().data;
    if (HIST[m]) return Object.assign({ month: m, live: false }, HIST[m]);
    if (SL.frozen[m]) return SL.frozen[m];
    const L = S.loads, dv = L.filter(l => l.status === 'delivered'), run = L.filter(l => ['in_transit', 'problem', 'delivered'].includes(l.status));
    const pc = (a, b) => (b ? a / b * 100 : 100);
    return { month: m, live: true, n: dv.length,
      otif: pc(dv.filter(l => !l.exc && l.pod !== 'rejected' && Math.abs(slaArrDev(l)) <= d.etaWin * 60).length, dv.length),
      temp: pc(run.filter(l => tempState(l) !== 'breach').length, run.length),
      eta: pc(dv.filter(l => Math.abs(slaArrDev(l)) <= d.etaWin * 60).length, dv.length),
      doc: pc(dv.filter(l => slaDocLead(l) >= d.docLead).length, dv.length),
      rev: L.reduce((s, l) => s + revenue(l), 0) };
  };
  const R = () => RULES.sets.sla;
  const dkey = (m, k) => m + '|' + k;
  globalThis.slaPenalty = m => {
    const d = R().data, ms = slaMeasure(m);
    const lines = KPIS.map(x => { const val = ms[x.k], tgt = d[x.k], short = Math.max(0, Math.round((tgt - val) * 10) / 10), raw = Math.round(short * d[x.k + 'Rate']), cap = d[x.k + 'Cap'], amt = Math.min(raw, cap), ds = SL.disp[dkey(m, x.k)];
      const st = !amt ? 'ok' : ds ? (ds.open ? 'disputed' : ds.res === 'waived' ? 'waived' : 'due') : 'due';
      return { k: x.k, label: x.l, val, tgt, short, raw, cap, capped: raw > cap, amt, st, disp: ds || null }; });
    const due = lines.filter(x => x.st === 'due').reduce((s, x) => s + x.amt, 0), held = lines.filter(x => x.st === 'disputed').reduce((s, x) => s + x.amt, 0);
    const totalCap = Math.round(ms.rev * d.totalCap / 100), payable = Math.min(due, totalCap);
    return { m, ms, lines, due, held, totalCap, payable, cappedTotal: due > totalCap, frozen: !!SL.frozen[m] || !ms.live, posted: SL.posted[m] || null, version: R().version };
  };
  globalThis.slaDispute = (m, k, reason) => {
    const p = slaPenalty(m), ln = p.lines.find(x => x.k === k); if (!ln) return 'unknown KPI';
    if (!ln.amt) return T('Пени нет — оспаривать нечего', 'Keine Pönale — nichts zu bestreiten', 'No penalty — nothing to dispute', 'Айыппұл жоқ');
    if (!(canDo('costs:approve') || canDo('approvals:sign'))) return T('Нужно право costs:approve', 'Recht costs:approve nötig', 'Needs costs:approve', 'costs:approve құқығы қажет');
    if (SL.disp[dkey(m, k)] && SL.disp[dkey(m, k)].open) return T('Спор уже открыт', 'Streit bereits offen', 'Dispute already open', 'Дау ашық');
    if (!reason || reason.trim().length < 10) return T('Обоснование спора: минимум 10 знаков', 'Begründung des Streits: mindestens 10 Zeichen', 'Dispute reason: at least 10 characters', 'Дау негіздемесі: кемінде 10 таңба');
    SL.disp[dkey(m, k)] = { open: true, reason: reason.trim(), by: S.role, t: fdt(NOW), res: '' };
    audit(SM, m + ' ' + k, T('Спор открыт', 'Streit eröffnet', 'Dispute opened', 'Дау ашылды'), reason.trim()); return null;
  };
  globalThis.slaResolve = (m, k, res) => {
    const ds = SL.disp[dkey(m, k)]; if (!ds || !ds.open) return T('Нет открытого спора', 'Kein offener Streit', 'No open dispute', 'Ашық дау жоқ');
    if (!['withdrawn', 'waived'].includes(res)) return 'resolution?';
    if (res === 'waived' && !canDo('approvals:sign')) return T('Отказ от пени — только с правом approvals:sign', 'Verzicht auf die Pönale nur mit approvals:sign', 'Waiving needs approvals:sign', 'Айыппұлдан бас тарту тек approvals:sign');
    if (res === 'waived' && ds.by === S.role) return T('Четыре глаза: отказ подтверждает другой пользователь (роль)', 'Vier Augen: den Verzicht bestätigt ein anderer Nutzer (Rolle)', 'Four eyes: another user (role) confirms the waiver', 'Төрт көз: бас тартуды басқа пайдаланушы растайды');
    ds.open = false; ds.res = res; ds.resBy = S.role;
    audit(SM, m + ' ' + k, res === 'waived' ? T('Спор: пеня снята', 'Streit: Pönale erlassen', 'Dispute: penalty waived', 'Дау: айыппұл алынды') : T('Спор: пеня в силе', 'Streit: Pönale bleibt', 'Dispute: penalty stands', 'Дау: айыппұл күшінде'), ds.reason); return null;
  };
  globalThis.slaFreeze = m => {
    if (HIST[m] || SL.frozen[m]) return T('Месяц уже закрыт', 'Monat bereits abgeschlossen', 'Month already closed', 'Ай жабылған');
    if (!(canDo('costs:approve') || canDo('approvals:sign'))) return T('Нужно право costs:approve', 'Recht costs:approve nötig', 'Needs costs:approve', 'costs:approve құқығы қажет');
    const ms = slaMeasure(m); SL.frozen[m] = Object.assign({}, ms, { live: false, at: fdt(NOW), v: R().version });
    audit(SM, m, T('Замер месяца зафиксирован', 'Monatsmessung festgeschrieben', 'Monthly measurement frozen', 'Ай өлшемі бекітілді'), KPIS.map(x => x.k + ' ' + f1(ms[x.k])).join(', ') + ' · SLA v' + R().version); return null;
  };
  globalThis.slaPost = m => {
    const p = slaPenalty(m); if (!p.frozen) return T('Сначала зафиксируйте замер месяца', 'Zuerst die Monatsmessung festschreiben', 'Freeze the monthly measurement first', 'Алдымен ай өлшемін бекітіңіз');
    if (p.posted) return T('Строки уже в выписке', 'Zeilen bereits im Kontoauszug', 'Lines already on the statement', 'Жолдар үзінді-көшірмеде');
    if (!canDo('costs:approve')) return T('Нужно право costs:approve', 'Recht costs:approve nötig', 'Needs costs:approve', 'costs:approve құқығы қажет');
    SL.posted[m] = { t: fdt(NOW), by: S.role, amount: p.payable, held: p.held };
    audit(SM, m, T('Пени внесены в выписку клиента', 'Pönalen in den Kundenauszug gebucht', 'Penalties posted to the customer statement', 'Айыппұлдар клиент үзіндісіне енгізілді'), tg(p.payable) + (p.held ? ' · ' + T('спор ', 'strittig ', 'disputed ', 'дау ') + tg(p.held) : '')); return null;
  };
  globalThis.slaStatement = m => {
    const p = slaPenalty(m), net = Math.round(p.ms.rev);
    const lines = [{ kind: 'service', text: T('Транспортные услуги по договору, ', 'Transportleistungen laut Vertrag, ', 'Transport services under the contract, ', 'Шарт бойынша көлік қызметі, ') + mLabel(m), amount: net }]
      .concat(p.lines.filter(x => x.amt).map(x => ({ kind: 'penalty', k: x.k, st: x.st, text: T('Пеня SLA: ', 'SLA-Pönale: ', 'SLA penalty: ', 'SLA айыппұлы: ') + x.label + ' (' + f1(x.val) + ' % / ' + T('цель ', 'Ziel ', 'target ', 'мақсат ') + x.tgt + ' %)', amount: x.st === 'due' ? -x.amt : 0, shown: -x.amt })));
    if (p.cappedTotal) lines.push({ kind: 'cap', text: T('Общий потолок пеней ', 'Gesamtdeckel der Pönalen ', 'Overall penalty cap ', 'Айыппұлдардың жалпы шегі ') + R().data.totalCap + ' %', amount: p.due - p.payable });
    const total = lines.reduce((s, x) => s + x.amount, 0);
    return { m, lines, net, penalties: p.payable, held: p.held, total, vat: Math.round(total * 0.12), posted: p.posted };
  };
  const STC = { ok: ['green', T('в норме', 'erfüllt', 'met', 'орындалды')], due: ['red', T('к удержанию', 'fällig', 'due', 'ұсталады')], disputed: ['yellow', T('спор', 'strittig', 'disputed', 'дау')], waived: ['gray', T('снята', 'erlassen', 'waived', 'алынды')] };
  const tile = (cls, ico, val, label, sub) => `<div class="kpi-tile tint ${cls}"><div><div class="value">${val}</div><div class="label">${esc(label)}</div>${sub ? `<div class="delta">${esc(sub)}</div>` : ''}</div><div class="icon" style="background:var(--${cls});color:#fff;border-radius:50%">${ic(ico, 18)}</div></div>`;
  const monthSel = () => `<label class="fl" style="margin:0;min-width:160px">${esc(T('Месяц', 'Monat', 'Month', 'Ай'))}<select class="select" id="sla_m" data-slam="1">${MONTHS.map(m => `<option value="${m}"${m === SL.month ? ' selected' : ''}>${esc(mLabel(m))}${m === CUR ? ' · ' + esc(T('текущий', 'laufend', 'current', 'ағымдағы')) : ''}</option>`).join('')}</select></label>`;
  function reportBody() {
    const d = R().data, p = slaPenalty(SL.month), w = canDo('costs:approve') || canDo('approvals:sign');
    const grid = MONTHS.map(m => { const ms = slaMeasure(m), pm = slaPenalty(m); return `<tr style="cursor:${m === SL.month ? 'default' : 'pointer'}" data-act="slaM" data-v="${m}" data-sla-month="${m}"${m === SL.month ? ' class="is-selected"' : ''}><td><b>${esc(mLabel(m))}</b><div class="sub">${ms.live ? esc(T('идёт замер · ', 'Messung läuft · ', 'measuring · ', 'өлшенуде · ')) : esc(T('закрыт · ', 'abgeschlossen · ', 'closed · ', 'жабық · '))}${ms.n} ${esc(T('доставок', 'Lieferungen', 'deliveries', 'жеткізу'))}</div></td>${KPIS.map(x => `<td><span class="chip ${ms[x.k] >= d[x.k] ? 'green' : ms[x.k] >= d[x.k] - 2 ? 'yellow' : 'red'}">${f1(ms[x.k])} %</span></td>`).join('')}<td><b>${tg(pm.payable)}</b>${pm.held ? `<div class="sub">${esc(T('спор ', 'strittig ', 'disputed ', 'дау '))}${tg(pm.held)}</div>` : ''}</td></tr>`; }).join('');
    const lines = p.lines.map(x => `<tr style="cursor:default" data-sla-line="${x.k}"><td><b>${esc(x.label)}</b><div class="sub">${esc(T('цель ≥ ', 'Ziel ≥ ', 'target ≥ ', 'мақсат ≥ '))}${x.tgt} %${x.k === 'eta' ? ' · ±' + d.etaWin + ' ' + esc(T('ч', 'h', 'h', 'сағ')) : x.k === 'doc' ? ' · ≥ ' + d.docLead + ' ' + esc(T('ч до прибытия', 'h vor Ankunft', 'h before arrival', 'сағ бұрын')) : ''}</div></td><td>${f1(x.val)} %</td><td>${x.short ? f1(x.short) + ' ' + esc(T('п.п.', 'Pp.', 'pts', 'п.т.')) : '—'}</td><td>${x.raw ? tg(x.raw) : '—'}${x.capped ? `<div class="sub">${esc(T('потолок ', 'Deckel ', 'cap ', 'шек '))}${tg(x.cap)}</div>` : ''}</td><td><b>${x.amt ? tg(x.amt) : '—'}</b></td><td>${chip(STC[x.st][0], STC[x.st][1])}${x.disp ? `<div class="sub">${esc(x.disp.reason)}</div>` : ''}</td><td>${x.amt && w ? (x.disp && x.disp.open ? `<button class="btn sm grey" data-act="slaRes" data-k="${x.k}" data-v="withdrawn">${esc(T('Пеня в силе', 'Pönale bleibt', 'Penalty stands', 'Айыппұл күшінде'))}</button> <button class="btn sm grey" data-act="slaRes" data-k="${x.k}" data-v="waived">${esc(T('Снять пеню', 'Pönale erlassen', 'Waive', 'Айыппұлды алу'))}</button>` : !x.disp ? `<button class="btn sm grey" data-act="slaDis" data-k="${x.k}">${esc(T('Оспорить', 'Bestreiten', 'Dispute', 'Дауласу'))}</button>` : '') : ''}</td></tr>`).join('');
    return `${howNote('r4Sla')}<div class="filters">${monthSel()}<span class="note">${esc(T('Определения SLA', 'SLA-Definitionen', 'SLA definitions', 'SLA анықтамалары'))} v${R().version} · <a class="lnk" data-act="slaRules">${esc(T('изменить (4 глаза)', 'ändern (4 Augen)', 'edit (four eyes)', 'өзгерту (4 көз)'))}</a></span></div>
<div class="kpi-row k4">${KPIS.map(x => { const ln = p.lines.find(y => y.k === x.k); return tile(ln.val >= ln.tgt ? 'green' : 'red', x.k === 'temp' ? 'therm' : x.k === 'doc' ? 'file' : x.k === 'eta' ? 'route' : 'truck', f1(ln.val) + ' %', x.l, T('цель ', 'Ziel ', 'target ', 'мақсат ') + ln.tgt + ' %'); }).join('')}</div>
<div class="card tcard"><table class="table" data-sla-months><thead><tr><th>${esc(T('Месяц', 'Monat', 'Month', 'Ай'))}</th>${KPIS.map(x => `<th>${esc(x.l)}</th>`).join('')}<th>${esc(T('Пени', 'Pönalen', 'Penalties', 'Айыппұлдар'))}</th></tr></thead><tbody>${grid}</tbody></table></div>
<div class="card tcard"><div class="card-head" style="padding:14px 20px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h3 style="margin:0;font-size:15px">${esc(T('Расчёт пеней · ', 'Pönalenberechnung · ', 'Penalty calculation · ', 'Айыппұл есебі · '))}${esc(mLabel(SL.month))}</h3><span class="actbar">${!p.frozen && w ? `<button class="btn sm primary" data-act="slaFreeze">${esc(T('Зафиксировать замер', 'Messung festschreiben', 'Freeze measurement', 'Өлшемді бекіту'))}</button>` : chip(p.frozen ? 'blue' : 'gray', p.frozen ? T('замер закрыт', 'Messung abgeschlossen', 'measurement closed', 'өлшем жабық') : T('идёт замер', 'Messung läuft', 'measuring', 'өлшенуде'))}<button class="btn sm grey" data-act="slaCsv">CSV</button></span></div>
<table class="table" data-sla-lines><thead><tr><th>KPI</th><th>${esc(T('Факт', 'Ist', 'Actual', 'Нақты'))}</th><th>${esc(T('Недобор', 'Unterschreitung', 'Shortfall', 'Кем'))}</th><th>${esc(T('Расчёт', 'Berechnet', 'Calculated', 'Есеп'))}</th><th>${esc(T('Пеня', 'Pönale', 'Penalty', 'Айыппұл'))}</th><th>${esc(T('Статус', 'Status', 'Status', 'Күйі'))}</th><th></th></tr></thead><tbody>${lines}
<tr style="cursor:default;background:var(--bg-subtle)"><td colspan="4"><b>${esc(T('К удержанию', 'Fällig', 'Payable', 'Ұсталады'))}</b><div class="sub">${esc(T('общий потолок ', 'Gesamtdeckel ', 'overall cap ', 'жалпы шек '))}${d.totalCap} % ${esc(T('от выручки ', 'vom Umsatz ', 'of revenue ', 'түсімнен '))}${tg(p.ms.rev)} = ${tg(p.totalCap)}</div></td><td><b data-sla-payable>${tg(p.payable)}</b></td><td colspan="2">${p.held ? chip('yellow', T('в споре ', 'strittig ', 'disputed ', 'дауда ') + tg(p.held)) : ''}</td></tr></tbody></table></div>
${S.slaDis ? `<div class="card card-body" id="sla_dis_box"><label class="fl">${esc(T('Обоснование спора', 'Begründung des Streits', 'Dispute reason', 'Дау негіздемесі'))} · <b>${esc(S.slaDis ? (KPIS.find(x => x.k === S.slaDis) || {}).l || '' : '')}</b><textarea class="select" id="sla_reason" rows="2"></textarea></label><div class="actbar"><button class="btn primary" data-act="slaDisGo">${esc(T('Открыть спор', 'Streit eröffnen', 'Open dispute', 'Дау ашу'))}</button><button class="btn grey" data-act="slaDisX">${esc(T('Отмена', 'Abbrechen', 'Cancel', 'Болдырмау'))}</button></div><p class="note" id="sla_err" style="color:var(--label-red)"></p></div>` : ''}`;
  }
  function statementBody() {
    const st = slaStatement(SL.month), p = slaPenalty(SL.month);
    const rows = st.lines.map(x => `<tr style="cursor:default" data-stmt="${x.kind}${x.k ? '-' + x.k : ''}"><td>${esc(x.text)}${x.st && x.st !== 'due' ? ' ' + chip(STC[x.st][0], STC[x.st][1]) : ''}</td><td style="text-align:right"><b${x.amount < 0 ? ' style="color:var(--label-red)"' : ''}>${x.amount || x.kind === 'service' ? tg(x.amount) : `<s class="faint">${tg(x.shown)}</s>`}</b></td></tr>`).join('');
    return `${howNote('r4SlaStmt')}<div class="filters">${monthSel()}<span class="note">${esc(T('Клиент: ', 'Kunde: ', 'Customer: ', 'Клиент: '))}<b>KDL Olymp</b> · ${esc(T('рамочный договор, SLA v', 'Rahmenvertrag, SLA v', 'framework contract, SLA v', 'негіздемелік шарт, SLA v'))}${p.version}</span></div>
<div class="card tcard"><table class="table" data-sla-statement><thead><tr><th>${esc(T('Позиция выписки', 'Position des Auszugs', 'Statement line', 'Үзінді жолы'))}</th><th style="text-align:right">${esc(T('Сумма', 'Betrag', 'Amount', 'Сомасы'))}</th></tr></thead><tbody>${rows}
<tr style="cursor:default;background:var(--bg-subtle)"><td><b>${esc(T('Итого без НДС', 'Netto', 'Net total', 'ҚҚС-сіз барлығы'))}</b></td><td style="text-align:right"><b data-stmt-total>${tg(st.total)}</b></td></tr><tr style="cursor:default"><td>${esc(T('НДС 12 %', 'MwSt 12 %', 'VAT 12 %', 'ҚҚС 12 %'))}</td><td style="text-align:right">${tg(st.vat)}</td></tr></tbody></table></div>
<div class="card card-body"><div class="actbar">${st.posted ? chip('green', T('внесено в выписку ', 'gebucht ', 'posted ', 'енгізілді ') + st.posted.t) : `<button class="btn primary" data-act="slaPost">${esc(T('Внести пени в выписку', 'Pönalen in den Auszug buchen', 'Post penalties to the statement', 'Айыппұлдарды үзіндіге енгізу'))}</button>`}<span class="note" style="align-self:center">${esc(T('Строки в споре показаны, но не удерживаются до решения; внести можно только зафиксированный месяц.', 'Strittige Zeilen werden gezeigt, aber bis zur Entscheidung nicht abgezogen; buchen lässt sich nur ein festgeschriebener Monat.', 'Disputed lines are shown but not deducted until resolved; only a frozen month can be posted.', 'Даулы жолдар көрсетіледі, бірақ шешімге дейін ұсталмайды; тек бекітілген айды енгізуге болады.'))}</span></div></div>`;
  }
  addTab('reports', 'sla', T('SLA · KDL Olymp', 'SLA · KDL Olymp', 'SLA · KDL Olymp', 'SLA · KDL Olymp'), reportBody, { badge: () => slaPenalty(CUR).lines.filter(x => x.st === 'due' || x.st === 'disputed').length || '' });
  addTab('billing', 'sla', T('Выписка SLA', 'SLA-Auszug', 'SLA statement', 'SLA үзіндісі'), statementBody, { perm: 'costs:read' });
  const err = m => { const e = document.getElementById('sla_err'); if (e) e.textContent = m; toast(m, 'err'); };
  Object.assign(ACT, {
    slaM: d => { SL.month = d.v; S.slaDis = null; render(); },
    slaRules: () => { RULES.cur = 'sla'; go('settings'); setTab('settings', 'rules'); },
    slaDis: d => { S.slaDis = d.k; render(); const t = document.getElementById('sla_reason'); if (t) t.focus(); },
    slaDisX: () => { S.slaDis = null; render(); },
    slaDisGo: () => { const r = slaDispute(SL.month, S.slaDis, (document.getElementById('sla_reason') || {}).value || ''); if (r) return err(r); S.slaDis = null; toast(T('Спор открыт — пеня не удерживается до решения', 'Streit eröffnet — Pönale bis zur Entscheidung nicht abgezogen', 'Dispute opened — penalty held until resolved', 'Дау ашылды')); },
    slaRes: d => { const r = slaResolve(SL.month, d.k, d.v); if (r) return toast(r, 'err'); toast(T('Спор закрыт', 'Streit geschlossen', 'Dispute closed', 'Дау жабылды')); },
    slaFreeze: () => { const r = slaFreeze(SL.month); if (r) return toast(r, 'err'); toast(T('Замер зафиксирован', 'Messung festgeschrieben', 'Measurement frozen', 'Өлшем бекітілді')); },
    slaPost: () => { const r = slaPost(SL.month); if (r) return toast(r, 'err'); toast(T('Пени внесены в выписку', 'Pönalen gebucht', 'Penalties posted', 'Айыппұлдар енгізілді')); },
    slaCsv: () => { const p = slaPenalty(SL.month), rows = [['month', 'kpi', 'actual_pct', 'target_pct', 'shortfall_pts', 'calculated_kzt', 'cap_kzt', 'penalty_kzt', 'status', 'dispute_reason']].concat(p.lines.map(x => [p.m, x.k, x.val.toFixed(1), x.tgt, x.short, x.raw, x.cap, x.amt, x.st, x.disp ? x.disp.reason : '']));
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n')], { type: 'text/csv' })); a.download = 'sla-' + p.m + '.csv'; a.click(); },
  });
  document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.slam) { SL.month = e.target.value; S.slaDis = null; render(); } });
})();
