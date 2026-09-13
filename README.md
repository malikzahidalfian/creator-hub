# Creator Hub AI

Workspace React untuk storyboard, produk, threads, gambar, dan audio. UI responsif dengan dashboard dari data tersimpan (bukan statistik contoh).

## Menjalankan lokal

1. Gunakan **Node.js 22.12+** (atau Node 24 LTS).
2. `npm install`
3. Salin `.env.example` menjadi `.env.local`, lalu isi:
   - `APP_PASSWORD`: password **awal**, 12–128 karakter. Hanya dipakai ketika penyimpanan kredensial belum berisi password.
   - `SESSION_SECRET`: rahasia acak minimal 32 karakter. Buat dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   - `SUPABASE_URL`: URL project Supabase yang sudah memiliki tabel `public.prompts`.
   - `SUPABASE_SERVICE_ROLE_KEY`: kunci **server-only** Supabase (service_role/secret), bukan publishable key.
4. `npm run dev`, buka URL yang ditampilkan Vite.
5. Saat pertama kali, login dengan `APP_PASSWORD`. Selanjutnya gunakan password terakhir yang diatur di aplikasi. Isi 1inference/Gemini API Key pada **Pengaturan API**.

Server API lokal sudah terintegrasi dengan Vite. `npm run preview` hanya untuk mengecek build statis, **bukan** untuk menjalankan API. Restart dev server setelah mengubah environment.

## Ganti password dari aplikasi

Buka **Akun** di navigasi bawah HP, atau **Akun & Keamanan** di sidebar desktop. Isi password saat ini, password baru (12–128 karakter), dan konfirmasinya. Tombol mata dapat menampilkan/menyembunyikan teks. Password lama wajib benar; password baru tidak boleh sama dengan yang lama.

- Password disimpan sebagai **hash scrypt dengan salt acak**, bukan plaintext/localStorage.
- Setelah berhasil, perangkat ini mendapat sesi baru; semua sesi lama di perangkat lain tidak berlaku.
- Penyimpanan gagal tidak dianggap berhasil, dan password tidak diubah hanya di memori.
- Kredensial lokal disimpan di `.private/workspace-auth.json`, diabaikan Git dan diblokir oleh Vite. Perubahan bertahan setelah restart. Backup file ini secara aman; jangan hapus saat memperbarui aplikasi.
- Vercel/production menggunakan tabel Supabase **`workspace_credentials`**, bukan file serverless sementara. Jalankan `migrations/001_workspace_credentials.sql` sekali di Supabase SQL Editor. Password berlaku lintas instance dan bertahan setelah redeploy.
- `AUTH_STORE` dapat disetel ke `supabase` untuk memakai penyimpanan yang sama saat development. Production menolak `AUTH_STORE=file`. `AUTH_FILE` hanya untuk lokasi file lokal khusus/testing; letakkan di `.private/` atau di luar direktori web.
- `APP_PASSWORD` adalah bootstrap **sekali saja**, bukan password cadangan. Mengubah environment tersebut tidak menimpa password yang sudah disimpan. Jika penyimpanan error, aplikasi menolak login, bukan kembali ke password lama.
- Kredensial lokal dan production berbeda kecuali keduanya sengaja memakai Supabase yang sama.

**Jika lupa password:** pemilik server harus melakukan reset di luar aplikasi. Hentikan server lokal, backup lalu pindahkan `.private/workspace-auth.json`, isi `APP_PASSWORD` baru, lalu restart. Untuk Supabase, backup lalu hapus baris `id = 'owner'` pada `workspace_credentials` melalui SQL Editor sebagai administrator dan tetapkan `APP_PASSWORD` baru sebelum menginisialisasi kembali. Tindakan ini mereset akses seluruh workspace; tidak ada endpoint reset tanpa autentikasi. Jangan hapus tabel/data konten `prompts`. Jika file `.lock` tertinggal akibat proses berhenti paksa, pastikan **semua** proses server sudah berhenti sebelum menghapus direktori lock.

## Penggunaan di HP

- Navigasi bawah: **Beranda, Produk, Buat, Riwayat, Akun**. Menu lengkap tetap tersedia lewat tombol menu atas.
- Tombol dan kontrol sentuh minimal 44 px, teks input 16 px agar tidak memicu auto-zoom iOS, form dan kartu menyesuaikan layar kecil.
- Mendukung portrait/landscape, safe area/notch, dan penyesuaian visual viewport saat keyboard muncul. Modal dapat digulir dengan tombol tutup/simpan tetap mudah dijangkau.
- Zoom browser tetap diizinkan. Untuk mengakses dev server dari HP satu Wi-Fi, jalankan `npm run dev -- --host 0.0.0.0`, lalu buka alamat IP komputer dan port Vite dari HP. Jangan mengekspos dev server langsung ke internet. Gunakan deployment HTTPS untuk pemakaian sehari-hari, cookie production, dan fitur clipboard.

## Penting: migrasi keamanan

Login lama hanya memeriksa password yang tertanam di JavaScript dan flag localStorage. Keduanya **bukan autentikasi**. Versi ini menghapus password frontend, menggunakan cookie HttpOnly bertanda tangan (8 jam), dan melindungi seluruh endpoint API. Sesi lama tidak berlaku. Tanpa SESSION_SECRET atau penyimpanan kredensial yang valid, aplikasi sengaja menolak login.

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
- Aktifkan rate limit terdistribusi pada hosting/WAF untuk `/api/auth` (login **dan** ganti password) dan endpoint mahal. Pembatas percobaan di kode hanya per-instance, bukan perlindungan brute-force terdistribusi.
- Workspace ini **single-owner**, bukan multi-user/tenant.
- API Key provider tetap disimpan di localStorage sesuai perilaku aplikasi sebelumnya. Hanya gunakan perangkat pribadi; tersedia tombol hapus seluruh kunci. Logout tidak menghapus kunci tersebut.
- Pengambil artikel membatasi protokol, alamat publik, DNS, redirect, waktu, dan ukuran respons. Isi berita yang gagal dibaca tidak diteruskan ke AI untuk ditebak.

## Deploy ke Vercel

Jalankan **`migrations/001_workspace_credentials.sql`** sekali di Supabase SQL Editor, lalu tambahkan empat environment di atas ke Project Settings → Environment Variables dan deploy. `AUTH_STORE=supabase` otomatis dipakai di production. Tanpa tabel/izin yang benar, login akan menampilkan kesalahan konfigurasi (fail closed). Build command: `npm run build`; output: `dist`. Folder `api/` berisi Vercel Node handlers. Cookie memakai `Secure` di production, jadi gunakan HTTPS.

Jangan deploy hanya folder `dist` ke hosting statis jika membutuhkan login/generasi/database. `vercel.json` memberi header keamanan dan fallback SPA tanpa mengalihkan `/api/*` ke HTML.

## Pemeriksaan

```sh
npm run lint
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
npm audit
```

Tes unit memeriksa autentikasi, hashing dan persistensi password, perubahan bersamaan, revokasi sesi, fail-closed ketika storage gagal, validasi proxy, URL privat/redirect, parser history, statistik, serta status unggahan Gemini. Tes browser menggunakan data/provider **mock**, tanpa membaca atau mengubah Supabase produksi dan tanpa biaya generasi. Kredensial dalam konfigurasi tes adalah fixture khusus tes di direktori sementara, tidak pernah mengubah password/file kredensial lokal milik pengguna. Tes mobile mencakup layar kecil, landscape, area sentuh, modal, dan alur ganti password melalui project `chromium`, `android` (Pixel 7), serta `iphone-webkit` (iPhone 13/WebKit). Perubahan visual viewport akibat keyboard juga diuji dengan simulasi event; keyboard native tidak tersedia dalam Playwright. Emulasi browser bukan pengganti pengujian pada perangkat fisik.

Integrasi berbayar, saldo akun, dukungan CORS Google, dan ketersediaan model tetap perlu diuji dengan akun provider Anda. URL gambar gratis merupakan layanan pihak ketiga dan tidak dijamin selalu tersedia. Kegagalan ditampilkan tanpa loading tanpa batas.
