-- =====================================================
-- MIGRATION: Organization Requests
-- =====================================================

-- Create request status enum if not exists
DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organization_requests table
CREATE TABLE IF NOT EXISTS public.organization_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    message TEXT,
    status request_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.users(id),
    
    -- Prevent duplicate pending requests from same email per organization
    CONSTRAINT unique_pending_request UNIQUE(organization_id, email, status)
);

-- Unique index for pending requests to avoid multiple pending requests
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request ON public.organization_requests (organization_id, email) WHERE status = 'PENDING';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_requests_org_id ON public.organization_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_requests_email ON public.organization_requests(email);
CREATE INDEX IF NOT EXISTS idx_org_requests_status ON public.organization_requests(status);

-- Enable RLS
ALTER TABLE public.organization_requests ENABLE ROW LEVEL SECURITY;

-- Public can insert new requests
DROP POLICY IF EXISTS "Public can request to join" ON public.organization_requests;
CREATE POLICY "Public can request to join"
    ON public.organization_requests FOR INSERT
    WITH CHECK (status = 'PENDING'); -- Allow anonymous users to submit their email, but force status to PENDING

-- Org admins can view requests for their org
DROP POLICY IF EXISTS "Admins can view org requests" ON public.organization_requests;
CREATE POLICY "Admins can view org requests"
    ON public.organization_requests FOR SELECT
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

-- Org admins can manage requests
DROP POLICY IF EXISTS "Admins can update requests" ON public.organization_requests;
CREATE POLICY "Admins can update requests"
    ON public.organization_requests FOR UPDATE
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

-- Try to automatically match requests if a user is created
CREATE OR REPLACE FUNCTION check_approved_requests()
RETURNS TRIGGER AS $$
BEGIN
    -- When a user registers, check if they have an APPROVED request
    -- and automatically add them to the organization if they do
    INSERT INTO public.organization_members (organization_id, user_id, status, joined_at)
    SELECT 
        req.organization_id,
        NEW.id,
        'APPROVED'::membership_status,
        NOW()
    FROM public.organization_requests req
    WHERE req.email = NEW.email 
    AND req.status = 'APPROVED'
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-accepting approved requests
DROP TRIGGER IF EXISTS on_user_created_check_requests ON public.users;
CREATE TRIGGER on_user_created_check_requests
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION check_approved_requests();

COMMENT ON TABLE public.organization_requests IS 'Requests from public users to join private circles via email';
