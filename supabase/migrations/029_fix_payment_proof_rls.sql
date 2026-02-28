-- Migration: Fix Event Payment Proofs RLS
-- Allows circle admins and the registrant themselves to view the payment proof

-- Safely drop existing policies if they exist to avoid errors during re-runs
DROP POLICY IF EXISTS "Circle admins can manage payment proofs" ON public.event_payment_proofs;
DROP POLICY IF EXISTS "Public can insert payment proofs" ON public.event_payment_proofs;
DROP POLICY IF EXISTS "App admins can manage all payment proofs" ON public.event_payment_proofs;
DROP POLICY IF EXISTS "Users can view own payment proofs" ON public.event_payment_proofs;

-- Helper function to check if a user is an admin of the organization linked to a registration
CREATE OR REPLACE FUNCTION is_circle_admin_for_registration(reg_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM event_registrations er
    JOIN events e ON er.event_id = e.id
    LEFT JOIN organization_members om ON e.organization_id = om.organization_id AND om.user_id = check_user_id AND om.is_admin = true AND om.status = 'APPROVED'
    LEFT JOIN organizations org ON e.organization_id = org.id AND org.owner_id = check_user_id
    WHERE er.id = reg_id AND (om.organization_id IS NOT NULL OR org.id IS NOT NULL)
  );
$$;

-- RLS Policies for event_payment_proofs

-- 1. Circle Admins/Owners can SELECT, DELETE
CREATE POLICY "Circle admins can view/manage payment proofs"
ON public.event_payment_proofs
FOR ALL
USING (is_circle_admin_for_registration(registration_id, auth.uid()));

-- 2. Anyone can INSERT during registration
CREATE POLICY "Public can insert payment proofs"
ON public.event_payment_proofs
FOR INSERT
WITH CHECK (true);

-- 3. Users can view their own payment proof via email match or if they are the registrant
CREATE POLICY "Users can view own payment proofs"
ON public.event_payment_proofs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_registrations er
    WHERE er.id = registration_id
    AND (er.user_id = auth.uid() OR er.email = (SELECT email FROM users WHERE id = auth.uid()))
  )
);

-- 4. App admins can do anything
CREATE POLICY "App admins can manage all payment proofs"
ON public.event_payment_proofs
FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'APP_ADMIN'));
