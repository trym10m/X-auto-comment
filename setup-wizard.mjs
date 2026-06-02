import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });
const dataDir = 'data';
fs.mkdirSync(dataDir, { recursive: true });

async function ask(q, def = '') {
  const suffix = def ? ` [${def}]` : '';
  const a = await rl.question(`${q}${suffix}: `);
  return a.trim() || def;
}

async function readMultiline(prompt) {
  console.log(prompt);
  console.log('(Paste content, then on a NEW line type EOF and press Enter)');
  const lines = [];
  while (true) {
    const line = await rl.question('');
    if (line.trim() === 'EOF') break;
    lines.push(line);
  }
  return lines.join('\n');
}

function safeJsonParse(text, label) {
  try { return JSON.parse(text); }
  catch (e) { throw new Error(`${label} is not valid JSON: ${e.message}`); }
}

console.log('=== Twitter Comment Pack Trym10M — Setup Wizard ===');
console.log('You will be asked short questions. See guides/ for help.');

let existing = {};
const configFile = path.join(dataDir, 'config.json');
if (fs.existsSync(configFile)) {
  try { existing = JSON.parse(fs.readFileSync(configFile, 'utf8')); } catch {}
}

console.log('\n--- Question 1/5: Twitter cookies ---');
const cookieChoice = await ask('Paste new cookies JSON? y/n', fs.existsSync(existing.cookiesFile || 'data/cookies.json') ? 'n' : 'y');
const cookiesFile = existing.cookiesFile || 'data/cookies.json';
if (cookieChoice.toLowerCase() !== 'n') {
  const cookieText = await readMultiline('Paste cookies JSON now');
  const cookies = safeJsonParse(cookieText, 'Cookies input');
  if (!Array.isArray(cookies) && typeof cookies !== 'object') throw new Error('Cookies JSON must be array/object');
  fs.writeFileSync(cookiesFile, JSON.stringify(cookies, null, 2), 'utf8');
  console.log(`Saved cookies to ${cookiesFile}`);
}

console.log('\n--- Question 2/5: Telegram alerts ---');
const botToken = await ask('Telegram bot token (blank to skip)', existing.telegram?.botToken || '');
const chatId = botToken ? await ask('Telegram chat ID', existing.telegram?.chatId || '') : '';

console.log('\n--- Question 3/5: Mode ---');
console.log('A = List comment. B = Hashtag amplify. C = Hybrid.');
const mode = (await ask('Choose mode (A/B/C)', existing.mode || 'A')).toUpperCase();

const modeA = existing.modeA || {};
const modeB = existing.modeB || {};
if (mode === 'A' || mode === 'C') {
  const listIds = await ask('List IDs comma-separated', (modeA.listIds || []).join(','));
  modeA.listIds = listIds.split(',').map(x => x.trim()).filter(Boolean);
  modeA.language = await ask('Language (auto|en|ja|ko|zh|vi)', modeA.language || 'ja');
  modeA.stylePrompt = await ask('Style/persona prompt', modeA.stylePrompt || 'cute japanese anime cosplay girl style, natural short comments, casual X(Twitter) tone, friendly, under 150 characters');
}
if (mode === 'B' || mode === 'C') {
  modeB.ownerUsername = (await ask('Your Twitter @username (no @)', modeB.ownerUsername || 'trym10m')).replace(/^@/, '');
  const hashtags = await ask('Hashtags to scan comma-separated', (modeB.hashtags || ['#Cosplay','#anime']).join(','));
  modeB.hashtags = hashtags.split(',').map(x => x.trim()).filter(Boolean);
  modeB.crossPostListId = await ask('Optional cross-post list ID (Enter to skip)', modeB.crossPostListId || '');
}

console.log('\n--- Question 4/5: Rate ---');
const commentsPerHour = Number(await ask('Comments per hour', String(existing.commentsPerHour || 5)));
const delayMinMs = Number(await ask('Minimum delay ms', String(existing.delayMinMs || 60000)));
const delayMaxMs = Number(await ask('Maximum delay ms', String(existing.delayMaxMs || 240000)));

console.log('\n--- Question 5/5: AI provider ---');
const ai = existing.ai || {};
ai.provider = await ask('AI provider: deepseek | openai | anthropic', ai.provider || 'deepseek');
ai.apiKey = await ask('API key', ai.apiKey || '');
ai.model = await ask('Model override (Enter for default)', ai.model || (ai.provider === 'deepseek' ? 'deepseek-v4-flash' : ''));
ai.baseURL = await ask('Base URL override (blank for default)', ai.baseURL || '');

const config = {
  cookiesFile,
  telegram: { botToken, chatId },
  mode,
  modeA,
  modeB,
  commentsPerHour,
  delayMinMs,
  delayMaxMs,
  ai
};
fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
console.log(`\nWrote ${configFile}`);

const autostart = await ask('Auto-start on Windows boot? (Y/n)', 'n');
if (autostart.toLowerCase() === 'y') {
  const { spawnSync } = await import('node:child_process');
  spawnSync(process.execPath, ['scripts/install-autostart.mjs'], { stdio: 'inherit' });
}
console.log('Setup complete! Start the bot with: npm start');
rl.close();
