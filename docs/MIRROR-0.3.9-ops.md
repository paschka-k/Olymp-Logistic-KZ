# Mirror 0.3.9 → v6 · operations screens (R1)

Re-audit of release 0.3.9 (`releases/0.3.9/platform-en.html`, React source `Olymp-Logistic-Platform/frontend/src` at 0.3.10 = 0.3.9 + project documents) against v6.2.1 (`platform/en.html`, sources `platform-src/v6`), element by element, for: Shell, 01 Overview, 02 Dispatcher, 03 Load and weight, 04 Shipments and marking, 05 Thermo status, 06 Weather, 07 Security, 08 KZ documents and the records pages /trips, /orders, /coverage, /inbox, /alarms, /tasks. Hidden states (empty states, warnings, disabled conditions, permissions, simulations) were taken from the React source (`v5/screens`, `v5/engine`, `pages/Operations.tsx`, `TripActions.tsx`, `Resources.tsx`, `Crm.tsx`, `Login.tsx`, `Inbox.tsx`, `Coverage.tsx`).

State: ✅ present · ◐ cut down · ❌ missing · n/a not applicable (reason given). Action: **R1** = ported in this stream (see column "after R1"), — = nothing to do, *open* = left with a reason.

Totals of the audit: **160 functions audited · 91 present · 47 cut down · 16 missing · 6 not applicable.** The result after porting is summarised in section 5.

## 1 Shell, 01 Overview, 02 Dispatcher, /inbox, /alarms, /tasks

| # | Function | 0.3.9 place | v6 place | State | Action |
|---|---|---|---|---|---|
| S1 | Sidebar nav, badges, help | Layout `useV5Nav` | core `shell()`, `NAV_BADGE` | ✅ | — |
| S2 | Dispatcher nav badge: express requests waiting for **my** signature | Shell `expressAwaiting` | tab badge only (240) | ❌ | R1: `NAV_BADGE.dispatch` |
| S3 | Sidebar "Alarm simulation" block (5 sims, toast "instructions on the Overview screen") | Shell `SimButtons` | sims split over Routes → Temperature / Security | ◐ | R1: sidebar sim block |
| S4 | Live label, SIMULATION chip, telemetry every 2 s | Shell `SyncLabel` | core `liveBadge` | ✅ | offline state n/a (no server) |
| S5 | Language, design, version | Layout | core | ✅ | — |
| S6 | Hub filter | Shell header | 001 `hubFilter` | ✅ | — |
| S7 | Global search: rows field: hit · trip · vehicle · status / goods / article · LOT · qty → destination · location; "Found in current shipments: N" (total), up to 12 rows, empty text | Shell, engine/search.ts | 001 `gsLines` (8 rows, count of shown) | ◐ | R1 |
| S8 | Clock + "· Astana UTC+5" | Shell `Clock` | 001 | ✅ | — |
| S9 | "N active alarms" counts level ≥ 2 only, red when > 0 | Shell header | 001 counts every open alarm | ◐ | R1 |
| S10 | Banner level ≥ 2 | Shell `AlarmBanner` | 001 | ✅ | — |
| S11 | Bottom bar, burger, Escape | Layout | 001 | ✅ | — |
| S12 | Skip link | Layout | build, app.css | ✅ | — |
| S13 | Eyebrow, ◇ Diagram, ▶ Tour | Shell, ScreenExtras | 001, help | ✅ | — |
| S14 | Deep links `?veh= ?city= ?item=`, `/r/alarm/:id`, `/r/order/:id` (403 without the right) | Shell `SEL_PARAM`, DeepLink | 001 `?load ?dev ?fine ?s&t` | ◐ | R1: `?veh ?city ?item ?alarm ?order` |
| S15 | 403 for a forbidden screen | Shell `Forbidden` | core `go()` toast | ✅ | — |
| S16 | Login: first-time 2FA enrolment (QR, manual key, code), current password on forced change, failed sign-in text | pages/Login.tsx | 001 `loginLayer` (password → code → recovery → change) | ◐ | R1 |
| S17 | My account, sign out | Admin `Account` | 001 `SCREENS.account` | ✅ | — |
| S18 | Demo bar, reset | Layout | core, 001 | ✅ | — |
| S19 | Toast | Shell | core | ✅ | — |
| O1 | Playbook cards of active sims incl. **freeze** and **overheat** | Overview, engine/overview.ts | 010 `playbooks()` (security sims only) | ◐ | R1 (via T7) |
| O2 | Six KPIs | overview.ts | 010 | ✅ | — |
| O3 | Live trips with progress | Overview | 010 | ✅ | — |
| O4 | Alarms (9) + risks (6), "source →" | Overview | 010 | ✅ | — |
| O5 | Compact inbox, "All messages (N) →" counts open messages | InboxCompact | 010 counts all | ◐ | R1 |
| O6 | Hub weather 3 days | Overview | 010 | ✅ | — |
| D1 | Board lanes, count, selection | Dispatch | 030 | ✅ | — |
| D2 | Card issue tag Road / Weather / Load: check (level = max) | engine tripRows | 030 temperature problem only | ❌ | R1 |
| D3 | Unassigned ERP orders, one-click "To trip X", empty "All orders assigned." | Dispatch `open-orders` | 260 select + plan new trip | ◐ | R1 |
| D4 | Express awaiting approval (slots, deadline, your slot, empty) | DispatchExpress | 240 | ✅ | — |
| D5 | Aside header | Dispatch | 250 `tripAside` (drawer) | ✅ | aside is the load drawer |
| D6 | Driver "· ADR" marker | dispatch.ts | 250 | ◐ | R1 |
| D7 | Chambers with live temperatures + SIMULATION chip (tooltip "Training data, not real telemetry") | dispatch.ts `chambers` | 250 zone labels | ◐ | R1 |
| D8 | Vehicle type (plan) | dispatch.ts | 250 | ✅ | — |
| D9 | Stops with passed markers **and weather per stop** (max/min · condition, "no forecast", "· hub") | dispatch.ts `stops` | 250 km / ETA | ◐ | R1 |
| D10 | Coverage next dead zones, ETA confidence, link; durations as "in 5 h 43 min" | CovNext | 250 ("in 343 min") | ◐ | R1: `dur` format |
| D11 | Go/No-Go informational incl. "Roads · inbox" | dispatch.ts `checks` | 250 `preChecks` | ◐ | R1 |
| D12 | Service on route: workshops in any route city, not blocked, reefer-capable first for cold cargo, then route order, then tier | dispatch.ts `wsNear` | 250 (end hubs only) | ◐ | R1 |
| D13 | Trip sheet once | Dispatch | 250 | ✅ | — |
| D14 | Buran-free window | Dispatch | 250 | ✅ | — |
| D15 | Replan form: new departure (datetime) + reason weather / road / vehicle / customer, ETA moves, disabled until valid, permission | ReplanDb | 240 Replanning (no permission, other reasons) | ◐ | R1 |
| D16 | Load →, Thermo status → | Dispatch | 250 | ✅ | — |
| D17 | Driver-app feed | Dispatch | 250 `driverFeed` | ✅ | — |
| D18 | Empty state "No trips" | Dispatch | — | n/a | aside is a drawer; empty lanes show "—" |
| I1 | /inbox list, filters, Acknowledge / Done per kind permission, open screen | Inbox.tsx | 410 | ✅ | — |
| I2 | /inbox KPIs New / Acknowledged · in progress / Roads and weather · active / Critical · open; Done on new messages | Inbox.tsx | 410 New / Ack / Done / connectors | ◐ | R1 |
| I3 | Manual registration with kind-specific fields, fixed sources, target hint, side effects | InboxForm | 410 `inboxNew` (free source) | ◐ | R1 |
| I4 | "Demo: receive test messages" | Inbox.tsx | — | ❌ | R1 |
| I5 | Error line and meta line per message, "inbox only" | Inbox Row | — | ❌ | R1 |
| A1 | /alarms acknowledge, resolve (category + ≥ 10), level 3 acknowledged first, show resolved, `alarms:write` | Resources `Alarms` | 410 (+ escalation, on-call) | ✅ | — |
| K1 | /tasks Mine / All, form with assignee, done checkbox, CRM link, overdue chip, `crm:write`, empty state | Crm `Tasks` | 500 `tasks()` | ◐ | R1 |

## 2 03 Load and weight, 04 Shipments, 08 KZ documents, /trips, /orders

| # | Function | 0.3.9 place | v6 place | State | Action |
|---|---|---|---|---|---|
| L1 | Trip selector, type card, zones, regime, bulkhead, facts, plan | Load.tsx | 210 | ✅ | — |
| L2 | Non-fitting plan: reason with `trips:override_load` | Load.tsx | 210 / 200 | ✅ | — |
| L3 | Order tick is permission-gated | Load.tsx `load.order` | 210 `lwOrd` | ◐ | R1 |
| L4 | Diagram, bars, checks, top / side view, CoG | Load.tsx, View2Panel | 210 | ✅ | — |
| L5 | Loading sequence print + scan | SequencePanel | 210 | ✅ | — |
| L6 | Departure weighing + override | WeighPanel | 210 | ✅ | — |
| L7 | SSCC reconciliation, rescan | Load.tsx | 210 | ✅ | — |
| L8 | Vehicle match, truck finder (ranking, split, partner offers, restrictions, apply) | Load.tsx, FinderPlus | 210 | ✅ | — |
| L9 | Finder empty state "No ticked orders" + trailers note | Load.tsx | — | ◐ | R1 |
| H1 | Trip chips with item count | Ship.tsx | 220 | ✅ | — |
| H2 | Manufacturer directory, registry | Ship.tsx | 220 | ✅ | — |
| H3 | Packages with short-expiry tag | Ship.tsx | 220 | ✅ | — |
| H4 | Label sender "Olymp Logistic LLP · Hub", recipient = KDL branch or third-party consignee (also ZPL) | ship.ts | 220 `label()` | ◐ | R1 |
| H5 | Handling marks row (do not freeze / dry ice UN 1845 / protect from frost / ADR LQ / third-party / short expiry / IVD / fragile) | ship.ts | 220 (GS1 AI only) | ◐ | R1 |
| H6 | Print, ZPL | Ship.tsx | 220 | ✅ | — |
| H7 | Track & trace: partner hand-over events | ship.ts | — | ❌ | R1 |
| H8 | Track & trace: "Discrepancy: scanned N of M packages of order X" | ship.ts | — | ❌ | R1 |
| H9 | Track & trace: SSCC ↔ PL check, "not found at scanning", "awaiting loading (plan)", "received by branch · ePOD, temperature receipt" | ship.ts | 220 `track()` | ◐ | R1 |
| G1 | Documents KZ header, trip chips | Docs.tsx | 230 | ✅ | — |
| G2 | Full document set, conditional types | docs.ts | 230 `KDOC` | ✅ | — |
| G3 | Generate / PDF / Sign / IS ESF / all | Docs.tsx | 230 | ✅ | — |
| G4 | State-system statuses | Docs.tsx | 230 | ✅ | — |
| G5 | Working-draft note | Docs.tsx | 230 | ✅ | — |
| G6 | Gate "Vehicle available" (not in workshop) | docs.ts | — | ❌ | R1 |
| G7 | Gate "Documents complete" = whole applicable set, "missing: N" | docs.ts | 200 TTN + waybill | ◐ | R1 |
| G8 | Gate "Insurance, tax and inspection OK" (OGPO, KASKO, tax, inspection) | docs.ts | 200 OSAGO + cargo | ◐ | R1 |
| G9 | Weather gate blocks on level-3 road / storm messages of the inbox | docs.ts `roadRisk` | 200 `S.ops.storm` | ◐ | R1 |
| G10 | Driver gate: licence valid on the arrival date, medical check refused / older than 8 h / after departure | docs.ts `dbGates` | 200 "check today" | ◐ | R1 |
| G11 | ADR met, no critical alarms, load within limits | docs.ts | 250 / 200 | ✅ | — |
| G12 | Clear without weather forecast | Docs.tsx | 250 / 230 | ✅ | — |
| G13 | Release / withdraw | Docs.tsx | 230 | ✅ | — |
| G14 | State-document register rows of DB trips | docs.ts `STATE_KEYS` | — | n/a | backend register |
| T1 | Trips filter incl. aborted / cancelled | Operations `Trips` | 020 | ◐ | R1 |
| T2 | Trips columns departure + progress | Operations `Trips` | 020 | ◐ | R1 |
| T3 | Trip facts | TripDetail | 250 | ✅ | — |
| T4 | Forward status buttons | TripDetail | 020 / core | ✅ | — |
| T5 | "Back to planning" | TripDetail | — | ❌ | R1 |
| T6 | "Cancel trip" | TripDetail | — | ❌ | R1 |
| T7 | Status buttons only with `trips:status` | TripDetail | 020 `adv` | ◐ | R1 |
| T8 | Depart without release (reason, override right) | TripDetail | 230 / 200 | ✅ | — |
| T9 | Abort trip | TripActions | 250 | ✅ | submit disabled until valid → R1 |
| T10 | Edit trip: vehicle / driver "—", planned departure, ETA ≥ departure | TripEdit | 250 | ◐ | R1 |
| T11 | Stops: arrive, window, deliver per order | StopOutcomes | 250 | ✅ | — |
| T12 | Outcome after the fact: only eligible statuses (not for delivered), reason rules, Save disabled until valid | OrderOutcome | 250 | ◐ | R1 |
| T13 | Unassign order | TripDetail | 250 | ✅ | — |
| T14 | Documents / history on the trip page | — | drawer tabs | n/a | 0.3.9 has neither on /trips/:id |
| T15 | 403 + trip deep link + record title | DeepLink | 001 | ✅ | — |
| R1o | Orders search + filter | Orders | 250 | ✅ | — |
| R2o | `?q=` / `/r/order/:id` | Orders, DeepLink | — | ◐ | R1 (S14) |
| R3o | Created date in the order row | Orders | 250 | ◐ | R1 |
| R4o | New-order validation ranges (pallets 0.1–33 step 0.1, kg 1–20 000, goods 2–250, LOT ≤ 40) | NewOrder | 250 | ◐ | R1 |
| R5o | Copy link | CopyLink | 250 | ✅ | — |
| R6o | Renew token behind confirmation | Orders | 250 | ◐ | R1 |
| R7o | Cancel order | Orders | 250 | ✅ | — |
| R8o | Paging 100 per page | Pager | — | ◐ | R1 |
| R9o | Empty states | Empty | 250 | ✅ | — |

## 3 05 Thermo status, 06 Weather, 07 Security, /coverage

| # | Function | 0.3.9 place | v6 place | State | Action |
|---|---|---|---|---|---|
| T1t | Vehicle chips of every non-service truck incl. "no temperature control · outside" | Thermo.tsx | 150 (live loads only) | ◐ | R1 |
| T2t | Readout tiles, active unit | thermoVals | 150 | ✅ | — |
| T3t | Passive variant (thermo containers + isothermal body) | thermoVals `!active` | — | ❌ | R1 |
| T4t | 48-reading chart | Thermo.tsx | 150 | ✅ | — |
| T5t | Status block | thermoVals | 150 | ✅ | — |
| T6t | Status texts under fire ("SMOKE DETECTOR: fire") / theft ("OPEN away from a delivery point · seal broken") | thermoVals | — | ❌ | R1 |
| T7t | Freeze / overheat sim → Security incident + playbook + toast | Thermo.tsx, securityVals | 150 (status + deviation) | ◐ | R1 |
| T8t | Door sim, timer | Thermo.tsx | 150 | ✅ | — |
| T9t | Sim panel only in sim mode | Thermo.tsx | always | n/a | the mock-up is always a demo |
| T10t | Cold-chain rules | THERMO_RULES | 150 | ✅ | — |
| T11t | Thermochrons expected at receipt, import per row → min / max / Ø, excursion → DEV, second import refused | Thermo.tsx | 360 free import | ◐ | R1 |
| T12t | Temperature log tab | Resources Temperature | 150 | ✅ | — |
| T13t | Temperature log rights (temperature:write, fleet:write), −60…80 °C | Resources | 150 | ❌ | R1 |
| T14t | Real-telemetry states | thermo.ts | — | n/a | no real telemetry |
| W1 | Horizon 3 / 7 | Weather.tsx | 150 | ✅ | — |
| W2 | Stale warning | weatherVals | 150 | ✅ | — |
| W3 | Grid, city select | Weather.tsx | 150 | ✅ | — |
| W4 | Sources + Refresh with `trips:write` | Weather.tsx | 150 (`trips:status`) | ◐ | R1 |
| W5 | Closures | CLOSURES | 150 | ✅ | — |
| W6 | Inbox road / weather messages in closures, source row, Lift early | inbox.ts | — | ❌ | R1 |
| W7 | City card | weatherVals | 150 | ✅ | — |
| W8 | Risk per trip raised by inbox messages | weatherVals | 150 forecast only | ◐ | R1 |
| W9 | Thresholds | WX_RULES | 150 | ✅ | — |
| W10 | Live-source note | Weather.tsx | — | n/a | production only |
| Y1 | Security KPIs open incidents / vehicles on the road x/N / doors and seals x/N ok / drivers with ADR | securityVals | 150 other KPIs | ◐ | R1 (v6 KPIs kept as extras) |
| Y2 | Incident sources incl. temperature sims and inbox security / telematics | allIncidents | 150 `S.inc` | ◐ | R1 |
| Y3 | Accept / Escalate / Close | Security.tsx | 150 | ✅ | — |
| Y4 | Level-3 incident acknowledged before close | securityVals | — | ❌ | R1 |
| Y5 | Close form | Security.tsx | 150 | ✅ | — |
| Y6 | Panic test | security.panic | 150 | ✅ | — |
| Y7 | Fire / breakdown / theft with playbook | sims | 150 | ✅ | — |
| Y8 | Action log | v.log | 150 | ✅ | — |
| Y9 | Geofences | GEO | 150 | ✅ | — |
| Y10 | Drivers · driving time (x / 9 h) and ADR until | Security.tsx | 150 other columns | ◐ | R1 |
| Y11 | Doors, seals, route per vehicle reacting to door / theft sims, "not fitted", "at hub" | securityVals | 150 per load | ◐ | R1 |
| Y12 | `alarms:write` for Accept / Escalate / Close / Panic / sims | Security.tsx | — | ❌ | R1 |
| C1 | Coverage KPIs | Coverage.tsx | 340 | ✅ | — |
| C2 | Intro note | Coverage.tsx | 340 | ✅ | — |
| C3 | Map | Coverage.tsx | 340 | ✅ | — |
| C4 | Detail aside | Coverage.tsx | 340 | ✅ | — |
| C5 | Offline windows for planned trips too ("departure" / "in transit", note on 70 km/h) | Coverage.tsx | 340 live loads only | ◐ | R1 |
| C6 | Last contact, Check now | Coverage.tsx | 340 | ✅ | — |
| C7 | Contact sims | covSim | 340 | ✅ | — |
| C8 | Driver app offline / SMS heartbeat feeds the contact monitor | contacts() | 330 own `msOut` | ◐ | *open* (330 belongs to R5; hand-over note) |
| C9 | L2 / L3 into alarms | coverageAlerts | 340 | ✅ | — |
| C10 | Worst stretches | Coverage.tsx | 340 | ✅ | — |
| C11 | OL1 format, received | Coverage.tsx | 340 | ✅ | — |
| C12 | Send, timeout, resend | coverage.ts | 340 | ✅ | — |
| C13 | Measured from telematics | MeasuredSection | 340 | ✅ | — |
| C14 | Sources and confidence | Coverage.tsx | 340 | ✅ | — |
| C15 | Coverage rights (`trips:write` check / send / resend, `planning:admin` accept / reject) | Coverage.tsx | — | ❌ | R1 |
| C16 | Hub scoping of chips, cities, trips, drivers, seals, contacts | engine `hubOk` | not applied in 150 / 340 / 360 | ◐ | R1 |

`docs/PARITY-0.3.10-v6.md` marked 07 Security ✅; after this audit it was ◐ (Y1, Y4, Y10, Y11, Y12).

## 4 Porting notes (texts and rules taken from the 0.3.9 source)

Texts are RU / DE / EN (KK from `i18nKk*.ts` where present, otherwise translated). Only the rules are repeated here; the texts are in the code.

- **S2** count of pending express requests where one of my functions has an unsigned slot and I have not signed yet (rule of "your slot", 240).
- **S3** group "Alarm simulation"; buttons "label · vehicle", "Stop · " while running; toast "Alarm: … — instructions on the Overview screen"; audit "Simulation · / Reset · ".
- **S7** see table; shows up to 12 rows, header counts every match.
- **S9** level ≥ 2 only.
- **S14** `?veh=` selects the vehicle on Temperature / Security, `?city=` the weather city, `?item=` the package on Shipments, `?alarm=` opens the alarm, `?order=` opens Orders · records with the search prefilled; without the right → "No access" (403), unknown → "not found".
- **S16** enrolment: title "Set up two-factor protection", hint with authenticator apps, QR 200 px, "Key for manual entry", 6-digit code; forced change asks the current password; failed sign-in "Sign-in failed. Check your details or try again later."
- **D2 / D11 / W6 / W8 / G9** one source: active inbox messages of kind road_closure / weather_warning (not done, before "until" or younger than 24 h) whose city lies on the route and whose end city (if set) also does — helper `265-mirror-roads.js`. Check label "Roads · inbox", text "… · do not release the trip at “critical”"; card tag "Road: …" / "Weather: condition · city" / "Load: check" (level ≥ 2, level = max); gate blocks at level ≥ 3.
- **D3** row id · destination · goods · class · pallets; "To trip X" attaches the order to the planned (unassigned / assigned) trip of the same hub; `trips:write`.
- **D15** reasons weather / road / vehicle / customer; field = new departure, ETA moves by the same amount; disabled until a valid datetime; `trips:write`.
- **I3** sources per kind (roads: KazAvtoZhol, police, driver, MChS, manual; weather: Kazhydromet, MChS, driver, manual; fine: SMS 1414, Kaspi, eGov, Sergek, police; workshop: phone, workshop, driver; security: security centre, driver, phone; telematics: Wialon, driver; lead: phone, website, ATI, Lardi; tender: goszakup, SK-Pharmacy; doc: ESF, ESUTD); fields per kind (roads / weather: city, end of stretch, km, valid until; fine: vehicle, date, time, amount, offence, place; workshop: partner, vehicle, status, ETA; security / telematics: vehicle, alarm type, city; doc: trip, document, status); effects: road / weather → trip risk, fine → Reports → Fines, workshop → service ticket, doc → Documents KZ hint, security / telematics → alarm + security incident.
- **I5** errors "vehicle unknown", "service partner unknown", "trip unknown"; meta line; "inbox only" when there is no target screen.
- **K1** Mine (default) / All, title 2–200, due, assignee "Me" + people, done checkbox, "· CRM #lead", overdue red chip, `crm:write`, empty state.
- **H4–H9, G6–G10, T5–T12, R3o–R8o, L3, L9** see the tables; G8 uses the fees model of `305-res-fleet-ext.js` (level 3 blocks); G10 licence on the arrival date, medical check refused / older than 8 h before departure / after departure.
- **T3t, T6t, T7t, T11t, T13t, W4, Y1, Y4, Y10–Y12, C5, C15, C16** see the table; Y4 server text "Level-3 incident must be acknowledged before it is closed".
- **C8** (open): the driver app (330, stream R5) writes its SMS heartbeats into its own outbox; the coverage contact monitor should receive them (`smsReceive(ol1(l,'HB'))`) and take the offline minutes from the driver app. Left to R5 to avoid a conflict in `330-driver-app.js`.

## 5 Result after R1

| | Count |
|---|---|
| Functions audited | 160 |
| Already present in v6.2.1 | 91 |
| Ported by R1 (47 cut down + 15 missing) | 62 |
| Left open | 1 (C8, driver app → coverage contact monitor; file of stream R5) |
| Not applicable | 6 (D18, G14, T14, T9t, T14t, W10 — backend / production / drawer layout; see the tables) |

Deviations from 0.3.9 kept on purpose: the inbox fine form offers the five fine types of Reports → Fines (0.3.9: eight offences); any password signs in (no failed sign-in text in the demo); truck t4 is the demo vehicle without a reefer unit (passive tiles, seal "not fitted"); planned trips count their offline windows from ETA − route time at 70 km/h (loads have no departure field unless Edit trip sets one); gate control "Driver qualified" merges the former medical-check control (as in 0.3.9), the 8-hour and after-departure rules apply once FR-114 is in force.

Tests: `platform-src/tests/e1-mirror-ops.js`, `e1-mirror-ops-a.js`, `e1-mirror-ops-b.js`, `e1-mirror-ops-c.js` (39 groups, RU / DE / EN / KK). Existing tests adjusted to 0.3.9 behaviour: 61 (current password on the forced change), 72 (gate key `driver`, full document set before release), 73 (replan field = new departure), 75 (abort submit enabled only when valid). Traceability: `docs/TRACEABILITY.md` → "R1 — Mirror 0.3.9 operations".
