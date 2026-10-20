/* R4 · I-12 Express × temperature overlap by week / route / customer (extends the W5 tab Reports → Express × temperature).
   Overlap = share of express loads that are temperature shipments (2–8 / 0–4 / −18 °C): those can ride in the regular cold-chain
   cycle, so their saving (express 1 440 ₸/kg → regular 228 ₸/kg, G30) is what the programme can secure. The scope expects the
   overlap to secure 78 % of the planned saving (G29); every group shows its secured share against that target and what was already
   moved (decisions from the W5 list, S.eco.cross.regular). The section is appended to the existing tab body (no edit to 610). */
(function () {
  const RATE = { express: 1440, ltl: 228 }, TARGET = 78;
  const nf = n => LF.int(n);
  const f1 = v => LF.dec(v, 1);
  const XO = S.xo = { by: 'week' };
  const isoWeek = iso => { const d = new Date(iso), t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return Math.ceil(((t - y0) / 864e5 + 1) / 7); };
  const BY = {
    week: { l: T('По неделям', 'Nach Wochen', 'By week', 'Апта бойынша'), key: l => String(isoWeek(l.eta)).padStart(2, '0'), label: k => T('нед. ', 'KW ', 'week ', 'апта ') + +k },
    route: { l: T('По маршрутам', 'Nach Routen', 'By route', 'Маршрут бойынша'), key: l => l.from + '-' + l.to, label: k => { const [a, b] = k.split('-'); return HUBS[a].city + ' → ' + HUBS[b].city; } },
    cust: { l: T('По клиентам', 'Nach Kunden', 'By customer', 'Клиент бойынша'), key: l => l.cust, label: k => cust(k).name },
  };
  const isTemp = l => l.zone !== 'ambient';
  const moved = l => !!(S.eco && S.eco.cross && S.eco.cross.regular[l.id]);
  globalThis.xoOverlap = by => {
    const B = BY[by] || BY.week, ex = S.loads.filter(ecoIsExpress), groups = {};
    ex.forEach(l => { const k = B.key(l); (groups[k] = groups[k] || []).push(l); });
    const row = (k, ls) => { const tl = ls.filter(isTemp), sv = l => l.kg * (RATE.express - RATE.ltl), plan = ls.reduce((s, l) => s + sv(l), 0), sec = tl.reduce((s, l) => s + sv(l), 0), mv = ls.filter(moved).reduce((s, l) => s + sv(l), 0);
      return { k, label: k === '*' ? T('Итого', 'Summe', 'Total', 'Барлығы') : B.label(k), n: ls.length, temp: tl.length, overlap: ls.length ? tl.length / ls.length * 100 : 0, plan, secured: sec, securedPct: plan ? sec / plan * 100 : 0, moved: mv, movedPct: plan ? mv / plan * 100 : 0 }; };
    const rows = Object.keys(groups).sort().map(k => row(k, groups[k]));
    return { by, rows, total: row('*', ex), target: TARGET };
  };
  const pctChip = v => chip(v >= TARGET ? 'green' : v >= TARGET - 15 ? 'yellow' : 'red', f1(v) + ' %');
  function section() {
    const o = xoOverlap(XO.by), t = o.total;
    const tr = (r, tot) => `<tr style="cursor:default${tot ? ';background:var(--bg-subtle)' : ''}" data-xo="${esc(r.k)}"><td><b>${esc(r.label)}</b></td><td>${r.n}</td><td>${r.temp}</td><td>${f1(r.overlap)} %</td><td>${nf(r.plan)} ₸</td><td><b>${nf(r.secured)} ₸</b></td><td>${pctChip(r.securedPct)}</td><td>${nf(r.moved)} ₸<div class="sub">${f1(r.movedPct)} %</div></td></tr>`;
    const by = Object.keys(BY).map(k => `<span class="pill-tab${k === XO.by ? ' active' : ''}" role="tab" tabindex="0" data-act="xoBy" data-v="${k}">${esc(BY[k].l)}</span>`).join('');
    return `<div class="card card-body" data-xo-section style="margin-top:12px"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h4 style="margin:0">${esc(T('Пересечение экспресс × температура · обеспеченная экономия', 'Schnittmenge Express × Temperatur · gesicherte Einsparung', 'Express × temperature overlap · secured saving', 'Экспресс × температура қиылысы · қамтылған үнем'))}</h4><div class="pill-tabs" role="tablist">${by}</div></div>${howNote('r4Overlap')}
<div class="kpi-row k4">${[['blue', 'alert', String(t.n), T('Экспресс-рейсов', 'Express-Fahrten', 'Express loads', 'Экспресс рейстер')], ['purple', 'therm', f1(t.overlap) + ' %', T('Из них температурные', 'Davon temperaturgeführt', 'Of which temperature', 'Оның ішінде температуралық')], [t.securedPct >= TARGET ? 'green' : 'yellow', 'chart', f1(t.securedPct) + ' %', T('Обеспечено от плана · цель 78 %', 'Gesichert vom Plan · Ziel 78 %', 'Secured of plan · target 78 %', 'Жоспардан қамтылды · мақсат 78 %')], ['green', 'spark', nf(t.moved) + ' ₸', T('Уже переведено', 'Bereits verlagert', 'Already moved', 'Ауыстырылды')]].map(x => `<div class="kpi-tile tint ${x[0]}"><div><div class="value">${x[2]}</div><div class="label">${esc(x[3])}</div></div><div class="icon" style="background:var(--${x[0]});color:#fff;border-radius:50%">${ic(x[1], 18)}</div></div>`).join('')}</div>
<div class="tcard" style="overflow-x:auto"><table class="table" data-xo-table="${XO.by}"><thead><tr><th>${esc(BY[XO.by].l)}</th><th>${esc(T('Экспресс', 'Express', 'Express', 'Экспресс'))}</th><th>${esc(T('Температурные', 'Temperatur', 'Temperature', 'Температуралық'))}</th><th>${esc(T('Пересечение', 'Schnittmenge', 'Overlap', 'Қиылысу'))}</th><th>${esc(T('Плановая экономия', 'Geplante Einsparung', 'Planned saving', 'Жоспарлы үнем'))}</th><th>${esc(T('Обеспечено', 'Gesichert', 'Secured', 'Қамтылды'))}</th><th>${esc(T('Доля / цель 78 %', 'Anteil / Ziel 78 %', 'Share / target 78 %', 'Үлес / мақсат 78 %'))}</th><th>${esc(T('Переведено', 'Verlagert', 'Moved', 'Ауыстырылды'))}</th></tr></thead><tbody>${o.rows.map(r => tr(r)).join('') || `<tr><td colspan="8" class="empty">${esc(T('Экспресс-рейсов нет', 'Keine Express-Fahrten', 'No express loads', 'Экспресс рейс жоқ'))}</td></tr>`}${tr(t, true)}</tbody></table></div>
<div class="actbar" style="margin-top:8px"><button class="btn grey" data-act="xoCsv">${esc(T('CSV по группам', 'CSV nach Gruppen', 'CSV by group', 'Топтар бойынша CSV'))}</button></div></div>`;
  }
  const tab = (SCREENS.reports.tabs || []).find(t => t.key === 'cross');
  if (tab) { const b0 = tab.body; tab.body = () => b0() + section(); }
  Object.assign(ACT, {
    xoBy: d => { XO.by = d.v; render(); },
    xoCsv: () => { const o = xoOverlap(XO.by), rows = [[o.by, 'express_loads', 'temperature_loads', 'overlap_pct', 'planned_saving_kzt', 'secured_kzt', 'secured_pct', 'target_pct', 'moved_kzt']].concat(o.rows.concat([o.total]).map(r => [r.label, r.n, r.temp, r.overlap.toFixed(1), Math.round(r.plan), Math.round(r.secured), r.securedPct.toFixed(1), TARGET, Math.round(r.moved)]));
      XP.save('express-overlap-' + o.by + '.csv', XP.csv(rows), 'text/csv');
      audit(T('Отчёты', 'Berichte', 'Reports', 'Есептер'), 'express-overlap', T('Экспорт CSV', 'CSV-Export', 'CSV export', 'CSV экспорт'), o.by); },
  });
})();
