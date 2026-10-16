const CV = [
  { id:'V01', unit:'H1', rings:['R1'], price:30000000, l100:26, unitL:2.5, svcKm:18, unitSvc:40000, crew:2, kmDay:405, odo:11600, act:27.9 },
  { id:'V02', unit:'H2', rings:['W'], price:28000000, l100:26, unitL:0, svcKm:18, unitSvc:0, crew:2, kmDay:570, odo:8200, act:28.9 },
  { id:'V03', unit:'J1', rings:['S'], price:27840000, l100:17, unitL:0, svcKm:14, unitSvc:0, crew:2, kmDay:542, odo:13900, act:17.4 },
  { id:'V04', unit:'J2', rings:['A','B'], price:27840000, l100:17, unitL:0, svcKm:14, unitSvc:0, crew:1, kmDay:571, odo:4100, act:18.6 }
];
const CP = { mrp:4325, perDiem:6000, drvBase:200000, drvKm:15, empTax:17.5, empTaxModel:14.5, admGross:1650000, ins:900000, kaskoPct:1.5, ogpo:1.9 * 3.98, tax:9, ti:1, it:90000, cont:400000, contMo:36, adrTrain:60000, adrYears:5, dryIce:57600, tolls:60000, medCheck:1500, wash:15000, zhez:1529 * 228, lease:{ down:0.3, rate:16.5, months:37 }, to1:15000, to2:45000, to1d:0.75, to2d:1.5, workDays:26, ktgMin:0.92, winterPct:10, reReg:3, ltl:228, outs:24201924, saveN77:6916410 };
const CW = [0.94, 1.03, 0.98, 1.05, 1.01, 0.97, 1.08, 1.02];
const COWN = [
  { id:'OW-1', ring:'R1', veh:'V01', name:X('R1 · Астана – Караганда – Алматы, рейс','R1 · Astana – Karaganda – Almaty, Fahrt','R1 · Astana – Karaganda – Almaty, trip'), kg:7325, km:2430, days:6, ext:7325 * 228, extL:X('сборный тариф 228 ₸/кг','Stückguttarif 228 ₸/kg','LTL rate 228 ₸/kg') },
  { id:'OW-2', ring:'W', veh:'V02', name:X('Запад · кольцо 6 482 км, рейс','West · Ring 6 482 km, Fahrt','West · 6,482 km ring, trip'), kg:5978, km:6482, days:12, ext:5978 * 228, extL:X('сборный тариф 228 ₸/кг','Stückguttarif 228 ₸/kg','LTL rate 228 ₸/kg') },
  { id:'OW-3', ring:'S', veh:'V03', name:X('Юг · кольцо 3 250 км, рейс','Süd · Ring 3 250 km, Fahrt','South · 3,250 km ring, trip'), kg:2827, km:3250, days:6, ext:2827 * 228, extL:X('сборный тариф 228 ₸/кг','Stückguttarif 228 ₸/kg','LTL rate 228 ₸/kg') },
  { id:'OW-4', ring:'A', veh:'V04', name:X('Север + Восток · 2 кольца, цикл','Nord + Ost · 2 Ringe, Zyklus','North + East · 2 rings, cycle'), kg:3204, km:3530, days:12, ext:3204 * 228, extL:X('сборный тариф 228 ₸/кг','Stückguttarif 228 ₸/kg','LTL rate 228 ₸/kg') },
  { id:'OW-5', ring:'out', veh:'V01', name:X('Жезказган из Караганды · неделя','Zhezkazgan ab Karaganda · Woche','Zhezkazgan from Karaganda · week'), kg:353, km:1120, days:2, ext:353 * 250, extL:X('SpezAvto ≈ 250 ₸/кг (допущение)','SpezAvto ≈ 250 ₸/kg (Annahme)','SpezAvto ≈ 250 ₸/kg (assumption)') },
  { id:'OW-6', ring:'S', veh:'V03', name:X('Разовый рейс Астана → Шымкент до 5 т','Einzelfahrt Astana → Shymkent bis 5 t','One-off trip Astana → Shymkent up to 5 t'), kg:5000, km:3000, days:5, ext:702500, extL:X('рынок 702 500 ₸ за рейс (E18)','Markt 702 500 ₸ je Fahrt (E18)','market 702,500 ₸ per trip (E18)') },
  { id:'OW-7', ring:'T', veh:'V03', name:X('Талдыкорган · отдельный рейс, неделя','Taldykorgan · eigene Fahrt, Woche','Taldykorgan · separate trip, week'), kg:439, km:520, days:1, ext:439 * 228, extL:X('сборный тариф 228 ₸/кг','Stückguttarif 228 ₸/kg','LTL rate 228 ₸/kg') }
];
const CAPR = [X('Руководитель логистики','Leitung Logistik','Head of logistics'), X('Финансовый контролёр','Finanzcontroller','Financial controller')];
const C_TABS = [['sum', X('Сводка','Übersicht','Summary')], ['fuel', X('Дизель','Diesel','Diesel')], ['svc', X('Сервис и простои','Werkstatt & Ausfall','Workshop & downtime')], ['ins', X('Страховки, налоги, учёт','Versicherung, Steuern, Zulassung','Insurance, tax, registration')], ['own', X('Свой или внешний','Eigen oder extern','Own or external')], ['drv', X('Водители','Fahrer','Drivers')]];

