const THERMO_RULES = [
  { lvl:3, name:'Freezing risk', rule:'2–8 °C chamber below +2 °C' }, { lvl:3, name:'Overheating', rule:'2–8 °C chamber above +8 °C' },
  { lvl:2, name:'Low temperature', rule:'15–25 °C chamber below +15 °C' }, { lvl:2, name:'Heat risk', rule:'15–25 °C chamber above +25 °C' },
  { lvl:3, name:'Heating failure', rule:'heating mode off while cargo temperature falls' }, { lvl:2, name:'Cold-chain breach', rule:'chamber door open longer than 3 min' },
  { lvl:1, name:'Winter mode', rule:'outside below 0 °C — monitor heating' }, { lvl:2, name:'Monitoring failure', rule:'logger or sensor offline over 10 min' }
];
const WX_RULES = [
  { name:'Winter risk', rule:'below −10 °C' }, { name:'Severe winter risk', rule:'below −25 °C' }, { name:'Critical cold', rule:'below −40 °C' },
  { name:'Buran / high wind', rule:'wind ≥ 20 m/s with snow' }, { name:'Snow and visibility', rule:'snowfall or visibility < 500 m' },
  { name:'Heat risk', rule:'above +40 °C' }, { name:'Critical heat', rule:'above +50 °C' }
];
const REP_GROUPS = [
  { name:'Operations', items:['Daily dispatch report','Trip completion and delays','Proofs of delivery (ePOD)','Exceptions and deviations'] },
  { name:'Cold chain', items:['Temperature compliance','Temperature excursions','Temperature history per shipment','Sensor calibration'] },
  { name:'Security', items:['Incidents','Route deviations and geofences','Driving safety','ADR compliance'] },
  { name:'Load and weight', items:['Utilisation by volume and pallets','Weight utilisation','Axle loads and overloads'] },
  { name:'Finance', items:['Cost per shipment / pallet / km','Fuel consumption','Maintenance costs','OPEX and CAPEX depreciation'] },
  { name:'KDL Olymp management', items:['OTIF and SLA','Weather impact on trips','Empty km and CO₂','Customer dashboard'] }
];

const SIMS = {
  freeze: { veh:'V04', lvl:3, label:'Freezing', title:'Freezing risk 2–8 °C', where:'V04 · Kokshetau road, outside −3 °C', play:['Contact driver, check unit and heating mode','Not fixed within 15 min → transfer 2–8 °C goods into thermo boxes with +4 °C ice packs','Quality manager: goods quarantined until logger review','Notify branch and KDL Olymp, open deviation and CAPA'] },
  overheat: { veh:'V01', lvl:3, label:'Overheating', title:'2–8 °C chamber overheating', where:'V01 · Karaganda road', play:['Check setpoint and unit mode (heating stuck?)','Switch unit to cooling, ventilate the 15–25 °C chamber','Logger: time above +8 °C → quality manager decision','Deviation + CAPA, unit service'] },
  fire: { veh:'V03', lvl:3, label:'Fire', title:'Fire / smoke · V03', where:'V03 · Hub Almaty, dock 2', play:['Driver: stop, engine off, evacuate · 101 / 112','Dispatcher: confirm emergency call, send coordinates','Dangerous goods on board → ADR instructions in writing to responders','Security: incident, insurer, photo and video as evidence','Fallback: GarantA / KazExpress, transfer undamaged goods'] },
  breakdown: { veh:'V01', lvl:3, label:'Breakdown', title:'Technical breakdown · V01', where:'V01 · Astana–Karaganda road, km 112 · gearbox', ws:'PW-03', play:['Driver: emergency stop, warning signs, vest; inform dispatcher via SOS','Dispatcher: one click — contacts of the service partner on route (3 managers)','Saryarka Auto LLP service, Karaganda: tow truck / mobile mechanic · response 2 h','Cold chain: unit on standalone power, if standstill > 2 h — transfer 2–8 °C goods','Hand cargo to a partner or replacement vehicle; service request with estimate and ETA'] },
  theft: { veh:'V01', lvl:3, label:'Theft', title:'Suspected theft · V01', where:'V01 · Astana–Karaganda road, km 112', play:['Security: call the driver, check code word','No answer or duress code → 102 / 112, send coordinates and track','Remote engine-start block (if permitted by KZ law)','Preserve track, video, door and seal logs as evidence','Notify KDL Olymp and insurer, shortage report'] }
};
