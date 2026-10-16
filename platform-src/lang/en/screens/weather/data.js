const TL = { amb: '15–25 °C', cold: '2–8 °C', frz: '−20 °C' };
const DAYS = ['Tue 06.10', 'Wed 07.10', 'Thu 08.10', 'Fri 09.10', 'Sat 10.10', 'Sun 11.10', 'Mon 12.10'];
const HUBL = { ast: 'Hub “North” · Astana', alm: 'Hub “South” · Almaty' };

const CITY = [['Astana','ast',8,-1,'n'],['Karaganda','ast',7,-2,'n'],['Kokshetau','ast',6,-2,'n'],['Petropavl','ast',6,-3,'n'],['Pavlodar','ast',7,-2,'e'],['Kostanay','ast',8,-1,'n'],['Aktobe','ast',10,0,'n'],['Oral','ast',10,1,'n'],['Atyrau','ast',15,5,'w'],['Aktau','ast',17,9,'w'],['Zhezkazgan','ast',11,0,'n'],['Almaty','alm',16,4,'s'],['Taldykorgan','alm',15,2,'s'],['Taraz','alm',18,4,'s'],['Shymkent','alm',21,7,'s'],['Turkistan','alm',22,7,'s'],['Kyzylorda','alm',18,3,'s'],['Semey','ast',9,-1,'e'],['Oskemen','ast',8,-2,'e'],['Aksu','ast',7,-3,'e'],['Khromtau','ast',10,0,'n'],['Kaskelen','alm',16,4,'s'],['Saryagash','alm',22,8,'s']];
const OFF = { n: [0,-1,-5,-10,-8,-3,-1], w: [0,0,-3,-6,-4,-2,0], s: [0,1,0,-3,-4,-1,1], e: [0,-1,-3,-7,-6,-2,0] };
const WB = [4,6,8,9,6,4,3];
const EV = { 'Kostanay': {2:{wind:23,snow:true},3:{wind:20,snow:true}}, 'Aktobe': {2:{wind:21,snow:true},3:{wind:24,snow:true}}, 'Astana': {3:{wind:17,snow:true}}, 'Petropavl': {3:{wind:14,snow:true}}, 'Aktau': {1:{wind:18}}, 'Oral': {3:{wind:19,snow:true}} };
const WX = {};
CITY.forEach(([n, hub, mx, mn, p]) => {
  WX[n] = DAYS.map((_, d) => {
    const o = OFF[p][d], ev = (EV[n] || {})[d] || {};
    const wind = ev.wind ?? (WB[d] + (n.length % 3)), max = mx + o, min = mn + o;
    const snow = !!ev.snow || (min < -6 && p !== 's');
    let lvl = 0; if (min < 0 || wind >= 12) lvl = 1; if (min < -10 || wind >= 15 || snow) lvl = 2; if ((wind >= 20 && snow) || min <= -25) lvl = 3;
    const cond = wind >= 20 && snow ? 'Buran' : snow ? 'Snow' : wind >= 15 ? 'High wind' : min < 0 ? 'Frost' : max > 19 ? 'Clear' : d % 2 ? 'Cloudy' : 'Clear';
    return { max, min, wind, snow, lvl, cond };
  });
});

