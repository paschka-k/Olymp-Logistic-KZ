const fs=require('fs');const p='platform-src/v6/screens/settings/450-rec-admin.js';let s=fs.readFileSync(p,'utf8');
const a="${esutdCard()}${cats}\n";if(!s.includes(a))throw 1;
s=s.replace(a,()=>"${esutdCard()}${cats}\n${inboundCard()}\n");
const b="  function integBody() {";const i=s.indexOf(b);
// find the function that contains esutdCard() usage
const m=s.lastIndexOf("\n  function ",s.indexOf("${esutdCard()}${cats}"));
const ins=`
  /* 19.4 · 0.3.11 IntegrationHub: inbound webhooks POST /api/v1/inbound/{source} - source, secret set / missing, inbox kinds it feeds */
  const inboundCard = () => {
    const src = S.integ.filter(x => x.feeds && x.feeds.length && x.conn !== 'planned');
    const rows = src.map(x => \`<tr data-inbound="\${x.key}" style="cursor:default"><td class="mono">\${esc(x.key)}</td><td>\${x.conn === 'configured' ? chip('green', T('секрет задан', 'Secret gesetzt', 'secret set', 'құпия орнатылған')) : chip('gray', T('нет секрета', 'kein Secret', 'no secret', 'құпия жоқ'))}</td><td>\${x.feeds.map(k => esc(INBOX_KIND[k] || k)).join(', ')}</td></tr>\`).join('');
    return \`<div class="card tcard" style="margin-top:16px" data-inbound-hooks><div class="card-head">\${esc(T('Входящие вебхуки', 'Eingehende Webhooks', 'Inbound webhooks', 'Кіріс вебхуктар'))} <span class="mono sub">POST /api/v1/inbound/{source}</span></div>\${KIT.table([T('Источник', 'Quelle', 'Source', 'Дереккөз'), T('Секрет', 'Secret', 'Secret', 'Құпия'), T('Типы входящих', 'Eingangsarten', 'Inbox kinds', 'Кіріс түрлері')], rows, { cols: 3, empty: T('Нет источников', 'Keine Quellen', 'No sources', 'Дереккөз жоқ') })}</div>\`;
  };
`;
s=s.slice(0,m)+ins+s.slice(m);
fs.writeFileSync(p,s);console.log('ok');
