-- Allow public to view organization members and their user profiles in ALL circles (both public and private)
-- This ensures that members on the landing page of private circles have their names and avatars visible.

-- 1. Fix organization_members policy
DROP POLICY IF EXISTS "organization_members_select" ON public.organization_members;

CREATE POLICY "organization_members_select" ON public.organization_members
FOR SELECT USING (
  is_org_member(organization_id, auth.uid())
  OR user_id = auth.uid()
  OR status = 'APPROVED' -- Allow public to see any APPROVED member of any circle
);

-- 2. Fix users policy
DROP POLICY IF EXISTS "Allow public to view users in public organizations" ON public.users;
DROP POLICY IF EXISTS "Allow public to view users in any organizations" ON public.users;

CREATE POLICY "Allow public to view users in any organizations" ON public.users
FOR SELECT
USING (
  id IN (
    SELECT om.user_id
    FROM public.organization_members om
    WHERE om.status = 'APPROVED'
  )
);
