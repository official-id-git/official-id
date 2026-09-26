-- =============================================================================
-- OFFICIAL.ID — HAPUS SEMUA TABEL LAMA (CLEANUP SCRIPT)
-- Menghapus semua tabel lama dari proyek lama, dan HANYA MENYISAKAN:
-- 1. `magic_links`
-- 2. `link_analytics`
-- =============================================================================

-- Hapus tabel lama secara eksplisit berdasarkan daftar tabel:
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
DROP TABLE IF EXISTS public.business_cards CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Sapu bersih otomatis jika masih ada tabel lama lainnya di skema public
-- (KECUALI magic_links dan link_analytics yang baru saja diimpor)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename NOT IN ('magic_links', 'link_analytics')
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;
