/* R3 · Hub inbound (ideas list I-1 … I-7, map: docs/IDEAS-R3.md). Four tabs on Hubs & warehouses next to "Receiving":
   Inbound list (I-1 vehicles with direction / job / priority / status chips, I-2 numbered sender chips, I-5 overdue dwell with hover),
   Ramp slots (I-4 30-min load / unload slots per gate, fixed appointments, conflicts, booking), Pre-carriage (I-3 pickups that create
   an expected inbound), Demurrage (I-6 auto-calculated Standgeld → Costs with four eyes, re-charge to the sender). Drawer "Gate check"
   (I-7: actual temperature, logger data take-over, SSCC reconciliation — reads the SSCC model of 200-ops-model.js, never writes it).
   Shares the job model, RECV tariff and recvCalc() of 080-receiving.js. Mock-up only: no backend. Test: tests/e3-hub-inbound.js. */
(function () {
  const IB = S.ib = { f: { hub: '', dir: '', pri: '', st: '' }, pre: [], slots: [], slotHub: '', jobsRef: null, preSeq: 1, slotSeq: 1 };
  const MIN = () => T('мин', 'min', 'min', 'мин');
  const ALL = T('Все', 'Alle', 'All', 'Барлығы');
  const nf = n => Math.round(n).toLocaleString('ru-RU');
  const kv = (k, v) => `<div><small>${esc(k)}</small><b>${v}</b></div>`;
  const tk = (cls, ico, val, label) => `<div class="kpi-tile tint ${cls}"><div><div class="value">${val}</div><div class="label">${esc(label)}</div></div><div class="icon" style="background:var(--${cls});color:#fff;border-radius:50%">${ic(ico, 18)}</div></div>`;
  const aud = (subj, dec, why) => { if (typeof audit === 'function') audit('Hub inbound', subj, dec, why || ''); };
  const J = id => S.jobs.find(x => x.id === id);
  const log = (j, text) => j.log.unshift({ t: hmm(S.clock), text });
  const PRI_K = ['high', 'medium', 'low'];
  const DIRS = { line: T('Магистраль', 'Hauptlauf', 'Line haul', 'Магистраль'), pre: T('Предварительная доставка', 'Vorlauf', 'Pre-carriage', 'Алдын ала жеткізу'), local: T('Местный поставщик', 'Lokaler Lieferant', 'Local supplier', 'Жергілікті жеткізуші') };
  const DIR_C = { line: 'blue', pre: 'purple', local: 'gray' };
  /* seed: origin hub per demo job (line haul) — the others are local suppliers */
  const ORIGIN = { 'IN-0611': 'ALA', 'IN-0614': 'KAR', 'IN-0616': 'SHY', 'IN-0621': 'AST', 'IN-0624': 'SHY' };
  const FWD = [nm('ТОО «Транс-Экспедитор»'), nm('ТОО «Центр Транзит»'), nm('ТОО «Жетісу Карго»')];

  /* ---------- per-job inbound extension (lazy) ---------- */
  const ibx = j => j.ib || (j.ib = { pri: j.zone === 'pharma' || j.flags.includes('adr') ? 'high' : j.flags.includes('fix') ? 'medium' : 'low', rec: null, logger: null, dem: null });
  const dirOf = j => { if (j.pre) return 'pre'; if (j.load || ORIGIN[j.id]) return 'line'; return 'local'; };
  const originTxt = j => { const d = dirOf(j); if (d === 'line') { const l = j.load && load(j.load), o = l ? l.from : ORIGIN[j.id]; return (o ? HUBS[o].city : '—') + ' → ' + HUBS[j.hub].city; } if (d === 'pre') { const p = IB.pre.find(x => x.id === j.pre); return (p ? p.fwd : '—') + ' → ' + HUBS[j.hub].city; } return (j.senders[0] || '—') + ' → ' + HUBS[j.hub].city; };
  const calc = j => recvCalc(j, S.clock);

  /* ---------- seed (re-runs after "Reset demo data" replaced S.jobs) ---------- */
  function seed() {
    IB.jobsRef = S.jobs; IB.pre = []; IB.slots = []; IB.preSeq = 1; IB.slotSeq = 1;
    preAdd({ date: '2026-10-20', fwd: FWD[0], plate: '', hub: 'AST', zone: 'pharma', points: [{ name: nm('ТОО «МедСнаб Актобе»'), kg: 1840, m3: 6.2, pcs: 8 }, { name: nm('ТОО «БиоЛаб Азия»'), kg: 620, m3: 2.4, pcs: 3 }] }, true);
    preAdd({ date: '2026-10-21', fwd: FWD[2], plate: '512 ABH 02', hub: 'ALA', zone: 'chilled', points: [{ name: nm('ТОО «Нур Фуд Дистрибьюшн»'), kg: 3900, m3: 14.5, pcs: 12 }] }, true);
    S.jobs.forEach(j => { if (j.win && j.ramp && j.plan) { const s = Math.floor(j.win[0] / 30) * 30, len = Math.max(1, Math.ceil((j.win[1] - s) / 30)); IB.slots.push({ id: 'SL-' + IB.slotSeq++, hub: j.hub, gate: j.ramp, s, len, job: j.id, kind: 'unload', fixed: j.id === 'IN-0611' }); } });
    IB.slots.push({ id: 'SL-' + IB.slotSeq++, hub: 'AST', gate: 1, s: 960, len: 2, job: null, ref: 'LD-2026-001850', kind: 'load', fixed: true });
    IB.slots.push({ id: 'SL-' + IB.slotSeq++, hub: 'AST', gate: 3, s: 780, len: 1, job: null, ref: 'LD-2026-001853', kind: 'load', fixed: false });
  }
  const ensure = () => { if (IB.jobsRef !== S.jobs) seed(); return IB; };
  globalThis.ibEnsure = ensure;

  /* ---------- I-3 pre-carriage: a pickup with points (kg / m³ / pieces) creates the expected inbound job ---------- */
  function preAdd(o, quiet) {
    const pts = (o.points || []).filter(p => p && String(p.name || '').trim());
    if (!o.date) return T('Укажите дату забора', 'Abholdatum angeben', 'Enter the pickup date', 'Алу күнін көрсетіңіз');
    if (!o.fwd) return T('Выберите экспедитора', 'Spediteur wählen', 'Choose the forwarder', 'Экспедиторды таңдаңыз');
    if (!S.hubs[o.hub] || !ZONES[o.zone]) return T('Выберите хаб и зону', 'Hub und Zone wählen', 'Choose hub and zone', 'Хаб пен аймақты таңдаңыз');
    if (!pts.length) return T('Нужен хотя бы один пункт забора', 'Mindestens eine Abholstelle nötig', 'At least one pickup point is needed', 'Кемінде бір алу пункті қажет');
    if (pts.some(p => !(+p.kg > 0) || !(+p.pcs >= 1) || !(+p.m3 >= 0))) return T('Для каждого пункта: кг > 0, мест ≥ 1, м³ ≥ 0', 'Je Stelle: kg > 0, Stück ≥ 1, m³ ≥ 0', 'Per point: kg > 0, pieces ≥ 1, m³ ≥ 0', 'Әр пункт: кг > 0, орын ≥ 1, м³ ≥ 0');
    const n = IB.preSeq++, id = 'PC-' + p2(n), pc = { id, date: o.date, fwd: o.fwd, plate: (o.plate || '').trim(), hub: o.hub, zone: o.zone, points: pts.map(p => ({ name: String(p.name).trim(), kg: +p.kg, m3: +p.m3 || 0, pcs: +p.pcs })), st: 'planned', job: null };
    const pcs = pc.points.reduce((s, p) => s + p.pcs, 0);
    const j = mkJob('P' + p2(n), o.hub, o.zone, { plate: pc.plate, veh: o.zone === 'ambient' ? 'Tent 20 t' : 'Reefer 12 t', carrier: pc.fwd, senders: pc.points.map(p => p.name), plan: false, pallets: pcs, flags: o.zone === 'pharma' ? ['gdp'] : [], pre: id });
    j.log.unshift({ t: hmm(S.clock), text: T('ожидаемая приёмка из забора ', 'erwarteter Eingang aus Vorlauf ', 'expected inbound from pickup ', 'алудан күтілетін қабылдау ') + id });
    pc.job = j.id; IB.pre.push(pc); S.jobs.push(j);
    if (!quiet) aud(id, T('Забор запланирован', 'Vorlauf geplant', 'Pickup planned', 'Алу жоспарланды'), pc.fwd + ' · ' + j.id);
    return pc;
  }
  const preTot = pc => pc.points.reduce((a, p) => ({ kg: a.kg + p.kg, m3: a.m3 + p.m3, pcs: a.pcs + p.pcs }), { kg: 0, m3: 0, pcs: 0 });
  function prePlate(id, plate) {
    const pc = IB.pre.find(x => x.id === id), v = String(plate || '').trim().toUpperCase(); if (!pc) return 'id';
    if (!/^[0-9A-Z][0-9A-Z ]{4,11}$/.test(v)) return T('Номер ТС: 5–12 латинских букв / цифр', 'Kennzeichen: 5–12 lateinische Zeichen', 'Plate: 5–12 Latin letters / digits', 'КҚ нөмірі: 5–12 латын таңба / сан');
    pc.plate = v; const j = J(pc.job); if (j) { j.plate = v; log(j, T('номер ТС получен: ', 'Kennzeichen erhalten: ', 'plate received: ', 'КҚ нөмірі алынды: ') + v); }
    aud(id, T('Номер ТС внесён', 'Kennzeichen erfasst', 'Plate entered', 'КҚ нөмірі енгізілді'), v); return null;
  }
  function prePicked(id) { const pc = IB.pre.find(x => x.id === id); if (!pc || pc.st !== 'planned') return 'state'; if (!pc.plate) return T('Сначала номер ТС', 'Erst Kennzeichen erfassen', 'Enter the plate first', 'Алдымен КҚ нөмірі'); pc.st = 'picked'; const j = J(pc.job); if (j) { j.plan = true; log(j, T('груз забран, в пути на хаб', 'Ware abgeholt, unterwegs zum Hub', 'goods picked up, on the way to the hub', 'жүк алынды, хабқа жолда')); } aud(id, T('Груз забран', 'Ware abgeholt', 'Goods picked up', 'Жүк алынды'), pc.plate); return null; }

  /* ---------- I-4 ramp slots: 30-min units per gate, fixed appointments, conflicts ---------- */
  const SL0 = 8 * 60, SL1 = 20 * 60, UNIT = 30;
  const overlap = (a, b) => a.hub === b.hub && a.gate === b.gate && a.s < b.s + b.len * UNIT && b.s < a.s + a.len * UNIT;
  function slotBook(o) {
    ensure();
    const H = S.hubs[o.hub], g = +o.gate, s = +o.s, len = Math.max(1, Math.min(4, +o.len || 1)), j = o.job ? J(o.job) : null;
    if (!H || !(g >= 1 && g <= H.ramps.length)) return T('Нет такой рампы', 'Rampe existiert nicht', 'No such gate', 'Мұндай рампа жоқ');
    if (!(s >= SL0 && s + len * UNIT <= SL1) || s % UNIT) return T('Слот: 08:00–20:00, шаг 30 мин', 'Slot: 08:00–20:00, Raster 30 Min', 'Slot: 08:00–20:00 in 30-min steps', 'Слот: 08:00–20:00, қадам 30 мин');
    if (H.blocked.includes(g)) return T('Рампа закрыта (размораживание / ремонт)', 'Rampe gesperrt (Abtauen / Reparatur)', 'Gate blocked (defrost / repair)', 'Рампа жабық');
    if (j && j.hub !== o.hub) return T('Приёмка другого хаба', 'Wareneingang eines anderen Hubs', 'Inbound job of another hub', 'Басқа хабтың қабылдауы');
    if (j && H.ramps[g - 1] !== j.zone) return T('Зона рампы не совпадает с грузом: ', 'Rampenzone passt nicht zur Ware: ', 'Gate zone does not match the cargo: ', 'Рампа аймағы жүкке сай емес: ') + ZONES[H.ramps[g - 1]].label + ' ≠ ' + ZONES[j.zone].label;
    if (j && j.ev.en != null) return T('Разгрузка уже завершена', 'Entladung bereits beendet', 'Unloading already finished', 'Түсіру аяқталған');
    const e = { id: 'SL-' + IB.slotSeq, hub: o.hub, gate: g, s, len, job: j ? j.id : null, ref: o.ref || '', kind: o.kind === 'load' ? 'load' : 'unload', fixed: !!o.fixed };
    const others = IB.slots.filter(x => !(j && x.job === j.id));
    const fx = others.find(x => x.fixed && overlap(x, e));
    if (fx) return T('Пересечение с фиксированным окном ', 'Überschneidung mit festem Termin ', 'Overlaps the fixed appointment ', 'Бекітілген тереземен қиылысады ') + hmm(fx.s) + ' (' + (fx.job || fx.ref) + ')';
    IB.slotSeq++; IB.slots = others.concat(e);
    if (j) { j.win = [s, s + len * UNIT]; j.ramp = g; j.plan = true; log(j, T('слот рампы ', 'Rampenslot ', 'gate slot ', 'рампа слоты ') + g + ' · ' + hmm(s) + '–' + hmm(s + len * UNIT) + (e.fixed ? T(' (фикс.)', ' (fest)', ' (fixed)', ' (бекіт.)') : '')); }
    aud(e.job || e.ref || e.id, T('Слот забронирован', 'Slot gebucht', 'Slot booked', 'Слот брондалды'), o.hub + ' R' + g + ' ' + hmm(s) + ' × ' + len);
    const warn = others.filter(x => overlap(x, e)).map(x => x.job || x.ref);
    return Object.assign({}, e, { warn });
  }
  function slotDel(id) { const e = IB.slots.find(x => x.id === id); if (!e) return 'id'; if (e.fixed && !canDo('trips:write')) return T('Фиксированное окно снимает только диспетчер', 'Festen Termin löst nur die Disposition', 'Only dispatch can remove a fixed appointment', 'Бекітілген терезені тек диспетчер алады'); IB.slots = IB.slots.filter(x => x !== e); aud(e.job || e.ref || e.id, T('Слот снят', 'Slot entfernt', 'Slot removed', 'Слот алынды'), e.hub + ' R' + e.gate + ' ' + hmm(e.s)); return null; }
  function conflicts(hub) {
    ensure(); const H = S.hubs[hub], out = [], ls = IB.slots.filter(x => x.hub === hub);
    ls.forEach((a, i) => ls.slice(i + 1).forEach(b => { if (overlap(a, b)) out.push({ gate: a.gate, ids: [a.id, b.id], why: T('пересечение: ', 'Überschneidung: ', 'overlap: ', 'қиылысу: ') + (a.job || a.ref) + ' / ' + (b.job || b.ref) }); }));
    ls.forEach(a => { const j = a.job && J(a.job); if (j && j.ev.en != null) return;
      if (H.blocked.includes(a.gate)) out.push({ gate: a.gate, ids: [a.id], why: T('рампа закрыта: ', 'Rampe gesperrt: ', 'gate blocked: ', 'рампа жабық: ') + (a.job || a.ref) });
      if (j && H.ramps[a.gate - 1] !== j.zone) out.push({ gate: a.gate, ids: [a.id], why: T('зона не совпадает: ', 'Zone passt nicht: ', 'zone mismatch: ', 'аймақ сай емес: ') + j.id }); });
    return out;
  }
  const slotOf = j => IB.slots.find(x => x.job === j.id);

  /* ---------- I-7 gate check: temperature, logger take-over, SSCC reconciliation ---------- */
  function gateTemp(id, v) { const j = J(id); if (!j) return 'id'; if (v === '' || v == null || isNaN(+v)) return T('Введите температуру', 'Temperatur eingeben', 'Enter the temperature', 'Температураны енгізіңіз'); j.chk.temp = Math.round(+v * 10) / 10; const c = calc(j); log(j, T('факт. температура на воротах: ', 'Ist-Temperatur am Tor: ', 'actual gate temperature: ', 'қақпадағы нақты температура: ') + j.chk.temp + ' °C');
    aud(j.id, c.tempOk === false ? T('Температура вне диапазона', 'Temperatur außerhalb', 'Temperature out of range', 'Температура диапазоннан тыс') : T('Температура в норме', 'Temperatur im Bereich', 'Temperature in range', 'Температура қалыпты'), j.chk.temp + ' °C · ' + ZONES[j.zone].label);
    if (c.tempOk === false && j.load && load(j.load) && typeof openDeviation === 'function') openDeviation(load(j.load), T('Приёмка вне диапазона ', 'Eingang außerhalb ', 'Receipt out of range ', 'Қабылдау диапазоннан тыс ') + ZONES[j.zone].label, j.id + ' · ' + j.chk.temp + ' °C');
    return null; }
  function loggerTake(id) {
    const j = J(id); if (!j) return 'id'; const z = ZONES[j.zone]; let seedN = [...j.id].reduce((s, ch) => s + ch.charCodeAt(0), 0);
    const rnd = () => (seedN = (seedN * 1103515245 + 12345) % 2147483648) / 2147483648, end = j.ev.ci != null ? j.ev.ci : S.clock, pts = [];
    for (let i = 11; i >= 0; i--) { let t = z.mid + (rnd() - 0.5) * (z.hi - z.lo) * 0.5; if (j.id === 'IN-0614' && i === 3) t = z.hi + 1.2; pts.push({ m: end - i * 30, t: Math.round(t * 10) / 10 }); }
    const ts = pts.map(p => p.t), exc = pts.filter(p => p.t < z.lo || p.t > z.hi).length * 30;
    j.ib = ibx(j); j.ib.logger = { id: 'LG-' + j.id.slice(3), pts, min: Math.min(...ts), max: Math.max(...ts), exc, at: S.clock }; j.chk.logger = true;
    log(j, T('данные логгера приняты: ', 'Loggerdaten übernommen: ', 'logger data taken over: ', 'логгер деректері алынды: ') + j.ib.logger.min + '…' + j.ib.logger.max + ' °C' + (exc ? ' · ' + exc + ' ' + MIN() + T(' вне диапазона', ' außerhalb', ' out of range', ' тыс') : ''));
    aud(j.id, T('Данные логгера приняты', 'Loggerdaten übernommen', 'Logger data taken over', 'Логгер деректері алынды'), j.ib.logger.id + ' · ' + pts.length + ' pts · ' + j.ib.logger.min + '…' + j.ib.logger.max + ' °C');
    return j.ib.logger;
  }
  /* expected SSCCs: the places of the linked load from the ops model (read-only), else the sender's advice (GS1, generated) */
  const expected = j => { try { const l = j.load && load(j.load); if (l && typeof opsPlaces === 'function') { const ps = opsPlaces(l).filter(p => p.load === l.id).map(p => p.sscc); if (ps.length) return ps; } } catch (e) { /* no ops model for this load */ }
    const base = 400000 + (parseInt(j.id.replace(/\D/g, ''), 10) || 7) * 100; return Array.from({ length: j.pallets }, (_, i) => ssccMake(base + i)); };
  function recStart(id) { const j = J(id); if (!j) return 'id'; const x = ibx(j); if (x.rec && !x.rec.closed) return x.rec; x.rec = { exp: expected(j), ok: [], foreign: [], bad: [], closed: false, note: '' }; log(j, T('сверка SSCC начата: ожидается ', 'SSCC-Abgleich gestartet: erwartet ', 'SSCC reconciliation started: expected ', 'SSCC салыстыру басталды: күтіледі ') + x.rec.exp.length); aud(j.id, T('Сверка SSCC начата', 'SSCC-Abgleich gestartet', 'SSCC reconciliation started', 'SSCC салыстыру басталды'), x.rec.exp.length + ''); return x.rec; }
  function recScan(id, raw) {
    const j = J(id); if (!j) return 'id'; const r = ibx(j).rec; if (!r || r.closed) return T('Сначала начните сверку', 'Erst Abgleich starten', 'Start the reconciliation first', 'Алдымен салыстыруды бастаңыз');
    const s = ssccFromScan(raw);
    if (!s || !ssccValid(s)) { r.bad.push(String(raw)); return 'bad'; }
    if (r.ok.includes(s)) return 'dup';
    if (r.exp.includes(s)) { r.ok.push(s); return 'ok'; }
    if (!r.foreign.includes(s)) r.foreign.push(s); return 'foreign';
  }
  const recState = j => { const r = ibx(j).rec; if (!r) return null; const miss = r.exp.filter(s => !r.ok.includes(s)); return { exp: r.exp.length, ok: r.ok.length, miss, foreign: r.foreign.length, bad: r.bad.length, closed: r.closed, clean: !miss.length && !r.foreign.length }; };
  function recClose(id, note) {
    const j = J(id); if (!j) return 'id'; const r = ibx(j).rec, st = recState(j); if (!r || r.closed) return T('Сверка не начата', 'Abgleich nicht gestartet', 'Reconciliation not started', 'Салыстыру басталмаған');
    if (!st.clean && String(note || '').trim().length < 10) return T('Расхождение: причина не менее 10 символов', 'Abweichung: Begründung mind. 10 Zeichen', 'Mismatch: reason of at least 10 characters', 'Сәйкессіздік: себеп кемінде 10 таңба');
    r.closed = true; r.note = String(note || '').trim(); if (!st.clean && j.ev.en != null && j.delay == null) { j.delay = true; j.reason = T('Расхождение SSCC', 'SSCC-Abweichung', 'SSCC mismatch', 'SSCC сәйкессіздігі'); }
    log(j, T('сверка SSCC закрыта: ', 'SSCC-Abgleich geschlossen: ', 'SSCC reconciliation closed: ', 'SSCC салыстыру жабылды: ') + st.ok + ' / ' + st.exp + (st.clean ? '' : ' · ' + r.note));
    aud(j.id, st.clean ? T('Сверка SSCC без расхождений', 'SSCC-Abgleich ohne Abweichung', 'SSCC reconciled, no mismatch', 'SSCC сәйкес') : T('Сверка SSCC с расхождением', 'SSCC-Abgleich mit Abweichung', 'SSCC reconciled with mismatch', 'SSCC сәйкессіздікпен'), st.ok + ' / ' + st.exp + ' · −' + st.miss.length + ' · +' + st.foreign + (r.note ? ' · ' + r.note : ''));
    return null;
  }

  /* ---------- I-6 demurrage: auto-calculated from the dwell overrun, four eyes, booked into Costs, re-charge ---------- */
  const fourEyes = by => (by && by === S.role && S.role !== 'admin' ? T('Четыре глаза: утвердить должен другой сотрудник (другая роль)', 'Vier Augen: ein anderer Mitarbeiter (andere Rolle) muss freigeben', 'Four eyes: another employee (another role) must approve', 'Төрт көз: басқа қызметкер (басқа рөл) бекітуі керек') : '');
  const demOf = j => { const c = calc(j), x = ibx(j); return { c, amount: c.amount, st: j.booked ? 'booked' : x.dem && x.dem.st === 'wait' ? 'wait' : c.st >= 2 && c.over > 0 ? (j.ev.en == null ? 'accruing' : 'ready') : 'none', recharge: j.delay === false }; };
  const DST = { accruing: ['yellow', T('Начисляется', 'Läuft auf', 'Accruing', 'Есептелуде')], ready: ['blue', T('К оформлению', 'Zu buchen', 'Ready to book', 'Ресімдеуге')], wait: ['purple', T('Ждёт 2-й подписи', 'Wartet auf 2. Freigabe', 'Awaiting 2nd signature', '2-ші қолды күтуде')], booked: ['green', T('В затратах', 'In Kosten', 'In costs', 'Шығыста')], none: ['gray', '—'] };
  function demPropose(id) {
    const j = J(id); if (!j) return 'id'; if (!canDo('trips:status') && S.role !== 'admin') return T('Нет права trips:status', 'Recht trips:status fehlt', 'Missing permission trips:status', 'trips:status құқығы жоқ');
    const d = demOf(j); if (d.st !== 'ready') return d.st === 'accruing' ? T('Сначала завершите разгрузку', 'Erst Entladung beenden', 'Finish unloading first', 'Алдымен түсіруді аяқтаңыз') : T('Нечего оформлять', 'Nichts zu buchen', 'Nothing to book', 'Ресімдейтін ештеңе жоқ');
    if (j.delay == null) return T('Сначала ответьте: задержка по вине хаба?', 'Erst beantworten: Verzögerung durch den Hub?', 'Answer first: delay caused by the hub?', 'Алдымен жауап беріңіз: кідіріс хаб кінәсінен бе?');
    ibx(j).dem = { st: 'wait', by: S.role, amount: d.amount, at: hmm(S.clock) }; log(j, T('Standgeld предложен: ', 'Standgeld vorgeschlagen: ', 'demurrage proposed: ', 'Standgeld ұсынылды: ') + nf(d.amount) + ' ₸');
    aud(j.id, T('Standgeld предложен (1-я подпись)', 'Standgeld vorgeschlagen (1. Freigabe)', 'Demurrage proposed (1st signature)', 'Standgeld ұсынылды (1-ші қол)'), nf(d.amount) + ' ₸ · ' + ROLE_NAME[S.role]); return null;
  }
  function demApprove(id) {
    const j = J(id); if (!j) return 'id'; const x = ibx(j); if (!x.dem || x.dem.st !== 'wait') return T('Нет предложения', 'Kein Vorschlag', 'No proposal', 'Ұсыныс жоқ');
    if (!canDo('costs:approve') && S.role !== 'admin') return T('Утверждение требует costs:approve (финансы)', 'Freigabe braucht costs:approve (Finanzen)', 'Approval needs costs:approve (finance)', 'Бекіту үшін costs:approve қажет');
    const fe = fourEyes(x.dem.by); if (fe) return fe;
    const c = calc(j), to = j.senders[0] || j.carrier;
    const cost = { id: 'C-' + (S.costs.length + 1), date: '2026-10-18', hub: j.hub, text: 'Standgeld · ' + j.id + ' · ' + c.dwell + ' ' + MIN() + ' (+' + c.over + ')' + (j.delay === false ? ' · ' + T('к перевыставлению: ', 'weiterbelastbar an: ', 're-chargeable to: ', 'қайта қоюға: ') + to : j.reason ? ' · ' + j.reason : ''), amount: c.amount, ref: j.id, cat: 'detention', recharge: j.delay === false ? { to, st: 'open', note: '' } : null };
    S.costs.push(cost); j.booked = c.amount; x.dem.st = 'done'; x.dem.okBy = S.role; x.dem.cost = cost.id;
    log(j, 'Standgeld ' + nf(c.amount) + ' ₸ → ' + T('Затраты', 'Kosten', 'Costs', 'Шығыс') + ' ' + cost.id);
    aud(j.id, T('Standgeld утверждён (4 глаза) → затраты', 'Standgeld freigegeben (4 Augen) → Kosten', 'Demurrage approved (four eyes) → costs', 'Standgeld бекітілді (4 көз) → шығыс'), ROLE_NAME[x.dem.by] + ' + ' + ROLE_NAME[S.role] + (S.role === x.dem.by ? ' · admin override' : '') + ' · ' + cost.id + ' · ' + nf(c.amount) + ' ₸');
    return cost;
  }
  function recharge(costId, to, note) {
    const c = S.costs.find(x => x.id === costId); if (!c || !c.recharge) return T('Строка не перевыставляется', 'Zeile nicht weiterbelastbar', 'Line is not re-chargeable', 'Жол қайта қойылмайды');
    const r = c.recharge; if (to === 'invoiced' && r.st === 'open') { r.st = 'invoiced'; r.inv = 'RC-' + c.id.slice(2); }
    else if (to === 'paid' && r.st === 'invoiced') r.st = 'paid';
    else if (to === 'waived' && r.st !== 'paid') { if (String(note || '').trim().length < 10) return T('Отказ от перевыставления: причина не менее 10 символов', 'Verzicht: Begründung mind. 10 Zeichen', 'Waiver: reason of at least 10 characters', 'Бас тарту: себеп кемінде 10 таңба'); r.st = 'waived'; r.note = String(note).trim(); }
    else return T('Недопустимый переход', 'Statuswechsel nicht erlaubt', 'Status change not allowed', 'Рұқсат етілмеген ауысу');
    aud(c.ref, T('Перевыставление: ', 'Weiterbelastung: ', 'Re-charge: ', 'Қайта қою: ') + RC[r.st][1], r.to + ' · ' + nf(c.amount) + ' ₸' + (r.note ? ' · ' + r.note : '')); return null;
  }
  const RC = { open: ['yellow', T('к перевыставлению', 'offen', 'to re-charge', 'қайта қоюға')], invoiced: ['blue', T('выставлено', 'berechnet', 'invoiced', 'шот қойылды')], paid: ['green', T('оплачено', 'bezahlt', 'paid', 'төленді')], waived: ['gray', T('отказ', 'Verzicht', 'waived', 'бас тарту')] };

  /* ---------- I-1 / I-2 / I-5 inbound list ---------- */
  const SENDST = { plan: ['gray', T('ожидается', 'erwartet', 'expected', 'күтілуде')], gate: ['yellow', T('на воротах', 'am Tor', 'at gate', 'қақпада')], unl: ['blue', T('выгрузка', 'Entladung', 'unloading', 'түсіру')], done: ['green', T('принято', 'angenommen', 'received', 'қабылданды')], bad: ['red', T('проблема', 'Problem', 'problem', 'мәселе')], miss: ['red', T('недостача SSCC', 'SSCC-Fehlmenge', 'SSCC shortage', 'SSCC жетіспеу')] };
  /* status per sender point: a problem (QA hold / temperature) hits all points; after a reconciliation each point is checked by its share of SSCCs */
  const senderSt = (j, i) => { const c = calc(j); if (c.held || c.tempOk === false) return 'bad'; const st = recState(j);
    if (st && st.closed && st.miss.length) { const per = Math.ceil(st.exp / j.senders.length), mine = ibx(j).rec.exp.slice(i * per, (i + 1) * per); if (mine.some(s => st.miss.includes(s))) return 'miss'; }
    return c.st === 3 ? 'done' : j.ev.st != null ? 'unl' : c.st === 2 ? 'gate' : 'plan'; };
  const senderChips = j => j.senders.map((s, i) => { const k = senderSt(j, i); return `<span class="chip ${SENDST[k][0]}" data-ib-sender="${k}" title="${esc((i + 1) + ' · ' + s + ' · ' + SENDST[k][1])}">${i + 1}</span>`; }).join(' ');
  const dwellCell = j => { const c = calc(j), ev = j.ev; if (ev.ci == null) return '<span class="faint">—</span>';
    const end = ev.en != null ? ev.en : S.clock, dl = j.delay === true ? T('да', 'ja', 'yes', 'иә') : j.delay === false ? T('нет', 'nein', 'no', 'жоқ') : '—';
    const tip = T('Период ', 'Zeitraum ', 'Period ', 'Кезең ') + hmm(ev.ci) + '–' + hmm(end) + (ev.en == null ? T(' (идёт)', ' (läuft)', ' (running)', ' (жүріп жатыр)') : '') + ' · ' + c.dwell + ' ' + MIN() + ' · ' + T('бесплатно ', 'frei ', 'free ', 'тегін ') + RECV.free + ' · ' + T('сверх ', 'darüber ', 'over ', 'артық ') + c.over + ' ' + MIN() + ' · ' + T('задержка по вине хаба: ', 'Verzögerung durch Hub: ', 'hub-caused delay: ', 'хаб кінәсінен кідіріс: ') + dl;
    return `<span data-ib-dwell="${c.over > 0 ? 'over' : 'ok'}" title="${esc(tip)}" style="cursor:help"><b style="color:${c.over > 0 ? 'var(--label-red)' : 'inherit'}">${c.dwell} ${esc(MIN())}</b>${c.over > 0 ? `<div class="sub" style="color:var(--label-red)">+${c.over} · ${nf(c.amount)} ₸</div>` : `<div class="sub">${esc(T('из ', 'von ', 'of ', '/ '))}${RECV.free}</div>`}<div class="sub">${esc(T('Задержка: ', 'Verzögerung: ', 'Delay: ', 'Кідіріс: '))}${esc(dl)}</div></span>`; };
  const ibSt = j => { const c = calc(j); return c.st; };
  const list = () => { ensure(); const f = IB.f; return hubFilter(S.jobs).filter(j => (!f.hub || j.hub === f.hub) && (!f.dir || dirOf(j) === f.dir) && (!f.pri || ibx(j).pri === f.pri) && (!f.st || String(ibSt(j)) === f.st))
    .sort((a, b) => (ibSt(a) === 3) - (ibSt(b) === 3) || PRI_K.indexOf(ibx(a).pri) - PRI_K.indexOf(ibx(b).pri) || ((a.win || [9999])[0] - (b.win || [9999])[0])); };
  const statusChips = j => { const c = calc(j), I = RECV_IST[c.st], out = [chip(I.c, I.l)], st = recState(j);
    if (c.late && c.st < 3) out.push(chip('red', T('опоздание', 'verspätet', 'late', 'кешікті')));
    if (c.over > 0) out.push(chip('red', T('простой +', 'Standzeit +', 'dwell +', 'тұру +') + c.over + ' ' + MIN()));
    if (c.held) out.push(chip('red', T('QA-блок', 'QA-Sperre', 'QA hold', 'QA-блок')));
    if (c.tempOk === false) out.push(chip('temp-breach', T('темп. вне нормы', 'Temp. außerhalb', 'temp. out of range', 'темп. тыс')));
    if (st) out.push(chip(st.clean ? 'green' : 'yellow', 'SSCC ' + st.ok + '/' + st.exp));
    if (!j.plate) out.push(chip('gray', T('номер позже', 'Kennz. folgt', 'plate to follow', 'нөмір кейін')));
    return out.join(' '); };
  const sel = (key, label, opts) => `<label>${esc(label)}:</label><select class="select" data-ibf="${key}">${opts.map(o => `<option value="${esc(o[0])}"${IB.f[key] === o[0] ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
  function inboundBody() {
    ensure(); const ls = list(), hs = hubFilter(Object.keys(S.hubs), h => h), act = hubFilter(S.jobs).filter(j => j.ev.en == null);
    const atGate = act.filter(j => j.ev.ci != null).length, over = act.filter(j => calc(j).over > 0).length, exp = act.filter(j => j.ev.ci == null).length, hi = act.filter(j => ibx(j).pri === 'high').length;
    const th = [T('ТС', 'Fahrzeug', 'Vehicle', 'КҚ'), T('Направление', 'Richtung', 'Direction', 'Бағыт'), T('Приёмка / рейс', 'Eingang / Fahrt', 'Job / load', 'Қабылдау / рейс'), T('Приоритет', 'Priorität', 'Priority', 'Басымдық'), T('Отправители', 'Absender', 'Senders', 'Жөнелтушілер'), T('Слот', 'Slot', 'Slot', 'Слот'), T('Статус', 'Status', 'Status', 'Күйі'), T('Время на хабе', 'Standzeit', 'Dwell', 'Хабта тұру')];
    const rows = ls.map(j => { const x = ibx(j), d = dirOf(j), sl = slotOf(j);
      const slot = sl ? `${esc(T('Р', 'R', 'G', 'Р'))}${sl.gate} · ${hmm(sl.s)}–${hmm(sl.s + sl.len * UNIT)}${sl.fixed ? ' ' + chip('blue', T('фикс.', 'fest', 'fixed', 'бекіт.')) : ''}` : j.ev.en == null ? `<button class="btn sm grey" data-act="ibSlotNew" data-id="${j.id}">${esc(T('Забронировать', 'Slot buchen', 'Book slot', 'Брондау'))}</button>` : '<span class="faint">—</span>';
      return `<tr data-act="openJ" data-id="${j.id}" data-ib-row="${j.id}"><td><b>${j.plate ? esc(j.plate) : `<span class="faint">${esc(T('номер позже', 'Kennz. folgt', 'to follow', 'нөмір кейін'))}</span>`}</b><div class="sub">${esc(j.carrier)} · ${esc(j.veh)}</div></td>
<td>${chip(DIR_C[d], DIRS[d])}<div class="sub">${esc(originTxt(j))}</div></td><td><a class="lnk">${j.id}</a> ${zoneChip(j.zone)}<div class="sub">${j.load ? `<a class="lnk" data-act="open" data-id="${j.load}">${j.load}</a>` : j.pre ? esc(j.pre) : '—'} · ${j.pallets} ${esc(T('пал.', 'Pal.', 'pal.', 'пал.'))}</div></td>
<td>${chip(PRI[x.pri].c, PRI[x.pri].l)}</td><td>${senderChips(j)}</td><td>${slot}</td><td>${statusChips(j)}</td><td>${dwellCell(j)}</td></tr>`; }).join('');
    return `<div class="kpi-row k4">${tk('blue', 'truck', exp, T('Ожидается', 'Erwartet', 'Expected', 'Күтілуде'))}${tk('yellow', 'warehouse', atGate, T('На воротах / рампе', 'Am Tor / an der Rampe', 'At gate / dock', 'Қақпада / рампада'))}${tk('red', 'alert', over, T('Простой сверх нормы', 'Standzeit überschritten', 'Dwell overrun', 'Нормадан артық тұру'))}${tk('purple', 'spark', hi, T('Высокий приоритет', 'Hohe Priorität', 'High priority', 'Жоғары басымдық'))}</div>
<div class="filters">${sel('hub', T('Хаб', 'Hub', 'Hub', 'Хаб'), [['', ALL], ...hs.map(h => [h, HUBS[h].city])])}${sel('dir', T('Направление', 'Richtung', 'Direction', 'Бағыт'), [['', ALL], ...Object.keys(DIRS).map(k => [k, DIRS[k]])])}${sel('pri', T('Приоритет', 'Priorität', 'Priority', 'Басымдық'), [['', ALL], ...PRI_K.map(k => [k, PRI[k].l])])}${sel('st', T('Статус', 'Status', 'Status', 'Күйі'), [['', ALL], ...[0, 1, 2, 3].map(k => [String(k), RECV_IST[k].l])])}<button class="clear-all" data-act="ibClr">× ${esc(T('Сбросить', 'Zurücksetzen', 'Clear', 'Тазалау'))}</button><span style="margin-left:auto" class="actbar"><span class="note">${esc(T('Время хаба: ', 'Hubzeit: ', 'Hub time: ', 'Хаб уақыты: '))}<b>${hmm(S.clock)}</b></span><button class="btn grey sm" data-act="tick">+15 ${esc(MIN())}</button></span></div>
${howNote('ibDwell')}
<div class="card tcard"><table class="table" data-ib-list><thead><tr>${th.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="8" class="empty">${esc(T('Нет входящих по фильтрам', 'Keine Eingänge für die Filter', 'No inbound vehicles match', 'Сүзгі бойынша кіріс жоқ'))}</td></tr>`}</tbody></table></div>`;
  }

  /* ---------- I-4 slot board ---------- */
  function slotsBody() {
    ensure(); const hs = hubFilter(Object.keys(S.hubs), h => h); if (!hs.includes(IB.slotHub)) IB.slotHub = hs[0];
    const h = IB.slotHub, H = S.hubs[h], cf = conflicts(h), bad = new Set(cf.flatMap(c => c.ids)), ls = IB.slots.filter(x => x.hub === h), times = [];
    for (let s = SL0; s < SL1; s += UNIT) times.push(s);
    const head = `<div class="h"></div>` + H.ramps.map((z, i) => `<div class="h" title="${ZONES[z].label}">${esc(T('Р', 'R', 'G', 'Р'))}${i + 1}<br><span class="chip zone-${z}" style="font-size:10px;padding:0 6px">${ZONES[z].label}</span></div>`).join('');
    const cells = times.map(s => `<div class="h">${hmm(s)}</div>` + H.ramps.map((z, i) => { const g = i + 1, here = ls.filter(x => x.gate === g && x.s <= s && s < x.s + x.len * UNIT), bl = H.blocked.includes(g);
      if (!here.length) return bl ? `<div class="slot" title="${esc(T('Рампа закрыта', 'Rampe gesperrt', 'Gate blocked', 'Рампа жабық'))}">✕</div>` : `<div class="slot" data-act="ibSlotNew" data-hub="${h}" data-g="${g}" data-s="${s}" style="cursor:pointer" title="${esc(T('Свободно · забронировать', 'Frei · buchen', 'Free · book', 'Бос · брондау'))}">+</div>`;
      const e = here[0], cfl = here.some(x => bad.has(x.id)), lbl = (e.job ? e.job.slice(3) : (e.ref || '').slice(-4)) + (here.length > 1 ? ' ×' + here.length : '');
      const tip = here.map(x => (x.kind === 'load' ? T('Погрузка ', 'Beladung ', 'Loading ', 'Тиеу ') : T('Выгрузка ', 'Entladung ', 'Unloading ', 'Түсіру ')) + (x.job || x.ref) + ' · ' + hmm(x.s) + '–' + hmm(x.s + x.len * UNIT) + (x.fixed ? T(' · фикс. окно', ' · fester Termin', ' · fixed appointment', ' · бекітілген терезе') : '')).join(' | ');
      return `<div class="slot ${e.kind === 'load' ? 'out' : 'in'}" data-ib-slot="${e.id}"${cfl ? ' data-ib-conflict="1"' : ''} title="${esc(tip)}" style="${cfl ? 'outline:2px solid var(--red);background:var(--chip-red-bg,#fde8e8);color:var(--chip-red-fg,#b42318);' : ''}${e.job ? 'cursor:pointer' : ''}"${e.job ? ` data-act="openJ" data-id="${e.job}"` : ''}>${esc(lbl)}${e.fixed ? ' •' : ''}</div>`; }).join('')).join('');
    const todo = hubFilter(S.jobs).filter(j => j.hub === h && j.ev.en == null && !slotOf(j));
    return `<div class="filters"><span class="pill-tabs">${hs.map(x => `<span class="pill-tab${x === h ? ' active' : ''}" data-act="ibSlotHub" data-v="${x}">${esc(HUBS[x].city)}</span>`).join('')}</span><span class="note" style="margin-left:auto">${esc(T('Шаг 30 мин · • фиксированное окно · ✕ рампа закрыта', 'Raster 30 Min · • fester Termin · ✕ Rampe gesperrt', '30-min grid · • fixed appointment · ✕ gate blocked', '30 мин қадам · • бекітілген терезе · ✕ рампа жабық'))}</span></div>
${howNote('ibSlot')}
<div class="grid2"><div class="card card-body" style="overflow:auto"><h3 style="margin:0 0 8px;font-size:15px">${esc(T('Слоты рамп · ', 'Rampenslots · ', 'Gate slots · ', 'Рампа слоттары · '))}${esc(HUBS[h].name)}</h3><div class="dock-grid" data-ib-grid="${h}" style="grid-template-columns:44px repeat(${H.ramps.length},minmax(44px,1fr))">${head}${cells}</div></div>
<div class="card card-body"><h3 style="margin:0 0 8px;font-size:15px">${esc(T('Конфликты', 'Konflikte', 'Conflicts', 'Қақтығыстар'))} ${cf.length ? chip('red', String(cf.length)) : chip('green', '0')}</h3>${cf.map(c => `<div class="tinted-row red" data-ib-cf><span><b>${esc(T('Рампа ', 'Rampe ', 'Gate ', 'Рампа '))}${c.gate}</b><div class="sub">${esc(c.why)}</div></span>${c.ids.map(id => { const e = IB.slots.find(x => x.id === id); return e && !e.fixed ? `<button class="btn sm grey" data-act="ibSlotDel" data-id="${id}">${esc(T('Снять ', 'Lösen ', 'Remove ', 'Алу '))}${esc(e.job || e.ref)}</button>` : ''; }).join('')}</div>`).join('') || `<p class="note">${esc(T('Конфликтов нет', 'Keine Konflikte', 'No conflicts', 'Қақтығыс жоқ'))}</p>`}
<h3 style="margin:16px 0 8px;font-size:15px">${esc(T('Без слота', 'Ohne Slot', 'Without a slot', 'Слотсыз'))}</h3>${todo.map(j => `<div class="tinted-row ${ibx(j).pri === 'high' ? 'yellow' : 'blue'}"><span><b>${j.id}</b> ${zoneChip(j.zone)}<div class="sub">${esc(j.plate || T('номер позже', 'Kennz. folgt', 'plate to follow', 'нөмір кейін'))} · ${esc(j.senders[0] || '')}</div></span><button class="btn sm primary" data-act="ibSlotNew" data-id="${j.id}">${esc(T('Забронировать', 'Slot buchen', 'Book slot', 'Брондау'))}</button></div>`).join('') || `<p class="note">${esc(T('Все приёмки хаба со слотом', 'Alle Eingänge des Hubs haben einen Slot', 'Every inbound job of the hub has a slot', 'Барлық қабылдауда слот бар'))}</p>`}</div></div>`;
  }
  DRAWERS.ibSlot = d => {
    ensure(); const j = d.job ? J(d.job) : null, h = j ? j.hub : d.hub || IB.slotHub || 'AST', H = S.hubs[h], times = [];
    for (let s = SL0; s < SL1; s += UNIT) times.push(s);
    const g0 = d.g ? +d.g : j ? (H.ramps.findIndex((z, i) => z === j.zone && !H.blocked.includes(i + 1)) + 1 || 1) : 1, s0 = d.s ? +d.s : j && j.win ? Math.floor(j.win[0] / 30) * 30 : Math.max(SL0, Math.ceil(S.clock / 30) * 30);
    const jobs = S.jobs.filter(x => x.hub === h && x.ev.en == null);
    return { title: T('Слот рампы', 'Rampenslot', 'Gate slot', 'Рампа слоты') + ' · ' + HUBS[h].city, html: `<div class="drawer-section"><div class="two"><label class="fl">${esc(T('Операция', 'Vorgang', 'Operation', 'Операция'))}<select class="select" id="ibs_kind"><option value="unload">${esc(T('Выгрузка (приёмка)', 'Entladung (Eingang)', 'Unloading (inbound)', 'Түсіру (қабылдау)'))}</option><option value="load">${esc(T('Погрузка (отгрузка)', 'Beladung (Versand)', 'Loading (outbound)', 'Тиеу (жөнелту)'))}</option></select></label>
<label class="fl">${esc(T('Приёмка', 'Eingang', 'Inbound job', 'Қабылдау'))}<select class="select" id="ibs_job"><option value="">—</option>${jobs.map(x => `<option value="${x.id}"${j && x.id === j.id ? ' selected' : ''}>${x.id} · ${esc(ZONES[x.zone].label)}</option>`).join('')}</select></label></div>
<div class="two"><label class="fl">${esc(T('Рампа', 'Rampe', 'Gate', 'Рампа'))}<select class="select" id="ibs_g">${H.ramps.map((z, i) => `<option value="${i + 1}"${i + 1 === g0 ? ' selected' : ''}>${esc(T('Рампа ', 'Rampe ', 'Gate ', 'Рампа '))}${i + 1} · ${esc(ZONES[z].label)}${H.blocked.includes(i + 1) ? ' ✕' : ''}</option>`).join('')}</select></label>
<label class="fl">${esc(T('Начало', 'Beginn', 'Start', 'Басы'))}<select class="select" id="ibs_s">${times.map(s => `<option value="${s}"${s === s0 ? ' selected' : ''}>${hmm(s)}</option>`).join('')}</select></label></div>
<div class="two"><label class="fl">${esc(T('Длительность', 'Dauer', 'Duration', 'Ұзақтығы'))}<select class="select" id="ibs_len">${[1, 2, 3, 4].map(n => `<option value="${n}">${n * 30} ${esc(MIN())}</option>`).join('')}</select></label><label class="fl">${esc(T('Ссылка (рейс)', 'Bezug (Fahrt)', 'Reference (load)', 'Сілтеме (рейс)'))}<input class="select" id="ibs_ref" value=""></label></div>
<label><input type="checkbox" id="ibs_fix"> ${esc(T('Фиксированное окно (договорённость с отправителем)', 'Fester Termin (mit dem Absender vereinbart)', 'Fixed appointment (agreed with the sender)', 'Бекітілген терезе (жөнелтушімен келісілген)'))}</label>
<p class="note" id="ibs_err" style="color:var(--chip-red-fg)"></p><div class="actbar"><button class="btn primary" data-act="ibSlotSave" data-hub="${h}">${esc(T('Забронировать', 'Buchen', 'Book', 'Брондау'))}</button></div></div>` };
  };

  /* ---------- I-3 pre-carriage tab + form ---------- */
  function preBody() {
    ensure(); const ps = hubFilter(IB.pre);
    const PST = { planned: ['blue', T('Запланирован', 'Geplant', 'Planned', 'Жоспарланған')], picked: ['green', T('Забран', 'Abgeholt', 'Picked up', 'Алынды')] };
    const rows = ps.map(pc => { const t = preTot(pc), j = J(pc.job);
      return `<tr data-ib-pre="${pc.id}" style="cursor:default"><td><b>${pc.id}</b><div class="sub">${fd(pc.date)}</div></td><td>${esc(pc.fwd)}<div class="sub">${pc.plate ? esc(pc.plate) : `<span data-ib-tofollow>${chip('gray', T('номер позже', 'Kennz. folgt', 'plate to follow', 'нөмір кейін'))}</span>`}</div></td>
<td>${pc.points.map((p, i) => `<span class="chip gray" title="${esc((i + 1) + ' · ' + p.name + ' · ' + nf(p.kg) + ' kg · ' + String(p.m3).replace('.', ',') + ' m³ · ' + p.pcs + T(' мест', ' Stk.', ' pcs', ' орын'))}">${i + 1}</span>`).join(' ')}<div class="sub">${pc.points.map(p => esc(p.name) + ': ' + nf(p.kg) + ' kg · ' + String(p.m3).replace('.', ',') + ' m³ · ' + p.pcs).join('<br>')}</div></td>
<td><b>${nf(t.kg)} kg</b><div class="sub">${String(Math.round(t.m3 * 10) / 10).replace('.', ',')} m³ · ${t.pcs} ${esc(T('мест', 'Stk.', 'pcs', 'орын'))}</div></td><td>${esc(HUBS[pc.hub].city)} ${zoneChip(pc.zone)}<div class="sub">${j ? `<a class="lnk" data-act="openJ" data-id="${j.id}">${j.id}</a>` : '—'}</div></td><td>${chip(PST[pc.st][0], PST[pc.st][1])}</td>
<td>${pc.plate ? '' : `<input class="select" style="width:120px" id="ibp_plate_${pc.id}" placeholder="${esc(T('номер ТС', 'Kennzeichen', 'plate', 'КҚ нөмірі'))}"> <button class="btn sm grey" data-act="ibPrePlate" data-id="${pc.id}">${esc(T('Внести', 'Erfassen', 'Enter', 'Енгізу'))}</button>`}${pc.st === 'planned' ? ` <button class="btn sm green" data-act="ibPrePicked" data-id="${pc.id}">${esc(T('Забран', 'Abgeholt', 'Picked up', 'Алынды'))}</button>` : ''}</td></tr>`; }).join('');
    const th = [T('Забор', 'Abholung', 'Pickup', 'Алу'), T('Экспедитор / ТС', 'Spediteur / Fahrzeug', 'Forwarder / vehicle', 'Экспедитор / КҚ'), T('Пункты забора', 'Abholstellen', 'Pickup points', 'Алу пункттері'), T('Итого', 'Summe', 'Total', 'Барлығы'), T('Хаб / ожидаемая приёмка', 'Hub / erwarteter Eingang', 'Hub / expected inbound', 'Хаб / күтілетін қабылдау'), T('Статус', 'Status', 'Status', 'Күйі'), ''];
    return `<div class="filters"><span class="note">${esc(T('Забор у отправителей до хаба (Vorlauf): каждый забор создаёт ожидаемую приёмку в списке входящих.', 'Abholung bei den Absendern bis zum Hub (Vorlauf): jede Abholung erzeugt einen erwarteten Eingang in der Eingangsliste.', 'Pickup at the senders up to the hub (pre-carriage): every pickup creates an expected inbound in the inbound list.', 'Жөнелтушілерден хабқа дейін алу: әр алу кіріс тізімінде күтілетін қабылдау жасайды.'))}</span><button class="btn primary" style="margin-left:auto" data-act="ibPreNew">${ic('plus')} ${esc(T('Новый забор', 'Neue Abholung', 'New pickup', 'Жаңа алу'))}</button></div>
${howNote('ibPre')}
<div class="card tcard"><table class="table" data-ib-prelist><thead><tr>${th.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="7" class="empty">${esc(T('Заборов нет', 'Keine Abholungen', 'No pickups', 'Алу жоқ'))}</td></tr>`}</tbody></table></div>`;
  }
  DRAWERS.ibPre = () => ({ title: T('Новый забор (Vorlauf)', 'Neue Abholung (Vorlauf)', 'New pickup (pre-carriage)', 'Жаңа алу'), html: `<div class="drawer-section"><div class="two"><label class="fl">${esc(T('Дата забора', 'Abholdatum', 'Pickup date', 'Алу күні'))}<input type="date" class="select" id="ibp_date" value="2026-10-21"></label><label class="fl">${esc(T('Экспедитор', 'Spediteur', 'Forwarder', 'Экспедитор'))}<select class="select" id="ibp_fwd">${FWD.map(f => `<option>${esc(f)}</option>`).join('')}</select></label></div>
<div class="two"><label class="fl">${esc(T('Номер ТС (пусто = позже)', 'Kennzeichen (leer = folgt)', 'Plate (empty = to follow)', 'КҚ нөмірі (бос = кейін)'))}<input class="select" id="ibp_plate" value=""></label><label class="fl">${esc(T('Хаб назначения', 'Ziel-Hub', 'Destination hub', 'Межелі хаб'))}<select class="select" id="ibp_hub">${Object.keys(S.hubs).map(h => `<option value="${h}">${esc(HUBS[h].city)}</option>`).join('')}</select></label></div>
<label class="fl">${esc(T('Зона', 'Zone', 'Zone', 'Аймақ'))}<select class="select" id="ibp_zone">${Object.keys(ZONES).map(z => `<option value="${z}">${esc(ZONES[z].label)}</option>`).join('')}</select></label></div>
<div class="drawer-section"><h4>${esc(T('Пункты забора: кг / м³ / мест', 'Abholstellen: kg / m³ / Stück', 'Pickup points: kg / m³ / pieces', 'Алу пункттері: кг / м³ / орын'))}</h4>${[0, 1, 2].map(i => `<div style="display:grid;grid-template-columns:minmax(0,2fr) repeat(3,minmax(0,1fr));gap:6px;margin-bottom:6px"><input class="select" id="ibp_n${i}" placeholder="${esc(T('Отправитель ', 'Absender ', 'Sender ', 'Жөнелтуші ') + (i + 1))}"><input class="select" id="ibp_kg${i}" type="number" min="0" placeholder="kg"><input class="select" id="ibp_m3${i}" type="number" min="0" step="0.1" placeholder="m³"><input class="select" id="ibp_pcs${i}" type="number" min="0" placeholder="${esc(T('мест', 'Stk.', 'pcs', 'орын'))}"></div>`).join('')}
<p class="note" id="ibp_err" style="color:var(--chip-red-fg)"></p><div class="actbar"><button class="btn primary" data-act="ibPreSave">${esc(T('Создать забор и ожидаемую приёмку', 'Abholung und erwarteten Eingang anlegen', 'Create pickup and expected inbound', 'Алу мен күтілетін қабылдауды жасау'))}</button></div></div>` });

  /* ---------- I-6 demurrage tab ---------- */
  function demBody() {
    ensure(); const js = hubFilter(S.jobs).filter(j => demOf(j).st !== 'none'), lines = hubFilter(S.costs).filter(c => c.cat === 'detention');
    const sum = st => js.filter(j => demOf(j).st === st).reduce((s, j) => s + demOf(j).amount, 0), rco = lines.filter(c => c.recharge && c.recharge.st === 'open').reduce((s, c) => s + c.amount, 0);
    const rows = js.map(j => { const d = demOf(j), c = d.c, x = ibx(j), end = j.ev.en != null ? j.ev.en : S.clock;
      const cause = j.delay === true ? chip('red', T('хаб', 'Hub', 'hub', 'хаб')) : j.delay === false ? chip('blue', T('отправитель / перевозчик', 'Absender / Frachtführer', 'sender / carrier', 'жөнелтуші / тасымалдаушы')) : j.ev.en != null ? `<button class="btn sm grey" data-act="openJ" data-id="${j.id}">${esc(T('Ответить', 'Beantworten', 'Answer', 'Жауап беру'))}</button>` : '—';
      const act = d.st === 'ready' ? `<button class="btn sm primary" data-act="ibDemProp" data-id="${j.id}">${esc(T('Предложить (1-я подпись)', 'Vorschlagen (1. Freigabe)', 'Propose (1st signature)', 'Ұсыну (1-ші қол)'))}</button>` : d.st === 'wait' ? `<span class="sub">${esc(ROLE_NAME[x.dem.by])}</span> <button class="btn sm purple" data-act="ibDemOk" data-id="${j.id}">${esc(T('Утвердить и записать', 'Freigeben und buchen', 'Approve and book', 'Бекіту және жазу'))}</button>` : d.st === 'booked' ? `<a class="lnk" data-act="ibCosts">${esc(T('Затраты', 'Kosten', 'Costs', 'Шығыс'))}</a>` : '';
      return `<tr data-ib-dem="${j.id}" style="cursor:default"><td><a class="lnk" data-act="openJ" data-id="${j.id}">${j.id}</a><div class="sub">${esc(HUBS[j.hub].city)} · ${esc(j.carrier)}</div></td><td title="${esc(hmm(j.ev.ci) + '–' + hmm(end))}">${hmm(j.ev.ci)}–${hmm(end)}<div class="sub">${c.dwell} ${esc(MIN())}</div></td><td><b style="color:var(--label-red)">+${c.over} ${esc(MIN())}</b><div class="sub">${c.blocks} × ${RECV.step} ${esc(MIN())}</div></td><td><b>${nf(d.amount)} ₸</b><div class="sub">${c.blocks} × ${nf(RECV.rate)} ₸</div></td><td>${cause}</td><td>${chip(DST[d.st][0], DST[d.st][1])}</td><td>${act}</td></tr>`; }).join('');
    const rl = lines.map(c => { const r = c.recharge;
      return `<tr data-ib-rc="${c.id}" style="cursor:default"><td>${c.id}<div class="sub">${fd(c.date)}</div></td><td>${esc(c.text)}</td><td><b>${nf(c.amount)} ₸</b></td><td>${r ? esc(r.to) : `<span class="faint">${esc(T('не перевыставляется (вина хаба)', 'nicht weiterbelastbar (Hub-Verschulden)', 'not re-chargeable (hub-caused)', 'қайта қойылмайды (хаб кінәсі)'))}</span>`}</td><td>${r ? chip(RC[r.st][0], RC[r.st][1]) + (r.inv ? `<div class="sub">${r.inv}</div>` : '') + (r.note ? `<div class="sub">${esc(r.note)}</div>` : '') : ''}</td>
<td>${r && r.st === 'open' ? `<button class="btn sm primary" data-act="ibRc" data-id="${c.id}" data-v="invoiced">${esc(T('Выставить', 'Berechnen', 'Invoice', 'Шот қою'))}</button>` : ''}${r && r.st === 'invoiced' ? `<button class="btn sm green" data-act="ibRc" data-id="${c.id}" data-v="paid">${esc(T('Оплачено', 'Bezahlt', 'Paid', 'Төленді'))}</button>` : ''}${r && (r.st === 'open' || r.st === 'invoiced') ? ` <input class="select" style="width:150px" id="ibrc_${c.id}" placeholder="${esc(T('причина отказа', 'Verzichtsgrund', 'waiver reason', 'бас тарту себебі'))}"> <button class="btn sm grey" data-act="ibRc" data-id="${c.id}" data-v="waived">${esc(T('Отказаться', 'Verzichten', 'Waive', 'Бас тарту'))}</button>` : ''}</td></tr>`; }).join('');
    const th = [T('Приёмка', 'Eingang', 'Job', 'Қабылдау'), T('Период', 'Zeitraum', 'Period', 'Кезең'), T('Сверх нормы', 'Überschreitung', 'Overrun', 'Артық'), T('Standgeld (авто)', 'Standgeld (auto)', 'Demurrage (auto)', 'Standgeld (авто)'), T('Причина', 'Ursache', 'Cause', 'Себебі'), T('Состояние', 'Stand', 'State', 'Күйі'), ''];
    const th2 = [T('Строка', 'Zeile', 'Line', 'Жол'), T('Описание', 'Beschreibung', 'Description', 'Сипаттама'), T('Сумма', 'Betrag', 'Amount', 'Сомасы'), T('Перевыставить', 'Weiterbelasten an', 'Re-charge to', 'Қайта қою'), T('Статус', 'Status', 'Status', 'Күйі'), ''];
    return `<div class="kpi-row k4">${tk('yellow', 'receipt', nf(sum('accruing') + sum('ready')) + ' ₸', T('Начисляется / к оформлению', 'Aufgelaufen / zu buchen', 'Accruing / to book', 'Есептелуде / ресімдеуге'))}${tk('purple', 'user', nf(sum('wait')) + ' ₸', T('Ждёт 2-й подписи', 'Wartet auf 2. Freigabe', 'Awaiting 2nd signature', '2-ші қолды күтуде'))}${tk('green', 'chart', nf(lines.reduce((s, c) => s + c.amount, 0)) + ' ₸', T('В затратах', 'In Kosten', 'Booked to costs', 'Шығыста'))}${tk('blue', 'up', nf(rco) + ' ₸', T('К перевыставлению', 'Weiterzubelasten', 'To re-charge', 'Қайта қоюға'))}</div>
<div class="filters"><span class="note">${esc(T('Тариф: ', 'Satz: ', 'Rate: ', 'Тариф: '))}${nf(RECV.rate)} ₸ / ${RECV.step} ${esc(MIN())} · ${esc(T('бесплатно ', 'frei ', 'free ', 'тегін '))}${RECV.free} ${esc(MIN())} (Settings)</span><a class="lnk" style="margin-left:auto" data-act="ibCosts">${esc(T('Счета → Затраты', 'Rechnungen → Kosten', 'Billing → Costs', 'Шоттар → Шығыс'))}</a></div>
${howNote('ibDem')}
<div class="card tcard"><table class="table" data-ib-demlist><thead><tr>${th.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows || `<tr><td colspan="7" class="empty">${esc(T('Простоев сверх нормы нет', 'Keine Standzeitüberschreitung', 'No dwell overrun', 'Нормадан артық тұру жоқ'))}</td></tr>`}</tbody></table></div>
<h3 style="margin:16px 0 8px;font-size:15px">${esc(T('Строки Standgeld в затратах', 'Standgeld-Zeilen in den Kosten', 'Demurrage lines in costs', 'Шығыстағы Standgeld жолдары'))}</h3>
<div class="card tcard"><table class="table" data-ib-rclist><thead><tr>${th2.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rl || `<tr><td colspan="6" class="empty">—</td></tr>`}</tbody></table></div>`;
  }

  /* ---------- I-7 gate check drawer ---------- */
  globalThis.ibGateBtn = j => j.ev.ci != null && j.ev.en == null ? `<div class="drawer-section actbar"><button class="btn grey" data-act="ibGate" data-id="${j.id}">${ic('therm', 14)} ${esc(T('Проверка на воротах: температура, логгер, SSCC', 'Torprüfung: Temperatur, Logger, SSCC', 'Gate check: temperature, logger, SSCC', 'Қақпа тексеруі: температура, логгер, SSCC'))}</button></div>` : '';
  DRAWERS.ibGate = d => {
    const j = J(d.id), c = calc(j), z = ZONES[j.zone], x = ibx(j), lg = x.logger, st = recState(j);
    const spark = lg ? (() => { const W = 260, Hh = 60, lo = Math.min(z.lo, lg.min) - 1, hi = Math.max(z.hi, lg.max) + 1, y = t => Hh - (t - lo) / (hi - lo) * Hh, xs = i => i * W / (lg.pts.length - 1);
      return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" height="${Hh}" role="img" aria-label="logger"><rect x="0" y="${y(z.hi)}" width="${W}" height="${y(z.lo) - y(z.hi)}" fill="var(--chip-green-bg,#e7f6ec)"/><polyline fill="none" stroke="var(--primary)" stroke-width="2" points="${lg.pts.map((p, i) => xs(i) + ',' + y(p.t)).join(' ')}"/>${lg.pts.map((p, i) => p.t < z.lo || p.t > z.hi ? `<circle cx="${xs(i)}" cy="${y(p.t)}" r="3" fill="var(--red)"/>` : '').join('')}</svg>`; })() : '';
    const recHtml = !st ? `<button class="btn primary sm" data-act="ibRecStart" data-id="${j.id}">${esc(T('Начать сверку SSCC', 'SSCC-Abgleich starten', 'Start SSCC reconciliation', 'SSCC салыстыруды бастау'))}</button>`
      : `<div class="kv">${kv(T('Ожидается', 'Erwartet', 'Expected', 'Күтіледі'), st.exp)}${kv(T('Отсканировано', 'Gescannt', 'Scanned', 'Сканерленді'), st.ok)}${kv(T('Недостача', 'Fehlmenge', 'Missing', 'Жетіспейді'), st.miss.length)}${kv(T('Чужие / ошибка', 'Fremd / Fehler', 'Foreign / invalid', 'Бөгде / қате'), st.foreign + ' / ' + st.bad)}</div>
${st.closed ? `<p>${chip(st.clean ? 'green' : 'yellow', st.clean ? T('сверка закрыта без расхождений', 'Abgleich ohne Abweichung geschlossen', 'closed without mismatch', 'сәйкессіздіксіз жабылды') : T('закрыта с расхождением', 'mit Abweichung geschlossen', 'closed with mismatch', 'сәйкессіздікпен жабылды'))}</p>` : `<div class="actbar" style="margin-top:8px"><input class="select" id="ibg_scan" style="width:220px" placeholder="${esc(T('скан (00) + 18 цифр', 'Scan (00) + 18 Ziffern', 'scan (00) + 18 digits', 'скан (00) + 18 сан'))}"><button class="btn sm primary" data-act="ibScan" data-id="${j.id}">${esc(T('Скан', 'Scan', 'Scan', 'Скан'))}</button><button class="btn sm grey" data-act="ibScanAll" data-id="${j.id}">${esc(T('Скан всех (демо)', 'Alle scannen (Demo)', 'Scan all (demo)', 'Барлығын скан (демо)'))}</button></div>
${st.miss.length ? `<p class="note" style="font-family:monospace;font-size:11px">${esc(T('Не хватает: ', 'Fehlt: ', 'Missing: ', 'Жоқ: '))}${st.miss.slice(0, 4).join(', ')}${st.miss.length > 4 ? ' …' : ''}</p>` : ''}<label class="fl">${esc(T('Причина расхождения (если есть)', 'Grund der Abweichung (falls vorhanden)', 'Reason for a mismatch (if any)', 'Сәйкессіздік себебі (бар болса)'))}<input class="select" id="ibg_note"></label><div class="actbar" style="margin-top:8px"><button class="btn sm green" data-act="ibRecClose" data-id="${j.id}">${esc(T('Закрыть сверку', 'Abgleich schließen', 'Close reconciliation', 'Салыстыруды жабу'))}</button></div>`}`;
    return { title: T('Проверка на воротах · ', 'Torprüfung · ', 'Gate check · ', 'Қақпа тексеруі · ') + j.id, html: `<div class="drawer-section"><div class="kv">${kv(T('ТС', 'Fahrzeug', 'Vehicle', 'КҚ'), esc(j.plate || '—'))}${kv(T('Зона', 'Zone', 'Zone', 'Аймақ'), zoneChip(j.zone))}${kv(T('Паллет', 'Paletten', 'Pallets', 'Паллет'), j.pallets)}${kv(T('Статус', 'Status', 'Status', 'Күйі'), chip(RECV_IST[c.st].c, RECV_IST[c.st].l))}</div>${howNote('ibGate')}</div>
<div class="drawer-section" data-ib-gate-temp><h4>${esc(T('1 · Фактическая температура', '1 · Ist-Temperatur', '1 · Actual temperature', '1 · Нақты температура'))}</h4><div class="actbar"><input class="select" id="ibg_t" type="number" step="0.1" style="width:110px" value="${j.chk.temp != null ? j.chk.temp : ''}"> °C <button class="btn sm primary" data-act="ibTemp" data-id="${j.id}">${esc(T('Записать', 'Speichern', 'Record', 'Жазу'))}</button>${c.tempOk === true ? chip('temp-ok', T('в диапазоне ', 'im Bereich ', 'in range ', 'диапазонда ') + z.label) : c.tempOk === false ? chip('temp-breach', T('вне диапазона ', 'außerhalb ', 'out of range ', 'диапазоннан тыс ') + z.label) : ''}</div>${c.tempOk === false ? `<p class="note" style="color:var(--chip-red-fg)">${esc(T('Разгрузка заблокирована до решения QA; отклонение открыто, если приёмка связана с рейсом.', 'Entladung bis zur QA-Entscheidung gesperrt; Abweichung eröffnet, wenn der Eingang an einer Fahrt hängt.', 'Unloading is blocked until QA decides; a deviation is opened if the job is linked to a load.', 'QA шешіміне дейін түсіру бұғатталған; рейске байланысты болса ауытқу ашылады.'))}</p>` : ''}</div>
<div class="drawer-section" data-ib-gate-logger><h4>${esc(T('2 · Данные логгера', '2 · Loggerdaten', '2 · Logger data', '2 · Логгер деректері'))}</h4>${lg ? `<div class="kv">${kv(T('Логгер', 'Logger', 'Logger', 'Логгер'), lg.id)}${kv('min / max', lg.min + ' / ' + lg.max + ' °C')}${kv(T('Вне диапазона', 'Außerhalb', 'Out of range', 'Диапазоннан тыс'), lg.exc + ' ' + MIN())}${kv(T('Принято', 'Übernommen', 'Taken over', 'Алынды'), hmm(lg.at))}</div>${spark}` : `<button class="btn primary sm" data-act="ibLogger" data-id="${j.id}">${esc(T('Принять данные логгера', 'Loggerdaten übernehmen', 'Take over logger data', 'Логгер деректерін алу'))}</button>`}</div>
<div class="drawer-section" data-ib-gate-sscc><h4>${esc(T('3 · Сверка SSCC', '3 · SSCC-Abgleich', '3 · SSCC reconciliation', '3 · SSCC салыстыру'))}</h4>${recHtml}</div>
<div class="drawer-section actbar"><button class="btn grey" data-act="openJ" data-id="${j.id}">← ${esc(T('Карточка приёмки', 'Eingangskarte', 'Inbound job card', 'Қабылдау картасы'))}</button></div>` };
  };

  /* ---------- tabs, actions, exports ---------- */
  addTab('hubs', 'inbound', T('Входящие', 'Eingangsliste', 'Inbound list', 'Кіріс тізімі'), inboundBody, { badge: () => { ensure(); return hubFilter(S.jobs).filter(j => j.ev.en == null && calc(j).over > 0).length; } });
  addTab('hubs', 'slots', T('Слоты рамп', 'Rampenslots', 'Gate slots', 'Рампа слоттары'), slotsBody, { badge: () => { ensure(); return hubFilter(Object.keys(S.hubs), h => h).reduce((s, h) => s + conflicts(h).length, 0); } });
  addTab('hubs', 'pre', T('Предв. доставка', 'Vorlauf', 'Pre-carriage', 'Алдын ала жеткізу'), preBody, { badge: () => { ensure(); return hubFilter(IB.pre).filter(p => p.st === 'planned').length; } });
  addTab('hubs', 'dem', T('Standgeld', 'Standgeld', 'Demurrage', 'Standgeld'), demBody, { badge: () => { ensure(); return hubFilter(S.jobs).filter(j => demOf(j).st === 'wait').length; } });
  const v = id => ($('#' + id) || {}).value;
  const errOr = (r, okMsg, errEl) => { if (typeof r === 'string') { if (errEl && $('#' + errEl)) $('#' + errEl).textContent = r; else toast(r, 'err'); return false; } if (okMsg) toast(okMsg); else render(); return true; };
  Object.assign(ACT, {
    ibClr: () => { IB.f = { hub: '', dir: '', pri: '', st: '' }; render(); },
    ibSlotHub: d => { IB.slotHub = d.v; render(); },
    ibSlotNew: d => openDrawer({ type: 'ibSlot', job: d.id || '', hub: d.hub || '', g: d.g || '', s: d.s || '' }),
    ibSlotSave: d => { const r = slotBook({ hub: d.hub, gate: v('ibs_g'), s: v('ibs_s'), len: v('ibs_len'), job: v('ibs_job'), kind: v('ibs_kind'), ref: v('ibs_ref'), fixed: ($('#ibs_fix') || {}).checked });
      if (typeof r === 'string') { $('#ibs_err').textContent = r; return; } S.drawer = null; toast(r.warn.length ? T('Забронировано, но пересекается: ', 'Gebucht, aber Überschneidung: ', 'Booked, but overlaps: ', 'Брондалды, бірақ қиылысады: ') + r.warn.join(', ') : T('Слот забронирован: рампа ', 'Slot gebucht: Rampe ', 'Slot booked: gate ', 'Слот брондалды: рампа ') + r.gate + ' · ' + hmm(r.s), r.warn.length ? 'err' : 'ok'); },
    ibSlotDel: d => errOr(slotDel(d.id), T('Слот снят', 'Slot entfernt', 'Slot removed', 'Слот алынды')),
    ibPreNew: () => openDrawer({ type: 'ibPre' }),
    ibPreSave: () => { const pts = [0, 1, 2].map(i => ({ name: v('ibp_n' + i), kg: v('ibp_kg' + i), m3: v('ibp_m3' + i), pcs: v('ibp_pcs' + i) })).filter(p => String(p.name || '').trim());
      const r = preAdd({ date: v('ibp_date'), fwd: v('ibp_fwd'), plate: v('ibp_plate'), hub: v('ibp_hub'), zone: v('ibp_zone'), points: pts }); if (typeof r === 'string') { $('#ibp_err').textContent = r; return; } S.drawer = null; toast(T('Забор создан: ', 'Abholung angelegt: ', 'Pickup created: ', 'Алу жасалды: ') + r.id + ' → ' + r.job); },
    ibPrePlate: d => errOr(prePlate(d.id, v('ibp_plate_' + d.id)), T('Номер ТС внесён', 'Kennzeichen erfasst', 'Plate entered', 'КҚ нөмірі енгізілді')),
    ibPrePicked: d => errOr(prePicked(d.id), T('Груз забран', 'Ware abgeholt', 'Goods picked up', 'Жүк алынды')),
    ibDemProp: d => errOr(demPropose(d.id), T('Предложено: нужна вторая подпись (финансы)', 'Vorgeschlagen: zweite Freigabe nötig (Finanzen)', 'Proposed: second signature needed (finance)', 'Ұсынылды: екінші қол қажет (қаржы)')),
    ibDemOk: d => { const r = demApprove(d.id); if (typeof r === 'string') return toast(r, 'err'); toast(T('Standgeld записан в затраты: ', 'Standgeld in Kosten gebucht: ', 'Demurrage booked to costs: ', 'Standgeld шығысқа жазылды: ') + nf(r.amount) + ' ₸'); },
    ibRc: d => errOr(recharge(d.id, d.v, v('ibrc_' + d.id))),
    ibCosts: () => { go('billing'); setTab('billing', 'cost'); },
    ibGate: d => openDrawer({ type: 'ibGate', id: d.id }),
    ibTemp: d => errOr(gateTemp(d.id, v('ibg_t'))),
    ibLogger: d => { loggerTake(d.id); render(); },
    ibRecStart: d => { recStart(d.id); render(); },
    ibScan: d => { const r = recScan(d.id, v('ibg_scan')); const M = { ok: T('SSCC принят', 'SSCC angenommen', 'SSCC accepted', 'SSCC қабылданды'), dup: T('Уже отсканирован', 'Bereits gescannt', 'Already scanned', 'Сканерленген'), foreign: T('Чужой SSCC: не из этой приёмки', 'Fremde SSCC: nicht aus diesem Eingang', 'Foreign SSCC: not part of this job', 'Бөгде SSCC'), bad: T('Неверный SSCC (контрольная цифра)', 'Ungültige SSCC (Prüfziffer)', 'Invalid SSCC (check digit)', 'Қате SSCC (бақылау саны)') }; toast(M[r] || r, r === 'ok' ? 'ok' : 'err'); },
    ibScanAll: d => { const j = J(d.id), r = ibx(j).rec; if (r) r.exp.forEach(s => recScan(d.id, s)); render(); },
    ibRecClose: d => errOr(recClose(d.id, v('ibg_note'))),
  });
  document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.ibf; if (k) { IB.f[k] = e.target.value; render(); } });
  Object.assign(globalThis, { ibList: list, ibDirOf: dirOf, ibPreAdd: preAdd, ibPrePlate: prePlate, ibPrePicked: prePicked, ibSlotBook: slotBook, ibSlotDel: slotDel, ibConflicts: conflicts, ibSenderSt: senderSt,
    ibGateTemp: gateTemp, ibLoggerTake: loggerTake, ibRecStart: recStart, ibRecScan: recScan, ibRecState: recState, ibRecClose: recClose, ibDemOf: demOf, ibDemPropose: demPropose, ibDemApprove: demApprove, ibRecharge: recharge });
  seed();
})();
