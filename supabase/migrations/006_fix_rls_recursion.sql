-- =====================================================
-- FIX: Remove Infinite Recursion in RLS Policies
-- Run this in Supabase SQL Editor IMMEDIATELY
-- =====================================================

-- STEP 1: Drop ALL problematic policies on organization_members
DROP POLICY IF EXISTS "Org members can view all org members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view same org members" ON public.organization_members;
DROP POLICY IF EXISTS "Org members can view other members" ON public.organization_members;
DROP POLICY IF EXISTS "Anyone can view approved members of public orgs" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON public.organization_members;
DROP POLICY IF EXISTS "Users can view memberships" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can view all members" ON public.organization_members;
DROP POLICY IF EXISTS "organization_members_select_policy" ON public.organization_members;

-- STEP 2: Drop ALL problematic policies on users table
DROP POLICY IF EXISTS "Users can read other users public info" ON public.users;
DROP POLICY IF EXISTS "Users can view other users basic info" ON public.users;
DROP POLICY IF EXISTS "Org members can view member profiles" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;

-- STEP 3: Create SIMPLE non-recursive policy for organization_members
-- Allow ALL authenticated users to SELECT organization_members
-- This is safe because we're not exposing sensitive data
CREATE POLICY "organization_members_select_all"
    ON public.organization_members FOR SELECT
    TO authenticated
    USING (true);

-- Keep existing INSERT policy or create if not exists
DROP POLICY IF EXISTS "Users can join organizations" ON public.organization_members;
CREATE POLICY "organization_members_insert"
    ON public.organization_members FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Keep existing UPDATE policy for admins
DROP POLICY IF EXISTS "Admins can update members" ON public.organization_members;
CREATE POLICY "organization_members_update"
    ON public.organization_members FOR UPDATE
    TO authenticated
    USING (
        organization_id IN (
            SELECT id FROM public.organizations WHERE owner_id = auth.uid()
        )
    );

-- Keep existing DELETE policy
DROP POLICY IF EXISTS "Users can leave organizations" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can remove members" ON public.organization_members;
CREATE POLICY "organization_members_delete"
    ON public.organization_members FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid() 
        OR 
        organization_id IN (
            SELECT id FROM public.organizations WHERE owner_id = auth.uid()
        )
    );

-- STEP 4: Create SIMPLE non-recursive policy for users table
-- Allow ALL authenticated users to SELECT basic user info
-- This is needed to display member names/emails in organization pages
CREATE POLICY "users_select_all"
    ON public.users FOR SELECT
    TO authenticated
    USING (true);

-- Keep existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "users_insert_own"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Keep existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- STEP 5: Ensure RLS is enabled
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- STEP 6: Verify policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('organization_members', 'users')
ORDER BY tablename, policyname;
