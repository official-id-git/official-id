-- =====================================================
-- PHASE 5: Admin Panel & Payment Verification RLS
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add verified_by and verified_at columns to payment_transactions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' AND column_name = 'verified_by') THEN
    ALTER TABLE public.payment_transactions ADD COLUMN verified_by UUID REFERENCES public.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' AND column_name = 'verified_at') THEN
    ALTER TABLE public.payment_transactions ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' AND column_name = 'notes') THEN
    ALTER TABLE public.payment_transactions ADD COLUMN notes TEXT;
  END IF;
END $$;

-- 2. RLS Policies for Admin access

-- Drop existing admin policies if any
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payment_transactions;

-- Users table - Admin policies
CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

CREATE POLICY "Admins can update user roles"
    ON public.users FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

CREATE POLICY "Admins can delete users"
    ON public.users FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
        AND id != auth.uid() -- Admin cannot delete themselves
    );

-- Payment transactions - Admin policies
CREATE POLICY "Admins can view all payments"
    ON public.payment_transactions FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() -- Users can see their own payments
        OR EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

CREATE POLICY "Admins can manage payments"
    ON public.payment_transactions FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- 3. Business cards - Admin can view all for statistics
DROP POLICY IF EXISTS "Admins can view all cards" ON public.business_cards;
CREATE POLICY "Admins can view all cards"
    ON public.business_cards FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() -- Owner
        OR is_public = true -- Public cards
        OR EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- 4. Organizations - Admin can view all for statistics
DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;
CREATE POLICY "Admins can view all organizations"
    ON public.organizations FOR SELECT
    TO authenticated
    USING (
        is_public = true
        OR owner_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.organization_members om 
            WHERE om.organization_id = id AND om.user_id = auth.uid() AND om.status = 'APPROVED'
        )
        OR EXISTS (
            SELECT 1 FROM public.users u 
            WHERE u.id = auth.uid() AND u.role = 'APP_ADMIN'
        )
    );

-- 5. Create index for payment status queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);

-- Verify policies
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('users', 'payment_transactions', 'business_cards', 'organizations')
ORDER BY tablename, policyname;
