const THERMO_RULES = [
  { lvl:3, name:'Einfrierrisiko', rule:'Kammer 2–8 °C unter +2 °C' }, { lvl:3, name:'Überhitzung', rule:'Kammer 2–8 °C über +8 °C' },
  { lvl:2, name:'Niedrige Temperatur', rule:'Kammer 15–25 °C unter +15 °C' }, { lvl:2, name:'Hitzerisiko', rule:'Kammer 15–25 °C über +25 °C' },
  { lvl:3, name:'Heizungsausfall', rule:'Heizmodus aus bei fallender Warentemperatur' }, { lvl:2, name:'Kühlkettenbruch', rule:'Kammertür länger als 3 Min offen' },
  { lvl:1, name:'Wintermodus', rule:'außen unter 0 °C — Heizung überwachen' }, { lvl:2, name:'Monitoring-Ausfall', rule:'Logger oder Sensor länger als 10 Min offline' }
];
const WX_RULES = [
  { name:'Winterrisiko', rule:'unter −10 °C' }, { name:'Starkes Winterrisiko', rule:'unter −25 °C' }, { name:'Kritische Kälte', rule:'unter −40 °C' },
  { name:'Buran / starker Wind', rule:'Wind ≥ 20 m/s bei Schnee' }, { name:'Schnee und Sicht', rule:'Schneefall oder Sicht < 500 m' },
  { name:'Hitzerisiko', rule:'über +40 °C' }, { name:'Kritische Hitze', rule:'über +50 °C' }
];
const REP_GROUPS = [
  { name:'Betrieb', items:['Täglicher Dispositionsbericht','Tourerfüllung und Verspätungen','Zustellnachweise (ePOD)','Ausnahmen und Abweichungen'] },
  { name:'Kühlkette', items:['Einhaltung der Temperaturführung','Temperaturabweichungen','Temperaturverlauf je Sendung','Sensorkalibrierung'] },
  { name:'Sicherheit', items:['Vorfälle','Routenabweichungen und Geozonen','Fahrsicherheit','ADR-Konformität'] },
  { name:'Beladung und Gewicht', items:['Auslastung nach Volumen und Paletten','Auslastung nach Gewicht','Achslasten und Überladungen'] },
  { name:'Finanzen', items:['Kosten je Sendung / Palette / km','Kraftstoffverbrauch','Wartungskosten','OPEX und CAPEX-Abschreibung'] },
  { name:'Management KDL Olymp', items:['OTIF und SLA','Wettereinfluss auf Touren','Leerkilometer und CO₂','Kunden-Dashboard'] }
];

const SIMS = {
  freeze: { veh:'V04', lvl:3, label:'Einfrieren', title:'Einfrierrisiko 2–8 °C', where:'V04 · Strecke Kokshetau, außen −3 °C', play:['Fahrer kontaktieren, Aggregat und Heizmodus prüfen','Nicht behoben in 15 Min → 2–8 °C-Ware in Thermoboxen mit Kühlakkus +4 °C umladen','Qualitätsverantwortlicher: Ware in Quarantäne bis zur Loggerauswertung','Filiale und KDL Olymp informieren, Abweichung und CAPA eröffnen'] },
  overheat: { veh:'V01', lvl:3, label:'Überhitzung', title:'Überhitzung Kammer 2–8 °C', where:'V01 · Strecke Karaganda', play:['Sollwert und Aggregatmodus prüfen (Heizung hängt?)','Aggregat auf Kühlen schalten, 15–25 °C-Kammer lüften','Logger: Zeit über +8 °C → Entscheidung des Qualitätsverantwortlichen','Abweichung + CAPA, Aggregatservice'] },
  fire: { veh:'V03', lvl:3, label:'Brand', title:'Brand / Rauch · V03', where:'V03 · Hub Almaty, Rampe 2', play:['Fahrer: anhalten, Motor aus, evakuieren · 101 / 112','Disponent: Notruf bestätigen, Koordinaten übermitteln','Gefahrgut an Bord → schriftliche ADR-Weisungen an die Rettungskräfte','Sicherheit: Vorfall, Versicherung, Foto und Video als Beweis','Reserve: GarantA / KazExpress, Umladen der unbeschädigten Ware'] },
  breakdown: { veh:'V01', lvl:3, label:'Panne', title:'Technische Panne · V01', where:'V01 · Strecke Astana–Karaganda, km 112 · Getriebe', ws:'PW-03', play:['Fahrer: Nothalt, Warnzeichen, Weste; Disponent per SOS informieren','Disponent: mit einem Klick — Kontakte des Servicepartners auf der Route (3 Ansprechpartner)','Service TOO „Saryarka Auto“, Karaganda: Abschleppwagen / mobiler Mechaniker · Reaktion 2 h','Kühlkette: Aggregat im Autarkbetrieb, bei Standzeit > 2 h — Umladen der Ware 2–8 °C','Übergabe der Ladung an Partner oder Ersatzfahrzeug; Serviceauftrag mit Kostenvoranschlag und ETA'] },
  theft: { veh:'V01', lvl:3, label:'Diebstahl', title:'Diebstahlverdacht · V01', where:'V01 · Strecke Astana–Karaganda, km 112', play:['Sicherheit: Anruf beim Fahrer, Codewort prüfen','Keine Antwort oder Notfallcode → 102 / 112, Koordinaten und Track übermitteln','Fernsperre des Motorstarts (sofern nach KZ-Recht zulässig)','Track, Video, Tür- und Plombenprotokoll als Beweismittel sichern','KDL Olymp und Versicherer informieren, Fehlmengenprotokoll'] }
};
