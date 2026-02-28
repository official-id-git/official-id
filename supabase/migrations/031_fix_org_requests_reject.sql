-- =====================================================
-- Fix: Allow admins to reject requests that were previously rejected
-- The UNIQUE(organization_id, email, status) constraint prevents
-- rejecting a second request from the same email.
-- Solution: Drop the constraint and add a DELETE policy for admins.
-- =====================================================

-- Drop the problematic unique constraint that blocks re-rejection
ALTER TABLE public.organization_requests DROP CONSTRAINT IF EXISTS unique_pending_request;

-- The unique index for pending requests is sufficient to prevent duplicate PENDING requests
-- idx_unique_pending_request already handles this (WHERE status = 'PENDING')

-- Add DELETE policy so admins can clean up old reviewed requests
DROP POLICY IF EXISTS "Admins can delete requests" ON public.organization_requests;

CREATE POLICY "Admins can delete requests"
    ON public.organization_requests FOR DELETE
    USING (
        organization_id IN (
            SELECT id FROM public.organizations WHERE owner_id = auth.uid()
        )
        OR
        organization_id IN (
            SELECT organization_id FROM public.organization_members
            WHERE user_id = auth.uid() AND is_admin = TRUE
        )
    );
