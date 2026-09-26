# Catatan Transisi & Dokumentasi Pengembangan official.id

Dokumen ini merangkum seluruh riwayat percakapan, instruksi pengguna, evolusi fitur, perbaikan bug, audit keamanan, optimasi SEO, serta arsitektur sistem yang telah diimplementasikan pada proyek **official.id** (**3D Voxel Magic Tree QR Code Generator & WebAR Interactive Studio**).

---

## 1. Identitas & Visi Proyek

- **Domain Utama**: `https://official.id`
- **Konsep Inti**: Platform generator QR Code inovatif berbasis 3D Voxel Magic Tree interaktif yang memadukan estetika alam (pohon voxel dengan dedaunan bergelombang tertiup angin sesuai musim: Summer, Spring/Sakura, Autumn), pengalaman Augmented Reality (WebAR) berbasis browser, dan QR Code 2D datar fisik yang 100% dapat discan kamera ponsel cerdas.
- **Arsitektur 3 Wajah Tautan (The 3 Faces of official.id)**:
  1. **QR Cetak Fisik (`https://official.id/[slug]/q`)**: Ditujukan untuk dicetak di poster, kemasan produk, atau banner. Saat discan oleh kamera smartphone, pengunjung langsung masuk ke pengalaman WebAR 3D selama 10 detik sebelum diarahkan secara otomatis (*auto-redirect*) ke website tujuan pemilik link.
  2. **Link Share Medsos (`https://official.id/[slug]`)**: Ditujukan untuk disebarkan di WhatsApp, bio Instagram, LinkedIn, atau Twitter. Menampilkan halaman pohon 3D whitelabel dengan kartu tujuan dan kontrol suara ambient.
  3. **Embed Widget Website (`https://official.id/embed/[slug]`)**: Snippet kode HTML/iframe transparan untuk disematkan langsung di dalam website bisnis pengguna.

---

## 2. Kronologi Instruksi & Kegiatan Pengembangan

### Tahap 1: Pembersihan Database Lama & Reset Skema
- **Kebutuhan**: Menghapus sisa tabel-tabel lama dari proyek terdahulu (seperti `events`, `users`, `kta`, `ngabsen`, dll.) dan menyiapkan skema baru yang ramping, bersih, serta terisolasi.
- **Tindakan**:
  - Dibuat script migrasi [`supabase/schema.sql`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/supabase/schema.sql) untuk membersihkan seluruh tabel relasional lama dengan `CASCADE`.
  - Dibuat tabel baru `public.magic_links` untuk menyimpan data slug, URL tujuan, musim, kustomisasi merek (*brand name & logo*), serta tabel `public.link_analytics` untuk pencatatan metrik scan dan konversi.

### Tahap 2: Redesain Studio, UX Seamless & Penghapusan Duplikasi
- **Kebutuhan**: Antarmuka studio yang terinspirasi dari kesederhanaan [tree.icqr.com](https://tree.icqr.com/) namun memiliki identitas visual unik, bersih, tanpa tombol-tombol duplikat yang mengganggu.
- **Tindakan**:
  - Diperbarui [`src/components/qr/TreeICQRStudio.tsx`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/components/qr/TreeICQRStudio.tsx) dengan kartu konfigurasi yang elegan (*glassmorphism*, font Geist, palet warna stone & emerald).
  - Tombol-tombol kontrol yang redundan pada header dan footer dibersihkan.
  - Ditambahkan dukungan audio ambient (desau angin & gemerisik daun) yang dapat dinyalakan/dimatikan dengan satu klik.

### Tahap 3: Perbaikan Unduhan Gambar QR Code (Bukan Screenshot 3D)
- **Kebutuhan**: Hasil unduhan gambar sebelumnya menghasilkan screenshot kanvas 3D yang miring dan tertutup dedaunan pohon sehingga tidak bisa dibaca oleh kamera smartphone.
- **Tindakan**:
  - Diimplementasikan fungsi `handleDownloadPrintQr` pada studio.
  - Fungsi ini merender matriks QR Code murni pada elemen `<canvas>` tersembunyi berukuran **1024x1024 piksel** dengan tingkat koreksi kesalahan **Level H (30% redundancy)** dan kontras warna tajam sesuai tema musim.
  - Gambar disimpan otomatis dengan nama format `official-id-[slug]-qrcode.png` (atau `official-id-default-qrcode.png` jika slug belum dibuat).
  - Tombol aksi utama diberi nama yang sangat jelas: **`[ 📥 Unduh QR Code ]`** dan dilabeli **"🖨️ Download Scannable QR Code (PNG - 100% Scan Ready)"**.

### Tahap 4: Halaman Share & Siklus Otomatis QR vs 3D Tree
- **Kebutuhan**: Pada halaman yang dibagikan (`/[slug]`), tampilan default adalah QR Code agar pengunjung langsung siap scan. Jika dalam 10 detik tidak ada aktivitas/interaksi, halaman otomatis beralih ke animasi pohon 3D selama 10 detik, lalu kembali ke QR Code, dan seterusnya secara berulang, dengan tetap menyediakan tombol manual untuk beralih mode kapan saja.
- **Tindakan**:
  - Komponen [`src/components/TreeViewer.tsx`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/components/TreeViewer.tsx) dikonfigurasi dengan timer idle 10 detik dan tombol switch eksplisit (*QR Code / 3D Tree*).

### Tahap 5: Audit Keamanan Menyeluruh & Pengetatan Supabase RLS
- **Kebutuhan**: Memastikan aplikasi memenuhi standar keamanan tertinggi, tidak memiliki celah eksploitasi pada Row Level Security (RLS) Supabase, dan mencegah manipulasi data.
- **Tindakan**:
  - **Audit RLS**: Ditemukan risiko potensial jika kunci publik anonim (`anon`) diberikan izin `INSERT`/`UPDATE`/`DELETE` langsung pada tabel `magic_links`.
  - **Hardening RLS**: Dibuat script migrasi [`supabase/harden_rls_security.sql`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/supabase/harden_rls_security.sql) yang mencabut seluruh izin penulisan dari peran `anon` dan `authenticated`. Publik hanya diizinkan melakukan operasi `SELECT` (membaca tautan resmi) dan `INSERT` untuk pencatatan event analitik (`link_analytics`).
  - **Admin Client**: Dibuat fungsi helper `createAdminClient()` di [`src/lib/supabase/server.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/lib/supabase/server.ts) yang memanfaatkan `SUPABASE_SERVICE_ROLE_KEY` pada level backend API Next.js.
  - **Idempotency**: Script RLS dibungkus dalam blok `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object THEN NULL; END $$;` sehingga jika dieksekusi sebagian atau berulang kali di SQL Editor Supabase, tidak akan memicu error `policy already exists`.
  - **Hasil Eksekusi Pengguna**: Skrip telah sukses dijalankan di Supabase SQL Editor dengan respon `Success. No rows returned`.

### Tahap 6: Perlindungan Anti-Bot, Anti-Crawler, Anti-Spam, & Anti-DDoS
- **Kebutuhan**: Melindungi form input studio dan endpoint API dari serangan bot otomatis, scraper, dan DDoS yang mencoba membuat ribuan tautan palsu untuk menghabiskan memori server dan kuota database.
- **Tindakan** (dibuat di [`src/lib/security.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/lib/security.ts)):
  1. **Sliding-Window Rate Limiter**: Dibatasi maksimal 6 pembuatan tautan baru per menit per alamat IP dengan pembersihan memori (*garbage collector*) otomatis setiap 5 menit.
  2. **Suspicious Bot/Scraper Detection**: Memblokir otomatis request dengan `User-Agent` bot umum (`curl`, `wget`, `python-requests`, `scrapy`, `headlesschrome`, `puppeteer`, `selenium`, dll.).
  3. **SSRF Guard (Server-Side Request Forgery)**: Memvalidasi URL tujuan pengguna agar tidak mengarah ke `localhost`, `127.0.0.1`, subnet IP privat RFC 1918 (10.x, 192.168.x, 172.16-31.x), maupun endpoint metadata cloud (`169.254.169.254`).
  4. **Honeypot Trap**: Kolom formulir tersembunyi `_hp_company` yang jika diisi oleh bot akan langsung ditolak sistem tanpa menyentuh database.
  5. **Human-Timing Submission Verification**: Memeriksa token waktu render form (`_render_t`). Pengiriman yang berlangsung kurang dari 800 milidetik sejak form dimuat otomatis diklasifikasikan sebagai bot dan ditolak.
  6. **Payload Size Guard**: Batas payload JSON maksimal 10KB.

### Tahap 7: Info Modal Bahasa Inggris (Partnerships & Feedback)
- **Kebutuhan**: Menambahkan bagian kontak kerja sama dan masukan dalam bahasa Inggris yang mengarahkan langsung ke WhatsApp dan Instagram Harizal.
- **Tindakan**:
  - Pada Info Modal ([`src/components/qr/TreeICQRStudio.tsx`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/components/qr/TreeICQRStudio.tsx)), ditambahkan kartu beraksen hijau zamrud:
    - **Judul**: `🤝 Partnerships & Feedback`
    - **Deskripsi**: *"For collaborations, business partnerships, ideas, or feedback, please contact Harizal directly:"*
    - **WhatsApp**: [https://wa.me/6281283835553](https://wa.me/6281283835553) (`+62 812-8383-5553`)
    - **Instagram**: [https://instagram.com/harizal.official](https://instagram.com/harizal.official) (`@harizal.official`)

### Tahap 8: Pembebasan Slug `harizal`
- **Kebutuhan**: Menghapus slug `harizal` agar dapat didaftarkan ulang melalui database/aplikasi oleh pengguna.
- **Tindakan**:
  - Dihapus dari Supabase `magic_links` via script dan query SQL.
  - Dihapus dari daftar seed in-memory di [`src/lib/links.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/lib/links.ts) dan file cache lokal [`.data/magic_links.json`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/.data/magic_links.json).

### Tahap 9: Input Form Kosong Default & QR Code Default `official.id`
- **Kebutuhan**: Semua kolom input pada kartu studio harus kosong secara default saat dibuka oleh pengunjung, sedangkan QR Code sebelum pengguna mengisi input harus mengarah ke `https://official.id`.
- **Tindakan**:
  - `destinationUrl`: default diset ke string kosong `""` (placeholder: `https://contoh-website-anda.com...`).
  - `customSlugInput`: default diset ke string kosong `""` (placeholder: `contoh-slug-anda (opsional)`).
  - `slugCheckStatus`: default diset ke `"idle"` (tidak lagi memunculkan badge *✓ Tersedia* sebelum diketik).
  - `qrText`: dihitung dinamis dengan ternary:
    ```tsx
    const qrText = slug ? `${shortlinkBase}/${slug}/q` : "https://official.id";
    ```
  - Tombol **"Acak"**: Menghasilkan 6 karakter alfanumerik unik di kolom slug.
  - Tombol **"Terapkan"**: Menampilkan pesan error visual `"Isi URL dulu!"` berwarna merah jika diklik dalam keadaan URL tujuan kosong, serta otomatis menambahkan prefix `https://` jika pengguna hanya mengetikkan nama domain tanpa protokol.

### Tahap 10: Optimasi SEO Google Standar Modern
- **Kebutuhan**: Memastikan website ramah mesin pencari Google, mematuhi standar indexing terkini, dan dioptimasi untuk kata kunci:
  - `"QR CODE ANIMATE"`
  - `"ANIMASI QR CODE"`
  - `"QR CODE GENERATOR INOVATIVE"`
- **Tindakan**:
  - **Metadata & OpenGraph**: Diperbarui pada [`src/app/layout.tsx`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/app/layout.tsx) dan [`src/app/page.tsx`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/app/page.tsx).
  - **Schema.org Structured Data**: Ditambahkan JSON-LD tipe `WebApplication` dan `Organization` di `<head>`.
  - **Headings Semantik**: Ditambahkan tag `<h1>` dan `<h2>` yang accessible bagi perayap Google.
  - **[`src/app/robots.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/app/robots.ts)**: Menyediakan file `robots.txt` standar Next.js yang mengizinkan seluruh halaman publik dan memblokir perayapan endpoint backend `/api/`.
  - **[`src/app/sitemap.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/app/sitemap.ts)**: Menyediakan `sitemap.xml` dinamis untuk didaftarkan ke Google Search Console.

### Tahap 11: Hardening Header Keamanan & Deployment Produksi
- **Kebutuhan**: Header HTTP enterprise untuk pencegahan XSS, clickjacking, dan sniffing data, verifikasi build lokal tanpa error, dan push langsung ke Git & Vercel.
- **Tindakan**:
  - Diperbarui [`next.config.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/next.config.ts) dengan header:
    - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: SAMEORIGIN` (kecuali rute `/embed/*`)
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: camera=(self), microphone=(), geolocation=()`
    - `X-XSS-Protection: 1; mode=block`
  - Dilakukan pengujian kompilasi `npm run build`: **Sukses 100% (exit code 0)** dengan 10 rute statis & dinamis tervalidasi.
  - Perubahan di-commit dan di-push ke GitHub:
    - Commit `a339e8b`: Hardening RLS, anti-bot, download QR scannable, modal bahasa Inggris, robots & sitemap.
    - Commit `1724506`: Default input kosong, default QR `official.id`, dan penyempurnaan SEO.
  - Vercel memproses commit `main` dan mendistribusikan aplikasi secara langsung ke jaringan CDN global di `https://official.id`.

### Tahap 11: Tombol Utama "Simpan & Buat QR Code" yang Jelas & Terdedikasi
- **Kebutuhan**: Memperbaiki kebingungan pengguna di mana setelah mengisi URL tujuan dan custom slug, tidak ada tombol simpan yang jelas untuk menyimpan tautan ke database dan menghasilkan (*generate*) QR Code-nya (sebelumnya hanya berupa tombol kecil "Terapkan" yang menyatu di baris slug).
- **Tindakan**:
  - Formulir input dibungkus dalam elemen `<form onSubmit={...}>` yang mendukung penyimpanan instan via tombol keyboard **Enter** pada semua input.
  - Baris input slug dirapikan sehingga hanya berisi kolom input slug dan tombol **Acak** `[ 🎲 Acak ]` berukuran proporsional.
  - Ditambahkan tombol aksi utama (*Primary CTA Button*) berukuran penuh (*full-width*) di bawah form dengan label tegas: **`[ 🏁 Simpan & Buat QR Code ]`** berwarna hijau emerald.
  - Ditambahkan feedback visual interaktif:
    - Status loading: `Menyimpan & Menghasilkan QR Code...` dengan spinner putar.
    - Status sukses: `Tersimpan! QR Code Berhasil Dibuat ✓`, ledakan efek **Confetti** 🎉, dan otomatis beralih ke mode tampilan QR Code pada kanvas agar pengguna langsung melihat QR-nya.
    - Pesan error spesifik jika URL kosong atau slug sudah terpakai.
  - Tombol switcher musim disesuaikan agar tidak memicu pesan error simpan saat pengguna hanya ingin melihat pratinjau (*preview*) musim sebelum membuat tautan.

---

## 3. Struktur Berkas & Komponen Inti

| Berkas | Peran & Deskripsi |
|---|---|
| [`src/app/page.tsx`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/app/page.tsx) | Halaman beranda studio utama dengan metadata SEO bertarget kata kunci. |
| [`src/app/layout.tsx`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/app/layout.tsx) | Root layout, font Geist, OpenGraph, Twitter cards, dan JSON-LD Schema.org. |
| [`src/app/robots.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/app/robots.ts) | Konfigurasi aturan perayap mesin pencari Googlebot dan sitemap URL. |
| [`src/app/sitemap.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/app/sitemap.ts) | Generator XML Sitemap otomatis untuk Google Search Console. |
| [`src/components/qr/TreeICQRStudio.tsx`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/components/qr/TreeICQRStudio.tsx) | Komponen studio interaktif utama: pembuat pohon voxel, form input, tombol "Simpan & Buat QR Code", download PNG scannable, dan modal info kontak. |
| [`src/components/TreeViewer.tsx`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/components/TreeViewer.tsx) | Tampilan whitelabel `/[slug]` dengan auto-switch cycle 10 detik (QR Code $\leftrightarrow$ Animate Tree). |
| [`src/components/qr/WebARModal.tsx`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/components/qr/WebARModal.tsx) | Modal WebAR kamera interaktif dengan auto-redirect 10 detik setelah scan. |
| [`src/lib/security.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/lib/security.ts) | Suite keamanan: Rate limiting per IP, bot user-agent filter, honeypot check, human timing, & SSRF guard. |
| [`src/lib/links.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/lib/links.ts) | Abstraksi data layer Supabase berkecepatan tinggi dengan fallback file lokal `.data/magic_links.json`. |
| [`src/lib/supabase/server.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/src/lib/supabase/server.ts) | Inisialisasi Supabase Server Client & Service Role Admin Client. |
| [`supabase/harden_rls_security.sql`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/supabase/harden_rls_security.sql) | Script migrasi hardening RLS idempotent untuk dieksekusi di Supabase SQL Editor. |
| [`next.config.ts`](file:///Users/kabayangroup/Library/CloudStorage/OneDrive-Personal/Kabayangroup/official-id/next.config.ts) | Konfigurasi HTTP headers keamanan enterprise (HSTS, CSP iframe embed, nosniff, dll.). |

---

## 4. Panduan & Referensi Tindak Lanjut

1. **Membuat Tautan & Menghasilkan QR Code**:
   - Buka `https://official.id`.
   - Ketik URL tujuan pada formulir (misal: `https://kailoka.com` atau website Anda).
   - Masukkan custom slug pilihan Anda (atau klik tombol **Acak** untuk kode otomatis).
   - Klik tombol hijau utama **`[ 🏁 Simpan & Buat QR Code ]`** (atau tekan **Enter** pada keyboard).
   - Tautan langsung tersimpan ke Supabase, confetti muncul, dan kanvas otomatis beralih menampilkan QR Code yang siap digunakan.
2. **Mengunduh QR Code Siap Cetak**:
   - Klik tombol pill hitam **`[ 📥 Unduh QR Code ]`** pada studio atau melalui tombol **PNG** di baris ringkasan tautan.
   - File PNG beresolusi 1024x1024 piksel siap cetak di media fisik apa pun.
3. **Mendaftarkan Situs ke Google Search Console**:
   - Daftarkan sitemap di Google Search Console dengan memasukkan URL: `https://official.id/sitemap.xml`.

