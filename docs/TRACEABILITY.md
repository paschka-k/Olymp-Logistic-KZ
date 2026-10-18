# Traceability: LH/FR → tab → test

## W3 Records & administration
Tests are in `platform-src/tests/90-rec-records.js`; screens in `platform-src/v6/screens/400-460-rec-*.js`; help in `platform-src/v6/help/rec-records.js`.

| LH / FR | Tab (menu) | Test (group name starts with) |
|---|---|---|
| LH-E3, FR-101, FR-104, FR-105 | Dashboard / Alarms | `alarms:` (escalation, ack, close note; load turning problem) |
| FR-110, FR-135, LH-P1 | Dashboard / Inbox | `inbox:` |
| LH-M4, FR-190 | Orders / Bookings (+ menu badge) | `bookings:` |
| LH-M5, FR-28, FR-153 | Billing / Insurance | `insurance:` |
| LH-A2, LH-A3, FR-78, FR-135, FR-169, FR-174, FR-176 | Settings / Reference data | `reference data:` |
| FR-166, LH-E3 | Settings / On-call | `on-call:` |
| LH-Q1, FR-14, FR-85, FR-137, FR-167 | Settings / Users & roles | `users:` |
| LH-Q3 | Settings / Audit log | `audit:` |
| FR-173, LH-P1, LH-P2 | Settings / Integrations catalogue | `integrations catalogue:` |
| Change register (190 FR/BUG) | route `changes` | `changes page:` |

Skipped in the mock-up: real SMS/e-mail/call delivery and the 5-minute timer (simulated by a button), HMAC audit chain (demo hash), encrypted contacts (masked strings), NCALayer e-signature, WhatsApp/Telegram (FR-188, legal question open), logo upload for manufacturers (FR-176: only the master record).
