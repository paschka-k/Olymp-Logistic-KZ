  /* ---- Goods receipt (screen 17): state in this.state.inbO[jobId], filters in inbF, saved views in inbSaved ---- */
  inbEff(j) {
    const o = (this.state.inbO || {})[j.id] || {};
    return { ...j, ev: { ...j.ev, ...o.ev }, chk: { ...j.chk, ...o.chk }, sd: o.sd || j.sd, delay: o.delay === undefined ? null : o.delay,
      reason: o.reason || '', booked: o.booked || 0, log: [...(o.log || []), ...j.log] };
  }
  inbCalc(j, now) {
    const ev = j.ev, st = ev.en != null ? 3 : ev.ci != null ? 2 : j.plan ? 1 : 0;
    const wins = j.stops.map(c => c.fix != null ? [c.fix, c.fix + INB_STEP] : c.w);
    const wFrom = Math.min(...wins.map(w => w[0])), wTo = Math.max(...wins.map(w => w[1]));
    const end = ev.en != null ? ev.en : now, dwell = ev.ci != null ? Math.max(0, end - ev.ci) : 0;
    const late = ev.ci != null ? end > wTo : now > wTo;
    const over = Math.max(0, dwell - j.free), blocks = Math.ceil(over / INB_STEP - 1e-9), amount = blocks * INB_RATE;
    const sum = k => j.stops.reduce((a, c) => a + c[k], 0), done = j.sd.filter(Boolean).length;
    const needCold = !!j.fl.tc && j.fl.tc !== '15–25', rng = INB_TR[j.fl.tc], t = j.chk.temp;
    const tempOk = t == null ? null : rng ? t >= rng[0] && t <= rng[1] : true;
    return { st, wins, wFrom, wTo, dwell, late, over, blocks, amount, kg: sum('kg'), m3: sum('m3'), pcs: sum('pcs'), done, needCold, tempOk,
      canStart: ev.rp != null && ev.st == null && (!needCold || (t != null && !!j.chk.lg)) };
  }
  inbBooked() { return Object.values(this.state.inbO || {}).reduce((a, o) => a + (o.booked || 0), 0); }
  inbBookedN() { return Object.values(this.state.inbO || {}).filter(o => o.booked).length; }
  inbSet(j, fn, text, toast) {
    this.setState(x => {
      const now = INB_NOW0 + x.t * 2 / 60, all = x.inbO || {}, o = all[j.id] || {}, p = fn(now, o);
      const n = { ...o, ...p, ev: { ...o.ev, ...p.ev }, chk: { ...o.chk, ...p.chk } };
      if (text) n.log = [{ t: hmm(now), by: INB_OP[j.hub], text }, ...(o.log || [])];
      return { inbO: { ...all, [j.id]: n } };
    });
    if (text) this.log(X('Приёмка · ', 'Wareneingang · ', 'Goods receipt · ') + j.id + ' · ' + text);
    if (toast) this.showToast(toast);
  }
  inbVals() {
    const s = this.state, hub = s.inbHub || (s.hub === 'alm' ? 'alm' : 'ast'), now = INB_NOW0 + s.t * 2 / 60;
    const MIN = X('мин', 'min', 'min'), nfm = v => fmt(v, 1), pcsU = X('мест', 'Stück', 'pcs');
    const EMPTY = { st: '', prio: '', dir: '', flag: '', q: '', cur: false };
    const F = { ...EMPTY, ...(s.inbF || { cur: true }) }, vName = s.inbVn === undefined ? X('Актуальные', 'Aktuell', 'Current') : s.inbVn;
    const byName = b => ({ S: X('Система', 'System', 'System'), D: INB_OP.ast, T: INB_OP.alm, O: X('Диспетчер хаба', 'Hub-Disponent', 'Hub dispatcher'), Q: X('Качество (QA)', 'Qualität (QA)', 'Quality (QA)') })[b] || b;
    const ST = [
      { k: 'ord', label: X('Заказан', 'bestellt', 'ordered'), c: { bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-800)', bc: 'var(--color-neutral-400)' } },
      { k: 'plan', label: X('Запланирован', 'geplant', 'planned'), c: { bg: 'var(--color-accent-100)', fg: 'var(--color-accent-900)', bc: 'var(--color-accent-400)' } },
      { k: 'gate', label: X('На воротах', 'am Tor', 'at gate'), c: C_WARN },
      { k: 'done', label: X('Выгружен', 'entladen', 'unloaded'), c: C_OK }
    ];
    const FLAGS = [
      ['fix', X('Срок', 'Termin', 'Slot'), X('Термингут: фиксированный срок поставки', 'Termingut: fester Liefertermin', 'Time-critical: fixed delivery slot'), { bg: 'var(--color-accent-100)', fg: 'var(--color-accent-900)', bc: 'var(--color-accent-500)' }],
      ['adr', X('ДОПОГ', 'ADR', 'ADR'), X('Опасный груз (ДОПОГ / ADR, UN 1845)', 'Gefahrgut (ADR, UN 1845)', 'Dangerous goods (ADR, UN 1845)'), C_RISK],
      ['short', X('Дефицит', 'Engpass', 'Short'), X('Дефицитная позиция / узкое место в запасе', 'Engpassartikel im Bestand', 'Shortage item in stock'), C_WARN],
      ['block', X('QA-блок', 'QA-Sperre', 'QA hold'), X('Блокировка качества: партия не выпущена', 'Qualitätssperre: Charge nicht freigegeben', 'Quality hold: lot not released'), C_BAD],
      ['cust', X('Таможня', 'Zoll', 'Customs'), X('Импорт: таможенное оформление', 'Import: Zollabfertigung', 'Import: customs clearance'), { bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-900)', bc: 'var(--color-neutral-500)' }],
      ['gdp', 'GDP', X('Груз под GDP: контроль цепи и документы', 'GDP-Ware: Kette und Dokumente prüfen', 'GDP goods: chain and document control'), C_OK]
    ];
    const DOC = { ok: [C_OK, X('есть', 'vorhanden', 'present')], pend: [C_WARN, X('ожидается', 'erwartet', 'pending')], miss: [C_BAD, X('отсутствует', 'fehlt', 'missing')] };
    const flagChips = j => {
      const out = FLAGS.filter(f => j.fl[f[0]]).map(f => ({ t: f[1], title: f[2], bg: f[3].bg, fg: f[3].fg, bc: f[3].bc }));
      if (j.fl.tl) out.push({ t: j.fl.tl, title: X('Температурный класс: ', 'Temperaturklasse: ', 'Temperature class: ') + j.fl.tl, bg: 'var(--color-accent-100)', fg: 'var(--color-accent-900)', bc: 'var(--color-accent-400)' });
      [['esf', X('ЭСФ', 'ЭСФ', 'ESF')], ['esu', X('ЭСУТД', 'ЭСУТД', 'ESUTD')]].forEach(([k, t]) => { const d = DOC[j.fl[k]]; out.push({ t, title: t + ' · ' + d[1], bg: d[0].bg, fg: d[0].fg, bc: d[0].bc }); });
      return out;
    };
    const winTxt = c => c.fix != null ? X('Фикс-срок ', 'Fixtermin ', 'Fixed slot ') + hmm(c.fix) : hmm(c.w[0]) + '–' + hmm(c.w[1]) + ' (' + (c.w[1] - c.w[0]) + ' ' + MIN + ')';
    const carrierOf = j => j.carrier ? inbPN(j.carrier) : X('Собственный парк', 'Eigener Fuhrpark', 'Own fleet');
    const sc = x => x == null ? X('не измерено', 'nicht gemessen', 'not measured') : x;

    const all = INBJ.filter(j => j.hub === hub).map(j => { const e = this.inbEff(j); return { e, c: this.inbCalc(e, now) }; });
    const statusKey = x => ST[x.c.st].k;
    const match = ({ e, c }) => {
      if (F.st && statusKey({ c }) !== F.st) return false;
      if (F.prio && String(e.prio) !== F.prio) return false;
      if (F.dir && e.dir !== F.dir) return false;
      if (F.cur && c.st === 3 && e.ev.en < now - 60) return false;
      if (F.flag === 'late' && !c.late) return false;
      if (F.flag && F.flag !== 'late' && !(F.flag === 'temp' ? e.fl.tc : e.fl[F.flag])) return false;
      if (F.q) { const hay = [e.id, carrierOf(e), e.plate, ...e.snd.map(z => z.name)].join(' ').toLowerCase(); if (!hay.includes(F.q.toLowerCase())) return false; }
      return true;
    };
    const filtered = all.filter(match);
    const seg = (cur, val) => ({ bg: cur === val ? 'var(--color-accent)' : 'transparent', fg: cur === val ? 'var(--color-bg)' : 'var(--color-text)' });
    const setF = patch => this.setState(x => ({ inbF: { ...EMPTY, ...(x.inbF || { cur: true }), ...patch }, inbVn: '' }));
    const grp = (label, key, opts) => ({ label, opts: opts.map(([v, l]) => ({ label: l, go: () => setF({ [key]: v }), ...seg(F[key], v) })) });
    const inbFilters = [
      grp(X('Статус', 'Status', 'Status'), 'st', [['', X('все', 'alle', 'all')], ...ST.map(z => [z.k, z.label])]),
      grp(X('Приоритет', 'Prio', 'Priority'), 'prio', [['', X('все', 'alle', 'all')], ['1', 'P1'], ['2', 'P2'], ['3', 'P3']]),
      grp(X('Направление', 'Richtung', 'Direction'), 'dir', [['', X('все', 'alle', 'all')], ['in', '↓ ' + X('поставка', 'Anlieferung', 'delivery')], ['col', '↩ ' + X('сборный рейс', 'Sammellauf', 'collection')]]),
      grp(X('Признак', 'Merkmal', 'Feature'), 'flag', [['', X('все', 'alle', 'all')], ['late', X('просрочено', 'überfällig', 'overdue')], ['temp', X('холод', 'Kühlkette', 'cold chain')], ['adr', X('ДОПОГ', 'ADR', 'ADR')], ['fix', X('срок', 'Termin', 'slot')], ['block', X('QA-блок', 'Sperre', 'hold')], ['cust', X('таможня', 'Zoll', 'customs')]])
    ];
    const BV = [[X('Актуальные', 'Aktuell', 'Current'), { cur: true }], [X('Стандарт', 'Standard', 'Standard'), {}], [X('Просрочено', 'Überfällig', 'Overdue'), { flag: 'late' }], [X('Холодовая цепь', 'Kühlkette', 'Cold chain'), { flag: 'temp' }]];
    const views = [...BV.map(([n, f]) => ({ n, f, u: false })), ...(s.inbSaved || []).map(v => ({ n: v.n, f: v.f, u: true }))]
      .map(v => ({ label: (v.u ? '★ ' : '') + v.n, go: () => this.setState({ inbF: { ...EMPTY, ...v.f }, inbVn: v.n }), ...seg(vName, v.n) }));
    const saveView = () => { const n = (s.inbName || '').trim() || X('Вид ', 'Ansicht ', 'View ') + ((s.inbSaved || []).length + 1);
      this.setState(x => ({ inbSaved: [...(x.inbSaved || []).filter(v => v.n !== n), { n, f: { ...EMPTY, ...(x.inbF || { cur: true }) } }], inbVn: n, inbName: '' })); this.showToast(X('Вид сохранён: ', 'Ansicht gespeichert: ', 'View saved: ') + n); };
    const exportCsv = () => {
      const head = ['Job', 'Hub', 'Dir', 'Prio', 'Status', 'Carrier', 'Plate', 'Vehicle', 'Pickup', 'Senders', 'Stops', 'Window', 'CheckIn', 'End', 'Dwell_min', 'Free_min', 'Standgeld_KZT', 'Booked_KZT', 'Flags'];
      const rows = filtered.map(({ e, c }) => [e.id, hub, e.dir, e.prio, ST[c.st].label, carrierOf(e), e.plate || X('следует', 'folgt', 'follows'), e.veh, e.pick, e.snd.map(z => z.name).join(' | '),
        e.stops.map((z, i) => (i + 1) + ':' + inbRampName(hub, z.r) + ':' + z.kg + 'kg/' + z.m3 + 'm3/' + z.pcs).join(' | '), hmm(c.wFrom) + '-' + hmm(c.wTo),
        e.ev.ci != null ? hmm(e.ev.ci) : '', e.ev.en != null ? hmm(e.ev.en) : '', Math.round(c.dwell), e.free, c.amount, e.booked, flagChips(e).map(z => z.t).join(' ')]);
      const csv = [head, ...rows].map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\r\n');
      try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv' })); a.download = 'wareneingang-' + hub + '-0610.csv'; document.body.appendChild(a); a.click(); a.remove(); } catch (err) { /* preview without downloads */ }
      this.showToast(X('Экспорт: ', 'Export: ', 'Export: ') + filtered.length + X(' строк (CSV)', ' Zeilen (CSV)', ' rows (CSV)'));
    };

    const rows = filtered.map(({ e, c }) => {
      const stl = ST[c.st], pc = e.prio === 1 ? C_BAD : e.prio === 2 ? C_WARN : { bg: 'transparent', fg: 'var(--color-neutral-800)', bc: 'var(--color-neutral-400)' };
      const clock = c.late ? C_BAD : c.st === 3 ? C_OK : { bg: 'transparent', fg: 'var(--color-neutral-700)', bc: 'var(--color-neutral-400)' };
      const clockTitle = e.ev.ci != null ? INB_DAY + ' ' + hmm(e.ev.ci) + '–' + (e.ev.en != null ? hmm(e.ev.en) : hmm(now) + ' …') + ' (' + Math.round(c.dwell) + ' ' + MIN + ')'
        : X('Окно: ', 'Fenster: ', 'Window: ') + INB_DAY + ' ' + hmm(c.wFrom) + '–' + hmm(c.wTo) + (c.late ? X(' · не прибыл', ' · nicht eingetroffen', ' · not arrived') : '');
      const win = e.stops.length === 1 && e.stops[0].fix != null ? winTxt(e.stops[0]) : hmm(c.wFrom) + '–' + hmm(c.wTo) + ' (' + (c.wTo - c.wFrom) + ' ' + MIN + ')';
      return { id: e.id, sel: s.inbSel === e.id, bg: s.inbSel === e.id ? 'var(--color-accent-100)' : 'transparent',
        arrow: e.dir === 'in' ? '↓' : '↩', arrowTitle: e.dir === 'in' ? X('Поставка: производитель / партнёр → хаб', 'Anlieferung: Hersteller / Partner → Hub', 'Delivery: manufacturer / partner → hub') : X('Сборный рейс: филиалы → хаб', 'Sammellauf: Filialen → Hub', 'Collection run: branches → hub'),
        prio: 'P' + e.prio, pc, st: stl.label, stc: stl.c,
        src: e.src === 'col' ? X('сборный рейс на хаб', 'Sammellauf zum Hub', 'collection run to the hub') : X('партнёрская перевозка', 'Partnertransport', 'partner transport'),
        sub: X('Забор ', 'Abholung ', 'Pick-up ') + e.pick + ' · ' + carrierOf(e) + ' · ' + (e.plate || X('номер следует', 'Kennzeichen folgt', 'plate follows')) + ' · ' + e.veh + ' · Σ ' + nf(c.kg) + ' ' + U.kg + ' · ' + nfm(c.m3) + ' ' + U.m3 + ' · ' + c.pcs + ' ' + pcsU,
        plateMissing: !e.plate,
        snd: e.snd.map((z, i) => ({ t: (i + 1) + ' ' + z.ab, title: (i + 1) + ' · ' + z.name })),
        stops: e.stops.map((z, i) => { const d = e.sd[i]; return { t: (i + 1) + ' · ' + X('Р', 'R', 'R') + z.r, title: (i + 1) + ' · ' + inbRampName(hub, z.r) + ' · ' + (d ? X('выгружено', 'entladen', 'unloaded') : X('открыто', 'offen', 'open')) + ' · ' + nf(z.kg) + ' ' + U.kg,
          bg: d ? C_OK.bg : 'var(--color-neutral-100)', fg: d ? C_OK.fg : 'var(--color-neutral-700)', bc: d ? C_OK.bc : 'var(--color-neutral-400)' }; }),
        win, clockTitle, clockC: clock.fg, clockBg: clock.bg, clockBc: clock.bc, late: c.late, dwellTxt: e.ev.ci != null ? Math.round(c.dwell) + ' ' + MIN : '—',
        hasFee: c.amount > 0, fee: nf(c.amount) + ' ₸', flags: flagChips(e),
        open: () => this.setState({ inbSel: e.id }) };
    });

    const KP = (k, v, sub, l) => ({ k, v: String(v), sub, l });
    const lateN = all.filter(x => x.c.late && x.c.st >= 1).length, feeNow = all.reduce((a, x) => a + (x.e.booked ? 0 : (x.e.delay === false ? 0 : x.c.amount)), 0);
    const inbKpis = [
      KP(X('Ожидается', 'Erwartet', 'Expected'), all.filter(x => x.c.st < 2).length, X('заказаны и запланированы', 'bestellt und geplant', 'ordered and planned'), LV[0]),
      KP(X('На воротах / в разгрузке', 'Am Tor / in Entladung', 'At gate / unloading'), all.filter(x => x.c.st === 2).length, X('въезд зарегистрирован', 'Einfahrt erfasst', 'check-in recorded'), LV[1]),
      KP(X('Выгружено сегодня', 'Heute entladen', 'Unloaded today'), all.filter(x => x.c.st === 3).length, X('из ', 'von ', 'of ') + all.length + X(' рейсов', ' Aufträgen', ' jobs'), LV[0]),
      KP(X('Окно превышено', 'Fenster überschritten', 'Window exceeded'), lateN, X('красные часы в списке', 'rote Uhr in der Liste', 'red clock in the list'), LV[lateN ? 3 : 0]),
      KP(X('Standgeld к начислению', 'Standgeld offen', 'Demurrage open'), nf(feeNow) + ' ₸', X('после ответа «задержка по вине хаба»', 'nach Antwort „Verzögerung beim Hub“', 'after answer “delay on hub side”'), LV[feeNow ? 2 : 0]),
      KP(X('Записано в затраты', 'In Kosten gebucht', 'Booked to costs'), nf(this.inbBooked()) + ' ₸', this.inbBookedN() + X(' проводок · экран 16', ' Buchungen · Bildschirm 16', ' entries · screen 16'), LV[0])
    ];
    const hubTabs = ['ast', 'alm'].map(h => ({ label: INB_HUB[h], n: INBJ.filter(j => j.hub === h).length, go: () => this.setState({ inbHub: h, inbSel: null }), ...seg(hub, h) }));

    /* ---- side panel ---- */
    const sel = all.find(x => x.e.id === s.inbSel);
    let dr = null;
    if (sel) {
      const { e, c } = sel, ev = e.ev, stl = ST[c.st], rampN = e.stops[0].r;
      const tk = (t, now0) => t == null ? null : INB_DAY + ' ' + hmm(t);
      const proc = [
        { k: 'ci', label: X('Въезд · регистрация на КПП', 'Eingangsabfertigung · Anmeldung am Tor', 'Check-in · gate registration'), t: ev.ci, can: ev.ci == null, btn: X('Зарегистрировать въезд', 'Einfahrt erfassen', 'Record check-in'),
          go: () => this.inbSet(e, n => ({ ev: { ci: n } }), X('въезд на КПП зарегистрирован', 'Einfahrt am Tor erfasst', 'gate check-in recorded'), e.id + X(' · въезд зарегистрирован', ' · Einfahrt erfasst', ' · check-in recorded')) },
        { k: 'rp', label: X('Прибытие на рампу ', 'Ankunft an der Rampe · Rampe ', 'Arrival at the ramp · ramp ') + rampN, t: ev.rp, can: ev.ci != null && ev.rp == null, btn: X('Прибыл на рампу ', 'An Rampe ', 'At ramp ') + rampN,
          go: () => this.inbSet(e, n => ({ ev: { rp: n } }), X('прибытие на рампу ', 'Ankunft an Rampe ', 'arrived at ramp ') + rampN) },
        { k: 'st', label: X('Начало разгрузки', 'Entladung beginnen', 'Start unloading'), t: ev.st, can: c.canStart, btn: X('Начать разгрузку', 'Entladung beginnen', 'Start unloading'),
          go: () => this.inbSet(e, n => ({ ev: { st: n } }), X('начата разгрузка, рампа ', 'Entladung begonnen, Rampe ', 'unloading started, ramp ') + rampN) },
        { k: 'en', label: X('Конец разгрузки', 'Entladung beenden', 'Finish unloading'), t: ev.en, can: ev.st != null && ev.en == null, btn: X('Завершить разгрузку', 'Entladung beenden', 'Finish unloading'),
          go: () => this.inbSet(e, n => ({ ev: { en: n }, sd: e.sd.map(() => true) }), X('разгрузка завершена, все места приняты', 'Entladung beendet, alle Stellen angenommen', 'unloading finished, all stops received'), e.id + X(' · выгружен', ' · entladen', ' · unloaded')) }
      ].map(p => ({ ...p, time: p.t != null ? tk(p.t) : '—', has: p.t != null, bg: p.t != null ? C_OK.bg : 'transparent', bc: p.t != null ? C_OK.bc : 'var(--color-divider)', mark: p.t != null ? '✓' : '·', op: p.can ? 1 : 0.45 }));
      const coldHint = c.needCold && !c.canStart && ev.rp != null && ev.st == null ? X('Старт разгрузки заблокирован: считайте температуру и логгер', 'Start gesperrt: Temperatur und Logger erfassen', 'Start blocked: record temperature and logger') : '';
      const tmpl = { '2–8': '2–8 °C', '−20': '−20 °C', '15–25': '15–25 °C' };
      const ssOk = e.chk.ss != null && e.chk.ss === e.exp;
      const cold = {
        need: c.needCold, cls: tmpl[e.fl.tc] || '—', enabled: ev.ci != null, op: ev.ci != null ? 1 : 0.45,
        temp: e.chk.temp == null ? '' : String(e.chk.temp).replace('.', ','), tempShow: e.chk.temp == null ? X('не измерено', 'nicht gemessen', 'not measured') : fmt(e.chk.temp, 1) + ' °C',
        tl: c.tempOk === null ? LV[0] : c.tempOk ? LV[0] : LV[3], tempMsg: c.tempOk === null ? '' : c.tempOk ? X('в диапазоне', 'im Bereich', 'in range') : X('вне диапазона — создать отклонение', 'außerhalb — Abweichung anlegen', 'out of range — raise a deviation'),
        onTemp: ev2 => { const v = parseFloat(String(ev2.target.value).replace(',', '.')); this.inbSet(e, () => ({ chk: { temp: isNaN(v) ? null : v } }), isNaN(v) ? '' : X('фактическая температура прицепа: ', 'Ist-Temperatur Auflieger: ', 'trailer actual temperature: ') + fmt(v, 1) + ' °C'); },
        lg: e.chk.lg || X('не подключён', 'nicht übernommen', 'not attached'), hasLg: !!e.chk.lg,
        takeLg: () => { const h = [...e.id].reduce((a, ch) => a + ch.charCodeAt(0), 0), base = e.fl.tc === '−20' ? -21.3 : e.fl.tc === '2–8' ? 4.8 : 21.0;
          this.inbSet(e, o => ({ chk: { lg: 'LG-' + (30000 + h * 7 % 9000), temp: e.chk.temp == null ? base : e.chk.temp } }), X('логгер принят', 'Logger übernommen', 'logger attached')); },
        ssTxt: e.chk.ss == null ? X('сверка не запущена · ожидается ', 'Abgleich nicht gestartet · erwartet ', 'not started · expected ') + e.exp : e.chk.ss + ' / ' + e.exp + (ssOk ? '' : X(' · расхождение ', ' · Differenz ', ' · difference ') + (e.exp - e.chk.ss)),
        sl: e.chk.ss == null ? LV[0] : ssOk ? LV[0] : LV[3], ssBad: e.chk.ss != null && !ssOk,
        runSs: () => this.inbSet(e, () => ({ chk: { ss: e.exp - e.miss } }), X('сверка SSCC: ', 'SSCC-Abgleich: ', 'SSCC check: ') + (e.exp - e.miss) + ' / ' + e.exp, X('Сверка SSCC выполнена', 'SSCC-Abgleich durchgeführt', 'SSCC check done')),
        hint: coldHint
      };
      const stopsT = e.stops.map((z, i) => ({ n: i + 1, ramp: inbRampName(hub, z.r), win: winTxt(z), kg: nf(z.kg) + ' ' + U.kg, m3: nfm(z.m3) + ' ' + U.m3, pcs: z.pcs + ' ' + pcsU, done: e.sd[i],
        l: e.sd[i] ? C_OK : { bg: 'var(--color-neutral-100)', fg: 'var(--color-neutral-700)', bc: 'var(--color-neutral-400)' }, can: ev.st != null && !e.sd[i], op: ev.st != null && !e.sd[i] ? 1 : 0.45, mark: e.sd[i] ? X('выгружено', 'entladen', 'unloaded') : X('открыто', 'offen', 'open'),
        btn: X('Выгружено ✓', 'Entladen ✓', 'Unloaded ✓'),
        go: () => this.inbSet(e, (n, o) => { const sd = e.sd.slice(); sd[i] = true; return sd.every(Boolean) ? { sd, ev: { en: n } } : { sd }; }, X('место ', 'Stelle ', 'stop ') + (i + 1) + X(' выгружено (рампа ', ' entladen (Rampe ', ' unloaded (ramp ') + z.r + ')') }));
      const stepTxt = ST.map((z, i) => ({ label: z.label, on: i <= c.st, cur: i === c.st, bg: i <= c.st ? 'var(--color-accent)' : 'var(--color-neutral-200)', fg: i <= c.st ? 'var(--color-accent-900)' : 'var(--color-neutral-600)' }));
      const pct = c.st === 3 ? 100 : c.st === 2 ? Math.round(50 + c.done / e.stops.length * 49) : c.st === 1 ? 25 : 0;
      const dwell = {
        free: e.free + ' ' + MIN, dwell: e.ev.ci != null ? Math.round(c.dwell) + ' ' + MIN : '—', window: hmm(c.wFrom) + '–' + hmm(c.wTo), late: c.late,
        lateTxt: c.late ? (e.ev.ci != null ? X('окно превышено на ', 'Fenster überschritten um ', 'window exceeded by ') + Math.round((e.ev.en != null ? e.ev.en : now) - c.wTo) + ' ' + MIN : X('машина не прибыла в окно', 'Fahrzeug nicht im Fenster eingetroffen', 'vehicle did not arrive in the window')) : X('в окне', 'im Fenster', 'within window'),
        l: c.late ? LV[3] : LV[0], showQ: e.ev.ci != null && (c.late || c.amount > 0),
        yes: { label: X('Да · по вине хаба', 'Ja · beim Hub', 'Yes · hub side'), go: () => this.inbSet(e, () => ({ delay: true }), X('задержка: да (хаб)', 'Verzögerung: ja (Hub)', 'delay: yes (hub)')), ...seg(e.delay, true) },
        no: { label: X('Нет · перевозчик / водитель', 'Nein · Frachtführer / Fahrer', 'No · carrier / driver'), go: () => this.inbSet(e, () => ({ delay: false }), X('задержка: нет (перевозчик / водитель)', 'Verzögerung: nein (Frachtführer / Fahrer)', 'delay: no (carrier / driver)')), ...seg(e.delay, false) },
        reasons: e.delay === true ? INB_REASON.map(r => ({ label: r, go: () => this.inbSet(e, () => ({ reason: r }), X('причина: ', 'Grund: ', 'reason: ') + r), ...seg(e.reason, r) })) : [],
        fee: c.amount > 0, feeTxt: nf(c.amount) + ' ₸', feeCalc: Math.round(c.over) + ' ' + MIN + ' > ' + e.free + ' · ' + c.blocks + ' × ' + nf(INB_RATE) + ' ₸ / ' + INB_STEP + ' ' + MIN,
        feeMsg: e.booked ? X('записано в «Затраты» (экран 16): ', 'in Kosten gebucht (Bildschirm 16): ', 'booked to costs (screen 16): ') + nf(e.booked) + ' ₸'
          : e.delay === false ? X('не начисляется: задержка не по вине хаба', 'entfällt: Verzögerung nicht beim Hub', 'not charged: delay not on hub side')
          : e.delay === null ? X('предварительно — ответьте на вопрос о задержке', 'vorläufig — Frage zur Verzögerung beantworten', 'provisional — answer the delay question')
          : e.ev.en == null ? X('начислить можно после завершения разгрузки', 'buchbar nach Ende der Entladung', 'can be booked once unloading ends') : X('готово к записи в затраты', 'bereit zur Buchung in die Kosten', 'ready to be booked to costs'),
        canBook: c.amount > 0 && e.delay === true && e.ev.en != null && !e.booked, bookOp: c.amount > 0 && e.delay === true && e.ev.en != null && !e.booked ? 1 : 0.45, booked: !!e.booked,
        book: () => this.inbSet(e, () => ({ booked: c.amount }), X('Standgeld ', 'Standgeld ', 'demurrage ') + nf(c.amount) + ' ₸ → ' + X('Затраты', 'Kosten', 'Costs'), X('Standgeld записан в «Затраты»: ', 'Standgeld in Kosten gebucht: ', 'Demurrage booked to costs: ') + nf(c.amount) + ' ₸')
      };
      const lastE = e.log[0], crE = e.cr;
      dr = {
        id: e.id, arrow: e.dir === 'in' ? '↓' : '↩', st: stl.label, stc: stl.c, prio: 'P' + e.prio, pc: e.prio === 1 ? C_BAD : e.prio === 2 ? C_WARN : { bg: 'transparent', fg: 'var(--color-neutral-800)', bc: 'var(--color-neutral-400)' },
        hubName: INB_HUB[hub], src: e.src === 'col' ? X('сборный рейс на хаб', 'Sammellauf zum Hub', 'collection run to the hub') : X('партнёрская перевозка', 'Partnertransport', 'partner transport'),
        steps: stepTxt, pct: pct + ' %', pctW: pct + '%',
        pick: [[X('Дата забора', 'Abholdatum', 'Pick-up date'), e.pick], [X('Перевозчик / партнёр', 'Spediteur / Partner', 'Carrier / partner'), carrierOf(e)],
          [X('Госномер', 'Kennzeichen', 'Plate'), e.plate || X('следует', 'folgt', 'follows')], [X('Транспорт', 'Transportmittel', 'Vehicle'), e.veh],
          [X('Отправители', 'Absender', 'Senders'), e.snd.map((z, i) => (i + 1) + ' ' + z.name).join(' · ')],
          [X('Признаки', 'Kennzeichen', 'Flags'), 'P' + e.prio + (e.fl.adr ? ' · ' + X('ДОПОГ', 'ADR', 'ADR') : '') + (e.fl.tl ? ' · ' + e.fl.tl : '')]].map(([k, v]) => ({ k, v })),
        stopsT, sum: nf(c.kg) + ' ' + U.kg + ' · ' + nfm(c.m3) + ' ' + U.m3 + ' · ' + c.pcs + ' ' + pcsU, proc, cold, dwell, flags: flagChips(e), hasBlock: !!e.fl.block, hasDocMiss: e.fl.esf === 'miss' || e.fl.esu === 'miss',
        blockTxt: X('Партия на QA-блоке: принять в карантинную зону до получения CoA', 'Charge unter QA-Sperre: bis CoA in Quarantänezone einlagern', 'Lot on QA hold: put to quarantine until CoA arrives'),
        docTxt: X('Нет ЭСФ / ЭСУТД: приёмка возможна, проводка — после получения документов', 'ЭСФ / ЭСУТД fehlen: Annahme möglich, Buchung nach Eingang der Dokumente', 'ESF / ESUTD missing: receiving possible, posting after documents arrive'),
        log: e.log.slice(0, 6).map(z => ({ t: z.t, by: byName(z.by), text: z.text })),
        created: crE.by + ' · ' + crE.d + ' ' + crE.t, changed: byName(lastE.by) + ' · ' + (lastE.t > hmm(now) ? '05.10.' : INB_DAY) + ' ' + lastE.t,
        close: () => this.setState({ inbSel: null }), toQuality: () => this.setState({ screen: 'quality', inbSel: null }), toCosts: () => this.setState({ screen: 'costs', inbSel: null })
      };
    }

    const L = {
      intro: X('Приёмка на хабах Астана и Алматы: очередь входящих машин по складу, окна рамп, стоянка, холодовая цепь на воротах и разгрузка по местам. Заявки приходят автоматически из сборного рейса на хаб и из партнёрских перевозок; все действия пишутся в журнал аудита.',
        'Wareneingang an den Hubs Astana und Almaty: Eingangsliste je Lager, Rampenfenster, Standzeit, Kühlkette am Tor und Entladung je Stelle. Aufträge kommen automatisch aus dem Sammellauf zum Hub und aus den Partnertransporten; alle Aktionen landen im Audit-Log.',
        'Goods receipt at the Astana and Almaty hubs: inbound list per warehouse, ramp windows, dwell time, cold chain at the gate and unloading per stop. Orders arrive automatically from the collection run to the hub and from partner transports; every action is written to the audit log.'),
      cols: [X('Напр.', 'Richt.', 'Dir.'), X('Рейс', 'Auftrag', 'Job'), X('Приор.', 'Prio', 'Prio'), X('Статус', 'Status', 'Status'), X('Отправители', 'Absender', 'Senders'), X('Места разгрузки', 'Entladestellen', 'Unloading stops'), X('Окно · часы', 'Fenster · Uhr', 'Window · clock'), X('Признаки', 'Merkmale', 'Features')],
      views: X('Виды', 'Ansichten', 'Views'), save: X('Сохранить вид', 'Ansicht speichern', 'Save view'), exp: X('Экспорт CSV', 'Export CSV', 'Export CSV'), namePh: X('Название вида…', 'Name der Ansicht…', 'View name…'),
      search: X('Рейс, перевозчик, номер, отправитель…', 'Auftrag, Spediteur, Kennzeichen, Absender…', 'Job, carrier, plate, sender…'),
      legend: X('Часы краснеют, когда окно превышено · зелёный номер места = выгружено, серый = открыто · наведите курсор для полного названия', 'Uhr wird rot, wenn das Fenster überschritten ist · grün = entladen, grau = offen · Maus darüber für den vollen Namen', 'The clock turns red once the window is exceeded · green stop = unloaded, grey = open · hover for the full name'),
      empty: X('Нет рейсов по выбранным фильтрам', 'Keine Aufträge für die gewählten Filter', 'No jobs for the selected filters'),
      pickup: X('Забор · предварительная перевозка', 'Abholung im Vorlauf', 'Pre-carriage pick-up'), stopsH: X('Места разгрузки и окна рамп', 'Entladestellen und Rampenfenster', 'Unloading stops and ramp windows'),
      sumL: X('Итого', 'Summe', 'Total'), procH: X('Ход по машине', 'Ablauf je Fahrzeug', 'Process per vehicle'), coldH: X('Проверка на воротах · холодовая цепь', 'Torcheck · Kühlkette', 'Gate check · cold chain'),
      tempL: X('Факт. температура прицепа', 'Ist-Temperatur Auflieger', 'Trailer actual temperature'), classL: X('Класс', 'Klasse', 'Class'), lgL: X('Логгер', 'Logger', 'Logger'), lgBtn: X('Принять логгер', 'Logger übernehmen', 'Attach logger'), ssL: X('Сверка SSCC', 'SSCC-Abgleich', 'SSCC check'), ssBtn: X('Запустить сверку SSCC', 'SSCC-Abgleich starten', 'Start SSCC check'),
      dwellH: X('Стоянка и Standgeld', 'Standzeit und Standgeld', 'Dwell time and demurrage'), freeL: X('Бесплатное время', 'Freizeit', 'Free time'), dwellL: X('Стоянка', 'Standzeit', 'Dwell'), winL: X('Окно', 'Fenster', 'Window'),
      delayQ: X('Задержка по вине хаба?', 'Verzögerung?', 'Delay?'), feeL: X('Standgeld', 'Standgeld', 'Demurrage'), bookBtn: X('Записать в затраты', 'In Kosten buchen', 'Book to costs'), toCosts: X('Открыть «Затраты»', 'Kosten öffnen', 'Open costs'), toQuality: X('Открыть «Качество»', 'Qualität öffnen', 'Open quality'),
      logH: X('Журнал аудита', 'Audit-Log', 'Audit log'), progH: X('Заказан → Выгружен', 'Bereitgestellt → Entladen', 'Staged → Unloaded'), created: X('Создано', 'Angelegt', 'Created'), changed: X('Последнее изменение', 'Zuletzt geändert von', 'Last changed by'), close: X('Закрыть', 'Schließen', 'Close'),
      flagsH: X('Признаки', 'Merkmale', 'Features'), filtersH: X('Фильтры по колонкам', 'Filter je Spalte', 'Column filters')
    };
    return { inbL: L, inbHubs: hubTabs, inbKpis, inbFilters, inbViews: views, inbRows: rows, inbNone: rows.length === 0, inbCount: filtered.length + ' / ' + all.length,
      inbQ: F.q, onInbQ: ev => setF({ q: ev.target.value }), inbName: s.inbName || '', onInbName: ev => this.setState({ inbName: ev.target.value }), inbSave: saveView, inbExport: exportCsv,
      inbOpen: !!dr, dr, inbHubName: INB_HUB[hub] };
  }
