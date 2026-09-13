export async function proxyJson(res, url, options) {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(50_000) });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch {
      return res.status(502).json({ error: 'Layanan mengembalikan respons yang tidak valid. Coba lagi nanti.' });
    }
    if (!response.ok) {
      const error = data?.error?.message || data?.error || data?.message || `Layanan gagal (${response.status}).`;
      return res.status(response.status).json({ error: typeof error === 'string' ? error : JSON.stringify(error) });
    }
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(error.name === 'TimeoutError' ? 504 : 502).json({ error: 'Layanan tidak merespons. Silakan coba lagi.' });
  }
}
