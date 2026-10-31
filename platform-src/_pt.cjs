const fs=require('fs');const p='platform-src/tests/61-shell-ext.js';let s=fs.readFileSync(p,'utf8');
const a="lang === 'de' ? 'de' : lang === 'en' ? 'en' : '', 'an empty KK slot";if(!s.includes(a))throw 1;
s=s.replace(a,"lang === 'de' ? 'de' : lang === 'en' ? 'en' : lang === 'ru' ? 'ru' : '', 'an empty KK slot");fs.writeFileSync(p,s);
