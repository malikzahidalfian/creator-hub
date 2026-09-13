# Creator Hub AI

Workspace React untuk storyboard, produk, threads, gambar, dan audio. Dashboard menggunakan data tersimpan.

## Akses workspace

Aplikasi langsung membuka dashboard tanpa login atau password, baik di komputer lokal maupun Vercel. Siapa pun yang dapat mengakses URL dapat membaca, menambah, mengubah, dan menghapus data workspace yang sama.

APP_PASSWORD, SESSION_SECRET, AUTH_STORE, AUTH_FILE, dan tabel workspace_credentials tidak lagi diperlukan. Nilai environment dan penyimpanan kredensial lama boleh tetap ada, tetapi tidak digunakan. Perubahan ini tidak menghapus tabel/data konten prompts.

Menu ganti password dan logout sudah dihapus. Pengaturan API tersedia di sidebar, tombol profil atas, dan tombol API pada navigasi bawah HP. API key provider disimpan di browser masing-masing; mengakses link dari perangkat lain tidak membagikan key tersebut.

## Menjalankan lokal

1. Gunakan Node.js 22.12+ (atau Node 24 LTS).
2. Jalankan npm install.
3. Salin .env.example menjadi .env.local dan isi SUPABASE_URL serta SUPABASE_SERVICE_ROLE_KEY untuk fitur penyimpanan. Key Supabase harus server-only (service_role/secret), bukan publishable key.
4. Jalankan npm run dev atau buka Buka Creator Hub.bat, lalu buka URL yang ditampilkan Vite.
5. Isi 1inference/Gemini API Key pada Pengaturan API untuk memakai layanan AI.

Server API lokal terintegrasi dengan Vite. Restart dev server setelah mengubah environment. npm run preview hanya mengecek build statis dan tidak menjalankan API. Jika konfigurasi database belum lengkap, dashboard tetap terbuka dan menampilkan kesalahan pemuatan data.

## Deploy ke Vercel

Isi SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY pada environment proyek Vercel, lalu deploy. Project Supabase harus memiliki tabel public.prompts dengan kolom id, type, product_desc, result, created_at. Build command: npm run build; output: dist. Folder api/ berisi Vercel Node handlers.

Tidak perlu menambahkan password, session secret, atau menjalankan migrasi workspace_credentials untuk membuka workspace. Perubahan environment lokal tidak otomatis diterapkan ke Vercel.

Jangan deploy hanya folder dist ke hosting statis jika membutuhkan generasi/database. vercel.json memberi header keamanan dan fallback SPA tanpa mengalihkan /api/* ke HTML.

## Penyimpanan dan API

Data dibaca dan ditulis melalui /api/database menggunakan key Supabase di server. Jangan beri awalan VITE_ pada rahasia server. File .env dan .private tetap diblokir oleh Vite dan dikecualikan dari Git/deployment.

Jika project Supabase khusus aplikasi ini, akses langsung dengan publishable key dapat ditutup melalui SQL berikut. Tinjau dampaknya jika project dipakai aplikasi lain:

```sql
alter table public.prompts enable row level security;
revoke all on table public.prompts from anon, authenticated;
grant select, insert, update, delete on table public.prompts to service_role;
```

Izin tersebut melindungi akses langsung ke Supabase. Endpoint /api/database aplikasi tetap terbuka sesuai mode tanpa password dan memakai data workspace bersama.

Generator tetap memerlukan API Key provider dari browser. Validasi metode HTTP, payload, ID data, pagination, dan URL publik tetap berlaku. Pengambil artikel membatasi protokol, alamat publik, DNS, redirect, waktu, dan ukuran respons. Isi berita yang gagal dibaca tidak diteruskan ke AI untuk ditebak.

Model teks utama dan analisis gambar menggunakan `gpt-5.5` melalui 1inference, dengan konfigurasi bersama di `src/lib/ai-model.js`. Generator konten memakai `reasoning_effort: low`; rekomendasi gaya artikel memakai `none` dan `max_completion_tokens: 400` untuk jawaban JSON singkat. Permintaan GPT-5.5 tidak mengirim `temperature`; gambar referensi memakai `detail: high` agar batas resolusinya eksplisit. Model generator gambar, TTS, serta analisis video Gemini mengikuti pilihan fiturnya masing-masing. Model utama ditampilkan di Pengaturan API. Akses dan saldo GPT-5.5 mengikuti akun 1inference; kegagalan provider ditampilkan tanpa beralih diam-diam ke GPT-4o.

Prompt Threads Artikel di `src/lib/article-thread.js` mengarahkan semua gaya ke satu ide per tweet, 1–2 kalimat pendek, target 140–220 karakter dan maksimal 280 karakter di luar URL. Batas ini mencakup hook, penutup, dan promosi opsional. Jumlah cuitan membagi isi berita menjadi bagian kecil; gaya formal dan storytelling tetap singkat. Model diminta memeriksa dan meringkas jawabannya sebelum mengirim. Panjang merupakan instruksi prompt, bukan pemotongan otomatis di aplikasi; kualitas dan kepatuhan keluaran tetap perlu dinilai dengan respons provider langsung.

## Penggunaan di HP

Navigasi bawah: Beranda, Produk, Buat, Riwayat, API. Menu lengkap tersedia lewat tombol menu atas. Dukungan portrait/landscape, safe area, dan penyesuaian visual viewport saat keyboard muncul tetap aktif. Untuk membuka dev server dari HP satu Wi-Fi, jalankan npm run dev -- --host 0.0.0.0 lalu buka alamat IP komputer dan port Vite. Gunakan deployment HTTPS untuk pemakaian sehari-hari.

## Pemeriksaan

```sh
npm run lint
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

Tes API memeriksa akses tanpa cookie/password/session secret, validasi provider, akses database, URL privat/redirect, parser history, statistik, serta status unggahan Gemini. Tes browser memeriksa dashboard langsung terbuka, refresh dengan cookie lama, navigasi, pengaturan API, produk, dan tampilan mobile di Chromium, Android, dan iPhone/WebKit.

Tes memakai data/provider mock tanpa membaca atau mengubah Supabase produksi dan tanpa biaya generasi. Keyboard native diuji melalui simulasi visual viewport; emulasi bukan pengganti pemeriksaan perangkat fisik. Integrasi berbayar dan ketersediaan model perlu diuji dengan akun provider Anda sendiri.
