import { useState, useEffect } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState('storyboard')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('storyboard_api_key') || '')
  
  // --- GEMINI API KEYS STATES ---
  const [geminiKeys, setGeminiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('gemini_api_keys');
      return saved ? JSON.parse(saved) : Array(10).fill('');
    } catch {
      return Array(10).fill('');
    }
  });
  const [activeGeminiKeyIndex, setActiveGeminiKeyIndex] = useState(0);

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
  
  // New 2-step Workflow states
  const [storySellingPoint, setStorySellingPoint] = useState('')
  const [isGeneratingStorySelling, setIsGeneratingStorySelling] = useState(false)
  const [storyVisual, setStoryVisual] = useState('3D Animasi / Pixar Style')
  const [storyContentStyle, setStoryContentStyle] = useState('Storytelling')

  // --- KONTEN MASAK STATES ---
  const [cookImage, setCookImage] = useState(null)
  const [cookFile, setCookFile] = useState(null)
  const [cookDesc, setCookDesc] = useState('')
  const [cookInstruction, setCookInstruction] = useState('')
  const [cookType, setCookType] = useState('ASMR (Fokus suara masakan dan detail close-up)')
  const [cookPromptCount, setCookPromptCount] = useState('2')
  const [cookSceneCount, setCookSceneCount] = useState('4')
  const [isGeneratingCook, setIsGeneratingCook] = useState(false)
  const [isGeneratingCookIdea, setIsGeneratingCookIdea] = useState(false)
  const [generatedCook, setGeneratedCook] = useState(null)
  const [isStoryboardAccordionOpen, setIsStoryboardAccordionOpen] = useState(false)

  // --- BANG JENGGOT STATES ---
  const [bjImage, setBjImage] = useState(null)
  const [bjFile, setBjFile] = useState(null)
  const [bjDesc, setBjDesc] = useState('')
  const [bjInstruction, setBjInstruction] = useState('')
  const [bjType, setBjType] = useState('Review Jujur (Ceplas-ceplos & Obyektif)')
  const [bjPromptCount, setBjPromptCount] = useState('2')
  const [bjSceneCount, setBjSceneCount] = useState('4')
  const [isGeneratingBj, setIsGeneratingBj] = useState(false)
  const [generatedBj, setGeneratedBj] = useState(null)

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
  const [genThreadLength, setGenThreadLength] = useState('Utas Pendek (5-10 Pancingan Komentar)')
  const [genThreadLengthCount, setGenThreadLengthCount] = useState(5)
  const [genThreadLanguageStyle, setGenThreadLanguageStyle] = useState('Santai (Gue-Elu, Gaul)')
  const [threadLanguageStyle, setThreadLanguageStyle] = useState('Santai (Gue-Elu, Gaul)')
  const [threadAngle, setThreadAngle] = useState('Storytelling (Bercerita pengalaman pribadi)')
  const [isGeneratingGenThread, setIsGeneratingGenThread] = useState(false)
  const [generatedGenThread, setGeneratedGenThread] = useState(null)
  const [genThreadCategory, setGenThreadCategory] = useState('Otomotif')
  const [genThreadCustomCategory, setGenThreadCustomCategory] = useState('')
  const [viralIdeas, setViralIdeas] = useState([])
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false)

  // --- AI IMAGE GEN STATES ---
  const [imgPrompt, setImgPrompt] = useState('')
  const [imgModel, setImgModel] = useState('turbo-free') 
  const [customOpenRouterModel, setCustomOpenRouterModel] = useState('')
  const [isGeneratingImg, setIsGeneratingImg] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null)

  // --- SCRIPT VIDEO AI STATES ---
  const [videoScriptFile, setVideoScriptFile] = useState(null)
  const [videoScriptPreview, setVideoScriptPreview] = useState(null)
  const [videoProductName, setVideoProductName] = useState('')
  const [isGeneratingVideoScript, setIsGeneratingVideoScript] = useState(false)
  const [generatedVideoScripts, setGeneratedVideoScripts] = useState(null)
  const [uploadProgress, setUploadProgress] = useState('')

  // --- DATA PRODUK STATES ---
  const [productsData, setProductsData] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodLink, setProdLink] = useState('');
  const [prodImgUrl, setProdImgUrl] = useState('');

  // --- BANK STORYBOARD STATES ---
  const [bankStoryboardData, setBankStoryboardData] = useState([]);
  const [isBankStoryboardLoading, setIsBankStoryboardLoading] = useState(false);
  const [bankCategory, setBankCategory] = useState('');
  const [bankProductName, setBankProductName] = useState('');
  const [bankDesc, setBankDesc] = useState('');
  const [bankProductLink, setBankProductLink] = useState('');
  const [bankImgUrl, setBankImgUrl] = useState('');
  const [isBankSaving, setIsBankSaving] = useState(false);
  const [activeBankCategory, setActiveBankCategory] = useState('Semua');

  // --- SELLING POINT STATES ---
  const [sellingProductInfo, setSellingProductInfo] = useState('')
  const [isGeneratingSelling, setIsGeneratingSelling] = useState(false)
  const [generatedSelling, setGeneratedSelling] = useState(null)

  const stylesList = [
    "Kartun 3D lucu, warna cerah, karakter Indonesia",
    "Cinematic Realism, film look, dramatic lighting",
    "Anime Style, Makoto Shinkai aesthetic, vibrant",
    "Minimalist 2D Vector, corporate friendly, smooth",
    "Stop Motion Clay animation, warm lighting, playful",
    "Custom..."
  ]

  const storyVisualList = [
    '3D Animasi / Pixar Style',
    'Realistis / Cinematic',
    'Clay Animation (Plastisin)',
    'Anime Style',
    'Minimalist / Flat Vector',
    'Cyberpunk / Neon'
  ];

  const storyContentStyleList = [
    'POV Daily Vlog',
    'Storytelling',
    'Unboxing / Review',
    'Cinematic Commercial',
    'Behind the Scenes',
    'Comedy Skit'
  ];

  const toneList = ['Sangat Emosional/Baper', 'Misterius/Penasaran', 'Inspiratif & Motivasi', 'Kontroversial (Bikin Debat)', 'Santai & Lucu'];
  const categoriesList = ['Otomotif', 'Fashion', 'Politik', 'Agama Islam', 'Fakta-fakta', 'Kesehatan', 'Teknologi', 'Hiburan', 'Bisnis', 'Olahraga', 'Custom...'];

  const supabaseUrl = 'https://xkixokhnofujcnehuvgz.supabase.co';
  const supabaseKey = 'sb_publishable_zryQEkMVI1nD3R3Cgf0zdw_LTD0nwtY';

  // --- DATABASE (HISTORY) STATES ---
  const [activeDatabaseCategory, setActiveDatabaseCategory] = useState('Storyboard');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [imageInputs, setImageInputs] = useState({});

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

  const updateHistoryResultInSupabase = async (id, newResult) => {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/prompts?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ result: newResult })
      });
      if (response.ok) {
        // Update local state
        const updatedItem = { ...selectedHistoryItem, result: newResult };
        setSelectedHistoryItem(updatedItem);
        setHistory(prev => prev.map(item => item.id === id ? updatedItem : item));
      } else {
        alert('Gagal menyimpan gambar ke database.');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan jaringan saat menyimpan.');
    }
  };

  const handleSaveImageToPart = async (partIndex, currentParts) => {
    const url = imageInputs[partIndex];
    if (!url) return;
    
    const newParts = [...currentParts];
    newParts[partIndex] = newParts[partIndex].trim() + `\n\n[IMG]${url}[/IMG]`;
    const newResult = newParts.join('\n\n---\n\n');
    
    await updateHistoryResultInSupabase(selectedHistoryItem.id, newResult);
    
    // Clear input
    setImageInputs(prev => {
      const next = { ...prev };
      delete next[partIndex];
      return next;
    });
  };

  const handleRemoveImageFromPart = async (partIndex, currentParts) => {
    const newParts = [...currentParts];
    // Remove [IMG]...[/IMG] from the text
    newParts[partIndex] = newParts[partIndex].replace(/\[IMG\].*?\[\/IMG\]/g, '').trim();
    const newResult = newParts.join('\n\n---\n\n');
    await updateHistoryResultInSupabase(selectedHistoryItem.id, newResult);
  };

  const fetchProducts = async () => {
    setIsProductsLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/prompts?type=eq.Data%20Produk&select=id,product_desc,result,created_at&order=created_at.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // data contains id, product_desc (title), result (JSON string of {desc, link, imgUrl})
        setProductsData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProductsLoading(false);
    }
  };

  const fetchBankStoryboard = async () => {
    setIsBankStoryboardLoading(true);
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/prompts?type=eq.Bank%20Storyboard&select=id,product_desc,result,created_at&order=created_at.desc`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // data contains id, product_desc (category), result (JSON string of {desc, imgUrl})
        setBankStoryboardData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsBankStoryboardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
    if (activeTab === 'product_data' || activeTab === 'thread') {
      fetchProducts();
    }
    if (activeTab === 'bank_storyboard' || activeTab === 'storyboard' || activeTab === 'cooking_content' || activeTab === 'bang_jenggot') {
      fetchBankStoryboard();
    }
  }, [activeTab]);

  const saveToSupabase = async (blocks, type, desc) => {
    setIsSaving(true);
    const resultText = Array.isArray(blocks) ? blocks.join('\n\n---\n\n') : blocks;
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
        if (type !== 'Data Produk' && type !== 'Bank Storyboard') alert("Berhasil disimpan permanen ke Database!");
        if (type === 'Data Produk') fetchProducts(); // Refresh data
        if (type === 'Bank Storyboard') fetchBankStoryboard(); // Refresh bank data
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

  const handleSaveProduct = () => {
    if (!prodTitle || !prodDesc || !prodLink) return alert("Judul, Deskripsi, dan Link wajib diisi!");
    const productPayload = JSON.stringify({
      desc: prodDesc,
      link: prodLink,
      imgUrl: prodImgUrl
    });
    saveToSupabase(productPayload, 'Data Produk', prodTitle);
    setProdTitle(''); setProdDesc(''); setProdLink(''); setProdImgUrl('');
  };

  const handleDeleteProduct = async (id) => {
    if(!window.confirm("Hapus data produk ini?")) return;
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/prompts?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        fetchProducts();
      }
    } catch(e) {
      alert("Gagal hapus: " + e.message);
    }
  };

  const handleSaveBank = () => {
    if (!bankCategory || !bankProductName) return alert("Kategori dan Nama Produk wajib diisi!");
    const bankPayload = JSON.stringify({
      name: bankProductName,
      desc: bankDesc,
      link: bankProductLink,
      imgUrl: bankImgUrl
    });
    saveToSupabase(bankPayload, 'Bank Storyboard', bankCategory);
    setBankProductName(''); setBankDesc(''); setBankProductLink(''); setBankImgUrl('');
  };

  const handleDeleteBank = async (id) => {
    if(!window.confirm("Hapus data dari Bank Storyboard?")) return;
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/prompts?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      if (response.ok) {
        fetchBankStoryboard();
      }
    } catch(e) {
      alert("Gagal hapus: " + e.message);
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

  // --- BANK STORYBOARD COMPUTED DATA ---
  const uniqueBankCategories = ['Semua', ...new Set(bankStoryboardData.map(item => item.product_desc))];
  const filteredBankData = activeBankCategory === 'Semua' ? bankStoryboardData : bankStoryboardData.filter(item => item.product_desc === activeBankCategory);
  const groupedBankData = {};
  bankStoryboardData.forEach(item => {
    const cat = item.product_desc || 'Lainnya';
    if (!groupedBankData[cat]) groupedBankData[cat] = [];
    groupedBankData[cat].push(item);
  });

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

  // --- STEP 1: GENERATE SELLING POINTS ---
  const handleGenerateStorySelling = async () => {
    if ((!productFile && !productImage) || !productDesc || !apiKey) {
      alert("Pastikan Gambar, Deskripsi, dan API Key sudah diisi.");
      return;
    }
    
    setIsGeneratingStorySelling(true)
    
    try {
      let base64Image = null;
      if (productFile) {
        base64Image = await fileToBase64(productFile);
      } else if (productImage && typeof productImage === 'string' && productImage.startsWith('http')) {
        base64Image = productImage;
      }
      
      const systemPrompt = `Anda adalah seorang manajer produk dan ahli visual berpengalaman. Pengguna akan memberi Anda deskripsi produk beserta gambarnya. 
Tugas Anda ada dua:
1. DESKRIPSI FISIK SUPER DETAIL: Analisis gambar produk dengan sangat teliti. Deskripsikan secara mikroskopis bentuk fisik, warna spesifik, bahan/tekstur, rasio, posisi komponen/logo, dan fitur unik produk dari gambar tersebut. Tujuannya agar deskripsi ini bisa dipakai oleh AI Image Generator (DALL-E/Midjourney) untuk menggambar ulang produk dengan akurasi 100%.
2. SELLING POINTS: Identifikasi masalah yang dipecahkan produk tersebut dan berikan poin-poin penjualan secara tajam dan terstruktur.

Berikan output dengan format:
[DESKRIPSI FISIK PRODUK]
(isi deskripsi detail)

[SELLING POINTS]
(isi poin penjualan)`;

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
      let generatedText = data.choices[0].message.content.trim(); 
      setStorySellingPoint(generatedText);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingStorySelling(false)
    }
  }

  // --- STEP 2: GENERATE STORYBOARD ---
  const handleGenerateStory = async () => {
    if (!storySellingPoint || !apiKey) {
      alert("Pastikan Poin Selling sudah ada dan API Key sudah diisi.");
      return;
    }
    
    setIsGeneratingStory(true)
    setGeneratedPrompts([])
    
    try {
      const base64Image = await fileToBase64(productFile);
      
      const systemPrompt = `You are an expert prompt engineer for AI Video Generators (like Google Veo 3) and AI Image Generators (like Midjourney/DALL-E 3). 
Your task is to create a SINGLE, CONTINUOUS storytelling animation commercial based on a product image, description, and its key selling points.

STRICT INSTRUCTIONS:
1. You MUST generate exactly ${promptCount} Prompts. 
2. CRITICAL: These ${promptCount} Prompts MUST form ONE connected, continuous story. Prompt 1 flows directly into Prompt 2, which flows into Prompt 3.
3. Each Prompt represents exactly 10 SECONDS of this continuous video sequence. 
4. Each Prompt MUST be divided into exactly ${scenePerPrompt} Scenes.
5. Visual Style requested: "${storyVisual}".
6. Content Style/Tone requested: "${storyContentStyle}".
${specialInstruction ? `7. SPECIAL INSTRUCTIONS FROM USER: "${specialInstruction}". YOU MUST FOLLOW THIS STRICTLY.` : ''}
8. CRITICAL VISUAL CONSISTENCY: Read the highly detailed physical description of the product provided in the context. You MUST inject this exact, detailed physical description of the product into EVERY SINGLE "Prompt Visual" and "Prompt Siap Tempel ke Veo 3" without fail. Do not use generic pronouns like "the product", always describe its exact shape, color, and texture in every scene to lock the visual consistency.
9. Provide the output in plain text. DO NOT USE MARKDOWN ASTERISKS (**).
10. Separate each main Prompt block with a separator line "---" so the system can parse it.
11. End each prompt block by providing a "Prompt Siap Tempel ke Veo 3" (in English), "Narasi (Voice Over)", and "Efek Suara".

FOLLOW THIS EXACT FORMAT TEMPLATE FOR EVERY PROMPT:

PROMPT [Number] (StartSec-EndSec DETIK)
Judul: "[Title of the whole story]"
Gaya Visual: ${storyVisual}
Gaya Konten: ${storyContentStyle}

Scene 1
Prompt Visual: [Detailed visual description of the scene]

... (up to scene ${scenePerPrompt})

Prompt Siap Tempel ke Veo 3:
[English prompt detailing the cohesive 10-second cinematic motion for Veo 3]

Narasi (Voice Over):
"[The spoken script that matches the 10 seconds of action]"

Efek Suara (Sound Effects):
[Sound effects description]
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
                { type: "text", text: `Product Description: ${productDesc}\n\nKey Selling Points (Context):\n${storySellingPoint}` },
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

  const handleGenerateCookIdea = async () => {
    if (!cookDesc || !apiKey) {
      alert("Pastikan Deskripsi Produk dan API Key sudah diisi sebelum minta ide AI.");
      return;
    }
    
    setIsGeneratingCookIdea(true);
    
    try {
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
            { role: "system", content: "Anda adalah asisten kreatif pembuat ide konten memasak. Berikan SATU ide hidangan yang sangat spesifik dan menggugah selera (dalam 1-2 kalimat) yang cocok dimasak menggunakan alat masak yang disebutkan. Jawab langsung idenya, tanpa basa-basi." },
            { role: "user", content: `Alat masak: ${cookDesc}\nTipe Konten: ${cookType}` }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      setCookInstruction(data.choices[0].message.content.trim());
    } catch (err) {
      alert("Gagal membuat ide: " + err.message);
    } finally {
      setIsGeneratingCookIdea(false);
    }
  };

  // --- GENERATE KONTEN MASAK ---
  const handleGenerateCooking = async () => {
    if (!cookDesc || !apiKey) {
      alert("Pastikan Deskripsi Produk dan API Key sudah diisi.");
      return;
    }
    
    setIsGeneratingCook(true)
    setGeneratedCook(null)
    
    try {
      let userContent = [];
      userContent.push({ type: "text", text: `Deskripsi Produk Alat Masak: ${cookDesc}\nTipe Konten: ${cookType}\nJumlah Bagian Video: ${cookPromptCount}\nJumlah Scene per Bagian: ${cookSceneCount}\nInstruksi Khusus (Mau masak apa): ${cookInstruction || 'Terserah AI'}` });

      let base64Image = null;
      if (cookFile) {
        base64Image = await fileToBase64(cookFile);
      } else if (cookImage && typeof cookImage === 'string' && cookImage.startsWith('http')) {
        base64Image = cookImage;
      }
      if (base64Image) {
        userContent.push({ type: "image_url", image_url: { url: base64Image } });
      }

      const promptCountNum = parseInt(cookPromptCount) || 1;
      const sceneCountNum = parseInt(cookSceneCount) || 4;
      const timePerScene = Math.floor(10 / sceneCountNum);
      
      const asmrRule = cookType.includes('ASMR') ? '\n5. PENTING: Karena ini video ASMR, format output setiap scene WAJIB mengikuti struktur template ASMR khusus yang sudah disediakan di bawah.' : '';

      let formatInstructionStr = "WAJIB ISI TEMPLATE DI BAWAH INI DENGAN DESKRIPSI VISUAL YANG SESUAI:\n\n";
      let globalSceneIndex = 1;
      
      for(let p=1; p<=promptCountNum; p++) {
        formatInstructionStr += `BAGIAN ${p}: [Tulis Judul Fokus Adegan]\n\n`;
        const baseTime = (p - 1) * 10;
        
        for(let i=1; i<=sceneCountNum; i++) {
          const startSec = baseTime + (i-1) * timePerScene;
          const endSec = i === sceneCountNum ? baseTime + 10 : baseTime + (i * timePerScene);
          
          if (cookType.includes('ASMR')) {
            formatInstructionStr += `Scene ${globalSceneIndex} (Detik ${startSec}-${endSec}):\n`;
            formatInstructionStr += `Video memasak ASMR super realistis dari [nama/bagian makanan]. Pengambilan gambar close-up tangan yang sedang menyiapkan bahan di dapur estetik yang bersih.\n`;
            formatInstructionStr += `Detail visual: [Tulis detail visual spesifik di scene ini: bahan segar, tekstur, minyak mendesis, uap, dll. Pencahayaan lembut hangat, sinematik].\n`;
            formatInstructionStr += `Fokus audio: [Tulis suara ASMR spesifik: memotong, mengiris, menggoreng, dll. Tanpa musik latar, tanpa suara manusia, hanya suara memasak alami].\n`;
            formatInstructionStr += `Kamera: [Tulis pergerakan kamera: close-up makro, slow motion, transisi halus, fokus pada tekstur makanan].\n`;
            formatInstructionStr += `Gaya: ultra realistis, 4K, kualitas iklan makanan, sangat detail, visual yang memuaskan.\n`;
            formatInstructionStr += `Negative prompt: no text, no subtitles, no watermark.\n\n`;
          } else {
            formatInstructionStr += `Scene ${globalSceneIndex} (Detik ${startSec}-${endSec}): (Tulis deskripsi visual sangat detail dalam bahasa Indonesia untuk Scene ${globalSceneIndex})\n\n`;
          }
          globalSceneIndex++;
        }
        if (p < promptCountNum) formatInstructionStr += `---\n\n`;
      }

      const systemPrompt = `Anda adalah seorang ahli visual dan penulis naskah kreatif. Pengguna akan memberikan deskripsi dan gambar alat masak (opsional), beserta instruksi hidangan.
PENTING TENTANG GAMBAR: JIKA PADA GAMBAR TERDAPAT MANUSIA, WAJAH, ATAU TANGAN, ABAIKAN SEPENUHNYA! FOKUS HANYA PADA BENTUK ALAT MASAKNYA SAJA (PANCI/WAJAN). JANGAN PERNAH MENGIDENTIFIKASI ATAU MENYEBUTKAN ORANG/TANGAN/WAJAH SAMA SEKALI.

Tugas Anda adalah membuat storyboard video berurutan yang menceritakan proses memasak dari awal hingga akhir.
Ini BUKAN variasi cerita, melainkan SATU cerita visual utuh yang dibagi-bagi ke dalam beberapa bagian.

ATURAN OUTPUT:
1. Pisahkan setiap BAGIAN dengan simbol "---" (sudah disediakan di template).
2. SEMUA OUTPUT HARUS DALAM BAHASA INDONESIA. Deskripsi harus sangat lengkap, rinci, dan mendetail.
3. Deskripsi harus berfokus pada estetika visual: pencahayaan, pergerakan kamera, tekstur makanan, dan penggunaan alat masak.
4. Jangan menulis narasi atau percakapan, murni deskripsi visual.${asmrRule}

${formatInstructionStr}`;

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
            { role: "user", content: userContent }
          ],
          temperature: 0.8
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      let generatedText = data.choices[0].message.content.trim().replace(/\*\*/g, ""); 
      
      const blocks = generatedText.split('---').map(b => b.trim()).filter(b => b.length > 0);
      setGeneratedCook(blocks);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingCook(false)
    }
  }

  const handleGenerateBangJenggot = async () => {
    if (!bjDesc || !apiKey) {
      alert("Pastikan Deskripsi Produk dan API Key sudah diisi.");
      return;
    }
    
    setIsGeneratingBj(true)
    setGeneratedBj(null)
    
    try {
      let userContent = [];
      userContent.push({ type: "text", text: `Deskripsi Produk: ${bjDesc}\nTipe Konten: ${bjType}\nJumlah Bagian Video: ${bjPromptCount}\nJumlah Scene per Bagian: ${bjSceneCount}\nInstruksi Khusus: ${bjInstruction || 'Terserah AI'}` });

      let base64Image = null;
      if (bjFile) {
        base64Image = await fileToBase64(bjFile);
      } else if (bjImage && typeof bjImage === 'string' && bjImage.startsWith('http')) {
        base64Image = bjImage;
      }
      if (base64Image) {
        userContent.push({ type: "image_url", image_url: { url: base64Image } });
      }

      const systemPrompt = `Anda adalah seorang Sutradara Iklan dan Content Creator spesialis Review Produk/POV. Pengguna akan memberikan deskripsi dan gambar produk (opsional), beserta instruksi khusus.
PENTING TENTANG GAMBAR: JIKA PADA GAMBAR REFERENSI TERDAPAT MANUSIA, WAJAH, ATAU TANGAN, ABAIKAN SEPENUHNYA! FOKUS HANYA PADA BENTUK PRODUKNYA SAJA. JANGAN MENGIDENTIFIKASI ORANG/WAJAH.
Tugas Anda adalah mendeskripsikan secara visual urutan adegan (scene) untuk video review atau POV. Model/aktor utamanya adalah seorang PRIA BERJENGGOT.
Anda harus mendeskripsikan ekspresi pria berjenggot ini, gesturnya, dan interaksinya dengan produk atau dengan kamera (jika POV).
Video ini dibagi menjadi ${bjPromptCount} Bagian berurutan (misal: Bagian 1 perkenalan masalah, Bagian 2 menunjukkan produk, dst).
Ini BUKAN variasi, melainkan SATU cerita visual yang menyambung.

ATURAN OUTPUT:
1. Pisahkan setiap Bagian dengan simbol "---" agar sistem bisa memotongnya.
2. SEMUA OUTPUT HARUS DALAM BAHASA INDONESIA.
3. Setiap Scene harus memiliki 2 komponen:
   a. VISUAL: Deskripsi visual adegan (ekspresi aktor, gerakan kamera, pencahayaan, interaksi produk)
   b. VOICE OVER / DIALOG: Teks yang diucapkan oleh pria berjenggot tersebut di scene itu (dalam bahasa Indonesia, gaya santai/natural)
4. STRUKTUR MARKETING (PENTING UNTUK VOICE OVER):
   - Awal (Bagian 1/Scene Awal): WAJIB ada "HOOK" yang kuat untuk menarik perhatian (masalah/pertanyaan pancingan).
   - Tengah (Isi): Penjelasan review produk, keunggulan, dan solusi.
   - Akhir (Bagian Akhir/Scene Terakhir): WAJIB diakhiri dengan "CTA" (Call To Action) menyuruh penonton klik keranjang kuning/link pembelian.
5. Deskripsi harus berfokus pada penampilan pria berjenggot, ekspresi wajahnya, pergerakan kamera, dan interaksi dengan produk.

FORMAT UNTUK SETIAP BAGIAN:

BAGIAN [Nomor]: [Fokus Adegan]

Scene 1:
VISUAL: (Deskripsi visual detail dalam bahasa Indonesia)
VOICE OVER: "(Dialog/narasi yang diucapkan pria berjenggot dalam bahasa Indonesia)"

Scene 2:
VISUAL: (Deskripsi visual detail dalam bahasa Indonesia)
VOICE OVER: "(Dialog/narasi yang diucapkan pria berjenggot dalam bahasa Indonesia)"

... (hingga ${bjSceneCount} Scene)`;

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
            { role: "user", content: userContent }
          ],
          temperature: 0.8
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      let generatedText = data.choices[0].message.content.trim().replace(/\*\*/g, ""); 
      
      const blocks = generatedText.split('---').map(b => b.trim()).filter(b => b.length > 0);
      setGeneratedBj(blocks);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingBj(false)
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
          <div className="accordion-menu">
            <button className={`nav-item ${(activeTab === 'storyboard' || activeTab === 'cooking_content' || activeTab === 'bang_jenggot') ? 'active' : ''}`} onClick={() => setIsStoryboardAccordionOpen(!isStoryboardAccordionOpen)}>
              <div className="nav-item-content"><span className="icon">🎬</span> Storyboard</div>
              <span className="nav-arrow" style={{transform: isStoryboardAccordionOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s'}}>&gt;</span>
            </button>
            {isStoryboardAccordionOpen && (
              <div className="accordion-content fade-in" style={{paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem', marginBottom: '0.5rem'}}>
                <button className={`nav-item ${activeTab === 'storyboard' ? 'active' : ''}`} onClick={() => {setActiveTab('storyboard'); setIsMobileMenuOpen(false);}} style={{padding: '0.6rem 1rem', fontSize: '0.85rem'}}>
                  <div className="nav-item-content">Umum</div>
                </button>
                <button className={`nav-item ${activeTab === 'cooking_content' ? 'active' : ''}`} onClick={() => {setActiveTab('cooking_content'); setIsMobileMenuOpen(false);}} style={{padding: '0.6rem 1rem', fontSize: '0.85rem'}}>
                  <div className="nav-item-content">Konten Masak</div>
                </button>
                <button className={`nav-item ${activeTab === 'bang_jenggot' ? 'active' : ''}`} onClick={() => {setActiveTab('bang_jenggot'); setIsMobileMenuOpen(false);}} style={{padding: '0.6rem 1rem', fontSize: '0.85rem'}}>
                  <div className="nav-item-content">Bang Jenggot</div>
                </button>
              </div>
            )}
          </div>
          <button className={`nav-item ${activeTab === 'bank_storyboard' ? 'active' : ''}`} onClick={() => {setActiveTab('bank_storyboard'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">🗃️</span> Bank Storyboard</div>
            <span className="nav-arrow">&gt;</span>
          </button>
          <button className={`nav-item ${activeTab === 'image_gen' ? 'active' : ''}`} onClick={() => {setActiveTab('image_gen'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">🎨</span> AI Image</div>
            <span className="nav-arrow">&gt;</span>
          </button>
          <button className={`nav-item ${activeTab === 'product_data' ? 'active' : ''}`} onClick={() => {setActiveTab('product_data'); setIsMobileMenuOpen(false);}}>
            <div className="nav-item-content"><span className="icon">📦</span> Data Produk</div>
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
            <div className="nav-item-content"><span className="icon">🗄️</span> Database</div>
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
            {/* --- STEP 1: ANALISIS PRODUK --- */}
            <div style={{marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <h3 style={{marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <span style={{background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'}}>1</span>
                Analisis Produk (Selling Points)
              </h3>

              <div className="input-group">
                <label style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>🗃️ Pilih dari Bank Storyboard (Auto-fill)</label>
                <select onChange={(e) => {
                  const selectedId = e.target.value;
                  if (!selectedId) {
                    setProductDesc(''); setProductImage(null); setProductFile(null);
                    return;
                  }
                  const item = bankStoryboardData.find(p => p.id == selectedId);
                  if (item) {
                    let parsed = {};
                    try { parsed = JSON.parse(item.result); } catch(err){}
                    setProductDesc(parsed.desc || '');
                    if (parsed.imgUrl) {
                      setProductImage(parsed.imgUrl);
                      setProductFile(null); 
                    }
                  }
                }} className="select-input" style={{borderColor: 'var(--primary-color)', background: 'rgba(255,255,255,0.8)'}}>
                  <option value="">-- Kosongkan (Isi Manual) --</option>
                  {Object.keys(groupedBankData).map(cat => (
                    <optgroup key={cat} label={`📁 ${cat}`}>
                      {groupedBankData[cat].map(item => {
                        let parsed = {};
                        try { parsed = JSON.parse(item.result); } catch(e) {}
                        return (
                          <option key={item.id} value={item.id}>{parsed.name || (parsed.desc ? parsed.desc.substring(0, 40) + '...' : 'Tanpa Nama')}</option>
                        )
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>
              
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
                <label>Deskripsi Produk Singkat</label>
                <textarea 
                  placeholder="Contoh: Jam tangan pintar tahan banting untuk pekerja lapangan..."
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  rows="3"
                />
              </div>

              <button className="btn-primary generate-btn" onClick={handleGenerateStorySelling} disabled={!productFile || !productDesc || isGeneratingStorySelling || !apiKey} style={{marginBottom: '1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
                {isGeneratingStorySelling ? 'Menganalisis...' : '🔍 Temukan Poin Selling'}
              </button>
              
              {storySellingPoint && (
                <div className="input-group fade-in">
                  <label>Hasil Analisis (Bisa Diedit)</label>
                  <textarea 
                    value={storySellingPoint}
                    onChange={(e) => setStorySellingPoint(e.target.value)}
                    rows="6"
                    style={{border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.05)'}}
                  />
                </div>
              )}
            </div>

            {/* --- STEP 2: STORYBOARD OPTIONS --- */}
            <div style={{opacity: storySellingPoint ? 1 : 0.5, pointerEvents: storySellingPoint ? 'auto' : 'none', transition: 'opacity 0.3s'}}>
              <h3 style={{marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <span style={{background: 'var(--primary-color)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'}}>2</span>
                Pengaturan Video & Generate
              </h3>

              <div className="input-row">
                <div className="input-group">
                  <label>Gaya Visual</label>
                  <select value={storyVisual} onChange={(e) => setStoryVisual(e.target.value)} className="select-input">
                    {storyVisualList.map((style, idx) => <option key={idx} value={style}>{style}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Gaya Konten</label>
                  <select value={storyContentStyle} onChange={(e) => setStoryContentStyle(e.target.value)} className="select-input">
                    {storyContentStyleList.map((style, idx) => <option key={idx} value={style}>{style}</option>)}
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Instruksi Khusus (Opsional)</label>
                <textarea 
                  placeholder="Contoh: Fokus pada keawetan bahan, buat nada bicaranya santai..."
                  value={specialInstruction}
                  onChange={(e) => setSpecialInstruction(e.target.value)}
                  rows="2"
                />
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

              <button className="btn-primary generate-btn" onClick={handleGenerateStory} disabled={!storySellingPoint || isGeneratingStory || !apiKey}>
                {isGeneratingStory ? 'Meracik Naskah Storyboard...' : '🎬 Generate Storyboard'}
              </button>
              {!apiKey && <p className="warning-text">⚠️ Silakan masukkan API Key di menu API Settings terlebih dahulu.</p>}
            </div>
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

  const renderCookingContentForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">🍳 Storyboard Konten Masak</h2>
        <p className="subtitle">Ubah produk alat masak Anda menjadi prompt gambar & video super realistis.</p>

        <div className="layout-grid">
          <div className="glass-panel input-section">
            <h3 style={{marginBottom: '1rem', color: 'var(--primary-color)'}}>Pengaturan Konten</h3>

            <div className="input-group">
              <label style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>🗃️ Pilih dari Bank Storyboard (Auto-fill)</label>
              <select onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) {
                  setCookDesc(''); setCookImage(null); setCookFile(null);
                  return;
                }
                const item = bankStoryboardData.find(p => p.id == selectedId);
                if (item) {
                  let parsed = {};
                  try { parsed = JSON.parse(item.result); } catch(err){}
                  setCookDesc(`${item.product_desc} - ${parsed.desc || ''}`);
                  if (parsed.imgUrl) {
                    setCookImage(parsed.imgUrl);
                    setCookFile(null); 
                  }
                }
              }} className="select-input" style={{borderColor: 'var(--primary-color)', background: 'rgba(255,255,255,0.8)'}}>
                <option value="">-- Kosongkan (Isi Manual) --</option>
                {Object.keys(groupedBankData).map(cat => (
                  <optgroup key={cat} label={`📁 ${cat}`}>
                    {groupedBankData[cat].map(item => {
                      let parsed = {};
                      try { parsed = JSON.parse(item.result); } catch(e) {}
                      return (
                        <option key={item.id} value={item.id}>{parsed.name || (parsed.desc ? parsed.desc.substring(0, 40) + '...' : 'Tanpa Nama')}</option>
                      )
                    })}
                  </optgroup>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label>Gambar Produk Panci/Wajan (Opsional)</label>
              <div className="image-upload-wrapper">
              {cookImage ? (
                <div className="image-preview">
                  <img src={cookImage} alt="Preview" />
                  <button className="btn-secondary" onClick={() => { setCookImage(null); setCookFile(null); }}>Hapus / Ganti Gambar</button>
                </div>
              ) : (
                <label className="upload-placeholder">
                  <input type="file" accept="image/*" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setCookFile(file);
                      const reader = new FileReader();
                      reader.onload = (e) => setCookImage(e.target.result);
                      reader.readAsDataURL(file);
                    }
                  }} hidden />
                  <span className="upload-icon">⬆️</span>
                  <span>Klik untuk upload gambar produk</span>
                  <small>Biar AI mengenali bentuk panci/wajan Anda</small>
                </label>
              )}
              </div>
            </div>

            <div className="input-group">
              <label>Deskripsi Produk (Wajan/Panci)</label>
              <textarea 
                placeholder="Contoh: Wajan anti lengket granit 24cm, handle kayu tahan panas..."
                value={cookDesc}
                onChange={(e) => setCookDesc(e.target.value)}
                rows="2"
              />
            </div>

            <div className="input-group">
              <label>Tipe Konten</label>
              <select value={cookType} onChange={(e) => setCookType(e.target.value)} className="select-input">
                <option value="ASMR (Fokus suara masakan dan detail close-up)">ASMR</option>
                <option value="Mini Vlog (Estetik, gaya hidup)">Mini Vlog</option>
                <option value="Review Produk (Menonjolkan fitur anti-lengket dsb)">Review Produk</option>
                <option value="Tutorial Masak (Step-by-step)">Tutorial Masak</option>
                <option value="Cinematic Commercial (Megah, dramatis)">Cinematic Commercial</option>
              </select>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label>Jumlah Prompt (Video)</label>
                <input type="number" min="1" max="5" value={cookPromptCount} onChange={(e) => setCookPromptCount(e.target.value)} className="select-input" />
              </div>
              <div className="input-group">
                <label>Scene per Prompt</label>
                <input type="number" min="2" max="6" value={cookSceneCount} onChange={(e) => setCookSceneCount(e.target.value)} className="select-input" />
              </div>
            </div>

            <div className="input-group">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                <label style={{margin: 0}}>Instruksi Khusus (Masak apa hari ini?)</label>
                <button 
                  onClick={handleGenerateCookIdea} 
                  disabled={!cookDesc || isGeneratingCookIdea || !apiKey}
                  style={{
                    background: 'var(--primary-color)', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '20px', 
                    padding: '0.3rem 0.8rem', 
                    fontSize: '0.75rem', 
                    cursor: 'pointer',
                    opacity: (!cookDesc || isGeneratingCookIdea || !apiKey) ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {isGeneratingCookIdea ? 'Memikirkan...' : '💡 Tanya AI'}
                </button>
              </div>
              <textarea 
                placeholder="Contoh: Bikin menu nasi gila, harus ada adegan telur diorak-arik..."
                value={cookInstruction}
                onChange={(e) => setCookInstruction(e.target.value)}
                rows="3"
              />
            </div>

            <button className="btn-primary generate-btn" onClick={handleGenerateCooking} disabled={!cookDesc || isGeneratingCook || !apiKey}>
              {isGeneratingCook ? 'Meracik Resep Konten...' : '🍳 Generate Storyboard Masak'}
            </button>
            {!apiKey && <p className="warning-text">⚠️ Silakan masukkan API Key di menu API Settings terlebih dahulu.</p>}
          </div>

          <div className="glass-panel" style={{padding: '0', background: 'transparent', border: 'none', boxShadow: 'none'}}>
          {generatedCook ? (
            <div className="prompts-container">
              {generatedCook.map((promptText, index) => (
                <div key={index} className="prompt-card fade-in">
                  <div className="prompt-header">
                    <h3>Bagian {index + 1}</h3>
                    <button className="btn-copy" onClick={() => handleCopy(promptText, index)}>
                      {copiedIndex === index ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <pre className="prompt-content" style={{whiteSpace: 'pre-wrap'}}>{promptText}</pre>
                </div>
              ))}
              <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                <button className="btn-secondary" onClick={() => saveToSupabase(generatedCook, 'Konten Masak', cookDesc)} disabled={isSaving} style={{flex: 1}}>
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

  const renderBangJenggotForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">🧔 Storyboard Bang Jenggot</h2>
        <p className="subtitle">Ubah produk Anda menjadi storyboard review / POV dengan model aktor pria berjenggot.</p>

        <div className="layout-grid">
          <div className="glass-panel input-section">
            <h3 className="section-title">Pengaturan Konten</h3>
            
            <div className="input-group">
              <label><span className="icon">📦</span> PILIH DARI BANK STORYBOARD (AUTO-FILL)</label>
              <select className="select-input" onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) {
                  setBjDesc(''); setBjImage(null); setBjFile(null);
                } else {
                  const item = bankStoryboardData.find(d => d.id == selectedId);
                  if (item) {
                    let parsed = {};
                    try { parsed = JSON.parse(item.result); } catch(e) {}
                    setBjDesc(`${item.product_desc} - ${parsed.desc || ''}`);
                    if (parsed.imgUrl) {
                      setBjImage(parsed.imgUrl);
                      setBjFile(null); 
                    }
                  }
                }
              }}>
                <option value="">-- Kosongkan (Isi Manual) --</option>
                {Object.keys(groupedBankData).map(cat => (
                  <optgroup key={cat} label={`📁 ${cat}`}>
                    {groupedBankData[cat].map(item => {
                      let parsed = {};
                      try { parsed = JSON.parse(item.result); } catch(e) {}
                      return (
                        <option key={item.id} value={item.id}>{parsed.name || (parsed.desc ? parsed.desc.substring(0, 40) + '...' : 'Tanpa Nama')}</option>
                      )
                    })}
                  </optgroup>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label>Gambar Produk (Opsional)</label>
              <div className="image-upload-wrapper">
              {bjImage ? (
                <div className="image-preview">
                  <img src={bjImage} alt="Preview" />
                  <button className="btn-secondary" onClick={() => { setBjImage(null); setBjFile(null); }}>Hapus / Ganti Gambar</button>
                </div>
              ) : (
                <label className="upload-placeholder">
                  <input type="file" accept="image/*" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setBjFile(file);
                      const reader = new FileReader();
                      reader.onload = (e) => setBjImage(e.target.result);
                      reader.readAsDataURL(file);
                    }
                  }} hidden />
                  <span className="upload-icon">⬆️</span>
                  <span>Klik untuk upload gambar produk</span>
                  <small>Biar AI mengenali bentuk produk</small>
                </label>
              )}
              </div>
            </div>

            <div className="input-group">
              <label>Deskripsi Produk (Wajib)</label>
              <textarea 
                className="text-input" 
                placeholder="Masukkan deskripsi produk, benefit, atau keunggulan produk."
                value={bjDesc}
                onChange={(e) => setBjDesc(e.target.value)}
                rows="4"
              />
            </div>
            
            <div className="input-group">
              <label>Tipe Konten Review</label>
              <select value={bjType} onChange={(e) => setBjType(e.target.value)} className="select-input">
                <option value="Review Jujur (Ceplas-ceplos & Obyektif)">Review Jujur (Ceplas-ceplos & Obyektif)</option>
                <option value="Unboxing Estetik & Pemakaian Pertama">Unboxing Estetik & Pemakaian Pertama</option>
                <option value="Sketsa Komedi POV (Lucu & Relate)">Sketsa Komedi POV (Lucu & Relate)</option>
                <option value="Tutorial Edukasi Penggunaan">Tutorial Edukasi Penggunaan</option>
              </select>
            </div>

            <div className="settings-row">
              <div className="input-group" style={{flex: 1}}>
                <label>Berapa Bagian Video?</label>
                <input type="number" min="1" max="5" value={bjPromptCount} onChange={(e) => setBjPromptCount(e.target.value)} className="select-input" />
              </div>
              <div className="input-group" style={{flex: 1}}>
                <label>Scene per Bagian?</label>
                <input type="number" min="2" max="6" value={bjSceneCount} onChange={(e) => setBjSceneCount(e.target.value)} className="select-input" />
              </div>
            </div>

            <div className="input-group">
              <label>Instruksi Khusus (Opsional)</label>
              <textarea 
                className="text-input" 
                placeholder="Misal: 'Bikin aktornya kelihatan kaget pas liat hasil bajunya.' atau 'Awalnya sedih, terus senyum.'"
                value={bjInstruction}
                onChange={(e) => setBjInstruction(e.target.value)}
                rows="2"
              />
            </div>
            
            <button className="btn-primary generate-btn" onClick={handleGenerateBangJenggot} disabled={!bjDesc || isGeneratingBj || !apiKey}>
              {isGeneratingBj ? 'Menyiapkan Skenario...' : '🧔 Generate Storyboard Jenggot'}
            </button>
          </div>

          <div className="glass-panel output-section">
          {generatedBj ? (
            <div className="results-container">
              {generatedBj.map((promptText, index) => (
                <div key={index} className="prompt-card fade-in">
                  <div className="prompt-header">
                    <h3>Bagian {index + 1}</h3>
                    <button className="btn-copy" onClick={() => handleCopy(promptText, index)}>
                      {copiedIndex === index ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <pre className="prompt-text">{promptText}</pre>
                </div>
              ))}
              
              <div className="action-buttons-bottom" style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
                <button className="btn-secondary" onClick={() => saveToSupabase(generatedBj, 'Bang Jenggot', bjDesc)} disabled={isSaving} style={{flex: 1}}>
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
        lengthInstruction = "Buat utas SANGAT PENDEK (maksimal 1-2 tweet). Gunakan POLA PERTANYAAN pancingan yang memicu rasa penasaran (Contoh: 'Kalian tau nggak produk yang wajib dipunya pecita [niche]? Barangnya lucu, murah, gampang didapat!'). Buat sesingkat mungkin dan langsung arahkan untuk cek link produk.";
      } else if (threadLength.includes('Pendek')) {
        lengthInstruction = "Buat utas pendek (3-5 tweet/bagian). Setiap tweet HARUS PENDEK (maksimal 2-3 kalimat) agar mudah dibaca/snackable.";
      } else {
        lengthInstruction = "Buat utas panjang bergaya storytelling (6-10 tweet/bagian). Bangun emosi, masalah, dan perlahan berikan solusi. PENTING: Setiap tweet HARUS PENDEK (maksimal 3-4 kalimat per tweet). Dilarang menulis paragraf yang terlalu panjang agar orang tidak malas membaca.";
      }

      let systemPrompt = "";
      if (threadAngle.includes("Plot Twist")) {
        systemPrompt = `Kamu adalah seorang copywriter, storyteller, dan content writer yang ahli membuat utas viral di media sosial (Threads, Facebook, X, Telegram, dll).
Tugasmu adalah membuat sebuah cerita (utas/thread) yang membuat orang membaca sampai selesai.

ATURAN PENULISAN:
1. Pisahkan setiap tweet/bagian utas dengan "---" agar sistem bisa memotongnya. DILARANG MENGGUNAKAN HEADING (seperti "Bagian 1:" dll).
2. Jangan langsung membahas produk.
3. Awali dengan sebuah hook yang sangat menarik (nendang) sehingga membuat orang penasaran. Semuanya berawal dari hook.
4. Ceritakan sebuah kisah yang sangat umum, sehingga hampir semua orang bisa merasa relate (pengalaman, kejadian sehari-hari, dll).
5. Cerita HARUS relevan dengan manfaat produk, tetapi JANGAN menyebut produk sama sekali sampai bagian akhir.
6. Bangun emosi secara perlahan dan gunakan teknik curiosity gap.
7. Sisipkan konflik kecil, lalu naikkan tensinya sedikit demi sedikit.
8. Buat alurnya mengalir seperti orang sedang bercerita/curhat, BUKAN seperti artikel.
9. Gaya Bahasa: ${threadLanguageStyle}. Dilarang terdengar seperti iklan, kaku, atau dramatis berlebihan.
10. ${lengthInstruction}

STRUKTUR CERITA (Gunakan struktur ini secara terselubung, sesuaikan dengan panjang utas yang diminta, jangan tuliskan nama bagiannya, pisahkan saja dengan "---"):
- Awal: Hook yang bikin berhenti scrolling, berlanjut menceritakan pengalaman/fenomena umum.
- Tengah: Masukkan konflik yang sering dialami, bangun rasa penasaran, berikan insight.
- Klimaks (Plot Twist): Muncul plot twist bahwa ternyata ada satu hal sederhana yang bisa mengatasi masalah.
- Akhir: Perkenalkan produk secara halus (rasio cerita:promosi = 95:5). Ajak pembaca melihat produk dan berikan link afiliasi. Tutup dengan kalimat hangat.

OUTPUT HARUS:
- Mengalir, sangat natural, tidak terasa dijuali.
- Produk hanya disebut di 10-15% bagian akhir.
- Fokus pada emosi (Relatable Situation). Pembaca harus merasa "Aku juga pernah ngalamin".`;
      } else {
        systemPrompt = `Kamu adalah seorang Copywriter Viral dan Affiliate Marketer kelas atas di platform X/Twitter dan Threads.
Keahlianmu adalah membuat konten berseri (Utas/Thread) yang sangat mengundang interaksi, memicu emosi (FOMO, rasa penasaran, atau empati), dan berujung pada klik link afiliasi.

ATURAN MUTLAK (DILARANG KERAS MENGGUNAKAN BAHASA AI/ROBOT):
1. Gaya Bahasa / Diksi: ${threadLanguageStyle}. TULISLAH LAYAKNYA MANUSIA ASLI DI TWITTER/X. Dilarang terlihat seperti robot!
2. Angle Jualan: ${threadAngle}. Terapkan strategi ini di dalam isi utas.
3. DILARANG KERAS menggunakan kata-kata kaku khas AI seperti: "Di era digital ini", "Kesimpulannya", "Mari kita bahas", "Tak dapat dipungkiri". Gunakan singkatan wajar orang Indonesia.
4. Pisahkan setiap tweet/bagian utas dengan "---" agar sistem bisa memotongnya.
5. Tweet pertama HARUS berupa HOOK yang "Nendang" dan sangat kuat! Ingat, semuanya berawal dari hook; jika hook gagal, orang akan skip. Pancing emosi terdalam, berikan opini kontroversial, atau rasa penasaran tingkat dewa. JANGAN terlihat seperti sedang berjualan di tweet pertama.
6. ${lengthInstruction}
7. Selipkan kalimat ajakan/Call to Action dan "Link produk: [LINK AFILIASI]" di bagian akhir utas.
8. Jangan gunakan hashtag yang berlebihan, maksimal 2 hashtag natural.`;
      }

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

  const handleGenerateViralIdeas = async () => {
    if (!apiKey) {
      alert("Pastikan API Key sudah diisi.");
      return;
    }
    
    const categoryToSearch = genThreadCategory === 'Custom...' ? genThreadCustomCategory : genThreadCategory;
    if (!categoryToSearch) {
      alert("Kategori tidak boleh kosong.");
      return;
    }

    setIsGeneratingIdeas(true)
    setViralIdeas([])

    try {
      const systemPrompt = `Anda adalah seorang ahli riset konten viral media sosial. 
Tugas Anda adalah memberikan 5 hingga 10 ide topik atau judul artikel yang paling hangat (trending) dan sangat berpotensi viral saat ini untuk kategori: ${categoryToSearch}.
OUTPUT WAJIB DALAM BENTUK JSON ARRAY (Hanya array of strings).
Contoh: ["Misteri hilangnya kapal X di segitiga bermuda", "Fakta gelap di balik industri fast fashion", "Konspirasi terbaru tentang AI"]
PASTIKAN OUTPUT MURNI JSON ARRAY TANPA FORMATTING MARKDOWN \`\`\`json !`;

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
            { role: "user", content: `Berikan 5-10 ide viral untuk kategori: ${categoryToSearch}` }
          ],
          temperature: 0.8
        })
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data = await response.json();
      let generatedText = data.choices[0].message.content.trim();
      if (generatedText.startsWith('```json')) {
         generatedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
      }
      
      const parsedData = JSON.parse(generatedText);
      if (Array.isArray(parsedData)) {
        setViralIdeas(parsedData);
      } else {
        throw new Error("Format JSON tidak sesuai.");
      }
    } catch (error) {
      alert("Gagal mendapatkan ide: " + error.message);
    } finally {
      setIsGeneratingIdeas(false)
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
      const isPendek = genThreadLength.includes("Pendek");
      
      let lengthInstructions = isPendek 
        ? `Kamu harus membuat 5 hingga 10 utas (thread) PENDEK yang BERBEDA/TERPISAH.
- Masing-masing utas HANYA berisi 1 paragraf pancingan (sekitar 2-3 kalimat).
- Setiap utas harus dirancang khusus untuk mengundang komentar keras, perdebatan, atau rasa penasaran dari netizen.
- Pisahkan antar utas dengan "---".`
        : `Kamu harus membuat 1 utas (thread) BERANTAI PANJANG.
- Utas harus dibagi menjadi tepat ${genThreadLengthCount} bagian/tweet berurutan.
- PENTING: SETIAP bagian/tweet HARUS PENDEK (maksimal 3-4 kalimat per tweet/bagian). JANGAN MENULIS PARAGRAF PANJANG! Buatlah konten yang snackable.
- SETIAP tweet (kecuali tweet terakhir) WAJIB ditutup dengan HOOK atau kalimat gantung/cliffhanger yang membuat pembaca tidak sabar membaca tweet selanjutnya.
- Pisahkan setiap tweet/bagian utas dengan "---".`;

      const systemPrompt = `Kamu adalah Kreator Konten Viral tingkat dewa di X (Twitter) dan Threads.
Tugasmu adalah membuat konten organik murni berdasarkan topik yang diberikan untuk mendapatkan ribuan likes, retweets, dan interaksi.
TIDAK ADA UNSUR JUALAN SAMA SEKALI.

ATURAN MUTLAK (DILARANG KERAS MENGGUNAKAN BAHASA AI/ROBOT):
1. Gaya Bahasa / Diksi: ${genThreadLanguageStyle}. TULISLAH LAYAKNYA MANUSIA ASLI DI TWITTER/X.
2. DILARANG KERAS menggunakan kata-kata kaku khas AI seperti: "Di era digital ini", "Kesimpulannya", "Mari kita bahas", "Tak dapat dipungkiri".
3. Gunakan singkatan wajar orang Indonesia jika gaya bahasanya santai (misal: yg, dgn, bgt, pdhl, udh, kek, lo, gue, dll). Jangan terlalu kaku. Jangan terlihat seperti robot.
4. Tema/Tone Emosi: ${genThreadTone}. Sesuaikan emosi tulisan dengan tone ini!
5. Jika ada sumber referensi yang diberikan, gabungkan secara natural ke dalam cerita tanpa menyebut "Berdasarkan referensi".
6. Pisahkan setiap tweet/bagian dengan "---" agar sistem bisa memotongnya.
7. PENTING (FORMAT PANJANG/PENDEK): 
${lengthInstructions}`;

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

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(`API Error ${response.status}: ${JSON.stringify(errData)}`);
        }
        const data = await response.json();
        
        if (data && data.data && data.data.length > 0 && data.data[0].url) {
          setGeneratedImageUrl(data.data[0].url);
        } else {
          throw new Error("Gagal mendapatkan URL gambar dari API: " + JSON.stringify(data));
        }
        setIsGeneratingImg(false);
      }
    } catch (e) {
      alert("Error: " + e.message);
      setIsGeneratingImg(false);
    }
  };
  const getWorkingGeminiKey = (startIndex) => {
    let i = startIndex;
    let attempts = 0;
    while (attempts < 10) {
      if (geminiKeys[i] && geminiKeys[i].trim() !== '') {
        return { key: geminiKeys[i].trim(), index: i };
      }
      i = (i + 1) % 10;
      attempts++;
    }
    return null;
  };

  const uploadFileToGemini = async (file, key) => {
    setUploadProgress('Mengunggah file ke Google...');
    const uploadResponse = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?key=${key}`, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'raw',
        'X-Goog-Upload-File-Name': file.name,
        'Content-Type': file.type
      },
      body: file
    });
    
    if (!uploadResponse.ok) {
      const errText = await uploadResponse.text();
      throw new Error(`Gagal mengunggah: ${uploadResponse.status} - ${errText}`);
    }
    
    const uploadResult = await uploadResponse.json();
    const fileData = uploadResult.file;
    
    if (file.type.startsWith('video/')) {
      setUploadProgress('Menunggu Google memproses video (bisa memakan waktu)...');
      let state = 'PROCESSING';
      while (state === 'PROCESSING') {
        await new Promise(r => setTimeout(r, 3000));
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/${fileData.name}?key=${key}`);
        const data = await res.json();
        state = data.state;
        if (state === 'FAILED') throw new Error("Google gagal memproses video.");
      }
    }
    
    return fileData;
  };

  const executeGeminiGeneration = async (keyInfo, fileData, retries = 0, modelIndex = 0) => {
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b', 'gemini-pro'];
    if (modelIndex >= modelsToTry.length) {
      throw new Error(`Semua model AI gagal diakses. Pastikan API Key Anda memiliki akses.`);
    }
    const currentModel = modelsToTry[modelIndex];
    setUploadProgress(`Menulis skrip menggunakan ${currentModel}...`);
    
    const prompt = `Kamu adalah seorang pakar Digital Marketing dan Konten Kreator Video pendek (TikTok/Reels/Shopee Video). Tugasmu adalah membantu saya membuat 5 variasi skrip video pendek berdasarkan file (gambar/video) dan nama produk yang saya berikan.
Nama Produk: ${videoProductName}

Aturan Penulisan Skrip: 
1. Durasi: Sesuaikan dengan durasi video dengan hook yang kuat.
2. Struktur Variasi: 
   - Opsi 1 (Problem Solving): Fokus pada masalah yang dialami pengguna dan solusi dari produk. 
   - Opsi 2 (Hard Selling): Fokus pada harga, diskon, kualitas material, atau status 'viral'. 
   - Opsi 3 (Feature Highlight): Fokus pada fungsi unik atau teknologi spesifik produk. 
   - Opsi 4 (Aesthetic/Social): Fokus pada visual produk yang cantik, kerapian, atau keseruan saat dipakai. 
   - Opsi 5 (Lifestyle/Context): Fokus pada penggunaan sehari-hari (contoh: untuk kantor, sekolah, atau kado).
3. CTA Wajib: Di akhir setiap skrip, wajib sertakan kalimat: 'Yang mau cek keranjang belanja sekarang juga.'
4. Gaya Bahasa: Santai, persuasif, informatif, dan adaptif sesuai target pasar produk tersebut.
5. Sitasi: Berikan tanda sitasi \`\` pada bagian fitur yang merujuk pada gambar/video yang saya lampirkan.
6. OUTPUT HARUS MEMISAHKAN SETIAP OPSI DENGAN "---" AGAR BISA DIPOTONG SISTEM.`;

    const requestBody = {
      contents: [{
        role: "user",
        parts: [
          fileData ? { fileData: { mimeType: fileData.mimeType, fileUri: fileData.uri } } : { text: "Tidak ada file referensi, buat berdasarkan nama produk." },
          { text: prompt }
        ]
      }],
      generationConfig: { temperature: 0.8 }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${keyInfo.key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });

    if (response.status === 429 && retries < 9) {
      // Rotate key
      const nextKey = getWorkingGeminiKey((keyInfo.index + 1) % 10);
      if (nextKey) {
        setActiveGeminiKeyIndex(nextKey.index);
        setUploadProgress(`Key ${keyInfo.index + 1} limit! Otomatis mencoba Key ${nextKey.index + 1}...`);
        return await executeGeminiGeneration(nextKey, fileData, retries + 1, modelIndex);
      }
    }

    if (response.status === 404) {
      // Model not found, fallback to next model
      return await executeGeminiGeneration(keyInfo, fileData, retries, modelIndex + 1);
    }

    if (!response.ok) {
      let errText = "";
      try { errText = await response.text(); } catch(e){}
      throw new Error(`API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) throw new Error("Gemini menolak memproses prompt.");
    
    let text = data.candidates[0].content.parts[0].text;
    const blocks = text.split('---').map(b => b.trim()).filter(b => b.length > 10);
    return blocks;
  };

  const handleGenerateVideoScript = async () => {
    if (!videoProductName) {
      return alert("Nama produk wajib diisi!");
    }
    
    const activeKey = getWorkingGeminiKey(activeGeminiKeyIndex);
    if (!activeKey) {
      return alert("Harap masukkan setidaknya 1 Gemini API Key di menu Pengaturan API.");
    }
    setActiveGeminiKeyIndex(activeKey.index);

    setIsGeneratingVideoScript(true);
    setGeneratedVideoScripts(null);
    setUploadProgress('Memulai...');

    try {
      let fileData = null;
      if (videoScriptFile) {
        fileData = await uploadFileToGemini(videoScriptFile, activeKey.key);
      }
      
      const blocks = await executeGeminiGeneration(activeKey, fileData);
      setGeneratedVideoScripts(blocks);
      setUploadProgress('');
    } catch (e) {
      alert("Error: " + e.message);
      setUploadProgress('');
    } finally {
      setIsGeneratingVideoScript(false);
    }
  };

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideoScriptFile(file);
      if (file.type.startsWith('image/')) {
        setVideoScriptPreview(URL.createObjectURL(file));
      } else {
        setVideoScriptPreview(null);
      }
    }
  };

  const renderVideoScriptForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">🎥 Script Video AI (Gemini)</h2>
        <p className="subtitle">Upload video/gambar mentah, dan biarkan AI meracik 5 variasi skrip FYP untuk Anda.</p>
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <div className="input-group">
              <label>Nama Produk</label>
              <input type="text" className="api-key-input" placeholder="Contoh: Sepatu Sneakers Ortuseight" value={videoProductName} onChange={(e) => setVideoProductName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Upload File Referensi (Video MP4 / Gambar)</label>
              <input type="file" accept="video/mp4,video/quicktime,image/jpeg,image/png,image/webp" onChange={handleFileChange} className="api-key-input" style={{padding: '0.5rem'}} />
              {videoScriptFile && <small style={{color: '#10b981', display: 'block', marginTop: '0.5rem'}}>Terpilih: {videoScriptFile.name}</small>}
              {videoScriptPreview && <img src={videoScriptPreview} alt="Preview" style={{width: '100%', borderRadius: '8px', marginTop: '1rem', border: '1px solid var(--glass-border)'}} />}
            </div>
            <button className="btn-primary generate-btn" onClick={handleGenerateVideoScript} disabled={!videoProductName || isGeneratingVideoScript}>
              {isGeneratingVideoScript ? 'Menganalisis...' : '✨ Generate 5 Skrip Video'}
            </button>
            {uploadProgress && <div style={{marginTop: '1rem', color: '#10b981', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '6px'}}>{uploadProgress}</div>}
          </div>
          
          <div className="glass-panel" style={{padding: '0', background: 'transparent', border: 'none', boxShadow: 'none'}}>
          {generatedVideoScripts ? (
            <div className="prompts-container">
              {generatedVideoScripts.map((script, index) => (
                <div key={index} className="prompt-card fade-in">
                  <div className="prompt-header">
                    <h3>Opsi {index + 1}</h3>
                    <button className="btn-copy" onClick={() => handleCopy(script, `vid_${index}`)}>
                      {copiedIndex === `vid_${index}` ? '✅ Copied!' : '📋 Copy'}
                    </button>
                  </div>
                  <pre className="prompt-content" style={{whiteSpace: 'pre-wrap', fontFamily: 'inherit'}}>{script}</pre>
                </div>
              ))}
              <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                <button className="btn-secondary" onClick={() => saveToSupabase(generatedVideoScripts, 'Video Script AI', videoProductName)} disabled={isSaving} style={{flex: 1}}>
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
              <label style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>📦 Pilih Produk Tersimpan (Auto-fill)</label>
              <select onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) {
                  setThreadTitle(''); setThreadDesc(''); setThreadLink('');
                  return;
                }
                const prod = productsData.find(p => p.id == selectedId);
                if (prod) {
                  let parsed = {};
                  try { parsed = JSON.parse(prod.result); } catch(err){}
                  setThreadTitle(prod.product_desc);
                  setThreadDesc(parsed.desc || '');
                  setThreadLink(parsed.link || '');
                }
              }} className="select-input" style={{borderColor: 'var(--primary-color)', background: 'rgba(255,255,255,0.8)'}}>
                <option value="">-- Ketik manual atau Pilih produk di sini --</option>
                {productsData.map(p => (
                  <option key={p.id} value={p.id}>{p.product_desc}</option>
                ))}
              </select>
            </div>
            
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
              <label>Gaya Bahasa (Diksi)</label>
              <select value={threadLanguageStyle} onChange={(e) => setThreadLanguageStyle(e.target.value)} className="select-input">
                <option value="Santai (Gue-Elu, Gaul)">Santai (Gue-Elu, Singkatan Twitter, Gaul)</option>
                <option value="Santai (Aku-Kamu, Ramah)">Santai (Aku-Kamu, Ramah, Sopan)</option>
                <option value="Reviewer Jujur (Ceplas-ceplos)">Reviewer Jujur (Ceplas-ceplos, Obyektif)</option>
                <option value="Hard Selling (To the point)">Hard Selling (Agresif, To the point, Promo)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Angle Jualan (Strategi)</label>
              <select value={threadAngle} onChange={(e) => setThreadAngle(e.target.value)} className="select-input">
                <option value="Storytelling (Bercerita pengalaman pribadi/masalah)">Storytelling (Bercerita masalah → Menemukan solusi)</option>
                <option value="Soft Selling (Edukasi dulu, jualan kemudian)">Soft Selling (Edukasi/Fakta dulu, lalu rekomendasi produk)</option>
                <option value="Hard Selling (Fokus pada diskon/promo/kualitas)">Hard Selling (Fokus langsung pada Diskon, Kualitas, FOMO)</option>
                <option value="Unboxing / Review Jujur (Kesan pertama)">Unboxing / Review Jujur (Membahas pros & cons)</option>
                <option value="Plot Twist Tak Terduga (Mulai dengan cerita/opini ngidul yang sama sekali tidak berkaitan dengan produk, buat pembaca penasaran, lalu tiba-tiba di akhir thread berbelok tajam merekomendasikan produk)">Plot Twist (Cerita ngidul di awal, tiba-tiba jualan di akhir)</option>
                <option value="Meme/Candaan (Humor yang nyambung ke produk)">Meme / Candaan (Humor/Shitposting yang nyambung ke jualan)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Panjang Utas</label>
              <select value={threadLength} onChange={(e) => setThreadLength(e.target.value)} className="select-input">
                <option value="Sangat Pendek (1-2 Kalimat)">Sangat Pendek (Soft Selling - 1-2 Kalimat)</option>
                <option value="Pendek (Singkat & Padat)">Pendek (Singkat & Padat - 3-5 Bagian)</option>
                <option value="Panjang (Storytelling Mendalam)">Panjang (Berantai dengan Hook - 6-10 Bagian)</option>
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
              <label>Kategori</label>
              <select value={genThreadCategory} onChange={(e) => setGenThreadCategory(e.target.value)} className="select-input">
                {categoriesList.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            {genThreadCategory === 'Custom...' && (
              <div className="input-group fade-in">
                <input type="text" className="api-key-input" placeholder="Ketik kategori bebas (misal: Anime, Tanaman Hias)..." value={genThreadCustomCategory} onChange={(e) => setGenThreadCustomCategory(e.target.value)} />
              </div>
            )}
            
            <button className="btn-secondary" onClick={handleGenerateViralIdeas} disabled={isGeneratingIdeas || !apiKey} style={{marginBottom: '1rem', width: '100%', fontSize: '0.85rem'}}>
              {isGeneratingIdeas ? 'Menganalisis Tren Viral...' : '🔍 Pencari Ide Viral (Dapatkan 5-10 Ide Panas)'}
            </button>
            
            {viralIdeas.length > 0 && (
              <div className="fade-in" style={{marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--primary-color)'}}>
                <label style={{color: 'var(--primary-color)', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'block', fontWeight: 'bold'}}>✨ Ide Topik Viral (Klik untuk memilih):</label>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  {viralIdeas.map((idea, idx) => (
                    <button key={idx} onClick={() => setGenThreadTopic(idea)} style={{background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem'}} className="idea-btn">
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="input-group">
              <label>Topik / Ide Cerita</label>
              <textarea placeholder="Pilih dari ide di atas atau ketik sendiri..." value={genThreadTopic} onChange={(e) => setGenThreadTopic(e.target.value)} rows="3" />
            </div>
            <div className="input-group">
              <label>Sumber Referensi (Opsional)</label>
              <input type="text" className="api-key-input" placeholder="Link berita atau buku acuan..." value={genThreadSource} onChange={(e) => setGenThreadSource(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Gaya Bahasa (Diksi)</label>
              <select value={genThreadLanguageStyle} onChange={(e) => setGenThreadLanguageStyle(e.target.value)} className="select-input">
                <option value="Santai (Gue-Elu, Gaul)">Santai (Gue-Elu, Singkatan Twitter, Gaul)</option>
                <option value="Formal (Baku, Profesional)">Formal (Baku, Informatif, Edukatif)</option>
                <option value="Humoris (Banyak Candaan)">Humoris (Banyak Candaan, Memeable)</option>
                <option value="Nyinyir (Julid, Pedas)">Nyinyir (Julid, Mengundang Emosi/Kritik)</option>
                <option value="Storytelling Emosional">Storytelling Emosional (Menyentuh Hati, Personal)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Tema Emosi (Tone)</label>
              <select value={genThreadTone} onChange={(e) => setGenThreadTone(e.target.value)} className="select-input">
                {toneList.map((tone, idx) => <option key={idx} value={tone}>{tone}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Panjang Utas</label>
              <select value={genThreadLength} onChange={(e) => setGenThreadLength(e.target.value)} className="select-input">
                <option value="Utas Pendek (5-10 Pancingan Komentar)">Utas Pendek (5-10 Pancingan Komentar)</option>
                <option value="Utas Panjang (Berantai dengan Hook)">Utas Panjang (Berantai dengan Hook)</option>
              </select>
            </div>
            {!genThreadLength.includes("Pendek") && (
              <div className="input-group fade-in">
                <label>Jumlah Tweet dalam Utas</label>
                <input type="number" min="2" max="20" className="api-key-input" value={genThreadLengthCount} onChange={(e) => setGenThreadLengthCount(e.target.value)} />
              </div>
            )}
            
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

  const renderBankStoryboardForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">🗃️ Bank Storyboard</h2>
        <p className="subtitle">Simpan aset visual (Panci, Wajan, Produk) untuk mempermudah pembuatan Storyboard.</p>
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <h3 style={{marginBottom: '1rem', color: 'var(--primary-color)'}}>Tambah Aset Baru</h3>
            <div className="input-group">
              <label>Nama Produk</label>
              <input type="text" className="api-key-input" style={{color: '#1a1a2e'}} placeholder="Contoh: Wajan Granit Anti Lengket 24cm" value={bankProductName} onChange={(e) => setBankProductName(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Deskripsi Produk</label>
              <textarea placeholder="Jelaskan keunggulan / spesifikasi produk..." value={bankDesc} onChange={(e) => setBankDesc(e.target.value)} rows="3" />
            </div>
            <div className="input-group">
              <label>Link Produk (Shopee/TikTok)</label>
              <input type="text" className="api-key-input" placeholder="https://shope.ee/..." value={bankProductLink} onChange={(e) => setBankProductLink(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Link Gambar Produk (URL)</label>
              <input type="text" className="api-key-input" placeholder="https://cf.shopee.co.id/file/..." value={bankImgUrl} onChange={(e) => setBankImgUrl(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Kategori Produk</label>
              <div style={{position: 'relative'}}>
                <input 
                  type="text" 
                  className="api-key-input" 
                  list="bank-category-list"
                  placeholder="Ketik baru atau pilih yang sudah ada..." 
                  value={bankCategory} 
                  onChange={(e) => setBankCategory(e.target.value)} 
                />
                <datalist id="bank-category-list">
                  {[...new Set(bankStoryboardData.map(item => item.product_desc))].map((cat, idx) => (
                    <option key={idx} value={cat} />
                  ))}
                </datalist>
              </div>
              <small style={{display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)'}}>Ketik kategori baru atau pilih dari daftar yang sudah ada.</small>
            </div>
            <button className="btn-primary generate-btn" onClick={handleSaveBank} disabled={!bankCategory || !bankProductName || isSaving}>
              {isSaving ? 'Menyimpan...' : '💾 Simpan ke Bank'}
            </button>
          </div>
          
          <div className="glass-panel" style={{padding: '1.5rem', background: 'transparent', border: 'none', boxShadow: 'none'}}>
            <h3 style={{marginBottom: '1rem'}}>Aset Tersimpan ({bankStoryboardData.length})</h3>
            
            <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)'}}>
              {uniqueBankCategories.map((cat, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveBankCategory(cat)}
                  style={{
                    padding: '0.5rem 1rem', 
                    borderRadius: '20px', 
                    border: activeBankCategory === cat ? '2px solid var(--primary-color)' : '1px solid var(--glass-border)', 
                    background: activeBankCategory === cat ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                    color: activeBankCategory === cat ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '0.8rem',
                    fontWeight: activeBankCategory === cat ? '600' : '400',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat} {cat !== 'Semua' && <span style={{opacity: 0.7, marginLeft: '4px'}}>({(groupedBankData[cat] || []).length})</span>}
                </button>
              ))}
            </div>

            {isBankStoryboardLoading ? (
              <div style={{textAlign: 'center', padding: '2rem'}}><span className="loading-spinner"></span> Memuat...</div>
            ) : filteredBankData.length === 0 ? (
              <EmptyStateRight />
            ) : activeBankCategory === 'Semua' ? (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                {Object.keys(groupedBankData).map(categoryName => (
                  <div key={categoryName} style={{
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: '12px', 
                    border: '1px solid var(--glass-border)', 
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '0.8rem 1.2rem', 
                      background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))', 
                      borderBottom: '1px solid var(--glass-border)',
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center'
                    }}>
                      <h4 style={{margin: 0, fontSize: '0.9rem', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '1px'}}>
                        📁 {categoryName}
                      </h4>
                      <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '10px'}}>
                        {groupedBankData[categoryName].length} aset
                      </span>
                    </div>
                    <div style={{padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem'}}>
                      {groupedBankData[categoryName].map(item => {
                        let parsed = {};
                        try { parsed = JSON.parse(item.result); } catch(e) {}
                        return (
                          <div key={item.id} className="fade-in" style={{
                            display: 'flex', gap: '0.8rem', padding: '0.8rem', 
                            background: 'rgba(255,255,255,0.03)', borderRadius: '8px', 
                            border: '1px solid rgba(255,255,255,0.06)',
                            alignItems: 'center',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                          >
                            {parsed.imgUrl && (
                              <div style={{width: '60px', height: '60px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)'}}>
                                <img src={parsed.imgUrl} alt={item.product_desc} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                              </div>
                            )}
                            <div style={{flex: 1, overflow: 'hidden'}}>
                              <h4 style={{margin: '0 0 0.3rem 0', fontSize: '0.9rem', color: '#1a1a2e', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{parsed.name || 'Produk Tanpa Nama'}</h4>
                              <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{parsed.desc}</p>
                              {parsed.link && <a href={parsed.link} target="_blank" rel="noreferrer" style={{fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none', fontWeight: '600'}}>🔗 Link Produk</a>}
                            </div>
                            <button onClick={() => handleDeleteBank(item.id)} style={{background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0}}>
                              Hapus
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                {filteredBankData.map(item => {
                  let parsed = {};
                  try { parsed = JSON.parse(item.result); } catch(e) {}
                  return (
                    <div key={item.id} className="prompt-card fade-in" style={{display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center'}}>
                      {parsed.imgUrl && (
                        <div style={{width: '70px', height: '70px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)'}}>
                          <img src={parsed.imgUrl} alt={item.product_desc} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        </div>
                      )}
                      <div style={{flex: 1, overflow: 'hidden'}}>
                        <h4 style={{margin: '0 0 0.3rem 0', fontSize: '0.9rem', color: '#1a1a2e', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{parsed.name || 'Produk Tanpa Nama'}</h4>
                        <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{parsed.desc}</p>
                        {parsed.link && <a href={parsed.link} target="_blank" rel="noreferrer" style={{fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none', fontWeight: '600'}}>🔗 Link Produk</a>}
                      </div>
                      <button onClick={() => handleDeleteBank(item.id)} style={{background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', alignSelf: 'flex-start', fontSize: '0.75rem'}}>
                        Hapus
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductDataForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">📦 Bank Data Produk</h2>
        <p className="subtitle">Simpan data produk Anda di sini agar bisa digunakan otomatis saat membuat utas.</p>
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <h3 style={{marginBottom: '1rem', color: 'var(--primary-color)'}}>Tambah Produk Baru</h3>
            <div className="input-group">
              <label>Judul Produk</label>
              <input type="text" className="api-key-input" placeholder="Contoh: Sepatu Sneakers Pria..." value={prodTitle} onChange={(e) => setProdTitle(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Deskripsi / Benefit Produk</label>
              <textarea placeholder="Tuliskan spesifikasi atau keunggulan produk..." value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} rows="3" />
            </div>
            <div className="input-group">
              <label>Link Affiliate (Shopee/TikTok)</label>
              <input type="text" className="api-key-input" placeholder="https://shope.ee/..." value={prodLink} onChange={(e) => setProdLink(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Link Gambar Produk (URL)</label>
              <input type="text" className="api-key-input" placeholder="Contoh: https://cf.shopee.co.id/file/..." value={prodImgUrl} onChange={(e) => setProdImgUrl(e.target.value)} />
              <small style={{display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)'}}>
                Klik kanan gambar di Shopee \u2192 Copy image address / Salin tautan gambar, lalu paste di sini.
              </small>
            </div>
            <button className="btn-primary generate-btn" onClick={handleSaveProduct} disabled={!prodTitle || !prodDesc || !prodLink || isSaving}>
              {isSaving ? 'Menyimpan...' : '💾 Simpan ke Database'}
            </button>
          </div>
          
          <div className="glass-panel" style={{padding: '1rem', background: 'transparent', border: 'none', boxShadow: 'none'}}>
            <h3 style={{marginBottom: '1rem'}}>Galeri Produk ({productsData.length})</h3>
            {isProductsLoading ? (
              <div style={{textAlign: 'center', padding: '2rem'}}><span className="loading-spinner"></span> Memuat...</div>
            ) : productsData.length === 0 ? (
              <EmptyStateRight />
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {productsData.map(item => {
                  let parsed = {};
                  try { parsed = JSON.parse(item.result); } catch(e) {}
                  return (
                    <div key={item.id} className="prompt-card fade-in" style={{display: 'flex', gap: '1rem', padding: '1rem'}}>
                      {parsed.imgUrl && (
                        <div style={{width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)'}}>
                          <img src={parsed.imgUrl} alt={item.product_desc} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                        </div>
                      )}
                      <div style={{flex: 1, overflow: 'hidden'}}>
                        <h4 style={{margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--primary-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.product_desc}</h4>
                        <p style={{fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{parsed.desc}</p>
                        <a href={parsed.link} target="_blank" rel="noreferrer" style={{fontSize: '0.75rem', color: '#3b82f6', textDecoration: 'none'}}>🔗 Link Produk</a>
                      </div>
                      <button onClick={() => handleDeleteProduct(item.id)} style={{background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', alignSelf: 'flex-start'}}>
                        Hapus
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabase = () => {
    let filteredHistory = [];
    if (activeDatabaseCategory === 'Storyboard') {
      filteredHistory = history.filter(item => item.type === 'Storyboard' || item.type === 'Konten Masak' || item.type === 'Bang Jenggot');
    } else if (activeDatabaseCategory === 'Threads Affiliate') {
      filteredHistory = history.filter(item => item.type === 'Utas Affiliate');
    } else if (activeDatabaseCategory === 'Threads Umum') {
      filteredHistory = history.filter(item => item.type === 'Utas Bebas');
    }

    if (selectedHistoryItem) {
      const parts = selectedHistoryItem.result.split('\n\n---\n\n').filter(p => p.trim());
      return (
        <div className="content-wrapper fade-in">
          <div className="content-panel">
            <button className="btn-secondary" onClick={() => setSelectedHistoryItem(null)} style={{marginBottom: '1rem'}}>
              &larr; Kembali ke Daftar
            </button>
            <h2 className="desktop-title">{selectedHistoryItem.type}</h2>
            <p className="subtitle" style={{marginBottom: '1rem'}}><strong>Topik/Produk:</strong> {selectedHistoryItem.product_desc}</p>
            <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
              {parts.map((part, index) => {
                const imgMatch = part.match(/\[IMG\](.*?)\[\/IMG\]/);
                const imageUrl = imgMatch ? imgMatch[1] : null;
                const textWithoutImage = part.replace(/\[IMG\].*?\[\/IMG\]/g, '').trim();
                const isStoryboard = activeDatabaseCategory === 'Storyboard';

                return (
                  <div key={index} className="prompt-card fade-in">
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center'}}>
                      <span style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold'}}>
                        Bagian {index + 1}
                      </span>
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleCopy(textWithoutImage, index)}
                        style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem', margin: 0, background: copiedIndex === index ? '#10b981' : '', color: copiedIndex === index ? 'white' : ''}}
                      >
                        {copiedIndex === index ? 'Tersalin! ✓' : '📋 Salin'}
                      </button>
                    </div>
                    <div style={{whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>{textWithoutImage}</div>
                    
                    {isStoryboard && (
                      <div style={{marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)'}}>
                        {imageUrl ? (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                            <img src={imageUrl} alt={`Visualisasi Bagian ${index + 1}`} style={{width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '12px', background: 'rgba(0,0,0,0.2)'}} />
                            <div style={{display: 'flex', gap: '0.5rem'}}>
                              <a href={imageUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0.8rem'}}>
                                🔍 Buka Resolusi Penuh
                              </a>
                              <button className="btn-secondary" onClick={() => handleRemoveImageFromPart(index, parts)} style={{color: '#ef4444', borderColor: '#ef4444', fontSize: '0.8rem', padding: '0.4rem 0.8rem'}}>
                                🗑️ Hapus Gambar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{display: 'flex', gap: '0.5rem'}}>
                            <input 
                              type="text" 
                              placeholder="URL Gambar Hasil (Midjourney/Flux/dsb)..." 
                              className="text-input" 
                              value={imageInputs[index] || ''}
                              onChange={(e) => setImageInputs({...imageInputs, [index]: e.target.value})}
                              style={{flex: 1, padding: '0.5rem', fontSize: '0.85rem'}}
                            />
                            <button className="btn-primary" onClick={() => handleSaveImageToPart(index, parts)} disabled={!imageInputs[index]} style={{padding: '0.5rem 1rem', fontSize: '0.85rem', margin: 0}}>
                              Simpan Gambar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="content-wrapper fade-in">
        <div className="content-panel">
          <h2 className="desktop-title">🗄️ Database Konten</h2>
          <p className="subtitle">Tempat penyimpanan semua draft dan karya Anda. Terstruktur per kategori agar mudah dicari.</p>
          
          <div style={{display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
            {['Storyboard', 'Threads Affiliate', 'Threads Umum'].map(cat => (
              <button 
                key={cat} 
                onClick={() => {setActiveDatabaseCategory(cat); setSelectedHistoryItem(null);}}
                style={{
                  padding: '0.6rem 1.2rem', 
                  borderRadius: '8px', 
                  border: '1px solid var(--glass-border)', 
                  background: activeDatabaseCategory === cat ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                  color: activeDatabaseCategory === cat ? 'white' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: 'bold'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {isHistoryLoading ? (
            <div style={{textAlign: 'center', padding: '2rem'}}><span className="loading-spinner"></span> Memuat database...</div>
          ) : filteredHistory.length === 0 ? (
            <div className="glass-panel" style={{textAlign: 'center', opacity: 0.7}}>Belum ada data di kategori ini.</div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
              {filteredHistory.map(item => (
                <div key={item.id} className="glass-panel hover-card" style={{padding: '1.2rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--glass-border)'}} onClick={() => setSelectedHistoryItem(item)}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center'}}>
                    <span style={{background: 'var(--primary-color)', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold'}}>{item.type}</span>
                    <span style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>{new Date(item.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <h4 style={{fontSize: '1rem', color: 'var(--text-primary)', margin: 0}}>
                    {item.product_desc || 'Tanpa Judul'}
                  </h4>
                  <div style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                    Klik untuk melihat isi konten dan menyalin teks...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleKeyChange = (e) => {
    setApiKey(e.target.value);
    localStorage.setItem('storyboard_api_key', e.target.value);
  };

  const handleGeminiKeyChange = (index, value) => {
    const newKeys = [...geminiKeys];
    newKeys[index] = value;
    setGeminiKeys(newKeys);
    localStorage.setItem('gemini_api_keys', JSON.stringify(newKeys));
  };

  const renderSettings = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">Pengaturan API</h2>
        <p className="subtitle">Kelola semua kunci API (API Key) Anda di sini.</p>
        
        <div className="layout-grid">
          <div className="glass-panel" style={{textAlign: 'left', gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto'}}>
            <h3 style={{marginBottom: '1rem', color: 'var(--primary-color)'}}>1inference API (Utama)</h3>
            <div className="input-group">
              <label>1inference API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={handleKeyChange}
                placeholder="Masukkan API Key 1inference Anda..."
                className="api-key-input"
              />
              <small className="help-text" style={{marginTop: '0.5rem', display: 'block', color: 'var(--text-secondary)'}}>
                Digunakan untuk fitur Storyboard, Gambar, dan Thread Umum.
              </small>
            </div>
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
        {activeTab === 'cooking_content' && renderCookingContentForm()}
        {activeTab === 'bang_jenggot' && renderBangJenggotForm()}
        {activeTab === 'bank_storyboard' && renderBankStoryboardForm()}
        {activeTab === 'image_gen' && renderImageGenForm()}
        {activeTab === 'video_script' && renderVideoScriptForm()}
        {activeTab === 'product_data' && renderProductDataForm()}
        {activeTab === 'thread' && renderThreadForm()}
        {activeTab === 'gen_thread' && renderGenThreadForm()}
        {activeTab === 'selling_point' && renderSellingForm()}
        {activeTab === 'history' && renderDatabase()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  )
}

export default App
