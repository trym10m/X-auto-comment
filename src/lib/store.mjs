import fs from 'node:fs';
const file = 'data/state.json';
function load() { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { commented: [], seen: [], lastRun: null }; } }
function save(s) { fs.mkdirSync('data', { recursive: true }); fs.writeFileSync(file, JSON.stringify(s, null, 2), 'utf8'); }
export function hasCommented(id) { return load().commented.includes(String(id)); }
export function markCommented(id) { const s = load(); const sid = String(id); if (!s.commented.includes(sid)) s.commented.push(sid); s.lastRun = new Date().toISOString(); save(s); }
export function hasSeen(id) { return load().seen.includes(String(id)); }
export function markSeen(id) { const s = load(); const sid = String(id); if (!s.seen.includes(sid)) s.seen.push(sid); if (s.seen.length > 10000) s.seen = s.seen.slice(-8000); save(s); }
export function getState(){ return load(); }
