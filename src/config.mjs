import fs from 'node:fs';

export function loadConfig(file = 'data/config.json') {
  const raw = fs.readFileSync(file, 'utf8');
  const cfg = JSON.parse(raw);
  if (!cfg.cookiesFile) cfg.cookiesFile = 'data/cookies.json';
  if (!cfg.mode) cfg.mode = 'A';
  if (!cfg.commentsPerHour) cfg.commentsPerHour = 5;
  if (!cfg.delayMinMs) cfg.delayMinMs = 60000;
  if (!cfg.delayMaxMs) cfg.delayMaxMs = 240000;
  return cfg;
}
