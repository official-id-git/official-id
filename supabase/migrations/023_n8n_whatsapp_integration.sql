-- =====================================================
-- n8n WhatsApp Integration - RPC Function
-- Allows n8n to query business cards by username
-- =====================================================

-- Function to get card URL by username (case-insensitive)
-- This is called from n8n via Supabase REST API: POST /rest/v1/rpc/get_card_by_username
CREATE OR REPLACE FUNCTION get_card_by_username(u text)
RETURNS TABLE (username text, card_url text, full_name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    bc.username,
    'https://official.id/c/' || bc.username AS card_url,
    bc.full_name
  FROM business_cards bc
  WHERE lower(bc.username) = lower(u)
    AND bc.is_public = true
  LIMIT 1;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_card_by_username(text) TO anon;
GRANT EXECUTE ON FUNCTION get_card_by_username(text) TO authenticated;

-- Comment for documentation
COMMENT ON FUNCTION get_card_by_username(text) IS 
'Returns card URL and full name for a given username. Used by n8n WhatsApp integration to lookup business cards via WAHA webhook.';
