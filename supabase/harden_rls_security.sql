-- =============================================================================
-- OFFICIAL.ID — SUPABASE RLS HARDENING MIGRATION
-- Jalankan SELURUH script ini di Supabase SQL Editor (Klik RUN tanpa memblok baris sebagian)
-- 1. Cabut hak INSERT/UPDATE/DELETE dari key publik anon pada tabel `magic_links`
-- 2. Klien publik hanya diizinkan membaca (SELECT) data link
-- 3. Semua penulisan harus melewati backend API terproteksi dengan validasi & rate limit
-- =============================================================================

-- Pastikan RLS aktif
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_analytics ENABLE ROW LEVEL SECURITY;

-- Cabut kebijakan penulisan publik lama yang berisiko
DROP POLICY IF EXISTS "Allow public insert magic_links" ON public.magic_links;
DROP POLICY IF EXISTS "Allow public update magic_links" ON public.magic_links;
DROP POLICY IF EXISTS "Allow public delete magic_links" ON public.magic_links;
DROP POLICY IF EXISTS "Allow public read magic_links" ON public.magic_links;
DROP POLICY IF EXISTS "Allow public insert link_analytics" ON public.link_analytics;

-- 1. Pastikan HANYA SELECT yang diizinkan untuk publik (anon & authenticated)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read magic_links" ON public.magic_links;
    CREATE POLICY "Allow public read magic_links"
        ON public.magic_links
        FOR SELECT
        TO anon, authenticated
        USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Pastikan publik hanya boleh mengirim event analitik (INSERT ONLY)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public insert link_analytics" ON public.link_analytics;
    CREATE POLICY "Allow public insert link_analytics"
        ON public.link_analytics
        FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Hapus slug 'harizal' jika masih ada di tabel (sehingga bebas dibuat baru)
DELETE FROM public.magic_links WHERE slug = 'harizal';

