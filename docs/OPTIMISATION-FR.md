# Optimisation proposals for v6 — FR-191 … FR-225

Status: **all 35 released by the product owner on 2026-10-20** ("go ahead and realise all the FR"); implemented in branch sessions in three waves (see "Realisation plan" at the end).
Numbers continue the change register of the source platform (highest used: FR-190). Effort: S ≤ 1 day · M ≤ 1 week · L > 1 week. Priority: H / M / L.

Facts behind the list (measured on 6.2.1): each language page is about 2.9–3.0 MB and carries the texts of all four languages; every user action re-renders the whole page through one `render()`; a 2-second live tick runs while the simulation is on; 14 screen files carry their own copy of the CSV / file export code; the UI suite has 275 checks and needs about 4 minutes in CI; `build-platform.yml` still runs on Node 20 and `ubuntu-latest`.

## A · Performance

| FR | Title | What changes | Benefit | Effort | Prio |
|---|---|---|---|---|---|
| FR-191 | Per-language build | The build keeps only the page language of every `T(ru, de, en, kk)` tuple. | Page weight from ~3.0 MB to ~1.2 MB, faster first load. | S | H |
| FR-192 | Lazy screen modules | Core + one chunk per menu area, loaded on first visit; single-file build kept for offline demos. | Faster start, less memory. | M | M |
| FR-193 | Partial re-render | Render only the region that changed (main, drawer, top bar); keep focus and scroll position. | No flicker, inputs keep focus, lower CPU. | M | H |
| FR-194 | Live-tick budget | The tick updates only `data-live` nodes (position, temperature, ETA); full render only on user action; < 4 ms per tick. | Smooth UI on weak laptops and phones. | S | H |
| FR-195 | Virtualised long tables | Windowing / paging for collection points (600+), audit log, readings, inbound lists. | Constant speed with large data. | M | M |
| FR-196 | Asset pipeline | Optimised SVG, PNG → WebP, preload of brand assets, weight budget per page. | Lighter pages, sharper logos. | S | L |
| FR-197 | Lazy demo data | Generate data per area on first use, memoised and seeded; time to interactive < 1.5 s. | Faster start. | M | M |
| FR-198 | Performance budget in CI | CI fails when page weight, start time, tick or render cost exceed the budget. | Regressions caught before deploy. | S | H |

## B · Architecture and maintainability

| FR | Title | What changes | Benefit | Effort | Prio |
|---|---|---|---|---|---|
| FR-199 | String tables per language | Texts move from inline tuples to keyed tables per language. | Native-speaker review (I-26), clean diffs, basis for FR-191. | M | M |
| FR-200 | Shared UI kit | One implementation each for table, filter bar, KPI tile, drawer, form field and chip. | Consistent look, fewer bugs, faster features. | M | H |
| FR-201 | Shared export helper | One helper for CSV / PDF / Excel demo exports replaces 14 copies (BOM, separator, formula-injection guard, dated file names). | Uniform exports, testable in one place. | S | H |
| FR-202 | Typed state model | JSDoc types and a schema check at startup; named actions in an action registry that feeds the audit log. | Fewer runtime errors, clearer audit. | M | M |
| FR-203 | Area folders and ownership | One folder per menu area, numbering rule, check against cross-area edits. | Fewer merge conflicts between parallel branches. | S | M |
| FR-204 | Lint, format, line endings | ESLint + Prettier in CI; `.editorconfig` and `.gitattributes` with one line-ending policy. | Clean code, no CRLF / LF noise. | S | H |

## C · Tests and CI

| FR | Title | What changes | Benefit | Effort | Prio |
|---|---|---|---|---|---|
| FR-205 | Sharded UI suite | CI runs the suite files in parallel shards; target < 2 min. | Faster feedback. | S | H |
| FR-206 | Deterministic clock | One injectable "today" for demo and tests. | No date rot, like the failures fixed in the platform repo (Q5). | S | H |
| FR-207 | Test hooks | `data-test` attributes instead of text selectors, the same in every language. | Robust, language-independent tests. | M | M |
| FR-208 | Visual regression | Snapshots of key screens at 1440 / 768 / 375 px, light and dark. | Layout breaks caught automatically. | M | M |
| FR-209 | CI hygiene | Node 22 in `build-platform.yml`, pinned runner image, Playwright cache, screenshots of failures as artifacts. | Stable, faster CI; no deprecation warnings. | S | H |
| FR-210 | Flaky-test quarantine | Automatic retry with a report of flaky checks (e.g. the one-off "opsPlaces is not defined"). | Trustworthy red / green. | S | M |

## D · User experience

| FR | Title | What changes | Benefit | Effort | Prio |
|---|---|---|---|---|---|
| FR-211 | Command palette | Ctrl+K combines global search, navigation and actions. | Fast work for power users. | M | M |
| FR-212 | Remembered preferences | Language, hub filter, saved views, last tab and theme remembered per viewer in the browser. | Users resume where they left off. | S | H |
| FR-213 | Uniform empty, loading and error states | Every list has the same states with a next-step action. | Clearer guidance. | S | M |
| FR-214 | Undo instead of confirm | Reversible actions show an "Undo" toast for 10 s. | Fewer dialogs, fewer mistakes. | M | M |
| FR-215 | Keyboard and focus | Focus trap in drawers, Esc, focus returns to the trigger, shortcut list. | Accessibility and speed. | S | H |
| FR-216 | Role home pages | Each role first sees its 4–6 most important tiles (dispatcher, warehouse, driver, finance, customer, partner). | Less searching per role. | M | M |
| FR-217 | Notification centre | Alarms, inbox and tasks in one list: read / unread, snooze, assign. | Nothing gets lost between three places. | M | M |

## E · Accessibility and languages

| FR | Title | What changes | Benefit | Effort | Prio |
|---|---|---|---|---|---|
| FR-218 | WCAG 2.2 AA check in CI | axe checks on every screen (as `axe_probe.py` in the platform), contrast tokens, labels, landmarks. | Accessible demo, tender-ready. | M | H |
| FR-219 | Reduced motion and high contrast | High-contrast theme; every chart also as a table or text. | Usable for all viewers. | S | M |
| FR-220 | Kazakh completeness | Fill the shortened KK texts, mark machine translations, review workflow (I-26). | Professional KK interface. | M | M |
| FR-221 | Locale formatting | One helper for numbers, ₸, dates and units per language. | Consistent number and date formats. | S | H |

## F · Demo, documents and delivery

| FR | Title | What changes | Benefit | Effort | Prio |
|---|---|---|---|---|---|
| FR-222 | Demo scenario presets | "Normal day", "Winter storm", "Peak season", "West route" reset all data consistently. | Convincing presentations in seconds. | M | H |
| FR-223 | What's new panel | In-app changelog per version, generated from `TRACEABILITY.md`, linked to `versions.html`. | Users see changes after each release. | S | M |
| FR-224 | Print stylesheet | A4 print / PDF for documents, reports and trip sheets: headers, page breaks, no navigation. | Usable paper output. | S | M |
| FR-225 | Offline demo | Service worker caches the pages and assets. | The demo works without internet at customer sites. | S | M |

## Realisation plan (released 2026-10-20)

The cross-cutting refactors touch almost every file, so they wait until the running feature streams R1–R6 are merged; otherwise every merge would conflict.

| Wave | Branch | FRs | Starts |
|---|---|---|---|
| 1 | S1 · CI and test infrastructure | FR-198, FR-205, FR-206, FR-208, FR-209, FR-210 | now |
| 1 | S2 · Delivery | FR-196, FR-223, FR-224, FR-225 | now |
| 1 | S3 · Accessibility | FR-215, FR-218, FR-219 | now |
| 2 | S4 · Architecture | FR-199, FR-200, FR-201, FR-202, FR-203, FR-204, FR-207, FR-220, FR-221 | after R1–R6 and wave 1 are merged |
| 3 | S5 · Performance | FR-191, FR-192, FR-193, FR-194, FR-195, FR-197 | after S4 is merged |
| 3 | S6 · User experience | FR-211, FR-212, FR-213, FR-214, FR-216, FR-217, FR-222 | after S4 is merged, in parallel with S5 |
