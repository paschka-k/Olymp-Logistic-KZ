# R4 — ideas I-8, I-12, I-13, I-14 in platform v6

Source: `Olymp-Logistic-Platform/docs/specs/03_Ideenliste_Nice-to-have_GER.md` (ideas list of the product owner).
All four ideas are mock-ups: no backend, data lives in the page; every rule change and decision is written to the audit log
(`S.audit`, hash chain from 400-rec-core). Texts in RU / DE / EN / KK; DE / EN without Cyrillic.

| Idea | Benefit (ideas list) | Place in v6 | Files |
|---|---|---|---|
| I-8 Saved views, column filters, export in lists | faster work for dispatch and warehouse | Tool bar + filter row on six main lists: Orders & Loads → Loads (`orders/orders`), Orders · records (`orders/rec`), Fleet → Fleet, Drivers → Drivers, Dispatch Board → Partners, Billing & Invoices → Invoices | `screens/700-list-views.js`, CSS block "R4" in `app.css` |
| I-12 Express × temperature overlap | secures 78 % of the planned saving | Reports → Express × temperature: new section under the W5 report — by week / route / customer: express loads, temperature loads, overlap %, planned saving, secured saving, share against the 78 % target, already moved; CSV | `screens/730-express-overlap.js` |
| I-13 SLA measurement and penalties for KDL Olymp | protection with 100 % cluster risk | Reports → SLA · KDL Olymp (monthly measurement, penalty calculation with caps, dispute flag, freeze); Billing & Invoices → SLA statement (penalty lines on the customer statement); definitions in Settings → Rules · SLA & winter | `screens/720-sla.js`, `screens/710-rules-winter.js` (rule set `sla`) |
| I-14 Winter concept as a rule set | safe cold chain at −30 / −40 °C | Settings → Rules · SLA & winter (rule set `winter`, versioned, four eyes); Dispatch Board → Winter rules (forecast per hub, cold-snap scenario, trips under a tier, pre-conditioning confirmation, heating windows, surcharge and price); Go/No-Go release check "Winter rules"; winter surcharge line in the booking price / commercial offer | `screens/710-rules-winter.js`, one row in `screens/420-rec-bookings.js` (offer) |

## How it works

**Rule sets (I-13, I-14).** `RULES.sets.{winter,sla}` hold the active data, version, valid-from date and history. `ruleSave(set, data, validFrom)`
validates ranges (and for winter: tier 2 colder and not milder than tier 1) and creates a *pending* version; it needs `planning:admin` or
`costs:approve`. `ruleDecide(set, ok)` needs `approvals:sign` and a role other than the author (four eyes). Approved versions supersede
the previous one and take effect at once in operations (tiers, surcharge, penalties); rejected ones stay in the history.

**Winter (I-14).** Tier = the colder forecast minimum of the trip's origin / destination hub against the thresholds (default −30 / −40 °C).
A tier asks for pre-conditioning (45 / 60 min), limits open doors (15 / 8 min), sets heating windows (every 4 / 2 h) and adds a surcharge
(8 / 15 % of the base rate). The October forecast triggers nothing; the scenario button "cold snap −34 / −42 °C" (Astana / Karaganda /
Atyrau) shows the rules in action. While a tier applies, the Go/No-Go release has an extra check "Winter rules" that is red until the
pre-conditioning is confirmed (before departure only, audited); a red check needs the existing override path (`trips:override_release`).

**SLA (I-13).** Four indicators: OTIF (delivered, no excursion, POD not rejected, within the ETA window), temperature compliance (running
and delivered loads without a breach), arrival within ±ETA window, documents at least N hours before arrival. Penalty per indicator =
shortfall in percentage points (one decimal) × rate, at most the indicator cap; the month at most the overall cap (default 5 % of the
month's revenue). Jul–Sep are closed demo months; October is computed from the loads (arrival deviation and document lead time are
deterministic demo telemetry per load id until real timestamps exist). Dispute: finance opens it with a reason (≥ 10 characters), the line
is held; it ends as "penalty stands" or "waived" — waiving needs `approvals:sign` and a role other than the one who opened the dispute.
"Freeze measurement" fixes the month, "Post penalties to the statement" (once, frozen months only) puts the lines on the KDL Olymp statement.

**Express overlap (I-12).** Express = flag `express` or high priority (as in W5). Planned saving = all express moved to the regular cycle
(1 440 → 228 ₸/kg, G30); secured = the saving of express loads that are temperature shipments (they can ride in the regular cold-chain
cycle); target 78 % (G29). Decisions "Move to regular cycle" from the W5 list count as "moved".

**Lists (I-8).** `lvWrap(key, html)` wraps the existing tab body (no edits to the screen files): it parses the list's table (or the div
rows of Orders · records), adds a filter field under every header, removes non-matching rows and puts a tool bar above: view selector,
name + "Save view", "Delete view" (own views), "Reset filters", "CSV", row count. A view stores the column filters and, for Loads, the
screen filters (`S.f`); two preset views for Loads (problem loads, high priority). Views persist in `localStorage` (`kz-r4-views`,
guarded). Column filters on Loads act on the current page; the CSV walks every page with the same filters. Save / delete / CSV are audited.

## Not done / open

- SLA definitions are global for KDL Olymp; per-route or per-branch targets and a contract PDF are not modelled.
- Arrival times and document timestamps are demo telemetry; with real ePOD / EDO timestamps `slaArrDev` / `slaDocLead` are replaced.
- The winter forecast is a per-hub demo value with a scenario switch; the W-Monitor Kazhydromet table (150-monitor) is not wired to it.
- Lists: sorting by column and server-side views (shared between users) are out of scope of the mock-up.
- The penalty statement is a view with a "posted" stamp; no credit note document / ESF correction is generated.
