const fs=require('fs');const p='platform-src/v6/screens/shell/001-shell-ext.js';let s=fs.readFileSync(p,'utf8');
const i=s.indexOf('const RGROUPS = () => [');const j=s.indexOf('/* ---------- 6. deep links (FR-175)');if(i<0||j<0)throw 1;
let blk=s.slice(i,j).split("T('").join("Q('");
blk=blk.replace("<a class=\"side-link${S.route === x[0] && tabKey() === x[1] ? ' on' : ''}\" data-act=\"helpOpen\" data-s=\"${x[0]}\" data-t=\"${x[1]}\" role=\"link\" tabindex=\"0\"><span>","<a class=\"side-link${S.route === x[0] && tabKey() === x[1] ? ' on' : ''}\" data-act=\"helpOpen\" data-s=\"${x[0]}\" data-t=\"${x[1]}\" role=\"link\" tabindex=\"0\">${ic('list', 14)}<span>");
s=s.slice(0,i)+"const Q = (ru, de, en, kk) => T(ru, de, en, kk);   // same bridge as E() below: the long descriptions of the records page stay inline\n  "+blk+s.slice(j);
fs.writeFileSync(p,s);
