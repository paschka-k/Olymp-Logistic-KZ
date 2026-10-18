# Integration plan — Olymp Logistic Platform → v6 mock-up

Goal: one central, GitHub-hosted **mock-up** (vanilla JS, fictitious data, no backend) in the v6 design and structure that contains every
function of the source platform (`paschka-k/Olymp-Logistic-Platform`, v0.3.9) and of the HUB specifications (`docs/specs/`), with the complete help ported
and updated for v6, and all automatic tests adapted.

Sources: `docs/specs/01…05` (RU + DE: function overview, scope map, ideas, Lastenheft LH-A1…R3, Pflichtenheft), `docs/source-platform/register.json`
(190 change requests FR/BUG, 3 languages), the source repo (`frontend/src/{help,tours,pages,v5,demo}`), the v6 spec (`Redesign Specification v1.0`).

## 1 Decisions (user, 2026-10-19)
| Topic | Decision |
|---|---|
| Publishing | v6 becomes **`/platform/`** on GitHub Pages; today's files in `platform/` (v5 React demo, tests, changes) move to `platform/legacy/`. |
| Structure | **12 menu items + tabs** (spec Q1/2.2). Customer portal, partner portal, public tracking and the driver app are **role shells / separate entry views in the same file and design**, not extra menu items. |
| Help | RU / DE / EN complete; KK for titles, navigation and the core articles (start, roles, glossary); other KK articles fall back to RU with a marker. |
| Mock-up rule | No complex background structure: in-memory state `S`, deterministic demo data, rules as small pure functions (like `compat/assign/canMove`). |
| Process | This plan → shared foundation (section 3) → parallel sessions per area (section 5). Merge locally; **push only on the user's OK**. |

## 2 Target structure (menu → tabs)
The 12 menu items stay. Source screens `01–17` and the records/admin pages land as tabs (✓ = exists in v6 phases 1–8):

| v6 menu item | Tabs (source screen / page → FR/LH) |
|---|---|
| Dashboard | Overview ✓ · **Alarms** (r-alarms, FR-101/104) · **Inbox** (FR inbound, channels) · alarm instructions, weather per hub, external messages |
| Orders & Loads | Orders ✓ · **Load & weight** (03: pallets/volume/weight/axles/height, truck pick with trip cost, split over several trucks, loading order, weighing, FEFO, SSCC reconciliation; FR-99/139/140/143/144/145/146) · **Shipments & labels** (04: PO/lines/places, SSCC GS1-128, ZPL print, scanner search, Track & Trace, archive, manufacturer logos; FR-01…06, 73, 176) · **Documents KZ** (08: TTN, ESF, SNT, waybill, e-signature, Go/No-Go release, ESF/ESUTD status; FR-12, 91, 92, 116) · **Bookings** (customer requests, badge, confirm/reject/cancel; FR-190) · **Commercial** (offers, price lists, contracts, customers + BIN check, CRM leads/tenders, tasks; FR-147…152, 127, 189) |
| Dispatch Board | Board ✓ · Planning ✓ (+ 7-day capacity, scenarios, target-fleet simulation, KZ working calendar, FR-38/119/156) · Partners ✓ (+ tariffs, own-vs-partner comparison, SLA downgrade, contract renewal, coverage; FR-19…33, 121) · **Waybills & express** (express approval by 3 functions with deadline, express KPI; FR-41/126/154) · Go/No-Go release and double-booking checks in the load drawer (FR-91/93/94) |
| Fleet | Fleet ✓ · **Registry** (views, commissioning checklist, calibration, warranty forecast, service requests with ETA/cost; FR-50/118/141/157/158) |
| Drivers | Drivers ✓ · **Staff** (12: availability, absences, driving/working time 4.5 h/9 h, medical, ADR/licence deadlines, fines & recovery; FR-08/10/46/55/114/120/122/123) · **Driver app** (13, phone-frame view: shift start/checklist, waybill, route points, scan, thermochron, exceptions, returns, fuel, incidents/SOS, messages, fines, shift end, offline; FR-52…67) |
| Routes & Tracking | Map ✓ · Temperature ✓ (+ thermochron log, loggers, passive chain FR-39/40) · Weather ✓ (+ 3–7 days, KazHydromet storm warnings, −45 °C rule FR-43) · Security ✓ (+ ADR/dry ice, escalation, one-click contacts, event log) · **Coverage** (comms model, dead zones, SMS fallback; FR-109…111) · **Lines & tariffs** (schedules, departures, exceptions, tariffs, vehicles per line; FR-96/97/155) |
| Warehouses & Hubs | Hubs ✓ · Receiving ✓ |
| Proof of Delivery | Queue ✓ · Quality ✓ (+ quarantine of affected orders, GDP evidence, driver-app events; FR-25/103/117) |
| Billing & Invoices | Invoices ✓ · Costs ✓ (+ bottom-up model, actuals register, own-vs-external with two signatures, cost + 5 %; FR-47/125) · **Insurance** (policy, certificates, claims from deviations; FR-28/153) |
| Reports | Cards ✓ (+ OTIF, load factor, express share, cost per kg, fines import, exports; LH-O1) · express × temperature crossing report (I-12) |
| AI Ops Assistant | ✓ |
| Settings | Company / Integrations / Notifications / AI / Security ✓ · **Reference data** (versioned masters, planned values, manufacturers, routing parameters, four-eyes approval; FR-78/174) · **On-call** (FR-166) · **Users & roles** (11 roles, business functions, MFA) · **Audit log** · **Baseline data** (17: 150-answer questionnaire, validation, planned values with check status, critical path, legal/tax items; FR-35/48/49/174) · **Integrations catalogue** (FR-173) |
| (role shells) | **Customer portal** (Book a shipment, My bookings, offers, price, slots, payer, express, e-mail/SMS confirmation; FR-146/150/151/154/155/185…189) · **Partner portal** (own handovers, ePOD upload, self-registration with GDP proof; FR-30/172) · **Public** (request form, tracking without login) |
| (global) | **Help** (`?` in the top bar → `route help`), **Changes** register (190 FR/BUG, 4 languages), version + build time, role switcher (11 roles, FR-14/137), design switch Olymp ↔ Kökzhol (FR-178/179), keyboard/skip-link (FR-134) |

## 3 Shared foundation (done before the parallel sessions)
1. **Layout:** build writes `platform/index.html` (RU), `platform/de.html`, `en.html`, `kk.html`; legacy moved to `platform/legacy/`.
2. **Auto-registration:** `build-v6.mjs` bundles `v6/screens/*.js` in file-name order (`NN-name.js`); no manifest edits, so areas do not conflict.
3. **Tabs API:** `addTab(screenId, key, label, bodyFn, {perm, badge})` in `core.js`; every new tab uses it.
4. **Roles:** `S.role` (11 roles), `canSee(screen|tab)`, role switcher in the top bar; customer/partner roles switch to the portal shell.
5. **Help framework:** `v6/help/*.js` register articles `{key, group, screen, title, purpose, who, see, howto, rules, fr, related}` with `T(ru,de,en,kk)`; Help screen with search, groups, roles matrix, glossary, FAQ, process diagrams, tours; context `?` link per screen/tab.
6. **Tests:** `tests-v6/*.js` suites (one file per area) assembled into `tests-v6.html` by the build; CI runs it.
7. **Version/changes:** version string + build time in the sidebar; `register.json` → Changes page.

## 4 Conventions for every area
- New code only in own files `v6/screens/NN-<area>.js` (+ `v6/help/<area>.js`, `tests-v6/<area>.js`); shared files (`core.js`, `data.js`) only for small additive hooks.
- All texts `T(ru, de, en, kk)`; **DE/EN contain no Cyrillic**; KK best effort.
- Demo data deterministic (fixed `NOW`); fictitious partners/people; no real personal data.
- Rules before looks: each function must be a working mock (state changes, dependencies between screens, audit entry via `audit()`), not a static picture.
- Each FR/LH implemented gets a line in `docs/TRACEABILITY.md` (LH/FR → tab → test name).
- Definition of done per area: renders in 4 languages without `undefined/NaN`, ≥1 scenario test per FR cluster, help articles written, spec section 10 updated, committed on the area branch.

## 5 Parallel workstreams
| ID | Area | Scope (source) |
|---|---|---|
| W1 | Operations flow | Orders tabs *Load & weight, Shipments & labels, Documents KZ*; Dispatch: Go/No-Go release, double-booking, replanning, waybills & express approval; Planning extras (LH-B, C, D, H, N1) |
| W2 | Resources & driver app | Fleet registry/checklist/calibration/warranty; Staff; Driver app (phone view); Coverage; Lines & tariffs (LH-J, K, F, E extras) |
| W3 | Records & administration | Dashboard Alarms + Inbox; Bookings; Insurance; Settings: Reference data, On-call, Users & roles, Audit, Integrations catalogue; Changes page (LH-G, I, P, Q) |
| W4 | Customers & portals | Commercial tab (offers, price lists, contracts, customers, CRM, tasks); Customer portal; Partner portal; Public form/tracking (LH-M, L2) |
| W5 | Economics & baseline | Costs model + own-vs-external, Reports extras (OTIF, express share, I-12), Baseline data (150 answers, validation, critical path, legal/tax) (LH-N, O) |
| W6 | Help & i18n | Help framework content: 17 screen articles + records articles + start/roles/glossary/FAQ/deadlines/tours, mapped to v6 tabs; KK core; Changes text |
| W7 | Tests & publishing | Adapt/extend tests, CI, Pages layout, legacy move, README (continuous) |

## 6 Out of scope for the mock-up (documented only)
Real Wialon/tachograph, 1C interface, WhatsApp/Telegram (open legal question FR-188), real e-signature (NCALayer) and ESF/ESUTD calls, PostgreSQL/Alembic, HMAC audit chain, backups, pen-test. They appear as UI states with demo behaviour and as Settings → Integrations entries.
