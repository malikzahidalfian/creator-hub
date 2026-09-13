import { requirePost, requireApiKey } from '../server/session.js';
import { proxyJson } from '../server/upstream.js';

export const maxDuration = 60;
export default async function handler(req, res) {
  if (!requirePost(req, res) || !requireApiKey(req, res)) return;
  const provider = req.headers['x-provider'] || '1inference';
  const { prompt, model } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'Prompt wajib diisi.' });
  if (!['1inference', 'openai', 'openrouter'].includes(provider)) return res.status(400).json({ error: 'Provider gambar tidak didukung.' });
  const openrouter = provider === 'openrouter';
  const url = openrouter ? 'https://openrouter.ai/api/v1/chat/completions' : `https://api.${provider === 'openai' ? 'openai' : '1inference'}.com/v1/images/generations`;
  const payload = openrouter
    ? { model: model || 'google/gemini-2.5-flash-image', messages: [{ role: 'user', content: prompt }], modalities: ['image', 'text'] }
    : { model: model || 'gpt-image-1', prompt, n: 1, size: '1024x1024' };
  return proxyJson(res, url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: req.headers.authorization }, body: JSON.stringify(payload) });
}
