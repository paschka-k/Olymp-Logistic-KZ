# Platform source architecture (S4, wave 2)

The platform stays a mock-up: vanilla JS, no backend, one `<script>` per language assembled by `platform-src/build-v6.mjs`.
Everything below is about how the sources are organised so that parallel branches do not collide.

## Bundle order
```
platform-src/v6/base/*.js        name order   00-i18n  05-strings  10-locale  20-export  30-kit  40-state      (FR-199, 221, 201, 200, 202)
platform-src/v6/core.js · roles.js · data.js
platform-src/v6/screens/<area>/NNN-name.js    ALL area folders together, sorted by file name        (FR-203)
platform-src/v6/help/*.js        name order
platform-src/v6/app.js
```
`platform-src/v6/screens/ORDER.txt` records the order of the screen files. `node tools/check-areas.mjs` fails when the files on disk differ
from it, so moving a file between area folders can never change the build (verified: the pages were byte-identical before and after the move).

## Area folders and ownership (FR-203)
One folder per menu area under `v6/screens/`; `platform-src/OWNERS.json` names the area owners (streams) and the menu items each area serves.

| folder | menu | typical content |
|---|---|---|
| `shell` | – | shell extension, accessibility, notes, mirror shell, delivery (common ground) |
| `shared` | – | Kazakhstan map, records core, list views (common ground) |
| `dashboard` `orders` `dispatch` `fleet` `drivers` `routes` `hubs` `pod` `billing` `reports` `ai` `settings` | the menu item of the same name (`settings` also serves baseline data and the change register) | the screen and every tab other streams added to it |
| `portals` | – | customer portal, partner portal, public views |

**Numbering rule.** File name `NNN-kebab-name.js`; `NNN` is the build order. First digit = layer: 0xx core menu screens, 1xx menu add-ons, 2xx operations,
3xx resources, 4xx records and administration, 5xx commercial and portals, 6xx economics, 7xx rules and report extensions, 9xx delivery.
A new file takes the next free number of its layer and must not reorder existing files. File names are unique across all area folders.

**Cross-area edits.** A branch works in the folder(s) of its area (plus its tests `tests/*`, help articles `help/*`, strings `v6/strings/*`).
CI (`lint.yml`) runs `node tools/check-areas.mjs` (structure, naming, order: blocking) and, on a pull request, `--base origin/<base>` (which areas the PR touches: report).
Locally: `node tools/check-areas.mjs --base main --own orders,dispatch` exits 1 when a file of another area (including `shell` / `shared`) changed.

## Shared building blocks (base layer)
| file | what | doc |
|---|---|---|
| `base/00-i18n.js` | `LANG`, `LI`, `T(ru, de, en, kk)` bridge | docs/I18N.md |
| `base/05-strings.js` | `LT('key', ...args)` keyed string tables per language, KK review marker | docs/I18N.md |
| `base/10-locale.js` | `LF.*` numbers, tenge, dates, times, units per language | below |
| `base/20-export.js` | `XP.*` CSV / JSON / Excel demo / PDF-document exports | below |
| `base/30-kit.js` | `KIT.*` KPI tile, key/value, chip, filter select/bar, table, field, drawer frame | below |
| `base/40-state.js` | JSDoc types, `schemaCheck()`, `registerAction` / `bindActions` | below |

* **Locale formatting (FR-221)** - never call `toLocaleString` or `replace('.', ',')` in a screen: `LF.int(n)`, `LF.n(n)`, `LF.dec(x, digits)`, `LF.kzt(n)`, `LF.date(iso)`, `LF.dt(iso)`, `LF.hm(min)`, `LF.unit('km')`, `LF.q(12, 'kg')`, `LF.temp(t)`.
  The per-language profile is `LOCALE` in the same file (one place to change a format; a test scans the bundle).
* **Exports (FR-201)** - `XP.saveCsv(name, rows)`, `XP.saveJson(name, obj)`, `XP.openDoc(html)`, `XP.csv(rows)`, `XP.name('fleet', 'csv')`. BOM, `;`, quoting and the
  formula-injection guard (`= + - @ TAB CR` in a text cell get a leading `'`) are in one place. Downloads use `<a download>`, so the test harness records them in `w.__downloads`.
* **UI kit (FR-200)** - screens call `KIT.table(head, rowsHtml, {id, attrs, cols, empty})`, `KIT.kpi`, `KIT.kv`, `KIT.filterSelect(attr, () => state)`, `KIT.chip`, `KIT.field`,
  `KIT.sectionHead`, `KIT.drawer`. New screens must not copy these helpers; a variant that really differs gets a new KIT function, not a private copy.
* **State and actions (FR-202)** - the demo state `S` is described with JSDoc (`Load`, `Driver`, `Truck`, `AuditEntry`, `AppState`) and checked by `schemaCheck()` at startup
  (`S.schemaProblems`). Write actions are declared with `registerAction(name, {area, perm, audit})` (core.js `ACTION_DEFS`): the click handler checks the permission, and an
  `audit` rule makes the action write its own audit-log entry, only when it changed what it watches.

## Test hooks (FR-207)
Tests select by `data-test`, never by visible text. The hooks are the same in every language: `nav:<id>`, `tab:<screen>:<key>`, `kpi`, `table`, `filters`, `drawer`, `drawer-close`,
`toast`, `role-select`, `lang:<code>`, `mark:<code>` (shipping label marks). Add `data-test` when you add a control a test needs; see `tests/g4-architecture.js`.

## Formatting and lint (FR-204)
`tools/lint` pins ESLint and Prettier. `.prettierignore` lists the files that are not yet formatted (the long one-line markup helpers of the v6 sources). When an area is next
refactored, remove its lines from `.prettierignore` and commit the reformatting alone ("format only", no behaviour change), as was done for the tooling files.
All text files are LF (`.gitattributes`); the build also normalises CRLF in sources.
