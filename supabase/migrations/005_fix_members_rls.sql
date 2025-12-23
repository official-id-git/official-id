-- =====================================================
-- MIGRATION: Fix Organization Members RLS
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;
DROP POLICY IF EXISTS "Members can view same org members" ON public.organization_members;
DROP POLICY IF EXISTS "Org members can view other members" ON public.organization_members;
DROP POLICY IF EXISTS "Anyone can view approved members of public orgs" ON public.organization_members;

-- Policy 1: Members of an org can view all members in that org
CREATE POLICY "Org members can view all org members"
    ON public.organization_members FOR SELECT
    USING (
        -- User is a member of the same organization
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND status = 'APPROVED'
        )
        OR
        -- User is the owner of the organization
        organization_id IN (
            SELECT id FROM public.organizations WHERE owner_id = auth.uid()
        )
        OR
        -- Public org - anyone can see approved members
        (
            organization_id IN (
                SELECT id FROM public.organizations WHERE is_public = TRUE
            )
            AND status = 'APPROVED'
        )
    );

-- Policy 2: Fix users table - allow reading user info for org members display
DROP POLICY IF EXISTS "Users can view other users basic info" ON public.users;
DROP POLICY IF EXISTS "Org members can view member profiles" ON public.users;

-- Allow users to read basic info of other users (for org member display)
CREATE POLICY "Users can read other users public info"
    ON public.users FOR SELECT
    USING (
        -- Can always read own profile
        id = auth.uid()
        OR
        -- Can read profiles of users in same organization
        id IN (
            SELECT user_id FROM public.organization_members om
            WHERE om.organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid() AND status = 'APPROVED'
            )
        )
        OR
        -- Can read profiles of users in orgs you own
        id IN (
            SELECT user_id FROM public.organization_members om
            WHERE om.organization_id IN (
                SELECT id FROM public.organizations WHERE owner_id = auth.uid()
            )
        )
        OR
        -- Can read profiles of approved members in public orgs
        id IN (
            SELECT user_id FROM public.organization_members om
            JOIN public.organizations o ON o.id = om.organization_id
            WHERE o.is_public = TRUE AND om.status = 'APPROVED'
        )
    );

-- Ensure organization_members RLS is enabled
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON POLICY "Org members can view all org members" ON public.organization_members IS 'Allow org members to see other members in their organization';
