import { authConfigured, hasSession, sameSecret, sessionCookie } from '../server/session.js';

// Best-effort per-instance protection. Add a distributed rate limit at the hosting edge.
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ authenticated: hasSession(req), configured: authConfigured() });
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', sessionCookie(true));
    return res.status(200).json({ authenticated: false });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!authConfigured()) return res.status(503).json({ error: 'Atur APP_PASSWORD (minimal 12 karakter) dan SESSION_SECRET (minimal 32 karakter) di environment server terlebih dahulu.' });
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const ip = req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  const attempt = attempts.get(ip) || { count: 0, until: now + WINDOW };
  if (attempt.count >= 10) {
    res.setHeader('Retry-After', String(Math.ceil((attempt.until - now) / 1000)));
    return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' });
  }
  attempt.count++;
  attempts.set(ip, attempt);
  const password = req.body?.password;
  if (typeof password !== 'string' || password.length > 1024 || !sameSecret(password, process.env.APP_PASSWORD)) {
    return res.status(401).json({ error: 'Password tidak sesuai. Silakan coba lagi.' });
  }
  attempts.delete(ip);
  res.setHeader('Set-Cookie', sessionCookie());
  return res.status(200).json({ authenticated: true });
}
