const fs=require('fs');
function patch(p,fn){let s=fs.readFileSync(p,'utf8');const rep=(a,b)=>{if(!s.includes(a))throw new Error(p+' missing: '+a.slice(0,70));s=s.replace(a,()=>b)};fn(rep);fs.writeFileSync(p,s);}
patch('platform-src/v6/screens/shell/475-mirror-ops.js',rep=>{
 rep("const inp = (k, type, ph) => `<input class=\"select\" data-inf=\"${k}\" id=\"inf_${k}\" type=\"${type || 'text'}\" value=\"${esc(S.inF[k] || '')}\"${ph ? ` placeholder=\"${esc(ph)}\"` : ''}>`;",
 "const INP_ATTR = { km: ' maxlength=\"80\"', place: ' maxlength=\"80\"', amount: ' min=\"0\" max=\"10000000\" step=\"1\"' };   // 0.3.11 Inbox.tsx bounds\n  const inp = (k, type, ph) => `<input class=\"select\" data-inf=\"${k}\" id=\"inf_${k}\" type=\"${type || 'text'}\" value=\"${esc(S.inF[k] || '')}\"${ph ? ` placeholder=\"${esc(ph)}\"` : ''}${INP_ATTR[k] || ''}>`;");
 rep("id=\"in_title\" data-inf=\"title\" value=\"${esc(F.title)}\">","id=\"in_title\" data-inf=\"title\" maxlength=\"120\" required value=\"${esc(F.title)}\">");
 rep("id=\"in_text\" data-inf=\"text\" rows=\"3\">","id=\"in_text\" data-inf=\"text\" rows=\"3\" maxlength=\"600\">");
});
patch('platform-src/v6/screens/dashboard/410-rec-alarms-inbox.js',rep=>{
 rep("text: 'Температура ' + LF.dec(l.temp) + ' °C вне диапазона ' + ZONES[l.zone].label });","text: T('Температура ', 'Temperatur ', 'Temperature ', 'Температура ') + LF.dec(l.temp) + ' °C ' + T('вне диапазона ', 'außerhalb des Bereichs ', 'outside the range ', 'диапазоннан тыс ') + ZONES[l.zone].label });");
 // inbox open pre-selection
 rep("if (m.link && load(m.link) && scr === 'orders') openDrawer({ type: 'load', id: m.link, tab: 'overview' }); return [scr, S.tab[scr] || '']; };",
 "if (m.link && load(m.link) && scr === 'orders') openDrawer({ type: 'load', id: m.link, tab: 'overview' });\n    /* 0.3.11 Inbox.tsx: the object of the message is pre-selected on the target screen (fine, city, vehicle, trip) */\n    if (S.route === scr) { try {\n      if (m.fineId && S.eco) S.eco.fineSel = m.fineId;\n      if (m.cc && ACT.wxCity && (m.kind === 'road_closure' || m.kind === 'weather_warning')) ACT.wxCity({ id: m.cc });\n      if (m.veh && ACT.thSel && scr === 'routes') ACT.thSel({ id: m.veh });\n      if (m.link && load(m.link) && S.ops && m.kind === 'doc_status') { S.ops.docSel = m.link; }\n      if (m.kind === 'workshop_status' && m.veh && ACT.thSel) ACT.thSel({ id: m.veh });\n    } catch (_) { /* a screen without the selection */ } }\n    return [scr, S.tab[scr] || '']; };");
 // inbox filter default open
 rep("(!RC.ist || m.st === RC.ist)","(RC.ist === 'all' || (RC.ist ? m.st === RC.ist : m.st !== 'done'))");
 rep("rcSel('ist', T('Статус', 'Status', 'Status', 'Күйі'), [['', ALLT], ...Object.keys(IST)","rcSel('ist', T('Статус', 'Status', 'Status', 'Күйі'), [['', T('Открытые', 'Offen', 'Open', 'Ашық')], ['all', ALLT], ...Object.keys(IST)");
 rep("chip(LVLC[m.lvl], 'L' + m.lvl)","chip(LVLC[m.lvl], (LVL[m.lvl] || [0, 'L' + m.lvl])[1])");
 // alarms default filter
 rep("(!RC.ast || a.status === RC.ast)","(RC.ast === 'all' || (RC.ast ? a.status === RC.ast : a.status !== 'closed'))");
 rep("rcSel('ast', T('Статус', 'Status', 'Status', 'Күйі'), [['', ALLT], ...Object.keys(AST)","rcSel('ast', T('Статус', 'Status', 'Status', 'Күйі'), [['', T('Открытые и принятые', 'Offen und bestätigt', 'Open and acknowledged', 'Ашық және қабылданған')], ['all', ALLT], ...Object.keys(AST)");
 rep("id=\"al_note\" rows=\"3\">","id=\"al_note\" rows=\"3\" maxlength=\"400\">");
 rep("<button class=\"btn green block\" data-act=\"alClose\" data-id=\"${a.id}\">","<button class=\"btn green block\" data-act=\"alClose\" data-id=\"${a.id}\" title=\"${esc(T('Категория и ≥ 10 символов; уровень 3 — сначала принять', 'Kategorie und ≥ 10 Zeichen; Stufe 3 — zuerst bestätigen', 'Category and ≥ 10 characters; level 3 — acknowledge first', 'Санат және ≥ 10 таңба; 3-деңгей — алдымен қабылдау'))}\">");
});
patch('platform-src/v6/screens/settings/440-rec-refdata.js',rep=>{
 rep("ensureTabs('settings', 'base', T('Основные', 'Allgemein', 'General', 'Негізгі'));","ensureTabs('settings', 'base', T('Основные', 'Allgemein', 'General', 'Негізгі'));\n  if (SCREENS.settings.tabs && SCREENS.settings.tabs[0] && SCREENS.settings.tabs[0].key === 'base') SCREENS.settings.tabs[0].perm = 'users:admin';   // 0.3.11: company / notification configuration is administration, not overview:read");
 rep("if (isNew) { if (!/^[A-Za-z0-9_-]{2,24}$/.test(key || '')) return T('Ключ: 2–24 латинских символа', 'Schlüssel: 2–24 lateinische Zeichen', 'Key: 2–24 Latin characters', 'Кілт: 2–24 латын таңбасы');","if (isNew) { if (!/^[\\p{L}\\d_-]{2,40}$/u.test(key || '')) return T('Ключ: 2–40 символов (буквы, цифры, _ -)', 'Schlüssel: 2–40 Zeichen (Buchstaben, Ziffern, _ -)', 'Key: 2–40 characters (letters, digits, _ -)', 'Кілт: 2–40 таңба (әріптер, сандар, _ -)');");
});
console.log('ok');
