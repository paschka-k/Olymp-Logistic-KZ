# platform-src — modular sources of Platform v5

`platform-v5.3.html`, `platform-v5.3-de.html` and `platform-v5.3-en.html` are **generated** (v5.3; the older `platform-v5*.html` stay untouched). Version and file names live in `manifest.json` (`version`, `outputs`); segments use the tokens `@@VERSION@@`, `@@FILE_RU@@`, `@@FILE_DE@@`, `@@FILE_EN@@`. To cut the next version change them there. Edit the files here, then:

```powershell
node platform-src/build.mjs            # writes the three HTML files next to platform-src/
node platform-src/build.mjs --lang ru  # one language only
node platform-src/build.mjs --out dist # other output folder
```
Node 18+ is the only requirement (no npm packages).

## Layout
```
platform-src/
  manifest.json          ordered list of segments (= the build recipe) and output names
  build.mjs              assembles the segments into the bundle
  shared/screens/<id>/   language-neutral modules (texts via X(ru, de, en))  ← put NEW screens here
  lang/<ru|de|en>/
    bundle.html          bundle wrapper (assets), template is injected at /*@TEMPLATE@*/
    shell/               head, CSS tokens, sidebar, top bar, overlays, script open/close
    core/                i18n helpers, NAV, simulation clock, alerts, render (renderVals), units
    screens/<id>/        view.html (markup) · data.js (constants) · logic.js (class methods)
```
Every screen = up to three segments: **view** (HTML in the `x-dc` template language), **data** (constants) and **logic** (`xxxVals()` methods of `Component`). The order in `manifest.json` matters (data before the class, class methods before `core/render.js`).

## Add a new screen (checklist)
1. `shared/screens/<id>/view.html` — one `<sc-if value="{{ is.<id> }}">…</sc-if>` block.
2. `…/data.js` — constants (top level) and `…/logic.js` — a method `<id>Vals()` returning the bindings.
3. `lang/*/core/nav.js` — add `['<id>','NN',label,subtitle]` (use `X(ru,de,en)` for labels).
4. `lang/*/core/render.js` — add `...this.<id>Vals(),` to the returned object.
5. `manifest.json` — insert the three segments (view before `screens/baseline/view.html`, data after the last data segment, logic before `core/render.js`).
6. `node platform-src/build.mjs`. Set `"off": true` on a segment to switch it off without deleting it.

The existing legacy screens are still per-language (they were translated by hand); new work should go to `shared/` so a change is made once for RU/DE/EN.

## Screen 17 — Goods receipt (`shared/screens/inbound/`)
Inbound list per hub (Astana / Almaty), status ordered → planned → at gate → unloaded, numbered sender and stop chips (green = unloaded), pre-carriage data, ramp windows, dwell clock turning red, delay question, Standgeld (free time, 6 000 ₸ per started 30 min, booked into screen 16), process timestamps, gate cold-chain check (temperature, logger, SSCC), side panel with progress and audit footer, feature chips (fixed slot, ADR, shortage, QA hold, customs, GDP, temperature class, ЭСФ / ЭСУТД), column filters, saved views, CSV export.
Tune: `INB_RATE`, `INB_STEP`, `INB_TR` (temperature ranges), ramps `INB_RAMPS`, and the demo jobs `INBJ` in `data.js`.

## v6 design system (phase 1, spec v1.0 released 2026-10-18)
`shared/design/` = language-neutral tokens and components for the redesign (sample-based look, KZ cold-chain additions):
`tokens.css` (all CSS custom properties) · `shell.css` (app grid, sidebar, topbar, page-head, nav) · `components.css` (card, kpi-tile, chip, btn, table, drawer, filters, progress…) · `components-kz.css` (hub-card, zonebar, steps, drop-zone, dock-grid, risk-card, report-card, toggle, integration tiles) · `preview/` (demo page).
```powershell
node platform-src/build-design.mjs            # design-preview-v6-{ru,de,en,kk}.html next to platform-src/
node platform-src/build-design.mjs --lang kk
```
Texts in `preview/body.html` use `[[ru::de::en::kk]]` (four parts are mandatory; the build fails otherwise). The legacy `platform-v5.3*` bundle is untouched; the next phases move screens onto these tokens/components.

## v6 prototype (phase 2: Dashboard, Orders & Loads, Dispatch Board)
Standalone vanilla-JS prototype on the v6 design system (decisions Q1–Q8, spec v1.0). Separate from the legacy v5.3 bundle (no x-dc template engine).
```powershell
node platform-src/build-v6.mjs            # platform-v6.html (RU), -de, -en, -kk next to platform-src/
node platform-src/build-v6.mjs --lang kk
```
```
platform-src/v6/
  core.js        i18n T(ru,de,en,kk), helpers, icons, store S, dispatch rules (compat/assign/autoAssign/setStatus/canMove/createLoad), shell, drawer, router
  data.js        demo data (hubs, distances, temperature zones, customers, drivers, trucks, loads); fixed clock NOW
  screens/       dashboard.js · orders.js (+ load drawer, create form) · dispatch.js (kanban, Planning tab, drag & drop)
  app.css        app-specific styles on top of shared/design/*
```
Rules implemented: truck must support the load's temperature zone and have enough pallet places; driver must be available with enough driving time (RTO, one shift max 9 h; norms to be verified, spec Q5); status flow assigned → loading → in transit → delivered, problem only from loading/in transit; delivered frees driver/truck and creates a POD placeholder (`pod: pending`). Other menu items show a placeholder naming the phase that builds them. Add a screen: new file in `v6/screens/`, register it in `SCREENS`, add it to the list in `build-v6.mjs`.

### Phase 3 additions (Fleet, Drivers, Routes & Tracking)
`screens/fleet.js` (5 KPI, filters, temperature set/actual column, vehicle drawer with documents and service schedule, add vehicle with plate validation `123 ABC 01`, schedule maintenance / return to service) · `screens/drivers.js` (4 KPI, RTO dot, document validity, driver drawer, add driver, compliance report as CSV) · `screens/routes.js` (map with zoom, route status on time / at risk / critical from temperature, route drawer with progress, stops, temperature series, metrics).
New dispatch rules (`compat` in `core.js`): a driver with an expired licence or medical certificate cannot be assigned; a truck with expired sensor calibration cannot take pharma loads (GDP). Auto-Assign now uses the same `compat` check. Demo data is in `data.js` (`mkDrivers`, `mkTrucks`); document dates are checked against the fixed clock `NOW`.

### Phase 4 additions (Warehouses & Hubs + Receiving tab)
`screens/hubs.js`: 4 KPI, filters (hub, status, utilization band), cards or map view; hub card = utilization by temperature zone (stacked zone bar + threshold bar), in/out/places, dock and yard status, receiving count, temperature alarm chip; hub drawer with tabs Overview (zone breakdown, maintenance toggle), Docks (schedule grid, block/unblock a dock), Yard queue (reefer wait, red above 30 min for cold cargo), Loads. Hub status is derived: maintenance flag, or critical (zone utilization >= 90 %, 2+ blocked docks, temperature alarm).
`screens/receiving.js` (tab "Receiving", port of legacy screen 17): ordered, planned, at gate, unloaded; ramp must match the temperature zone and be free; cold-chain gate check (temperature + logger) must be in range before unloading; QA hold flag; delay question "caused by the hub?"; Standgeld = 6 000 ₸ per started 30 min after 45 min free time (`RECV` in `data.js`), bookable only after unloading and only for hub-caused delays; booking writes a row into `S.costs` (billing/costs in phase 5); CSV export and saved views. Chain: a load that departs (status in transit) creates the inbound job at its destination hub (`HOOKS.status`); finishing the unloading of a linked job delivers the load (POD placeholder) and adds the pallets to the hub zone.
Simulated hub time: `S.clock` (+15 min button in the tab).

### Phase 5 additions (POD, Billing & Invoices, Costs)
`screens/pod.js`: queue of delivered loads (counters, pill tabs, search, driver filter), 4-dot step tracker (upload, review, approved, e-signature), inline drop zone under rows that need an upload, drawer with document slots (waybill, handover act, cargo photo, temperature log for cold zones; real file inputs or "attach all (demo)"), submit, approve, reject with reason, re-upload. A temperature excursion must be accepted with a QA comment before approval (written to the load notes as a GDP record).
`screens/billing.js`: tab Invoices (summary line outstanding = pending + overdue, filters incl. date range and aging buckets, invoice drawer with line items, VAT 12 %, customer profile, payment, disputes) and tab Costs (categories, Standgeld rows from receiving, add/delete, margin vs net revenue).
Chain (spec section 3, decision Q3): load delivered -> POD pending -> upload/submit -> approve -> invoice is created automatically (`makeInvoice`, total = rate, net + VAT 12 %) and the POD row shows "Ready for ESF" -> issue ESF (none -> issued -> confirmed or rejected, shared with the load) -> payment. An open dispute (e.g. temperature claim) blocks sending, ESF issuing and payment until it is resolved. Standgeld booked in the receiving tab appears in Costs.
`render()` now keeps what is typed in drawer fields (by element id) across re-renders.

