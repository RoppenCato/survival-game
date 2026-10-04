// Opens the workbench start page (dist/index.html) in the default browser.
// Usage: npm start
const path = require('path');
const { spawn } = require('child_process');

const page = path.join(__dirname, '..', 'dist', 'index.html');
const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', page]]
  : process.platform === 'darwin' ? ['open', [page]]
  : ['xdg-open', [page]];
spawn(cmd[0], cmd[1], { stdio: 'ignore', detached: true }).unref();
console.log('opened ' + page);
