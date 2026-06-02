export async function sendTelegram(cfg, text) {
  const token = cfg.telegram?.botToken;
  const chatId = cfg.telegram?.chatId;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: String(text).slice(0, 3900), disable_web_page_preview: true })
    });
  } catch (e) { console.error('[telegram] fail', e.message); }
}
