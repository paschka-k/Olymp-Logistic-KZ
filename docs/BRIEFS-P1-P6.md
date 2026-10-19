# Briefs for the porting workstreams P1–P6 (0.3.10 → v6)

Common context for every session (fresh context, own worktree from `main`, branch `p<n>-…`):

- Repo `C:\_Projects\Olymp-Logistic-KZ`, vanilla JS mock-up, no backend. Build `node platform-src/build-v6.mjs` → `platform/{index,de,en,kk,tests}.html`. Sources `platform-src/v6/` (core.js, data.js, roles.js, screens/NNN-*.js bundled in file order, help/*.js, app.css).
- Tests `platform-src/tests/NN-*.js`: `await group(name, lang, async (g, ev, w) => {...})`, `ev(jsExpr)` inside the platform iframe, `eq`, `assert`. Run via `python -m http.server 878n` in the worktree and `http://localhost:878n/platform/tests.html` (file:// does not work). 0 failed in RU / DE / EN / KK required.
- Tabs `addTab(screen, key, label, body, {perm, badge})`; drawers `DRAWERS.x`; actions `ACT.x`; help `helpAdd({key:'screen/tab', group, screen, tab, title: HQ(ru,de,en,kk), purpose, who, see, howto, rules, related})` (duplicate keys merge); texts `T(ru, de, en, kk)`; DE / EN without Cyrillic; KK may be shorter.
- Data: HUBS AST, ALA, KAR, SHY, ATY (Atyrau-West cross-dock), S.loads, ops model 200-ops-model.js, weather 150-monitor.js, coverage 340-coverage.js, road map 005-kzmap.js.
- Source platform 0.3.10: `C:\_Projects\Olymp-Logistic-Platform\frontend\src` (v5/screens, v5/Coverage.tsx, pages, help/screens.ts, records.ts), built copy `releases/0.3.10/platform-en.html`.
- Read first: `docs/PARITY-0.3.10-v6.md`, `docs/INVENTORY-0.3.10.md`, `docs/INVENTORY-v6.md`.
- Rules: never push; do not bump VERSION; do not touch `platform-v5*.html` or `releases/`; commit on the branch; leave generated `platform/*.html` out of commits; rows in `docs/TRACEABILITY.md` under "## P<n> — …"; report commit hash, done, left.
- P1 owns 200-ops-model.js and 210-ops-load.js; P6 keeps core.js / roles.js / app.css edits minimal and prefers screens/001-shell-ext.js.

## P1 · Load & weight parity (port 8781, branch p1-loadw)
Bring Orders → Load & weight (210-ops-load.js, 200-ops-model.js) to parity with 0.3.10 screen 03: see `docs/PARITY-0.3.10-v6.md` section 3, items 1–9 (vehicle type card with thermo zones / body regime / bulkhead and own vehicles; orders table with height, stackable, third-party T- rows, ADR summary; loading diagram by chambers with thermo containers and −20 °C thermo boxes, fix the SVG overflow; thermo-container and 15–25 bars + limiting-factor line; load checks Risk / Watch / Normal incl. ADR and dry ice; CoG fact boxes; vehicle-match table; truck-finder options, road restrictions per travel day, spring limits, places per zone; realistic West trip R-106-like load with lab / IVD goods and two T- orders). Help orders/loadw, tests 70-ops-load.js extended, traceability "## P1 — Load & weight parity".

## P2 · Dashboard, dispatcher detail, trips, Documents KZ (port 8782, branch p2-dispatch)
A. Dashboard overview: 0.3.10 KPI set (trips today with breakdown, in transit, OTIF 7 d, temp compliance, volume utilisation by m³ / weight, alarms), "Alarms and events" (9) + "Risks · weather, roads, load" (6) with level tags and "source →" links, compact inbox (5 newest, "All messages (N) →"), hub weather 3-day tiles, playbook cards for active simulations. Keep map and quick actions.
B. Trip detail aside in the load drawer: stops timeline with passed markers; next dead zones from 340-coverage.js + ETA confidence + "Network coverage →"; informational pre-release checks (capacity, temperature classes, ADR, weather, logger & insurance, driving time > 700 km, frost −45 °C, window 9–17, DG adviser); service on route card; "Send trip sheet" once; buran-free window move; driver-app feed.
C. Trip planning records view in Dispatch → Planning: unassigned orders with search + selection, booked departures (FR-96) → "Trip for departure", plan-trip form (vehicle, driver, departure, ETA, note, load box) → createLoad + assign.
D. Trips / orders records (new 250-ops-trips.js): Abort trip (FR-173), Edit trip, stops with per-order outcomes, unassign order, new-order fields (destination site, goods, LOT, class, pallets, kg, height, stackable, priority), tracking token copy / renew / cancel accepted by 530-public.js.
E. Documents KZ: full 0.3.10 document set (12 types) with Generate / PDF / Sign / To IS ESF, "Generate all", gate 9 + 2 checks, "Clear without weather forecast" (audited).
Help ops-operations.js + new ops-trips.js; tests 74-ops-dashboard.js, 75-ops-trips.js, 76-ops-docs.js; traceability "## P2 — Dashboard, dispatcher, trips, documents". Do not edit 200/210.

## P3 · Routes: thermo history, weather, FR-111 coverage map (port 8783, branch p3-routes)
A. Temperature: per-vehicle 48-reading history chart (bands 2–8 / 15–25, chambers + outside, legend), vehicle chips, readout tiles, status block (unit, door, logger, set-point), "Open chamber door" timer; readings extended by liveTick. New tab "Temperature log": record reading, sensor → chamber mapping, thermochron CSV upload, readings table; integrate with 360-thermo-ext.js.
B. Weather: horizon 3 / 7, stale-forecast warning, sources card + Refresh, city card; grid includes Atyrau and West cities.
C. Coverage FR-111 on the KZMAP road network (stretches coloured by class, dashed estimate / solid measured, hubs, cities, live vehicles, detail aside with per-operator class, minutes without data, confidence, sources); West segments Astana – Kostanay – Aktobe – Khromtau – Oral – Atyrau – Aktau; offline windows per trip + ETA confidence; worst stretches; SMS channel OL1 (format, received list, instructions WAIT / CALL / CHKT / CONT / STOP / PARK, gateway status, resend); measured from telematics; sources & confidence; "Check now"; fix "0+ gap". Keep FR-109 / FR-110.
D. Security: incident close form with resolution category + text ≥ 10 (FR-105).
Help new res-routes.js; tests 83-res-thermo.js, 84-res-weather.js, 85-res-coverage.js (82 must keep passing); traceability "## P3 — Routes parity".

## P4 · Fleet, Staff, Partners, driver-app panels (port 8784, branch p4-resources)
A. Fleet: KPIs by model class (extend mkTrucks with class / cooling), toggles extended fleet +5 and 3.5 t demo, insurance / taxes / fees status column (OGPO, KASKO, inspection, tax, tolls, fines), West approval tag, trailer note, Compliance 60-day table in Registry.
B. Partners: city-group filter + city directory, full table columns, contact drawer with masked numbers + "Call (simulation)" audited + copy, renew contract upload + approve (four-eyes), propose demotion, route-coverage-by-partners table + Create task, handover Full / Partial with SSCC check-list, candidates with price / verdict, service on route + "Call service", handovers with partner-portal step and ePOD on behalf (FR-108), Approve four-eyes. Reuse 160 / 310 state.
C. Staff: document deadlines 90 days list; "where now" columns.
D. Driver app admin panel: "Ecosystem function coverage" and "Change requests" tables.
Help res-resources.js or new res-fleet-partners.js; tests 86-res-fleet-ext.js, 87-res-partners.js, 88-res-staff-app.js; traceability "## P4 — Fleet, Staff, Partners parity".

## P5 · Reports KPIs & catalogue, Costs tabs, Quality links (port 8785, branch p5-reports-costs)
A. Reports: 6 KPI tiles with 8-week sparklines (OTIF, temp compliance, volume util, empty running, cost per pallet, incidents / 100 trips), driver report 30 days, report catalogue 6 groups × 4 with PDF / Excel demo exports (audited); in the KPI tab or a new Catalogue tab.
B. Costs (Billing → Cost model + Costs): tabs Workshop & downtime (TO-1 / TO-2, availability, downtime cost card) and Drivers (FTE requirement table); Summary: plan / actual per vehicle · month (FR-125), toll CSV import, incoming partner / workshop ESF form (FR-116), 6-indicator management card; insurance idle toggles.
C. Quality: linked orders with outcome / hold tag on the deviation card; insurance claim link with DEV prefilled.
Help eco-reports.js, eco-costs.js; tests b1-eco-reports-ext.js, b2-eco-costs-ext.js; traceability "## P5 — Reports, Costs, Quality parity".

## P6 · Shell: hub filter, global search, alarm banner, login (port 8786, branch p6-shell)
1. Hub filter segment in the top bar (S.hub) + `hubFilter(items, field)` applied in dashboard, orders, dispatch board, fleet, drivers, hubs, receiving, billing.
2. Global search combobox: "In current shipments" (goods, PO, PL, article, LOT, SSCC with logo / load / truck / status, archive toggle) + "In the database" (orders, loads, packages, bookings, number variants), keyboard ↑ ↓ Enter Esc, Enter opens the hit, Scanner toggle rule.
3. Clock + business date "· Astana UTC+5", "N active alarms" button, alarm banner ≥ L2 (3 items, dismiss).
4. Phone bottom bar (≤ 700 px) with 4 screens per role and badges; Escape closes sidebar and drawers.
5. Eyebrow "NN · subtitle" with the 0.3.10 screen number per tab; "◇ Diagram" popover with HELP.visuals.
6. Deep links `?load=`, `?dev=`, `?fine=`, `?s=&t=`; document.title; keep `?track=`, `?request=1`.
7. Demo sign-in (password → 2FA "123456" → recovery codes → forced change ≥ 12) ending in setRole; My account page; Sign out; Reset demo data.
Help 10-start.js (navigation / login / account); tests 61-shell-ext.js (10 and 60 keep passing, menu stays 13 items); traceability "## P6 — Shell parity".
