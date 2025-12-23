# PHASE 2: Authentication Implementation

**Tanggal**: 19 Desember 2025  
**Status**: ✅ Selesai

---

## 📋 Ringkasan

PHASE 2 mengimplementasikan sistem authentication lengkap menggunakan Supabase Auth dengan fitur:

- Email/Password authentication dengan email verification
- Google SSO (OAuth)
- Route protection middleware
- Role-based access control
- Session management
- QR code scan flow dengan auto-redirect

---

## 🔐 Komponen Authentication

### 1. Supabase Client Setup

**File: `/src/lib/supabase/client.ts`**
- Browser-side Supabase client
- Digunakan di Client Components
- Auto cookie management

**File: `/src/lib/supabase/server.ts`**
- Server-side Supabase client
- Digunakan di Server Components & Route Handlers
- Admin client dengan service role key (untuk operasi admin)

**File: `/src/lib/supabase/middleware.ts`**
- Helper untuk middleware
- Auto-refresh session
- Return user object

---

## 🛡️ Middleware & Route Protection

**File: `/src/middleware.ts`**

### Protected Routes
```typescript
const protectedRoutes = [
  '/dashboard', 
  '/cards', 
  '/organizations', 
  '/contacts', 
  '/settings', 
  '/upgrade'
]
```

### Admin Routes
```typescript
const adminRoutes = ['/admin']
```

### Logic Flow

1. **Unauthenticated user → Protected route**
   - Redirect ke `/login?redirect={pathname}`

2. **Authenticated user → Auth pages**
   - Redirect ke `/dashboard`

3. **Non-admin user → Admin route**
   - Redirect ke `/dashboard`

4. **QR Code Scan Flow**
   - Simpan `scanned_card_id` di cookie
   - Redirect ke login/register
   - Setelah auth → redirect ke `/card/{id}`

---

## 🪝 Auth Hook (useAuth)

**File: `/src/hooks/useAuth.ts`**

### Context Provider

```typescript
<AuthProvider>
  {children}
</AuthProvider>
```

### Available Methods

```typescript
const {
  user,              // User object atau null
  loading,           // Boolean loading state
  signIn,            // (email, password) => Promise<void>
  signUp,            // (email, password, fullName) => Promise<void>
  signInWithGoogle,  // () => Promise<void>
  signOut,           // () => Promise<void>
  refreshUser        // () => Promise<void>
} = useAuth()
```

### User Object Structure

```typescript
{
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: 'FREE_USER' | 'PAID_USER' | 'APP_ADMIN'
  payment_verified_at: string | null
  created_at: string
  updated_at: string
}
```

---

## 📝 Authentication Flows

### 1. Email/Password Registration

**Proses:**

1. User mengisi form registrasi
2. `signUp()` dipanggil
3. Create auth user di Supabase Auth
4. Create user profile di tabel `users` dengan role `FREE_USER`
5. Kirim email verifikasi
6. User redirect ke success page
7. User klik link verifikasi di email
8. Email verified → user bisa login

**File: `/src/app/(auth)/register/page.tsx`**

**Validasi:**
- Password minimal 6 karakter
- Password harus match dengan konfirmasi
- Email harus valid format

### 2. Email/Password Login

**Proses:**

1. User mengisi form login
2. `signIn()` dipanggil
3. Supabase validate credentials
4. Fetch user profile dari database
5. Set user state di AuthContext
6. Redirect ke `/dashboard` atau redirect URL

**File: `/src/app/(auth)/login/page.tsx`**

### 3. Google SSO

**Proses:**

1. User klik tombol "Google"
2. `signInWithGoogle()` dipanggil
3. Redirect ke Google OAuth consent screen
4. User approve
5. Google redirect ke `/api/auth/callback?code={code}`
6. Exchange code untuk session
7. Check apakah user profile exists
   - **Jika belum**: Create user profile (first-time login)
   - **Jika sudah**: Skip
8. Redirect ke dashboard

**File: `/src/app/api/auth/callback/route.ts`**

**Google OAuth Setup:**
- Client ID & Secret sudah ada di `.env.local`
- Redirect URI: `https://hsflsvrypkquqjzsfcqm.supabase.co/auth/v1/callback`
- Scope: email, profile

---

## 🎯 QR Code Scan Flow

### Scenario: User belum login scan QR code

**Flow:**

1. User scan QR code → `/card/{id}`
2. Middleware detect: user not authenticated
3. Simpan `scanned_card_id` di cookie (expire 15 menit)
4. User pilih login atau register
5. Setelah auth success:
   - Check cookie `scanned_card_id`
   - Jika ada → redirect ke `/card/{id}`
   - Jika tidak → redirect ke `/dashboard`
6. Di `/card/{id}`:
   - Create `user_relationship` (client-provider)
   - Increment `scan_count` (via database trigger)
   - Show business card

---

## 🔑 Role-Based Access Control

### Roles

1. **FREE_USER**
   - Default role saat registrasi
   - Bisa create max 1 business card
   - Bisa join organizations
   - Bisa view cards dalam org

2. **PAID_USER**
   - Setelah payment approved
   - Unlimited business cards
   - Bisa create organizations
   - Semua fitur FREE_USER

3. **APP_ADMIN**
   - Full access
   - Access admin panel
   - Approve/reject payments
   - Manage users

### Enforcement

**Database Level:**
- Triggers enforce card limit
- RLS policies enforce data access

**Middleware Level:**
- Admin routes check user role
- Redirect jika bukan admin

**Application Level:**
- UI conditionally render based on role
- useAuth hook provides user role

---

## 📦 Dependencies

```json
{
  "@supabase/ssr": "^0.5.2",
  "@supabase/supabase-js": "^2.45.7",
  "next": "15.1.3",
  "react": "^19.0.0"
}
```

---

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd official-id
npm install
```

### 2. Setup Environment Variables

File `.env.local` sudah ready dengan credentials:
- Supabase URL & Keys ✅
- Google OAuth credentials ✅
- Cloudinary config ✅

### 3. Run Database Migration

1. Login ke Supabase Dashboard: https://hsflsvrypkquqjzsfcqm.supabase.co
2. Go to SQL Editor
3. Paste isi file: `supabase/migrations/001_initial_schema.sql`
4. Run migration

### 4. Configure Google OAuth di Supabase

1. Login ke Supabase Dashboard
2. Authentication → Providers
3. Enable Google
4. Paste Client ID & Secret dari `.env.local`
5. Authorized redirect URI sudah auto-configured

### 5. Run Development Server

```bash
npm run dev
```

Open: http://localhost:3000

---

## 🧪 Testing Authentication

### Test Email/Password

1. Go to `/register`
2. Fill form dengan data test
3. Submit → check email untuk verifikasi
4. Click link di email
5. Go to `/login`
6. Login dengan credentials yang sama

### Test Google SSO

1. Go to `/login`
2. Click "Google"
3. Login dengan Google account
4. Check redirect ke dashboard
5. Verify user profile created di database

### Test Route Protection

1. Logout
2. Try access `/dashboard` → redirect ke `/login`
3. Try access `/admin` (as non-admin) → redirect ke `/dashboard`

### Test QR Scan Flow

1. Logout
2. Access `/card/some-uuid` (tanpa login)
3. Should redirect ke login
4. Login/Register
5. Should redirect back ke `/card/some-uuid`

---

## 📁 File Structure

```
src/
├── lib/
│   └── supabase/
│       ├── client.ts          ✅ Browser client
│       ├── server.ts          ✅ Server client & admin client
│       └── middleware.ts      ✅ Middleware helper
├── hooks/
│   └── useAuth.ts             ✅ Auth context & hook
├── types/
│   ├── database.types.ts      ✅ Supabase generated types
│   └── index.ts               ✅ Custom types
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx       ✅ Login page
│   │   └── register/
│   │       └── page.tsx       ✅ Register page
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts   ✅ OAuth callback handler
│   └── layout.tsx             ✅ Root layout with AuthProvider
└── middleware.ts              ✅ Route protection
```

---

## ⚠️ Important Notes

### Email Verification

- Email/password registration **requires email verification**
- User tidak bisa login sebelum verify email
- Verification link expired dalam 24 jam
- Re-send verification via Supabase Auth UI (future)

### Session Management

- Session auto-refresh via middleware
- Cookie-based session storage
- Secure & httpOnly cookies
- Session persist across page reload

### Security

- Password minimum 6 characters
- Supabase Auth handles password hashing
- RLS policies protect database
- Middleware validates all protected routes
- CORS configured via Supabase

---

## 🐛 Common Issues & Solutions

### Issue: "User not found" after Google login

**Solution:** Check `users` table - profile mungkin belum created. OAuth callback handler akan auto-create jika belum ada.

### Issue: Infinite redirect loop

**Solution:** Check middleware logic - pastikan tidak ada circular redirect. Auth routes harus di-exclude dari protection.

### Issue: Session tidak persist

**Solution:** Check cookie settings di Supabase client config. Pastikan `setAll()` method implemented correctly.

### Issue: Email verification tidak dikirim

**Solution:** 
- Check Supabase Email Settings
- Verify email templates enabled
- Check spam folder

---

## 🎯 Next Steps

**PHASE 3: Business Card CRUD**
- Business card creation form
- Card listing & detail view
- QR code generation
- Card sharing functionality
- Privacy settings

---

**Status**: ✅ PHASE 2 Complete  
**Next**: PHASE 3 - Business Card Implementation