import { requirePost } from '../server/session.js';
import { fetchPublicText, htmlToText } from '../server/safe-url.js';

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;
  if (typeof req.body?.url !== 'string') return res.status(400).json({ error: 'URL wajib diisi.' });
  try {
    const content = htmlToText(await fetchPublicText(req.body.url));
    if (content.length < 80) return res.status(422).json({ error: 'Isi artikel tidak cukup atau tidak dapat dibaca. Coba sumber lain.' });
    return res.status(200).json({ content });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
