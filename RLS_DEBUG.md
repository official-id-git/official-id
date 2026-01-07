# RLS Debugging Guide for Business Cards

## Current Issue
Getting 406 error when accessing business cards from public circle page.

## Debugging Steps

### 1. Check RLS Status
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'business_cards';
```

Expected: `rowsecurity = true`

### 2. Check Current Policies
```sql
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'business_cards';
```

Should show policy allowing `is_public = true` for public role.

### 3. Test Anonymous Access
```sql
SET ROLE anon;
SELECT * FROM business_cards WHERE is_public = true LIMIT 1;
RESET ROLE;
```

If this fails, RLS is blocking anonymous access.

### 4. Quick Test - Disable RLS
```sql
-- TEMPORARILY disable RLS for testing
ALTER TABLE business_cards DISABLE ROW LEVEL SECURITY;
```

Refresh page and test. If it works, issue is with policy.

**Don't forget to re-enable:**
```sql
ALTER TABLE business_cards ENABLE ROW LEVEL SECURITY;
```

## Expected Policy

Should have one clear policy:
```sql
CREATE POLICY "Enable read access for business cards" ON public.business_cards
FOR SELECT
USING (is_public = true OR user_id = auth.uid());
```

## Next Steps

Based on test results, we'll either:
- Fix the policy configuration
- Check for conflicting policies
- Investigate other RLS issues
