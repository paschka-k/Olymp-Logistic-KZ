const TIPS = {
  tiers: 'Gold — preferred partner: GDP, 2–8 °C, handover without approval. Silver — allowed, handover after dispatcher approval. Bronze — only 15–25 °C goods without ADR, manual. Blocked — no work allowed, reason recorded (CAPA / deviation).',
  handover: 'Hand a shipment over to a partner, fully or partly: the system uses the route cities, package requirements (2–8 °C, ADR) and partner tier. A handover report, carrier waybill and temperature sheet are created; SSCC scans continue at the partner.',
  track: 'Every package (SSCC) is scanned at the hub when picked, when loaded, when unloaded and when received by the branch. A missing scan or a package on the wrong trip raises a discrepancy.',
  recon: 'The number of SSCC packages on the packing list is compared with the order’s package count. If even one package is not scanned, the trip is not released (Go / No-Go check “Packages reconciled”).',
  scan: 'Scanner mode: the barcode scanner enters GS1-128 (AI 00 + SSCC) plus Enter — the package label opens immediately. Arrow keys ↑ ↓ select a result, Esc closes the list.',
  fineLink: 'The driver is identified automatically: the time on the fine notice is matched against the vehicle usage log (trip sheets, driver login in the app). If the vehicle changed hands during the day, the driver who had it at the time of the offence is responsible.',
  urgent: 'Urgent-trip candidates: on-duty and reserve drivers at the selected hub, then drivers who become free today. Remaining driving time, licence class and ADR certificate are checked. Sick leave, vacation, training and onboarding are excluded.',
  sim: 'Training alarms for the demo: each button starts a scenario on a specific vehicle. Temperature, status and incidents change, and a step-by-step playbook appears on the “Overview”. Press again to reset.',
  gonogo: 'A trip is released only if all checks are green: vehicle available and suitable for the temperature class, driver qualified, KZ documents complete, logger calibrated, ADR met, route cleared for weather. Any red check blocks release.',
  axle: 'Axle load depends on where cargo sits: the 2–8 °C chamber at the front wall loads the front axle (≈75 % of mass), the 15–25 °C chamber at the door loads the rear axle. Light, bulky goods usually hit pallet places before weight.',
  twolevel: 'Two levels of evidence: chamber sensor (unit / telematics) for control en route and an independent calibrated logger on every 2–8 °C shipment — that is the quality proof for KDL Olymp.',
  wxrisk: 'Levels: “Watch” — frost or wind ≥ 12 m/s; “Risk” — below −10 °C, wind ≥ 15 m/s or snow; “Critical” — buran (wind ≥ 20 m/s with snow) or below −25 °C. Route risk = worst city on trip days.',
  scen: 'What-if scenarios: switch on an event — the table recalculates vehicle demand, availability and shortfall for 7 days and proposes a fix (subcontractor, trip move, route merge).',
  escal: 'Escalation: New → Acknowledged (security on duty) → Escalated (head of security, 102 / 112 if needed) → Closed. Every step is logged with time and user.',
  gate: 'Documents depend on the cargo: own KDL goods — stock transfer note; third-party cargo — contract, TTN with third-party shipper and ESF for the service; dangerous goods — ADR pack. Click a document to generate it.',
  capa: 'A deviation goes through 7 steps. Only the quality manager decides whether goods are usable; CAPA — corrective and preventive action; without it the deviation cannot be closed.',
  fees: 'Mandatory and typical vehicle costs in KZ: OGPO — compulsory motor third-party liability; KASKO — voluntary comprehensive cover, for new vehicles and leasing; technical inspection — interval by age and vehicle type; vehicle tax — annual, by engine size / payload; toll roads — electronic payment by plate (national roads); fines — “Sergek” cameras and traffic rules, 50 % discount if paid within 7 days. Amounts and dates are demo — verify against current MRP rates.',
  west: X('Допуск на западное кольцо (Актобе, Уральск, Атырау, Актау): только HOWO T5G 50 м³, ТО актуально, термоконтейнеры и логгеры откалиброваны, зимний пакет, Wialon онлайн.','Freigabe für den Westring (Aktobe, Oral, Atyrau, Aktau): nur HOWO T5G 50 m³, Wartung aktuell, Thermocontainer und Logger kalibriert, Winterpaket, Wialon online.','Approval for the West ring (Aktobe, Oral, Atyrau, Aktau): HOWO T5G 50 m³ only, service current, thermo containers and loggers calibrated, winter kit, Wialon online.'),
  third: 'Third-party cargo (≈10 %): separate carriage contract, separate pallets and labels, separate liability and insurance. Never mix with KDL Olymp goods on one pallet.'
};
const FEES = {
  V01: { ogpo:X('до ','bis ','until ') + '11.01.2027', kasko:X('до ','bis ','until ') + '11.01.2027', ti:X('до ','bis ','until ') + '01.2027', tax:X('2026 оплачен','2026 bezahlt','2026 paid'), toll:'40 800 ₸ / ' + X('мес','Monat','month'), fines:X('нет','keine','none'), lvl:0 },
  V02: { ogpo:X('до ','bis ','until ') + '08.04.2027', kasko:X('до ','bis ','until ') + '08.04.2027', ti:X('до ','bis ','until ') + '04.2027', tax:X('2026 оплачен','2026 bezahlt','2026 paid'), toll:'64 300 ₸ / ' + X('мес','Monat','month'), fines:X('нет','keine','none'), lvl:0 },
  V03: { ogpo:X('до ','bis ','until ') + '30.10.2026', kasko:X('до ','bis ','until ') + '30.10.2026', ti:X('до ','bis ','until ') + '11.2026', tax:X('2026 оплачен','2026 bezahlt','2026 paid'), toll:'22 900 ₸ / ' + X('мес','Monat','month'), fines:X('нет','keine','none'), lvl:2, note:"OGPO and KASKO expire in 24 days" },
  V04: { ogpo:X('до ','bis ','until ') + '17.06.2027', kasko:X('до ','bis ','until ') + '17.06.2027', ti:X('до ','bis ','until ') + '06.2027', tax:X('2026 оплачен','2026 bezahlt','2026 paid'), toll:'31 200 ₸ / ' + X('мес','Monat','month'), fines:X('1 неоплачен · 29 500 ₸','1 offen · 29 500 ₸','1 unpaid · 29,500 ₸'), lvl:2, note:"05.10 16:42 · speeding, “Sergek”, Astana · driver E. Tulegenov (TS-0398) · 50 % discount until 12.10" }
};
function seedHist(b) {
  const h = { cold: [], amb: [], out: [] };
  for (let i = 0; i < 48; i++) { h.cold.push((b.cold ?? b.out) + Math.sin(i / 4) * 0.4); h.amb.push((b.amb ?? b.out) + Math.cos(i / 5) * 0.6); h.out.push(b.out + Math.sin(i / 9) * 1.2); }
  return h;
}

