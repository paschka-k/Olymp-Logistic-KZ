  /* ---- R6 · 0.3.9 parity, operations on the fleet: «v5 · парк» (421–424) — trips run on fleet trucks, a truck carries at most one
     running trip, drivers of running trips hold a truck licence (C / CE); the West trip runs on a West-approved truck ---- */
  await group('ops on the fleet: one running trip per truck and per driver, drivers of running trips hold category C / CE, the West trip runs on a West-approved truck (0.3.9 «v5 · парк»)', 'ru', async (g, ev) => {
    const run = ev("S.loads.filter(l => isActive(l) && l.truck).map(l => ({ id: l.id, t: l.truck, d: l.driver, to: l.to }))");
    assert(run.length >= 3, 'running trips ' + run.length);
    const byT = {}, byD = {}; run.forEach(l => { byT[l.t] = (byT[l.t] || 0) + 1; if (l.d) byD[l.d] = (byD[l.d] || 0) + 1; });
    for (const [t, n] of Object.entries(byT)) assert(n === 1, t + ' carries ' + n + ' running trips');
    for (const [d, n] of Object.entries(byD)) assert(n === 1, d + ' drives ' + n + ' running trips');
    for (const l of run) {
      assert(ev(`S.trucks.some(t => t.id === '${l.t}')`), l.id + ': truck not in the fleet');
      if (!l.d) continue;
      const lic = ev(`S.drivers.find(d => d.id === '${l.d}').lic`); assert(/^C/.test(lic), l.id + ': driver licence ' + lic);
    }
    const west = ev("typeof WEST_ID !== 'undefined' && WEST_ID && S.loads.find(l => l.id === WEST_ID)");
    if (west && west.truck) assert(ev(`RES.west(S.trucks.find(t => t.id === '${west.truck}')).ok !== false`), 'West trip truck approved for the West ring');
  });
