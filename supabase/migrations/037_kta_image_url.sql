-- Add gdrive_image_url to kta_applications
ALTER TABLE public.kta_applications ADD COLUMN IF NOT EXISTS gdrive_image_url TEXT;
