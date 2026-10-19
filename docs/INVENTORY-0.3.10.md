# Functional inventory: Olymp Logistic Platform 0.3.10 (frontend/src)

I read every screen, page, shell file and help file in the brief, plus the engines and reference JSON where labels are defined (KPI labels, tabs, report groups).

**Legend:** [DASH] = dashboard or KPI tile row · [CHART] = chart, diagram, map or visual · [TBL] = table · [SEG] = segment control or toggle · [DLG] = modal or overlay · [BTN] = action button · [FORM] = input form. FR numbers are taken from code comments and the help files.

**Three things you asked about do not exist in 0.3.10:**
- **AI summary:** no such feature. A grep for "AI summary" and its Russian and German forms finds nothing. The help even says "no external services (AI, …)".
- **"Changes" / changelog page:** there is no route and no file for it.
- **Role switch:** only exists in the online-demo bar (`demo/DemoBar.tsx`), not in the production shell.

Key paths: `C:\_Projects\Olymp-Logistic-Platform\frontend\src\v5\Shell.tsx`, `v5\V5.tsx`, `App.tsx`, `Layout.tsx`, `navModel.ts`, `access.ts` + `generated\access-nav.json`, `v5\screens\*.tsx`, `pages\*.tsx`, `help\*.ts`. Screen labels come from `backend\app\v5\reference\mock-v5.{ru,de,en}.json` (NAV, C_TABS, BL_TABS, REP_GROUPS, SIMS, TIPS).

---

## 0. Global shell, top bar and sidebar (Layout.tsx, v5/Shell.tsx, V5.tsx, brandTheme.tsx, main.tsx)

### Sidebar (`aside.side`)
- Brand block: brand name and subtitle, or the Kökzhol lock-up when the Kökzhol design is on.
- **Language switch:** RU / DE / EN / KK [SEG]. Kazakh screens read the Russian reference data and translate the UI texts (FR-135).
- **Navigation group 1:** the 17 operations screens, each with number 01–17, icon, label and a badge count (FR-132/137/138). Visibility comes from the role × screen matrix.
  - The 02 Dispatcher badge also counts express requests awaiting your signature (BUG-32).
- **Alarm simulation block** (demo / training only, FR-84) [BTN×5]: Freezing·V04, Overheating·V01, Fire·V03, Breakdown·V01, Theft·V01.
  - Each toggles "Stop · …"; the block shows "telemetry · every 2 s" and a SIMULATION badge.
- **Sync label** (FR-131): "Live · updated HH:MM:SS", or "Offline · …" when sync fails.
- **Group 2 heading "Records and administration":** a link to `/records` (FR-159).
- **Group 2 entries, in order:** Book transport, My bookings, Partner portal, Inbox, Network coverage, Bookings (badge = open requests, polled, FR-190), Trips, Orders, Alarms, Cargo insurance, Leads & deals, Customers, Tasks, Drivers, Lines & tariffs, Master data, On-call roster, Users, Integrations, Audit log.
- **Help group:** "? Help and how-to" → `/help`.
- **Sidebar foot:**
  - User name and role → `/account`.
  - Logout button.
  - **Design switch** "Olymp | Kökzhol" [SEG]: per-browser setting, also forced by `?brand=`; changes the favicon too.
  - Version (`__APP_VERSION__`) and build stamp.

### Top bar and responsive behaviour (FR-133/134)
- Mobile burger opens an off-canvas drawer below 900 px; Escape closes it; a backdrop is shown.
- Skip link "Skip to content".
- Phone bottom bar shows the 4 most-used screens per role, with badges:
  - admin: overview, dispatch, thermo, security
  - dispatcher: overview, dispatch, thermo, ship
  - warehouse: load, ship, quality, thermo
  - driver: driver, weather, docs, security
  - auditor: overview, reports, quality, costs
  - viewer: overview, thermo, ship, security

### Screen header (every `/s/:key` screen)
- Eyebrow "NN · subtitle", H1 title, help link "?" to the help article.
- **"▶ Tour" button** (FR-160) on dispatch, quality and driver; the customer tour starts on `/book`.
- **"◇ Diagram" button** opens a help-visual popover [DLG][CHART] on dispatch, load, docs, thermo, quality, security, driver, baseline and costs.
- **Scanner toggle** "Scanner / Scanner · on" [SEG]: GS1-128 barcode mode.
- **Global search combobox** (FR-74, FR-163):
  - Searches goods, PO, PL, article, lot and SSCC in current shipments, with keyboard ↑↓ / Enter / Esc.
  - Results show the manufacturer logo, trip, vehicle and status; an "incl. delivered" archive toggle.
  - A second "In the database" list searches orders, trips, packages (SSCC) and bookings; it accepts number variants (r104, R-26-1, Z-2290).
  - Enter opens an exact hit; a scan only opens an exact match, otherwise a toast "Scan not recognised as SSCC".
- **Hub filter** All hubs / Astana / Almaty [SEG], applied to all screens.
- **Clock:** scenario clock in demo, otherwise real Kazakhstan time; business date "· Astana UTC+5".
- **"N active alarms" button:** red when N > 0, goes to `/s/overview`.

### Sub-tabs of screens (FR-132)
- 02 Dispatcher → tab "Trip planning" (`/s/dispatch/plan`).
- 05 Thermo → tab "Temperature log" (`/s/thermo/journal`).
- 10 Fleet → tab "Vehicle register" (`/s/fleet/register`).
- Old routes redirect: `/summary` → overview, `/dispatch` → dispatch/plan, `/temperature` → thermo/journal, `/fleet` → fleet/register.

### Global overlays
- Alarm banner "New alarms of level ≥ 2": up to 3 items, each clickable to its screen; dismiss "×" (FR-131).
- Toast live region (FR-134).
- **Partner contact modal** [DLG] (FR-33/82): partner type, city, name, services, tier.
  - Contact persons with masked numbers; "Call (simulation)" reveals the number (audited).
  - "Copy contacts", "Close", Escape.
- Tooltip "?" chips (Tip) on: tiers, handover, track, recon, scan, fineLink, urgent, sim, gonogo, axle, twolevel, wxrisk, scen, escal, gate, capa, fees, west, third.
- Guided tour overlay (TourHost, FR-160). Tours: dispatcher (A dispatcher's day), customer (Customer booking), driver (Driver delivery), qa (QA deviation).
- URL ↔ selection sync (`?trip=`, `?item=`, `?veh=`, `?city=`, `?dev=`, `?fine=`), document title "record · screen · brand" in browser history, scroll restore (BUG-31 / FR-175).
- 403 "No access" page when a deep link points to a screen the role may not open (FR-175).

### Runtime behaviour (V5.tsx)
- Polls a version counter every 5 s and fetches deltas (FR-131/74).
- Telemetry: 2 s simulated tick in demo, real readings every 15 s in production (FR-84).
- Stale-write conflict 409 → toast "Changed by another user — the screen was reloaded" (FR-74).
- Data the role may not see is withheld and replaced by empty values (FR-81/82).
- Person-name resolution for signers (FR-89).

### Online demo bar (DEMO build only)
- "ONLINE DEMO · simulated data, no server".
- **Role select** listing every demo account.
- Links "Platform" and "Request form"; "Reset data" with a confirm.
- The E2E build has its own bar.

### Routing and home
- Home by role: customer (portal) → `/book`; partner → `/partner`; driver → `/s/driver`; `overview:read` → `/s/overview`; otherwise `/trips`.
- Drivers are limited to account, coverage, driver and help.
- Deep links `/r/:type/:id` for trip, order, booking, alarm, deviation and help (resolver plus 403 page).
- Public routes without login: `/request`, `/track/:token`.

---

## 01 · Overview — "Live monitoring", #/s/overview (perm overview:read; live)
- **Alarm playbook cards** "Alarm · response steps", one per active simulation: title, location, numbered steps, [BTN] Reset, and [BTN] "Service contacts · <workshop>" which opens the contact modal [DLG].
- **[DASH] 6 KPI tiles:**
  - Trips today (sub: planning / loading / in transit / delivered counts)
  - In transit
  - OTIF · 7 days (96.4 %, SLA target ≥ 95 %)
  - Temp. compliance (99.6 %)
  - Volume utilisation (81 %, by weight 37 %)
  - Alarms (risk + critical, red when > 0)
- **Live trips list:** id, route, progress bar, status tag, ETA [CHART: progress bars]. A click opens the trip on 02.
- **"Alarms and events" list:** up to 9 alarms, plus a separate "Risks · weather, roads, load" list (up to 6). Each row has a level tag and a "source →" link to the screen where it is handled, including /coverage (FR-101).
- **Compact inbox section** "Inbox · external messages": newest 5 open, each with "→ screen"; [BTN] "All messages (N) →".
- **"Hub weather · 3 days"** tiles per hub and day: temperature max/min, condition, wind, risk colour [DASH].
- FR-33, FR-34.

## 02 · Dispatcher — "Trips, assignments, trip sheets", #/s/dispatch (perm trips:read; live)
- **[DASH] Trip board** with lanes Planning · Loading · In transit · Delivered: count per lane; cards show id, vehicle, route, departure → ETA and an issue tag (weather / load).
- **"Unassigned orders"** (from KDL Olymp ERP · hub Astana): id, branch · goods, class, pallets; [BTN] "To trip R-106 / <trip>"; empty state.
- **"Express · awaiting approval"** section (BUG-32):
  - Rows: EX-id, route, customer, kg, class, deadline/cut-off.
  - 3 signature slots (✓ signed / ● your slot / ○ pending) and an n/3 tag.
  - [BTN] "To approval (17) →" and "All express requests (17) →".
- **Trip detail aside:**
  - Trip id and note, route, km, departure, ETA.
  - Vehicle, driver, chambers (with SIMULATION badge), planned vehicle type.
  - Stops timeline with passed markers.
  - **Coverage on route · next dead zones:** up to 3, with "now / in X", duration, class and the SMS note; ETA confidence; [BTN] "Network coverage →".
  - **"Pre-release checks (Go / No-Go)":** informational checks with level tags — capacity, temperature classes, ADR, weather, logger and insurance, driving time > 700 km, frost −45 °C, warehouse window 9–17, DG adviser.
  - **"Service on route" card:** workshop, tier, response time; [BTN] Contacts.
  - [BTN] Send trip sheet (only from planning / loading, only once).
  - [BTN] "Move to 10.10 (buran-free window)" for scenario weather risk.
  - [FORM] "Replan trip" for DB trips (FR-94): datetime + reason (weather / road / vehicle / customer).
  - [BTN] "Load →" and "Thermo status →".
- **"Driver app feed · R-103 · V01":** last events (time, module, text, status tag); [BTN] "Driver app →".
- **Tab "Trip planning" (`/s/dispatch/plan`)** — records view, perm trips:write; help r-dispatch:
  - Hub [SEG] when the user has several hubs.
  - Unassigned new orders, server-paged 100 per page, with search; checkbox selection; priority chip.
  - **"Booked departures"** table (FR-96): line, orders, pallets/kg vs capacity; [BTN] "Trip for departure".
  - **[FORM] "Plan trip":** vehicle (active, hub), driver, departure, ETA, note; load box "selected · pallets / capacity · kg / payload" with [CHART] progress bar; [BTN] Create trip.
- FR-43, 44, 51.

## 03 · Load and weight — "Pallets, volume, axles", #/s/load (perm trips:read)
- **Trip selector** [SEG] across planned / loading DB trips (FR-71).
- **"Vehicle type"** (what-if for trip X):
  - Type [SEG]: catalogue 3.5 / 6 / 7.5 / 10 / 12.5 t plus own vehicles, default the actual V02.
  - Thermo zones [SEG]: 1 zone / 2 zones / no temperature control.
  - Body regime [SEG]: auto / 2–8 / 15–25.
  - **Bulkhead control** − / + with the zone 1 / zone 2 pallet split.
  - Facts line and a note.
  - Saved plan line "Plan X: label · by · time".
  - Overload reason input (≥ 10 characters, `trips:override_load`), otherwise "Does not fit — plan only with a supervisor's reason" (FR-99).
  - [BTN] "Save as plan X" and [BTN] "Show plan".
- **"Orders on trip R-106"** [TBL]: toggle checkbox (load / don't), order, branch · goods, height, stackable, tag, class, pallets, m³, kg. Orders handed to a partner are locked (lock icon). Summary boxes: pallets, third-party, volume, weight, ADR, with an over marker.
- **[CHART] Loading diagram:** cab / front wall ↔ rear door; front zone (2–8 °C at the front wall) and main zone slots with ×2 tiers, ↑ tall and over markers.
  - Thermo boxes −20 °C (dry ice UN 1845).
  - LIFO note.
  - Side-view SVG "HeightView": tallest pallet vs internal height.
- **[CHART] "Weight, volume and axle loads":** meter bars with exceedance tags, an "Overload:" tag list and an insight line.
- **"Load checks"** list with level tags.
- **[CHART] "Top and side view · centre of gravity"** (FR-140):
  - Top-view SVG: positions two abreast, colour by stop plus number and kg, CoG ⊕ marker.
  - Side-view SVG: stack heights vs ceiling, tier line, CoG height.
  - Fact boxes and balance warnings.
- **"Loading sequence for the warehouse"** (FR-144) [TBL]: #, position, zone, order, unloading stop, tiers, SSCC.
  - [BTN] "Print / PDF" (opens HTML).
  - [FORM] scan check: SSCC (18 digits) + position → "Position correct / Wrong position / not in plan".
- **"Departure weighing · trip"** (FR-145), DB trips:
  - Latest weighing: source, ticket, front/rear/gross; tags for within limits or each excess; "released with a reason".
  - "Trip release blocked: overload by weighing".
  - [FORM] Source (weighbridge / axle scale / manual), ticket, front/rear/gross kg; [BTN] Record weighing.
  - Override [FORM]: reason ≥ 10 characters → "Release with a reason".
- **"Package reconciliation (SSCC) with orders"** [TBL]: order, branch · goods, n/expected SSCC, mark; [BTN] "Rescan package".
- **"Vehicle match"** [TBL] for the ticked orders: type, zones, pallets per regime, weight, volume, axles, result (recommended / fits / does not fit), reason. Recommendation line "smallest fitting type"; clicking a type shows its calculation.
- **"Truck finder · simulation"** [TBL] (FR-139/142/143):
  - Options: "+ demo fleet V05–V07", "+ demo 3.5 t V08, V09", "spring road limits (01.04–15.05)"; route legs and departure.
  - **Ranking** [SEG]: by rate ₸/km / cheapest total.
  - "Compare with two vehicles" checkbox; full-cost parameter line.
  - "Restrictions on the travel day" tags.
  - **"Split over two vehicles"** [TBL]: split, vehicle 1 · orders, vehicle 2 · orders, cost, vs one vehicle.
  - **"Partner offers (rate per pallet)"** [TBL]: can take / cannot, issue tags; "Own vehicle vs partner" line.
  - Recommended line, plus an explanatory "How it decides" paragraph.
  - Rows: rank, vehicle/type, zone pallet use, weight·volume, front/rear/gross axle loads, height, ADR·route, cost (rate / total with breakdown tooltip, empty km, per pallet, utilisation), result and issue tags.
  - Per-row [BTN] "Calculation" and "Apply as plan X".
- FR-05, 06, 21, 99, 139–145.

## 04 · Shipments and marking — "PO, PL, SSCC, articles, lots", #/s/ship (perm orders:read; live)
- **Trip chips:** id, number of items, subtitle.
- **"Manufacturers · N" directory cards:** initials logo, name, company, URL, group · count, uploaded logo, "new" marker.
- **"Packages · trip"** [TBL]: SSCC, order, PO, PL, article · goods with manufacturer logo, LOT · expiry with a "short expiry" (FEFO) mark, qty, class. A row click selects the label.
- **Label card "Transport marking · package label":**
  - Manufacturer block; sender / recipient; PO, PL, order · trip, article, goods, LOT, expiry, qty, manufacturer.
  - Temperature-class band; [CHART] barcode "(00) SSCC"; handling marks.
  - [BTN] "Print label (demo)".
  - [SEG] "ZPL for Zebra (GS1-128)" / "Hide ZPL" with a ZPL code block.
  - **"Package scan history (track & trace)"** timeline with bad-event highlighting.
- FR-01…05.

## 05 · Thermo status — "Cargo chambers and outside temperature", #/s/thermo (perm temperature:read; live)
- **Vehicle chips:** id, plate, level tag, location, temperatures.
- **[DASH] Readout tiles** for the selected vehicle: value, sub-text, level tag, SIMULATION badge.
- **[CHART] "Temperature history · V"** SVG over the last 48 readings: bands 2–8 °C and 15–25 °C, zero line, lines for the 2–8 chamber, 15–25 chamber and outside; legend.
- **Status key/value block:** unit, door, logger, …
- **"Alarm simulation"** (demo/training): [BTN] freeze / overheat / fire / breakdown / theft toggles, plus [BTN] "Open chamber door V04" (door timer).
- **"Cold-chain alarm rules"** list with level tags.
- **"Thermochrons at receipt (FR-40)"** rows: TH-id, what, result dot; [BTN] "Import thermochron" (an excursion creates a DEV).
- **Tab "Temperature log" (`/s/thermo/journal`):**
  - Vehicle [SEG].
  - [FORM] class + °C → "Record reading".
  - **Chamber tools** (FR-102): sensor → chamber mapping (sensor name, class; add / save) and a thermochron CSV upload (class, logger id, file) with a result message.
  - Readings [TBL]: time, class, °C (red when out of range), status chip, source.
- FR-39, 40.

## 06 · Weather 3–7 days — "Forecast and route risks", #/s/weather (perm trips:read)
- **Horizon** [SEG]: 3 / 7 days.
- Stale / no-forecast warning (> 6 h → Go/No-Go needs a manual decision).
- **[CHART] Heat-grid "City × day":** temperature, condition, wind, risk colour; city button with hub label (selectable). Source note: Open-Meteo / Kazhydromet, or "hybrid model (concept)".
- **Aside:**
  - **Sources card** "Sources · updated …" with [BTN] Refresh.
  - **"Road closures · KazAvtoZhol"** list (road, when, why, affected trip) plus inbox road messages with a level tag and [BTN] "Lift early".
  - **City card:** day rows with temperature / condition / wind and a level tag.
  - **"Weather risk per trip"** list: click → trip on 02.
  - **"Weather alarm thresholds"** list.
- FR-16, 42.

## 07 · Security — "Incidents, geofences, ADR", #/s/security (perm alarms:read)
- **[DASH] KPIs:** Open incidents, Vehicles on the road, Doors and seals, Drivers with ADR.
- **"Incidents"** list: level, type, text, id · time · status.
  - [BTN] Acknowledge / Escalate / Close.
  - Close form for real incidents (FR-105): resolution category select + text ≥ 10 characters → "Close incident" / Cancel.
  - Header [BTN] "Test panic button V01".
- **"Action log (audit trail)"** — last 8 operations.
- **"Geofences · events"** list.
- **"Drivers · driving time and ADR"** [TBL]: driver, vehicle, driving, ADR until (red warning).
- **"Doors, seals, route"** [TBL]: vehicle, doors, seal, route.

## 08 · KZ documents — "Document set and trip release", #/s/docs (perm trips:read)
- **Trip chips:** selection shared with 02.
- **"Document set · trip"** — route · vehicle · driver.
  - [BTN] "Generate all".
  - "Status from state systems (inbox)" hints.
  - Document rows with a status tag (not generated / ready / registered / e-signed / sent to IS ESF / at delivery).
  - Per row: [BTN] Generate, PDF (opens a printable HTML), "Sign with e-signature", "To IS ESF".
  - Documents: trip order/instruction, trip sheet (with medical check), TTN, internal transfer note, temperature sheet & logger assignment, registration certificates MD/IVD, carriage contract (third-party), ESF, SNT, ADR transport document / written instructions / certificates, handover report (ePOD), carrier waybill / handover to partner.
  - Note "form list is a working draft".
- **[DASH] "Trip release · Go / No-Go" gate card:** gates with YES/NO tags —
  - Vehicle available · Suitable for temperature class · Driver qualified · Documents complete · Insurance, tax and inspection OK · Packages reconciled (SSCC = order) · Logger calibrated · ADR met · Route cleared for weather
  - DB trips add: Load within vehicle limits · No critical alarms
- [BTN] "Clear without weather forecast" (`docs.wxOverride`).
- "Release withdrawn" tag + reason (FR-91).
- [BTN] Release trip (server re-checks).
- Revoke [FORM]: reason (weather / road, vehicle, driver, documents, load, critical alarm, other) → "Withdraw release".
- FR-11, 12, 91.

## 09 · Quality — "Deviations, CAPA, calibration", #/s/quality (perm temperature:read; live)
- **"Deviations"** list: level, title, DEV-id, text.
- **"Deviation process · DEV"** card:
  - Title; linked orders with outcome (returned / released / delivered in quarantine / quality hold) and a hold tag.
  - [BTN] "Insurance claim" → `/insurance?dev&order` (FR-153).
  - **[CHART] 7-step stepper:** Alarm recorded · Dispatcher checked · Security checked · QM decision · Goods released/blocked · Customer notified · CAPA recorded.
  - [BTN] Next step; at step 4 [BTN] "Release goods" / "Block (quarantine)".
  - Done line "Deviation closed · report for KDL Olymp ready"; CAPA text.
- **"Logger calibration register"** cards (valid / expiring / expired) with [BTN] "Order calibration L-2208" in the demo.
- FR-11, 25, 40.

## 10 · Fleet — "Status, service, approvals", #/s/fleet (perm fleet:read)
- **[DASH] KPIs:** Vehicles total, HOWO T5G · active cooling, HOWO T5G · isothermal, JAC N120 · isothermal, Without active cooling, On the road; plus Reefers 7.5–12.5 t / No temperature control / 3.5 t demo when toggled.
- [SEG] "Show extended fleet · +5 vehicles" (demo overlay, FR-38) and checkbox "3.5 t demo" (V08/V09) with notes.
- **Fleet [TBL]:** vehicle · plate, class, model (winter / ADR), status, pallets, chambers, service, logger until (level colour), insurance/taxes/fees (status tag; OGPO, KASKO, inspection, tax, toll roads, fines, note), West approval tag.
- Trailer note.
- **Tab "Vehicle register" (`/s/fleet/register`):**
  - [BTN] "+ Vehicle".
  - **[FORM] VehicleForm** (FR-78): ID, plate, model, hub, capacity kg, pallet places, chambers cold/ambient/frozen, ADR approval, status, next service, insurance, OGPO, KASKO, inspection, logger, calibration.
  - **Fleet register [TBL]** (FR-158):
    - View select (saved views ★ default), column chooser (code, plate, model, capacity, chambers, service, insurance, KASKO, inspection, logger, ADR, load profile, hub, status).
    - "Save view…", "Delete view", "CSV ↓" export.
    - Per row: [BTN] "Onboarding" / "Profile" and ✎ edit.
  - **VehicleSetup panel** (FR-157/141):
    - Onboarding checklist: STS, OGPO insurance, logger/calibration/sensors, tachograph fitted / not fitted, ADR checked, profile calibrated — each with confirm + reference.
    - "Close onboarding — release for planning".
    - **[FORM] Load profile calibration:** source (STS / weighing / catalogue), date, document, zones z1/z2/nt, pallets, m³, empty front/rear axle mass, GVW, axle limits, internal height/length/width, wheelbase, front axle → wall, l/100 km, thermo-container places or bulkhead split/min/max/step; computed axle shares; [BTN] Save profile.
  - **"Compliance"** [TBL] of deadlines due within 60 days, with days-left chips.

## 11 · Partners — "Service and logistics partners, shipment handover", #/s/partners (perm trips:read)
- **[DASH] KPIs:** Gold, Silver, Bronze, Blocked, Service partners, Logistics partners.
- **Filters** [SEG]: Type (All / Service / Logistics), Tier (All / Gold / Silver / Bronze / Blocked), City group (All / Main warehouses / Transshipment points / Route cities).
- **Partner [TBL]:** partner · city · group, type, tier tag, services, capacity, 2–8 °C, ADR, GDP, response, SLA, contract until.
  - Row actions: Contacts [DLG]; renewal tag + "Renew contract" (upload signed PDF + policy-valid-until date, FR-121); "Approve renewal" (second user).
  - SLA tag + "Propose demotion (four eyes)".
  - "Open in Quality · DEV"; "unblock after CAPA closed"; "Unblock".
  - Block reason; enote.
- **"Route coverage by partners and reefer service"** [TBL]: trip, city, logistics, service, reefer service; [BTN] "Create task".
- **"City directory · transshipment points"** toggles.
- **"Shipment handover to partner"** card:
  - Trip [SEG]; scope [SEG] Full / Partial; requirements.
  - Package check-list (partial).
  - **GDP submissions pending** (FR-172) with Approve / Reject.
  - **"Logistics partners on route"** candidates: tier, why, capacity, price + verdict, insurance, GDP validity tag; Contacts; "Hand over" (Gold) / "Request approval" (others).
- **"Service on route"** list: tier, services, response, blocked; Contacts; "Call service" → SR request.
- **"Service requests"** list: id, vehicle → partner, status, city, ETA, estimate, act; "Discard draft"; close [FORM] actual cost ₸ → "Close request · work report" (FR-125).
- **"Handovers to partners"** list:
  - id, trip → partner, status, scope, handover point, tier, document note, liability, logger, deviation.
  - Partner-portal step with logger / °C / seal inputs and "Accept goods / Upload ePOD".
  - ePOD-on-behalf form: reason ≥ 10 + scan upload SHA-256 (FR-108).
  - Who / by; [BTN] Approve (four-eyes).
- FR-19…33, 45, 108, 117, 121, 125, 172.

## 12 · Staff — "Where drivers are, availability, absences", #/s/staff (perm drivers:read)
- **[DASH] KPIs:** On trip, Duty/reserve, Sick leave, Vacation, Training, Onboarding, Leaving.
- **"Where each driver is now"** [TBL]: driver (category), hub, status tag, where now, vehicle, ADR until (+warning), tachograph (driving / remaining of 9 h).
- **"Urgent trip · who can go"** card:
  - Hub [SEG] Astana / Almaty; toggles "ADR needed", "vehicle 7.5 / 12.5 t".
  - Driver candidates (now / later / no + reason); "Free vehicles · hub".
  - [BTN] "Assign: …"; no-vehicle hint (subcontractor, S130).
- **"Driver document deadlines · 90 days"**: name, document, date, left tag; [BTN] "Book renewal" or a booked note.
- **[CHART] "Staff plan · 14 days"** calendar grid per driver with coded cells (trip / duty / off / sick / vacation / training / onboarding / handover) and a legend.
- FR-08, 09, 10, 46.

## 13 · Driver app — "Driver screen on trip", #/s/driver (perm trips:status; actions need driver:app; live)
- Empty state "No active trip" (FR-83).
- **Phone mock-up:**
  - **Status bar:** clock; network toggle (LTE online ↔ offline, SMS mode after 30 min); app language RU / KZ / DE / EN.
  - **Offline banner:** OL1 SMS messages list; [BTN] "Simulation: +15 min offline".
  - **Tab Stop:**
    - [CHART] 5-step bar: Arrival · Temperature · Photo · Signature · Done.
    - Step 0: geofence confirmed → "Start unloading".
    - Step 1: temperature receipt (logger 2–8, chamber 15–25, OK / DEVIATION) → "Confirm temperature".
    - Step 2: photo capture upload (SHA-256) → "Take photo".
    - Step 3: signer name, role, **signature pad** (clear) → "Signature obtained".
    - Step 4: "ePOD sent" + ePOD record card → "Next stop".
    - SSCC scan list (n/N) with per-package "shortage" exception.
    - Thermochron read (min/max inputs for DB trips) → result.
    - Exceptions: Damage / Shortage / Refused.
  - **Tab Shift:**
    - 8-item checklist with a logger-expired lock and "Logger replaced" fix.
    - Trip-sheet text; odometer start; [BTN] "Sign trip sheet" (waiting / signed states).
    - Trip documents list with tags.
  - **Tab Route:** driving / break / remaining time tiles; stops list (n, name, ETA, items, window, weather, status tag); road note; coverage note.
  - **Tab Returns:** return items with "Accept with scan"; returns kg total.
  - **Tab Fuel:** form litres, price/l, odometer, receipt photo (hash) → fuel button; consumption result; fills list.
  - **Tab More:**
    - Messages with Acknowledge; fine messages "Agree to deduction" / "Dispute".
    - Incidents: Breakdown → service (opens the contact modal), Delay +30 min, Road closure, Accident.
    - Profile: licence cat. C, ADR, medical, earnings forecast.
    - End of shift: defect toggle, odometer end, [BTN] End shift.
  - **Footer:** [BTN] "ADR instructions in writing" (expand), "Report deviation" (→ 09), **SOS**. SOS goes as an OL1 SMS when offline.
  - Bottom tab bar: Shift · Route · Stop · Returns · Fuel · More.
- **Side panels:**
  - "Feedback to dispatch · N" event feed (time, module, text, delivered / queued tag).
  - "Ecosystem function coverage" [TBL]: module, driver receives, sends, responsibility.
  - "Change requests · driver app · x / y done" [TBL]: ID, module, priority, request, basis, acceptance criterion, status.
- Automatic OL1 SMS in SMS mode for ePOD, exceptions, incidents, temperature excursions and the 30-min heartbeat (`coverage.smsSim`).
- FR-52…70, 83, 108, 125.

## 14 · Planning — "Capacity, scenarios, resources", #/s/planning (perm overview:read)
- **"Scenarios"** toggles: blizzard West, V01 repair, volume peak +30 %.
- **[DASH][CHART] "Fleet capacity · 7 days"** heat-table: required / available / reserve or shortfall / drivers / weather risk, with level colours. "Baseline from data" note when real data is used.
- **"System recommendations"** list; on a shortfall [BTN] "Handover request to a partner" (→11), "External carrier · cost check" (→16), "Express decision" (→17).
- **"Planning factors"** list.

## 15 · Reports — "Reports and KPIs", #/s/reports (perm overview:read)
- **"Fines → driver":**
  - [BTN] "Import notices (Sergek, eGov)" (demo / scenario) with a note; 50 % discount reminders.
  - [BTN] "Payroll export of deductions · period · n" plus "CSV #id" downloads.
  - Fines [TBL]: notice no., date·time, vehicle/plate, offence·location, amount, driver (per log), status.
  - **Fine detail card:**
    - [CHART] 24 h vehicle-usage timeline with an offence-time marker and an axis.
    - Paid line and history.
    - Buttons: Notify driver; Pay with 50 % discount by …; Pay in full (company); Dispute; Request recharge from driver; Deduct in payroll.
    - Reason input → "Deduct by HR decision" / "Write off as company cost".
    - Attribution form: driver select + evidence → "Attribute driver" (FR-122/123).
- **"Driver report · 30 days"** [TBL]: driver, hub, trips, km, on time, temp. excursions, driving events, fines, open.
- **[DASH][CHART] 6 KPI tiles, each with an 8-week bar sparkline:** OTIF, Temperature compliance, Volume utilisation, Empty running, Cost per pallet (actual from the cost ledger when available), Incidents per 100 trips.
- **Report catalogue**, each item with [BTN] "PDF / Excel" (demo toast):
  - Operations: Daily dispatch report, Trip completion and delays, ePOD, Exceptions and deviations
  - Cold chain: Temperature compliance, Temperature excursions, Temperature history per shipment, Sensor calibration
  - Security: Incidents, Route deviations and geofences, Driving safety, ADR compliance
  - Load and weight: Utilisation by volume and pallets, Weight utilisation, Axle loads and overloads
  - Finance: Cost per shipment/pallet/km, Fuel consumption, Maintenance costs, OPEX and CAPEX depreciation
  - KDL Olymp management: OTIF and SLA, Weather impact on trips, Empty km and CO₂, Customer dashboard
- FR-07, 64, 122, 123, 125.

## 16 · Costs — "Diesel, workshop, downtime, insurance, taxes", #/s/costs (perm costs:read)
- Intro text.
- **[DASH] KPIs:** Running cost / month, vs. outsourcing, Cost per km, Tariff cost + 5 %, Diesel share, Fleet availability.
- **Tabs** [SEG]: Summary · Diesel · Workshop & downtime · Insurance, tax, registration · Own or external · Drivers.
- **Summary:**
  - "Running costs by item" [TBL] with share bars [CHART]: group, item, ref, basis, ₸/month, ₸/year, share, source tag; total row (per km / per kg); "Not included" list.
  - **[DASH] "For the management dashboard · 6 indicators"** card.
  - **"Plan / actual per vehicle · month"** [TBL] (FR-125): plan, fuel, tolls, service, partners, fines, other, actual total, dev., l/100; total row; entries count.
  - **[FORM] "Toll statement (CSV)" import** with an imported/duplicates/errors result.
  - **[FORM] "Incoming partner / workshop invoice (ESF)":** supplier BIN, ESF no., turnover date, net, VAT, link HO-/SR- → Register (FR-116).
- **Diesel:**
  - Price [SEG] 340 / 400 / 450 ₸/l; toggle "Winter consumption +10 % (I38)".
  - [TBL] ID, model, plan / actual l/100, deviation, **[CHART] 8-week mini bars**, litres·CO₂, ₸/month·₸/km, status; totals; note.
- **Workshop & downtime:**
  - [TBL] km/month, service/month, to TO-1 / TO-2, service downtime, availability tag, downtime day, trip replacement, status.
  - Card "Cost of unplanned downtime" with total per event.
- **Insurance, tax, registration:**
  - Idle toggles [SEG]: "West closed 2 mo. in winter → V02 idle (B7)", "Ring B outsourced 3 mo. → V04 partly idle".
  - [TBL] KASKO, OGPO, tax, inspection, total/year, due + tag, idle, registration recommendation; rule note.
- **Own or external:**
  - [TBL] shipment, load, own, external, cheaper, gap, decision tag, stale tag, executed tag.
  - [BTN] execute own / external (`costs.execute`).
  - **Two-signature slots** (head of logistics + financial controller) when the gap > 50 % (FR-46/47).
- **Drivers:** "Driver requirement" [TBL]: rings, km/year, hours/year, FTE, crew tag, on road; totals (crew, FTE, base pay, employer taxes); note.

## 17 · Baseline data — "Question catalogue · 150 answers · validation", #/s/baseline (perm overview:read)
- Intro.
- **[DASH] KPIs:** Network volume, Temperature shipments 2026, Outsourcing today, Express, Rate ₸/kg, Investment, Payback, R1 start.
- **Tabs** [SEG]: Validation · Network & volumes · Fleet & economics · Express · Launch (deep link `?view=exp`).
- **Validation:**
  - Filter [SEG]: All / Critical / Risk / OK with counts.
  - Findings [TBL]: ID, topic·question + ref, catalogue answer, platform v3, decision v4, status tag.
  - "No data in the answers — request from KDL Olymp" chips.
- **Network & volumes:**
  - "Rings and legs" [TBL]: ring, route + note, km + check tag, cadence / km per year / km per day, load per trip / fill, vehicle·crew, start.
  - "Volumes by city" [TBL] with a [CHART] bar column: kg/month, kg/week, m³/week, temp./month, hub, in-network tag; totals; notes.
- **Fleet & economics:**
  - "Target fleet" [TBL]: model, body, payload·volume, price incl. VAT, warranty + tag, fuel·service, qty, status; summary.
  - **[CHART] "Rate per kg (G30)" meter bars** and **"Payback by scenario (N78)" bars**.
  - "Costs and parameters" key/values.
- **Express:**
  - Approval cards EX-…: route, customer, goods, status tag; express / LTL / saving costs.
  - **3 signer buttons:** CEO, Head of analytics & procurement, Head of purchasing & logistics.
  - [BTN] "Reject → regular trip".
- **Launch:**
  - "Critical path to the first trip" timeline with level tags.
  - Card "Pilot R1 · success criteria": fuel ≤ plan, availability ≥ 0.92, no schedule breaks, temperature confirmed by loggers.
- FR-35…51, 126, 154.

---

## Records & administration pages (sidebar group 2, plus the /records landing)

### /records — "Records and administration" overview (FR-159; overview:read)
- Lead text.
- Group cards with link buttons, filtered by permission:
  - Orders and trips: Bookings, Trip planning, Trips, Orders
  - Cold-chain logs: Temperature log, Alarms, Cargo insurance
  - CRM: Leads, Customers, Tasks
  - Registers: Vehicle register, Drivers, Lines & tariffs, Master data
  - Administration: On-call, Users, Integrations, Audit
  - Channels: Inbox, Coverage
- [CHART] help visual "split".

### /book — Book transport (customer portal, perm portal; BookingForm.tsx)
- **Pick-up address block:**
  - "From the address book…" select (FR-150); city select (cities only, page language incl. KK).
  - Street with directory autocomplete (FR-151); house no.; site/company; opening hours.
  - "Did you mean" suggestion chips; "Street not in the directory — staff check" checkbox; "delivery from the nearest network stop" note.
  - [BTN] "Save to the address book"; pick-up window from / to dates.
- **Destination address block:** same fields; same-street error.
- **Goods categories** (up to 6, GDP/GLP/GMP scope tags, class tag, "licence required"); incompatible-temperature warning; remark.
- **Load:** temperature class (unsuitable ones disabled), pallets, gross weight (mandatory; average per pallet, > 1,200 kg/pallet refused) (BUG-29).
- **"Package dimensions (optional)"** expander: lines with count, L/W/H, kg each, stackable, ×, "+ line"; weight-plausibility warnings, never blocking (FR-146/185).
- **"Dangerous goods (ADR)"** expander: UN no., proper shipping name, ADR class, packing group, LQ, EQ, net quantity + unit, dry ice kg (UN 1845), emergency contact role; validation errors.
- **Cargo insurance:** checkbox, declared value, premium (rate/minimum note), EUR/USD at the NBK rate with a stale flag (FR-152/153).
- **"Booked and paid by a third party"** payer expander (FR-186): company, BIN/IIN field with online check, role (agent / broker / forwarder / other), contact, e-mail, phone, invoice address, reference.
- **Express delivery** (FR-154): checkbox, requested delivery datetime, hint → [BTN] "Request express" (result: EX-number, decision deadline, surcharge, total).
- [BTN] "Show slots & price".
- **Result:**
  - **Price box:** customer price list, freight, discount, fuel surcharge, ADR surcharge, hub handling, net, VAT 16 %, insurance, total, FX line.
  - Route legs (collection / trunk / line / delivery / city), "+N business days via hub", lead time, manual-check note (FR-155/156).
  - [BTN] "Offer and contract sample" [DLG] and "Lock the price (quote)" → QT-… valid until (FR-147).
  - ADR needed / no ADR departures notices.
  - **Slots grid:** departure, line, mode, pick-up day, delivery + business days, holidays, free pallets chip, no-ADR / no-weight chips, booking closes.
  - **Confirm [FORM]:** LOT; payment Prepaid / On account (409 "contract required", FR-149).
  - Booking confirmation channel: e-mail + address, SMS + mobile (FR-187).
  - Weight warning chip; terms; [BTN] "Book now · date · price".
  - Done notice: number, date, price, manual-address info, notify info, payer; demo message preview.
- Tour "Customer booking" starts here.

### /my-bookings — My bookings (portal)
- **Bookings [TBL]:** number/source/ext-ref, departure/line/delivery, from → to with legs and address-check chip, goods/class/DG, pallets·kg·kg per pallet, price gross/net/handling/insurance/FX, status chip/shipment/reject reason/on-account/payer/⚠ weight.
- Row actions: Tracking link, Cancel (requested), "Offer and contract sample" [DLG], "Insurance certificate" [DLG] (print / PDF, SAMPLE).
- **Express requests** [TBL]: no., route, deliver by, decision by, surcharge, total, status chip, order.
- **Quotes** [TBL]: no., total, valid until, status (valid / accepted → booking / expired — re-priced).
- **Contracts section** (FR-149): framework-contract chip or "prepaid only"; [TBL] no., template, status, validity, SHA-256 hash, signer; "Open text" (contract sheet [DLG] with print/PDF, hash, template, validity, signature check); "Sign with NCALayer"; "Sign (demo)"; signed confirmation.
- Deep link `?n=`.

### /partner — Partner portal (role partner, perm partner:portal; FR-108/172)
- Header "Partner portal · PL-xx" and intro.
- **"Profile and GDP qualification":**
  - Name, city, tier, contract until; current qualification (valid until, scope, vehicles) or a warning; past submissions.
  - [BTN] "Submit GDP certificate" → form: certificate upload (SHA-256), plates, temperature classes, audit date, valid until, insurance until, note → "Send for review".
- **Handover cards:** HO-id · trip, orders, SSCC checkboxes with status.
  - ePOD form: consignee name, position, optional photo (hash), signature pad → "Upload ePOD"; or "ePOD uploaded · record".

### /inbox — Inbox (overview:read)
- Header with [BTN] "Demo: receive test messages" (demo / scenario).
- **[DASH] KPIs:** New, Acknowledged · in progress, Roads and weather · active, Critical · open.
- **"Messages"** [TBL] with filter open / all [SEG]: received/id, level, kind·source·title·text·meta·error, status, screen; [BTN] "→ screen", Acknowledge, Done.
- **[FORM] "Register a message":**
  - Kind: road closure, weather warning, traffic fine, workshop status, security event, telematics alarm, lead, tender, doc status.
  - Source per kind; level 0–3 [SEG]; title; details.
  - Kind-specific fields: city / section end / km / valid until; vehicle / date / time / amount / offence / location; service partner / vehicle / request / status / ETA; vehicle / alarm type / city; trip / document / status.
  - Target screen hint.

### /coverage — Network coverage (trips:read; drivers allowed)
- Intro.
- **[DASH] KPIs:** Route network km, Without mobile data %, Worst stretch, Vehicles > 30 min without data, SMS received (OL1).
- **[CHART] Schematic SVG map of Kazakhstan:** stretches coloured 4G/3G/2G/none, hubs, cities, live vehicle positions by level, measured-class overlay lines; legend; hover/click detail.
- **Detail aside:** stretch (km, class for our fleet, per-operator class, minutes without data at 70 km/h, confidence and sources), vehicle, or city; programme note.
- **"Offline windows per trip"** [TBL] with a trip [SEG]: time at 70 km/h, km from start, duration, class, stretch · what goes by SMS; ETA confidence %.
- **"Last contact with vehicles"** list with level; [BTN] "Check now (server)"; simulation buttons (in expected zone / lost outside zone / window exceeded).
- **"Worst stretches of the network"** list.
- **"SMS channel (OL1)":**
  - Format explanation and example; received SMS list.
  - [FORM] vehicle + instruction (WAIT, CALL, CHKT, CONT, STOP, PARK) → "Send SMS to driver".
  - Outgoing SMS list with gateway status, acknowledgement due / acknowledged / not acknowledged, [BTN] "Send again"; gateway note.
- **"Measured from telematics"** [TBL] (FR-111): stretch, model, measured, passes, window, status; Accept / Reject.
- **"Sources and confidence"** list and the satellite plan note.

### /bookings — Bookings desk (bookings:manage; FR-95/151/185–190)
- Status [SEG]: Requested / Confirmed / Rejected / Cancelled / All.
- Booking [TBL] with a customer column (same columns as My bookings).
- Actions: "Address checked" (prompt note), Confirm, Reject (prompt reason), departure-cancelled chip, "Cancel booking" (reason), "Offer and contract sample" [DLG].
- Live refresh on the badge poll; deep link `?n=`.

### /trips — Trips (trips:read)
- Status filter select; [TBL] trip, route + [CHART] progress bar, vehicle, driver, departure, ETA, status chip; pager (100 per page).

### /trips/:id — Trip detail (record; 403 when not allowed)
- Facts: route, vehicle, driver, departure, ETA, note.
- "Next status" buttons (planning → loading/cancel; loading → in transit / planning / cancel; in transit → delivered).
- Depart-without-release override: reason + button (`trips:override_release`, FR-91).
- **[FORM] "Abort trip…"** (FR-173): linked alarm required, optional rescue trip, reason ≥ 10; result message.
- [BTN] "✎ Edit trip" (FR-94): vehicle, driver, departure, ETA.
- **Stops** [TBL]: seq, site, status, Arrive, Deliver, "…" → per-order outcome form (delivered / partially / refused + reason), arrival time / outside window.
- **Orders** [TBL]: unassign ×; "Outcome…" (partially delivered / refused / returned / handed over + reason).

### /orders — Orders (orders:read)
- Search, status filter, [BTN] "New order" → [FORM]: destination site, goods, LOT, class, pallets, weight, height cm, stackable, priority (FR-99).
- [TBL] number/priority/created, destination, goods/LOT, class, pallets, weight, status.
- Per row: tracking link copy, ↻ renew token, Cancel. Pager.

### /alarms — Alarms (alarms:read)
- "Show resolved" checkbox; deep link `?id=`.
- Rows: severity chip, message, code, category, level, escalation, time, status, resolution.
- Acknowledge; resolution category select + text ≥ 10 → Resolve. A level-3 alarm cannot be resolved while still open.

### /insurance — Cargo insurance (quality:write; FR-153)
- **Policy card**, marked as a fictitious planning entry: insurer, BIN, policy no./kind, validity, deductible, claim deadline, rate, minimum, maximum.
- **[FORM] "Open claim":** order, deviation DEV-…, amount, description; prefilled from 09.
- **Claims [TBL]:** number, order, deviation, booking, amount, status chip, deadline/overdue, note; steps Submit → Settled / Rejected, each with confirm + note prompt.

### /crm — Leads & deals (crm:read)
- [BTN] New lead → [FORM]: company, contact, e-mail, phone, from, to, source (phone / email / referral / tender / manual), message, BIN, tender no. + deadline (FR-127).
- Link to the public `/request` form.
- **[CHART] Kanban pipeline:** New / Contacted / Quoted / Won / Lost, with counts; cards show company, route, tender, source, date, owner.
- **Lead detail card:**
  - Contact, e-mail/phone links, route, class, pallets/frequency, source, consent, BIN, tender, deadline, message.
  - Edit status / hub / owner / lost reason → Save; "Convert to customer"; "Erase personal data" (anonymise, confirm).
  - Add-task form.
  - **Onboarding wizard** (FR-127): create portal user (OTP shown once), create API client (scopes + webhook) with the secret shown once.

### /customers — Customers (crm:read)
- [FORM]: company, BIN/IIN field with check digit and online KGD name lookup (FR-189), city, contact, e-mail, phone.
- [TBL]: company, BIN, city, contact, e-mail/phone (masked → "Show personal data").
- **Contracts expander** (FR-149): framework chip; generate from template (template/version/language, validity, discount, base diesel) / install built-in templates; list with Open text, Send, Void (reason).
- **Price lists expander** (FR-148): in-force chip; create (framework/spot, discount, diesel base, valid from/to); list with Deactivate.

### /tasks — Tasks (crm:read)
- Mine / All [SEG]; [FORM] task, due date, assignee; rows with done checkbox, CRM link, assignee, due chip (red when overdue).

### /drivers — Drivers (drivers:read)
- [BTN] "+ Driver" → [FORM] name, hub, IIN (12), phone, licence no., licence until, ADR until (encrypted note).
- [TBL] name, IIN (masked), phone (masked), licence until, ADR until; "Show personal data" (pii:read, audited).

### /planning — Lines & tariffs (bookings:manage; edit with planning:admin)
- **Lines** [TBL]: hub, line, weekdays, departure, capacity, chambers, cut-off.
- **Line vehicles** assignment editor (FR-173/118) and [BTN] "Cancel departure" (date + reason prompts → affected bookings, FR-97).
- **Tariffs** [TBL]: hub, class, base fee, ₸/pal·km, minimum; inline ✎ edit → Save; formula note.

### /master-data — Master data (overview:read; FR-78/142/174)
- Pending-approvals count; "Planning values not yet verified" notice with "Open the list".
- **Kind [SEG]:** Partners, Cost parameters, Cities, Alarm thresholds, Vehicles · history, Lines · history, Tariffs · history, Road restrictions, Manufacturers · logos, Planning values · verification.
- [BTN] "+ New entry"; links "+ Vehicle" / "Lines and tariffs" / "+ Driver".
- **Edit [FORM]:** per-kind fields + "Valid from" → "Save version"; four-eyes note.
- [TBL] key, value summary, version/date, status (pending · changed · by with Approve / Reject; scheduled from date; active); ✎; History.
- History [TBL]: v, valid from, changed fields, status, who/approver.
- **Manufacturer logos admin:** upload PNG/WebP ≤ 300 KB, remove upload, source column.

### /oncall — On-call roster (alarms:read; FR-166)
- [DASH] coverage cards per level (duty officer L1, head of security L2, CEO L3): on call now / fallback, covered h of 72, gap warning.
- [FORM] level, user, shift label, SMS phone, e-mail, from, until → "Add slot".
- [TBL] level, shift, SMS, e-mail (masked), from, until, status, [BTN] End.

### /users — Users (users:admin)
- [FORM] username, name, role (11 roles), hub, or customer (for customer role) / partner ref PL-xx (for partner role) → "New user"; one-time password notice shown once.
- **"Approval slots without a holder"** wizard (FR-167): assign a function to a user.
- [TBL] username (+locked), name, role select, hub, functions (details with checkboxes: CEO, head analytics, head purchasing, head logistics, financial controller, QA manager, HR manager, head of security), 2FA, last login, active checkbox; Reset password / Reset 2FA / Unlock.
- **Full data export card** (`/api/export`) for all-hub admins.

### /integrations — Integrations (integrations:admin)
- **Integration hub:**
  - "Next deadlines" card with days-left chips; summary card (systems, mandatory, conditional, configured, manual, planned; data source); [BTN] "Inbox messages →".
  - **ESUTD readiness panel** (FR-114): deadline countdowns (medcheck 01.01.2027, e-TTN / trip sheet 01.06.2027), per-hub [TBL] trips, trip sheet complete %, TTN %, medical check, readiness %.
  - Category tables (government, police/road/weather, roadside, security, leads, telematics & couriers): system/operator/note/unverified, mandatory + legal basis + deadline, API type, connector status/error, last sync, inbox kinds fed.
  - "Inbound webhooks" [TBL]: source, secret set, kinds.
- Webhook pending/failed counts.
- **API keys:** [FORM] name, customer, webhook URL, scopes (slots:read, quotes:write, bookings:write, bookings:read, shipments:read) → Create; key and webhook secret shown once; [TBL] name, key prefix, scopes, webhook, last used, Revoke.

### /audit — Audit log (audit:read)
- [BTN] "Verify chain integrity" → OK count or first broken id.
- Filter action / user; [TBL] #, time, user, action (failed highlighted), object, details, IP, hash.

### /account — My account (everyone)
- Facts: username, role, 2FA on, session until; change-password form.

---

## Public pages (no login)

### /request — Public request form
- Brand header, language switch RU/DE/EN/KK, footer.
- [FORM] company*, contact*, e-mail*, phone, from*, to*, temperature class, pallets, frequency, message, honeypot, consent* → Send (form token, rate limit 429).
- Thank-you state. Creates a CRM lead with source "Website form".

### /track/:token — Shipment tracking
- Facts: number, destination, class, status chip, ETA, planned ETA, delivered, temperature compliance OK / not OK, route legs, estimated delivery + business days, "handed to partner" (FR-112/155).
- [CHART] status stepper new → planned → in transit → delivered (or cancelled).
- Events timeline (non-personal).

### Login (Login.tsx)
- Brand or Kökzhol lock-up; language switch.
- Steps: password → 2FA verify or 2FA setup (QR + manual key + code) → recovery codes (shown once) → forced password change (≥ 12 characters).
- Design switch; version/build.

---

## /help — Help and how-to (help/Help.tsx, content.ts, screens.ts, records.ts, extra.ts, roles.ts)

### Page features
- Search box with "Articles found: N"; [BTN] Print.
- Table of contents by group (Getting started · Operations · 17 screens · Records and administration · Integrations and channels · Reference).
- Articles with `#anchor` deep links; each shows:
  - Purpose; embedded help visuals [CHART]; Who uses it; What you see; How-to step lists; Rules and limits.
  - FR line; related-article links.
  - "Access" line listing roles + permission code + "you have access" chip; "Open →" button.
- Customers see only the portal subset.

### Articles
- **Getting started:** How the platform is organised (structure diagram [CHART]: 17 ops stages ↔ records groups ↔ external systems, "Why the split"), Sign-in / 2FA / password, Roles and permissions, Personal data and audit trail, Online demo (role switch, alarm practice), Guided tours by role (TourList), Where is express?, Links / browser history / tabs.
- **Operations:** one article each for 01–17 (overview … baseline).
- **Records:** r-inbox, r-bookings, r-bookings-requests, r-dispatch, r-trips, r-orders, r-temperature, r-alarms, r-crm, r-customers, r-tasks, r-fleet, r-drivers, r-planning, r-master-data, r-oncall, r-users, r-integrations, r-audit, r-account, r-book, r-my-bookings, r-records, r-contracts, r-insurance.
- **Channels:** int-systems (external systems and mandatory deadlines), webhooks (connect a partner by webhook), portal (booking portal, request form and tracking), partner-api (Partner API v1 + webhooks), r-coverage (network coverage and SMS fallback).
- **Reference:** Glossary, FAQ.
- **Roles article:** role cards (admin, dispatcher, warehouse, driver, auditor, viewer, manager, finance, quality, customer, partner) with "your role" marker, and a **[TBL] permission matrix**. Permissions: overview:read, orders:read/write, trips:read/write/status, fleet:read/write, drivers:read/write, pii:read, temperature:read/write, alarms:read/write, users:admin, audit:read, crm:read/write, data:export, portal, bookings:manage, planning:admin, integrations:admin, documents:sign, quality:write, partners:write, fines:write, costs:read, costs:approve, approvals:sign, driver:app, partner:portal, trips:override_release, trips:override_load.

### Help visuals (lazy, [CHART])
- flow, split, booking, express, coldchain, truck, coverage, approvals, driverDay, dispatchMock.
- Used in articles and in the "◇ Diagram" popover of screens dispatch, load, docs, thermo, quality, security, driver, baseline and costs.
