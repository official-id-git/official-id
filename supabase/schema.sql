-- =============================================================================
-- OFFICIAL.ID — DATABASE RESET & RE-INITIALIZATION SCRIPT
-- Jalankan script ini di Supabase SQL Editor untuk membersihkan database lama
-- dan menyiapkan tabel `magic_links` & `link_analytics` untuk official.id WebAR
-- =============================================================================

-- 1. Hapus tabel-tabel lama (Clean Reset)
DROP TABLE IF EXISTS public.link_analytics CASCADE;
DROP TABLE IF EXISTS public.magic_links CASCADE;
DROP TABLE IF EXISTS public.blogs CASCADE;
DROP TABLE IF EXISTS public.circle_broadcasts CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.event_payment_proofs CASCADE;
DROP TABLE IF EXISTS public.event_registrations CASCADE;
DROP TABLE IF EXISTS public.event_rsvps CASCADE;
DROP TABLE IF EXISTS public.event_tickets CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.kta_applications CASCADE;
DROP TABLE IF EXISTS public.kta_numbers CASCADE;
DROP TABLE IF EXISTS public.kta_templates CASCADE;
DROP TABLE IF EXISTS public.link_ngabsen CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.ngabsen CASCADE;
DROP TABLE IF EXISTS public.organization_invitations CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.organization_repositories CASCADE;
DROP TABLE IF EXISTS public.organization_requests CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;
DROP TABLE IF EXISTS public.pendaftaran_ngabsen CASCADE;
DROP TABLE IF EXISTS public.promotions CASCADE;
DROP TABLE IF EXISTS public.seo_settings CASCADE;
DROP TABLE IF EXISTS public.template_settings CASCADE;
DROP TABLE IF EXISTS public.user_relationships CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.xploit_potential_log CASCADE;
DROP TABLE IF EXISTS public.links CASCADE;
DROP TABLE IF EXISTS public.business_cards CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Hapus ENUM lama jika ada
DROP TYPE IF EXISTS season_type CASCADE;
DROP TYPE IF EXISTS user_role_type CASCADE;

-- 2. Buat ENUM untuk Musim (Summer, Sakura/Spring, Autumn)
CREATE TYPE season_type AS ENUM ('summer', 'spring', 'autumn');

-- 3. Buat Tabel `magic_links` (Menyimpan URL yang diinput pengguna & slug QR)
CREATE TABLE public.magic_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    destination TEXT NOT NULL,
    season season_type DEFAULT 'summer' NOT NULL,
    title VARCHAR(255) DEFAULT 'official.id — Magic Tree',
    brand_name VARCHAR(120),
    brand_logo_url TEXT,
    brand_accent VARCHAR(32),
    clicks_count BIGINT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indeks performa tinggi untuk pembacaan slug saat QR discan
CREATE INDEX idx_magic_links_slug ON public.magic_links(slug);
CREATE INDEX idx_magic_links_created_at ON public.magic_links(created_at DESC);

-- 4. Buat Tabel `link_analytics` (Tracking event scan, AR ready, & redirect per channel)
CREATE TABLE public.link_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) NOT NULL,
    event VARCHAR(64) NOT NULL, -- 'share_view', 'embed_view', 'modal_opened', 'camera_active', 'bubble_click', 'auto_redirect', 'close'
    source VARCHAR(32) DEFAULT 'page', -- 'page', 'scan', 'embed'
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_link_analytics_slug ON public.link_analytics(slug);
CREATE INDEX idx_link_analytics_source ON public.link_analytics(source);
CREATE INDEX idx_link_analytics_created_at ON public.link_analytics(created_at DESC);

-- 5. Aktifkan Row Level Security (RLS) & Kebijakan Akses
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_analytics ENABLE ROW LEVEL SECURITY;

-- Izinkan publik membaca data link berdasarkan slug (wajib untuk halaman /t/[slug])
CREATE POLICY "Allow public read magic_links"
    ON public.magic_links
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Izinkan pembuatan link baru dari studio
CREATE POLICY "Allow public insert magic_links"
    ON public.magic_links
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Izinkan update link jika slug cocok
CREATE POLICY "Allow public update magic_links"
    ON public.magic_links
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Izinkan publik mengirim event tracking analitik
CREATE POLICY "Allow public insert link_analytics"
    ON public.link_analytics
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- 6. Seed Data Awal Default
INSERT INTO public.magic_links (slug, destination, season, title)
VALUES
    ('demo', 'https://official.id', 'summer', 'Demo 3D Voxel Magic Tree'),
    ('harizal', 'https://official.id', 'spring', 'Harizal 3D Sakura Tree'),
    ('patrakomala', 'https://patrakomala.id', 'spring', 'Patrakomala')
ON CONFLICT (slug) DO UPDATE
SET destination = EXCLUDED.destination,
    season = EXCLUDED.season,
    title = EXCLUDED.title;

