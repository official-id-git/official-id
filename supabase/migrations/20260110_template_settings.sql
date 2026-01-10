-- Template Access Control System
-- Run this script in Supabase SQL Editor

-- Step 1: Create template_settings table
CREATE TABLE IF NOT EXISTS template_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'free' CHECK (access_type IN ('free', 'pro', 'pin')),
  pin_code TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable RLS
ALTER TABLE template_settings ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies
-- Policy: Anyone can read template settings (but pin_code is hidden via API)
CREATE POLICY "Anyone can view template settings"
  ON template_settings FOR SELECT
  USING (true);

-- Policy: Only APP_ADMIN can insert/update/delete
CREATE POLICY "Admins can manage template settings"
  ON template_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'APP_ADMIN'
    )
  );

-- Step 4: Create updated_at trigger
CREATE OR REPLACE FUNCTION update_template_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_settings_updated_at
  BEFORE UPDATE ON template_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_template_settings_updated_at();

-- Step 5: Seed initial data for existing templates
INSERT INTO template_settings (template_id, template_name, access_type, display_order) VALUES
  ('professional', 'Professional', 'free', 1),
  ('modern', 'Modern', 'free', 2),
  ('modern_dark', 'Modern Dark', 'free', 3),
  ('creative', 'Creative', 'free', 4),
  ('minimal_white', 'Clean White', 'free', 5),
  ('elegant', 'Elegant', 'free', 6),
  ('corporate', 'Corporate', 'free', 7),
  ('tech', 'Tech', 'free', 8),
  ('artistic', 'Artistic', 'free', 9),
  ('luxury', 'Luxury', 'pro', 10),
  ('vibrant', 'Vibrant', 'pro', 11),
  ('mmb8', 'MM Batch 8', 'pin', 12),
  ('kabayan', 'Kabayan Group', 'pin', 13),
  ('mickey', 'Mickey', 'pin', 14),
  ('bettyboop', 'Betty Boop', 'pin', 15),
  ('felix', 'Felix The Cat', 'pin', 16)
ON CONFLICT (template_id) DO NOTHING;

-- Verification: Check if table was created successfully
SELECT * FROM template_settings ORDER BY display_order;
