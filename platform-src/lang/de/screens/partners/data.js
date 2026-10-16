const TIER = {
  gold: { label:'Gold', rank:3, bg:'var(--color-accent-900)', fg:'var(--color-bg)', bc:'var(--color-accent-900)' },
  silver: { label:'Silver', rank:2, bg:'var(--color-accent-300)', fg:'var(--color-accent-900)', bc:'var(--color-accent-500)' },
  bronze: { label:'Bronze', rank:1, bg:'var(--color-neutral-300)', fg:'var(--color-neutral-900)', bc:'var(--color-neutral-500)' },
  blocked: { label:'Blocked', rank:0, bg:'oklch(0.55 0.19 27)', fg:'#ffffff', bc:'oklch(0.55 0.19 27)' }
};
const CGRP = { 'Astana':'main', 'Almaty':'main', 'Karaganda':'sec', 'Shymkent':'sec', 'Aktobe':'sec' };
const GRPL = { main:'Hauptlager', sec:'Umschlagpunkte', route:'Städte auf der Route' };
const PARTNERS = [
  ['PW-01','ws','TOO „Astana Refservice“','Astana','gold','Kühlaggregate Thermo King / Carrier, Einsatz 24/7','4 Boxen',0,0,1,'1 h','98 %','12.2027',''],
  ['PW-02','ws','TOO „Alatau TrakService“','Almaty','gold','Fahrgestell Isuzu / Mercedes, Reifendienst, Kühlaggregate','6 Boxen',0,0,1,'1,5 h','97 %','06.2027',''],
  ['PW-03','ws','TOO „Saryarka Auto“','Karaganda','silver','Fahrgestell, Elektrik, Wintervorbereitung','3 Boxen',0,0,0,'2 h','94 %','03.2027',''],
  ['PW-04','ws','IP „Tobol Service“','Kostanay','silver','Reifendienst, Elektrik · ohne Kühlaggregate','2 Boxen',0,0,0,'2 h','92 %','11.2026',''],
  ['PW-05','ws','TOO „Aktobe Reftekhnika“','Aktobe','bronze','Kühlaggregate Carrier, ohne Einsatz vor Ort','1 Box',0,0,0,'4 h','88 %','02.2027',''],
  ['PW-06','ws','TOO „Kaspiy Motors“','Atyrau','silver','Fahrgestell, Kühlaggregate Thermo King','3 Boxen',0,0,0,'3 h','89 %','08.2027',''],
  ['PW-07','ws','IP „Ontustik Service“','Shymkent','bronze','Reifendienst, Kleinreparaturen','2 Boxen',0,0,0,'3 h','86 %','01.2027',''],
  ['PW-08','ws','TOO „Ertis Auto“','Pavlodar','blocked','Fahrgestell, Kühlaggregate','2 Boxen',0,0,0,'—','71 %','—','wiederholt mangelhafte Aggregatreparatur (CAPA-0019)'],
  ['PL-01','lp','TOO „StepLogistik“','Astana','gold','Kühltransporte, Cross-Dock, Lager 2–8 °C','40 Pal./Tag',1,1,1,'2 h','99 %','12.2027',''],
  ['PL-02','lp','TOO „Zhetysu Cargo“','Almaty','gold','Kühltransporte, Cross-Dock, Lager 2–8 / −20 °C','60 Pal./Tag',1,1,1,'2 h','98 %','09.2027',''],
  ['PL-03','lp','TOO „Zentr Tranzit“','Karaganda','silver','Kühltransporte, Cross-Dock','20 Pal./Tag',1,0,1,'4 h','95 %','05.2027',''],
  ['PL-04','lp','TOO „Kostanay Express“','Kostanay','silver','Cross-Dock, Kühltransporte in der Region','15 Pal./Tag',1,0,0,'4 h','94 %','03.2027',''],
  ['PL-05','lp','TOO „Batys Logistik“','Aktobe','gold','Kühltransporte, Cross-Dock, ADR, Lager 2–8 °C','25 Pal./Tag',1,1,1,'3 h','97 %','10.2027',''],
  ['PL-06','lp','IP „Kaspiy Freight“','Atyrau','bronze','Transporte 15–25 °C','10 Pal./Tag',0,0,0,'6 h','90 %','12.2026',''],
  ['PL-07','lp','TOO „Mangystau Trans“','Aktau','silver','Kühltransporte, ADR, Bahn und Fähre','12 Pal./Tag',1,1,0,'6 h','93 %','07.2027',''],
  ['PL-08','lp','TOO „Yug Reftrans“','Shymkent','silver','Kühltransporte, Cross-Dock','20 Pal./Tag',1,0,1,'3 h','95 %','04.2027',''],
  ['PL-09','lp','IP „Altay Cargo“','Oskemen','bronze','Transporte 15–25 °C','8 Pal./Tag',0,0,0,'8 h','89 %','02.2027',''],
  ['PL-10','lp','TOO „Syrdarya Trans“','Kyzylorda','blocked','Kühltransporte','10 Pal./Tag',1,0,0,'—','62 %','—','Abweichung +14 °C, Verlust einer Charge (DEV-0011), Vertrag ausgesetzt'],
  ['PL-11','lp','ТОО «GarantA»',CN('Астана','Astana'),'silver',X('сборные перевозки 228 ₸/кг · резерв на переход (E18/S130)','Stückgut 228 ₸/kg · Reserve im Übergang (E18/S130)','LTL 228 ₸/kg · fallback during transition (E18/S130)'),X('30 пал./день','30 Pal./Tag','30 pal./day'),1,0,0,X('24 ч','24 h','24 h'),'93 %','12.2027',''],
  ['PL-12','lp','ТОО «KazExpress»',CN('Алматы','Almaty'),'silver',X('экспресс 1 440 ₸/кг и сборные · резерв (G25)','Express 1 440 ₸/kg und Stückgut · Reserve (G25)','express 1,440 ₸/kg and LTL · fallback (G25)'),X('25 пал./день','25 Pal./Tag','25 pal./day'),1,0,0,X('12 ч','12 h','12 h'),'95 %','12.2027',''],
  ['PL-13','lp','ТОО «KazGen»',CN('Алматы','Almaty'),'gold',X('отправки −20 °C, сухой лёд, термобоксы (C11)','Sendungen −20 °C, Trockeneis, Thermoboxen (C11)','−20 °C shipments, dry ice, thermo boxes (C11)'),X('5 пал./день','5 Pal./Tag','5 pal./day'),1,1,1,X('24 ч','24 h','24 h'),'98 %','06.2027',''],
  ['PL-14','lp','ТОО «SpezAvto»',CN('Караганда','Karaganda'),'silver',X('доставка Караганда → Жезказган (P92)','Zustellung Karaganda → Zhezkazgan (P92)','delivery Karaganda → Zhezkazgan (P92)'),X('6 пал./день','6 Pal./Tag','6 pal./day'),0,0,0,X('24 ч','24 h','24 h'),'94 %','09.2027','']
].map(a => ({ id:a[0], type:a[1], name:a[2], city:a[3], tier:a[4], svc:a[5], cap:a[6], cold:!!a[7], adr:!!a[8], gdp:!!a[9], resp:a[10], sla:a[11], until:a[12], block:a[13], grp: CGRP[a[3]] || 'route' }));
const CCODE = { 'Astana':'7172', 'Almaty':'727', 'Karaganda':'7212', 'Kostanay':'7142', 'Aktobe':'7132', 'Atyrau':'7122', 'Shymkent':'7252', 'Pavlodar':'7182', 'Aktau':'7292', 'Oskemen':'7232', 'Kyzylorda':'7242' };
const PNAMES = ['Aidos Akhmetov','Gulnara Smagulova','Sergej Wolkow','Dinara Orazova','Erlan Nurtaev','Olga Petrowa','Timur Zhaksybekov','Assel Seitkali','Maxim Li','Zhanar Yessenova','Ruslan Kenzhebaev','Aliya Mukhamediyeva','Nurzhan Abdrakhmanov','Jelena Popowa','Bekzat Tuleuov','Saule Ibraeva','Andrej Sorokin','Madina Kim','Arman Baizhanov','Natalja Kowaljowa','Daniyar Omarov','Kamila Rakhimova','Witali Gusew','Aigul Zhumabekova','Kanat Sarsenov','Irina Belowa','Erzhan Mukashev'];
const PROLES = { ws: ['Serviceleiter', 'Disposition 24/7', 'Serviceannahme'], lp: ['Leiter Transport', 'Disposition 24/7', 'Kundenbetreuer'] };
const MOB = ['701', '705', '707', '747', '777', '771'];
const dig = (x, n) => String((x * 7919 + 1237) % 10 ** n).padStart(n, '0');
const PEXT = { 'PL-01':[16500,12,'50 Mio. ₸'], 'PL-02':[15800,20,'80 Mio. ₸'], 'PL-03':[17200,6,'30 Mio. ₸'], 'PL-04':[15500,4,'20 Mio. ₸'], 'PL-05':[21000,14,'40 Mio. ₸'], 'PL-06':[14000,2,''], 'PL-07':[24500,3,'25 Mio. ₸'], 'PL-08':[16900,8,'30 Mio. ₸'], 'PL-09':[13500,1,''], 'PL-10':[0,0,''], 'PL-11':[15000,10,X('30 млн ₸','30 Mio. ₸','30 M ₸')], 'PL-12':[18500,8,X('30 млн ₸','30 Mio. ₸','30 M ₸')], 'PL-13':[26000,3,X('20 млн ₸','20 Mio. ₸','20 M ₸')], 'PL-14':[14000,2,''] };
const PCOST = { 'PW-01':'80 000–150 000 ₸', 'PW-02':'80 000–150 000 ₸', 'PW-03':'60 000–120 000 ₸', 'PW-04':'40 000–90 000 ₸', 'PW-05':'70 000–130 000 ₸', 'PW-06':'70 000–140 000 ₸', 'PW-07':'30 000–70 000 ₸', 'PW-08':'—' };
const PDEV = { 'PL-10':'DEV-0011', 'PW-08':'CAPA-0019' };
PARTNERS.forEach((p, i) => { const code = CCODE[p.city] || '7172', ln = code.length === 3 ? 7 : 6;
  p.contacts = PROLES[p.type].map((role, j) => { const k = i * 3 + j, d = dig(k + 11, ln), m = dig(k + 97, 7);
    const tel = '+7 (' + code + ') ' + (ln === 7 ? d.slice(0, 3) + '-' + d.slice(3, 5) + '-' + d.slice(5) : d.slice(0, 2) + '-' + d.slice(2, 4) + '-' + d.slice(4));
    const mob = '+7 ' + MOB[k % MOB.length] + ' ' + m.slice(0, 3) + ' ' + m.slice(3, 5) + ' ' + m.slice(5); return { role, name: PNAMES[k % PNAMES.length], tel, mob }; });
  const e = PEXT[p.id]; if (e) { p.rate = e[0]; p.used = e[1]; p.ins = e[2]; } else { p.rate = 0; p.used = 0; p.ins = ''; }
  p.capN = parseInt(p.cap, 10) || 0; p.reefer = ['PW-01', 'PW-02', 'PW-05', 'PW-06', 'PW-08'].includes(p.id); p.cost = PCOST[p.id] || ''; p.dev = PDEV[p.id] || ''; });
