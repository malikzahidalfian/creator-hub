import { useState, useEffect } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('storyboard')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('storyboard_api_key') || '')
  
  // --- STORYBOARD STATES ---
  const [productImage, setProductImage] = useState(null)
  const [productFile, setProductFile] = useState(null)
  const [productDesc, setProductDesc] = useState('')
  const [styleOption, setStyleOption] = useState('Kartun 3D lucu, warna cerah, karakter Indonesia')
  const [specialInstruction, setSpecialInstruction] = useState('')
  const [promptCount, setPromptCount] = useState('3') 
  const [scenePerPrompt, setScenePerPrompt] = useState('3') 
  const [isGeneratingStory, setIsGeneratingStory] = useState(false)
  const [generatedPrompts, setGeneratedPrompts] = useState([]) 
  const [copiedIndex, setCopiedIndex] = useState(null)

  // --- THREAD AFFILIATE STATES ---
  const [threadTitle, setThreadTitle] = useState('')
  const [threadDesc, setThreadDesc] = useState('')
  const [threadLink, setThreadLink] = useState('')
  const [threadLength, setThreadLength] = useState('Panjang (Storytelling Mendalam)')
  const [isGeneratingThread, setIsGeneratingThread] = useState(false)
  const [generatedThread, setGeneratedThread] = useState(null)

  // --- GENERAL VIRAL THREAD STATES ---
  const [genThreadTopic, setGenThreadTopic] = useState('')
  const [genThreadSource, setGenThreadSource] = useState('')
  const [genThreadTone, setGenThreadTone] = useState('Misteri / Menegangkan')
  const [genThreadLength, setGenThreadLength] = useState('Panjang (Cerita Mendalam - 6-10 Bagian)')
  const [isGeneratingGenThread, setIsGeneratingGenThread] = useState(false)
  const [generatedGenThread, setGeneratedGenThread] = useState(null)

  const stylesList = [
    "Kartun 3D lucu, warna cerah, karakter Indonesia",
    "Cinematic Realism, film look, dramatic lighting",
    "Anime Style, Makoto Shinkai aesthetic, vibrant",
    "Minimalist 2D Vector, corporate friendly, smooth",
    "Stop Motion Clay animation, warm lighting, playful",
    "Custom..."
  ]

  const toneList = [
    "Misteri / Menegangkan",
    "Edukasi / Informatif (Santai)",
    "Lucu / Komedi / Satir",
    "Inspiratif / Memotivasi",
    "Gosip Terkini / Pop Culture",
    "Bahas Sejarah / Konspirasi"
  ]

  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProductFile(file)
      setProductImage(URL.createObjectURL(file))
    }
  }

  useEffect(() => {
    const handlePaste = (e) => {
      if (activeTab !== 'storyboard') return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          setProductFile(file);
          setProductImage(URL.createObjectURL(file));
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  // --- GENERATE STORYBOARD LOGIC ---
  const handleGenerateStory = async () => {
    if (!productFile || !productDesc || !apiKey) {
      alert("Pastikan Gambar, Deskripsi, dan API Key sudah diisi.");
      return;
    }
    
    setIsGeneratingStory(true)
    setGeneratedPrompts([])
    
    try {
      const base64Image = await fileToBase64(productFile);
      const finalStyle = styleOption === 'Custom...' ? customStyle : styleOption;
      
      const systemPrompt = `You are an expert prompt engineer for an AI Video Generator (like Google Veo). 
Your task is to create a SINGLE, CONTINUOUS storytelling animation commercial based on a product image and description.

STRICT INSTRUCTIONS:
1. You MUST generate exactly ${promptCount} Prompts. 
2. CRITICAL: These ${promptCount} Prompts MUST form ONE connected, continuous story. Prompt 1 flows directly into Prompt 2, which flows into Prompt 3, and so on. Do not make them separate isolated ideas. They are consecutive 10-second segments of a single cohesive commercial.
3. Each Prompt represents exactly 10 SECONDS of this continuous video sequence. 
4. Each Prompt MUST be divided into exactly ${scenePerPrompt} Scenes.
5. The requested style is: "${finalStyle}". Apply this style strictly throughout the whole sequence.
${specialInstruction ? `6. SPECIAL INSTRUCTIONS FROM USER: "${specialInstruction}". YOU MUST FOLLOW THIS STRICTLY.` : ''}
7. Provide the output in plain text. DO NOT USE MARKDOWN.
8. Separate each main Prompt block with a separator line "---" so the system can parse it.
9. End each prompt with a "Voice Over Prompt [Number]". The voice over script must also be continuous across the prompts.

FOLLOW THIS EXACT FORMAT TEMPLATE FOR EVERY PROMPT:

PROMPT [Number] (StartSec-EndSec DETIK)
Judul: "[Title of the whole story]"
Style: [The style requested]

Scene 1 (StartSec-EndSec Detik)
Prompt: [Detailed visual description of the scene]

... (up to scene ${scenePerPrompt})

Voice Over Prompt [Number]
"[The spoken script that matches the 10 seconds of action]"
---
`;

      const response = await fetch("https://api.1inference.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: [
                { type: "text", text: `Product Description: ${productDesc}` },
                { type: "image_url", image_url: { url: base64Image } }
              ]
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      let generatedText = data.choices[0].message.content.trim().replace(/\*\*/g, ""); 
      
      const blocks = generatedText.split('---').map(b => b.trim()).filter(b => b.length > 0);
      setGeneratedPrompts(blocks);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingStory(false)
    }
  }

  const LogoSVG = () => (
    <svg viewBox="0 0 100 100" className="logo-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradTop" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="gradMid" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="gradBot" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7e22ce" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <path d="M50 18 L80 33 L50 48 L20 33 Z" fill="none" stroke="url(#gradTop)" strokeWidth="7" strokeLinejoin="round" />
      <path d="M22 45 L50 59 L78 45" fill="none" stroke="url(#gradMid)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 57 L50 71 L78 57" fill="none" stroke="url(#gradBot)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      {/* Sparkles */}
      <path d="M85 15 L88 22 L95 25 L88 28 L85 35 L82 28 L75 25 L82 22 Z" fill="url(#gradTop)" />
      <path d="M92 38 L94 42 L98 44 L94 46 L92 50 L90 46 L86 44 L90 42 Z" fill="#60a5fa" />
    </svg>
  );

  const EmptyStateRight = () => (
    <div className="glass-panel empty-state fade-in">
      <div className="empty-icon">✨</div>
      <h3>Hasil Prompt Akan Muncul di Sini</h3>
      <p>Klik 'Generate' di sebelah kiri untuk mulai membuat prompt video dari produk Anda.</p>
    </div>
  );

  const renderSidebar = () => (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <LogoSVG />
        <h2>Creator Hub AI</h2>
      </div>
      <nav className="sidebar-nav">
        <button className={`nav-item ${activeTab === 'storyboard' ? 'active' : ''}`} onClick={() => setActiveTab('storyboard')}>
          <span className="icon">🎬</span> Storyboard
        </button>
        <button className={`nav-item ${activeTab === 'thread' ? 'active' : ''}`} onClick={() => setActiveTab('thread')}>
          <span className="icon">🛒</span> Utas Affiliate
        </button>
        <button className={`nav-item ${activeTab === 'gen_thread' ? 'active' : ''}`} onClick={() => setActiveTab('gen_thread')}>
          <span className="icon">📰</span> Utas Bebas
        </button>
        <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <span className="icon">🔑</span> API Settings
        </button>
      </nav>

      <div className="sidebar-bottom">
        <div className="copyright">
          © 2025 Creator Hub AI<br/>All rights reserved.
        </div>
      </div>
    </aside>
  );

  const renderStoryboardForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2>Google Veo Prompt Generator</h2>
        <p className="subtitle">Ubah produk Anda menjadi rentetan prompt video 10-detik berkelanjutan untuk Google Veo.</p>

        <div className="layout-grid">
          <div className="glass-panel input-section">
            <div className="input-group">
              <label>Gambar Produk</label>
              <div className="image-upload-wrapper">
              {productImage ? (
                <div className="image-preview">
                  <img src={productImage} alt="Preview" />
                  <button className="btn-secondary" onClick={() => { setProductImage(null); setProductFile(null); }}>Ganti Gambar</button>
                </div>
              ) : (
                <label className="upload-placeholder">
                  <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                  <span className="upload-icon">⬆️</span>
                  <span>Klik untuk upload atau paste<br/>(CTRL+V)</span>
                  <small>PNG, JPG, WEBP hingga 10MB</small>
                </label>
              )}
            </div>
          </div>

          <div className="input-group">
            <label>Deskripsi Produk / Cerita</label>
            <textarea 
              placeholder="Contoh: Sebuah jam tangan pintar yang dipakai oleh petani..."
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              rows="4"
            />
          </div>

          <div className="input-group">
            <label>Instruksi Khusus (Opsional)</label>
            <textarea 
              placeholder="Contoh: Buat karakter tanpa wajah, fokus pada detail produk..."
              value={specialInstruction}
              onChange={(e) => setSpecialInstruction(e.target.value)}
              rows="2"
            />
          </div>

          <div className="input-group">
            <label>Style Animasi</label>
            <select value={styleOption} onChange={(e) => setStyleOption(e.target.value)} className="select-input">
              {stylesList.map((style, idx) => <option key={idx} value={style}>{style}</option>)}
            </select>
          </div>

          <div className="input-row">
            <div className="input-group">
              <label>Jumlah Prompt (10s/prompt)</label>
              <input type="number" min="1" max="10" value={promptCount} onChange={(e) => setPromptCount(e.target.value)} className="select-input" />
            </div>
            <div className="input-group">
              <label>Scene per Prompt</label>
              <select value={scenePerPrompt} onChange={(e) => setScenePerPrompt(e.target.value)} className="select-input">
                <option value="2">2 Scene</option>
                <option value="3">3 Scene</option>
                <option value="4">4 Scene</option>
              </select>
            </div>
          </div>

          <button className="btn-primary generate-btn" onClick={handleGenerateStory} disabled={!productFile || !productDesc || isGeneratingStory || !apiKey}>
            {isGeneratingStory ? 'Meracik Prompt...' : '✨ Generate Prompt'}
          </button>
          {!apiKey && <p className="warning-text">⚠️ Silakan masukkan API Key di menu API Settings terlebih dahulu.</p>}
          </div>

          <div className="glass-panel" style={{padding: '0', background: 'transparent', border: 'none', boxShadow: 'none'}}>
          {generatedPrompts.length > 0 ? (
            <div className="prompts-container">
              {generatedPrompts.map((promptText, index) => (
                <div key={index} className="prompt-card fade-in">
                  <div className="prompt-header">
                    <h3>Bagian {index + 1}</h3>
                    <button className="btn-copy" onClick={() => handleCopy(promptText, index)}>
                      {copiedIndex === index ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <pre className="prompt-content">{promptText}</pre>
                </div>
              ))}
            </div>
          ) : <EmptyStateRight />}
          </div>
        </div>
      </div>
    </div>
  );

  const handleGenerateThread = async () => {
    if (!threadTitle || !apiKey) {
      alert("Pastikan Judul Produk dan API Key sudah diisi.");
      return;
    }
    
    setIsGeneratingThread(true)
    setGeneratedThread(null)
    
    try {
      let lengthInstruction = "";
      if (threadLength.includes('Sangat Pendek')) {
        lengthInstruction = "Buat utas SANGAT PENDEK. Hanya 1 atau maksimal 2 tweet. Gunakan HANYA BEBERAPA KATA yang menohok/memancing rasa penasaran, lalu langsung berikan link afiliasi.";
      } else if (threadLength.includes('Pendek')) {
        lengthInstruction = "Buat utas pendek (3-5 tweet/bagian). Langsung ke intinya namun tetap persuasif.";
      } else {
        lengthInstruction = "Buat utas panjang bergaya storytelling (6-10 tweet/bagian). Bangun emosi, masalah, dan perlahan berikan solusi.";
      }

      const systemPrompt = `Kamu adalah seorang Copywriter Viral dan Affiliate Marketer kelas atas di platform X/Twitter dan Threads.
Keahlianmu adalah membuat konten berseri (Utas/Thread) yang sangat mengundang interaksi, memicu emosi (FOMO, rasa penasaran, atau empati), dan berujung pada klik link afiliasi.

ATURAN MUTLAK:
1. Pisahkan setiap tweet/bagian utas dengan "---" agar sistem bisa memotongnya.
2. Tweet pertama HARUS berupa HOOK yang sangat kuat. JANGAN terlihat seperti sedang berjualan di tweet pertama.
3. Gunakan bahasa Indonesia kasual, gaul, namun tetap profesional (seperti selebtwit).
4. ${lengthInstruction}
5. Selipkan "Link produk: [LINK AFILIASI]" di bagian akhir utas atau di bagian call-to-action.
6. Jangan gunakan hashtag yang berlebihan, maksimal 2 hashtag natural.`;

      const userPrompt = `Judul Produk: ${threadTitle}
Deskripsi Produk/Benefit: ${threadDesc || 'Buat benefit yang sangat menggoda berdasarkan judul produk di atas.'}
Link Afiliasi Saya: ${threadLink || '[ISI_LINK_NANTI]'}`;

      const response = await fetch("https://api.1inference.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.8
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      let generatedText = data.choices[0].message.content.trim().replace(/\*\*/g, ""); 
      
      const blocks = generatedText.split('---').map(b => b.trim()).filter(b => b.length > 0);
      setGeneratedThread(blocks);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingThread(false)
    }
  }

  const handleGenerateGenThread = async () => {
    if (!genThreadTopic || !apiKey) {
      alert("Pastikan Topik/Ide Cerita dan API Key sudah diisi.");
      return;
    }
    
    setIsGeneratingGenThread(true)
    setGeneratedGenThread(null)
    
    try {
      const systemPrompt = `Kamu adalah Kreator Konten Viral di X (Twitter) dan Threads.
Tugasmu adalah membuat utas (thread) organik murni untuk mendapatkan ribuan likes, retweets, dan followers baru.
TIDAK ADA UNSUR JUALAN SAMA SEKALI.

ATURAN MUTLAK:
1. Pisahkan setiap tweet/bagian utas dengan "---" agar sistem bisa memotongnya.
2. Tweet pertama HARUS berupa HOOK kontroversial, mencengangkan, atau membuat orang sangat penasaran sampai harus membaca kelanjutannya.
3. Gaya Bahasa / Tone yang diminta: ${genThreadTone}. Sesuaikan pilihan kata (diksi) dengan tone ini!
4. Panjang utas: ${genThreadLength}. (Pendek: 3-5 tweet, Panjang: 6-10 tweet).
5. Jika ada sumber referensi yang diberikan, gabungkan secara natural ke dalam cerita.
6. Jangan gunakan kalimat penutup yang kaku, gunakan pertanyaan yang memancing balasan/reply dari netizen di akhir utas.`;

      const userPrompt = `Topik / Ide Cerita: ${genThreadTopic}
Sumber Referensi (Opsional): ${genThreadSource || 'Gunakan pengetahuanmu sendiri'}`;

      const response = await fetch("https://api.1inference.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.85
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      let generatedText = data.choices[0].message.content.trim().replace(/\*\*/g, ""); 
      
      const blocks = generatedText.split('---').map(b => b.trim()).filter(b => b.length > 0);
      setGeneratedGenThread(blocks);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingGenThread(false)
    }
  }

  const renderThreadForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2>Utas Affiliate</h2>
        <p className="subtitle">Buat thread jualan berbalut storytelling yang memicu FOMO dan konversi tinggi.</p>
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <div className="input-group">
              <label>Judul Produk</label>
              <input type="text" className="api-key-input" placeholder="Contoh: Sepatu Lari Lokal Kualitas Dunia" value={threadTitle} onChange={(e) => setThreadTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Deskripsi Produk (Opsional)</label>
              <textarea placeholder="Ceritakan fitur unggulan atau masalah yang bisa diselesaikan produk ini..." value={threadDesc} onChange={(e) => setThreadDesc(e.target.value)} rows="3" />
            </div>
            <div className="input-group">
              <label>Link Affiliate (Opsional)</label>
              <input type="text" className="api-key-input" placeholder="https://shope.ee/..." value={threadLink} onChange={(e) => setThreadLink(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Panjang Utas</label>
              <select value={threadLength} onChange={(e) => setThreadLength(e.target.value)} className="select-input">
                <option value="Sangat Pendek (1-2 Kalimat)">Sangat Pendek (Soft Selling - 1-2 Kalimat)</option>
                <option value="Pendek (Singkat & Padat)">Pendek (Singkat & Padat - 3-5 Bagian)</option>
                <option value="Panjang (Storytelling Mendalam)">Panjang (Storytelling Mendalam - 6-10 Bagian)</option>
              </select>
            </div>
            <button className="btn-primary generate-btn" onClick={handleGenerateThread} disabled={!threadTitle || isGeneratingThread || !apiKey}>
              {isGeneratingThread ? 'Menyusun Utas...' : '✨ Generate Utas Affiliate'}
            </button>
            {!apiKey && <p className="warning-text">⚠️ Silakan masukkan API Key di menu API Settings terlebih dahulu.</p>}
          </div>
          <div className="glass-panel" style={{padding: '0', background: 'transparent', border: 'none', boxShadow: 'none'}}>
          {generatedThread ? (
            <div className="prompts-container">
              {generatedThread.map((tweet, index) => (
                <div key={index} className="prompt-card fade-in">
                  <div className="prompt-header">
                    <h3>{index === 0 ? 'Hook (Tweet 1)' : `Tweet ${index + 1}`}</h3>
                    <button className="btn-copy" onClick={() => handleCopy(tweet, index)}>
                      {copiedIndex === index ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <pre className="prompt-content">{tweet}</pre>
                </div>
              ))}
            </div>
          ) : <EmptyStateRight />}
          </div>
        </div>
      </div>
    </div>
  );

  const renderGenThreadForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2>Utas Bebas (Viral Umum)</h2>
        <p className="subtitle">Buat konten murni untuk engagement tanpa unsur jualan.</p>
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <div className="input-group">
              <label>Topik / Ide Cerita</label>
              <textarea placeholder="Contoh: Misteri hilangnya kapal di segitiga bermuda..." value={genThreadTopic} onChange={(e) => setGenThreadTopic(e.target.value)} rows="3" />
            </div>
            <div className="input-group">
              <label>Sumber Referensi (Opsional)</label>
              <input type="text" className="api-key-input" placeholder="Link berita atau buku acuan..." value={genThreadSource} onChange={(e) => setGenThreadSource(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Gaya Bahasa (Tone)</label>
              <select value={genThreadTone} onChange={(e) => setGenThreadTone(e.target.value)} className="select-input">
                {toneList.map((tone, idx) => <option key={idx} value={tone}>{tone}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Panjang Utas</label>
              <select value={genThreadLength} onChange={(e) => setGenThreadLength(e.target.value)} className="select-input">
                <option value="Pendek (Singkat & Padat - 3-5 Bagian)">Pendek (Singkat & Padat - 3-5 Bagian)</option>
                <option value="Panjang (Cerita Mendalam - 6-10 Bagian)">Panjang (Cerita Mendalam - 6-10 Bagian)</option>
              </select>
            </div>
            <button className="btn-primary generate-btn" onClick={handleGenerateGenThread} disabled={!genThreadTopic || isGeneratingGenThread || !apiKey}>
              {isGeneratingGenThread ? 'Menyusun Utas...' : '✨ Generate Utas Viral'}
            </button>
            {!apiKey && <p className="warning-text">⚠️ Silakan masukkan API Key di menu API Settings terlebih dahulu.</p>}
          </div>
          <div className="glass-panel" style={{padding: '0', background: 'transparent', border: 'none', boxShadow: 'none'}}>
          {generatedGenThread ? (
            <div className="prompts-container">
              {generatedGenThread.map((tweet, index) => (
                <div key={index} className="prompt-card fade-in">
                  <div className="prompt-header">
                    <h3>{index === 0 ? 'Hook (Tweet 1)' : `Tweet ${index + 1}`}</h3>
                    <button className="btn-copy" onClick={() => handleCopy(tweet, index)}>
                      {copiedIndex === index ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <pre className="prompt-content">{tweet}</pre>
                </div>
              ))}
            </div>
          ) : <EmptyStateRight />}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2>API Settings</h2>
        <p className="subtitle">Atur kunci API Anda di sini.</p>
        <div className="glass-panel">
        <div className="input-group" style={{maxWidth: '500px', margin: '0 auto', textAlign: 'left'}}>
          <label>API Key (1inference / OpenAI)</label>
          <input 
            type="password"
            placeholder="Paste your API Key here (sk-xxx...)"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              localStorage.setItem('storyboard_api_key', e.target.value);
            }}
            className="api-key-input"
          />
          <small className="help-text">API Key tersimpan aman di browser Anda.</small>
        </div>
      </div>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      {renderSidebar()}
      <main className="main-content">
        {activeTab === 'storyboard' && renderStoryboardForm()}
        {activeTab === 'thread' && renderThreadForm()}
        {activeTab === 'gen_thread' && renderGenThreadForm()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  )
}

export default App
