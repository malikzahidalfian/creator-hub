import { createHmac, timingSafeEqual } from 'node:crypto';
import { readCredentials } from './credentials.js';

const COOKIE = 'creator_session';
const TTL = 8 * 60 * 60;
function signature(value) {
  return createHmac('sha256', process.env.SESSION_SECRET).update(value).digest('hex');
}
export function sameSecret(a, b) {
  const hash = value => createHmac('sha256', 'creator-hub-compare').update(String(value)).digest();
  return timingSafeEqual(hash(a), hash(b));
}
export function sessionCookie(clear = false, credential) {
  const expires = Math.floor(Date.now() / 1000) + TTL;
  if (!clear && !credential?.version) throw new Error('Credential version required');
  const payload = clear ? '' : `${expires}.${credential.version}`;
  const value = clear ? '' : `${payload}.${signature(payload)}`;
  return `${COOKIE}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${clear ? 0 : TTL}${process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' ? '; Secure' : ''}`;
}
export function hasSession(req, credential) {
  if (!credential || !process.env.SESSION_SECRET) return false;
  const cookie = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${COOKIE}=`));
  const [expires, version, sig, extra] = (cookie?.slice(COOKIE.length + 1) || '').split('.');
  return !extra && /^\d+$/.test(expires || '') && Number(expires) > Date.now() / 1000 && version === credential.version && Boolean(sig) && sameSecret(sig, signature(`${expires}.${version}`));
}
export function authError(res, error) {
  return res.status(error.status || 503).json({ error: error.status ? error.message : 'Penyimpanan keamanan tidak tersedia. Silakan coba lagi.', code: 'AUTH_STORAGE_ERROR' });
}
export async function requireSession(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const credential = await readCredentials();
    if (!hasSession(req, credential)) {
      res.status(401).json({ error: 'Sesi berakhir. Silakan masuk kembali.', code: 'SESSION_EXPIRED' });
      return false;
    }
    return credential;
  } catch (error) { authError(res, error); return false; }
}
export async function requirePost(req, res) {
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
