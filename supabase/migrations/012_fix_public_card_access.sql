-- Fix RLS untuk akses kartu publik tanpa login
-- Jalankan di Supabase SQL Editor

-- Drop existing policies on business_cards
DROP POLICY IF EXISTS "Users can view their own cards" ON business_cards;
DROP POLICY IF EXISTS "Users can view public cards" ON business_cards;
DROP POLICY IF EXISTS "business_cards_select" ON business_cards;
DROP POLICY IF EXISTS "business_cards_insert" ON business_cards;
DROP POLICY IF EXISTS "business_cards_update" ON business_cards;
DROP POLICY IF EXISTS "business_cards_delete" ON business_cards;
DROP POLICY IF EXISTS "cards_select" ON business_cards;
DROP POLICY IF EXISTS "cards_insert" ON business_cards;
DROP POLICY IF EXISTS "cards_update" ON business_cards;
DROP POLICY IF EXISTS "cards_delete" ON business_cards;
DROP POLICY IF EXISTS "Public cards are viewable by everyone" ON business_cards;
DROP POLICY IF EXISTS "Anyone can view public cards" ON business_cards;

-- SELECT: Anyone can view public cards, owners can view all their cards
CREATE POLICY "cards_select" ON business_cards
FOR SELECT USING (
  is_public = true 
  OR user_id = auth.uid()
);

-- INSERT: Only authenticated users can create cards
CREATE POLICY "cards_insert" ON business_cards
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id = auth.uid()
);

-- UPDATE: Only card owners can update
CREATE POLICY "cards_update" ON business_cards
FOR UPDATE USING (
  user_id = auth.uid()
);

-- DELETE: Only card owners can delete
CREATE POLICY "cards_delete" ON business_cards
FOR DELETE USING (
  user_id = auth.uid()
);

-- Pastikan RLS enabled
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
