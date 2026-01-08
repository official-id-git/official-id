-- Migration: Add address and city fields to business_cards
-- Created: 2026-01-08
-- Description: Adds address and city columns for networking within circles
--              where members often look for contacts in the same region.

-- Add address column with default value "belum diisi"
ALTER TABLE public.business_cards 
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT 'belum diisi';

-- Add city column with default value "belum diisi"
ALTER TABLE public.business_cards 
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'belum diisi';

-- Add comments for documentation
COMMENT ON COLUMN public.business_cards.address IS 'User address, defaults to "belum diisi" (not filled yet)';
COMMENT ON COLUMN public.business_cards.city IS 'User city/region, defaults to "belum diisi" (not filled yet)';
