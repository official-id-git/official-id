-- =====================================================
-- Migration: KTA (Kartu Tanda Anggota) Feature
-- Created: 2026-03-06
-- Description: Tables for member card system in circles
-- =====================================================

-- Add missing profile fields to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS professional_competency TEXT;

-- =====================================================
-- KTA TEMPLATES TABLE
-- One template per circle (organization)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kta_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    template_image_url TEXT NOT NULL,
    field_positions JSONB NOT NULL DEFAULT '{
        "name": {"x": 50, "y": 120, "width": 200, "height": 30, "fontSize": 16, "fontColor": "#000000"},
        "kta_number": {"x": 50, "y": 160, "width": 200, "height": 20, "fontSize": 12, "fontColor": "#333333"},
        "photo": {"x": 260, "y": 60, "width": 80, "height": 100},
        "qrcode": {"x": 260, "y": 170, "width": 60, "height": 60}
    }'::jsonb,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_template_per_org UNIQUE(organization_id)
);

-- =====================================================
-- KTA NUMBERS TABLE
-- Pool of KTA numbers uploaded by admin via Excel
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kta_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    kta_number TEXT NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_to UUID REFERENCES public.users(id),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_kta_number_per_org UNIQUE(organization_id, kta_number)
);

-- =====================================================
-- KTA APPLICATIONS TABLE
-- Member applications and generated cards
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kta_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    kta_number_id UUID REFERENCES public.kta_numbers(id),
    full_name TEXT NOT NULL,
    company TEXT,
    birth_place TEXT,
    birth_date DATE,
    professional_competency TEXT,
    photo_url TEXT NOT NULL,
    city TEXT,
    province TEXT,
    whatsapp_number TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'GENERATED', 'FAILED')),
    generated_card_url TEXT,
    gdrive_file_id TEXT,
    gdrive_pdf_url TEXT,
    verification_token UUID NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_kta_per_member_per_org UNIQUE(organization_id, user_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_kta_templates_org_id ON public.kta_templates(organization_id);
CREATE INDEX idx_kta_numbers_org_id ON public.kta_numbers(organization_id);
CREATE INDEX idx_kta_numbers_is_used ON public.kta_numbers(is_used);
CREATE INDEX idx_kta_numbers_order ON public.kta_numbers(organization_id, order_index);
CREATE INDEX idx_kta_applications_org_id ON public.kta_applications(organization_id);
CREATE INDEX idx_kta_applications_user_id ON public.kta_applications(user_id);
CREATE INDEX idx_kta_applications_status ON public.kta_applications(status);
CREATE INDEX idx_kta_applications_token ON public.kta_applications(verification_token);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_kta_templates_updated_at
    BEFORE UPDATE ON public.kta_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kta_applications_updated_at
    BEFORE UPDATE ON public.kta_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE public.kta_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kta_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kta_applications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: kta_templates
-- =====================================================

-- Public can view templates (needed for landing page)
CREATE POLICY "Anyone can view kta templates"
    ON public.kta_templates FOR SELECT
    USING (true);

-- Circle admin/owner can insert templates
CREATE POLICY "Circle admins can create kta templates"
    ON public.kta_templates FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = kta_templates.organization_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = kta_templates.organization_id
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- Circle admin/owner can update templates
CREATE POLICY "Circle admins can update kta templates"
    ON public.kta_templates FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = kta_templates.organization_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = kta_templates.organization_id
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- Circle admin/owner can delete templates
CREATE POLICY "Circle admins can delete kta templates"
    ON public.kta_templates FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = kta_templates.organization_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = kta_templates.organization_id
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- =====================================================
-- RLS POLICIES: kta_numbers
-- =====================================================

-- Circle admins can view kta numbers for their circles
CREATE POLICY "Circle admins can view kta numbers"
    ON public.kta_numbers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = kta_numbers.organization_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = kta_numbers.organization_id
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- Circle admins can insert kta numbers
CREATE POLICY "Circle admins can create kta numbers"
    ON public.kta_numbers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = kta_numbers.organization_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = kta_numbers.organization_id
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- Circle admins can update kta numbers
CREATE POLICY "Circle admins can update kta numbers"
    ON public.kta_numbers FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = kta_numbers.organization_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = kta_numbers.organization_id
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- Circle admins can delete kta numbers
CREATE POLICY "Circle admins can delete kta numbers"
    ON public.kta_numbers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = kta_numbers.organization_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = kta_numbers.organization_id
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- =====================================================
-- RLS POLICIES: kta_applications
-- =====================================================

-- Members can view own applications
CREATE POLICY "Members can view own kta applications"
    ON public.kta_applications FOR SELECT
    USING (auth.uid() = user_id);

-- Circle admins can view all applications in their circle
CREATE POLICY "Circle admins can view all kta applications"
    ON public.kta_applications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = kta_applications.organization_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = kta_applications.organization_id
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- Public can view by verification token (for QR verification)
CREATE POLICY "Public can verify kta by token"
    ON public.kta_applications FOR SELECT
    USING (status = 'GENERATED');

-- Members can create own applications
CREATE POLICY "Members can create kta applications"
    ON public.kta_applications FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = kta_applications.organization_id
            AND om.user_id = auth.uid()
            AND om.status = 'APPROVED'
        )
    );

-- Circle admins can update applications (status changes)
CREATE POLICY "Circle admins can update kta applications"
    ON public.kta_applications FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id = kta_applications.organization_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR EXISTS (
            SELECT 1 FROM public.organizations o
            WHERE o.id = kta_applications.organization_id
            AND o.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.kta_templates IS 'KTA card template configuration per circle';
COMMENT ON TABLE public.kta_numbers IS 'Pool of KTA numbers uploaded by admin for sequential assignment';
COMMENT ON TABLE public.kta_applications IS 'Member KTA applications and generated cards';
