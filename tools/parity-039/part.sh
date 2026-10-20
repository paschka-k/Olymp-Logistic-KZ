# R6 helper: build platform/_part.html with only the suites whose file name starts with $1 and run it (delete _part.html afterwards)
cd "$(dirname "$0")/../.." && node platform-src/build-v6.mjs > /dev/null && node -e "
const fs=require('fs'),p=require('path');const d='platform-src/tests';const f=fs.readdirSync(d).filter(x=>x.startsWith(process.argv[1])&&x.endsWith('.js')).sort();
fs.writeFileSync('platform/_part.html',fs.readFileSync(p.join(d,'template.html'),'utf8').replace('/*@@SUITES@@*/',()=>f.map(x=>fs.readFileSync(p.join(d,x),'utf8')).join('\n')));console.log(f.join(' '));" "$1" && python -X utf8 tools/parity-039/run-tests.py http://127.0.0.1:${PORT:-8851}/platform/_part.html ${2:-0}
