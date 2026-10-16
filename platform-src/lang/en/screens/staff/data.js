const OWN_PAL = 18400;
const QF = [['po','PO'],['pl','PL'],['art','Article'],['sscc','SSCC'],['lot','Lot / LOT'],['ord','Order'],['name','Goods'],['mfr','Manufacturer'],['to','Recipient']];
const STYPE = {
  trip: { label:'On trip', lvl:1 }, duty: { label:'Duty / reserve', lvl:0 }, rest: { label:'Rest after trip', lvl:0 },
  sick: { label:'Sick leave', lvl:3 }, vac: { label:'Vacation', lvl:2 }, train: { label:'Training', lvl:2 }, onb: { label:'Onboarding', lvl:1 }, exit: { label:'Leaving', lvl:2 }
};
const CAL = {
  r: { a:'T', bg:'var(--color-accent-500)', fg:'var(--color-bg)', bd:'var(--color-accent-500)' },
  d: { a:'D', bg:'var(--color-accent-200)', fg:'var(--color-accent-900)', bd:'var(--color-accent-300)' },
  o: { a:'·', bg:'transparent', fg:'var(--color-neutral-600)', bd:'var(--color-divider)' },
  s: { a:'S', bg:'var(--color-accent-900)', fg:'var(--color-bg)', bd:'var(--color-accent-900)' },
  v: { a:'V', bg:'var(--color-neutral-300)', fg:'var(--color-neutral-900)', bd:'var(--color-neutral-400)' },
  t: { a:'Tr', bg:'transparent', fg:'var(--color-accent-800)', bd:'var(--color-accent-600)' },
  n: { a:'O', bg:'var(--color-accent-100)', fg:'var(--color-accent-800)', bd:'var(--color-accent-400)' },
  h: { a:'H', bg:'var(--color-neutral-200)', fg:'var(--color-neutral-900)', bd:'var(--color-neutral-500)' },
  x: { a:'×', bg:'transparent', fg:'var(--color-neutral-500)', bd:'transparent' }
};
const CAL_DAYS = ['06.10','07.10','08.10','09.10','10.10','11.10','12.10','13.10','14.10','15.10','16.10','17.10','18.10','19.10'];
const STAFF = [
  { id:'D1', name:'Erzhan Tulegenov', cat:'C', hub:'ast', st:'trip', veh:'V04', adr:'03.2028', where:X("R-102 · кольцо A, трасса Кокшетау","R-102 · Ring A, Strecke Kokshetau","R-102 · ring A, Kokshetau road"), u:[0,X("в рейсе · свободен с 08.10 18:00","auf Tour · frei ab 08.10 18:00","on trip · free from 08.10 18:00")], cal:'rrooddrrrooddr' },
  { id:'D2', name:'Askhat Nurlanov', cat:'C', hub:'ast', st:'trip', veh:'V01', adr:'', where:X("R-103 · второй водитель, трасса Караганда","R-103 · zweiter Fahrer, Strecke Karaganda","R-103 · second driver, Karaganda road"), u:[1,X("второй водитель R-103 · отдых в кабине, остаток 6,2 ч","zweiter Fahrer R-103 · Ruhe in der Kabine, Rest 6,2 h","second driver R-103 · cab rest, 6.2 h left")], cal:'rrroddrrrrodoo' },
  { id:'D3', name:'Dmitry Kim', cat:'C', hub:'ast', st:'trip', veh:'V01', adr:'14.11.2026', where:X("R-103 · магистраль на Алматы","R-103 · Hauptstrecke nach Almaty","R-103 · trunk line to Almaty"), u:[0,X("в рейсе до 07.10 08:30","auf Tour bis 07.10 08:30","on trip until 07.10 08:30")], cal:'rrroorrrdooorr' },
  { id:'D4', name:'Bauyrzhan Seitov', cat:'C', hub:'alm', st:'trip', veh:'V03', adr:'09.2027', where:X("R-104 · погрузка, хаб Алматы","R-104 · Beladung, Hub Almaty","R-104 · loading, Almaty hub"), u:[0,X("погрузка R-104 · выезд 15:30","Beladung R-104 · Abfahrt 15:30","loading R-104 · departure 15:30")], cal:'rrrooddrrroodd' },
  { id:'D5', name:'Marat Zhumabaev', cat:'C', hub:'alm', st:'rest', veh:'V03', adr:'', where:X("Хаб Алматы · отдых после R-105","Hub Almaty · Ruhe nach R-105","Almaty hub · rest after R-105"), u:[1,X("отдых до 16:30","Ruhe bis 16:30","rest until 16:30")], cal:'oddrrroorrrdoo' },
  { id:'D6', name:'Oleg Petrenko', cat:'C', hub:'ast', st:'duty', veh:'V02', adr:'05.2027', where:X("Хаб Астана · подготовка R-106 (Запад)","Hub Astana · Vorbereitung R-106 (West)","Astana hub · preparing R-106 (West)"), u:[1,X("закреплён за R-106 (08.10) · только сегодня до 20:00","R-106 zugeteilt (08.10) · nur heute bis 20:00","assigned to R-106 (08.10) · today only until 20:00")], cal:'drrroodrrrrood' },
  { id:'D7', name:'Nurlan Abenov', cat:'C', hub:'ast', st:'duty', veh:'', adr:'06.2028', where:X("Хаб Астана · дежурный водитель · ДОПОГ-ответственный","Hub Astana · Bereitschaftsfahrer · Gefahrgutbeauftragter","Astana hub · standby driver · DG safety adviser"), u:[2,X("дежурство · 9 ч доступно","Bereitschaft · 9 h verfügbar","standby · 9 h available")], cal:'ddoorrrddoorrr' },
  { id:'D8', name:'Sergey Litvinov', cat:'C', hub:'alm', st:'duty', veh:'', adr:'', where:X("Хаб Алматы · резерв без закреплённой ТС","Hub Almaty · Reserve ohne festes Fahrzeug","Almaty hub · reserve, no assigned vehicle"), u:[2,X("резерв · 9 ч доступно","Reserve · 9 h verfügbar","reserve · 9 h available")], cal:'ddrrroodddrroo' },
  { id:'D9', name:'Aigerim Kassymova', cat:'B', hub:'ast', st:'sick', veh:'', adr:'', where:X("Больничный лист до 09.10","Krankschreibung bis 09.10","Sick leave until 09.10"), u:[0,X("больничный до 09.10","krank bis 09.10","sick until 09.10")], cal:'ssssoorrrdoorr' },
  { id:'D10', name:'Ruslan Ibraev', cat:'C', hub:'alm', st:'vac', veh:'', adr:'02.2028', where:X("Отпуск 01.10–14.10","Urlaub 01.10–14.10","Leave 01.10–14.10"), u:[0,X("отпуск до 14.10","Urlaub bis 14.10","on leave until 14.10")], cal:'vvvvvvvvvrrrdo' },
  { id:'D11', name:'Timur Ospanov', cat:'C', hub:'ast', st:'train', veh:'', adr:'', where:X("Курс ДОПОГ, Астана · экзамен 08.10","ADR-Kurs, Astana · Prüfung 08.10","ADR course, Astana · exam 08.10"), u:[0,X("обучение до 08.10","Schulung bis 08.10","training until 08.10")], cal:'tttoorrrrdoorr' },
  { id:'D12', name:'Daniyar Sagintaev', cat:'B', hub:'ast', st:'onb', veh:'', adr:'', where:X("Стажировка с Е. Тулегеновым · R-102","Einarbeitung mit E. Tulegenow · R-102","Onboarding with E. Tulegenov · R-102"), u:[0,X("онбординг · самостоятельно с 20.10","Einarbeitung · selbstständig ab 20.10","onboarding · solo from 20.10")], cal:'nnnnoonnnnnoon' },
  { id:'D13', name:'Viktor Shevchenko', cat:'B', hub:'ast', st:'exit', veh:'', adr:'', where:X("Увольнение 31.10 · передача дел Д. Сагинтаеву","Austritt 31.10 · Übergabe an D. Sagintajew","Leaving 31.10 · handover to D. Sagintaev"), u:[1,X("только городские рейсы до 31.10","nur Stadtfahrten bis 31.10","city trips only until 31.10")], cal:'hhhoohhhhhoohh' }
];
const DREP = {
  D1:{ trips:22, km:'9 840', ontime:'97 %', temp:0, ev:2 }, D2:{ trips:26, km:'6 120', ontime:'95 %', temp:1, ev:4 }, D3:{ trips:12, km:'14 900', ontime:'92 %', temp:0, ev:1 },
  D4:{ trips:20, km:'8 300', ontime:'96 %', temp:0, ev:0 }, D5:{ trips:24, km:'5 480', ontime:'98 %', temp:0, ev:1 }, D6:{ trips:14, km:'11 200', ontime:'94 %', temp:1, ev:0 },
  D7:{ trips:9, km:'3 900', ontime:'100 %', temp:0, ev:0 }, D8:{ trips:11, km:'4 100', ontime:'95 %', temp:0, ev:1 }, D13:{ trips:18, km:'2 650', ontime:'89 %', temp:0, ev:3 }
};
const FST = { unpaid:{ label:'Unpaid', lvl:3 }, paid50:{ label:'Paid with 50 % discount', lvl:0 }, deduct:{ label:'Payroll deduction', lvl:1 }, disputed:{ label:'Disputed', lvl:2 }, company:{ label:'Paid by company', lvl:1 } };
const FINES = [
  { id:'FN-1021', date:'05.10.2026', t:'16:42', veh:'V04', place:'Astana, Kabanbay Batyr Ave', type:'Speeding by 20–40 km/h', src:'“Sergek” camera', amt:29500, st:'unpaid', due:'12.10.2026',
    seg:[[450,830,'D13','TS-0396','city deliveries'],[845,1170,'D1','TS-0398','trip Astana → Kokshetau']], note:'Two drivers used V04 that day. The offence at 16:42 falls in E. Tulegenov’s shift.' },
  { id:'FN-1018', date:'03.10.2026', t:'09:15', veh:'V01', place:'Astana–Karaganda road, km 74', type:'Speeding up to 20 km/h', src:'mobile speed unit', amt:14750, st:'paid50', due:'—',
    seg:[[420,1020,'D2','TS-0384','R-091 Astana → Karaganda']], note:'7 375 ₸ paid within 7 days.' },
  { id:'FN-1015', date:'01.10.2026', t:'22:10', veh:'V01', place:'Astana, Syganak St', type:'Parking in a no-parking zone', src:'“Sergek” camera', amt:21600, st:'deduct', due:'—',
    seg:[[480,1290,'D3','TS-0381','R-088 trunk run'],[1290,1430,'D13','TS-0383','transfer to workshop']], note:'Vehicle handed over at 21:30. Driver leaves on 31.10 — deduct in the final settlement.' },
  { id:'FN-1009', date:'28.09.2026', t:'13:05', veh:'V03', place:'Almaty, Raiymbek Ave', type:'Red-light violation', src:'“Sergek” camera', amt:43250, st:'disputed', due:'—',
    seg:[[360,900,'D5','TS-0371','R-079 Almaty → Taldykorgan']], note:'GPS track shows V03 in Taldykorgan at 13:05 — objection filed with track export.' },
  { id:'FN-1004', date:'24.09.2026', t:'10:20', veh:'V03', place:'weigh station Kapshagay', type:'Axle load exceeded', src:'weigh station', amt:86500, st:'company', due:'—',
    seg:[[330,1080,'D4','TS-0362','R-072 Almaty → Taldykorgan']], note:'Responsibility — warehouse (load plan), not the driver. CAPA: axle check in the “Load and weight” module.' }
];
