/* Help · animated diagrams (Q1, vanilla port of the 0.3.10 help visuals kit, frontend/src/help/visuals/kit.tsx).
   HELP.fig(id, {title, lead?, steps[], view, draw(i) | svg(i), ms?, cls?, attrs?}) registers a step-by-step figure; HELP.visuals[id]() renders it
   (frame: title, ‹ ▶/❚❚ › controls, "Step N of M", live caption, "All steps (N)" list with clickable steps). The stepper keeps its state in
   S.hv[id] = {i, run}; one interval per figure id runs only while the figure is in the DOM, visible and the tab is not hidden; it is cleared as
   soon as no element of that id is left after a render (help article left, ◇ Diagram popover closed). prefers-reduced-motion starts paused.
   A step repaints only the picture (attribute morph, so CSS transitions animate), the caption, the counter and the list — no full render().
   Ids: flow, split, gonogo, load, booking, express, coldchain, truck, coverage, approvals, driver, dispatchMock (+ pl:* in 65-players.js).
   Texts are quads [ru, de, en, kk] (or T() strings); DE / EN never contain Cyrillic. Colours via tokens in app.css ("Q1 animated help figures"). */
(function () {
  const RM = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t = a => tx(a), E = a => esc(tx(a)), f = n => Math.round(n * 10) / 10;
  const HV = HELP.hv = { defs: {}, timers: new Map(), RM };
  const stOf = id => { S.hv = S.hv || {}; const d = HV.defs[id]; return (S.hv[id] = S.hv[id] || { i: 0, run: !RM && !!d && d.steps.length > 1 }); };
  HELP.fig = (id, def) => { HV.defs[id] = def; HELP.visuals[id] = () => figHtml(id); };
  HELP.hvTimers = () => HV.timers.size;

  /* ---------- SVG primitives (strings; labels are raw text, escaped here) ---------- */
  function wrapW(s, max) {
    const out = [];
    String(s).split('\n').forEach(part => { let line = ''; part.split(' ').forEach(w => { if (line && (line + ' ' + w).length > max) { out.push(line); line = w; } else line = line ? line + ' ' + w : w; }); out.push(line); });
    return out;
  }
  const Lines = (x, y, s, o) => {
    o = o || {}; const max = o.max || 18, size = o.size || 13, lh = o.lh || 1.25, ls = wrapW(s, max), y0 = y - (ls.length - 1) * size * lh / 2;
    return `<text x="${f(x)}" y="${f(y0)}" text-anchor="${o.anchor || 'middle'}" dominant-baseline="middle" font-size="${size}" class="hv-t ${o.cls || ''}">${ls.map((l, i) => `<tspan x="${f(x)}" dy="${i ? f(size * lh) : 0}">${esc(l)}</tspan>`).join('')}</text>`;
  };
  const Txt = (x, y, s, o) => { o = o || {}; return `<text x="${f(x)}" y="${f(y)}"${o.anchor ? ` text-anchor="${o.anchor}"` : ''}${o.mid ? ' dominant-baseline="middle"' : ''} font-size="${o.size || 12}" class="hv-t ${o.cls || ''}"${o.attrs || ''}>${esc(s)}</text>`; };
  const Box = o => {
    const size = o.size || 13, m = o.max || Math.max(6, Math.floor(o.w / (size * 0.56)));
    return `<g class="hv-bx t-${o.tone || 'base'}${o.on ? ' on' : ''}${o.done ? ' done' : ''}"${o.attrs || ''}><rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="8"/>${Lines(o.x + o.w / 2, o.y + o.h / 2 - (o.sub ? 8 : 0), o.label, { max: m, size, cls: 'hv-st' })}${o.sub ? Lines(o.x + o.w / 2, o.y + o.h - 13, o.sub, { max: m + 4, size: size - 2, cls: 'hv-sb' }) : ''}</g>`;
  };
  const Diamond = o => `<g class="hv-bx t-${o.tone || 'accent'}${o.on ? ' on' : ''}"><polygon points="${o.cx},${o.cy - o.h / 2} ${o.cx + o.w / 2},${o.cy} ${o.cx},${o.cy + o.h / 2} ${o.cx - o.w / 2},${o.cy}"/>${Lines(o.cx, o.cy, o.label, { max: Math.floor(o.w / ((o.size || 12) * 0.75)), size: o.size || 12, cls: 'hv-st' })}</g>`;
  let seq = 0, figKey = '';
  const Arrow = o => {
    const mid = 'hva-' + figKey + '-' + (++seq), d = o.d || `M${o.x1},${o.y1} L${o.x2},${o.y2}`;
    const lab = o.label ? Lines(o.lx != null ? o.lx : ((o.x1 || 0) + (o.x2 || 0)) / 2, o.ly != null ? o.ly : ((o.y1 || 0) + (o.y2 || 0)) / 2 - 10, o.label, { max: 22, size: 11, cls: 'hv-sb' }) : '';
    return `<g class="hv-ar2${o.on ? ' on' : ''}${o.tone ? ' t-' + o.tone : ''}${o.dashed ? ' dashed' : ''}"><defs><marker id="${mid}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="hv-hm"/></marker></defs><path d="${d}" marker-end="url(#${mid})"/>${lab}</g>`;
  };
  const Tag = (x, y, s, tone, size) => { size = size || 11; const w = Math.max(28, String(s).length * size * 0.6 + 14); return `<g class="hv-tag t-${tone || 'accent'}"><rect x="${f(x - w / 2)}" y="${y - size}" width="${f(w)}" height="${size * 2}" rx="${size}"/><text x="${f(x)}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="${size}" class="hv-t">${esc(s)}</text></g>`; };
  const Token = (x, y, r, tone) => `<circle class="hv-tok t-${tone || 'accent'}" r="${r || 9}" cx="0" cy="0" style="transform:translate(${f(x)}px,${f(y)}px)"/>`;
  const fmtKg = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  /* ---------- frame + stepper ---------- */
  const UI = {
    play: ['Воспроизвести анимацию', 'Animation abspielen', 'Play animation', 'Анимацияны ойнату'], pause: ['Пауза', 'Pause', 'Pause', 'Үзіліс'],
    prev: ['Предыдущий шаг', 'Vorheriger Schritt', 'Previous step', 'Алдыңғы қадам'], next: ['Следующий шаг', 'Nächster Schritt', 'Next step', 'Келесі қадам'],
    step: ['Шаг', 'Schritt', 'Step', 'Қадам'], of: ['из', 'von', 'of', '/'], all: ['Все шаги', 'Alle Schritte', 'All steps', 'Барлық қадамдар'],
  };
  function picHtml(id, i) {
    const d = HV.defs[id], cap = d.steps[i]; seq = 0; figKey = id.replace(/\W/g, '');
    const label = esc(t(d.title) + (cap ? ' — ' + t(cap) : ''));
    if (d.svg) return d.svg(i).replace('<svg ', `<svg role="img" aria-label="${label}" `);
    return `<svg viewBox="${d.view}" class="hvk-svg" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet">${d.draw(i)}</svg>`;
  }
  const capHtml = (d, i) => `<b>${i + 1}.</b> ${E(d.steps[i])}`;
  const countTxt = (i, n) => `${t(UI.step)} ${i + 1} ${t(UI.of)} ${n}`;
  function figHtml(id) {
    const d = HV.defs[id], u = stOf(id), n = d.steps.length, i = Math.min(u.i, n - 1);
    const ctl = n > 1 ? `<span class="hvk-ctl" role="group" aria-label="${E(d.title)}"><button type="button" data-act="hvStep" data-id="${id}" data-v="-1" aria-label="${E(UI.prev)}" title="${E(UI.prev)}">‹</button><button type="button" data-hv-play data-act="hvTog" data-id="${id}" aria-pressed="${u.run}" aria-label="${E(u.run ? UI.pause : UI.play)}" title="${E(u.run ? UI.pause : UI.play)}">${u.run ? '❚❚' : '▶'}</button><button type="button" data-act="hvStep" data-id="${id}" data-v="1" aria-label="${E(UI.next)}" title="${E(UI.next)}">›</button><span class="hvk-count" data-hv-count>${esc(countTxt(i, n))}</span></span>` : '';
    const list = n > 1 ? `<details class="hv-all"${u.all ? ' open' : ''}><summary>${E(UI.all)} (${n})</summary><ol>${d.steps.map((s, k) => `<li${k === i ? ' class="on"' : ''}><button type="button" data-act="hvGo" data-id="${id}" data-v="${k}"${k === i ? ' aria-current="step"' : ''}>${E(s)}</button></li>`).join('')}</ol></details>` : '';
    return `<div class="hvk${d.cls ? ' ' + d.cls : ''}" data-hv="${id}" data-step="${i}" data-playing="${u.run ? 1 : 0}"${d.attrs ? ' ' + d.attrs : ''}><div class="hvk-head"><b class="hvk-title">${E(d.title)}</b>${ctl}</div>${d.lead ? `<p class="hvk-lead">${E(d.lead)}</p>` : ''}<div class="hvk-pic" data-hv-pic>${picHtml(id, i)}</div>${d.legend ? d.legend() : ''}<p class="hvk-cap" aria-live="polite" data-hv-cap>${capHtml(d, i)}</p>${list}</div>`;
  }
  /* patch the old picture into the new one node by node: kept elements keep their CSS transitions (tilt, bars, token) */
  function morph(a, b) {
    if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b.cloneNode(true)); return; }
    if (a.nodeType === 3) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
    if (a.nodeType !== 1) return;
    for (const at of Array.from(a.attributes)) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
    for (const at of Array.from(b.attributes)) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
    const ac = Array.from(a.childNodes), bc = Array.from(b.childNodes);
    bc.forEach((nd, k) => { if (k < ac.length) morph(ac[k], nd); else a.appendChild(nd.cloneNode(true)); });
    for (let k = bc.length; k < ac.length; k++) ac[k].remove();
  }
  function paint(el) {
    const id = el.dataset.hv, d = HV.defs[id]; if (!d) return;
    const u = stOf(id), n = d.steps.length, i = Math.min(u.i, n - 1);
    el.dataset.step = i; el.dataset.playing = u.run ? 1 : 0;
    const pic = el.querySelector('[data-hv-pic]'), tpl = document.createElement('template'); tpl.innerHTML = picHtml(id, i);
    const nw = tpl.content.firstElementChild, old = pic && pic.firstElementChild;
    if (old && nw) morph(old, nw); else if (pic) pic.innerHTML = tpl.innerHTML;
    const cap = el.querySelector('[data-hv-cap]'); if (cap) cap.innerHTML = capHtml(d, i);
    const cnt = el.querySelector('[data-hv-count]'); if (cnt) cnt.textContent = countTxt(i, n);
    const pb = el.querySelector('[data-hv-play]');
    if (pb) { pb.textContent = u.run ? '❚❚' : '▶'; pb.setAttribute('aria-pressed', String(u.run)); pb.setAttribute('aria-label', t(u.run ? UI.pause : UI.play)); pb.title = t(u.run ? UI.pause : UI.play); }
    el.querySelectorAll('.hv-all li').forEach((li, k) => { li.className = k === i ? 'on' : ''; const b = li.firstElementChild; if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
  }
  const els = id => Array.from(document.querySelectorAll('.hvk[data-hv]')).filter(e => e.dataset.hv === id);
  const paintAll = id => els(id).forEach(paint);
  const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight || 0); };
  function stopT(id) { const tm = HV.timers.get(id); if (tm) { clearInterval(tm); HV.timers.delete(id); } }
  function tick(id) {
    const list = els(id), u = stOf(id);
    if (!list.length || !u.run) { stopT(id); return; }
    if (document.hidden || !list.some(visible)) return;   // off screen or hidden tab: the clock waits
    u.i = (u.i + 1) % HV.defs[id].steps.length; paintAll(id);
  }
  /* after every render (and after a control click): one interval per playing figure id in the DOM, none for the others */
  function hvSync() {
    const present = new Set(Array.from(document.querySelectorAll('.hvk[data-hv]')).map(e => e.dataset.hv));
    for (const id of Array.from(HV.timers.keys())) if (!present.has(id) || !stOf(id).run) stopT(id);
    present.forEach(id => { const d = HV.defs[id], u = d && stOf(id); if (d && u.run && d.steps.length > 1 && !HV.timers.has(id)) HV.timers.set(id, setInterval(() => tick(id), d.ms || 2600)); });
  }
  HELP.hvSync = hvSync;
  HELP.afterRender.push(hvSync);
  Object.assign(ACT, {
    hvStep: d => { const u = stOf(d.id), n = HV.defs[d.id].steps.length; u.i = (u.i + (+d.v) + n) % n; u.run = false; paintAll(d.id); hvSync(); },
    hvGo: d => { const u = stOf(d.id), n = HV.defs[d.id].steps.length; u.i = Math.max(0, Math.min(n - 1, +d.v)); u.run = false; paintAll(d.id); hvSync(); },
    hvTog: d => { const u = stOf(d.id); u.run = !u.run; paintAll(d.id); hvSync(); },
  });
  document.addEventListener('toggle', e => { const dt = e.target; if (dt && dt.classList && dt.classList.contains('hv-all')) { const k = dt.closest('.hvk'); if (k) stOf(k.dataset.hv).all = dt.open; } }, true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) hvSync(); });

  /* ================= figures ================= */

  /* (1) end-to-end shipment flow (0.3.10 flow.tsx) */
  const FS = [
    { t: ['Бронирование', 'Buchung', 'Booking', 'Брондау'], sub: ['портал · «Бронирования»', 'Portal · „Buchungen“', 'portal · "Bookings"', 'портал · «Брондар»'],
      cap: ['Клиент бронирует в портале (или через Partner API): откуда, куда, паллеты, вес, температура. Диспетчер подтверждает на странице «Бронирования» — появляется заказ.', 'Der Kunde bucht im Portal (oder über die Partner-API): von, nach, Paletten, Gewicht, Temperatur. Die Disposition bestätigt auf „Buchungen“ — es entsteht ein Auftrag.', 'The customer books in the portal (or via the partner API): from, to, pallets, weight, temperature. Dispatch confirms on "Bookings" — an order is created.', 'Клиент порталда (немесе Partner API арқылы) брондайды: қайдан, қайда, паллеттер, салмақ, температура. Диспетчер «Брондар» бетінде растайды — тапсырыс пайда болады.'] },
    { t: ['Планирование', 'Planung', 'Planning', 'Жоспарлау'], sub: ['02 Диспетчер · 14 Планирование', '02 Disponent · 14 Planung', '02 Dispatcher · 14 Planning', '02 Диспетчер · 14 Жоспарлау'],
      cap: ['Заказ попадает на рейс линии: машина, водитель, отправление. Подбор ТС проверяет зоны, вес, объём, оси и ДОПОГ.', 'Der Auftrag kommt auf eine Tour der Linie: Fahrzeug, Fahrer, Abfahrt. Die Fahrzeugsuche prüft Zonen, Gewicht, Volumen, Achsen und ADR.', 'The order goes onto a trip of the line: vehicle, driver, departure. The truck finder checks zones, weight, volume, axles and ADR.', 'Тапсырыс желі рейсіне түседі: көлік, жүргізуші, жөнелту. Көлік таңдау аймақтарды, салмақты, көлемді, осьтерді және ДОПОГ-ты тексереді.'] },
    { t: ['Загрузка', 'Beladung', 'Loading', 'Тиеу'], sub: ['03 Загрузка · 04 Отправка (SSCC)', '03 Beladung · 04 Versand (SSCC)', '03 Load · 04 Ship (SSCC)', '03 Тиеу · 04 Жөнелту (SSCC)'],
      cap: ['Склад грузит по плану: каждое место сканируется по SSCC, расчёт массы на оси и высоты показывает перегруз сразу.', 'Das Lager lädt nach Plan: jedes Packstück wird per SSCC gescannt, Achslast- und Höhenrechnung zeigen Überladung sofort.', 'The warehouse loads to plan: every package is scanned by SSCC; the axle-load and height check shows an overload at once.', 'Қойма жоспар бойынша тиейді: әр орын SSCC бойынша сканерленеді, ось салмағы мен биіктік есебі асқын жүкті бірден көрсетеді.'] },
    { t: ['Выпуск Go/No-Go', 'Freigabe Go/No-Go', 'Go/No-Go release', 'Go/No-Go шығару'], sub: ['08 Документы РК', '08 Dokumente RK', '08 Documents KZ', '08 ҚР құжаттары'],
      cap: ['Отправление только после выпуска Go/No-Go: документы, медосмотр, температура, загрузка, тревоги. Любой красный шлюз = No-Go → обратно к загрузке; обход — только с правом и причиной (аудит).', 'Abfahrt nur nach Go/No-Go-Freigabe: Dokumente, Fahrertauglichkeit, Temperatur, Beladung, Alarme. Ein rotes Gate = No-Go → zurück zur Beladung; Übersteuern nur mit Recht und Begründung (Audit).', 'Departure only after the Go/No-Go release: documents, medical check, temperature, load, alarms. Any red gate = No-Go → back to loading; an override needs the permission and a reason (audited).', 'Жөнелту тек Go/No-Go шығарылғаннан кейін: құжаттар, медициналық тексеру, температура, тиеу, дабылдар. Кез келген қызыл шлюз = No-Go → тиеуге қайту; айналып өту тек құқықпен және себеппен (аудит).'] },
    { t: ['В пути: мониторинг', 'Unterwegs: Überwachung', 'In transit: monitoring', 'Жолда: бақылау'], sub: ['05 Термо · 06 Погода · 07 Безопасность · связь', '05 Thermo · 06 Wetter · 07 Sicherheit · Netz', '05 Thermo · 06 Weather · 07 Security · coverage', '05 Термо · 06 Ауа райы · 07 Қауіпсіздік · байланыс'],
      cap: ['Телеметрия каждые несколько минут: температура камер, погода на маршруте, двери, SOS, связь. Отклонение → тревога и эскалация.', 'Telemetrie alle paar Minuten: Kammertemperatur, Wetter auf der Route, Türen, SOS, Netz. Abweichung → Alarm und Eskalation.', 'Telemetry every few minutes: chamber temperature, weather on the route, doors, SOS, coverage. A deviation → alarm and escalation.', 'Бірнеше минут сайын телеметрия: камера температурасы, маршруттағы ауа райы, есіктер, SOS, байланыс. Ауытқу → дабыл және эскалация.'] },
    { t: ['Доставка · ePOD', 'Zustellung · ePOD', 'Delivery · ePOD', 'Жеткізу · ePOD'], sub: ['13 Приложение водителя', '13 Fahrer-App', '13 Driver app', '13 Жүргізуші қосымшасы'],
      cap: ['На точке водитель: прибытие, сканирование, фото, подпись получателя → ePOD. Только окончательный ePOD закрывает доставку.', 'Am Stopp: Ankunft, Scan, Foto, Unterschrift des Empfängers → ePOD. Nur der endgültige ePOD schließt die Zustellung ab.', 'At the stop: arrival, scan, photo, consignee signature → ePOD. Only the final ePOD completes the delivery.', 'Нүктеде жүргізуші: келу, сканерлеу, фото, алушының қолы → ePOD. Жеткізуді тек түпкілікті ePOD жабады.'] },
    { t: ['ЭСФ · счёт', 'ESF · Rechnung', 'ESF · invoice', 'ЭШФ · шот'], sub: ['08 Документы · 15 Отчёты', '08 Dokumente · 15 Berichte', '08 Documents · 15 Reports', '08 Құжаттар · 15 Есептер'],
      cap: ['Окончательный ePOD запускает ЭСФ (НДС 16 %) и счёт; затраты рейса идут в отчёты и в расчёт стоимости.', 'Der endgültige ePOD löst ESF (16 % MwSt.) und Rechnung aus; die Tourkosten gehen in Berichte und Kostenrechnung.', 'The final ePOD triggers the ESF (16 % VAT) and the invoice; trip costs flow into reports and the cost model.', 'Түпкілікті ePOD ЭШФ (ҚҚС 16 %) мен шотты іске қосады; рейс шығындары есептерге және құн есебіне түседі.'] },
  ];
  const FP = [{ x: 20, y: 30, w: 190, h: 86 }, { x: 250, y: 30, w: 190, h: 86 }, { x: 480, y: 30, w: 190, h: 86 }, null, { x: 710, y: 200, w: 260, h: 86 }, { x: 430, y: 200, w: 230, h: 86 }, { x: 150, y: 200, w: 230, h: 86 }];
  const FD = { cx: 850, cy: 73, w: 210, h: 120 };
  HELP.fig('flow', {
    title: ['Сквозной процесс отправки', 'Sendungsablauf von Anfang bis Ende', 'End-to-end shipment flow', 'Жөнелтудің толық процесі'],
    lead: ['Путь одной отправки по функциям 01–17 (номер — в надзаголовке вкладки) — нажмите шаг или ▶.', 'Der Weg einer Sendung über die Funktionen 01–17 (Nummer in der Kopfzeile des Reiters) — Schritt anklicken oder ▶.', 'One shipment through functions 01–17 (the number is in the tab eyebrow) — click a step or ▶.', 'Бір жөнелтудің 01–17 функциялар бойынша жолы (нөмір қойынды тақырыбында) — қадамды немесе ▶ басыңыз.'],
    steps: FS.map(s => s.cap), view: '0 0 1000 310', ms: 2600,
    draw(s) {
      const c = s === 3 ? { x: FD.cx, y: FD.cy } : { x: FP[s].x + FP[s].w / 2, y: FP[s].y + FP[s].h / 2 };
      return Arrow({ x1: 210, y1: 73, x2: 248, y2: 73, on: s === 0 }) + Arrow({ x1: 440, y1: 73, x2: 478, y2: 73, on: s === 1 }) + Arrow({ x1: 670, y1: 73, x2: 744, y2: 73, on: s === 2 })
        + Arrow({ d: `M${FD.cx},${FD.cy + 60} L${FD.cx},198`, on: s === 3, tone: 'ok' }) + Tag(FD.cx + 30, 178, 'Go', 'ok')
        + Arrow({ d: `M${FD.cx - 50},${FD.cy - 30} C${FD.cx - 80},-6 640,-6 575,28`, tone: 'bad', dashed: true }) + Tag(705, 16, 'No-Go', 'bad')
        + Arrow({ x1: 710, y1: 243, x2: 662, y2: 243, on: s === 4 }) + Arrow({ x1: 430, y1: 243, x2: 382, y2: 243, on: s === 5 })
        + FS.map((x, i) => i === 3 ? Diamond(Object.assign({ label: t(x.t), on: s === i }, FD)) : Box(Object.assign({ label: t(x.t), sub: t(x.sub), on: s === i, done: i < s, tone: i === 6 ? 'ok' : 'base' }, FP[i]))).join('')
        + Txt(FD.cx, FD.cy + 76, t(FS[3].sub), { anchor: 'middle', size: 11, cls: 'hv-sb' })
        + Token(c.x, s === 3 ? c.y - 40 : c.y - 52);
    },
  });

  /* (2) daily loop (17 numbered functions, in v6 grouped into the menu sections) vs "Records and administration" (0.3.10 split.tsx) */
  const SPN = [['01', 'dashboard', ['Обзор', 'Übersicht', 'Overview', 'Шолу']], ['02', 'dispatch', ['Диспетчер', 'Disponent', 'Dispatcher', 'Диспетчер']], ['03', 'orders', ['Загрузка', 'Beladung', 'Load', 'Тиеу']],
    ['04', 'orders', ['Отправка', 'Versand', 'Shipping', 'Жөнелту']], ['05', 'routes', ['Термостатус', 'Thermostatus', 'Thermo status', 'Термостатус']], ['06', 'routes', ['Погода', 'Wetter', 'Weather', 'Ауа райы']],
    ['07', 'routes', ['Безопасность', 'Sicherheit', 'Security', 'Қауіпсіздік']], ['08', 'orders', ['Документы', 'Dokumente', 'Documents', 'Құжаттар']], ['09', 'pod', ['Качество', 'Qualität', 'Quality', 'Сапа']],
    ['10', 'fleet', ['Автопарк', 'Fuhrpark', 'Fleet', 'Автопарк']], ['11', 'dispatch', ['Партнёры', 'Partner', 'Partners', 'Серіктестер']], ['12', 'drivers', ['Персонал', 'Personal', 'Staff', 'Персонал']],
    ['13', 'drivers', ['Водитель', 'Fahrer-App', 'Driver app', 'Жүргізуші']], ['14', 'dispatch', ['Планирование', 'Planung', 'Planning', 'Жоспарлау']], ['15', 'reports', ['Отчёты', 'Berichte', 'Reports', 'Есептер']],
    ['16', 'billing', ['Затраты', 'Kosten', 'Costs', 'Шығындар']], ['17', 'baseline', ['Исх. данные', 'Ausgangsdaten', 'Baseline', 'Бастапқы деректер']]];
  const SPR = [
    [['Заказы и рейсы', 'Aufträge und Touren', 'Orders and trips', 'Тапсырыстар мен рейстер'], ['бронирования · рейсы · заказы', 'Buchungen · Touren · Aufträge', 'bookings · trips · orders', 'брондар · рейстер · тапсырыстар']],
    [['Журналы', 'Journale', 'Logs', 'Журналдар'], ['температура · тревоги', 'Temperatur · Alarme', 'temperature · alarms', 'температура · дабылдар']],
    [['CRM', 'CRM', 'CRM', 'CRM'], ['лиды · клиенты · задачи', 'Leads · Kunden · Aufgaben', 'leads · customers · tasks', 'лидтер · клиенттер · тапсырмалар']],
    [['Реестры', 'Register', 'Registers', 'Тізілімдер'], ['ТС · водители · линии · справочники', 'Fahrzeuge · Fahrer · Linien · Stammdaten', 'vehicles · drivers · lines · master data', 'көліктер · жүргізушілер · желілер · анықтамалықтар']],
    [['Администрирование', 'Administration', 'Administration', 'Әкімшілік'], ['пользователи · интеграции · аудит', 'Benutzer · Integrationen · Audit', 'users · integrations · audit', 'пайдаланушылар · интеграциялар · аудит']],
  ];
  const SPS = [
    { hi: 'ops', cap: ['Слева — 17 пронумерованных функций: ежедневный контур «наблюдать и решать» в порядке движения отправки. Здесь весь день работают диспетчерская, склад, водители и качество; бледные клетки недоступны вашей роли.', 'Links — 17 nummerierte Funktionen: der tägliche Kreis „beobachten und entscheiden“ in der Reihenfolge der Sendung. Hier arbeiten Leitstelle, Lager, Fahrer und Qualität den ganzen Tag; blasse Felder sind für Ihre Rolle nicht sichtbar.', 'Left — 17 numbered functions: the daily "watch and decide" loop in the order a shipment flows. Control room, warehouse, drivers and quality work here all day; pale cells are not available to your role.', 'Сол жақта — 17 нөмірленген функция: жөнелту қозғалысы ретімен «бақылау және шешу» күнделікті контуры. Мұнда күні бойы диспетчерлік, қойма, жүргізушілер және сапа жұмыс істейді; бозғылт ұяшықтар рөліңізге қолжетімсіз.'] },
    { hi: 'rec', cap: ['Справа — «Учёт и администрирование»: записи, которые создают и ведут (вводятся один раз, меняются редко) — администратор, продажи, аудитор.', 'Rechts — „Stammdaten und Verwaltung“: Datensätze, die angelegt und gepflegt werden (einmal erfasst, selten geändert) — Administrator, Vertrieb, Auditor.', 'Right — "Records and administration": records that are created and maintained (entered once, rarely changed) — administrator, sales, auditor.', 'Оң жақта — «Есеп және әкімшілік»: жасалатын және жүргізілетін жазбалар (бір рет енгізіледі, сирек өзгереді) — әкімші, сату, аудитор.'] },
    { hi: 'in', cap: ['Поток ◀: заказы, машины, водители, линии и тарифы из учёта используются функциями 01–17 каждый день.', 'Fluss ◀: Aufträge, Fahrzeuge, Fahrer, Linien und Tarife aus den Stammdaten nutzen die Funktionen 01–17 jeden Tag.', 'Flow ◀: orders, vehicles, drivers, lines and tariffs from the records are used by functions 01–17 every day.', 'Ағын ◀: есептегі тапсырыстар, көліктер, жүргізушілер, желілер мен тарифтер 01–17 функцияларында күн сайын қолданылады.'] },
    { hi: 'out', cap: ['Поток ▶: каждое действие (статусы, подписи, отклонения, тревоги) — проверенная операция с записью в журнал аудита и отчёты.', 'Fluss ▶: jede Aktion (Status, Unterschriften, Abweichungen, Alarme) ist eine geprüfte Operation mit Eintrag in Audit-Protokoll und Berichte.', 'Flow ▶: every action (status, signatures, deviations, alarms) is a checked operation with an entry in the audit log and reports.', 'Ағын ▶: әр әрекет (мәртебелер, қолтаңбалар, ауытқулар, дабылдар) — аудит журналына және есептерге жазылатын тексерілген операция.'] },
    { hi: 'num', cap: ['Почему раздельно: разные пользователи, разные права (users:admin, audit:read, pii:read …), разный ритм данных. Номера 01–17 стабильны — в v6 они стоят в надзаголовке вкладки.', 'Warum getrennt: verschiedene Nutzer, verschiedene Rechte (users:admin, audit:read, pii:read …), verschiedener Datenrhythmus. Die Nummern 01–17 bleiben stabil — in v6 stehen sie in der Kopfzeile des Reiters.', 'Why split: different users, different rights (users:admin, audit:read, pii:read …), different data rhythm. Numbers 01–17 stay stable — in v6 they sit in the tab eyebrow.', 'Неге бөлек: әртүрлі пайдаланушылар, әртүрлі құқықтар (users:admin, audit:read, pii:read …), деректердің әртүрлі ырғағы. 01–17 нөмірлері тұрақты — v6-да олар қойынды тақырыбында.'] },
  ];
  HELP.fig('split', {
    title: ['17 функций и «Учёт и администрирование» — почему так разделено', '17 Funktionen und „Stammdaten und Verwaltung“ — warum getrennt', '17 functions and "Records and administration" — why the split', '17 функция және «Есеп және әкімшілік» — неге бөлінген'],
    steps: SPS.map(x => x.cap), view: '0 0 1000 420', ms: 3000,
    draw(s) {
      const hi = SPS[s].hi;
      let g = `<g class="hv-bx${hi === 'ops' || hi === 'num' ? ' on' : ''}"><rect x="10" y="10" width="520" height="400" rx="10"/></g>` + Lines(270, 34, t(['17 функций операций · ежедневно, живые данные', '17 Betriebsfunktionen · täglich, live', '17 operations functions · daily, live data', '17 операция функциясы · күнделікті, тірі деректер']), { max: 70, size: 14, cls: 'hv-st' });
      SPN.forEach((n, i) => {
        const col = i % 3, row = Math.floor(i / 3), x = 26 + col * 168, y = 56 + row * 57, mine = typeof canSee !== 'function' || canSee(n[1]);
        g += `<g class="hv-bx${hi === 'num' ? ' on' : ''}${mine ? '' : ' t-muted'}" data-split-screen="${n[0]}"><rect x="${x}" y="${y}" width="158" height="46" rx="6"/>${Txt(x + 10, y + 23, n[0], { mid: true, size: 15, cls: 'hv-st' })}${Txt(x + 38, y + 23, t(n[2]), { mid: true, size: 12.5 })}</g>`;
      });
      g += `<g class="hv-bx t-accent${hi === 'rec' ? ' on' : ''}"><rect x="650" y="10" width="340" height="400" rx="10"/></g>` + Lines(820, 34, t(['Учёт и администрирование · вводится один раз', 'Stammdaten und Verwaltung · einmal erfasst', 'Records and administration · entered once', 'Есеп және әкімшілік · бір рет енгізіледі']), { max: 34, size: 13, cls: 'hv-st' });
      SPR.forEach((r, i) => { g += `<g class="hv-bx"><rect x="666" y="${66 + i * 66}" width="308" height="56" rx="6"/>${Lines(820, 84 + i * 66, t(r[0]), { max: 40, size: 13, cls: 'hv-st' })}${Lines(820, 106 + i * 66, t(r[1]), { max: 46, size: 11, cls: 'hv-sb' })}</g>`; });
      g += Arrow({ x1: 648, y1: 150, x2: 534, y2: 150, on: hi === 'in', label: t(['◀ данные для работы', '◀ Daten für die Arbeit', '◀ data to work with', '◀ жұмысқа деректер']), lx: 590, ly: 128 })
        + Arrow({ x1: 534, y1: 290, x2: 648, y2: 290, on: hi === 'out', label: t(['аудит, отчёты ▶', 'Audit, Berichte ▶', 'audit, reports ▶', 'аудит, есептер ▶']), lx: 590, ly: 268 });
      if (hi === 'num') g += Tag(270, 398, t(['номера 01–17 не меняются', 'Nummern 01–17 bleiben', 'numbers 01–17 stay fixed', '01–17 нөмірлері өзгермейді']));
      return g;
    },
  });

  /* (3) Go / No-Go: nine gates (v6 only, animated) */
  const GG = [['Транспорт доступен', 'Fahrzeug verfügbar', 'Vehicle available', 'Көлік қолжетімді'], ['Температурный режим', 'Temperaturklasse', 'Temperature class', 'Температура режимі'], ['Водитель допущен', 'Fahrer zugelassen', 'Driver qualified', 'Жүргізуші жіберілді'], ['Документы полные', 'Dokumente vollständig', 'Documents complete', 'Құжаттар толық'], ['Страховка · налог · ТО', 'Versicherung · Steuer · TÜV', 'Insurance · tax · inspection', 'Сақтандыру · салық · ТО'], ['Места сверены', 'Packstücke abgeglichen', 'Packages reconciled', 'Орындар салыстырылды'], ['Логгер откалиброван', 'Logger kalibriert', 'Logger calibrated', 'Логгер калибрленген'], ['ДОПОГ выполнен', 'ADR erfüllt', 'ADR met', 'ДОПОГ орындалды'], ['Погода по маршруту', 'Wetter auf der Route', 'Weather on the route', 'Маршрут бойынша ауа райы']];
  const GS = [
    ['Перед выездом выпуск Go/No-Go проверяет девять шлюзов рейса; пока не все зелёные, кнопка «Выпустить рейс» заблокирована.', 'Vor der Abfahrt prüft die Go/No-Go-Freigabe neun Gates der Fahrt; solange nicht alle grün sind, ist „Fahrt freigeben“ gesperrt.', 'Before departure the Go/No-Go release checks nine gates of the trip; until all are green, "Release trip" stays locked.', 'Шығар алдында Go/No-Go шығаруы рейстің тоғыз шлюзін тексереді; бәрі жасыл болмайынша «Рейсті шығару» бұғатталған.'],
    ['Транспорт доступен, температурный режим кузова совпадает с грузом, водитель допущен (медосмотр, права, свидетельство ДОПОГ).', 'Fahrzeug verfügbar, die Temperaturklasse des Aufbaus passt zur Ware, Fahrer zugelassen (Tauglichkeit, Führerschein, ADR-Schein).', 'Vehicle available, the body temperature class matches the goods, driver qualified (medical check, licence, ADR certificate).', 'Көлік қолжетімді, шанақтың температура режимі жүкке сай, жүргізуші жіберілді (медтексеру, куәлік, ДОПОГ).'],
    ['Документы полные, страховка · налог · ТО действуют — но «Места сверены» красный: одно место SSCC не отсканировано. No-Go → обратно на загрузку.', 'Dokumente vollständig, Versicherung · Steuer · TÜV gültig — aber „Packstücke abgeglichen“ ist rot: ein SSCC-Packstück fehlt im Scan. No-Go → zurück zur Beladung.', 'Documents complete, insurance · tax · inspection valid — but "Packages reconciled" is red: one SSCC package was not scanned. No-Go → back to loading.', 'Құжаттар толық, сақтандыру · салық · ТО жарамды — бірақ «Орындар салыстырылды» қызыл: бір SSCC орны сканерленбеген. No-Go → тиеуге қайту.'],
    ['Место досканировано — шлюз зелёный. Логгер откалиброван, ДОПОГ выполнен; погода по маршруту — предупреждение (жёлтый), выпуск не блокирует.', 'Packstück nachgescannt — das Gate ist grün. Logger kalibriert, ADR erfüllt; Wetter auf der Route ist eine Warnung (gelb) und sperrt nicht.', 'Package rescanned — the gate turns green. Logger calibrated, ADR met; weather on the route is a warning (yellow) and does not block.', 'Орын қайта сканерленді — шлюз жасыл. Логгер калибрленген, ДОПОГ орындалды; маршрут ауа райы — ескерту (сары), бұғаттамайды.'],
    ['Все шлюзы пройдены → «Выпустить рейс»: водитель видит «В путь». Обход красного шлюза — только с правом и причиной, запись в аудит.', 'Alle Gates bestanden → „Fahrt freigeben“: der Fahrer sieht „Losfahren“. Ein rotes Gate übersteuern nur mit Recht und Begründung, Eintrag im Audit.', 'All gates passed → "Release trip": the driver sees "Start the trip". Overriding a red gate needs the permission and a reason, written to the audit log.', 'Барлық шлюз өтті → «Рейсті шығару»: жүргізуші «Жолға шығу» көреді. Қызыл шлюзді айналып өту — тек құқықпен және себеппен, аудитке жазылады.'],
  ];
  const gTone = (k, s) => s === 0 ? 'base' : s === 1 ? (k < 3 ? 'ok' : 'base') : s === 2 ? (k < 5 ? 'ok' : k === 5 ? 'bad' : 'base') : k === 8 ? 'warn' : 'ok';
  HELP.fig('gonogo', {
    title: ['Go / No-Go: девять шлюзов перед выездом', 'Go / No-Go: neun Gates vor der Abfahrt', 'Go / No-Go: nine gates before departure', 'Go / No-Go: шығар алдында тоғыз шлюз'],
    steps: GS, view: '0 0 1000 300', ms: 2800,
    draw(s) {
      const pos = k => { const r = k < 5 ? 0 : 1, c = r ? k - 5 : k; return { x: 14 + c * 196, y: r ? 170 : 40 }; };
      const on = k => (s === 1 && k < 3) || (s === 2 && (k === 3 || k === 4 || k === 5)) || (s === 3 && k >= 5);
      let g = '';
      for (let k = 0; k < 9; k++) { const p = pos(k); if (k !== 4 && k < 8) g += Arrow({ x1: p.x + 172, y1: p.y + 35, x2: p.x + 194, y2: p.y + 35, on: on(k) }); }
      g += Arrow({ d: 'M884,112 L884,140 L100,140 L100,168', on: s === 2 || s === 3 }) + Arrow({ x1: 4 * 196 - 10, y1: 205, x2: 4 * 196 + 12, y2: 205, on: s === 4, tone: s === 4 ? 'ok' : undefined });
      GG.forEach((x, k) => { const p = pos(k); g += Box({ x: p.x, y: p.y, w: 172, h: 70, label: (k + 1) + ' · ' + t(x), tone: gTone(k, s), on: on(k), size: 12.5, attrs: ` data-gate="${k}"` }); });
      g += Box({ x: 14 + 4 * 196, y: 170, w: 172, h: 70, label: t(['ВЫПУСТИТЬ РЕЙС', 'FAHRT FREIGEBEN', 'RELEASE TRIP', 'РЕЙСТІ ШЫҒАРУ']), sub: s === 4 ? '✓ Go' : t(['заблокировано', 'gesperrt', 'locked', 'бұғатталған']), tone: s === 4 ? 'ok' : 'muted', on: s === 4 });
      if (s === 2) g += Tag(100, 266, 'No-Go → ' + t(['03 Загрузка и вес', '03 Beladung und Gewicht', '03 Load and weight', '03 Тиеу және салмақ']), 'bad');
      if (s === 4) g += Tag(884, 266, t(['обход: право + причина → аудит', 'Übersteuern: Recht + Grund → Audit', 'override: permission + reason → audit', 'айналып өту: құқық + себеп → аудит']), 'muted');
      const fr = s === 0 ? null : s === 1 ? 2 : s === 2 ? 5 : s === 3 ? 8 : 9, fp = fr == null ? { x: -40, y: 20 } : fr === 9 ? { x: 14 + 4 * 196, y: 170 } : pos(fr);
      return g + Token(fp.x + 86, fp.y - 10, 8, s === 2 ? 'bad' : 'accent');
    },
  });

  /* (4) loading instruction (v6 only, animated): orders → zones → weight / axles → split → loading order → weighing */
  const LO = [{ id: 'ORD-2041', c: ['Актобе', 'Aktobe', 'Aktobe', 'Ақтөбе'], n: 4, z: 'c' }, { id: 'ORD-2042', c: ['Костанай', 'Kostanai', 'Kostanay', 'Қостанай'], n: 5, z: 'a' }, { id: 'ORD-2043', c: ['Актобе', 'Aktobe', 'Aktobe', 'Ақтөбе'], n: 6, z: 'a' }];
  const LT1 = [0, 0, 0, 0, 2, 2, 2, 1, 1, 1, 1, 1];   // order index per place of truck 1 (front wall → door), LIFO: the first stop sits at the door
  const LS = [
    ['Отметьте заказы рейса «Запад»: ORD-2041 (Актобе, 4 пал., 2–8 °C), ORD-2042 (Костанай, 5 пал.), ORD-2043 (Актобе, 6 пал.) — итог 15 паллет.', 'Aufträge der Fahrt „West“ markieren: ORD-2041 (Aktobe, 4 Pal., 2–8 °C), ORD-2042 (Kostanai, 5 Pal.), ORD-2043 (Aktobe, 6 Pal.) — zusammen 15 Paletten.', 'Tick the orders of the "West" trip: ORD-2041 (Aktobe, 4 pal., 2–8 °C), ORD-2042 (Kostanay, 5 pal.), ORD-2043 (Aktobe, 6 pal.) — 15 pallets in total.', '«Батыс» рейсінің тапсырыстарын белгілеңіз: ORD-2041 (Ақтөбе, 4 пал., 2–8 °C), ORD-2042 (Қостанай, 5 пал.), ORD-2043 (Ақтөбе, 6 пал.) — барлығы 15 паллет.'],
    ['Тип ТС 7,5 т с двумя зонами: камера 2–8 °C у передней стенки (4 места), за перегородкой 15–25 °C (8 мест). Холодный груз — только в холодную зону.', 'Fahrzeugtyp 7,5 t mit zwei Zonen: Kammer 2–8 °C an der Stirnwand (4 Plätze), hinter der Trennwand 15–25 °C (8 Plätze). Kühlware nur in die kalte Zone.', 'Truck type 7.5 t with two zones: the 2–8 °C chamber at the front wall (4 places), behind the bulkhead 15–25 °C (8 places). Chilled goods only in the cold zone.', '7,5 т екі аймақты КҚ: алдыңғы қабырғада 2–8 °C камерасы (4 орын), қалқаның артында 15–25 °C (8 орын). Салқын жүк тек суық аймаққа.'],
    ['Шкалы: мест 15 / 12, масса 8 100 / 7 500 кг, задняя ось перегружена (+600 кг), высота в норме — в таком виде загрузка не допускается.', 'Balken: Plätze 15 / 12, Masse 8 100 / 7 500 kg, Hinterachse überladen (+600 kg), Höhe in Ordnung — so ist die Beladung nicht zulässig.', 'Bars: places 15 / 12, weight 8 100 / 7 500 kg, rear axle overloaded (+600 kg), height fine — the load is not allowed like this.', 'Шкалалар: орын 15 / 12, салмақ 8 100 / 7 500 кг, артқы ось асыра жүктелген (+600 кг), биіктік қалыпты — мұндай тиеуге жол берілмейді.'],
    ['Не помещается → разбить: 3 паллеты ORD-2043 уходят на вторую машину (3,5 т). Первая: мест 12 / 12, масса 6 480 кг, обе оси в норме.', 'Passt nicht → aufteilen: 3 Paletten von ORD-2043 gehen auf ein zweites Fahrzeug (3,5 t). Erstes: Plätze 12 / 12, Masse 6 480 kg, beide Achsen im Limit.', 'Does not fit → split: 3 pallets of ORD-2043 go to a second truck (3.5 t). First truck: places 12 / 12, weight 6 480 kg, both axles within limits.', 'Сыймайды → бөлу: ORD-2043-тің 3 паллеті екінші көлікке (3,5 т) кетеді. Біріншісі: орын 12 / 12, салмақ 6 480 кг, екі ось қалыпты.'],
    ['Порядок погрузки LIFO: 1–4 холодные у передней стенки, 5–7 Актобе, 8–12 Костанай у двери — первая точка выгружается первой.', 'Ladereihenfolge LIFO: 1–4 Kühlware an der Stirnwand, 5–7 Aktobe, 8–12 Kostanai an der Tür — der erste Stopp wird zuerst entladen.', 'Loading order LIFO: 1–4 chilled at the front wall, 5–7 Aktobe, 8–12 Kostanay at the door — the first stop is unloaded first.', 'LIFO тиеу реті: 1–4 салқын жүк алдыңғы қабырғада, 5–7 Ақтөбе, 8–12 Қостанай есікте — бірінші нүкте бірінші түсіріледі.'],
    ['Взвешивание на выезде: 6 520 кг (план 6 480, отклонение в допуске), SSCC 12 / 12 отсканированы → шлюзы «Места сверены» и «Вес» зелёные на «Документы РК».', 'Verwiegung bei Abfahrt: 6 520 kg (Plan 6 480, Abweichung in Toleranz), SSCC 12 / 12 gescannt → die Gates „Packstücke abgeglichen“ und „Gewicht“ sind grün auf „KZ-Dokumente“.', 'Weighing at departure: 6 520 kg (plan 6 480, deviation within tolerance), SSCC 12 / 12 scanned → the gates "Packages reconciled" and "Weight" turn green on "Documents KZ".', 'Шығарда өлшеу: 6 520 кг (жоспар 6 480, ауытқу рұқсатта), SSCC 12 / 12 сканерленді → «ҚР құжаттары» бетінде «Орындар салыстырылды» және «Салмақ» шлюздері жасыл.'],
  ];
  const LV = [{ pl: [15, 12], kg: [8100, 7500], fa: [3300, 3600], ra: [5900, 5300], h: [1.8, 2.4] }, { pl: [12, 12], kg: [6480, 7500], fa: [3150, 3600], ra: [4950, 5300], h: [1.8, 2.4] }];
  const KGL = ['кг', 'kg', 'kg', 'кг'];
  HELP.fig('load', {
    title: ['Инструкция по загрузке: от заказов до взвешивания', 'Beladeanleitung: von Aufträgen bis zur Verwiegung', 'Loading instruction: from orders to weighing', 'Тиеу нұсқаулығы: тапсырыстардан өлшеуге дейін'],
    lead: ['Пример рейса «Запад» Астана → Костанай → Актобе, вид сверху (кабина слева, дверь справа).', 'Beispiel Fahrt „West“ Astana → Kostanai → Aktobe, Draufsicht (Kabine links, Tür rechts).', 'Example trip "West" Astana → Kostanay → Aktobe, top view (cab on the left, door on the right).', '«Батыс» рейсінің мысалы Астана → Қостанай → Ақтөбе, жоғарыдан көрініс (кабина солда, есік оңда).'],
    steps: LS, view: '0 0 1000 380', ms: 3000,
    draw(s) {
      let g = '';
      LO.forEach((o, k) => { g += Box({ x: 20, y: 30 + k * 60, w: 250, h: 50, label: '✓ ' + o.id + ' · ' + t(o.c), sub: o.n + ' ' + t(['пал.', 'Pal.', 'pal.', 'пал.']) + ' · ' + (o.z === 'c' ? '2–8 °C' : '15–25 °C'), tone: o.z === 'c' ? 'accent' : 'base', on: s === 0, size: 12.5, attrs: ` data-order="${o.id}"` }); });
      /* bars: places, weight, axles, height (from step 3 on: after the split) */
      const V = LV[s >= 3 ? 1 : 0], unit = t(KGL);
      [[t(['Мест', 'Plätze', 'Places', 'Орын']), 'pl', ''], [t(['Масса', 'Masse', 'Weight', 'Салмақ']), 'kg', unit], [t(['Пер. ось', 'Vorderachse', 'Front axle', 'Алд. ось']), 'fa', unit], [t(['Задн. ось', 'Hinterachse', 'Rear axle', 'Арт. ось']), 'ra', unit], [t(['Высота', 'Höhe', 'Height', 'Биіктік']), 'h', 'm']].forEach((b, j) => {
        const y = 232 + j * 28, v = V[b[1]][0], max = V[b[1]][1], over = s >= 2 && v > max, show = s >= 2, w = show ? 120 * Math.min(1.25, v / max) / 1.25 : 0;
        const dec = n => (LI === 2 ? n.toFixed(1) : n.toFixed(1).replace('.', ',')), val = b[1] === 'h' ? dec(v) + ' / ' + dec(max) : fmtKg(v) + ' / ' + fmtKg(max);
        g += `<g data-lbar="${b[1]}" data-over="${over ? 1 : 0}">${Txt(20, y + 6, b[0] + (show ? ': ' + val + (b[2] ? ' ' + b[2] : '') : ''), { size: 11.5, cls: show ? '' : 'hv-sb' })}<rect x="170" y="${y - 4}" width="120" height="12" rx="6" class="hf-box hs-line"/><rect x="170" y="${y - 4}" width="${f(w)}" height="12" rx="6" class="hv-mv ${over ? 'hf-bad' : 'hf-ok'}"/><line x1="266" x2="266" y1="${y - 7}" y2="${y + 11}" class="hs-ink" stroke-width="1.5"/></g>`;
      });
      /* truck 1, top view */
      g += Txt(310, 40, t(['ТС 1 · 7,5 т · 2 зоны', 'Fahrzeug 1 · 7,5 t · 2 Zonen', 'Truck 1 · 7.5 t · 2 zones', '1-КҚ · 7,5 т · 2 аймақ']), { size: 12.5, cls: 'hv-st' })
        + `<rect x="318" y="50" width="40" height="10" rx="3" class="hf-ink"/><rect x="318" y="220" width="40" height="10" rx="3" class="hf-ink"/><rect x="750" y="50" width="70" height="10" rx="3" class="hf-ink"/><rect x="750" y="220" width="70" height="10" rx="3" class="hf-ink"/>`
        + `<rect x="304" y="78" width="70" height="124" rx="12" class="hf-box hs-ink"/>${Txt(339, 140, t(['кабина', 'Kabine', 'cab', 'кабина']), { anchor: 'middle', mid: true, size: 11, cls: 'hv-sb' })}`
        + `<rect x="380" y="65" width="480" height="150" rx="4" class="hf-bg hs-ink" stroke-width="2"/>`
        + `<rect x="381" y="66" width="159" height="148" class="hv-zone c hv-fd" opacity="${s >= 1 ? 1 : 0}"/><rect x="541" y="66" width="318" height="148" class="hv-zone a hv-fd" opacity="${s >= 1 ? 1 : 0}"/>`
        + `<line x1="540" x2="540" y1="60" y2="220" class="hs-acc hv-fd" stroke-width="3" stroke-dasharray="6 4" opacity="${s >= 1 ? 1 : 0.25}"/>`
        + (s >= 1 ? Txt(460, 58, '2–8 °C', { anchor: 'middle', size: 11.5, cls: 'hv-st' }) + Txt(700, 58, '15–25 °C', { anchor: 'middle', size: 11.5, cls: 'hv-st' }) : '')
        + Txt(866, 140, t(['дверь', 'Tür', 'door', 'есік']), { size: 11, cls: 'hv-sb', attrs: ' transform="rotate(90 866 140)"' });
      LT1.forEach((oi, p) => {
        const vis = s >= 2 || (s === 1 && oi === 0); if (!vis) return;
        const col = Math.floor(p / 2), row = p % 2, x = 380 + col * 80 + 6, y = 65 + row * 75 + 6;
        g += `<g class="hv-pal ${LO[oi].z}" data-place="${p}"><rect x="${x}" y="${y}" width="68" height="63" rx="5"/>${s >= 4 ? Txt(x + 34, y + 27, String(p + 1), { anchor: 'middle', mid: true, size: 18, cls: 'hv-st' }) + Txt(x + 34, y + 48, t(LO[oi].c), { anchor: 'middle', mid: true, size: 9.5, cls: 'hv-sb' }) : Txt(x + 34, y + 32, LO[oi].id.slice(4), { anchor: 'middle', mid: true, size: 12, cls: 'hv-st' })}</g>`;
      });
      /* the 3 pallets that do not fit: outside the door (step 3), then on truck 2 */
      if (s === 2) for (let k = 0; k < 3; k++) g += `<g class="hv-pal x"><rect x="888" y="${62 + k * 52}" width="60" height="44" rx="5"/>${Txt(918, 84 + k * 52, '2043', { anchor: 'middle', mid: true, size: 11, cls: 'hv-st' })}</g>`;
      if (s === 2) g += Tag(918, 236, '+3 ' + t(['пал.', 'Pal.', 'pal.', 'пал.']), 'bad');
      if (s >= 3) {
        g += Txt(600, 262, t(['ТС 2 · 3,5 т', 'Fahrzeug 2 · 3,5 t', 'Truck 2 · 3.5 t', '2-КҚ · 3,5 т']), { size: 12, cls: 'hv-st' })
          + `<rect x="600" y="282" width="40" height="64" rx="9" class="hf-box hs-ink"/><rect x="646" y="272" width="220" height="84" rx="4" class="hf-bg hs-ink" stroke-width="2"/><rect x="647" y="273" width="218" height="82" class="hv-zone a"/>`;
        for (let k = 0; k < 3; k++) g += `<g class="hv-pal a" data-place2="${k}"><rect x="${652 + k * 72}" y="282" width="64" height="64" rx="5"/>${Txt(684 + k * 72, 314, s >= 4 ? String(k + 1) : '2043', { anchor: 'middle', mid: true, size: s >= 4 ? 16 : 12, cls: 'hv-st' })}</g>`;
        if (s === 3) g += Arrow({ d: 'M918,226 C918,262 900,300 870,312', on: true }) + Tag(430, 262, t(['разбито на 2 машины', 'auf 2 Fahrzeuge aufgeteilt', 'split over 2 trucks', '2 көлікке бөлінді']), 'warn');
      }
      if (s === 4) g += Arrow({ x1: 872, y1: 236, x2: 960, y2: 236, on: true }) + Tag(430, 262, t(['выгрузка: Костанай первым', 'Entladen: Kostanai zuerst', 'unloading: Kostanay first', 'түсіру: алдымен Қостанай']), 'accent');
      if (s === 5) g += `<rect x="296" y="236" width="572" height="8" rx="3" class="hf-acc"/>` + Tag(400, 268, '⚖ ' + fmtKg(6520) + ' ' + t(KGL) + ' ✓', 'ok') + Tag(520, 268, 'SSCC 12 / 12 ✓', 'ok');
      return g;
    },
  });

  /* (5) customer booking and routing via hubs (0.3.10 booking.tsx) */
  const BS = [
    { at: [90, 110], cap: ['Клиент вводит место погрузки и доставки: город и улицу (проверка по справочнику улиц), паллеты, вес (кг), температуру, дату.', 'Der Kunde gibt Abhol- und Lieferort ein: Stadt und Straße (Prüfung gegen das Straßenverzeichnis), Paletten, Gewicht (kg), Temperatur, Datum.', 'The customer enters pick-up and destination: city and street (checked against the street directory), pallets, weight (kg), temperature, date.', 'Клиент тиеу және жеткізу орнын енгізеді: қала мен көше (көшелер анықтамалығы бойынша тексеріледі), паллеттер, салмақ (кг), температура, күн.'] },
    { at: [300, 110], cap: ['Сбор: машина хаба забирает груз у клиента и везёт на ближайший хаб (Астана или Алматы).', 'Abholung: ein Hub-Fahrzeug holt die Ware beim Kunden ab und bringt sie zum nächsten Hub (Astana oder Almaty).', 'Collection: a hub vehicle picks the goods up at the customer and brings them to the nearest hub (Astana or Almaty).', 'Жинау: хаб көлігі жүкті клиенттен алып, ең жақын хабқа (Астана немесе Алматы) жеткізеді.'] },
    { at: [520, 110], cap: ['Есть прямая линия хаба до города назначения → регулярное отправление по расписанию, слоты и цена сразу.', 'Gibt es eine direkte Linie des Hubs zur Zielstadt → reguläre Abfahrt nach Fahrplan, Termine und Preis sofort.', 'A direct line from the hub to the destination city → regular departure on schedule, slots and price at once.', 'Хабтан баратын қалаға тікелей желі бар → кесте бойынша тұрақты жөнелту, слоттар мен баға бірден.'] },
    { at: [520, 300], cap: ['Нет прямой линии → маршрут через второй хаб (перевалка): система никогда не отказывает, а показывает +1–2 рабочих дня и сбор за обработку.', 'Keine direkte Linie → Route über den zweiten Hub (Umschlag): das System lehnt nie ab, sondern zeigt +1–2 Werktage und eine Umschlaggebühr.', 'No direct line → route through the second hub (transshipment): the system never refuses, it shows +1–2 business days and a handling fee.', 'Тікелей желі жоқ → екінші хаб арқылы маршрут (қайта тиеу): жүйе ешқашан бас тартпайды, +1–2 жұмыс күні мен өңдеу алымын көрсетеді.'] },
    { at: [890, 110], cap: ['Доставка до улицы получателя. Срок считается в рабочих днях РК: праздник на пути добавляет день; клиент видит дату и этапы в отслеживании.', 'Zustellung bis zur Straße des Empfängers. Die Laufzeit zählt in kasachischen Werktagen: ein Feiertag unterwegs fügt einen Tag hinzu; der Kunde sieht Datum und Etappen im Tracking.', 'Delivery to the consignee\'s street. Lead time counts in Kazakh business days: a holiday on the way adds a day; the customer sees the date and legs in tracking.', 'Алушының көшесіне дейін жеткізу. Мерзім ҚР жұмыс күндерімен есептеледі: жолдағы мереке бір күн қосады; клиент бақылауда күн мен кезеңдерді көреді.'] },
  ];
  HELP.fig('booking', {
    title: ['Бронирование клиента и маршрут через хабы', 'Kundenbuchung und Route über Hubs', 'Customer booking and routing via hubs', 'Клиентті брондау және хабтар арқылы маршрут'],
    steps: BS.map(x => x.cap), view: '0 0 1000 380', ms: 2800,
    draw(s) {
      const via = s === 3, p = BS[s].at;
      return Box({ x: 20, y: 70, w: 150, h: 80, label: t(['Место погрузки', 'Abholort', 'Pick-up', 'Тиеу орны']), sub: t(['город + улица', 'Stadt + Straße', 'city + street', 'қала + көше']), on: s === 0 })
        + Box({ x: 230, y: 70, w: 150, h: 80, label: t(['Хаб A', 'Hub A', 'Hub A', 'А хабы']), sub: t(['сбор · склад', 'Abholung · Lager', 'collection · warehouse', 'жинау · қойма']), tone: 'accent', on: s === 1 })
        + Box({ x: 440, y: 70, w: 170, h: 80, label: t(['Линия', 'Linie', 'Line', 'Желі']), sub: t(['расписание · слоты', 'Fahrplan · Termine', 'schedule · slots', 'кесте · слоттар']), on: s === 2 })
        + Box({ x: 820, y: 70, w: 150, h: 80, label: t(['Место доставки', 'Lieferort', 'Destination', 'Жеткізу орны']), sub: t(['город + улица', 'Stadt + Straße', 'city + street', 'қала + көше']), tone: 'ok', on: s === 4 })
        + Box({ x: 430, y: 260, w: 190, h: 80, label: t(['Хаб B · перевалка', 'Hub B · Umschlag', 'Hub B · transshipment', 'B хабы · қайта тиеу']), sub: t(['+1–2 рабочих дня', '+1–2 Werktage', '+1–2 business days', '+1–2 жұмыс күні']), tone: via ? 'warn' : 'base', on: via })
        + Arrow({ x1: 170, y1: 110, x2: 228, y2: 110, on: s === 1 }) + Arrow({ x1: 380, y1: 110, x2: 438, y2: 110, on: s === 2, label: t(['прямая линия', 'direkte Linie', 'direct line', 'тікелей желі']) })
        + Arrow({ x1: 610, y1: 110, x2: 818, y2: 110, on: s === 2 || s === 4 })
        + Arrow({ d: 'M305,150 C305,300 360,300 428,300', on: via, dashed: !via, label: t(['нет линии', 'keine Linie', 'no line', 'желі жоқ']), lx: 330, ly: 250 })
        + Arrow({ d: 'M620,300 C760,300 850,260 890,152', on: via, dashed: !via, label: t(['линия хаба B', 'Linie von Hub B', 'line of hub B', 'B хабының желісі']), lx: 790, ly: 250 })
        + (via ? Tag(525, 238, t(['никогда «нет связи»', 'nie „keine Verbindung“', 'never "no connection"', 'ешқашан «байланыс жоқ» емес']), 'warn') : '')
        + Lines(500, 30, t(['срок = отправление + транзит (+ перевалка) в рабочих днях РК', 'Laufzeit = Abfahrt + Transit (+ Umschlag) in kasachischen Werktagen', 'lead time = departure + transit (+ transshipment) in Kazakh business days', 'мерзім = жөнелту + транзит (+ қайта тиеу) ҚР жұмыс күндерімен']), { max: 100, size: 12, cls: 'hv-sb' })
        + Token(p[0], p[1] - 48);
    },
  });

  /* (6) express: 3 signatures and the cut-off (0.3.10 express.tsx) */
  const XR = [['Генеральный директор', 'Generaldirektor', 'CEO', 'Бас директор'], ['Рук. аналитики и закупок', 'Leitung Analytik & Beschaffung', 'Head of analytics & procurement', 'Талдау және сатып алу басшысы'], ['Рук. закупок и логистики', 'Leitung Einkauf & Logistik', 'Head of purchasing & logistics', 'Сатып алу және логистика басшысы']];
  const XS = [
    ['Заявка на экспресс: из портала клиента или от диспетчера (Диспетчерская доска → «Экспресс»). Срок — отсечка экспресс-слота (16:00 КЗ, плановое значение).', 'Express-Anfrage: aus dem Kundenportal oder von der Disposition (Dispositionstafel → „Express“). Frist = Annahmeschluss des Express-Slots (16:00 KZ, Planwert).', 'Express request: from the customer portal or from dispatch (Dispatch Board → "Express"). Deadline = cut-off of the express slot (16:00 KZ, planning value).', 'Экспресс өтінім: клиент порталынан немесе диспетчерден (Диспетчерлік тақта → «Экспресс»). Мерзім — экспресс-слоттың кесу уақыты (16:00 ҚЗ, жоспарлы мән).'],
    ['Подпись 1 — генеральный директор. Каждый слот требует своей бизнес-функции; уведомления получают все три согласующих.', 'Unterschrift 1 — Generaldirektor. Jeder Slot braucht seine Geschäftsfunktion; alle drei Freigebenden werden benachrichtigt.', 'Signature 1 — CEO. Each slot needs its business function; all three approvers are notified.', 'Қолтаңба 1 — бас директор. Әр слот өз бизнес-функциясын талап етеді; үш келісушінің бәріне хабарлама барады.'],
    ['Подпись 2 — руководитель аналитики и закупок. Принцип четырёх глаз: один пользователь подписывает только один слот.', 'Unterschrift 2 — Leitung Analytik & Beschaffung. Vier-Augen-Prinzip: ein Benutzer unterschreibt nur einen Slot.', 'Signature 2 — head of analytics & procurement. Four-eyes principle: one user signs only one slot.', 'Қолтаңба 2 — талдау және сатып алу басшысы. Төрт көз қағидаты: бір пайдаланушы тек бір слотқа қол қояды.'],
    ['Подпись 3 — руководитель закупок и логистики. 3/3 до отсечки → создаётся ровно один экспресс-заказ, клиент видит надбавку и срок.', 'Unterschrift 3 — Leitung Einkauf & Logistik. 3/3 vor dem Annahmeschluss → genau ein Express-Auftrag entsteht, der Kunde sieht Zuschlag und Termin.', 'Signature 3 — head of purchasing & logistics. 3/3 before the cut-off → exactly one express order is created; the customer sees surcharge and deadline.', 'Қолтаңба 3 — сатып алу және логистика басшысы. Кесу уақытына дейін 3/3 → дәл бір экспресс-тапсырыс жасалады, клиент үстемеақы мен мерзімді көреді.'],
    ['Не успели к отсечке или кто-то отклонил → система закрывает заявку («система: истёк срок»), груз едет регулярным рейсом, клиент получает уведомление.', 'Frist verpasst oder abgelehnt → das System schließt die Anfrage („System: Frist abgelaufen“), die Ware fährt mit der Regeltour, der Kunde wird benachrichtigt.', 'Missed the cut-off or someone rejected → the system closes the request ("system: timeout"), the goods go on the regular trip, the customer is notified.', 'Кесу уақытына үлгермеді немесе біреу бас тартты → жүйе өтінімді жабады («жүйе: мерзімі өтті»), жүк тұрақты рейспен кетеді, клиентке хабарлама барады.'],
  ];
  HELP.fig('express', {
    title: ['Экспресс: 3 подписи и срок', 'Express: 3 Unterschriften und Frist', 'Express: 3 signatures and deadline', 'Экспресс: 3 қолтаңба және мерзім'],
    steps: XS, view: '0 0 1000 360', ms: 2600,
    draw(s) {
      const signed = i => s >= i + 1 && s <= 3, left = s === 0 ? 1 : s === 4 ? 0 : 1 - s * 0.25;
      let g = Box({ x: 20, y: 120, w: 170, h: 90, label: t(['Заявка EX-…', 'Anfrage EX-…', 'Request EX-…', 'Өтінім EX-…']), sub: t(['портал / доска', 'Portal / Tafel', 'portal / board', 'портал / тақта']), on: s === 0, tone: 'accent' });
      XR.forEach((r, i) => {
        g += `<g data-ex-slot="${i}">` + Box({ x: 300, y: 30 + i * 105, w: 300, h: 80, label: t(r), sub: signed(i) ? '✓ ' + t(['подписано · другой пользователь', 'unterschrieben · anderer Benutzer', 'signed · different user', 'қол қойылды · басқа пайдаланушы']) : s === 4 ? '—' : t(['ожидает подписи', 'wartet auf Unterschrift', 'awaiting signature', 'қолтаңба күтілуде']), tone: signed(i) ? 'ok' : s === 4 ? 'muted' : 'base', on: s === i + 1 })
          + Arrow({ x1: 190, y1: 165, x2: 298, y2: 70 + i * 105, on: s === i + 1 }) + Arrow({ x1: 600, y1: 70 + i * 105, x2: 698, y2: s === 4 ? 290 : 120, on: s === 3 && i === 2, tone: s === 4 ? 'bad' : undefined, dashed: s !== 3 }) + '</g>';
      });
      return g + Box({ x: 700, y: 80, w: 270, h: 80, label: t(['3/3 → экспресс-заказ', '3/3 → Express-Auftrag', '3/3 → express order', '3/3 → экспресс-тапсырыс']), sub: t(['надбавка · срок · клиенту', 'Zuschlag · Termin · an Kunden', 'surcharge · deadline · to customer', 'үстемеақы · мерзім · клиентке']), tone: 'ok', on: s === 3 })
        + Box({ x: 700, y: 250, w: 270, h: 80, label: t(['Истёк срок / отказ', 'Frist abgelaufen / Ablehnung', 'Timeout / rejection', 'Мерзімі өтті / бас тарту']), sub: t(['→ регулярный рейс', '→ Regeltour', '→ regular trip', '→ тұрақты рейс']), tone: s === 4 ? 'bad' : 'base', on: s === 4 })
        + `<g data-ex-deadline>${Lines(105, 262, t(['до отсечки', 'bis Annahmeschluss', 'until cut-off', 'кесу уақытына дейін']), { max: 20, size: 11, cls: 'hv-sb' })}<rect x="30" y="276" width="150" height="12" rx="6" class="hf-box hs-line"/><rect x="30" y="276" width="${f(Math.max(0, 150 * left))}" height="12" rx="6" class="hv-mv ${left < 0.3 ? 'hf-bad' : left < 0.6 ? 'hf-warn' : 'hf-ok'}"/>${Tag(105, 316, '⏱ ' + (s === 4 ? '0:00' : ['6:00', '4:30', '3:00', '1:30'][s]), s === 4 ? 'bad' : 'muted')}</g>`;
    },
  });

  /* (7) cold chain: excursion → alarm → escalation → hold → QA decision (0.3.10 coldchain.tsx) */
  const CC = [[0, 5], [30, 5.4], [60, 6.2], [90, 7.6], [110, 8.9], [130, 10.6], [150, 10.2], [170, 8.6], [190, 7.1], [220, 5.8], [260, 5.2]];
  const CX0 = 50, CX1 = 470, CY0 = 320, CY1 = 60, cpx = m => CX0 + (m / 260) * (CX1 - CX0), cpy = c => CY0 - (c / 14) * (CY0 - CY1), CAT = [30, 110, 130, 150, 190, 260];
  const cint = m => { for (let i = 1; i < CC.length; i++) { const a = CC[i - 1], b = CC[i]; if (m <= b[0]) return a[1] + ((m - a[0]) / (b[0] - a[0])) * (b[1] - a[1]); } return CC[CC.length - 1][1]; };
  const CS = [
    ['Камера 2–8 °C в норме: показания логгера/датчика приходят каждые несколько минут и оцениваются сервером.', 'Kammer 2–8 °C im Bereich: Werte von Logger/Sensor kommen alle paar Minuten und werden vom Server bewertet.', 'Chamber 2–8 °C in range: logger / sensor readings arrive every few minutes and are evaluated by the server.', 'Камера 2–8 °C қалыпты: логгер/датчик көрсеткіштері бірнеше минут сайын келеді және серверде бағаланады.'],
    ['Выход за 8 °C → тревога уровня 2 по машине и камере; открывается отклонение DEV, заказы этой камеры получают «карантин качества».', 'Über 8 °C → Alarm Stufe 2 für Fahrzeug und Kammer; eine Abweichung DEV wird eröffnet, die Aufträge dieser Kammer bekommen eine Qualitätssperre.', 'Above 8 °C → level-2 alarm for vehicle and chamber; a deviation DEV opens and the orders of this chamber are put on quality hold.', '8 °C-тан асу → көлік пен камера бойынша 2-деңгейлі дабыл; DEV ауытқуы ашылады, осы камераның тапсырыстары «сапа карантинін» алады.'],
    ['≥ 2 K вне диапазона → уровень 3: эскалация 1 — дежурный диспетчер (SMS + e-mail) и охранный партнёр.', '≥ 2 K außerhalb → Stufe 3: Eskalation 1 — diensthabender Disponent (SMS + E-Mail) und Sicherheitspartner.', '≥ 2 K outside → level 3: escalation 1 — duty dispatcher (SMS + e-mail) and the security partner.', '≥ 2 K диапазоннан тыс → 3-деңгей: 1-эскалация — кезекші диспетчер (SMS + e-mail) және күзет серіктесі.'],
    ['Нет подтверждения 5 мин → эскалация 2 (руководитель безопасности), ещё 5 мин → 3 (генеральный директор). «Принять» останавливает таймер.', 'Keine Bestätigung in 5 min → Eskalation 2 (Leitung Sicherheit), weitere 5 min → 3 (Generaldirektor). „Annehmen“ stoppt den Timer.', 'No acknowledgement in 5 min → escalation 2 (head of security), another 5 min → 3 (CEO). "Acknowledge" stops the timer.', '5 мин ішінде растау жоқ → 2-эскалация (қауіпсіздік басшысы), тағы 5 мин → 3 (бас директор). «Қабылдау» таймерді тоқтатады.'],
    ['Температура вернулась: тревога закрывается сама после 3 показаний в диапазоне за ≥ 10 мин. Карантин остаётся: доставка только «в карантин».', 'Temperatur wieder im Bereich: der Alarm schließt sich nach 3 Werten im Bereich über ≥ 10 min. Die Sperre bleibt: Zustellung nur „in Quarantäne“.', 'Temperature back in range: the alarm closes itself after 3 in-range readings over ≥ 10 min. The hold stays: delivery only "in quarantine".', 'Температура қалпына келді: дабыл ≥ 10 мин ішінде 3 қалыпты көрсеткіштен кейін өзі жабылады. Карантин қалады: жеткізу тек «карантинге».'],
    ['Решение ответственного за качество (шаг 4 из 7): выпустить (карантин снят) или заблокировать (возврат) → CAPA и закрытие отклонения.', 'Entscheidung der Qualitätsverantwortlichen (Schritt 4 von 7): freigeben (Sperre aufgehoben) oder sperren (Rücksendung) → CAPA und Abschluss der Abweichung.', 'Decision of the quality manager (step 4 of 7): release (hold cleared) or block (return) → CAPA and closing the deviation.', 'Сапаға жауаптының шешімі (7-ден 4-қадам): шығару (карантин алынды) немесе бұғаттау (қайтару) → CAPA және ауытқуды жабу.'],
  ];
  HELP.fig('coldchain', {
    title: ['Холодовая цепь: отклонение → тревога → эскалация → карантин → решение QA', 'Kühlkette: Abweichung → Alarm → Eskalation → Sperre → QA-Entscheidung', 'Cold chain: excursion → alarm → escalation → hold → QA decision', 'Суық тізбек: ауытқу → дабыл → эскалация → карантин → QA шешімі'],
    steps: CS, view: '0 0 1000 380', ms: 2800,
    draw(s) {
      const m = CAT[s], c = cint(m), lvl = s === 0 ? 0 : s === 1 ? 2 : s <= 3 ? 3 : 0, dec = n => LI === 2 ? n.toFixed(1) : n.toFixed(1).replace('.', ',');
      const path = CC.map((p, i) => (i ? 'L' : 'M') + cpx(p[0]).toFixed(1) + ',' + cpy(p[1]).toFixed(1)).join(' ');
      let g = `<rect x="${CX0}" y="${f(cpy(8))}" width="${CX1 - CX0}" height="${f(cpy(2) - cpy(8))}" class="hv-band"/><rect x="${CX0}" y="${CY1}" width="${CX1 - CX0}" height="${CY0 - CY1}" class="hs-line"/>`;
      [0, 2, 8, 10, 14].forEach(v => { g += `<line x1="${CX0 - 4}" x2="${CX1}" y1="${f(cpy(v))}" y2="${f(cpy(v))}" class="hs-line"${v === 2 || v === 8 ? '' : ' stroke-dasharray="2 4"'}/>` + Txt(CX0 - 8, cpy(v), v + ' °C', { anchor: 'end', mid: true, size: 11, cls: 'hv-sb' }); });
      g += `<line x1="${CX0}" x2="${CX1}" y1="${f(cpy(10))}" y2="${f(cpy(10))}" class="hs-acc" stroke-dasharray="6 4"/>` + Txt(CX1 - 4, cpy(10) - 8, '+2 K → ' + t(['уровень 3', 'Stufe 3', 'level 3', '3-деңгей']), { anchor: 'end', size: 11, cls: 'hv-sb' })
        + `<path d="${path}" class="hs-ink" stroke-width="2.4"/>` + Token(cpx(m), cpy(c), 8, c > 8 ? 'bad' : 'ok')
        + Lines((CX0 + CX1) / 2, CY0 + 26, t(['время рейса, мин · зелёная полоса = 2–8 °C', 'Fahrzeit, min · grünes Band = 2–8 °C', 'trip time, min · green band = 2–8 °C', 'рейс уақыты, мин · жасыл жолақ = 2–8 °C']), { max: 80, size: 11, cls: 'hv-sb' })
        + Tag(CX0 + 60, 40, (c > 8 ? '▲ ' : '✓ ') + dec(c) + ' °C', c > 10 ? 'bad' : c > 8 ? 'warn' : 'ok')
        + Box({ x: 540, y: 30, w: 200, h: 64, label: t(['Тревога', 'Alarm', 'Alarm', 'Дабыл']), sub: lvl ? t(['уровень ', 'Stufe ', 'level ', 'деңгей ']) + lvl : '—', tone: lvl >= 3 ? 'bad' : lvl ? 'warn' : 'base', on: s === 1 || s === 2 });
      [['1', ['Дежурный · SMS + e-mail', 'Dienst · SMS + E-Mail', 'Duty · SMS + e-mail', 'Кезекші · SMS + e-mail']], ['2', ['Рук. безопасности · +5 мин', 'Leitung Sicherheit · +5 min', 'Head of security · +5 min', 'Қауіпсіздік басшысы · +5 мин']], ['3', ['Генеральный директор · +5 мин', 'Generaldirektor · +5 min', 'CEO · +5 min', 'Бас директор · +5 мин']]].forEach((e, i) => {
        const hot = (s === 2 && i === 0) || (s === 3 && i > 0); g += Box({ x: 780, y: 20 + i * 62, w: 200, h: 52, label: 'E' + e[0] + ' · ' + t(e[1]), size: 11.5, tone: hot ? 'bad' : 'base', on: hot });
      });
      return g + Arrow({ x1: 740, y1: 62, x2: 778, y2: 46, on: s === 2 }) + Arrow({ d: 'M880,72 L880,80', on: s === 3 }) + Arrow({ d: 'M880,134 L880,142', on: s === 3 })
        + Box({ x: 540, y: 210, w: 200, h: 70, label: t(['Карантин качества', 'Qualitätssperre', 'Quality hold', 'Сапа карантині']), sub: t(['DEV · заказы камеры', 'DEV · Aufträge der Kammer', 'DEV · orders of the chamber', 'DEV · камера тапсырыстары']), tone: s >= 1 ? 'warn' : 'base', on: s === 1 || s === 4 })
        + Arrow({ x1: 640, y1: 94, x2: 640, y2: 208, on: s === 1 })
        + Box({ x: 780, y: 210, w: 200, h: 70, label: t(['Решение QA', 'QA-Entscheidung', 'QA decision', 'QA шешімі']), sub: t(['шаг 4 из 7', 'Schritt 4 von 7', 'step 4 of 7', '7-ден 4-қадам']), tone: 'accent', on: s === 5 })
        + Arrow({ x1: 740, y1: 245, x2: 778, y2: 245, on: s === 5 })
        + Box({ x: 700, y: 310, w: 130, h: 52, label: t(['Выпустить', 'Freigeben', 'Release', 'Шығару']), size: 12, tone: s === 5 ? 'ok' : 'base' })
        + Box({ x: 850, y: 310, w: 130, h: 52, label: t(['Блокировать', 'Sperren', 'Block', 'Бұғаттау']), size: 12, tone: s === 5 ? 'bad' : 'base' })
        + Arrow({ x1: 850, y1: 280, x2: 790, y2: 308, on: s === 5, tone: 'ok' }) + Arrow({ x1: 900, y1: 280, x2: 912, y2: 308, on: s === 5, tone: 'bad' });
    },
  });

  /* (8) truck finder: decision matrix (5 candidates × 8 checks) + animated axle-load seesaw (0.3.10 truck.tsx, same values) */
  const TC = [
    { h: ['Зоны', 'Zonen', 'Zones', 'Аймақтар'], cap: ['Температурные классы груза → нужен кузов с 1 или 2 зонами (перегородка). 3,5 т с одной зоной выпадает.', 'Temperaturklassen der Ware → Aufbau mit 1 oder 2 Zonen (Trennwand). 3,5 t mit einer Zone fällt heraus.', 'Temperature classes of the goods → a body with 1 or 2 zones (bulkhead). The single-zone 3.5 t drops out.', 'Жүктің температуралық кластары → 1 немесе 2 аймақты шанақ (қалқа) керек. Бір аймақты 3,5 т шығып қалады.'] },
    { h: ['кг', 'kg', 'kg', 'кг'], cap: ['Масса груза против грузоподъёмности (вес обязателен в брони). 6 т не поднимает 3,9 т.', 'Gewicht gegen Nutzlast (Gewicht ist Pflicht in der Buchung). 6 t trägt keine 3,9 t.', 'Weight against payload (weight is mandatory in the booking). The 6 t cannot carry 3.9 t.', 'Жүк салмағы мен жүк көтергіштік (брондауда салмақ міндетті). 6 т 3,9 т көтере алмайды.'] },
    { h: ['м³ · пал.', 'm³ · Pal.', 'm³ · pal.', 'м³ · пал.'], cap: ['Объём и паллетоместа по зонам (с учётом перегородки).', 'Volumen und Palettenplätze je Zone (mit Trennwand).', 'Volume and pallet places per zone (bulkhead included).', 'Аймақтар бойынша көлем мен паллет орындары (қалқаны ескере).'] },
    { h: ['Оси', 'Achsen', 'Axles', 'Осьтер'], cap: ['Нагрузка на оси: груз сзади перегружает заднюю ось (качели наклоняются) — такая схема не допускается, подбор переставляет места.', 'Achslast: Ladung hinten überlastet die Hinterachse (die Wippe kippt) — diese Beladung ist nicht zulässig, die Suche stellt die Packstücke um.', 'Axle loads: cargo at the rear overloads the rear axle (the seesaw tips) — this load plan is not allowed; the finder re-sequences the pallets.', 'Ось жүктемесі: артқы жүк артқы осьті асыра жүктейді (әткеншек ауады) — мұндай сызбаға жол берілмейді, таңдау орындарды ауыстырады.'] },
    { h: ['Высота', 'Höhe', 'Height', 'Биіктік'], cap: ['Места переставлены (порядок точек, LIFO) — обе оси в норме. Высота паллет против высоты кузова и штабелирования.', 'Packstücke umgestellt (Stoppreihenfolge, LIFO) — beide Achsen im Limit. Palettenhöhe gegen Laderaumhöhe und Stapelbarkeit.', 'Packages re-sequenced (stop order, LIFO) — both axles within limits. Pallet height against body height and stacking.', 'Орындар ауыстырылды (нүктелер реті, LIFO) — екі ось те қалыпты. Паллет биіктігі шанақ биіктігі мен қаттауға қарсы.'] },
    { h: ['ДОПОГ', 'ADR', 'ADR', 'ДОПОГ'], cap: ['Опасный груз (например сухой лёд UN 1845) → ТС с допуском ДОПОГ и обученный водитель.', 'Gefahrgut (z. B. Trockeneis UN 1845) → Fahrzeug mit ADR-Zulassung und geschulter Fahrer.', 'Dangerous goods (e.g. dry ice UN 1845) → vehicle with ADR approval and a trained driver.', 'Қауіпті жүк (мысалы, құрғақ мұз UN 1845) → ДОПОГ рұқсаты бар көлік және оқытылған жүргізуші.'] },
    { h: ['Маршрут', 'Route', 'Route', 'Маршрут'], cap: ['Ограничения маршрута на дату поездки: сезонные нагрузки на ось, мосты, окна въезда в город. 12,5 т выпадает.', 'Routenbeschränkungen am Reisetag: saisonale Achslasten, Brücken, Zufahrtsfenster der Stadt. 12,5 t fällt heraus.', 'Route restrictions on the travel date: seasonal axle limits, bridges, city access windows. The 12.5 t drops out.', 'Сапар күніндегі маршрут шектеулері: маусымдық ось жүктемесі, көпірлер, қалаға кіру терезелері. 12,5 т шығып қалады.'] },
    { h: ['₸', '₸', '₸', '₸'], cap: ['Остальные ранжируются по полной стоимости рейса (топливо, платные дороги, часы водителя, порожний пробег, ставка партнёра) — рекомендация: самый дешёвый подходящий.', 'Die übrigen werden nach den vollen Tourkosten gereiht (Kraftstoff, Maut, Fahrerstunden, Leerkilometer, Partnertarif) — Empfehlung: das günstigste passende.', 'The rest are ranked by full trip cost (fuel, tolls, driver hours, empty return, partner rate) — recommendation: the cheapest that fits.', 'Қалғандары рейстің толық құны бойынша реттеледі (жанармай, ақылы жолдар, жүргізуші сағаттары, бос жүріс, серіктес тарифі) — ұсыныс: сай келетін ең арзаны.'] },
  ];
  const TCD = [
    { n: ['3,5 т · 1 зона', '3,5 t · 1 Zone', '3.5 t · 1 zone', '3,5 т · 1 аймақ'], r: [0] }, { n: ['6 т · 2 зоны', '6 t · 2 Zonen', '6 t · 2 zones', '6 т · 2 аймақ'], r: [1, 0] },
    { n: ['7,5 т · 2 зоны', '7,5 t · 2 Zonen', '7.5 t · 2 zones', '7,5 т · 2 аймақ'], r: [1, 1, 1, 1, 1, 1, 1, 1] }, { n: ['12,5 т · 2 зоны', '12,5 t · 2 Zonen', '12.5 t · 2 zones', '12,5 т · 2 аймақ'], r: [1, 1, 1, 1, 1, 1, 0] },
    { n: ['Партнёр · 20 т', 'Partner · 20 t', 'Partner · 20 t', 'Серіктес · 20 т'], r: [1, 1, 1, 1, 1, 1, 1, 2] },
  ];
  const WB = 4.0, F0 = 2200, R0 = 1800, FMAX = 3600, RMAX = 5300, KG = 650;   // 7.5 t body: front axle at 0 m, rear axle at 4.0 m, empty axle masses + limits (example)
  const TLOAD = [[], [0.8, 1.6, 2.4], [0.8, 1.6, 2.4, 3.2, 4.0], [2.6, 3.4, 4.2, 5.0, 5.8, 5.8], [0.8, 1.6, 2.4, 3.2, 4.0, 4.8]];
  HELP.truckAxles = s => { const pos = TLOAD[Math.min(s, 4)], sum = pos.reduce((a, p) => a + p, 0); return { front: Math.round(F0 + KG * (pos.length - sum / WB)), rear: Math.round(R0 + KG * sum / WB), fmax: FMAX, rmax: RMAX, pos }; };
  HELP.fig('truck', {
    title: ['Подбор ТС: логика решения и качели нагрузки на оси', 'Fahrzeugsuche: Entscheidungslogik und Achslast-Wippe', 'Truck finder: decision logic and the axle-load seesaw', 'Көлік таңдау: шешім логикасы және ось жүктемесінің әткеншегі'],
    lead: ['Пример: 6 паллет, 3,9 т, 2–8 °C + 15–25 °C, сухой лёд (ДОПОГ).', 'Beispiel: 6 Paletten, 3,9 t, 2–8 °C + 15–25 °C, Trockeneis (ADR).', 'Example: 6 pallets, 3.9 t, 2–8 °C + 15–25 °C, dry ice (ADR).', 'Мысал: 6 паллет, 3,9 т, 2–8 °C + 15–25 °C, құрғақ мұз (ДОПОГ).'],
    steps: TC.map(c => c.cap), view: '0 0 1000 400', ms: 2600,
    draw(s) {
      const ax = HELP.truckAxles(s), pos = ax.pos, sum = pos.reduce((a, p) => a + p, 0), xg = pos.length ? sum / pos.length : 3.1, tilt = Math.max(-12, Math.min(12, (xg - 3.1) * 7));
      const PX = 58, CX = 790, CY = 175, bx = m => CX + (m - 3.1) * PX, bar = (v, max) => Math.min(1.25, v / max);
      let g = '';
      TC.forEach((c, j) => { g += `<rect x="${150 + j * 46}" y="22" width="44" height="30" rx="4" class="${j === s ? 'hf-soft' : 'hf-box'}"/>` + Txt(172 + j * 46, 37, t(c.h), { anchor: 'middle', mid: true, size: 10.5, cls: 'hv-st' }); });
      TCD.forEach((c, i) => {
        const out = c.r.findIndex(v => v === 0), gone = out >= 0 && out < s;
        g += `<g class="hv-fd" opacity="${gone ? 0.45 : 1}" data-cand-row="${i}">` + Txt(140, 78 + i * 44, t(c.n), { anchor: 'end', mid: true, size: 12 });
        TC.forEach((_, j) => {
          const v = j <= s ? c.r[j] : undefined, tt = v === undefined ? '' : v === 0 ? '✗' : j === 7 ? (v === 1 ? '1' : '2') : '✓';
          g += `<rect x="${150 + j * 46}" y="${62 + i * 44}" width="44" height="32" rx="4" class="${v === 0 ? 'hf-box hs-line' : 'hf-bg hs-line'}"/>` + (tt ? Txt(172 + j * 46, 79 + i * 44, tt, { anchor: 'middle', mid: true, size: 14, cls: v === 0 ? 'hf-bad' : 'hf-ok' }) : '');
        });
        g += '</g>';
      });
      if (s === 7) g += `<g data-truck-reco>${Tag(330, 300, t(['рекомендация: 7,5 т · 2 зоны', 'Empfehlung: 7,5 t · 2 Zonen', 'recommendation: 7.5 t · 2 zones', 'ұсыныс: 7,5 т · 2 аймақ']), 'ok')}</g>`;
      /* seesaw */
      g += Lines(CX, 30, t(['Нагрузка на оси (7,5 т, пример)', 'Achslast (7,5 t, Beispiel)', 'Axle loads (7.5 t, example)', 'Ось жүктемесі (7,5 т, мысал)']), { max: 50, size: 12.5, cls: 'hv-st' })
        + `<polygon points="${CX},${CY + 8} ${CX - 22},${CY + 46} ${CX + 22},${CY + 46}" class="hf-box hs-ink"/>`
        + `<g class="hv-mv" style="transform:rotate(${tilt.toFixed(1)}deg);transform-origin:${CX}px ${CY}px" data-seesaw-tilt="${tilt.toFixed(1)}"><rect x="${f(bx(-0.6))}" y="${CY - 4}" width="${f(7.4 * PX)}" height="10" rx="3" class="hf-acc"/><circle cx="${f(bx(0))}" cy="${CY + 16}" r="11" class="hf-bg hs-ink" stroke-width="3"/><circle cx="${f(bx(WB))}" cy="${CY + 16}" r="11" class="hf-bg hs-ink" stroke-width="3"/>`
        + pos.map((p, i) => { const stack = pos.slice(0, i).filter(q => q === p).length; return `<rect x="${f(bx(p) - 22)}" y="${CY - 4 - 34 * (stack + 1)}" width="44" height="32" rx="3" class="hf-soft hs-acc" stroke-width="1.5"/>`; }).join('')
        + Txt(bx(-0.3), CY + 40, t(['перед', 'vorn', 'front', 'алды']), { anchor: 'middle', size: 11, cls: 'hv-sb' }) + Txt(bx(6.6), CY + 40, t(['зад', 'hinten', 'rear', 'арты']), { anchor: 'middle', size: 11, cls: 'hv-sb' }) + '</g>';
      [[t(['Передняя ось', 'Vorderachse', 'Front axle', 'Алдыңғы ось']), ax.front, FMAX], [t(['Задняя ось', 'Hinterachse', 'Rear axle', 'Артқы ось']), ax.rear, RMAX]].forEach((a, i) => {
        const over = a[1] > a[2];
        g += `<g data-axle="${i ? 'rear' : 'front'}" data-over="${over ? 1 : 0}">` + Txt(600, 268 + i * 52, a[0] + ': ' + fmtKg(a[1]) + ' / ' + fmtKg(a[2]) + ' ' + t(KGL), { size: 12 })
          + `<rect x="600" y="${276 + i * 52}" width="300" height="14" rx="7" class="hf-box hs-line"/><rect x="600" y="${276 + i * 52}" width="${f(300 * bar(a[1], a[2]) / 1.25)}" height="14" rx="7" class="hv-mv ${over ? 'hf-bad' : 'hf-ok'}"/><line x1="840" x2="840" y1="${272 + i * 52}" y2="${294 + i * 52}" class="hs-ink" stroke-width="2"/>`
          + (over ? Tag(950, 283 + i * 52, '+' + (a[1] - a[2]), 'bad') : '') + '</g>';
      });
      return g;
    },
  });

  /* (9) coverage and SMS fallback OL1 (0.3.10 coverage.tsx) */
  const VX0 = 60, VX1 = 940, vx = m => VX0 + (m / 90) * (VX1 - VX0), VAT = [4, 14, 32, 45, 64, 86], MIN = ['мин', 'min', 'min', 'мин'];
  const VS = [
    ['Связь есть: приложение водителя и телематика (Wialon) передают данные каждые несколько минут — это «последний контакт».', 'Netz vorhanden: Fahrer-App und Telematik (Wialon) senden alle paar Minuten Daten — das ist der „letzte Kontakt“.', 'Coverage: the driver app and telematics (Wialon) send data every few minutes — this is the "last contact".', 'Байланыс бар: жүргізуші қосымшасы мен телематика (Wialon) бірнеше минут сайын деректер жібереді — бұл «соңғы байланыс».'],
    ['Мёртвая зона: разрыв > 10 мин сохраняется с участком дороги — система учится, где связи нет.', 'Funkloch: eine Lücke > 10 min wird mit dem Straßenabschnitt gespeichert — das System lernt, wo kein Netz ist.', 'Dead zone: a gap > 10 min is stored with its road stretch — the system learns where there is no coverage.', 'Өлі аймақ: > 10 мин үзіліс жол учаскесімен сақталады — жүйе байланыс жоқ жерді үйренеді.'],
    ['> 30 мин без данных → приложение шлёт важные события SMS-протоколом OL1 (SOS, температура, статус точки, heartbeat). Монитор: уровень 1 в ожидаемой зоне, иначе 2.', '> 30 min ohne Daten → die App sendet wichtige Ereignisse per SMS-Protokoll OL1 (SOS, Temperatur, Stoppstatus, Heartbeat). Monitor: Stufe 1 in erwarteter Zone, sonst 2.', '> 30 min without data → the app sends important events by the OL1 SMS protocol (SOS, temperature, stop status, heartbeat). Monitor: level 1 in an expected zone, otherwise 2.', '> 30 мин деректерсіз → қосымша маңызды оқиғаларды OL1 SMS хаттамасымен жібереді (SOS, температура, нүкте мәртебесі, heartbeat). Монитор: күтілген аймақта 1-деңгей, әйтпесе 2.'],
    ['Диспетчер отправляет SMS-инструкцию: STOP (подтвердить за 10 мин), CHKT (15), WAIT / CALL / PARK (30). Отчёт SMSC: доставлено / недоставляемо.', 'Die Disposition sendet eine SMS-Anweisung: STOP (Bestätigung in 10 min), CHKT (15), WAIT / CALL / PARK (30). SMSC-Bericht: zugestellt / unzustellbar.', 'Dispatch sends an SMS instruction: STOP (acknowledge within 10 min), CHKT (15), WAIT / CALL / PARK (30). SMSC report: delivered / undeliverable.', 'Диспетчер SMS нұсқау жібереді: STOP (10 мин ішінде растау), CHKT (15), WAIT / CALL / PARK (30). SMSC есебі: жеткізілді / жеткізілмейді.'],
    ['Нет подтверждения AK вовремя → событие во «Входящих» (уровень 2) и задача CRM «позвонить водителю». Холодовой груз, > 60 мин и нет heartbeat 35 мин → уровень 3.', 'Keine AK-Bestätigung rechtzeitig → Ereignis im „Eingang“ (Stufe 2) und CRM-Aufgabe „Fahrer anrufen“. Kühlware, > 60 min und kein Heartbeat seit 35 min → Stufe 3.', 'No AK acknowledgement in time → event in the "Inbox" (level 2) and a CRM task "call the driver". Cold cargo, > 60 min and no heartbeat for 35 min → level 3.', 'AK растауы уақытында жоқ → «Кіріс хабарлар» ішінде оқиға (2-деңгей) және CRM тапсырмасы «жүргізушіге қоңырау шалу». Суық жүк, > 60 мин және 35 мин heartbeat жоқ → 3-деңгей.'],
    ['Связь вернулась: приложение синхронизирует всё; предварительный ePOD из SMS становится окончательным.', 'Netz wieder da: die App synchronisiert alles; der vorläufige ePOD aus der SMS wird endgültig.', 'Coverage is back: the app syncs everything; the preliminary ePOD from the SMS becomes final.', 'Байланыс қалпына келді: қосымша бәрін синхрондайды; SMS-тен алынған алдын ала ePOD түпкілікті болады.'],
  ];
  HELP.fig('coverage', {
    title: ['Покрытие связи и резерв по SMS (OL1)', 'Netzabdeckung und SMS-Rückfallebene (OL1)', 'Coverage and SMS fallback (OL1)', 'Байланыс аумағы және SMS резерві (OL1)'],
    steps: VS, view: '0 0 1000 340', ms: 2800,
    draw(s) {
      const mn = t(MIN), sms = s >= 2 && s <= 4;
      let g = `<rect x="${vx(0)}" y="60" width="${f(vx(9) - vx(0))}" height="26" class="hv-band"/><rect x="${f(vx(9))}" y="60" width="${f(vx(78) - vx(9))}" height="26" class="hf-box hs-line"/><rect x="${f(vx(78))}" y="60" width="${f(vx(90) - vx(78))}" height="26" class="hv-band"/>`
        + Txt(vx(4.5), 73, t(['связь', 'Netz', 'coverage', 'байланыс']), { anchor: 'middle', mid: true, size: 11 }) + Txt(vx(43), 73, t(['нет данных (мёртвая зона)', 'keine Daten (Funkloch)', 'no data (dead zone)', 'деректер жоқ (өлі аймақ)']), { anchor: 'middle', mid: true, size: 11 }) + Txt(vx(84), 73, t(['связь', 'Netz', 'coverage', 'байланыс']), { anchor: 'middle', mid: true, size: 11 })
        + `<line x1="${VX0}" x2="${VX1}" y1="110" y2="110" class="hs-ink"/>`;
      [0, 10, 30, 60, 90].forEach(v => { if (v + 9 > 90) return; g += `<line x1="${f(vx(v + 9))}" x2="${f(vx(v + 9))}" y1="104" y2="116" class="hs-ink"/>` + Txt(vx(v + 9), 130, v ? '+' + v + ' ' + mn : '0', { anchor: 'middle', size: 11, cls: 'hv-sb' }); });
      return g + Token(vx(VAT[s]), 98)
        + Tag(vx(19), 36, '> 10 ' + mn + ' · ' + t(['разрыв', 'Lücke', 'gap', 'үзіліс']), s >= 1 ? 'warn' : 'muted') + Tag(vx(39), 36, '> 30 ' + mn + ' · OL1', s >= 2 ? 'bad' : 'muted') + Tag(vx(69), 36, '> 60 ' + mn + ' · ' + t(['ур. 3', 'Stufe 3', 'level 3', '3-деңг.']), s === 4 ? 'bad' : 'muted')
        + Box({ x: 40, y: 180, w: 200, h: 80, label: t(['Приложение водителя', 'Fahrer-App', 'Driver app', 'Жүргізуші қосымшасы']), sub: sms ? 'OL1 SMS · SO TE ST HB' : t(['данные · онлайн', 'Daten · online', 'data · online', 'деректер · онлайн']), on: s === 2 || s === 5, tone: sms ? 'warn' : 'base' })
        + Box({ x: 400, y: 180, w: 200, h: 80, label: t(['Монитор контакта', 'Kontaktmonitor', 'Contact monitor', 'Байланыс мониторы']), sub: s < 2 ? t(['норма', 'normal', 'normal', 'қалыпты']) : s === 4 ? t(['уровень 2 → 3', 'Stufe 2 → 3', 'level 2 → 3', '2 → 3-деңгей']) : t(['уровень 1 / 2', 'Stufe 1 / 2', 'level 1 / 2', '1 / 2-деңгей']), on: s === 1 || s === 2 || s === 4, tone: s === 4 ? 'bad' : s >= 2 && s < 5 ? 'warn' : 'base' })
        + Box({ x: 740, y: 180, w: 220, h: 80, label: t(['Диспетчер', 'Disponent', 'Dispatcher', 'Диспетчер']), sub: s === 3 ? 'MS → STOP · CHKT · WAIT' : s === 4 ? t(['Входящие + задача CRM', 'Eingang + CRM-Aufgabe', 'Inbox + CRM task', 'Кіріс + CRM тапсырмасы']) : t(['маршруты · покрытие', 'Routen · Netz', 'routes · coverage', 'маршруттар · байланыс']), on: s === 3 || s === 4, tone: s === 4 ? 'bad' : 'base' })
        + Arrow({ x1: 240, y1: 220, x2: 398, y2: 220, on: s === 0 || s === 2 || s === 5, label: sms ? 'SMS' : t(['данные', 'Daten', 'data', 'деректер']) }) + Arrow({ x1: 600, y1: 220, x2: 738, y2: 220, on: s === 2 || s === 4 })
        + Arrow({ d: 'M850,262 C850,320 140,320 140,264', on: s === 3, dashed: s !== 3, label: t(['SMS-инструкция → подтверждение AK', 'SMS-Anweisung → Bestätigung AK', 'SMS instruction → acknowledgement AK', 'SMS нұсқау → AK растауы']), lx: 500, ly: 300 })
        + Lines(500, 152, t(['ни одного персонального данного в SMS: рейс, машина, код события, время, MAC', 'keine Personendaten in der SMS: Tour, Fahrzeug, Ereigniscode, Zeit, MAC', 'no personal data in the SMS: trip, vehicle, event code, time, MAC', 'SMS-те жеке деректер жоқ: рейс, көлік, оқиға коды, уақыт, MAC']), { max: 110, size: 11, cls: 'hv-sb' });
    },
  });

  /* (10) four-eyes approvals and the roles matrix (0.3.10 approvals.tsx; matrix from the v6 ROLE_PERMS table) */
  const AP_ROWS = ['approvals:sign', 'costs:approve', 'quality:write', 'trips:override_release', 'trips:override_load', 'fleet:write', 'bookings:manage', 'users:admin', 'audit:read', 'pii:read'];
  const AS = [
    { row: 'bookings:manage', cap: ['Пользователь A создаёт запрос: решение «свой / внешний» (затраты), экспресс, изменение тарифа партнёра или справочника.', 'Benutzer A stellt eine Anfrage: Entscheidung „eigen / extern“ (Kosten), Express, Änderung eines Partnertarifs oder einer Stammdatenversion.', 'User A raises a request: an own / external decision (costs), express, a change of a partner rate or master-data version.', 'А пайдаланушысы сұрау жасайды: «өз / сыртқы» шешімі (шығындар), экспресс, серіктес тарифін немесе анықтамалықты өзгерту.'] },
    { row: 'costs:approve', cap: ['Слот 1 подписывает пользователь B со своей бизнес-функцией (например, руководитель логистики). Право + функция, а не просто роль.', 'Slot 1 unterschreibt Benutzer B mit seiner Geschäftsfunktion (z. B. Leitung Logistik). Recht + Funktion, nicht nur die Rolle.', 'Slot 1 is signed by user B holding the business function (e.g. head of logistics). Permission + function, not just the role.', '1-слотқа өз бизнес-функциясы бар B пайдаланушысы қол қояды (мысалы, логистика басшысы). Тек рөл емес, құқық + функция.'] },
    { row: 'approvals:sign', cap: ['Тот же пользователь не может подписать второй слот или свой собственный запрос — сервер отвечает 409.', 'Derselbe Benutzer kann keinen zweiten Slot und nicht die eigene Anfrage unterschreiben — der Server antwortet 409.', 'The same user cannot sign a second slot or their own request — the server answers 409.', 'Сол пайдаланушы екінші слотқа немесе өз сұрауына қол қоя алмайды — сервер 409 қайтарады.'] },
    { row: 'approvals:sign', cap: ['Слот 2 подписывает пользователь C (например, финансовый контролёр). Все подписи — со ссылкой на человека и время сервера.', 'Slot 2 unterschreibt Benutzer C (z. B. Finanzcontroller). Alle Unterschriften mit Personenbezug und Serverzeit.', 'Slot 2 is signed by user C (e.g. finance controller). Every signature carries the person reference and server time.', '2-слотқа C пайдаланушысы қол қояды (мысалы, қаржы бақылаушысы). Барлық қолтаңба адамға сілтемемен және сервер уақытымен.'] },
    { row: 'audit:read', cap: ['Все подписи на месте → действие выполняется; каждый шаг — в журнале аудита (цепочка HMAC), аудитор видит его без права менять.', 'Alle Unterschriften da → die Aktion wird ausgeführt; jeder Schritt steht im Audit-Protokoll (HMAC-Kette), der Auditor sieht ihn ohne Änderungsrecht.', 'All signatures in → the action is executed; every step is in the audit log (HMAC chain); the auditor sees it without the right to change.', 'Барлық қолтаңба бар → әрекет орындалады; әр қадам аудит журналында (HMAC тізбегі), аудитор оны өзгерту құқығынсыз көреді.'] },
  ];
  HELP.fig('approvals', {
    title: ['Принцип четырёх глаз и матрица ролей', 'Vier-Augen-Prinzip und Rollenmatrix', 'Four-eyes approvals and the roles matrix', 'Төрт көз қағидаты және рөлдер матрицасы'],
    steps: AS.map(x => x.cap), view: '0 0 1000 470', ms: 2800,
    draw(s) {
      const row = AS[s].row, PERM = typeof ROLE_PERMS !== 'undefined' ? ROLE_PERMS : {}, roles = (typeof ROLES !== 'undefined' ? ROLES : []).filter(r => r !== 'customer' && r !== 'partner');
      const CW = Math.min(36, Math.floor(330 / Math.max(1, roles.length))), MX = 540, MY = 140, LW = 128;
      let g = Box({ x: 20, y: 40, w: 160, h: 70, label: t(['Пользователь A', 'Benutzer A', 'User A', 'А пайдаланушы']), sub: t(['запрос', 'Anfrage', 'request', 'сұрау']), on: s === 0, tone: 'accent' })
        + Box({ x: 250, y: 20, w: 200, h: 70, label: t(['Слот 1 · пользователь B', 'Slot 1 · Benutzer B', 'Slot 1 · user B', '1-слот · B пайдаланушы']), sub: t(['функция: рук. логистики', 'Funktion: Leitung Logistik', 'function: head of logistics', 'функция: логистика басшысы']), tone: s >= 1 ? 'ok' : 'base', on: s === 1 })
        + Box({ x: 250, y: 130, w: 200, h: 70, label: t(['Слот 2 · пользователь C', 'Slot 2 · Benutzer C', 'Slot 2 · user C', '2-слот · C пайдаланушы']), sub: t(['функция: фин. контролёр', 'Funktion: Finanzcontroller', 'function: finance controller', 'функция: қаржы бақылаушысы']), tone: s >= 3 ? 'ok' : s === 2 ? 'bad' : 'base', on: s === 2 || s === 3 })
        + Arrow({ x1: 180, y1: 70, x2: 248, y2: 55, on: s === 1 }) + Arrow({ x1: 180, y1: 85, x2: 248, y2: 165, on: s === 3 })
        + (s === 2 ? Arrow({ x1: 350, y1: 90, x2: 350, y2: 128, tone: 'bad' }) + Tag(410, 110, t(['B второй раз → 409', 'B zum 2. Mal → 409', 'B again → 409', 'B қайта → 409']), 'bad') : '')
        + Box({ x: 130, y: 250, w: 260, h: 70, label: t(['Выполнено · журнал аудита', 'Ausgeführt · Audit-Protokoll', 'Executed · audit log', 'Орындалды · аудит журналы']), sub: t(['цепочка HMAC, без персональных данных', 'HMAC-Kette, ohne Personendaten', 'HMAC chain, no personal data', 'HMAC тізбегі, жеке деректерсіз']), tone: s === 4 ? 'ok' : 'base', on: s === 4 })
        + Arrow({ x1: 350, y1: 200, x2: 300, y2: 248, on: s === 4, tone: 'ok' })
        + Lines(250, 370, t(['Слоты: затраты 2 (рук. логистики + фин. контролёр) · экспресс 3 (CEO + аналитика + закупки) · справочники и тарифы партнёров — второй пользователь', 'Slots: Kosten 2 (Leitung Logistik + Finanzcontroller) · Express 3 (CEO + Analytik + Einkauf) · Stammdaten und Partnertarife — zweiter Benutzer', 'Slots: costs 2 (head of logistics + finance controller) · express 3 (CEO + analytics + purchasing) · master data and partner rates — a second user', 'Слоттар: шығындар 2 (логистика басшысы + қаржы бақылаушысы) · экспресс 3 (CEO + талдау + сатып алу) · анықтамалықтар мен серіктес тарифтері — екінші пайдаланушы']), { max: 70, size: 12, cls: 'hv-sb' });
      roles.forEach((r, j) => { const x = MX + LW + j * CW + CW / 2; g += `<text x="${x}" y="${MY - 8}" text-anchor="start" font-size="10.5" class="hv-t${S.role === r ? ' hv-st' : ''}" transform="rotate(-62 ${x} ${MY - 8})">${esc((typeof ROLE_NAME !== 'undefined' && ROLE_NAME[r]) || r)}</text>`; });
      AP_ROWS.forEach((p, i) => {
        g += `<g data-matrix-perm="${p}"><rect x="${MX - 4}" y="${MY + i * 32}" width="${LW + roles.length * CW + 8}" height="29" rx="4" class="${p === row ? 'hf-soft' : 'hf-bg'}"/>` + Txt(MX, MY + 14 + i * 32, p, { mid: true, size: 11 });
        roles.forEach((r, j) => { const has = (PERM[r] || []).includes(p); g += `<circle cx="${MX + LW + j * CW + CW / 2}" cy="${MY + 14 + i * 32}" r="${has ? 7 : 3}" class="${has ? (p === row ? 'hf-acc' : 'hf-ok') : 'hf-box hs-line'}"/>`; });
        g += '</g>';
      });
      return g;
    },
  });

  /* (11) driver app: a driver's day — phone mock + timeline (0.3.10 driverDay.tsx) */
  const DD = [
    { t: ['Начало смены', 'Schichtbeginn', 'Start of shift', 'Ауысым басы'], btn: ['Подписать путевой лист', 'Fahrauftrag unterschreiben', 'Sign the trip sheet', 'Жол парағына қол қою'], items: [['Медосмотр ✓', 'Fahrertauglichkeit ✓', 'Medical check ✓', 'Медициналық тексеру ✓'], ['Осмотр ТС ✓', 'Fahrzeugcheck ✓', 'Vehicle check ✓', 'Көлікті тексеру ✓'], ['Одометр: 128 440', 'Kilometerstand: 128 440', 'Odometer: 128 440', 'Одометр: 128 440']],
      cap: ['Утром: предрейсовый медосмотр и осмотр ТС, показания одометра, подпись путевого листа — без этого рейс не выпускается.', 'Morgens: Fahrertauglichkeit und Fahrzeugcheck, Kilometerstand, Unterschrift des Fahrauftrags — ohne das keine Freigabe.', 'Morning: pre-trip medical and vehicle check, odometer, trip-sheet signature — without them the trip is not released.', 'Таңертең: рейс алдындағы медициналық тексеру және көлікті тексеру, одометр, жол парағына қол — онсыз рейс шығарылмайды.'] },
    { t: ['Загрузка', 'Beladung', 'Loading', 'Тиеу'], btn: ['Сканировать SSCC', 'SSCC scannen', 'Scan SSCC', 'SSCC сканерлеу'], items: [['Мест 14 / 14 ✓', 'Packstücke 14 / 14 ✓', 'Packages 14 / 14 ✓', 'Орындар 14 / 14 ✓'], ['Логгер запущен ✓', 'Logger gestartet ✓', 'Logger started ✓', 'Логгер іске қосылды ✓'], ['Пломба 0042', 'Plombe 0042', 'Seal 0042', 'Пломба 0042']],
      cap: ['На складе: каждое место сканируется по SSCC против плана загрузки; логгер и пломба фиксируются.', 'Im Lager: jedes Packstück wird per SSCC gegen den Ladeplan gescannt; Logger und Plombe werden erfasst.', 'At the warehouse: every package is scanned by SSCC against the load plan; logger and seal are recorded.', 'Қоймада: әр орын тиеу жоспарына қарсы SSCC бойынша сканерленеді; логгер мен пломба тіркеледі.'] },
    { t: ['Отправление', 'Abfahrt', 'Departure', 'Жөнелту'], btn: ['В путь', 'Losfahren', 'Start the trip', 'Жолға шығу'], items: [['Go/No-Go: выпущено ✓', 'Go/No-Go: freigegeben ✓', 'Go/No-Go: released ✓', 'Go/No-Go: шығарылды ✓'], ['Камера 1: 5,1 °C', 'Kammer 1: 5,1 °C', 'Chamber 1: 5.1 °C', '1-камера: 5,1 °C'], ['Точек: 4', 'Stopps: 4', 'Stops: 4', 'Нүктелер: 4']],
      cap: ['Кнопка «В путь» доступна только после выпуска Go/No-Go; водитель видит точки, окна приёма и температуру камер.', '„Losfahren“ erst nach Go/No-Go-Freigabe; der Fahrer sieht Stopps, Annahmefenster und Kammertemperaturen.', '"Start the trip" only after the Go/No-Go release; the driver sees stops, receiving windows and chamber temperatures.', '«Жолға шығу» тек Go/No-Go шығарылғаннан кейін; жүргізуші нүктелерді, қабылдау терезелерін және камера температурасын көреді.'] },
    { t: ['В пути', 'Unterwegs', 'On the road', 'Жолда'], btn: ['SOS', 'SOS', 'SOS', 'SOS'], items: [['Задержка / поломка', 'Verspätung / Panne', 'Delay / breakdown', 'Кешігу / бұзылу'], ['Чек на топливо', 'Tankbeleg', 'Fuel receipt', 'Жанармай чегі'], ['Нет сети → SMS OL1', 'Kein Netz → SMS OL1', 'No network → SMS OL1', 'Желі жоқ → SMS OL1']],
      cap: ['В пути: инциденты (задержка, поломка, SOS), чеки на топливо; без сети > 30 мин важные события уходят SMS OL1.', 'Unterwegs: Vorfälle (Verspätung, Panne, SOS), Tankbelege; ohne Netz > 30 min gehen wichtige Ereignisse per SMS OL1.', 'On the road: incidents (delay, breakdown, SOS), fuel receipts; without network > 30 min important events go by SMS OL1.', 'Жолда: оқиғалар (кешігу, бұзылу, SOS), жанармай чектері; желісіз > 30 мин маңызды оқиғалар SMS OL1 арқылы кетеді.'] },
    { t: ['Точка · ePOD', 'Stopp · ePOD', 'Stop · ePOD', 'Нүкте · ePOD'], btn: ['Подпись получателя', 'Unterschrift Empfänger', 'Consignee signature', 'Алушының қолы'], items: [['1 Прибытие ✓', '1 Ankunft ✓', '1 Arrival ✓', '1 Келу ✓'], ['2 Скан мест ✓ · 3 Фото ✓', '2 Scan ✓ · 3 Foto ✓', '2 Scan ✓ · 3 Photo ✓', '2 Сканер ✓ · 3 Фото ✓'], ['4 Подпись + ФИО', '4 Unterschrift + Name', '4 Signature + name', '4 Қол + аты-жөні']],
      cap: ['На точке: прибытие, скан мест, фото, подпись и ФИО получателя → ePOD (имя хранится зашифрованно, не в журнале).', 'Am Stopp: Ankunft, Scan, Foto, Unterschrift und Name des Empfängers → ePOD (Name verschlüsselt gespeichert, nicht im Protokoll).', 'At the stop: arrival, scan, photo, signature and consignee name → ePOD (the name is stored encrypted, never in the log).', 'Нүктеде: келу, орындарды сканерлеу, фото, алушының қолы мен аты-жөні → ePOD (аты шифрланып сақталады, журналға жазылмайды).'] },
    { t: ['Исключения', 'Ausnahmen', 'Exceptions', 'Ерекшеліктер'], btn: ['Отметить отказ', 'Verweigerung erfassen', 'Record refusal', 'Бас тартуды белгілеу'], items: [['Частично / отказ', 'Teilweise / verweigert', 'Partial / refused', 'Ішінара / бас тарту'], ['Не найдено место', 'Packstück fehlt', 'Package missing', 'Орын табылмады'], ['Карантин качества', 'Qualitätssperre', 'Quality hold', 'Сапа карантині']],
      cap: ['Частичная доставка или отказ → отклонение для службы качества; заказ на карантине доставляется только «в карантин».', 'Teilzustellung oder Verweigerung → Abweichung für die Qualität; ein gesperrter Auftrag wird nur „in Quarantäne“ zugestellt.', 'Partial delivery or refusal → a deviation for quality; an order on hold is delivered only "in quarantine".', 'Ішінара жеткізу немесе бас тарту → сапа қызметіне ауытқу; карантиндегі тапсырыс тек «карантинге» жеткізіледі.'] },
    { t: ['Конец смены', 'Schichtende', 'End of shift', 'Ауысым соңы'], btn: ['Завершить смену', 'Schicht beenden', 'End shift', 'Ауысымды аяқтау'], items: [['Одометр: 128 812', 'Kilometerstand: 128 812', 'Odometer: 128 812', 'Одометр: 128 812'], ['Дефект → заявка в сервис', 'Mangel → Serviceauftrag', 'Defect → service ticket', 'Ақау → сервиске өтінім'], ['Часы: 9 ч 40 мин', 'Stunden: 9 h 40 min', 'Hours: 9 h 40 min', 'Сағат: 9 сағ 40 мин']],
      cap: ['Вечером: одометр, дефекты (черновик заявки в сервис), часы работы идут в учёт рабочего времени.', 'Abends: Kilometerstand, Mängel (Entwurf eines Serviceauftrags), Arbeitsstunden gehen ins Stundenkonto.', 'Evening: odometer, defects (draft service ticket), working hours go into the hours ledger.', 'Кешке: одометр, ақаулар (сервиске өтінім жобасы), жұмыс сағаттары есепке түседі.'] },
  ];
  HELP.fig('driver', {
    title: ['Приложение водителя: день водителя', 'Fahrer-App: ein Tag des Fahrers', 'Driver app: a driver’s day', 'Жүргізуші қосымшасы: жүргізушінің күні'],
    steps: DD.map(x => x.cap), view: '0 0 1000 470', ms: 2600,
    draw(s) {
      const x0 = DD[s];
      let g = `<rect x="40" y="14" width="250" height="440" rx="28" class="hf-box hs-ink" stroke-width="3"/><rect x="56" y="52" width="218" height="360" rx="6" class="hf-bg hs-line"/><rect x="135" y="28" width="60" height="8" rx="4" class="hf-bg hs-line"/>`
        + Txt(66, 72, '13 · ' + t(['Приложение водителя', 'Fahrer-App', 'Driver app', 'Жүргізуші қосымшасы']), { size: 11, cls: 'hv-sb' }) + Txt(66, 100, t(x0.t), { size: 17, cls: 'hv-st', attrs: ' data-phone-title' });
      x0.items.forEach((it, i) => { g += `<rect x="66" y="${120 + i * 56}" width="198" height="46" rx="6" class="hf-soft"/>` + Lines(76, 143 + i * 56, t(it), { max: 26, size: 12, anchor: 'start' }); });
      g += `<rect x="66" y="350" width="198" height="44" rx="8" class="${s === 3 ? 'hf-bad' : 'hf-acc'}"/>` + Txt(165, 372, t(x0.btn), { anchor: 'middle', mid: true, size: 13, cls: 'hv-st hv-ondark' });
      DD.forEach((x, i) => {
        const y = 40 + i * 60, on = i === s;
        g += `<g class="hv-bx${on ? ' on' : ''}${i < s ? ' done' : ''}" data-act="hvGo" data-id="driver" data-v="${i}" style="cursor:pointer"><circle cx="360" cy="${y}" r="${on ? 14 : 10}"/>${i < DD.length - 1 ? `<line x1="360" x2="360" y1="${y + 14}" y2="${y + 46}" class="hs-line" stroke-width="2"/>` : ''}${Txt(360, y, String(i + 1), { anchor: 'middle', mid: true, size: 11, cls: 'hv-st' })}${Txt(390, y - 8, t(x.t), { size: 14, cls: 'hv-st' })}${Lines(390, y + 12, t(x.cap), { max: 95, size: 11, anchor: 'start', cls: 'hv-sb', lh: 1.2 })}</g>`;
      });
      return g;
    },
  });

  /* (12) where express is: annotated mock of the Dispatch Board (0.3.10 dispatchMock.tsx) */
  const DN = [
    { at: [196, 66], cap: ['Значок у пункта «Диспетчерская»: столько экспресс-заявок ждут подписи вашей функции (CEO, аналитика, закупки).', 'Zähler am Menüpunkt „Disposition“: so viele Express-Anfragen warten auf die Unterschrift Ihrer Funktion (CEO, Analytik, Einkauf).', 'Badge on "Dispatch": how many express requests await the signature of your function (CEO, analytics, purchasing).', '«Диспетчерлік» белгісі: сіздің функцияңыздың (CEO, талдау, сатып алу) қолын күтетін экспресс-өтінімдер саны.'] },
    { at: [560, 98], cap: ['На доске вкладка «Экспресс» — открытые заявки: маршрут, груз, подписи 0–3 из 3, срок (отсечка).', 'Auf der Tafel der Reiter „Express“ — offene Anfragen: Strecke, Ware, Unterschriften 0–3 von 3, Frist (Annahmeschluss).', 'On the board the "Express" tab — open requests: route, goods, signatures 0–3 of 3, deadline (cut-off).', 'Тақтада «Экспресс» қойындысы — ашық өтінімдер: маршрут, жүк, 3-тен 0–3 қолтаңба, мерзім (кесу).'] },
    { at: [778, 143], cap: ['Подписи по слотам: ✓ — подписано (другим пользователем), «ваш» — подпись ждёт вас.', 'Unterschriften je Slot: ✓ — unterschrieben (von einem anderen Benutzer), „Ihr“ — die Unterschrift wartet auf Sie.', 'Signatures per slot: ✓ — signed (by another user), "yours" — the signature waits for you.', 'Слоттар бойынша қолтаңбалар: ✓ — қол қойылды (басқа пайдаланушы), «сіздің» — қолтаңба сізді күтуде.'] },
    { at: [873, 178], cap: ['Кнопка ведёт к согласованию (17 · «Исходные данные» → «Экспресс»), где ставится подпись или отказ.', 'Die Schaltfläche führt zur Freigabe (17 · „Ausgangsdaten“ → „Express“), wo unterschrieben oder abgelehnt wird.', 'The button leads to the approval (17 · "Baseline data" → "Express"), where you sign or reject.', 'Батырма келісуге апарады (17 · «Бастапқы деректер» → «Экспресс»), онда қол қойылады немесе бас тартылады.'] },
  ];
  HELP.fig('dispatchMock', {
    title: ['Где найти экспресс: Диспетчерская доска (макет)', 'Wo ist Express: Dispositionstafel (Skizze)', 'Where is express: Dispatch Board (mock-up)', 'Экспресс қайда: Диспетчерлік тақта (макет)'],
    steps: DN.map(n => n.cap), view: '0 0 1000 330', ms: 2600,
    draw(s) {
      const rows = [['EX-0311', ['Алматы → Атырау', 'Almaty → Atyrau', 'Almaty → Atyrau', 'Алматы → Атырау'], '18', '2–8 °C', 1], ['EX-0312', ['Астана → Шымкент', 'Astana → Schymkent', 'Astana → Shymkent', 'Астана → Шымкент'], '9', '15–25 °C', 0]];
      const nav = [['Обзор', 'Übersicht', 'Overview', 'Шолу'], ['Диспетчерская', 'Disposition', 'Dispatch', 'Диспетчерлік'], ['Загрузка и вес', 'Beladung und Gewicht', 'Load and weight', 'Тиеу және салмақ'], ['Отправка', 'Versand', 'Shipping', 'Жөнелту']];
      let g = `<rect x="10" y="10" width="980" height="310" rx="8" class="hf-bg hs-line"/><rect x="10" y="10" width="200" height="310" rx="8" class="hf-box"/>`;
      nav.forEach((n, i) => { g += `<rect x="22" y="${40 + i * 34}" width="176" height="28" rx="4" class="${i === 1 ? 'hf-soft' : 'hf-box'}"/>` + Txt(32, 54 + i * 34, t(n), { mid: true, size: 12 }); });
      g += `<circle cx="180" cy="88" r="10" class="hf-bad"/>` + Txt(180, 88, '1', { anchor: 'middle', mid: true, size: 11, cls: 'hv-st hv-ondark' })
        + Txt(230, 36, '02 · ' + t(['Рейсы, назначения, путевые листы', 'Fahrten, Zuweisungen, Fahraufträge', 'Trips, assignments, trip sheets', 'Рейстер, тағайындаулар, жол парақтары']), { size: 11, cls: 'hv-sb' })
        + Txt(230, 62, t(['Диспетчерская доска', 'Dispositionstafel', 'Dispatch Board', 'Диспетчерлік тақта']), { size: 22, cls: 'hv-st' })
        + `<rect x="230" y="80" width="740" height="226" rx="6" class="hf-box"/>` + Txt(244, 102, t(['Экспресс · ждут согласования', 'Express · warten auf Freigabe', 'Express · awaiting approval', 'Экспресс · келісуді күтуде']) + ' (2)', { size: 13, cls: 'hv-st' });
      rows.forEach((r, i) => {
        const y = i * 82; g += `<rect x="244" y="${118 + y}" width="712" height="72" rx="5" class="hf-bg hs-line"/>` + Txt(256, 140 + y, r[0], { size: 13, cls: 'hv-st' }) + Txt(330, 140 + y, t(r[1]), { size: 12.5 })
          + Txt(256, 164 + y, r[2] + ' ' + t(KGL) + ' · ' + r[3] + ' · ' + t(['срок', 'Frist', 'deadline', 'мерзім']) + ' 16:00', { size: 11.5, cls: 'hv-sb' });
        for (let k = 0; k < 3; k++) { const mine = k === 1 && i === 0 && k >= r[4]; g += `<rect x="${600 + k * 56}" y="${130 + y}" width="50" height="26" rx="13" class="${k < r[4] ? 'hf-soft hs-acc' : mine ? 'hf-bg hs-acc' : 'hf-box hs-line'}"/>` + Txt(625 + k * 56, 143 + y, k < r[4] ? '✓' : mine ? t(['ваш', 'Ihr', 'yours', 'сіздің']) : '—', { anchor: 'middle', mid: true, size: 11 }); }
        g += Txt(600, 172 + y, r[4] + ' / 3', { size: 11, cls: 'hv-sb' }) + `<rect x="800" y="${128 + y}" width="146" height="30" rx="5" class="hf-acc"/>` + Txt(873, 143 + y, t(['К согласованию 17 →', 'Zur Freigabe 17 →', 'To approval 17 →', 'Келісуге 17 →']), { anchor: 'middle', mid: true, size: 11.5, cls: 'hv-st hv-ondark' });
      });
      DN.forEach((n, i) => { g += `<g class="hv-bx${s === i ? ' on t-accent' : ''}" data-note="${i}"><circle cx="${n.at[0]}" cy="${n.at[1]}" r="13"/>${Lines(n.at[0], n.at[1], String(i + 1), { size: 12, cls: 'hv-st' })}</g>`; });
      return g;
    },
  });

  /* help text: how to read the animated figures of "Load and weight" */
  helpAdd({ key: 'orders/loadw', see: [HQ('Две анимированные схемы (также в «◇ Схема»): «Подбор ТС» — матрица 5 кандидатов × 8 проверок и качели нагрузки на оси (балка наклоняется по центру тяжести, ось сверх лимита — красная с «+кг»), и «Инструкция по загрузке» — заказы → зоны → вес и оси → разбиение → порядок LIFO → взвешивание. ▶ / ❚❚ — автопоказ, ‹ › — по шагам, «Все шаги» — список.',
    'Zwei animierte Schaubilder (auch unter „◇ Schaubild“): „Fahrzeugsuche“ — Matrix 5 Kandidaten × 8 Prüfungen und die Achslast-Wippe (der Balken kippt mit dem Schwerpunkt, eine Achse über dem Limit wird rot mit „+kg“), und „Beladeanleitung“ — Aufträge → Zonen → Gewicht und Achsen → Aufteilung → Reihenfolge LIFO → Verwiegung. ▶ / ❚❚ — Ablauf, ‹ › — schrittweise, „Alle Schritte“ — Liste.',
    'Two animated diagrams (also under "◇ Diagram"): "Truck finder" — a matrix of 5 candidates × 8 checks and the axle-load seesaw (the beam tilts with the centre of gravity, an axle over the limit turns red with "+kg"), and "Loading instruction" — orders → zones → weight and axles → split → LIFO order → weighing. ▶ / ❚❚ — autoplay, ‹ › — step by step, "All steps" — the list.',
    'Екі анимациялық сызба («◇ Сызба» ішінде де): «Көлік таңдау» — 5 үміткер × 8 тексеру матрицасы және ось жүктемесінің әткеншегі, және «Тиеу нұсқаулығы» — тапсырыстар → аймақтар → салмақ пен осьтер → бөлу → LIFO реті → өлшеу. ▶ / ❚❚ — автокөрсету, ‹ › — қадаммен.')] });
})();
