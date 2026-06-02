import { loadConfig } from './config.mjs';
import { log } from './lib/logger.mjs';
import { sleep, rand } from './lib/utils.mjs';
import { sendTelegram } from './lib/telegram.mjs';
import { runWarmup } from './warmup.mjs';
import { runListComment } from './modes/list-comment.mjs';
import { runAmplify } from './modes/amplify.mjs';
import { runHybrid } from './modes/hybrid.mjs';

async function main() {
  const cfg = loadConfig();
  log('Twitter Comment Pack Trym10M starting...');
  log(`Mode: ${cfg.mode} | AI: ${cfg.ai?.provider || 'none'} | Rate: ${cfg.commentsPerHour}/hr`);
  await sendTelegram(cfg, `🤖 Twitter Comment Pack Trym10M started\nMode: ${cfg.mode}\nRate: ${cfg.commentsPerHour}/hr`);
  await runWarmup(cfg).catch(e => log(`[warmup] ${e.message}`));

  while (true) {
    const fresh = loadConfig();
    try {
      if (fresh.mode === 'A') await runListComment(fresh);
      else if (fresh.mode === 'B') await runAmplify(fresh);
      else await runHybrid(fresh);
    } catch (e) { log(`[cycle] fatal caught: ${e.stack || e.message}`); }
    const mins = rand(7, 10);
    log(`Cycle done. Sleeping ${mins} min before next cycle.`);
    await sleep(mins * 60 * 1000);
  }
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
