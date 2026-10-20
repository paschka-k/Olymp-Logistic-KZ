/* AI summary on every main screen (extends the "Toggle AI Summary" of the report cards): a ✦ button in the page head toggles a short
   advisory summary computed from the live state — counts, the worst case by name and one recommendation. Advisory only, like the AI
   assistant (spec 5.11): it never changes data. AISUM[screen] -> text; S.aiSum[screen] keeps the toggle per screen. */
(function () {
  const nf = n => LF.int(n);
  const rt = l => HUBS[l.from].city + ' → ' + HUBS[l.to].city;
  const act = () => S.loads.filter(isActive);
  const probl = () => S.loads.filter(l => l.status === 'problem' || tempState(l) === 'breach');
  const unassigned = () => S.loads.filter(l => l.status === 'unassigned');
  const freeT = () => S.trucks.filter(t => t.status === 'available');
  const openDevs = () => (S.devs || []).filter(d => d.step < 7);
  const invSt = i => i.paidAt ? 'paid' : new Date(i.due + 'T12:00:00+05:00') < NOW ? 'overdue' : 'pending';
  const expDocs = d => (d.docs || []).filter(x => (new Date(x.to) - NOW) / 864e5 < 60).length;
  const rec = t => T('Рекомендация: ', 'Empfehlung: ', 'Recommendation: ', 'Ұсыныс: ') + t;

  const AISUM = {
    dashboard() {
      const p = probl(), f = freeT();
      return T('Сейчас ', 'Aktuell ', 'Right now ', 'Қазір ') + act().length + T(' активных рейсов, из них с проблемой ', ' aktive Fahrten, davon mit Problem ', ' active loads, of which with a problem ', ' белсенді рейс, оның ішінде мәселесі бар ') + p.length
        + T('; открытых отклонений качества ', '; offene Qualitätsabweichungen ', '; open quality deviations ', '; ашық сапа ауытқулары ') + openDevs().length
        + T('; свободно ', '; frei ', '; available ', '; бос ') + f.length + ' / ' + S.trucks.length + T(' ТС. ', ' Fahrzeuge. ', ' trucks. ', ' КҚ. ')
        + (p.length ? rec(p[0].id + ' (' + rt(p[0]) + ') ' + T('вне диапазона — открыть плейбук тревоги и связаться с водителем.', 'außerhalb des Bereichs — Alarm-Playbook öffnen und den Fahrer kontaktieren.', 'is out of range — open the alarm playbook and contact the driver.', 'диапазоннан тыс — дабыл плейбугін ашып, жүргізушімен байланысыңыз.'))
          : rec(T('отклонений нет, можно выпускать запланированные рейсы.', 'keine Abweichungen, geplante Fahrten können freigegeben werden.', 'no deviations, planned loads can be released.', 'ауытқу жоқ, жоспарлы рейстерді шығаруға болады.')));
    },
    orders() {
      const u = unassigned(), bk = (S.bookings || []).filter(b => b.status === 'new');
      return T('Заказов без назначения ', 'Aufträge ohne Zuweisung ', 'Unassigned orders ', 'Тағайындалмаған тапсырыстар ') + u.length + T(', в пути ', ', unterwegs ', ', in transit ', ', жолда ') + S.loads.filter(l => l.status === 'in_transit').length
        + T(', новых заявок с портала ', ', neue Portal-Anfragen ', ', new portal requests ', ', порталдан жаңа өтінімдер ') + bk.length + '. '
        + (u.length ? rec(T('назначить ', 'zuweisen: ', 'assign ', 'тағайындау: ') + u.map(l => l.id).join(', ') + T(' — свободных ТС: ', ' — freie Fahrzeuge: ', ' — free trucks: ', ' — бос КҚ: ') + freeT().length) : rec(T('все заказы назначены.', 'alle Aufträge sind zugewiesen.', 'every order is assigned.', 'барлық тапсырыс тағайындалған.')));
    },
    dispatch() {
      const u = unassigned(), d = S.drivers.filter(x => x.status === 'available'), f = freeT();
      return T('К назначению ', 'Zuzuweisen ', 'To assign ', 'Тағайындауға ') + u.length + T('; свободны ', '; frei ', '; available ', '; бос ') + d.length + T(' водителей и ', ' Fahrer und ', ' drivers and ', ' жүргізуші және ') + f.length + T(' ТС. ', ' Fahrzeuge. ', ' trucks. ', ' КҚ. ')
        + (u.length && d.length && f.length ? rec(T('запустить авто-назначение — совместимые пары есть.', 'Auto-Zuweisung starten — kompatible Paare sind da.', 'run Auto-Assign — compatible pairs exist.', 'авто-тағайындауды іске қосыңыз — үйлесімді жұптар бар.'))
          : u.length ? rec(T('своих мощностей не хватает — проверить партнёров.', 'eigene Kapazität reicht nicht — Partner prüfen.', 'own capacity is short — check the partners tab.', 'өз қуаты жетпейді — серіктестерді тексеріңіз.'))
            : rec(T('доска чистая, новых назначений не требуется.', 'die Tafel ist sauber, keine Zuweisungen nötig.', 'the board is clean, nothing to assign.', 'тақта таза, тағайындау қажет емес.')));
    },
    routes() {
      const live = S.loads.filter(l => l.status === 'in_transit' || l.status === 'problem'), crit = live.filter(l => l.status === 'problem' || tempState(l) === 'breach');
      return T('В движении ', 'Unterwegs ', 'Moving ', 'Жолда ') + live.length + T(' ТС, критичных ', ' Fahrzeuge, kritisch ', ' trucks, critical ', ' КҚ, сыни ') + crit.length + '. '
        + (crit.length ? rec(crit.map(l => trk(l.truck).plate + ' (' + l.id + ', ' + (l.temp > 0 ? '+' : '') + LF.dec(l.temp) + ' °C)').join('; ') + T(' — открыть карточку и действовать по плейбуку.', ' — Karte öffnen und nach Playbook handeln.', ' — open the card and follow the playbook.', ' — картаны ашып, плейбук бойынша әрекет етіңіз.'))
          : rec(T('все рейсы в графике и в температурном диапазоне.', 'alle Fahrten im Zeitplan und im Temperaturbereich.', 'every load is on schedule and in range.', 'барлық рейс кестеде және диапазонда.')));
    },
    fleet() {
      const svc = S.trucks.filter(t => t.status === 'service'), red = S.trucks.filter(t => t.health === 'red');
      return T('Парк ', 'Flotte ', 'Fleet ', 'Парк ') + S.trucks.length + T(': свободно ', ': frei ', ': available ', ': бос ') + freeT().length + T(', в рейсе ', ', im Einsatz ', ', in use ', ', рейсте ') + S.trucks.filter(t => t.status === 'busy').length + T(', в сервисе ', ', im Service ', ', in maintenance ', ', сервисте ') + svc.length + '. '
        + (red.length ? rec(T('у ', 'bei ', 'for ', '') + red.map(t => t.plate).join(', ') + T(' красный статус здоровья — запланировать сервис до следующего рейса.', ' roter Zustandsstatus — Service vor der nächsten Fahrt planen.', ' the health status is red — schedule maintenance before the next load.', ' денсаулық күйі қызыл — келесі рейске дейін сервис жоспарлаңыз.'))
          : rec(T('техника в порядке; держать 1 рефрижератор в резерве под экспресс.', 'Technik in Ordnung; einen Reefer als Express-Reserve halten.', 'equipment is fine; keep one reefer in reserve for express.', 'техника дұрыс; экспреске бір рефрижератор резервте ұстаңыз.')));
    },
    drivers() {
      const av = S.drivers.filter(d => d.status === 'available'), exp = S.drivers.filter(d => expDocs(d)), low = S.drivers.filter(d => d.rto <= 2);
      return T('Доступно ', 'Verfügbar ', 'Available ', 'Қолжетімді ') + av.length + ' / ' + S.drivers.length + T(' водителей; документы истекают в 60 дней у ', ' Fahrer; Dokumente laufen in 60 Tagen ab bei ', ' drivers; documents expire within 60 days for ', ' жүргізуші; 60 күнде құжаттары бітетіндер: ') + exp.length + '. '
        + (low.length ? rec(T('у ', 'bei ', 'for ', '') + low.map(d => d.name).join(', ') + T(' остаток времени вождения ≤ 2 ч — не ставить на дальние рейсы.', ' Restlenkzeit ≤ 2 h — nicht auf Fernfahrten einplanen.', ' remaining driving time is ≤ 2 h — do not plan long hauls.', ' жүргізу уақыты ≤ 2 сағ — алыс рейске қоймаңыз.'))
          : exp.length ? rec(T('продлить документы: ', 'Dokumente verlängern: ', 'renew the documents of ', 'құжаттарды ұзарту: ') + exp.map(d => d.name).join(', ') + '.')
            : rec(T('ограничений по персоналу нет.', 'keine Personal-Einschränkungen.', 'no staffing constraints.', 'персонал бойынша шектеу жоқ.')));
    },
    hubs() {
      const inb = (S.jobs || []).filter(j => !(j.ev && j.ev.en != null));
      return T('Хабов ', 'Hubs ', 'Hubs ', 'Хабтар ') + Object.keys(HUBS).length + T(', свободных рефрижераторов ', ', freie Reefer ', ', free reefers ', ', бос рефрижераторлар ') + freeT().filter(t => t.type === 'Reefer').length + T(', открытых приёмок ', ', offene Wareneingänge ', ', open receivings ', ', ашық қабылдаулар ') + inb.length + '. '
        + rec(T('следить за дверными событиями на рампах и часами простоя (Standgeld).', 'Türereignisse an den Rampen und die Standgeld-Uhr im Blick behalten.', 'watch ramp door events and the detention (Standgeld) clock.', 'рампадағы есік оқиғалары мен тұрып қалу сағатын бақылаңыз.'));
    },
    pod() {
      const q = S.loads.filter(l => l.status === 'delivered' && l.pod && l.pod !== 'none' && l.pod !== 'approved'), dv = openDevs();
      return T('В очереди POD ', 'In der POD-Warteschlange ', 'In the POD queue ', 'POD кезегінде ') + q.length + T(', открытых отклонений ', ', offene Abweichungen ', ', open deviations ', ', ашық ауытқулар ') + dv.length + '. '
        + (dv.length ? rec(T('начать с ', 'beginnen mit ', 'start with ', 'бастау: ') + dv.sort((a, b) => b.lvl - a.lvl)[0].id + T(' (наивысший уровень) — решение открывает счёт.', ' (höchste Stufe) — die Entscheidung gibt die Rechnung frei.', ' (highest level) — the decision releases the invoice.', ' (ең жоғары деңгей) — шешім шотты ашады.'))
          : q.length ? rec(T('подтвердить POD — после одобрения создаются счета.', 'POD bestätigen — nach Freigabe entstehen die Rechnungen.', 'approve the PODs — invoices are created on approval.', 'POD растаңыз — мақұлдаудан кейін шоттар жасалады.'))
            : rec(T('очередь пуста.', 'die Warteschlange ist leer.', 'the queue is empty.', 'кезек бос.')));
    },
    billing() {
      const inv = S.invoices || [], ov = inv.filter(i => invSt(i) === 'overdue'), dis = inv.filter(i => i.dispute && i.dispute.open);
      const sum = a => nf(a.reduce((s, i) => s + i.total, 0));
      return T('Счетов ', 'Rechnungen ', 'Invoices ', 'Шоттар ') + inv.length + T(', просрочено ', ', überfällig ', ', overdue ', ', мерзімі өткен ') + ov.length + ' (' + sum(ov) + ' ₸)' + T(', в споре ', ', im Disput ', ', disputed ', ', дауда ') + dis.length + '. '
        + (dis.length ? rec(T('сначала закрыть спор по ', 'zuerst den Disput klären zu ', 'resolve the dispute on ', 'алдымен дауды шешу: ') + dis[0].id + T(' — он блокирует отправку и оплату.', ' — er blockiert Versand und Zahlung.', ' — it blocks sending and payment.', ' — ол жіберу мен төлемді бұғаттайды.'))
          : ov.length ? rec(T('напомнить клиентам по просроченным счетам.', 'Kunden an die überfälligen Rechnungen erinnern.', 'remind the customers about the overdue invoices.', 'мерзімі өткен шоттар туралы еске салыңыз.'))
            : rec(T('дебиторка под контролем.', 'die Forderungen sind unter Kontrolle.', 'receivables are under control.', 'дебиторлық берешек бақылауда.')));
    },
    baseline() {
      const fr = (typeof ecoFr49 === 'function' ? ecoFr49() : { open: 0, total: 0 });
      return 'Fragenkatalog: ' + T('открытых вопросов к KDL ', 'offene Fragen an KDL ', 'open questions to KDL ', 'KDL-ге ашық сұрақтар ') + fr.open + ' / ' + fr.total + '. '
        + (fr.open ? rec(T('уточнить открытые вопросы — FR-49 держит запуск, пока все не закрыты.', 'die offenen Fragen klären — FR-49 hält den Start, bis alle geschlossen sind.', 'clarify the open questions — FR-49 holds the launch until all are closed.', 'ашық сұрақтарды нақтылаңыз — FR-49 іске қосуды ұстап тұр.'))
          : rec(T('вопросов нет — базовые данные подтверждены.', 'keine Fragen — die Basisdaten sind bestätigt.', 'no questions — the baseline is confirmed.', 'сұрақ жоқ — бастапқы деректер расталды.')));
    },
  };
  globalThis.AISUM = AISUM;
  S.aiSum = {};

  function decorate() {
    if (!AISUM[S.route] || !canSee(S.route)) return;
    const bar = $('.page-head .actions');
    if (bar && !$('.ai-sum-btn', bar)) bar.insertAdjacentHTML('afterbegin', `<button class="btn ${S.aiSum[S.route] ? 'primary' : 'grey'} sm ai-sum-btn" data-act="aiSum" aria-pressed="${S.aiSum[S.route] ? 'true' : 'false'}">✦ ${esc(T('AI-сводка', 'KI-Zusammenfassung', 'AI Summary', 'AI қорытынды'))}</button>`);
    const c = $('.content');
    if (S.aiSum[S.route] && c && !$('.aisum-page', c)) { let t; try { t = AISUM[S.route](); } catch (e) { t = ''; } if (t) c.insertAdjacentHTML('afterbegin', `<div class="aisum aisum-page" data-ai-sum="${S.route}">✦ ${esc(t)}</div>`); }
  }
  ACT.aiSum = () => { S.aiSum[S.route] = !S.aiSum[S.route]; render(); };
  HELP.afterRender.push(decorate);
})();
