import { authError, hasSession, sessionCookie } from '../server/session.js';
import { credentialStore, readCredentials, validPassword, verifyPassword } from '../server/credentials.js';

export const maxDuration = 60;

// Per-instance protection; use hosting/WAF rate limits for distributed deployments.
const attempts = new Map();
const WINDOW = 15 * 60 * 1000;
function permitAttempt(req, res) {
  const now = Date.now();
  for (const [key, value] of attempts) if (value.until < now) attempts.delete(key);
  const ip = req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  const key = `${req.method}:${ip}`;
  const attempt = attempts.get(key) || { count: 0, until: now + WINDOW };
  if (attempt.count >= 10) {
    res.setHeader('Retry-After', String(Math.ceil((attempt.until - now) / 1000)));
    res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' });
    return null;
  }
  attempt.count++;
  attempts.set(key, attempt);
  return key;
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', sessionCookie(true));
    return res.status(200).json({ authenticated: false });
  }
  if (!['GET', 'POST', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // Browser credential mutations must use a same-origin JSON request, not a form POST.
  if (['POST', 'PATCH'].includes(req.method) && (req.headers['sec-fetch-site'] === 'cross-site' || !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || ''))) {
    return res.status(403).json({ error: 'Permintaan keamanan harus berasal dari aplikasi ini dengan format JSON.' });
  }
  try {
    const credential = await readCredentials();
    if (req.method === 'GET') return res.status(200).json({ authenticated: hasSession(req, credential), configured: true });
    if (req.method === 'PATCH' && !hasSession(req, credential)) return res.status(401).json({ error: 'Sesi berakhir. Silakan masuk kembali.', code: 'SESSION_EXPIRED' });
    const attemptKey = permitAttempt(req, res);
    if (!attemptKey) return;
    if (req.method === 'POST') {
      if (!await verifyPassword(req.body?.password, credential.password_hash)) return res.status(401).json({ error: 'Password tidak sesuai. Silakan coba lagi.' });
      // Check again after verification, in case another request changed the password.
      if ((await readCredentials()).version !== credential.version) return res.status(409).json({ error: 'Password baru saja berubah. Silakan coba masuk kembali.' });
      attempts.delete(attemptKey);
      res.setHeader('Set-Cookie', sessionCookie(false, credential));
      return res.status(200).json({ authenticated: true });
    }
    const { currentPassword, newPassword, confirmPassword } = req.body || {};
    if (!validPassword(newPassword)) return res.status(400).json({ error: 'Password baru harus 12–128 karakter dan tidak boleh hanya spasi.' });
    if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Konfirmasi password baru belum sama.' });
    if (!await verifyPassword(currentPassword, credential.password_hash)) return res.status(400).json({ error: 'Password saat ini tidak sesuai.' });
    if (newPassword === currentPassword) return res.status(400).json({ error: 'Gunakan password baru yang berbeda dari password saat ini.' });
    const updated = await credentialStore().change(credential.version, newPassword);
    attempts.delete(attemptKey);
    // Rotate the current browser's session. All older sessions are now invalid.
    res.setHeader('Set-Cookie', sessionCookie(false, updated));
    return res.status(200).json({ authenticated: true, message: 'Password berhasil diganti. Sesi di perangkat lain sudah dinonaktifkan.' });
  } catch (error) { return authError(res, error); }
}
