import { spawnSync } from 'node:child_process';
import path from 'node:path';
const cwd = process.cwd();
const node = process.execPath;
const entry = path.join(cwd, 'src', 'index.mjs');
const task = 'TwitterCommentPack';
const cmd = `\"${node}\" \"${entry}\"`;
console.log(`Installing scheduled task "${task}"...`);
console.log(`Node: ${node}`);
console.log(`Entry: ${entry}`);
const r = spawnSync('schtasks', ['/Create', '/TN', task, '/SC', 'ONLOGON', '/TR', cmd, '/F'], { stdio: 'inherit', shell: true });
if (r.status !== 0) {
  console.error('ERROR: Access is denied or schtasks failed. Run PowerShell as Administrator.');
  process.exit(r.status || 1);
}
console.log('Autostart installed.');
