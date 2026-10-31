/* W3 Records & administration — shared core: tab helper for screens that still have a single body, transliteration of external
   free text for DE/EN (FR-135), tamper-evident audit chain on top of audit() (LH-Q3), small UI helpers, shared stores
   (S.bookings is written by the customer portal of W4 — shape: {id, cust, from, to, zone, pallets, kg, express, insured, value, payer, status, created}). */
(function () {
  /* a screen that was built with one body becomes a list of tabs; the existing body is the first tab (idempotent, other areas may do the same) */
  globalThis.ensureTabs = (id, key, label) => { const sc = SCREENS[id]; if (sc && !sc.tabs) { const body = sc.body; sc.tabs = [{ key, label, body }]; } return SCREENS[id]; };

  /* ---------- transliteration (BGN/PCGN-like, same table as the source platform) ---------- */
  const TL = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', ә: 'a', ғ: 'g', қ: 'q', ң: 'ng', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i', '«': '"', '»': '"' };
  globalThis.TRANSLIT_RULES = TL;
  globalThis.hasCyr = s => /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/.test(String(s));
  globalThis.translit = s => String(s).replace(/[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі«»]/g, ch => { const lo = ch.toLowerCase(), t = TL[lo] == null ? '' : TL[lo]; return ch !== lo && t ? t[0].toUpperCase() + t.slice(1) : t; });
  /* free text from an external source (connector, SMS, phone note): RU/KK as is, DE/EN transliterated with the original on hover */
  globalThis.xt = s => (LI === 1 || LI === 2) ? translit(s) : String(s);
  const XT_LABEL = T('', 'Originaltext (Russisch, nicht übersetzt) – oben in lateinischer Transliteration: ', 'Original text (Russian, not translated) – shown above in Latin transliteration: ', '');
  globalThis.ext = s => (LI === 1 || LI === 2) && hasCyr(s) ? `<span class="xt" data-ext="ext" title="${esc(XT_LABEL + s)}">${esc(translit(s))}</span>` : esc(s);

  /* ---------- tamper-evident audit chain (LH-Q3): every entry carries seq, prev hash and its own hash ---------- */
  const h32 = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(16).padStart(8, '0'); };
  const sig = e => h32([e.prev, e.seq, e.t, e.user, e.role, e.module, e.subject, e.decision, e.reason, e.action || '', e.ip || ''].join('|'));
  globalThis.auditHash = sig;
  const REC = globalThis.REC = { seq: 0 };
  const audit0 = globalThis.audit;
  /* 0.3.11 audit.py: stable dotted action code (auth.login_failed, user.created ...) and the client IP; the demo has one address per user */
  const slug = x => String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  globalThis.auditIp = role => '10.20.4.' + (10 + ROLES.indexOf(role || S.role) * 3 + 4);
  globalThis.audit = (module, subject, decision, reason, code) => { audit0(module, subject, decision, reason); const e = S.audit[0]; e.seq = ++REC.seq; e.role = S.role; e.action = String(code || slug(module) + '.event').slice(0, 64); e.ip = auditIp(S.role); e.prev = S.audit[1] ? S.audit[1].hash : '00000000'; e.hash = sig(e); return e; };
  /* verify oldest -> newest: {ok, checked, brokenAt} */
  globalThis.auditVerify = () => { const rows = S.audit.slice().reverse(); let prev = '00000000'; for (let i = 0; i < rows.length; i++) { const e = rows[i]; if (e.prev !== prev || sig(e) !== e.hash) return { ok: false, checked: i, brokenAt: e.seq }; prev = e.hash; } return { ok: true, checked: rows.length, brokenAt: null }; };

  /* ---------- UI helpers shared by the records tabs ---------- */
  globalThis.RC = { q: '' };   // filter values of the records tabs (data-rc="key")
  document.addEventListener('input', e => { const el = e.target; if (el.dataset && el.dataset.rc) { RC[el.dataset.rc] = el.type === 'checkbox' ? el.checked : el.value; render(); } });
  globalThis.rcSel = (key, label, opts) => `<label>${esc(label)}:</label><select class="select" data-rc="${key}">${opts.map(o => `<option value="${esc(o[0])}"${(RC[key] || '') === o[0] ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
  globalThis.rcTile = (cls, ico, val, label) => `<div class="kpi-tile tint ${cls}"><div><div class="value">${val}</div><div class="label">${esc(label)}</div></div><div class="icon" style="background:var(--${cls});color:#fff;border-radius:50%">${ic(ico, 18)}</div></div>`;
  globalThis.recDl = XP.save;
  globalThis.csvOf = rows => XP.csv(rows);
  globalThis.fval = id => { const e = document.getElementById(id); return e ? (e.type === 'checkbox' ? e.checked : e.value) : ''; };
  globalThis.ALLT = T('Все', 'Alle', 'All', 'Барлығы');
  globalThis.YES = T('Да', 'Ja', 'Yes', 'Иә'); globalThis.NO = T('Нет', 'Nein', 'No', 'Жоқ');
  globalThis.fdtKZ = iso => LF.dtFull(iso);   // Asia/Almaty, not the browser zone (0.3.11 fmtDate)
  globalThis.plusH = (h, base) => new Date((base || NOW).getTime() + h * 3600e3).toISOString();
  globalThis.noteOk = (s, n) => String(s || '').trim().length >= (n || 10);
  IC.mail = '<path d="M3 5h18v14H3z"/><path d="M3 7l9 6 9-6"/>'; IC.shield = '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'; IC.key = '<circle cx="8" cy="14" r="4"/><path d="M11 11l9-8M16 6l2 2M18 4l2 2"/>'; IC.book = '<path d="M4 4h12a2 2 0 012 2v14H6a2 2 0 01-2-2z"/><path d="M4 18a2 2 0 012-2h12"/>'; IC.phone = '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 006 6L16 13l5 2v4a2 2 0 01-2 2A17 17 0 013 5a2 2 0 012-2z"/>'; IC.clock = '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'; IC.list = '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>';
  document.head.insertAdjacentHTML('beforeend', `<style>
.nav-item .nav-n{margin-left:auto}.xt{border-bottom:1px dotted var(--text-faint);cursor:help}
.rec-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.rec-grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}@media(max-width:1100px){.rec-grid,.rec-grid3{grid-template-columns:1fr}}
.rec-card{padding:16px 20px}.rec-card h3{margin:0 0 8px;font-size:15px}.rec-card h5{margin:12px 0 6px}
.rec-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.rec-row.sb{justify-content:space-between}
.lvl3{border-left:4px solid var(--red)}.lvl2{border-left:4px solid var(--yellow)}.lvl1{border-left:4px solid var(--blue)}
.esc-log{font-size:12px;color:var(--text-muted);margin:6px 0 0;padding-left:16px}.esc-log li{margin:2px 0}
.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}.dim td{color:var(--text-muted);font-style:italic}
.rec-form label.fl{margin-bottom:10px}.rec-form .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.rc-doc{background:#fff;border:1px solid var(--border);border-radius:12px;padding:20px 24px;font-size:13px}.rc-doc h4{margin:0 0 8px}.rc-doc table{width:100%;border-collapse:collapse}.rc-doc td{padding:4px 6px;border-bottom:1px solid var(--border)}
.ver-tag{font-size:11px;color:var(--text-faint)}.chg-row{cursor:pointer}.chg-det{background:var(--bg-page);padding:10px 16px;font-size:13px}
.kato{font-family:ui-monospace,monospace;font-size:12px;background:var(--bg-page);padding:1px 6px;border-radius:6px}
.cov{height:8px;border-radius:4px;background:var(--border);overflow:hidden;margin-top:6px}.cov i{display:block;height:100%;background:var(--green)}.cov.gap i{background:var(--red)}
.inp.err{border-color:var(--red)}
</style>`);

  /* ---------- shared store: customer bookings (W3 owns the array, the Bookings tab and the seed; W4 pushes from the portal) ---------- */
  const NEWB = (n, o) => Object.assign({ id: 'BK-26-' + String(n).padStart(6, '0'), cust: 'c1', from: 'AST', to: 'ALA', zone: 'pharma', pallets: 6, kg: 1800, express: false, insured: false, value: 0, payer: null, status: 'new', created: '2026-10-18T09:12:00+05:00', note: '', load: null, hist: [] }, o);
  S.bookings = [
    NEWB(1, { cust: 'c3', from: 'ALA', to: 'AST', zone: 'pharma', pallets: 10, kg: 2900, express: true, insured: true, value: 48000000, created: '2026-10-18T13:48:00+05:00', note: T('Вакцины, термоконтейнеры, нужна подача к 07:00', 'Impfstoffe, Thermoboxen, Bereitstellung bis 07:00', 'Vaccines, thermal containers, vehicle needed by 07:00', 'Вакциналар, термоконтейнерлер, 07:00-ге дейін беру керек') }),
    NEWB(2, { cust: 'c2', from: 'SHY', to: 'ALA', zone: 'chilled', pallets: 20, kg: 7600, created: '2026-10-18T12:05:00+05:00', note: T('Молочная продукция, забор со склада Темирлановское шоссе', 'Molkereiprodukte, Abholung im Lager Temirlanowskoje-Chaussee', 'Dairy products, pickup at the Temirlanovskoye highway warehouse', 'Сүт өнімдері, Темірлан тас жолындағы қоймадан алу') }),
    NEWB(3, { cust: 'c4', from: 'KAR', to: 'AST', zone: 'frozen', pallets: 14, kg: 6900, insured: true, value: 9500000, payer: { company: nm('ТОО «Транс-Экспедитор»'), role: 'agent', bin: '', ref: 'TE-4471', invoiceTo: 'payer' }, created: '2026-10-18T10:30:00+05:00' }),
    NEWB(4, { cust: 'c1', from: 'AST', to: 'KAR', zone: 'pharma', pallets: 4, kg: 1100, express: true, insured: true, value: 12000000, status: 'confirmed', load: 'LD-2026-001855', created: '2026-10-17T16:20:00+05:00', hist: [{ at: '2026-10-17T16:41:00+05:00', st: 'confirmed', who: 'dispatcher' }] }),
    NEWB(5, { cust: 'c5', from: 'AST', to: 'SHY', zone: 'ambient', pallets: 33, kg: 12800, status: 'rejected', created: '2026-10-16T11:00:00+05:00', note: T('Нужен 2-й автопоезд', 'Zweiter Lastzug nötig', 'A second road train is needed', '2-ші автопоезд қажет'), hist: [{ at: '2026-10-16T11:30:00+05:00', st: 'rejected', who: 'dispatcher', why: T('Нет свободной тентованной фуры на дату', 'Kein freier Planen-Lkw zum Termin', 'No free curtain-sider on that date', 'Күнге бос тентті фура жоқ') }] }),
  ];
  globalThis.addBooking = o => { const n = S.bookings.reduce((m, b) => Math.max(m, +b.id.slice(6)), 0) + 1; const b = NEWB(n, Object.assign({ created: clockNow().toISOString() }, o, { status: 'new', load: null, hist: [] })); S.bookings.unshift(b); return b; };
  globalThis.newBookings = () => S.bookings.filter(b => b.status === 'new').length;
})();
