-- =====================================================
-- Add Username to Organizations for Public Sharing
-- Similar to business cards username feature
-- =====================================================

-- Add username column to organizations
ALTER TABLE public.organizations ADD COLUMN username TEXT;

-- Create unique constraint on username
ALTER TABLE public.organizations ADD CONSTRAINT organizations_username_key UNIQUE (username);

-- Add index for faster username lookups
CREATE INDEX idx_organizations_username ON public.organizations(username);

-- =====================================================
-- Function to generate random 7-character username
-- =====================================================
CREATE OR REPLACE FUNCTION generate_random_username()
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
-- Backfill existing organizations with random usernames
-- =====================================================
DO $$
DECLARE
    org RECORD;
    new_username TEXT;
    is_unique BOOLEAN;
BEGIN
    FOR org IN SELECT id FROM public.organizations WHERE username IS NULL LOOP
        is_unique := FALSE;
        WHILE NOT is_unique LOOP
            new_username := generate_random_username();
            -- Check if username already exists
            IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE username = new_username) THEN
                is_unique := TRUE;
            END IF;
        END LOOP;
        
        UPDATE public.organizations 
        SET username = new_username 
        WHERE id = org.id;
    END LOOP;
END $$;

-- =====================================================
-- Make username NOT NULL after backfill
-- =====================================================
ALTER TABLE public.organizations ALTER COLUMN username SET NOT NULL;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON COLUMN public.organizations.username IS 'Unique 7-character username for public sharing URLs (e.g., official.id/o/username)';
