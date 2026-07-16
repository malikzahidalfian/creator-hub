export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    // 1. Cek apakah ini link Tokopedia / TikTok Shop (vt.tokopedia.com dll)
    if (url.includes('tokopedia.com')) {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow'
      });
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Gagal mengambil data dari link TikTok Shop/Tokopedia.' });
      }
      
      const html = await response.text();
      
      // Ekstrak title menggunakan Regex
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i) || html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"[^>]*>/i);
      let title = titleMatch ? titleMatch[1].trim() : 'Judul tidak ditemukan';
      
      // Ekstrak deskripsi (og:description atau meta description)
      const descMatch = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]+)"[^>]*>/i) || 
                        html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"[^>]*>/i);
      let description = descMatch ? descMatch[1].trim() : '';

      // Ekstrak author/site_name jika ada
      const authorMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]+)"[^>]*>/i);
      let author = authorMatch ? authorMatch[1].trim() : 'TikTok Shop / Tokopedia';

      // Menggabungkan judul dan deskripsi agar informasinya lengkap seperti di Tiktok biasa
      let fullText = title;
      if (description && description !== title) {
          fullText += `\n\n${description}`;
      }

      return res.status(200).json({
        title: fullText,
        author_name: author,
        thumbnail_url: ''
      });
    }

    // 2. Jika link TikTok biasa, gunakan oEmbed
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
       return res.status(response.status).json({ error: 'Gagal mengambil data dari TikTok. Pastikan link valid.' });
    }
    
    const data = await response.json();
    return res.status(200).json({ 
        title: data.title, 
        author_name: data.author_name,
        thumbnail_url: data.thumbnail_url 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

