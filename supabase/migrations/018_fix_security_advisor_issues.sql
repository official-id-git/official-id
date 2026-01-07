-- 1. FIX: Enable RLS on business_cards table (Critical Security Issue)
ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

-- 2. FIX: Restrict email_logs insert policy (Security Warning)
-- Previously was WITH CHECK (true), now restricted to own user_id
DROP POLICY IF EXISTS "email_logs_insert" ON public.email_logs;

CREATE POLICY "email_logs_insert"
    ON public.email_logs FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- 3. FIX: Set search_path to public for functions (Security Best Practice)
-- Prevents malicious code from executing with higher privileges if search_path is manipulated

-- Utility functions
ALTER FUNCTION public.handle_seo_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_random_username() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Organization functions
ALTER FUNCTION public.is_org_member(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.check_organization_creation_permission() SET search_path = public;
ALTER FUNCTION public.auto_approve_organization_owner() SET search_path = public;
ALTER FUNCTION public.check_pending_invitations() SET search_path = public;

-- Business Card functions
ALTER FUNCTION public.check_business_card_limit() SET search_path = public;
ALTER FUNCTION public.increment_scan_count() SET search_path = public;

-- Payment functions
ALTER FUNCTION public.handle_payment_approval() SET search_path = public;

-- Admin functions
ALTER FUNCTION public.is_admin() SET search_path = public;

-- Functions with unknown signatures (assuming unique names)
ALTER FUNCTION public.delete_old_promotions() SET search_path = public;
-- Attempting to set search_path for invite_user_to_circle. 
-- If this fails due to ambiguity, arguments must be specified.
ALTER FUNCTION public.invite_user_to_circle(uuid, text, text) SET search_path = public; 
-- Note: Assuming signature (uuid, text, text) based on typical invite flows (org_id, email, role).
-- If this migration fails, we will need to verify the exact signature.
