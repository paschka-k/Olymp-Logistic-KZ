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
