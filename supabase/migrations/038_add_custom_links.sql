-- Add custom_links column to business_cards
ALTER TABLE public.business_cards ADD COLUMN IF NOT EXISTS custom_links JSONB DEFAULT '[]'::jsonb;
