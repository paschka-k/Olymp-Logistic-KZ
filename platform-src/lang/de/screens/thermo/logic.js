  thermoLvl(v, L) {
    const r = L[v.id]; let lvl = 0;
    if (!v.thermo) return r.out < 5 ? 1 : 0;
    if (Object.keys(SIMS).some(k => this.state.sim[k] && SIMS[k].veh === v.id)) return 3;
    if (r.cold < 2 || r.cold > 8) lvl = 3; else if (r.amb < 15 || r.amb > 25) lvl = 2;
    else if (v.id === 'V04' && this.state.door && this.state.doorSec > 180) lvl = 2; else if (r.out < 0) lvl = 1;
    return lvl;
  }
