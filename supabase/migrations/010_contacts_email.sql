-- =====================================================
-- PHASE 6: Contacts & Email Notifications
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create contacts table (scanned business cards)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    job_title VARCHAR(255),
    source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'scan', 'import'
    scanned_image_url TEXT,
    notes TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    recipient_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL, -- 'card_scanned', 'payment_verified', 'contact_card_share'
    subject VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    metadata JSONB,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add notification preferences to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS notify_on_scan BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_on_payment BOOLEAN DEFAULT TRUE;

-- 4. Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for contacts
CREATE POLICY "contacts_select_own"
    ON public.contacts FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "contacts_insert_own"
    ON public.contacts FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "contacts_update_own"
    ON public.contacts FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "contacts_delete_own"
    ON public.contacts FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- 6. RLS Policies for email_logs
CREATE POLICY "email_logs_select_own"
    ON public.email_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "email_logs_insert"
    ON public.email_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- 8. Verify tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('contacts', 'email_logs');
