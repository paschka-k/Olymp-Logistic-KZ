// R6 · builds docs/TEST-PARITY-0.3.9-v6.md from the recorded 0.3.9 run (scenarios-039.json) and the mapping rules below.
//   node tools/parity-039/matrix.mjs
// Every 0.3.9 scenario gets exactly one status:
//   covered — an existing v6 test (before R6) checks the same behaviour
//   added   — a test written in R6 (platform-src/tests/f0…f5-*.js) checks it
//   n/a     — not applicable to the v6 mock-up (backend-only, React-specific, test-page content, removed function); reason given
//   gap     — v6 lacks the function; listed as a follow-up, no test possible yet
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..', '..');
const run = JSON.parse(readFileSync(join(here, 'scenarios-039.json'), 'utf8'));

/* v6 tests referenced by the rules: file · group (short) */
const V = {
  nav: '10-navigation · "[ru/de/en/kk] 13 menu items, every screen renders"', langLinks: '10-navigation · "language switcher links to all four files"',
  langAudit: '62-language-audit · "[de/en] language audit: no Cyrillic in any screen, tab or drawer"', names: '62-language-audit · "[lang] names in the UI language"',
  hub: '61-shell-ext · "[lang] shell: hub filter narrows lists…"', search61: '61-shell-ext · "shell: search finds lines and database hits, keyboard moves, Enter opens…"',
  banner: '61-shell-ext · "shell: alarm banner…"', bottom: '61-shell-ext · "shell: bottom bar has 4 screens per role, Escape closes…"', deep: '61-shell-ext · "shell: deep links ?load= ?s=&t=…"',
  eyebrow: '61-shell-ext · eyebrow / clock / business date groups', narrow: '63-narrow · "[lang] narrow 375 / 768 px: every screen, tab and load-drawer tab fits…"',
  design: '60-foundation · "design switch Olymp / Kökzhol, version block, skip link"', roles: '60-foundation · "roles: admin sees 13 items, shells…" / "roles: permissions follow the platform matrix"',
  helpRoles: '60-foundation · "help: opens from the top bar, searches, links to screens, roles matrix"',
  sscc70: '70-ops-load · "ops model: SSCC check digit, one place per pallet…"', load70: '70-ops-load · P1 groups (vehicle type card, chambers, bulkhead, vehicle match, truck finder, CoG, orders table)',
  plan70: '70-ops-load · "plan of the vehicle type: an unfitting type needs trips:override_load and a reason"', fefo70: '70-ops-load · "FEFO warning and SSCC reconciliation…"',
  finder70: '70-ops-load · "load calc… truck finder" / "split over two trucks" / "loading sequence" / "departure weighing"',
  scan71: '71-ops-ship · "scanner search: a GS1-128 scan (AI 00) opens the label…"', zpl71: '71-ops-ship · "GS1-128 label: ZPL encodes AI 00 / 02 / 10 / 17…"',
  tt71: '71-ops-ship · "track & trace per place follows the load…"', mfr71: '71-ops-ship · "manufacturer directory with logo badges; archive date filter"',
  gate72: '72-ops-docs · "Go/No-Go: loading → in_transit refused until released; controls are data-based…"', release72: '72-ops-docs · "override release needs trips:override_release and a reason…"',
  docs72: '72-ops-docs · "document chain generate → sign → send → accepted…" / "UI: Documents KZ tab"', docs76: '76-ops-docs · "Documents KZ: 12 document types…" / "generate → PDF → sign → IS ESF… Generate all"',
  gate76: '76-ops-docs · "Documents KZ: gate shows 9 + 2 controls; stale forecast blocks until Clear without weather forecast"',
  dbl73: '73-ops-dispatch · "double booking: a driver or truck on a running load cannot be assigned again"', express73: '73-ops-dispatch · "express: three signatures approve…" / "UI: Waybills & express tab, badge…"',
  plan73: '73-ops-dispatch · "planning: 7-day capacity from data, scenarios…, target fleet of 4 trucks…"',
  dash74: '74-ops-dashboard · "dashboard: 0.3.10 KPI set, alarms (≤ 9) and risks (≤ 6)…"', play74: '74-ops-dashboard · "dashboard: playbook card appears for an active incident simulation and resets"',
  aside74: '74-ops-dashboard · "trip detail aside: stops…, trip sheet once, buran-free move, driver feed"', frost74: '74-ops-dashboard · "pre-release checks stay informational: a frost forecast of −45 °C is flagged"',
  plan74: '74-ops-dashboard · "Planning: unassigned orders…, booked departures (FR-96)…"', abort75: '75-ops-trips · "abort trip (FR-173)…" / "abort trip UI"', stops75: '75-ops-trips · "stops and outcomes (FR-98): arrival, outside window…"',
  track75: '75-ops-trips · "tracking token: copy, renew, cancel; public tracking…"',
  fleet80: '80-res-fleet-staff · "W2 fleet: …" (new truck checklist, load profile, warranty, service request, saved views + CSV)', staff80: '80-res-fleet-staff · "W2 staff: driving-time blocks…" / "absences…" / "ADR / licence deadlines and course booking" / "fines attributed at violation time"',
  urgent80: '80-res-fleet-staff · "W2 fleet: service request changes availability and slot capacity" / RES.urgent in the staff groups',
  app81: '81-res-driver-app · "W2 driver app: …" (role shell, shift start, delivery flow, exceptions, offline / SMS, fines notice, fuel, returns, shift end, Kazakh UI)',
  cov82: '82-res-coverage-lines · "W2 coverage: escalation L1/L2/L3…" / "SMS delivery status, timeout and retry" / "dead zones from telematics gaps…"', lines82: '82-res-coverage-lines · "W2 lines: …"',
  thermo82: '82-res-coverage-lines · "W2 thermo: thermochron log creates deviation, loggers, passive containers (FR-39/40)"',
  thermo83: '83-res-thermo · "P3 thermo: chips, readout tiles, 48-reading chart…" / "P3 temperature log…"', wx84: '84-res-weather · "P3 weather: grid…, horizon 3 / 7" / "stale forecast warning disappears after Refresh…"',
  cov85: '85-res-coverage · "P3 coverage: map on the road network…" / "offline windows per trip…" / "OL1 SMS channel…"', sec85: '85-res-coverage · "P3 security: closing a real incident needs a category…"',
  fleet86: '86-res-fleet-ext · "P4 fleet: KPIs by class, demo fleets never join S.trucks…" / "insurance / tax / fees column and West approval"',
  part87: '87-res-partners · "P4 partners: …" (city-group filter, contacts, renewal four eyes, SLA demotion, route coverage + task, handover full / partial, portal steps, service on route)',
  staff88: '88-res-staff-app · "P4 staff: where-now columns and 90-day document deadlines…"',
  rec90: '90-rec-records · "alarms…" / "inbox…" / "bookings…" / "insurance…" / "reference data…" / "on-call…" / "users…" / "audit…" / "integrations…" / "changes page…"',
  por: 'a0-por-portals · "por: …" (BIN check, price lists, offers, contracts, CRM, routing, customer booking, partner portal, public tracking)',
  eco: 'b0-eco-economics · "cost model…" / "own vs external…" / "fines…" / "baseline: 150 questions…" / "baseline: 23 cities…, target fleet 4, legs check"',
  rep: 'b1-eco-reports-ext · "reports: six KPI tiles…" / "driver report follows the fine register" / "catalogue…"', costs: 'b2-eco-costs-ext · "costs: workshop & downtime / drivers FTE / summary / toll CSV / incoming ESF / insurance idle"',
  chain30: '30-chain · "temperature alarm: … QA flow closes it" / "partner handover…" / "blocked partners… unblock only after CAPA closes" / "security incidents…"',
  help: 'c0-help-content · "help: …" / "context help…" / "tours: …"', visuals: 'c1-help-visuals · "help visuals: …"', notes: 'c2-notes · "notes: …"',
  parity: 'd0-v6-parity · map / registry / baseline section / Schaubilder players / live telemetry / security simulations / closure lifted early / bulkhead',
  f0nav: 'f0-shell-parity · "[lang] navigation: every menu item opens its screen, the page title and the breadcrumb name the menu item…"', f0icons: 'f0-shell-parity · "navigation icons…"',
  f0search: 'f0-shell-parity · "search: every article of every current load is found…; PO…, PL…, SSCC…"', f0roles: 'f0-shell-parity · "roles: read-only roles see data but no write actions; the driver only reaches the driver shell…"',
  f0kk: 'f0-shell-parity · "[kk] Kazakh UI: menu labels are Kazakh…"',
  f1plates: 'f1-data-integrity · "data: fleet plates are KZ format…"', f1sscc: 'f1-data-integrity · "data: every place has an 18-digit SSCC with a valid GS1 check digit…"',
  f1trip: 'f1-data-integrity · "data: every order of a load fits the assigned truck…"', f1exp: 'f1-data-integrity · "data: shelf life — no line is expired at the demo date…"',
  f1fines: 'f1-data-integrity · "data: fines — every attributed fine falls into a waybill…"', f1staff: 'f1-data-integrity · "data: staff — every driver has a 14-day plan…"',
  f1wx: 'f1-data-integrity · "data: weather — every city of the forecast has 7 days…"', f1part: 'f1-data-integrity · "data: partners — city in the network, tier…, contacts…"',
  f1mfr: 'f1-data-integrity · "data: manufacturers — every order line names a registry manufacturer…"', f1rings: 'f1-data-integrity · "data: rings of the baseline…"',
  f2fleet: 'f2-ops-fleet · "ops on the fleet: one running trip per truck and per driver, drivers… C / CE…"',
  f3ref: 'f3-records-portals · "reference data: a new manufacturer entry is active at once…"', f3drv: 'f3-records-portals · "drivers: + Driver needs first and last name…; read-only roles are refused"',
  f3book: 'f3-records-portals · "portal booking: weight per pallet above 1 200 kg…; an address-book entry fills the pickup address"',
  f4vol: 'f4-economics · "baseline volumes: 23 cities sum to 64 249 kg/month…"', f4rings: 'f4-economics · "baseline rings and fleet…"', f4eco: 'f4-economics · "baseline economics: investment…, MRP…, V-21…"',
  f5a11y: 'f5-a11y-layout · "[lang] a11y: every screen, tab and the load drawer — accessible names, unique ids, valid ARIA…"', f5kbd: 'f5-a11y-layout · "a11y keyboard: menu items are focusable links, Enter / Space activate…"',
  f5live: 'f5-a11y-layout · "a11y messages and motion: toasts in a polite live region, labelled combobox, reduced motion…"', f5col: 'f5-a11y-layout · "levels and colours: Go green / No-Go red…; chips ≥ 4.5:1"',
  f5lay: 'f5-a11y-layout · "[ru/en] layout 1024 / 1500 px: no sideways scroll, no one-letter cells"', f5meta: 'f5-a11y-layout · "layout meta: the detectors fire on the faults they are for"',
};
const C = (ref, note) => ({ s: 'covered', ref, note }), A = (ref, note) => ({ s: 'added', ref, note }), N = note => ({ s: 'n/a', ref: '—', note }), G = note => ({ s: 'gap', ref: '—', note });
const BACKEND = 'backend-only (server API status codes, /state withholding, object store, DB records) — v6 is a mock-up without a server';

/* rules: [first, last, verdict] — scenario numbers of the 0.3.9 run; the first matching rule wins */
const R = [
  [1, 18, C(V.nav, 'v6 has 13 menu items with tabs instead of 17 screens; every item and tab opens and renders')],
  [19, 19, C(V.langLinks)], [20, 21, C(V.hub)],
  [22, 26, A(V.f1plates)], [27, 48, A(V.f1sscc, 'rule itself also in ' + V.sscc70)], [49, 70, A(V.f1trip)], [71, 92, A(V.f1exp)], [93, 97, A(V.f1fines)], [98, 110, A(V.f1staff)], [111, 133, A(V.f1wx)],
  [134, 137, C(V.fleet86)], [138, 141, C(V.thermo83)], [142, 150, C(V.rep)],
  [151, 153, C(V.aside74)], [154, 154, C(V.docs76, 'carriage contract for third-party cargo follows the load')], [155, 155, C(V.load70)],
  [156, 156, C(V.play74)], [157, 158, C(V.parity)], [159, 159, C(V.thermo82)], [160, 161, C(V.wx84)],
  [162, 163, C(V.rec90 + '; ' + V.chain30, 'panic test → incident; accept / escalate / close audited')], [164, 165, C(V.docs76)], [166, 166, C(V.chain30)],
  [167, 167, C(V.plan73 + '; ' + V.eco, 'target fleet of 4 (v6 demo fleet has 7 trucks for the other tabs)')], [168, 168, C(V.fleet86)],
  [169, 171, C(V.urgent80, 'urgent trip from the hub, ADR excludes drivers without a certificate, no free truck → partner')],
  [172, 174, C(V.eco, 'import attributes the driver by time; recharge → ack → deduction')],
  [175, 175, C(V.search61)], [176, 199, A(V.f0search)], [200, 201, C(V.scan71 + '; ' + V.search61)], [202, 203, C(V.scan71)], [204, 205, C(V.search61)], [206, 206, A(V.f5live)],
  [207, 208, C(V.tt71)], [209, 209, C(V.zpl71)], [210, 213, C(V.fefo70)], [214, 215, C(V.gate72)], [216, 218, C(V.docs72)], [219, 220, C(V.eco)],
  [221, 222, C(V.staff80)], [223, 224, C(V.finder70 + '; ' + V.part87, 'no own truck → partner candidates')], [225, 226, C(V.staff80)],
  [227, 227, C(V.app81)], [228, 228, G('ADR written instructions in Kazakh inside the driver app are not in v6 (only the app UI is Kazakh)')],
  [229, 230, C(V.wx84, 'sources card, Refresh clears the stale forecast')], [231, 231, C(V.gate72)],
  [232, 255, A(V.f1part)], [256, 275, A(V.f1part, 'contact masking itself: ' + V.part87)],
  [276, 284, C(V.part87)], [285, 286, C(V.chain30)], [287, 288, C(V.part87 + '; ' + V.chain30, 'capability / capacity check of the handover candidates')],
  [289, 296, C(V.part87)], [297, 297, C(V.load70, 'orders handed to a partner are locked in the load')], [298, 298, C(V.docs76, 'partner handover documents in the set')],
  [299, 299, G('v6 track & trace has no "handed to partner" / portal events per place')], [300, 301, C(V.part87)],
  [302, 304, C(V.part87 + '; ' + V.urgent80, 'service request books cost, truck unavailable until closed (v6 blocks assignment instead of a separate gate row)')],
  [305, 314, C(V.part87 + '; ' + V.parity + '; ' + V.aside74)], [315, 317, A(V.f5col)],
  [318, 351, A(V.f0nav, 'title = menu item in RU / DE / EN / KK')], [352, 353, C(V.langAudit)],
  [354, 379, A(V.f4vol, '23 cities on two hubs also in ' + V.eco)], [380, 391, A(V.f4rings, 'legs check also in ' + V.eco)], [392, 399, A(V.f4eco)],
  [400, 402, C(V.parity + '; ' + V.eco)], [403, 404, A(V.f4vol + '; ' + V.f4eco)], [405, 412, C(V.parity + '; ' + V.eco)],
  [413, 413, N('test-page content: the 0.3.9 test page listed the request round FR-35…51; v6 keeps requests in docs/TRACEABILITY.md')],
  [414, 416, C(V.express73)], [417, 417, C(V.part87)], [418, 418, C(V.plan73)], [419, 420, C(V.langAudit)],
  [421, 424, A(V.f2fleet, 'one trip per truck also in ' + V.dbl73)], [425, 426, C(V.thermo83 + '; ' + V.thermo82)], [427, 427, C(V.thermo82)], [428, 428, C(V.frost74)], [429, 429, C(V.stops75)],
  [430, 430, G('ADR responsible person on the trip is not shown in v6')], [431, 431, N('v6 uses fictitious partner names; the named KZ carriers are demo data of 0.3.9')],
  [432, 446, C(V.eco + '; ' + V.costs)], [447, 448, C(V.langAudit)],
  [449, 449, C(V.app81)], [450, 450, N('test-page content: the FR-52…70 request list of the 0.3.9 test page')], [451, 467, C(V.app81, 'incl. dispatcher feed: ' + V.aside74)], [468, 469, C(V.langAudit)],
  [470, 472, A(V.f1mfr)], [473, 482, A(V.f1sscc)], [483, 486, C(V.mfr71 + '; ' + V.parity)], [487, 490, C(V.app81)], [491, 493, C(V.fleet86)],
  [494, 494, C(V.rec90, 'v6 change register page; the 0.3.9 bug table on the test page is test-page content')],
  [495, 505, C(V.load70)], [506, 508, C(V.plan70)], [509, 510, C(V.langAudit)],
  [511, 512, C(V.rec90 + '; ' + V.dash74)], [513, 515, C(V.rec90 + '; ' + V.parity, 'closure lifted early, audited')], [516, 516, C(V.eco)], [517, 520, C(V.rec90)],
  [521, 521, C(V.por, 'tender → lead in CRM')], [522, 522, C(V.rec90)], [523, 524, C(V.langAudit)],
  [525, 533, C(V.help)], [534, 535, C(V.help + '; ' + V.langAudit)], [536, 545, C(V.cov82 + '; ' + V.cov85)], [546, 547, C(V.langAudit)],
  [548, 548, N('React-specific: the sticky trip panel of the 0.3.9 dispatcher; v6 shows the trip detail in the load drawer (fit checked in ' + V.narrow + ')')],
  [549, 549, C(V.eyebrow, 'clock and business date "Astana UTC+5"')], [550, 550, C(V.gate76)], [551, 551, N(BACKEND + ' (409 on concurrent change)')], [552, 553, C(V.langAudit)],
  [554, 566, C(V.load70)], [567, 569, C(V.por)], [570, 576, C(V.por)], [577, 578, A(V.f3book, 'address book; manual address check also in ' + V.names)], [579, 580, C(V.por + '; ' + V.express73)],
  [581, 582, C(V.names)], [583, 583, N('suite isolation step of 0.3.9 (reset to admin), not a behaviour')], [584, 584, C(V.nav)], [585, 586, C(V.langAudit)], [587, 587, N('suite isolation step of 0.3.9 (reset to admin), not a behaviour')],
  [588, 590, C(V.parity, 'simulation label / live telemetry badge')],
  [591, 592, N(BACKEND + ' (polling the server, a second session)')], [593, 593, C(V.banner)],
  [594, 594, A(V.f5kbd + '; ' + V.f5live, 'v6 menu items are focusable role=link items (no href: the mock-up has no URL routes); skip link; live region')], [595, 595, A(V.f5col, 'level shown by the words Go / No-Go next to the colour')],
  [596, 596, C(V.bottom + '; ' + V.narrow)], [597, 597, A(V.f5lay, 'no squeezed cells at 1024 / 1500 px')],
  [598, 599, N(BACKEND)], [600, 600, A(V.f0roles)], [601, 601, C(V.eco, 'own vs external: two signatures of different functions')], [602, 602, N(BACKEND + ' (user references u:<id> resolved by /api/v5/people)')],
  [603, 604, C(V.part87)], [605, 605, A(V.f0roles, 'driver:app only for the driver role')], [606, 606, C(V.app81)], [607, 607, N(BACKEND)], [608, 608, C(V.rec90)], [609, 609, C(V.fleet80)],
  [610, 611, C(V.plan70)], [612, 613, C(V.release72)], [614, 614, C(V.dash74, 'v6 lists ≤ 9 alarms on the dashboard, all in the Alarms tab')], [615, 616, C(V.langAudit)], [617, 617, N('suite isolation step (demo reset)')],
  [618, 618, C(V.rec90)], [619, 619, N(BACKEND + ' (422 / 409 of the demo API); the same rules are covered in ' + V.rec90)], [620, 621, C(V.dash74 + '; ' + V.rec90)], [622, 622, C(V.thermo83)], [623, 624, C(V.langAudit)], [625, 625, N('suite isolation step (demo reset)')],
  [626, 626, N(BACKEND + ' (photo hash from the object store)')], [627, 627, C(V.app81)], [628, 629, N(BACKEND + ' (ePOD record hashes, object store content types)')], [630, 631, C(V.cov82)], [632, 632, C(V.por + '; ' + V.track75)], [633, 634, C(V.langAudit)], [635, 635, N('suite isolation step (demo reset)')],
  [636, 636, C(V.eco)], [637, 637, C(V.part87, 'service request close books a cost')], [638, 638, C(V.costs)], [639, 639, G('logger, temperature and seal at partner handover are not recorded in v6')], [640, 640, C(V.rec90)], [641, 642, C(V.langAudit)],
  [643, 643, C(V.part87)], [644, 644, N(BACKEND)], [645, 645, C(V.app81, 'defect at shift end')], [646, 647, C(V.urgent80)], [648, 649, C(V.eco + '; ' + V.staff80)], [650, 650, C(V.app81)], [651, 651, C(V.express73)], [652, 652, C(V.por)],
  [653, 654, C(V.langAudit)], [655, 655, N('suite isolation step (demo reset)')],
  [656, 658, C(V.nav, 'labels not empty and not duplicated')], [659, 659, C(V.eyebrow)], [660, 660, N('removed function: v6 has no URL routes /dispatch, /temperature…; deep links in ' + V.deep)],
  [661, 661, N('React-specific page structure (one h1 on the 0.3.9 Registry page); v6 tabs share the screen title')],
  [662, 663, C(V.helpRoles + '; ' + V.roles)], [664, 664, A(V.f0roles)],
  [665, 665, C(V.rec90, 'reference data with KATO check')], [666, 668, C(V.rec90, 'inbox routing and transliteration on DE / EN')], [669, 671, C(V.langAudit + '; ' + V.names)],
  [672, 672, N('React-specific: DOM transliteration guard of 0.3.9')], [673, 675, A(V.f0kk)],
  [676, 681, C(V.finder70)], [682, 682, C(V.fleet80)], [683, 683, C(V.rec90, 'reference data four-eyes')],
  [684, 684, C(V.deep, 'document title follows screen / record')], [685, 686, N('removed function: v6 has no browser-history routing (single page without URL routes)')],
  [687, 689, C(V.deep, 'deep links ?load= ?s=&t=; a role without access gets the refusal toast')], [690, 691, C(V.deep + '; ' + V.langAudit)],
  [692, 693, C(V.express73)], [694, 694, C(V.help + '; ' + V.visuals)], [695, 700, C(V.visuals + '; ' + V.parity)], [701, 706, C(V.help)],
  [707, 708, C(V.fleet80)], [709, 709, C(V.lines82)], [710, 710, C(V.abort75)], [711, 713, C(V.mfr71 + '; ' + V.parity)],
  [714, 714, A(V.f3ref, 'manufacturer master; v6 has no file upload for logos (static logo files)')],
  [715, 715, C(V.eco, 'planned values with source')], [716, 716, C(V.rec90, 'users: missing approval functions')], [717, 719, C(V.por, 'GDP self-registration; 0.3.9 run: 718 / 719 failed, date-dependent')],
  [720, 721, A(V.f3ref)], [722, 722, A(V.f3drv)], [723, 725, C(V.rec90)], [726, 726, C(V.design)], [727, 727, G('the design choice is not kept across a reload (no persistence in the mock-up)')],
  [728, 729, A(V.f0icons)], [730, 734, C(V.por + '; ' + V.docs72, 'contracts; NCALayer mock drawer')], [735, 736, C(V.langAudit)], [737, 737, N('suite isolation step (reset to admin)')],
  [738, 741, N('removed function: scenario-number labels separate demo records from DB records (R-26-…); v6 has no DB')],
  [742, 743, A(V.f3book, 'weight per pallet over 1 200 kg named')], [744, 745, C(V.langAudit + '; ' + V.help)], [746, 748, C(V.por + '; ' + V.rec90)], [749, 756, C(V.rec90 + '; ' + V.por)],
  [757, 757, N('backend / multi-tab: a booking from a second tab reaches the first through the server; v6 keeps state per page')],
];
const LR = [   // layout suite (L1…L114) by name
  [/meta/, A(V.f5meta, 'detectors fire on a wide block, a squeezed cell, unnamed control, duplicate id (the 0.3.9 metas re-created the React regressions)')],
  [/1080×900 fleet/, A(V.f5lay, 'no squeezed cells at 1024 / 1500 px')],
  [/skip link/, C(V.design)], [/middle click/, N('v6 menu items are role=link elements without href (no URL routes); keyboard activation added in ' + V.f5kbd)],
  [/reduced-motion/, A(V.f5live)], [/FR-138 idle/, N('React-specific: counts React component re-renders per commit')],
  [/FR-138 (hidden|visible)/, G('v6 keeps its live tick running in a hidden tab (no visibilitychange handling)')],
  [/×844/, C(V.narrow + '; ' + V.bottom, 'phone width (375 px in v6) incl. burger / bottom bar')],
  [/1500×1000/, A(V.f5lay + '; ' + V.f5a11y + '; ' + V.f5col, 'width, cells, a11y rules and contrast at 1500 px')],
  [/1024×768/, A(V.f5lay)],
];
const verdict = x => {
  if (typeof x.n === 'number') { const r = R.find(([a, b]) => x.n >= a && x.n <= b); if (!r) throw new Error('no rule for ' + x.n + ' ' + x.name); return r[2]; }
  const r = LR.find(([re]) => re.test(x.name)); if (!r) throw new Error('no rule for ' + x.n + ' ' + x.name); return r[1];
};
const rows = run.scenarios.map(x => ({ ...x, v: verdict(x) }));
const count = (f) => rows.filter(f).length, by = s => count(r => r.v.s === s);
const tot = { all: rows.length, covered: by('covered'), added: by('added'), na: by('n/a'), gap: by('gap') };
const suites = ['suite.dc.js', 'suite-ext.js', 'suite-layout.js'].map(s => ({ s, n: count(r => r.suite === s), pass: count(r => r.suite === s && r.result === 'pass'), fail: count(r => r.suite === s && r.result === 'fail'),
  c: count(r => r.suite === s && r.v.s === 'covered'), a: count(r => r.suite === s && r.v.s === 'added'), na: count(r => r.suite === s && r.v.s === 'n/a'), g: count(r => r.suite === s && r.v.s === 'gap') }));
const esc = s => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
let md = `# Test parity 0.3.9 → v6

Generated by \`node tools/parity-039/matrix.mjs\` from \`tools/parity-039/scenarios-039.json\` (the recorded 0.3.9 run) and the rules in the script — edit the rules, not this file.

## 1 Validation of the 0.3.9 suite (run ${run.run.date})

| Suite file | Where it runs | Scenarios | Passed | Failed | Skipped |
|---|---|---|---|---|---|
| \`frontend/tests-ui/suite.dc.js\` (494 ported v5.2 concept scenarios) | \`releases/0.3.9/tests.html\` over http, headless Chromium | ${suites[0].n} | ${suites[0].pass} | ${suites[0].fail} | 0 |
| \`frontend/tests-ui/suite-ext.js\` (platform extensions) | same page, after suite.dc.js | ${suites[1].n} | ${suites[1].pass} | ${suites[1].fail} | 0 |
| \`frontend/tests-ui/suite-layout.js\` (layout + a11y, driven by \`scripts/ui_suite.py\` \`run_layout\`) | \`releases/0.3.9/platform*.html\`, 17 screens × 390 / 1024 / 1500 px × RU / EN + extras | ${suites[2].n} | ${suites[2].pass} | ${suites[2].fail} | 0 |
| \`scripts/ui_suite_backend.py\` (backend-mode suite, ~757 scenarios against a live server) | needs PostgreSQL + the 0.3.x backend | — | — | — | not run |

Run time: ${run.run.wall_s} s for the 757 demo scenarios (3 language-match scenarios take ≈ 47 s each), layout suite ≈ 2 min.

Findings of the run:
- **718 / 719 fail — date-dependent, not a product bug.** "Партнёр · демо-аккаунт…: Подача: сертификат…" fills the audit date from the wall clock (\`new Date()\` − 10 days = 10.10.2026 on 20.10.2026) while the demo business date is frozen at 06.10.2026, so the audit lies in the future and the submission is refused; 719 depends on 718. The source fixed this class of test after 0.3.9 (Q5 hand-over: dates relative to the business date), the frozen release still has it.
- Other date-sensitive scenarios that pass today but read calendar values: 75–92 "срок годности не истёк к 10.2026" (fixed month), 153 "Перенос … на 10.10", 161 "показывает 12.10", 225 "ДОПОГ … через 39 дней", 549 "Вт 06.10.2026" (frozen server date) — v6 equivalents compare with the demo's NOW / RES.TODAY.
- Flaky: none seen in this run; the 0.3.9 page reloads the platform between module groups (FR-136), which keeps it stable but slow.
- Backend-only content in the demo suites: scenarios that assert server status codes (409 / 415 / 422), the /state withholding, the object store and the DB records (marked n/a below).
- \`frontend/tests-ui\` in the source checkout is 0.3.10 now (needs \`npx vite build\`, which \`scripts/ui_suite.py\` calls and which does not run on Windows); the frozen 0.3.9 build is the authoritative copy and was run instead.

## 2 Totals

| | Scenarios | Covered before R6 | Added in R6 | Not applicable | Gap (v6 lacks the function) |
|---|---|---|---|---|---|
${suites.map(s => `| ${s.s} | ${s.n} | ${s.c} | ${s.a} | ${s.na} | ${s.g} |`).join('\n')}
| **All** | **${tot.all}** | **${tot.covered}** | **${tot.added}** | **${tot.na}** | **${tot.gap}** |

R6 tests: \`platform-src/tests/f0-shell-parity.js\`, \`f1-data-integrity.js\`, \`f2-ops-fleet.js\`, \`f3-records-portals.js\`, \`f4-economics.js\`, \`f5-a11y-layout.js\` (37 groups). With them \`platform/tests.html\` runs 312 / 312 groups in ≈ 63 s headless (before R6: 275 in ≈ 55 s); the slowest group takes < 2 s, every R6 group < 1.1 s. Gaps are follow-ups for the product, listed in section 4.

## 3 Matrix

Status: **covered** = an existing v6 test checks the same behaviour · **added** = R6 test · **n/a** = not applicable (reason) · **gap** = v6 lacks the function.
"0.3.9" = result of the recorded run.

| # | 0.3.9 module (screen) | Scenario — what it asserts | 0.3.9 | Status | v6 test (file · group) | Note |
|---|---|---|---|---|---|---|
${rows.map(r => `| ${r.n} | ${esc(r.mod)} | ${esc(r.name)} | ${r.result} | ${r.v.s} | ${esc(r.v.ref)} | ${esc(r.v.note || '')} |`).join('\n')}

## 4 Gaps (follow-ups, not tested because v6 lacks the function)

${rows.filter(r => r.v.s === 'gap').map(r => `- ${r.n} · ${esc(r.mod)} · ${esc(r.name)} — ${r.v.note}`).join('\n')}
`;
writeFileSync(join(root, 'docs', 'TEST-PARITY-0.3.9-v6.md'), md);
console.log(JSON.stringify({ tot, suites }));
