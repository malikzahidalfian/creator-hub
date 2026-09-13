export async function proxyJson(res, url, options, { timeoutMs = 50_000, provider, model } = {}) {
  try {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { /* Some gateways return plain text for payment errors. */ }
    if (response.status === 402) {
      const raw = data?.error?.message || data?.message || (typeof data?.error === 'string' ? data.error : 'Payment Required');
      const providerMessage = String(raw).replace(/Bearer\s+\S+|sk[_-][A-Za-z0-9_-]+/gi, '[key disembunyikan]').slice(0,1000);
      return res.status(402).json({
        error: `${provider || 'Provider AI'} menolak permintaan ini karena pembatasan pembayaran (402). Jika saldo masih ada, periksa batas API key atau hubungi dukungan provider; saldo habis belum dapat dipastikan.`,
        code: 'payment_required', provider, model,
        providerCode: typeof data?.error?.code === 'string' ? data.error.code : undefined,
        providerMessage,
        requestId: response.headers.get('x-request-id') || undefined
      });
    }
    if (text && data === undefined) return res.status(502).json({ error: 'Layanan mengembalikan respons yang tidak valid. Coba lagi nanti.' });
    if (!response.ok) {
      const error = data?.error?.message || data?.error || data?.message || `Layanan gagal (${response.status}).`;
      return res.status(response.status).json({ error: typeof error === 'string' ? error : JSON.stringify(error) });
    }
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(error.name === 'TimeoutError' ? 504 : 502).json({ error: 'Layanan tidak merespons. Silakan coba lagi.' });
  }
}
