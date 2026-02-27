-- =====================================================
-- Update get_card_by_username to return full VCard details
-- =====================================================

DROP FUNCTION IF EXISTS get_card_by_username(text);

CREATE OR REPLACE FUNCTION get_card_by_username(u text)
RETURNS TABLE (
  username text,
  card_url text,
  full_name text,
  job_title text,
  company text,
  phone text,
  email text,
  website text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bc.username,
    'https://official.id/c/' || bc.username AS card_url,
    bc.full_name,
    bc.job_title,
    bc.company,
    bc.phone,
    bc.email,
    bc.website
  FROM business_cards bc
  WHERE lower(bc.username) = lower(u)
    AND bc.is_public = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_card_by_username(text) TO anon;
GRANT EXECUTE ON FUNCTION get_card_by_username(text) TO authenticated;

COMMENT ON FUNCTION get_card_by_username(text) IS 
'Returns full VCard details for a given username. Used by n8n WhatsApp integration.';
