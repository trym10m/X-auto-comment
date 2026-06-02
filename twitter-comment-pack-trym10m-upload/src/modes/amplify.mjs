import { getUserTweets, searchTweets, replyToTweet } from '../lib/twitter-http.mjs';
import { makeComment } from '../lib/ai-commenter.mjs';
import { canComment, recordComment } from '../lib/rate-limiter.mjs';
import { hasCommented, markCommented } from '../lib/store.mjs';
import { log } from '../lib/logger.mjs';
import { sendTelegram } from '../lib/telegram.mjs';
import { sleep, rand, tweetUrl } from '../lib/utils.mjs';

export async function runAmplify(cfg) {
  const owner = cfg.modeB?.ownerUsername || 'trym10m';
  const hashtags = cfg.modeB?.hashtags || [];
  if (!hashtags.length) { log('[mode-B] no hashtags configured'); return; }

  let ownTweets = [];
  try { ownTweets = await getUserTweets(cfg, owner, 3); } catch (e) { log(`[mode-B] owner scan fail: ${e.message}`); }
  const latest = ownTweets[0];
  if (!latest) { log('[mode-B] no owner tweet found; still scanning hashtags without backlink'); }

  for (const tag of hashtags) {
    if (!canComment(cfg.commentsPerHour)) return;
    let tweets = [];
    try { tweets = await searchTweets(cfg, `${tag} -from:${owner}`, 10); }
    catch(e) { log(`[mode-B] hashtag ${tag} scan fail: ${e.message}`); continue; }
    for (const tweet of tweets) {
      if (!canComment(cfg.commentsPerHour)) return;
      if (hasCommented(tweet.id)) continue;
      try {
        const base = await makeComment(cfg, tweet, { language: 'ja', stylePrompt: cfg.modeA?.stylePrompt });
        const link = latest ? ` ${tweetUrl(owner, latest.id)}` : '';
        const comment = (base + link).slice(0, 260);
        await replyToTweet(cfg, tweet.id, comment);
        markCommented(tweet.id); recordComment(cfg.commentsPerHour);
        log(`[mode-B] OK ${tweet.id} @${tweet.username || ''} tag=${tag} lang=ja`);
        await sendTelegram(cfg, `✅ Mode B commented\nTag: ${tag}\nTweet: ${tweet.id}\nComment: ${comment}`);
        await sleep(rand(cfg.delayMinMs, cfg.delayMaxMs));
      } catch(e) { log(`[mode-B] AI/post fail ${tweet.id}: ${e.message}`); }
      break;
    }
  }
}
