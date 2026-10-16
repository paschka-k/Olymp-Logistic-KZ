const OWN_PAL = 18400;
const QF = [['po','PO'],['pl','PL'],['art','Artikel'],['sscc','SSCC'],['lot','Charge / LOT'],['ord','Auftrag'],['name','Ware'],['mfr','Hersteller'],['to','Empfänger']];
const STYPE = {
  trip: { label:'Auf Tour', lvl:1 }, duty: { label:'Bereitschaft / Reserve', lvl:0 }, rest: { label:'Ruhezeit nach Tour', lvl:0 },
  sick: { label:'Krank', lvl:3 }, vac: { label:'Urlaub', lvl:2 }, train: { label:'Schulung', lvl:2 }, onb: { label:'Einarbeitung', lvl:1 }, exit: { label:'Austritt', lvl:2 }
};
const CAL = {
  r: { a:'T', bg:'var(--color-accent-500)', fg:'var(--color-bg)', bd:'var(--color-accent-500)' },
  d: { a:'B', bg:'var(--color-accent-200)', fg:'var(--color-accent-900)', bd:'var(--color-accent-300)' },
  o: { a:'·', bg:'transparent', fg:'var(--color-neutral-600)', bd:'var(--color-divider)' },
  s: { a:'K', bg:'var(--color-accent-900)', fg:'var(--color-bg)', bd:'var(--color-accent-900)' },
  v: { a:'U', bg:'var(--color-neutral-300)', fg:'var(--color-neutral-900)', bd:'var(--color-neutral-400)' },
  t: { a:'S', bg:'transparent', fg:'var(--color-accent-800)', bd:'var(--color-accent-600)' },
  n: { a:'E', bg:'var(--color-accent-100)', fg:'var(--color-accent-800)', bd:'var(--color-accent-400)' },
  h: { a:'Ü', bg:'var(--color-neutral-200)', fg:'var(--color-neutral-900)', bd:'var(--color-neutral-500)' },
  x: { a:'×', bg:'transparent', fg:'var(--color-neutral-500)', bd:'transparent' }
};
const CAL_DAYS = ['06.10','07.10','08.10','09.10','10.10','11.10','12.10','13.10','14.10','15.10','16.10','17.10','18.10','19.10'];
const STAFF = [
  { id:'D1', name:'Erzhan Tulegenov', cat:'C', hub:'ast', st:'trip', veh:'V04', adr:'03.2028', where:X("R-102 · кольцо A, трасса Кокшетау","R-102 · Ring A, Strecke Kokshetau","R-102 · ring A, Kokshetau road"), u:[0,X("в рейсе · свободен с 08.10 18:00","auf Tour · frei ab 08.10 18:00","on trip · free from 08.10 18:00")], cal:'rrooddrrrooddr' },
  { id:'D2', name:'Askhat Nurlanov', cat:'C', hub:'ast', st:'trip', veh:'V01', adr:'', where:X("R-103 · второй водитель, трасса Караганда","R-103 · zweiter Fahrer, Strecke Karaganda","R-103 · second driver, Karaganda road"), u:[1,X("второй водитель R-103 · отдых в кабине, остаток 6,2 ч","zweiter Fahrer R-103 · Ruhe in der Kabine, Rest 6,2 h","second driver R-103 · cab rest, 6.2 h left")], cal:'rrroddrrrrodoo' },
  { id:'D3', name:'Dmitri Kim', cat:'C', hub:'ast', st:'trip', veh:'V01', adr:'14.11.2026', where:X("R-103 · магистраль на Алматы","R-103 · Hauptstrecke nach Almaty","R-103 · trunk line to Almaty"), u:[0,X("в рейсе до 07.10 08:30","auf Tour bis 07.10 08:30","on trip until 07.10 08:30")], cal:'rrroorrrdooorr' },
  { id:'D4', name:'Bauyrzhan Seitov', cat:'C', hub:'alm', st:'trip', veh:'V03', adr:'09.2027', where:X("R-104 · погрузка, хаб Алматы","R-104 · Beladung, Hub Almaty","R-104 · loading, Almaty hub"), u:[0,X("погрузка R-104 · выезд 15:30","Beladung R-104 · Abfahrt 15:30","loading R-104 · departure 15:30")], cal:'rrrooddrrroodd' },
  { id:'D5', name:'Marat Zhumabaev', cat:'C', hub:'alm', st:'rest', veh:'V03', adr:'', where:X("Хаб Алматы · отдых после R-105","Hub Almaty · Ruhe nach R-105","Almaty hub · rest after R-105"), u:[1,X("отдых до 16:30","Ruhe bis 16:30","rest until 16:30")], cal:'oddrrroorrrdoo' },
  { id:'D6', name:'Oleg Petrenko', cat:'C', hub:'ast', st:'duty', veh:'V02', adr:'05.2027', where:X("Хаб Астана · подготовка R-106 (Запад)","Hub Astana · Vorbereitung R-106 (West)","Astana hub · preparing R-106 (West)"), u:[1,X("закреплён за R-106 (08.10) · только сегодня до 20:00","R-106 zugeteilt (08.10) · nur heute bis 20:00","assigned to R-106 (08.10) · today only until 20:00")], cal:'drrroodrrrrood' },
  { id:'D7', name:'Nurlan Abenov', cat:'C', hub:'ast', st:'duty', veh:'', adr:'06.2028', where:X("Хаб Астана · дежурный водитель · ДОПОГ-ответственный","Hub Astana · Bereitschaftsfahrer · Gefahrgutbeauftragter","Astana hub · standby driver · DG safety adviser"), u:[2,X("дежурство · 9 ч доступно","Bereitschaft · 9 h verfügbar","standby · 9 h available")], cal:'ddoorrrddoorrr' },
  { id:'D8', name:'Sergej Litvinov', cat:'C', hub:'alm', st:'duty', veh:'', adr:'', where:X("Хаб Алматы · резерв без закреплённой ТС","Hub Almaty · Reserve ohne festes Fahrzeug","Almaty hub · reserve, no assigned vehicle"), u:[2,X("резерв · 9 ч доступно","Reserve · 9 h verfügbar","reserve · 9 h available")], cal:'ddrrroodddrroo' },
  { id:'D9', name:'Aigerim Kassymova', cat:'B', hub:'ast', st:'sick', veh:'', adr:'', where:X("Больничный лист до 09.10","Krankschreibung bis 09.10","Sick leave until 09.10"), u:[0,X("больничный до 09.10","krank bis 09.10","sick until 09.10")], cal:'ssssoorrrdoorr' },
  { id:'D10', name:'Ruslan Ibraev', cat:'C', hub:'alm', st:'vac', veh:'', adr:'02.2028', where:X("Отпуск 01.10–14.10","Urlaub 01.10–14.10","Leave 01.10–14.10"), u:[0,X("отпуск до 14.10","Urlaub bis 14.10","on leave until 14.10")], cal:'vvvvvvvvvrrrdo' },
  { id:'D11', name:'Timur Ospanov', cat:'C', hub:'ast', st:'train', veh:'', adr:'', where:X("Курс ДОПОГ, Астана · экзамен 08.10","ADR-Kurs, Astana · Prüfung 08.10","ADR course, Astana · exam 08.10"), u:[0,X("обучение до 08.10","Schulung bis 08.10","training until 08.10")], cal:'tttoorrrrdoorr' },
  { id:'D12', name:'Daniyar Sagintaev', cat:'B', hub:'ast', st:'onb', veh:'', adr:'', where:X("Стажировка с Е. Тулегеновым · R-102","Einarbeitung mit E. Tulegenov · R-102","Onboarding with Y. Tulegenov · R-102"), u:[0,X("онбординг · самостоятельно с 20.10","Einarbeitung · selbstständig ab 20.10","onboarding · solo from 20.10")], cal:'nnnnoonnnnnoon' },
  { id:'D13', name:'Viktor Shevchenko', cat:'B', hub:'ast', st:'exit', veh:'', adr:'', where:X("Увольнение 31.10 · передача дел Д. Сагинтаеву","Austritt 31.10 · Übergabe an D. Sagintaev","Leaving 31.10 · handover to D. Sagintayev"), u:[1,X("только городские рейсы до 31.10","nur Stadtfahrten bis 31.10","city trips only until 31.10")], cal:'hhhoohhhhhoohh' }
];
const DREP = {
  D1:{ trips:22, km:'9 840', ontime:'97 %', temp:0, ev:2 }, D2:{ trips:26, km:'6 120', ontime:'95 %', temp:1, ev:4 }, D3:{ trips:12, km:'14 900', ontime:'92 %', temp:0, ev:1 },
  D4:{ trips:20, km:'8 300', ontime:'96 %', temp:0, ev:0 }, D5:{ trips:24, km:'5 480', ontime:'98 %', temp:0, ev:1 }, D6:{ trips:14, km:'11 200', ontime:'94 %', temp:1, ev:0 },
  D7:{ trips:9, km:'3 900', ontime:'100 %', temp:0, ev:0 }, D8:{ trips:11, km:'4 100', ontime:'95 %', temp:0, ev:1 }, D13:{ trips:18, km:'2 650', ontime:'89 %', temp:0, ev:3 }
};
const FST = { unpaid:{ label:'Nicht bezahlt', lvl:3 }, paid50:{ label:'Mit 50 % Rabatt bezahlt', lvl:0 }, deduct:{ label:'Lohnabzug', lvl:1 }, disputed:{ label:'Einspruch läuft', lvl:2 }, company:{ label:'Zahlt das Unternehmen', lvl:1 } };
const FINES = [
  { id:'BG-1021', date:'05.10.2026', t:'16:42', veh:'V04', place:'Astana, Kabanbay-Batyr-Allee', type:'Geschwindigkeitsüberschreitung um 20–40 km/h', src:'Kamera „Sergek“', amt:29500, st:'unpaid', due:'12.10.2026',
    seg:[[450,830,'D13','FA-0396','Stadtzustellungen'],[845,1170,'D1','FA-0398','Tour Astana → Kokshetau']], note:'An diesem Tag fuhren zwei Fahrer V04. Der Verstoß um 16:42 fällt in die Schicht von E. Tulegenov.' },
  { id:'BG-1018', date:'03.10.2026', t:'09:15', veh:'V01', place:'Strecke Astana–Karaganda, km 74', type:'Geschwindigkeitsüberschreitung bis 20 km/h', src:'mobile Messanlage', amt:14750, st:'paid50', due:'—',
    seg:[[420,1020,'D2','FA-0384','R-091 Astana → Karaganda']], note:'7 375 ₸ innerhalb von 7 Tagen bezahlt.' },
  { id:'BG-1015', date:'01.10.2026', t:'22:10', veh:'V01', place:'Astana, Syganak-Straße', type:'Parken im Halteverbot', src:'Kamera „Sergek“', amt:21600, st:'deduct', due:'—',
    seg:[[480,1290,'D3','FA-0381','R-088 Hauptlauf'],[1290,1430,'D13','FA-0383','Überführung in die Werkstatt']], note:'Fahrzeug um 21:30 übergeben. Der Fahrer scheidet am 31.10 aus — bei der Schlussabrechnung einbehalten.' },
  { id:'BG-1009', date:'28.09.2026', t:'13:05', veh:'V03', place:'Almaty, Raiymbek-Allee', type:'Rotlichtverstoß', src:'Kamera „Sergek“', amt:43250, st:'disputed', due:'—',
    seg:[[360,900,'D5','FA-0371','R-079 Almaty → Taldykorgan']], note:'Laut GPS-Track war V03 um 13:05 in Taldykorgan — Einspruch mit Track-Export eingereicht.' },
  { id:'BG-1004', date:'24.09.2026', t:'10:20', veh:'V03', place:'Wiegestelle Kapshagay', type:'Überschreitung der Achslast', src:'Wiegestelle', amt:86500, st:'company', due:'—',
    seg:[[330,1080,'D4','FA-0362','R-072 Almaty → Taldykorgan']], note:'Verantwortung — Lager (Ladeschema), nicht der Fahrer. CAPA: Achsprüfung im Modul „Beladung und Gewicht“.' }
];
