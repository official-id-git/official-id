-- Migration: Add job_title and city to event_registrations

-- 1. Add job_title and city columns to event_registrations table
ALTER TABLE public.event_registrations
ADD COLUMN IF NOT EXISTS job_title TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- 2. Add comments
COMMENT ON COLUMN public.event_registrations.job_title IS 'Participant job title / jabatan';
COMMENT ON COLUMN public.event_registrations.city IS 'Participant city / kota';
