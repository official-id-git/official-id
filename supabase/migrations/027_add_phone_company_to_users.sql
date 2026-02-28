-- Migration: Add phone and company columns to users table
-- These fields will be progressively filled from event registration and profile editing

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company text DEFAULT NULL;
