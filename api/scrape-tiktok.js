import { requirePost } from '../server/request.js';
import { fetchPublicText, parsePublicUrl, isSite } from '../server/safe-url.js';

export default async function handler(req, res) {
  if (!requirePost(req, res)) return;

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const parsedUrl = parsePublicUrl(url);
    if (!isSite(parsedUrl.hostname, 'tiktok.com') && !isSite(parsedUrl.hostname, 'tokopedia.com')) {
      return res.status(400).json({ error: 'Gunakan link TikTok atau Tokopedia yang valid.' });
    }
    if (isSite(parsedUrl.hostname, 'tokopedia.com')) {
      const html = await fetchPublicText(url);
      
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
    
    const response = await fetch(oembedUrl, { signal: AbortSignal.timeout(15_000) });
    
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

