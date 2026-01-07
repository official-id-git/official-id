# Quick Fix Guide

## Issue Fixed
Error 406 "Not Acceptable" when accessing business cards from public circle page.

## Root Cause
- Selecting all columns (`SELECT *`) including `qr_code_url`
- `qr_code_url` contains large base64 encoded image (>100KB)
- Supabase REST API returns 406 for responses that are too large

## Solution
Changed query in `/src/app/c/[id]/PublicCardClient.tsx` from:
```typescript
.select('*')
```

To:
```typescript
.select('id, user_id, full_name, job_title, company, email, phone, website, profile_photo_url, social_links, is_public, visible_fields, scan_count, created_at, updated_at, template, address, color_theme, username')
```

## Re-enable RLS
Run this in Supabase SQL Editor:
```sql
-- Re-enable RLS after testing
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'business_cards';
```

## Result
✅ Business cards now load successfully without 406 error
✅ QR code display removed from public view (wasn't showing anyway)
✅ Response size significantly reduced
