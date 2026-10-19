# v6 platform mock-up: functional inventory

Source root: `C:\_Projects\Olymp-Logistic-KZ\platform-src\v6`. Everything below was read directly from the code. Labels are given in English (the EN slot of the `T(ru, de, en, kk)` quads). FR / LH numbers appear only where the code cites them.

**NAV has 13 entries, not 12** (`core.js` lines 156–170). The 13th is `baseline` ("Baseline data"), which was moved out of Settings into its own menu item by `screens/620-eco-baseline.js`.

## How tabs are composed (load order)

Tabs are added in file-number order:

| Screen | Final tab order | How it gets there |
|---|---|---|
| dashboard | overview → alarms → inbox | `410` calls `ensureTabs('dashboard','overview')`, then adds two tabs |
| orders | orders → loadw → ship → docs → bookings → commercial | `200` turns the base table into tab `orders` (label "Orders"); `210`, `220`, `230`, `420`, `500` add the rest. The `ensureTabs` call in `420` (label "Loads") does nothing because tabs already exist |
| dispatch | board → planning → partners → express | `030` defines board/planning; `160` adds partners; `240` adds express and appends content to planning |
| fleet | fleet → registry | `310` |
| drivers | drivers → staff → app | `320` adds staff, `330` adds app |
| routes | map → temp → wx → sec → coverage → lines → thermochron | `060`, then `150`, `340`, `350`, `360` |
| hubs | hubs → recv | both in `070` |
| pod | queue → quality | `090`, `140` |
| billing | inv → cost → insurance → model | `100`, `430`, `600` |
| reports | cards → kpi → cross → fines | `610` converts the screen to tabs |
| ai | no tabs | single body |
| baseline | no tabs | single body with internal segment control |
| settings | base → ref → oncall → users → audit → integ | `440` calls `ensureTabs('settings','base','General')`; `620`'s fallback tab `main` is never created |

Tab-level permissions (`perm`):
- orders: loadw, ship and docs need `orders:read`; bookings needs `bookings:manage`
- dashboard: alarms needs `alarms:read`
- dispatch: express needs `trips:read`
- billing: model needs `costs:read`
- reports: fines needs `costs:read`
- settings: oncall needs `alarms:read`, users needs `users:admin`, audit needs `audit:read`, integ needs `integrations:admin`

---

## 0. Global shell (`core.js`, `roles.js`)

### Sidebar
- **Brand lock-up.** Kökzhol mark plus wordmark (Cyrillic for RU/KK) and the claim "Cold chain, on schedule." Clicking it goes to the role's home route.
- **Menu.** The 13 NAV items, filtered by `canSee`, with icons. Some items show count badges from `NAV_BADGE`:
  - `orders`: new bookings (FR-190), only if the role has `bookings:manage`
  - `baseline`: open FR-49 questions
- **"Portals and apps" section (side tools):**
  - "← Platform (administrator)" — only inside a role shell
  - Customer portal, Partner portal, Driver app — each switches the role
  - Public request and tracking — goes to route `request`
  - Help — hidden inside role shells
- **Live badge.** A SIMULATION toggle (`simTog`) plus "telemetry · every 2 s", a live dot and the last tick time. `liveTick` runs every 2 s: temperatures drift, in-transit progress advances, and the dashboard, routes and hubs screens re-render.
- **Language links:** RU / DE / EN / KK (separate HTML files).
- **Version link** `v6.1.0 · BUILD`, which opens route `changes`.

### Top bar
- Burger button (mobile side menu, `sideTog`).
- Breadcrumb: home › current screen.
- Global search "Search loads, trucks, drivers…" (`#gsearch`). Typing jumps to Orders and filters it.
- **Role box:** select with the 11 roles (admin, dispatcher, warehouse, driver, auditor, viewer, manager, finance, quality, customer, partner). Changing it calls `setRole` and switches menu and permissions at once.
- Design toggle ◐/◑ (`setDesign`, Kökzhol ↔ Olymp).
- "?" button (`helpHere`) opens the help article for the current screen/tab.
- Bell with an alerts count (temperature breaches plus available drivers with RTO < 4 h).
- User name and role, avatar (per-role demo user names).

### Page frame and engine
- **Page head:** title, subtitle, actions area. Help adds "?" and "▶ Tour" buttons; the AI summary adds "✦ AI Summary" (see section 16).
- **Pill tab bar** (`tabBar`) with optional per-tab badges.
- Drawer engine (`DRAWERS`, normal and `xl` width), toast messages.
- **Status vocabulary:** Unassigned / Assigned / Loading / In Transit / Delivered / Problem; priority High / Medium / Low; ESF none / issued / confirmed; document state Valid / Renew soon / Expired.
- **Core rules:**
  - `compat`: zone, pallets, availability, RTO, expired licence/medical, pharma calibration. Extended in `300` with absence, driving-time, medical, ADR, onboarding and open-service blocks.
  - `assign`: extended in `200` with double-booking (FR-93).
  - `autoAssign`, `setStatus` (fires `HOOKS.status`), `canMove`: extended in `200` so loading → in_transit requires a Go/No-Go release (FR-91).
  - `createLoad`: 1–33 pallets, origin ≠ destination.
- `roles.js`: 11 roles, `ROLE_PERMS` (from `role-perms.json`), `SCREEN_PERM` per screen, `SHELL_NAV` for driver/customer/partner, and `ALWAYS = help, changes, track, request`.

---

## 1. Overview / Dashboard (`dashboard`)

Screen `screens/010-dashboard.js`, made tabbed by `410`.

- **Subtitle:** "Cold chain: Astana · Almaty · Karaganda · Shymkent · Atyrau (West)".
- **Header action:** Create Load (opens the create drawer).

### Tab `overview` — "Overview" (`010-dashboard.js`; map from `005-kzmap.js`) — DASHBOARD
- **6 KPI tiles:**
  - Active loads (sub: delivered count)
  - Temp. compliance %
  - Free reefers (of total)
  - Temp. excursions
  - Fuel MTD (static 18.4 M ₸)
  - Revenue (M ₸, ↑12 %)
- **Card "Live Operations" — map/diagram.** Kazakhstan outline in real projection with 23 cities. Hubs are drawn as squares. Trunk roads are coloured by mobile coverage (4G / 3G / 2G / no network; dashed = no network). Active-load paths follow shortest roads. Moving truck markers sit along the path and are coloured by temperature state, with a plate and temperature label; clicking one opens the load drawer.
- Coverage legend.
- "Vehicle status" legend: On time / Near limit / Temp. alarm.
- Stat strip: total vehicles, available, active loads.
- **Card "Today's Dispatch":** 7 non-delivered loads (id, route, zone chip, status chip, driver). Clicking opens the load drawer.
- **Card "Alerts" (max 5):**
  - Temperature alert (red)
  - Driving-time (RTO) warning (orange)
  - ESF not issued (yellow)
  - POD pending (blue)
  - Empty state: "No active alerts"
- **Card "Quick Actions":**
  - Create Load
  - Assign Driver (goes to Dispatch)
  - Generate ESF (issues ESF for every delivered load with approved POD and no ESF yet)
  - Plan Route (opens Dispatch → Planning)

### Tab `alarms` — "Alarms" (`410-rec-alarms-inbox.js`; perm `alarms:read`; badge = open unacknowledged) — FR-101, FR-104, FR-105
- **4 KPI tiles:**
  - Critical (level 3)
  - Unacknowledged
  - Open in total
  - On-call levels reachable n/3
- **Filters:** Status (Open / Acknowledged / Closed), Level (1–3), Hub.
- Button "Register alarm" opens drawer `alarmNew`.
- **Alarms table:** ID + created time, level chip, event category + text (DE/EN transliterated), hub / load / truck, source (Wialon, Thermo King TracKing, Driver app, Manual, Hub), status (plus "escalation: step n").
- **Card "Risks (not alarms)":** temperature near limit, open road closures, weather warnings from the inbox.
- **Card "Escalation rule (level 3)":**
  - L1 duty officer: SMS + e-mail
  - L2 head of security: SMS + e-mail + call
  - L3 CEO: call
  - Shows the current holder or "nobody — fallback", and a 72-hour coverage bar per level
  - Note: the next level is called after 5 min without acknowledgement
- **Drawer `alarm`:**
  - Level / status / source chips; text; hub, created, load link, truck, acknowledged by
  - "Notifications and escalation" log (time, level, target, channel, masked recipient, ✓/⚠)
  - Buttons: Acknowledge; "⏱ +5 min" (simulates an escalation step; level 3 only)
  - Close form: resolution category (False alarm, Resolved on site, Technical cause, Handed to police, Cargo checked OK, Auto-recovered, Other) and a closing note of at least 10 characters with no personal data → "Close with note"
  - A level-3 alarm must be acknowledged before it can be closed; the right `alarms:write` is needed
- **Drawer `alarmNew`:** category (9 kinds: temperature, cargo door, panic/SOS, seal broken, geofence exit, contact lost, power cut, unplanned stop, accident/breakdown), level 1–3, hub, load, description → Create.
- **Automation:** a load that goes to `problem` raises a level-3 temperature alarm (HOOKS).

### Tab `inbox` — "Inbox" (`410`; badge = new messages) — FR-135
- **4 KPI tiles:** New, Acknowledged, Done, From connectors and webhooks.
- **Filters:** Kind (10 kinds: road closure, storm warning, traffic fine, workshop/mobile service, security event, telematics alarm, lead, tender, state document status, SMS not acknowledged), Status, search.
- Button "Register manually" opens drawer `inboxNew`.
- **Table:** time + ID, level chip L0–L3, kind + source (Webhook / Connector / Manual) + title + text (transliterated on DE/EN, original on hover), status.
- **Row actions:**
  - "→ <target screen>" routes to the working screen/tab (e.g. routes/wx, routes/sec, dispatch/partners, dashboard/alarms, orders/commercial, orders/docs, dispatch/board, reports)
  - Acknowledge and Done — each needs a per-kind permission
- Note about the transliteration rule.
- **Drawer `inboxNew`:** kind (permission-filtered), level 0–3, source, title (at least 5 characters), text → Register. Telematics and security messages also raise an alarm.

---

## 2. Orders & Loads (`orders`)

Screen `screens/020-orders.js`.

- **Subtitle:** "Every load: who, what, where, when, status and margin".
- **Header actions:**
  - Import Loads — toast "CSV import: phase 2b"
  - Create New Load — drawer `create`
- **Menu badge:** new bookings (FR-190).

### Tab `orders` — "Orders" (`020-orders.js`, converted to a tab by `200`)
- **Filters:** Status, Customer, Zone, Priority, Clear All. The global search also filters here.
- **Table, 8 per page, with pager:**
  - Load ID + created time
  - Customer (avatar, name, BIN)
  - Route (km, pallets)
  - ETA
  - Temp zone + live temperature chip
  - Status
  - Priority
  - Driver / Truck
  - Rate + margin %
  - ESF chip
- **Drawer `load`** (6 sub-tabs; title = load id):
  - **Overview:**
    - Customer identity
    - Key-value block: route, distance, ETA, status, zone, temperature now, pallets, weight
    - If unassigned: "Assignment" with Driver select (available, shows RTO), Truck select (plate / model / pallets), Assign button, and an RTO / zone requirement note
    - Otherwise: assigned driver, truck, type, RTO
    - Action bar: "→ next status"; "Report problem" (while loading / in transit); "Resolved — resume" (while problem)
    - Added by `240` for assigned/loading loads:
      - "Release Go/No-Go" section: Go / No-Go·n / ready chip and a list of failed controls
      - Buttons: Release · Go; or reason field + "Release as an exception" (needs `trips:override_release`); Withdraw release; "Documents KZ →"
      - "Replanning" section: new ETA (datetime), reason (weather / vehicle / driver / other), Replan, Unassign, plus a note
  - **Stops:** Pickup → In transit → Delivery timeline.
  - **Docs:** availability rows for Waybill (TTN), Temperature log PDF/CSV, Handover act, POD, ESF/ESUTD.
  - **Notes:** note list, textarea, "Add note".
  - **Billing:** rate, VAT 12 % included, cost, profit, terms 30 days, ESF chip; "Issue ESF" (only when delivered with approved POD), otherwise a note.
  - **Temperature:** range, current temperature, excursion minutes, and a **6-hour sparkline chart** with the in-range band.
- **Drawer `create` ("New Load"):** Customer, From, To, Temperature zone, Pallets (1–33), Priority, error line, Create load.

### Tab `loadw` — "Load & weight" (`210-ops-load.js`; perm `orders:read`; badge = assigned/loading loads whose SSCC reconciliation does not match) — FR-99/139/140/143/144/145/146, FR-05/06; LH-C1/C2, LH-D2

The tab works on one selected non-delivered load. It defaults to the first load in `loading`, else the first non-delivered load. Layout, top to bottom:

1. **Load selector chips.** One chip per non-delivered load: id · from → to · status (`lwSel`).

2. **Card "Vehicle type — what-if for load …"**
   - Segment control over the truck catalogue:
     - Reefer 20 t (33 pallets, 20 000 kg, 86 m³, height 265, axles 12 000 / 24 000, gross 40 000, 420 ₸/km)
     - Reefer 12 t
     - Van 10 t
     - Tent 20 t (ambient only)
     - Van 3.5 t
     - HOWO T5G 10 t and JAC N120 10 t — only with the target-fleet option
   - Checkbox "+ target fleet 10 t (HOWO, JAC)" (`lwOpt target`).
   - Spec line of the chosen type: name, kind, pallets, kg, m³, internal height, axle limits, ₸/km, assigned truck plate.
   - Plan status: "Plan <load>: <type> · by · time" (plus a "with a reason" chip), or "No vehicle type saved".
   - Controls:
     - "Save as plan" (`lwPlan`)
     - If the type does not fit: a reason input of at least 10 characters (needs `trips:override_load`), otherwise the message "Does not fit — plan only with a supervisor reason" and a disabled button

3. **Card "Orders on load <id> · from → to"** (left of a 2-column grid)
   - Explanatory note about unticking orders (what-if).
   - Order rows with a checkbox (`lwOrd` toggles inclusion). Each row: order id; branch · city; goods name; pallet height cm; "stackable"; unloading stop number; class/zone chip; pallets; m³; kg. Excluded orders are greyed.
   - Summary tiles (red when over): Pallets x / max; Weight kg / max; Volume m³ / max; Utilisation %.
   - Data source: 2–4 deterministic orders per load, each with lines (article, manufacturer, LOT, expiry, qty) and places (one SSCC per pallet). One demo load (`…1852`) carries a second, ambient zone.

4. **Card "Loading diagram · top and side view · centre of gravity"** (right column) — SVG diagram
   - Orientation labels: "← Cab · front wall" and "Rear door →".
   - **Top view (SVG):** 2-wide pallet grid in LIFO order (last stop at the front wall). Each cell is coloured by stop and labelled "stop · kg per pallet". Overflow pallets are red. For two-zone loads a red dashed **bulkhead** line is drawn. The **centre of gravity ⊕** marker includes the lateral offset.
   - Note on numbering: stop and kg/pallet, ⊕ = centre of gravity, odd positions left / even right.
   - **Side view (SVG):** stack height per row against a dashed internal-height line; rows over the limit are red. Note shows the internal height and the tallest pallet with its order.
   - **Bulkhead control** (two-zone loads only): − / + buttons (`lwBulk`, audited); text "zone 1 · cold n | zone 2 · ambient m pallet places"; chip "zone 1 too small: needs n" / "zone 2 too small" / OK. Single-zone loads show "1 temperature zone — no bulkhead needed".
   - Compact slot grid (2 columns × capacity) with stop numbers, ↑ for non-stackable, ✗ for overflow.

5. **Card "Weight, volume and axle loads"** (left column of the next grid)
   - 7 progress bars, each showing value / max · % and turning warn ≥ 90 % or crit when over, with "Overload: +x":
     - Pallet places
     - Payload kg
     - Volume m³
     - Front axle kg (lever rule)
     - Rear axle kg
     - Gross weight kg
     - Load height cm
   - **"Load checks" list** with level chips (block / warning / info / OK):
     - Every overload issue
     - Temperature class not supported by the type/truck
     - Lateral imbalance (> 25 % of payload)
     - Centre of gravity shifted (< 20 % or > 75 %)
     - FEFO short shelf life: article, LOT, days left at delivery (< 90 days), "agreed with the branch" when agreed
     - SSCC reconciliation mismatches per order
     - Otherwise "No findings…"
   - Button "Agree the short shelf life with the branch" (`lwFefo`, audited) when FEFO findings exist.

6. **Card "Package reconciliation (SSCC) with orders"** (right column)
   - Note: a mismatch blocks the Go/No-Go release.
   - Row per order: id, branch, n / expected SSCC scanned, status chip (matches / short n / surplus / wrong trip — one demo place is scanned into another trip for FR-03).
   - "Rescan package" button (needs `orders:write`).

7. **Card "Departure weighing · <id>"** (under reconciliation) — FR-145
   - Header shows the limits of the planned/assigned type: front / rear / gross.
   - Latest weighing row: source (weighbridge / axle scale / manual), ticket, front, rear, gross, time; "within limits" chip or per-code excess chips "+x kg front axle (val / max)"; "released with a reason" plus the reason; red text "Trip release blocked: overload by weighing". With no weighing: "No weighing — the gate checks the load calculation".
   - Record form (needs `trips:status`): source select, ticket, front kg, rear kg, gross kg, "Record weighing" (`lwWeigh`, audited).
   - Override (overloaded weighings, needs `trips:override_load`): reason (≥ 10 characters) and "Release with a reason" (`lwWOvr`, audited).
   - Error message line; record count.

8. **Card "Loading sequence for the warehouse"** (full width) — FR-144
   - Button "Print / PDF" (✓ once printed) opens a printable HTML table in a new window (`lwPrint`, audited).
   - LIFO note.
   - Table, max 280 px scroll: # | position ("n · left/right") | zone | order | unloading stop (branch) | tiers (2 when both stacked pallets are stackable) | SSCC, or a "does not fit" chip for overflow.
   - **Scan check:** SSCC input (accepts AI 00 / 20-digit forms), position number, "Check scan" (`lwScan`). Result chip: position correct / wrong position (scanned n, planned m) / not in the plan / enter SSCC and position. Scans are logged.

9. **Card "Truck finder · simulation"** (full width) — FR-143
   - Header: "every catalogue type and fleet vehicle for the ticked orders · km".
   - Segment "by rate ₸/km" | "cheapest total"; checkboxes "compare with two vehicles" and "+ demo 3.5 t".
   - Full-cost note: diesel 285 ₸/l × consumption, tolls 12 ₸/km, driver 2 500 ₸/h, empty return 60 %, depreciation 45 ₸/km.
   - Recommendation banner: "Recommended: <best> · cost (per pallet) · utilisation %", or "No candidate fits — split, hand to a partner or lift the restriction".
   - **Ranked table:** every catalogue type plus every fleet truck. Columns:
     - # rank
     - Vehicle / type: name, kind, ₸/km, pallets used / max, with buttons "Calculation" (switches the what-if type) and "Apply as plan" (fitting rows only)
     - Weight · volume (red when over)
     - Axles · gross: front / rear / gross (red when over)
     - Cost: total and rate, the active basis in bold, empty km, ₸ per pallet
     - Height vs internal height
     - Utilisation %
     - Result: recommended / fits / does not fit, "plan" chip, issue chips (overloads, zone, workshop, busy on load X, empty run from hub X km, expired sensor calibration for pharma)
   - **"Split over two vehicles"** (shown when the option is on or nothing fits) — FR-139:
     - Chip "No single vehicle takes the whole load — split proposal", or "One vehicle: <type> · cost"
     - Up to 3 proposals: type A + orders + pallets, type B + orders + pallets, total cost, difference to a single truck
     - Or "Splitting does not fit either — hand to a partner or postpone orders"
   - **"Partner offers (rate per pallet)":** row per non-blocked logistics partner: id, name, ₸/pallet·km (gold 32 / silver 27 / bronze 24), pallets, total cost, "can take it" or a reason (no reefers / no GDP approval / not enough capacity).
   - Own vs partner comparison line: "own trip is cheaper" / "partner is cheaper".

Not rendered here but defined in `200` and used by this tab: `ops(l)`, `loadCalc`, `tripCost` (fuel, toll, driver, empty return, fixed), `finder`, `splitPlan`, `sequence`, `fefo`, `recon`, `rescan`, `weigh` / `weighOverride` / `weighLimits`, `savePlan`, the SSCC GS1 check digit (company prefix 4870012), the truck catalogue `TYPES`, and the cost parameters `CM`.

### Tab `ship` — "Shipments & labels" (`220-ops-ship.js`; perm `orders:read`) — FR-01…06, FR-73, FR-176
- **Scanner search:** SSCC (AI 00), article, order, PO, ePOD. A valid SSCC jumps straight to its label, across loads and the archive. An ePOD / load-id pattern opens that shipment. Check-digit chip (valid / wrong).
- Checkbox "Including delivered (archive)"; "from date" filter.
- Load chips: id · route · places · delivered / ePOD.
- **Card "Manufacturers · n":** manufacturer cards (logo image in a 515:380 box or an initials badge, name, company, URL, places count) with a logo badge at the right edge (FR-176 note).
- **Card "Packages · <load> · n":** rows with SSCC, order, PO, PL, article + goods + manufacturer logo, "short expiry" flag + LOT + expiry, qty, class chip. Clicking a row selects the label.
- **Label card "Transport marking · package label":**
  - Manufacturer header
  - Label box: Sender / Recipient, PO, PL, order · load, article, goods, LOT, expiry (FEFO marker), qty
  - Temperature banner (dark for frozen) with a handling note (Do not freeze · GDP / Keep at 0…+4 °C / Deep frozen / Keep dry)
  - SVG pseudo-barcode with "(00) SSCC"
  - GS1 AI marks: (02) GTIN, (37) qty, (10) LOT, (17) expiry, (401) consignment
  - Buttons: Print label (demo, audited); "ZPL for Zebra (GS1-128)" / Hide ZPL (toggles a ZPL code block); Export .zpl (download, audited)
  - **"Package scan history (track & trace)" timeline:** created/label printed → loaded → departed → GPS in transit % + temperature → unloaded → received by branch (ePOD). Scans into the wrong trip are flagged as ALARM; missing steps show greyed.
- **Card "Manufacturer registry · 21":** all manufacturers (6 with logos, others with badges) with country, URL, group chip (added in v5 / top western IVD / in range / third-party cargo) and the places count across demo loads.

### Tab `docs` — "Documents KZ" (`230-ops-docs.js`; perm `orders:read`; badge = assigned/loading loads not released) — LH-H1, LH-B2, FR-12/91/92/116
- Load chips: all non-unassigned loads, with a "Go" suffix when released.
- **Card "Document set · <load>":**
  - Buttons "Generate all" and "Fetch state system statuses" (`dkPoll`: sent → accepted, with a registration number)
  - Subline: route, plate, driver, status
  - Rows for TTN (consignment note), Waybill (trip sheet), SNT (goods accompanying note → ESUTD) and ESF (→ IS ESF). Each shows a status chip (not generated / generated / signed (EDS) / sent / accepted / rejected / closed) and actions:
    - Generate, or the blocking reason: ESF only after approved POD (FR-116); waybill needs driver + truck + today's pre-trip medical (FR-114)
    - PDF (opens a printable demo form)
    - Sign (e-signature) — needs `documents:sign`; opens drawer `esign`
    - "To ESUTD / IS ESF" send
  - "Status from state systems (inbox)" list
  - Disclaimer note about forms and the NCALayer demo
- **Card "Trip release · Go / No-Go":** 8 data-based controls, each Go / No-Go with detail:
  - Documents — TTN and waybill signed
  - Sensor calibration
  - Insurance — MTPL and cargo dates
  - Medical check — today's pre-trip check plus certificate
  - Place reconciliation (SSCC)
  - Load and weight — weighing or calculation
  - Temperature class of the truck
  - Driver — licence + RTO
  - Weather and roads — storm warning from the planning scenario
  - Fix buttons: "Record pre-trip medical check" (needs `trips:status`); "Load & weight →"
  - Release area:
    - If released: "Released: Go · by · time" (exception chip + reason), plus a revoke-reason select (weather / vehicle / driver / documents / load / critical alarm / trip changed / other) and "Withdraw release"
    - Else, all pass: "Release the trip · Go"
    - Else, with `trips:override_release`: No-Go note, reason input, "Release as an exception"
    - Else: disabled "No-Go: cannot release"
    - For in-transit or delivered loads: an informational note
- **Drawer `esign` ("E-signature"):** document + load; NCALayer (demo) certificate box (KZ-NCA-2026-4471, owner, valid until); note; Sign button.

### Tab `bookings` — "Bookings" (`420-rec-bookings.js`; perm `bookings:manage`; badge = new bookings) — LH-M4, FR-190, FR-28/153
- **4 KPI tiles:** New request, Confirmed, Rejected / cancelled, With insurance.
- **Filters:** Status, Customer; note that requests come from the portal and the public form.
- **Table:** request id + created, customer + payer label (customer / agent / forwarder / broker / consignee), route + zone + pallets + kg, options (Express / Insured chips), price incl. VAT (`bookingPrice`: distance × zone rate × truck share ≥ 35 %, express +25 %, insurance 0.15 % min 3 000, VAT 12 %), status + load id.
- **Drawer `booking`** (pill sub-tabs):
  - **Request:** status / express / insured chips; customer, payer, route, cargo, declared value, created, order link; customer note (transliterated); history log.
  - Actions (`bookings:manage`):
    - New: "Confirm and create the order" (creates a load); reason field; Reject; "Cancel (customer request)"
    - Confirmed: "Cancel the order" (only if the load has not started; removes the load)
  - **Offer / contract:** commercial offer sample document (freight, express, insurance premium, net, VAT, total, payer, contract note) and "Download (HTML)".
  - **Certificate** (insured + confirmed only): certificate CERT-…, insurer/policy (SAMPLE), policyholder, shipment, insured value, premium / deductible 0.5 %, period, download.

### Tab `commercial` — "Commercial" (`500-commercial.js`; badge = new leads + overdue tasks) — LH-M2/M3, FR-127, 147–152, 189

Internal segment control: Customers | Price lists | Offers | Contracts | CRM | Tasks | FX rates. Tasks and CRM show count badges.

- **Customers**
  - Table: customer (avatar, city, since), BIN/IIN chip with check-digit validation (IIN masked), contact, portal access chip, terms (framework −x % / spot / line tariff), active framework contract, loads count. Clicking a row selects the customer.
  - Card "New customer": BIN/IIN with live check-digit message (FR-189) and register autofill from a mock KGD (demo BINs listed), company name, city, contact → "Create customer".
  - Card "<customer> · address book": terms line (discount, diesel base, framework → payment on account or prepayment only); address rows with check state and "Address checked" / ×; add-address form (city, label, street with directory suggestions, house), address check hint (ok / manual / bad) → "Add address".
- **Price lists:** table (#, customer, kind framework/spot, discount, diesel base ₸/l, validity, status in force / active / deactivated, Deactivate). Card "New price list" with the fuel-surcharge formula note, customer, kind, discount, diesel base, from/to → Create, plus an example calculation (Astana → Almaty pharma 10 pallets).
- **Offers (KP):** table (id + issued, customer, route + mode + km, zone, cargo, price incl. VAT + locked-until, status Valid / Accepted / Expired / Void + booking). Actions: Accept → booking, Void, Sample. Card "New offer (price locked for 14 days)": customer, from, to, zone, pallets / kg → "Lock the price and issue the offer". Card "Calculation" price table:
  - route text, km, mode, lead time, chargeable pallets
  - freight (discount), fuel surcharge, ADR surcharge, hub handling, express, net, VAT 16 %, insurance premium, total
  - EUR/USD equivalent line
  - optional offer sheet card
- **Contracts:** table (id + template, customer, kind framework/spot with discount and diesel base, validity, status Draft / Sent / Signed / Void, SHA-256 prefix, signature info). Actions: Send for signature, "Sign for the customer (demo e-sign)", Void, Text. Card "Generate a contract from a template": customer, template FW-RU v3 / SPOT-RU v2, discount, diesel base, from/to → Create draft. Card "Contract text" with the full text and SHA-256 (signature verified).
- **CRM:** **Kanban pipeline** with 5 columns (New, Contacted, Quoted, Won, Lost). Lead cards show company, source, route, pallets, zone, tender no. + deadline (expired chip), BIN chip, message, loss reason, "customer created" chip, stage buttons ("Won → customer" onboards a customer and adds a task) and "+ task". Card "New lead / tender": company, source (phone / e-mail / referral / tender / website / manual), contact, BIN, tender no. + deadline (tender only), from→to, zone / pallets → Create lead; link "Open the public request form". Card "Partner self-registration – GDP check" (FR-172): pending qualifications with Approve GDP / Reject.
- **Tasks:** task list (title, lead / customer, owner, due chip, overdue chip, Done). Card "New task": what, due, customer → Create.
- **FX rates:** card "NBK rates (KZT per unit)" with the current / stale note and a rates table (date, EUR, USD, source). Card "Manual rate (finance)": date, EUR, USD → Save rate, plus an example 150 000 ₸ in € / $ (FR-152).

---

## 3. Dispatch Board (`dispatch`)

Screen `screens/030-dispatch.js`.

- **Subtitle:** "Drag a card to the next column or open it to assign".
- **Header actions:**
  - Auto-Assign (`auto`): priority + ETA order, smallest fitting truck, toast with ok / fail counts
  - Create New Load

### Tab `board` — "Board" (`030`)
- **Filters:** Priority, Driver status (Available / On trip / Resting), Hub, Clear All.
- **Kanban board** with 6 columns (Unassigned, Assigned, Loading, In Transit, Delivered, Problem) and counts.
- Cards: id, priority chip, route, zone chip, temperature chip (in transit / problem), ETA, pallets, problem banner "Temperature out of range", driver avatar + first name + plate or "unassigned", rate.
- **HTML5 drag & drop:** columns highlight green or red against `canMove`. Dropping an unassigned card on "Assigned" auto-picks the best eligible driver + truck, or opens the drawer with an error.
- Clicking a card opens the load drawer (see Orders, including the Go/No-Go and replanning sections from `240`).

### Tab `planning` — "Planning" (`030`, extended by `240`) — FR-38, 119, 156; LH-N1
- **Table "Demand vs capacity by temperature zone":** zone, loads, pallets, places, **utilisation progress bar** (crit ≥ 90 / warn ≥ 80 / low < 50), %.
- **Table "Drivers and driving time (RTO)":** driver, status chip, remaining hours with a coloured dot.
- **Card "Fleet capacity · 7 days"** (from `240`):
  - Note on the data basis
  - **Scenario toggles:** "Blizzard in the west" (days 2–3, −2 trucks, storm warning KAR/AST, which also feeds the Go/No-Go weather control); "Repair of 123 ABC 01" (days 0–3, −1 reefer); "Peak +30 %"
  - Toggle "Target fleet: 4 trucks 10 t" (HOWO ×2 + JAC ×2)
  - **7-day grid** (diagram-like table): day header with weekday / date and holiday or transfer name, weekend marker. Rows: Demand pallets, Trucks available, Drivers, Capacity pallets, Utilisation % (ok / warn / crit cells), and "Current fleet" comparison when the target fleet is on
  - Simulation verdict (target fleet covers / does not cover n of 7 days)
  - "System recommendations": per deficit day, hand to a partner or shift to the next working day
  - "KZ working-day calendar" (FR-156): next 5 holidays / transfers and an example 3-working-day deadline

### Tab `partners` — "Partners" (`160-partners.js`)
- **4 KPI tiles:** Partners, Gold, Blocked, Handovers.
- **Filters:** Type (Logistics / Workshop), Tier (Gold / Silver / Bronze / Blocked), search.
- **Partner register table:**
  - partner · city (with block reason)
  - type
  - tier chip
  - services
  - capacity (pal./day or bays)
  - 2–8 °C flag
  - GDP flag
  - SLA (response hours · %)
  - contract until — links: Renew (2026 contracts), "Open Quality · DEV/CAPA id", Unblock (once the CAPA is closed)
- **Card "Hand a load over to a partner":** open load select, partner select (blocked disabled), "Request handover" (checks cold / GDP fit), error line; handover rows HO-xxx · load · partner · status with Approve. Approving assigns the load to the partner (`p:` placeholders).
- **Card "Workshop request":** truck select, workshop select → "Create request"; rows WR-xxx with an amount input and Close. Closing books a service cost into Billing → Costs.

### Tab `express` — "Waybills & express" (`240-ops-dispatch.js`; perm `trips:read`; badge = pending express) — FR-41/126/154, FR-114
- **Table "Waybills · n"** (note: issued only after the pre-trip medical, mandatory from 01.01.2027):
  - columns: load, № PL-xxxxxx, driver / truck, medical chip (passed / missing), waybill status chip, load status
  - actions: Issue (disabled until medical), Sign (waybill e-sign drawer), "Med. check"
- **Card "Express · approval by three functions"** (shows the current role's functions):
  - **4 KPIs:** express share (loads), target 10 %, awaiting approval, trend −12 mo → −6 mo → now
  - Rule note: 3 signatures (CEO, analytics, procurement/logistics) before the cut-off; a rejection or expiry turns it into a regular trip; +35 % surcharge
  - Open request rows: id; route · customer · pallets · kg · zone · wanted-by; cut-off (passed); "3 functions notified"; signature slots ✓ / ✗ / ● (mine) / ○ with signer and time; n / 3 chip; per-function "Sign · <fn>" and Reject; "Simulate: deadline reached"
  - History rows: approved → load / expired → regular load / rejected → regular load, with a log

---

## 4. Fleet (`fleet`)

Screen `screens/040-fleet.js`, made tabbed by `310`.

- **Subtitle:** "Reefer fleet: status, temperature, documents and maintenance".
- **Header actions:**
  - Import Fleet Data — toast
  - Schedule Maintenance — opens the truck drawer of the best candidate
  - Add Vehicle — drawer `addTruck`; in `310` this also opens an onboarding checklist

### Tab `fleet` — "Fleet" (`040`)
- **5 KPI tiles:** Total vehicles, Available, In use, Maintenance / alarms, GDP compliance % (calibration + insurance).
- **Filters:** Type (Reefer / Van / Tent), Status (Available / In use / Maintenance / Critical), Hub, Health (Good / Watch / Critical), Clear All.
- **Table:**
  - vehicle / plate + make
  - type + zones
  - status chip
  - assigned driver + load status
  - location (city or route "en route")
  - set / actual °C
  - last GPS ping
  - health dot (pulsing when red)
  - kebab
- Note: expired calibration blocks pharma loads (GDP).
- **Drawer `truck` ("Vehicle Details"):**
  - Identity + status chip
  - Type, year, mileage, pallet places, zones, reefer unit + hours
  - Current assignment: driver, code, licence class, load link, temperature; location, last ping
  - "Documents & compliance": sensor calibration, technical inspection, MTPL, cargo insurance — each with a date and Valid / Renew soon / Expired chip
  - "Maintenance Schedule": last service date / km, next km, "Due soon" chip, remaining km
  - Actions: "Return to service" (in service) or "Schedule maintenance" (available); a note when on a trip
- **Drawer `addTruck` ("New Vehicle"):** plate (format `123 ABC 01`, unique), make/model, pallet places 1–40, hub, temperature-zone checkboxes → Add vehicle.

### Tab `registry` — "Registry" (`310-fleet-registry.js`; badge = onboarding open + requested services) — LH-J1, FR-27/50/118/141/157/158
- **4 KPI tiles:** Vehicles in the register, Onboarding open, Open service requests, Warranty < 6 months.
- **Filters:**
  - Hub, Status (incl. "Onboarding open"), Zone
  - View select (Standard / "Documents & deadlines" / "Planning" / saved views ★)
  - Columns (n/16) chooser
  - View name + Save view, Delete view
  - CSV ↓ (formula-safe export)
  - Clear
- **Column chooser panel:** 16 columns — plate, type, pallets, zones, hub, status, service, calibration until, inspection until, OGPO until, cargo insurance until, warranty months, load profile, tachograph, mileage, reefer unit (FR-158).
- **Configurable register table.** Clicking a row opens drawer `regTruck`.
- Note: "Slot capacity per hub" chips per hub.
- **Card "Service requests":** rows SR-xxxx · plate · kind · text · partner · ETA · cost, status chip, next-status buttons (requested → accepted / cancelled; accepted → in progress / cancelled; in progress → done). Done books a cost, resets service and renews calibration.
- **Card "Warranty-exhaustion forecast":** trucks sorted by months to limit (chip), km / limit, annual mileage, by mileage or by date; FR-50 formula note.
- **Drawer `regTruck`** (xl, "Register: vehicle"):
  - Identity + register status; hub, mileage, tachograph, hub slot capacity
  - **"Commissioning checklist (FR-157)":** 6 items — STS, compulsory insurance (automatic), logger/calibration (automatic), tachograph, ADR, load profile calibrated (automatic). Each shows ✓ or a confirm input + "Confirm"; "Close onboarding — release for planning" when complete
  - **"Load profile — vehicle calibration (FR-141)":** source (STS / weighing / catalogue), date, document / weighing ticket, 9 numeric fields (empty mass front / rear, gross, front / rear axle limit, wheelbase, front axle → front wall, internal length, l/100 km); live axle shares from geometry (lever rule); error line; Save profile
  - "Warranty (FR-50)": limit km / date, months to exhaustion chip
  - "Service requests (FR-27 / FR-118)": this truck's requests; if none open, a form with kind (scheduled service / repair / reefer unit / tyres / sensor calibration / post-trip defect), service partner, ETA hours, cost ₸, description → "Create request"; note on the availability effect

---

## 5. Drivers (`drivers`)

Screen `screens/050-drivers.js`, made tabbed by `320`.

- **Subtitle:** "Who is available, whose driving time is running out, whose documents expire".
- **Header actions:**
  - Import Drivers — toast
  - Compliance Report — CSV download `driver-compliance.csv` plus a toast with expired / soon counts
  - Add New Driver — drawer `addDriver`

### Tab `drivers` — "Drivers" (`050`)
- **4 KPI tiles:** Total active drivers, Available now, RTO / document alerts, Average rating.
- **Filters:** Status, RTO risk (OK / Approaching / Violation-rest), Hub, Rating (≥ 4.8 / ≥ 4.5), Clear Filters.
- **Table:** driver (code, licence class, years of experience), status chip, RTO dot, star rating, last trip (route + in progress / completed), location, documents chip (expired n / soon n / OK).
- **Drawer `driver` ("Driver Profile"):**
  - Avatar, name, code, experience, status
  - Phone, licence class, rating, hub
  - "Compliance & Documents": driving licence, medical certificate, GDP training — each dated with a chip; note that an expired licence / medical blocks assignment
  - "Driving & rest time (RTO)": drive time remaining, on duty, weekly remaining; limits note (9 h shift / 56 h week)
  - Last trip link
  - Actions: "Send to rest" or "Back to available"
- **Drawer `addDriver` ("New Driver"):** full name (first + last), class C / CE, experience years, hub → Add driver.

### Tab `staff` — "Staff" (`320-staff.js`; badge = new/disputed fines + drivers at level 3) — LH-J2, FR-08/10/46/55/114/120/122/123
- **5 KPI tiles:** Available now, On trip, Absent today, Driving-time warnings, Medical today n / total.
- **Card "Pre-trip medical check (FR-114)":** mandatory / warning note, toggle "Regime from 01.01.2027: ON/OFF" (`stMedTog`, audited).
- **Staff table:**
  - driver (code, class, licence until)
  - status · where now
  - driving block / day / week, each with a progress bar against 4.5 / 9 / 56 h and a level chip
  - medical today chip (fit + time / unfit / no record) with ✓ / ✗ buttons
  - ADR until with ≤ 60 d / ≤ 30 d / expired chip and "Book course" or the booked date
  - tachograph
  - year hours + remaining of 1 814
  - Profile button (opens the driver drawer)
- **Card "Urgent trip · who can go (FR-120)":** filters hub, zone, toggle "ADR needed"; top 5 drivers and top 5 trucks with "can go" or reasons; "Best pair: driver + truck" → "Assign to <first unassigned load from the hub>", or a red note suggesting a partner.
- **Card "Absences":** list (driver · type · dates · note, ×); form with driver, type (vacation / sick / training / day off / onboarding / handover / medical board), from, to → "Add absence" (overlap check).
- **Table "Staff plan · 14 days · 7 drivers on 4 line trucks (FR-46)"** (diagram-like calendar): per driver per day a chip — T trip with truck plate, D duty/reserve, · off, M Sunday maintenance, or absence codes; Σ trips; footer row "trucks on trips / day"; legend.
- **Table "Fines · attribution at the time of the violation and recovery (FR-122 / FR-123)":**
  - header chip with open count and sum; "Import fines" button
  - columns: № + time, truck + place, article, amount, driver at the time (via waybill, or a manual select + OK), status chip + note, next-status buttons (notified → accepted / disputed → deducted / dismissed / paid by company)
  - process note

### Tab `app` — "Driver app" (`330-driver-app.js`, admin preview of the role-shell screen) — LH-K1/K2, FR-52…67, 83, 107, 108, 109

Two-column layout: the phone frame, and a side panel.

**Side panel (admin view):**
- Card with a "Driver (signed in)" select (each driver with their load or "no trip") and an FR-83 note.
- Card "Feedback to dispatch · n": explanation, queued events (yellow), event feed (time, module, text, received / synced / SMS chip).

**Phone frame:**
- **Status bar:** clock; network button "4G ●" / "no network" / "SMS" (`daNet` toggles offline and syncs the queue on reconnect); own language switch KK / RU / DE / EN.
- **Head:** driver · plate; load id · route; status / zone / temperature chips.
- **Offline banner:** offline minutes + queue length, or SMS mode (> 30 min) with the last SMS messages (OL1 format); "Simulation: +15 min offline".
- **Bottom tab bar (6 tabs):**
  - **Shift:**
    - Pre-trip medical card: fit / unfit, or buttons "Passed: fit" / "Unfit"
    - Pre-trip checklist n/7 (tyres; lights/brakes/mirrors; reefer set-point; logger & sensors — automatically bad if calibration expired, with a "request calibration" link that creates a service request; seal & doors; documents; extinguisher/kit), each with OK / Defect. A red item blocks the waybill, and defects go to Fleet
    - Electronic waybill: odometer + fuel inputs, "Sign the waybill" (needs medical + checklist), or "✓ PL-… signed · odometer"
    - Trip document pack: TTN, SNT, Waybill, ESF, and ADR dry ice UN 1845 for frozen loads, each ready / pending / missing
  - **Route:**
    - Driving-time card: block / 4.5 h, today / 9 h, to break; warning text; "45 min break"
    - Main buttons "Start loading" / "Depart" (`daDepart` checks driver blocks and the release)
    - Route points: load hub, via cities, unloading hub — each with status chip, km, window, ETA (outside-window flag), weather note, KazAvtoZhol drift warning at Karaganda; buttons "Arrived at the stop" / "Continue"
    - Dead-zone coverage banner (from `340`)
  - **Stop (ePOD flow):** 5-step progress (Arrival, Thermochron, SSCC scan, Photo, Signature):
    - Step 0: Start unloading
    - Step 1: min / max °C → Record thermochron (an out-of-range reading opens a quality deviation and a thermochron log entry)
    - Step 2: scan up to 8 places with SSCC, a "missing" exception per place, "Scan all (demo)", "Places reconciled"
    - Step 3: Take photo (SHA-256)
    - Step 4: consignee name, role, **signature canvas** (pointer drawing, Clear) → "Sign and complete the delivery" (sets the load delivered, POD submitted, all POD docs)
    - "Exceptions" card: Damage / Shortage / Refusal (each opens a deviation)
    - ePOD summary card after completion: time, coordinates, temperature report, signer, photo, order / POD status
  - **Returns:** items thermo boxes (empty), pallets & packaging, claim (only after an exception), hub transfer — each "Accept (scan)"; backhaul kg note (FR-60).
  - **Fuel:** litres, price ₸/l, odometer, receipt photo → "Record refuelling" (books a fuel cost; consumption vs plan l/100 km); list of fills on this trip with above-plan / on-plan.
  - **Me:**
    - Dispatcher messages with "Confirm read"; fine notices with "Agree to deduction" / "Dispute"
    - Incidents grid (Breakdown, Accident, Delay +60 min, Road closed, Door outside stop) and a SOS button. These open incidents in Security; breakdown creates a service request and shows a service contact; delay moves ETA +60
    - Profile: licence, medical, ADR, GDP dates; monthly earnings estimate formula
    - End of shift: odometer, defect toggles (first 4 checklist items), "End shift" (hours → staff, defects → service request)

---

## 6. Routes & Tracking (`routes`)

Screen `screens/060-routes.js`.

- **Subtitle:** "Where every truck is now and which loads are off schedule or off temperature".
- **Header actions:**
  - Export Data — toast
  - Route Optimization — toast recommending the nearest cold hub for off-plan loads

### Tab `map` — "Map" (`060`) — MAP / DASHBOARD
- **4 KPI tiles:** Active routes, On time & in range %, Critical deviations, Fleet status busy / active.
- **Filters:** Route status (On time / At risk / Critical), Driver, Clear Filters.
- **Full-width KZ map** (`KZMAP`): coverage-coloured roads, active-load paths (selected one highlighted), truck markers by route state with plate and temperature, coverage legend, zoom + / − (1–3×).
- **Live routes table:** load, route, driver / truck, **progress bar** + %, temperature chip, status chip.
- **Drawer `route` ("Route Details"):**
  - Identity + status
  - Origin, destination, distance, temperature
  - "ETA & Progress": arrival, km done / total, progress bar, last GPS
  - "Stop Progress" timeline
  - "Temperature (6 h)" **sparkline chart** + excursion minutes
  - "Recent Events": departed hub, on highway, last 2 notes
  - "Performance Metrics": temperature compliance %, door-open events, speed compliance, idle min

### Tab `temp` — "Temperature" (`150-monitor.js`)
- **4 KPI tiles:** Monitored, In range, Near limit, Out of range.
- **Grid of cards** per loading / in-transit / problem load: plate, temperature chip, id + route, **sparkline**, zone chip, set-point, door open/closed. Clicking opens the load or route drawer.
- **Card "Alarm simulation":** load select; buttons Freeze, Overheat, Door open, Reset. These set the load to Problem, open a quality deviation and write the audit log; Reset restores the temperature.
- **Card "Cold-chain alarm rules":** 8 rules with L1–L3 chips — freezing risk, overheating, low temperature, heat risk, heating failure, cold-chain breach (door > 3 min), winter mode, monitoring failure (> 10 min).

### Tab `wx` — "Weather & risks" (`150`) — LH W1
- **Table "Forecast by hub · colour = trip risk":** 5 hubs × 7 days; cells show max/min °C, snow/clear, wind m/s, background coloured by risk (heat-map). Note: demo forecast; production uses Kazhydromet + global model + closures.
- **Card "Weather risk by load":** active loads sorted by worst risk over the next 3 days, Normal / Watch / High / Critical chip and a recommendation (delay departure or detour / monitor heating).
- **Card "Road closures · KazAvtoZhol":** RC-1 Astana–Karaganda km 112–140, RC-2 Almaty–Shymkent pass, with affected-loads chip and "Lift early" (needs `trips:status`, audited). Lifted closures are struck through with "lifted early · by · time".
- "Weather alert thresholds" list: winter risk < −10, severe < −25, blizzard wind ≥ 20 m/s with snow, heat > +40, critical > +50.

### Tab `sec` — "Security" (`150`)
- **4 KPI tiles:** Open incidents, Geofence events, Drivers with document alerts, Active seals.
- **Card "Incident simulation":** load select; Fire, Breakdown, Theft, Reset. Each opens an incident with a numbered response playbook. Fire and theft set the load to Problem; breakdown flags the truck red. Audited.
- **Card "Incidents":** "Test panic button"; incident rows (type, text, id · time, status Open / Accepted / Escalated / Closed, playbook list) with Accept / Escalate / Close. Seeded with a route deviation, an unplanned stop and driver-document incidents.
- **Card "Geofences · events"** (entered / left geofence per plate), plus "Audit trail" (audit table).
- **Table "Drivers · working time and permits":** driver, driving h / shift limit, week h, GDP chip.
- **Table "Doors, seals, route":** truck, door open/closed, seal number, route on plan / deviation.

### Tab `coverage` — "Coverage" (`340-coverage.js`; badge = loads at L2+) — FR-109/110/111
- **4 KPI tiles:** Segments in the model, Without mobile data km, Vehicles without contact > 30 min, Zone proposals.
- **Card "Communications model per segment (FR-111)":** schematic SVG map (hubs, segment lines coloured 4G/3G, 2G-SMS or no network; dashed = estimate, solid = measured; live truck markers red at L2+) and a legend.
- **Segment table:** segment (+ part), km, class chip, source (telematics / estimate), gap count with minutes, "+ gap" button.
- **Card "Dead zones from telematics gaps":** rule note; proposal rows (segment, passes, average min → proposed class) with Accept (becomes measured) / Reject.
- **Table "Last contact and stepwise escalation (FR-109)":** "+15 min" / "+30 min" ticks; columns load · truck · zone, no data min, zone / window note, level chip L0–L3 + reason, simulation buttons (in zone 40 / outside 50 / 75 / 0). L2+ opens a "Contact lost" incident. Rule note.
- **Card "Dispatcher SMS to driver: delivery status and timeout (FR-110)":** load select, instruction select (stop and confirm / check temperature / detour road closed), Send SMS, +5 / +10 min; SMS rows with status sent / delivered / acknowledged / no acknowledgement, try count, timeout 10 min, "Driver replies" / "Resend".

### Tab `lines` — "Lines & tariffs" (`350-lines.js`) — FR-96/97/118/155
- **4 KPI tiles:** Lines, Departures in 14 days, Cancelled by exceptions, Lines with reduced capacity (service).
- **Table "Line schedule and vehicles per line":** 7 lines LN-1…LN-7 (incl. AST↔ATY West). Columns: line + zones, weekdays + departure time, cut-off h, transit days, vehicle checkboxes (⚠ in service) + "add truck" select, capacity per departure chip.
- **Table "Departures for 14 days and exceptions":** date + weekday, line + time, booked / capacity chip or "cancelled", cancel / restore buttons.
- **Card "Tariffs, ₸ per pallet":** editable matrix of 8 pairs × 4 zones (audited); note that the portal price comes from here.
- **Card "Routing via hubs: there is never 'no line'":** From / To (hubs + 12 non-hub places) and Zone selects; leg list (pickup by collection run / line LN-x + departure / consolidated run / delivery), days and ₸ per pallet each; total working days and price; "via the main hub".

### Tab `thermochron` — "Thermochrons & loggers" (`360-thermo-ext.js`; badge = thermochrons with excursion) — FR-39/40/58
- **4 KPI tiles:** Thermochrons logged, With excursion, Loggers with calibration due/expired, Containers with a remark.
- **Table "Thermochrons at receipt — log":** id + time, load, logger, mini **curve SVG** (green / red), min … max, result (in range / excursion → DEV), source + who.
- Import form: load select, min, max → Import. An excursion opens a deviation.
- **Table "Logger register":** logger id + plate / container, chambers, calibration chip.
- **Card "Passive cold chain: containers (FR-39)":** PB-01…03 with mode zone, refrigerant, location, logger, days in circulation, remark (no logger / > 2 days); "Turn: back to hub".

---

## 7. Warehouses & Hubs (`hubs`)

Screen `screens/070-hubs.js`.

- **Subtitle:** "Utilization by temperature zone, ramps, reefer queue and goods receipt".
- **Header actions:** Settings and Add New Warehouse — both toasts pointing to phase 6.

### Tab `hubs` — "Warehouses" (`070`) — DASHBOARD
- **4 KPI tiles:** Active hubs, Average utilization, Critical alerts, Today's pallets (done / plan).
- **Filters:** Hub, Status (Active / Critical / Maintenance), Capacity (≥ 80 / 50–80 / < 50 %), Clear Filters.
- **View segment control:** Cards | Map.
- **Hub cards:**
  - name + status chip, address
  - "Zone utilization" % with a **stacked zone bar** and a progress bar
  - mini tiles Inbound / Outbound / On-hand places
  - docks available / blocked, yard queue
  - today's receiving count, temperature alarm chip
- **Map view:** schematic SVG with hub circles sized and coloured by utilisation %.
- **Drawer `hub` ("Warehouse Details", 4 sub-tabs):**
  - **Overview:** utilisation, places total, dock doors, status; "Inventory by temperature zone" bars per zone; buttons "Open hub receiving" (switches to the Receiving tab filtered to the hub) and "Set to maintenance" / "Back to active".
  - **Docks:** "Dock schedule (receiving)" grid (time slots 08–18 × ramps, with zone chips; booked jobs are clickable and marked ❄ when cold, blocked ✕); "Dock status" rows with Block / Open.
  - **Yard queue:** "Reefer queue" rows (plate, job, zone, waiting minutes; red when cold cargo waits over 30 min).
  - **Loads:** linked non-delivered loads with status.

### Tab `recv` — "Receiving" (`080-receiving.js`; badge = jobs at gate not finished) — legacy screen 17
- **4 KPI tiles:** At gate, Unloaded, Demurrage (Standgeld) accrued, Booked to costs.
- **Filters:** Hub, Status (Ordered / Planned / At gate / Unloaded), Flag (GDP / ADR / QA hold / Slot), search.
- Hub clock with "+15 min", CSV export (`receiving.csv`), "Save view"; saved-view chips (apply / ×).
- **Table:**
  - order + hub
  - carrier / vehicle
  - senders (numbered chips)
  - ramp / zone
  - window (late flag)
  - status chip
  - dwell min (+over min · amount ₸, or "free 45")
  - flag chips
- **Drawer `job`:**
  - Identity + status; hub, zone, window, pallets, dock, load link; senders
  - "Process" timeline: gate check-in → dock assigned → unloading started → unloading finished
  - "QA hold" banner with "QA release"
  - "Gate cold-chain check" (cold cargo): cargo temperature input, range chip, "Temperature logger attached" checkbox, Record; in range / out of range chip; out of range blocks unloading
  - Step actions: Plan the window; Gate check-in; dock select + "Assign dock" (or "no free dock for zone"); Start unloading (blocked by QA hold, temperature or logger); Finish unloading (adds pallets to hub stock; an in-transit load becomes delivered)
  - "Delay caused by the hub?" Yes / No with a reason select (ramp occupied / staff shortage / SSCC mismatch / temperature-logger)
  - "Standgeld": free time, dwell, over, rate per step, amount = blocks × rate; "Book to costs" (only after unloading, hub-caused, amount > 0)
  - "Audit log"
- **Hook:** a load that departs creates the inbound job at its destination hub.

---

## 8. Proof of Delivery (`pod`)

Screen `screens/090-pod.js`.

- **Subtitle:** "Queue of delivered loads pending POD submission or approval".
- **Header actions:** Export Report (toast), Bulk Upload (toast).

### Tab `queue` — "POD queue" (`090`)
- **4 KPI tiles:** Pending upload, Submitted, Approved, Rejected.
- **Inner segment control** with counts: All loads, Pending, Submitted, Approved, Rejected.
- **Filters:** search by load / customer, Driver, Clear Filters.
- **Table:**
  - load id + "delivered n h/d ago"
  - customer + destination
  - delivery time
  - driver
  - POD status chip + temperature deviation chip + 4-step progress dots (docs / review / approved / e-signature) + for approved: "Ready for ESF" or the ESF chip
  - actions: Upload / View + Approve / Open / Re-upload
- Pending rows also get a drop-zone row "Upload POD documents (image/PDF)".
- **Drawer `pod`:**
  - Customer identity, status chip; delivered, address, driver, zone, temperature excursion, e-signature
  - Rejection reason
  - "POD Documents" slots: waybill, handover act, cargo photo, temperature log (cold only) — each uploaded ✓ or a File input
  - Links "Open load", "Temperature log"
  - Excursion acceptance block (submitted + excursion): "Accept deviation" checkbox + QA comment (required, GDP record)
  - Reject reason input
  - Actions:
    - Pending / rejected: "Attach all (demo)", "Submit for review" (all documents required)
    - Submitted: Approve (creates an invoice), Reject
    - Approved: "Request e-signature / SMS", "Open invoice INV-…"

### Tab `quality` — "Deviations & quality" (`140-quality.js`; badge = open deviations) — legacy screen 08
- **4 KPI tiles:** Open deviations, Closed, Calibration attention, In quarantine.
- **Card "Deviations":** list sorted open-first by level (Critical / Major / Minor). Seeded: DEV-0011 (partner PL-10 batch lost) and CAPA-0019 (PW-08 repair), plus automatic DEV-xxxx for problem loads (status hook).
- **Detail card:** title, id, text, load link; **7-step workflow timeline** (alarm recorded → dispatcher checked → security checked → QA decision → goods released/blocked → customer notified → CAPA issued); "Complete step: <next>", or at step 4 "Release goods" / "Block (quarantine)" (sets the load's QA state); CAPA text; "Deviation closed, report ready".
- **Card "Logger & sensor calibration registry":** trucks with a reefer unit: plate, unit, calibrated until, certificate on file, chip, "Calibrate" (renews to 18.10.2027, audited).

---

## 9. Billing & Invoices (`billing`)

Screen `screens/100-billing.js`.

- **Subtitle:** "Receivables, ESF, disputes and costs (incl. Standgeld from receiving)".
- **Header actions:**
  - Export Data — `invoices.csv`
  - Create Invoice — drawer `newInv`

### Tab `inv` — "Invoices" (`100`; badge = invoice count)
- **Summary strip:** Total outstanding; Paid / Pending / Overdue chips with sums.
- **Filters:** Status (Pending / Paid / Overdue), Customer, date from / to, Aging (Current / 1–30 / 31–60 / 61–90 / 90+), Clear.
- **Table:** invoice # + created, customer + route, amount + terms, due date + relative (paid on / days overdue / days remaining), status chip + dispute chip + ESF chip (none / issued / confirmed / rejected), kebab; pager.
- **Drawer `inv`:**
  - Identity + status; issue date, due, amount, ESF
  - "Line items": freight, reefer surcharge 18 % (cold), fuel surcharge 10 %; subtotal, VAT 12 %, total
  - "Customer billing profile": BIN, terms, IBAN, credit limit
  - "Payment history" (paid / overdue / awaiting)
  - "Disputes": open / closed card with the temperature-claim chip, text, load temperature-log link, "Resolve dispute"; or a form with reason (temperature claim / rate mismatch / other) + description → "Open dispute"
  - Action bar: Issue ESF / Re-issue ESF; Confirmed (IS ESF) / Rejected; "Send (ESF + e-mail)"; "Register payment". An open dispute blocks sending, ESF and payment
- **Drawer `newInv` ("New Invoice"):** approved PODs without an invoice, each with Create; or a note that invoices are created automatically on POD approval.

### Tab `cost` — "Costs" (`100`; badge = cost count)
- **4 KPI tiles:** Total costs, Revenue (net of VAT), Margin %, Detention / Standgeld.
- **Filters:** Category (Fuel / Service / Detention-Standgeld / Insurance / Taxes / Other), Hub, Clear, "Add cost".
- **Cost table:** date, category chip, hub, description (+ "from receiving <job>"; receiving rows open the job drawer), amount, delete × (manual rows only).
- **Drawer `cost` ("New Cost"):** category, hub, description, amount ₸, date → Add.
- Other modules write into this register: receiving Standgeld, workshop closures (Partners tab), service requests done, fuel from the driver app, fines (company payments / deductions), external-carrier orders from the cost model.

### Tab `insurance` — "Insurance" (`430-rec-insurance.js`; badge = open claims) — LH-M5, FR-28/153
- **4 KPI tiles:** Certificates (insured shipments), Open claims, Submitted ₸, Settled ₸.
- **Card "Insurer and open cover"** (chip "planning value (fictitious)"): insurer, policy GP-2026-0001 (SAMPLE), premium rate 0.15 % min 3 000, maximum per shipment, deductible 0.5 %, claim deadline 30 days; note.
- **Table "Certificates per shipment":** cert no., customer, shipment + route, value, premium. Clicking opens the booking drawer certificate view.
- **Filter:** status; "Open claim" (needs `quality:write`).
- **Claims table:** claim + created, deviation / load, booking, amount, deadline (+ overdue), status (Open / Submitted / Settled / Rejected).
- **Drawer `claim`:** chips; load, booking, claim amount, declared value, deadline; note; step dots; history; step note (≥ 3 characters) + "Submit to insurer" / "Settled" / "Rejected by the insurer".
- **Drawer `claimNew`:** deviation select (DEV-…), insured booking select, amount (≤ declared value), description (≥ 10 characters, no personal data) → Open claim.

### Tab `model` — "Cost model" (`600-eco-costmodel.js`; perm `costs:read`; badge = > 50 % decisions awaiting signatures) — LH-N2, FR-47/85/125 — DASHBOARD
- Intro note about the target fleet: 4 vehicles (V01 HOWO reefer on R1, V02–V04 isotherm), 7 drivers, rings R1 / West / South / North + East.
- **6 KPI tiles:**
  - Running cost / month (variable · fixed)
  - vs outsourcing % (today 24.2 M/month)
  - Cost per km
  - Tariff cost + 5 % ₸/kg vs LTL 228
  - Diesel share %
  - Approvals > 50 %
- **Segment control:** Summary | Diesel & service | Insurance, tax, registration | Own or external. Button "Model CSV" (`cost-model.csv`).
- **Summary:**
  - Table "Running costs by item · bottom-up model": group variable / fixed, item + basis, question ref (I38, J46 …), ₸/month, per year, share % with bar, source chip (Fragenkatalog / assumption); total row with ₸/km and ₸/kg. 19 items: diesel, service/repair/tyres, driver mileage pay, per diem, dry ice, tolls, medical checks, wash (GDP), outsourcing Zhezkazgan, leasing, driver salaries, employer taxes 17.5 %, admin, insurance, vehicle tax, inspection, IT, thermo containers, ADR training
  - Card "Plan / actual by category · actuals register": category, plan / month, actual from `S.costs`, deviation chip (> 5 % yellow, > 15 % red)
  - Card "Cost + 5 % and transfer prices (FR-47)": per ring kg/month, cost ₸/kg, transfer price, vs LTL chip; network total row
- **Diesel & service:**
  - Segment diesel price 340 / 400 / 450 ₸/l (makes existing signatures stale); checkbox "Winter consumption +10 % (I38)"
  - Vehicle table: id + model + body, km/month, plan l/100, actual l/100, deviation chip, litres · t CO₂, diesel / month (₸/km), service / month, service downtime days + availability (КТГ) chip + downtime-day cost
  - Note
- **Insurance, tax, registration:** per vehicle comprehensive (KASKO), OGPO, tax, inspection, total / year, due date chip; card "Registration rule for idle vehicles" and rate notes.
- **Own or external:**
  - Note: FR-85 two signatures over 50 % gap, stale on diesel change, external → XO-n order + cost (FR-125)
  - Table of 7 candidates OW-1…OW-7: shipment, load kg / km / days, own cost, external cost + basis, cheaper + gap %, decision state (executed · own / external XO-n; approved 2/2; > 50 % · 2 signatures n/2; ≤ 50 % · dispatcher decides; stale chip)
  - Signature buttons "Head of logistics" / "Financial controller" (role-function gated, four-eyes)
  - Execute buttons "Own vehicle" / "External"

---

## 10. Reports (`reports`)

Screen `screens/110-reports.js`.

- **Subtitle:** "Performance, cold chain and finance".
- **Header actions:**
  - Bulk Export — `reports-all.json`
  - Custom Report — drawer `repCustom`

### Tab `cards` — "Cards" (`110`, converted by `610`) — DASHBOARD / CHARTS
- **Sticky filters:** date from / to, Hub, Types (zones), Clear Filters.
- **Section "Operational Reports"** — 3 cards:
  1. **OTIF by hub** — **area chart** of 5 weeks; KPIs: current rate, vs last week, total deliveries
  2. **Temperature excursions by lane** — **bar chart** of the top 5 lanes; KPIs: excursions, average duration, most affected
  3. **Driver & vehicle performance** — **line chart** of rating over 4 weeks; KPIs: average rating, completion rate, active drivers
- **Section "Financial Reports"** — 3 cards:
  4. **Revenue** — **area chart** of 6 months; KPIs: total net revenue, growth, invoices
  5. **Margin analysis** — **stacked bar chart** of 3 months, net margin + other; KPIs: gross margin, net margin, vs last quarter
  6. **Accessorials** — **bar chart** of reefer / fuel / Standgeld; KPIs: total revenue, % of revenue, total charges
- Each card: period chip, chart with hover tooltips, exactly 3 KPIs, PDF button (toast: server-side), CSV button, "View Details", "Toggle AI Summary" (inline sentence).
- **Drawer `rep`** (xl, "<title> – Detailed View"): PDF / Excel buttons; **wide chart** 720×220 with tooltips; 4 KPIs (3 + an extra); "Detailed Data" table (8 rows: loads or invoices with status chips); "Raw Data Export": Export PDF, Export Excel (CSV), Export JSON, and for operational cards "GDP temperature log (CSV)".
- **Drawer `repCustom` ("Custom Report"):** checkboxes for the 6 cards → CSV / JSON combined export.

### Tab `kpi` — "KPI" (`610-eco-reports.js`) — LH-O1, FR-38/119 — DASHBOARD
- **4 KPI tiles:** OTIF (deliveries), Load factor (pallet places of assigned trucks), Express share by weight (and % of budget), Cost per kg (model ₸/kg).
- **KPI trend table:** OTIF, Load factor, Express share, Cost per kg × weeks −4…now (current in bold) + target/note (SLA ≥ 95 %, ≥ 80 %, < 10 % budget (T148), LTL 228 ₸).
- Buttons "Export KPI (CSV)" and JSON; note that history is demo data.

### Tab `cross` — "Express × temperature" (`610`; badge = express loads not moved) — idea I-12
- Note: express 1 440 ₸/kg vs LTL 228 ₸/kg; moving delivers 78 % of savings (G29).
- **4 KPI tiles:** Express in budget %, Cold-chain express %, Shift potential ₸ (% of budget), Moved to regular (saving).
- **Table per zone:** loads, express n · kg, regular n · kg, express cost, regular cost, saving if moved; total row.
- **Card "Express loads · decision":** per express load (customer, route, zone, kg, express vs regular cost) with "Move to regular cycle" / "Back to express" (audited); CSV / JSON.

### Tab `fines` — "Fines" (`610`; perm `costs:read`; badge = unpaid or unattributed) — FR-07/122/123/125
- **Filters bar:** "Import notices ('Sergek', eGov)" (one demo notice FN-1024; disabled when done), daily schedule note, Period input, "Payroll export" (CSV + payroll sheet #), CSV.
- **Notices table:** notice + date / time, vehicle + place, offence type + source (Sergek camera / mobile unit / weigh station / eGov auto-import), driver (or "Driver not identified" chip, "manual"), amount + 50 % discount deadline, status chip (+ payroll #).
- **Detail card:**
  - Header + status
  - "Who held the vehicle at the offence time (FR-122)" **timeline bar** of trip-sheet segments over 24 h with a red offence marker
  - Driver line, paid-by-company amount
  - Manual attribution: driver select + reason ≥ 10 characters → Attribute
  - Action buttons by state: Pay with 50 % discount / Pay in full / File an objection; Request recharge from driver; Driver acknowledged (app) / Driver disputes; "Deduct from payroll <period>" (cap 50 % of base pay; HR override needs a reason and `drivers:write`); Write off as company cost (reason). Payment states book costs
  - Reason input; history
- Process note (FR-07, FR-125); payroll sheet list.

---

## 11. AI Ops Assistant (`ai`)

`screens/130-ai.js`. No tabs. Spec 5.11.

- **Subtitle:** "Decision Support & Operational Insights".
- **Header actions:**
  - "⟲ View History" — toggles the audit trail
  - "AI Settings" — goes to Settings and scrolls to the AI card
- **Banner:** "AI assists operations… does not auto-dispatch, move loads, or execute financial actions; human-controlled (GDP)".
- **4 AI cards** (2×2 grid). Each has a "Data Source" chip. If the module is switched off in Settings, the card shows "Module is switched off… Open":
  1. **Driver–Reefer Suggestions** (source: Dispatch): up to 4 unassigned loads with the best eligible driver → truck. Confidence chip High / Medium / Low · % (thresholds from Settings). Eligibility line: RTO have / need, rating, calibration. Optional "Why" explanation (⌄ / ⌃ when explainability is on). Buttons Accept (assigns, audited), Dismiss, Override (drawer). Rows without an eligible pair show "no eligible pair".
  2. **Temperature-Excursion Risk** (source: Routes): loads warn / breach (high / medium risk) plus ambient "overnight frost forecast" (low). Risk chip, hint + driver. Buttons: Notify customer, "Reroute to nearest hub", "Call driver", Dismiss.
  3. **Cost Leak Detection** (source: Fleet | Billing): ramp detention / Standgeld total, reefer idling estimate 8 % fuel, empty return → backhaul pairs. Amount ± ₸; "Review costs" (goes to Billing → Costs) / "Find backhaul" (goes to Dispatch); Dismiss.
  4. **ESF & Invoice Anomalies** (source: Billing): duplicate invoice, ESF confirmed while dispute open, ESF rejected, paid without confirmed ESF, missing reefer surcharge, VAT ≠ 12 %. Amount or "Review"; "Open invoice" (goes to Billing and opens the invoice drawer); Dismiss.
- Done rows collapse with a status chip (Dismissed / Customer notified / Rerouted …).
- **Card "Audit Trail · n":** "Show Recent Actions" toggle with the audit table.
- **Drawer `aiOvr` ("Override · <load>"):** note that a reason is mandatory and goes to the GDP log; driver select, truck select, reason textarea → Override (assigns, audited).

---

## 12. Baseline data (`baseline`)

`screens/620-eco-baseline.js`; data in `screens/615-eco-baseline-data.js` (`ECO_BL`). No tabs; uses an internal segment control. LH-O2, FR-35/36/37/38/48/49/174.

- **Subtitle:** "Question catalogue · 150 answers · validation, planned values, network, fleet and launch".
- **Menu badge:** open FR-49 questions.
- Intro note on the Fragenkatalog "Logistics Kazakhstan" (150 answers, 07.10.2026) and its sources.
- **4 KPI tiles:**
  - Network volume kg/month (waybills/month)
  - Temperature shipments 2026 (2–8 °C 77 %)
  - Express in budget % (outsourcing M ₸/yr)
  - Payback years (NPV, IRR, R1 start 12.2026)

**Segment `q` — "Fragenkatalog · 150"**
- **5 KPI tiles:** Answers in the catalogue 150, covered, deviation from v3, question to KDL (FR-49 open n / total), no data (items to request).
- Status segment filter: All / covered / deviation / question / no data. Section select A–T (20 sections: volumes and network … contract and control). CSV `fragenkatalog.csv`.
- Table: code, section, answer vs platform model (finding id + area + text, gap text, or "answer matches"), status chip (+ clarified).

**Segment `val` — "Deviations · n"**
- FR-49 banner (open n / total) and note.
- Findings table V-01…V-24: id + ref, topic, Fragenkatalog value, platform v3 (faint), decision in v4–v6, level chip (normal / watch / risk / critical), "Clarify with KDL" / "✓ clarified" toggle (needs `costs:approve` or `planning:admin`, audited).
- Card "No data in the answers — request from KDL Olymp" with gap chips.

**Segment `pv` — "Planned values"** (FR-174)
- Note and counter chips: checked / assumption / to verify.
- Table: area chip (Finance / Legal and tax / Reference data / Integrations / Operations), value + where used, source, check chip (+ who / date), "Checked" / "Re-check" (audited).

**Segment `net` — "Network & volumes"** (FR-36/37)
- Note: 23 cities assigned to the Astana / Almaty hubs per P86; Karaganda and Atyrau are transshipment points.
- Cities table: city + id, hub (P86), ring, kg/month with bar, kg/week, m³/week, temperature shipments per month by zone, v6 network role (hub / transshipment / route city); total row (incl. Makinsk).
- Note on unallocated 9 366 kg/month (V-12).
- Table "Rings and legs (P83, P85, R111)": ring + note, route, km + leg-sum check chip, cadence + km/yr + km/day, load per trip + fill %, vehicle · crew, start.

**Segment `fleet` — "Fleet & economics"** (FR-38)
- Note on the target fleet (4 × 10 t; 3.5 t ruled out).
- Fleet table: model + body / note, payload · volume, price incl. VAT, warranty (+ months by mileage), fuel · service, qty, status (planned / alternative / ruled out).
- Σ line vs the current demo fleet.
- Card "Rate per kg (G30)": bars for own / LTL / express; "Payback by scenario (N78)" bars.
- Card "Costs and parameters": outsourcing (G25), express (A2), savings (N77, ROI, IRR), investment (H31, payback, NPV), driver (J46), IT (H36 / I43), fuel (I38).

**Segment `launch` — "Launch · legal · West"** (FR-48 / 174)
- **4 KPI tiles:** days to the first R1 trip (target 15.12.2026), steps at risk (critical path), steps done, legal/tax items open.
- "Critical path to the first trip (O79, S138)": dated steps with ref + level, done / at risk / open chip and buttons ✓ / ! / ○ (audited).
- Card "Pilot R1 · success criteria (O80)" list plus a governance note.
- "Legal and tax check points (FR-174)": VAT 16 % vs 12 %, VAT registration before the vehicle contract, CIT / vehicle tax / MRP, employer contributions 17.5 %, OKED / charter / e-signature / ESF access, leasing contract. Each has a level chip and "Checked" / "Reopen".
- "Cold chain 'West' · decisions": 5 radio-choice decisions (active cooling, winter closure for V02, empty return Aktau → Astana, Atyrau transshipment, West assigned to the Astana hub), each with a recommended option and decided / undecided chip (audited).

---

## 13. Settings (`settings`)

Screen `screens/120-settings.js`.

- **Subtitle:** "Company Configuration & Governance Center".
- **Header actions:**
  - "Unsaved changes" dirty indicator
  - Export Configuration — `olymp-config.json` (saved + unsaved)
  - Save All Changes — validates, applies Standgeld / shift / AI thresholds, audits the changed sections

### Tab `base` — "General" (`120-settings.js`, made a tab by `440`)

One long page of 6 cards:

1. **Company Setup:** legal name, BIN (12 digits, validated); sites list (4 hubs with GDP licence and Active / Pending chip, HQ marker); "New site / warehouse" + Add; "User roles & permissions · users" summary (Admin 4, Dispatcher 12, Finance 6, QA / Responsible Person (GDP) 3, Driver 38, Viewer 9).
2. **System Integrations:** grid of 6 integration tiles — GPS tracking (Wialon), reefer telematics (Thermo King / Carrier), accounting (1C), invoicing (IS ESF), weather (Open-Meteo / Kazhydromet), fuel cards (Helios / Sinooil). Each shows Connected / Not connected + last sync, with Configure (drawer `integ`: status, last sync, "Sync now", Disconnect) or Connect.
3. **Notifications & Alerts:** 9 event rules, each with switch and threshold where applicable — temperature out of range (min), reefer door open (min), sensor offline, set-point ≠ order, delivery delay (min), route deviation (km), calibration expiring (days), GDP deviation created, ESF rejected. Sensitivity radio Low / Medium / High. Channels: In-App, Email, SMS, Telegram/WhatsApp.
4. **AI & Automation Controls:** module switches (Driver–reefer matching, Excursion risk prediction, Cost-leak detection, ESF/invoice anomalies); confidence threshold sliders High / Medium / Low (validated High > Medium > Low); note "escalation applies to notifications only"; AI Explainability switch; Override Tracking switch (locked on, mandatory GDP trail).
5. **Security & Compliance:** e-signature (NCALayer) switch, two-factor sign-in switch, session timeout min (5–240); "Audit log · n" with "Show audit log" / Hide toggle (table) and CSV.
6. **Source data & validation:** validation chip (errors / passed); Receiving & Standgeld parameters — free unloading time, billing step, rate per step; driving time & tax — maximum shift 4–9 h (Q5), VAT rate 12 % (not editable); note.

### Tab `ref` — "Reference data" (`440-rec-refdata.js`; badge = pending four-eyes versions) — LH-A2/A3, FR-78/135/169/174/176
- **4 KPI tiles:** Master records, Awaiting 2nd approval, Planned values unverified, Places with verified KATO.
- **Kind segment control** (with pending badges): Vehicles · history (read-only), Partners, Tariffs, Cost parameters, Planned values · verification, Manufacturers · logos, Places (KATO).
- **Filters:** search; note on effective date and critical fields; "Verify KATO (stat.gov.kz)" (places); JSON export; Add (with write permission).
- **Table:** record + key, current values summary (places: RU / KK / DE / EN names + KATO code + verified chip; verify: value + verified + legal reference), version vN · from date + scheduled chip + pending chip with changed fields.
- **Drawer `ref`:**
  - "Version history": each version with status chip (active / awaiting 2nd approval / rejected / superseded / scheduled), from date, author → approver, changed fields; pending rows have Approve / Reject (needs `approvals:sign`; four-eyes requires a different role)
  - "New version" / "New record" form: key, kind-specific fields, effective from → Save version
  - Critical fields go pending: partner tier / rate, tariff rate, cost value. An effective tariff changes the zone rates; the Standgeld step changes the receiving rate

### Tab `oncall` — "On-call" (`450-rec-admin.js`; perm `alarms:read`; badge = levels without current holder) — FR-166
- Note on masked contacts and the fallback file.
- **3 level cards** (Duty officer L1, Head of security L2, CEO L3): on call now / nobody, holder + masked contact, "Covered n h of 72" + gap warning, coverage bar.
- "Add slot" (admin or head-of-security function).
- **Slots table:** level, shift label + user, SMS (masked), e-mail (masked), from, until, status (current / planned / expired / ended), End.
- **Drawer `oncallNew`:** level, user, shift label, phone for SMS (+7 + 10 digits), e-mail, from / until datetime → Add.

### Tab `users` — "Users & roles" (`450`; perm `users:admin`; badge = approval slots without holder) — LH-Q1, FR-14/85/137/167
- **4 KPI tiles:** Active users, With 2FA (TOTP), Approval slots with a holder n/6, Restricted to one hub.
- Red banner "Approval slots without a holder: …" (FR-167) when applicable.
- **Filters:** Role, Hub (incl. unrestricted); buttons "Roles matrix" (toggles a screen × role ✓ matrix built by `rolesTable` in `help/00-framework.js`) and "New user".
- **Users table** (14 seeded): username + locked chip + name, role chip + ref, hub, business-function chips, 2FA, last login, Edit.
- **Drawer `user`:** name, 2FA; role select, hub select, Active checkbox; business-function checkboxes for staff roles (CEO, head of analytics & procurement, head of purchasing & logistics, head of logistics, financial controller, quality manager, HR manager, head of security; the admin cannot change their own); Save, Reset password (one-time password shown once), Reset 2FA, Unlock.
- **Drawer `userNew`:** username (a-z 0-9 . _ -), name, role, hub, customer ref / partner PL-xx → Create (shows a one-time password).

### Tab `audit` — "Audit log" (`450`; perm `audit:read`) — LH-Q3
- **4 KPI tiles:** Entries, Chain check (✓ n / ✗ #n), Users, Auth events.
- **Filters:** Module select, search; buttons "Verify chain", "Simulate tampering", CSV.
- Verification result banner.
- **Table (200 rows):** seq #, time, user + role, module chip, decision · subject + reason, hash ← previous hash (the hash chain wraps `audit()` in `400-rec-core.js`).
- Note: real platform uses HMAC; no personal data is logged.

### Tab `integ` — "Integrations catalogue" (`450`; perm `integrations:admin`) — LH-P1/P2, FR-173
- **4 KPI tiles:** Systems in the catalogue, Mandatory, Configured, Next deadlines.
- Card "Next deadlines": dated items with basis and "in n days" chip.
- Card "Access rule" (closed network, LH-P1/Q2) with "Inbox messages →" (goes to Dashboard → Inbox).
- **Per-category tables** (7 categories: government & mandatory; police / traffic / roads / weather; roadside & mobile workshops; security; leads & deals; telematics & couriers; finance & rates). 24 systems, e.g. IS ESF, SNT, ESUTD, KATO, eGov BIN, Sergek, KazAvtoZhol, Kazhydromet, MChS, KazToll, reefer service, insurer assistance, Wialon, security company, ati.su, Lardi, goszakup, Bitrix24, Thermo King / Carrier, CDEK, Kazpost, NBK rates, 1C, Partner API.
  - Columns: system + operator, mandatory chip + legal basis + deadline, API kind, connector chip (configured / not configured / manual / planned), last sync, inbox kinds fed
  - Actions: Connect / Sync
- **Card "API keys (partner API v1)":** "New key" (drawer `keyNew`: name + scopes bookings:read / bookings:write / tracking:read / inbox:write / invoices:read; secret shown once); table name + prefix, scope chips, created / used, Revoke.
- **Card "Webhooks (signed)":** "New webhook" (drawer `hookNew`: https URL + events booking.confirmed / booking.rejected / shipment.status / pod.approved / invoice.issued / alarm.level3 / temperature.excursion); table URL + HMAC secret, event chips, last delivery code, Test / Disable-Enable.

---

## 14. Role shells

### Customer portal (role `customer`; `screens/510-portal-customer.js`)
Menu: "Book a shipment" (`book`), "My bookings" (`mybookings`), Help. The account company is `c1`. LH-M1/M3, FR-146…155, 185–187, 190.

- **`book` — "Book a shipment"** (header action Reset). Two-column form:
  - **Pickup and Delivery address cards:** address-book select (or manual), city, street with directory suggestions, house, address-check chip (checked / manual check / incomplete) + hint.
  - **"Cargo: categories and temperature regime":** goods checkboxes grouped GDP / GLP / GMP / FOOD (14 categories; controlled substances flagged "licence"); temperature-zone select (unsuitable zones flagged); pallets / gross kg.
    - Expandable "Place dimensions" rows (pcs, L, W, H, kg, stackable, "+ place").
    - Weight-plausibility warnings (FR-185, never blocking): sum vs gross, oversize vs 120×80 pallet, height > 220, pallet places needed, kg per pallet > 1 200 / > 1 000, implausibly low.
    - Expandable "Dangerous goods / dry ice (ADR)": UN number, ADR class, packing group, dry ice kg, proper shipping name, LQ / EQ, validation.
  - **"Insurance, payer, express, notifications":**
    - Cargo insurance (declared value, premium, EUR/USD line)
    - Third-party payer (company, role agent / broker / forwarder, BIN / IIN check, reference, masking note)
    - Express delivery (requested date, 3-manager approval note, surcharge)
    - Payment prepayment / on account (only with a signed framework contract)
    - Offer select (open KP)
    - E-mail / SMS notification + contact
    - Remark
  - **Right column "Price and slots":** 2 tiles (total incl. VAT and insurance or "per offer"; lead time + mode + hub); route text + km; price-breakdown table; "Next departures" (up to 4 slots with date / time, line, pickup, delivery approx., cut-off, free pallets chip, chosen) — or the express note; error list; "Book" / "Request express" button.
  - **Confirmation card:** booking id, summary, mock e-mail / SMS messages, address-check note, links "My bookings" and "Tracking".
- **`mybookings` — "My bookings"** (header action New booking):
  - 4 KPI tiles: bookings, awaiting confirmation, valid offers, framework contract or prepayment.
  - Bookings table: no. + created, route + via hub, zone, cargo + express / insured chips, departure, price + payer invoice, status chip + express approval chip + reason. Actions: Track, Cancel (new only), offer ref.
  - Card "Offers": rows with "Book with the offer".
  - Card "Contracts and e-signature": NCALayer note; rows with SHA-256, signed info and "Sign (demo NCALayer)".

### Partner portal (role `partner`; `screens/520-portal-partner.js`)
Menu: "My handovers and ePOD" (`phandovers`), "Profile and GDP" (`pprofile`), Help. The account is PL-01. LH-L2, FR-30/68/172.

- **`phandovers`:**
  - 4 KPI tiles: handovers, awaiting ePOD, SLA %, GDP qualification.
  - Card per handover: HO id · load, route, zone, pallets, kg, ETA, status + ePOD chip, SSCC chips (up to 6 + n).
  - ePOD form: consignee name, position, signature pad (click to sign), photo (demo), scanned packages checklist + "scan all", "Upload ePOD". This sets the load delivered and POD pending; the note goes to Proof of Delivery.
- **`pprofile`:**
  - Company card: code, city, tier, contract, SLA, capacity.
  - Current GDP qualification (+ validity chip); other submissions with status.
  - "New submission": scope, GDP certificate file (demo), valid until → "Submit for review" (approved in Orders → Commercial → CRM).
  - Card "Self-registration of a new partner": company, BIN (legal-entity check), city, GDP proof upload → Register (creates partner PL-xx, status pending); list of registrations.

### Driver app (role `driver`; route `driverapp`, `screens/330-driver-app.js`)
Menu: "Driver app", Help. Same phone UI as Drivers → Driver app (section 5), but without the admin driver selector. The default driver is d4.

### Public request and tracking (no login; routes in `ALWAYS`; `screens/530-public.js`) — FR-02, FR-112, FR-175
- **`request` — "Transport request":**
  - Public-page note.
  - Form: company*, contact*, e-mail*, phone, from*, to*, temperature regime, pallets / frequency, message, hidden honeypot "website", consent checkbox* → "Send request" (creates a CRM lead, source web).
  - Thank-you card with lead id and "New request".
  - Card "What happens next" (3 steps) and link "Track a shipment by number".
- **`track` — "Shipment tracking":**
  - Input "BK-26-000001 / LD-2026-001840" + Find; "Link for the consignee" (copy toast).
  - "Shipment not found" message.
  - Tracking card: id, route, zone, pallets, express, status chip; status timeline (request received → confirmed by dispatch → trip assigned → loading at hub → in transit % + ETA → delivered); "Route via the hubs" legs (kind, km, days) + lead time / estimated delivery; temperature compliance chip; last-mile partner chip; no-PII note.
- **Deep links:** `?track=<id>` and `?request=1`.

---

## 15. Changes (`changes`, `screens/460-rec-changes.js`)

Reached from the version link in the sidebar.

- **Title:** "Change register". Subtitle shows the entry count and as-of date (KK falls back to RU). Header action: CSV.
- **4 KPI tiles:** Entries, Implemented / fixed, Partly / planned, Open questions.
- **Filters:** Type (FR / BUG), Status (implemented / partly / fixed / planned / open question / closed), Group, date from / to, search, Clear.
- **Table, 25 per page:** ID + date, FR / BUG chip, title + group, status. Clicking a row expands Finding + Change. Pager ‹ ›.
- Data comes from the embedded `@@REGISTER@@` (190 source entries).

---

## 16. Help (`help`, `help/*.js`)

- **`SCREENS.help` — "Help & how-to"** (`help/00-framework.js`):
  - Header: search box, Print.
  - Left navigation by group: Getting started; Operations · 12 sections; Records and administration; Portals and driver app; Integrations and channels; Reference.
  - Article body: title, subtitle, "Open the screen", tour link, purpose, visuals, "Who uses it", "What you see", "How to" steps, Rules, specials (roles matrix + role descriptions, glossary, FAQ, deadlines table, tours list), FR line, "See also", KK fallback marker.
  - Context "?" and "▶" buttons are injected into every page head.
- **AI summary** (`help/80-ai-summary.js`): a "✦ AI Summary" toggle in the page head of dashboard, orders, dispatch, routes, fleet, drivers, hubs, pod, billing and baseline. It inserts an advisory sentence (counts + recommendation) at the top of the content.
- **Guided tours** (`help/70-tours.js`): intro (at start), dispatcher (dispatch), customer (portal/book), driver (drivers/app), qa (pod/quality).

### Help article keys → titles (EN)
- **start / reference:** start "Platform overview"; structure "How the platform is organised"; login "Sign-in, 2FA and password"; roles "Roles and permissions"; data-protection "Personal data and audit trail"; demo "Mock-up and demo data"; tours "Guided tours by role"; express "Where is express?"; navigation "Keyboard, languages, design and links"; changes "What changed — change register"; deadlines "Deadlines and mandatory dates"; glossary "Glossary"; faq "Frequently asked questions"; account "My account"; records "Records and administration — where to find what"; contracts "Contracts and e-signature".
- **dashboard:** dashboard "01 Dashboard"; dashboard/alarms "Alarms and response steps" / "Alarms"; dashboard/inbox "Inbox".
- **orders:** orders "Orders & Loads"; orders/loadw "03 Load and weight" / "Load & weight"; orders/ship "04 Shipments and labels"; orders/docs "08 Documents KZ and trip release" / "Documents KZ and Go/No-Go release"; orders/bookings "Customer bookings"; orders/commercial "Commercial: offers, price lists, customers, CRM" / "Commercial: customers, prices, offers, contracts, CRM".
- **dispatch:** dispatch "02 Dispatch Board"; dispatch/planning "14 Capacity planning" / "Planning: 7-day capacity"; dispatch/partners "11 Partners"; dispatch/express "Waybills & express"; dispatch-release "Release, double booking and replanning".
- **fleet / drivers:** fleet "10 Fleet"; fleet/registry "Vehicle registry and service" / "Fleet · Registry"; drivers "Drivers"; drivers/staff "12 Staff" / "Drivers · Staff"; drivers/app "13 Driver app".
- **routes:** routes "Routes & Tracking — map"; routes/temp "05 Temperature"; routes/wx "06 Weather 3–7 days"; routes/sec "07 Security"; routes/coverage "Network coverage and SMS fallback" / "Routes · Coverage"; routes/lines "Lines & tariffs"; routes/thermochron "Routes · Thermochrons & loggers".
- **hubs / pod:** hubs "Warehouses & Hubs"; receiving "Receiving at the hub"; pod "Proof of Delivery — POD queue"; pod/quality "09 Deviations & quality".
- **billing:** billing "Billing & Invoices"; billing/cost "16 Costs"; billing/insurance "Cargo insurance"; billing/model "Cost model".
- **reports / ai / baseline:** reports "15 Reports"; reports/kpi "Reports · KPI"; reports/cross "Express × temperature"; reports/fines "Fines"; ai "AI Ops Assistant"; baseline "17 Baseline data".
- **settings:** settings "Settings"; settings/ref and settings/reference "Reference data"; settings/oncall "On-call roster"; settings/users "Users and roles"; settings/audit "Audit log"; settings/integrations "Integrations catalogue".
- **portals:** portal "Customer portal, request form and tracking"; portal/book "Book transport"; portal/my "My bookings"; book "Customer portal: book a shipment"; mybookings "Customer portal: my bookings"; partner-portal "Partner portal"; phandovers "Partner portal: handovers and ePOD"; pprofile "Partner portal: profile and GDP"; track "Public shipment tracking"; request "Public request form".
- **channels:** int-systems "External systems and mandatory deadlines"; webhooks "How to connect a partner by webhook"; partner-api "Partner API v1".

### Help keys that do not match a real tab key
The "?" button falls back to the screen article for these:
- `settings/reference` — the tab key is `ref` (a separate `settings/ref` also exists)
- `settings/integrations` — the tab key is `integ`
- `receiving` — the real screen/tab is `hubs/recv`
- `portal/book`, `portal/my` — the real routes are `book` / `mybookings`; separate articles with those keys also exist

### Other notes
- `NAV` placeholder text ("moves to the new design system in phase N") is only used when a NAV item has no `SCREENS` entry. Every NAV item now has one.
- Unbuilt functions that only show a toast: Import (orders, fleet, drivers), Export (routes, POD), Bulk Upload (POD), hub Settings and Add hub, report PDF.
