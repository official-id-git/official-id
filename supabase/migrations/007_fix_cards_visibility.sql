-- =====================================================
-- MIGRATION: Allow Org Members to View Business Cards
-- Run this in Supabase SQL Editor
-- =====================================================

-- Drop ALL existing SELECT policies on business_cards
DROP POLICY IF EXISTS "business_cards_select_org_members" ON public.business_cards;
DROP POLICY IF EXISTS "Org members can view member cards" ON public.business_cards;
DROP POLICY IF EXISTS "Users can view own cards" ON public.business_cards;
DROP POLICY IF EXISTS "Anyone can view public cards" ON public.business_cards;
DROP POLICY IF EXISTS "Members can view organization cards" ON public.business_cards;
DROP POLICY IF EXISTS "business_cards_select_all_authenticated" ON public.business_cards;

-- Create simple SELECT policy - allow all authenticated users to view cards
-- This is safe because business cards are meant to be shared (public view exists at /c/[id])
CREATE POLICY "business_cards_select_all_authenticated"
    ON public.business_cards FOR SELECT
    TO authenticated
    USING (true);

-- Recreate INSERT policy
DROP POLICY IF EXISTS "Users can create own cards" ON public.business_cards;
DROP POLICY IF EXISTS "business_cards_insert_own" ON public.business_cards;
CREATE POLICY "business_cards_insert_own"
    ON public.business_cards FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Recreate UPDATE policy
DROP POLICY IF EXISTS "Users can update own cards" ON public.business_cards;
DROP POLICY IF EXISTS "business_cards_update_own" ON public.business_cards;
CREATE POLICY "business_cards_update_own"
    ON public.business_cards FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Recreate DELETE policy
DROP POLICY IF EXISTS "Users can delete own cards" ON public.business_cards;
DROP POLICY IF EXISTS "business_cards_delete_own" ON public.business_cards;
CREATE POLICY "business_cards_delete_own"
    ON public.business_cards FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'business_cards';
