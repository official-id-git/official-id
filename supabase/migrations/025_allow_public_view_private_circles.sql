-- Allow public viewing of all circles so private circles can have a landing page
-- This allows the "Request to Join" page to be displayed for private circles.
-- The organization_members table already prevents public from viewing members of private circles.

DROP POLICY IF EXISTS "Anyone can view public organizations" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can view organizations" ON public.organizations;

CREATE POLICY "Anyone can view organizations"
    ON public.organizations FOR SELECT
    USING (TRUE);
