# Manual Migration Guide

## Cara Menjalankan Migration Username Circle

Karena Supabase CLI belum terkonfigurasi / Docker tidak berjalan, jalankan migration secara **manual lewat Supabase Dashboard**.

---

## Langkah-langkah:

### 1. Buka Supabase Dashboard
- Login ke https://supabase.com/dashboard
- Pilih project Anda
- Klik **SQL Editor** di sidebar kiri

### 2. Copy SQL Migration
Buka file migration dan copy seluruh isinya:
[migration 014_add_organization_username.sql](file:///Users/kabayangroup/official-id/supabase/migrations/014_add_organization_username.sql)

Atau copy dari sini:

```sql
-- Add username column to organizations
ALTER TABLE public.organizations ADD COLUMN username TEXT;

-- Create unique constraint on username
ALTER TABLE public.organizations ADD CONSTRAINT organizations_username_key UNIQUE (username);

-- Add index for faster username lookups
CREATE INDEX idx_organizations_username ON public.organizations(username);

-- Function to generate random 7-character username
CREATE OR REPLACE FUNCTION generate_random_username()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..7 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing organizations with random usernames
DO $$
DECLARE
    org RECORD;
    new_username TEXT;
    is_unique BOOLEAN;
BEGIN
    FOR org IN SELECT id FROM public.organizations WHERE username IS NULL LOOP
        is_unique := FALSE;
        WHILE NOT is_unique LOOP
            new_username := generate_random_username();
            -- Check if username already exists
            IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE username = new_username) THEN
                is_unique := TRUE;
            END IF;
        END LOOP;
        
        UPDATE public.organizations 
        SET username = new_username 
        WHERE id = org.id;
    END LOOP;
END $$;

-- Make username NOT NULL after backfill
ALTER TABLE public.organizations ALTER COLUMN username SET NOT NULL;

-- Comments
COMMENT ON COLUMN public.organizations.username IS 'Unique 7-character username for public sharing URLs (e.g., official.id/o/username)';
```

### 3. Jalankan di SQL Editor
- Paste SQL di atas ke SQL Editor
- Klik **Run** atau tekan `Ctrl+Enter`
- Tunggu sampai selesai (biasanya beberapa detik)

### 4. Verifikasi
Jalankan query ini untuk cek apakah berhasil:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name = 'username';
```

Harusnya return:
```
column_name | data_type | is_nullable
username    | text      | NO
```

Dan cek apakah organizations sudah punya username:
```sql
SELECT id, name, username FROM organizations LIMIT 5;
```

### 5. Update TypeScript Types
Setelah migration berhasil, regenerate types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

Ganti `YOUR_PROJECT_ID` dengan project ID Supabase Anda (lihat di Settings > General).

---

## Troubleshooting

### Error: "column username already exists"
Migration sudah pernah dijalankan. Skip ke step verifikasi.

### Error: "constraint already exists"
Hapus constraint lama dulu:
```sql
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_username_key;
```
Lalu jalankan ulang migration.

### Username NULL untuk organization baru
Pastikan form creation sudah include username field (sudah dihandle di kode).

---

## Alternatif: Setup Supabase CLI (Opsional)

Jika ingin gunakan CLI kedepannya:

1. **Start Docker Desktop**
2. **Link project:**
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_ID
   ```
3. **Push migration:**
   ```bash
   npx supabase db push
   ```
