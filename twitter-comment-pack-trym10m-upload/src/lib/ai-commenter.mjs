import { languageInstruction } from './language.mjs';

function aiDefaults(provider) {
  if (provider === 'openai') return { baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' };
  if (provider === 'anthropic') return { baseURL: 'https://api.anthropic.com/v1', model: 'claude-3-5-haiku-latest' };
  return { baseURL: 'https://api.deepseek.com', model: 'deepseek-chat' };
}

export async function makeComment(cfg, tweet, options = {}) {
  const ai = cfg.ai || {};
  if (!ai.apiKey) throw new Error('Missing AI API key');
  const provider = ai.provider || 'deepseek';
  const d = aiDefaults(provider);
  const model = ai.model || d.model;
  const style = options.stylePrompt || cfg.modeA?.stylePrompt || 'natural short friendly X/Twitter comment';
  const lang = options.language || cfg.modeA?.language || 'auto';
  const system = `You write natural short X/Twitter replies. ${languageInstruction(lang)} Never mention you are AI. Avoid spammy wording. Keep under 150 characters unless asked.`;
  const prompt = `Tweet author: @${tweet.username || ''}\nTweet text: ${tweet.text || ''}\nStyle: ${style}\nWrite one reply only. No quotes. No hashtags unless very natural.`;

  if (provider === 'anthropic') {
    const res = await fetch(`${ai.baseURL || d.baseURL}/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': ai.apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 120, system, messages: [{ role: 'user', content: prompt }] })
    });
    const txt = await res.text();
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}: ${txt}`);
    const data = JSON.parse(txt);
    return (data.content?.[0]?.text || '').trim();
  }

  const res = await fetch(`${ai.baseURL || d.baseURL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${ai.apiKey}` },
    body: JSON.stringify({ model, temperature: 0.8, max_tokens: 80, messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }] })
  });
  const txt = await res.text();
  if (!res.ok) throw new Error(`${provider} HTTP ${res.status}: ${txt}`);
  const data = JSON.parse(txt);
  return (data.choices?.[0]?.message?.content || '').replace(/^['"]|['"]$/g, '').trim();
}
