# Explanatory notes: 0.3.10 → v6 map (Q3)

What counts as a note: text in 0.3.10 that explains what the numbers mean or how the system decides — the "?" help bubbles (`Tip k=…`, texts in the reference data `TIPS`, `backend/app/v5/reference/mock-v5.*.json`), lead lines under card titles (`v5-sec-head … small muted`), `v5-note` / `v5-fin-intro` paragraphs, legend lines, limiting-factor lines and empty-state guidance. Event texts, demo records and button labels are not notes.

Sources searched: `frontend/src/v5/screens/*.tsx`, `v5/Coverage.tsx`, `v5/Shell.tsx`, `v5/engine/*.ts` (inline `X(ru, de, en)`), `frontend/src/pages/*.tsx` + `i18nDict.ts`, reference `TIPS`. The frozen `releases/0.3.10/platform-en.html` is not in the source checkout; the sources above are what it renders.

v6 helper: `platform-src/v6/screens/003-notes.js` holds the texts (RU / DE / EN / KK); a screen inserts `${howNote('key')}` → `<p class="note" data-note="key">`. Test: `platform-src/tests/c2-notes.js`.

Status: **ported** = added by Q3 (key = `data-note`); **present** = v6 already had the note (P1–P6 / W-streams), file named; **adapted** = ported with wording fitted to how v6 computes; **n/a** = the 0.3.10 function does not exist in v6.

## Orders · Load & weight, Shipments, Documents KZ, Bookings, Commercial

| 0.3.10 screen · card | 0.3.10 note (gist) | v6 place | Status |
|---|---|---|---|
| Load · orders on trip (`Tip third`) | Third-party cargo ≈10 %: own contract, pallets, labels, liability; never mix with KDL goods | Orders → Load & weight · Orders on load | ported `third` |
| Load · weight, volume, axles (`Tip axle`) | 2–8 °C chamber at front wall loads front axle ≈75 %; bulky goods hit pallet places first | Orders → Load & weight · Weight, volume and axle loads | ported `axle` |
| Load · package reconciliation (`Tip recon`) | SSCC count = order places, otherwise no Go/No-Go | Load & weight · SSCC reconciliation | present (210) |
| Load · vehicle match lead | for the ticked orders: pallets per regime, weight, volume, axles | Load & weight · Vehicle match | present (210) |
| Load · no type fits | split the load or hand to a partner | Load & weight · Vehicle match | present (210) |
| Load · truck finder lead + "How it decides" | per candidate: pallet places per zone, weight, volume, axles, height, ADR, road limits, availability; feasible first, then cheaper | Load & weight · Truck finder | present (210, P1 reference) |
| Load · truck finder footer | Trailers P01/P02 without a tractor are not considered | Load & weight · Truck finder | ported `trailers` |
| Load · no candidate fits | split, partner or lift the restriction | Load & weight · Truck finder | present (210) |
| Load · plan not saved / override | no type saved; does not fit — only with a supervisor's reason | Load & weight · Vehicle type | present (210) |
| LoadPlan · full cost line | fuel × consumption, tolls, driver, empty return, depreciation (planning values) | Load & weight · Truck finder | present (210) |
| LoadPlan · split | splitting does not fit either — partner or postpone | Load & weight · Split | present (210) |
| LoadPlan · top / side view legends | cab · front wall, numbers = stop and kg, ⊕ = centre of gravity; stack height, dashed = internal height | Load & weight · Top and side view | present (210) |
| LoadPlan · LIFO sequence | first row at front wall; odd left, even right; scan with position | Load & weight · Loading sequence | present (210) |
| LoadPlan · weighing empty state | No weighing — the gate checks the load calculation | Load & weight · Departure weighing | present (210) |
| loadView · body notes | no temperature control / 2–8 °C chamber at front wall / one-zone body / LIFO | Load & weight · Loading diagram | present (210) |
| loadView · limiting factor | volume and pallet places vs weight — plan by pallets and m³ | Load & weight · insight lines | present (200 / 210) |
| loadPlanView · imbalance / centre of gravity | lateral imbalance, steering axle share too low | Load & weight · insight lines | present (200) |
| shared · zone overload / ADR / FEFO / third-party insights | exact excess + what to do | Load & weight · insight lines | present (200) |
| Ship · scan history (`Tip track`) | SSCC scanned at picking, loading, unloading, branch receipt; missing scan → discrepancy | Orders → Shipments & labels · Package scan history | ported `track` |
| Ship · scanner mode (`Tip scan`) | GS1-128 (AI 00 + SSCC) + Enter opens the label | Shell search / Shipments | present (001, 220) |
| Docs · document set (`Tip gate`) | documents depend on the cargo (KDL, third-party, ADR); click to generate | Orders → Documents KZ · Document set | ported `gate` |
| Docs / Dispatch · Go / No-Go (`Tip gonogo`) | release only if every check is green; any red check blocks | Orders → Documents KZ · Trip release | ported `gonogo` |
| Docs · inbox statuses lead | status from state systems (inbox) | Documents KZ · Document set | present (230) |
| Docs · lawyer line | form list — working draft, verify with a KZ lawyer and tax adviser | Documents KZ | present (230) |
| Booking (pages) · tariff formula | Price = max(minimum; base + pallets × km × rate) … | Orders → Bookings | adapted `tariff` (v6 `bookingPrice`: km × rate × load share, express, insurance, VAT) |
| BookingForm (pages) · booking terms | framework agreement, price is an estimate, final after confirmation | Customer portal → Book a shipment · Price and slots | ported `bookTerms` |
| BookingForm · contract required | on account only with a signed framework contract | Customer portal → Book a shipment · Payment | present (510) |
| Crm (pages) · lead hint | website requests land here automatically (public form) | Orders → Commercial → CRM | ported `leadHint` |

## Dispatch Board · Board, Planning, Partners, Express

| 0.3.10 screen · card | 0.3.10 note (gist) | v6 place | Status |
|---|---|---|---|
| Dispatch · unassigned orders lead | from KDL Olymp ERP · hub | Dispatch → Board / Trips | present (260) |
| Dispatch · empty state | No trips — create a trip under "Trips" | — | n/a (v6 board always lists the seed loads) |
| Planning · scenarios (`Tip scen`) | what-if: recalculates demand, availability, shortfall for 7 days, proposes a fix | Dispatch → Planning | present (240) |
| Planning · baseline lead | bookings and orders per day, vehicle calendar, absences, road messages; scenarios on top | Dispatch → Planning | present (240) |
| planning engine · shortfall actions | partner handover · external carrier · express; reserve / subcontractor | Dispatch → Planning · recommendations | present (240 deficit list) |
| DispatchExpress · deadline lead | deadline: cut-off of the express slot; three signatures | Dispatch → Waybills & express | present (240) |
| Partners · tiers (`Tip tiers`) | Gold / Silver / Bronze / Blocked: GDP, 2–8 °C, approval, ADR, reason recorded | Dispatch → Partners · register | ported `tiers` (short legend was present, full rule added) |
| Partners · handover (`Tip handover`) | uses route cities, package requirements and tier; report, waybill, temperature sheet; scans continue | Dispatch → Partners · Shipment handover | ported `handover` |
| Partners · cross-dock line | cross-dock only at Astana and Almaty hubs, transshipment points | Dispatch → Partners · City directory | present (160) |
| Partners · handover documents line | handover report · carrier waybill · temperature sheet · SSCC scans continue | Dispatch → Partners · Handovers | present (160) |
| Partners · unblock after CAPA | unblock only after the CAPA is closed | Dispatch → Partners | present (160) |
| PartnerPortal (pages) · GDP line | GDP qualification not confirmed — no cold-chain hand-overs | Partner portal | present (520) |

## Resources · Fleet, Staff, Driver app

| 0.3.10 screen · card | 0.3.10 note (gist) | v6 place | Status |
|---|---|---|---|
| Fleet · insurance, taxes, fees (`Tip fees`) | OGPO, KASKO, inspection, vehicle tax, tolls, Sergek fines (−50 % in 7 days); verify MRP rates | Fleet → Fleet · table footer | ported `fees` |
| Fleet · West column (`Tip west`) | West ring: HOWO T5G 50 m³ only, service, calibrated containers and loggers, winter kit, Wialon | Fleet → Fleet · table footer | ported `west` |
| Fleet · demo fleet lines | not used in trips, thermo, costs; 3.5 t only as finder candidates | Fleet → Fleet · demo bar | present (040, 305) |
| Fleet · trailers | trailers without temperature control — 15–25 °C warm season or empties only | Fleet → Fleet | present (040) |
| VehicleSetup (pages) · lever rule / checklist | wheelbase etc. → axle shares; not offered until the checklist is closed | Fleet → Registry · onboarding | present (310) |
| Resources (pages) · Wialon sensor mapping | sensor name → chamber; without mapping multi-chamber readings are not accepted | Routes → Temperature | present (150) |
| Resources (pages) · PII masked | IIN, phone, licence stored encrypted, shown masked | Settings → Users / portals | present (450, 510) |
| Resources (pages) · `pd_note` | viewing personal data is recorded in the audit log | Drivers → driver card (drawer) | ported `pdNote` |
| Staff · urgent trip (`Tip urgent`) | on-duty / reserve drivers of the hub, then free today; driving time, licence, ADR; absences excluded | Drivers → Staff · Urgent trip | ported `urgent` |
| Staff · no free vehicle | bring in a subcontractor under the framework contract (S130) | Drivers → Staff · Urgent trip | present (320) |
| Driver · only with a trip | app works only for a driver with a trip "Loading" / "In transit"; dispatch sees the feed | Drivers → Driver app (admin preview) | ported `drvOnly` |
| Driver · offline events | every action is an event; without network events queue and send once online | Drivers → Driver app | present (330) |

## Routes & Tracking · Temperature, Weather, Security, Coverage, Thermochrons

| 0.3.10 screen · card | 0.3.10 note (gist) | v6 place | Status |
|---|---|---|---|
| Thermo · history (`Tip twolevel`) | chamber sensor for control + independent calibrated logger = quality proof | Routes → Temperature · Temperature history | ported `twolevel` |
| Thermo · history lead | last 48 readings · bands — allowed ranges | Routes → Temperature | present (150) |
| Shell · alarm simulation (`Tip sim`) + Thermo sim line | training alarms per vehicle; alarm, incident, playbook on Overview; reset | Routes → Temperature · Alarm simulation | ported `sim` (two 0.3.10 texts merged) |
| Thermo · thermochrons at receipt | confirmed by thermochron on arrival (C12, L65); import builds profile; excursion → DEV | Routes → Thermochrons & loggers · log | ported `thChron` |
| Weather · forecast lead (`Tip wxrisk`) | Watch / Risk / Critical thresholds; route risk = worst city | Routes → Weather & risks · thresholds | ported `wxrisk` |
| Weather · forecast lead | forecast for network cities · colour = trip risk | Routes → Weather & risks | present (150) |
| Weather · stale / no forecast | Go/No-Go weather check needs a manual decision | Routes → Weather & risks | present (150) |
| Weather · source / hybrid model | Open-Meteo every 3 h + Kazhydromet + road closures; hybrid concept | Routes → Weather & risks | present (150) |
| Security · escalation (`Tip escal`) | New → Acknowledged → Escalated (102 / 112) → Closed, every step logged | Routes → Security · Incidents | ported `escal` |
| Coverage · lead | where routes have no mobile internet, classes, SMS fallback after 30 min | Routes → Coverage | present (340) |
| Coverage · schematic line | straight lines between cities, borders indicative; classes are estimates | Routes → Coverage · map | ported `covSchem` (the "estimates as of …" half was present) |
| Coverage · hover hint | hover / tap a stretch — details appear here | Routes → Coverage | present (340) |
| Coverage · times line | times at 70 km/h without stops | Routes → Coverage | present (340) |
| Coverage · alarm rule | dead zone → level 1; outside / window exceeded → 2; cold cargo > 60 min → 3 | Routes → Coverage | present (340) |
| Coverage · SMS format / gateway / sources / satellite / learning | OL1 160 chars, HMAC; SMSC.kz / Mobizon; verified vs estimate; Direct-to-Cell; class proposals | Routes → Coverage | present (340) |

## Proof of Delivery · Quality; Billing · Cost model; Reports; Settings; Dashboard

| 0.3.10 screen · card | 0.3.10 note (gist) | v6 place | Status |
|---|---|---|---|
| Quality · deviations (`Tip capa`) | 7 steps, only the quality manager decides, CAPA required to close | Proof of Delivery → Deviations & quality · Deviations | ported `capa` |
| Quality · calibration register | expired calibration blocks release | Deviations & quality · calibration registry | present (140) |
| Costs · lead | running costs of the own fleet: 4 vehicles, 7 drivers, rings | Billing → Cost model | present (600) |
| Costs · refresh / fuel / service / fallback / insurance / hours / ledger | data refresh cadence, fuel plan and thresholds, TO-1 / TO-2, keep fallback contracts, insurance rates, FTE hours, cost ledger | Billing → Cost model sections | present (600) |
| Costs · own vs external | own trip cost composition; > 50 % gap needs two approvals | Billing → Cost model · Own vehicle or external | present (600) |
| costs engine · excluded items | GDP mapping not estimated, 30 % leasing down payment is investment, fines are driver liability | Billing → Cost model · Running costs by item | ported `costExcl` |
| costs engine · deregistration rule | deregister only if idle ≥ 3 months, not leased, savings > re-registration | Billing → Cost model · Insurance | present (600) |
| Reports · fines → driver (`Tip fineLink`) | driver found by matching notice time with vehicle usage log; who had the vehicle at the time | Reports → Fines | ported `fineLink` |
| reports engine · not identified / daily import | no vehicle assignment — attribute manually; daily at 07:00 by plate and time | Reports → Fines | present (610) |
| Overview · KPI subs | live tracking and ETA, SLA target ≥ 95 %, shipments without excursion, by weight 37 %, risk and critical | Dashboard → Overview · KPI tiles | present (010) |
| Reports · KPI subs | SLA 8 weeks, target < 30 % via backhaul, network average, security and cold chain | Reports → KPI | present (611) |
| Baseline · lead / per-city / express / governance | catalogue source, density 164 kg/m³, three signatures, quarterly reporting | Baseline data | present (620, 240) |
| MasterData (pages) · verified values | plausible defaults; "verified" = confirmed against the source; confirm before go-live | Settings → Reference data | ported `mdVerified` |
| Crm (pages) · full export | complete JSON export incl. personal data, audited, store encrypted | — | n/a (v6 has no full-data export) |
| Receiving / hubs | 0.3.10 has no separate explanatory text beyond thermochrons at receipt (above) | Warehouses & Hubs → Receiving | n/a |

## Count

Mapped: **82** rows (19 `TIPS` + 63 inline notes; a few rows bundle closely related lines of one card, e.g. the cost-model section notes or the coverage SMS / gateway / sources lines).

| Status | Rows |
|---|---|
| ported by Q3 | 25 |
| adapted by Q3 (`tariff`) | 1 |
| present in v6 before Q3 | 53 |
| n/a in v6 | 3 |

Q3 adds **26** note keys (`Object.keys(NOTES)`), all rendered and tested in RU / DE / EN / KK. `sim` merges two 0.3.10 texts (shell tip + thermo screen line). The `escal` tip existed in the 0.3.10 reference data but was not rendered there; v6 now shows it under Security → Incidents. Remaining known gaps: none.
