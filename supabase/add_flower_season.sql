-- =============================================================================
-- OFFICIAL.ID — ADD FLOWER (HIBISCUS) SEASON TYPE MIGRATION
-- Jalankan script ini di Supabase SQL Editor jika database sudah ada sebelumnya
-- =============================================================================

ALTER TYPE season_type ADD VALUE IF NOT EXISTS 'flower';
