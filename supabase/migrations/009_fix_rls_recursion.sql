-- =====================================================
-- FIX: Infinite Recursion on Users Table RLS
-- Run this in Supabase SQL Editor
-- =====================================================

-- STEP 1: Drop ALL existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "users_update_policy" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;
DROP POLICY IF EXISTS "users_delete_policy" ON public.users;

-- STEP 2: Create simple non-recursive policies
-- Users can view their own profile
CREATE POLICY "users_select_own"
    ON public.users FOR SELECT
    TO authenticated
    USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "users_update_own"
    ON public.users FOR UPDATE
    TO authenticated
    USING (id = auth.uid());

-- Users can insert their own profile (for new signups)
CREATE POLICY "users_insert_own"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- STEP 3: Create a security definer function for admin checks
-- This avoids infinite recursion by bypassing RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'APP_ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- STEP 4: Admin policies using the security definer function
-- Admin can view all users
CREATE POLICY "admin_select_all_users"
    ON public.users FOR SELECT
    TO authenticated
    USING (
        id = auth.uid() -- Own profile
        OR public.is_admin() -- Admin access
    );

-- Admin can update any user (for role changes)
CREATE POLICY "admin_update_users"
    ON public.users FOR UPDATE
    TO authenticated
    USING (
        id = auth.uid() -- Own profile
        OR public.is_admin() -- Admin access
    );

-- Admin can delete users (except themselves)
CREATE POLICY "admin_delete_users"
    ON public.users FOR DELETE
    TO authenticated
    USING (
        public.is_admin() AND id != auth.uid()
    );

-- STEP 5: Fix other tables that might have similar issues

-- Drop and recreate business_cards policies
DROP POLICY IF EXISTS "Admins can view all cards" ON public.business_cards;
DROP POLICY IF EXISTS "business_cards_select_all_authenticated" ON public.business_cards;

CREATE POLICY "business_cards_select_policy"
    ON public.business_cards FOR SELECT
    TO authenticated
    USING (true); -- All authenticated users can view cards (cards are meant to be shared)

-- Drop and recreate organizations policies  
DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations;

-- Organizations remain with existing policies (no admin override needed)

-- STEP 6: Fix payment_transactions policies
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can view own payments" ON public.payment_transactions;
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payment_transactions;

-- Users can view their own payments, admins can view all
CREATE POLICY "payment_select_policy"
    ON public.payment_transactions FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() -- Own payments
        OR public.is_admin() -- Admin access
    );

-- Users can insert their own payments
CREATE POLICY "payment_insert_policy"
    ON public.payment_transactions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Only admins can update payments (for approval/rejection)
CREATE POLICY "payment_update_policy"
    ON public.payment_transactions FOR UPDATE
    TO authenticated
    USING (public.is_admin());

-- Verify the function exists
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'is_admin';

-- Verify policies
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('users', 'payment_transactions', 'business_cards')
ORDER BY tablename, policyname;
