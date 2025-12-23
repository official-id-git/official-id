# Official ID - Project Documentation
## Checkpoint: Phase 4 Complete (21 Desember 2025)

---

## 🚀 Quick Start untuk Percakapan Baru

**Copy-paste ini ke Claude:**

```
Lanjutkan project Official ID. Saya sudah selesai Phase 4 (Organizations + Members). 
Upload file: Fase4_update06.zip dan OFFICIAL-ID-PROJECT-DOCS.md
Lanjut ke Phase 5 (Admin Panel & Payment Verification).
```

---

## 📋 Project Overview

**Official ID** adalah platform kartu bisnis digital dengan fitur:
- Kartu bisnis digital dengan QR code
- Multiple templates (Professional, Modern, Minimal)
- Sistem organisasi dengan membership
- Role-based access (FREE_USER, PAID_USER, APP_ADMIN)

### Tech Stack
- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Image:** Cloudinary
- **UI:** Mobile-first PWA design

---

## ✅ Phases Completed

### Phase 1: Architecture & Setup ✅
- Project structure dengan Next.js 15 App Router
- Supabase configuration
- TypeScript types
- Tailwind CSS setup

### Phase 2: Authentication ✅
- Google SSO via Supabase Auth
- Email/Password authentication
- Session management dengan middleware
- User profile dengan role system
- Login/Register pages dengan split layout design

### Phase 3: Business Cards ✅
- CRUD kartu bisnis
- 3 templates: Professional, Modern, Minimal
- QR code generation
- Cloudinary image upload
- Public card view (/c/[id])
- Card download sebagai image
- FREE_USER limit: 1 kartu

### Phase 4: Organizations ✅
- CRUD organisasi (PAID_USER only)
- Public/Private organization toggle
- Member management dengan approval workflow
- Join/Leave organization
- Email invitation system untuk private orgs
- Member list dengan detail modal
- RLS policies untuk data security

---

## 🗄️ Database Schema

### Tables
```
users
├── id (uuid, PK)
├── email (text, unique)
├── full_name (text)
├── avatar_url (text)
├── role (enum: FREE_USER, PAID_USER, APP_ADMIN)
├── created_at, updated_at

business_cards
├── id (uuid, PK)
├── user_id (FK → users)
├── full_name, job_title, company, email, phone
├── website, address, bio
├── profile_photo_url, template
├── social_links (jsonb)
├── view_count
├── created_at, updated_at

organizations
├── id (uuid, PK)
├── owner_id (FK → users)
├── name, description, logo_url, category
├── is_public (boolean)
├── require_approval (boolean)
├── created_at, updated_at

organization_members
├── id (uuid, PK)
├── organization_id (FK → organizations)
├── user_id (FK → users)
├── status (enum: PENDING, APPROVED, REJECTED)
├── is_admin (boolean)
├── approved_by (FK → users)
├── joined_at, approved_at

organization_invitations
├── id (uuid, PK)
├── organization_id (FK → organizations)
├── email (text)
├── invited_by (FK → users)
├── status (enum: PENDING, ACCEPTED, EXPIRED, CANCELLED)
├── token, expires_at, accepted_at, created_at
```

### RLS Policies Active
- `users_select_all` - Authenticated users can read all users
- `users_insert_own` - Users can insert own profile
- `users_update_own` - Users can update own profile
- `organization_members_select_all` - Authenticated users can read members
- `organization_members_insert` - Users can join organizations
- `organization_members_update` - Org owners can update members
- `organization_members_delete` - Users can leave, owners can remove

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── admin/page.tsx (placeholder)
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   ├── cards/route.ts
│   │   ├── organizations/route.ts
│   │   └── payments/route.ts
│   ├── c/[id]/page.tsx (public card view)
│   ├── dashboard/
│   │   ├── page.tsx (main dashboard)
│   │   ├── cards/
│   │   │   ├── page.tsx (list)
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx (detail)
│   │   │       └── edit/page.tsx
│   │   ├── organizations/
│   │   │   ├── page.tsx (list with tabs)
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx (detail + members)
│   │   │       └── edit/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── settings/page.tsx
│   │   └── upgrade/page.tsx
│   ├── diagnostic/page.tsx
│   ├── organizations/page.tsx (public directory)
│   ├── layout.tsx
│   ├── page.tsx (landing)
│   └── globals.css
├── components/
│   ├── auth/
│   ├── cards/
│   │   ├── CardForm.tsx
│   │   ├── CardList.tsx
│   │   └── CardPreview.tsx
│   ├── layout/
│   │   └── BottomNavigation.tsx
│   ├── organizations/
│   │   ├── MemberList.tsx
│   │   ├── OrgForm.tsx
│   │   └── OrgList.tsx
│   └── ui/
│       ├── FluidBackground.tsx
│       └── ImageUpload.tsx
├── hooks/
│   ├── useAuth.tsx
│   ├── useCards.ts
│   └── useOrganizations.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── middleware.ts
│   │   └── server.ts
│   ├── card-download.ts
│   ├── cloudinary.ts
│   ├── qrcode.ts
│   └── utils.ts
├── types/
│   ├── database.types.ts
│   └── index.ts
└── middleware.ts
```

---

## 🔧 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=xxx
```

---

## 🎯 Phase 5: Admin Panel & Payment Verification

### Fitur yang akan dibuat:

#### 5.1 Admin Dashboard
- [ ] Route: `/admin` atau `/dashboard/admin`
- [ ] Statistik: total users, total cards, total orgs, revenue
- [ ] Charts: user growth, card creation trend
- [ ] Recent activities feed

#### 5.2 User Management
- [ ] List semua users dengan search & filter
- [ ] View user detail
- [ ] Change user role (FREE → PAID, PAID → ADMIN)
- [ ] Deactivate/Delete user
- [ ] View user's cards & organizations

#### 5.3 Payment Verification
- [ ] Table: `payments` atau `transactions`
- [ ] Upload bukti pembayaran (user side)
- [ ] Admin review queue
- [ ] Approve/Reject dengan catatan
- [ ] Auto-upgrade role setelah approve
- [ ] Payment history

#### 5.4 Organization Management (Admin)
- [ ] List semua organizations
- [ ] Force delete organization
- [ ] View organization members

### Database additions needed:
```sql
-- payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2),
  payment_method TEXT,
  proof_url TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🐛 Known Issues / Technical Debt

1. **Image LCP Warning** - Logo organisasi perlu `priority` prop (minor)
2. **Avatar sync** - User tanpa Google login tidak punya avatar
3. **Invitation expiry** - Belum ada cron job untuk expired invitations

---

## 📱 UI/UX Notes

- Mobile-first design dengan bottom navigation
- Color scheme: Blue gradient headers, white cards
- Role badges: FREE_USER (gray), PAID_USER (blue), APP_ADMIN (yellow)
- Organization badges: Public (green), Private (purple)

---

## 🔐 Role Permissions

| Feature | FREE_USER | PAID_USER | APP_ADMIN |
|---------|-----------|-----------|-----------|
| Create card | 1 max | Unlimited | Unlimited |
| View public orgs | ✅ | ✅ | ✅ |
| Join public orgs | ✅ | ✅ | ✅ |
| Create organization | ❌ | ✅ | ✅ |
| Invite members | ❌ | ✅ (own org) | ✅ |
| Admin panel | ❌ | ❌ | ✅ |
| Verify payments | ❌ | ❌ | ✅ |

---

## 📞 Contacts & Links

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Cloudinary:** https://cloudinary.com/console
- **Local Dev:** http://localhost:3000

---

*Last updated: 21 Desember 2025*
*Next phase: Admin Panel & Payment Verification*
