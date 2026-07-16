export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    
    // We fetch data from the official TikTok oEmbed API which gives title and author
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
