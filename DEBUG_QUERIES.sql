-- ============================================================
-- 4. 🔍 CEK USER KHUSUS (Agi Kadar)
-- ID: df28fd86-8880-4942-b99b-e915b03fb901
-- ============================================================

-- Cek Status Pembayaran
SELECT * 
FROM public.payment_transactions 
WHERE user_id = 'df28fd86-8880-4942-b99b-e915b03fb901';

-- Cek Apakah ada duplikasi status di auth.users (Supabase internal)
SELECT id, email, raw_user_meta_data
FROM auth.users 
WHERE id = 'df28fd86-8880-4942-b99b-e915b03fb901';

-- Cek apakah ada trigger yg gagal update? (Harusnya updated_at baru)
SELECT id, role, updated_at 
FROM public.users 
WHERE id = 'df28fd86-8880-4942-b99b-e915b03fb901';
-- Jalankan perintah ini di Supabase PDF SQL Editor
-- ============================================================

-- 1. 🔍 CEK STATUS USER (Berdasarkan Email)
-- Ganti 'email@target.com' dengan email user yang bermasalah
SELECT 
    id, 
    email, 
    full_name, 
    role, 
    created_at, 
    updated_at 
FROM public.users 
WHERE email = 'email@target.com';

-- 2. 📝 UPDATE MANUAL JADI PRO (Jika Admin Panel gagal)
-- Ini akan memaksa user menjadi PAID_USER
UPDATE public.users 
SET 
    role = 'PAID_USER',
    updated_at = NOW()
WHERE email = 'email@target.com';

-- 3. 📉 CEK TRANSAKSI PEMBAYARAN USER
-- Melihat apakah ada pembayaran yang stuck atau rejected
SELECT 
    pt.id,
    pt.amount,
    pt.status,
    pt.proof_url,
    pt.verified_at,
    u.email
FROM public.payment_transactions pt
JOIN public.users u ON pt.user_id = u.id
WHERE u.email = 'email@target.com';

-- 4. 📊 CEK APAKAH ADA DUPLIKAT / ERROR SINKRONISASI
-- Membandingkan data di auth.users (Supabase Auth) vs public.users (Tabel Kita)
-- Jika ada di auth tapi tidak ada di public, berarti profile gagal dibuat
SELECT 
    au.id as auth_id, 
    au.email as auth_email,
    pu.id as public_id, 
    pu.role as public_role
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'email@target.com';

-- 5. 🔄 RESET USER JADI FREE (Untuk testing ulang)
UPDATE public.users 
SET 
    role = 'FREE_USER',
    updated_at = NOW()
WHERE email = 'email@target.com';
