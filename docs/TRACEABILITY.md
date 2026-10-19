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
