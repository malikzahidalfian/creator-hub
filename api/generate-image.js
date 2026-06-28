export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const provider = req.headers['x-provider'] || 'openrouter';
  const authHeader = req.headers.authorization;
  const { prompt, model } = req.body;

  try {
    let apiUrl = '';
    let payload = {};

    if (provider === 'openrouter') {
      apiUrl = 'https://openrouter.ai/api/v1/images';
      payload = {
        prompt: prompt,
        model: model || 'openai/gpt-image-2' // fallback model
      };
    } else {
      // Fallback for other providers like openai or 1inference
      apiUrl = provider === 'openai' 
        ? 'https://api.openai.com/v1/images/generations' 
        : 'https://api.1inference.com/v1/images/generations';
      payload = {
        model: model,
        prompt: prompt,
        n: 1,
        size: "1024x1024"
      };
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    };

    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://creator-hub.vercel.app';
      headers['X-Title'] = 'Creator Hub AI';
    }

    const fetchRes = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    let data;
    const textRes = await fetchRes.text();
    try {
      data = JSON.parse(textRes);
    } catch (e) {
      data = { error: "Non-JSON response from API: " + textRes.substring(0, 100) };
    }
    return res.status(fetchRes.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
