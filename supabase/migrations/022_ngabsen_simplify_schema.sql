-- =====================================================
-- Migration: Update ngabsen table schema
-- Remove tempat_acara and tanggal_acara
-- Add deskripsi_acara for more flexibility
-- =====================================================

-- Drop the old columns
ALTER TABLE public.ngabsen DROP COLUMN IF EXISTS tempat_acara;
ALTER TABLE public.ngabsen DROP COLUMN IF EXISTS tanggal_acara;

-- Drop the old index if exists
DROP INDEX IF EXISTS idx_ngabsen_tanggal;

-- Add new deskripsi_acara column
ALTER TABLE public.ngabsen ADD COLUMN IF NOT EXISTS deskripsi_acara TEXT;

-- Update comment
COMMENT ON TABLE public.ngabsen IS 'Events/acara for the Ngabsen attendance feature (PAID_USER only) - simplified with description';
