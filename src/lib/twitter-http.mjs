import fs from 'node:fs';
import { normalizeText } from './utils.mjs';

const BEARER = 'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCO9cHc%2B99kArC0oA%3DclF6qDBkKXRYrOJAKcMztxwFccgw0nHltXf5xgAtmTtCK7yKrq';

function loadCookies(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const data = JSON.parse(raw);
  if (Array.isArray(data)) return data;
  if (data.cookies && Array.isArray(data.cookies)) return data.cookies;
  return Object.entries(data).map(([name, value]) => ({ name, value }));
}

export function cookieHeader(file) {
  const cookies = loadCookies(file);
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

export function csrfToken(file) {
  const cookies = loadCookies(file);
  const ct0 = cookies.find(c => c.name === 'ct0');
  return ct0?.value || '';
}

function baseHeaders(cfg) {
  const ck = cookieHeader(cfg.cookiesFile);
  const csrf = csrfToken(cfg.cookiesFile);
  return {
    'authorization': `Bearer ${BEARER}`,
    'cookie': ck,
    'x-csrf-token': csrf,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
    'x-twitter-client-language': 'en',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome Safari/537.36',
    'accept': '*/*',
    'content-type': 'application/json'
  };
}

async function xFetch(cfg, url, opts = {}) {
  const res = await fetch(url, { ...opts, headers: { ...baseHeaders(cfg), ...(opts.headers || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`X HTTP ${res.status}: ${text.slice(0,500)}`);
  try { return JSON.parse(text); } catch { return text; }
}

// NOTE: X changes GraphQL query IDs often. This build uses best-effort public web endpoints and exposes clear errors.
const FEATURES = {
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  tweetypie_unmention_optimization_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: false,
  tweet_awards_web_tipping_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_enhance_cards_enabled: false
};

function collectTweets(obj, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (obj.rest_id && obj.legacy?.full_text) {
    out.push({ id: obj.rest_id, text: normalizeText(obj.legacy.full_text), username: obj.core?.user_results?.result?.legacy?.screen_name || obj.legacy?.user_id_str || '' });
  }
  if (obj.tweet_results?.result?.rest_id && obj.tweet_results.result.legacy?.full_text) {
    const t = obj.tweet_results.result;
    out.push({ id: t.rest_id, text: normalizeText(t.legacy.full_text), username: t.core?.user_results?.result?.legacy?.screen_name || '' });
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') collectTweets(v, out);
  }
  return out;
}

export async function searchTweets(cfg, query, count = 20) {
  // SearchTimeline query id changes; this fallback intentionally tries a known endpoint and fails with useful message.
  const variables = encodeURIComponent(JSON.stringify({ rawQuery: query, count, querySource: 'typed_query', product: 'Latest' }));
  const features = encodeURIComponent(JSON.stringify(FEATURES));
  const ids = ['nK1dw4oV3k4w5TdtcAdSww', 'U3QTLwGF8sZCHDuWIMSAmg'];
  let lastErr;
  for (const id of ids) {
    try {
      const url = `https://x.com/i/api/graphql/${id}/SearchTimeline?variables=${variables}&features=${features}`;
      const data = await xFetch(cfg, url);
      return collectTweets(data).filter(t => t.id);
    } catch(e) { lastErr = e; }
  }
  throw lastErr || new Error('SearchTimeline endpoint unavailable');
}

export async function getUserTweets(cfg, username, count = 5) {
  const q = `from:${username} -filter:replies`;
  return searchTweets(cfg, q, count).then(xs => xs.map(t => ({...t, username})));
}

export async function getListTweets(cfg, listId, count = 20) {
  const q = `list:${listId}`;
  return searchTweets(cfg, q, count);
}

export async function replyToTweet(cfg, tweetId, text) {
  const url = 'https://x.com/i/api/graphql/create_tweet/CreateTweet';
  const body = {
    variables: {
      tweet_text: text,
      reply: { in_reply_to_tweet_id: String(tweetId), exclude_reply_user_ids: [] },
      dark_request: false,
      media: { media_entities: [], possibly_sensitive: false },
      semantic_annotation_ids: []
    },
    features: FEATURES,
    queryId: 'CreateTweet'
  };
  // Known older CreateTweet IDs are attempted.
  const ids = ['VghS5L7QWLDqRkUPG8QgJw', 'xT36w0XM3A8jDynpkram2A'];
  let lastErr;
  for (const id of ids) {
    try {
      return await xFetch(cfg, `https://x.com/i/api/graphql/${id}/CreateTweet`, { method: 'POST', body: JSON.stringify(body) });
    } catch(e) { lastErr = e; }
  }
  throw lastErr || new Error('CreateTweet endpoint unavailable');
}

export async function resolveUserId(cfg, username) {
  const hits = await searchTweets(cfg, `from:${username}`, 3);
  // This fallback cannot always expose user id; return username if endpoint does not expose id.
  return hits[0]?.userId || username;
}

export async function followUser(cfg, usernameOrId) {
  const id = String(usernameOrId);
  const body = new URLSearchParams({ include_profile_interstitial_type: '1', skip_status: 'true', user_id: id });
  return await xFetch(cfg, 'https://x.com/i/api/1.1/friendships/create.json', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body
  });
}
