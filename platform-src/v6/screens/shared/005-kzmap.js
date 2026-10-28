/* Kazakhstan network map (shared by Dashboard / Routes): all cities, trunk roads coloured by mobile-coverage class, real projection.
   Data = platform 0.3.9 coverage reference (backend/app/v5/reference/coverage.json, effective class of the fleet SIMs). */
(function () {
  const W = 1000, KX = W / 42, KY = KX / Math.cos(48 * Math.PI / 180), H = Math.round((55.7 - 40.3) * KY);
  const proj = (lat, lon) => [(lon - 46) * KX, (55.7 - lat) * KY];
  const OUTLINE = [[49.0, 46.4], [48.4, 47.4], [47.2, 47.7], [46.6, 48.5], [47.0, 49.2], [46.9, 49.9], [47.6, 50.4], [48.7, 50.6], [49.3, 51.1],
  [50.6, 51.7], [52.4, 51.6], [54.0, 51.1], [55.6, 50.6], [57.2, 51.1], [58.6, 51.1], [59.9, 50.7], [61.4, 50.8], [61.6, 51.4], [60.1, 51.9], [61.0, 52.4],
  [60.8, 52.9], [61.7, 53.3], [61.0, 53.9], [62.5, 54.1], [65.0, 54.6], [65.6, 55.0], [68.2, 55.4], [69.2, 55.4], [70.8, 55.2], [71.2, 54.2], [72.9, 54.1],
  [73.8, 53.7], [75.4, 54.0], [76.6, 54.3], [77.9, 53.3], [78.9, 52.6], [80.1, 51.3], [81.2, 51.0], [82.8, 51.0], [84.2, 50.6], [85.2, 50.1], [86.8, 49.8],
  [87.3, 49.1], [85.6, 48.4], [85.5, 47.1], [83.0, 47.2], [82.3, 45.6], [79.9, 44.9], [80.4, 44.1], [80.2, 42.2], [79.0, 42.8], [77.0, 42.9], [75.6, 42.8],
  [74.2, 43.2], [73.4, 42.5], [71.8, 42.8], [70.9, 42.2], [69.9, 41.3], [69.0, 41.0], [68.6, 40.6], [68.0, 41.0], [66.6, 41.2], [66.0, 42.9], [64.9, 43.7],
  [62.0, 43.5], [61.0, 44.4], [58.6, 45.6], [56.0, 45.0], [56.0, 41.3], [55.4, 41.3], [54.1, 42.3], [52.9, 42.1], [52.4, 42.8], [51.3, 43.2], [50.9, 44.0],
  [50.3, 44.6], [51.3, 45.3], [52.8, 45.4], [53.1, 46.1], [53.0, 46.9], [51.9, 46.9], [50.3, 46.7]];
  /* [ru, kk, en, de, lat, lon] */
  const CITY = [["Астана", "Астана", "Astana", "Astana", 51.1694, 71.4491], ["Караганда", "Қарағанды", "Karaganda", "Karaganda", 49.8047, 73.1094], ["Кокшетау", "Көкшетау", "Kokshetau", "Kokshetau", 53.2833, 69.3833], ["Петропавловск", "Петропавл", "Petropavl", "Petropavl", 54.8667, 69.15], ["Павлодар", "Павлодар", "Pavlodar", "Pavlodar", 52.2873, 76.9674], ["Костанай", "Қостанай", "Kostanay", "Kostanay", 53.2144, 63.6246], ["Актобе", "Ақтөбе", "Aktobe", "Aktobe", 50.2839, 57.167], ["Уральск", "Орал", "Oral", "Oral", 51.2333, 51.3667], ["Атырау", "Атырау", "Atyrau", "Atyrau", 47.1167, 51.8833], ["Актау", "Ақтау", "Aktau", "Aktau", 43.65, 51.16], ["Жезказган", "Жезқазған", "Zhezkazgan", "Zhezkazgan", 47.7833, 67.7667], ["Алматы", "Алматы", "Almaty", "Almaty", 43.2389, 76.8897], ["Талдыкорган", "Талдықорған", "Taldykorgan", "Taldykorgan", 45.0156, 78.3739], ["Тараз", "Тараз", "Taraz", "Taraz", 42.9, 71.3667], ["Шымкент", "Шымкент", "Shymkent", "Shymkent", 42.3417, 69.5901], ["Туркестан", "Түркістан", "Turkistan", "Turkistan", 43.2973, 68.2517], ["Кызылорда", "Қызылорда", "Kyzylorda", "Kyzylorda", 44.8488, 65.4823], ["Семей", "Семей", "Semey", "Semey", 50.4111, 80.2275], ["Усть-Каменогорск", "Өскемен", "Oskemen", "Oskemen", 49.9483, 82.6275], ["Аксу", "Ақсу", "Aksu", "Aksu", 52.0333, 76.9167], ["Хромтау", "Хромтау", "Khromtau", "Khromtau", 50.25, 58.4333], ["Каскелен", "Қаскелең", "Kaskelen", "Kaskelen", 43.2, 76.6167], ["Сарыагаш", "Сарыағаш", "Saryagash", "Saryagash", 41.45, 69.1667]];
  /* [id, from(ru), to(ru), km, [[fromKm, toKm, class]]] */
  const SEG = [["AST-KAR", "Астана", "Караганда", 215, [[0, 215, "4g"]]], ["KAR-ALM", "Караганда", "Алматы", 1000, [[0, 110, "4g"], [110, 150, "3g"], [150, 240, "none"], [240, 380, "3g"], [380, 400, "4g"], [400, 560, "2g"], [560, 700, "none"], [700, 850, "2g"], [850, 930, "3g"], [930, 1000, "4g"]]], ["KAR-ZHE", "Караганда", "Жезказган", 540, [[0, 80, "4g"], [80, 200, "3g"], [200, 330, "none"], [330, 460, "2g"], [460, 540, "4g"]]], ["AST-KOK", "Астана", "Кокшетау", 300, [[0, 300, "4g"]]], ["KOK-PET", "Кокшетау", "Петропавловск", 190, [[0, 60, "4g"], [60, 140, "3g"], [140, 190, "4g"]]], ["PET-KOS", "Петропавловск", "Костанай", 400, [[0, 60, "4g"], [60, 180, "3g"], [180, 260, "2g"], [260, 340, "3g"], [340, 400, "4g"]]], ["AST-KOS", "Астана", "Костанай", 700, [[0, 60, "4g"], [60, 230, "3g"], [230, 260, "4g"], [260, 380, "2g"], [380, 400, "3g"], [400, 520, "none"], [520, 620, "2g"], [620, 700, "4g"]]], ["KOS-AKT", "Костанай", "Актобе", 820, [[0, 150, "4g"], [150, 210, "3g"], [210, 390, "none"], [390, 560, "2g"], [560, 700, "3g"], [700, 820, "4g"]]], ["AKT-KHR", "Актобе", "Хромтау", 142, [[0, 60, "4g"], [60, 110, "3g"], [110, 142, "4g"]]], ["KHR-URA", "Хромтау", "Уральск", 570, [[0, 100, "3g"], [100, 200, "2g"], [200, 310, "none"], [310, 450, "2g"], [450, 520, "3g"], [520, 570, "4g"]]], ["URA-ATY", "Уральск", "Атырау", 500, [[0, 60, "4g"], [60, 200, "2g"], [200, 300, "none"], [300, 420, "3g"], [420, 500, "4g"]]], ["ATY-AKU", "Атырау", "Актау", 900, [[0, 50, "4g"], [50, 230, "3g"], [230, 260, "4g"], [260, 380, "2g"], [380, 420, "3g"], [420, 620, "none"], [620, 750, "2g"], [750, 800, "3g"], [800, 900, "4g"]]], ["ALM-KAS", "Алматы", "Каскелен", 30, [[0, 30, "4g"]]], ["KAS-TAR", "Каскелен", "Тараз", 500, [[0, 60, "4g"], [60, 200, "3g"], [200, 260, "4g"], [260, 330, "3g"], [330, 380, "3g"], [380, 500, "4g"]]], ["TAR-SHY", "Тараз", "Шымкент", 180, [[0, 180, "4g"]]], ["SHY-TUR", "Шымкент", "Туркестан", 165, [[0, 165, "4g"]]], ["TUR-KYZ", "Туркестан", "Кызылорда", 280, [[0, 40, "4g"], [40, 150, "3g"], [150, 210, "2g"], [210, 280, "4g"]]], ["SHY-SAR", "Шымкент", "Сарыагаш", 120, [[0, 120, "4g"]]], ["ALM-TAL", "Алматы", "Талдыкорган", 260, [[0, 80, "4g"], [80, 150, "3g"], [150, 200, "3g"], [200, 260, "4g"]]], ["AST-PAV", "Астана", "Павлодар", 440, [[0, 80, "4g"], [80, 180, "3g"], [180, 250, "2g"], [250, 330, "4g"], [330, 440, "4g"]]], ["PAV-AKS", "Павлодар", "Аксу", 50, [[0, 50, "4g"]]], ["AKS-SEM", "Аксу", "Семей", 330, [[0, 60, "3g"], [60, 150, "2g"], [150, 230, "none"], [230, 300, "3g"], [300, 330, "4g"]]], ["SEM-UKA", "Семей", "Усть-Каменогорск", 200, [[0, 70, "4g"], [70, 110, "3g"], [110, 200, "4g"]]], ["KYZ-ZHE", "Кызылорда", "Жезказган", 430, [[0, 40, "4g"], [40, 120, "2g"], [120, 340, "none"], [340, 400, "2g"], [400, 430, "4g"]]]];
  const CLS = { '4g': '#2e9e5b', '3g': '#9bbf4f', '2g': '#e8a02c', none: '#d0312d' };
  const cname = c => T(c[0], c[3], c[2], c[1]);
  const byRu = {}; CITY.forEach(c => { byRu[c[0]] = c; });
  const xy = ru => proj(byRu[ru][4], byRu[ru][5]);
  /* hub key -> city (ru) */
  const HUB_CITY = { AST: 'Астана', ALA: 'Алматы', KAR: 'Караганда', SHY: 'Шымкент', ATY: 'Атырау' };
  /* shortest road path between two cities over the SEG graph -> {pts:[[x,y]], cum:[km], total} */
  const adj = {}; SEG.forEach(s => { (adj[s[1]] = adj[s[1]] || []).push([s[2], s[3]]); (adj[s[2]] = adj[s[2]] || []).push([s[1], s[3]]); });
  const memo = {};
  function roadPath(a, b) {
    const key = a + '>' + b; if (memo[key]) return memo[key];
    const d = { [a]: 0 }, prev = {}, todo = new Set(Object.keys(adj));
    while (todo.size) { let u = null; todo.forEach(k => { if (d[k] !== undefined && (u === null || d[k] < d[u])) u = k; }); if (u === null || u === b) break; todo.delete(u); (adj[u] || []).forEach(([v, km]) => { if (d[v] === undefined || d[u] + km < d[v]) { d[v] = d[u] + km; prev[v] = u; } }); }
    const names = [b]; while (names[0] !== a && prev[names[0]]) names.unshift(prev[names[0]]);
    const pts = names.map(xy), cum = names.map(n => d[n] || 0);
    return (memo[key] = { pts, cum, total: cum[cum.length - 1] || 1, names });
  }
  /* point at share p (0…1) of the way along the road path */
  function along(path, p) {
    const t = path.total * Math.max(0, Math.min(1, p));
    for (let i = 1; i < path.pts.length; i++) if (t <= path.cum[i] || i === path.pts.length - 1) { const span = path.cum[i] - path.cum[i - 1] || 1, f = Math.max(0, Math.min(1, (t - path.cum[i - 1]) / span)); return [path.pts[i - 1][0] + (path.pts[i][0] - path.pts[i - 1][0]) * f, path.pts[i - 1][1] + (path.pts[i][1] - path.pts[i - 1][1]) * f]; }
    return path.pts[0];
  }
  const hubPath = (a, b) => roadPath(HUB_CITY[a], HUB_CITY[b]);
  const hubXY = k => xy(HUB_CITY[k]);
  /* label offsets (dx, dy, anchor) where cities are close together */
  const LBL = { 'Каскелен': [-8, 14, 'end'], 'Алматы': [8, 4, 'start'], 'Сарыагаш': [-8, 12, 'end'], 'Шымкент': [8, 10, 'start'], 'Туркестан': [-8, -6, 'end'], 'Аксу': [8, 12, 'start'], 'Павлодар': [8, -4, 'start'],
    'Хромтау': [8, 12, 'start'], 'Актобе': [-8, -6, 'end'], 'Петропавловск': [8, -2, 'start'], 'Караганда': [10, 18, 'start'], 'Астана': [10, -8, 'start'] };
  /* static layer: outline + roads + cities. `k` scales strokes/labels for zoomed views; hubs = keys of HUB_CITY drawn as squares */
  function kzmapBase(k, o) {
    k = k || 1; o = o || {};
    const pts = OUTLINE.map(([lo, la]) => proj(la, lo).map(v => v.toFixed(1)).join(',')).join(' ');
    const hubs = new Set(Object.values(HUB_CITY));
    const roads = o.roads === false ? '' : SEG.map(s => { const a = xy(s[1]), b = xy(s[2]); return s[4].map(st => { const f0 = st[0] / s[3], f1 = st[1] / s[3], bad = st[2] === 'none' || st[2] === '2g';
      return `<line x1="${(a[0] + (b[0] - a[0]) * f0).toFixed(1)}" y1="${(a[1] + (b[1] - a[1]) * f0).toFixed(1)}" x2="${(a[0] + (b[0] - a[0]) * f1).toFixed(1)}" y2="${(a[1] + (b[1] - a[1]) * f1).toFixed(1)}" stroke="${CLS[st[2]]}" stroke-width="${(bad ? 6 : 4) * k}" stroke-linecap="round"${st[2] === 'none' ? ` stroke-dasharray="${8 * k} ${5 * k}"` : ''}/>`; }).join(''); }).join('');
    const cities = CITY.map(c => { const [x, y] = proj(c[4], c[5]), l = LBL[c[0]] || [8, -6, 'start'], hub = hubs.has(c[0]);
      return `<g class="kzcity" data-city="${esc(c[0])}">${hub ? `<rect x="${x - 7 * k}" y="${y - 7 * k}" width="${14 * k}" height="${14 * k}" fill="#173a5e" stroke="#fff" stroke-width="${2 * k}"/>` : `<circle cx="${x}" cy="${y}" r="${4.5 * k}" fill="#fff" stroke="#3a4656" stroke-width="${2 * k}"/>`}<text x="${x + l[0] * k}" y="${y + l[1] * k}" text-anchor="${l[2]}" class="kzcity-lbl${hub ? ' hub' : ''}" style="font-size:${(hub ? 15 : 12.5) * k}px">${esc(cname(c))}</text></g>`; }).join('');
    return `<polygon points="${pts}" fill="#eef3fa" stroke="#c4cedb" stroke-width="${1.2 * k}" stroke-dasharray="${4 * k} ${3 * k}"/>${roads}${cities}`;
  }
  const legend = () => `<div class="kzlegend">${[['4g', '4G'], ['3g', '3G'], ['2g', T('2G: голос/SMS', '2G: Sprache/SMS', '2G: voice/SMS', '2G: дауыс/SMS')], ['none', T('нет сети', 'kein Netz', 'no network', 'байланыс жоқ')]].map(x => `<span><i style="background:${CLS[x[0]]}"></i>${esc(x[1])}</span>`).join('')}</div>`;
  /* ---- schematic network (hybrid map: Dashboard + Routes & Tracking): hubs as gold dots with «ХАБ» tags, trunk / regional / offline roads,
     offline cities as hollow red rings. Positions are schematic, in picture units (1103 x 662), not to scale. The picture is fitted to the
     geographic outline (KZMAP) by least squares over these cities, so the country silhouette sits behind the network. ---- */
  const NW = 1103, NH = 662, NCOL = '#1b6b7a', OFF = '#d0312d', HUBC = '#c9962f';
  const NN = {   /* city ru -> [x, y] (+ 1 = no mobile network) */
    'Астана': [665, 203], 'Алматы': [839, 499], 'Петропавловск': [604, 59], 'Кокшетау': [611, 121], 'Макинск': [637, 146, 1],
    'Костанай': [475, 123], 'Павлодар': [795, 146], 'Аксу': [796, 156], 'Семей': [886, 206], 'Усть-Каменогорск': [948, 213],
    'Караганда': [710, 253], 'Жезказган': [573, 339, 1], 'Уральск': [171, 163], 'Актобе': [308, 225], 'Хромтау': [340, 230],
    'Атырау': [153, 326], 'Актау': [105, 455], 'Кызылорда': [513, 454], 'Туркестан': [591, 515], 'Шымкент': [631, 552],
    'Тараз': [681, 527], 'Сарыагаш': [619, 588], 'Каскелен': [805, 514], 'Талдыкорган': [871, 424] };
  /* [a, b, kind]: s solid regional · d dashed regional · t trunk · o no network (dotted red) */
  const NE = [['Астана', 'Кокшетау', 's'], ['Кокшетау', 'Петропавловск', 's'], ['Петропавловск', 'Костанай', 'd'], ['Астана', 'Костанай', 's'],
    ['Костанай', 'Актобе', 'd'], ['Актобе', 'Хромтау', 'd'], ['Хромтау', 'Астана', 'd'], ['Актобе', 'Уральск', 'd'], ['Уральск', 'Атырау', 'd'],
    ['Атырау', 'Актау', 's'], ['Актобе', 'Атырау', 'd'], ['Астана', 'Караганда', 't'], ['Караганда', 'Алматы', 't'], ['Караганда', 'Жезказган', 'o'],
    ['Астана', 'Павлодар', 'd'], ['Павлодар', 'Аксу', 'd'], ['Аксу', 'Семей', 'd'], ['Павлодар', 'Семей', 'd'], ['Астана', 'Семей', 'd'],
    ['Семей', 'Усть-Каменогорск', 's'], ['Кызылорда', 'Туркестан', 's'], ['Туркестан', 'Шымкент', 'd'], ['Шымкент', 'Тараз', 'd'],
    ['Тараз', 'Каскелен', 'd'], ['Каскелен', 'Алматы', 'd'], ['Алматы', 'Талдыкорган', 'd'], ['Шымкент', 'Сарыагаш', 'd']];
  /* label offsets [dx, dy, anchor] */
  const NLAB = { 'Астана': [14, -8, 'start'], 'Алматы': [14, -8, 'start'], 'Караганда': [10, 18, 'start'], 'Костанай': [-8, -6, 'end'], 'Актобе': [-8, -6, 'end'],
    'Уральск': [-8, -6, 'end'], 'Атырау': [-8, -6, 'end'], 'Актау': [-8, 4, 'end'], 'Кызылорда': [-8, -6, 'end'], 'Туркестан': [-8, -6, 'end'],
    'Шымкент': [-8, 14, 'end'], 'Тараз': [-8, 16, 'end'], 'Каскелен': [-6, 20, 'end'], 'Сарыагаш': [8, 12, 'start'], 'Жезказган': [-8, -6, 'end'],
    'Семей': [-8, -8, 'end'], 'Аксу': [8, 12, 'start'], 'Усть-Каменогорск': [8, 4, 'start'], 'Талдыкорган': [8, -4, 'start'] };
  const nm = ru => { const row = CITY.find(c => c[0] === ru); return row ? cname(row) : T(ru, 'Makinsk', 'Makinsk', ru); };
  const hubTag = ru => ru === 'Астана' ? T('ХАБ «СЕВЕР»', 'HUB «NORD»', 'HUB NORTH', 'ХАБ «СОЛТҮСТІК»') : T('ХАБ «ЮГ»', 'HUB «SÜD»', 'HUB SOUTH', 'ХАБ «ОҢТҮСТІК»');
  const dist = (a, b) => Math.hypot(NN[a][0] - NN[b][0], NN[a][1] - NN[b][1]);
  /* least squares fit of the picture to the geographic projection: outline + roads sit behind the cities */
  const fit = (u, v) => { const n = u.length, mu = u.reduce((s, x) => s + x, 0) / n, mv = v.reduce((s, x) => s + x, 0) / n;
    let num = 0, den = 0; u.forEach((x, i) => { num += (x - mu) * (v[i] - mv); den += (x - mu) * (x - mu); }); const b = num / den; return x => mv + b * (x - mu); };
  const fitPairs = Object.keys(NN).filter(r => CITY.some(c => c[0] === r));
  const fx = fit(fitPairs.map(r => xy(r)[0]), fitPairs.map(r => NN[r][0])), fy = fit(fitPairs.map(r => xy(r)[1]), fitPairs.map(r => NN[r][1]));
  const toNet = p => [fx(p[0]), fy(p[1])];
  const SILH = OUTLINE.map(([lo, la]) => toNet(proj(la, lo)).map(v => v.toFixed(1)).join(',')).join(' ');
  /* road class of an edge: dominant class of the matching SEG stretch (coverage reference), default 4G */
  const segMemo = {};
  function segClass(a, b) { const key = [a, b].sort().join('|'); if (segMemo[key]) return segMemo[key];
    const km = {}; SEG.filter(s => (s[1] === a && s[2] === b) || (s[1] === b && s[2] === a)).forEach(s => s[4].forEach(st => { km[st[2]] = (km[st[2]] || 0) + st[1] - st[0]; }));
    return (segMemo[key] = Object.keys(km).sort((x, y) => km[y] - km[x])[0] || '4g'); }
  const nadj = {}; NE.forEach(([a, b]) => { (nadj[a] = nadj[a] || []).push([b, dist(a, b)]); (nadj[b] = nadj[b] || []).push([a, dist(a, b)]); });
  const pmemo = {};
  /* shortest path over the schematic graph -> {pts, cum, total, names}, same shape as KZMAP.roadPath */
  function netPath(a, b) {
    const key = a + '>' + b; if (pmemo[key]) return pmemo[key];
    const d = { [a]: 0 }, prev = {}, todo = new Set(Object.keys(nadj));
    while (todo.size) { let u = null; todo.forEach(k => { if (d[k] !== undefined && (u === null || d[k] < d[u])) u = k; }); if (u === null || u === b) break; todo.delete(u);
      (nadj[u] || []).forEach(([v, km]) => { if (d[v] === undefined || d[u] + km < d[v]) { d[v] = d[u] + km; prev[v] = u; } }); }
    const names = [b]; while (names[0] !== a && prev[names[0]]) names.unshift(prev[names[0]]);
    const pts = names.map(n => NN[n].slice(0, 2)), cum = [0]; for (let i = 1; i < names.length; i++) cum.push(cum[i - 1] + dist(names[i - 1], names[i]));
    return (pmemo[key] = { pts, cum, total: cum[cum.length - 1] || 1, names });
  }
  function netAlong(path, p) {
    const t = path.total * Math.max(0, Math.min(1, p));
    for (let i = 1; i < path.pts.length; i++) if (t <= path.cum[i] || i === path.pts.length - 1) { const span = path.cum[i] - path.cum[i - 1] || 1, f = Math.max(0, Math.min(1, (t - path.cum[i - 1]) / span)); return [path.pts[i - 1][0] + (path.pts[i][0] - path.pts[i - 1][0]) * f, path.pts[i - 1][1] + (path.pts[i][1] - path.pts[i - 1][1]) * f]; }
    return path.pts[0];
  }
  const netHubPath = (a, b) => netPath(HUB_CITY[a], HUB_CITY[b]);
  /* o.classes: roads coloured by mobile-coverage class (Routes); otherwise one network colour (Dashboard) */
  function netBase(k, o) {
    k = k || 1; o = o || {};
    const roads = NE.map(([a, b, kind]) => { const p = NN[a], q = NN[b], off = kind === 'o';
      const col = o.classes ? CLS[off ? 'none' : segClass(a, b)] : off ? OFF : NCOL, w = kind === 't' ? 7 : off ? 2.6 : 3.6;
      const dash = kind === 'd' ? `${6 * k} ${5 * k}` : off ? `${1.5 * k} ${6 * k}` : '';
      return `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="${col}" stroke-width="${w * k}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`; }).join('');
    const cities = Object.keys(NN).map(ru => { const [x, y, off] = NN[ru], hub = ru === 'Астана' || ru === 'Алматы', lab = NLAB[ru] || [8, -6, 'start'];
      const dot = hub ? `<circle cx="${x}" cy="${y}" r="${9 * k}" fill="${HUBC}" stroke="#fff" stroke-width="${2 * k}"/>`
        : off ? `<circle cx="${x}" cy="${y}" r="${5.5 * k}" fill="#fff" stroke="${OFF}" stroke-width="${2.4 * k}"/>`
          : `<circle cx="${x}" cy="${y}" r="${4.5 * k}" fill="#fff" stroke="${NCOL}" stroke-width="${2 * k}"/>`;
      const tag = hub ? `<text x="${x + lab[0] * k}" y="${y + lab[1] * k + 14 * k}" text-anchor="${lab[2]}" font-size="${10 * k}" font-weight="700" fill="#b07d2b">${esc(hubTag(ru))}</text>` : '';
      return `<g class="kzcity" data-city="${esc(ru)}">${dot}<text x="${x + lab[0] * k}" y="${y + lab[1] * k}" text-anchor="${lab[2]}" font-size="${(hub ? 14 : 12) * k}" font-weight="${hub ? 700 : 500}" fill="#173a5e">${esc(nm(ru))}</text>${tag}</g>`; }).join('');
    return `<polygon points="${SILH}" fill="#eef3fa" stroke="#c4cedb" stroke-width="${1.2 * k}" stroke-dasharray="${4 * k} ${3 * k}"/>${roads}${cities}`;
  }
  /* legend: coverage classes (Routes) or the schematic key (Dashboard) */
  const netLegend = classes => classes ? legend() : `<div class="kzlegend"><span><i style="background:${HUBC};height:10px;width:10px;border-radius:50%"></i>${esc(T('хаб', 'Hub', 'hub', 'хаб'))}</span><span><i style="background:${NCOL}"></i>${esc(T('маршрут', 'Strecke', 'route', 'бағыт'))}</span><span><i style="background:#fff;border:2px solid ${OFF};height:8px;width:8px;border-radius:50%"></i>${esc(T('нет сети', 'kein Netz', 'no network', 'байланыс жоқ'))}</span></div>`;
  window.KZNET = { W: NW, H: NH, base: netBase, hubPath: netHubPath, along: netAlong, legend: netLegend, CLS };
  /* SEG / CITY / xy / cname / roadPath / HUB_CITY are exported for the Coverage tab (FR-111), which draws its own road layer on the same base */
  window.KZMAP = { W, H, proj, base: kzmapBase, hubXY, hubPath, along, legend, CLS, SEG, CITY, xy, cname, roadPath, HUB_CITY };
})();
