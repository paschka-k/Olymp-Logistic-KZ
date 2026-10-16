class Component extends DCLogic {
  state = {
    screen: this.props.startScreen ?? 'overview', blTab: 'val', blF: 'all', exAp: {}, hub: 'all', selTrip: 'R-106', sent: {}, tripDay: {},
    ord: { 'З-2281':1, 'З-2282':1, 'З-2290':1, 'З-2291':1, 'З-2292':1, 'З-2295':1 },
    selVeh: 'V04', sim: { freeze: false, overheat: false, fire: false, theft: false }, simSel: 'freeze', tip: null, contactP: null, calls: [], capUsed: {}, pUnblock: {}, pRenew: {}, pTasks: {}, tickets: [], vehSt: {}, secCities: { 'Караганда': true, 'Атырау': true }, pType: 'all', pTier: 'all', pGrp: 'all', hoTrip: 'R-106', hoMode: 'full', hoSel: {}, hos: [], wsCalls: {}, scan: false, qArch: false, qIdx: 0, zpl: false, scanFix: {}, docSt: {}, urgV: {}, booked: {}, fineImp: [], wxUpd: '14:00', drvLang: 'ru', drvAdr: false, q: '', shipTrip: 'R-106', shipSel: null, urg: {}, urgHub: 'ast', urgAdr: false, urgHeavy: false, fineSel: 'ШТ-1021', fineSt: {}, docs: {}, released: {}, qa: {}, drvStep: 0, door: false, doorSec: 0, t: 0,
    live: Object.fromEntries(VEH.map(v => [v.id, { ...v.base, hist: seedHist(v.base) }])),
    wxDays: 7, selCity: 'Костанай',
    inc: Object.fromEntries(INC.map(i => [i.id, 'new'])), extraInc: [],
    audit: [{ t:'09:00', text:'Система · создан инцидент INC-0405 (ДОПОГ)' }],
    scen: { buran: true, repair: false, peak: false }, toast: null
  };
  componentDidMount() { this.iv = setInterval(() => this.tick(), 2000); window.__OLYMP = { VEH, LINES, FINES, STAFF, TRIPS, WX, CITY, CAL, DREP, FEES, ORD, PKG, TACHO, PARTNERS, TIER, MFR, DV, VEH_X, BLD, BLC, BLR, BLF, BLV, BLT, BLFR, BLEX, CV, CP, COWN, THC, DFR, DECO, DEV0 }; }
  componentWillUnmount() { clearInterval(this.iv); clearTimeout(this.tt); }
  componentDidUpdate(pp) { if (pp.startScreen !== this.props.startScreen && this.props.startScreen) this.setState({ screen: this.props.startScreen }); }
  clockStr(t) { const s = 14 * 3600 + 32 * 60 + t * 2; const p = n => String(n).padStart(2, '0'); return p(Math.floor(s / 3600) % 24) + ':' + p(Math.floor(s / 60) % 60) + ':' + p(s % 60); }
