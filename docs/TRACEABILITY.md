# Traceability — LH / FR → v6 tab → test

One line per implemented requirement (docs/INTEGRATION-PLAN.md, section 4). Test names are the `group(...)` titles in `platform-src/tests/*.js`
(run `platform/tests.html`). Areas append their own rows; keep the table sorted by workstream, then by FR.

## W4 — Customers & portals (files `platform-src/v6/screens/5xx-*.js`, help `v6/help/por-portals.js`, tests `tests/a0-por-portals.js`)

| LH / FR | Function | v6 place | Test |
|---|---|---|---|
| LH-M2 · FR-147 | Offers with price lock (14 days), sample sheet, accept → booking at the locked price | Orders & Loads → Commercial → Offers; customer portal → My bookings (own offers, "Book with the offer") | por: offers lock the price for 14 days and accept into S.bookings |
| LH-M2 · FR-148 | Customer price lists: framework (discount) / spot, diesel base, fuel surcharge, versions never edited, deactivate falls back | Commercial → Price lists; `termsOf()`, `priceFor()` | por: price lists — framework discount, fuel surcharge, deactivate falls back to line tariff |
| LH-M2 · FR-149 | Contracts from template: draft → sent → signed (SHA-256 of the text, signer) / void; signed framework contract enables payment on account | Commercial → Contracts; customer portal → My bookings (sign, demo NCALayer) | por: contracts — draft → sent → signed in the portal; framework enables payment on account |
| LH-M2 · FR-152 | Daily NBK rates KZT with EUR/USD, stale after 2 business days, manual rate by finance; EUR/USD shown next to every price | Commercial → FX rates; `fxLatest()`, `fxLine()` in offers and the booking form | por: CRM — … (fx part); por: customer books … |
| LH-M3 · FR-189 | BIN/IIN check digit (weights 1…11 / 3…11,1,2), kind by 5th digit, IIN masked, register autofill of the company name | Commercial → Customers (new customer), payer in the booking form, partner self-registration, CRM lead | por: BIN/IIN check digit, mask, register autofill, customer created |
| FR-150 | Customer address book (own sites) used in the booking form | Commercial → Customers → address book; Book a shipment → "From the address book" | por: BIN/IIN … (address part); por: customer books … |
| FR-151 | Address check against the city street directory; unknown street → manual check by staff before confirmation | `addrCheck()`; booking `addrCheck: 'manual'`; Customers → "Address checked" | por: BIN/IIN … (`addrCheck` manual/ok/bad); por: customer books … (`addrCheck === 'manual'`) |
| FR-127 | CRM leads by stage, tenders with number + deadline + BIN, won lead → customer onboarding with portal access and task | Commercial → CRM, Tasks | por: CRM — public request becomes a lead, tender needs deadline, won lead onboards a customer with a task |
| LH-M1 · FR-146 | Booking: pickup AND delivery address, goods categories GDP/GLP/GMP/food restricting the temperature zone, pallets, weight, place dimensions | Customer portal → Book a shipment | por: customer books with DG, insurance, payer, SMS …; por: routing never answers "no line" … |
| LH-M1 · FR-155 | Route via hub / two hubs for every city pair, legs, lead time in business days; never "no line"; hub handling fee on transshipment | `routeFor()`, price block of the booking form, offers, tracking card | por: routing never answers "no line" — every city pair has a route |
| LH-M1 · FR-185 | Weight plausibility warnings (kg per pallet low/high/limit, sum of places, oversize, height), never blocking | Book a shipment → cargo block; `loadWarnings()` | por: routing … (`loadWarnings` cases) |
| LH-M1 · FR-154 | Express request with 3-manager approval note, surcharge, pending state, slot after approval | Book a shipment → Express; My bookings (express status) | por: customer books … (express pending) |
| LH-M1 | Price + slots shown immediately (next departures with free pallet places, cut-off, pickup and ETA dates) | Book a shipment → "Price and slots"; `slotsFor()` | por: routing … (slots); por: customer books … |
| FR-153 (part) | Cargo insurance: declared value → premium 0.15 % (min 3 000 ₸), outside VAT, EUR/USD view | Book a shipment → Insurance; price breakdown | por: customer books … (`premium >= 3000`) |
| LH-M3 · FR-186 | Payer (agent / broker / forwarder) books on behalf, BIN/IIN checked, invoice to the payer, data masked | Book a shipment → Payer; My bookings ("invoice to payer") | por: customer books … (`payer.invoiceTo === 'payer'`) |
| LH-M3 · FR-187 | Booking confirmation by e-mail (default) and SMS (opt-in), message preview shown as sent (demo), no personal data in the text | Book a shipment → notifications; confirmation card | por: customer books … (`messages.length === 2`) |
| LH-M4 · FR-190 (customer side) | Bookings written to `S.bookings` with status new/confirmed/rejected/cancelled; customer cancels a not yet confirmed booking | Customer portal → My bookings | por: customer books … (cancel) |
| LH-L2 · FR-30 / FR-68 | Partner portal: only the own handovers (Dispatch → Partners), SSCC packages, ePOD upload (consignee, signature, photo, scans) → load delivered, POD queue | Partner portal → My handovers and ePOD | por: partner portal — own handovers only, ePOD needs signature and scans … |
| LH-L2 · FR-172 | Partner self-registration with BIN and GDP proof, pending until staff approval; GDP submission for an existing partner | Partner portal → Profile and GDP; approval in Commercial → CRM | por: partner portal … (registration + `cmPqOk`) |
| FR-02 | Public request form without login → CRM lead "website (form)", honeypot, consent | Public → Transport request (`route request`, deep link `?request=1`) | por: CRM — public request becomes a lead … |
| FR-112 | Public tracking: status steps, route via hubs (cities only), lead time, temperature compliance yes/no, partner last mile; no personal data | Public → Shipment tracking (`route track`) | por: public tracking — deep link ?track for every role, no personal data, not found |
| FR-175 | Deep link `?track=<booking or load id>` opens the tracking card for every role (ALWAYS list) | `530-public.js`, `roles.js` ALWAYS | por: public tracking … (deep link iframe) |
| Convention | 4 languages without undefined/NaN, DE/EN without Cyrillic, portal help articles visible to the portal roles | help `por-portals.js` (7 articles) | por: all W4 screens render in 4 languages …; help: every article of every language is complete and DE/EN have no Cyrillic |

Not in the mock-up (documented only, plan section 6): real NCALayer signature and KGD register call, real e-mail/SMS gateway, WhatsApp/Telegram (FR-188), persistent storage of bookings.
