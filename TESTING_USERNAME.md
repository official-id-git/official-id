# Testing Guide - Username Edit Feature

## Test Checklist

### 1. Database Validation (Run in Supabase SQL Editor)

Check if constraints are active:
```sql
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE conrelid = 'public.organizations'::regclass
AND conname LIKE '%username%';
```

Expected results:
- `organizations_username_key` - UNIQUE
- `organizations_username_length_check` - LENGTH 3-20
- `organizations_username_format_check` - ALPHANUMERIC

### 2. Test Valid Usernames

Try updating a circle with valid usernames:
```sql
-- Should succeed
UPDATE organizations 
SET username = 'kabayangroup' 
WHERE id = '39c197b1-299b-45d1-855b-8627a7f814be';

-- Should succeed
UPDATE organizations 
SET username = 'abc' 
WHERE id = '39c197b1-299b-45d1-855b-8627a7f814be';

-- Should succeed
UPDATE organizations 
SET username = 'test123abc456xyz7890' 
WHERE id = '39c197b1-299b-45d1-855b-8627a7f814be';
```

### 3. Test Invalid Usernames (Should Fail)

```sql
-- Should fail: too short
UPDATE organizations 
SET username = 'ab' 
WHERE id = '39c197b1-299b-45d1-855b-8627a7f814be';
-- Expected error: violates check constraint "organizations_username_length_check"

-- Should fail: too long (21 chars)
UPDATE organizations 
SET username = 'abcdefghij1234567890x' 
WHERE id = '39c197b1-299b-45d1-855b-8627a7f814be';
-- Expected error: violates check constraint "organizations_username_length_check"

-- Should fail: has dash
UPDATE organizations 
SET username = 'kabayan-group' 
WHERE id = '39c197b1-299b-45d1-855b-8627a7f814be';
-- Expected error: violates check constraint "organizations_username_format_check"

-- Should fail: has uppercase
UPDATE organizations 
SET username = 'KabayanGroup' 
WHERE id = '39c197b1-299b-45d1-855b-8627a7f814be';
-- Expected error: violates check constraint "organizations_username_format_check"

-- Should fail: has space
UPDATE organizations 
SET username = 'kabayan group' 
WHERE id = '39c197b1-299b-45d1-855b-8627a7f814be';
-- Expected error: violates check constraint "organizations_username_format_check"
```

### 4. UI Testing

#### A. Create New Circle
1. Go to `/dashboard/organizations/new`
2. Fill form
3. Try entering username: `Kabayan-Group_2024!`
4. Should auto-clean to: `kabayangroup2024`
5. Verify availability check works
6. Submit

#### B. Edit Existing Circle
1. Go to `/dashboard/organizations/{id}/edit`
2. Change username to something new
3. Try invalid chars (they should be auto-removed)
4. Try duplicate username (should show error)
5. Try too short/long (should show warning)
6. Save with valid username

#### C. Public Access
1. After changing username, test public URL
2. Open `/o/{new-username}` in incognito
3. Verify page loads correctly
4. Old username URL should not work

### 5. Real-world Testing

Test with actual Circle:

**Kabayan Group** (currently: `s5btx6o`)
1. Edit to: `kabayangroup`
2. Access: `https://official.id/o/kabayangroup`
3. Share on WhatsApp
4. Verify preview shows correctly

**Expected Behavior:**
- ✅ Form auto-removes special characters
- ✅ Real-time availability check
- ✅ Character counter showing current length
- ✅ Cannot save if duplicate username
- ✅ Cannot save if length < 3 or > 20
- ✅ Database enforces constraints
- ✅ Public URL updates immediately

## Troubleshooting

### "Constraint violation" error
Run the migration SQL again - constraints might not be active.

### Username not updating
Check RLS policies allow owner/admin to update.

### Auto-clean not working
Clear browser cache and reload the edit page.
