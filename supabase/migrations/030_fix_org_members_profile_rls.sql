-- =====================================================
-- Fix: Allow organization members to view each other's profiles
-- This fixes the issue where profile photos don't appear
-- on the organization detail page because users RLS
-- only allows viewing your own profile.
-- =====================================================

-- Drop existing policy if exists (for idempotency)
DROP POLICY IF EXISTS "Org members can view co-members profiles" ON public.users;

-- Policy: Users who are in the same organization can view each other's basic info
-- This enables profile photos, names, emails to show in member lists
CREATE POLICY "Org members can view co-members profiles"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om1
            JOIN organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth.uid()
            AND om2.user_id = users.id
            AND om1.status = 'APPROVED'
            AND om2.status IN ('APPROVED', 'PENDING')
        )
    );

-- Also allow viewing business cards of organization co-members
-- (even if not marked as public, members should see each other's cards)
DROP POLICY IF EXISTS "Org members can view co-members cards" ON public.business_cards;

CREATE POLICY "Org members can view co-members cards"
    ON public.business_cards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_members om1
            JOIN organization_members om2 ON om1.organization_id = om2.organization_id
            WHERE om1.user_id = auth.uid()
            AND om2.user_id = business_cards.user_id
            AND om1.status = 'APPROVED'
            AND om2.status IN ('APPROVED', 'PENDING')
        )
    );
