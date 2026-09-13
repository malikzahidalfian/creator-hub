import { requirePost, requireApiKey } from '../server/session.js';

export const maxDuration = 60;
export default async function handler(req, res) {
  if (!requirePost(req, res) || !requireApiKey(req, res)) return;
  if (typeof req.body?.input !== 'string' || !req.body.input.trim() || req.body.input.length > 4096) {
    return res.status(400).json({ error: 'Teks harus berisi 1–4096 karakter.' });
  }
  if (req.body.speed != null && (!Number.isFinite(req.body.speed) || req.body.speed < 0.25 || req.body.speed > 4)) {
    return res.status(400).json({ error: 'Kecepatan suara harus antara 0.25 dan 4.' });
  }

  const authHeader = req.headers.authorization;
  const apiUrl = 'https://api.1inference.com/v1/audio/speech';

  try {
    const fetchRes = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ ...req.body, response_format: 'mp3' }),
      signal: AbortSignal.timeout(50_000)
    });
    
    if (!fetchRes.ok) {
      const errorText = await fetchRes.text();
      return res.status(fetchRes.status).json({ error: errorText });
    }

    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="speech.mp3"');
    return res.status(200).send(buffer);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
