export const sleep = ms => new Promise(r => setTimeout(r, ms));
export function rand(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
export function cleanHandle(x) { return String(x || '').replace(/^@/, '').trim(); }
export function normalizeText(x) { return String(x || '').replace(/\s+/g, ' ').trim(); }
export function tweetUrl(username, id) { return `https://x.com/${cleanHandle(username)}/status/${id}`; }
