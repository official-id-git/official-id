-- Allow public access to view public business cards
-- This enables anyone (including non-logged-in users) to view business cards marked as public

-- Drop existing policy if exists (for idempotency)
DROP POLICY IF EXISTS "Allow public to view public business cards" ON public.business_cards;

-- Create policy to allow public access to public business cards
CREATE POLICY "Allow public to view public business cards" ON public.business_cards
FOR SELECT
USING (is_public = true);

-- Add comment
COMMENT ON POLICY "Allow public to view public business cards" ON public.business_cards IS 
'Allows anyone (including non-logged-in users) to view business cards that are marked as public (is_public = true). This enables public sharing of business cards via URLs like /c/{id} or /c/{username}.';
