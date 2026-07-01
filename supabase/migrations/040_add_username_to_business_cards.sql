-- =====================================================
-- Migration: Add username column to business_cards
-- Description: Adds unique username for public sharing URLs
-- URL pattern: https://official.id/c/{username} or https://official.id/b/{username}
-- Run this in Supabase SQL Editor
-- =====================================================

-- Add username column to business_cards
ALTER TABLE public.business_cards ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique constraint on username (check if exists first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'business_cards_username_key'
        AND conrelid = 'public.business_cards'::regclass
    ) THEN
        ALTER TABLE public.business_cards ADD CONSTRAINT business_cards_username_key UNIQUE (username);
    END IF;
END $$;

-- Add index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_business_cards_username ON public.business_cards(username);

-- Add CHECK constraint for username length (3-20 chars)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'business_cards_username_length_check'
        AND conrelid = 'public.business_cards'::regclass
    ) THEN
        ALTER TABLE public.business_cards
        ADD CONSTRAINT business_cards_username_length_check
        CHECK (char_length(username) >= 3 AND char_length(username) <= 20);
    END IF;
END $$;

-- Add CHECK constraint for alphanumeric only (a-z, 0-9)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'business_cards_username_format_check'
        AND conrelid = 'public.business_cards'::regclass
    ) THEN
        ALTER TABLE public.business_cards
        ADD CONSTRAINT business_cards_username_format_check
        CHECK (username ~ '^[a-z0-9]+$');
    END IF;
END $$;

-- =====================================================
-- Function to generate random 7-character username
-- =====================================================
CREATE OR REPLACE FUNCTION generate_random_card_username()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..7 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Backfill existing business_cards with random usernames
-- =====================================================
DO $$
DECLARE
    card RECORD;
    new_username TEXT;
    is_unique BOOLEAN;
BEGIN
    FOR card IN SELECT id FROM public.business_cards WHERE username IS NULL LOOP
        is_unique := FALSE;
        WHILE NOT is_unique LOOP
            new_username := generate_random_card_username();
            IF NOT EXISTS (SELECT 1 FROM public.business_cards WHERE username = new_username) THEN
                is_unique := TRUE;
            END IF;
        END LOOP;

        UPDATE public.business_cards
        SET username = new_username
        WHERE id = card.id;
    END LOOP;
END $$;

-- =====================================================
-- Make username NOT NULL after backfill
-- =====================================================
ALTER TABLE public.business_cards ALTER COLUMN username SET NOT NULL;

-- =====================================================
-- RLS Policies for public access
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'business_cards'
        AND policyname = 'Public can view business cards by username'
    ) THEN
        CREATE POLICY "Public can view business cards by username"
            ON public.business_cards FOR SELECT
            TO anon
            USING (is_public = true);
    END IF;
END $$;

-- =====================================================
-- Update comment
-- =====================================================
COMMENT ON COLUMN public.business_cards.username IS 'Unique username for public sharing URLs (3-20 chars, a-z 0-9 only, e.g., official.id/c/username or official.id/b/username)';

-- =====================================================
-- Verify: Check if all cards now have usernames
-- =====================================================
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count FROM public.business_cards WHERE username IS NULL;
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Migration incomplete: % business_cards still have NULL username', null_count;
    ELSE
        RAISE NOTICE 'Migration successful: All business_cards now have usernames';
    END IF;
END $$;
