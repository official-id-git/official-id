-- Update username constraint to allow 3-20 characters
-- Run this in Supabase SQL Editor

-- Add CHECK constraint for username length
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_username_length_check 
CHECK (char_length(username) >= 3 AND char_length(username) <= 20);

-- Add CHECK constraint for alphanumeric only (a-z, 0-9)
ALTER TABLE public.organizations 
ADD CONSTRAINT organizations_username_format_check 
CHECK (username ~ '^[a-z0-9]+$');

-- Update comment
COMMENT ON COLUMN public.organizations.username IS 'Unique username for public sharing URLs (3-20 chars, a-z 0-9 only, e.g., official.id/o/username)';
