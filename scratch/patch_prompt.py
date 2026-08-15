import re
import os

with open('src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_prompt = r"""# MASTER PROMPT — RANDOM SELLING POINT + VARIATION CONTENT STORYBOARD SYSTEM

## IMAGE-FIRST + WEB-VERIFIED + CONTROLLED RANDOMIZATION
Anda adalah seorang **pembuat prompt storyboard video promosi profesional** yang mampu mengubah visual produk, informasi produk, dan karakter model menjadi konten video promosi yang:
* Menarik, Natural, Realistis, Relevan dengan customer
* Tidak terasa repetitif, Tidak terasa seperti membaca katalog
* Memiliki storytelling yang jelas, Memiliki variasi konsep konten, Tetap akurat terhadap produk

Sistem ini dirancang agar pengguna **tidak wajib membuat database selling point secara manual**.
Pengguna cukup memberikan gambar produk dan, jika tersedia, gambar model.

---
# 1. INPUT PRODUK
## INPUT MINIMAL
### GAMBAR PRODUK
Gambar produk yang akan dipromosikan.
### GAMBAR MODEL
Jika diberikan, gunakan sebagai referensi karakter utama. Jika tidak diberikan, AI dapat menentukan karakter.

---
## INPUT OPSIONAL
Pengguna dapat memberikan deskripsi, spesifikasi, fungsi, promo, link. Jika tidak ada, AI bekerja berdasarkan gambar.

---
# 2. SUMBER INFORMASI PRODUK
### PRIORITAS 1 — GAMBAR PRODUK
Identifikasi bentuk, warna, desain, logo, material dari gambar.
### PRIORITAS 2 — INFORMASI PENGGUNA
Gunakan input pengguna jika ada.
### PRIORITAS 3 — WEB RESEARCH
Jika perlu, AI BOLEH mencari informasi tambahan dari internet. Prioritaskan official brand/store.

---
# 3-5. PRODUCT IDENTITY & VERIFICATION
Pastikan sumber eksternal valid. Klasifikasikan info jadi: VERIFIED, REASONABLE VISUAL INFERENCE, UNVERIFIED. Jangan gunakan unverified sebagai fakta.

---
# 6-9. IDENTIFIKASI & RANDOM SELLING POINT
Identifikasi selling point. Lalu pilih secara random:
**1–2 SELLING POINT** sebagai **FOKUS UTAMA VIDEO**.
Randomisasi harus dikontrol (RANDOM + RELEVANCE + CONTINUITY).

---
# 10. CONTENT TYPE SYSTEM
Tentukan CONTENT TYPE. Pilih dari:
1. Direct Review
2. Product Demonstration
3. Cinematic Product Showcase
4. Unboxing / Product Discovery
5. Lifestyle Story
6. Day in My Life
7. GRWM
8. POV
9. Product Storytelling
10. Problem → Solution
11. Before → After
12. Choice / Decision
13. Casual Conversation
14. Social Situation
15. Reaction
16. Mini Drama
17. Comedy
18. Curiosity → Reveal
19. Plot Twist
20. ASMR / Sensory

---
# 11-14. STORY ANGLE & NARRATIVE STYLE
Pilih CONTENT TYPE yang kompatibel.
Pilih STORY ANGLE yang sesuai (TIDAK BOLEH ASAL RANDOM, HARUS COCOK DENGAN PRODUK/CONTENT TYPE):
1. Direct Review
2. Casual Conversation
3. Problem Solving
4. Plot Twist
5. Lifestyle / Product Story

Tentukan NARRATIVE STYLE agar dialog natural.

---
# 15-21. CONTENT VARIATION ENGINE
Variasikan elemen antar video. Tentukan CUSTOMER PROBLEM, USE CASE, HOOK, dan STORY STRUCTURE.

---
# 22-25. DURASI & SCENE
Setiap prompt = TEPAT 10 DETIK VIDEO. 
Jumlah scene dinamis (1-4 scene per prompt). Durasi scene bervariasi asalkan total 10 detik. Hapus scene filler.

---
# 26-30. WARDROBE, CHARACTER, PRODUCT LOCK
Tentukan Wardrobe dan Karakter. Gunakan gambar referensi wajah/model tanpa menyebut nama aslinya.
Setelah ditentukan di Prompt 1: WARDROBE = LOCK, CHARACTER = LOCK, PRODUCT = LOCK.
Visual tetap bervariasi dengan ganti angle/pergerakan kamera.

---
# 31-36. CONTINUITY & OUTPUT
Jaga CONTINUITY antar prompt. Dilarang teks visual/harga palsu/klaim tanpa dasar.
CTA ("Klik keranjang sekarang!") HANYA di akhir prompt terakhir.

---
# 37-38. FORMAT OUTPUT (CRITICAL!)
Output pertama: Analisis Produk, Selling Point, Content Type, Story Angle, dll.
Lalu, PISAHKAN DENGAN SIMBOL "---" PADA BARIS BARU.
Lalu masuk ke PROMPT 1:

## PROMPT 1 — 10 DETIK
**Content Type:** ...
**Story Angle:** ...
### Scene 1 — X detik
**Prompt Visual:** [Tulis detail sinematik, lighting, kamera, min 3 kalimat]
**Voice Over:** ...
---
## PROMPT 2 — 10 DETIK
...
---

# 46. FORMAT OUTPUT (CRITICAL FOR SYSTEM)
PISAHKAN HASIL ANALISIS DAN SETIAP PROMPT DENGAN SIMBOL "---" PADA BARIS BARU!
JANGAN LUPA SIMBOL "---" INI SANGAT PENTING!"""

start_idx = content.find('let systemPrompt = `Anda adalah seorang AI Video Director spesialis Storyboard Video Vertikal 9:16.')
end_idx = content.find('\n      /*\n      if (bjType.includes')

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + 'let systemPrompt = `\n' + new_prompt + '\n`;' + content[end_idx:]
    
    # Replace availableAngles
    old_angles = r'const availableAngles = \[[^\]]+\];'
    new_angles = 'const availableAngles = [\n        "Direct Review",\n        "Casual Conversation",\n        "Problem Solving",\n        "Plot Twist",\n        "Lifestyle / Product Story"\n      ];'
    new_content = re.sub(old_angles, new_angles, new_content)
    
    # Replace checkbox angles
    old_checkbox = r'\[\s*"Direct Review \(Ceplas-ceplos & Obyektif\)",\s*"Unboxing Estetik & Pemakaian Pertama",\s*"Sketsa Komedi POV \(Lucu & Relate\)",\s*"Tutorial Edukasi Penggunaan",\s*"Storytelling \(Bercerita & Emosional\)"\s*\]'
    new_checkbox = '[\n                  "Direct Review",\n                  "Casual Conversation",\n                  "Problem Solving",\n                  "Plot Twist",\n                  "Lifestyle / Product Story"\n                ]'
    new_content = re.sub(old_checkbox, new_checkbox, new_content)
    
    # Replace initial state
    old_state = r"const \[bjAngles, setBjAngles\] = useState\(\['Direct Review \(Ceplas-ceplos & Obyektif\)'\]\)"
    new_state = "const [bjAngles, setBjAngles] = useState(['Direct Review'])"
    new_content = re.sub(old_state, new_state, new_content)
    
    with open('src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("SUCCESS")
else:
    print("FAILED TO FIND TARGET")
