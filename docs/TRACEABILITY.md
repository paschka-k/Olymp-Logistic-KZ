# Traceability — LH / FR → tab → test

One section per workstream; every implemented requirement has a row. Tests are groups in `platform-src/tests/`.

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
