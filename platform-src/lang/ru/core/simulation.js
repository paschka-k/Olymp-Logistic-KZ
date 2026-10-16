  tick() {
    if (this.props.liveSimulation === false) return;
    this.setState(s => {
      const live = {};
      VEH.forEach(v => {
        const p = s.live[v.id], b = v.base, j = () => Math.random() - 0.5;
        const out = b.out + Math.sin(s.t / 10) * 0.6 + j() * 0.2;
        let cold, amb;
        const sim = s.sim, to = (x, tgt, k) => x + (tgt - x) * k;
        if (!v.thermo) { cold = out; amb = out; }
        else if (v.id === 'V04' && sim.freeze) { cold = to(p.cold, out, 0.09) + j() * 0.05; amb = to(p.amb, out, 0.07) + j() * 0.1; }
        else if (v.id === 'V01' && sim.overheat) { cold = to(p.cold, 14, 0.08) + j() * 0.05; amb = to(p.amb, 31, 0.06) + j() * 0.1; }
        else if (v.id === 'V03' && sim.fire) { cold = to(p.cold, 60, 0.07); amb = to(p.amb, 78, 0.08); }
        else { cold = to(p.cold, b.cold, 0.15) + j() * 0.12; amb = to(p.amb, b.amb, 0.15) + j() * 0.2; }
        if (v.id === 'V04' && s.door) cold += (out - cold) * 0.06;
        const push = (a, x) => [...a.slice(1), x];
        live[v.id] = { cold, amb, out, hist: { cold: push(p.hist.cold, cold), amb: push(p.hist.amb, amb), out: push(p.hist.out, out) } };
      });
      return { live, t: s.t + 1, doorSec: s.door ? s.doorSec + 20 : 0 };
    });
  }
  showToast(msg) { clearTimeout(this.tt); this.setState({ toast: msg }); this.tt = setTimeout(() => this.setState({ toast: null }), 2600); }
  log(text) { this.setState(s => ({ audit: [{ t: this.clockStr(s.t).slice(0, 5), text }, ...s.audit].slice(0, 8) })); }
  go(screen) { this.setState({ screen }); }

  tripDay(r) { return this.state.tripDay[r.id] ?? r.day; }
