-- Fix RLS Policy untuk organization_members
-- Jalankan di Supabase SQL Editor

-- Create helper function to check admin status (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = check_user_id
    AND role = 'ADMIN'
    AND status = 'APPROVED'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check membership
CREATE OR REPLACE FUNCTION is_org_member(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id
    AND user_id = check_user_id
    AND status = 'APPROVED'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Admins can insert members" ON organization_members;
DROP POLICY IF EXISTS "Admins can update members" ON organization_members;
DROP POLICY IF EXISTS "Admins can delete members" ON organization_members;
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage members" ON organization_members;
DROP POLICY IF EXISTS "organization_members_select" ON organization_members;
DROP POLICY IF EXISTS "organization_members_insert" ON organization_members;
DROP POLICY IF EXISTS "organization_members_update" ON organization_members;
DROP POLICY IF EXISTS "organization_members_delete" ON organization_members;

-- SELECT: Users can view members
CREATE POLICY "organization_members_select" ON organization_members
FOR SELECT USING (
  is_org_member(organization_id, auth.uid())
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_id 
    AND is_public = true
  )
);

-- INSERT: Admins can add members OR users can join
CREATE POLICY "organization_members_insert" ON organization_members
FOR INSERT WITH CHECK (
  is_org_admin(organization_id, auth.uid())
  OR user_id = auth.uid()
);

-- UPDATE: Admins can update OR users update their own
CREATE POLICY "organization_members_update" ON organization_members
FOR UPDATE USING (
  is_org_admin(organization_id, auth.uid())
  OR user_id = auth.uid()
);

-- DELETE: Admins can delete OR users can leave
CREATE POLICY "organization_members_delete" ON organization_members
FOR DELETE USING (
  is_org_admin(organization_id, auth.uid())
  OR user_id = auth.uid()
);

-- Fix organization_invitations policies
DROP POLICY IF EXISTS "organization_invitations_select" ON organization_invitations;
DROP POLICY IF EXISTS "organization_invitations_insert" ON organization_invitations;
DROP POLICY IF EXISTS "organization_invitations_update" ON organization_invitations;
DROP POLICY IF EXISTS "organization_invitations_delete" ON organization_invitations;

CREATE POLICY "organization_invitations_select" ON organization_invitations
FOR SELECT USING (
  is_org_admin(organization_id, auth.uid())
  OR invited_by = auth.uid()
);

CREATE POLICY "organization_invitations_insert" ON organization_invitations
FOR INSERT WITH CHECK (
  is_org_admin(organization_id, auth.uid())
);

CREATE POLICY "organization_invitations_update" ON organization_invitations
FOR UPDATE USING (
  is_org_admin(organization_id, auth.uid())
);

CREATE POLICY "organization_invitations_delete" ON organization_invitations
FOR DELETE USING (
  is_org_admin(organization_id, auth.uid())
);

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_org_admin TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_member TO authenticated;