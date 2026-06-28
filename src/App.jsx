import { useState, useEffect } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('storyboard')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('storyboard_api_key') || '')
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [history, setHistory] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // --- AUTHENTICATION STATES ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('storyboard_auth') === 'true')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState(false)

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

  // --- AI IMAGE GEN STATES ---
  const [imgPrompt, setImgPrompt] = useState('')
  const [imgModel, setImgModel] = useState('turbo-free') 
  const [customOpenRouterModel, setCustomOpenRouterModel] = useState('')
  const [isGeneratingImg, setIsGeneratingImg] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null)

  // --- EDU-MATION STATES ---
  const [eduTopic, setEduTopic] = useState('')
  const [eduAudience, setEduAudience] = useState('Anak-anak (Bahasanya ceria & simpel)')
  const [eduCharacter, setEduCharacter] = useState('')
  const [eduStyle, setEduStyle] = useState('3D Pixar Animation Style')
  const [eduDuration, setEduDuration] = useState('Pendek (3 Scene)')
  const [isGeneratingEdu, setIsGeneratingEdu] = useState(false)
  const [generatedEdu, setGeneratedEdu] = useState(null)
  const [eduCharImg, setEduCharImg] = useState(null)
  
  // --- SELLING POINT STATES ---
  const [sellingProductInfo, setSellingProductInfo] = useState('')
  const [isGeneratingSelling, setIsGeneratingSelling] = useState(false)
  const [generatedSelling, setGeneratedSelling] = useState(null)

  const eduAudienceList = ['Balita (Sangat simpel, ceria)', 'Anak-anak (Bahasanya ceria & seru)', 'Remaja (Gaul & asik)', 'Umum (Profesional tapi santai)'];
  const eduStyleList = ['3D Pixar Animation Style', '2D Vector Cartoon Flat', 'Claymation (Plastisin Stop Motion)', 'Anime Style Vibrant'];

  const stylesList = [
    "Kartun 3D lucu, warna cerah, karakter Indonesia",
    "Cinematic Realism, film look, dramatic lighting",
    "Anime Style, Makoto Shinkai aesthetic, vibrant",
    "Minimalist 2D Vector, corporate friendly, smooth",
    "Stop Motion Clay animation, warm lighting, playful",
    "Custom..."
  ]

  const toneList = ['Sangat Emosional/Baper', 'Misterius/Penasaran', 'Inspiratif & Motivasi', 'Kontroversial (Bikin Debat)', 'Santai & Lucu'];

  const supabaseUrl = 'https://xkixokhnofujcnehuvgz.supabase.co';
  const supabaseKey = 'sb_publishable_zryQEkMVI1nD3R3Cgf0zdw_LTD0nwtY';

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/prompts?select=*&order=created_at.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const saveToSupabase = async (blocks, type, desc) => {
    setIsSaving(true);
    const resultText = blocks.join('\n\n---\n\n');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/prompts`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          type: type,
          product_desc: desc,
          result: resultText
        })
      });
      if (response.ok) {
        alert("Berhasil disimpan permanen ke Database!");
      } else {
        const err = await response.json();
        alert("Gagal: " + (err.message || JSON.stringify(err)));
      }
    } catch(e) {
      alert("Error jaringan: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

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
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (e) => reject(e);
    };
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

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Provider": "1inference"
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
    <>
      {isMobileMenuOpen && <div className="mobile-overlay fade-in" onClick={() => setIsMobileMenuOpen(false)}></div>}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <LogoSVG />
          <h2>Creator Hub AI</h2>
          <button className="hamburger-btn close-btn" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'storyboard' ? 'active' : ''}`} onClick={() => {setActiveTab('storyboard'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">🎬</span> Storyboard</div>
            <span className="nav-arrow">&gt;</span>
          </button>
          <button className={`nav-item ${activeTab === 'edu_mation' ? 'active' : ''}`} onClick={() => {setActiveTab('edu_mation'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">🎓</span> Edu-Animasi</div>
            <span className="nav-arrow">&gt;</span>
          </button>
          <button className={`nav-item ${activeTab === 'image_gen' ? 'active' : ''}`} onClick={() => {setActiveTab('image_gen'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">🎨</span> AI Image</div>
            <span className="nav-arrow">&gt;</span>
          </button>
          <button className={`nav-item ${activeTab === 'thread' ? 'active' : ''}`} onClick={() => {setActiveTab('thread'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">🛒</span> Threads Affiliate</div>
            <span className="nav-arrow">&gt;</span>
          </button>
          <button className={`nav-item ${activeTab === 'gen_thread' ? 'active' : ''}`} onClick={() => {setActiveTab('gen_thread'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">📰</span> Threads Umum</div>
            <span className="nav-arrow">&gt;</span>
          </button>
          <button className={`nav-item ${activeTab === 'selling_point' ? 'active' : ''}`} onClick={() => {setActiveTab('selling_point'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">🎯</span> Selling Point</div>
            <span className="nav-arrow">&gt;</span>
          </button>
          <button className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => {setActiveTab('history'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">🔍</span> Riwayat</div>
            <span className="nav-arrow">&gt;</span>
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => {setActiveTab('settings'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">🔑</span> API Key</div>
            <span className="nav-arrow">&gt;</span>
          </button>
        </nav>

      <div className="sidebar-bottom">
        <div style={{background: 'var(--active-gradient)', padding: '1.2rem', borderRadius: '16px', color: 'white', marginBottom: '1rem', boxShadow: '0 10px 25px rgba(99,102,241,0.3)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', marginBottom: '0.5rem'}}>
            <span style={{color: '#fbbf24'}}>⭐</span> Upgrade ke Pro
          </div>
          <p style={{fontSize: '0.75rem', opacity: 0.9, marginBottom: '1rem', lineHeight: 1.4}}>
            Dapatkan fitur premium dan akses tanpa batas.
          </p>
          <button style={{width: '100%', padding: '0.6rem', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600'}}>
            Upgrade Sekarang
          </button>
        </div>
        <div className="copyright">
          © 2025 Creator Hub AI<br/>All rights reserved.
        </div>
      </div>
    </aside>
    </>
  );

  const renderStoryboardForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">Google Veo Prompt Generator</h2>
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
              <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                <button className="btn-secondary" onClick={() => saveToSupabase(generatedPrompts, 'Storyboard', productDesc)} disabled={isSaving} style={{flex: 1}}>
                  {isSaving ? 'Menyimpan...' : '💾 Simpan ke Database'}
                </button>
              </div>
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

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Provider": "1inference"
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

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Provider": "1inference"
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

  const handleGenerateImage = async () => {
    if (!imgPrompt) return alert("Prompt tidak boleh kosong!");
    if (!imgModel.includes('free') && !apiKey) {
      alert("Pastikan API Key sudah diisi di menu API Settings untuk menggunakan model berbayar.");
      return;
    }

    setIsGeneratingImg(true);
    setGeneratedImageUrl(null);

    try {
      if (imgModel === 'flux-free' || imgModel === 'turbo-free') {
        const modelParam = imgModel === 'flux-free' ? 'flux' : 'turbo';
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?model=${modelParam}&seed=${Math.floor(Math.random() * 10000)}&nologo=true`;
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setGeneratedImageUrl(url);
          setIsGeneratingImg(false);
        };
        img.onerror = () => {
          setIsGeneratingImg(false);
          alert("Gagal memuat gambar dari server gratis.");
        }
      } else {
        // Gunakan 1inference API
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "X-Provider": "1inference"
          },
          body: JSON.stringify({
            model: imgModel,
            prompt: imgPrompt
          })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0 && data.data[0].url) {
          setGeneratedImageUrl(data.data[0].url);
        } else {
          throw new Error("Gagal mendapatkan URL gambar dari API.");
        }
        setIsGeneratingImg(false);
      }
    } catch (e) {
      alert("Error: " + e.message);
      setIsGeneratingImg(false);
    }
  };

  const handleGenerateEdu = async () => {
    if (!eduTopic || !eduCharacter || !apiKey) {
      alert("Pastikan Topik, Ide Karakter, dan API Key sudah diisi.");
      return;
    }
    
    setIsGeneratingEdu(true)
    setGeneratedEdu(null)
    setEduCharImg(null)
    
    try {
      const numScenes = eduDuration.includes('Pendek') ? 3 : 6;
      const systemPrompt = `Anda adalah Sutradara Animasi Edukasi dan Prompt Engineer tingkat ahli.
Tugas Anda adalah merancang paket penyutradaraan (Director's Pack) untuk video animasi edukasi.
Anda akan diberikan: Topik, Target Penonton, Ide Karakter Utama, Gaya Visual, dan Jumlah Scene.

HASILKAN OUTPUT DALAM BENTUK JSON DENGAN STRUKTUR BERIKUT:
{
  "char_prompt": "Prompt bahasa Inggris yang sangat detail untuk image generator (menjelaskan karakter utama, gaya visual, latar belakang putih bersih, seluruh tubuh terlihat, rasio 1:1).",
  "voice_over": "Naskah narator/voice over dalam bahasa Indonesia yang memikat, mendidik, dan disesuaikan dengan bahasa Target Penonton.",
  "video_prompts": [
    {
      "scene_no": 1,
      "time": "0-5 detik",
      "prompt": "Prompt bahasa Inggris sangat deskriptif untuk Video AI (Veo 3 / Kling), menggunakan gaya visual yang diminta, menjelaskan aksi karakter di scene ini, cinematic lighting, dll."
    }
  ]
}

PASTIKAN OUTPUT MURNI JSON TANPA FORMATTING MARKDOWN \`\`\`json ! Pastikan array video_prompts berisi persis sejumlah scene yang diminta.`;

      const userPrompt = `Topik Pembelajaran: ${eduTopic}\nTarget Penonton: ${eduAudience}\nIde Karakter Utama: ${eduCharacter}\nGaya Visual: ${eduStyle}\nJumlah Scene: ${numScenes} scene`;

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Provider": "1inference"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      let generatedText = data.choices[0].message.content.trim();
      if (generatedText.startsWith('```json')) {
         generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      
      const parsedData = JSON.parse(generatedText);
      setGeneratedEdu(parsedData);

      if (parsedData.char_prompt) {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(parsedData.char_prompt)}?model=flux&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
        const img = new Image();
        img.src = url;
        img.onload = () => {
          setEduCharImg(url);
        };
      }

    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingEdu(false)
    }
  }

  const renderEduForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">🎓 Edu-Animasi (Director's Pack)</h2>
        <p className="subtitle">Rancang karakter, naskah, dan prompt video edukasi profesional dalam sekali klik.</p>
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <div className="input-group">
              <label>Topik Pembelajaran</label>
              <textarea placeholder="Contoh: Cara menyikat gigi yang benar..." value={eduTopic} onChange={(e) => setEduTopic(e.target.value)} rows="2" />
            </div>
            <div className="input-group">
              <label>Ide Karakter Utama</label>
              <textarea placeholder="Contoh: Sebuah gigi graham putih yang memiliki mata bulat besar, bibir tersenyum, memegang sikat gigi..." value={eduCharacter} onChange={(e) => setEduCharacter(e.target.value)} rows="3" />
            </div>
            <div className="input-group">
              <label>Target Penonton</label>
              <select value={eduAudience} onChange={(e) => setEduAudience(e.target.value)} className="select-input">
                {eduAudienceList.map((aud, idx) => <option key={idx} value={aud}>{aud}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Gaya Visual</label>
              <select value={eduStyle} onChange={(e) => setEduStyle(e.target.value)} className="select-input">
                {eduStyleList.map((st, idx) => <option key={idx} value={st}>{st}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Durasi Video</label>
              <select value={eduDuration} onChange={(e) => setEduDuration(e.target.value)} className="select-input">
                <option value="Pendek (3 Scene)">Pendek (3 Scene - Cocok untuk Shorts)</option>
                <option value="Panjang (6 Scene)">Panjang (6 Scene - Cocok untuk YouTube)</option>
              </select>
            </div>
            <button className="btn-primary generate-btn" onClick={handleGenerateEdu} disabled={!eduTopic || !eduCharacter || isGeneratingEdu || !apiKey}>
              {isGeneratingEdu ? 'Meracik Ide...' : '✨ Buat Konsep Edukasi'}
            </button>
            {!apiKey && <p className="warning-text">⚠️ Silakan masukkan API Key di menu API Settings terlebih dahulu.</p>}
          </div>
          
          <div className="glass-panel" style={{padding: '0', background: 'transparent', border: 'none', boxShadow: 'none'}}>
          {generatedEdu ? (
            <div className="prompts-container">
              <div className="prompt-card fade-in">
                <div className="prompt-header">
                  <h3>🎨 Karakter & Naskah Narator</h3>
                </div>
                <div style={{padding: '1rem'}}>
                  <div style={{display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap'}}>
                    <div style={{flex: '1 1 150px', minWidth: '150px', background: '#f8fafc', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '1/1'}}>
                      {eduCharImg ? <img src={eduCharImg} alt="Karakter" style={{width: '100%', height: '100%', objectFit: 'cover'}} /> : <span className="loading-spinner"></span>}
                    </div>
                    <div style={{flex: '2 1 300px'}}>
                      <h4 style={{marginBottom: '0.5rem', color: 'var(--primary-color)'}}>Prompt Desain Karakter</h4>
                      <pre className="prompt-content" style={{padding: '0.5rem', fontSize: '0.8rem', background: '#f1f5f9'}}>{generatedEdu.char_prompt}</pre>
                    </div>
                  </div>
                  <h4 style={{marginTop: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary-color)'}}>Naskah Suara (Voice Over)</h4>
                  <pre className="prompt-content" style={{padding: '1rem'}}>{generatedEdu.voice_over}</pre>
                </div>
              </div>

              <div className="prompt-card fade-in" style={{marginTop: '1rem'}}>
                <div className="prompt-header">
                  <h3>🎬 Prompt Video AI (Veo 3 / Flow)</h3>
                </div>
                <div style={{padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {generatedEdu.video_prompts.map((vp, index) => (
                    <div key={index} style={{background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 'bold'}}>
                        <span style={{color: 'var(--text-primary)'}}>Scene {vp.scene_no}</span>
                        <span style={{color: 'var(--primary-color)', fontSize: '0.85rem'}}>{vp.time}</span>
                      </div>
                      <pre className="prompt-content" style={{padding: '0.5rem', background: '#ffffff'}}>{vp.prompt}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : <EmptyStateRight />}
          </div>
        </div>
      </div>
    </div>
  );

  const handleGenerateSelling = async () => {
    if (!sellingProductInfo || !apiKey) {
      alert("Pastikan Deskripsi/Tautan Produk dan API Key sudah diisi.");
      return;
    }
    
    setIsGeneratingSelling(true)
    setGeneratedSelling(null)
    
    try {
      const systemPrompt = `Anda adalah seorang manajer produk berpengalaman. Tugas Anda adalah mengidentifikasi poin penjualan produk dan memecahkan masalah nyata yang dihadapi pelanggan.
Pengguna akan memberi Anda tautan atau deskripsi produk.
OUTPUT WAJIB DALAM BENTUK JSON DENGAN STRUKTUR BERIKUT:
{
  "target_market": ["List siapa yang cocok menggunakan produk ini"],
  "pain_points": ["List masalah yang sering dialami pengguna"],
  "solutions": [{"masalah": "...", "solusi": "..."}],
  "usp": ["List Unique Selling Point utama"],
  "emotional_hook": ["List alasan emosional kenapa orang beli"],
  "marketing_angles": [{"angle": "Nama angle (misal: Protection Angle)", "copy": "Contoh kalimat iklan pendek"}],
  "ad_hooks": ["List contoh kalimat hook iklan yang high convert"],
  "positioning": {"title": "Posisi produk (misal: Mid-range stylish)", "details": ["List detail positioning"]},
  "viral_potential": ["List alasan kenapa produk ini bisa viral/laku keras"]
}
PASTIKAN OUTPUT MURNI JSON TANPA FORMATTING MARKDOWN \`\`\`json !`;

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Provider": "1inference"
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Deskripsi/Tautan Produk:\n${sellingProductInfo}` }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      let generatedText = data.choices[0].message.content.trim();
      if (generatedText.startsWith('```json')) {
         generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      
      setGeneratedSelling(generatedText);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingSelling(false)
    }
  }

  const renderSellingForm = () => {
    let parsedSelling = null;
    if (generatedSelling) {
      try {
        parsedSelling = JSON.parse(generatedSelling);
      } catch(e) {
        // If not json, parsedSelling remains null
      }
    }

    return (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">🎯 Analisis Selling Point</h2>
        <p className="subtitle">Bedah masalah pelanggan dan temukan poin penjualan yang paling tajam dari sebuah produk.</p>
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <div className="input-group">
              <label>Deskripsi atau Tautan Produk</label>
              <textarea placeholder="Contoh: Sepatu lari anti air merek X..." value={sellingProductInfo} onChange={(e) => setSellingProductInfo(e.target.value)} rows="5" />
            </div>
            
            <button className="btn-primary generate-btn" onClick={handleGenerateSelling} disabled={!sellingProductInfo || isGeneratingSelling || !apiKey}>
              {isGeneratingSelling ? 'Menganalisis...' : '✨ Temukan Selling Point'}
            </button>
            {!apiKey && <p className="warning-text">⚠️ Silakan masukkan API Key di menu API Settings terlebih dahulu.</p>}
          </div>
          
          <div className="glass-panel" style={{padding: '0', background: 'transparent', border: 'none', boxShadow: 'none'}}>
          {generatedSelling ? (
            <div className="prompts-container">
              <div className="prompt-card fade-in">
                <div className="prompt-header">
                  <h3>Hasil Analisis</h3>
                  <button className="btn-copy" onClick={() => handleCopy(generatedSelling, 'selling')}>
                    {copiedIndex === 'selling' ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
                
                {parsedSelling && parsedSelling.target_market ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1.5rem', background: '#ffffff', borderRadius: '0 0 12px 12px', color: '#1e293b'}}>
                    
                    {/* 1. TARGET MARKET */}
                    <div>
                      <h4 style={{fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span style={{fontSize: '1.4rem'}}>🔍</span> 1. TARGET MARKET (Siapa yang paling cocok)</h4>
                      <ul style={{paddingLeft: '1.5rem', lineHeight: '1.6', color: '#334155'}}>
                        {parsedSelling.target_market.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                    
                    <hr style={{border: 'none', borderTop: '1px solid #e2e8f0'}} />
                    
                    {/* 2. PAIN POINTS */}
                    <div>
                      <h4 style={{fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span style={{fontSize: '1.4rem'}}>💥</span> 2. MASALAH UTAMA CUSTOMER (Pain Points)</h4>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontWeight: 'bold', color: '#b91c1c'}}><span>❌</span> Masalah yang sering dialami pengguna:</div>
                      <ol style={{paddingLeft: '1.5rem', lineHeight: '1.6', color: '#334155', fontWeight: 'bold'}}>
                        {parsedSelling.pain_points.map((item, i) => <li key={i}>{item}</li>)}
                      </ol>
                    </div>

                    <hr style={{border: 'none', borderTop: '1px solid #e2e8f0'}} />

                    {/* 3. SOLUTIONS */}
                    {parsedSelling.solutions && (
                      <div>
                        <h4 style={{fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span style={{fontSize: '1.4rem'}}>✅</span> 3. SOLUSI YANG DITAWARKAN PRODUK</h4>
                        <div style={{overflowX: 'auto'}}>
                          <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem', fontSize: '0.95rem'}}>
                            <thead>
                              <tr style={{background: '#f1f5f9', borderBottom: '2px solid #cbd5e1'}}>
                                <th style={{padding: '0.75rem', textAlign: 'left', width: '50%'}}>Masalah Customer</th>
                                <th style={{padding: '0.75rem', textAlign: 'left', width: '50%'}}>Solusi dari Produk</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedSelling.solutions.map((item, i) => (
                                <tr key={i} style={{borderBottom: '1px solid #e2e8f0'}}>
                                  <td style={{padding: '0.75rem', color: '#475569'}}>{item.masalah}</td>
                                  <td style={{padding: '0.75rem', color: '#047857', fontWeight: '500'}}>{item.solusi}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <hr style={{border: 'none', borderTop: '1px solid #e2e8f0'}} />

                    {/* 4. USP */}
                    {parsedSelling.usp && (
                      <div>
                        <h4 style={{fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span style={{fontSize: '1.4rem'}}>⭐</span> 4. UNIQUE SELLING POINT (USP)</h4>
                        <div style={{marginBottom: '0.5rem', fontWeight: 'bold', color: '#ea580c'}}>🔥 Ini yang bikin produk “KEJUALAN”:</div>
                        <ul style={{paddingLeft: '1.5rem', lineHeight: '1.6', color: '#334155', fontWeight: 'bold'}}>
                          {parsedSelling.usp.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    <hr style={{border: 'none', borderTop: '1px solid #e2e8f0'}} />

                    {/* 5. EMOTIONAL HOOK */}
                    {parsedSelling.emotional_hook && (
                      <div>
                        <h4 style={{fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span style={{fontSize: '1.4rem'}}>🧠</span> 5. EMOTIONAL HOOK (Kenapa orang beli)</h4>
                        <div style={{marginBottom: '0.5rem', fontStyle: 'italic', color: '#475569'}}>Produk ini bukan cuma barang, tapi:</div>
                        <ul style={{paddingLeft: '1.5rem', lineHeight: '1.6', color: '#334155'}}>
                          {parsedSelling.emotional_hook.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    <hr style={{border: 'none', borderTop: '1px solid #e2e8f0'}} />

                    {/* 6. MARKETING ANGLES */}
                    {parsedSelling.marketing_angles && (
                      <div>
                        <h4 style={{fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span style={{fontSize: '1.4rem'}}>🎯</span> 6. ANGLE MARKETING PALING KUAT</h4>
                        <div style={{marginBottom: '0.8rem', color: '#475569'}}>Beberapa angle yang bisa dipakai untuk jualan:</div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                          {parsedSelling.marketing_angles.map((item, i) => (
                            <div key={i}>
                              <div style={{fontWeight: 'bold', color: '#334155'}}>{i+1}. {item.angle}</div>
                              <div style={{color: '#0284c7', fontStyle: 'italic', marginTop: '0.2rem'}}>“{item.copy}”</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <hr style={{border: 'none', borderTop: '1px solid #e2e8f0'}} />

                    {/* 7. AD HOOKS */}
                    {parsedSelling.ad_hooks && (
                      <div>
                        <h4 style={{fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span style={{fontSize: '1.4rem'}}>🎬</span> 7. CONTOH HOOK IKLAN (HIGH CONVERT)</h4>
                        <ul style={{paddingLeft: '1.5rem', lineHeight: '1.6', color: '#16a34a', fontWeight: '500', fontStyle: 'italic'}}>
                          {parsedSelling.ad_hooks.map((item, i) => <li key={i}>“{item}”</li>)}
                        </ul>
                      </div>
                    )}

                    <hr style={{border: 'none', borderTop: '1px solid #e2e8f0'}} />

                    {/* 8. POSITIONING */}
                    {parsedSelling.positioning && (
                      <div>
                        <h4 style={{fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span style={{fontSize: '1.4rem'}}>📦</span> 8. POSITIONING PRODUK</h4>
                        <div style={{fontWeight: 'bold', color: '#4f46e5', marginBottom: '0.5rem'}}>👉 {parsedSelling.positioning.title}</div>
                        <ul style={{paddingLeft: '1.5rem', lineHeight: '1.6', color: '#334155'}}>
                          {parsedSelling.positioning.details.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    <hr style={{border: 'none', borderTop: '1px solid #e2e8f0'}} />

                    {/* 9. VIRAL POTENTIAL */}
                    {parsedSelling.viral_potential && (
                      <div>
                        <h4 style={{fontSize: '1.1rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}><span style={{fontSize: '1.4rem'}}>🚀</span> 9. POTENSI VIRAL (Kenapa bisa laku keras)</h4>
                        <div style={{marginBottom: '0.5rem', color: '#475569'}}>Produk ini punya:</div>
                        <ul style={{paddingLeft: '1.5rem', lineHeight: '1.6', color: '#334155', fontWeight: '500'}}>
                          {parsedSelling.viral_potential.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                  </div>
                ) : (
                  <pre className="prompt-content" style={{padding: '1rem', whiteSpace: 'pre-wrap'}}>{generatedSelling}</pre>
                )}
              </div>
              <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                <button className="btn-secondary" onClick={() => saveToSupabase([generatedSelling], 'Selling Point', sellingProductInfo.substring(0,30))} disabled={isSaving} style={{flex: 1}}>
                  {isSaving ? 'Menyimpan...' : '💾 Simpan ke Database'}
                </button>
              </div>
            </div>
          ) : <EmptyStateRight />}
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderImageGenForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">AI Image Generator</h2>
        <p className="subtitle">Ubah teks menjadi gambar menakjubkan dengan AI tingkat tinggi.</p>
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <div className="input-group">
              <label>Pilih Mesin AI (Model)</label>
              <select value={imgModel} onChange={(e) => setImgModel(e.target.value)} className="select-input">
                <optgroup label="Server Gratis (Tanpa API Key)">
                  <option value="turbo-free">SDXL Turbo (100% Gratis - Cepat & Artistik)</option>
                  <option value="flux-free">Flux.1 AI (100% Gratis - Kualitas HD Realistis)</option>
                </optgroup>
                <optgroup label="1inference (Butuh API Key)">
                  <option value="dall-e-3">DALL-E 3 (Kualitas Tertinggi OpenAI)</option>
                  <option value="venice-z-image-turbo">Venice Image Turbo (Cepat & Stabil)</option>
                  <option value="seedream-4.5">Seedream 4.5</option>
                </optgroup>
              </select>
            </div>

            <div className="input-group">
              <label>Deskripsi Gambar (Prompt)</label>
              <textarea placeholder="Contoh: Kucing lucu memakai kacamata hitam di pantai..." value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} rows="4" />
            </div>
            
            <button className="btn-primary generate-btn" onClick={handleGenerateImage} disabled={!imgPrompt || isGeneratingImg}>
              {isGeneratingImg ? 'Melukis Gambar...' : '🎨 Generate Gambar'}
            </button>
          </div>
          
          <div className="glass-panel" style={{padding: '1.5rem', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px'}}>
            {isGeneratingImg ? (
              <div style={{textAlign: 'center'}}><span className="loading-spinner" style={{width: '40px', height: '40px', borderTopColor: 'var(--primary-color)'}}></span><p style={{marginTop: '1rem', color: 'var(--text-secondary)'}}>Sedang melukis...</p></div>
            ) : generatedImageUrl ? (
              <div className="fade-in" style={{width: '100%', textAlign: 'center'}}>
                <img src={generatedImageUrl} alt="Hasil AI" style={{width: '100%', borderRadius: '12px', border: '1px solid var(--glass-border)', marginBottom: '1rem'}} />
                <a href={generatedImageUrl} download="hasil-ai.png" target="_blank" rel="noreferrer" style={{display: 'inline-block', background: 'var(--primary-color)', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold'}}>
                  ⬇️ Download Gambar
                </a>
              </div>
            ) : (
              <div style={{textAlign: 'center', color: 'var(--text-secondary)', opacity: 0.7}}>
                <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🖼️</div>
                <h3>Hasil Gambar Akan Muncul di Sini</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderThreadForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">Utas Affiliate</h2>
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
              <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                <button className="btn-secondary" onClick={() => saveToSupabase(generatedThread, 'Utas Affiliate', threadTitle)} disabled={isSaving} style={{flex: 1}}>
                  {isSaving ? 'Menyimpan...' : '💾 Simpan ke Database'}
                </button>
              </div>
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
        <h2 className="desktop-title">Utas Bebas (Viral Umum)</h2>
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
              <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                <button className="btn-secondary" onClick={() => saveToSupabase(generatedGenThread, 'Utas Bebas', genThreadTopic)} disabled={isSaving} style={{flex: 1}}>
                  {isSaving ? 'Menyimpan...' : '💾 Simpan ke Database'}
                </button>
              </div>
            </div>
          ) : <EmptyStateRight />}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">Riwayat Generate</h2>
        <p className="subtitle">Daftar semua prompt yang pernah Anda buat tersimpan aman di Database.</p>
        
        {isHistoryLoading ? (
          <div style={{textAlign: 'center', padding: '2rem'}}><span className="loading-spinner"></span> Memuat database...</div>
        ) : history.length === 0 ? (
          <div className="glass-panel" style={{textAlign: 'center', opacity: 0.7}}>Belum ada data yang tersimpan.</div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {history.map(item => (
              <div key={item.id} className="glass-panel" style={{padding: '1.5rem'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center'}}>
                  <span style={{background: 'var(--primary-color)', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold'}}>{item.type}</span>
                  <span style={{fontSize: '0.7rem', color: 'var(--text-secondary)'}}>{new Date(item.created_at).toLocaleString('id-ID')}</span>
                </div>
                <div style={{fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1rem'}}>
                  <strong>Topik/Produk:</strong> {item.product_desc || '-'}
                </div>
                <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--glass-border)'}}>
                  {item.result}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const handleKeyChange = (e) => {
    setApiKey(e.target.value);
    localStorage.setItem('storyboard_api_key', e.target.value);
  };

  const renderSettings = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">Pengaturan API</h2>
        <p className="subtitle">Masukkan Kunci API 1inference Anda di sini.</p>
        
        <div className="glass-panel" style={{maxWidth: '500px', margin: '0 auto', textAlign: 'left'}}>
          <div className="input-group">
            <label>1inference API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={handleKeyChange}
              placeholder="Masukkan API Key Anda..."
              className="api-key-input"
            />
            <small className="help-text" style={{marginTop: '0.5rem', display: 'block', color: 'var(--text-secondary)'}}>
              Kunci API disimpan dengan aman di penyimpanan lokal peramban Anda.
            </small>
          </div>
        </div>
      </div>
    </div>
  );

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginPassword === 'malik2026') {
      setIsAuthenticated(true);
      localStorage.setItem('storyboard_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const renderLogin = () => (
    <div className="app-layout" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b, #0f172a)'}}>
      <div className="glass-panel fade-in" style={{maxWidth: '400px', width: '90%', padding: '2.5rem', textAlign: 'center'}}>
        <div style={{marginBottom: '2rem'}}>
          <LogoSVG />
          <h2 style={{color: 'white', marginTop: '1rem', fontSize: '1.5rem'}}>Creator Hub AI</h2>
          <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem'}}>Silakan masukkan password untuk masuk</p>
        </div>
        
        <form onSubmit={handleLogin} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
          <div className="input-group" style={{textAlign: 'left'}}>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => { setLoginPassword(e.target.value); setLoginError(false); }}
              placeholder="Password..."
              className="api-key-input"
              style={{borderColor: loginError ? '#ef4444' : 'rgba(255,255,255,0.1)'}}
              autoFocus
            />
            {loginError && <small style={{color: '#ef4444', marginTop: '0.5rem', display: 'block'}}>Password salah!</small>}
          </div>
          
          <button type="submit" className="btn-primary" style={{width: '100%', padding: '0.8rem'}}>
            Login
          </button>
        </form>
      </div>
    </div>
  );

  if (!isAuthenticated) return renderLogin();

  return (
    <div className="app-layout">
      {renderSidebar()}
      <main className="main-content">
        <div className="panel-header-mobile">
          <button className="hamburger-btn" onClick={() => setIsMobileMenuOpen(true)}>☰</button>
          <h2>Creator Hub AI</h2>
        </div>
        {activeTab === 'storyboard' && renderStoryboardForm()}
        {activeTab === 'edu_mation' && renderEduForm()}
        {activeTab === 'image_gen' && renderImageGenForm()}
        {activeTab === 'thread' && renderThreadForm()}
        {activeTab === 'gen_thread' && renderGenThreadForm()}
        {activeTab === 'selling_point' && renderSellingForm()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  )
}

export default App
