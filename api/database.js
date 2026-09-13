import { requireSession } from '../server/session.js';
import { proxyJson } from '../server/upstream.js';

export default async function handler(req, res) {
  if (!await requireSession(req, res)) return;
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return res.status(503).json({ error: 'Konfigurasi database server belum lengkap. Atur SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY.' });

  const query = new URL(req.url, 'http://localhost').searchParams;
  const params = new URLSearchParams();
  const id = query.get('id');
  if (['PATCH', 'DELETE'].includes(req.method) && !/^eq\.[a-zA-Z0-9-]+$/.test(id || '')) {
    return res.status(400).json({ error: 'ID data tidak valid.' });
  }
  if (id) params.set('id', id);
  if (req.method === 'GET') {
    params.set('select', '*');
    params.set('order', 'created_at.desc,id.desc');
    const offset = Number(query.get('offset') || 0);
    const limit = Number(query.get('limit') || 500);
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 500) return res.status(400).json({ error: 'Parameter pagination tidak valid.' });
    params.set('offset', String(offset)); params.set('limit', String(limit));
    const type = query.get('type');
    if (type && /^eq\.[\w -]{1,60}$/.test(type)) params.set('type', type);
  }
  let body;
  if (['POST', 'PATCH'].includes(req.method)) {
    const data = req.body;
    if (!data || typeof data.result !== 'string' || !data.result.trim() || data.result.length > 3_000_000) {
      return res.status(400).json({ error: 'Konten kosong atau terlalu besar (maksimal 3 MB).' });
    }
    if (req.method === 'POST' && (typeof data.type !== 'string' || !data.type.trim())) {
      return res.status(400).json({ error: 'Jenis konten wajib diisi.' });
    }
    body = { result: data.result };
    if (typeof data.type === 'string') body.type = data.type.slice(0, 60);
    if (typeof data.product_desc === 'string') body.product_desc = data.product_desc;
  }
  return proxyJson(res, `${base.replace(/\/$/, '')}/rest/v1/prompts?${params}`, {
    method: req.method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
}
