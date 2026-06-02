import { getListTweets, replyToTweet } from '../lib/twitter-http.mjs';
import { makeComment } from '../lib/ai-commenter.mjs';
import { canComment, recordComment } from '../lib/rate-limiter.mjs';
import { hasCommented, markCommented } from '../lib/store.mjs';
import { log } from '../lib/logger.mjs';
import { sendTelegram } from '../lib/telegram.mjs';
import { sleep, rand } from '../lib/utils.mjs';

export async function runListComment(cfg) {
  const ids = cfg.modeA?.listIds || [];
  if (!ids.length) { log('[mode-A] no list IDs configured'); return; }
  for (const listId of ids) {
    let tweets = [];
    try { tweets = await getListTweets(cfg, listId, 20); }
    catch (e) { log(`[mode-A] list ${listId} scan fail: ${e.message}`); continue; }
    log(`[mode-A] list ${listId}: pool size now ${tweets.length}`);
    for (const tweet of tweets) {
      if (!canComment(cfg.commentsPerHour)) return;
      if (hasCommented(tweet.id)) continue;
      try {
        const comment = await makeComment(cfg, tweet, { language: cfg.modeA?.language, stylePrompt: cfg.modeA?.stylePrompt });
        if (!comment) continue;
        await replyToTweet(cfg, tweet.id, comment);
        markCommented(tweet.id); recordComment(cfg.commentsPerHour);
        log(`[mode-A] OK ${tweet.id} @${tweet.username || ''} lang=${cfg.modeA?.language || 'auto'}`);
        await sendTelegram(cfg, `✅ Mode A commented\nTweet: ${tweet.id}\nComment: ${comment}`);
        await sleep(rand(cfg.delayMinMs, cfg.delayMaxMs));
      } catch (e) { log(`[mode-A] fail for ${tweet.id}: ${e.message}`); }
    }
  }
}
