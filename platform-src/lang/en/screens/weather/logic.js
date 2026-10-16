  wxRisk(r) {
    const d = this.tripDay(r); let worst = { lvl: 0 };
    r.route.forEach(c => [d, d + 1].filter(x => x < 7).forEach(x => { const w = WX[c][x]; if (w.lvl > worst.lvl) worst = { ...w, city: c, day: DAYS[x] }; }));
    return worst;
  }
  handedMap(pending) { const m = {}; (this.state.hos || []).forEach(r => { if (r.st === 'done' || pending) r.items.forEach(id => { m[id] = r; }); }); return m; }
  fullyHanded(ordId) { const ls = LINES.filter(l => l.ord === ordId), m = this.handedMap(); return ls.length > 0 && ls.every(l => m[l.id]); }
