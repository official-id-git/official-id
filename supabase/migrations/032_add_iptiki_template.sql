-- Add IPTIKI template to template_settings with PIN access
INSERT INTO template_settings (template_id, template_name, access_type, pin_code, display_order) VALUES
  ('iptiki', 'IPTIKI', 'pin', 'IPTIKI', 17)
ON CONFLICT (template_id) DO NOTHING;
