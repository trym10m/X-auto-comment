import fs from 'node:fs';
try {
  const cfg = JSON.parse(fs.readFileSync('data/config.json', 'utf8'));
  if (!cfg.cookiesFile) throw new Error('Missing cookiesFile');
  if (!cfg.ai?.provider) throw new Error('Missing ai.provider');
  if (!cfg.ai?.apiKey) console.warn('[WARN] Missing ai.apiKey');
  console.log('Config OK');
  console.log(`Mode: ${cfg.mode}`);
  console.log(`Rate: ${cfg.commentsPerHour}/hr`);
} catch(e) {
  console.error('Config ERROR:', e.message);
  process.exit(1);
}
