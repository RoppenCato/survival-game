// Names defined twice in one scope (2026-10-21). A page's script is one long function scope: a second `function x(...)` in
// the same scope silently wins over the first wherever it is called (found twice: menOf in raid step 1, bodyNear in step 5,
// which took the arm ring's prompt from Hogni's body for a day). Run after a build, with parsecheck:
//   node tools/dupcheck.js              every page in dist/ and every module in src/
//   node tools/dupcheck.js file.js ...  these files
// A small tokenizer walks each script (strings, template literals, comments and regex literals skipped by the usual
// heuristic) and keeps a stack of the braces it is inside: a declaration's scope is the brace that encloses it, so an inner
// helper named like one elsewhere is not a duplicate; two declarations under the same brace are. Exits 1 when any is found.
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const files = args.length ? args : fs.readdirSync(path.join(__dirname, '../dist')).filter(f => f.endsWith('.html')).map(f => 'dist/' + f).concat(fs.readdirSync(path.join(__dirname, '../src')).filter(f => f.endsWith('.js')).map(f => 'src/' + f));
function scan(sc) {
  const decl = {}, stack = [0]; let i = 0, n = sc.length, line = 1, last = '', lastWord = '';
  const REGEX_BEFORE = /[(,=:\[!&|?{};+\-*%<>~^]|^$/;
  const isWordStart = c => /[A-Za-z_$]/.test(c), isWord = c => /[\w$]/.test(c);
  while (i < n) {
    const c = sc[i], d = sc[i + 1];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && d === '/') { while (i < n && sc[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { i += 2; while (i < n && !(sc[i] === '*' && sc[i + 1] === '/')) { if (sc[i] === '\n') line++; i++; } i += 2; continue; }
    if (c === '"' || c === "'" || c === '`') { const q = c; i++; while (i < n && sc[i] !== q) { if (sc[i] === '\\') i++; if (sc[i] === '\n') line++; i++; } i++; last = 'str'; continue; }
    if (c === '/' && (REGEX_BEFORE.test(last) || lastWord === 'return' || lastWord === 'typeof' || lastWord === 'case')) { i++; let inClass = false; while (i < n && (inClass || sc[i] !== '/') && sc[i] !== '\n') { if (sc[i] === '\\') i++; else if (sc[i] === '[') inClass = true; else if (sc[i] === ']') inClass = false; i++; } i++; while (i < n && isWord(sc[i])) i++; last = 're'; continue; }
    if (c === '{') { stack.push(i); last = '{'; i++; continue; }
    if (c === '}') { if (stack.length > 1) stack.pop(); last = '}'; i++; continue; }
    if (isWordStart(c)) {
      let j = i; while (j < n && isWord(sc[j])) j++; const w = sc.slice(i, j);
      if (w === 'function' && last !== '.') {
        let k = j; while (k < n && /\s/.test(sc[k])) k++; if (sc[k] === '*') k++; while (k < n && /\s/.test(sc[k])) k++;
        let m = k; while (m < n && isWord(sc[m])) m++;
        if (m > k && sc[m] !== '.' && (() => { let z = m; while (z < n && /\s/.test(sc[z])) z++; return sc[z] === '('; })()) {
          const name = sc.slice(k, m), scope = stack[stack.length - 1]; (decl[scope + ':' + name] = decl[scope + ':' + name] || { name, lines: [] }).lines.push(line);
        }
      }
      lastWord = w; last = 'word'; i = j; continue;
    }
    if (!/\s/.test(c)) { last = c; lastWord = ''; }
    i++;
  }
  return Object.values(decl).filter(q => q.lines.length > 1);
}
let bad = 0;
files.forEach(f => {
  const text = fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8'), scripts = f.endsWith('.html') ? [...text.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]) : [text];
  scripts.forEach((sc, si) => { const dups = scan(sc); if (dups.length) { bad++; console.log(f + (scripts.length > 1 ? ' (script ' + (si + 1) + ')' : '') + ': ' + dups.map(q => q.name + ' at lines ' + q.lines.join(', ')).join('; ')); } });
});
console.log(bad ? bad + ' script(s) with a name defined twice in one scope' : 'no name defined twice in one scope, in any page or module');
process.exit(bad ? 1 : 0);
