// Parse every built page's inline scripts (new Function over each <script> body without src): run after npm run build. Prints 'all pages parse' or each SYNTAX fault. Run from the project root: node tools/parsecheck.js
const fs = require('fs'); let bad = 0;
for (const f of fs.readdirSync('dist')) { if (!/\.html$/.test(f)) continue; const h = fs.readFileSync('dist/' + f, 'utf8'); const re = /<script>([\s\S]*?)<\/script>/g; let m, n = 0; while ((m = re.exec(h))) { n++; try { new Function(m[1]); } catch (e) { bad++; console.log('SYNTAX', f, 'script', n, e.message); } } }
console.log(bad ? bad + ' bad' : 'all pages parse');
