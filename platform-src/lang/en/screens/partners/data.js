const TIER = {
  gold: { label:'Gold', rank:3, bg:'var(--color-accent-900)', fg:'var(--color-bg)', bc:'var(--color-accent-900)' },
  silver: { label:'Silver', rank:2, bg:'var(--color-accent-300)', fg:'var(--color-accent-900)', bc:'var(--color-accent-500)' },
  bronze: { label:'Bronze', rank:1, bg:'var(--color-neutral-300)', fg:'var(--color-neutral-900)', bc:'var(--color-neutral-500)' },
  blocked: { label:'Blocked', rank:0, bg:'oklch(0.55 0.19 27)', fg:'#ffffff', bc:'oklch(0.55 0.19 27)' }
};
const CGRP = { 'Astana':'main', 'Almaty':'main', 'Karaganda':'sec', 'Shymkent':'sec', 'Aktobe':'sec' };
const GRPL = { main:'Main warehouses', sec:'Transshipment points', route:'Route cities' };
const PARTNERS = [
  ['PW-01','ws','Astana Refservice LLP','Astana','gold','Thermo King / Carrier reefer units, call-out 24/7','4 bays',0,0,1,'1 h','98 %','12.2027',''],
  ['PW-02','ws','Alatau TrakService LLP','Almaty','gold','Isuzu / Mercedes chassis, tyres, reefer units','6 bays',0,0,1,'1.5 h','97 %','06.2027',''],
  ['PW-03','ws','Saryarka Auto LLP','Karaganda','silver','chassis, electrics, winterisation','3 bays',0,0,0,'2 h','94 %','03.2027',''],
  ['PW-04','ws','Tobol Service (IE)','Kostanay','silver','tyres, electrics · no reefer units','2 bays',0,0,0,'2 h','92 %','11.2026',''],
  ['PW-05','ws','Aktobe Reftekhnika LLP','Aktobe','bronze','Carrier reefer units, no call-out','1 bay',0,0,0,'4 h','88 %','02.2027',''],
  ['PW-06','ws','Kaspiy Motors LLP','Atyrau','silver','chassis, Thermo King reefer units','3 bays',0,0,0,'3 h','89 %','08.2027',''],
  ['PW-07','ws','Ontustik Service (IE)','Shymkent','bronze','tyres, minor repairs','2 bays',0,0,0,'3 h','86 %','01.2027',''],
  ['PW-08','ws','Ertis Auto LLP','Pavlodar','blocked','chassis, reefer units','2 bays',0,0,0,'—','71 %','—','repeated poor unit repair (CAPA-0019)'],
  ['PL-01','lp','StepLogistik LLP','Astana','gold','reefer transport, cross-dock, 2–8 °C storage','40 pal./day',1,1,1,'2 h','99 %','12.2027',''],
  ['PL-02','lp','Zhetysu Cargo LLP','Almaty','gold','reefer transport, cross-dock, 2–8 / −20 °C storage','60 pal./day',1,1,1,'2 h','98 %','09.2027',''],
  ['PL-03','lp','Tsentr Tranzit LLP','Karaganda','silver','reefer transport, cross-dock','20 pal./day',1,0,1,'4 h','95 %','05.2027',''],
  ['PL-04','lp','Kostanay Express LLP','Kostanay','silver','cross-dock, regional reefer transport','15 pal./day',1,0,0,'4 h','94 %','03.2027',''],
  ['PL-05','lp','Batys Logistik LLP','Aktobe','gold','reefer transport, cross-dock, ADR, 2–8 °C storage','25 pal./day',1,1,1,'3 h','97 %','10.2027',''],
  ['PL-06','lp','Kaspiy Freight (IE)','Atyrau','bronze','15–25 °C transport','10 pal./day',0,0,0,'6 h','90 %','12.2026',''],
  ['PL-07','lp','Mangystau Trans LLP','Aktau','silver','reefer transport, ADR, rail and ferry','12 pal./day',1,1,0,'6 h','93 %','07.2027',''],
  ['PL-08','lp','Yug Reftrans LLP','Shymkent','silver','reefer transport, cross-dock','20 pal./day',1,0,1,'3 h','95 %','04.2027',''],
  ['PL-09','lp','Altay Cargo (IE)','Oskemen','bronze','15–25 °C transport','8 pal./day',0,0,0,'8 h','89 %','02.2027',''],
  ['PL-10','lp','Syrdarya Trans LLP','Kyzylorda','blocked','reefer transport','10 pal./day',1,0,0,'—','62 %','—','excursion +14 °C, lot lost (DEV-0011), contract suspended'],
  ['PL-11','lp','ТОО «GarantA»',CN('Астана','Astana'),'silver',X('сборные перевозки 228 ₸/кг · резерв на переход (E18/S130)','Stückgut 228 ₸/kg · Reserve im Übergang (E18/S130)','LTL 228 ₸/kg · fallback during transition (E18/S130)'),X('30 пал./день','30 Pal./Tag','30 pal./day'),1,0,0,X('24 ч','24 h','24 h'),'93 %','12.2027',''],
  ['PL-12','lp','ТОО «KazExpress»',CN('Алматы','Almaty'),'silver',X('экспресс 1 440 ₸/кг и сборные · резерв (G25)','Express 1 440 ₸/kg und Stückgut · Reserve (G25)','express 1,440 ₸/kg and LTL · fallback (G25)'),X('25 пал./день','25 Pal./Tag','25 pal./day'),1,0,0,X('12 ч','12 h','12 h'),'95 %','12.2027',''],
  ['PL-13','lp','ТОО «KazGen»',CN('Алматы','Almaty'),'gold',X('отправки −20 °C, сухой лёд, термобоксы (C11)','Sendungen −20 °C, Trockeneis, Thermoboxen (C11)','−20 °C shipments, dry ice, thermo boxes (C11)'),X('5 пал./день','5 Pal./Tag','5 pal./day'),1,1,1,X('24 ч','24 h','24 h'),'98 %','06.2027',''],
  ['PL-14','lp','ТОО «SpezAvto»',CN('Караганда','Karaganda'),'silver',X('доставка Караганда → Жезказган (P92)','Zustellung Karaganda → Zhezkazgan (P92)','delivery Karaganda → Zhezkazgan (P92)'),X('6 пал./день','6 Pal./Tag','6 pal./day'),0,0,0,X('24 ч','24 h','24 h'),'94 %','09.2027','']
].map(a => ({ id:a[0], type:a[1], name:a[2], city:a[3], tier:a[4], svc:a[5], cap:a[6], cold:!!a[7], adr:!!a[8], gdp:!!a[9], resp:a[10], sla:a[11], until:a[12], block:a[13], grp: CGRP[a[3]] || 'route' }));
const CCODE = { 'Astana':'7172', 'Almaty':'727', 'Karaganda':'7212', 'Kostanay':'7142', 'Aktobe':'7132', 'Atyrau':'7122', 'Shymkent':'7252', 'Pavlodar':'7182', 'Aktau':'7292', 'Oskemen':'7232', 'Kyzylorda':'7242' };
const PNAMES = ['Aidos Akhmetov','Gulnara Smagulova','Sergey Volkov','Dinara Orazova','Yerlan Nurtaev','Olga Petrova','Timur Zhaksybekov','Assel Seitkali','Maxim Li','Zhanar Yessenova','Ruslan Kenzhebaev','Aliya Mukhamediyeva','Nurzhan Abdrakhmanov','Elena Popova','Bekzat Tuleuov','Saule Ibraeva','Andrey Sorokin','Madina Kim','Arman Baizhanov','Natalya Kovalyova','Daniyar Omarov','Kamila Rakhimova','Vitaly Gusev','Aigul Zhumabekova','Kanat Sarsenov','Irina Belova','Yerzhan Mukashev'];
const PROLES = { ws: ['Head of service', 'Dispatcher 24/7', 'Service advisor'], lp: ['Head of transport', 'Dispatcher 24/7', 'Account manager'] };
const MOB = ['701', '705', '707', '747', '777', '771'];
const dig = (x, n) => String((x * 7919 + 1237) % 10 ** n).padStart(n, '0');
const PEXT = { 'PL-01':[16500,12,'50 m ₸'], 'PL-02':[15800,20,'80 m ₸'], 'PL-03':[17200,6,'30 m ₸'], 'PL-04':[15500,4,'20 m ₸'], 'PL-05':[21000,14,'40 m ₸'], 'PL-06':[14000,2,''], 'PL-07':[24500,3,'25 m ₸'], 'PL-08':[16900,8,'30 m ₸'], 'PL-09':[13500,1,''], 'PL-10':[0,0,''], 'PL-11':[15000,10,X('30 млн ₸','30 Mio. ₸','30 M ₸')], 'PL-12':[18500,8,X('30 млн ₸','30 Mio. ₸','30 M ₸')], 'PL-13':[26000,3,X('20 млн ₸','20 Mio. ₸','20 M ₸')], 'PL-14':[14000,2,''] };
const PCOST = { 'PW-01':'80 000–150 000 ₸', 'PW-02':'80 000–150 000 ₸', 'PW-03':'60 000–120 000 ₸', 'PW-04':'40 000–90 000 ₸', 'PW-05':'70 000–130 000 ₸', 'PW-06':'70 000–140 000 ₸', 'PW-07':'30 000–70 000 ₸', 'PW-08':'—' };
const PDEV = { 'PL-10':'DEV-0011', 'PW-08':'CAPA-0019' };
PARTNERS.forEach((p, i) => { const code = CCODE[p.city] || '7172', ln = code.length === 3 ? 7 : 6;
  p.contacts = PROLES[p.type].map((role, j) => { const k = i * 3 + j, d = dig(k + 11, ln), m = dig(k + 97, 7);
    const tel = '+7 (' + code + ') ' + (ln === 7 ? d.slice(0, 3) + '-' + d.slice(3, 5) + '-' + d.slice(5) : d.slice(0, 2) + '-' + d.slice(2, 4) + '-' + d.slice(4));
    const mob = '+7 ' + MOB[k % MOB.length] + ' ' + m.slice(0, 3) + ' ' + m.slice(3, 5) + ' ' + m.slice(5); return { role, name: PNAMES[k % PNAMES.length], tel, mob }; });
  const e = PEXT[p.id]; if (e) { p.rate = e[0]; p.used = e[1]; p.ins = e[2]; } else { p.rate = 0; p.used = 0; p.ins = ''; }
  p.capN = parseInt(p.cap, 10) || 0; p.reefer = ['PW-01', 'PW-02', 'PW-05', 'PW-06', 'PW-08'].includes(p.id); p.cost = PCOST[p.id] || ''; p.dev = PDEV[p.id] || ''; });
