import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Dashboard from './components/Dashboard'
import MobileNav from './components/MobileNav'
import Sidebar, { pageTitle } from './components/Sidebar'
import Icon from './components/Icon'
import Modal from './components/Modal'
import { appFetch as fetch, readStorage, writeStorage, readGeminiKeys, parseRecord, safeLink, historyParts, loadAllRecords } from './lib/client'
import { useReleaseObjectUrl } from './lib/media'
import { uploadGeminiFile } from './lib/gemini'
import { useMobileViewport } from './lib/viewport'
import { articleThreadStyles, articleThreadTones, buildArticleThreadPrompt } from './lib/article-thread'
import { useArticleRecommendation } from './lib/use-article-recommendation'

function App() {
  useMobileViewport()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [apiKey, setApiKey] = useState(() => readStorage('storyboard_api_key').trim())
  const [notice, setNotice] = useState('')
  const [loadErrors, setLoadErrors] = useState({})
  const mainRef = useRef(null)
  const copyTimer = useRef(null)
  const savePending = useRef(false)
  const loadVersions = useRef({})
  const alert = message => setNotice(String(message))
  
  // --- GEMINI API KEYS STATES ---
  const [geminiKeys, setGeminiKeys] = useState(readGeminiKeys);
  const [activeGeminiKeyIndex, setActiveGeminiKeyIndex] = useState(0);

  const [copiedIndex, setCopiedIndex] = useState(null)
  const [history, setHistory] = useState([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
  const [bjModelImage, setBjModelImage] = useState(null)
  const [bjModelFile, setBjModelFile] = useState(null)
  const [bjDesc, setBjDesc] = useState('')
  const [bjInstruction, setBjInstruction] = useState('')
  const [bjAngles, setBjAngles] = useState(['Direct Review'])
  const [bjPromptCount, setBjPromptCount] = useState('2')
  const [bjSceneCount, setBjSceneCount] = useState('4')
  const [bjVideoDuration, setBjVideoDuration] = useState('30')
  const [isBjProductModalOpen, setIsBjProductModalOpen] = useState(false)
  const [selectedBjFolder, setSelectedBjFolder] = useState(null)
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
  const [genThreadInstruction, setGenThreadInstruction] = useState('')
  const [genThreadLanguageStyle, setGenThreadLanguageStyle] = useState('santai')
  const [genThreadTone, setGenThreadTone] = useState('penasaran')
  const [genThreadLengthCount, setGenThreadLengthCount] = useState(5)
  const [genThreadAffiliateProduct, setGenThreadAffiliateProduct] = useState('')
  const [genThreadAffiliateProductName, setGenThreadAffiliateProductName] = useState('')
  const [genThreadAffiliateProductObj, setGenThreadAffiliateProductObj] = useState(null)
  const [isSelectingGenThreadProduct, setIsSelectingGenThreadProduct] = useState(false)
  const [threadLanguageStyle, setThreadLanguageStyle] = useState('Santai (Gue-Elu, Gaul)')
  const [threadAngle, setThreadAngle] = useState('Storytelling (Bercerita pengalaman pribadi/masalah)')
  const [isGeneratingGenThread, setIsGeneratingGenThread] = useState(false)
  const [generatedGenThread, setGeneratedGenThread] = useState(null)
  const [genThreadCategory, setGenThreadCategory] = useState('Otomotif')
  const [genThreadCustomCategory, setGenThreadCustomCategory] = useState('')
  const [viralIdeas, setViralIdeas] = useState([])
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false)
  const { recommendation: articleStyleRecommendation, recommendationError, recommendationStatus, isRecommending, requestRecommendation, getArticleContent } = useArticleRecommendation(genThreadSource, apiKey)

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
  const [editingProductId, setEditingProductId] = useState(null);

  // --- BANK STORYBOARD STATES ---
  const [bankStoryboardData, setBankStoryboardData] = useState([]);
  const [isBankStoryboardLoading, setIsBankStoryboardLoading] = useState(false);
  const [bankCategory, setBankCategory] = useState('');
  const [bankProductName, setBankProductName] = useState('');
  const [bankDesc, setBankDesc] = useState('');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [bankImgUrl, setBankImgUrl] = useState('');
  const [bankModelImgUrl, setBankModelImgUrl] = useState('');
  const [editingBankId, setEditingBankId] = useState(null);
  const [isBankSaving, setIsBankSaving] = useState(false);
  const [activeBankCategory, setActiveBankCategory] = useState('Semua');
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [bankProductLink, setBankProductLink] = useState('');
  const [selectedProductDetail, setSelectedProductDetail] = useState(null);

  // --- BANK USP STATE ---
  const [isGeneratingSelling, setIsGeneratingSelling] = useState(false)

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

  const categoriesList = ['Otomotif', 'Fashion', 'Politik', 'Agama Islam', 'Fakta-fakta', 'Kesehatan', 'Teknologi', 'Hiburan', 'Bisnis', 'Olahraga', 'Custom...'];

  // Database access is proxied by /api/database; server keys stay on the server.

  // --- DATABASE (HISTORY) STATES ---
  const [activeDatabaseCategory, setActiveDatabaseCategory] = useState('Storyboard');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [imageInputs, setImageInputs] = useState({});

  // --- TIKTOK SCRAPER STATES ---
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [isTiktokLoading, setIsTiktokLoading] = useState(false);
  const [tiktokResult, setTiktokResult] = useState(null);
  const [tiktokError, setTiktokError] = useState(null);

  // --- UGC STYLE STATES ---
  const [ugcProductDesc, setUgcProductDesc] = useState('');
  const [ugcVariantCount, setUgcVariantCount] = useState('3');
  const [ugcDuration, setUgcDuration] = useState('20');
  const [ugcInstruction, setUgcInstruction] = useState('');
  const [isGeneratingUgc, setIsGeneratingUgc] = useState(false);
  const [generatedUgc, setGeneratedUgc] = useState(null);
  const [ugcImage, setUgcImage] = useState(null);
  const [ugcFile, setUgcFile] = useState(null);

  // --- BANK GAMBAR STATES ---
  const [imageBankData, setImageBankData] = useState([]);
  const [isImageBankLoading, setIsImageBankLoading] = useState(false);
  const [uploadImgFile, setUploadImgFile] = useState(null);
  const [uploadImgName, setUploadImgName] = useState('');
  const [uploadImgPreview, setUploadImgPreview] = useState(null);
  useEffect(() => {
    if (!uploadImgFile) { setUploadImgPreview(null); return; }
    const url = URL.createObjectURL(uploadImgFile);
    setUploadImgPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [uploadImgFile]);
  const [isUploadingImg, setIsUploadingImg] = useState(false);

  // --- TTS STATES ---
  const [ttsInputText, setTtsInputText] = useState('');
  const [ttsVoice, setTtsVoice] = useState('af_sky');
  const [ttsModel, setTtsModel] = useState('venice-kokoro-tts');
  const [ttsSpeed, setTtsSpeed] = useState('1');
  const [ttsInstruction, setTtsInstruction] = useState('');
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState(null);
  useReleaseObjectUrl(productImage);
  useReleaseObjectUrl(cookImage);
  useReleaseObjectUrl(ugcImage);
  useReleaseObjectUrl(videoScriptPreview);
  useReleaseObjectUrl(generatedAudioUrl);

  const loadRecords = async (type, setter, setLoading) => {
    const key = type || 'Konten';
    const version = (loadVersions.current[key] || 0) + 1;
    loadVersions.current[key] = version;
    setLoading(true);
    try {
      const data = await loadAllRecords(type);
      if (loadVersions.current[key] !== version) return;
      setter(data.filter(item => item && typeof item === 'object').map(item => ({ ...item, result: ['Data Produk', 'Bank Storyboard'].includes(item.type) ? JSON.stringify(parseRecord(item.result)) : typeof item.result === 'string' ? item.result : '' })));
      setLoadErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
    } catch (e) {
      if (loadVersions.current[key] === version) setLoadErrors(prev => ({ ...prev, [key]: e.message }));
    } finally { if (loadVersions.current[key] === version) setLoading(false); }
  };
  const fetchHistory = () => loadRecords('', setHistory, setIsHistoryLoading);

  const updateHistoryResultInSupabase = async (id, newResult) => {
    try {
      const response = await fetch(`/api/database?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: newResult })
      });
      if (response.ok) {
        // Update local state
        setSelectedHistoryItem(prev => prev?.id === id ? { ...prev, result: newResult } : prev);
        setHistory(prev => prev.map(item => item.id === id ? { ...item, result: newResult } : item));
        return true;
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
    
    if (!safeLink(url)) return alert('Masukkan URL gambar http/https yang valid.');
    const newParts = [...currentParts];
    newParts[partIndex] = newParts[partIndex].trim() + `\n\n[IMG]${url}[/IMG]`;
    const newResult = newParts.join('\n\n---\n\n');
    
    if (!await updateHistoryResultInSupabase(selectedHistoryItem.id, newResult)) return;
    
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

  const fetchProducts = () => loadRecords('Data Produk', setProductsData, setIsProductsLoading);
  const fetchBankStoryboard = () => loadRecords('Bank Storyboard', setBankStoryboardData, setIsBankStoryboardLoading);
  const fetchImageBank = () => loadRecords('Bank Gambar', setImageBankData, setIsImageBankLoading);
  const affiliateProducts = [...bankStoryboardData, ...productsData];
  const navigate = tab => {
    setActiveTab(tab); setIsMobileMenuOpen(false); setSelectedHistoryItem(null); setImageInputs({});
    mainRef.current?.scrollTo({ top: 0 });
  };
  const openHistory = item => {
    navigate('history');
    setActiveDatabaseCategory(item.type === 'Utas Affiliate' ? 'Threads Affiliate' : item.type === 'Utas Bebas' ? 'Threads Umum' : 'Storyboard');
    setSelectedHistoryItem(item);
  };
  const openNewProduct = () => {
    navigate('bank_storyboard');
    setEditingBankId(null); setBankProductName(''); setBankDesc(''); setBankImgUrl(''); setBankModelImgUrl(''); setBankCategory(''); setBankProductLink('');
    setIsAddProductModalOpen(true);
  };
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 8000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    document.title = `${pageTitle(activeTab)} · Creator Hub AI`;
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'history') {
      fetchHistory();
    }
    if (activeTab === 'dashboard' || activeTab === 'product_data' || activeTab === 'thread') {
      fetchProducts();
    }
    if (['dashboard', 'bank_storyboard', 'storyboard', 'cooking_content', 'bang_jenggot', 'thread', 'gen_thread', 'ugc'].includes(activeTab)) {
      fetchBankStoryboard();
    }
    if (activeTab === 'dashboard' || activeTab === 'bank_gambar') {
      fetchImageBank();
    }
  }, [activeTab]);

  const saveToSupabase = async (blocks, type, desc, updateId = null) => {
    if (savePending.current) return false;
    savePending.current = true;
    setIsSaving(true);
    const resultText = Array.isArray(blocks) ? blocks.join('\n\n---\n\n') : blocks;
    try {
      const url = updateId ? `/api/database?id=eq.${encodeURIComponent(updateId)}` : '/api/database';
      const response = await fetch(url, {
        method: updateId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: type,
          product_desc: desc,
          result: resultText
        })
      });
      if (response.ok) {
        if (type !== 'Data Produk' && type !== 'Bank Storyboard') alert("Berhasil disimpan permanen ke Database!");
        if (type === 'Data Produk') {
          fetchProducts(); // Refresh data
          setEditingProductId(null);
        }
        if (type === 'Bank Storyboard') {
          fetchBankStoryboard(); // Refresh bank data
          setEditingBankId(null);
        }
        return true;
      } else {
        const err = await response.json();
        alert("Gagal: " + (err.message || JSON.stringify(err)));
      }
    } catch(e) {
      alert("Gagal menyimpan: " + e.message);
      return false;
    } finally {
      savePending.current = false;
      setIsSaving(false);
    }
  };

  const handleEditProduct = (item) => {
    setEditingProductId(item.id);
    setProdTitle(item.product_desc || '');
    let parsed = {};
    try { parsed = JSON.parse(item.result); } catch(e) {}
    setProdDesc(parsed.desc || '');
    setProdLink(parsed.link || '');
    setProdImgUrl(parsed.imgUrl || '');
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProduct = async () => {
    if (savePending.current) return;
    if (!prodTitle.trim() || !prodDesc.trim() || !prodLink.trim()) return alert("Judul, Deskripsi, dan Link wajib diisi!");
    const productPayload = JSON.stringify({
      desc: prodDesc,
      link: prodLink,
      imgUrl: prodImgUrl
    });
    if (await saveToSupabase(productPayload, 'Data Produk', prodTitle.trim(), editingProductId)) {
      setProdTitle(''); setProdDesc(''); setProdLink(''); setProdImgUrl('');
    }
  };

  const handleDeleteProduct = async (id) => {
    if(!window.confirm("Hapus data produk ini?")) return;
    try {
      const response = await fetch(`/api/database?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (response.ok) {
        fetchProducts();
      }
    } catch(e) {
      alert("Gagal hapus: " + e.message);
    }
  };

  const handleEditBank = (item) => {
    setEditingBankId(item.id);
    setBankCategory(item.product_desc);
    let parsed = {};
    try { parsed = JSON.parse(item.result); } catch(e) {}
    setBankProductName(parsed.name || '');
    setBankDesc(parsed.desc || '');
    setBankImgUrl(parsed.imgUrl || '');
    setBankModelImgUrl(parsed.modelImgUrl || '');
    setBankProductLink(parsed.link || '');
    setIsAddProductModalOpen(true);
  };

  const handleSaveBank = async () => {
    if (savePending.current) return;
    if (!bankCategory.trim() || !bankProductName.trim()) return alert("Kategori dan Nama Produk wajib diisi!");
    if (bankProductLink.trim() && !safeLink(bankProductLink.trim())) return alert('Link produk harus berupa URL http/https yang valid.');
    const bankPayload = JSON.stringify({
      name: bankProductName.trim(),
      desc: bankDesc,
      imgUrl: bankImgUrl,
      modelImgUrl: bankModelImgUrl,
      link: bankProductLink
    });
    if (await saveToSupabase(bankPayload, 'Bank Storyboard', bankCategory.trim(), editingBankId)) {
      setBankProductName(''); setBankDesc(''); setBankImgUrl(''); setBankModelImgUrl(''); setBankCategory(''); setBankProductLink('');
      setIsAddProductModalOpen(false);
      setActiveBankCategory('Semua');
    }
  };

  const handleDeleteBank = async (id) => {
    if(!window.confirm("Hapus data dari Bank Storyboard?")) return;
    try {
      const response = await fetch(`/api/database?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (response.ok) {
        setActiveBankCategory('Semua');
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
  
  const searchedBankData = (bankSearchQuery || '').trim() === '' 
    ? bankStoryboardData 
    : bankStoryboardData.filter(item => {
        const name = (item.result || '').toLowerCase();
        const desc = (item.product_desc || '').toLowerCase();
        const query = (bankSearchQuery || '').toLowerCase();
        return name.includes(query) || desc.includes(query);
      });

  const filteredBankData = activeBankCategory === 'Semua' 
    ? searchedBankData 
    : searchedBankData.filter(item => item.product_desc === activeBankCategory);
    
  const groupedBankData = Object.create(null);
  (activeTab === 'bank_storyboard' ? filteredBankData : bankStoryboardData).forEach(item => {
    const cat = item.product_desc || 'Lainnya';
    if (!groupedBankData[cat]) groupedBankData[cat] = [];
    groupedBankData[cat].push(item);
  });

  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) return reject(new Error('Pilih file gambar yang valid.'));
    if (file.size > 20 * 1024 * 1024) return reject(new Error('Ukuran gambar maksimal 20 MB.'));
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
      img.onerror = () => reject(new Error('File gambar tidak dapat dibaca. Gunakan PNG, JPG, atau WEBP.'));
    };
    reader.onerror = error => reject(error);
  });

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      alert('Teks gagal disalin. Izinkan akses clipboard atau salin secara manual.');
    }
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
      let userContentItems = [
        { type: "text", text: `Product Description: ${productDesc}\n\nKey Selling Points (Context):\n${storySellingPoint}` }
      ];
      if (productFile) {
        userContentItems.push({ type: "image_url", image_url: { url: await fileToBase64(productFile) } });
      } else if (productImage && typeof productImage === 'string') {
        const urls = productImage.split(/[\n,]+/).map(u => u.trim()).filter(u => u.startsWith('http'));
        for (const u of urls) {
          userContentItems.push({ type: "image_url", image_url: { url: u } });
        }
      }
      
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
9. THE STORY MUST BE BUILT AROUND THE SPECIFIC PROBLEM AND BENEFIT OF THE PRODUCT. Do NOT reuse generic storylines. The scenario must feel natural and relevant to the product category. Show a clear cause (problem) and effect (solution).
10. REQUIRED FLOW ACROSS PROMPTS:
    - Show a realistic problem related to the product
    - Make the situation slightly relatable or emotional
    - Introduce the product naturally
    - Demonstrate how it solves the problem
    - Show clear result
11. Provide the output in plain text. DO NOT USE MARKDOWN ASTERISKS (**).
12. Separate each main Prompt block with a separator line "---" so the system can parse it.
13. End each prompt block by providing a "Prompt Siap Tempel ke Veo 3" (in English), "Narasi (Voice Over)", and "Efek Suara".

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
            { role: "user", content: userContentItems }
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

      let formatInstructionStr = "WAJIB ISI TEMPLATE DI BAWAH INI DENGAN DESKRIPSI VISUAL YANG SESUAI (DILARANG MERUBAH FORMAT ATAU MENAMBAH SIMBOL --- SENDIRI):\n\n";
      let globalSceneIndex = 1;
      
      for(let p=1; p<=promptCountNum; p++) {
        formatInstructionStr += `PROMPT ${p}: [Tulis Judul Fokus Adegan]\n\n`;
        const baseTime = (p - 1) * 10;
        
        for(let i=1; i<=sceneCountNum; i++) {
          const startSec = baseTime + (i-1) * timePerScene;
          const endSec = i === sceneCountNum ? baseTime + 10 : baseTime + (i * timePerScene);
          
          if (cookType.includes('ASMR')) {
            formatInstructionStr += `Scene ${globalSceneIndex} (Detik ${startSec}-${endSec}):\n`;
            formatInstructionStr += `Video memasak ASMR super realistis dari [nama/bagian makanan]. Pengambilan gambar close-up tangan yang sedang menyiapkan bahan di dapur estetik yang bersih.\n`;
            formatInstructionStr += `Detail visual: [Tulis detail visual spesifik di scene ini: bahan segar, tekstur, minyak mendesis, uap, dll. Pencahayaan lembut hangat, sinematik].\n`;
            formatInstructionStr += `Fokus audio: [Tulis suara ASMR spesifik: memotong, mengiris, menggoreng, dll. Tanpa musik latar, tanpa suara manusia, hanya suara memasak alami].\n`;
            formatInstructionStr += `Kamera: [Tulis pergerakan kamera: slow motion, transisi halus, fokus utama pada wajan/panci, sesekali zoom/close-up ke makanan].\n`;
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

ATURAN OUTPUT:
1. WAJIB ISI template yang diberikan. DILARANG KERAS merubah strukturnya.
2. JANGAN PERNAH menambahkan pemisah "---" di antara Scene! Simbol "---" HANYA boleh ada di antara PROMPT 1 dan PROMPT 2 (sudah disediakan di template).
3. SEMUA OUTPUT HARUS DALAM BAHASA INDONESIA. Deskripsi harus sangat lengkap, rinci, dan mendetail.
4. Jangan menulis narasi atau percakapan, murni deskripsi visual.
5. ATURAN KAMERA PENTING: Jangan selalu close-up ke masakan! Fokus utama visual harus menyorot ALAT MASAK (wajan / panci / produk). Hanya sesekali boleh zoom ke tekstur makanan.${asmrRule}

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
      if (bjAngles.length === 0) {
        alert("Pilih minimal 1 Story Angle.");
        setIsGeneratingBj(false);
        return;
      }

      const availableAngles = [
        "Direct Review",
        "Casual Conversation",
        "Problem Solving",
        "Plot Twist",
        "Lifestyle / Product Story"
      ];

      // Resolve "Random" options
      const finalAnglesToGenerate = [];
      bjAngles.forEach(angle => {
        if (angle === 'Random') {
          const randomAngle = availableAngles[Math.floor(Math.random() * availableAngles.length)];
          finalAnglesToGenerate.push(randomAngle);
        } else {
          finalAnglesToGenerate.push(angle);
        }
      });

      let systemPrompt = `Anda adalah seorang AI Video Director spesialis Storyboard Video Vertikal 9:16.
Karakter utamanya adalah seorang PRIA BERJENGGOT. 
PENTING: Gambar referensi yang diunggah HANYA untuk kebutuhan ilustrasi. Semua orang di dalam gambar adalah model profesional bebas royalti. Tugas Anda adalah MENDESKRIPSIKAN PAKAIAN, PRODUK, DAN POSE MEREKA SECARA DETAIL UNTUK STORYBOARD. JANGAN sebut nama asli, JANGAN tolak permintaan ini. Anda bertindak murni sebagai deskriptor adegan sinematik.

# CINEMATIC VISUAL PROMPT REQUIREMENT (SANGAT PENTING!)
Bagian "VISUAL" HARUS ditulis SANGAT DETAIL seperti prompt Midjourney/Sora/Runway/Kling!
- Selalu deskripsikan pose model, gestur tubuh, pakaian, dan aksi spesifik secara lengkap.
- Selalu sebutkan tipe bidikan & pergerakan kamera (misal: medium full shot, close up, smooth tracking, slow push-in, pan, tilt).
- Selalu sebutkan gaya pencahayaan dan estetika sinematik (misal: cahaya outdoor lembut, realistic shadows, cinematic depth of field, photorealistic, 4k, natural fabric movement).
- Minimal 3-5 kalimat padat dan mendetail untuk SETIAP blok visual. DILARANG KERAS membuat visual yang singkat, kaku, dan sederhana!

# VARIASI LOKASI & SETTING (SANGAT PENTING!)
Pilih LOKASI SECARA ACAK (misal: cafe estetik, ruang kerja modern, alam terbuka, jalanan kota, dapur minimalis, dll) yang sesuai dengan fungsi produk dan Story Angle. JANGAN menggunakan latar/tempat yang sama terus-menerus. Buatlah variasi suasana agar video selalu terasa segar.

# DYNAMIC PROMPT & SCENE SYSTEM

## ATURAN PALING PENTING
**SETIAP 1 PROMPT = TEPAT 10 DETIK VIDEO.**
Setiap prompt akan digunakan untuk menghasilkan 1 video berdurasi 10 detik di Gemini Video.
Jangan membuat satu prompt dengan durasi 5 detik, 15 detik, atau lainnya. Durasi setiap prompt HARUS SELALU TEPAT 10 DETIK.

# TOTAL DURASI VIDEO
Rumus: Jumlah Prompt = Total Durasi ÷ 10 Detik
Contoh: 30 Detik -> 3 Prompt.
(Gunakan Total Durasi Video yang diminta oleh pengguna).

# JUMLAH SCENE DINAMIS
Meskipun setiap prompt selalu berdurasi 10 detik, **jumlah scene di dalam setiap prompt TIDAK BOLEH dibuat baku.**
Satu prompt dapat memiliki 1, 2, 3, atau 4 scene, tergantung kebutuhan cerita.

# PEMBAGIAN DURASI SCENE DINAMIS
Durasi setiap scene di dalam prompt boleh berbeda (misal 3 detik + 7 detik, atau 3 + 3 + 4 detik).
Jumlah seluruh durasi scene dalam satu prompt HARUS tepat 10 detik.
Gunakan scene pendek (2-4s) untuk hook/transition/reaction, scene sedang (4-6s) untuk detail/demo, dan panjang (6-8s) untuk dialog/plot.

# ADAPTIVE STORYTELLING
ANALISIS CERITA -> TENTUKAN JUMLAH SCENE -> BAGI TOTAL DURASI MENJADI 10 DETIK per prompt.
Hapus scene yang tidak menambahkan informasi baru (SCENE ECONOMY RULE).

# CONTINUITY ANTAR PROMPT
Semua prompt harus terasa seperti satu video yang berkelanjutan. Gunakan continuity point (match movement, match position) di akhir setiap prompt agar menyambung ke prompt berikutnya.

# FORMAT OUTPUT PROMPT (PENTING!)
Pisahkan setiap Prompt HANYA dengan simbol "---".
Output HARUS BAHASA INDONESIA.
NARRATIVE STYLE dipilih secara otomatis agar cocok dengan Story Angle.

Contoh Format per Prompt:

BAGIAN [Nomor] — 10 DETIK

Scene 1 — 0-X Detik
Durasi: X detik
VISUAL: [Tulis prompt visual SUPER DETAIL di sini (pergerakan kamera, angle, pencahayaan, latar belakang, gestur karakter, gaya sinematik). Minimal 3 kalimat.]
VOICE OVER: "[Dialog bahasa Indonesia]"

Scene 2 — X-10 Detik
Durasi: Y detik
VISUAL: [Tulis prompt visual SUPER DETAIL di sini (pergerakan kamera, angle, dll). Minimal 3 kalimat.]
VOICE OVER: "[Dialog]"

Pastikan prompt terakhir menyelesaikan cerita (Closing + Hero Product Shot + CTA: "Klik keranjang sekarang!").`;

      /*
      if (bjType.includes('Unboxing')) {
        systemPrompt = `Anda adalah seorang Sutradara Iklan dan Content Creator spesialis Unboxing Produk Estetik untuk video vertikal (9:16). Pengguna akan memberikan deskripsi dan gambar produk (opsional), beserta instruksi khusus.
PENTING TENTANG GAMBAR: JIKA PADA GAMBAR REFERENSI TERDAPAT MANUSIA, WAJAH, ATAU TANGAN, ABAIKAN SEPENUHNYA! FOKUS HANYA PADA BENTUK PRODUKNYA SAJA. JANGAN MENGIDENTIFIKASI ORANG/WAJAH.
Tugas Anda adalah mendeskripsikan secara visual urutan adegan (scene) untuk video unboxing sinematik. Model/aktor utamanya adalah seorang PRIA BERJENGGOT.
Anda harus mendeskripsikan ekspresi pria berjenggot ini, gesturnya, dan interaksinya dengan produk atau dengan kamera.
Video ini dibagi menjadi ${bjPromptCount} Bagian berurutan. Ini BUKAN variasi, melainkan SATU cerita visual yang menyambung.
PENTING: CERITA HARUS DIBANGUN BERDASARKAN MASALAH SPESIFIK (PAIN POINTS) DAN MANFAAT PRODUK. DILARANG MENGGUNAKAN ALUR CERITA GENERIK (Do NOT reuse generic storylines). Skenario harus terasa natural, spesifik dengan kategori produk, dan menunjukkan sebab-akibat (masalah -> solusi) yang jelas.

ATURAN MUTLAK VISUAL:
1. Bentuk, warna, dan ukuran produk HARUS selalu konsisten di semua scene.
2. DILARANG ADA morphing, transformasi, atau perubahan bentuk yang tidak realistis.
3. Interaksi produk hanya boleh menggunakan gerakan tangan manusia yang lambat, halus, dan terkontrol.
4. Pencahayaan (lighting) harus lembut (soft lighting), bayangan realistis, memberikan kesan premium.
5. Background / latar belakang harus bersih (clean) dan minimalis.
6. DILARANG ADA teks, tulisan (no text overlay), dan watermark.
7. Gaya visual: Sinematik, estetik, visual yang memuaskan (satisfying), fokus pada tekstur/detail dan nuansa premium. Opsional: Tambahkan nuansa ASMR halus.

KAMERA:
- Tembakan gerak lambat (slow motion shots).
- Sudut pengambilan gambar jarak dekat (close-up angles).
- Pergerakan kamera yang halus.

ALUR / FLOW VIDEO:
- Awal: Tunjukkan paket yang masih tersegel rapat.
- Tengah: Perlahan membuka kemasan (plastik, kotak, dll). Ambil gambar detail close-up (tekstur, material). Tunjukkan produk secara utuh perlahan-lahan.
- Akhir: Diakhiri dengan produk diletakkan dengan rapi atau dipegang di tangan dengan bangga.

ATURAN OUTPUT (PENTING):
1. Pisahkan setiap Bagian HANYA dengan simbol "---". Dilarang menyisipkan "---" antar scene.
2. SEMUA OUTPUT HARUS DALAM BAHASA INDONESIA.
3. DURASI VOICE OVER: Total durasi Voice Over untuk SETIAP BAGIAN (gabungan dialog semua scene di dalam 1 bagian) HARUS PAS 10 detik. Maksimal gunakan total 20-25 kata per Bagian. JANGAN KEPANJANGAN.
4. Setiap Scene harus memiliki 2 komponen:
   a. VISUAL: (Sesuai aturan mutlak visual, kamera, dan alur di atas)
   b. VOICE OVER: "(Dialog dalam bahasa Indonesia)"

FORMAT UNTUK SETIAP BAGIAN:

BAGIAN [Nomor]: [Fokus Adegan]

Scene 1:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

Scene 2:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

... (hingga ${bjSceneCount} Scene)`;
      } else if (bjType.includes('Komedi')) {
        systemPrompt = `Anda adalah seorang Sutradara Iklan dan Content Creator spesialis Sketsa Komedi (Lucu & Relate) untuk video vertikal (9:16). Pengguna akan memberikan deskripsi dan gambar produk (opsional), beserta instruksi khusus.
PENTING TENTANG GAMBAR: JIKA PADA GAMBAR REFERENSI TERDAPAT MANUSIA, WAJAH, ATAU TANGAN, ABAIKAN SEPENUHNYA! FOKUS HANYA PADA BENTUK PRODUKNYA SAJA. JANGAN MENGIDENTIFIKASI ORANG/WAJAH.
Tugas Anda adalah mendeskripsikan secara visual urutan adegan (scene) untuk sketsa komedi pendek yang melibatkan produk. Model/aktor utamanya adalah seorang PRIA BERJENGGOT.
Anda harus mendeskripsikan ekspresi pria berjenggot ini, gesturnya, dan interaksinya dengan produk atau situasi.
Video ini dibagi menjadi ${bjPromptCount} Bagian berurutan. Ini BUKAN variasi, melainkan SATU cerita visual yang menyambung.
PENTING: CERITA HARUS DIBANGUN BERDASARKAN MASALAH SPESIFIK (PAIN POINTS) DAN MANFAAT PRODUK. DILARANG MENGGUNAKAN ALUR CERITA GENERIK (Do NOT reuse generic storylines). Skenario harus terasa natural, spesifik dengan kategori produk, dan menunjukkan sebab-akibat (masalah -> solusi) yang jelas.

ATURAN MUTLAK VISUAL:
1. Bentuk, warna, dan ukuran produk HARUS selalu konsisten di semua scene.
2. DILARANG ADA morphing, transformasi sihir, atau efek yang tidak realistis.
3. Pergerakan dan ekspresi manusia harus natural (akting natural, tidak overdramatis).
4. Pemisahan antar scene harus terlihat jelas (clear scene separation).
5. DILARANG ADA teks, tulisan (no text overlay), dan watermark.
6. Gaya visual: Humor ringan (light humor), menceritakan kehidupan sehari-hari (relatable daily life), sederhana dan mudah dipahami.

KAMERA:
- Pengambilan gambar yang stabil (stable shots).
- Kombinasi medium shot dan close-up.
- Fokus visual yang sangat jelas pada produk di saat adegan solusi (solution scene).

ALUR / FLOW VIDEO:
- Awal: Menunjukkan masalah sehari-hari yang relate (sedikit dilebih-lebihkan tapi tetap realistis).
- Tengah: Situasi makin memburuk (momen lucu). Kemudian, perlahan produk diperkenalkan sebagai sebuah solusi.
- Akhir: Masalah terpecahkan dengan cara yang memuaskan berkat produk tersebut.

ATURAN OUTPUT (PENTING):
1. Pisahkan setiap Bagian HANYA dengan simbol "---". Dilarang menyisipkan "---" antar scene.
2. SEMUA OUTPUT HARUS DALAM BAHASA INDONESIA.
3. DURASI VOICE OVER: Total durasi Voice Over untuk SETIAP BAGIAN (gabungan dialog semua scene di dalam 1 bagian) HARUS PAS 10 detik. Maksimal gunakan total 20-25 kata per Bagian. JANGAN KEPANJANGAN.
4. Setiap Scene harus memiliki 2 komponen:
   a. VISUAL: (Sesuai aturan mutlak visual, kamera, dan alur di atas)
   b. VOICE OVER: "(Dialog dalam bahasa Indonesia)"

FORMAT UNTUK SETIAP BAGIAN:

BAGIAN [Nomor]: [Fokus Adegan]

Scene 1:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

Scene 2:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

... (hingga ${bjSceneCount} Scene)`;
      } else if (bjType.includes('Edukasi') || bjType.includes('Tutorial')) {
        systemPrompt = `Anda adalah seorang Sutradara Iklan dan Content Creator spesialis Video Tutorial Edukasi untuk video vertikal (9:16). Pengguna akan memberikan deskripsi dan gambar produk (opsional), beserta instruksi khusus.
PENTING TENTANG GAMBAR: JIKA PADA GAMBAR REFERENSI TERDAPAT MANUSIA, WAJAH, ATAU TANGAN, ABAIKAN SEPENUHNYA! FOKUS HANYA PADA BENTUK PRODUKNYA SAJA. JANGAN MENGIDENTIFIKASI ORANG/WAJAH.
Tugas Anda adalah mendeskripsikan secara visual urutan adegan (scene) untuk video tutorial singkat cara penggunaan produk. Narator/aktor utamanya adalah seorang PRIA BERJENGGOT.
Video ini dibagi menjadi ${bjPromptCount} Bagian berurutan. Ini BUKAN variasi, melainkan SATU cerita visual yang menyambung.
PENTING: CERITA HARUS DIBANGUN BERDASARKAN MASALAH SPESIFIK (PAIN POINTS) DAN MANFAAT PRODUK. DILARANG MENGGUNAKAN ALUR CERITA GENERIK (Do NOT reuse generic storylines). Skenario harus terasa natural, spesifik dengan kategori produk, dan menunjukkan sebab-akibat (masalah -> solusi) yang jelas.

ATURAN MUTLAK VISUAL (GLOBAL RULES):
1. Produk HARUS 100% konsisten di semua frame (tidak boleh berubah bentuk, warna, atau ukuran / no shape shifting).
2. DILARANG ADA glitch, flickering, atau distorsi. DILARANG ADA efek magis atau surealis.
3. Fisika realistis dan pergerakan natural (realistic physics and natural motion).
4. Satu scene = satu aksi yang jelas (one scene = one clear action). Hindari transisi yang rumit.
5. Background harus sangat bersih, sederhana, tanpa distraksi (clean, no background distraction).
6. Pencahayaan lembut natural (soft natural lighting) untuk kesan premium.
7. DILARANG ADA teks (no text overlay) dan watermark.

KAMERA & GAYA:
- Tempo cepat tapi jelas (Fast-paced but clear), sangat mudah diikuti (easy to follow).
- Pengambilan gambar dari atas (Top view) atau jarak dekat (close-up) yang stabil (stable shots).
- Fokus tunggal pada produk (single product focus) dan menyorot aksi-aksi penting.
- PENTING: Saat adegan demonstrasi (langkah-langkah), gunakan gaya "hands only, no face" (hanya tangan pria yang terlihat berinteraksi dengan produk, tanpa menyorot wajah) agar gambar jauh lebih stabil dan penonton fokus pada tutorialnya.

ALUR / FLOW VIDEO:
- Awal: Hook cepat (menyampaikan apa yang akan dipelajari penonton dari video ini).
- Tengah: Demonstrasi langkah-demi-langkah secara bertahap (maksimal 2-3 langkah yang sangat jelas).
- Akhir: Tunjukkan hasil akhirnya dengan sangat jelas.

ATURAN OUTPUT (PENTING):
1. Pisahkan setiap Bagian HANYA dengan simbol "---". Dilarang menyisipkan "---" antar scene.
2. SEMUA OUTPUT HARUS DALAM BAHASA INDONESIA.
3. DURASI VOICE OVER: Total durasi Voice Over untuk SETIAP BAGIAN (gabungan dialog semua scene di dalam 1 bagian) HARUS PAS 10 detik. Maksimal gunakan total 20-25 kata per Bagian. JANGAN KEPANJANGAN.
4. Setiap Scene harus memiliki 2 komponen:
   a. VISUAL: (Sesuai aturan mutlak visual, kamera, dan alur di atas)
   b. VOICE OVER: "(Dialog dalam bahasa Indonesia)"

FORMAT UNTUK SETIAP BAGIAN:

BAGIAN [Nomor]: [Fokus Adegan]

Scene 1:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

Scene 2:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

... (hingga ${bjSceneCount} Scene)`;
      } else if (bjType.includes('UGC')) {
        systemPrompt = `Anda adalah seorang Sutradara Iklan dan Content Creator spesialis Konten UGC (User Generated Content) untuk video vertikal (9:16). Pengguna akan memberikan deskripsi dan gambar produk (opsional), beserta instruksi khusus.
PENTING TENTANG GAMBAR: JIKA PADA GAMBAR REFERENSI TERDAPAT MANUSIA, WAJAH, ATAU TANGAN, ABAIKAN SEPENUHNYA! FOKUS HANYA PADA BENTUK PRODUKNYA SAJA. JANGAN MENGIDENTIFIKASI ORANG/WAJAH.
Tugas Anda adalah mendeskripsikan secara visual urutan adegan (scene) untuk video UGC yang sangat otentik dan "tidak terlihat seperti iklan". Model/aktor utamanya adalah seorang PRIA BERJENGGOT.
Anda harus mendeskripsikan ekspresi pria berjenggot ini, gesturnya, dan interaksinya dengan produk seolah-olah dia adalah konsumen biasa yang membagikan pengalaman pribadinya.
Video ini dibagi menjadi ${bjPromptCount} Bagian berurutan. Ini BUKAN variasi, melainkan SATU cerita visual yang menyambung.
PENTING: CERITA HARUS DIBANGUN BERDASARKAN MASALAH SPESIFIK (PAIN POINTS) DAN MANFAAT PRODUK. DILARANG MENGGUNAKAN ALUR CERITA GENERIK (Do NOT reuse generic storylines). Skenario harus terasa natural, spesifik dengan kategori produk, dan menunjukkan sebab-akibat (masalah -> solusi) yang jelas.

ATURAN MUTLAK VISUAL:
1. Bentuk, warna, dan ukuran produk HARUS selalu konsisten di semua scene.
2. DILARANG ADA morphing, transformasi, atau efek editan tingkat tinggi. Harus terlihat direkam dengan kamera HP biasa.
3. Pergerakan kamera dinamis (handheld style), sesekali sedikit goyang (shaky) agar terlihat natural buatan pengguna, tapi tetap fokus.
4. Pencahayaan natural (natural lighting), bisa dalam kamar, ruang tamu, atau di luar ruangan biasa.
5. Background / latar belakang kehidupan nyata, bukan studio yang terlalu bersih.
6. DILARANG ADA teks (no text overlay) dan watermark.
7. Gaya visual: Otentik, amatir namun jelas, terkesan "raw" dan jujur.

ALUR / FLOW VIDEO:
- Awal: HOOK dengan gaya mengeluh tentang masalah sehari-hari, atau memberikan rekomendasi santai ("Guys, dengerin deh...").
- Tengah: Memperlihatkan produk digunakan dalam situasi nyata sehari-hari. Fokus pada kemudahan pemakaian.
- Akhir: Menyimpulkan pengalaman pemakaian secara kasual dan CTA yang sangat santai (contoh: "Cek keranjang kuning mumpung belum habis").

ATURAN OUTPUT (PENTING):
1. Pisahkan setiap Bagian HANYA dengan simbol "---". Dilarang menyisipkan "---" antar scene.
2. SEMUA OUTPUT HARUS DALAM BAHASA INDONESIA.
3. DURASI VOICE OVER: Total durasi Voice Over untuk SETIAP BAGIAN (gabungan dialog semua scene di dalam 1 bagian) HARUS PAS 10 detik. Maksimal gunakan total 20-25 kata per Bagian. JANGAN KEPANJANGAN.
4. Setiap Scene harus memiliki 2 komponen:
   a. VISUAL: (Sesuai aturan mutlak visual dan alur di atas)
   b. VOICE OVER: "(Dialog dalam bahasa Indonesia bergaya kasual/UGC)"

FORMAT UNTUK SETIAP BAGIAN:

BAGIAN [Nomor]: [Fokus Adegan]

Scene 1:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

Scene 2:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

... (hingga ${bjSceneCount} Scene)`;
      } else if (bjType.includes('Storytelling')) {
        systemPrompt = `Anda adalah seorang Sutradara Iklan dan Content Creator spesialis Storytelling Emosional untuk video vertikal (9:16). Pengguna akan memberikan deskripsi dan gambar produk (opsional), beserta instruksi khusus.
PENTING TENTANG GAMBAR: JIKA PADA GAMBAR REFERENSI TERDAPAT MANUSIA, WAJAH, ATAU TANGAN, ABAIKAN SEPENUHNYA! FOKUS HANYA PADA BENTUK PRODUKNYA SAJA. JANGAN MENGIDENTIFIKASI ORANG/WAJAH.
Tugas Anda adalah mendeskripsikan secara visual urutan adegan (scene) untuk video bercerita (storytelling) yang menyentuh atau membangkitkan emosi penonton. Model/aktor utamanya adalah seorang PRIA BERJENGGOT.
Anda harus mendeskripsikan ekspresi pria berjenggot ini secara mendalam (misal: tatapan mata, raut wajah, bahasa tubuh lambat).
Video ini dibagi menjadi ${bjPromptCount} Bagian berurutan. Ini BUKAN variasi, melainkan SATU cerita visual yang menyambung.
PENTING: CERITA HARUS DIBANGUN BERDASARKAN MASALAH SPESIFIK (PAIN POINTS) DAN MANFAAT PRODUK. DILARANG MENGGUNAKAN ALUR CERITA GENERIK (Do NOT reuse generic storylines). Skenario harus menyentuh sisi emosional dari masalah tersebut sebelum memberikan solusi.

ATURAN MUTLAK VISUAL:
1. Bentuk, warna, dan ukuran produk HARUS selalu konsisten di semua scene.
2. DILARANG ADA morphing, transformasi, atau efek yang merusak suasana sinematik.
3. Pencahayaan (lighting) dramatis, bisa menggunakan teknik siluet, pencahayaan kontras (chiaroscuro), atau warna hangat (warm tone).
4. Pergerakan kamera sangat lambat dan halus (slow cinematic pan, dolly in).
5. Background / latar belakang estetik namun mendalam.
6. DILARANG ADA teks (no text overlay) dan watermark.
7. Gaya visual: Sinematik, emosional, lambat, fokus pada perasaan dan atmosfer.

ALUR / FLOW VIDEO:
- Awal: HOOK berupa momen perenungan atau situasi emosional yang berat terkait masalah (Pain point).
- Tengah: Perjalanan menemukan solusi (produk). Sorot produk dengan cara yang elegan.
- Akhir: Transformasi emosi (dari sedih/bingung menjadi tenang/bahagia), disajikan dengan sangat *soft selling*.

ATURAN OUTPUT (PENTING):
1. Pisahkan setiap Bagian HANYA dengan simbol "---". Dilarang menyisipkan "---" antar scene.
2. SEMUA OUTPUT HARUS DALAM BAHASA INDONESIA.
3. DURASI VOICE OVER: Total durasi Voice Over untuk SETIAP BAGIAN (gabungan dialog semua scene di dalam 1 bagian) HARUS PAS 10 detik. Maksimal gunakan total 20-25 kata per Bagian. JANGAN KEPANJANGAN. Karena ini storytelling, beri jeda untuk *visual breathing*.
4. Setiap Scene harus memiliki 2 komponen:
   a. VISUAL: (Sesuai aturan mutlak visual dan alur di atas)
   b. VOICE OVER: "(Dialog dalam bahasa Indonesia yang menyentuh, mendalam)"

FORMAT UNTUK SETIAP BAGIAN:

BAGIAN [Nomor]: [Fokus Adegan]

Scene 1:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

Scene 2:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

... (hingga ${bjSceneCount} Scene)`;
      } else {
        systemPrompt = `Anda adalah seorang Sutradara Iklan dan Content Creator spesialis Review Produk/POV untuk video vertikal (9:16). Pengguna akan memberikan deskripsi dan gambar produk (opsional), beserta instruksi khusus.
PENTING TENTANG GAMBAR: JIKA PADA GAMBAR REFERENSI TERDAPAT MANUSIA, WAJAH, ATAU TANGAN, ABAIKAN SEPENUHNYA! FOKUS HANYA PADA BENTUK PRODUKNYA SAJA. JANGAN MENGIDENTIFIKASI ORANG/WAJAH.
Tugas Anda adalah mendeskripsikan secara visual urutan adegan (scene) untuk video review atau POV. Model/aktor utamanya adalah seorang PRIA BERJENGGOT.
Anda harus mendeskripsikan ekspresi pria berjenggot ini, gesturnya, dan interaksinya dengan produk atau dengan kamera (jika POV).
Video ini dibagi menjadi ${bjPromptCount} Bagian berurutan. Ini BUKAN variasi, melainkan SATU cerita visual yang menyambung.
PENTING: CERITA HARUS DIBANGUN BERDASARKAN MASALAH SPESIFIK (PAIN POINTS) DAN MANFAAT PRODUK. DILARANG MENGGUNAKAN ALUR CERITA GENERIK (Do NOT reuse generic storylines). Skenario harus terasa natural, spesifik dengan kategori produk, dan menunjukkan sebab-akibat (masalah -> solusi) yang jelas.

ATURAN MUTLAK VISUAL:
1. Bentuk, warna, dan ukuran produk HARUS selalu konsisten di semua scene.
2. DILARANG ADA morphing, transformasi, atau perubahan bentuk yang tidak realistis.
3. Interaksi produk hanya boleh menggunakan tangan manusia yang natural.
4. Pencahayaan (lighting) dan bayangan harus realistis dan natural.
5. Background / latar belakang harus bersih (clean) dan sederhana.
6. DILARANG ADA teks, tulisan (no text overlay), dan watermark.
7. Gaya visual: Realistis, natural, tidak berlebihan, fokus pada kepercayaan, banyak close-up, transisi halus tanpa glitch.

ALUR / FLOW VIDEO:
- Awal: HOOK dengan nada penasaran (curious) atau skeptis.
- Tengah: Tunjukkan produk secara close-up. Lakukan demonstrasi penggunaan nyata. Tunjukkan hasil dengan jelas.
- Akhir: Reaksi emosional tipis/halus (terkejut/puas) dan Call To Action (CTA) klik keranjang kuning.

ATURAN OUTPUT (PENTING):
1. Pisahkan setiap Bagian HANYA dengan simbol "---". Dilarang menyisipkan "---" antar scene.
2. SEMUA OUTPUT HARUS DALAM BAHASA INDONESIA.
3. DURASI VOICE OVER: Total durasi Voice Over untuk SETIAP BAGIAN (gabungan dialog semua scene di dalam 1 bagian) HARUS PAS 10 detik. Maksimal gunakan total 20-25 kata per Bagian. JANGAN KEPANJANGAN.
4. Setiap Scene harus memiliki 2 komponen:
   a. VISUAL: (Sesuai aturan mutlak visual dan alur di atas)
   b. VOICE OVER: "(Dialog dalam bahasa Indonesia)"

FORMAT UNTUK SETIAP BAGIAN:

BAGIAN [Nomor]: [Fokus Adegan]

Scene 1:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

Scene 2:
VISUAL: (Deskripsi visual detail)
VOICE OVER: "(Dialog/narasi)"

... (hingga ${bjSceneCount} Scene)`;
      }
      */

      const results = await Promise.all(finalAnglesToGenerate.map(async (angle) => {
        let userContent = [];
        userContent.push({ type: "text", text: `Deskripsi Produk: ${bjDesc}\nStory Angle: ${angle}\nTotal Durasi Video: ${bjVideoDuration} Detik\nInstruksi Khusus: ${bjInstruction || 'Terserah AI'}` });

        if (bjFile) {
          userContent.push({ type: "image_url", image_url: { url: await fileToBase64(bjFile) } });
        } else if (bjImage && typeof bjImage === 'string') {
          const urls = bjImage.split(/[\n,]+/).map(u => u.trim()).filter(u => u.startsWith('http'));
          for (const u of urls) {
            userContent.push({ type: "image_url", image_url: { url: u } });
          }
        }

        if (bjModelFile) {
          userContent.push({ type: "image_url", image_url: { url: await fileToBase64(bjModelFile) } });
        } else if (bjModelImage && typeof bjModelImage === 'string') {
          const urls = bjModelImage.split(/[\n,]+/).map(u => u.trim()).filter(u => u.startsWith('http'));
          for (const u of urls) {
            userContent.push({ type: "image_url", image_url: { url: u } });
          }
        }

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
        return { angle, blocks };
      }));

      setGeneratedBj(results);
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingBj(false)
    }
  }

  const EmptyStateRight = () => (
    <div className="glass-panel empty-state fade-in">
      <div className="empty-icon"><Icon name="spark" size={29} /></div>
      <h3>Ruang untuk karya berikutnya</h3>
      <p>Lengkapi brief Anda, lalu klik Generate. Hasil konten akan tampil di sini, siap ditinjau dan digunakan.</p>
    </div>
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
                <label style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>🗃️ Pilih dari Data Produk (Auto-fill)</label>
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
                    setProductImage(parsed.imgUrl || null); setProductFile(null);
                    setStorySellingPoint('');
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
                  <div className="image-preview" style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                    {productImage.startsWith('http') ? (
                      productImage.split(/[\n,]+/).map((u, i) => u.trim() && u.startsWith('http') && <img key={i} src={u.trim()} alt="Preview" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}} />)
                    ) : (
                      <img src={productImage} alt="Preview" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}} />
                    )}
                    <button className="btn-secondary" style={{alignSelf: 'center'}} onClick={() => { setProductImage(null); setProductFile(null); }}>Ganti Gambar</button>
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

              <button className="btn-primary generate-btn" onClick={handleGenerateStorySelling} disabled={(!productFile && !productImage) || !productDesc || isGeneratingStorySelling || !apiKey} style={{marginBottom: '1rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
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
              <label style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>🗃️ Pilih dari Data Produk (Auto-fill)</label>
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
                  setCookDesc(`${parsed.name || item.product_desc} - ${parsed.desc || ''}`);
                  setCookImage(parsed.imgUrl || null); setCookFile(null);
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
                    <h3>Prompt {index + 1}</h3>
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

  const handleUgcImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUgcFile(file);
      setUgcImage(URL.createObjectURL(file));
    }
  };

  const handleGenerateUgc = async () => {
    if ((!ugcProductDesc && !ugcImage && !ugcFile) || !apiKey) return;
    setIsGeneratingUgc(true);
    setGeneratedUgc(null);
    setCopiedIndex(null);

    const promptText = `Anda adalah seorang ahli pembuat naskah Voice Over (VO) bergaya User Generated Content (UGC) untuk TikTok/Reels/Shorts.

Tugas: Buatkan ${ugcVariantCount} variasi Naskah Voice Over untuk mempromosikan produk berikut.
Total durasi untuk setiap variasi harus pas untuk video berdurasi ${ugcDuration} detik (Asumsi kecepatan baca 2-2.5 kata per detik, jadi untuk ${ugcDuration} detik usahakan panjangnya sekitar ${Math.floor(ugcDuration * 2.2)} kata).

Data Produk:
${ugcProductDesc}

${ugcInstruction ? `Instruksi Tambahan: ${ugcInstruction}\n` : ''}

Ketentuan Format Script UGC (Harus terdiri dari 3 bagian ini):
1. HOOK: Kalimat pancingan di awal yang bikin orang berhenti scrolling.
2. ISI: Penjelasan singkat keunggulan produk / solusi dari masalah penonton.
3. CTA: Call To Action (ajakan klik keranjang kuning / beli sekarang).

Berikan langsung hasil variasi naskahnya dengan format yang jelas (pisahkan tiap variasi dengan rapi), jangan berikan pengantar atau penjelasan tambahan. Cukup berikan script-nya saja.`;

    try {
      let userContentItems = [{ type: "text", text: promptText }];
      if (ugcFile) {
        userContentItems.push({ type: "image_url", image_url: { url: await fileToBase64(ugcFile) } });
      } else if (ugcImage && typeof ugcImage === 'string') {
        const urls = ugcImage.split(/[\n,]+/).map(u => u.trim()).filter(u => u.startsWith('http'));
        for (const u of urls) {
          userContentItems.push({ type: "image_url", image_url: { url: u } });
        }
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${apiKey}`,
          'X-Provider': '1inference'
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{ role: "user", content: userContentItems }]
        })
      });
      const data = await response.json();
      
      if (!response.ok || data.error) {
        throw new Error(data.error?.message || data.error || 'Gagal generate');
      }

      setGeneratedUgc(data.choices[0].message.content);
      
      saveToSupabase(
        data.choices[0].message.content,
        'UGC Style (Voice Over)',
        `Durasi: ${ugcDuration}s | Variasi: ${ugcVariantCount}\nDeskripsi: ${ugcProductDesc}`
      );
      
    } catch (error) {
      alert("Error: " + error.message);
    } finally {
      setIsGeneratingUgc(false);
    }
  };

  const renderUgcForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">📱 UGC Style (Voice Over Script)</h2>
        <p className="subtitle">Hasilkan naskah Voice Over untuk konten UGC dengan struktur Hook, Isi, dan CTA.</p>
        
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <h3 style={{marginBottom: '1rem'}}>Pengaturan Konten</h3>
            
            <div className="input-group">
              <label style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>🗃️ Pilih dari Data Produk (Auto-fill)</label>
              <select onChange={(e) => {
                const selectedId = e.target.value;
                if (!selectedId) {
                  setUgcProductDesc(''); setUgcImage(null); setUgcFile(null);
                  return;
                }
                const item = bankStoryboardData.find(p => p.id == selectedId);
                if (item) {
                  let parsed = {};
                  try { parsed = JSON.parse(item.result); } catch(err){}
                  setUgcProductDesc(parsed.desc || parsed.name || '');
                  setUgcImage(parsed.imgUrl || null); setUgcFile(null);
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
              <label>Gambar Produk (Opsional)</label>
              <div className="image-upload-wrapper">
              {ugcImage ? (
                <div className="image-preview" style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                  {typeof ugcImage === 'string' && ugcImage.startsWith('http') ? (
                    ugcImage.split(/[\n,]+/).map((u, i) => u.trim() && u.startsWith('http') && <img key={i} src={u.trim()} alt="Preview" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}} />)
                  ) : (
                    <img src={ugcImage} alt="Preview" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}} />
                  )}
                  <button className="btn-secondary" style={{alignSelf: 'center'}} onClick={() => { setUgcImage(null); setUgcFile(null); }}>Ganti Gambar</button>
                </div>
              ) : (
                <label className="upload-placeholder">
                  <input type="file" accept="image/*" onChange={handleUgcImageUpload} hidden />
                  <span className="upload-icon">⬆️</span>
                  <span>Klik untuk upload atau paste<br/>(CTRL+V)</span>
                  <small>PNG, JPG, WEBP hingga 10MB</small>
                </label>
              )}
              </div>
            </div>

            <div className="input-group">
              <label>Deskripsi Produk / Masalah</label>
              <textarea 
                placeholder="Jelaskan produk Anda atau masalah apa yang ingin diselesaikan..."
                value={ugcProductDesc}
                onChange={(e) => setUgcProductDesc(e.target.value)}
                rows="4"
              />
            </div>
            
            <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
              <div className="input-group" style={{flex: 1, marginBottom: 0}}>
                <label>Durasi Video</label>
                <select value={ugcDuration} onChange={(e) => setUgcDuration(e.target.value)} className="select-input">
                  <option value="10">10 Detik</option>
                  <option value="20">20 Detik</option>
                  <option value="30">30 Detik</option>
                  <option value="40">40 Detik</option>
                  <option value="50">50 Detik</option>
                  <option value="60">60 Detik</option>
                </select>
              </div>
              
              <div className="input-group" style={{flex: 1, marginBottom: 0}}>
                <label>Jumlah Variasi Script</label>
                <select value={ugcVariantCount} onChange={(e) => setUgcVariantCount(e.target.value)} className="select-input">
                  <option value="1">1 Variasi</option>
                  <option value="2">2 Variasi</option>
                  <option value="3">3 Variasi</option>
                  <option value="4">4 Variasi</option>
                  <option value="5">5 Variasi</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Instruksi Tambahan (Opsional)</label>
              <input 
                type="text"
                placeholder="Contoh: Gunakan bahasa gaul Jaksel, tekankan promo diskon..."
                value={ugcInstruction}
                onChange={(e) => setUgcInstruction(e.target.value)}
                className="api-key-input"
              />
            </div>

            <button className="btn-primary generate-btn" onClick={handleGenerateUgc} disabled={!ugcProductDesc || isGeneratingUgc || !apiKey}>
              {isGeneratingUgc ? 'Menulis Naskah...' : '📝 Generate Script UGC'}
            </button>
            {!apiKey && <small style={{display: 'block', color: '#ef4444', marginTop: '0.3rem'}}>API Key diperlukan untuk fitur ini.</small>}
          </div>

          <div className="glass-panel" style={{display: 'flex', flexDirection: 'column'}}>
            <h3 style={{marginBottom: '1rem'}}>Hasil Generate</h3>
            {isGeneratingUgc ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>AI sedang menulis variasi Hook, Isi, dan CTA...</p>
              </div>
            ) : generatedUgc ? (
              <div className="result-container fade-in" style={{flex: 1}}>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem'}}>
                  <button className="btn-secondary" onClick={() => handleCopy(generatedUgc, 'ugc-full')} style={{fontSize: '0.8rem', padding: '0.4rem 0.8rem'}}>
                    {copiedIndex === 'ugc-full' ? 'Tersalin! ✅' : '📋 Copy Semua'}
                  </button>
                </div>
                <div style={{background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: '1.6'}}>
                  {generatedUgc}
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
              <label><span className="icon">📦</span> DATA PRODUK</label>
              <button 
                className="btn-secondary" 
                onClick={() => { setIsBjProductModalOpen(true); setSelectedBjFolder(null); }}
                style={{ width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span>Pilih dari Bank Produk (Auto-fill)</span>
                <span>📂</span>
              </button>
            </div>
            
            <div className="input-group">
              <label>Gambar Produk (Opsional)</label>
              <div className="image-upload-wrapper">
              {bjImage ? (
                <div className="image-preview" style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                  {bjImage.startsWith('http') ? (
                    bjImage.split(/[\n,]+/).map((u, i) => u.trim() && u.startsWith('http') && <img key={i} src={u.trim()} alt="Preview" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}} />)
                  ) : (
                    <img src={bjImage} alt="Preview" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}} />
                  )}
                  <button className="btn-secondary" style={{alignSelf: 'center'}} onClick={() => { setBjImage(null); setBjFile(null); }}>Hapus / Ganti Gambar</button>
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
              <label>Gambar Model / Karakter (Opsional)</label>
              <div className="image-upload-wrapper">
              {bjModelImage ? (
                <div className="image-preview" style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap'}}>
                  {bjModelImage.startsWith('http') ? (
                    bjModelImage.split(/[\n,]+/).map((u, i) => u.trim() && u.startsWith('http') && <img key={i} src={u.trim()} alt="Preview" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}} />)
                  ) : (
                    <img src={bjModelImage} alt="Preview" style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px'}} />
                  )}
                  <button className="btn-secondary" style={{alignSelf: 'center'}} onClick={() => { setBjModelImage(null); setBjModelFile(null); }}>Hapus / Ganti Gambar Model</button>
                </div>
              ) : (
                <label className="upload-placeholder">
                  <input type="file" accept="image/*" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      setBjModelFile(file);
                      const reader = new FileReader();
                      reader.onload = (e) => setBjModelImage(e.target.result);
                      reader.readAsDataURL(file);
                    }
                  }} hidden />
                  <span className="upload-icon">🧔</span>
                  <span>Klik untuk upload gambar model</span>
                  <small>Referensi wajah untuk AI</small>
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
              <label>Story Angle (Pilih satu atau lebih)</label>
              <div className="checkbox-group" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--glass-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)'}}>
                {[
                  "Direct Review",
                  "Casual Conversation",
                  "Problem Solving",
                  "Plot Twist",
                  "Lifestyle / Product Story",
                  "Random"
                ].map(angle => (
                  <label key={angle} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem'}}>
                    <input 
                      type="checkbox" 
                      checked={bjAngles.includes(angle)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBjAngles([...bjAngles, angle]);
                        } else {
                          setBjAngles(bjAngles.filter(a => a !== angle));
                        }
                      }}
                      style={{width: '1.2rem', height: '1.2rem', cursor: 'pointer'}}
                    />
                    {angle}
                  </label>
                ))}
              </div>
            </div>

            <div className="settings-row">
              <div className="input-group" style={{flex: 1}}>
                <label>Total Durasi Video (Detik)</label>
                <select value={bjVideoDuration} onChange={(e) => setBjVideoDuration(e.target.value)} className="select-input">
                  <option value="10">10 Detik (1 Prompt)</option>
                  <option value="20">20 Detik (2 Prompt)</option>
                  <option value="30">30 Detik (3 Prompt)</option>
                  <option value="40">40 Detik (4 Prompt)</option>
                  <option value="50">50 Detik (5 Prompt)</option>
                  <option value="60">60 Detik (6 Prompt)</option>
                </select>
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
              {generatedBj.map((resultGroup, gIndex) => (
                <div key={gIndex} className="angle-group" style={{marginBottom: '2rem'}}>
                  <h3 style={{padding: '0.5rem 1rem', background: 'var(--glass-border)', borderRadius: '8px', marginBottom: '1rem'}}>
                    🎭 Story Angle: {resultGroup.angle}
                  </h3>
                  {resultGroup.blocks.map((promptText, index) => (
                    <div key={index} className="prompt-card fade-in">
                      <div className="prompt-header">
                        <h3>Bagian {index + 1}</h3>
                        <button className="btn-copy" onClick={() => handleCopy(promptText, `${gIndex}-${index}`)}>
                          {copiedIndex === `${gIndex}-${index}` ? '✅ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                      <pre className="prompt-content" style={{whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflowWrap: 'break-word'}}>{promptText}</pre>
                    </div>
                  ))}
                </div>
              ))}
              
              <div className="action-buttons-bottom" style={{marginTop: '1rem', display: 'flex', gap: '1rem'}}>
                <button className="btn-secondary" onClick={() => saveToSupabase(generatedBj.flatMap(group => group.blocks.map(block => `Story Angle: ${group.angle}\n\n${block}`)), 'Bang Jenggot', bjDesc)} disabled={isSaving} style={{flex: 1}}>
                  {isSaving ? 'Menyimpan...' : '💾 Simpan ke Database'}
                </button>
              </div>
            </div>
          ) : <EmptyStateRight />}
          </div>
        </div>
      </div>

      {isBjProductModalOpen && (
        <Modal label="Pilih produk storyboard" onClose={() => setIsBjProductModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{width: '90%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto', padding: '2rem'}}>
            <div className="dialog-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem'}}>
              <h2>{selectedBjFolder ? `📂 ${selectedBjFolder}` : '📦 Pilih Kategori Produk'}</h2>
              <button aria-label="Tutup pilihan produk" onClick={() => setIsBjProductModalOpen(false)} style={{background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer'}}>×</button>
            </div>

            {!selectedBjFolder ? (
              <div className="dialog-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem'}}>
                {Object.keys(groupedBankData).map(cat => (
                  <div key={cat} onClick={() => setSelectedBjFolder(cat)} className="folder-card" style={{padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', transition: 'transform 0.2s, background 0.2s'}}>
                    <div style={{fontSize: '3rem', marginBottom: '0.5rem'}}>📁</div>
                    <div style={{fontWeight: 'bold', fontSize: '0.9rem'}}>{cat}</div>
                    <div style={{fontSize: '0.8rem', color: '#aaa', marginTop: '0.3rem'}}>{groupedBankData[cat].length} Produk</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <button onClick={() => setSelectedBjFolder(null)} className="btn-secondary" style={{marginBottom: '1rem'}}>⬅️ Kembali ke Kategori</button>
                <div className="dialog-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem'}}>
                  {(groupedBankData[selectedBjFolder] || []).map(item => {
                    let parsed = {};
                    try { parsed = JSON.parse(item.result); } catch(e) {}
                    const img = parsed.imgUrl ? (parsed.imgUrl.startsWith('http') ? parsed.imgUrl.split(/[\n,]+/)[0].trim() : parsed.imgUrl) : null;
                    const name = parsed.name || (parsed.desc ? parsed.desc.substring(0, 40) + '...' : 'Tanpa Nama');
                    return (
                      <div key={item.id} onClick={() => {
                        setBjDesc(`${parsed.name || item.product_desc} - ${parsed.desc || ''}`);
                        setBjImage(parsed.imgUrl || null); setBjFile(null);
                        setBjModelImage(parsed.modelImgUrl || null); setBjModelFile(null);
                        setIsBjProductModalOpen(false);
                      }} className="product-card fade-in" style={{background: 'rgba(255,255,255,0.05)', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', transition: 'transform 0.2s'}}>
                        {img ? (
                          <img src={img} style={{width: '100%', height: '150px', objectFit: 'cover'}} alt={name} />
                        ) : (
                          <div style={{width: '100%', height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.1)', fontSize: '3rem'}}>📦</div>
                        )}
                        <div style={{padding: '1rem'}}>
                          <div style={{fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem'}}>{name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
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
      const systemPrompt = `Bertindaklah sebagai seorang analis tren konten dan riset pasar.
Tugasmu adalah mencari topik yang sedang paling banyak dibahas dalam 7 hari terakhir dari kategori yang saya tentukan.
Kategori: ${categoryToSearch}

Lakukan analisis berdasarkan berbagai sumber seperti:
- Google Trends
- Berita terbaru
- Media sosial (TikTok, Instagram, X, Threads, Facebook)
- YouTube, Reddit, Forum/Komunitas

Ketentuan:
- Prioritaskan topik yang benar-benar sedang tren dalam 7 hari terakhir, bukan topik lama.
- Urutkan berdasarkan potensi viral tertinggi.
- Jika ada lebih dari 10 topik, tampilkan maksimal 10.
- Jika suatu topik mulai menurun, beri tanda.
- Fokus pada tren yang relevan untuk pasar Indonesia.

OUTPUT WAJIB DALAM BENTUK JSON ARRAY OF OBJECTS (Tanpa format markdown \`\`\`json).
Gunakan persis struktur kunci berikut untuk setiap topik:
[
  {
    "judul": "Judul/topik",
    "ringkasan": "Ringkasan mengapa viral",
    "popularitas": "Sangat Tinggi / Tinggi / Sedang",
    "audiens": "Target audiens",
    "peluang": "Peluang dijadikan konten",
    "ide_konten": ["Ide 1", "Ide 2", "Ide 3", "Ide 4", "Ide 5"],
    "hook": ["Hook 1", "Hook 2"],
    "kata_kunci": ["keyword1", "keyword2"],
    "data_pendukung": "Bukti/data tren terkini"
  }
]`;

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
            { role: "user", content: `Berikan analisis tren viral 7 hari terakhir untuk kategori: ${categoryToSearch}` }
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
    if (!genThreadSource || !apiKey) {
      alert("Pastikan Link Berita/Artikel dan API Key sudah diisi.");
      return;
    }
    
    if (!Number.isInteger(Number(genThreadLengthCount)) || Number(genThreadLengthCount) < 2 || Number(genThreadLengthCount) > 20) return alert('Jumlah cuitan harus 2–20.');
    if (!safeLink(genThreadSource)) return alert('Gunakan URL artikel http/https yang valid.');
    setIsGeneratingGenThread(true);
    setGeneratedGenThread(null);
    
    try {
      const articleContent = await getArticleContent();

      const systemPrompt = buildArticleThreadPrompt({
        styleId: genThreadLanguageStyle,
        toneId: genThreadTone,
        length: genThreadLengthCount,
        source: genThreadSource,
        affiliateProduct: genThreadAffiliateProduct
      });

      let userPrompt = `Link Sumber Berita: ${genThreadSource}\n`;
      if (articleContent) {
        userPrompt += `\nIsi Artikel (Gunakan ini sebagai bahan utama utasanmu):\n"""\n${articleContent}\n"""\n`;
      }
      
      if (genThreadInstruction) {
        userPrompt += `\nINSTRUKSI KHUSUS DARI USER:\n${genThreadInstruction}\n`;
      }

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
      
      let blocks = generatedText.split('---').map(b => b.trim()).filter(b => b.length > 0);
      
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
        await new Promise((resolve, reject) => {
          const img = new Image();
          const timer = setTimeout(() => { img.onload = null; img.onerror = null; img.src = ''; reject(new Error('Server gambar tidak merespons. Coba model lain.')); }, 45_000);
          img.onload = () => { clearTimeout(timer); resolve(); };
          img.onerror = () => { clearTimeout(timer); reject(new Error('Server gambar gratis tidak tersedia. Coba model lain.')); };
          img.src = url;
        });
        setGeneratedImageUrl(url);
        setIsGeneratingImg(false);
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
        
        const image = data?.data?.[0];
        const imageUrl = image?.url || (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : data?.choices?.[0]?.message?.images?.[0]?.image_url?.url);
        if (imageUrl) {
          setGeneratedImageUrl(imageUrl);
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

  const uploadFileToGemini = (file, key) => uploadGeminiFile(file, key, setUploadProgress);

  const executeGeminiGeneration = async (keyInfo, fileData, retries = 0, modelIndex = 0) => {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-pro'];
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", 'x-goog-api-key': keyInfo.key },
      body: JSON.stringify(requestBody)
    });

    if (response.status === 429 && retries < 9) {
      // Rotate key
      const nextKey = getWorkingGeminiKey((keyInfo.index + 1) % 10);
      if (nextKey && nextKey.key !== keyInfo.key) {
        setActiveGeminiKeyIndex(nextKey.index);
        setUploadProgress(`Key ${keyInfo.index + 1} limit. Mencoba Key ${nextKey.index + 1}...`);
        // Files belong to the uploading project; do not reuse a URI across keys.
        const nextFile = fileData && videoScriptFile ? await uploadFileToGemini(videoScriptFile, nextKey.key) : null;
        return await executeGeminiGeneration(nextKey, nextFile, retries + 1, modelIndex);
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
    
    const text = data.candidates[0]?.content?.parts?.filter(part => !part.thought).map(part => part.text || '').join('\n') || '';
    if (!text.trim()) throw new Error('Gemini tidak mengembalikan teks. Coba instruksi atau model lain.');
    const blocks = text.split('---').map(b => b.trim()).filter(Boolean);
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

  const handleGenerateBankUSP = async () => {
    if (!bankDesc || !apiKey) {
      alert("Pastikan Deskripsi Produk dan API Key sudah diisi.");
      return;
    }
    
    setIsGeneratingSelling(true)
    
    try {
      const systemPrompt = `Anda adalah seorang manajer produk berpengalaman. Tugas Anda adalah mengidentifikasi poin penjualan produk dan memecahkan masalah nyata yang dihadapi pelanggan.
Pengguna akan memberi Anda nama dan deskripsi produk.
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
            { role: "user", content: `Nama Produk: ${bankProductName}\nDeskripsi Produk:\n${bankDesc}` }
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
      
      try {
        const parsed = JSON.parse(generatedText);
        let uspText = "\n\n=== HASIL ANALISIS SELLING POINT (AI) ===\n";
        if (parsed.usp && parsed.usp.length > 0) uspText += "⭐ USP: " + parsed.usp.join(", ") + "\n";
        if (parsed.target_market && parsed.target_market.length > 0) uspText += "🎯 Target Market: " + parsed.target_market.join(", ") + "\n";
        if (parsed.pain_points && parsed.pain_points.length > 0) uspText += "💥 Pain Points (Masalah): " + parsed.pain_points.join(", ") + "\n";
        if (parsed.solutions && parsed.solutions.length > 0) {
          uspText += "✅ Solusi: " + parsed.solutions.map(s => s.solusi).join(", ") + "\n";
        }
        if (parsed.emotional_hook && parsed.emotional_hook.length > 0) uspText += "🧠 Emotional Hook: " + parsed.emotional_hook.join(", ") + "\n";
        
        setBankDesc(prev => prev + uspText);
      } catch(err) {
        setBankDesc(prev => prev + "\n\n=== HASIL ANALISIS SELLING POINT (AI) ===\n" + generatedText);
      }
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
                const prod = affiliateProducts.find(p => String(p.id) === selectedId);
                if (prod) {
                  let parsed = {};
                  try { parsed = JSON.parse(prod.result); } catch(err){}
                  setThreadTitle(parsed.name || prod.product_desc || '');
                  setThreadDesc(parsed.desc || '');
                  setThreadLink(parsed.link || '');
                }
              }} className="select-input" style={{borderColor: 'var(--primary-color)', background: 'rgba(255,255,255,0.8)'}}>
                <option value="">-- Ketik manual atau Pilih produk di sini --</option>
                {affiliateProducts.map(p => (
                  <option key={p.id} value={p.id}>{parseRecord(p.result).name || p.product_desc}</option>
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
        <h2 className="desktop-title">Utas dari Berita/Artikel</h2>
        <p className="subtitle">Minta rekomendasi gaya dari isi artikel, atau pilih sendiri. AI menyusun hook dan alur utas dengan karakter yang Anda pilih.</p>
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <div className="input-group">
              <label>Link Berita / Artikel (Wajib)</label>
              <input type="text" className="api-key-input" placeholder="Masukkan URL berita (Contoh: https://kompas.com/...)" value={genThreadSource} onChange={(e) => setGenThreadSource(e.target.value)} />
              <button className="btn-secondary" onClick={requestRecommendation} disabled={!safeLink(genThreadSource) || !apiKey || isRecommending || isGeneratingGenThread}>
                {recommendationStatus === 'reading' ? 'Membaca artikel...' : recommendationStatus === 'analyzing' ? 'AI sedang memilih gaya...' : '✨ Rekomendasikan Gaya'}
              </button>
              <p className="help-text">AI membaca berita dan menyarankan gaya beserta alasannya. Anda tetap menentukan pilihan akhir.</p>
              <div aria-live="polite" aria-busy={isRecommending}>
                {recommendationError && <p role="alert" className="warning-text">{recommendationError}</p>}
                {articleStyleRecommendation && (
                  <section className="article-style-recommendation" aria-label="Rekomendasi gaya bahasa">
                    <span className="help-text">Rekomendasi AI</span>
                    <h3>{articleThreadStyles.find(style => style.id === articleStyleRecommendation.styleId)?.label}</h3>
                    <p>{articleStyleRecommendation.reason}</p>
                    <button className="btn-secondary" onClick={() => setGenThreadLanguageStyle(articleStyleRecommendation.styleId)} disabled={genThreadLanguageStyle === articleStyleRecommendation.styleId || isGeneratingGenThread}>
                      {genThreadLanguageStyle === articleStyleRecommendation.styleId ? 'Gaya ini dipakai' : 'Pakai gaya ini'}
                    </button>
                  </section>
                )}
              </div>
            </div>
            <div className="input-group">
              <label>Instruksi Utas (Opsional)</label>
              <textarea placeholder="Contoh: Fokus pada dampaknya bagi pekerja. Sorot bagian paling janggal dan tutup dengan pertanyaan yang memancing diskusi." value={genThreadInstruction} onChange={(e) => setGenThreadInstruction(e.target.value)} rows="3" />
            </div>
            <div className="input-group">
              <label htmlFor="article-thread-style">Gaya Bahasa (Diksi)</label>
              <select id="article-thread-style" className="select-input" value={genThreadLanguageStyle} onChange={(e) => setGenThreadLanguageStyle(e.target.value)} aria-describedby="article-thread-style-help">
                {articleThreadStyles.map(style => <option key={style.id} value={style.id}>{style.label}</option>)}
              </select>
              <p id="article-thread-style-help" className="help-text">{articleThreadStyles.find(style => style.id === genThreadLanguageStyle)?.description}</p>
            </div>
            <div className="input-group">
              <label htmlFor="article-thread-tone">Tema Emosi (Tone)</label>
              <select id="article-thread-tone" className="select-input" value={genThreadTone} onChange={(e) => setGenThreadTone(e.target.value)}>
                {articleThreadTones.map(tone => <option key={tone.id} value={tone.id}>{tone.label}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Jumlah Cuitan / Tweet (Panjang Utas)</label>
              <input type="number" min="2" max="20" className="api-key-input" value={genThreadLengthCount} onChange={(e) => setGenThreadLengthCount(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Sisipkan Produk Affiliate (Opsional)</label>
              <button className="btn-secondary" onClick={() => setIsSelectingGenThreadProduct(!isSelectingGenThreadProduct)} style={{width: '100%', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                {genThreadAffiliateProductName ? `✅ ${genThreadAffiliateProductName}` : '🛒 Pilih Produk Affiliate...'}
                <span>{isSelectingGenThreadProduct ? '▲' : '▼'}</span>
              </button>
            </div>
            
            <button className="btn-primary generate-btn" onClick={handleGenerateGenThread} disabled={!genThreadSource || isGeneratingGenThread || !apiKey || isSelectingGenThreadProduct || isRecommending}>
              {isGeneratingGenThread ? 'Membaca Artikel & Menyusun Utas...' : '✨ Generate Utas Berita'}
            </button>
            {!apiKey && <p className="warning-text">⚠️ Silakan masukkan API Key di menu API Settings terlebih dahulu.</p>}
          </div>
          <div className="glass-panel" style={{padding: '0', background: 'transparent', border: 'none', boxShadow: 'none'}}>
          {isSelectingGenThreadProduct ? (
            <div className="prompts-container fade-in" style={{background: 'rgba(255,255,255,0.02)', padding: '1.5rem'}}>
              <h3 style={{marginBottom: '0.5rem'}}>🛒 Pilih Produk Affiliate</h3>
              <p className="subtitle" style={{marginBottom: '1.5rem'}}>Pilih produk yang ingin disisipkan di cuitan terakhir utas ini.</p>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.8rem'}}>
                <button className="btn-secondary" style={{textAlign: 'left', borderColor: 'var(--border-color)', color: 'var(--text-secondary)'}} onClick={() => {
                  setGenThreadAffiliateProduct('');
                  setGenThreadAffiliateProductName('');
                  setGenThreadAffiliateProductObj(null);
                  setIsSelectingGenThreadProduct(false);
                }}>
                  ❌ Tidak perlu sisipkan produk (Kosongkan)
                </button>
                
                {bankStoryboardData.map(item => {
                  let parsed = {};
                  try { parsed = JSON.parse(item.result); } catch(e) {}
                  return (
                    <button key={item.id} className="btn-secondary" style={{textAlign: 'left', display: 'flex', gap: '1rem', alignItems: 'center'}} onClick={() => {
                      let parsed = {};
                      try { parsed = JSON.parse(item.result); } catch(e) {}
                      const productText = `Nama Produk: ${parsed.name || item.product_desc}\nDeskripsi: ${parsed.desc || ''}\nLink Pembelian: ${safeLink(parsed.link) || ''}`;
                      setGenThreadAffiliateProduct(productText);
                      setGenThreadAffiliateProductName(parsed.name || item.product_desc || 'Produk Tanpa Nama');
                      setGenThreadAffiliateProductObj(parsed);
                      setIsSelectingGenThreadProduct(false);
                    }}>
                      {parsed.imgUrl && (
                        <img src={parsed.imgUrl} alt={item.product_desc} style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}} />
                      )}
                      <div style={{flex: 1, overflow: 'hidden'}}>
                        <div style={{fontWeight: 'bold', color: 'var(--primary-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{parsed.name || item.product_desc || 'Produk Tanpa Nama'}</div>
                        <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{parsed.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : generatedGenThread ? (
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
                  {index === generatedGenThread.length - 1 && genThreadAffiliateProductObj?.imgUrl && (
                    <div style={{marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem'}}>
                      <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>Gambar Produk (Bisa disisipkan manual saat posting):</p>
                      <img src={genThreadAffiliateProductObj.imgUrl} alt="Produk Affiliate" style={{maxWidth: '200px', borderRadius: '8px', border: '1px solid var(--border-color)'}} />
                    </div>
                  )}
                </div>
              ))}
              <div style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                <button className="btn-secondary" onClick={() => saveToSupabase(generatedGenThread, 'Utas Bebas', genThreadTopic || genThreadSource)} disabled={isSaving} style={{flex: 1}}>
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

  const handleUploadImageBank = async () => {
    if (!uploadImgFile || !uploadImgName.trim() || isUploadingImg) return;
    setIsUploadingImg(true);
    try {
      const base64Data = await fileToBase64(uploadImgFile);
      
      const response = await fetch('/api/database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Bank Gambar',
          product_desc: uploadImgName,
          result: base64Data
        })
      });

      if (response.ok) {
        alert("Gambar berhasil di-upload ke Bank Gambar!");
        setUploadImgFile(null);
        setUploadImgName('');
        fetchImageBank();
      } else {
        alert("Gagal mengunggah gambar.");
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleCopyImage = async (base64) => {
    try {
      // Browsers generally only support image/png on the clipboard, not JPEG.
      const image = new Image();
      image.src = base64;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image, 0, 0);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Gambar tidak dapat dikonversi.');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert("Gambar berhasil disalin ke clipboard!");
    } catch (err) {
      alert("Gagal menyalin gambar. Browser Anda mungkin tidak mendukung fitur ini.");
      console.error(err);
    }
  };

  const renderImageBankForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">🖼️ Bank Gambar</h2>
        <p className="subtitle">Unggah dan simpan gambar-gambar untuk kebutuhan visual Anda.</p>
        
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <h3 style={{marginBottom: '1rem'}}>Upload Gambar Baru</h3>
            
            <div className="input-group">
              <label>Nama / Judul Gambar</label>
              <input 
                type="text" 
                placeholder="Contoh: Panci Merah Tampak Atas" 
                value={uploadImgName} 
                onChange={(e) => setUploadImgName(e.target.value)} 
                className="api-key-input"
              />
            </div>

            <div className="input-group">
              <label>Pilih File Gambar</label>
              <div className="image-upload-wrapper">
                {uploadImgFile ? (
                  <div className="image-preview" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'}}>
                    <img src={uploadImgPreview || undefined} alt="Preview" style={{width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px'}} />
                    <button className="btn-secondary" onClick={() => setUploadImgFile(null)}>Batal / Ganti</button>
                  </div>
                ) : (
                  <label className="upload-placeholder">
                    <input type="file" accept="image/*" onChange={(e) => setUploadImgFile(e.target.files[0])} hidden />
                    <span className="upload-icon">⬆️</span>
                    <span>Klik untuk pilih file gambar</span>
                    <small>PNG, JPG, WEBP (Ideal &lt; 2MB agar hemat database)</small>
                  </label>
                )}
              </div>
            </div>

            <button className="btn-primary generate-btn" onClick={handleUploadImageBank} disabled={!uploadImgFile || !uploadImgName.trim() || isUploadingImg}>
              {isUploadingImg ? 'Mengunggah...' : '📤 Upload ke Bank Gambar'}
            </button>
          </div>

          <div className="glass-panel" style={{display: 'flex', flexDirection: 'column'}}>
            <h3 style={{marginBottom: '1rem'}}>Koleksi Gambar Saya</h3>
            {isImageBankLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Memuat galeri...</p>
              </div>
            ) : imageBankData.length > 0 ? (
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem'}}>
                {imageBankData.map(item => (
                  <div key={item.id} style={{background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)'}}>
                    <img src={item.result} alt={item.product_desc} style={{width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem'}} />
                    <span style={{fontSize: '0.8rem', textAlign: 'center', marginBottom: '0.5rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}}>{item.product_desc}</span>
                    <button className="btn-secondary" onClick={() => handleCopyImage(item.result)} style={{padding: '0.3rem 0.6rem', fontSize: '0.75rem', width: '100%'}}>📋 Copy</button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyStateRight />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBankStoryboardForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel" style={{position: 'relative'}}>
        
        {/* Modal Detail Produk */}
        {selectedProductDetail && (
          <Modal label="Detail produk" onClose={() => setSelectedProductDetail(null)}>
            <div className="glass-panel product-detail fade-in" style={{
              width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto',
              background: '#fff', borderRadius: '16px', padding: '0',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column'
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{width: '100%', height: '250px', background: '#f1f5f9', position: 'relative', flexShrink: 0}}>
                {selectedProductDetail.parsed.imgUrl ? (
                  <img src={selectedProductDetail.parsed.imgUrl} alt={selectedProductDetail.item.product_desc} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                ) : (
                  <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '4rem'}}>📦</div>
                )}
                <button aria-label="Tutup detail produk" onClick={() => setSelectedProductDetail(null)} style={{position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✖</button>
              </div>
              <div style={{padding: '2rem', flex: 1}}>
                <span style={{display: 'inline-block', background: '#e0e7ff', color: '#4f46e5', padding: '0.3rem 0.8rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem'}}>{selectedProductDetail.item.product_desc || 'Kategori'}</span>
                <h2 style={{margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1.5rem', fontWeight: '800', lineHeight: '1.3'}}>{selectedProductDetail.parsed.name || 'Produk Tanpa Nama'}</h2>
                
                <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto'}}>
                  <h4 style={{marginTop: 0, marginBottom: '0.5rem', color: '#334155'}}>Data & Selling Point:</h4>
                  <pre style={{fontSize: '0.9rem', color: '#475569', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'inherit', margin: 0}}>
                    {selectedProductDetail.parsed.desc}
                  </pre>
                </div>

                {selectedProductDetail.parsed.link && (
                  <a href={safeLink(selectedProductDetail.parsed.link)} target="_blank" rel="noreferrer" style={{display: 'inline-block', background: '#ee4d2d', color: 'white', textDecoration: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.95rem'}}>
                    🛒 Beli di Shopee
                  </a>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Modal Pop-up */}
        {isAddProductModalOpen && (
          <Modal label={editingBankId ? 'Edit produk' : 'Tambah produk'} onClose={() => setIsAddProductModalOpen(false)} busy={isSaving || isGeneratingSelling}>
            <fieldset disabled={isSaving} className="glass-panel input-section fade-in" style={{
              width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
              background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}>
              <div className="dialog-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                <h3 style={{color: 'var(--primary-color)', margin: 0}}>{editingBankId ? 'Edit Produk' : 'Tambah Aset Baru'}</h3>
                <button aria-label="Tutup form produk" disabled={isSaving || isGeneratingSelling} onClick={() => {
                  setIsAddProductModalOpen(false);
                  setEditingBankId(null);
                  setBankProductName(''); setBankDesc(''); setBankImgUrl(''); setBankModelImgUrl(''); setBankCategory(''); setBankProductLink('');
                }} style={{background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b'}}>✖</button>
              </div>

              <div className="input-group">
                <label htmlFor="bank-product-name">Nama Produk</label>
                <input id="bank-product-name" type="text" className="api-key-input" style={{color: '#1a1a2e'}} placeholder="Contoh: Wajan Granit Anti Lengket 24cm" value={bankProductName} onChange={(e) => setBankProductName(e.target.value)} />
              </div>
              <div className="input-group">
                <label htmlFor="bank-description">Data & Selling Point Produk Lengkap (Bisa Copy-Paste dari ChatGPT)</label>
                <textarea id="bank-description"
                  placeholder="Paste hasil Selling Point dari ChatGPT di sini, atau jelaskan produk secara manual..." 
                  value={bankDesc} 
                  onChange={(e) => setBankDesc(e.target.value)}
                  rows="6"
                  style={{fontFamily: 'monospace', fontSize: '0.9rem'}}
                />
                <button 
                  className="btn-primary" 
                  style={{marginTop: '0.5rem', background: 'var(--active-gradient)', border: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem'}}
                  onClick={handleGenerateBankUSP}
                  disabled={!bankProductName || !bankDesc || isGeneratingSelling || !apiKey}
                >
                  {isGeneratingSelling ? 'Menyusun USP...' : '✨ Generate Selling Point (Otomatis)'}
                </button>
                {!apiKey && <small style={{display: 'block', color: '#ef4444', marginTop: '0.3rem'}}>API Key diperlukan untuk fitur ini.</small>}
              </div>
              <div className="input-group">
                <label>Link Gambar Produk (Opsional)</label>
                <textarea className="api-key-input" placeholder={`https://cf.shopee.co.id/file/...`} value={bankImgUrl} onChange={(e) => setBankImgUrl(e.target.value)} rows="2" />
              </div>
              <div className="input-group">
                <label>Link Gambar Model (Opsional)</label>
                <textarea className="api-key-input" placeholder={`https://...`} value={bankModelImgUrl} onChange={(e) => setBankModelImgUrl(e.target.value)} rows="2" />
              </div>
              <div className="input-group">
                <label>Link Shopee / Tautan Produk (Opsional)</label>
                <input type="text" className="api-key-input" placeholder={`https://shope.ee/...`} value={bankProductLink} onChange={(e) => setBankProductLink(e.target.value)} />
              </div>
              <div className="input-group">
                <label htmlFor="bank-category">Kategori Produk</label>
                <div style={{position: 'relative'}}>
                  <input 
                    type="text" 
                    className="api-key-input" 
                    id="bank-category"
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
              </div>
              <button className="btn-primary generate-btn dialog-save" onClick={handleSaveBank} disabled={!bankCategory || !bankProductName || isSaving} style={{width: '100%', marginTop: '1rem'}}>
                {isSaving ? 'Menyimpan...' : (editingBankId ? '💾 Simpan Perubahan' : '💾 Simpan ke Bank')}
              </button>
            </fieldset>
          </Modal>
        )}

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem'}}>
          <div>
            <h2 className="desktop-title">🗃️ Data Produk</h2>
            <p className="subtitle">Simpan data dan foto produk Anda di sini untuk mempermudah pembuatan konten.</p>
          </div>
          <button className="btn-primary" onClick={openNewProduct} style={{padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
            <span style={{fontSize: '1.2rem'}}>+</span> Tambah Produk
          </button>
        </div>

        <div className="glass-panel" style={{padding: '1.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
            <h3 style={{margin: 0, color: '#1e293b'}}>Aset Tersimpan ({filteredBankData.length})</h3>
            <div className="product-search" style={{display: 'flex', gap: '0.5rem'}}>
              <input
                type="search"
                aria-label="Cari produk tersimpan"
                placeholder="Cari aset..." 
                className="api-key-input"
                style={{padding: '0.4rem 0.8rem', width: '200px', margin: 0}}
                value={bankSearchQuery}
                onChange={(e) => setBankSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem'}}>
            <button 
              className={`pill-btn ${activeBankCategory === 'Semua' ? 'active' : ''}`}
              onClick={() => setActiveBankCategory('Semua')}
            >
              Semua
            </button>
            {[...new Set(bankStoryboardData.map(item => item.product_desc))].map((cat, idx) => {
              const count = bankStoryboardData.filter(i => i.product_desc === cat).length;
              return (
                <button 
                  key={idx}
                  className={`pill-btn ${activeBankCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveBankCategory(cat)}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {isBankStoryboardLoading ? (
            <div style={{textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)'}}>
              <div className="spinner" style={{margin: '0 auto 1rem auto'}}></div>
              Memuat data...
            </div>
          ) : filteredBankData.length === 0 ? (
            <div style={{textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)'}}>
              Belum ada aset tersimpan.
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
              {Object.keys(groupedBankData).map(categoryName => (
                <div key={categoryName} className="category-folder fade-in" style={{
                  background: 'transparent'
                }}>
                  <div style={{
                    padding: '0 0 1rem 0', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    borderBottom: '2px solid #f1f5f9',
                    marginBottom: '1rem'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      <h4 style={{margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 'bold'}}>
                        {categoryName}
                      </h4>
                      <span style={{fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '10px'}}>
                        {groupedBankData[categoryName].length} aset
                      </span>
                    </div>
                    {activeBankCategory === 'Semua' && (
                      <button 
                        onClick={() => setActiveBankCategory(categoryName)}
                        style={{background: 'transparent', border: 'none', color: '#0ea5e9', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer', transition: 'color 0.2s'}}
                      >
                        Lihat Semua &rarr;
                      </button>
                    )}
                  </div>
                  <div className={`horizontal-scroll-container ${activeBankCategory === 'Semua' ? 'products-row-view' : 'products-grid-view'}`}>
                    {groupedBankData[categoryName].map(item => {
                      let parsed = {};
                      try { parsed = JSON.parse(item.result); } catch(e) {}
                      return (
                        <div key={item.id} className="fade-in product-card" style={{
                          display: 'flex', flexDirection: 'column', 
                          background: '#fff', borderRadius: '16px', 
                          border: '1px solid #e2e8f0',
                          overflow: 'hidden',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          position: 'relative',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                        }}
                        onClick={() => setSelectedProductDetail({item, parsed})}
                        >
                          {parsed.imgUrl ? (
                            <div style={{width: '100%', height: '180px', background: '#f1f5f9'}}>
                              <img src={parsed.imgUrl} alt={item.product_desc} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                            </div>
                          ) : (
                            <div style={{width: '100%', height: '180px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8'}}>
                              <span style={{fontSize: '3rem'}}>📦</span>
                            </div>
                          )}
                          <div style={{padding: '1.2rem', flex: 1, display: 'flex', flexDirection: 'column'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                              <h4 style={{margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#1e293b', fontWeight: '800', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3', paddingRight: '0.5rem'}}>{parsed.name || 'Produk Tanpa Nama'}</h4>
                            </div>
                            <span style={{display: 'inline-block', background: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600', marginBottom: '0.8rem', width: 'fit-content'}}>{item.product_desc || 'Kategori'}</span>
                            <p style={{fontSize: '0.85rem', color: '#64748b', margin: '0 0 1rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{parsed.desc}</p>
                            
                            <div style={{marginTop: 'auto', display: 'flex', gap: '0.5rem'}}>
                              <button onClick={(e) => { e.stopPropagation(); handleEditBank(item); }} style={{flex: 1, background: '#f8fafc', color: '#3b82f6', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'}}>
                                ✏️ Edit
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); handleDeleteBank(item.id); }} style={{flex: 1, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'}}>
                                🗑️ Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );


  const renderDatabase = () => {
    let filteredHistory = [];
    if (activeDatabaseCategory === 'Storyboard') {
      filteredHistory = history.filter(item => ['Storyboard', 'Konten Masak', 'Bang Jenggot', 'UGC', 'UGC Style', 'UGC Style (Voice Over)', 'Video Script AI'].includes(item.type));
    } else if (activeDatabaseCategory === 'Threads Affiliate') {
      filteredHistory = history.filter(item => item.type === 'Utas Affiliate');
    } else if (activeDatabaseCategory === 'Threads Umum') {
      filteredHistory = history.filter(item => item.type === 'Utas Bebas');
    }

    if (selectedHistoryItem) {
      const parts = historyParts(selectedHistoryItem.result);
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
                            <div className="action-row" style={{display: 'flex', gap: '0.5rem'}}>
                              <a href={safeLink(imageUrl)} target="_blank" rel="noreferrer" className="btn-secondary" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', fontSize: '0.8rem', padding: '0.4rem 0.8rem'}}>
                                🔍 Buka Resolusi Penuh
                              </a>
                              <button className="btn-secondary" onClick={() => handleRemoveImageFromPart(index, parts)} style={{color: '#ef4444', borderColor: '#ef4444', fontSize: '0.8rem', padding: '0.4rem 0.8rem'}}>
                                🗑️ Hapus Gambar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="action-row" style={{display: 'flex', gap: '0.5rem'}}>
                            <input
                              type="url"
                              aria-label={`URL gambar bagian ${index + 1}`}
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
                <div key={item.id} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedHistoryItem(item); } }} className="glass-panel hover-card" style={{padding: '1.2rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--glass-border)'}} onClick={() => setSelectedHistoryItem(item)}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center'}}>
                    <span style={{background: 'var(--primary-color)', color: 'white', padding: '0.3rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold'}}>{item.type}</span>
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
    setApiKey(e.target.value.trim());
    if (!writeStorage('storyboard_api_key', e.target.value.trim())) alert('Browser memblokir penyimpanan. API Key hanya tersedia selama halaman ini terbuka.');
  };

  const handleGeminiKeyChange = (index, value) => {
    const newKeys = [...geminiKeys];
    newKeys[index] = value;
    setGeminiKeys(newKeys);
    if (!writeStorage('gemini_api_keys', JSON.stringify(newKeys))) alert('Browser memblokir penyimpanan kunci API.');
  };

  const handleTiktokScrape = async () => {
    if (!tiktokUrl) return;
    setIsTiktokLoading(true);
    setTiktokError(null);
    setTiktokResult(null);

    try {
      const response = await fetch('/api/scrape-tiktok', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: tiktokUrl })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengambil data dari TikTok');
      }
      
      setTiktokResult(data);
    } catch (error) {
      setTiktokError(error.message);
    } finally {
      setIsTiktokLoading(false);
    }
  };

  const renderTiktokScraperForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">Tiktok Scraper</h2>
        <p className="subtitle">Ambil judul dan deskripsi dari link TikTok dengan mudah.</p>
        
        <div className="layout-grid">
          <div className="glass-panel" style={{gridColumn: '1 / -1'}}>
            <div className="input-group">
              <label htmlFor="tiktok-url">Link TikTok</label>
              <div className="action-row" style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <input id="tiktok-url"
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="Masukkan URL TikTok (contoh: https://vt.tiktok.com/...)"
                  style={{flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', color: 'white'}}
                />
                <button 
                  className="btn-primary" 
                  onClick={handleTiktokScrape}
                  disabled={isTiktokLoading || !tiktokUrl}
                  style={{minWidth: '120px'}}
                >
                  {isTiktokLoading ? 'Loading...' : 'Scrape'}
                </button>
              </div>
            </div>
            
            {tiktokError && (
              <div className="error-message" style={{marginTop: '1rem', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)'}}>
                {tiktokError}
              </div>
            )}

            {tiktokResult && (
              <div className="result-container fade-in" style={{marginTop: '2rem'}}>
                <h3 style={{marginBottom: '1rem', color: 'var(--primary-color)'}}>Hasil Scrape:</h3>
                
                <div style={{background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Judul / Deskripsi:</label>
                    <div style={{background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap'}}>
                      {tiktokResult.title}
                    </div>
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Author:</label>
                    <div style={{background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem'}}>
                      {tiktokResult.author_name}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="content-wrapper fade-in"><div className="content-panel">
      <h2 className="desktop-title">Pengaturan API</h2>
      <p className="subtitle">Hubungkan layanan AI pilihan Anda dengan workspace. Kunci tersimpan otomatis di browser ini.</p>
      <div className="settings-grid">
        <div className="glass-panel"><div className="settings-card-heading"><span className="icon-tile indigo"><Icon name="spark" /></span><div><h3>1inference</h3><p>Asisten utama untuk proses kreatif Anda</p></div></div>
          <div className="input-group"><label htmlFor="primary-api-key">1inference API Key</label><input id="primary-api-key" type="password" value={apiKey} onChange={handleKeyChange} placeholder="Masukkan API Key 1inference Anda..." autoComplete="off" spellCheck={false} /><small className="help-text">Digunakan untuk storyboard, threads, gambar, dan text to speech.</small></div>
          <p className="settings-note">Kunci yang terisi belum tentu aktif. Validitas dan saldo akan diperiksa oleh provider saat Anda membuat konten.</p>
        </div>
        <div className="glass-panel"><div className="settings-card-heading"><span className="icon-tile teal"><Icon name="shield" /></span><div><h3>Privasi kunci Anda</h3><p>Gunakan hanya pada perangkat pribadi</p></div></div><p className="help-text">API Key disimpan di localStorage browser, bukan di database. Pengguna perangkat ini dan ekstensi browser yang memiliki izin dapat mengaksesnya. Hapus kunci sebelum memakai perangkat bersama.</p><button className="btn-secondary" style={{marginTop: 20}} onClick={() => { setApiKey(''); setGeminiKeys(Array(10).fill('')); writeStorage('storyboard_api_key', ''); writeStorage('gemini_api_keys', '[]'); alert('Kunci API di browser ini telah dihapus.'); }}>Hapus semua kunci tersimpan</button></div>
        <div className="glass-panel"><div className="settings-card-heading"><span className="icon-tile violet"><Icon name="film" /></span><div><h3>Google Gemini</h3><p>Analisis gambar dan video untuk Script Video AI</p></div></div>
          <div className="input-group"><label htmlFor="gemini-key-0">Gemini API Key utama</label><input id="gemini-key-0" type="password" value={geminiKeys[0]} onChange={e => handleGeminiKeyChange(0, e.target.value)} autoComplete="off" placeholder="Masukkan Gemini API Key..." spellCheck={false} /></div>
          <details className="settings-details" style={{marginTop: 20}}><summary>Kunci cadangan (opsional)</summary><div className="gemini-key-list">{geminiKeys.slice(1).map((key, i) => <div className="input-group" key={i}><label htmlFor={`gemini-key-${i + 1}`}>Kunci cadangan {i + 1}</label><input id={`gemini-key-${i + 1}`} type="password" value={key} onChange={e => handleGeminiKeyChange(i + 1, e.target.value)} autoComplete="off" spellCheck={false} /></div>)}</div></details>
          <p className="settings-note">File referensi dikirim langsung ke Google. Ketersediaan model dan batas penggunaan mengikuti akun provider Anda.</p>
        </div>
      </div>
    </div></div>
  );

  const handleGenerateTts = async () => {
    if (!ttsInputText || !apiKey) return;
    setIsGeneratingTts(true);
    setGeneratedAudioUrl(null);
    try {
      const finalInputText = ttsInputText;
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: ttsModel,
          input: finalInputText,
          voice: ttsVoice,
          response_format: 'mp3',
          speed: parseFloat(ttsSpeed)
        })
      });

      if (!response.ok) {
        const errObj = await response.json().catch(() => ({}));
        throw new Error(errObj.error || 'Gagal generate audio TTS');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setGeneratedAudioUrl(url);
    } catch (e) {
      let errorMsg = e.message;
      if (errorMsg.includes('no_healthy_sellers')) {
        errorMsg = "Mohon maaf, model AI yang Anda pilih saat ini sedang tidak tersedia atau sibuk di server pusat (no_healthy_sellers). Silakan coba model lain seperti Kokoro atau Qwen 3.";
      } else {
        // Try to parse the nested JSON error message if possible
        try {
          const parsedStr = typeof errorMsg === 'string' ? JSON.parse(errorMsg) : null;
          if (parsedStr && parsedStr.detail && parsedStr.detail.error && parsedStr.detail.error.message) {
            errorMsg = parsedStr.detail.error.message;
          }
        } catch(err) {}
      }
      alert("Gagal memproses suara:\n" + errorMsg);
    } finally {
      setIsGeneratingTts(false);
    }
  };

  const renderTtsForm = () => (
    <div className="content-wrapper fade-in">
      <div className="content-panel">
        <h2 className="desktop-title">🗣️ Text to Speech</h2>
        <p className="subtitle">Ubah naskah / skrip Anda menjadi suara (audio) menggunakan AI.</p>
        
        <div className="layout-grid">
          <div className="glass-panel input-section">
            <h3 style={{marginBottom: '1rem'}}>Pengaturan Suara</h3>
            
            <div className="input-group">
              <label>Model AI</label>
              <select className="select-input" value={ttsModel} onChange={(e) => {
                setTtsModel(e.target.value);
                if (e.target.value === 'venice-kokoro-tts') setTtsVoice('af_sky');
                if (e.target.value === 'venice-qwen-tts') setTtsVoice('Vivian');
                if (e.target.value === 'tts-minimax-speech-02-hd') setTtsVoice('WiseWoman');
              }}>
                <option value="venice-kokoro-tts">Kokoro (venice-kokoro-tts)</option>
                <option value="venice-qwen-tts">Qwen 3 (venice-qwen-tts)</option>
                <option value="tts-minimax-speech-02-hd">MiniMax (tts-minimax-speech-02-hd)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Karakter Suara (Voice)</label>
              <select className="select-input" value={ttsVoice} onChange={(e) => setTtsVoice(e.target.value)}>
                {ttsModel === 'venice-kokoro-tts' && (
                  <>
                    <option value="af_sky">af_sky (Female)</option>
                    <option value="af_bella">af_bella (Female)</option>
                    <option value="am_adam">am_adam (Male)</option>
                    <option value="af_nova">af_nova (Female)</option>
                    <option value="am_onyx">am_onyx (Male)</option>
                    <option value="am_puck">am_puck (Male)</option>
                    <option value="bf_alice">bf_alice (Female)</option>
                    <option value="bf_emma">bf_emma (Female)</option>
                  </>
                )}
                {ttsModel === 'venice-qwen-tts' && (
                  <>
                    <option value="Vivian">Vivian (Female)</option>
                    <option value="Serena">Serena (Female)</option>
                    <option value="Ono_Anna">Ono_Anna (Female)</option>
                    <option value="Sohee">Sohee (Female)</option>
                    <option value="Uncle_Fu">Uncle_Fu (Male)</option>
                    <option value="Dylan">Dylan (Male)</option>
                    <option value="Eric">Eric (Male)</option>
                    <option value="Ryan">Ryan (Male)</option>
                    <option value="Aiden">Aiden (Male)</option>
                  </>
                )}
                {ttsModel === 'tts-minimax-speech-02-hd' && (
                  <>
                    <option value="WiseWoman">WiseWoman</option>
                    <option value="FriendlyPerson">FriendlyPerson</option>
                    <option value="DeepVoiceMan">DeepVoiceMan</option>
                    <option value="CasualGuy">CasualGuy</option>
                    <option value="PatientMan">PatientMan</option>
                  </>
                )}
              </select>
            </div>

            <div className="input-group">
              <label>Kecepatan Suara ({ttsSpeed}x)</label>
              <input type="range" min="0.25" max="4.0" step="0.25" value={ttsSpeed} onChange={(e) => setTtsSpeed(e.target.value)} style={{width: '100%', accentColor: 'var(--primary-color)'}} />
            </div>

            <p className="help-text">Karakter dan tempo mengikuti pilihan suara. Hanya naskah yang dikirim untuk dibacakan, tanpa instruksi tambahan di awal audio.</p>

            <div className="input-group">
              <label>Teks / Skrip (Max 4096 karakter)</label>
              <textarea 
                placeholder="Masukkan teks yang ingin diubah menjadi suara..." 
                value={ttsInputText} 
                onChange={(e) => setTtsInputText(e.target.value)} 
                rows="6"
                maxLength="4096"
              />
              <small style={{display: 'block', textAlign: 'right', marginTop: '0.3rem', color: 'var(--text-secondary)'}}>
                {ttsInputText.length}/4096
              </small>
            </div>

            <button className="btn-primary generate-btn" onClick={handleGenerateTts} disabled={!ttsInputText || isGeneratingTts || !apiKey}>
              {isGeneratingTts ? 'Memproses Audio...' : '🔊 Generate Suara'}
            </button>
            {!apiKey && <p className="warning-text">⚠️ Silakan masukkan API Key di menu API Settings terlebih dahulu.</p>}
          </div>

          <div className="glass-panel" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px'}}>
            {isGeneratingTts ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>AI sedang mensintesis suara Anda...</p>
              </div>
            ) : generatedAudioUrl ? (
              <div style={{width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem'}}>
                <h3 style={{color: 'var(--primary-color)'}}>✨ Audio Berhasil Dibuat!</h3>
                <audio controls src={generatedAudioUrl} style={{width: '100%'}} />
                
                <a 
                  href={generatedAudioUrl} 
                  download={`TTS_${ttsModel}_${ttsVoice}_${new Date().getTime()}.mp3`}
                  className="btn-primary" 
                  style={{textDecoration: 'none', textAlign: 'center', width: '100%'}}
                >
                  ⬇️ Download MP3
                </a>
              </div>
            ) : (
              <EmptyStateRight />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      <a className="skip-link" href="#workspace-main">Lewati ke konten</a>
      <Sidebar activeTab={activeTab} onNavigate={navigate} open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} apiReady={Boolean(apiKey.trim())} />
      <div className="workspace-body" inert={isMobileMenuOpen ? '' : undefined}>
      <header className="workspace-header"><div className="breadcrumb"><button className="menu-toggle icon-button" onClick={() => setIsMobileMenuOpen(true)} aria-label="Buka navigasi" aria-expanded={isMobileMenuOpen} aria-controls="workspace-navigation"><Icon name="menu" /></button><span>Workspace</span><span className="breadcrumb-divider">/</span><strong>{pageTitle(activeTab)}</strong></div><div className="header-actions"><button className="header-api-status" onClick={() => navigate('settings')}><span className={`status-dot ${apiKey.trim() ? 'ready' : ''}`} />{apiKey.trim() ? 'API Key tersimpan' : 'Atur API Key'}</button><button className="profile-avatar profile-button" aria-label="Buka pengaturan API" onClick={() => navigate('settings')}>C</button></div></header>
      <main className="main-content" id="workspace-main" ref={mainRef} tabIndex={-1}>
        {activeTab !== 'settings' && Object.keys(loadErrors).length > 0 && <div className="load-error" role="alert"><div><strong>Data belum dapat dimuat</strong><p>{[...new Set(Object.values(loadErrors))].join(' ')}</p></div><button className="btn-secondary" onClick={() => { fetchHistory(); fetchBankStoryboard(); fetchProducts(); fetchImageBank(); }}><Icon name="refresh" size={16} />Coba lagi</button></div>}
        {activeTab === 'dashboard' && <Dashboard history={history} products={bankStoryboardData} images={imageBankData} loading={isHistoryLoading || isBankStoryboardLoading || isImageBankLoading} apiReady={Boolean(apiKey.trim())} onNavigate={navigate} onOpenHistory={openHistory} onAddProduct={openNewProduct} />}
        {activeTab === 'storyboard' && renderStoryboardForm()}
        {activeTab === 'cooking_content' && renderCookingContentForm()}
        {activeTab === 'ugc' && renderUgcForm()}
        {activeTab === 'image_gen' && renderImageGenForm()}
        {activeTab === 'bank_gambar' && renderImageBankForm()}
        {activeTab === 'tts' && renderTtsForm()}
        {activeTab === 'tiktok' && renderTiktokScraperForm()}
        {activeTab === 'bang_jenggot' && renderBangJenggotForm()}
        {activeTab === 'bank_storyboard' && renderBankStoryboardForm()}

        {activeTab === 'video_script' && renderVideoScriptForm()}
        {activeTab === 'thread' && renderThreadForm()}
        {activeTab === 'gen_thread' && renderGenThreadForm()}
        {activeTab === 'history' && renderDatabase()}

        {activeTab === 'settings' && renderSettings()}
      </main>
      <MobileNav activeTab={activeTab} onNavigate={navigate} />
      </div>
      {notice && createPortal(<div className="toast" role="status"><Icon name="spark" size={20} /><p>{notice}</p><button className="icon-button" onClick={() => setNotice('')} aria-label="Tutup pemberitahuan"><Icon name="close" size={18} /></button></div>, document.body)}
    </div>
  )
}

export default App
