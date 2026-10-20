# Mirror 0.3.9 → v6: resources, economics, records and portals (R2)

Re-audit of release 0.3.9 (`releases/0.3.9/platform-en.html`, sources `Olymp-Logistic-Platform/frontend/src` v5/screens and pages) against v6.2.1 (`platform/en.html`), element by element: every tab, KPI, card, column, button, drawer, dialog, empty state, warning, role difference and four-eyes flow of screens 09–17 and the pages /book, /my-bookings, /bookings, /partner, /request, /track, /insurance, /crm, /customers, /drivers, /planning lines, /master-data, /oncall, /users, /integrations, /audit, /account. Hubs / receiving (R3), screens 01–08 and shell (R1) are out of scope.

Each audit table lists: function, 0.3.9 place, v6 place, state **before** R2 (present / cut / missing / n-a) and the action. The "Port result" table under it gives the state **after** R2 and the test group (`platform-src/tests/e2-mirror-res.js`, all group names start with "R2").

## Summary

| | Count |
|---|---|
| Functions audited | 297 |
| Already present before R2 | 150 |
| Cut down before R2 | 97 |
| Missing before R2 | 38 |
| Not applicable (backend only) | 12 |
| Port rows after R2: ported | 128 |
| Port rows after R2: skipped (8: cosmetic or another stream's file) or found already present on closer look (3) | 11 |

A port row can cover several audit rows (e.g. one role-gating row per screen). All mandatory cut / missing functions (A 20, B 6, C 19 + 5 defects, D 21) are ported, except the truck-finder part of F19, which needs R1's file; the skipped rows are cosmetic or need a file of another stream (listed in "Left" below). Cosmetic cut rows that are not in a port table stay as described in the audit "Action" column.

### Cross-cutting findings
- Role gating: 0.3.9 hides write actions without the right (quality:write, fleet:write, drivers:write, fines:write, partners:write, crm:read / crm:write, planning:admin, pii:read, users:admin, integrations:admin). v6 showed them to every role that could open the tab. R2 gates both the buttons and the `ACT` handlers (toast "Needs the right …").
- Booking data defects D1–D5 (portal bookings without history, non-hub cities, desk price with 12 % VAT, declared value, express not reaching the three-function approval) are fixed.
- `docs/PARITY-0.3.10-v6.md` marked 12 Staff, 14 Planning and the records / portal pages as ✅; the re-audit found cut-down functions there, now ported.

### Left (other streams / not in the mock-up)
- R1 (`200-ops-model.js`): the truck finder calls its local `truckProf`; it should call `globalThis.truckProf` so calibrated vehicle profiles (F19) reach the finder candidate list. Approved road-restriction versions already update `RESTR` in place.
- R1 (`240-ops-dispatch.js`): untouched; the portal express booking is pushed into `S.express` and decisions are written back by wrapping `exSign` / `exReject` / `exTick`.
- Customer-portal price (`bookingPrice`) still uses the zone rates; the new hub × class "Tariffs (net)" drive `RES.route` and the lines table.
- Backend only: real login security / 2FA / hashing, rate limit and form token on /request, NCALayer signing, KGD register lookup, inbound webhooks list, server-side contract storage.

## Audit A: 09 Quality, 10 Fleet, 12 Staff, 13 Driver app, 14 Planning

Audit counts: cut 24, missing 7, n-a 4, present 48

Sources read: `frontend/src/v5/screens/{Quality,Fleet,Staff,Driver,Planning}.tsx`, `v5/epodCapture.tsx`, `pages/{FleetRegister,VehicleSetup,Resources}.tsx`, `v5/engine/{quality,fleet,staff,planning,driver}.ts`, `backend/app/v5/reference/mock-v5.en.json` (DV, STAFF, STYPE, BL_PF), `backend/tests/test_access_matrix.py` (roles).
v6: `platform-src/v6/screens/{140-quality,040-fleet,305-res-fleet-ext,310-fleet-registry,300-res-data,320-staff,330-driver-app,030-dispatch,240-ops-dispatch,260-ops-plan,200-ops-model}.js`, `roles.js`, `role-perms.json`.

Role reference (0.3.9 backend): `quality.step` = quality:write (admin, warehouse, quality); `staff.assign` / `staff.book` = drivers:write (admin only); `driver.*` = driver only (all other roles see the app read-only); fleet edits = fleet:write (admin only). v6 roles.js has the same perms in `role-perms.json`, but **none of the action handlers in 140/310/320/330 check `canDo`** (only `qClaim` does). Screen/tab visibility itself matches (fleet:read, drivers:read, trips:read).

Legend — State: present / cut (partially) / missing / n-a. Prio: M = mandatory, C = cosmetic.

### 09 Quality

| # | Function | 0.3.9 place (screen → tab/card) | v6 place (menu → tab, file) | State | Action (what to port, with texts and demo values) |
|---|---|---|---|---|---|
| Q1 | Deviation list (level tag, title, `id · text`, click selects, selected highlighted) | 09 → card "Deviations" | Proof of Delivery → Deviations & quality, 140 `listH` | present | — |
| Q2 | First deviation auto-selected; empty state "No open deviations" | 09 → card "Deviation process" | 140 `detail` shows "Select a deviation on the left." | cut (C) | Optional: default `F.dev` to first open deviation; when `S.devs` empty show "No open deviations". |
| Q3 | Deviation process header ("Deviation process · DEV-…"), title, help tip `capa` | 09 → "Deviation process" | 140 `detail`, `howNote('capa')` | present | — |
| Q4 | Linked orders with outcome (returned / released / delivered in quarantine / quality hold · delivery blocked) + "hold" tag | 09 → process card | 140 `ordersH/devOrders` (P5) | present | — |
| Q5 | "Insurance claim" per order (only real deviation + insurance page access) → claim pre-filled with DEV + order | 09 → process card | 140 `qClaim` (canSee billing + quality:write) | present | — |
| Q6 | 7-step stepper (Alarm recorded … CAPA recorded), step 5 label switches to "Goods released" / "Goods blocked (quarantine)" | 09 → process card | 140 `STEPS`, `detail` | present | — |
| Q7 | "Next step" button — only for quality:write (`mayStep = sim ‖ can('quality.step')`) | 09 → process card | 140 `qNext` button always rendered, no check | cut (M) | Hide "Complete step" / "Release goods" / "Block (quarantine)" unless `canDo('quality:write')`; guard `ACT.qNext/qDec` too. See spec Q7. |
| Q8 | QA decision at step 4: "Release goods" / "Block (quarantine)" (single decision, no four-eyes in 0.3.9) | 09 → process card | 140 `qDec` | present | Gate with Q7. |
| Q9 | Closed note "Deviation closed · report for KDL Olymp ready" | 09 → process card | 140 "Deviation closed, report ready." | present (C wording) | Optional wording alignment. |
| Q10 | CAPA text block | 09 → process card | 140 `detail` | present | — |
| Q11 | Logger calibration register: cards per thermo vehicle with logger ID `L-2201…`, vehicle, "· until MM.YYYY · certificate in system", status valid / expiring / EXPIRED | 09 → "Logger calibration register" | 140 `calib` (plate + reefer unit, chip from `docState`) | cut (C) | Optional: show a logger ID (e.g. `L-22` + index) next to the plate. |
| Q12 | "Order calibration L-2208" (demo toast "Calibration request L-2208 sent to the lab (demo)") | 09 → register header | 140 `qCal` per non-valid truck ("Calibrate") | present | Note: `qCal` renews immediately; 0.3.9 only sends a request. Consider routing it through `RES.svcCreate({kind:'calib'})` like 310 `complyBook` (status "Requested"). |
| Q13 | Demo deviations DEV-0029 (closed, +9.1 °C Shymkent), DEV-0033 (logger calibration expired V01), DEV-0041 (thermochron TH-02), alarm-training DEV-SIM-F/O | 09 → list | 140 seeds DEV-0011, CAPA-0019 + one per `problem` load; 330 `daThermo` opens deviations | cut (C) | Optional: seed one closed deviation (step 7, decision release) so the "Closed" state is visible. |
| Q14 | Real DB deviations (FR-103), server step action | backend | — | n-a (backend) | — |

### 10 Fleet (Fleet.tsx + FleetRegister.tsx + VehicleSetup.tsx + Resources.tsx VehicleForm)

| # | Function | 0.3.9 place | v6 place | State | Action |
|---|---|---|---|---|---|
| F1 | KPIs: Vehicles total, by model class/cooling, Without active cooling, On the road (+ demo rows) | 10 → KPI row | Fleet → Fleet, 305 `fleetKpis`, 040 `classKpis` | present | — |
| F2 | Toggle "Show extended fleet · +5 vehicles" / "Real fleet only · 4 vehicles" + demo note | 10 → button row | 040 `demoBar`, 305 `DEMO_X` | present | — |
| F3 | Checkbox "Demo: +2 vehicles 3.5 t (JAC N35 reefer, GAZelle NEXT …)" + note | 10 → button row | 040 `demoBar`, 305 `DEMO_35` | present | — |
| F4 | Table: Vehicle·plate, Class, Status (on the road / at hub / reserve / workshop, "· demo") | 10 → table | 040 `table` | present | — |
| F5 | Model cell with winter equipment ("winter tyres, chains, insulated thermo containers" / "winter tyres, parking heater" / "winter tyres") and "ADR yes / —" | 10 → table col Model | 040 `table` shows model + zones only | cut (M for ADR, C for winter) | Add per-truck `adr` flag (use `ADR_TRK` of 200-ops-model) and a winter-kit text; show `ADR yes/—` under the model. |
| F6 | Columns Pal., Chambers (regime text), Service, Logger until (red if expired) | 10 → table | Fleet → Registry 310 cols `cap`,`zones`,`svc`,`calib`; Fleet table has class/cooling | present (moved) | — |
| F7 | "Insurance, taxes, fees" column (OGPO, KASKO, Inspection, Tax, Toll roads, Fines, note, level OK / due soon / action needed / blocks release) | 10 → table | 040 `feesTd`, 305 `fees` | present | — |
| F8 | "West" approval tag | 10 → table | 040 `westTd`, 305 `west` | present | — |
| F9 | Trailer note | 10 → under table | 040 | present | — |
| F10 | Register view selector "View: Standard / saved ★", default view auto-applied on load | 10 register | Fleet → Registry, 310 `rgf=view` | cut (C) | Optional: on first render apply the view with `def:true`. |
| F11 | Column chooser "Columns (n/m)", last column cannot be unticked | register | 310 `rgCols`, `.rg_col` | present | — |
| F12 | "Save view…" (name prompt, saved as default) / "Delete view" | register | 310 `rgSave/rgDel` | present | — |
| F13 | "CSV ↓" exactly the visible columns (`;`, BOM, formula neutralised, `fleet-register-YYYY-MM-DD.csv`) | register | 310 `rgCsv` | present | — |
| F14 | Register columns ID, Capacity "kg · pal", KASKO until, Logger "ID date", ADR, Load profile "✓ / class default" | register COLS | 310 COLS (no capacity kg, KASKO, logger ID, ADR) | cut (M) | Add columns `kasko` "KASKO until" (`S.res.fleet.kasko[t.id] ‖ docs.osago`), `adr` "ADR" (ADR / —), `kg` "Capacity" (`kg · pal`), logger ID in `calib`. See spec F14. |
| F15 | Vehicle master form create / edit (FR-78): ID, Plate, Model, Hub, Capacity kg, Pallet places, chambers (Chilled/Ambient/Frozen), "ADR approval", Status active/maintenance/inactive, Service, Insurance, OGPO until, KASKO until, Inspection until, Logger, Calibrated until; row button ✎ (fleet:write) | Fleet page header "+ Vehicle", row ✎ | 040 `addTruck` (plate, make, pallets, hub, zones only), no edit | cut (M) | Add "Edit" drawer for existing trucks + extend add form. See spec F15. |
| F16 | Row button "Onboarding" (vehicle not released) / "Profile" | register row | 310 row click → `regTruck` drawer; status "Onboarding open" | present | — |
| F17 | Onboarding checklist FR-157: 6 items, auto items, Confirm with "STS no." / "ADR certificate no." input, note texts (in service before checklist / closed / not offered…), "Close onboarding — release for planning" disabled until complete | VehicleSetup | 310 `regTruck` `obRows`, 300 `obState/obConfirm/obClose` | present | — |
| F18 | Tachograph item: two buttons "fitted" / "not fitted"; ADR number input only if vehicle ADR-approved | VehicleSetup | 310 generic input + Confirm (ref defaults to "fitted") | cut (C) | Optional: two buttons; store `ref` "fitted"/"not fitted". |
| F19 | Load profile form (FR-141): Source, Date, Document, **Zones (1 zone / 2 zones / no temperature control)**, **Pallet places**, **Volume m³**, empty axle masses, gross, axle limits, **Internal height / length / width**, wheelbase, front axle → wall, consumption, **Thermo-container places (z1)**, **Bulkhead split / min / max / step (z2)** | VehicleSetup form | 310 `regTruck` (9 numeric fields only), 300 `lpSave` | cut (M) | Add missing fields, and use `t.lp` in the load engine (200 `truckProf` ignores it). See spec F19. |
| F20 | Axle shares by lever rule note | VehicleSetup | 310 `lp_geo`, 300 `axleShares` | present | — |
| F21 | Write permission fleet:write: fields disabled, Confirm / Close / Save / Edit hidden for other roles | VehicleSetup, Resources | 310/040 no `canDo` | missing (M) | See spec F21. |
| F22 | Sensor → chamber mapping, thermochron CSV upload (ChamberTools) | Resources (temperature) | 360 thermo ext | n-a (other audit scope) | — |
| F23 | Truck drawer, maintenance, service requests, warranty, compliance 60 days, slot capacity | (0.3.10 / v6 extras) | 040, 305, 310 | present (extra) | — |

### 12 Staff

| # | Function | 0.3.9 place | v6 place | State | Action |
|---|---|---|---|---|---|
| S1 | KPI tiles by staff status: On trip, Duty / reserve, Sick leave, Vacation, Training, Onboarding, Leaving | 12 → KPI row | Drivers → Staff, 320 `body` (Available now, On trip, Absent today, Driving-time warnings, Medical today) | cut (C) | Optional: chips with counts per absence type (`R.ABS`) under the KPI row. |
| S2 | "Where each driver is now": Driver (+ cat.), Hub, Status, Where now, Veh., ADR until (+ "expires in N days" ≤ 60 d), Tachograph ("drive X h · left Y h · continuous Z h") | 12 → table | 320 `staffTable`, 305 `whereNow` | present | — |
| S3 | Status vocabulary trip / duty / rest / sick / vacation / training / onboarding / leaving | 12 → status tag | 320 `DS` = Available / On trip / Rest-absent (absence type in "Where now") | cut (C) | Optional: status chip from `R.absence(d).type` label. |
| S4 | Global hub filter applies to staff table and KPIs (`hubOk`) | 12 | 320 uses all `S.drivers` | cut (M) | Wrap `S.drivers` with `hubFilter` (as in 040) for table, KPIs, plan. |
| S5 | Urgent trip: hub selector, "ADR needed", "vehicle 7.5 / 12.5 t" | 12 → "Urgent trip · who can go" | 320 `urgent` (hub, zone, ADR) | cut (M) | Add toggle "vehicle 7.5 / 12.5 t" (rejects licence B and 3.5 t class). See spec S5. |
| S6 | Driver candidates graded now / later / no with reason (already assigned, licence not valid, hours rules, no ADR certificate, licence C needed) | urgent card | 320 drivers list "can go" / "—" with reasons | cut (C) | Optional "later" grade (driver resting but free within 6 h). |
| S7 | Free vehicles of the hub with reasons: assigned to urgent trip, in service, on the road, busy trip, onboarding open, **logger calibration expired**, fees block, **3.5 t class**, **no ADR approval** | urgent card | 300 `urgent` trucks (other hub, status, zone, truckBlocks: onboarding, service, fees) | cut (M) | Add truck reasons "logger calibration expired", "no ADR approval" (when ADR needed), "3.5 t class — 7.5 / 12.5 t needed". |
| S8 | "Assign: <driver> + <vehicle>" (drivers:write only) / hint "No free vehicle … subcontractor (S130)" | urgent card | 320 `stAssign` "Assign to LD-…", red hint | cut (M) | Present functionally; gate button with `canDo('drivers:write')`. |
| S9 | Driver document deadlines · 90 days + "Book renewal" (drivers:write) → "booked · ADR course DD.MM" / "Public service centre (CON) DD.MM" | 12 → section | 320 `deadlines`, 305 `docDeadlines/docBook` | present (gate missing) | Gate "Book renewal" / "Book course" with `canDo('drivers:write')`. |
| S10 | Staff plan · 14 days with codes T/D/·/S/V/Tr/O/H and legend | 12 → section | 320 `plan`, 300 `plan14` | present | — |
| S11 | Role gating: assign / book only drivers:write (admin); auditor, manager, finance, dispatcher read-only | 12 | 320 all buttons for all drivers:read roles (also medical ✓/✗, absences, fines) | missing (M) | See spec S11. |
| S12 | Absences, medical check, fines, driving-time bars, year hours | (v6 extras) | 320 | present (extra) | — |

### 13 Driver app (Driver.tsx + epodCapture.tsx)

| # | Function | 0.3.9 place | v6 place | State | Action |
|---|---|---|---|---|---|
| D1 | Bound to own active trip; empty state "No active trip" + explanation | 13 | Driver shell / Drivers → Driver app, 330 `myLoad`, route/stop "No active trip" | present | — |
| D2 | Other roles see the app as **read-only preview** (`ro = !can('driver.step')`); driver page visible to admin, dispatcher, warehouse | 13 | 330 admin preview fully interactive (driver selector); tab visible to drivers:read roles | cut (M) | See spec D2. |
| D3 | Status bar: clock, network toggle, language RU / KZ / DE / EN | phone | 330 `phone` (`daNet`, `daLang`) | present | — |
| D4 | Offline banner, queue, "Simulation: +15 min offline", SMS mode > 30 min with OL1 lines | phone | 330 `banner`, `emit/sync`, `daOffAdd` | present | — |
| D5 | Six tabs Stop / Shift / Route / Returns / Fuel / Me | phone | 330 `TABS` | present | — |
| D6 | Stop flow: arrival → temperature reading → photo → signature (signer, role, pad, Clear) → "ePOD sent" | Stop tab | 330 `stopTab` steps 0–4, `daSign` | present | — |
| D7 | Multi-drop: after ePOD "Next stop" moves to the next delivery stop | Stop tab | 330 one unload stop per load | cut (M) | See spec D7. |
| D8 | ePOD evidence record: device time vs server time, position + source, ✍ signature SHA-256 + hash check, 📷 photo SHA-256 + check, scanned n / expected, thermochron range ✓/✗, prelim/final | Stop tab `EpodRecord` | 330 `epodCard` (time, coords, temp, signer, photo hash, order status) | cut (C) | Optional: add "scanned n / m" and signature hash line; server time / hash verify are n-a (backend). |
| D9 | Real camera / file upload, JPEG compression ≤ 1600 px, object-store upload | epodCapture | 330 simulated hash | n-a (backend) | — |
| D10 | SSCC scan list with per-package "shortage" exception | Stop tab | 330 `daScan`, `daExc short` | present | — |
| D11 | Thermochron min / max read-out → ✓/✗ | Stop tab | 330 `daThermo` | present | — |
| D12 | Exceptions grid (damage, shortage, refusal …) | Stop tab | 330 `EXC` | present | — |
| D13 | Shift: pre-trip checklist with refs, "fix logger" for expired calibration, trip sheet sign (+ odometer), waiting / signed states, trip documents list | Shift tab | 330 `shiftTab` (+ medical) | present | — |
| D14 | Route: driving / break / left timer, stops with ETA, items, window, weather, road note, coverage note | Route tab | 330 `routeTab` | present | — |
| D15 | Returns with accept buttons and kg total | Returns tab | 330 `retTab` | present | — |
| D16 | Fuel form (litres, price, odometer, receipt photo hash), consumption, fills list | Fuel tab | 330 `fuelTab` | present | — |
| D17 | Me: messages + read receipt, fine "Agree to deduction" / "Dispute", incidents (breakdown opens partner contact), profile + earnings, end shift (defect toggle, odometer) | Me tab | 330 `meTab` | present | — |
| D18 | Footer button "ADR instructions in writing" toggling the instruction text | phone footer (all tabs) | — (ADR instruction only as a KZ document in 230 `adrinst`) | missing (M) | See spec D18. |
| D19 | Footer button "Report deviation" → Quality screen | phone footer | — | missing (M) | See spec D19. |
| D20 | SOS button in the footer, reachable from every tab | phone footer | 330 SOS only in Me tab | cut (M) | Move / duplicate SOS into a footer row under every tab. See spec D19. |
| D21 | Side panel "Feedback to dispatch · N" event feed | side | 330 `side` | present | — |
| D22 | Ecosystem function coverage table; Change requests FR-52…70 | side | 330 `ecoPanel/frPanel` (admin only) | present | — |
| D23 | SMS through gateway simulation / HMAC verify (FR-136) | backend | — | n-a (backend) | — |

### 14 Planning

| # | Function | 0.3.9 place | v6 place | State | Action |
|---|---|---|---|---|---|
| P1 | Scenario toggles (3) with label + sub, help tip `scen` | 14 → "Scenarios" | Dispatch → Planning, 240 `extras` `SCEN` (+ target fleet) | present | — |
| P2 | Baseline-from-data note | 14 → capacity | 240 `extras` header note | present | — |
| P3 | 7-day table: day labels | capacity | 240 (+ weekend / holiday labels) | present | — |
| P4 | Rows Vehicles needed / Vehicles available / Reserve / shortfall (±n, red/amber/green) / Demand pal. | capacity | 240 Demand pallets, Trucks available, Capacity pallets, Utilisation % | present (different unit) | — |
| P5 | Service note in the available cell (" · service V03" / " · service <codes>") | capacity | 240 — | cut (C) | Optional: append trucks with open service request (`RES.svcOpen`) to the "Trucks available" cell. |
| P6 | Drivers available row highlighted amber when drivers < needed + 1 | capacity | 240 "Drivers" row, no colour | cut (C) | Optional: `warn` class when `drivers < trucks + 1`. |
| P7 | Row "Weather / road risk" per day (level label, coloured) | capacity | 240 — | missing (M) | See spec P7. |
| P8 | Recommendations: shortfall (with affected trips and actions), drivers shortage, weather risk with trips, scenario texts (Buran / V01 repair / peak), "Capacity sufficient for 7 days. Reserve — N veh." | 14 → "System recommendations" | 240 shortfall lines + "No shortfall …" | cut (M) | See spec P8. |
| P9 | Shortfall action buttons: "Handover request to a partner", "External carrier · cost check", "Express decision" | recs card | — | missing (M) | See spec P9. |
| P10 | "Planning factors" card (7 rows) | 14 → card | — (`ECO_BL` has other baseline data) | missing (M) | See spec P10. |
| P11 | Trip planning records (unassigned orders, booked departures, plan-trip form), target fleet, KZ calendar | (0.3.10 / v6 extras) | 260, 240 | present (extra) | — |

### Port result a (state after R2): ported 20, skipped 3

| Audit row id | Function | v6 place (menu → tab, file / function) | State after port | Test group name |
|---|---|---|---|---|
| Q7 (+Q8) | CAPA "Complete step" / "Release goods" / "Block (quarantine)" / "Calibrate" only for quality:write | Proof of Delivery → Deviations & quality; 140 `detail`, `calib`, ACT `qNext/qDec/qCal` | ported. Without quality:write the buttons are hidden and a read-only note is shown; the handlers refuse with a toast. Allowed roles: admin, warehouse, quality. | R2 Q7 quality: CAPA step buttons and handlers need quality:write |
| Q2 (C) | First open deviation pre-selected; "No open deviations" | 140 `detail`, `selId` | ported | R2 Q2/Q9/Q11/Q13 quality: … |
| Q9 (C) | "Deviation closed · report for KDL Olymp ready" | 140 `detail` | ported | same |
| Q11 (C) | Logger ID in the calibration register | 140 `calib` (`t.logger`) | ported | same |
| Q12 (C) | Calibration as a lab request instead of an instant renewal | 140 `qCal` | skipped (behaviour change; an existing test, 50-legacy "calibration registry unblocks pharma assignment", relies on the instant renewal). Now gated by quality:write. | — |
| Q13 (C) | Seeded closed deviation DEV-0029 (step 7, release) | 140 seed; the `openDeviation` ID generator skips IDs that already exist | ported | same |
| F5 | ADR yes / — and winter kit under the model | Fleet → Fleet; 305 `R.fleetMeta`, `R.winter`; 040 `table` (`data-fleet-adr`) | ported (`t.adr` from `ADR_TRK`, demo V05/V06 ADR; `t.kg`, `t.logger`, `t.code`) | R2 F5 fleet: ADR flag and winter kit under the model |
| F14 | Register columns ID, Capacity "kg · pal", KASKO until, ADR, logger ID in calibration | Fleet → Registry; 310 `COLS` (`code`, `kg`, `kasko`, `adr`, `calib`) | ported. ADR is shown by default; ID, Capacity and KASKO are optional. CSV follows the visible columns. | R2 F14/F10 registry: … |
| F10 (C) | Default ★ view applied on load | 310 `body` (`viewInit`) | ported | R2 F14/F10 registry: … |
| F15 | Vehicle master form, edit an existing truck | Fleet → truck card / Registry card → "Edit"; 040 `DRAWERS.editTruck`, `truckSave`, ACT `truckEdit/truckSave/truckEditCancel`. Add form extended with Capacity kg, Logger, ADR approval. | ported. The fields are ID, plate, make, type, hub, status, capacity kg, pallets, chambers, ADR, next service, cargo insurance, OGPO, KASKO, inspection, logger and calibration. Save is disabled without a chamber, and the changed fields go to the audit log. Status "inactive" is not offered: v6 core `TS` / `truckState` have no inactive state, and they are core consts that cannot be wrapped. | R2 F15 fleet: edit vehicle master data … |
| F18 (C) | Tachograph "fitted" / "not fitted" buttons | 310 `regTruck` `obRows`, ACT `obOk` (`data-ref`) | ported | R2 F18/F5 onboarding: … |
| F5 / F17 | ADR checklist item only for ADR-approved trucks | 300 `R.obState` (auto "not required" when `t.adr === false`) | ported | R2 F18/F5 onboarding: … |
| F19 | Load profile: zones variant, pallet places, volume, internal height / width, thermo-container places (z1), bulkhead split / min / max / step (z2); engine uses the profile | 310 `lpExt` + `lpSave`; 300 `R.lpDefaults`, `R.lpSave`, `R.lpApply`; global `truckProf` and `profFacts` wrapped in 300 | ported, with a gap. The wrapped global `truckProf` is used by Orders → Load & weight (210 `typeFor`, vehicle "f:<truck>"). It applies pal, m3, internal height, thermo containers, the bulkhead, empty axle masses, gross, and axle limits (× axle count). `profFacts` adds "vehicle profile · STS dd.mm.yyyy" or "class default". **Left for R1:** the truck finder inside 200-ops-model calls its local `truckProf` const (candidate lists at lines ~319 / ~349), so it still uses catalogue values. 200 must call `globalThis.truckProf` there. The axle *shares* (`axF/axR`) are not taken from `R.axleShares`, because the semantics differ (lever-rule % vs. per-pallet share). | R2 F19 registry: full load profile … |
| F21 | fleet:write gating | 040 actions / drawer / fees cell; 310 `regTruck`, `compliance`, `svcList`. Guards in `obOk, obClose, lpSave, svcNew, svcSet, rgComply, addT, saveT, flTax, toSvc, backSvc, truckEdit, truckSave` | ported. Inputs are disabled and a read-only note is shown. Views and CSV stay available to every fleet:read role. | R2 F21 fleet: fleet:write gating … |
| S4 | Global hub filter on staff KPIs, table, deadlines, plan (also absences list) | Drivers → Staff; 320 `DRV()` = `hubFilter(S.drivers, d => d.hub)` | ported (the urgent trip keeps its own hub selector) | R2 S4 staff: global hub filter … |
| S5 | Toggle "vehicle 7.5 / 12.5 t" | 320 `urgent` (`F.heavy`, ACT `stHeavyTog`), 300 `R.urgent` `o.heavy` | ported. Driver reasons: "licence C needed (7.5 / 12.5 t)" and "licence not valid". | R2 S5/S6/S7 staff urgent trip … |
| S7 | Truck reasons: logger calibration expired, "3.5 t class — 7.5 / 12.5 t needed", "no ADR approval" | 300 `R.urgent` | ported (only real `S.trucks` are candidates, as before) | R2 S5/S6/S7 … |
| S6 (C) | "later" grade (resting driver, single reason) | 300 `R.urgent` `later`, 320 yellow chip | ported | R2 S5/S6/S7 … |
| S8 / S9 / S11 | drivers:write: Assign, Book renewal, Book course, medical ✓/✗, Add absence, absence ×, "Regime from 01.01.2027"; fines:write: Import fines, OK, transitions | 320 buttons (`DW()`, `FNW()`) + guards in `stAssign, stDocBook, stAdr, stMed, stMedTog, absAdd, absDel, fineImport, fineAssign, fineSet` | ported. Read-only roles see "assigned by an administrator (drivers:write)", "booked · …" texts and a regime chip. | R2 S8/S11 staff: drivers:write and fines:write gating … |
| S1 (C) | Counts per staff status / absence type | 320 `#st_abs_chips` | ported | R2 S1/S3 staff: … |
| S3 (C) | Status chip from the absence type | 320 `staffTable` (`data-st`) | ported | R2 S1/S3 staff: … |
| — | Help | `help/r2-res.js`: pod/quality, fleet/fleet, fleet/registry, drivers/staff (see / howto / rules) | added | [lang] R2 audit-A screens render … |
| — | Render, 4 languages, 5 roles | all changed tabs and drawers | — | [ru]/[de]/[en]/[kk] R2 audit-A screens render without undefined/NaN |

### Port result b (state after R2): ported 12

| Audit row id | Function | v6 place (menu → tab, file / function) | State after port | Test group name |
|---|---|---|---|---|
| D2 | Driver app read-only for non-driver roles (banner "Preview: actions are performed by the driver on the phone (FR-83)", disabled buttons, gated handlers); driver role fully interactive | Drivers → Driver app (and shell route `driverapp`), 330 `ro()` = `!canDo('driver:app')`, `FREE` set, `phone()` (banner + `disabled`), `DA` actions wrapped, `emit()` guard | ported (tabs, language, network simulation, ADR text, "Report deviation" and driver selector stay usable — as in 0.3.9) | R2 D2 driver app: non-driver roles see a read-only preview (banner, disabled buttons, gated actions) |
| D7 | Multi-drop: one unload stop per consignee; after the signature of a non-last stop "ePOD sent" + "Next stop"; load delivered only after the last stop | Driver app → Stop / Route, 330 `unloads()`, `seed()`, `stopTab()` step 5, `daSign`, `daNext` | ported (per-stop pallets, real SSCC of the orders' places, `l.epodStops`) | R2 D7/D8 driver app: multi-drop — one unload stop per consignee, ePOD sent + Next stop, delivered only after the last stop |
| D8 | ePOD record: scanned n / m, signature SHA-256 + photo SHA-256 line | Driver app → Stop, 330 `epodBody()` | ported (cosmetic; server time / hash verification n-a) | R2 D7/D8 driver app: multi-drop … |
| D18 | Footer toggle "ADR instructions in writing" + instruction text | Driver app footer (all tabs), 330 `phone()` `foot`, `daAdr`, `S.da.adrOpen` | ported (shown always, as in 0.3.9) | R2 D18 driver app: "ADR instructions in writing" toggle in the footer of every tab |
| D19 | Footer "Report deviation" | Driver app footer, 330 `daDev` → `openDeviation(l, 'Driver report · <load>', driver)` + quality event; preview → ePOD & documents → Deviations & quality | ported | R2 D19/D20 driver app: footer "Report deviation" and SOS on every tab |
| D20 | SOS in the footer of every tab | Driver app footer, 330 `daInc sos` (removed from the Me → Incidents card, hint left there) | ported | R2 D19/D20 driver app: footer "Report deviation" and SOS on every tab |
| P5 | Service note in "Trucks available" cell | Dispatch → Planning, 265 `downOn()` / `extend()` (`data-svc-note`) | ported (cosmetic) | R2 P10/P5/P6 planning: … |
| P6 | Drivers row amber when drivers < trucks + 1 | Dispatch → Planning, 265 `extend()` (`data-drv-warn`) | ported (cosmetic) | R2 P10/P5/P6 planning: … |
| P7 | Row "Weather / road risk" per day (none / low / medium / high, coloured) | Dispatch → Planning, 265 `wxDay()` (150 `WEATHER` forecast of the day's hubs, active closures, blizzard scenario days 2–3 = high) | ported | R2 P7 planning: row "Weather / road risk" per day, blizzard scenario = high on days 2–3 |
| P8 | Recommendations: shortfall with affected trips + actions, drivers, weather with trips, scenario texts, "Capacity sufficient for 7 days. Reserve — N pal." | Dispatch → Planning, 265 `recs()` (replaces the shortfall-only list of 240, keeps `data-plan-recs`) | ported | R2 P8 planning: recommendation kinds … |
| P9 | Shortfall buttons "Handover request to a partner" / "External carrier · cost check" / "Express decision" (trips:write) | Dispatch → Planning, 265 `r2PlGo` → Dispatch → Partners / Billing → Cost model / Dispatch → Waybills & express | ported | R2 P9 planning: shortfall action buttons … |
| P10 | "Planning factors" card (7 rows, BL_PF) | Dispatch → Planning, 265 `PF` card (`data-plan-factors`) | ported (KK translated) | R2 P10/P5/P6 planning: … |

## Audit B: 11 Partners, /partner portal, 15 Reports, 16 Costs, 17 Baseline data

Audit counts: cut 13, missing 5, n-a 4, present 53

Sources: `Olymp-Logistic-Platform/frontend/src/v5/screens/{Partners,Reports,Costs,Baseline}.tsx`, `v5/ContactModal.tsx`, `v5/contacts.ts`, `pages/PartnerPortal.tsx`, the view models `v5/engine/{partners,reports,costs,baseline}.ts`, `demo/v5/reports.ts`, `demo/mockApi.ts`, and `generated/access.json` (roles and actions).
Target: `platform-src/v6/screens/{160-partners,520-portal-partner,610-eco-reports,611-eco-reports-ext,600-eco-costmodel,620-eco-baseline,615-eco-baseline-data,240-ops-dispatch,200-ops-model,500-commercial,300-res-data}.js` and `roles.js`.

Priority: **M** = mandatory (function, validation, warning or role rule). **c** = cosmetic (label, extra column, chart, note text).

| # | Function | 0.3.9 place (screen → tab/card) | v6 place (menu → tab, file) | State (present/cut/missing/n-a) | Action (what to port, with texts and demo values) |
|---|---|---|---|---|---|
| P1 | KPI tiles | 11 Partners → KPI row: Gold, Silver, Bronze, Blocked, "Service partners", "Logistics partners" | Dispatch → Partners, `160-partners.js` `partnersBody()`: Gold, Silver, Bronze, "Blocked", "Handovers" | cut (c) | Add two tiles with counts by type: "Service partners" (ws, demo 8) and "Logistics partners" (lp, demo 9). You can keep "Handovers". |
| P2 | Filters for type, tier and city group, plus the tier legend | 11 → filter bar: Type (All/Service/Logistics), Tier (All tiers/Gold/Silver/Bronze/Blocked), City group (All cities/Main warehouses/Transshipment points/Route cities), "Partner tiers" tip | `160` `partnersBody()` selects `data-pf` + search + legend + `howNote('tiers')` | present | — (v6 adds a search box) |
| P3 | Partner register table (11 columns) | 11 → grid: Partner · city, Type, Tier, Services, Capacity, 2–8 °C, ADR, GDP, Response, SLA, Contract until | `160` `table()` | present | — |
| P4 | Effective-tier note and block reason | 11 → row: "Reason for block: …"; note `enote`: "downgraded from Gold (SLA 88 < 90 %)", "under review: SLA 86 < 90 %", "unblocked after closing CAPA-0019" | `160` `table()` shows "blocked: …" only | cut (c) | Under the name, add the note line: "under review: SLA {sla} < 90 %" for Bronze with SLA < 90 (PW-07 86 %, PL-06 90 %), and "unblocked after closing {dev}" after `ptUnb`. v6 lowers the tier explicitly through the four-eyes demotion, so the "downgraded from …" text already comes from `ptDemoteOk`. |
| P5 | Contract renewal: upload, policy date, second approver (four eyes) | 11 → row: tag "contract until MM.YYYY · renew", "Renew contract", form "Upload the signed contract (PDF)", "Policy valid until" (date), "Cancel"; waiting tag "renewal until … · contract uploaded (SHA-256 …) · awaits the second approval", button "Approve renewal" | `160` `ptRenew/ptUpload/ptRenewSend/ptRenewOk` + `fourEyes()` | present | — |
| P6 | Measured SLA and demotion proposal (four eyes) | 11 → row tag "SLA this month (measured): 87,5 % · 7/8 → proposal: Silver" (colour < 90 red, < 95 amber); button "Propose demotion (four eyes)". A proposal appears only when n ≥ 3 and pct < 90 for Gold or Silver | `160` chip "SLA {p.sla} % < 90 %" from the static register value + `ptDemote/ptDemoteOk` | cut (c) | The four-eyes flow is present. To match the source, show the measured-SLA tag text `SLA this month (measured): {pct} % · {ok}/{n}` with "→ proposal: {lower tier}". Demo: PW-06 89 % → Bronze, PW-05 88 %. |
| P7 | CAPA block, link to Quality, unblock | 11 → row: "Open in “Quality” · CAPA-0019", "unblock after CAPA closed", "Unblock" | `160` `ptQ`, `ptUnb`, `devDone()` | present | — |
| P8 | Empty filter result | "No partners for the selected filters." | `160` `table()` | present | — |
| P9 | Hub scope (role) | `partnerVals` keeps only partners whose zone the user's hub may see (`hubOk(E, p.zone)`), so a hub-bound dispatcher sees only their hub's partners | not modelled (all partners for every role) | cut (c) | Optional. If v6 gets hub-bound users, filter `list()` by the user's hub zone (AST zone vs ALA zone). |
| P10 | Route coverage by partners and reefer service, plus "Create task" | 11 → section "Route coverage by partners and reefer service": Trip, City, Logistics (tag or "Create task" → "task created"), Service, Reefer service (2–8 °C) | `160` `coverage()` + `ptTask` | present | — |
| P11 | City directory: toggle transshipment points | 11 → card "City directory · transshipment points" with note "Cross-dock only at the Astana and Almaty hubs…" and city toggles | `160` `coverage()` `#pt_cities` + `ptSec` | present | — |
| P12 | Handover: trip, Full/Partial, requirements, SSCC checklist | 11 → card "Shipment handover to partner" + tip: Trip seg, "Handover scope" Full/Partial, "{route} · requirements: …", package list, "All packages of the trip handed to partners.", "Tick packages for a partial handover." | `160` `handover()` | present | — (v6 adds the "Classic form" details) |
| P13 | Candidates on the route: price, verdict, policy, Hand over / Request approval | 11 → "Logistics partners on route": tier, name · city, why · capacity, price + verdict "cheaper by / more expensive by N %", "liability policy · limit …", buttons "Contacts", "Hand over" (direct = Gold), "Request approval" | `160` `handover()` + `hoCheck()` + `hoGive` | present | — |
| **P14** | GDP qualification of each candidate (FR-117) | 11 → candidate row tag "GDP qualification until dd.mm.yyyy" (green) / "GDP qualification expired dd.mm.yyyy" (red). The server refuses a handover to a partner whose qualification has expired | missing. `hoCheck()` checks only the `p.gdp` flag | missing (M) | See Port spec PS-1. |
| P15 | Partner GDP submissions: staff decision | 11 → note "Partner GDP submissions: N", one line per submission "{partner} · until {date} · {scope} · {n} veh. · {created_by}" with "Approve" / "Reject" (partners:write) | `160` shows the count + "decision in Commercial → CRM"; decision in `500-commercial.js` `cmPqOk/cmPqNo` | present (moved) | Optional: add inline Approve/Reject buttons that call `cmPqOk/cmPqNo`. |
| P16 | Service on route: "Call service" | 11 → section "Service on route · {route}": tier, name · city, "{svc} · response {h}", "Blocked: …", "Contacts", "Call service" / "Call (after approval)" (Bronze), "called" | `160` `serviceOnRoute()` + `ptCallWs` (creates SR in `RES.svcCreate`) | present | — |
| **P17** | Service requests (tickets) list and closing them | 11 → section "Service requests": all tickets, including drafts from the driver app and tickets from "Call service". Each shows id, vehicle, partner, status tag, city, ETA, estimate, workshop status, "actual …", "Discard draft", "Actual cost, ₸" + "Close request · work report"; empty "No requests." | `160` `workshop()` lists only its own `S.wreq` (truck + workshop select, "Create request", close with an empty ₸ field). The SRs from `ptCallWs` and from the driver app (`S.res.svc`) do not appear | cut (M) | See Port spec PS-2. |
| P18 | Handovers list: portal steps, logger, ePOD on behalf, approval | 11 → "Handovers to partners": "{id} · {trip} → {partner}" + status tag, scope, handover point, docs line, liability line, "Logger · …", deviation tag, portal step with Logger/°C/Seal, "Reason for entering on behalf" + "Scan of the partner ePOD (PDF / photo)" (reason ≥ 10), who line, "Approve" | `160` `handovers()` + `hoPortal/hoScan/hoEpod/hoOk` | present | Small gap: v6 sets `h.dev` when the temperature is out of range but never shows it. Add a tag "Deviation {DEV-HO-xxx} in “Quality”" (c). |
| P19 | Empty handovers list | "No handovers yet." | `160` `handovers()` | present | — |
| P20 | Partner contact modal (FR-33, FR-82) | ContactModal: "{type} · {city}", name, services, tier; per person role, name, masked tel · mobile, "Call (simulation)" (disabled without permission, tooltip "The number is disclosed with the partners permission only"); "Loading contacts…", "No contacts on file", note "Numbers are masked; the full number is shown when calling and recorded in the audit log.", "Copy contacts", "Close", Esc closes it | `160` `DRAWERS.pcontact`, `ptCall`, `ptCopy` (+ audit pii.read) | present | — (no "Loading" state, which is n-a without a backend) |
| **P21** | Role rule: write actions need `partners:write` | 11: every write button (Renew, Approve renewal, Propose demotion, Unblock, Create task, Hand over, Request approval, Approve, portal steps, ePOD on behalf, Call service, Close/Discard request, GDP Approve/Reject) is hidden unless `can('partners.*')` (access.json maps them to partners:write = admin, dispatcher) | `160`: the buttons render for every role that sees Dispatch (warehouse, auditor, viewer, manager, finance, quality). Only `ptCall` checks permission | missing (M) | See Port spec PS-3. |
| P22 | Online-demo contract pre-upload, server SHA-256 of the contract and the ePOD scan | 11 → `DEMO_CONTRACT` prefetch, `/api/v5/partners/{id}/contract`, `uploadObject` | v6 simulates the SHA | n-a (backend) | — |
| PP1 | Portal header and intro | /partner: "Partner portal · {partner}", intro "Hand-overs to your company. After delivery upload the ePOD: consignee name and position, signature, photo and the scanned packages." | Partner role → "My handovers and ePOD", `520-portal-partner.js` `SCREENS.phandovers` (+ 4 KPI tiles) | present | — |
| PP2 | Handover card: orders and package status | /partner → card "{id} · {trip}", "Orders: …", every SSCC with a "scanned" checkbox and its status (`handed`) | `520` card: load route, zone, pallets, kg, ETA; SSCC chips capped at 6 + "+N"; no orders line and no per-package status | cut (c) | Add the line "Orders: {order numbers or —}" and the status after each SSCC ("handed"). Show every package (the source does not cap them). |
| PP3 | Partner ePOD upload | /partner → "Consignee name", "Position", "Photo (optional)" (+ SHA-256), signature pad "Consignee signature" + "Clear", "Upload ePOD" (disabled until there is a signature and a signer) | `520` `epodForm()` + `ppEpod` | present | v6 is stricter: it requires every package scanned; the source does not. Keep or relax (c). |
| PP4 | ePOD done and empty states | "ePOD uploaded · record {n}", "No hand-overs." | `520` "ePOD uploaded · consignee …", empty-state note | present | — |
| PP5 | Profile line | "Profile and GDP qualification": "{name} · {city} · tier {tier} · contract until {until}" | Partner role → "Profile and GDP", `520` `SCREENS.pprofile` | present | — |
| PP6 | Current qualification and the warning when there is none | "Qualification valid until **{date}** · {2–8 °C, −20 °C, 15–25 °C} · {n} vehicles"; otherwise "GDP qualification not confirmed – no cold-chain hand-overs without it." | `520` "No approved qualification – no pharma handovers." + Q-001 row (no vehicle count) | cut (c) | Use the source warning text ("no cold-chain hand-overs") and add "· {n} vehicles" to the current qualification. |
| PP7 | List of own submissions | "№{id} · {valid_until} · awaiting review / rejected / active · {decided_by}" | `520` rows with chip pending/approved/rejected | present | — |
| **PP8** | GDP certificate submission form (FR-172) | /partner → "Submit GDP certificate" opens a form with "GDP certificate (PDF/JPEG/PNG)", "Qualified vehicles (plates, comma-separated)", "Temperature classes" checkboxes, "Audit date", "Valid until", "Insurance until", "Note", "Send for review", "Cancel" | `520` "New submission": free-text "Scope", certificate (demo), "Valid until", "Submit for review" | cut (M) | See Port spec PS-4. |
| PP9 | Staff decision on a submission (four eyes: submitter = partner account) | partners screen → Approve/Reject | `500-commercial.js` `cmPqOk/cmPqNo` | present | — |
| PP10 | Self-registration of a new partner | — (0.3.10 / FR-172 extension) | `520` `ppReg` | n-a (v6 extra) | — |
| R1 | Fines section and its tip | 15 → "Fines → driver" + tip `fineLink` | Reports → "Fines" tab, `610-eco-reports.js` `finesBody()` + `howNote('fineLink')` | present | — |
| R2 | Notice import | "Import notices (“Sergek”, eGov)", then "Import done · {dd.mm} {hh:mm}"; note "daily at 07:00 · matched by plate and time against the vehicle log" | `610` `ecoFineImport` ("Import done") | present | Small gap (c): add the import date and time to the done label. |
| **R3** | Reminder that the 50 % discount is about to expire (FR-124) | 15 → hint lines `data-fine-rem` above the table: "50 % discount expires: {id} until {due} — remaining {n} days · reminder 2 days before and on the due day" (or "· reminder sent to the driver / to accounting / to driver and accounting") | missing | missing (M) | See Port spec PS-5. |
| R4 | Payroll export and stored CSVs | "Payroll export of deductions · {period} · {count}" (disabled at 0) + one "CSV #{id}" button per export (re-download) | `610` "Period" input + "Payroll export" + CSV; text list "Payroll #id · period · lines · total" | cut (c) | Show the count in the label: `Payroll export of deductions · 2026-10 · {n}`. Turn each "Payroll #id" into a "CSV #{id}" button that downloads the same rows again. |
| R5 | Fines table | columns Notice no., Date · time, Veh. (+ plate), Offence · location, Amount, Driver (per log) (+ segment trip), Status | `610` table: Notice, Vehicle · place, Offence, Driver, Amount, Status | present | — |
| R6 | Fine detail and usage-log timeline | "{id} · {source}", "{driver} · {amount}", segments plus the offence mark, axis 00:00 / 06:00 / 12:00 / 18:00 / 24:00, "Black line — time of offence {t}.", paid line "paid by the company {amt} (50 % discount) · {date}", history | `610` detail card + timeline + history | present | Small gap (c): add the 5-point time axis and the "Black line — time of offence" caption. |
| **R7** | "Notify driver" | 15 → detail button "Notify driver" (shown when a driver is attributed). It sends a driver-app notification once: toast "Notification sent: {driver} (driver app)"; a second click gives "Notification already sent"; a driver without an app account gives "Driver has no app account" | missing | missing (M) | See Port spec PS-6. |
| R8 | Pay 50 %, pay in full, dispute | "Pay with 50 % discount by {due}", "Pay in full (company)", "Dispute" | `610` `ecoFineSt` paid50/paid/disputed | present | Small gap (c): put " by {due}" in the 50 % label and use "Pay in full (company)" / "Dispute". |
| R9 | Recharge, deduction, HR override, write-off | "Request recharge from driver", "Deduct in payroll {period}", reason "Reason (≥ 10 characters)" + "Deduct by HR decision", "Write off as company cost" | `610` `ecoFineSt` recharge/ack/drvDisp/deducted/company + `#fd_r` (50 % cap) | present | — |
| R10 | Manual driver attribution | "— driver —" select, "Evidence (trip sheet, statement)" ≥ 10, "Attribute driver" | `610` `ecoFineAttr` | present | — |
| R11 | Role rules for fines | Fine buttons are hidden without `fines:write` (admin, finance). The fines section is visible to every role that sees Reports (admin, dispatcher, warehouse, auditor, viewer, manager, finance, quality) | `610`: buttons are always rendered and `needPerm()` rejects the click. The Fines tab has `perm: 'costs:read'`, so warehouse, viewer and quality cannot see it | cut (c) | Wrap the action buttons in `canDo('fines:write')`. To match the source, drop `perm` from the Fines tab (or use `overview:read`). |
| R12 | Driver report · 30 days | 9 columns: Driver, Hub, Trips, km, On time, Temp. exc., Driving events, Fines, Open | `611-eco-reports-ext.js` `drvTable()` in the KPI tab | present | — |
| R13 | Six KPI tiles with 8-week bars | OTIF 96,4 %, Temperature compliance 99,6 %, Volume utilisation 81 %, Empty running 38 %, Cost per pallet 18 400 ₸ (live from the ledger), Incidents per 100 trips 0,7 | `611` `ecoRepKpis()` / `tiles()` | present | — |
| R14 | Report catalogue | 6 groups × 4 reports, "PDF / Excel" → toast "Report “…” generated (demo)" | Reports → "Catalogue", `611` `catBody()` + `ecoRepExp` | present | — |
| R15 | Stored payroll CSV with a server hash check | `/api/v5/fines/payroll/{id}.csv` | — | n-a (backend) | — |
| C1 | Intro text | 16 → "Running costs of the own fleet: 4 vehicles (V01 — HOWO T5G …)…" | Billing → "Cost model", `600-eco-costmodel.js` `body()` | present | — |
| C2 | KPI tiles | Running cost / month, vs. outsourcing, Cost per km, Tariff cost + 5 %, Diesel share, "Fleet availability" {min – max} with sub "pilot threshold 0.92 (O80)" | `600` `body()`: the first five match; the sixth tile is "Approvals > 50 %" | cut (c) | Add (or swap in) the tile "Fleet availability" with value `min(ktg) – max(ktg)` (2 decimals) and sub "pilot threshold 0.92 (O80)"; amber when min < 0.92. |
| C3 | Sub-tabs | Summary, Diesel, Workshop & downtime, Insurance/tax, Own or external, Drivers | `600` `seg(subs,'ecoSub')` (6 sub-tabs) + "Model CSV" | present | — |
| C4 | Running costs by item, with total | Group, Item, Ref, Basis, ₸/month, ₸/year, Share + bar, source tag ("Fragenkatalog" / "assumption"); total row with ₸/km · ₸/kg | `600` `sumView()` | present | — |
| C5 | N77 reconciliation note | under the total: "Model N77: savings 6.92 M ₸/month → cost ≈ {outs − 6 916 410}. Bottom-up: {tot} — gap {…} (residual express and parallel pilot outsourcing not included)." | missing | missing (c) | Add a note under the total row using `CP.outs` (24 201 924) and `CP.saveN77` (6 916 410). |
| C6 | "Not included" list | "GDP mapping and qualification of three regimes — not estimated (C13/H37)", "30 % leasing down payment — investment, not running cost (N74)", "Fines — driver liability (FR-07)" | `600` `howNote('costExcl')` (`003-notes.js`) | present | — |
| C7 | Management card with 6 indicators | "For the management dashboard / Top level · 6 indicators" + refresh note | `600` `dashCard()` | present | — |
| C8 | Plan / actual per vehicle and month (FR-125) | "Plan / actual per vehicle · {month}": ID, Plan (fuel + service), Fuel, Tolls, Service, Partners, Fines, Other, Actual total, Dev., l/100 km; total row; ledger note with the entry count | `600` `actualView()` / `ecoActualByVeh()` | present | — |
| C9 | Toll statement CSV import (costs:approve) | "Toll statement (CSV)", format hint, textarea, "Import" → "Imported: n · duplicates: n · errors: n" | `600` `ecoToll` / `ecoTollImport()` | present | — |
| C10 | Incoming partner or workshop invoice (ESF) (FR-116) | fields Supplier BIN, ESF no., Turnover date, Net ₸, VAT ₸, "Handover HO- / request SR-", "Register" → "Invoice registered and booked into the cost ledger" | `600` `ecoInv` / `ecoInvRegister()` | present | — |
| C11 | Diesel controls | price seg 340 / 400 / 450 ₸/l, toggle "Winter consumption +10 % (I38)" | `600` `fuelView()` `ecoDiesel` / `ecoWinter` | present | — |
| C12 | Diesel table details | columns include "8 weeks" bars (amber when > plan × 1.08), "Status" (LV tag: dev > 4 / 8 / 15 %), a per-vehicle note ("cost ledger: n fills · n l · " + "within plan" or "check: Wialon level sensor, siphoning, winter idling, driving style"), and the total line "Total: {l}/month · {₸} per month. Winter risk: {₸} for Nov–Mar at +10 %." | `600` `fuelView()`: no 8-week bars, no status tag, no note, no total line (v6 adds service and downtime columns instead) | cut (c) | Add the status chip (thresholds 4 / 8 / 15 %), the check / within-plan note under the model, and the total line. For the 8-week bars use weekly factors around `x.act`, with V02 week 7 × 1.06 as in the source. |
| C13 | Workshop, service and downtime, plus the downtime card | table ID, Model, km/month, Service/month, To TO-1, To TO-2, Service downtime, Avail., Downtime day, Trip replacement, Status; card "Cost of unplanned downtime" (Towing 150 000, Gearbox repair (PW-03) 120 000, V01 fixed × 3 days, R1 replacement 7 325 kg × 228 ₸), "Total per event", GarantA/KazExpress note | `600` `svcView()` + `ecoWs` | present | — |
| C14 | Insurance, tax and registration | toggles for the idle scenarios (B7), table ID, Model, Comprehensive, OGPO, Tax, Inspection, Total/yr, Due + tag, Idle, Registration recommendation; rule note; rates note | `600` `insView()` + `ecoIdle` | present | — |
| C15 | Own vehicle or external, two signatures (four eyes, FR-85) | table Shipment, Load, Own vehicle, External (+ basis), Cheaper, Gap, Decision; signer buttons "Head of logistics" / "Financial controller"; "signatures stale: diesel price changed — sign again"; "Execute: own vehicle" / "Execute: external carrier" | `600` `ownView()` + `ecoSign/ecoExec` + `ecoCanSign()` | present | — |
| C16 | Driver requirement (E20, J51, FR-46) | table ID, Rings, km/yr, Hours/yr, FTE, Crew, On road + total + note | `600` `drvView()` | present | — |
| C17 | Role rules for costs | signers disabled without `costs.sign` (costs:approve); booking and execution need `costs.execute` (costs:approve) | `600`: `ecoCanSign`, `canDo('costs:approve')`; tab `perm: 'costs:read'` | present | — |
| C18 | Live actuals from the server | `/api/costs/actuals?month=…` | `S.costs` mock | n-a (backend) | — |
| B1 | Intro text | 17 → "Question catalogue “Logistics Kazakhstan”, 150 answers … 07.10.2026 …" | menu "Baseline data", `620-eco-baseline.js` `body()` | present | — |
| B2 | KPI tiles (8) | Network volume, Temperature shipments 2026, Outsourcing today (G25), Express (A2), Rate ₸/kg (own · LTL · express, G30), Investment (H31), Payback (NPV · IRR, N77), R1 start 12.2026 | `620` tiles: Network volume, Temperature shipments, Express in budget, Payback (plus FR-49 counters). Outsourcing, rate, investment and R1 start appear only as subs or in the Economics block | cut (c) | Optional: add tiles "Rate ₸/kg" (`D.ownRate · D.ltlRate · D.expRate`, sub "own · LTL · express (G30)"), "Investment" (`D.capexNet` M ₸, sub "excl. VAT · {capexVat} incl. 16 % VAT (H31)") and "R1 start" (12.2026, sub "West 01.2027 · rest 02–03.2027 (S133)"). |
| B3 | Validation findings V-01…V-24 with a level filter | "Answers checked against platform v3", filter All / critical / watch / risk / normal; columns ID, Topic · question, Fragenkatalog, Platform v3, Decision in v4, Status | `620` `valBody()` + `blClar` (clarify with KDL, FR-49) | present | Small gap (c): no level filter. Add a seg All / Critical / Risk / Normal on `lvl`. |
| B4 | Data gaps | "No data in the answers — request from KDL Olymp" chips | `620` `valBody()` / `qBody()` | present | — |
| B5 | Rings and legs | "Rings and legs (P83, P85, R111)" table | `620` `netBody()` | present | — |
| B6 | Volumes by city | city table + total "23 cities + Makinsk" + notes | `620` `netBody()` | present | — |
| B7 | Target fleet table and summary | "Target fleet (H32, R111–R114)" + Σ line | `620` `fleetBody()` | present | — |
| B8 | Rate per kg, payback by scenario, cost parameters | "Rate per kg (G30)" bars, "Payback by scenario (N78)" bars, "Costs and parameters" | `620` `fleetBody()` | present | — |
| B9 | Express approval with 3 signatures (K55) | 17 → tab Express: card "{id} · {kg}", route, customer · goods, cost triple "Express / LTL / Saving", 3 signer buttons, "Reject → regular trip"; role `baseline.exSign` / `exReject` = approvals:sign | Dispatch → Express, `240-ops-dispatch.js` + `200-ops-model.js` `exSign/exReject/exTick` | present (moved) | Small gap (c): the v6 express card has no cost triple. Add "Express {kg × 1 440 ₸} · LTL {kg × 228 ₸} · Saving {difference}". |
| B10 | Launch critical path and pilot criteria | "Critical path to the first trip (O79, S138)" + "Pilot R1 … Success criteria (O80)" + governance note | `620` `launchBody()` (+ legal and West items) | present | — |

**Count:** 75 rows.
- **53 present**, including 2 that moved to another screen (P15 to CRM, B9 to Dispatch → Express).
- **5 missing**: 4 M and 1 c.
- **13 cut**: 2 M and 11 c.
- **4 n-a**: 3 backend and 1 v6 extra.

Rows with a bold **#** are mandatory gaps.

---

### Port result c (state after R2): ported 16, skipped 1

| Audit row id | Function | v6 place (menu → tab, file / function) | State after port | Test group name |
|---|---|---|---|---|
| P14 (PS-1) | GDP qualification of each candidate, refusal when expired (FR-117) | Dispatch → Partners → handover candidates, `160` `GDP_UNTIL`, `partnerGdpUntil()`, `gdpChip()`, `hoCheck()`, `fits()` | ported. PL-04 now has `gdp: 1` with an expired date of 2026-09-30, as in the spec. The date is the latest of the register value and the approved `S.pquals` entries, so `cmPqOk` extends it without any edit to 500 | R2 P14 partners: GDP qualification date per candidate, expired qualification refuses a pharma handover (FR-117) |
| P17 (PS-2) | One service-request list on `S.res.svc`, closed with the actual cost, draft discard | Dispatch → Partners → "Service requests", `160` `workshop()`, `wrNew` / `wrClose` / `wrDiscard` | ported. Uses `RES.svcCreate` / `RES.svcSet('done')` and then sets `veh` from `ECO_VOF` on the ledger entry. The old `WR-nnn` number stays as an alias (`s.wr`), so the old tests still pass. The draft path is ready, but `330-driver-app.js` creates no `status:'draft'` SRs today (breakdown → requested, defects → planned) | R2 P17 partners: one service-request list on S.res.svc, close with actual cost, discard draft (FR-125) |
| P21 (PS-3) | Write actions need `partners:write` | Dispatch → Partners, `160` `canW()` in the views and a `noW()` guard in every write handler | ported. Covers renew, upload, send, approve renewal, demote, approve demotion, unblock, task, city toggle, hoGive, hoNew, hoOk, hoPortal, hoScan, hoEpod, ptCallWs, wrNew, wrClose and wrDiscard | R2 P21 partners: write controls only with partners:write, read-only roles keep lists and contacts |
| PP8 (PS-4) | Full GDP certificate submission form with the server rules (FR-172) | Partner portal → Profile and GDP, `520` `ppQOpen` / `ppQual` / `ppQCancel`, `QCLS` | ported. Stores `vehicles[]`, `classes[]`, `scope`, `audit`, `until`, `insuranceUntil`, `note`, `created_by` and `sha`. The pending line in `160` shows "· n vehicles" | R2 PP8 partner portal: full GDP certificate submission form with server rules (FR-172) |
| R3 (PS-5) | 50 % discount reminder lines (FR-124) | Reports → Fines, `610` `ecoFineRem()`, `X.rem`, `data-fine-rem` | ported. `acc` is set once the date reaches due − 2 d; `drv` is set after Notify | R2 R3 fines: 50 % discount reminder lines above the table (FR-124) |
| R7 (PS-6) | Notify driver | Reports → Fines → detail, `610` `ecoFineNotify` | ported. Sends one message per fine and refuses a repeat ("already sent"). A driver with `d.app === false` has no app account. The message goes to `S.eco.notifs`, and to the driver-app messages if that shell was already opened. The action is audited and logged in `X.log` | R2 R7 fines: Notify driver once, already sent, no app account, role rule |
| P1 (c) | KPI tiles by type | `160` `partnersBody()` | ported. Six tiles as in the source; the "Handovers" tile is dropped | R2 [ru/de/en/kk] render group |
| P4 (c) | "under review: SLA … < 90 %" and "unblocked after closing …" | `160` `table()` | ported | render group |
| P6 (c) | Measured-SLA tag with the proposal | `160` `table()` | ported. The text is "SLA this month (measured): {sla} % → proposal: {lower tier}". It has no ok/n counts, because v6 has no per-month measurement | render group |
| P18 (c) | Deviation tag on a handover | `160` `handovers()` `data-ho-dev` | ported | — |
| PP6 (c) | Source warning text and vehicle count | `520` pprofile | ported | R2 PP8 group |
| R2 (c) | Import timestamp | `610` `X.impAt` | ported | R2 R3 group |
| R4 (c) | Count in the payroll label | `610` | partly ported: the label is "Payroll export of deductions · period · n". The "CSV #id" re-download is skipped | — |
| R6 (c) | 5-point time axis and caption | `610` detail timeline | ported | render group |
| R8 (c) | Button labels | `610` | ported: "Pay with 50 % discount by {due}", "Pay in full (company)", "Dispute" | — |
| R11 (c) | Fine buttons hidden without `fines:write` | `610` | ported for the buttons. The tab `perm` is unchanged | R2 R7 group |
| P9, PP2, R4 (CSV re-download), R11 (tab perm) | — | — | skipped (cosmetic, not trivial) | — |

## Audit C: /book, /my-bookings, /bookings, /request, /track, /insurance, /crm, /customers

Audit counts: cut 33, missing 14, n-a 2, present 32

Source: `Olymp-Logistic-Platform/frontend/src` (pages/Booking.tsx, BookingForm.tsx, Public.tsx, Insurance.tsx, InsuranceCert.tsx, Crm.tsx, Contracts.tsx, PriceLists.tsx, OfferSample.tsx, bookingChecks.ts, i18nDict.ts, generated/access-nav.json).
Target: `platform-src/v6/screens/400-rec-core.js`, `420-rec-bookings.js`, `430-rec-insurance.js`, `500-commercial.js`, `510-portal-customer.js`, `530-public.js`, `540-ops-track.js`, `240-ops-dispatch.js` / `200-ops-model.js` (express).
English texts are quoted exactly as in 0.3.9 (i18n keys resolved via i18nDict.ts). "M" = mandatory, "C" = cosmetic.

0.3.9 page permissions (access-nav.json): `/book` and `/my-bookings` = `portal`; `/bookings` = `bookings:manage`; `/crm`, `/customers`, `/tasks` = `crm:read` (writing = `crm:write`); `/insurance` = `quality:write`; `/request`, `/track/:token` = public.

### Defects found in v6 while auditing (all fixed by port e, see "Port result e")

| # | Defect | Where | Effect |
|---|---|---|---|
| D1 | Bookings created by the portal (`newBooking()` in 500-commercial.js:247, called from 510 `bkSend` and 500 `cmOfAccept`) have no `hist` array | 420 `DRAWERS.booking` reads `b.hist.length`; `bookingConfirm/Reject/Cancel` call `b.hist.push` | Opening, confirming, rejecting or cancelling any booking made in the portal throws a TypeError. Only the 5 seed bookings of 400-rec-core.js (made with `NEWB`, which has `hist: []`) work. |
| D2 | Portal bookings use `LOCS` city keys (KST, PAV, TAR, …); the desk uses `HUBS[b.from].city` | 420 `body()`, `docOffer`, `docCert`, drawer; 430 certificate rows | A portal booking to or from a non-hub city breaks the whole Orders → Bookings tab (and Billing → Insurance if it is insured). |
| D3 | Two price models: the desk shows `bookingPrice()` (distance × zone rate, express +25 %, **VAT 12 %**) while the portal and offers use `priceFor()` (tariff, discount, fuel, ADR, handling, **VAT 16 %**) and store `b.gross` / `b.price` | 420:14 vs 500:94 | The dispatcher sees a different total than the customer booked and the offer locked. |
| D4 | Insurance uses `b.value`, the portal stores `b.declared` | 420 `certOf`, 430 `claimOpen` (`amt > b.value`), `declared()` | Portal certificate shows "undefined ₸"; the claim cap "amount ≤ declared value" does not apply to portal bookings. |
| D5 | A portal express booking only gets `exSt: 'pending'`; nothing creates an entry in `S.express` (Dispatch → Waybills & express) or ever changes `exSt` | 510:143, 200-ops-model.js:515 | The 3-manager approval is never requested; the status stays "awaiting approval" forever; and the dispatcher can confirm the express booking directly on the desk, which skips the approval. |

### Table

| # | Function | 0.3.9 place | v6 place (menu → tab, file) | State | Action |
|---|---|---|---|---|---|
| **Book transport (/book)** | | | | | |
| 1 | Access: only `portal` role; page title "Book transport", section "Customer portal" | App.tsx Guard `book` | Customer role shell → "Book a shipment", 510 `SCREENS.book` | present | — |
| 2 | Pick-up / destination address: city select, street with autocomplete from the city street directory, house (must contain a digit) | BookingForm.tsx `AddressBlock` | Book a shipment → Pickup / Delivery cards, 510 `addrBlock` + 500 `addrCheck/streetSuggest` | present | — |
| 3 | "From the address book…" select per address block | `AddressBlock` saved | 510 `addrBlock` (`pBook`/`dBook`) | present | — |
| 4 | "Save to the address book" from the form (+ "Address saved") | `AddressBlock.save` | — | missing | C: add a link under each address block when city + street + house are valid and the check is not manual: push `{id,label: site||street+' '+house, city, street, house, check:'ok', hours}` into `custOf(S.custId).book`, show "Address saved". |
| 5 | Optional "Site / company (optional)" and "Opening hours (optional)" (placeholder 09:00–18:00) per address | `AddressBlock` | — | missing | C: two inputs per block, stored on `pickup`/`delivery` of the booking and shown in the desk drawer. |
| 6 | Pick-up time window "Pick-up from" / "to" (dates, to ≥ from) | BookTransport `q.from/q.to` | — | missing | M: see spec P1. |
| 7 | Unknown street: "Did you mean:" clickable suggestion chips + checkbox "Street not in the directory — staff check"; no-stop note "delivery from the nearest network stop" | `AddressBlock` | 510 address-check chip + hint text with "similar: …" (not clickable), automatic `manual` | cut | C: render `ac.near` as buttons that set the street; keep the automatic manual state. |
| 8 | Same street check "Pick-up and delivery on the same street of the same city — choose another address." | `sameStreet` | — | missing | C: add to `ready()` errors when `pCity===dCity` and normalised streets are equal. |
| 9 | Goods categories (scope GDP/GLP/GMP, temperature tag, "licence required" tag, hint text per category), max 6, "Choose at least one goods category.", remark | `GOODS`, bk-goods | 510 `goodsBlock` (grouped by scope, licence chip, "Remark" in options card) | cut | C: add the per-category hint line, block a 7th category (R.max_goods = 6). |
| 10 | Incompatible goods mix: "Incompatible temperature classes: the selected categories cannot travel in one booking (e.g. −20 °C and +15…+25 °C only). Please book them separately." | `mix` | 510: zone list marks "not suitable"; when the intersection is empty `goodsZones` returns `[]` and `B.zone` becomes `undefined` | cut | M: see spec P2. |
| 11 | Temperature class select with unsuitable classes disabled + note "Temperature class matched to the goods; unsuitable ones are disabled." | bk-load | 510 zone select with " · not suitable" suffix + error "The temperature zone does not fit the goods" | present | — |
| 12 | Pallets 0.5–33 step 0.5, gross weight 1–20 000 kg required, live "≈ X kg · average per pallet" and "More than 1,200 kg per pallet — permissible load (axle / pallet) exceeded." / "Enter the weight — it is used for the price, capacity and the axle check." | bk-load | 510 pallets 1–33 integer, kg; error list "Weight per pallet above 1,200 kg" | cut | C: allow step 0.5 (min 0.5), show the average line under the inputs. |
| 13 | Package dimensions (optional): count, length, width, height ≤ 220, weight each ≤ 1 200, stackable, remove "×", "+ line" | bk-dg data-lines | 510 "Place dimensions (optional)" rows + "+ place" | cut | C: add a remove "×" button per row. |
| 14 | FR-185 weight plausibility warnings (never blocking) with title "Check weight and places (booking still possible):" | `WarnList`, bookingChecks.ts | 510 `loadWarnings` rows (no title) | present | C: add the title line. |
| 15 | Dangerous goods block: UN (4 digits), proper shipping name, ADR class (15 classes), packing group, LQ, EQ, net quantity + unit kg/l, dry ice kg, emergency contact role select; errors "UN number: exactly 4 digits." / "ADR data need a UN number, a proper shipping name and a class." / "LQ and EQ are exclusive." | bk-dg data-dg | 510 DG details (6 classes, no net quantity, fixed emergency note) | cut | C: add net quantity + unit, emergency role select (Shipper's duty officer / Carrier dispatch (24/7) / ADR safety adviser), full class list 1.4, 2.1, 2.2, 2.3, 3, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1, 6.2, 7, 8, 9. |
| 16 | ADR on departures: per slot chip "no ADR on this departure", note "Dangerous goods: a departure with an ADR vehicle and driver is required.", "No departure with ADR equipment — choose another route/dates or contact dispatch." | slots `reason==='no_adr'` | — | missing | M: see spec P3. |
| 17 | Cargo insurance: checkbox, declared value (1…2 000 000 000), premium ≈ "rate 0.15 %, minimum 3,000 ₸ (planning value); premium not subject to VAT", EUR/USD at NBK rate, stale warning | bk-ins, `FxLine` | 510 insurance checkbox, declared value, premium + `fxLine` | present | C: cap the declared value at `INS.max`. |
| 18 | Third-party payer: company (KGD autofill), BIN/IIN check, role agent/broker/forwarder/other, contact person, e-mail, phone, invoice address, payer reference / PO no.; error "Enter the paying company and a valid BIN / IIN (or leave the field empty)." | bk-payer | 510 payer: company, role (3), BIN/IIN with check-digit message, reference | cut | M: see spec P4. |
| 19 | Express request: checkbox "Express delivery (approval by 3 managers)", "Requested delivery (date, time)" datetime, hint, button "Request express", result "EX… · Express request sent for approval · decision by … · express surcharge … · Total …" | bk-express | 510 express checkbox, date, hint with surcharge, "Request express", done card | cut | M: see spec P5 (fixes D5). |
| 20 | Price breakdown: "Customer price list" line (framework #id · −10 % · diesel 340 / base 300 ₸/l), Freight net, Framework-contract discount, Fuel surcharge, ADR surcharge, Hub handling, Price net, VAT, Insurance (no VAT), Total, FX, note "Estimated price per tariff · km · mode · pal." | `PriceLines` | 510 price card → 500 `priceTable` | present | C: add the "Customer price list" line from `p.terms`. |
| 21 | Route card: legs with km, "+N business days via hub X · Hub handling", "Lead time pick-up to delivery: N business days", manual-address notice | data-route | 510 KPI tiles (lead, mode, hub) + `routeText` | present | — |
| 22 | "Offer and contract sample" button for the current request (printable sheet) | `openOffer` → OfferSample | — | missing | M: see spec P6. |
| 23 | "Lock the price (quote)" → "KP… · Quote · total · price locked until dd.mm.yyyy" (customer creates own quote) | `saveQuote` | Only staff (Orders → Commercial → Offers); portal can only pick an existing offer | missing | M: see spec P6. |
| 24 | Slots "Available departures": departure date-time, line, mode, pick-up day, "Delivery approx." + business days, holidays, free pallets chip, "no free weight", "Bookable until", empty state | `.slots` | 510 "Next departures" rows (date, line, pickup, delivery approx., closes, free chip, chosen) | cut | C: add mode and lead days per slot; holiday names via `nextHolidays()`. |
| 25 | Confirmation form: LOT, Payment (Prepaid / On account (invoice after delivery)), error "Booking on account needs a signed framework contract — see "Contracts" under "My bookings".", terms text, button "Book now · date · price" | data-book-confirm | 510 options card (payment only offers on-account with a framework contract; terms via `howNote('bookTerms')`), "Book" | cut | M: add the LOT field (spec P7). |
| 26 | Booking confirmation by e-mail (default) / SMS (opt-in, "Enter a mobile number for SMS."), hint, "The confirmation will be sent to:", demo preview "Message sent (demo) — this is how it looks:" | bk-notify, data-notify-preview | 510 e-mail / SMS fields + done card with masked previews | present | — |
| 27 | Booking result notice: "BK… · requested, awaiting confirmation by dispatch. Departure … · price", manual-address note, payer line "Payer: X · invoice to payer" | data-booked | 510 `doneBlock` | present | — |
| **My bookings (/my-bookings)** | | | | | |
| 28 | Own bookings table: Number (+source, external ref), Departure (+line, Delivery approx.), From → to (+mode, km, legs, address-check chip), Goods (+DG), Pallets · kg (+avg), Total incl. VAT (+net, handling, insurance, FX), Status (+order no., reject reason, on account, payer, ⚠ check weight) | `BookingTable` | Customer → My bookings, 510 `SCREENS.mybookings` (№, Route, Zone, Cargo, Departure, Price, Status) | cut | C: add goods/DG line, address-check chip, "On account (invoice after delivery)" line and reject reason. |
| 29 | Actions: "Shipment tracking" link, "Cancel" with confirm "Cancel booking?" (only requested), "Offer and contract sample", "Insurance certificate" (insured only) | MyBookings actions | 510: "Track", "Cancel" (no confirm), offer id as text | cut | M: see spec P8 (offer sample + certificate on the portal). C: confirm() before cancel. |
| 30 | Express requests table (№, From → to, Deliver by, decision by, express surcharge, Total, status awaiting approval / approved · express order / rejected → regular trip / deadline passed → regular trip + order no.) | `ExpressTable` | 510 only a chip on the booking row | cut | M: part of spec P5. |
| 31 | Quotes table (№, Total, price locked until, valid / accepted → booking / expired — re-priced) | `QuoteTable` | 510 Offers card with "Book with the offer" | present | — |
| 32 | Contracts on the portal: framework chip / "No active framework contract — bookings are prepaid only.", table (Number, Template, Status, Validity, hash, Signer), "Open text", "Sign with NCALayer", "Sign (demo)", hint, "Contract signed; signature verified.", empty "No contracts yet — sales prepares them." | Contracts.tsx `PortalContracts` | 510 "Contracts and e-signature" card (rows, hash, "Sign (demo NCALayer)") + KPI tile | cut | M: see spec P9 (open text before signing). Real NCALayer = n/a (backend). |
| 33 | Deep link `?n=<booking>` filters the list to one booking | MyBookings `only` | — | missing | C: `?bk=` param filtering My bookings / Bookings desk. |
| 34 | Empty state | `<Empty/>` | 510 "No bookings yet" | present | — |
| **Booking desk (/bookings)** | | | | | |
| 35 | Access `bookings:manage`, menu badge for requested bookings, list refresh on new request | BookingDesk, sidebar badge | Orders → Bookings, 420 `addTab(... perm:'bookings:manage', badge)`, `NAV_BADGE.orders` | present | — |
| 36 | Status segments Requested (default) / Confirmed / Rejected / Cancelled / All | PageHead seg-group | 420 status select (default all) + customer filter + 4 KPI tiles | present | C: default the filter to "new". |
| 37 | Table with Customer column + all columns of #28 | `BookingTable showCustomer` | 420 table (Request, Customer / payer, Route and cargo, Options, Price, Status / order) | cut | M: fix D2/D3 (spec P10); C: add goods/DG and "⚠ check weight" chip with tooltip. |
| 38 | Address review four-eyes: chip "address check"; "Address checked" button with prompt "Check note (min. 3 characters)"; Confirm disabled while unchecked; requester may not review | Booking.tsx `review` | — (address check only in Commercial → Customers address book) | missing | M: see spec P11. |
| 39 | Confirm → order with tracking token, place on the departure; Reject with "Reason (visible to the customer):" (≥ 3); Cancel booking (requested / confirmed) with "Reason for cancellation" (≥ 3) releasing order and capacity | Booking.tsx confirm/reject/cancelBk | 420 drawer: "Confirm and create the order", "Reject", "Cancel (customer request)", "Cancel the order" (reason ≥ 5) | present | M: fix D1 (spec P10). |
| 40 | "departure cancelled" chip on bookings of a cancelled departure (FR-97) | Booking.tsx | — | missing | C (depends on Planning "Cancel departure", other audit). |
| 41 | "Offer and contract sample" per booking | OfferSample | 420 drawer tab "Offer / contract" (`docOffer`) + "Download (HTML)" | cut | M: content per spec P6. |
| 42 | Insurance certificate from the desk | (portal + desk via cert) | 420 drawer tab "Certificate" (`docCert`) | cut | see #57. |
| 43 | Decision history / audit | backend audit | 420 drawer history list + `audit()` | present | — |
| **Offer and contract sample (OfferSample.tsx)** | | | | | |
| 44 | Printable sheet: title "Offer and sample contract of carriage", Nr. / date / valid until, Parties (Carrier, Customer + BIN, "Payer (invoice recipient)" + BIN), Carriage (Pick-up + time window, legs, route, departure / line, goods, DG with emergency contact, cargo), Price (all lines + price list), FX note, 9 "Standard clauses (sample)", signature boxes, watermark "SAMPLE", footer "SAMPLE – not a binding offer, legal review required", "Print / PDF", "Close", Esc | OfferSample.tsx | 420 `docOffer` (short price table), 500 `offerSheet` (price table + note) | cut | M: see spec P6. |
| **Public request (/request)** | | | | | |
| 45 | Public shell (brand, "Cold-chain logistics", language buttons, footer), title "Transport request" | Public.tsx `PublicShell` | route `request`, 530 `SCREENS.request` (inside the app shell) | present | — |
| 46 | Fields Company*, Contact person*, E-mail*, Phone, From*, To*, Temperature class, Pallets (0.5–100), Frequency ("e.g. weekly"), Message (textarea 2 000), honeypot, consent* ("I consent to the processing of my personal data to answer this request (RK Law "On personal data and their protection")."), "Send request" | RequestPage | 530 form (From / To as city selects, message as single-line input) | present | C: message as textarea; consent text as in 0.3.9. |
| 47 | Errors "Too many requests. Please try later." (HTTP 429) / "Could not send. Reload the page and try again."; button disabled until the form token is loaded | RequestPage | 530 client validation errors | n-a | n/a (backend rate limit / form token). |
| 48 | Thank-you page "Thank you!" / "We have received your request and will contact you shortly." → CRM lead "Website form" | RequestPage sent | 530 "Thank you! Request received: L-…" → `addLead(src:'web')` | present | — |
| **Public tracking (/track/:token)** | | | | | |
| 49 | Facts: Number, Destination, Temperature class, Status, ETA, "Planned ETA", Delivered (time), "Temperature compliance" compliant / deviation under review, Route legs, "Delivery approx." + business days, "Handed to a partner carrier" | TrackPage | 530 `trackCard` (+540 order token) | cut | C: add planned vs current ETA and the delivered timestamp. |
| 50 | Steps New → Planned → In transit → Delivered; cancelled chip | TrackPage steps | 530 steps (Request received, Confirmed, Trip assigned, Loading, In transit, Delivered) | present | — |
| 51 | "Shipment history" event list (Order created, Booked, Planned on a trip, Loaded, Trip departed, Arrived at destination, Delivered, Delay · weather conditions, ETA changed, Handed to a partner carrier, Quality hold, …) — no personal data | TrackPage events | — | missing | M: see spec P12. |
| 52 | "Shipment not found. Please check the link." | TrackPage err | 530 "Shipment not found. Check the number from the confirmation." | present | — |
| 53 | Token in URL (`/track/<token>`) opens without login | App.tsx | 530 `?track=<id>` (booking / load id) + 540 order token | present | — |
| **Cargo insurance (/insurance, InsuranceCert)** | | | | | |
| 54 | Page access `quality:write` | access-nav.json | Billing → Insurance (no tab perm → every role with `costs:read`) | cut | C: `perm:'quality:write'` on the tab or keep read-only for finance (decide). |
| 55 | Policy card: insurer + BIN, policy no., kind "open cargo cover", validity from–to, deductible, claim deadline "days after the deviation", premium rate, minimum premium, maximum per shipment, chip "planning entry (fictitious)", planning note | Insurance.tsx | 430 policy card | cut | C: add insurer BIN, policy kind and validity 01.01.2026 – 31.12.2026. |
| 56 | Claims: form (order, deviation DEV-yy-nnnn, amount, description ≥ 10, no PD) when `quality:write`, else note "Opening and processing claims needs quality:write (quality, warehouse, administrator)."; table Number, Order, Deviation, Booking, Amount, Status, Deadline (+overdue for open AND submitted), Note; steps open → submitted → settled / rejected with confirm + note ≥ 3; empty "No claims yet." | Insurance.tsx | 430 claims table + `claimNew` / `claim` drawers, prefill from deviation (140-quality) | present | M: fix D4 (cap by declared value). C: overdue also for "submitted"; add Note column. |
| 57 | Insurance certificate sheet: "Cargo insurance certificate CERT…", "for booking … · date …", Insurer / policy + validity, Insured + BIN, Goods, Route + legs, Insured period, Insured value + EUR/USD, Premium + EUR/USD, Rate "NBK of dd.mm.yyyy", "Deductible / claim notice: 0.5 % · 30 calendar days", footer "SAMPLE · the insurer's form is being agreed · not an insurance policy.", Print / PDF, Close | InsuranceCert.tsx | 420 `docCert` (insurer/policy, policyholder, shipment, value, premium/deductible, period, SAMPLE note) | cut | C: add BIN, goods, EUR/USD via `fxLine`, claim days. |
| **CRM — Leads (/crm)** | | | | | |
| 58 | Access `crm:read`, writing `crm:write` | access-nav.json | Orders → Commercial (no perm; actions not gated) | cut | M: see spec P13. |
| 59 | Header "New lead" (crm:write) + hint "Website requests land here automatically. Public form: /request" | Leads | 500 CRM section: "New lead / tender" card, `howNote('leadHint')`, "Open the public request form" | present | — |
| 60 | Kanban New / Contacted / Quoted / Won / Lost with counts; card: company, route, tender no. · deadline, source · created date, owner | Leads lanes | 500 `crm()` columns; card: company, source, route, pallets, zone, tender + deadline, BIN, message, lost reason | cut | C: show created date and owner on the card. |
| 61 | Lead detail: Contact person, E-mail (mailto), Phone (tel), Route, Temperature class, Pallets · frequency, Source · date, "Data-processing consent" date, BIN, Tender no., Submission deadline, message; note "Viewing personal data is recorded in the audit log." | `LeadDetail` | — (stage buttons on the card only) | missing | M: see spec P14. |
| 62 | Edit status / hub / owner, "Reason" when lost, "Save" | `LeadDetail.save` | 500 stage buttons; lost reason forced to "not given" | cut | M: spec P14. |
| 63 | "Convert to customer" (BIN match → no duplicate) | `convert` | 500 "Won → customer" → `onboard()` (matches by BIN) | present | — |
| 64 | Onboarding wizard after convert: "A customer with this BIN exists — the lead is linked to it (no duplicate)." / "Customer created.", "Create portal user · <username>" (users:admin) → one-time password shown once, "Create API client" with scopes slots:read, quotes:write, bookings:write, bookings:read, shipments:read + "Webhook URL (optional)" (integrations:admin) → key "Shown once — hand it to the customer over a secure channel:" | `OnboardWizard` | 500 `onboard()` creates customer + task "Onboarding: portal access, price list and contract for …" | missing | M: see spec P15. |
| 65 | "Erase personal data" with confirm "Permanently erase the contact data of this lead?" | `anonymize` | — (described in help 20-ops.js) | missing | M: spec P14. |
| 66 | Task from the lead (title ≥ 2, due date, assignee = owner) | `addTask` | 500 "+ task" (fixed title "Contact: …", +2 days) | cut | C: let the user type title and due date. |
| 67 | New lead form: Company*, Contact person*, E-mail, Phone, From, To (free text), Source (Phone, E-mail, Referral, Tender, Manual), Message, BIN (12 digits), Tender no. + Submission deadline for tenders | `NewLead` | 500 form: company, source, contact, BIN, tender no. + deadline (required for tender), from/to selects, zone, pallets | cut | M: add E-mail, Phone, Message (spec P14). |
| 68 | Tasks page: Mine / All, new task with assignee ("Me" or person), checkbox done, overdue red, "CRM #id" link | Crm.tsx `Tasks` | 500 Tasks section (title, due, customer; done button; overdue chip) | cut | C: Mine/All toggle and assignee select. |
| **CRM — Customers (/customers)** | | | | | |
| 69 | New customer (crm:write): Company, BIN / IIN with check digit + KGD check + name capture, City, Contact person, E-mail, Phone, Create | `Customers` form | 500 Customers → "New customer": BIN/IIN, Company (autofill), City, Contact person | cut | C: add E-mail and Phone (masked in the table). |
| 70 | Table Company, BIN, City, Contact, E-mail and Phone **masked**, "Show personal data" (audited reveal) | `Customers` table | 500 table: e-mail shown in clear, no reveal | cut | M: see spec P16. |
| 71 | Per customer "Contracts" and "Price lists" toggles opening the inline panels | `CustomerContracts`, `CustomerPriceLists` | 500 global sections "Price lists" and "Contracts" with a customer column; "Terms" + "Framework" columns in Customers | present | C: optional filter by the selected customer. |
| 72 | Address book with staff "Address checked" (FR-150/151) | (portal sites) | 500 customer address book card, "Address checked", "×", "Add address" | present | — |
| 73 | Empty state | `<Empty/>` | — (seeded) | present | — |
| **Contracts (Contracts.tsx)** | | | | | |
| 74 | Generate from template: template select "kind · code vN · LANG · title", valid from (default today) / to, Discount % and Base diesel ₸/l (placeholder "· from the price list"), "Generate from template", "Install the built-in templates (v1, RU / DE / EN)" | `CustomerContracts` | 500 Contracts → "Generate a contract from a template" (kind select, discount, diesel base, from/to, "Create draft") | cut | C: template language RU / DE / EN in the select. |
| 75 | Table Number, Template, Status (Draft / Sent to customer / Signed / Void), Validity, Text hash (SHA-256), Signer / void reason; "Open text", "Send to customer" (draft), "Void" with prompt "Reason for voiding" (≥ 3) | `CustomerContracts` | 500 contracts table, "Send for signature", "Void" (no reason), "Text" | cut | M: see spec P17. |
| 76 | Staff cannot sign; only the customer signs | Contracts.tsx | 500 "Sign for the customer (demo e-sign)" on the staff side | cut | M: spec P17 (remove or label as demo shortcut). |
| 77 | Contract sheet: markdown text, hash, template · version · language, validity, signed at · signer · signature check, void reason, "Print / PDF", Close, Esc | `ContractSheet` | 500 "Text" card (pre text, SHA-256, signer) | present | C: Print button. |
| 78 | Real NCALayer CMS signature, KGD register online check | esign/ncalayer.ts, BinField | demo | n-a | n/a (backend). |
| **Price lists (PriceLists.tsx)** | | | | | |
| 79 | Current chip "In force today · #id · framework · −10 % · diesel now 340 / 300 ₸/l" or "No price list in force – line tariff without discount or surcharge.", intro text | `CustomerPriceLists` | 500 Price lists: status "in force", intro note with fuel formula, example calculation | present | — |
| 80 | Create: kind framework / spot (discount disabled for spot), discount 0–50 step 0.5, diesel base 101–2000 required, valid from (required) / to, "Create price list" | form | 500 `cmPlAdd` | present | — |
| 81 | Table #, Kind, Discount, Diesel base, Valid from–to, Status current / active / deactivated, "Deactivate" with confirm "#id · Deactivate the price list? New quotes fall back to the previous list or the line tariff.", empty "No price lists yet." | table | 500 table + "Deactivate" (no confirm) | present | C: add the confirm. |

### Port result e (state after R2): ported 36, skipped 1

| Audit row id | Function | v6 place (menu → tab, file / function) | State after port | Test group name |
|---|---|---|---|---|
| D1 | Portal / offer bookings had no `hist` → desk crash | 510 wrapper of `newBooking` (defaults hist, note, load, value, kg, by) | ported | R2 D1/D2/D3/P10 … |
| D2 | LOCS cities broke desk / certificate / insurance | 420 `body`, drawer, `docCert`, `offerDoc`; 430 cert rows → `locName()` | ported | R2 D1/D2/D3/P10 … |
| D3 | Desk price VAT 12 % vs portal 16 % | 420 `bookingPrice` uses stored `b.price` / `priceFor` | ported | R2 D1/D2/D3/P10 … |
| D4 | Insurance used `b.value`, portal stores `declared` | 420 `bookingValue`, `certOf`; 430 `claimOpen`, `declared`, claimNew | ported | R2 insurance … |
| D5 / #19 / #30 | Portal express → 3-function approval | 510 `bkSend` pushes into `S.express` (`booking`, `EX-…`), exSync on exSign/exReject/exTick wrappers; desk hides Confirm while pending; My bookings "Express requests" table; EXST.timeout; done-card EX line | ported | R2 D5/P5 … |
| #6 / P1 | Pick-up window | Book → Pickup card, 510 `addrBlock`, `ready`, `visSlots`; desk drawer + offer sheet | ported | R2 P1/P2/P7 … |
| #10 / P2 | Incompatible goods mix | 510 `goodsBlock`, `ready`, change handler keeps zone | ported | R2 P1/P2/P7 … |
| #16 / P3 | ADR departures | 510 `LINES.adr`, `slotsFor` (adr/mode/lead), `priceBlock`, `ready` | ported | R2 P3 … |
| #18 / P4 | Payer contact, e-mail, phone, invoice address, role other, KGD autofill, masks | 510 options card, `payerErr`, `payerObj`; 420 `payerLine` (drawer) | ported | R2 P4 … |
| #22 #23 #41 #44 / P6 | Lock price (quote) + one offer / contract sample | 510 `bkQuote`, `bkOfferDoc`, `DRAWERS.bkDoc`; 420 global `offerDoc` (desk tab, print); 500 Offers "Sample" | ported | R2 P6 … |
| #25 / P7 | LOT | 510 options card → `b.lot`; 420 drawer + `l.lot` on confirm | ported | R2 P1/P2/P7 … |
| #29 / P8 | My bookings: offer sample, insurance certificate, cancel with confirmation | 510 rows (`bkDoc`, `bkCert`, inline "Cancel booking?" Yes/No) | ported (inline confirm instead of `confirm()` — the test harness cannot answer dialogs) | R2 P8/P9 … |
| #32 / P9 | Contract text before signing | 510 contracts card (Open text, sign disabled until opened), `DRAWERS.bkDoc` k=ct (text, full SHA-256, template, validity, signature check, hint, Print/PDF), framework chip / empty text / signed notice | ported (`ACT.bkSign` itself not gated, so old a0 test keeps working) | R2 P8/P9 … |
| #37 #39 / P10 | One booking record shape; confirm with hub ids, city on order | 420 `bookingConfirm` (hub mapping; same-hub regional booking confirmed without trunk load) | ported | R2 D1/D2/D3/P10 … |
| #38 / P11 | Address review four-eyes | 420 drawer "Address check", `bookingAddrReview`, `bookingNeedsReview`, row chips, Confirm disabled | ported | R2 P11 … |
| #51 / P12 | Public "Shipment history" | 530 `trackHistory` (HOOKS.status records, derived older events, ETA change, delay, partner, quality hold), seed on LD-2026-001855 | ported | R2 P12 … |
| #49 | Planned vs current ETA, delivered time | 530 `etaFacts` | ported | R2 P12 … |
| #56 | Claims: cap by declared, overdue also submitted, Note column | 430 | ported | R2 insurance … |
| #57 | Certificate: BIN, goods, route legs, EUR/USD, claim days, footer | 420 `docCert` (global, also portal) | ported | R2 insurance …, R2 P8/P9 … |
| #55 | Policy card: insurer BIN, kind, validity | 430 | ported | R2 insurance … |
| #4 | Save to address book | 510 `bkSaveAddr` | ported | [lang] R2 render |
| #5 | Site / opening hours per address | 510 `addrBlock` → pickup/delivery, desk drawer | ported | R2 P1/P2/P7 (render) |
| #7 | "Did you mean" chips | 510 `bkStreet` | ported | [lang] R2 render |
| #8 | Same street check | 510 `ready` | ported | — (rule only) |
| #9 | max 6 categories | 510 change handler + `ready` | ported (per-category hint not ported) | R2 P1/P2/P7 |
| #12 | average kg per pallet line | 510 `goodsBlock` | ported (step 0.5 skipped: createLoad needs ≥ 1 pallet) | render |
| #13 | remove line × | 510 `bkLineDel` | ported | render |
| #14 | warnings title | 510 `goodsBlock` | ported | render |
| #15 | DG net quantity + unit, emergency role, full class list | 510 DG block, 420 `dgText` | ported | R2 P3, render |
| #17 | declared value cap | 510 `ready` | ported | — |
| #20 | Customer price list line | 510 `priceBlock`, `offerDoc` | ported | render |
| #24 | slot mode + lead days | 510 `priceBlock` | ported (holiday names skipped) | render |
| #28 | My bookings goods/DG, address chip, on-account, reject reason | 510 rows; 420 reject stores `b.reason` | ported | R2 P8/P9, render |
| #37 (C) | goods/DG and "⚠ check weight" chip on desk | 420 `body` | ported | R2 D1… (render) |
| #46 | Message textarea, 0.3.9 consent text | 530 | ported | [lang] R2 render (request) |
| — | Desk "Cancel" was overridden by the portal's `ACT.bkCancel` (name clash) | 420 action renamed `bkDeskCancel` | fixed | R2 D1/D2/D3/P10 |
| #33, #36, #40, #54 | deep link ?bk=, default filter new, departure-cancelled chip, insurance tab perm | — | skipped (cosmetic / depends on other streams; #54 kept read-only for finance as is) | — |

### Port result f (state after R2): already present 1, ported 15, skipped 1

| Audit row id | Function | v6 place (menu → tab, file / function) | State after port | Test group name |
|---|---|---|---|---|
| C#58 | Commercial needs crm:read, writes crm:write; FX manual rate costs:approve; forms hidden for read-only | Orders → Commercial; 505 tab perm + `gate()` + `commercialBody` post-processing | ported | R2 P13 Commercial needs crm:read, writing needs crm:write, auditor is read-only, FX needs costs:approve |
| C#60 | Lane card: source · created date, owner (+hub) | Orders → Commercial → CRM; 505 `postCrm` | ported (cosmetic) | R2 P14 lead drawer … |
| C#61 | Lead detail: contact, e-mail (mailto), phone (tel), route, temperature class, pallets · frequency, source · date, consent date, BIN, tender, deadline, message, PD audit note; open = audit "PD viewed" | 505 `DRAWERS.lead`, `ACT.cmLeadOpen` | ported | R2 P14 lead drawer … |
| C#62 | Edit status / hub / owner, lost reason ≥ 3, Save; stage button "Lost" without reason opens the drawer | 505 `cmLeadSave`, `cmLead` | ported | R2 P14 lead drawer … |
| C#63 | Convert to customer (BIN match, no duplicate) | 505 drawer button → 500 `cmLead won` / `onboard` | already present (button added to drawer) | R2 P15 onboarding … |
| C#64 | Onboarding wizard: created / linked line, portal user + one-time password (users:admin), API client with 5 scopes + optional https webhook, key `olk_<8hex>_<24hex>` shown once (integrations:admin); dispatcher sees only the first line | 505 `onboardCard`, `cmOnbUser` (uses 450 `userCreate`), `cmOnbApi` (S.apiKeys / S.webhooks) | ported | R2 P15 onboarding card … |
| C#65 | "Erase personal data" with confirm, audit "PD erased", card marked | 505 `cmLeadErase` | ported | R2 P14 lead drawer … |
| C#66 | Task from the lead: title ≥ 2, due date, assignee = owner | 505 drawer task form, `cmLeadTask` | ported | R2 P14 lead drawer … |
| C#67 | New lead: E-mail, Phone (≤ 20), Message (≤ 2000); "Website form" not in the manual source select | 505 `postCrm`, `cmLeadAdd` wrapper | ported | R2 P14 lead drawer … |
| C#68 | Tasks Mine / All, assignee select, "CRM L-…" link | Orders → Commercial → Tasks; 505 `tasksSec`, `cmTaskSeg`, `cmTaskAdd` wrapper | ported (cosmetic) | R2 tasks: Mine / All, assignee select, CRM link opens the lead |
| C#69 | New customer: E-mail, Phone | 505 `postCustomers`, `cmCustAdd` wrapper | ported | R2 P16 customers … |
| C#70 | E-mail / phone masked, "Show personal data" (pii:read) audited | 505 `maskEmail`, `maskPhone`, `cmPiiShow`, `COMM.revealed` | ported | R2 P16 customers … |
| C#74 | Template select with language RU / DE / EN; text header names the language | 505 `postContracts`, `cmCtAdd` wrapper (`c.lang`, `c.tpl` FW-xx v3 / SPOT-xx v2, hash recomputed) | ported | R2 P17 contracts … |
| C#75 | Void needs reason ≥ 3 (inline field), reason in Signature column and text card, audited with the reason | 505 `cmCtVoid`, `cmCtVoidOk` | ported | R2 P17 contracts … |
| C#76 | Staff cannot sign for the customer (demo shortcut only with `?demo=1`, labelled "Customer signature (demo shortcut)") | 505 `postContracts`, `cmCtSign` | ported | R2 P17 contracts … |
| C#77 | Contract sheet: template · language · validity, signature check, void reason, Print / PDF | 505 `postContracts`, `cmCtPrint` | ported (cosmetic) | R2 P17 contracts … |
| help | 20-ops.js CRM text (lead card, convert, erase PD, Show PD with pii:read, Tasks Mine/All) | now all exist; extra help in help/r2-crm.js | aligned by making features exist (20-ops not edited) | [xx] R2 CRM … render … |

## Audit D: /drivers, /planning lines, /master-data, /oncall, /users, /audit, /account, /integrations, /records

Audit counts: cut 27, missing 12, n-a 2, present 17

Sources: 0.3.9 `Olymp-Logistic-Platform/frontend/src` (`pages/Resources.tsx` Drivers, `pages/Booking.tsx` Planning + Integrations, `pages/LineVehicles.tsx`, `pages/MasterData.tsx`, `pages/Oncall.tsx`, `pages/Admin.tsx` Users / Audit / Account, `pages/Login.tsx` ChangePassword, `pages/Crm.tsx` ExportButton, `pages/IntegrationHub.tsx`, `integrationsCatalog.ts`, `pages/Records.tsx`; demo data `demo/mockApi.ts`, `demo/snapshot.json`, `demo/planningValues.json`; texts `i18nDict.ts`). Target: `platform-src/v6/screens/*.js` (050, 320, 350, 400, 410, 440, 450, 001), help `v6/help/30-records.js`.

Legend: **present** = function exists in v6 (layout may differ) · **cut** = exists but reduced · **missing** · **n-a** = backend only. "M" = mandatory, "c" = cosmetic.

| # | Function | 0.3.9 place | v6 place (menu → tab, file) | State | Action |
|---|---|---|---|---|---|
| **/drivers** | | | | | |
| D1 | Driver list (name + compliance state) | /drivers table | Drivers → Drivers, `050-drivers.js` `table()` (+ KPIs, filters, RTO, rating — superset) | present | — |
| D2 | Columns **IIN (masked)** and **Phone (masked)** (`••••••••4514`, `•••• 68`) | /drivers table cols `IIN`, `Phone` | — (drawer shows phone in clear `dr.phone`) | missing | M — add masked IIN / phone to the list and drawer, see spec D2-3 |
| D3 | **"Show personal data"** button (pii:read) → reveals IIN, phone, licence no. for that row, audited `pii.read`; note "Viewing personal data is recorded in the audit log." above the table | /drivers | note only: `howNote('pdNote')` in `DRAWERS.driver` | cut | M — reveal action + audit + gating, spec D2-3 |
| D4 | Licence until / ADR until dates | /drivers cols `Licence until`, `ADR until` | Drivers → Staff, `320-staff.js` (licence-until sub-line, ADR column with ≤60/≤30 d chips and "Book course") | present | — |
| D5 | **Add driver form**: Name (3–150), Hub, IIN (12 digits, placeholder "12 digits"), Phone (placeholder "+7 7xx xxx xx xx"), Licence no., "Licence valid until" (date), "ADR until" (date); note "IIN, phone and licence number are stored encrypted and shown masked in the list."; Save / Cancel | /drivers "+ Driver" | `DRAWERS.addDriver` (Full name, Class C/CE, Experience, Hub only); `ACT.saveD` | cut | M — spec D5 |
| D6 | Role gating: "+ Driver" only with `drivers:write`, "Show personal data" only with `pii:read` | /drivers | `SCREENS.drivers.actions` shows Import / Compliance / Add for every role with drivers:read | cut | M — gate `addD`/`impD` by `canDo('drivers:write')`, reveal by `canDo('pii:read')` |
| D7 | Deep link `/drivers?new=1` opens the add form (used by Master data "+ Driver") | /drivers | — | missing | c — accept `?s=drivers&new=1` in the P6 deep-link handler → `openDrawer({type:'addDriver'})` |
| **/planning — lines & tariffs** | | | | | |
| P1 | Lines table: hub, line, days, departure, capacity (pal), chambers, cut-off (h), line vehicles | /planning "Regular lines" | Routes → Lines & tariffs, `350-lines.js` `#ln_table` (line, days/departure, cut-off, transit, vehicles, capacity per departure) + 14-day departures + multi-leg routing (superset) | present | — |
| P2 | Line vehicles (FR-173): ✎ → checkboxes of same-hub vehicles with status, Save / ×, max 10, "no vehicles", "No vehicles in the hub.", audit `schedule.updated` | `LineVehicles.tsx` | `350-lines.js` `.ln_veh` checkboxes + "+ add truck" select (same hub, ⚠ service), audit "Line vehicles changed" | present | c — enforce ≤ 10, show "no vehicles" when empty |
| P3 | **Cancel departure**: prompt "Departure date (YYYY-MM-DD)" + "Reason for cancellation" (≥ 3 chars); affected bookings listed "departure cancelled: BK-…"; bookings flagged on the desk with chip "departure cancelled" | /planning row button "Cancel departure" | `ACT.lnExc` per departure row ("cancel" / "restore"), no reason, no affected bookings, no chip on Orders → Bookings | cut | M — spec P3 |
| P4 | Role gating: cancel departure, assign vehicles, edit tariffs only with `planning:admin` | /planning | not gated (every role that sees Routes can edit) | missing | M — wrap `.ln_veh`, `[data-lnadd]`, `.ln_tar`, `lnExc` in `canDo('planning:admin')`; read-only text otherwise |
| P5 | **Tariffs (net)** per hub × temp class: Base fee, "₸ / pal · km", Minimum; ✎ → number inputs (step 100 / 0.5, min 0) → Save; audit `tariff.updated` old→new | /planning "Tariffs (net)" | `350-lines.js` `#ln_tariffs`: pair × zone ₸/pallet, always-editable inputs, audit per change | cut | M — spec P5 |
| P6 | Formula note "Price = max(minimum; base + pallets × km × rate), rounded to 100 ₸, plus 16 % VAT." | /planning | — | missing | M — part of spec P5 |
| P7 | Inactive line shown dimmed | /planning | all v6 lines active | missing | c — `tr.dim` when `!l.active` |
| **/master-data** | | | | | |
| M1 | Intro note (versions with effective date; tier / rate need a 2nd user) + "· awaiting approval: N" | /master-data | Settings → Reference data, `440-rec-refdata.js` (KPI "Awaiting 2nd approval", critical-fields note) | present | — |
| M2 | Notice "Planning values not yet verified: N · to be confirmed by the responsible people (legal, accounting, operations) before go-live · [Open the list]" | /master-data | KPI tile "Planned values unverified" only | cut | c — make the tile clickable → `rfKind('verify')` |
| M3 | Kinds Partners, Cost parameters, Vehicles · history, Planning values · verification, Manufacturers · logos | /master-data segments | `KINDS` partner / cost / vehicle / verify / manufacturer (+ Places KATO, superset of Cities) | present | — |
| M4 | **Alarm thresholds** kind (URG_H, offMin, coldMin, graceMin, hbMin with ranges) | /master-data "Alarm thresholds" | — (coverage rules hard-coded `340-coverage.js` `R.COV.rules`) | missing | M — spec M4 |
| M5 | **Road restrictions** kind RS-001…004 (kind axle/gross/bridge/city, a, b, city, maxAxle, maxGross, maxGvw, from, to, start, end, road, off), four-eyes on **every** field | /master-data "Road restrictions" | data only as constant `RESTR` in `200-ops-model.js` (used by truck finder) | missing | M — spec M5 |
| M6 | **Lines · history / Tariffs · history** (read-only snapshot kinds, button "Lines and tariffs" → /planning, note "created in the register; this page keeps the version history") | /master-data | v6 `tariff` kind is a *separate editable* ₸/km rate per zone (`ZONES.rate`), not the history of Routes → Lines tariffs; no line history | cut | M — spec M6 (also removes the two-tariff inconsistency) |
| M7 | Drivers kind (register view: hub, licence until, ADR until, active) + "+ Driver" link | /master-data | — | missing | c — read-only kind `driver` from `S.drivers` + button → `addD` |
| M8 | Vehicles · history with "+ Vehicle" link to the fleet register | /master-data | `vehicle` kind read-only, note "Vehicles are edited under Fleet" (no button) | cut | c — add button → `go('fleet')` registry tab |
| M9 | Edit form: Key (placeholder PW-77 / Балхаш / RS-010 / Nipro / URG_H), fields, **Valid from (min = business date)**, "Second approval needed for: …", Save version / Cancel | /master-data | `DRAWERS.ref` form + `refSave` | cut | M — reject `valid_from < today` ("Valid from cannot be in the past"); a future version must not change `i.data` / `applyEffects` before its date (keep it as `scheduled`, apply when `valid_from <= today`) |
| M10 | Field validation: partner key `^[A-Z]{1,3}-\d{2,4}$`, BIN check digit, contract until `MM.YYYY`, city must exist; manufacturer badge 1–3, name 2–60, country 2–12, domain; 409 "Unchanged" | mockApi `mValidate` | `refSave`: BIN = 12 digits, numbers ≥ 0, "No changes" | cut | c — reuse the W4 BIN check-digit helper; add the patterns |
| M11 | Four-eyes approve / reject (approver ≠ author; "Four-eyes rule: a second user must approve this change"); history v · valid from · changed · status · who → approver | /master-data | `refDecide`, drawer "Version history" | present | — |
| M12 | Visibility / write per kind by permission (cost: costs:read / costs:approve; verify: audit:read / users:admin; partner: trips:read / partners:write; city, threshold, restriction, schedule, tariff: planning:admin; manufacturer: orders:read / planning:admin) | `/api/master` kinds | one rule for all kinds (`partners:write ∨ planning:admin ∨ users:admin`), approve = `approvals:sign` | cut | M — spec M12 |
| M13 | **Manufacturer logo upload**: "Upload…" (PNG / WebP, ≤ 300 KB, recommended 515 × 380 px), "Remove upload", Source column "uploaded · vN / standard / none (initials only)"; errors "PNG or WebP only.", "File larger than 300 KB." | /master-data Manufacturers | — (skipped in W3, TRACEABILITY W3 note) | missing | M — spec M13 |
| M14 | Planning values list = 26 entries (`planningValues.json`) | /master-data verify | 5 entries in Reference data; 26 in Settings → Baseline data (W5) | cut | c — link the verify kind to Baseline data → Planned values, or seed the 26 ids |
| **/oncall** | | | | | |
| O1 | Intro note, coverage cards per level (on call now / "Nobody now – contacts file fallback", "Covered: N h of 72 · gap!") | /oncall | Settings → On-call, `450-rec-admin.js` `oncallBody` | present | — |
| O2 | Add slot form: Level, User (optional), Shift label ("night shift"), Phone for SMS ("+7 701 …"), E-mail, From / Until (now / +7 d); "Add slot" disabled without SMS and e-mail | /oncall | `DRAWERS.oncallNew`, `oncallAdd` | present | — |
| O3 | Validation: SMS 10–15 digits, e-mail format, from < until, slot ≤ 62 days | mockApi `POST /api/oncall` | `oncallAdd`: phone ≥ 11 digits, from < until | cut | c — add "Invalid input: slot longer than 62 days" and e-mail check |
| O4 | Table level / shift · person / SMS / E-mail / From / Until / status (ended · current · planned/expired) / End; edit = admin or head_security; audit slot_added / slot_ended | /oncall | `oncallBody` rows, `ocEnd`, `canOncall()` | present | — |
| O5 | Empty state "No slots yet." | /oncall | — | missing | c |
| **/users** | | | | | |
| U1 | Create user: username `[a-z0-9._-]{3,64}`, name 2–120, role (11), hub ("All hubs", disabled for admin) / customer select (role customer) / partner ref `PL-\d{2,4}` | /users inline form | `DRAWERS.userNew`, `userCreate` (customer as free text "c1") | cut | c — customer as `<select>` of `S.customers` |
| U2 | One-time password notice "One-time password (shown once, hand over in person):" + Close; after create and reset password | /users | `S.ux.otp` card in `DRAWERS.user` | present | — |
| U3 | Notice "Approval slots without a holder: …" **with assign wizard** (per missing function: username select of active FN-role users except self + "Assign") and hint "(health check “approval_functions”)" | /users | `usersBody` red card with chips, no wizard | cut | M — spec U3 |
| U4 | Table: username + "Locked" chip, name, role, hub, Signatures (functions), 2FA ✓, last login, active, actions | /users | `usersBody` table + `DRAWERS.user` (role, hub, active, functions) | present | — |
| U5 | Reset password (OTP), Reset 2FA (not self), Unlock (if locked) | /users | `ACT.usReset` | present | — |
| U6 | Rules: "This role cannot hold approval functions", "You cannot lock yourself out", "You cannot change your own approval functions" (self = signed-in user) | mockApi | self = only `admin` username; functions kept when the role changes to driver / viewer / customer / partner | cut | c — clear `fn` when the new role is not in FN_ROLES; self = `USERS[S.role]` |
| U7 | **Export all data** card (admin with all hubs): "Your data belongs to you" / "Complete export of all data (JSON) incl. personal data. Recorded in the audit log. Store the file encrypted." / "Export all data" → `olymp-export.json` | /users bottom (`ExportButton`) | — | missing | M — spec U7 |
| **/audit** | | | | | |
| A1 | "Verify integrity" → "Chain intact: entries checked: N" / "Integrity broken at entry N" | /audit | Settings → Audit log, `auVerify`, `auditVerify()` in `400-rec-core.js` (+ "Simulate tampering", CSV) | present | — |
| A2 | Filters: action prefix (placeholder "Action (auth., trip., pii.)"), user, Search | /audit | module select + free-text search | cut | c — accepted as equivalent |
| A3 | Columns # / Time / User / Action / Object / Details (k=v) / IP / Hash; failed / throttled actions in red | /audit | # / time / user+role / module / action·object+reason / hash ← prev | cut | c — add IP column (demo "10.20.4.17") and red text for decisions containing "failed" / "throttled"; seed one `auth.login_failed` |
| **/account** | | | | | |
| AC1 | Facts: Username, Role, 2FA "Two-factor protection on", "Session valid until" | /account | `001-shell-ext.js` `SCREENS.account` (+ name, default hub, last sign-in, permissions, sign out, reset demo) | present | — |
| AC2 | Change password: **Current password**, New password, Repeat password (12–128), hint "At least 12 characters. A passphrase of several words works best.", "Passwords do not match", "Saved" | /account `ChangePassword` | `acctPw`: new + repeat only | cut | M — add "Current password" (required, any non-empty in demo; error "Enter the current password") and max 128 |
| AC3 | Real password check, hashing, TOTP, session expiry | backend | demo flow P6 | n-a | n/a (backend) |
| **/integrations** | | | | | |
| I1 | "Next deadlines" card (date, name, basis, chip "in N days", red ≤ 120) | IntegrationHub | Settings → Integrations catalogue, `450-rec-admin.js` `integBody` | present | — |
| I2 | "Summary" card: Systems N · mandatory N · conditional N; Configured N · manual N · planned N; "Data: built-in catalogue (research 11.10.2026)."; "Inbox messages →" | IntegrationHub | 4 KPI tiles + "Access rule" card with "Inbox messages →" | cut | c — add conditional / manual / planned counts to a tile sub-line |
| I3 | **ESUTD readiness** panel: deadlines "Pre-trip medical check in ESUTD (vehicles > 3.5 t)" 01.01.2027 and "ESUTD: e-TTN and electronic trip sheet" 01.06.2027 with "N days left" chips; table per hub Trips / Trip sheet complete / TTN for every order / Medical check / Readiness % | `EsutdPanel` | — | missing | M — spec I3 |
| I4 | Category tables: System (+ operator, note, chip "unverified"), Mandatory · legal basis (+ "deadline: …"), API, Status (+ last error), Sync (+ items), Inbox feeds | IntegrationHub | `integBody` tables (no note, no unverified chip, no last error / items; extra Connect / Sync buttons) | cut | c — add `note` line and "unverified" grey chip (14 systems) |
| I5 | **Catalogue content**: 41 systems (37 + 4 telematics/courier) | `integrationsCatalog.ts` | 24 systems in `S.integ` (6 extra: kato, egov_bin, thermoking, nbk, onec, partner_api) | cut | M — spec I5 (23 systems to add) |
| I6 | Inbound webhooks table "Inbound webhooks (POST /api/v1/inbound/{source})" | IntegrationHub | — | n-a | n/a (static catalogue has no `inbound`; only filled by the server) |
| I7 | Line "Webhooks: N pending · N failed" | /integrations | per-webhook last delivery | cut | c |
| I8 | **API key create**: Name (3–100), **Customer** (required select), Webhook https://… (optional), scopes `slots:read quotes:write bookings:write bookings:read shipments:read` (all ticked); hint "Standard REST API v1 (booking, slots, prices, status) with signed webhooks. Spec: docs/partner-api.json" | /integrations "API keys for partners & customers" | `DRAWERS.keyNew` (name + scopes `bookings:read bookings:write tracking:read inbox:write invoices:read`), webhooks as a separate table | cut | M — spec I8 |
| I9 | Key shown once: "The key is shown once. Hand it to the partner securely." + key `olk_<8 hex>_<token>` + "Webhook secret:" + Close | /integrations | `S.ux.key` card "Secret shown once" (no close, no webhook secret) | cut | c — add Close and webhook secret when URL given |
| I10 | Keys table Name / Key `olk_<prefix>_…` / Scopes / Webhook / Last login; **Revoke with confirm** "Revoke key? The partner integration will stop working." | /integrations | `keys` table, `igRevoke` without confirm | cut | M — confirm step before revoke (inline "Yes, revoke / Cancel" like `resetAsk`) |
| I11 | Page only for `integrations:admin` | route guard | tab `perm: 'integrations:admin'` | present | — |
| **/records landing** | | | | | |
| R1 | Landing "Records and administration": lead text + 6 group cards (Orders and trips; Cold-chain logs; CRM; Registers; Administration; Channels) with role-filtered links + split visual | `Records.tsx` | Help article `records` (`help/30-records.js`, visual `split`) — no clickable cards | cut | c — optional: link list in the help article per area (`data-act="go"`) |

**Counts:** present 17 · cut 27 · missing 12 · n-a 2 (58 rows). Mandatory gaps: 21 (cut 13, missing 8); cosmetic gaps: 18.

---

### Port result d (state after R2): already present 2, ported 29, skipped 2

| Audit row id | Function | v6 place (menu → tab, file / function) | State after port | Test group name |
|---|---|---|---|---|
| D2 | IIN / phone masked in list and drawer | Drivers → Drivers, `050-drivers.js` `PII`, `pii()`, `table()`, `DRAWERS.driver` | ported | R2 drivers: IIN / phone masked, "Show personal data" … (D2 / D3 / D6) |
| D3 | "Show personal data" (pii:read) + audit + note above table | `050-drivers.js` `driverPiiReveal`, `ACT.drvPii`, `[data-pii-note]` | ported (audit "Personal data viewed", reason `iin,phone,license_no`) | same |
| D5 | Add-driver form (name 3–150, hub, IIN, phone, licence no., licence / ADR until, note, Save / Cancel, "Invalid input: …") | `050-drivers.js` `DRAWERS.addDriver`, `driverCreate`, `ACT.saveD` | ported (v6 class + experience kept; ADR → `d.res.adr`; audit `driver.created`) | R2 drivers: add-driver form … (D5 / D7) |
| D6 | "+ Driver" / Import only with drivers:write; reveal only with pii:read | `SCREENS.drivers.actions`, `ACT.addD/impD`, `driverCreate` | ported | R2 drivers: IIN / phone masked … ; add-driver form … |
| D7 (c) | Deep link `?s=drivers&new=1` | `050-drivers.js` DOMContentLoaded listener | ported (trivial) | — (needs a URL reload; not tested) |
| P2 (c) | ≤ 10 vehicles, "no vehicles", "No vehicles in the hub." | `350-lines.js` `lineVehSet`, lines table | ported | R2 lines: planning:admin gates … (P4) |
| P3 | Cancel departure with date + reason (≥ 3), affected bookings flagged, chip on Orders → Bookings, restore removes flag, audit | `350-lines.js` `lineCancel`, `lineRestore`, `ACT.lnExcAsk/lnExc/lnExcDel`; chip via wrapper of the Bookings tab body in `450-rec-admin.js` (420 not touched) | ported (bookings matched by lane from/to + status new/confirmed — bookings have no departure date) | R2 lines: cancel departure needs a reason … (P3) |
| P4 | Cancel / vehicles / tariffs only with planning:admin; read-only otherwise | `350-lines.js` `body()` (`adm`), `lineCancel`, `lineTariffSave`, `lineVehSet` | ported | R2 lines: planning:admin gates … (P4) |
| P5 | Tariffs (net) hub × class: base, ₸/pal·km, minimum; ✎ → inputs → Save; "Invalid input"; audit old→new | `350-lines.js` `S.res.tnet`, `RES.tnetOf`, `RES.netPrice`, `lineTariffSave`, `#ln_tnet` | ported; AST + ALA rows (other hubs fall back to AST); pharma = chilled values; city-pair table kept as **computed read-only cache** (`S.res.tariff`, `RES.tariff` unchanged API); `RES.route` leg price uses the formula | R2 lines: tariffs (net) … (P5 / P6) |
| P6 | Formula note "Price = max(minimum; …) rounded to 100 ₸, plus 16 % VAT" | `350-lines.js` `[data-tariff-formula]`, `RES.VAT = 0.16` | ported | same |
| P7 (c) | Inactive line dimmed | `350-lines.js` `tr.dim` | ported | — |
| M2 (c) | Unverified-values tile opens the verify kind | `440-rec-refdata.js` `[data-verify-tile]` | ported | render group |
| M4 | Alarm thresholds URG_H / offMin / coldMin / graceMin / hbMin with ranges, no four-eyes, effect | `440-rec-refdata.js` kind `threshold`, `THR`, `applyThr` → `RES.COV.rules[key]`; URG_H via wrapper of `RES.urgent` (window when the caller passes no other value) | ported | R2 reference data: alarm thresholds … (M4) |
| M5 | Road restrictions RS-xxx, rules, four-eyes on every field (also new records) | kind `restriction`, `check()`, `syncRestr()` mutates the global `RESTR` array of `200-ops-model.js` in place (200 not edited) | ported — the truck finder (`legsOf`) reads the effective versions | R2 reference data: road restrictions … (M5) |
| M6 | Lines · history / Tariffs · history read-only, fed by Routes → Lines edits; button "Lines and tariffs"; single tariff source | kinds `schedule`, `tariffh` (key `tariffh` because `tariff` stays the zone-rate kind used by old tests), `refLog()`, called from `350-lines.js` | ported; old editable `tariff` kind renamed "Zone rates (cost model)" (cost rights) | R2 reference data: lines / tariffs history … (M6) |
| M7 (c) | Drivers kind (read-only register view) + "+ Driver" | kind `driver` (live from `S.drivers`), `ACT.rfAddDrv` | ported | render group |
| M8 (c) | "+ Vehicle" → fleet | `ACT.rfFleet` | ported | render group |
| M9 | Valid from ≥ business date; future version "scheduled", applied on its date | `refSave` ("Valid from cannot be in the past"), `schedule()`, `refTick()` (body render + every save; `REF_TODAY` override for tests), `refDecide` schedules approved future versions; date input `min` | ported | R2 reference data: valid-from not in the past … (M9) |
| M10 (c) | Extra field patterns | — | skipped (cosmetic, not trivial) | — |
| M11 | Four-eyes approve / reject | `refDecide` + note "Four-eyes rule: a second user must approve this change." | already present (note added) | — |
| M12 | Read / write per kind; approve needs kind right | `KINDS[k].r / .w`, `canRead/canWrite/canApprove`, nav filter, form only with write right | ported. **Deviation:** approve = read right AND (write right OR approvals:sign) — in v6 role-perms only admin has planning:admin, so the 2nd person for restrictions / places is an approvals:sign holder (manager) | R2 reference data: kinds visible / writable per permission … (M12) |
| M13 | Manufacturer logo upload PNG / WebP ≤ 300 KB, source column, remove, label helper prefers upload | `440-rec-refdata.js` `refLogo`, `logoCell`, file input `[data-rf-logo]`, wrapper of global `mfrSrc()` (manufacturer → catalogue key `mfr`) | ported (data URL in a new version) | R2 reference data: manufacturer logo upload … (M13) |
| M14 (c) | 26 planned values | — | skipped (cosmetic; 26 already in Baseline data) | — |
| U3 | Approval-slot wizard (select + Assign, not self, only FN roles), tail text with health check | `450-rec-admin.js` `fnAssign`, `fnCandidates`, `ACT.usFnAssign`, `[data-fn-assign]` | ported (self = first active user of the current role, i.e. `admin`) | R2 users: approval-slot wizard … (U3) |
| U7 | Export all data card, JSON incl. personal data, audited | `450-rec-admin.js` `dataExportAll`, `ACT.usExport`, `[data-export-all]` (data:export and no hub restriction) | ported (`recDl('olymp-export.json')`) | R2 users: "Export all data" … (U7) |
| AC2 | Current password (required), 12–128, hint | `001-shell-ext.js` `S.acct.cp`, `ACT.acctPw`, `#ac_cp` | ported ("Enter the current password", "At most 128 characters") | R2 account: change password needs the current password … (AC2) |
| I3 | ESUTD readiness panel: 2 deadlines with chips, table per hub | `450-rec-admin.js` `esutdReadiness`, `esutdCard` (documents:sign) | ported (trip sheet = signed waybill + odometer + medical; TTN = load kdocs.ttn signed/sent/accepted; medical = waybill closed or `RES.medOk` today) | R2 integrations: ESUTD readiness panel … (I3) |
| I4 (c) | note line + "unverified" chip | `integBody` category rows | ported (trivial with I5) | R2 integrations: catalogue … (I5) |
| I5 | 23 missing systems; kaztoll / wialon aligned | `S.integ` (47 systems) | ported | R2 integrations: catalogue … (I5) |
| I8 | API key bound to a customer, https webhook, 5 scopes ticked, key `olk_<8 hex>_<token>`, hint | `DRAWERS.keyNew`, `apiKeyCreate`, `ACT.igKeySave`, keys table (Customer, Webhook columns) | ported (v6 extra scopes kept unticked) | R2 integrations: API key bound to a customer … (I8 / I9 / I10) |
| I9 (c) | Key shown once + webhook secret + Close | `S.ux.key / keySecret`, `ACT.igKeyClose` | ported | same |
| I10 | Revoke with confirm | `ACT.igRevokeAsk` → "Yes, revoke / Cancel" → `ACT.igRevoke` (audit `api_client.revoked`) | ported | same |
| O3, O5, U1, U6, A2, A3, I2, I7, R1, M10, M14 | cosmetic | — | skipped (not in scope / not trivial) | — |

