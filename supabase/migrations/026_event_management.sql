-- =====================================================
-- Event Management for Circles/Organizations
-- Tables: events, event_registrations
-- =====================================================

-- Create event type enum
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('online', 'offline');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create event status enum
DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('upcoming', 'past', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create registration status enum
DO $$ BEGIN
    CREATE TYPE registration_status AS ENUM ('confirmed', 'pending', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'Workshop',
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    type event_type NOT NULL DEFAULT 'online',
    status event_status NOT NULL DEFAULT 'upcoming',

    -- Location (offline)
    location TEXT,
    google_map_url TEXT,

    -- Link (online)
    zoom_link TEXT,

    -- Capacity
    max_participants INTEGER NOT NULL DEFAULT 100,

    -- Media
    image_url TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- EVENT REGISTRATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Participant info (allows non-logged-in registration)
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    institution TEXT,

    status registration_status NOT NULL DEFAULT 'pending',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Prevent duplicate registrations per event per email
    CONSTRAINT unique_registration_per_event UNIQUE(event_id, email)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_events_org_id ON public.events(organization_id);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_event_registrations_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_registrations_user_id ON public.event_registrations(user_id);
CREATE INDEX idx_event_registrations_email ON public.event_registrations(email);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- EVENTS RLS POLICIES
-- =====================================================

-- 1. Anyone can view events (public landing page)
CREATE POLICY "Anyone can view events"
    ON public.events FOR SELECT
    USING (TRUE);

-- 2. Circle admin/owner can create events for their circle
CREATE POLICY "Circle admins can create events"
    ON public.events FOR INSERT
    WITH CHECK (
        -- User is the org owner
        EXISTS (
            SELECT 1 FROM public.organizations
            WHERE id = organization_id AND owner_id = auth.uid()
        )
        OR
        -- User is an admin member of the org
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = events.organization_id
            AND user_id = auth.uid()
            AND is_admin = TRUE
            AND status = 'APPROVED'
        )
        OR
        -- User is APP_ADMIN
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    );

-- 3. Circle admin/owner can update events for their circle
CREATE POLICY "Circle admins can update events"
    ON public.events FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organizations
            WHERE id = organization_id AND owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = events.organization_id
            AND user_id = auth.uid()
            AND is_admin = TRUE
            AND status = 'APPROVED'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    );

-- 4. Circle admin/owner can delete events for their circle
CREATE POLICY "Circle admins can delete events"
    ON public.events FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organizations
            WHERE id = organization_id AND owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = events.organization_id
            AND user_id = auth.uid()
            AND is_admin = TRUE
            AND status = 'APPROVED'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    );

-- =====================================================
-- EVENT REGISTRATIONS RLS POLICIES
-- =====================================================

-- 1. Anyone can view registrations (for participant list display)
CREATE POLICY "Anyone can view registrations"
    ON public.event_registrations FOR SELECT
    USING (TRUE);

-- 2. Anyone can register for events (including non-auth users via anon key)
CREATE POLICY "Anyone can register for events"
    ON public.event_registrations FOR INSERT
    WITH CHECK (TRUE);

-- 3. Circle admins can update registration status
CREATE POLICY "Circle admins can update registrations"
    ON public.event_registrations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.organizations o ON o.id = e.organization_id
            WHERE e.id = event_id AND o.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.organization_members om ON om.organization_id = e.organization_id
            WHERE e.id = event_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    );

-- 4. Circle admins can delete registrations
CREATE POLICY "Circle admins can delete registrations"
    ON public.event_registrations FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.organizations o ON o.id = e.organization_id
            WHERE e.id = event_id AND o.owner_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.events e
            JOIN public.organization_members om ON om.organization_id = e.organization_id
            WHERE e.id = event_id
            AND om.user_id = auth.uid()
            AND om.is_admin = TRUE
            AND om.status = 'APPROVED'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'APP_ADMIN'
        )
    );

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.events IS 'Events managed by circle/organization admins';
COMMENT ON TABLE public.event_registrations IS 'Participant registrations for events';
