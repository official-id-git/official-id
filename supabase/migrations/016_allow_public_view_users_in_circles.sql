-- Allow public access to view user info for organization members
-- This enables public circle pages to show member names and avatars

-- Drop existing policy if exists (for idempotency)
DROP POLICY IF EXISTS "Allow public to view users in public organizations" ON public.users;

-- Create policy to allow public access to users who are approved members of public organizations
CREATE POLICY "Allow public to view users in public organizations" ON public.users
FOR SELECT
USING (
  id IN (
    SELECT om.user_id
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE o.is_public = true
    AND om.status = 'APPROVED'
  )
);

-- Add comment
COMMENT ON POLICY "Allow public to view users in public organizations" ON public.users IS 
'Allows anyone (including non-logged-in users) to view basic user info (name, avatar) for approved members of public organizations. This enables public circle pages to display member information.';
