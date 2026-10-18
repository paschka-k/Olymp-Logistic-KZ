# Traceability — LH / FR → v6 tab → test

One line per implemented requirement. Each workstream appends its own section; tests live in `platform-src/tests/*.js` (group names quoted).

## W5 · Economics, reports & baseline data

| LH / FR | Function | v6 menu → tab | Source file | Test (group) |
|---|---|---|---|---|
| LH-N2, FR-125 | Bottom-up cost model (diesel, service, detention/downtime, insurance, taxes) next to the actuals register, plan / actual by category | Billing & Invoices → Cost model → Summary / Diesel & service / Insurance, tax, registration | `v6/screens/600-eco-costmodel.js` | cost model: bottom-up categories, cost + 5 %, transfer prices, diesel what-if |
| FR-47 | Cost + 5 % tariff and transfer prices per ring vs LTL 228 ₸/kg | Billing & Invoices → Cost model → Summary | `600-eco-costmodel.js` | cost model: bottom-up categories, cost + 5 %, transfer prices, diesel what-if |
| LH-N2, FR-85 | Own vs external carrier, gap > 50 % needs two signatures bound to business functions (approvals:sign / costs:approve), four eyes, stale after diesel change, XO-n order booked to the actuals register | Billing & Invoices → Cost model → Own or external | `600-eco-costmodel.js` | own vs external: >50 % gap needs two signatures of different functions · own vs external: diesel price change makes signatures stale |
| LH-O1, FR-119 | KPI: OTIF, load factor, express share (weight / budget), cost per kg, CSV / JSON export | Reports → KPI | `v6/screens/610-eco-reports.js` | reports: KPI and express × temperature crossing react to decisions |
| I-12 (LH-N1 context) | Express × temperature crossing report, move express load to regular cycle | Reports → Express × temperature | `610-eco-reports.js` | reports: KPI and express × temperature crossing react to decisions |
| FR-07, FR-122, FR-123 | Imported fines, driver attributed by trip-sheet segment at offence time, manual attribution, pay / recharge / acknowledge / deduct (HR reason, 50 % cap) / write-off, payroll export, company payment to ledger | Reports → Fines | `610-eco-reports.js` | fines: import attributes driver by time … · fines: deduction without acknowledgement needs an HR reason |
| LH-O2, FR-35 | Fragenkatalog: 150 answers in 20 sections with status (covered / deviation / question to KDL / no data) | Settings → Baseline data → Fragenkatalog · 150 | `v6/screens/620-eco-baseline.js`, data `615-eco-baseline-data.js` | baseline: 150 questions, FR-49 open until all KDL questions clarified |
| FR-49 (stays open) | Deviations V-01…V-24 and 12 gaps; FR-49 closes only when all 5 questions to KDL are clarified (audited) | Settings → Baseline data → Deviations | `620-eco-baseline.js` | baseline: 150 questions, FR-49 open … |
| FR-174 | Planned values (26) with check status; legal / tax check points | Settings → Baseline data → Planned values · Launch · legal · West | `620-eco-baseline.js` | baseline: 23 cities on two hubs, target fleet 4, legs check, critical path |
| FR-36, FR-37 | 23 cities assigned to Astana / Almaty hubs per P86; Karaganda and Atyrau as transshipment points | Settings → Baseline data → Network & volumes | `620-eco-baseline.js` | baseline: 23 cities on two hubs … |
| FR-38 | Target fleet of 4 trucks (10-t class), rings and volumes per ring | Settings → Baseline data → Fleet & economics, Network & volumes | `620-eco-baseline.js` | baseline: 23 cities on two hubs, target fleet 4 … |
| FR-48 | Launch critical path to the first R1 trip, target mid-December 2026, done / at-risk marks | Settings → Baseline data → Launch · legal · West | `620-eco-baseline.js` | baseline: … critical path |
| — | Cold-chain "West" decision items (cooling, winter closure, empty return, Atyrau, hub) | Settings → Baseline data → Launch · legal · West | `620-eco-baseline.js` | baseline: … critical path |
| — | All W5 tabs and help articles render in RU / DE / EN / KK without undefined / NaN | all of the above | `v6/help/eco-*.js` | [ru/de/en/kk] W5 tabs render without undefined/NaN |

Not in W5: capacity plan, 7-day scenarios and target-fleet simulation on Dispatch → Planning (W1); the 3-signature express approval itself (W1, FR-41/126/154) — the I-12 report only analyses.
