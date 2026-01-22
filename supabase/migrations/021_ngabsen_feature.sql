-- =====================================================
-- Ngabsen Feature - Attendance/Check-in System
-- For PAID_USER and APP_ADMIN only
-- =====================================================

-- =====================================================
-- TABLES
-- =====================================================

-- Table 1: ngabsen (Events/Acara)
CREATE TABLE IF NOT EXISTS public.ngabsen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    nama_acara TEXT NOT NULL,
    tempat_acara TEXT NOT NULL,
    tanggal_acara DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 2: pendaftaran_ngabsen (Attendee Registrations)
CREATE TABLE IF NOT EXISTS public.pendaftaran_ngabsen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ngabsen_id UUID NOT NULL REFERENCES public.ngabsen(id) ON DELETE CASCADE,
    nama_peserta TEXT NOT NULL,
    deskripsi TEXT,
    email TEXT NOT NULL,
    no_whatsapp TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table 3: link_ngabsen (Public Links)
CREATE TABLE IF NOT EXISTS public.link_ngabsen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ngabsen_id UUID NOT NULL REFERENCES public.ngabsen(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    link_pendaftaran TEXT NOT NULL UNIQUE,
    link_daftar_peserta TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one link set per ngabsen
    CONSTRAINT unique_link_per_ngabsen UNIQUE(ngabsen_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- ngabsen indexes
CREATE INDEX idx_ngabsen_user_id ON public.ngabsen(user_id);
CREATE INDEX idx_ngabsen_tanggal ON public.ngabsen(tanggal_acara);

-- pendaftaran_ngabsen indexes
CREATE INDEX idx_pendaftaran_ngabsen_id ON public.pendaftaran_ngabsen(ngabsen_id);
CREATE INDEX idx_pendaftaran_created_at ON public.pendaftaran_ngabsen(created_at DESC);

-- link_ngabsen indexes
CREATE INDEX idx_link_ngabsen_pendaftaran ON public.link_ngabsen(link_pendaftaran);
CREATE INDEX idx_link_ngabsen_peserta ON public.link_ngabsen(link_daftar_peserta);
CREATE INDEX idx_link_ngabsen_user_id ON public.link_ngabsen(user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger for ngabsen
CREATE TRIGGER update_ngabsen_updated_at
    BEFORE UPDATE ON public.ngabsen
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to check if user can create ngabsen (must be PAID_USER or APP_ADMIN)
CREATE OR REPLACE FUNCTION check_ngabsen_creation_permission()
RETURNS TRIGGER AS $$
DECLARE
    user_current_role user_role;
BEGIN
    SELECT role INTO user_current_role
    FROM public.users
    WHERE id = NEW.user_id;
    
    IF user_current_role NOT IN ('PAID_USER', 'APP_ADMIN') THEN
        RAISE EXCEPTION 'Hanya pengguna premium yang dapat membuat acara Ngabsen. Silakan upgrade akun Anda terlebih dahulu.';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate ngabsen_id exists for public registration
CREATE OR REPLACE FUNCTION validate_ngabsen_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- Verify ngabsen exists
    IF NOT EXISTS (SELECT 1 FROM public.ngabsen WHERE id = NEW.ngabsen_id) THEN
        RAISE EXCEPTION 'Acara tidak ditemukan';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS FOR FUNCTIONS
-- =====================================================

-- Check permission before creating ngabsen
CREATE TRIGGER check_ngabsen_permission_before_insert
    BEFORE INSERT ON public.ngabsen
    FOR EACH ROW
    EXECUTE FUNCTION check_ngabsen_creation_permission();

-- Validate registration
CREATE TRIGGER validate_registration_before_insert
    BEFORE INSERT ON public.pendaftaran_ngabsen
    FOR EACH ROW
    EXECUTE FUNCTION validate_ngabsen_registration();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.ngabsen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendaftaran_ngabsen ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_ngabsen ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- NGABSEN TABLE POLICIES
-- =====================================================

-- Users can view their own ngabsen events
CREATE POLICY "Users can view own ngabsen"
    ON public.ngabsen FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create ngabsen (trigger checks role)
CREATE POLICY "Paid users can create ngabsen"
    ON public.ngabsen FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own ngabsen
CREATE POLICY "Users can update own ngabsen"
    ON public.ngabsen FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own ngabsen
CREATE POLICY "Users can delete own ngabsen"
    ON public.ngabsen FOR DELETE
    USING (auth.uid() = user_id);

-- Public can view ngabsen for valid links (needed for form display)
CREATE POLICY "Public can view ngabsen via link"
    ON public.ngabsen FOR SELECT
    USING (
        id IN (
            SELECT ngabsen_id FROM public.link_ngabsen
        )
    );

-- =====================================================
-- PENDAFTARAN_NGABSEN TABLE POLICIES
-- =====================================================

-- Public can insert registration (no auth required)
CREATE POLICY "Public can register for ngabsen"
    ON public.pendaftaran_ngabsen FOR INSERT
    WITH CHECK (true);

-- Public can view registrations for valid ngabsen with public link
CREATE POLICY "Public can view registrations via link"
    ON public.pendaftaran_ngabsen FOR SELECT
    USING (
        ngabsen_id IN (
            SELECT ngabsen_id FROM public.link_ngabsen
        )
    );

-- Ngabsen owners can view their registrations
CREATE POLICY "Owners can view registrations"
    ON public.pendaftaran_ngabsen FOR SELECT
    USING (
        ngabsen_id IN (
            SELECT id FROM public.ngabsen WHERE user_id = auth.uid()
        )
    );

-- Ngabsen owners can delete registrations
CREATE POLICY "Owners can delete registrations"
    ON public.pendaftaran_ngabsen FOR DELETE
    USING (
        ngabsen_id IN (
            SELECT id FROM public.ngabsen WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- LINK_NGABSEN TABLE POLICIES
-- =====================================================

-- Users can view their own links
CREATE POLICY "Users can view own links"
    ON public.link_ngabsen FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create links for their ngabsen
CREATE POLICY "Users can create links"
    ON public.link_ngabsen FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND ngabsen_id IN (
            SELECT id FROM public.ngabsen WHERE user_id = auth.uid()
        )
    );

-- Users can delete their own links
CREATE POLICY "Users can delete own links"
    ON public.link_ngabsen FOR DELETE
    USING (auth.uid() = user_id);

-- Public can view links (for lookup)
CREATE POLICY "Public can view links"
    ON public.link_ngabsen FOR SELECT
    USING (true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.ngabsen IS 'Events/acara for the Ngabsen attendance feature (PAID_USER only)';
COMMENT ON TABLE public.pendaftaran_ngabsen IS 'Public attendee registrations for ngabsen events';
COMMENT ON TABLE public.link_ngabsen IS 'Public shareable links for ngabsen registration and attendee list';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
