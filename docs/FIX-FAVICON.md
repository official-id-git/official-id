# Fix Favicon Error 500

## Masalah
Next.js App Router mencari favicon di `src/app/favicon.ico` terlebih dahulu.
File tersebut corrupt atau tidak valid, menyebabkan error 500.

## Solusi

### Opsi 1: Hapus file (Recommended)
```bash
rm src/app/favicon.ico
```

Next.js akan otomatis menggunakan `/public/favicon.ico` dari metadata di layout.tsx.

### Opsi 2: Replace dengan file valid
```bash
cp public/favicon.ico src/app/favicon.ico
```

### Setelah perbaikan
```bash
# Clear Next.js cache
rm -rf .next

# Restart server
npm run dev
```

## Verifikasi
Buka http://localhost:3000 dan cek Console - tidak ada error favicon.ico 500.
