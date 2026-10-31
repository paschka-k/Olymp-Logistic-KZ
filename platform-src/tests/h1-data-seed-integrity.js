  /* ---- H1 · 0.3.11 parity, seed-data integrity: the «Данные · …» / «Fragenkatalog · …» scenarios that f1-data-integrity.js and f4-economics.js
     only covered in part (docs/parity-0311/autotests-gap.md, section 2 and h1). One group walks every record of a dataset and names the
     first offender. v6 deliberately differs from the 0.3.11 seed (7 trucks / 7 drivers / 17 partners / 2 contacts per partner / 4 target
     vehicles), so counts are never ported literally: the v6 equivalent is «every record satisfies the rule». Weather forecast cities
     (0.3.11 «Данные · погода» 121–133) are covered by h3. ---- */

  /* Region code of a KZ plate (NNN LLL RR) -> registration oblast / city of republican significance. */
  const H1_PLATE_REGION = { '01': 'AST', '02': 'ALA', '09': 'KAR', '17': 'SHY', '06': 'ATY' };

  await group('data: plate region code is a hub region of the network and matches the truck hub for most trucks (0.3.11 Данные · ТС 22–25)', 'ru', async (g, ev) => {
    /* 0.3.11 rule: «регион 02 (Алматы)» — every truck was registered where the fleet lived. v6 has hubs in five cities, and a truck may be
       registered in one hub city and based at another (t3 is plated 01 Astana but works from Karaganda, t5 is plated 09 Karaganda but works
       from Astana — both are leasing/transfer cases and other tests pin these plates), so the v6 rule is: the region of every plate is the
       region of one of the network hubs, and the plate matches the home hub for at least two thirds of the fleet. */
    const tr = ev('S.trucks.map(t=>({id:t.id,plate:t.plate,hub:t.hub}))'), hubs = ev('Object.keys(HUBS)');
    const regionHubs = Object.values(H1_PLATE_REGION);
    assert(regionHubs.every(h => hubs.includes(h)), 'region table points at a hub that does not exist');
    let match = 0;
    for (const t of tr) {
      const reg = t.plate.slice(-2);
      assert(H1_PLATE_REGION[reg], t.id + ': plate region ' + reg + ' is not the region of any network hub (' + t.plate + ')');
      if (H1_PLATE_REGION[reg] === t.hub) match++;
    }
    assert(match / tr.length >= 2 / 3, 'only ' + match + ' of ' + tr.length + ' plates carry the region of the truck hub');
    for (const h of ['AST', 'ALA']) assert(tr.some(t => t.hub === h && H1_PLATE_REGION[t.plate.slice(-2)] === h), 'no truck of hub ' + h + ' with the region of ' + h);
  });

  await group('data: fleet composition — reefers with an active cooling unit and at least one van without; target fleet of the baseline is 4 vehicles with exactly one active-cooling body (0.3.11 Автопарк FR-38)', 'ru', async (g, ev) => {
    const tr = ev('S.trucks.map(t=>({id:t.id,model:t.model,cool:t.cool,unit:t.unit,cap:t.cap,zones:t.zones}))');
    assert(tr.length >= 4, 'fleet size ' + tr.length);
    assert(tr.filter(t => t.cool === 'active').length >= 1, 'no truck with active cooling');
    assert(tr.every(t => t.cool !== 'active' || (t.unit && t.unit !== '—')), 'active cooling without a refrigeration unit');
    assert(tr.some(t => /^Van|^Tent/.test(t.model)), 'no van / tent in the fleet');
    assert(tr.every(t => t.cap > 0 && t.zones.length > 0), 'truck without capacity / zones');
    eq(ev('ECO_BL.BLF.reduce((a,f)=>a+f.qty,0)'), 4, 'target fleet of the baseline');
    eq(ev('ECO_CV.length'), 4, 'cost-model vehicles V01..V04');
    eq(ev('ECO_CV.filter(v=>v.unitL>0).length'), 1, 'exactly one target vehicle with an active cooling unit (V01 on R1)');
  });

  await group('data: partner contacts — every partner has its managers with role, name, phone, mobile and masked variants (0.3.11 Данные · контакты 254–275)', 'ru', async (g, ev) => {
    /* 0.3.11: 3 managers per partner; v6 seed (FR-82): 2 persons per partner, numbers masked until an audited reveal */
    const r = ev('S.partners.map(p=>({id:p.id,c:partnerContacts(p)}))');
    assert(r.length >= 15, 'partners ' + r.length);
    const ids = new Set();
    for (const p of r) {
      assert(p.c.length >= 2, p.id + ': contacts ' + p.c.length);
      eq(new Set(p.c.map(c => c.name)).size, p.c.length, p.id + ': the same person twice');
      for (const c of p.c) {
        for (const k of ['id', 'role', 'name', 'tel', 'mob', 'telM', 'mobM']) assert(c[k] && String(c[k]).trim(), p.id + ': contact field ' + k + ' empty');
        assert(!ids.has(c.id), 'duplicate contact id ' + c.id); ids.add(c.id);
        assert(/^\+7 7\d\d\d? ?[\d ]+$/.test(c.tel) || /^\+7 \d{3,4} [\d ]+$/.test(c.tel), c.id + ': landline ' + c.tel);
        assert(/^\+7 7\d\d \d{3} \d{2} \d{2}$/.test(c.mob), c.id + ': mobile ' + c.mob);
        assert(/^\+7 7•• ••• •• \d\d$/.test(c.telM) && c.telM.slice(-2) === c.tel.slice(-2), c.id + ': masked landline ' + c.telM);
        assert(/^\+7 7•• ••• •• \d\d$/.test(c.mobM) && c.mobM.slice(-2) === c.mob.slice(-2), c.id + ': masked mobile ' + c.mobM);
      }
    }
  });

  await group('data: partner contract end «until» is MM.YYYY (or «—» for blocked) and the 3-month renewal reminders on the Partners screen are exactly the partners due (0.3.11 Данные · контакты / FR-26)', 'ru', async (g, ev, w) => {
    const r = ev('S.partners.map(p=>({id:p.id,until:p.until,tier:p.tier}))'), now = ev('({y:NOW.getFullYear(),m:NOW.getMonth()+1})');
    for (const p of r) assert(p.until === '—' || /^(0[1-9]|1[0-2])\.20\d\d$/.test(p.until), p.id + ': contract end ' + p.until);
    const due = r.filter(p => { const m = /^(\d{2})\.(\d{4})$/.exec(p.until); return m && p.tier !== 'blocked' && (+m[2] - now.y) * 12 + (+m[1] - now.m) <= 3; }).map(p => p.id).sort();
    assert(due.length >= 1, 'the demo has at least one contract due within 3 months');
    ev("ACT.setRole({v:'dispatcher'});go('dispatch');ACT.dtab({v:'partners'})");
    const shown = [...w.document.querySelectorAll('[data-partner]')].filter(tr => tr.querySelector('[data-act=ptRenew]')).map(tr => tr.getAttribute('data-partner')).sort();
    eq(shown.join(','), due.join(','), 'renewal reminders vs contracts due');
    ev("ACT.setRole({v:'admin'})");
  });

  await group('data: partner directory — carrier-type partners of tier silver or better exist, ids are PL-/PW- and unique, a carrier is GDP-qualified (0.3.11 FR-45 Партнёры: GarantA, KazExpress, KazGen, SpezAvto)', 'ru', async (g, ev) => {
    /* DATA GAP by design: v6 carries anonymised partner names (PL-01..PL-08, PL-10), not the 0.3.11 carrier names */
    const P = ev('S.partners.map(p=>({id:p.id,type:p.type,tier:p.tier,gdp:p.gdp,name:p.name}))');
    for (const p of P) { assert(/^P[LW]-\d\d$/.test(p.id), 'partner id ' + p.id); assert(p.name && p.name.length > 3, p.id + ': name'); }
    eq(new Set(P.map(p => p.id)).size, P.length, 'duplicate partner ids');
    const lp = P.filter(p => p.type === 'lp');
    assert(lp.length >= 4, 'carriers ' + lp.length);
    assert(lp.filter(p => p.tier === 'gold' || p.tier === 'silver').length >= 2, 'fewer than two carriers of tier silver or better');
    assert(lp.some(p => p.gdp), 'no GDP-qualified carrier');
  });

  await group('data: driver hours stay inside the limits — day, week, year, continuous driving (0.3.11 Данные · персонал, hours part)', 'ru', async (g, ev) => {
    const L = ev('RES.LIM'), r = ev('S.drivers.map(d=>({id:d.id,week:d.week,onDuty:d.onDuty,cont:d.res.cont,year:d.res.year,days:d.res.days,h14:d.res.hours14}))');
    for (const d of r) {
      assert(d.week >= 0 && d.week <= L.week, d.id + ': week ' + d.week + ' h over ' + L.week);
      assert(d.onDuty >= 0 && d.onDuty <= L.dayExt, d.id + ': on duty ' + d.onDuty + ' h over ' + L.dayExt);
      assert(d.cont >= 0 && d.cont <= L.cont, d.id + ': continuous driving ' + d.cont + ' h over ' + L.cont);
      assert(d.year >= 0 && d.year <= L.year, d.id + ': year ' + d.year + ' h over ' + L.year);
      assert(d.h14 == null || d.h14 <= L.twoWeeks, d.id + ': 14-day ' + d.h14 + ' h over ' + L.twoWeeks);
    }
  });

  await group('data: fines — article, positive integer amount in tenge, status from the fine state machine (0.3.11 Данные · штрафы, structure)', 'ru', async (g, ev) => {
    const F = ev('S.res.fines.map(f=>({id:f.id,article:f.article,amount:f.amount,status:f.status}))'), st = ev('Object.keys(RES.FINE_ST)');
    assert(F.length >= 3, 'fines ' + F.length);
    for (const f of F) {
      assert(/КоАП|Code|Verwaltung|ӘҚБтК/i.test(f.article) && f.article.length > 10, f.id + ': article ' + f.article);
      assert(Number.isInteger(f.amount) && f.amount > 0, f.id + ': amount ' + f.amount);
      assert(st.includes(f.status), f.id + ': status ' + f.status);
    }
    eq(new Set(F.map(f => f.id)).size, F.length, 'duplicate fine ids');
  });

  await group('data: every driver assigned to a load holds a licence category valid for the truck (CE for a tractor with trailer) at the ETA (0.3.11 Данные · рейс 49–70)', 'ru', async (g, ev) => {
    const r = ev(`S.loads.filter(l => l.driver && l.truck).map(l => { const t = S.trucks.find(x => x.id === l.truck), d = S.drivers.find(x => x.id === l.driver); const lic = d && d.docs.find(x => x.type === 'lic'); return { id: l.id, eta: String(l.eta).slice(0, 10), cat: d && d.lic, semi: !!(t && /\\+/.test(t.make)), to: lic && lic.to, drv: l.driver }; })`);
    assert(r.length >= 5, 'assigned loads ' + r.length);
    for (const l of r) {
      assert(['C', 'CE'].includes(l.cat), l.id + ': driver ' + l.drv + ' category ' + l.cat);
      if (l.semi) eq(l.cat, 'CE', l.id + ': tractor with trailer needs CE');
      assert(l.to && l.to >= l.eta, l.id + ': licence of ' + l.drv + ' ends ' + l.to + ' before the ETA ' + l.eta);
    }
  });

  await group('baseline: temperature shipments per month 40 / 6 / 6 (with Makinsk), 2–8 °C is 77 % (0.3.11 Fragenkatalog · города 378)', 'ru', async (g, ev) => {
    const s = ev('ECO_BL.BLC.reduce((a,c)=>[a[0]+c.t[0],a[1]+c.t[1],a[2]+c.t[2]],ECO_BL.BLD.makinsk.slice())');
    eq(s.join('/'), '40/6/6', 'temperature split per month'); eq(Math.round(s[0] / (s[0] + s[1] + s[2]) * 100), 77, '2–8 °C share');
    eq(ev('ECO_BL.BLD.tempMon'), 35, 'temperature shipments per month (A1) as shown on the baseline screen');
    for (const c of ev('ECO_BL.BLC')) assert(c.t.every(x => Number.isInteger(x) && x >= 0), c.id + ': temperature split');
  });

  await group('baseline: every ring is assigned to a model of the target fleet that has vehicles, and the south ring exhausts 200 000 km in less than 18 months (0.3.11 Fragenkatalog · парк 390–391, FR-50)', 'ru', async (g, ev) => {
    const R = ev('ECO_BL.BLR'), F = ev('ECO_BL.BLF');
    for (const r of R) { const f = F.find(x => x.id === r.veh); assert(f && f.qty > 0, r.id + ': vehicle model ' + r.veh + ' is not in the target fleet'); }
    const s = R.find(r => r.id === 'S'), months = 200000 / (s.km * s.per) * 12;
    assert(months < 18, 'south ring: 200 000 km in ' + months.toFixed(1) + ' months');
    const rr = ev('ECO_RINGS.find(r=>r.id==="S")'); assert(rr && Math.abs(200000 / (rr.km * rr.per) * 12 - months) < 1e-9, 'cost model ring S differs from the baseline');
  });

  await group('baseline: express is 36,3 % of the outsourcing budget at 8,3 % of the weight, outsourcing 290,4 M ₸/year, express surcharge 88,7 M ₸/year (0.3.11 Fragenkatalog · экономика 392–394)', 'ru', async (g, ev, w) => {
    const d = ev('ECO_BL.BLD'), outs = d.garanta + d.kazexp;
    eq((d.expKg * d.expRate / outs * 100).toFixed(1), '36.3', 'express share of the budget (A2)'); eq((d.expKg / d.kgMon * 100).toFixed(1), '8.3', 'express share of the weight (A2)');
    eq((outs * 12 / 1e6).toFixed(1), '290.4', 'outsourcing per year (G25)');
    eq(((d.expRate - d.ltlRate) * d.expKg * 12 / 1e6).toFixed(1), '88.7', 'express surcharge per year (T140)');
    ev("go('baseline')"); const t = w.document.querySelector('#main-content').innerText;
    assert(/36,3 %/.test(t) && /8,3 % веса/.test(t) && /290,4 млн/.test(t), 'baseline screen shows 36,3 % / 8,3 % / 290,4 млн ₸');
  });

  await group('baseline: the 150 questions are consistent — unique codes A1…T150, every finding and gap points at an existing question, statuses add up (0.3.11 FR-35…51 list in sync with the baseline screen)', 'ru', async (g, ev, w) => {
    const q = ev('ecoQuestions().map(x=>({code:x.code,sec:x.sec,st:x.st}))');
    eq(q.length, 150, 'questions'); eq(new Set(q.map(x => x.code)).size, 150, 'duplicate question codes');
    assert(q.every(x => ['ok', 'dev', 'q', 'gap'].includes(x.st)), 'question status');
    const codes = new Set(q.map(x => x.code)), refs = ev("ECO_BL.BLV.map(v=>[v.id,v.ref]).concat(ECO_BL.BLG.map(x=>['gap',x.ref]))");
    for (const [id, ref] of refs) for (const c of (String(ref).match(/[A-T]\d{1,3}/g) || [])) assert(codes.has(c), id + ': ref ' + c + ' is not a question of the catalogue');
    eq(new Set(ev('ECO_BL.BLV.map(v=>v.id)')).size, ev('ECO_BL.BLV.length'), 'duplicate finding ids');
    ev("go('baseline');ACT.blSub({v:'q'})"); assert(!/Запросы FR-35…51/.test(w.document.querySelector('#main-content').innerText), 'round-3 request list must not be duplicated on the baseline screen');
    eq(w.document.querySelectorAll('[data-q]').length, 150, 'question rows');
  });

  await group('costs: assumption items of the bottom-up summary are marked — source «допущение» and a yellow chip; items from the Fragenkatalog are not (0.3.11 Затраты 435)', 'ru', async (g, ev, w) => {
    const rows = ev('ecoCostCalc().rows.map(r=>({k:r.k,assumption:r.assumption,src:r.src}))');
    assert(rows.filter(r => r.assumption).length >= 5, 'assumption items ' + rows.filter(r => r.assumption).length);
    for (const r of rows) assert(r.assumption === /допущение|Annahme|assumption|болжам/i.test(r.src), r.k + ': source «' + r.src + '» vs assumption flag ' + r.assumption);
    ev("go('billing');ACT.stab({s:'billing',v:'model'});ACT.ecoSub({v:'sum'})");
    const tr = [...w.document.querySelectorAll('#main-content .tcard table tr')].filter(t => /Fragenkatalog|допущение/.test(t.innerText));
    assert(tr.filter(t => /допущение/.test(t.innerText)).length >= 5, 'assumption rows are not marked on the screen');
  });

  await group('data: location directory — every network city has names in four languages, valid coordinates, a coordinate pair; every LOCS entry names a hub (0.3.11 FR-135 Справочник мест 665; KATO checked by the validator only)', 'ru', async (g, ev) => {
    /* v6 LOCS = {code: {n, hub, km}}, KZMAP.CITY = [ru, kk, de, en, lat, lon]; there is no KATO field in the seed (decision: the validator katoVerify is the contract) */
    const city = ev('KZMAP.CITY'), hubs = ev('Object.keys(HUBS)');
    eq(city.length, 23, 'network cities');
    for (const c of city) {
      for (let i = 0; i < 4; i++) assert(typeof c[i] === 'string' && c[i].trim(), c[0] + ': name #' + i + ' empty');
      assert(c[4] > 40 && c[4] < 56 && c[5] > 46 && c[5] < 88, c[0] + ': coordinates ' + c[4] + ',' + c[5] + ' outside Kazakhstan');
    }
    eq(new Set(city.map(c => c[0])).size, city.length, 'duplicate cities');
    const L = ev('Object.entries(LOCS).map(([k,v])=>({k,n:v.n,hub:v.hub,km:v.km}))');
    assert(L.length >= 15, 'locations ' + L.length);
    for (const l of L) { assert(l.n && l.n.trim(), l.k + ': name'); assert(hubs.includes(l.hub), l.k + ': hub ' + l.hub); assert(Number.isFinite(l.km) && l.km >= 0, l.k + ': km ' + l.km); }
    eq(ev('typeof katoVerify'), 'function', 'KATO validator');
  });

  await group('data: manufacturer logos — every registry entry with a logo resolves to an asset file that loads (0.3.11 Производители / Логотипы)', 'ru', async (g, ev) => {
    const srcs = ev("Object.keys(MFRS).filter(k=>MFRS[k].logo).map(k=>[k,mfrSrc(k)])");
    assert(srcs.length >= 6, 'manufacturers with a logo ' + srcs.length);
    for (const [k, src] of srcs) { const r = await fetch(src.replace(/^\//, '')).catch(() => null); assert(r && r.ok, k + ': logo file ' + src + ' does not load'); }
  });
