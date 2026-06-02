import fs from 'node:fs';
import { log } from './logger.mjs';
const file = 'data/rate.json';
function load() { try { return JSON.parse(fs.readFileSync(file,'utf8')); } catch { return { hour: '', count: 0 }; } }
function save(s) { fs.writeFileSync(file, JSON.stringify(s, null, 2), 'utf8'); }
export function canComment(limit) {
  const h = new Date().toISOString().slice(0,13);
  const s = load();
  if (s.hour !== h) { s.hour = h; s.count = 0; save(s); }
  if (s.count >= limit) { log(`[rate] cap ${s.count}/${limit} reached`); return false; }
  return true;
}
export function recordComment(limit) {
  const h = new Date().toISOString().slice(0,13);
  const s = load();
  if (s.hour !== h) { s.hour = h; s.count = 0; }
  s.count++;
  save(s);
  log(`[rate] ${s.count}/${limit}`);
}
