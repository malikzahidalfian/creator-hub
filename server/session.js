import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE = 'creator_session';
const TTL = 8 * 60 * 60;

export function authConfigured() {
  return Boolean(process.env.APP_PASSWORD?.length >= 12 && process.env.SESSION_SECRET?.length >= 32);
}

function signature(value) {
  // Changing the password also invalidates existing sessions.
  return createHmac('sha256', process.env.SESSION_SECRET).update(`${value}:${process.env.APP_PASSWORD}`).digest('hex');
}

export function sameSecret(a, b) {
  const hash = value => createHmac('sha256', 'creator-hub-compare').update(String(value)).digest();
  return timingSafeEqual(hash(a), hash(b));
}

export function sessionCookie(clear = false) {
  const expires = Math.floor(Date.now() / 1000) + TTL;
  const value = clear ? '' : `${expires}.${signature(String(expires))}`;
  return `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : TTL}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}

export function hasSession(req) {
  if (!authConfigured()) return false;
  const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`));
  const [expires, sig] = (cookie?.slice(COOKIE.length + 1) || '').split('.');
  return /^\d+$/.test(expires || '') && Number(expires) > Date.now() / 1000 && Boolean(sig) && sameSecret(sig, signature(expires));
}

export function requireSession(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!authConfigured()) {
    res.status(503).json({ error: 'Konfigurasi APP_PASSWORD (minimal 12 karakter) dan SESSION_SECRET (minimal 32 karakter) di server belum lengkap.' });
    return false;
  }
  if (!hasSession(req)) {
    res.status(401).json({ error: 'Sesi berakhir. Silakan masuk kembali.' });
    return false;
  }
  return true;
}

export function requirePost(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return requireSession(req, res);
}

export function requireApiKey(req, res) {
  if (!/^Bearer\s+\S+$/i.test(req.headers.authorization || '')) {
    res.status(400).json({ error: 'API Key belum diisi atau tidak valid.' });
    return false;
  }
  return true;
}
