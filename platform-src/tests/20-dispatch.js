/* ---- phase 2: dispatch rules ---- */
  await group('create load, assign, status chain to delivered', 'ru', async (g, ev) => {
    const id = ev(`createLoad({cust:'c1',from:'AST',to:'KAR',zone:'ambient',pallets:10,priority:'low'}).ok`).slice(8); assert(id, 'load created');
    eq(ev(`assign('LD-2026-${id}','d5','t4')`), null, 'assign'); eq(ev(`load('LD-2026-${id}').status`), 'assigned');
    for (const s of ['loading', 'in_transit', 'delivered']) { if (s === 'in_transit') { assert(ev(`canMove(load('LD-2026-${id}'),'in_transit')`), 'in_transit without Go/No-Go release must be refused (FR-91)'); eq(ev(`release('LD-2026-${id}','test: exception release for the status chain')`), null, 'override release'); } eq(ev(`canMove(load('LD-2026-${id}'),'${s}')`), null, 'canMove ' + s); ev(`setStatus('LD-2026-${id}','${s}')`); }
    eq(ev(`load('LD-2026-${id}').pod`), 'pending', 'POD pending'); eq(ev('drv("d5").status'), 'available', 'driver freed');
  });
  await group('invalid transitions and creation are refused', 'ru', async (g, ev) => {
    assert(ev(`canMove(load('LD-2026-001852'),'in_transit')`), 'unassigned -> in_transit must be refused'); assert(ev(`canMove(load('LD-2026-001847'),'unassigned')`), 'moving back to unassigned must be refused');
    assert(typeof ev(`createLoad({cust:'c1',from:'AST',to:'AST',zone:'pharma',pallets:5,priority:'low'})`) === 'string', 'same origin/destination must be refused'); assert(typeof ev(`createLoad({cust:'c1',from:'AST',to:'ALA',zone:'pharma',pallets:99,priority:'low'})`) === 'string', 'pallets > 33 must be refused');
  });
  await group('eligibility: expired licence, expired calibration, zone, capacity', 'ru', async (g, ev) => {
    assert(ev(`compat(load('LD-2026-001852'),drv('d1'),trk('t3')).length`) > 0, 't3 has no pharma zone');
    ev(`drv('d1').docs[0].to='2020-01-01'`); assert(ev(`compat(load('LD-2026-001850'),drv('d1'),trk('t1')).some(x=>/права|licen|Führer|куәлік/i.test(x))`), 'expired licence not blocking');
    ev(`trk('t1').docs.calib='2020-01-01'`); assert(ev(`compat(load('LD-2026-001852'),drv('d2'),trk('t1')).some(x=>/GDP/.test(x))`), 'expired calibration not blocking pharma');
    assert(ev(`compat(load('LD-2026-001853'),drv('d2'),trk('t1')).every(x=>!/GDP/.test(x))`), 'calibration must not block chilled loads');
  });
  await group('auto-assign assigns loads without breaking rules', 'ru', async (g, ev) => {
    const before = ev("S.loads.filter(l=>l.status==='unassigned').map(l=>l.id)"); const r = ev('autoAssign()'); assert(r.ok > 0, 'nothing assigned');
    assert(ev(`${JSON.stringify(before)}.map(load).filter(l=>l.status==='assigned').every(l=>trk(l.truck).zones.includes(l.zone)&&trk(l.truck).cap>=l.pallets&&drv(l.driver).docs.every(x=>docState(x.to)!=='expired'||x.type==='gdp')&&drv(l.driver).rto>=needRto(l))`), 'assignment violates rules');
  });
  await group('dispatch drag & drop: highlight, auto-pick on assign, refuse illegal', 'ru', async (g, ev, w) => {
    ev("go('dispatch')"); const dnd = (id, col) => w.eval(`(()=>{const c=document.querySelector('.kcard[data-id="${id}"]'),t=document.querySelector('.col[data-col="${col}"]'),dt=new DataTransfer();c.dispatchEvent(new DragEvent('dragstart',{bubbles:true,dataTransfer:dt}));t.dispatchEvent(new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt}));const cls=t.className;t.dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:dt}));return cls})()`);
    assert(/drop-ok/.test(dnd('LD-2026-001852', 'assigned')), 'no ok highlight'); eq(ev(`load('LD-2026-001852').status`), 'assigned'); assert(ev(`load('LD-2026-001852').driver`), 'driver picked');
    assert(/drop-no/.test(dnd('LD-2026-001852', 'in_transit')), 'no refuse highlight'); eq(ev(`load('LD-2026-001852').status`), 'assigned', 'illegal move executed');
  });
