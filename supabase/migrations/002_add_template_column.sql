-- Migration: Add template column to business_cards table
-- Run this in Supabase SQL Editor

-- Add template column with default value 'professional'
ALTER TABLE business_cards 
ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'professional';

-- Update existing records to have a default template
UPDATE business_cards 
SET template = 'professional' 
WHERE template IS NULL;

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'business_cards' AND column_name = 'template';
