export function languageInstruction(lang = 'auto') {
  const map = { ja: 'Japanese', en: 'English', vi: 'Vietnamese', ko: 'Korean', zh: 'Chinese' };
  return lang === 'auto' ? 'Use the same language as the tweet.' : `Write in ${map[lang] || lang}.`;
}
