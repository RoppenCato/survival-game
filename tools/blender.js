// Runs a Blender Python script headless (2026-10-09): node tools/blender.js art/build/hero_build.py [-- args...]
// Finds blender.exe from BLENDER in the environment, else the newest "Blender Foundation" install under Program Files.
const { spawnSync } = require('child_process'); const fs = require('fs'); const path = require('path');
function findBlender() {
  if (process.env.BLENDER && fs.existsSync(process.env.BLENDER)) return process.env.BLENDER;
  const roots = ['C:\\Program Files\\Blender Foundation', 'C:\\Program Files (x86)\\Blender Foundation'];
  for (const r of roots) {
    if (!fs.existsSync(r)) continue;
    const vs = fs.readdirSync(r).filter(d => fs.existsSync(path.join(r, d, 'blender.exe'))).sort().reverse();
    if (vs.length) return path.join(r, vs[0], 'blender.exe');
  }
  return 'blender';
}
module.exports = { findBlender };
if (require.main === module) {
  const args = process.argv.slice(2); const i = args.indexOf('--');
  const script = args[0]; const extra = i >= 0 ? args.slice(i + 1) : [];
  const r = spawnSync(findBlender(), ['-b', '-P', script, '--', ...extra], { stdio: 'inherit' });
  process.exit(r.status == null ? 1 : r.status);
}
