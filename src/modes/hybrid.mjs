import { log } from '../lib/logger.mjs';
import { runListComment } from './list-comment.mjs';
import { runAmplify } from './amplify.mjs';

let turn = 0;
export async function runHybrid(cfg) {
  turn++;
  if (turn % 2 === 1) {
    log('[mode-C] running A');
    await runListComment(cfg);
  } else {
    log('[mode-C] running B');
    await runAmplify(cfg);
  }
}
