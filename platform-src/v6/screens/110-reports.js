/* Reports (spec 5.10): six identical report-cards (chart + exactly 3 KPIs + PDF/CSV + View Details + AI summary),
   sticky filters, 840 px detail drawer (chart with tooltip, 4 KPIs, table, raw export). Numbers come from S.loads / S.invoices / S.costs;
   trend history before the current period is derived demo data. */
(function () {
  const R = { from: '2026-09-01', to: '2026-10-31', hub: '', zone: '', sum: {} };
  const dec = s => (LANG === 'en' ? s : s.replace('.', ','));
  const pc = v => dec(v.toFixed(1)) + ' %';
  const sg = v => (v < 0 ? '−' : '+') + dec(Math.abs(v).toFixed(1)) + ' %';
  const nf = n => Math.round(n).toLocaleString('ru-RU');
  const mio = n => n >= 1e6 ? dec((n / 1e6).toFixed(1)) + ' ' + T('млн', 'Mio.', 'M', 'млн') + ' ₸' : n >= 1e3 ? dec((n / 1e3).toFixed(1)) + ' ' + T('тыс', 'Tsd.', 'K', 'мың') + ' ₸' : nf(n) + ' ₸';
  const dd = iso => { const d = new Date(iso); return p2(d.getDate()) + '.' + p2(d.getMonth() + 1) + '.' + d.getFullYear(); };
  const lane = l => HUBS[l.from].city + ' → ' + HUBS[l.to].city;
  const day = iso => String(iso).slice(0, 10);
  const loadsF = () => S.loads.filter(l => day(l.eta) >= R.from && day(l.eta) <= R.to && (!R.hub || l.from === R.hub || l.to === R.hub) && (!R.zone || l.zone === R.zone));
  const invF = () => S.invoices.filter(i => i.created >= R.from && i.created <= R.to && (!R.zone || i.zone === R.zone) && (!R.hub || (i.load && load(i.load) && (load(i.load).from === R.hub || load(i.load).to === R.hub))));
  const sumLines = (iv, t) => iv.reduce((s, i) => s + i.lines.filter(x => x.type === t).reduce((a, x) => a + x.amount, 0), 0);
  const hist = k => [...k].reduce((s, c) => s + c.charCodeAt(0), 0) % 4 + 1;   // deterministic 30-day history per lane (demo)
  const excMin = l => (l.exc || 0) + (tempState(l) === 'breach' && isActive(l) ? 12 : 0);

  /* ---------- SVG charts ---------- */
  const CO = {};
  function chart(o) {
    if (!o.w) CO[o.id] = o;   // {type: area|bars|line|stack, labels, series:[[..]], colors:[..], min, max, step, w, h, tips, dots}
    const W = o.w || 300, H = o.h || 160, L = 28, B = 18, Tp = 6, iw = W - L - 6, ih = H - B - Tp, n = o.labels.length, ymin = o.min, ymax = o.max;
    const Y = v => Tp + ih - (v - ymin) / (ymax - ymin) * ih, X = i => L + (o.type === 'area' || o.type === 'line' ? (n === 1 ? iw / 2 : i / (n - 1) * iw) : (i + 0.5) * iw / n);
    let g = '';
    for (let v = ymin; v <= ymax + 1e-9; v += o.step) g += `<line x1="${L}" x2="${W - 6}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--chart-grid)" stroke-width="1"/><text x="${L - 4}" y="${Y(v) + 3}" font-size="8" fill="#9ca3af" text-anchor="end">${+v.toFixed(1)}</text>`;
    g += o.labels.map((t, i) => `<text x="${X(i)}" y="${H - 5}" font-size="8" fill="#9ca3af" text-anchor="middle">${esc(t)}</text>`).join('');
    const smooth = pts => pts.map((p, i) => i ? `C${(pts[i - 1][0] + p[0]) / 2},${pts[i - 1][1]} ${(pts[i - 1][0] + p[0]) / 2},${p[1]} ${p[0]},${p[1]}` : `M${p[0]},${p[1]}`).join(' ');
    const s0 = o.series[0], tipFor = (i, v) => (o.tips ? o.tips[i] : o.labels[i] + ': ' + dec(String(+v.toFixed(1))));
    if (o.type === 'area' || o.type === 'line') {
      const pts = s0.map((v, i) => [X(i), Y(v)]), path = smooth(pts);
      if (o.type === 'area') g += `<defs><linearGradient id="ga${o.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--chart-area)"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient></defs><path d="${path} L${pts[n - 1][0]},${Y(ymin)} L${pts[0][0]},${Y(ymin)}Z" fill="url(#ga${o.id})"/>`;
      g += `<path d="${path}" fill="none" stroke="${o.colors[0]}" stroke-width="2"/>`;
      if (o.dots) g += pts.map((p, i) => { const tx = Math.min(Math.max(p[0] - 40, 2), W - 84); return `<g class="pt"><circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${o.dots}" stroke="#fff" stroke-width="1.5"/><g class="tip"><rect x="${tx}" y="${Math.max(p[1] - 36, 0)}" width="82" height="26" rx="6" fill="#fff" stroke="#e5e7eb"/><text x="${tx + 8}" y="${Math.max(p[1] - 20, 12)}" font-size="9" fill="#111827">${esc(tipFor(i, s0[i]))}</text></g></g>`; }).join('');
    } else {
      const bw = Math.min(34, iw / n * 0.55);
      o.series.forEach((s, k) => s.forEach((v, i) => { const below = o.type === 'stack' ? o.series.slice(0, k).reduce((a, q) => a + q[i], 0) : 0; const y1 = Y(below + v), y0 = Y(below);
        g += `<g class="pt"><rect x="${X(i) - bw / 2}" y="${y1}" width="${bw}" height="${Math.max(y0 - y1, 0)}" rx="3" fill="${o.colors[o.type === 'stack' ? k : i % o.colors.length]}"/><g class="tip"><rect x="${Math.min(Math.max(X(i) - 41, 2), W - 84)}" y="${Math.max(y1 - 30, 0)}" width="82" height="22" rx="6" fill="#fff" stroke="#e5e7eb"/><text x="${Math.min(Math.max(X(i) - 41, 2), W - 84) + 8}" y="${Math.max(y1 - 15, 12)}" font-size="9" fill="#111827">${esc(tipFor(i, v))}</text></g></g>`; }));
    }
    return `<svg viewBox="0 0 ${W} ${H}" role="img">${g}</svg>`;
  }
  const hi = (a, st) => { const m = Math.max(...a, 1), s = st || (m <= 10 ? 2 : m <= 50 ? 10 : 20); return Math.ceil(m / s) * s; };

  /* ---------- the six cards ---------- */
  function cards() {
    const L = loadsF(), I = invF(), dv = L.filter(l => l.status === 'delivered'), net = I.reduce((s, i) => s + i.net, 0), cst = S.costs.filter(c => c.date >= R.from && c.date <= R.to && (!R.hub || c.hub === R.hub)).reduce((s, c) => s + c.amount, 0);
    const good = dv.filter(l => !l.exc && l.pod !== 'rejected').length, otif = dv.length ? good / dv.length * 100 : 0;
    const ev = L.filter(l => excMin(l) > 0), mins = ev.length ? ev.reduce((s, l) => s + excMin(l), 0) / ev.length : 0;
    const lanes = {}; L.forEach(l => { const k = lane(l); lanes[k] = lanes[k] || { n: 0 }; }); Object.keys(lanes).forEach(k => { lanes[k].n = hist(k) + ev.filter(l => lane(l) === k).length; });
    const lk = Object.keys(lanes).sort((a, b) => lanes[b].n - lanes[a].n).slice(0, 5), exTotal = lk.reduce((s, k) => s + lanes[k].n, 0);
    const act = S.drivers.filter(d => d.status !== 'rest').length, rate = S.drivers.length ? S.drivers.reduce((s, d) => s + d.rating, 0) / S.drivers.length : 0, fin = L.filter(l => ['delivered', 'problem'].includes(l.status)), comp = fin.length ? fin.filter(l => l.status === 'delivered').length / fin.length * 100 : 0;
    const mg = net ? (net - cst) / net * 100 : 0, nm = mg - 5.5;
    const reefer = sumLines(I, 'reefer'), fuel = sumLines(I, 'fuel'), det = S.costs.filter(c => c.cat === 'detention' && c.date >= R.from && c.date <= R.to).reduce((s, c) => s + c.amount, 0), acc = reefer + fuel + det;
    const cnt = I.reduce((s, i) => s + i.lines.filter(x => x.type !== 'freight').length, 0) + S.costs.filter(c => c.cat === 'detention').length;
    const wk = [T('Нед. 1', 'Wo 1', 'Wk 1', '1-апта'), T('Нед. 2', 'Wo 2', 'Wk 2', '2-апта'), T('Нед. 3', 'Wo 3', 'Wk 3', '3-апта'), T('Нед. 4', 'Wo 4', 'Wk 4', '4-апта'), T('Нед. 5', 'Wo 5', 'Wk 5', '5-апта')];
    const mo = [T('Май', 'Mai', 'May', 'Мамыр'), T('Июн', 'Jun', 'Jun', 'Мау'), T('Июл', 'Jul', 'Jul', 'Шіл'), T('Авг', 'Aug', 'Aug', 'Там'), T('Сен', 'Sep', 'Sep', 'Қыр'), T('Окт', 'Okt', 'Oct', 'Қаз')];
    const f3 = [0.62, 0.7, 0.78, 0.85, 0.93, 1].map(k => net * k);
    const r = (id, g, title, period, ch, k, extra, rows, cols) => ({ id, g, title, period, ch, k, extra, rows, cols });
    const tone = (v, l, t) => ({ v, l, t });
    const lr = ls => ls.map(l => [dd(l.eta), lane(l), drv(l.driver) ? drv(l.driver).name : '—', trk(l.truck) ? trk(l.truck).plate : '—', (l.temp - 0.6).toFixed(1) + ' / ' + (l.temp + 0.9).toFixed(1) + ' °C', (excMin(l) ? 'exc' : l.status === 'delivered' ? 'ok' : l.status), l.id]);
    const lcols = [T('Дата', 'Datum', 'Date', 'Күні'), T('Маршрут', 'Route', 'Route', 'Маршрут'), T('Водитель', 'Fahrer', 'Driver', 'Жүргізуші'), T('ТС (ГРЗ)', 'Fzg. (Kennz.)', 'Vehicle (plate)', 'КҚ (ГРЗ)'), T('t мин / макс', 't min / max', 't min / max', 't мин / макс'), T('Статус', 'Status', 'Status', 'Күйі'), 'ID'];
    const ir = iv => iv.map(i => [dd(i.created), i.id, cust(i.cust).name, i.route, nf(i.net), nf(i.total), i.paidAt ? 'paid' : 'open']);
    const icols = [T('Дата', 'Datum', 'Date', 'Күні'), T('Счёт', 'Rechnung', 'Invoice', 'Шот'), T('Клиент', 'Kunde', 'Customer', 'Клиент'), T('Маршрут', 'Route', 'Route', 'Маршрут'), T('Без НДС, ₸', 'Netto, ₸', 'Net, ₸', 'ҚҚС-сіз, ₸'), T('С НДС, ₸', 'Brutto, ₸', 'Gross, ₸', 'ҚҚС-пен, ₸'), T('Оплата', 'Zahlung', 'Payment', 'Төлем')];
    const otifS = [91.8, 92.6, 93.1, 93.9, otif || 94];
    return [
      r('otif', 'op', T('OTIF по хабам', 'OTIF je Hub', 'OTIF by hub', 'Хабтар бойынша OTIF'), T('30 дней', '30 Tage', 'Last 30 days', '30 күн'), chart({ id: 1, type: 'area', labels: wk, series: [otifS], colors: ['var(--chart-line)'], min: Math.floor(Math.min(...otifS) / 10) * 10, max: 100, step: 10, dots: 'var(--chart-line)', tips: otifS.map((v, i) => wk[i] + ': ' + dec(v.toFixed(1)) + ' %') }),
        [tone(pc(otif), T('Текущий уровень', 'Aktuell', 'Current rate', 'Ағымдағы деңгей'), 'g'), tone(sg(otif - otifS[3]), T('к прошлой неделе', 'ggü. Vorwoche', 'vs last week', 'өткен аптаға'), 'b'), tone(String(dv.length), T('Доставок', 'Lieferungen', 'Total deliveries', 'Жеткізулер'), 'k')],
        tone(String(L.length), T('Всего рейсов', 'Fahrten gesamt', 'Total loads', 'Барлық рейс'), 'k'), lr(dv.length ? dv : L), lcols),
      r('exc', 'op', T('Температурные отклонения по линиям', 'Temperaturabweichungen je Linie', 'Temperature excursions by lane', 'Желілер бойынша температура ауытқулары'), T('30 дней', '30 Tage', 'Last 30 days', '30 күн'), chart({ id: 2, type: 'bars', labels: lk.map(k => k.replace(' → ', '→')), series: [lk.map(k => lanes[k].n)], colors: ['var(--chart-amber)', 'var(--chart-amber)', '#f8d080', 'var(--chart-amber)'], min: 0, max: hi(lk.map(k => lanes[k].n)), step: hi(lk.map(k => lanes[k].n)) / 5 >= 1 ? Math.ceil(hi(lk.map(k => lanes[k].n)) / 5) : 1, tips: lk.map(k => k + ': ' + lanes[k].n) }),
        [tone(String(exTotal), T('Отклонений', 'Abweichungen', 'Excursions', 'Ауытқулар'), 'r'), tone(dec(mins.toFixed(0)) + ' ' + T('мин', 'Min.', 'min', 'мин'), T('Средняя длит.', 'Ø Dauer', 'Avg duration', 'Орташа ұзақтық'), 'a'), tone(lk[0] || '—', T('Больше всего', 'Am meisten', 'Most affected', 'Көбірек'), 'k')],
        tone(String(ev.length), T('Рейсов с отклонением сейчас', 'Fahrten mit Abweichung', 'Loads with excursion', 'Ауытқуы бар рейстер'), 'r'), lr(ev.length ? ev : L), lcols),
      r('drv', 'op', T('Эффективность водителей и ТС', 'Fahrer- und Fahrzeugeffizienz', 'Driver & vehicle performance', 'Жүргізушілер мен КҚ тиімділігі'), T('30 дней', '30 Tage', 'Last 30 days', '30 күн'), chart({ id: 3, type: 'line', labels: wk.slice(0, 4), series: [[4.6, 4.7, 4.8, +rate.toFixed(2)]], colors: ['#7bc9b0'], min: 0, max: 5, step: 1, dots: '#4e5ba6' }),
        [tone(dec(rate.toFixed(1)), T('Ср. рейтинг', 'Ø Bewertung', 'Avg rating', 'Орт. рейтинг'), 'g'), tone(pc(comp), T('Завершено', 'Abgeschlossen', 'Completion rate', 'Аяқталды'), 'b'), tone(String(act), T('Активных водителей', 'Aktive Fahrer', 'Active drivers', 'Белсенді жүргізушілер'), 'k')],
        tone(String(S.trucks.filter(t => t.status === 'busy').length), T('ТС в рейсе', 'Fzg. im Einsatz', 'Trucks in use', 'Рейстегі КҚ'), 'k'), lr(L.filter(l => l.driver)), lcols),
      r('rev', 'fin', T('Выручка', 'Umsatz', 'Revenue', 'Түсім'), T('6 месяцев', '6 Monate', 'Last 6 months', '6 ай'), chart({ id: 4, type: 'area', labels: mo, series: [f3], colors: ['var(--chart-line)'], min: 0, max: hi(f3, Math.max(1e6, Math.ceil(Math.max(...f3) / 5 / 1e6) * 1e6)), step: Math.max(1e6, Math.ceil(Math.max(...f3) / 5 / 1e6) * 1e6), tips: f3.map((v, i) => mo[i] + ': ' + mio(v)) }),
        [tone(mio(net), T('Выручка (без НДС)', 'Umsatz (netto)', 'Total revenue', 'Түсім (ҚҚС-сіз)'), 'g'), tone(sg(net / (f3[4] || 1) * 100 - 100), T('Рост к мес.', 'Wachstum', 'Growth rate', 'Өсім'), 'b'), tone(String(I.length), T('Счетов', 'Rechnungen', 'Invoices', 'Шоттар'), 'k')],
        tone(mio(I.reduce((s, i) => s + i.vat, 0)), T('НДС 12 %', 'MwSt 12 %', 'VAT 12 %', 'ҚҚС 12 %'), 'k'), ir(I), icols),
      r('mrg', 'fin', T('Маржа по маршрутам', 'Marge je Route', 'Margin analysis', 'Маржа талдауы'), T('3 месяца', '3 Monate', 'Last 3 months', '3 ай'), chart({ id: 5, type: 'stack', labels: mo.slice(3), series: [[nm - 1.1, nm - 0.6, nm], [6.6, 6.1, 5.5]], colors: ['var(--chart-mint)', 'var(--chart-sky)'], min: 0, max: Math.max(10, Math.ceil((mg + 4) / 10) * 10), step: Math.max(10, Math.ceil((mg + 4) / 10) * 10) / 5 }),
        [tone(pc(mg), T('Валовая маржа', 'Bruttomarge', 'Gross margin', 'Жалпы маржа'), 'g'), tone(pc(nm), T('Чистая маржа', 'Nettomarge', 'Net margin', 'Таза маржа'), 'b'), tone('+' + dec('1.3') + ' %', T('к прошлому кв.', 'ggü. Vorquartal', 'vs last quarter', 'өткен тоқсанға'), 'k')],
        tone(mio(cst), T('Затраты', 'Kosten', 'Costs', 'Шығыстар'), 'k'), ir(I), icols),
      r('acc', 'fin', T('Дополнительные услуги', 'Zusatzleistungen', 'Accessorials', 'Қосымша қызметтер'), T('30 дней', '30 Tage', 'Last 30 days', '30 күн'), chart({ id: 6, type: 'bars', labels: [T('Реф', 'Kühl', 'Reefer', 'Реф'), T('Топливо', 'Treibst.', 'Fuel', 'Отын'), 'Standgeld'], series: [[reefer / 1e3, fuel / 1e3, det / 1e3]], colors: ['var(--chart-amber)', 'var(--chart-amber)', '#f8d080'], min: 0, max: hi([reefer / 1e3, fuel / 1e3, det / 1e3], Math.max(100, Math.ceil(Math.max(reefer, fuel, det) / 1e3 / 5 / 100) * 100)), step: Math.max(100, Math.ceil(Math.max(reefer, fuel, det) / 1e3 / 5 / 100) * 100), tips: [mio(reefer), mio(fuel), mio(det)] }),
        [tone(mio(acc), T('Выручка доп. услуг', 'Zusatzumsatz', 'Total revenue', 'Қосымша түсім'), 'g'), tone(pc(net ? acc / net * 100 : 0), T('от выручки', 'vom Umsatz', 'of total revenue', 'түсімнен'), 'b'), tone(String(cnt), T('Начислений', 'Positionen', 'Total charges', 'Есептеулер'), 'k')],
        tone(mio(det), T('Standgeld', 'Standgeld', 'Standgeld', 'Standgeld'), 'a'), ir(I), icols)];
  }
  const sumTxt = c => {
    const k = c.k.map(x => x.l + ' ' + x.v).join(', ');
    return { otif: T('Доставлено в срок и без отклонений: ', 'Pünktlich und ohne Abweichung: ', 'On time and without excursion: ', 'Мерзімінде және ауытқусыз: '), exc: T('Рейсы с выходом за 2–8 °C сгруппированы по линиям; ', 'Fahrten außerhalb 2–8 °C je Linie; ', 'Loads outside 2–8 °C grouped by lane; ', '2–8 °C-тан шыққан рейстер желі бойынша; '), drv: T('Нагрузка и рейтинг парка: ', 'Auslastung und Bewertung: ', 'Fleet load and rating: ', 'Парк жүктемесі мен рейтингі: '), rev: T('Выручка без НДС по выставленным счетам: ', 'Umsatz netto aus Rechnungen: ', 'Net revenue from issued invoices: ', 'Шоттар бойынша ҚҚС-сіз түсім: '), mrg: T('Маржа = (выручка − затраты) / выручка: ', 'Marge = (Umsatz − Kosten) / Umsatz: ', 'Margin = (revenue − costs) / revenue: ', 'Маржа = (түсім − шығыс) / түсім: '), acc: T('Реф-доплата, топливная надбавка и Standgeld: ', 'Kühlzuschlag, Treibstoffzuschlag und Standgeld: ', 'Reefer surcharge, fuel surcharge and Standgeld: ', 'Реф-үстеме, отын үстемесі және Standgeld: ') }[c.id] + k + '.';
  };
  const col = { g: 'tone-g', b: 'tone-b', k: 'tone-k', r: 'tone-r', a: 'tone-a' };
  const kp = x => `<div><b class="${col[x.t]}"${x.v.length > 9 ? ' style="font-size:13px"' : ''}>${esc(x.v)}</b><small>${esc(x.l)}</small></div>`;
  const csvOf = c => [c.cols].concat(c.rows.map(r => r.map(v => ({ ok: 'on time', exc: 'excursion' }[v] || v))));
  const csvText = rows => '﻿' + rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n');
  const dl = (name, text, mime) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; a.click(); };
  const pdfDemo = () => toast(T('PDF формируется на сервере — в прототипе доступны CSV и JSON', 'PDF entsteht serverseitig — im Prototyp sind CSV und JSON verfügbar', 'PDF is rendered server-side — CSV and JSON are available in the prototype', 'PDF серверде жасалады — прототипте CSV және JSON қолжетімді'));
  const card = c => `<div class="card report-card" data-id="${c.id}"><div class="rh"><h4>${esc(c.title)}</h4>${chip('gray', c.period)}</div><div class="chart">${c.ch}</div><div class="kpi3">${c.k.map(kp).join('')}</div>
<div class="ra"><div class="ex"><button class="xchip pdf" data-act="rPdf">PDF</button><button class="xchip csv" data-act="rCsv" data-id="${c.id}">CSV</button></div><a class="lnk" data-act="rOpen" data-id="${c.id}">View Details</a></div><div class="center-link"><a class="lnk" data-act="rSum" data-id="${c.id}">Toggle AI Summary</a></div>${R.sum[c.id] ? `<div class="aisum">${esc(sumTxt(c))}</div>` : ''}</div>`;
  const sel = (k, lab, opts) => `<label>${esc(lab)}</label><select class="select" data-rf="${k}">${opts.map(o => `<option value="${esc(o[0])}"${R[k] === o[0] ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
  SCREENS.reports = {
    title: () => navLabel('reports'),
    sub: () => T('Эффективность, холодовая цепь и финансы', 'Leistung, Kühlkette und Finanzen', 'Performance, cold chain and finance', 'Тиімділік, суық тізбек және қаржы'),
    actions: () => `<button class="btn grey" data-act="rBulk">${esc(T('Массовый экспорт', 'Sammelexport', 'Bulk Export', 'Жаппай экспорт'))}</button><button class="btn primary" data-act="rCustom">${ic('plus')} ${esc(T('Свой отчёт', 'Eigener Bericht', 'Custom Report', 'Жеке есеп'))}</button>`,
    body: () => { const cs = cards(), g = k => cs.filter(c => c.g === k).map(card).join('');
      return `<div class="filters rep-filters"><input type="date" class="select" data-rf="from" value="${R.from}"><label>${esc(T('по', 'bis', 'to', 'дейін'))}</label><input type="date" class="select" data-rf="to" value="${R.to}">${sel('hub', T('Хаб', 'Hub', 'Hub', 'Хаб'), [['', T('Все хабы', 'Alle Hubs', 'All Hubs', 'Барлық хаб')], ...Object.keys(HUBS).map(k => [k, HUBS[k].city])])}${sel('zone', T('Тип груза', 'Ladungstyp', 'Types', 'Жүк түрі'), [['', T('Все типы', 'Alle Typen', 'All Types', 'Барлық түр')], ...Object.keys(ZONES).map(k => [k, ZONES[k].label])])}<button class="clear-all" data-act="rClr">× ${esc(T('Сбросить', 'Zurücksetzen', 'Clear Filters', 'Тазалау'))}</button></div>
<div class="sec-head"><h3>${esc(T('Операционные отчёты', 'Operative Berichte', 'Operational Reports', 'Операциялық есептер'))}</h3><span>${esc(T('Показатели работы и холодовой цепи', 'Leistungs- und Kühlkettenkennzahlen', 'Performance metrics and operational insights', 'Жұмыс және суық тізбек көрсеткіштері'))}</span></div><div class="rep-grid">${g('op')}</div>
<div class="sec-head"><h3>${esc(T('Финансовые отчёты', 'Finanzberichte', 'Financial Reports', 'Қаржылық есептер'))}</h3><span>${esc(T('Выручка, маржа, доп. услуги', 'Umsatz, Marge, Zusatzleistungen', 'Revenue analysis and financial metrics', 'Түсім, маржа, қосымша қызметтер'))}</span></div><div class="rep-grid">${g('fin')}</div>`; },
  };
  const stChip = s => ({ ok: chip('green', T('В срок', 'Pünktlich', 'On time', 'Мерзімінде')), exc: chip('yellow', T('Отклонение', 'Abweichung', 'Excursion', 'Ауытқу')), paid: chip('green', T('Оплачен', 'Bezahlt', 'Paid', 'Төленді')), open: chip('yellow', T('Открыт', 'Offen', 'Open', 'Ашық')) }[s] || (ST[s] ? chip(ST[s].c, ST[s].l) : esc(s)));
  DRAWERS.rep = d => {
    const c = cards().find(x => x.id === d.id), co = CO[['otif', 'exc', 'drv', 'rev', 'mrg', 'acc'].indexOf(c.id) + 1];
    const wide = chart(Object.assign({}, co, { w: 720, h: 220, dots: co.dots || 'var(--chart-line)' }));
    const ex = c.k.concat([c.extra]), stCol = 5;
    return { title: c.title + ' – ' + T('подробно', 'Details', 'Detailed View', 'толық'), xl: true, html: `<div class="drawer-section"><div style="display:flex;gap:8px;justify-content:flex-end;margin-bottom:8px"><button class="btn sm red" data-act="rPdf">PDF</button><button class="btn sm green" data-act="rCsv" data-id="${c.id}">Excel</button></div><div class="chart">${wide}</div></div>
<div class="drawer-section"><div class="kpi4">${ex.map(kp).join('')}</div></div>
<div class="drawer-section"><h4>${esc(T('Детальные данные', 'Detaildaten', 'Detailed Data', 'Толық деректер'))}</h4><div class="tcard"><table class="table"><thead><tr>${c.cols.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${c.rows.slice(0, 8).map(r => `<tr style="cursor:default">${r.map((v, i) => `<td>${(i === stCol && c.g === 'op') || (i === 6 && c.g === 'fin') ? stChip(v) : esc(v)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${c.cols.length}" class="empty">${esc(T('Нет данных', 'Keine Daten', 'No data', 'Дерек жоқ'))}</td></tr>`}</tbody></table></div></div>
<div class="drawer-section"><h4>Raw Data Export</h4><div style="display:flex;flex-direction:column;gap:8px"><button class="btn red block" data-act="rPdf">Export PDF</button><button class="btn green block" data-act="rCsv" data-id="${c.id}">Export Excel</button><button class="btn primary block" data-act="rJson" data-id="${c.id}">Export JSON</button>${c.g === 'op' ? `<button class="btn grey block" data-act="rGdp" data-id="${c.id}">${esc(T('Лог температуры GDP (CSV)', 'GDP-Temperaturlog (CSV)', 'GDP temperature log (CSV)', 'GDP температура журналы (CSV)'))}</button>` : ''}</div></div>` };
  };
  DRAWERS.repCustom = () => ({ title: T('Свой отчёт', 'Eigener Bericht', 'Custom Report', 'Жеке есеп'), html: `<div class="drawer-section"><p class="note">${esc(T('Выберите карточки для объединённого экспорта.', 'Karten für den kombinierten Export wählen.', 'Select the cards for a combined export.', 'Біріктірілген экспортқа карточкаларды таңдаңыз.'))}</p>${cards().map(c => `<label class="opt"><input type="checkbox" id="cr_${c.id}" checked><span><b>${esc(c.title)}</b></span></label>`).join('')}<div class="actbar" style="margin-top:12px"><button class="btn primary" data-act="rCustomGo" data-v="csv">CSV</button><button class="btn grey" data-act="rCustomGo" data-v="json">JSON</button></div></div>` });
  const jsonOf = c => ({ id: c.id, title: c.title, period: c.period, kpis: c.k.map(x => ({ label: x.l, value: x.v })), columns: c.cols, rows: c.rows });
  Object.assign(ACT, {
    rOpen: d => openDrawer({ type: 'rep', id: d.id }), rPdf: pdfDemo, rSum: d => { R.sum[d.id] = !R.sum[d.id]; render(); },
    rClr: () => { Object.assign(R, { from: '2026-09-01', to: '2026-10-31', hub: '', zone: '' }); render(); },
    rCsv: d => { const c = cards().find(x => x.id === d.id); dl('report-' + c.id + '.csv', csvText(csvOf(c)), 'text/csv'); },
    rJson: d => { const c = cards().find(x => x.id === d.id); dl('report-' + c.id + '.json', JSON.stringify(jsonOf(c), null, 2), 'application/json'); },
    rGdp: d => { const c = cards().find(x => x.id === d.id), rows = [[T('Рейс', 'Fahrt', 'Load', 'Рейс'), T('Зона', 'Zone', 'Zone', 'Аймақ'), 't min', 't max', T('Статус', 'Status', 'Status', 'Күйі')]].concat(loadsF().map(l => [l.id, ZONES[l.zone].label, (l.temp - 0.6).toFixed(1), (l.temp + 0.9).toFixed(1), tempState(l)])); dl('gdp-temperature-log.csv', csvText(rows), 'text/csv'); },
    rBulk: () => { dl('reports-all.json', JSON.stringify({ filters: { from: R.from, to: R.to, hub: R.hub, zone: R.zone }, reports: cards().map(jsonOf) }, null, 2), 'application/json'); },
    rCustom: () => openDrawer({ type: 'repCustom' }),
    rCustomGo: d => { const sel_ = cards().filter(c => ($('#cr_' + c.id) || {}).checked); if (!sel_.length) return toast(T('Выберите хотя бы одну карточку', 'Mindestens eine Karte wählen', 'Select at least one card', 'Кемінде бір карточка таңдаңыз'), 'err'); if (d.v === 'json') dl('custom-report.json', JSON.stringify(sel_.map(jsonOf), null, 2), 'application/json'); else dl('custom-report.csv', csvText([['report', 'kpi', 'value']].concat(...sel_.map(c => c.k.map(x => [c.title, x.l, x.v])))), 'text/csv'); },
  });
  document.addEventListener('input', e => { const k = e.target.dataset && e.target.dataset.rf; if (k) { R[k] = e.target.value; render(); } });
})();
