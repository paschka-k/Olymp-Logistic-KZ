/* S2 · Delivery: FR-223 What's new panel, FR-224 print / PDF (A4), FR-225 offline demo (service worker registration), FR-196 WebP logos.
   Hooks used by core.js: wnLink() (sidebar version line), printHead() (print-only header in <main>), printBtn() (top bar, behind "⋯" on narrow windows).
   Build side: platform-src/delivery.mjs (TRACEABILITY.md -> @@WHATSNEW@@, assets/manifest.json, sw.js). Tests: platform-src/tests/f0-delivery.js. */
(() => {
  /* ---------- FR-223 What's new: releases and streams generated from docs/TRACEABILITY.md at build time ---------- */
  const WN = @@WHATSNEW@@;
  const WN_T = {
    W1: T('Операционный поток: погрузка, отгрузки, документы', 'Operativer Ablauf: Beladung, Sendungen, Dokumente', 'Operations flow: loading, shipments, documents', 'Операциялық ағын: тиеу, жөнелтімдер, құжаттар'),
    W2: T('Ресурсы и приложение водителя', 'Ressourcen und Fahrer-App', 'Resources and driver app', 'Ресурстар және жүргізуші қосымшасы'),
    W3: T('Журналы и администрирование', 'Register und Administration', 'Records and administration', 'Журналдар және әкімшілендіру'),
    W4: T('Клиенты и порталы', 'Kunden und Portale', 'Customers and portals', 'Клиенттер мен порталдар'),
    W5: T('Экономика, отчёты и исходные данные', 'Wirtschaftlichkeit, Berichte und Basisdaten', 'Economics, reports and baseline data', 'Экономика, есептер және бастапқы деректер'),
    W6: T('Справка и языки', 'Hilfe und Sprachen', 'Help and languages', 'Анықтама және тілдер'),
    P1: T('Погрузка и вес: паритет с 0.3.10', 'Beladung und Gewicht: Parität mit 0.3.10', 'Load and weight: parity with 0.3.10', 'Тиеу және салмақ: 0.3.10 паритеті'),
    P2: T('Обзор, диспетчер, рейсы, документы', 'Übersicht, Disposition, Fahrten, Dokumente', 'Dashboard, dispatcher, trips, documents', 'Шолу, диспетчер, рейстер, құжаттар'),
    P3: T('Маршруты: паритет с 0.3.10', 'Routen: Parität mit 0.3.10', 'Routes: parity with 0.3.10', 'Маршруттар: 0.3.10 паритеті'),
    P4: T('Автопарк, персонал, партнёры', 'Fuhrpark, Personal, Partner', 'Fleet, staff, partners', 'Автопарк, персонал, серіктестер'),
    P5: T('Отчёты, затраты, качество', 'Berichte, Kosten, Qualität', 'Reports, costs, quality', 'Есептер, шығындар, сапа'),
    P6: T('Оболочка: поиск, тревоги, вход', 'Rahmen: Suche, Alarme, Anmeldung', 'Shell: search, alarms, sign-in', 'Қабық: іздеу, дабылдар, кіру'),
    Q1: T('Анимированные схемы в справке', 'Animierte Hilfediagramme', 'Animated help diagrams', 'Анықтамадағы анимациялық сызбалар'),
    Q2: T('Единый язык интерфейса', 'Einheitliche Oberflächensprache', 'One UI language', 'Интерфейс тілінің біркелкілігі'),
    Q3: T('Пояснения на экранах', 'Erläuterungen auf den Screens', 'Explanatory notes on screens', 'Экрандардағы түсіндірмелер'),
    Q4: T('Узкие окна и телефоны', 'Schmale Fenster und Telefone', 'Narrow windows and phones', 'Тар терезелер мен телефондар'),
    R1: T('Сверка с 0.3.9: операции', 'Abgleich mit 0.3.9: Betrieb', 'Mirror of 0.3.9: operations', '0.3.9 салыстыру: операциялар'),
    R2: T('Сверка с 0.3.9: ресурсы и экономика', 'Abgleich mit 0.3.9: Ressourcen und Wirtschaftlichkeit', 'Mirror of 0.3.9: resources and economics', '0.3.9 салыстыру: ресурстар және экономика'),
    R3: T('Приёмка на хабе (I-1…I-7)', 'Hub-Wareneingang (I-1…I-7)', 'Hub inbound (I-1…I-7)', 'Хабта қабылдау (I-1…I-7)'),
    R4: T('SLA, зимние правила, экспресс, представления', 'SLA, Winterregeln, Express, Ansichten', 'SLA, winter rules, express overlap, views', 'SLA, қысқы ережелер, экспресс, көріністер'),
    R5: T('Идеи: водитель, партнёр, сеть', 'Ideen: Fahrer, Partner, Netz', 'Driver, partner and network ideas', 'Идеялар: жүргізуші, серіктес, желі'),
    S1: T('CI и тестовая инфраструктура', 'CI und Testinfrastruktur', 'CI and test infrastructure', 'CI және тест инфрақұрылымы'),
    S2: T('Поставка: ресурсы, «Что нового», печать, офлайн', 'Auslieferung: Assets, Neuigkeiten, Druck, offline', 'Delivery: assets, what\'s new, print, offline', 'Жеткізу: ресурстар, «Не жаңа», басып шығару, офлайн'),
    S3: T('Доступность', 'Barrierefreiheit', 'Accessibility', 'Қолжетімділік'),
    S4: T('Архитектура', 'Architektur', 'Architecture', 'Архитектура'),
    S5: T('Производительность', 'Performance', 'Performance', 'Өнімділік'),
    S6: T('Удобство работы', 'Bedienkomfort', 'User experience', 'Пайдаланушы тәжірибесі'),
  };
  const WN_R = {
    next: T('Изменения после последнего выпуска (в разработке).', 'Änderungen seit der letzten Version (in Arbeit).', 'Changes since the last release (in progress).', 'Соңғы шығарылымнан кейінгі өзгерістер (әзірленуде).'),
    '6.2.1': T('Исправление: списки выбора не выходят за край контейнера (узкие окна).', 'Korrektur: Auswahllisten ragen nicht mehr über ihren Container (schmale Fenster).', 'Fix: selects never grow past their container (narrow windows).', 'Түзету: таңдау тізімдері контейнерден шықпайды (тар терезелер).'),
    '6.2.0': T('Паритет с 0.3.10 (P1–P6), анимированные схемы, единый язык, пояснения, узкие окна, логотипы.', 'Parität mit 0.3.10 (P1–P6), animierte Diagramme, einheitliche Sprache, Erläuterungen, schmale Fenster, Logos.', 'Parity with 0.3.10 (P1–P6), animated diagrams, one UI language, explanatory notes, narrow windows, logos.', '0.3.10 паритеті (P1–P6), анимациялық сызбалар, бір тіл, түсіндірмелер, тар терезелер, логотиптер.'),
    '6.1.0': T('Бренд Kökzhol, реальные логотипы, хаб Атырау-Запад, порталы и справка в один клик; потоки W1–W6.', 'Marke Kökzhol, echte Logos, Hub Atyrau-West, Portale und Hilfe mit einem Klick; Streams W1–W6.', 'Kökzhol brand, real logos, Atyrau-West hub, portals and help one click away; streams W1–W6.', 'Kökzhol бренді, нақты логотиптер, Атырау-Батыс хабы, порталдар мен анықтама бір басуда; W1–W6 ағындары.'),
    '6.0.0': T('Основа v6: новая структура, вкладки, роли, справка, автотесты.', 'Grundlage v6: neue Struktur, Tabs, Rollen, Hilfe, Autotests.', 'v6 foundation: new layout, tabs, roles, help, automated tests.', 'v6 негізі: жаңа құрылым, қойындылар, рөлдер, анықтама, автотесттер.'),
  };
  const CYR = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/;
  /* a stream without a translation shows its TRACEABILITY heading — never Cyrillic in DE / EN */
  const wnTitle = s => WN_T[s.k] || (LI === 1 || LI === 2 ? (CYR.test(s.h) ? s.k || '—' : s.h) : s.h);
  /* the "next" block becomes the current version once VERSION is bumped but whatsnew.json still lacks it */
  const relLabel = r => r.v === 'next' ? (WN.releases.some(x => x.v === VERSION) ? T('Следующий выпуск', 'Nächste Version', 'Next release', 'Келесі шығарылым') : 'v' + VERSION) : 'v' + r.v;
  const isCur = r => r.v === VERSION || (r.v === 'next' && !WN.releases.some(x => x.v === VERSION));
  const SEEN = 'kokzhol.v6.whatsnew.seen';
  const seen = () => { try { return localStorage.getItem(SEEN); } catch (_) { return null; } };
  const markSeen = () => { try { localStorage.setItem(SEEN, VERSION); } catch (_) { /* private mode */ } };
  globalThis.WHATSNEW = WN;
  globalThis.wnTitle = wnTitle;
  globalThis.wnLink = () => `<a class="wn-link" data-act="whatsNew" role="button" tabindex="0" title="${esc(T('Что нового в этой версии', 'Neu in dieser Version', 'What is new in this version', 'Бұл нұсқада не жаңа'))}">✦ ${esc(T('Что нового', 'Neuigkeiten', 'What\'s new', 'Не жаңа'))}${seen() === VERSION ? '' : '<i class="wn-dot" aria-hidden="true"></i>'}</a>`;
  const nFn = n => n + ' ' + T('функц.', 'Funktionen', n === 1 ? 'function' : 'functions', 'функц.');
  DRAWERS.whatsNew = () => {
    const rels = WN.releases.map(r => ({ r, list: WN.streams.filter(s => s.v === r.v).sort((a, b) => a.k.localeCompare(b.k, 'en', { numeric: true })) }));
    const html = `<div class="drawer-section wn">
<p class="note">${esc(T('Изменения по версиям. Список собирается при сборке из таблицы трассируемости (docs/TRACEABILITY.md): поток, число функций и FR.', 'Änderungen je Version. Die Liste entsteht beim Build aus der Rückverfolgbarkeitstabelle (docs/TRACEABILITY.md): Stream, Anzahl Funktionen und FR.', 'Changes per version. The list is built from the traceability table (docs/TRACEABILITY.md): stream, number of functions and FRs.', 'Нұсқалар бойынша өзгерістер. Тізім құрастыру кезінде бақылау кестесінен (docs/TRACEABILITY.md) жиналады: ағын, функциялар саны және FR.'))}</p>
<div class="wn-links"><a class="btn grey sm" href="../versions.html" target="_blank" rel="noopener" data-wn-versions>${esc(T('Все версии', 'Alle Versionen', 'All versions', 'Барлық нұсқалар'))} ↗</a><button type="button" class="btn grey sm" data-act="go" data-v="changes">${esc(T('Реестр изменений', 'Änderungsregister', 'Change register', 'Өзгерістер тізілімі'))}</button></div>
${rels.map(({ r, list }) => `<section class="wn-rel" data-wn-rel="${esc(r.v)}"><h3>${esc(relLabel(r))}${isCur(r) ? ` <span class="chip green">${esc(T('текущая', 'aktuell', 'current', 'ағымдағы'))}</span>` : ''}${r.date ? ` <small>${esc(fd(r.date))}</small>` : ''}</h3>
<p>${esc(WN_R[r.v] || '')}</p>${list.length ? `<ul>${list.map(s => `<li data-wn-stream="${esc(s.k)}"><b>${esc(s.k)}</b> ${esc(wnTitle(s))} <small>· ${esc(nFn(s.rows))}${s.frs.length ? ' · ' + esc(s.frs.slice(0, 6).join(', ')) + (s.frs.length > 6 ? ' +' + (s.frs.length - 6) : '') : ''}</small></li>`).join('')}</ul>` : ''}</section>`).join('')}
<p class="note" data-wn-offline>${esc(swNote())}</p></div>`;
    return { title: T('Что нового', 'Neuigkeiten', 'What\'s new', 'Не жаңа') + ' · v' + VERSION, html };
  };
  Object.assign(ACT, { whatsNew: () => { markSeen(); openDrawer({ type: 'whatsNew' }); } });
  /* deep link from versions.html: ?whatsnew=1 opens the panel */
  try { if (/[?&]whatsnew=1\b/.test(location.search)) { markSeen(); S.drawer = { type: 'whatsNew' }; } } catch (_) { /* no location */ }

  /* ---------- FR-224 print / PDF: A4, print-only header (brand, screen › tab, date, version, role), no navigation (app.css @media print) ---------- */
  globalThis.printHead = () => {
    const sc = SCREENS[S.route], tab = sc && sc.tabs ? curTab(S.route) : null, now = new Date();
    return `<div class="print-head" aria-hidden="true"><span class="ph-brand"><b>Kökzhol</b> · Olymp Logistic KZ</span><span class="ph-title">${esc(sc ? sc.title() : navLabel(S.route))}${tab ? ' › ' + esc(tab.label) : ''}</span><span class="ph-meta">${esc(T('Напечатано', 'Gedruckt', 'Printed', 'Басылды'))} ${fd(now.toISOString())} ${p2(now.getHours())}:${p2(now.getMinutes())} · v${VERSION} · ${esc(ROLE_NAME[S.role] || '')}</span></div>`;
  };
  globalThis.printBtn = () => `<button type="button" class="btn grey sm print-btn" data-act="printPage" title="${esc(T('Печать / PDF (A4): текущий экран или открытый документ', 'Drucken / PDF (A4): aktueller Screen oder offenes Dokument', 'Print / PDF (A4): current screen or open document', 'Басып шығару / PDF (A4): ағымдағы экран немесе ашық құжат'))}" aria-label="${esc(T('Печать / PDF', 'Drucken / PDF', 'Print / PDF', 'Басып шығару / PDF'))}">⎙</button>`;
  Object.assign(ACT, { printPage: () => { S.tbMore = false; S.sideOpen = false; render(); window.print(); } });
  /* stand-alone documents (KZ documents, loading sequence, booking certificates, offers) share one A4 sheet style + header */
  globalThis.DOC_PRINT_CSS = '@page{size:A4;margin:16mm 14mm 18mm}@media print{body{margin:0!important;max-width:none!important}h1,h2,h3{break-after:avoid}thead{display:table-header-group}tr,img,svg{break-inside:avoid}}'
    + '.doc-head{display:flex;justify-content:space-between;gap:12px;font:11px/1.3 system-ui,sans-serif;color:#333;border-bottom:1.5px solid #0E6E7E;padding:0 0 6px;margin:0 0 14px}table{border-collapse:collapse}';
  globalThis.docHead = title => `<div class="doc-head"><span><b>Kökzhol</b> · Olymp Logistic KZ</span><span>${esc(title)}</span><span>${fd(new Date().toISOString())} · v${VERSION}</span></div>`;

  /* ---------- FR-225 offline demo: register sw.js (versioned cache, see platform-src/delivery.mjs) ---------- */
  /* why not: '' = register; 'frame' (test harness iframes), 'tests', 'file', 'dev' (localhost without ?sw=1), 'unsupported' */
  globalThis.swWhy = (loc, framed, nav) => !(nav && 'serviceWorker' in nav) ? 'unsupported' : framed ? 'frame' : /tests\.html$/.test(loc.pathname) ? 'tests'
    : loc.protocol === 'file:' ? 'file' : /^(localhost|127\.0\.0\.1|\[::1\])$/.test(loc.hostname) && !/[?&]sw=1\b/.test(loc.search) ? 'dev' : '';
  const SW = globalThis.SW_STATE = { why: 'unsupported', on: false };
  function swNote() {
    return SW.on ? T('Офлайн-демо включено: страницы и ресурсы сохранены в браузере.', 'Offline-Demo aktiv: Seiten und Assets sind im Browser gespeichert.', 'Offline demo on: pages and assets are stored in the browser.', 'Офлайн-демо қосулы: беттер мен ресурстар браузерде сақталды.')
      : SW.why === 'dev' ? T('Офлайн-демо выключено на localhost (разработка); включить: ?sw=1.', 'Offline-Demo auf localhost aus (Entwicklung); einschalten: ?sw=1.', 'Offline demo is off on localhost (development); turn on with ?sw=1.', 'Офлайн-демо localhost-та өшірулі (әзірлеу); қосу: ?sw=1.')
      : T('Офлайн-демо работает при открытии с сервера (https), не во встроенных окнах.', 'Offline-Demo läuft beim Öffnen vom Server (https), nicht in eingebetteten Fenstern.', 'The offline demo runs when opened from the server (https), not in embedded frames.', 'Офлайн-демо серверден (https) ашқанда жұмыс істейді, ендірілген терезелерде емес.');
  }
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    SW.why = swWhy(location, !!window.frameElement, navigator);
    if (SW.why === '') {
      window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').then(() => { SW.on = true; }).catch(() => { SW.why = 'error'; }));
    } else if (SW.why === 'dev') {
      /* development: drop a worker left over from a ?sw=1 session so python -m http.server always serves fresh files */
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => { const u = (r.active || r.waiting || r.installing || {}).scriptURL || ''; if (/\/sw\.js$/.test(u)) r.unregister(); })).catch(() => {});
    }
  }

  /* ---------- FR-196: logos as WebP (≈ 60 % lighter); PNG stays as source and for uploads ---------- */
  if (typeof globalThis.mfrSrc === 'function') { const ms0 = globalThis.mfrSrc; globalThis.mfrSrc = m => { const s = ms0(m); return /^assets\/manufacturers\/[\w-]+\.png$/.test(s) ? s.slice(0, -4) + '.webp' : s; }; }
})();
