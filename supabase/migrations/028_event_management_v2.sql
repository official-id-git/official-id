-- Migration: Event Management V2 (Payment proofs, Tickets, RSVPs)

-- 1. Create event_payment_proofs table
CREATE TABLE IF NOT EXISTS public.event_payment_proofs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create event_tickets table
CREATE TABLE IF NOT EXISTS public.event_tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  ticket_number text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Create event_rsvps table
CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_id uuid NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('Hadir Tepat Waktu', 'Hadir Terlambat', 'Tidak Hadir')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add updated_at trigger for event_rsvps
CREATE TRIGGER update_event_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.event_payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Helper function to get organization_id from registration_id
CREATE OR REPLACE FUNCTION get_org_id_from_registration(reg_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT e.organization_id
  FROM event_registrations er
  JOIN events e ON er.event_id = e.id
  WHERE er.id = reg_id;
$$;

-- RLS Policies for event_payment_proofs
CREATE POLICY "Circle admins can manage payment proofs"
ON public.event_payment_proofs
FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM organization_members 
  WHERE organization_id = get_org_id_from_registration(registration_id) AND is_admin = true
  UNION
  SELECT owner_id FROM organizations WHERE id = get_org_id_from_registration(registration_id)
));

CREATE POLICY "Public can insert payment proofs"
ON public.event_payment_proofs
FOR INSERT
WITH CHECK (true); -- Allowed during public registration

CREATE POLICY "App admins can manage all payment proofs"
ON public.event_payment_proofs
FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'APP_ADMIN'));

-- RLS Policies for event_tickets
CREATE POLICY "Circle admins can manage tickets"
ON public.event_tickets
FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM organization_members 
  WHERE organization_id = get_org_id_from_registration(registration_id) AND is_admin = true
  UNION
  SELECT owner_id FROM organizations WHERE id = get_org_id_from_registration(registration_id)
));

CREATE POLICY "Users can view own tickets"
ON public.event_tickets
FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM event_registrations WHERE id = registration_id
));

CREATE POLICY "App admins can manage all tickets"
ON public.event_tickets
FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'APP_ADMIN'));

-- RLS Policies for event_rsvps
CREATE POLICY "Circle admins can manage RSVPs"
ON public.event_rsvps
FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM organization_members 
  WHERE organization_id = get_org_id_from_registration(registration_id) AND is_admin = true
  UNION
  SELECT owner_id FROM organizations WHERE id = get_org_id_from_registration(registration_id)
));

CREATE POLICY "Users can manage own RSVPs"
ON public.event_rsvps
FOR ALL
USING (auth.uid() IN (
  SELECT user_id FROM event_registrations WHERE id = registration_id
));

CREATE POLICY "App admins can manage all RSVPs"
ON public.event_rsvps
FOR ALL
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'APP_ADMIN'));
