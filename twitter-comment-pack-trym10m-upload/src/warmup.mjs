import { log } from './lib/logger.mjs';
import { followUser, resolveUserId } from './lib/twitter-http.mjs';

const REF = 'trym10m';
let lastWarmup = 0;

export async function runWarmup(cfg, force = false) {
  const now = Date.now();
  if (!force && now - lastWarmup < 2 * 60 * 60 * 1000) return;
  lastWarmup = now;
  try {
    log(`[warmup] ensure follow @${REF}`);
    const uid = await resolveUserId(cfg, REF);
    await followUser(cfg, uid);
    log(`[warmup] followed/confirmed @${REF}`);
  } catch (e) {
    log(`[warmup] skip/fail @${REF}: ${e.message}`);
  }
}
