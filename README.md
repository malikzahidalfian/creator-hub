# Creator Hub AI

Workspace React untuk storyboard, produk, threads, gambar, dan audio. UI responsif dengan dashboard dari data tersimpan (bukan statistik contoh).

## Menjalankan lokal

1. Gunakan **Node.js 22.12+** (atau Node 24 LTS).
2. `npm install`
3. Salin `.env.example` menjadi `.env.local`, lalu isi:
   - `APP_PASSWORD`: password **baru**, minimal 12 karakter.
   - `SESSION_SECRET`: rahasia acak minimal 32 karakter. Buat dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `SUPABASE_URL`: URL project Supabase yang sudah memiliki tabel `public.prompts`.
   - `SUPABASE_SERVICE_ROLE_KEY`: kunci **server-only** Supabase (service_role/secret), bukan publishable key.
4. `npm run dev`, buka URL yang ditampilkan Vite.
5. Login dengan `APP_PASSWORD`. Isi 1inference/Gemini API Key pada **Pengaturan API**.

Server API lokal sudah terintegrasi dengan Vite. `npm run preview` hanya untuk mengecek build statis, **bukan** untuk menjalankan API. Restart dev server setelah mengubah environment.

## Penting: migrasi keamanan

Login lama hanya memeriksa password yang tertanam di JavaScript dan flag localStorage. Keduanya **bukan autentikasi**. Versi ini menghapus password frontend, menggunakan cookie HttpOnly bertanda tangan (8 jam), dan melindungi seluruh endpoint API. Sesi lama tidak berlaku. Tanpa environment autentikasi, aplikasi sengaja menolak login.

Akses database sekarang melalui `/api/database`. Tidak ada service-role key di browser. Data yang sudah ada tetap menggunakan tabel `prompts` (kolom `id`, `type`, `product_desc`, `result`, `created_at`).

**Wajib sebelum deployment publik:** akses langsung melalui publishable key lama harus ditutup di Supabase. Perubahan frontend tidak dapat mengubah izin database remote. Untuk project khusus aplikasi ini, tinjau lalu jalankan SQL berikut di Supabase SQL Editor:

```sql
alter table public.prompts enable row level security;
revoke all on table public.prompts from anon, authenticated;
grant select, insert, update, delete on table public.prompts to service_role;
```

Jika project digunakan aplikasi lain, sesuaikan izin/RLS terlebih dahulu agar tidak memutus akses aplikasi tersebut. Verifikasi bahwa request REST langsung memakai publishable key lama tidak dapat membaca atau mengubah data. Jangan menjalankan SQL tanpa meninjau dampaknya. Tidak ada perubahan remote yang dijalankan otomatis oleh repo ini.

- Jangan beri awalan `VITE_` pada rahasia server.
- Ganti password lama; jangan gunakan lagi yang pernah tertanam di frontend.
- Aktifkan rate limit terdistribusi pada hosting/WAF untuk `/api/auth` dan endpoint mahal. Pembatas percobaan login di kode hanya per-instance, bukan perlindungan brute-force terdistribusi.
- Workspace ini **single-owner**, bukan multi-user/tenant.
- API Key provider tetap disimpan di localStorage sesuai perilaku aplikasi sebelumnya. Hanya gunakan perangkat pribadi; tersedia tombol hapus seluruh kunci. Logout tidak menghapus kunci tersebut.
- Pengambil artikel membatasi protokol, alamat publik, DNS, redirect, waktu, dan ukuran respons. Isi berita yang gagal dibaca tidak diteruskan ke AI untuk ditebak.

## Deploy ke Vercel

Tambahkan empat environment di atas ke Project Settings → Environment Variables, lalu deploy. Build command: `npm run build`; output: `dist`. Folder `api/` berisi Vercel Node handlers. Cookie memakai `Secure` di production, jadi gunakan HTTPS.

Jangan deploy hanya folder `dist` ke hosting statis jika membutuhkan login/generasi/database. `vercel.json` memberi header keamanan dan fallback SPA tanpa mengalihkan `/api/*` ke HTML.

## Pemeriksaan

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

Tes unit memeriksa autentikasi, validasi proxy, URL privat/redirect, parser history, statistik, serta status unggahan Gemini. Tes browser menggunakan data/provider **mock**, tanpa membaca atau mengubah Supabase produksi dan tanpa biaya generasi. Kredensial dalam konfigurasi tes adalah fixture khusus tes, tidak digunakan aplikasi produksi.

Integrasi berbayar, saldo akun, dukungan CORS Google, dan ketersediaan model tetap perlu diuji dengan akun provider Anda. URL gambar gratis merupakan layanan pihak ketiga dan tidak dijamin selalu tersedia. Kegagalan ditampilkan tanpa loading tanpa batas.
