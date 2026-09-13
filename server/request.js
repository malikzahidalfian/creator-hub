export function requirePost(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  return true;
}

export function requireApiKey(req, res) {
  if (!/^Bearer\s+\S+$/i.test(req.headers.authorization || '')) {
    res.status(400).json({ error: 'API Key belum diisi atau tidak valid.' });
    return false;
  }
  return true;
}
