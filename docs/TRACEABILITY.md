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
