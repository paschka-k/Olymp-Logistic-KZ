/* AI Ops Assistant (spec 5.11): advisory only. Recommendations are computed from the live rules (compat / temperature state / costs / invoices);
   every Accept / Dismiss / Override is written to the audit trail (GDP: who / when / why). Override needs a reason. */
(function () {
  const A = S.ai = { done: {}, exp: '', hist: false };
  const nf = n => Math.round(n).toLocaleString('ru-RU');
  const dec = s => (LANG === 'en' ? s : String(s).replace('.', ','));
  const rt = l => HUBS[l.from].city + ' → ' + HUBS[l.to].city;
  const esfOf = i => (i.load && load(i.load) ? load(i.load).esf : i.esf);
  const lvl = c => { const t = aiThr(); return c >= t.high ? 'high' : c >= t.medium ? 'medium' : 'low'; };
  const LV = { high: ['green', T('Высокая', 'Hoch', 'High', 'Жоғары')], medium: ['yellow', T('Средняя', 'Mittel', 'Medium', 'Орташа')], low: ['red', T('Низкая', 'Niedrig', 'Low', 'Төмен')] };
  const score = (l, d, t) => Math.max(35, Math.min(99, Math.round(72 + (d.rating - 4.5) * 30 + Math.min(d.rto - needRto(l), 4) * 3 - (t.cap - l.pallets) * 0.4)));

  function driverRecs() {
    const rank = { high: 0, medium: 1, low: 2 }, out = [];
    S.loads.filter(l => l.status === 'unassigned').sort((a, b) => rank[a.priority] - rank[b.priority] || a.eta.localeCompare(b.eta)).forEach(l => {
      let best = null;
      S.drivers.forEach(d => S.trucks.forEach(t => { if (!compat(l, d, t).length) { const s = score(l, d, t); if (!best || s > best.s) best = { d, t, s }; } }));
      out.push(best ? { key: 'dt:' + l.id, l, d: best.d, t: best.t, c: best.s } : { key: 'dt:' + l.id, l, c: 0 });
    });
    return out.filter(r => r.c === 0 || r.c >= aiThr().low).slice(0, 4);
  }
  function excRecs() {
    const out = [];
    S.loads.filter(l => ['loading', 'in_transit', 'problem'].includes(l.status) && tempState(l) !== 'ok').forEach(l => out.push({ key: 'ex:' + l.id, l, sev: tempState(l) === 'breach' ? 'high' : 'mid' }));
    S.loads.filter(l => ['assigned', 'loading'].includes(l.status) && l.zone === 'ambient').forEach(l => out.push({ key: 'fx:' + l.id, l, sev: 'low', fc: true }));
    return out.slice(0, 4);
  }
  function leakRecs() {
    const out = [], det = S.costs.filter(c => c.cat === 'detention'), fuel = S.costs.filter(c => c.cat === 'fuel').reduce((s, c) => s + c.amount, 0);
    if (det.length) out.push({ key: 'lk:det', sub: T('Простои на рампах / Standgeld', 'Standzeiten an Rampen / Standgeld', 'Ramp detention / Standgeld', 'Рампадағы тұрып қалу / Standgeld'), amt: -det.reduce((s, c) => s + c.amount, 0), why: T('Начислено за ', 'Berechnet für ', 'Charged for ', 'Есептелген: ') + det.length + T(' приёмок сверх бесплатных 45 мин; проверьте, выставлено ли клиенту.', ' Wareneingänge über die freien 45 Min.; prüfen, ob dem Kunden berechnet.', ' receipts beyond the free 45 min; check whether it was billed to the customer.', ' қабылдау тегін 45 мин-тан асты; клиентке шығарылғанын тексеріңіз.'), go: 'cost' });
    if (fuel) out.push({ key: 'lk:fuel', sub: T('Холостой ход реф-агрегатов (оценка)', 'Leerlauf der Kühlaggregate (Schätzung)', 'Reefer unit idling (estimate)', 'Реф-агрегаттардың бос жүрісі (бағалау)'), amt: -Math.round(fuel * 0.08), why: T('≈ 8 % топлива уходит на стоянках с работающим агрегатом (оценка по телематике, демо).', '≈ 8 % des Kraftstoffs bei Stillstand mit laufendem Aggregat (Telematik-Schätzung, Demo).', '≈ 8 % of fuel burns while parked with the unit running (telematics estimate, demo).', 'Отынның ≈ 8 % агрегат жұмыс істеп тұрғанда кетеді (телематика бағасы, демо).'), go: 'cost' });
    const back = []; S.loads.filter(l => l.status === 'delivered').forEach(dl => S.loads.filter(u => u.status === 'unassigned' && u.from === dl.to && !back.some(b => b.u === u)).slice(0, 1).forEach(u => back.push({ dl, u })));
    back.slice(0, 2).forEach(b => out.push({ key: 'lk:bh:' + b.u.id, sub: T('Порожний возврат · ', 'Leerrückfahrt · ', 'Empty return · ', 'Бос қайту · ') + HUBS[b.dl.to].city, amt: Math.round(revenue(b.u) * 0.5), why: T('Рейс ', 'Fahrt ', 'Load ', 'Рейс ') + b.dl.id + T(' вернулся порожним, а рейс ', ' kam leer zurück, während Fahrt ', ' returned empty while load ', ' бос қайтты, ал рейс ') + b.u.id + ' (' + rt(b.u) + T(') ждёт назначения.', ') wartet.', ') is waiting.', ') тағайындауды күтуде.'), go: 'dispatch' }));
    return out.slice(0, 4);
  }
  function anomRecs() {
    const out = [], seen = {};
    S.invoices.forEach(i => {
      const e = esfOf(i), paid = !!i.paidAt, k = i.cust + '|' + i.route + '|' + i.total;
      if (seen[k]) out.push({ key: 'an:dup:' + i.id, i, sub: T('Дубликат счёта · ', 'Doppelte Rechnung · ', 'Duplicate invoice · ', 'Шот қайталануы · ') + i.id, amt: -i.total, why: T('Тот же клиент, маршрут и сумма, что в ', 'Gleicher Kunde, Route und Betrag wie ', 'Same customer, route and amount as ', 'Сол клиент, маршрут және сома: ') + seen[k] + '.' }); seen[k] = i.id;
      if (i.dispute && i.dispute.open && e === 'confirmed') out.push({ key: 'an:dis:' + i.id, i, sub: T('ЭСФ подтверждена при открытом споре · ', 'ESF bestätigt bei offenem Streit · ', 'ESF confirmed while dispute is open · ', 'Дау ашық кезде ЭШФ расталған · ') + i.id, amt: -i.total, why: T('Клиент оспаривает температуру; может потребоваться корректировочная ЭСФ.', 'Kunde bestreitet Temperatur; ggf. Korrektur-ESF nötig.', 'Customer disputes temperature; a corrective ESF may be needed.', 'Клиент температураны дауласады; түзету ЭШФ қажет болуы мүмкін.') });
      if (e === 'rejected') out.push({ key: 'an:rej:' + i.id, i, sub: T('ЭСФ отклонена · ', 'ESF abgelehnt · ', 'ESF rejected · ', 'ЭШФ қабылданбады · ') + i.id, amt: 0, rev: 1, why: T('Выпишите заново и согласуйте с клиентом.', 'Neu ausstellen und mit Kunde abstimmen.', 'Re-issue and align with the customer.', 'Қайта жазып, клиентпен келісіңіз.') });
      else if (paid && (e === 'none' || e === 'issued')) out.push({ key: 'an:pnoesf:' + i.id, i, sub: T('Оплачен без подтверждённой ЭСФ · ', 'Bezahlt ohne bestätigte ESF · ', 'Paid without confirmed ESF · ', 'Расталған ЭШФ-сіз төленген · ') + i.id, amt: 0, rev: 1, why: T('Платёж получен, а ЭСФ в статусе «', 'Zahlung erhalten, ESF-Status „', 'Payment received but ESF status is “', 'Төлем алынды, ал ЭШФ күйі «') + (e === 'none' ? T('нет', 'keine', 'none', 'жоқ') : T('выписана', 'ausgestellt', 'issued', 'жазылды')) + '».' });
      if (i.zone !== 'ambient' && !i.lines.some(x => x.type === 'reefer')) out.push({ key: 'an:ref:' + i.id, i, sub: T('Нет реф-доплаты · ', 'Kein Kühlzuschlag · ', 'Missing reefer surcharge · ', 'Реф-үстеме жоқ · ') + i.id, amt: Math.round(i.net * 0.18), why: T('Температурный груз без строки доплаты.', 'Temperaturgeführte Ladung ohne Zuschlagszeile.', 'Temperature-controlled cargo without a surcharge line.', 'Температуралы жүкте үстеме жолы жоқ.') });
      if (Math.abs(i.vat - Math.round(i.net * 0.12)) > 1) out.push({ key: 'an:vat:' + i.id, i, sub: T('НДС ≠ 12 % · ', 'MwSt ≠ 12 % · ', 'VAT ≠ 12 % · ', 'ҚҚС ≠ 12 % · ') + i.id, amt: 0, rev: 1, why: T('Проверьте расчёт НДС.', 'MwSt-Berechnung prüfen.', 'Check the VAT calculation.', 'ҚҚС есебін тексеріңіз.') });
    });
    return out.slice(0, 5);
  }

  const dismissBtn = key => `<button class="btn sm dismiss" data-act="aiDis" data-k="${esc(key)}">Dismiss</button>`;
  const doneRow = (r, label) => `<div class="rec done"><div class="t"><b>${esc(label)}</b>${chip('gray', A.done[r.key])}</div></div>`;
  const head = (mod, ic_, tint, title, src) => `<div class="card-head"><span class="itile ${tint}">${ic(ic_, 18)}</span><h3>${esc(title)}</h3>${chip('gray', 'Data Source: ' + src)}</div>`;
  const off = (m) => `<div class="ai-body"><p class="note">${esc(T('Модуль отключён в Settings → AI & Automation.', 'Modul in Settings → AI & Automation deaktiviert.', 'Module is switched off in Settings → AI & Automation.', 'Модуль Settings → AI & Automation бөлімінде өшірілген.'))} <a class="lnk" data-act="aiSet">${esc(T('Открыть', 'Öffnen', 'Open', 'Ашу'))}</a></p></div>`;
  const none = () => `<p class="note">${esc(T('Сейчас рекомендаций нет.', 'Derzeit keine Empfehlungen.', 'No recommendations right now.', 'Қазір ұсыныс жоқ.'))}</p>`;
  const money = a => a === 0 ? '' : `<span class="amt" style="color:${a < 0 ? 'var(--label-red)' : 'var(--ok-text)'}">${a < 0 ? '−' : '+'}${nf(Math.abs(a))} ₸</span>`;

  function card1() {
    if (!aiOn('match')) return off();
    const rs = driverRecs(), body = rs.map(r => {
      const l = r.l, tag = `${l.id} · ${rt(l)} · ${ZONES[l.zone].label}`;
      if (A.done[r.key]) return doneRow(r, tag);
      if (!r.d) return `<div class="rec"><div class="t"><b>${esc(tag)}</b>${chip('red', T('нет допустимой пары', 'kein zulässiges Paar', 'no eligible pair', 'жарамды жұп жоқ'))}</div><p class="why">${esc(T('Проверьте РТО, документы водителей и поверку датчиков.', 'RTO, Fahrerdokumente und Sensorkalibrierung prüfen.', 'Check RTO, driver documents and sensor calibration.', 'РТО, құжаттар мен датчик поверкасын тексеріңіз.'))}</p><div class="btns">${dismissBtn(r.key)}</div></div>`;
      const lv = LV[lvl(r.c)], ex = A.exp === r.key;
      return `<div class="rec"><div class="t"><div><b>${esc(r.d.name)} → ${esc(r.t.plate)}</b><div class="sub">${esc(tag)}</div></div><div>${chip(lv[0], lv[1] + ' · ' + r.c + '%')}</div></div>
<p class="why">${esc(T('Допуск', 'Zulassung', 'Eligibility', 'Рұқсат'))}: ✓ | RTO: ${dec(r.d.rto)} ${esc(T('ч', 'Std.', 'h', 'сағ'))} / ${dec(needRto(l).toFixed(1))} | ${esc(T('Рейтинг', 'Bewertung', 'Rating', 'Рейтинг'))}: ${dec(r.d.rating)}/5 | ${esc(T('Поверка', 'Kalibrierung', 'Calibration', 'Поверка'))}: ${esc(DOCST[docState(r.t.docs.calib)].l)}</p>
${ex && CFG.cur.ai.expl ? `<p class="why"><i>${esc(T('Почему: ТС поддерживает зону ', 'Warum: Fahrzeug unterstützt Zone ', 'Why: truck supports zone ', 'Неге: КҚ аймақты қолдайды '))}${ZONES[l.zone].label}${esc(T(', вместимость ', ', Kapazität ', ', capacity ', ', сыйымдылық '))}${r.t.cap} ≥ ${l.pallets}${esc(T(' пал.; минимальный запас вместимости среди допустимых.', ' Pal.; geringste Überkapazität unter den zulässigen.', ' pallets; smallest spare capacity among eligible trucks.', ' паллет; жарамдылар ішінде ең аз артық сыйымдылық.'))}</i></p>` : ''}
<div class="btns"><button class="btn sm green" data-act="aiAcc" data-k="${r.key}">Accept</button>${dismissBtn(r.key)}<button class="btn sm amber" data-act="aiOvr" data-k="${r.key}">Override</button>${CFG.cur.ai.expl ? `<a class="lnk" style="margin-left:auto;font-size:12px" data-act="aiExp" data-k="${r.key}">${ex ? '⌃' : '⌄'}</a>` : ''}</div></div>`;
    }).join('');
    return `<div class="ai-body">${body || none()}</div>`;
  }
  function card2() {
    if (!aiOn('exc')) return off();
    const body = excRecs().map(r => {
      const l = r.l, hint = r.fc ? T('Прогноз заморозков ночью: риск выхода за +15…+25 °C', 'Nachtfrost-Prognose: Risiko außerhalb +15…+25 °C', 'Overnight frost forecast: risk of leaving +15…+25 °C', 'Түнгі аяз болжамы: +15…+25 °C-тан шығу қаупі') : tempState(l) === 'breach' ? T('Температура ', 'Temperatur ', 'Temperature ', 'Температура ') + dec(l.temp) + ' °C ' + T('вне диапазона ', 'außerhalb ', 'outside ', 'тыс ') + ZONES[l.zone].label : T('Температура ', 'Temperatur ', 'Temperature ', 'Температура ') + dec(l.temp) + ' °C ' + T('у границы диапазона ', 'nahe der Grenze ', 'near the limit of ', 'шекке жақын ') + ZONES[l.zone].label;
      if (A.done[r.key]) return doneRow(r, l.id + ' · ' + rt(l));
      const rk = r.sev === 'high' ? ['red', T('Высокий риск', 'Hohes Risiko', 'High risk', 'Жоғары қауіп')] : r.sev === 'mid' ? ['yellow', T('Средний риск', 'Mittleres Risiko', 'Medium risk', 'Орташа қауіп')] : ['green', T('Низкий риск', 'Geringes Risiko', 'Low risk', 'Төмен қауіп')];
      const d = drv(l.driver);
      return `<div class="rec risk-card ${r.sev === 'high' ? 'high' : r.sev === 'mid' ? 'mid' : ''}"><div class="t"><span><b>${l.id} · ${esc(rt(l))}</b></span><span>${chip(rk[0], rk[1])}</span></div><p class="why">${esc(hint)}${d ? ' · ' + esc(d.name) : ''}</p>
<div class="btns"><button class="btn sm green" data-act="aiNotify" data-k="${r.key}">Notify customer</button>${r.fc ? '' : `<button class="btn sm primary" data-act="aiReroute" data-k="${r.key}">${esc(T('В ближайший хаб', 'Zum nächsten Hub', 'Reroute to nearest hub', 'Жақын хабқа'))}</button>`}${d ? `<button class="btn sm grey" data-act="aiCall" data-k="${r.key}">${esc(T('Позвонить', 'Anrufen', 'Call driver', 'Қоңырау'))}</button>` : ''}${dismissBtn(r.key)}</div></div>`;
    }).join('');
    return `<div class="ai-body">${body || none()}</div>`;
  }
  function card3() {
    if (!aiOn('leak')) return off();
    const body = leakRecs().map(r => A.done[r.key] ? doneRow(r, r.sub) : `<div class="rec"><div class="t"><b>${esc(r.sub)}</b>${money(r.amt)}</div><p class="why">${esc(r.why)}</p><div class="btns"><button class="btn sm primary" data-act="aiGo" data-k="${r.key}" data-v="${r.go}">${esc(r.go === 'dispatch' ? T('Найти обратную загрузку', 'Rückladung suchen', 'Find backhaul', 'Кері жүк табу') : T('Проверить затраты', 'Kosten prüfen', 'Review costs', 'Шығыстарды тексеру'))}</button>${dismissBtn(r.key)}</div></div>`).join('');
    return `<div class="ai-body">${body || none()}</div>`;
  }
  function card4() {
    if (!aiOn('anom')) return off();
    const body = anomRecs().map(r => A.done[r.key] ? doneRow(r, r.sub) : `<div class="rec"><div class="t"><b>${esc(r.sub)}</b>${r.rev ? `<span class="amt" style="color:#b7791f">Review</span>` : money(r.amt)}</div><p class="why">${esc(r.why)}</p><div class="btns"><button class="btn sm primary" data-act="aiInv" data-k="${r.key}" data-id="${r.i.id}">${esc(T('Открыть счёт', 'Rechnung öffnen', 'Open invoice', 'Шотты ашу'))}</button>${dismissBtn(r.key)}</div></div>`).join('');
    return `<div class="ai-body">${body || none()}</div>`;
  }
  SCREENS.ai = {
    title: () => navLabel('ai'),
    sub: () => T('Поддержка решений и операционные подсказки', 'Entscheidungsunterstützung und operative Hinweise', 'Decision Support & Operational Insights', 'Шешімдерді қолдау және операциялық кеңестер'),
    actions: () => `<button class="btn grey" data-act="aiHist">⟲ View History</button><button class="btn primary" data-act="aiSet">${ic('cog')} AI Settings</button>`,
    body: () => `<div class="banner-ai ai-banner">⚠ ${esc(T('AI предлагает, не выполняет. Решения принимает диспетчер/QA (GDP): AI не назначает рейсы, не перемещает грузы и не проводит финансовые операции сам.', 'KI schlägt vor, führt nicht aus. Entscheidungen treffen Disponent/QA (GDP): KI weist keine Fahrten zu, bewegt keine Ladung und führt keine Finanzaktionen selbst aus.', 'AI assists operations. It does not auto-dispatch, move loads, or execute financial actions. All decisions remain human-controlled (dispatcher / QA, GDP).', 'AI ұсынады, орындамайды. Шешімді диспетчер/QA (GDP) қабылдайды: AI рейс тағайындамайды, жүкті жылжытпайды, қаржы операцияларын өзі жасамайды.'))}</div>
<div class="ai-grid"><div class="card ai-card">${head('', 'user', 'blue', T('Подбор водитель–реф-юнит', 'Fahrer–Kühlfahrzeug', 'Driver–Reefer Suggestions', 'Жүргізуші–реф-юнит'), 'Dispatch')}${card1()}</div>
<div class="card ai-card">${head('', 'therm', 'red', T('Риск температурного отклонения', 'Risiko Temperaturabweichung', 'Temperature-Excursion Risk', 'Температура ауытқуы қаупі'), 'Routes')}${card2()}</div>
<div class="card ai-card">${head('', 'chart', 'yellow', T('Утечки затрат', 'Kostenlecks', 'Cost Leak Detection', 'Шығын ағып кетуі'), 'Fleet | Billing')}${card3()}</div>
<div class="card ai-card">${head('', 'receipt', 'green', T('Аномалии ЭСФ и счетов', 'ESF-/Rechnungsanomalien', 'ESF & Invoice Anomalies', 'ЭШФ және шот ауытқулары'), 'Billing')}${card4()}</div></div>
<div class="card" id="audit-trail"><div class="card-head" style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px"><h3 style="margin:0;font-size:15px">Audit Trail · ${S.audit.length}</h3><a class="lnk" data-act="aiHist">${esc(A.hist ? T('Скрыть', 'Ausblenden', 'Hide', 'Жасыру') : T('Показать последние действия', 'Letzte Aktionen zeigen', 'Show Recent Actions', 'Соңғы әрекеттер'))}</a></div>${A.hist ? `<div class="tcard">${auditTable()}</div>` : ''}</div>`,
  };
  const find = key => [].concat(driverRecs(), excRecs(), leakRecs(), anomRecs()).find(r => r.key === key);
  const mark = (key, label) => { A.done[key] = label; };
  const mod = k => k.startsWith('dt') ? 'AI · ' + T('Водитель–ТС', 'Fahrer–Fzg.', 'Driver–truck', 'Жүргізуші–КҚ') : k.startsWith('ex') || k.startsWith('fx') ? 'AI · ' + T('Температура', 'Temperatur', 'Temperature', 'Температура') : k.startsWith('lk') ? 'AI · ' + T('Затраты', 'Kosten', 'Costs', 'Шығыс') : 'AI · ' + T('ЭСФ / счета', 'ESF / Rechnungen', 'ESF / invoices', 'ЭШФ / шоттар');
  const subj = r => r.l ? r.l.id : r.i ? r.i.id : r.sub;
  DRAWERS.aiOvr = d => { const r = find(d.k); if (!r) return { title: 'Override', html: '' }; const l = r.l;
    return { title: 'Override · ' + l.id, html: `<div class="drawer-section"><p class="note">${esc(T('Вы заменяете рекомендацию AI. Причина обязательна и попадёт в журнал GDP.', 'Sie ersetzen die KI-Empfehlung. Begründung ist Pflicht und geht ins GDP-Protokoll.', 'You are replacing the AI recommendation. A reason is mandatory and goes to the GDP log.', 'Сіз AI ұсынысын ауыстырып жатырсыз. Себеп міндетті, GDP журналына жазылады.'))}</p>
<label class="fl">${esc(T('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'))}<select class="select" id="ov_d">${S.drivers.map(x => `<option value="${x.id}"${r.d && x.id === r.d.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
<label class="fl">${esc(T('ТС', 'Fahrzeug', 'Truck', 'КҚ'))}<select class="select" id="ov_t">${S.trucks.map(x => `<option value="${x.id}"${r.t && x.id === r.t.id ? ' selected' : ''}>${esc(x.plate)} · ${esc(x.model)}</option>`).join('')}</select></label>
<label class="fl">${esc(T('Причина', 'Grund', 'Reason', 'Себебі'))}<textarea class="ta" id="ov_r" rows="3"></textarea></label><p class="note" id="ov_e" style="color:var(--chip-red-fg)"></p><button class="btn amber block" data-act="aiOvrGo" data-k="${d.k}">Override</button></div>` }; };
  Object.assign(ACT, {
    aiExp: d => { A.exp = A.exp === d.k ? '' : d.k; render(); },
    aiAcc: d => { const r = find(d.k); if (!r) return; const err = assign(r.l.id, r.d.id, r.t.id); if (err) return toast(err, 'err'); audit(mod(d.k), r.l.id + ' → ' + r.d.name + ' / ' + r.t.plate, 'Accept', ''); toast(T('Принято: назначение выполнено диспетчером', 'Akzeptiert: Zuweisung durch Disponent', 'Accepted: assignment made by the dispatcher', 'Қабылданды: диспетчер тағайындады')); },
    aiDis: d => { const r = find(d.k); if (!r) return; mark(d.k, T('Отклонено', 'Abgelehnt', 'Dismissed', 'Қабылданбады')); audit(mod(d.k), subj(r), 'Dismiss', ''); render(); },
    aiOvr: d => openDrawer({ type: 'aiOvr', k: d.k }),
    aiOvrGo: d => { const r = find(d.k), why = ($('#ov_r') || {}).value.trim(); if (!why) { $('#ov_e').textContent = T('Укажите причину', 'Grund angeben', 'A reason is required', 'Себепті көрсетіңіз'); return; }
      const dr = drv($('#ov_d').value), tr = trk($('#ov_t').value), err = assign(r.l.id, dr.id, tr.id); if (err) { $('#ov_e').textContent = err; return; }
      audit(mod(d.k), r.l.id + ' → ' + dr.name + ' / ' + tr.plate, 'Override', why); S.drawer = null; toast(T('Override записан в журнал', 'Override protokolliert', 'Override recorded in the log', 'Override журналға жазылды')); },
    aiNotify: d => { const r = find(d.k); if (!r) return; r.l.notes.push({ who: 'AI/' + 'Sarah J.', t: (d => p2(d.getHours()) + ':' + p2(d.getMinutes()))(clockNow()), text: T('Клиент уведомлён о температурном риске', 'Kunde über Temperaturrisiko informiert', 'Customer notified about temperature risk', 'Клиентке температура қаупі туралы хабарланды') }); mark(d.k, T('Клиент уведомлён', 'Kunde informiert', 'Customer notified', 'Клиентке хабарланды')); audit(mod(d.k), r.l.id, 'Notify customer', ''); toast(T('Клиент уведомлён', 'Kunde informiert', 'Customer notified', 'Клиентке хабарланды')); },
    aiReroute: d => { const r = find(d.k); if (!r) return; const hubs = Object.keys(HUBS).filter(h => h !== r.l.from).sort((a, b) => dist(r.l.to, a) - dist(r.l.to, b)); r.l.notes.push({ who: 'Sarah J.', t: (d => p2(d.getHours()) + ':' + p2(d.getMinutes()))(clockNow()), text: T('Заход в ближайший холодный хаб: ', 'Umleitung zum nächsten Kühlhub: ', 'Diverted to nearest cold hub: ', 'Жақын суық хабқа бұру: ') + HUBS[hubs[0]].name }); mark(d.k, T('Перенаправлен', 'Umgeleitet', 'Rerouted', 'Бағыт өзгертілді')); audit(mod(d.k), r.l.id, 'Reroute → ' + HUBS[hubs[0]].city, ''); toast(HUBS[hubs[0]].name); },
    aiCall: d => { const r = find(d.k); if (!r) return; audit(mod(d.k), r.l.id, 'Call driver', ''); toast(drv(r.l.driver).name + ' · ' + drv(r.l.driver).phone); },
    aiGo: d => { audit(mod(d.k), d.k, 'Review', ''); if (d.v === 'cost') ACT.bTab({ v: 'cost' }); go(d.v); },
    aiInv: d => { audit(mod(d.k), d.id, 'Review', ''); go('billing'); ACT.bTab({ v: 'inv' }); openDrawer({ type: 'inv', id: d.id }); },
    aiSet: () => { go('settings'); setTimeout(() => { const e = $('#sc-ai'); if (e) e.scrollIntoView({ block: 'start' }); }, 30); },
    aiHist: () => { A.hist = !A.hist; render(); if (A.hist) { const e = $('#audit-trail'); if (e) e.scrollIntoView({ block: 'nearest' }); } },
  });
})();
