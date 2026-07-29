export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const fetchRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!fetchRes.ok) {
      return res.status(fetchRes.status).json({ error: `Gagal mengambil konten dari URL (${fetchRes.status})` });
    }

    const html = await fetchRes.text();
    
    // Strip HTML tags simply using regex (works decently well for LLMs)
    // Remove scripts and styles first
    let cleanText = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
                        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    // Remove all HTML tags
    cleanText = cleanText.replace(/<[^>]+>/g, ' ');
    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Limit to max ~25000 chars to avoid overwhelming the LLM context window unnecessarily
    // 25000 chars is roughly 5000-6000 tokens
    if (cleanText.length > 25000) {
      cleanText = cleanText.substring(0, 25000) + '... [Konten dipotong karena terlalu panjang]';
    }

    return res.status(200).json({ content: cleanText });
  } catch (error) {
    return res.status(500).json({ error: 'Terjadi kesalahan saat memproses URL: ' + error.message });
  }
}
