# Traceability — Lastenheft / FR → v6 tab → test

One line per implemented requirement: where it lives in the v6 mock-up (menu item → tab, file) and which scenario test in `platform/tests.html` covers it.
Workstreams add their own rows under their heading (see `docs/INTEGRATION-PLAN.md`, section 4).

## W1 — Operations flow (LH-B, C, D, H, N1, O1)

Files: `platform-src/v6/screens/200-ops-model.js` (rules), `210-ops-load.js`, `220-ops-ship.js`, `230-ops-docs.js`, `240-ops-dispatch.js`; help `platform-src/v6/help/ops-operations.js`; tests `platform-src/tests/70…73-ops-*.js`.

| LH | FR | Function in the mock-up | v6 menu → tab | Test (group name, file) |
|---|---|---|---|---|
| LH-C1 | FR-99 | Load calculation for any load and truck type: pallets, weight, volume, axle loads (lever rule), gross, height; plan of the vehicle type, override only with `trips:override_load` + reason (audited) | Orders & Loads → Load & weight | "load calc: overload always shown…", "plan of the vehicle type…" (70) |
| LH-C1 | FR-140 | Loading view 2.0: top view with stop colours and centre of gravity, side view with stack heights vs. internal height, lateral balance warning | Orders & Loads → Load & weight | "Load & weight tab renders…" (70) |
| LH-C1 | FR-145 | Departure weighing: source, ticket, axle / gross weights; excess with exact value turns the Go/No-Go control red; audited override with permission + reason | Orders & Loads → Load & weight | "departure weighing…" (70) |
| LH-C1 | FR-146 | Place dimensions: height and stackability per order drive the height check and the tiers of the loading sequence | Orders & Loads → Load & weight | "load calc…" (250 cm pallet fails a 240 cm body) (70) |
| LH-C2 | FR-09 / FR-143 | Truck finder: every catalogue type + fleet truck, feasibility first, ranking by rate ₸/km or full trip cost (fuel, tolls, driver hours, empty return, depreciation), utilisation; partner offers per pallet and own-vs-partner comparison | Orders & Loads → Load & weight | "load calc: … truck finder ranks feasible first…" (70) |
| LH-C2 | FR-139 | Split over two trucks when no single vehicle takes the load, cost compared with one bigger truck | Orders & Loads → Load & weight | "split over two trucks…" (70) |
| LH-C2 | FR-144 | Loading sequence sheet for the warehouse (LIFO by stop, odd left / even right, tiers), print / PDF, scan check against the planned position | Orders & Loads → Load & weight | "loading sequence…" (70) |
| LH-D2 | FR-05 | FEFO warning when shelf life at delivery < 90 days, agreement with the branch | Load & weight (checks), Shipments & labels (marker) | "FEFO warning and SSCC reconciliation…" (70), "track & trace … FEFO marker" (71) |
| LH-D2 | FR-06 | Loading by places (SSCC): reconciliation per order, rescan, mismatch blocks the release | Orders & Loads → Load & weight; gate control "places" | "FEFO warning and SSCC reconciliation…" (70), "Go/No-Go…" (72) |
| LH-D1 | FR-73 | Order lines, places and SSCC as separate records (PO, PL, article, LOT, expiry, qty) | Orders & Loads → Shipments & labels | "ops model: SSCC check digit, one place per pallet…" (70) |
| LH-D1 | FR-01 | Scanner in the search field: a GS1-128 scan (AI 00) opens the place label at once, also across loads and the archive | Orders & Loads → Shipments & labels | "scanner search…" (71) |
| LH-D1 | FR-04 | GS1-128 transport label (AI 00, 02, 10, 17, 37), print (demo), ZPL for Zebra and `.zpl` export | Orders & Loads → Shipments & labels | "GS1-128 label: ZPL encodes…" (71) |
| LH-D1 | FR-03 | Track & trace per SSCC: created → loaded → departed → unloaded → received (ePOD); a scan into another trip is an alarm | Orders & Loads → Shipments & labels | "track & trace per place…" (71) |
| LH-D3 | FR-02 | Archive of delivered shipments: toggle, date filter, search by ePOD / load number | Orders & Loads → Shipments & labels | "scanner search…" (ePOD), "manufacturer directory … archive date filter" (71) |
| — | FR-176 | Manufacturer directory with logo badges on the cards and the label | Orders & Loads → Shipments & labels | "manufacturer directory with logo badges…" (71) |
| LH-H1 | FR-12 | KZ document set per load (TTN, waybill, SNT, ESF): generate → PDF → e-signature (NCALayer mock drawer) → send to IS ESF / ESUTD → incoming status | Orders & Loads → Documents KZ | "document chain generate → sign → send → accepted…" (72), "UI: Documents KZ tab…" (72) |
| LH-H1 | FR-116 | ESF only from a delivered order with approved POD; sent / accepted updates the ESF status of the load | Orders & Loads → Documents KZ | "document chain…" (72) |
| LH-B2 | FR-91 | Mandatory Go/No-Go release before loading → in_transit (drawer button and drag & drop both refuse); withdrawal with reason; automatic withdrawal on replan / unassign / critical alarm | Documents KZ; Dispatch Board → load card | "Go/No-Go: loading → in_transit refused…", "override release…" (72) |
| LH-B2 | FR-92 | Data-based controls: documents signed, calibration, insurance, medical check, place reconciliation, load / weighing, temperature class, driver licence + RTO, weather | Orders & Loads → Documents KZ | "Go/No-Go: … controls are data-based" (72) |
| LH-B2 | FR-11 | Expired calibration / insurance turn the gate red automatically | Documents KZ (gate) | "Go/No-Go…" (expired calibration) (72) |
| LH-H2 | FR-114 | Pre-trip medical check as gate control and as condition for issuing the waybill | Documents KZ; Dispatch → Waybills & express | "Go/No-Go…" (72), "UI: Waybills & express tab…" (73) |
| LH-B1 | FR-93 | Double-booking block: a driver or truck flagged busy or on a platform-assigned load cannot be assigned again | Dispatch Board (assign rule) | "double booking…" (73) |
| LH-B1 | FR-94 | Replanning: unassign (frees resources, back to Unassigned, release withdrawn), new departure with reason | Dispatch Board → load card | "replanning: unassign …, replan…" (73) |
| LH-N1 | FR-41 | Express approval by three business functions (CEO, analytics, procurement/logistics); approved → urgent load with +35 % surcharge; express-share KPI with target and trend | Dispatch Board → Waybills & express | "express: three signatures approve…" (73) |
| LH-N1 | FR-126 | Deadline (cut-off), notification of the three signers, consequence: expired / rejected → regular trip | Dispatch Board → Waybills & express | "express: … passed deadline create a regular load" (73) |
| LH-N1 | FR-154 | Express requests from the portal / dispatcher visible with route, goods, slots and deadline | Dispatch Board → Waybills & express | "UI: Waybills & express tab…" (73) |
| LH-O1 | FR-119 | 7-day capacity plan from data (loads per ETA day + open express vs. trucks free that day, limited by drivers), scenarios blizzard / repair / peak, recommendations | Dispatch Board → Planning | "planning: 7-day capacity from data…" (73) |
| LH-O1 | FR-38 | Target-fleet simulation: 4 trucks of the 10-t class (HOWO T5G ×2, JAC N120 ×2) compared with the current fleet | Dispatch Board → Planning; Load & weight (types) | "planning: … target fleet of 4 trucks" (73) |
| — | FR-156 | KZ working-day calendar: holidays 2026–2027, weekend transfers, `addWorkDays` for deadlines | Dispatch Board → Planning | "planning: … KZ working-day calendar" (73) |

Not in the mock-up (documented only, plan section 6): real NCALayer signing, real IS ESF / ESUTD calls, weighbridge import interface, Wialon-based storm data (storm warning comes from the planning scenario), server-side plan recalculation.

## W2 Resources & driver app

| LH / FR | Function | Tab (menu → tab) | Code | Test (group name starts with) |
|---|---|---|---|---|
| LH-J1 / FR-157 | Commissioning checklist; truck not plannable until closed | Fleet → Registry | 300 `obState/obClose`, 310 | `W2 fleet: new truck needs checklist` (80) |
| LH-J1 / FR-141 | Load-profile calibration, axle shares | Fleet → Registry (card) | 300 `lpSave/axleShares` | `W2 fleet: load profile calibration` (80) |
| LH-J1 / FR-50 | Warranty-exhaustion forecast by mileage | Fleet → Registry | 300 `warranty` | `W2 fleet: warranty forecast` (80) |
| LH-J1 / FR-27, FR-118 | Service requests with ETA / cost / status change availability and slot capacity | Fleet → Registry; Routes → Lines | 300 `svcCreate/svcSet/slotCapacity`, 350 `lineCap` | `W2 fleet: service request`, `W2 lines: exceptions` (80, 82) |
| LH-J1 / FR-158 | Saved views, column chooser, CSV of visible columns | Fleet → Registry | 310 | `W2 fleet: saved views and CSV` (80) |
| LH-J2 / FR-08, FR-55, FR-120 | Driving time 4.5 h / 9 h / 56 h, urgent-trip finder | Drivers → Staff | 300 `driveState/urgent`, 320 | `W2 staff: driving-time blocks` (80) |
| LH-J2 / FR-46 | Absences, 14-day plan, 6-day week, 7 drivers on 4 trucks | Drivers → Staff | 300 `plan14/absAdd`, 320 | `W2 staff: absences` (80) |
| LH-H2 / FR-114 | Pre-trip medical mandatory from 01.01.2027 (regime switch) | Drivers → Staff; Driver app → Shift | 300 `medEnforced/driverBlocks` | `W2 staff: medical check` (80) |
| LH-G2 / FR-10 | ADR / licence deadlines (60/30 d), course booking, assignment block | Drivers → Staff | 300 `adrState/adrBook` | `W2 staff: ADR` (80) |
| LH-J2 / FR-122, FR-123 | Fine attribution at time of violation by waybill; recovery process, cost entry | Drivers → Staff | 300 `driverAt/fineSet` | `W2 staff: fines attributed` (80) |
| LH-K1 / FR-83 | Driver app bound to the signed-in driver's own trip; role shell | Driver role shell; Drivers → Driver app | 330 | `W2 driver app: role shell` (81) |
| LH-K1 / FR-52, FR-53, FR-54 | Shift start: medical + checklist gate; e-waybill with odometer/fuel; document pack | Driver app → Shift | 330 | `W2 driver app: shift start` (81) |
| LH-K1 / FR-55, FR-56 | Driving timer, route points with 9–17 windows, weather, closures | Driver app → Route | 330 | `W2 driver app: role shell` (render), `W2 staff: driving-time` |
| LH-K1 / FR-57, FR-58 | SSCC scan and place reconciliation; thermochron at receipt → thermochron log | Driver app → Stop | 330, 360 | `W2 driver app: delivery flow` (81) |
| LH-K1 / FR-59, FR-62 | Exceptions → quality deviation; incidents / SOS / breakdown / delay | Driver app → Stop / Me | 330 | `W2 driver app: signature required, exceptions` (81) |
| LH-K1 / FR-60, FR-61, FR-63, FR-64, FR-65, FR-66 | Returns, fuel → costs, read acknowledgement, fines notice, shift end, profile | Driver app → Returns / Fuel / Me | 330 | `W2 driver app: fines notice, fuel, returns` (81) |
| LH-K1 / FR-67 | Offline queue + sync; SMS mode after 30 min | Driver app | 330 | `W2 driver app: offline queue` (81) |
| LH-K2 / FR-107, FR-108 | ePOD with photo, signature, time, coordinates, temperature report, order status | Driver app → Stop | 330 | `W2 driver app: delivery flow` (81) |
| LH-K3 / FR-109 | Last contact monitor, stepwise escalation L1–L3 | Routes → Coverage | 340 `covLevel` | `W2 coverage: escalation` (82) |
| LH-K3 / FR-110 | Dispatcher SMS: delivery status, timeout, retry | Routes → Coverage | 340 `smsSend/smsTick` | `W2 coverage: dispatcher SMS` (82) |
| LH-K3 / FR-111 | Dead zones from telematics gaps, class proposal, analyst decision | Routes → Coverage | 340 `covProposals/covDecide` | `W2 coverage: dead zones` (82) |
| LH-B1 / FR-96, FR-97 | Schedules, departures for 14 days, exceptions | Routes → Lines & tariffs | 350 | `W2 lines: exceptions` (82) |
| LH-M1 / FR-155 | Multi-leg routing via hubs, never "no line" | Routes → Lines & tariffs | 350 `route` | `W2 lines: multi-leg routing` (82) |
| LH-E1, LH-E2 / FR-39, FR-40 | Thermochron log, loggers register, passive chain containers | Routes → Thermochrons & loggers | 360 | `W2 thermo` (82) |
| — | 4 languages without undefined/NaN; DE/EN without Cyrillic | all W2 tabs | — | `W2: 4 languages render` (82) |

Not covered (out of scope for the mock-up, see INTEGRATION-PLAN section 6): real tachograph/Wialon data, real SMS gateway (SMSC.kz / Mobizon), real photo/signature upload to an object store (hash is simulated).

## W3 Records & administration
Tests are in `platform-src/tests/90-rec-records.js`; screens in `platform-src/v6/screens/400-460-rec-*.js`; help in `platform-src/v6/help/rec-records.js`.

| LH / FR | Tab (menu) | Test (group name starts with) |
|---|---|---|
| LH-E3, FR-101, FR-104, FR-105 | Dashboard / Alarms | `alarms:` (escalation, ack, close note; load turning problem) |
| FR-110, FR-135, LH-P1 | Dashboard / Inbox | `inbox:` |
| LH-M4, FR-190 | Orders / Bookings (+ menu badge) | `bookings:` |
| LH-M5, FR-28, FR-153 | Billing / Insurance | `insurance:` |
| LH-A2, LH-A3, FR-78, FR-135, FR-169, FR-174, FR-176 | Settings / Reference data | `reference data:` |
| FR-166, LH-E3 | Settings / On-call | `on-call:` |
| LH-Q1, FR-14, FR-85, FR-137, FR-167 | Settings / Users & roles | `users:` |
| LH-Q3 | Settings / Audit log | `audit:` |
| FR-173, LH-P1, LH-P2 | Settings / Integrations catalogue | `integrations catalogue:` |
| Change register (190 FR/BUG) | route `changes` | `changes page:` |

Skipped in the mock-up: real SMS/e-mail/call delivery and the 5-minute timer (simulated by a button), HMAC audit chain (demo hash), encrypted contacts (masked strings), NCALayer e-signature, WhatsApp/Telegram (FR-188, legal question open), logo upload for manufacturers (FR-176: only the master record).

## W4 — Customers & portals (files `platform-src/v6/screens/5xx-*.js`, help `v6/help/por-portals.js`, tests `tests/a0-por-portals.js`)

| LH / FR | Function | v6 place | Test |
|---|---|---|---|
| LH-M2 · FR-147 | Offers with price lock (14 days), sample sheet, accept → booking at the locked price | Orders & Loads → Commercial → Offers; customer portal → My bookings (own offers, "Book with the offer") | por: offers lock the price for 14 days and accept into S.bookings |
| LH-M2 · FR-148 | Customer price lists: framework (discount) / spot, diesel base, fuel surcharge, versions never edited, deactivate falls back | Commercial → Price lists; `termsOf()`, `priceFor()` | por: price lists — framework discount, fuel surcharge, deactivate falls back to line tariff |
| LH-M2 · FR-149 | Contracts from template: draft → sent → signed (SHA-256 of the text, signer) / void; signed framework contract enables payment on account | Commercial → Contracts; customer portal → My bookings (sign, demo NCALayer) | por: contracts — draft → sent → signed in the portal; framework enables payment on account |
| LH-M2 · FR-152 | Daily NBK rates KZT with EUR/USD, stale after 2 business days, manual rate by finance; EUR/USD shown next to every price | Commercial → FX rates; `fxLatest()`, `fxLine()` in offers and the booking form | por: CRM — … (fx part); por: customer books … |
| LH-M3 · FR-189 | BIN/IIN check digit (weights 1…11 / 3…11,1,2), kind by 5th digit, IIN masked, register autofill of the company name | Commercial → Customers (new customer), payer in the booking form, partner self-registration, CRM lead | por: BIN/IIN check digit, mask, register autofill, customer created |
| FR-150 | Customer address book (own sites) used in the booking form | Commercial → Customers → address book; Book a shipment → "From the address book" | por: BIN/IIN … (address part); por: customer books … |
| FR-151 | Address check against the city street directory; unknown street → manual check by staff before confirmation | `addrCheck()`; booking `addrCheck: 'manual'`; Customers → "Address checked" | por: BIN/IIN … (`addrCheck` manual/ok/bad); por: customer books … (`addrCheck === 'manual'`) |
| FR-127 | CRM leads by stage, tenders with number + deadline + BIN, won lead → customer onboarding with portal access and task | Commercial → CRM, Tasks | por: CRM — public request becomes a lead, tender needs deadline, won lead onboards a customer with a task |
| LH-M1 · FR-146 | Booking: pickup AND delivery address, goods categories GDP/GLP/GMP/food restricting the temperature zone, pallets, weight, place dimensions | Customer portal → Book a shipment | por: customer books with DG, insurance, payer, SMS …; por: routing never answers "no line" … |
| LH-M1 · FR-155 | Route via hub / two hubs for every city pair, legs, lead time in business days; never "no line"; hub handling fee on transshipment | `routeFor()`, price block of the booking form, offers, tracking card | por: routing never answers "no line" — every city pair has a route |
| LH-M1 · FR-185 | Weight plausibility warnings (kg per pallet low/high/limit, sum of places, oversize, height), never blocking | Book a shipment → cargo block; `loadWarnings()` | por: routing … (`loadWarnings` cases) |
| LH-M1 · FR-154 | Express request with 3-manager approval note, surcharge, pending state, slot after approval | Book a shipment → Express; My bookings (express status) | por: customer books … (express pending) |
| LH-M1 | Price + slots shown immediately (next departures with free pallet places, cut-off, pickup and ETA dates) | Book a shipment → "Price and slots"; `slotsFor()` | por: routing … (slots); por: customer books … |
| FR-153 (part) | Cargo insurance: declared value → premium 0.15 % (min 3 000 ₸), outside VAT, EUR/USD view | Book a shipment → Insurance; price breakdown | por: customer books … (`premium >= 3000`) |
| LH-M3 · FR-186 | Payer (agent / broker / forwarder) books on behalf, BIN/IIN checked, invoice to the payer, data masked | Book a shipment → Payer; My bookings ("invoice to payer") | por: customer books … (`payer.invoiceTo === 'payer'`) |
| LH-M3 · FR-187 | Booking confirmation by e-mail (default) and SMS (opt-in), message preview shown as sent (demo), no personal data in the text | Book a shipment → notifications; confirmation card | por: customer books … (`messages.length === 2`) |
| LH-M4 · FR-190 (customer side) | Bookings written to `S.bookings` with status new/confirmed/rejected/cancelled; customer cancels a not yet confirmed booking | Customer portal → My bookings | por: customer books … (cancel) |
| LH-L2 · FR-30 / FR-68 | Partner portal: only the own handovers (Dispatch → Partners), SSCC packages, ePOD upload (consignee, signature, photo, scans) → load delivered, POD queue | Partner portal → My handovers and ePOD | por: partner portal — own handovers only, ePOD needs signature and scans … |
| LH-L2 · FR-172 | Partner self-registration with BIN and GDP proof, pending until staff approval; GDP submission for an existing partner | Partner portal → Profile and GDP; approval in Commercial → CRM | por: partner portal … (registration + `cmPqOk`) |
| FR-02 | Public request form without login → CRM lead "website (form)", honeypot, consent | Public → Transport request (`route request`, deep link `?request=1`) | por: CRM — public request becomes a lead … |
| FR-112 | Public tracking: status steps, route via hubs (cities only), lead time, temperature compliance yes/no, partner last mile; no personal data | Public → Shipment tracking (`route track`) | por: public tracking — deep link ?track for every role, no personal data, not found |
| FR-175 | Deep link `?track=<booking or load id>` opens the tracking card for every role (ALWAYS list) | `530-public.js`, `roles.js` ALWAYS | por: public tracking … (deep link iframe) |
| Convention | 4 languages without undefined/NaN, DE/EN without Cyrillic, portal help articles visible to the portal roles | help `por-portals.js` (7 articles) | por: all W4 screens render in 4 languages …; help: every article of every language is complete and DE/EN have no Cyrillic |

Not in the mock-up (documented only, plan section 6): real NCALayer signature and KGD register call, real e-mail/SMS gateway, WhatsApp/Telegram (FR-188), persistent storage of bookings.

## W5 · Economics, reports & baseline data

| LH / FR | Function | v6 menu → tab | Source file | Test (group) |
|---|---|---|---|---|
| LH-N2, FR-125 | Bottom-up cost model (diesel, service, detention/downtime, insurance, taxes) next to the actuals register, plan / actual by category | Billing & Invoices → Cost model → Summary / Diesel & service / Insurance, tax, registration | `v6/screens/600-eco-costmodel.js` | cost model: bottom-up categories, cost + 5 %, transfer prices, diesel what-if |
| FR-47 | Cost + 5 % tariff and transfer prices per ring vs LTL 228 ₸/kg | Billing & Invoices → Cost model → Summary | `600-eco-costmodel.js` | cost model: bottom-up categories, cost + 5 %, transfer prices, diesel what-if |
| LH-N2, FR-85 | Own vs external carrier, gap > 50 % needs two signatures bound to business functions (approvals:sign / costs:approve), four eyes, stale after diesel change, XO-n order booked to the actuals register | Billing & Invoices → Cost model → Own or external | `600-eco-costmodel.js` | own vs external: >50 % gap needs two signatures of different functions · own vs external: diesel price change makes signatures stale |
| LH-O1, FR-119 | KPI: OTIF, load factor, express share (weight / budget), cost per kg, CSV / JSON export | Reports → KPI | `v6/screens/610-eco-reports.js` | reports: KPI and express × temperature crossing react to decisions |
| I-12 (LH-N1 context) | Express × temperature crossing report, move express load to regular cycle | Reports → Express × temperature | `610-eco-reports.js` | reports: KPI and express × temperature crossing react to decisions |
| FR-07, FR-122, FR-123 | Imported fines, driver attributed by trip-sheet segment at offence time, manual attribution, pay / recharge / acknowledge / deduct (HR reason, 50 % cap) / write-off, payroll export, company payment to ledger | Reports → Fines | `610-eco-reports.js` | fines: import attributes driver by time … · fines: deduction without acknowledgement needs an HR reason |
| LH-O2, FR-35 | Fragenkatalog: 150 answers in 20 sections with status (covered / deviation / question to KDL / no data) | Settings → Baseline data → Fragenkatalog · 150 | `v6/screens/620-eco-baseline.js`, data `615-eco-baseline-data.js` | baseline: 150 questions, FR-49 open until all KDL questions clarified |
| FR-49 (stays open) | Deviations V-01…V-24 and 12 gaps; FR-49 closes only when all 5 questions to KDL are clarified (audited) | Settings → Baseline data → Deviations | `620-eco-baseline.js` | baseline: 150 questions, FR-49 open … |
| FR-174 | Planned values (26) with check status; legal / tax check points | Settings → Baseline data → Planned values · Launch · legal · West | `620-eco-baseline.js` | baseline: 23 cities on two hubs, target fleet 4, legs check, critical path |
| FR-36, FR-37 | 23 cities assigned to Astana / Almaty hubs per P86; Karaganda and Atyrau as transshipment points | Settings → Baseline data → Network & volumes | `620-eco-baseline.js` | baseline: 23 cities on two hubs … |
| FR-38 | Target fleet of 4 trucks (10-t class), rings and volumes per ring | Settings → Baseline data → Fleet & economics, Network & volumes | `620-eco-baseline.js` | baseline: 23 cities on two hubs, target fleet 4 … |
| FR-48 | Launch critical path to the first R1 trip, target mid-December 2026, done / at-risk marks | Settings → Baseline data → Launch · legal · West | `620-eco-baseline.js` | baseline: … critical path |
| — | Cold-chain "West" decision items (cooling, winter closure, empty return, Atyrau, hub) | Settings → Baseline data → Launch · legal · West | `620-eco-baseline.js` | baseline: … critical path |
| — | All W5 tabs and help articles render in RU / DE / EN / KK without undefined / NaN | all of the above | `v6/help/eco-*.js` | [ru/de/en/kk] W5 tabs render without undefined/NaN |

Not in W5: capacity plan, 7-day scenarios and target-fleet simulation on Dispatch → Planning (W1); the 3-signature express approval itself (W1, FR-41/126/154) — the I-12 report only analyses.

## W6 Help & i18n

| FR / LH | Requirement | Tab / place | Test (platform-src/tests/c0-help-content.js) |
|---|---|---|---|
| FR-160 | Guided tours in Help (dispatcher day, customer booking, driver delivery, QA deviation + platform introduction); spotlight, Next/Back, Esc, keyboard | Help → "Guided tours"; "▶" in the page header of the tour start screen; "Tour" link in articles (70-tours.js) | `tours: start from the list, spotlight, next / back, last step, Esc ends, keyboard, role without access`; `tours: popover texts follow the page language` (de, en, kk) |
| FR-17 | Keyboard and screen readers: help links, tabs and "?" react to Enter/Space, `aria-label`, focus ring, tour dialog is focusable and labelled | 00-framework.js (keydown handler, `role=button tabindex=0` on help links), app.css help block | `help: search … keyboard on articles`; `tours: …` |
| FR-134 | Navigation as links, skip link, non-colour status cues — described in help; context "?" in the header | Help → "Keyboard, languages, design and links"; header "?" | `context help: "?" opens the article of the current screen / tab` |
| FR-135 / FR-170 | RU/DE/EN complete, KK titles + key articles, KK fallback marker on untranslated bodies | all help files; marker in 00-framework.js | `help: every article has title and purpose …`; `help: texts of all articles … (ru/de/en/kk)`; `help: KK shows the marker …` |
| FR-132 | One source for screen names: article titles carry the old screen numbers in brackets, `screen`/`tab` fields resolve against NAV | 20-ops.js, 25-ops2.js | `help: keys are unique; screen, tab and related keys all resolve` |
| FR-14 / FR-137 | Roles matrix and role descriptions (11 roles) in Help | Help → "Roles and permissions" (10-start.js) | `help: opens from the top bar … roles matrix` (60-foundation.js) |
| FR-175 | Links and history — documented as mock-up limitation | Help → "Keyboard, languages, design and links" | — (documentation only) |
| FR-41 / FR-126 / FR-154 | Express approval described: where to find it, 3 signatures | Help → "Where is express?" (+ diagram `express`) | `help: process diagrams render as SVG …` |

## P6 — Shell parity
| Requirement | Behaviour in v6 | Where | Test |
|---|---|---|---|
| Hub filter (0.3.10 shell) | Segment All / AST / ALA / KAR / SHY / ATY in the top bar, `hubFilter(items, field)` applied in dashboard, orders, dispatch board, fleet, drivers, hubs, receiving, billing | 001-shell-ext.js + one-line edits in 010–100 | `shell: hub filter narrows lists …` (61) |
| FR-74 / FR-163 global search | Combobox "In current shipments" (PO, PL, article, LOT, SSCC, goods with logo / load / truck / status, archive toggle) + "In the database" (orders, loads, packages, bookings, number variants), ↑ ↓ Enter Esc, scanner opens only an exact hit | 001-shell-ext.js | `shell: search finds lines …` (61) |
| FR-131 clock, alarms, banner | Clock + "· Astana UTC+5", "N active alarms" button, banner for new level ≥ 2 (3 items, dismiss) | 001-shell-ext.js | `shell: alarm banner …` (61) |
| FR-133 / FR-134 phone bar, Escape | Bottom bar ≤ 700 px with 4 screens per role; Escape closes diagram, drawer, sidebar | 001-shell-ext.js, app.css | `shell: bottom bar …` (61) |
| Screen eyebrow, ◇ Diagram | "NN · subtitle" with the 0.3.10 number per tab; popover with HELP.visuals | 001-shell-ext.js | `shell: eyebrow numbers …` (61) |
| FR-175 deep links | `?load= ?dev= ?fine= ?s=&t=`, document.title; `?track=` / `?request=1` unchanged | 001-shell-ext.js | `shell: deep links …` (61) |
| Login, /account, demo bar | Demo sign-in password → 2FA 123456 → recovery codes → change ≥ 12 → setRole; My account; Sign out; Reset demo data | 001-shell-ext.js | `shell: demo sign-in …` (61) |

## P1 — Load & weight parity

Port of 0.3.10 screen 03 "Pallets, volume, axles / Load and weight" (trip R-106) into Orders → Load & weight. Sources `v6/screens/200-ops-model.js` (catalogue, profiles, calculation, finder, vehicle match), `v6/screens/210-ops-load.js` (tab), help `v6/help/ops-operations.js` (`orders/loadw`). Tests in `platform-src/tests/70-ops-load.js`.

| FR / parity item | Requirement | Tab / place | Test (platform-src/tests/70-ops-load.js) |
|---|---|---|---|
| FR-99, parity 3.1 | Vehicle type card: catalogue 3,5 / 6 / 7,5 / 10 / 12,5 t + v6 types, own vehicles, demo V05–V09; thermo zones 1 / 2 / none, body regime auto / 2–8 / 15–25, bulkhead −/+ with zone 1 \| zone 2, facts line, save plan, show plan | Orders → Load & weight → Vehicle type | `vehicle type card: catalogue + own vehicles, thermo zones, body regime, bulkhead …` |
| FR-73, parity 3.2 | Orders table with height, stackable, third-party T- rows, partner hand-over locked; summary pallets / third-party / volume / weight / ADR (Yes · LQ) | Load & weight → Orders on load | `orders table: height, stackable, third-party tags, partner hand-over locked …` |
| FR-140, parity 3.3 | Loading diagram by chambers (thermo containers / zone 1 at the front wall, body / zone 2), free places, thermo boxes −20 °C dry ice UN 1845 at the front wall, LIFO, side view; SVG scaled to the card (overflow fixed) | Load & weight → Loading diagram by chambers | `loading diagram by chambers: … the SVG fits its card` |
| FR-146, parity 3.4 | Bars per zone (thermo containers 2–8 °C, pallets 15–25 °C / zone 1, zone 2), payload, volume, axles, gross, height, exact excess, limiting-factor line | Load & weight → Weight, volume and axle loads | `bars and checks: thermo-container and 15–25 bars, limiting factor …` |
| FR-05, FR-06, parity 3.5 | Load checks Risk / Watch / Normal: overloads, mixed regimes, height, FEFO with LOT and branch, SSCC package check, −20 °C thermo box with dry ice ADR labelling, ADR vehicle approved / driver certificate until, third-party cargo | Load & weight → Load checks | `bars and checks: … Risk / Watch / Normal incl. ADR, dry ice, FEFO, SSCC` |
| FR-140, parity 3.6 | Top and side view with CoG marker, ×2 double-stacked; fact boxes CoG from the front wall %, CoG height cm, front axle share %, left / right kg (Δ ≤ tolerance) | Load & weight → Top and side view · centre of gravity | `centre of gravity facts: …` |
| FR-99, parity 3.7 | Vehicle match for the ticked orders: every catalogue type × 1 zone / 2 zones (best bulkhead) + own fleet; pallets per regime, weight, volume, axles, result, reasons; recommendation = smallest fitting type | Load & weight → Vehicle match | `vehicle match: every catalogue type × 1 / 2 zones …` |
| FR-142, FR-143, parity 3.8 | Truck finder: + demo fleet V05–V07, + demo 3.5 t V08 / V09, spring road limits (01.04–15.05), route legs with km and departure date, restrictions on the travel day (RS-002 bridge ≤ 32 000 kg), pallet places per zone, −20 °C boxes, ADR ✓ / ✗, roads ✓ / limit ✗, other hub / busy / workshop reasons, "How it decides" | Load & weight → Truck finder · simulation | `truck finder: demo fleets, spring limits, restrictions per travel day …` |
| parity 3.9 | Realistic West trip LD-2026-001856 (R-106-like): Astana → Kostanay → Aktobe → Atyrau, 10 orders of lab / IVD goods (Roche reagents, Sysmex consumables, calibrators, ADR LQ wash solutions, pipette tips, dry-ice thermo box) and two third-party orders T-0107 / T-0109; default load of the tab | Load & weight (opens on the West trip) | `West trip (R-106-like): …` |
| FR-17, FR-135 | The tab renders in RU / DE / EN / KK without undefined / NaN; DE / EN texts without Cyrillic | Load & weight | `P1 Load & weight on the West trip renders in every language …` |
| — | Help article orders/loadw extended: vehicle type card, chambers, orders table, checks, vehicle match, West-trip how-to, dry ice / one-zone / road-limit rules | Help → Load and weight | `help: …` (c0-help-content.js) |

## P2 — Dashboard, dispatcher, trips, documents

Files: `platform-src/v6/screens/010-dashboard.js`, `230-ops-docs.js`, `250-ops-trips.js`, `260-ops-plan.js`, `540-ops-track.js`; help `v6/help/ops-operations.js`, `ops-trips.js`; tests `tests/74-ops-dashboard.js`, `75-ops-trips.js`, `76-ops-docs.js`. Source: 0.3.10 screens 01, 02, 08 and the records /trips, /orders.

| FR / LH | Requirement | Function in the mock-up | v6 menu → tab | Test (group name, file) |
|---|---|---|---|---|
| FR-33, FR-34 | Overview KPIs of 0.3.10: trips today with status breakdown, in transit, OTIF 7 d, temperature compliance, volume / weight utilisation, alarms | Six KPI tiles computed from loads, alarms and load calculation | Dashboard → Overview | "dashboard: 0.3.10 KPI set…" (74) |
| FR-101 | Alarms and events (up to 9) separate from risks · weather, roads, load (up to 6), level tags and "source →" links | Two lists with level chips; click opens the screen / tab (alarms, temperature, coverage, weather, load & weight, security, POD, documents) | Dashboard → Overview | "dashboard: 0.3.10 KPI set…" (74) |
| FR-138 | Compact inbox: 5 newest, "All messages (N) →" | Inbox excerpt with route buttons | Dashboard → Overview | "dashboard: 0.3.10 KPI set…" (74) |
| — | Hub weather 3 days with risk colour; playbook cards of active incident simulations | 15 tiles (5 hubs × 3 days); card per Fire / Breakdown / Theft simulation with response steps and reset | Dashboard → Overview | "dashboard: 0.3.10 KPI set…", "dashboard: playbook card…" (74) |
| FR-43, FR-44, FR-51 | Trip detail aside: stops with passed markers, next dead zones and ETA confidence, link "Network coverage →", service on route, driver-app feed | Block in the load drawer (overview tab) | Dispatch Board → load card | "trip detail aside…" (74) |
| FR-92 (info) | Informational pre-release checks: capacity, temperature classes, ADR, weather, logger and insurance, driving time > 700 km, frost −45 °C, window 9–17, DG adviser | Checks with level tags that never block; the blocking gate stays on Documents KZ | Dispatch Board → load card | "trip detail aside…", "pre-release checks stay informational…" (74) |
| FR-94 | Send trip sheet once; move to the buran-free window; edit trip (vehicle, driver, ETA, note) | Buttons in the load card; replanning withdraws the release | Dispatch Board → load card | "trip detail aside…" (74), "trip edit (FR-94)…" (75) |
| FR-96 | Trip planning: unassigned orders with search + selection, booked departures → "Trip for departure", plan-trip form with load box → createLoad + assign | Records view above the 7-day capacity view | Dispatch Board → Planning | "Planning: unassigned orders with search + selection…" (74) |
| FR-173 | Abort trip: only under way, linked alarm required, reason ≥ 10, rescue trip or back to "new", resources freed, audited | Form in the load card, status "Aborted" | Dispatch Board → load card | "abort trip (FR-173)…", "abort trip UI…" (75) |
| FR-98 | Stops with arrival (outside window flagged), outcome per order (delivered / partially / refused + reason), order outcome after the fact (returned / handed over), unassign order | "Stops" tab of the load card | Dispatch Board / Orders → load card → Stops | "stops and outcomes (FR-98)…" (75) |
| FR-99, FR-175 | New order with destination site, goods, LOT, class, pallets, kg, height, stackable, priority; search and status filter; cancel | Orders · records tab | Orders & Loads → Orders · records | "orders records: new order…" (75) |
| FR-175 | Tracking token per order: copy link, renew (old token dead), cancel; public tracking accepts the token and shows the reason without personal data | Buttons in the records tab; `540-ops-track.js` extends the public page | Orders & Loads → Orders · records; public tracking | "tracking token…" (75) |
| FR-12, FR-116 | Full document set of 12 types (trip order, waybill, TTN, internal transfer, temperature sheet, MD / IVD certificates, carriage contract, ESF, SNT, ADR documents, handover report + carrier waybill, ePOD) with Generate / PDF / Sign / To IS ESF and "Generate all" | Set follows the load (third-party cargo, dangerous goods, partner handover) | Orders & Loads → Documents KZ | "Documents KZ: 12 document types…", "…generate → PDF → sign…" (76) |
| FR-11, FR-91 | Gate 9 + 2 controls (ADR met, no critical alarms); "Clear without weather forecast" with permission and audit | Stale forecast of a hub blocks the weather control until cleared | Orders & Loads → Documents KZ | "Documents KZ: gate shows 9 + 2…" (76), "trip edit (FR-94) and the ADR / alarm gate extras" (75) |
| — | Every new view renders in RU / DE / EN / KK without undefined / NaN, DE / EN without Cyrillic in the new blocks | all of the above | — | "…render in every language…" (74, 75, 76) |

Not in the mock-up: real Kazhydromet / KazAvtoZhol feeds (the stale forecast of Atyrau is a fixed demo value), server-side validation of aborting a trip, real tracking-token expiry.

## P3 — Routes parity

Files: `platform-src/v6/screens/150-monitor.js` (temperature, temperature log, weather, security close form), `340-coverage.js` (FR-111 map, OL1 SMS), `005-kzmap.js` (road data exported, extra Kyzylorda – Zhezkazgan link); help `v6/help/res-routes.js`; tests `tests/83…85`.

| FR | Function in the mock-up | v6 menu → tab | Test (group name starts with) |
|---|---|---|---|
| FR-39 / FR-40 | Vehicle chips, readout tiles, 48-reading history (bands 2–8 / 15–25, chambers + outside, legend), status block (unit, door, loggers, set-point); history grows with every `liveTick` | Routes → Temperature | `P3 thermo: chips, readout tiles…`, `P3 thermo: liveTick extends…` (83) |
| FR-39 | "Open chamber door" timer; over 3 min raises the cold-chain alarm and sets the load to Problem | Routes → Temperature | `P3 thermo: liveTick extends…` (83) |
| FR-39 / FR-40 / FR-102 | Temperature log: record reading (out of range opens a deviation), sensor → chamber mapping, thermochron CSV upload feeding the thermochron log of `360-thermo-ext.js`, readings table | Routes → Temperature log | `P3 temperature log…` (83) |
| FR-16 / FR-42 | Weather horizon 3 / 7 days, grid with Atyrau and West cities (Kostanay, Aktobe, Khromtau, Oral, Aktau), city card, sources card | Routes → Weather & risks | `P3 weather: grid has hubs + West cities…` (84) |
| FR-106 | Stale-forecast warning (> 6 h) and "Refresh" (audited) | Routes → Weather & risks | `P3 weather: stale forecast warning…` (84) |
| FR-111 | Communications model per stretch on the KZMAP road network: class colours, dashed = estimate / solid = measured, hubs, cities, live vehicles L0–L3, West segments Astana – Kostanay – Aktobe – Khromtau – Oral – Atyrau – Aktau | Routes → Coverage | `P3 coverage: map on the road network…` (85) |
| FR-111 | Detail aside: class for the fleet and per operator, minutes without data, confidence, sources F1…F8 / EST | Routes → Coverage | `P3 coverage: detail aside…` (85) |
| FR-111 / FR-109 | Offline windows per trip with ETA confidence, worst stretches, last contact + "Check now", escalation L1–L3 kept, "0+ gap" cell fixed | Routes → Coverage | `P3 coverage: offline windows…` (85), `W2 coverage: escalation…` (82) |
| FR-110 / FR-111 | OL1 SMS channel: format, received list, instructions WAIT / CALL / CHKT / CONT / STOP / PARK, gateway status and queue, timeout + resend | Routes → Coverage | `P3 coverage: OL1 SMS channel…` (85), `W2 coverage: dispatcher SMS…` (82) |
| FR-111 | Measured from telematics: gaps per pass, ≥ 3 passes → class proposal, analyst accepts → solid line | Routes → Coverage | `W2 coverage: dead zones…` (82) |
| FR-105 | Incident close form: resolution category + text ≥ 10 characters, shown on the closed incident and in the audit log | Routes → Security | `P3 security: closing a real incident…` (85) |
| — | RU / DE / EN / KK render without undefined / NaN, DE / EN without Cyrillic | the tabs above | `P3: … render in 4 languages` (83, 84, 85) |

Not in the mock-up: real Wialon / thermochron files, SMSC.kz gateway, Open-Meteo / Kazhydromet feeds, server-side measured-zone job (documented only).

## P4 — Fleet, Staff, Partners parity

Source: platform 0.3.10 screens 10, 11, 12, 13 (`Fleet.tsx`, `Partners.tsx`, `Staff.tsx`, `Driver.tsx`, `ContactModal.tsx`). Code: `305-res-fleet-ext.js` (class, cooling, demo fleets, fees, West, compliance, deadlines), `040-fleet.js`, `310-fleet-registry.js`, `320-staff.js`, `160-partners.js` (state `S.ptx`, shared `S.partners` / `S.handovers` with the partner portal 520), `330-driver-app.js`; help `v6/help/res-fleet-partners.js`.

| FR / 0.3.10 item | Function | v6 menu → tab | Code | Test (group name starts with) |
|---|---|---|---|---|
| Screen 10 / FR-38 | KPIs by model class and cooling (`mkTrucks` trucks get class / cooling), "extended fleet +5" and "3.5 t demo" toggles; demo trucks never join `S.trucks`, trips, thermo status or costs | Fleet → Fleet | 305 `truckClass/fleetKpis/demoTrucks`, 040 | `P4 fleet: KPIs by class, demo fleets never join S.trucks` (86) |
| Screen 10 | Insurance / taxes / fees column: OGPO, KASKO, inspection, tax, tolls, fines + level "OK … blocks release"; level 3 blocks assignment | Fleet → Fleet | 305 `fees/taxPay`, `truckBlocks` hook | `P4 fleet: insurance / tax / fees column and West approval` (86) |
| Screen 10 | West approval tag (Atyrau ring) and trailer note | Fleet → Fleet | 305 `west`, 040 | same (86) |
| Screen 10 | Compliance 60 days: calibration, inspection, OGPO, cargo insurance, KASKO; calibration books a service request | Fleet → Registry | 305 `compliance/complyBook`, 310 | `P4 fleet: compliance 60 days` (86) |
| Screen 11 | City-group filter (main / transshipment / route), full table columns (2–8, ADR, GDP, response, SLA, contract), city directory with transshipment toggle | Dispatch Board → Partners | 160 `list/table/coverage` | `P4 partners: city-group filter, city directory` (87) |
| Screen 11 / FR-82 | Contact drawer with masked numbers, "Call (simulation)" reveals the number (audited `pii.read`) and logs the call, copy contacts | Dispatch Board → Partners | 160 `DRAWERS.pcontact`, `ptCall`, `ptCopy` | `P4 partners: contact drawer` (87) |
| Screen 11 / FR-121 | Renew contract: upload (SHA-256) + policy date, approval by a second role (four eyes; admin override audited) | Dispatch Board → Partners | 160 `ptRenew…ptRenewOk` | `P4 partners: contract renewal` (87) |
| Screen 11 / FR-121 | Propose demotion at SLA < 90 % with approval by a second role | Dispatch Board → Partners | 160 `ptDemote/ptDemoteOk` | `P4 partners: SLA demotion` (87) |
| Screen 11 | Route coverage by partners and reefer service per route city + "Create task" (task in Commercial → Tasks) | Dispatch Board → Partners | 160 `coverage`, `ptTask` | `P4 partners: route coverage` (87) |
| Screen 11 / FR-21 | Handover Full / Partial with SSCC check-list; candidates with price per pallet, own-trip comparison and verdict, insurance limit; Gold direct, Silver / Bronze request | Dispatch Board → Partners | 160 `handover`, `hoGive`, `hoCheck` | `P4 partners: handover Full / Partial`, `P4 partners: Silver handover` (87) |
| Screen 11 / FR-117 | Handovers with the partner-portal steps (accept with logger / °C / seal, scan, ePOD); out-of-range temperature opens a deviation | Dispatch Board → Partners | 160 `handovers`, `hoPortal` | `P4 partners: handover portal steps and ePOD on behalf` (87) |
| Screen 11 / FR-108 | ePOD on behalf of the partner: reason ≥ 10 characters and scan required, audited | Dispatch Board → Partners | 160 `hoScan/hoEpod` | same (87) |
| Screen 11 | Service on route + "Call service" (service request for the own truck), service requests close with the actual cost | Dispatch Board → Partners | 160 `serviceOnRoute`, `ptCallWs`, `wrClose` | `P4 partners: service on route` (87) |
| Screen 12 | "Where now" / hub / vehicle columns per driver | Drivers → Staff | 305 `whereNow`, 320 | `P4 staff: where-now columns and 90-day document deadlines` (88) |
| Screen 12 / FR-10 | Document deadlines 90 days: licence, medical certificate, GDP, ADR with renewal booking | Drivers → Staff | 305 `docDeadlines/docBook`, 320 | same (88) |
| Screen 13 | Admin panels "Ecosystem function coverage" (12 modules) and "Change requests" FR-52…70 (done / plan v6), hidden in the driver shell | Drivers → Driver app | 330 `ecoPanel/frPanel` | `P4 driver app: admin panels` (88) |
| Convention | All P4 tabs render in RU / DE / EN / KK without undefined / NaN; DE / EN without Cyrillic (partner names transliterated) | all of the above | 160, 305, 320, 330 | `P4 fleet / partners / staff + driver app panels render in RU / DE / EN / KK` (86–88) |

Not in the mock-up: server-side contract file storage and real PII reveal endpoint (the SHA-256 and the masked numbers are simulated), real GDP decision flow (stays in Commercial → CRM).

## P5 — Reports, Costs, Quality parity

Files: `platform-src/v6/screens/611-eco-reports-ext.js`, `600-eco-costmodel.js`, `140-quality.js`, `430-rec-insurance.js` (claim prefill); help `eco-reports.js`, `eco-costs.js`; tests `platform-src/tests/b1-eco-reports-ext.js`, `b2-eco-costs-ext.js`.

| FR / LH | Function in the mock-up | v6 menu → tab | Test (group name, file) |
|---|---|---|---|
| FR-64, FR-125 | Six KPI tiles with 8-week sparklines (OTIF, temperature compliance, volume utilisation, empty running, cost per pallet from the actuals register, incidents / 100 trips) | Reports → KPI | "reports: six KPI tiles with 8-week sparklines…" (b1) |
| FR-07, FR-64 | Driver report 30 days, fines and open amounts follow the fine register | Reports → KPI | "reports: driver report follows the fine register" (b1) |
| FR-64 | Report catalogue 6 groups × 4, PDF / Excel demo exports, every export audited (RP-nnn) | Reports → Catalogue | "reports: catalogue has 6 groups × 4 reports…" (b1) |
| FR-11, 25, 40, 153 | Linked orders with outcome and hold tag on the deviation card; insurance claim opens with DEV and order prefilled | Proof of Delivery → Deviations & quality; Billing → Insurance | "quality: linked orders with outcome and hold tag…" (b1) |
| LH-N2 | Workshop & downtime: km to TO-1 / TO-2, availability, downtime day, trip replacement, unplanned-downtime card with breakdown scenario | Billing → Cost model → Workshop & downtime | "costs: workshop & downtime…" (b2) |
| FR-46 | Drivers: FTE requirement per vehicle, crew colour, totals | Billing → Cost model → Drivers | "costs: drivers — FTE…" (b2) |
| FR-125 | Plan / actual per vehicle · month from the ledger, 6-indicator management card | Billing → Cost model → Summary | "costs: summary — 6-indicator card…" (b2) |
| FR-125 | Toll statement CSV import, de-duplicated by reference, error lines | Billing → Cost model → Summary | "costs: toll CSV import…" (b2) |
| FR-116 | Incoming partner / workshop ESF form (BIN, VAT cap, HO-/SR- link), booked to the ledger, audited | Billing → Cost model → Summary | "costs: incoming partner / workshop ESF…" (b2) |
| B7 | Insurance idle toggles with idle months and registration recommendation | Billing → Cost model → Insurance, tax, registration | "costs: insurance idle toggles…" (b2) |
| — | All P5 tabs and help articles render in RU / DE / EN / KK without undefined / NaN | all of the above | "[ru/de/en/kk] P5 …" (b1, b2) |

## Q1 — Animated help diagrams

| FR | What | Where in v6 | Test (c1-help-visuals) |
|---|---|---|---|
| FR-138 | Figure kit ported from 0.3.10 kit.tsx: title, ‹ ▶/❚❚ › controls, "Step N of M", live caption, "All steps (N)" list with clickable steps; repaint in place (attribute morph, CSS transitions) | help/60-visuals.js (HELP.fig), app.css "Q1 animated help figures" | "help visuals: stepper next / prev / step list…" |
| FR-138 | Stepper: one interval per figure id only while it is in the DOM and visible, paused in a hidden tab, prefers-reduced-motion starts paused, cleared when the figure leaves the DOM | help/60-visuals.js (hvSync, HELP.hvTimers) | "[ru/de/en/kk] … timers cleared after closing", "leaving help clears the timers" |
| FR-138 | Truck finder figure exactly as 0.3.10: matrix 5 candidates × 8 checks, seesaw tilt by centre of gravity, front / rear axle bars red over the limit with +excess tag, recommendation on the last step | Help → Load and weight, Fleet → Registry, ◇ Diagram on Load & weight / Shipping / Billing | "help visuals: truck seesaw — … step 4 …" |
| FR-138 | Loading instruction figure (v6): orders → zones → weight / axles → split → LIFO order → weighing | Help → Load and weight, ◇ Diagram on Orders / Load & weight | "help visuals: truck seesaw …" (load steps 3 / 4) |
| FR-138 | Animated ports of flow, split, coldchain, coverage, booking, express, approvals, driver (driverDay), dispatchMock; v6-only gonogo animated (nine gates, No-Go on step 3) | help articles with visuals, ◇ Diagram popover | "[ru/de/en/kk] help visuals: every figure renders every step…" |
| FR-138 | "◇ Diagram" popover shows several figures for one tab (orders/loadw = truck + load) | screens/001-shell-ext.js (DIAG, diagIds) | "[ru/de/en/kk] … Load & weight ◇ Diagram …" |
| FR-138 | 0.3.9 players (shipflow, expresspath, alarmflow) run on the same kit, no full render every 4 s | help/65-players.js | "help: Schaubilder players …" (d0) |
| — | All figures, every step, in RU / DE / EN / KK without undefined / NaN; DE / EN without Cyrillic | all of the above | "[de/en] … no Cyrillic" |

## Q2 — UI language consistency

| Ref | What | Where | Test |
|---|---|---|---|
| Q2 | Audit: DE / EN show no Cyrillic in visible text or title / placeholder / aria-label / alt — every screen × tab (admin and the driver / customer / partner / dispatcher / finance shells), all load-drawer tabs for every load, the main drawers and the six report drawers; before the fix 208 fragments per language, after 0 | whole platform | "[de/en] language audit: no Cyrillic in any screen, tab or drawer" (62) |
| Q2 | `nm()` in core.js: people, companies, streets and initials in the UI language — RU / KK keep the Cyrillic source, DE / EN get the romanisation table (Yerlan Seitkali, Askhat Nurgaliyev, Apteka Service LLP, Kazhydromet, IS ESF …) or Kazakh-style transliteration; initials follow the Latin name (ЕС → YS) | data.js, shell users, Settings → Users / Integrations, Orders → Commercial, portals | (62) |
| Q2 | Alarm, inbox, booking, claim and POD rejection texts as T()-tuples; billing routes via HUBS city names; trip-sheet prefix PL-, unit ₸/l, RTO / ESF / MTPL / VRC labels in DE / EN; place reference data labelled in the UI language | Dashboard → Alarms / Inbox, Orders → Bookings, Billing, Dispatch → Express, Fleet, Settings → Reference data | (62), "inbox: routing … translit on DE/EN" (90) |
| Q2 | Address check accepts the Cyrillic directory name and its romanisation, so DE / EN address books stay "found in directory" | Orders → Commercial → Customers, Customer portal → Book | "[ru/de/en/kk] names in the UI language: RU / KK keep Cyrillic, DE / EN romanised, address check accepts both" (62), address checks (a0) |

## Q3 — Explanatory notes parity

Files: `platform-src/v6/screens/003-notes.js` (all texts, `howNote(key)` → `<p class="note" data-note="key">`), one-line insertions in the screens below; map `docs/NOTES-0.3.10-v6.md`; test `platform-src/tests/c2-notes.js`.

| 0.3.10 source | Notes (data-note) | v6 menu → tab | Screen file | Test (group name, file) |
|---|---|---|---|---|
| Load & weight | third, axle, trailers | Orders → Load & weight (Orders on load, Weight / volume / axles, Truck finder) | 210 | "notes: all 26 ported 0.3.10 notes render in place · RU / DE / EN / KK" (c2) |
| Shipments, Documents KZ | track, gate, gonogo | Orders → Shipments & labels; Orders → Documents KZ | 220, 230 | "notes: all 26 ported 0.3.10 notes render in place · RU / DE / EN / KK" (c2) |
| Bookings, Commercial, customer portal | tariff (adapted to v6 bookingPrice), leadHint, bookTerms | Orders → Bookings; Orders → Commercial → CRM; customer portal → Book a shipment | 420, 500, 510 | "notes: all 26 ported 0.3.10 notes render in place · RU / DE / EN / KK" (c2) |
| Partners | tiers, handover | Dispatch Board → Partners | 160 | "notes: all 26 ported 0.3.10 notes render in place · RU / DE / EN / KK" (c2) |
| Fleet, Staff, Drivers, Driver app | fees, west, urgent, pdNote, drvOnly | Fleet → Fleet; Drivers → Staff; Drivers → driver card; Drivers → Driver app | 040, 320, 050, 330 | "notes: all 26 ported 0.3.10 notes render in place · RU / DE / EN / KK" (c2) |
| Temperature, Weather, Security, Coverage, Thermochrons | twolevel, sim, wxrisk, escal, covSchem, thChron | Routes & Tracking → Temperature / Weather & risks / Security / Coverage / Thermochrons & loggers | 150, 340, 360 | "notes: all 26 ported 0.3.10 notes render in place · RU / DE / EN / KK" (c2) |
| Quality, Cost model, Reports, Reference data | capa, costExcl, fineLink, mdVerified | Proof of Delivery → Deviations & quality; Billing → Cost model; Reports → Fines; Settings → Reference data | 140, 600, 610, 440 | "notes: all 26 ported 0.3.10 notes render in place · RU / DE / EN / KK" (c2) |
| Convention | every NOTES key has RU / DE / EN / KK, DE / EN without Cyrillic, and every key is placed and checked | all of the above | 003 | "notes: every key in NOTES has RU / DE / EN / KK text…" (c2) |

## Q4 — Narrow-window layout

| Requirement | Implementation | Where | Test (63-narrow.js) |
|---|---|---|---|
| FR-133 | Top bar ≤ 1100 px: breadcrumb one line with ellipsis, hidden ≤ 700 px; user name hidden; only the search box shrinks, every other item keeps its size | core.js header, app.css "Q4" block | "narrow 768 px: burger … breadcrumb one line" |
| FR-133, FR-163 | Search ≤ 700 px collapses to a magnifier (`.gs-ico`, `ACT.gsTog`) that opens the full-width combobox with scanner toggle; Esc / second click closes and clears | 001-shell-ext.js `shellSearchBox`, app.css | "narrow 375 px: … search and "⋯" overflow" |
| FR-133 | Hub filter + clock (≤ 900 px) and role + theme toggle (≤ 1100 px) move behind "⋯" (`.tb-x`, `ACT.tbMore`, hook `shellTopMore`); Esc closes; alarms button always stays (label shortened to the count ≤ 700 px) | core.js, 001-shell-ext.js, app.css | "narrow 375 / 768 px: … '⋯' shows hub filter, clock, role" |
| FR-133 | Page header wraps: title on its own line, sub-text below, actions as a row of one-line buttons; ≤ 700 px the header is not sticky; ≤ 600 px smaller title and buttons | app.css | "[ru/de/en/kk] narrow 375 / 768 px … titles and header buttons stay whole" |
| FR-133 | No sideways page scroll: grid children shrink (`min-width:0`), stacked grids use `minmax(0,1fr)` (grid2, sh/lw/dk grids, set-body, driver-app frame), hub cards 2 → 1 columns, integrations 2 → 1, KPI rows 2 columns ≤ 900 px and 1 ≤ 420 px, wide tables scroll inside `.card-body` / `.tcard`, pill tabs wrap | app.css | "[ru/de/en/kk] narrow 375 / 768 px: every screen, tab and load-drawer tab fits" |
| FR-133 | Drawers full-width ≤ 700 px and above the phone bottom bar | app.css | same, "drawer is full-width on a phone" |
| FR-133 | Burger opens / closes the off-canvas menu (backdrop click, menu item) at 375 and 768 px; desktop 1316 px keeps search, hub filter, clock, role inline | core.js (unchanged burger), app.css | "narrow … burger opens and closes the menu", "wide 1316 px …" |

## R3 — Hub inbound (I-1…I-7)

Files: `platform-src/v6/screens/085-hub-inbound.js` (new), hooks in `080-receiving.js` (`recvCalc`, `RECV_IST`, gate-check button), help `platform-src/v6/help/hub-inbound.js`, notes `ibDwell` / `ibSlot` / `ibPre` / `ibDem` / `ibGate` in `003-notes.js` (rows added to `c2-notes.js`); map `docs/IDEAS-R3.md`; test `platform-src/tests/e3-hub-inbound.js`.

| Idea | Feature | v6 menu → tab | Screen file | Test (group name, file) |
|---|---|---|---|---|
| I-1 | Inbound list per hub: vehicle, direction, job / load, priority, slot, status chips; filters hub / direction / priority / status + global hub filter | Hubs → Inbound list | 085 | "I-1 inbound list: every arriving vehicle …" (e3) |
| I-2 | Senders / unloading points as numbered chips, hover text, colour by status (incl. SSCC shortage per sender) | Hubs → Inbound list | 085 | "I-2 senders as numbered chips …" (e3) |
| I-3 | Pre-carriage pickup (date, forwarder, plate to follow, kg / m³ / pieces per point) creates an expected inbound job | Hubs → Pre-carriage | 085 | "I-3 pre-carriage …" (e3) |
| I-4 | 30-min gate slots per hub, fixed appointments refused, overlap / blocked / zone conflicts, booking from the inbound list and grid | Hubs → Gate slots | 085 | "I-4 gate slots …" (e3) |
| I-5 | Overdue dwell red, hover with period, minutes, delay yes / no | Hubs → Inbound list | 085 | "I-5 overdue dwell red with hover …" (e3) |
| I-6 | Demurrage auto ₸ from overrun, four eyes (trips:status + costs:approve), line in Costs, re-charge open / invoiced / paid / waived with reason | Hubs → Demurrage; Billing → Costs | 085 | "I-6 demurrage …" (e3) |
| I-7 | Gate check: actual temperature, logger take-over, SSCC reconciliation (ops SSCC model read-only) | Hubs → Receiving → job card → Gate check | 080, 085 | "I-7 gate check …" (e3) |
| all | Four tabs + three drawers render in RU / DE / EN / KK, DE / EN without Cyrillic, help articles and "?" context | Hubs | 085, help/hub-inbound.js | "[ru/de/en/kk] hub inbound: four tabs and three drawers render …" (e3); "notes: all … render in place" (c2) |
