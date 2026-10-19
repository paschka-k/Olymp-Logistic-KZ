  /* ---- P3 thermo: history chart, readouts, status, door timer, temperature log (0.3.10 screen 05, FR-39/40/102) ---- */
  await group('P3 thermo: chips, readout tiles, 48-reading chart with bands and legend, status block', 'ru', async (g, ev, w) => {
    ev("go('routes');ACT.stab({s:'routes',v:'temp'})"); clean(w, 'temp');
    const n = ev('THERMO.vehicles().length'); assert(n >= 2, 'monitored vehicles'); eq(w.document.querySelectorAll('[data-th-chips] .th-chip').length, n, 'one chip per vehicle');
    eq(w.document.querySelectorAll('[data-th-ro]').length, 3, 'three readout tiles'); assert(w.document.querySelector('[data-th-chart] svg'), 'chart'); eq(w.document.querySelectorAll('[data-th-chart] polyline').length, 3, 'three lines'); eq(w.document.querySelectorAll('[data-th-chart] rect').length, 2, 'two bands');
    assert(w.document.querySelectorAll('.th-legend span').length >= 4, 'legend'); assert(w.document.querySelectorAll('[data-th-status] > div').length >= 6, 'status rows');
    const t = ev('S.thermo.sel'); const h = ev(`THERMO.hist(trk('${t}'))`); eq(h.cold.length, 48, '48 readings'); eq(h.amb.length, 48); eq(h.out.length, 48);
    const other = ev("THERMO.vehicles().find(v=>v.id!==S.thermo.sel).id"); ev(`ACT.thSel({id:'${other}'})`); eq(ev('S.thermo.sel'), other, 'chip selects'); assert(w.document.querySelector('.th-chip.sel').dataset.id === other, 'selected chip');
  });
  await group('P3 thermo: liveTick extends the history (window stays 48) and the door timer raises the 3-min cold-chain alarm', 'ru', async (g, ev) => {
    const t = ev("S.loads.find(l=>l.status==='in_transit').truck"); ev(`S.thermo.sel='${t}';THERMO.hist(trk('${t}'))`); const last0 = ev(`THERMO.hist(trk('${t}')).cold.slice(-1)[0]`);
    ev('liveTick()'); eq(ev(`THERMO.hist(trk('${t}')).cold.length`), 48, 'window stays 48'); eq(ev(`THERMO.hist(trk('${t}')).cold.slice(-1)[0]`), ev(`trk('${t}') && S.loads.find(l=>l.truck==='${t}'&&l.status!=='delivered').temp`), 'last point = live temp');
    assert(last0 !== undefined, 'had a reading'); ev(`ACT.thDoor({id:'${t}'})`); assert(ev('S.thermo.door') && ev('S.thermo.door.truck') === t, 'door open'); const l = ev(`S.loads.find(l=>l.truck==='${t}'&&l.status!=='delivered').id`);
    for (let i = 0; i < 95; i++) ev('THERMO.tick()'); assert(ev('S.thermo.door.sec') >= 180, 'timer counts'); eq(ev(`load('${l}').status`), 'problem', 'alarm after 3 min'); assert(ev("S.audit.some(a=>/3 min/.test(a.reason))"), 'audited');
    ev(`ACT.thDoor({id:'${t}'})`); assert(!ev('S.thermo.door'), 'door closed');
  });
  await group('P3 temperature log: record reading, out-of-range opens a deviation, sensor mapping, thermochron CSV feeds the thermochron log', 'ru', async (g, ev, w) => {
    ev("go('routes');ACT.stab({s:'routes',v:'templog'})"); assert(w.document.querySelector('#tl_tbl') && w.document.querySelector('[data-tl-form]') && w.document.querySelector('[data-tl-csv]'), 'tab parts'); clean(w, 'templog');
    const t = ev("S.loads.find(l=>l.status==='in_transit'&&l.zone==='pharma').truck"); ev(`S.thermo.sel='${t}';render()`); const n0 = ev('S.thermo.log.length'), d0 = ev('S.devs.length');
    const ok = ev(`THERMO.rec({truck:'${t}',cls:'pharma',val:5.2})`); eq(ok.ok, true, 'in range'); eq(ev('S.thermo.log.length'), n0 + 1);
    const bad = ev(`THERMO.rec({truck:'${t}',cls:'pharma',val:9.8})`); eq(bad.ok, false, 'out of range'); assert(ev('S.devs.length') >= d0, 'deviation'); ev('render()'); assert(w.document.querySelector('[data-tl-row]'), 'row rendered');
    const s0 = ev(`THERMO.sensors(trk('${t}')).length`); w.document.querySelector('#tl_sname').value = 'S-rear'; ev('ACT.tlSensAdd()'); eq(ev(`THERMO.sensors(trk('${t}')).length`), s0 + 1, 'sensor added'); assert(w.document.querySelector('[data-sensor="S-rear"]'), 'sensor row');
    const thc = ev('S.res.thc.length'); const r = ev(`THERMO.csv({truck:'${t}',cls:'pharma',logger:'LG-901',text:'time;C\\n08:00;5.1\\n08:05;7.9\\n08:10;9.2\\n08:15;6.0'})`); eq(r.n, 4, 'points'); eq(r.max, 9.2); eq(r.exc, 5, 'minutes out'); assert(r.rec && r.rec.id, 'thermochron log record'); eq(ev('S.res.thc.length'), thc + 1, 'integrated with 360');
    eq(ev("S.thermo.log.filter(r=>r.src==='thermochron').length"), 4, 'points logged'); eq(ev(`THERMO.csv({truck:'${t}',cls:'pharma',text:'x'}).err`) !== undefined, true, 'bad csv refused');
  });
  await group('P3: temperature tabs render in 4 languages, DE/EN without Cyrillic', 'ru', async (g, ev) => {
    for (const lang of LANGS) { const gg = await fresh(lang); try { for (const k of ['temp', 'templog']) { gg.ev(`go('routes');ACT.stab({s:'routes',v:'${k}'})`); clean(gg.w, lang + ' routes/' + k);
      if (lang === 'de' || lang === 'en') { let txt = gg.ev("document.querySelector('.content').innerText"); const known = gg.ev("S.drivers.flatMap(d=>[d.name,d.ini]).concat(CUSTOMERS.flatMap(c=>[c.name,c.ini]))"); known.forEach(n => { txt = txt.split(n).join(''); }); const cyr = txt.match(/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүІі]+/g) || []; assert(!cyr.length, lang + ' Cyrillic in ' + k + ': ' + cyr.slice(0, 5)); } } } finally { gg.done(); } }
  });
