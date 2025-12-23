-- =====================================================
-- Digital Business Card & Organization Directory
-- Database Schema for Supabase PostgreSQL
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

-- User role enum
CREATE TYPE user_role AS ENUM ('FREE_USER', 'PAID_USER', 'APP_ADMIN');

-- Payment status enum
CREATE TYPE payment_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Organization membership status enum
CREATE TYPE membership_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- =====================================================
-- TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'FREE_USER',
    payment_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Business cards table
CREATE TABLE IF NOT EXISTS public.business_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    job_title TEXT,
    company TEXT,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    website TEXT,
    profile_photo_url TEXT,
    
    -- Social media links (JSON)
    social_links JSONB DEFAULT '{}',
    
    -- Privacy settings
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    visible_fields JSONB DEFAULT '{"email": true, "phone": true, "website": true, "social_links": true}',
    
    -- QR Code
    qr_code_url TEXT,
    
    -- Metadata
    scan_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_email_per_user UNIQUE(user_id, email)
);

-- Organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    category TEXT,
    
    -- Owner (must be PAID_USER)
    owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Settings
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    require_approval BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organization members table
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status membership_status NOT NULL DEFAULT 'PENDING',
    
    -- Role in organization (for future expansion)
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    
    joined_at TIMESTAMPTZ,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT unique_member_per_org UNIQUE(organization_id, user_id)
);

-- User relationships table (client-provider tracking from QR scans)
CREATE TABLE IF NOT EXISTS public.user_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Provider = card owner
    provider_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Client = person who scanned
    client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Which card was scanned
    business_card_id UUID NOT NULL REFERENCES public.business_cards(id) ON DELETE CASCADE,
    
    -- Metadata
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    
    -- Constraints
    CONSTRAINT unique_relationship UNIQUE(provider_id, client_id, business_card_id)
);

-- Payment transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Payment details
    amount INTEGER NOT NULL DEFAULT 25000,
    proof_url TEXT NOT NULL,
    status payment_status NOT NULL DEFAULT 'PENDING',
    
    -- Admin review
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Business cards indexes
CREATE INDEX idx_business_cards_user_id ON public.business_cards(user_id);
CREATE INDEX idx_business_cards_email ON public.business_cards(email);
CREATE INDEX idx_business_cards_is_public ON public.business_cards(is_public);

-- Organizations indexes
CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX idx_organizations_is_public ON public.organizations(is_public);

-- Organization members indexes
CREATE INDEX idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_org_members_status ON public.organization_members(status);

-- User relationships indexes
CREATE INDEX idx_relationships_provider_id ON public.user_relationships(provider_id);
CREATE INDEX idx_relationships_client_id ON public.user_relationships(client_id);
CREATE INDEX idx_relationships_card_id ON public.user_relationships(business_card_id);

-- Payment transactions indexes
CREATE INDEX idx_payments_user_id ON public.payment_transactions(user_id);
CREATE INDEX idx_payments_status ON public.payment_transactions(status);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check business card limit for FREE users
CREATE OR REPLACE FUNCTION check_business_card_limit()
RETURNS TRIGGER AS $$
DECLARE
    user_card_count INTEGER;
    user_current_role user_role;
BEGIN
    -- Get user role
    SELECT role INTO user_current_role
    FROM public.users
    WHERE id = NEW.user_id;
    
    -- If user is FREE_USER, check limit
    IF user_current_role = 'FREE_USER' THEN
        SELECT COUNT(*) INTO user_card_count
        FROM public.business_cards
        WHERE user_id = NEW.user_id;
        
        IF user_card_count >= 1 THEN
            RAISE EXCEPTION 'FREE_USER dapat membuat maksimal 1 kartu bisnis. Upgrade ke akun berbayar untuk membuat lebih banyak kartu.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create organization (must be PAID_USER)
CREATE OR REPLACE FUNCTION check_organization_creation_permission()
RETURNS TRIGGER AS $$
DECLARE
    user_current_role user_role;
BEGIN
    SELECT role INTO user_current_role
    FROM public.users
    WHERE id = NEW.owner_id;
    
    IF user_current_role NOT IN ('PAID_USER', 'APP_ADMIN') THEN
        RAISE EXCEPTION 'Hanya pengguna berbayar yang dapat membuat organisasi. Silakan upgrade akun Anda terlebih dahulu.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to increment scan count
CREATE OR REPLACE FUNCTION increment_scan_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.business_cards
    SET scan_count = scan_count + 1
    WHERE id = NEW.business_card_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle payment approval
CREATE OR REPLACE FUNCTION handle_payment_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'APPROVED' AND OLD.status != 'APPROVED' THEN
        -- Update user role to PAID_USER
        UPDATE public.users
        SET 
            role = 'PAID_USER',
            payment_verified_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-approve organization owner as member
CREATE OR REPLACE FUNCTION auto_approve_organization_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        status,
        is_admin,
        joined_at,
        approved_at
    ) VALUES (
        NEW.id,
        NEW.owner_id,
        'APPROVED',
        TRUE,
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_cards_updated_at
    BEFORE UPDATE ON public.business_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Business card limit trigger
CREATE TRIGGER check_card_limit_before_insert
    BEFORE INSERT ON public.business_cards
    FOR EACH ROW
    EXECUTE FUNCTION check_business_card_limit();

-- Organization creation permission trigger
CREATE TRIGGER check_org_permission_before_insert
    BEFORE INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION check_organization_creation_permission();

-- Scan count increment trigger
CREATE TRIGGER increment_scan_on_relationship_create
    AFTER INSERT ON public.user_relationships
    FOR EACH ROW
    EXECUTE FUNCTION increment_scan_count();

-- Payment approval trigger
CREATE TRIGGER handle_payment_approval_trigger
    AFTER UPDATE ON public.payment_transactions
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION handle_payment_approval();

-- Auto-approve organization owner trigger
CREATE TRIGGER auto_approve_owner_as_member
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_organization_owner();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    );

-- Admins can update user roles
CREATE POLICY "Admins can update user roles"
    ON public.users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    );

-- =====================================================
-- BUSINESS CARDS TABLE POLICIES
-- =====================================================

-- Users can view their own cards
CREATE POLICY "Users can view own cards"
    ON public.business_cards FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view public cards
CREATE POLICY "Anyone can view public cards"
    ON public.business_cards FOR SELECT
    USING (is_public = TRUE);

-- Users can view cards of members in same organization
CREATE POLICY "Members can view organization cards"
    ON public.business_cards FOR SELECT
    USING (
        user_id IN (
            SELECT om.user_id
            FROM public.organization_members om
            WHERE om.organization_id IN (
                SELECT organization_id
                FROM public.organization_members
                WHERE user_id = auth.uid() AND status = 'APPROVED'
            )
            AND om.status = 'APPROVED'
        )
    );

-- Users can create cards
CREATE POLICY "Users can create own cards"
    ON public.business_cards FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own cards
CREATE POLICY "Users can update own cards"
    ON public.business_cards FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own cards
CREATE POLICY "Users can delete own cards"
    ON public.business_cards FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- ORGANIZATIONS TABLE POLICIES
-- =====================================================

-- Anyone can view public organizations
CREATE POLICY "Anyone can view public organizations"
    ON public.organizations FOR SELECT
    USING (is_public = TRUE);

-- Members can view their organizations
CREATE POLICY "Members can view own organizations"
    ON public.organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Paid users can create organizations
CREATE POLICY "Paid users can create organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (
        auth.uid() = owner_id
        AND EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role IN ('PAID_USER', 'APP_ADMIN')
        )
    );

-- Owners can update their organizations
CREATE POLICY "Owners can update own organizations"
    ON public.organizations FOR UPDATE
    USING (auth.uid() = owner_id);

-- Owners can delete their organizations
CREATE POLICY "Owners can delete own organizations"
    ON public.organizations FOR DELETE
    USING (auth.uid() = owner_id);

-- =====================================================
-- ORGANIZATION MEMBERS TABLE POLICIES
-- =====================================================

-- Members can view members of their organizations
CREATE POLICY "Members can view organization members"
    ON public.organization_members FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Users can request to join organizations
CREATE POLICY "Users can join organizations"
    ON public.organization_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Organization admins can approve/reject members
CREATE POLICY "Admins can manage members"
    ON public.organization_members FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id
            FROM public.organization_members
            WHERE user_id = auth.uid() AND is_admin = TRUE
        )
        OR
        organization_id IN (
            SELECT id FROM public.organizations
            WHERE owner_id = auth.uid()
        )
    );

-- Users can leave organizations (delete their membership)
CREATE POLICY "Users can leave organizations"
    ON public.organization_members FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- USER RELATIONSHIPS TABLE POLICIES
-- =====================================================

-- Users can view relationships where they are provider or client
CREATE POLICY "Users can view own relationships"
    ON public.user_relationships FOR SELECT
    USING (
        auth.uid() = provider_id
        OR auth.uid() = client_id
    );

-- System can create relationships (public insert for QR scan flow)
CREATE POLICY "Authenticated users can create relationships"
    ON public.user_relationships FOR INSERT
    WITH CHECK (
        auth.uid() = client_id
    );

-- Users can update their relationship notes
CREATE POLICY "Users can update own relationship notes"
    ON public.user_relationships FOR UPDATE
    USING (
        auth.uid() = provider_id
        OR auth.uid() = client_id
    );

-- =====================================================
-- PAYMENT TRANSACTIONS TABLE POLICIES
-- =====================================================

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
    ON public.payment_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create payment requests
CREATE POLICY "Users can create payment requests"
    ON public.payment_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
    ON public.payment_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    );

-- Admins can approve/reject payments
CREATE POLICY "Admins can manage payments"
    ON public.payment_transactions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    );

-- =====================================================
-- INITIAL DATA / SEED
-- =====================================================

-- Note: Initial admin user will be created via Supabase Auth
-- After first admin signs up with ADMIN_EMAIL, manually update their role:
-- UPDATE public.users SET role = 'APP_ADMIN' WHERE email = 'admin@official-id.app';

-- =====================================================
-- HELPFUL VIEWS
-- =====================================================

-- View: User with card count
CREATE OR REPLACE VIEW user_card_summary AS
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    COUNT(bc.id) as total_cards,
    u.created_at
FROM public.users u
LEFT JOIN public.business_cards bc ON u.id = bc.user_id
GROUP BY u.id;

-- View: Organization with member count
CREATE OR REPLACE VIEW organization_summary AS
SELECT 
    o.id,
    o.name,
    o.owner_id,
    u.full_name as owner_name,
    COUNT(om.id) FILTER (WHERE om.status = 'APPROVED') as total_members,
    COUNT(om.id) FILTER (WHERE om.status = 'PENDING') as pending_requests,
    o.created_at
FROM public.organizations o
LEFT JOIN public.users u ON o.owner_id = u.id
LEFT JOIN public.organization_members om ON o.id = om.organization_id
GROUP BY o.id, u.full_name;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.users IS 'Extended user profile table linked to Supabase auth.users';
COMMENT ON TABLE public.business_cards IS 'Digital business cards with QR code support';
COMMENT ON TABLE public.organizations IS 'Organizations/groups that users can join';
COMMENT ON TABLE public.organization_members IS 'Membership tracking with approval workflow';
COMMENT ON TABLE public.user_relationships IS 'Client-provider relationships from QR scans';
COMMENT ON TABLE public.payment_transactions IS 'Manual payment processing with admin approval';

-- =====================================================
-- END OF SCHEMA
-- =====================================================