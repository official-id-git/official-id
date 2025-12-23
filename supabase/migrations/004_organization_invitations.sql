-- =====================================================
-- MIGRATION: Add Organization Invitations
-- Run this in Supabase SQL Editor
-- =====================================================

-- Create invitation status enum if not exists
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organization invitations table
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status invitation_status NOT NULL DEFAULT 'PENDING',
    token UUID DEFAULT uuid_generate_v4(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate pending invitations
    CONSTRAINT unique_pending_invitation UNIQUE(organization_id, email)
);

-- Indexes for invitations
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON public.organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.organization_invitations(status);

-- RLS Policies for invitations

-- Enable RLS
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- Org admins can view invitations for their org
CREATE POLICY "Admins can view org invitations"
    ON public.organization_invitations FOR SELECT
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

-- Users can view invitations sent to their email
CREATE POLICY "Users can view own invitations"
    ON public.organization_invitations FOR SELECT
    USING (
        email IN (
            SELECT email FROM public.users WHERE id = auth.uid()
        )
    );

-- Org admins can create invitations
CREATE POLICY "Admins can create invitations"
    ON public.organization_invitations FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT id FROM public.organizations WHERE owner_id = auth.uid()
        )
        OR
        organization_id IN (
            SELECT organization_id FROM public.organization_members 
            WHERE user_id = auth.uid() AND is_admin = TRUE
        )
    );

-- Org admins can update/cancel invitations
CREATE POLICY "Admins can manage invitations"
    ON public.organization_invitations FOR UPDATE
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

-- Org admins can delete invitations
CREATE POLICY "Admins can delete invitations"
    ON public.organization_invitations FOR DELETE
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

-- Function to auto-accept invitation when user registers/logs in
CREATE OR REPLACE FUNCTION check_pending_invitations()
RETURNS TRIGGER AS $$
BEGIN
    -- When a user is created, check for pending invitations with their email
    -- and auto-add them to organizations (with PENDING status if approval required)
    INSERT INTO public.organization_members (organization_id, user_id, status, joined_at)
    SELECT 
        oi.organization_id,
        NEW.id,
        CASE 
            WHEN o.require_approval THEN 'APPROVED'::membership_status -- Invited users bypass approval
            ELSE 'APPROVED'::membership_status
        END,
        NOW()
    FROM public.organization_invitations oi
    JOIN public.organizations o ON o.id = oi.organization_id
    WHERE oi.email = NEW.email 
    AND oi.status = 'PENDING'
    AND oi.expires_at > NOW()
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    -- Mark invitations as accepted
    UPDATE public.organization_invitations
    SET status = 'ACCEPTED', accepted_at = NOW()
    WHERE email = NEW.email AND status = 'PENDING';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-accepting invitations
DROP TRIGGER IF EXISTS on_user_created_check_invitations ON public.users;
CREATE TRIGGER on_user_created_check_invitations
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION check_pending_invitations();

-- Add comment
COMMENT ON TABLE public.organization_invitations IS 'Email invitations for private organizations';
