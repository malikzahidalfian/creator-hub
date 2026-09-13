// Compatibility for older open tabs. The workspace no longer requires login.
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Workspace tidak menggunakan password.' });
  }
  return res.status(200).json({ authenticated: true, configured: true, access: 'public' });
}
