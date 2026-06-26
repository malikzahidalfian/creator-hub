export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const provider = req.headers['x-provider'] || '1inference';
  const authHeader = req.headers.authorization;

  let apiUrl = '';
  let modelOverride = req.body.model;

  if (provider === '1inference') {
    apiUrl = 'https://api.1inference.com/v1/chat/completions';
  } else if (provider === 'openrouter') {
    apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
    
    // Check if there is an image in the request to determine if we need a vision model
    const payloadStr = JSON.stringify(req.body);
    const hasImage = payloadStr.includes('image_url');
    
    // Auto fallback to free models if user is on OpenRouter to save cost
    if (hasImage) {
      modelOverride = 'meta-llama/llama-3.2-11b-vision-instruct:free';
    } else {
      modelOverride = 'google/gemma-2-9b-it:free';
    }
  } else if (provider === 'deepseek') {
    apiUrl = 'https://api.deepseek.com/chat/completions';
    // DeepSeek API doesn't support 'gpt-4o' name
    modelOverride = 'deepseek-chat';
  } else if (provider === 'openai') {
    apiUrl = 'https://api.openai.com/v1/chat/completions';
  } else {
    // Default fallback
    apiUrl = 'https://api.1inference.com/v1/chat/completions';
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    };

    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://creator-hub.vercel.app';
      headers['X-Title'] = 'Creator Hub AI';
    }

    const payload = {
      ...req.body,
      model: modelOverride
    };

    const fetchRes = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    
    const data = await fetchRes.json();
    return res.status(fetchRes.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
