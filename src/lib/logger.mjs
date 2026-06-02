import fs from 'node:fs';
fs.mkdirSync('data', { recursive: true });
export function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync('data/run.log', line + '\n', 'utf8');
}
