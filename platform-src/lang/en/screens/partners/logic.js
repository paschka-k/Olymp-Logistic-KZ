  partnerVals() {
    const s = this.state, seg2 = (cur, v) => ({ on: cur === v, bg: cur === v ? 'var(--color-accent)' : 'transparent', fg: cur === v ? 'var(--color-bg)' : 'var(--color-text)' });
    const ORDER = ['blocked', 'bronze', 'silver', 'gold'];
    const devDone = id => ((s.qa || {})[id] || {}).step >= 7;
    const eff = p => { if (p.tier === 'blocked') return s.pUnblock[p.id] ? { t: 'bronze', note: 'unblocked after closing ' + p.dev } : { t: 'blocked', note: '' };
      const sla = parseFloat(p.sla); if (sla < 90 && (p.tier === 'gold' || p.tier === 'silver')) return { t: ORDER[ORDER.indexOf(p.tier) - 1], note: 'downgraded from ' + TIER[p.tier].label + ' (SLA ' + p.sla + ' < 90 %)' };
      if (sla < 90) return { t: p.tier, note: 'under review: SLA ' + p.sla + ' < 90 %' }; return { t: p.tier, note: '' }; };
    const grpOf = c => c === 'Astana' || c === 'Almaty' ? 'main' : s.secCities[c] ? 'sec' : 'route';
    const zoneOf = c => (CITY.find(x => x[0] === c) || [0, 'ast'])[1];
    const untilOf = p => { const r = s.pRenew[p.id]; return r || p.until; };
    const monthsLeft = p => { const e = ymOf(untilOf(p)); return e === null ? null : e - NOW_YM; };
    const ann = p => { const E = eff(p); return { ...p, et: E.t, enote: E.note, grp: grpOf(p.city), zone: zoneOf(p.city), untilE: untilOf(p), mLeft: monthsLeft(p) }; };
    const PA = PARTNERS.map(ann);
    const tl = p => TIER[p.et];
    const flt = PA.filter(p => (s.pType === 'all' || p.type === s.pType) && (s.pTier === 'all' || p.et === s.pTier) && (s.pGrp === 'all' || p.grp === s.pGrp) && (s.hub === 'all' || p.zone === s.hub))
      .sort((x, y) => (x.grp === y.grp ? 0 : x.grp === 'main' ? -1 : y.grp === 'main' ? 1 : x.grp === 'sec' ? -1 : 1) || tl(y).rank - tl(x).rank);
    const yn = v => v ? 'yes' : '—';
    const partners = flt.map(p => { const renewSoon = p.et !== 'blocked' && p.mLeft !== null && p.mLeft <= 3;
      return { ...p, typeL: p.type === 'ws' ? 'Service' : 'Logistics', grpL: GRPL[p.grp], t: tl(p), tierL: tl(p).label, hasNote: !!p.enote, coldL: p.type === 'lp' ? yn(p.cold) : '—', adrL: p.type === 'lp' ? yn(p.adr) : '—', gdpL: yn(p.gdp),
        isBlocked: p.et === 'blocked', renewSoon, renewL: LV[p.mLeft <= 1 ? 3 : 2], renewT: 'contract until ' + p.untilE + ' · renew',
        renew: () => { const m = /^(\d{2})\.(\d{4})$/.exec(p.untilE); if (!m) return; const nu = m[1] + '.' + (+m[2] + 1); this.setState(x => ({ pRenew: { ...x.pRenew, [p.id]: nu } })); this.log('Partners · contract ' + p.id + ' renewed until ' + nu); this.showToast(p.name + ': contract renewed until ' + nu); },
        hasDev: !!p.dev && p.tier === 'blocked', devId: p.dev, openDev: () => this.setState({ screen: 'quality', qaSel: p.dev }), canUnblock: p.tier === 'blocked' && !s.pUnblock[p.id] && devDone(p.dev), unblockWait: p.tier === 'blocked' && !s.pUnblock[p.id] && !devDone(p.dev),
        unblock: () => { this.setState(x => ({ pUnblock: { ...x.pUnblock, [p.id]: true } })); this.log('Partners · ' + p.id + ' unblocked (' + p.dev + ' closed)'); },
        openContact: () => this.setState({ contactP: p.id }) }; });
    const cnt = k => PA.filter(p => p.et === k).length;
    const pKpis = [['Gold', cnt('gold')], ['Silver', cnt('silver')], ['Bronze', cnt('bronze')], ['Blocked', cnt('blocked')], ['Service partners', PA.filter(p => p.type === 'ws').length], ['Logistics partners', PA.filter(p => p.type === 'lp').length]].map(([label, v]) => ({ label, value: String(v) }));
    const hoTrips = TRIPS.filter(r => r.status !== 'done' && LINES.some(l => l.trip === r.id));
    const ht = hoTrips.find(r => r.id === s.hoTrip) || hoTrips[0];
    const taken = this.handedMap(true), hl = LINES.filter(l => l.trip === ht.id && !taken[l.id]), full = s.hoMode === 'full', selL = full ? hl : hl.filter(l => s.hoSel[l.id]);
    const needCold = selL.some(l => l.cls !== 'amb'), needAdr = selL.some(l => l.adr), needPal = selL.length;
    const hoLines = hl.map(l => ({ id: l.id, sscc: l.sscc, art: l.art, name: l.name, to: l.to, clsL: TL[l.cls], adr: l.adr ? 'ADR' : '', box: full || s.hoSel[l.id] ? 'var(--color-accent)' : 'transparent', toggle: () => { if (full) return; this.setState(x => ({ hoSel: { ...x.hoSel, [l.id]: !x.hoSel[l.id] } })); } }));
    const n = s.hos.length, money = v => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₸';
    const mk = (p, st) => { const rec = { id: 'HO-' + String(101 + n), trip: ht.id, partner: p.name, pid: p.id, tier: p.et, city: p.city, ins: p.ins, scope: full ? 'full · ' + selL.length + ' packages' : 'partial · ' + selL.length + ' of ' + LINES.filter(l => l.trip === ht.id).length + ' packages', items: selL.map(l => l.id), st, portal: 0, cost: money(needPal * p.rate) };
      this.setState(x => ({ hos: [rec, ...x.hos], hoSel: {}, capUsed: { ...x.capUsed, [p.id]: (x.capUsed[p.id] || 0) + needPal } })); this.log('Partners · ' + rec.id + ' · ' + ht.id + ' → ' + p.name + ' (' + rec.scope + ')');
      this.showToast(st === 'done' ? ht.id + ' handed over to partner ' + p.name : 'Approval request for handover: ' + p.name); };
    const hoCands = PA.filter(p => p.type === 'lp' && ht.route.includes(p.city)).map(p => { let ok = true, why; const free = p.capN - p.used - (s.capUsed[p.id] || 0);
      if (p.et === 'blocked') { ok = false; why = 'blocked: ' + p.block; }
      else if (p.mLeft !== null && p.mLeft < 0) { ok = false; why = 'contract expired ' + p.untilE; }
      else if (needCold && !p.cold) { ok = false; why = 'no 2–8 °C'; }
      else if (needAdr && !p.adr) { ok = false; why = 'no ADR approval'; }
      else if (needCold && !p.gdp) { ok = false; why = 'no GDP for 2–8 °C'; }
      else if (p.et === 'bronze' && (needCold || needAdr)) { ok = false; why = 'Bronze tier: 15–25 °C only, no ADR'; }
      else if (!p.ins) { ok = false; why = 'no carrier liability policy'; }
      else if (needPal && free < needPal) { ok = false; why = 'capacity: free ' + free + ' pal., needed ' + needPal; }
      else why = (p.et === 'gold' ? 'Gold · handover without approval' : p.et === 'silver' ? 'Silver · dispatcher approval needed' : 'Bronze · 15–25 °C only, manual') + ' · free ' + free + ' pal.';
      const can = ok && selL.length > 0, pc = needPal * p.rate, oc = needPal * OWN_PAL, diff = oc ? Math.round((pc - oc) / oc * 100) : 0;
      return { id: p.id, name: p.name, city: p.city, cap: p.cap, t: tl(p), tierL: tl(p).label, why, can, direct: can && p.et === 'gold', ask: can && p.et !== 'gold', rank: (ok ? 10 : 0) + tl(p).rank,
        hasPrice: ok && needPal > 0 && p.rate > 0, price: 'rate ' + money(p.rate) + '/pal. · ' + money(pc) + ' vs own trip ' + money(oc), verdict: diff <= 0 ? 'cheaper by ' + (-diff) + ' %' : 'more expensive by ' + diff + ' %', vl: LV[diff <= 0 ? 0 : diff > 15 ? 3 : 2],
        insT: p.ins ? 'liability policy · limit ' + p.ins : '', give: () => mk(p, 'done'), request: () => mk(p, 'wait'), openContact: () => this.setState({ contactP: p.id }) }; }).sort((x, y) => y.rank - x.rank);
    const PSTEPS = ['Accept goods', 'Scan packages', 'Upload ePOD'], PDONE = ['awaiting partner acceptance', 'goods accepted by partner', 'SSCC scanned by partner', 'partner ePOD uploaded'];
    const hos = s.hos.map(r => ({ ...r, t: TIER[r.tier], tierL: TIER[r.tier].label, stL: r.st === 'done' ? 'handed over · handover report signed' : 'awaiting dispatcher approval', l: LV[r.st === 'done' ? 0 : 2], canApprove: r.st === 'wait',
      liab: 'Liability passes to the partner when the report is signed · policy ' + (r.ins || '—') + ' · value ' + r.cost,
      portalT: 'Partner portal: ' + PDONE[r.portal || 0], hasPortal: r.st === 'done' && (r.portal || 0) < 3, portalBtn: PSTEPS[r.portal || 0] || '',
      portalNext: () => { this.setState(x => ({ hos: x.hos.map(y => y.id === r.id ? { ...y, portal: (y.portal || 0) + 1 } : y) })); this.log('Partner portal · ' + r.id + ' · ' + PSTEPS[r.portal || 0]); },
      approve: () => { this.setState(x => ({ hos: x.hos.map(y => y.id === r.id ? { ...y, st: 'done' } : y) })); this.log('Partners · ' + r.id + ' approved'); this.showToast(r.id + ' approved and handed over: ' + r.partner); } }));
    const tn = s.tickets.length;
    const wsRoute = PA.filter(p => p.type === 'ws' && ht.route.includes(p.city)).sort((x, y) => ht.route.indexOf(x.city) - ht.route.indexOf(y.city) || tl(y).rank - tl(x).rank).map(p => ({ id: p.id, name: p.name, city: p.city, svc: p.svc, resp: p.resp, t: tl(p), tierL: tl(p).label,
      isBlocked: p.et === 'blocked', block: p.block, called: !!s.wsCalls[p.id], canCall: p.et !== 'blocked' && !s.wsCalls[p.id], callL: p.et === 'bronze' ? 'Call (after approval)' : 'Call service', openContact: () => this.setState({ contactP: p.id }),
      call: () => { const tk = { id: 'SR-' + (201 + tn), partner: p.name, pid: p.id, city: p.city, veh: ht.veh, eta: '06.10 ' + this.clockStr(s.t).slice(0, 5) + ' + ' + p.resp, cost: p.cost, st: 'open' };
        this.setState(x => ({ wsCalls: { ...x.wsCalls, [p.id]: true }, tickets: [tk, ...x.tickets], vehSt: { ...x.vehSt, [ht.veh]: 'workshop' } })); this.log('Service · request ' + tk.id + ' · ' + p.name + ' (' + p.city + ') for ' + ht.veh); this.showToast('Service called: ' + p.name + ' · response ' + p.resp + ' · ' + ht.veh + ' in “service” status'); } }));
    const tickets = s.tickets.map(tk => ({ ...tk, l: LV[tk.st === 'open' ? 2 : 0], stL: tk.st === 'open' ? 'in progress · vehicle in service' : 'closed · work completion report', canClose: tk.st === 'open',
      close: () => { this.setState(x => { const vs = { ...x.vehSt }; delete vs[tk.veh]; return { tickets: x.tickets.map(y => y.id === tk.id ? { ...y, st: 'closed' } : y), vehSt: vs }; }); this.log('Service · ' + tk.id + ' closed, ' + tk.veh + ' available again'); } }));
    const cov = [];
    TRIPS.filter(r => r.status !== 'done').forEach(r => { const cold = LINES.some(l => l.trip === r.id && l.cls !== 'amb');
      r.route.forEach(c => { const lp = PA.filter(p => p.type === 'lp' && p.city === c && p.et !== 'blocked').sort((x, y) => tl(y).rank - tl(x).rank)[0], ws = PA.filter(p => p.type === 'ws' && p.city === c && p.et !== 'blocked').sort((x, y) => tl(y).rank - tl(x).rank)[0];
        const reef = PA.find(p => p.type === 'ws' && p.city === c && p.et !== 'blocked' && p.reefer), mob = PA.find(p => p.type === 'ws' && p.reefer && p.et === 'gold' && /24\/7/.test(p.svc) && r.route.includes(p.city));
        const reefT = !cold ? 'not required' : reef ? reef.id + ' ' + reef.name : mob ? 'mobile call-out ' + mob.id + ' (' + mob.city + ') · ≤ 4 h' : 'no reefer service', key = r.id + ':' + c;
        cov.push({ key, trip: r.id, city: c, lpT: lp ? lp.id + ' · ' + TIER[lp.et].label : 'no partner', lpL: LV[!lp ? 3 : lp.et === 'bronze' ? 2 : 0], wsT: ws ? ws.id + ' · ' + TIER[ws.et].label : 'no service', wsL: LV[ws ? 0 : 2], reefT, reefL: LV[!cold || reef ? 0 : mob ? 1 : 3],
          canTask: !lp && !s.pTasks[key], task: () => { this.setState(x => ({ pTasks: { ...x.pTasks, [key]: true } })); this.log('Partners · task: find logistics partner in ' + c + ' (' + r.id + ')'); this.showToast('Task created: find partner · ' + c); }, tasked: !!s.pTasks[key] }); }); });
    const secOpts = [...new Set(CITY.map(x => x[0]))].filter(c => c !== 'Astana' && c !== 'Almaty' && PARTNERS.some(p => p.city === c)).map(c => ({ city: c, on: !!s.secCities[c], box: s.secCities[c] ? 'var(--color-accent)' : 'transparent', label: s.secCities[c] ? 'transshipment point' : 'route city',
      toggle: () => this.setState(x => ({ secCities: { ...x.secCities, [c]: !x.secCities[c] } })) }));
    const cp = PA.find(p => p.id === s.contactP);
    const contact = cp ? { name: cp.name, city: cp.city, typeL: cp.type === 'ws' ? 'Service partner' : 'Logistics partner', tierL: tl(cp).label, t: tl(cp), svc: cp.svc,
      people: cp.contacts.map(c => ({ ...c, telHref: 'tel:' + c.tel.replace(/[^+\d]/g, ''), mobHref: 'tel:' + c.mob.replace(/[^+\d]/g, ''),
        call: () => { this.setState(x => ({ calls: [{ t: this.clockStr(s.t).slice(0, 5), who: c.name, num: c.mob, p: cp.name }, ...x.calls].slice(0, 5) })); this.log('Call: ' + c.name + ' (' + cp.name + ') ' + c.mob); this.showToast('Call: ' + c.name + ' · ' + c.mob + ' — connecting (simulation)'); } })) } : null;
    return { partners, pKpis, hasPartners: partners.length > 0,
      pTypeOpts: [['all', 'All'], ['ws', 'Service'], ['lp', 'Logistics']].map(([k, label]) => ({ label, go: () => this.setState({ pType: k }), ...seg2(s.pType, k) })),
      pTierOpts: [['all', 'All tiers'], ['gold', 'Gold'], ['silver', 'Silver'], ['bronze', 'Bronze'], ['blocked', 'Blocked']].map(([k, label]) => ({ label, go: () => this.setState({ pTier: k }), ...seg2(s.pTier, k) })),
      pGrpOpts: [['all', 'All cities'], ['main', 'Main warehouses'], ['sec', 'Transshipment points'], ['route', 'Route cities']].map(([k, label]) => ({ label, go: () => this.setState({ pGrp: k }), ...seg2(s.pGrp, k) })),
      hoTripOpts: hoTrips.map(r => ({ label: r.id, go: () => this.setState({ hoTrip: r.id, hoSel: {} }), ...seg2(ht.id, r.id) })),
      hoModeOpts: [['full', 'Full'], ['part', 'Partial']].map(([k, label]) => ({ label, go: () => this.setState({ hoMode: k }), ...seg2(s.hoMode, k) })),
      hoRoute: ht.route.join(' → ') + ' · ' + ht.veh, hoLines, hoCands, hoNeed: (needCold ? '2–8 °C · GDP' : '15–25 °C') + (needAdr ? ' · ADR' : '') + ' · packages: ' + selL.length + ' of ' + hl.length,
      hoEmpty: !full && selL.length === 0, hoAllDone: hl.length === 0, hos, hasHos: hos.length > 0, noHos: hos.length === 0, noPartners: partners.length === 0, wsRoute, tickets, hasTickets: tickets.length > 0, noTickets: tickets.length === 0, cov, secOpts,
      contact, contactOpen: !!cp, closeContact: () => this.setState({ contactP: null }), calls: s.calls, hasCalls: s.calls.length > 0,
      copyContacts: () => { if (!cp) return; const txt = cp.name + '\n' + cp.contacts.map(c => c.role + ': ' + c.name + ' · ' + c.tel + ' · ' + c.mob).join('\n'); try { navigator.clipboard.writeText(txt); } catch (e) {} this.showToast('Contacts copied'); } };
  }
