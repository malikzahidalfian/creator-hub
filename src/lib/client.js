export function readStorage(key, fallback = '') {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

export function writeStorage(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

export function readGeminiKeys() {
  try {
    const saved = JSON.parse(readStorage('gemini_api_keys', '[]'));
    return Array.from({ length: 10 }, (_, i) => Array.isArray(saved) && typeof saved[i] === 'string' ? saved[i] : '');
  } catch { return Array(10).fill(''); }
}

export function parseRecord(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

export function safeLink(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined;
  } catch { return undefined; }
}

export function assistantText(data) {
  const content = data?.choices?.[0]?.message?.content;
  const text = typeof content === 'string' ? content : Array.isArray(content) ? content.map(part => part.text || '').join('\n') : '';
  if (!text.trim()) throw new Error(data?.error?.message || 'AI tidak menghasilkan teks. Coba lagi atau ubah instruksi.');
  return text.trim();
}

export async function appFetch(url, options = {}) {
  const internal = typeof url === 'string' && url.startsWith('/api/');
  const response = await globalThis.fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(internal ? 60_000 : 120_000) });
  if (internal && !response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(typeof error.error === 'string' ? error.error : error.error?.message || `Permintaan gagal (${response.status}).`);
  }
  if (internal && !/application\/json|audio\//i.test(response.headers.get('content-type') || '')) {
    throw new Error('API tidak tersedia. Jalankan npm run dev atau gunakan deployment Vercel.');
  }
  if (url === '/api/generate') {
    const data = await response.json();
    const content = assistantText(data);
    return new Response(JSON.stringify({ ...data, choices: [{ ...data.choices[0], message: { ...data.choices[0].message, content } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return response;
}

export async function loadAllRecords(type = '', request = appFetch) {
  const records = [];
  const seen = new Set();
  for (let offset = 0; ; offset += 500) {
    const query = new URLSearchParams({ limit: '500', offset: String(offset) });
    if (type) query.set('type', `eq.${type}`);
    const response = await request(`/api/database?${query}`);
    const page = await response.json();
    if (!Array.isArray(page)) throw new Error('Format data server tidak valid.');
    if (page.length === 500 && page.every(item => seen.has(item?.id))) throw new Error('Server mengulang halaman data. Coba muat ulang.');
    page.forEach(item => seen.add(item?.id));
    records.push(...page);
    if (page.length < 500) return [...new Map(records.map(item => [item?.id, item])).values()];
  }
}

export function historyParts(result) {
  if (typeof result !== 'string') return [];
  try {
    const groups = JSON.parse(result);
    if (Array.isArray(groups)) {
      return groups.flatMap(group => typeof group === 'string' ? [group] : Array.isArray(group?.blocks) ? group.blocks.filter(block => typeof block === 'string').map(block => `Story Angle: ${group.angle || 'Storyboard'}\n\n${block}`) : []);
    }
  } catch { /* Older records are plain text, not JSON. */ }
  return result.split(/\n\s*---\s*\n/).map(part => part.trim()).filter(Boolean);
}

export function dashboardSummary(history, now = new Date()) {
  const records = history.filter(item => !['Data Produk', 'Bank Storyboard', 'Bank Gambar'].includes(item.type));
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6 + i);
    const next = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return { label: date.toLocaleDateString('id-ID', { weekday: 'short' }), count: records.filter(item => {
      const time = new Date(item.created_at).getTime();
      return time >= date.getTime() && time < next.getTime();
    }).length };
  });
  return { records, days, weekly: days.reduce((sum, day) => sum + day.count, 0) };
}
