import { requirePost, requireApiKey } from '../server/session.js';
import { proxyJson } from '../server/upstream.js';

export const maxDuration = 60;

export default async function handler(req, res) {
  if (!requirePost(req, res) || !requireApiKey(req, res)) return;
  const provider = req.headers['x-provider'] || '1inference';
  const urls = {
    '1inference': 'https://api.1inference.com/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions'
  };
  if (!Object.hasOwn(urls, provider)) return res.status(400).json({ error: 'Provider tidak didukung.' });
  if (!Array.isArray(req.body?.messages) || !req.body.messages.length) return res.status(400).json({ error: 'Pesan wajib diisi.' });
  const headers = { 'Content-Type': 'application/json', Authorization: req.headers.authorization };
  if (provider === 'openrouter') headers['X-Title'] = 'Creator Hub AI';
  const model = provider === 'deepseek' ? 'deepseek-chat' : req.body.model || (provider === 'openrouter' ? 'openrouter/free' : 'gpt-4o');
  return proxyJson(res, urls[provider], {
    method: 'POST', headers,
    body: JSON.stringify({ ...req.body, model, stream: false })
  });
}
